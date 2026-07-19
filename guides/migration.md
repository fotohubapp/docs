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

FOTOhub is **OpenAI-compatible** — same message format, same streaming behavior:

::: code-group

```python [OpenAI (before)]
from openai import OpenAI
client = OpenAI(api_key="sk-...")

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
    stream=True
)
for chunk in response:
    print(chunk.choices[0].delta.content, end="")
```

```python [FOTOhub (after)]
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_...")

# Same message format, same streaming pattern
stream = client.chat(
    messages=[{"role": "user", "content": "Hello!"}],
    model="gemini-flash",  # or "claude-sonnet-4.6", "gpt-4o"
    stream=True
)
for chunk in stream:
    print(chunk["choices"][0]["delta"].get("content", ""), end="")
```

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
| Models | 1 provider = 1 SDK | 200+ models, 1 SDK |
| Failover | Manual | Automatic (model chain) |
| Rate limits | Per-model | Tier-based, shared across all |
| Video polling | Custom implementation | Built-in `wait_for_video()` |
| Model selection | You decide | Gabriel AI recommends optimal |

## Migration Checklist

- [ ] Create FOTOhub account at [fotohub.app](https://fotohub.app)
- [ ] Generate an API key in Console → Keys
- [ ] Install SDK: `pip install fotohub` or `npm install fotohub`
- [ ] Replace provider-specific API calls with FOTOhub equivalents
- [ ] Set up webhooks for async operations (video, 3D)
- [ ] Configure spending limits in Console → Billing
- [ ] Test with sandbox key (`fh_test_...`) before going live
