# FOTOhub vs Other Providers

Side-by-side comparison of FOTOhub with common AI API providers.

## Feature Comparison

| Feature | FOTOhub | Replicate | Stability | OpenAI | fal.ai |
|---------|---------|-----------|-----------|--------|--------|
| Image models | 25+ | 50+ | 5 | 2 | 30+ |
| Video models | 15+ | 10+ | 1 | 1 | 10+ |
| Music generation | Yes | Limited | No | No | No |
| 3D generation | Yes | Limited | No | No | Limited |
| Chat/LLM | Yes | No | No | Yes | No |
| Unified billing | Yes | Yes | Yes | Yes | Yes |
| Fixed-price credits | Yes | No | Yes | No | No |
| Auto-failover | Yes | No | No | No | No |
| Gabriel AI routing | Yes | No | No | No | No |
| EU data residency | Yes | No | No | No | No |
| Self-hosted option | Yes | No | No | No | No |
| Webhooks | Yes | Yes | No | No | Yes |
| SDK languages | 3 | 2 | 2 | 4 | 2 |
| Free tier | 50 cr/mo | No | No | $5 once | No |

## Price Comparison

Generating a single 1024x1024 image:

| Provider | Model | Cost | Speed |
|----------|-------|------|-------|
| **FOTOhub** | Seedream 5.0 | ~0.15 PLN (1 cr) | ~2s |
| **FOTOhub** | FLUX 2 Pro | ~0.23 PLN (1.5 cr) | ~4s |
| Replicate | FLUX Pro | ~$0.055 (~0.22 PLN) | ~5s |
| Stability | SD3 Medium | $0.035 (~0.14 PLN) | ~3s |
| OpenAI | DALL-E 3 | $0.040 (~0.16 PLN) | ~8s |
| fal.ai | FLUX Pro | $0.050 (~0.20 PLN) | ~4s |

::: info
FOTOhub is competitive on price and often faster due to EU-local inference. Seedream models offer the best quality-per-PLN.
:::

## Video Generation (5s clip)

| Provider | Model | Cost | Quality |
|----------|-------|------|---------|
| **FOTOhub** | Seedance 2.0 Fast | ~0.15 PLN (1 cr) | Great |
| **FOTOhub** | Veo 3.1 | ~2.25 PLN (15 cr) | Premium |
| Replicate | Kling | ~$0.30 (~1.20 PLN) | Good |
| Runway | Gen-3 | ~$0.50 (~2.00 PLN) | Premium |
| Luma | Dream Machine | ~$0.30 (~1.20 PLN) | Good |

## Why Choose FOTOhub

### 1. One Integration, All Models

Instead of maintaining 5 provider accounts with different SDKs, auth systems, and billing:

```python
# Before: 5 SDKs, 5 API keys, 5 billing dashboards
from openai import OpenAI
from stability_sdk import client as stability
import replicate
from elevenlabs import ElevenLabs
from anthropic import Anthropic

# After: 1 SDK, 1 API key, 1 dashboard
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_...")
```

### 2. Automatic Model Failover

If a provider is down, FOTOhub automatically routes to an alternative:

```
seedream-5-0 (primary) → flux-2-pro (fallback) → wan2.5 (last resort)
```

Your users never see errors — they get a result from the next best model.

### 3. EU Data Residency

All data processed and stored in `eu-central-1` (Frankfurt). No data leaves the EU unless you explicitly use a US-only model.

### 4. Gabriel AI — Smart Routing

Don't know which model to use? Let Gabriel decide:

```python
result = client.gabriel_classify(
    prompt="I need a professional headshot",
    enhance_prompt=True
)
# → Routes to seedream-5-0 with optimized prompt + quality tips
```

### 5. Predictable Pricing

Credits-based billing means you know exactly what each operation costs. No surprise bills from token overages or cold-start charges.

## Migration is Easy

See our [Migration Guide](/guides/migration) for code-level mappings from OpenAI, Stability, Replicate, and ElevenLabs to FOTOhub equivalents. Most migrations take under 30 minutes.
