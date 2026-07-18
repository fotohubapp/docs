# Guide: Image Generation with the SDK

Generate images from text prompts using 25+ AI models through the official FOTOhub SDKs.

## Prerequisites

- API key from [fotohub.app/settings/api](https://fotohub.app/settings/api)
- Python: `pip install fotohub` — or TypeScript: `npm install fotohub`

---

## Basic Generation

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub()

result = client.generate_image(
    prompt="A serene Japanese garden with cherry blossoms, golden hour lighting",
    model="seedream-5-0-260128",
)

print(result.images[0].url)
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

const result = await client.generateImage({
  prompt: "A serene Japanese garden with cherry blossoms, golden hour lighting",
  model: "seedream-5-0-260128",
});

console.log(result.images[0].url);
```
```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene Japanese garden with cherry blossoms, golden hour lighting",
    "model": "seedream-5-0-260128"
  }'
```
:::

---

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | Text description of the image |
| `model` | string | `seedream-5-0-260128` | AI model ID |
| `negative_prompt` | string | — | What to avoid in the image |
| `aspect_ratio` | string | `1:1` | `1:1`, `16:9`, `9:16`, `4:3`, `3:4` |
| `num_images` | int | 1 | Number of images (1-4) |
| `guidance_scale` | float | varies | Prompt adherence (higher = more literal) |
| `seed` | int | random | Reproducible results |

---

## Choose a Model

| Model | Best for | Credits/image |
|-------|----------|---------------|
| `seedream-5-0-260128` | General purpose, fast | 0.7 |
| `flux-2-0` | Photorealism, text rendering | 2.0 |
| `grok-imagine-2` | Creative, artistic | 1.5 |
| `wan-2-1` | Anime, illustration | 1.0 |
| `google-imagen-4` | High detail, scenes | 3.0 |

See the full [Models Catalog](/api/models) for all available models.

---

## Advanced: Aspect Ratios

```python
# Portrait (social media story)
result = client.generate_image(
    prompt="Fashion model in studio",
    aspect_ratio="9:16",
)

# Landscape (desktop wallpaper)
result = client.generate_image(
    prompt="Mountain panorama at sunrise",
    aspect_ratio="16:9",
)

# Square (avatar, thumbnail)
result = client.generate_image(
    prompt="Abstract geometric pattern",
    aspect_ratio="1:1",
)
```

---

## Advanced: Batch Generation

Generate multiple variations in one call:

::: code-group
```python [Python]
result = client.generate_image(
    prompt="A futuristic city at night",
    model="seedream-5-0-260128",
    num_images=4,
    seed=42,  # reproducible base
)

for i, image in enumerate(result.images):
    print(f"Image {i+1}: {image.url}")
```
```typescript [TypeScript]
const result = await client.generateImage({
  prompt: "A futuristic city at night",
  model: "seedream-5-0-260128",
  numImages: 4,
  seed: 42,
});

result.images.forEach((img, i) => {
  console.log(`Image ${i + 1}: ${img.url}`);
});
```
:::

---

## Advanced: Negative Prompts

Tell the model what to avoid:

```python
result = client.generate_image(
    prompt="Professional headshot, natural lighting, warm tones",
    negative_prompt="blurry, distorted, cartoon, anime, low quality, watermark",
    model="seedream-5-0-260128",
)
```

---

## Advanced: Reproducible Results

Use `seed` for deterministic output:

```python
# Same seed + same prompt = same image
result1 = client.generate_image(prompt="A red rose", seed=12345)
result2 = client.generate_image(prompt="A red rose", seed=12345)
# result1.images[0].url == result2.images[0].url
```

---

## Download & Save

::: code-group
```python [Python]
import httpx

result = client.generate_image(prompt="Mountain landscape")
url = result.images[0].url

# Download the image
response = httpx.get(url)
with open("output.png", "wb") as f:
    f.write(response.content)
```
```typescript [TypeScript]
const result = await client.generateImage({ prompt: "Mountain landscape" });
const url = result.images[0].url;

// Download with fetch
const response = await fetch(url);
const buffer = Buffer.from(await response.arrayBuffer());
await fs.promises.writeFile("output.png", buffer);
```
:::

---

## Error Handling

```python
from fotohub import FotoHub, ValidationError, InsufficientCreditsError

client = FotoHub()

try:
    result = client.generate_image(prompt="test")
except ValidationError as e:
    print(f"Invalid params: {e.message}")
except InsufficientCreditsError:
    print("Not enough credits — top up at fotohub.app/billing")
```

---

## Related

- [Image Generation API Reference](/api/image-generation)
- [Image Editing (inpainting, upscaling)](/api/image-editing)
- [Models Catalog](/api/models)
- [SDK Setup Guide](/guides/sdk-setup)
