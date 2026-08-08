# Usage & Analytics

Get comprehensive usage analytics for your account — request volumes, token consumption, cost breakdowns, and model popularity.

---

## GET /v1/usage

Returns a full analytics snapshot for the authenticated user covering the last 30 days.

**Authentication:** Bearer token (JWT)

### Response Structure

```json
{
  "subscription": {
    "id": "sub_abc123",
    "plan_id": "plan_pro",
    "status": "active",
    "current_period_start": "2026-07-01T00:00:00Z",
    "current_period_end": "2026-07-31T23:59:59Z",
    "api_plans": {
      "slug": "api-startup",
      "name": "API Startup",
      "monthly_price": 199,
      "currency": "PLN",
      "included_tokens": 5000000,
      "included_requests": 10000,
      "rate_limit_per_minute": 300,
      "features": ["priority_queue", "dedicated_support"]
    }
  },
  "keys": [
    {
      "id": "key_xyz",
      "name": "Production API Key",
      "key_prefix": "fh_live_abc",
      "created_at": "2026-06-01T10:00:00Z",
      "last_used_at": "2026-07-18T11:30:00Z",
      "expires_at": null,
      "status": "active",
      "rate_limit_per_minute": 60,
      "requests_total": 4521,
      "tokens_total": 2340000,
      "auto_rotate_interval_days": 90,
      "allowed_ips": ["203.0.113.0/24"],
      "allowed_referrers": ["https://myapp.com/*"],
      "metadata": {}
    }
  ],
  "totals": {
    "totalRequests": 4521,
    "totalTokens": 2340000,
    "currency": [
      { "currency": "USD", "amount": 38.20 }
    ]
  },
  "daily": [
    {
      "date": "2026-07-17",
      "requests": 156,
      "totalTokens": 78000,
      "costByCurrency": { "USD": 1.27 }
    },
    {
      "date": "2026-07-18",
      "requests": 89,
      "totalTokens": 45200,
      "costByCurrency": { "USD": 0.75 }
    }
  ],
  "topEndpoints": [
    { "endpoint": "/v1/ai/generate/image", "count": 2100 },
    { "endpoint": "/v1/ai/chat/completions", "count": 1200 },
    { "endpoint": "/v1/ai/generate/video", "count": 450 },
    { "endpoint": "/v1/ai/generate/music", "count": 320 },
    { "endpoint": "/v1/ai/translate", "count": 251 }
  ],
  "topModels": [
    { "modelId": "seedream-5-0-260128", "count": 1800 },
    { "modelId": "claude-sonnet-4-6", "count": 900 },
    { "modelId": "seedance-2-0-pro", "count": 380 },
    { "modelId": "flux-2-pro", "count": 220 },
    { "modelId": "music-minimax", "count": 150 }
  ],
  "latestEvents": [
    {
      "created_at": "2026-07-18T11:30:42Z",
      "endpoint": "/v1/ai/generate/image",
      "model_id": "seedream-5-0-260128",
      "request_tokens": 150,
      "response_tokens": 16384,
      "cost": 0.049152,
      "currency": "USD",
      "status": "success"
    }
  ]
}
```

### Response Fields

| Field | Description |
|-------|-------------|
| `subscription` | Active plan details including limits and features |
| `keys` | All API keys with usage stats per key |
| `totals` | 30-day aggregate: requests, tokens, cost. `currency` is an array because the account may hold rows in more than one currency. |
| `daily` | Day-by-day breakdown for charts |
| `topEndpoints` | Top 5 most-used endpoints |
| `topModels` | Top 5 most-used AI models |
| `latestEvents` | Last 20 API calls with full detail |

::: info Currency
Usage events logged since the 2026-08-05 wallet cutover carry
`"currency": "USD"`. Older rows were written with `"currency": "PLN"` and are
kept as-is, so `totals.currency[]` and `daily[].costByCurrency` can contain
both keys on an account that was active before the cutover. Always read the
currency alongside the amount instead of assuming a single one.
:::

---

## Examples

::: code-group

```python [Python]
import httpx

response = httpx.get(
    "https://apis.fotohub.app/v1/usage",
    headers={"Authorization": "Bearer YOUR_JWT"}
)

data = response.json()

# Monthly spend
total_usd = next(
    (c["amount"] for c in data["totals"]["currency"] if c["currency"] == "USD"),
    0
)
print(f"This month: {data['totals']['totalRequests']} requests, ${total_usd:.2f}")

# Most used model
top_model = data["topModels"][0]
print(f"Top model: {top_model['modelId']} ({top_model['count']} calls)")

# Daily trend
for day in data["daily"][-7:]:
    print(f"  {day['date']}: {day['requests']} req, {day['totalTokens']} tokens")
```

```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/v1/usage', {
  headers: { Authorization: `Bearer ${jwt}` }
});

const data = await response.json();

// Build a chart
const chartData = data.daily.map(d => ({
  date: d.date,
  requests: d.requests,
  cost: d.costByCurrency?.USD ?? 0
}));

// Check if approaching limits
const plan = data.subscription?.api_plans;
if (plan) {
  const usagePct = (data.totals.totalTokens / plan.included_tokens) * 100;
  if (usagePct > 80) {
    console.warn(`Token usage at ${usagePct.toFixed(0)}% of plan limit!`);
  }
}
```

```bash [cURL]
curl -s https://apis.fotohub.app/v1/usage \
  -H "Authorization: Bearer YOUR_JWT" | jq '.totals'
```

:::

---

## Usage Events Schema

Each API call generates a usage event with:

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | timestamp | When the call was made |
| `endpoint` | string | API path called |
| `model_id` | string | AI model used (if applicable) |
| `request_tokens` | integer | Input tokens consumed |
| `response_tokens` | integer | Output tokens generated |
| `cost` | float | Cost of this call |
| `currency` | string | Cost currency — `USD` for everything logged since 2026-08-05 |
| `status` | string | `success` \| `error` \| `timeout` |
| `latency_ms` | integer | Total response time, end to end |

::: info Need the split, not just the total?
`latency_ms` here is one number for the whole request. To see how much of it was
the model rendering versus the finished file being fetched and stored, read
[`GET /v1/console/logs`](/api/console-api#request-logs), which reports
`generation_ms` and `transfer_ms` per request and rolls them up per model.
:::

---

## Integrating Usage Monitoring

### Webhook Alert on High Usage

Combine with [Webhooks](/api/webhooks) to get notified when usage crosses thresholds:

```python
# Check usage programmatically and alert
usage = httpx.get(f"{API}/v1/usage", headers=HEADERS).json()
plan = usage["subscription"]["api_plans"]

tokens_used = usage["totals"]["totalTokens"]
tokens_limit = plan["included_tokens"]

if tokens_used > tokens_limit * 0.9:
    # Trigger alert via your notification system
    send_alert(f"Token usage at {tokens_used}/{tokens_limit} (90%+)")
```

### Dashboard Integration

The response is designed for direct rendering in dashboards:
- `daily[]` → time-series line chart
- `topEndpoints[]` → pie/bar chart
- `topModels[]` → leaderboard
- `latestEvents[]` → activity log table
