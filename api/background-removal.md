# Background Removal Pro

AI-powered background removal, replacement, blur, and shadow effects. Uses FOTOhub's deep learning segmentation for pixel-perfect subject isolation with clean edges, even for complex subjects like hair, fur, and transparent objects.

All endpoints accept image URLs and return processed image URLs. Results are stored for 24 hours.

## Endpoints

| Endpoint | Description | Credits |
|----------|-------------|---------|
| `POST /v1/images/remove-background` | Auto remove background | 2 |
| `POST /v1/images/remove-background/advanced` | Remove with click points and edge controls | 4 |
| `POST /v1/images/replace-background` | Remove + replace with color/gradient/image/prompt | 4 |
| `POST /v1/images/blur-background` | Keep subject, blur background (bokeh) | 2 |
| `POST /v1/images/add-shadow` | Add shadow to transparent PNG | 2 |

**Authentication:** Bearer token (API key)  
**Base URL:** `https://apis.fotohub.app`

---

## Remove Background

```
POST /v1/images/remove-background
```

Automatically detects and segments the main subject, removing the background and returning a transparent PNG. No manual input needed — fully automatic one-click operation.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | Yes | — | URL of the image to process. Must be publicly accessible. Supports JPEG, PNG, WebP. Max 50MB. |
| `output_format` | string | No | `png` | Output format: `png` (with transparency), `webp` (smaller file size with transparency). |

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/photos/gpu-outputs/remover/a1b2c3d4e5f6.png",
  "usd_charged": 0.107181,
    "balance_usd": 49.892819,
  "billing": {
    "method": "wallet",
    "usd_charged": 0.107181,
    "balance_usd": 49.892819,
    "usd_charged": 0,
      },
  "size_bytes": 1548290,
  "processing_time_ms": 2340
}
```

::: info Reading the billing block
`method` is `credits` while your plan's monthly allowance covers the request, and
`usd_charged` is `0` because no money moved. Once the allowance is exhausted the
same call returns `"method": "wallet"` with the USD amount in `usd_charged` (see
[Pricing](#pricing)). `pln_charged` is a legacy mirror of the same charge -- read
`usd_charged`.
:::

### Code Examples

::: code-group

```python [Python SDK]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.images.remove_background(
    image_url="https://example.com/photo.jpg"
)

print(f"Transparent image: {result.output_url}")
print(f"Credits used: {result.credits_used}")
```

```typescript [TypeScript SDK]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.images.removeBackground({
  imageUrl: "https://example.com/photo.jpg",
});

console.log(`Transparent image: ${result.outputUrl}`);
console.log(`Credits used: ${result.creditsUsed}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/images/remove-background" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/photo.jpg"
  }'
```

:::

---

## Remove Background (Advanced)

```
POST /v1/images/remove-background/advanced
```

Fine-grained background removal with click points for subject hints and edge processing controls. Use when automatic detection needs guidance (multiple subjects, complex scenes, or specific selection needed).

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | Yes | — | URL of the image to process. Must be publicly accessible. Max 50MB. |
| `points` | array | No | `[]` | Click points to guide segmentation. Each point has `x` (0-1), `y` (0-1), and `label` (1=foreground, 0=background). |
| `feather` | integer | No | `2` | Edge feathering radius in pixels (0-20). Higher values create softer edges. |
| `smooth` | integer | No | `0` | Edge smoothing passes (0-10). Reduces jagged edges on complex subjects. |
| `shift_edge` | integer | No | `0` | Shift edge inward (negative) or outward (positive), range -10 to 10. Use negative values to remove background fringe. |
| `decontaminate` | boolean | No | `false` | Remove color bleeding from background at edges. Useful for subjects photographed against colored backgrounds. |
| `output_format` | string | No | `png` | Output format: `png`, `webp`. |

### Points Array Format

Each point in the `points` array specifies a location and whether it belongs to the subject or background:

```json
{
  "points": [
    {"x": 0.5, "y": 0.3, "label": 1},
    {"x": 0.1, "y": 0.1, "label": 0},
    {"x": 0.9, "y": 0.9, "label": 0}
  ]
}
```

- `x`, `y`: Normalized coordinates (0.0 = top-left, 1.0 = bottom-right)
- `label: 1`: This point is on the subject (foreground) — include it
- `label: 0`: This point is on the background — exclude it

**Tips:**
- Start with 1-2 foreground points on the main subject
- Add background points to exclude unwanted areas
- More points = more precise segmentation

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/photos/gpu-outputs/remover/x9y8z7w6.png",
  "usd_charged": 0.214362,
    "balance_usd": 49.785638,
  "billing": {
    "method": "wallet",
    "usd_charged": 0.214362,
    "balance_usd": 49.785638,
    "usd_charged": 0,
      },
  "size_bytes": 2105384,
  "processing_time_ms": 3120,
  "parameters": {
    "points_used": 3,
    "feather": 2,
    "smooth": 1,
    "shift_edge": -1,
    "decontaminate": true
  }
}
```

### Code Examples

::: code-group

```python [Python SDK]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.images.remove_background_advanced(
    image_url="https://example.com/group-photo.jpg",
    points=[
        {"x": 0.3, "y": 0.5, "label": 1},   # Person on left
        {"x": 0.7, "y": 0.5, "label": 1},   # Person on right
        {"x": 0.5, "y": 0.05, "label": 0},  # Sky (background)
    ],
    feather=3,
    smooth=1,
    shift_edge=-1,
    decontaminate=True,
)

print(f"Output: {result.output_url}")
print(f"Points used: {result.parameters['points_used']}")
```

```typescript [TypeScript SDK]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.images.removeBackgroundAdvanced({
  imageUrl: "https://example.com/group-photo.jpg",
  points: [
    { x: 0.3, y: 0.5, label: 1 },   // Person on left
    { x: 0.7, y: 0.5, label: 1 },   // Person on right
    { x: 0.5, y: 0.05, label: 0 },  // Sky (background)
  ],
  feather: 3,
  smooth: 1,
  shiftEdge: -1,
  decontaminate: true,
});

console.log(`Output: ${result.outputUrl}`);
console.log(`Points used: ${result.parameters.pointsUsed}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/images/remove-background/advanced" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/group-photo.jpg",
    "points": [
      {"x": 0.3, "y": 0.5, "label": 1},
      {"x": 0.7, "y": 0.5, "label": 1},
      {"x": 0.5, "y": 0.05, "label": 0}
    ],
    "feather": 3,
    "smooth": 1,
    "shift_edge": -1,
    "decontaminate": true
  }'
```

:::

---

## Replace Background

```
POST /v1/images/replace-background
```

Removes the background and replaces it with a new one in a single API call. Supports solid colors, gradients, background images, and AI-generated backgrounds from a text prompt.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | Yes | — | URL of the image to process. Max 50MB. |
| `background` | string | Yes | — | New background. Accepts: hex color (`#ffffff`), CSS gradient (`linear-gradient(#000, #fff)`), image URL (`https://...`), or AI prompt text. |
| `background_type` | string | No | `auto` | Explicit type: `color`, `gradient`, `image`, `prompt`. If `auto`, type is detected from the `background` value. |
| `feather` | integer | No | `2` | Edge feathering radius (0-20). |
| `output_format` | string | No | `png` | Output: `png`, `jpeg`, `webp`. Use `jpeg` for opaque backgrounds (smaller file). |

### Background Types

| Type | Example `background` value | Description |
|------|---------------------------|-------------|
| `color` | `#f5f5f5` or `#000000` | Solid color fill behind subject |
| `gradient` | `linear-gradient(180deg, #667eea, #764ba2)` | CSS-style gradient |
| `image` | `https://example.com/office-bg.jpg` | Replace with another image |
| `prompt` | `Professional studio with soft bokeh lights` | AI-generates a background from text |

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/photos/gpu-outputs/remover/composed123.png",
  "transparent_url": "https://s1.fotohub.app/storage/v1/object/public/photos/gpu-outputs/remover/transparent456.png",
  "background_type": "color",
  "usd_charged": 0.214362,
    "balance_usd": 49.785638,
  "billing": {
    "method": "wallet",
    "usd_charged": 0.214362,
    "balance_usd": 49.785638,
    "usd_charged": 0,
      },
  "processing_time_ms": 4200
}
```

| Field | Description |
|-------|-------------|
| `output_url` | Final composited image with new background |
| `transparent_url` | Subject on transparent background (bonus output) |
| `background_type` | Detected or specified background type |

### Code Examples

::: code-group

```python [Python SDK]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Solid color background
result = client.images.replace_background(
    image_url="https://example.com/product.jpg",
    background="#ffffff",
)

# AI-generated background from prompt
result = client.images.replace_background(
    image_url="https://example.com/portrait.jpg",
    background="Modern office with floor-to-ceiling windows, soft natural light, blurred city skyline",
    background_type="prompt",
)

# Use another image as background
result = client.images.replace_background(
    image_url="https://example.com/model.jpg",
    background="https://example.com/beach-sunset.jpg",
    background_type="image",
)

print(f"Result: {result.output_url}")
print(f"Transparent: {result.transparent_url}")
```

```typescript [TypeScript SDK]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Solid color background
const result = await client.images.replaceBackground({
  imageUrl: "https://example.com/product.jpg",
  background: "#ffffff",
});

// AI-generated background
const result2 = await client.images.replaceBackground({
  imageUrl: "https://example.com/portrait.jpg",
  background: "Modern office with floor-to-ceiling windows and soft light",
  backgroundType: "prompt",
});

console.log(`Result: ${result.outputUrl}`);
console.log(`Transparent: ${result.transparentUrl}`);
```

```bash [cURL]
# Solid white background
curl -X POST "https://apis.fotohub.app/v1/images/replace-background" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/product.jpg",
    "background": "#ffffff"
  }'

# AI prompt background
curl -X POST "https://apis.fotohub.app/v1/images/replace-background" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/portrait.jpg",
    "background": "Professional studio with soft gradient lighting",
    "background_type": "prompt"
  }'
```

:::

---

## Blur Background

```
POST /v1/images/blur-background
```

Keeps the main subject in sharp focus while applying Gaussian blur to the background. Creates a professional depth-of-field (bokeh) effect without needing a portrait-mode camera.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | Yes | — | URL of the image to process. Max 50MB. |
| `blur_radius` | integer | No | `15` | Gaussian blur radius (1-50). Higher = more blur. 5-10 for subtle, 15-25 for portrait, 30-50 for extreme. |
| `feather` | integer | No | `2` | Edge feathering between sharp subject and blurred background (0-20). |
| `output_format` | string | No | `jpeg` | Output: `png`, `jpeg`, `webp`. JPEG recommended (no transparency needed). |

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/photos/gpu-outputs/remover/blurred789.jpg",
  "usd_charged": 0.107181,
    "balance_usd": 49.892819,
  "billing": {
    "method": "wallet",
    "usd_charged": 0.107181,
    "balance_usd": 49.892819,
    "usd_charged": 0,
      },
  "blur_radius": 15,
  "processing_time_ms": 2800
}
```

### Code Examples

::: code-group

```python [Python SDK]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.images.blur_background(
    image_url="https://example.com/street-photo.jpg",
    blur_radius=20,
    feather=3,
)

print(f"Bokeh result: {result.output_url}")
```

```typescript [TypeScript SDK]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.images.blurBackground({
  imageUrl: "https://example.com/street-photo.jpg",
  blurRadius: 20,
  feather: 3,
});

console.log(`Bokeh result: ${result.outputUrl}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/images/blur-background" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/street-photo.jpg",
    "blur_radius": 20,
    "feather": 3
  }'
```

:::

---

## Add Shadow

```
POST /v1/images/add-shadow
```

Adds a realistic shadow to a transparent PNG image. Supports natural (AI-detected lighting direction), drop shadow, and contact shadow types. Input must have an alpha channel (transparent background).

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | Yes | — | URL of a transparent PNG image. Must have alpha channel. |
| `shadow_type` | string | No | `natural` | Shadow style: `natural` (AI analyzes subject shape and lighting), `drop` (simple offset shadow), `contact` (shadow at bottom edge only). |
| `shadow_opacity` | float | No | `0.5` | Shadow opacity, 0.0 (invisible) to 1.0 (fully opaque). |
| `shadow_offset_x` | integer | No | `0` | Horizontal shadow offset in pixels (-50 to 50). |
| `shadow_offset_y` | integer | No | `10` | Vertical shadow offset in pixels (-50 to 50). |
| `shadow_blur` | integer | No | `10` | Shadow blur radius (0-50). 0 = hard shadow, 50 = very soft. |
| `shadow_color` | string | No | `#000000` | Shadow color as hex code. |
| `output_format` | string | No | `png` | Output format: `png`, `webp`. PNG recommended to preserve transparency. |

### Shadow Types

| Type | Description | Best for |
|------|-------------|----------|
| `natural` | AI analyzes subject shape to determine realistic shadow direction and softness | Product photos, people, objects with clear form |
| `drop` | Classic drop shadow with configurable offset and blur | Flat design, icons, UI elements |
| `contact` | Shadow only at the base/bottom of the subject | Products on surfaces, standing objects |

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/photos/gpu-outputs/remover/shadow456.png",
  "usd_charged": 0.107181,
    "balance_usd": 49.892819,
  "billing": {
    "method": "wallet",
    "usd_charged": 0.107181,
    "balance_usd": 49.892819,
    "usd_charged": 0,
      },
  "shadow_type": "natural",
  "processing_time_ms": 1850
}
```

### Code Examples

::: code-group

```python [Python SDK]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Natural shadow (AI-detected lighting)
result = client.images.add_shadow(
    image_url="https://example.com/product-transparent.png",
    shadow_type="natural",
    shadow_opacity=0.4,
)

# Drop shadow with custom offset
result = client.images.add_shadow(
    image_url="https://example.com/icon-transparent.png",
    shadow_type="drop",
    shadow_offset_x=5,
    shadow_offset_y=8,
    shadow_blur=12,
    shadow_opacity=0.3,
    shadow_color="#1a1a2e",
)

print(f"With shadow: {result.output_url}")
```

```typescript [TypeScript SDK]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Natural shadow
const result = await client.images.addShadow({
  imageUrl: "https://example.com/product-transparent.png",
  shadowType: "natural",
  shadowOpacity: 0.4,
});

// Contact shadow for product on surface
const result2 = await client.images.addShadow({
  imageUrl: "https://example.com/shoe-transparent.png",
  shadowType: "contact",
  shadowBlur: 15,
  shadowOpacity: 0.6,
});

console.log(`With shadow: ${result.outputUrl}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/images/add-shadow" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/product-transparent.png",
    "shadow_type": "natural",
    "shadow_opacity": 0.4
  }'
```

:::

---

## Pricing

All operations are billed per image directly from your prepaid USD wallet at 1:1 self-hosted infrastructure rates:

| Endpoint | Operation Key | Price (USD) | Unit |
|----------|---------------|------------:|------|
| `POST /v1/images/remove-background` | `remove_background` | $0.107181 | per image |
| `POST /v1/images/remove-background/advanced` | `remove_background_advanced` | $0.214362 | per image |
| `POST /v1/images/replace-background` | `replace_background` | $0.214362 | per image |
| `POST /v1/images/blur-background` | `blur_background` | $0.107181 | per image |
| `POST /v1/images/add-shadow` | `add_shadow` | $0.107181 | per image |

**Billing notes:**
- Prepaid USD wallet only. Funds are debited upon successful execution.
- If processing fails due to a system error, no charge is deducted from your balance.
- All operations are single-image. For multi-image processing, call the endpoint concurrently.

## Rate Limits

| Endpoint | Free Tier | Standard Tier | Enterprise |
|----------|-----------|---------------|------------|
| `remove-background` | 5/min | 60/min | 200+/min |
| `remove-background/advanced` | 5/min | 60/min | 200+/min |
| `replace-background` | 3/min | 50/min | 150+/min |
| `blur-background` | 5/min | 60/min | 200+/min |
| `add-shadow` | 5/min | 60/min | 200+/min |

## Error Responses

| Code | Status | Description |
|------|--------|-------------|
| `bad_request` | 400 | Invalid image format, dimensions, or parameters |
| `unauthorized` | 401 | Missing or invalid API key |
| `insufficient_funds` | 402 | Wallet balance too low to cover operation |
| `rate_limit_exceeded` | 429 | Request rate limit exceeded |
| `internal_error` | 500 | Processing failed on GPU worker |

### 402 — Insufficient Funds

Returned when your prepaid USD wallet balance cannot cover the required operation price:

```json
{
  "error": "insufficient_funds",
  "detail": "Insufficient wallet balance. Required: $0.107181, available: $0.02. Top up your USD wallet at fotohub.app/billing"
}
```
