# Image Editing

The Image Editing API provides AI-powered image manipulation including inpainting, outpainting, background replacement, object removal, upscaling, and style transfer. All operations use a single endpoint with the `mode` parameter to select the editing operation.

::: info Overview
Powered by Google Imagen 3 for photorealistic results. All edit modes cost a fixed **2 credits** (0.24 PLN) per operation, regardless of image size or complexity. Additionally, 13 specialized tools from Stability AI are available for advanced editing workflows.
:::

---

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
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.image.edit(
    image_url="https://example.com/photo.jpg",
    mask_url="https://example.com/mask.png",
    prompt="A fluffy golden retriever sitting on the grass",
    mode="inpaint",
)

print(f"Edited image: {result.images[0]}")
print(f"Credits used: {result.credits_used}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.image.edit({
  imageUrl: "https://example.com/photo.jpg",
  maskUrl: "https://example.com/mask.png",
  prompt: "A fluffy golden retriever sitting on the grass",
  mode: "inpaint",
});

console.log(`Edited image: ${result.images[0]}`);
console.log(`Credits used: ${result.creditsUsed}`);
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
		"image_url": "https://example.com/photo.jpg",
		"mask_url":  "https://example.com/mask.png",
		"prompt":    "A fluffy golden retriever sitting on the grass",
		"mode":      "inpaint",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/edit/image", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	images := result["images"].([]interface{})
	fmt.Printf("Edited image: %s\n", images[0])
	fmt.Printf("Credits used: %.0f\n", result["credits_used"])
}
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
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Replace background — subject is detected automatically
result = client.image.edit(
    image_url="https://example.com/portrait.jpg",
    prompt="Modern minimalist office with large windows, soft natural light, blurred bokeh background",
    mode="bgswap",
    num_outputs=3,  # Generate 3 variations
)

for i, img_url in enumerate(result.images):
    print(f"Variation {i+1}: {img_url}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.image.edit({
  imageUrl: "https://example.com/portrait.jpg",
  prompt: "Modern minimalist office with large windows, soft natural light, blurred bokeh background",
  mode: "bgswap",
  numOutputs: 3,
});

result.images.forEach((url: string, i: number) => {
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
		"image_url":   "https://example.com/portrait.jpg",
		"prompt":      "Modern minimalist office with large windows, soft natural light, blurred bokeh background",
		"mode":        "bgswap",
		"num_outputs": 3,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/edit/image", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	images := result["images"].([]interface{})
	for i, img := range images {
		fmt.Printf("Variation %d: %s\n", i+1, img)
	}
}
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
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Remove an unwanted object — no mask needed
result = client.image.edit(
    image_url="https://example.com/landscape.jpg",
    prompt="the power lines and telephone poles in the sky",
    mode="remove",
)

print(f"Clean image: {result.images[0]}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.image.edit({
  imageUrl: "https://example.com/landscape.jpg",
  prompt: "the power lines and telephone poles in the sky",
  mode: "remove",
});

console.log(`Clean image: ${result.images[0]}`);
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
		"image_url": "https://example.com/landscape.jpg",
		"prompt":    "the power lines and telephone poles in the sky",
		"mode":      "remove",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/edit/image", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	images := result["images"].([]interface{})
	fmt.Printf("Clean image: %s\n", images[0])
}
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
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# AI upscale with enhancement
result = client.image.edit(
    image_url="https://example.com/low-res-photo.jpg",
    prompt="sharp, detailed, photorealistic, high resolution",
    mode="upscale",
    output_format="png",
)

print(f"Upscaled: {result.images[0]}")
print(f"Output size: {result.metadata.output_size}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.image.edit({
  imageUrl: "https://example.com/low-res-photo.jpg",
  prompt: "sharp, detailed, photorealistic, high resolution",
  mode: "upscale",
  outputFormat: "png",
});

console.log(`Upscaled: ${result.images[0]}`);
console.log(`Output size: ${result.metadata.outputSize}`);
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
		"image_url":     "https://example.com/low-res-photo.jpg",
		"prompt":        "sharp, detailed, photorealistic, high resolution",
		"mode":          "upscale",
		"output_format": "png",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/edit/image", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	images := result["images"].([]interface{})
	metadata := result["metadata"].(map[string]interface{})
	fmt.Printf("Upscaled: %s\n", images[0])
	fmt.Printf("Output size: %s\n", metadata["output_size"])
}
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

---

### Outpaint — Extend Image

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Extend landscape photo to panoramic ratio
result = client.image.edit(
    image_url="https://example.com/landscape-square.jpg",
    prompt="continuation of mountain landscape with pine forest, dramatic sky with clouds at golden hour",
    mode="outpaint",
    num_outputs=2,
)

for i, url in enumerate(result.images):
    print(f"Extended version {i+1}: {url}")
print(f"Processing time: {result.metadata.processing_time_ms}ms")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.image.edit({
  imageUrl: "https://example.com/landscape-square.jpg",
  prompt: "continuation of mountain landscape with pine forest, dramatic sky with clouds at golden hour",
  mode: "outpaint",
  numOutputs: 2,
});

result.images.forEach((url: string, i: number) => {
  console.log(`Extended version ${i + 1}: ${url}`);
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
		"image_url":   "https://example.com/landscape-square.jpg",
		"prompt":      "continuation of mountain landscape with pine forest, dramatic sky with clouds at golden hour",
		"mode":        "outpaint",
		"num_outputs": 2,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/edit/image", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	images := result["images"].([]interface{})
	for i, img := range images {
		fmt.Printf("Extended version %d: %s\n", i+1, img)
	}
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/edit/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/landscape-square.jpg",
    "prompt": "continuation of mountain landscape with pine forest, dramatic sky with clouds at golden hour",
    "mode": "outpaint",
    "num_outputs": 2
  }'
```

:::

---

### Style Transfer (via Stability AI)

Transfer the visual style from a reference image to your source image using the Stability AI style-transfer tool.

::: code-group

```python [Python]
from fotohub import FotoHub
import base64

client = FotoHub(api_key="fh_live_your_api_key")

# Load images as base64
with open("source_photo.jpg", "rb") as f:
    source_b64 = base64.b64encode(f.read()).decode()

with open("style_reference.jpg", "rb") as f:
    style_b64 = base64.b64encode(f.read()).decode()

result = client.stability.run(
    tool_id="style-transfer",
    image=source_b64,
    reference=style_b64,
)

# Decode and save result
output_bytes = base64.b64decode(result.image)
with open("styled_output.png", "wb") as f:
    f.write(output_bytes)

print(f"Credits used: {result.credits_used}")
print(f"Seed: {result.seed}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync, writeFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const sourceB64 = readFileSync("source_photo.jpg").toString("base64");
const styleB64 = readFileSync("style_reference.jpg").toString("base64");

const result = await client.stability.run({
  toolId: "style-transfer",
  image: sourceB64,
  reference: styleB64,
});

writeFileSync("styled_output.png", Buffer.from(result.image, "base64"));
console.log(`Credits used: ${result.creditsUsed}`);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	sourceData, _ := os.ReadFile("source_photo.jpg")
	styleData, _ := os.ReadFile("style_reference.jpg")

	payload := map[string]interface{}{
		"image":     base64.StdEncoding.EncodeToString(sourceData),
		"reference": base64.StdEncoding.EncodeToString(styleData),
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/stability/style-transfer", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)

	outputBytes, _ := base64.StdEncoding.DecodeString(result["image"].(string))
	os.WriteFile("styled_output.png", outputBytes, 0644)
	fmt.Printf("Credits used: %v\n", result["credits_used"])
}
```

```bash [cURL]
# Encode images to base64
SOURCE_B64=$(base64 -w0 source_photo.jpg)
STYLE_B64=$(base64 -w0 style_reference.jpg)

curl -X POST "https://apis.fotohub.app/stability/style-transfer" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{
    \"image\": \"$SOURCE_B64\",
    \"reference\": \"$STYLE_B64\"
  }" | jq -r '.image' | base64 -d > styled_output.png
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

---

## Image Studio (Stability AI Tools)

13 specialized image editing tools powered by Stability AI. Available at `POST /stability/{tool_id}`.

### Available Tools

| Tool ID | Name | Credits | Requires |
|---------|------|---------|----------|
| `fast-upscale` | Fast Upscale 4x | 1 | image |
| `creative-upscale` | Creative Upscale | 3 | image |
| `conservative-upscale` | Conservative Upscale | 2 | image |
| `remove-background` | Remove Background | 1 | image |
| `erase-object` | Erase Object | 2 | image + mask |
| `inpaint` | Inpaint | 3 | image + mask + prompt |
| `outpaint` | Outpaint | 3 | image + prompt + directions |
| `search-replace` | Search & Replace | 3 | image + prompt + search_prompt |
| `search-recolor` | Search & Recolor | 3 | image + prompt + search_prompt |
| `style-transfer` | Style Transfer | 2 | image + reference |
| `style-guide` | Style Guide | 2 | image + reference + prompt |
| `control-sketch` | Sketch to Image | 3 | image (sketch) + prompt |
| `control-structure` | Structure to Image | 3 | image + prompt |

### List Tools

```
GET /stability/tools
```

### Run Tool

```
POST /stability/{tool_id}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image` | string | **Yes** | Base64-encoded source image (PNG/JPEG) |
| `mask` | string | For erase/inpaint | Base64-encoded mask (white=edit) |
| `prompt` | string | For generation tools | What to generate/replace |
| `search_prompt` | string | For search-replace/recolor | What to find in image |
| `reference` | string | For style tools | Base64-encoded reference image |
| `negative_prompt` | string | No | What to avoid |
| `seed` | integer | No | Reproducibility seed |
| `left`, `right`, `up`, `down` | integer | For outpaint | Pixels to extend (0-2048) |

**Response:**

```json
{
  "image": "BASE64_ENCODED_RESULT...",
  "tool": "fast-upscale",
  "seed": 42,
  "credits_used": 1.0
}
```

### Stability AI Code Examples

::: code-group

```python [Python]
from fotohub import FotoHub
import base64

client = FotoHub(api_key="fh_live_your_api_key")

# Remove background from product photo
with open("product.jpg", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

result = client.stability.run(
    tool_id="remove-background",
    image=image_b64,
)

output = base64.b64decode(result.image)
with open("product_no_bg.png", "wb") as f:
    f.write(output)
print(f"Credits: {result.credits_used}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync, writeFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const imageB64 = readFileSync("product.jpg").toString("base64");

const result = await client.stability.run({
  toolId: "remove-background",
  image: imageB64,
});

writeFileSync("product_no_bg.png", Buffer.from(result.image, "base64"));
console.log(`Credits: ${result.creditsUsed}`);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	imageData, _ := os.ReadFile("product.jpg")
	imageB64 := base64.StdEncoding.EncodeToString(imageData)

	payload := map[string]interface{}{
		"image": imageB64,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/stability/remove-background", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)

	outputBytes, _ := base64.StdEncoding.DecodeString(result["image"].(string))
	os.WriteFile("product_no_bg.png", outputBytes, 0644)
	fmt.Printf("Credits: %v\n", result["credits_used"])
}
```

```bash [cURL]
IMAGE_B64=$(base64 -w0 product.jpg)

curl -X POST "https://apis.fotohub.app/stability/remove-background" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE_B64\"}" | jq -r '.image' | base64 -d > product_no_bg.png
```

:::

Frontend UI available at: `fotohub.app/generate/image-studio`

---

## Advanced Workflows

### E-Commerce Product Photography

Process product images for online store listings: remove background, swap to studio setting, and upscale.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

product_url = "https://example.com/product-raw.jpg"

# Step 1: Remove distracting background, place on studio backdrop
studio = client.image.edit(
    image_url=product_url,
    prompt="clean white studio backdrop with soft shadow beneath product, professional product photography lighting",
    mode="bgswap",
)
print(f"Studio shot: {studio.images[0]}")

# Step 2: Remove any visible props or stands
cleaned = client.image.edit(
    image_url=studio.images[0],
    prompt="the product stand and support rod",
    mode="remove",
)
print(f"Cleaned: {cleaned.images[0]}")

# Step 3: Upscale to high-res for zoom views
upscaled = client.image.edit(
    image_url=cleaned.images[0],
    prompt="crisp, sharp product details, commercial photography quality",
    mode="upscale",
    output_format="png",
)
print(f"Final: {upscaled.images[0]}")
print(f"Size: {upscaled.metadata.output_size}")
# Total: 6 credits (3 x 2 per operation)
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const productUrl = "https://example.com/product-raw.jpg";

// Step 1: Studio background
const studio = await client.image.edit({
  imageUrl: productUrl,
  prompt: "clean white studio backdrop with soft shadow beneath product, professional product photography lighting",
  mode: "bgswap",
});

// Step 2: Remove props
const cleaned = await client.image.edit({
  imageUrl: studio.images[0],
  prompt: "the product stand and support rod",
  mode: "remove",
});

// Step 3: Upscale
const upscaled = await client.image.edit({
  imageUrl: cleaned.images[0],
  prompt: "crisp, sharp product details, commercial photography quality",
  mode: "upscale",
  outputFormat: "png",
});

console.log(`Final: ${upscaled.images[0]}`);
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

func editImage(payload map[string]interface{}) map[string]interface{} {
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/edit/image", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")
	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	return result
}

func main() {
	productURL := "https://example.com/product-raw.jpg"

	// Step 1: Studio background
	studio := editImage(map[string]interface{}{
		"image_url": productURL,
		"prompt":    "clean white studio backdrop with soft shadow, professional lighting",
		"mode":      "bgswap",
	})
	studioURL := studio["images"].([]interface{})[0].(string)

	// Step 2: Remove props
	cleaned := editImage(map[string]interface{}{
		"image_url": studioURL,
		"prompt":    "the product stand and support rod",
		"mode":      "remove",
	})
	cleanedURL := cleaned["images"].([]interface{})[0].(string)

	// Step 3: Upscale
	upscaled := editImage(map[string]interface{}{
		"image_url":     cleanedURL,
		"prompt":        "crisp, sharp product details, commercial quality",
		"mode":          "upscale",
		"output_format": "png",
	})
	finalURL := upscaled["images"].([]interface{})[0].(string)
	fmt.Printf("Final: %s\n", finalURL)
}
```

```bash [cURL]
PRODUCT="https://example.com/product-raw.jpg"

# Step 1: Studio background
STUDIO=$(curl -s -X POST "https://apis.fotohub.app/v1/ai/edit/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"image_url\": \"$PRODUCT\", \"prompt\": \"clean white studio backdrop with professional lighting\", \"mode\": \"bgswap\"}")
STUDIO_URL=$(echo $STUDIO | jq -r '.images[0]')

# Step 2: Remove props
CLEANED=$(curl -s -X POST "https://apis.fotohub.app/v1/ai/edit/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"image_url\": \"$STUDIO_URL\", \"prompt\": \"the product stand\", \"mode\": \"remove\"}")
CLEANED_URL=$(echo $CLEANED | jq -r '.images[0]')

# Step 3: Upscale
curl -s -X POST "https://apis.fotohub.app/v1/ai/edit/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"image_url\": \"$CLEANED_URL\", \"prompt\": \"sharp product details\", \"mode\": \"upscale\"}" \
  | jq '.images[0]'
```

:::

---

### Real Estate Photo Enhancement

Clean up property photos for listings: remove clutter, enhance sky, expand composition.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Remove unsightly objects from exterior photo
exterior = client.image.edit(
    image_url="https://example.com/house-exterior.jpg",
    prompt="the trash bins, parked cars, and garden hose on the driveway",
    mode="remove",
)
print(f"Cleaned exterior: {exterior.images[0]}")

# Expand photo to show more of the property
expanded = client.image.edit(
    image_url=exterior.images[0],
    prompt="continuation of manicured lawn and landscaping, blue sky with light clouds, suburban neighborhood context",
    mode="outpaint",
)
print(f"Expanded: {expanded.images[0]}")

# Swap dull sky for dramatic sunset
final = client.image.edit(
    image_url=expanded.images[0],
    prompt="stunning golden hour sky with warm light illuminating the house facade, professional real estate photography",
    mode="bgswap",
)
print(f"Final listing photo: {final.images[0]}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Remove clutter
const exterior = await client.image.edit({
  imageUrl: "https://example.com/house-exterior.jpg",
  prompt: "the trash bins, parked cars, and garden hose on the driveway",
  mode: "remove",
});

// Expand composition
const expanded = await client.image.edit({
  imageUrl: exterior.images[0],
  prompt: "continuation of manicured lawn and landscaping, blue sky with light clouds",
  mode: "outpaint",
});

// Enhance sky
const final = await client.image.edit({
  imageUrl: expanded.images[0],
  prompt: "stunning golden hour sky with warm light illuminating the house facade",
  mode: "bgswap",
});

console.log(`Final: ${final.images[0]}`);
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

func edit(payload map[string]interface{}) string {
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/edit/image", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")
	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	return result["images"].([]interface{})[0].(string)
}

func main() {
	// Remove clutter
	cleaned := edit(map[string]interface{}{
		"image_url": "https://example.com/house-exterior.jpg",
		"prompt":    "the trash bins, parked cars, and garden hose",
		"mode":      "remove",
	})

	// Expand composition
	expanded := edit(map[string]interface{}{
		"image_url": cleaned,
		"prompt":    "manicured lawn, blue sky with clouds",
		"mode":      "outpaint",
	})

	// Enhance sky
	final := edit(map[string]interface{}{
		"image_url": expanded,
		"prompt":    "golden hour sky with warm light on house facade",
		"mode":      "bgswap",
	})

	fmt.Printf("Final: %s\n", final)
}
```

```bash [cURL]
# Remove clutter
CLEANED=$(curl -s -X POST "https://apis.fotohub.app/v1/ai/edit/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/house-exterior.jpg", "prompt": "trash bins, parked cars, garden hose", "mode": "remove"}')
CLEANED_URL=$(echo $CLEANED | jq -r '.images[0]')

# Expand
EXPANDED=$(curl -s -X POST "https://apis.fotohub.app/v1/ai/edit/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"image_url\": \"$CLEANED_URL\", \"prompt\": \"manicured lawn, blue sky\", \"mode\": \"outpaint\"}")
EXPANDED_URL=$(echo $EXPANDED | jq -r '.images[0]')

# Enhance sky
curl -s -X POST "https://apis.fotohub.app/v1/ai/edit/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"image_url\": \"$EXPANDED_URL\", \"prompt\": \"golden hour sky\", \"mode\": \"bgswap\"}" | jq '.images[0]'
```

:::

---

## Model Comparison

| Feature | Imagen 3 (Default) | Stability AI Tools |
|---------|--------------------|--------------------|
| **Endpoint** | `POST /v1/ai/edit/image` | `POST /stability/{tool_id}` |
| **Input** | URL-based | Base64-encoded |
| **Inpaint** | Yes (2 cr) | Yes (3 cr) |
| **Outpaint** | Yes (2 cr) | Yes (3 cr, directional control) |
| **Background Swap** | Yes (2 cr) | Via search-replace (3 cr) |
| **Object Removal** | Yes (2 cr) | Yes — erase-object (2 cr) |
| **Upscale** | Yes (2 cr) | Fast (1 cr), Creative (3 cr), Conservative (2 cr) |
| **Style Transfer** | No | Yes (2 cr) |
| **Background Removal** | No | Yes (1 cr) |
| **Search & Replace** | No | Yes (3 cr) — find and replace any element |
| **Search & Recolor** | No | Yes (3 cr) — recolor specific objects |
| **Sketch to Image** | No | Yes (3 cr) |
| **Structure to Image** | No | Yes (3 cr) |
| **Multiple Outputs** | 1-4 per request | 1 per request |
| **Best For** | Photorealistic edits, natural fill | Specialized tasks, fine control |

### Choosing the Right Tool

| Task | Recommended | Credits | Why |
|------|-------------|---------|-----|
| Replace sky in photo | Imagen 3 `bgswap` | 2 | Natural photorealistic results |
| Remove person from scene | Imagen 3 `remove` | 2 | No mask needed, prompt-based |
| Precise object erase | Stability `erase-object` | 2 | Mask gives exact control |
| Product background removal | Stability `remove-background` | 1 | Cheapest, clean alpha |
| Quick 4x upscale | Stability `fast-upscale` | 1 | Fast, cheap |
| Creative upscale with detail | Stability `creative-upscale` | 3 | Adds realistic detail |
| Extend image left/right | Stability `outpaint` | 3 | Directional pixel control |
| Apply art style | Stability `style-transfer` | 2 | Reference image driven |
| Recolor specific object | Stability `search-recolor` | 3 | Targeted color change |

---

## Use Cases

### Photography & Retouching

- Remove tourists from travel photos
- Replace overcast skies with dramatic clouds
- Extend tight compositions for social media aspect ratios
- Upscale old family photos for printing
- Remove branding/watermarks from stock previews (for owned assets only)

### E-Commerce

- Swap backgrounds to match brand aesthetic
- Remove packaging defects from product photos
- Generate multiple background variations for A/B testing
- Batch-upscale thumbnail images for zoom functionality
- Style transfer to match seasonal campaigns

### Marketing & Advertising

- Inpaint new products into lifestyle scenes
- Outpaint narrow images to fit billboard ratios
- Generate background variations for ad creative testing
- Remove competitor branding from reference shots
- Apply consistent style to user-generated content

### Architecture & Real Estate

- Remove construction debris from progress photos
- Extend building exteriors for wider compositions
- Swap overcast weather for sunny conditions
- Remove cars and clutter from street views
- Upscale drone footage stills for brochures

---

## Performance Tips

### Prompt Writing

- **Be specific** — "a red leather armchair" works better than "furniture"
- **Describe the result** — "sunlit meadow with wildflowers" not "make it look pretty"
- **Context matters** — include lighting and style info ("soft studio light", "cinematic")
- **For remove mode** — describe the object, not what replaces it (the AI handles fill)

### Choosing Output Format

| Format | Best For | Notes |
|--------|----------|-------|
| PNG | Transparency, archival quality | Largest files |
| JPEG | Web delivery, thumbnails | Smallest files, no transparency |
| WebP | Modern web, balanced quality/size | Best compression ratio |

### Batch Processing Pattern

For processing multiple images efficiently:

::: code-group

```python [Python]
from fotohub import FotoHub
import concurrent.futures

client = FotoHub(api_key="fh_live_your_api_key")

product_images = [
    "https://example.com/product-1.jpg",
    "https://example.com/product-2.jpg",
    "https://example.com/product-3.jpg",
    "https://example.com/product-4.jpg",
    "https://example.com/product-5.jpg",
]

def process_image(url):
    return client.image.edit(
        image_url=url,
        prompt="clean white studio background with soft drop shadow",
        mode="bgswap",
    )

# Process in parallel (respect rate limits: 30/min)
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    results = list(executor.map(process_image, product_images))

for i, result in enumerate(results):
    print(f"Product {i+1}: {result.images[0]}")

print(f"Total credits: {len(product_images) * 2}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const productImages = [
  "https://example.com/product-1.jpg",
  "https://example.com/product-2.jpg",
  "https://example.com/product-3.jpg",
  "https://example.com/product-4.jpg",
  "https://example.com/product-5.jpg",
];

// Process in parallel
const results = await Promise.all(
  productImages.map(url =>
    client.image.edit({
      imageUrl: url,
      prompt: "clean white studio background with soft drop shadow",
      mode: "bgswap",
    })
  )
);

results.forEach((r, i) => {
  console.log(`Product ${i + 1}: ${r.images[0]}`);
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
	"sync"
)

func processImage(url string, wg *sync.WaitGroup, results chan<- string) {
	defer wg.Done()
	payload := map[string]interface{}{
		"image_url": url,
		"prompt":    "clean white studio background with soft drop shadow",
		"mode":      "bgswap",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/edit/image", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	images := result["images"].([]interface{})
	results <- images[0].(string)
}

func main() {
	urls := []string{
		"https://example.com/product-1.jpg",
		"https://example.com/product-2.jpg",
		"https://example.com/product-3.jpg",
		"https://example.com/product-4.jpg",
		"https://example.com/product-5.jpg",
	}

	var wg sync.WaitGroup
	results := make(chan string, len(urls))

	for _, url := range urls {
		wg.Add(1)
		go processImage(url, &wg, results)
	}
	wg.Wait()
	close(results)

	i := 1
	for result := range results {
		fmt.Printf("Product %d: %s\n", i, result)
		i++
	}
}
```

```bash [cURL]
# Process multiple images in parallel
for i in 1 2 3 4 5; do
  curl -s -X POST "https://apis.fotohub.app/v1/ai/edit/image" \
    -H "Authorization: Bearer fh_live_your_api_key" \
    -H "Content-Type: application/json" \
    -d "{
      \"image_url\": \"https://example.com/product-$i.jpg\",
      \"prompt\": \"clean white studio background with soft drop shadow\",
      \"mode\": \"bgswap\"
    }" | jq -r ".images[0]" &
done
wait
echo "All products processed"
```

:::

---

## Rate Limits

| Tier | Requests/min | Notes |
|------|-------------|-------|
| Free | 10 | |
| Creator | 30 | |
| Pro | 60 | |
| Business | 120 | |
| Enterprise | Custom | Contact sales |

Rate limit headers are included in every response:
- `X-RateLimit-Limit` — max requests per window
- `X-RateLimit-Remaining` — remaining requests
- `X-RateLimit-Reset` — window reset time (unix timestamp)

---

## Related APIs

For additional image processing capabilities beyond editing:

| API | Description | Link |
|-----|-------------|------|
| **Image Processing** | Color grading, denoise, colorize, face restore, CLIP tagging, depth maps, batch processing | [Image Processing →](/api/image-processing) |
| **Background Removal Pro** | AI-powered background removal, replacement, blur, and shadow effects | [Background Removal →](/api/background-removal) |
