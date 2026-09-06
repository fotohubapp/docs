# CLI & Infrastructure as Code (Terraform & Boto3)

Manage FOTOhub Compute and Sandboxes programmatically through the official command-line interface (`fotohubapp-cli`), Terraform HCL definitions, and the Python SDK.

---

## 1. FOTOhub Command-Line Interface (CLI)

Install the global CLI via npm or binary package:

```bash
npm install -g fotohubapp-cli
```

### Authentication
```bash
fotohub auth login --key fh_live_...
```

### Compute CLI Commands

```bash
# 1. View live instance catalog and spot pricing
fotohub compute catalog

# 2. Launch an A10G Spot GPU instance with Docker preset
fotohub compute launch \
  --name "vllm-node-01" \
  --type "g5.xlarge" \
  --spot \
  --disk 120 \
  --preset docker \
  --runtime 12

# 3. List active instances
fotohub compute list

# 4. Connect via SSH (auto-downloads KMS ephemeral key)
fotohub compute ssh vllm-node-01

# 5. Execute command directly over SSH tunnel
fotohub compute ssh vllm-node-01 -- "nvidia-smi"

# 6. Stop instance to preserve disk state
fotohub compute stop vllm-node-01

# 7. Permanently terminate instance
fotohub compute terminate vllm-node-01
```

---

## 2. Terraform Infrastructure as Code (IaC)

Manage FOTOhub Compute instances alongside your existing cloud infrastructure using standard Terraform HCL:

```hcl
terraform {
  required_providers {
    fotohub = {
      source  = "fotohubapp/fotohub"
      version = "~> 1.2.0"
    }
  }
}

provider "fotohub" {
  api_key = var.fotohub_api_key
}

# Dedicated GPU Worker
resource "fotohub_compute_instance" "ml_worker" {
  name                = "production-comfyui-worker"
  catalog_id          = "g5.xlarge"
  spot_instance       = true
  max_runtime_hours   = 72
  root_volume_type    = "gp3"
  root_volume_size_gb = 150

  install_presets = [
    "docker",
    "monitoring"
  ]

  security_group_rules = [
    {
      protocol    = "tcp"
      port        = 22
      cidr        = "0.0.0.0/0"
      description = "SSH"
    },
    {
      protocol    = "tcp"
      port        = 8188
      cidr        = "10.0.0.0/16"
      description = "Internal ComfyUI"
    }
  ]

  labels = {
    environment = "production"
    team        = "ai-engineering"
  }
}

# Persistent 200 GB Storage Disk
resource "fotohub_ebs_volume" "model_cache" {
  name      = "shared-flux-weights"
  size_gb   = 200
  type      = "gp3"
  iops      = 3000
}

# Attach volume to worker
resource "fotohub_volume_attachment" "cache_attach" {
  instance_id = fotohub_compute_instance.ml_worker.id
  volume_id   = fotohub_ebs_volume.model_cache.id
  device      = "/dev/xvdf"
}
```

---

## 3. Programmatic Orchestration with Python SDK

Build custom autoscaling workers and dynamic render managers directly in Python:

```python
from fotohub import FotoHub
import time
import os

client = FotoHub(api_key=os.environ["FOTOHUB_API_KEY"])

class ComputeClusterManager:
    def __init__(self, cluster_name: str):
        self.cluster_name = cluster_name
        
    def ensure_worker(self, min_workers: int = 1):
        instances = client.get("/compute/v1/instances")["instances"]
        active = [i for i in instances if i["name"].startswith(self.cluster_name) and i["status"] == "running"]
        
        needed = min_workers - len(active)
        if needed > 0:
            print(f"Launching {needed} additional Spot A10G workers...")
            for idx in range(needed):
                worker = client.post("/compute/v1/instances", {
                    "name": f"{self.cluster_name}-{int(time.time())}-{idx}",
                    "catalog_id": "g5.xlarge",
                    "spot_instance": True,
                    "install_presets": ["docker", "monitoring"]
                })
                print(f"Worker launched: {worker['instance']['id']}")
                
    def terminate_idle_workers(self, idle_seconds: int = 600):
        # Inspect metrics and scale down automatically
        pass

manager = ComputeClusterManager("render-farm")
manager.ensure_worker(min_workers=3)
```
