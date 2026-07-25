# Guide: Image Generation with the SDK

Generate images from text prompts using 25+ AI models through the official FOTOhub SDKs.

::: info Getting Started
Image generation is synchronous — you get results immediately (1-15 seconds depending on model). For batch workflows processing 10+ images, see the [Batch Processing Guide](/guides/batch-processing).
:::

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
```go [Go]
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
)

func main() {
    payload, _ := json.Marshal(map[string]interface{}{
        "prompt": "A serene Japanese garden with cherry blossoms, golden hour lighting",
        "model":  "seedream-5-0-260128",
    })

    req, _ := http.NewRequest("POST",
        "https://apis.fotohub.app/v1/ai/generate/image",
        bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    images := result["images"].([]interface{})
    url := images[0].(string)
    fmt.Println(url)
}
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
| `image_url` | string | — | Reference image for editing/i2i |
| `image_urls` | string[] | — | Multiple reference images (Grok Imagine Pro) |

---

## Choose a Model

| Model | Best for | Speed | Credits/image |
|-------|----------|-------|---------------|
| `seedream-5-0-260128` | General purpose, fast | 2-4s | 1.0 |
| `flux-2-pro` | Photorealism, text rendering | 5-8s | 1.5 |
| `grok-imagine-image` | Fast budget generation (1K) | 2-3s | 1.0 |
| `grok-imagine-image-pro` | Multi-image, virtual try-on (2K) | 8-12s | 3.0 |
| `flux-2-max` | Illustration, anime, stylized art | 6-10s | 3.0 |
| `imagen-4-standard` | High detail, complex scenes | 6-10s | 3.0 |
| `imagen-4-ultra` | Maximum quality, fine detail | 10-15s | 5.0 |
| `gemini-3-pro-image` | Complex/precise prompts, in-image text rendering (up to 4K) | 8-14s | 6.0 |

See the full [Models Catalog](/api/models) for all available models.

---

## Prompt Engineering

The quality of your prompt directly determines output quality. Follow these principles:

### Structure Your Prompts

Use this template for consistent results:

```
[Subject] + [Setting/Environment] + [Style/Medium] + [Lighting] + [Camera/Composition]
```

Examples:

| Template Part | Good | Avoid |
|--------------|------|-------|
| Subject | "A tabby cat sitting on a velvet cushion" | "A cat" |
| Setting | "in a Victorian library with floor-to-ceiling bookshelves" | "in a room" |
| Style | "oil painting style, impasto brushstrokes" | "nice looking" |
| Lighting | "warm candlelight, golden hour shadows" | "good lighting" |
| Composition | "close-up portrait, shallow depth of field" | (omitting it) |

### Prompt Length Sweet Spot

| Prompt length | Result quality | Use case |
|--------------|---------------|----------|
| 5-15 words | Basic, often generic | Quick tests |
| 30-60 words | Optimal detail balance | Production use |
| 60-120 words | Very specific, may over-constrain | Complex scenes |
| 120+ words | Diminishing returns, model may ignore parts | Avoid |

### Power Words by Category

**Photorealism:**
`photorealistic, 8K, raw photo, DSLR, Canon EOS R5, 85mm lens, bokeh, natural lighting, subsurface scattering`

**Illustration:**
`digital art, concept art, matte painting, trending on ArtStation, highly detailed, intricate`

**Cinematic:**
`cinematic still, anamorphic lens, film grain, color grading, dramatic lighting, wide angle`

**Product:**
`product photography, studio lighting, white background, soft shadows, commercial, catalog shot`

---

## Style Consistency Across Images

When generating multiple images for a project (e.g., a brand campaign or storyboard), maintain visual consistency:

### Method 1: Seed Locking

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub()

# Base style seed — all variations will share visual DNA
BASE_SEED = 42857

scenes = [
    "Hero arriving at the castle gates",
    "Hero exploring the throne room",
    "Hero confronting the dragon",
]

results = []
for scene in scenes:
    result = client.generate_image(
        prompt=f"Fantasy illustration, cel-shaded style, vibrant colors. Scene: {scene}",
        model="seedream-5-0-260128",
        seed=BASE_SEED,
        guidance_scale=7.5,
    )
    results.append(result)
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

const BASE_SEED = 42857;

const scenes = [
  "Hero arriving at the castle gates",
  "Hero exploring the throne room",
  "Hero confronting the dragon",
];

const results = await Promise.all(
  scenes.map((scene) =>
    client.generateImage({
      prompt: `Fantasy illustration, cel-shaded style, vibrant colors. Scene: ${scene}`,
      model: "seedream-5-0-260128",
      seed: BASE_SEED,
      guidanceScale: 7.5,
    })
  )
);
```
```go [Go]
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
)

func main() {
    baseSeed := 42857
    scenes := []string{
        "Hero arriving at the castle gates",
        "Hero exploring the throne room",
        "Hero confronting the dragon",
    }

    for _, scene := range scenes {
        payload, _ := json.Marshal(map[string]interface{}{
            "prompt":         fmt.Sprintf("Fantasy illustration, cel-shaded style, vibrant colors. Scene: %s", scene),
            "model":          "seedream-5-0-260128",
            "seed":           baseSeed,
            "guidance_scale": 7.5,
        })

        req, _ := http.NewRequest("POST",
            "https://apis.fotohub.app/v1/ai/generate/image",
            bytes.NewBuffer(payload))
        req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
        req.Header.Set("Content-Type", "application/json")

        resp, _ := http.DefaultClient.Do(req)
        resp.Body.Close()
        fmt.Printf("Generated: %s\n", scene)
    }
}
```
```bash [cURL]
# Generate consistent style across multiple scenes
for SCENE in "Hero arriving at the castle gates" "Hero exploring the throne room" "Hero confronting the dragon"; do
  curl -s -X POST https://apis.fotohub.app/v1/ai/generate/image \
    -H "Authorization: Bearer $FOTOHUB_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"prompt\": \"Fantasy illustration, cel-shaded style, vibrant colors. Scene: $SCENE\",
      \"model\": \"seedream-5-0-260128\",
      \"seed\": 42857,
      \"guidance_scale\": 7.5
    }" | jq -r '.images[0].url'
done
```
:::

### Method 2: Style Prefix Template

Create a reusable style prefix and prepend to all prompts:

```python
# Define your brand style once
BRAND_STYLE = (
    "Minimalist flat illustration, muted pastel palette (dusty rose, sage green, cream), "
    "clean geometric shapes, subtle paper texture, no outlines, modern editorial style. "
)

# Apply to all generations
scenes = {
    "hero": "Person working at a standing desk with a laptop",
    "features": "Three floating cards showing app features",
    "testimonial": "Happy customer holding a phone with the app open",
}

for name, scene in scenes.items():
    result = client.generate_image(
        prompt=BRAND_STYLE + scene,
        model="seedream-5-0-260128",
        aspect_ratio="16:9",
    )
    print(f"{name}: {result.images[0].url}")
```

### Method 3: Reference Image (Grok Imagine Pro)

Use a reference image to maintain exact style:

```python
# Generate first image to establish style
reference = client.generate_image(
    prompt="Minimalist product packaging, pastel colors, clean design",
    model="seedream-5-0-260128",
)

# Use it as reference for subsequent images
for product in ["headphones", "watch", "phone case"]:
    result = client.generate_image(
        prompt=f"Same minimalist packaging style, {product} product box",
        model="grok-imagine-image-pro",
        image_url=reference.images[0].url,  # Style reference
    )
```

---

## Aspect Ratios and Resolution

### Available Aspect Ratios

| Ratio | Pixels (approx) | Use case |
|-------|-----------------|----------|
| `1:1` | 1024x1024 | Avatars, thumbnails, social posts |
| `16:9` | 1365x768 | Desktop wallpapers, YouTube thumbnails |
| `9:16` | 768x1365 | Stories, Reels, TikTok, mobile |
| `4:3` | 1182x886 | Presentations, traditional photos |
| `3:4` | 886x1182 | Portraits, book covers, Pinterest |

### Resolution Tips

::: code-group
```python [Python]
# Portrait for Instagram Story
result = client.generate_image(
    prompt="Fashion model in studio, full body shot",
    model="seedream-5-0-260128",
    aspect_ratio="9:16",
)

# Landscape for website hero
result = client.generate_image(
    prompt="Mountain panorama at golden hour, dramatic clouds",
    model="seedream-5-0-260128",
    aspect_ratio="16:9",
)

# Square for product thumbnail
result = client.generate_image(
    prompt="Minimalist watch on marble surface, top-down",
    model="seedream-5-0-260128",
    aspect_ratio="1:1",
)
```
```typescript [TypeScript]
// Portrait for Instagram Story
const story = await client.generateImage({
  prompt: "Fashion model in studio, full body shot",
  model: "seedream-5-0-260128",
  aspectRatio: "9:16",
});

// Landscape for website hero
const hero = await client.generateImage({
  prompt: "Mountain panorama at golden hour, dramatic clouds",
  model: "seedream-5-0-260128",
  aspectRatio: "16:9",
});

// Square for product thumbnail
const thumb = await client.generateImage({
  prompt: "Minimalist watch on marble surface, top-down",
  model: "seedream-5-0-260128",
  aspectRatio: "1:1",
});
```
```go [Go]
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
    "os"
)

func generateWithAspect(prompt, aspect string) {
    payload, _ := json.Marshal(map[string]string{
        "prompt":       prompt,
        "model":        "seedream-5-0-260128",
        "aspect_ratio": aspect,
    })
    req, _ := http.NewRequest("POST",
        "https://apis.fotohub.app/v1/ai/generate/image",
        bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    req.Header.Set("Content-Type", "application/json")
    http.DefaultClient.Do(req)
}

func main() {
    generateWithAspect("Fashion model in studio", "9:16")   // Story
    generateWithAspect("Mountain panorama at golden hour", "16:9") // Hero
    generateWithAspect("Minimalist watch, top-down", "1:1")  // Thumbnail
}
```
```bash [cURL]
# Portrait for Stories
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Fashion model in studio", "model": "seedream-5-0-260128", "aspect_ratio": "9:16"}'

# Landscape for hero
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Mountain panorama", "model": "seedream-5-0-260128", "aspect_ratio": "16:9"}'
```
:::

---

## Batch Generation

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
```go [Go]
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
)

func main() {
    payload, _ := json.Marshal(map[string]interface{}{
        "prompt":     "A futuristic city at night",
        "model":      "seedream-5-0-260128",
        "num_images": 4,
        "seed":       42,
    })
    req, _ := http.NewRequest("POST",
        "https://apis.fotohub.app/v1/ai/generate/image",
        bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    req.Header.Set("Content-Type", "application/json")
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    images := result["images"].([]interface{})
    for i, img := range images {
        url := img.(string)
        fmt.Printf("Image %d: %s\n", i+1, url)
    }
}
```
```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic city at night",
    "model": "seedream-5-0-260128",
    "num_images": 4,
    "seed": 42
  }' | jq '.images[].url'
```
:::

---

## Negative Prompts

Tell the model what to avoid. Negative prompts work best with models that have a guidance_scale parameter:

```python
result = client.generate_image(
    prompt="Professional headshot, natural lighting, warm tones, sharp focus",
    negative_prompt="blurry, distorted, cartoon, anime, low quality, watermark, "
                    "oversaturated, plastic skin, bad anatomy, extra fingers",
    model="seedream-5-0-260128",
    guidance_scale=8.0,
)
```

### Common Negative Prompt Templates

| Use case | Negative prompt |
|----------|----------------|
| Photorealism | `cartoon, anime, drawing, painting, illustration, 3d render, CGI` |
| Product photos | `blurry, low quality, watermark, text, busy background, shadows` |
| Portraits | `bad anatomy, extra fingers, mutated hands, deformed face, cross-eyed` |
| Landscapes | `people, text, watermark, frame, border, signature` |

---

## Guidance Scale Tuning

The `guidance_scale` parameter controls how strictly the model follows your prompt:

| Value | Effect | Best for |
|-------|--------|----------|
| 1-3 | Very creative, loose interpretation | Abstract art, surprises |
| 5-7 | Balanced (default for most models) | General use |
| 8-12 | Strict prompt adherence | Technical accuracy, specific requests |
| 12-20 | Over-constrained, may look unnatural | Avoid for most cases |

```python
# Creative/abstract (low guidance)
abstract = client.generate_image(
    prompt="Emotional landscape of solitude",
    guidance_scale=3.0,
)

# Precise technical (high guidance)
technical = client.generate_image(
    prompt="Isometric 3D icon of a blue folder, flat shading, white background",
    guidance_scale=10.0,
)
```

---

## Reproducible Results

Use `seed` for deterministic output:

```python
# Same seed + same prompt + same model = same image
result1 = client.generate_image(prompt="A red rose", seed=12345, model="seedream-5-0-260128")
result2 = client.generate_image(prompt="A red rose", seed=12345, model="seedream-5-0-260128")
# result1.images[0].url == result2.images[0].url
```

::: tip Seed Exploration
Generate with `num_images=4` (no seed) to explore variations, then lock the seed of your favorite for consistent output.
:::

---

## xAI Grok Imagine — Image Editing & Multi-Image

Grok Imagine Pro supports editing with up to 3 reference images — perfect for product composites, virtual try-on, and architectural visualization.

### Single Image Edit

::: code-group
```python [Python]
# Edit a product photo — change context/background
result = client.generate_image(
    prompt="Product displayed in a modern minimalist kitchen, marble countertop, natural light",
    model="grok-imagine-image-pro",
    image_url="https://example.com/my-product.jpg",
    aspect_ratio="3:4",
)
```
```typescript [TypeScript]
const result = await client.generateImage({
  prompt: "Product displayed in a modern minimalist kitchen, marble countertop, natural light",
  model: "grok-imagine-image-pro",
  imageUrl: "https://example.com/my-product.jpg",
  aspectRatio: "3:4",
});
```
```go [Go]
payload, _ := json.Marshal(map[string]interface{}{
    "prompt":       "Product displayed in a modern minimalist kitchen, marble countertop, natural light",
    "model":        "grok-imagine-image-pro",
    "image_url":    "https://example.com/my-product.jpg",
    "aspect_ratio": "3:4",
})
// ... standard request setup
```
```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Product displayed in a modern minimalist kitchen, marble countertop, natural light",
    "model": "grok-imagine-image-pro",
    "image_url": "https://example.com/my-product.jpg",
    "aspect_ratio": "3:4"
  }'
```
:::

### Multi-Image Combine (up to 3 references)

```python
# Combine multiple product images into one listing
result = client.generate_image(
    prompt="All products arranged in elegant flat-lay, white background, e-commerce style",
    model="grok-imagine-image-pro",
    image_urls=[
        "https://example.com/product-1.jpg",
        "https://example.com/product-2.jpg",
        "https://example.com/product-3.jpg",
    ],
    aspect_ratio="1:1",
)
```

### Virtual Try-On (Person + Garment)

```python
# Show a person wearing a specific garment
result = client.generate_image(
    prompt="Virtual try-on: person wearing the garment, natural fit, photorealistic",
    model="grok-imagine-image-pro",
    image_urls=[
        "https://example.com/model-photo.jpg",   # Person (first)
        "https://example.com/dress.jpg",          # Garment (second)
    ],
    aspect_ratio="3:4",
)
```

::: warning
- Multi-image (2-3 refs) requires `grok-imagine-image-pro` — the basic model only supports single-image edit
- All image URLs must be publicly accessible
- For virtual try-on: person photo first, then garment/product
:::

---

## Download & Save

::: code-group
```python [Python]
import httpx
from pathlib import Path

result = client.generate_image(prompt="Mountain landscape", model="seedream-5-0-260128")
url = result.images[0].url

# Download the image
response = httpx.get(url)
Path("output.png").write_bytes(response.content)
print(f"Saved: output.png ({len(response.content)} bytes)")
```
```typescript [TypeScript]
import { writeFile } from "fs/promises";

const result = await client.generateImage({
  prompt: "Mountain landscape",
  model: "seedream-5-0-260128",
});
const url = result.images[0].url;

const response = await fetch(url);
const buffer = Buffer.from(await response.arrayBuffer());
await writeFile("output.png", buffer);
console.log(`Saved: output.png (${buffer.length} bytes)`);
```
```go [Go]
package main

import (
    "io"
    "net/http"
    "os"
)

func downloadImage(url, filename string) error {
    resp, err := http.Get(url)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    file, err := os.Create(filename)
    if err != nil {
        return err
    }
    defer file.Close()

    _, err = io.Copy(file, resp.Body)
    return err
}
```
```bash [cURL]
# Generate and download in one pipeline
URL=$(curl -s -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Mountain landscape", "model": "seedream-5-0-260128"}' \
  | jq -r '.images[0].url')

curl -o output.png "$URL"
echo "Downloaded: output.png"
```
:::

---

## Error Handling

::: code-group
```python [Python]
from fotohub import FotoHub, ValidationError, InsufficientCreditsError, RateLimitError
import time

client = FotoHub()

try:
    result = client.generate_image(prompt="test", model="seedream-5-0-260128")
except ValidationError as e:
    print(f"Invalid params: {e.message}")
except InsufficientCreditsError:
    print("Not enough credits — top up at fotohub.app/billing")
except RateLimitError as e:
    print(f"Rate limited — retry after {e.retry_after}s")
    time.sleep(e.retry_after)
```
```typescript [TypeScript]
import { ValidationError, InsufficientCreditsError, RateLimitError } from "fotohub/errors";

try {
  const result = await client.generateImage({ prompt: "test", model: "seedream-5-0-260128" });
} catch (e) {
  if (e instanceof ValidationError) {
    console.error(`Invalid: ${e.message}`);
  } else if (e instanceof InsufficientCreditsError) {
    console.error("Top up at fotohub.app/billing");
  } else if (e instanceof RateLimitError) {
    console.error(`Rate limited: retry in ${e.retryAfter}s`);
  }
}
```
```go [Go]
// Check HTTP status code
if resp.StatusCode == 429 {
    // Rate limited — check Retry-After header
    retryAfter := resp.Header.Get("Retry-After")
    fmt.Printf("Rate limited. Retry after %s seconds\n", retryAfter)
} else if resp.StatusCode == 402 {
    fmt.Println("Insufficient credits")
} else if resp.StatusCode >= 400 {
    fmt.Printf("Error: HTTP %d\n", resp.StatusCode)
}
```
```bash [cURL]
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "model": "seedream-5-0-260128"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" -ge 400 ]; then
  echo "Error ($HTTP_CODE): $(echo "$RESPONSE" | sed '$d' | jq -r '.error.message')"
fi
```
:::

See the full [Error Handling Guide](/guides/error-handling) for retry patterns and circuit breakers.

---

## Performance Tips

1. **Use the fastest model for prototyping** — seedream and grok-imagine-image are 2-4s
2. **Batch with num_images** — Generating 4 images in one call is faster than 4 separate calls
3. **Cache with seeds** — If you regenerate the same image often, lock the seed and cache the URL
4. **Lower guidance for speed** — Some models are faster at lower guidance_scale values
5. **Choose appropriate resolution** — Don't generate 2K images for thumbnails
6. **Use negative prompts sparingly** — Long negative prompts can slow generation

---

## Model Comparison: When to Use What

| Scenario | Recommended model | Why |
|----------|------------------|-----|
| Landing page hero | `seedream-5-0-260128` | Fast, versatile, great default |
| Product photo with text | `flux-2-pro` | Best text rendering in images |
| E-commerce flat-lay | `grok-imagine-image-pro` | Multi-image compose |
| Character design | `flux-2-max` | Best for illustration/anime |
| Architecture visualization | `imagen-4-standard` | Handles complex spatial scenes |
| Social media batch (50+) | `grok-imagine-image` | Cheapest per image at scale |
| Print-quality artwork | `imagen-4-ultra` | Highest resolution & detail |
| Complex/precise prompts, in-image text | `gemini-3-pro-image` | Advanced reasoning + precise text rendering, up to 4K |

---

## Related

- [Image Generation API Reference](/api/image-generation)
- [Image Editing (inpainting, upscaling)](/api/image-editing)
- [Models Catalog](/api/models)
- [SDK Setup Guide](/guides/sdk-setup)
- [Batch Processing](/guides/batch-processing)
- [Cost Optimization](/guides/cost-optimization)
