# Brand DNA & Virtual Influencer Pipeline

Extract the visual DNA of any brand, mint a persistent virtual brand ambassador with lock-tight facial biometrics, and programmatically generate high-converting lifestyle campaign imagery with automated guideline compliance auditing.

Powered by FOTOhub's **Brand Engine** (`server/brand-engine/`) and neural image generation infrastructure, this recipe solves character drift and brand guideline violations across multi-channel content operations.

---

## Architectural Workflow

```mermaid
flowchart TD
    subgraph Ingestion["1. Brand Onboarding & Ingestion"]
        A["Brand Collateral Ingest (PDF / Style Guide / Moodboard)"]
        A --> B["Color Extraction & Visual Analysis (/brand/v1/brands/{brand_id}/extract-dna)"]
        B --> C["Brand Profile Created (Voice, Palette, Typo, Mood)"]
    end
    
    subgraph Definition["2. Ambassador Definition"]
        C --> D["Virtual Face Definition (/brand/v1/brands/{brand_id}/faces)"]
        D --> E["Anchor Face Generation (nano-banana-pro / seedream-5-0)"]
        E --> F["Biometric Reference Stored (S3 Storage Vault)"]
    end
    
    subgraph Generation["3. Content Generation Engine"]
        F --> G["Multi-Angle Canonical Perspectives (/perspectives)"]
        F --> H["Lifestyle & Outfit Synthesis Engine (/expressions)"]
        G & H --> I["20+ Lifestyle Scenes Rendered (Seed Locked)"]
    end
    
    subgraph Audit["4. Quality & Compliance Auditing"]
        I --> J["Automated Compliance Audit (/check-compliance)"]
        J --> K{"Compliance Score >= 80%?"}
        K -->|"Fail (<80%)"| M["Automated Re-Prompting & Color Correction (DLQ)"]
        M --> I
    end
    
    subgraph Publishing["5. Multi-Platform Publishing"]
        K -->|"Pass"| L["Publish to Social Studio / CDN Catalog"]
        L --> N["Webhook: campaign.completed"]
        N --> O["BYOB Export (S3 / R2)"]
    end
```

::: info Hardware Affinity
The Brand Engine leverages FOTOhub's distributed GPU infrastructure. Brand DNA extraction uses Vision models on standard inference tiers. For video and audio synchronization, GPU2 is reserved for MMAudio, GPU3 for MuseTalk/LipSync, and GPU4/5 for advanced 3D generation. Master face minting and perspectives primarily utilize `nano-banana-pro` on our high-density generative fleet.
:::

---

## Production Economics & USD Billing

All Brand Engine operations are metered directly against your prepaid USD wallet. Costs reflect exact pass-through GPU compute and neural inference rates. **FOTOhub uses pure USD billing ONLY.** All balances are represented as `wallet.available_usd`. 

| Operation | API Endpoint | Cost (USD) | Output Delivered |
|:---|:---|:---|:---|
| **Brand DNA extraction** | `POST /brand/v1/brands/{brand_id}/extract-dna` | **$0.015** | Hex palette, tone of voice, typography, style keywords |
| **Master face generation** | `POST /brand/v1/brands/{brand_id}/faces/generate` | **$0.035** | High-fidelity master portrait with biometrics |
| **Perspective variant (per angle)** | `POST /brand/v1/brands/{brand_id}/faces/{face_id}/perspectives` | **$0.025** | Specific angle (e.g., front, 3/4 left, profile) |
| **Expression variant (per variant)** | `POST /brand/v1/brands/{brand_id}/faces/{face_id}/expressions` | **$0.022** | Single lifestyle contextual variant |
| **Compliance audit** | `POST /brand/v1/brands/{brand_id}/check-compliance` | **$0.005** | 0–100 brand score with actionable feedback |

### ROI Comparison vs. Traditional Photo Shoots

| Expense Category | Traditional Shoot (Per Campaign) | Virtual Ambassador Pipeline (20 Assets) |
|:---|:---|:---|
| Model Talent | $1,500 - $5,000 | $0.00 |
| Photographer | $2,000 - $4,000 | $0.00 |
| Location & Permits | $1,000 - $3,000 | $0.00 |
| Styling & Hair/Makeup | $800 - $1,500 | $0.00 |
| Retouching | $500 - $1,000 | $0.00 |
| **Compute & Inference (USD)** | **$0.00** | **~$1.330** |
| **Total Turnaround Time** | **2 - 4 Weeks** | **Under 5 Minutes** |

::: tip Autonomous Pre-Reservation & Fault-Tolerant Refunds
FotoHUB reserves the exact estimated USD cost before GPU inference begins. If an external model endpoint degrades or returns an `ai_unavailable` status, the reserved USD balance is immediately refunded back to your prepaid wallet in real time.
:::

---

## Endpoint Parameter Reference

### `POST /brand/v1/brands`
Create a brand profile.

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `name` | string | **Yes** | — | The name of the brand. |
| `description` | string | **Yes** | — | A short summary of the brand's mission. |
| `industry` | string | **Yes** | — | Industry vertical (e.g., Beauty, Fashion). |
| `brand_voice` | string | No | `""` | The tone of voice for the brand. |
| `primary_color` | string | No | `null` | Hex code for primary brand color. |
| `secondary_color` | string | No | `null` | Hex code for secondary brand color. |
| `logo_url` | string | No | `null` | URL to the brand's logo. |

### `POST /brand/v1/brands/{brand_id}/extract-dna`
Extract DNA from uploaded collateral.

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `file` | file | **Yes** | — | The moodboard or style guide image. |
| `extraction_mode` | string | No | `"comprehensive"` | Mode: `"colors_only"`, `"comprehensive"`. |

**Response JSON Example:**
```json
{
  "visual_style": "Minimalist, clinical, organic",
  "suggested_primary": "#2A4736",
  "suggested_secondary": "#F4EFEA",
  "suggested_accent": "#D4A373",
  "suggested_brand_voice": "Serene, clinical, scientifically transparent, soothing",
  "style_keywords": ["clean", "minimal", "nordic", "botanical"],
  "usd_charged": 0.015
}
```

### `POST /brand/v1/brands/{brand_id}/faces/generate`
Mint a persistent master face.

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `prompt` | string | **Yes** | — | Core character description (1–2000 chars) describing identity, ethnicity, and lighting. |
| `ai_model` | string | No | `"nana-banana-pro"` | Model ID. |
| `generation_config` | object | No | `{}` | Fine-grained biometric controls. |

**Generation Config Sub-fields:**
| Key | Type | Example Values | Description |
|:---|:---|:---|:---|
| `gender` | string | `"female"`, `"male"`, `"non-binary"` | Canonical gender representation. |
| `age_range` | string | `"24-28"`, `"30-35"`, `"40-45"` | Perceived age span of the virtual ambassador. |
| `ethnicity` | string | `"Scandinavian"`, `"East Asian"`, `"Afro-Latina"` | Demographic visual features for consistent identity. |
| `skin_tone` | string | `"fair with warm undertones"`, `"olive"`, `"rich bronze"` | Skin tone guidance for color accuracy under varying lights. |
| `hair_color` | string | `"chestnut brown"`, `"platinum blonde"`, `"raven black"` | Persistent hair color. |
| `hair_style` | string | `"textured bob"`, `"slicked high pony"`, `"natural curls"` | Default base hairstyle. |
| `eye_color` | string | `"deep hazel"`, `"emerald green"`, `"warm amber"` | Iris pigmentation for close-up portraits. |
| `clothing` | string | `"tailored linen blazer"`, `"minimalist silk slip"` | Baseline wardrobe anchor. |
| `accessories` | string | `"subtle gold huggies"`, `"matte black glasses"` | Persistent jewelry or eyewear markers. |
| `background` | string | `"neutral studio grey with soft key light"` | Clean environment for master face extraction. |

### `GET /brand/v1/brands/{brand_id}/faces/{face_id}`
Retrieve face status and URLs.

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `brand_id` | string | **Yes** | — | (Path) Brand ID. |
| `face_id` | string | **Yes** | — | (Path) Face ID. |

### `POST /brand/v1/brands/{brand_id}/faces/{face_id}/perspectives`
Generate canonical angles.

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `perspectives` | string[] | **Yes** | `["front"]` | Array of desired angles (e.g., `"front"`, `"three_quarter_left"`, `"three_quarter_right"`, `"profile_left"`). |
| `ai_model` | string | No | `"nano-banana-pro"` | Model ID. |
| `style_prompt` | string | No | `null` | Contextual camera guidance notes. |

::: info Camera Guidance Notes
When requesting perspectives, you can guide the virtual camera setup via `style_prompt`. For a flat commercial look, request `85mm focal length, f/5.6 aperture, flat even studio lighting`. For a dramatic look, specify `35mm lens, high contrast rim lighting`.
:::

### `POST /brand/v1/brands/{brand_id}/faces/{face_id}/expressions`
Generate expressions and outfits.

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `variants` | string[] | **Yes** | `["happy"]` | Variant keys to render. Max 8 per API call. |
| `variant_type` | string | **Yes** | `"expression"` | Variant family: `"expression"`, `"pose"`, or `"outfit"`. |
| `ai_model` | string | No | `"nano-banana-pro"` | Neural generation model ID. |
| `style_prompt` | string | No | `null` | Environmental context, lighting, camera angle, and scene styling. |

**Supported Variant Types:**
- **expression**: `happy`, `confident`, `thinking`, `relaxed`, `surprised`, `serious`, `playful`.
- **pose**: `standing`, `sitting`, `leaning`, `walking`, `running`.
- **outfit**: `casual`, `business`, `formal`, `athletic`, `evening`.

### `POST /brand/v1/brands/{brand_id}/check-compliance`
Score image against brand guidelines.

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `file` | file | **Yes** | — | Generated image to audit. |

**Compliance Scoring Deep-Dive:**
- **overall_score**: The composite score (0-100).
- **color_score**: Evaluates exact pixel matches against primary/secondary hex codes.
- **style_score**: Checks alignment with extracted visual DNA keywords.
- **coherence_score**: Verifies facial locking and biometric similarity to the master ambassador face.
- **quality_score**: Flags artifacting, extra limbs, or poor lighting.

### `GET /brand/v1/brands`
List all brand profiles.

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `limit` | integer | No | `50` | Pagination limit. |
| `offset` | integer | No | `0` | Pagination offset. |

### `DELETE /brand/v1/brands/{brand_id}`
Delete a brand profile.

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `brand_id` | string | **Yes** | — | (Path) Brand ID. |

---

## Social Platform Optimization

Assets need to match social platforms. Ensure you adapt your style prompts and potential crop hints to hit these aspect ratios:
- **1:1** - Instagram Feed
- **9:16** - Instagram Stories / Reels, TikTok
- **16:9** - YouTube Thumbnails, LinkedIn Banners

---

## Error Handling, Retry Patterns, and Async Polling

Because GPU rendering takes time, some endpoints may return a `202 Accepted` status with a Job ID. You should poll the job status or wait for a webhook.
For failures (e.g., `429 Too Many Requests` or `503 Service Unavailable`), implement a DLQ (Dead Letter Queue) or exponential backoff retry.

::: warning
Always ensure you have enough `wallet.available_usd`. A `402 Payment Required` will halt the pipeline if the required USD cost exceeds your balance.
:::

---

## Webhooks & Webhook Integration

### Webhook: `campaign.completed`
Listen for asset completion via webhooks. We sign payloads with HMAC-SHA256 using your webhook secret.

#### Python FastAPI Handler
```python
from fastapi import FastAPI, Request, HTTPException
import hmac
import hashlib
import os

app = FastAPI()
WEBHOOK_SECRET = os.environ.get("FOTOHUB_WEBHOOK_SECRET", "whsec_...")

@app.post("/webhooks/fotohub")
async def handle_webhook(request: Request):
    signature = request.headers.get("X-FotoHub-Signature")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")
        
    payload = await request.body()
    expected_sig = hmac.new(
        WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected_sig):
        raise HTTPException(status_code=401, detail="Invalid signature")
        
    data = await request.json()
    if data.get("event") == "campaign.completed":
        print(f"Campaign {data['campaign_id']} is done. Output URLs: {data['urls']}")
        
    return {"status": "ok"}
```

#### TypeScript Express Handler
```typescript
import express from 'express';
import crypto from 'crypto';

const app = express();
const WEBHOOK_SECRET = process.env.FOTOHUB_WEBHOOK_SECRET || 'whsec_...';

app.post('/webhooks/fotohub', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-fotohub-signature'] as string;
  
  if (!signature) {
    return res.status(400).send('Missing signature');
  }

  const expectedSig = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (signature !== expectedSig) {
    return res.status(401).send('Invalid signature');
  }

  const payload = JSON.parse(req.body.toString());
  if (payload.event === 'campaign.completed') {
    console.log(`Campaign ${payload.campaign_id} complete. URLs:`, payload.urls);
  }

  res.status(200).send('ok');
});

app.listen(3000, () => console.log('Listening on port 3000'));
```

---

## BYOB Destination Export (S3/R2 Bucket Delivery)

::: warning Not a real capability
Brand Engine does not accept an `export_destination` block or AWS/R2 credentials
anywhere, and does not auto-push generated assets to a customer-owned bucket.
`POST /brand/v1/brands/{brand_id}/export` streams a JSON/ZIP bundle of the brand
kit back in the response — that is the only export capability that exists.
:::

---

## Multi-Brand Agency Workflow

For agencies managing 10+ brands, you can segment API calls by injecting an `Agency-Client-Id` header. This separates the `wallet.available_usd` billing reports per client and partitions the generated faces in your CDN catalog.

---

## Virtual Influencer Content Calendar Automation Script

Below is a pure Python `asyncio` script to generate a full 30-asset content calendar automatically for a multi-campaign rollout.

```python
import asyncio
import aiohttp
import os

API_KEY = os.environ.get("FOTOHUB_API_KEY")
API_BASE = "https://apis.fotohub.app/v1"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

async def generate_asset(session, brand_id, face_id, variant, style):
    url = f"{API_BASE}/brands/{brand_id}/faces/{face_id}/expressions"
    payload = {
        "variants": [variant],
        "variant_type": "expression",
        "style_prompt": style
    }
    async with session.post(url, json=payload, headers=HEADERS) as resp:
        data = await resp.json()
        return data

async def generate_calendar(brand_id, face_id):
    prompts = [
        ("happy", "Coffee shop morning, soft sunlight, 1:1 ratio"),
        ("confident", "Office walking pose, business casual, 9:16 ratio"),
        ("relaxed", "Weekend reading, cozy sweater, 16:9 ratio"),
        # ... expand to 30 scenarios
    ] * 10
    
    async with aiohttp.ClientSession() as session:
        tasks = [generate_asset(session, brand_id, face_id, v, s) for v, s in prompts]
        results = await asyncio.gather(*tasks)
        
        for res in results:
            print(res)

if __name__ == "__main__":
    asyncio.run(generate_calendar("brd_123", "fac_456"))
```

---

## Complete 4-Way Code Examples for the Full Pipeline

::: code-group

```python [Python]
import os
import time
import requests

API_BASE = "https://apis.fotohub.app/v1"
API_KEY = os.environ["FOTOHUB_API_KEY"]
HEADERS = {"Authorization": f"Bearer fh_live_your_api_key"}

def run_brand_influencer_pipeline(moodboard_path: str):
    brand_payload = {
        "name": "Aura Botanica",
        "description": "Clean, eco-luxe dermatological skincare formulated with Nordic flora.",
        "industry": "Beauty & Personal Care",
        "brand_voice": "Serene, clinical, scientifically transparent, soothing"
    }
    resp = requests.post(f"{API_BASE}/brands", headers=HEADERS, json=brand_payload)
    brand_id = resp.json()["id"]

    with open(moodboard_path, "rb") as f:
        files = {"file": ("moodboard.png", f, "image/png")}
        dna = requests.post(
            f"{API_BASE}/brands/{brand_id}/extract-dna",
            headers=HEADERS, files=files
        ).json()
    
    face_gen_payload = {
        "prompt": "Hyperrealistic portrait of Maya, brand ambassador. Natural dewy skin.",
        "ai_model": "nano-banana-pro",
        "generation_config": {
            "gender": "female",
            "age_range": "27-30",
            "ethnicity": "Nordic Scandinavian",
            "skin_tone": "fair porcelain with warm neutral undertones",
            "hair_color": "honey ash blonde",
            "hair_style": "effortless wavy shoulder-length lob",
            "clothing": "minimalist organic cream ribbed knit top"
        }
    }
    face_res = requests.post(
        f"{API_BASE}/brands/{brand_id}/faces/generate",
        headers=HEADERS, json=face_gen_payload
    ).json()
    face_id = face_res["face"]["id"]

    requests.post(
        f"{API_BASE}/brands/{brand_id}/faces/{face_id}/perspectives",
        headers=HEADERS,
        json={"perspectives": ["front", "three_quarter_left", "three_quarter_right", "profile_left"]}
    )

    batch_res = requests.post(
        f"{API_BASE}/brands/{brand_id}/faces/{face_id}/expressions",
        headers=HEADERS,
        json={
            "variants": ["happy", "confident", "thinking"],
            "variant_type": "expression",
            "style_prompt": "Bright modern travertine bathroom, holding green glass serum bottle, natural dewy morning light"
        }
    ).json()

    sample_img = requests.get(batch_res["variant_urls"]["happy"]).content
    audit = requests.post(
        f"{API_BASE}/brands/{brand_id}/check-compliance",
        headers=HEADERS, files={"file": ("asset.png", sample_img, "image/png")}
    ).json()
    print("Audit Score:", audit["overall_score"])

if __name__ == "__main__":
    run_brand_influencer_pipeline("./brand_moodboard.png")
```

```typescript [TypeScript]
import axios from "axios";
import * as fs from "fs";
import FormData from "form-data";

const API_BASE = "https://apis.fotohub.app/v1";
const client = axios.create({
  baseURL: API_BASE,
  headers: { Authorization: `Bearer fh_live_your_api_key` },
});

async function orchestrateVirtualInfluencer(moodboardPath: string) {
  const { data: brand } = await client.post("/brands", {
    name: "Lumina Organics",
    description: "Bioactive botanical facial elixirs engineered for modern urban skin.",
    industry: "Beauty & Cosmetics",
  });

  const form = new FormData();
  form.append("file", fs.createReadStream(moodboardPath));
  await client.post(`/brands/${brand.id}/extract-dna`, form, { headers: form.getHeaders() });

  const { data: faceRes } = await client.post(`/brands/${brand.id}/faces/generate`, {
      prompt: "Editorial portrait of Elena, virtual ambassador for Lumina Organics.",
      ai_model: "nano-banana-pro",
      generation_config: {
        gender: "female",
        age_range: "26-29",
        ethnicity: "Mediterranean",
        skin_tone: "warm olive",
        hair_color: "deep espresso brown",
      },
  });

  await client.post(`/brands/${brand.id}/faces/${faceRes.face.id}/perspectives`, {
    perspectives: ["front", "three_quarter_left", "three_quarter_right", "profile_left"]
  });

  const { data: variantRes } = await client.post(`/brands/${brand.id}/faces/${faceRes.face.id}/expressions`, {
      variants: ["happy", "confident", "thinking"],
      variant_type: "expression",
      style_prompt: "Holding product dropper bottle in modern luxury bathroom with marble surfaces",
  });

  const auditForm = new FormData();
  const sampleImageStream = (await axios.get(variantRes.variant_urls.happy, { responseType: "stream" })).data;
  auditForm.append("file", sampleImageStream, "variant_happy.png");
  const { data: audit } = await client.post(`/brands/${brand.id}/check-compliance`, auditForm, { headers: auditForm.getHeaders() });
  console.log("Compliance Score:", audit.overall_score);
}
orchestrateVirtualInfluencer("./moodboard.png").catch(console.error);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

const apiBase = "https://apis.fotohub.app/v1"

func main() {
	apiKey := "fh_live_your_api_key"
	client := &http.Client{}

	brandBody := map[string]interface{}{
		"name": "Solstice Silk",
		"description": "Ethical mulberry silk sleepwear and wellness accessories.",
		"industry": "Fashion & Apparel",
	}
	brandJSON, _ := json.Marshal(brandBody)
	req, _ := http.NewRequest("POST", apiBase+"/brands", bytes.NewBuffer(brandJSON))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")
	resp, _ := client.Do(req)
	
	var brand map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&brand)
	brandID := brand["id"].(string)

	faceBody := map[string]interface{}{
		"prompt": "Full-body cinematic photograph of Chloe, brand ambassador.",
		"ai_model": "nano-banana-pro",
		"generation_config": map[string]string{
			"gender": "female",
			"age_range": "28-32",
			"ethnicity": "French Caucasian",
		},
	}
	faceJSON, _ := json.Marshal(faceBody)
	fReq, _ := http.NewRequest("POST", fmt.Sprintf("%s/brands/%s/faces/generate", apiBase, brandID), bytes.NewBuffer(faceJSON))
	fReq.Header.Set("Authorization", "Bearer "+apiKey)
	fReq.Header.Set("Content-Type", "application/json")
	client.Do(fReq)
}
```

```bash [cURL]
# 1. Initialize Brand Workspace
BRAND_ID=$(curl -s -X POST https://apis.fotohub.app/brand/v1/brands   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{
    "name": "Nordic Botanicals",
    "description": "Wild-harvested organic skincare from Lapland",
    "industry": "Clean Beauty"
  }' | jq -r '.id')

# 2. Extract Brand DNA
curl -s -X POST "https://apis.fotohub.app/brand/v1/brands/$BRAND_ID/extract-dna"   -H "Authorization: Bearer fh_live_your_api_key"   -F "file=@moodboard.png;type=image/png"

# 3. Mint Face
FACE_ID=$(curl -s -X POST "https://apis.fotohub.app/brand/v1/brands/$BRAND_ID/faces/generate"   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{
    "prompt": "Authentic studio portrait of Freja, official virtual brand ambassador.",
    "ai_model": "nano-banana-pro",
    "generation_config": {
      "gender": "female",
      "age_range": "26-29",
      "ethnicity": "Nordic"
    }
  }' | jq -r '.face.id')

# 4. Generate Perspectives
curl -s -X POST "https://apis.fotohub.app/brand/v1/brands/$BRAND_ID/faces/$FACE_ID/perspectives"   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{
    "perspectives": ["front", "three_quarter_left", "three_quarter_right", "profile_left"]
  }'

# 5. Generate Lifestyle Expressions
curl -s -X POST "https://apis.fotohub.app/brand/v1/brands/$BRAND_ID/faces/$FACE_ID/expressions"   -H "Authorization: Bearer fh_live_your_api_key"   -H "Content-Type: application/json"   -d '{
    "variants": ["happy", "confident", "thinking"],
    "variant_type": "expression"
  }'

# 6. Check Compliance
curl -s -X POST "https://apis.fotohub.app/brand/v1/brands/$BRAND_ID/check-compliance"   -H "Authorization: Bearer fh_live_your_api_key"   -F "file=@rendered_variant.png;type=image/png"
```

:::
