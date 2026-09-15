# Automated UGC Video Ad Pipeline

A production blueprint for e-commerce brands, direct-to-consumer (DTC) operators, and performance marketing agencies to generate high-converting, vertical user-generated content (UGC) video ads at scale.

This recipe automates the entire creative lifecycle: scraping product pages for selling points, generating viral hooks and multi-beat scripts, casting hyper-realistic AI actors with lip-sync, synthesizing voice tracks via Google Gemini TTS or Azure Speech, compositing dynamic B-roll and product overlays, and delivering finished 9:16 ads directly to Cloudflare R2 buckets or TikTok ad accounts.

---

## Production Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Client as Marketing Agency / E-com App
    participant UGC as FotoHUB UGC Engine (/ugc)
    participant LLM as FOTOhub Creative Writer
    participant Actor as FOTOhub Actor Engine
    participant TTS as FOTOhub Speech Engine
    participant Compositor as FOTOhub Compositor
    participant Dest as Cloudflare R2 & TikTok API

    Client->>UGC: 1. POST /ugc/creative/brief (Product URL)
    UGC-->>Client: Parsed Brief (Value props, persona, compliance)
    Client->>UGC: 2. POST /ugc/creative/angles (Count: 3, Formats)
    UGC->>LLM: Generate direct-response angles & hooks
    LLM-->>UGC: 3 viral angles (Problem-Solution, Unboxing, Testimonial)
    UGC-->>Client: Angles & Hook options
    Client->>UGC: 3. POST /ugc/creative/script (Selected angle)
    UGC->>LLM: Write 5-beat timed script (Hook, Problem, Demo, Proof, CTA)
    LLM-->>UGC: Spoken lines + shot list + B-roll cues
    UGC-->>Client: Structured ScriptDraft & Scene blueprints
    Client->>TTS: 4. POST /v1/ai/tts/gemini/synthesize (Lines + Style)
    TTS-->>Client: 24 kHz Broadcast Audio WAV
    Client->>UGC: 5. PUT /ugc/projects/{id}/blueprint (Scenes + Voice + Actor)
    Client->>UGC: 6. POST /ugc/projects/{id}/render (Idempotency Key)
    UGC->>Actor: Face likeness animation & lip-sync pass
    UGC->>Compositor: Stitch 9:16 video + captions + ducked music
    Compositor-->>UGC: Render completed (1080x1920 MP4)
    UGC->>Dest: 7. S3 mirror to Cloudflare R2 & TikTok Auto-Post
    UGC-->>Client: Webhook: ugc.render.completed (Video URL, Metrics)
```

---

## Step-by-Step Implementation

### Step 1: Ingest Product Page into Creative Brief

Extract core value propositions, target audience personas, and regulatory claim boundaries from any public product URL (Shopify, Amazon, WooCommerce, or custom storefronts):

```http
POST https://apis.fotohub.app/ugc/creative/brief
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json

{
  "url": "https://glowbotanics.com/products/retinol-glow-serum"
}
```

#### Response Example

```json
{
  "product_name": "Retinol Glow 2.5% Encapsulated Youth Serum",
  "category": "Skincare & Anti-Aging",
  "brand_name": "GlowBotanics",
  "value_propositions": [
    "Zero peeling or redness with liposomal encapsulation",
    "Visible fine line smoothing in 14 days of nightly use",
    "Fragrance-free, vegan, and dermatologist formulated"
  ],
  "target_audience": "Women 26-45 dealing with early signs of aging or dull skin",
  "disallowed_claims": [
    "Replaces clinical laser treatments",
    "Permanently erases deep wrinkles"
  ]
}
```

---

### Step 2: Generate High-CTR Angles & Viral Hooks

Query `/ugc/creative/angles` to generate 3 proven direct-response frameworks (`problem_solution`, `unboxing`, `testimonial`):

```http
POST https://apis.fotohub.app/ugc/creative/angles
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json

{
  "brief": {
    "product_name": "Retinol Glow 2.5% Encapsulated Youth Serum",
    "category": "Skincare",
    "value_propositions": [
      "Zero peeling or redness with liposomal encapsulation",
      "Visible fine line smoothing in 14 days"
    ],
    "target_audience": "Women 26-45"
  },
  "count": 3,
  "formats": ["problem_solution", "testimonial", "unboxing"]
}
```

The endpoint returns angles structured around immediate thumb-stop opening hooks:
- **Hook 1 (Problem-Solution)**: *"Stop using aggressive drugstore retinols that peel your skin off!"*
- **Hook 2 (Testimonial)**: *"My esthetician actually begged me to reveal what changed in my night routine."*
- **Hook 3 (Unboxing/Demo)**: *"I tested the viral liposomal retinol everyone is talking about for 14 days."*

---

### Step 3: Generate Timed Spoken Script & Scene List

Submit the chosen angle to `/ugc/creative/script` to produce a timed, 5-beat spoken script with visual action notes. Durations are bounded strictly between 4 and 15 seconds per scene:

```http
POST https://apis.fotohub.app/ugc/creative/script
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json

{
  "brief": { "product_name": "Retinol Glow 2.5% Encapsulated Youth Serum" },
  "angle": {
    "id": "angle_prob_sol_01",
    "format": "problem_solution",
    "hook": "Stop using aggressive drugstore retinols that peel your skin off!",
    "concept": "Highlight common retinol barrier damage and present liposomal delivery as the gentle fix."
  },
  "speed": 1.05
}
```

The returned payload provides exact scene timestamps, actor delivery directions, and product placement slots (`refs` and `product_urls`).

---

### Step 4: Cast AI Actor & Synthesize Voice

#### 1. Select or Cast AI Actor
List available pre-registered catalog actors via `GET /ugc/actors` or preview tailored personas using casting axes via `POST /ugc/actors/preview`:

```json
{
  "axes": {
    "type": "genz_skincare",
    "age": "late_20s",
    "gender": "female",
    "ethnicity": "latina",
    "vibe": "relatable_ugc"
  },
  "count": 4
}
```

Choose an actor from the catalog, such as `act_sarah_ugc_01`.

#### 2. Synthesize High-Energy Voiceover
Call Google Gemini TTS (`/v1/ai/tts/gemini/synthesize`) or Azure Neural Speech (`/v1/ai/tts/azure/synthesize`) to generate broadcast-quality spoken audio:

```http
POST https://apis.fotohub.app/v1/ai/tts/gemini/synthesize
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json

{
  "text": "Stop using aggressive drugstore retinols that wreck your skin barrier! This encapsulated retinol smoothed my lines in two weeks without a single dry patch.",
  "model": "gemini-2.5-flash-tts",
  "voice": "en-US-Journey-F",
  "style": "Fast-paced, authentic, enthusiastic TikTok creator holding a beauty bottle",
  "temperature": 0.8
}
```

---

### Step 5: Assemble Blueprint & Preflight USD Estimate

FotoHUB validates every render against a strict Blueprint schema (`PUT /ugc/projects/{project_id}/blueprint`). You can inspect the exact dollar cost before spending a cent via `POST /ugc/estimate`:

```http
POST https://apis.fotohub.app/ugc/estimate
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json

{
  "document": {
    "blueprint_version": 1,
    "format": { "ratio": "9:16", "fps": 24, "resolution": "720p" },
    "actor": { "actor_id": "act_sarah_ugc_01" },
    "audio": {
      "strategy": "redub",
      "provider": "grok",
      "voice_id": "en-US-Journey-F",
      "speed": 1.05,
      "lipsync": "fast"
    },
    "scenes": [
      {
        "index": 0,
        "role": "hook",
        "line": "Stop using aggressive drugstore retinols that peel your skin off!",
        "shot": "Close-up selfie camera, shocked expression, holding bottle to lens",
        "duration_s": 5,
        "refs": [{ "asset": "retinol_bottle", "note": "Primary serum packshot" }]
      },
      {
        "index": 1,
        "role": "problem",
        "line": "Traditional retinols cause severe redness, peeling, and skin barrier destruction.",
        "shot": "Medium shot pointing to cheek, relatable frustrated expression",
        "duration_s": 6
      },
      {
        "index": 2,
        "role": "demo",
        "line": "GlowBotanics encapsulates their retinol in lipid bubbles so it absorbs deeply without irritation.",
        "shot": "B-roll cutaway applying 3 drops of clear serum to back of hand",
        "duration_s": 7,
        "refs": [{ "asset": "serum_texture", "note": "Dropper texture close-up" }]
      },
      {
        "index": 3,
        "role": "proof",
        "line": "Fourteen days in, my skin texture is glassy and fine lines around my eyes are gone.",
        "shot": "Selfie video under natural bathroom window light showing glowing skin",
        "duration_s": 6
      },
      {
        "index": 4,
        "role": "cta",
        "line": "Click the button below to get twenty percent off your first bottle before it sells out!",
        "shot": "Holding bottle up with friendly smile, pointing down toward CTA button",
        "duration_s": 6
      }
    ],
    "captions": {
      "style": "ugc_bold",
      "burn": true,
      "max_chars_per_line": 24,
      "max_lines": 2,
      "accent": "#FFE14D"
    },
    "music": {
      "track_id": "track_upbeat_pop_bed_02",
      "duck_db": -16,
      "sidechain": true
    },
    "polish": {
      "motion": "push_in",
      "transition": "cut",
      "loudness_lufs": -14.0
    },
    "end_card": {
      "line": "Use code GLOW20 for 20% Off",
      "handle": "@glowbotanics",
      "seconds": 2.4,
      "colour": "#FFE14D"
    }
  }
}
```

#### Preflight Estimate Response

```json
{
  "video_seconds": 30,
  "tts_characters": 372,
  "redub_passes": 5,
  "usd_total": 1.7456,
  "breakdown": [
    { "kind": "video", "units": 30, "usd": 1.5000 },
    { "kind": "tts", "units": 372, "usd": 0.0056 },
    { "kind": "redub", "units": 30, "usd": 0.2400 }
  ],
  "lipsync_gpu_seconds": 18,
  "lipsync_mode": "fast"
}
```

---

## 4-Way Production Code Snippets

The following complete scripts automate the pipeline from project setup through blueprint rendering and webhook handling.

::: code-group

```python [Python]
"""Automated UGC Video Ad Pipeline for E-Commerce Brands."""

import os
import time
import requests

API_KEY = os.environ.get("FOTOHUB_API_KEY", "fh_live_sample_key")
BASE_URL = "https://apis.fotohub.app"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

def create_ugc_campaign(product_url: str) -> dict:
    print(f"[1/5] Ingesting product URL: {product_url}")
    brief_resp = requests.post(
        f"{BASE_URL}/ugc/creative/brief",
        headers=HEADERS,
        json={"url": product_url},
        timeout=30,
    )
    brief_resp.raise_for_status()
    brief = brief_resp.json()
    print(f"      Product recognized: {brief.get('product_name')}")

    print("[2/5] Generating 3 viral direct-response angles...")
    angles_resp = requests.post(
        f"{BASE_URL}/ugc/creative/angles",
        headers=HEADERS,
        json={
            "brief": brief,
            "count": 3,
            "formats": ["problem_solution", "testimonial", "unboxing"],
        },
        timeout=30,
    )
    angles_resp.raise_for_status()
    angles_data = angles_resp.json()
    selected_angle = angles_data["angles"][0]
    print(f"      Selected angle: {selected_angle.get('hook')}")

    print("[3/5] Creating UGC project and building script...")
    proj_resp = requests.post(
        f"{BASE_URL}/ugc/projects",
        headers=HEADERS,
        json={
            "title": f"UGC Ad - {brief.get('product_name')[:30]}",
            "brief": brief,
        },
        timeout=15,
    )
    proj_resp.raise_for_status()
    project_id = proj_resp.json()["id"]

    script_resp = requests.post(
        f"{BASE_URL}/ugc/creative/script",
        headers=HEADERS,
        json={"brief": brief, "angle": selected_angle, "speed": 1.05},
        timeout=30,
    )
    script_resp.raise_for_status()
    scenes = script_resp.json()["scenes"]

    # Construct the validated blueprint
    blueprint = {
        "blueprint_version": 1,
        "format": {"ratio": "9:16", "fps": 24, "resolution": "720p"},
        "actor": {"actor_id": "act_sarah_ugc_01"},
        "audio": {
            "strategy": "redub",
            "provider": "grok",
            "voice_id": "en-US-Journey-F",
            "speed": 1.05,
            "lipsync": "fast",
        },
        "scenes": scenes,
        "captions": {
            "style": "ugc_bold",
            "burn": True,
            "max_chars_per_line": 24,
            "max_lines": 2,
            "accent": "#FFE14D",
        },
        "music": {
            "track_id": "track_upbeat_pop_bed_02",
            "duck_db": -16,
            "sidechain": True,
        },
        "polish": {
            "motion": "push_in",
            "transition": "cut",
            "loudness_lufs": -14.0,
        },
        "end_card": {
            "line": "Get 20% Off First Order",
            "handle": "@glowbotanics",
            "seconds": 2.4,
            "colour": "#FFE14D",
        },
    }

    print("[4/5] Saving blueprint to project...")
    bp_resp = requests.put(
        f"{BASE_URL}/ugc/projects/{project_id}/blueprint",
        headers=HEADERS,
        json={"document": blueprint},
        timeout=20,
    )
    bp_resp.raise_for_status()
    estimate = bp_resp.json().get("estimate", {})
    print(f"      Preflight cost estimate: ${estimate.get('usd_total'):.4f} USD")

    print("[5/5] Triggering video render job...")
    render_resp = requests.post(
        f"{BASE_URL}/ugc/projects/{project_id}/render",
        headers=HEADERS,
        json={
            "idempotency_key": f"render_{project_id}_{int(time.time())}",
            "variant_label": "angle_problem_solution_v1",
            "product_urls": {
                "retinol_bottle": "https://storage.glowbotanics.com/packshots/serum_bottle.png",
                "serum_texture": "https://storage.glowbotanics.com/packshots/dropper_texture.png",
            },
        },
        timeout=30,
    )
    render_resp.raise_for_status()
    job_info = render_resp.json()
    job_id = job_info["job"]["id"]
    print(f"      Render queued: Job ID {job_id}")

    # Polling for job completion (production apps should rely on Webhooks)
    print("      Waiting for rendering to complete...")
    for _ in range(60):
        status_resp = requests.get(
            f"{BASE_URL}/ugc/jobs/{job_id}",
            headers=HEADERS,
            timeout=15,
        )
        status_data = status_resp.json()
        state = status_data["job"]["state"]
        if state == "completed":
            video_url = status_data["render"]["video_url"]
            print(f"\nRender Success! Video URL:\n{video_url}")
            return status_data
        elif state == "failed":
            raise RuntimeError(f"Rendering failed: {status_data['job'].get('error')}")
        time.sleep(5)

    raise TimeoutError("Render did not finish within 300 seconds")

if __name__ == "__main__":
    result = create_ugc_campaign("https://glowbotanics.com/products/retinol-glow-serum")
```

```typescript [TypeScript]
/**
 * Automated UGC Video Ad Pipeline in TypeScript.
 */

interface BriefResponse {
  product_name: string;
  category: string;
  value_propositions: string[];
  target_audience: string;
}

interface CreativeAngle {
  id: string;
  format: string;
  hook: string;
  concept: string;
}

interface RenderJobResponse {
  job: { id: string; state: string };
  estimate: { usd_total: number; video_seconds: number };
}

const API_KEY = process.env.FOTOHUB_API_KEY || "fh_live_sample_key";
const BASE_URL = "https://apis.fotohub.app";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status} on ${path}: ${errorText}`);
  }
  return (await res.json()) as T;
}

async function runUgcPipeline(productUrl: string) {
  console.log(`[1/5] Ingesting brief: ${productUrl}`);
  const brief = await postJson<BriefResponse>("/ugc/creative/brief", {
    url: productUrl,
  });

  console.log(`[2/5] Requesting viral hooks for ${brief.product_name}...`);
  const anglesData = await postJson<{ angles: CreativeAngle[] }>(
    "/ugc/creative/angles",
    {
      brief,
      count: 3,
      formats: ["problem_solution", "testimonial", "unboxing"],
    }
  );
  const selectedAngle = anglesData.angles[0];
  console.log(`Selected Hook: "${selectedAngle.hook}"`);

  console.log("[3/5] Generating timed scene script...");
  const scriptData = await postJson<{ scenes: any[] }>("/ugc/creative/script", {
    brief,
    angle: selectedAngle,
    speed: 1.05,
  });

  console.log("[4/5] Creating UGC project...");
  const project = await postJson<{ id: string }>("/ugc/projects", {
    title: `UGC - ${brief.product_name.slice(0, 24)}`,
    brief,
  });

  const blueprint = {
    blueprint_version: 1,
    format: { ratio: "9:16", fps: 24, resolution: "720p" },
    actor: { actor_id: "act_sarah_ugc_01" },
    audio: {
      strategy: "redub",
      provider: "grok",
      voice_id: "en-US-Journey-F",
      speed: 1.05,
      lipsync: "fast",
    },
    scenes: scriptData.scenes,
    captions: {
      style: "ugc_bold",
      burn: true,
      max_chars_per_line: 24,
      max_lines: 2,
      accent: "#FFE14D",
    },
    music: {
      track_id: "track_upbeat_pop_bed_02",
      duck_db: -16,
      sidechain: true,
    },
    polish: { motion: "push_in", transition: "cut", loudness_lufs: -14.0 },
    end_card: {
      line: "Get 20% Off With Code GLOW20",
      handle: "@glowbotanics",
      seconds: 2.4,
      colour: "#FFE14D",
    },
  };

  await fetch(`${BASE_URL}/ugc/projects/${project.id}/blueprint`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ document: blueprint }),
  });

  console.log("[5/5] Submitting video render...");
  const render = await postJson<RenderJobResponse>(
    `/ugc/projects/${project.id}/render`,
    {
      idempotency_key: `ugc_ts_${project.id}_${Date.now()}`,
      variant_label: "hook_1_problem_solution",
      product_urls: {
        retinol_bottle: "https://storage.glowbotanics.com/serum.png",
      },
    }
  );

  console.log(`Render submitted! Job ID: ${render.job.id}`);
  console.log(`Estimated Cost: $${render.estimate.usd_total.toFixed(4)} USD`);
}

runUgcPipeline("https://glowbotanics.com/products/retinol-glow-serum").catch(
  console.error
);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

const baseURL = "https://apis.fotohub.app"

type BriefRequest struct {
	URL string `json:"url"`
}

type ProjectRequest struct {
	Title string                 `json:"title"`
	Brief map[string]interface{} `json:"brief"`
}

type RenderRequest struct {
	IdempotencyKey string            `json:"idempotency_key"`
	VariantLabel   string            `json:"variant_label"`
	ProductURLs    map[string]string `json:"product_urls"`
}

func doRequest(method, endpoint string, payload interface{}) ([]byte, error) {
	apiKey := os.Getenv("FOTOHUB_API_KEY")
	var body io.Reader
	if payload != nil {
		data, err := json.Marshal(payload)
		if err != nil {
			return nil, err
		}
		body = bytes.NewBuffer(data)
	}

	req, err := http.NewRequest(method, baseURL+endpoint, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("API Error %d: %s", resp.StatusCode, string(respBytes))
	}
	return respBytes, err
}

func main() {
	fmt.Println("[1/4] Ingesting product URL into brief...")
	briefBytes, err := doRequest("POST", "/ugc/creative/brief", BriefRequest{
		URL: "https://glowbotanics.com/products/retinol-glow-serum",
	})
	if err != nil {
		panic(err)
	}

	var brief map[string]interface{}
	json.Unmarshal(briefBytes, &brief)
	fmt.Printf("Parsed Product: %v\n", brief["product_name"])

	fmt.Println("[2/4] Initializing project...")
	projBytes, err := doRequest("POST", "/ugc/projects", ProjectRequest{
		Title: "Go UGC Campaign",
		Brief: brief,
	})
	if err != nil {
		panic(err)
	}

	var project map[string]interface{}
	json.Unmarshal(projBytes, &project)
	projectID := project["id"].(string)

	fmt.Printf("[3/4] Triggering render for project %s...\n", projectID)
	renderBytes, err := doRequest("POST", fmt.Sprintf("/ugc/projects/%s/render", projectID), RenderRequest{
		IdempotencyKey: fmt.Sprintf("go_render_%d", time.Now().Unix()),
		VariantLabel:   "go_ugc_angle_1",
		ProductURLs: map[string]string{
			"packshot": "https://storage.glowbotanics.com/serum.png",
		},
	})
	if err != nil {
		panic(err)
	}

	fmt.Printf("[4/4] Render accepted: %s\n", string(renderBytes))
}
```

```bash [cURL]
# 1. Parse e-commerce product URL into creative brief
curl -s -X POST https://apis.fotohub.app/ugc/creative/brief \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://glowbotanics.com/products/retinol-glow-serum"
  }'

# 2. Generate 3 direct-response angles and viral opening hooks
curl -s -X POST https://apis.fotohub.app/ugc/creative/angles \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "brief": {
      "product_name": "Retinol Glow Serum",
      "category": "Skincare"
    },
    "count": 3,
    "formats": ["problem_solution", "testimonial", "unboxing"]
  }'

# 3. Request preflight USD cost estimate before rendering
curl -s -X POST https://apis.fotohub.app/ugc/estimate \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "document": {
      "blueprint_version": 1,
      "format": { "ratio": "9:16", "fps": 24, "resolution": "720p" },
      "actor": { "actor_id": "act_sarah_ugc_01" },
      "audio": { "strategy": "redub", "speed": 1.05, "lipsync": "fast" },
      "scenes": [
        {
          "index": 0, "role": "hook", "duration_s": 5,
          "line": "Stop using aggressive drugstore retinols!",
          "shot": "Selfie camera close-up holding bottle"
        },
        {
          "index": 1, "role": "problem", "duration_s": 6,
          "line": "Most retinols peel your skin barrier down to raw skin.",
          "shot": "Frustrated expression pointing to cheek"
        },
        {
          "index": 2, "role": "demo", "duration_s": 7,
          "line": "This encapsulated formula absorbs gently without irritation.",
          "shot": "Dropper application to back of hand"
        },
        {
          "index": 3, "role": "proof", "duration_s": 6,
          "line": "Look at this glow after just fourteen days.",
          "shot": "Bathroom light glass-skin reveal"
        },
        {
          "index": 4, "role": "cta", "duration_s": 6,
          "line": "Grab twenty percent off today with the link below!",
          "shot": "Smiling and holding bottle toward viewer"
        }
      ]
    }
  }'

# 4. Trigger video render with idempotency key
curl -s -X POST https://apis.fotohub.app/ugc/projects/proj_91204a/render \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "idempotency_key": "curl_ugc_test_001",
    "variant_label": "angle_problem_solution_v1",
    "product_urls": {
      "retinol_bottle": "https://storage.glowbotanics.com/serum.png"
    }
  }'
```

:::

---

## Direct Delivery: Cloudflare R2 & TikTok Auto-Posting

Once the video completes, FOTOhub can automatically mirror the rendered asset to your own private Cloudflare R2 bucket and schedule the ad on TikTok.

### 1. Connect Cloudflare R2 Destination

Attach your S3-compatible R2 storage so every rendered MP4 and cover JPEG is mirrored immediately to your CDN:

```http
POST https://apis.fotohub.app/v1/destinations
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json

{
  "name": "Production E-com R2 Bucket",
  "provider": "r2",
  "bucket": "ugc-ads-cdn",
  "region": "auto",
  "account_id": "0123456789abcdef0123456789abcdef",
  "access_key_id": "r2_access_key_xyz",
  "secret_access_key": "r2_secret_token_123",
  "path_prefix": "campaigns/2026-q3"
}
```

### 2. Auto-Publish to TikTok Ads / Creator Account

Leverage FotoHUB Social Studio (`/v1/posts`) to post the rendered ad video directly:

```http
POST https://apis.fotohub.app/v1/posts
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json

{
  "target_accounts": ["acc_tiktok_glowbotanics"],
  "text": "The only retinol that won't ruin your skin barrier ✨ Tap below to shop 20% off! #skincaretips #retinolroutine #ugcad",
  "media_urls": [
    "https://ugc-ads-cdn.glowbotanics.com/campaigns/2026-q3/ugc_render_91204a.mp4"
  ],
  "publish_at": "2026-09-06T18:00:00Z"
}
```

---

## Parameter Specifications

### Creative & Blueprint Schema

| Parameter | Type | Required | Constraints | Description |
|:---|:---|:---:|:---|:---|
| `url` | string | Yes | HTTP/HTTPS | Storefront product page URL to ingest. Link-local and private IPs are blocked. |
| `format.ratio` | string | No | `"9:16"` | Vertical format for TikTok, Reels, and YouTube Shorts. |
| `format.fps` | integer | No | `24` \| `25` \| `30` (default `24`) | Delivery frame rate. The model films at its own rate and every part is re-encoded, so this is a delivery choice: `24` is the default look, `25` is European broadcast, `30` is what the feeds publish at. A rate outside this set is refused rather than silently downgraded. |
| `format.resolution`| string | No | `"720p"` \| `"480p"` | Default `720p` (1080x1920 composite). |
| `actor.actor_id` | string | Yes | Valid Actor ID | Actor from your roster or from the catalog. |
| `setting` | string | No | null | One sentence describing where the whole ad is filmed, applied to every scene that does not place itself. Empty means each scene is placed only by its own action. |
| `audio.strategy` | string | No | `"redub"` \| `"native"` \| `"refaudio"` | `"redub"` synthesises the track and re-times the take to it; `"native"` keeps the model's own reading; `"refaudio"` films to an audio reference. |
| `audio.lipsync` | string | No | `"off"` \| `"fast"` \| `"hd"` \| `"ultra"` (default `"off"`) | A second video pass so the mouth follows the mixed track instead of the model's own reading. Off by default: it is extra render time on a clip that is already usable, and a product-in-hand shot with the actor half turned away gains nothing from it. |
| `scenes[].role` | string | Yes | `hook`, `problem`, `demo`, `proof`, `cta` | Direct-response beat role. |
| `scenes[].duration_s`| integer | Yes | 4 – 15 seconds | Bounded per scene to ensure natural pacing and model coherence. |
| `scenes[].shot` | string | Yes | - | What *happens* in the take — what the hands do, what is on the screen. How it is filmed belongs in `camera`. |
| `scenes[].camera` | object | No | null | Structured camera direction compiled into the render prompt: `shot_size`, `angle`, `movement`, `lens`, `lighting`, `notes`. Every term is validated against the served vocabulary — see [`GET /ugc/creative/cameras`](#get-ugc-creative-cameras). Omitted means the prompt says nothing about the camera beyond `shot`. |
| `scenes[].refs` | array[object] | No | `[]` | Library assets in frame: `{ "asset": "<slug>", "view": "<optional image role>", "note": "" }`. One asset may be referenced once per scene. |
| `scenes[].actor_views` | array[string] | No | `[]` | Extra angles of this actor to attach to this shot, from `three_quarter`, `profile`, `expression`, `body`, `wardrobe`, `hands`. Opt-in per scene because an angle costs the same reference slot the product needs, and at most two are sent. Listed in preference order: an angle the actor's gallery does not hold is substituted with the next best rather than refused. |
| `captions.style` | string | No | `"ugc_bold"` \| `"karaoke"` \| `"minimal"` \| `"boxed"` | Caption visual style preset burned into the video stream. |
| `music.track_id` | string | No | null | The music bed: a public URL or a path in your own storage. Cut to the length of the edit and pushed under the voice. Null means no bed, and then the two settings below do nothing. We ship no track library of our own — the licence for music in an ad is your agreement, so point this at something you hold the rights to. A bed that cannot be fetched at render time is a downgrade, not a failure: the cut ships without it. |
| `music.duck_db` | integer | No | -40 to 0 dB (Default: -14) | Volume attenuation applied to background music when voice is active. |
| `music.sidechain` | boolean | No | `true` | Duck against the voice as the key rather than holding the bed at a fixed level for the whole cut. |
| `polish.motion` | string | No | `"none"` \| `"push_in"` \| `"pull_back"` | A slow drift across every scene. Scaled to `format.fps`, so the travel per second is the same at 24, 25 and 30. |
| `polish.transition` | string | No | `"cut"` \| `"dissolve"` \| `"fade_black"` \| `"slide"` \| `"smooth"` | How one scene meets the next. |
| `end_card.seconds` | float | No | 1.0 – 5.0 (Default: 2.4) | Held end frame displaying discount code and handle. |

---

## Exact USD Pricing Breakdown

FotoHUB API operates exclusively on **pure USD prepaid wallet billing**. There are no subscription credit lock-ins or arbitrary points.

### Unit Rates

| Pipeline Component | Price per Unit (USD) | Measured Billing Unit |
|:---|:---|:---|
| **Multi-Scene Video Generation** | **$0.0500 / second** | Rendered video duration (Seedance 2.0 Engine) |
| **Voice Synthesis (Gemini TTS / Azure)** | **$0.0150 / 1,000 chars** | Character count of spoken script |
| **Audio Redub & Timing Alignment** | **$0.0080 / second** | Total audio duration synced to scenes |
| **Hardware Lipsync Pass** | **$0.0000** | Covered under standard GPU orchestration |
| **B-Roll & Caption Compositing** | **$0.0000** | Included in standard render pipeline |

### Standard 30-Second UGC Ad Cost

A complete 30-second multi-scene UGC ad with 5 scenes and ~400 characters of voiceover:

$$\begin{aligned}
\text{Video Generation (30s)} &= 30 \times \$0.0500 = \$1.5000 \\
\text{Voiceover TTS (400 chars)} &= (400 / 1000) \times \$0.0150 = \$0.0060 \\
\text{Audio Redub Sync (30s)} &= 30 \times \$0.0080 = \$0.2400 \\
\hline
\mathbf{\text{Total Cost per Rendered Ad}} &= \mathbf{\$1.7460\text{ USD}}
\end{aligned}$$

### High-Volume Performance Testing Matrix (10 Variants)

Performance marketing agencies testing 3 AI actors across 3 hook variations plus a baseline test (10 rendered videos) spend:

$$10 \times \$1.7460 = \mathbf{\$17.46\text{ USD}}$$

Compare this to traditional UGC production costing between $150 and $300 per creator video.

---

## Parameter Specifications

### POST `/ugc/creative/brief`

| Parameter | Type | Required | Default | Description |
|:---|:---|:---:|:---|:---|
| `url` | string | Yes | - | The HTTP/HTTPS product URL to scrape. Link-local and private IPs are blocked. |
| `custom_brief` | string | No | null | Optional override text if the URL cannot be scraped or additional manual context is needed. |
| `product_category` | string | No | "auto" | Hint for the LLM to guide extraction (e.g., "Skincare", "Electronics"). |

### POST `/ugc/creative/angles`

| Parameter | Type | Required | Default | Description |
|:---|:---|:---:|:---|:---|
| `brief_id` | string | Yes | - | ID of the creative brief generated in the previous step. |
| `num_angles` | integer | No | 3 | Number of angles to generate (3-12). |
| `formats` | array[string] | No | ["problem_solution"] | List of formats. Supported: `problem_solution`, `testimonial`, `unboxing`, `transformation`, `educational`. |
| `target_platform` | string | No | "tiktok" | Platform optimization target: `tiktok`, `reels`, `shorts`. Adjusts hook intensity and pacing. |

### POST `/ugc/creative/script`

| Parameter | Type | Required | Default | Description |
|:---|:---|:---:|:---|:---|
| `angle_id` | string | Yes | - | ID of the chosen angle from the `/angles` endpoint. |
| `duration_s` | integer | No | 30 | Target duration in seconds. Supported: 15, 30, 45, 60. |
| `tone` | string | No | "authentic" | Tone of voice: `authentic`, `energetic`, `calm`, `luxury`. |
| `hook_style` | string | No | "bold_statement" | Opening hook strategy: `question`, `bold_statement`, `before_after`. |
| `num_beats` | integer | No | 5 | Number of structural script beats (3-7). Default is 5. |

### GET `/ugc/creative/cameras`

The camera vocabulary and the ready-made looks built out of it. Served rather than hardcoded in your client, because a term added here reaches you without a release on your side — and because a term you invent is refused at save time.

| Response Field | Type | Description |
|:---|:---|:---|
| `vocabulary.shot_size` | object | `extreme_close_up`, `close_up`, `medium_close_up`, `medium`, `medium_wide`, `wide`, `over_the_shoulder`, `insert`, `two_thirds` — each mapped to the wording it puts in the prompt. |
| `vocabulary.angle` | object | `eye_level`, `low`, `high`, `overhead`, `dutch`, `pov`, `over_shoulder_behind`. |
| `vocabulary.movement` | object | `static`, `handheld`, `push_in`, `pull_back`, `pan_left`, `pan_right`, `tilt_down`, `tilt_up`, `orbit`, `follow`, `whip`, `rack_focus`, `table_reveal`. |
| `vocabulary.lens` | object | `phone_front`, `phone_back`, `wide_24`, `normal_35`, `portrait_50`, `tele_85`, `macro`. |
| `vocabulary.lighting` | object | `daylight_window`, `golden_hour`, `overcast`, `ring_light`, `lamp_warm`, `overhead_hard`, `night_screen`, `studio_soft`, `backlit`. |
| `presets` | array[object] | 16 named looks — `selfie_talking_head`, `hook_whip`, `unboxing_overhead`, `table_demo`, `macro_texture`, `mirror_try_on`, `retail_aisle`, `kitchen_counter`, `cta_card_hold` and others — each with its full `CameraSpec` plus `prose`: the exact sentence the look will tell the model. |
| `by_role` | object | Which presets suit which beat, keyed by `hook`, `problem`, `demo`, `proof`, `cta`. A hook wants a phone held at arm's length; a demo wants the table and the hands. |

Drop a preset's fields straight into `scenes[].camera`, or set the five terms yourself. Anything you leave out simply goes unsaid in the prompt — the camera direction is additive, never a template with blanks to fill.

### POST `/v1/ai/tts/gemini/synthesize`

| Parameter | Type | Required | Default | Description |
|:---|:---|:---:|:---|:---|
| `lines` | array[string] | Yes | - | The exact textual lines to be synthesized into speech. |
| `voice_preset` | string | Yes | - | The ID of the neural voice model (e.g., `en-US-Journey-F`). |
| `speaking_rate` | float | No | 1.05 | Speech tempo multiplier. Higher values are common for UGC. |
| `pitch` | float | No | 1.0 | Pitch shifting factor. |
| `emotion_style` | string | No | "neutral" | Emotional delivery hint (if supported by voice model). |

### PUT `/ugc/projects/{id}/blueprint`

| Parameter | Type | Required | Default | Description |
|:---|:---|:---:|:---|:---|
| `document` | object | Yes | - | The whole blueprint — `format`, `actor`, `audio`, `scenes`, `captions`, `music`, `polish`, `compliance`, `end_card`, `brand_ref`, `setting` — as specified in [Creative & Blueprint Schema](#creative-blueprint-schema). It is validated as one unit: a document that would not render is refused here rather than at render time, after money has moved. |

Every save creates a **new immutable version** rather than editing the last one. The response carries that `version`, and a render names the version it films — so a job can always be traced back to the exact document it was cut from.

::: tip Brand and colours
There is no colour list on the render call. The caption accent is `captions.accent` and the end card's panel is `end_card.colour` (falling back to the accent), both stored in the document — so every variant of it is on-brand by construction. `brand_ref` names a **brand** asset in your library, whose palette and tone constrain the whole cut; pointing it at a product asset is refused rather than applied.
:::

### POST `/ugc/projects/{id}/render`

The render films the **saved** document, so everything about the cut — ratio, frame rate, captions, music, camera — is set in the blueprint, not here. This call only says *which* cut and *how it is identified*:

| Parameter | Type | Required | Default | Description |
|:---|:---|:---:|:---|:---|
| `idempotency_key` | string | No | derived | Sending the same key twice returns the first job instead of filming and billing twice. Omitted, one is derived from the project, the blueprint version and `variant_label`. |
| `variant_label` | string | No | null | Names this cut of this version. The paid unit is version plus label: re-filming the same version deliberately — a second take, a corrected reference address — needs a new label, or the call returns the earlier job. |
| `product_urls` | object | No | `{}` | Addresses for scenes that still name a product by `product_ref` rather than by a library asset. Supplied per run, not stored. A scene whose key has no address here films without its product and nothing reports it, so prefer attaching the product from the library. |

### GET `/ugc/projects/{id}/render`

Poll for render job status. Returns detailed progress for UX loading states.

| Response Field | Type | Description |
|:---|:---|:---|
| `status` | string | State enum: `queued`, `lipsyncing`, `compositing`, `completed`, `failed`. |
| `progress` | integer | Estimated completion percentage (0-100). |
| `video_url` | string | Final asset URL (only populated if `status` is `completed`). |
| `usd_charged` | float | Final billed amount deducted from `wallet.available_usd`. |

---

## 1. Full 5-Beat Script Structure

Winning UGC ads consistently follow a predictable psychological framework. The `/ugc/creative/script` endpoint automatically maps LLM generations to these timed beats:

1. **Hook (0-3s)**: The scroll-stopper. Visually arresting and auditorily jarring. If targeting TikTok, this must land the core premise within 3 seconds.
2. **Problem (3-8s)**: Agitate the pain point. The AI actor adopts a relatable, frustrated persona to validate the viewer's current struggle.
3. **Demo/Solution (8-20s)**: Introduce the product as the hero. This is where B-roll overlays shine, showing texture, application, or interface while the voiceover explains the USP.
4. **Social Proof (20-25s)**: Validate the claims. Quotes from dermatologists, review counts, or "14-day results" statements.
5. **CTA (25-30s)**: Clear instructions. "Click the yellow cart," "Use code GLOW20," or "Shop the link in bio."

::: tip Platform Nuances
TikTok demands hyper-kinetic pacing (Hooks < 2s). Instagram Reels favors slightly more aesthetic pacing and lifestyle integration. YouTube Shorts requires a stronger retention bridge between the Hook and Problem to prevent swiping.
:::

## 2. AI Actor Casting Gallery

FOTOhub provides a diverse gallery of neural actors with full GPU-accelerated lip-sync. When casting, you filter via multiple demographic and stylistic axes:

- **Gender**: `male`, `female`, `non_binary`
- **Age Range**: `gen_z` (18-24), `millennial` (25-35), `gen_x` (36-50), `boomer` (50+)
- **Ethnicity**: `caucasian`, `black`, `hispanic_latino`, `asian`, `mixed`
- **Presentation Style**: `casual_ugc`, `professional_spokesperson`, `enthusiastic_creator`, `calm_expert`
- **Skin Tone**: Valid scale 1-6 for accurate lighting compensation.
- **Nationality**: Controls nuanced accent weight and cultural expression hints.

**What the render actually spends time on:**
- The spoken track and the music bed, mixed and ducked against each other.
- The actor's take, plus the optional lip-sync pass when `audio.lipsync` is not `"off"`.
- Captions, the end card and the final encode at the document's `format.fps`.

Which hardware each stage lands on is ours to schedule and changes without notice; it is not part of the contract.

## 3. Voice Synthesis Deep-Dive

Selecting the right voice engine dramatically shifts ad performance. Multilingual support is automatically handled depending on the engine.

| Provider | Best For | Characteristics | Cost / 1k chars |
|:---|:---|:---|:---|
| **Gemini 2.5 TTS** | Authentic UGC | High breathiness, natural pauses, slightly imperfect (which converts better). | $0.003 USD |
| **Azure Neural** | Professional / Explainer | Crisp articulation, massive language support (140+ locales), consistent tone. | $0.015 USD |
| **ElevenLabs** | Dramatic / Character | Emotional depth, whispering, shouting. Highest quality but most expensive. | $0.030 USD |

## 4. B-Roll & Visual Composition

The `Compositor` automatically stitches A-roll (the AI actor speaking) with B-roll (product close-ups).
- **PIP (Picture-in-Picture)**: The product URL asset is mapped to a dynamic 3D plane that floats near the actor's face.
- **Full-Screen Takeover**: The video cuts away from the actor entirely during the Demo phase to show raw product texture, while the voice track continues underneath.
- **Text Animations**: Automated kinetic typography synchronized exactly to the script beats.

## 5. Caption Styles

FOTOhub dynamically burns captions via ASS (Advanced SubStation Alpha) formatting. Parameter adjustments include font spacing, background plate opacity, and rotation.
- `karaoke`: Word-by-word highlighting in brand colors. Ideal for retention.
- `subtitle_chunks`: 2-3 word blocks appearing simultaneously. Good for older demographics on Facebook/Instagram.
- `none`: If you plan to use TikTok's native auto-captions (recommended for maximum organic reach).

## 6. Multi-Variant Matrix & Batch Scripting

To find winning ads, agencies must generate a high volume of variants. This Python script iterates 5 products × 3 angles × 2 actors = 30 variants.

::: code-group
```python [Python (Batch Script)]
import asyncio
import httpx
import os

API_KEY = os.environ.get("FOTOHUB_API_KEY")
BASE_URL = "https://apis.fotohub.app"

PRODUCTS = ["https://glowbotanics.com/products/retinol-glow-serum", "https://glowbotanics.com/products/vitamin-c", "https://glowbotanics.com/products/cleanser", "https://glowbotanics.com/products/toner", "https://glowbotanics.com/products/moisturizer"]
ACTORS = ["act_sarah_ugc_01", "act_mike_creator_04"]
ANGLES = ["problem_solution", "unboxing", "testimonial"]

async def generate_variant(client, product_url, actor, angle):
    # 1. Brief & Angle logic (simplified)
    # 2. Render dispatch
    payload = {
        "idempotency_key": f"batch_{actor}_{angle}",
        "variant_label": f"{actor}_{angle}",
        # ... blueprint details ...
    }
    resp = await client.post(f"{BASE_URL}/ugc/projects/batch/render", json=payload)
    data = resp.json()
    print(f"Dispatched {actor}-{angle}: Cost {data['usd_charged']} USD")
    return data

async def main():
    headers = {"Authorization": f"Bearer {API_KEY}"}
    async with httpx.AsyncClient(headers=headers) as client:
        tasks = []
        for prod in PRODUCTS:
            for act in ACTORS:
                for ang in ANGLES:
                    tasks.append(generate_variant(client, prod, act, ang))
        results = await asyncio.gather(*tasks)
        print(f"Total dispatched: {len(results)} jobs. Estimated budget allocated: ${len(results) * 1.7460:.2f} USD")

if __name__ == "__main__":
    asyncio.run(main())
```
:::

## 7. A/B Testing Framework

Deploy variants systematically to measure ROAS improvement:
1. **Week 1**: Test 3 Hooks with 1 Body/CTA. Measure 3-second hook retention rate.
2. **Week 2**: Take the winning Hook, test 3 different AI Actors. Measure click-through rate (CTR).
3. **Week 3**: Take the winning Hook + Actor, test 3 different CTAs. Measure Return on Ad Spend (ROAS) and CPA.
Using FOTOhub, you can iterate mathematically without scheduling new shoots.

## 8. TikTok Direct Publishing & Compliance

The integration extends beyond simply uploading. You can target specific TikTok Ad Accounts.

::: danger Automated Ban Prevention
FOTOhub includes a **Compliance Guard**. Before rendering, it runs an LLM pre-flight check against FDA/FTC and platform-specific banned claims. If a script says "permanently erases deep wrinkles", the API returns a `422 Unprocessable Entity` with a `compliance_violation` flag, saving you from a suspended ad account and a wasted render cost.
:::

## 9. Webhook Handler & HMAC-SHA256 Verification

To securely receive render completion events in production, verify the signature.

::: code-group
```python [Python (FastAPI)]
import hmac
import hashlib
from fastapi import FastAPI, Request, HTTPException

app = FastAPI()
WEBHOOK_SECRET = b"whsec_live_your_secret"

@app.post("/webhooks/fotohub")
async def handle_webhook(request: Request):
    signature = request.headers.get("X-FotoHub-Signature")
    body = await request.body()
    
    expected = hmac.new(WEBHOOK_SECRET, body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
        
    event = await request.json()
    if event["type"] == "ugc.render.completed":
        video_url = event["data"]["render"]["video_url"]
        usd_charged = event["data"]["wallet"]["usd_charged"]
        print(f"Video ready at {video_url} - Cost: ${usd_charged} USD")
        
    return {"status": "ok"}
```

```typescript [TypeScript (Express)]
import express from 'express';
import crypto from 'crypto';

const app = express();
const WEBHOOK_SECRET = 'whsec_live_your_secret';

app.post('/webhooks/fotohub', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-fotohub-signature'] as string;
  const hash = crypto.createHmac('sha256', WEBHOOK_SECRET).update(req.body).digest('hex');
  
  if (hash !== signature) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = JSON.parse(req.body);
  if (event.type === 'ugc.render.completed') {
    const cost = event.data.wallet.usd_charged;
    console.log(`Billed $${cost} USD. Delivery: ${event.data.render.video_url}`);
  }
  
  res.sendStatus(200);
});

app.listen(3000);
```

```go [Go (net/http)]
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	secret := []byte("whsec_live_your_secret")
	signature := r.Header.Get("X-FotoHub-Signature")

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	mac := hmac.New(sha256.New, secret)
	mac.Write(body)
	expectedMAC := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(signature), []byte(expectedMAC)) {
		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	var event map[string]interface{}
	json.Unmarshal(body, &event)

	if event["type"] == "ugc.render.completed" {
		data := event["data"].(map[string]interface{})
		wallet := data["wallet"].(map[string]interface{})
		render := data["render"].(map[string]interface{})
		fmt.Printf("Billed $%v USD. Delivery: %v
", wallet["usd_charged"], render["video_url"])
	}
	w.WriteHeader(http.StatusOK)
}

func main() {
	http.HandleFunc("/webhooks/fotohub", webhookHandler)
	http.ListenAndServe(":3000", nil)
}
```

```bash [cURL]
# Simulating a webhook payload signature check
PAYLOAD='{"type":"ugc.render.completed","data":{"wallet":{"usd_charged":1.74},"render":{"video_url":"https://s3.amazonaws.com/vid.mp4"}}}'
SECRET="whsec_live_your_secret"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

curl -X POST http://localhost:3000/webhooks/fotohub   -H "Content-Type: application/json"   -H "X-FotoHub-Signature: $SIGNATURE"   -d "$PAYLOAD"
```
:::

## 10. BYOB R2/S3 Delivery Architecture

By default, FOTOhub hosts assets for 7 days. To persist permanently, register your Cloudflare R2 or AWS S3 bucket:

```mermaid
flowchart TD
    A[FOTOhub Compositor] -->|Render MP4| B[FOTOhub Ephemeral Cache]
    B -->|S3 PutObject| C[(Client R2 Bucket)]
    C -->|Webhook Trigger| D[Client Backend]
    D -->|Post Video| E[TikTok / FB Ads]
```

## 11. Complete Cost Breakdown Table & Unit Economics

Everything is strictly billed in USD. Deductions happen upon render completion. 
*Note: A 30s ad might cost $1.746 total including video, TTS, and redub as shown above, or here is a generalized minimal flow cost:*

| Phase | Operation | Volume | USD Cost per Unit | Total USD |
|:---|:---|:---|:---:|:---:|
| 1. Ideation | `/brief` extraction | 1 run | $0.005 | $0.005 |
| 2. Writing | `/angles` generation | 3 angles | $0.015 | $0.015 |
| 3. Scripting | `/script` structure | 1 script | $0.008 | $0.008 |
| 4. Voice | `/tts/gemini` | 1000 chars | $0.003 | $0.003 |
| 5. Rendering | `GPU Compositing` | 30 seconds | $0.006/sec | $0.180 |
| **Total Base** | **Single 30s Video** | - | - | **$0.211 USD** |

## 12. ROI Calculation (Agency Economics)

If you are a performance agency, the economics of FOTOhub AI UGC are staggering:

- **Traditional Agency Approach**: Hiring 10 micro-influencers to shoot 3 hooks each. Cost: $150 per creator = **$4,500+ USD**. Turnaround time: 2-3 weeks.
- **FOTOhub AI Pipeline**: Generating 30 AI ad variants. Cost: 30 × $0.22 (base) = **$6.60 USD**. Turnaround time: 15 minutes.

## 13. DLQ / Retry Patterns & Error Handling

When running high-volume jobs asynchronously, failures happen (e.g., TTS network timeouts, GPU node evictions).

::: warning Handle 503s Gracefully
If a render job enters the `failed` state, do not immediately retry blindly. Implement exponential backoff and check the `error.category` field.
:::

- `network_timeout`: Safe to retry immediately using the same `idempotency_key`.
- `compliance_violation`: Do NOT retry. Inspect the flagged script and modify claims.
- `insufficient_funds`: Wallet `available_usd` dropped below $0.00. Refill via Stripe dashboard and retry.

## 14. Platform-Specific Optimizations

- **TikTok**: Requires aggressive cuts. Set your `scenes[0].duration_s` to a maximum of 3 seconds. Use `karaoke` captions to retain eyes.
- **Instagram Reels**: Slightly older demographic. Thumbnails matter. FOTOhub automatically exports a `cover.jpg` with the highest aesthetic scoring frame from the video. Place text slightly higher to avoid UI overlap.
- **YouTube Shorts**: Demands a longer narrative arc. Expand the `Problem` beat to 8-10 seconds to reduce the rapid swipe-away behavior common on the platform. End screens are critical; leverage the `end_card` object heavily.

## 15. Advanced Configuration: Creative Brief Overrides

When using `POST /ugc/creative/brief`, you are not strictly limited to scraping URLs. For pre-launch products or products behind a login wall, you can provide manual context to the FOTOhub extraction engine. 

### Manual Brief Structure

```json
{
  "custom_brief": {
    "product_name": "GlowBotanics Nightly Resurfacing Pad",
    "category": "Skincare",
    "brand_guidelines": {
      "tone_of_voice": ["authoritative", "clean", "science-backed"],
      "forbidden_words": ["miracle", "botox-in-a-bottle", "magic"]
    },
    "key_ingredients": [
      "2% Salicylic Acid",
      "Witch Hazel",
      "Niacinamide"
    ],
    "target_audience_expansion": "Focus heavily on hormonal acne sufferers rather than generic anti-aging."
  }
}
```

By providing `custom_brief`, the AI bypasses the URL fetch and directly instantiates the context window for the `POST /ugc/creative/angles` endpoint. This is particularly useful for agencies testing different positioning (e.g., selling the same product as an anti-aging solution vs. an acne solution).

## 16. State Machine: Render Job Lifecycle

Understanding the lifecycle of a FOTOhub render job is critical when building a user-facing dashboard that needs to poll `GET /ugc/projects/{id}/render`. 

```mermaid
stateDiagram-v2
    [*] --> Queued : POST /render
    Queued --> Assets_Fetching : Wallet Authorized
    Assets_Fetching --> Queued : S3 Timeout (Retry)
    Assets_Fetching --> Lipsync_GPU3
    Lipsync_GPU3 --> Compositing_GPU4
    Compositing_GPU4 --> Encoding_NVENC
    Encoding_NVENC --> Delivery_R2
    Delivery_R2 --> Completed
    
    Queued --> Failed : Insufficient Funds
    Lipsync_GPU3 --> Failed : Face Mesh Error
    Compositing_GPU4 --> Failed : Asset Load Failure
    
    Completed --> [*] : Webhook Dispatched
    Failed --> [*] : Webhook Dispatched
```

- `Queued`: The job is waiting for an available GPU slot. Billed amount is reserved.
- `Assets_Fetching`: Downloading the `product_urls` and checking actor caches.
- `Lipsync_GPU3`: Neural pass tracking the actor's mouth to the synthesized TTS.
- `Compositing_GPU4`: Stitching the 9:16 background, actor layer, text, and music.
- `Encoding_NVENC`: Final MP4 compression at `720p` or `1080p`.
- `Delivery_R2`: Mirroring to Cloudflare R2 or Amazon S3.

## 17. Advanced Error Handling & Exponential Backoff

When orchestrating hundreds of campaigns in parallel, network hiccups or temporary GPU exhaustion can result in 503 HTTP responses. Below is an advanced production-ready Python utility demonstrating exponential backoff for the FOTOhub API.

```python [Python]
import asyncio
import httpx
import logging
import random
from typing import Optional, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

FOTOHUB_API_KEY = "fh_live_your_api_key"
BASE_URL = "https://apis.fotohub.app"

async def async_post_with_retry(
    client: httpx.AsyncClient, 
    endpoint: str, 
    payload: Dict[str, Any], 
    max_retries: int = 4
) -> Optional[Dict[str, Any]]:
    """
    Executes a POST request to FOTOhub APIs with exponential backoff and jitter.
    Automatically handles 429 Too Many Requests and 503 Service Unavailable.
    """
    url = f"{BASE_URL}{endpoint}"
    
    for attempt in range(max_retries):
        try:
            response = await client.post(url, json=payload)
            
            # Success
            if response.status_code in (200, 201, 202):
                return response.json()
                
            # Client Errors (Do not retry)
            if response.status_code == 400:
                logger.error(f"Bad Request: {response.text}")
                return None
            if response.status_code == 402:
                logger.error("Payment Required. Please refill your FOTOhub wallet via Stripe.")
                return None
            if response.status_code == 422:
                logger.error(f"Unprocessable Entity (Likely Compliance Violation): {response.text}")
                return None
                
            # Transient Errors (Retry)
            if response.status_code in (429, 502, 503, 504):
                logger.warning(f"Transient error {response.status_code}. Attempt {attempt + 1}/{max_retries}.")
                
        except httpx.RequestError as exc:
            logger.warning(f"Network error: {exc}. Attempt {attempt + 1}/{max_retries}.")
            
        # Calculate backoff with jitter
        if attempt < max_retries - 1:
            sleep_time = (2 ** attempt) + random.uniform(0, 1)
            logger.info(f"Retrying in {sleep_time:.2f} seconds...")
            await asyncio.sleep(sleep_time)
            
    logger.error(f"Failed to post to {endpoint} after {max_retries} attempts.")
    return None

async def run_batch():
    async with httpx.AsyncClient(
        headers={
            "Authorization": f"Bearer {FOTOHUB_API_KEY}",
            "Content-Type": "application/json"
        },
        timeout=httpx.Timeout(30.0)
    ) as client:
        # Example invocation
        result = await async_post_with_retry(
            client, 
            "/ugc/creative/brief", 
            {"url": "https://glowbotanics.com/products/retinol-glow-serum"}
        )
        if result:
            logger.info(f"Brief generated: {result.get('product_name')}")

if __name__ == "__main__":
    asyncio.run(run_batch())
```

## 18. Webhook Best Practices: Syncing USD Deductions

FOTOhub is a pure **prepaid USD** platform. To keep your internal database synchronized with your FOTOhub wallet balance, listen to the `wallet.deducted` and `ugc.render.completed` events.

When a render completes, FOTOhub emits a webhook payload containing precise unit economics:

```json
{
  "event_id": "evt_91a82bcf92",
  "type": "ugc.render.completed",
  "created_at": "2026-09-06T19:10:00Z",
  "data": {
    "project_id": "proj_91204a",
    "render": {
      "job_id": "job_render_x912",
      "video_url": "https://ugc-ads-cdn.glowbotanics.com/campaigns/ugc_x912.mp4",
      "duration_s": 30.5
    },
    "wallet": {
      "usd_charged": 1.7460,
      "available_usd": 248.50,
      "currency": "USD"
    }
  }
}
```

In your database, update the user's available budget immediately by reading `data.wallet.available_usd`. This ensures your dashboard perfectly mirrors the true Stripe ledger stored in FOTOhub.

## 19. Validating Webhook Signatures in Python (Detailed)

Since webhooks carry financial data (USD spend), it is absolutely critical to verify the `X-FotoHub-Signature` header to prevent spoofing.

```python [Python]
import os
import hmac
import hashlib
from flask import Flask, request, jsonify

app = Flask(__name__)
WEBHOOK_SECRET = os.environ.get("FOTOHUB_WEBHOOK_SECRET", "").encode('utf-8')

def verify_signature(payload_body: bytes, signature_header: str) -> bool:
    """Verify the webhook payload matches the HMAC-SHA256 signature."""
    if not signature_header or not WEBHOOK_SECRET:
        return False
        
    # Calculate expected hash
    expected_mac = hmac.new(
        WEBHOOK_SECRET, 
        payload_body, 
        hashlib.sha256
    ).hexdigest()
    
    # Secure string comparison
    return hmac.compare_digest(expected_mac, signature_header)

@app.route('/webhooks/fotohub', methods=['POST'])
def fotohub_webhook():
    signature = request.headers.get('X-FotoHub-Signature', '')
    
    # Must use raw bytes for verification
    if not verify_signature(request.data, signature):
        return jsonify({"error": "Unauthorized"}), 401
        
    event = request.json
    
    if event.get('type') == 'ugc.render.completed':
        cost = event['data']['wallet']['usd_charged']
        balance = event['data']['wallet']['available_usd']
        print(f"Render billed: ${cost} USD. Remaining Balance: ${balance} USD")
        
        # TODO: Update your internal database here
        
    return jsonify({"status": "received"}), 200
```

## 20. Performance Optimization Tips for Agency Usage

When scaling from testing 10 ads to generating thousands of UGC variants per month for clients, keep the following FOTOhub optimizations in mind:

1. **Pre-Cache Actors**: If you know you will generate 100 variants using `act_sarah_ugc_01`, ping the `/ugc/actors/act_sarah_ugc_01/warm` endpoint at the start of your script. This pre-loads the neural mesh onto an available GPU3 instance, saving 4-6 seconds of startup latency per render job.
2. **Reuse Assets**: Avoid uploading the same product image repeatedly. Upload it once to FOTOhub's Asset Manager (`POST /v1/assets`) and pass the resulting `fh_asset_id` instead of a URL. This skips the S3 fetch phase during compositing.
3. **Idempotency Keys**: Always, always use idempotency keys (`idempotency_key`) formatted as `UUID` or `agency_client_campaign_date`. If your script crashes and restarts, FOTOhub will recognize the key and return the exact same render payload without deducting additional USD from your wallet.
4. **Concurrent Rate Limits**: By default, agency tier accounts can process 50 concurrent render jobs. If you queue 500, the system automatically buffers them. Do not write custom pooling logic; simply fire all 500 requests asynchronously and let FOTOhub's queue manager handle node scheduling.

## 21. Generating Bulk Thumbnails

In addition to video files, Facebook and Instagram Ads require high-converting static thumbnails. You can request FOTOhub to generate text-overlay variants of the best frame.

Add the following to your `POST /ugc/projects/{id}/render` payload:

```json
{
  "exports": {
    "video": true,
    "thumbnails": [
      {
        "type": "ai_highlight",
        "text_overlay": "Will This Save My Skin?",
        "style": "clickbait_yellow"
      },
      {
        "type": "product_focus",
        "text_overlay": "14 Day Results",
        "style": "minimal_white"
      }
    ]
  }
}
```

This will output additional URLs in your webhook payload under `render.thumbnails`. These cost an additional `$0.005 USD` per thumbnail generated.

## Final Launch Checklist

- [ ] Check wallet balance `wallet.available_usd` is sufficient for the batch run.
- [ ] Verify `custom_brief` constraints align with FDA/FTC regulations.
- [ ] Confirm Webhook handler is returning `200 OK` instantly and processing asynchronously.
- [ ] Test the pipeline on `quality: "draft"` (watermarked, lower resolution) for `$0.02 USD` before rendering full resolution.
- [ ] Validate Cloudflare R2 / AWS S3 connection via `GET /v1/destinations/test`.

---
*Built for production scale. Start generating at [FOTOhub API Dashboard](https://dashboard.fotohub.app).*

## Troubleshooting FAQ

**Q: My video rendered but the audio is out of sync.**
A: Check if `audio.lipsync` was set to `off` in your blueprint. Ensure you use `"fast"` or `"hd"` to trigger the GPU3 neural pass.

**Q: I received a 402 Payment Required but my credit card is linked.**
A: FOTOhub uses prepaid wallets. Auto-reload might have failed. Go to your billing dashboard and manually top up the `wallet.available_usd` balance.

**Q: Can I use custom fonts for the captions?**
A: Yes. Upload a `.ttf` or `.otf` to the Asset Manager and reference the `asset_id` in `captions.font_asset_id` in the blueprint.

**Q: The AI actor's voice sounds robotic.**
A: Adjust the `temperature` parameter in the TTS synthesize request to `0.8` or higher to introduce more natural variation and breathiness.

**Q: What is the maximum duration for a UGC ad?**
A: Currently, 60 seconds. However, data shows optimal performance for TikTok and Reels drops significantly after 34 seconds.
