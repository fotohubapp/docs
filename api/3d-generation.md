# 3D Generation

Generate 3D models from images or text prompts using FOTOhub's unified API. Convert product photos to 3D assets, create 3D models from descriptions, and export in industry-standard formats.

## Endpoint

```
POST /v1/ai/generate/3d
```

## Available Models

| Model | Name | Credits | Speed | Modes | Quality |
|-------|------|---------|-------|-------|---------|
| `triposr` | FH Lite 3D | 5 | ~3s | image-to-3d | ★★★ |
| `sf3d` | FH Fast 3D | 5 | <1s | image-to-3d | ★★★★ |
| `shap-e` | FH Text 3D | 10 | ~15s | text-to-3d | ★★ |
| `trellis` | FH HD 3D | 15 | ~15s | image-to-3d | ★★★★★ |
| `hunyuan3d` | FH Pro 3D | 25 | ~30s | both | ★★★★★ |

## Output Formats

| Format | Extension | Use Case |
|--------|-----------|----------|
| `glb` | .glb | Web viewers, AR, game engines (default) |
| `obj` | .obj | 3D editing software, CAD |
| `stl` | .stl | 3D printing |
| `usdz` | .usdz | Apple AR Quick Look, iOS |

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mode` | string | Yes | `"image-to-3d"` or `"text-to-3d"` |
| `model` | string | Yes | Model ID from the table above |
| `image_base64` | string | Conditional | Base64-encoded image (required for `image-to-3d`) |
| `prompt` | string | Conditional | Text description (required for `text-to-3d`) |
| `quality` | string | No | `"draft"`, `"standard"` (default), or `"high"` |
| `format` | string | No | Output format: `"glb"` (default), `"obj"`, `"stl"`, `"usdz"` |
| `options` | object | No | Additional generation options |

### Options Object

| Field | Type | Description |
|-------|------|-------------|
| `texture` | boolean | Generate textures (default: true) |
| `pbr` | boolean | Generate PBR materials (hunyuan3d only) |
| `simplify` | boolean | Reduce polygon count |
| `target_polys` | integer | Target polygon count when simplify is true |

## Response

```json
{
  "id": "3d_gen_8f3k2j1m4n5p",
  "url": "https://s3point.fotohub.app/3d/3d_gen_8f3k2j1m4n5p.glb",
  "format": "glb",
  "model": "triposr",
  "status": "completed",
  "thumbnail_url": "https://s3point.fotohub.app/3d/3d_gen_8f3k2j1m4n5p_thumb.png",
  "poly_count": 45000,
  "file_size": 2457600,
  "billing": {
    "credits_used": 5,
    "credits_remaining": 495
  }
}
```

### Status Values

| Status | Description |
|--------|-------------|
| `queued` | Job is in the queue |
| `processing` | Generation is in progress |
| `completed` | 3D model is ready for download |
| `failed` | Generation failed (check error field) |

## Examples

### Image to 3D (Python)

```python
from fotohub import FotoHub
import base64

client = FotoHub(api_key="fh_live_your_key")

# Encode your product photo
with open("product.jpg", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

# Generate 3D model
result = client.generate_3d(
    mode="image-to-3d",
    model="triposr",
    image=image_b64,
    format="glb",
)

print(f"3D Model: {result['url']}")
print(f"Credits used: {result['billing']['credits_used']}")
```

### Text to 3D (TypeScript)

```typescript
import { FotoHubClient } from "fotohub";
import { readFileSync } from "fs";

const client = new FotoHubClient({ apiKey: "fh_live_your_key" });

// Generate from text prompt
const result = await client.generate3D({
  mode: "text-to-3d",
  model: "shap-e",
  prompt: "A medieval stone castle with towers",
  quality: "high",
  format: "glb",
});

console.log(`3D Model URL: ${result.url}`);
```

### Image to 3D with polling (TypeScript)

```typescript
// For models that take longer, use waitFor3D
const gen = await client.generate3D({
  mode: "image-to-3d",
  model: "trellis",
  image: imageBase64,
  format: "glb",
  options: { pbr: true },
});

const completed = await client.waitFor3D(gen.id, {
  pollInterval: 3000,
  onProgress: (r) => console.log(`Status: ${r.status}`),
});

console.log(`Download: ${completed.url}`);
```

### cURL

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "image-to-3d",
    "model": "triposr",
    "image_base64": "'$(base64 -w0 product.jpg)'",
    "format": "glb",
    "quality": "standard"
  }'
```

### PHP

```php
use FotoHub\Client;

$client = new Client('fh_live_your_key');

$result = $client->generate3D([
    'mode' => 'image-to-3d',
    'model' => 'triposr',
    'image_base64' => base64_encode(file_get_contents('product.jpg')),
    'format' => 'glb',
]);

echo "3D Model: " . $result['url'];
```

## Check Job Status

For longer-running models, poll the status endpoint:

```
GET /v1/ai/generate/3d/{job_id}
```

```bash
curl https://apis.fotohub.app/v1/ai/generate/3d/3d_gen_8f3k2j1m4n5p \
  -H "Authorization: Bearer fh_live_your_key"
```

## List Available Models

```
GET /v1/ai/generate/3d/models
```

Returns all 3D models with current availability, pricing, and capabilities.

## Best Practices

- **Image quality matters**: For image-to-3d, use clean product photos with a solid or simple background for best results. Remove background first using the [Image Editing](/api/image-editing) endpoint.
- **Choose the right model**: Use `triposr` for quick previews (5 credits, 3s), `trellis` or `hunyuan3d` for production assets.
- **Format selection**: Use GLB for web/AR, STL for 3D printing, USDZ for iOS AR Quick Look.
- **Polling**: Models like `trellis` and `hunyuan3d` take 15-30s. Use the `waitFor3D` SDK method or poll `/v1/ai/generate/3d/{id}` every 3 seconds.

## Pricing

| Model | Credits per Generation |
|-------|----------------------|
| FH Lite 3D (triposr) | 5 |
| FH Fast 3D (sf3d) | 5 |
| FH Text 3D (shap-e) | 10 |
| FH HD 3D (trellis) | 15 |
| FH Pro 3D (hunyuan3d) | 25 |

See [Billing & Pricing](/api/billing) for credit package details and tier information.
