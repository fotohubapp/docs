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
    participant LLM as Creative LLM (Claude / Gemini)
    participant Actor as BytePlus Actor Engine
    participant TTS as Speech Engine (Gemini / Azure)
    participant Compositor as GPU NVENC Compositor
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
| `format.resolution`| string | No | `"720p"` \| `"480p"` | Default `720p` (1080x1920 composite). |
| `actor.actor_id` | string | Yes | Valid Actor ID | Registered BytePlus actor reference or catalog actor. |
| `audio.strategy` | string | No | `"redub"` \| `"native"` | `"redub"` generates separate TTS and applies lipsync. |
| `audio.lipsync` | string | No | `"off"` \| `"fast"` \| `"hd"` | Neural lip-sync pass on GPU3 to align mouth phonemes to audio. |
| `scenes[].role` | string | Yes | `hook`, `problem`, `demo`, `proof`, `cta` | Direct-response beat role. |
| `scenes[].duration_s`| integer | Yes | 4 – 15 seconds | Bounded per scene to ensure natural pacing and model coherence. |
| `captions.style` | string | No | `"ugc_bold"` \| `"karaoke"` | Caption visual style preset rendered into video stream. |
| `music.duck_db` | integer | No | -40 to 0 dB (Default: -14) | Volume attenuation applied to background music when voice is active. |
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
