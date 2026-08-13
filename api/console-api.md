# Console API

The Console API provides programmatic access to your FOTOhub dashboard data: statistics, traffic analytics, projects, API key management, webhooks, billing, and realtime usage. Use these endpoints to build custom dashboards, integrate monitoring into your infrastructure, or automate cost reporting.

## Authentication

```
Authorization: Bearer <your_jwt_or_api_key>
```

Authorization is **per endpoint**, not per scope:

| Endpoints | Accepts |
|-----------|---------|
| `/console/overview`, `/console/stats`, `/traffic`, `/spend-chart`, `/projects` (all), `/billing/*`, `/usage/realtime`, `/fraud/status` | **Supabase session JWT only.** An `fh_live_` API key returns 401 |
| `/console/logs`, `/console/logs/summary`, `/console/system/status`, `/console/webhooks` (read), `GET /v1/auth/keys` | JWT **or** API key |
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

### Get Account Overview

One call returning everything the console's Dashboard and Usage pages render for a
single window: volume, latency percentiles, spend, per-model and per-endpoint
breakdowns, plan utilisation, and the error detail. Prefer this over
`/console/stats` + `/console/traffic` + client-side aggregation — every figure in
the response is computed from one scan, so the parts always add up to the totals.

```
GET /v1/console/overview
```

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hours` | integer | `24` | Window in hours. Range `1`–`8760`; outside it returns `422`. The console uses `24`, `168` and `720`. |

The window applies to **every** figure in the response, including the money —
unlike `/console/stats`, which is pinned to 30 days.

**Response (200 OK)** — abridged:

```json
{
  "hours": 24,
  "since": "2026-08-07T13:14:23.935549+00:00",
  "totals": {
    "requests": 109, "errors": 82, "error_rate": 75.23,
    "tokens": 102400, "images": 2, "credits": 12.0,
    "avg_latency_ms": 6564, "p50_latency_ms": 187,
    "p95_latency_ms": 28648, "p99_latency_ms": 115857,
    "avg_generation_ms": 17280, "avg_transfer_ms": 1804,
    "measured_generation": 2, "measured_transfer": 2,
    "models_seen": 2, "endpoints_seen": 20,
    "first_seen": "2026-08-07T14:58:39.26158+00:00",
    "last_seen": "2026-08-08T13:00:24.426986+00:00"
  },
  "spend": {
    "usd": 5.155438, "usd_rows": 97,
    "attributed_usd": 3.327638, "unattributed_usd": 1.8278,
    "legacy_pln_rows": 0, "legacy_pln_amount": 0.0
  },
  "series": [
    { "t": "2026-08-07T14:00:00+00:00", "label": "14:00", "requests": 1,
      "errors": 0, "tokens": 0, "images": 0, "cost_usd": 0.0,
      "avg_latency_ms": 412, "p95_latency_ms": 412,
      "generation_ms": null, "transfer_ms": null }
  ],
  "models": [
    { "model": "seedream-5-0-260128", "provider": "byteplus",
      "requests": 2, "errors": 0, "billed_calls": 5, "cost_usd": 0.24576,
      "images": 2, "credits": 6.0,
      "avg_latency_ms": 19435, "p95_latency_ms": 20703,
      "avg_generation_ms": 17280, "avg_transfer_ms": 1804,
      "measured_generation": 2, "measured_transfer": 2,
      "last_seen": "2026-08-08T12:41:02.118Z" }
  ],
  "endpoints": [
    { "endpoint": "/v1/ai/generate/image", "requests": 2, "errors": 0,
      "tokens": 32768, "avg_latency_ms": 19435, "p95_latency_ms": 20703,
      "last_seen": "2026-08-08T12:41:02.118Z" }
  ],
  "categories": [
    { "category": "ai_video", "cost_usd": 2.974358, "rows": 8, "quantity": 8.0 }
  ],
  "status_classes": { "success": 27, "redirect": 0, "client_error": 80, "server_error": 2 },
  "latency_histogram": [ { "label": "<100ms", "lo": 0, "hi": 100, "requests": 18 } ],
  "top_errors": [
    { "endpoint": "/v1/storage/s3/buckets/…/objects/list",
      "status_code": 410, "requests": 58, "last_seen": "2026-08-08T05:45:16.062136+00:00" }
  ],
  "utilization": {
    "peak_rpm": 13, "peak_rpm_at": "2026-08-07T19:35:00+00:00", "peak_tpm": 16384,
    "avg_rpm_active": 2.53, "active_minutes": 43,
    "requests_last_60m": 1, "tokens_last_60m": 0,
    "requests_today": 53, "tokens_today": 90112,
    "tier": "payg-premium",
    "limit_rpm": 500, "limit_tpm": 500000, "limit_daily_quota": 10000,
    "pct_rpm": 2.6, "pct_tpm": 3.28, "pct_daily_quota": 0.53
  }
}
```

#### `totals`

| Field | Type | Description |
|-------|------|-------------|
| `requests` / `errors` | integer | Requests in the window, and how many returned >= 400 |
| `error_rate` | float | Percent (0-100), 2 decimals |
| `tokens` / `images` / `credits` | integer / integer / float | Output produced and credits consumed |
| `avg_latency_ms` | integer \| null | Mean end-to-end duration |
| `p50_latency_ms`, `p95_latency_ms`, `p99_latency_ms` | integer \| null | Percentiles, computed in SQL |
| `avg_generation_ms` | integer \| null | Mean provider inference time, over the calls that measured it |
| `avg_transfer_ms` | integer \| null | Mean time fetching and storing the produced file |
| `measured_generation`, `measured_transfer` | integer | How many requests reported each phase — the denominators for the two averages above |
| `models_seen`, `endpoints_seen` | integer | Distinct values in the window |
| `first_seen`, `last_seen` | string \| null | ISO 8601 |

::: warning Durations are `null`, not `0`, when there is nothing to measure
An account with no traffic in the window gets `null` for every duration and `0`
for every count. Zero requests is a measurement; "0 ms" would be a claim that the
API responded instantly. Format `null` as an em dash, not as a number.

`avg_generation_ms` and `avg_transfer_ms` are also `null` whenever no request in
the window reported the split — most non-BytePlus image paths do not. Check
`measured_generation` before drawing a chart from it: an average over 2 of 109
requests is not the account's average.
:::

::: tip There is no `totals.cost_usd`
Spend lives on `spend`, and only there. A `totals.cost_usd` existed briefly and
summed a per-request field that only a couple of call paths write — on a live
account it read $0.098 against a real $4.63. If you need the account's spend for
the window, it is `spend.usd`.
:::

#### `spend`

| Field | Type | Description |
|-------|------|-------------|
| `usd` | float | **The** spend figure for the window. Everything charged, from every source |
| `usd_rows` | integer | Ledger rows behind it |
| `attributed_usd` | float | The part of `usd` that a row in `models[]` can claim |
| `unattributed_usd` | float | The remainder: storage, per-call fees, and charges whose model the log did not record |
| `legacy_pln_rows`, `legacy_pln_amount` | integer, float | Pre-cutover PLN rows, reported separately so they are never summed into a USD total |

`attributed_usd + unattributed_usd == usd`. If you render the `models[]` cost
column with a total, that total is `attributed_usd` — a footer showing `spend.usd`
would not equal the column above it.

#### `models` and `endpoints`

::: danger Never divide `cost_usd` by `requests`
`cost_usd` is the ledger's figure and `billed_calls` is the ledger's own row
count. `requests` comes from the request log, which counts a **different set of
calls** — `model` has only been recorded on it since 2026-08-08, so a model with 7
charges and 1 logged request would compute as a $2.72 render that actually cost
$0.39.

The per-call cost is `cost_usd / billed_calls`. Both are `null` together when the
ledger has no rows for that model, which means "not billed here", not "free".
:::

`endpoints[]` carries **no cost column at all**, by design: the ledger records
which model was generated, never which HTTP path asked for it. Attribute cost by
model, or by `categories[].category` for the coarse split (`ai_image`, `ai_video`,
`storage_s3`, …).

The first row of `models[]` normally has `model: null` — that is the bucket for
console, auth and storage calls, which run no model. It carries real `requests`
and `errors` but `null` cost.

#### `series`

One row per bucket, for charting. `t` is a real ISO 8601 timestamp and `label` is
the pre-formatted display string; bucket width follows `hours` the same way
`/console/traffic` does. `sum(series[].requests)` is guaranteed to equal
`totals.requests`.

#### `utilization`

Observed usage next to the ceilings your plan actually enforces. `limit_*` come
from the same table as the rate limiter, so the console cannot quote a limit that
is not applied.

| Field | Description |
|-------|-------------|
| `peak_rpm`, `peak_rpm_at` | Highest request count in any single minute, and when. A rate limit is enforced per minute, so an average would hide the minute that got throttled |
| `avg_rpm_active`, `active_minutes` | Mean rate across the minutes that had traffic, and how many those were |
| `requests_today`, `tokens_today` | Since midnight UTC — **not** the selected window, because a daily quota does not reset when you switch to `hours=720` |
| `pct_rpm`, `pct_tpm`, `pct_daily_quota` | Observed as a percent of the limit, or `null` |

::: warning `null` percentage means unmetered, and >100 is not clamped
`pct_*` is `null` when the dimension has no ceiling — enterprise plans carry `-1`
(unlimited) for tpm and daily quota. Render that as "unlimited", not as 0% or
100%: both of those state something specific about your headroom.

Values above 100 are returned as-is. "You burst to double your plan" is the most
important thing the figure can say, so it is never rounded down to a comfortable
100.
:::

---

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

::: tip Prefer `/console/overview`
This endpoint is kept for existing callers. Its window is fixed at 30 days, and
`avg_latency` is the mean — which is not the figure you want for a latency SLO,
since a handful of long video renders drag it far above the typical request (on a
live account: a 6 564 ms mean against a p50 of 187 ms). `/console/overview` honours
your window and returns p50, p95 and p99 separately.
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
  "tier": "payg-standard",
  "wallet": {
    "balance_usd": 26.8412,
    "currency": "USD",
    "spent_this_month_usd": 3.4821,
    "can_generate": true,
    "topup_url": "https://fotohub.app/console/wallet"
  },
  "credits": {
    "legacy_web_available": 450,
    "reflects_api_usage": false,
    "used_4h": 0,
    "limit_4h": 500,
    "remaining_4h": 500,
    "used_period": 0,
    "limit_period": 0,
    "remaining_period": 0
  },
  "rate_limits": {
    "rpm": 120,
    "tpm": 100000,
    "daily_quota": 2000
  },
  "total_requests_30d": 1250,
  "status": "active"
}
```

::: warning Read `wallet.can_generate`, not the credit block
The API is prepaid in US dollars. `wallet.balance_usd` is the only figure that
decides whether a generation is accepted — at `0` every generation endpoint returns
`402` with code `insufficient_funds` and nothing is charged.

The `credits` block describes your **fotohub.app subscription**, a separate
product. Credits cannot pay for an API call, which is why the field is named
`legacy_web_available` rather than `available`. The four `used_*` / `remaining_*`
counters are incremented only by web-app generations — hence
`reflects_api_usage: false` — so on an API-only account they stay at `0`
permanently, and on a PAYG tier `limit_period` is `0` because there is no monthly
allowance to draw down. Do not build a throttle on them; use `rate_limits` and the
wallet balance.
:::

::: tip Limits are derived from `tier`, so they move together
Every field under `rate_limits`, plus `limit_4h` and `limit_period`, is looked up
from one table keyed by `tier` — they are never mixed between tiers. The values
above are the real `payg-standard` row. If you are hardcoding expectations in a
test, take all of them from the same tier or the response will not match.
:::

| Field | Type | Description |
|-------|------|-------------|
| `tier` | string | Your resolved account tier. Real values: `payg-basic`, `payg-standard`, `payg-premium`, `sub-enterprise`, plus the retired `sub-developer` / `sub-startup` / `sub-business` on accounts that held one of those plans before 2026-08-13 (and the legacy `free` / `starter` / `medium` / `professional` / `business` / `team` names on older accounts) |
| `wallet.balance_usd` | float | Prepaid USD balance — the only figure that funds a call |
| `wallet.spent_this_month_usd` | float | Month-to-date wallet spend, the same sum the spend cap enforces |
| `wallet.can_generate` | boolean | `balance_usd > 0`. `false` means the next generation returns `402 insufficient_funds` |
| `wallet.topup_url` | string | Where to send the user to add funds |
| `credits.legacy_web_available` | float | `profiles.ai_credits` — the fotohub.app subscription balance. Cannot pay for an API call |
| `credits.reflects_api_usage` | boolean | Always `false`: the counters below are written only by web-app generations |
| `credits.used_4h` | float | Web credits consumed in the last 4-hour window |
| `credits.limit_4h` | float | Maximum web credits per 4-hour window for this tier |
| `credits.remaining_4h` | float | Web credits remaining in the current 4-hour window |
| `credits.used_period` | float | Web credits consumed in the current billing period |
| `credits.limit_period` | float | Maximum web credits per billing period. `0` on every PAYG tier |
| `credits.remaining_period` | float | Web credits remaining in the current billing period |
| `rate_limits.rpm` | integer | Requests per minute limit |
| `rate_limits.tpm` | integer | Tokens per minute limit |
| `rate_limits.daily_quota` | integer | Maximum daily requests |
| `total_requests_30d` | integer | Total requests in the last 30 days |
| `status` | string | Account status (`active`, `suspended`, `rate_limited`) |

::: tip Polling Frequency
For realtime dashboards, poll this endpoint every 10-30 seconds. Avoid polling more frequently than once per 5 seconds to stay within rate limits.
:::

---

## Request Logs

Per-request log lines for your account: one row per metered API call, newest
first. This is the same data the **Logs** tab of the console renders, and it is
the only place that answers "which model was slow, and where did the time go".

```
GET /v1/console/logs
```

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | `100` | Rows per page, max `500` |
| `offset` | integer | `0` | Rows to skip, for paging |
| `hours` | integer | `24` | Look-back window in hours, max `720` (30 days) |
| `status` | string | — | `all` \| `success` \| `error`. Filters on the HTTP class (`< 400` / `>= 400`), not an exact code |
| `endpoint` | string | — | Case-insensitive substring match on the endpoint path |
| `model` | string | — | **Exact** model id, e.g. `seedream-5-0-260128`. Not a substring match — a partial id returns zero rows |

**Response (200 OK):**

```json
{
  "logs": [
    {
      "id": "1f0e9d2c-8a41-4c7b-9f2e-6b3d0a5c7e11",
      "created_at": "2026-08-08T09:15:02.418Z",
      "endpoint": "/v1/ai/generate/image",
      "method": "POST",
      "status_code": 200,
      "latency_ms": 18026,
      "generation_ms": 15675,
      "transfer_ms": 1981,
      "tokens_used": 0,
      "model": "seedream-5-0-260128",
      "provider": "byteplus",
      "provider_request_id": "0217861782914105d6d8f07cf2a752c74db4b42ef6a643ec8759d",
      "meta": {
        "num_images": 1,
        "resolution": "2048x2048",
        "credits": 3,
        "cost_usd": 0.049152
      }
    }
  ],
  "limit": 100,
  "offset": 0,
  "has_more": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Log row id. Quote it in support tickets |
| `created_at` | timestamp | When the request was recorded, UTC — the exact server-side time of the generation |
| `endpoint` | string | API path called |
| `method` | string | HTTP method |
| `status_code` | integer | HTTP status returned to you |
| `latency_ms` | integer | **Total** wall-clock time for the request, end to end. Unchanged meaning — the traffic chart and the dashboard's average latency are computed from this field |
| `generation_ms` | integer \| null | Time the provider spent rendering. `null` when the path did not measure it |
| `transfer_ms` | integer \| null | Time spent fetching the produced file from the provider and storing it. `null` when not measured |
| `tokens_used` | integer | Tokens billed on this call (`0` for image paths that bill per request) |
| `model` | string \| null | Model id that served the request. `null` on rows where the failure happened before a model was resolved, and on rows written before 2026-08-08 |
| `provider` | string \| null | Internal routing label for the upstream that served it (`byteplus`, `vertex`, `bfl`, …). Diagnostic only — the set of values is not a stable API and may change as routing changes |
| `provider_request_id` | string \| null | The upstream's own handle for the render, truncated to 200 chars. This is the value provider support asks for when disputing a bad or failed generation. `null` when the provider returned none |
| `meta` | object \| null | Aggregatable per-request detail. Present only when there was something to record. Keys: `num_images`, `resolution`, `credits`, `cost_usd` |

::: warning `null` means "not measured", never "instant"
`generation_ms` and `transfer_ms` are nullable on purpose. A `0` would claim a
render finished in no time; `null` says the path did not time its phases. Two
cases produce it: rows created before 2026-08-08, when the columns did not exist,
and paths where only one elapsed number is observable — for example models whose
output stays on the provider's URLs, so there is no transfer phase to time.
Chart the split only over rows that reported it, and say how many did.
:::

::: info `generation_ms + transfer_ms <= latency_ms`
The two phases do not have to add up to the total, and normally do not. The
remainder is FOTOhub's own orchestration: auth, quota and price lookup, billing,
delivery routing. On the sample row above that is `18026 - 15675 - 1981 = 370 ms`.
Derive the remainder by subtraction rather than expecting a field for it — that
way it can never disagree with the parts.
:::

::: tip Which knob does a slow request point at?
A high `generation_ms` is the model's render time: pick a faster model or a
smaller resolution. A high `transfer_ms` is file movement between the provider
and storage: it is dominated by file size and region distance, and is what a
[bucket delivery](/guides/bucket-delivery) destination in a far-away region shows
up in. They point at different fixes, which is why they are separate fields.
:::

---

### Get Log Summary

Roll the same rows up per model, so latency and spend can be attributed without
paging through the log.

```
GET /v1/console/logs/summary
```

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hours` | integer | `24` | Look-back window in hours, max `720` |
| `endpoint` | string | — | Case-insensitive substring match on the endpoint path |

**Response (200 OK):**

```json
{
  "hours": 24,
  "rows_scanned": 128,
  "truncated": false,
  "models": [
    {
      "model": "seedream-5-0-260128",
      "provider": "byteplus",
      "requests": 42,
      "errors": 1,
      "images": 44,
      "credits": 126,
      "cost_usd": 2.064384,
      "avg_latency_ms": 17280,
      "p95_latency_ms": 20844,
      "avg_generation_ms": 15102,
      "avg_transfer_ms": 1804,
      "measured": { "generation": 42, "transfer": 42 }
    },
    {
      "model": null,
      "provider": null,
      "requests": 86,
      "errors": 0,
      "images": 0,
      "credits": 0,
      "cost_usd": 0,
      "avg_latency_ms": 88,
      "p95_latency_ms": 140,
      "avg_generation_ms": null,
      "avg_transfer_ms": null,
      "measured": { "generation": 0, "transfer": 0 }
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `hours` | integer | The window that was aggregated, echoed back |
| `rows_scanned` | integer | How many log rows went into this rollup |
| `truncated` | boolean | `true` when the window held more than 5,000 rows and only the newest 5,000 were counted. Narrow `hours` and add the results yourself |
| `models[].model` | string \| null | Model id, or `null` for the bucket holding rows with no model (see below) |
| `models[].provider` | string \| null | Internal routing label seen on those rows |
| `models[].requests` | integer | Requests in the window |
| `models[].errors` | integer | How many returned `>= 400` |
| `models[].images` | integer | Sum of `meta.num_images` |
| `models[].credits` | float | Credits consumed, 4 dp |
| `models[].cost_usd` | float | USD cost, 6 dp |
| `models[].avg_latency_ms` | integer \| null | Mean total latency |
| `models[].p95_latency_ms` | integer \| null | Nearest-rank p95 of total latency. With fewer than 20 samples this is the maximum, which is the honest answer for a sample that small |
| `models[].avg_generation_ms` | integer \| null | Mean render time, over the measured rows only |
| `models[].avg_transfer_ms` | integer \| null | Mean transfer time, over the measured rows only |
| `models[].measured.generation` | integer | How many of `requests` reported `generation_ms` |
| `models[].measured.transfer` | integer | How many reported `transfer_ms` |

::: warning Read `measured` before trusting an average
Averages are taken over the rows that actually reported the phase, not over
`requests` — dividing by every request would drag a partly-instrumented model
toward zero and make it look faster than it is. The cost of that choice is that
`avg_generation_ms` can be backed by far fewer samples than `requests`, so
`measured` is what tells "fast" from "barely sampled".
:::

::: info The `null` model bucket is real traffic
Requests that never resolved a model — non-generation console and auth calls, and
failures that stopped before model selection — are grouped under `model: null`
rather than dropped, so `sum(requests)` matches what `GET /v1/console/logs`
lists for the same window.
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
  "avg_latency": 2465.66,
  "total_credits": 0,
  "requests_without_cost": 0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `total_requests` | integer | Requests in the last 30 days |
| `total_tokens` | integer | Sum of tokens across those requests |
| `total_cost` | float | USD, summed over the requests in this window whose cost is known |
| `error_rate` | float | Percentage (e.g. `1.80` = 1.8%), not a fraction |
| `avg_latency` | float | Average latency in milliseconds |
| `total_credits` | float | Credits charged in this window. A separate unit, not converted to USD |
| `requests_without_cost` | integer | Requests with no recorded USD cost, and therefore not in `total_cost` |

::: warning
`total_cost` is a sum over a subset. Requests logged before the 2026-08-05 USD
cutover have no recorded dollar cost, and requests paid for with credits are
reported in `total_credits` instead — both are counted in
`requests_without_cost`. Read that field alongside `total_cost`, or a project
billed entirely in credits looks identical to one that spent nothing. Credits are
not converted to USD here.
:::

::: warning
There is no `project_id`, `period` or `top_models` field in this response. For
per-model counts use `GET /v1/usage`, which returns `topModels[]`.
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
  "wallet": {
    "balance_usd": 33.63,
    "pending_usd": 0,
    "total_topped_up_usd": 60.00,
    "currency": "USD"
  },
  "spend": {
    "this_month_usd": 4.12,
    "monthly_limit_usd": 25.0,
    "remaining_usd": 20.88,
    "currency": "USD"
  },
  "billing_model": "prepaid_wallet_usd",
  "api_subscription": null,
  "overage": {
    "spent_this_month": 4.12,
    "hard_limit_usd": 25.0,
    "remaining": 20.88,
    "deprecated": "renamed to `spend`; a prepaid wallet has no overage"
  }
}
```

There is no credit block here — the API is prepaid in USD and has no credit unit.
`wallet.balance_usd` is what funds a call, and `total_topped_up_usd` includes any
volume bonus that was credited.

`api_subscription` is `null` on every account opened after 2026-08-13, when paid
API plans were retired. `overage` is the old key name for `spend` with the same
numbers, kept one release; "overage" is the wrong word for a prepaid account, where
spending past the balance is declined rather than billed.

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

### Get Invoice Details

```
GET /v1/console/billing/invoice-details
```

The buyer details that will appear on this account's invoices. JWT only — this is
console surface, not something an `fh_` key can read or write.

**Response (200 OK):**

```json
{
  "details": {
    "company_name": "Example GmbH",
    "company_nip": null,
    "company_vat_eu": "DE123456789",
    "address_line1": "Hauptstraße 1",
    "address_line2": null,
    "city": "Berlin",
    "postal_code": "10115",
    "country": "DE",
    "phone": "+49 30 123456",
    "invoice_email": "ap@example.com",
    "wants_invoice": true,
    "updated_at": "2026-08-11T09:14:22.104Z"
  },
  "vat_treatment": "eu_reverse_charge",
  "affects_spending": false
}
```

An account that has never saved anything gets the same shape with every field
`null`, `country: "PL"` and `wants_invoice: false`, so a form can bind straight
to it without null-guarding each field.

`vat_treatment` is derived, read-only, and returned because it is the one
consequence of this form that is not visible in the form itself:

| Value | When | Effect on your invoice |
|-------|------|------------------------|
| `polish_vat` | `country` is `PL` | Polish VAT at the standard rate |
| `eu_reverse_charge` | `company_vat_eu` starts with your own EU `country` code | Reverse charge — VAT is your obligation, not ours |
| `eu_no_vat_id` | EU country, no matching VAT id | Charged at our rate (EU MOSS) |
| `export_zero_rated` | Outside the EU | Zero-rated export |

`affects_spending` is always `false` and is stated rather than implied: these
details never gate a request. The wallet balance is the only thing that does.

### Save Invoice Details

```
PUT /v1/console/billing/invoice-details
```

**Request Body** — every field optional; omitted fields keep their stored value,
so a partial `PUT` is not destructive.

| Parameter | Type | Description |
|-----------|------|-------------|
| `company_name` | string | Buyer name on the invoice |
| `company_nip` | string | Polish NIP. Normalised: a `PL` prefix, spaces and dashes are stripped, then the 10-digit checksum is validated |
| `company_vat_eu` | string | EU VAT id **with** its country prefix, e.g. `DE123456789`. The prefix is what selects reverse charge, so a number saved without it is unusable |
| `address_line1` | string | Street address |
| `address_line2` | string | Suite, floor, etc. |
| `city` | string | City |
| `postal_code` | string | Postal code |
| `country` | string | 2-letter ISO code, uppercased. Defaults to `PL` |
| `phone` | string | Contact phone |
| `invoice_email` | string | Where the invoice PDF is sent. Lowercased. Set this even if it matches your account email — accounts payable is usually a different mailbox |
| `wants_invoice` | boolean | `false` (default) means receipts only |

Returns the same shape as the `GET`, reflecting what was stored.

**Validation errors (400):**

| `error` | Cause |
|---------|-------|
| `empty_update` | The body carried no invoice fields at all |
| `invoice_details_incomplete` | `wants_invoice` is `true` but `company_name` or `country` is missing. Carries a `missing` array naming which |

An invoice needs a named buyer and a country to be a document at all, so that is
refused here — where you can see why — rather than producing a nameless invoice a
month later. Set `wants_invoice: false` to receive receipts only.

A malformed NIP, VAT id, country code or email is rejected as a `422` by the
request validator with the offending field named.

### Top Up the Wallet

```
POST /v1/billing/topup
```

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `package` | string | No | One of `topup-50`, `topup-100`, `topup-250`, `topup-500`, `scale-500`, `scale-1000`, `scale-2000`, `scale-3000`, `scale-5000`, `scale-7500`, `scale-10000`, `scale-15000`. Provide this or `amount_usd` |
| `amount_usd` | number | No | Custom amount, $10–$15,000, whole cents only. Earns the same volume bonus as a package of the same size. Provide this or `package` |
| `pay_currency` | string | No | `usd` (default) or `pln` — changes only what Stripe charges; the wallet is always credited the same USD amount |

**Response (200 OK):**

```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_live_...",
  "package": {
    "slug": "scale-1000",
    "name": "$1,000",
    "amount_usd": 1000,
    "bonus_usd": 100,
    "total_usd": 1100,
    "bonus_pct": 10,
    "popular": true
  },
  "amount_usd": 1000,
  "bonus_usd": 100,
  "total_credited_usd": 1100,
  "pay_currency": "usd"
}
```

The endpoint returns a Stripe Checkout URL — the balance moves only after the
payment webhook lands, so there is no `new_balance` in this response.

`package` is `null` when you send `amount_usd` instead of a slug. The top-level
`amount_usd`, `bonus_usd` and `total_credited_usd` are populated on both paths, so
read those.

`amount_usd` is what Stripe charges and `total_credited_usd` is what the wallet
receives. When `pay_currency` is `pln` Stripe charges the złoty equivalent at that
moment's rate, but the credited USD figure is unaffected, so a settlement rate that
drifts by a few cents never desyncs your balance from what you were quoted.

::: tip From $500 up, the top-up earns a volume bonus
`bonus_usd` is extra **real dollars** credited alongside the payment, in the same
transaction, spendable on any operation and with no expiry. $1,000 credits $1,100;
$15,000 credits $18,000. The ladder is 5% from $500, 10% from $1,000, 12% from
$2,000, 13% from $3,000, 15% from $5,000, 17% from $7,500, 18% from $10,000 and 20%
at $15,000 — published machine-readably as `bonus_tiers` on
`GET /v1/billing/topup/packages`, ordered highest-first with the first match
winning. Rungs do not stack and the bonus is floored to the cent, so $499 earns
nothing.

The `bonus_usd` in this response is a quote; the grant is recomputed server-side
from the same ladder at capture, so nothing in the checkout metadata can raise it.
Capture writes a `top_up` ledger row for the payment and a `top_up_bonus` row for
the bonus.
:::

::: warning The four starter slugs are not their amounts
Those slug numbers date from when packages were priced in PLN: `topup-50` =
**$15**, `topup-100` = **$25**, `topup-250` = **$60**, `topup-500` = **$120**. The
`scale-*` slugs do match their dollar amounts. `topup-1000` ($225) and
`topup-5000` ($1,000) are retired from the list but still resolve, and earn
whatever bonus their amount qualifies for. Read `amount_usd` / `total_usd` from
`GET /v1/billing/topup/packages`, never the slug.

There is no credit unit anywhere here. An earlier revision showed `bonus_credits`
and `discount_pct` on the package object; neither ever paid out and both are gone.
`POST /v1/tiers/wallet/topup` still returns `bonus_credits: null` for one release
because shipped SDK builds type it — read `bonus_usd` instead.
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
  "tier": "payg-standard",
  "name": "Pay-As-You-Go Standard",
  "category": "payg",
  "limits": {
    "rpm": 120,
    "burst_4h": 500,
    "monthly_credits": 0,
    "concurrent_jobs": 10,
    "max_upload_mb": 100,
    "storage_gb": 50,
    "daily_quota": 2000,
    "tpm": 100000
  },
  "access": {
    "models": "all_standard",
    "features": ["image_generation", "video_generation", "chat", "music",
                 "voice", "analysis", "translate", "gabriel", "webhooks",
                 "generate_3d"],
    "priority": "normal"
  },
  "usage": {
    "used_4h": 45,
    "used_period": 0,
    "requests_today": 89
  },
  "wallet": {
    "balance_usd": 26.84,
    "pending_usd": 0,
    "lifetime_spend": 180.00
  },
  "subscription": null,
  "upgrade_options": [
    {
      "slug": "payg-premium",
      "name": "Pay-As-You-Go Premium",
      "category": "payg",
      "price_monthly": 0,
      "rpm": 500,
      "monthly_credits": 0
    }
  ]
}
```

`monthly_credits` is `0` on every PAYG tier: there is no allowance to include,
because the API is paid from the wallet. `wallet.lifetime_spend` is
`total_earned_usd` — everything ever credited, volume bonuses included — and it is
one of the two things that unlock a higher tier (see
[Rate Limits](/api/rate-limits)). `subscription` is `null` on every account opened
after paid plans were retired on 2026-08-13, and `upgrade_options` all carry
`price_monthly: 0`, since the tiers activate from the wallet at no cost.

### Subscribe to Tier — retired

```
POST /v1/tiers/subscribe
```

**Retired 2026-08-13. Every request now returns `410`:**

```json
{
  "error": "api_subscriptions_retired",
  "use_instead": "POST /v1/tiers/wallet/topup"
}
```

Paid API plans are gone. Rate limits follow your prepaid wallet balance instead,
so a top-up is the upgrade path — and from $500 up it earns a
[volume bonus](#top-up-the-wallet) in extra spendable dollars, which a monthly fee
never did. `sub-developer` / `sub-startup` / `sub-business` still resolve for
accounts that held one before the cutover, and all report `price_monthly: null`
with `purchasable: false`. For above `payg-premium`, apply below.

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
{"package": "scale-1000"}
```

(`scale-1000` charges **$1,000** and credits **$1,100**. Note that `topup-500` is
**$120**, not $500 — see the slug warning under Top Up the Wallet.)

**Request Body (option B — custom amount):**

```json
{"amount_usd": 2500}
```

Optionally add `"pay_currency": "pln"` to pay via BLIK/card/bank in PLN while
still crediting the same USD amount to the wallet.

**Response (200 OK):**

```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_live_...",
  "amount_usd": 2500,
  "bonus_usd": 325,
  "total_credited_usd": 2825,
  "pay_currency": "usd",
  "bonus_credits": null
}
```

Returns a Stripe checkout URL for the payment. Minimum **$10**, maximum
**$15,000** (contact sales above that). A custom amount earns exactly the same
volume bonus as a package of the same size — $2,500 is on the 13% rung, hence the
`+$325`. `bonus_credits` is always `null` and deprecated: read `bonus_usd`. The
legacy `amount_pln` key is still accepted during rollout but is interpreted as USD,
not converted.

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
access token for the `fh_live_your_key_here` placeholders below. `/logs`,
`/logs/summary` and `/system/status` are the only endpoints on this page that
accept an API key for reads.
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

### Where Did the Latency Go?

Both of these accept an API key, so they work without a session token.

::: code-group

```python [Python]
import requests

API = "https://apis.fotohub.app"
headers = {"Authorization": "Bearer fh_live_your_key_here"}

# One model's calls over the last 24h, split into render vs. transfer
logs = requests.get(
    f"{API}/v1/console/logs",
    headers=headers,
    params={"model": "seedream-5-0-260128", "hours": 24, "limit": 50},
).json()["logs"]

for row in logs:
    gen, xfer = row.get("generation_ms"), row.get("transfer_ms")
    # None means the phase was not measured -- do not print it as 0.
    parts = f"render {gen}ms + transfer {xfer}ms" if gen is not None else "not split"
    overhead = row["latency_ms"] - (gen or 0) - (xfer or 0)
    print(f"{row['created_at']}  total {row['latency_ms']}ms  ({parts}, ours {overhead}ms)")
    if row.get("provider_request_id"):
        print(f"  upstream id: {row['provider_request_id']}")

# Same window rolled up per model
for m in requests.get(
    f"{API}/v1/console/logs/summary", headers=headers, params={"hours": 24}
).json()["models"]:
    seen = m["measured"]["generation"]
    print(
        f"{m['model'] or '(no model)'}: {m['requests']} req, "
        f"avg {m['avg_latency_ms']}ms, p95 {m['p95_latency_ms']}ms, "
        f"render {m['avg_generation_ms']}ms over {seen} measured, "
        f"${m['cost_usd']:.4f}"
    )
```

```typescript [TypeScript]
const API = 'https://apis.fotohub.app';
const headers = { Authorization: 'Bearer fh_live_your_key_here' };

const q = (p: Record<string, string>) => new URLSearchParams(p).toString();

const { logs } = await fetch(
  `${API}/v1/console/logs?${q({ model: 'seedream-5-0-260128', hours: '24', limit: '50' })}`,
  { headers },
).then((r) => r.json());

for (const row of logs) {
  const { generation_ms: gen, transfer_ms: xfer } = row;
  // null means the phase was not measured -- do not render it as 0.
  const parts = gen === null ? 'not split' : `render ${gen}ms + transfer ${xfer}ms`;
  const overhead = row.latency_ms - (gen ?? 0) - (xfer ?? 0);
  console.log(`${row.created_at}  total ${row.latency_ms}ms  (${parts}, ours ${overhead}ms)`);
}

const { models } = await fetch(`${API}/v1/console/logs/summary?${q({ hours: '24' })}`, {
  headers,
}).then((r) => r.json());

for (const m of models) {
  console.log(
    `${m.model ?? '(no model)'}: ${m.requests} req, avg ${m.avg_latency_ms}ms, ` +
      `p95 ${m.p95_latency_ms}ms, render ${m.avg_generation_ms}ms ` +
      `over ${m.measured.generation} measured, $${m.cost_usd}`,
  );
}
```

```bash [cURL]
# Slowest calls for one model, with the split
curl -s "https://apis.fotohub.app/v1/console/logs?model=seedream-5-0-260128&hours=24&limit=50" \
  -H "Authorization: Bearer fh_live_your_key_here" \
| jq '.logs | sort_by(-.latency_ms) | .[:5]
      | map({created_at, latency_ms, generation_ms, transfer_ms, provider_request_id})'

# Per-model rollup
curl -s "https://apis.fotohub.app/v1/console/logs/summary?hours=24" \
  -H "Authorization: Bearer fh_live_your_key_here" \
| jq '.models | map({model, requests, avg_latency_ms, p95_latency_ms,
                     avg_generation_ms, avg_transfer_ms, measured, cost_usd})'
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
