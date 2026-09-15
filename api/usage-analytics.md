# Usage & Analytics

Get comprehensive usage analytics for your account — request volumes, USD spend, model consumption, and cost breakdowns by endpoint, model, and time period.

FOTOhub operates on a **prepaid USD wallet model**. All usage is billed directly in USD against your `wallet.available_usd` balance at transparent 1:1 pass-through rates — no synthetic credit conversion, no currency exchange fees, no subscription token quotas.

---

## GET /v1/usage

Returns a full analytics snapshot for the authenticated user covering the specified period (default: last 30 days).

**Authentication:** `Authorization: Bearer <api_key>`

### Query Parameters

| Parameter | Type | Default | Description |
|:---|:---|:---|:---|
| `period` | string | `30d` | Reporting window: `7d`, `30d`, `90d`, `1y`, or `custom` |
| `from` | ISO 8601 | — | Start date when `period=custom` (e.g. `2026-06-01T00:00:00Z`) |
| `to` | ISO 8601 | — | End date when `period=custom` |
| `group_by` | string | `day` | Aggregation granularity: `hour`, `day`, `week`, `month` |
| `model` | string | — | Filter by specific model ID (e.g. `seedream-5-0-260128`) |
| `endpoint` | string | — | Filter by specific API path (e.g. `/v1/ai/generate/video`) |

### Response Structure

```json
{
  "wallet": {
    "available_usd": 47.83,
    "total_deposited_usd": 200.00,
    "total_spent_usd": 152.17,
    "pending_usd": 0.00,
    "currency": "USD"
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
      "usd_spent": 38.20,
      "auto_rotate_interval_days": 90,
      "allowed_ips": ["203.0.113.0/24"],
      "allowed_referrers": ["https://myapp.com/*"],
      "metadata": {}
    }
  ],
  "totals": {
    "total_requests": 4521,
    "successful_requests": 4498,
    "failed_requests": 23,
    "total_usd_charged": 38.20,
    "avg_cost_per_request_usd": 0.00846,
    "period_start": "2026-07-01T00:00:00Z",
    "period_end": "2026-07-31T23:59:59Z"
  },
  "daily": [
    {
      "date": "2026-07-17",
      "requests": 156,
      "usd_charged": 1.27,
      "successful": 155,
      "failed": 1
    },
    {
      "date": "2026-07-18",
      "requests": 89,
      "usd_charged": 0.75,
      "successful": 89,
      "failed": 0
    }
  ],
  "top_endpoints": [
    { "endpoint": "/v1/ai/generate/image", "count": 2100, "usd_charged": 15.23 },
    { "endpoint": "/v1/ai/chat/completions", "count": 1200, "usd_charged": 8.40 },
    { "endpoint": "/v1/ai/generate/video", "count": 450, "usd_charged": 9.85 },
    { "endpoint": "/v1/ai/generate/music", "count": 320, "usd_charged": 3.20 },
    { "endpoint": "/v1/ai/translate", "count": 251, "usd_charged": 1.52 }
  ],
  "top_models": [
    { "model_id": "seedream-5-0-260128", "count": 1800, "usd_charged": 10.80 },
    { "model_id": "claude-sonnet-4-6", "count": 900, "usd_charged": 6.30 },
    { "model_id": "seedance-2-0-pro", "count": 380, "usd_charged": 9.12 },
    { "model_id": "flux-2-pro", "count": 220, "usd_charged": 6.60 },
    { "model_id": "music-minimax", "count": 150, "usd_charged": 2.25 }
  ],
  "latest_events": [
    {
      "created_at": "2026-07-18T11:30:42Z",
      "endpoint": "/v1/ai/generate/image",
      "model_id": "seedream-5-0-260128",
      "usd_charged": 0.045,
      "latency_ms": 2340,
      "status": "success"
    }
  ]
}
```

### Response Fields

| Field | Description |
|:---|:---|
| `wallet` | Real-time prepaid USD wallet balance (available, deposited, spent) |
| `keys` | All API keys with per-key USD spend and request counts |
| `totals` | Period aggregate: requests, successful, failed, total USD charged, avg cost |
| `daily` | Day-by-day breakdown with USD charged per day (suitable for time-series charts) |
| `top_endpoints` | Top 5 most-used API paths ranked by request count, with USD spend |
| `top_models` | Top 5 most-used AI models ranked by request count, with USD spend |
| `latest_events` | Last 20 API calls with full cost and latency detail |

::: info Pure USD Billing
All `usd_charged` fields reflect direct USD wallet debits. There are no token-to-USD conversions or synthetic credit systems — every value you see is an exact dollar amount charged from your prepaid balance.
:::

---

## Code Examples

::: code-group

```python [Python]
import httpx

response = httpx.get(
    "https://apis.fotohub.app/v1/usage",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
    params={"period": "30d", "group_by": "day"}
)

data = response.json()

# Wallet balance
wallet = data["wallet"]
print(f"Available balance: ${wallet['available_usd']:.2f} USD")
print(f"Total spent this period: ${data['totals']['total_usd_charged']:.2f} USD")

# Most expensive model
top_model = data["top_models"][0]
print(f"Top model: {top_model['model_id']} → ${top_model['usd_charged']:.2f} spent on {top_model['count']} calls")

# Daily trend (last 7 days)
for day in data["daily"][-7:]:
    print(f"  {day['date']}: {day['requests']} requests → ${day['usd_charged']:.4f}")
```

```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/v1/usage?period=30d&group_by=day', {
  headers: { Authorization: `Bearer fh_live_your_api_key` }
});

const data = await response.json();

// Wallet health check
console.log(`Available: $${data.wallet.available_usd.toFixed(2)} USD`);
console.log(`Spent (period): $${data.totals.total_usd_charged.toFixed(2)} USD`);

// Build chart data for a dashboard
const chartData = data.daily.map((d: { date: string; requests: number; usd_charged: number }) => ({
  date: d.date,
  requests: d.requests,
  cost: d.usd_charged
}));

// Low balance alert
if (data.wallet.available_usd < 10.00) {
  console.warn(`⚠️  Low balance: $${data.wallet.available_usd.toFixed(2)} remaining. Top up at https://fotohub.app/console/billing`);
}
```

```go [Go]
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

type UsageResponse struct {
    Wallet struct {
        AvailableUSD float64 `json:"available_usd"`
        TotalSpentUSD float64 `json:"total_spent_usd"`
    } `json:"wallet"`
    Totals struct {
        TotalRequests   int     `json:"total_requests"`
        TotalUSDCharged float64 `json:"total_usd_charged"`
        AvgCostPerReq   float64 `json:"avg_cost_per_request_usd"`
    } `json:"totals"`
    TopModels []struct {
        ModelID    string  `json:"model_id"`
        Count      int     `json:"count"`
        USDCharged float64 `json:"usd_charged"`
    } `json:"top_models"`
    Daily []struct {
        Date       string  `json:"date"`
        Requests   int     `json:"requests"`
        USDCharged float64 `json:"usd_charged"`
    } `json:"daily"`
}

func main() {
    req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/usage?period=30d", nil)
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    var usage UsageResponse
    json.Unmarshal(body, &usage)

    fmt.Printf("Available balance: $%.2f USD\n", usage.Wallet.AvailableUSD)
    fmt.Printf("Period spend: $%.2f USD across %d requests\n",
        usage.Totals.TotalUSDCharged, usage.Totals.TotalRequests)
    fmt.Printf("Avg cost per call: $%.5f USD\n", usage.Totals.AvgCostPerReq)

    fmt.Println("\nTop Models by Cost:")
    for _, m := range usage.TopModels {
        fmt.Printf("  %-35s %5d calls  $%.4f USD\n", m.ModelID, m.Count, m.USDCharged)
    }
}
```

```bash [cURL]
# Basic usage (last 30 days)
curl -s "https://apis.fotohub.app/v1/usage" \
  -H "Authorization: Bearer fh_live_your_api_key" | jq '{
    available_usd: .wallet.available_usd,
    period_spend: .totals.total_usd_charged,
    requests: .totals.total_requests
  }'

# Filter to video generation only (last 7 days)
curl -s "https://apis.fotohub.app/v1/usage?period=7d&endpoint=/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" | jq '.totals'

# Custom date range
curl -s "https://apis.fotohub.app/v1/usage?period=custom&from=2026-07-01T00:00:00Z&to=2026-07-15T23:59:59Z" \
  -H "Authorization: Bearer fh_live_your_api_key" | jq '.daily[]'
```

:::

---

## Usage Events Schema

Each API call generates a usage event with:

| Field | Type | Description |
|:---|:---|:---|
| `created_at` | timestamp | When the call was made (ISO 8601 UTC) |
| `endpoint` | string | API path called (e.g. `/v1/ai/generate/image`) |
| `model_id` | string | AI model used (e.g. `seedream-5-0-260128`) |
| `usd_charged` | float | Exact USD amount debited from wallet for this call |
| `latency_ms` | integer | Total end-to-end response time in milliseconds |
| `status` | string | `success` \| `error` \| `timeout` \| `quota_exceeded` |
| `request_id` | string | Unique request identifier for support/debugging |
| `region` | string | AWS region where inference was served (e.g. `eu-central-1`) |

::: info Need generation vs. transfer latency split?
`latency_ms` here is the total round-trip. To see how much was model inference versus file upload/storage, read [`GET /v1/console/logs`](/api/console-api#request-logs), which reports `generation_ms` and `transfer_ms` per request.
:::

---

## Per-Model Cost Reference

Use the usage analytics to identify your highest-cost models. Typical unit costs:

| Category | Model | Typical Cost |
|:---|:---|:---|
| Image Generation | `seedream-5-0-260128` | $0.045/image |
| Image Generation | `flux-2-pro` | $0.030/image |
| Image Generation | `gpt-image-1` | $0.040/image |
| Video Generation | `seedance-2-0-pro` (5s) | $0.240/clip |
| Video Generation | `kling-v2-1` (5s) | $0.130/clip |
| Chat (Claude) | `claude-sonnet-4-6` | $0.003/1K tokens in |
| Audio/Music | `music-minimax` (30s) | $0.015/generation |
| 3D Generation | `fh-3d-pro` | $0.120/model |
| Lip-Sync | `musetalk` (5s video) | $0.080/video |

::: tip Cost Optimization
Sort your `top_models` response by `usd_charged` to identify where most of your budget goes. Video generation typically dominates due to per-clip pricing. Use shorter clips or reduce `num_images` in batch jobs to reduce spend.
:::

---

## Wallet Balance Monitoring

### Low Balance Webhook Alert

Register a webhook for `wallet.balance_low` events to get notified before your balance runs out:

```python
import httpx
import os

# Register webhook for low balance events
httpx.post(
    "https://apis.fotohub.app/v1/webhooks",
    headers={"Authorization": f"Bearer {os.environ['FOTOHUB_API_KEY']}"},
    json={
        "url": "https://api.yourapp.com/webhooks/fotohub",
        "events": ["wallet.balance_low", "wallet.balance_depleted"],
        "secret": "whsec_your_secret_here"
    }
)
```

The `wallet.balance_low` event fires when your balance drops below $10.00 USD. The `wallet.balance_depleted` event fires when balance reaches $0.00 and API calls will start failing.

### Programmatic Balance Guard

```python
import httpx
import os

API_KEY = os.environ["FOTOHUB_API_KEY"]
BASE = "https://apis.fotohub.app"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

def check_balance_before_job(estimated_cost_usd: float) -> bool:
    """Return True if wallet has enough funds for the operation."""
    usage = httpx.get(f"{BASE}/v1/usage", headers=HEADERS).json()
    available = usage["wallet"]["available_usd"]

    if available < estimated_cost_usd:
        raise InsufficientFundsError(
            f"Wallet has ${available:.2f} USD but operation costs ~${estimated_cost_usd:.2f} USD. "
            f"Top up at https://fotohub.app/console/billing"
        )
    return True

class InsufficientFundsError(Exception):
    pass

# Usage:
check_balance_before_job(0.75)  # Shorts job costs ~$0.75
```

---

## Dashboard Integration

The response structure is designed for direct rendering in dashboards. Here's a reference mapping:

| Response Field | Recommended Visualization |
|:---|:---|
| `daily[]` | Time-series line chart (requests + USD per day) |
| `top_endpoints[]` | Horizontal bar chart sorted by `usd_charged` |
| `top_models[]` | Leaderboard table with model names and costs |
| `latest_events[]` | Real-time activity log with status indicators |
| `wallet.available_usd` | Gauge or progress bar vs. last deposit amount |

### Example: Grafana / Metabase Query Pattern

```python
import httpx

def fetch_analytics_for_dashboard(period: str = "30d") -> dict:
    """Fetch and normalize usage data for a BI dashboard."""
    data = httpx.get(
        "https://apis.fotohub.app/v1/usage",
        headers={"Authorization": f"Bearer {os.environ['FOTOHUB_API_KEY']}"},
        params={"period": period, "group_by": "day"}
    ).json()

    return {
        "wallet_balance": data["wallet"]["available_usd"],
        "period_spend": data["totals"]["total_usd_charged"],
        "total_requests": data["totals"]["total_requests"],
        "success_rate": round(
            data["totals"]["successful_requests"] / max(data["totals"]["total_requests"], 1) * 100, 1
        ),
        "daily_series": [
            {"date": d["date"], "requests": d["requests"], "cost": d["usd_charged"]}
            for d in data["daily"]
        ],
        "model_breakdown": [
            {"model": m["model_id"], "calls": m["count"], "cost": m["usd_charged"]}
            for m in data["top_models"]
        ]
    }
```

---

## Rate Limits on the Analytics Endpoint

`GET /v1/usage` is a read-only analytics endpoint and has a separate rate limit:

| Plan | Requests / Minute |
|:---|:---|
| Pay-as-you-go | 30 |
| Growth | 60 |
| Enterprise | 300 |

Analytics responses are cached for **60 seconds** — identical requests within the cache window return a cached response with a `X-Cache: HIT` response header.

::: tip Console Alternative
For a real-time dashboard without API integration, visit [fotohub.app/console/analytics](https://fotohub.app/console/analytics) — it includes live request graphs, model cost breakdowns, and wallet balance history.
:::
