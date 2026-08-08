# Image Generation

FOTOhub provides access to **30+ image generation models** from 8 providers: Google (Vertex AI Imagen + Gemini), OpenAI, Microsoft, BytePlus, xAI, Black Forest Labs, MiniMax, and Kling. Generate photorealistic images, illustrations, concept art, and more via a single unified endpoint.

::: info Two Billing Modes
- **Credit-based** — Fixed cost per image regardless of resolution. Most models use this mode.
- **Token-based** — Cost scales with output resolution (pixel count). Used by BytePlus SeedDream models.
:::

## Endpoint

```
POST /v1/ai/generate/image
```

**Authentication:** Bearer token (API key)  
**Billing:** 1–8 credits per image (credit-based) or token-based for SeedDream models

## Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | **Yes** | — | Text description of the image to generate. Be specific — include subject, style, lighting, composition details for best results. Max 4096 characters. |
| `model` | string | No | `"imagen-3-fast"` | Model identifier. See the full model list below. We recommend `seedream-5-0-260128` for best quality. |
| `width` | integer | No | `1024` | Output image width in pixels. Range: 256–4096. Must be divisible by 64 for most models. |
| `height` | integer | No | `1024` | Output image height in pixels. Range: 256–4096. Must be divisible by 64 for most models. |
| `aspect_ratio` | string | No | `"1:1"` | Aspect ratio preset. Options: `"1:1"`, `"16:9"`, `"9:16"`, `"4:3"`, `"3:4"`. Overrides width/height when set. |
| `num_images` | integer | No | `1` | Number of images to generate per request. Range: 1–4. Credits are charged per image. |
| `negative_prompt` | string | No | — | Describe what to avoid in the generated image. E.g., `"blurry, low quality, distorted faces"`. Not supported by all models. |
| `style` | string | No | — | Style preset. Common options: `"photorealistic"`, `"cinematic"`, `"anime"`, `"digital-art"`, `"oil-painting"`. |
| `seed` | integer | No | random | Seed for reproducible generation. Same prompt + seed + model = same output. Range: 0–4294967295. |

::: tip Resolution Tips
Use `aspect_ratio` instead of manual width/height for most use cases. The API automatically picks optimal dimensions for the selected model. For token-based models (BytePlus), higher resolution directly increases cost.
:::

## Response Format

### Credit-Based Response (Standard Models)

```json
{
  "model": "imagen-4-standard",
  "credits_used": 3,
  "billing": {
    "method": "credits",
    "usd_charged": 0,
    "pln_charged": 0
  },
  "images": [
    "https://s1.fotohub.app/storage/v1/object/public/generations/img_abc123.png"
  ],
  "metadata": {
    "width": 1024,
    "height": 1024,
    "seed": 42,
    "model": "imagen-4-standard",
    "generation_time_ms": 3200
  }
}
```

`method` is `credits` while your plan allowance covers the request, and both money
fields are `0` because nothing was charged. Once the allowance is exhausted the
same request returns `"method": "wallet"` with `"usd_charged": 0.1206` -- the
model's per-request USD price. Read `usd_charged`; `pln_charged` is a legacy
mirror of the same charge and will be removed.

### Token-Based Response (BytePlus SeedDream Models)

```json
{
  "model": "seedream-5-0-260128",
  "credits_used": 1,
  "billing": {
    "method": "token",
    "credits_used": 1,
    "usd_charged": 0.0563,
    "cost_breakdown": {
      "output_tokens": 4096,
      "cost_usd": 0.012288,
      "rate_per_1m_tokens_usd": 2.00
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
    "https://s1.fotohub.app/storage/v1/object/public/generations/img_def456.png"
  ],
  "metadata": {
    "width": 1024,
    "height": 1024,
    "seed": 8817,
    "model": "seedream-5-0-260128",
    "generation_time_ms": 2100
  }
}
```

::: warning Two USD figures, two meanings
`cost_breakdown.cost_usd` is what the generation cost at the token rate (see
[Token Calculation Formula](#token-calculation-formula)). `usd_charged` is what
was actually taken from your wallet, which uses the model's flat per-request
price -- `$0.0563` for `seedream-5-0-260128`. It is `0` while your plan's credit
allowance still covers the request. Reconcile invoices against `usd_charged`.
:::

### Your Latency Budget

`usage` reports where the wall-clock time went, so a slow call points at a fix
rather than at a shrug.

| Field | Type | Description |
|-------|------|-------------|
| `output_tokens` | integer | Tokens billed for this render — scales with pixel count |
| `total_tokens` | integer | Same figure with any input tokens included |
| `generated_images` | integer | Images actually produced (a partly-failed batch reports fewer than requested) |
| `resolution` | string | The size that was actually rendered, `WxH`. What you asked for is echoed in `metadata` |
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

## Token-Based Billing (BytePlus Models)

BytePlus SeedDream models use per-token billing where cost scales with output resolution. Generating a 4K image costs 16x more than a 1K image.

::: warning Cost Scales with Resolution
Unlike credit-based models where a 4K image costs the same as a 1K image, token-based models charge proportionally to pixel count. Always check the estimated cost before generating at high resolutions.
:::

### Token Calculation Formula

```
output_tokens = (width × height) / 256
raw_cost_usd  = (output_tokens / 1,000,000) × rate_per_1m_usd
cost_usd      = raw_cost_usd × 1.5          # margin
```

BytePlus bills in USD, so there is no currency conversion in this path.
`cost_usd` in `billing.cost_breakdown` is the margin-inclusive figure.

### Resolution to Token Examples

| Resolution | Output Tokens | Raw @ $2/1M | `cost_usd` (with margin) |
|-----------|---------------|-------------|--------------------------|
| 1024 × 1024 | 4,096 | $0.008192 | $0.012288 |
| 1536 × 1536 | 9,216 | $0.018432 | $0.027648 |
| 2048 × 2048 | 16,384 | $0.032768 | $0.049152 |
| 3072 × 3072 | 36,864 | $0.073728 | $0.110592 |
| 4096 × 4096 | 65,536 | $0.131072 | $0.196608 |

### Token-Based Model Rates

| Model | Rate (USD/1M tokens) | Credits (min) |
|-------|---------------------|---------------|
| `seedream-5-0-260128` | $2.00 | 2 |
| `seedream-4-5-251128` | $2.50 | 3 |
| `seedream-4-0-250828` | $2.00 | 2 |
| `dola-seedream-5-0-pro-260628` | $3.50 | 3 |
| `seededit-3-0-i2i-250628` | $2.50 | 3 |

## All Models — Complete Pricing

### Google Vertex AI (Imagen)

| Model ID | Name | Price (USD) | Credits | Notes |
|----------|------|-------------|---------|-------|
| `imagen-3-fast` | Imagen 3 Fast | 0.0322 | 1 | 512px fast |
| `imagen-3-standard` | Imagen 3 Standard | 0.0643 | 2 | 1K |
| `imagen-3-capability` | Imagen 3 Capability | 0.0643 | 2 | editing/customization |
| `imagen-4-standard` | Imagen 4 Standard | 0.1206 | 3 | High quality |
| `imagen-4-ultra` | Imagen 4 Ultra | 0.2412 | 5 | 4K |

### Google — Gemini (Nano Banana family)

Gemini's native multimodal image models — text-to-image, image-to-image, and multi-image composition (up to 10 reference images) in one model.

| Model ID | Name | Price (USD) | Credits | Notes |
|----------|------|-------------|---------|-------|
| `gemini-3.1-flash-lite-image` | Nano Banana 2 Lite | 0.0536 | 1 | cheapest Gemini image model |
| `gemini-2.5-flash-image` | Nano Banana | 0.1072 | 2 | up to 10 reference images |
| `gemini-3.1-flash-image` | Nano Banana 2 | 0.1608 | 3 | GA |
| `gemini-3.1-flash-image-preview` | Nano Banana 2 (Preview) | 0.1608 | 3 | preview channel |
| `gemini-3-pro-image` | Nano Banana Pro | 0.2841 | 6 | **Recommended for quality** — 1K/2K/4K, advanced reasoning, precise text rendering |

### OpenAI

| Model ID | Name | Price (USD) | Credits | Notes |
|----------|------|-------------|---------|-------|
| `dall-e-3-standard` | DALL-E 3 | 0.0643 | 2 | — |
| `dall-e-3-hd` | DALL-E 3 HD | 0.1286 | 4 | — |
| `gpt-image-1` | GPT Image 1 | 0.1608 | 4 | high fidelity |
| `gpt-image-2` | GPT Image 2 | 0.1072 | 10 | **Recommended** — highest fidelity, 4K, best text rendering |

### Microsoft — MAI-Image

| Model ID | Name | Price (USD) | Credits | Notes |
|----------|------|-------------|---------|-------|
| `mai-image-2.5-flash` | MAI-Image 2.5 Flash | 0.0536 | 1 | budget/fast |
| `mai-image-2.5` | MAI-Image 2.5 | 0.0536 | 1 | up to 1024x1024 |

### BytePlus SeedDream (Token-Based)

| Model ID | Name | ~USD @1K | Credits | Notes |
|----------|------|----------|---------|-------|
| `seedream-4-0-250828` | SeedDream 4.0 | 0.0482 | 2 | token-based |
| `seedream-5-0-260128` | SeedDream 5.0 Lite | 0.0563 | 2 | **Recommended**, best value |
| `seedream-4-5-251128` | SeedDream 4.5 | 0.0643 | 3 | token-based |
| `dola-seedream-5-0-pro-260628` | SeedDream 5.0 Pro (Dola) | 0.0723 | 3 | token-based |
| `seededit-3-0-i2i-250628` | SeedEdit 3.0 (img2img) | 0.0643 | 3 | token-based |

### BytePlus Dreamina 4.6 (Flat Per-Image)

Unlike the SeedDream models above, Dreamina 4.6 (`model: "dreamina-4-6"`) is billed **flat per returned image**, not by token/resolution — it accepts up to 14 reference images for image-to-image composition and can output 1K/2K/4K.

| Model ID | Name | Price (USD) | Credits | Notes |
|----------|------|-------------|---------|-------|
| `dreamina-4-6` | Dreamina 4.6 | 0.1072 | 2 | up to 14 reference images, force_single by default |

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
  "credits_used": 2,
  "billing": {
    "method": "credits",
    "usd_charged": 0,
    "pln_charged": 0,
    "breakdown": { "credits_charged": 2, "pricing_type": "per_image_resolution" }
  },
  "images": [
    "https://p16-aiop-sign-sg.ibyteimg.com/tos-alisg-i-e2jboc02s9-sg/....png?..."
  ]
}
```

This call is synchronous — unlike the async job pattern used for [avatar and motion-transfer generation](/api/avatar-motion), Dreamina 4.6 returns the finished image URL(s) directly in the response.

### xAI (Grok Imagine)

| Model ID | Name | Price (USD) | Credits | Notes |
|----------|------|-------------|---------|-------|
| `grok-imagine-image` | Grok Imagine | 0.0322 | 1 | 1K, single-image edit |
| `grok-imagine-image-pro` | Grok Imagine Pro | 0.1125 | 3 | **2K**, multi-image combine (up to 3 refs), virtual try-on |

#### xAI Grok Image — Capabilities

| Feature | `grok-imagine-image` | `grok-imagine-image-pro` |
|---------|:-------------------:|:------------------------:|
| Text-to-Image | Yes | Yes |
| Single Image Edit | Yes | Yes |
| Multi-Image Combine (up to 3) | — | Yes |
| Virtual Try-On | — | Yes |
| Max Resolution | 1K | 2K |
| Max `num_images` per request | 10 | 10 |
| Aspect Ratios | 7 | 7 |

**Supported Aspect Ratios:** `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `9:16`, `16:9`

::: tip xAI Grok Models
Grok Imagine Pro is ideal for e-commerce: multi-image product listings, virtual try-on, and high-quality edits at 2K resolution. The basic model is a fast, budget-friendly option for social media and quick prototypes at 1K.
:::

### Black Forest Labs — FLUX

FLUX models cover the full range from ultra-fast lightweight generation to maximum-fidelity output and context-aware editing.

| Model ID | Name | Price (USD) | Credits | Notes |
|----------|------|-------------|---------|-------|
| `flux-2-klein-4b` | FLUX.2 Klein 4B | 0.0225 | 1 | ultra-fast, lightweight 4B model |
| `flux-2-klein-9b` | FLUX.2 Klein 9B | 0.0241 | 1 | fast, lightweight 9B model |
| `flux-2-pro` | FLUX.2 Pro | 0.0482 | 2 | balanced, versatile |
| `flux-1.1-pro` | FLUX 1.1 Pro | 0.0643 | 2 | high quality, creative |
| `flux-kontext-pro` | FLUX Kontext Pro | 0.0643 | 2 | context-aware editing, style transfer |
| `flux-1.1-pro-ultra` | FLUX 1.1 Pro Ultra | 0.0965 | 3 | ultra detail, large canvas |
| `flux-2-max` | FLUX.2 Max | 0.1125 | 4 | highest FLUX quality |
| `flux-kontext-max` | FLUX Kontext Max | 0.1286 | 4 | maximum context fidelity |

::: tip FLUX Model Range
The Klein models are optimized for speed and cost, while Pro, Ultra, and Max deliver progressively higher fidelity. Kontext models specialize in context-aware editing and style transfer.
:::

### MiniMax

| Model ID | Name | Price (USD) | Credits | Notes |
|----------|------|-------------|---------|-------|
| `minimax-image-01` | MiniMax Image 01 | 0.0056 | 1 | lowest-cost budget option |

### Kling

| Model ID | Name | Price (USD) | Credits | Notes |
|----------|------|-------------|---------|-------|
| `kling-v2-1` | Kling V2.1 | 0.0643 | 2 | balanced quality |
| `kling-v3` | Kling V3 | 0.1608 | 5 | high quality |
| `kling-v3-omni` | Kling V3 Omni | 0.2412 | 8 | premium, highest fidelity, all modes |

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
print(f"Credits used: {data['credits_used']}")
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
console.log("Credits used:", data.credits_used);
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
	fmt.Println("Credits used:", data["credits_used"])
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

### Token-Based Model (SeedDream)

::: code-group

```python [Python]
import requests

# SeedDream models use token-based billing — cost scales with resolution
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
print(f"Output tokens: {data['usage']['output_tokens']}")
print(f"Cost (USD): {data['billing']['cost_breakdown']['cost_usd']}")
# At 2048x2048: 16,384 tokens → ~$0.0492
```

```typescript [TypeScript]
// SeedDream models use token-based billing — cost scales with resolution
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
console.log("Output tokens:", data.usage.output_tokens);
console.log("Cost (USD):", data.billing.cost_breakdown.cost_usd);
// At 2048x2048: 16,384 tokens → ~$0.0492
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
	fmt.Println("Output tokens:", usage["output_tokens"])
	fmt.Println("Cost (USD):", breakdown["cost_usd"])
	// At 2048x2048: 16,384 tokens -> ~$0.0492
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

# Imagen 4 Ultra and FLUX Pro Ultra support native 4K output
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
print(f"Credits: {data['credits_used']}")  # 5 credits for ultra
```

```typescript [TypeScript]
// Imagen 4 Ultra and FLUX Pro Ultra support native 4K output
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
console.log("Credits:", data.credits_used); // 5 credits for ultra
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
	fmt.Println("Credits:", data["credits_used"]) // 5 credits for ultra
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

# Generate 4 variations in a single request
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
        "aspect_ratio": "1:1"
    }
)

data = response.json()
# Credits charged: 4 images x 2 credits = 8 credits total
for i, url in enumerate(data["images"]):
    print(f"Variation {i+1}: {url}")
print(f"Total credits: {data['credits_used']}")
```

```typescript [TypeScript]
// Generate 4 variations in a single request
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
    aspect_ratio: "1:1"
  })
});

const data = await response.json();
// Credits charged: 4 images x 2 credits = 8 credits total
data.images.forEach((url: string, i: number) => {
  console.log(`Variation ${i + 1}: ${url}`);
});
console.log("Total credits:", data.credits_used);
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

	// Credits charged: 4 images x 2 credits = 8 credits total
	images := data["images"].([]interface{})
	for i, url := range images {
		fmt.Printf("Variation %d: %s\n", i+1, url)
	}
	fmt.Println("Total credits:", data["credits_used"])
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
    "aspect_ratio": "1:1"
  }'
```

:::

### Negative Prompt & Style Preset

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
        "prompt": "Portrait of a woman in Renaissance style, oil painting, dramatic lighting, rich colors",
        "model": "flux-kontext-pro",
        "negative_prompt": "blurry, low quality, distorted, deformed, watermark, text overlay, cartoon",
        "style": "oil-painting",
        "aspect_ratio": "3:4",
        "seed": 42  # Use seed for reproducible results
    }
)

data = response.json()
print(f"Image: {data['images'][0]}")
print(f"Seed used: {data['metadata']['seed']}")  # 42 — same result every time
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Portrait of a woman in Renaissance style, oil painting, dramatic lighting, rich colors",
    model: "flux-kontext-pro",
    negative_prompt: "blurry, low quality, distorted, deformed, watermark, text overlay, cartoon",
    style: "oil-painting",
    aspect_ratio: "3:4",
    seed: 42 // Use seed for reproducible results
  })
});

const data = await response.json();
console.log("Image:", data.images[0]);
console.log("Seed used:", data.metadata.seed); // 42 — same result every time
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
		"prompt":          "Portrait of a woman in Renaissance style, oil painting, dramatic lighting, rich colors",
		"model":           "flux-kontext-pro",
		"negative_prompt": "blurry, low quality, distorted, deformed, watermark, text overlay, cartoon",
		"style":           "oil-painting",
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
	metadata := data["metadata"].(map[string]interface{})
	fmt.Println("Image:", images[0])
	fmt.Println("Seed used:", metadata["seed"]) // 42 - same result every time
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Portrait of a woman in Renaissance style, oil painting, dramatic lighting, rich colors",
    "model": "flux-kontext-pro",
    "negative_prompt": "blurry, low quality, distorted, deformed, watermark, text overlay, cartoon",
    "style": "oil-painting",
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
        "num_images": 1
    }
)

data = response.json()
print(f"2K product shot: {data['images'][0]}")
# 3 credits, 2K resolution, portrait 2:3 aspect
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
    num_images: 1
  })
});

const data = await response.json();
console.log("2K product shot:", data.images[0]);
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
	// 3 credits, 2K resolution, portrait 2:3 aspect
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
# 4 variations at 1 credit each = 4 credits total
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
// 4 variations at 1 credit each = 4 credits total
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

	// 4 variations at 1 credit each = 4 credits total
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

### Product Display Edit (Single Reference Image)

Edit an existing product photo — change background, lighting, or context while preserving the product.

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
        "prompt": "Place this product in a modern minimalist kitchen, marble countertop, "
                  "soft natural window light, lifestyle photography",
        "model": "grok-imagine-image-pro",
        "aspect_ratio": "3:4",
        "image_url": "https://your-storage.com/product-photo.jpg"
    }
)

data = response.json()
print(f"Edited product: {data['images'][0]}")
# 3 credits — single image edit mode
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Place this product in a modern minimalist kitchen, marble countertop, " +
            "soft natural window light, lifestyle photography",
    model: "grok-imagine-image-pro",
    aspect_ratio: "3:4",
    image_url: "https://your-storage.com/product-photo.jpg"
  })
});

const data = await response.json();
console.log("Edited product:", data.images[0]);
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
		"prompt":       "Place this product in a modern minimalist kitchen, marble countertop, soft natural window light, lifestyle photography",
		"model":        "grok-imagine-image-pro",
		"aspect_ratio": "3:4",
		"image_url":    "https://your-storage.com/product-photo.jpg",
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
	fmt.Println("Edited product:", images[0])
	// 3 credits - single image edit mode
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Place this product in a modern minimalist kitchen, marble countertop, soft natural window light",
    "model": "grok-imagine-image-pro",
    "aspect_ratio": "3:4",
    "image_url": "https://your-storage.com/product-photo.jpg"
  }'
```

:::

### Combined Product Listing (Multi-Image, up to 3 References)

Combine multiple product images into a single cohesive composition. Only available with `grok-imagine-image-pro`.

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
        "prompt": "Arrange all products in an elegant flat-lay composition, "
                  "clean white background, consistent lighting, e-commerce catalog style",
        "model": "grok-imagine-image-pro",
        "aspect_ratio": "1:1",
        "image_urls": [
            "https://your-storage.com/product-1.jpg",
            "https://your-storage.com/product-2.jpg",
            "https://your-storage.com/product-3.jpg"
        ]
    }
)

data = response.json()
print(f"Combined listing: {data['images'][0]}")
# 3 credits — multi-image combine mode (max 3 reference images)
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Arrange all products in an elegant flat-lay composition, " +
            "clean white background, consistent lighting, e-commerce catalog style",
    model: "grok-imagine-image-pro",
    aspect_ratio: "1:1",
    image_urls: [
      "https://your-storage.com/product-1.jpg",
      "https://your-storage.com/product-2.jpg",
      "https://your-storage.com/product-3.jpg"
    ]
  })
});

const data = await response.json();
console.log("Combined listing:", data.images[0]);
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
		"prompt":       "Arrange all products in an elegant flat-lay composition, clean white background, consistent lighting, e-commerce catalog style",
		"model":        "grok-imagine-image-pro",
		"aspect_ratio": "1:1",
		"image_urls": []string{
			"https://your-storage.com/product-1.jpg",
			"https://your-storage.com/product-2.jpg",
			"https://your-storage.com/product-3.jpg",
		},
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
	fmt.Println("Combined listing:", images[0])
	// 3 credits - multi-image combine mode (max 3 reference images)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Arrange all products in an elegant flat-lay composition, clean white background, consistent lighting",
    "model": "grok-imagine-image-pro",
    "aspect_ratio": "1:1",
    "image_urls": [
      "https://your-storage.com/product-1.jpg",
      "https://your-storage.com/product-2.jpg",
      "https://your-storage.com/product-3.jpg"
    ]
  }'
```

:::

::: warning Multi-Image Limits
- Maximum **3 reference images** per request
- Only available with `grok-imagine-image-pro` model
- All images must be publicly accessible URLs or FOTOhub storage URLs
- Higher resolution images produce better combine results
:::

### Virtual Try-On (2 References — Person + Garment)

Show a person wearing a specific garment or accessory. Provide the person photo and the product image.

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
        "prompt": "Virtual try-on: person wearing the garment from second image, "
                  "natural fit, correct proportions, photorealistic, keep person's face and body",
        "model": "grok-imagine-image-pro",
        "aspect_ratio": "3:4",
        "image_urls": [
            "https://your-storage.com/model-photo.jpg",     # Person
            "https://your-storage.com/dress-product.jpg"    # Garment
        ]
    }
)

data = response.json()
print(f"Try-on result: {data['images'][0]}")
# 3 credits — virtual try-on mode via multi-image
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Virtual try-on: person wearing the garment from second image, " +
            "natural fit, correct proportions, photorealistic",
    model: "grok-imagine-image-pro",
    aspect_ratio: "3:4",
    image_urls: [
      "https://your-storage.com/model-photo.jpg",
      "https://your-storage.com/dress-product.jpg"
    ]
  })
});

const data = await response.json();
console.log("Try-on result:", data.images[0]);
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
		"prompt":       "Virtual try-on: person wearing the garment from second image, natural fit, correct proportions, photorealistic, keep person's face and body",
		"model":        "grok-imagine-image-pro",
		"aspect_ratio": "3:4",
		"image_urls": []string{
			"https://your-storage.com/model-photo.jpg",
			"https://your-storage.com/dress-product.jpg",
		},
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
	fmt.Println("Try-on result:", images[0])
	// 3 credits - virtual try-on mode via multi-image
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Virtual try-on: person wearing the garment from second image, natural fit, photorealistic",
    "model": "grok-imagine-image-pro",
    "aspect_ratio": "3:4",
    "image_urls": [
      "https://your-storage.com/model-photo.jpg",
      "https://your-storage.com/dress-product.jpg"
    ]
  }'
```

:::

::: tip Virtual Try-On Best Practices
1. **Person image first** — full-body or half-body shot, clear pose, neutral background
2. **Garment image second** — flat-lay or mannequin shot showing full garment
3. Use `3:4` or `2:3` aspect ratio for best full-body results
4. Include "keep person's face" in prompt to preserve identity
5. Works with clothing, accessories, eyewear, hats, shoes
:::

---

## Image Editing

Modify existing images with AI-powered editing operations including inpainting, outpainting, background replacement, object removal, and upscaling.

### Endpoint

```
POST /v1/ai/edit/image
```

**Billing:** 2 credits per edit (fixed, regardless of mode or resolution)

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image_url` | string | **Yes** | URL of the source image. Must be publicly accessible or a FOTOhub storage URL. |
| `prompt` | string | **Yes** | Description of the desired edit. |
| `mode` | string | **Yes** | `"inpaint"`, `"outpaint"`, `"bgswap"`, `"remove"`, or `"upscale"` |
| `mask_url` | string | No | Mask image URL (white = edit area). Required for `"inpaint"` mode. |

### Editing Examples

::: code-group

```python [Background Swap]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/edit/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/photo.jpg",
        "prompt": "Professional studio background with soft gradient lighting",
        "mode": "bgswap"
    }
)

data = response.json()
print(f"Edited image: {data['images'][0]}")
```

```python [Inpaint]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/edit/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/room.jpg",
        "prompt": "A modern minimalist sofa with clean lines",
        "mode": "inpaint",
        "mask_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/room_mask.png"
    }
)

data = response.json()
print(f"Edited image: {data['images'][0]}")
```

```python [Upscale]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/edit/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/low_res.jpg",
        "prompt": "Enhance resolution, preserve details, sharpen edges",
        "mode": "upscale"
    }
)

data = response.json()
print(f"Upscaled image: {data['images'][0]}")
```

:::

## Model Comparison Table

A comprehensive overview of all available image models with their capabilities, performance characteristics, and pricing.

| Model ID | Provider | Max Resolution | Speed | Quality | Credits | Key Features |
|----------|----------|---------------|:-----:|:-------:|:-------:|--------------|
| `imagen-3-fast` | Google Vertex AI | 512x512 | 5/5 | 3/5 | 1 | Ultra-fast drafts, lowest cost |
| `imagen-3-standard` | Google Vertex AI | 1024x1024 | 4/5 | 4/5 | 2 | Balanced speed/quality |
| `imagen-3-capability` | Google Vertex AI | 1024x1024 | 4/5 | 4/5 | 2 | Editing and customization |
| `imagen-4-standard` | Google Vertex AI | 2048x2048 | 3/5 | 4/5 | 3 | High quality, good for production |
| `imagen-4-ultra` | Google Vertex AI | 4096x4096 | 2/5 | 5/5 | 5 | Native 4K, highest fidelity from Google |
| `gemini-3.1-flash-lite-image` | Google Gemini | 1024x1024 | 5/5 | 3/5 | 1 | Nano Banana 2 Lite, cheapest Gemini |
| `gemini-2.5-flash-image` | Google Gemini | 1024x1024 | 4/5 | 4/5 | 2 | Nano Banana, up to 10 reference images |
| `gemini-3.1-flash-image` | Google Gemini | 1024x1024 | 4/5 | 4/5 | 3 | Nano Banana 2, GA |
| `gemini-3-pro-image` | Google Gemini | 4096x4096 | 2/5 | 5/5 | 6 | Nano Banana Pro, 1K/2K/4K, precise text rendering |
| `dall-e-3-standard` | OpenAI | 1024x1024 | 3/5 | 4/5 | 2 | Strong prompt following, text rendering |
| `dall-e-3-hd` | OpenAI | 1792x1792 | 3/5 | 4/5 | 4 | HD variant, better details |
| `gpt-image-1` | OpenAI | 2048x2048 | 3/5 | 5/5 | 4 | High OpenAI fidelity, photorealism |
| `gpt-image-2` | OpenAI | 4096x4096 | 2/5 | 5/5 | 10 | Highest OpenAI fidelity, best text rendering, 4K |
| `mai-image-2.5-flash` | Microsoft | 1024x1024 | 4/5 | 3/5 | 1 | Budget/fast Azure AI model |
| `mai-image-2.5` | Microsoft | 1024x1024 | 3/5 | 4/5 | 1 | Azure AI flagship, prompt rewriting |
| `seedream-5-0-260128` | BytePlus | 4096x4096 | 4/5 | 5/5 | 2 | **Recommended** -- best value, token-based |
| `seedream-4-5-251128` | BytePlus | 4096x4096 | 3/5 | 4/5 | 3 | Token-based, excellent detail |
| `seedream-4-0-250828` | BytePlus | 4096x4096 | 4/5 | 4/5 | 2 | Token-based, budget-friendly |
| `dola-seedream-5-0-pro-260628` | BytePlus | 4096x4096 | 3/5 | 5/5 | 3 | Pro quality, enhanced realism |
| `seededit-3-0-i2i-250628` | BytePlus | 4096x4096 | 3/5 | 4/5 | 3 | Image-to-image editing, token-based |
| `grok-imagine-image` | xAI | 1024x1024 | 4/5 | 3/5 | 1 | Fast budget option, single-image edit |
| `grok-imagine-image-pro` | xAI | 2048x2048 | 3/5 | 4/5 | 3 | 2K, multi-image combine, virtual try-on |
| `flux-1.1-pro` | Black Forest Labs | 1440x1440 | 3/5 | 4/5 | 2 | Creative, artistic styles |
| `flux-1.1-pro-ultra` | Black Forest Labs | 2048x2048 | 2/5 | 5/5 | 3 | Ultra detail, large canvas |
| `flux-kontext-pro` | Black Forest Labs | 1440x1440 | 3/5 | 4/5 | 2 | Context-aware editing, style transfer |
| `flux-kontext-max` | Black Forest Labs | 2048x2048 | 2/5 | 5/5 | 4 | Maximum context fidelity |
| `flux-2-max` | Black Forest Labs | 2048x2048 | 2/5 | 5/5 | 4 | Highest FLUX quality |
| `flux-2-pro` | Black Forest Labs | 1440x1440 | 3/5 | 4/5 | 2 | Balanced, versatile |
| `flux-2-klein-4b` | Black Forest Labs | 1024x1024 | 5/5 | 3/5 | 1 | Ultra-fast, lightweight 4B model |
| `flux-2-klein-9b` | Black Forest Labs | 1024x1024 | 5/5 | 3/5 | 1 | Fast, lightweight 9B model |
| `minimax-image-01` | MiniMax | 1024x1024 | 4/5 | 3/5 | 1 | Lowest-cost budget option |
| `kling-v3-omni` | Kling | 2048x2048 | 2/5 | 5/5 | 8 | Premium, highest fidelity, all modes |
| `kling-v3` | Kling | 2048x2048 | 2/5 | 4/5 | 5 | High quality |
| `kling-v2-1` | Kling | 1536x1536 | 3/5 | 4/5 | 2 | Balanced |

::: tip Choosing a Model
- **Best value**: `seedream-5-0-260128` -- high quality at token-based pricing, scales to 4K
- **Fastest**: `imagen-3-fast`, `flux-2-klein-4b`, or `flux-2-klein-9b` for sub-second generations
- **Highest quality**: `gemini-3-pro-image` (Nano Banana Pro), `gpt-image-2`, `imagen-4-ultra`, or `flux-2-max` for print/commercial work
- **Multi-image composition**: `gemini-3.1-flash-image` or `gemini-2.5-flash-image` (Nano Banana) -- up to 10 reference images in one call
- **Image editing**: `flux-kontext-pro` (style transfer), `seededit-3-0-i2i-250628` (img2img), `grok-imagine-image-pro` (multi-image)
- **Budget**: `grok-imagine-image`, `minimax-image-01`, or `gemini-3.1-flash-lite-image` at 1 credit per image
:::

---

## Advanced Use Cases

### 4K Ultra-Resolution with Imagen 4 Ultra

Generate native 4K images suitable for print, large-format displays, and premium marketing materials.

::: code-group

```python [Python]
import requests

# Imagen 4 Ultra generates native 4K at 5 credits per image
response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Luxury real estate interior, open-plan living room with floor-to-ceiling windows overlooking city skyline at sunset, marble floors, designer furniture, volumetric lighting, architectural photography, 8K quality",
        "model": "imagen-4-ultra",
        "width": 4096,
        "height": 2304,
        "aspect_ratio": "16:9",
        "negative_prompt": "low quality, blurry, distorted, watermark, oversaturated"
    }
)

data = response.json()
print(f"4K Image URL: {data['images'][0]}")
print(f"Resolution: {data['metadata']['width']}x{data['metadata']['height']}")
print(f"Credits used: {data['credits_used']}")  # 5 credits
print(f"Generation time: {data['metadata']['generation_time_ms']}ms")
```

```typescript [TypeScript]
// Imagen 4 Ultra generates native 4K at 5 credits per image
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Luxury real estate interior, open-plan living room with floor-to-ceiling windows overlooking city skyline at sunset, marble floors, designer furniture, volumetric lighting, architectural photography, 8K quality",
    model: "imagen-4-ultra",
    width: 4096,
    height: 2304,
    aspect_ratio: "16:9",
    negative_prompt: "low quality, blurry, distorted, watermark, oversaturated"
  })
});

const data = await response.json();
console.log("4K Image URL:", data.images[0]);
console.log(`Resolution: ${data.metadata.width}x${data.metadata.height}`);
console.log("Credits used:", data.credits_used); // 5 credits
console.log("Generation time:", data.metadata.generation_time_ms, "ms");
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
		"prompt":          "Luxury real estate interior, open-plan living room with floor-to-ceiling windows overlooking city skyline at sunset, marble floors, designer furniture, volumetric lighting, architectural photography, 8K quality",
		"model":           "imagen-4-ultra",
		"width":           4096,
		"height":          2304,
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
	metadata := data["metadata"].(map[string]interface{})
	fmt.Println("4K Image URL:", images[0])
	fmt.Printf("Resolution: %.0fx%.0f\n", metadata["width"], metadata["height"])
	fmt.Println("Credits used:", data["credits_used"]) // 5 credits
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Luxury real estate interior, open-plan living room with floor-to-ceiling windows overlooking city skyline at sunset, marble floors, designer furniture, volumetric lighting, architectural photography, 8K quality",
    "model": "imagen-4-ultra",
    "width": 4096,
    "height": 2304,
    "aspect_ratio": "16:9",
    "negative_prompt": "low quality, blurry, distorted, watermark, oversaturated"
  }'
```

:::

### Image-to-Image with FLUX Kontext Pro

Use FLUX Kontext Pro for context-aware image editing, style transfer, and guided transformations. Provide a reference image and describe the desired modification.

::: code-group

```python [Python]
import requests

# FLUX Kontext Pro excels at style transfer and context-aware editing
response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Transform this photograph into a Studio Ghibli anime art style, maintain composition and subject, soft watercolor textures, warm pastel palette, hand-drawn feel",
        "model": "flux-kontext-pro",
        "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/original-photo.jpg",
        "aspect_ratio": "16:9",
        "seed": 7777
    }
)

data = response.json()
print(f"Styled image: {data['images'][0]}")
print(f"Credits: {data['credits_used']}")  # 2 credits
# Use same seed for consistent style across multiple images
```

```typescript [TypeScript]
// FLUX Kontext Pro excels at style transfer and context-aware editing
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Transform this photograph into a Studio Ghibli anime art style, maintain composition and subject, soft watercolor textures, warm pastel palette, hand-drawn feel",
    model: "flux-kontext-pro",
    image_url: "https://s1.fotohub.app/storage/v1/object/public/uploads/original-photo.jpg",
    aspect_ratio: "16:9",
    seed: 7777
  })
});

const data = await response.json();
console.log("Styled image:", data.images[0]);
console.log("Credits:", data.credits_used); // 2 credits
// Use same seed for consistent style across multiple images
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
		"prompt":       "Transform this photograph into a Studio Ghibli anime art style, maintain composition and subject, soft watercolor textures, warm pastel palette, hand-drawn feel",
		"model":        "flux-kontext-pro",
		"image_url":    "https://s1.fotohub.app/storage/v1/object/public/uploads/original-photo.jpg",
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
	fmt.Println("Credits:", data["credits_used"]) // 2 credits
	// Use same seed for consistent style across multiple images
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Transform this photograph into a Studio Ghibli anime art style, maintain composition and subject, soft watercolor textures, warm pastel palette, hand-drawn feel",
    "model": "flux-kontext-pro",
    "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/original-photo.jpg",
    "aspect_ratio": "16:9",
    "seed": 7777
  }'
```

:::

### Batch Generation with Count Parameter

Generate multiple variations in a single API call using `num_images`. Credits are charged per image. Ideal for A/B testing, design exploration, and content pipelines.

::: code-group

```python [Python]
import requests
import concurrent.futures

# Method 1: Single request with num_images (up to 4 per request)
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
print(f"Total credits: {data['credits_used']}")  # 4 images x 2 credits = 8

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
            "model": "flux-2-klein-4b",
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
// Method 1: Single request with num_images (up to 4 per request)
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
console.log(`Total credits: ${data.credits_used}`); // 4 images x 2 credits = 8

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
      model: "flux-2-klein-4b",
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
	fmt.Printf("Total credits: %.0f\n", data["credits_used"])

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
				"model":        "flux-2-klein-4b",
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
    \"model\": \"flux-2-klein-4b\",
    \"num_images\": 4,
    \"aspect_ratio\": \"16:9\",
    \"seed\": $((1000 + {}))
  }"
```

:::

::: warning Batch Limits
- Maximum **4 images** per single request (`num_images` max: 4)
- Credits are charged **per image** -- 4 images at 2 credits each = 8 credits total
- For larger batches, use parallel requests (respect rate limit: 20 req/min default, 300 req/min on Startup plan)
- Use `seed` parameter to get reproducible results across batch runs
:::

### Style Presets

Apply predefined artistic styles to guide the generation. Style presets work with all models and can be combined with custom prompts.

::: code-group

```python [Python]
import requests

# Available style presets
STYLES = [
    "photorealistic",   # Studio photography, natural lighting
    "cinematic",        # Film-like color grading, dramatic lighting
    "anime",            # Japanese animation style
    "digital-art",      # Digital illustration, clean lines
    "oil-painting",     # Classic oil painting textures
    "watercolor",       # Soft watercolor washes
    "3d-render",        # CGI / 3D rendered look
    "pixel-art",        # Retro pixel art style
    "comic-book",       # Bold lines, halftone shading
    "minimalist",       # Clean, simple, whitespace-heavy
]

# Generate same prompt with different styles for comparison
results = {}
for style in ["photorealistic", "cinematic", "anime", "oil-painting"]:
    response = requests.post(
        "https://apis.fotohub.app/v1/ai/generate/image",
        headers={
            "Authorization": "Bearer fh_live_your_api_key",
            "Content-Type": "application/json"
        },
        json={
            "prompt": "A lone samurai standing on a hilltop, cherry blossoms falling, dramatic sky",
            "model": "seedream-5-0-260128",
            "style": style,
            "aspect_ratio": "16:9",
            "seed": 42  # Same seed for fair comparison
        }
    )
    results[style] = response.json()["images"][0]
    print(f"Style '{style}': {results[style]}")
```

```typescript [TypeScript]
// Available style presets
const STYLES = [
  "photorealistic",   // Studio photography, natural lighting
  "cinematic",        // Film-like color grading, dramatic lighting
  "anime",            // Japanese animation style
  "digital-art",      // Digital illustration, clean lines
  "oil-painting",     // Classic oil painting textures
  "watercolor",       // Soft watercolor washes
  "3d-render",        // CGI / 3D rendered look
  "pixel-art",        // Retro pixel art style
  "comic-book",       // Bold lines, halftone shading
  "minimalist",       // Clean, simple, whitespace-heavy
] as const;

// Generate same prompt with different styles for comparison
const stylesToCompare = ["photorealistic", "cinematic", "anime", "oil-painting"];
const results: Record<string, string> = {};

for (const style of stylesToCompare) {
  const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: "A lone samurai standing on a hilltop, cherry blossoms falling, dramatic sky",
      model: "seedream-5-0-260128",
      style,
      aspect_ratio: "16:9",
      seed: 42 // Same seed for fair comparison
    })
  });

  const data = await response.json();
  results[style] = data.images[0];
  console.log(`Style '${style}': ${results[style]}`);
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
	styles := []string{"photorealistic", "cinematic", "anime", "oil-painting"}

	for _, style := range styles {
		payload := map[string]interface{}{
			"prompt":       "A lone samurai standing on a hilltop, cherry blossoms falling, dramatic sky",
			"model":        "seedream-5-0-260128",
			"style":        style,
			"aspect_ratio": "16:9",
			"seed":         42, // Same seed for fair comparison
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
		fmt.Printf("Style '%s': %s\n", style, images[0])
	}
}
```

```bash [cURL]
# Generate with cinematic style preset
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A lone samurai standing on a hilltop, cherry blossoms falling, dramatic sky",
    "model": "seedream-5-0-260128",
    "style": "cinematic",
    "aspect_ratio": "16:9",
    "seed": 42
  }'

# Compare multiple styles using a loop
for style in photorealistic cinematic anime oil-painting; do
  echo "=== Style: $style ==="
  curl -s -X POST https://apis.fotohub.app/v1/ai/generate/image \
    -H "Authorization: Bearer fh_live_your_api_key" \
    -H "Content-Type: application/json" \
    -d "{
      \"prompt\": \"A lone samurai standing on a hilltop, cherry blossoms falling, dramatic sky\",
      \"model\": \"seedream-5-0-260128\",
      \"style\": \"$style\",
      \"aspect_ratio\": \"16:9\",
      \"seed\": 42
    }" | jq '.images[0]'
done
```

:::

::: tip Style Preset Tips
- Style presets **modify** the prompt internally -- they do not override it. Your prompt details still matter.
- Combine style with `negative_prompt` for best results (e.g., style `"anime"` + negative `"photorealistic, 3d render"`)
- Not all models support all styles equally. FLUX and SeedDream models produce the most consistent style results.
- Use `seed` to compare styles fairly -- same seed + same prompt ensures only the style changes.
:::

---

## Performance Tips

Optimize your image generation workflow for speed, cost, and quality.

### Choose the Right Model for Your Use Case

| Use Case | Recommended Model | Why |
|----------|-------------------|-----|
| Quick prototypes & drafts | `imagen-3-fast` or `flux-2-klein-4b` | Sub-2s generation, 1 credit |
| Production web assets | `seedream-5-0-260128` | Best quality/price ratio, 2 credits |
| Print & large-format | `imagen-4-ultra` or `gpt-image-1` | Native 4K, highest detail |
| E-commerce product shots | `grok-imagine-image-pro` | Multi-image combine, virtual try-on |
| Style transfer & editing | `flux-kontext-pro` | Context-aware, preserves composition |
| Batch social media content | `flux-2-klein-4b` | Ultra-fast, 1 credit, good enough for social |
| A/B testing creatives | `seedream-5-0-260128` with `num_images: 4` | 4 variations per request |

### Resolution Strategy

::: warning Token-Based Models Scale with Resolution
For BytePlus SeedDream models, cost scales linearly with pixel count. A 4K image (4096x4096) costs **16x more** than a 1K image (1024x1024). Generate at the lowest resolution that meets your needs, then upscale if required.
:::

**Cost-effective resolution workflow:**
1. **Draft at 1024x1024** -- validate composition and style (4,096 tokens, ~$0.0123)
2. **Refine at 2048x2048** -- check details before committing (16,384 tokens, ~$0.0492)
3. **Final at 4096x4096** -- only for approved compositions (65,536 tokens, ~$0.1966)

For credit-based models (Imagen, DALL-E, FLUX), resolution does not affect price -- always generate at maximum supported resolution.

### Speed Optimization

1. **Use `aspect_ratio` instead of `width`/`height`** -- the API picks optimal dimensions for each model, avoiding unnecessary upsampling.
2. **Parallel requests** -- send multiple requests concurrently rather than waiting sequentially. Respect your plan's rate limit.
3. **Prefer fast models for iteration** -- use `imagen-3-fast` or `flux-2-klein-4b` during prompt development, switch to premium models for final output.
4. **Set `seed` for reproducibility** -- when iterating on a prompt, a fixed seed lets you see only the effect of prompt changes.

### Cost Optimization

| Strategy | Savings |
|----------|---------|
| Use `seedream-5-0-260128` instead of `gpt-image-1` for standard quality | ~80% cheaper |
| Generate 1K then upscale (edit endpoint) vs native 4K on token models | ~75% cheaper |
| Use `flux-2-klein-4b` for non-critical assets | 1 credit vs 2-5 credits |
| Batch with `num_images: 4` (one network round-trip) | Faster, same credits |
| Use `aspect_ratio` preset (avoids wasted pixels from wrong dimensions) | Variable |

### Prompt Engineering Best Practices

1. **Be specific** -- "golden hour light casting long shadows on wet cobblestone street" beats "nice street"
2. **Front-load important details** -- models pay more attention to the beginning of prompts
3. **Include technical terms** -- "bokeh", "f/1.4", "ISO 100", "volumetric fog" help photorealistic models
4. **Use negative prompts** -- explicitly exclude unwanted elements: `"blurry, watermark, text, distorted hands"`
5. **Iterate with seeds** -- find a good seed, then refine the prompt while keeping the seed fixed

### Rate Limits by Plan

| Plan | Requests/min | Images/min (with num_images: 4) | Monthly Credits |
|------|:------------:|:-------------------------------:|:---------------:|
| Free | 10 | 40 | 50 |
| Developer | 60 | 240 | 500 |
| Startup | 300 | 1,200 | 5,000 |
| Business | 1,000 | 4,000 | 25,000 |
| Enterprise | 5,000 | 20,000 | Unlimited |

::: tip Handling Rate Limits
When you receive a `429` response, check the `Retry-After` header for the number of seconds to wait. Implement exponential backoff in production applications. Consider upgrading your plan if you consistently hit limits.
:::

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `invalid_model` | The specified model does not exist or is not available for image generation. |
| 400 | `invalid_dimensions` | Width or height is out of range (256–4096) or not divisible by 64. |
| 400 | `invalid_prompt` | Prompt is empty, exceeds maximum length (4096 chars), or contains blocked content. |
| 401 | `unauthorized` | Missing or invalid API key. Ensure the Authorization header uses format: `Bearer fh_live_*` |
| 402 | `insufficient_credits` | Account does not have enough credits. Purchase more or upgrade your plan. |
| 429 | `rate_limit_exceeded` | Too many requests. Default: 20 req/min for image generation. Check `Retry-After` header. |
| 500 | `generation_failed` | Upstream provider error. No credits are charged on failure. |

### Error Response Example

```json
{
  "error": {
    "code": "insufficient_credits",
    "message": "Insufficient credits. Required: 3, available: 1. Please top up your account.",
    "status": 402,
    "details": {
      "required_credits": 3,
      "available_credits": 1,
      "model": "imagen-4-standard"
    }
  }
}
```

::: tip No Charge on Failure
If a generation fails due to a provider error (500), your credits are **not** deducted. You will only be charged for successful generations that return image URLs.
:::
