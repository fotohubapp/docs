# LoRA & Model Fine-Tuning Guide

Step-by-step guide to fine-tuning Low-Rank Adaptation (LoRA) weights for FLUX, SDXL, and LLMs on dedicated FOTOhub A10G instances.

---

## Mathematical Formulation

LoRA freezes the pre-trained weight matrix ($W_0 \in \mathbb{R}^{d \times k}$) and decomposes weight updates into two low-rank matrices ($A$ and $B$):

$$W = W_0 + \Delta W = W_0 + \frac{\alpha}{r} (B \times A) \quad (A \in \mathbb{R}^{r \times k}, B \in \mathbb{R}^{d \times r})$$

Setting rank $r = 16$ or $32$ reduces trainable parameters by over **99%**, allowing full style and identity convergence on a single 24GB GPU.

---

## Recommended Training Specifications

| Model Architecture | Target Hardware | VRAM Required | Optimal Batch Size | Recommended Rank ($r$) | Training Time (1,500 steps) |
|:---|:---|:---:|:---:|:---:|:---:|
| **FLUX.1-dev** | 1x NVIDIA A10G | 22.4 GB | 1 | 16 | ~90 minutes |
| **SDXL 1.0** | 1x NVIDIA A10G | 18.2 GB | 2 | 32 | ~45 minutes |
| **Llama-3.3 8B (Text)** | 1x NVIDIA A10G | 16.0 GB | 4 | 16 | ~60 minutes |
| **Qwen 2.5 7B (Text)** | 1x NVIDIA A10G | 15.5 GB | 4 | 16 | ~55 minutes |

---

## Dataset Preparation Checklist

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

---

## End-to-End Automation Script (Kohya-ss)

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

## Fine-Tuning LLMs with Unsloth

For language models, **Unsloth** provides 2x faster training and 70% less VRAM usage via manual gradient backpropagation kernels:

```python
from unsloth import FastLanguageModel
import torch

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Qwen2.5-7B-Instruct",
    max_seq_length=4096,
    load_in_4bit=True,
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
```\n