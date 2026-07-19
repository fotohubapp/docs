# Console API

The Console API provides programmatic access to your FOTOhub dashboard data: statistics, traffic analytics, projects, API key management, webhooks, billing, and realtime usage. Use these endpoints to build custom dashboards, integrate monitoring into your infrastructure, or automate cost reporting.

## Authentication

All Console API endpoints require authentication via one of two methods:

1. **JWT from Supabase session** -- Used by the FOTOhub web dashboard. The JWT is obtained from your active Supabase Auth session.
2. **API key** -- For programmatic access. Requires at least `console:read` scope. Write operations (creating projects, managing keys) require `console:write` scope.

```
Authorization: Bearer <your_jwt_or_api_key>
```

::: info
API keys used to access Console endpoints are **not** the same as the API keys you manage through these endpoints. Console access requires a key with explicit `console:read` or `console:write` scopes.
:::

## Base URL

```
https://apis.fotohub.app/v1/console
```

---

## Dashboard Statistics

### Get Dashboard Stats

Retrieve aggregated dashboard statistics for the last 30 days including request counts, latency, error rates, and token usage.

```
GET /v1/console/stats
```

**Response (200 OK):**

```json
{
  "total_requests": 12450,
  "avg_latency_ms": 890,
  "error_rate": 0.023,
  "total_tokens": 2500000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `total_requests` | integer | Total API requests in the last 30 days |
| `avg_latency_ms` | integer | Average response latency in milliseconds |
| `error_rate` | float | Ratio of failed requests (0.0 - 1.0) |
| `total_tokens` | integer | Total tokens consumed across all models |

---

### Get Traffic Data

Retrieve time-bucketed traffic data for charting. Returns request and error counts grouped by time period.

```
GET /v1/console/traffic
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `24h` | Time period. Valid values: `1h`, `24h`, `7d`, `30d` |

**Response (200 OK):**

```json
[
  {
    "timestamp": "2026-07-17T10:00:00Z",
    "requests": 342,
    "errors": 8
  },
  {
    "timestamp": "2026-07-17T11:00:00Z",
    "requests": 415,
    "errors": 3
  }
]
```

---

### Get Daily Spending

Retrieve daily spending data for the last 30 days, broken down by service category. Useful for cost monitoring and budget alerts.

```
GET /v1/console/spend-chart
```

**Response (200 OK):**

```json
[
  {
    "date": "2026-07-17",
    "amount_pln": 12.50,
    "service_category": "image_generation"
  },
  {
    "date": "2026-07-17",
    "amount_pln": 3.20,
    "service_category": "chat"
  },
  {
    "date": "2026-07-16",
    "amount_pln": 8.75,
    "service_category": "video_generation"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Date in ISO format (YYYY-MM-DD) |
| `amount_pln` | float | Amount spent in PLN |
| `service_category` | string | Service category (e.g., `image_generation`, `chat`, `video_generation`, `music_generation`) |

---

## Realtime Usage

Get live credit and rate limit status. Useful for monitoring remaining capacity and implementing client-side throttling.

```
GET /v1/console/usage/realtime
```

**Response (200 OK):**

```json
{
  "tier": "developer",
  "credits": {
    "available": 450,
    "used_4h": 12.5,
    "limit_4h": 125,
    "remaining_4h": 112.5,
    "used_period": 50,
    "limit_period": 500,
    "remaining_period": 450
  },
  "rate_limits": {
    "rpm": 60,
    "tpm": 100000,
    "daily_quota": 1000
  },
  "total_requests_30d": 1250,
  "status": "active"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `tier` | string | Your account tier (`free`, `developer`, `pro`, `enterprise`) |
| `credits.available` | float | Total credits currently available |
| `credits.used_4h` | float | Credits consumed in the last 4-hour window |
| `credits.limit_4h` | float | Maximum credits allowed per 4-hour window |
| `credits.remaining_4h` | float | Credits remaining in the current 4-hour window |
| `credits.used_period` | float | Credits consumed in the current billing period |
| `credits.limit_period` | float | Maximum credits allowed per billing period |
| `credits.remaining_period` | float | Credits remaining in the current billing period |
| `rate_limits.rpm` | integer | Requests per minute limit |
| `rate_limits.tpm` | integer | Tokens per minute limit |
| `rate_limits.daily_quota` | integer | Maximum daily requests |
| `total_requests_30d` | integer | Total requests in the last 30 days |
| `status` | string | Account status (`active`, `suspended`, `rate_limited`) |

::: tip Polling Frequency
For realtime dashboards, poll this endpoint every 10-30 seconds. Avoid polling more frequently than once per 5 seconds to stay within rate limits.
:::

---

## Projects

Projects provide logical isolation for API keys and usage tracking. Each project has its own API keys, usage limits, and billing isolation.

### List Projects

```
GET /v1/console/projects
```

**Response (200 OK):**

```json
[
  {
    "id": "proj_abc123",
    "name": "Production App",
    "description": "Main production application",
    "created_at": "2026-05-01T10:00:00Z",
    "keys_count": 3,
    "requests_30d": 8420
  },
  {
    "id": "proj_def456",
    "name": "Staging",
    "description": "Staging environment",
    "created_at": "2026-06-15T14:30:00Z",
    "keys_count": 1,
    "requests_30d": 342
  }
]
```

### Create Project

```
POST /v1/console/projects
```

**Scope required:** `console:write`

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Project name. Must be unique within your account. 3-64 characters. |
| `description` | string | No | Optional description for organizational purposes. Max 256 characters. |

**Response (201 Created):**

```json
{
  "id": "proj_ghi789",
  "name": "New Project",
  "description": "My new integration",
  "created_at": "2026-07-17T12:00:00Z",
  "keys_count": 0,
  "requests_30d": 0
}
```

### Delete Project

```
DELETE /v1/console/projects/{id}
```

**Scope required:** `console:write`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Project ID (prefixed with `proj_`) |

::: warning
Deleting a project revokes all associated API keys immediately. This action cannot be undone.
:::

### Get Project Statistics

Retrieve usage statistics for a specific project including request counts, costs, and top models used.

```
GET /v1/console/projects/{id}/stats
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Project ID (prefixed with `proj_`) |

**Response (200 OK):**

```json
{
  "project_id": "proj_abc123",
  "period": "30d",
  "total_requests": 8420,
  "total_credits_used": 234.5,
  "total_cost_pln": 47.80,
  "top_models": [
    { "model": "flux-pro", "requests": 3200, "credits": 128 },
    { "model": "gemini-flash", "requests": 4100, "credits": 82 }
  ],
  "error_rate": 0.018
}
```

---

## API Keys Management

Manage your API keys programmatically. Keys are scoped to projects and can have granular permissions.

### List Keys

```
GET /v1/auth/keys
```

**Response (200 OK):**

```json
[
  {
    "id": "key_abc123",
    "name": "Production Backend",
    "key_prefix": "fh_live_sk2K...4",
    "key_type": "live",
    "scopes": ["ai:generate", "billing:read"],
    "project_id": "proj_abc123",
    "created_at": "2026-05-01T10:00:00Z",
    "expires_at": "2026-10-16T00:00:00Z",
    "last_used_at": "2026-07-17T14:22:00Z",
    "rate_limit_per_minute": 60
  }
]
```

### Create Key

```
POST /v1/auth/keys
```

**Scope required:** `console:write`

**Request Body:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | No | Auto-generated | Human-readable key name |
| `description` | string | No | — | Key description for your reference |
| `keyType` | string | No | — | `live` for production, `test` for sandbox |
| `scopes` | string[] | No | — | Permission scopes (e.g., `ai:generate`, `billing:read`, `console:read`) |
| `expiresInDays` | integer | No | Never | Key expiration in days from creation |
| `rateLimitPerMinute` | integer | No | `60` | Rate limit (1-600 requests per minute) |
| `allowedIps` | string[] | No | — | IP allowlist for additional security |
| `allowedReferrers` | string[] | No | — | HTTP referrer allowlist |
| `projectId` | string | No | — | Associate with a specific project |
| `metadata` | object | No | — | Custom metadata (key-value pairs) |

**Request Example:**

```json
{
  "name": "Production Backend",
  "keyType": "live",
  "scopes": ["ai:generate", "billing:read"],
  "expiresInDays": 90,
  "rateLimitPerMinute": 120,
  "allowedIps": ["203.0.113.10"],
  "projectId": "proj_abc123"
}
```

**Response (201 Created):**

```json
{
  "apiKey": "fh_live_sk2Kj8mN4pQ7rT1vX3yZ5bD9fH2gL6wA0cE4",
  "meta": {
    "name": "Production Backend",
    "expires_at": "2026-10-16T00:00:00Z",
    "rate_limit_per_minute": 60
  }
}
```

::: warning
The full API key is shown **only once** at creation time. Store it securely -- it cannot be retrieved later.
:::

### Revoke Key

```
DELETE /v1/auth/keys/{id}
```

**Scope required:** `console:write`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Key ID to revoke |

**Response (200 OK):**

```json
{
  "success": true,
  "revoked_at": "2026-07-17T15:00:00Z"
}
```

::: warning No Key Update
API keys cannot be modified after creation. To change a key's name, rate limit, IP allowlist, or scopes — revoke the existing key and create a new one with the desired settings.
:::

---

## Webhook Management

Configure webhooks to receive realtime notifications about events in your account.

### List Webhooks

```
GET /v1/console/webhooks
```

**Response (200 OK):**

```json
[
  {
    "id": "wh_abc123",
    "url": "https://example.com/webhooks/fotohub",
    "events": ["generation.completed", "credits.low"],
    "active": true,
    "created_at": "2026-06-01T10:00:00Z",
    "last_triggered_at": "2026-07-17T14:00:00Z"
  }
]
```

### Create Webhook

```
POST /v1/console/webhooks
```

**Scope required:** `console:write`

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | HTTPS endpoint to receive webhook payloads |
| `events` | string[] | Yes | Event types to subscribe to |
| `secret` | string | No | Signing secret for payload verification |

**Available events:** `generation.completed`, `generation.failed`, `credits.low`, `credits.depleted`, `key.created`, `key.revoked`, `system.degraded`, `system.recovered`

**Response (201 Created):**

```json
{
  "id": "wh_def456",
  "url": "https://example.com/webhooks/fotohub",
  "events": ["generation.completed", "credits.low"],
  "active": true,
  "secret": "whsec_abc123def456",
  "created_at": "2026-07-17T12:00:00Z"
}
```

### Update Webhook

```
PATCH /v1/console/webhooks/{id}
```

**Scope required:** `console:write`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | No | Updated endpoint URL |
| `events` | string[] | No | Updated event subscriptions |
| `active` | boolean | No | Enable or disable the webhook |

### Delete Webhook

```
DELETE /v1/console/webhooks/{id}
```

**Scope required:** `console:write`

### Test Webhook

Send a test payload to verify your webhook endpoint is configured correctly.

```
POST /v1/console/webhooks/{id}/test
```

**Scope required:** `console:write`

**Response (200 OK):**

```json
{
  "success": true,
  "response_code": 200,
  "response_time_ms": 145
}
```

---

## Billing

### Get Balance

```
GET /v1/billing/balance
```

**Response (200 OK):**

```json
{
  "balance_pln": 125.50,
  "credits_available": 450,
  "tier": "developer",
  "next_renewal": "2026-08-01T00:00:00Z"
}
```

### Get Usage History

```
GET /v1/console/billing/transactions
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `days` | integer | No | `30` | Number of days of history to return |
| `group_by` | string | No | `day` | Grouping interval: `hour`, `day`, `week` |

**Response (200 OK):**

```json
[
  {
    "date": "2026-07-17",
    "credits_used": 24.5,
    "cost_pln": 12.25,
    "requests": 342,
    "breakdown": {
      "image_generation": 15.0,
      "chat": 5.5,
      "video_generation": 4.0
    }
  }
]
```

### Get Billing Report

```
GET /v1/console/billing/report
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `group_by` | string | No | `day` | Grouping: `day`, `week`, `month` |
| `days` | integer | No | `30` | Report period in days |

### Get Invoices

```
GET /v1/console/billing/invoices
```

Returns a list of downloadable invoices for your account.

### Top-Up Credits

```
POST /v1/billing/top-up
```

**Scope required:** `console:write`

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount_pln` | float | Yes | Amount to add in PLN |
| `payment_method_id` | string | Yes | Saved payment method identifier |

**Response (200 OK):**

```json
{
  "success": true,
  "new_balance_pln": 225.50,
  "credits_added": 200,
  "transaction_id": "txn_abc123"
}
```

---

## Tier Management

### Get Tier Catalog

```
GET /v1/tiers/catalog
```

No authentication required. Returns all available tiers with pricing and limits.

### Get Current Tier

```
GET /v1/tiers/current
```

Returns the authenticated user's current tier, limits, usage, and upgrade options.

**Response (200 OK):**

```json
{
  "tier": "sub-startup",
  "name": "Startup",
  "category": "subscription",
  "limits": {
    "rpm": 300,
    "burst_4h": 1000,
    "monthly_credits": 5000,
    "concurrent_jobs": 20
  },
  "usage": {
    "used_4h": 45,
    "used_period": 1230,
    "requests_today": 89
  },
  "wallet": {
    "balance_pln": 450.00,
    "pending_pln": 0
  }
}
```

### Subscribe to Tier

```
POST /v1/tiers/subscribe
```

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tier` | string | Yes | Target tier: `sub-developer`, `sub-startup`, `sub-business` |

Returns a Stripe checkout URL for the subscription payment.

### Enterprise Application

```
POST /v1/tiers/enterprise/apply
```

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `company_name` | string | Yes | Company legal name |
| `contact_email` | string | Yes | Contact email |
| `company_size` | string | Yes | `1-10`, `11-50`, `51-200`, `201-500`, `500+` |
| `use_case` | string | Yes | Detailed description of intended usage (min 20 chars) |
| `expected_monthly_volume` | string | Yes | E.g. "100k images, 10k videos" |
| `budget_range` | string | No | E.g. "2000-5000 PLN/month" |
| `nip` | string | No | Polish tax ID (NIP) |

### Wallet

```
GET /v1/tiers/wallet
```

Returns wallet balance, recent transactions, and monthly summary.

```
POST /v1/tiers/wallet/topup
```

**Request Body (option A — package):**

```json
{"package": "topup-500"}
```

**Request Body (option B — custom amount):**

```json
{"amount_pln": 150}
```

Returns a Stripe checkout URL for the payment. Minimum 20 PLN, maximum 50,000 PLN.

---

## System Status

Check the health status of all FOTOhub services.

```
GET /v1/console/system/status
```

**Response (200 OK):**

```json
[
  {
    "service": "image_generation",
    "status": "operational",
    "latency_ms": 450,
    "uptime_30d": 99.97
  },
  {
    "service": "video_generation",
    "status": "operational",
    "latency_ms": 1200,
    "uptime_30d": 99.92
  },
  {
    "service": "chat_completions",
    "status": "operational",
    "latency_ms": 280,
    "uptime_30d": 99.99
  },
  {
    "service": "music_generation",
    "status": "degraded",
    "latency_ms": 3500,
    "uptime_30d": 99.85
  }
]
```

::: info Status Values
Possible status values: `operational`, `degraded`, `down`. Subscribe to status webhooks in your console for proactive alerts.
:::

---

## Code Examples

### Dashboard Stats and Traffic

::: code-group

```python [Python]
import requests

headers = {"Authorization": "Bearer fh_live_your_key_here"}
base = "https://apis.fotohub.app/v1/console"

# Get dashboard stats
stats = requests.get(f"{base}/stats", headers=headers).json()
print(f"Total requests (30d): {stats['total_requests']}")
print(f"Avg latency: {stats['avg_latency_ms']}ms")
print(f"Error rate: {stats['error_rate'] * 100:.1f}%")

# Get traffic data
traffic = requests.get(
    f"{base}/traffic",
    headers=headers,
    params={"period": "7d"}
).json()

for bucket in traffic:
    print(f"{bucket['timestamp']}: {bucket['requests']} req, {bucket['errors']} err")
```

```typescript [TypeScript]
const headers = {
  Authorization: 'Bearer fh_live_your_key_here',
};
const base = 'https://apis.fotohub.app/v1/console';

// Get dashboard stats
const statsRes = await fetch(`${base}/stats`, { headers });
const stats = await statsRes.json();
console.log(`Total requests (30d): ${stats.total_requests}`);
console.log(`Avg latency: ${stats.avg_latency_ms}ms`);

// Get traffic data
const trafficRes = await fetch(`${base}/traffic?period=7d`, { headers });
const traffic = await trafficRes.json();

for (const bucket of traffic) {
  console.log(`${bucket.timestamp}: ${bucket.requests} req`);
}
```

```bash [cURL]
# Dashboard stats
curl https://apis.fotohub.app/v1/console/stats \
  -H "Authorization: Bearer fh_live_your_key_here"

# Traffic data (7 days)
curl "https://apis.fotohub.app/v1/console/traffic?period=7d" \
  -H "Authorization: Bearer fh_live_your_key_here"

# Spending chart
curl https://apis.fotohub.app/v1/console/spend-chart \
  -H "Authorization: Bearer fh_live_your_key_here"
```

:::

### Realtime Monitoring

::: code-group

```python [Python]
import requests
import time

headers = {"Authorization": "Bearer fh_live_your_key_here"}
url = "https://apis.fotohub.app/v1/console/usage/realtime"

def check_usage():
    """Poll realtime usage and alert if credits are low."""
    response = requests.get(url, headers=headers)
    data = response.json()

    credits = data["credits"]
    print(f"Tier: {data['tier']}")
    print(f"Credits available: {credits['available']}")
    print(f"4h usage: {credits['used_4h']}/{credits['limit_4h']}")
    print(f"Period usage: {credits['used_period']}/{credits['limit_period']}")

    # Alert if below 10% remaining
    if credits["remaining_period"] < credits["limit_period"] * 0.1:
        print("WARNING: Credits running low!")

    return data

# Poll every 30 seconds
while True:
    check_usage()
    time.sleep(30)
```

```typescript [TypeScript]
const headers = {
  Authorization: 'Bearer fh_live_your_key_here',
};
const url = 'https://apis.fotohub.app/v1/console/usage/realtime';

async function checkUsage() {
  const res = await fetch(url, { headers });
  const data = await res.json();

  const { credits } = data;
  console.log(`Tier: ${data.tier}`);
  console.log(`Credits: ${credits.available}`);
  console.log(`4h: ${credits.used_4h}/${credits.limit_4h}`);

  // Alert if below 10%
  if (credits.remaining_period < credits.limit_period * 0.1) {
    console.warn('Credits running low!');
  }

  return data;
}

// Poll every 30 seconds
setInterval(checkUsage, 30_000);
```

```bash [cURL]
# Realtime usage check
curl https://apis.fotohub.app/v1/console/usage/realtime \
  -H "Authorization: Bearer fh_live_your_key_here"

# System status
curl https://apis.fotohub.app/v1/console/system/status \
  -H "Authorization: Bearer fh_live_your_key_here"
```

:::

---

## Fraud Detection

Monitor your account's security status and risk indicators.

```
GET /v1/console/fraud/status
```

**Response (200 OK):**

```json
{
  "status": "clear",
  "risk_score": 0,
  "flags": [],
  "email_verified": true,
  "tier": "pro",
  "protections": {
    "rate_limiting": true,
    "ip_whitelist": true,
    "key_expiration": true,
    "usage_alerts": true,
    "anomaly_detection": true
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `clear` \| `warning` \| `flagged` |
| `risk_score` | integer | 0-100 risk assessment |
| `flags` | string[] | Active risk flags |
| `protections` | object | Security features enabled |

**Possible flags:**

| Flag | Risk Score | Description |
|------|-----------|-------------|
| `email_unverified` | +30 | Email address not confirmed |
| `manual_flag` | +50 | Manually flagged by admin |
| `payment_failures` | +20 | More than 3 failed payments |
| `excessive_keys` | +15 | More than 10 API keys created |

---

## Error Responses

All Console API endpoints return standard error responses:

```json
{
  "error": {
    "code": "insufficient_scope",
    "message": "This endpoint requires console:write scope",
    "status": 403
  }
}
```

| Status | Code | Description |
|--------|------|-------------|
| 401 | `unauthorized` | Missing or invalid authentication |
| 403 | `insufficient_scope` | API key lacks required scope |
| 404 | `not_found` | Resource does not exist |
| 429 | `rate_limited` | Too many requests, retry after backoff |
| 500 | `internal_error` | Server error, contact support |
