# Python SDK

Official Python SDK for the FOTOhub API. Provides type-safe interfaces, automatic retries, streaming support, async/await, and structured error handling.

## Installation

```bash
pip install fotohub
```

Requires **Python 3.8+**. For async support, Python 3.9+ is recommended.

Optional dependencies:

```bash
# With async support (installs aiohttp)
pip install fotohub[async]

# With webhook verification (installs cryptography)
pip install fotohub[webhooks]

# All extras
pip install fotohub[all]
```

## Quick Start

```python
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key_here")

# Generate an image
result = client.generate_image(
    prompt="A serene mountain landscape at golden hour",
    model="seedream-5-0-260128",
    aspect_ratio="16:9"
)

print(f"Image URL: {result['images'][0]}")
print(f"Cost: {result['billing']['pln_charged']} PLN")
print(f"Credits used: {result['billing']['credits_used']}")
```

## Client Initialization

### With API Key

```python
from fotohub import FotoHub

client = FotoHub(
    api_key="fh_live_your_api_key_here",
    base_url="https://apis.fotohub.app",  # default
    timeout=60.0,       # request timeout in seconds
    max_retries=3,      # retries for transient errors (429, 5xx)
)
```

### With Environment Variable

The client automatically reads `FOTOHUB_API_KEY` from the environment if no key is passed:

```python
from fotohub import FotoHub

# Reads FOTOHUB_API_KEY from environment
client = FotoHub()
```

Set it in your shell or `.env` file:

```bash
export FOTOHUB_API_KEY=fh_live_your_api_key_here
```

### Supported Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FOTOHUB_API_KEY` | Yes | - | Your API key. Read automatically if not passed to constructor. |
| `FOTOHUB_BASE_URL` | No | `https://apis.fotohub.app/v1` | Override the base URL for testing or local mocks. |
| `FOTOHUB_TIMEOUT` | No | `60000` | Default request timeout in milliseconds. |
| `FOTOHUB_MAX_RETRIES` | No | `3` | Maximum automatic retries for transient errors. |

::: warning Security
Add `.env` to your `.gitignore`. Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, Doppler) in production. Never log or print your API key. Rotate keys immediately if exposed.
:::

## Image Generation

### Basic Usage

```python
result = client.generate_image(
    prompt="Professional headshot of a business woman",
    model="seedream-5-0-260128"
)

print(f"Image: {result['images'][0]}")
```

### All Parameters

```python
result = client.generate_image(
    prompt="A cyberpunk street market in neon rain",
    model="imagen-4-standard",
    negative_prompt="blurry, low quality, distorted",
    aspect_ratio="16:9",
    width=1920,
    height=1080,
    num_images=4,
    seed=42,
    style="photographic",
    guidance_scale=7.5,
    webhook_url="https://your-app.com/webhook/image-done"
)

# Access all generated images
for i, url in enumerate(result['images']):
    print(f"Image {i+1}: {url}")

# Billing details
print(f"Method: {result['billing']['method']}")
print(f"Credits used: {result['billing']['credits_used']}")
print(f"Cost: {result['billing']['pln_charged']} PLN")
```

### Parameters Reference

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | `str` | Yes | Text description of the image to generate |
| `model` | `str` | Yes | Model ID (e.g., `seedream-5-0-260128`, `imagen-4-ultra`, `flux-2-pro`) |
| `negative_prompt` | `str` | No | What to avoid in the generation |
| `aspect_ratio` | `str` | No | Aspect ratio (`1:1`, `16:9`, `9:16`, `4:3`, `3:4`) |
| `width` | `int` | No | Width in pixels (overrides aspect_ratio) |
| `height` | `int` | No | Height in pixels (overrides aspect_ratio) |
| `num_images` | `int` | No | Number of images to generate (1-4, default: 1) |
| `seed` | `int` | No | Random seed for reproducibility |
| `style` | `str` | No | Style preset (model-dependent) |
| `guidance_scale` | `float` | No | How closely to follow the prompt (1.0-20.0) |
| `webhook_url` | `str` | No | URL to POST results when generation completes |

## Video Generation

Video generation is synchronous — the call blocks until the video is ready and the response contains the finished `video_url`. There is no separate job to poll.

```python
result = client.generate_video(
    prompt="A drone shot flying over tropical islands at sunrise",
    model="veo-3.1-generate-001",
    duration=5,
    aspect_ratio="16:9"
)

print(f"Video URL: {result['video_url']}")
print(f"Credits used: {result['billing']['credits_used']}")
```

### With Image Input (Image-to-Video)

```python
result = client.generate_video(
    prompt="Camera slowly zooms in on the subject",
    model="veo-3.1-generate-001",
    image_url="https://example.com/start-frame.jpg",
    duration=5,
    aspect_ratio="16:9"
)
```

### Video Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | `str` | Yes | Text description of the video |
| `model` | `str` | Yes | Model ID — see `GET /v1/models?category=video` for the full list. Examples: `veo-3.1-generate-001`, `veo-2.0-generate-001`, `kling-v3`, `hailuo-o2`, `seedance-2-0-pro`, `sora-2`, `wan2.2-t2v-plus`, `gemini-omni-flash`, `grok-imagine-video-1.5` |
| `duration` | `int` | No | Duration in seconds (model-dependent, default: 5) |
| `aspect_ratio` | `str` | No | Aspect ratio (`16:9`, `9:16`, `1:1`) |
| `image_url` | `str` | No | Start frame image URL for image-to-video |

## Music Generation

```python
result = client.generate_music(
    prompt="Chill lo-fi hip hop beat with vinyl crackle",
    duration=60,
    genre="lofi",
    instrumental=True
)

print(f"Audio URL: {result['audio_url']}")
print(f"Duration: {result['duration']}s")
print(f"Cost: {result['billing']['pln_charged']} PLN")
```

### Sound Effects

```python
result = client.generate_sfx(
    prompt="Thunder rolling in the distance with light rain",
    duration=10
)

print(f"SFX URL: {result['audio_url']}")
```

### Text-to-Speech

```python
result = client.generate_speech(
    text="Welcome to FOTOhub, the creative AI platform.",
    voice="alloy",
    speed=1.0
)

print(f"Speech URL: {result['audio_url']}")
```

## Chat Completions

### Credit-Based Chat

Uses FOTOhub credits for billing. Supports all chat models.

```python
response = client.chat(
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain quantum computing in simple terms"}
    ],
    model="gemini-flash",
    temperature=0.7,
    max_tokens=1024
)

print(response['choices'][0]['message']['content'])
print(f"Credits used: {response['billing']['credits_used']}")
```

### Token-Based Chat (Premium)

Direct token-based billing on premium models, ideal for high-volume usage:

```python
response = client.chat_claude(
    messages=[
        {"role": "user", "content": "Write a haiku about programming"}
    ],
    model="claude-sonnet-4.6",
    system="You are a poet.",
    max_tokens=4096,
    temperature=0.8
)

print(response['choices'][0]['message']['content'])
print(f"Input tokens: {response['usage']['prompt_tokens']}")
print(f"Output tokens: {response['usage']['completion_tokens']}")
print(f"Cost: {response['billing']['cost_breakdown']['cost_pln']} PLN")
```

### OpenAI-Compatible Drop-in

Use the official OpenAI Python SDK pointed at FOTOhub:

```python
from openai import OpenAI

client = OpenAI(
    api_key="fh_live_your_key_here",
    base_url="https://apis.fotohub.app/v1/ai"
)

response = client.chat.completions.create(
    model="gemini-flash",
    messages=[{"role": "user", "content": "Hello!"}],
    temperature=0.7
)

print(response.choices[0].message.content)
```

This works with any library that supports the OpenAI API format, including LangChain, LlamaIndex, and others.

## Streaming

The Python SDK's `chat()` and `chat_claude()` methods return complete responses. For streaming token deltas, use the OpenAI-compatible endpoint with the official OpenAI Python SDK:

```python
from openai import OpenAI

client = OpenAI(
    api_key="fh_live_your_key_here",
    base_url="https://apis.fotohub.app/v1/ai"
)

stream = client.chat.completions.create(
    model="claude-sonnet-4.6",
    messages=[{"role": "user", "content": "Write a poem about the ocean"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

This works with any library that supports the OpenAI streaming format, including LangChain and LlamaIndex.

## 3D Generation

Generate 3D models from images or text prompts with export to GLB, OBJ, STL, or USDZ.

### Image to 3D

```python
import base64

client = FotoHub(api_key="fh_live_your_key")

with open("product.jpg", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

result = client.generate_3d(
    mode="image-to-3d",
    model="triposr",
    image=image_b64,
    format="glb",
)

print(f"3D Model: {result['url']}")
print(f"Credits: {result['billing']['credits_used']}")
```

### Text to 3D

```python
result = client.generate_3d(
    mode="text-to-3d",
    model="shap-e",
    prompt="A medieval stone castle with towers",
    quality="high",
    format="glb",
)

# Wait for completion (for longer models)
completed = client.wait_for_3d(result["id"], poll_interval=3.0, timeout=120.0)
print(f"Download: {completed['url']}")
```

### List Available 3D Models

```python
models = client.list_3d_models()
for m in models:
    print(f"{m['name']} ({m['id']}): {m['credits']} credits — {m['speed']}")
```

### Async 3D Generation

```python
async with AsyncFotoHub(api_key="fh_live_your_key") as client:
    result = await client.generate_3d(
        mode="image-to-3d",
        model="triposr",
        image=image_b64,
    )
    completed = await client.wait_for_3d(result["id"])
    print(completed["url"])
```

## Tier Management

Manage API tiers, check usage, and handle wallet operations.

### Get Current Tier

```python
tier = client.get_current_tier()
print(f"Tier: {tier['name']} ({tier['type']})")
print(f"Rate limit: {tier['limits']['rpm']} rpm")
print(f"Credits used: {tier['usage']['credits_used']}")
```

### Browse Available Tiers

```python
catalog = client.get_tier_catalog()
for tier in catalog["tiers"]:
    print(f"{tier['name']}: {tier['rpm']} rpm, {tier['credits_monthly']} credits/mo")
```

### Subscribe to a Tier

```python
result = client.subscribe_tier("sub-developer")
print(f"Checkout URL: {result['checkout_url']}")
```

### Wallet Operations

```python
# Check balance
wallet = client.get_wallet()
print(f"Balance: {wallet['balance']} {wallet['currency']}")

# Top up
result = client.topup_wallet(100)
print(f"Payment URL: {result['session_url']}")
```

### Enterprise Application

```python
result = client.apply_enterprise(
    company_name="Acme Corp",
    contact_email="api@acme.com",
    expected_usage="50,000+ generations/month",
    use_case="E-commerce product photography at scale",
)
print(f"Application ID: {result['id']}")
```

## Error Handling

The SDK raises typed exceptions for different error conditions:

```python
from fotohub import FotoHub
from fotohub.errors import (
    FotohubError,
    AuthenticationError,
    InsufficientCreditsError,
    RateLimitError,
    ValidationError,
    ServerError,
    TimeoutError,
)

client = FotoHub()

try:
    result = client.generate_image(
        prompt="A beautiful landscape",
        model="seedream-5-0-260128"
    )
except InsufficientCreditsError as e:
    # Not enough credits or wallet balance
    print(f"Need: {e.required} credits, Have: {e.available}")
    print("Top up at https://fotohub.app/console/billing")
except RateLimitError as e:
    # Too many requests
    print(f"Rate limited. Retry after {e.retry_after} seconds")
    # SDK auto-retries by default, this fires only after all retries exhausted
except AuthenticationError:
    # Invalid or expired API key
    print("Invalid API key. Check your credentials at fotohub.app/console")
except ValidationError as e:
    # Invalid request parameters
    print(f"Invalid request: {e.message}")
    print(f"Parameter: {e.param}")
except ServerError as e:
    # 5xx server error (after retries)
    print(f"Server error [{e.status}]: {e.message}")
except TimeoutError:
    # Request timed out
    print("Request timed out. Try increasing timeout or simplifying the request.")
except FotohubError as e:
    # Catch-all for any API error
    print(f"API error [{e.status}]: {e.code} - {e.message}")
```

### Exception Hierarchy

```
FotohubError (base)
├── AuthenticationError      (401)
├── InsufficientCreditsError (402)
├── ValidationError          (400, 422)
├── RateLimitError           (429)
├── ServerError              (500, 502, 503)
└── TimeoutError             (request timeout)
```

### Retry Behavior

The SDK automatically retries transient errors (HTTP 429, 500, 502, 503) with exponential backoff:

```python
client = FotoHub(
    api_key="fh_live_...",
    max_retries=5,       # default: 3
    timeout=120.0,       # default: 60s
)
```

Retries use jittered exponential backoff. For 429 responses, the SDK respects the `Retry-After` header.

## Async Support

For async/await usage, use `AsyncFotoHub`. All methods have identical signatures but return coroutines:

```python
import asyncio
from fotohub import AsyncFotoHub

async def main():
    client = AsyncFotoHub(api_key="fh_live_your_key_here")

    # Generate image asynchronously
    result = await client.generate_image(
        prompt="A futuristic cityscape",
        model="imagen-4-standard",
        aspect_ratio="16:9"
    )
    print(f"Image: {result['images'][0]}")

    # Parallel generation
    tasks = [
        client.generate_image(prompt="A red car", model="seedream-5-0-260128"),
        client.generate_image(prompt="A blue boat", model="seedream-5-0-260128"),
        client.generate_image(prompt="A green plane", model="seedream-5-0-260128"),
    ]
    results = await asyncio.gather(*tasks)

    for r in results:
        print(r['images'][0])

    # Async streaming
    async for chunk in client.chat_stream(
        messages=[{"role": "user", "content": "Tell me a joke"}],
        model="gemini-flash"
    ):
        content = chunk['choices'][0]['delta'].get('content', '')
        if content:
            print(content, end="", flush=True)

    # Always close the client when done
    await client.close()

asyncio.run(main())
```

### Async Context Manager

```python
from fotohub import AsyncFotoHub

async def main():
    async with AsyncFotoHub() as client:
        result = await client.generate_image(
            prompt="Sunset over the ocean",
            model="seedream-5-0-260128"
        )
        print(result['images'][0])

asyncio.run(main())
```

## Webhook Signature Verification

When using webhooks for async operations (video generation, etc.), verify the signature to ensure the request is from FOTOhub:

```python
from fotohub.webhooks import verify_signature

# Your webhook secret from the FOTOhub console
WEBHOOK_SECRET = "whsec_your_webhook_secret"

def handle_webhook(request):
    payload = request.body
    signature = request.headers.get("X-Fotohub-Signature")
    timestamp = request.headers.get("X-Fotohub-Timestamp")

    # Verify the signature (raises InvalidSignatureError if invalid)
    verify_signature(
        payload=payload,
        signature=signature,
        timestamp=timestamp,
        secret=WEBHOOK_SECRET
    )

    # Process the verified webhook
    event = json.loads(payload)
    if event['type'] == 'video.completed':
        print(f"Video ready: {event['data']['video_url']}")
    elif event['type'] == 'video.failed':
        print(f"Video failed: {event['data']['error']}")
```

### Flask Example

```python
from flask import Flask, request, jsonify
from fotohub.webhooks import verify_signature, InvalidSignatureError

app = Flask(__name__)

@app.route("/webhook/fotohub", methods=["POST"])
def fotohub_webhook():
    try:
        verify_signature(
            payload=request.data,
            signature=request.headers.get("X-Fotohub-Signature"),
            timestamp=request.headers.get("X-Fotohub-Timestamp"),
            secret="whsec_your_webhook_secret"
        )
    except InvalidSignatureError:
        return jsonify({"error": "Invalid signature"}), 401

    event = request.get_json()
    # Process event...
    return jsonify({"received": True}), 200
```

### FastAPI Example

```python
from fastapi import FastAPI, Request, HTTPException
from fotohub.webhooks import verify_signature, InvalidSignatureError

app = FastAPI()

@app.post("/webhook/fotohub")
async def fotohub_webhook(request: Request):
    body = await request.body()
    try:
        verify_signature(
            payload=body,
            signature=request.headers.get("x-fotohub-signature"),
            timestamp=request.headers.get("x-fotohub-timestamp"),
            secret="whsec_your_webhook_secret"
        )
    except InvalidSignatureError:
        raise HTTPException(status_code=401, detail="Invalid signature")

    event = await request.json()
    # Process event...
    return {"received": True}
```

## Balance Checking

```python
# Get current balance and usage
balance = client.get_balance()

print(f"Credits available: {balance['credits_available']}")
print(f"Wallet balance: {balance['wallet_pln']} PLN")
print(f"Plan: {balance['plan']}")

# Get usage statistics
usage = client.get_usage(period="30d")

print(f"Total requests: {usage['total_requests']}")
print(f"Total spent: {usage['total_pln']} PLN")
print(f"Images generated: {usage['breakdown']['images']}")
print(f"Videos generated: {usage['breakdown']['videos']}")
print(f"Chat messages: {usage['breakdown']['chat']}")
```

### Check Before Generating

```python
from fotohub.errors import InsufficientCreditsError

balance = client.get_balance()

if balance['credits_available'] < 10:
    print("Low credits - top up recommended")

try:
    result = client.generate_image(
        prompt="A landscape painting",
        model="seedream-5-0-260128"
    )
except InsufficientCreditsError as e:
    print(f"Insufficient credits: need {e.required}, have {e.available}")
```

## Image Analysis

```python
result = client.analyze_image(
    image_url="https://example.com/photo.jpg",
    prompt="Describe this image in detail",
    model="gemini-flash"
)

print(result['analysis'])
```

## Audio Transcription

```python
result = client.transcribe(
    audio_url="https://example.com/meeting.mp3",
    language="en"
)

print(result['text'])
print(f"Duration: {result['duration']}s")
```

## Prompt Enhancement

Improve prompts before generation:

```python
enhanced = client.enhance_prompt(
    prompt="a cat",
    category="image"
)

print(f"Enhanced: {enhanced['enhanced_prompt']}")
# e.g., "A majestic tabby cat sitting on a velvet cushion, golden hour lighting..."

# Use the enhanced prompt for generation
result = client.generate_image(
    prompt=enhanced['enhanced_prompt'],
    model="seedream-5-0-260128"
)
```

## Full Method Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `generate_image()` | `POST /v1/ai/generate/image` | Generate images from text prompts |
| `generate_video()` | `POST /v1/ai/generate/video` | Generate video (synchronous — returns `video_url`) |
| `generate_music()` | `POST /v1/ai/generate/music` | Generate music tracks |
| `generate_sfx()` | `POST /v1/ai/generate/sfx` | Generate sound effects |
| `generate_speech()` | `POST /v1/ai/generate/speech` | Text-to-speech synthesis |
| `transcribe()` | `POST /v1/ai/transcribe` | Audio/video transcription |
| `chat()` | `POST /v1/ai/chat/completions` | Chat completion (credit-based) |
| `chat_claude()` | `POST /v1/ai/chat/claude` | Premium chat completion (token-based) |
| `analyze_image()` | `POST /v1/ai/analyze/image` | Image analysis with vision models |
| `enhance_prompt()` | `POST /v1/ai/enhance-prompt` | Improve prompts with AI |
| `get_balance()` | `GET /v1/billing/balance` | Check credit and wallet balance |
| `get_pricing()` | `GET /v1/billing/pricing` | Get pricing catalog |

## Complete Example

A full example combining multiple features:

```python
import os
from fotohub import FotoHub
from fotohub.errors import FotohubError, InsufficientCreditsError

def main():
    # Initialize client from environment
    client = FotoHub()

    # Check balance first
    balance = client.get_balance()
    print(f"Credits: {balance['credits_available']}")

    if balance['credits_available'] < 5:
        print("Low credits. Please top up.")
        return

    # Enhance a simple prompt
    enhanced = client.enhance_prompt(
        prompt="a dog in a park",
        category="image"
    )
    print(f"Enhanced prompt: {enhanced['enhanced_prompt']}")

    # Generate image with enhanced prompt
    try:
        result = client.generate_image(
            prompt=enhanced['enhanced_prompt'],
            model="seedream-5-0-260128",
            aspect_ratio="16:9",
            num_images=2
        )

        for i, url in enumerate(result['images']):
            print(f"Image {i+1}: {url}")

        print(f"Total cost: {result['billing']['pln_charged']} PLN")

    except InsufficientCreditsError as e:
        print(f"Not enough credits: need {e.required}, have {e.available}")
    except FotohubError as e:
        print(f"Error [{e.status}]: {e.message}")

    # Chat about the generated images
    response = client.chat(
        messages=[
            {"role": "user", "content": "Suggest 3 variations of this prompt: " + enhanced['enhanced_prompt']}
        ],
        model="gemini-flash"
    )
    print(f"\nSuggested variations:\n{response['choices'][0]['message']['content']}")

if __name__ == "__main__":
    main()
```

## Stability AI Tools

Professional image editing tools powered by Stability AI, available through the SDK.

### List Available Tools

```python
tools = client.stability_tools()
for tool in tools:
    print(f"{tool['id']}: {tool['name']} - {tool['credits']} credits")
```

### Upscale Image

```python
# Fast mode (2x, instant)
result = client.stability_upscale(
    image_url="https://example.com/photo.jpg",
    mode="fast"  # "fast", "creative", or "conservative"
)
print(f"Upscaled: {result['url']}")

# Creative mode (4x, AI-enhanced details)
result = client.stability_upscale(
    image_url="https://example.com/photo.jpg",
    mode="creative"
)
```

### Remove Background

```python
result = client.stability_remove_background(
    image_url="https://example.com/product.jpg"
)
print(f"Transparent PNG: {result['url']}")
```

### Erase Object (Content-Aware Fill)

```python
result = client.stability_erase(
    image_url="https://example.com/photo.jpg",
    mask_url="https://example.com/mask.png"  # white = area to erase
)
print(f"Cleaned image: {result['url']}")
```

### Inpaint (Generate in Masked Area)

```python
result = client.stability_inpaint(
    image_url="https://example.com/room.jpg",
    mask_url="https://example.com/mask.png",
    prompt="a modern leather sofa"
)
print(f"Inpainted: {result['url']}")
```

### Outpaint (Extend Canvas)

```python
result = client.stability_outpaint(
    image_url="https://example.com/portrait.jpg",
    left=200,    # extend 200px left
    right=200,   # extend 200px right
    up=100,      # extend 100px up
    down=0       # no extension down
)
print(f"Extended: {result['url']}")
```

### Search and Replace

```python
result = client.stability_search_replace(
    image_url="https://example.com/scene.jpg",
    search_prompt="the red car",
    replace_prompt="a blue vintage motorcycle"
)
print(f"Modified: {result['url']}")
```

### Recolor Object

```python
result = client.stability_recolor(
    image_url="https://example.com/dress.jpg",
    prompt="make it emerald green",
    target_object="the dress"
)
print(f"Recolored: {result['url']}")
```

### Style Transfer

```python
result = client.stability_style_transfer(
    image_url="https://example.com/photo.jpg",
    style_image_url="https://example.com/style-reference.jpg"
)
print(f"Styled: {result['url']}")
```

## 3D Generation

Generate 3D models from images or text. 3D generation is asynchronous — submit a job, then poll for results.

### Image to 3D

```python
result = client.generate_3d(
    mode="image-to-3d",
    model="triposr",            # triposr, sf3d, trellis, hunyuan3d
    image_url="https://example.com/object.jpg",
    quality="standard",          # draft, standard, high
    output_format="glb"          # glb, obj, stl, usdz
)

# Poll for completion
completed = client.wait_for_3d(
    job_id=result["job_id"],
    poll_interval=3,             # check every 3s
    timeout=120                  # max 2 minutes
)
print(f"3D model: {completed['model_url']}")
```

### Text to 3D

```python
result = client.generate_3d(
    mode="text-to-3d",
    model="shap-e",
    prompt="a medieval sword with ornate handle",
    quality="high",
    output_format="glb"
)

# Manual polling
import time
while True:
    status = client.get_3d_status(result["job_id"])
    if status["status"] == "completed":
        print(f"Model URL: {status['model_url']}")
        break
    elif status["status"] == "failed":
        print(f"Failed: {status['error']}")
        break
    time.sleep(3)
```

### List 3D Models

```python
models = client.list_3d_models()
for m in models:
    print(f"{m['id']}: {m['name']} ({m['credits']} credits, ~{m['avg_time']}s)")
```

| Model | Mode | Credits | Speed | Quality |
|-------|------|---------|-------|---------|
| `triposr` | image-to-3d | 5 | ~3s | Good |
| `sf3d` | image-to-3d | 5 | <1s | Fast |
| `shap-e` | text-to-3d | 10 | ~15s | Good |
| `trellis` | image-to-3d | 15 | ~15s | High |
| `hunyuan3d` | both | 25 | ~30s | Ultra |

## Gabriel AI (Intelligent Routing)

Gabriel is FOTOhub's AI orchestrator that classifies user intent and routes to the best model automatically.

### Classify Intent

```python
result = client.gabriel_classify(
    prompt="Generate a photorealistic product shot of a watch",
    language="en",
    context={"page": "image-studio"},
    enhance_prompt=True
)

print(f"Category: {result['category']}")           # "image_generation"
print(f"Model selected: {result['model']}")         # "seedream-5-0-260128"
print(f"Estimated credits: {result['credits']}")    # 2
print(f"Enhanced prompt: {result['enhanced_prompt']}")
print(f"Tips: {result['tips']}")
```

### Streaming Classification

```python
for event in client.gabriel_stream(
    prompt="Create a 30 second video of a sunset timelapse",
    language="en"
):
    if event['type'] == 'thinking':
        print(f"Thinking: {event['content']}")
    elif event['type'] == 'routing':
        print(f"Routing to: {event['model']}")
    elif event['type'] == 'result':
        print(f"Final: {event['data']}")
```

### Autocomplete Suggestions

```python
# Fast autocomplete for search/prompt bars (<50ms response)
suggestions = client.gabriel_suggest(
    partial="generate a video of",
    tab="create",           # context tab
    page="dashboard"        # current page
)

for s in suggestions:
    print(f"- {s['text']} ({s['category']})")
```

### Context-Aware Recommendations

```python
recs = client.gabriel_recommend(
    page="dashboard",
    credits_remaining=150,
    has_brand=True,
    recent_actions=["image_generation", "chat"]
)

for r in recs:
    print(f"{r['title']}: {r['description']} [{r['action']}]")
```

## Billing & Credits

### Get Balance

```python
balance = client.get_balance()
print(f"Credits: {balance['credits_available']}")
print(f"Wallet: {balance['wallet_pln']} PLN")
print(f"Tier: {balance['tier']}")
```

### Get Full Pricing Catalog

```python
pricing = client.get_pricing(category="image_generation")
for model_id, info in pricing['models'].items():
    print(f"{model_id}: {info['credits']} credits ({info['price_pln']} PLN)")
```

### Estimate Cost Before Generation

```python
estimate = client.estimate_cost(
    operation="image_generation",
    params={"model": "imagen-4-ultra", "count": 4}
)
print(f"Estimated: {estimate['credits']} credits ({estimate['pln']} PLN)")
```

### Set Spending Cap

```python
client.set_overage_limit(hard_limit_pln=100.0)
# Generations will fail if they would exceed this monthly cap
```

### Top-Up Credits

```python
# List packages
packages = client.get_topup_packages()
for pkg in packages:
    print(f"{pkg['amount_pln']} PLN → {pkg['credits']} credits (+{pkg['bonus_pct']}%)")

# Purchase
result = client.create_topup("topup-500")
print(f"Checkout: {result['checkout_url']}")
```

### Transaction History

```python
txns = client.get_transactions(page=1, limit=20)
for t in txns['items']:
    print(f"{t['created_at']}: {t['operation']} - {t['credits']} cr ({t['pln']} PLN)")
```

## Webhook Management

Programmatically manage webhooks for async event notifications.

### Create Webhook

```python
webhook = client.create_webhook(
    name="Video notifications",
    url="https://myapp.com/webhooks/fotohub",
    events=["generation.completed", "generation.failed", "video.ready"],
    headers={"X-Custom": "my-value"}
)
print(f"ID: {webhook['id']}")
print(f"Secret: {webhook['secret']}")  # save this for verification
```

### List and Update Webhooks

```python
# List all
webhooks = client.list_webhooks()
for wh in webhooks:
    print(f"{wh['name']}: {wh['url']} ({wh['status']})")

# Update
client.update_webhook(
    webhook_id="wh_abc123",
    events=["generation.completed"],  # reduce events
    active=True
)
```

### Test and Debug

```python
# Send test event
result = client.test_webhook("wh_abc123")
print(f"Success: {result['success']}, Response time: {result['response_time_ms']}ms")

# Check delivery logs
logs = client.get_webhook_logs("wh_abc123")
for log in logs:
    print(f"{log['timestamp']}: {log['event']} → {log['status_code']} ({log['response_time_ms']}ms)")

# Delete
client.delete_webhook("wh_abc123")
```

## Environment Variables

The SDK reads these environment variables automatically:

| Variable | Default | Description |
|----------|---------|-------------|
| `FOTOHUB_API_KEY` | — | API key (required if not passed to constructor) |
| `FOTOHUB_BASE_URL` | `https://apis.fotohub.app` | API base URL |

`timeout` and `max_retries` are configured via constructor arguments (they are not read from the environment).

```python
# No api_key needed if FOTOHUB_API_KEY is set
client = FotoHub()

# Override base URL and client settings
client = FotoHub(base_url="https://apis.fotohub.app", timeout=120.0, max_retries=5)
```

## Supported Models

### Image Models

| Model ID | Description |
|----------|-------------|
| `seedream-5-0-260128` | SeedDream 5.0 (high quality, default) |
| `imagen-4-ultra` | Google Imagen 4 Ultra |
| `imagen-4-standard` | Google Imagen 4 Standard |
| `flux-2-pro` | FLUX 2 Pro |
| `flux-2-max` | FLUX 2 Max (highest quality) |
| `flux-kontext-pro` | FLUX Kontext Pro (image editing) |
| `gpt-image-1` | OpenAI GPT Image 1 |
| `dall-e-3-standard` | OpenAI DALL-E 3 |

### Video Models

30+ models across 6 providers — see `GET /v1/models?category=video` for the full, current list. Common picks:

| Model ID | Description |
|----------|-------------|
| `veo-3.1-generate-001` | Google Veo 3.1 (native audio, up to 4K) |
| `veo-2.0-generate-001` | Google Veo 2 |
| `kling-v3` | Kling v3 |
| `hailuo-o2` | MiniMax Hailuo O2 |
| `seedance-2-0-pro` | ByteDance Seedance 2.0 |
| `sora-2` | OpenAI Sora 2 |
| `wan2.2-t2v-plus` | Wan 2.2 Plus |
| `gemini-omni-flash` | Google Gemini Omni Flash (native audio) |
| `grok-imagine-video-1.5` | xAI Grok Video 1.5 (lip-sync) |

### Chat Models

Credit-based, via `/v1/ai/chat/completions`:

| Model ID | Billing | Description |
|----------|---------|-------------|
| `gemini-flash` | Credits | Google Gemini Flash (fast) |
| `gemini-pro` | Credits | Google Gemini Pro |
| `gpt-4o` | Credits | OpenAI GPT-4o |
| `claude-sonnet` | Token | Anthropic Claude Sonnet |

Token-based premium, via `/v1/ai/chat/claude` (dot-notation IDs):

| Model ID | Billing | Description |
|----------|---------|-------------|
| `claude-sonnet-4.6` | Token | Claude Sonnet 4.6 (default) |
| `claude-haiku-4.5` | Token | Claude Haiku 4.5 (fastest) |
| `nova-pro` | Token | Amazon Nova Pro |
| `nova-lite` | Token | Amazon Nova Lite |

::: tip Model Updates
Available models are updated frequently. Call `GET /v1/models` (or see the [Models](/api/models) page) for the current list and pricing.
:::
