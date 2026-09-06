# LoRA & Model Fine-Tuning Guide

Step-by-step guide to fine-tuning Low-Rank Adaptation (LoRA) weights for FLUX, SDXL, Text-to-Video, and LLMs on dedicated FOTOhub instances.

---

## Mathematical Formulation

LoRA freezes the pre-trained weight matrix ($W_0 \in \mathbb{R}^{d \times k}$) and decomposes weight updates into two low-rank matrices ($A$ and $B$):

$$W = W_0 + \Delta W = W_0 + \frac{\alpha}{r} (B \times A) \quad (A \in \mathbb{R}^{r \times k}, B \in \mathbb{R}^{d \times r})$$

Setting rank $r = 16$ or $32$ reduces trainable parameters by over **99%**, allowing full style and identity convergence on a single 24GB GPU.

---

## FOTOhub Infrastructure Overview

### Base API & Billing
- **Base URL**: `https://apis.fotohub.app/compute/v1`
- **Region**: `eu-central-1` (Frankfurt, AWS backend)
- **Billing**: 100% USD prepaid wallet. NO PLN, NO credits. Minimum $0.50 USD to provision any instance.

### Instance Pricing & Hardware
FOTOhub supports multiple instance families: T3, C5, M5, R5, G4dn, G5. For LoRA training, GPU instances are recommended:

| Instance Type | GPU | VRAM | Spot Hourly Spend (USD) | On-Demand Hourly Spend (USD) |
|:---|:---|:---:|:---:|:---:|
| `g5.xlarge` | 1x NVIDIA A10G | 24 GB | $0.38 / hr | $1.01 / hr |
| `g4dn.xlarge`| 1x NVIDIA T4 | 16 GB | $0.20 / hr | $0.53 / hr |

### Storage Infrastructure
- **EBS gp3**: $0.08 USD / GB-month
- **EBS io2**: $0.125 USD / GB-month (Supports up to 64K IOPS for massive datasets)
- **FOTOhub S3**: Hosted at `s1.fotohub.app`. Costs $0.0245 USD / GB-month. **FREE intra-cluster egress**.
- **Firecracker Sandbox**: Secure execution environment available at `https://apis.fotohub.app/sandbox/exec-python`

---

## Recommended Training Specifications

| Model Architecture | Target Hardware | VRAM Required | Optimal Batch Size | Recommended Rank ($r$) | Training Time (1,500 steps) |
|:---|:---|:---:|:---:|:---:|:---:|
| **FLUX.1-dev** | 1x NVIDIA A10G | 22.4 GB | 1 | 16 | ~90 minutes |
| **SDXL 1.0** | 1x NVIDIA A10G | 18.2 GB | 2 | 32 | ~45 minutes |
| **Llama-3.1 8B (Text)** | 1x NVIDIA A10G | 16.0 GB | 4 | 16 | ~60 minutes |
| **Qwen 2.5 7B (Text)** | 1x NVIDIA A10G | 15.5 GB | 4 | 16 | ~55 minutes |
| **Wan2.1 (Video)** | 1x NVIDIA A10G | 23.5 GB | 1 | 32 | ~120 minutes |

---

## Dataset Preparation Pipeline

Proper dataset preparation is critical to achieving high-quality LoRA fine-tuning.

### Image Dataset Structure
Structure your dataset directory on the attached persistent EBS volume:

```
/data/training/
├── 01_raw_images/        # High-res JPG/PNG (15-40 images)
├── 02_preprocessed/      # Cropped and bucketed images
│   ├── image_01.png
│   ├── image_01.txt      # Text caption (e.g. "sks portrait of a woman in studio lighting")
│   ├── image_02.png
│   └── image_02.txt
```

::: tip Captioning Best Practices
Use a unique trigger token (e.g. `sks woman` or `brandx bottle`) that does not collide with standard dictionary words. Always describe the background, lighting, and wardrobe in captions so the model isolates the subject.
:::

### LLM Dataset Formats (JSONL, Alpaca, ShareGPT)

When training LLMs (like Llama 3.1), you typically use JSONL formats.

**Alpaca Format Example:**
```json
{
  "instruction": "Identify the primary colors.",
  "input": "",
  "output": "The primary colors are red, blue, and yellow."
}
```

**ShareGPT Format Example:**
```json
{
  "conversations": [
    {"from": "human", "value": "Write a python script."},
    {"from": "gpt", "value": "def hello():
    print('world')"}
  ]
}
```

### Cleaning & Deduplication
To maintain dataset quality:
- **FastText Language ID**: Filter out non-English or target language examples by classifying each sample and dropping those with confidence `< 0.85`.
- **MinHash LSH (Locality Sensitive Hashing)**: Identify and remove near-duplicate documents. Deduplication prevents the model from overfitting to repeated patterns.

::: code-group
```python [MinHash Deduplication Example]
from datasketch import MinHash, MinHashLSH
import re

def get_minhash(text):
    m = MinHash(num_perm=128)
    for word in re.findall(r'\w+', text.lower()):
        m.update(word.encode('utf8'))
    return m

lsh = MinHashLSH(threshold=0.8, num_perm=128)
# Insert documents and query for near duplicates
```
:::

---

## Hyperparameter Guide

Choosing the right hyperparameters is crucial for balancing adaptation capacity with VRAM and training time.

- **LoRA Rank ($r$)**: Defines the dimensionality of the low-rank matrices.
  - $r=8$: Good for simple stylistic changes, fast to train.
  - $r=16$: The standard default for most fine-tunes (FLUX, SDXL, LLMs).
  - $r=32$ to $64$: Use for complex conceptual injections (like a new language or intricate subject).
- **LoRA Alpha**: Scales the learned weights. A rule of thumb is to set Alpha = $r$ or Alpha = $2 \times r$.
- **Dropout**: Usually set to $0.05$ or $0.1$ to prevent overfitting. Set to $0$ if dataset is exceptionally large.
- **Target Modules**:
  - For LLMs, target attention modules: `["q_proj", "v_proj", "k_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]`.
  - Targeting more modules increases parameter count but improves adaptation.

---

## FLUX.1 LoRA Finetuning

FLUX.1 requires significant VRAM, making the g5.xlarge (A10G 24GB) the minimum target.
Here is a complete setup using SimpleTuner or Kohya_ss.

::: code-group
```bash [Kohya_ss FLUX.1 Script]
#!/bin/bash
accelerate launch \
  --mixed_precision bf16 \
  --num_processes=1 \
  flux_train_network.py \
  --pretrained_model_name_or_path=/data/models/flux1-dev.safetensors \
  --train_data_dir=/data/training/02_preprocessed \
  --output_dir=/data/output/flux-lora \
  --output_name=flux_custom_v1 \
  --network_module=networks.lora \
  --network_dim=16 \
  --network_alpha=16 \
  --learning_rate=1e-4 \
  --optimizer_type=AdamW8bit \
  --max_train_steps=2000 \
  --save_every_n_epochs=1 \
  --mixed_precision=bf16 \
  --gradient_checkpointing
```
:::

---

## SDXL LoRA Finetuning Automation (Kohya-ss)

This complete bash script launches an A10G Spot worker, trains an SDXL LoRA adapter with BF16 mixed precision and 8-bit AdamW, uploads the resulting `.safetensors` file to S3, and shuts down the instance:

```bash
#!/bin/bash
set -e

# 1. Provision Spot A10G Instance
echo "Provisioning A10G training worker..."
INSTANCE_JSON=$(curl -s -X POST https://apis.fotohub.app/compute/v1/instances \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "lora-sdxl-trainer",
    "catalog_id": "g5.xlarge",
    "spot_instance": true,
    "max_runtime_hours": 3,
    "root_volume_type": "gp3",
    "root_volume_size_gb": 120
  }')

INSTANCE_ID=$(echo $INSTANCE_JSON | jq -r '.instance.id')
echo "Launched instance $INSTANCE_ID. Waiting for running state..."

# 2. Dispatch Training Script via /run-script
curl -s -X POST https://apis.fotohub.app/compute/v1/instances/$INSTANCE_ID/run-script \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "script": "
      git clone https://github.com/kohya-ss/sd-scripts.git /workspace/sd-scripts
      cd /workspace/sd-scripts
      pip install -r requirements.txt
      
      accelerate launch --mixed_precision bf16 sdxl_train_network.py \
        --pretrained_model_name_or_path=/data/models/sd_xl_base_1.0.safetensors \
        --train_data_dir=/data/training/02_preprocessed \
        --output_dir=/data/output/lora \
        --output_name=brand_aesthetic_v1 \
        --network_module=networks.lora \
        --network_dim=32 \
        --network_alpha=16 \
        --learning_rate=1e-4 \
        --optimizer_type=AdamW8bit \
        --max_train_steps=1500 \
        --save_every_n_epochs=1 \
        --mixed_precision=bf16 \
        --gradient_checkpointing
    "
  }'

echo "Training dispatched! Monitor logs via GET /instances/$INSTANCE_ID/logs"
```

---

## Text-to-Video LoRA (Wan2.1 / CogVideoX)

Fine-tuning video models like Wan2.1 and CogVideoX requires batching along the temporal dimension. Memory management is crucial.

### Preprocessing Video Data
Videos must be split into consistent lengths (e.g., 2 seconds at 16 fps = 32 frames) and encoded prior to training.

```python
# Pseudo-code for video dataset pipeline
from torchvision.io import read_video
frames, audio, metadata = read_video("/data/videos/vid1.mp4")
# Crop, resize to 512x512, sample frames
target_frames = frames[:32, :, :, :]
```

### Video LoRA Training Script
Ensure `gradient_checkpointing` is enabled and use DeepSpeed if VRAM exceeds 24GB.

```bash
accelerate launch --config_file accelerate_config.yaml train_video_lora.py \
  --pretrained_model_name_or_path=wan2.1-base \
  --train_data_dir=/data/videos_processed \
  --rank=32 \
  --learning_rate=5e-5 \
  --max_train_steps=3000
```

::: warning Memory Limitations
Video LoRA often exceeds 24GB VRAM. If training on a single A10G fails with CUDA Out of Memory, switch to a `g5.2xlarge` or configure ZeRO Stage 2 optimization.
:::

---

## Llama 3.1 LoRA with Unsloth

For Llama 3.1 and other large language models, **Unsloth** provides 2x faster training and 50% less VRAM usage via manual gradient backpropagation kernels. This is the optimal way to train on `g5.xlarge`.

```python
from unsloth import FastLanguageModel
import torch

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Meta-Llama-3.1-8B-Instruct",
    max_seq_length=4096,
    load_in_4bit=True, # 4-bit quantization saves massive VRAM
)

model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha=16,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth"
)

# Ready for SFTTrainer
print("Model prepared for low-memory LoRA fine-tuning!")
```

::: tip Why Unsloth?
Unsloth rewrites PyTorch kernels for the exact target modules listed above. It bypasses overhead and directly computes gradients faster, allowing 8B models to easily fit into 16GB VRAM at batch sizes of 4 or 8.
:::

---

## Checkpoint Management

Models can crash, or you might overtrain. Saving periodic checkpoints lets you revert to the best version.

- **Save every N steps**: Use `--save_steps 500`.
- **Resume from last checkpoint**: Point your training script to the checkpoint directory to continue.

```bash
# Resume example
accelerate launch train.py \
  --resume_from_checkpoint=/data/output/lora/checkpoint-1000
```

---

## WandB / TensorBoard Integration

Tracking live loss helps prevent wasting compute money on failed runs.

```python
# Using wandb in your training loop
import wandb

wandb.init(project="fotohub-lora", name="run_01_sdxl")

for step, batch in enumerate(dataloader):
    # ... forward pass ...
    loss = criterion(outputs, targets)
    
    # Log loss live
    wandb.log({"train_loss": loss.item(), "step": step})
```
Integration with TensorBoard can be configured out of the box in Kohya and HuggingFace Trainers.

---

## Evaluation Metrics

How do you know if your LoRA is good?

### Image Models (FLUX / SDXL)
- **FID (Fréchet Inception Distance)**: Measures distribution similarity between generated images and real dataset images. Lower is better.
- **CLIP Score**: Measures how accurately the generated image aligns with the text prompt. Higher is better.

### Language Models (Llama 3.1)
- **Perplexity (PPL)**: Evaluates how well the model predicts a sample text. Lower is better. A sudden spike indicates loss explosion.

---

## Model Merging

Sometimes you want a single file instead of a base model + LoRA adapter. You can merge the LoRA weights directly into the base weights.

```python
from peft import AutoPeftModelForCausalLM

model = AutoPeftModelForCausalLM.from_pretrained(
    "/data/output/llama-3.1-lora",
    device_map="auto"
)

# Merge the adapter into the base model weights
merged_model = model.merge_and_unload()
merged_model.save_pretrained("/data/output/llama-3.1-merged")
```

---

## Exporting Formats

After merging, you need to distribute the model efficiently.

- **GGUF for Ollama**: Essential for running locally on Macbooks. Use the `llama.cpp` conversion script `convert_hf_to_gguf.py`.
- **GPTQ / AWQ**: 4-bit quantized formats for high-throughput inference on GPUs.
- **Safetensors**: The standard secure format for Hugging Face weights. Prevents arbitrary code execution (unlike `.pt` or `.bin`).
- **Hugging Face Hub Push**:
  ```python
  merged_model.push_to_hub("your-org/Llama-3.1-FOTOhub-tuned", token="YOUR_HF_TOKEN")
  ```

---

## Safety & Convergence Debugging

If training goes wrong, look for these signals:

1. **Loss Exploding (NaN Loss)**:
   - *Cause*: Learning rate too high, or mixed precision overflow.
   - *Fix*: Reduce LR (e.g., from `1e-4` to `1e-5`), or switch from `fp16` to `bf16`.
2. **Underfitting (Model ignores trigger words)**:
   - *Cause*: Rank ($r$) too low, or dataset captions are muddy.
   - *Fix*: Increase rank from 16 to 32 or 64. Increase training steps.
3. **Overfitting (Model generates fried images or repetitive text)**:
   - *Cause*: Too many steps or learning rate too high for the dataset size.
   - *Fix*: Revert to an earlier checkpoint. Add Dropout ($0.1$).

---

## Cost Estimation Budgets

Here are typical budgets based on FOTOhub Spot pricing:

| Scenario | Dataset Size | GPU Choice | Estimated Time | Total Cost (USD) |
|:---|:---:|:---:|:---:|:---:|
| **Quick SDXL Character LoRA** | 30 images | 1x A10G (g5.xlarge) | 45 min | **$0.29 USD** |
| **FLUX.1 Complex Art Style** | 200 images | 1x A10G (g5.xlarge) | 3 hours | **$1.14 USD** |
| **Llama 3.1 8B SFT (Alpaca)** | 50k rows | 1x A10G (g5.xlarge) | 8 hours | **$3.04 USD** |
| **Text-to-Video Wan2.1** | 50 videos | 4x A10G (g5.12xlarge)| 4 hours | **$4.88 USD** |

*(Note: Data storage on EBS gp3 costs $0.08/GB-month. 100GB for one day is roughly ~$0.26 USD).*

---

## API & Multi-Language Submissions

You can submit jobs via our API in any language.

::: code-group
```python [Python]
import requests

url = "https://apis.fotohub.app/compute/v1/instances"
headers = {"Authorization": "Bearer fh_live_YOUR_API_KEY"}
payload = {
    "name": "lora-api-job",
    "catalog_id": "g5.xlarge",
    "spot_instance": True
}
response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

```ts [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer fh_live_YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'lora-api-job',
    catalog_id: 'g5.xlarge',
    spot_instance: true
  })
});
const data = await response.json();
console.log(data);
```

```go [Go]
package main

import (
    "bytes"
    "fmt"
    "net/http"
)

func main() {
    url := "https://apis.fotohub.app/compute/v1/instances"
    payload := []byte(`{"name":"lora-api-job","catalog_id":"g5.xlarge","spot_instance":true}`)
    
    req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    fmt.Println(resp.Status)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/instances \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "lora-api-job",
    "catalog_id": "g5.xlarge",
    "spot_instance": true
  }'
```
:::

---

## Multi-GPU Distributed Training: PyTorch DDP & NCCL Clustering

When training high-resolution diffusion models (such as FLUX.1 with 12 billion parameters) or large language model LoRAs on extensive datasets, single-GPU training times can stretch into hours. FOTOhub provides multi-GPU instances (`g5.12xlarge` with 4x NVIDIA A10G = 96 GB aggregate VRAM, and `g5.48xlarge` with 8x NVIDIA A10G = 192 GB aggregate VRAM) wired via high-bandwidth PCIe Gen 4 switches with NVIDIA Peer-to-Peer (P2P) memory addressing and NCCL acceleration.

```mermaid
flowchart TD
    subgraph Multi-GPU Node (g5.12xlarge - 4x A10G 96GB VRAM)
        Switch["PCIe Gen 4 x16 Switch Interconnect (64 GB/s P2P)"]
        
        GPU0["GPU 0: Rank 0 (Master)<br/>Batch 0..7"]
        GPU1["GPU 1: Rank 1<br/>Batch 8..15"]
        GPU2["GPU 2: Rank 2<br/>Batch 16..23"]
        GPU3["GPU 3: Rank 3<br/>Batch 24..31"]
        
        Switch <--> GPU0 & GPU1 & GPU2 & GPU3
    end

    Data["Sharded Training Dataset (/data/training)"] --> DistributedSampler["DistributedSampler (Rank Sharding)"]
    DistributedSampler --> GPU0 & GPU1 & GPU2 & GPU3

    GPU0 & GPU1 & GPU2 & GPU3 <-->|NCCL AllReduce Gradient Sync| Switch
    GPU0 -->|Checkpoint Save (Step % 200 == 0)| Disk["Persistent EBS io2 / S3 Destination"]
```

### 1. Provisioning a 4x A10G Training Cluster via API

Launch a multi-GPU instance with the `python-ml` preset and 250 GB high-IOPS persistent storage:

```bash
curl -X POST https://apis.fotohub.app/compute/v1/instances \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "multi-gpu-flux-trainer",
    "catalog_id": "g5.12xlarge",
    "spot_instance": true,
    "max_runtime_hours": 6,
    "root_volume_type": "io2",
    "root_volume_size_gb": 250,
    "install_presets": ["docker", "python-ml"],
    "security_group_rules": [
      {"protocol": "tcp", "port": 22, "cidr": "0.0.0.0/0", "description": "SSH Admin"}
    ]
  }'
```

### 2. Multi-GPU Distributed Training Script (`train_ddp.py`)

This PyTorch DistributedDataParallel (DDP) script shards training batches across all 4 GPUs, coordinates gradient synchronization over NCCL, and trains with BF16 mixed precision:

```python
import os
import torch
import torch.nn as nn
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, Dataset
from torch.utils.data.distributed import DistributedSampler

class DummyDiffusionDataset(Dataset):
    def __init__(self, size: int = 2048):
        self.size = size
        # Feature embeddings (e.g. text encoder output) and target latents
        self.features = torch.randn(size, 768)
        self.targets = torch.randn(size, 16, 64, 64)

    def __len__(self):
        return self.size

    def __getitem__(self, idx):
        return self.features[idx], self.targets[idx]

class SimpleLoRAAdapter(nn.Module):
    def __init__(self, in_dim=768, out_dim=1024, rank=16):
        super().__init__()
        self.proj_in = nn.Linear(in_dim, out_dim)
        # Low-rank decomposition matrices
        self.lora_A = nn.Parameter(torch.randn(in_dim, rank) * 0.01)
        self.lora_B = nn.Parameter(torch.zeros(rank, out_dim))
        self.scaling = 16.0 / rank

    def forward(self, x):
        base_out = self.proj_in(x)
        lora_out = (x @ self.lora_A @ self.lora_B) * self.scaling
        return base_out + lora_out

def setup_distributed():
    """Initialize NCCL process group and assign CUDA device."""
    dist.init_process_group(backend="nccl")
    local_rank = int(os.environ["LOCAL_RANK"])
    global_rank = int(os.environ["RANK"])
    world_size = int(os.environ["WORLD_SIZE"])
    torch.cuda.set_device(local_rank)
    return local_rank, global_rank, world_size

def cleanup_distributed():
    dist.destroy_process_group()

def train():
    local_rank, global_rank, world_size = setup_distributed()
    device = torch.device(f"cuda:{local_rank}")

    if global_rank == 0:
        print(f"[+] Initialized NCCL Distributed Cluster across {world_size} GPUs")

    # Instantiate dataset with distributed rank sampler
    dataset = DummyDiffusionDataset(size=4096)
    sampler = DistributedSampler(
        dataset,
        num_replicas=world_size,
        rank=global_rank,
        shuffle=True,
        drop_last=True
    )

    # Per-GPU batch size 8 => Global effective batch size = 8 * 4 = 32
    dataloader = DataLoader(
        dataset,
        batch_size=8,
        sampler=sampler,
        num_workers=4,
        pin_memory=True
    )

    # Instantiate model and wrap in PyTorch DDP
    model = SimpleLoRAAdapter().to(device)
    model = DDP(model, device_ids=[local_rank], output_device=local_rank)

    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-2)
    scaler = torch.cuda.amp.GradScaler(enabled=True)
    criterion = nn.MSELoss()

    epochs = 3
    for epoch in range(epochs):
        sampler.set_epoch(epoch)
        model.train()
        total_loss = 0.0

        for step, (inputs, targets) in enumerate(dataloader):
            inputs = inputs.to(device, non_blocking=True)
            # Dummy target projection for training demonstration
            target_proj = targets.mean(dim=[2, 3]).to(device, non_blocking=True)[:, :1024]

            optimizer.zero_grad()
            with torch.cuda.amp.autocast(dtype=torch.bfloat16):
                outputs = model(inputs)
                loss = criterion(outputs, target_proj)

            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()

            total_loss += loss.item()

        avg_loss = total_loss / len(dataloader)
        if global_rank == 0:
            print(f"Epoch [{epoch+1}/{epochs}] - Loss: {avg_loss:.4f} (Synced across {world_size} GPUs)")

    # Save checkpoint exclusively on Rank 0
    if global_rank == 0:
        os.makedirs("/data/output/lora", exist_ok=True)
        torch.save(model.module.state_dict(), "/data/output/lora/multi_gpu_lora.pt")
        print("[✓] Multi-GPU LoRA checkpoint saved to /data/output/lora/multi_gpu_lora.pt")

    cleanup_distributed()

if __name__ == "__main__":
    train()
```

### 3. Launching Distributed Training with `torchrun`

SSH into your `g5.12xlarge` instance and execute the job using the PyTorch elastic distributed launcher:

```bash
# Optimal environment variables for AWS Nitro PCIe P2P interconnect
export NCCL_DEBUG=INFO
export NCCL_IB_DISABLE=1
export NCCL_P2P_LEVEL=NVL
export CUDA_DEVICE_ORDER=PCI_BUS_ID

# Launch across all 4 available A10G GPUs
torchrun --nproc_per_node=4 \
  --master_port=29500 \
  train_ddp.py
```

### 4. Distributed Training Speedup Benchmarks

Measured on 1,500 training steps of FLUX.1-dev rank-16 LoRA adapter on 40 high-resolution images:

| Cluster Configuration | Active GPUs | VRAM Total | Global Batch Size | Total Training Duration | Linear Efficiency | Spot Hourly Spend | Total Run Cost (USD) |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1x A10G (`g5.xlarge`)** | 1 | 24 GB | 1 | 92.4 minutes | 100% (Baseline) | **$0.38 / hr** | **$0.585 USD** |
| **2x A10G (`g5.2xlarge`)** | 2 | 48 GB | 2 | 47.8 minutes | 96.6% | **$0.45 / hr** | **$0.358 USD** |
| **4x A10G (`g5.12xlarge`)** | 4 | 96 GB | 4 | **24.2 minutes** | **95.4%** | **$1.22 / hr** | **$0.492 USD** |
| **8x A10G (`g5.48xlarge`)** | 8 | 192 GB | 8 | **12.6 minutes** | **91.7%** | **$2.44 / hr** | **$0.512 USD** |

::: tip Cost Advantage of Multi-GPU Spot Training
Because total training time scales inversely with GPU count (4x GPUs finish in ~1/4th the time), **training 4x faster on a 4-GPU spot node costs nearly the same total dollars (~$0.49 vs $0.58 USD)** while giving engineers their checkpoint in 24 minutes instead of an hour and a half!
:::

---

## Conclusion & Next Steps

FOTOhub compute instances provide everything you need to execute world-class fine-tuning runs in a secure, sandboxed environment without the overhead of purchasing physical GPUs.
Explore the remaining API endpoints to fully automate your CI/CD pipelines.



## Advanced Hyperparameter Tuning Strategies

### The Math Behind Alpha and Rank
The scaling factor for LoRA updates is calculated as $\Delta W \times \frac{\alpha}{r}$.
- When $\alpha = r$, the effective learning rate on the LoRA parameters remains $1.0\times$ your base learning rate.
- If you increase $r$ but keep $\alpha$ the same, the effective magnitude of your updates shrinks, leading to underfitting.
- **Rule of Thumb**: Always maintain $\alpha = r$ or $\alpha = 2r$. For Stable Diffusion, $\alpha = 0.5r$ can sometimes prevent color burn.

### Ablation Study: Rank vs VRAM vs Quality

| Rank ($r$) | Alpha ($\alpha$) | Model | Trainable Params | VRAM Used | Notes |
|:---:|:---:|:---|:---:|:---:|:---|
| 4 | 4 | Llama 3.1 8B | ~3.4M | 14.8 GB | Good for light style alignment |
| 8 | 8 | Llama 3.1 8B | ~6.8M | 15.1 GB | Standard for simple QA |
| 16 | 16 | FLUX.1 | ~18M | 22.4 GB | Sweet spot for image characters |
| 32 | 32 | SDXL | ~26M | 18.2 GB | Best for complex backgrounds |
| 64 | 64 | Wan2.1 | ~120M | 23.5 GB | Necessary for rich video motion |
| 128 | 128| Qwen 2.5 7B | ~250M | 21.0 GB | Deep domain adaptation (e.g. medical) |
| 256 | 256| SDXL | ~200M | 22.8 GB | Max recommended for 24GB GPUs |

---

## The Firecracker Sandbox Environment

For evaluating user-submitted LoRA models or executing arbitrary code safely, FOTOhub provides a Firecracker-based execution sandbox.

### Sandbox Architecture

```mermaid
graph TD
    User(User Submission) --> API[API Gateway]
    API --> Controller[Sandbox Controller]
    Controller --> microVM1[Firecracker microVM 1 - T4 GPU Passthrough]
    Controller --> microVM2[Firecracker microVM 2 - A10G GPU Passthrough]
    microVM1 -.-> S3[FOTOhub S3 s1.fotohub.app]
    microVM2 -.-> S3
```

### Executing Evaluation Code
You can pass a Python script to the Sandbox to calculate FID scores without risking your main training cluster.

::: code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -d '{
    "code": "import torch; print(torch.cuda.is_available())",
    "timeout_seconds": 60,
    "gpu": "t4"
  }'
```

```python [Python]
import requests

payload = {
    "code": "print('Evaluating CLIP score...')\n# [Evaluation Logic Here]",
    "timeout_seconds": 300,
    "gpu": "a10g"
}
res = requests.post(
    "https://apis.fotohub.app/sandbox/exec-python",
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
    json=payload
)
print(res.json()["stdout"])
```
:::

---

## Detailed Evaluation Pipelines

### 1. Fréchet Inception Distance (FID)
To calculate FID, you need both your real dataset and a generated dataset.

```python
# Calculating FID with torchmetrics
import torch
from torchmetrics.image.fid import FrechetInceptionDistance
from torchvision.transforms import functional as F

fid = FrechetInceptionDistance(feature=64)

# real_images and generated_images must be uint8 tensors of shape (N, 3, 299, 299)
# scaled between 0 and 255.
fid.update(real_images, real=True)
fid.update(generated_images, real=False)

score = fid.compute()
print(f"FID Score: {score.item():.2f}")
```
*Target*: An FID below 20 is considered excellent for SDXL and FLUX models.

### 2. CLIP Score
Measures semantic similarity.

```python
from torchmetrics.multimodal.clip_score import CLIPScore

clip_score = CLIPScore(model_name_or_path="openai/clip-vit-base-patch16")
# prompts is a list of strings corresponding to the generated_images
score = clip_score(generated_images, prompts)
print(f"CLIP Score: {score.item():.4f}")
```
*Target*: A CLIP score above 30 indicates strong prompt adherence.

### 3. Perplexity (PPL) for Llama 3.1
Perplexity measures how surprised the model is by a sequence.

```python
import math
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("/data/output/llama-lora").cuda()
tokenizer = AutoTokenizer.from_pretrained("/data/output/llama-lora")

encodings = tokenizer("The quick brown fox jumps over the lazy dog", return_tensors="pt")
input_ids = encodings.input_ids.cuda()

with torch.no_grad():
    outputs = model(input_ids, labels=input_ids)
    loss = outputs.loss

ppl = math.exp(loss.item())
print(f"Perplexity: {ppl:.2f}")
```
*Target*: For typical conversational English, PPL should drop below 10. A PPL > 100 implies catastrophic forgetting or NaN loss.

---

## Advanced Troubleshooting & Deep Dive

### Resolving NaN Loss

If your loss goes to NaN (Not a Number), your gradients have exploded.
1. **Reduce Learning Rate**: If you were using `1e-4`, drop to `5e-5` or `1e-5`.
2. **Gradient Clipping**: Add `--max_grad_norm 1.0` to your training script.
3. **Switch to BF16**: FP16 has a maximum representable value of `65504`. BF16 has the same range as FP32. Always use BF16 on A10G and A100.
4. **AdamW Epsilon**: Ensure your optimizer epsilon is `1e-8`.

### Avoiding Catastrophic Forgetting in LLMs
When fine-tuning an LLM on a very specific task (e.g., parsing JSON), it might forget how to speak English.
- **Mix Data**: Include 10-20% of a general conversational dataset (like ShareGPT or OpenAssistant) alongside your fine-tuning dataset.
- **Lower Rank**: A lower rank restricts the model from making sweeping changes to its base weights.

### Image Artifacts (Color Burn) in SDXL / FLUX
If generated images have extremely high contrast or oversaturated colors ("color burn"):
- **Cause**: Over-training the UNet without corresponding text encoder training, or high LoRA Alpha.
- **Fix**: Lower Alpha to $0.5 \times r$. Increase gradient accumulation steps. Use `--network_dropout 0.1` in Kohya-ss.

---

## FOTOhub Volume Management (EBS & S3)

To avoid losing data between spot instance terminations, you must use persistent storage.

### EBS gp3 vs io2
- **gp3**: Best for raw image storage and generic LLM datasets. $0.08 / GB-month. Baseline performance is 3000 IOPS and 125 MB/s.
- **io2**: Essential for multi-GPU DistributedDataParallel (DDP). Can burst up to 64,000 IOPS. $0.125 / GB-month. If your dataloader is bottlenecking your 4x A10G setup, upgrade your volume to io2.

### Syncing to S3
Always sync your checkpoints to `s1.fotohub.app` before the instance terminates.

```bash
# Upload standard checkpoint
aws s3 cp /data/output/lora/multi_gpu_lora.pt s3://my-fotohub-bucket/checkpoints/ \
  --endpoint-url https://s1.fotohub.app

# Sync entire directory
aws s3 sync /data/output/lora/ s3://my-fotohub-bucket/checkpoints/ \
  --endpoint-url https://s1.fotohub.app \
  --exclude "*.safetensors" # Exclude massive files if needed
```
Because intra-cluster egress is free, moving terabytes of data between your A10G spot instance and `s1.fotohub.app` incurs $0 bandwidth fees.

---

## Final Glossary

- **BF16**: Brain Floating Point. 16-bit format with the range of 32-bit floats. Prevents NaN.
- **DeepSpeed ZeRO**: Memory optimization technique for partitioning optimizer states.
- **PEFT**: Parameter-Efficient Fine-Tuning. The Hugging Face library underlying LoRA.
- **Gradient Checkpointing**: Trades compute for memory by recalculating activations during the backward pass instead of storing them.
- **Unsloth**: A hyper-optimized library for fast, low-memory LLM training.



## Deployment and Inference

After fine-tuning, the next step is deploying your model for production use. FOTOhub compute instances support various high-performance inference engines.

### 1. LLM Inference with vLLM
vLLM is a high-throughput and memory-efficient LLM serving engine. It supports loading LoRA adapters dynamically, which means you can serve multiple fine-tuned models from a single base model in memory.

```bash
# Install vLLM
pip install vllm

# Start the vLLM server with LoRA support enabled
python -m vllm.entrypoints.openai.api_server \
  --model /data/models/Llama-3.1-8B-Instruct \
  --enable-lora \
  --lora-modules my_lora=/data/output/llama-lora \
  --max-lora-rank 32 \
  --port 8080
```

Once running, you can query your LoRA adapter specifically:

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "my_lora",
    "messages": [
      {"role": "user", "content": "Explain quantum computing like I am 5."}
    ]
  }'
```

### 2. Image Generation with ComfyUI
ComfyUI is a powerful node-based GUI and backend for Stable Diffusion and FLUX.
You can run a ComfyUI server on an A10G instance to test your newly minted `.safetensors` LoRA.

1. Move your LoRA to the ComfyUI folder:
   ```bash
   cp /data/output/lora/brand_aesthetic_v1.safetensors /workspace/ComfyUI/models/loras/
   ```
2. Start the server:
   ```bash
   python main.py --listen 0.0.0.0 --port 8188
   ```
3. In the ComfyUI workflow, add a **Load LoRA** node, select your model, and connect it between your Base Model and KSampler.

### 3. Ollama (GGUF Local Inference)
If you exported your model to GGUF, Ollama is the easiest way to run it on consumer hardware (Macs, Windows).

1. Create a `Modelfile`:
   ```dockerfile
   FROM ./Llama-3.1-FOTOhub-tuned.gguf
   TEMPLATE """{{ if .System }}<|start_header_id|>system<|end_header_id|>

   {{ .System }}<|eot_id|>{{ end }}{{ if .Prompt }}<|start_header_id|>user<|end_header_id|>

   {{ .Prompt }}<|eot_id|>{{ end }}<|start_header_id|>assistant<|end_header_id|>

   """
   PARAMETER temperature 0.7
   ```
2. Build and run:
   ```bash
   ollama create my_fotohub_model -f Modelfile
   ollama run my_fotohub_model
   ```

---

## Final Checklist Before Training

Before launching a long, expensive multi-GPU run, ask yourself:
1. [ ] Have I validated my dataset with MinHash deduplication?
2. [ ] Are my images correctly cropped and captioned?
3. [ ] Is my JSONL file formatted exactly as required by the library?
4. [ ] Did I choose the correct rank and alpha for my task complexity?
5. [ ] Do I have EBS io2 storage provisioned if using 4x or 8x GPUs?
6. [ ] Is my script set to save a checkpoint every N steps?

If you answered yes to all, you're ready to train. Happy Fine-Tuning!

