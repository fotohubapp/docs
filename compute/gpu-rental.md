# GPU & CPU On-Demand Rental

Spin up dedicated NVIDIA A10G and T4 GPU nodes or scalable CPU instances in seconds via API, SDK, or cURL.

Rentals provide full root SSH access, persistent EBS volumes, customizable security groups, and automated software presets for ML inference (vLLM, ComfyUI, PyTorch) and backend services.

---

## Lifecycle API Summary

- **Base URL:** `https://apis.fotohub.app/compute/v1`
- **Authentication:** `Authorization: Bearer fh_live_...`

| Action | Endpoint | Description |
|:---|:---|:---|
| **Catalog** | `GET /catalog` | List real-time prices, availability zones, and specs |
| **Estimate** | `POST /instances/estimate` | Calculate hourly and total costs prior to launching |
| **Provision** | `POST /instances` | Spin up an on-demand or Spot instance |
| **Lifecycle** | `POST /instances/{id}/start|stop|reboot|terminate` | Control machine power state |
| **SSH Key** | `GET /instances/{id}/ssh-key` | Download injected private SSH `.pem` key |
| **Metrics** | `GET /instances/{id}/metrics` | Query CPU, GPU VRAM, disk IOPS, and network I/O |
| **Volumes** | `PUT /instances/{id}/volumes/{vol_id}` | Live resize volume capacity and IOPS |

---

## Provisioning an A10G Instance

::: code-group

```python [Python]
from fotohub import FotoHub
import os

client = FotoHub(api_key=os.environ["FOTOHUB_API_KEY"])

# 1. Provision an NVIDIA A10G (g5.xlarge) Spot instance with ComfyUI preset
instance = client.post("/compute/v1/instances", {
    "name": "sdxl-comfyui-worker",
    "catalog_id": "g5.xlarge",
    "region": "eu-central-1",
    "availability_zone": "eu-central-1a",
    "spot_instance": True,                 # 62% discount
    "max_runtime_hours": 6,                # Auto-stop after 6 hours
    "root_volume_type": "gp3",
    "root_volume_size_gb": 120,            # 120 GB for model checkpoints
    "os_image": "ubuntu-2204-lts",
    "install_presets": ["docker", "python-ml"],
    "startup_script": """#!/bin/bash
    # Pull ComfyUI container
    docker run -d --gpus all -p 8188:8188 --name comfyui \
      -v /data/models:/workspace/ComfyUI/models \
      yanwk/comfyui-boot:latest
    """,
    "security_group_rules": [
        {"protocol": "tcp", "port": 22, "cidr": "0.0.0.0/0", "description": "SSH"},
        {"protocol": "tcp", "port": 8188, "cidr": "0.0.0.0/0", "description": "ComfyUI Web"}
    ]
})

instance_id = instance["instance"]["id"]
print(f"Provisioning instance: {instance_id}")

# 2. Download private SSH key
ssh_key_data = client.get(f"/compute/v1/instances/{instance_id}/ssh-key")
with open("worker_key.pem", "w") as f:
    f.write(ssh_key_data["private_key"])
os.chmod("worker_key.pem", 0o400)

print("Saved worker_key.pem. Connect with:")
print(f"ssh -i worker_key.pem ubuntu@{instance['instance'].get('ip_address', '<PENDING_IP>')}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import * as fs from "fs";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function rentGpuNode() {
  // Provision g5.2xlarge with vLLM
  const res = await client.post("/compute/v1/instances", {
    name: "vllm-qwen-inference",
    catalog_id: "g5.2xlarge",
    region: "eu-central-1",
    spot_instance: false,                  // Dedicated on-demand
    max_runtime_hours: 12,
    root_volume_type: "gp3",
    root_volume_size_gb: 200,
    os_image: "ubuntu-2204-lts",
    install_presets: ["docker"],
    startup_script: `#!/bin/bash
    docker run -d --gpus all -p 8000:8000 --ipc=host \
      vllm/vllm-openai:latest \
      --model Qwen/Qwen2.5-7B-Instruct --port 8000
    `,
  });

  const instId = res.data.instance.id;
  console.log("Instance requested:", instId);

  // Download SSH Key
  const keyRes = await client.get(`/compute/v1/instances/${instId}/ssh-key`);
  fs.writeFileSync("vllm_key.pem", keyRes.data.private_key, { mode: 0o400 });
}

rentGpuNode();
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

func main() {
	payload := map[string]interface{}{
		"name":                "t4-inference-worker",
		"catalog_id":          "g4dn.xlarge",
		"spot_instance":       true,
		"max_runtime_hours":   4,
		"root_volume_size_gb": 100,
		"os_image":            "ubuntu-2204-lts",
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	data, _ := io.ReadAll(resp.Body)
	fmt.Println("Provisioning response:", string(data))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/instances \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "a10g-dev-machine",
    "catalog_id": "g5.xlarge",
    "region": "eu-central-1",
    "spot_instance": true,
    "max_runtime_hours": 8,
    "root_volume_size_gb": 100,
    "os_image": "ubuntu-2204-lts"
  }'
```

:::

---

## Volume Hot-Resizing & IOPS Modification

Increase disk capacity or switch volume types without rebooting or unmounting filesystems:

```bash
curl -X PUT https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes/vol-0a812df934 \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "size_gb": 250,
    "type": "gp3",
    "iops": 4000
  }'
```

---

## Health Monitoring & Telemetry

Retrieve CloudWatch CPU utilization, GPU memory pressure, and network IOPS aggregated over time:

```bash
curl -X GET "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/metrics?period=300&hours=2" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

Response:
```json
{
  "instance_id": "inst_90f23b",
  "period_seconds": 300,
  "metrics": {
    "cpu_utilization": [
      {"timestamp": "2026-09-06T15:00:00Z", "value": 14.2},
      {"timestamp": "2026-09-06T15:05:00Z", "value": 89.6}
    ],
    "network_in_bytes": [
      {"timestamp": "2026-09-06T15:00:00Z", "value": 4129401}
    ]
  }
}
```
