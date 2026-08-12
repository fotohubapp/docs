# Video Generation

Generate high-quality AI videos from text prompts or source images. FOTOhub provides access to 30+ video models across 6 providers, supporting text-to-video, image-to-video, reference-to-video, and video editing workflows. Generate clips up to 60 seconds, with configurable aspect ratios and resolutions up to 4K.

| | |
|---|---|
| **Models** | 30+ models from 6 providers |
| **Duration** | 2-60 seconds, model-dependent (longest single clip: 30s on `seedance-2-5`) |
| **Resolution** | 480p, 720p, 1080p, 4K (model-dependent) |
| **Modes** | Text-to-video, image-to-video, reference-to-video, video-to-video editing, native audio, lip-sync |

::: warning Canonical model catalog
The set of `model` IDs accepted below is served dynamically. Always query `GET /v1/models?category=video` for the authoritative, always-current list — see the [full Video Generation Models catalog](/api/models#video-generation-models) for pricing across every provider.
:::

## Endpoint

```
POST /v1/ai/generate/video
```

**Authentication:** Bearer token (API key)  
**Billing:** prepaid USD from your wallet — per second of output for most models ($0.017–$0.70/s), or per 1000 output tokens for the Seedance family. No credits.

## Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | **Yes** | — | Detailed description of the video to generate. Include subject, action, style, camera movement, and lighting for best results. |
| `model` | string | No | `"veo-3.1-generate-001"` | Video generation model to use. See [Model Pricing](#model-pricing) below or `GET /v1/models?category=video` for the full, current list. Examples: `"veo-3.1-generate-001"`, `"wan2.6-t2v"`, `"seedance-2-5"`, `"seedance-2-0-pro"`, `"kling-v3"`, `"sora-2"`, `"grok-imagine-video-1.5"`, `"gemini-omni-flash"`. |
| `duration` | integer | No | `5` | Whole seconds. Providers each accept their own set of lengths, so this is snapped to the nearest one they will render — and you are billed for the snapped value, never for what you asked. See [Duration is snapped before it is billed](#duration-is-snapped-before-it-is-billed). |
| `aspect_ratio` | string | No | `"16:9"` | Output aspect ratio. Options: `"16:9"` (landscape), `"9:16"` (portrait/vertical), `"1:1"` (square). |
| `image_url` | string | No | — | URL of a source image for image-to-video generation. When provided, the video will animate from this starting frame. Must be a publicly accessible URL or a FOTOhub storage URL. |
| `resolution` | string | No | `"1080p"` | Output video resolution. Options: `"720p"`, `"1080p"`, `"4k"` — availability depends on model (e.g. `veo-2.0-generate-001` is 720p-only; `gemini-omni-flash` is fixed at 720p). |

## Response Format

### Completed Response (200)

```json
{
  "model": "veo-3.1-generate-001",
  "cost_usd": 0.8,
  "currency": "USD",
  "billing": {
    "cost_usd": 0.8,
    "balance_usd": 41.732,
    "currency": "USD",
    "method": "wallet",
    "model": "prepaid"
  },
  "video_url": "https://s1.fotohub.app/storage/v1/object/public/generations/videos/vj_abc123.mp4",
  "job_id": "vj_abc123",
  "status": "completed",
  "duration": 4
}
```

`cost_usd` is what left your wallet, and `billing.balance_usd` is what is left in
it — read the balance to decide whether to dispatch the next job. There is no
credit field: `veo-3.1-generate-001` bills $0.20 per second, and the 4 seconds
here (Veo snaps 5 → 4, see [below](#duration-is-snapped-before-it-is-billed))
cost $0.80. `GET /v1/billing/usage` has the same figure per request if you need to
reconcile later.

### Processing Response (202)

Seedance models submit asynchronously and answer `202` with the charge already
applied, so the wallet figure is available before the render finishes:

```json
{
  "model": "seedance-2-0-mini",
  "job_id": "vj_abc123def456",
  "status": "queued",
  "cost_usd": 0.38115,
  "currency": "USD",
  "billing": {
    "cost_usd": 0.38115,
    "balance_usd": 41.35085,
    "currency": "USD",
    "method": "wallet",
    "model": "prepaid",
    "breakdown": {
      "currency": "USD",
      "rate_usd_per_second": 0.07623,
      "duration_seconds": 5,
      "resolution": "720p",
      "audio": false,
      "video_input": false,
      "amount_usd": 0.38115,
      "pricing_type": "per_second",
      "pricing_basis": "tokens",
      "output_tokens": 108900
    }
  },
  "duration": 5,
  "resolution": "720p",
  "estimated_seconds": 65,
  "poll_url": "https://apis.fotohub.app/v1/ai/generate/video/vj_abc123def456"
}
```

`billing.breakdown` is the authoritative money answer: it names the meter
(`pricing_basis`), the quantity billed in that meter's own unit, and the amount.
`rate_usd_per_second` is present on every model for convenience, but on a Seedance
render it is *derived* — $0.38115 ÷ 5 seconds — not the rate the price was
computed from. That rate is per 1000 output tokens and lives in
`GET /v1/pricing?model=seedance-2-0-mini`, alongside the token formula: 108 900
tokens × $0.0035 per 1000 is the $0.38115 above, and `output_tokens` in the
breakdown is there so you can redo that multiplication yourself.

::: info Asynchronous Processing
Video generation takes 30 seconds to several minutes depending on model, duration
and resolution. Poll `poll_url`, or pass `callback_url` and get the same body
POSTed to you once the job reaches a terminal state.
:::

## Model Pricing

Every price below is the provider's own rate, charged 1:1 in USD from your wallet.
Pricing for the most commonly used model per provider (see the [full catalog](/api/models#video-generation-models) for every variant, or `GET /v1/pricing?model=<id>` for one):

| Model | ID | $/second | A `duration: 5` request | Provider | Notes |
|-------|-----|---------:|------------------------:|----------|-------|
| Hailuo O2 | `hailuo-o2` | $0.017 | 6s → $0.102 | MiniMax | cheapest tier |
| Wan 2.2 Plus | `wan2.2-t2v-plus` | $0.02 | 5s → $0.10 | Alibaba | budget batch |
| Kling v2.5 Turbo | `kling-v2-5-turbo` | $0.026 | 5s → $0.13 | Kuaishou | |
| Hailuo 2.3 | `hailuo-2.3` | $0.047 | 6s → $0.282 | MiniMax | |
| Gemini Omni Flash | `gemini-omni-flash` | $0.1014 | 5s → $0.507 | Google | native audio, T2V+I2V |
| OpenAI Sora 2 | `sora-2` | $0.13 | 5s → $0.65 | OpenAI | |
| Grok Video 1.5 | `grok-imagine-video-1.5` | $0.14 | 5s → $0.70 | xAI | lip-sync |
| **Google Veo 3.1** | `veo-3.1-generate-001` | **$0.20** | 4s → $0.80 | Google | native audio, up to 4K |
| OpenAI Sora 2 Pro | `sora-2-pro` | $0.30 / $0.50 / $0.70 | 5s → $1.50 at 720p | OpenAI | priced per resolution |

The third column is the **snapped** duration and what it actually costs: Veo will
not render 5 seconds and Hailuo will not render fewer than 6, so those two bill a
different length than you asked for (see
[below](#duration-is-snapped-before-it-is-billed)).

`sora-2-pro` charges $0.30/s at 720p, $0.50/s at 1024p and $0.70/s at 1080p —
send `resolution` or you are billed the 1080p rate.

**Seedance is metered per 1000 output tokens**, not per second, because that is how
ByteDance bills it. A 5-second 720p render is $0.38115 on `seedance-2-0-mini` and
$1.16523 on `seedance-2-5`; the full rate table, the token formula and worked
examples are in the [pricing guide](/guides/pricing#seedance-priced-per-output-token).

::: tip Recommended Model
**`veo-3.1-generate-001`** offers the best balance of quality, native audio, and features (last-frame + reference images) for most use cases. Use **`wan2.2-t2v-plus`** or **`wan2.2-i2v-plus`** for budget-conscious batch processing, or **`gemini-omni-flash`** when you want native audio without Veo's higher per-second cost. For anything longer than 15 seconds, **`seedance-2-5`** is the only single-request option — see [Seedance 2.5](#seedance-2-5-long-clips-video-editing) below.
:::

### Cost Scaling by Duration

Every per-second model bills `rate × duration`, so the cost of a clip is linear in
its length:

| Duration | `wan2.2-t2v-plus` ($0.02/s) | `sora-2` ($0.13/s) | `veo-3.1-generate-001` ($0.20/s) |
|----------|----------------------------:|-------------------:|---------------------------------:|
| 4 seconds | $0.08 | $0.52 | $0.80 |
| 8 seconds | $0.16 | $1.04 | $1.60 |
| 10 seconds | $0.20 | $1.30 | — (Veo caps at 8s) |
| 15 seconds | $0.30 | — (Sora 2 caps at 12s) | — |

::: info Formula
`total_usd = rate_usd_per_second × billed_duration`

`billed_duration` is the **snapped** length (see below), not what you asked for.
The Seedance family is metered per output token instead — the formula for that one
is in the [pricing guide](/guides/pricing#seedance-priced-per-output-token).
:::

### Duration is snapped before it is billed

No provider renders an arbitrary length. Each accepts its own set, so `duration` is snapped to the nearest value the model will actually produce, and the charge is computed from the **snapped** number. A tie goes to the shorter option, so an ambiguous request is never rounded up into a bigger bill.

| Model family | Accepts | A request for 5s becomes |
|--------------|---------|--------------------------|
| Veo (all) | 4, 6, 8 | **4s** — billed 4s |
| Kling (all) | 5, 10 | 5s |
| Sora 2 | up to 12 (`sora-2-pro`: 25) | 5s |
| Grok | up to 15 | 5s |
| Wan (all) | up to 10 | 5s |
| Hailuo | 6, 10 | **6s** — billed 6s, the only family that snaps *up* |
| Seedance | 2.0: 4–15, 1.x: 5–10, `seedance-2-5`: up to 30 | 5s |

The `duration` field in the response is always the length that was rendered and billed, so reconcile against that rather than against your request. Asking Veo for 5 seconds returns `"duration": 4`, and a 4-second file.

Hailuo is the one case where the snap can *raise* the bill. It renders nothing
shorter than 6 seconds, so there is no shorter option to fall back to: a
`duration: 5` request on `hailuo-2.3` bills 6 seconds at $0.047 — $0.282, not
$0.235. Send 6 or 10 and there is no surprise.

### Failures do not cost money

The wallet is charged when the job is submitted and refunded automatically if the generation does not produce a file:

- **Refused before the provider is called** — an empty wallet (`402`), an unknown model or a bad parameter. Nothing was ever taken, so there is nothing to give back.
- **Rejected at submit** (provider out of capacity, credentials, upstream 4xx) — the charge is reversed first and the error message then ends with `No charge was made for this request.`
- **Failed after submit** — the failure appears on the next poll with `"refunded": true`. Typically within seconds of the provider giving up.
- **Never finished** — a job still `processing` 20 minutes after submit is declared failed on your next poll and refunded then.

The refund happens once per job. Polling a failed job repeatedly returns `"refunded": false` on every call after the first; that means "already refunded", not "not refunded" — check `GET /v1/billing/usage` if you need the ledger entry.

::: warning Read the sentence, not the status code
`No charge was made for this request.` is only appended when the reversal actually
committed. If a refund could not be completed, the message says so instead — *"Your
wallet was charged but the generation failed — contact support"* — and there is a
real debit to reclaim. Never infer a refund from the error code alone.
:::

## Model Comparison

| Model | Provider | Price | Max Duration | Resolution | Audio | Key Features |
|-------|----------|-------|:------------:|:----------:|:-----:|--------------|
| `veo-3.1-generate-001` | Google | $0.20/s | 8s | 4K | native | last-frame, reference images |
| `gemini-omni-flash` | Google | $0.1014/s | 10s | 720p | native (automatic) | reference-to-video |
| `wan2.2-t2v-plus` / `-i2v-plus` | Alibaba | $0.02/s | 10s | 1080p | none | cheapest, artistic |
| `kling-v3` | Kuaishou | $0.077/s | 10s | 1080p | optional | realistic motion |
| `hailuo-o2` | MiniMax | $0.017/s | 10s | 1080p | none | first+last frame |
| `seedance-2-5` | ByteDance | $0.0107 / 1K tokens | **30s** | 720p | native, **included** | longest single clip, video-to-video editing, 30 image + 10 video + 10 audio references |
| `seedance-2-0-pro` | ByteDance | $0.004–$0.0077 / 1K tokens | 15s | 4K | native | highest Seedance resolution |
| `sora-2` | OpenAI | $0.13/s | 12s | 1080p | native | physics-accurate |
| `grok-imagine-video-1.5` | xAI | $0.14/s | 15s | 1080p | none | **lip-sync** generation |

::: tip Choosing a Model
- **Best overall**: `veo-3.1-generate-001` -- native audio, high quality, competitive price
- **Maximum quality**: `veo-3.1-generate-001` or `sora-2` -- ultra-quality output, cinematic results
- **Longest clip / video editing**: `seedance-2-5` -- 4-30s in a single request, audio at no extra cost
- **Highest Seedance resolution**: `seedance-2-0-pro` -- up to 4K (2.5 tops out at 720p)
- **Budget batch processing**: `wan2.2-t2v-plus` / `wan2.2-i2v-plus` -- lowest cost per second
- **Native audio without Veo**: `gemini-omni-flash` -- automatic audio, no surcharge tier
- **Lip-sync generation**: `grok-imagine-video-1.5` -- portrait + script → talking head
:::

## Code Examples

### Text-to-Video

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/video",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "A golden retriever running through a sunlit meadow, "
                  "cinematic slow motion, shallow depth of field, "
                  "warm afternoon light, shot on 35mm film",
        "model": "veo-3.1-generate-001",
        "duration": 5,
        "aspect_ratio": "16:9",
        "resolution": "1080p"
    }
)

result = response.json()
print(f"Video URL: {result['video_url']}")
print(f"Charged: ${result['cost_usd']} — balance ${result['billing']['balance_usd']}")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/video",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "A golden retriever running through a sunlit meadow, " +
              "cinematic slow motion, shallow depth of field, " +
              "warm afternoon light, shot on 35mm film",
      model: "veo-3.1-generate-001",
      duration: 5,
      aspect_ratio: "16:9",
      resolution: "1080p",
    }),
  }
);

const result = await response.json();
console.log("Video URL:", result.video_url);
console.log(`Charged: $${result.cost_usd} — balance $${result.billing.balance_usd}`);
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
	payload := map[string]interface{}{
		"prompt":       "A golden retriever running through a sunlit meadow, cinematic slow motion, shallow depth of field, warm afternoon light, shot on 35mm film",
		"model":        "veo-3.1-generate-001",
		"duration":     5,
		"aspect_ratio": "16:9",
		"resolution":   "1080p",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/video", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	fmt.Printf("Video URL: %s\n", result["video_url"])
	fmt.Printf("Charged: $%v\n", result["cost_usd"])
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A golden retriever running through a sunlit meadow, cinematic slow motion, shallow depth of field, warm afternoon light, shot on 35mm film",
    "model": "veo-3.1-generate-001",
    "duration": 5,
    "aspect_ratio": "16:9",
    "resolution": "1080p"
  }'
```

:::

### Image-to-Video

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/video",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "The subject slowly turns their head and smiles, "
                  "gentle breeze moves their hair, soft natural lighting",
        "model": "kling-v3",
        "duration": 5,
        "aspect_ratio": "9:16",
        "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/portrait.jpg"
    }
)

result = response.json()
if result["status"] == "processing":
    print(f"Job queued: {result['job_id']}")
    print("Poll GET /v1/ai/generate/video/{job_id} for completion")
else:
    print(f"Video ready: {result['video_url']}")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/video",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "The subject slowly turns their head and smiles, " +
              "gentle breeze moves their hair, soft natural lighting",
      model: "kling-v3",
      duration: 5,
      aspect_ratio: "9:16",
      image_url: "https://s1.fotohub.app/storage/v1/object/public/uploads/portrait.jpg",
    }),
  }
);

const result = await response.json();
if (result.status === "processing") {
  console.log(`Job queued: ${result.job_id}`);
  console.log("Poll GET /v1/ai/generate/video/{job_id} for completion");
} else {
  console.log(`Video ready: ${result.video_url}`);
}
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
	payload := map[string]interface{}{
		"prompt":       "The subject slowly turns their head and smiles, gentle breeze moves their hair, soft natural lighting",
		"model":        "kling-v3",
		"duration":     5,
		"aspect_ratio": "9:16",
		"image_url":    "https://s1.fotohub.app/storage/v1/object/public/uploads/portrait.jpg",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/video", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	if result["status"] == "processing" {
		fmt.Printf("Job queued: %s\n", result["job_id"])
		fmt.Println("Poll GET /v1/ai/generate/video/{job_id} for completion")
	} else {
		fmt.Printf("Video ready: %s\n", result["video_url"])
	}
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "The subject slowly turns their head and smiles, gentle breeze moves their hair, soft natural lighting",
    "model": "kling-v3",
    "duration": 5,
    "aspect_ratio": "9:16",
    "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/portrait.jpg"
  }'
```

:::

### High-Resolution (4K)

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/video",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Aerial drone shot of a coastal city at sunset, "
                  "golden hour lighting, waves crashing against cliffs, "
                  "smooth camera pan from left to right, hyperrealistic",
        "model": "veo-3.1-generate-001",
        # Veo renders 4, 6 or 8 seconds — 8 is its longest, and $1.60 at $0.20/s
        "duration": 8,
        "aspect_ratio": "16:9",
        "resolution": "4k"
    }
)

result = response.json()
# 4K generations may take longer; check status
if result["status"] == "processing":
    print(f"Processing job: {result['job_id']}")
    print(f"Estimated wait: 2-5 minutes for 4K")
else:
    print(f"Video URL: {result['video_url']}")
    print(f"Charged: ${result['cost_usd']} for {result['duration']}s")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/video",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "Aerial drone shot of a coastal city at sunset, " +
              "golden hour lighting, waves crashing against cliffs, " +
              "smooth camera pan from left to right, hyperrealistic",
      model: "veo-3.1-generate-001",
      // Veo renders 4, 6 or 8 seconds — 8 is its longest, and $1.60 at $0.20/s
      duration: 8,
      aspect_ratio: "16:9",
      resolution: "4k",
    }),
  }
);

const result = await response.json();
// 4K generations may take longer; check status
if (result.status === "processing") {
  console.log(`Processing job: ${result.job_id}`);
  console.log("Estimated wait: 2-5 minutes for 4K");
} else {
  console.log(`Video URL: ${result.video_url}`);
  console.log(`Charged: $${result.cost_usd} for ${result.duration}s`);
}
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
	payload := map[string]interface{}{
		"prompt":       "Aerial drone shot of a coastal city at sunset, golden hour lighting, waves crashing against cliffs, smooth camera pan from left to right, hyperrealistic",
		"model": "veo-3.1-generate-001",
		// Veo renders 4, 6 or 8 seconds — 8 is its longest, and $1.60 at $0.20/s
		"duration":     8,
		"aspect_ratio": "16:9",
		"resolution":   "4k",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/video", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	// 4K generations may take longer; check status
	if result["status"] == "processing" {
		fmt.Printf("Processing job: %s\n", result["job_id"])
		fmt.Println("Estimated wait: 2-5 minutes for 4K")
	} else {
		fmt.Printf("Video URL: %s\n", result["video_url"])
		fmt.Printf("Charged: $%v for %vs\n", result["cost_usd"], result["duration"])
	}
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Aerial drone shot of a coastal city at sunset, golden hour lighting, waves crashing against cliffs, smooth camera pan from left to right, hyperrealistic",
    "model": "veo-3.1-generate-001",
    "duration": 8,
    "aspect_ratio": "16:9",
    "resolution": "4k"
  }'
```

:::

### Video with Audio (Veo 3.1 / Gemini Omni Flash)

Two model families generate synchronized audio alongside the video -- ambient sounds, speech, and music are produced automatically based on the scene described in your prompt. No separate audio generation step is required.

- **`veo-3.1-generate-001`** (and other Veo 3.x models) -- audio is opt-in via the `audio: true` flag, billed at a higher per-second rate (audio tier vs. silent tier).
- **`gemini-omni-flash`** -- audio is generated automatically on every clip, no flag needed and no separate billing tier.

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/video",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "A street musician playing acoustic guitar in a busy market, "
                  "crowd chatter and footsteps in background, warm string tones, "
                  "camera slowly dollies in on the performer's hands",
        "model": "veo-3.1-generate-001",
        "duration": 10,
        "aspect_ratio": "16:9",
        "resolution": "1080p",
        "audio": True
    }
)

result = response.json()
if result["status"] == "completed":
    print(f"Video with audio: {result['video_url']}")
    print(f"Audio included: {result.get('has_audio', True)}")
else:
    print(f"Processing: {result['job_id']}")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/video",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "A street musician playing acoustic guitar in a busy market, " +
              "crowd chatter and footsteps in background, warm string tones, " +
              "camera slowly dollies in on the performer's hands",
      model: "veo-3.1-generate-001",
      duration: 10,
      aspect_ratio: "16:9",
      resolution: "1080p",
      audio: true,
    }),
  }
);

const result = await response.json();
if (result.status === "completed") {
  console.log("Video with audio:", result.video_url);
  console.log("Audio included:", result.has_audio ?? true);
} else {
  console.log(`Processing: ${result.job_id}`);
}
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
	payload := map[string]interface{}{
		"prompt":       "A street musician playing acoustic guitar in a busy market, crowd chatter and footsteps in background, warm string tones, camera slowly dollies in on the performer's hands",
		"model":        "veo-3.1-generate-001",
		"duration":     10,
		"aspect_ratio": "16:9",
		"resolution":   "1080p",
		"audio":        true,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/video", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	if result["status"] == "completed" {
		fmt.Printf("Video with audio: %s\n", result["video_url"])
	} else {
		fmt.Printf("Processing: %s\n", result["job_id"])
	}
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A street musician playing acoustic guitar in a busy market, crowd chatter and footsteps in background, warm string tones, camera slowly dollies in on the performers hands",
    "model": "veo-3.1-generate-001",
    "duration": 10,
    "aspect_ratio": "16:9",
    "resolution": "1080p",
    "audio": true
  }'
```

:::

::: info Veo / Omni Audio Generation
When `audio: true` is set with a Veo 3.x model, or automatically with `gemini-omni-flash`, the audio track is scene-appropriate and synchronized to the visual content. This includes:
- **Ambient sounds** -- environment noise matching the scene (traffic, wind, crowd)
- **Sound effects** -- action-triggered audio (footsteps, impacts, splashes)
- **Speech** -- if characters are talking in the prompt, dialogue is generated
- **Music** -- if musical instruments or singing are described

The output MP4 includes a full AAC audio track. Audio generation adds approximately 15-30 seconds to processing time. Other models (`veo-2.0-generate-001`, `kling-v3`, `wan2.2-t2v-plus`, etc.) produce silent video by default.
:::

---

## Seedance 2.5 — long clips, video editing

`seedance-2-5` is the only model on the platform that produces a **30-second clip in
a single request**, and the only one that takes an existing video as input. It is
also the one Seedance tier where **native audio costs nothing extra** — the
per-second rate is identical with `generate_audio` on or off.

| | |
|---|---|
| **Model ID** | `seedance-2-5` |
| **Duration** | any integer **4-30** seconds (`3` and `31` are rejected with a 400) |
| **Resolution** | `480p`, `720p` — **1080p and 4K are not supported** and return a 400 |
| **Frame rate** | 24 fps |
| **Price** | **$0.0107 per 1000 output tokens**, at either resolution |
| **Price with a video reference** | **$0.0064 per 1000 tokens** — an edit is *cheaper* than a fresh render |
| **Audio** | native, **included in the price** |
| **References** | up to **30 images**, **10 videos**, **10 audio clips** |
| **Output container** | `mp4` (default) or `mov` |
| **Mode** | asynchronous — returns `202` + `job_id`, poll or use a webhook |

The rate is flat per token, so resolution and duration reach the price through the
token count: `tokens = floor(tokens_per_frame × (24 × seconds + 1))`, where
`tokens_per_frame` is 400.3125 at 480p and 900 at 720p.

| What | Tokens | Cost |
|------|-------:|-----:|
| 30s @ 720p | 648 900 | **$6.943230** |
| 30s @ 480p | 288 625 | $3.088288 |
| 30s @ 720p from a source video | 648 900 | $4.152960 |
| 5s @ 720p | 108 900 | $1.165230 |
| 5s @ 480p | 48 437 | $0.518276 |

Draft at 480p and finish at 720p: a 5-second 480p test is 52 cents against $6.94
for the finished 30-second clip. `POST /v1/billing/estimate` prices an exact
duration if you would rather not do the arithmetic.

::: warning 720p ceiling
2.5 is not a superset of 2.0 Pro. It reaches 30 seconds but stops at 720p, while
`seedance-2-0-pro` reaches 4K but stops at 15 seconds. Sending `resolution: "1080p"`
to `seedance-2-5` returns a 400 rather than silently downgrading, because the price
scales with resolution and a silent downgrade would mean charging for pixels you
never received.
:::

### Parameters (Seedance-only)

These are accepted in addition to the [standard parameters](#request-parameters) above.

| Parameter | Type | Description |
|-----------|------|-------------|
| `generate_audio` | boolean | Native soundtrack. Free on 2.5 — the per-second rate is the same either way. Alias: `audio`. |
| `image_url` | string | First frame (image-to-video). |
| `last_frame_url` | string | Final frame. With `image_url` this becomes a first+last frame interpolation. |
| `reference_images` | array | Up to 30. URLs, or `{"mimeType": "...", "base64": "..."}` objects. |
| `reference_videos` | array | Up to 10. Attaching one switches the request to reference / editing / extension mode. |
| `reference_audios` | array | Up to 10. Requires at least one image or video reference. |
| `asset_ids` | array | Pre-registered `asset://` portrait IDs — see [face consistency](#face-consistency-asset-ids). |
| `output_format` | string | `"mp4"` (default) or `"mov"`. |
| `smart_ratio` | boolean | Let the model pick the aspect ratio. Equivalent to `aspect_ratio: "adaptive"`. |
| `smart_duration` | boolean | Let the model pick the duration. Equivalent to `duration: -1`. |
| `callback_url` | string | HTTPS URL POSTed once the job reaches a terminal state, with the same body as the poll route. Retried at 1s/2s/4s on a non-2xx, then dropped. Alias: `webhook_url`. |
| `negative_prompt` | string | Recorded on the job. |
| `seed` | integer | Recorded on the job. |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `21:9`, or `adaptive`. |

`quality` (alias of `resolution`), `image_urls` (`[first]` or `[first, last]`),
`video_urls` and `audio_urls` are accepted as aliases so an integration written
against a Seedance reseller's API works by changing only the base URL and key.

### Task types and locked parameters

2.5 infers what you are asking for from the prompt and the attached media, and three
of the five task types then **fix** `aspect_ratio` (and for editing, `duration`) to
whatever the input clip has. FOTOhub resolves those locks before billing and returns
the effective values on the `202`, so you are charged for what is actually rendered.

| Task type | Triggered by | Locked |
|-----------|--------------|--------|
| `t2v` | prompt only | — |
| `reference` | any image / video / `asset_ids` attached | — |
| `frames` | `image_url` and/or `last_frame_url` | `aspect_ratio` → `adaptive` |
| `editing` | a reference video + edit wording ("remove the…", "replace the…") | `aspect_ratio` → `adaptive`, `duration` → source length |
| `extension` | a reference video + extension wording ("extend forward", "continue the video") | `aspect_ratio` → `adaptive` |

The `202` response includes `"task_type"` so you can confirm which one was inferred.

::: tip duration: -1
Send `duration: -1` (or `smart_duration: true`) to match the source clip's length.
Because the real length is unknown until the clip is decoded, the request is billed
at the 30-second ceiling and `duration_requested: -1` is echoed back on the `202`.
:::

### Generate a 30-second clip

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

video = client.generate_seedance(
    prompt=(
        "A chef plates a dish in a warm restaurant kitchen: hands dust herbs over "
        "seared scallops, steam rises, the camera pushes in slowly. Ambient kitchen "
        "sounds and a low jazz bed."
    ),
    model="seedance-2-5",
    duration=30,
    resolution="720p",
    aspect_ratio="16:9",
    generate_audio=True,
)

print(video["video_url"])       # already finished — submit + poll handled for you
print(video["cost_usd"])        # 6.94323
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const video = await client.generateSeedance({
  prompt:
    "A chef plates a dish in a warm restaurant kitchen: hands dust herbs over " +
    "seared scallops, steam rises, the camera pushes in slowly. Ambient kitchen " +
    "sounds and a low jazz bed.",
  model: "seedance-2-5",
  duration: 30,
  resolution: "720p",
  aspect_ratio: "16:9",
  generate_audio: true,
});

console.log(video.video_url);    // already finished
console.log(video.cost_usd);     // 6.94323
```

```bash [cURL]
# Submit — returns 202 with a job_id and poll_url
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A chef plates a dish in a warm restaurant kitchen, steam rising, camera pushes in slowly",
    "model": "seedance-2-5",
    "duration": 30,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": true
  }'

# Poll until status is "completed"
curl "https://apis.fotohub.app/v1/ai/generate/video/vj_abc123def456" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

Submit response (`202`):

```json
{
  "model": "seedance-2-5",
  "job_id": "8f1c2d3e-4b5a-6c7d-8e9f-0a1b2c3d4e5f",
  "status": "queued",
  "cost_usd": 6.94323,
  "currency": "USD",
  "billing": {
    "cost_usd": 6.94323,
    "balance_usd": 34.78762,
    "currency": "USD",
    "method": "wallet",
    "model": "prepaid",
    "breakdown": {
      "currency": "USD",
      "rate_usd_per_second": 0.231441,
      "duration_seconds": 30,
      "resolution": "720p",
      "audio": true,
      "video_input": false,
      "amount_usd": 6.94323,
      "pricing_type": "per_second",
      "pricing_basis": "tokens",
      "output_tokens": 648900
    }
  },
  "duration": 30,
  "resolution": "720p",
  "aspect_ratio": "16:9",
  "generate_audio": true,
  "task_type": "t2v",
  "estimated_seconds": 240,
  "poll_url": "https://apis.fotohub.app/v1/ai/generate/video/8f1c2d3e-4b5a-6c7d-8e9f-0a1b2c3d4e5f"
}
```

### Edit an existing video

Attach a reference video and describe the change. The output keeps the source
geometry and length, so `aspect_ratio` and `duration` are resolved for you.

```bash
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Replace the grey sky with a clear blue sky and warm afternoon light",
    "model": "seedance-2-5",
    "resolution": "720p",
    "reference_videos": ["https://s1.fotohub.app/storage/v1/object/public/videos/source.mp4"],
    "duration": -1
  }'
```

The response reports `"task_type": "editing"` and `"aspect_ratio": "adaptive"`.

### Extend an existing video

Same shape, extension wording instead:

```bash
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Extend forward: the camera continues past the doorway into a sunlit courtyard",
    "model": "seedance-2-5",
    "duration": 10,
    "resolution": "720p",
    "reference_videos": ["https://s1.fotohub.app/storage/v1/object/public/videos/source.mp4"]
  }'
```

::: info A video reference costs less, not more
When the request carries a video input, ByteDance charges its input rate instead of
the output one — **$0.0064 per 1000 tokens rather than $0.0107** — and the token
count does not change. So the same 30-second 720p clip is $4.152960 as an edit
against $6.943230 as a fresh render. Image and audio references do not change the
rate. The `video_input: true` flag in `billing.breakdown` is what tells you the
lower rate applied.
:::

### Face consistency (asset IDs)

Register a portrait once, then reuse it across generations so the same face appears
in every clip:

```bash
# 1. Register (free — returns {asset_id, uri, status, retention_hours, expires_at})
curl -X POST "https://apis.fotohub.app/v1/ai/assets/register" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://s1.fotohub.app/storage/v1/object/public/photos/face.jpg"}'

# 2. Reuse it
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "The same woman walks through a night market, neon reflections on wet pavement",
    "model": "seedance-2-5",
    "duration": 15,
    "resolution": "720p",
    "asset_ids": ["asset://..."]
  }'
```

The `image_url` must be an HTTPS URL on a FOTOhub host — upload the file first. Asset
IDs are scoped to your account and rejected with a 400 if they belong to someone else.

::: warning Two flags are refused, not ignored
`content_filter: false` and `web_search: true` return a `400`. The upstream provider
accepts any unknown field with a 200, so neither flag does anything — accepting them
silently would let you build on a guarantee that does not exist. `content_filter: true`
is accepted, since standard moderation is what already happens.
:::

### Managing registered faces

A registered virtual portrait is biometric data, and it is treated that way end to
end: it is scoped to your account, it can be listed, and it can be erased on demand
rather than living forever once registered.

#### Automatic expiry: `retention_hours`

Pass an optional `retention_hours` (integer, 1-8760) on `POST /v1/ai/assets/register`
to have the asset delete itself, at the provider and in our records, once it elapses
— use it to honour a data-minimisation policy or a time-boxed consent without having
to remember to call `DELETE` yourself:

```bash
curl -X POST "https://apis.fotohub.app/v1/ai/assets/register" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://s1.fotohub.app/storage/v1/object/public/photos/face.jpg",
    "retention_hours": 24
  }'
```

```json
{
  "asset_id": "as_9f3c1a2b",
  "uri": "asset://as_9f3c1a2b",
  "status": "Active",
  "source_url": "https://s1.fotohub.app/storage/v1/object/public/photos/face.jpg",
  "retention_hours": 24,
  "expires_at": "2026-08-11T14:00:00Z"
}
```

Omit `retention_hours` and the face is kept until you delete it — the field is
opt-in so an existing integration does not silently start losing faces it depends
on. A background sweep runs every 15 minutes and deletes anything past its
`expires_at`, so expiry is eventually consistent within that window rather than
exact to the second.

#### List your registered faces

```
GET /v1/ai/assets?limit=50&offset=0
```

```bash
curl "https://apis.fotohub.app/v1/ai/assets" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

```json
{
  "assets": [
    {
      "asset_id": "as_9f3c1a2b",
      "uri": "asset://as_9f3c1a2b",
      "source_url": "https://s1.fotohub.app/storage/v1/object/public/photos/face.jpg",
      "asset_type": "Image",
      "status": "Active",
      "source": "public_api",
      "created_at": "2026-08-10T14:00:00Z",
      "retention_hours": 24,
      "expires_at": "2026-08-11T14:00:00Z",
      "purged_at": null
    }
  ],
  "count": 1
}
```

`GET /v1/ai/assets/{asset_id}` returns the same shape for one asset, with its
live status re-checked against the provider.

A `purged_at` timestamp means the face is gone, and it is the final state: the
provider is not re-queried for an erased asset, so the status stays `Deleted`.
`source_url` is cleared at the same time and comes back `null`, so a purged
record cannot be used to reconstruct what was erased.

#### Delete a registered face

```
DELETE /v1/ai/assets/{asset_id}
```

```bash
curl -X DELETE "https://apis.fotohub.app/v1/ai/assets/as_9f3c1a2b" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

Use this to honour an erasure request immediately, rather than waiting on
`retention_hours` or on the asset simply never being reused. The delete happens
at the provider first; the local record is only marked erased once that is
confirmed — so a `200` here means the face is actually gone, not just that we
intend to remove it.

```json
{ "asset_id": "as_9f3c1a2b", "deleted": true, "reason": "deleted" }
```

| Response | Meaning |
|---|---|
| `200 {"deleted": true, "reason": ...}` | Erased just now. |
| `200 {"deleted": true, "already_deleted": true}` | Already erased (by a prior call or by the retention sweep) — deleting twice is not an error. |
| `404` | No asset with that id on your account. Matches `GET` — confirming an id exists for someone else would leak the shared asset pool. |
| `502` | The provider delete failed. Nothing was recorded as deleted, so the asset is untouched and safe to retry. |

::: tip Retrying a 502
A `502` means the face is unchanged — not partially deleted, not deleted locally
but not upstream. Retry the same `DELETE` call; there is no cleanup step to run
first.
:::

---

## Asynchronous Jobs

Video generation is computationally intensive and may take 30 seconds to several minutes depending on model, duration, and resolution. When a generation is still in progress, the API returns a `job_id` with status `"processing"`. You can either poll for completion or use webhooks.

### Poll Endpoint

```
GET /v1/ai/generate/video/{job_id}
```

`status` is one of `processing`, `completed`, or `failed` — the same three values for every provider, so you do not have to know which backend rendered your clip.

A `failed` response also carries `refunded`:

```json
{
  "job_id": "1218d1a9-19ea-48cd-ba2c-f60568d41a50",
  "model": "wan2.2-i2v-flash",
  "status": "failed",
  "error": "Image height or width is too small than 240",
  "refunded": true
}
```

`"refunded": true` means the charge for this job is back in your wallet. On every later poll of the same job it reads `false`, because the reversal already happened — see [Failures do not cost money](#failures-do-not-cost-money).

### Submit and Poll Pattern

The recommended pattern is: submit the generation request, receive a `job_id`, then poll until completion. This avoids HTTP timeouts on long-running generations.

::: code-group

```python [Python]
import requests
import time

# Step 1: Submit generation request
response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/video",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Cinematic aerial shot of a mountain range at sunrise, "
                  "volumetric fog in valleys, golden light on peaks, drone flyover",
        "model": "veo-3.1-generate-001",
        "duration": 8,
        "resolution": "4k"
    }
)

result = response.json()
job_id = result["job_id"]
# The charge is on the SUBMIT response, not the poll — the wallet was debited
# when the job was accepted.
print(f"Job submitted: {job_id} — charged ${result['cost_usd']}")

# Step 2: Poll for completion
while True:
    status_response = requests.get(
        f"https://apis.fotohub.app/v1/ai/generate/video/{job_id}",
        headers={"Authorization": "Bearer fh_live_your_api_key"}
    )
    job = status_response.json()

    if job["status"] == "completed":
        print(f"Video ready: {job['video_url']}")
        break
    elif job["status"] == "failed":
        refunded = job.get("refunded")
        print(f"Generation failed: {job['error']} (refunded: {refunded})")
        break
    else:
        print(f"Still processing... ({job.get('progress', 0)}%)")
        time.sleep(3)
```

```typescript [TypeScript]
// Step 1: Submit generation request
const submitResponse = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/video",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "Cinematic aerial shot of a mountain range at sunrise, " +
              "volumetric fog in valleys, golden light on peaks, drone flyover",
      model: "veo-3.1-generate-001",
      duration: 8,
      resolution: "4k",
    }),
  }
);

// The charge lands on the SUBMIT response — the wallet was debited when the job
// was accepted, not when it finished.
const { job_id: jobId, cost_usd: costUsd } = await submitResponse.json();
console.log(`Job submitted: ${jobId} — charged $${costUsd}`);

// Step 2: Poll for completion
async function pollJob(id: string): Promise<string> {
  while (true) {
    const res = await fetch(
      `https://apis.fotohub.app/v1/ai/generate/video/${id}`,
      { headers: { "Authorization": "Bearer fh_live_your_api_key" } }
    );
    const job = await res.json();

    if (job.status === "completed") {
      return job.video_url;
    } else if (job.status === "failed") {
      throw new Error(`${job.error} (refunded: ${job.refunded})`);
    }

    console.log(`Processing... ${job.progress ?? 0}%`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

const videoUrl = await pollJob(jobId);
console.log("Video ready:", videoUrl);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type JobResponse struct {
	JobID    string  `json:"job_id"`
	Status   string  `json:"status"`
	VideoURL string  `json:"video_url"`
	CostUSD  float64 `json:"cost_usd"`
	Progress int     `json:"progress"`
	Refunded bool    `json:"refunded"`
	Error    string  `json:"error"`
}

func main() {
	// Step 1: Submit generation request
	payload := map[string]interface{}{
		"prompt":     "Cinematic aerial shot of a mountain range at sunrise, volumetric fog in valleys, golden light on peaks, drone flyover",
		"model":      "veo-3.1-generate-001",
		"duration":   8,
		"resolution": "4k",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/video", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var submitResult JobResponse
	json.NewDecoder(resp.Body).Decode(&submitResult)
	// The charge is on the submit response, not the poll.
	fmt.Printf("Job submitted: %s — charged $%v\n", submitResult.JobID, submitResult.CostUSD)

	// Step 2: Poll with goroutine using time.NewTicker
	done := make(chan JobResponse)
	go func() {
		ticker := time.NewTicker(3 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			pollReq, _ := http.NewRequest("GET",
				fmt.Sprintf("https://apis.fotohub.app/v1/ai/generate/video/%s", submitResult.JobID), nil)
			pollReq.Header.Set("Authorization", "Bearer fh_live_your_api_key")

			pollResp, err := http.DefaultClient.Do(pollReq)
			if err != nil {
				continue
			}

			var job JobResponse
			json.NewDecoder(pollResp.Body).Decode(&job)
			pollResp.Body.Close()

			if job.Status == "completed" || job.Status == "failed" {
				done <- job
				return
			}
			fmt.Printf("Processing... %d%%\n", job.Progress)
		}
	}()

	// Wait for result
	finalJob := <-done
	if finalJob.Status == "completed" {
		fmt.Printf("Video ready: %s\n", finalJob.VideoURL)
	} else {
		fmt.Printf("Generation failed: %s (refunded: %v)\n", finalJob.Error, finalJob.Refunded)
	}
}
```

```bash [cURL]
# Step 1: Submit generation request
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Cinematic aerial shot of a mountain range at sunrise, volumetric fog in valleys, golden light on peaks, drone flyover",
    "model": "veo-3.1-generate-001",
    "duration": 8,
    "resolution": "4k"
  }'

# Response: {"job_id": "vj_abc123def456", "status": "processing", "cost_usd": 1.6, ...}

# Step 2: Poll for completion (repeat every 3 seconds)
curl -X GET "https://apis.fotohub.app/v1/ai/generate/video/vj_abc123def456" \
  -H "Authorization: Bearer fh_live_your_api_key"

# Response when completed:
# {
#   "job_id": "vj_abc123def456",
#   "status": "completed",
#   "progress": 100,
#   "video_url": "https://s1.fotohub.app/storage/v1/object/public/generations/videos/vj_abc123def456.mp4",
#   "duration": 8
# }
#
# The money is on the SUBMIT response, not here. Seedance jobs are the exception:
# their poll also carries cost_usd, because a `duration: -1` edit can be settled
# down to the delivered length once the source clip has been decoded.
```

:::

### Job Status Values

| Status | Description |
|--------|-------------|
| `processing` | Video is being generated. Poll again in 3 seconds. |
| `completed` | Video is ready. The `video_url` field contains the download link. |
| `failed` | Generation failed. The `error` field contains the reason. |

## Webhook Notifications

Instead of polling, you can receive real-time notifications when video generation completes. Configure a webhook endpoint in your [account settings](https://fotohub.app/settings/api) or pass `webhook_url` in the request body.

### Webhook Setup

::: code-group

```python [Python]
import requests

# Submit video with webhook URL
response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/video",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "A futuristic city skyline at night, neon reflections on wet streets",
        "model": "veo-3.1-generate-001",
        "duration": 10,
        "webhook_url": "https://your-server.com/webhooks/fotohub"
    }
)

result = response.json()
print(f"Job submitted: {result['job_id']}")
print("You will receive a POST to your webhook when ready")
```

```typescript [TypeScript]
// Submit video with webhook URL
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/video",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "A futuristic city skyline at night, neon reflections on wet streets",
      model: "veo-3.1-generate-001",
      duration: 10,
      webhook_url: "https://your-server.com/webhooks/fotohub",
    }),
  }
);

const result = await response.json();
console.log(`Job submitted: ${result.job_id}`);
console.log("You will receive a POST to your webhook when ready");
```

```go [Go]
payload := map[string]interface{}{
	"prompt":      "A futuristic city skyline at night, neon reflections on wet streets",
	"model":       "veo-3.1-generate-001",
	"duration":    10,
	"webhook_url": "https://your-server.com/webhooks/fotohub",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/video", bytes.NewBuffer(body))
req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()

var result map[string]interface{}
json.NewDecoder(resp.Body).Decode(&result)
fmt.Printf("Job submitted: %s\n", result["job_id"])
fmt.Println("You will receive a POST to your webhook when ready")
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic city skyline at night, neon reflections on wet streets",
    "model": "veo-3.1-generate-001",
    "duration": 10,
    "webhook_url": "https://your-server.com/webhooks/fotohub"
  }'
```

:::

### Webhook Payload

When the video is ready (or fails), FOTOhub sends a `POST` request to your
`webhook_url`. The body is the job record itself — there is **no** `event` /
`timestamp` envelope and **no** `billing` block:

```json
{
  "job_id": "vj_abc123def456",
  "status": "completed",
  "progress": 100,
  "model": "veo-3.1-generate-001",
  "video_url": "https://s1.fotohub.app/storage/v1/object/public/generations/videos/vj_abc123def456.mp4",
  "duration": 10,
  "completed_at": "2026-07-23T14:30:00Z"
}
```

On failure the same shape arrives with `"status": "failed"` and an `error`
string instead of `video_url`.

::: warning Branch on `status`, not on an event name
There is no `event` key to switch on. `video.ready` and `video.progress` are
**not** real events — `POST /v1/webhooks` rejects both with
`400 Invalid events`. See [Webhook Events](#webhook-events) for the events you
can actually subscribe to.

Billing figures are not delivered by the callback either. Read them from the
generation response at submit time, or from `GET /v1/billing/usage`.
:::

::: tip Only `https` callbacks to public hosts
The worker refuses any non-`https` callback URL, and any URL resolving to a
private IP range, so `http://localhost:...` will never be called. Use a tunnel
(ngrok, Cloudflare Tunnel) when testing locally.
:::

### Handling Webhooks

::: code-group

```python [Python]
from flask import Flask, request, jsonify
import hmac
import hashlib

app = Flask(__name__)
WEBHOOK_SECRET = "whsec_your_webhook_secret"

@app.route("/webhooks/fotohub", methods=["POST"])
def handle_webhook():
    # Verify signature
    signature = request.headers.get("X-FotoHub-Signature")
    payload = request.get_data()
    expected = hmac.new(
        WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        return jsonify({"error": "Invalid signature"}), 401

    # The body IS the job record -- no event/data envelope.
    job = request.json
    if job["status"] == "completed":
        print(f"Video ready: {job['video_url']}")
        # Process the completed video (download, store, notify user...)
    elif job["status"] == "failed":
        print(f"Video failed: {job.get('error')}")

    return jsonify({"received": True}), 200
```

```typescript [TypeScript]
import { createHmac, timingSafeEqual } from "crypto";
import express from "express";

const app = express();
const WEBHOOK_SECRET = "whsec_your_webhook_secret";

app.post("/webhooks/fotohub", express.raw({ type: "application/json" }), (req, res) => {
  // Verify signature
  const signature = req.headers["x-fotohub-signature"] as string;
  const expected = createHmac("sha256", WEBHOOK_SECRET)
    .update(req.body)
    .digest("hex");

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // The body IS the job record -- no event/data envelope.
  const { status, video_url, error } = JSON.parse(req.body.toString());
  if (status === "completed") {
    console.log(`Video ready: ${video_url}`);
    // Process the completed video...
  } else if (status === "failed") {
    console.error(`Video failed: ${error}`);
  }

  res.json({ received: true });
});

app.listen(3000);
```

```go [Go]
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const webhookSecret = "whsec_your_webhook_secret"

// The callback body IS the job record -- no event/data envelope.
type WebhookJob struct {
	JobID       string  `json:"job_id"`
	Status      string  `json:"status"`
	Progress    int     `json:"progress"`
	Model       string  `json:"model"`
	VideoURL    string  `json:"video_url"`
	Duration    float64 `json:"duration"`
	CompletedAt string  `json:"completed_at"`
	Error       string  `json:"error"`
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(r.Body)

	// Verify signature
	signature := r.Header.Get("X-FotoHub-Signature")
	mac := hmac.New(sha256.New, []byte(webhookSecret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(signature), []byte(expected)) {
		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	var job WebhookJob
	json.Unmarshal(body, &job)

	switch job.Status {
	case "completed":
		fmt.Printf("Video ready: %s\n", job.VideoURL)
		// Process the completed video...
	case "failed":
		fmt.Printf("Video failed: %s\n", job.Error)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"received": true}`))
}

func main() {
	http.HandleFunc("/webhooks/fotohub", webhookHandler)
	http.ListenAndServe(":3000", nil)
}
```

```bash [cURL]
# Test your webhook endpoint locally with a sample payload:
curl -X POST "http://localhost:3000/webhooks/fotohub" \
  -H "Content-Type: application/json" \
  -H "X-FotoHub-Signature: your_computed_signature" \
  -d '{
    "job_id": "vj_abc123def456",
    "status": "completed",
    "progress": 100,
    "model": "veo-3.1-generate-001",
    "video_url": "https://s1.fotohub.app/storage/v1/object/public/generations/videos/vj_abc123def456.mp4",
    "duration": 10,
    "completed_at": "2026-07-23T14:30:00Z"
  }'
```

:::

### Webhook Events

These are the events accepted by `POST /v1/console/webhooks`. Any other value —
including `video.ready` and `video.progress`, which older revisions of this page
documented — is rejected with `400 Invalid events`.

These are the ones that matter for video:

| Event | Description |
|-------|-------------|
| `generation.started` | A job was accepted and handed to the provider. |
| `generation.completed` | A generation finished successfully, video included. |
| `generation.failed` | A generation failed. |
| `generation.refunded` | A failed job's charge was returned to your wallet. Carries `cost_usd` and `job_id`, so it reconciles against the `billing.charged` that preceded it. |
| `billing.charged` | A wallet charge was settled. |
| `billing.refunded` | A wallet charge was reversed. |
| `billing.insufficient_funds` | A request was refused for lack of funds. Carries `required_usd` and `balance_usd`, so you learn your wallet stopped a request without parsing the 402 of the request that was refused. |

Subscribe to `generation.refunded` alongside `billing.charged` if you keep your
own ledger — the debit and its reversal are separate events, and taking only the
first leaves your books over-counting spend on every failed job.

There is no progress event for video. Poll `GET /v1/ai/generate/video/{job_id}`
for intermediate progress.

`GET /v1/console/webhooks` and the console UI list the full set, which also
covers image batches, background editing and commerce jobs. One name on that list
is not yet emitted by anything — `key.used` — so subscribing to it produces no
deliveries.

::: warning Webhook Security
- Always verify the `X-FotoHub-Signature` header using HMAC-SHA256 with your webhook secret
- The secret is returned **once**, in the `201` response to `POST /v1/console/webhooks`. It is deliberately absent from every later read, including `PATCH`, so store it when you create the webhook — if you lose it, delete the webhook and create a new one
- Respond with a 2xx or the delivery is retried, up to 3 attempts total
- Retries back off exponentially and quickly: roughly 0.5s, then 1s, then 2s. This is not a queue that will keep trying for hours — an endpoint that is down for a minute misses the event, so treat webhooks as a fast path and reconcile against `GET /v1/billing/usage` for anything you must not lose
:::

## Error Responses

| Status | Code | Description |
|:------:|------|-------------|
| `400` | `bad_request` | Invalid parameters. `duration` must be a positive number — it is then snapped to what the model renders, so you never need to guess its accepted set. `model` must be a known ID (the message lists them all) and `aspect_ratio` a supported format. |
| `401` | `unauthorized` | Missing or invalid API key. Ensure your `Authorization` header contains a valid `Bearer fh_live_...` token. |
| `402` | `insufficient_funds` | Your wallet cannot cover this render. The body carries `required_usd`, `balance_usd` and `shortfall_usd`, so you can size the top-up exactly. Nothing was charged — no provider was called. |
| `402` | `spend_limit_reached` | The wallet has the money but your own monthly cap does not allow the spend. Raise or clear the cap in the console; `spent_usd` and `limit_usd` are in the body. Distinct from `insufficient_funds` because topping up will not fix it. |
| `429` | `rate_limit_exceeded` | Submitting video is limited to **5 requests per minute**; polling a job you already paid for has its own 60/min budget, so a normal poll loop cannot exhaust the submit allowance. `Retry-After` tells you when to retry. |
| `501` | — | The model ID is real and priced but not yet routed on the public API. |
| `504` | `gateway_timeout` | The generation exceeded the synchronous wait. Long durations and 4K normally return a `job_id` for polling instead of blocking, so this is rare — retry with a shorter duration or lower resolution. |

### Error Response Example

A `402` from an empty wallet. Every field a client needs to react is present, so
you never have to parse the sentence:

```json
{
  "detail": {
    "error": "insufficient_funds",
    "code": "insufficient_funds",
    "message": "Insufficient funds: this request costs $0.800000 but your balance is $0.120000. Top up your wallet with at least $0.680000 to continue. The FOTOhub API is prepaid: no credits or subscription plan can pay for API usage.",
    "required_usd": 0.8,
    "balance_usd": 0.12,
    "shortfall_usd": 0.68,
    "currency": "USD",
    "charged": false,
    "charged_usd": 0,
    "topup_url": "https://fotohub.app/console/wallet",
    "operation": "generate_video:veo-3.1-generate-001"
  }
}
```

Branch on `code`, not on the status: `insufficient_funds` and
`spend_limit_reached` are both `402` and need opposite responses — one is fixed
by depositing money, the other by editing a limit you set yourself.

`charged: false` is stated positively on purpose. This 402 is raised **before**
the provider is called, so there is nothing to refund and nothing to reconcile.

::: warning Rate Limits
Submitting a video is limited to **5 requests per minute**, across all video
models. Polling `GET /v1/ai/generate/video/{job_id}` is a separate 60/min budget,
so a render you are already waiting on never costs you a submit slot. Keys also
carry their own `rate_limit_per_minute` (60 by default) which applies on top —
whichever is lower wins. Raise the key limit in the console, or contact sales for
higher submit throughput.
:::

## Tips and Best Practices

::: tip Prompt Engineering for Video
For best results, include these elements in your prompt:
- **Subject** - What appears in the video (person, animal, landscape)
- **Action** - What is happening (running, flying, dissolving)
- **Style** - Visual aesthetic (cinematic, anime, documentary)
- **Camera** - Movement and framing (dolly zoom, aerial pan, close-up)
- **Lighting** - Time of day and mood (golden hour, neon-lit, overcast)
:::

::: tip Image-to-Video Best Practices
When using `image_url` for image-to-video generation:
- Use high-resolution source images (at least 1024x1024)
- Ensure the image is publicly accessible or hosted on FOTOhub storage
- Keep the prompt consistent with what is visible in the source image
- Kling and Hailuo models tend to produce the most natural animations from still images
:::

::: warning Video is the most expensive thing you can call
Nothing else in the API moves this much money per request. The upper end, at each
model's own maximum duration:

| Worst case | Cost |
|-----------|-----:|
| `sora-2-pro`, 25s at 1080p ($0.70/s) | $17.50 |
| `seedance-2-0-pro`, 15s at 4K | $11.70 |
| `seedance-2-5`, 30s at 720p | $6.94 |
| `veo-3.1-generate-001`, 8s (its longest) | $1.60 |

No video model renders 60 seconds — the longest anything reaches is Seedance 2.5
at 30s, then `sora-2-pro` at 25s and Grok at 15s. Everything in the Veo, Kling,
Hailuo and Wan families tops out at 8 or 10 seconds.

Read `cost_usd` and `billing.balance_usd` off every response and keep your own
running total: a loop that submits without checking the balance discovers the
wallet is empty as a 402, not as a warning. Draft on `wan2.2-t2v-plus` ($0.02/s)
or Seedance at 480p, then re-render only the shot you keep on the model you
actually want.
:::

::: info Output Format
All generated videos are delivered in MP4 format (H.264 codec) with AAC audio track (silent). Videos are stored for 30 days and accessible via the returned `video_url`. Download and save videos to your own storage for permanent retention.
:::

---

## Related APIs

Looking for more video capabilities? See these related endpoints:

| API | Description | Link |
|-----|-------------|------|
| **Video Editing** | Transcode, merge, stabilize, upscale, effects, watermarks, AI Director | [Video Editing →](/api/video-editing) |
| **Shorts & Clips** | Auto-generate short-form content from long videos (WhisperX + YOLOv8 + LLM scoring) | [Shorts & Clips →](/api/shorts-clips) |
| **Story Studio** | Multi-scene AI story generation with characters, storyboards, and narration | [Story Studio →](/api/story-studio) |
| **Lip-Sync** | Sync lips to audio using MuseTalk, LatentSync, or FaceFusion | [Lip-Sync →](/api/lip-sync) |
