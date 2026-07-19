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

## API Tiers

FOTOhub offers two categories of access tiers:

### Pay-As-You-Go (PAYG)

No subscription required. Fund your wallet and pay per operation. Tier upgrades are automatic based on wallet balance and lifetime spending.

| Tier | Requirements | Rate Limit | Models | Features |
|------|-------------|------------|--------|----------|
| PAYG Basic | Register + fund wallet | 30 rpm | Basic models | Standard API access |
| PAYG Standard | Min 100 PLN balance OR 200 PLN lifetime | 120 rpm | All standard | Webhooks, video, music |
| PAYG Premium | Min 500 PLN balance OR 2,000 PLN lifetime | 500 rpm | All + beta | Agents, batch, compute |

### Subscription Plans

Monthly subscription with included credit allowance. Overage is charged from wallet at 1.5x provider cost.

| Plan | Monthly Price | Credits/mo | Rate Limit | Storage | Models |
|------|-------------|-----------|-----------|---------|--------|
| Developer | 49 PLN | 500 | 60 rpm | 10 GB | All standard |
| **Startup** | **199 PLN** | **5,000** | **300 rpm** | **100 GB** | **All models** |
| Business | 799 PLN | 25,000 | 1,000 rpm | 500 GB | All + beta |
| Enterprise | Custom | Unlimited | 5,000 rpm | Unlimited | Custom |

### Tier Endpoints

```bash
# Get full tier catalog (no auth required)
curl https://apis.fotohub.app/v1/tiers/catalog

# Get your current tier and usage
curl https://apis.fotohub.app/v1/tiers/current \
  -H "Authorization: Bearer fh_live_your_key"

# Subscribe to a tier
curl -X POST https://apis.fotohub.app/v1/tiers/subscribe \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"tier": "sub-startup"}'

# Apply for enterprise
curl -X POST https://apis.fotohub.app/v1/tiers/enterprise/apply \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Acme Corp",
    "contact_email": "cto@acme.com",
    "company_size": "51-200",
    "use_case": "AI-powered product photography for e-commerce catalog",
    "expected_monthly_volume": "50k images, 5k videos"
  }'
```

::: info Enterprise Plans
Enterprise plans include dedicated infrastructure, SLA guarantees (custom), priority support, SSO/SAML, and custom rate limits. Submit an application or contact sales@fotohub.app.
:::

## Credit Costs by Operation

Each operation type has a fixed credit cost. For token-based models, credits are calculated dynamically based on actual token usage.

### Image Generation

| Model ID | Name | Credits | Unit |
|----------|------|---------|------|
| `imagen-3-fast` | Imagen 3 Fast | 1 | per image |
| `imagen-3-standard` | Imagen 3 Standard | 2 | per image |
| `imagen-4-fast` | Imagen 4 Fast | 2 | per image |
| `imagen-4-standard` | Imagen 4 Standard | 3 | per image |
| `imagen-4-ultra` | Imagen 4 Ultra | 5 | per image |
| `dall-e-3` | DALL-E 3 | 2 | per image |
| `dall-e-3-hd` | DALL-E 3 HD | 4 | per image |
| `gpt-image-1` | GPT Image 1 | 4 | per image |
| `grok-imagine-image` | Grok Imagine | 1 | per image |
| `grok-imagine-image-pro` | Grok Imagine Pro | 4 | per image |
| `flux-2-klein-4b` | FLUX 2 Klein 4B | 1 | per image |
| `flux-2-klein-9b` | FLUX 2 Klein 9B | 1 | per image |
| `flux-2-pro` | FLUX 2 Pro | 2 | per image |
| `flux-1.1-pro` | FLUX 1.1 Pro | 2 | per image |
| `flux-1.1-pro-ultra` | FLUX 1.1 Pro Ultra | 3 | per image |
| `flux-1.1-pro-raw` | FLUX 1.1 Pro Raw | 3 | per image |
| `flux-kontext-pro` | FLUX Kontext Pro | 2 | per image |
| `flux-kontext-max` | FLUX Kontext Max | 4 | per image |
| `flux-fill-pro` | FLUX Fill Pro | 3 | per image |
| `flux-2-max` | FLUX 2 Max | 4 | per image |
| `minimax-image-01` | MiniMax Image | 1 | per image |
| `kling-v2-1` | Kling V2.1 | 2 | per image |
| `kling-v3` | Kling V3 | 5 | per image |
| `kling-v3-omni` | Kling V3 Omni | 8 | per image |

### Video Generation

Credits are multiplied by `max(1, duration ÷ 5)` for longer clips.

| Model ID | Name | Base Credits (5s) | Unit |
|----------|------|-------------------|------|
| `veo-2` | Veo 2 (Google) | 10 | per 5s segment |
| `veo-3` | Veo 3 (Google) | 15 | per 5s segment |
| `wan` | WAN | 8 | per 5s segment |
| `kling` | Kling Video | 10 | per 5s segment |
| `hailuo` | Hailuo (MiniMax) | 8 | per 5s segment |
| `seedance` | Seedance 2.0 (BytePlus) | 10 | per 5s segment |
| `sora-2` | Sora 2 (OpenAI) | 12 | per 5s segment |

::: info Video Billing Example
A 30-second video with `veo-2` costs: `10 × (30 ÷ 5) = 60 credits`. A 5-second clip costs 10 credits.
:::

### Music Generation

| Model ID | Name | Credits | Unit |
|----------|------|---------|------|
| `ida-music` | IDA Music (≤3 min) | 2 | per generation |
| `ida-music` | IDA Music (>3 min) | 4 | per generation |
| `minimax` | MiniMax Music (≤30s) | 5 | per generation |
| `minimax` | MiniMax Music (≤60s) | 10 | per generation |
| `minimax` | MiniMax Music (>60s) | 25 | per generation |

### Chat & Analysis

| Model ID | Name | Credits | Unit |
|----------|------|---------|------|
| `gemini-flash` | Gemini Flash | 1 | per request |
| `gemini-pro` | Gemini Pro | 2 | per request |
| `gpt-4o` | GPT-4o | 2 | per request |
| `claude-sonnet` | Claude Sonnet | 2 | per request |
| `image-analysis` | Image Analysis | 1 | per analysis |
| `enhance-prompt` | Prompt Enhancement | 1 | per request |

### Bedrock Chat (Token-Based)

| Model ID | Input (USD/1M) | Output (USD/1M) | ~PLN/1K tokens |
|----------|---------------|-----------------|----------------|
| `claude-sonnet-4.6` | $3.00 | $15.00 | per-token |
| `claude-sonnet-4.5` | $3.00 | $15.00 | per-token |
| `claude-haiku-4.5` | $0.80 | $4.00 | per-token |
| `nova-pro` | $0.80 | $3.20 | per-token |
| `nova-lite` | $0.25 | $1.00 | per-token |
| `nova-micro` | $0.10 | $0.40 | per-token |

### Voice & Audio

| Model ID | Name | Credits | Unit |
|----------|------|---------|------|
| `google` | IDA Voice (Standard) | 1 | per 1000 chars |
| `ida-voice` | IDA Voice Pro | 2 | per 1000 chars |
| Sound Effects | SFX Generation | 3 | per generation |
| Transcription | Speech-to-Text | 1 | per minute |
| Translation | Audio Translation | 2 | per minute |
| Dubbing | Voice Dubbing | 5 | per minute |

### 3D Generation

| Model | Name | Credits | Unit |
|-------|------|---------|------|
| `triposr` | FH Lite 3D | 5 | per model |
| `sf3d` | FH Fast 3D | 5 | per model |
| `shap-e` | FH Text 3D | 10 | per model |
| `trellis` | FH HD 3D | 15 | per model |
| `hunyuan3d` | FH Pro 3D | 25 | per model |

See [3D Generation](/api/3d-generation) for full endpoint reference and output format options (GLB, OBJ, STL, USDZ).

### Image Editing & Tools

| Operation | Credits | Unit |
|-----------|---------|------|
| Edit Image (inpaint/outpaint/bgswap/remove/upscale) | 2 | per request |
| Stability Fast Upscale | 1 | per image |
| Stability Remove Background | 1 | per image |
| Stability Style Transfer | 2 | per image |
| Stability Creative Upscale | 3 | per image |
| Stability Inpaint/Outpaint | 3 | per image |

## Token-Based Pricing

Some models bill based on actual token consumption rather than a fixed credit cost. This provides more granular pricing that scales with resolution and complexity.

### BytePlus SeedDream

SeedDream models calculate tokens from the output image dimensions. The formula is:

```
output_tokens = (width × height) / 256
cost_usd = (output_tokens / 1,000,000) × rate_per_1m_usd
cost_pln = cost_usd × 4.0 (USD→PLN) × 1.5 (margin)
```

| Model | Rate (USD / 1M tokens) | 1024×1024 Cost |
|-------|----------------------|----------------|
| `seedream-5-0-260128` | $2.00 | 0.049 PLN |
| `seedream-4-5-251128` | $2.50 | 0.061 PLN |
| `seedream-4-0-250828` | $2.00 | 0.049 PLN |
| `dola-seedream-5-0-pro-260628` | $3.50 | 0.086 PLN |
| `seededit-3-0-i2i-250628` | $2.50 | 0.061 PLN |

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

### GET /v1/billing/topup/packages

List available top-up packages with pricing and bonus credits.

**Authentication:** None required

**Response:**

```json
{
  "packages": [
    {"slug": "topup-50", "amount_pln": 50, "bonus_credits": 100, "bonus_pct": 5},
    {"slug": "topup-100", "amount_pln": 100, "bonus_credits": 250, "bonus_pct": 8},
    {"slug": "topup-250", "amount_pln": 250, "bonus_credits": 700, "bonus_pct": 10},
    {"slug": "topup-500", "amount_pln": 500, "bonus_credits": 1600, "bonus_pct": 12},
    {"slug": "topup-1000", "amount_pln": 1000, "bonus_credits": 3500, "bonus_pct": 15},
    {"slug": "topup-5000", "amount_pln": 5000, "bonus_credits": 20000, "bonus_pct": 20}
  ]
}
```

### POST /v1/billing/topup

Initiate a wallet top-up via Stripe Checkout. Returns a payment URL.

**Authentication:** JWT (session token)

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `package` | string | **Yes** | Package slug: `topup-50`, `topup-100`, `topup-250`, `topup-500`, `topup-1000`, `topup-5000` |

**Response:**

```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_live_...",
  "package": {
    "slug": "topup-250",
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
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"package": "topup-250"}'
```

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/billing/topup",
    headers={
        "Authorization": "Bearer YOUR_JWT_TOKEN",
        "Content-Type": "application/json"
    },
    json={"package": "topup-250"}
)

result = response.json()
print(f"Checkout URL: {result['checkout_url']}")
print(f"Bonus: +{result['package']['bonus_credits']} credits ({result['package']['bonus_pct']}%)")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/billing/topup", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ package: "topup-250" })
});

const result = await response.json();
// Redirect user to complete payment
window.location.href = result.checkout_url;
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
