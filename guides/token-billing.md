# Token-Based Billing

Some models (SeedDream, Bedrock LLMs) use token-based billing where cost scales with actual usage rather than fixed credits.

## How It Works

### Image Tokens (SeedDream)

SeedDream models generate at native resolution regardless of requested size. Cost is based on output pixels:

```
output_tokens = (native_width × native_height) / 256
cost_pln = (tokens / 1,000,000) × rate_usd × 4.0 × 1.5
```

**Example: SeedDream 5.0 Lite**

| Request Size | Native Size | Tokens | Cost (PLN) |
|-------------|-------------|--------|------------|
| 512×512 | 2048×2048 | 16,384 | ~0.20 |
| 1024×1024 | 2048×2048 | 16,384 | ~0.20 |
| 1024×1536 | 2048×2048 | 16,384 | ~0.20 |

::: info
SeedDream 5.0 always generates at 2048×2048 native resolution, then downscales to requested size. This means cost is constant regardless of requested dimensions.
:::

### Rate

| Model | Rate (USD/1M tokens) |
|-------|---------------------|
| SeedDream 5.0 Lite | $2.00 |
| SeedDream 5.0 Pro (Dola) | $2.70 |
| SeedDream 4.5 | $2.40 |
| SeedDream 4.0 | $1.80 |

### LLM Tokens (Bedrock)

Bedrock models bill per input + output token separately:

```
cost = (input_tokens × input_rate) + (output_tokens × output_rate)
cost_pln = cost_usd × 4.0 × 1.5
```

| Model | Input $/1M | Output $/1M |
|-------|------------|-------------|
| Claude Sonnet 4.6 | $3.00 | $15.00 |
| Claude Haiku 4.5 | $0.80 | $4.00 |
| Nova Pro | $0.80 | $3.20 |
| Nova Lite | $0.25 | $1.00 |
| Nova Micro | $0.10 | $0.40 |

## Billing Response

Token-based responses include detailed cost breakdown:

```json
{
  "billing": {
    "method": "token",
    "credits_used": 2,
    "pln_charged": 0,
    "cost_breakdown": {
      "output_tokens": 16384,
      "cost_usd": 0.033,
      "cost_pln": 0.20,
      "rate_per_1m_tokens_usd": 2.00
    }
  }
}
```

## Verifying Token Billing

Use the SDK to verify billing is correct:

```python
from fotohub import FotohubClient

client = FotohubClient()

result = client.generate_image(
    prompt="Test image",
    model="seedream-5-0-260128"
)

# Verify token calculation
expected_tokens = (2048 * 2048) / 256  # = 16384
actual_tokens = result.billing.output_tokens

assert actual_tokens == expected_tokens, f"Expected {expected_tokens}, got {actual_tokens}"
print(f"Token billing verified: {actual_tokens} tokens = {result.billing.cost_pln} PLN")
```
