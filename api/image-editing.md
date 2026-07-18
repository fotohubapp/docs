# Image Editing

The Image Editing endpoint provides AI-powered image manipulation including inpainting, outpainting, background replacement, object removal, and upscaling. All operations use a single endpoint with the `mode` parameter to select the editing operation.

Powered by Google Imagen 3 for photorealistic results. All edit modes cost a fixed **2 credits** per operation, regardless of image size or complexity.

## Endpoint

```
POST /v1/ai/edit/image
```

**Authentication:** Bearer token (API key)  
**Billing:** 2 credits (0.24 PLN) per request

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | Yes | — | URL of the source image to edit. Must be publicly accessible or a FOTOhub Storage URL. Supports JPEG, PNG, and WebP formats. Maximum 20MB, recommended 4096x4096 or smaller. |
| `prompt` | string | Yes | — | Natural language instruction describing the desired edit. Be specific and descriptive for best results. For inpaint/bgswap, describe what should appear. For remove, describe the object to remove. |
| `mode` | string | No | `inpaint` | Editing operation to perform. One of: `inpaint`, `outpaint`, `bgswap`, `remove`, `upscale`. |
| `mask_url` | string | No | — | URL of the mask image for inpainting. Must be same dimensions as source image. White pixels (255) indicate areas to edit, black pixels (0) indicate areas to preserve. Required for `inpaint` mode, ignored for other modes. |
| `model` | string | No | `imagen-3-capability` | Editing model to use. Currently only `imagen-3-capability` is available. Future models will be added as they become available. |
| `output_format` | string | No | `png` | Output image format. One of: `png`, `jpeg`, `webp`. PNG preserves transparency, JPEG is smaller, WebP offers best compression. |
| `num_outputs` | integer | No | `1` | Number of output variations to generate (1-4). Each variation uses the same prompt but produces different results. Cost is per-request regardless of num_outputs. |

## Edit Modes

### Inpaint — Fill Masked Area

Replaces the white-masked area of the image with AI-generated content matching your prompt. The surrounding context is preserved exactly. Ideal for replacing objects, adding elements, or filling in damaged areas of a photo.

- **Requires:** `mask_url` — white pixels mark edit areas, black pixels are preserved.
- **Prompt:** Describe what should appear in the masked area (e.g., "a red sports car" not "replace the van with a car").
- **Tips:** Use soft mask edges (feathered) for more natural blending. Mask should be slightly larger than the area to edit.

### Outpaint — Extend Image Beyond Boundaries

Expands the image beyond its original boundaries, generating new content that seamlessly continues the scene. The AI analyzes existing composition, lighting, and style to produce coherent extensions.

- **Prompt:** Describe what the extended area should contain (e.g., "continuation of the beach with palm trees and sunset sky").
- **Tips:** Works best when extending by 25-50% of original dimensions. Provide context about the scene for better coherence.

### Background Swap — Replace Background

Automatically detects and segments the foreground subject, then replaces the background with AI-generated content matching your prompt. No mask needed — subject detection is automatic.

- **Prompt:** Describe only the new background (e.g., "professional studio with soft gradient lighting").
- **Tips:** Works best with clear subject/background separation. Complex hair and transparent objects are handled well by Imagen 3.

### Remove — Remove Object

Removes a specified object from the image and fills the area with contextually appropriate content. No mask needed — the AI identifies the object from your prompt description and removes it cleanly.

- **Prompt:** Describe the object to remove (e.g., "the person standing on the left", "the watermark in the corner").
- **Tips:** Be specific if multiple similar objects exist. Works best for objects that occupy less than 30% of the image.

### Upscale — AI Upscale and Enhancement

Upscales the image by 2x or 4x using AI-powered super-resolution. Unlike simple interpolation, this adds realistic detail, sharpens textures, and reduces noise while preserving the original character of the image.

- **Prompt:** Optional style guidance (e.g., "sharp, detailed, photorealistic" or "anime-style upscale with clean lines").
- **Tips:** Input images of 512x512+ produce the best results. Very small inputs (<256px) may produce artifacts.

## Response Format

```json
{
  "mode": "inpaint",
  "model": "imagen-3-capability",
  "credits_used": 2,
  "billing": {
    "method": "credits",
    "credits_used": 2,
    "pln_charged": 0.24
  },
  "images": [
    "https://s1.fotohub.app/storage/v1/object/public/generations/edit-abc123-0.png"
  ],
  "metadata": {
    "input_size": "1024x1024",
    "output_size": "1024x1024",
    "processing_time_ms": 4250
  }
}
```

| Field | Description |
|-------|-------------|
| `mode` | The editing mode that was used |
| `model` | The model that processed the request |
| `credits_used` | Number of credits consumed (always 2) |
| `billing.method` | Billing method used (`credits`) |
| `billing.pln_charged` | PLN amount charged |
| `images` | Array of output image URLs (1-4 depending on `num_outputs`) |
| `metadata.input_size` | Dimensions of the input image |
| `metadata.output_size` | Dimensions of the output image |
| `metadata.processing_time_ms` | Server-side processing time in milliseconds |

## Code Examples

### Inpaint — Replace Masked Area

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ai/edit/image"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}

response = requests.post(url, json={
    "image_url": "https://example.com/photo.jpg",
    "mask_url": "https://example.com/mask.png",
    "prompt": "A fluffy golden retriever sitting on the grass",
    "mode": "inpaint"
}, headers=headers)

data = response.json()
print(f"Edited image: {data['images'][0]}")
print(f"Credits used: {data['credits_used']}")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/edit/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    image_url: "https://example.com/photo.jpg",
    mask_url: "https://example.com/mask.png",
    prompt: "A fluffy golden retriever sitting on the grass",
    mode: "inpaint",
  }),
});

const data = await response.json();
console.log(`Edited image: ${data.images[0]}`);
console.log(`Credits used: ${data.credits_used}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/edit/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/photo.jpg",
    "mask_url": "https://example.com/mask.png",
    "prompt": "A fluffy golden retriever sitting on the grass",
    "mode": "inpaint"
  }'
```

:::

### Background Swap

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ai/edit/image"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}

# Replace background — subject is detected automatically
response = requests.post(url, json={
    "image_url": "https://example.com/portrait.jpg",
    "prompt": "Modern minimalist office with large windows, soft natural light, blurred bokeh background",
    "mode": "bgswap",
    "num_outputs": 3  # Generate 3 variations
}, headers=headers)

data = response.json()
for i, img_url in enumerate(data["images"]):
    print(f"Variation {i+1}: {img_url}")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/edit/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    image_url: "https://example.com/portrait.jpg",
    prompt: "Modern minimalist office with large windows, soft natural light, blurred bokeh background",
    mode: "bgswap",
    num_outputs: 3,
  }),
});

const data = await response.json();
data.images.forEach((url: string, i: number) => {
  console.log(`Variation ${i + 1}: ${url}`);
});
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/edit/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/portrait.jpg",
    "prompt": "Modern minimalist office with large windows and soft natural light",
    "mode": "bgswap",
    "num_outputs": 3
  }'
```

:::

### Remove Object

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ai/edit/image"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}

# Remove an unwanted object — no mask needed
response = requests.post(url, json={
    "image_url": "https://example.com/landscape.jpg",
    "prompt": "the power lines and telephone poles in the sky",
    "mode": "remove"
}, headers=headers)

data = response.json()
print(f"Clean image: {data['images'][0]}")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/edit/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    image_url: "https://example.com/landscape.jpg",
    prompt: "the power lines and telephone poles in the sky",
    mode: "remove",
  }),
});

const data = await response.json();
console.log(`Clean image: ${data.images[0]}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/edit/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/landscape.jpg",
    "prompt": "the power lines and telephone poles in the sky",
    "mode": "remove"
  }'
```

:::

### Upscale Image

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ai/edit/image"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}

# AI upscale with enhancement
response = requests.post(url, json={
    "image_url": "https://example.com/low-res-photo.jpg",
    "prompt": "sharp, detailed, photorealistic, high resolution",
    "mode": "upscale",
    "output_format": "png"
}, headers=headers)

data = response.json()
print(f"Upscaled: {data['images'][0]}")
print(f"Output size: {data['metadata']['output_size']}")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/edit/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    image_url: "https://example.com/low-res-photo.jpg",
    prompt: "sharp, detailed, photorealistic, high resolution",
    mode: "upscale",
    output_format: "png",
  }),
});

const data = await response.json();
console.log(`Upscaled: ${data.images[0]}`);
console.log(`Output size: ${data.metadata.output_size}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/edit/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/low-res-photo.jpg",
    "prompt": "sharp, detailed, photorealistic, high resolution",
    "mode": "upscale",
    "output_format": "png"
  }'
```

:::

## Pricing

| Detail | Value |
|--------|-------|
| Cost per request | 2 credits (0.24 PLN) |
| Multiple outputs | Same cost regardless of `num_outputs` (1-4) |
| All modes | Same flat price |
| Batch discount | None — flat rate per request |

All image editing operations cost a flat **2 credits** per request, regardless of image size, complexity, or number of output variations. This makes cost estimation straightforward for batch processing.

## Mask Creation Tips

When using `inpaint` mode, you must provide a mask image. Here are best practices for creating effective masks:

1. **Dimensions must match** — The mask must be exactly the same pixel dimensions as the source image.
2. **White = edit, Black = preserve** — White pixels (RGB 255,255,255) mark areas to be edited. Black pixels (RGB 0,0,0) mark areas to keep unchanged.
3. **Use feathered edges** — Soft, feathered mask edges produce more natural blending between edited and preserved areas. A 5-10 pixel feather works well for most cases.
4. **Slightly oversized masks** — Make the mask area slightly larger than the object you want to replace. This gives the AI more room to blend naturally.
5. **Binary or grayscale** — Grayscale values between 0-255 act as partial transparency for the edit. Use this for subtle transitions.
6. **Format** — PNG is recommended for masks to avoid JPEG compression artifacts that could introduce gray values unintentionally.

## Error Responses

### 400 — Missing Mask for Inpaint

```json
{
  "error": {
    "type": "invalid_request",
    "message": "mask_url is required when mode is 'inpaint'",
    "code": "missing_mask"
  }
}
```

### 422 — Invalid Image URL

```json
{
  "error": {
    "type": "validation_error",
    "message": "Could not fetch image from provided URL. Ensure the URL is publicly accessible and returns a valid image.",
    "code": "invalid_image_url"
  }
}
```

### 402 — Insufficient Credits

```json
{
  "error": {
    "type": "billing_error",
    "message": "Insufficient credits. This operation requires 2 credits. Current balance: 0.",
    "code": "insufficient_credits"
  }
}
```

### 413 — Image Too Large

```json
{
  "error": {
    "type": "validation_error",
    "message": "Image exceeds maximum size of 20MB.",
    "code": "image_too_large"
  }
}
```

## Limits and Constraints

- Maximum input image size: **20MB**
- Maximum input dimensions: **4096x4096 pixels**
- Mask must match source image dimensions exactly
- Supported formats: JPEG, PNG, WebP (input and output)
- Output images are stored for **24 hours**, then automatically deleted
- Maximum 4 output variations per request
- Rate limit: 30 requests per minute per API key
