# Cloud Computing

Provision on-demand GPU and CPU instances directly from the FOTOhub platform. Run custom AI workloads, training jobs, or inference servers on real EC2 hardware with per-hour billing.

**Base URL:** `https://apis.fotohub.app/compute/v1`

---

## Architecture

FOTOhub Cloud Computing provides:
- Real AWS EC2 instances (GPU + CPU)
- Per-hour wallet-based billing
- Volume management (EBS gp3/io2)
- Real-time CloudWatch metrics
- SSH access with custom keys
- Spot instance support for cost savings

```
User → Compute Engine → AWS EC2 API → Instance
                      → CloudWatch (metrics)
                      → EBS (volumes)
                      → Billing Engine (hourly metering)
```

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/catalog` | List instance types |
| GET | `/catalog/:id` | Instance type details |
| POST | `/instances` | Provision instance |
| GET | `/instances` | List your instances |
| GET | `/instances/:id` | Instance details |
| POST | `/instances/:id/start` | Start stopped instance |
| POST | `/instances/:id/stop` | Stop (preserves state) |
| POST | `/instances/:id/reboot` | Reboot instance |
| POST | `/instances/:id/terminate` | Terminate (irreversible) |
| GET | `/instances/:id/metrics` | CPU/GPU/memory metrics |
| GET | `/instances/:id/logs` | Console output |
| POST | `/instances/estimate` | Cost estimator |
| POST | `/instances/:id/volumes` | Attach EBS volume |
| DELETE | `/instances/:id/volumes/:vol` | Detach volume |
| GET | `/instances/:id/volumes` | List volumes |

---

## GET /catalog

List available instance types with GPU specs, pricing, and availability.

**Response:**
```json
{
  "catalog": [
    {
      "id": "gpu-a10g-xlarge",
      "name": "GPU A10G XLarge",
      "category": "gpu",
      "instance_type": "g5.xlarge",
      "vcpus": 4,
      "memory_gb": 16,
      "gpu": "NVIDIA A10G",
      "gpu_memory_gb": 24,
      "storage_gb": 250,
      "price_per_hour_usd": 1.006,
      "price_per_hour_pln": 4.07,
      "spot_discount_pct": 60,
      "regions": ["eu-central-1", "us-east-1"],
      "available": true
    },
    {
      "id": "gpu-a100-xlarge",
      "name": "GPU A100 80GB",
      "category": "gpu",
      "instance_type": "p4d.24xlarge",
      "vcpus": 96,
      "memory_gb": 1152,
      "gpu": "NVIDIA A100 80GB x8",
      "gpu_memory_gb": 640,
      "price_per_hour_usd": 32.77,
      "available": true
    },
    {
      "id": "cpu-compute-large",
      "name": "Compute Optimized Large",
      "category": "cpu",
      "instance_type": "c6i.2xlarge",
      "vcpus": 8,
      "memory_gb": 16,
      "price_per_hour_usd": 0.34,
      "available": true
    }
  ]
}
```

---

## POST /instances

Provision a new cloud instance.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `catalog_id` | string | Yes | Instance type from catalog |
| `name` | string | Yes | Display name |
| `region` | string | No | AWS region (default: `eu-central-1`) |
| `availability_zone` | string | No | AZ (default: `eu-central-1a`) |
| `max_runtime_hours` | integer | No | Auto-terminate after N hours (default: 24) |
| `root_volume_type` | string | No | `gp3` \| `io2` (default: `gp3`) |
| `root_volume_size_gb` | integer | No | Root disk size (default: 50) |
| `additional_volumes` | array | No | Extra EBS volumes to attach |
| `os_image` | string | No | OS image (default: `ubuntu-2204-lts`) |
| `startup_script` | string | No | Cloud-init / user-data script |
| `spot_instance` | boolean | No | Use spot pricing (default: false) |
| `ssh_key_name` | string | No | SSH key pair name |
| `security_group_rules` | array | No | Custom inbound rules |
| `labels` | object | No | Custom key-value labels |
| `attached_bucket_id` | string | No | S3 bucket to mount |

### Example

::: code-group

```python [Python]
import httpx

response = httpx.post(
    "https://apis.fotohub.app/compute/v1/instances",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={
        "catalog_id": "gpu-a10g-xlarge",
        "name": "training-job-001",
        "region": "eu-central-1",
        "max_runtime_hours": 8,
        "root_volume_size_gb": 100,
        "os_image": "ubuntu-2204-lts",
        "startup_script": "#!/bin/bash\npip install torch transformers",
        "spot_instance": True,
        "labels": {"project": "fine-tuning", "model": "sdxl"}
    }
)

instance = response.json()["instance"]
print(f"Instance {instance['id']} provisioning...")
print(f"SSH: ssh -i key.pem ubuntu@{instance.get('public_ip')}")
```

```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    catalog_id: 'gpu-a10g-xlarge',
    name: 'inference-server',
    max_runtime_hours: 24,
    root_volume_size_gb: 200,
    startup_script: '#!/bin/bash\ndocker pull myregistry/model:latest\ndocker run -p 8080:8080 myregistry/model:latest',
    security_group_rules: [
      { protocol: 'tcp', port: 8080, cidr: '0.0.0.0/0' }
    ]
  })
});

const { instance } = await response.json();
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/instances \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "catalog_id": "gpu-a10g-xlarge",
    "name": "quick-job",
    "max_runtime_hours": 2,
    "spot_instance": true
  }'
```

:::

---

## POST /instances/estimate

Get a cost estimate before provisioning.

### Request

```json
{
  "catalog_id": "gpu-a10g-xlarge",
  "root_volume_type": "gp3",
  "root_volume_size_gb": 100,
  "additional_volume_size_gb": 500,
  "spot_instance": true,
  "max_runtime_hours": 24
}
```

### Response

```json
{
  "estimate": {
    "instance_cost_usd": 9.65,
    "instance_cost_pln": 39.08,
    "storage_cost_usd": 0.48,
    "storage_cost_pln": 1.94,
    "total_usd": 10.13,
    "total_pln": 41.02,
    "per_hour_usd": 0.42,
    "per_hour_pln": 1.71,
    "savings_vs_ondemand_pct": 60,
    "note": "Spot pricing, may be interrupted"
  }
}
```

---

## Instance Lifecycle

```
provisioning → running → stopping → stopped → starting → running
                    ↓                                        ↓
                terminating → terminated          terminating → terminated
```

### POST /instances/:id/stop

Stops the instance but preserves its EBS volumes. You're still billed for storage.

### POST /instances/:id/terminate

**Irreversible.** Destroys the instance and all non-persistent volumes.

---

## GET /instances/:id/metrics

Returns CloudWatch metrics for the instance.

```json
{
  "cpu_utilization": 45.2,
  "memory_utilization": 72.1,
  "gpu_utilization": 89.3,
  "gpu_memory_used_gb": 21.4,
  "network_in_mbps": 125.0,
  "network_out_mbps": 12.3,
  "disk_read_iops": 1500,
  "disk_write_iops": 800,
  "timestamp": "2026-07-18T12:00:00Z"
}
```

---

## Volumes

### Attach Volume

```
POST /instances/:id/volumes
```

```json
{
  "size_gb": 500,
  "type": "gp3",
  "device": "/dev/xvdf",
  "iops": 6000
}
```

### List Volumes

```
GET /instances/:id/volumes
```

```json
{
  "volumes": [
    {
      "volume_id": "vol-abc123",
      "size_gb": 500,
      "type": "gp3",
      "device": "/dev/xvdf",
      "state": "attached",
      "iops": 6000
    }
  ]
}
```

---

## Available Regions

| Region | Location | GPU Available |
|--------|----------|--------------|
| `eu-central-1` | Frankfurt, Germany | A10G, A100, T4 |
| `us-east-1` | Virginia, USA | A10G, A100, H100 |
| `us-west-2` | Oregon, USA | A10G, A100 |

---

## OS Images

| Image ID | Description |
|----------|-------------|
| `ubuntu-2204-lts` | Ubuntu 22.04 LTS (default) |
| `ubuntu-2404-lts` | Ubuntu 24.04 LTS |
| `deep-learning-ami` | AWS Deep Learning AMI (PyTorch, CUDA) |
| `fotohub-ml` | Pre-configured ML stack (PyTorch, HuggingFace, Jupyter) |

---

## Billing

- **On-demand**: Billed per hour, deducted from wallet
- **Spot**: Up to 60% cheaper, may be interrupted with 2-min warning
- **Storage**: EBS volumes billed per GB-month even when instance is stopped
- **Auto-terminate**: `max_runtime_hours` prevents runaway costs

Wallet balance is checked before provisioning. If balance is insufficient, the request returns HTTP 402.

---

## Limits

| Resource | Limit |
|----------|-------|
| Concurrent instances | 5 per user |
| Max runtime | 720 hours (30 days) |
| Max root volume | 2 TB |
| Max additional volumes | 10 per instance |
| Max volume size | 16 TB |
