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
- **Firecracker Sandbox**: internal CPU-only execution backend behind Agent Engine's `code.python` node — see [Firecracker Sandboxes](/compute/agent-sandboxes).

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

:::warning No multi-GPU training
FOTOhub does not offer a multi-GPU instance — every GPU catalog entry (`g4dn.xlarge`,
`g4dn.2xlarge`, `g5.xlarge`, `g5.2xlarge`, `g5.4xlarge`) carries exactly one GPU. There is no
PyTorch DDP / NCCL multi-GPU cluster option here; a training run that needs more than one A10G's
24 GB is not a fit for this platform today — reduce batch size, use gradient accumulation and
checkpointing, or train a smaller/quantized base.
:::

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

For evaluating small scoring scripts (e.g. computing a CLIP/FID score) without risking your
training instance, FOTOhub provides a Firecracker-based execution sandbox — but not as a
directly callable API. It runs through Agent Engine's `code.python` workflow node, is CPU-only
(each microVM gets 2 vCPU / 2048 MiB, no GPU passthrough), and is authenticated internally by a
proxy secret rather than your `fh_live_*` key. See [Firecracker Sandboxes](/compute/agent-sandboxes)
for the real request/response shape and example recipes.

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
- **io2**: For high-IOPS dataloaders reading many small files. Up to 64,000 IOPS (platform cap). $0.125 / GB-month. If your dataloader is bottlenecking your single-GPU training run, upgrade your volume to io2.

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

