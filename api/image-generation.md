# Image Generation

FOTOhub provides access to **25+ image generation models** from 7 providers: Google Vertex AI, OpenAI, BytePlus, xAI, Black Forest Labs, MiniMax, and Kling. Generate photorealistic images, illustrations, concept art, and more via a single unified endpoint.

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
| `model` | string | No | `"imagen-4-standard"` | Model identifier. See the full model list below for all 25 options. |
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
    "credits_used": 3,
    "pln_charged": 0.45
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

### Token-Based Response (BytePlus SeedDream Models)

```json
{
  "model": "seedream-5-0-260128",
  "credits_used": 2,
  "billing": {
    "method": "token",
    "credits_used": 2,
    "pln_charged": 0.049,
    "cost_breakdown": {
      "output_tokens": 4096,
      "cost_usd": 0.008192,
      "cost_pln": 0.049152,
      "rate_per_1m_tokens_usd": 2.00
    }
  },
  "usage": {
    "output_tokens": 4096
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

## Token-Based Billing (BytePlus Models)

BytePlus SeedDream models use per-token billing where cost scales with output resolution. Generating a 4K image costs 16x more than a 1K image.

::: warning Cost Scales with Resolution
Unlike credit-based models where a 4K image costs the same as a 1K image, token-based models charge proportionally to pixel count. Always check the estimated cost before generating at high resolutions.
:::

### Token Calculation Formula

```
output_tokens = (width × height) / 256
cost_usd = (output_tokens / 1,000,000) × rate_per_1m_usd
cost_pln = cost_usd × 4.0 (USD→PLN) × 1.5 (margin)
```

### Resolution to Token Examples

| Resolution | Output Tokens | Cost (USD) @ $2/1M | Cost (PLN) |
|-----------|---------------|---------------------|------------|
| 1024 × 1024 | 4,096 | $0.0082 | 0.049 PLN |
| 1536 × 1536 | 9,216 | $0.0184 | 0.111 PLN |
| 2048 × 2048 | 16,384 | $0.0328 | 0.197 PLN |
| 3072 × 3072 | 36,864 | $0.0737 | 0.442 PLN |
| 4096 × 4096 | 65,536 | $0.1311 | 0.786 PLN |

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

| Model ID | Name | Price (PLN) | Credits | Notes |
|----------|------|-------------|---------|-------|
| `imagen-3-fast` | Imagen 3 Fast | 0.12 | 1 | 512px fast |
| `imagen-3-standard` | Imagen 3 Standard | 0.24 | 2 | 1K |
| `imagen-4-fast` | Imagen 4 Fast | 0.18 | 2 | — |
| `imagen-4-standard` | Imagen 4 Standard | 0.45 | 3 | **Recommended** |
| `imagen-4-ultra` | Imagen 4 Ultra | 0.90 | 5 | 4K |

### OpenAI

| Model ID | Name | Price (PLN) | Credits | Notes |
|----------|------|-------------|---------|-------|
| `dall-e-3-standard` | DALL-E 3 Standard | 0.24 | 2 | — |
| `dall-e-3-hd` | DALL-E 3 HD | 0.48 | 4 | — |
| `gpt-image-1` | GPT Image 1 | 0.60 | 4 | **Recommended** |

### BytePlus SeedDream (Token-Based)

| Model ID | Name | ~PLN @1K | Credits | Notes |
|----------|------|----------|---------|-------|
| `seedream-4-0-250828` | SeedDream 4.0 | 0.18 | 2 | token-based |
| `seedream-5-0-260128` | SeedDream 5.0 Lite | 0.21 | 2 | **Recommended**, best value |
| `seedream-4-5-251128` | SeedDream 4.5 | 0.24 | 3 | token-based |
| `dola-seedream-5-0-pro-260628` | SeedDream 5.0 Pro (Dola) | 0.27 | 3 | token-based |
| `seededit-3-0-i2i-250628` | SeedEdit 3.0 (img2img) | 0.24 | 3 | token-based |

### xAI (Grok)

| Model ID | Name | Price (PLN) | Credits | Notes |
|----------|------|-------------|---------|-------|
| `grok-imagine-image` | Grok Imagine | 0.12 | 1 | — |
| `grok-imagine-image-pro` | Grok Imagine Pro | 0.42 | 4 | — |

### Black Forest Labs (FLUX)

| Model ID | Name | Price (PLN) | Credits | Notes |
|----------|------|-------------|---------|-------|
| `flux-2-klein-4b` | FLUX 2 Klein 4B | 0.084 | 1 | ultra-fast |
| `flux-2-pro` | FLUX 2 Pro | 0.18 | 2 | — |
| `flux-1.1-pro` | FLUX 1.1 Pro | 0.24 | 2 | — |
| `flux-kontext-pro` | FLUX Kontext Pro | 0.24 | 2 | — |
| `flux-1.1-pro-ultra` | FLUX 1.1 Pro Ultra | 0.36 | 3 | 4K |
| `flux-2-max` | FLUX 2 Max | 0.42 | 4 | **Recommended** for 4K |
| `flux-kontext-max` | FLUX Kontext Max | 0.48 | 4 | — |

### MiniMax

| Model ID | Name | Price (PLN) | Credits | Notes |
|----------|------|-------------|---------|-------|
| `minimax-image-01` | MiniMax Image 01 | 0.021 | 1 | budget |

### Kling

| Model ID | Name | Price (PLN) | Credits | Notes |
|----------|------|-------------|---------|-------|
| `kling-v2-1` | Kling V2.1 | 0.24 | 2 | — |
| `kling-v3` | Kling V3 | 0.60 | 5 | — |
| `kling-v3-omni` | Kling V3 Omni | 0.90 | 8 | — |

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
print(f"Cost (PLN): {data['billing']['cost_breakdown']['cost_pln']}")
# At 2048x2048: 16,384 tokens → ~0.197 PLN
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
console.log("Cost (PLN):", data.billing.cost_breakdown.cost_pln);
// At 2048x2048: 16,384 tokens → ~0.197 PLN
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
        "model": "flux-2-max",
        "num_images": 4,
        "aspect_ratio": "1:1"
    }
)

data = response.json()
# Credits charged: 4 images x 4 credits = 16 credits total
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
    model: "flux-2-max",
    num_images: 4,
    aspect_ratio: "1:1"
  })
});

const data = await response.json();
// Credits charged: 4 images x 4 credits = 16 credits total
data.images.forEach((url: string, i: number) => {
  console.log(`Variation ${i + 1}: ${url}`);
});
console.log("Total credits:", data.credits_used);
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Minimalist logo design for a tech startup, clean vector style",
    "model": "flux-2-max",
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
        "model": "flux-kontext-max",
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
    model: "flux-kontext-max",
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

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Portrait of a woman in Renaissance style, oil painting, dramatic lighting, rich colors",
    "model": "flux-kontext-max",
    "negative_prompt": "blurry, low quality, distorted, deformed, watermark, text overlay, cartoon",
    "style": "oil-painting",
    "aspect_ratio": "3:4",
    "seed": 42
  }'
```

:::

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
