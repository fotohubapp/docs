# Pricing & Cost Optimization

Understand how FOTOhub pricing works and how to minimize costs for your use case.

## Pricing Models

FOTOhub offers **dual billing** — pick what fits your workload:

### Credits (Predictable)

Fixed cost per operation. Best for production workloads where you need cost certainty.

```
1 credit = 1 image (Seedream, Seedance)
1 credit = 1 chat response (Gemini Flash)
3 credits = 1 premium image (FLUX 2 Max, Imagen 4)
```

### Tokens (Precise)

Per-token billing for chat/LLM operations. Best for high-volume text workloads.

```
Input:  from 0.0001 PLN/1K tokens (Gemini Flash)
Output: from 0.0004 PLN/1K tokens (Gemini Flash)
```

## Image Generation Costs

| Model | Credits | Quality | Speed |
|-------|---------|---------|-------|
| seedream-5-0-260128 | **1.0** | Excellent | ~2s |
| dola-seedream-5-0-pro | **1.0** | Premium | ~3s |
| flux-2-pro | 1.5 | Excellent | ~4s |
| flux-2-max | 3.5 | Premium | ~8s |
| flux-2-klein-4b | 0.7 | Good | ~1s |
| wan2.5-t2i | 1.0 | Good | ~3s |
| grok-imagine-image | 1.0 | Good | ~5s |
| grok-imagine-image-pro | 3.5 | Premium | ~8s |

::: tip BEST VALUE
**Seedream 5.0** delivers premium quality at 1 credit — the best quality-per-credit on the platform. Use it as your default.
:::

## Video Generation Costs

| Model | Credits | Duration | Quality |
|-------|---------|----------|---------|
| seedance-2-0-fast | **1.0** | 5s | Great |
| seedance-2-0-mini | **1.0** | 5s | Good |
| seedance-2-0-pro | **1.0** | 5s | Premium |
| hailuo | 8.0 | 5s | Premium |
| sora-2-azure | 8.0 | 10s | Premium |
| veo-3.1 | 15.0 | 8s | Premium |
| sora-2-pro | 19.0 | 20s | Premium |

::: tip BEST VALUE
**Seedance 2.0 Fast** = premium video for 1 credit. Start here, upgrade to Pro only if needed.
:::

## Chat / LLM Costs

| Model | Credits/response | Tokens (input/output) |
|-------|-----------------|----------------------|
| gemini-flash | 1.0 | 0.0001 / 0.0004 |
| gpt-4o | 3.0 | 0.005 / 0.015 |
| claude-sonnet-4.6 | 3.0 | 0.003 / 0.015 |
| deepseek-r1 | 2.0 | 0.001 / 0.006 |
| gemini-pro | 2.0 | 0.001 / 0.004 |

## Free Operations

These operations cost **0 credits**:

- Gabriel AI classify/suggest/recommend
- Translation (up to 10K chars)
- Model catalog queries
- Billing/usage queries
- Webhook management

## Cost Optimization Tips

### 1. Use Gabriel AI for Model Selection

Instead of hardcoding expensive models:

```python
route = client.gabriel_classify(
    prompt="Generate a simple product photo",
    context={"credits_remaining": 10}
)
# Gabriel picks the cheapest model that can handle the task
```

### 2. Batch with Bulk Mode

For batch image generation, use bulk mode for 20% savings:

```python
result = client.generate_image(
    prompt="Product photo",
    num_images=4,     # 4 images for 4 credits instead of 4 separate calls
    model="seedream-5-0-260128"
)
```

### 3. Set Hard Spending Limits

Prevent unexpected bills:

```python
client.set_overage_limit(50)  # Max 50 PLN overage per period
```

### 4. Use Fast/Mini Variants for Previews

Generate quick previews with cheap models, then regenerate final output with premium:

```python
# Preview: 1 credit
preview = client.generate_video(prompt="...", model="seedance-2-0-mini")

# Final: still 1 credit but higher quality  
final = client.generate_video(prompt="...", model="seedance-2-0-pro")
```

### 5. Monitor with Usage API

Track spending in real-time:

```python
usage = client.get_balance()
if usage["credits_remaining"] < 10:
    # Alert or switch to cheaper models
    pass
```

## Subscription Tiers

| Tier | Price | Credits/mo | RPM | Best For |
|------|-------|-----------|-----|----------|
| Free (PAYG) | 0 PLN | 50 | 10 | Testing & prototypes |
| Developer | 49 PLN | 500 | 60 | Side projects |
| Startup | 199 PLN | 2500 | 120 | Production apps |
| Business | 499 PLN | 8000 | 300 | Scale |
| Enterprise | Custom | Unlimited | Custom | High-volume |

All tiers include wallet + auto-topup for overages.

## Estimating Costs

Before running operations, use the cost estimator:

```python
estimate = client.estimate_cost([
    {"type": "image", "model": "seedream-5-0-260128", "count": 100},
    {"type": "video", "model": "seedance-2-0-fast", "count": 20},
    {"type": "chat", "model": "gemini-flash", "tokens": 500000},
])
print(f"Estimated: {estimate['total_credits']} credits ({estimate['total_pln']} PLN)")
```
