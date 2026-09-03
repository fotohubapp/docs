# Image Generation

FOTOhub provides access to **30+ image generation models** from 8 providers: Google (Vertex AI Imagen + Gemini), OpenAI, Microsoft, BytePlus, xAI, Black Forest Labs, MiniMax, and Kling. Generate photorealistic images, illustrations, concept art, and more via a single unified endpoint.

::: info One billing mode: prepaid USD
Every image is charged in **USD from your prepaid wallet**, at the provider's own
per-image price. There are no credits on this endpoint, no plan allowance, and no
currency conversion — a fotohub.app subscription cannot pay for API usage. Prices run
from **$0.005** to **$0.80** per image depending on the model and the resolution tier.

Two things follow from that:

- **Some models are flat-priced, some are tiered.** A tiered model charges more at 2K
  than at 1K and more again at 4K; a flat-priced one charges the same at any size. Which
  is which is per model, not per provider — see [All models](#all-models-complete-pricing).
- **An empty wallet stops the request** with [402 `insufficient_funds`](#_402-insufficient-funds)
  before the provider is called, and nothing is charged.
:::

## Endpoint

```
POST /v1/ai/generate/image
```

**Authentication:** Bearer token (API key)  
**Billing:** $0.005–$0.80 per image, from the prepaid USD wallet

## Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | **Yes** | — | Text description of the image to generate. Be specific — include subject, style, lighting, composition details for best results. We enforce no length limit; the provider may reject or truncate a very long prompt. |
| `model` | string | No | `"imagen-3-fast"` | Model identifier. See the full model list below. We recommend `seedream-5-0-260128` for best quality. |
| `width` | integer | No | — | Pixel width. Forwarded to the GPT Image and MAI models only; on every other model it just sets the **billed resolution tier** (see below). Prefer `image_size` + `aspect_ratio`. |
| `height` | integer | No | — | Pixel height. Same behaviour as `width`. |
| `aspect_ratio` | string | No | `"1:1"` | Aspect ratio preset. Options: `"1:1"`, `"16:9"`, `"9:16"`, `"4:3"`, `"3:4"`. Overrides width/height when set. |
| `num_images` | integer | No | `1` | Number of images to generate per request. A whole number, 1–8. Anything else (`0`, `-1`, `2.5`, `"3"`) is a `400`, never a silently rewritten value. You pay per **delivered** image — see [Multiple images](#multiple-images-and-what-you-pay-for). |
| `image_size` | string | No | — | Resolution tier: `"1K"`, `"1.5K"`, `"2K"`, `"3K"`, `"4K"`; anything else is a `400`. Availability and price both depend on the model. **Send it.** On a tiered model, omitting it (and `width`/`height`) is charged at the **top** of the grid — see below. |
| `negative_prompt` | string | No | — | Describe what to avoid in the generated image. E.g., `"blurry, low quality, distorted faces"`. Not supported by all models. |
| `seed` | integer | No | random | Seed for reproducible generation. Same prompt + seed + model = same output. Range: 0–4294967295. |

::: tip Resolution Tips
Use `aspect_ratio` instead of manual width/height for most use cases. The API automatically picks optimal dimensions for the selected model.
:::

::: warning `style`, `image_url` and `image_urls` are not accepted here
Earlier versions of this page documented all three on this endpoint. They are dropped
before the request reaches the provider — sending them changes nothing and does not
change the price:

- **`style`** — the generation pipeline reads a differently-named field with its own
  preset list, and this endpoint does not populate it. Put the style in the `prompt`
  instead (`"..., cinematic color grading, dramatic lighting"`), which works on every
  model.
- **`image_url` / `image_urls`** — this is a text-to-image endpoint. The one exception is
  [`dreamina-4-6`](#byteplus-dreamina-4-6-billed-per-returned-image), which does take `image_urls`
  (up to 14). For image-to-image and editing on other models use
  [`POST /v1/ai/edit/image`](/api/image-editing) or the
  [Stability tools](/api/image-editing#image-studio-stability-ai-tools).
:::

### Resolution changes the price — and omitting it costs the most

On a tiered model the tier is the price. `image_size` selects it directly; `width`/`height`
derive it from the longest side (`< 1536` → 1K, `1536–3071` → 2K, `≥ 3072` → 4K).

| Sent | Tier billed |
|------|-------------|
| `"image_size": "1K"` | 1K |
| `"image_size": "2K"` | 2K |
| `"width": 4096, "height": 4096` | 4K |
| **nothing** | **the model's highest tier** |

That last row is the one to plan around. With no tier to resolve, the charge cannot be the
1K rate — that would sell below what the provider bills us — so the top of the grid is
taken instead. On `gpt-image-2` that is **$0.211 rather than $0.006**, a 35x difference
decided by a missing field.

Two more things worth knowing:

- **Flat-priced models ignore the tier entirely.** Most active image models have no
  resolution dimension in their pricing and charge the base price at any size, so omitting
  `image_size` costs them nothing. That includes every SeedDream except the Pro one —
  `seedream-5-0-260128` is $0.0315 at 1K, 2K and 4K alike. Which models are tiered is listed
  under [All models](#all-models-complete-pricing).
- **A capped render is billed at what it produced.** Imagen delivers 2K when asked for 4K
  and is charged at its 2K rate; you are never billed for a resolution the model did not
  return.

The exact charge always comes back in the response as `cost_usd`, so read that rather than
pre-computing from the catalog.

## Response Format

```json
{
  "model": "imagen-4-standard",
  "cost_usd": 0.04,
  "currency": "USD",
  "billing": {
    "cost_usd": 0.04,
    "balance_usd": 24.28,
    "currency": "USD",
    "method": "wallet",
    "model": "prepaid"
  },
  "images": [
    "https://s1.fotohub.app/storage/v1/object/sign/api-generations/...?token=..."
  ]
}
```

| Field | Description |
|-------|-------------|
| `model` | The model that rendered the images. |
| `cost_usd` | USD taken from the wallet, net of any refund for undelivered images. This is the number to reconcile against. |
| `currency` | Always `"USD"`. |
| `billing.cost_usd` | Same figure as the top-level `cost_usd`. |
| `billing.balance_usd` | Wallet balance remaining after the charge. |
| `billing.method` / `billing.model` | Always `"wallet"` / `"prepaid"` — the API accepts no other payment. |
| `images` | Array of output URLs, one per delivered image. Signed URLs, valid **1 hour**; re-sign from [`GET /v1/console/logs`](/api/console-api#request-logs) or deliver to your own bucket. |
| `refunded_usd` | Present **only** when the provider returned fewer images than you asked for and the difference was refunded. See [Multiple images](#multiple-images-and-what-you-pay-for). |
| `delivery` | Present only when you sent an `output` object — which bucket and key the files are being written to. See [bucket delivery](/guides/bucket-delivery). |

There is no `credits_used` field, no `pln_charged`, and no plan allowance is consulted.
`method` is `"wallet"` on every successful response; there is no `"credits"` mode on this
endpoint.

::: warning There is no `metadata` object
Earlier versions of this page showed `metadata.width`, `metadata.seed` and
`metadata.generation_time_ms`. The generation pipeline does not return a `metadata` key,
so `data["metadata"]["seed"]` raises. The rendered size comes back in `usage.resolution`
on BytePlus models (below); the seed is the one you sent.
:::

### BytePlus SeedDream response — with `usage` and a cost breakdown

SeedDream and SeedEdit renders go through a path that reports the provider's own token
count and an itemized quote. Everything above still applies — the extra keys are
additive.

```json
{
  "model": "seedream-5-0-260128",
  "cost_usd": 0.0315,
  "currency": "USD",
  "billing": {
    "cost_usd": 0.0315,
    "balance_usd": 24.2485,
    "currency": "USD",
    "method": "wallet",
    "model": "prepaid",
    "output_tokens": 4096,
    "cost_breakdown": {
      "model": "seedream-5-0-260128",
      "currency": "USD",
      "amount_usd": 0.0315,
      "provider_cost_usd": 0.0315,
      "margin": 1.0,
      "breakdown": [
        {
          "leg": "output",
          "unit": "image",
          "quantity": 1,
          "rate_usd": 0.0315,
          "amount_usd": 0.0315
        }
      ],
      "pricing_verified": false
    }
  },
  "usage": {
    "output_tokens": 4096,
    "total_tokens": 4096,
    "generated_images": 1,
    "resolution": "1024x1024",
    "generation_ms": 2100,
    "transfer_ms": 310
  },
  "images": [
    "https://s1.fotohub.app/storage/v1/object/sign/api-generations/...?token=..."
  ]
}
```

| Field | Description |
|-------|-------------|
| `billing.output_tokens` | The provider's reported output token count. Informational — on flat-priced models it does **not** drive the price. |
| `cost_breakdown.amount_usd` | The quoted charge. Equals `cost_usd`. |
| `cost_breakdown.provider_cost_usd` | What the provider charges us. Identical to `amount_usd` while `margin` is `1.0`. |
| `cost_breakdown.margin` | The multiplier applied to the provider price. Currently **`1.0` on every model** — you pay the provider's price, 1:1. |
| `cost_breakdown.breakdown[]` | One entry per priced leg: `leg`, `unit`, `quantity`, `rate_usd`, `amount_usd`. A single-rate model has one leg; SeedDream Pro has two (`input` + `output`). |
| `cost_breakdown.pricing_verified` | `true` when the rate is a figure we hold from the provider's own published price list, `false` when it comes from our catalog. Either way it is what you were charged. |
| `cost_breakdown.note` | Present when a tier or threshold decided the rate, e.g. `"2K tier"` or `"4.19 MP (> 2.61 MP tier)"`. |

A two-leg quote — SeedDream Pro above its 2.61 MP threshold, `$0.003` input plus
`$0.090` output:

```json
{
  "model": "dola-seedream-5-0-pro-260628",
  "currency": "USD",
  "amount_usd": 0.093,
  "provider_cost_usd": 0.093,
  "margin": 1.0,
  "breakdown": [
    { "leg": "input",           "unit": "piece", "quantity": 1, "rate_usd": 0.003, "amount_usd": 0.003 },
    { "leg": "output_high_res", "unit": "piece", "quantity": 1, "rate_usd": 0.09,  "amount_usd": 0.09  }
  ],
  "pricing_verified": true,
  "note": "4.19 MP (> 2.61 MP tier)"
}
```

### Your Latency Budget

`usage` reports where the wall-clock time went, so a slow call points at a fix
rather than at a shrug.

| Field | Type | Description |
|-------|------|-------------|
| `output_tokens` | integer | The provider's reported output token count — scales with pixel count. Informational, not the basis of the charge |
| `total_tokens` | integer | Same figure with any input tokens included |
| `generated_images` | integer | Images actually produced (a partly-failed batch reports fewer than requested) |
| `resolution` | string | The size that was actually rendered, `WxH`. Compare it against what you asked for — a capped render is billed at what it produced |
| `generation_ms` | integer | Time the model spent rendering |
| `transfer_ms` | integer | Time spent fetching the finished file and storing it. `0` when nothing had to be moved |

::: tip Render time and transfer time are different problems
A large `generation_ms` is the model: choose a faster one, or a smaller
resolution. A large `transfer_ms` is file movement, dominated by file size and
by the distance to where the file is stored — a 4K image is roughly 16x the bytes
of a 1K one, and a [bucket delivery](/guides/bucket-delivery) destination on
another continent adds a round trip per file.

The two do not have to add up to your own measured request time. The remainder is
FOTOhub's orchestration: auth, quota and price lookup, billing, delivery routing.
`generation_ms` and `transfer_ms` are absent on paths that report a single
elapsed number instead of a split, so treat a missing field as "not measured",
never as `0`. Both are recorded per request in
[`GET /v1/console/logs`](/api/console-api#request-logs), which also rolls them up
per model.
:::

## All Models — Complete Pricing

Every price below is USD per image, taken from the prepaid wallet, at the provider's own
rate with **no margin** (`margin: 1.0`). Where a model is tiered, the 1K / 2K / 4K columns
are the three charges; where it is flat, one price covers every size.

A tiered model with no `image_size` and no `width`/`height` is billed at its **highest**
column, not its 1K one. Send the tier.

### Google Vertex AI (Imagen)

Flat-priced: Imagen charges the same at any requested size, and 4K requests are capped
to 2K by the provider.

| Model ID | Name | Price (USD) | Max `num_images` | Notes |
|----------|------|-------------|:----------------:|-------|
| `imagen-3-fast` | Imagen 3 Fast | 0.02 | 1 | fastest, cheapest Imagen |
| `imagen-3-standard` | Imagen 3 Standard | 0.04 | 3 | 1K |
| `imagen-4-fast` | Imagen 4 Fast | 0.02 | 3 | Imagen 4 quality at the Fast price |
| `imagen-4-standard` | Imagen 4 Standard | 0.04 | 4 | high quality |
| `imagen-4-ultra` | Imagen 4 Ultra | 0.06 | 5 | highest Imagen fidelity |

::: warning `imagen-3-capability` is not available on this endpoint
It has no price entry, so a request naming it fails with a `500` rather than rendering.
It is the model behind [`POST /v1/ai/edit/image`](/api/image-editing), which is where to
reach it — at that endpoint's own $0.04.
:::

### Google — Gemini (Nano Banana family)

Gemini's native multimodal image models — text-to-image, image-to-image, and multi-image composition (up to 10 reference images) in one model.

| Model ID | Name | 1K | 2K | 4K | Max `num_images` | Notes |
|----------|------|---:|---:|---:|:----------------:|-------|
| `gemini-3.1-flash-lite-image` | Nano Banana 2 Lite | 0.0336 | 0.0336 | 0.0336 | 5 | flat; cheapest Gemini image model |
| `gemini-2.5-flash-image` | Nano Banana | 0.039 | 0.039 | 0.039 | 10 | flat; up to 10 reference images |
| `nano-banana-fast` | Nano Banana Fast (alias) | 0.039 | 0.039 | 0.039 | 10 | alias of `gemini-2.5-flash-image` |
| `gemini-3.1-flash-image` | Nano Banana 2 | 0.067 | 0.101 | 0.151 | 10 | GA, tiered |
| `gemini-3.1-flash-image-preview` | Nano Banana 2 (Preview) | 0.067 | 0.101 | 0.151 | 10 | preview channel |
| `gemini-3-pro-image` | Nano Banana Pro | 0.134 | 0.134 | 0.24 | 15 | **Recommended for quality** — advanced reasoning, precise text rendering |
| `nano-banana-pro` | Nano Banana Pro (alias) | 0.134 | 0.134 | 0.24 | 15 | alias of `gemini-3-pro-image` |

### OpenAI

Every GPT Image model is tiered, and the spread is wide — `gpt-image-2` is 35x more at
4K than at 1K. Send `image_size` deliberately on this family.

| Model ID | Name | 1K | 2K | 4K | Notes |
|----------|------|---:|---:|---:|-------|
| `gpt-image-1-mini` | GPT Image 1 Mini | 0.005 | 0.011 | 0.036 | cheapest OpenAI option |
| `gpt-image-1` | GPT Image 1 | 0.011 | 0.042 | 0.167 | high fidelity |
| `gpt-image-1.5` | GPT Image 1.5 | 0.009 | 0.034 | 0.133 | better than 1 at a lower price |
| `gpt-image-2` | GPT Image 2 | 0.006 | 0.053 | 0.211 | **Recommended** — highest fidelity, 4K, best text rendering |

::: warning DALL·E 3 is retired
`dall-e-3`, `dall-e-3-standard` and `dall-e-3-hd` are gone. A request naming `dall-e-3`
or `dall-e-3-hd` is refused with a `400` **before authentication**, naming the
replacement (`gpt-image-1` and `gpt-image-1.5` respectively), and nothing is charged.
:::

### Microsoft — MAI-Image

| Model ID | Name | Price (USD) | Notes |
|----------|------|-------------|-------|
| `mai-image-2.5-flash` | MAI-Image 2.5 Flash | 0.022 | flat; budget/fast |
| `mai-image-2.5` | MAI-Image 2.5 | 0.037 | flat; up to 1024x1024 |
| `mai-image-2.5-pro` | MAI-Image 2.5 Pro | 0.108544 | flat; best photorealism and consistency |

These three are the only models besides the GPT Image family that receive your `width` and
`height` verbatim rather than just deriving a price tier from them. Both must be at least
768, and `width * height` must not exceed 1,048,576 — either side may pass 1024 as long as
the product stays under the cap (768x1365 is valid). Output is always PNG.

::: warning One image per request
MAI returns exactly **one** image per request. `num_images` above 1 is clamped to 1 and
billed as 1, so ask for more by making more requests.
:::

### BytePlus SeedDream

::: info SeedDream is flat-priced, not token-priced
An earlier version of this page described SeedDream as billed per output token, with a
`(width × height) / 256` formula and a 16x jump from 1K to 4K. That is not how it is
charged. **Every SeedDream model except the Pro one costs the same at 1K, 2K and 4K.**
`seedream-5-0-260128` is $0.0315 whether you render 1024x1024 or 4096x4096.

`usage.output_tokens` is still reported, because the provider reports it — but it does
not move the price on these models. The one resolution step in the family is SeedDream
Pro's output leg, which goes from $0.045 to $0.090 above 2.61 megapixels.
:::

| Model ID | Name | Price (USD) | Max `num_images` | Notes |
|----------|------|-------------|:----------------:|-------|
| `seedream-4-0-250828` | SeedDream 4.0 | 0.03 | 4 | flat at every resolution |
| `seedream-5-0-260128` | SeedDream 5.0 Lite | 0.0315 | 4 | **Recommended**, best value; flat at every resolution |
| `seedream-4-5-251128` | SeedDream 4.5 | 0.036 | 4 | flat at every resolution |
| `dola-seedream-5-0-pro-260628` | SeedDream 5.0 Pro (Dola) | 0.048 ≤2.61 MP · 0.093 above | 10 | two legs: $0.003 input + $0.045 or $0.090 output. Capped at 2K |
| `seededit-3-0-i2i-250628` | SeedEdit 3.0 (img2img) | 0.03 | 1 | flat at every resolution |

SeedDream Pro is the only model on this page priced by megapixels rather than by tier, so
its `cost_breakdown.note` reads e.g. `"1.05 MP (<= 2.61 MP tier)"`. Because the provider
caps it at 2K, a 4K request renders and bills at 2K — $0.093.

### BytePlus Dreamina 4.6 (billed per returned image)

Dreamina 4.6 (`model: "dreamina-4-6"`) is the one model on this endpoint that accepts
reference images — up to 14, for image-to-image composition — and it can output 1K/2K/4K.
It is billed per image **actually returned**, which is not always the number you asked
for.

| Model ID | Name | Price (USD) | Notes |
|----------|------|-------------|-------|
| `dreamina-4-6` | Dreamina 4.6 | 0.031 per image | up to 14 reference images, force_single by default. Same price at every resolution. |

::: warning A single request can return multiple images
Dreamina 4.6 supports generating a group of up to 9 images from one prompt. This endpoint sends `force_single: true` by default so you are charged for exactly 1 image — pass `"force_single": false` (or `"num_images"` greater than 1) if you want a group, and note that the response is billed for however many images actually come back, not a number you request.
:::

**Additional request parameters for `dreamina-4-6`:**

| Parameter | Type | Default | Description |
|-----------|------|---------|--------------|
| `image_urls` | array of string | — | Up to 14 reference image URLs for image-to-image composition. |
| `width` / `height` | integer | model default | Both required together to set an explicit output size (1024×1024 up to 4096×4096). |
| `seed` | integer | random | Fixed seed for reproducible output. |
| `force_single` | boolean | `true` | Set `false` to allow BytePlus to return a group of images for one prompt. |

```json
{
  "prompt": "a red ceramic mug on a marble countertop, studio lighting",
  "model": "dreamina-4-6",
  "width": 2048,
  "height": 2048
}
```

Response:

```json
{
  "model": "dreamina-4-6",
  "cost_usd": 0.031,
  "currency": "USD",
  "billing": {
    "method": "wallet",
    "cost_usd": 0.031,
    "balance_usd": 24.28,
    "currency": "USD",
    "images_billed": 1,
    "images_returned": 1,
    "breakdown": {
      "currency": "USD",
      "rate_usd_per_image": 0.031,
      "quantity": 1,
      "amount_usd": 0.031,
      "pricing_type": "per_image_resolution"
    }
  },
  "images": [
    "https://p16-aiop-sign-sg.ibyteimg.com/tos-alisg-i-e2jboc02s9-sg/....png?..."
  ]
}
```

`images_billed` and `images_returned` are separate numbers because a group request is charged for what BytePlus actually delivers. One image is charged up front; extras are charged once the real count is known, so a group of 4 costs $0.124.

This call is synchronous — unlike the async job pattern used for [avatar and motion-transfer generation](/api/avatar-motion), Dreamina 4.6 returns the finished image URL(s) directly in the response.

### xAI (Grok Imagine)

| Model ID | Name | 1K | 2K | 4K | Max `num_images` | Notes |
|----------|------|---:|---:|---:|:----------------:|-------|
| `grok-imagine-image` | Grok Imagine | 0.02 | 0.02 | 0.02 | 4 | flat; fast and cheap |
| `grok-imagine-image-pro` | Grok Imagine Pro | 0.05 | 0.07 | 0.07 | 4 | **2K**, tiered |
| `grok-imagine-image-quality` | Grok Imagine Quality | 0.05 | 0.07 | 0.07 | 10 | same rate as Pro, higher batch cap |

#### xAI Grok Image — Capabilities

| Feature | `grok-imagine-image` | `grok-imagine-image-pro` |
|---------|:-------------------:|:------------------------:|
| Text-to-Image | Yes | Yes |
| Max Resolution | 1K | 2K |
| Max `num_images` per request | 4 | 4 |
| Aspect Ratios | 7 | 7 |

**Supported Aspect Ratios:** `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `9:16`, `16:9`

::: warning Reference images do not reach Grok from this endpoint
Grok Imagine Pro's single-image edit, multi-image combine and virtual try-on modes were
listed here previously. `image_url` and `image_urls` are not forwarded on
`/v1/ai/generate/image` for any model except `dreamina-4-6`, so those modes are not
reachable here — a request with them renders text-to-image and charges for it. Use
[`POST /v1/ai/edit/image`](/api/image-editing) for editing, and `dreamina-4-6` above for
multi-reference composition.
:::

### Black Forest Labs — FLUX

| Model ID | Name | 1K | 2K | 4K | Max `num_images` | Notes |
|----------|------|---:|---:|---:|:----------------:|-------|
| `flux-2-pro` | FLUX.2 Pro | 0.03 | 0.075 | 0.255 | 4 | balanced, versatile; tiered |
| `flux-1.1-pro` | FLUX 1.1 Pro | 0.04 | 0.04 | 0.04 | 4 | flat; high quality, creative |
| `flux-kontext-pro` | FLUX Kontext Pro | 0.04 | 0.04 | 0.04 | 4 | flat; context-aware, style transfer |
| `flux-2-flex` | FLUX.2 Flex | 0.05 | 0.20 | 0.80 | 4 | tiered, steepest curve on the page |

::: danger Six FLUX models are unavailable upstream
`flux-1.1-pro-ultra`, `flux-1.1-pro-raw`, `flux-kontext-max`, `flux-2-max`,
`flux-2-klein-4b` and `flux-2-klein-9b` are switched off at the provider. A request
naming one of them is charged, fails, and is refunded — so you lose the round trip, not
the money, but you get no image. They were listed as buyable here in earlier versions of
this page; they are not.

Substitutes that do render: `flux-2-pro` for Max-tier quality, `flux-kontext-pro` for
Kontext, and — since the Klein models were the batch/budget recommendation —
`minimax-image-01` ($0.005) or `gpt-image-1-mini` ($0.005 at 1K).
:::

### MiniMax

| Model ID | Name | Price (USD) | Max `num_images` | Notes |
|----------|------|-------------|:----------------:|-------|
| `minimax-image-01` | MiniMax Image 01 | 0.005 | 4 | flat; cheapest model on the endpoint |

### Kling

| Model ID | Name | Price (USD) | Max `num_images` | Notes |
|----------|------|-------------|:----------------:|-------|
| `kling-v2-1` | Kling V2.1 | 0.012 | 9 | flat; balanced quality |
| `kling-v3` | Kling V3 | 0.025 | 1 | flat; high quality |
| `kling-v3-omni` | Kling V3 Omni | 0.025 | 1 | flat; premium, all modes |

### FOTOhub IDA Q

Self-hosted, so there is nothing to pay a provider for: `ida-q-image` is **$0.00** per
image. It runs asynchronously — the request returns a `job_id` and a `poll_url` rather
than images. See [IDA Q](/api/ida-q).

## Code Examples

### Basic Image Generation

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "A serene mountain landscape at golden hour, with mist rolling through valleys",
        "model": "seedream-5-0-260128",
        "aspect_ratio": "16:9"
    }
)

data = response.json()
print(f"Image URL: {data['images'][0]}")
print(f"Charged: ${data['cost_usd']}")
print(f"Wallet balance: ${data['billing']['balance_usd']}")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "A serene mountain landscape at golden hour, with mist rolling through valleys",
    model: "seedream-5-0-260128",
    aspect_ratio: "16:9"
  })
});

const data = await response.json();
console.log("Image URL:", data.images[0]);
console.log("Charged: $", data.cost_usd);
console.log("Wallet balance: $", data.billing.balance_usd);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"prompt":       "A serene mountain landscape at golden hour, with mist rolling through valleys",
		"model":        "seedream-5-0-260128",
		"aspect_ratio": "16:9",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/image", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	json.Unmarshal(respBody, &data)

	images := data["images"].([]interface{})
	fmt.Println("Image URL:", images[0])
	fmt.Println("Charged (USD):", data["cost_usd"])
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape at golden hour, with mist rolling through valleys",
    "model": "seedream-5-0-260128",
    "aspect_ratio": "16:9"
  }'
```

:::

### SeedDream — reading the cost breakdown

SeedDream is flat-priced, so the 2048x2048 render below costs the same $0.0315 as a
1024x1024 one. The response carries the itemized quote, which is what to log.

::: code-group

```python [Python]
import requests

# SeedDream is flat-priced: this 2K render costs the same as a 1K one
response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Professional product photography of a luxury watch on marble surface",
        "model": "seedream-5-0-260128",
        "width": 2048,
        "height": 2048
    }
)

data = response.json()
print(f"Image URL: {data['images'][0]}")
print(f"Charged: ${data['cost_usd']}")                        # 0.0315 at any resolution
print(f"Provider cost: ${data['billing']['cost_breakdown']['provider_cost_usd']}")
print(f"Margin: {data['billing']['cost_breakdown']['margin']}x")  # 1.0 — you pay 1:1
for leg in data["billing"]["cost_breakdown"]["breakdown"]:
    print(f"  {leg['leg']}: {leg['quantity']} x ${leg['rate_usd']} = ${leg['amount_usd']}")
print(f"Output tokens (informational): {data['usage']['output_tokens']}")
```

```typescript [TypeScript]
// SeedDream is flat-priced: this 2K render costs the same as a 1K one
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Professional product photography of a luxury watch on marble surface",
    model: "seedream-5-0-260128",
    width: 2048,
    height: 2048
  })
});

const data = await response.json();
console.log("Image URL:", data.images[0]);
console.log("Charged: $", data.cost_usd);                    // 0.0315 at any resolution
console.log("Margin:", data.billing.cost_breakdown.margin);  // 1.0 — you pay 1:1
for (const leg of data.billing.cost_breakdown.breakdown) {
  console.log(`  ${leg.leg}: ${leg.quantity} x $${leg.rate_usd} = $${leg.amount_usd}`);
}
console.log("Output tokens (informational):", data.usage.output_tokens);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"prompt": "Professional product photography of a luxury watch on marble surface",
		"model":  "seedream-5-0-260128",
		"width":  2048,
		"height": 2048,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/image", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	json.Unmarshal(respBody, &data)

	usage := data["usage"].(map[string]interface{})
	billing := data["billing"].(map[string]interface{})
	breakdown := billing["cost_breakdown"].(map[string]interface{})
	images := data["images"].([]interface{})

	fmt.Println("Image URL:", images[0])
	fmt.Println("Charged (USD):", data["cost_usd"]) // 0.0315 at any resolution
	fmt.Println("Margin:", breakdown["margin"])     // 1.0 - you pay 1:1
	fmt.Println("Output tokens (informational):", usage["output_tokens"])
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional product photography of a luxury watch on marble surface",
    "model": "seedream-5-0-260128",
    "width": 2048,
    "height": 2048
  }'
```

:::

### High-Resolution 4K Generation

::: code-group

```python [Python]
import requests

# gpt-image-2 renders native 4K. Imagen caps at 2K and is billed at the tier it
# delivered, so asking Imagen for 4096 gets you a 2K image at the 2K price.
response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Ultra detailed architectural visualization of a modern glass house, surrounded by nature, photorealistic 8K quality",
        "model": "imagen-4-ultra",
        "width": 4096,
        "height": 2304,
        "aspect_ratio": "16:9"
    }
)

data = response.json()
print(f"4K Image: {data['images'][0]}")
print(f"Charged: ${data['cost_usd']}")  # 0.06 — Imagen 4 Ultra is flat-priced
```

```typescript [TypeScript]
// gpt-image-2 renders native 4K. Imagen caps at 2K and is billed at the tier it
// delivered, so asking Imagen for 4096 gets you a 2K image at the 2K price.
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Ultra detailed architectural visualization of a modern glass house, surrounded by nature, photorealistic 8K quality",
    model: "imagen-4-ultra",
    width: 4096,
    height: 2304,
    aspect_ratio: "16:9"
  })
});

const data = await response.json();
console.log("4K Image:", data.images[0]);
console.log("Charged: $", data.cost_usd); // 0.06 — Imagen 4 Ultra is flat-priced
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"prompt":       "Ultra detailed architectural visualization of a modern glass house, surrounded by nature, photorealistic 8K quality",
		"model":        "imagen-4-ultra",
		"width":        4096,
		"height":       2304,
		"aspect_ratio": "16:9",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/image", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	json.Unmarshal(respBody, &data)

	images := data["images"].([]interface{})
	fmt.Println("4K Image:", images[0])
	fmt.Println("Charged (USD):", data["cost_usd"]) // 0.06 - flat-priced
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Ultra detailed architectural visualization of a modern glass house, surrounded by nature, photorealistic 8K quality",
    "model": "imagen-4-ultra",
    "width": 4096,
    "height": 2304,
    "aspect_ratio": "16:9"
  }'
```

:::

### Generate Multiple Variations

::: code-group

```python [Python]
import requests

# Generate 4 variations in a single request.
# `image_size` is mandatory in practice on flux-2-pro: without it each image is
# charged at the top of the grid ($0.255 instead of $0.03).
response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Minimalist logo design for a tech startup, clean vector style",
        "model": "flux-2-pro",
        "num_images": 4,
        "aspect_ratio": "1:1",
        "image_size": "1K"
    }
)

data = response.json()
# Charged: 4 images x $0.03 (flux-2-pro at 1K) = $0.12
for i, url in enumerate(data["images"]):
    print(f"Variation {i+1}: {url}")
print(f"Total charged: ${data['cost_usd']}")
```

```typescript [TypeScript]
// Generate 4 variations in a single request.
// `image_size` is mandatory in practice on flux-2-pro: without it each image is
// charged at the top of the grid ($0.255 instead of $0.03).
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Minimalist logo design for a tech startup, clean vector style",
    model: "flux-2-pro",
    num_images: 4,
    aspect_ratio: "1:1",
    image_size: "1K"
  })
});

const data = await response.json();
// Charged: 4 images x $0.03 (flux-2-pro at 1K) = $0.12
data.images.forEach((url: string, i: number) => {
  console.log(`Variation ${i + 1}: ${url}`);
});
console.log("Total charged: $", data.cost_usd);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"prompt":       "Minimalist logo design for a tech startup, clean vector style",
		"model":        "flux-2-pro",
		"num_images":   4,
		"aspect_ratio": "1:1",
		// Without this each image is charged at the top of the grid ($0.255).
		"image_size":   "1K",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/image", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	json.Unmarshal(respBody, &data)

	// Charged: 4 images x $0.03 (flux-2-pro at 1K) = $0.12
	images := data["images"].([]interface{})
	for i, url := range images {
		fmt.Printf("Variation %d: %s\n", i+1, url)
	}
	fmt.Println("Total charged (USD):", data["cost_usd"])
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Minimalist logo design for a tech startup, clean vector style",
    "model": "flux-2-pro",
    "num_images": 4,
    "aspect_ratio": "1:1",
    "image_size": "1K"
  }'
```

:::

### Negative Prompt & Fixed Seed

Style goes in the `prompt` — the `style` parameter is not forwarded (see the note under
[Request Parameters](#request-parameters)). `negative_prompt` and `seed` are.

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        # The style belongs in the prompt itself — it is the only place that works
        # on every model.
        "prompt": "Portrait of a woman in Renaissance style, classic oil painting "
                  "textures, dramatic lighting, rich colors",
        "model": "flux-kontext-pro",
        "negative_prompt": "blurry, low quality, distorted, deformed, watermark, text overlay, cartoon",
        "aspect_ratio": "3:4",
        "seed": 42  # Same prompt + seed + model = same output
    }
)

data = response.json()
print(f"Image: {data['images'][0]}")
print(f"Charged: ${data['cost_usd']}")  # 0.04 — flux-kontext-pro is flat-priced
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    // The style belongs in the prompt itself — it is the only place that works
    // on every model.
    prompt: "Portrait of a woman in Renaissance style, classic oil painting textures, " +
            "dramatic lighting, rich colors",
    model: "flux-kontext-pro",
    negative_prompt: "blurry, low quality, distorted, deformed, watermark, text overlay, cartoon",
    aspect_ratio: "3:4",
    seed: 42 // Same prompt + seed + model = same output
  })
});

const data = await response.json();
console.log("Image:", data.images[0]);
console.log("Charged: $", data.cost_usd); // 0.04 — flat-priced
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		// The style belongs in the prompt itself.
		"prompt":          "Portrait of a woman in Renaissance style, classic oil painting textures, dramatic lighting, rich colors",
		"model":           "flux-kontext-pro",
		"negative_prompt": "blurry, low quality, distorted, deformed, watermark, text overlay, cartoon",
		"aspect_ratio":    "3:4",
		"seed":            42,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/image", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	json.Unmarshal(respBody, &data)

	images := data["images"].([]interface{})
	fmt.Println("Image:", images[0])
	fmt.Println("Charged (USD):", data["cost_usd"]) // 0.04 - flat-priced
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Portrait of a woman in Renaissance style, classic oil painting textures, dramatic lighting, rich colors",
    "model": "flux-kontext-pro",
    "negative_prompt": "blurry, low quality, distorted, deformed, watermark, text overlay, cartoon",
    "aspect_ratio": "3:4",
    "seed": 42
  }'
```

:::

## xAI Grok Imagine — Advanced Use Cases

Grok Imagine models support generation, editing, multi-image combine, and virtual try-on through a unified API.

### Product Launch (Text-to-Image, 2K)

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Premium product photography of a luxury perfume bottle on marble surface, "
                  "dramatic studio lighting, soft shadows, bokeh background, commercial quality",
        "model": "grok-imagine-image-pro",
        "aspect_ratio": "2:3",
        "image_size": "2K",
        "num_images": 1
    }
)

data = response.json()
print(f"2K product shot: {data['images'][0]}")
# $0.07 at 2K, portrait 2:3 aspect
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Premium product photography of a luxury perfume bottle on marble surface, " +
            "dramatic studio lighting, soft shadows, bokeh background, commercial quality",
    model: "grok-imagine-image-pro",
    aspect_ratio: "2:3",
    image_size: "2K",
    num_images: 1
  })
});

const data = await response.json();
console.log("2K product shot:", data.images[0]);
console.log("Charged: $", data.cost_usd); // 0.07 at the 2K tier
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"prompt":       "Premium product photography of a luxury perfume bottle on marble surface, dramatic studio lighting, soft shadows, bokeh background, commercial quality",
		"model":        "grok-imagine-image-pro",
		"aspect_ratio": "2:3",
		"image_size":   "2K",
		"num_images":   1,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/image", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	json.Unmarshal(respBody, &data)

	images := data["images"].([]interface{})
	fmt.Println("2K product shot:", images[0])
	// $0.07 at 2K, portrait 2:3 aspect
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Premium product photography of a luxury perfume bottle on marble surface, dramatic studio lighting, soft shadows, bokeh background, commercial quality",
    "model": "grok-imagine-image-pro",
    "aspect_ratio": "2:3",
    "image_size": "2K",
    "num_images": 1
  }'
```

:::

### Social Media Post (Text-to-Image, 1K)

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Trendy flat-lay coffee shop photo, latte art, notebook and laptop, "
                  "warm tones, Instagram aesthetic, overhead shot",
        "model": "grok-imagine-image",
        "aspect_ratio": "1:1",
        "num_images": 4
    }
)

data = response.json()
# 4 variations at $0.02 each = $0.08 total
for i, url in enumerate(data["images"]):
    print(f"Variation {i+1}: {url}")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Trendy flat-lay coffee shop photo, latte art, notebook and laptop, " +
            "warm tones, Instagram aesthetic, overhead shot",
    model: "grok-imagine-image",
    aspect_ratio: "1:1",
    num_images: 4
  })
});

const data = await response.json();
// 4 variations at $0.02 each = $0.08 total
data.images.forEach((url: string, i: number) => {
  console.log(`Variation ${i + 1}: ${url}`);
});
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"prompt":       "Trendy flat-lay coffee shop photo, latte art, notebook and laptop, warm tones, Instagram aesthetic, overhead shot",
		"model":        "grok-imagine-image",
		"aspect_ratio": "1:1",
		"num_images":   4,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/image", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	json.Unmarshal(respBody, &data)

	// 4 variations at $0.02 each = $0.08 total
	images := data["images"].([]interface{})
	for i, url := range images {
		fmt.Printf("Variation %d: %s\n", i+1, url)
	}
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Trendy flat-lay coffee shop photo, latte art, notebook and laptop, warm tones, Instagram aesthetic",
    "model": "grok-imagine-image",
    "aspect_ratio": "1:1",
    "num_images": 4
  }'
```

:::

### Reference-image modes are not on this endpoint

Earlier versions of this page showed single-image edit, multi-image combine (up to 3
references) and virtual try-on here, all via `image_url` / `image_urls` on
`grok-imagine-image-pro`. Neither field is forwarded to Grok: this endpoint is
text-to-image only, so those requests render from the prompt alone and are charged for it.

Where those workflows actually live:

| Want | Use |
|------|-----|
| Edit one photo — background, lighting, context | [`POST /v1/ai/edit/image`](/api/image-editing) at $0.04, or a [Stability tool](/api/image-editing#image-studio-stability-ai-tools) |
| Compose several reference images into one | [`dreamina-4-6`](#byteplus-dreamina-4-6-billed-per-returned-image) — up to 14 references, $0.031 per returned image |
| Virtual try-on | [`POST /v1/ai/tryon`](/api/tryon) — a purpose-built endpoint, not a prompt trick |


---

## Editing an existing image

Editing lives on its own endpoint, `POST /v1/ai/edit/image` — inpaint, outpaint,
background swap and object removal, at a flat **$0.04** per edit whatever the mode or
size. Upscaling is not one of its modes; it is a [Stability
tool](/api/image-editing#image-studio-stability-ai-tools) (`fast-upscale` $0.03,
`conservative-upscale` $0.40, `creative-upscale` $0.60).

Full parameters, response shape and error contract: **[Image Editing](/api/image-editing)**.

## Model Comparison Table

A comprehensive overview of all available image models with their capabilities, performance characteristics, and pricing.

| Model ID | Provider | Max Resolution | Speed | Quality | 1K | 4K | Key Features |
|----------|----------|---------------|:-----:|:-------:|---:|---:|--------------|
| `imagen-3-fast` | Google Vertex AI | 1024x1024 | 5/5 | 3/5 | 0.02 | 0.02 | Ultra-fast drafts, `num_images` max 1 |
| `imagen-3-standard` | Google Vertex AI | 1024x1024 | 4/5 | 4/5 | 0.04 | 0.04 | Balanced speed/quality |
| `imagen-4-fast` | Google Vertex AI | 2048x2048 | 5/5 | 4/5 | 0.02 | 0.02 | Imagen 4 quality at the Fast price |
| `imagen-4-standard` | Google Vertex AI | 2048x2048 | 3/5 | 4/5 | 0.04 | 0.04 | High quality, good for production |
| `imagen-4-ultra` | Google Vertex AI | 2048x2048 | 2/5 | 5/5 | 0.06 | 0.06 | Highest fidelity from Google |
| `gemini-3.1-flash-lite-image` | Google Gemini | 1024x1024 | 5/5 | 3/5 | 0.0336 | 0.0336 | Nano Banana 2 Lite, cheapest Gemini |
| `gemini-2.5-flash-image` | Google Gemini | 1024x1024 | 4/5 | 4/5 | 0.039 | 0.039 | Nano Banana, up to 10 reference images |
| `gemini-3.1-flash-image` | Google Gemini | 4096x4096 | 4/5 | 4/5 | 0.067 | 0.151 | Nano Banana 2, GA |
| `gemini-3-pro-image` | Google Gemini | 4096x4096 | 2/5 | 5/5 | 0.134 | 0.24 | Nano Banana Pro, precise text rendering |
| `gpt-image-1-mini` | OpenAI | 4096x4096 | 4/5 | 4/5 | 0.005 | 0.036 | Cheapest OpenAI option |
| `gpt-image-1` | OpenAI | 4096x4096 | 3/5 | 5/5 | 0.011 | 0.167 | High OpenAI fidelity, photorealism |
| `gpt-image-1.5` | OpenAI | 4096x4096 | 3/5 | 5/5 | 0.009 | 0.133 | Better than 1, and cheaper |
| `gpt-image-2` | OpenAI | 4096x4096 | 2/5 | 5/5 | 0.006 | 0.211 | Highest OpenAI fidelity, best text rendering |
| `mai-image-2.5-flash` | Microsoft | 1024x1024 | 4/5 | 3/5 | 0.022 | 0.022 | Budget/fast Azure AI model |
| `mai-image-2.5` | Microsoft | 1024x1024 | 3/5 | 4/5 | 0.037 | 0.037 | Azure AI flagship, prompt rewriting |
| `mai-image-2.5-pro` | Microsoft | 1024x1024 | 2/5 | 5/5 | 0.108544 | 0.108544 | Best MAI photorealism, object/character consistency |
| `seedream-5-0-260128` | BytePlus | 4096x4096 | 4/5 | 5/5 | 0.0315 | 0.0315 | **Recommended** — best value, flat price at 4K |
| `seedream-4-5-251128` | BytePlus | 4096x4096 | 3/5 | 4/5 | 0.036 | 0.036 | Excellent detail, flat price |
| `seedream-4-0-250828` | BytePlus | 4096x4096 | 4/5 | 4/5 | 0.03 | 0.03 | Budget-friendly, flat price |
| `dola-seedream-5-0-pro-260628` | BytePlus | 2048x2048 | 3/5 | 5/5 | 0.048 | 0.093 | Pro quality; the one megapixel-priced model |
| `seededit-3-0-i2i-250628` | BytePlus | 4096x4096 | 3/5 | 4/5 | 0.03 | 0.03 | Image-to-image, `num_images` max 1 |
| `dreamina-4-6` | BytePlus | 4096x4096 | 3/5 | 5/5 | 0.031 | 0.031 | Up to 14 reference images; billed per returned image |
| `grok-imagine-image` | xAI | 1024x1024 | 4/5 | 3/5 | 0.02 | 0.02 | Fast budget option |
| `grok-imagine-image-pro` | xAI | 2048x2048 | 3/5 | 4/5 | 0.05 | 0.07 | 2K quality tier |
| `grok-imagine-image-quality` | xAI | 2048x2048 | 3/5 | 4/5 | 0.05 | 0.07 | Same rate as Pro, `num_images` up to 10 |
| `flux-2-pro` | Black Forest Labs | 4096x4096 | 3/5 | 4/5 | 0.03 | 0.255 | Balanced, versatile |
| `flux-1.1-pro` | Black Forest Labs | 1440x1440 | 3/5 | 4/5 | 0.04 | 0.04 | Creative, artistic styles |
| `flux-kontext-pro` | Black Forest Labs | 1440x1440 | 3/5 | 4/5 | 0.04 | 0.04 | Context-aware editing, style transfer |
| `flux-2-flex` | Black Forest Labs | 4096x4096 | 2/5 | 5/5 | 0.05 | 0.80 | Highest available FLUX detail; steep 4K price |
| `minimax-image-01` | MiniMax | 1024x1024 | 4/5 | 3/5 | 0.005 | 0.005 | Cheapest model on the endpoint |
| `kling-v3-omni` | Kling | 2048x2048 | 2/5 | 5/5 | 0.025 | 0.025 | Premium, all modes, `num_images` max 1 |
| `kling-v3` | Kling | 2048x2048 | 2/5 | 4/5 | 0.025 | 0.025 | High quality, `num_images` max 1 |
| `kling-v2-1` | Kling | 1536x1536 | 3/5 | 4/5 | 0.012 | 0.012 | Balanced, `num_images` up to 9 |
| `ida-q-image` | FOTOhub | 2048x2048 | 3/5 | 4/5 | 0.00 | 0.00 | Self-hosted, free; [async](/api/ida-q) |

The 1K and 4K columns are equal on a flat-priced model. Where they differ the model is
tiered and 2K sits between them — the per-provider tables above carry the middle column.
`imagen-3-capability`, `dall-e-3*`, and the six disabled FLUX ids are deliberately absent:
see [OpenAI](#openai) and [FLUX](#black-forest-labs-flux).

::: tip Choosing a Model
- **Best value**: `seedream-5-0-260128` — $0.0315 at every resolution, so 4K costs what 1K does
- **Cheapest that renders**: `minimax-image-01` and `gpt-image-1-mini` at $0.005
- **Fastest**: `imagen-3-fast` or `imagen-4-fast` at $0.02
- **Highest quality**: `gemini-3-pro-image` (Nano Banana Pro), `gpt-image-2`, or `imagen-4-ultra` for print/commercial work
- **Multi-image composition**: `dreamina-4-6` — up to 14 references, the only model on this endpoint that takes them
- **Image editing**: [`POST /v1/ai/edit/image`](/api/image-editing) at $0.04, or `seededit-3-0-i2i-250628`
- **Watch the 4K price**: `flux-2-flex` ($0.80), `gpt-image-2` ($0.211) and `flux-2-pro` ($0.255) are 16–35x their own 1K rate
:::

---

## Advanced Use Cases

### Native 4K for print

`gpt-image-2`, `gpt-image-1`, `gemini-3-pro-image`, `flux-2-pro` and every SeedDream model
render true 4K. Imagen does not — it caps at 2K and is billed at the tier it delivered, so
a 4096 request there gets you a 2K image at the 2K price.

4K is the one place the price differs sharply between models: $0.0315 on
`seedream-5-0-260128`, $0.211 on `gpt-image-2`, $0.80 on `flux-2-flex`. Pick deliberately.

::: code-group

```python [Python]
import requests

# gpt-image-2 at 4K: $0.211. The same call at 1K would be $0.006.
response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Luxury real estate interior, open-plan living room with floor-to-ceiling windows overlooking city skyline at sunset, marble floors, designer furniture, volumetric lighting, architectural photography",
        "model": "gpt-image-2",
        "image_size": "4K",
        "aspect_ratio": "16:9",
        "negative_prompt": "low quality, blurry, distorted, watermark, oversaturated"
    }
)

data = response.json()
print(f"4K Image URL: {data['images'][0]}")
print(f"Charged: ${data['cost_usd']}")            # 0.211 at the 4K tier
print(f"Balance left: ${data['billing']['balance_usd']}")
```

```typescript [TypeScript]
// gpt-image-2 at 4K: $0.211. The same call at 1K would be $0.006.
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Luxury real estate interior, open-plan living room with floor-to-ceiling windows overlooking city skyline at sunset, marble floors, designer furniture, volumetric lighting, architectural photography",
    model: "gpt-image-2",
    image_size: "4K",
    aspect_ratio: "16:9",
    negative_prompt: "low quality, blurry, distorted, watermark, oversaturated"
  })
});

const data = await response.json();
console.log("4K Image URL:", data.images[0]);
console.log("Charged: $", data.cost_usd);                  // 0.211 at the 4K tier
console.log("Balance left: $", data.billing.balance_usd);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	// gpt-image-2 at 4K: $0.211. The same call at 1K would be $0.006.
	payload := map[string]interface{}{
		"prompt":          "Luxury real estate interior, open-plan living room with floor-to-ceiling windows overlooking city skyline at sunset, marble floors, designer furniture, volumetric lighting, architectural photography",
		"model":           "gpt-image-2",
		"image_size":      "4K",
		"aspect_ratio":    "16:9",
		"negative_prompt": "low quality, blurry, distorted, watermark, oversaturated",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/image", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	json.Unmarshal(respBody, &data)

	images := data["images"].([]interface{})
	fmt.Println("4K Image URL:", images[0])
	fmt.Println("Charged (USD):", data["cost_usd"]) // 0.211 at the 4K tier
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Luxury real estate interior, open-plan living room with floor-to-ceiling windows overlooking city skyline at sunset, marble floors, designer furniture, volumetric lighting, architectural photography",
    "model": "gpt-image-2",
    "image_size": "4K",
    "aspect_ratio": "16:9",
    "negative_prompt": "low quality, blurry, distorted, watermark, oversaturated"
  }'
```

:::

### FLUX Kontext Pro — style, without a reference image

`flux-kontext-pro` is trained for context-aware transformation, but on **this** endpoint it
only ever sees your prompt: `image_url` is not forwarded, so a request that carries one is
rendered from the text alone and charged $0.04 for it. To transform an image you already
have, call [`POST /v1/ai/edit/image`](/api/image-editing) — same $0.04, and it actually
reads the source.

What Kontext Pro is genuinely good for here is a described style at a fixed seed, so a whole
set comes back coherent. It is flat-priced at **$0.04** — 1K and 1440px cost the same.

::: code-group

```python [Python]
import requests

# $0.04 flat. Same seed => the same look across a set.
response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Studio Ghibli anime art style, soft watercolor textures, warm pastel palette, hand-drawn feel, a quiet countryside train station at golden hour",
        "model": "flux-kontext-pro",
        "aspect_ratio": "16:9",
        "seed": 7777
    }
)

data = response.json()
print(f"Styled image: {data['images'][0]}")
print(f"Charged: ${data['cost_usd']}")   # 0.04
```

```typescript [TypeScript]
// $0.04 flat. Same seed => the same look across a set.
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Studio Ghibli anime art style, soft watercolor textures, warm pastel palette, hand-drawn feel, a quiet countryside train station at golden hour",
    model: "flux-kontext-pro",
    aspect_ratio: "16:9",
    seed: 7777
  })
});

const data = await response.json();
console.log("Styled image:", data.images[0]);
console.log("Charged: $", data.cost_usd);   // 0.04
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	// $0.04 flat. Same seed => the same look across a set.
	payload := map[string]interface{}{
		"prompt":       "Studio Ghibli anime art style, soft watercolor textures, warm pastel palette, hand-drawn feel, a quiet countryside train station at golden hour",
		"model":        "flux-kontext-pro",
		"aspect_ratio": "16:9",
		"seed":         7777,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/image", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	json.Unmarshal(respBody, &data)

	images := data["images"].([]interface{})
	fmt.Println("Styled image:", images[0])
	fmt.Println("Charged (USD):", data["cost_usd"]) // 0.04
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Studio Ghibli anime art style, soft watercolor textures, warm pastel palette, hand-drawn feel, a quiet countryside train station at golden hour",
    "model": "flux-kontext-pro",
    "aspect_ratio": "16:9",
    "seed": 7777
  }'
```

:::

### Multiple images and what you pay for

Generate several variations in one call with `num_images` (1–8). Ideal for A/B testing, design exploration, and content pipelines.

**You pay per delivered image, not per requested image.** The charge is taken up front for the count you asked for, and the difference is refunded automatically when the provider returns fewer — which it often does, because every provider caps the count at its own maximum regardless of what you send (Seedream PRO renders exactly 1 per request; Vertex tops out at 4). Ask for 8 from a model that returns 1 and you are charged for 1.

The reverse never costs you anything: BytePlus sequential mode can return *more* images than requested, and the extras are not billed.

The response reports the settled figure. `cost_usd` is always what you actually paid, and
`refunded_usd` appears whenever a refund was committed — so `cost_usd` and `len(images)`
always agree. Here 4 images were requested from `seedream-5-0-260128` at $0.0315 each
($0.126 held), 2 came back, and the other $0.063 went straight back to the wallet:

```json
{
  "model": "seedream-5-0-260128",
  "cost_usd": 0.063,
  "refunded_usd": 0.063,
  "currency": "USD",
  "billing": {
    "cost_usd": 0.063,
    "balance_usd": 24.312,
    "currency": "USD",
    "method": "wallet",
    "model": "prepaid"
  },
  "images": ["https://...", "https://..."]
}
```

::: code-group

```python [Python]
import requests
import concurrent.futures

# Method 1: Single request with num_images (up to 8 per request)
response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Professional headshot of a business person, neutral background, studio lighting, LinkedIn profile photo quality",
        "model": "seedream-5-0-260128",
        "num_images": 4,
        "aspect_ratio": "1:1",
        "width": 1024,
        "height": 1024
    }
)

data = response.json()
print(f"Generated {len(data['images'])} variations")
print(f"Charged: ${data['cost_usd']}")           # 4 x $0.0315 = $0.126
print(f"Refunded: ${data.get('refunded_usd', 0)}")  # set if fewer came back

for i, url in enumerate(data["images"]):
    print(f"  Variation {i+1}: {url}")

# Method 2: Parallel requests for larger batches (e.g., 16 images)
def generate_batch(seed_offset):
    return requests.post(
        "https://apis.fotohub.app/v1/ai/generate/image",
        headers={
            "Authorization": "Bearer fh_live_your_api_key",
            "Content-Type": "application/json"
        },
        json={
            "prompt": "Social media banner, abstract gradient, modern tech aesthetic",
            "model": "minimax-image-01",
            "num_images": 4,
            "aspect_ratio": "16:9",
            "seed": 1000 + seed_offset
        }
    ).json()

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(generate_batch, range(0, 16, 4)))
    all_images = [url for r in results for url in r["images"]]
    print(f"Total batch: {len(all_images)} images generated")
```

```typescript [TypeScript]
// Method 1: Single request with num_images (up to 8 per request)
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Professional headshot of a business person, neutral background, studio lighting, LinkedIn profile photo quality",
    model: "seedream-5-0-260128",
    num_images: 4,
    aspect_ratio: "1:1",
    width: 1024,
    height: 1024
  })
});

const data = await response.json();
console.log(`Generated ${data.images.length} variations`);
console.log(`Charged: $${data.cost_usd}`);              // 4 x $0.0315 = $0.126
console.log(`Refunded: $${data.refunded_usd ?? 0}`);    // set if fewer came back

data.images.forEach((url: string, i: number) => {
  console.log(`  Variation ${i + 1}: ${url}`);
});

// Method 2: Parallel requests for larger batches (e.g., 16 images)
const batchPromises = Array.from({ length: 4 }, (_, i) =>
  fetch("https://apis.fotohub.app/v1/ai/generate/image", {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: "Social media banner, abstract gradient, modern tech aesthetic",
      model: "minimax-image-01",
      num_images: 4,
      aspect_ratio: "16:9",
      seed: 1000 + i * 4
    })
  }).then(r => r.json())
);

const results = await Promise.all(batchPromises);
const allImages = results.flatMap(r => r.images);
console.log(`Total batch: ${allImages.length} images generated`);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
)

func generateImages(payload map[string]interface{}) map[string]interface{} {
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/image", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	json.Unmarshal(respBody, &data)
	return data
}

func main() {
	// Method 1: Single request with num_images (up to 4)
	data := generateImages(map[string]interface{}{
		"prompt":       "Professional headshot of a business person, neutral background, studio lighting",
		"model":        "seedream-5-0-260128",
		"num_images":   4,
		"aspect_ratio": "1:1",
		"width":        1024,
		"height":       1024,
	})

	images := data["images"].([]interface{})
	fmt.Printf("Generated %d variations\n", len(images))
	fmt.Printf("Charged (USD): %v\n", data["cost_usd"]) // 4 x $0.0315 = $0.126

	// Method 2: Parallel requests for larger batches
	var wg sync.WaitGroup
	var mu sync.Mutex
	var allImages []interface{}

	for i := 0; i < 4; i++ {
		wg.Add(1)
		go func(offset int) {
			defer wg.Done()
			result := generateImages(map[string]interface{}{
				"prompt":       "Social media banner, abstract gradient, modern tech aesthetic",
				"model":        "minimax-image-01",
				"num_images":   4,
				"aspect_ratio": "16:9",
				"seed":         1000 + offset,
			})
			if result != nil {
				mu.Lock()
				allImages = append(allImages, result["images"].([]interface{})...)
				mu.Unlock()
			}
		}(i * 4)
	}
	wg.Wait()
	fmt.Printf("Total batch: %d images generated\n", len(allImages))
}
```

```bash [cURL]
# Single request with 4 variations
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional headshot of a business person, neutral background, studio lighting, LinkedIn profile photo quality",
    "model": "seedream-5-0-260128",
    "num_images": 4,
    "aspect_ratio": "1:1",
    "width": 1024,
    "height": 1024
  }'

# Parallel batch using xargs (16 images via 4 parallel requests)
seq 0 4 12 | xargs -P4 -I{} curl -s -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{
    \"prompt\": \"Social media banner, abstract gradient, modern tech aesthetic\",
    \"model\": \"minimax-image-01\",
    \"num_images\": 4,
    \"aspect_ratio\": \"16:9\",
    \"seed\": $((1000 + {}))
  }"
```

:::

::: warning Batch limits
- `num_images` accepts **1-8**; anything outside that is a 400 before you are charged
- Each model has its own lower cap, and it wins. `minimax-image-01` and `seedream-*` stop at
  4, `imagen-3-fast` and every Kling model except `kling-v2-1` at 1. The per-provider tables
  above carry the real maximum for each id
- You are charged **per delivered image**, and the difference is refunded when a cap trims
  your request
- For larger batches, run parallel requests. The rate limit is **per API key**, 60 req/min by
  default, up to 600 if your key is configured for it
- Use `seed` for reproducible results across batch runs
:::

### Style — put it in the prompt

There is no working `style` parameter on this endpoint. Earlier versions of this page listed
ten presets; the route does not forward the field, so it is dropped silently and you get the
prompt-only render — at full price. Style belongs in the prompt text, which every model reads.

The pattern below gets you exactly what the presets promised: one prompt, one fixed `seed`,
a style clause appended per variant, so only the style changes between renders.

::: code-group

```python [Python]
import requests

# Style clauses that behave like the old presets -- append one to the prompt.
STYLES = {
    "photorealistic": "photorealistic, studio photography, natural lighting, sharp focus",
    "cinematic":      "cinematic film still, dramatic lighting, anamorphic, color graded",
    "anime":          "Japanese anime illustration, cel shading, clean linework",
    "digital-art":    "digital illustration, clean vector lines, flat colors",
    "oil-painting":   "oil painting on canvas, visible brushwork, impasto texture",
    "watercolour":    "watercolour wash, soft bleeding edges, paper grain",
    "3d-render":      "3D render, octane, global illumination, subsurface scattering",
    "pixel-art":      "16-bit pixel art, limited palette, crisp pixels",
    "comic-book":     "comic book art, bold ink outlines, halftone shading",
    "minimalist":     "minimalist composition, generous negative space, two-tone palette",
}

SUBJECT = "A lone samurai standing on a hilltop, cherry blossoms falling, dramatic sky"

results = {}
for name in ["photorealistic", "cinematic", "anime", "oil-painting"]:
    response = requests.post(
        "https://apis.fotohub.app/v1/ai/generate/image",
        headers={
            "Authorization": "Bearer fh_live_your_api_key",
            "Content-Type": "application/json"
        },
        json={
            "prompt": f"{SUBJECT}, {STYLES[name]}",
            "model": "seedream-5-0-260128",
            "aspect_ratio": "16:9",
            "seed": 42  # same seed => only the style changes
        }
    )
    data = response.json()
    results[name] = data["images"][0]
    print(f"Style '{name}': {results[name]}  (${data['cost_usd']})")

print(f"4 styles x $0.0315 = ${4 * 0.0315:.4f}")
```

```typescript [TypeScript]
// Style clauses that behave like the old presets -- append one to the prompt.
const STYLES: Record<string, string> = {
  "photorealistic": "photorealistic, studio photography, natural lighting, sharp focus",
  "cinematic":      "cinematic film still, dramatic lighting, anamorphic, color graded",
  "anime":          "Japanese anime illustration, cel shading, clean linework",
  "digital-art":    "digital illustration, clean vector lines, flat colors",
  "oil-painting":   "oil painting on canvas, visible brushwork, impasto texture",
  "watercolour":    "watercolour wash, soft bleeding edges, paper grain",
  "3d-render":      "3D render, octane, global illumination, subsurface scattering",
  "pixel-art":      "16-bit pixel art, limited palette, crisp pixels",
  "comic-book":     "comic book art, bold ink outlines, halftone shading",
  "minimalist":     "minimalist composition, generous negative space, two-tone palette",
};

const SUBJECT = "A lone samurai standing on a hilltop, cherry blossoms falling, dramatic sky";
const results: Record<string, string> = {};

for (const name of ["photorealistic", "cinematic", "anime", "oil-painting"]) {
  const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: `${SUBJECT}, ${STYLES[name]}`,
      model: "seedream-5-0-260128",
      aspect_ratio: "16:9",
      seed: 42 // same seed => only the style changes
    })
  });

  const data = await response.json();
  results[name] = data.images[0];
  console.log(`Style '${name}': ${results[name]}  ($${data.cost_usd})`);
}
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	// Style clauses that behave like the old presets -- append one to the prompt.
	styles := map[string]string{
		"photorealistic": "photorealistic, studio photography, natural lighting, sharp focus",
		"cinematic":      "cinematic film still, dramatic lighting, anamorphic, color graded",
		"anime":          "Japanese anime illustration, cel shading, clean linework",
		"oil-painting":   "oil painting on canvas, visible brushwork, impasto texture",
	}
	subject := "A lone samurai standing on a hilltop, cherry blossoms falling, dramatic sky"

	for name, clause := range styles {
		payload := map[string]interface{}{
			"prompt":       subject + ", " + clause,
			"model":        "seedream-5-0-260128",
			"aspect_ratio": "16:9",
			"seed":         42, // same seed => only the style changes
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/image", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
		req.Header.Set("Content-Type", "application/json")

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			continue
		}
		defer resp.Body.Close()

		respBody, _ := io.ReadAll(resp.Body)
		var data map[string]interface{}
		json.Unmarshal(respBody, &data)

		images := data["images"].([]interface{})
		fmt.Printf("Style '%s': %s  ($%v)\n", name, images[0], data["cost_usd"])
	}
}
```

```bash [cURL]
# One style, written into the prompt
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A lone samurai standing on a hilltop, cherry blossoms falling, dramatic sky, cinematic film still, dramatic lighting, anamorphic, color graded",
    "model": "seedream-5-0-260128",
    "aspect_ratio": "16:9",
    "seed": 42
  }'

# Compare styles at a fixed seed
for style in \
  "photorealistic, studio photography, natural lighting, sharp focus" \
  "cinematic film still, dramatic lighting, anamorphic, color graded" \
  "Japanese anime illustration, cel shading, clean linework" \
  "oil painting on canvas, visible brushwork, impasto texture"
do
  echo "=== $style ==="
  curl -s -X POST https://apis.fotohub.app/v1/ai/generate/image \
    -H "Authorization: Bearer fh_live_your_api_key" \
    -H "Content-Type: application/json" \
    -d "{
      \"prompt\": \"A lone samurai standing on a hilltop, cherry blossoms falling, dramatic sky, $style\",
      \"model\": \"seedream-5-0-260128\",
      \"aspect_ratio\": \"16:9\",
      \"seed\": 42
    }" | jq '{image: .images[0], cost_usd}'
done
```

:::

::: tip Getting style right
- Put the style **after** the subject. Models weight the opening of a prompt most heavily, so
  lead with what the image is of and finish with how it should look.
- Pair the style clause with `negative_prompt` to push away from its opposite — an anime style
  clause plus `negative_prompt: "photorealistic, 3d render"` is much cleaner than either alone.
- Fix the `seed` when comparing. Same seed + same subject means only your style clause changed.
- Style consistency varies by model. SeedDream and FLUX hold a described style most reliably;
  Imagen tends to drift back toward photographic.
:::

---

## Performance Tips

Optimize your image generation workflow for speed, cost, and quality.

### Choose the Right Model for Your Use Case

| Use Case | Recommended Model | Why |
|----------|-------------------|-----|
| Quick prototypes & drafts | `imagen-3-fast` or `imagen-4-fast` | Sub-2s generation, $0.02 flat |
| Cheapest possible iteration | `minimax-image-01` or `gpt-image-1-mini` at 1K | $0.005 per image |
| Production web assets | `seedream-5-0-260128` | Best quality per dollar, $0.0315 at any resolution |
| Print & large-format | `imagen-4-ultra` ($0.06, 2K max) or `gemini-3-pro-image` ($0.24 at 4K) | Highest detail; check the 4K column before committing |
| Text inside the image | `gemini-3-pro-image` or `gpt-image-2` | The two that render legible type reliably |
| Composing several reference photos | `dreamina-4-6` | Up to 14 references, $0.031 per returned image — the only model here that reads them |
| Editing an existing photo | [`POST /v1/ai/edit/image`](/api/image-editing) | $0.04, and it actually receives your source image |
| Batch social content | `minimax-image-01` or `seedream-4-0-250828` | $0.005 / $0.03, both fast enough to run 4 at a time |
| A/B testing creatives | `seedream-5-0-260128` with `num_images: 4` | 4 variations per request, $0.126 the set |

### Resolution Strategy

::: warning Resolution changes the price on 12 models, and not at all on the rest
There is no single rule. Whether 4K costs more than 1K is a property of the model:

- **Flat** — every Imagen, every SeedDream (`seedream-*`, `seededit-*`), `dreamina-4-6`,
  `mai-image-2.5*`, `minimax-image-01`, every Kling, `flux-1.1-pro`, `flux-kontext-pro`,
  `gemini-2.5-flash-image`, `gemini-3.1-flash-lite-image`, `nano-banana-fast`. Render at the
  highest resolution the model supports — it is free to do so.
- **Tiered** — the whole GPT Image family, `gemini-3.1-flash-image`, `gemini-3-pro-image`,
  `flux-2-pro`, `flux-2-flex`, `grok-imagine-image-pro`, `grok-imagine-image-quality`. Here
  4K costs 1.4x to 35x the 1K price, so the tier is a real budget decision.
:::

The single most expensive mistake on this endpoint is **omitting the tier on a tiered
model**. With no `image_size` and no `width`/`height`, there is nothing to derive a tier
from, so the top of the grid is charged rather than selling below what the provider bills
us — a `gpt-image-2` call with no size is $0.211 instead of $0.006. Always send
`image_size`, or `width`/`height` (≥3072 → 4K, ≥1536 → 2K, else 1K).

**Cost-effective workflow on a tiered model** (`gpt-image-2`):
1. **Draft at `image_size: "1K"`** — validate composition and style, $0.006 a render
2. **Refine at `"2K"`** — check detail before committing, $0.053
3. **Final at `"4K"`** — approved compositions only, $0.211

Or skip the ladder entirely: `seedream-5-0-260128` renders 4K for $0.0315, which is less
than a 2K `gpt-image-2` draft.

### Speed Optimization

1. **Use `aspect_ratio` instead of `width`/`height`** — the API picks the optimal dimensions for each model, avoiding unnecessary upsampling. Send `image_size` alongside it to pin the price tier.
2. **Parallel requests** — send concurrently rather than sequentially. The limit is per API key: 60 req/min by default, up to 600 on a key configured for it.
3. **Prefer fast models for iteration** — `imagen-3-fast`, `imagen-4-fast` or `minimax-image-01` during prompt development; switch to the premium model for the final render.
4. **Set `seed` for reproducibility** — a fixed seed while iterating shows you the effect of the prompt change alone.
5. **Watch the 100-second ceiling** — requests through `apis.fotohub.app` are cut off by the CDN at 100 s. `dola-seedream-5-0-pro-260628` at 4K can exceed that. If you hit repeated `504`s on a slow model, drop the resolution or switch models — nothing is charged on a timeout.

### Cost Optimization

| Strategy | Saving |
|----------|--------|
| `seedream-5-0-260128` at 4K instead of `gpt-image-2` at 4K | $0.0315 vs $0.211 — **85% cheaper** |
| `seedream-5-0-260128` at 4K instead of `flux-2-flex` at 4K | $0.0315 vs $0.80 — **96% cheaper** |
| Always send `image_size` on a tiered model | Up to **97%** — an untiered `gpt-image-2` call is charged $0.211 instead of $0.006 |
| `minimax-image-01` for non-critical assets | $0.005 vs $0.03–0.06 on a mid-tier model |
| `imagen-4-fast` instead of `imagen-4-standard` | $0.02 vs $0.04 — **half**, same 2K ceiling |
| Batch with `num_images` (one round-trip) | Faster; the price is per image either way |
| Check a model's real `num_images` cap before batching | Asking 8 from a model that returns 1 is refunded, but you waited for it |

::: tip Verify, don't estimate
Every response carries the settled `cost_usd`, and BytePlus models carry a per-leg
`cost_breakdown`. Reconcile against those, not against this page — and read your running
total from [`GET /v1/billing/usage`](/api/billing).
:::

### Prompt Engineering Best Practices

1. **Be specific** -- "golden hour light casting long shadows on wet cobblestone street" beats "nice street"
2. **Front-load important details** -- models pay more attention to the beginning of prompts
3. **Include technical terms** -- "bokeh", "f/1.4", "ISO 100", "volumetric fog" help photorealistic models
4. **Use negative prompts** -- explicitly exclude unwanted elements: `"blurry, watermark, text, distorted hands"`
5. **Iterate with seeds** -- find a good seed, then refine the prompt while keeping the seed fixed

### Rate Limits

The limit is **per API key**, not per plan and not per account. Every key ships at
**60 requests per minute** and can be raised to **600** in the console. No subscription
plan changes it, and there is no monthly image or credit allowance to run out of — the
wallet balance is the only other thing that can stop a request.

| | |
|---|---|
| Default | 60 requests/min per key |
| Maximum | 600 requests/min per key |
| Scope | The key, so keys do not share a window |
| Window | 60 seconds |

Every response carries the current window:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 57
X-RateLimit-Reset: 1754924400
```

On a `429` the body is `{"error": "rate_limit_exceeded", "limit_rpm": 60, "scope": "api_key"}`
and `Retry-After: 60` is set. Nothing is charged.

::: tip Handling rate limits
Read `X-RateLimit-Remaining` and pace yourself rather than waiting for the `429`. When one
does arrive, honour `Retry-After` and back off exponentially. If you consistently need more,
raise the limit on the key in the console — up to 600/min — instead of creating extra keys.
:::

---

## Error Responses

| Status | Code / shape | Description | Charged? |
|--------|--------------|-------------|----------|
| 400 | `"prompt is required"` | Empty or missing `prompt`. | No |
| 400 | `"num_images must be …"` | Not an integer, below 1, or above 8. | No |
| 400 | `"image_size must be one of 1K, 1.5K, 2K, 3K, 4K"` | Unrecognised tier. | No |
| 400 | retirement message | `dall-e-3` / `dall-e-3-hd`. Names the replacement (`gpt-image-1` / `gpt-image-1.5`) and refuses before authentication. | No |
| 401 | `"Invalid API key"` / `"API key has expired"` | Missing, malformed, revoked or expired key. Header must be `Bearer fh_live_*`. | No |
| 403 | scope or IP denial | The key's scopes do not cover this endpoint, or its IP allowlist rejected you. | No |
| 402 | `insufficient_funds` | The wallet cannot cover the render. Refused before the provider. | No |
| 429 | `rate_limit_exceeded` | Over the key's per-minute limit. `Retry-After: 60`. | No |
| 500 | `"Pricing is not configured for '<model>'"` | The model has no price. `imagen-3-capability` is the live example. Refused, not billed. | No |
| 500 | upstream message | The provider failed after the charge: safety refusal, provider error, or one of the six switched-off FLUX ids. | Refunded |
| 502 | `"<function> unreachable"` | The generation pipeline could not be reached. | Refunded |
| 504 | `"<function> did not respond within Ns"` | Timed out — 300 s at the origin, but the CDN cuts a proxied request at 100 s. | Refunded |

### 402 — Insufficient funds

The one error worth branching on. Raised before any provider is called, so nothing is spent:

```json
{
  "detail": {
    "error": "insufficient_funds",
    "code": "insufficient_funds",
    "message": "Insufficient funds: this request costs $0.126000 but your balance is $0.040000. Top up your wallet with at least $0.086000 to continue. The FOTOhub API is prepaid: no credits or subscription plan can pay for API usage.",
    "required_usd": 0.126,
    "balance_usd": 0.04,
    "shortfall_usd": 0.086,
    "currency": "USD",
    "charged": false,
    "charged_usd": 0,
    "topup_url": "https://fotohub.app/console/wallet",
    "operation": "generate_image:seedream-5-0-260128"
  }
}
```

Top up by at least `shortfall_usd`. A fotohub.app subscription does not help: API usage is
payable only from the wallet. Note `required_usd` scales with `num_images` and the tier — the
$0.126 above is 4 SeedDream images.

### Nothing delivered, nothing charged

The charge happens before the provider on every model, so any failure after it is reversed.
When the reversal commits, the sentence **`Your wallet was not charged for this request.`**
is appended to the error message — and it is appended *only* then, so its absence means
check [`GET /v1/billing/usage`](/api/billing) rather than assume.

```json
{
  "detail": "{\"error\":\"Generowanie zablokowane przez filtr bezpieczenstwa. Spróbuj zmodyfikować prompt lub użyj innego modelu.\",\"errorId\":\"a1b2c3\",\"refunded\":false}. Your wallet was not charged for this request."
}
```

Two things to know about that string:

- **`detail` is a string, not an object**, and the upstream body is embedded in it verbatim —
  so it is sometimes JSON, sometimes Polish, and on a disabled model the inner `error` is
  missing entirely (you get little more than an `errorId`). Do not parse it. Branch on the
  HTTP status, log the body, and retry a `500`/`502`/`504` once: nothing was charged, so the
  retry is free.
- **The `"refunded"` flag inside the quoted body is not about your wallet.** It refers to the
  internal credit ledger, which the API does not bill from, and reads `false` on every API
  request. The appended sentence is the one to trust.

A partial delivery is settled the same way, without an error: ask for 8, get 4, and the other
4 are refunded with `refunded_usd` on the success response.
