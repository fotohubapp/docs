# Automating Compute: HTTP API, Ansible & GitHub Actions

Manage FOTOhub Compute programmatically. There is no dedicated CLI, Terraform provider, or Pulumi
package for this — everything below drives the same raw HTTP API directly (via `curl`, plain
`requests`/`httpx` in Python, Ansible's `uri` module, or a GitHub Actions step).

---

## Architecture Overview

```mermaid
graph TD
    A[curl / shell scripts] -->|HTTP| E[FOTOhub API Base URL: https://apis.fotohub.app/compute/v1]
    D[Python requests/httpx] -->|HTTP| E
    F[Ansible uri module] -->|HTTP| E
    G[GitHub Actions] -->|HTTP| E
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

Install the real CLI via npm:

```bash
npm install -g fotohubapp-cli
```

:::warning No compute subcommands
The real `fotohub` CLI (`sdk-packages/fotohubapp-cli`) does not have `compute`, `instance`, or
`sandbox` subcommands. Its command surface is `auth`, `billing`, `chat`, `config`, `generate`,
`image`, `mcp`, `models`, `pricing`, `shorts`, `status`, `storage`, `story`, `ugc`, `video`, and
`workflow` — creative generation, billing, and chat, not infrastructure provisioning. Earlier
drafts of this page showed `fotohub compute launch`, `fotohub sandbox run --image ...`, and
similar commands; none of that exists. To provision or manage compute instances, use the HTTP
API directly.
:::

### Scripting the API from the Shell

Without a dedicated CLI, the common pattern is a thin shell wrapper around `curl`:

```bash
#!/bin/bash
# fh-compute.sh — minimal wrapper around the real compute API
API="https://apis.fotohub.app/compute/v1"
AUTH="Authorization: Bearer $FOTOHUB_API_KEY"

case "$1" in
  catalog)   curl -s -H "$AUTH" "$API/catalog" | jq .;;
  list)      curl -s -H "$AUTH" "$API/instances" | jq .;;
  launch)    curl -s -X POST -H "$AUTH" -H "Content-Type: application/json" \
               -d "{\"name\":\"$2\",\"catalog_id\":\"${3:-g5.xlarge}\",\"spot_instance\":true}" \
               "$API/instances" | jq .;;
  stop)      curl -s -X POST -H "$AUTH" "$API/instances/$2/stop" | jq .;;
  terminate) curl -s -X POST -H "$AUTH" "$API/instances/$2/terminate" | jq .;;
  *) echo "Usage: $0 {catalog|list|launch <name> [type]|stop <id>|terminate <id>}"; exit 1;;
esac
```

---

## 3. Terraform / Pulumi — Not Available

There is no official FOTOhub Terraform provider or Pulumi package. `fotohubapp/fotohub` is not
listed on the Terraform Registry (`registry.terraform.io/v1/providers/fotohubapp/fotohub` →
`404 provider not found`), and there is no `@fotohub/pulumi` package. Earlier drafts of this page
showed `provider "fotohub" { ... }` HCL and a `fotohub.ComputeInstance` Pulumi resource — neither
exists; do not build against them.

If you want compute provisioning under IaC today, the practical options are:
- A `null_resource` / `local-exec` provisioner (Terraform) or `local.Command` (Pulumi) that shells
  out to `curl` against the real API (`POST /compute/v1/instances`, etc. — see [GPU Rental](/compute/gpu-rental)).
- Terraform's generic `http` provider (`data "http" "instance"`) for read-only calls; it doesn't
  support the full CRUD lifecycle a real provider would.
- Drive it from a script (Python/Bash) outside of Terraform/Pulumi entirely and treat compute
  instances as an external dependency your IaC just waits on.

## 5. Python HTTP Client & Boto3 Integration

The `fotohub` Python package (`pip install fotohub`) is a client for FOTOhub's **generation**
APIs (image, video, music, 3D, chat) — it has no `.compute` namespace and no generic `get()`/
`post()` method, so it cannot be used to drive Compute. For instance provisioning, use `requests`
or `httpx` directly against the real API.

:::tip Boto3 Compatibility
FOTOhub S3 storage is S3-compatible; use standard `boto3` pointed at the S3 gateway
(`s3point.fotohub.app`), separate from the compute API.
:::

### Full Autoscaling Render Farm Example

```python
import os
import time
import logging
from typing import List, Dict, Any

import boto3
import requests

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

API_BASE = "https://apis.fotohub.app/compute/v1"
FOTOHUB_API_KEY = os.environ.get("FOTOHUB_API_KEY")
if not FOTOHUB_API_KEY:
    raise ValueError("FOTOHUB_API_KEY environment variable is required.")
HEADERS = {"Authorization": f"Bearer {FOTOHUB_API_KEY}", "Content-Type": "application/json"}

# Boto3 client for FOTOhub's S3-compatible storage (separate service from Compute)
s3_client = boto3.client(
    's3',
    endpoint_url='https://s3point.fotohub.app',
    aws_access_key_id=os.environ.get("FH_ACCESS_KEY"),
    aws_secret_access_key=os.environ.get("FH_SECRET_KEY"),
    region_name='eu-central-1'
)


class RenderFarmAutoscaler:
    def __init__(self, cluster_prefix: str, target_queue_size: int = 10):
        self.cluster_prefix = cluster_prefix
        self.target_queue_size = target_queue_size
        logger.info(f"Initialized Autoscaler for {cluster_prefix} in eu-central-1")

    def get_queue_depth(self) -> int:
        """Simulate fetching SQS or Redis queue depth"""
        # In a real scenario, you would query your queue here
        return 45

    def get_active_workers(self) -> List[Dict[str, Any]]:
        """Fetch currently running FOTOhub instances matching the prefix"""
        res = requests.get(f"{API_BASE}/instances", headers=HEADERS)
        res.raise_for_status()
        all_instances = res.json().get("instances", [])
        return [
            i for i in all_instances
            if i["name"].startswith(self.cluster_prefix) and i["status"] in ("RUNNING", "PENDING")
        ]

    def scale_up(self, count: int) -> None:
        """Provision new Spot instances to handle load"""
        logger.info(f"Scaling UP: Requesting {count} new G4dn.xlarge (T4 16GB) Spot instances...")
        for idx in range(count):
            instance_name = f"{self.cluster_prefix}-worker-{int(time.time())}-{idx}"
            try:
                res = requests.post(f"{API_BASE}/instances", headers=HEADERS, json={
                    "name": instance_name,
                    "catalog_id": "g4dn.xlarge",
                    "spot_instance": True,
                    "root_volume_size_gb": 100,
                    "root_volume_type": "gp3",
                    "install_presets": ["docker"],
                    "labels": {"workload": "rendering", "auto_scaled": "true"},
                })
                res.raise_for_status()
                logger.info(f"Successfully requested instance: {instance_name}")
            except Exception as e:
                logger.error(f"Failed to launch instance {instance_name}: {e}")

    def scale_down(self, instances_to_terminate: List[Dict[str, Any]]) -> None:
        """Terminate idle instances to save costs"""
        logger.info(f"Scaling DOWN: Terminating {len(instances_to_terminate)} instances...")
        for instance in instances_to_terminate:
            try:
                res = requests.post(
                    f"{API_BASE}/instances/{instance['id']}/terminate", headers=HEADERS
                )
                res.raise_for_status()
                logger.info(f"Terminated instance: {instance['name']}")
            except Exception as e:
                logger.error(f"Failed to terminate instance {instance['id']}: {e}")

    def reconcile(self) -> None:
        """Main evaluation loop for the autoscaler"""
        queue_depth = self.get_queue_depth()
        active_workers = self.get_active_workers()
        worker_count = len(active_workers)

        logger.info(f"Queue Depth: {queue_depth} | Active Workers: {worker_count}")

        # Simple heuristic: 1 worker per 10 items in queue
        desired_capacity = min((queue_depth // self.target_queue_size) + 1, 20)  # Max 20 workers

        if worker_count < desired_capacity:
            self.scale_up(desired_capacity - worker_count)
        elif worker_count > desired_capacity:
            excess = worker_count - desired_capacity
            self.scale_down(active_workers[:excess])
        else:
            logger.info("Capacity matches demand. No scaling action required.")


if __name__ == "__main__":
    autoscaler = RenderFarmAutoscaler(cluster_prefix="blender-farm")
    try:
        while True:
            autoscaler.reconcile()
            time.sleep(60)  # Evaluate every 60 seconds
    except KeyboardInterrupt:
        logger.info("Autoscaler stopped by user.")
```

---

## 6. GitHub Actions Workflow

Automate CI/CD against real GPUs through GitHub Actions. There is no Docker-image sandbox or
container registry product here (`fotohub-registry.app` doesn't exist) — the real pattern is:
provision an instance, push a shell script to it via the real `run-script` endpoint, poll for the
result, then terminate.

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
  API: https://apis.fotohub.app/compute/v1

jobs:
  gpu-integration-test:
    name: Run GPU Tests on a FOTOhub Instance
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Provision a spot g4dn.xlarge test instance
        run: |
          INSTANCE_ID=$(curl -s -X POST -H "Authorization: Bearer $FOTOHUB_API_KEY" \
            -H "Content-Type: application/json" \
            -d '{"name":"ci-test-${{ github.sha }}","catalog_id":"g4dn.xlarge","spot_instance":true,"max_runtime_hours":1}' \
            "$API/instances" | jq -r '.instance.id')
          echo "INSTANCE_ID=$INSTANCE_ID" >> "$GITHUB_ENV"

      - name: Run the test suite via run-script and poll for completion
        run: |
          # run-script is async (dispatched over SSM) — it returns a command_id immediately,
          # not the test output. It also requires the SSM agent to be running on the instance.
          COMMAND_ID=$(curl -s -X POST -H "Authorization: Bearer $FOTOHUB_API_KEY" \
            -H "Content-Type: application/json" \
            -d '{"script":"cd /workspace && pytest tests/gpu_tests/"}' \
            "$API/instances/$INSTANCE_ID/run-script" | jq -r '.command_id')
          until curl -s -H "Authorization: Bearer $FOTOHUB_API_KEY" \
            "$API/instances/$INSTANCE_ID/script-result/$COMMAND_ID" | tee result.json \
            | jq -e '.status != "InProgress" and .status != "Pending"' > /dev/null; do
            sleep 10
          done
          jq -e '.status == "Success" and .exit_code == 0' result.json || (cat result.json && exit 1)

      - name: Always terminate the test instance
        if: always()
        run: |
          curl -s -X POST -H "Authorization: Bearer $FOTOHUB_API_KEY" \
            "$API/instances/$INSTANCE_ID/terminate"
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

A `Makefile` wrapping raw `curl` calls to the real API for local development — there is no CLI or
Terraform to wrap (see sections 2–3 above).

```makefile
# FOTOhub Development Makefile
# Region: eu-central-1
API := https://apis.fotohub.app/compute/v1
AUTH := Authorization: Bearer $(FOTOHUB_API_KEY)

.PHONY: help catalog launch list stop terminate

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

catalog: ## View the current GPU catalog and spot pricing in USD
	curl -s -H "$(AUTH)" "$(API)/catalog" | jq .

launch: ## Launch a default G5.xlarge spot instance named dev-sandbox
	curl -s -X POST -H "$(AUTH)" -H "Content-Type: application/json" \
	  -d '{"name":"dev-sandbox","catalog_id":"g5.xlarge","spot_instance":true,"root_volume_size_gb":100,"install_presets":["docker"]}' \
	  "$(API)/instances" | jq .

list: ## List all running instances
	curl -s -H "$(AUTH)" "$(API)/instances" | jq .

stop: ## Gracefully stop the dev-sandbox instance (preserves disk)
	@ID=$$(curl -s -H "$(AUTH)" "$(API)/instances" | jq -r '.instances[] | select(.name=="dev-sandbox") | .id'); \
	curl -s -X POST -H "$(AUTH)" "$(API)/instances/$$ID/stop" | jq .

terminate: ## Destroy the dev-sandbox instance entirely
	@ID=$$(curl -s -H "$(AUTH)" "$(API)/instances" | jq -r '.instances[] | select(.name=="dev-sandbox") | .id'); \
	curl -s -X POST -H "$(AUTH)" "$(API)/instances/$$ID/terminate" | jq .
```

---

## Conclusion

FOTOhub Compute is a plain HTTP API — one A10G or one T4 per instance, no CLI, no Terraform/Pulumi
provider, no Docker-image sandboxes. Shell scripts, Ansible's `uri` module, GitHub Actions steps,
and plain `requests`/`httpx` in Python all drive the same real endpoints shown above, and scale
horizontally (many single-GPU instances behind a load balancer) rather than vertically.

> *All prices listed are in USD. S3 and EBS billing continue to accrue while instances are in a STOPPED state. Always remember to `terminate` resources when they are no longer required to prevent unwanted charges.*
