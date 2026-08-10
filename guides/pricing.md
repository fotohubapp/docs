# Pricing & Cost Optimization

Understand how FOTOhub pricing works and how to minimize costs for your use case.

## Pricing Models

FOTOhub offers **dual billing** — pick what fits your workload:

### Credits (Predictable)

Fixed cost per operation. Best for production workloads where you need cost certainty.

```
2 credits = 1 image (Seedream, FLUX Pro)
5 credits = 1 premium image (Imagen 4 Ultra)
```

Chat is the exception: it bills per token, in fractions of a credit. See
[Chat / LLM Costs](#chat-llm-costs) below.

### Tokens (Precise)

Per-token billing for chat/LLM operations. Best for high-volume text workloads.

```
from $0.0001 per 1K tokens (Gemini Flash, blended input + output)
```

## Image Generation Costs

| Model | Credits | Quality | Speed |
|-------|---------|---------|-------|
| flux-2-klein-4b | **1.0** | Good | ~2s |
| minimax-image-01 | **1.0** | Good | ~2s |
| grok-imagine-image | **1.0** | Good (1K) | ~5s |
| gemini-3.1-flash-lite-image | **1.0** | Good (Nano Banana 2 Lite, budget/fast) | ~2s |
| seedream-5-0-260128 | 2.0 | Excellent | ~2s |
| flux-2-pro | 2.0 | Excellent | ~4s |
| flux-1.1-pro | 2.0 | Excellent | ~4s |
| flux-kontext-pro | 2.0 | Excellent (editing) | ~4s |
| gemini-2.5-flash-image | 2.0 | Excellent (Nano Banana, up to 10 reference images) | ~3s |
| imagen-4-standard | 3.0 | Premium | ~4s |
| grok-imagine-image-pro | 3.0 | Premium (2K, multi-image) | ~8s |
| gemini-3.1-flash-image | 3.0 | Premium (Nano Banana 2, GA) | ~4s |
| gemini-3.1-flash-image-preview | 3.0 | Premium (Nano Banana 2, preview channel) | ~4s |
| imagen-4-ultra | 5.0 | Premium (4K) | ~6s |
| gemini-3-pro-image | 6.0 | Premium (Nano Banana Pro, 1K/2K/4K, advanced reasoning + precise text) | ~8s |

::: tip BEST VALUE
**`seedream-5-0-260128`** delivers premium quality at 2 credits — the best quality-per-credit on the platform. Use it as your default.
:::

## Video Generation Costs

Most video models bill per-second (`credits/s × duration`); MiniMax Hailuo bills a flat per-video amount instead. Per-second pricing for the most commonly used model per provider (see the [full catalog](/api/models#video-generation-models) for every variant):

| Model | ID | Credits/s | Provider | Notes |
|-------|-----|:---------:|----------|-------|
| Wan 2.2 Plus | `wan2.2-t2v-plus` | 1.2 | Alibaba | cheapest tier |
| Seedance 2.0 Mini | `seedance-2-0-mini` | 2.8 | ByteDance | budget |
| Kling v2.5 Turbo | `kling-v2-5-turbo` | 1.6 | Kuaishou | |
| Hailuo O2 | `hailuo-o2` | — | MiniMax | 6 credits flat, per video |
| **Google Veo 3.1** | `veo-3.1-generate-001` | **12** | Google | native audio, up to 4K |
| Gemini Omni Flash | `gemini-omni-flash` | 6 | Google | native audio, T2V+I2V |
| OpenAI Sora 2 | `sora-2` | 8 | OpenAI | |
| Grok Video 1.5 | `grok-imagine-video-1.5` | 9 | xAI | lip-sync |
| Seedance 2.5 | `seedance-2-5` | 14.5 (720p) / 6.4 (480p) | ByteDance | up to 30s in one clip, audio included |

::: tip BEST VALUE
**`wan2.2-t2v-plus`** / **`hailuo-o2`** = lowest cost per second with solid quality for social content. Step up to **`veo-3.1-generate-001`** for cinematic output with native audio, or **`gemini-omni-flash`** for automatic native audio at a lower per-second rate.
:::

::: info Long clips
`seedance-2-5` is the only model that reaches 30 seconds in a single request
(`14.5 × 30 = 435 credits` at 720p). Draft at 480p first — the same shot is 6.4
credits/s there, so a 5-second test costs 32 credits instead of 435. Native audio
is included at both resolutions; attaching a source video raises the rate to 17.6
credits/s at 720p because the input frames bill too.
:::

## Chat / LLM Costs

The chat endpoint (`/v1/ai/chat/completions`) bills the tokens you actually use,
in credits, and the charge is fractional — a short reply costs a fraction of one
credit. Output tokens cost 4-8x input, so the two are rated separately.

| Model | Credits/1M in | Credits/1M out |
|-------|--------------:|---------------:|
| `gemini-flash` | 20 | 166.7 |
| `gemini-pro` | 83 | 667 |
| `gpt-4o` | 200 | 1000 |
| `claude-sonnet` | 200 | 1000 |

A 75-token prompt with a 150-token answer is 0.026 credits on `gemini-flash`.
For billing in USD with a per-request `cost_breakdown`, use the premium endpoint
(`/v1/ai/chat/claude`). See the [Chat/LLM reference](/api/chat-llm).

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
client.set_overage_limit(15)  # Max $15 overage per calendar month
```

### 4. Use Budget Variants for Previews

Generate quick previews with cheaper models, then regenerate final output with premium:

```python
# Preview: budget model (1.2 credits/s)
preview = client.generate_video(prompt="...", model="wan2.2-t2v-plus")

# Final: cinematic quality with native audio (12 credits/s)
final = client.generate_video(prompt="...", model="veo-3.1-generate-001")
```

### 5. Monitor with Usage API

Track spending in real-time:

```python
balance = client.get_balance()
if balance["credits"]["remaining_period"] < 10:
    # Alert or switch to cheaper models
    pass
```

## Subscription Tiers

| Tier | Price | Credits/mo | RPM | Best For |
|------|-------|-----------|-----|----------|
| Free (PAYG) | 0 PLN | 50 | 10 | Testing & prototypes |
| Developer | 49 PLN | 500 | 60 | Side projects |
| Startup | 199 PLN | 5000 | 300 | Production apps |
| Business | 799 PLN | 25000 | 1000 | Scale |
| Enterprise | Custom | Unlimited | Custom | High-volume |

API subscription plans are billed in PLN. Everything else — the wallet,
per-request overage billing and top-ups — is USD.

All tiers include wallet + auto-topup for overages.

## Estimating Costs

Before running operations, use the cost estimator:

```python
estimate = client.estimate_cost([
    {"type": "image", "model": "seedream-5-0-260128", "count": 100},
    {"type": "video", "model": "veo-3.1-generate-001", "count": 20},
    {"type": "chat", "model": "gemini-flash", "tokens": 500000},
])
print(f"Estimated: {estimate['total_credits']} credits (${estimate['total_usd']})")
```
