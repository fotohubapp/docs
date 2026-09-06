# Self-Hosting LLMs with vLLM, SGLang & Ollama

Comprehensive guide to deploying, optimizing, and productionizing private Large Language Models on dedicated FOTOhub GPU compute.

---

## Why Self-Host LLMs on FOTOhub?

| Evaluation Dimension | Commercial APIs (OpenAI / Anthropic) | Self-Hosted on FOTOhub A10G Spot |
|:---|:---|:---|
| **Data Privacy & GDPR** | Transmitted outside EU; potential logging | **100% Frankfurt (`eu-central-1`); zero egress** |
| **Cost at Scale** | Scales linearly ($2.50 to $15.00 per 1M tokens) | **Flat $0.38 / hr Spot; unlimited token generation** |
| **Latency & Jitter** | Subject to multi-tenant noisy neighbor spikes | **Dedicated GPU silicon with consistent TTFT** |
| **Model Freedom** | Restricted to vendor weights and system prompts | **Load any open checkpoint from Hugging Face** |
| **Structured Output** | JSON modes frequently increase latency | **Native guided decoding via Outlines / SGLang** |

---

## Recommended Model Matrix (A10G 24GB VRAM)

The NVIDIA A10G features 24 GB of GDDR6X VRAM with 600 GB/s bandwidth, optimized for 7B–14B models in FP16 or 14B–32B models in AWQ/GPTQ 4-bit:

| Model Architecture | Parameters | Precision | Memory Footprint | Max Context | Throughput (A10G) |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Qwen 2.5 Instruct** | 7B | BF16 / FP16 | ~15.2 GB | 32,768 | **~78 tok/s** |
| **DeepSeek-R1-Distill-Qwen**| 8B | BF16 / FP16 | ~16.8 GB | 32,768 | **~72 tok/s** |
| **Llama 3.3 Instruct** | 8B | BF16 / FP16 | ~16.4 GB | 32,768 | **~75 tok/s** |
| **Qwen 2.5 Coder** | 14B | AWQ 4-bit | ~10.5 GB | 65,536 | **~64 tok/s** |
| **Qwen 2.5 Instruct** | 32B | AWQ 4-bit | ~21.0 GB | 16,384 | **~38 tok/s** |

---

## Production vLLM Deployment with Systemd

To ensure 24/7 reliability with automatic crash recovery, deploy vLLM as a managed Linux systemd service on your instance:

### 1. Launch Compute Node via API

```bash
curl -X POST https://apis.fotohub.app/compute/v1/instances \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
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

### 2. Systemd Service Unit (`/etc/systemd/system/vllm.service`)

SSH into your instance (`ssh -i worker.pem ubuntu@<IP>`) and configure the service:

```ini
[Unit]
Description=vLLM OpenAI-Compatible LLM Server
After=network.target nvidia-persistenced.service

[Service]
Type=simple
User=ubuntu
Environment="HUGGING_FACE_HUB_TOKEN=hf_..."
ExecStart=/usr/local/bin/python3 -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen2.5-7B-Instruct \
    --gpu-memory-utilization 0.92 \
    --max-model-len 16384 \
    --port 8000 \
    --host 0.0.0.0 \
    --trust-remote-code
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now vllm
```

---

## Enforcing JSON Schema via Guided Decoding (Outlines)

vLLM integrates Outlines regex and JSON schema finite state machines directly into the sampler, guaranteeing 100% schema-valid JSON without hallucinated fields:

```python
from openai import OpenAI
import json

# Connect to instance Elastic IP (e.g. 18.197.82.14) or private VPC endpoint
client = OpenAI(base_url="http://18.197.82.14:8000/v1", api_key="none")

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

## Multi-GPU Tensor Parallelism (g5.12xlarge / 4x A10G)

For models exceeding 24GB (e.g. Llama 3.3 70B AWQ), launch a multi-GPU instance (`g5.12xlarge` with 4x A10G = 96 GB VRAM) and configure tensor parallelism:

```bash
python3 -m vllm.entrypoints.openai.api_server \
    --model casperhansen/llama-3.3-70b-instruct-awq \
    --tensor-parallel-size 4 \
    --gpu-memory-utilization 0.94 \
    --max-model-len 32768
```\n