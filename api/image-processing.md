# Advanced Image Processing

Professional-grade image processing pipeline powered by state-of-the-art AI models. Color grade like a Hollywood colorist, restore degraded photos, generate depth maps, and tag images with semantic understanding — all through a single unified API.

All endpoints accept image URLs and return processed image URLs. Results are stored for 24 hours.

## Endpoints

| Endpoint | Description | Credits |
|----------|-------------|---------|
| `POST /v1/images/color-grade` | Professional color grading with presets or manual controls | 1 |
| `POST /v1/images/enhance` | AI auto-enhancement (exposure, sharpness, color balance) | 1 |
| `POST /v1/images/denoise` | AI noise reduction preserving detail | 1 |
| `POST /v1/images/colorize` | Colorize black & white images | 2 |
| `POST /v1/images/face-restore` | Restore degraded faces (CodeFormer/GFPGAN) | 2 |
| `POST /v1/images/depth-map` | Monocular depth estimation | 2 |
| `POST /v1/images/clip-tag` | AI auto-tagging with CLIP | 1 |
| `POST /v1/images/clip-embed` | Generate CLIP vector embeddings | 1 |
| `POST /v1/images/batch` | Batch process multiple images | 1 per image |

**Authentication:** Bearer token (API key)  
**Base URL:** `https://apis.fotohub.app`

---

## Color Grading

```
POST /v1/images/color-grade
```

Apply professional color grading to any image. Choose from cinematic presets used in film production, or dial in precise manual adjustments for temperature, tint, saturation, contrast, shadows, and highlights.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | **Yes** | — | URL of the image to process. Must be publicly accessible. Supports JPEG, PNG, WebP. Max 50MB. |
| `preset` | string | No | — | Color grading preset. Options: `cinematic`, `warm`, `cool`, `vintage`, `noir`, `teal-orange`, `pastel`. Overrides manual controls when set. |
| `temperature` | float | No | `0.0` | Color temperature adjustment. Range: -1.0 (cool/blue) to 1.0 (warm/amber). |
| `tint` | float | No | `0.0` | Green-magenta tint shift. Range: -1.0 (green) to 1.0 (magenta). |
| `saturation` | float | No | `0.0` | Saturation adjustment. Range: -1.0 (desaturated) to 1.0 (vivid). |
| `contrast` | float | No | `0.0` | Contrast adjustment. Range: -1.0 (flat) to 1.0 (punchy). |
| `shadows` | float | No | `0.0` | Shadow level adjustment. Range: -1.0 (crushed blacks) to 1.0 (lifted shadows). |
| `highlights` | float | No | `0.0` | Highlight level adjustment. Range: -1.0 (pulled highlights) to 1.0 (bright highlights). |
| `intensity` | float | No | `1.0` | Blend intensity of the grade. Range: 0.0 (no effect) to 1.0 (full effect). Useful for subtle grades. |
| `output_format` | string | No | `jpg` | Output format: `jpg`, `png`, `webp`. |

::: tip Preset Reference
| Preset | Look | Best For |
|--------|------|----------|
| `cinematic` | Teal shadows, warm highlights, crushed blacks | Film-like scenes, landscapes |
| `warm` | Golden tones, lifted shadows | Portraits, golden hour |
| `cool` | Blue tones, high contrast | Tech, winter, moody |
| `vintage` | Faded blacks, warm midtones, grain | Retro, nostalgia |
| `noir` | Desaturated, high contrast, dark | Drama, B&W film look |
| `teal-orange` | Complementary teal/orange split | Blockbuster cinema |
| `pastel` | Low saturation, soft tones | Fashion, editorial |
:::

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/photos/processed/cg_a1b2c3d4.jpg",
  "credits_used": 1,
  "billing": {
    "method": "credits",
    "credits_used": 1,
    "pln_charged": 0.12
  },
  "applied": {
    "preset": "cinematic",
    "intensity": 1.0
  },
  "processing_time_ms": 890
}
```

### Code Examples

::: code-group

```python [Python SDK]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Using a preset
result = client.images.color_grade(
    image_url="https://example.com/photo.jpg",
    preset="cinematic"
)

# Manual controls
result = client.images.color_grade(
    image_url="https://example.com/photo.jpg",
    temperature=0.3,
    contrast=0.2,
    shadows=0.1,
    highlights=-0.1,
    saturation=0.15,
    intensity=0.8
)

print(result.output_url)
```

```typescript [TypeScript SDK]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Using a preset
const result = await client.images.colorGrade({
  imageUrl: "https://example.com/photo.jpg",
  preset: "teal-orange",
});

// Manual controls
const result = await client.images.colorGrade({
  imageUrl: "https://example.com/photo.jpg",
  temperature: 0.3,
  contrast: 0.2,
  shadows: 0.1,
  highlights: -0.1,
  saturation: 0.15,
  intensity: 0.8,
});

console.log(result.outputUrl);
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/images/color-grade \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/photo.jpg",
    "preset": "cinematic",
    "intensity": 0.8
  }'
```

:::

---

## AI Enhancement

```
POST /v1/images/enhance
```

Automatic AI-powered enhancement that intelligently adjusts exposure, white balance, sharpness, color vibrancy, and dynamic range. Choose a scene-specific mode for optimized results.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | **Yes** | — | URL of the image to process. Must be publicly accessible. Supports JPEG, PNG, WebP. Max 50MB. |
| `mode` | string | No | `auto` | Enhancement mode. Options: `auto`, `portrait`, `landscape`, `product`, `food`. |
| `strength` | float | No | `0.7` | Enhancement strength. Range: 0.0 (subtle) to 1.0 (maximum). |
| `sharpen` | boolean | No | `true` | Apply intelligent sharpening after enhancement. |
| `output_format` | string | No | `jpg` | Output format: `jpg`, `png`, `webp`. |

::: info Enhancement Modes
- **auto** — Analyzes content and applies balanced adjustments.
- **portrait** — Optimizes skin tones, softens background, balances lighting on faces.
- **landscape** — Boosts sky blues, enhances greens, increases clarity.
- **product** — Neutral white balance, removes color casts, clean look.
- **food** — Warm tones, vibrant colors, appetizing appearance.
:::

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/photos/processed/enh_b2c3d4e5.jpg",
  "credits_used": 1,
  "billing": {
    "method": "credits",
    "credits_used": 1,
    "pln_charged": 0.12
  },
  "adjustments_applied": {
    "exposure": 0.15,
    "white_balance": "corrected",
    "sharpness": 0.3,
    "vibrance": 0.2,
    "dynamic_range": "expanded"
  },
  "processing_time_ms": 1240
}
```

### Code Examples

::: code-group

```python [Python SDK]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.images.enhance(
    image_url="https://example.com/portrait.jpg",
    mode="portrait",
    strength=0.8
)

print(result.output_url)
```

```typescript [TypeScript SDK]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.images.enhance({
  imageUrl: "https://example.com/portrait.jpg",
  mode: "portrait",
  strength: 0.8,
});

console.log(result.outputUrl);
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/images/enhance \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/portrait.jpg",
    "mode": "portrait",
    "strength": 0.8
  }'
```

:::

---

## AI Denoising

```
POST /v1/images/denoise
```

Advanced AI noise reduction that removes grain, compression artifacts, and sensor noise while preserving fine details and textures. Ideal for low-light photos, high-ISO images, and heavily compressed files.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | **Yes** | — | URL of the image to process. Must be publicly accessible. Supports JPEG, PNG, WebP. Max 50MB. |
| `strength` | float | No | `0.5` | Denoising strength. Range: 0.0 (light) to 1.0 (aggressive). Higher values remove more noise but may soften fine details. |
| `preserve_detail` | boolean | No | `true` | When true, uses detail-aware denoising that protects edges and textures. |
| `output_format` | string | No | `jpg` | Output format: `jpg`, `png`, `webp`. |

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/photos/processed/dn_c3d4e5f6.jpg",
  "credits_used": 1,
  "billing": {
    "method": "credits",
    "credits_used": 1,
    "pln_charged": 0.12
  },
  "noise_level_detected": "high",
  "processing_time_ms": 1680
}
```

### Code Examples

::: code-group

```python [Python SDK]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.images.denoise(
    image_url="https://example.com/noisy-photo.jpg",
    strength=0.7,
    preserve_detail=True
)

print(result.output_url)
```

```typescript [TypeScript SDK]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.images.denoise({
  imageUrl: "https://example.com/noisy-photo.jpg",
  strength: 0.7,
  preserveDetail: true,
});

console.log(result.outputUrl);
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/images/denoise \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/noisy-photo.jpg",
    "strength": 0.7,
    "preserve_detail": true
  }'
```

:::

---

## Colorize B&W Images

```
POST /v1/images/colorize
```

Automatically colorize black and white or grayscale images using deep learning. The model understands scene context, common object colors, and historical color palettes to produce natural, realistic colorization.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | **Yes** | — | URL of the B&W or grayscale image. Must be publicly accessible. Supports JPEG, PNG, WebP. Max 50MB. |
| `saturation` | float | No | `1.0` | Output saturation multiplier. Range: 0.5 (muted) to 2.0 (vivid). Default produces natural colors. |
| `artistic` | boolean | No | `false` | When true, allows more creative/stylized colorization rather than strictly realistic. |
| `output_format` | string | No | `jpg` | Output format: `jpg`, `png`, `webp`. |

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/photos/processed/col_d4e5f6g7.jpg",
  "credits_used": 2,
  "billing": {
    "method": "credits",
    "credits_used": 2,
    "pln_charged": 0.24
  },
  "processing_time_ms": 3450
}
```

### Code Examples

::: code-group

```python [Python SDK]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.images.colorize(
    image_url="https://example.com/old-bw-photo.jpg",
    saturation=1.2
)

print(result.output_url)
```

```typescript [TypeScript SDK]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.images.colorize({
  imageUrl: "https://example.com/old-bw-photo.jpg",
  saturation: 1.2,
});

console.log(result.outputUrl);
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/images/colorize \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/old-bw-photo.jpg",
    "saturation": 1.2
  }'
```

:::

---

## Face Restoration

```
POST /v1/images/face-restore
```

Restore degraded, blurry, or low-resolution faces using state-of-the-art face restoration models. Recovers facial details, fixes artifacts, and produces sharp, natural-looking faces from heavily degraded inputs.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | **Yes** | — | URL of the image with degraded faces. Must be publicly accessible. Supports JPEG, PNG, WebP. Max 50MB. |
| `model` | string | No | `codeformer` | Restoration model. Options: `codeformer` (best quality, slower), `gfpgan` (faster, good quality). |
| `fidelity` | float | No | `0.7` | Balance between quality and fidelity to original. Range: 0.0 (max quality, less faithful) to 1.0 (max fidelity, less enhancement). Only applies to CodeFormer. |
| `upscale` | integer | No | `1` | Upscale factor for the output. Options: `1` (original size), `2` (2x), `4` (4x). |
| `background_enhance` | boolean | No | `false` | When true, also enhances the non-face regions of the image. |
| `output_format` | string | No | `jpg` | Output format: `jpg`, `png`, `webp`. |

::: info Model Comparison
| Model | Quality | Speed | Best For |
|-------|---------|-------|----------|
| `codeformer` | Excellent | ~3s per face | Severely degraded faces, old photos, heavy compression |
| `gfpgan` | Good | ~1.5s per face | Light degradation, batch processing, real-time apps |
:::

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/photos/processed/fr_e5f6g7h8.jpg",
  "credits_used": 2,
  "billing": {
    "method": "credits",
    "credits_used": 2,
    "pln_charged": 0.24
  },
  "faces_detected": 3,
  "faces_restored": 3,
  "model_used": "codeformer",
  "processing_time_ms": 4120
}
```

### Code Examples

::: code-group

```python [Python SDK]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.images.face_restore(
    image_url="https://example.com/old-family-photo.jpg",
    model="codeformer",
    fidelity=0.6,
    upscale=2,
    background_enhance=True
)

print(f"Restored {result.faces_restored} faces")
print(result.output_url)
```

```typescript [TypeScript SDK]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.images.faceRestore({
  imageUrl: "https://example.com/old-family-photo.jpg",
  model: "codeformer",
  fidelity: 0.6,
  upscale: 2,
  backgroundEnhance: true,
});

console.log(`Restored ${result.facesRestored} faces`);
console.log(result.outputUrl);
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/images/face-restore \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/old-family-photo.jpg",
    "model": "codeformer",
    "fidelity": 0.6,
    "upscale": 2,
    "background_enhance": true
  }'
```

:::

---

## Depth Map Estimation

```
POST /v1/images/depth-map
```

Generate monocular depth maps from single images using state-of-the-art depth estimation models. Outputs a grayscale depth image where brightness represents distance from the camera. Useful for 3D effects, parallax, bokeh simulation, and scene understanding.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | **Yes** | — | URL of the image to process. Must be publicly accessible. Supports JPEG, PNG, WebP. Max 50MB. |
| `model` | string | No | `midas` | Depth estimation model. Options: `midas` (general-purpose, outdoor/indoor), `zoedepth` (metric depth, best for indoor scenes). |
| `output_type` | string | No | `grayscale` | Output format type. Options: `grayscale` (standard depth map), `colored` (viridis colormap visualization), `raw` (16-bit PNG with metric depth values). |
| `invert` | boolean | No | `false` | Invert depth values (near=dark, far=bright instead of default near=bright, far=dark). |
| `output_format` | string | No | `png` | Output file format: `png`, `webp`. |

::: info Model Comparison
| Model | Type | Accuracy | Best For |
|-------|------|----------|----------|
| `midas` | Relative depth | High | General scenes, outdoor, landscapes, mixed content |
| `zoedepth` | Metric depth | Very High | Indoor scenes, room layout, furniture, architecture |
:::

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/photos/processed/dm_f6g7h8i9.png",
  "credits_used": 2,
  "billing": {
    "method": "credits",
    "credits_used": 2,
    "pln_charged": 0.24
  },
  "model_used": "midas",
  "depth_range": {
    "min": 0.0,
    "max": 1.0
  },
  "processing_time_ms": 2180
}
```

### Code Examples

::: code-group

```python [Python SDK]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# General depth map
result = client.images.depth_map(
    image_url="https://example.com/landscape.jpg",
    model="midas",
    output_type="colored"
)

# Indoor metric depth
result = client.images.depth_map(
    image_url="https://example.com/room.jpg",
    model="zoedepth",
    output_type="raw"
)

print(result.output_url)
```

```typescript [TypeScript SDK]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.images.depthMap({
  imageUrl: "https://example.com/landscape.jpg",
  model: "midas",
  outputType: "colored",
});

console.log(result.outputUrl);
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/images/depth-map \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/landscape.jpg",
    "model": "midas",
    "output_type": "colored"
  }'
```

:::

---

## CLIP Auto-Tagging

```
POST /v1/images/clip-tag
```

Automatically tag images with descriptive labels using OpenAI's CLIP model. Returns ranked tags with confidence scores covering objects, scenes, styles, colors, and activities detected in the image.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | **Yes** | — | URL of the image to tag. Must be publicly accessible. Supports JPEG, PNG, WebP. Max 50MB. |
| `model` | string | No | `clip-vit-large` | CLIP model variant. Options: `clip-vit-large` (more accurate, slower), `clip-vit-base` (faster, slightly less accurate). |
| `max_tags` | integer | No | `20` | Maximum number of tags to return. Range: 1–50. |
| `threshold` | float | No | `0.15` | Minimum confidence threshold for returned tags. Range: 0.0–1.0. Lower values return more tags. |
| `categories` | array | No | all | Filter tags by category. Options: `objects`, `scenes`, `styles`, `colors`, `activities`, `emotions`. |

### Response

```json
{
  "tags": [
    { "label": "sunset", "confidence": 0.94, "category": "scenes" },
    { "label": "beach", "confidence": 0.91, "category": "scenes" },
    { "label": "orange", "confidence": 0.87, "category": "colors" },
    { "label": "silhouette", "confidence": 0.82, "category": "objects" },
    { "label": "romantic", "confidence": 0.76, "category": "emotions" },
    { "label": "photography", "confidence": 0.71, "category": "styles" },
    { "label": "walking", "confidence": 0.68, "category": "activities" }
  ],
  "model_used": "clip-vit-large",
  "credits_used": 1,
  "billing": {
    "method": "credits",
    "credits_used": 1,
    "pln_charged": 0.12
  },
  "processing_time_ms": 520
}
```

### Code Examples

::: code-group

```python [Python SDK]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.images.clip_tag(
    image_url="https://example.com/vacation-photo.jpg",
    max_tags=15,
    threshold=0.2,
    categories=["objects", "scenes", "activities"]
)

for tag in result.tags:
    print(f"{tag.label}: {tag.confidence:.2f}")
```

```typescript [TypeScript SDK]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.images.clipTag({
  imageUrl: "https://example.com/vacation-photo.jpg",
  maxTags: 15,
  threshold: 0.2,
  categories: ["objects", "scenes", "activities"],
});

result.tags.forEach((tag) => {
  console.log(`${tag.label}: ${tag.confidence.toFixed(2)}`);
});
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/images/clip-tag \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/vacation-photo.jpg",
    "max_tags": 15,
    "threshold": 0.2,
    "categories": ["objects", "scenes", "activities"]
  }'
```

:::

---

## CLIP Embeddings

```
POST /v1/images/clip-embed
```

Generate dense vector embeddings from images using CLIP. Returns a 512 or 768-dimensional float vector that captures semantic meaning of the image. Use these embeddings for visual similarity search, content-based recommendations, clustering, deduplication, and content moderation.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | **Yes** | — | URL of the image to embed. Must be publicly accessible. Supports JPEG, PNG, WebP. Max 50MB. |
| `model` | string | No | `clip-vit-large` | CLIP model variant. `clip-vit-large` returns 768-dim vectors. `clip-vit-base` returns 512-dim vectors. |
| `normalize` | boolean | No | `true` | L2-normalize the embedding vector (recommended for cosine similarity search). |

::: tip Use Cases for CLIP Embeddings
- **Visual search** — Find visually similar images in your library by comparing embedding distances.
- **Content moderation** — Compare image embeddings against known violation embeddings.
- **Auto-categorization** — Cluster images by semantic similarity without manual labeling.
- **Deduplication** — Detect near-duplicate images even with crops, filters, or compression differences.
- **Cross-modal search** — Combine with text embeddings (same CLIP space) to search images by text query.
:::

### Response

```json
{
  "embedding": [0.0234, -0.0891, 0.0452, 0.1123, ...],
  "dimensions": 768,
  "model_used": "clip-vit-large",
  "normalized": true,
  "credits_used": 1,
  "billing": {
    "method": "credits",
    "credits_used": 1,
    "pln_charged": 0.12
  },
  "processing_time_ms": 380
}
```

### Code Examples

::: code-group

```python [Python SDK]
from fotohub import FotoHub
import numpy as np

client = FotoHub(api_key="fh_live_your_api_key")

# Generate embedding
result = client.images.clip_embed(
    image_url="https://example.com/product.jpg",
    model="clip-vit-large"
)

embedding = np.array(result.embedding)
print(f"Embedding shape: {embedding.shape}")  # (768,)

# Compare similarity between two images
result_a = client.images.clip_embed(image_url="https://example.com/img_a.jpg")
result_b = client.images.clip_embed(image_url="https://example.com/img_b.jpg")

similarity = np.dot(result_a.embedding, result_b.embedding)
print(f"Cosine similarity: {similarity:.4f}")
```

```typescript [TypeScript SDK]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Generate embedding
const result = await client.images.clipEmbed({
  imageUrl: "https://example.com/product.jpg",
  model: "clip-vit-large",
});

console.log(`Dimensions: ${result.dimensions}`); // 768

// Compare two images
const a = await client.images.clipEmbed({ imageUrl: "https://example.com/img_a.jpg" });
const b = await client.images.clipEmbed({ imageUrl: "https://example.com/img_b.jpg" });

const similarity = a.embedding.reduce(
  (sum, val, i) => sum + val * b.embedding[i], 0
);
console.log(`Cosine similarity: ${similarity.toFixed(4)}`);
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/images/clip-embed \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/product.jpg",
    "model": "clip-vit-large",
    "normalize": true
  }'
```

:::

---

## Batch Processing

```
POST /v1/images/batch
```

Process multiple images in a single request with one or more operations applied in sequence. Supports up to 50 images per batch. Operations are applied as a pipeline — each operation's output feeds into the next.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `images` | array | **Yes** | — | Array of image URLs to process. Max 50 items. Each must be publicly accessible. |
| `operations` | array | **Yes** | — | Ordered list of operations to apply to each image. Operations are applied sequentially as a pipeline. |
| `parallel` | boolean | No | `true` | Process images in parallel (faster) or sequentially (lower resource usage). |
| `output_format` | string | No | `jpg` | Output format for all results: `jpg`, `png`, `webp`. |

### Operation Objects

Each operation in the `operations` array has a `type` and operation-specific parameters:

```json
{
  "type": "enhance",
  "mode": "portrait",
  "strength": 0.8
}
```

Available operation types: `color-grade`, `enhance`, `denoise`, `colorize`, `face-restore`, `depth-map`, `clip-tag`, `clip-embed`.

### Response

```json
{
  "results": [
    {
      "input_url": "https://example.com/photo1.jpg",
      "output_url": "https://s1.fotohub.app/storage/v1/object/public/photos/processed/batch_001.jpg",
      "status": "success",
      "processing_time_ms": 2340
    },
    {
      "input_url": "https://example.com/photo2.jpg",
      "output_url": "https://s1.fotohub.app/storage/v1/object/public/photos/processed/batch_002.jpg",
      "status": "success",
      "processing_time_ms": 2180
    },
    {
      "input_url": "https://example.com/photo3.jpg",
      "output_url": null,
      "status": "error",
      "error": "Image URL returned 404"
    }
  ],
  "summary": {
    "total": 3,
    "succeeded": 2,
    "failed": 1
  },
  "credits_used": 4,
  "billing": {
    "method": "credits",
    "credits_used": 4,
    "pln_charged": 0.48
  },
  "total_processing_time_ms": 4890
}
```

### Code Examples

::: code-group

```python [Python SDK]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Batch enhance + color grade a set of photos
result = client.images.batch(
    images=[
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.jpg",
        "https://example.com/photo3.jpg",
        "https://example.com/photo4.jpg",
    ],
    operations=[
        {"type": "denoise", "strength": 0.5},
        {"type": "enhance", "mode": "portrait", "strength": 0.7},
        {"type": "color-grade", "preset": "cinematic"},
    ]
)

for item in result.results:
    if item.status == "success":
        print(f"Done: {item.output_url}")
    else:
        print(f"Failed: {item.error}")

print(f"Total credits: {result.credits_used}")
```

```typescript [TypeScript SDK]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.images.batch({
  images: [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg",
    "https://example.com/photo3.jpg",
    "https://example.com/photo4.jpg",
  ],
  operations: [
    { type: "denoise", strength: 0.5 },
    { type: "enhance", mode: "portrait", strength: 0.7 },
    { type: "color-grade", preset: "cinematic" },
  ],
});

result.results.forEach((item) => {
  if (item.status === "success") {
    console.log(`Done: ${item.outputUrl}`);
  } else {
    console.log(`Failed: ${item.error}`);
  }
});

console.log(`Total credits: ${result.creditsUsed}`);
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/images/batch \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      "https://example.com/photo1.jpg",
      "https://example.com/photo2.jpg",
      "https://example.com/photo3.jpg"
    ],
    "operations": [
      {"type": "denoise", "strength": 0.5},
      {"type": "enhance", "mode": "portrait", "strength": 0.7},
      {"type": "color-grade", "preset": "cinematic"}
    ]
  }'
```

:::

---

## Pricing

| Operation | Credits | PLN Cost | Description |
|-----------|---------|----------|-------------|
| Color Grade | 1 | 0.12 PLN | Preset or manual color grading |
| Enhance | 1 | 0.12 PLN | AI auto-enhancement |
| Denoise | 1 | 0.12 PLN | AI noise reduction |
| Colorize | 2 | 0.24 PLN | B&W to color |
| Face Restore | 2 | 0.24 PLN | CodeFormer/GFPGAN face restoration |
| Depth Map | 2 | 0.24 PLN | Monocular depth estimation |
| CLIP Tag | 1 | 0.12 PLN | Auto-tagging with confidence scores |
| CLIP Embed | 1 | 0.12 PLN | Vector embedding generation |
| Batch | 1/image | 0.12 PLN/image | Per-image cost, operations do not multiply cost |

::: info Batch Pricing
Batch processing charges **1 credit per image** regardless of how many operations are in the pipeline. A batch of 10 images with 3 operations each costs 10 credits total, not 30.
:::

---

## Best Practices

### Image Quality

- **Input resolution matters** — Higher resolution inputs produce better results for all operations. Minimum recommended: 512x512px.
- **Use appropriate formats** — Submit JPEG for photos, PNG for graphics with transparency. WebP is accepted but JPEG typically produces best results for photographic content.
- **Check file size** — Max 50MB per image. For batch operations, ensure all URLs are accessible and return images (not HTML error pages).

### Color Grading Workflow

- Start with a preset, then adjust `intensity` to blend it down for subtlety.
- For consistent series (wedding albums, product shoots), apply the same preset and manual settings via batch processing.
- Use `temperature` and `tint` for white balance correction before applying creative grades.

### Face Restoration

- Use `codeformer` with `fidelity=0.5` for severely degraded faces (old scanned photos, extreme compression).
- Use `gfpgan` for light touch-ups where speed matters.
- Enable `background_enhance=true` only when the entire image needs restoration, not just faces.
- For group photos, both models handle multiple faces automatically.

### CLIP Embeddings for Search

- Always use `normalize=true` (default) for cosine similarity comparisons.
- Store embeddings in a vector database (pgvector, Pinecone, Qdrant) for efficient similarity search.
- Use `clip-vit-large` (768-dim) for production search systems — the accuracy improvement over `clip-vit-base` (512-dim) is significant.
- Embeddings are deterministic — same image + same model always produces the same vector.

### Batch Processing

- Keep batches under 50 images for optimal throughput.
- Use `parallel=true` (default) for independent images. Use `parallel=false` only if you hit rate limits.
- Order operations logically: denoise first, then enhance, then color grade. Denoising after color grading can remove intended grain.
- Failed images in a batch do not stop processing of remaining images. Always check the `status` field per result.

### Error Handling

- All endpoints return standard HTTP error codes. See [Errors](/api/errors) for the full reference.
- Common errors: `401` (invalid API key), `402` (insufficient credits), `422` (invalid parameters), `413` (image too large).
- Batch operations return per-image errors in the response body even when the HTTP status is 200.
