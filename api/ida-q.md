# IDA Q: Intelligent Creative Platform Assistant

**IDA Q** (`/v1/ai/ida-q`) is FOTOhub's built-in intelligent assistant and creative copilot. Powered by an ensemble of **Claude 3.5 Sonnet** and **GPT-4o** with direct platform context awareness, IDA Q acts as an interactive bridge between your business logic and FOTOhub's 50+ generative AI and compute engines.

Unlike generic LLMs, IDA Q possesses real-time introspection into your account's execution history, active GPU tasks, wallet balance, and exact model capabilities—enabling automated prompt engineering, multimodal image diagnostics, error resolution, workflow architecture design, and pre-execution cost estimation down to fractions of a cent.

---

## Core Capabilities

```mermaid
flowchart TD
    User["Developer Request / Client App"] --> Gateway["POST /v1/ai/ida-q"]
    Gateway --> Router{"IDA Q Intent Classifier"}

    Router -->|"Prompt Optimization"| Opt["Prompt Engine (Negative prompts, CFG, LoRA syntax)"]
    Router -->|"Visual Auditing"| Vision["Multimodal Perception (Artifacts, lighting, anatomy)"]
    Router -->|"Workflow Blueprinting"| Blueprint["Multi-Engine Orchestrator (Image -> 3D -> Shorts)"]
    Router -->|"Cost Preflight"| Cost["Pricing Calculator (Real-time USD wallet impact)"]
    Router -->|"Incident Diagnosis"| Diag["Error Triage (HTTP 402, 429, CUDA OOM, Timeout)"]

    Opt & Vision & Blueprint & Cost & Diag --> ModelCluster["Hybrid Ensemble (Claude 3.5 Sonnet / GPT-4o)"]
    ModelCluster --> Output["Streaming SSE / JSON Response + Actionable Payload"]
```

1. **Prompt Optimization & Style Expansion**: Transforms rudimentary text descriptions into photorealistic, camera-calibrated prompts tailored to specific diffusion models (Seedream 5.0, FLUX 2 Pro, Midjourney v6, or BytePlus).
2. **Multimodal Visual Diagnostics**: Ingests generated outputs to identify visual artifacts, anatomical flaws, suboptimal lighting, or compression banding, providing exact prompt and seed adjustments for rerolls.
3. **Multi-Engine Pipeline Architecture**: Generates complete, runnable code blueprints chaining disparate modalities (e.g., text-to-image → background removal → 3D mesh → video animation).
4. **Pre-Flight Cost Estimation**: Analyzes complex batch plans and calculates exact USD budget requirements across all involved engines before triggering provisioning.
5. **Contextual Incident Debugging**: Accepts a `request_id` or HTTP error body and immediately diagnoses the failure mode (e.g., CUDA OOM on GPU2, missing IAM S3 policy, or rate limits) with actionable corrective code.
6. **Multi-Turn Session Continuity**: Maintains conversation thread context across dozens of iterations using cryptographically verified `thread_id` identifiers.

---

## API Specification

### Endpoint Overview

```http
POST https://apis.fotohub.app/v1/ai/ida-q
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json
```

All requests debit your **prepaid USD wallet** at a flat rate of **$0.003 USD per request** (or $0.003 per streaming session), regardless of backend model routing or whether visual analysis is attached.

---

### Request Parameters

| Parameter | Type | Required | Default | Description |
|:---|:---|:---:|:---|:---|
| `message` | string | **Yes** | — | The query, creative directive, or error log to submit. |
| `thread_id` | string (UUID) | No | `null` | Identifier of an existing conversation thread to continue. |
| `mode` | string | No | `"auto"` | Execution mode: `"auto"`, `"prompt_optimize"`, `"vision_audit"`, `"pipeline_architect"`, `"cost_estimate"`, or `"troubleshoot"`. |
| `context` | object | No | `{}` | Contextual metadata to bind to the assistant's context window. |
| `context.image_url` | string | No | `null` | Public or presigned image URL for visual diagnostics and style breakdown. |
| `context.target_model` | string | No | `null` | Intended generation model (e.g., `"seedream-5-0-260128"`, `"flux-2-pro"`). |
| `context.include_balance`| boolean | No | `false` | When `true`, injects current `wallet.available_usd` for precise budget sizing. |
| `context.include_history`| boolean | No | `false` | When `true`, grants read access to metadata from your last 5 API transactions. |
| `stream` | boolean | No | `false` | When `true`, returns Server-Sent Events (`text/event-stream`). |
| `temperature` | float | No | `0.3` | Sampling temperature (0.0 to 1.0). Lower values yield more deterministic code. |

---

### Response Structure (JSON Mode)

```json
{
  "thread_id": "thr_9f8e7d6c-5b4a-4321-8765-abcdef012345",
  "response": "To generate an ultra-realistic cinematic shot of a titanium wristwatch with Seedream 5.0, adjust your prompt to specify optical characteristics, lighting geometry, and surface micro-textures.",
  "optimized_prompt": "Editorial studio macro photograph of a brushed titanium chronograph wristwatch resting on dark polished volcanic slate, soft directional octabox key light from top-left, subtle rim light accentuating chamfered bezel, water droplet condensation on sapphire crystal, 85mm f/2.8 macro lens, shallow depth of field, 8k resolution, photorealistic",
  "negative_prompt": "cartoon, plastic texture, render artifacts, distorted dial markers, overexposed highlights, chromatic aberration, low resolution",
  "suggested_parameters": {
    "model": "seedream-5-0-260128",
    "aspect_ratio": "1:1",
    "num_images": 1,
    "seed": 4829104
  },
  "estimated_cost_usd": 0.0450,
  "billing": {
    "usd_charged": 0.0030,
    "balance_usd": 48.7210,
    "currency": "USD"
  },
  "execution_time_ms": 612
}
```

---

## Interactive Modes & Blueprints

### 1. Prompt Optimization Mode

Send a raw, unrefined user input to receive model-tailored positive and negative prompts, optimal sampling seeds, and aspect ratio recommendations:

::: code-group

```python [Python]
import os
import requests

API_KEY = os.environ["FOTOHUB_API_KEY"]
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

payload = {
    "message": "A woman drinking coffee in a modern cozy kitchen morning sunlight",
    "mode": "prompt_optimize",
    "context": {
        "target_model": "seedream-5-0-260128"
    }
}

res = requests.post("https://apis.fotohub.app/v1/ai/ida-q", headers=headers, json=payload)
data = res.json()

print(f"[✓] Optimized Prompt:\n{data['optimized_prompt']}")
print(f"\n[✓] Negative Prompt:\n{data['negative_prompt']}")
print(f"\n[✓] Estimated Cost: ${data['estimated_cost_usd']:.4f} USD")
```

```typescript [TypeScript]
import axios from "axios";

const API_KEY = process.env.FOTOHUB_API_KEY!;
const headers = { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" };

async function optimizePrompt() {
  const { data } = await axios.post("https://apis.fotohub.app/v1/ai/ida-q", {
    message: "A woman drinking coffee in a modern cozy kitchen morning sunlight",
    mode: "prompt_optimize",
    context: { target_model: "seedream-5-0-260128" }
  }, { headers });

  console.log("Optimized Prompt:", data.optimized_prompt);
  console.log("Negative Prompt:", data.negative_prompt);
  console.log(`USD Charged: $${data.billing.usd_charged}`);
}

optimizePrompt().catch(console.error);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

func main() {
	apiKey := os.Getenv("FOTOHUB_API_KEY")
	client := &http.Client{}

	payload := map[string]interface{}{
		"message": "A woman drinking coffee in a modern cozy kitchen morning sunlight",
		"mode":    "prompt_optimize",
		"context": map[string]string{
			"target_model": "seedream-5-0-260128",
		},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/ida-q", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	fmt.Printf("[✓] Optimized Prompt: %v\n", result["optimized_prompt"])
}
```

```bash [cURL]
curl -s -X POST "https://apis.fotohub.app/v1/ai/ida-q" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "A woman drinking coffee in a modern cozy kitchen morning sunlight",
    "mode": "prompt_optimize",
    "context": {
      "target_model": "seedream-5-0-260128"
    }
  }' | jq '{optimized_prompt, negative_prompt, estimated_cost_usd}'
```

:::

---

### 2. Multimodal Visual Diagnostics Mode

Supply a generated image URL to receive automated critical review, aesthetic scoring, defect categorization, and a remedial action plan:

```json
// POST /v1/ai/ida-q Payload
{
  "message": "Analyze why this rendered portrait looks artificial and recommend exact prompt fixes",
  "mode": "vision_audit",
  "context": {
    "image_url": "https://s3point.fotohub.app/generations/test_render_01.webp",
    "target_model": "seedream-5-0-260128"
  }
}
```

#### Diagnostic Output Example

```json
{
  "thread_id": "thr_4a3b2c1d-6e5f-4098-9876-123456789abc",
  "audit": {
    "photorealism_score": 78,
    "anatomical_accuracy": 92,
    "lighting_coherence": 64,
    "texture_fidelity": 75,
    "defects_detected": [
      "Skin surface exhibits oversmoothed plastic diffusion glaze; lack of epidermal micro-pores",
      "Conflicting specular highlights on the eyes indicate non-physical multi-source key lights",
      "Hair strands blur into background alpha boundary"
    ]
  },
  "remedial_prompt": "Candid 35mm photograph of a 28-year-old woman, authentic skin texture with natural pores, subtle freckles, soft peach fuzz, natural imperfect hair flyaways, single continuous diffused window light from left, Kodak Portra 400 color science, unretouched raw look",
  "recommended_cfg": 5.5,
  "billing": { "usd_charged": 0.0030, "currency": "USD" }
}
```

---

### 3. Server-Sent Events (SSE) Streaming

For interactive consoles and chat interfaces, stream token deltas in real-time by setting `stream: true`:

::: code-group

```python [Python Streaming Client]
import os
import httpx

API_KEY = os.environ["FOTOHUB_API_KEY"]
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

payload = {
    "message": "Write a complete FastAPI webhook receiver in Python that handles FOTOhub video generation events with HMAC verification.",
    "stream": True
}

with httpx.stream("POST", "https://apis.fotohub.app/v1/ai/ida-q", headers=headers, json=payload, timeout=60.0) as response:
    for line in response.iter_lines():
        if line.startswith("data: "):
            content = line[6:]
            if content == "[DONE]":
                break
            print(content, end="", flush=True)
print("\n")
```

```typescript [TypeScript / Node.js Streaming]
import axios from "axios";

async function streamIdaQ() {
  const response = await axios.post(
    "https://apis.fotohub.app/v1/ai/ida-q",
    {
      message: "Explain the architectural difference between MuseTalk and LatentSync on GPU3.",
      stream: true
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}`,
        "Content-Type": "application/json"
      },
      responseType: "stream"
    }
  );

  response.data.on("data", (chunk: Buffer) => {
    const lines = chunk.toString().split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const text = line.replace("data: ", "");
        if (text === "[DONE]") return;
        process.stdout.write(text);
      }
    }
  });
}

streamIdaQ().catch(console.error);
```

```bash [cURL Stream]
curl -N -X POST "https://apis.fotohub.app/v1/ai/ida-q" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Design an e-commerce catalog generation pipeline using Commerce Bridge",
    "stream": true
  }'
```

:::

---

## Pre-Flight Cost Estimation & Architecture Blueprints

When planning high-throughput batch operations, pass `mode: "cost_estimate"` with your proposed SKU count and modalities. IDA Q queries `server/api-server/app/services/usd_pricing.py` and returns a transparent breakdown of charges from your prepaid USD wallet balance:

```http
POST https://apis.fotohub.app/v1/ai/ida-q
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json

{
  "message": "Estimate total USD spend to process 5,000 apparel SKUs: remove background, generate 3D GLB models, and produce 15-second virtual try-on video reels for each.",
  "mode": "cost_estimate",
  "context": {
    "include_balance": true
  }
}
```

### Breakdown Response

```json
{
  "total_estimated_usd": 1285.00,
  "current_wallet_usd": 2500.00,
  "balance_remaining_usd": 1215.00,
  "sufficient_funds": true,
  "unit_breakdown": [
    {
      "stage": "1. SAM2 Background Removal",
      "unit_cost_usd": 0.0030,
      "quantity": 5000,
      "subtotal_usd": 15.00,
      "hardware_tier": "GPU Cluster Node"
    },
    {
      "stage": "2. FH Pro 3D Neural Mesh (GPU5 A10G)",
      "unit_cost_usd": 0.1200,
      "quantity": 5000,
      "subtotal_usd": 600.00,
      "hardware_tier": "GPU5 NVIDIA A10G 24GB"
    },
    {
      "stage": "3. Virtual Try-On 15s Video Reel",
      "unit_cost_usd": 0.1340,
      "quantity": 5000,
      "subtotal_usd": 670.00,
      "hardware_tier": "GPU1 NVENC Compositor"
    }
  ],
  "recommendations": [
    "Execute in batches of 500 SKUs via async queue to maintain optimal GPU concurrency without triggering rate limit bounds.",
    "Configure an external Cloudflare R2 BYOB destination via /v1/destinations to eliminate outbound egress storage fees."
  ]
}
```

---

## Multi-Turn Session Management

To maintain stateful multi-step consultations (such as iterative prompt refining or character design), capture and replay the `thread_id`:

::: code-group

```python [Python Multi-Turn]
import requests
import os

API_KEY = os.environ["FOTOHUB_API_KEY"]
url = "https://apis.fotohub.app/v1/ai/ida-q"
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# Turn 1: Initial Query
r1 = requests.post(url, headers=headers, json={
    "message": "I want to build a virtual influencer named Elena for an athletic wear brand."
}).json()

thread_id = r1["thread_id"]
print(f"Session Thread: {thread_id}")
print(f"IDA Q: {r1['response']}\n")

# Turn 2: Follow-up referencing earlier discussion
r2 = requests.post(url, headers=headers, json={
    "thread_id": thread_id,
    "message": "Now give me the exact POST /v1/brands/{id}/faces/generate payload for Elena."
}).json()

print(f"IDA Q Follow-Up: {r2['response']}")
```

:::

---

## Embedded Client Widget Integration

Embed IDA Q directly into your internal admin portals, e-commerce dashboards, or creative suites using our secure `postMessage` cross-origin iframe protocol:

```html
<!-- Client Integration Snippet -->
<iframe
  id="fotohub-ida-q-frame"
  src="https://console.fotohub.app/embed/ida-q?theme=dark"
  style="width: 100%; height: 600px; border: 1px solid #27272a; border-radius: 8px;"
></iframe>

<script>
  const iframe = document.getElementById("fotohub-ida-q-frame");

  // Handshake and pass ephemeral session token
  window.addEventListener("message", (event) => {
    if (event.origin !== "https://console.fotohub.app") return;

    if (event.data.type === "FOTOHUB_IDA_READY") {
      iframe.contentWindow.postMessage({
        type: "FOTOHUB_INIT_SESSION",
        token: "fh_live_ephemeral_client_token",
        initialContext: {
          activePage: "catalog_creator",
          brandId: "brd_982a17f"
        }
      }, "https://console.fotohub.app");
    }
  });
</script>
```

---

## Error Handling & Status Codes

| Status Code | Error Key | Cause & Remediation |
|:---|:---|:---|
| `400 Bad Request` | `invalid_context` | Inaccessible `image_url` or malformed parameter payload. |
| `401 Unauthorized` | `invalid_api_key` | Missing or revoked Bearer token. Ensure `fh_live_...` prefix. |
| `402 Payment Required` | `insufficient_funds` | Wallet balance is below `$0.003 USD`. Top up via `/console/billing`. |
| `429 Too Many Requests` | `rate_limit_exceeded` | Request burst exceeds account tier limit. Apply exponential backoff. |
| `503 Service Unavailable`| `model_overload` | Temporary inference latency spike. Auto-retries transparently. |
