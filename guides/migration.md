# Migration Guide

Switching to FOTOhub from another AI provider? This guide maps your existing code to FOTOhub equivalents.

## From OpenAI (DALL-E / GPT)

### Image Generation

::: code-group

```python [OpenAI (before)]
from openai import OpenAI
client = OpenAI(api_key="sk-...")

response = client.images.generate(
    model="dall-e-3",
    prompt="A sunset over mountains",
    size="1024x1024",
    n=1
)
url = response.data[0].url
```

```python [FOTOhub (after)]
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_...")

result = client.generate_image(
    prompt="A sunset over mountains",
    model="seedream-5-0-260128",  # Better quality, lower cost
    aspect_ratio="1:1"
)
url = result["images"][0]
```

:::

### Chat Completions

FOTOhub is **OpenAI-compatible in message format**, but not in streaming — see
the warning below.

::: code-group

```python [OpenAI (before)]
from openai import OpenAI
client = OpenAI(api_key="sk-...")

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)
```

```python [FOTOhub (after)]
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_...")

# Same message format. chat() returns a plain dict -- index it.
response = client.chat(
    messages=[{"role": "user", "content": "Hello!"}],
    model="gemini-flash",  # or "gemini-pro", "gpt-4o", "claude-sonnet"
)
print(response["choices"][0]["message"]["content"])
print(response["credits_used"])
```

:::

::: warning Streaming does not carry over
`/v1/ai/chat/completions` accepts `stream=True` for drop-in compatibility and
then **ignores it** — you always get one complete JSON body, never
`chat.completion.chunk` frames. An OpenAI-style `for chunk in stream:` loop over
it yields nothing.

The model list is also narrower than the catalogue: exactly `gemini-flash`,
`gemini-pro`, `gpt-4o` and `claude-sonnet`. Anything else (including
`claude-sonnet-4.6`) returns `400`.

To actually stream, switch to `POST /v1/ai/agent/stream`, which uses its own
`type`-keyed frames and its own model IDs. See the
[Streaming Guide](/guides/streaming).
:::

## From Stability AI

::: code-group

```python [Stability (before)]
import requests

response = requests.post(
    "https://api.stability.ai/v2beta/stable-image/generate/core",
    headers={"authorization": f"Bearer sk-..."},
    files={"none": ''},
    data={"prompt": "A lighthouse at dusk", "output_format": "png"}
)
```

```python [FOTOhub (after)]
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_...")

# Stability tools available natively + 20+ other image models
result = client.generate_image(
    prompt="A lighthouse at dusk",
    model="seedream-5-0-260128"  # or "flux-2-pro"
)
```

:::

### Background Removal

```python
# Stability API → FOTOhub (same underlying model, lower price)
result = client.stability_remove_background(image_base64)
```

## From Replicate

::: code-group

```python [Replicate (before)]
import replicate

output = replicate.run(
    "black-forest-labs/flux-pro",
    input={"prompt": "A cat in space", "steps": 25}
)
```

```python [FOTOhub (after)]
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_...")

result = client.generate_image(
    prompt="A cat in space",
    model="flux-2-pro"
)
# Same FLUX model, unified billing, no cold starts
```

:::

## From ElevenLabs (TTS)

```python
# FOTOhub wraps multiple TTS providers under one interface
result = client.generate_speech(
    text="Welcome to FOTOhub!",
    model="google",       # or "elevenlabs"
    voice_id="alloy",
    language="en"
)
print(result["audio_url"])
```

## Key Differences

| Feature | Other Providers | FOTOhub |
|---------|----------------|---------|
| Billing | Per-provider accounts | Single wallet, credits or tokens |
| Models | 1 provider = 1 SDK | 100+ models across 10+ providers, 1 SDK |
| Failover | Manual | Manual — pick another model ID and retry |
| Rate limits | Per-model | Tier-based, shared across all |
| Video polling | Custom implementation | Built-in `wait_for_video()` |
| Model selection | You decide | You decide, or ask `POST /v1/ai/gabriel` for a recommendation |

::: warning There is no automatic failover
Earlier revisions of this table promised an automatic model chain. The public API
does not retry a failed generation against a different model — a provider outage
surfaces as an error on that request. Build retry/fallback into your own client
if you need it.

Gabriel returns a routing *decision* (which model to use); it does not run the
generation. See [Cost Optimization](/guides/cost-optimization) for the real
request shape.
:::

## Migration Checklist

- [ ] Create FOTOhub account at [fotohub.app](https://fotohub.app)
- [ ] Generate an API key in Console → Keys
- [ ] Install SDK: `pip install fotohub` or `npm install fotohub`
- [ ] Replace provider-specific API calls with FOTOhub equivalents
- [ ] Set up webhooks for async operations (video, 3D)
- [ ] Configure spending limits in Console → Billing
- [ ] Test with sandbox key (`fh_test_...`) before going live
