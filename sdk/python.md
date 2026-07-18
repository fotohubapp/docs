# Python SDK

Official Python SDK for the FOTOhub API. Provides type-safe interfaces, automatic retries, streaming support, async/await, and structured error handling.

## Installation

```bash
pip install fotohub-sdk
```

Requires **Python 3.8+**. For async support, Python 3.9+ is recommended.

Optional dependencies:

```bash
# With async support (installs aiohttp)
pip install fotohub-sdk[async]

# With webhook verification (installs cryptography)
pip install fotohub-sdk[webhooks]

# All extras
pip install fotohub-sdk[all]
```

## Quick Start

```python
from fotohub import FotohubClient

client = FotohubClient(api_key="fh_live_your_api_key_here")

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
from fotohub import FotohubClient

client = FotohubClient(
    api_key="fh_live_your_api_key_here",
    base_url="https://apis.fotohub.app",  # default
    timeout=60.0,       # request timeout in seconds
    max_retries=3,      # retries for transient errors (429, 5xx)
)
```

### With Environment Variable

The client automatically reads `FOTOHUB_API_KEY` from the environment if no key is passed:

```python
from fotohub import FotohubClient

# Reads FOTOHUB_API_KEY from environment
client = FotohubClient()
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
| `model` | `str` | Yes | Model ID (e.g., `seedream-5-0-260128`, `imagen-4-standard`, `flux-pro`) |
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

Video generation is asynchronous. You receive a job ID and poll for status or use a webhook.

```python
# Start video generation
result = client.generate_video(
    prompt="A drone shot flying over tropical islands at sunrise",
    model="kling-v2",
    duration=5,
    aspect_ratio="16:9"
)

print(f"Job ID: {result['job_id']}")
print(f"Status: {result['status']}")  # "processing"

# Poll for completion
import time

while True:
    status = client.get_job_status(result['job_id'])
    if status['status'] == 'completed':
        print(f"Video URL: {status['video_url']}")
        break
    elif status['status'] == 'failed':
        print(f"Error: {status['error']}")
        break
    time.sleep(5)
```

### With Image Input (Image-to-Video)

```python
result = client.generate_video(
    prompt="Camera slowly zooms in on the subject",
    model="kling-v2",
    image_url="https://example.com/start-frame.jpg",
    duration=5,
    aspect_ratio="16:9"
)
```

### Video Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | `str` | Yes | Text description of the video |
| `model` | `str` | Yes | Model ID (`kling-v2`, `veo-2`, `runway-gen4`) |
| `duration` | `int` | No | Duration in seconds (5 or 10, default: 5) |
| `aspect_ratio` | `str` | No | Aspect ratio (`16:9`, `9:16`, `1:1`) |
| `image_url` | `str` | No | Start frame image URL for image-to-video |
| `webhook_url` | `str` | No | URL to POST results when complete |

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

### Token-Based Chat (Bedrock)

Direct token-based billing, ideal for high-volume usage:

```python
response = client.chat_bedrock(
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

### FOTOhub SDK Streaming

```python
# Stream chat responses
for chunk in client.chat_stream(
    messages=[{"role": "user", "content": "Write a short story about a robot"}],
    model="gemini-flash"
):
    content = chunk['choices'][0]['delta'].get('content', '')
    if content:
        print(content, end="", flush=True)

print()  # newline after stream completes
```

### OpenAI SDK Streaming

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

### Bedrock Streaming

```python
for chunk in client.chat_bedrock_stream(
    messages=[{"role": "user", "content": "Explain relativity"}],
    model="claude-sonnet-4.6",
    max_tokens=2048
):
    content = chunk['choices'][0]['delta'].get('content', '')
    if content:
        print(content, end="", flush=True)
```

## Error Handling

The SDK raises typed exceptions for different error conditions:

```python
from fotohub import FotohubClient
from fotohub.errors import (
    FotohubError,
    AuthenticationError,
    InsufficientCreditsError,
    RateLimitError,
    ValidationError,
    ServerError,
    TimeoutError,
)

client = FotohubClient()

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
client = FotohubClient(
    api_key="fh_live_...",
    max_retries=5,       # default: 3
    timeout=120.0,       # default: 60s
)
```

Retries use jittered exponential backoff. For 429 responses, the SDK respects the `Retry-After` header.

## Async Support

For async/await usage, use `AsyncFotohubClient`. All methods have identical signatures but return coroutines:

```python
import asyncio
from fotohub import AsyncFotohubClient

async def main():
    client = AsyncFotohubClient(api_key="fh_live_your_key_here")

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
from fotohub import AsyncFotohubClient

async def main():
    async with AsyncFotohubClient() as client:
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
| `generate_video()` | `POST /v1/video/generate` | Generate video (async, returns job ID) |
| `get_job_status()` | `GET /v1/jobs/{job_id}` | Poll async job status |
| `generate_music()` | `POST /v1/ai/generate/music` | Generate music tracks |
| `generate_sfx()` | `POST /v1/ai/generate/sfx` | Generate sound effects |
| `generate_speech()` | `POST /v1/ai/generate/speech` | Text-to-speech synthesis |
| `transcribe()` | `POST /v1/ai/transcribe` | Audio/video transcription |
| `chat()` | `POST /v1/ai/chat/completions` | Chat completion (credit-based) |
| `chat_stream()` | `POST /v1/ai/chat/completions` | Streaming chat (credit-based) |
| `chat_bedrock()` | `POST /v1/ai/chat/bedrock` | Chat completion (token-based) |
| `chat_bedrock_stream()` | `POST /v1/ai/chat/bedrock` | Streaming chat (token-based) |
| `analyze_image()` | `POST /v1/ai/analyze/image` | Image analysis with vision models |
| `enhance_prompt()` | `POST /v1/ai/enhance-prompt` | Improve prompts with AI |
| `get_balance()` | `GET /v1/billing/balance` | Check credit and wallet balance |
| `get_usage()` | `GET /v1/billing/usage` | Get usage statistics |

## Complete Example

A full example combining multiple features:

```python
import os
from fotohub import FotohubClient
from fotohub.errors import FotohubError, InsufficientCreditsError

def main():
    # Initialize client from environment
    client = FotohubClient()

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

## Supported Models

### Image Models

| Model ID | Description |
|----------|-------------|
| `seedream-5-0-260128` | SeedDream 5.0 (high quality, default) |
| `imagen-4-standard` | Google Imagen 4 Standard |
| `imagen-4-ultra` | Google Imagen 4 Ultra |
| `flux-pro` | FLUX Pro (fast) |
| `flux-ultra` | FLUX Ultra (highest quality) |
| `gpt-image-1` | GPT Image 1 |

### Video Models

| Model ID | Description |
|----------|-------------|
| `kling-v2` | Kling v2 (5s/10s) |
| `veo-2` | Google Veo 2 |
| `runway-gen4` | Runway Gen-4 |

### Chat Models

| Model ID | Billing | Description |
|----------|---------|-------------|
| `gemini-flash` | Credits | Google Gemini Flash (fast) |
| `gemini-pro` | Credits | Google Gemini Pro |
| `gpt-4o` | Credits | OpenAI GPT-4o |
| `claude-sonnet-4.6` | Tokens (Bedrock) | Anthropic Claude Sonnet |
| `deepseek-chat` | Credits | DeepSeek Chat |

::: tip Model Updates
Available models are updated frequently. Check the [Models](/api/models) page for the current list and pricing.
:::
