# Console API

The Console API provides programmatic access to your FOTOhub dashboard data: statistics, traffic analytics, projects, API key management, webhooks, billing, and realtime usage. Use these endpoints to build custom dashboards, integrate monitoring into your infrastructure, or automate cost reporting.

## Authentication

```
Authorization: Bearer <your_jwt_or_api_key>
```

Authorization is **per endpoint**, not per scope:

| Endpoints | Accepts |
|-----------|---------|
| `/console/stats`, `/traffic`, `/spend-chart`, `/projects` (all), `/billing/*`, `/usage/realtime`, `/fraud/status` | **Supabase session JWT only.** An `fh_live_` API key returns 401 |
| `/console/logs`, `/console/system/status`, `/console/webhooks` (read), `GET /v1/auth/keys` | JWT **or** API key |
| `POST`/`PATCH`/`DELETE /console/webhooks/*` | JWT, or an API key whose `key_type` is `write` or `admin` (a read-only key gets 403) |
| `POST`/`PATCH`/`DELETE /v1/auth/keys/*` | **JWT only** — no API key can mint or reconfigure keys |

::: danger There are no `console:read` / `console:write` scopes
Those two scope strings do not exist anywhere in the API. Nothing validates a
key's `scopes` array on any console endpoint — you can put any strings you like
in it and it changes nothing. Access is decided by the endpoint's own
authenticator (JWT vs key) plus `key_type` on writes, per the table above.

The practical consequence: most of this page cannot be driven with an API key at
all. If a call returns `{"detail":"Invalid or expired token"}` with an
`fh_live_` key, that endpoint is JWT-only and no key or scope will open it.
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
  "avg_latency": 890.15,
  "error_rate": 2.30,
  "total_tokens": 2500000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `total_requests` | integer | Total API requests in the last 30 days |
| `avg_latency` | float | Average response latency in milliseconds, 2 decimals |
| `error_rate` | float | **Percentage** of requests that returned >= 400, 2 decimals (`2.30` means 2.3%) |
| `total_tokens` | integer | Total tokens consumed across all models |

::: warning Field names
The field is `avg_latency`, not `avg_latency_ms`, and `error_rate` is a percent
value (0-100) — not a 0.0-1.0 ratio. On an account with no traffic in the window
the endpoint returns zeros for all four.
:::

---

### Get Traffic Data

Retrieve time-bucketed traffic data for charting. Returns request and error counts grouped by time period.

```
GET /v1/console/traffic
```

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hours` | integer | `24` | Window in hours. Range `1`–`8760` (one year); values outside it return `422`. |

The bucket width follows the window, so a longer window returns coarser
buckets rather than proportionally more of them:

| `hours` | Bucket width | Label format | Example |
|---------|--------------|--------------|---------|
| ≤ 48 | 1 hour | `HH:00` | `"14:00"` |
| ≤ 168 | 1 hour, dated | `DD.MM HH:00` | `"17.07 14:00"` |
| > 168 | 1 day | `DD.MM` | `"17.07"` |

**Response (200 OK)** — `hours=24`:

```json
[
  { "time": "10:00", "requests": 342, "errors": 8 },
  { "time": "11:00", "requests": 415, "errors": 3 }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `time` | string | Pre-formatted **chart label**, not a timestamp — see the warning below |
| `requests` | integer | Requests in that bucket |
| `errors` | integer | Requests in that bucket that returned >= 400 |

::: warning `time` is a display label, not a timestamp
`time` comes out of `to_char()` and its shape depends on `hours` (see the table
above). It is **not** ISO 8601, carries **no year**, and in the default 24-hour
form carries no date either — so a 24h window spanning midnight yields two
`"23:00"`-style labels with nothing to distinguish the days. Render it as-is;
do not parse it or feed it to a date library.

There is no `timestamp` field and no `period` parameter — the window is `hours`.
Buckets with zero traffic are **omitted entirely** rather than returned as
zeros, so the array is normally shorter than the window implies and you cannot
assume a fixed row count.
:::

---

### Get Daily Spending

Retrieve daily spending totals for the **last 14 days**. Useful for cost
monitoring and budget alerts.

```
GET /v1/console/spend-chart
```

**Response (200 OK):**

```json
[
  { "day": "Jul 16", "amount": 2.34, "currency": "USD" },
  { "day": "Jul 17", "amount": 4.21, "currency": "USD" }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `day` | string | Pre-formatted day label (`Mon DD`), not an ISO date — no year, so a window crossing 1 January is ambiguous |
| `amount` | float | Total spent that day, in `currency` |
| `currency` | string | `USD` or `PLN` — the unit of `amount`. Read it; do not assume |

::: warning One currency per series
Accounts that were active before the August 2026 switch to USD billing may hold
both USD and PLN charges. This endpoint never adds the two together: it picks a
single currency for the whole 14-day series — USD if the window contains any USD
charge, otherwise PLN — and reports it in `currency`, which is therefore the
same on every row. Days holding only charges in the *other* currency come back
as absent rather than as a converted figure, so a legacy account can show a
sparser series than its transaction list. `GET /v1/console/billing/transactions`
returns every row with its own `currency` if you need the complete picture.
:::

::: info No per-service breakdown here
This endpoint returns one row per day with a single total. For a breakdown by
service, use `GET /v1/console/billing/transactions`, which returns
`service_category` and `service_name` per row.
:::

---

## Realtime Usage

Get live credit and rate limit status. Useful for monitoring remaining capacity and implementing client-side throttling.

```
GET /v1/console/usage/realtime
```

**Response (200 OK):**

```json
{
  "tier": "sub-developer",
  "credits": {
    "available": 450,
    "used_4h": 12.5,
    "limit_4h": 200,
    "remaining_4h": 187.5,
    "used_period": 50,
    "limit_period": 500,
    "remaining_period": 450
  },
  "rate_limits": {
    "rpm": 60,
    "tpm": 50000,
    "daily_quota": 500
  },
  "total_requests_30d": 1250,
  "status": "active"
}
```

::: tip Limits are derived from `tier`, so they move together
Every field under `rate_limits`, plus `limit_4h` and `limit_period`, is looked up
from one table keyed by `tier` — they are never mixed between tiers. The values
above are the real `sub-developer` row. If you are hardcoding expectations in a
test, take all of them from the same tier or the response will not match.
:::

| Field | Type | Description |
|-------|------|-------------|
| `tier` | string | Your account tier. Real values: `payg-basic`, `payg-standard`, `payg-premium`, `sub-developer`, `sub-startup`, `sub-business`, `sub-enterprise` (plus the legacy `free` / `starter` / `medium` / `professional` / `business` / `team` names on older accounts) |
| `credits.available` | float | `profiles.ai_credits` — the standing credit balance, unrelated to the 4h/period windows below (those are usage counters, not a balance) |
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
{
  "projects": [
    {
      "id": "3f2a...",
      "user_id": "9c1e...",
      "name": "Production App",
      "slug": "production-app",
      "description": "Main production application",
      "parent_id": null,
      "metadata": {},
      "created_at": "2026-05-01T10:00:00Z"
    }
  ]
}
```

::: warning Wrapped in `projects`, and no counts
The response is an object with a `projects` array, not a bare array, and rows
are the raw project record — there is no `keys_count` and no `requests_30d`.
Project ids are plain UUIDs, **not** `proj_`-prefixed. For per-project traffic
call `GET /v1/console/projects/{id}/stats`.
:::

### Create Project

```
POST /v1/console/projects
```

**Auth:** session JWT only.

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Project name. Non-empty; a `slug` is derived from it automatically (first 60 chars, non-alphanumerics become `-`) |
| `description` | string | No | Optional description |
| `parent_id` | string | No | Parent project UUID, to nest this project under another |

**Limit:** 3 **root** projects (those with no `parent_id`) per account — the 4th
returns 400. Nested projects are not counted against that cap. Names are not
required to be unique.

**Response (200 OK):**

```json
{
  "id": "7b4c1e28-90d3-4a55-b1f2-6c8e5a0d37f9",
  "name": "New Project"
}
```

The response carries only `id` and `name` — re-list the projects if you need the
full record. The status code is 200, not 201.

### Delete Project

```
DELETE /v1/console/projects/{id}
```

**Auth:** session JWT only.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Project UUID |

Returns `{"message": "Project deleted"}`, or 404 if the project does not exist
or is not yours.

::: warning
Deleting a project cannot be undone. Keys that referenced it keep working —
`api_keys.project_id` is not cascaded by this endpoint, so revoke them
explicitly via `DELETE /v1/auth/keys/{id}` if that is what you intended.
:::

### Get Project Statistics

Retrieve usage statistics for a specific project over the last 30 days.

```
GET /v1/console/projects/{id}/stats
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Project UUID |

**Response (200 OK):**

```json
{
  "total_requests": 8420,
  "total_tokens": 361102,
  "total_cost": 12.81,
  "error_rate": 1.80,
  "avg_latency": 2465.66
}
```

| Field | Type | Description |
|-------|------|-------------|
| `total_requests` | integer | Requests in the last 30 days |
| `total_tokens` | integer | Sum of tokens across those requests |
| `total_cost` | float | Sum of `api_usage_events.cost` — USD for anything logged since 2026-08-05 |
| `error_rate` | float | Percentage (e.g. `1.80` = 1.8%), not a fraction |
| `avg_latency` | float | Average latency in milliseconds |

::: warning
There is no `project_id`, `period`, `total_credits_used` or `top_models` field
in this response. For per-model counts use `GET /v1/usage`, which returns
`topModels[]`.
:::

---

## API Keys Management

Manage your API keys programmatically. Keys are scoped to projects and can have granular permissions.

### List Keys

```
GET /v1/auth/keys
```

Optional query parameter: `project_id` to scope the list to one project.

**Response (200 OK):**

```json
{
  "keys": [
    {
      "id": "key_abc123",
      "name": "Production Backend",
      "description": null,
      "key_prefix": "fh_live_sk2K...4",
      "status": "active",
      "key_type": "live",
      "scopes": ["ai:generate", "billing:read"],
      "rate_limit_per_minute": 60,
      "created_at": "2026-05-01T10:00:00Z",
      "last_used_at": "2026-07-17T14:22:00Z",
      "expires_at": "2026-10-16T00:00:00Z",
      "requests_total": 18422,
      "tokens_total": 5120334,
      "allowed_ips": ["203.0.113.10"],
      "allowed_referrers": null,
      "metadata": {},
      "project_id": "proj_abc123",
      "retention_hours": 24,
      "destination_id": null,
      "keep_local_copy": true
    }
  ],
  "limits": {
    "max_active_keys": 5,
    "active_keys": 1,
    "retention_presets_hours": [2, 12, 24, 168]
  }
}
```

::: info Object, not array
This endpoint returns an object with `keys` and `limits` — `limits.max_active_keys`
is your tier's cap, so read it instead of hardcoding a number.
:::

### Create Key

```
POST /v1/auth/keys
```

**Auth:** session JWT only — an API key cannot create keys.

**Request Body:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | No | Auto-generated | Human-readable key name |
| `description` | string | No | — | Key description for your reference |
| `keyType` | string | No | — | `live` for production, `test` for sandbox |
| `scopes` | string[] | No | — | Stored verbatim on the key and returned by `GET /v1/auth/keys`. **Not enforced** — no endpoint checks this array today, so treat it as a label for your own bookkeeping, not a permission boundary |
| `expiresInDays` | integer | No | Never | Key expiration in days from creation |
| `rateLimitPerMinute` | integer | No | `60` | Rate limit (1-600 requests per minute) |
| `allowedIps` | string[] | No | — | IP allowlist for additional security |
| `allowedReferrers` | string[] | No | — | HTTP referrer allowlist |
| `projectId` | string | No | — | Associate with a specific project |
| `metadata` | object | No | — | Custom metadata (key-value pairs) |
| `retentionHours` | integer | No | Never expires | How long files this key generates stay in FOTOhub storage (1-8760). Omit to keep until deleted |
| `destinationId` | string | No | — | Customer-owned S3 destination to mirror this key's output into |
| `keepLocalCopy` | boolean | No | `true` | With a destination set, also keep our copy until retention expires |

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
    "rate_limit_per_minute": 120,
    "subscription_id": null,
    "retention_hours": 24,
    "destination_id": null,
    "keep_local_copy": true
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

**Auth:** session JWT only.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Key ID to revoke |

**Response (200 OK):**

```json
{
  "message": "Key revoked successfully"
}
```

### Update Key

```
PATCH /v1/auth/keys/{id}
```

**JWT only** — an API key cannot reconfigure keys.

Accepts any of `name`, `description`, `rate_limit_per_minute` (capped at 600),
`allowed_ips`, `allowed_referrers`, `scopes`, `keep_local_copy`,
`retention_hours` / `clear_retention`, `destination_id` / `clear_destination`.
Sending no recognised field returns 400; a revoked key returns 400.

```json
{
  "key": { "id": "key_abc123", "name": "Production Backend", "...": "..." },
  "applies_to": "objects generated after this change"
}
```

Retention is stamped onto each object at write time, so shortening it does not
purge files that already exist.

### Rotate Key

```
POST /v1/auth/keys/{id}/rotate
```

Issues a **new** key row with every setting copied (scopes, limits, retention,
destination) and returns the same `{apiKey, meta}` shape as create. The old key
is revoked separately, so its usage history stays attributable.

::: tip Keys are editable
Earlier versions of this page said keys could not be modified after creation.
They can — use `PATCH` above to change name, rate limit, IP allowlist or scopes,
and `POST .../rotate` to replace the secret without losing configuration.
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
    "name": "Production Notifications",
    "url": "https://example.com/webhooks/fotohub",
    "events": ["generation.completed", "credits.low"],
    "active": true,
    "project_id": null,
    "created_at": "2026-06-01T10:00:00Z",
    "updated_at": "2026-07-17T14:00:00Z"
  }
]
```

Max 10 webhooks per user. The signing `secret` is **never** returned here —
only once, in the create response. There is no `last_triggered_at`; use
`GET /v1/console/webhooks/{id}/logs` for delivery history.

### Create Webhook

```
POST /v1/console/webhooks
```

**Auth:** session JWT, or an API key with `key_type` `write`/`admin`.

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Display name, 1-100 chars |
| `url` | string | Yes | HTTPS endpoint to receive webhook payloads. Private/loopback/CGNAT addresses are rejected |
| `events` | string[] | Yes | Event types to subscribe to (no duplicates) |
| `headers` | object | No | Up to 10 custom headers sent with each delivery |

You cannot supply a `secret` — one is generated for you and returned once, in
this response only.

**Available events:** `generation.completed`, `generation.failed`,
`credits.low`, `credits.depleted`, `billing.charged`, `key.used`,
`images.batch.completed`, `background.removed`, `background.replaced`,
`background.blurred`, `shadow.added`, `commerce.job.completed`,
`commerce.job.failed`, `commerce.item.completed`,
`commerce.job.awaiting_credits`. Anything else is rejected with 400 —
`key.created`, `key.revoked`, `system.degraded` and `system.recovered` are
**not** valid event types.

**Response (201 Created):**

```json
{
  "id": "wh_def456",
  "name": "Production Notifications",
  "url": "https://example.com/webhooks/fotohub",
  "events": ["generation.completed", "credits.low"],
  "active": true,
  "headers": {},
  "secret": "7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c...",
  "created_at": "2026-07-17T12:00:00Z",
  "updated_at": "2026-07-17T12:00:00Z"
}
```

### Update Webhook

```
PATCH /v1/console/webhooks/{id}
```

**Auth:** session JWT, or an API key with `key_type` `write`/`admin`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | No | Updated display name |
| `url` | string | No | Updated endpoint URL (HTTPS, public address) |
| `events` | string[] | No | Updated event subscriptions |
| `active` | boolean | No | Enable or disable the webhook |
| `headers` | object | No | Replace the custom headers |

At least one field must be present (400 otherwise). The response omits
`secret`.

### Delete Webhook

```
DELETE /v1/console/webhooks/{id}
```

**Auth:** session JWT, or an API key with `key_type` `write`/`admin`.

Returns 204 No Content.

### Test Webhook

Send a test payload to verify your webhook endpoint is configured correctly.

```
POST /v1/console/webhooks/{id}/test
```

**Auth:** session JWT, or an API key with `key_type` `write`/`admin`.

The webhook must be `active` (400 otherwise). There is no `test` event type —
the delivery reuses the webhook's own **first configured event** with
`data: {"test": true, "timestamp": ..., "webhook_id": ...}`.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Test event fired successfully.",
  "timestamp": "2026-08-06T09:00:00Z"
}
```

`success: false` comes back with a `message` explaining which stage failed
("No delivery was attempted — this webhook has no subscribed events." or
"Delivery attempted but your endpoint did not return a success response after
3 tries."). There is no `response_code` and no `response_time_ms`.

---

## Billing

### Get Balance

```
GET /v1/billing/balance
```

**Response (200 OK):**

```json
{
  "tier": "sub-developer",
  "credits": {
    "used_4h": 12,
    "limit_4h": 200,
    "remaining_4h": 188,
    "used_period": 50,
    "limit_period": 500,
    "remaining_period": 450,
    "bonus_remaining": 0
  },
  "wallet": {
    "balance": 33.63,
    "currency": "USD",
    "pending": 0,
    "total_earned": 60.00,
    "total_withdrawn": 0
  },
  "api_subscription": null,
  "overage": {
    "spent_this_month": 4.12,
    "hard_limit_usd": 25.0,
    "remaining": 20.88
  }
}
```

The wallet is USD. `credits.*` are credit counts, not money — 1 credit is worth
$0.0536 if the operation falls through to wallet billing.

### Get Usage History

```
GET /v1/console/billing/transactions
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | `50` | Rows to return (max 500) |
| `offset` | integer | No | `0` | Pagination offset |
| `category` | string | No | — | Filter by `service_category` (`api`, `storage`, `overage`) |

**Response (200 OK):**

```json
{
  "transactions": [
    {
      "id": "b1f2...",
      "period_start": "2026-07-17T00:00:00Z",
      "service_category": "api",
      "service_name": "generate_image:seedream-5-0-260128",
      "description": "[wallet] generate_image",
      "usage_quantity": 1,
      "usage_unit": "request",
      "amount": 0.0492,
      "currency": "USD"
    }
  ]
}
```

Rows are wrapped in a `transactions` array and carry an explicit `currency`.
Rows written before the 2026-08-05 cutover say `PLN`; everything after says
`USD`. There are no `days` or `group_by` parameters on this endpoint — use
`GET /v1/console/billing/report` for grouped output.

### Get Billing Report

```
GET /v1/console/billing/report
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `group_by` | string | No | `day` | Passed straight through to the `get_billing_report` RPC as `p_group_by` |
| `days` | integer | No | `30` | Report period in days, **max 90** (a larger value returns 422) |

Response is `{"data": [...]}` — an empty array when there is nothing in the
window.

### Get Invoices

```
GET /v1/console/billing/invoices
```

Returns `{"invoices": [...]}` — raw `billing_invoices` rows, newest first, with
no query parameters and no pagination. Empty for most accounts: rows are written
by the Stripe webhook, so an account that has never completed a Stripe payment
has none. There is no download endpoint here; use `GET /v1/billing/invoices`
(different route, JWT-only) for Stripe's own payment history.

### Top Up the Wallet

```
POST /v1/billing/topup
```

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `package` | string | Yes | One of `topup-50`, `topup-100`, `topup-250`, `topup-500`, `topup-1000`, `topup-5000` |
| `pay_currency` | string | No | `usd` (default) or `pln` — changes only what Stripe charges; the wallet is always credited the USD amount |

**Response (200 OK):**

```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_live_...",
  "package": {
    "slug": "topup-500",
    "amount_usd": 120,
    "bonus_credits": 1500,
    "discount_pct": 15
  },
  "pay_currency": "usd"
}
```

The endpoint returns a Stripe Checkout URL — the balance moves only after the
payment webhook lands, so there is no `new_balance` in this response.

::: warning Package slugs are historical
The slug numbers date from when packages were priced in PLN. The amounts are
now USD and no longer match the slug: `topup-50` = **$15**, `topup-100` =
**$25**, `topup-250` = **$60**, `topup-500` = **$120**, `topup-1000` =
**$225**, `topup-5000` = **$1,000**. Read `amount_usd` from
`GET /v1/billing/topup/packages`, never the slug.
:::

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
    "balance_usd": 120.00,
    "pending_usd": 0,
    "lifetime_spend": 180.00
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
| `budget_range` | string | No | Free-text, e.g. "$500-1500/month" |
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

(`topup-500` is **$120** — see the slug warning under Top Up the Wallet.)

**Request Body (option B — custom amount):**

```json
{"amount_usd": 150}
```

Optionally add `"pay_currency": "pln"` to pay via BLIK/card/bank in PLN while
still crediting the same USD amount to the wallet.

Returns a Stripe checkout URL for the payment. Minimum **$10**, maximum
**$15,000** (contact sales above that). The legacy `amount_pln` key is still
accepted during rollout but is interpreted as USD, not converted.

---

## System Status

Check the health status of all FOTOhub services.

```
GET /v1/console/system/status
```

**Response (200 OK):**

```json
{
  "overall": "operational",
  "services": {
    "api": "operational",
    "billing": "operational",
    "brand": "operational",
    "s3": "operational",
    "chat": "operational",
    "social": "operational",
    "agent": "down"
  },
  "region": "eu-central-1"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `overall` | string | `operational` only when every service below is; otherwise `degraded` |
| `services` | object | Backend service name → `operational` \| `degraded` \| `down`. Fixed set of 7 keys: `api`, `billing`, `brand`, `s3`, `chat`, `social`, `agent` |
| `region` | string | Always `eu-central-1` |

::: warning It is an object, and there is no latency or uptime
The response is a single object, not an array of per-service records. There is no
`latency_ms` and no `uptime_30d` — nothing stores health-check history, so no
availability figure is computed. Use [status.fotohub.app](https://status.fotohub.app)
for uptime. Service keys are internal backends (`chat`, `agent`, …), not product
features (`image_generation`, `music_generation`) — a `degraded` value means a
`/health` probe returned >= 500, and `down` means it did not answer within 3s.

There are also **no status webhooks**: `system.degraded` and `system.recovered`
are not valid event types (see the webhook event list above).
:::

---

## Code Examples

::: danger These examples need a session JWT, not an API key
`/stats`, `/traffic`, `/spend-chart` and `/usage/realtime` are gated on
`verify_jwt` — sending `Authorization: Bearer fh_live_...` returns
`401 {"detail":"Invalid or expired token"}`. Substitute a Supabase session
access token for the `fh_live_your_key_here` placeholders below. `/logs` and
`/system/status` are the only endpoints on this page that accept an API key
for reads.
:::

### Dashboard Stats and Traffic

::: code-group

```python [Python]
import requests

headers = {"Authorization": "Bearer fh_live_your_key_here"}
base = "https://apis.fotohub.app/v1/console"

# Get dashboard stats
stats = requests.get(f"{base}/stats", headers=headers).json()
print(f"Total requests (30d): {stats['total_requests']}")
print(f"Avg latency: {stats['avg_latency']}ms")
print(f"Error rate: {stats['error_rate']:.1f}%")   # already a percent, do not x100

# Get traffic data -- fixed 24h window, no query parameters
traffic = requests.get(f"{base}/traffic", headers=headers).json()

for bucket in traffic:
    print(f"{bucket['time']}: {bucket['requests']} req, {bucket['errors']} err")
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
console.log(`Avg latency: ${stats.avg_latency}ms`);
console.log(`Error rate: ${stats.error_rate.toFixed(1)}%`); // already a percent

// Get traffic data -- fixed 24h window, no query parameters
const trafficRes = await fetch(`${base}/traffic`, { headers });
const traffic = await trafficRes.json();

for (const bucket of traffic) {
  console.log(`${bucket.time}: ${bucket.requests} req, ${bucket.errors} err`);
}
```

```bash [cURL]
# Dashboard stats
curl https://apis.fotohub.app/v1/console/stats \
  -H "Authorization: Bearer fh_live_your_key_here"

# Traffic data (last 24h -- the window is fixed, ?period is ignored)
curl "https://apis.fotohub.app/v1/console/traffic" \
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
  "account_age_days": 412,
  "email_verified": true,
  "tier": "professional",
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
| `status` | string | Derived from `risk_score`: `clear` (< 20), `warning` (20-49), `flagged` (>= 50) |
| `risk_score` | integer | Sum of the flag weights below, capped at 100 |
| `flags` | string[] | Active risk flags |
| `account_age_days` | integer \| null | Whole days since account creation; `null` if the timestamp cannot be parsed |
| `email_verified` | boolean | From the auth record's `email_confirmed_at` |
| `tier` | string | `profiles.subscription_tier` — the raw stored value (`free`, `starter`, `professional`, `sub-startup`, …), not a resolved tier slug |
| `protections` | object | Five booleans, all hardcoded `true` — they describe features the platform has, not per-account settings, so they never vary |

**Possible flags:**

| Flag | Risk Score | Condition |
|------|-----------|-----------|
| `email_unverified` | +30 | Auth record has no `email_confirmed_at` |
| `payment_failures` | +20 | `subscription_status` is `past_due` or `unpaid` |
| `excessive_keys` | +15 | More than 10 keys with `status = active` (revoked and expired keys do not count) |
| `new_unverified_account` | +15 | Account is less than 1 day old **and** email is unverified |

::: warning No `manual_flag`
There is no admin-flagging path, so `manual_flag` is never returned and the
maximum reachable `risk_score` is 65 (`flagged`) — 45 without the age flag.
:::

---

## Error Responses

All Console API endpoints return standard error responses:

```json
{
  "detail": "Invalid or expired token"
}
```

| Status | `detail` | When |
|--------|----------|------|
| 401 | `Missing Authorization header` | No `Authorization` header at all |
| 401 | `Invalid or expired token` | Bad JWT, or an API key sent to a JWT-only endpoint |
| 403 | `This API key is read-only. ...` | Write endpoint reached with a `read-only` key |
| 404 | `Not Found` / `Project not found` | Unknown path, or a resource that is not yours |
| 405 | `Method Not Allowed` | Wrong verb on an existing path |
| 422 | *(FastAPI validation array)* | Malformed body/query — `detail` is a list of field errors, not a string |
| 500 | *(varies)* | Server error, contact support |

::: warning No `error` object, no error codes
There is no `{"error": {"code": ..., "status": ...}}` envelope on this API and no
machine-readable error-code vocabulary (`insufficient_scope`, `rate_limited`,
`internal_error` are not emitted anywhere). Every failure is FastAPI's
`{"detail": ...}`, where `detail` is usually a string but is a **list** for 422
validation failures and an **object** for tier/rate-limit rejections raised by
the tier enforcer (`{"error": "rate_limit_exceeded", "message": ..., "tier": ...,
"limit_rpm": ..., "upgrade_url": ...}` nested under `detail`, with a
`Retry-After: 60` header). Branch on the HTTP status, not on a code string.
:::
