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

| Model | Input $/1M | Output $/1M |
|-------|------------|-------------|
| Claude Sonnet 4.6 | $3.00 | $15.00 |
| Claude Haiku 4.5 | $0.80 | $4.00 |
| Nova Pro | $0.80 | $3.20 |
| Nova Lite | $0.06 | $0.24 |
| Nova Micro | $0.035 | $0.14 |

## Billing Response

Token-based responses include detailed cost breakdown:

```json
{
  "cost_usd": 0.049152,
  "currency": "USD",
  "billing": {
    "method": "wallet",
    "cost_usd": 0.049152,
    "balance_usd": 39.9508,
    "currency": "USD",
    "cost_breakdown": {
      "output_tokens": 16384,
      "cost_usd": 0.049152,
      "rate_per_1m_tokens_usd": 2.00
    }
  }
}
```

## Verifying Token Billing

Use the SDK to verify billing is correct:

```python
from fotohub import FotoHub

client = FotoHub()

result = client.generate_image(
    prompt="Test image",
    model="seedream-5-0-260128"
)

# Verify token calculation
expected_tokens = (2048 * 2048) / 256  # = 16384
actual_tokens = result.billing.output_tokens

assert actual_tokens == expected_tokens, f"Expected {expected_tokens}, got {actual_tokens}"
print(f"Token billing verified: {actual_tokens} tokens = ${result.billing.cost_breakdown.cost_usd}")
```
