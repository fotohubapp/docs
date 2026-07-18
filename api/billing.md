# Billing & Pricing

FOTOhub uses a dual-mode billing system combining prepaid credits with pay-as-you-go wallet fallback. Every API response includes a detailed billing breakdown so you always know exactly what you spent.

## Billing Overview

FOTOhub operates on a dual-mode billing system designed for flexibility and cost control:

| Mode | Description |
|------|-------------|
| **Credits** | Prepaid monthly allowance included with your plan tier. Credits are deducted first for every operation. Reset monthly on your billing cycle. |
| **Wallet (PLN)** | Pay-as-you-go fallback when credits are exhausted. Top up your wallet with packages. Charged in PLN with no expiration. |
| **Token-Based** | Some models (BytePlus SeedDream, AWS Bedrock) bill per-token instead of a fixed credit cost. Billed after execution based on actual usage. |

## How Billing Works

The billing flow is evaluated on every request. Here is the complete sequence:

```
Request → Authentication → Billing Mode Detection
                                    ↓
              ┌─────────────────────┴──────────────────────┐
              ↓                                            ↓
     Credit-Based Path                           Token-Based Path
              ↓                                            ↓
   Deduct from monthly                        Execute first, count
   tier allowance                             tokens after completion
              ↓                                            ↓
   Credits exhausted?                         Bill from credits or
      ↓ Yes                                   wallet PLN
   Fall back to wallet PLN                            ↓
              ↓                                            ↓
              └─────────────────────┬──────────────────────┘
                                    ↓
                    Response with billing breakdown
```

**Step-by-step:**

1. **Authentication** — Request comes in and is authenticated via API key. The user's tier and balance are loaded.
2. **Billing Mode Detection** — System checks whether the operation uses token-based or credit-based billing based on the model.
3. **Credit-Based Path** — Deduct from monthly tier allowance. If credits are exhausted, fall back to wallet PLN automatically.
4. **Token-Based Path** — Execute first, count tokens after completion, then bill from credits (if sufficient) or wallet PLN.
5. **Response** — Every response includes a full billing breakdown showing method, credits used, and PLN charged.

::: tip Automatic Fallback
When your monthly credits are exhausted, billing automatically falls back to your PLN wallet. No configuration needed — as long as your wallet has funds, requests continue without interruption.
:::

## The `billing` Object

Every API response includes a `billing` field with a complete breakdown of the charges. The structure varies depending on the billing method used.

### Credit-based billing

```json
{
  "billing": {
    "method": "credits",
    "credits_used": 3,
    "pln_charged": 0.45
  }
}
```

### Token-based billing

```json
{
  "billing": {
    "method": "token",
    "credits_used": 2,
    "pln_charged": 0.049,
    "cost_breakdown": {
      "output_tokens": 4096,
      "cost_usd": 0.008192,
      "cost_pln": 0.049152,
      "rate_per_1m_tokens_usd": 2.00
    }
  }
}
```

### Wallet fallback (credits exhausted)

```json
{
  "billing": {
    "method": "wallet",
    "credits_used": 0,
    "pln_charged": 0.45
  }
}
```

::: tip Monitoring Costs
Parse the `billing` object in every response to track your spending in real time. The `method` field tells you whether you are still using credits or have fallen through to wallet billing.
:::

## API Plans

FOTOhub offers 5 tiers designed for different usage levels, from hobbyists to enterprise teams.

| Plan | Monthly Price | Credits | Rate Limit | Storage | Max Upload | API Keys |
|------|--------------|---------|------------|---------|------------|----------|
| Free | 0 PLN | 50 | 10 rpm | 1 GB | 10 MB | 1 |
| Developer | 49 PLN | 500 | 60 rpm | 10 GB | 50 MB | 5 |
| **Startup** | **199 PLN** | **5,000** | **300 rpm** | **100 GB** | **100 MB** | **20** |
| Business | 799 PLN | 25,000 | 1,000 rpm | 500 GB | 500 MB | Unlimited |
| Enterprise | Custom | Unlimited | 5,000 rpm | Unlimited | 2 GB | Unlimited |

::: info Enterprise Plans
Enterprise plans include dedicated infrastructure, SLA guarantees, priority support, and custom rate limits. Contact sales@fotohub.app for a tailored quote.
:::

## Credit Costs by Operation

Each operation type has a fixed credit cost. For token-based models, credits are calculated dynamically based on actual token usage.

### Image Generation

| Model ID | Name | Credits | PLN Cost | Unit |
|----------|------|---------|----------|------|
| `flux-schnell` | Flux Schnell | 1 | 0.15 PLN | per image |
| `flux-dev` | Flux Dev | 2 | 0.30 PLN | per image |
| `flux-pro` | Flux Pro | 4 | 0.60 PLN | per image |
| `stable-diffusion-xl` | SDXL | 2 | 0.30 PLN | per image |
| `ideogram-v2` | Ideogram v2 | 5 | 0.75 PLN | per image |
| `recraft-v3` | Recraft v3 | 4 | 0.60 PLN | per image |
| `imagen-3` | Imagen 3 | 3 | 0.45 PLN | per image |
| `dall-e-3` | DALL-E 3 | 8 | 1.20 PLN | per image |

### Video Generation

| Model ID | Name | Credits | PLN Cost | Unit |
|----------|------|---------|----------|------|
| `kling-v1` | Kling v1 | 8 | 1.20 PLN | per 5s clip |
| `kling-v2` | Kling v2 | 10 | 1.50 PLN | per 5s clip |
| `minimax-video` | MiniMax Video | 12 | 1.80 PLN | per 5s clip |
| `runway-gen3` | Runway Gen-3 | 15 | 2.25 PLN | per 5s clip |

### Music Generation

| Model ID | Name | Credits | PLN Cost | Unit |
|----------|------|---------|----------|------|
| `stable-audio` | Stable Audio | 5 | 0.75 PLN | per 30s |
| `musicgen-large` | MusicGen Large | 10 | 1.50 PLN | per 60s |
| `udio-v2` | Udio v2 | 15 | 2.25 PLN | per 60s |
| `suno-v4` | Suno v4 | 25 | 3.75 PLN | per song |

### Chat & Analysis

| Model ID | Name | Credits | PLN Cost | Unit |
|----------|------|---------|----------|------|
| `claude-haiku` | Claude Haiku | 1 | 0.15 PLN | per request |
| `claude-sonnet` | Claude Sonnet | 2 | 0.30 PLN | per request |
| `gpt-4o-mini` | GPT-4o Mini | 1 | 0.15 PLN | per request |
| `gpt-4o` | GPT-4o | 2 | 0.30 PLN | per request |
| `gemini-flash` | Gemini Flash | 1 | 0.15 PLN | per request |
| `image-analysis` | Image Analysis | 1 | 0.15 PLN | per analysis |

### Voice & TTS

| Model ID | Name | Credits | PLN Cost | Unit |
|----------|------|---------|----------|------|
| `elevenlabs-turbo` | ElevenLabs Turbo | 1 | 0.15 PLN | per 1000 chars |
| `elevenlabs-v2` | ElevenLabs v2 | 2 | 0.30 PLN | per 1000 chars |
| `chatterbox-tts` | Chatterbox TTS | 1 | 0.15 PLN | per 1000 chars |

## Token-Based Pricing

Some models bill based on actual token consumption rather than a fixed credit cost. This provides more granular pricing that scales with resolution and complexity.

### BytePlus SeedDream

SeedDream models calculate tokens from the output image dimensions. The formula is:

```
output_tokens = (width x height) / 256
```

| Model | Rate (USD / 1M tokens) | 1024x1024 Cost |
|-------|----------------------|----------------|
| `seedream-5-0` | $2.00 | 0.049 PLN |
| `seedream-4-5` | $2.50 | 0.061 PLN |
| `seedream-4-0` | $2.00 | 0.049 PLN |
| `seedream-5-0-pro` | $3.50 | 0.086 PLN |
| `seededit-3-0` | $2.50 | 0.061 PLN |

**PLN Calculation Formula:**

```
cost_pln = (tokens / 1,000,000) x rate_usd x 4.0 x 1.5
```

The 4.0 is the USD/PLN exchange rate and 1.5 is the platform margin multiplier.

**Example: 1024x1024 image with seedream-5-0**

```
tokens = (1024 x 1024) / 256 = 4,096
cost_usd = (4,096 / 1,000,000) x $2.00 = $0.008192
cost_pln = $0.008192 x 4.0 x 1.5 = 0.049 PLN
```

### AWS Bedrock

Bedrock models are billed on actual input + output tokens. Rates are in PLN per 1,000 tokens.

| Model | Rate (PLN / 1K tokens) | Best For |
|-------|----------------------|----------|
| `claude-sonnet-4.6` | 0.054 PLN | Complex reasoning & code |
| `claude-haiku-4.5` | 0.015 PLN | Fast responses & simple tasks |
| `nova-pro` | 0.012 PLN | General purpose, cost-effective |
| `nova-lite` | 0.004 PLN | High-volume, simple tasks |
| `nova-micro` | 0.002 PLN | Ultra-low-cost classification |

## Wallet Top-Up Packages

Top up your PLN wallet with packages. Larger packages include bonus credits as a percentage reward.

| Package | Amount | Bonus Credits | Bonus % |
|---------|--------|---------------|---------|
| Starter | 50 PLN | +100 | 0% |
| Basic | 100 PLN | +250 | 5% |
| Growth | 250 PLN | +700 | 10% |
| Pro | 500 PLN | +1,500 | 15% |
| Scale | 1,000 PLN | +3,500 | 20% |
| Enterprise | 5,000 PLN | +20,000 | 25% |

::: info Bonus Credits
Bonus credits from top-up packages are added to your monthly credit balance and do not expire. They are consumed before wallet PLN.
:::

## Hard Spending Limits

Projects can set a hard spending limit (`hard_limit_pln`) to prevent overspending. Once the limit is reached, all further requests that would charge to the wallet will fail with a `402 Payment Required` status.

```json
{
  "error": {
    "code": "spending_limit_reached",
    "message": "Hard spending limit of 500.00 PLN reached. Increase your limit or wait for credit reset.",
    "current_spend_pln": 500.00,
    "hard_limit_pln": 500.00,
    "credits_remaining": 0
  }
}
```

::: warning Hard Limits Are Per Billing Cycle
The hard limit tracks total wallet PLN charged in the current billing cycle. It resets when your monthly credits reset. Configure it via your dashboard or the `/v1/billing/settings` endpoint.
:::

## Billing API Endpoints

Use these endpoints to programmatically check your balance, view pricing, and manage your wallet.

### GET /v1/billing/balance

Returns your current credit balance and wallet PLN amount.

**Authentication:** API Key (Bearer token)

**Response:**

```json
{
  "credits": {
    "remaining": 342,
    "total": 5000,
    "resets_at": "2026-08-01T00:00:00Z"
  },
  "wallet": {
    "balance_pln": 127.50,
    "hard_limit_pln": 500.00
  },
  "tier": "startup"
}
```

---

### GET /v1/billing/pricing

Returns the full pricing catalog for all available models and operations.

**Authentication:** API Key (Bearer token)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Filter by category: `image`, `video`, `music`, `chat`, `voice`, `analysis` |
| `model` | string | No | Filter by specific model ID |

**Response:**

```json
{
  "models": [
    {
      "id": "flux-pro",
      "category": "image",
      "billing_type": "credits",
      "credits": 4,
      "pln_cost": 0.60,
      "unit": "per image"
    },
    {
      "id": "seedream-5-0",
      "category": "image",
      "billing_type": "token",
      "rate_per_1m_tokens_usd": 2.00,
      "unit": "per image (variable)"
    }
  ]
}
```

---

### GET /v1/billing/transactions

Returns your billing transaction history with pagination and metadata.

**Authentication:** API Key (Bearer token)

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 50 | Number of transactions to return (max 100) |
| `offset` | integer | No | 0 | Offset for pagination |
| `from` | string | No | — | Start date filter (ISO 8601) |
| `to` | string | No | — | End date filter (ISO 8601) |
| `type` | string | No | — | Filter by type: `generation`, `topup`, `refund` |

**Response:**

```json
{
  "transactions": [
    {
      "id": "txn_abc123",
      "type": "generation",
      "method": "credits",
      "credits_used": 4,
      "pln_charged": 0.60,
      "model": "flux-pro",
      "metadata": {
        "tokens": null,
        "resolution": "1024x1024"
      },
      "created_at": "2026-07-17T14:30:00Z"
    },
    {
      "id": "txn_def456",
      "type": "generation",
      "method": "token",
      "credits_used": 0,
      "pln_charged": 0.049,
      "model": "seedream-5-0",
      "metadata": {
        "tokens": 4096,
        "resolution": "1024x1024"
      },
      "created_at": "2026-07-17T14:25:00Z"
    }
  ],
  "total": 1247,
  "has_more": true
}
```

---

### POST /v1/billing/topup

Initiate a wallet top-up. Returns a payment URL for completing the transaction.

**Authentication:** API Key (Bearer token)

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount_pln` | number | Yes | Amount to add in PLN. Must match a package: 50, 100, 250, 500, 1000, 5000 |
| `return_url` | string | No | URL to redirect to after payment completion |

**Response:**

```json
{
  "payment_url": "https://checkout.stripe.com/c/pay/cs_live_...",
  "session_id": "sess_xyz789",
  "package": {
    "amount_pln": 250,
    "bonus_credits": 700,
    "bonus_pct": 10
  }
}
```

## Code Examples

### Check Balance

::: code-group

```bash [cURL]
curl -X GET "https://apis.fotohub.app/v1/billing/balance" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

```python [Python]
import requests

response = requests.get(
    "https://apis.fotohub.app/v1/billing/balance",
    headers={"Authorization": "Bearer YOUR_API_KEY"}
)

balance = response.json()
print(f"Credits: {balance['credits']['remaining']}/{balance['credits']['total']}")
print(f"Wallet: {balance['wallet']['balance_pln']} PLN")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/billing/balance", {
  headers: { "Authorization": "Bearer YOUR_API_KEY" }
});

const balance = await response.json();
console.log(`Credits: ${balance.credits.remaining}/${balance.credits.total}`);
console.log(`Wallet: ${balance.wallet.balance_pln} PLN`);
```

:::

### Get Pricing Catalog

::: code-group

```bash [cURL]
curl -X GET "https://apis.fotohub.app/v1/billing/pricing?category=image" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

```python [Python]
import requests

response = requests.get(
    "https://apis.fotohub.app/v1/billing/pricing",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    params={"category": "image"}
)

pricing = response.json()
for model in pricing["models"]:
    if model["billing_type"] == "credits":
        print(f"{model['id']}: {model['credits']} credits ({model['pln_cost']} PLN)")
    else:
        print(f"{model['id']}: token-based @ ${model['rate_per_1m_tokens_usd']}/1M tokens")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/billing/pricing?category=image",
  { headers: { "Authorization": "Bearer YOUR_API_KEY" } }
);

const pricing = await response.json();
pricing.models.forEach(model => {
  if (model.billing_type === "credits") {
    console.log(`${model.id}: ${model.credits} credits (${model.pln_cost} PLN)`);
  } else {
    console.log(`${model.id}: token-based @ $${model.rate_per_1m_tokens_usd}/1M tokens`);
  }
});
```

:::

### List Transactions

::: code-group

```bash [cURL]
curl -X GET "https://apis.fotohub.app/v1/billing/transactions?limit=10&from=2026-07-01T00:00:00Z" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

```python [Python]
import requests

response = requests.get(
    "https://apis.fotohub.app/v1/billing/transactions",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    params={
        "limit": 10,
        "from": "2026-07-01T00:00:00Z",
        "type": "generation"
    }
)

transactions = response.json()
total_credits = sum(t["credits_used"] for t in transactions["transactions"])
total_pln = sum(t["pln_charged"] for t in transactions["transactions"])
print(f"Last 10 generations: {total_credits} credits, {total_pln:.2f} PLN")
```

```typescript [TypeScript]
const params = new URLSearchParams({
  limit: "10",
  from: "2026-07-01T00:00:00Z",
  type: "generation"
});

const response = await fetch(
  `https://apis.fotohub.app/v1/billing/transactions?${params}`,
  { headers: { "Authorization": "Bearer YOUR_API_KEY" } }
);

const { transactions, total } = await response.json();
const totalPln = transactions.reduce((sum, t) => sum + t.pln_charged, 0);
console.log(`Total transactions: ${total}, Recent spend: ${totalPln.toFixed(2)} PLN`);
```

:::

### Top Up Wallet

::: code-group

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/billing/topup" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount_pln": 250, "return_url": "https://yourapp.com/billing/success"}'
```

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/billing/topup",
    headers={
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    },
    json={
        "amount_pln": 250,
        "return_url": "https://yourapp.com/billing/success"
    }
)

result = response.json()
print(f"Payment URL: {result['payment_url']}")
print(f"Bonus: +{result['package']['bonus_credits']} credits ({result['package']['bonus_pct']}%)")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/billing/topup", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    amount_pln: 250,
    return_url: "https://yourapp.com/billing/success"
  })
});

const result = await response.json();
// Redirect user to complete payment
window.location.href = result.payment_url;
```

:::

## Webhook Events

Set up [webhooks](/api/webhooks) to get notified about billing events:

### `credits.low`

Fired when your credit balance drops below 10% of your tier allowance. Use this to alert your team or trigger an auto top-up.

```json
{
  "event": "credits.low",
  "data": {
    "credits_remaining": 45,
    "credits_total": 5000,
    "tier": "startup",
    "percentage_remaining": 0.9
  },
  "timestamp": "2026-07-17T18:00:00Z"
}
```

### `credits.depleted`

Fired when both credits and wallet are empty. All subsequent requests will receive `402 Payment Required`.

```json
{
  "event": "credits.depleted",
  "data": {
    "credits_remaining": 0,
    "wallet_balance_pln": 0.00,
    "tier": "startup",
    "last_operation": "flux-pro"
  },
  "timestamp": "2026-07-17T22:15:00Z"
}
```

### `billing.charged`

Fired whenever a wallet PLN charge occurs (i.e., credits were not sufficient and the wallet was used as fallback).

```json
{
  "event": "billing.charged",
  "data": {
    "transaction_id": "txn_abc123",
    "method": "wallet",
    "pln_charged": 0.60,
    "model": "flux-pro",
    "wallet_balance_after": 126.90
  },
  "timestamp": "2026-07-17T14:30:00Z"
}
```

::: tip Webhook Configuration
Configure webhook endpoints in your dashboard under **Settings > Webhooks**. All webhook payloads are signed with your webhook secret for verification. See the [Webhooks documentation](/api/webhooks) for setup details.
:::
