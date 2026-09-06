# Brand Engine API

The FotoHUB Brand Engine (`/v1/brands`) manages brand visual identity kits, virtual brand faces and avatars, logos, products, color palettes, and automated brand compliance checking. It allows AI image and video generation pipelines to automatically inject consistent brand styling, fonts, colors, and characters.

Base URL: `https://apis.fotohub.app/v1/brands`

---

## Core Brand Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/brands` | List user's brand kits with asset counts |
| `POST` | `/v1/brands` | Create new brand identity profile |
| `GET` | `/v1/brands/{brand_id}` | Get full brand details |
| `PUT` | `/v1/brands/{brand_id}` | Update brand profile fields |
| `DELETE`| `/v1/brands/{brand_id}` | Delete brand and all associated assets |
| `GET` | `/v1/brands/{brand_id}/summary` | Compact brand context for AI prompt injection |
| `GET` | `/v1/brands/{brand_id}/context` | Full brand context (faces, logos, style presets) |
| `POST` | `/v1/brands/{brand_id}/export` | Export brand kit with resolved public CDN URLs |
| `POST` | `/v1/brands/{brand_id}/extract-colors` | Extract dominant colors and complementary palette from image |
| `POST` | `/v1/brands/{brand_id}/extract-dna` | Vision-LLM extraction of brand DNA from marketing materials |
| `POST` | `/v1/brands/{brand_id}/check-compliance` | Check image against brand guidelines (score 0–100) |
| `POST` | `/v1/brands/{brand_id}/generate-text` | Generate on-brand copy (taglines, slogans, captions) |

---

### 1. Extract Brand DNA

Upload marketing collateral, packaging, or screenshots to automatically analyze and extract brand colors, visual style, tone of voice, typography, and keywords.

```
POST /v1/brands/{brand_id}/extract-dna
```

**Content-Type:** `multipart/form-data` (file: binary image, max 20MB).

#### Response Example

```json
{
  "brand_name": "Lumina Skincare",
  "dominant_colors": [
    { "hex": "#E0C9A6", "name": "Warm Sand", "percentage": 42.5 },
    { "hex": "#2B3A42", "name": "Deep Slate", "percentage": 28.1 }
  ],
  "visual_style": {
    "aesthetic": "Minimalist Organic",
    "lighting": "Soft natural diffused morning light",
    "mood": "Calm, clean, premium wellness"
  },
  "brand_voice": "Empathetic, scientifically backed, gentle and approachable",
  "keywords": ["clean beauty", "dermatology", "sustainable", "radiance"],
  "ai_unavailable": false
}
```

::: code-group

```python [Python]
import requests

headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}
files = {"file": open("product_ad.jpg", "rb")}

resp = requests.post(
    "https://apis.fotohub.app/v1/brands/b1a2c3d4-0000-0000-0000-000000000000/extract-dna",
    headers=headers,
    files=files,
)
print(resp.json())
```

```typescript [TypeScript]
const form = new FormData();
form.append("file", fileBlob, "product_ad.jpg");

const resp = await fetch(
  "https://apis.fotohub.app/v1/brands/b1a2c3d4-0000-0000-0000-000000000000/extract-dna",
  {
    method: "POST",
    headers: { Authorization: "Bearer YOUR_JWT_TOKEN" },
    body: form,
  }
);
console.log(await resp.json());
```

```go [Go]
package main

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

func main() {
	var b bytes.Buffer
	w := multipart.NewWriter(&b)
	f, _ := os.Open("product_ad.jpg")
	defer f.Close()
	fw, _ := w.CreateFormFile("file", "product_ad.jpg")
	io.Copy(fw, f)
	w.Close()

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/brands/b1a2c3d4-0000-0000-0000-000000000000/extract-dna", &b)
	req.Header.Set("Authorization", "Bearer YOUR_JWT_TOKEN")
	req.Header.Set("Content-Type", w.FormDataContentType())

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/brands/b1a2c3d4-0000-0000-0000-000000000000/extract-dna \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@product_ad.jpg"
```

:::

---

### 2. Brand Compliance Check

Score how closely a newly generated ad, banner, or photo matches brand guidelines on a scale of 0 to 100.

```
POST /v1/brands/{brand_id}/check-compliance
```

**Content-Type:** `multipart/form-data` (file: binary image, max 20MB).

#### Response Example

```json
{
  "overall_score": 88,
  "color_compliance": {
    "score": 92,
    "feedback": "Primary palette aligns closely with #E0C9A6 and #2B3A42."
  },
  "style_compliance": {
    "score": 85,
    "feedback": "Lighting is clean and minimalist, matching brand guidelines."
  },
  "flags": [],
  "suggestions": ["Consider increasing contrast slightly on typography."]
}
```

---

## Virtual Brand Faces & Characters

Manage persistent AI characters for brand storytelling, tutorials, and UGC ads.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/brands/{brand_id}/faces` | List character faces |
| `POST` | `/v1/brands/{brand_id}/faces` | Create character profile |
| `POST` | `/v1/brands/{brand_id}/faces/generate` | Generate initial face using AI |
| `POST` | `/v1/brands/{brand_id}/faces/{face_id}/upload` | Upload high-res reference photo |
| `POST` | `/v1/brands/{brand_id}/faces/{face_id}/perspectives` | Generate multi-angle perspective sheet |
| `POST` | `/v1/brands/{brand_id}/faces/{face_id}/expressions` | Generate expressions, poses, and outfit variants |

### Perspective Views Generation

Generate consistent perspective angles of your virtual brand ambassador:

```
POST /v1/brands/{brand_id}/faces/{face_id}/perspectives
```

#### Request Parameters
- `perspectives`: Array of views, e.g. `["front", "three_quarter_left", "three_quarter_right", "side_profile"]` (max 8).
- `ai_model`: Model ID (e.g. `nana-banana-pro`).
- `style_prompt`: Optional background/lighting prompt.

### Expression & Pose Variant Generation

```
POST /v1/brands/{brand_id}/faces/{face_id}/expressions
```

#### Request Parameters
- `variant_type`: `"expression"`, `"pose"`, or `"outfit"`.
- `variants`: Array of variant keys:
  - Expressions: `happy`, `sad`, `surprised`, `neutral`, `angry`, `thinking`, `confident`, `laughing`.
  - Poses: `standing`, `sitting`, `walking`, `pointing`, `waving`, `arms_crossed`, `leaning`.
  - Outfits: `casual`, `formal`, `business`, `sportswear`, `evening`, `streetwear`.
