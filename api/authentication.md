# Authentication

All FOTOhub API requests require authentication. The API supports two authentication methods: API key bearer tokens (recommended for most use cases) and JWT tokens (for server-to-server integrations). This page covers key management, scopes, rotation, and security best practices.

## API Keys

API keys are the primary authentication mechanism. Every key is a `fh_live_*` key that talks directly to production.

::: warning There is no sandbox
FOTOhub does not have a sandbox or test mode. There is no `fh_test_*` prefix, no mock-response mode, and no ephemeral-asset behavior -- key generation unconditionally mints an `fh_live_*` key. Every call made with a live key runs for real against your prepaid USD wallet and, if the wallet cannot cover it, is refused with `402` before anything runs -- see [Billing & Pricing](/api/billing). If you want to try the API without spending, top up a small amount and use a cheap model; there is no separate free-testing path.
:::

::: info Key Format
API keys are 40 characters long including the prefix: `fh_live_` (8 characters) followed by 32 lowercase hexadecimal characters (a UUID4 with the dashes removed). Example: `fh_live_4f3a9c2e8b71d0a6f5c3e9b2a7d41f68`. A key is never mixed-case and never contains characters outside `0-9a-f` after the prefix.
:::

## Bearer Token Authentication

Pass your API key in the `Authorization` header using the Bearer scheme. This is required for every authenticated request.

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_4f3a9c2e8b71d0a6f5c3e9b2a7d41f68",
    "Content-Type": "application/json"
}

# Using the SDK (recommended)
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_4f3a9c2e8b71d0a6f5c3e9b2a7d41f68")

# Or from environment variable (best practice)
import os
client = FotoHub(api_key=os.environ["FOTOHUB_API_KEY"])
```

```typescript [TypeScript]
// Direct fetch
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  headers: {
    "Authorization": "Bearer fh_live_4f3a9c2e8b71d0a6f5c3e9b2a7d41f68",
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
  -H "Authorization: Bearer fh_live_4f3a9c2e8b71d0a6f5c3e9b2a7d41f68" \
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

API keys can be created through the web console, or programmatically -- but the programmatic path requires your browser session token (JWT), never another API key. See [Via API](#via-api-programmatic) below.

By default an account can have **5 active keys**. Higher plans raise this cap (it comes from the tier's `api_keys_max`); some tiers make it unlimited. Creating a key also requires an API entitlement on the account -- a purchased API plan or a funded prepaid wallet. An account without one gets `403 api_access_required` with an `upgrade_url` and `topup_url`, whether it is minting a regular key or a [bucket-scoped key](#bucket-scoped-api-keys).

### Via Console (UI)

1. Navigate to [fotohub.app/console](https://fotohub.app/console)
2. Open the **Keys** tab in the left sidebar
3. Click **"Create New Key"**
4. Optionally select a key type (read-only, write, or admin -- defaults to `write`)
5. Optionally configure scopes and IP restrictions
6. Click **"Generate"** -- copy the key immediately as it will not be shown again

### Via API (Programmatic) {#via-api-programmatic}

`POST /v1/auth/keys`, `PATCH /v1/auth/keys/{key_id}`, `DELETE /v1/auth/keys/{key_id}`, and `POST /v1/auth/keys/{key_id}/rotate` all authenticate with your **session JWT** (`Authorization: Bearer <session_jwt>`, the same token the console uses) -- **not** an API key of any type. Minting, updating, rotating or revoking a key is an account-level action, so an API key (even one with the `keys` scope or `admin` type) cannot create or mutate other keys. The only key-management calls an API key can make are the read-only ones: `GET /v1/auth/keys` (list) and `GET /v1/auth/keys/{key_id}` (detail). See the [POST /v1/auth/keys](#create-api-key) endpoint below for full details.

## Key Types and Scopes

Keys are created with a `keyType` (request field name; the stored column is `key_type`) that determines their base permission level. Fine-grained scopes further restrict which API resources the key can access.

### Key Types

`keyType` is optional and defaults to `write` if omitted.

| Type | Permissions | Use Case |
|------|-------------|----------|
| `read-only` | Blocked from mutating account-scoped endpoints (billing changes, webhooks, some voice-agent routes). | Dashboards, monitoring, read-only integrations |
| `write` | Can generate content, upload files, create resources. | Application backends, automation workflows |
| `admin` | Same permissions as `write` today -- it carries no extra capability over `write`. | Reserved for a future tier of access |

::: warning Key management is never delegated to an API key
No key type -- not even `admin` -- lets an API key create, update, rotate or revoke keys. That is always a browser-session action; see [Via API](#via-api-programmatic) above.
:::

### Scopes

Scopes restrict a key to specific API resource groups. Multiple scopes can be combined. If no scopes are specified -- or a key carries the pre-enforcement default set (`images`, `video`, `chat`, `storage`, `compute`) written before scopes were checked -- the key is treated as unrestricted.

| Scope | Resources |
|-------|-----------|
| `images` | Image generation, editing, analysis, 3D generation |
| `video` | Video generation, avatar, motion transfer, shorts, story, lip-sync |
| `chat` | Chat completions, translation, document intelligence, prompt enhancement |
| `audio` | Music, SFX, speech/TTS, transcription, voice |
| `storage` | Photos, albums, buckets, storage, output destinations |
| `compute` | Agent workflows, Gabriel |
| `billing` | Accepted as a value, but not currently enforced -- `/v1/billing`, `/v1/usage`, `/v1/plans`, `/v1/models`, `/v1/console` and `/v1/auth/keys` are deliberately left ungated so a key can always read its own balance and configuration, regardless of scopes. |
| `keys` | Same as `billing`: accepted, but `/v1/auth/keys` is never scope-gated, and key management is JWT-only regardless (see above). |

::: tip
`scopes: ["all"]`, `["*"]`, `["full"]` and `["admin"]` are all synonyms for unrestricted access.
:::

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
# Revoke an old key after rotation -- JWT session token, not an API key
response = requests.delete(
    "https://apis.fotohub.app/v1/auth/keys/key_abc123def456",
    headers={"Authorization": "Bearer YOUR_JWT_TOKEN"}
)

if response.status_code == 200:
    print("Key revoked successfully")
```

```typescript [TypeScript]
// Revoke an old key after rotation -- JWT session token, not an API key
const response = await fetch(
  "https://apis.fotohub.app/v1/auth/keys/key_abc123def456",
  {
    method: "DELETE",
    headers: {
      "Authorization": "Bearer YOUR_JWT_TOKEN",
    },
  }
);

if (response.ok) {
  console.log("Key revoked successfully");
}
```

```bash [cURL]
curl -X DELETE https://apis.fotohub.app/v1/auth/keys/key_abc123def456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

:::

::: warning Revocation is Immediate
Once a key is revoked, all in-flight requests using that key will fail with a 401 Unauthorized error. Ensure no active systems depend on the key before revoking.
:::

### Key Expiration

Keys can be created with a lifetime using the `expiresInDays` parameter (`expires_in_days` on the wire; either spelling is accepted) -- the number of days from creation until the key stops working, not an absolute date. Omit it and the key never expires and must be revoked manually. Expired keys automatically stop working (401) at the computed time without requiring manual revocation. This is useful for temporary access grants, contractor integrations, and time-limited automation.

## IP Allowlisting

You can restrict an API key to specific IP addresses via `allowedIps`. When the list is non-empty, a request from an IP not on it gets a 403.

::: warning Only exact IP matches are enforced -- not CIDR ranges
The allowlist check is exact-string membership against the request's IP, not subnet containment. An entry like `203.0.113.0/24` is accepted at key-creation time but will **never match** any individual request IP, because no client ever connects *as* `203.0.113.0/24` -- only as a single address. Until this is implemented server-side, list every individual IP you want to allow; do not rely on CIDR notation to cover a range. There is also no enforced cap on the number of entries.
:::

`allowedReferrers` is stored on the key but is **not currently checked** against the incoming request's `Referer` header by anything -- setting it has no effect on access today.

::: code-group

```python [Python]
# Set IP allowlist on key creation -- JWT session token, not an API key
response = requests.post(
    "https://apis.fotohub.app/v1/auth/keys",
    headers={
        "Authorization": "Bearer YOUR_JWT_TOKEN",
        "Content-Type": "application/json"
    },
    json={
        "name": "production-backend",
        "keyType": "write",
        "scopes": ["images", "video", "chat"],
        "allowedIps": [
            "198.51.100.42",     # Production server (exact match only)
            "198.51.100.43",
            "2001:db8::1"        # IPv6 supported
        ]
    }
)

# Update IP allowlist on existing key via PATCH
response = requests.patch(
    "https://apis.fotohub.app/v1/auth/keys/key_abc123",
    headers={
        "Authorization": "Bearer YOUR_JWT_TOKEN",
        "Content-Type": "application/json"
    },
    json={
        "allowedIps": ["198.51.100.42", "198.51.100.43"]
    }
)
```

```typescript [TypeScript]
// Set IP allowlist on key creation -- JWT session token, not an API key
const response = await fetch("https://apis.fotohub.app/v1/auth/keys", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "production-backend",
    keyType: "write",
    scopes: ["images", "video", "chat"],
    allowedIps: [
      "198.51.100.42",   // Production server (exact match only)
      "198.51.100.43",
      "2001:db8::1",     // IPv6 supported
    ],
  }),
});
```

```bash [cURL]
# Create key with IP allowlist -- JWT session token, not an API key
curl -X POST https://apis.fotohub.app/v1/auth/keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "production-backend",
    "keyType": "write",
    "scopes": ["images", "video", "chat"],
    "allowedIps": ["198.51.100.42", "198.51.100.43"]
  }'
```

:::

::: tip Exact IPs only
List every address you want to allow individually -- `198.51.100.42`, not `198.51.100.0/24`. See the warning above: CIDR notation is accepted but not evaluated as a range. Both IPv4 and IPv6 addresses are supported. There is no enforced maximum on the number of entries.
:::

## Rate Limit Headers

Every API response includes headers indicating your current rate limit status. Use these headers to implement intelligent client-side throttling.

| Header | Type | Description |
|--------|------|-------------|
| `X-RateLimit-Limit` | integer | Maximum number of requests allowed per minute for your current tier or key. |
| `X-RateLimit-Remaining` | integer | Number of requests remaining in the current rate limit window. |
| `X-RateLimit-Reset` | integer | Unix timestamp (seconds) when the rate limit window resets. |
| `Retry-After` | integer | Only present on 429 responses. Seconds to wait before retrying. There is no `X-RateLimit-Retry-After` header -- just the plain `Retry-After`. |

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
Retry-After: 18
```

::: tip A gateway-level limiter carries none of these
A separate, earlier limiter (per path + IP or key, ahead of authentication) can also return 429. Its response carries only `Retry-After` -- no `X-RateLimit-*` headers at all, because it refuses the request before anything has resolved which key or tier is calling. See [Error Handling](/api/errors#rate-limit-handling).
:::

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

The API is FastAPI, so every error body sits under a single `detail` key -- a plain string for most failures, or an object for the handful that carry structured context. There is **no** `{"error": {"code", "message", "type"}}` envelope anywhere in the API; treat any doc or sample that shows one as wrong. See [Error Handling](/api/errors) for the full reference.

### 401 Unauthorized

Returned when the API key is missing, unrecognized, expired, or revoked. `detail` is always a plain string here -- there is no machine-readable code to switch on, so branch on the HTTP status and, if you need to distinguish the cause, match on the string:

```json
{ "detail": "Missing Authorization header" }
```

```json
{ "detail": "Invalid API key" }
```

```json
{ "detail": "API key has expired" }
```

```json
{ "detail": "API key is revoked" }
```

### 403 Forbidden

Two different causes share this status. An IP-allowlist rejection is a plain string:

```json
{ "detail": "IP address not allowed for this key" }
```

A scope denial is a structured object, because it carries enough to fix the key without a support ticket:

```json
{
  "detail": {
    "error": "insufficient_scope",
    "message": "This API key does not have the 'video' scope. Update the key's scopes in the console, or use a key that has it.",
    "required_scope": "video",
    "granted_scopes": ["images", "storage"],
    "docs": "https://docs.fotohub.app/api/authentication"
  }
}
```

### 429 Too Many Requests

Two independent limiters can produce a 429, with different bodies. The per-key limiter (`rate_limit_per_minute` on the key, checked during authentication) returns a structured object and the full `X-RateLimit-*` header set plus `Retry-After`:

```json
{
  "detail": {
    "error": "rate_limit_exceeded",
    "message": "This API key is limited to 60 requests per minute. Raise the limit on the key in the console, or spread the calls out.",
    "limit_rpm": 60,
    "scope": "api_key"
  }
}
```

A separate, earlier gateway limiter (per path + caller, ahead of authentication) returns a different, unwrapped shape with only `Retry-After` -- no `X-RateLimit-*` headers, because it fires before anything has resolved which key is calling:

```json
{ "error": "Rate limit exceeded. Please try again later." }
```

## API Key Endpoints

### Create API Key {#create-api-key}

<div class="api-endpoint">
<span class="api-method post">POST</span> <code>/v1/auth/keys</code>
</div>

Generate a new API key. **Requires a session JWT** (`Authorization: Bearer <session_jwt>`) -- an existing API key, of any type or scope, cannot create another key. Requires an API entitlement on the account (see [Creating API Keys](#creating-api-keys) above).

**Request Body**

Field names below are the camelCase aliases the API accepts; the snake_case form (e.g. `key_type` instead of `keyType`) works identically.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | No | `Klucz #<date>` | Human-readable name for the key. |
| `description` | string | No | -- | Free-text description. |
| `keyType` | string | No | `write` | One of `read-only`, `write`, `admin` (see [Key Types](#key-types) -- `admin` carries no extra permission over `write` today). |
| `scopes` | string[] | No | unrestricted | Array of scope strings. See [Scopes](#scopes). Omitted or empty means unrestricted. |
| `allowedIps` | string[] | No | -- | Exact IP addresses to allowlist (IPv4 or IPv6). **Not** CIDR ranges -- see the warning under [IP Allowlisting](#ip-allowlisting). No enforced maximum. |
| `allowedReferrers` | string[] | No | -- | Stored, but not currently checked against the `Referer` header by anything. |
| `expiresInDays` | integer | No | -- | Days from now until the key expires. Omitted means the key never expires. |
| `rateLimitPerMinute` | integer | No | `60` | Per-key rate limit. 1 to 600 -- values above 600 are silently clamped down to 600. |
| `metadata` | object | No | `{}` | Arbitrary key-value pairs for your own tracking. |
| `scopes`/`projectId` | string | No | -- | Tag the key to a project id (your own grouping, filterable via `GET /v1/auth/keys?project_id=...`). |
| `retentionHours` | integer | No | -- (keep until deleted) | How long generated files stay in our storage. 1 to 8760. Console presets: 2 / 12 / 24 / 168. |
| `destinationId` | string (UUID) | No | -- | Default [output destination](#per-model-output-routing-rules) to mirror this key's generations into. Must be a destination you own. |
| `keepLocalCopy` | boolean | No | `true` | With `destinationId` set, also keep our own copy for the retention period. |

**Response: 201 Created**

The response is `{ "apiKey": "<the secret, once>", "meta": {...} }` -- not an object with a top-level `key`/`prefix`/`object` shape:

```json
{
  "apiKey": "fh_live_4f3a9c2e8b71d0a6f5c3e9b2a7d41f68",
  "meta": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "key_prefix": "fh_live_4f3a",
    "name": "production-backend",
    "expires_at": null,
    "rate_limit_per_minute": 60,
    "subscription_id": null,
    "retention_hours": null,
    "destination_id": null,
    "keep_local_copy": true,
    "key_type": "write",
    "scopes": ["images", "video", "chat"],
    "project_id": null
  }
}
```

`key_prefix` is the raw first 12 characters of the key (`fh_live_` plus 4 hex digits) -- not a masked `fh_live_xxxx...yyyy` display string; the console applies its own masking for display.

::: warning Store the Key Immediately
`apiKey` is only returned once, in this response. It cannot be retrieved later -- not even by an admin-typed key. If lost, create a new key and revoke the old one.
:::

::: warning No API entitlement -- 403
An account with no purchased API plan and no funded prepaid wallet gets:
```json
{
  "detail": {
    "error": "api_access_required",
    "reason": "no_entitlement",
    "message": "API keys require a purchased plan or a prepaid balance.",
    "upgrade_url": "https://console.fotohub.app/console/tiers",
    "topup_url": "https://console.fotohub.app/console/wallet"
  }
}
```
:::

### Revoke API Key {#revoke-api-key}

<div class="api-endpoint">
<span class="api-method delete">DELETE</span> <code>/v1/auth/keys/{key_id}</code>
</div>

Immediately revoke an API key. **Requires a session JWT**, same as create. All requests using this key will fail with 401 after revocation. This action cannot be undone.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key_id` | string | Yes | The unique identifier of the key to revoke. Found via GET /v1/auth/keys or in the console. |

**Response: 200 OK**

```json
{ "message": "Key revoked successfully" }
```

::: danger Irreversible Action
Key revocation is immediate and permanent. Any service still using this key will lose access instantly. Ensure all systems have been migrated to a new key before revoking.
:::

### List API Keys {#list-api-keys}

<div class="api-endpoint">
<span class="api-method get">GET</span> <code>/v1/auth/keys</code>
</div>

Retrieve all API keys for the authenticated account, with each key's real usage counts. This is the one create/read/update/delete key operation an **API key itself** can call (via `verify_jwt_or_api_key`) -- a session JWT also works. Returns metadata only -- full key values are never exposed after creation.

**Query Parameters**

The only supported filter is `project_id`. There is no `environment`, `type`, `status`, `limit` or `offset` filter -- the endpoint always returns every key on the account, and you filter the rest client-side.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | string | No | Return only keys tagged with this project id. |

**Response: 200 OK**

The response is `{ "keys": [...], "limits": {...} }` -- not a Stripe-style `{ "object": "list", "data": [...] }` envelope:

```json
{
  "keys": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "production-backend",
      "description": "",
      "key_prefix": "fh_live_4f3a",
      "status": "active",
      "key_type": "write",
      "scopes": ["images", "video", "chat"],
      "rate_limit_per_minute": 60,
      "created_at": "2026-07-17T10:30:00Z",
      "last_used_at": "2026-07-17T14:15:32Z",
      "expires_at": null,
      "requests_total": 12847,
      "tokens_total": 0,
      "allowed_ips": ["198.51.100.42"],
      "allowed_referrers": null,
      "metadata": {},
      "project_id": null,
      "retention_hours": null,
      "destination_id": null,
      "keep_local_copy": true,
      "requests_today": 40,
      "requests_month": 900,
      "tokens_month": 0,
      "cost_usd_month": 1.42,
      "credits_month": null,
      "priced_events_month": 900,
      "unpriced_events_month": 0
    }
  ],
  "limits": {
    "max_active_keys": 5,
    "active_keys": 1,
    "retention_presets_hours": [2, 12, 24, 168]
  }
}
```

`cost_usd_month` and `credits_month` are `null`, not `0`, when the key has no priced traffic yet -- a `0` would falsely claim we measured spend and found none.

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
| `allowedIps` | string[] | Array of allowed IPv4/IPv6 addresses. Exact matches only -- see the [IP Allowlisting](#ip-allowlisting) warning. |
| `allowedReferrers` | string[] | Stored, but not currently checked against the `Referer` header by anything. |
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
