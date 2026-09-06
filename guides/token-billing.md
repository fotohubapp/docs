# Token-Based Billing

Some models (SeedDream image models, premium FOTOhub AI chat models) use token-based billing where cost scales with actual output/token usage charged directly to your prepaid USD wallet.

## How It Works

### Image Tokens (SeedDream)

SeedDream models generate at native resolution regardless of requested size. Cost is based on output pixels:

```
output_tokens = (native_width × native_height) / 256
cost_usd = (output_tokens / 1,000,000) × rate_per_1m_usd × 1.5
```

**Example: SeedDream 5.0 Lite**

| Request Size | Native Size | Tokens | Cost (USD) |
|-------------|-------------|--------|------------|
| 512×512 | 2048×2048 | 16,384 | ~$0.0492 |
| 1024×1024 | 2048×2048 | 16,384 | ~$0.0492 |
| 1024×1536 | 2048×2048 | 16,384 | ~$0.0492 |

::: info
SeedDream 5.0 always generates at 2048×2048 native resolution, then downscales to requested size. This means cost is constant regardless of requested dimensions.
:::

### Rate

Rates below are the provider rate per 1M output tokens. Your charge is this
rate × 1.5 (platform margin), billed in USD from your wallet.

| Model | Rate (USD/1M tokens) | Cost at 2K (16,384 tokens) |
|-------|---------------------|----------------------------|
| SeedDream 5.0 Lite | $2.00 | $0.0492 |
| SeedDream 5.0 Pro (Dola) | $3.50 | $0.0860 |
| SeedDream 4.5 | $2.50 | $0.0614 |
| SeedDream 4.0 | $2.00 | $0.0492 |
| SeedEdit 3.0 (image-to-image) | $2.50 | $0.0614 |

### LLM Tokens (Premium Chat Models)

Premium chat models bill per input + output token separately:

```
cost_usd = ((input_tokens / 1M × input_rate) + (output_tokens / 1M × output_rate)) × 1.5
```
...
```

**Replacement Block:**
```markdown
# Token & Native Meter Billing

Some models (Seedream 5.0 Pro, Seedance video, and LLM chat models) use native provider meter billing where cost scales with actual input/output usage charged directly to your prepaid USD wallet.

## Platform Margin

**Margin is 1.0 (1:1 pass-through).** FOTOhub bills exact provider list prices directly to your prepaid USD wallet without hidden multipliers or surcharges.

## How It Works

### BytePlus Seedream 5.0 Pro (Per-Piece Pricing)

Unlike legacy models priced by tokens, BytePlus bills **Seedream 5.0 Pro (`dola-seedream-5-0-pro-260628`)** as a two-leg **per-piece** rate:
- **Input Leg:** $0.0030 per image
- **Output Leg:** $0.0450 per image for resolutions $\le$ 2.61 MP (10,195 tokens)
- **High-Resolution Output Leg:** $0.0900 per image for resolutions > 2.61 MP

$$\text{Total Cost (Standard 1K/2K)} = \$0.0030 + \$0.0450 = \mathbf{\$0.0480}$$

### Flat-Rated SeedDream Models

Other models in the SeedDream family are flat-rated per delivered image across 1K/2K/4K:
| Model ID | Name | Cost (USD) | Meter |
|----------|------|-----------:|-------|
| `seedream-4-0-250828` | SeedDream 4.0 | $0.030 | per piece |
| `seededit-3-0-i2i-250628` | SeedEdit 3.0 | $0.030 | per piece |
| `seedream-5-0-260128` | SeedDream 5.0 | $0.0315 | per piece |
| `seedream-4-5-251128` | SeedDream 4.5 | $0.036 | per piece |
| `dola-seedream-5-0-pro-260628` | SeedDream 5.0 Pro | $0.048 / $0.093 | per piece ($0.003 in + $0.045/$0.090 out) |

### LLM Tokens (Chat Models)

LLM completions bill input and output tokens separately at 1:1 provider rates (no multiplier):

```
cost_usd = (input_tokens / 1,000,000 × input_rate) + (output_tokens / 1,000,000 × output_rate)
```

| Model | Input $/1M | Output $/1M |
|-------|-----------:|------------:|
| Claude Sonnet 4.6 | $3.00 | $15.00 |
| Claude Haiku 4.5 | $0.80 | $4.00 |
| Nova Pro | $0.80 | $3.20 |
| Nova 2 Lite | $0.04 | $0.16 |
| Nova Micro | $0.035 | $0.14 |
| Gemini 2.5 Flash | $0.30 | $2.50 |
| Gemini 2.5 Pro | $1.25 | $10.00 |

## Billing Response

Responses include a complete USD breakdown:

```json
{
  "currency": "USD",
  "billing": {
    "method": "wallet",
    "usd_charged": 0.048,
    "balance_usd": 49.952,
    "currency": "USD",
    "breakdown": [
      {
        "leg": "input",
        "unit": "per_piece",
        "quantity": 1,
        "rate_usd": 0.003,
        "amount_usd": 0.003
      },
      {
        "leg": "output",
        "unit": "per_piece",
        "quantity": 1,
        "rate_usd": 0.045,
        "amount_usd": 0.045
      }
    ]
  }
}
```
