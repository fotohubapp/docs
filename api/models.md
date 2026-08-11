# Models Catalog

Complete reference of all AI models available through the FOTOhub API. The platform provides access to 50+ models from 10+ providers covering image generation, video creation, chat/LLM, music, audio, and visual analysis. The catalog is served dynamically from `GET /v1/models` — always treat that live response as the source of truth, since models are added and retired frequently.

## List Models

Retrieve the full catalog of available models or filter by category.

### Endpoint

```
GET /v1/models
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category: `image`, `video`, `text`, `audio` |
| `includeInactive` | boolean | Include retired/inactive models in the response (default `false`) |

### Response Format

```json
{
  "models": [
    {
      "id": "imagen-4-standard",
      "name": "Imagen 4 Standard",
      "provider": "Google Vertex AI",
      "category": "image",
      "description": "Google Imagen 4 Standard image generation",
      "pricing_type": "request",
      "input_price_per_1k_tokens": null,
      "output_price_per_1k_tokens": null,
      "request_price": 0.1206,
      "currency": "USD",
      "request_limit_per_minute": 60,
      "token_limit_per_minute": null,
      "context_window": null,
      "max_output_tokens": null,
      "supports_batch": false,
      "is_active": true,
      "features": {},
      "metadata": {},
      "price_unit": "request",
      "request_price_per": "one request"
    }
  ]
}
```

The response is a flat `{ "models": [...] }` array. Each model exposes `pricing_type` (`request` for per-call pricing, or `token` for per-token models), the relevant price field (`request_price`, or `input_price_per_1k_tokens` / `output_price_per_1k_tokens`), plus rate-limit and capability fields. Use `?category=` to filter; the catalog currently returns models across the `image`, `video`, `text`, and `audio` categories.

### Read `price_unit`, not `pricing_type`, to know what a price buys

`pricing_type` only separates token billing from everything else. It says `request` on all 56 video models — but their `request_price` is **per second of output**, so multiplying by the clip length is the difference between quoting a 5s clip correctly and quoting it at a fifth of its price.

Every row therefore carries `price_unit` (machine-readable) alongside `request_price_per` (the same thing in words):

| `price_unit` | `request_price` buys | Applies to |
|--------------|----------------------|------------|
| `request` | one request | image generation, editing, analysis |
| `second` | one second of output video | every video model |
| `minute` | one minute of audio — **output** for music, **input** for `transcription`, `audio-translation`, `audio-mastering`, `audio-stems` | audio |
| `1k_characters` | 1000 input characters | text-to-speech |
| `1k_tokens` | 1000 tokens; read `input_price_per_1k_tokens` / `output_price_per_1k_tokens` instead, since `request_price` is `null` here | chat/LLM |

```python
price = model["request_price"]
if model["price_unit"] == "second":
    price *= duration_seconds      # a 5s video costs 5x request_price
```

All prices are USD. `currency` is always `"USD"` on this endpoint.

::: warning Catalog prices are indicative
`GET /v1/models` is a catalog, not a quote. The authoritative charge for a call comes back on the call itself (`credits_used`, and the `billing` object where the endpoint returns one) — see [Billing](/api/billing).
:::

### Code Example

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# List all image models
models = client.list_models(category="image")
for m in models:
    print(f"{m['id']}: {m['name']} ({m['request_price']} {m['currency']})")

# Find the cheapest flat-priced model. Compare on price_unit, not
# pricing_type -- a per-second video model also reports "request".
per_request = [m for m in models if m["price_unit"] == "request"]
cheapest = min(per_request, key=lambda m: m["request_price"])
print(f"Cheapest: {cheapest['name']} at {cheapest['request_price']} {cheapest['currency']}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// List image models
const models = await client.listModels("image");
models.forEach(m => {
  console.log(`${m.id}: ${m.name} (${m.request_price} ${m.currency})`);
});

// Find the cheapest flat-priced model. Compare on price_unit, not
// pricing_type -- a per-second video model also reports "request".
const perRequest = models.filter(m => m.price_unit === "request");
const cheapest = perRequest.sort((a, b) => a.request_price - b.request_price)[0];
console.log(`Cheapest: ${cheapest.name} at ${cheapest.request_price} ${cheapest.currency}`);
```

```go [Go]
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

func main() {
    req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/models?category=image", nil)
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)

    var result struct {
        Models []struct {
            ID           string  `json:"id"`
            Name         string  `json:"name"`
            PricingType  string  `json:"pricing_type"`
            PriceUnit    string  `json:"price_unit"`
            RequestPrice float64 `json:"request_price"`
            Currency     string  `json:"currency"`
        } `json:"models"`
    }
    json.Unmarshal(body, &result)

    for _, m := range result.Models {
        fmt.Printf("%s: %s (%.2f %s)\n", m.ID, m.Name, m.RequestPrice, m.Currency)
    }
}
```

```bash [cURL]
# List all active models
curl -X GET "https://apis.fotohub.app/v1/models" \
  -H "Authorization: Bearer fh_live_your_api_key"

# List only image generation models
curl -X GET "https://apis.fotohub.app/v1/models?category=image" \
  -H "Authorization: Bearer fh_live_your_api_key"

# Include retired/inactive models
curl -X GET "https://apis.fotohub.app/v1/models?includeInactive=true" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

---

## Pricing Notes

All per-request prices are shown in USD. Credits are deducted from your monthly plan allowance first; the USD figure is what the wallet is charged once credits are exhausted (1 credit = $0.0536 for models without their own per-request price).

- Prices marked with **\*** are token-based estimates for a standard 1024x1024 generation (~4096 tokens). Actual cost depends on output resolution.
- All other prices are fixed per operation.
- Chat models use blended token pricing (input + output averaged). See [Billing](/api/billing) for exact input/output rates.

---

## Image Generation Models

30+ image-generation models across multiple providers. Prices below are per-request in USD (or credits, where noted), taken from the live `/v1/models` catalog. Query `GET /v1/models?category=image` for the authoritative, always-current list.

### FOTOhub — IDA Q 1.0

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `ida-q-image` | IDA Q 1.0 | 0.0268 | per request (0.5 credits, async — see note below) |

**IDA Q 1.0** — FOTOhub's proprietary image generation model, self-hosted on our own GPU infrastructure. Best-in-class text rendering, native multilingual prompts, top-5 worldwide on the DesignArena benchmark. Unlike every other model in this catalog, generation is **asynchronous**: submit returns `202` with a `job_id`, then poll `GET /v1/ai/generate/image/ida-q/{job_id}` until it completes (30s–3.5min depending on resolution). See the [full IDA Q 1.0 reference](/api/ida-q) for the polling contract and prompt-engine details.

### Google — Imagen

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `imagen-3-fast` | Imagen 3 Fast | 0.0322 | per image, 512px |
| `imagen-3-standard` | Imagen 3 Standard | 0.0643 | per image, 1K |
| `imagen-3-capability` | Imagen 3 Capability | 0.0643 | per image, editing/capability |
| `imagen-4-standard` | Imagen 4 Standard | 0.1206 | per image, 1K-2K |
| `imagen-4-ultra` | Imagen 4 Ultra | 0.2412 | per image, 4K |

**Recommended:** `imagen-4-standard` -- Best balance of quality and cost for general-purpose photorealistic generation at up to 2K resolution.

### Google — Gemini (Nano Banana family)

Gemini's native multimodal image models — text-to-image, image-to-image, and multi-image composition (up to 10 reference images) in one model.

| Model ID | Name | Credits | Unit |
|----------|------|---------|------|
| `gemini-3.1-flash-lite-image` | Nano Banana 2 Lite | 1 | per image, budget/fast |
| `gemini-2.5-flash-image` | Nano Banana | 2 | per image, up to 10 refs |
| `gemini-3.1-flash-image` | Nano Banana 2 | 3 | per image, GA |
| `gemini-3.1-flash-image-preview` | Nano Banana 2 (Preview) | 3 | per image, preview channel |
| `gemini-3-pro-image` | Nano Banana Pro | 6 | per image, 1K/2K/4K, advanced reasoning + precise text |

**Recommended:** `gemini-3-pro-image` ("Nano Banana Pro") -- Advanced reasoning, precise in-image text rendering, and composition control up to 4K. Best for complex, detailed prompts.

**Budget pick:** `gemini-3.1-flash-lite-image` -- Cheapest Gemini image model, ideal for prototyping and iteration.

### OpenAI — DALL-E and GPT Image

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `dall-e-3-standard` | DALL-E 3 | 0.0643 | per image, 1K |
| `dall-e-3-hd` | DALL-E 3 HD | 0.1286 | per image, 2K |
| `gpt-image-1` | GPT Image 1 | 0.1608 | per image, 1K-2K |
| `gpt-image-2` | GPT Image 2 | 0.1072 | per image, 4K, best text rendering |

**Use case:** Strong text rendering in images, creative illustrations, premium photorealism. `gpt-image-2` for the highest fidelity and 4K output.

### Microsoft — MAI-Image

| Model ID | Name | Credits | Unit |
|----------|------|---------|------|
| `mai-image-2.5-flash` | MAI-Image 2.5 Flash | 1 | per image, budget/fast |
| `mai-image-2.5` | MAI-Image 2.5 | 1 | per image, up to 1024x1024 |

**Use case:** Azure AI flagship image models with prompt rewriting; budget-friendly alternative for standard generation.

### BytePlus — SeedDream

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `seedream-4-0-250828` | SeedDream 4.0 | 0.0482 | per image |
| `seedream-5-0-260128` | SeedDream 5.0 | 0.0563 | per image |
| `seedream-4-5-251128` | SeedDream 4.5 | 0.0643 | per image |
| `seededit-3-0-i2i-250628` | SeedEdit 3.0 | 0.0643 | image-to-image |
| `dola-seedream-5-0-pro-260628` | SeedDream 5.0 Pro | 0.0723 | per image |

**Recommended:** `seedream-5-0-260128` -- Excellent quality-to-price ratio, the default model in most examples. Supports up to 4K output. `dola-seedream-5-0-pro-260628` for highest detail and prompt adherence.

### BytePlus — Dreamina

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `dreamina-4-6` | Dreamina 4.6 | 0.1072 | per image, flat (not resolution-scaled), up to 14 reference images |

**Use case:** Image-to-image composition with up to 14 reference inputs, flat pricing regardless of output resolution (1K-4K). See the [full request reference](/api/image-generation#byteplus-dreamina-4-6-flat-per-image) — a single call can return a group of images unless `force_single` is set.

### xAI — Grok Imagine

| Model ID | Name | Price (USD) | Capabilities |
|----------|------|-------------|--------------|
| `grok-imagine-image` | Grok Imagine | 0.0322 | T2I + single-image edit, 1K, multiple aspect ratios |
| `grok-imagine-image-pro` | Grok Imagine Pro | 0.1125 | T2I + multi-image combine + higher fidelity, 2K |

**Use cases:** Product photography, e-commerce listings, multi-image combine, social media content.

### BFL — FLUX

FLUX models for text-to-image and context-aware editing. Max resolution: 1440px per side.

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `flux-2-klein-4b` | FLUX.2 Klein 4B | 0.0225 | per image, budget |
| `flux-2-klein-9b` | FLUX.2 Klein 9B | 0.0241 | per image, budget |
| `flux-2-pro` | FLUX.2 Pro | 0.0482 | per image, up to 1440px |
| `flux-1.1-pro` | FLUX 1.1 Pro | 0.0643 | per image, up to 1440px |
| `flux-kontext-pro` | FLUX Kontext Pro | 0.0643 | per image, context-aware editing |
| `flux-1.1-pro-ultra` | FLUX 1.1 Pro Ultra | 0.0965 | per image, up to 4MP |
| `flux-2-max` | FLUX.2 Max | 0.1125 | per image, max fidelity |
| `flux-kontext-max` | FLUX Kontext Max | 0.1286 | per image, premium editing |

**Use case:** `flux-kontext-pro` / `flux-kontext-max` for context-aware editing and style transfer. `flux-2-klein-*` for budget generation. `flux-2-max` for maximum fidelity.

### MiniMax

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `minimax-image-01` | MiniMax Image | 0.0056 | per image, 1K |

**Use case:** Lowest-cost image generation on the platform.

### Kling — Image

| Model ID | Name | Credits | Unit |
|----------|------|---------|------|
| `kling-v2-1` | Kling v2.1 | 2 | per image, 1K |
| `kling-v2-new` | Kling v2 (New) | 4 | per image, 1K |
| `kling-v2` | Kling v2 | 5 | per image, 1K |
| `kling-v3` | Kling v3 | 5 | per image, 1K |
| `kling-v3-omni` | Kling v3 Omni | 8 | per image, 2K, all modes |
| `kling-image-o1` | Kling Image O1 | 10 | per image, reasoning model |

**Use case:** Versatile multi-style generation with strong coherence; `kling-v3-omni` for the highest quality; `kling-image-o1` for prompt-reasoning-driven composition.

---

## Video Generation Models

30+ models for text-to-video and image-to-video generation across 6 providers. Most bill per-second (`credits/s × duration`); MiniMax Hailuo bills a flat per-video amount. Query `GET /v1/models?category=video` for the authoritative, always-current list.

### Google — Veo (Vertex AI)

| Model ID | Name | Credits/s | Max Resolution | Audio | Notes |
|----------|------|-----------|-----------------|-------|-------|
| `veo-3.1-lite-generate-001` | Veo 3.1 Lite | 2 | 1080p | native | cheapest Veo tier |
| `veo-3.0-fast-generate-001` | Veo 3 Fast | 5 | 1080p | native | |
| `veo-3.1-fast-generate-001` | Veo 3.1 Fast | 5 | 4K | native | |
| `veo-3.0-generate-001` | Veo 3 | 12 | 1080p | native | |
| `veo-3.1-generate-001` | Veo 3.1 | 12 | 4K | native | last-frame + reference images |
| `veo-2.0-generate-001` | Veo 2 | 31 | 720p | none | legacy, no audio |

**Recommended:** `veo-3.1-generate-001` — Highest quality, native audio, last-frame + reference-image support, up to 4K.

### Google — Gemini Omni Flash (native audio)

| Model ID | Name | Credits/s | Resolution | Audio | Notes |
|----------|------|-----------|------------|-------|-------|
| `gemini-omni-flash` | Gemini Omni Flash | 6 | 720p (fixed) | native (automatic) | T2V, I2V, reference-to-video (≤3 images), 2-10s |

Unlike Veo, audio is generated automatically — there's no separate `audio` surcharge tier, and resolution/duration aren't independently configurable (duration is prompt-controlled, 2-10s).

### ByteDance — Seedance

| Model ID | Name | Credits/s | Notes |
|----------|------|-----------|-------|
| `seedance-2-0-mini` | Seedance 2.0 Mini | 2.8 | budget tier, 480p/720p |
| `seedance-1-5-pro-251215` | Seedance 1.5 Pro | 2.9 | |
| `seedance-1-0-pro-fast-251015` | Seedance 1.0 Pro Fast | 3 | |
| `seedance-2-0-fast` | Seedance 2.0 Fast | 7.5 | |
| `seedance-1-0-pro-250528` | Seedance 1.0 Pro | 7.5 | |
| `seedance-2-0-pro` | Seedance 2.0 | 9.4 | highest resolution — up to 4K, 4-15s |
| `seedance-2-5` | Seedance 2.5 | 14.5 (720p) / 6.4 (480p) | **longest clip — 4-30s in one request**, 720p ceiling, audio included, video-to-video editing, 30 image + 10 video + 10 audio references |

Seedance runs asynchronously: `POST /v1/ai/generate/video` returns `202` with a
`job_id` and `poll_url`. See the [Seedance 2.5 reference](/api/video-generation#seedance-2-5-long-clips-video-editing)
for the full parameter set, task-type constraints, and video-editing examples.

### ByteDance — Avatar & Motion Transfer

Two distinct capabilities on a dedicated endpoint pair (not `/v1/ai/generate/video`) — see the [full reference](/api/avatar-motion).

| Model ID | Name | Credits/s | Capability |
|----------|------|-----------|------------|
| `dreamactor-m2` | DreamActor M2.0 | 3.1 | motion transfer — image + driving video → performing character, 3-30s input |
| `omnihuman-1-0` | OmniHuman 1.0 | 7.4 | avatar — image + audio → talking/performing video, no driving video needed, ≤15s |
| `omnihuman-1-5` | OmniHuman 1.5 | 7.4 | same as 1.0, plus multi-character scene support via subject detection |

### Alibaba — Wan

Wan covers text-to-video (t2v), image-to-video (i2v), keyframe interpolation (kf2v), reference-to-video (r2v), video editing (VACE), and digital-human (S2V).

| Model ID | Name | Credits/s | Mode |
|----------|------|-----------|------|
| `wan2.2-t2v-plus` / `wan2.2-i2v-plus` | Wan 2.2 Plus | 1.2 | t2v / i2v |
| `wan2.2-i2v-flash` | Wan 2.2 I2V Flash | 1.2 | i2v |
| `wan2.2-kf2v-flash` | Wan 2.2 KF2V | 1.2 | keyframe |
| `wan2.6-i2v-flash` | Wan 2.6 I2V Flash | 1.6 | i2v |
| `wan2.1-i2v-turbo` / `wan2.1-t2v-turbo` | Wan 2.1 Turbo | 2.2 | t2v / i2v |
| `wan2.6-r2v-flash` | Wan 2.6 R2V Flash | 40 | reference-to-video |
| `wan2.6-t2v` / `wan2.6-i2v` | Wan 2.6 | 6 | t2v / i2v |
| `wan2.5-t2v-preview` / `wan2.5-i2v-preview` | Wan 2.5 | 6 | t2v / i2v |
| `wan2.1-t2v-plus` | Wan 2.1 Plus | 6 | t2v |
| `wan2.1-kf2v-plus` | Wan 2.1 KF2V Plus | 30 | keyframe |
| `wan-vace` | Wan VACE Editor | 30 | video editing (inpaint/outpaint/repaint/extend) |
| `wan-s2v` | Wan S2V Digital Human | 30 | portrait + audio → talking head |
| `wan2.6-r2v` | Wan 2.6 R2V | 90 | reference-to-video, highest fidelity |

### Kuaishou — Kling AI

| Model ID | Name | Credits/s |
|----------|------|-----------|
| `kling-v2-5-turbo` | Kling v2.5 Turbo | 1.6 |
| `kling-v1` | Kling v1.0 | 2.4 |
| `kling-v2-6` | Kling v2.6 | 2.4 |
| `kling-v3` | Kling v3 | 5 |
| `kling-v1-6` | Kling v1.6 | 3.2 |
| `kling-v2-master` | Kling v2.0 Master | 3.2 |
| `kling-v2-1-master` | Kling v2.1 Master | 3.2 |
| `kling-v3-omni` | Kling v3 Omni | 60 (flat, per operation) |
| `kling-video-o1` | Kling Video O1 | 80 |

### MiniMax — Hailuo

Flat per-video pricing (not per-second) — cost depends on resolution + duration tier, not a linear rate.

| Model ID | Name | Credits (typical) | Notes |
|----------|------|--------------------|-------|
| `hailuo-o2` | Hailuo O2 | 6 | T2V + I2V + first/last-frame |
| `hailuo-2.3-fast` | Hailuo 2.3 Fast | 12 | I2V only, faster/cheaper |
| `hailuo-2.3` | Hailuo 2.3 | 17 | T2V + I2V, camera commands |
| `hailuo-s2v` | Hailuo S2V | 17 | subject-reference (face consistency) |

### OpenAI — Sora 2

| Model ID | Name | Credits/s | Max Duration |
|----------|------|-----------|---------------|
| `sora-2` | Sora 2 | 8 | 12s |
| `sora-2-azure` | Sora 2 — FOTOhub (Azure-hosted) | 8 | 12s |
| `sora-2-pro` | Sora 2 Pro | 19 | 25s |

### xAI — Grok Video

| Model ID | Name | Credits/s | Notes |
|----------|------|-----------|-------|
| `grok-imagine-video` | Grok Video | 4 | T2V + I2V + video editing + reference-to-video |
| `grok-imagine-video-1.5` | Grok Video 1.5 | 9 | I2V + editing + **lip-sync** (portrait + text → talking head), up to 1080p |

**Recommended:** `veo-3.1-generate-001` — Highest quality, cinematic output with native audio.

**Budget pick:** `wan2.2-t2v-plus` / `wan2.2-i2v-plus` — Lowest per-second cost with good quality for social media content.

**Native audio without Veo:** `gemini-omni-flash` generates audio automatically for every clip, no separate surcharge.

**Lip-sync generation:** `grok-imagine-video-1.5` — the only *generative* model with built-in lip-sync (portrait + script → talking head). For syncing existing footage to new audio instead, see [Lip-Sync](/api/lip-sync).

---

## Chat and LLM Models

FOTOhub exposes two chat endpoints with different billing models:

- **Credit-based** — `POST /v1/ai/chat/completions`, OpenAI-compatible, streaming, flat credit cost per request (1 credit for flash-tier models, 2 credits otherwise).
- **Token-based** — `POST /v1/ai/chat/claude`, exact per-token billing for premium models (no streaming).

::: warning Canonical chat catalog lives at `/v1/models`
The set of chat model IDs accepted by `/v1/ai/chat/completions` is served dynamically. Always query `GET /v1/models?category=text` for the authoritative list rather than hard-coding IDs. Model families shown below reflect the routing tiers available on the public API; exact IDs and availability change over time.
:::

### Credit-based (`/v1/ai/chat/completions`)

Routes across the following model families. See the [Chat/LLM API Reference](/api/chat-llm) for the current per-model pricing and the canonical ID list.

| Family | Typical tiers | Best for |
|--------|---------------|----------|
| **Claude** | Haiku, Sonnet, Opus | Quality writing, analysis, code |
| **GPT** | flash / standard / pro | Creative, reasoning, general |
| **Gemini** | Flash, Flash-Lite, Pro | Fast, long context, multimodal |
| **Grok** | fast-reasoning, fast | Real-time knowledge, reasoning |
| **Qwen** | Max, Plus, Flash, Coder | Multilingual, code, vision |
| **Kimi** | K2, K2 Thinking | 1M context, deep reasoning |
| **DeepSeek** | V3.x | Reasoning, code, budget |

**Budget pick:** a Gemini or Nova flash-tier model bills 1 credit. All other models bill 2 credits per request.

### Token-based premium (`/v1/ai/chat/claude`)

Nine premium models billed by exact input/output token usage: Claude Sonnet 4.6 / 4.5 / 4, Claude Haiku 4.5, and Amazon Nova Pro / Lite / Micro / Premier / 2 Lite. See [Chat/LLM → Premium Chat](/api/chat-llm) for token rates.

::: info Billing
Credit-based charges a flat, predictable fee per request. Token-based charges exact per-token rates (pay only for what you use). See [Chat/LLM API Reference](/api/chat-llm) for full pricing tables.
:::

---

## Music and Audio Models

### Music Generation

| Model ID | Name | Credits | Duration | Status |
|----------|------|---------|----------|--------|
| `ida-music` | IDA Music | 2–4 | up to 5 min | active |
| `minimax` | MiniMax Music | 5/10/25 | 30s/60s/120s | active |
| `ida-cloud` | IDA Cloud Music | 5/10/25 | 30s/60s/120s | active |

**IDA Music** — FOTOhub's proprietary music model. Supports lyrics, instrumental, 30+ genres, quality presets. 2 credits (standard) / 4 credits (high quality).

**MiniMax / IDA Cloud** — Cloud music generation. Tiered pricing by duration: 5cr (≤30s), 10cr (≤60s), 25cr (>60s).

### Sound Effects (SFX)

| Model ID | Credits | Duration | Status |
|----------|---------|----------|--------|
| `sfx` | 3 | up to 30s | active |

Text-to-SFX generation via `/v1/ai/generate/sfx`. Uses `prompt` field for description.

### Text-to-Speech (TTS)

| Provider | Credits | Features |
|----------|---------|----------|
| **AWS Polly** | 1 per 10K chars | 106 voices, 41 languages, neural + generative engines |
| Google TTS | 1 | 30+ languages, neural voices |
| IDA Voice Pro | 2 | Voice cloning, emotion control, 29 languages |

**AWS Polly** — cheapest TTS option. 106 voices (neural + generative), 41 languages including Polish. See [Music & Audio → Polly](/api/music-audio#text-to-speech-polly).

### Speech-to-Text (STT)

| Model | Price | Features |
|-------|-------|----------|
| **Voxtral Small 24B** | $0.020 / minute | LLM-quality transcription, context understanding |
| **Voxtral Mini 3B** | $0.005 / minute | Fast budget transcription |
| Whisper Large v3 | 0.3 credits / minute | 99+ languages, auto-detection, timestamps |

All three are billed per **started** minute of input audio, so a 95-second file
bills 2 minutes.

**Voxtral** — Mistral's speech-to-text LLM. Better context understanding than traditional ASR. See [Music & Audio → Voxtral](/api/music-audio#speech-to-text-voxtral).

**Use case:** Transcription, subtitles, meeting notes, dubbing pipelines.

---

## Analysis & Document Models

Image analysis, detection, OCR, and photo intelligence. These are returned under the `image` category in `/v1/models`.

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `photo-analysis` | Photo Analysis | 0.0161 | per image analyzed |
| `face-detection` | Face Detection | 0.0161 | per image analyzed |
| `nsfw-detection` | NSFW / Safety Detection | 0.0080 | per image analyzed |
| `ocr` | OCR (text extraction) | 0.0241 | per image analyzed |

**Recommended:** `photo-analysis` -- General-purpose image understanding, captioning, and content classification.

**Budget pick:** `nsfw-detection` -- Fast, low-cost content-safety classification for moderation pipelines.

### Document Intelligence (Textract)

| Operation | Credits | Use Case |
|-----------|---------|----------|
| `detect-text` (OCR) | 1 | Simple text extraction from images/documents |
| `analyze` (Tables+Forms) | 3 | Table/form structured extraction |
| `analyze-expense` (Invoices) | 5 | Invoice/receipt data extraction |

See [Document Intelligence](/api/document-intelligence) for full API reference.

---

## 3D Generation Models

5 models for converting images or text to 3D assets. See [3D Generation](/api/3d-generation) for full API reference.

| Model ID | Name | Credits | Speed | Modes | Quality |
|----------|------|---------|-------|-------|---------|
| `fh-lite-3d` | FH Lite 3D | 3 | ~3s | image-to-3d | ★★★ |
| `fh-text-3d` | FH Text 3D | 5 | ~25s | text-to-3d | ★★ |
| `fh-pro-3d` | FH Pro 3D | 15 | ~60s | image-to-3d | ★★★★★ |

**Recommended:** `fh-lite-3d` — Best speed-to-quality ratio for product photography and e-commerce use cases.

**Premium pick:** `fh-pro-3d` — Highest quality with PBR textures, supports both image and text input. Ideal for production 3D assets.

**Output formats:** GLB (web/AR), OBJ (editing), STL (3D printing), USDZ (Apple AR).

---

## Storage and Compute Resources

Resources included with plans. Overage charged from wallet.

| Resource | Included | Overage Rate | Notes |
|----------|----------|--------------|-------|
| File Storage | 10 GB | $0.0402/GB/month | Images, videos, audio files (Standard class; Premium SSD $0.1206, Archive $0.0121) |
| Bandwidth | 50 GB | — | Download transfers. No per-GB overage rate is published in `GET /v1/billing/pricing` |
| Agent Compute | 100 minutes | — | Firecracker microVMs. No per-minute overage rate is published in `GET /v1/billing/pricing` |
| Batch Processing | 1,000 jobs | $0.0536/image | Async job queue — billed 1 credit per image, not per job |

---

## Model Selection Guide

Choosing the right model depends on your priorities: quality, speed, cost, or resolution.

### Best for Quality

- `imagen-4-ultra` -- 4K photorealistic, highest fidelity from Google
- `dola-seedream-5-0-pro-260628` -- Highest detail and prompt adherence
- `kling-v3-omni` -- Versatile multi-style with exceptional coherence

### Best for Speed

- `imagen-3-fast` -- Optimized pipeline, fast with good quality
- `flux-2-klein-4b` -- Budget FLUX variant, fast at $0.0225
- `grok-imagine-image` -- Fast inference at $0.0322 per image

### Best Value (Cost)

- `minimax-image-01` -- $0.0056 per image, cheapest on platform
- `flux-2-klein-4b` -- FLUX quality at $0.0225
- `seedream-5-0-260128` -- Latest SeedDream generation at $0.0563

### Best for 4K Output

- `imagen-4-ultra` -- Native 4K generation
- `dola-seedream-5-0-pro-260628` -- Highest detail SeedDream, supports up to 4K
- All SeedDream models -- Support up to 4K resolution

---

## Model Availability

Each model exposes an `is_active` boolean. Active models are fully operational and recommended for production use; inactive models are retired or temporarily disabled and are excluded from the default catalog response.

Check model availability programmatically:

```bash
# Get active models (default — inactive models are excluded)
curl -X GET "https://apis.fotohub.app/v1/models" \
  -H "Authorization: Bearer fh_live_your_api_key"

# Include retired/inactive models
curl -X GET "https://apis.fotohub.app/v1/models?includeInactive=true" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

::: tip Try Before You Commit
Use the FOTOhub Playground at [fotohub.app/playground](https://fotohub.app/playground) to compare models side-by-side with the same prompt before choosing one for production use. Sandbox API keys (`fh_test_`) can be used for testing without incurring charges.
:::

---

## Image Processing Tools

Professional image editing via Stability AI and FOTOhub proprietary engines.

| Tool | Credits | Description |
|------|---------|-------------|
| `upscale` (fast) | 2 | 2x AI upscale, instant |
| `upscale` (creative) | 3 | 4x AI upscale with detail enhancement |
| `remove_background` | 2 | Automatic background removal to transparent PNG |
| `erase` | 2 | Content-aware object removal via mask |
| `inpaint` | 2 | Generate new content in masked area |
| `outpaint` | 2 | Extend canvas in any direction |
| `search_replace` | 2 | Replace objects by text description |
| `recolor` | 2 | Change color of specific objects |
| `style_transfer` | 2 | Apply style from reference image |
| Color grading | 1 | AI color correction and grading |
| AI enhance | 1 | Automatic image enhancement |
| AI denoise | 1 | Remove noise while preserving detail |
| B&W colorization | 2 | Colorize black & white photos |
| Face restoration | 2 | Restore degraded/old faces |
| Depth map | 2 | Generate depth map from image |
| CLIP tagging | 1 | Auto-generate descriptive tags |

See [Image Processing](/api/image-processing) for full API reference.

---

## Lip-Sync & Face Animation

| Model | Credits | Speed | Quality | Description |
|-------|---------|-------|---------|-------------|
| `musetalk` | 8 | Fast | Good | Real-time lip-sync, MuseTalk 1.5 |
| `latentsync` | 15 | Medium | High | HD diffusion-based, LatentSync 1.6 |
| `facefusion` | 20 | Slow | Ultra | Multi-stage pipeline, FaceFusion 3.x |

See [Lip-Sync](/api/lip-sync) for full API reference.

---

## Shorts & Video Pipeline

Automated video-to-shorts pipeline with AI-powered editing.

| Step | Credits | Description |
|------|---------|-------------|
| Ingest | 2 | Upload and analyze video |
| Transcribe | 2 | Speech-to-text with WhisperX |
| Detect Scenes | 3 | Automatic scene boundaries |
| Generate Clips | 5 | AI-selected best moments |
| Captions | 2 | Auto-generated subtitles |
| Reframe | 3 | Smart aspect ratio adaptation |
| Render | 5 | Final short video output |
| **Full Agent** | **15** | **Entire pipeline automated** |

See [Shorts & Clips](/api/shorts-clips) for full API reference.

---

## Gabriel AI — Intelligent Orchestrator

Gabriel is FOTOhub's AI routing layer that classifies user intent and selects the optimal model automatically, balancing quality, speed, and cost.

| Endpoint | Latency | Description |
|----------|---------|-------------|
| `POST /v1/ai/gabriel` | ~200ms | Classify intent → recommend model |
| `POST /v1/ai/gabriel/stream` | SSE | Real-time thinking + routing stream |
| `POST /v1/ai/gabriel/suggest` | <50ms | Autocomplete suggestions |
| `POST /v1/ai/gabriel/recommend` | ~100ms | Context-aware recommendations |

**How it works:** Send a natural language prompt → Gabriel analyzes intent, estimates cost, selects the best model for quality/cost ratio, and optionally enhances your prompt before generation.

See [Gabriel AI](/api/gabriel-ai) for full API reference.

---

## MCP Server — 30 AI Tools for Assistants

FOTOhub exposes all capabilities as MCP (Model Context Protocol) tools, enabling AI assistants like Claude, Cursor, and VS Code Copilot to generate images, videos, music, and more.

| Domain | Tools | Tool names |
|--------|-------|---------|
| Image | 8 | `generate_image`, `edit_image`, `upscale_image`, `remove_background`, `enhance_prompt`, `analyze_image`, `style_transfer`, `inpaint_image` |
| Video | 7 | `generate_video`, `image_to_video`, `extend_video`, `generate_story`, `generate_shorts`, `get_job_status`, `add_subtitles` |
| Audio | 6 | `text_to_speech`, `generate_music`, `generate_sfx`, `transcribe_audio`, `voice_clone`, `separate_stems` |
| Chat | 3 | `chat_completion`, `translate_text`, `gabriel_route` |
| Utility | 4 | `check_balance`, `list_models`, `list_generations`, `search_photos` |
| Training | 2 | `create_training_job`, `get_training_status` |

::: tip Names, not paraphrases
These are the exact tool names the MCP server registers. There is no
`chat_stream`, `edit_video`, `fine_tune`, `get_pricing` or bare `translate` tool
— earlier revisions of this table listed shortened labels that do not resolve.
`enhance_prompt` is registered under the image domain, not chat.
:::

**Transport:** Streamable HTTP at `https://apis.fotohub.app/mcp/`
**Auth:** Bearer `fh_live_*` tokens
**Health:** `GET https://apis.fotohub.app/mcp/health`

See [MCP Integration](/api/mcp) for tool reference and configuration examples.

---

## API Plans & Pricing Tiers

| Plan | Price/month | Credits | RPM | Storage | Key Features |
|------|-------------|---------|-----|---------|--------------|
| **Free** | 0 PLN | 50 | 10 | 1 GB | Basic models, 1 API key |
| **Developer** | 49 PLN | 500 | 60 | 10 GB | All standard models, 5 keys |
| **Startup** | 199 PLN | 5,000 | 300 | 100 GB | All + premium + beta, webhooks, 20 keys |
| **Business** | 799 PLN | 25,000 | 1,000 | 500 GB | Dedicated support, 99.9% SLA, unlimited keys |
| **Enterprise** | Custom | Unlimited | 5,000 | Unlimited | Custom models, SSO/SAML, dedicated infra |

See [Billing & Pricing](/api/billing) for full details, top-up packages, and wallet management.
