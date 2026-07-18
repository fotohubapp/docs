# Quickstart Guide

Get up and running with FOTOhub in under 5 minutes.

## 1. Create an Account

Sign up at [fotohub.app](https://fotohub.app). You get **50 free credits** on the Free tier (refreshed monthly).

## 2. Generate an API Key

Go to [Console → Keys](https://fotohub.app/console/keys) and create a new key:

1. Click **Create Key**
2. Name it (e.g., "My First Key")
3. Copy the key — it's shown only once

Your key looks like: `fh_live_sk2Kj8mN4pQ7rT1vX3yZ5bD9fH2gL6wA0cE4`

## 3. Make Your First Call

```bash
export FOTOHUB_API_KEY="fh_live_your_key_here"

curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedream-5-0-260128",
    "prompt": "A cute robot reading a book in a cozy library, digital art",
    "aspect_ratio": "1:1"
  }'
```

## 4. Install the SDK

::: code-group

```bash [Python]
pip install fotohub-sdk
```

```bash [TypeScript]
npm install @fotohub/sdk
```

:::

## 5. Use the SDK

```python
from fotohub import FotohubClient

client = FotohubClient()  # reads FOTOHUB_API_KEY env var

# Generate an image
result = client.generate_image(
    prompt="A cute robot reading a book in a cozy library, digital art",
    model="seedream-5-0-260128"
)
print(f"Image: {result.images[0]}")
print(f"Cost: {result.billing.cost_pln} PLN")

# Check balance
balance = client.get_balance()
print(f"Credits remaining: {balance.credits.remaining_period}")
```

## 6. Set Up Webhooks (Optional)

Get notified when generations complete:

1. Go to [Console → Webhooks](https://fotohub.app/console/webhooks)
2. Create a webhook with your server URL
3. Select events: `generation.completed`
4. Save the secret for signature verification

## What's Next?

- [Image Generation](/api/image-generation) — Explore 25+ models
- [Video Generation](/api/video-generation) — Create AI videos
- [Billing](/api/billing) — Understand pricing
- [Python SDK](/sdk/python) — Full SDK reference
