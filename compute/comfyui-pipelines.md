# Headless ComfyUI Automation & Render Farms

Run scalable, programmatic image and video generation pipelines using headless ComfyUI running on FOTOhub dedicated GPU clusters.

ComfyUI allows complex diffusion graphs (ControlNet, IP-Adapter, LoRA stacking, upscalers, FaceID) to execute deterministically via WebSocket and REST APIs.

:::info
This guide covers everything you need to know about running ComfyUI on FOTOhub, from basic instance provisioning to setting up a parallel render farm with S3 output pipelines.
:::

---

## Critical Platform Facts & Billing

Before you begin, understand the core operational constraints and billing models on FOTOhub:

:::danger BILLING RULES
- **100% USD Prepaid Wallet ONLY**.
- NO PLN or local currencies accepted.
- NO promotional credits are supported for compute usage.
- **Minimum $0.50 USD** wallet balance is required to provision any GPU instance.
:::

### Infrastructure Specifications

* **Base URL**: `https://apis.fotohub.app/compute/v1`
* **Authentication**: `Authorization: Bearer fh_live_YOUR_API_KEY`
* **Region**: `eu-central-1` (AWS Frankfurt Datacenter)
* **Firecracker Sandbox**: internal execution backend behind Agent Engine's `code.python` workflow node — not a public endpoint you call directly (see [Firecracker Sandboxes](/compute/agent-sandboxes)).

### Compute Instances & Pricing

FOTOhub supports multiple instance families (T3, C5, M5, R5, G4dn, G5). For ComfyUI, we recommend the G-series:

| Instance Family | GPU | VRAM | Spot Price (USD/hr) | On-Demand (USD/hr) | Use Case |
|---|---|---|---|---|---|
| **G5.xlarge** | A10G | 24GB | $0.38/hr | $1.01/hr | FLUX.1, SDXL with large batches, AnimateDiff |
| **G4dn.xlarge** | T4 | 16GB | $0.20/hr | $0.53/hr | SD 1.5, SDXL (FP8), Upscaling |

### Storage Pricing

* **FOTOhub S3 Storage** (`s1.fotohub.app`): **$0.0245 / GB-month**. Intra-cluster egress is **100% FREE**.
* **EBS gp3**: **$0.08 / GB-month** (General purpose, recommended for OS and base models)
* **EBS io2**: **$0.125 / GB-month** (High performance, up to 64K IOPS - useful for massive parallel reads)

---

## Architecture of a Headless ComfyUI Node

```mermaid
flowchart LR
    subgraph Client Application
        A["Python / Node Backend"] -->|1. Submit Workflow JSON| B["POST /prompt"]
        A <-->|2. Listen for Node Progress| C["WebSocket ws://{ip}:8188/ws"]
    end

    subgraph FotoHub A10G Compute Instance
        B & C --> D["ComfyUI Server (--listen 0.0.0.0 --port 8188)"]
        D --> E["Execution Queue (Graph Topo-Sort)"]
        E --> F["NVIDIA A10G 24GB VRAM"]
        D <--> G["Persistent Model Storage (/data/models on EBS)"]
        D --> H["Output Artifacts (/workspace/output)"]
    end

    H -->|3. Auto-Sync| I["AWS S3 / Cloudflare R2"]
```

---

## Provisioning a Production ComfyUI Node

Provision an instance with pre-configured NVIDIA drivers, Docker, and the ComfyUI runtime using a robust `cloud-init` startup script:

:::code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/instances   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "name": "comfyui-render-node-01",
    "catalog_id": "g5.xlarge",
    "spot_instance": true,
    "max_runtime_hours": 12,
    "root_volume_type": "gp3",
    "root_volume_size_gb": 150,
    "security_group_rules": [
      {"protocol": "tcp", "port": 22, "cidr": "0.0.0.0/0"},
      {"protocol": "tcp", "port": 8188, "cidr": "0.0.0.0/0"}
    ],
    "startup_script": "#!/bin/bash\napt-get update && apt-get install -y docker.io\nmkdir -p /data/models/{checkpoints,loras,vae,controlnet}\ndocker run -d --gpus all -p 8188:8188 --restart unless-stopped --name comfyui -v /data/models:/workspace/ComfyUI/models yanwk/comfyui-boot:latest"
  }'
```
:::

---

## Model Management & Folder Structure

When building your pipeline, proper model structure is critical. Download models programmatically from the HuggingFace Hub or CivitAI into your EBS volume.

```bash
#!/bin/bash
# Example script to fetch models to /data/models

mkdir -p /data/models/{checkpoints,loras,vae,controlnet,upscale_models,embeddings}

# Download FLUX.1 Schnell from HuggingFace
wget -O /data/models/checkpoints/flux1-schnell.safetensors   https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/flux1-schnell.safetensors

# Download SDXL 1.0 Base
wget -O /data/models/checkpoints/sd_xl_base_1.0.safetensors   https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors

# Download RealESRGAN Upscaler
wget -O /data/models/upscale_models/RealESRGAN_x4plus.pth   https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth
```

---

## Persistent Model Mounting via Detachable EBS

Downloading 20 GB checkpoints (FLUX.1, SDXL, Wan 2.1) on every boot wastes bandwidth and slows down scaling.

:::tip BEST PRACTICE
Use a persistent EBS volume pattern to store models once and reattach them instantly.
:::

1. Attach a secondary **200 GB EBS persistent volume** (`/dev/xvdf`) mounted to `/data/models`.
2. Populate `/data/models/checkpoints/` once.
3. When batch rendering completes, detach the volume (`DELETE /instances/{id}/volumes/{vol_id}`).
4. Terminate the GPU instance ($0.00/hr compute).
5. Attach the existing EBS volume to a new instance the next time you need to generate!

---

## Installing Essential Custom Nodes Programmatically

Add high-performance community nodes to your headless worker during instance boot:

```bash
#!/bin/bash
cd /workspace/ComfyUI/custom_nodes

# 1. ComfyUI Manager
git clone https://github.com/ltdrdata/ComfyUI-Manager.git

# 2. ControlNet Preprocessors & Auxiliaries
git clone https://github.com/Fannovel16/comfyui_controlnet_aux.git
pip install -r comfyui_controlnet_aux/requirements.txt

# 3. IP-Adapter Plus (Face & Style Transfer)
git clone https://github.com/cubiq/ComfyUI_IPAdapter_plus.git

# 4. Impact Pack (Face detailer & bbox segmenter)
git clone https://github.com/ltdrdata/ComfyUI-Impact-Pack.git
cd ComfyUI-Impact-Pack && python install.py && cd ..

# 5. AnimateDiff (Video Generation)
git clone https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved.git

# Restart ComfyUI to reload nodes
docker restart comfyui
```

---

## ComfyUI API Deep Dive

The ComfyUI API centers around two main components:
1. **POST `/prompt`**: Submitting a JSON payload describing the topological graph of the workflow. Returns a `prompt_id`.
2. **WebSocket `/ws?clientId={id}`**: Maintaining a continuous connection to stream `progress`, `executing`, and `executed` events.

---

## Multi-Language API Clients

Here's how to submit and poll jobs via WebSocket in multiple languages:

:::code-group
```python [Python]
import json
import urllib.request
import websocket
import uuid

COMFY_HOST = "18.197.82.14:8188"
CLIENT_ID = str(uuid.uuid4())

def queue_prompt(prompt_workflow: dict):
    payload = json.dumps({"prompt": prompt_workflow, "client_id": CLIENT_ID}).encode("utf-8")
    req = urllib.request.Request(f"http://{COMFY_HOST}/prompt", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def generate_image_and_wait(prompt_workflow: dict, output_filename: str):
    ws = websocket.WebSocket()
    ws.connect(f"ws://{COMFY_HOST}/ws?clientId={CLIENT_ID}")
    
    queued = queue_prompt(prompt_workflow)
    prompt_id = queued["prompt_id"]
    print(f"Queued task {prompt_id}, waiting for execution...")

    while True:
        out = ws.recv()
        if isinstance(out, str):
            message = json.loads(out)
            msg_type = message.get("type")
            
            if msg_type == "progress":
                val = message["data"]["value"]
                max_val = message["data"]["max"]
                print(f"Denoising step: {val}/{max_val} ({int(val/max_val*100)}%)")
                
            elif msg_type == "executed" and message["data"]["node"] is None:
                print("Workflow execution complete!")
                break

    # Fetch output history
    with urllib.request.urlopen(f"http://{COMFY_HOST}/history/{prompt_id}") as resp:
        history = json.loads(resp.read())[prompt_id]
        
    outputs = history["outputs"]
    for node_id in outputs:
        node_output = outputs[node_id]
        if "images" in node_output:
            for image_info in node_output["images"]:
                img_name = image_info["filename"]
                subfolder = image_info["subfolder"]
                img_url = f"http://{COMFY_HOST}/view?filename={img_name}&subfolder={subfolder}&type=output"
                urllib.request.urlretrieve(img_url, output_filename)
                print(f"Saved generated image: {output_filename}")
                return output_filename
```

```typescript [TypeScript]
import WebSocket from 'ws';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const COMFY_HOST = "18.197.82.14:8188";
const CLIENT_ID = uuidv4();

async function queuePrompt(promptWorkflow: any) {
  const res = await fetch(`http://${COMFY_HOST}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: promptWorkflow, client_id: CLIENT_ID })
  });
  return res.json();
}
// Further WebSocket implementation follows same logic...
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func queuePrompt(workflow map[string]interface{}) {
	payload, _ := json.Marshal(map[string]interface{}{
		"prompt":    workflow,
		"client_id": "go-client-123",
	})
	http.Post("http://18.197.82.14:8188/prompt", "application/json", bytes.NewBuffer(payload))
	fmt.Println("Prompt Queued")
}
```
:::

---

## 8 Complete Workflow Examples with JSON Payloads

These JSON payloads can be submitted directly to the `/prompt` endpoint.

### 1. SDXL Text-to-Image
```json
{
  "3": {
    "inputs": {
      "seed": 156680208700286,
      "steps": 20,
      "cfg": 8,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    },
    "class_type": "KSampler"
  },
  "4": {
    "inputs": { "ckpt_name": "sd_xl_base_1.0.safetensors" },
    "class_type": "CheckpointLoaderSimple"
  },
  "5": {
    "inputs": { "width": 1024, "height": 1024, "batch_size": 1 },
    "class_type": "EmptyLatentImage"
  },
  "6": {
    "inputs": { "text": "A beautiful cinematic shot of a cyberpunk city", "clip": ["4", 1] },
    "class_type": "CLIPTextEncode"
  },
  "7": {
    "inputs": { "text": "blurry, low quality, deformed", "clip": ["4", 1] },
    "class_type": "CLIPTextEncode"
  },
  "8": {
    "inputs": { "samples": ["3", 0], "vae": ["4", 2] },
    "class_type": "VAEDecode"
  },
  "9": {
    "inputs": { "filename_prefix": "ComfyUI", "images": ["8", 0] },
    "class_type": "SaveImage"
  }
}
```

### 2. SDXL Img2Img
```json
{
  "10": {
    "inputs": {
      "image": "input_image.jpg",
      "upload": "image"
    },
    "class_type": "LoadImage"
  },
  "11": {
    "inputs": { "pixels": ["10", 0], "vae": ["4", 2] },
    "class_type": "VAEEncode"
  },
  "12": {
    "inputs": {
      "seed": 8493849,
      "steps": 20,
      "cfg": 7,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 0.5,
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["11", 0]
    },
    "class_type": "KSampler"
  }
}
```

### 3. FLUX.1 Schnell
```json
{
  "1": {
    "inputs": {
      "unet_name": "flux1-schnell.safetensors",
      "weight_dtype": "default"
    },
    "class_type": "UNETLoader"
  },
  "2": {
    "inputs": {
      "text": "High quality product photo of a glowing neon cube on a desk",
      "clip": ["3", 0]
    },
    "class_type": "CLIPTextEncode"
  },
  "3": {
    "inputs": {
      "clip_name1": "t5xxl_fp16.safetensors",
      "clip_name2": "clip_l.safetensors",
      "type": "flux"
    },
    "class_type": "DualCLIPLoader"
  },
  "4": {
    "inputs": {
      "seed": 12345,
      "steps": 4,
      "cfg": 1.0,
      "sampler_name": "euler",
      "scheduler": "simple",
      "denoise": 1,
      "model": ["1", 0],
      "positive": ["2", 0],
      "negative": ["5", 0],
      "latent_image": ["6", 0]
    },
    "class_type": "KSampler"
  },
  "5": {
    "inputs": { "text": "", "clip": ["3", 0] },
    "class_type": "CLIPTextEncode"
  },
  "6": {
    "inputs": { "width": 1024, "height": 1024, "batch_size": 1 },
    "class_type": "EmptyLatentImage"
  },
  "7": {
    "inputs": { "vae_name": "ae.safetensors" },
    "class_type": "VAELoader"
  },
  "8": {
    "inputs": { "samples": ["4", 0], "vae": ["7", 0] },
    "class_type": "VAEDecode"
  },
  "9": {
    "inputs": { "filename_prefix": "FluxSchnell", "images": ["8", 0] },
    "class_type": "SaveImage"
  }
}
```

### 4. FLUX.1 Dev + LoRA
```json
{
  "10": {
    "inputs": {
      "lora_name": "my_custom_flux_lora.safetensors",
      "strength_model": 0.8,
      "strength_clip": 0.8,
      "model": ["1", 0],
      "clip": ["3", 0]
    },
    "class_type": "LoraLoader"
  },
  "11": {
    "inputs": {
      "seed": 98765,
      "steps": 20,
      "cfg": 3.5,
      "sampler_name": "euler",
      "scheduler": "sgm_uniform",
      "denoise": 1,
      "model": ["10", 0],
      "positive": ["2", 0],
      "negative": ["5", 0],
      "latent_image": ["6", 0]
    },
    "class_type": "KSampler"
  }
}
```

### 5. ControlNet Depth + Pose
```json
{
  "20": {
    "inputs": { "control_net_name": "control_v11p_sd15_depth.pth" },
    "class_type": "ControlNetLoader"
  },
  "21": {
    "inputs": {
      "strength": 1.0,
      "conditioning": ["6", 0],
      "control_net": ["20", 0],
      "image": ["22", 0]
    },
    "class_type": "ControlNetApply"
  },
  "22": {
    "inputs": { "image": "depth_map.jpg", "upload": "image" },
    "class_type": "LoadImage"
  }
}
```

### 6. IP-Adapter Face Transfer
```json
{
  "30": {
    "inputs": {
      "ipadapter_file": "ip-adapter-plus-face_sdxl_vit-h.safetensors"
    },
    "class_type": "IPAdapterModelLoader"
  },
  "31": {
    "inputs": {
      "weight": 0.8,
      "noise": 0.3,
      "ipadapter": ["30", 0],
      "image": ["32", 0],
      "model": ["4", 0]
    },
    "class_type": "IPAdapterApply"
  },
  "32": {
    "inputs": { "image": "face_reference.jpg", "upload": "image" },
    "class_type": "LoadImage"
  }
}
```

### 7. AnimateDiff Video
```json
{
  "40": {
    "inputs": {
      "model_name": "mm_sd_v15_v2.ckpt",
      "beta_schedule": "sqrt_linear"
    },
    "class_type": "AnimateDiffLoaderV1"
  },
  "41": {
    "inputs": {
      "model": ["4", 0],
      "animate_diff": ["40", 0]
    },
    "class_type": "AnimateDiffApply"
  },
  "42": {
    "inputs": {
      "frame_rate": 8,
      "loop_count": 0,
      "filename_prefix": "AnimateDiff",
      "format": "video/h264-mp4",
      "images": ["8", 0]
    },
    "class_type": "VHS_VideoCombine"
  }
}
```

### 8. Real-ESRGAN 4x Upscale
```json
{
  "50": {
    "inputs": { "model_name": "RealESRGAN_x4plus.pth" },
    "class_type": "UpscaleModelLoader"
  },
  "51": {
    "inputs": { "image": "input_lowres.jpg", "upload": "image" },
    "class_type": "LoadImage"
  },
  "52": {
    "inputs": { "upscale_model": ["50", 0], "image": ["51", 0] },
    "class_type": "ImageUpscaleWithModel"
  },
  "53": {
    "inputs": { "filename_prefix": "Upscaled", "images": ["52", 0] },
    "class_type": "SaveImage"
  }
}
```

---

## Parallel Render Farm Architecture

For production throughput, deploying a single node is insufficient. FOTOhub supports Application Load Balancers (ALB) to distribute inference requests across a fleet of ComfyUI workers.

```mermaid
flowchart TD
    Client["API Gateway / Frontend"] --> ALB["FOTOhub ALB (Round Robin)"]
    ALB --> W1["Worker 1 (G5.xlarge)"]
    ALB --> W2["Worker 2 (G5.xlarge)"]
    ALB --> W3["Worker 3 (G5.xlarge)"]
    ALB --> W4["Worker 4 (G5.xlarge)"]
```

### Provisioning the Render Farm
Scale your cluster by instantiating 4 parallel workers. Since ComfyUI processes requests sequentially per node, load balancing ensures concurrent user requests are served with maximum throughput.

---

## Output Pipeline (S3 + Webhooks)

Never leave output assets on ephemeral worker nodes. Integrate an automatic S3 upload and webhook pipeline:

1. **Save to EBS**: ComfyUI outputs directly to `/workspace/output`.
2. **Upload to FOTOhub S3**: A background chron job or Node script watches the directory and pushes to `s1.fotohub.app`.
3. **Webhook Notification**: Upon successful upload, send a webhook back to your core application.

```python
import boto3
import requests
import os

s3_client = boto3.client('s3', 
    endpoint_url='https://s1.fotohub.app',
    aws_access_key_id=os.environ['FOTOHUB_S3_ACCESS'],
    aws_secret_access_key=os.environ['FOTOHUB_S3_SECRET']
)

def on_image_generated(filepath, job_id):
    filename = os.path.basename(filepath)
    # Upload to FOTOhub S3 (Free Egress from Cluster)
    s3_client.upload_file(filepath, 'render-outputs', filename)
    
    # Fire Webhook
    requests.post('https://your-api.com/webhooks/comfyui', json={
        "job_id": job_id,
        "s3_url": f"https://s1.fotohub.app/render-outputs/{filename}",
        "status": "completed"
    })
```

---

## Cost Breakdown & Economics

Running dedicated ComfyUI hardware on FOTOhub is vastly cheaper than per-image API services if you achieve high utilization.

### SDXL Base (G4dn.xlarge Spot)
* **Instance Cost**: $0.20 / hour
* **Speed**: ~6 seconds per 1024x1024 generation
* **Max Output**: 600 images / hour
* **Cost per Image**: **$0.00033**

### FLUX.1 Dev (G5.xlarge Spot)
* **Instance Cost**: $0.38 / hour
* **Speed**: ~12 seconds per 1024x1024 generation (20 steps)
* **Max Output**: 300 images / hour
* **Cost per Image**: **$0.0012**

### Estimated Monthly Budget (24/7 Render Node)
* **G5.xlarge Spot (730 hours)**: $277.40 / month
* **EBS 200GB (gp3)**: $16.00 / month
* **FOTOhub S3 (100GB)**: $2.45 / month
* **Total**: **~$295.85 / month** for an always-on premium rendering server.

:::tip
Scale instances to zero when your queue is empty to reduce costs. Use our Autoscaling Groups API to trigger node creation when queue depth > 10.
:::
