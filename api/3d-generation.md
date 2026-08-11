# 3D Generation

Generate 3D models from images or text prompts using FOTOhub's unified API. Convert product photos to 3D assets, create 3D models from descriptions, and export in industry-standard formats.

::: info Overview
The 3D Generation API offers a fast image-to-3D model, a text-to-3D model, and a production-grade tier for PBR assets. All of them output industry-standard formats compatible with web viewers, game engines, 3D printers, and AR applications.
:::

---

## Endpoint

```
POST /v1/ai/generate/3d
```

**Authentication:** Bearer token (API key)
**Billing:** USD, charged from your prepaid wallet before the generation starts — see [Pricing](#pricing)
**Processing:** Synchronous — one request returns the finished model. There is no queue and nothing to poll.

::: warning There is no 3D job queue
Earlier versions of this page described a submit-then-poll flow. That was never how the endpoint behaved: `POST /v1/ai/generate/3d` blocks until the mesh is ready (up to ~60s for `fh-pro-3d`) and returns it in the response. Set a generous client timeout instead of writing a polling loop.
:::

---

## Available Models

| Model | Name | Price (USD) | Speed | Mode | Status |
|-------|------|-------------|-------|------|--------|
| `fh-lite-3d` | FH Lite 3D | $0.160772 | ~3s | image-to-3d | Available |
| `fh-text-3d` | FH Text 3D | $0.267953 | ~25s | text-to-3d | Available |
| `fh-pro-3d` | FH Pro 3D | $0.803859 | ~60s | image-to-3d | Not yet enabled |

Prefer [`GET /v1/ai/generate/3d/models`](#list-available-models) or [`GET /v1/pricing`](/api/billing) over hardcoding this table: both return the same ids with a live `available` flag and the live price, so a repricing or a model being switched on needs no client change.

::: warning `fh-pro-3d` is not callable yet
It is listed with `available: false`. Requests naming it pass validation but will not produce a model until the service is enabled — build against `fh-lite-3d` and `fh-text-3d`.
:::

### Model Details

#### FH Lite 3D — `fh-lite-3d`

Best for quick previews and rapid prototyping. Turns a single image into a basic 3D mesh in about 3 seconds. Ideal when you want fast feedback before committing to higher-quality generation.

- **Input:** Single image (PNG, JPG, WebP)
- **Output:** Mesh with basic vertex colors
- **Texture:** Vertex coloring

#### FH Text 3D — `fh-text-3d`

The only model that generates from a description alone, with no reference image. Best for creative exploration and concept work; fidelity is lower than image-to-3D, which is the trade-off for needing no input photo.

- **Input:** Text prompt (up to 500 characters)
- **Output:** Mesh with vertex colors
- **Texture:** Vertex coloring only

#### FH Pro 3D — `fh-pro-3d`

The production-grade tier: full PBR material sets suitable for game engines and professional 3D workflows. Currently reported as `available: false`.

- **Input:** Single image (PNG, JPG, WebP)
- **Output:** PBR-ready mesh with a full material set
- **Texture:** Albedo, normal, roughness and metallic maps

---

## Generation Modes

### Image-to-3D

Convert a single photograph or rendered image into a 3D model. The input image should show the object clearly against a simple background. Works with all models except `fh-text-3d`.

**Best practices:**
- Use images with clean, solid backgrounds (white/gray preferred)
- Ensure the subject fills 60-80% of the frame
- Use well-lit photos without harsh shadows
- Remove background first using the [Image Editing](/api/image-editing) API for best results

### Text-to-3D

Generate a 3D model from a text description. `fh-text-3d` is the only model that supports this mode.

**Best practices:**
- Be specific about shape, size, and materials
- Include descriptive adjectives (e.g., "smooth polished wooden chair" vs "chair")
- Mention intended style (realistic, low-poly, cartoon)
- Keep prompts under 200 characters for best results

---

## Quality Settings

| Quality | Description | Processing Time | Polygon Range |
|---------|-------------|-----------------|---------------|
| `draft` | Low-poly quick preview, minimal textures | Fastest (-30%) | 10,000-30,000 |
| `standard` | Balanced quality and speed (default) | Normal | 30,000-80,000 |
| `high` | Maximum detail, full textures, optimized topology | Slowest (+50%) | 80,000-150,000 |

---

## Output Formats

| Format | Extension | Use Case |
|--------|-----------|----------|
| `glb` | .glb | Web viewers, AR, game engines (default) |
| `obj` | .obj | 3D editing software, CAD |
| `stl` | .stl | 3D printing |
| `usdz` | .usdz | Apple AR Quick Look, iOS |

### Format Details

- **GLB** — Binary glTF format. Self-contained (mesh + textures in one file). Universal support in Three.js, Babylon.js, Unity, Unreal Engine, and all modern web viewers. Default choice for most applications.
- **OBJ** — Wavefront format with separate .mtl material file. Best for importing into Blender, Maya, 3ds Max, and other DCC tools. Does not support animations.
- **STL** — Triangulated mesh without textures or colors. Industry standard for 3D printing (FDM, SLA, SLS). Always exported as binary STL.
- **USDZ** — Apple's AR format. Required for AR Quick Look on iOS/iPadOS/macOS. Contains mesh, textures, and basic PBR materials in a single archive.

---

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
| `pbr` | boolean | Generate PBR materials (fh-pro-3d only) |
| `simplify` | boolean | Reduce polygon count |
| `target_polys` | integer | Target polygon count when simplify is true |

---

## Response

```json
{
  "operation": "generate_3d",
  "model": "fh-lite-3d",
  "success": true,
  "file_id": "8f3k2j1m-4n5p-4a2b-9c1d-3e4f5a6b7c8d",
  "url": "https://s1.fotohub.app/storage/v1/object/sign/cloud-drive/...",
  "storage_path": "<user_id>/3d/8f3k2j1m-4n5p-4a2b-9c1d-3e4f5a6b7c8d.glb",
  "name": "3d_model_1754899200000.glb",
  "stats": {
    "file_size_bytes": 2457600,
    "duration_ms": 3184
  },
  "cost_usd": 0.160772,
  "currency": "USD",
  "billing": {
    "cost_usd": 0.160772,
    "balance_usd": 12.416538,
    "currency": "USD",
    "method": "wallet",
    "model": "prepaid"
  }
}
```

`url` is a **signed link valid for 2 hours**. Persist the file, or re-sign it later with [`GET /v1/ai/generate/3d/{file_id}`](#retrieve-a-generated-model).

::: tip Fields that do not exist
This page previously documented `id`, `status`, `poly_count` and `thumbnail_url`. None of them are returned — the identifier is `file_id`, and there is no thumbnail or polygon count in the response. Read `stats.file_size_bytes` for size.
:::

### Error Responses

Every error carries `detail`, and any error raised before or instead of a successful generation states plainly that you were not billed.

```json
{
  "detail": {
    "error": "prompt is required for text-to-3d mode",
    "note": "Your wallet was not charged for this request."
  }
}
```

| Status | Meaning |
|--------|---------|
| `400` | Bad request — `image_base64` missing for `image-to-3d`, or `prompt` missing for `text-to-3d`. Not charged. |
| `401` | Missing or invalid API key. Not charged. |
| `402` | `code: insufficient_funds` — your prepaid wallet cannot cover the generation. Nothing was charged; top up and retry. |
| `422` | Validation error — unknown `model`, `mode`, `quality` or `format`. Not charged. |
| `424` | The generation failed on our side (engine or storage). **The charge is refunded automatically** and the response says so. |
| `429` | Rate limit exceeded for your tier. Not charged. |

---

## Examples

### Basic Image-to-3D Generation

Generate a 3D model from a product photo using the fast FH Lite 3D model.

::: code-group
```python [Python]
from fotohub import FotoHub
import base64

client = FotoHub(api_key="fh_live_your_api_key")

# Encode your product photo
with open("product.jpg", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

# Generate 3D model
result = client.generate_3d(
    mode="image-to-3d",
    model="fh-lite-3d",
    image=image_b64,
    format="glb",
)

print(f"3D Model: {result['url']}")
print(f"Size: {result['stats']['file_size_bytes'] / 1024:.0f} KB")
print(f"Charged: ${result['cost_usd']:.6f}")
print(f"Wallet balance: ${result['billing']['balance_usd']:.6f}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Encode product photo
const imageBuffer = readFileSync("product.jpg");
const imageBase64 = imageBuffer.toString("base64");

// Generate 3D model
const result = await client.generate3D({
  mode: "image-to-3d",
  model: "fh-lite-3d",
  image: imageBase64,
  format: "glb",
});

console.log(`3D Model: ${result.url}`);
console.log(`Size: ${(result.stats.file_size_bytes / 1024).toFixed(0)} KB`);
console.log(`Charged: $${result.cost_usd}`);
console.log(`Wallet balance: $${result.billing.balance_usd}`);
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
	// Read and encode image
	imageData, err := os.ReadFile("product.jpg")
	if err != nil {
		panic(err)
	}
	imageB64 := base64.StdEncoding.EncodeToString(imageData)

	// Build request payload
	payload := map[string]interface{}{
		"mode":         "image-to-3d",
		"model":        "fh-lite-3d",
		"image_base64": imageB64,
		"format":       "glb",
	}
	body, _ := json.Marshal(payload)

	// Send request
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/3d", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	fmt.Printf("3D Model: %s\n", result["url"])
	fmt.Printf("Charged: $%v\n", result["cost_usd"])
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "image-to-3d",
    "model": "fh-lite-3d",
    "image_base64": "'$(base64 -w0 product.jpg)'",
    "format": "glb",
    "quality": "standard"
  }'
```
:::

---

### Text-to-3D Generation

Generate a 3D model from a text prompt. `fh-text-3d` is the only model that accepts `mode: "text-to-3d"` — the examples below used to name `fh-pro-3d`, which is image-only and not enabled, so they could not have worked.

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Generate 3D model from text description
result = client.generate_3d(
    mode="text-to-3d",
    model="fh-text-3d",
    prompt="A medieval stone castle with four towers and a drawbridge",
    quality="high",
    format="glb",
)

print(f"3D Model: {result['url']}")
print(f"File size: {result['stats']['file_size_bytes'] / 1024 / 1024:.1f} MB")
print(f"Charged: ${result['cost_usd']:.6f}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Generate 3D model from text description
const result = await client.generate3D({
  mode: "text-to-3d",
  model: "fh-text-3d",
  prompt: "A medieval stone castle with four towers and a drawbridge",
  quality: "high",
  format: "glb",
});

console.log(`3D Model: ${result.url}`);
console.log(`File size: ${(result.stats.file_size_bytes / 1024 / 1024).toFixed(1)} MB`);
console.log(`Charged: $${result.cost_usd}`);
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
		"mode":    "text-to-3d",
		"model":   "fh-text-3d",
		"prompt":  "A medieval stone castle with four towers and a drawbridge",
		"quality": "high",
		"format":  "glb",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/3d", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	fmt.Printf("3D Model: %s\n", result["url"])
	fmt.Printf("Charged: $%v\n", result["cost_usd"])
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "text-to-3d",
    "model": "fh-text-3d",
    "prompt": "A medieval stone castle with four towers and a drawbridge",
    "quality": "high",
    "format": "glb"
  }'
```
:::

---

### Handling Long Generations

There is no job queue: the request blocks until the mesh is ready. `fh-text-3d` takes roughly 25s and `fh-pro-3d` up to a minute, which exceeds the default timeout of most HTTP clients — so raise the timeout rather than reaching for a polling loop.

::: warning This section used to document a polling loop
It showed a `while` loop reading `status` from `GET /v1/ai/generate/3d/{job_id}`. That loop could never terminate: the response contains no `status` field to become `"completed"`, because the generation is already finished when the POST returns. If you copied it, replace it with the code below.
:::

::: code-group
```python [Python]
from fotohub import FotoHub
import base64

# The SDK default timeout is too short for fh-pro-3d.
client = FotoHub(api_key="fh_live_your_api_key", timeout=180.0)

with open("product.jpg", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

result = client.generate_3d(
    mode="image-to-3d",
    model="fh-lite-3d",
    image=image_b64,
    quality="high",
    format="glb",
)

# Already complete — nothing to poll.
print(f"Download: {result['url']}")
print(f"Took: {result['stats']['duration_ms']} ms")
print(f"Charged: ${result['cost_usd']:.6f}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync } from "fs";

const client = new FotoHub({
  apiKey: "fh_live_your_api_key",
  timeout: 180_000,
});

const imageBase64 = readFileSync("product.jpg").toString("base64");

const result = await client.generate3D({
  mode: "image-to-3d",
  model: "fh-lite-3d",
  image: imageBase64,
  quality: "high",
  format: "glb",
});

console.log(`Download: ${result.url}`);
console.log(`Took: ${result.stats.duration_ms} ms`);
console.log(`Charged: $${result.cost_usd}`);
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
	"time"
)

func main() {
	imageData, _ := os.ReadFile("product.jpg")
	imageB64 := base64.StdEncoding.EncodeToString(imageData)

	payload := map[string]interface{}{
		"mode":         "image-to-3d",
		"model":        "fh-lite-3d",
		"image_base64": imageB64,
		"quality":      "high",
		"format":       "glb",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/3d", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	// Long enough for the slowest model; the call is synchronous.
	client := &http.Client{Timeout: 180 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	fmt.Printf("Download: %s\n", result["url"])
	fmt.Printf("Charged: $%v\n", result["cost_usd"])
}
```

```bash [cURL]
# --max-time, not a polling loop: the model is in this one response.
curl -s --max-time 180 -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "image-to-3d",
    "model": "fh-lite-3d",
    "image_base64": "'$(base64 -w0 product.jpg)'",
    "quality": "high",
    "format": "glb"
  }' | jq '{url: .url, took_ms: .stats.duration_ms, charged: .cost_usd}'
```
:::

---

### Download and Save 3D Model

Download the generated model file to your local filesystem or cloud storage.

::: code-group
```python [Python]
from fotohub import FotoHub
import base64
import requests

client = FotoHub(api_key="fh_live_your_api_key")

with open("sneaker.png", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

# Generate high-quality 3D model
result = client.generate_3d(
    mode="image-to-3d",
    model="fh-pro-3d",
    image=image_b64,
    quality="high",
    format="glb",
    options={"pbr": True, "simplify": True, "target_polys": 50000}
)

# Download the file
response = requests.get(result["url"])
with open("sneaker_3d.glb", "wb") as f:
    f.write(response.content)

print(f"Saved: sneaker_3d.glb ({len(response.content) / 1024:.0f} KB)")
print(f"Charged: ${result['cost_usd']:.6f}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync, writeFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const imageBase64 = readFileSync("sneaker.png").toString("base64");

// Generate high-quality 3D model
const result = await client.generate3D({
  mode: "image-to-3d",
  model: "fh-pro-3d",
  image: imageBase64,
  quality: "high",
  format: "glb",
  options: { pbr: true, simplify: true, targetPolys: 50000 },
});

// Download the file
const response = await fetch(result.url);
const buffer = Buffer.from(await response.arrayBuffer());
writeFileSync("sneaker_3d.glb", buffer);

console.log(`Saved: sneaker_3d.glb (${(buffer.length / 1024).toFixed(0)} KB)`);
console.log(`Charged: $${result.cost_usd}`);
```

```go [Go]
package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"bytes"
)

func main() {
	imageData, _ := os.ReadFile("sneaker.png")
	imageB64 := base64.StdEncoding.EncodeToString(imageData)

	payload := map[string]interface{}{
		"mode":         "image-to-3d",
		"model":        "fh-pro-3d",
		"image_base64": imageB64,
		"quality":      "high",
		"format":       "glb",
		"options":      map[string]interface{}{"pbr": true, "simplify": true, "target_polys": 50000},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/3d", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)

	// Download the 3D model file
	modelURL := result["url"].(string)
	dlResp, _ := http.Get(modelURL)
	defer dlResp.Body.Close()

	outFile, _ := os.Create("sneaker_3d.glb")
	defer outFile.Close()
	written, _ := io.Copy(outFile, dlResp.Body)

	fmt.Printf("Saved: sneaker_3d.glb (%d KB)\n", written/1024)
	fmt.Printf("Charged: $%v\n", result["cost_usd"])
}
```

```bash [cURL]
# Generate the 3D model
RESULT=$(curl -s -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "image-to-3d",
    "model": "fh-pro-3d",
    "image_base64": "'$(base64 -w0 sneaker.png)'",
    "quality": "high",
    "format": "glb",
    "options": {"pbr": true, "simplify": true, "target_polys": 50000}
  }')

# Extract URL and download
MODEL_URL=$(echo $RESULT | jq -r '.url')
curl -o sneaker_3d.glb "$MODEL_URL"
echo "Downloaded: sneaker_3d.glb"
echo "Charged: $(echo $RESULT | jq -r '.cost_usd') USD"
```
:::

---

### Format Selection and Conversion

Generate the same model in multiple formats for different use cases.

::: code-group
```python [Python]
from fotohub import FotoHub
import base64

client = FotoHub(api_key="fh_live_your_api_key")

with open("product.jpg", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

# Generate in multiple formats for different platforms
formats = {
    "glb": "Web viewer and AR",
    "usdz": "iOS AR Quick Look",
    "stl": "3D printing",
    "obj": "3D editing software",
}

for fmt, use_case in formats.items():
    result = client.generate_3d(
        mode="image-to-3d",
        model="fh-lite-3d",
        image=image_b64,
        format=fmt,
    )
    print(f"  {fmt.upper()} ({use_case}): {result['url']}")
    print(f"    File size: {result['stats']['file_size_bytes'] / 1024:.0f} KB")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const imageBase64 = readFileSync("product.jpg").toString("base64");

// Generate in multiple formats
const formats = ["glb", "usdz", "stl", "obj"] as const;

for (const format of formats) {
  const result = await client.generate3D({
    mode: "image-to-3d",
    model: "fh-lite-3d",
    image: imageBase64,
    format,
  });
  console.log(`${format.toUpperCase()}: ${result.url} (${(result.stats.file_size_bytes / 1024).toFixed(0)} KB)`);
}
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

	formats := []string{"glb", "usdz", "stl", "obj"}

	for _, format := range formats {
		payload := map[string]interface{}{
			"mode":         "image-to-3d",
			"model":        "fh-lite-3d",
			"image_base64": imageB64,
			"format":       format,
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/3d", bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
		req.Header.Set("Content-Type", "application/json")

		resp, _ := http.DefaultClient.Do(req)
		respBody, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		var result map[string]interface{}
		json.Unmarshal(respBody, &result)
		stats := result["stats"].(map[string]interface{})
		fmt.Printf("%s: %s (%.0f KB)\n", format, result["url"], stats["file_size_bytes"].(float64)/1024)
	}
}
```

```bash [cURL]
# Generate GLB for web
curl -s -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "image-to-3d",
    "model": "fh-lite-3d",
    "image_base64": "'$(base64 -w0 product.jpg)'",
    "format": "glb"
  }' | jq '{url: .url, size_kb: (.stats.file_size_bytes / 1024), charged: .cost_usd}'

# Generate USDZ for iOS AR
curl -s -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "image-to-3d",
    "model": "fh-lite-3d",
    "image_base64": "'$(base64 -w0 product.jpg)'",
    "format": "usdz"
  }' | jq '{url: .url, size_kb: (.stats.file_size_bytes / 1024), charged: .cost_usd}'

# Generate STL for 3D printing
curl -s -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "image-to-3d",
    "model": "fh-lite-3d",
    "image_base64": "'$(base64 -w0 product.jpg)'",
    "format": "stl"
  }' | jq '{url: .url, size_kb: (.stats.file_size_bytes / 1024), charged: .cost_usd}'
```
:::

---

### Batch Generation for E-Commerce

Generate 3D product views for multiple items in an e-commerce catalog.

::: code-group
```python [Python]
from fotohub import FotoHub
import base64
import os

client = FotoHub(api_key="fh_live_your_api_key")

# Process all product images in a directory
product_dir = "./product_photos"
results = []

for filename in os.listdir(product_dir):
    if not filename.endswith((".jpg", ".png", ".webp")):
        continue

    filepath = os.path.join(product_dir, filename)
    with open(filepath, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode()

    result = client.generate_3d(
        mode="image-to-3d",
        model="fh-lite-3d",  # Fast model for batch processing
        image=image_b64,
        format="glb",
        quality="standard",
    )

    results.append({
        "product": filename,
        "model_url": result["url"],
        "cost_usd": result["cost_usd"],
    })
    print(f"Generated: {filename} -> {result['url']}")

# Sum what you were actually charged rather than multiplying a hardcoded rate:
# a repricing would silently invalidate the second form.
total = sum(r["cost_usd"] for r in results)
print(f"\nTotal: {len(results)} models, ${total:.6f} charged")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync, readdirSync } from "fs";
import { join, extname } from "path";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const productDir = "./product_photos";
const files = readdirSync(productDir).filter(f =>
  [".jpg", ".png", ".webp"].includes(extname(f))
);

const results = [];

for (const filename of files) {
  const imageBase64 = readFileSync(join(productDir, filename)).toString("base64");

  const result = await client.generate3D({
    mode: "image-to-3d",
    model: "fh-lite-3d",
    image: imageBase64,
    format: "glb",
    quality: "standard",
  });

  results.push({
    product: filename,
    modelUrl: result.url,
    costUsd: result.cost_usd,
  });
  console.log(`Generated: ${filename} -> ${result.url}`);
}

const total = results.reduce((sum, r) => sum + r.costUsd, 0);
console.log(`\nTotal: ${results.length} models, $${total.toFixed(6)} charged`);
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
	"path/filepath"
	"strings"
)

func main() {
	productDir := "./product_photos"
	entries, _ := os.ReadDir(productDir)

	var count int
	var totalUSD float64
	for _, entry := range entries {
		ext := strings.ToLower(filepath.Ext(entry.Name()))
		if ext != ".jpg" && ext != ".png" && ext != ".webp" {
			continue
		}

		imageData, _ := os.ReadFile(filepath.Join(productDir, entry.Name()))
		imageB64 := base64.StdEncoding.EncodeToString(imageData)

		payload := map[string]interface{}{
			"mode":         "image-to-3d",
			"model":        "fh-lite-3d",
			"image_base64": imageB64,
			"format":       "glb",
			"quality":      "standard",
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/3d", bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
		req.Header.Set("Content-Type", "application/json")

		resp, _ := http.DefaultClient.Do(req)
		respBody, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		var result map[string]interface{}
		json.Unmarshal(respBody, &result)
		fmt.Printf("Generated: %s -> %s\n", entry.Name(), result["url"])
		count++
		if c, ok := result["cost_usd"].(float64); ok {
			totalUSD += c
		}
	}
	fmt.Printf("\nTotal: %d models, $%.6f charged\n", count, totalUSD)
}
```

```bash [cURL]
# Batch process all JPGs in current directory
for file in product_photos/*.jpg; do
  echo "Processing: $file"
  curl -s -X POST https://apis.fotohub.app/v1/ai/generate/3d \
    -H "Authorization: Bearer fh_live_your_api_key" \
    -H "Content-Type: application/json" \
    -d '{
      "mode": "image-to-3d",
      "model": "fh-lite-3d",
      "image_base64": "'$(base64 -w0 "$file")'",
      "format": "glb",
      "quality": "standard"
    }' | jq '{file: "'$file'", url: .url, charged: .cost_usd}'
done
```
:::

---

### Polygon Simplification

Reduce polygon count for mobile or web use while maintaining visual quality.

::: code-group
```python [Python]
from fotohub import FotoHub
import base64

client = FotoHub(api_key="fh_live_your_api_key")

with open("detailed_sculpture.jpg", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

# Generate with polygon simplification for mobile AR
result = client.generate_3d(
    mode="image-to-3d",
    model="fh-pro-3d",
    image=image_b64,
    format="glb",
    quality="high",
    options={
        "simplify": True,
        "target_polys": 25000,  # Mobile-friendly polygon count
        "texture": True,
    }
)

print(f"File size: {result['stats']['file_size_bytes'] / 1024:.0f} KB")
print(f"URL: {result['url']}")
print(f"Charged: ${result['cost_usd']:.6f}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const imageBase64 = readFileSync("detailed_sculpture.jpg").toString("base64");

// Generate with polygon simplification for mobile AR
const result = await client.generate3D({
  mode: "image-to-3d",
  model: "fh-pro-3d",
  image: imageBase64,
  format: "glb",
  quality: "high",
  options: {
    simplify: true,
    targetPolys: 25000,
    texture: true,
  },
});

console.log(`File size: ${(result.stats.file_size_bytes / 1024).toFixed(0)} KB`);
console.log(`Charged: $${result.cost_usd}`);
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
	imageData, _ := os.ReadFile("detailed_sculpture.jpg")
	imageB64 := base64.StdEncoding.EncodeToString(imageData)

	payload := map[string]interface{}{
		"mode":         "image-to-3d",
		"model":        "fh-pro-3d",
		"image_base64": imageB64,
		"format":       "glb",
		"quality":      "high",
		"options": map[string]interface{}{
			"simplify":     true,
			"target_polys": 25000,
			"texture":      true,
		},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/3d", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	stats := result["stats"].(map[string]interface{})
	fmt.Printf("File size: %.0f KB\n", stats["file_size_bytes"].(float64)/1024)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "image-to-3d",
    "model": "fh-pro-3d",
    "image_base64": "'$(base64 -w0 detailed_sculpture.jpg)'",
    "format": "glb",
    "quality": "high",
    "options": {
      "simplify": true,
      "target_polys": 25000,
      "texture": true
    }
  }' | jq '{size_kb: (.stats.file_size_bytes / 1024), url: .url, charged: .cost_usd}'
```
:::

---

## Retrieve a Generated Model

```
GET /v1/ai/generate/3d/{file_id}
```

Not a status endpoint — the generation is already complete when the POST returns. This exists for one reason: the `url` you got back is a signed link that expires after 2 hours, and this re-signs it. Pass the `file_id` from the generate response. **Free — no charge is taken.**

Returns `404` if no asset with that id belongs to your account. `status` is always `"completed"`, because an incomplete generation is never stored.

::: code-group
```python [Python]
asset = client.get_3d_status("8f3k2j1m-4n5p-4a2b-9c1d-3e4f5a6b7c8d")
print(f"Fresh URL: {asset['url']}")     # valid another hour
print(f"Model: {asset['model']}, format: {asset['format']}")
```

```typescript [TypeScript]
const asset = await client.get3DStatus("8f3k2j1m-4n5p-4a2b-9c1d-3e4f5a6b7c8d");
console.log(`Fresh URL: ${asset.url}`);
console.log(`Model: ${asset.model}, format: ${asset.format}`);
```

```go [Go]
req, _ := http.NewRequest("GET",
    "https://apis.fotohub.app/v1/ai/generate/3d/8f3k2j1m-4n5p-4a2b-9c1d-3e4f5a6b7c8d", nil)
req.Header.Set("Authorization", "Bearer fh_live_your_api_key")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
body, _ := io.ReadAll(resp.Body)

var asset map[string]interface{}
json.Unmarshal(body, &asset)
fmt.Printf("Fresh URL: %s\n", asset["url"])
```

```bash [cURL]
curl https://apis.fotohub.app/v1/ai/generate/3d/8f3k2j1m-4n5p-4a2b-9c1d-3e4f5a6b7c8d \
  -H "Authorization: Bearer fh_live_your_api_key" | jq '.url'
```
:::

---

## List Available Models

```
GET /v1/ai/generate/3d/models
```

Returns all 3D models with current availability, pricing, and capabilities.

::: code-group
```python [Python]
models = client.list_3d_models()
for m in models:
    print(f"{m['id']}: {m['name']} — ${m['price_usd']:.6f}, {m['mode']}, available={m['available']}")
```

```typescript [TypeScript]
const models = await client.list3DModels();
models.forEach(m => console.log(`${m.id}: ${m.name} — $${m.price_usd} (${m.mode})`));
```

```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/ai/generate/3d/models", nil)
req.Header.Set("Authorization", "Bearer fh_live_your_api_key")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
body, _ := io.ReadAll(resp.Body)
fmt.Println(string(body))
```

```bash [cURL]
curl https://apis.fotohub.app/v1/ai/generate/3d/models \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

---

## Model Comparison

| Feature | `fh-lite-3d` | `fh-text-3d` | `fh-pro-3d` |
|---------|--------------|--------------|-------------|
| Image-to-3D | Yes | No | Yes |
| Text-to-3D | No | Yes | No |
| PBR Materials | No | No | Yes |
| Texture Maps | Vertex only | Vertex only | Full PBR set |
| Simplification | Yes | No | Yes |
| GLB / OBJ / STL | Yes | Yes | Yes |
| USDZ | Yes | Yes | Yes |
| Speed | ~3s | ~25s | ~60s |
| Price (USD) | $0.160772 | $0.267953 | $0.803859 |
| Callable today | Yes | Yes | No (`available: false`) |

::: tip This table was wrong in three ways
It had five value columns under three headers, so `USDZ`, `Speed` and the price row were misaligned; it listed prices in credits, which this API does not accept; and the speeds contradicted the model table above. The figures here match `GET /v1/ai/generate/3d/models`.
:::

### When to Use Each Model

Only `fh-lite-3d` and `fh-text-3d` are callable today, so every row naming `fh-pro-3d` describes what it will be for once enabled.

| Scenario | Recommended Model | Reasoning |
|----------|-------------------|-----------|
| Quick product preview | `fh-lite-3d` | Fastest and cheapest per attempt |
| Rapid prototyping iteration | `fh-lite-3d` | ~3s round trip |
| Text-based concept art | `fh-text-3d` | The only text-to-3D option |
| Batch processing (100+ items) | `fh-lite-3d` | Lowest cost, lowest latency |
| E-commerce product page | `fh-pro-3d` (pending) | Clean topology, full texture set |
| Game-ready assets | `fh-pro-3d` (pending) | Full PBR material set |
| 3D printing | `fh-lite-3d` today | STL discards colour anyway, so the cheaper mesh is usually enough |

---

## Performance Tips

- **Image quality matters**: For image-to-3d, use clean product photos with a solid or simple background for best results. Remove background first using the [Image Editing](/api/image-editing) endpoint.
- **Choose the right model**: `fh-lite-3d` for previews and batches, `fh-text-3d` when you have no reference photo.
- **Format selection**: Use GLB for web/AR, STL for 3D printing, USDZ for iOS AR Quick Look.
- **Set a long timeout, do not poll**: the call is synchronous. Allow up to 180s and skip the polling loop — there is no queue.
- **Save the file**: `url` is signed for 2 hours. Download and store it, or re-sign later with `GET /v1/ai/generate/3d/{file_id}`.
- **Polygon budgets**: Mobile AR typically needs <50,000 polygons. Web viewers work well with <100,000. Use `simplify` + `target_polys` to control output.
- **File size optimization**: Draft quality produces files 60-70% smaller than high quality. Use draft for previews.

---

## Rate Limits

Rate limits are per API tier, not per endpoint — see `GET /v1/tiers` for your own. The lowest tier starts at 30 requests per minute and 3 concurrent jobs.

| Limit | Value |
|-------|-------|
| Requests per minute | Per tier (30 and up) |
| Concurrent jobs | Per tier (3 and up) |
| Max image upload size | 20 MB |
| Prompt length | 500 characters |
| Signed `url` lifetime | 2 hours (re-sign anytime) |

The generated `.glb` is stored in your Files and is not auto-deleted; a previous version of this page claimed a 48-hour result retention, which applied to nothing.

---

## Pricing

Charged in USD from your prepaid wallet, at our provider cost with no markup.

| Model | Price per Generation |
|-------|---------------------|
| FH Lite 3D (`fh-lite-3d`) | $0.160772 |
| FH Text 3D (`fh-text-3d`) | $0.267953 |
| FH Pro 3D (`fh-pro-3d`) | $0.803859 |

::: info What does and does not change the price
Quality (`draft`/`standard`/`high`) and output format do not affect the price — you pay the per-generation rate above regardless. Retrieving an asset with `GET /v1/ai/generate/3d/{file_id}` is free, and a generation that fails on our side is refunded to your wallet automatically.
:::

`GET /v1/pricing` is the live source for these figures; the table here is a snapshot. See [Billing & Pricing](/api/billing) for wallet top-ups and invoice settings.

---

## Related APIs

- [Image Editing](/api/image-editing) — Remove backgrounds before 3D generation
- [Image Generation](/api/image-generation) — Generate source images for text-to-3D workflows
- [Models](/api/models) — Full model catalog and status
- [Billing & Pricing](/api/billing) — Wallet top-ups, live prices and invoice settings
