# Models Catalog

Complete reference of all AI models available through the FOTOhub API. The platform provides access to 250+ priced models from 10+ providers covering image generation, video creation, chat/LLM, music, audio, and visual analysis.

Two endpoints describe the catalog and they answer different questions. `GET /v1/models` lists what you can call — ids, capabilities, rate limits. `GET /v1/pricing` lists what each call costs, in USD, from the table the wallet actually debits. For prices, `/v1/pricing` is the source of truth; see the warning below.

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

::: danger `GET /v1/models` prices are display-only — do not bill from them
This endpoint reads a separate catalog table (`api_models`) that **nothing charges
from**. Its rows are stored in PLN and divided by the day's NBP rate on the way out, so
the figure you get here is a converted approximation that can and does differ from what
you are actually charged.

**`GET /v1/pricing` is the authoritative price surface.** It serves the same table the
wallet debits from, in USD, with `provider_cost_usd` beside every `price_usd` and a
`verified` flag telling you whether the figure was read off a provider invoice. The
per-request truth is the `billing` object on the response of the call itself.

The tables further down this page are quoted from `GET /v1/pricing`, not from
`/v1/models`.
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

Every price on this page is **USD, charged against your prepaid wallet balance**. There
is no credit path in the API: credits belong to a fotohub.app subscription and cannot
pay for an API call, so an account with 5 000 credits and a $0.00 balance gets a `402`
on every request. Earlier revisions of this page said credits were consumed first and
quoted a conversion of "1 credit = $0.0536" — **there is no such conversion**, and
nothing in the API ever consulted it.

- **Margin is `1.0`.** Prices are the provider's own rate, 1:1. Every entry in
  `GET /v1/pricing` carries `provider_cost_usd` next to `price_usd` so you can verify it.
- **Amounts are held to 6 decimals.** A cheap call can legitimately cost $0.000398.
- **`verified: true`** means the rate came off the provider's price list or an invoice
  we hold; `false` means it is our recorded copy and has not been reconciled.
  `GET /v1/pricing/audit` lists which is which.
- **The meter varies by category** — per image, per second, per 1K output tokens, per
  1M tokens, per 1K characters, per minute, or per GB-month. Read `unit` on the price;
  you cannot infer it from the model name.
- **Some image models are resolution-stepped.** Their price carries `tiers_usd`
  (`{"1K": 0.03, "2K": 0.075, "4K": 0.255}` on `flux-2-pro`), and the flat `price_usd`
  is the **top** tier — which is what you are billed if you omit `image_size`.

---

## Image Generation Models

Every price in this section is USD per delivered image, quoted from `GET /v1/pricing`. Where a model carries `tiers_usd`, all three steps are shown — and **omitting `image_size` bills the top one**, which on `flux-2-pro` is 8.5x the 1K price. Send the tier you want.

### FOTOhub — IDA Q 1.0

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `ida-q-image` | IDA Q 1.0 | 0.00 | per image, async — see note |

**IDA Q 1.0** — FOTOhub's proprietary image generation model, self-hosted on our own GPU infrastructure. Best-in-class text rendering, native multilingual prompts, top-5 worldwide on the DesignArena benchmark. It is the one model in the catalog with **no provider invoice behind it** — we own the GPUs, so the rate is $0.00 and `/v1/pricing` reports it as such. It is not a promotion and it is not a rounding artefact: an IDA Q render deducts nothing from your wallet.

Generation is **asynchronous**: submit returns `202` with a `job_id`, then poll `GET /v1/ai/generate/image/ida-q/{job_id}` until it completes (30s–3.5min depending on resolution). Renders at up to 2K — a 3K/4K request is capped to 2K rather than being priced or rendered above it. See the [full IDA Q 1.0 reference](/api/ida-q) for the polling contract and prompt-engine details.

### Google — Imagen

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `imagen-3-fast` | Imagen 3 Fast | 0.020 | per image ✅ verified |
| `imagen-4-fast` | Imagen 4 Fast | 0.032154 | per image |
| `imagen-3-standard` | Imagen 3 Standard | 0.042872 | per image |
| `imagen-4-standard` | Imagen 4 Standard | 0.080386 | per image |
| `imagen-4-ultra` | Imagen 4 Ultra | 0.160772 | per image |

**Recommended:** `imagen-4-standard` -- Best balance of quality and cost for general-purpose photorealistic generation.

::: warning Imagen renders at most 2K
Every model in this family is capped to 2K before it is priced or forwarded, so a 4K request renders 2K and is billed 2K. There is no 4K Imagen tier to buy — for native 4K use `gemini-3-pro-image` or a SeedDream model. `imagen-3-capability` is not a callable id on `/v1/ai/generate/image`; the editing model is reached through `POST /v1/ai/edit/image` instead (see below).
:::

### Google — Gemini (Nano Banana family)

Gemini's native multimodal image models — text-to-image, image-to-image, and multi-image composition (up to 10 reference images) in one model. Four of the five are resolution-stepped.

| Model ID | Name | 1K | 2K | 4K |
|----------|------|---:|---:|---:|
| `gemini-3.1-flash-lite-image` | Nano Banana 2 Lite | 0.0336 | 0.0336 | 0.0336 |
| `gemini-2.5-flash-image` | Nano Banana | 0.039 | 0.039 | 0.039 |
| `gemini-3.1-flash-image` | Nano Banana 2 | 0.067 | 0.101 | 0.151 |
| `gemini-3.1-flash-image-preview` | Nano Banana 2 (Preview) | 0.067 | 0.101 | 0.151 |
| `gemini-3-pro-image` | Nano Banana Pro | 0.134 | 0.134 | 0.24 |

The brand names `nano-banana-pro` and `nano-banana-fast` are accepted as aliases and route to `gemini-3-pro-image` and `gemini-2.5-flash-image` respectively.

**Recommended:** `gemini-3-pro-image` ("Nano Banana Pro") -- Advanced reasoning, precise in-image text rendering, and composition control up to 4K. Note that 1K and 2K cost the same here, so 2K is the better buy at that price.

**Budget pick:** `gemini-3.1-flash-lite-image` -- Cheapest Gemini image model and flat-rated across all three tiers, so 4K costs what 1K does.

### OpenAI — GPT Image

Bought through Azure OpenAI. This is the steepest resolution grid in the catalog: 4K is 15–35x the 1K price on every model in the family, so `image_size` is not optional here in any practical sense.

| Model ID | Name | 1K | 2K | 4K |
|----------|------|---:|---:|---:|
| `gpt-image-1-mini` | GPT Image 1 Mini | 0.005 | 0.011 | 0.036 |
| `gpt-image-2` | GPT Image 2 | 0.006 | 0.053 | 0.211 |
| `gpt-image-1.5` | GPT Image 1.5 | 0.009 | 0.034 | 0.133 |
| `gpt-image-1` | GPT Image 1 | 0.011 | 0.042 | 0.167 |

**Use case:** Strong text rendering in images, creative illustrations, premium photorealism. `gpt-image-2` is both the cheapest 1K render in the family and the most expensive 4K one — pick the tier deliberately.

::: danger `dall-e-3` and `dall-e-3-hd` are retired
Both are refused with `400` before authentication, so nothing is charged. OpenAI retired DALL-E 3 in favour of the GPT Image family, and this deployment buys that family through Azure where no DALL-E deployment exists. The error names the replacement: use `gpt-image-1` in place of `dall-e-3`, and `gpt-image-1.5` in place of `dall-e-3-hd`. They may still appear in `GET /v1/models` — that catalog is display-only and has not caught up.
:::

### Microsoft — MAI-Image

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `mai-image-2.5-flash` | MAI-Image 2.5 Flash | 0.022 | per image, flat across 1K/2K/4K |
| `mai-image-2.5` | MAI-Image 2.5 | 0.037 | per image, flat across 1K/2K/4K |

**Use case:** Azure AI flagship image models with prompt rewriting. Both are flat-rated, so resolution costs nothing extra — the cheapest way to get a large render on the platform after `gemini-3.1-flash-lite-image`.

### BytePlus — SeedDream

Billed from the output token count BytePlus reports rather than a flat per-call rate, which is why the funds check and the charge are two separate steps on this path. The figures below are the per-image rates those tokens resolve to.

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `seedream-4-0-250828` | SeedDream 4.0 | 0.030 | per image, flat across 1K/2K/4K |
| `seededit-3-0-i2i-250628` | SeedEdit 3.0 | 0.030 | image-to-image, flat |
| `seedream-5-0-260128` | SeedDream 5.0 | 0.0315 | per image, flat across 1K/2K/4K |
| `seedream-4-5-251128` | SeedDream 4.5 | 0.036 | per image, flat |
| `dola-seedream-5-0-pro-260628` | SeedDream 5.0 Pro | 0.048 | 0.003 input + 0.045 output ✅ verified |

**Recommended:** `seedream-5-0-260128` -- Excellent quality-to-price ratio, the default model in most examples, flat-rated to 4K.

::: tip SeedDream 5.0 Pro has two legs and a 2K ceiling
Its price is the **sum** of an input leg (0.003) and an output leg (0.045) — $0.048 for a standard render. Above 2K the output leg doubles to 0.090, and the model is capped at 2K anyway, so a 4K request renders and bills 2K. It is the one model whose rate came directly from the provider's own price list.
:::

### BytePlus — Dreamina

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `dreamina-4-6` | Dreamina 4.6 | 0.031 | per image, flat across 1K/2K/4K, up to 14 reference images |

**Use case:** Image-to-image composition with up to 14 reference inputs, flat pricing regardless of output resolution. See the [full request reference](/api/image-generation#byteplus-dreamina-4-6-flat-per-image) — a single call can return a group of images unless `force_single` is set, and each delivered image is charged.

### xAI — Grok Imagine

| Model ID | Name | 1K | 2K | 4K | Capabilities |
|----------|------|---:|---:|---:|--------------|
| `grok-imagine-image` | Grok Imagine | 0.02 | 0.02 | 0.02 | T2I + single-image edit, multiple aspect ratios |
| `grok-imagine-image-pro` | Grok Imagine Pro | 0.05 | 0.07 | 0.07 | T2I + multi-image combine + higher fidelity |
| `grok-imagine-image-quality` | Grok Imagine Quality | 0.05 | 0.07 | 0.07 | as Pro ✅ verified |

**Use cases:** Product photography, e-commerce listings, multi-image combine, social media content. `grok-imagine-image` is flat-rated and one of the cheapest 4K renders available.

### BFL — FLUX

FLUX models for text-to-image and context-aware editing. Max resolution: 1440px per side.

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `flux-2-klein-4b` | FLUX.2 Klein 4B | 0.015005 | per image, flat |
| `flux-2-klein-9b` | FLUX.2 Klein 9B | 0.016077 | per image, flat |
| `flux-1.1-pro` | FLUX 1.1 Pro | 0.04 | per image, flat across 1K/2K/4K |
| `flux-kontext-pro` | FLUX Kontext Pro | 0.04 | context-aware editing, flat |
| `flux-1.1-pro-ultra` | FLUX 1.1 Pro Ultra | 0.06 | per image, flat |
| `flux-2-max` | FLUX.2 Max | 0.075027 | per image, flat |
| `flux-kontext-max` | FLUX Kontext Max | 0.08 | premium editing, flat |
| `flux-2-pro` | FLUX.2 Pro | **0.03 / 0.075 / 0.255** | per image, 1K / 2K / 4K |
| `flux-2-flex` | FLUX.2 Flex | **0.05 / 0.20 / 0.80** | per image, 1K / 2K / 4K |

**Use case:** `flux-kontext-pro` / `flux-kontext-max` for context-aware editing and style transfer. `flux-2-klein-*` for budget generation at a flat rate.

::: danger The two stepped FLUX models are the sharpest trap on the platform
`flux-2-pro` and `flux-2-flex` are the only FLUX models with a resolution grid, and their top steps are 8.5x and 16x their 1K prices. Omit `image_size` and you are billed $0.255 or $0.80 for a render you may have wanted at $0.03 or $0.05. Every other FLUX model ignores the field entirely.
:::

### MiniMax

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `minimax-image-01` | MiniMax Image | 0.03 | per image |

### Kling — Image

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `kling-v2-1` | Kling v2.1 | 0.012 | per image ✅ verified |
| `kling-v2` | Kling v2 | 0.025 | per image |
| `kling-v2-new` | Kling v2 (New) | 0.025 | per image |
| `kling-v3` | Kling v3 | 0.025 | per image ✅ verified |
| `kling-v3-omni` | Kling v3 Omni | 0.025 | per image, all modes ✅ verified |
| `kling-image-o1` | Kling Image O1 | 0.025 | per image, reasoning model |

**Use case:** Versatile multi-style generation with strong coherence; `kling-v3-omni` for the highest quality; `kling-image-o1` for prompt-reasoning-driven composition. Five of the six sit at the same $0.025, so choose on capability rather than price — and note that `kling-v2-1` at $0.012 is half the cost of the rest.

::: tip `kling-v3` and `kling-v3-omni` name two different things
Both ids exist as an **image** model and as a **video** model, at unrelated prices. Sent to `/v1/ai/generate/image` they cost $0.025 per image; sent to `/v1/ai/generate/video` they bill per second from the Kling V3 video rate ($0.077/s). The endpoint you call decides which one you get.
:::

### Image Editing (`POST /v1/ai/edit/image`)

| Model ID | Name | Price (USD) | Unit |
|----------|------|-------------|------|
| `imagen-3.0-capability-001` | Imagen 3 Capability | 0.04 | per edit, flat across 1K/2K/4K |

This endpoint has exactly one provider path and always runs Imagen 3 Capability — a `model` field in the body is ignored. Modes: `inpaint`, `outpaint`, `bgswap`, `remove`. See [Image Generation](/api/image-generation) for the request shape.

For mask-based editing with a different engine, see the Stability tools under [Image Processing Tools](#image-processing-tools) below, which are separately priced and reached through `/v1/images/*`.

---

## Video Generation Models

50+ models for text-to-video and image-to-video generation across 6 providers. Almost all bill **per second of output** (`rate × duration`), including MiniMax Hailuo — see the note under that section. Seedance is the exception and is priced from a token count instead.

::: tip Multiply by the duration
A per-second rate is not a per-clip price. `veo-3.1-generate-001` at $0.20/s is $1.00 for a 5-second clip and $1.60 for the 8-second default. `POST /v1/billing/estimate` will price a specific `{model, duration, resolution}` for you before you run it.
:::

### Google — Veo (Vertex AI)

| Model ID | Name | USD/s | 5s clip | Max Resolution | Audio |
|----------|------|------:|--------:|-----------------|-------|
| `veo-3.1-lite-generate-001` | Veo 3.1 Lite | 0.03 | 0.15 | 1080p | native |
| `veo-3.0-fast-generate-001` | Veo 3 Fast | 0.08 | 0.40 | 1080p | native |
| `veo-3.1-fast-generate-001` | Veo 3.1 Fast | 0.08 | 0.40 | 4K | native |
| `veo-3.0-generate-001` | Veo 3 | 0.20 | 1.00 | 1080p | native |
| `veo-3.1-generate-001` | Veo 3.1 | 0.20 | 1.00 | 4K | native |
| `veo-2.0-generate-001` | Veo 2 | 0.50 | 2.50 | 720p | none |

**Recommended:** `veo-3.1-generate-001` — Highest quality, native audio, last-frame + reference-image support, up to 4K.

**Note on Veo 2:** it is the most expensive model in the family, caps at 720p, and has no audio. It is kept for compatibility only — `veo-3.1-lite-generate-001` is 16x cheaper with native audio.

Veo defaults to an **8-second** clip when `duration` is omitted, and you are billed for what renders — $1.60 on Veo 3.1, not $1.00.

### Google — Gemini Omni Flash (native audio)

| Model ID | Name | USD/s | 5s clip | Resolution | Audio |
|----------|------|------:|--------:|------------|-------|
| `gemini-omni-flash` | Gemini Omni Flash | 0.1014 | 0.507 | 720p (fixed) | native (automatic) |

T2V, I2V, and reference-to-video (≤3 images), 2-10s. Unlike Veo, audio is generated automatically — there's no separate `audio` surcharge tier, and resolution/duration aren't independently configurable (duration is prompt-controlled).

### ByteDance — Seedance

Seedance is the one family **not** priced per second. BytePlus meters it by token count, which is computed from duration *and* resolution together, so a 720p clip is roughly 2.15x a 480p one rather than a fixed rate. All rates below are per 1K tokens and came from BytePlus's own invoice.

| Model ID | Name | 480p /1K tok | 720p /1K tok | Higher | 5s @ 720p |
|----------|------|------------:|------------:|--------|----------:|
| `seedance-1-0-pro-fast-251015` | Seedance 1.0 Pro Fast | 0.001 | 0.001 | 1080p 0.001 | 0.1089 |
| `seedance-1-5-pro-251215` | Seedance 1.5 Pro | 0.0012 | 0.0012 | 1080p 0.0012 | 0.1307 |
| `seedance-1-0-pro-250528` | Seedance 1.0 Pro | 0.0025 | 0.0025 | 1080p 0.0025 | 0.2723 |
| `seedance-2-0-mini` | Seedance 2.0 Mini | 0.0035 | 0.0035 | — | 0.3812 |
| `seedance-2-0-fast` | Seedance 2.0 Fast | 0.0056 | 0.0056 | — | 0.6098 |
| `seedance-2-0-pro` | Seedance 2.0 Pro | 0.007 | 0.007 | 1080p 0.0077, 4K 0.004 | 0.7623 |
| `seedance-2-5` | Seedance 2.5 | 0.0107 | 0.0107 | — | 1.1652 |

Capabilities: `seedance-2-0-pro` reaches **4K** (4-15s). `seedance-2-5` gives the **longest clip — 4-30s in one request** at a 720p ceiling, with audio included, video-to-video editing, and 30 image + 10 video + 10 audio references. `seedance-1-5-pro-251215` charges an extra 0.0024/1K tokens when audio is generated.

::: warning Not every model offers every resolution
`seedance-2-0-mini`, `-2-0-fast` and `-2-5` price **480p and 720p only**. A request above that is refused rather than silently billed at a neighbouring resolution's rate. `seedance-2-0-pro` is the only one that prices 1080p and 4K. Two further ids — `seedance-1-0-lite-i2v-250428` and `seedance-1-0-lite-t2v-250428` — have no rate at all and cannot be billed; do not build against them.

Also: `seedance-2-0-pro.3` and `seedance-2-0-pro.3-fast` are **not** Seedance. Despite the ids they route to MiniMax Hailuo 2.3 and are priced from the Hailuo table below.
:::

Seedance runs asynchronously: `POST /v1/ai/generate/video` returns `202` with a
`job_id` and `poll_url`. See the [Seedance 2.5 reference](/api/video-generation#seedance-2-5-long-clips-video-editing)
for the full parameter set, task-type constraints, and video-editing examples.

### ByteDance — Avatar & Motion Transfer

Two distinct capabilities on a dedicated endpoint pair (not `/v1/ai/generate/video`) — see the [full reference](/api/avatar-motion).

| Model ID | Name | USD/s | 5s clip | Capability |
|----------|------|------:|--------:|------------|
| `dreamactor-m2` | DreamActor M2.0 | 0.05 | 0.25 | motion transfer — image + driving video → performing character, 3-30s input |
| `omnihuman-1-0` | OmniHuman 1.0 | 0.12 | 0.60 | avatar — image + audio → talking/performing video, no driving video needed, ≤15s |
| `omnihuman-1-5` | OmniHuman 1.5 | 0.12 | 0.60 | same as 1.0, plus multi-character scene support via subject detection |

### Alibaba — Wan

Wan covers text-to-video (t2v), image-to-video (i2v), keyframe interpolation (kf2v), reference-to-video (r2v), video editing (VACE), and digital-human (S2V). It holds the cheapest per-second rate on the platform.

| Model ID | Name | USD/s | 5s clip | Mode |
|----------|------|------:|--------:|------|
| `wan2.2-t2v-plus` / `wan2.2-i2v-plus` | Wan 2.2 Plus | 0.02 | 0.10 | t2v / i2v |
| `wan2.2-i2v-flash` | Wan 2.2 I2V Flash | 0.02 | 0.10 | i2v |
| `wan2.2-kf2v-flash` | Wan 2.2 KF2V | 0.02 | 0.10 | keyframe |
| `wan2.6-i2v-flash` | Wan 2.6 I2V Flash | 0.025 | 0.125 | i2v |
| `wan2.1-i2v-turbo` / `wan2.1-t2v-turbo` | Wan 2.1 Turbo | 0.036 | 0.18 | t2v / i2v |
| `wan2.6-r2v-flash` | Wan 2.6 R2V Flash | 0.043 | 0.215 | reference-to-video |
| `wan2.6-t2v` / `wan2.6-i2v` | Wan 2.6 | 0.10 | 0.50 | t2v / i2v |
| `wan2.5-t2v-preview` / `wan2.5-i2v-preview` | Wan 2.5 | 0.10 | 0.50 | t2v / i2v |
| `wan2.1-t2v-plus` | Wan 2.1 Plus | 0.10 | 0.50 | t2v |
| `wan2.1-kf2v-plus` | Wan 2.1 KF2V Plus | 0.10 | 0.50 | keyframe |
| `wan-vace` | Wan VACE Editor | 0.10 | 0.50 | video editing (inpaint/outpaint/repaint/extend) |
| `wan-s2v` | Wan S2V Digital Human | 0.10 | 0.50 | portrait + audio → talking head |
| `wan2.6-r2v` | Wan 2.6 R2V | 0.10 | 0.50 | reference-to-video, highest fidelity |

**Budget pick for the whole platform:** the three `wan2.2-*` models at $0.02/s — a 5-second clip for ten cents.

### Kuaishou — Kling AI

| Model ID | Name | USD/s | 5s clip |
|----------|------|------:|--------:|
| `kling-v2-5-turbo` | Kling v2.5 Turbo | 0.026 | 0.13 |
| `kling-v1` | Kling v1.0 | 0.038 | 0.19 |
| `kling-v2-6` | Kling v2.6 | 0.038 | 0.19 |
| `kling-v1-6` | Kling v1.6 | 0.051 | 0.255 |
| `kling-v2-master` | Kling v2.0 Master | 0.051 | 0.255 |
| `kling-v2-1-master` | Kling v2.1 Master | 0.051 | 0.255 |
| `kling-video-o1` | Kling Video O1 | 0.07 | 0.35 |
| `kling-v3` / `kling-v3-omni` | Kling v3 / v3 Omni | 0.077 | 0.385 |

`kling-v3` and `kling-v3-omni` are both billed from the Kling V3 video rate ($0.077/s) — the only V3 per-second rate we hold. Sent to the image endpoint the same two ids cost $0.025 per image instead; see the image section above.

### MiniMax — Hailuo

| Model ID | Name | USD/s | 5s clip | Notes |
|----------|------|------:|--------:|-------|
| `hailuo-o2` | Hailuo O2 | 0.017 | 0.085 | T2V + I2V + first/last-frame |
| `hailuo-2.3-fast` | Hailuo 2.3 Fast | 0.032 | 0.16 | I2V only, faster/cheaper |
| `hailuo-2.3` | Hailuo 2.3 | 0.047 | 0.235 | T2V + I2V, camera commands |
| `hailuo-s2v` | Hailuo S2V | 0.047 | 0.235 | subject-reference (face consistency) |

::: warning Hailuo is per-second, not per-video
Earlier revisions of this page described Hailuo as flat per-video pricing. It is not: every model in the family is metered per second of output, so a 6-second Hailuo 2.3 render is $0.282, not a one-off charge. `seedance-2-0-pro.3` and `seedance-2-0-pro.3-fast` are aliases into this family and are priced as `hailuo-2.3` and `hailuo-2.3-fast`.
:::

### OpenAI — Sora 2

| Model ID | Name | USD/s | 5s clip | Max Duration |
|----------|------|------:|--------:|---------------|
| `sora-2` | Sora 2 | 0.13 | 0.65 | 12s |
| `sora-2-azure` | Sora 2 — FOTOhub (Azure-hosted) | 0.13 | 0.65 | 12s |
| `sora-2-pro` | Sora 2 Pro | **0.30 / 0.50 / 0.70** | 1.50 / 2.50 / 3.50 | 25s |

::: danger `sora-2-pro` is priced per resolution and defaults to the most expensive one
Its rate is $0.30/s at 720p, $0.50/s at 1024p and $0.70/s at 1080p — and 1080p is what you get if you omit `resolution`. A 12-second clip is $3.60 at 720p and $8.40 at 1080p. It is the only video model with a resolution grid; everything else in this section ignores the field for pricing.
:::

### xAI — Grok Video

| Model ID | Name | USD/s | 5s clip | Notes |
|----------|------|------:|--------:|-------|
| `grok-imagine-video` | Grok Video | 0.07 | 0.35 | T2V + I2V + video editing + reference-to-video |
| `grok-imagine-video-1.5` | Grok Video 1.5 | 0.14 | 0.70 | I2V + editing + **lip-sync** (portrait + text → talking head), up to 1080p |

### Other video models

Priced and callable, listed here for completeness rather than recommended.

| Model ID | Name | USD/s | 5s clip |
|----------|------|------:|--------:|
| `luma-ray-v2` | Luma Ray 2 | 0.032 | 0.16 |
| `nova-reel` | Amazon Nova Reel | 0.048 | 0.24 |
| `flash-avatar-generate` | Flash Avatar | 0.12 | 0.60 |
| `happyhorse-1.0-t2v` / `-i2v` | HappyHorse 1.0 | 0.10 | 0.50 |
| `happyhorse-1.1-t2v` / `-i2v` | HappyHorse 1.1 | 0.10 | 0.50 |

**Recommended:** `veo-3.1-generate-001` — Highest quality, cinematic output with native audio.

**Budget pick:** `wan2.2-t2v-plus` / `wan2.2-i2v-plus` — Lowest per-second cost with good quality for social media content.

**Native audio without Veo:** `gemini-omni-flash` generates audio automatically for every clip, no separate surcharge.

**Lip-sync generation:** `grok-imagine-video-1.5` — the only *generative* model with built-in lip-sync (portrait + script → talking head). For syncing existing footage to new audio instead, see [Lip-Sync](/api/lip-sync).

---

## Chat and LLM Models

**Every chat endpoint bills from real token counts.** There is no flat per-request chat price and no credit-based chat tier — earlier revisions of this page described one, and it does not exist. What all three endpoints do is check your wallet holds enough for a plausible worst case *before* calling the provider, then charge the exact input/output token cost *after* the response comes back. If the wallet is empty you get a `402` and no provider call is made.

::: warning The chat endpoints accept a short, fixed list of ids
`GET /v1/models?category=text` is a display catalog and lists more names than the chat endpoints will route. The three tables below are the complete set of accepted ids. Anything else returns `400`.
:::

### `POST /v1/ai/chat/completions` — OpenAI-compatible, streaming

Four ids, aliased onto current models so your integration doesn't break when we upgrade the backing version:

| Model ID | Routes to | Input $/1M | Output $/1M |
|----------|-----------|-----------:|------------:|
| `gemini-flash` | Gemini 2.5 Flash | 0.30 | 2.50 |
| `gemini-pro` | Gemini 2.5 Pro | 1.25 | 10.00 |
| `gpt-4o` | GPT-5.1 | 3.00 | 15.00 |
| `claude-sonnet` | Claude Sonnet 4.6 | 3.00 | 15.00 |

**Budget pick:** `gemini-flash` — 10x cheaper on input than anything else on the endpoint.

### `POST /v1/ai/chat/claude` — premium chat (no streaming)

Nine ids across Anthropic and Amazon:

| Model ID | Input $/1M | Output $/1M |
|----------|-----------:|------------:|
| `nova-micro` | 0.035 | 0.14 |
| `nova-2-lite` | 0.04 | 0.16 |
| `nova-lite` | 0.06 | 0.24 |
| `claude-haiku-4.5` | 0.80 | 4.00 |
| `nova-pro` | 0.80 | 3.20 |
| `nova-premier` | 2.50 | 10.00 |
| `claude-sonnet-4` | 3.00 | 15.00 |
| `claude-sonnet-4.5` | 3.00 | 15.00 |
| `claude-sonnet-4.6` | 3.00 | 15.00 |

**Budget pick:** `nova-micro` at $0.035/$0.14 is the cheapest LLM on the platform — roughly 1/85th the input cost of a Sonnet call.

### `POST /v1/ai/agent` and `/v1/ai/agent/stream` — tool-using agent

Only the four Claude ids are accepted here: `claude-sonnet-4.6`, `claude-sonnet-4.5`, `claude-sonnet-4`, `claude-haiku-4.5`. The Nova models are not available on the agent endpoints because they do not support the tool-use protocol the agent loop needs. Token rates are the same as the table above.

::: tip How a chat charge lands in your wallet
1. The request arrives and the wallet is checked against an upper-bound estimate. Not enough balance → `402 insufficient_funds`, nothing is called, nothing is charged.
2. The provider runs.
3. The real `input_tokens` / `output_tokens` are multiplied by the rates above and that exact amount is debited.

So the amount on your `/v1/billing/usage` row is the true cost of the completion, not a rounded package price. Output tokens dominate — on Sonnet they cost 5x input.
:::

---

## Music and Audio Models

### Music Generation

Music is billed **per minute of generated audio**, so a 30-second track costs half a minute's rate.

| Model ID | Name | USD/min | 30s track | Duration |
|----------|------|--------:|----------:|----------|
| `minimax` | MiniMax Music | 0.025 | 0.0125 | 30s / 60s / 120s |
| `elevenlabs` | IDA Cloud Music | 0.045 | 0.0225 | 30s / 60s / 120s |

`POST /v1/ai/generate/music` accepts exactly these two `provider` values. Other music engines exist internally but are not exposed on the public API; the price keys behind them (`lyria-music` $0.055/min, `stable-audio-music` $0.035/min, `audio-beats` $0.037/min) appear in `GET /v1/pricing` for reference and for pipelines that reach them through Gabriel.

**Budget pick:** `minimax` at $0.025/min — a two-minute track for five cents.

### Other audio operations

Also per minute of audio, on their own endpoints:

| Price key | USD/min | What it does |
|-----------|--------:|--------------|
| `audio-podcast` | 0.030 | multi-speaker podcast assembly |
| `audio-stems` | 0.030 | stem separation |
| `audio-mastering` | 0.025 | mastering chain |
| `audio-translation` | 0.025 | speech translation |
| `translation` | 0.021436 | text translation leg |
| `dubbing` | 0.080386 | full dubbing pipeline |

### Sound Effects (SFX)

| Price key | Price | Unit |
|-----------|------:|------|
| `elevenlabs-sfx` | 0.015 | per request |
| `sfx-elevenlabs` | 0.040193 | per request |

Text-to-SFX generation via `POST /v1/ai/generate/sfx`, up to 30 seconds. Uses the `prompt` field for the description. Unlike music, SFX is a flat per-request charge — duration does not change the price.

### Text-to-Speech (TTS)

Billed **per 1000 characters submitted** — not per request and not in 10K blocks. A 250-character line costs a quarter of the rate below; the minimum charge is 1 block.

| Model / `provider` value | Price key | USD / 1K chars | Notes |
|--------------------------|-----------|---------------:|-------|
| `grok-tts` | `grok-tts` | 0.015 | xAI voices |
| `google` | `tts-google` | 0.015 | 30+ languages, neural voices |
| Azure Speech (`/v1/ai/tts/azure`) | `tts-azure` | 0.015 | 700+ voices, 140 languages, SSML, emotional styles |
| AWS Polly (`/v1/ai/tts/polly`) | `tts-polly` | 0.016 | 100+ voices, 29 languages incl. Polish |
| `ida-voice`, `ida-voice-pro`, `elevenlabs`, `mars-pro`, `mars-flash` | `tts-elevenlabs` | 0.030 | voice cloning, emotion control |
| `gpt-audio-1.5-tts` | `gpt-audio-1.5-tts` | 2.50 in / 100.00 out per 1M tokens | token-billed, not per character |

::: warning Only `google` gets the cheap rate on `/v1/ai/generate/speech`
On that endpoint the price key is derived from the provider name, and only `google` has its own entry. `ida-voice`, `ida-voice-pro`, `elevenlabs`, `mars-pro` and `mars-flash` all resolve to `tts-elevenlabs` at $0.030/1K chars — twice the Google rate — regardless of which of those five names you send. If cost matters more than voice quality, `google` at $0.015 or Polly at $0.016 are the ones to pick.
:::

### Speech-to-Text (STT)

Billed per **started** minute of input audio, so a 95-second file bills 2 minutes.

| Model | Price key | USD/min |
|-------|-----------|--------:|
| Grok STT | `grok-stt` | 0.001667 |
| Whisper Large v3 | `whisper-transcription` | 0.006 |
| GPT Audio 1.5 Transcribe | `gpt-audio-1.5-transcribe` | 0.006 |
| default transcription | `transcription` | 0.006 |
| ElevenLabs Scribe | `elevenlabs-transcription` | 0.010 |
| Voxtral Mini 3B | `transcribe-voxtral-mini` | 0.005 |
| Voxtral Small 24B | `transcribe-voxtral-small` | 0.020 |

**Voxtral summarization** adds a per-request leg on top of the per-minute one: `summarize-voxtral-mini` $0.005/min + $0.005/request, `summarize-voxtral-small` $0.02/min + $0.01/request. A 10-minute summary on Small is $0.21.

**Budget pick:** `grok-stt` at $0.001667/min — an hour of audio for ten cents. **Quality pick:** Voxtral Small, an LLM rather than a classical ASR, so it follows context and instructions.

### Voice cloning and realtime

| Price key | Price | Unit |
|-----------|------:|------|
| `elevenlabs-voice-clone` | 0.30 | per clone |
| `voice-clone` | 0.535906 | per clone |
| `voice_realtime_session` | 0.267953 | per session |

**Use case:** Transcription, subtitles, meeting notes, dubbing pipelines.

---

## Analysis & Document Models

Image analysis, detection, OCR, and photo intelligence. These are returned under the `image` category in `/v1/models`.

| Model ID | Name | Price (USD) | Unit |
|----------|------|------------:|------|
| `detect-sensitive-data` | PII / sensitive-data detection | 0.002 | per image analyzed |
| `photo-analysis` | Photo Analysis | 0.003 | per image analyzed |
| `analyze-photo` | Photo Analysis (alias) | 0.003 | per image analyzed |
| `google-vision-ocr` | Google Vision OCR | 0.003 | per image analyzed |
| `anonymize-image` | Face / plate anonymization | 0.005 | per image |
| `face-detection` | Face Detection | 0.010718 | per image analyzed |
| `nsfw-detection` | NSFW / Safety Detection | 0.010718 | per image analyzed |
| `ocr` | OCR (text extraction) | 0.010718 | per image analyzed |

**Recommended:** `photo-analysis` -- General-purpose image understanding, captioning, and content classification, and at $0.003 the cheapest analysis call on the platform.

**Note:** `google-vision-ocr` at $0.003 does the same job as `ocr` at $0.010718 for a third of the price. Pick `ocr` only if you need the FOTOhub-normalized response shape.

### Document Intelligence (Textract)

| Operation | Price key | Price (USD) | Use Case |
|-----------|-----------|------------:|----------|
| `detect-text` (OCR) | `textract-detect` | 0.0015 | Simple text extraction from images/documents |
| `analyze-expense` (Invoices) | `textract-expense` | 0.010 | Invoice/receipt data extraction |
| `analyze` (Tables+Forms) | `textract-analyze` | 0.015 | Table/form structured extraction |

All three are flat per-document charges and all three are ✅ verified against the AWS Textract price list. See [Document Intelligence](/api/document-intelligence) for full API reference.

---

## 3D Generation Models

5 models for converting images or text to 3D assets. See [3D Generation](/api/3d-generation) for full API reference.

| Model ID | Name | Price (USD) | Speed | Modes | Quality |
|----------|------|------------:|-------|-------|---------|
| `fh-lite-3d` | FH Lite 3D | 0.160772 | ~3s | image-to-3d | ★★★ |
| `fh-text-3d` | FH Text 3D | 0.267953 | ~25s | text-to-3d | ★★ |
| `fh-pro-3d` | FH Pro 3D | 0.803859 | ~60s | image-to-3d | ★★★★★ |

Flat per-request pricing (price keys `3d_fh-lite-3d`, `3d_fh-text-3d`, `3d_fh-pro-3d`). Polygon count and output format do not change the charge.

**Recommended:** `fh-lite-3d` — Best speed-to-quality ratio for product photography and e-commerce use cases.

**Premium pick:** `fh-pro-3d` — Highest quality with PBR textures, supports both image and text input. Ideal for production 3D assets.

**Output formats:** GLB (web/AR), OBJ (editing), STL (3D printing), USDZ (Apple AR).

---

## Storage and Compute Resources

Storage and GPU time are billed from the same prepaid wallet as generations — there is no separate storage invoice and no included free allowance on the API.

### Storage — per GB-month

| Class | Price key | USD / GB / month |
|-------|-----------|-----------------:|
| Archive | `storage-archive` | 0.008039 |
| Standard | `storage-standard` | 0.026795 |
| Premium (SSD) | `storage-premium` | 0.080386 |

Storage is metered hourly and charged as a fraction of the month, so 5 GB of Standard held for 6 hours is `5 × 0.026795 × 6/720` = $0.0011. The charge appears on your usage feed as a storage line, and if the wallet is empty the meter stops rather than accruing a debt.

::: tip A provisioned bucket is billed from byte zero
If you provision a bucket with a `gb_limit`, that limit is the **capacity you are paying for**, not a ceiling you grow into — an empty 100 GB Standard bucket still bills `100 × 0.026795` = $2.68/month. Provision the size you need.
:::

### GPU compute — per request

| Tier | Price key | Price (USD) |
|------|-----------|------------:|
| T4 | `gpu-t4` | 0.401929 |
| L4 | `gpu-l4` | 0.803859 |
| A100 | `gpu-a100` | 3.215434 |

### Batch processing

Batch jobs carry no per-job fee. Each item inside the batch is charged at its own model rate — a 200-image batch on `image_batch` is `200 × 0.053591` = $10.72. Submitting the batch itself costs nothing.

---

## Model Selection Guide

Choosing the right model depends on your priorities: quality, speed, cost, or resolution.

### Images — best quality

- `imagen-4-ultra` — $0.160772/image, highest fidelity from Google
- `dola-seedream-5-0-pro-260628` — $0.048 at the standard leg, highest detail and prompt adherence
- `gemini-3-pro-image-preview` — $0.134 at 1K **and** at 2K, so 2K is the same price as 1K

### Images — best speed

- `imagen-3-fast` — $0.020/image, optimized pipeline with good quality
- `gpt-image-2-mini` — $0.005 at 1K, the fastest cheap option
- `grok-imagine-image` — $0.02/image flat, no resolution grid to trip over

### Images — best value

- `ida-q-image` — **$0.00**, self-hosted, nothing is deducted from your wallet
- `gpt-image-2-mini` — $0.005 at 1K, cheapest invoiced image on the platform
- `gpt-image-2` — $0.006 at 1K
- `kling-image-v2-1` — $0.012/image flat

### Images — 4K output

- `imagen-4-ultra` — native 4K at $0.160772
- `flux-2-pro` — 4K at $0.255, but note that is 8.5x its 1K price
- SeedDream 4K: available on the 4-0/4-5/5-0 line; `dola-seedream-5-0-pro-260628` caps at 2K

### Video — best value

- `wan2.2-t2v-plus` / `wan2.2-i2v-plus` / `wan2.2-i2v-flash` — $0.02/s, $0.10 for a 5-second clip
- `hailuo-o2` — $0.017/s
- `kling-v2-5-turbo` — $0.026/s

### Video — best quality

- `veo-3.1-generate-001` — $0.20/s, 4K with native audio
- `seedance-2-0-pro` — up to 4K, 4-15s, $0.76 for 5s at 720p
- `sora-2-pro` — $0.30–0.70/s depending on resolution; set `resolution` explicitly

### Chat — best value

- `nova-micro` — $0.035 in / $0.14 out per 1M tokens
- `gemini-flash` — $0.30 / $2.50, the cheapest option on the OpenAI-compatible endpoint

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

Professional image editing via Stability AI and FOTOhub proprietary engines. Everything here is a flat per-image charge.

### Stability AI tools (`POST /v1/ai/stability/{tool}`)

Price keys are `stability_{tool}`. All thirteen are ✅ verified against Stability's published credit-to-dollar rate.

| Tool | Price (USD) | Description |
|------|------------:|-------------|
| `fast-upscale` | 0.03 | 4x upscale, instant |
| `outpaint` | 0.06 | Extend canvas in any direction |
| `erase-object` | 0.07 | Content-aware object removal via mask |
| `inpaint` | 0.07 | Generate new content in masked area |
| `remove-background` | 0.07 | Cut to transparent PNG |
| `search-replace` | 0.07 | Replace objects by text description |
| `search-recolor` | 0.07 | Change colour of specific objects |
| `style-guide` | 0.07 | Apply a style reference to a generation |
| `control-sketch` | 0.07 | Sketch-guided generation |
| `control-structure` | 0.07 | Structure-preserving generation |
| `style-transfer` | 0.08 | Apply style from reference image |
| `conservative-upscale` | 0.40 | Faithful high-res upscale |
| `creative-upscale` | 0.60 | 4x upscale with detail synthesis |

### FOTOhub image tools

| Tool | Price (USD) | Description |
|------|------------:|-------------|
| `image_enhance` | 0.053591 | Automatic image enhancement |
| `image_denoise` | 0.053591 | Remove noise while preserving detail |
| `image_color_grade` | 0.053591 | AI colour correction and grading |
| `image_clip_tag` | 0.053591 | Auto-generate descriptive tags |
| `image_clip_embed` | 0.053591 | Embedding vector for search |
| `image_batch` | 0.053591 | Per image inside a batch |
| `image_colorize` | 0.107181 | Colorize black & white photos |
| `image_depth_map` | 0.107181 | Generate depth map from image |
| `image_face_restore` | 0.107181 | Restore degraded/old faces |
| `remove_background` | 0.107181 | Background removal |
| `blur_background` | 0.107181 | Depth-aware background blur |
| `add_shadow` | 0.107181 | Synthetic contact shadow |
| `remove_background_advanced` | 0.214362 | Hair/edge-refined cutout |
| `replace_background` | 0.214362 | Cutout + generated backdrop |

::: tip Stability's `remove-background` is cheaper than ours
$0.07 versus $0.107181, and $0.214362 for the advanced variant. Use `stability_remove-background` unless you need the hair-level edge refinement.
:::

See [Image Processing](/api/image-processing) for full API reference.

---

## Video Editing (FFmpeg pipeline)

Flat per-request charges on `/v1/ai/video/*`, independent of clip length.

| Operation | Price (USD) |
|-----------|------------:|
| `transcode` | 0.053591 |
| `merge` | 0.107181 |
| `speed` | 0.107181 |
| `effects` | 0.107181 |
| `watermark` | 0.107181 |
| `stabilize` | 0.160772 |
| `subtitles` | 0.160772 |
| `upscale` | 0.214362 |
| `ai_director` | 0.267953 |

---

## Lip-Sync & Face Animation

Flat per-request charges.

| Model | Price (USD) | Speed | Quality | Description |
|-------|------------:|-------|---------|-------------|
| `musetalk` | 0.428725 | Fast | Good | Real-time lip-sync, MuseTalk 1.5 |
| `latentsync` | 0.803859 | Medium | High | HD diffusion-based, LatentSync 1.6 |
| `facefusion` | 1.071811 | Slow | Ultra | Multi-stage pipeline, FaceFusion 3.x |

See [Lip-Sync](/api/lip-sync) for full API reference.

---

## Try-On

| Model ID | Price (USD) | Notes |
|----------|------------:|-------|
| `virtual-try-on-001` | 0.064309 | single garment |
| `fashn-tryon-v1.6` | 0.080386 | garment on model photo |
| `virtual-try-on-outfit` | 0.128617 | full outfit composition |

---

## Shorts & Video Pipeline

Automated video-to-shorts pipeline with AI-powered editing. Each step is a flat per-request charge, so you can run steps individually or let the agent chain them.

| Step | Price (USD) | Description |
|------|------------:|-------------|
| Ingest | 0.107181 | Upload and analyze video |
| Transcribe | 0.107181 | Speech-to-text with WhisperX |
| Captions | 0.107181 | Auto-generated subtitles |
| Detect Scenes | 0.160772 | Automatic scene boundaries |
| Reframe | 0.160772 | Smart aspect ratio adaptation |
| Generate Clips | 0.267953 | AI-selected best moments |
| Render | 0.267953 | Final short video output |
| **Full Agent** | **0.803859** | **Entire pipeline automated** |

Running the seven steps by hand totals $1.17, so the agent at $0.803859 is the cheaper path when you want the whole pipeline.

See [Shorts & Clips](/api/shorts-clips) for full API reference.

---

## Story Studio

| Operation | Price (USD) |
|-----------|------------:|
| `story_regenerate` | 0.160772 |
| `story_step` | 0.267953 |
| `story_step_videos` | 0.535906 |
| `story_full` | 1.607717 |

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

## API Tiers

::: warning A tier does not buy you generations
Every model call on this page is paid for out of your prepaid **wallet balance in USD**, whatever tier you are on. Tiers only set throughput. There is no plan that includes generations, no monthly credit allowance on the API, and no free tier — a new key starts on `payg-basic` with no monthly fee and can generate as soon as the wallet is funded.
:::

### Pay-as-you-go (no monthly fee)

Three tiers, and you move between them automatically as your account grows — there is nothing to buy and nothing to cancel.

| Tier slug | RPM | Auto-activates at |
|-----------|----:|-------------------|
| `payg-basic` | 30 | default for every new account |
| `payg-standard` | 120 | $25 wallet balance and $50 lifetime spend |
| `payg-premium` | 500 | $120 wallet balance and $500 lifetime spend |

### Subscriptions (throughput only)

| Tier slug | Name | Price/month | RPM | API keys | Support |
|-----------|------|------------:|----:|---------:|---------|
| `sub-developer` | Developer | 49 PLN | 60 | 5 | email |
| `sub-startup` | Startup | 199 PLN | 300 | 20 | priority email |
| `sub-business` | Business | 799 PLN | 1,000 | unlimited | dedicated, 99.9% SLA |
| `sub-enterprise` | Enterprise | custom | 5,000 | unlimited | dedicated, SSO/SAML, custom infra |

A subscription buys request throughput and support, not generations. `payg-premium` reaches a higher RPM than `sub-developer` and `sub-startup` at no monthly cost, so subscribe for the support and key limits, not for the rate.

::: tip What is actually enforced
**Requests per minute is the limit your calls hit.** Certain expensive endpoints carry their own tighter per-endpoint cap that applies regardless of tier — a `429` on video generation while you are far below your RPM is that cap, not a bug. Your rate-limit state is always readable from the `X-RateLimit-*` response headers.
:::

See [Billing & Pricing](/api/billing) for wallet top-ups, invoice settings, and usage reporting.
