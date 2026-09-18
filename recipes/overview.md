# Multimodal Automation Recipes & Production Blueprints

End-to-end production blueprints combining multiple FOTOhub neural engines, physical simulation, document intelligence, and cloud compute into automated creative pipelines, enterprise batch processors, and generative workflows.

Every recipe unifies multi-modal perception, computer vision tracking, audio synthesis, 3D mesh reconstruction, and LLM reasoning into reproducible, fault-tolerant pipelines backed by FOTOhub's distributed GPU clusters and air-gapped Firecracker compute microVMs.

---

## Executive Recipe Matrix

Explore all 11 production blueprints across media automation, creative brand studios, enterprise 3D, and e-commerce pipelines. All operations bill against your **prepaid USD wallet balance** (`wallet.available_usd`) at transparent 1:1 pass-through rates with zero synthetic credits or currency conversions.

| # | Blueprint | Category | Complexity | Pipeline Modalities | Typical Runtime | Unit Cost (USD) | Hardware Tier & Acceleration | Target Output Deliverables |
|:--|:---|:---|:---:|:---|:---:|:---:|:---|:---|
| **01** | **[Video to Viral Shorts](./video-to-shorts.md)** | Media & Video | ⭐⭐⭐⭐ Advanced | Video → Audio → Text → Video | 45s – 180s | **$0.15 – $0.25** / short | EC2 GPU NVENC + Whisper Large-v3 + Claude 3.5 | 9:16 Shorts with dynamic karaoke captions, active speaker tracking, B-roll & -14 LUFS |
| **02** | **[Podcast to Viral Clips](./podcast-to-clips.md)** | Media & Video | ⭐⭐⭐⭐ Advanced | Video → Audio → Text → Video | 60s – 120s | **$0.75** / job ($0.15 / clip) | EC2 GPU NVENC + Claude 3.5 B-Score | Multi-speaker stacked/pip 9:16 shorts with automated multicam switching & -14 LUFS mastering |
| **03** | **[Automated UGC Video Ads](./ugc-video-campaigns.md)** | Media & Video | ⭐⭐⭐⭐ Advanced | URL / SKU → Script → Video | 30s – 90s | **$1.75** / 30s ad | NVIDIA A10G 24GB (Seedance 2.5 + BytePlus + Gemini TTS) | High-converting 9:16 vertical TikTok/Reels UGC ads with synthetic creators & B-roll |
| **04** | **[Video Sound Design & Foley](./video-sound-design.md)** | Media & Video | ⭐⭐⭐ Medium | Video → Foley + Music → Mix | 10s – 35s | **$0.22** / 15s sequence | GPU2 A10G (MMAudio + MiniMax Music) | Multi-track audio stem mastering with sidechain auto-ducking (-16dB) & action-synced SFX |
| **05** | **[Multilingual Lip-Sync Dubbing](./lip-sync-dubbing.md)** | Media & Video | ⭐⭐⭐⭐ Advanced | Video + Audio → Audio → Video | 20s – 60s / min | **$0.04 – $0.12** / min | NVIDIA T4 16GB / A10G (Demucs v4 + LatentSync / MuseTalk) | Multilingual video with phoneme-accurate lip motion, cloned voice & preserved background audio |
| **06** | **[Virtual Try-On Fashion Studio](./virtual-tryon-fashion.md)** | Brand & Creative | ⭐⭐⭐⭐ Advanced | Model + Garment → Image | 8s – 20s / look | **$0.0350** / look | NVIDIA A10G 24GB (virtual-try-on-001 / SAM2 / CodeFormer) | Photorealistic apparel draping with realistic cloth physics, luxury backgrounds & 4K upscaling |
| **07** | **[Brand DNA & Virtual Influencers](./brand-dna-virtual-influencers.md)** | Brand & Creative | ⭐⭐⭐⭐ Advanced | Face Embeddings → Image | 6s – 18s / img | **$0.0315 – $0.1340** / img | NVIDIA A10G 24GB (nano-banana-pro / seedream-5-0) | Zero-drift virtual brand ambassadors with facial biometrics & automated compliance verification |
| **08** | **[Automated Social Publisher](./social-auto-publisher.md)** | Brand & Creative | ⭐⭐⭐ Medium | Master Asset → Multi-Platform | 4s – 12s / bundle | **$0.0083** / campaign | Firecracker MicroVM + Social Engine OAuth | Scheduled publishing to TikTok, IG Reels, YouTube Shorts & X with localized AI copy & analytics |
| **09** | **[2D Photo to AR 3D Assets](./image-to-3d.md)** | Enterprise & Commerce | ⭐⭐⭐⭐⭐ Enterprise | 2D Photo → 3D Mesh → AR | 3s (Lite) – 150s (Pro) | **$0.020 – $0.180** / model | GPU4 + GPU5 (NVIDIA A10G 24GB VRAM) | PBR `.glb` & Apple AR Quick Look `.usdz` |
| **10** | **[E-Commerce Catalog Automation](./ecommerce-catalog-automation.md)** | Enterprise & Commerce | ⭐⭐⭐⭐ Advanced | SKU Photo + CSV → Listing | 2.5s – 5.5s / SKU | **$0.0315 – $0.1340** / img | Celery Worker Pool + Cloudflare R2 BYOB | Multi-angle studio packshots, WCAG 2.2 alt-text, multilingual copy & Shopify/WooCommerce sync |
| **11** | **[Document & Invoice Intelligence](./document-intelligence-pipeline.md)** | Enterprise & Commerce | ⭐⭐⭐⭐⭐ Enterprise | PDF / Scans → JSON → ERP | 1.2s – 2.5s / page | **$0.0105 – $0.0155** / page | AWS Textract + Firecracker MicroVM | Air-gapped OCR, Pydantic schema validation, mathematical ledger audit & SAP/ERP export |

---

## Distributed Hardware Architecture & Cluster Topologies

Every FOTOhub blueprint maps each sub-task to specialized compute infrastructure optimized for the required compute profile, maximizing throughput and eliminating memory bottlenecks:

```mermaid
flowchart TD
    Client["Client App / SDK / Webhook"] --> API["FOTOhub API Gateway (Frankfurt eu-central-1)"]
    API --> Preflight["Wallet Balance & Quota Gate (wallet.available_usd)"]
    Preflight --> Router{"Workload Affinity Dispatcher"}

    subgraph "Specialized GPU Fleet"
        Router -->|"Shorts & WhisperX"| GPU1["GPU Node 1 (Speech Analysis, YOLOv8 Tracking)"]
        Router -->|"Audio & Foley"| GPU2["GPU Node 2 (MMAudio + Stable Audio)"]
        Router -->|"Lip-Sync & Faces"| GPU3["GPU Node 3 (MuseTalk, LatentSync, FaceFusion)"]
        Router -->|"3D Geometry & Retopology"| GPU4["GPU Node 4 (PyMeshLab, xatlas, Trimesh)"]
        Router -->|"3D Implicit Fields & Diffusion"| GPU5["GPU Node 5 (A10G 24GB — FH Pro 3D)"]
        Router -->|"Hardware NVENC Encoding"| NVENC["GPU Render Nodes (FFmpeg NVENC 60fps)"]
    end

    subgraph "Air-Gapped Sandboxes & Compute"
        Router -->|"Code Execution & Math Audit"| Firecracker["Agent Compute (Firecracker MicroVMs)"]
        Router -->|"On-Demand GPU Clusters"| ComputeEngine["Compute Engine (EC2 A10G/T4 On-Demand/Spot)"]
    end

    subgraph "Storage & Zero-Egress Delivery"
        GPU1 & GPU2 & GPU3 & GPU4 & GPU5 & NVENC & Firecracker --> S3Cache["FOTOhub Internal NVMe S3 Cache (s1.fotohub.app)"]
        S3Cache --> Destinations["BYOB Router (/v1/destinations)"]
        Destinations --> ExternalS3["Customer AWS S3 / Cloudflare R2 / GCS"]
        Destinations --> SocialPublish["Social Studio (TikTok / IG / YouTube API)"]
    end
```

### Hardware Affinity Reference

You never address these nodes directly — every request goes through
`apis.fotohub.app` and the gateway routes it. The table is here so you can
reason about why some operations are slower or pricier than others, not as a
set of endpoints.

| Node Identifier | Primary Engine | Physical Hardware | Typical Workloads |
|:---|:---|:---|:---|
| **GPU Node 1** | Shorts & Media Engine | NVIDIA A10G 24GB + NVMe | WhisperX diarization, YOLOv8 face tracking, B-score ranking |
| **GPU Node 2** | Audio & Foley Engine | NVIDIA A10G 24GB | MMAudio video-to-audio SFX, Stable Audio |
| **GPU Node 3** | Lip-Sync Engine | NVIDIA T4 / A10G | MuseTalk (fast), LatentSync (HD diffusion), FaceFusion |
| **GPU Node 4** | 3D Geometry Node | AWS g5.4xlarge | Mesh post-processing and format conversion |
| **GPU Node 5** | 3D Neural Node | Dedicated GPU | FH Pro 3D reconstruction and PBR texture baking |
| **NVENC Fleet** | Video Composition | Hardware NVENC H.264/HEVC | 60fps video compositing, ASS subtitle burn-in, audio muxing |
| **Agent MicroVM**| Firecracker Sandboxes | AMD EPYC KVM MicroVMs | Math audits, data normalization, untrusted Python scripts |
| **Compute Fleet**| Compute Engine | EC2 G5/G4dn/C5/M5/R5 | Dedicated customer GPU rentals, ComfyUI, vLLM clusters |

---

## Architectural Guarantees & Production Economics

### 1. Pure USD Wallet Billing (Zero Synthetic Credits)
FOTOhub eliminates proprietary token packs, arbitrary credit tiers, and exchange rate markups. 
- **Metered in Real Currency**: Every recipe operation logs a cryptographically verifiable entry in `billing_transactions` denominated in USD (`currency: 'USD'`).
- **Sub-Cent Precision**: Costs are computed with 6 decimal places (`$0.000001`), ensuring multi-thousand batch jobs have zero rounding drift.
- **Fail-Safe Automatic Refunds**: If an upstream GPU process encounters an out-of-memory (CUDA OOM) condition or socket timeout, the pipeline immediately triggers `paywall.refund_and_raise()`, restoring 100% of the funds to `user_balance.available_usd`.

### 2. Bring Your Own Bucket (BYOB) & Direct Streaming
Eliminate secondary download hops and expensive egress bandwidth fees:
- Configure external destinations once via `/v1/destinations` (AWS S3, Cloudflare R2, Google Cloud Storage, Supabase Storage).
- Output files stream directly from the inference cluster to your merchant bucket using presigned multi-part uploads.
- Zero egress fees charged by FOTOhub when writing directly to your Cloudflare R2 or regional S3 storage.

### 3. Cryptographic Verification & Idempotency
- **Idempotency Keys**: All state-mutating requests accept an `idempotency_key` (UUIDv4). Duplicate network retries within a 24-hour window replay the cached job ID without re-billing your wallet.
- **HMAC-SHA256 Webhooks**: Every webhook callback includes the `X-FotoHub-Signature` header calculated using your secret token over the raw request payload. Always verify before dispatching downstream database mutations.

---

## Multi-Engine Orchestration Blueprint

The power of FOTOhub recipes lies in chaining specialized engines together. Below is a complete, production-ready script orchestrating a multi-stage workflow:
1. Generate an e-commerce product image on **Seedream 5.0**.
2. Isolate the subject with background removal.
3. Reconstruct a textured 3D mesh via **FH Pro 3D**, requesting the export format you need directly (GLB for web/WebGL, USDZ for Apple AR Quick Look).

::: tip
There is no separate mesh-optimization or format-conversion endpoint — `/v1/ai/generate/3d`
exports the format you ask for (`glb`, `obj`, `stl`, or `usdz`) in the same job. If you need
both a GLB and a USDZ of the same model, submit two jobs with the same input and a different
`format`.
:::

::: code-group

```python [Python Orchestrator]
"""
Production Multi-Engine Pipeline Orchestrator:
2D Image Generation -> Background Removal -> Textured 3D Reconstruction (GLB + USDZ)
"""

import base64
import os
import requests

API_KEY = os.environ["FOTOHUB_API_KEY"]
BASE_URL = "https://apis.fotohub.app"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def generate_3d(image_base64: str, fmt: str) -> str:
    """Generate one FH Pro 3D mesh and return the delivered URL for `fmt`.

    `POST /v1/ai/generate/3d` is synchronous — it holds the connection open
    (up to ~3 minutes) and returns the finished model in the same response,
    under `url`. There is no job/poll pattern for this endpoint.
    """
    res = requests.post(f"{BASE_URL}/v1/ai/generate/3d", headers=HEADERS, json={
        "mode": "image-to-3d",
        "model": "fh-pro-3d",
        "image_base64": image_base64,
        "format": fmt,
        "quality": "high",
    }, timeout=200)
    res.raise_for_status()
    return res.json()["url"]

def run_multimodal_pipeline(prompt: str):
    print("=== Step 1: Generating Product Studio Image ===")
    img_res = requests.post(f"{BASE_URL}/v1/ai/generate/image", headers=HEADERS, json={
        "prompt": prompt,
        "model": "seedream-5-0-260128",
        "aspect_ratio": "1:1"
    })
    img_res.raise_for_status()
    image_url = img_res.json()["images"][0]
    print(f"[✓] Image Generated: {image_url} (Charged: ${img_res.json().get('usd_charged', 0):.4f} USD)")

    print("\n=== Step 2: Isolating Subject via Background Removal ===")
    bg_res = requests.post(f"{BASE_URL}/v1/images/remove-background", headers=HEADERS, json={
        "image_url": image_url
    })
    bg_res.raise_for_status()
    cutout_url = bg_res.json()["output_url"]
    print(f"[✓] Clean Alpha Cutout: {cutout_url}")

    cutout_bytes = requests.get(cutout_url).content
    cutout_b64 = base64.b64encode(cutout_bytes).decode()

    print("\n=== Step 3: Textured 3D Reconstruction (self-hosted FH Pro 3D) ===")
    glb_url = generate_3d(cutout_b64, "glb")
    print(f"[✓] Interactive WebGL asset (GLB): {glb_url}")

    usdz_url = generate_3d(cutout_b64, "usdz")
    print(f"[✓] Apple AR Quick Look asset (USDZ): {usdz_url}")

    print("\n================ PIPELINE COMPLETE ================")
    print(f"Product: {prompt}")
    print(f"Interactive WebGL (GLB): {glb_url}")
    print(f"Apple Augmented Reality (USDZ): {usdz_url}")

if __name__ == "__main__":
    run_multimodal_pipeline(
        prompt="Modern minimalist ceramic coffee kettle with matte terracotta finish on white background"
    )
```

```typescript [TypeScript Orchestrator]
import axios from "axios";

const API_KEY = process.env.FOTOHUB_API_KEY!;
const BASE_URL = "https://apis.fotohub.app";
const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json"
};

async function runECommercePipeline() {
  console.log("Step 1: Generating studio image...");
  const imgRes = await axios.post(`${BASE_URL}/v1/ai/generate/image`, {
    prompt: "Luxury chronograph titanium wristwatch on dark marble",
    model: "seedream-5-0-260128",
    aspect_ratio: "1:1"
  }, { headers });

  const imageUrl = imgRes.data.images[0];
  console.log(`[✓] Generated Image: ${imageUrl}`);

  console.log("Step 2: Removing background...");
  const bgRes = await axios.post(`${BASE_URL}/v1/images/remove-background`, {
    image_url: imageUrl
  }, { headers });
  const cutoutUrl = bgRes.data.output_url;

  console.log("Step 3: Generating textured 3D model (self-hosted FH Pro 3D)...");
  const cutoutBytes = await axios.get(cutoutUrl, { responseType: "arraybuffer" });
  const cutoutB64 = Buffer.from(cutoutBytes.data).toString("base64");

  // POST /v1/ai/generate/3d is synchronous — it returns the finished model
  // in this same response (under `url`), not a job_id to poll.
  const modelRes = await axios.post(`${BASE_URL}/v1/ai/generate/3d`, {
    mode: "image-to-3d",
    model: "fh-pro-3d",
    image_base64: cutoutB64,
    format: "glb",
    quality: "high"
  }, { headers, timeout: 200_000 });

  console.log(`[✓] Production GLB Model Ready: ${modelRes.data.url}`);
}

runECommercePipeline().catch(console.error);
```

```go [Go Orchestrator]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

func main() {
	apiKey := os.Getenv("FOTOHUB_API_KEY")
	client := &http.Client{Timeout: 30 * time.Second}

	// Synthesize voice for marketing ad
	ttsPayload := map[string]interface{}{
		"text":     "Experience unparalleled precision with the all-new Titanium Chronograph.",
		"voice_id": "en-US-Journey-F",
		"speed":    1.0,
	}
	body, _ := json.Marshal(ttsPayload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/tts/gemini/synthesize", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	fmt.Printf("[✓] Gemini TTS Audio Synthesized: %s (USD Charged: $%.4f)\n", 
		result["audio_url"], result["usd_charged"])
}
```

```bash [cURL Orchestrator]
# 1. Generate Product Concept
IMAGE_URL=$(curl -s -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Matte black ceramic coffee cup on travertine table",
    "model": "seedream-5-0-260128",
    "aspect_ratio": "1:1"
  }' | jq -r '.images[0]')

echo "[✓] Master Image: $IMAGE_URL"

# 2. Extract Alpha Cutout
CUTOUT_URL=$(curl -s -X POST https://apis.fotohub.app/v1/images/remove-background \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"image_url\": \"$IMAGE_URL\"}" | jq -r '.output_url')

echo "[✓] Alpha Mask: $CUTOUT_URL"
```

:::

---

## Enterprise Production Planning

FOTOhub does not publish per-cluster cold-start times, concurrency ceilings, or a
p95 SLA figure for each engine — no such numbers are measured or contracted, so
this page will not quote any. What you can rely on instead:

- **Per-endpoint rate caps.** Expensive endpoints (video, 3D, lip-sync, story) carry
  their own request-per-minute ceiling regardless of your tier — see
  [Rate Limits](/api/rate-limits) for the exact table.
- **Refund on engine failure.** If a paid generation fails on the provider/engine
  side, the charge is reversed and the error response says so explicitly
  (`"No charge was made for this request."`).
- **Async status, not guessed timing.** Async endpoints (video, IDA Q image,
  clipping jobs) return a `job_id` you poll for real status — do not hardcode an
  expected completion time; poll until `status` is `completed` or `failed`.

If your enterprise workload needs a contracted concurrency or latency guarantee,
talk to your account team — this is negotiated per contract, not a platform-wide
published number.

---

## Production Resilience & Failure Recovery

### Exponential Backoff with Jitter
Network hiccups and transient HTTP 503/429 errors must never crash long-running batch jobs. Implement full jitter exponential backoff:

$$t_{\text{sleep}} = \min(t_{\text{max}}, t_{\text{base}} \times 2^{\text{attempt}}) \times \text{random}(0.8, 1.2)$$

### Webhook Dead-Letter Queues (DLQ)
When receiving webhook callbacks (`shorts.clip.rendered`, `commerce.job.completed`, `generation.completed`):
1. **Immediate HTTP 200 Acknowledgment**: Return HTTP 200 within 5 seconds to prevent retries.
2. **Push to In-Memory Queue**: Offload heavy database writes, CDN invalidations, or video remuxing to a Celery or BullMQ worker queue.
3. **Dead-Letter Resiliency**: If downstream processing fails after 3 attempts, store the raw event in a DLQ table with the original `X-FotoHub-Signature` for manual replay.

---

## Recipe Catalog Index

Explore the detailed blueprints below for end-to-end code implementations, parameter tables, and production runbooks:

### Media & Video Automation
- **[Video to Viral Shorts](./video-to-shorts.md)** — Transform webinars, interviews, and long-form streams into vertical shorts with dynamic captions.
- **[Podcast to Viral Shorts Studio](./podcast-to-clips.md)** — Ingest 60-min podcast episodes, track multi-speaker dialogue in 9:16 stacked/pip layouts, and normalize to -14 LUFS.
- **[Automated UGC Video Ads](./ugc-video-campaigns.md)** — Ingest product URLs, generate 3 viral hooks, cast AI UGC actors, synthesize Gemini/Azure voice, and render multi-scene ads.
- **[Video Sound Design & Foley](./video-sound-design.md)** — Detect visual kinetic cues, synthesize Foley effects with MMAudio on GPU2, generate music, and apply sidechain ducking.
- **[Multilingual Lip-Sync Dubbing](./lip-sync-dubbing.md)** — Revoice actors across languages while matching exact mouth phonemes.

### Brand & Creative Studio
- **[Virtual Try-On Fashion Studio](./virtual-tryon-fashion.md)** — High-fidelity apparel draping with realistic folds, luxury studio backgrounds, and 4K super-resolution.
- **[Brand DNA & Virtual Influencers](./brand-dna-virtual-influencers.md)** — Zero-drift synthetic brand ambassadors, multi-angle perspectives, and automated guideline compliance audits.
- **[Automated Social Publisher](./social-auto-publisher.md)** — Multi-channel automated social scheduling and publishing to TikTok, IG Reels, YouTube Shorts, and X with AI copy and engagement tracking.

### Enterprise & E-Commerce
- **[2D Photo to AR 3D Assets](./image-to-3d.md)** — Convert a single photo into a textured 3D mesh, exported as `.glb` or Apple AR Quick Look `.usdz`.
- **[E-Commerce Catalog Automation](./ecommerce-catalog-automation.md)** — Ingest CSVs, strip backgrounds, generate multi-angle studio scenes, and sync with Shopify/WooCommerce.
- **[Document & Invoice Intelligence](./document-intelligence-pipeline.md)** — Ingest invoices, extract multi-column tables, validate math in Firecracker microVMs, and export to ERPs.
