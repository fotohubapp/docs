# Authentication

All FOTOhub API requests require authentication. The API supports two authentication methods: API key bearer tokens (recommended for most use cases) and JWT tokens (for server-to-server integrations). This page covers key management, scopes, rotation, and security best practices.

## API Keys

API keys are the primary authentication mechanism. Each key is scoped to a specific environment and set of permissions. FOTOhub uses two key prefixes to distinguish environments:

| Environment | Prefix | Description |
|-------------|--------|-------------|
| **Production** | `fh_live_*` | Live keys access production resources. Generations debit your **prepaid USD wallet** balance directly. Generated assets are stored permanently. |
| **Sandbox** | `fh_test_*` | Sandbox keys return mock responses for development and testing. No USD is charged. Assets are ephemeral and deleted after 24 hours. |

::: info Key Format
API keys are 48 characters long including the prefix. Example: `fh_live_sk2Kj8mN4pQ7rT1vX3yZ5bD9fH2gL6wA0cE4`. Keys are generated using cryptographically secure random bytes and are unique across the platform.
:::

## Bearer Token Authentication

Pass your API key in the `Authorization` header using the Bearer scheme. This is required for every authenticated request.

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_sk2Kj8mN4pQ7rT1vX3yZ5bD9fH2gL6wA0cE4",
    "Content-Type": "application/json"
}

# Using the SDK (recommended)
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_sk2Kj8mN4pQ7rT1vX3yZ5bD9fH2gL6wA0cE4")

# Or from environment variable (best practice)
import os
client = FotoHub(api_key=os.environ["FOTOHUB_API_KEY"])
```

```typescript [TypeScript]
// Direct fetch
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  headers: {
    "Authorization": "Bearer fh_live_sk2Kj8mN4pQ7rT1vX3yZ5bD9fH2gL6wA0cE4",
    "Content-Type": "application/json",
  },
  method: "POST",
  body: JSON.stringify({ model: "seedream-5-0-260128", prompt: "..." }),
});

// Using the SDK (recommended)
import { FotoHub } from "fotohub";

const client = new FotoHub({
  apiKey: process.env.FOTOHUB_API_KEY!,
});
```

```bash [cURL]
# Pass the key via Authorization header
curl https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_sk2Kj8mN4pQ7rT1vX3yZ5bD9fH2gL6wA0cE4" \
  -H "Content-Type: application/json" \
  -d '{"model": "seedream-5-0-260128", "prompt": "..."}'

# Or using environment variable
curl https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "seedream-5-0-260128", "prompt": "..."}'
```

:::

## Creating API Keys

API keys can be created through the web console or programmatically via the API. Each account can have up to 25 active keys.

### Via Console (UI)

1. Navigate to [fotohub.app/console](https://fotohub.app/console)
2. Open the **Keys** tab in the left sidebar
3. Click **"Create New Key"**
4. Select the key type (read-only, write, or admin)
5. Choose the environment (production or sandbox)
6. Optionally configure scopes and IP restrictions
7. Click **"Generate"** -- copy the key immediately as it will not be shown again

### Via API (Programmatic)

Use an existing admin-scoped key to create additional keys programmatically. See the [POST /v1/auth/keys](#create-api-key) endpoint below for full details.

## Key Types and Scopes

Keys are created with a type that determines their base permission level. Fine-grained scopes further restrict which API resources the key can access.

### Key Types

| Type | Permissions | Use Case |
|------|-------------|----------|
| `read-only` | GET requests only. Can list generations, check balance, view keys. | Dashboards, monitoring, read-only integrations |
| `write` | GET + POST requests. Can generate content, upload files, create resources. | Application backends, automation workflows |
| `admin` | Full access. Can manage keys, modify billing, access admin endpoints. | Account management, key provisioning, billing ops |

### Scopes

Scopes restrict a key to specific API resource groups. Multiple scopes can be combined. If no scopes are specified, the key has access to all resources allowed by its type.

| Scope | Resources |
|-------|-----------|
| `images` | Image generation, editing, upscaling, analysis |
| `video` | Video generation, lip-sync, video-to-video |
| `chat` | Chat completions, text generation, embeddings |
| `audio` | Music generation, TTS, voice cloning, transcription |
| `storage` | File upload, download, management, presigned URLs |
| `compute` | Agent workflows, batch jobs, compute orchestration |
| `billing` | Balance queries, usage history, cost reports |
| `keys` | API key creation, revocation, listing (admin only) |

## Key Rotation

Regular key rotation reduces the risk of compromised credentials. FOTOhub supports seamless rotation by allowing multiple active keys simultaneously. When you rotate a key, the old key continues to work until explicitly revoked, giving you time to update all systems.

### Recommended Rotation Process

1. Create a new key with the same type and scopes as the existing key
2. Update your application configuration to use the new key
3. Deploy the configuration change to all environments
4. Monitor for any requests still using the old key (visible in console)
5. Once no traffic uses the old key, revoke it via `DELETE /v1/auth/keys/{key_id}`

::: code-group

```python [Python]
# Revoke an old key after rotation
response = requests.delete(
    "https://apis.fotohub.app/v1/auth/keys/key_abc123def456",
    headers={"Authorization": "Bearer fh_live_your_admin_key"}
)

if response.status_code == 200:
    print("Key revoked successfully")
```

```typescript [TypeScript]
// Revoke an old key after rotation
const response = await fetch(
  "https://apis.fotohub.app/v1/auth/keys/key_abc123def456",
  {
    method: "DELETE",
    headers: {
      "Authorization": "Bearer fh_live_your_admin_key",
    },
  }
);

if (response.ok) {
  console.log("Key revoked successfully");
}
```

```bash [cURL]
curl -X DELETE https://apis.fotohub.app/v1/auth/keys/key_abc123def456 \
  -H "Authorization: Bearer fh_live_your_admin_key"
```

:::

::: warning Revocation is Immediate
Once a key is revoked, all in-flight requests using that key will fail with a 401 Unauthorized error. Ensure no active systems depend on the key before revoking.
:::

### Key Expiration

Keys can be created with an expiration date using the `expires_at` parameter. Expired keys automatically stop working at the specified time without requiring manual revocation. This is useful for temporary access grants, contractor integrations, and time-limited automation.

## IP Allowlisting

For additional security, you can restrict API keys to specific IP addresses or CIDR ranges. When IP allowlisting is enabled on a key, requests from non-allowlisted IPs will receive a 403 Forbidden response regardless of the key's validity.

::: code-group

```python [Python]
# Set IP whitelist on key creation
response = requests.post(
    "https://apis.fotohub.app/v1/auth/keys",
    headers={
        "Authorization": "Bearer fh_live_your_admin_key",
        "Content-Type": "application/json"
    },
    json={
        "name": "production-backend",
        "type": "write",
        "scopes": ["images", "video", "chat"],
        "allowed_ips": [
            "203.0.113.0/24",    # Office network
            "198.51.100.42",     # Production server
            "2001:db8::1/128"    # IPv6 support
        ]
    }
)

# Update IP whitelist on existing key via PATCH
response = requests.patch(
    "https://apis.fotohub.app/v1/auth/keys/key_abc123",
    headers={
        "Authorization": "Bearer fh_live_your_admin_key",
        "Content-Type": "application/json"
    },
    json={
        "allowedIps": ["203.0.113.0/24", "198.51.100.42"]
    }
)
```

```typescript [TypeScript]
// Set IP whitelist on key creation
const response = await fetch("https://apis.fotohub.app/v1/auth/keys", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_admin_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "production-backend",
    type: "write",
    scopes: ["images", "video", "chat"],
    allowed_ips: [
      "203.0.113.0/24",   // Office network
      "198.51.100.42",    // Production server
      "2001:db8::1/128",  // IPv6 support
    ],
  }),
});
```

```bash [cURL]
# Create key with IP whitelist
curl -X POST https://apis.fotohub.app/v1/auth/keys \
  -H "Authorization: Bearer fh_live_your_admin_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "production-backend",
    "type": "write",
    "scopes": ["images", "video", "chat"],
    "allowed_ips": ["203.0.113.0/24", "198.51.100.42"]
  }'
```

:::

::: tip CIDR Notation
Use CIDR notation for IP ranges (e.g., `203.0.113.0/24` covers 203.0.113.0 through 203.0.113.255). Both IPv4 and IPv6 addresses are supported. A maximum of 20 IP entries per key is allowed.
:::

## Rate Limit Headers

Every API response includes headers indicating your current rate limit status. Use these headers to implement intelligent client-side throttling.

| Header | Type | Description |
|--------|------|-------------|
| `X-RateLimit-Limit` | integer | Maximum number of requests allowed per minute for your current tier. |
| `X-RateLimit-Remaining` | integer | Number of requests remaining in the current rate limit window. |
| `X-RateLimit-Reset` | integer | Unix timestamp (seconds) when the rate limit window resets. |
| `X-RateLimit-Retry-After` | integer | Only present on 429 responses. Seconds to wait before retrying. |

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1721234620
X-Request-Id: 48c6e1a2-9d5f-4730-b81c-6a2e4f7b0d59

# On rate limit hit (429):
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1721234620
X-RateLimit-Retry-After: 18
Retry-After: 18
```

See [Rate Limits](/api/rate-limits) for tier-specific limits and quotas.

## Session & Browser Authentication

For browser-based console integrations at [fotohub.app/console](https://fotohub.app/console), user sessions authenticate via Supabase Auth JWT tokens (`Authorization: Bearer <session_jwt>`). 

For server-to-server and automated backend workflows, use long-lived programmatic API keys (`fh_live_*`) or bucket-scoped tokens (`fhub_bkt_live_*`). Note that OAuth client-assertion exchange (`/v1/auth/token`) is not supported; pass your API key directly in the `Authorization` header.

## Security Best Practices

Follow these guidelines to keep your API keys secure and minimize the risk of unauthorized access.

### Never expose keys in frontend code

API keys in client-side JavaScript, mobile apps, or SPAs can be extracted by anyone. Always proxy API calls through your backend server.

### Use environment variables

Store keys in environment variables (`FOTOHUB_API_KEY`), secrets managers (AWS Secrets Manager, HashiCorp Vault), or CI/CD encrypted variables. Never hardcode keys in source files.

### Rotate keys regularly

Rotate production keys every 90 days as a best practice. Use the key creation + revocation flow to ensure zero downtime during rotation.

### Use IP allowlisting for production

Restrict production keys to known server IP addresses. This prevents stolen keys from being used outside your infrastructure.

### Monitor key usage in console

Regularly review the usage dashboard at fotohub.app/console. Look for unusual patterns: unexpected models, high request volumes, or requests from unknown IPs.

### Apply principle of least privilege

Create separate keys with minimal scopes for each service. A service that only generates images should not have access to billing or key management scopes.

### Revoke compromised keys immediately

If you suspect a key has been exposed (committed to git, logged, or shared), revoke it immediately and create a new one. Check usage logs for unauthorized activity.

::: danger Git Exposure
If a key is accidentally committed to a git repository (even a private one), consider it compromised. Revoke it immediately. Use tools like `git-secrets` or `gitleaks` to prevent accidental commits of secrets.
:::

## Error Responses

Authentication failures return structured error responses with specific error codes.

### 401 Unauthorized

Returned when the API key is missing, malformed, expired, or has been revoked.

```json
{
  "error": {
    "code": "invalid_api_key",
    "message": "The provided API key is invalid or has been revoked.",
    "type": "authentication_error"
  }
}
```

### 403 Forbidden

Returned when the API key is valid but lacks the required scope for the requested resource, or when the request originates from a non-allowlisted IP address.

```json
{
  "error": {
    "code": "insufficient_scope",
    "message": "This API key does not have the 'video' scope required for this endpoint.",
    "type": "authorization_error"
  }
}
```

```json
{
  "error": {
    "code": "ip_not_allowed",
    "message": "Request from IP 45.33.22.11 is not in the key's allowlist.",
    "type": "authorization_error"
  }
}
```

### 429 Too Many Requests

Returned when the rate limit has been exceeded for the current window.

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Retry after 18 seconds.",
    "type": "rate_limit_error",
    "retry_after": 18
  }
}
```

## API Key Endpoints

### Create API Key {#create-api-key}

<div class="api-endpoint">
<span class="api-method post">POST</span> <code>/v1/auth/keys</code>
</div>

Generate a new API key with specified type, scopes, and optional IP restrictions. Requires an admin-scoped key.

**Request Body**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | Yes | -- | Human-readable name for the key (e.g., 'production-backend', 'staging-worker'). Max 64 characters. |
| `type` | string | Yes | -- | Permission level. One of: `read-only`, `write`, `admin`. |
| `environment` | string | No | `production` | Key environment. `production` creates `fh_live_*` key, `sandbox` creates `fh_test_*` key. |
| `scopes` | string[] | No | all | Array of scope strings. Available: `images`, `video`, `chat`, `audio`, `storage`, `compute`, `billing`, `keys`. Empty array or omitted means all scopes. |
| `allowed_ips` | string[] | No | -- | Array of IP addresses or CIDR ranges to allowlist. Max 20 entries. Both IPv4 and IPv6 supported. |
| `expires_at` | string | No | -- | ISO 8601 datetime for key expiration. If omitted, key does not expire (must be manually revoked). |
| `metadata` | object | No | -- | Arbitrary key-value pairs for your own tracking (e.g., team, project, environment). Max 10 keys, 256 chars per value. |

**Response: 201 Created**

```json
{
  "id": "key_7Hk3mN9pQ2rT",
  "object": "api_key",
  "name": "production-backend",
  "type": "write",
  "environment": "production",
  "key": "fh_live_sk2Kj8mN4pQ7rT1vX3yZ5bD9fH2gL6wA0cE4",
  "prefix": "fh_live_sk2K...0cE4",
  "scopes": ["images", "video", "chat"],
  "allowed_ips": ["203.0.113.0/24", "198.51.100.42"],
  "expires_at": null,
  "metadata": {
    "team": "backend",
    "project": "main-app"
  },
  "created_at": "2026-07-17T10:30:00Z",
  "last_used_at": null
}
```

::: warning Store the Key Immediately
The full key value is only returned once in this response. It cannot be retrieved later. If lost, you must create a new key and revoke the old one.
:::

### Revoke API Key {#revoke-api-key}

<div class="api-endpoint">
<span class="api-method delete">DELETE</span> <code>/v1/auth/keys/{key_id}</code>
</div>

Immediately revoke an API key. All requests using this key will fail with 401 after revocation. This action cannot be undone.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key_id` | string | Yes | The unique identifier of the key to revoke (e.g., `key_7Hk3mN9pQ2rT`). Found via GET /v1/auth/keys or in the console. |

**Response: 200 OK**

```json
{
  "id": "key_7Hk3mN9pQ2rT",
  "object": "api_key",
  "deleted": true,
  "revoked_at": "2026-07-17T14:22:00Z"
}
```

::: danger Irreversible Action
Key revocation is immediate and permanent. Any service still using this key will lose access instantly. Ensure all systems have been migrated to a new key before revoking.
:::

### List API Keys {#list-api-keys}

<div class="api-endpoint">
<span class="api-method get">GET</span> <code>/v1/auth/keys</code>
</div>

Retrieve all API keys for the authenticated account. Returns metadata only -- full key values are never exposed after creation.

**Query Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `environment` | string | No | -- | Filter by environment: `production` or `sandbox`. Returns all if omitted. |
| `type` | string | No | -- | Filter by key type: `read-only`, `write`, or `admin`. |
| `status` | string | No | `active` | Filter by status: `active`, `revoked`, or `expired`. Defaults to `active`. |
| `limit` | integer | No | `25` | Number of keys to return. Max 100. |
| `offset` | integer | No | `0` | Pagination offset for listing keys. |

**Response: 200 OK**

```json
{
  "object": "list",
  "data": [
    {
      "id": "key_7Hk3mN9pQ2rT",
      "object": "api_key",
      "name": "production-backend",
      "type": "write",
      "environment": "production",
      "prefix": "fh_live_sk2K...0cE4",
      "scopes": ["images", "video", "chat"],
      "allowed_ips": ["203.0.113.0/24"],
      "status": "active",
      "expires_at": null,
      "created_at": "2026-07-17T10:30:00Z",
      "last_used_at": "2026-07-17T14:15:32Z",
      "requests_30d": 12847
    },
    {
      "id": "key_9Xm2pL5nR8wT",
      "object": "api_key",
      "name": "staging-worker",
      "type": "write",
      "environment": "sandbox",
      "prefix": "fh_test_mK4p...7rT1",
      "scopes": ["images"],
      "allowed_ips": [],
      "status": "active",
      "expires_at": "2026-09-01T00:00:00Z",
      "created_at": "2026-07-10T08:00:00Z",
      "last_used_at": "2026-07-16T22:45:10Z",
      "requests_30d": 342
    }
  ],
  "total": 2,
  "has_more": false
}
```

## Update API Key

Reconfigure an existing API key's name, description, rate limits, IP whitelist, referrer whitelist, scopes, retention period, or attached default output destination.

```
PATCH /v1/auth/keys/{key_id}
```

**Authentication:** JWT Bearer token required (`Authorization: Bearer <session_jwt>`). API keys cannot modify other API keys or themselves.

### Request Parameters

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Optional new label for the key. |
| `description` | string | Optional description. |
| `rateLimitPerMinute` | integer | Max requests per minute (1 to 600). |
| `allowedIps` | string[] | Array of allowed IPv4/IPv6 addresses or CIDR blocks. |
| `allowedReferrers` | string[] | Array of allowed HTTP Referer header hosts. |
| `scopes` | string[] | Array of API scopes (e.g., `["images", "video", "storage"]`). |
| `retentionHours` | integer | Storage retention in hours (1 to 8760). |
| `destinationId` | string (UUID) | Output destination to mirror generated files to. |
| `keepLocalCopy` | boolean | When destination is set, also retain local copy for retention period. |
| `clearRetention` | boolean | Set to `true` to remove retention limit (keep until deleted). |
| `clearDestination` | boolean | Set to `true` to detach output destination. |

::: note Retention Scope
Retention settings apply denormalized at creation time to objects generated *after* this change is saved. Existing stored objects retain their original expiration timestamp.
:::

#### Request Example

```json
{
  "name": "Production Worker Key (Updated)",
  "rateLimitPerMinute": 120,
  "allowedIps": ["198.51.100.4", "203.0.113.0/24"],
  "retentionHours": 168,
  "destinationId": "d8e3b5e1-64d8-4f24-9b55-d14c27a92288"
}
```

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json",
}
resp = requests.patch(
    "https://apis.fotohub.app/v1/auth/keys/key_01928374",
    headers=headers,
    json={"rateLimitPerMinute": 120, "retentionHours": 168},
)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/auth/keys/key_01928374", {
  method: "PATCH",
  headers: {
    Authorization: "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ rateLimitPerMinute: 120, retentionHours: 168 }),
});
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
	payload := map[string]interface{}{
		"rateLimitPerMinute": 120,
		"retentionHours":     168,
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("PATCH", "https://apis.fotohub.app/v1/auth/keys/key_01928374", bytes.NewReader(body))
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
curl -X PATCH https://apis.fotohub.app/v1/auth/keys/key_01928374 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rateLimitPerMinute": 120, "retentionHours": 168}'
```

:::

---

## Rotate API Key

Issues a new secret token for an existing active key in a create-then-revoke transaction. All configuration settings (scopes, IP restrictions, rate limits, retention, destination, and per-model routing rules) are automatically preserved and cloned to the new key row before the old key is marked `revoked`.

```
POST /v1/auth/keys/{key_id}/rotate
```

**Authentication:** JWT Bearer token required (`Authorization: Bearer <session_jwt>`).

#### Response Example

```json
{
  "apiKey": "fh_live_a1b2c3d4e5f60718293a4b5c6d7e8f90",
  "meta": {
    "id": "key_01928399",
    "rotated_from": "key_01928374",
    "old_key_revoked": true,
    "name": "Production Worker Key",
    "expires_at": null,
    "rate_limit_per_minute": 120,
    "retention_hours": 168,
    "destination_id": "d8e3b5e1-64d8-4f24-9b55-d14c27a92288",
    "output_rules_copied": 2
  }
}
```

::: code-group

```python [Python]
import requests

headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}
resp = requests.post(
    "https://apis.fotohub.app/v1/auth/keys/key_01928374/rotate",
    headers=headers,
)
new_key_data = resp.json()
print("New key:", new_key_data["apiKey"])
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/auth/keys/key_01928374/rotate", {
  method: "POST",
  headers: { Authorization: "Bearer YOUR_JWT_TOKEN" },
});
const data = await resp.json();
console.log("New key:", data.apiKey);
```

```go [Go]
package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/auth/keys/key_01928374/rotate", nil)
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
curl -X POST https://apis.fotohub.app/v1/auth/keys/key_01928374/rotate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

:::

---

## Bucket-Scoped API Keys

Mint an API key scoped strictly to a specific FOTOhub storage bucket. Bucket keys use the prefix `fhub_bkt_live_*` and cannot access AI generation models, billing, or other buckets.

```
POST /v1/auth/bucket-keys
```

**Authentication:** JWT Bearer token (`Authorization: Bearer <session_jwt>`). Requires API entitlement on account.

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bucket_id` | string (UUID) | **Yes** | Storage bucket ID owned by caller. |
| `name` | string | No | Label for the bucket key. |

#### Response Example

```json
{
  "apiKey": "fhub_bkt_live_9f8e7d6c5b4a31209876543210abcdef"
}
```

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json",
}
resp = requests.post(
    "https://apis.fotohub.app/v1/auth/bucket-keys",
    headers=headers,
    json={"bucket_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "name": "Upload Bot Key"},
)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/auth/bucket-keys", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    bucket_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    name: "Upload Bot Key",
  }),
});
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
	payload := map[string]string{
		"bucket_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
		"name":      "Upload Bot Key",
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/auth/bucket-keys", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer YOUR_JWT_TOKEN")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println(string(respBody))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/auth/bucket-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bucket_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Upload Bot Key"
  }'
```

:::

---

## Per-Model Output Routing Rules

Output routing rules allow an API key to dispatch files generated by specific models (or wildcards) to different destinations and directory layouts.

Each key can hold up to **25 routing rules**. Rules are evaluated in ascending order of `priority` (lowest number wins).

```
Precedence:
1. `output` object in the request body (e.g. `{"bucket": "..."}`)
2. Per-model routing rule on key (`model_pattern` glob match, lowest `priority` first)
3. Default `destination_id` on the API key
4. Default internal storage (`api-generations` private bucket with signed URL)
```

### 1. List Routing Rules

```
GET /v1/auth/keys/{key_id}/output-rules
```

#### Response Example

```json
{
  "rules": [
    {
      "id": "rule_001",
      "key_id": "key_01928374",
      "model_pattern": "seedance-2-0-*",
      "destination_id": "d8e3b5e1-64d8-4f24-9b55-d14c27a92288",
      "path_template": "videos/{YYYY}/{MM}/{job_id}.{ext}",
      "priority": 10,
      "created_at": "2026-09-01T12:00:00Z",
      "updated_at": "2026-09-01T12:00:00Z"
    },
    {
      "id": "rule_002",
      "key_id": "key_01928374",
      "model_pattern": "flux-*",
      "destination_id": "c7d2a4e0-53c7-4e13-8a44-c03b16a81177",
      "path_template": "images/{date}/{name}.{ext}",
      "priority": 20,
      "created_at": "2026-09-02T10:00:00Z",
      "updated_at": "2026-09-02T10:00:00Z"
    }
  ],
  "limits": {
    "max_rules": 25
  }
}
```

---

### 2. Create Routing Rule

```
POST /v1/auth/keys/{key_id}/output-rules
```

#### Request Parameters

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `modelPattern` | string | **Yes** | — | Glob pattern matching model ID (e.g. `seedance-*`, `veo-2.0-*`, `*`). |
| `destinationId` | string (UUID) | **Yes** | — | Output destination owned by caller. |
| `pathTemplate` | string | No | `null` | Template using tokens: `{model}`, `{date}`, `{YYYY}`, `{MM}`, `{DD}`, `{HH}`, `{mm}`, `{ss}`, `{job_id}`, `{user_id}`, `{ext}`, `{name}`, `{index}`. |
| `priority` | integer | No | `100` | Rule evaluation priority (0 to 100,000). Lowest wins. |

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json",
}
payload = {
    "modelPattern": "veo-2.0-*",
    "destinationId": "d8e3b5e1-64d8-4f24-9b55-d14c27a92288",
    "pathTemplate": "veo/{YYYY}/{MM}/{job_id}.{ext}",
    "priority": 10,
}
resp = requests.post(
    "https://apis.fotohub.app/v1/auth/keys/key_01928374/output-rules",
    headers=headers,
    json=payload,
)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/auth/keys/key_01928374/output-rules", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    modelPattern: "veo-2.0-*",
    destinationId: "d8e3b5e1-64d8-4f24-9b55-d14c27a92288",
    pathTemplate: "veo/{YYYY}/{MM}/{job_id}.{ext}",
    priority: 10,
  }),
});
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
	payload := map[string]interface{}{
		"modelPattern":  "veo-2.0-*",
		"destinationId": "d8e3b5e1-64d8-4f24-9b55-d14c27a92288",
		"pathTemplate":  "veo/{YYYY}/{MM}/{job_id}.{ext}",
		"priority":      10,
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/auth/keys/key_01928374/output-rules", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer YOUR_JWT_TOKEN")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println(string(respBody))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/auth/keys/key_01928374/output-rules \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelPattern": "veo-2.0-*",
    "destinationId": "d8e3b5e1-64d8-4f24-9b55-d14c27a92288",
    "pathTemplate": "veo/{YYYY}/{MM}/{job_id}.{ext}",
    "priority": 10
  }'
```

:::

---

### 3. Update & Delete Routing Rules

```
PATCH  /v1/auth/keys/{key_id}/output-rules/{rule_id}
DELETE /v1/auth/keys/{key_id}/output-rules/{rule_id}
```

To update a rule, submit optional fields: `modelPattern`, `destinationId`, `pathTemplate`, `clearPathTemplate` (boolean), or `priority`.
