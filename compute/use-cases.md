# Production Blueprints & Real-World Architectures

Battle-tested architectural blueprints showing how high-growth startups, enterprise teams, and AI agencies deploy FOTOhub Dedicated Compute and Ephemeral Sandboxes in production.

---

## The Enterprise Blueprint Matrix

| # | Blueprint Name | Core Stack | Recommended Hardware | Production Cost | Key Business Advantage |
|:---:|:---|:---|:---|:---|:---|
| **1** | **[Private Enterprise LLM Gateway](#1-enterprise-private-llm-gateway)** | vLLM + Qwen 2.5 / DeepSeek | 1x A10G (`g5.xlarge`) Spot | **$0.38 / hr** | 100% GDPR compliant EU endpoint with zero vendor token markups |
| **2** | **[High-Volume ComfyUI Render Farm](#2-high-volume-comfyui-render-farm)** | Headless FLUX / SDXL | 3–6x A10G (`g5.xlarge`) Spot | **$0.00048 / image** | 20,000+ packshots/day at 1/80th the cost of commercial image APIs |
| **3** | **[Multilingual Video & Lip-Sync Pipeline](#3-multilingual-voice-video-dubbing-farm)** | Demucs + Whisper + LatentSync | 1x A10G + 1x T4 Fleet | **$0.58 / hr** | Automated video localization with matching lip movements |
| **4** | **[Continuous LoRA Training Factory](#4-continuous-lora-training-pipeline)** | Kohya-ss / Unsloth | 1x A10G (`g5.xlarge`) Spot | **$0.55 / run (75m)** | Nightly custom character & brand aesthetic adapter fine-tuning |
| **5** | **[Untrusted SaaS Code Interpreter](#5-untrusted-code-interpreter-for-saas)** | Firecracker microVMs | Serverless Sandboxes | **$0.00008 / run** | Sub-200ms KVM execution with zero SSRF or host escape risk |
| **6** | **[Anti-Bot Web Scraping Fleet](#6-large-scale-web-intelligence-fleet)** | Playwright in Sandboxes | Agent Compute Workers | **$0.02 / domain** | Headless browser SPA extraction, PDF parsing & structured JSON |
| **7** | **[4K 60fps Live Video Transcoder](#7-4k-60fps-video-transcoding-hls-streaming)** | FFmpeg dual NVENC | 1x T4 (`g4dn.xlarge`) Spot | **$0.20 / hr** | Real-time multi-bitrate HLS streaming with hardware encoding |
| **8** | **[Autonomous Support Agent with RAG](#8-autonomous-support-agent-with-document-grounding)** | Agent Engine + Vector DB | Compute + Claude Opus | **Per-task billing** | Multi-step reasoning loops with sandboxed reproduction scripts |
| **9** | **[Real-Time Voice AI Agent Gateway](#9-real-time-voice-ai-agent-gateway)** | WebRTC + vLLM + Chatterbox | 1x A10G (`g5.xlarge`) | **$1.01 / hr (On-Dem)**| Sub-400ms voice-to-voice conversational customer support |
| **10**| **[E-Commerce 3D Mesh Generator](#10-e-commerce-3d-mesh-generator-farm)** | TripoSR + Quad Remesh | 1x A10G (`g5.xlarge`) Spot | **$0.012 / 3D model** | Single 2D photo to AR-ready GLB/USDZ interactive models |
| **11**| **[Dynamic Video Ad Personalizer](#11-dynamic-video-ad-personalization-engine)** | MoviePy + NVENC + TTS | 2x T4 (`g4dn.2xlarge`) Spot | **$0.54 / hr** | 1,000 customized TikTok video variations generated per hour |
| **12**| **[Multi-Agent Coding Swarm with CI](#12-multi-agent-coding-swarm-with-sandboxed-ci)** | Claude Opus + MicroVM CI | Agent Compute + Firecracker | **Per-commit billing** | Autonomous PR bug fixing with verified sandbox test runs |
| **13**| **[Real-time LLM API Gateway](#13-real-time-llm-api-gateway)** | vLLM + ALB + ASG | g5.xlarge behind ALB | **$0.38 / hr** | OpenAI-compatible endpoint for internal teams with infinite scale |
| **14**| **[Automated Video Dubbing Pipeline](#14-automated-video-dubbing-pipeline)** | Whisper + Lip-sync | 1x A10G + T4 | **$0.08 / min** | Batch processing 1000 videos/day with zero manual work |
| **15**| **[Synthetic Data Generation](#15-synthetic-data-generation)** | SDXL + ControlNet | 4x A10G Spot | **$0.00048 / image** | 100k images at fractional cost for model training augmentation |
| **16**| **[Multi-modal RAG System](#16-multi-modal-rag-system)** | C5 + Vector Search | c5.2xlarge + g4dn | **$0.35 / hr** | Enterprise document embedding and intelligent search capabilities |
| **17**| **[Autonomous SEO Content Factory](#17-autonomous-seo-content-factory)** | FH Claw + ComfyUI | Agent Compute | **$2 / day** | Fully automated content drafting, image gen, and social publishing |
| **18**| **[3D Product Asset Pipeline](#18-3d-product-asset-pipeline)** | TripoSR + Texture | 1x A10G (`g5.xlarge`) | **$0.012 / mesh** | 500 product meshes/day generated automatically from 2D images |
| **19**| **[Real-time Translation & Transcription](#19-real-time-translation-transcription)** | Whisper + NLLB | 1x T4 (`g4dn.xlarge`) | **$0.015 / min** | 1000 hours/month of multilingual transcription pipeline |

---

## 1. Enterprise Private LLM Gateway

### Architecture Diagram
```mermaid
flowchart LR
    A["Enterprise Clients (HTTPS)"] --> B["Nginx Reverse Proxy (SSL / mTLS)"]
    B --> C["vLLM Engine (NVIDIA A10G 24GB)"]
    C --> D["PagedAttention KV-Cache"]
    C --> E["Encrypted EBS Volume (/data/models)"]
```

### Provisioning Code
:::code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/instances \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "llm-gateway",
    "catalog_id": "g5.xlarge",
    "ami": "ubuntu-22.04-cuda12.4",
    "disk_size_gb": 100
  }'
```
```python [Python]
import requests
res = requests.post(
    "https://apis.fotohub.app/compute/v1/instances",
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
    json={
        "name": "llm-gateway",
        "catalog_id": "g5.xlarge",
        "ami": "ubuntu-22.04-cuda12.4",
        "disk_size_gb": 100
    }
)
print(res.json())
```
:::

### Cost Breakdown
- **Compute:** $0.38/hr (Spot A10G) -> $273.60/month
- **Storage:** $0.08/GB-month (100GB EBS gp3) -> $8.00/month
- **Total:** ~$281.60 / month for infinite token generation.

### Performance Benchmarks
- **Throughput:** ~78 tokens/second per stream; up to 32 concurrent active streams (~812 tokens/s cluster throughput).
- **Latency:** 18ms Time-To-First-Token (TTFT).

### Scaling Patterns
Scale horizontally using an Application Load Balancer across multiple Availability Zones in `eu-central-1`.

---

## 2. High-Volume ComfyUI Render Farm

### Architecture Diagram
```mermaid
flowchart TD
    A["Catalog Ingest (5,000 SKUs)"] --> B["Central Queue Dispatcher (Redis + FastAPI)"]
    B --> C["Spot Worker 1 (A10G Frankfurt 1a)"]
    B --> D["Spot Worker 2 (A10G Frankfurt 1b)"]
    B --> E["Spot Worker 3 (A10G Frankfurt 1c)"]
    C & D & E --> F["Direct Upload to FOTOhub S3 (s1.fotohub.app)"]
    F --> G["Completion Webhook Notified"]
```

### Provisioning Code
:::code-group
```python [Python]
import requests

def launch_worker(zone):
    return requests.post(
        "https://apis.fotohub.app/compute/v1/instances",
        headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
        json={
            "name": f"comfyui-worker-{zone}",
            "catalog_id": "g5.xlarge",
            "subnet_id": zone
        }
    ).json()

workers = [launch_worker(z) for z in ["eu-central-1a", "eu-central-1b", "eu-central-1c"]]
```
:::

### Cost Breakdown
- **Batch Size:** 5,000 images.
- **Compute Time:** 3 nodes running for 2.1 hours = 6.3 machine-hours.
- **Total Compute Cost:** 6.3 hrs × $0.38/hr = **$2.39**.
- **Cost per Image:** **$0.00048**.

### Scaling Patterns
Scale by adding more spot instances listening to the Redis queue.

---

## 13. Real-time LLM API Gateway

### Architecture Diagram
```mermaid
flowchart TD
    Client --> ALB[Application Load Balancer]
    ALB --> ASG[Auto Scaling Group]
    ASG --> Node1[g5.xlarge - vLLM]
    ASG --> Node2[g5.xlarge - vLLM]
```

### Provisioning Code
```bash
curl -X POST https://apis.fotohub.app/compute/v1/instances \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -d '{"name": "vllm-node", "catalog_id": "g5.xlarge"}'
```

### Cost & Benchmarks
- **Cost:** $0.38/hr
- **Performance:** 800 tokens/s throughput.

---

## 14. Automated Video Dubbing Pipeline

### Architecture Diagram
```mermaid
flowchart LR
    S3[FOTOhub S3 s1.fotohub.app] --> Node[A10G Worker]
    Node --> Whisper[Whisper Transcribe]
    Whisper --> Translate[LLM Translate]
    Translate --> Clone[Voice Clone]
    Clone --> LipSync[LatentSync]
    LipSync --> S3
```

### Setup & API Calls
```python
import requests
# Launch A10G worker
requests.post("https://apis.fotohub.app/compute/v1/instances", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}, json={"catalog_id": "g5.xlarge"})
```

### Expected Costs
$0.08 per minute of processed video.

---

## 15. Synthetic Data Generation

### Architecture Diagram
```mermaid
flowchart TD
    Queue --> Node1[SDXL + ControlNet A10G]
    Queue --> Node2[SDXL + ControlNet A10G]
    Node1 --> S3[s1.fotohub.app]
    Node2 --> S3
```

### Production Considerations
- **Storage:** $0.0245/GB-month on FOTOhub S3. FREE intra-cluster egress.
- **Cost:** $0.00048 per image.

---

## 16. Multi-modal RAG System

### Architecture
```mermaid
flowchart LR
    Doc --> OCR[T4 OCR Node]
    OCR --> Embed[C5 Embedding Node]
    Embed --> VectorDB[(Vector DB)]
    Query --> Embed
    Embed --> VectorDB
    VectorDB --> LLM[A10G Generation Node]
```

### Cost
$0.35/hr total for the micro-cluster.

---

## 17. Autonomous SEO Content Factory

### Architecture
```mermaid
flowchart TD
    Cron --> Agent[FH Claw Agent]
    Agent --> Research[Sandbox Playwright]
    Agent --> Draft[LLM Node]
    Agent --> Image[ComfyUI Node]
    Draft & Image --> Publish[CMS API]
```

### Cost
$2/day fully automated.

---

## 18. 3D Product Asset Pipeline

### Cost Breakdown
- **Compute:** $0.38/hr (A10G)
- **Rate:** 45 seconds per mesh
- **Cost:** $0.012 per 3D model

---

## 19. Real-time Translation & Transcription

### Setup
```python
import requests
# Launch T4 worker
requests.post("https://apis.fotohub.app/compute/v1/instances", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}, json={"catalog_id": "g4dn.xlarge"})
```

### Cost
$0.20/hr spot. 1000 hours/month at $0.015/min.

---

## 13. Real-time LLM API Gateway

### Architecture Diagram
```mermaid
flowchart TD
    Client --> ALB[Application Load Balancer]
    ALB --> ASG[Auto Scaling Group]
    ASG --> Node1[g5.xlarge - vLLM]
    ASG --> Node2[g5.xlarge - vLLM]
```

### Provisioning Code
```bash
curl -X POST https://apis.fotohub.app/compute/v1/instances \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -d '{"name": "vllm-node", "catalog_id": "g5.xlarge"}'
```

### Cost & Benchmarks
- **Cost:** $0.38/hr
- **Performance:** 800 tokens/s throughput.

---

## 14. Automated Video Dubbing Pipeline

### Architecture Diagram
```mermaid
flowchart LR
    S3[FOTOhub S3 s1.fotohub.app] --> Node[A10G Worker]
    Node --> Whisper[Whisper Transcribe]
    Whisper --> Translate[LLM Translate]
    Translate --> Clone[Voice Clone]
    Clone --> LipSync[LatentSync]
    LipSync --> S3
```

### Setup & API Calls
```python
import requests
# Launch A10G worker
requests.post("https://apis.fotohub.app/compute/v1/instances", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}, json={"catalog_id": "g5.xlarge"})
```

### Expected Costs
$0.08 per minute of processed video.

---

## 15. Synthetic Data Generation

### Architecture Diagram
```mermaid
flowchart TD
    Queue --> Node1[SDXL + ControlNet A10G]
    Queue --> Node2[SDXL + ControlNet A10G]
    Node1 --> S3[s1.fotohub.app]
    Node2 --> S3
```

### Production Considerations
- **Storage:** $0.0245/GB-month on FOTOhub S3. FREE intra-cluster egress.
- **Cost:** $0.00048 per image.

---

## 16. Multi-modal RAG System

### Architecture
```mermaid
flowchart LR
    Doc --> OCR[T4 OCR Node]
    OCR --> Embed[C5 Embedding Node]
    Embed --> VectorDB[(Vector DB)]
    Query --> Embed
    Embed --> VectorDB
    VectorDB --> LLM[A10G Generation Node]
```

### Cost
$0.35/hr total for the micro-cluster.

---

## 17. Autonomous SEO Content Factory

### Architecture
```mermaid
flowchart TD
    Cron --> Agent[FH Claw Agent]
    Agent --> Research[Sandbox Playwright]
    Agent --> Draft[LLM Node]
    Agent --> Image[ComfyUI Node]
    Draft & Image --> Publish[CMS API]
```

### Cost
$2/day fully automated.

---

## 18. 3D Product Asset Pipeline

### Cost Breakdown
- **Compute:** $0.38/hr (A10G)
- **Rate:** 45 seconds per mesh
- **Cost:** $0.012 per 3D model

---

## 19. Real-time Translation & Transcription

### Setup
```python
import requests
# Launch T4 worker
requests.post("https://apis.fotohub.app/compute/v1/instances", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}, json={"catalog_id": "g4dn.xlarge"})
```

### Cost
$0.20/hr spot. 1000 hours/month at $0.015/min.

---

## 13. Real-time LLM API Gateway

### Architecture Diagram
```mermaid
flowchart TD
    Client --> ALB[Application Load Balancer]
    ALB --> ASG[Auto Scaling Group]
    ASG --> Node1[g5.xlarge - vLLM]
    ASG --> Node2[g5.xlarge - vLLM]
```

### Provisioning Code
```bash
curl -X POST https://apis.fotohub.app/compute/v1/instances \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -d '{"name": "vllm-node", "catalog_id": "g5.xlarge"}'
```

### Cost & Benchmarks
- **Cost:** $0.38/hr
- **Performance:** 800 tokens/s throughput.

---

## 14. Automated Video Dubbing Pipeline

### Architecture Diagram
```mermaid
flowchart LR
    S3[FOTOhub S3 s1.fotohub.app] --> Node[A10G Worker]
    Node --> Whisper[Whisper Transcribe]
    Whisper --> Translate[LLM Translate]
    Translate --> Clone[Voice Clone]
    Clone --> LipSync[LatentSync]
    LipSync --> S3
```

### Setup & API Calls
```python
import requests
# Launch A10G worker
requests.post("https://apis.fotohub.app/compute/v1/instances", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}, json={"catalog_id": "g5.xlarge"})
```

### Expected Costs
$0.08 per minute of processed video.

---

## 15. Synthetic Data Generation

### Architecture Diagram
```mermaid
flowchart TD
    Queue --> Node1[SDXL + ControlNet A10G]
    Queue --> Node2[SDXL + ControlNet A10G]
    Node1 --> S3[s1.fotohub.app]
    Node2 --> S3
```

### Production Considerations
- **Storage:** $0.0245/GB-month on FOTOhub S3. FREE intra-cluster egress.
- **Cost:** $0.00048 per image.

---

## 16. Multi-modal RAG System

### Architecture
```mermaid
flowchart LR
    Doc --> OCR[T4 OCR Node]
    OCR --> Embed[C5 Embedding Node]
    Embed --> VectorDB[(Vector DB)]
    Query --> Embed
    Embed --> VectorDB
    VectorDB --> LLM[A10G Generation Node]
```

### Cost
$0.35/hr total for the micro-cluster.

---

## 17. Autonomous SEO Content Factory

### Architecture
```mermaid
flowchart TD
    Cron --> Agent[FH Claw Agent]
    Agent --> Research[Sandbox Playwright]
    Agent --> Draft[LLM Node]
    Agent --> Image[ComfyUI Node]
    Draft & Image --> Publish[CMS API]
```

### Cost
$2/day fully automated.

---

## 18. 3D Product Asset Pipeline

### Cost Breakdown
- **Compute:** $0.38/hr (A10G)
- **Rate:** 45 seconds per mesh
- **Cost:** $0.012 per 3D model

---

## 19. Real-time Translation & Transcription

### Setup
```python
import requests
# Launch T4 worker
requests.post("https://apis.fotohub.app/compute/v1/instances", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}, json={"catalog_id": "g4dn.xlarge"})
```

### Cost
$0.20/hr spot. 1000 hours/month at $0.015/min.

---

## 13. Real-time LLM API Gateway

### Architecture Diagram
```mermaid
flowchart TD
    Client --> ALB[Application Load Balancer]
    ALB --> ASG[Auto Scaling Group]
    ASG --> Node1[g5.xlarge - vLLM]
    ASG --> Node2[g5.xlarge - vLLM]
```

### Provisioning Code
```bash
curl -X POST https://apis.fotohub.app/compute/v1/instances \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -d '{"name": "vllm-node", "catalog_id": "g5.xlarge"}'
```

### Cost & Benchmarks
- **Cost:** $0.38/hr
- **Performance:** 800 tokens/s throughput.

---

## 14. Automated Video Dubbing Pipeline

### Architecture Diagram
```mermaid
flowchart LR
    S3[FOTOhub S3 s1.fotohub.app] --> Node[A10G Worker]
    Node --> Whisper[Whisper Transcribe]
    Whisper --> Translate[LLM Translate]
    Translate --> Clone[Voice Clone]
    Clone --> LipSync[LatentSync]
    LipSync --> S3
```

### Setup & API Calls
```python
import requests
# Launch A10G worker
requests.post("https://apis.fotohub.app/compute/v1/instances", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}, json={"catalog_id": "g5.xlarge"})
```

### Expected Costs
$0.08 per minute of processed video.

---

## 15. Synthetic Data Generation

### Architecture Diagram
```mermaid
flowchart TD
    Queue --> Node1[SDXL + ControlNet A10G]
    Queue --> Node2[SDXL + ControlNet A10G]
    Node1 --> S3[s1.fotohub.app]
    Node2 --> S3
```

### Production Considerations
- **Storage:** $0.0245/GB-month on FOTOhub S3. FREE intra-cluster egress.
- **Cost:** $0.00048 per image.

---

## 16. Multi-modal RAG System

### Architecture
```mermaid
flowchart LR
    Doc --> OCR[T4 OCR Node]
    OCR --> Embed[C5 Embedding Node]
    Embed --> VectorDB[(Vector DB)]
    Query --> Embed
    Embed --> VectorDB
    VectorDB --> LLM[A10G Generation Node]
```

### Cost
$0.35/hr total for the micro-cluster.

---

## 17. Autonomous SEO Content Factory

### Architecture
```mermaid
flowchart TD
    Cron --> Agent[FH Claw Agent]
    Agent --> Research[Sandbox Playwright]
    Agent --> Draft[LLM Node]
    Agent --> Image[ComfyUI Node]
    Draft & Image --> Publish[CMS API]
```

### Cost
$2/day fully automated.

---

## 18. 3D Product Asset Pipeline

### Cost Breakdown
- **Compute:** $0.38/hr (A10G)
- **Rate:** 45 seconds per mesh
- **Cost:** $0.012 per 3D model

---

## 19. Real-time Translation & Transcription

### Setup
```python
import requests
# Launch T4 worker
requests.post("https://apis.fotohub.app/compute/v1/instances", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}, json={"catalog_id": "g4dn.xlarge"})
```

### Cost
$0.20/hr spot. 1000 hours/month at $0.015/min.

---

## 13. Real-time LLM API Gateway

### Architecture Diagram
```mermaid
flowchart TD
    Client --> ALB[Application Load Balancer]
    ALB --> ASG[Auto Scaling Group]
    ASG --> Node1[g5.xlarge - vLLM]
    ASG --> Node2[g5.xlarge - vLLM]
```

### Provisioning Code
```bash
curl -X POST https://apis.fotohub.app/compute/v1/instances \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -d '{"name": "vllm-node", "catalog_id": "g5.xlarge"}'
```

### Cost & Benchmarks
- **Cost:** $0.38/hr
- **Performance:** 800 tokens/s throughput.

---

## 14. Automated Video Dubbing Pipeline

### Architecture Diagram
```mermaid
flowchart LR
    S3[FOTOhub S3 s1.fotohub.app] --> Node[A10G Worker]
    Node --> Whisper[Whisper Transcribe]
    Whisper --> Translate[LLM Translate]
    Translate --> Clone[Voice Clone]
    Clone --> LipSync[LatentSync]
    LipSync --> S3
```

### Setup & API Calls
```python
import requests
# Launch A10G worker
requests.post("https://apis.fotohub.app/compute/v1/instances", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}, json={"catalog_id": "g5.xlarge"})
```

### Expected Costs
$0.08 per minute of processed video.

---

## 15. Synthetic Data Generation

### Architecture Diagram
```mermaid
flowchart TD
    Queue --> Node1[SDXL + ControlNet A10G]
    Queue --> Node2[SDXL + ControlNet A10G]
    Node1 --> S3[s1.fotohub.app]
    Node2 --> S3
```

### Production Considerations
- **Storage:** $0.0245/GB-month on FOTOhub S3. FREE intra-cluster egress.
- **Cost:** $0.00048 per image.

---

## 16. Multi-modal RAG System

### Architecture
```mermaid
flowchart LR
    Doc --> OCR[T4 OCR Node]
    OCR --> Embed[C5 Embedding Node]
    Embed --> VectorDB[(Vector DB)]
    Query --> Embed
    Embed --> VectorDB
    VectorDB --> LLM[A10G Generation Node]
```

### Cost
$0.35/hr total for the micro-cluster.

---

## 17. Autonomous SEO Content Factory

### Architecture
```mermaid
flowchart TD
    Cron --> Agent[FH Claw Agent]
    Agent --> Research[Sandbox Playwright]
    Agent --> Draft[LLM Node]
    Agent --> Image[ComfyUI Node]
    Draft & Image --> Publish[CMS API]
```

### Cost
$2/day fully automated.

---

## 18. 3D Product Asset Pipeline

### Cost Breakdown
- **Compute:** $0.38/hr (A10G)
- **Rate:** 45 seconds per mesh
- **Cost:** $0.012 per 3D model

---

## 19. Real-time Translation & Transcription

### Setup
```python
import requests
# Launch T4 worker
requests.post("https://apis.fotohub.app/compute/v1/instances", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}, json={"catalog_id": "g4dn.xlarge"})
```

### Cost
$0.20/hr spot. 1000 hours/month at $0.015/min.

---
