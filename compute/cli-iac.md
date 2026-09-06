# CLI & Infrastructure as Code (Terraform & Boto3)

Manage FOTOhub Compute and Sandboxes programmatically through the official command-line interface (`fotohubapp-cli`), Terraform HCL definitions, Pulumi, Ansible, GitHub Actions, and the Python SDK.

---

## Architecture Overview

```mermaid
graph TD
    A[FOTOhub CLI] -->|API| E[FOTOhub API Base URL: https://apis.fotohub.app/compute/v1]
    B[Terraform] -->|API| E
    C[Pulumi] -->|API| E
    D[Python SDK/Boto3] -->|API| E
    F[Ansible] -->|API| E
    G[GitHub Actions] -->|API| E
    E --> H[AWS Region: eu-central-1]
    H --> I[G5.xlarge A10G 24GB]
    H --> J[G4dn.xlarge T4 16GB]
    H --> K[EBS Storage gp3/io2]
    H --> L[S3 Storage]
```

## 1. Fundamentals

### Base URL & Authentication

All programmatic access uses the central FOTOhub API.

:::tip API Base URL
**Base URL:** `https://apis.fotohub.app/compute/v1`
:::

Authentication is performed via Bearer tokens.

:::warning Authentication Required
**Auth:** `Authorization: Bearer fh_live_YOUR_API_KEY`
Keep your API key secure. Do not commit it to version control!
:::

### Region Details

:::info Default Cloud Region
All resources are provisioned in the **AWS Region:** `eu-central-1` (Frankfurt, Germany). This provides low latency for European users and strict GDPR compliance out-of-the-box.
:::

### Pricing Reference

All prices are strictly in USD. No PLN (Polish Zloty) billing is supported.

| Resource | Specifications | Spot Price | On-Demand Price |
|----------|---------------|------------|-----------------|
| **G5.xlarge** | A10G 24GB VRAM | $0.38/hr | $1.01/hr |
| **G4dn.xlarge** | T4 16GB VRAM | $0.20/hr | $0.53/hr |

**Storage Costs (per GB-month):**
- **S3:** $0.0245/GB-mo
- **EBS gp3:** $0.08/GB-mo
- **EBS io2:** $0.125/GB-mo

---

## 2. FOTOhub Command-Line Interface (CLI)

Install the global CLI via npm or binary package:

```bash
npm install -g fotohubapp-cli
```

### Authentication
```bash
fotohub auth login --key fh_live_YOUR_API_KEY_HERE
```

:::code-group
```bash [Expected Output]
[Success] Authenticated as team_x (eu-central-1).
API Key verified successfully.
```
:::

### Full CLI Command Reference

Below is an exhaustive catalog of all operations available via the FOTOhub CLI. 

#### 1. Catalog & Pricing

```bash
fotohub compute catalog
```
**Output Example:**
```json
{
  "region": "eu-central-1",
  "catalog": [
    {
      "id": "g5.xlarge",
      "gpu": "A10G 24GB",
      "spot_usd": 0.38,
      "ondemand_usd": 1.01
    },
    {
      "id": "g4dn.xlarge",
      "gpu": "T4 16GB",
      "spot_usd": 0.20,
      "ondemand_usd": 0.53
    }
  ]
}
```

#### 2. Launch Instance

```bash
fotohub compute launch \
  --name "vllm-node-01" \
  --type "g5.xlarge" \
  --spot \
  --disk 120 \
  --preset docker \
  --runtime 12
```
**Output Example:**
```text
[Info] Provisioning g5.xlarge (Spot) in eu-central-1...
[Info] Attaching 120GB gp3 EBS root volume...
[Info] Applying 'docker' preset configurations...
[Success] Instance i-0abcd1234efgh5678 launched successfully!
IP Address: 3.120.45.67
SSH Command: fotohub compute ssh vllm-node-01
```

#### 3. List Instances

```bash
fotohub compute list
```
**Output Example:**
```text
ID                   NAME            TYPE          STATUS    IP             UPTIME
i-0abcd1234efgh5678  vllm-node-01    g5.xlarge     RUNNING   3.120.45.67    0h 15m
i-0zzzz9999yyyy8888  old-worker      g4dn.xlarge   STOPPED   -              -
```

#### 4. Stop Instance

```bash
fotohub compute stop vllm-node-01
```
**Output Example:**
```text
[Info] Sending graceful shutdown signal to vllm-node-01 (i-0abcd1234efgh5678)...
[Success] Instance stopped. Disk state preserved. EBS billing continues at $0.08/GB-mo.
```

#### 5. Start Instance

```bash
fotohub compute start vllm-node-01
```
**Output Example:**
```text
[Info] Requesting Spot capacity for vllm-node-01 (g5.xlarge) in eu-central-1...
[Success] Instance started.
New IP Address: 18.192.10.11
```

#### 6. Terminate Instance

```bash
fotohub compute terminate vllm-node-01
```
**Output Example:**
```text
[Warning] Terminating instance i-0abcd1234efgh5678. Root volume will be deleted.
[Success] Instance terminated permanently.
```

#### 7. SSH Connect

```bash
fotohub compute ssh vllm-node-01
```
**Output Example:**
```text
[Info] Auto-downloading KMS ephemeral key for vllm-node-01...
[Info] Establishing secure tunnel...
Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 6.5.0-1014-aws x86_64)
ubuntu@ip-10-0-1-55:~$
```

#### 8. Cost Estimate

```bash
fotohub compute estimate --type g5.xlarge --spot --runtime 720 --disk 100
```
**Output Example:**
```text
--- FOTOhub Cost Estimate (eu-central-1) ---
Compute: G5.xlarge (Spot, $0.38/hr) x 720h = $273.60
Storage: gp3 100GB ($0.08/GB-mo) = $8.00
Total Estimated Cost: $281.60 USD
Note: Prices do not include PLN conversion. All billing is strictly USD.
```

#### 9. Logs

```bash
fotohub compute logs vllm-node-01 --tail 100
```
**Output Example:**
```text
[2026-09-06T12:00:01Z] systemd: Started Docker Application Container Engine.
[2026-09-06T12:00:05Z] user-data: Finished applying 'docker' preset.
[2026-09-06T12:00:10Z] nvidia-smi: GPU 0: NVIDIA A10G (24GB) initialized.
```

#### 10. Metrics

```bash
fotohub compute metrics vllm-node-01
```
**Output Example:**
```text
Instance Metrics (vllm-node-01)
CPU Utilization: 12.4%
GPU Utilization: 88.1% (A10G)
GPU VRAM Usage:  18.2GB / 24GB
Disk Read:       12.1 MB/s
Disk Write:      4.2 MB/s
```

#### 11. Snapshot

```bash
fotohub compute snapshot vllm-node-01 --name "vllm-backup-1"
```
**Output Example:**
```text
[Info] Initiating EBS snapshot for root volume of vllm-node-01...
[Success] Snapshot snap-0abcdef123456 created successfully.
```

#### 12. Resize

```bash
fotohub compute resize vllm-node-01 --size 200
```
**Output Example:**
```text
[Info] Modifying root volume to 200 GB...
[Success] EBS volume resized. Please extend the filesystem inside the OS.
```

#### 13. Sandbox Run

```bash
fotohub sandbox run --image pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime --command "python train.py"
```
**Output Example:**
```text
[Info] Provisioning Sandbox environment in eu-central-1...
[Info] Pulling image pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime...
[Logs] Epoch 1/10: Loss 0.453...
[Success] Sandbox execution completed. Total cost: $0.05 USD.
```

#### 14. Sandbox Exec

```bash
fotohub sandbox exec sbx-987654321 -- "ls -la /workspace"
```
**Output Example:**
```text
total 16
drwxr-xr-x 2 root root 4096 Sep  6 12:00 .
drwxr-xr-x 1 root root 4096 Sep  6 12:00 ..
-rw-r--r-- 1 root root  125 Sep  6 12:00 train.py
-rw-r--r-- 1 root root  532 Sep  6 12:00 requirements.txt
```

---

## 3. Terraform Infrastructure as Code (IaC)

Manage FOTOhub Compute instances alongside your existing cloud infrastructure using standard Terraform HCL. The official FOTOhub provider offers comprehensive management of all compute and storage primitives.

:::tip Provider Version
Always pin your provider version to avoid breaking changes in production environments.
:::

### Full Multi-Instance ML Terraform Example

This comprehensive, production-grade example provisions a massive distributed machine learning training cluster, including head nodes, distributed worker nodes, persistent model weight storage, and extensive tagging.

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    fotohub = {
      source  = "fotohubapp/fotohub"
      version = "~> 2.0.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "fotohub_api_key" {
  description = "FOTOhub API Key (Bearer Token)"
  type        = string
  sensitive   = true
}

variable "worker_count" {
  description = "Number of G5.xlarge workers to provision"
  type        = number
  default     = 10
}

provider "fotohub" {
  api_key = var.fotohub_api_key
  region  = "eu-central-1" # Hardcoded to the required region
}

provider "aws" {
  region = "eu-central-1"
}

# ---------------------------------------------------------
# FOTOhub Data Sources
# ---------------------------------------------------------

data "fotohub_catalog" "current_pricing" {
  region = "eu-central-1"
}

data "fotohub_instance_types" "gpu_offerings" {
  filter {
    name   = "gpu_memory_min"
    values = ["16"]
  }
}

# ---------------------------------------------------------
# S3 Storage for Checkpoints (AWS Provider)
# ---------------------------------------------------------

resource "aws_s3_bucket" "model_checkpoints" {
  bucket = "fotohub-model-checkpoints-eu-central-1"
}

resource "aws_s3_bucket_versioning" "model_checkpoints_versioning" {
  bucket = aws_s3_bucket.model_checkpoints.id
  versioning_configuration {
    status = "Enabled"
  }
}

# ---------------------------------------------------------
# Shared EBS Volume for Dataset Cache (io2 for high IOPS)
# ---------------------------------------------------------

resource "fotohub_ebs_volume" "dataset_cache" {
  name      = "massive-dataset-cache"
  size_gb   = 1000
  type      = "io2"
  iops      = 15000
  labels = {
    environment = "production"
    purpose     = "training-data"
  }
}

# ---------------------------------------------------------
# Ray Head Node (On-Demand for stability)
# ---------------------------------------------------------

resource "fotohub_compute_instance" "ray_head" {
  name                = "production-ray-head-node"
  catalog_id          = "g4dn.xlarge" # T4 16GB, $0.53/hr On-Demand
  spot_instance       = false
  max_runtime_hours   = 720
  root_volume_type    = "gp3"
  root_volume_size_gb = 200

  install_presets = [
    "docker",
    "monitoring",
    "ray-head"
  ]

  security_group_rules = [
    {
      protocol    = "tcp"
      port        = 22
      cidr        = "0.0.0.0/0"
      description = "SSH Admin Access"
    },
    {
      protocol    = "tcp"
      port        = 8265
      cidr        = "0.0.0.0/0"
      description = "Ray Dashboard"
    },
    {
      protocol    = "tcp"
      port        = 6379
      cidr        = "10.0.0.0/8"
      description = "Ray Redis Internal"
    }
  ]

  labels = {
    environment = "production"
    role        = "head-node"
    team        = "ai-engineering"
  }
}

# Attach dataset cache volume to head node
resource "fotohub_volume_attachment" "head_cache_attach" {
  instance_id = fotohub_compute_instance.ray_head.id
  volume_id   = fotohub_ebs_volume.dataset_cache.id
  device      = "/dev/xvdf"
}

# ---------------------------------------------------------
# Ray Worker Nodes (Spot instances for cost savings)
# ---------------------------------------------------------

resource "fotohub_compute_instance" "ray_workers" {
  count               = var.worker_count
  name                = "production-ray-worker-${count.index + 1}"
  catalog_id          = "g5.xlarge" # A10G 24GB, $0.38/hr Spot
  spot_instance       = true
  max_runtime_hours   = 168 # 1 week max runtime for spot workers
  root_volume_type    = "gp3"
  root_volume_size_gb = 150

  install_presets = [
    "docker",
    "monitoring",
    "ray-worker"
  ]

  # Inject startup script to connect to head node
  user_data = <<-EOF
    #!/bin/bash
    echo "Waiting for Ray head node to initialize..."
    sleep 30
    ray start --address='${fotohub_compute_instance.ray_head.private_ip}:6379'
  EOF

  security_group_rules = [
    {
      protocol    = "tcp"
      port        = 22
      cidr        = "0.0.0.0/0"
      description = "SSH Admin Access"
    },
    {
      protocol    = "tcp"
      port        = 10000
      cidr        = "10.0.0.0/8"
      description = "Ray Object Manager Port"
    }
  ]

  labels = {
    environment = "production"
    role        = "worker-node"
    team        = "ai-engineering"
    index       = tostring(count.index)
  }
}

# ---------------------------------------------------------
# Worker Scratch Disks (gp3)
# ---------------------------------------------------------

resource "fotohub_ebs_volume" "worker_scratch" {
  count     = var.worker_count
  name      = "worker-scratch-${count.index + 1}"
  size_gb   = 500
  type      = "gp3"
  iops      = 5000
  labels = {
    environment = "production"
    purpose     = "ephemeral-scratch"
  }
}

resource "fotohub_volume_attachment" "worker_scratch_attach" {
  count       = var.worker_count
  instance_id = fotohub_compute_instance.ray_workers[count.index].id
  volume_id   = fotohub_ebs_volume.worker_scratch[count.index].id
  device      = "/dev/xvdg"
}

# ---------------------------------------------------------
# Outputs
# ---------------------------------------------------------

output "ray_head_public_ip" {
  value       = fotohub_compute_instance.ray_head.public_ip
  description = "Public IP of the Ray head node"
}

output "ray_dashboard_url" {
  value       = "http://${fotohub_compute_instance.ray_head.public_ip}:8265"
  description = "URL to access the Ray dashboard"
}

output "worker_ips" {
  value       = fotohub_compute_instance.ray_workers[*].private_ip
  description = "Private IPs of all Ray worker nodes"
}

output "estimated_hourly_cost" {
  value       = (1.01) + (var.worker_count * 0.38) # g4dn on-demand + workers g5 spot
  description = "Estimated hourly compute cost in USD (excluding EBS/S3)"
}
```

---

## 4. Pulumi Infrastructure as Code

For developers who prefer general-purpose programming languages for IaC, FOTOhub provides a Pulumi provider. Below is a TypeScript example provisioning a secure inference endpoint.

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as fotohub from "@fotohub/pulumi";

// Define the Compute Instance
const inferenceServer = new fotohub.ComputeInstance("vllm-inference", {
    name: "production-vllm-server",
    catalogId: "g5.xlarge", // A10G 24GB
    spotInstance: false,    // On-Demand for production availability
    maxRuntimeHours: 0,     // Unlimited
    rootVolumeType: "gp3",
    rootVolumeSizeGb: 200,
    installPresets: ["docker", "nvidia-container-toolkit"],
    securityGroupRules: [
        {
            protocol: "tcp",
            port: 8000,
            cidr: "0.0.0.0/0",
            description: "vLLM API Port"
        },
        {
            protocol: "tcp",
            port: 22,
            cidr: "203.0.113.0/24",
            description: "Restricted SSH Access"
        }
    ],
    labels: {
        environment: "production",
        workload: "inference"
    }
});

// Export the connection details
export const instanceIp = inferenceServer.publicIp;
export const apiUrl = pulumi.interpolate`http://${inferenceServer.publicIp}:8000/v1`;
```

---

## 5. Python SDK & Boto3 Integration

For programmatic orchestration, autoscaling, and integration into custom Python pipelines, the `fotohub` package provides robust sync and async clients.

:::tip Boto3 Compatibility
FOTOhub's S3 buckets are 100% API compatible with AWS S3. You can use standard `boto3` to interact with them alongside the FOTOhub SDK.
:::

### Full Autoscaling Render Farm Example

```python
import os
import time
import logging
import boto3
from typing import List, Dict, Any
from fotohub import FotoHubClient, models

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# Initialize Clients
# Base URL: https://apis.fotohub.app/compute/v1
FOTOHUB_API_KEY = os.environ.get("FOTOHUB_API_KEY")
if not FOTOHUB_API_KEY:
    raise ValueError("FOTOHUB_API_KEY environment variable is required.")

fh_client = FotoHubClient(api_key=FOTOHUB_API_KEY, region="eu-central-1")

# Initialize S3 via Boto3 (compatible with FOTOhub Storage)
s3_client = boto3.client(
    's3',
    endpoint_url='https://s3.eu-central-1.fotohub.app',
    aws_access_key_id=os.environ.get("FH_ACCESS_KEY"),
    aws_secret_access_key=os.environ.get("FH_SECRET_KEY"),
    region_name='eu-central-1'
)

class RenderFarmAutoscaler:
    def __init__(self, cluster_prefix: str, target_queue_size: int = 10):
        self.cluster_prefix = cluster_prefix
        self.target_queue_size = target_queue_size
        self.catalog = fh_client.compute.get_catalog()
        logger.info(f"Initialized Autoscaler for {cluster_prefix} in eu-central-1")
        
    def get_queue_depth(self) -> int:
        """Simulate fetching SQS or Redis queue depth"""
        # In a real scenario, you would query your queue here
        return 45 

    def get_active_workers(self) -> List[models.Instance]:
        """Fetch currently running FOTOhub instances matching the prefix"""
        all_instances = fh_client.compute.list_instances()
        active = [
            i for i in all_instances 
            if i.name.startswith(self.cluster_prefix) and i.status in ["RUNNING", "PENDING"]
        ]
        return active

    def scale_up(self, count: int) -> None:
        """Provision new Spot instances to handle load"""
        logger.info(f"Scaling UP: Requesting {count} new G4dn.xlarge (T4 16GB) Spot instances...")
        
        for idx in range(count):
            instance_name = f"{self.cluster_prefix}-worker-{int(time.time())}-{idx}"
            try:
                # G4dn.xlarge (T4 16GB) is highly cost-effective at $0.20/hr spot
                response = fh_client.compute.launch_instance(
                    name=instance_name,
                    catalog_id="g4dn.xlarge",
                    spot_instance=True,
                    root_volume_size_gb=100,
                    root_volume_type="gp3",
                    install_presets=["blender-renderer", "docker"],
                    labels={"workload": "rendering", "auto_scaled": "true"}
                )
                logger.info(f"Successfully requested instance: {instance_name} (ID: {response.id})")
            except Exception as e:
                logger.error(f"Failed to launch instance {instance_name}: {str(e)}")

    def scale_down(self, instances_to_terminate: List[models.Instance]) -> None:
        """Terminate idle instances to save costs"""
        logger.info(f"Scaling DOWN: Terminating {len(instances_to_terminate)} instances...")
        
        for instance in instances_to_terminate:
            try:
                fh_client.compute.terminate_instance(instance.id)
                logger.info(f"Terminated instance: {instance.name} (ID: {instance.id})")
            except Exception as e:
                logger.error(f"Failed to terminate instance {instance.id}: {str(e)}")

    def reconcile(self) -> None:
        """Main evaluation loop for the autoscaler"""
        queue_depth = self.get_queue_depth()
        active_workers = self.get_active_workers()
        worker_count = len(active_workers)
        
        logger.info(f"Queue Depth: {queue_depth} | Active Workers: {worker_count}")
        
        # Simple heuristic: 1 worker per 10 items in queue
        desired_capacity = min((queue_depth // self.target_queue_size) + 1, 20) # Max 20 workers
        
        if worker_count < desired_capacity:
            shortfall = desired_capacity - worker_count
            self.scale_up(shortfall)
        elif worker_count > desired_capacity:
            excess = worker_count - desired_capacity
            # Sort workers by uptime (terminate oldest first) to avoid getting close to 24h limits
            # Or terminate instances that have been idle
            to_terminate = active_workers[:excess]
            self.scale_down(to_terminate)
        else:
            logger.info("Capacity matches demand. No scaling action required.")

if __name__ == "__main__":
    autoscaler = RenderFarmAutoscaler(cluster_prefix="blender-farm")
    
    # Run a continuous daemon loop
    try:
        while True:
            autoscaler.reconcile()
            time.sleep(60) # Evaluate every 60 seconds
    except KeyboardInterrupt:
        logger.info("Autoscaler stopped by user.")
```

---

## 6. GitHub Actions Workflow

Automate your CI/CD pipelines to build containers, run integration tests on real GPUs, and deploy to FOTOhub entirely through GitHub Actions.

Create this file at `.github/workflows/fotohub-ci-cd.yml`:

```yaml
name: FOTOhub GPU CI/CD Pipeline

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

env:
  FOTOHUB_API_KEY: ${{ secrets.FOTOHUB_API_KEY }}
  AWS_REGION: eu-central-1

jobs:
  gpu-integration-test:
    name: Run GPU Tests on FOTOhub Sandbox
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup FOTOhub CLI
        run: npm install -g fotohubapp-cli

      - name: Authenticate FOTOhub
        run: fotohub auth login --key ${{ secrets.FOTOHUB_API_KEY }}

      - name: Build Docker Image
        run: |
          docker build -t fotohub-registry.app/my-org/gpu-test-image:${{ github.sha }} .
          # In a real workflow, you would push this image to a registry here

      - name: Execute GPU Tests via Sandbox
        run: |
          echo "Launching temporary sandbox for testing..."
          fotohub sandbox run \
            --image "fotohub-registry.app/my-org/gpu-test-image:${{ github.sha }}" \
            --command "pytest tests/gpu_tests/" \
            --type "g4dn.xlarge" \
            --wait-for-completion > test_output.log
            
          # Extract the exit code from the sandbox output
          cat test_output.log
          if grep -q "Sandbox execution failed" test_output.log; then
            echo "GPU Tests Failed!"
            exit 1
          fi

  deploy-production:
    name: Deploy to Production
    needs: gpu-integration-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.5.7"

      - name: Terraform Init
        working-directory: ./infrastructure
        run: terraform init

      - name: Terraform Plan
        working-directory: ./infrastructure
        run: terraform plan -out=tfplan
        env:
          TF_VAR_fotohub_api_key: ${{ secrets.FOTOHUB_API_KEY }}
          TF_VAR_image_tag: ${{ github.sha }}

      - name: Terraform Apply
        working-directory: ./infrastructure
        run: terraform apply -auto-approve tfplan
        env:
          TF_VAR_fotohub_api_key: ${{ secrets.FOTOHUB_API_KEY }}
```

---

## 7. Configuration Management with Ansible

If you prefer mutable infrastructure and configuration management, you can use Ansible to provision and configure FOTOhub instances. Below is an exhaustive Ansible playbook that uses the `uri` module to interact with the API, creates a new instance, waits for SSH, and configures it.

```yaml
---
- name: Provision and Configure FOTOhub G5.xlarge Node
  hosts: localhost
  gather_facts: false
  vars:
    fotohub_api_url: "https://apis.fotohub.app/compute/v1"
    fotohub_api_key: "{{ lookup('env', 'FOTOHUB_API_KEY') }}"
    instance_name: "ansible-cuda-node"
    region: "eu-central-1"

  tasks:
    - name: Ensure API key is present
      fail:
        msg: "FOTOHUB_API_KEY environment variable is required."
      when: fotohub_api_key == ""

    - name: Provision FOTOhub Instance via API
      uri:
        url: "{{ fotohub_api_url }}/instances"
        method: POST
        headers:
          Authorization: "Bearer {{ fotohub_api_key }}"
          Content-Type: "application/json"
        body_format: json
        body:
          name: "{{ instance_name }}"
          catalog_id: "g5.xlarge"
          spot_instance: true
          root_volume_size_gb: 250
          install_presets:
            - docker
      register: create_response

    - name: Extract Instance Details
      set_fact:
        instance_id: "{{ create_response.json.instance.id }}"
        instance_ip: "{{ create_response.json.instance.public_ip }}"

    - name: Wait for Instance to become RUNNING
      uri:
        url: "{{ fotohub_api_url }}/instances/{{ instance_id }}"
        method: GET
        headers:
          Authorization: "Bearer {{ fotohub_api_key }}"
      register: status_response
      until: status_response.json.instance.status == 'RUNNING'
      retries: 30
      delay: 10

    - name: Add new host to dynamic inventory
      add_host:
        name: "{{ instance_ip }}"
        groups: fotohub_gpu_nodes
        ansible_user: ubuntu
        ansible_ssh_common_args: '-o StrictHostKeyChecking=no'
        # In a real scenario, you would fetch the ephemeral SSH key from the API here
        ansible_ssh_private_key_file: "~/.ssh/id_rsa_fotohub"

- name: Configure FOTOhub GPU Node
  hosts: fotohub_gpu_nodes
  become: yes
  gather_facts: yes
  
  tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600

    - name: Install essential packages
      apt:
        name:
          - htop
          - git
          - tmux
          - nvtop
        state: present

    - name: Verify NVIDIA drivers are active
      command: nvidia-smi
      register: nvidia_smi_output
      changed_when: false

    - name: Display NVIDIA status
      debug:
        msg: "{{ nvidia_smi_output.stdout_lines }}"

    - name: Create working directory
      file:
        path: /opt/ml_workspace
        state: directory
        owner: ubuntu
        group: ubuntu
        mode: '0755'
```

---

## 8. Complete Utility Makefile

A comprehensive `Makefile` to quickly wrap FOTOhub CLI commands and Terraform operations for local development environments.

```makefile
# FOTOhub Development Makefile
# Region: eu-central-1

.PHONY: help auth catalog launch list ssh stop terminate tf-init tf-apply tf-destroy

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

auth: ## Authenticate with FOTOhub CLI
	@if [ -z "$$FOTOHUB_API_KEY" ]; then echo "Error: FOTOHUB_API_KEY is not set"; exit 1; fi
	fotohub auth login --key $$FOTOHUB_API_KEY

catalog: ## View the current GPU catalog and spot pricing in USD
	fotohub compute catalog

launch: ## Launch a default G5.xlarge instance
	fotohub compute launch --name dev-sandbox --type g5.xlarge --spot --disk 100 --preset docker

list: ## List all running instances
	fotohub compute list

ssh: ## Connect to the dev-sandbox instance
	fotohub compute ssh dev-sandbox

stop: ## Gracefully stop the dev-sandbox instance (preserves disk)
	fotohub compute stop dev-sandbox

terminate: ## Destroy the dev-sandbox instance entirely
	fotohub compute terminate dev-sandbox

tf-init: ## Initialize Terraform providers
	cd infrastructure && terraform init

tf-plan: ## Run Terraform Plan
	cd infrastructure && terraform plan

tf-apply: ## Run Terraform Apply (auto-approve)
	cd infrastructure && terraform apply -auto-approve

tf-destroy: ## Destroy all Terraform-managed infrastructure
	cd infrastructure && terraform destroy -auto-approve
```

---

## Conclusion

FOTOhub provides a highly versatile, developer-friendly ecosystem for managing massive GPU compute scale securely in `eu-central-1`. Whether you are using simple shell scripts wrapped around the CLI, declarative deployments with Terraform, or imperative scaling managers in Python, the API provides the exact primitives needed to orchestrate your A10G and T4 nodes at minimal spot pricing costs.

> *All prices listed are in USD. S3 and EBS billing continue to accrue while instances are in a STOPPED state. Always remember to `terminate` resources when they are no longer required to prevent unwanted charges.*
