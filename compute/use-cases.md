# Production Blueprints & Real-World Architectures

Battle-tested architectural blueprints showing how high-growth startups, enterprise teams, and AI agencies deploy FOTOhub Dedicated Compute and Ephemeral Sandboxes in production.

---

## The Enterprise Blueprint Matrix

| # | Blueprint Name | Core Stack | Recommended Hardware | Production Cost | Key Business Advantage |
|:---:|:---|:---|:---|:---|:---|
| **1** | **[Private Enterprise LLM Gateway](#1-enterprise-private-llm-gateway)** | vLLM + Qwen 2.5 / DeepSeek | 1x A10G (`g5.xlarge`) Spot | **$0.38 / hr** | EU-hosted endpoint (Frankfurt) with zero vendor token markups |
| **2** | **[High-Volume ComfyUI Render Farm](#2-high-volume-comfyui-render-farm)** | Headless FLUX / SDXL | 3–6x A10G (`g5.xlarge`) Spot, each single-GPU | **$0.00048 / image** | Horizontally-scaled packshot generation at a fraction of commercial image APIs |
| **13**| **[Real-time LLM API Gateway](#13-real-time-llm-api-gateway)** | vLLM + Load Balancer + Auto-Scaling | g5.xlarge behind Load Balancer | **$0.38 / hr** | OpenAI-compatible endpoint for internal teams, horizontally scaled |
| **14**| **[Automated Video Dubbing Pipeline](#14-automated-video-dubbing-pipeline)** | Whisper + Lip-sync | 1x A10G + T4 | **$0.08 / min** | Batch processing videos with zero manual work |
| **15**| **[Synthetic Data Generation](#15-synthetic-data-generation)** | SDXL + ControlNet | 4x A10G Spot (separate single-GPU instances) | **$0.00048 / image** | Fleet-generated images at fractional cost for model training augmentation |
| **16**| **[Multi-modal RAG System](#16-multi-modal-rag-system)** | C5 + Vector Search | c5.2xlarge + g4dn | **$0.35 / hr** | Enterprise document embedding and intelligent search capabilities |
| **17**| **[Autonomous SEO Content Factory](#17-autonomous-seo-content-factory)** | FH Claw + ComfyUI | Agent Compute | **$2 / day** | Fully automated content drafting, image gen, and social publishing |
| **18**| **[3D Product Asset Pipeline](#18-3d-product-asset-pipeline)** | TripoSR + Texture | 1x A10G (`g5.xlarge`) | **$0.012 / mesh** | Product meshes generated automatically from 2D images |
| **19**| **[Real-time Translation & Transcription](#19-real-time-translation-transcription)** | Whisper + NLLB | 1x T4 (`g4dn.xlarge`) | **$0.015 / min** | Multilingual transcription pipeline |

:::info
Blueprints #3–12 referenced in earlier drafts of this matrix (video dubbing farms, LoRA training
factories, sandboxed code interpreters, web scraping fleets, live transcoding, RAG support agents,
voice AI gateways, 3D mesh generation, ad personalization, coding swarms) never had a written body
section — the anchors pointed nowhere. Rather than leave broken links or invent the missing
content, they've been removed from this table. What's below is what was actually written.
:::

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
These numbers are indicative, not measured under a published harness — size your own workload
before committing to a figure.
- **Throughput:** on the order of low-hundreds of tokens/sec aggregate on a single A10G with
  vLLM continuous batching across concurrent streams; per-stream speed drops as concurrency rises.
- **Latency:** low tens of milliseconds Time-To-First-Token (TTFT) at low concurrency.

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

