---
title: Self-Hosting LLMs with vLLM, SGLang, TGI & Ollama
description: Comprehensive guide to deploying, optimizing, and productionizing private Large Language Models on dedicated FOTOhub GPU compute.
---

# Self-Hosting LLMs with vLLM, SGLang, TGI & Ollama

Comprehensive guide to deploying, optimizing, and productionizing private Large Language Models on dedicated FOTOhub GPU compute. This document covers everything from hardware selection to multi-node horizontal scaling, quantization, and structured outputs.

:::info Critical Facts
- **Base URL:** `https://apis.fotohub.app/compute/v1`
- **Billing:** 100% USD prepaid wallet. NO PLN, NO credits. Minimum $0.50 to provision.
- **Auth:** `Authorization: Bearer fh_live_YOUR_API_KEY`
- **Region:** `eu-central-1` (Frankfurt, AWS)
- **FOTOhub S3:** `s1.fotohub.app` ($0.0245/GB-month, FREE intra-cluster egress)
- **EBS gp3:** $0.08/GB-month
- **EBS io2:** $0.125/GB-month up to 64K IOPS
:::

---

## Why Self-Host LLMs on FOTOhub?

When building production AI applications, developers face a critical choice: rely on commercial APIs (like OpenAI or Anthropic) or self-host open-weight models on dedicated GPU hardware. 

Self-hosting on FOTOhub provides unique advantages for high-volume, privacy-sensitive workloads. 

### Comparison Matrix

| Evaluation Dimension | Commercial APIs (OpenAI / Anthropic) | Self-Hosted on FOTOhub |
|:---|:---|:---|
| **Data Privacy & GDPR** | Transmitted outside EU; potential logging | **100% Frankfurt (`eu-central-1`); zero egress** |
| **Cost at Scale** | Scales linearly ($2.50 to $15.00 per 1M tokens) | **Flat $0.38 / hr Spot; unlimited token generation** |
| **Latency & Jitter** | Subject to multi-tenant noisy neighbor spikes | **Dedicated GPU silicon with consistent TTFT** |
| **Model Freedom** | Restricted to vendor weights and system prompts | **Load any open checkpoint from Hugging Face** |
| **Structured Output** | JSON modes frequently increase latency | **Native guided decoding via Outlines / SGLang** |

### Cost Comparison: FOTOhub vs OpenAI vs Anthropic

Let's assume a sustained workload of **100 requests per minute**, with each request containing **2,000 input tokens** and generating **500 output tokens**. Over a 730-hour month, this totals **876M input tokens** and **219M output tokens**.

| Provider / Setup | Monthly Compute/API Cost (USD) | Predictability |
|:---|:---|:---|
| **GPT-4o** ($5/1M in, $15/1M out) | $4,380 + $3,285 = **$7,665 / mo** | Pay-per-token |
| **Claude 3.5 Sonnet** ($3/1M in, $15/1M out) | $2,628 + $3,285 = **$5,913 / mo** | Pay-per-token |
| **GPT-4o-mini** ($0.15/1M in, $0.60/1M out) | $131.40 + $131.40 = **$262.80 / mo** | Pay-per-token |
| **FOTOhub G4dn.xlarge (Spot)** | $0.20/hr * 730 = **$146.00 / mo** | **Fixed Flat Rate** |
| **FOTOhub G4dn.xlarge (On-Demand)**| $0.53/hr * 730 = **$386.90 / mo** | **Fixed Flat Rate** |
| **FOTOhub G5.xlarge (Spot)** | $0.38/hr * 730 = **$277.40 / mo** | **Fixed Flat Rate** |
| **FOTOhub G5.xlarge (On-Demand)** | $1.01/hr * 730 = **$737.30 / mo** | **Fixed Flat Rate** |

:::tip
For sustained, high-throughput applications, self-hosting a highly capable 7B-14B model (like Qwen 2.5) on a FOTOhub GPU can reduce costs by over 90% compared to frontier models, while offering perfectly predictable, flat-rate billing.
:::

---

## FOTOhub Compute Offerings

FOTOhub offers a diverse set of instance families situated in `eu-central-1` to accommodate both AI inference and traditional compute workloads. 

### GPU Instance Families

| Instance | GPU Accelerator | VRAM | Spot Rate | On-Demand Rate | Ideal Use Case |
|:---|:---|:---|:---|:---|:---|
| `g4dn.xlarge` | 1x NVIDIA T4 | 16 GB | **$0.20/hr** | **$0.53/hr** | 7B-8B models, low-cost inference, Whisper |
| `g5.xlarge` | 1x NVIDIA A10G | 24 GB | **$0.38/hr** | **$1.01/hr** | 7B-14B models, high-throughput |
| `g5.2xlarge` | 1x NVIDIA A10G | 24 GB | **$0.4494/hr** | **$1.2025/hr** | 14B-32B models (quantized), mixed workloads |
| `g5.4xlarge` | 1x NVIDIA A10G | 24 GB | **$0.6025/hr** | **$1.6123/hr** | Same single A10G as `g5.xlarge`/`g5.2xlarge` with more vCPU/RAM |

FOTOhub does not offer a multi-GPU instance — every GPU catalog entry, `g4dn` or `g5`, carries
exactly one GPU. A model that doesn't fit in 24 GB on a single A10G needs to be quantized; it
cannot be sharded across GPUs on this platform.

### CPU Instance Families

For load balancing, API gateways, and background processing, you can deploy non-GPU instances:
- **T3** - Burstable general purpose. Good for small load balancers.
- **C5** - Compute optimized. Good for CPU-heavy preprocessing tasks.
- **M5** - General purpose. Balanced memory/CPU ratio.
- **R5** - Memory optimized. Good for massive in-memory databases like Redis for caching LLM outputs.

:::warning Minimum Wallet Balance
All billing is strictly prepaid from your FOTOhub USD wallet. Ensure you have a minimum of **$0.50** to provision any instance. Instances are billed by the second, with a 60-second minimum.
:::

---

## Model Selection Guide

Choosing the right model and GPU combination is crucial for balancing cost, throughput, and capability. A common mistake is selecting a GPU that lacks the VRAM to hold the model weights + the KV cache.

### Which GPU for Which Model Size?

1. **7B - 8B Parameters (e.g., Llama 3.3 8B, Qwen 2.5 7B, Mistral v0.3)**
   - **Recommended:** `g4dn.xlarge` (T4 16GB) or `g5.xlarge` (A10G 24GB)
   - **Notes:** Easily fits in BF16/FP16 without quantization. The A10G (`g5`) will offer significantly higher tokens/sec and lower latency than the T4 (`g4dn`), but the T4 is highly cost-effective for offline batch processing.

2. **13B - 14B Parameters (e.g., Qwen 2.5 Coder 14B, Command R)**
   - **Recommended:** `g5.xlarge` (A10G 24GB)
   - **Notes:** Can fit in FP16 with a smaller context window (e.g. 4k-8k tokens), or run perfectly with 4-bit quantization (AWQ/GPTQ) for massive context windows (up to 65k tokens).

3. **30B - 34B Parameters (e.g., Qwen 2.5 32B, Mixtral 8x7B)**
   - **Recommended:** `g5.2xlarge` (A10G 24GB, higher CPU/RAM)
   - **Notes:** Requires 4-bit or 8-bit quantization to fit within 24GB VRAM. Expect moderate throughput (~30-40 tokens/sec). Mixtral (MoE) is very efficient for its size.

4. **70B+ Parameters (e.g., Llama 3.3 70B, Qwen 2.5 72B)**
   - **Not a fit for this platform today.** FOTOhub has no multi-GPU instance to shard a 70B+
     model across, and even 4-bit quantization of a 70B model (roughly 35-40 GB) does not fit
     in a single A10G's 24 GB. Use a smaller or more aggressively quantized model, or run this
     workload elsewhere.

### Memory & Throughput Matrix (A10G 24GB)

| Model Architecture | Parameters | Precision | Memory Footprint | Max Context | Throughput (A10G) |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Qwen 2.5 Instruct** | 7B | BF16 / FP16 | ~15.2 GB | 32,768 | **~78 tok/s** |
| **DeepSeek-R1-Distill**| 8B | BF16 / FP16 | ~16.8 GB | 32,768 | **~72 tok/s** |
| **Llama 3.3 Instruct** | 8B | BF16 / FP16 | ~16.4 GB | 32,768 | **~75 tok/s** |
| **Qwen 2.5 Coder** | 14B | AWQ 4-bit | ~10.5 GB | 65,536 | **~64 tok/s** |
| **Qwen 2.5 Instruct** | 32B | AWQ 4-bit | ~21.0 GB | 16,384 | **~38 tok/s** |

---

## Storage & Model Weight Caching

Model checkpoints are huge (often 10GB to 50GB+). Downloading them from Hugging Face every time an instance boots is slow, prone to network errors, and consumes bandwidth. FOTOhub provides excellent storage primitives to optimize cold-starts.

### FOTOhub Storage Options

1. **EBS gp3 (General Purpose SSD):** $0.08 / GB-month. Ideal for root volumes and general cache. Provides a baseline of 3,000 IOPS and 125 MB/s throughput.
2. **EBS io2 (Provisioned IOPS SSD):** $0.125 / GB-month. Up to 64K IOPS. Ideal for ultra-fast model loading times during auto-scaling events where you need the weights loaded into VRAM instantly.
3. **FOTOhub S3 (`s1.fotohub.app`):** $0.0245 / GB-month. Object storage for infinite model backups.

:::tip S3 Egress is Free!
Bandwidth between your FOTOhub compute instances and FOTOhub S3 is completely **free**. You can store massive libraries of GGUF/Safetensors in S3 and pull them down rapidly to compute nodes without incurring egress fees.
:::

### Persisting Hugging Face Cache

To avoid re-downloading, mount an EBS volume and set the `HF_HOME` environment variable. When you destroy the compute instance, ensure the EBS volume is detached and saved. When provisioning a new instance, attach the same volume.

```bash
# Assuming /dev/nvme1n1 is your mounted EBS gp3 volume formatted as ext4
sudo mkdir -p /mnt/model-cache
sudo mount /dev/nvme1n1 /mnt/model-cache
sudo chown -R ubuntu:ubuntu /mnt/model-cache

# Tell HuggingFace to use this directory
export HF_HOME=/mnt/model-cache/huggingface
```

---

## Continuous Batching Explained

Traditional LLM serving executes inference in a simple batch (e.g. wait for 10 requests, process them together). This is highly inefficient because if one request is 10 tokens and another is 1000, the GPU sits idle waiting for the 1000-token request to finish.

**Continuous Batching** (pioneered by ORCA and popularized by vLLM and TGI) operates on the token level. As soon as a request finishes generating its final token, a new request is immediately injected into the active batch without waiting for the others to finish. This can improve GPU utilization and total throughput by 10x-20x compared to naive batching.

---

## Complete vLLM Deployment (OpenAI-Compatible API)

[vLLM](https://github.com/vllm-project/vllm) is the industry standard for high-throughput, memory-efficient LLM serving. It features PagedAttention for optimal batching, effectively eliminating KV cache memory fragmentation.

### 1. Launching the Node via API

Here is how you programmatically spin up a G5 spot instance tailored for vLLM:

:::code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/instances   -H "Authorization: Bearer fh_live_YOUR_API_KEY"   -H "Content-Type: application/json"   -d '{
    "name": "vllm-production-gateway",
    "catalog_id": "g5.xlarge",
    "spot_instance": true,
    "max_runtime_hours": 168,
    "root_volume_type": "gp3",
    "root_volume_size_gb": 150,
    "security_group_rules": [
      {"protocol": "tcp", "port": 22, "cidr": "0.0.0.0/0", "description": "SSH"},
      {"protocol": "tcp", "port": 8000, "cidr": "0.0.0.0/0", "description": "vLLM OpenAI API"}
    ]
  }'
```
:::

### 2. Cloud-Init Startup Script

You can automate the installation of vLLM and start the server on boot using a `cloud-init` script. This is the recommended approach for Auto Scaling Groups (ASGs). Pass this YAML string as the `user_data` property in the API call above.

```yaml
#cloud-config
package_update: true
packages:
  - python3-pip
  - python3-venv
  - nvidia-cuda-toolkit
runcmd:
  - runuser -l ubuntu -c 'python3 -m venv ~/vllm-env'
  - runuser -l ubuntu -c '~/vllm-env/bin/pip install vllm openai'
  - runuser -l ubuntu -c 'echo "export PATH=~/vllm-env/bin:$PATH" >> ~/.bashrc'
  # Create systemd service
  - |
    cat << 'EOF' > /etc/systemd/system/vllm.service
    [Unit]
    Description=vLLM OpenAI-Compatible LLM Server
    After=network.target nvidia-persistenced.service
    
    [Service]
    Type=simple
    User=ubuntu
    Environment="HUGGING_FACE_HUB_TOKEN=hf_YOUR_TOKEN"
    ExecStart=/home/ubuntu/vllm-env/bin/python3 -m vllm.entrypoints.openai.api_server         --model Qwen/Qwen2.5-7B-Instruct         --gpu-memory-utilization 0.92         --max-model-len 16384         --port 8000         --host 0.0.0.0         --trust-remote-code
    Restart=always
    RestartSec=5
    
    [Install]
    WantedBy=multi-user.target
    EOF
  - systemctl daemon-reload
  - systemctl enable --now vllm
```

### 3. OpenAI SDK Compatibility (Consuming the API)

Because vLLM provides an exact replica of the OpenAI API schema, you can seamlessly point your existing application code to your FOTOhub instance by simply changing the `base_url` and `api_key`.

:::code-group
```python [Python]
from openai import OpenAI
import os

# Connect to instance Elastic IP or private VPC endpoint
client = OpenAI(
    base_url="http://YOUR_INSTANCE_IP:8000/v1",
    api_key="fotohub-local" # Key is arbitrary unless you setup auth middleware
)

response = client.chat.completions.create(
    model="Qwen/Qwen2.5-7B-Instruct",
    messages=[
        {"role": "system", "content": "You are a highly capable coding assistant."},
        {"role": "user", "content": "Write a python script to reverse a linked list."}
    ],
    temperature=0.7,
    max_tokens=500,
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

```typescript [TypeScript]
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://YOUR_INSTANCE_IP:8000/v1',
  apiKey: 'fotohub-local',
});

async function main() {
  const stream = await client.chat.completions.create({
    model: 'Qwen/Qwen2.5-7B-Instruct',
    messages: [{ role: 'user', content: 'Explain quantum computing in simple terms.' }],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}

main();
```

```go [Go]
package main

import (
	"context"
	"fmt"
	"os"

	"github.com/sashabaranov/go-openai"
)

func main() {
	config := openai.DefaultConfig("fotohub-local")
	config.BaseURL = "http://YOUR_INSTANCE_IP:8000/v1"

	client := openai.NewClientWithConfig(config)
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "Qwen/Qwen2.5-7B-Instruct",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Hello! How are you?",
				},
			},
		},
	)

	if err != nil {
		fmt.Printf("ChatCompletion error: %v
", err)
		return
	}

	fmt.Println(resp.Choices[0].Message.Content)
}
```

```bash [cURL]
curl http://YOUR_INSTANCE_IP:8000/v1/chat/completions   -H "Content-Type: application/json"   -H "Authorization: Bearer fotohub-local"   -d '{
    "model": "Qwen/Qwen2.5-7B-Instruct",
    "messages": [
      {"role": "user", "content": "Tell me a joke."}
    ],
    "temperature": 0.7
  }'
```
:::

---

## Serving Embedding Models with vLLM

vLLM doesn't just serve generation models; it also efficiently serves embedding models for Retrieval-Augmented Generation (RAG) pipelines.

```bash
python3 -m vllm.entrypoints.openai.api_server     --model BAAI/bge-large-en-v1.5     --enforce-eager
```

Client code for embeddings:
```python
from openai import OpenAI
client = OpenAI(base_url="http://YOUR_INSTANCE_IP:8000/v1", api_key="none")

response = client.embeddings.create(
    model="BAAI/bge-large-en-v1.5",
    input=["Machine learning is fascinating.", "I love pizza."]
)
print(response.data[0].embedding)
```

---

## Complete Ollama Setup for Smaller Models

For simple development setups, local agent workloads, or rapid experimentation, [Ollama](https://ollama.com/) provides an incredibly streamlined developer experience, particularly for GGUF formatted models (which are heavily quantized and easy to distribute).

### Installation

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Configuration for External Access

By default, Ollama binds only to `127.0.0.1`. If you want to access it from another service or your local laptop, edit the systemd service:

```bash
sudo sed -i '/Service/a Environment="OLLAMA_HOST=0.0.0.0:11434"' /etc/systemd/system/ollama.service
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

### Running a Model

```bash
# This will automatically pull the weights from the Ollama registry and start the engine
ollama run llama3.1
```

### Client Usage

Ollama also provides OpenAI compatibility out of the box.

:::code-group
```bash [cURL]
curl http://YOUR_INSTANCE_IP:11434/v1/chat/completions     -H "Content-Type: application/json"     -d '{
        "model": "llama3.1",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "user",
                "content": "Why is the sky blue?"
            }
        ]
    }'
```
:::

---

## Complete SGLang Setup for Structured Output

[SGLang](https://github.com/sgl-project/sglang) offers exceptional performance for highly structured outputs (JSON) and complex multi-turn generation workflows. It achieves this by combining a RadixAttention backend (which caches intermediate KV states incredibly well) with an expressive frontend language.

### Installation

```bash
pip install "sglang[all]"
```

### Starting the Server

```bash
python3 -m sglang.launch_server     --model-path meta-llama/Llama-3.1-8B-Instruct     --port 30000     --host 0.0.0.0
```

### Structured Output with SGLang

SGLang allows you to tightly constrain the output token generation to guarantee a specific schema. Because of RadixAttention, if you share prompts across multiple calls, the KV cache is reused perfectly.

```python
import sglang as sgl
from pydantic import BaseModel

class CharacterInfo(BaseModel):
    name: str
    age: int
    occupation: str
    alignment: str

sgl.set_default_backend(sgl.RuntimeEndpoint("http://localhost:30000"))

@sgl.function
def character_gen(s):
    s += sgl.system("You are a creative writer.")
    s += sgl.user("Create a profile for a cyberpunk hacker.")
    # The generation is forced to match the Pydantic schema
    s += sgl.assistant(sgl.gen("character", regex=CharacterInfo.schema_json()))

state = character_gen.run()
print(state["character"]) # Guaranteed to parse as valid JSON matching CharacterInfo
```

---

## Complete TGI (Text Generation Inference) Setup

Hugging Face's [TGI](https://github.com/huggingface/text-generation-inference) is a high-performance alternative to vLLM, heavily optimized for Hugging Face model hub integration, custom continuous batching algorithms, and extensive production telemetry (OpenTelemetry, Prometheus).

### Launching via Docker

TGI is best run via its official Docker container. Ensure you have the NVIDIA Container Toolkit installed on your FOTOhub instance.

```bash
# Share a volume with the Docker container to avoid downloading weights every run
volume=$PWD/data 
model=HuggingFaceH4/zephyr-7b-beta
token=hf_YOUR_HF_TOKEN

docker run --gpus all --shm-size 1g -p 8080:80 -v $volume:/data     -e HUGGING_FACE_HUB_TOKEN=$token     ghcr.io/huggingface/text-generation-inference:2.0     --model-id $model     --max-input-length 4096     --max-total-tokens 8192
```

### Querying the Endpoint

```bash
curl 127.0.0.1:8080/generate     -X POST     -d '{"inputs":"What is Deep Learning?","parameters":{"max_new_tokens":50}}'     -H 'Content-Type: application/json'
```

---

## Quantization Guide: Fitting Big Models on Small GPUs

Quantization reduces the precision of model weights (e.g., from 16-bit floats to 8-bit or 4-bit integers), massively reducing VRAM requirements with minimal, often imperceptible, loss in generation quality.

### 1. AWQ (Activation-aware Weight Quantization)
AWQ is highly recommended for vLLM on A10G/T4 GPUs. It offers excellent throughput and quality retention. Look for `-AWQ` repositories on Hugging Face (e.g., `casperhansen/llama-3-70b-instruct-awq`).
- **vLLM Argument:** `--quantization awq` (often inferred automatically by vLLM based on model config)

### 2. GPTQ
Similar to AWQ, widely supported and well established.
- **vLLM Argument:** `--quantization gptq`

### 3. GGUF
The standard for CPU/Mac inference and Ollama. Less optimal for high-throughput vLLM serving, but universally supported across local engines.

### 4. BitsAndBytes (`load_in_4bit`)
Dynamic quantization during model load. This results in slower inference compared to pre-quantized AWQ/GPTQ weights, but it is incredibly flexible if pre-quantized weights aren't available for a brand new model release.

```python
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
import torch

quantization_config = BitsAndBytesConfig(
    load_in_4bit=True, 
    bnb_4bit_compute_dtype=torch.float16
)

model = AutoModelForCausalLM.from_pretrained(
    "mistralai/Mistral-7B-Instruct-v0.2",
    quantization_config=quantization_config,
    device_map="auto"
)
```

---

## Advanced vLLM Features: LoRA Adapters

If you have fine-tuned a model using LoRA (Low-Rank Adaptation), you don't need to serve a separate instance for every fine-tune. vLLM allows you to serve a single base model and dynamically hot-swap multiple LoRA adapters per-request.

```bash
python3 -m vllm.entrypoints.openai.api_server     --model meta-llama/Llama-2-7b-hf     --enable-lora     --lora-modules sql-adapter=user1/sql-lora chat-adapter=user2/chat-lora
```

Then in your client request, specify the adapter name in the `model` field:
`client.chat.completions.create(model="sql-adapter", ...)`

---

## Guided Decoding & JSON Schema Forcing (Outlines / vLLM)

vLLM integrates Outlines regex and JSON schema finite state machines directly into the sampler. This forces the LLM to only output tokens that match a valid schema, guaranteeing 100% schema-valid JSON without hallucinated fields or missing brackets.

```python
from openai import OpenAI
import json

client = OpenAI(base_url="http://YOUR_INSTANCE_IP:8000/v1", api_key="none")

json_schema = {
    "type": "object",
    "properties": {
        "company_name": {"type": "string"},
        "industry": {"type": "string"},
        "valuation_usd": {"type": "number"},
        "key_competitors": {
            "type": "array",
            "items": {"type": "string"}
        }
    },
    "required": ["company_name", "industry", "valuation_usd", "key_competitors"]
}

response = client.chat.completions.create(
    model="Qwen/Qwen2.5-7B-Instruct",
    messages=[
        {"role": "system", "content": "Extract structured company intelligence."},
        {"role": "user", "content": "Analyze Stripe's core fintech business."}
    ],
    extra_body={
        "guided_json": json_schema
    }
)

print(json.dumps(json.loads(response.choices[0].message.content), indent=2))
```

---

## Benchmarking: Throughput vs Latency

When evaluating your deployment, you must balance throughput (total users served) with latency (time a single user waits). Track these key metrics:

- **TTFT (Time To First Token):** Critical for streaming chat applications (target < 500ms).
- **TPOT (Time Per Output Token):** Determines reading speed (target < 50ms / >20 tok/sec).
- **Total Throughput:** Aggregate tokens per second across all concurrent requests.

Higher batch sizes (more concurrent requests) increase total throughput because the GPU is fully saturated, but they degrade individual TTFT and TPOT.

### Running a Benchmark with vLLM

vLLM includes a built-in benchmarking script. Run this on your FOTOhub instance to determine maximum capacity.

```bash
wget https://raw.githubusercontent.com/vllm-project/vllm/main/benchmarks/benchmark_throughput.py
wget https://huggingface.co/datasets/anon8231489123/ShareGPT_Vicuna_unfiltered/resolve/main/ShareGPT_V3_unfiltered_cleaned_split.json

python3 benchmark_throughput.py     --backend vllm     --dataset ShareGPT_V3_unfiltered_cleaned_split.json     --model Qwen/Qwen2.5-7B-Instruct     --num-prompts 1000
```

---

## Horizontal Scaling & Production Patterns

For true high-availability and scale, a single GPU instance is insufficient. You need an array of workers hidden behind a load balancer.

### Architecture Diagram

```mermaid
graph TD
    Client(Client Applications)
    ALB[Application Load Balancer / NGINX / Kong]
    ASG[Auto Scaling Group]
    
    Node1[FOTOhub g5.xlarge - Node 1<br/>vLLM Server]
    Node2[FOTOhub g5.xlarge - Node 2<br/>vLLM Server]
    Node3[FOTOhub g5.xlarge - Node N<br/>vLLM Server]
    
    S3[(FOTOhub S3<br/>Model Weights Storage)]
    
    Client -->|API Requests| ALB
    ALB -->|Round Robin Load Balancing| Node1
    ALB -->|Round Robin Load Balancing| Node2
    ALB -->|Round Robin Load Balancing| Node3
    
    Node1 -.->|Download Cache / Boot| S3
    Node2 -.->|Download Cache / Boot| S3
    Node3 -.->|Download Cache / Boot| S3
```

### Production Checklist

1. **Health Checks:** vLLM exposes `/health`. Configure your load balancer to route traffic away from instances returning 503s or timeout errors.
2. **Graceful Drain:** Before terminating a spot instance to save costs, send a SIGTERM to vLLM. It will stop accepting new requests, finish processing the current batch in-flight, and then cleanly exit.
3. **Rolling Restarts:** Deploy updates to your ASG using a rolling strategy. Bring up a new instance, wait for `/health` to return 200 (which means model weights are fully loaded into VRAM), then terminate an old instance.
4. **API Gateway Auth:** Never expose vLLM directly to the public internet on port 8000. Always place an API Gateway (like Kong, Traefik, or NGINX) in front of it to enforce API keys, rate limiting, quotas, and IP whitelisting.

### Example NGINX Configuration for Load Balancing

```nginx
upstream vllm_backend {
    server 10.0.1.10:8000 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:8000 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:8000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location /v1/ {
        proxy_pass http://vllm_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Buffer settings for streaming responses (Server-Sent Events)
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }
}
```

---

## Monitoring and Metrics

When running in production, you must monitor GPU utilization, memory usage, and inference metrics.

vLLM automatically exposes a `/metrics` endpoint in Prometheus format. 

Key metrics to monitor:
- `vllm:num_requests_running`: The number of requests currently being processed.
- `vllm:num_requests_waiting`: The number of requests in the queue waiting for capacity. If this number consistently grows, you need to scale horizontally.
- `vllm:gpu_cache_usage_perc`: The percentage of the KV cache currently utilized. If this hits 100%, vLLM will preempt requests.

You can configure Prometheus to scrape this endpoint and build a Grafana dashboard to visualize real-time cluster health.

---

## Troubleshooting & Common Errors

1. **CUDA Out of Memory (OOM):**
   - **Symptom:** Server crashes immediately on startup or when the first request hits.
   - **Fix:** Lower `--gpu-memory-utilization` (e.g. to `0.85`), reduce `--max-model-len`, or use a quantized version of the model.
   
2. **Slow TTFT (Time To First Token):**
   - **Symptom:** Chat bots feel sluggish.
   - **Fix:** Check if your load balancer is buffering the SSE stream (see NGINX config `proxy_buffering off;`). Ensure your batch size isn't so large that it slows down individual requests.

3. **Incomplete Generations:**
   - **Symptom:** JSON generation stops midway.
   - **Fix:** Increase the `max_tokens` passed in the API request payload, or check if the prompt exceeds `--max-model-len`.

---

## FOTOhub Firecracker Sandbox Execution

If your LLM generates code that needs to be executed securely (e.g. a code interpreter agent), do NOT run it directly on your GPU instance or a standard VM. Doing so exposes your infrastructure to malicious behavior.

Instead, run it through a `code.python` node in an Agent Engine workflow — see
[Firecracker Sandboxes](/compute/agent-sandboxes) for the full mechanism. There is no direct
`POST /sandbox/exec-python` endpoint reachable with your API key; it's an internal, proxy-secret
authenticated route the Agent Engine workflow runtime calls on your behalf.

:::warning Security Isolation
The sandbox environment is completely isolated via microVMs (Firecracker). Each execution runs in a pristine environment that is destroyed immediately after completion. There is no inherited network route into your infrastructure or internal VPC from generated code.
:::

---

## Conclusion

Self-hosting on FOTOhub provides the ultimate control over your AI stack. By leveraging spot instances (`g4dn` or `g5`), efficient serving engines like vLLM, and intelligent model selection, you can achieve frontier-level performance at a fraction of the cost of commercial APIs, all while guaranteeing absolute data privacy and predictable flat-rate billing.
