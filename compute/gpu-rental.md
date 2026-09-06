# GPU & CPU On-Demand Rental

Spin up dedicated NVIDIA A10G and T4 GPU nodes or scalable CPU instances in seconds via API, SDK, or cURL.

Rentals provide full root SSH access, persistent EBS volumes, customizable security groups, automated software presets for ML inference (vLLM, ComfyUI, PyTorch), serial console logging, and dynamic status telemetry.

---

## Lifecycle API Summary

- **Base URL:** `https://apis.fotohub.app/compute/v1`
- **Authentication:** `Authorization: Bearer fh_live_...`

| Action | Endpoint | Description |
|:---|:---|:---|
| **Catalog** | `GET /catalog` | List real-time prices, availability zones, and specs |
| **Eligibility** | `GET /instances/eligibility` | Verify account tier & wallet balance sufficiency |
| **Estimate** | `POST /instances/estimate` | Calculate hourly and total costs prior to launching |
| **Provision** | `POST /instances` | Spin up an on-demand or Spot instance |
| **Instance Detail** | `GET /instances/{id}/full` | Inspect network IPs, storage attachments, and status |
| **Power State** | `POST /instances/{id}/start|stop|reboot|terminate` | Control machine lifecycle state |
| **Resize** | `POST /instances/{id}/resize` | Hot-swap instance type (e.g. `g4dn.xlarge` → `g5.2xlarge`) |
| **SSH Key** | `GET /instances/{id}/ssh-key` | Download injected private SSH `.pem` key |
| **Regenerate SSH** | `POST /instances/{id}/ssh-key/regenerate` | Re-inject fresh SSH credentials |
| **Serial Console** | `GET /instances/{id}/console-output` | Real-time EC2 serial kernel output & boot log |
| **CloudWatch Metrics** | `GET /instances/{id}/metrics` | Query CPU, GPU VRAM, disk IOPS, and network I/O |
| **Status Checks** | `GET /instances/{id}/status-checks` | Query AWS System and Instance status checks |
| **Run Script** | `POST /instances/{id}/run-script` | Execute remote shell script on running instance |

---

## Provisioning Guide: NVIDIA A10G with ComfyUI

Deploy an NVIDIA A10G 24GB node (`g5.xlarge`) with Docker and NVIDIA Container Toolkit pre-installed, booting ComfyUI directly on port 8188:

::: code-group

```python [Python]
from fotohub import FotoHub
import os, time

client = FotoHub(api_key=os.environ["FOTOHUB_API_KEY"])

# 1. Preflight wallet balance & eligibility check (minimum $0.50 USD balance)
eligibility = client.get("/compute/v1/instances/eligibility")
print(f"Eligibility: {eligibility['allowed']} | Wallet: ${eligibility.get('wallet_balance', 0):.2f} {eligibility.get('wallet_currency', 'USD')}")
if not eligibility.get("allowed"):
    raise RuntimeError(eligibility.get("message", "Insufficient USD balance"))

# 2. Preflight cost check
estimate = client.post("/compute/v1/instances/estimate", {
    "catalog_id": "g5.xlarge",
    "spot_instance": True,
    "root_volume_type": "gp3",
    "root_volume_size_gb": 120,
    "max_runtime_hours": 8
})
print(f"Hourly rate: ${estimate['estimate']['hourly_rate_usd']:.3f}/hr (Total 8h: ${estimate['estimate']['total_estimated_cost_usd']:.2f})")

# 3. Provision instance
instance_res = client.post("/compute/v1/instances", {
    "name": "comfyui-flux-worker",
    "catalog_id": "g5.xlarge",
    "region": "eu-central-1",
    "availability_zone": "eu-central-1a",
    "spot_instance": True,                 # ~62% discount
    "max_runtime_hours": 8,                # Auto-stop after 8 hours
    "root_volume_type": "gp3",
    "root_volume_size_gb": 120,            # High-speed SSD for checkpoints
    "os_image": "ubuntu-2204-lts",
    "install_presets": ["docker", "python-ml"],
    "startup_script": """#!/bin/bash
    docker run -d --gpus all -p 8188:8188 --name comfyui \
      --restart unless-stopped \
      -v /data/models:/workspace/ComfyUI/models \
      yanwk/comfyui-boot:latest
    """,
    "security_group_rules": [
        {"protocol": "tcp", "port": 22, "cidr": "0.0.0.0/0", "description": "SSH Access"},
        {"protocol": "tcp", "port": 8188, "cidr": "0.0.0.0/0", "description": "ComfyUI Web Interface"}
    ],
    "labels": {"project": "image-gen", "environment": "production"}
})

instance_id = instance_res["instance"]["id"]
print(f"Instance requested: {instance_id}")

# 4. Download SSH Private Key
key_res = client.get(f"/compute/v1/instances/{instance_id}/ssh-key")
key_path = "comfyui_worker.pem"
with open(key_path, "w") as f:
    f.write(key_res["private_key"])
os.chmod(key_path, 0o400)
print(f"Private key saved to {key_path}")

# 5. Wait for Public IP assignment
while True:
    details = client.get(f"/compute/v1/instances/{instance_id}")["instance"]
    status = details["status"]
    ip = details.get("ip_address")
    print(f"Status: {status} | IP: {ip or 'assigning...'}")
    if status == "running" and ip:
        print(f"\nComfyUI live at: http://{ip}:8188")
        print(f"SSH command: ssh -i {key_path} ubuntu@{ip}")
        break
    time.sleep(5)
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import * as fs from "fs";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function launchComfyUIWorker() {
  // 1. Preflight wallet eligibility (requires pure USD wallet balance)
  const elig = await client.get("/compute/v1/instances/eligibility");
  console.log(`Eligible: ${elig.data.allowed} ($${elig.data.wallet_balance} USD available)`);
  if (!elig.data.allowed) {
    throw new Error(elig.data.message);
  }

  // 2. Launch instance
  const res = await client.post("/compute/v1/instances", {
    name: "ts-comfyui-node",
    catalog_id: "g5.xlarge",
    spot_instance: true,
    max_runtime_hours: 6,
    root_volume_type: "gp3",
    root_volume_size_gb: 150,
    os_image: "ubuntu-2204-lts",
    install_presets: ["docker"],
    security_group_rules: [
      { protocol: "tcp", port: 22, cidr: "0.0.0.0/0", description: "SSH" },
      { protocol: "tcp", port: 8188, cidr: "0.0.0.0/0", description: "ComfyUI" }
    ],
    startup_script: `#!/bin/bash
    docker run -d --gpus all -p 8188:8188 --name comfyui \
      yanwk/comfyui-boot:latest
    `
  });

  const instanceId = res.data.instance.id;
  console.log("Instance provisioned:", instanceId);

  // 3. Fetch SSH Key
  const keyRes = await client.get(`/compute/v1/instances/${instanceId}/ssh-key`);
  fs.writeFileSync("worker_key.pem", keyRes.data.private_key, { mode: 0o400 });
  console.log("Saved worker_key.pem");
}

launchComfyUIWorker();
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type ProvisionRequest struct {
	Name             string                   `json:"name"`
	CatalogID        string                   `json:"catalog_id"`
	SpotInstance     bool                     `json:"spot_instance"`
	MaxRuntimeHours  int                      `json:"max_runtime_hours"`
	RootVolumeSizeGB int                      `json:"root_volume_size_gb"`
	SecurityRules    []map[string]interface{} `json:"security_group_rules"`
}

func main() {
	payload := ProvisionRequest{
		Name:             "go-worker-a10g",
		CatalogID:        "g5.xlarge",
		SpotInstance:     true,
		MaxRuntimeHours:  12,
		RootVolumeSizeGB: 100,
		SecurityRules: []map[string]interface{}{
			{"protocol": "tcp", "port": 22, "cidr": "0.0.0.0/0"},
			{"protocol": "tcp", "port": 8000, "cidr": "0.0.0.0/0"},
		},
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println("Provisioning result:", string(respBody))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/instances   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "name": "cli-a10g-node",
    "catalog_id": "g5.xlarge",
    "spot_instance": true,
    "max_runtime_hours": 4,
    "root_volume_type": "gp3",
    "root_volume_size_gb": 100,
    "security_group_rules": [
      {"protocol": "tcp", "port": 22, "cidr": "0.0.0.0/0"},
      {"protocol": "tcp", "port": 8188, "cidr": "0.0.0.0/0"}
    ]
  }'
```

:::

---

## Provisioning Guide: Deploying vLLM LLM Engine

Deploy high-throughput inference for open-weights models (such as `Qwen/Qwen2.5-7B-Instruct` or `deepseek-ai/DeepSeek-R1-Distill-Qwen-8B`) with an OpenAI-compatible API endpoint:

```bash
curl -X POST https://apis.fotohub.app/compute/v1/instances   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "name": "vllm-openai-server",
    "catalog_id": "g5.2xlarge",
    "spot_instance": true,
    "max_runtime_hours": 12,
    "root_volume_type": "gp3",
    "root_volume_size_gb": 200,
    "security_group_rules": [
      {"protocol": "tcp", "port": 22, "cidr": "0.0.0.0/0"},
      {"protocol": "tcp", "port": 8000, "cidr": "0.0.0.0/0"}
    ],
    "startup_script": "#!/bin/bash
docker run -d --gpus all -p 8000:8000 --ipc=host --name vllm vllm/vllm-openai:latest --model Qwen/Qwen2.5-7B-Instruct --port 8000"
  }'
```

Once running, query the instance directly using standard OpenAI client libraries:

```python
from openai import OpenAI

# Connect directly to your GPU node IP (e.g. assigned Elastic IP)
client = OpenAI(
    base_url="http://18.197.82.14:8000/v1",
    api_key="none"
)

completion = client.chat.completions.create(
    model="Qwen/Qwen2.5-7B-Instruct",
    messages=[{"role": "user", "content": "Explain quantum computing in 3 sentences."}]
)
print(completion.choices[0].message.content)
```

---

## Remote Script Execution (`POST /run-script`)

Execute ad-hoc maintenance or orchestration scripts without opening an interactive SSH session:

```bash
curl -X POST https://apis.fotohub.app/compute/v1/instances/inst_9a8b7c/run-script   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "script": "nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu,memory.total,memory.used --format=csv,noheader"
  }'
```

---

## CloudWatch Metrics & Health Telemetry

Monitor hardware pressure, VRAM allocation, and network spikes in 5-minute aggregation buckets:

```bash
curl -X GET "https://apis.fotohub.app/compute/v1/instances/inst_9a8b7c/metrics?period=300&hours=4"   -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

### Inspecting Serial Console Output

When debugging boot failures, kernel panics, or cloud-init startup scripts:

```bash
curl -X GET "https://apis.fotohub.app/compute/v1/instances/inst_9a8b7c/logs?lines=50" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

---

## Dynamic Vertical Resizing (`POST /resize`)

Upgrade or downgrade compute hardware without reconfiguring operating systems, reinstalling CUDA libraries, or re-downloading model weights.

### Zero-Data-Loss Resizing Workflow

1. Stop the instance:
   ```bash
   curl -X POST https://apis.fotohub.app/compute/v1/instances/inst_9a8b7c/stop \
     -H "Authorization: Bearer $FOTOHUB_API_KEY"
   ```
2. Resize to higher-spec catalog tier (e.g. upgrading to `g5.2xlarge` for 8 vCPUs and 32 GB RAM):
   ```bash
   curl -X POST https://apis.fotohub.app/compute/v1/instances/inst_9a8b7c/resize \
     -H "Authorization: Bearer $FOTOHUB_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"instance_type": "g5.2xlarge"}'
   ```
3. Restart instance:
   ```bash
   curl -X POST https://apis.fotohub.app/compute/v1/instances/inst_9a8b7c/start \
     -H "Authorization: Bearer $FOTOHUB_API_KEY"
   ```

All root disk files, conda environments, and attached EBS volumes are preserved identically.

---

## Pre-Launch Cost Estimator API

Before provisioning instances, query exact financial projections based on disk allocations and spot selections:

### Endpoint: `POST /compute/v1/instances/estimate-cost`

```bash
curl -X POST https://apis.fotohub.app/compute/v1/instances/estimate-cost \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "catalog_id": "g5.xlarge",
    "spot_instance": true,
    "root_volume_size_gb": 120,
    "additional_volume_size_gb": 200,
    "max_runtime_hours": 24
  }'
```

#### Response Example

```json
{
  "currency": "USD",
  "instance_hourly_rate": 0.383,
  "storage_hourly_rate": 0.035,
  "total_hourly_rate": 0.418,
  "max_cost_limit": 10.032,
  "savings_percentage": 62.1,
  "wallet_balance_sufficient": true
}
```

