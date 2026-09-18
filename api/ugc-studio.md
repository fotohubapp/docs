# UGC Studio API Reference

::: warning Two surfaces, two hosts
UGC Studio has **two** separate paths in, and mixing them up is the single most common integration mistake:

- **Project → blueprint → render** (create a project, save a blueprint, start a render, poll the job, price a blueprint) is a real **API-key surface**, at `https://apis.fotohub.app/v1/ugc/*` (note the `/v1`), authenticated with `Authorization: Bearer fh_live_your_api_key`. This is the part covered in [§3 Video Rendering](#_3-video-rendering) below, and it's what external, API-key-based clients should build against.
- **Creative ideation and casting** — generating a brief, angles, a script, and picking/registering an actor — is still **first-party only**: `https://apis.fotohub.app/ugc/*` (no `/v1`), authenticated with a Supabase **user session JWT**, not an `fh_live_*` key. There is no API-key equivalent for these calls; they will 401 with an API key no matter how you send it. They're documented below (§1–2) because the blueprint you hand to the render endpoint is normally built from their output, but you'll need to generate that content another way (your own LLM call, or a first-party session) if you're integrating purely with an API key.

Beyond the host/prefix split, a few request/response shapes below are simplified for readability — see the inline notes where the real shape differs materially (e.g. angles/script take the full brief/angle object, not an id; rendering is project-based, not a single flat call).
:::

FOTOhub UGC Studio (`/ugc`) automates the end-to-end creation of vertical direct-response User-Generated Content (UGC) video ads for TikTok, Instagram Reels, and YouTube Shorts. 

This pipeline is designed for high-scale media buyers and performance marketing teams who need to iterate rapidly on creative angles without traditional studio overhead. It seamlessly converts an e-commerce product URL into creative briefs, marketing angles, spoken scripts, multi-scene blueprints, AI actor performances with lip-sync, and rendered video batches.

::: tip Platform Optimizations Applied Automatically
Our render engine automatically applies platform-specific rules: TikTok's crucial first 3-second hook emphasis, Instagram Reels' strict safe zones for caption placement, and YouTube Shorts' loop-friendly pacing. 
:::

Base URL: `https://apis.fotohub.app/v1/ugc` for project/blueprint/render/estimate/jobs (API key). Creative ideation and casting calls below use `https://apis.fotohub.app/ugc` (no `/v1`, session auth) instead — see the warning above.

---

## Unit Economics & Cost Structure

FOTOhub operates on **pure USD billing**. You will never be charged in synthetic credits or tokens. Costs are deducted directly from your `wallet.available_usd` balance.

| Operation | Cost (USD) | Description |
|-----------|------------|-------------|
| **Brief generation** | $0.005 | Parsing a product URL and generating a brief |
| **Creative angles (12)** | $0.015 | Expanding brief into 12 distinct marketing angles |
| **Script writing** | $0.008 | Converting an angle into a full script with visual beats |
| **Actor casting** | $0.000 | Selecting and casting AI actors (Free) |
| **Video render (30s)** | $0.180 | Rendering a complete video ($0.006 per second) |
| **Batch render (10 variants)** | $1.500 | Discounted bulk rendering for matrix testing |

::: warning Wallet Balance
If your `wallet.available_usd` falls below the estimated cost of an operation, you will receive a `402 Payment Required` error. Ensure you have auto-reload configured on your billing dashboard.
:::

---

## Architecture & GPU Pipeline

The UGC Studio pipeline runs on dedicated GPU capacity to keep throughput and generation quality consistent.

::: info Stages
- **Voice:** the spoken track, cloned or synthesised, plus the music bed and its ducking.
- **Performance:** the actor's take, and optionally a second pass so the mouth follows the mixed track rather than the model's own reading.
- **Compose:** captions, the end card, and the final MP4 encode.

Which hardware each stage lands on is ours to schedule and changes without notice; it is not part of the contract.
:::

### Pipeline Flowchart

```mermaid
flowchart TD
    A[Product URL] -->|POST /creative/brief| B(Creative Brief)
    B -->|POST /creative/angles| C(Marketing Angles)
    C -->|POST /creative/script| D(Video Script)
    D -->|POST v1/projects then PUT .../blueprint| E{Project Blueprint}
    E -->|POST v1/projects/-id-/render| F{Render Engine}
    
    G[GET /actors] -->|Pick actor_id| E
    
    F -->|Voice| H[Voice & Music]
    F -->|Performance| I[Actor Animation]
    F -->|Compose| J[Final Render]
    
    H --> J
    I --> J
    
    J -->|Webhook / SSE| K((Delivery S3/R2))
```

### End-to-End Sequence

```mermaid
sequenceDiagram
    participant C as Client
    participant API as FOTOhub API
    participant W as Webhook Handler
    
    C->>API: POST /ugc/creative/brief
    API-->>C: 200 OK (Brief Object)
    
    C->>API: POST /ugc/creative/angles (full brief object)
    API-->>C: 200 OK (Angles)
    
    C->>API: POST /ugc/creative/script (full brief + angle object)
    API-->>C: 200 OK (Script Object)
    
    Note over C,API: From here on, the API-key surface: /v1/ugc/*
    
    C->>API: POST /v1/ugc/projects (create project)
    API-->>C: 201 Created (project_id)
    
    C->>API: PUT /v1/ugc/projects/{project_id}/blueprint
    API-->>C: 200 OK
    
    C->>API: POST /v1/ugc/projects/{project_id}/render
    API-->>C: 202 Accepted (Job ID)
    
    C->>API: GET /v1/ugc/jobs/{job_id} (Polling)
    API-->>C: 200 OK (Status: Processing)
    
    API->>W: POST https://client.com/webhook (Render Complete)
    W-->>API: 200 OK
```

---

## Authentication & Headers

Requests to `https://apis.fotohub.app/v1/ugc/*` (project/blueprint/render/estimate/jobs) authenticate with your secret API key:

```bash
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json
```

::: danger Keep your API keys secure
Never expose your `fh_live_*` API keys in client-side code (like browsers or mobile apps). All API requests must be made from your secure backend servers.
:::

Requests to `https://apis.fotohub.app/ugc/*` (no `/v1` — creative ideation and casting, §1–2 below) do **not** accept this key at all. They authenticate with a Supabase user session JWT, the same way requests from fotohub.app's own UGC Studio UI do.

---

## 1. Creative Ideation

::: warning First-party session auth only
Every endpoint in this section (`/ugc/creative/*`) authenticates with a user session JWT, not an `fh_live_*` API key — see the warning at the top of this page. The `Authorization: Bearer fh_live_your_api_key` header in the examples below is left as-is to match the rest of this page's style, but in reality that value has to be a Supabase session token; an API key will 401 here.
:::

### Generate Creative Brief

Parse an online store product page (Shopify, Amazon, WooCommerce) or a generic URL into a structured creative brief. We scrape the text, extract value propositions, and define target audiences.

`POST /ugc/creative/brief`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | `string` | Yes | - | The fully qualified URL of the product page to parse. |

#### Request Example

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/ugc/creative/brief"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {
    "url": "https://example-skincare.com/products/hydra-serum"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

```typescript [TypeScript]
import fetch from 'node-fetch';

const response = await fetch('https://apis.fotohub.app/ugc/creative/brief', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer fh_live_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example-skincare.com/products/hydra-serum'
  })
});

const data = await response.json();
console.log(data);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]string{"url": "https://example-skincare.com/products/hydra-serum"}
	jsonValue, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/ugc/creative/brief", bytes.NewBuffer(jsonValue))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	fmt.Println(resp.Status)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/ugc/creative/brief   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{
    "url": "https://example-skincare.com/products/hydra-serum"
  }'
```

:::

#### Response Example

```json
{
  "brief_id": "brf_9x8c7v6b5n",
  "product_name": "Hydra Glow Vitamin C Serum",
  "category": "Beauty & Personal Care",
  "value_propositions": [
    "Brightens dull skin in 7 days",
    "Contains 15% pure L-ascorbic acid and hyaluronic acid",
    "Fragrance-free and sensitive skin safe"
  ],
  "target_audience": "Women 22-38 struggling with hyperpigmentation",
  "banned": ["Cures acne", "Permanent results"]
}
```

The brief is **not persisted with an id** — there is no `brief_id`. Carry the
whole object returned here into the next call.

---

### Generate Marketing Angles

Produce distinct direct-response angles based on proven advertising frameworks (e.g., Problem/Solution, Us vs Them, 3 Reasons Why).

`POST /ugc/creative/angles`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brief` | `object` | Yes | - | The full brief object returned by `/creative/brief` (not an id). |
| `count` | `integer` | No | `12` | Number of angles to generate. |
| `formats` | `array` | No | `[]` | Restrict to specific ad formats. Empty = any format. |
| `avoid` | `array` | No | `[]` | Angles already seen, to avoid repeating. |

#### Request Example

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/ugc/creative/angles"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {
    "brief": brief_res,  # the full object returned by /creative/brief
    "count": 12
}

response = requests.post(url, json=payload, headers=headers)
```

```typescript [TypeScript]
import fetch from 'node-fetch';

const response = await fetch('https://apis.fotohub.app/ugc/creative/angles', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer fh_live_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    brief: briefRes, // the full object returned by /creative/brief
    count: 12
  })
});
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"net/http"
)

func main() {
	payload := map[string]interface{}{"brief": briefRes, "count": 12}
	jsonValue, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/ugc/creative/angles", bytes.NewBuffer(jsonValue))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	client.Do(req)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/ugc/creative/angles   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{
    "brief": {"product": "Hydra Glow Vitamin C Serum", "audience": "Women 22-38", "benefits": ["Brightens dull skin in 7 days"]},
    "count": 12
  }'
```

:::

#### Response Example

```json
{
  "angles": {
    "angles": [
      {
        "id": "ang_1a2b3c4d",
        "format": "testimonial",
        "hook": "Stop scrolling if your skin feels dry and looks dull by 3 PM.",
        "promise": "15% L-ascorbic acid brightens skin without irritation.",
        "objection": "\"Vitamin C serums always sting.\"",
        "proof": "Fragrance-free, dermatologist-tested."
      },
      {
        "id": "ang_5e6f7g8h",
        "format": "secret_hack",
        "hook": "Dermatologists are gatekeeping this $30 vitamin C serum.",
        "promise": "Medical grade ingredients at drugstore prices."
      }
    ],
    "discarded": []
  }
}
```

There is no `angle_id`-only reference — the `id` is set on each returned angle
object, but the **script** call still needs the full `angle` object, not just
its id.

---

### Write Script & Beats

Turns a marketing angle into a timed spoken script with visual action notes.

`POST /ugc/creative/script`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brief` | `object` | Yes | - | The same brief object used for `/creative/angles`. |
| `angle` | `object` | Yes | - | One full angle object from the `/creative/angles` response (not just its id). |
| `speed` | `number` | No | `1.0` | Voice speed the blueprint will use — controls how many words fit a shot. |
| `actor` | `string` | No | `""` | Free-text description of the cast actor (e.g. "woman, late twenties, at home, speaks fast"). |

#### Request Example

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/ugc/creative/script"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {
    "brief": brief_res,
    "angle": chosen_angle,  # a full angle object from /creative/angles
    "speed": 1.0,
    "actor": "woman, mid-20s, at home, casual"
}
requests.post(url, json=payload, headers=headers)
```

```typescript [TypeScript]
import fetch from 'node-fetch';

await fetch('https://apis.fotohub.app/ugc/creative/script', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer fh_live_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    brief: briefRes,
    angle: chosenAngle, // a full angle object from /creative/angles
    speed: 1.0,
    actor: 'woman, mid-20s, at home, casual'
  })
});
```

```go [Go]
// Standard HTTP POST request implementation in Go...
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/ugc/creative/script   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{
    "brief": {"product": "Hydra Glow Vitamin C Serum"},
    "angle": {"id": "ang_1a2b3c4d", "format": "testimonial", "hook": "Stop scrolling...", "promise": "Brightens skin"},
    "speed": 1.0
  }'
```

:::

#### Response Example

```json
{
  "draft": {
  "beats": [
    {
      "type": "hook",
      "text": "Stop scrolling if your skin feels dry and looks dull by 3 PM.",
      "duration_s": 3.5,
      "visual_note": "Actor holds phone close to face, looking frustrated, text overlay matching speech."
    },
    {
      "type": "problem",
      "text": "I used to reapply moisturizer constantly but nothing worked.",
      "duration_s": 4.0,
      "visual_note": "B-roll of rubbing face."
    },
    {
      "type": "solution",
      "text": "Then I found this Hydra Glow serum with 15% L-ascorbic acid.",
      "duration_s": 5.0,
      "visual_note": "Actor holding product next to face, smiling."
    },
    {
      "type": "cta",
      "text": "Click the link to get yours for 20% off today.",
      "duration_s": 3.0,
      "visual_note": "Pointing down at the screen, CTA text overlay."
    }
  ],
  "caption_hook": "Stop scrolling if your skin feels dry.",
  "cta_card": "20% off today only"
  },
  "scenes": []
}
```

---

## 2. Casting

::: warning First-party session auth only
`/ugc/actors` and `/ugc/consent` are on the same first-party, session-JWT-only host as creative ideation above — not reachable with an `fh_live_*` API key.
:::

### List Available Actors

Retrieve **your own** registered actor library (there is no shared public catalog
to filter by gender/ethnicity/style — actors are per-account, and each one was
either uploaded-and-consented or generated by you beforehand).

`GET /ugc/actors`

This endpoint takes no filter query parameters; it returns up to 200 of your own
non-deleted actors.

#### Request Example

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/ugc/actors"
headers = {"Authorization": "Bearer fh_live_your_api_key"}

response = requests.get(url, headers=headers)
```

```typescript [TypeScript]
import fetch from 'node-fetch';

await fetch('https://apis.fotohub.app/ugc/actors', {
  headers: { 'Authorization': 'Bearer fh_live_your_api_key' }
});
```

```go [Go]
// Standard HTTP GET request implementation in Go...
```

```bash [cURL]
curl -X GET "https://apis.fotohub.app/ugc/actors"   -H "Authorization: Bearer fh_live_your_api_key"
```

:::

---

### Cast an Actor

::: warning No casting call — this endpoint does not exist
There is no `POST .../cast/actor` and no per-campaign "casting ID". Actors are a
persistent library scoped to your account: you register one ahead of time with
`POST /ugc/actors` (a name, an `appearance`/`axes` description, and — for an
uploaded likeness — a `consent_id` from `POST /ugc/consent`), then reference its
`id` directly wherever a render or project blueprint asks for an actor. "Casting"
is just picking an `id` out of the `GET /ugc/actors` list above.
:::

#### Response Example — `GET /ugc/actors`

```json
{
  "actors": [
    {
      "id": "act_sarah_01",
      "name": "Sarah T.",
      "appearance": {"gender": "female", "age_range": "20-25", "style": "genz"},
      "created_at": "2027-08-01T12:00:00Z"
    }
  ],
  "library_columns": true
}
```

---

## 3. Video Rendering

::: tip This is the API-key surface
Unlike §1–2 above, every endpoint from here down is on `https://apis.fotohub.app/v1/ugc/*`
(note the `/v1`) and authenticates with your `fh_live_*` API key exactly like the rest of
the FOTOhub API.
:::

::: warning No single "render video" call
There is no flat `POST .../render/video` that takes a `script_id` + `actor_id` +
`product_url` directly. Rendering is **project-based**: you create a project,
attach a blueprint document (built from the brief/angle/script you generated
above) to it, then start a render on that project.
:::

### Step 1 — Create a Project

`POST /v1/ugc/projects`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `title` | `string` | No | `"Untitled UGC"` | A label for the project. |
| `brief` | `object` | No | `{}` | The brief object, stored on the project so later angle/variant passes can reuse it. |

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ugc/projects   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{"title": "Hydra Glow Launch", "brief": {"product": "Hydra Glow Vitamin C Serum"}}'
```

Response (`201`): `{"project": {"id": "proj_abc123", "title": "Hydra Glow Launch", "brief": {...}, "created_at": "..."}}`

---

### Step 2 — Set the Blueprint

`PUT /v1/ugc/projects/{project_id}/blueprint`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `document` | `object` | Yes | - | The scene-by-scene blueprint: scenes, chosen actor `id`, camera preset, script beats. |

```bash [cURL]
curl -X PUT https://apis.fotohub.app/v1/ugc/projects/proj_abc123/blueprint   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{
    "document": {
      "actor_id": "act_sarah_01",
      "scenes": [{"role": "hook", "text": "Stop scrolling if your skin feels dry..."}]
    }
  }'
```

---

### Price a Blueprint Before Rendering

`POST /v1/ugc/estimate`

Prices a blueprint document from the same logic the render gate uses, without spending
anything or requiring a saved project. Useful for showing a cost preview before the user
commits to `PUT .../blueprint`.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `document` | `object` | Yes | - | The same blueprint document shape used by `PUT .../blueprint`. |

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ugc/estimate   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{
    "document": {
      "actor_id": "act_sarah_01",
      "scenes": [{"role": "hook", "text": "Stop scrolling if your skin feels dry..."}]
    }
  }'
```

#### Response Example

```json
{
  "estimate": {
    "video_seconds": 30,
    "tts_characters": 372,
    "resolution": "720p",
    "voice_lines": 5,
    "voice_blocks": 0.372,
    "voice_provider": "grok"
  },
  "price": {
    "cost_usd": 1.7456,
    "currency": "USD",
    "affordable": true,
    "lines": [
      {"leg": "video", "units": 30, "unit": "second", "resolution": "720p", "cost_usd": 1.5},
      {"leg": "voice", "units": 5, "unit": "spoken_line", "provider": "grok", "cost_usd": 0.2456}
    ],
    "settled": "per delivered scene"
  }
}
```

`price.cost_usd` is a quote against the *declared* scene durations — the actual charge is
metered per delivered scene as the render lands (see [Poll Render Status](#poll-render-status)
below), so a `gpt-audio` voice leg reports `cost_usd: null` here because that provider is
billed per token, which is only known once the audio exists.

---

### Step 3 — Render

`POST /v1/ugc/projects/{project_id}/render`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `idempotency_key` | `string` | No | - | Prevents a duplicate render if the request is retried. |
| `variant_label` | `string` | No | - | A label for this render, useful when a project has several variants. |
| `product_urls` | `object` | No | `{}` | Map of scene/slot name → product image URL for B-roll injection. |

#### Request Example

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}

project = requests.post(
    "https://apis.fotohub.app/v1/ugc/projects",
    json={"title": "Hydra Glow Launch", "brief": brief_res},
    headers=headers,
).json()
project_id = project["project"]["id"]

requests.put(
    f"https://apis.fotohub.app/v1/ugc/projects/{project_id}/blueprint",
    json={"document": {"actor_id": "act_sarah_01", "scenes": [...]}},
    headers=headers,
)

render = requests.post(
    f"https://apis.fotohub.app/v1/ugc/projects/{project_id}/render",
    json={"variant_label": "v1", "product_urls": {"hero": "https://example-skincare.com/products/hydra-serum.jpg"}},
    headers=headers,
).json()
job_id = render["job"]["id"]
```

```typescript [TypeScript]
const headers = {
  'Authorization': 'Bearer fh_live_your_api_key',
  'Content-Type': 'application/json'
};

const project = await (await fetch('https://apis.fotohub.app/v1/ugc/projects', {
  method: 'POST', headers, body: JSON.stringify({ title: 'Hydra Glow Launch', brief: briefRes })
})).json();

await fetch(`https://apis.fotohub.app/v1/ugc/projects/${project.project.id}/blueprint`, {
  method: 'PUT', headers, body: JSON.stringify({ document: { actor_id: 'act_sarah_01', scenes: [] } })
});

const render = await (await fetch(`https://apis.fotohub.app/v1/ugc/projects/${project.project.id}/render`, {
  method: 'POST', headers, body: JSON.stringify({ variant_label: 'v1' })
})).json();
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ugc/projects/proj_abc123/render   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{
    "variant_label": "v1",
    "product_urls": {"hero": "https://example-skincare.com/products/hydra-serum.jpg"}
  }'
```

:::

#### Response Example

The API responds with `202 Accepted` because rendering is an asynchronous process. Nothing
is charged yet — money moves per delivered scene as the render lands, which is why the price
block below carries `charged_usd: 0.0` and a `quoted_usd` figure instead.

```json
{
  "job": {
    "id": "job_v1_abc123def456",
    "project_id": "proj_abc123",
    "user_id": "usr_...",
    "kind": "render",
    "state": "queued",
    "idempotency_key": null
  },
  "reused": false,
  "estimate": {
    "video_seconds": 30,
    "tts_characters": 372,
    "resolution": "720p",
    "voice_lines": 5,
    "voice_provider": "grok"
  },
  "price": {
    "quoted_usd": 1.7456,
    "currency": "USD",
    "charged_usd": 0.0,
    "settled": "per delivered scene — poll the job for the running total"
  }
}
```

`reused: true` means a repeat call with the same `idempotency_key` handed back the render
that key already started, rather than starting a second one.

::: tip Async Rendering
Rendering typically takes 1-3 minutes. Do not keep HTTP connections open. Poll
`GET /v1/ugc/jobs/{job_id}` every 10 seconds.
:::

---

### Poll Render Status

Check the status of a rendering job.

`GET /v1/ugc/jobs/{job_id}`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `job_id` | `string` | Yes | - | The ID of the render job (in path). |

#### Request Example

::: code-group

```python [Python]
import requests
import time

job_id = "job_v1_abc123def456"
url = f"https://apis.fotohub.app/v1/ugc/jobs/{job_id}"
headers = {"Authorization": "Bearer fh_live_your_api_key"}

while True:
    response = requests.get(url, headers=headers).json()
    if response["terminal"]:
        state = response["job"]["state"]
        if state == "completed" and response["render"]:
            print("Done:", response["render"]["video_url"])
        elif state == "failed":
            print("Failed:", response["job"].get("error"))
        print("Spent so far:", response["cost_usd"], response["currency"])
        break
    print("Processing...")
    time.sleep(10)
```

```typescript [TypeScript]
// Using async/await in a polling loop
const pollJob = async (jobId: string) => {
  const url = `https://apis.fotohub.app/v1/ugc/jobs/${jobId}`;
  
  while (true) {
    const res = await fetch(url, {
      headers: { 'Authorization': 'Bearer fh_live_your_api_key' }
    });
    const data = await res.json();
    
    if (data.terminal) return data; // data.job.state is "completed" | "failed" | ...
    
    await new Promise(r => setTimeout(r, 10000));
  }
};
```

```go [Go]
// Standard HTTP GET polling loop implementation...
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/ugc/jobs/job_v1_abc123def456   -H "Authorization: Bearer fh_live_your_api_key"
```

:::

#### Response Example (Completed)

`terminal` is `true` once the job is in a final state (`completed`, `failed`, or similar); poll
until it flips. `cost_usd`/`currency` are what this render has actually taken from the wallet
so far, summed from the per-scene settles — separate from the `price.quoted_usd` the render
call returned, which was only an estimate.

```json
{
  "job": {
    "id": "job_v1_abc123def456",
    "project_id": "proj_abc123",
    "state": "completed"
  },
  "scenes": [
    {"index": 0, "state": "done", "usage": {"wallet_usd": 0.35}}
  ],
  "render": {
    "video_url": "https://assets.fotohub.app/renders/abc123def456.mp4",
    "duration_s": 30.5
  },
  "terminal": true,
  "cost_usd": 1.7456,
  "currency": "USD"
}
```

---

### Batch Variant Rendering

::: warning Not on the API-key surface either
Batches are deliberately **not** proxied to `/v1/ugc/*`: a fan-out is N renders under one
ceiling, and a ceiling denominated in credits cannot trim variants paid for in dollars. This
endpoint is first-party session auth only, same as §1–2 above — the header shown below is
illustrative, not a working `fh_live_*` call. An API-key client fans out by calling
`POST /v1/ugc/projects/{project_id}/render` once per variant instead, which gates and refuses
each render's USD cost individually.
:::

Generate multiple variants of a project's blueprint in one call, varying axes like actor or scene — for matrix testing.

`POST /ugc/projects/{project_id}/batch`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `axes` | `object` | No | `{}` | What to vary across the batch (e.g. multiple actor ids, multiple scripts). |
| `label` | `string` | No | `""` | A label for the batch. |
| `ceiling_credits` | `number` | No | account default | Max credits this batch may spend before refusing. |

You can preview the plan and estimated variant count without spending anything via
`POST /ugc/projects/{project_id}/batch/preview` (same body shape).

#### Request Example

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/ugc/projects/proj_abc123/batch"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {
    "axes": {"actor_id": ["act_sarah_01", "act_maya_02", "act_josh_03"]},
    "label": "actor-matrix-test"
}
response = requests.post(url, json=payload, headers=headers)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/ugc/projects/proj_abc123/batch   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{
    "axes": {"actor_id": ["act_sarah_01", "act_maya_02", "act_josh_03"]},
    "label": "actor-matrix-test"
  }'
```

:::

#### Response Example

```json
{
  "batch_job_id": "bjob_v1_xyz987",
  "status": "processing",
  "total_variants": 6,
  "estimated_usd_cost": 0.900,
  "jobs": [
    "job_v1_var1",
    "job_v1_var2",
    "job_v1_var3",
    "job_v1_var4",
    "job_v1_var5",
    "job_v1_var6"
  ]
}
```

---

## BYOB (Bring Your Own Bucket)

::: warning Not a real request field
`POST /v1/ugc/projects/{project_id}/render` (`RenderIn`) only accepts
`idempotency_key`, `variant_label`, and `product_urls` — there is no
`export_destination` block, and the render call cannot push output to a
customer-owned AWS S3 or Cloudflare R2 bucket. Rendered videos are only
available at the `video_url` FOTOhub returns from the job.
:::

---

## Webhooks & Event Handling

Instead of polling, we highly recommend setting up Webhooks to receive notifications when long-running jobs (like rendering) complete.

FOTOhub sends HTTP POST requests to your configured webhook URL. 

### Webhook Signature Verification

All webhook requests include a `FOTOhub-Signature` header. You must verify this HMAC-SHA256 signature to ensure the payload was sent by FOTOhub.

::: code-group

```python [Python]
import hmac
import hashlib
from fastapi import Request, HTTPException

WEBHOOK_SECRET = "whsec_your_webhook_secret"

async def verify_webhook(request: Request):
    payload = await request.body()
    signature_header = request.headers.get("FOTOhub-Signature")
    
    # Calculate HMAC
    expected_mac = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected_mac, signature_header):
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    return await request.json()
```

```typescript [TypeScript]
import crypto from 'crypto';
import { Request, Response } from 'express';

const WEBHOOK_SECRET = 'whsec_your_webhook_secret';

export const webhookHandler = (req: Request, res: Response) => {
  const signature = req.headers['fotohub-signature'] as string;
  const payload = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    // Process event
    console.log("Event:", req.body.type);
    res.status(200).send();
  } else {
    res.status(400).send('Invalid signature');
  }
};
```

:::

### Dead Letter Queues (DLQ) & Retries

If your server responds with a non-200 status code (or times out after 10 seconds), FOTOhub will retry the webhook delivery with exponential backoff:
1. Immediately
2. After 5 minutes
3. After 30 minutes
4. After 2 hours
5. After 12 hours

If it fails after 5 retries, the event is routed to a Dead Letter Queue (DLQ). You can view and manually replay DLQ events via the FOTOhub Dashboard.

---

## End-to-End Python Automation Example

Here is a complete script that takes a product URL and automates the creation of a UGC
video, polling until it's ready. It genuinely uses **two different credentials against two
different hosts**, because steps 1–4 (creative ideation and casting) are first-party session
auth and steps 5–6 (project, blueprint, render, job) are the `fh_live_*` API-key surface — see
the warning at the top of this page. There is no single credential that does both today; a
pure API-key integration has to produce the blueprint's `scenes`/`actor_id` another way (its
own LLM call, a pre-registered actor id) and start at step 5.

```python
import os
import time
import requests

# Steps 1-4: first-party session auth (a Supabase user session JWT, not an fh_live_* key)
SESSION_JWT = os.getenv("FOTOHUB_SESSION_JWT")
SESSION_BASE_URL = "https://apis.fotohub.app/ugc"
SESSION_HEADERS = {
    "Authorization": f"Bearer {SESSION_JWT}",
    "Content-Type": "application/json"
}

# Steps 5-6: the real API-key surface
API_KEY = os.getenv("FOTOHUB_API_KEY")  # fh_live_...
API_BASE_URL = "https://apis.fotohub.app/v1/ugc"
API_HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def create_ugc_campaign(product_url):
    print(f"1. Generating Brief for {product_url}...")
    brief_res = requests.post(
        f"{SESSION_BASE_URL}/creative/brief",
        json={"url": product_url},
        headers=SESSION_HEADERS
    ).json()
    print(f"   Product: {brief_res.get('product_name')}")

    print("2. Generating Angles...")
    angles_res = requests.post(
        f"{SESSION_BASE_URL}/creative/angles",
        json={"brief": brief_res, "count": 3},
        headers=SESSION_HEADERS
    ).json()
    best_angle = angles_res["angles"]["angles"][0]

    print("3. Writing Script...")
    script_res = requests.post(
        f"{SESSION_BASE_URL}/creative/script",
        json={"brief": brief_res, "angle": best_angle},
        headers=SESSION_HEADERS
    ).json()

    print("4. Picking an Actor from your library...")
    actors_res = requests.get(f"{SESSION_BASE_URL}/actors", headers=SESSION_HEADERS).json()
    actor_id = actors_res["actors"][0]["id"]  # register one via POST /ugc/actors first if empty

    print("5. Creating Project + Blueprint + Render...")
    project = requests.post(
        f"{API_BASE_URL}/projects",
        json={"title": brief_res.get("product_name", "UGC Campaign"), "brief": brief_res},
        headers=API_HEADERS
    ).json()
    project_id = project["project"]["id"]

    requests.put(
        f"{API_BASE_URL}/projects/{project_id}/blueprint",
        json={"document": {"actor_id": actor_id, "scenes": script_res["draft"]["beats"]}},
        headers=API_HEADERS
    )

    render_res = requests.post(
        f"{API_BASE_URL}/projects/{project_id}/render",
        json={"variant_label": "v1", "product_urls": {"hero": product_url}},
        headers=API_HEADERS
    ).json()
    job_id = render_res["job"]["id"]

    print(f"6. Polling Render Job {job_id}...")
    while True:
        status_res = requests.get(
            f"{API_BASE_URL}/jobs/{job_id}",
            headers=API_HEADERS
        ).json()

        if status_res["terminal"]:
            state = status_res["job"]["state"]
            if state == "completed" and status_res["render"]:
                print("===================================")
                print("SUCCESS! Render Completed.")
                print(f"Video URL: {status_res['render']['video_url']}")
                print(f"Spent: ${status_res['cost_usd']} {status_res['currency']}")
                print("===================================")
            else:
                print(f"Render did not complete: {state}")
            break

        print("   Processing (waiting 10s)...")
        time.sleep(10)

if __name__ == "__main__":
    create_ugc_campaign("https://example-store.com/products/magic-cleaner")
```
