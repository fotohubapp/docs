# Cloud Compute & Sandboxes Architecture

High-performance GPU instances, elastic CPU clusters, and sub-second Firecracker microVM sandboxes engineered for AI model inference, agent execution, and large-scale data processing.

FOTOhub Compute bridges direct AWS EC2 cloud infrastructure managed by the **Compute Engine** (`server/compute-engine/` on port 8801) with lightweight multi-tenant virtualization managed by the **Agent Compute Engine** (`server/agent-compute/` on port 8795).

---

## High-Level Architecture

```mermaid
flowchart TD
    subgraph Client Layer
        A["Developer API / SDK (Python, TS, Go)"]
        B["Console UI (fotohub.app/console)"]
        C["AI Agent System (Claude Opus / DeepSeek)"]
    end

    subgraph Compute Control Plane
        D["Compute Engine API (Port 8801)"]
        E["Agent Compute Orchestrator (Port 8795)"]
        F["Prepaid USD Wallet Billing Engine"]
        DNS["Route53 DNS Manager & Domain Engine"]
    end

    subgraph Dedicated Cloud Infrastructure (AWS eu-central-1)
        G["EC2 A10G / T4 GPU Fleet (On-Demand & Spot)"]
        H["EC2 General / Memory / Compute CPU Fleet"]
        I["EBS High-Speed Persistent Storage (gp3 / io2)"]
        J["Elastic IPs & Security Group Firewalls"]
        K["CloudWatch Telemetry & Serial Console Output"]
    end

    subgraph Lightweight Virtualization Plane
        L["Firecracker microVM Pool (<200ms cold start)"]
        M["vsock Host-Guest Communication Channel (Port 9999)"]
        N["Virtual Workspace Mounts (/data/workspaces/{user_id})"]
        O["Real-Time SSE Event Bus (agent_delta, commentary)"]
    end

    A & B --> D
    C --> E
    D --> F
    D --> G & H & I & J & K & DNS
    E --> L & M & N & O
```

---

## Hardware Specifications & Instance Catalog

All compute instances physically reside in **Frankfurt (`eu-central-1`)** across multiple Availability Zones (`eu-central-1a`, `eu-central-1b`, `eu-central-1c`) with ultra-low latency connections to European storage and inference backbones.

### GPU Accelerated Instances

Optimized for generative AI, PyTorch model training, vLLM inference, and ComfyUI pipelines:

| Catalog ID | GPU Model | VRAM | vCPU | System RAM | Network Bandwidth | On-Demand (USD/hr) | Spot Price (USD/hr)* | Savings |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| `g4dn.xlarge` | 1x NVIDIA T4 | 16 GB GDDR6 | 4 | 16 GB | Up to 25 Gbps | **$0.53** | **$0.20** | **62%** |
| `g4dn.2xlarge` | 1x NVIDIA T4 | 16 GB GDDR6 | 8 | 32 GB | Up to 25 Gbps | **$0.75** | **$0.27** | **64%** |
| `g5.xlarge` | 1x NVIDIA A10G | 24 GB GDDR6X | 4 | 16 GB | Up to 25 Gbps | **$1.01** | **$0.38** | **62%** |
| `g5.2xlarge` | 1x NVIDIA A10G | 24 GB GDDR6X | 8 | 32 GB | Up to 25 Gbps | **$1.20** | **$0.45** | **63%** |
| `g5.4xlarge` | 1x NVIDIA A10G | 24 GB GDDR6X | 16 | 64 GB | Up to 25 Gbps | **$1.61** | **$0.60** | **63%** |

*\*Spot prices reflect dynamic market rates in eu-central-1. FOTOhub passes spot market prices directly through to your prepaid USD wallet without markups.*

### General Purpose & High-Performance CPU Instances

| Family | Catalog ID Range | Specs Range | On-Demand (USD/hr) | Spot (USD/hr) | Ideal Use Cases |
|:---|:---|:---|:---|:---|:---|
| **t3** (Burstable) | `t3.micro` → `t3.2xlarge` | 2–8 vCPU, 1–32 GB RAM | $0.010 – $0.336 | $0.003 – $0.114 | Development, light test workers, CI/CD runners |
| **c5** (Compute) | `c5.large` → `c5.4xlarge` | 2–16 vCPU, 4–32 GB RAM | $0.086 – $0.682 | $0.032 – $0.254 | Video transcoding, batch rendering, CPU inference |
| **m5** (Standard) | `m5.large` → `m5.4xlarge` | 2–16 vCPU, 8–64 GB RAM | $0.096 – $0.770 | $0.037 – $0.284 | Backend microservices, distributed queues, data pipelines |
| **r5** (Memory) | `r5.large` → `r5.2xlarge` | 2–8 vCPU, 16–64 GB RAM | $0.126 – $0.504 | $0.047 – $0.190 | In-memory caching, vector search indices, large databases |

---

## Querying the Live Catalog API

Retrieve real-time pricing, hardware specifications, and availability across zones:

```http
GET /compute/v1/catalog
```

### Response Example

```json
{
  "catalog": [
    {
      "id": "g5.xlarge",
      "family": "g5",
      "gpu": {
        "model": "NVIDIA A10G",
        "count": 1,
        "vram_gb": 24,
        "cuda_cores": 9216,
        "tensor_cores": 288
      },
      "cpu": {
        "cores": 4,
        "arch": "x86_64",
        "model": "AMD EPYC 7R32"
      },
      "memory_gb": 16,
      "network_bandwidth_gbps": 25,
      "pricing": {
        "currency": "USD",
        "on_demand_hourly": 1.012,
        "spot_hourly": 0.383,
        "spot_savings_percent": 62.1
      },
      "available_zones": ["eu-central-1a", "eu-central-1b"]
    }
  ]
}
```

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub()
catalog = client.get("/compute/v1/catalog")

for item in catalog["catalog"]:
    if item.get("gpu"):
        print(f"{item['id']}: {item['gpu']['model']} ({item['gpu']['vram_gb']}GB) - Spot: ${item['pricing']['spot_hourly']}/hr")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub();
const { data } = await client.get("/compute/v1/catalog");

data.catalog.forEach((item: any) => {
  if (item.gpu) {
    console.log(`${item.id} -> ${item.gpu.model} | Spot: $${item.pricing.spot_hourly}/hr`);
  }
});
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/compute/v1/catalog   -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

:::

---

## Infrastructure Comparison: FOTOhub vs Alternatives

| Feature | FOTOhub Compute | AWS Direct | RunPod / Vast | Lambda Labs |
|:---|:---|:---|:---|:---|
| **A10G Spot Rate** | **$0.38 / hr** | ~$0.38 / hr | N/A (Server-grade) | N/A |
| **AWS Cloud Resilience** | **Yes (Tier-1 Datacenter)** | Yes | Variable (Crowdsourced) | Yes |
| **Sub-200ms Firecracker microVMs**| **Built-in** | AWS Lambda only | No | No |
| **Root SSH Key Injection** | **Automated** | Manual Key Pair | Custom SSH keys | Manual Key Pair |
| **Route53 DNS Integration** | **One-click API** | Complex IAM Setup | No | No |
| **Hot EBS Volume Resize** | **Online (`PUT /volumes`)** | AWS CLI / Console | No | No |
| **Unified USD Prepaid Wallet** | **Yes (1:1 pass-through)** | Enterprise Invoicing | Credit Card | Card / Credits |
| **Automatic Safety Shutdown** | **Hard `max_runtime_hours`** | Manual CloudWatch Alarms | Manual | Manual |

---

## Security Model & Network Isolation

Every customer instance is deployed into dedicated network spaces with multi-layered perimeter security:
1. **Isolated Security Groups**: Newly created instances only open port 22 (SSH) by default. Custom ports (e.g. 8188 for ComfyUI, 8000 for vLLM) require explicit firewall rules.
2. **KMS-Encrypted Disk Storage**: Root and attached EBS volumes use XTS-AES-256 encryption at rest.
3. **Automated SSH Ephemeral Keys**: Private keys are generated dynamically during provisioning, encrypted via KMS, and downloadable once via authenticated API.
4. **Prepaid Wallet Continuous Enforcement**: Instances are continuously metered against your available USD balance. If your balance is exhausted, instances are gracefully stopped (`ec2.stop_instance`) rather than incurring runaway debt.
