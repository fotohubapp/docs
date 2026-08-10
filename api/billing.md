# Billing & Pricing

FOTOhub uses a dual-mode billing system combining prepaid credits with pay-as-you-go wallet fallback. Every API response includes a detailed billing breakdown so you always know exactly what you spent.

## Billing Overview

FOTOhub operates on a dual-mode billing system designed for flexibility and cost control:

| Mode | Description |
|------|-------------|
| **Credits** | Prepaid monthly allowance included with your plan tier. Credits are deducted first for every operation. Reset monthly on your billing cycle. |
| **Wallet (USD)** | Pay-as-you-go fallback when credits are exhausted. Top up your wallet with packages. Charged in USD with no expiration. |
| **Token-Based** | Some models (BytePlus SeedDream image models, premium FOTOhub AI chat models) bill per-token instead of a fixed credit cost. Billed after execution based on actual usage. |

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
      ↓ Yes                                   wallet USD
   Fall back to wallet USD                            ↓
              ↓                                            ↓
              └─────────────────────┬──────────────────────┘
                                    ↓
                    Response with billing breakdown
```

**Step-by-step:**

1. **Authentication** — Request comes in and is authenticated via API key. The user's tier and balance are loaded.
2. **Billing Mode Detection** — System checks whether the operation uses token-based or credit-based billing based on the model.
3. **Credit-Based Path** — Deduct from monthly tier allowance. If credits are exhausted, fall back to wallet USD automatically.
4. **Token-Based Path** — Execute first, count tokens after completion, then bill from credits (if sufficient) or wallet USD.
5. **Response** — Every response includes a full billing breakdown showing method, credits used, and USD charged.

::: tip Automatic Fallback
When your monthly credits are exhausted, billing automatically falls back to your USD wallet. No configuration needed — as long as your wallet has funds, requests continue without interruption.
:::

## The `billing` Object

Every API response includes a `billing` field with a complete breakdown of the charges. The structure varies depending on the billing method used.

### Credit-based billing

```json
{
  "billing": {
    "method": "credits",
    "credits_used": 3,
    "usd_charged": 0.12
  }
}
```

### Token-based billing

```json
{
  "billing": {
    "method": "token",
    "credits_used": 2,
    "usd_charged": 0.0131,
    "cost_breakdown": {
      "output_tokens": 4096,
      "cost_usd": 0.008192,
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
    "usd_charged": 0.12
  }
}
```

::: warning Legacy `pln_charged` field
Some endpoints still include a `pln_charged` field alongside `usd_charged` for backward compatibility during the USD migration. It reflects the real PLN amount computed internally (not a re-conversion of `usd_charged`), but new integrations should read `usd_charged` — the wallet itself is USD-denominated.
:::

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
| PAYG Standard | Min $25 balance OR $50 lifetime | 120 rpm | All standard | Webhooks, video, music |
| PAYG Premium | Min $120 balance OR $500 lifetime | 500 rpm | All + beta | Agents, batch, compute |

### Subscription Plans

Monthly subscription with included credit allowance. Overage is charged from your wallet in USD at 1.5x provider cost.

::: info Subscription prices are quoted in PLN
The wallet, per-request billing, and PAYG thresholds are USD. API tier
subscriptions below are the one exception — they remain PLN-denominated. The
`currency` field on `GET /v1/tiers/catalog` describes the PAYG/overage
currency (`USD`), not `price_monthly`.
:::

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
| `grok-imagine-image-quality` | Grok Imagine Quality | 3 | per image |
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

Most models bill `credits_per_second × duration` (MiniMax Hailuo bills a flat per-video amount instead). See the [full Video Generation Models catalog](/api/models#video-generation-models) for pricing across all 30+ models.

| Model ID | Name | Credits/s | Provider |
|----------|------|:---------:|----------|
| `veo-2.0-generate-001` | Veo 2 (Google) | 31 | Google |
| `veo-3.1-generate-001` | Veo 3.1 (Google) | 12 | Google |
| `wan2.2-t2v-plus` | Wan 2.2 Plus | 1.2 | Alibaba |
| `kling-v3` | Kling v3 | 5 | Kuaishou |
| `hailuo-o2` | Hailuo O2 (MiniMax) | — (6 cr flat/video) | MiniMax |
| `seedance-2-0-pro` | Seedance 2.0 (ByteDance) | 9.4 | ByteDance |
| `sora-2` | Sora 2 (OpenAI) | 8 | OpenAI |
| `gemini-omni-flash` | Gemini Omni Flash (Google) | 6 | Google |
| `grok-imagine-video-1.5` | Grok Video 1.5 (xAI) | 9 | xAI |

::: info Video Billing Example
A 5-second video with `veo-3.1-generate-001` costs: `12 × 5 = 60 credits`.
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
| `gemini-flash` | Gemini Flash | 20 in / 166.7 out | per 1M tokens |
| `gemini-pro` | Gemini Pro | 83 in / 667 out | per 1M tokens |
| `gpt-4o` | GPT-4o | 200 in / 1000 out | per 1M tokens |
| `claude-sonnet` | Claude Sonnet | 200 in / 1000 out | per 1M tokens |
| `image-analysis` | Image Analysis | 1 | per analysis |
| `enhance-prompt` | Prompt Enhancement | 1 | per request |

### Premium Chat (Token-Based)

| Model ID | Input (USD/1M) | Output (USD/1M) | Billing |
|----------|---------------|-----------------|---------|
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
| `fh-lite-3d` | FH Lite 3D | 3 | per model |
| `fh-text-3d` | FH Text 3D | 5 | per model |
| `fh-pro-3d` | FH Pro 3D | 15 | per model |

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
cost_usd = (output_tokens / 1,000,000) × rate_per_1m_usd × 1.5 (margin)
```

These rates are quoted in USD by the provider, so there is no currency
conversion step and no exchange-rate exposure — the charge is fully
determined by the output resolution.

| Model | Rate (USD / 1M tokens) | 1024×1024 Cost |
|-------|----------------------|----------------|
| `seedream-5-0-260128` | $2.00 | $0.0123 |
| `seedream-4-5-251128` | $2.50 | $0.0154 |
| `seedream-4-0-250828` | $2.00 | $0.0123 |
| `dola-seedream-5-0-pro-260628` | $3.50 | $0.0215 |
| `seededit-3-0-i2i-250628` | $2.50 | $0.0154 |

**Example: 1024x1024 image with seedream-5-0**

```
tokens   = (1024 x 1024) / 256 = 4,096
raw_cost = (4,096 / 1,000,000) x $2.00 = $0.008192
charged  = $0.008192 x 1.5 = $0.0123
```

Resolution drives cost quadratically: a 2K image is 16,384 tokens (4x a 1K
image) and a 4K image is 65,536 tokens (16x). Request the smallest resolution
that meets your needs.

### Premium Chat Models

Premium chat models are billed on actual input + output tokens, at a blended
rate covering both directions. Rates are USD per 1,000 tokens.

| Model | Rate (USD / 1K tokens) | Approx. USD / 1M | Best For |
|-------|----------------------|-----------------|----------|
| `claude-opus-4.6` | $0.0723 | $72.35 | Hardest reasoning tasks |
| `claude-sonnet-4.6` | $0.0145 | $14.47 | Complex reasoning & code |
| `claude-haiku-4.5` | $0.0040 | $4.02 | Fast responses & simple tasks |
| `nova-premier` | $0.0100 | $10.05 | Long-context analysis |
| `nova-pro` | $0.0032 | $3.22 | General purpose, cost-effective |
| `nova-lite` | $0.0002 | $0.24 | High-volume, simple tasks |
| `nova-micro` | $0.0001 | $0.14 | Ultra-low-cost classification |

::: info Rates track the exchange rate
Unlike the SeedDream rates above, these are derived from provider costs held
internally in PLN and converted at the live NBP mid rate on each request, so
the USD figures shift slightly day to day. Read the authoritative current
number from `GET /v1/billing/pricing` rather than hardcoding it.
:::

## Wallet Top-Up Packages

Top up your USD wallet with packages. Larger packages include bonus credits as
a percentage reward.

| Package | Slug | Amount | Bonus Credits | Bonus % |
|---------|------|--------|---------------|---------|
| Starter | `topup-50` | $15 | +100 | 0% |
| Basic | `topup-100` | $25 | +250 | 5% |
| Growth | `topup-250` | $60 | +700 | 10% |
| Pro | `topup-500` | $120 | +1,500 | 15% |
| Scale | `topup-1000` | $225 | +3,500 | 20% |
| Enterprise | `topup-5000` | $1,000 | +20,000 | 25% |

The slugs are historical (they were named after the old PLN amounts) and are
stable identifiers — treat them as opaque and read `amount_usd` for the price.

::: info Bonus Credits
Bonus credits from top-up packages are added to your monthly credit balance and do not expire. They are consumed before wallet USD.
:::

### Paying in PLN

The wallet is always USD: a package credits the same `amount_usd` no matter how
you pay. Polish customers can still pay in złoty — send
`"pay_currency": "pln"` and Stripe charges the equivalent PLN amount, converted
at the live NBP mid rate, which unlocks BLIK and Polish bank transfer alongside
card. USD checkout offers card and Link.

Because the wallet is credited from the package's `amount_usd` rather than from
what Stripe collected, exchange-rate movement between quote and settlement can
never desync your balance.

## Hard Spending Limits

You can set a hard spending limit in USD (`hard_limit_usd`) to prevent
overspending, scoped either to one project or to the whole account. Once the
limit is reached, all further requests that would charge to the wallet fail with
`402 Payment Required`.

```json
{
  "detail": "Monthly overage limit reached ($120.00/$120.00). Top up your wallet or increase the limit."
}
```

An empty wallet produces the same status with a different message:

```json
{
  "detail": "Insufficient wallet balance. Need $0.12. Credits exhausted, wallet empty. Top up to continue."
}
```

Set the limit with `PUT /v1/billing/overage-limit`. Omit `project_id` to cap the
whole account:

```bash
# Account-wide cap
curl -X PUT "https://apis.fotohub.app/v1/billing/overage-limit" \
  -H "Authorization: Bearer YOUR_SESSION_JWT" \
  -H "Content-Type: application/json" \
  -d '{"hard_limit_usd": 120}'

# Cap a single project instead
curl -X PUT "https://apis.fotohub.app/v1/billing/overage-limit" \
  -H "Authorization: Bearer YOUR_SESSION_JWT" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "YOUR_PROJECT_ID", "hard_limit_usd": 120}'
```

::: warning This endpoint needs a session JWT, not an API key
Unlike the rest of the billing endpoints, `PUT /v1/billing/overage-limit`
authenticates with your dashboard session token. An `fh_live_*` / `fh_test_*` key
is rejected with `401 {"detail": "Invalid or expired token"}` — changing your own
spending cap is an account-level action, so it is not delegated to API keys.
:::

A project-level limit takes precedence over the account-level one when the
request is attributed to that project.

Pass `0` or `null` to disable the limit, leaving your wallet balance as the only
cap. The response reports the **stored** limit, so disabling reads back as
`"hard_limit_usd": null` rather than `0`:

```json
{ "hard_limit_usd": null, "project_id": null }
```

A negative value or a non-numeric one is rejected with `400`, and the previously
stored limit is left untouched. The legacy `hard_limit_pln` key is still accepted
during the migration and is interpreted as USD.

::: warning Hard Limits Are Per Billing Cycle
The hard limit tracks total wallet USD charged in the current billing cycle. It resets when your monthly credits reset.
:::

## Billing API Endpoints

Use these endpoints to programmatically check your balance, view pricing, and manage your wallet.

### GET /v1/billing/balance

Returns your current credit allowances, USD wallet balance, overage status, and
active API subscription.

**Authentication:** API Key (Bearer token)

**Response:**

```json
{
  "tier": "startup",
  "credits": {
    "used_4h": 12,
    "limit_4h": 1000,
    "remaining_4h": 988,
    "used_period": 658,
    "limit_period": 5000,
    "remaining_period": 4342,
    "bonus_remaining": 250
  },
  "wallet": {
    "balance": 34.18,
    "currency": "USD",
    "pending": 0,
    "total_earned": 60.00,
    "total_withdrawn": 0
  },
  "api_subscription": null,
  "overage": {
    "spent_this_month": 4.62,
    "hard_limit_usd": 120.00,
    "remaining": 115.38
  }
}
```

`wallet.balance` is USD, as declared by `wallet.currency`. Credits are counted
in two independent windows: a rolling 4-hour burst allowance and the monthly
period allowance. `overage.hard_limit_usd` and `overage.remaining` are `null`
when no limit is configured.

---

### GET /v1/billing/pricing

Returns the full pricing catalog: every model grouped by category, plus credit-cost conversions, subscription plans, and top-up/storage packages. This endpoint takes no query parameters — filter client-side by category key.

**Authentication:** Public (no auth required)

**Response:**

```json
{
  "currency": "USD",
  "margin_info": "All prices include platform fee. Volume discounts available for Enterprise.",
  "pricing": {
    "image_generation": {
      "description": "AI Image Generation",
      "unit": "per image",
      "currency": "USD",
      "models": {
        "imagen-3-fast": { "name": "Imagen 3 Fast (512px)", "price": 0.0322, "credits": 1 },
        "seedream-5-0-260128": { "name": "SeedDream 5.0 Lite (2K-4K)", "price": 0.0563, "credits": 2 },
        "imagen-4-ultra": { "name": "Imagen 4 Ultra (4K)", "price": 0.2412, "credits": 5 }
      }
    },
    "storage": {
      "description": "Cloud Storage Rental",
      "unit": "per GB per month",
      "currency": "USD",
      "tiers": {
        "standard": { "name": "Standard Storage", "price": 0.0402 },
        "premium": { "name": "Premium SSD", "price": 0.1206 },
        "archive": { "name": "Archive", "price": 0.0121 }
      }
    }
  },
  "credit_costs": { "generate_image_standard": 2, "generate_video_5s": 10 },
  "api_plans": { },
  "topup_packages": [ ],
  "storage_packages": [ ]
}
```

Each category under `pricing` exposes a `description`, `unit`, `currency`, and
one grouping map — `models` for AI categories, or `tiers` / `gpus` /
`operations` for storage and compute. Each entry has a display `name`, a
per-unit `price` in USD, and (for models) a `credits` cost.

::: tip Prices are computed per request
Provider costs are held internally in PLN and converted to USD at the live NBP
mid rate when this endpoint is called, so `price` values move slightly day to
day. Read them at request time instead of caching them long-term, and use the
live [`GET /v1/models`](/api/models) endpoint for the always-current model
list.
:::

---

### GET /v1/billing/transactions

Returns your billing transaction history with pagination and metadata.

**Authentication:** API Key (Bearer token)

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (1-based) |
| `pageSize` | integer | No | 50 | Rows per page (max 200) |
| `type` | string | No | — | Filter by transaction type, e.g. `topup`, `deduction` |

**Response:**

```json
{
  "data": [
    {
      "id": "8f2c1e04-...",
      "created_at": "2026-08-06T09:14:22Z",
      "type": "deduction",
      "amount_pln": null,
      "amount_usd": 0.0563,
      "description": "generate_image (seedream-5-0-260128)",
      "metadata": { "operation": "generate_image" }
    },
    {
      "id": "3ab77d51-...",
      "created_at": "2026-07-02T11:03:47Z",
      "type": "deduction",
      "amount_pln": 0.21,
      "amount_usd": null,
      "description": "generate_image (flux-2-pro)",
      "metadata": { "operation": "generate_image" }
    }
  ],
  "page": 1,
  "page_size": 50
}
```

::: warning Two currencies in one history
Rows written before the 2026-08-05 USD cutover carry `amount_pln` with
`amount_usd: null`; rows after it are the reverse. **Branch on which field is
non-null — never sum the two together**, and never treat a null as zero when
totalling. The response has no `total` or `has_more`: request the next page
until you get fewer rows than `page_size`.
:::

---

### GET /v1/billing/topup/packages

List available top-up packages with pricing and bonus credits.

**Authentication:** None required

**Response:**

```json
{
  "packages": [
    {"slug": "topup-50", "name": "$15", "amount_usd": 15, "bonus_credits": 100, "bonus_pct": 0},
    {"slug": "topup-100", "name": "$25", "amount_usd": 25, "bonus_credits": 250, "bonus_pct": 5},
    {"slug": "topup-250", "name": "$60", "amount_usd": 60, "bonus_credits": 700, "bonus_pct": 10},
    {"slug": "topup-500", "name": "$120", "amount_usd": 120, "bonus_credits": 1500, "bonus_pct": 15},
    {"slug": "topup-1000", "name": "$225", "amount_usd": 225, "bonus_credits": 3500, "bonus_pct": 20},
    {"slug": "topup-5000", "name": "$1000", "amount_usd": 1000, "bonus_credits": 20000, "bonus_pct": 25}
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
| `pay_currency` | string | No | `usd` (default) or `pln`. Only changes what Stripe charges — the wallet is credited `amount_usd` either way. |

**Response:**

```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_live_...",
  "package": {
    "slug": "topup-250",
    "name": "$60",
    "amount_usd": 60,
    "bonus_credits": 700,
    "bonus_pct": 10
  },
  "pay_currency": "usd"
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
credits = balance["credits"]
print(f"Credits: {credits['remaining_period']}/{credits['limit_period']}")
print(f"Wallet: ${balance['wallet']['balance']:.2f}")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/billing/balance", {
  headers: { "Authorization": "Bearer YOUR_API_KEY" }
});

const balance = await response.json();
const { remaining_period, limit_period } = balance.credits;
console.log(`Credits: ${remaining_period}/${limit_period}`);
console.log(`Wallet: $${balance.wallet.balance.toFixed(2)}`);
```

:::

### Get Pricing Catalog

::: code-group

```bash [cURL]
# Public endpoint — no auth required
curl -X GET "https://apis.fotohub.app/v1/billing/pricing"
```

```python [Python]
import requests

response = requests.get("https://apis.fotohub.app/v1/billing/pricing")
pricing = response.json()

# Prices are grouped by category; models is a dict keyed by model ID
for model_id, info in pricing["pricing"]["image_generation"]["models"].items():
    print(f"{model_id}: {info['credits']} credits (${info['price']})")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/billing/pricing");
const pricing = await response.json();

// Prices are grouped by category; models is an object keyed by model ID
const imageModels = pricing.pricing.image_generation.models;
for (const [modelId, info] of Object.entries(imageModels)) {
  console.log(`${modelId}: ${info.credits} credits ($${info.price})`);
}
```

:::

### List Transactions

::: code-group

```bash [cURL]
curl -X GET "https://apis.fotohub.app/v1/billing/transactions?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

```python [Python]
import requests

response = requests.get(
    "https://apis.fotohub.app/v1/billing/transactions",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    params={"page": 1, "pageSize": 10},
)

rows = response.json()["data"]

# Post-cutover rows carry amount_usd; older ones carry amount_pln. Keep the
# two apart -- adding them would produce a figure in no currency at all.
spend_usd = sum(r["amount_usd"] for r in rows if r["amount_usd"] is not None)
spend_pln = sum(r["amount_pln"] for r in rows if r["amount_usd"] is None)
print(f"Last {len(rows)} transactions: ${spend_usd:.2f} USD", end="")
if spend_pln:
    print(f" + {spend_pln:.2f} PLN (pre-cutover)", end="")
print()
```

```typescript [TypeScript]
const params = new URLSearchParams({ page: "1", pageSize: "10" });

const response = await fetch(
  `https://apis.fotohub.app/v1/billing/transactions?${params}`,
  { headers: { "Authorization": "Bearer YOUR_API_KEY" } }
);

const { data } = await response.json();

// Never sum amount_usd and amount_pln together — see the warning above.
const spendUsd = data
  .filter(r => r.amount_usd !== null)
  .reduce((sum, r) => sum + r.amount_usd, 0);
console.log(`${data.length} transactions, $${spendUsd.toFixed(2)} USD`);
```

:::

### Top Up Wallet

::: code-group

```bash [cURL]
# Charged in USD (card, Link)
curl -X POST "https://apis.fotohub.app/v1/billing/topup" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"package": "topup-250"}'

# Same $60 credited, charged in PLN (BLIK, card, bank transfer)
curl -X POST "https://apis.fotohub.app/v1/billing/topup" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"package": "topup-250", "pay_currency": "pln"}'
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
pkg = result["package"]
print(f"Checkout URL: {result['checkout_url']}")
print(f"Crediting ${pkg['amount_usd']}, charged in {result['pay_currency'].upper()}")
print(f"Bonus: +{pkg['bonus_credits']} credits ({pkg['bonus_pct']}%)")
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

Every payload uses the same envelope: `event`, `timestamp`, `data`, and
`attempt` (the delivery attempt number, starting at 1).

Fired the first time an operation falls through from credits to wallet billing —
your credit allowance for the period is spent and subsequent operations start
charging USD.

```json
{
  "event": "credits.low",
  "timestamp": "2026-08-06T18:00:00Z",
  "attempt": 1,
  "data": {
    "operation": "generate_image",
    "message": "Credits exhausted, falling back to wallet billing."
  }
}
```

### `credits.depleted`

Fired when credits are spent **and** the wallet cannot cover the operation. That
request already failed with `402 Payment Required`, and so will subsequent ones
until you top up.

```json
{
  "event": "credits.depleted",
  "timestamp": "2026-08-06T22:15:00Z",
  "attempt": 1,
  "data": {
    "operation": "generate_image",
    "needed_usd": 0.0563
  }
}
```

### `billing.charged`

Fired whenever a wallet USD charge succeeds (i.e., credits were not sufficient
and the wallet was used as fallback).

```json
{
  "event": "billing.charged",
  "timestamp": "2026-08-06T14:30:00Z",
  "attempt": 1,
  "data": {
    "operation": "generate_image",
    "amount_usd": 0.0563,
    "method": "wallet"
  }
}
```

::: tip Webhook Configuration
Configure webhook endpoints in your dashboard under **Settings > Webhooks**. All webhook payloads are signed with your webhook secret for verification. See the [Webhooks documentation](/api/webhooks) for setup details.
:::
