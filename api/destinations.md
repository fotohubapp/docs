# Output Destinations (BYOB — Bring Your Own Bucket)

Customer-owned output destinations (`/v1/destinations`) allow you to attach external S3-compatible cloud storage buckets to your API keys. Everything your API key generates is automatically mirrored directly into infrastructure you control, pay for, and own.

FOTOhub supports Amazon S3, Cloudflare R2, Backblaze B2, DigitalOcean Spaces, Wasabi, and any custom S3-compatible host (such as MinIO), as well as FOTOhub-provisioned console buckets.

::: info Security Architecture & Envelope Encryption
Your customer credentials (Access Key ID and Secret Access Key) are envelope-encrypted with AWS KMS before storing. The secret access key is only decryptable by the internal `s3-engine` IAM user. Plaintext credentials never touch application logs or unencrypted database tables.
:::

---

## Provider Presets & Addressing

FOTOhub automatically resolves provider endpoint URLs and addressing styles (virtual-hosted vs. path-style).

| Provider ID | Provider Name | Default Endpoint Pattern | Addressing Style | Account ID Required |
|-------------|---------------|--------------------------|------------------|---------------------|
| `aws` | Amazon Web Services S3 | `https://s3.{region}.amazonaws.com` | Virtual-hosted | No |
| `r2` | Cloudflare R2 | `https://{account_id}.r2.cloudflarestorage.com` | Force path-style | **Yes** |
| `b2` | Backblaze B2 | `https://s3.{region}.backblazeb2.com` | Force path-style | No |
| `spaces` | DigitalOcean Spaces | `https://{region}.digitaloceanspaces.com` | Virtual-hosted | No |
| `wasabi` | Wasabi Hot Cloud | `https://s3.{region}.wasabisys.com` | Force path-style | No |
| `custom` | MinIO / Custom S3 | Custom `endpoint_url` | Force path-style | No |

---

## Plan Limits

The number of output destinations you can attach is gated by your subscription tier:

| Subscription Tier | Allowed Own Destinations |
|-------------------|:------------------------:|
| `free` | 1 |
| `developer` / `starter` | 3 |
| `startup` / `medium` | 5 |
| `pro` / `professional` / `business` / `enterprise` | 10 (s3-engine ceiling) |

Attempting to exceed your tier limit returns HTTP `403 Forbidden` with error code `plan_gate_exceeded`.

---

## Endpoints

### 1. List Provider Presets

Retrieve supported storage providers, regions, and configuration requirements. This endpoint requires no authentication.

```
GET /v1/destinations/presets
```

#### Response Example

```json
{
  "presets": [
    {
      "id": "aws",
      "label": "Amazon S3",
      "needs_account_id": false,
      "needs_endpoint": false,
      "force_path_style": false,
      "regions": ["eu-central-1", "eu-west-1", "us-east-1", "us-west-2", "ap-southeast-1"]
    },
    {
      "id": "r2",
      "label": "Cloudflare R2",
      "needs_account_id": true,
      "needs_endpoint": false,
      "force_path_style": true,
      "regions": ["auto"]
    },
    {
      "id": "b2",
      "label": "Backblaze B2",
      "needs_account_id": false,
      "needs_endpoint": false,
      "force_path_style": true,
      "regions": ["eu-central-003", "us-west-004", "us-east-005"]
    },
    {
      "id": "custom",
      "label": "S3-compatible (MinIO, other)",
      "needs_account_id": false,
      "needs_endpoint": true,
      "force_path_style": true,
      "regions": ["us-east-1"]
    }
  ]
}
```

::: code-group

```python [Python]
import requests

resp = requests.get("https://apis.fotohub.app/v1/destinations/presets")
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/destinations/presets");
const data = await resp.json();
console.log(data);
```

```go [Go]
package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	resp, err := http.Get("https://apis.fotohub.app/v1/destinations/presets")
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl https://apis.fotohub.app/v1/destinations/presets
```

:::

---

### 2. List Destinations

List all destinations owned by the authenticated account, including attached API keys and per-model routing rules.

```
GET /v1/destinations
```

#### Headers
- `Authorization: Bearer <session_jwt_or_api_key>`

#### Response Example

```json
{
  "destinations": [
    {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "name": "Production Cloudflare R2",
      "kind": "external_s3",
      "provider": "s3",
      "bucket_name": "my-company-assets",
      "region": "auto",
      "endpoint_url": "https://0123456789abcdef.r2.cloudflarestorage.com",
      "path_prefix": "generations/{YYYY}/{MM}/",
      "status": "active",
      "last_verified_at": "2026-09-01T10:00:00Z",
      "writes_total": 1420,
      "bytes_written": 5368709120,
      "last_write_at": "2026-09-06T14:22:10Z",
      "attached_keys": [
        {
          "id": "key_01928374",
          "name": "Backend Generator",
          "key_prefix": "fh_live_a1b2",
          "status": "active"
        }
      ],
      "attached_rules": [
        {
          "id": "rule_987654",
          "key_id": "key_01928374",
          "model_pattern": "seedance-2-0-*",
          "priority": 10
        }
      ]
    }
  ]
}
```

::: code-group

```python [Python]
import requests

headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}
resp = requests.get("https://apis.fotohub.app/v1/destinations", headers=headers)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/destinations", {
  headers: { Authorization: "Bearer YOUR_JWT_TOKEN" }
});
const data = await resp.json();
console.log(data);
```

```go [Go]
package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/destinations", nil)
	req.Header.Set("Authorization", "Bearer YOUR_JWT_TOKEN")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl https://apis.fotohub.app/v1/destinations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

:::

---

### 3. Create Output Destination

Attach an external bucket or internal console bucket. For `external_s3`, credentials are verified immediately via a probe object (`PUT` + `HEAD` + `DELETE`).

```
POST /v1/destinations
```

#### Parameters

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | **Yes** | — | Unique destination label (1–80 chars). |
| `kind` | string | No | `"external_s3"` | Destination kind: `"external_s3"` or `"console_bucket"`. |
| `bucket_id` | string (UUID) | Only for `console_bucket` | — | ID of a FOTOhub-provisioned bucket owned by caller. |
| `provider_preset` | string | No | `"aws"` | One of `aws`, `r2`, `b2`, `spaces`, `wasabi`, `custom`. |
| `bucket_name` | string | Required for `external_s3` | — | External bucket name (max 255 chars). |
| `region` | string | No | `"eu-central-1"` | S3 region or `"auto"` for R2. |
| `account_id` | string | Required for `r2` | — | Cloudflare Account ID. |
| `endpoint_url` | string | Required for `custom` | — | Custom S3 endpoint URL. |
| `force_path_style` | boolean | No | preset default | Force path style (`true`) or virtual hosted (`false`). |
| `path_prefix` | string | No | `""` | Base prefix template prepended to generated object keys. |
| `access_key_id` | string | Required for `external_s3` | — | S3 Access Key ID (encrypted with KMS). |
| `secret_access_key` | string | Required for `external_s3` | — | S3 Secret Access Key (encrypted with KMS). |

::: tip Path Prefix Templates
The `path_prefix` can contain dynamic tokens: `{model}`, `{date}`, `{YYYY}`, `{MM}`, `{DD}`, `{HH}`, `{mm}`, `{ss}`, `{job_id}`, `{user_id}`, `{ext}`, `{name}`, `{index}`.
Traversal sequences (`..`) and absolute paths (`/`) are rejected at save time.
:::

#### Request Example (Cloudflare R2)

```json
{
  "name": "Production R2 Bucket",
  "kind": "external_s3",
  "provider_preset": "r2",
  "account_id": "0123456789abcdef0123456789abcdef",
  "bucket_name": "company-renders",
  "region": "auto",
  "path_prefix": "exports/{YYYY}/{MM}/",
  "access_key_id": "9a8b7c6d5e4f3a2b1c0d",
  "secret_access_key": "1234567890abcdef1234567890abcdef12345678"
}
```

#### Response Example

```json
{
  "id": "d8e3b5e1-64d8-4f24-9b55-d14c27a92288",
  "name": "Production R2 Bucket",
  "kind": "external_s3",
  "provider": "s3",
  "bucket_name": "company-renders",
  "region": "auto",
  "endpoint_url": "https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com",
  "path_prefix": "exports/{YYYY}/{MM}/",
  "status": "active",
  "last_verified_at": "2026-09-06T15:30:00Z"
}
```

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json",
}
payload = {
    "name": "Production R2 Bucket",
    "kind": "external_s3",
    "provider_preset": "r2",
    "account_id": "0123456789abcdef0123456789abcdef",
    "bucket_name": "company-renders",
    "region": "auto",
    "path_prefix": "exports/{YYYY}/{MM}/",
    "access_key_id": "9a8b7c6d5e4f3a2b1c0d",
    "secret_access_key": "1234567890abcdef1234567890abcdef12345678",
}

resp = requests.post("https://apis.fotohub.app/v1/destinations", headers=headers, json=payload)
print(resp.status_code, resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/destinations", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Production R2 Bucket",
    kind: "external_s3",
    providerPreset: "r2",
    accountId: "0123456789abcdef0123456789abcdef",
    bucketName: "company-renders",
    region: "auto",
    pathPrefix: "exports/{YYYY}/{MM}/",
    accessKeyId: "9a8b7c6d5e4f3a2b1c0d",
    secretAccessKey: "1234567890abcdef1234567890abcdef12345678",
  }),
});
console.log(resp.status, await resp.json());
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"name":            "Production R2 Bucket",
		"kind":            "external_s3",
		"provider_preset": "r2",
		"account_id":      "0123456789abcdef0123456789abcdef",
		"bucket_name":     "company-renders",
		"region":          "auto",
		"path_prefix":     "exports/{YYYY}/{MM}/",
		"access_key_id":   "9a8b7c6d5e4f3a2b1c0d",
		"secret_access_key": "1234567890abcdef1234567890abcdef12345678",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/destinations", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer YOUR_JWT_TOKEN")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println(resp.StatusCode, string(respBody))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/destinations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production R2 Bucket",
    "kind": "external_s3",
    "provider_preset": "r2",
    "account_id": "0123456789abcdef0123456789abcdef",
    "bucket_name": "company-renders",
    "region": "auto",
    "path_prefix": "exports/{YYYY}/{MM}/",
    "access_key_id": "9a8b7c6d5e4f3a2b1c0d",
    "secret_access_key": "1234567890abcdef1234567890abcdef12345678"
  }'
```

:::

---

### 4. Update Destination

Update configuration, path prefix, or credentials on an existing destination.

```
PATCH /v1/destinations/{destination_id}
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Updated display name. |
| `path_prefix` | string | No | Updated path prefix template. |
| `status` | string | No | Either `"active"` or `"disabled"`. |
| `access_key_id` | string | No | New S3 Access Key ID (external only). |
| `secret_access_key` | string | No | New S3 Secret Access Key (external only). |

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json",
}
resp = requests.patch(
    "https://apis.fotohub.app/v1/destinations/d8e3b5e1-64d8-4f24-9b55-d14c27a92288",
    headers=headers,
    json={"status": "disabled"},
)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch(
  "https://apis.fotohub.app/v1/destinations/d8e3b5e1-64d8-4f24-9b55-d14c27a92288",
  {
    method: "PATCH",
    headers: {
      Authorization: "Bearer YOUR_JWT_TOKEN",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "disabled" }),
  }
);
console.log(await resp.json());
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]string{"status": "disabled"}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("PATCH", "https://apis.fotohub.app/v1/destinations/d8e3b5e1-64d8-4f24-9b55-d14c27a92288", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer YOUR_JWT_TOKEN")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println(string(respBody))
}
```

```bash [cURL]
curl -X PATCH https://apis.fotohub.app/v1/destinations/d8e3b5e1-64d8-4f24-9b55-d14c27a92288 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "disabled"}'
```

:::

---

### 5. Verify Destination

Re-runs the write/read/delete probe against external credentials to check health and permissions. For console buckets, re-verifies bucket availability.

```
POST /v1/destinations/{destination_id}/verify
```

#### Response Example

```json
{
  "status": "active",
  "last_verified_at": "2026-09-06T15:35:00Z",
  "last_error": null
}
```

::: code-group

```python [Python]
import requests

resp = requests.post(
    "https://apis.fotohub.app/v1/destinations/d8e3b5e1-64d8-4f24-9b55-d14c27a92288/verify",
    headers={"Authorization": "Bearer YOUR_JWT_TOKEN"},
)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch(
  "https://apis.fotohub.app/v1/destinations/d8e3b5e1-64d8-4f24-9b55-d14c27a92288/verify",
  {
    method: "POST",
    headers: { Authorization: "Bearer YOUR_JWT_TOKEN" },
  }
);
console.log(await resp.json());
```

```go [Go]
package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/destinations/d8e3b5e1-64d8-4f24-9b55-d14c27a92288/verify", nil)
	req.Header.Set("Authorization", "Bearer YOUR_JWT_TOKEN")
	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/destinations/d8e3b5e1-64d8-4f24-9b55-d14c27a92288/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

:::

---

### 6. Delete Destination

Detaches and soft-deletes a destination.

```
DELETE /v1/destinations/{destination_id}?force=false
```

::: warning Attached Keys & Safety Check
If active API keys or per-model output routing rules are currently writing to this destination, deletion is refused with `409 Conflict` (indicating which keys and rules are affected) to prevent silent data drop.
Pass `?force=true` to force deletion, which sets `destination_id = NULL` on attached keys and removes attached routing rules.
:::

#### Response Example

```json
{
  "deleted": true,
  "detached_keys": 2,
  "deleted_rules": 1
}
```

::: code-group

```python [Python]
import requests

resp = requests.delete(
    "https://apis.fotohub.app/v1/destinations/d8e3b5e1-64d8-4f24-9b55-d14c27a92288?force=true",
    headers={"Authorization": "Bearer YOUR_JWT_TOKEN"},
)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch(
  "https://apis.fotohub.app/v1/destinations/d8e3b5e1-64d8-4f24-9b55-d14c27a92288?force=true",
  {
    method: "DELETE",
    headers: { Authorization: "Bearer YOUR_JWT_TOKEN" },
  }
);
console.log(await resp.json());
```

```go [Go]
package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/v1/destinations/d8e3b5e1-64d8-4f24-9b55-d14c27a92288?force=true", nil)
	req.Header.Set("Authorization", "Bearer YOUR_JWT_TOKEN")
	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/v1/destinations/d8e3b5e1-64d8-4f24-9b55-d14c27a92288?force=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

:::
