# FOTOhub Cloud Computing API

The FOTOhub Cloud Computing API provides programmatic access to our enterprise-grade compute infrastructure. It allows you to provision, monitor, and manage GPU and CPU instances, block storage, network interfaces, and security groups on demand.

Our infrastructure is built on top of AWS, offering raw access to high-performance EC2 instances, Firecracker microVMs, and EBS volumes, all managed through a unified, developer-friendly FOTOhub API.

::: info
**Base URL:** `https://apis.fotohub.app/compute/v1`
**Sandbox URL:** `https://apis.fotohub.app/sandbox/exec-python`
**Primary Region:** `eu-central-1` (Frankfurt)
:::

## Architecture Overview

```ascii
+-------------------+       +-----------------------+       +-------------------+
|                   |       |                       |       |                   |
|  Developer / API  +-----> |  FOTOhub API Gateway  +-----> |  Compute Service  |
|                   |       |  (apis.fotohub.app)   |       |  (Port 8801)      |
+-------------------+       +-----------+-----------+       +---------+---------+
                                        |                             |
                                        v                             v
                            +-----------+-----------+       +---------+---------+
                            |                       |       |                   |
                            | Firecracker MicroVM   |       |  AWS Infrastructure|
                            | (Sandbox Exec)        |       |  (EC2, EBS, VPC)  |
                            |                       |       |                   |
                            +-----------------------+       +-------------------+
```

## Authentication

All endpoints (except otherwise noted) require authentication via an API Key. Include the key in the `Authorization` header of your HTTP requests as a Bearer token.

```http
Authorization: Bearer fh_live_YOUR_API_KEY
```

::: warning
If the API key is missing or invalid, the API will return a `401 Unauthorized` response.
:::

## Billing & Wallet

FOTOhub Compute operates strictly on a **prepaid wallet** model. All costs are calculated and deducted in **USD** (`user_balance.available_usd`).

- **Minimum Balance:** You must have at least **$0.50 USD** in your wallet to provision a new instance.
- **Hourly Billing:** Instances are billed per hour or partial hour they are running. Stopped instances only incur charges for attached EBS volumes and Elastic IPs.
- **Auto-Stop:** If your wallet balance drops below $0.00 USD, running instances will be automatically stopped (not terminated). You will be notified via email.

::: tip
Use the `/instances/eligibility` endpoint before provisioning to ensure your wallet has sufficient funds and you have not reached your instance quotas.
:::

## Limits & Quotas

| Resource | Default Quota | Description |
|----------|---------------|-------------|
| Active Instances | 5 | Maximum number of running or stopped instances per user. |
| Total EBS Volumes | 10 | Maximum number of attached or detached EBS volumes. |
| Max Volume Size | 4096 GB | Maximum size for a single root or additional volume. |
| Security Groups | 10 | Maximum number of custom security groups. |
| Elastic IPs | 2 | Maximum number of allocated Elastic IPs. |

## Reference Tables

### EBS Volume Types

| Type | Name | Use Case | Baseline Price (USD/GB-mo) |
|------|------|----------|----------------------------|
| `gp3` | General Purpose SSD | Boot volumes, balanced performance | $0.08 |
| `io2` | Provisioned IOPS SSD | High-performance DBs, ML cache | $0.125 |

### OS Images

| ID | Name | Description |
|----|------|-------------|
| `ubuntu-2204-lts` | Ubuntu 22.04 LTS | Standard Ubuntu image. |
| `ubuntu-2404-lts` | Ubuntu 24.04 LTS | Latest Ubuntu LTS release. |
| `deep-learning-ami` | AWS Deep Learning AMI | Pre-installed PyTorch, TensorFlow, CUDA. |
| `fotohub-ml` | FOTOhub ML Stack | Optimized FOTOhub image for fast model training. |

### Available Instance Types Catalog (Partial)

| Family | Instance Type | vCPU | RAM (GB) | GPU | VRAM | Hourly (USD) |
|--------|---------------|------|----------|-----|------|--------------|
| G5 | `g5.xlarge` | 4 | 16 | 1x NVIDIA A10G | 24GB | $0.38 |
| G5 | `g5.2xlarge` | 8 | 32 | 1x NVIDIA A10G | 24GB | $0.76 |
| G4dn | `g4dn.xlarge`| 4 | 16 | 1x NVIDIA T4 | 16GB | $0.20 |
| C5 | `c5.large` | 2 | 4 | None | N/A | $0.08 |

## Instance Lifecycle

```ascii
[ Provision Request ] ---> ( Pending ) ---> ( Running )
                                 |               |
                                 v               |
                           ( Failed )            |---> [ Stop Request ] ---> ( Stopping ) ---> ( Stopped )
                                                 |                                                |
                                                 |                                                |---> [ Start Request ] ---> ( Pending ) ---> ( Running )
                                                 v
                                        [ Terminate Request ] ---> ( Terminating ) ---> ( Terminated )
```

## Real-world Patterns

### 1. Polling for Running Status
When you provision an instance, it enters the `pending` state. You should poll the `/instances/:id` endpoint until `status` is `running`.

### 2. Spot Instance Interruption
Spot instances (`spot_instance: true`) can save you up to 70% in costs, but they can be interrupted. Monitor the instance state; if it transitions to `stopped` unexpectedly, it may have been reclaimed.

### 3. SSH Automation
Download the SSH key via `/instances/:id/ssh-key` immediately after the instance is `running`. Set its permissions to `600` before using it with ssh.

---

## API Endpoints Reference

### 1. Catalog

#### List Catalog
`GET /catalog`
Returns a list of all 22 active instance types.

**Response (200 OK):**
```json
{
  "machines": [
    {
      "id": "dea56b26-a8d9-4243-a2a5-82d325407a46",
      "instance_type": "g5.xlarge",
      "name": "NVIDIA A10G 24GB — g5.xlarge",
      "vcpu": 4,
      "ram_gb": 16,
      "vram": "24GB GDDR6",
      "gpu": "NVIDIA A10G",
      "gpu_count": 1,
      "hourly_rate_usd": 0.38,
      "spot_price_usd": 0.15,
      "currency": "USD",
      "is_active": true
    }
  ]
}
```

:::code-group
```python [Python]
import requests
headers = {"Authorization": "Bearer fh_live_YOUR_API_KEY"}
res = requests.get("https://apis.fotohub.app/compute/v1/catalog", headers=headers)
print(res.json())
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/catalog', {
  headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' }
});
const data = await response.json();
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/catalog", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/catalog"   -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

#### Single Instance Type Details
`GET /catalog/:id`

### 2. Instances (Core CRUD)

#### Check Eligibility
`GET /instances/eligibility`
Check if you have the minimum $0.50 USD balance and haven't exceeded instance limits.

**Response (200 OK):**
```json
{
  "allowed": true,
  "reason": null,
  "wallet_balance": 26.54,
  "wallet_currency": "USD",
  "min_balance_usd": 0.50,
  "instance_count": 0,
  "max_instances": 5
}
```

#### List Instances
`GET /instances`
Returns a list of your instances.

#### Provision Instance
`POST /instances`

**Request Body Schema:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `catalog_id` | string | Yes | - | UUID or instance type (e.g., `g5.xlarge`) |
| `name` | string | Yes | - | Display name |
| `region` | string | No | `eu-central-1` | AWS Region |
| `availability_zone` | string | No | `eu-central-1a` | AWS AZ |
| `max_runtime_hours` | int | No | 24 | Auto-terminate after X hours (1-720) |
| `root_volume_type` | string | No | `gp3` | `gp3` or `io2` |
| `root_volume_size_gb` | int | No | 50 | Root disk size (10-4096) |
| `additional_volumes` | list | No | [] | Array of volume config objects |
| `os_image` | string | Yes | - | OS image ID |
| `startup_script` | string | No | "" | Cloud-init bash script |
| `install_presets` | list | No | [] | e.g. `["docker", "python-ml"]` |
| `spot_instance` | bool | No | false | Request spot instance |
| `ssh_key_name` | string | No | "" | Empty to auto-generate |
| `security_group_rules` | list | No | [] | Array of rule objects |
| `labels` | dict | No | {} | Key-value tags |
| `attached_bucket_id` | string | No | "" | UUID of FOTOhub S3 bucket |

**Example Request:**
```json
{
  "catalog_id": "g5.xlarge",
  "name": "ml-training-node",
  "os_image": "ubuntu-2204-lts",
  "spot_instance": true,
  "root_volume_size_gb": 100
}
```

::: tip
Using `spot_instance: true` is highly recommended for fault-tolerant workloads to significantly reduce USD costs.
:::

#### Cost Estimator
`POST /instances/estimate`
Calculate projected costs before provisioning.

**Response (200 OK):**
```json
{
  "estimate": {
    "machine_per_hour": 0.3800,
    "ebs_per_hour": 0.0164,
    "network_per_hour": 0.0,
    "total_per_hour": 0.3964,
    "total_estimated_cost_usd": 3.9640,
    "hourly_rate_usd": 0.3964,
    "spot_discount_pct": 61,
    "currency": "USD",
    "session_hours": 10
  }
}
```

#### Instance Details
`GET /instances/:id`

#### Full Instance Details (with AWS metadata)
`GET /instances/:id/full`

#### Start Instance
`POST /instances/:id/start`

#### Stop Instance
`POST /instances/:id/stop`
Stops the instance. EBS volume charges still apply.

#### Reboot Instance
`POST /instances/:id/reboot`

#### Terminate Instance
`POST /instances/:id/terminate`
Irreversible. Deletes the instance and root volume.

#### Resize Instance
`POST /instances/:id/resize`
Change instance type (must be stopped first).

### 3. Monitoring

#### Get Metrics
`GET /instances/:id/metrics`

#### Status Checks
`GET /instances/:id/status-checks`

#### Performance Insights
`GET /instances/:id/insights`

#### Get Logs
`GET /instances/:id/logs`

#### Raw Console Output
`GET /instances/:id/console-output`

### 4. SSH & Access

#### Download SSH Key
`GET /instances/:id/ssh-key`

#### Regenerate SSH Key
`POST /instances/:id/ssh-key/regenerate`

#### Network Interfaces
`GET /instances/:id/network`

### 5. Networking

#### Allocate & Associate Elastic IP
`POST /instances/:id/elastic-ip`

#### Release Elastic IP
`DELETE /instances/:id/elastic-ip`

#### List Security Groups
`GET /instances/:id/security-groups`

#### Add Security Rule
`POST /instances/:id/security-rules`

#### Remove Security Rule
`DELETE /instances/:id/security-rules`

#### Map Subdomain
`POST /instances/:id/domain`

#### Unmap Domain
`DELETE /instances/:id/domain`

### 6. Remote Scripts

#### List Presets
`GET /scripts`

#### Run Script
`POST /instances/:id/run-script`

#### Poll Script Result
`GET /instances/:id/script-result/:command_id`

### 7. Snapshots & Images

#### Snapshot Root Volume
`POST /instances/:id/snapshot`

#### List Snapshots
`GET /snapshots`

#### Delete Snapshot
`DELETE /snapshots/:snapshot_id`

#### Restore Snapshot
`POST /snapshots/:snapshot_id/restore`

#### Create Custom AMI
`POST /instances/:id/image`

#### List Custom AMIs
`GET /images`

#### Deregister AMI
`DELETE /images/:image_id`

### 8. Tags

#### List Tags
`GET /instances/:id/tags`

#### Set/Update Tags
`PUT /instances/:id/tags`

#### Remove Tags
`DELETE /instances/:id/tags`

### 9. Volumes

#### Attach Volume
`POST /instances/:id/volumes`

#### List Attached Volumes
`GET /instances/:id/volumes`

#### Update Volume
`PUT /instances/:id/volumes/:volume_id`

#### Detach Volume
`DELETE /instances/:id/volumes/:volume_id`

### 10. Infrastructure (AWS Sub-routes)
Located at `/compute/v1/aws/`

- **VPCs:** `GET /vpcs`
- **Subnets:** `GET /subnets`
- **Security Groups:** `GET /security-groups`, `POST /security-groups`, `DELETE /security-groups/:sg_id`
- **Load Balancers:** `POST /load-balancers`, `GET /load-balancers`, `DELETE /load-balancers`
- **Target Groups:** `POST /target-groups`, `GET /target-groups`, `DELETE /target-groups`, `POST /target-groups/register`, `POST /target-groups/deregister`
- **Auto Scaling:** `POST /auto-scaling`, `GET /auto-scaling`, `PUT /auto-scaling/:name`, `DELETE /auto-scaling/:name`
- **Alarms:** `GET /alarms`, `POST /alarms`, `DELETE /alarms/:alarm_name`
- **S3:** `POST /s3/buckets`, `GET /s3/buckets`
- **Access Keys:** `POST /access-keys`, `GET /access-keys`, `DELETE /access-keys/:key_id`

### 11. DNS

- **Zones:** `GET /dns/zones`, `POST /dns/zones`, `GET /dns/zones/:zone_id`, `DELETE /dns/zones/:zone_id`, `POST /dns/zones/:zone_id/verify`
- **Records:** `GET /dns/zones/:zone_id/records`, `POST /dns/zones/:zone_id/records`, `DELETE /dns/zones/:zone_id/records`
- **Actions:** `POST /dns/zones/:zone_id/point-to-instance`, `POST /dns/zones/:zone_id/setup-email`

### 12. Costs

#### Cost Forecast
`GET /costs/forecast?days=30`

#### Cost Breakdown
`GET /costs/breakdown?days=7`

### 13. Sandbox (Firecracker microVM)

FOTOhub provides a highly secure, isolated environment for executing untrusted Python code using AWS Firecracker microVMs.

`POST https://apis.fotohub.app/sandbox/exec-python`

**Request:**
```json
{
  "code": "import numpy as np
print(np.mean([1,2,3]))",
  "inputs": {},
  "timeout": 10
}
```

**Response (200 OK):**
```json
{
  "ok": true,
  "output": "2.0
",
  "error": null,
  "execution_ms": 21,
  "memory_mb": 45
}
```

::: tip
The sandbox has a strict default timeout of 10 seconds. Use it for data transformations, fast inference checks, or evaluating user-submitted code securely.
:::

#### Single Instance Type Details
`GET /catalog/:id`

Get specs for a single instance type.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/catalog/:id", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/catalog/:id', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/catalog/:id", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/catalog/:id" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List Instances
`GET /instances`

Returns a list of all instances associated with the user account.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/instances", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/instances", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/instances" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Instance Details
`GET /instances/:id`

Fetch current state and configuration of a specific instance.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/instances/:id", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/instances/:id", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/instances/:id" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Full Instance Details
`GET /instances/:id/full`

Fetch extensive details including raw AWS EC2 metadata.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/instances/:id/full", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/full', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/instances/:id/full", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/instances/:id/full" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Start Instance
`POST /instances/:id/start`

Start a stopped instance.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/instances/:id/start", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/start', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances/:id/start", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/instances/:id/start" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Stop Instance
`POST /instances/:id/stop`

Stop a running instance. EBS charges continue to apply.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/instances/:id/stop", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/stop', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances/:id/stop", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/instances/:id/stop" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Reboot Instance
`POST /instances/:id/reboot`

Reboot a running instance.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/instances/:id/reboot", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/reboot', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances/:id/reboot", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/instances/:id/reboot" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Terminate Instance
`POST /instances/:id/terminate`

Permanently delete an instance and its root volume.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/instances/:id/terminate", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/terminate', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances/:id/terminate", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/instances/:id/terminate" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Resize Instance
`POST /instances/:id/resize`

Change the instance type. The instance must be in a stopped state.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/instances/:id/resize", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/resize', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances/:id/resize", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/instances/:id/resize" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Get Metrics
`GET /instances/:id/metrics`

Retrieve CloudWatch CPU and Network metrics for the instance.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/instances/:id/metrics", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/metrics', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/instances/:id/metrics", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/instances/:id/metrics" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Status Checks
`GET /instances/:id/status-checks`

Retrieve AWS system and instance status checks.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/instances/:id/status-checks", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/status-checks', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/instances/:id/status-checks", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/instances/:id/status-checks" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Performance Insights
`GET /instances/:id/insights`

Get ML-driven performance insights and recommendations.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/instances/:id/insights", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/insights', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/instances/:id/insights", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/instances/:id/insights" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Get Logs
`GET /instances/:id/logs`

Retrieve standard console output logs.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/instances/:id/logs", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/logs', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/instances/:id/logs", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/instances/:id/logs" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Raw Console Output
`GET /instances/:id/console-output`

Get raw serial console output from the hypervisor.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/instances/:id/console-output", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/console-output', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/instances/:id/console-output", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/instances/:id/console-output" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Download SSH Key
`GET /instances/:id/ssh-key`

Download the private PEM key for SSH access.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/instances/:id/ssh-key", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/ssh-key', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/instances/:id/ssh-key", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/instances/:id/ssh-key" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Regenerate SSH Key
`POST /instances/:id/ssh-key/regenerate`

Rotate the SSH key for the instance.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/instances/:id/ssh-key/regenerate", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/ssh-key/regenerate', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances/:id/ssh-key/regenerate", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/instances/:id/ssh-key/regenerate" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Network Interfaces
`GET /instances/:id/network`

List ENIs and IP addresses attached to the instance.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/instances/:id/network", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/network', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/instances/:id/network", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/instances/:id/network" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Allocate Elastic IP
`POST /instances/:id/elastic-ip`

Allocate and associate a static Elastic IP.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/instances/:id/elastic-ip", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/elastic-ip', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances/:id/elastic-ip", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/instances/:id/elastic-ip" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Release Elastic IP
`DELETE /instances/:id/elastic-ip`

Disassociate and release the Elastic IP.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.delete("https://apis.fotohub.app/compute/v1/instances/:id/elastic-ip", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/elastic-ip', { method: 'DELETE', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/instances/:id/elastic-ip", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/compute/v1/instances/:id/elastic-ip" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List Security Groups
`GET /instances/:id/security-groups`

List attached security groups and rules.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/instances/:id/security-groups", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/security-groups', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/instances/:id/security-groups", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/instances/:id/security-groups" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Add Security Rule
`POST /instances/:id/security-rules`

Add an inbound or outbound network rule.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/instances/:id/security-rules", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/security-rules', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances/:id/security-rules", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/instances/:id/security-rules" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Remove Security Rule
`DELETE /instances/:id/security-rules`

Remove a network rule.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.delete("https://apis.fotohub.app/compute/v1/instances/:id/security-rules", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/security-rules', { method: 'DELETE', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/instances/:id/security-rules", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/compute/v1/instances/:id/security-rules" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Map Subdomain
`POST /instances/:id/domain`

Map a Route53 subdomain to the instance's public IP.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/instances/:id/domain", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/domain', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances/:id/domain", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/instances/:id/domain" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Unmap Domain
`DELETE /instances/:id/domain`

Remove the subdomain mapping.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.delete("https://apis.fotohub.app/compute/v1/instances/:id/domain", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/domain', { method: 'DELETE', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/instances/:id/domain", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/compute/v1/instances/:id/domain" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List Presets
`GET /scripts`

List available preset startup and operational scripts.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/scripts", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/scripts', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/scripts", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/scripts" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Run Script
`POST /instances/:id/run-script`

Execute a bash script on the instance via AWS SSM.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/instances/:id/run-script", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/run-script', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances/:id/run-script", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/instances/:id/run-script" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Poll Script Result
`GET /instances/:id/script-result/:command_id`

Get the status and output of an SSM script execution.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/instances/:id/script-result/:command_id", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/script-result/:command_id', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/instances/:id/script-result/:command_id", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/instances/:id/script-result/:command_id" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Snapshot Root Volume
`POST /instances/:id/snapshot`

Create an EBS snapshot of the root volume.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/instances/:id/snapshot", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/snapshot', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances/:id/snapshot", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/instances/:id/snapshot" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List Snapshots
`GET /snapshots`

List all user snapshots.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/snapshots", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/snapshots', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/snapshots", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/snapshots" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Delete Snapshot
`DELETE /snapshots/:snapshot_id`

Delete a specific snapshot.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.delete("https://apis.fotohub.app/compute/v1/snapshots/:snapshot_id", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/snapshots/:snapshot_id', { method: 'DELETE', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/snapshots/:snapshot_id", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/compute/v1/snapshots/:snapshot_id" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Restore Snapshot
`POST /snapshots/:snapshot_id/restore`

Restore a snapshot to a new EBS volume.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/snapshots/:snapshot_id/restore", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/snapshots/:snapshot_id/restore', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/snapshots/:snapshot_id/restore", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/snapshots/:snapshot_id/restore" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Create Custom AMI
`POST /instances/:id/image`

Create a custom Machine Image from the instance state.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/instances/:id/image", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/image', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances/:id/image", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/instances/:id/image" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List Custom AMIs
`GET /images`

List user's custom Machine Images.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/images", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/images', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/images", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/images" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Deregister AMI
`DELETE /images/:image_id`

Deregister a custom image.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.delete("https://apis.fotohub.app/compute/v1/images/:image_id", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/images/:image_id', { method: 'DELETE', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/images/:image_id", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/compute/v1/images/:image_id" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List Tags
`GET /instances/:id/tags`

List key-value tags attached to the instance.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/instances/:id/tags", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/tags', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/instances/:id/tags", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/instances/:id/tags" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Set/Update Tags
`PUT /instances/:id/tags`

Set or update instance tags.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.put("https://apis.fotohub.app/compute/v1/instances/:id/tags", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/tags', { method: 'PUT', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("PUT", "https://apis.fotohub.app/compute/v1/instances/:id/tags", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X PUT "https://apis.fotohub.app/compute/v1/instances/:id/tags" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Remove Tags
`DELETE /instances/:id/tags`

Remove specific tags from the instance.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.delete("https://apis.fotohub.app/compute/v1/instances/:id/tags", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/tags', { method: 'DELETE', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/instances/:id/tags", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/compute/v1/instances/:id/tags" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Attach Volume
`POST /instances/:id/volumes`

Provision and attach a new EBS volume.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/instances/:id/volumes", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/volumes', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/instances/:id/volumes", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/instances/:id/volumes" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List Attached Volumes
`GET /instances/:id/volumes`

List all volumes attached to the instance.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/instances/:id/volumes", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/volumes', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/instances/:id/volumes", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/instances/:id/volumes" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Update Volume
`PUT /instances/:id/volumes/:volume_id`

Modify volume size, IOPS, or throughput.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.put("https://apis.fotohub.app/compute/v1/instances/:id/volumes/:volume_id", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/volumes/:volume_id', { method: 'PUT', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("PUT", "https://apis.fotohub.app/compute/v1/instances/:id/volumes/:volume_id", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X PUT "https://apis.fotohub.app/compute/v1/instances/:id/volumes/:volume_id" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Detach Volume
`DELETE /instances/:id/volumes/:volume_id`

Detach and optionally delete an EBS volume.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.delete("https://apis.fotohub.app/compute/v1/instances/:id/volumes/:volume_id", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/instances/:id/volumes/:volume_id', { method: 'DELETE', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/instances/:id/volumes/:volume_id", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/compute/v1/instances/:id/volumes/:volume_id" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List VPCs
`GET /vpcs`

List VPCs in the account.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/vpcs", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/vpcs', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/vpcs", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/vpcs" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List Subnets
`GET /subnets`

List subnets.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/subnets", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/subnets', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/subnets", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/subnets" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List SGs
`GET /security-groups`

List security groups.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/security-groups", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/security-groups', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/security-groups", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/security-groups" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Create SG
`POST /security-groups`

Create a security group.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/security-groups", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/security-groups', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/security-groups", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/security-groups" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Delete SG
`DELETE /security-groups/:sg_id`

Delete a security group.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.delete("https://apis.fotohub.app/compute/v1/security-groups/:sg_id", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/security-groups/:sg_id', { method: 'DELETE', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/security-groups/:sg_id", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/compute/v1/security-groups/:sg_id" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Create LB
`POST /load-balancers`

Provision an Application Load Balancer.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/load-balancers", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/load-balancers', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/load-balancers", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/load-balancers" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List LBs
`GET /load-balancers`

List Load Balancers.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/load-balancers", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/load-balancers', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/load-balancers", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/load-balancers" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Delete LB
`DELETE /load-balancers`

Delete a Load Balancer.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.delete("https://apis.fotohub.app/compute/v1/load-balancers", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/load-balancers', { method: 'DELETE', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/load-balancers", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/compute/v1/load-balancers" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Create Target Group
`POST /target-groups`

Create a Target Group for LB.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/target-groups", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/target-groups', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/target-groups", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/target-groups" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List Target Groups
`GET /target-groups`

List Target Groups.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/target-groups", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/target-groups', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/target-groups", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/target-groups" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Delete Target Group
`DELETE /target-groups`

Delete a Target Group.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.delete("https://apis.fotohub.app/compute/v1/target-groups", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/target-groups', { method: 'DELETE', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/target-groups", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/compute/v1/target-groups" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Register Targets
`POST /target-groups/register`

Register instances to a Target Group.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/target-groups/register", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/target-groups/register', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/target-groups/register", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/target-groups/register" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Deregister Targets
`POST /target-groups/deregister`

Remove instances from a Target Group.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/target-groups/deregister", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/target-groups/deregister', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/target-groups/deregister", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/target-groups/deregister" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Create ASG
`POST /auto-scaling`

Create an Auto Scaling Group.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/auto-scaling", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/auto-scaling', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/auto-scaling", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/auto-scaling" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List ASGs
`GET /auto-scaling`

List Auto Scaling Groups.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/auto-scaling", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/auto-scaling', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/auto-scaling", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/auto-scaling" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Update ASG
`PUT /auto-scaling/:name`

Update ASG capacity.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.put("https://apis.fotohub.app/compute/v1/auto-scaling/:name", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/auto-scaling/:name', { method: 'PUT', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("PUT", "https://apis.fotohub.app/compute/v1/auto-scaling/:name", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X PUT "https://apis.fotohub.app/compute/v1/auto-scaling/:name" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Delete ASG
`DELETE /auto-scaling/:name`

Delete Auto Scaling Group.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.delete("https://apis.fotohub.app/compute/v1/auto-scaling/:name", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/auto-scaling/:name', { method: 'DELETE', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/auto-scaling/:name", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/compute/v1/auto-scaling/:name" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List Alarms
`GET /alarms`

List CloudWatch Alarms.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/alarms", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/alarms', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/alarms", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/alarms" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Create Alarm
`POST /alarms`

Create a CloudWatch Alarm.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/alarms", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/alarms', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/alarms", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/alarms" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Delete Alarm
`DELETE /alarms/:alarm_name`

Delete a CloudWatch Alarm.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.delete("https://apis.fotohub.app/compute/v1/alarms/:alarm_name", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/alarms/:alarm_name', { method: 'DELETE', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/alarms/:alarm_name", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/compute/v1/alarms/:alarm_name" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Create Bucket
`POST /s3/buckets`

Create an S3 Bucket.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/s3/buckets", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/s3/buckets', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/s3/buckets", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/s3/buckets" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List Buckets
`GET /s3/buckets`

List S3 Buckets.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/s3/buckets", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/s3/buckets', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/s3/buckets", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/s3/buckets" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Create Access Key
`POST /access-keys`

Create IAM Access Key.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/access-keys", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/access-keys', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/access-keys", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/access-keys" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List Access Keys
`GET /access-keys`

List IAM Access Keys.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/access-keys", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/access-keys', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/access-keys", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/access-keys" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Delete Access Key
`DELETE /access-keys/:key_id`

Delete IAM Access Key.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.delete("https://apis.fotohub.app/compute/v1/access-keys/:key_id", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/access-keys/:key_id', { method: 'DELETE', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/access-keys/:key_id", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/compute/v1/access-keys/:key_id" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List DNS Zones
`GET /dns/zones`

List Route53 Hosted Zones.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/dns/zones", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/dns/zones', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/dns/zones", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/dns/zones" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Create DNS Zone
`POST /dns/zones`

Create a new Hosted Zone.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/dns/zones", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/dns/zones', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/dns/zones", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/dns/zones" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Get DNS Zone
`GET /dns/zones/:zone_id`

Get details of a Hosted Zone.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/dns/zones/:zone_id", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/dns/zones/:zone_id', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/dns/zones/:zone_id", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/dns/zones/:zone_id" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Delete DNS Zone
`DELETE /dns/zones/:zone_id`

Delete a Hosted Zone.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.delete("https://apis.fotohub.app/compute/v1/dns/zones/:zone_id", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/dns/zones/:zone_id', { method: 'DELETE', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/dns/zones/:zone_id", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/compute/v1/dns/zones/:zone_id" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Verify DNS Zone
`POST /dns/zones/:zone_id/verify`

Verify domain ownership for Zone.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/verify", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/verify', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/verify", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/verify" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### List DNS Records
`GET /dns/zones/:zone_id/records`

List records in a Zone.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/records", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/records', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/records", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/records" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Create DNS Record
`POST /dns/zones/:zone_id/records`

Create a DNS record.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/records", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/records', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/records", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/records" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Delete DNS Record
`DELETE /dns/zones/:zone_id/records`

Delete a DNS record.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.delete("https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/records", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/records', { method: 'DELETE', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/records", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/records" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Point to Instance
`POST /dns/zones/:zone_id/point-to-instance`

Quick setup ALIAS to instance.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/point-to-instance", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/point-to-instance', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/point-to-instance", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/point-to-instance" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Setup Email Records
`POST /dns/zones/:zone_id/setup-email`

Setup standard MX/TXT records.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Request Body:**
```json
{
  "example_field": "value"
}
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.post("https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/setup-email", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/setup-email', { method: 'POST', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/setup-email", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/dns/zones/:zone_id/setup-email" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Cost Forecast
`GET /costs/forecast?days=30`

Get USD cost forecast.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/costs/forecast?days=30", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/costs/forecast?days=30', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/costs/forecast?days=30", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/costs/forecast?days=30" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

#### Cost Breakdown
`GET /costs/breakdown?days=7`

Get USD cost breakdown by service.

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `name` | string | Yes | Resource identifier. |

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Action completed successfully."
}
```

:::code-group
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/costs/breakdown?days=7", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```
```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/compute/v1/costs/breakdown?days=7', { method: 'GET', headers: { 'Authorization': 'Bearer fh_live_YOUR_API_KEY' } });
```
```go [Go]
req, _ := http.NewRequest("GET", "https://apis.fotohub.app/compute/v1/costs/breakdown?days=7", nil)
req.Header.Add("Authorization", "Bearer fh_live_YOUR_API_KEY")
res, _ := http.DefaultClient.Do(req)
```
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/costs/breakdown?days=7" -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
:::

---

