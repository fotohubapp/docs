# Image Editing

The Image Editing API provides AI-powered image manipulation. Two endpoints, split by what
they do: `POST /v1/ai/edit/image` covers inpainting, outpainting, background replacement
and object removal at a flat $0.04, and `POST /stability/{tool_id}` covers upscaling,
style transfer and ten other specialized tools at their own prices.

::: info Overview
Powered by Google Imagen 3 for photorealistic results. Every edit mode costs **$0.04**, charged from your prepaid USD wallet, at every image size and in every mode. Additionally, 13 specialized tools from Stability AI are available for advanced editing workflows — those are priced individually, from $0.03 to $0.60 per image.
:::

---

## Endpoint

```
POST /v1/ai/edit/image
```

**Authentication:** Bearer token (API key)  
**Billing:** $0.04 per request, from the prepaid USD wallet

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | Yes | — | URL of the source image to edit. Fetched server-side, so it must be publicly reachable — private and link-local addresses are refused, and a URL carrying credentials is refused. JPEG, PNG or WebP. No size ceiling is enforced on our side; oversized inputs fail at the provider (and are refunded), so keep to 4096x4096 or smaller. |
| `prompt` | string | Yes | — | Natural language instruction describing the desired edit. Be specific and descriptive for best results. For inpaint/bgswap, describe what should appear. For remove, describe the object to remove. |
| `mode` | string | No | `inpaint` | Editing operation to perform. One of: `inpaint`, `outpaint`, `bgswap`, `remove`. Any other value — including `upscale` — falls back to `inpaint`; see the note below. |
| `mask_url` | string | No | — | URL of the mask image for inpainting, fetched under the same rules as `image_url`. Must be the same dimensions as the source. White pixels (255) mark areas to edit, black pixels (0) areas to preserve. Wanted for `inpaint`, but **not enforced** — see [Error Responses](#error-responses). |
| `output` | object | No | — | Deliver the result to your own S3 bucket instead of a signed FOTOhub URL. Same shape as on the generation endpoints — see [bucket delivery](/guides/bucket-delivery). |

::: warning `upscale`, `model`, `output_format` and `num_outputs` are not implemented
Earlier versions of this page listed all four. Only the parameters in the table above
reach the provider:

- **`mode: "upscale"`** is not one of the four Imagen edit modes. It is not rejected —
  it is treated as `inpaint`, so you are charged $0.04 for an edit you did not ask for.
  For real upscaling use the [Stability tools](#image-studio-stability-ai-tools) below:
  `fast-upscale` ($0.03), `conservative-upscale` ($0.40) or `creative-upscale` ($0.60).
- **`model`** is accepted and ignored. This endpoint has one provider path,
  `imagen-3.0-capability-001`, and always bills and runs that model.
- **`output_format`** and **`num_outputs`** are ignored. Output is always a single PNG.
  Nothing was ever charged for the extra variations — the price is one image because one
  image is what comes back.
:::

## Edit Modes

### Inpaint — Fill Masked Area

Replaces the white-masked area of the image with AI-generated content matching your prompt. The surrounding context is preserved exactly. Ideal for replacing objects, adding elements, or filling in damaged areas of a photo.

- **Wants:** `mask_url` — white pixels mark edit areas, black pixels are preserved. Nothing rejects a request that omits it, and the charge still applies, so send it.
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

### Upscaling — not on this endpoint

There is no `upscale` mode here. Imagen 3 Capability has four edit modes and
super-resolution is not one of them. Use the Stability tools below, which are real
upscalers with their own prices:

| Tool | Price | Good for |
|------|-------|----------|
| [`fast-upscale`](#image-studio-stability-ai-tools) | $0.03 | 4x, quick, no prompt |
| [`conservative-upscale`](#image-studio-stability-ai-tools) | $0.40 | preserves the original closely |
| [`creative-upscale`](#image-studio-stability-ai-tools) | $0.60 | adds detail, reinterprets textures |

## Response Format

```json
{
  "mode": "inpaint",
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
| `mode` | The editing mode that was used. Echoes what you sent, so it is `null` if you sent nothing (the edit still runs as `inpaint`). |
| `cost_usd` | USD taken from the wallet for this edit. Always `0.04`. |
| `currency` | Always `"USD"`. |
| `billing` | The charge and the wallet balance left after it. `method` is `"wallet"` and `model` is `"prepaid"` on every response — the API accepts no other payment. |
| `images` | Array with the output image URL. One entry: `num_outputs` is not implemented. |
| `delivery` | Present only when you sent an `output` object. Says which bucket and key the file is being written to; see [bucket delivery](/guides/bucket-delivery). |

There is no `credits_used` field, and no plan allowance is consulted. Every API edit
is $0.04 from the prepaid wallet, whatever fotohub.app subscription the account has.
If the wallet cannot cover it the request is refused with
[402 `insufficient_funds`](/api/errors#_402-payment-required) before Imagen is
called, and nothing is charged.

## Code Examples

### Inpaint — Replace Masked Area

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.edit_image(
    image_url="https://example.com/photo.jpg",
    mask_url="https://example.com/mask.png",
    prompt="A fluffy golden retriever sitting on the grass",
    mode="inpaint",
)

print(f"Edited image: {result['images'][0]}")
print(f"Charged: ${result['cost_usd']:.2f}")
print(f"Wallet balance: ${result['billing']['balance_usd']:.2f}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.editImage({
  image_url: "https://example.com/photo.jpg",
  mask_url: "https://example.com/mask.png",
  prompt: "A fluffy golden retriever sitting on the grass",
  mode: "inpaint",
});

console.log(`Edited image: ${result.images[0]}`);
console.log(`Charged: $${result.cost_usd?.toFixed(2)}`);
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
	fmt.Printf("Charged: $%.2f\n", result["cost_usd"])
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
result = client.edit_image(
    image_url="https://example.com/portrait.jpg",
    prompt="Modern minimalist office with large windows, soft natural light, blurred bokeh background",
    mode="bgswap",
)

# One image per request, one charge per request. For variations, send the request
# again with a different prompt — there is no num_outputs on this endpoint.
print(f"New background: {result['images'][0]}")
print(f"Charged: ${result['cost_usd']:.2f}")   # 0.04
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.editImage({
  image_url: "https://example.com/portrait.jpg",
  prompt: "Modern minimalist office with large windows, soft natural light, blurred bokeh background",
  mode: "bgswap",
});

console.log(`New background: ${result.images[0]}`);
console.log(`Charged: $${result.cost_usd?.toFixed(2)}`); // 0.04
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
		"image_url": "https://example.com/portrait.jpg",
		"prompt":    "Modern minimalist office with large windows, soft natural light, blurred bokeh background",
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
	fmt.Printf("New background: %s\n", images[0])
	fmt.Printf("Charged: $%v\n", result["cost_usd"])
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/edit/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/portrait.jpg",
    "prompt": "Modern minimalist office with large windows and soft natural light",
    "mode": "bgswap"
  }'
```

:::

### Remove Object

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Remove an unwanted object — no mask needed
result = client.edit_image(
    image_url="https://example.com/landscape.jpg",
    prompt="the power lines and telephone poles in the sky",
    mode="remove",
)

print(f"Clean image: {result['images'][0]}")
print(f"Charged: ${result['cost_usd']:.2f}")   # 0.04 — same as every other mode
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.editImage({
  image_url: "https://example.com/landscape.jpg",
  prompt: "the power lines and telephone poles in the sky",
  mode: "remove",
});

console.log(`Clean image: ${result.images[0]}`);
console.log(`Charged: $${result.cost_usd?.toFixed(2)}`); // 0.04 — same as every other mode
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

### Upscale — a different endpoint

`/v1/ai/edit/image` has no upscale mode. Upscaling lives on the Stability tools
(`POST /stability/{tool_id}`), which take **base64 bytes rather than a URL** and
return base64 rather than a link. Three tools, three prices: `fast-upscale`
($0.03), `conservative-upscale` ($0.40), `creative-upscale` ($0.60).

::: code-group

```python [Python]
from fotohub import FotoHub
import base64

client = FotoHub(api_key="fh_live_your_api_key")

with open("low-res-photo.jpg", "rb") as f:
    source_b64 = base64.b64encode(f.read()).decode()

result = client.stability_run("fast-upscale", source_b64)

with open("upscaled.png", "wb") as f:
    f.write(base64.b64decode(result["image"]))

print(f"Charged: ${result['cost_usd']:.2f}")   # 0.03 — fast-upscale
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync, writeFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const sourceB64 = readFileSync("low-res-photo.jpg").toString("base64");

const result = await client.runStabilityTool("fast-upscale", {
  image: sourceB64,
});

writeFileSync("upscaled.png", Buffer.from(result.image, "base64"));
console.log(`Charged: $${result.cost_usd?.toFixed(2)}`); // 0.03 — fast-upscale
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
	sourceData, _ := os.ReadFile("low-res-photo.jpg")

	payload := map[string]interface{}{
		"image": base64.StdEncoding.EncodeToString(sourceData),
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/stability/fast-upscale", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)

	outputBytes, _ := base64.StdEncoding.DecodeString(result["image"].(string))
	os.WriteFile("upscaled.png", outputBytes, 0644)
	fmt.Printf("Charged: $%v\n", result["cost_usd"])
}
```

```bash [cURL]
SOURCE_B64=$(base64 -w0 low-res-photo.jpg)

curl -X POST "https://apis.fotohub.app/stability/fast-upscale" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$SOURCE_B64\"}" \
  | jq -r '.image' | base64 -d > upscaled.png
```

:::

::: tip Pick the upscaler by budget, not by name
`fast-upscale` is 20x cheaper than `conservative-upscale` and does not invent
detail. Reach for `creative-upscale` only when you want it to add detail that was
never in the source — at $0.60 it is the most expensive single call in this API.
:::

---

### Outpaint — Extend Image

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Extend landscape photo to panoramic ratio
result = client.edit_image(
    image_url="https://example.com/landscape-square.jpg",
    prompt="continuation of mountain landscape with pine forest, dramatic sky with clouds at golden hour",
    mode="outpaint",
)

print(f"Extended: {result['images'][0]}")
print(f"Charged: ${result['cost_usd']:.2f}")   # 0.04
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.editImage({
  image_url: "https://example.com/landscape-square.jpg",
  prompt: "continuation of mountain landscape with pine forest, dramatic sky with clouds at golden hour",
  mode: "outpaint",
});

console.log(`Extended: ${result.images[0]}`);
console.log(`Charged: $${result.cost_usd?.toFixed(2)}`); // 0.04
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
		"image_url": "https://example.com/landscape-square.jpg",
		"prompt":    "continuation of mountain landscape with pine forest, dramatic sky with clouds at golden hour",
		"mode":      "outpaint",
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
	fmt.Printf("Extended: %s\n", images[0])
	fmt.Printf("Charged: $%v\n", result["cost_usd"])
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/edit/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/landscape-square.jpg",
    "prompt": "continuation of mountain landscape with pine forest, dramatic sky with clouds at golden hour",
    "mode": "outpaint"
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

result = client.stability_run(
    "style-transfer",
    source_b64,
    reference=style_b64,
)

# Decode and save result
output_bytes = base64.b64decode(result["image"])
with open("styled_output.png", "wb") as f:
    f.write(output_bytes)

print(f"Charged: ${result['cost_usd']:.2f}")   # 0.08 — style-transfer
print(f"Seed: {result['seed']}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync, writeFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const sourceB64 = readFileSync("source_photo.jpg").toString("base64");
const styleB64 = readFileSync("style_reference.jpg").toString("base64");

const result = await client.runStabilityTool("style-transfer", {
  image: sourceB64,
  reference: styleB64,
});

writeFileSync("styled_output.png", Buffer.from(result.image, "base64"));
console.log(`Charged: $${result.cost_usd?.toFixed(2)}`); // 0.08 — style-transfer
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
	fmt.Printf("Charged: $%v\n", result["cost_usd"])
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
| Cost per request | **$0.04** from the prepaid USD wallet |
| All modes | Same flat price — `inpaint`, `outpaint`, `bgswap`, `remove` |
| All sizes | Same flat price at 1K, 2K and 4K |
| Batch discount | None — flat rate per request |
| Payment method | Wallet balance only. No credits, no plan allowance, no card-on-file. |

Every edit is a flat **$0.04**, so a batch of 100 costs $4.00 and you can compute it
in advance without knowing the image sizes. That is the provider's rate for
`imagen-3.0-capability-001` passed through at 1:1 — the API charges what the capacity
costs us, with no markup on top.

The Stability tools below are priced separately and are **not** flat: they range from
$0.03 to $0.60 per image, a 20x spread. Read [their table](#available-tools) before
looping one.

## Mask Creation Tips

When using `inpaint` mode, you must provide a mask image. Here are best practices for creating effective masks:

1. **Dimensions must match** — The mask must be exactly the same pixel dimensions as the source image.
2. **White = edit, Black = preserve** — White pixels (RGB 255,255,255) mark areas to be edited. Black pixels (RGB 0,0,0) mark areas to keep unchanged.
3. **Use feathered edges** — Soft, feathered mask edges produce more natural blending between edited and preserved areas. A 5-10 pixel feather works well for most cases.
4. **Slightly oversized masks** — Make the mask area slightly larger than the object you want to replace. This gives the AI more room to blend naturally.
5. **Binary or grayscale** — Grayscale values between 0-255 act as partial transparency for the edit. Use this for subtle transitions.
6. **Format** — PNG is recommended for masks to avoid JPEG compression artifacts that could introduce gray values unintentionally.

## Error Responses

Failures arrive under `detail`, as everywhere else in the API — see
[Errors](/api/errors). There is no top-level `error` object with a `type` field on
this endpoint.

### 400 — Missing `image_url`

`image_url` is the only field validated before billing, so this is the one 400 that
costs nothing by construction.

```json
{ "detail": "image_url is required" }
```

A missing `mask_url` is **not** a 400. Nothing checks it before billing: the request is
charged, forwarded with `editMode` and no mask, and whatever the provider does with that
is what you get — a result you did not ask for, or a failure that is refunded. Send the
mask you intended.

A `mask_url` that cannot be fetched **is** a 400, raised inside the pipeline rather than
here, so it arrives after the charge and is refunded:

```json
{ "detail": "{\"error\":\"Nie udało się pobrać maski z podanego adresu.\"}. Your wallet was not charged for this request." }
```

### 402 — Insufficient funds

The wallet cannot cover the $0.04. Raised before Imagen is called, so nothing is spent.

```json
{
  "detail": {
    "error": "insufficient_funds",
    "code": "insufficient_funds",
    "message": "Insufficient funds: this request costs $0.040000 but your balance is $0.012000. Top up your wallet with at least $0.028000 to continue. The FOTOhub API is prepaid: no credits or subscription plan can pay for API usage.",
    "required_usd": 0.04,
    "balance_usd": 0.012,
    "shortfall_usd": 0.028,
    "currency": "USD",
    "charged": false,
    "charged_usd": 0,
    "topup_url": "https://fotohub.app/console/wallet",
    "operation": "edit_image"
  }
}
```

Branch on `detail.error`, and top up by at least `shortfall_usd`. A fotohub.app
subscription does not help: API usage is payable only from the wallet.

### 500, 502, 504 — The edit failed and your money came back

Everything after the charge shares one path: the $0.04 is reversed, then the failure is
reported. The status code is the upstream one, not a code of our own — `500` for a
provider or pipeline error (including an unreachable `image_url` and a safety refusal),
`504` if the render exceeded 120 s, `502` if the pipeline was unreachable, `429` if the
provider rate-limited us.

```json
{
  "detail": "{\"error\":\"Generowanie zablokowane przez filtr bezpieczenstwa.\",\"errorId\":\"a1b2c3\",\"refunded\":false}. Your wallet was not charged for this request."
}
```

Two things to know about that string:

- **The refund sentence is the part to trust.** `Your wallet was not charged for this
  request.` is appended **only** when the reversal actually committed. Its absence
  means check `GET /v1/billing/usage` rather than assume. The `"refunded"` flag inside
  the quoted body refers to the internal credit ledger, not your wallet — ignore it.
- **`detail` is a string, not an object,** and the upstream text embedded in it is
  passed through verbatim, so it is sometimes JSON and sometimes Polish. Do not parse
  it. Branch on the HTTP status; treat the body as a diagnostic to log, and retry a
  `500`/`502`/`504` once — nothing was charged, so a retry is free.

There is no `422` and no `413` on this endpoint. An image that is too large, or a URL
that cannot be fetched, is not detected here — it fails downstream and comes back as one
of the codes above (or as the post-charge `400` shown earlier), with the charge reversed.

### The full set

| Status | When | Charged? |
|--------|------|----------|
| `400` | `image_url` missing | No — checked first |
| `400` | `mask_url` unfetchable or SSRF-blocked | Charged, then refunded |
| `401` | Missing, malformed, revoked or expired key | No |
| `403` | The key's scopes do not cover this endpoint, or its IP allowlist rejected you | No |
| `402` | Wallet cannot cover $0.04 | No — refused before the provider |
| `429` | The key's per-minute limit, or the provider rate-limiting us | No |
| `500` / `502` / `504` | Provider or pipeline failure, safety refusal, timeout | Charged, then refunded |

## Limits and Constraints

| Constraint | `/v1/ai/edit/image` | `/stability/{tool_id}` |
|------------|---------------------|------------------------|
| Input | Public URL (`image_url`) | Base64 in the body (`image`) |
| Input size | No limit enforced by us — the provider decides | 4,096 px² to 9.4 MP, checked before billing |
| Output | 1 PNG behind a signed URL | 1 image, base64, format of your choosing |
| Mask | Must match the source dimensions exactly | Same |
| Signed URL lifetime | **1 hour** | n/a — bytes are in the response |
| File retention | **7 days** by default, per-key: 2 h / 12 h / 24 h / 7 days | n/a |
| Rate limit | Per key, default 60/min | Per key, default 60/min |

Two consequences worth planning for:

- **`image_url` must be publicly fetchable.** It is downloaded server-side (behind
  an SSRF guard that rejects private and link-local addresses). A URL needing
  cookies or a signed header fails at the fetch, comes back as a `500`, and is
  refunded. A URL on `localhost` or `10.0.0.0/8` is blocked outright.
- **Only the Stability tools reject an oversized image for free.** The edit endpoint
  has no size pre-check, so a 60 MP input is billed first and fails at the provider
  second (then refunded). Resize before sending if you are unsure.

---

## Image Studio (Stability AI Tools)

13 specialized image editing tools powered by Stability AI. Available at `POST /stability/{tool_id}`.

### Available Tools

Prices are per image returned, charged from the wallet, and they are **not** uniform —
`creative-upscale` costs 20x `fast-upscale`. Check the price before you loop a tool.

| Tool ID | Name | Price (USD) | Requires |
|---------|------|-------------|----------|
| `fast-upscale` | Fast Upscale 4x | 0.03 | image |
| `outpaint` | Outpaint | 0.06 | image + prompt + directions |
| `remove-background` | Remove Background | 0.07 | image |
| `erase-object` | Erase Object | 0.07 | image + mask |
| `inpaint` | Inpaint | 0.07 | image + mask + prompt |
| `search-replace` | Search & Replace | 0.07 | image + prompt + search_prompt |
| `search-recolor` | Search & Recolor | 0.07 | image + prompt + search_prompt |
| `style-guide` | Style Guide | 0.07 | image + reference + prompt |
| `control-sketch` | Sketch to Image | 0.07 | image (sketch) + prompt |
| `control-structure` | Structure to Image | 0.07 | image + prompt |
| `style-transfer` | Style Transfer | 0.08 | image + reference |
| `conservative-upscale` | Conservative Upscale | **0.40** | image |
| `creative-upscale` | Creative Upscale | **0.60** | image |

::: tip Read the price from the API, not from this table
`GET /stability/tools` returns `price_usd` for every tool, read from the same rate table
the charge uses — so it cannot drift from your invoice the way a documentation table can.
The `credits` field in that response is a legacy relative weight, not a price, and is
deprecated: it was never proportional to the real cost (both upscales sit at weights 3
and 2 against prices of $0.60 and $0.40), so no conversion factor recovers a price from
it. Read `price_usd`.
:::

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
  "cost_usd": 0.03,
  "currency": "USD",
  "billing": {
    "cost_usd": 0.03,
    "balance_usd": 24.25,
    "currency": "USD",
    "method": "wallet",
    "model": "prepaid"
  }
}
```

`image` is base64, not a URL — these tools return the bytes inline. `seed` is `null` for
the tools that do not sample (the upscalers, `remove-background`).

Size limits are checked **before** the charge: an image above 9.4 MP or below 4096 pixels
total is a `400` and costs nothing. A missing `mask` on `erase-object` or `inpaint` is
also a free `400`. Anything that fails at Bedrock after that is a `502` with the charge
reversed and `Your wallet was not charged for this request.` appended.

### Stability AI Code Examples

::: code-group

```python [Python]
from fotohub import FotoHub
import base64

client = FotoHub(api_key="fh_live_your_api_key")

# Remove background from product photo
with open("product.jpg", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

result = client.stability_run("remove-background", image_b64)

output = base64.b64decode(result["image"])
with open("product_no_bg.png", "wb") as f:
    f.write(output)
print(f"Charged: ${result['cost_usd']:.2f}")   # 0.07 — remove-background
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync, writeFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const imageB64 = readFileSync("product.jpg").toString("base64");

const result = await client.runStabilityTool("remove-background", {
  image: imageB64,
});

writeFileSync("product_no_bg.png", Buffer.from(result.image, "base64"));
console.log(`Charged: $${result.cost_usd?.toFixed(2)}`); // 0.07 — remove-background
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
	fmt.Printf("Charged: $%v\n", result["cost_usd"])
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
import base64

import requests
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

product_url = "https://example.com/product-raw.jpg"

# Step 1: Remove distracting background, place on studio backdrop — $0.04
studio = client.edit_image(
    image_url=product_url,
    prompt="clean white studio backdrop with soft shadow beneath product, professional product photography lighting",
    mode="bgswap",
)
print(f"Studio shot: {studio['images'][0]}")

# Step 2: Remove any visible props or stands — $0.04
cleaned = client.edit_image(
    image_url=studio["images"][0],
    prompt="the product stand and support rod",
    mode="remove",
)
print(f"Cleaned: {cleaned['images'][0]}")

# Step 3: Upscale for zoom views — $0.03, and a different endpoint.
# /v1/ai/edit/image has no upscale mode; the Stability tools do. They take base64
# rather than a URL, so fetch the previous step's signed URL first.
image_b64 = base64.b64encode(requests.get(cleaned["images"][0]).content).decode()
upscaled = client.stability_run("fast-upscale", image_b64)

with open("product_final.png", "wb") as f:
    f.write(base64.b64decode(upscaled["image"]))

total = studio["cost_usd"] + cleaned["cost_usd"] + upscaled["cost_usd"]
print(f"Total: ${total:.2f}")   # 0.11 — two edits at 0.04 plus a 0.03 upscale
print(f"Wallet left: ${upscaled['billing']['balance_usd']:.2f}")
```

```typescript [TypeScript]
import { writeFileSync } from "fs";

import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const productUrl = "https://example.com/product-raw.jpg";

// Step 1: Studio background — $0.04
const studio = await client.editImage({
  image_url: productUrl,
  prompt: "clean white studio backdrop with soft shadow beneath product, professional product photography lighting",
  mode: "bgswap",
});

// Step 2: Remove props — $0.04
const cleaned = await client.editImage({
  image_url: studio.images[0],
  prompt: "the product stand and support rod",
  mode: "remove",
});

// Step 3: Upscale — $0.03, and a different endpoint. editImage has no upscale
// mode; the Stability tools do, and they take base64 rather than a URL.
const bytes = await fetch(cleaned.images[0]).then((r) => r.arrayBuffer());
const upscaled = await client.runStabilityTool("fast-upscale", {
  image: Buffer.from(bytes).toString("base64"),
});

writeFileSync("product_final.png", Buffer.from(upscaled.image, "base64"));

const total =
  (studio.cost_usd ?? 0) + (cleaned.cost_usd ?? 0) + (upscaled.cost_usd ?? 0);
console.log(`Total: $${total.toFixed(2)}`); // 0.11
console.log(`Wallet left: $${upscaled.billing?.balance_usd?.toFixed(2)}`);
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

func post(path string, payload map[string]interface{}) map[string]interface{} {
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app"+path, bytes.NewReader(body))
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

	// Step 1: Studio background — $0.04
	studio := post("/v1/ai/edit/image", map[string]interface{}{
		"image_url": productURL,
		"prompt":    "clean white studio backdrop with soft shadow, professional lighting",
		"mode":      "bgswap",
	})
	studioURL := studio["images"].([]interface{})[0].(string)

	// Step 2: Remove props — $0.04
	cleaned := post("/v1/ai/edit/image", map[string]interface{}{
		"image_url": studioURL,
		"prompt":    "the product stand and support rod",
		"mode":      "remove",
	})
	cleanedURL := cleaned["images"].([]interface{})[0].(string)

	// Step 3: Upscale — $0.03, and a different endpoint. The edit route has no
	// upscale mode; the Stability tools take base64, so fetch the bytes first.
	imgResp, _ := http.Get(cleanedURL)
	defer imgResp.Body.Close()
	imgBytes, _ := io.ReadAll(imgResp.Body)

	upscaled := post("/stability/fast-upscale", map[string]interface{}{
		"image": base64.StdEncoding.EncodeToString(imgBytes),
	})
	outputBytes, _ := base64.StdEncoding.DecodeString(upscaled["image"].(string))
	os.WriteFile("product_final.png", outputBytes, 0644)

	fmt.Printf("Total: $%.2f\n",
		studio["cost_usd"].(float64)+cleaned["cost_usd"].(float64)+upscaled["cost_usd"].(float64)) // 0.11
}
```

```bash [cURL]
PRODUCT="https://example.com/product-raw.jpg"

# Step 1: Studio background — $0.04
STUDIO=$(curl -s -X POST "https://apis.fotohub.app/v1/ai/edit/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"image_url\": \"$PRODUCT\", \"prompt\": \"clean white studio backdrop with professional lighting\", \"mode\": \"bgswap\"}")
STUDIO_URL=$(echo $STUDIO | jq -r '.images[0]')

# Step 2: Remove props — $0.04
CLEANED=$(curl -s -X POST "https://apis.fotohub.app/v1/ai/edit/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"image_url\": \"$STUDIO_URL\", \"prompt\": \"the product stand\", \"mode\": \"remove\"}")
CLEANED_URL=$(echo $CLEANED | jq -r '.images[0]')

# Step 3: Upscale — $0.03, on /stability/fast-upscale. The edit endpoint has no
# upscale mode, and the Stability tools take base64 rather than a URL.
CLEANED_B64=$(curl -s "$CLEANED_URL" | base64 -w0)
curl -s -X POST "https://apis.fotohub.app/stability/fast-upscale" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$CLEANED_B64\"}" \
  | jq -r '.image' | base64 -d > product_final.png
# Total: $0.11
```

:::

---

### Real Estate Photo Enhancement

Clean up property photos for listings: remove clutter, enhance sky, expand composition.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Remove unsightly objects from exterior photo — $0.04
exterior = client.edit_image(
    image_url="https://example.com/house-exterior.jpg",
    prompt="the trash bins, parked cars, and garden hose on the driveway",
    mode="remove",
)
print(f"Cleaned exterior: {exterior['images'][0]}")

# Expand photo to show more of the property — $0.04
expanded = client.edit_image(
    image_url=exterior["images"][0],
    prompt="continuation of manicured lawn and landscaping, blue sky with light clouds, suburban neighborhood context",
    mode="outpaint",
)
print(f"Expanded: {expanded['images'][0]}")

# Swap dull sky for dramatic sunset — $0.04
final = client.edit_image(
    image_url=expanded["images"][0],
    prompt="stunning golden hour sky with warm light illuminating the house facade, professional real estate photography",
    mode="bgswap",
)
print(f"Final listing photo: {final['images'][0]}")

total = exterior["cost_usd"] + expanded["cost_usd"] + final["cost_usd"]
print(f"Total: ${total:.2f}")                              # 0.12
print(f"Wallet left: ${final['billing']['balance_usd']:.2f}")
```

::: warning Each step consumes the previous step's signed URL
`images[0]` is a signed link into the private `api-generations` bucket and it
expires **one hour** after the response. Chaining three edits inside one script is
fine, but do not store an intermediate URL and feed it to a job hours later —
download the bytes and host them yourself, or the next step fails on the fetch
(and is refunded).
:::

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Remove clutter — $0.04
const exterior = await client.editImage({
  image_url: "https://example.com/house-exterior.jpg",
  prompt: "the trash bins, parked cars, and garden hose on the driveway",
  mode: "remove",
});

// Expand composition — $0.04
const expanded = await client.editImage({
  image_url: exterior.images[0],
  prompt: "continuation of manicured lawn and landscaping, blue sky with light clouds",
  mode: "outpaint",
});

// Enhance sky — $0.04
const final = await client.editImage({
  image_url: expanded.images[0],
  prompt: "stunning golden hour sky with warm light illuminating the house facade",
  mode: "bgswap",
});

console.log(`Final: ${final.images[0]}`);

const total =
  (exterior.cost_usd ?? 0) + (expanded.cost_usd ?? 0) + (final.cost_usd ?? 0);
console.log(`Total: $${total.toFixed(2)}`); // 0.12
console.log(`Wallet left: $${final.billing?.balance_usd?.toFixed(2)}`);
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
| **Output** | Signed URL (1h) | Base64 in the response body |
| **Inpaint** | Yes ($0.04) | Yes ($0.07) |
| **Outpaint** | Yes ($0.04) | Yes ($0.06, directional control) |
| **Background Swap** | Yes ($0.04) | Via search-replace ($0.07) |
| **Object Removal** | Yes ($0.04) | Yes — erase-object ($0.07) |
| **Upscale** | Not supported | Fast ($0.03), Conservative ($0.40), Creative ($0.60) |
| **Style Transfer** | No | Yes ($0.08) |
| **Background Removal** | No | Yes ($0.07) |
| **Search & Replace** | No | Yes ($0.07) — find and replace any element |
| **Search & Recolor** | No | Yes ($0.07) — recolor specific objects |
| **Sketch to Image** | No | Yes ($0.07) |
| **Structure to Image** | No | Yes ($0.07) |
| **Outputs per request** | 1 | 1 |
| **Best For** | Photorealistic edits, natural fill | Specialized tasks, fine control |

Both endpoints are paid the same way: prepaid USD from the wallet, charged before
the provider runs, refunded if the provider fails.

### Choosing the Right Tool

| Task | Recommended | Price | Why |
|------|-------------|------:|-----|
| Replace sky in photo | Imagen 3 `bgswap` | $0.04 | Natural photorealistic results |
| Remove person from scene | Imagen 3 `remove` | $0.04 | No mask needed, prompt-based |
| Extend a composition | Imagen 3 `outpaint` | $0.04 | Cheapest outpaint of the two |
| Precise object erase | Stability `erase-object` | $0.07 | Mask gives exact control |
| Product background removal | Stability `remove-background` | $0.07 | Clean alpha channel |
| Quick 4x upscale | Stability `fast-upscale` | $0.03 | Cheapest call in this API |
| Upscale without invented detail | Stability `conservative-upscale` | $0.40 | Stays faithful to the source |
| Creative upscale with detail | Stability `creative-upscale` | $0.60 | Adds detail that was not there |
| Extend image left/right | Stability `outpaint` | $0.06 | Directional pixel control |
| Apply art style | Stability `style-transfer` | $0.08 | Reference image driven |
| Recolor specific object | Stability `search-recolor` | $0.07 | Targeted color change |

---

## Use Cases

### Photography & Retouching

- Remove tourists from travel photos
- Replace overcast skies with dramatic clouds
- Extend tight compositions for social media aspect ratios
- Upscale old family photos for printing (`/stability/conservative-upscale`)
- Remove branding/watermarks from stock previews (for owned assets only)

### E-Commerce

- Swap backgrounds to match brand aesthetic
- Remove packaging defects from product photos
- Generate background variations for A/B testing, one request per variation
- Batch-upscale thumbnails for zoom functionality (`/stability/fast-upscale`)
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
- Upscale drone stills for brochures (`/stability/creative-upscale`)

---

## Performance Tips

### Prompt Writing

- **Be specific** — "a red leather armchair" works better than "furniture"
- **Describe the result** — "sunlit meadow with wildflowers" not "make it look pretty"
- **Context matters** — include lighting and style info ("soft studio light", "cinematic")
- **For remove mode** — describe the object, not what replaces it (the AI handles fill)

### Output Format

`/v1/ai/edit/image` does not take a format: the result is always a single PNG
behind a signed URL, and `output_format` in the body is ignored. Convert on your
side if you need JPEG or WebP for delivery.

The Stability tools **do** honour `output_format` — `"png"` (default), `"jpeg"` or
`"webp"`:

| Format | Best For | Notes |
|--------|----------|-------|
| PNG | Transparency, archival quality | Largest files. The only option on the edit endpoint. |
| JPEG | Web delivery, thumbnails | Smallest files, no transparency. Stability tools only. |
| WebP | Modern web, balanced quality/size | Best compression ratio. Stability tools only. |

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
    return client.edit_image(
        image_url=url,
        prompt="clean white studio background with soft drop shadow",
        mode="bgswap",
    )

# Process in parallel (respect rate limits: 30/min)
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    results = list(executor.map(process_image, product_images))

for i, result in enumerate(results):
    print(f"Product {i+1}: {result['images'][0]}")

# Add up what was actually charged rather than assuming — a request that failed
# upstream was refunded, so its cost_usd is what the wallet kept, not $0.04.
print(f"Total: ${sum(r['cost_usd'] for r in results):.2f}")   # 0.20 for 5 images
print(f"Wallet left: ${results[-1]['billing']['balance_usd']:.2f}")
```

::: warning Fund the wallet before a batch, not during it
A batch stops at the first request that cannot be paid for: that one gets a
[402 `insufficient_funds`](/api/errors#_402-payment-required) and every request
after it does too, while the ones that already went through stay charged. Five
`bgswap` edits need $0.20 on the balance before you start.
:::

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
    client.editImage({
      image_url: url,
      prompt: "clean white studio background with soft drop shadow",
      mode: "bgswap",
    })
  )
);

results.forEach((r, i) => {
  console.log(`Product ${i + 1}: ${r.images[0]}`);
});

const total = results.reduce((sum, r) => sum + (r.cost_usd ?? 0), 0);
console.log(`Total: $${total.toFixed(2)}`); // 0.20 for 5 images
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

The limit is a property of the **API key**, not of a plan: each key carries its own
`rate_limit_per_minute`, default **60**, adjustable up to **600** in
[the console](https://fotohub.app/console/keys). Mint a second key with a lower
limit if you want a batch job that cannot starve your production traffic.

Rate limit headers come back on every response:
- `X-RateLimit-Limit` — the key's requests per minute
- `X-RateLimit-Remaining` — requests left in the current 60s window
- `X-RateLimit-Reset` — when the window resets (unix timestamp)

Exceeding it returns `429` with `Retry-After: 60` and
`{"detail": {"error": "rate_limit_exceeded", "scope": "api_key", ...}}`. A `429`
is refused before billing, so nothing is charged.

---

## Related APIs

For additional image processing capabilities beyond editing:

| API | Description | Link |
|-----|-------------|------|
| **Image Processing** | Color grading, denoise, colorize, face restore, CLIP tagging, depth maps, batch processing | [Image Processing →](/api/image-processing) |
| **Background Removal Pro** | AI-powered background removal, replacement, blur, and shadow effects | [Background Removal →](/api/background-removal) |
