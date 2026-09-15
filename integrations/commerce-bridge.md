# Commerce Bridge API

The Commerce Bridge orchestrates bulk catalog work for every FOTOhub e-commerce integration. Plugins submit a batch of products and poll for results; the bridge owns the queue, per-item retries, cost preflight, the preset library, and callback delivery.

::: info What it handles for you
- **Queue and fan-out** — one job covers up to 500 products, dispatched at a rate your store's API can absorb
- **Per-item retries** — a rate-limited or failed product retries independently; one bad SKU never sinks the batch
- **Cost preflight** — know the USD cost before a job starts, and get a `402` instead of a half-finished run
- **Preset library** — 63 server-side presets, updated without shipping a plugin release
- **Signed callbacks** — HMAC-verified webhooks per item and per job
:::

## Architecture

```
  CMS plugin (thin)              Commerce Bridge                 FOTOhub core
┌────────────────────┐        ┌──────────────────────┐        ┌────────────────┐
│ product picker     │──REST─▶│ /v1/commerce/jobs    │──HTTP─▶│ /v1/ai/*       │
│ preset selector    │        │  ├ queue (Celery)    │        │ /v1/images/*   │
│ progress UI        │◀─poll──│  ├ per-item retry    │        │ /v1/billing/*  │
│ draft review       │        │  ├ preset library    │        └────────────────┘
│ write-back         │◀─hook──│  └ signed callbacks  │
└────────────────────┘        └──────────────────────┘
```

The plugin never talks to the AI endpoints directly for bulk work. It hands the bridge a list of products plus an operation, and the bridge calls FOTOhub's generation APIs with **your** API key, so billing and rate limits stay on your account.

## When to use the bridge

| Situation | Use |
|-----------|-----|
| One image, merchant is watching | Call [`/v1/ai/generate/image`](/api/image-generation) directly |
| More than one product | Commerce Bridge |
| Anything needing progress, retry, or resume | Commerce Bridge |
| You want cost confirmed before spending | Commerce Bridge (`/estimate`) |
| Results must be reviewed before going live | Commerce Bridge (drafts via callbacks) |

## Authentication

Every request uses the same API key as the rest of the FOTOhub API:

```
Authorization: Bearer fh_live_your_api_key
```

Create a key at [fotohub.app/console](https://fotohub.app/console). The bridge validates it against your billing account on first use and caches the result briefly.

A **connection** represents one store. Registering it returns a `callback_secret` — store it, because it is only returned once and you need it to verify incoming webhooks.

## Register a connection

```
POST /v1/commerce/connections
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `platform` | string | yes | — | `magento`, `woocommerce`, `wordpress`, `shopify`, `prestashop`, `shoper`, `bigcommerce`, `custom`, and others |
| `store_url` | string | yes | — | Your storefront URL, max 500 chars |
| `store_name` | string | yes | — | Display name, max 200 chars |
| `callback_url` | string | no | `null` | HTTPS endpoint for job events |
| `settings` | object | no | `{}` | Free-form plugin settings (default preset, locale, brand kit) |

::: code-group

```python [Python]
import os, requests

BASE = "https://apis.fotohub.app/v1/commerce"
HEADERS = {"Authorization": f"Bearer {os.environ['FOTOHUB_API_KEY']}"}

resp = requests.post(f"{BASE}/connections", headers=HEADERS, json={
    "platform": "magento",
    "store_url": "https://shop.example.com",
    "store_name": "Example Store",
    "callback_url": "https://shop.example.com/fotohub/callback",
})
resp.raise_for_status()
conn = resp.json()

print("connection:", conn["id"])
print("save this secret:", conn["callback_secret"])
```

```typescript [TypeScript]
const BASE = "https://apis.fotohub.app/v1/commerce";
const headers = {
  Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}`,
  "Content-Type": "application/json",
};

const resp = await fetch(`${BASE}/connections`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    platform: "bigcommerce",
    store_url: "https://shop.example.com",
    store_name: "Example Store",
    callback_url: "https://shop.example.com/fotohub/callback",
  }),
});
if (!resp.ok) throw new Error(`register failed: ${resp.status}`);
const conn = await resp.json();

console.log("connection:", conn.id);
console.log("save this secret:", conn.callback_secret);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

func main() {
	payload, _ := json.Marshal(map[string]string{
		"platform":     "shoper",
		"store_url":    "https://shop.example.com",
		"store_name":   "Example Store",
		"callback_url": "https://shop.example.com/fotohub/callback",
	})

	req, _ := http.NewRequest("POST",
		"https://apis.fotohub.app/v1/commerce/connections",
		bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var conn struct {
		ID             string `json:"id"`
		CallbackSecret string `json:"callback_secret"`
	}
	json.NewDecoder(resp.Body).Decode(&conn)
	fmt.Println("connection:", conn.ID)
	fmt.Println("save this secret:", conn.CallbackSecret)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/commerce/connections \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "prestashop",
    "store_url": "https://shop.example.com",
    "store_name": "Example Store",
    "callback_url": "https://shop.example.com/fotohub/callback"
  }'
```

:::

Response:

```json
{
  "id": "8f2c1e40-5a3b-4d9e-8c17-2b6a91f0d3e5",
  "status": "active",
  "platform": "magento",
  "store_url": "https://shop.example.com",
  "store_name": "Example Store",
  "callback_url": "https://shop.example.com/fotohub/callback",
  "created_at": "2026-07-27T09:14:02Z",
  "callback_secret": "b7c1...redacted"
}
```

Other connection operations:

| Endpoint | Description |
|----------|-------------|
| `GET /v1/commerce/connections` | List your connections. `callback_secret` is `null` here. |
| `DELETE /v1/commerce/connections/{id}` | Disconnect a store. Running jobs are not cancelled automatically. |

## Estimate cost

Always estimate before a large run. This endpoint costs nothing.

```
POST /v1/commerce/estimate
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `kind` | string | yes | Job kind (see below) |
| `model` | string | no | Image model; defaults to `seedream-5-0-260128` |
| `num_items` | integer | yes | How many products |
| `options` | object | no | Same options object as the job; `num_images` multiplies the cost |

::: code-group

```python [Python]
est = requests.post(f"{BASE}/estimate", headers=HEADERS, json={
    "kind": "image_generate",
    "model": "seedream-5-0-260128",
    "num_items": 120,
    "options": {"num_images": 2},
}).json()

if not est["sufficient"]:
    raise SystemExit(
        f"Need ${est['total_usd']} USD, have ${est['available_usd']} USD"
    )
print(f"${est['total_usd']} USD for 120 products")
```

```typescript [TypeScript]
const est = await fetch(`${BASE}/estimate`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    kind: "image_generate",
    model: "seedream-5-0-260128",
    num_items: 120,
    options: { num_images: 2 },
  }),
}).then((r) => r.json());

if (!est.sufficient) {
  throw new Error(
    `Need $${est.total_usd} USD, have $${est.available_usd} USD`,
  );
}
```

```go [Go]
payload, _ := json.Marshal(map[string]any{
	"kind":      "image_generate",
	"model":     "seedream-5-0-260128",
	"num_items": 120,
	"options":   map[string]any{"num_images": 2},
})

req, _ := http.NewRequest("POST",
	"https://apis.fotohub.app/v1/commerce/estimate",
	bytes.NewBuffer(payload))
req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()

var est struct {
	TotalUSD         float64 `json:"total_usd"`
	AvailableUSD     float64 `json:"available_usd"`
	Sufficient       bool    `json:"sufficient"`
}
json.NewDecoder(resp.Body).Decode(&est)
if !est.Sufficient {
	fmt.Printf("need $%.4f, have $%.2f USD\n", est.TotalUSD, est.AvailableUSD)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/commerce/estimate \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"kind":"image_generate","num_items":120,"options":{"num_images":2}}'
```

:::

```json
{
  "cost_per_item_usd": 0.1260,
  "total_usd": 15.1200,
  "available_usd": 75.0000,
  "sufficient": true
}
```

## Submit a job

```
POST /v1/commerce/jobs
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `connection_id` | string | yes | — | Must belong to the calling API key |
| `kind` | string | yes | — | Job kind (see table below) |
| `model` | string | no | `seedream-5-0-260128` | Image model for generative kinds |
| `preset_slug` | string | no | `null` | Preset from the library |
| `options` | object | no | `{}` | See [Options](#options) |
| `items` | array | yes | — | 1 to 500 products |
| `idempotency_key` | string | no | `null` | Replaying the same key returns the original job with `200` |

Each item:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `external_id` | string | yes | Your product ID — echoed back so you can match results |
| `sku` | string | no | Shown in progress UIs and error messages |
| `variant_id` | string | no | For per-variant generation |
| `source_image_url` | string | no | Required for edit, background, upscale and recolor kinds |
| `product_context` | object | no | `{title, category, attributes, price, current_description}` — drives prompt and copy quality |

::: tip Fill in product_context
The bridge builds prompts and descriptions from this. A job with only IDs produces generic output; one with title, category and attributes produces copy that actually matches the product.
:::

::: code-group

```python [Python]
job = requests.post(f"{BASE}/jobs", headers=HEADERS, json={
    "connection_id": conn["id"],
    "kind": "complete_listing",
    "model": "seedream-5-0-260128",
    "preset_slug": "cosmetics-elegant",
    "options": {
        "language": "pl",
        "tone": "luxury",
        "num_images": 2,
        "fields": ["title", "description", "meta_description", "alt_text"],
    },
    "items": [
        {
            "external_id": "1042",
            "sku": "CRM-500-LAV",
            "product_context": {
                "title": "Krem nawilżający z lawendą 50 ml",
                "category": "Pielęgnacja twarzy",
                "attributes": {"pojemność": "50 ml", "skóra": "sucha"},
                "price": "89.00 PLN",
            },
        },
    ],
    "idempotency_key": "spring-refresh-2026-07-batch-1",
}).json()

print(job["job_id"], job["estimated_usd"])
```

```typescript [TypeScript]
const job = await fetch(`${BASE}/jobs`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    connection_id: conn.id,
    kind: "complete_listing",
    preset_slug: "cosmetics-elegant",
    options: {
      language: "pl",
      tone: "luxury",
      num_images: 2,
      fields: ["title", "description", "meta_description", "alt_text"],
    },
    items: products.map((p) => ({
      external_id: String(p.id),
      sku: p.sku,
      product_context: {
        title: p.name,
        category: p.category,
        attributes: p.attributes,
        price: p.price,
      },
    })),
    idempotency_key: `spring-refresh-${batchId}`,
  }),
}).then((r) => r.json());
```

```go [Go]
type context struct {
	Title    string `json:"title"`
	Category string `json:"category,omitempty"`
	Price    string `json:"price,omitempty"`
}
type item struct {
	ExternalID string  `json:"external_id"`
	SKU        string  `json:"sku,omitempty"`
	Context    context `json:"product_context"`
}

payload, _ := json.Marshal(map[string]any{
	"connection_id":   connID,
	"kind":            "complete_listing",
	"preset_slug":     "cosmetics-elegant",
	"options":         map[string]any{"language": "pl", "tone": "luxury"},
	"items":           []item{{ExternalID: "1042", SKU: "CRM-500-LAV",
		Context: context{Title: "Krem nawilzajacy", Category: "Pielegnacja"}}},
	"idempotency_key": "spring-refresh-batch-1",
})

req, _ := http.NewRequest("POST",
	"https://apis.fotohub.app/v1/commerce/jobs", bytes.NewBuffer(payload))
req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
if resp.StatusCode == http.StatusPaymentRequired {
	fmt.Println("insufficient wallet balance")
	return
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/commerce/jobs \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "connection_id": "8f2c1e40-5a3b-4d9e-8c17-2b6a91f0d3e5",
    "kind": "bg_remove",
    "items": [
      {"external_id": "1042", "sku": "CRM-500-LAV",
       "source_image_url": "https://shop.example.com/img/1042.jpg"}
    ]
  }'
```

:::

```json
{
  "job_id": "3d9a77e2-1c04-4f6b-9a58-7e1b2c4d8f90",
  "status": "queued",
  "total_items": 1,
  "estimated_usd": 0.1260
}
```

If your balance is short, you get `402` **before** anything is charged:

```json
{
  "error": "insufficient_funds",
  "required_usd": 15.12,
  "available_usd": 3.50
}
```

## Job kinds

| Kind | What it does | Cost per item (USD) | Needs `source_image_url` |
|------|--------------|------------------|--------------------------|
| `image_generate` | New product photo from the preset and product context | model cost (2–5.3) | no |
| `image_edit` | Edit an existing photo with a prompt | model cost | yes |
| `bg_remove` | Cut out the background | 2 | yes |
| `bg_replace` | Replace the background with a colour, image or scene | 4 | yes |
| `upscale` | Increase resolution | 1 | yes |
| `recolor` | Recolour an object — colourway variants without a reshoot | 3 | yes |
| `description` | Product copy: title, descriptions, SEO meta | 1 | no |
| `alt_text` | Accessibility alt text from the image | 1 | yes |
| `complete_listing` | Images **and** copy **and** alt text in one job | sum of the above | no |

Image model costs: `seedream-5-0-260128` 2, `dola-seedream-5-0-pro-260628` 3, `gpt-image-2` 2, `nano-banana-pro` 5.3, `nano-banana-fast` 2, `imagen-4-standard` 3, `imagen-4-ultra` 5, `imagen-4-fast` 2. See the [models catalog](/api/models) for capabilities.

### Options

| Option | Type | Applies to | Description |
|--------|------|-----------|-------------|
| `language` | `en` \| `pl` \| `de` | text kinds | Output language |
| `tone` | `professional` \| `casual` \| `luxury` \| `playful` \| `technical` \| `minimal` | text kinds | Brand voice |
| `brand_rules` | string (≤4000) | text kinds | Extra instructions: banned words, required claims, length |
| `fields` | array | text kinds | Which fields to produce: `title`, `short_description`, `description`, `meta_title`, `meta_description`, `alt_text`, `faq`, `json_ld` |
| `aspect_ratio` | string | image kinds | e.g. `1:1`, `4:5`, `16:9` |
| `num_images` | 1–4 | image kinds | Images per product; multiplies cost |
| `output_format` | string | image kinds | `png`, `jpg`, `webp` |
| `background` | string | `bg_replace` | Hex colour, image URL, or a scene description |
| `recolor_prompt` | string | `recolor` | Target colour |
| `target_object` | string | `recolor` | What to recolour, e.g. `the dress` |
| `prompt` | string | image kinds | Overrides the preset prompt entirely |

## Track progress

```
GET /v1/commerce/jobs/{job_id}
GET /v1/commerce/jobs/{job_id}/items?status=&limit=&offset=
GET /v1/commerce/jobs
```

```json
{
  "id": "3d9a77e2-1c04-4f6b-9a58-7e1b2c4d8f90",
  "status": "processing",
  "kind": "complete_listing",
  "total_items": 120,
  "done_items": 47,
  "failed_items": 2,
  "spent_usd": 5.9220,
  "estimated_usd": 0.126080
}
```

Item results carry everything you need to write back:

```json
{
  "items": [
    {
      "id": "b1e4...",
      "external_id": "1042",
      "sku": "CRM-500-LAV",
      "status": "completed",
      "attempts": 1,
      "usd_charged": 0.1260,
      "error_message": null,
      "result": {
        "image_urls": ["https://s1.fotohub.app/storage/v1/object/public/photos/..."],
        "text": {
          "title": "Krem nawilżający z lawendą, 50 ml",
          "description": "...",
          "meta_description": "...",
          "alt_text": "Słoiczek kremu nawilżającego z lawendą na marmurze"
        }
      }
    }
  ]
}
```

::: code-group

```python [Python]
import time

while True:
    job = requests.get(f"{BASE}/jobs/{job_id}", headers=HEADERS).json()
    print(f"{job['done_items']}/{job['total_items']} done, {job['failed_items']} failed")

    if job["status"] in ("completed", "completed_with_errors", "failed", "cancelled"):
        break
    if job["status"] == "awaiting_funds":
        print("job paused — top up, then call retry-failed")
        break
    time.sleep(5)

items = requests.get(
    f"{BASE}/jobs/{job_id}/items",
    headers=HEADERS,
    params={"status": "completed", "limit": 200},
).json()["items"]
```

```typescript [TypeScript]
const terminal = ["completed", "completed_with_errors", "failed", "cancelled"];

async function waitForJob(jobId: string) {
  for (;;) {
    const job = await fetch(`${BASE}/jobs/${jobId}`, { headers }).then((r) => r.json());
    onProgress(job.done_items, job.total_items, job.failed_items);

    if (terminal.includes(job.status)) return job;
    if (job.status === "awaiting_funds") return job;
    await new Promise((r) => setTimeout(r, 5000));
  }
}
```

```go [Go]
ticker := time.NewTicker(5 * time.Second)
defer ticker.Stop()

for range ticker.C {
	req, _ := http.NewRequest("GET",
		"https://apis.fotohub.app/v1/commerce/jobs/"+jobID, nil)
	req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		continue // transient; keep polling
	}
	var job struct {
		Status     string `json:"status"`
		DoneItems  int    `json:"done_items"`
		TotalItems int    `json:"total_items"`
	}
	json.NewDecoder(resp.Body).Decode(&job)
	resp.Body.Close()

	fmt.Printf("%d/%d\n", job.DoneItems, job.TotalItems)
	if job.Status != "queued" && job.Status != "processing" {
		break
	}
}
```

```bash [cURL]
curl "https://apis.fotohub.app/v1/commerce/jobs/3d9a77e2-1c04-4f6b-9a58-7e1b2c4d8f90" \
  -H "Authorization: Bearer fh_live_your_api_key"

curl "https://apis.fotohub.app/v1/commerce/jobs/3d9a77e2/items?status=failed" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

## Job lifecycle

```
                 ┌──────────┐
                 │  queued  │
                 └────┬─────┘
                      ▼
                ┌────────────┐        wallet funds run out
                │ processing │──────────────────────────▶┌──────────────────┐
                └─────┬──────┘                           │ awaiting_funds │
                      │                                  └────────┬─────────┘
   all items resolved │                                  top up,  │
                      ▼                                  then     │
   ┌──────────┬───────────────────────┬──────────┐   retry-failed │
   ▼          ▼                       ▼          ▼                │
completed  completed_with_errors   failed   cancelled ◀───────────┘
           (some items failed)   (all failed)
```

`awaiting_funds` is deliberate: rather than charging item by item until the balance dies mid-catalog, the worker parks the batch and cancels the not-yet-started items. Top up, call `retry-failed`, and those items are revived along with the failed ones.

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| Retry failed only | `POST /v1/commerce/jobs/{id}/retry-failed` | Returns `{requeued}`. Also revives cancelled siblings of an `awaiting_funds` job. `attempts` is preserved for audit. |
| Cancel | `POST /v1/commerce/jobs/{id}/cancel` | Cancels the job and its pending items. Already-completed items keep their results. |

::: warning Retry failed, not everything
Never resubmit a whole batch to recover a few products — you would pay again for the ones that already succeeded. `retry-failed` only requeues what actually needs redoing.
:::

## Preset library

```
GET /v1/commerce/presets?category=&vertical=
POST /v1/commerce/presets
```

Presets compose along orthogonal axes rather than being a flat list of prompt strings, so a merchant can recombine looks instead of picking one canned result. Every preset ships with a Polish name (`name_pl`) alongside the English one.

| Category | Count | Purpose |
|----------|-------|---------|
| `bundle` | 8 | One-click starting points per vertical — references a background, lighting and composition plus a prompt template |
| `background` | 14 | Surface or backdrop |
| `scene` | 12 | Context and setting, including seasonal |
| `lighting` | 8 | Light quality and direction |
| `composition` | 9 | Angle and framing |
| `channel` | 6 | Marketplace and social output profiles |
| `description_tone` | 6 | Brand voice for copy, with per-language system prompts |

**Bundles:** `fashion-studio`, `electronics-clean`, `food-appetizing`, `jewelry-luxury`, `furniture-lifestyle`, `cosmetics-elegant`, `sports-dynamic`, `toys-playful`

**Backgrounds:** `pure-white`, `light-grey-studio`, `brand-gradient`, `marble-surface`, `concrete`, `dark-wood`, `light-wood`, `linen-fabric`, `silk-fabric`, `sand`, `water-ripples`, `glass-riser`, `stone-podium`, `paper-backdrop`

**Scenes:** `kitchen-counter`, `bathroom-vanity`, `living-room`, `bedside-table`, `desk-workspace`, `cafe-table`, `outdoor-nature`, `beach`, `urban-street`, `garden`, `christmas-seasonal`, `black-friday`

**Lighting:** `soft-studio-softbox`, `hard-directional-shadow`, `rim-light`, `golden-hour`, `dramatic-low-key`, `high-key-bright`, `neon-gel`, `natural-window`

**Composition:** `hero-three-quarter`, `straight-front`, `top-down-flat-lay`, `angle-45`, `macro-detail`, `floating-levitating`, `group-set`, `in-hand`, `ghost-mannequin`

**Channels:** `amazon-main`, `google-shopping`, `allegro-pl`, `instagram-feed`, `instagram-story`, `web-banner`

**Tones:** `tone-professional`, `tone-casual`, `tone-luxury`, `tone-playful`, `tone-technical`, `tone-minimal`

A bundle like `cosmetics-elegant` expands to `marble-surface` + `soft-studio-softbox` + `straight-front` plus a template with a `{product}` placeholder. Channel presets additionally carry hard constraints — `amazon-main` enforces 1:1, pure white RGB 255,255,255, and no props or text, so output is marketplace-compliant.

```bash
curl "https://apis.fotohub.app/v1/commerce/presets?category=bundle" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

You can also save your own preset with `POST /v1/commerce/presets`; custom presets are private to your account and appear alongside the system ones.

## Webhooks

Set `callback_url` on the connection and the bridge posts events as work completes, so you do not have to poll.

| Event | When |
|-------|------|
| `commerce.item.completed` | An item finished (may batch several items) |
| `commerce.job.completed` | All items resolved |
| `commerce.job.failed` | The job failed outright |
| `commerce.job.awaiting_funds` | The batch was parked for lack of funds |

Each request carries `X-FotoHub-Signature`: the HMAC-SHA256 of the **raw** request body, hex-encoded, keyed by your `callback_secret`. Compute it over the bytes you received, before any JSON parsing or re-serialisation.

::: code-group

```python [Python]
import hashlib, hmac
from flask import Flask, request, abort

app = Flask(__name__)
SECRET = os.environ["FOTOHUB_CALLBACK_SECRET"]

@app.post("/fotohub/callback")
def callback():
    expected = hmac.new(SECRET.encode(), request.get_data(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, request.headers.get("X-FotoHub-Signature", "")):
        abort(401)

    event = request.get_json()
    if event["event"] == "commerce.item.completed":
        for item in event.get("items", []):
            store_draft(item["external_id"], item["result"])
    return "", 204
```

```typescript [TypeScript]
import crypto from "node:crypto";
import express from "express";

const app = express();
const SECRET = process.env.FOTOHUB_CALLBACK_SECRET!;

// Raw body is required — a re-serialised body will not match the signature.
app.post("/fotohub/callback", express.raw({ type: "*/*" }), (req, res) => {
  const signature = String(req.header("X-FotoHub-Signature") ?? "");
  const expected = crypto.createHmac("sha256", SECRET).update(req.body).digest("hex");

  // Compare lengths first: timingSafeEqual throws on a length mismatch.
  const ok =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!ok) return res.sendStatus(401);

  const event = JSON.parse(req.body.toString("utf8"));
  handleEvent(event);
  res.sendStatus(204);
});
```

```go [Go]
func callbackHandler(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	mac := hmac.New(sha256.New, []byte(os.Getenv("FOTOHUB_CALLBACK_SECRET")))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(expected), []byte(r.Header.Get("X-FotoHub-Signature"))) {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	var event struct {
		Event string `json:"event"`
		JobID string `json:"job_id"`
	}
	json.Unmarshal(body, &event)
	w.WriteHeader(http.StatusNoContent)
}
```

```bash [cURL]
# Verify your endpoint locally: compute the same digest the bridge would send.
BODY='{"event":"commerce.job.completed","job_id":"3d9a77e2"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$CALLBACK_SECRET" -hex | awk '{print $2}')

curl -X POST https://shop.example.com/fotohub/callback \
  -H "X-FotoHub-Signature: $SIG" \
  -H "Content-Type: application/json" \
  -d "$BODY"
```

:::

## Rate budgets

Store platforms impose their own API ceilings, and exceeding them gets the merchant's credentials throttled or suspended — something no amount of retrying recovers from. The bridge therefore spreads dispatch over at most **half** a platform's per-minute allowance, leaving room for the merchant's own admin traffic and for retries, and clamps against any daily cap.

| Platform | Per minute | Per day |
|----------|-----------|---------|
| BaseLinker | 100 | — |
| Etsy | 300 | 10,000 |
| Allegro | 500 | — |
| Shopify | 120 | — |
| BigCommerce | 150 | — |
| Wix | 200 | — |
| Shopware | 200 | — |
| Squarespace, IdoSell, Shoper | 120 | — |
| anything else | 240 | — |

A 500-item job on a slow platform therefore takes minutes to dispatch rather than firing at once. Progress reporting is unaffected — items simply complete over a longer window.

## Idempotency

Pass `idempotency_key` on submit. Replaying the same key for the same connection returns the **original** job with HTTP `200` rather than creating a duplicate, so a retried network call or a double-clicked button cannot double-charge. Derive the key from something stable, such as a hash of the connection, kind, preset and sorted product IDs.

## Errors

| Status | Meaning | What to do |
|--------|---------|-----------|
| `400` | Malformed body or item count outside 1–500 | Fix the request |
| `401` | Missing, invalid or revoked API key | Re-check the key in the console |
| `402` | Insufficient wallet balance (`required_usd`, `available_usd` included) | Top up, then resubmit |
| `404` | Job or connection not found, or not yours | Verify the ID belongs to this key |
| `409` | Operation invalid for the current state, e.g. retrying a cancelled job | Create a new job |
| `429` | Too many requests | Back off, honour `Retry-After` |
| `502` | Upstream storage or database failure | Retry with backoff |

```json
{
  "error": "insufficient_funds",
  "required_usd": 15.12,
  "available_usd": 3.50
}
```

## Full workflow

Register once, then for each batch: estimate, submit, poll, apply.

::: code-group

```python [Python]
import os, time, requests

BASE = "https://apis.fotohub.app/v1/commerce"
HEADERS = {"Authorization": f"Bearer {os.environ['FOTOHUB_API_KEY']}"}
TERMINAL = {"completed", "completed_with_errors", "failed", "cancelled"}

def run_batch(connection_id, products, preset="fashion-studio"):
    est = requests.post(f"{BASE}/estimate", headers=HEADERS, json={
        "kind": "image_generate", "num_items": len(products),
    }).json()
    if not est["sufficient"]:
        raise RuntimeError(f"need ${est['total_usd']} USD")

    job = requests.post(f"{BASE}/jobs", headers=HEADERS, json={
        "connection_id": connection_id,
        "kind": "image_generate",
        "preset_slug": preset,
        "options": {"num_images": 1, "aspect_ratio": "1:1"},
        "items": [
            {
                "external_id": str(p["id"]),
                "sku": p["sku"],
                "product_context": {"title": p["name"], "category": p["category"]},
            }
            for p in products
        ],
        "idempotency_key": f"batch-{connection_id}-{len(products)}",
    }).json()

    while True:
        state = requests.get(f"{BASE}/jobs/{job['job_id']}", headers=HEADERS).json()
        if state["status"] in TERMINAL or state["status"] == "awaiting_funds":
            break
        time.sleep(5)

    items = requests.get(
        f"{BASE}/jobs/{job['job_id']}/items",
        headers=HEADERS, params={"status": "completed", "limit": 500},
    ).json()["items"]

    for item in items:
        # Store as a draft; let the merchant approve before it goes live.
        save_draft(item["external_id"], item["result"]["image_urls"])

    if state["failed_items"]:
        requests.post(f"{BASE}/jobs/{job['job_id']}/retry-failed", headers=HEADERS)
```

```typescript [TypeScript]
const BASE = "https://apis.fotohub.app/v1/commerce";
const headers = {
  Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}`,
  "Content-Type": "application/json",
};
const TERMINAL = ["completed", "completed_with_errors", "failed", "cancelled"];

export async function runBatch(connectionId: string, products: Product[]) {
  const est = await post("/estimate", {
    kind: "image_generate",
    num_items: products.length,
  });
  if (!est.sufficient) throw new Error(`need $${est.total_usd} USD`);

  const { job_id } = await post("/jobs", {
    connection_id: connectionId,
    kind: "image_generate",
    preset_slug: "fashion-studio",
    items: products.map((p) => ({
      external_id: String(p.id),
      sku: p.sku,
      product_context: { title: p.name, category: p.category },
    })),
    idempotency_key: `batch-${connectionId}-${products.length}`,
  });

  let state;
  do {
    await new Promise((r) => setTimeout(r, 5000));
    state = await get(`/jobs/${job_id}`);
  } while (!TERMINAL.includes(state.status) && state.status !== "awaiting_funds");

  const { items } = await get(`/jobs/${job_id}/items?status=completed&limit=500`);
  for (const item of items) await saveDraft(item.external_id, item.result);

  if (state.failed_items > 0) await post(`/jobs/${job_id}/retry-failed`, {});
  return state;
}

async function post(path: string, body: unknown) {
  const r = await fetch(BASE + path, { method: "POST", headers, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
}
async function get(path: string) {
  const r = await fetch(BASE + path, { headers });
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
}
```

```go [Go]
const base = "https://apis.fotohub.app/v1/commerce"

func call(method, path string, body any, out any) error {
	var buf io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		buf = bytes.NewBuffer(b)
	}
	req, _ := http.NewRequest(method, base+path, buf)
	req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("%s %s -> %d", method, path, resp.StatusCode)
	}
	if out != nil {
		return json.NewDecoder(resp.Body).Decode(out)
	}
	return nil
}

func RunBatch(connectionID string, items []item) error {
	var job struct{ JobID string `json:"job_id"` }
	if err := call("POST", "/jobs", map[string]any{
		"connection_id": connectionID,
		"kind":          "image_generate",
		"preset_slug":   "fashion-studio",
		"items":         items,
	}, &job); err != nil {
		return err
	}

	for {
		var state struct {
			Status      string `json:"status"`
			FailedItems int    `json:"failed_items"`
		}
		if err := call("GET", "/jobs/"+job.JobID, nil, &state); err != nil {
			return err
		}
		if state.Status != "queued" && state.Status != "processing" {
			if state.FailedItems > 0 {
				call("POST", "/jobs/"+job.JobID+"/retry-failed", nil, nil)
			}
			return nil
		}
		time.Sleep(5 * time.Second)
	}
}
```

```bash [cURL]
# 1. estimate
curl -sX POST $BASE/estimate -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"kind":"image_generate","num_items":3}'

# 2. submit
JOB=$(curl -sX POST $BASE/jobs -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"connection_id":"'$CONN'","kind":"image_generate","preset_slug":"fashion-studio",
       "items":[{"external_id":"1","product_context":{"title":"Linen shirt"}},
                {"external_id":"2","product_context":{"title":"Wool coat"}},
                {"external_id":"3","product_context":{"title":"Silk scarf"}}]}' \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["job_id"])')

# 3. poll
curl -s "$BASE/jobs/$JOB" -H "$AUTH"

# 4. collect
curl -s "$BASE/jobs/$JOB/items?status=completed" -H "$AUTH"
```

:::

## Related

- [Models catalog](/api/models) — every image model with capabilities and pricing
- [Image generation](/api/image-generation) — the underlying API for single interactive calls
- [Billing](/api/billing) — balance, top-ups and spending caps
- [Integrations overview](/integrations/overview) — which platforms ship a plugin today
