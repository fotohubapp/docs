# 3D Generation

Generate 3D models from images or text prompts using FOTOhub's unified API. Convert product photos to 3D assets, create 3D models from descriptions, and export in industry-standard formats.

::: info Overview
The 3D Generation API supports five models ranging from instant previews (under 1 second) to production-grade assets with PBR materials. All models output industry-standard formats compatible with web viewers, game engines, 3D printers, and AR applications.
:::

---

## Endpoint

```
POST /v1/ai/generate/3d
```

**Authentication:** Bearer token (API key)
**Billing:** 5-25 credits per generation (varies by model)
**Processing:** Synchronous for fast models (triposr, sf3d), asynchronous for others

---

## Available Models

| Model | Name | Credits | Speed | Modes | Quality |
|-------|------|---------|-------|-------|---------|
| `triposr` | FH Lite 3D | 5 | ~3s | image-to-3d | Moderate fidelity, fast iteration |
| `sf3d` | FH Fast 3D | 5 | <1s | image-to-3d | Good detail, instant results |
| `shap-e` | FH Text 3D | 10 | ~15s | text-to-3d | Text-based, creative exploration |
| `trellis` | FH HD 3D | 15 | ~15s | image-to-3d | High detail, clean topology |
| `hunyuan3d` | FH Pro 3D | 25 | ~30s | both | Production-grade, PBR materials |

### Model Details

#### TripoSR (FH Lite 3D)

Best for quick previews and rapid prototyping. Processes single images into basic 3D meshes in approximately 3 seconds. Ideal when you need fast feedback during the creative process before committing to higher-quality generation.

- **Input:** Single image (PNG, JPG, WebP)
- **Output:** Mesh with basic vertex colors
- **Polygon count:** 20,000-60,000
- **Texture:** Basic vertex coloring

#### SF3D (FH Fast 3D)

The fastest model in the pipeline, delivering results in under 1 second. Uses a feed-forward architecture that produces surprisingly detailed meshes with proper UV mapping and texture maps.

- **Input:** Single image (PNG, JPG, WebP)
- **Output:** Textured mesh with UV maps
- **Polygon count:** 30,000-80,000
- **Texture:** Diffuse map (1024x1024)

#### Shap-E (FH Text 3D)

The only model supporting pure text-to-3D generation without reference images. Best for creative exploration and concept generation from descriptions. Results are lower fidelity but useful for ideation.

- **Input:** Text prompt (up to 500 characters)
- **Output:** Mesh with vertex colors
- **Polygon count:** 10,000-40,000
- **Texture:** Vertex coloring only

#### Trellis (FH HD 3D)

High-quality image-to-3D with clean topology suitable for further editing. Produces meshes with proper edge flow and consistent polygon density, making them ideal for import into 3D editing software.

- **Input:** Single image (PNG, JPG, WebP)
- **Output:** Clean-topology mesh with textures
- **Polygon count:** 50,000-120,000
- **Texture:** Diffuse + Normal maps (2048x2048)

#### Hunyuan3D (FH Pro 3D)

Production-grade model supporting both image-to-3D and text-to-3D. Generates complete PBR material sets (albedo, normal, roughness, metallic) suitable for game engines and professional 3D workflows.

- **Input:** Image OR text prompt
- **Output:** PBR-ready mesh with full material set
- **Polygon count:** 60,000-150,000
- **Texture:** Full PBR set (albedo, normal, roughness, metallic) at 2048x2048

---

## Generation Modes

### Image-to-3D

Convert a single photograph or rendered image into a 3D model. The input image should show the object clearly against a simple background. Works with all models except `shap-e`.

**Best practices:**
- Use images with clean, solid backgrounds (white/gray preferred)
- Ensure the subject fills 60-80% of the frame
- Use well-lit photos without harsh shadows
- Remove background first using the [Image Editing](/api/image-editing) API for best results

### Text-to-3D

Generate a 3D model from a text description. Currently supported by `shap-e` and `hunyuan3d`.

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
| `pbr` | boolean | Generate PBR materials (hunyuan3d only) |
| `simplify` | boolean | Reduce polygon count |
| `target_polys` | integer | Target polygon count when simplify is true |

---

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

### Error Response

```json
{
  "error": {
    "code": "invalid_image",
    "message": "Unable to detect a clear subject in the provided image. Ensure the object is clearly visible against a simple background.",
    "credits_refunded": 5
  }
}
```

Common error codes:

| Code | Description |
|------|-------------|
| `invalid_image` | Image cannot be processed (corrupt, no clear subject) |
| `invalid_prompt` | Text prompt is empty or too short |
| `model_unavailable` | Requested model is temporarily offline |
| `mode_not_supported` | Model does not support the requested mode |
| `generation_failed` | Internal rendering error (credits refunded) |
| `file_too_large` | Input image exceeds 20MB limit |

---

## Examples

### Basic Image-to-3D Generation

Generate a 3D model from a product photo using the fast TripoSR model.

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
    model="triposr",
    image=image_b64,
    format="glb",
)

print(f"3D Model: {result['url']}")
print(f"Polygons: {result['poly_count']}")
print(f"Credits used: {result['billing']['credits_used']}")
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
  model: "triposr",
  image: imageBase64,
  format: "glb",
});

console.log(`3D Model: ${result.url}`);
console.log(`Polygons: ${result.polyCount}`);
console.log(`Credits used: ${result.billing.creditsUsed}`);
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
		"model":        "triposr",
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
	fmt.Printf("Polygons: %.0f\n", result["poly_count"])
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "image-to-3d",
    "model": "triposr",
    "image_base64": "'$(base64 -w0 product.jpg)'",
    "format": "glb",
    "quality": "standard"
  }'
```
:::

---

### Text-to-3D Generation

Generate a 3D model from a text prompt using Hunyuan3D for maximum quality.

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Generate 3D model from text description
result = client.generate_3d(
    mode="text-to-3d",
    model="hunyuan3d",
    prompt="A medieval stone castle with four towers and a drawbridge",
    quality="high",
    format="glb",
    options={"pbr": True}
)

print(f"3D Model: {result['url']}")
print(f"Format: {result['format']}")
print(f"File size: {result['file_size'] / 1024 / 1024:.1f} MB")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Generate 3D model from text description
const result = await client.generate3D({
  mode: "text-to-3d",
  model: "hunyuan3d",
  prompt: "A medieval stone castle with four towers and a drawbridge",
  quality: "high",
  format: "glb",
  options: { pbr: true },
});

console.log(`3D Model: ${result.url}`);
console.log(`Format: ${result.format}`);
console.log(`File size: ${(result.fileSize / 1024 / 1024).toFixed(1)} MB`);
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
		"model":   "hunyuan3d",
		"prompt":  "A medieval stone castle with four towers and a drawbridge",
		"quality": "high",
		"format":  "glb",
		"options": map[string]interface{}{"pbr": true},
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
	fmt.Printf("Format: %s\n", result["format"])
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "text-to-3d",
    "model": "hunyuan3d",
    "prompt": "A medieval stone castle with four towers and a drawbridge",
    "quality": "high",
    "format": "glb",
    "options": {"pbr": true}
  }'
```
:::

---

### Async Generation with Polling

For models like `trellis` and `hunyuan3d` that take 15-30 seconds, use async polling to check job status.

::: code-group
```python [Python]
from fotohub import FotoHub
import base64
import time

client = FotoHub(api_key="fh_live_your_api_key")

with open("product.jpg", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

# Submit generation job
job = client.generate_3d(
    mode="image-to-3d",
    model="trellis",
    image=image_b64,
    quality="high",
    format="glb",
)

# If job is still processing, poll for completion
if job["status"] != "completed":
    job_id = job["id"]
    while True:
        status = client.get_3d_status(job_id)
        print(f"Status: {status['status']}")
        if status["status"] == "completed":
            print(f"Download: {status['url']}")
            break
        elif status["status"] == "failed":
            print(f"Error: {status['error']}")
            break
        time.sleep(3)
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const imageBase64 = readFileSync("product.jpg").toString("base64");

// Submit generation job
const job = await client.generate3D({
  mode: "image-to-3d",
  model: "trellis",
  image: imageBase64,
  quality: "high",
  format: "glb",
});

// Use waitFor3D helper for automatic polling
const completed = await client.waitFor3D(job.id, {
  pollInterval: 3000,
  onProgress: (status) => console.log(`Status: ${status.status}`),
});

console.log(`Download: ${completed.url}`);
console.log(`Polygons: ${completed.polyCount}`);
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
		"model":        "trellis",
		"image_base64": imageB64,
		"quality":      "high",
		"format":       "glb",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/3d", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var job map[string]interface{}
	json.Unmarshal(respBody, &job)

	// Poll for completion
	jobID := job["id"].(string)
	for {
		pollReq, _ := http.NewRequest("GET",
			fmt.Sprintf("https://apis.fotohub.app/v1/ai/generate/3d/%s", jobID), nil)
		pollReq.Header.Set("Authorization", "Bearer fh_live_your_api_key")

		pollResp, _ := http.DefaultClient.Do(pollReq)
		pollBody, _ := io.ReadAll(pollResp.Body)
		pollResp.Body.Close()

		var status map[string]interface{}
		json.Unmarshal(pollBody, &status)

		fmt.Printf("Status: %s\n", status["status"])
		if status["status"] == "completed" {
			fmt.Printf("Download: %s\n", status["url"])
			break
		} else if status["status"] == "failed" {
			fmt.Printf("Error: %v\n", status["error"])
			break
		}
		time.Sleep(3 * time.Second)
	}
}
```

```bash [cURL]
# Submit job
JOB_ID=$(curl -s -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "image-to-3d",
    "model": "trellis",
    "image_base64": "'$(base64 -w0 product.jpg)'",
    "quality": "high",
    "format": "glb"
  }' | jq -r '.id')

echo "Job submitted: $JOB_ID"

# Poll for completion
while true; do
  STATUS=$(curl -s https://apis.fotohub.app/v1/ai/generate/3d/$JOB_ID \
    -H "Authorization: Bearer fh_live_your_api_key" | jq -r '.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "completed" ]; then
    curl -s https://apis.fotohub.app/v1/ai/generate/3d/$JOB_ID \
      -H "Authorization: Bearer fh_live_your_api_key" | jq '.url'
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Generation failed"
    break
  fi
  sleep 3
done
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
    model="hunyuan3d",
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
print(f"Thumbnail: {result['thumbnail_url']}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync, writeFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const imageBase64 = readFileSync("sneaker.png").toString("base64");

// Generate high-quality 3D model
const result = await client.generate3D({
  mode: "image-to-3d",
  model: "hunyuan3d",
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
console.log(`Thumbnail: ${result.thumbnailUrl}`);
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
		"model":        "hunyuan3d",
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
	fmt.Printf("Thumbnail: %s\n", result["thumbnail_url"])
}
```

```bash [cURL]
# Generate the 3D model
RESULT=$(curl -s -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "image-to-3d",
    "model": "hunyuan3d",
    "image_base64": "'$(base64 -w0 sneaker.png)'",
    "quality": "high",
    "format": "glb",
    "options": {"pbr": true, "simplify": true, "target_polys": 50000}
  }')

# Extract URL and download
MODEL_URL=$(echo $RESULT | jq -r '.url')
curl -o sneaker_3d.glb "$MODEL_URL"
echo "Downloaded: sneaker_3d.glb"
echo "Thumbnail: $(echo $RESULT | jq -r '.thumbnail_url')"
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
        model="sf3d",
        image=image_b64,
        format=fmt,
    )
    print(f"  {fmt.upper()} ({use_case}): {result['url']}")
    print(f"    File size: {result['file_size'] / 1024:.0f} KB")
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
    model: "sf3d",
    image: imageBase64,
    format,
  });
  console.log(`${format.toUpperCase()}: ${result.url} (${(result.fileSize / 1024).toFixed(0)} KB)`);
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
			"model":        "sf3d",
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
		fmt.Printf("%s: %s (%.0f KB)\n", format, result["url"], result["file_size"].(float64)/1024)
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
    "model": "sf3d",
    "image_base64": "'$(base64 -w0 product.jpg)'",
    "format": "glb"
  }' | jq '{format: .format, url: .url, size_kb: (.file_size / 1024)}'

# Generate USDZ for iOS AR
curl -s -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "image-to-3d",
    "model": "sf3d",
    "image_base64": "'$(base64 -w0 product.jpg)'",
    "format": "usdz"
  }' | jq '{format: .format, url: .url, size_kb: (.file_size / 1024)}'

# Generate STL for 3D printing
curl -s -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "image-to-3d",
    "model": "sf3d",
    "image_base64": "'$(base64 -w0 product.jpg)'",
    "format": "stl"
  }' | jq '{format: .format, url: .url, size_kb: (.file_size / 1024)}'
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
        model="sf3d",  # Fast model for batch processing
        image=image_b64,
        format="glb",
        quality="standard",
    )

    results.append({
        "product": filename,
        "model_url": result["url"],
        "thumbnail": result["thumbnail_url"],
    })
    print(f"Generated: {filename} -> {result['url']}")

print(f"\nTotal: {len(results)} models generated")
print(f"Credits used: {len(results) * 5}")
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
    model: "sf3d",
    image: imageBase64,
    format: "glb",
    quality: "standard",
  });

  results.push({
    product: filename,
    modelUrl: result.url,
    thumbnail: result.thumbnailUrl,
  });
  console.log(`Generated: ${filename} -> ${result.url}`);
}

console.log(`\nTotal: ${results.length} models, ${results.length * 5} credits`);
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
	for _, entry := range entries {
		ext := strings.ToLower(filepath.Ext(entry.Name()))
		if ext != ".jpg" && ext != ".png" && ext != ".webp" {
			continue
		}

		imageData, _ := os.ReadFile(filepath.Join(productDir, entry.Name()))
		imageB64 := base64.StdEncoding.EncodeToString(imageData)

		payload := map[string]interface{}{
			"mode":         "image-to-3d",
			"model":        "sf3d",
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
	}
	fmt.Printf("\nTotal: %d models, %d credits\n", count, count*5)
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
      "model": "sf3d",
      "image_base64": "'$(base64 -w0 "$file")'",
      "format": "glb",
      "quality": "standard"
    }' | jq '{file: "'$file'", url: .url, polys: .poly_count}'
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
    model="trellis",
    image=image_b64,
    format="glb",
    quality="high",
    options={
        "simplify": True,
        "target_polys": 25000,  # Mobile-friendly polygon count
        "texture": True,
    }
)

print(f"Polygon count: {result['poly_count']}")
print(f"File size: {result['file_size'] / 1024:.0f} KB")
print(f"URL: {result['url']}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const imageBase64 = readFileSync("detailed_sculpture.jpg").toString("base64");

// Generate with polygon simplification for mobile AR
const result = await client.generate3D({
  mode: "image-to-3d",
  model: "trellis",
  image: imageBase64,
  format: "glb",
  quality: "high",
  options: {
    simplify: true,
    targetPolys: 25000,
    texture: true,
  },
});

console.log(`Polygon count: ${result.polyCount}`);
console.log(`File size: ${(result.fileSize / 1024).toFixed(0)} KB`);
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
		"model":        "trellis",
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
	fmt.Printf("Polygons: %.0f\n", result["poly_count"])
	fmt.Printf("File size: %.0f KB\n", result["file_size"].(float64)/1024)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "image-to-3d",
    "model": "trellis",
    "image_base64": "'$(base64 -w0 detailed_sculpture.jpg)'",
    "format": "glb",
    "quality": "high",
    "options": {
      "simplify": true,
      "target_polys": 25000,
      "texture": true
    }
  }' | jq '{polys: .poly_count, size_kb: (.file_size / 1024), url: .url}'
```
:::

---

## Check Job Status

For longer-running models, poll the status endpoint:

```
GET /v1/ai/generate/3d/{job_id}
```

::: code-group
```python [Python]
status = client.get_3d_status("3d_gen_8f3k2j1m4n5p")
print(f"Status: {status['status']}")
if status["status"] == "completed":
    print(f"URL: {status['url']}")
```

```typescript [TypeScript]
const status = await client.get3DStatus("3d_gen_8f3k2j1m4n5p");
console.log(`Status: ${status.status}`);
if (status.status === "completed") {
  console.log(`URL: ${status.url}`);
}
```

```go [Go]
req, _ := http.NewRequest("GET",
    "https://apis.fotohub.app/v1/ai/generate/3d/3d_gen_8f3k2j1m4n5p", nil)
req.Header.Set("Authorization", "Bearer fh_live_your_api_key")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
body, _ := io.ReadAll(resp.Body)

var status map[string]interface{}
json.Unmarshal(body, &status)
fmt.Printf("Status: %s\n", status["status"])
```

```bash [cURL]
curl https://apis.fotohub.app/v1/ai/generate/3d/3d_gen_8f3k2j1m4n5p \
  -H "Authorization: Bearer fh_live_your_api_key"
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
    print(f"{m['id']}: {m['name']} — {m['credits']} credits, modes: {m['modes']}")
```

```typescript [TypeScript]
const models = await client.list3DModels();
models.forEach(m => console.log(`${m.id}: ${m.name} — ${m.credits} credits`));
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

| Feature | triposr | sf3d | shap-e | trellis | hunyuan3d |
|---------|---------|------|--------|---------|-----------|
| Image-to-3D | Yes | Yes | No | Yes | Yes |
| Text-to-3D | No | No | Yes | No | Yes |
| PBR Materials | No | No | No | No | Yes |
| Texture Maps | Vertex only | Diffuse | Vertex only | Diffuse+Normal | Full PBR set |
| Max Polygons | 60K | 80K | 40K | 120K | 150K |
| Simplification | Yes | Yes | No | Yes | Yes |
| GLB | Yes | Yes | Yes | Yes | Yes |
| OBJ | Yes | Yes | Yes | Yes | Yes |
| STL | Yes | Yes | Yes | Yes | Yes |
| USDZ | Yes | Yes | No | Yes | Yes |
| Speed | ~3s | <1s | ~15s | ~15s | ~30s |
| Credits | 5 | 5 | 10 | 15 | 25 |

### When to Use Each Model

| Scenario | Recommended Model | Reasoning |
|----------|-------------------|-----------|
| Quick product preview | `sf3d` | Instant results, good quality |
| Rapid prototyping iteration | `triposr` | Fast, low cost per attempt |
| Text-based concept art | `shap-e` | Only text-to-3D option (budget) |
| E-commerce product page | `trellis` | Clean topology, HD textures |
| Game-ready assets | `hunyuan3d` | Full PBR material set |
| 3D printing | `trellis` | Clean manifold mesh |
| iOS AR Quick Look | `hunyuan3d` | Best USDZ output with materials |
| Batch processing (100+ items) | `sf3d` | Fastest, lowest credit cost |
| Client presentation | `hunyuan3d` | Highest visual quality |

---

## Performance Tips

- **Image quality matters**: For image-to-3d, use clean product photos with a solid or simple background for best results. Remove background first using the [Image Editing](/api/image-editing) endpoint.
- **Choose the right model**: Use `sf3d` for instant previews (5 credits, <1s), `trellis` or `hunyuan3d` for production assets.
- **Format selection**: Use GLB for web/AR, STL for 3D printing, USDZ for iOS AR Quick Look.
- **Polling**: Models like `trellis` and `hunyuan3d` take 15-30s. Use the `waitFor3D` SDK method or poll `/v1/ai/generate/3d/{id}` every 3 seconds.
- **Batch efficiency**: For large catalogs, use `sf3d` (cheapest, fastest) first, then regenerate hero products with `hunyuan3d`.
- **Polygon budgets**: Mobile AR typically needs <50,000 polygons. Web viewers work well with <100,000. Use `simplify` + `target_polys` to control output.
- **File size optimization**: Draft quality produces files 60-70% smaller than high quality. Use draft for thumbnails and previews.

---

## Rate Limits

| Limit | Value |
|-------|-------|
| Requests per minute | 10 |
| Max concurrent jobs | 5 |
| Max image upload size | 20 MB |
| Job result retention | 48 hours |

---

## Pricing

| Model | Credits per Generation | Approx. PLN |
|-------|----------------------|-------------|
| FH Lite 3D (triposr) | 5 | 0.75 PLN |
| FH Fast 3D (sf3d) | 5 | 0.75 PLN |
| FH Text 3D (shap-e) | 10 | 1.50 PLN |
| FH HD 3D (trellis) | 15 | 2.25 PLN |
| FH Pro 3D (hunyuan3d) | 25 | 3.75 PLN |

::: info Credit Costs
Quality settings do not affect credit cost — you pay the same whether using draft, standard, or high quality. Format selection also does not change pricing.
:::

See [Billing & Pricing](/api/billing) for credit package details and tier information.

---

## Related APIs

- [Image Editing](/api/image-editing) — Remove backgrounds before 3D generation
- [Image Generation](/api/image-generation) — Generate source images for text-to-3D workflows
- [Models](/api/models) — Full model catalog and status
- [Billing & Pricing](/api/billing) — Credit packages and tier discounts
