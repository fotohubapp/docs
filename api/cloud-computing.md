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
The endpoint returns `gpu_catalog` rows verbatim, so the field names are the
table's own. Rates are **PLN per hour** — see the warning under
[Estimate Cost](#estimate-cost).

```json
{
  "catalog": [
    {
      "id": "g5.4xlarge",
      "name": "NVIDIA A10G 24GB (g5.4xlarge)",
      "vram": "24GB GDDR6",
      "hourly_rate_kr": 6.53,
      "spot_price_kr": 2.44,
      "is_active": true,
      "sort_order": 1
    },
    {
      "id": "g5.xlarge",
      "name": "NVIDIA A10G 24GB (g5.xlarge)",
      "vram": "24GB GDDR6",
      "hourly_rate_kr": 4.10,
      "spot_price_kr": 1.55,
      "is_active": true,
      "sort_order": 3
    },
    {
      "id": "g4dn.xlarge",
      "name": "NVIDIA T4 16GB (g4dn.xlarge)",
      "vram": "16GB GDDR6",
      "hourly_rate_kr": 2.14,
      "spot_price_kr": 0.80,
      "is_active": true,
      "sort_order": 4
    }
  ]
}
```

::: warning `hourly_rate_kr` is whole PLN per hour
Despite the `_kr` suffix — a legacy artefact of the original schema — this
column is **PLN/hour**, not a minor unit. Do not divide by 100. `6.53` means
6.53 PLN per hour. Use `spot_price_kr` when provisioning with
`spot_instance: true`; SKUs without one fall back to the on-demand rate.
:::

Only T4 and A10G accelerators are offered. There is no A100 or H100 tier.

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
    "machine_per_hour": 1.6512,
    "ebs_per_hour": 0.2663,
    "network_per_hour": 0.0,
    "total_per_hour": 1.9175,
    "total_per_day": 46.02,
    "total_per_month": 1399.78,
    "estimated_session": 46.02,
    "spot_discount_pct": 60,
    "currency": "PLN"
  }
}
```

::: warning Cloud compute is billed in PLN
Every other endpoint on this API bills your wallet in USD. GPU instances are
the exception: the compute engine quotes and charges in **PLN**, and the
`currency` field in the response says so. Read that field rather than assuming
a currency — do not convert these figures yourself, and do not compare them
directly against the USD prices elsewhere in this reference.
:::

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

- **Currency**: **PLN**, unlike the rest of this API. Instance hours come from
  `gpu_catalog.hourly_rate_kr` (PLN/h) and EBS storage is converted from its USD
  list price into PLN before being added to the total. Every cost response
  carries a `currency` field — read it rather than assuming.
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
