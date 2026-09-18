# Cloud Compute & Sandboxes Architecture: The Complete Guide

High-performance GPU instances, elastic CPU clusters, and sub-second Firecracker microVM sandboxes engineered for AI model inference, agent execution, and large-scale data processing.

FOTOhub Compute bridges direct AWS EC2 cloud infrastructure managed by the **Compute Engine** with lightweight multi-tenant virtualization managed by the **Agent Compute Engine**.

---

## 1. Introduction: What is FOTOhub Compute and Who is it For?

FOTOhub Compute is a comprehensive, API-first infrastructure platform designed specifically for modern AI builders, data scientists, and backend engineers. It provides a seamless, programmatically-driven experience for provisioning and managing computational resources, ranging from lightweight Firecracker microVM sandboxes to single-GPU instances (one A10G or T4 per instance) that you scale horizontally behind a load balancer when one GPU isn't enough.

### 1.1 The FOTOhub Compute Philosophy

We believe that developers should have access to the raw power of AWS without the complexity of IAM roles, VPC configurations, and unpredictable billing. FOTOhub Compute gives you the exact same hardware, the exact same reliability, but with a simplified API, an integrated prepaid wallet, and built-in guardrails to prevent surprise bills.

By abstracting away the tedious aspects of cloud infrastructure, we allow you to focus on what matters most: building incredible AI applications, processing massive datasets, and deploying robust backend services.

### 1.2 Target Audience and Use Cases

#### AI/ML Engineers & Researchers
Train, fine-tune, and deploy large language models (LLMs), diffusion models (like Stable Diffusion XL and Flux), and complex computer vision pipelines. Utilize our high-end NVIDIA GPUs (A10G, T4) for unparalleled performance and cost-efficiency.

#### Autonomous Agent Developers
Run autonomous AI agents in secure, isolated environments with sub-200ms cold starts using our Firecracker microVM sandboxes. Perfect for executing untrusted AI-generated code, running evaluation loops, and handling asynchronous tool calls securely.

#### Data Engineers & Big Data Practitioners
Process large datasets, transcode videos, and run massive batch jobs using our scalable CPU clusters. Leverage our Compute (C5), Memory (R5), and General Purpose (M5, T3) families to optimize for your specific data processing bottlenecks.

#### Backend & Full-Stack Developers
Host reliable web services, APIs, microservices, and databases on cost-effective infrastructure. Enjoy built-in storage integrations, networking capabilities, and one-click DNS management to simplify your deployment lifecycle.

### 1.3 Key Platform Capabilities

1. **Diverse Hardware Selection:** Choose from 22 distinct instance types across 6 families (T3, C5, M5, R5, G4dn, G5), ensuring the perfect match for any workload footprint.
2. **Transparent, Predictable Billing:** 100% USD prepaid wallet system. No surprise invoices, no complex credit conversions. You control your exact maximum spend.
3. **Spot Instance Arbitrage:** Leverage unused AWS cloud capacity at massive discounts (up to 70% off on-demand prices) with automated fallback mechanisms. FOTOhub passes spot market prices directly through to you without markups.
4. **Instant Provisioning & Scalability:** Launch fully-configured GPU instances in minutes and Firecracker sandboxes in milliseconds.
5. **Secure by Default:** Every instance is deployed in an isolated security group, featuring KMS-encrypted storage, ephemeral SSH keys, and continuous billing enforcement to protect your wallet and your data.
6. **Seamless Storage Integration:** Attach high-performance EBS volumes (gp3, io2) or stream data directly to/from FOTOhub S3 (at $0.00 intra-cluster egress) or your own external BYOB buckets (AWS, Cloudflare R2, GCP).

---
## 2. High-Level Architecture & Control Plane

The FOTOhub Compute architecture is meticulously designed for global scale, strict security, and ultra-low latency. It consists of multiple interoperating layers, spanning from the developer-facing API down to the physical hardware in our Frankfurt (eu-central-1) data center.

```mermaid
flowchart TD
    subgraph Client Layer ["Client & API Access Layer"]
        direction TB
        A["Developer API / REST Endpoints"]
        B["Console UI (fotohub.app/console)"]
        C["AI Agent System (Claude Opus / DeepSeek)"]
        CLI["FOTOhub CLI Tooling (Python, TS, Go)"]
        SDK["Official SDKs"]
    end

    subgraph Compute Control Plane ["FOTOhub Control Plane (Orchestration & Billing)"]
        direction TB
        D["Compute Engine API - EC2 Management"]
        E["Agent Compute Orchestrator - microVMs"]
        F["Prepaid USD Wallet Billing Engine (Real-time)"]
        DNS["Route53 DNS Manager & Domain Engine"]
        SEC["Security, IAM & Firewall Policy Manager"]
        MTR["Telemetry & Metering Service"]
    end

    subgraph Dedicated Cloud Infrastructure ["AWS eu-central-1 (Frankfurt) Physical Layer"]
        direction TB
        G["EC2 G-Series GPU Fleet (A10G, T4 - Spot & On-Demand)"]
        H["EC2 CPU Fleet (T3, C5, M5, R5)"]
        I["EBS High-Speed Persistent Storage (gp3 / io2)"]
        J["Elastic IPs & Security Group Firewalls"]
        K["CloudWatch Telemetry & Serial Console Output"]
        KMS["AWS KMS Encryption Engine (XTS-AES-256)"]
        VPC["Dedicated Multi-Tenant VPC Subnets"]
    end

    subgraph Lightweight Virtualization Plane ["Agent Virtualization Plane"]
        direction TB
        L["Firecracker microVM Pool (<200ms cold start)"]
        M["vsock Host-Guest Communication Channel (Port 9999)"]
        N["Virtual Workspace Mounts (/data/workspaces/{user_id})"]
        O["Real-Time SSE Event Bus (agent_delta, commentary)"]
        P["Jailbreak Detection & Anomaly Monitoring"]
        SANDBOX["Ephemeral Sandbox Execution Contexts"]
    end

    %% Connections
    A & B & CLI & SDK --> D
    C --> E
    D --> F
    E --> F
    D --> MTR
    E --> MTR
    
    D --> G & H & I & J & K & DNS & KMS & VPC
    E --> L & M & N & O & P & SANDBOX
    
    G & H <--> I
    L <--> N
    
    classDef client fill:#f9f,stroke:#333,stroke-width:2px;
    classDef control fill:#bbf,stroke:#333,stroke-width:2px;
    classDef infra fill:#bfb,stroke:#333,stroke-width:2px;
    classDef virt fill:#fbb,stroke:#333,stroke-width:2px;
    
    class A,B,C,CLI,SDK client;
    class D,E,F,DNS,SEC,MTR control;
    class G,H,I,J,K,KMS,VPC infra;
    class L,M,N,O,P,SANDBOX virt;
```

### 2.1 The Compute Engine (EC2 Abstraction)
The Compute Engine handles the heavy lifting of EC2 provisioning. It interfaces directly with AWS APIs to launch instances, attach EBS volumes, allocate Elastic IPs, and configure Route53 DNS records.

### 2.2 The Agent Compute Orchestrator (MicroVMs)
This orchestrator manages our pool of Firecracker microVMs. It maintains warm pools of stripped-down Linux kernels to guarantee sub-200ms cold starts for ephemeral task execution, making it perfect for rapid AI agent tool calls.

---
## 3. Comprehensive Hardware Specifications & 22-Instance Catalog

All compute instances physically reside in **Frankfurt (`eu-central-1`)** across multiple Availability Zones (`eu-central-1a`, `eu-central-1b`, `eu-central-1c`). This strategic location ensures ultra-low latency connections to European storage, major internet exchanges, and global inference backbones.

:::info Dynamic Pricing Notice
Spot prices fluctuate based on real-time AWS market demand. FOTOhub passes spot market prices directly through to your prepaid USD wallet without any markups. The prices shown below are estimates based on typical market conditions. For exact, real-time pricing, always query the Live Catalog API.
:::

### 3.1 GPU Accelerated Instances (NVIDIA)

Optimized for generative AI inference, PyTorch/LoRA fine-tuning, vLLM inference, ComfyUI pipelines, and 3D rendering. **There are exactly 5 GPU SKUs, and every one carries a single GPU** — `g4dn.2xlarge` is the same one T4 as `g4dn.xlarge` with more vCPU/RAM, and the three `g5` sizes likewise differ only in CPU/RAM around one A10G. There is no multi-GPU instance; a model that doesn't fit in 24 GB needs to be quantized, not sharded.

| Catalog ID | GPU Model | GPUs | VRAM | vCPU | RAM | Bandwidth | On-Demand ($/hr) | Spot ($/hr)* | Best Use Case / Savings |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| `g4dn.xlarge` | NVIDIA T4 | 1 | 16 GB | 4 | 16 GB | Up to 25 Gbps | **$0.5284** | **$0.1975** | Lightweight Inference, SD1.5, Audio Processing (63% savings) |
| `g4dn.2xlarge` | NVIDIA T4 | 1 | 16 GB | 8 | 32 GB | Up to 25 Gbps | **$0.7531** | **$0.2716** | Mid-tier Inference, Data Prep, Whisper Speech-to-Text (64% savings) |
| `g5.xlarge` | NVIDIA A10G | 1 | 24 GB | 4 | 16 GB | Up to 25 Gbps | **$1.0123** | **$0.3827** | **SDXL, ComfyUI, 7B-14B LLM Inference (62% savings)** |
| `g5.2xlarge` | NVIDIA A10G | 1 | 24 GB | 8 | 32 GB | Up to 25 Gbps | **$1.2025** | **$0.4494** | LoRA Training, 14B LLM Fine-tuning (quantized) (63% savings) |
| `g5.4xlarge` | NVIDIA A10G | 1 | 24 GB | 16 | 64 GB | Up to 25 Gbps | **$1.6123** | **$0.6025** | 3D Rendering, Heavy Video Transcoding (63% savings) |

Need more throughput than one GPU can give you? Scale **horizontally** — run several of these
behind a [Load Balancer](/compute/load-balancing-autoscaling) — rather than looking for a bigger
single instance, since none exists.

### 3.2 General Purpose CPU Instances (T3 & M5 Families)

Ideal for backend services, web servers, microservices, development environments, and applications with balanced compute, memory, and networking needs.

| Catalog ID | Family Focus | vCPU | RAM | Bandwidth | On-Demand ($/hr) | Spot ($/hr) | Best Use Case |
|:---|:---|:---|:---|:---|:---|:---|:---|
| `t3.micro` | Burstable | 2 | 1 GB | Up to 5 Gbps | $0.0099 | $0.0025 | Bastion Hosts, Cron Job Runners |
| `t3.small` | Burstable | 2 | 2 GB | Up to 5 Gbps | $0.0198 | $0.0074 | Light Web Servers, API Gateways |
| `t3.medium`| Burstable | 2 | 4 GB | Up to 5 Gbps | $0.0420 | $0.0148 | Dev Environments, Discord Bots |
| `t3.large` | Burstable | 2 | 8 GB | Up to 5 Gbps | $0.0840 | $0.0296 | CI/CD Runners, Testing Servers |
| `t3.xlarge` | Burstable | 4 | 16 GB | Up to 5 Gbps | $0.1679 | $0.0568 | Mid-size CI/CD, General purpose workers |
| `t3.2xlarge`| Burstable | 8 | 32 GB | Up to 5 Gbps | $0.3358 | $0.1136 | Large compile jobs, heavy build servers |
| `m5.large` | Consistent | 2 | 8 GB | Up to 10 Gbps | $0.0963 | $0.0370 | Production Microservices, Small web nodes |
| `m5.xlarge` | Consistent | 4 | 16 GB | Up to 10 Gbps | $0.1926 | $0.0741 | Small Databases, Message Queues (RabbitMQ) |
| `m5.2xlarge`| Consistent | 8 | 32 GB | Up to 10 Gbps | $0.3852 | $0.1432 | High-Traffic Web Applications, Kafka nodes |
| `m5.4xlarge`| Consistent | 16 | 64 GB | Up to 10 Gbps | $0.7704 | $0.2840 | Distributed Data Processing, Cache clusters |

### 3.3 Compute & Memory Optimized Instances (C5 & R5 Families)

Designed for specialized workloads requiring high CPU throughput (C5) or massive memory footprints for in-memory processing (R5).

| Catalog ID | Family Focus | vCPU | RAM | Bandwidth | On-Demand ($/hr) | Spot ($/hr) | Best Use Case |
|:---|:---|:---|:---|:---|:---|:---|:---|
| `c5.large` | Compute | 2 | 4 GB | Up to 10 Gbps | $0.0864 | $0.0321 | Batch Processing, Log Parsing, Web Scrapers |
| `c5.xlarge` | Compute | 4 | 8 GB | Up to 10 Gbps | $0.1704 | $0.0642 | Video Encoding (FFmpeg), CPU Inference |
| `c5.2xlarge` | Compute | 8 | 16 GB | Up to 10 Gbps | $0.3407 | $0.1284 | High-Performance Web Servers, Load Balancers |
| `c5.4xlarge` | Compute | 16 | 32 GB | Up to 10 Gbps | $0.6815 | $0.2543 | Scientific Modeling, Massive Compiling |
| `r5.large` | Memory | 2 | 16 GB | Up to 10 Gbps | $0.1259 | $0.0469 | Redis/Memcached Clusters, Light databases |
| `r5.xlarge` | Memory | 4 | 32 GB | Up to 10 Gbps | $0.2519 | $0.0938 | In-Memory Databases, Search Indices |
| `r5.2xlarge` | Memory | 8 | 64 GB | Up to 10 Gbps | $0.5037 | $0.1901 | Vector Databases (Pinecone/Milvus hosting) |

---
## 4. Querying the Live Catalog API

To retrieve real-time pricing, exact hardware specifications, and availability across zones, always use the Live Catalog API.

```http
GET /compute/v1/catalog
Authorization: Bearer fh_live_YOUR_API_KEY
```

### Response Example

Real, trimmed response for one catalog entry (the full response includes 22 of these, and more
fields than shown here — `boot_image`, `disk_options`, `available_os_images`, `min_tier`, etc.):

```json
{
  "catalog": [
    {
      "id": "755b1e20-ed74-492b-88c3-a84b7a3fa24f",
      "name": "g5.xlarge (A10G)",
      "instance_type": "g5.xlarge",
      "instance_family": "gpu",
      "machine_category": "gpu",
      "vram": "24 GB GDDR6X",
      "cpu_count": 4,
      "ram_gb": 16,
      "network_bandwidth": "Up to 25 Gbps",
      "base_region": "eu-central-1",
      "hourly_rate_usd": 1.0123,
      "spot_price_usd": 0.3827,
      "currency": "USD",
      "availability": "available"
    }
  ]
}
```

::: info Compute is not in the SDKs
The `fotohub` Python and TypeScript packages cover generation, storage and
billing — they have **no Compute namespace and no generic `get()`/`post()`**.
Call `/compute/v1/*` with an ordinary HTTP client, as below.
:::

::: code-group

```python [Python]
import os, requests

BASE = "https://apis.fotohub.app"
HEADERS = {"Authorization": f"Bearer {os.environ['FOTOHUB_API_KEY']}"}

catalog = requests.get(f"{BASE}/compute/v1/catalog", headers=HEADERS, timeout=30).json()

print("Available GPU Instances:")
for item in catalog["catalog"]:
    if item.get("machine_category") == "gpu":
        print(f"[{item['instance_type']}] {item['name']} ({item['vram']})")
        print(f"  Spot Rate: ${item['spot_price_usd']}/hr")
        savings = 100 * (1 - item['spot_price_usd'] / item['hourly_rate_usd'])
        print(f"  Savings vs On-Demand: {savings:.1f}%\n")
```

```typescript [TypeScript]
const BASE = "https://apis.fotohub.app";
const HEADERS = { Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}` };

const data = await fetch(`${BASE}/compute/v1/catalog`, { headers: HEADERS })
  .then((r) => r.json());

console.log("Available GPU Instances:");
data.catalog.forEach((item: any) => {
  if (item.machine_category === "gpu") {
    console.log(`[${item.instance_type}] ${item.name} (${item.vram})`);
    console.log(`  Spot Rate: $${item.spot_price_usd}/hr`);
    const savings = 100 * (1 - item.spot_price_usd / item.hourly_rate_usd);
    console.log(`  Savings vs On-Demand: ${savings.toFixed(1)}%\n`);
  }
});
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/compute/v1/catalog   -H "Authorization: Bearer $FOTOHUB_API_KEY"   | jq '.catalog[] | select(.machine_category == "gpu") | {instance_type, name, spot: .spot_price_usd}'
```

:::

---
## 5. Infrastructure Comparison: FOTOhub vs Alternatives

Why choose FOTOhub Compute over direct AWS access or specialized AI clouds like RunPod and Lambda Labs? We provide the perfect balance of enterprise-grade reliability, transparent pricing, and developer experience.

| Feature / Metric | FOTOhub Compute | AWS Direct | RunPod / Vast | Lambda Labs |
|:---|:---|:---|:---|:---|
| **A10G Spot Rate** | **$0.38 / hr** | ~$0.38 / hr | N/A (Server-grade) | N/A |
| **AWS Cloud Resilience** | **Yes (Tier-1 Datacenter)** | Yes | Variable (Crowdsourced) | Yes (Tier-2) |
| **Sub-200ms Firecracker microVMs**| **Built-in** | AWS Lambda only | No | No |
| **Root SSH Key Injection** | **Automated** | Manual Key Pair | Custom SSH keys | Manual Key Pair |
| **Route53 DNS Integration** | **One-click API** | Complex IAM Setup | No | No |
| **Hot EBS Volume Resize** | **Online (`PUT /volumes`)** | AWS CLI / Console | No (Requires restart)| No |
| **Unified USD Prepaid Wallet** | **Yes (1:1 pass-through)** | Enterprise Invoicing | Credit Card | Card / Credits |
| **Automatic Safety Shutdown** | **Hard `max_runtime_hours`** | Manual CloudWatch Alarms | Manual | Manual |
| **Provisioning Speed** | **< 60 seconds** | Minutes | Seconds to Minutes | Minutes (if available) |
| **Minimum Spend Requirements** | **$0.50 per instance** | None (but infinite risk) | Variable | Hourly minimums |
| **Security Groups / Firewalls** | **API-Driven, Strict Default**| Complex VPC Setup | Basic Port Mapping | Basic Port Mapping |

### 5.1 The FOTOhub Advantage

FOTOhub acts as an intelligent abstraction layer over AWS infrastructure. You get the raw power, reliability, and security of AWS without the DevOps overhead of managing VPCs, IAM roles, and complex billing alarms. Our transparent pass-through pricing on Spot instances means you pay exactly what AWS charges, funded directly from your prepaid wallet. No markup, no hidden fees.

---
## 6. Quick Start in 5 Minutes

Launch a GPU instance, retrieve your ephemeral SSH key, and connect to it in under 5 minutes.

### 6.1 Prerequisites
- A FOTOhub Account with a positive USD Wallet balance (Minimum **$0.50 USD** required to provision).
- An API Key (starts with `fh_live_`).

### 6.2 Step 1: Provision an Instance

We will launch a `g5.xlarge` instance using Spot pricing to maximize savings. We'll set an auto-stop hour to prevent runaway costs.

::: code-group

```python [Python]
import os
import requests
import time
import sys

API_KEY = os.environ.get("FOTOHUB_API_KEY")
if not API_KEY:
    print("Please set FOTOHUB_API_KEY environment variable")
    sys.exit(1)

HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
BASE_URL = "https://apis.fotohub.app/compute/v1"

# 1. Request a new instance
payload = {
    "instance_type": "g5.xlarge",
    "market_type": "spot",
    "disk_size_gb": 100,
    "image_id": "ubuntu-22.04-gpu-optimized",
    "auto_stop_hours": 4  # Prevent runaway costs! Automatically stops after 4 hours.
}

print("Initiating provisioning request...")
response = requests.post(f"{BASE_URL}/instances", json=payload, headers=HEADERS)
response.raise_for_status()

instance = response.json()
instance_id = instance["id"]

print(f"Successfully requested instance. ID: {instance_id}")
print("Polling for running state...")

# 2. Poll until running
while True:
    status_resp = requests.get(f"{BASE_URL}/instances/{instance_id}", headers=HEADERS).json()
    state = status_resp["state"]
    print(f"Current Status: {state}")
    
    if state == "running":
        ip_address = status_resp["public_ip"]
        print(f"\n✅ Instance is fully running!")
        print(f"Public IP Address: {ip_address}")
        break
    elif state in ["failed", "terminated"]:
        print("\n❌ Provisioning failed or instance was terminated early.")
        sys.exit(1)
        
    time.sleep(5)
```

```typescript [TypeScript]
import axios from 'axios';

const API_KEY = process.env.FOTOHUB_API_KEY;
if (!API_KEY) {
  console.error("Please set FOTOHUB_API_KEY environment variable");
  process.exit(1);
}

const HEADERS = { Authorization: `Bearer ${API_KEY}` };
const BASE_URL = 'https://apis.fotohub.app/compute/v1';

async function launchInstance() {
  try {
    console.log("Initiating provisioning request...");
    // 1. Request instance
    const { data: instance } = await axios.post(`${BASE_URL}/instances`, {
      instance_type: 'g5.xlarge',
      market_type: 'spot',
      disk_size_gb: 100,
      image_id: 'ubuntu-22.04-gpu-optimized',
      auto_stop_hours: 4
    }, { headers: HEADERS });
    
    console.log(`Successfully requested instance. ID: ${instance.id}`);
    console.log("Polling for running state...");
    
    // 2. Poll status
    let state = 'pending';
    let ipAddress = '';
    
    while (state !== 'running') {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const { data: status } = await axios.get(`${BASE_URL}/instances/${instance.id}`, { headers: HEADERS });
      state = status.state;
      console.log(`Current Status: ${state}`);
      
      if (state === 'failed' || state === 'terminated') {
        throw new Error('Provisioning failed or instance was terminated early.');
      }
      ipAddress = status.public_ip;
    }
    
    console.log(`\n✅ Instance is fully running!`);
    console.log(`Public IP Address: ${ipAddress}`);
  } catch (error) {
    console.error("Error launching instance:", error.message);
  }
}

launchInstance();
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"time"
)

func main() {
	apiKey := os.Getenv("FOTOHUB_API_KEY")
	if apiKey == "" {
		fmt.Println("Please set FOTOHUB_API_KEY environment variable")
		os.Exit(1)
	}
	baseURL := "https://apis.fotohub.app/compute/v1"

	payload := map[string]interface{}{
		"instance_type":   "g5.xlarge",
		"market_type":     "spot",
		"disk_size_gb":    100,
		"image_id":        "ubuntu-22.04-gpu-optimized",
		"auto_stop_hours": 4,
	}
	jsonPayload, _ := json.Marshal(payload)

	fmt.Println("Initiating provisioning request...")
	req, _ := http.NewRequest("POST", baseURL+"/instances", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil { panic(err) }
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)

	instanceID := result["id"].(string)
	fmt.Printf("Successfully requested instance. ID: %s\n", instanceID)
	fmt.Println("Polling for running state...")

	for {
		req, _ = http.NewRequest("GET", baseURL+"/instances/"+instanceID, nil)
		req.Header.Set("Authorization", "Bearer "+apiKey)
		resp, _ = client.Do(req)
		
		body, _ = ioutil.ReadAll(resp.Body)
		resp.Body.Close()
		
		var status map[string]interface{}
		json.Unmarshal(body, &status)
		
		state := status["state"].(string)
		fmt.Printf("Current Status: %s\n", state)
		
		if state == "running" {
			fmt.Println("\n✅ Instance is fully running!")
			fmt.Printf("Public IP Address: %s\n", status["public_ip"].(string))
			break
		} else if state == "failed" || state == "terminated" {
			fmt.Println("\n❌ Provisioning failed or instance was terminated early.")
			os.Exit(1)
		}
		time.Sleep(5 * time.Second)
	}
}
```

```bash [cURL]
# 1. Provision Instance
curl -s -X POST https://apis.fotohub.app/compute/v1/instances   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "instance_type": "g5.xlarge",
    "market_type": "spot",
    "disk_size_gb": 100,
    "image_id": "ubuntu-22.04-gpu-optimized",
    "auto_stop_hours": 4
  }' | jq .

# Note the ID returned, e.g., {"id": "inst_1234567890", "state": "pending", ...}

# 2. Poll Status (Run this until state is "running")
curl -s -X GET https://apis.fotohub.app/compute/v1/instances/inst_1234567890   -H "Authorization: Bearer $FOTOHUB_API_KEY" | jq '{state: .state, public_ip: .public_ip}'
```

:::

### 6.3 Step 2: Retrieve Ephemeral SSH Key and Connect

Once the instance reaches the `running` state, you must retrieve the ephemeral SSH key to access it. FOTOhub does not use static key pairs.

:::warning Critical Security Notice
For security reasons, **this key can only be downloaded exactly once**. If you lose the key or close the terminal before saving it, you will need to terminate the instance and provision a new one. The API will permanently delete the private key from memory immediately after you download it.
:::

::: code-group

```bash [cURL]
# Download the private key securely and save it
curl -s -X POST https://apis.fotohub.app/compute/v1/instances/inst_1234567890/ssh-key   -H "Authorization: Bearer $FOTOHUB_API_KEY"   | jq -r .private_key > ~/.ssh/fotohub_inst_1234567890.pem

# Set stringent read-only permissions (required by SSH clients)
chmod 400 ~/.ssh/fotohub_inst_1234567890.pem

# Connect to the instance using the 'ubuntu' user
ssh -i ~/.ssh/fotohub_inst_1234567890.pem ubuntu@<PUBLIC_IP_ADDRESS>
```
:::

---
## 7. Billing & USD Wallet Deep Dive

FOTOhub operates entirely on a **prepaid USD wallet system**. This ensures you never receive an unexpected bill at the end of the month. 

**Important Note:** We do not support credits, promotional tokens, or alternative currencies (NO PLN, NO EUR). All transactions, billing metrics, and api charges are settled exclusively in USD.

### 7.1 The Billing Lifecycle Flow

```mermaid
stateDiagram-v2
    [*] --> CheckBalance: API Provision Request (POST /instances)
    CheckBalance --> Reject: Balance < $0.50 USD
    CheckBalance --> Provision: Balance >= $0.50 USD
    
    Provision --> Running: Instance Booted Successfully
    Running --> Metering: Continuous check (Every 60 seconds)
    
    Metering --> DeductFunds: Calculate Cost (Uptime * Rate)
    DeductFunds --> LowBalanceWarning: Balance drops below $5.00 USD
    DeductFunds --> Running: Balance Healthy (> $5.00 USD)
    
    LowBalanceWarning --> NotifyUser: Send Email / Trigger Webhook
    LowBalanceWarning --> AutoStop: Balance reaches <= $0.00 USD
    
    AutoStop --> Stopped: Instance Gracefully Halted (Data saved to EBS)
    Stopped --> Terminated: 7 days inactive or Manual Delete request
    Terminated --> [*]: All Resources Released
```

### 7.2 Key Billing Rules & Enforcements

- **Minimum Provisioning Balance:** You must have at least **$0.50 USD** in your wallet to provision a new instance or sandbox. API requests will fail with a `402 Payment Required` if you are below this threshold.
- **Per-Second Billing Granularity:** Instances are billed per second, with a minimum charge of 60 seconds per boot cycle.
- **Spot Pricing Pass-Through:** If AWS Spot prices fluctuate during your workload, your hourly rate fluctuates accordingly. We do not mark up spot prices. You pay exactly what AWS charges.
- **Auto-Stop on Zero Balance:** If your wallet hits exactly $0.00 USD, running instances are immediately and gracefully halted (`ec2.stop_instance`). 
  - *Note:* Attached EBS volumes remain intact after a stop. They will continue to incur minimal storage costs. If your balance remains negative, volumes will be deleted after 7 days.
- **EBS Storage Costs:** Persistent storage is billed regardless of whether the attached instance is running or stopped.
- **Network Egress (Bandwidth):**
  - **Inbound traffic:** Free ($0.00/GB).
  - **Outbound to Public Internet:** $0.09/GB.
  - **Outbound to FOTOhub S3 (`s1.fotohub.app`):** **Free ($0.00/GB)**.

:::danger Best Practice: Prevent Runaway Costs
Always utilize the `auto_stop_hours` or `max_runtime_hours` parameters when provisioning instances via the API. This hard limit prevents instances from running indefinitely if you forget to shut them down, safeguarding your wallet balance.
:::

---
## 8. Security Model Deep Dive

Security is a foundational pillar of FOTOhub Compute. We operate under the assumption that instances will be running untrusted AI code, experimental models, or handling sensitive corporate datasets.

### 8.1 Multi-Layered Perimeter Defense

1. **Isolated Security Groups (VPC Isolation):** 
   - Every user operates within an isolated subnet context. Your instances cannot communicate with other tenants' instances on the local network.
   - By default, newly provisioned instances are locked down. Only Port 22 (SSH) is open to the internet.
   - To expose a web service (e.g., ComfyUI on 8188, vLLM on 8000, Jupyter on 8888), you must explicitly use the FOTOhub Firewall API (`POST /compute/v1/firewall/rules`) to open specific ports.
2. **KMS-Encrypted Disk Storage:**
   - All root EBS volumes and dynamically attached secondary volumes are encrypted at rest using AWS KMS (Key Management Service).
   - We utilize the industry standard XTS-AES-256 block cipher encryption.
   - Volumes cannot be detached and read by unauthorized AWS accounts or even by FOTOhub support staff.
3. **Automated Ephemeral SSH Keys:**
   - We completely eliminate the need for static IAM key pairs.
   - During instance boot, FOTOhub injects a dynamically generated, KMS-encrypted SSH public key into the guest OS.
   - The private key is held in memory by the API and can only be downloaded exactly once by the authenticated user who created the instance.
4. **Metadata Service Protection:**
   - Instances are strictly shielded from accessing sensitive AWS Instance Metadata Service (IMDSv2) endpoints. This prevents SSRF (Server-Side Request Forgery) attacks from leaking underlying cloud credentials.
5. **Continuous Billing Enforcement:**
   - Financial security is just as important. Instances are continuously metered against your available USD balance. If your balance is exhausted, instances are gracefully stopped rather than incurring massive runaway debt.

---

## 9. Integrated Storage & Data Pipelines

Compute is only half the equation; moving multi-gigabyte models, massive datasets, and high-resolution video quickly is crucial for AI workloads. FOTOhub Compute is tightly integrated with our persistent block and object storage hierarchy.

```mermaid
flowchart LR
    subgraph Compute Node
        direction TB
        A["EC2 GPU Instance (eu-central-1)"]
        RAM["System RAM / GPU VRAM"]
    end
    
    subgraph Block Storage
        direction TB
        B["EBS gp3 Persistent Volumes"]
        B2["EBS io2 High-IOPS Volumes"]
    end
    
    subgraph Object Storage
        direction TB
        C["FOTOhub S3 (s1.fotohub.app)"]
        D["BYOB External Destinations"]
        E["AWS S3 / Cloudflare R2 / GCS / Supabase"]
    end
    
    A <-->|NVMe PCI-e (Ultra-Low Latency)| B
    A <-->|NVMe PCI-e (Ultra-Low Latency)| B2
    A <-->|Zero Egress API (High Throughput)| C
    A -->|Direct Stream| D
    D --> E
    
    style A fill:#f96,stroke:#333,stroke-width:2px
    style B fill:#69f,stroke:#333,stroke-width:2px
    style B2 fill:#69f,stroke:#333,stroke-width:2px
    style C fill:#9f6,stroke:#333,stroke-width:2px
    style D fill:#ccc,stroke:#333,stroke-width:2px
    style E fill:#fcc,stroke:#333,stroke-width:2px
```

### 9.1 Elastic Block Store (EBS) Persistent Volumes

Attach persistent NVMe disks up to 4 TB for storing persistent model weights (e.g., `/data/models`), large training datasets, or maintaining state across instance reboots.

- **`gp3` (General Purpose):** $0.08/GB-month. Delivers a solid baseline performance of 3,000 IOPS and 125 MB/s throughput, scalable up to 1,000 MB/s. Best for standard ML training, model caching, and typical web workloads.
- **`io2` (Provisioned IOPS):** $0.125/GB-month. Designed for mission-critical, latency-sensitive databases and high-throughput streaming. Scales up to a massive 64,000 IOPS and 1,000 MB/s throughput.

:::tip Hot Volume Resizing
You can dynamically increase the size of an attached volume without stopping your instance or unmounting the drive. Simply use the `PUT /compute/v1/volumes/{id}` API to expand capacity on the fly.
:::

### 9.2 FOTOhub S3 Cloud Storage

Our native, fully S3-compatible managed object storage located in the Frankfurt region.

- **Pricing:** Flat **$0.0245/GB-month**.
- **Bandwidth:** **$0.00 intra-cluster egress**. Transferring terabytes of data between FOTOhub S3 and FOTOhub Compute instances is completely free and exceptionally fast, as traffic never leaves the datacenter.
- **Endpoint:** `https://s1.fotohub.app`
- **Use Case:** Storing thousands of generated images, maintaining a library of LoRA weights, or backing up processed datasets.

### 9.3 Bring Your Own Bucket (BYOB) Destinations

If your architecture relies heavily on external storage, you can stream outputs (rendered images, video edits, 3D files) directly from your compute instances into external buckets across AWS S3, Cloudflare R2, Google Cloud Storage, or Supabase. Check our [Delivery to Your Bucket Guide](/guides/bucket-delivery) for step-by-step connection tutorials.

---
## 10. Firecracker Sandboxes (Agent Compute)

For workloads requiring instantaneous startup and strict isolation—such as executing AI-generated Python code, evaluating agent steps, or running serverless functions—we provide highly optimized Firecracker microVMs.

### 10.1 Sandbox Architecture

Firecracker provides the strict security of hardware virtualization (KVM) combined with the speed and agility of container execution.
- **Cold Start Time:** Sub-200 milliseconds.
- **Isolation:** Full hardware-level kernel isolation per workload. No shared kernels.
- **Communication:** Host-Guest communication is handled securely over `vsock` (Port 9999), bypassing standard networking stacks for improved latency and security.

### 10.2 API Endpoint & Sandbox Billing

You can execute arbitrary code inside a clean Python environment instantly:

```http
POST https://apis.fotohub.app/sandbox/exec-python
Authorization: Bearer fh_live_YOUR_API_KEY
```

**Sandbox Billing:** Extremely cost-effective. Executions are billed strictly from your USD wallet at approximately **$0.00008 per run**, based precisely on the milliseconds of compute time used.

---

## 11. Common Use Cases and Reference Patterns

### 11.1 Large Language Model (LLM) Inference (vLLM / TGI)
Deploy models like Llama-3 8B, Mistral, or Qwen that fit in 24 GB.
- **Hardware Profile:** `g5.xlarge` (A10G) for 7B-14B models, quantized as needed. For higher
  concurrency throughput, run several `g5.xlarge` instances behind a
  [Load Balancer](/compute/load-balancing-autoscaling) rather than a bigger instance — there is
  no multi-GPU tier, so a 70B-class model is not a fit for this platform.
- **Architectural Pattern:** 
  1. Boot instance via API.
  2. Attach a persistent EBS volume containing pre-downloaded weights mounted at `/data/models`.
  3. Start the vLLM docker container exposing port 8000.
  4. Use the Firewall API to open port 8000.
  5. Map a custom domain via the Route53 DNS manager for easy access.

### 11.2 Image Generation (ComfyUI / Stable Diffusion / Flux)
Run automated render farms or host multi-user UI instances for designers.
- **Hardware Profile:** `g5.xlarge` (A10G 24GB VRAM) is the gold standard for SDXL and Flux models requiring high VRAM. `g4dn.xlarge` (T4 16GB) is incredibly cost-effective for SD 1.5 pipelines.
- **Architectural Pattern:** 
  1. Use a custom AMI pre-configured with CUDA drivers and ComfyUI.
  2. Start instance on Spot pricing to maximize margins.
  3. Queue API requests to the instance.
  4. Stream generated images directly to FOTOhub S3 using BYOB Destinations.

### 11.3 Machine Learning Training & LoRA Fine-tuning
- **Hardware Profile:** `g5.2xlarge` or `g5.4xlarge`.
- **Architectural Pattern:** 
  1. Provision instance via API.
  2. Attach high-IOPS `io2` volume for rapid dataset streaming and checkpoint saving.
  3. Execute training script.
  4. Push final LoRA checkpoints to FOTOhub S3.
  5. Instance Auto-Stops after `max_runtime_hours` to ensure you aren't billed if the script crashes.

### 11.4 CPU Batch Processing & Video Transcoding
- **Hardware Profile:** `c5.4xlarge` (16 vCPU) or `m5.4xlarge`.
- **Architectural Pattern:** 
  1. Spin up a cluster of 10-20 Spot instances via API.
  2. Instances pull jobs from an SQS or RabbitMQ queue.
  3. Process FFmpeg transcoding locally.
  4. Upload finished assets to Cloudflare R2 via BYOB endpoints.
  5. Terminate instance locally (`sudo shutdown now`) which signals the FOTOhub API to stop billing.

---

## 12. Frequently Asked Questions (FAQ)

### 1. Do you offer free credits for new users?
No. To maintain system stability, guarantee performance, and prevent widespread abuse (like crypto-mining botnets), FOTOhub Compute operates strictly on a prepaid USD system. You must add at least $0.50 from a valid payment method to begin provisioning.

### 2. Can I pay in EUR, PLN, or Crypto?
No. The FOTOhub wallet only accepts and denominates balances in United States Dollars (USD). We do not support local currencies like Polish Zloty (PLN) or Euros, nor do we accept cryptocurrency payments. All APIs and billing systems expect USD.

### 3. What happens if AWS terminates my Spot Instance?
Spot instances can be reclaimed by AWS if the market price spikes or capacity drops. If this occurs, FOTOhub will immediately emit a termination event via the SSE Event Bus. You will only be billed for the exact seconds the instance was running. We highly recommend designing your pipelines to be stateless and checkpointing models frequently to EBS or S3 to gracefully handle interruptions.

### 4. Can I SSH into a Firecracker Sandbox?
No. Sandboxes are entirely ephemeral and designed for single-execution API calls (`/sandbox/exec-python`). They are destroyed immediately after the code execution finishes. For interactive shell access, you must provision a standard EC2 instance like a T3 or G4dn.

### 5. How do I open port 80 or 443 for my web server?
By default, only port 22 is open to the internet. You must use the Security Groups API (`POST /compute/v1/firewall/rules`) to explicitly open port 80 (HTTP), port 443 (HTTPS), or any other custom port for your specific instance ID.

### 6. Are my EBS volumes deleted when I terminate an instance?
By default, root operating system volumes are deleted on instance termination, while secondary attached volumes (where you should store data) are retained. You can modify this behavior using the `delete_on_termination` flag during provisioning or volume attachment.

### 7. Can I reserve instances for long-term discounts?
Currently, FOTOhub Compute offers On-Demand and Spot pricing. Long-term reservations (1-year or 3-year commits) are handled on a case-by-case basis for Enterprise customers only. Please contact support if you are interested in enterprise commits.

### 8. What operating systems are supported?
We currently support highly optimized AMIs based on Ubuntu 22.04 LTS, Ubuntu 20.04 LTS, and Amazon Linux 2023. These AMIs come pre-installed with the necessary NVIDIA drivers and CUDA toolkits. Custom AMIs and Windows Server are not supported at this time.

### 9. Do you offer multi-GPU instances (e.g. `g5.12xlarge`, `g5.48xlarge`)?
No. The catalog has exactly 5 GPU SKUs and every one is single-GPU (one A10G or one T4). If your
model doesn't fit in 24 GB, quantize it; if you need more aggregate throughput, run several
single-GPU instances behind a [Load Balancer](/compute/load-balancing-autoscaling) instead of
looking for a bigger box.

### 10. How is network egress billed?
Data transferred out of FOTOhub to the public internet costs $0.09/GB. Data transferred internally to other FOTOhub instances or directly to FOTOhub S3 (`s1.fotohub.app`) within the Frankfurt region is entirely free ($0.00/GB).

### 11. Is there a cold start penalty for GPU instances?
Yes. Unlike Firecracker sandboxes which boot in milliseconds, standard EC2 GPU instances require time to allocate hardware, boot the OS, and initialize drivers. Expect a provisioning and boot time of roughly 60 to 120 seconds before the instance is reachable via SSH.

### 12. Can I change my instance type later?
No. Instance types are fixed at creation. If you need a more powerful instance, you should take a snapshot of your EBS volume, provision a new instance of the desired type, and attach the snapshot.

---

## 13. What's Next? Further Reading & API References

Ready to start building? Dive deeper into specific topics with our comprehensive sub-pages and API references:

- **[GPU Rental & Instance Lifecycle](/compute/gpu-rental):** Detailed REST API references for starting, stopping, restarting, monitoring, and terminating EC2 instances programmatically.
- **[Volumes & Persistent Storage](/compute/volumes-storage):** Learn how to create, attach, format, mount, and snapshot EBS gp3/io2 volumes to ensure data durability.
- **[Networking, DNS & Security Groups](/compute/networking-dns):** A deep dive into managing inbound/outbound rules, understanding VPC contexts, and securing your applications.
- **[FOTOhub S3 Integration](/api/storage):** Comprehensive guide on using the FOTOhub S3-compatible API for zero-egress data storage and retrieval.
- **[BYOB Destinations](/api/destinations):** Step-by-step instructions for configuring external buckets (AWS, Cloudflare, GCS) for automatic data routing and output streaming.
- **[Firecracker microVM Sandboxes](/compute/agent-sandboxes):** Full documentation on the sub-200ms Python execution environment, including limitations, package support, and payload formatting.
- **[Wallet & Billing API](/api/billing):** Learn how to programmatically check your USD balances, view transaction history, and handle low-balance webhook alerts in your application.


---

## 14. Troubleshooting & Best Practices

When building production-grade AI applications on FOTOhub Compute, you may encounter edge cases or operational challenges. This section provides detailed troubleshooting steps and architectural best practices.

### 14.1 Common Error Codes

- **`402 Payment Required`**: Your USD wallet balance has fallen below the required $0.50 minimum to provision a new instance. Top up your wallet in the Console UI.
- **`403 Forbidden`**: Your API key is invalid, revoked, or lacks the necessary permissions to execute this action. Check your API key prefix (ensure it starts with `fh_live_`).
- **`404 Not Found`**: The requested instance ID or volume ID does not exist, or it has been permanently terminated and purged from the system.
- **`429 Too Many Requests`**: You are hitting the API rate limit (default is 100 requests per minute). Implement exponential backoff in your client code.
- **`503 Service Unavailable`**: The specific Availability Zone is experiencing a capacity constraint for the requested instance type (common with Spot GPUs during peak hours). Try provisioning in a different zone or using a different instance family.

### 14.2 Best Practices for Spot Instances

Spot instances offer incredible savings (up to 70%), but they come with the caveat of potential interruption. 

1. **Stateless Design:** Architect your applications to be as stateless as possible. Store all critical data and model weights on attached EBS volumes, not the root volume.
2. **Frequent Checkpointing:** If you are running long training jobs, implement a checkpointing mechanism that saves progress to an EBS volume or FOTOhub S3 every few minutes.
3. **Automated Retries:** Wrap your provisioning logic in a retry block. If an instance is terminated by AWS, your system should automatically request a replacement.
4. **Graceful Shutdown Handling:** Listen to the SSE Event Bus for the `spot_interruption_warning` event. You typically have 2 minutes to save state and unmount drives before the instance is forcibly shut down.

### 14.3 Monitoring and Telemetry

While FOTOhub handles the underlying infrastructure, monitoring your application's health remains crucial.

- **CPU and RAM Utilization:** Install `htop` or `glances` for real-time monitoring. For programmatic monitoring, install the Datadog or Prometheus agent.
- **GPU Utilization:** Use `nvidia-smi` to monitor VRAM usage, GPU temperature, and power draw. For continuous monitoring, the `dcgm-exporter` is highly recommended for exporting metrics to Prometheus.
- **Log Management:** Do not store massive log files on the root volume. Stream your logs directly to FOTOhub S3, CloudWatch, or a third-party service like Datadog to ensure they survive instance termination.

### 14.4 Performance Optimization Tips

- **Maximize Storage Throughput:** If your workload is highly I/O bound (e.g., streaming massive datasets during training), always opt for `io2` Provisioned IOPS volumes rather than `gp3`.
- **Pre-bake Custom AMIs:** If you find yourself repeatedly installing the same dependencies (PyTorch, vLLM, ComfyUI nodes) on boot, consider creating a custom AMI snapshot. This will drastically reduce your instance boot time from several minutes to under 60 seconds.
- **Leverage FOTOhub S3:** Avoid downloading large model weights from the public internet (HuggingFace, Civitai) on every boot. Download them once, store them in FOTOhub S3, and pull them across our ultra-fast internal network for $0.00 egress cost.

---

## 15. Compliance and Data Residency

FOTOhub Compute operates out of the **AWS eu-central-1 (Frankfurt)** region. This ensures strict compliance with European data protection regulations, including the GDPR. 

By default, all data written to attached EBS volumes or FOTOhub S3 remains physically within the Frankfurt region. We do not replicate your data across regions without your explicit API request. 

FOTOhub does not hold a SOC 2 attestation and does not sign BAAs for HIPAA today, so if your
compliance programme requires either, this is not yet the right platform for that workload.
What we can evidence is the concrete part: the region data is processed in, the append-only
audit trail, and per-key scoping. Talk to us about those rather than about a certificate we
do not have.

