# UGC Studio API Reference

::: danger Not available on the public API yet
The endpoints on this page are **not served**. `https://apis.fotohub.app/v1/ugc/*` returns `404` today: UGC Studio currently runs as a first-party surface inside the FOTOhub app, authenticated with a user session rather than an `fh_live_*` key, and the API-key layer described below has not been built.

Nothing here should be integrated against. If you need programmatic UGC ads, contact us and we will tell you where the work actually stands rather than let you build against this page. The costs, limits and response shapes below are design intent, not measured behaviour of a running service.
:::

FOTOhub UGC Studio (`/v1/ugc`) automates the end-to-end creation of vertical direct-response User-Generated Content (UGC) video ads for TikTok, Instagram Reels, and YouTube Shorts. 

This pipeline is designed for high-scale media buyers and performance marketing teams who need to iterate rapidly on creative angles without traditional studio overhead. It seamlessly converts an e-commerce product URL into creative briefs, marketing angles, spoken scripts, multi-scene blueprints, AI actor performances with lip-sync, and rendered video batches.

::: tip Platform Optimizations Applied Automatically
Our render engine automatically applies platform-specific rules: TikTok's crucial first 3-second hook emphasis, Instagram Reels' strict safe zones for caption placement, and YouTube Shorts' loop-friendly pacing. 
:::

Base URL: `https://apis.fotohub.app/v1`

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
    A[Product URL] -->|POST /brief| B(Creative Brief)
    B -->|POST /angles| C(Marketing Angles)
    C -->|POST /script| D(Video Script)
    D -->|POST /render/video| E{Render Engine}
    
    F[GET /actors] -->|Select Actor| G(Actor Profile)
    G -->|POST /cast/actor| E
    
    E -->|Voice| H[Voice & Music]
    E -->|Performance| I[Actor Animation]
    E -->|Compose| J[Final Render]
    
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
    
    C->>API: POST /v1/ugc/creative/brief
    API-->>C: 200 OK (Brief Object)
    
    C->>API: POST /v1/ugc/creative/angles
    API-->>C: 200 OK (12 Angles)
    
    C->>API: POST /v1/ugc/creative/script
    API-->>C: 200 OK (Script Object)
    
    C->>API: POST /v1/ugc/render/video
    API-->>C: 202 Accepted (Job ID)
    
    C->>API: GET /v1/ugc/render/{job_id} (Polling)
    API-->>C: 200 OK (Status: Processing)
    
    API->>W: POST https://client.com/webhook (Render Complete)
    W-->>API: 200 OK
```

---

## Authentication & Headers

All requests to the UGC API require authentication using your secret API key.

```bash
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json
```

::: danger Keep your API keys secure
Never expose your `fh_live_*` API keys in client-side code (like browsers or mobile apps). All API requests must be made from your secure backend servers.
:::

---

## 1. Creative Ideation

### Generate Creative Brief

Parse an online store product page (Shopify, Amazon, WooCommerce) or a generic URL into a structured creative brief. We scrape the text, extract value propositions, and define target audiences.

`POST /v1/ugc/creative/brief`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | `string` | Yes | - | The fully qualified URL of the product page to parse. |
| `focus_keywords` | `array` | No | `[]` | Specific keywords to prioritize when extracting value props. |

#### Request Example

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ugc/creative/brief"
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

const response = await fetch('https://apis.fotohub.app/v1/ugc/creative/brief', {
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

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ugc/creative/brief", bytes.NewBuffer(jsonValue))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	fmt.Println(resp.Status)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ugc/creative/brief   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{
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
  "disallowed_claims": ["Cures acne", "Permanent results"],
  "usd_charged": 0.005
}
```

---

### Generate Marketing Angles

Produce distinct direct-response angles based on proven advertising frameworks (e.g., Problem/Solution, Us vs Them, 3 Reasons Why).

`POST /v1/ugc/creative/angles`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brief_id` | `string` | Yes | - | The ID of the brief generated in the previous step. |
| `num_angles` | `integer` | No | `12` | Number of angles to generate (3 to 12). |
| `platforms` | `array` | No | `["tiktok"]` | Platforms to optimize hooks for (`tiktok`, `reels`, `shorts`). |

#### Request Example

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ugc/creative/angles"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {
    "brief_id": "brf_9x8c7v6b5n",
    "num_angles": 12
}

response = requests.post(url, json=payload, headers=headers)
```

```typescript [TypeScript]
import fetch from 'node-fetch';

const response = await fetch('https://apis.fotohub.app/v1/ugc/creative/angles', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer fh_live_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    brief_id: 'brf_9x8c7v6b5n',
    num_angles: 12
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
	payload := map[string]interface{}{"brief_id": "brf_9x8c7v6b5n", "num_angles": 12}
	jsonValue, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ugc/creative/angles", bytes.NewBuffer(jsonValue))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	client.Do(req)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ugc/creative/angles   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{
    "brief_id": "brf_9x8c7v6b5n",
    "num_angles": 12
  }'
```

:::

#### Response Example

```json
{
  "angles": [
    {
      "angle_id": "ang_1a2b3c4d",
      "hook": "Stop scrolling if your skin feels dry and looks dull by 3 PM.",
      "value_prop": "15% L-ascorbic acid brightens skin without irritation.",
      "cta": "Click the link to get 20% off your first bottle.",
      "style": "Problem/Solution",
      "platform_fit": "tiktok"
    },
    {
      "angle_id": "ang_5e6f7g8h",
      "hook": "Dermatologists are gatekeeping this $30 vitamin C serum.",
      "value_prop": "Medical grade ingredients at drugstore prices.",
      "cta": "Available in TikTok Shop now.",
      "style": "Secret/Hack",
      "platform_fit": "tiktok"
    }
  ],
  "usd_charged": 0.015
}
```

---

### Write Script & Beats

Turns a marketing angle into a timed spoken script with visual action notes.

`POST /v1/ugc/creative/script`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `angle_id` | `string` | Yes | - | The ID of the chosen angle. |
| `duration_s` | `integer` | No | `30` | Target length of the video in seconds (15-60). |
| `tone` | `string` | No | `authentic` | Voice tone: `authentic`, `energetic`, `calm`. |

#### Request Example

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ugc/creative/script"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {
    "angle_id": "ang_1a2b3c4d",
    "duration_s": 30,
    "tone": "authentic"
}
requests.post(url, json=payload, headers=headers)
```

```typescript [TypeScript]
import fetch from 'node-fetch';

await fetch('https://apis.fotohub.app/v1/ugc/creative/script', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer fh_live_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    angle_id: 'ang_1a2b3c4d',
    duration_s: 30,
    tone: 'authentic'
  })
});
```

```go [Go]
// Standard HTTP POST request implementation in Go...
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ugc/creative/script   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{
    "angle_id": "ang_1a2b3c4d",
    "duration_s": 30,
    "tone": "authentic"
  }'
```

:::

#### Response Example

```json
{
  "script_id": "scr_9988776655",
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
  "estimated_duration_s": 15.5,
  "usd_charged": 0.008
}
```

---

## 2. Casting

### List Available Actors

Retrieve a list of available AI actors, their attributes, and preview thumbnails.

`GET /v1/ugc/actors`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `gender` | `string` | No | - | Filter by `male`, `female`, `non_binary`. |
| `ethnicity` | `string` | No | - | Filter by ethnicity. |
| `style` | `string` | No | - | Filter by style (e.g., `genz`, `professional`, `fitness`). |

#### Request Example

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ugc/actors?gender=female&style=genz"
headers = {"Authorization": "Bearer fh_live_your_api_key"}

response = requests.get(url, headers=headers)
```

```typescript [TypeScript]
import fetch from 'node-fetch';

await fetch('https://apis.fotohub.app/v1/ugc/actors?gender=female&style=genz', {
  headers: { 'Authorization': 'Bearer fh_live_your_api_key' }
});
```

```go [Go]
// Standard HTTP GET request implementation in Go...
```

```bash [cURL]
curl -X GET "https://apis.fotohub.app/v1/ugc/actors?gender=female&style=genz"   -H "Authorization: Bearer fh_live_your_api_key"
```

:::

---

### Cast an Actor

Select an actor to be used in a specific campaign. This generates a casting ID.

`POST /v1/ugc/cast/actor`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `gender` | `string` | No | - | Desired gender of the actor. |
| `age_range` | `string` | No | - | e.g. `20-25`, `30-40`. |
| `ethnicity` | `string` | No | - | Desired ethnicity. |
| `style` | `string` | No | - | Vibe or aesthetic. |
| `actor_id` | `string` | No | - | Directly cast a known actor by ID (overrides filters). |

#### Response Example

```json
{
  "actor_id": "act_sarah_01",
  "name": "Sarah T.",
  "attributes": {
    "gender": "female",
    "age_range": "20-25",
    "ethnicity": "caucasian",
    "style": "genz"
  },
  "preview_url": "https://assets.fotohub.app/actors/sarah_01.jpg",
  "usd_charged": 0.000
}
```

---

## 3. Video Rendering

### Render Video

Initiate the final rendering of the video ad. This combines the script, voice cloning, lip-sync, and compositing on our GPU clusters.

`POST /v1/ugc/render/video`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `script_id` | `string` | Yes | - | ID of the script to render. |
| `actor_id` | `string` | Yes | - | ID of the casted actor. |
| `product_url` | `string` | Yes | - | URL to product imagery for B-roll injection. |
| `aspect_ratio` | `string` | No | `9:16` | Video ratio (e.g., `9:16`, `1:1`, `16:9`). |
| `background` | `string` | No | `dynamic` | Background style (`dynamic`, `solid`, `transparent`). |
| `webhook_url` | `string` | No | - | URL to receive the `render.completed` webhook. |

#### Request Example

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ugc/render/video"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {
    "script_id": "scr_9988776655",
    "actor_id": "act_sarah_01",
    "product_url": "https://example-skincare.com/products/hydra-serum",
    "webhook_url": "https://your-api.com/webhooks/fotohub"
}
response = requests.post(url, json=payload, headers=headers)
```

```typescript [TypeScript]
import fetch from 'node-fetch';

await fetch('https://apis.fotohub.app/v1/ugc/render/video', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer fh_live_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    script_id: 'scr_9988776655',
    actor_id: 'act_sarah_01',
    product_url: 'https://example-skincare.com/products/hydra-serum'
  })
});
```

```go [Go]
// Standard HTTP POST request implementation...
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ugc/render/video   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{
    "script_id": "scr_9988776655",
    "actor_id": "act_sarah_01",
    "product_url": "https://example-skincare.com/products/hydra-serum"
  }'
```

:::

#### Response Example

The API responds with `202 Accepted` because rendering is an asynchronous process.

```json
{
  "job_id": "job_v1_abc123def456",
  "status": "processing",
  "estimated_completion_time_s": 120,
  "estimated_usd_cost": 0.180
}
```

::: tip Async Rendering
Rendering typically takes 1-3 minutes. Do not keep HTTP connections open. Rely on Webhooks or poll the job status endpoint every 10 seconds.
:::

---

### Poll Render Status

Check the status of a rendering job.

`GET /v1/ugc/render/{job_id}`

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
url = f"https://apis.fotohub.app/v1/ugc/render/{job_id}"
headers = {"Authorization": "Bearer fh_live_your_api_key"}

while True:
    response = requests.get(url, headers=headers).json()
    if response["status"] == "completed":
        print("Done:", response["video_url"])
        break
    elif response["status"] == "failed":
        print("Failed:", response["error"])
        break
    print("Processing...")
    time.sleep(10)
```

```typescript [TypeScript]
// Using async/await in a polling loop
const pollJob = async (jobId: string) => {
  const url = `https://apis.fotohub.app/v1/ugc/render/${jobId}`;
  
  while (true) {
    const res = await fetch(url, {
      headers: { 'Authorization': 'Bearer fh_live_your_api_key' }
    });
    const data = await res.json();
    
    if (data.status === 'completed') return data;
    if (data.status === 'failed') throw new Error(data.error);
    
    await new Promise(r => setTimeout(r, 10000));
  }
};
```

```go [Go]
// Standard HTTP GET polling loop implementation...
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/ugc/render/job_v1_abc123def456   -H "Authorization: Bearer fh_live_your_api_key"
```

:::

#### Response Example (Completed)

```json
{
  "job_id": "job_v1_abc123def456",
  "status": "completed",
  "video_url": "https://assets.fotohub.app/renders/abc123def456.mp4",
  "duration_s": 30.5,
  "usd_charged": 0.183,
  "platform_specs": {
    "tiktok": {
      "url": "https://assets.fotohub.app/renders/abc123def456_tiktok.mp4",
      "format": "9:16_safezone"
    },
    "reels": {
      "url": "https://assets.fotohub.app/renders/abc123def456_reels.mp4",
      "format": "9:16_safezone_reels"
    }
  }
}
```

---

### Batch Variant Rendering

Generate multiple variants in a single API call for matrix testing. This is highly efficient and offers a discounted USD rate.

`POST /v1/ugc/render/batch`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `script_ids` | `array` | Yes | - | Array of script IDs to render. |
| `actor_ids` | `array` | Yes | - | Array of actor IDs to apply across scripts. |
| `batch_size` | `integer` | No | `10` | Max number of variants to render. |
| `product_url` | `string` | Yes | - | Base product URL. |

#### Request Example

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ugc/render/batch"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {
    "script_ids": ["scr_11", "scr_22"],
    "actor_ids": ["act_sarah_01", "act_maya_02", "act_josh_03"],
    "batch_size": 6,
    "product_url": "https://example-skincare.com/products/hydra-serum"
}
response = requests.post(url, json=payload, headers=headers)
```

```typescript [TypeScript]
// Standard TypeScript fetch implementation...
```

```go [Go]
// Standard Go implementation...
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ugc/render/batch   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{
    "script_ids": ["scr_11", "scr_22"],
    "actor_ids": ["act_sarah_01", "act_maya_02", "act_josh_03"],
    "batch_size": 6,
    "product_url": "https://example-skincare.com/products/hydra-serum"
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

For enterprise accounts, you can export rendered videos directly to your own AWS S3 or Cloudflare R2 buckets instead of using FOTOhub-hosted URLs.

Configure this in your Dashboard settings or pass the `export_destination` block in the render request:

```json
{
  "export_destination": {
    "type": "s3",
    "bucket_name": "my-company-ugc-assets",
    "region": "us-east-1",
    "prefix": "fotohub/q3-campaigns/"
  }
}
```

::: info IAM Permissions
Ensure your S3 bucket policy allows `s3:PutObject` from the FOTOhub AWS Account ID. Refer to the dashboard for the exact principal ARN.
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

Here is a complete, production-ready script that takes a product URL and fully automates the creation of a UGC video, polling until it's ready and downloading the final MP4.

```python
import os
import time
import requests

API_KEY = os.getenv("FOTOHUB_API_KEY", "fh_live_your_api_key")
BASE_URL = "https://apis.fotohub.app/v1"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def create_ugc_campaign(product_url):
    print(f"1. Generating Brief for {product_url}...")
    brief_res = requests.post(
        f"{BASE_URL}/ugc/creative/brief",
        json={"url": product_url},
        headers=HEADERS
    ).json()
    brief_id = brief_res["brief_id"]
    print(f"   Brief ID: {brief_id} | Cost: ${brief_res.get('usd_charged', 0)}")

    print("2. Generating Angles...")
    angles_res = requests.post(
        f"{BASE_URL}/ugc/creative/angles",
        json={"brief_id": brief_id, "num_angles": 3},
        headers=HEADERS
    ).json()
    best_angle = angles_res["angles"][0]
    angle_id = best_angle["angle_id"]
    
    print("3. Writing Script...")
    script_res = requests.post(
        f"{BASE_URL}/ugc/creative/script",
        json={"angle_id": angle_id, "duration_s": 30},
        headers=HEADERS
    ).json()
    script_id = script_res["script_id"]
    
    print("4. Casting Actor...")
    actor_res = requests.post(
        f"{BASE_URL}/ugc/cast/actor",
        json={"style": "genz", "gender": "female"},
        headers=HEADERS
    ).json()
    actor_id = actor_res["actor_id"]

    print("5. Initiating Render...")
    render_res = requests.post(
        f"{BASE_URL}/ugc/render/video",
        json={
            "script_id": script_id,
            "actor_id": actor_id,
            "product_url": product_url
        },
        headers=HEADERS
    ).json()
    job_id = render_res["job_id"]
    
    print(f"6. Polling Render Job {job_id}...")
    while True:
        status_res = requests.get(
            f"{BASE_URL}/ugc/render/{job_id}",
            headers=HEADERS
        ).json()
        
        if status_res["status"] == "completed":
            print("===================================")
            print("SUCCESS! Render Completed.")
            print(f"Video URL: {status_res['video_url']}")
            print(f"Total USD Cost: ${status_res['usd_charged']}")
            print("===================================")
            break
        elif status_res["status"] == "failed":
            print(f"Render Failed: {status_res.get('error')}")
            break
            
        print("   Processing (waiting 10s)...")
        time.sleep(10)

if __name__ == "__main__":
    create_ugc_campaign("https://example-store.com/products/magic-cleaner")
```
