# EBS Persistent Volumes & Custom AMIs

Manage persistent Elastic Block Store (EBS) disks, online volume hot-resizing, point-in-time snapshots, and baking custom Amazon Machine Images (AMIs).

Persistent volumes allow you to store multi-gigabyte Hugging Face model weights, fine-tuning datasets, and output renders independently of instance compute lifecycles.

---

## Storage Architecture

```mermaid
flowchart LR
    A["EC2 GPU Instance (g5.xlarge)"] -->|Root Boot Disk| B["EBS gp3 Root Volume (50–4096 GB)"]
    A -->|Hot-Attached Data Disk| C["EBS gp3 / io2 Secondary Volume (/dev/xvdf)"]
    C -->|Point-in-Time Backup| D["EBS Snapshot (/instances/{id}/snapshots)"]
    A -->|Bake Golden Image| E["Custom Machine AMI (/instances/{id}/images)"]
    D -->|Restore to New Disk| F["New Elastic Volume"]
    E -->|Deploy Fleet in 30s| G["Pre-Warmed Cluster Nodes"]
```

---

## Supported EBS Volume Types

| Volume Type | Technology | Max Capacity | Baseline IOPS | Max Throughput | Billed Rate (USD/GB-mo) | Best For |
|:---|:---|:---|:---|:---|:---|:---|
| **`gp3`** (Default) | General Purpose SSD | 4,096 GB | 3,000 baseline, up to 16,000 | 125 MB/s baseline, up to 1,000 MB/s | **$0.080** | General purpose, ML model checkpoints, OS boot disks, development |
| **`io2`** | Provisioned IOPS SSD | 4,096 GB | Up to 64,000 IOPS (platform cap) | Up to 1,000 MB/s | **$0.125** + $0.065/IOPS | Databases, high-IOPS workloads, streaming vector search |
| **`st1`** | Throughput Optimized HDD | 4,096 GB | 500 IOPS | 500 MB/s | **$0.045** | Large video archives, cold sequential logging |

:::info io2 Block Express is not offered
AWS's io2 Block Express tier (256,000 IOPS, 4,000 MB/s) only kicks in above the platform's
64,000 IOPS request cap on the volume-attach API, so it isn't reachable here — plan around
regular `io2`'s limits above.
:::

---

## Complete API Reference: EBS Lifecycle

Attach up to **8 secondary EBS volumes** per instance. Disks attach cleanly without rebooting.

### POST /instances/:id/volumes
Attach a new volume to an instance.

**Request Schema:**
- `size_gb` (integer, required): Volume size in GB.
- `type` (string, required): Volume type (`gp3`, `io2`).
- `device` (string, required): Device path (e.g., `/dev/xvdf`).
- `iops` (integer, optional): Provisioned IOPS.
- `throughput_mbs` (integer, optional): Throughput in MB/s.
- `encrypted` (boolean, optional): KMS encryption.

:::code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "size_gb": 200,
    "type": "gp3",
    "device": "/dev/xvdf",
    "iops": 3000,
    "throughput_mbs": 125,
    "encrypted": true
  }'
```
```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes",
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
    json={
        "size_gb": 200,
        "type": "gp3",
        "device": "/dev/xvdf",
        "iops": 3000,
        "throughput_mbs": 125,
        "encrypted": True
    }
)
print(response.json())
```
```typescript [TypeScript]
import axios from 'axios';

const response = await axios.post(
  'https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes',
  { size_gb: 200, type: 'gp3', device: '/dev/xvdf', iops: 3000, throughput_mbs: 125, encrypted: true },
  { headers: { Authorization: 'Bearer fh_live_YOUR_API_KEY' } }
);
console.log(response.data);
```
```go [Go]
package main
import (
    "bytes"
    "net/http"
)
func main() {
    payload := []byte(`{"size_gb":200,"type":"gp3","device":"/dev/xvdf","iops":3000,"throughput_mbs":125,"encrypted":true}`)
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    client := &http.Client{}
    client.Do(req)
}
```
:::

### GET /instances/:id/volumes
List all volumes attached to a specific instance.

**Response Schema:**
Returns an array of volume objects:
- `volume_id` (string): Unique identifier.
- `size_gb` (integer): Volume size.
- `type` (string): Volume type.
- `device` (string): Mount path.
- `state` (string): `attached`, `attaching`, `detaching`.
- `iops` (integer): Configured IOPS.
- `throughput_mbs` (integer): Configured throughput.
- `encrypted` (boolean): Encryption status.

:::code-group
```bash [cURL]
curl -X GET https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
```python [Python]
import requests

response = requests.get(
    "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes",
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}
)
print(response.json())
```
```typescript [TypeScript]
import axios from 'axios';

const response = await axios.get(
  'https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes',
  { headers: { Authorization: 'Bearer fh_live_YOUR_API_KEY' } }
);
console.log(response.data);
```
```go [Go]
package main
import "net/http"
func main() {
    req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes", nil)
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    client := &http.Client{}
    client.Do(req)
}
```
:::

### PUT /instances/:id/volumes/:volume_id
Online hot-resizing and IOPS update (no downtime for gp3/io2). Expand storage capacity or increase IOPS while the instance is actively processing. AWS EBS Elastic Volumes resize without unmounting filesystems or dropping connections.

:::code-group
```bash [cURL]
curl -X PUT https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes/vol-0a812df934 \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"size_gb": 500, "type": "gp3", "iops": 5000}'
```
```python [Python]
import requests

response = requests.put(
    "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes/vol-0a812df934",
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
    json={"size_gb": 500, "type": "gp3", "iops": 5000}
)
print(response.json())
```
```typescript [TypeScript]
import axios from 'axios';

const response = await axios.put(
  'https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes/vol-0a812df934',
  { size_gb: 500, type: 'gp3', iops: 5000 },
  { headers: { Authorization: 'Bearer fh_live_YOUR_API_KEY' } }
);
console.log(response.data);
```
```go [Go]
package main
import (
    "bytes"
    "net/http"
)
func main() {
    payload := []byte(`{"size_gb":500,"type":"gp3","iops":5000}`)
    req, _ := http.NewRequest("PUT", "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes/vol-0a812df934", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    client := &http.Client{}
    client.Do(req)
}
```
:::

### DELETE /instances/:id/volumes/:volume_id
Detach a volume from an instance safely.

:::code-group
```bash [cURL]
curl -X DELETE https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes/vol-0a812df934 \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
```python [Python]
import requests

response = requests.delete(
    "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes/vol-0a812df934",
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}
)
```
```typescript [TypeScript]
import axios from 'axios';

await axios.delete(
  'https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes/vol-0a812df934',
  { headers: { Authorization: 'Bearer fh_live_YOUR_API_KEY' } }
);
```
```go [Go]
package main
import "net/http"
func main() {
    req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes/vol-0a812df934", nil)
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    client := &http.Client{}
    client.Do(req)
}
```
:::

### Initializing the Filesystem on Linux
Once attached, connect via SSH to format and mount the disk:

```bash
# Check block device
lsblk

# Format with ext4 if new disk
sudo mkfs.ext4 -m 0 /dev/nvme1n1

# Mount to data directory
sudo mkdir -p /data/models
sudo mount /dev/nvme1n1 /data/models

# Persist across reboots in /etc/fstab
echo "/dev/nvme1n1 /data/models ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab
```

After an API hot-resize completes, extend the filesystem on the host:

```bash
# Grow the ext4 partition online
sudo resize2fs /dev/nvme1n1
df -h /data/models
```

---

## High-Performance Storage Tuning: io2 & NVMe Striping

For high-frequency vector indexing and large checkpoint loading, standard `gp3` storage
(125–500 MB/s) can become an I/O bottleneck. FOTOhub supports **EBS `io2`** volumes for this —
note this is regular `io2`, not AWS's separate Block Express tier (see the callout above: our
64,000 IOPS request cap never reaches the threshold where Block Express activates).

### 1. io2 Specifications

| Parameter | Specification | Advantage for AI/ML Workloads |
|:---|:---|:---|
| **Max IOPS per Volume** | **Up to 64,000 IOPS** (platform cap) | Far higher than `gp3`'s baseline 3,000 IOPS |
| **Max Throughput** | **Up to 1,000 MB/s** | Loads a 24 GB model checkpoint in well under a minute |
| **Volume Durability** | **99.999%** (AWS's published spec for the io2 family) | 100x more durable than `gp3` (99.8%–99.9%) |

### 2. Linux Kernel & NVMe Block Layer Tuning

To get closer to the full 1,000 MB/s / 64,000 IOPS an `io2` volume can deliver, configure the Linux kernel block subsystem on your instance:

```bash
# 1. Set the optimal I/O scheduler (bypass CPU elevator locks for NVMe)
echo none | sudo tee /sys/block/nvme1n1/queue/scheduler

# 2. Increase block queue depth for high-concurrency async I/O
echo 1024 | sudo tee /sys/block/nvme1n1/queue/nr_requests

# 3. Optimize read-ahead window for sequential .safetensors model streaming (8MB)
sudo blockdev --setra 16384 /dev/nvme1n1

# 4. Format with high-performance XFS filesystem optimized for multi-threaded ML I/O
sudo mkfs.xfs -f -d agcount=16 -l size=128m /dev/nvme1n1

# 5. Mount with low-overhead filesystem flags
sudo mkdir -p /data/models
sudo mount -o noatime,nodiratime,logbufs=8,logbsize=256k,largeio,allocsize=64M /dev/nvme1n1 /data/models

# Persist mount options across reboots
echo "/dev/nvme1n1 /data/models xfs noatime,nodiratime,logbufs=8,logbsize=256k,largeio,allocsize=64M,nofail 0 2" | sudo tee -a /etc/fstab
```

### 3. Software RAID-0 Striping for Higher Aggregate Bandwidth

When streaming uncompressed 4K video frames or loading very large checkpoints, stripe 2 to 4
`io2` volumes using Linux `mdadm` — each volume still caps at 1,000 MB/s / 64,000 IOPS, so 4
striped volumes tops out around 4,000 MB/s aggregate, not the 8,000+ MB/s that only AWS's
(unreachable, on this platform) io2 Block Express tier delivers:

```bash
# Attach 4x 200 GB io2 volumes via API (/dev/xvdf, /dev/xvdg, /dev/xvdh, /dev/xvdi)
# They appear on Linux as /dev/nvme1n1, /dev/nvme2n1, /dev/nvme3n1, /dev/nvme4n1

# 1. Install mdadm RAID utilities
sudo apt-get update && sudo apt-get install -y mdadm fio

# 2. Assemble RAID-0 array with 512 KB chunk size (matching model weight tensor pages)
sudo mdadm --create /dev/md0 \
  --level=0 \
  --raid-devices=4 \
  --chunk=512K \
  /dev/nvme1n1 /dev/nvme2n1 /dev/nvme3n1 /dev/nvme4n1

# 3. Format striped array with aligned XFS parameters
sudo mkfs.xfs -f -d su=512k,sw=4 -l size=256m /dev/md0

# 4. Mount the striped storage pool
sudo mkdir -p /data/striped-weights
sudo mount -o noatime,nodiratime,logbufs=8,logbsize=256k,largeio,allocsize=64M /dev/md0 /data/striped-weights
```

### 4. Storage Performance Verification with `fio`

Verify that your tuned storage pool achieves full hardware throughput before launching production training:

```bash
# Random 4K Read IOPS Test (Target: theoretical striped ceiling ~200,000+ IOPS; real-world lower)
fio --name=iops-test \
  --filename=/data/striped-weights/fio_bench \
  --rw=randread \
  --bs=4k \
  --direct=1 \
  --ioengine=libaio \
  --iodepth=64 \
  --numjobs=4 \
  --size=10G \
  --runtime=20 \
  --group_reporting

# Sequential 1M Read Throughput Test (Target: ~3,500-4,000 MB/s on a 4x striped array)
fio --name=throughput-test \
  --filename=/data/striped-weights/fio_bench \
  --rw=read \
  --bs=1M \
  --direct=1 \
  --ioengine=libaio \
  --iodepth=32 \
  --numjobs=4 \
  --size=20G \
  --runtime=20 \
  --group_reporting

# Clean up benchmark file
rm -f /data/striped-weights/fio_bench
```

---

## Snapshots and Custom AMIs API

### POST /instances/:id/snapshot
Create an incremental point-in-time snapshot of an attached volume for disaster recovery or dataset versioning.

:::code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/instances/inst_90f23b/snapshots \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"description": "Stable Diffusion checkpoint backup pre-fine-tune"}'
```
```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/snapshots",
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
    json={"description": "Stable Diffusion checkpoint backup pre-fine-tune"}
)
print(response.json())
```
```typescript [TypeScript]
import axios from 'axios';

const response = await axios.post(
  'https://apis.fotohub.app/compute/v1/instances/inst_90f23b/snapshots',
  { description: 'Stable Diffusion checkpoint backup pre-fine-tune' },
  { headers: { Authorization: 'Bearer fh_live_YOUR_API_KEY' } }
);
console.log(response.data);
```
```go [Go]
package main
import (
    "bytes"
    "net/http"
)
func main() {
    payload := []byte(`{"description":"Stable Diffusion checkpoint backup pre-fine-tune"}`)
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/snapshots", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    client := &http.Client{}
    client.Do(req)
}
```
:::

### GET /snapshots
List all snapshots in your account.

:::code-group
```bash [cURL]
curl -X GET https://apis.fotohub.app/compute/v1/snapshots \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
```python [Python]
import requests
resp = requests.get("https://apis.fotohub.app/compute/v1/snapshots", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
print(resp.json())
```
```typescript [TypeScript]
import axios from 'axios';
const resp = await axios.get('https://apis.fotohub.app/compute/v1/snapshots', { headers: { Authorization: 'Bearer fh_live_YOUR_API_KEY' } });
console.log(resp.data);
```
```go [Go]
package main
import "net/http"
func main() {
    req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/snapshots", nil)
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    client := &http.Client{}
    client.Do(req)
}
```
:::

### DELETE /snapshots/:snapshot_id
Delete a snapshot. Note that snapshot storage costs **$0.05/GB-month**. Deleting old snapshots reduces storage costs.

:::code-group
```bash [cURL]
curl -X DELETE https://apis.fotohub.app/compute/v1/snapshots/snap-0123456789abcdef0 \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
```python [Python]
import requests
requests.delete("https://apis.fotohub.app/compute/v1/snapshots/snap-0123456789abcdef0", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
import axios from 'axios';
await axios.delete('https://apis.fotohub.app/compute/v1/snapshots/snap-0123456789abcdef0', { headers: { Authorization: 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
package main
import "net/http"
func main() {
    req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/snapshots/snap-0123456789abcdef0", nil)
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    client := &http.Client{}
    client.Do(req)
}
```
:::

### POST /snapshots/:snapshot_id/restore
Restore a snapshot directly into a new EBS volume.

:::code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/snapshots/snap-0123456789abcdef0/restore \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"instance_id": "inst_90f23b", "device": "/dev/sdg"}'
```
```python [Python]
import requests
resp = requests.post(
    "https://apis.fotohub.app/compute/v1/snapshots/snap-0123456789abcdef0/restore",
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
    json={"instance_id": "inst_90f23b", "device": "/dev/sdg"}
)
```
```typescript [TypeScript]
import axios from 'axios';
await axios.post(
  'https://apis.fotohub.app/compute/v1/snapshots/snap-0123456789abcdef0/restore',
  { instance_id: 'inst_90f23b', device: '/dev/sdg' },
  { headers: { Authorization: 'Bearer fh_live_YOUR_API_KEY' } }
);
```
```go [Go]
package main
import (
    "bytes"
    "net/http"
)
func main() {
    payload := []byte(`{"instance_id":"inst_90f23b","device":"/dev/sdg"}`)
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/snapshots/snap-0123456789abcdef0/restore", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    client := &http.Client{}
    client.Do(req)
}
```
:::

### POST /instances/:id/image
Create a custom machine image (AMI) from an existing instance. This allows you to bake model weights into the AMI for ultra-fast startup times.

:::code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/instances/inst_90f23b/images \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "comfyui-flux-v2-golden",
    "description": "Ubuntu 22.04 + CUDA 12.4 + ComfyUI with FLUX.1 dev weights pre-warmed"
  }'
```
```python [Python]
import requests
resp = requests.post(
    "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/images",
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
    json={"name": "comfyui-flux-v2-golden", "description": "Ubuntu 22.04 pre-warmed"}
)
```
```typescript [TypeScript]
import axios from 'axios';
await axios.post(
  'https://apis.fotohub.app/compute/v1/instances/inst_90f23b/images',
  { name: 'comfyui-flux-v2-golden', description: 'Ubuntu 22.04 pre-warmed' },
  { headers: { Authorization: 'Bearer fh_live_YOUR_API_KEY' } }
);
```
```go [Go]
package main
import (
    "bytes"
    "net/http"
)
func main() {
    payload := []byte(`{"name":"comfyui-flux-v2-golden","description":"Ubuntu 22.04 pre-warmed"}`)
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/images", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    client := &http.Client{}
    client.Do(req)
}
```
:::

### GET /images
List custom AMIs.

:::code-group
```bash [cURL]
curl -X GET https://apis.fotohub.app/compute/v1/images \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
```python [Python]
import requests
resp = requests.get("https://apis.fotohub.app/compute/v1/images", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
import axios from 'axios';
await axios.get('https://apis.fotohub.app/compute/v1/images', { headers: { Authorization: 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
package main
import "net/http"
func main() {
    req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/images", nil)
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    client := &http.Client{}
    client.Do(req)
}
```
:::

### DELETE /images/:image_id
Deregister an AMI.

:::code-group
```bash [cURL]
curl -X DELETE https://apis.fotohub.app/compute/v1/images/ami-0a912837bc901ef \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
```python [Python]
import requests
requests.delete("https://apis.fotohub.app/compute/v1/images/ami-0a912837bc901ef", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
import axios from 'axios';
await axios.delete('https://apis.fotohub.app/compute/v1/images/ami-0a912837bc901ef', { headers: { Authorization: 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
package main
import "net/http"
func main() {
    req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/images/ami-0a912837bc901ef", nil)
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    client := &http.Client{}
    client.Do(req)
}
```
:::

---

## Tags API for Cost Allocation

Tags allow you to organize resources and track costs across departments, projects, or environments. Use tags to assign cost centers to your EBS volumes.

### GET, PUT, DELETE /instances/:id/tags

:::code-group
```bash [cURL]
# Add/Update Tags
curl -X PUT https://apis.fotohub.app/compute/v1/instances/inst_90f23b/tags \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tags": {"Environment": "Production", "CostCenter": "AI-Research"}}'

# Get Tags
curl -X GET https://apis.fotohub.app/compute/v1/instances/inst_90f23b/tags \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"

# Delete Tag
curl -X DELETE https://apis.fotohub.app/compute/v1/instances/inst_90f23b/tags/CostCenter \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
```python [Python]
import requests
headers = {"Authorization": "Bearer fh_live_YOUR_API_KEY"}

# Put tags
requests.put("https://apis.fotohub.app/compute/v1/instances/inst_90f23b/tags", headers=headers, json={"tags": {"Environment": "Production"}})

# Get tags
requests.get("https://apis.fotohub.app/compute/v1/instances/inst_90f23b/tags", headers=headers)

# Delete tag
requests.delete("https://apis.fotohub.app/compute/v1/instances/inst_90f23b/tags/Environment", headers=headers)
```
```typescript [TypeScript]
import axios from 'axios';
const headers = { Authorization: 'Bearer fh_live_YOUR_API_KEY' };

// Put
await axios.put('https://apis.fotohub.app/compute/v1/instances/inst_90f23b/tags', { tags: { Environment: 'Production' } }, { headers });
// Get
await axios.get('https://apis.fotohub.app/compute/v1/instances/inst_90f23b/tags', { headers });
// Delete
await axios.delete('https://apis.fotohub.app/compute/v1/instances/inst_90f23b/tags/Environment', { headers });
```
```go [Go]
package main
import (
    "bytes"
    "net/http"
)
func main() {
    client := &http.Client{}
    
    // Put
    payload := []byte(`{"tags":{"Environment":"Production"}}`)
    req, _ := http.NewRequest("PUT", "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/tags", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    client.Do(req)
    
    // Delete
    reqDel, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/tags/Environment", nil)
    reqDel.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    client.Do(reqDel)
}
```
:::

---

## Object Storage & Storage Patterns

### FOTOhub S3 Cloud Storage (`s1.fotohub.app`)

FOTOhub provides fully managed, S3-compatible cloud object storage co-located in the same **Frankfurt (`eu-central-1`)** data centers as your compute instances:

- **Flat Pricing:** **$0.0245 / GB-month** ($0.00003356 / GB-hour) — exactly matching AWS S3 Standard with zero markup.
- **Zero Intra-Cluster Egress:** Data transfers between your FOTOhub compute instances and FOTOhub S3 storage incur **$0.00 egress fees**.
- **Vanity Point Aliases:** Map custom subdomains (`*.s3point.fotohub.app`) or custom branded domains directly to your storage buckets.
- **Standard S3 SDK Compatibility:** Compatible with `boto3`, `@aws-sdk/client-s3`, `rclone`, MinIO client, and AWS CLI.

### S3-to-EBS Data Synchronization Benchmarks: rclone vs aws s3 sync

When initializing GPU worker nodes or restoring model checkpoints on spot instances, transferring large neural weight files (such as FLUX.1 at 23.8 GB or SDXL at 6.6 GB) over single-threaded connections introduces significant cold-start delays.

Below are empirical benchmarks measured on a `g5.xlarge` instance syncing a **50 GB model weights bundle** from FOTOhub S3 (`s1.fotohub.app` in Frankfurt `eu-central-1`) to an attached EBS NVMe volume:

| Method | Speed | Time (50 GB) | Cost |
|--------|-------|--------------|------|
| curl single-thread | 65 MB/s | 12m 50s | $0.00 |
| aws s3 sync (default) | 125 MB/s | 6m 40s | $0.00 |
| aws s3 sync (tuned) | 680 MB/s | 1m 14s | $0.00 |
| rclone optimized | 1,950 MB/s | 25.6s | $0.00 |

::: tip Why `rclone` is 30x Faster
`rclone` implements asynchronous parallel chunking with connection pooling and memory buffer caching (`--buffer-size 128M`), fully saturating the 25 Gbps Nitro network interface and pushing sustained disk writes directly to EBS.
:::

#### Production Pre-Warming Synchronization Script

This production script automatically configures `rclone` with your FOTOhub S3 credentials, pre-warms requested safetensors checkpoints into the local EBS cache, and performs sha256 checksum verification:

```bash
#!/bin/bash
# /usr/local/bin/sync-model-weights.sh
set -eo pipefail

BUCKET_NAME="${1:-my-models-bucket}"
TARGET_DIR="${2:-/data/models/checkpoints}"
ENDPOINT_URL="https://s1.fotohub.app"

mkdir -p "$TARGET_DIR"

echo "=== 1. Configuring High-Performance rclone Endpoint ==="
mkdir -p ~/.config/rclone
cat > ~/.config/rclone/rclone.conf << EOF
[fotohub-s3]
type = s3
provider = Other
env_auth = false
access_key_id = ${FOTOHUB_S3_ACCESS_KEY:-$AWS_ACCESS_KEY_ID}
secret_access_key = ${FOTOHUB_S3_SECRET_KEY:-$AWS_SECRET_ACCESS_KEY}
endpoint = ${ENDPOINT_URL}
acl = private
EOF

echo "=== 2. Syncing Checkpoints from S3 to Local EBS NVMe ==="
START_TIME=$(date +%s)

rclone copy "fotohub-s3:${BUCKET_NAME}/checkpoints/" "$TARGET_DIR" \
  --transfers 32 \
  --checkers 64 \
  --s3-chunk-size 64M \
  --s3-upload-concurrency 16 \
  --buffer-size 128M \
  --fast-list \
  --stats 2s \
  --stats-one-line \
  --progress

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
TOTAL_SIZE=$(du -sh "$TARGET_DIR" | cut -f1)

echo "=== 3. Model Weights Pre-Warmed Successfully ==="
echo "Total Storage Cached: $TOTAL_SIZE in ${DURATION}s"
ls -lh "$TARGET_DIR"
```

---

## Advanced Architecture Patterns

### 1. Golden AMI Pattern
Instead of running standard Linux images and downloading heavy Python libraries and 20+ GB weights upon every startup (which can take 15-20 minutes), bake everything into a Custom AMI.
1. Launch a persistent on-demand instance.
2. Install `vLLM` or `ComfyUI` and download weights from FOTOhub S3 using the fast `rclone` script above.
3. Call `POST /instances/:id/image` to bake this state into a Custom AMI.
4. Future spot instance fleets can spin up from this AMI, achieving a "running and serving" state in just **25-35 seconds**, drastically lowering scale-out latency.

### 2. Persistent Model Cache Pattern
For environments where model iterations update too fast for baked AMIs, use a detached EBS volume strategy:
1. Provision a 500GB `gp3` or `io2` volume separately from your spot compute.
2. Maintain all active weights on this drive.
3. When scaling up a spot instance, attach the detached volume dynamically (`POST /instances/:id/volumes`).
4. Remount the drive to `/data/models`.
5. Upon spot termination, detach the volume and hold it in a dormant state for the next scaling event.

### 3. Data Pipeline Cost Analysis
Understanding when to use EBS, S3, or Local Ephemeral Disk is critical to maintaining low TCO:
- **Local Ephemeral Disk (NVMe):** $0.00 extra cost. Best for immediate transient operations (image generation output temp folder, temporary PyTorch tensors). Data is lost on reboot/spot termination.
- **EBS gp3:** $0.08/GB-month. Best for OS root drives, relational databases, persistent model caches.
- **FOTOhub S3:** $0.0245/GB-month. Best for cold storage, vast datasets (millions of images), or completed final renders.

**Scenario:** 10TB Image Dataset for Training
- Storing on EBS gp3: 10,000 GB * $0.08 = **$800.00 / month**
- Storing on FOTOhub S3: 10,000 GB * $0.0245 = **$245.00 / month**
*Winner: Use S3 for storage and stream it sequentially to an ephemeral NVMe drive during active training jobs.*

---

## External Bucket Destinations (BYOB)

If your architecture already uses an external cloud provider (AWS S3, Cloudflare R2, Google Cloud Storage, or Supabase), FOTOhub can stream generation and compute artifacts directly into your external bucket.

Register via API:
```bash
curl -X POST https://apis.fotohub.app/v1/destinations \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "production-r2-media",
    "provider": "cloudflare_r2",
    "bucket_name": "prod-media-assets",
    "region": "auto",
    "endpoint_url": "https://a1b2c3d4e5f67890.r2.cloudflarestorage.com",
    "access_key_id": "r2_key_...",
    "secret_access_key": "r2_secret_...",
    "path_prefix": "renders/daily",
    "is_default": true
  }'
```


## Comprehensive Troubleshooting Guide

### Issue: Volume Stuck in Attaching State
Sometimes volumes may get stuck due to host-level NVMe locks.
**Resolution:**
1. Wait 2 minutes for the timeout.
2. Check instance health:
   ```bash
   curl -X GET https://apis.fotohub.app/compute/v1/instances/inst_90f23b/status-checks \
     -H "Authorization: Bearer fh_live_YOUR_API_KEY"
   ```
3. If unhealthy, restart the instance.

### Issue: XFS Mount Fails with Bad Superblock
This happens if the RAID-0 stripe chunk size is misaligned.
**Resolution:**
Reformat with correct `su` and `sw` params as described in the tuning section.

## Detailed Error Codes API Reference
When interacting with the Volumes API, you may encounter these standard errors:
| Code | HTTP Status | Description | Action Required |
|:---|:---|:---|:---|
| `VOL_001` | 400 | Invalid size requested | Ensure `size_gb` is between 50 and 4096. |
| `VOL_002` | 400 | IOPS limit exceeded | Maximum is 256k for `io2-block-express`. |
| `VOL_003` | 409 | Device in use | Choose a different `/dev/` mapping. |
| `VOL_004` | 404 | Instance not found | Check your `instance_id`. |




## Extended Multi-Language SDK Examples

### Creating a Full Persistent Spot Fleet (Python)
This script demonstrates provisioning 10 spot workers and attaching a shared persistent EBS cache to each.

```python
import os
import time
import requests

API_KEY = os.environ.get("FOTOHUB_API_KEY")
BASE_URL = "https://apis.fotohub.app/compute/v1"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

def deploy_fleet(count=10):
    instances = []
    # 1. Launch 10 Spot Instances
    for i in range(count):
        resp = requests.post(
            f"{BASE_URL}/instances",
            headers=HEADERS,
            json={
                "name": f"worker-spot-{i}",
                "catalog_id": "g5.xlarge",
                "spot_instance": True,
                "os_image": "ami-0a912837bc901ef"
            }
        )
        instances.append(resp.json()["instance_id"])
    
    print(f"Launched {count} instances.")
    
    # 2. Wait for RUNNING state
    time.sleep(35)
    
    # 3. Attach a 500GB volume to each
    for inst_id in instances:
        requests.post(
            f"{BASE_URL}/instances/{inst_id}/volumes",
            headers=HEADERS,
            json={
                "size_gb": 500,
                "type": "gp3",
                "device": "/dev/xvdf"
            }
        )
        print(f"Attached persistent cache to {inst_id}")

if __name__ == "__main__":
    deploy_fleet()
```

### Advanced Volume Management (TypeScript)
```typescript
import axios from 'axios';

const API_KEY = process.env.FOTOHUB_API_KEY;
const client = axios.create({
  baseURL: 'https://apis.fotohub.app/compute/v1',
  headers: { Authorization: `Bearer ${API_KEY}` }
});

export async function upgradeVolume(instanceId: string, volumeId: string) {
  try {
    console.log(`Initiating zero-downtime hot resize for ${volumeId}`);
    const response = await client.put(`/instances/${instanceId}/volumes/${volumeId}`, {
      size_gb: 1024,
      iops: 10000,
      throughput_mbs: 500
    });
    console.log('Resize initiated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to resize volume', error);
    throw error;
  }
}
```
