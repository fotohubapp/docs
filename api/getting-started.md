# Getting Started

The FOTOhub API is a unified creative AI platform providing access to 80+ state-of-the-art AI models through a single, consistent interface. Generate images, create videos, compose music, run chat completions, analyze content, manage storage, and orchestrate compute workflows — all with one API key and one billing system.

## Platform Overview

FOTOhub consolidates dozens of AI providers into a single REST API with unified authentication, billing, and response formats. Instead of managing separate accounts with OpenAI, Stability, Runway, ElevenLabs, and others, you integrate once and gain access to everything.

### Available Services

| Service | Description | Models |
|---------|-------------|--------|
| **Image Generation** | Text-to-image, image-to-image, inpainting | FLUX, SDXL, SeedDream, Ideogram, Recraft |
| **Video Generation** | Text-to-video, image-to-video, video extension | Kling, Runway, Veo, Wan, Hunyuan |
| **Music & Audio** | Music generation, sound effects, audio-to-audio | Stable Audio, MMAudio, Chatterbox TTS |
| **Chat & Text** | Completions, reasoning, summarization | Claude, GPT-4o, Gemini, DeepSeek |
| **Analysis & Vision** | Image analysis, OCR, captioning | Multi-modal LLMs |
| **Text-to-Speech** | Voice synthesis, voice cloning | Chatterbox, ElevenLabs |
| **Speech-to-Text** | Transcription, translation | Whisper variants |
| **Image Editing** | Upscaling, background removal, style transfer | Specialized editing models |
| **Storage & Compute** | File management, agent workflows | Platform services |

## Base URL

All API requests are made to the following base URL. Every endpoint is prefixed with `/v1/` to ensure versioning compatibility.

```
https://apis.fotohub.app/v1/
```

| Environment | URL |
|-------------|-----|
| Production | `https://apis.fotohub.app/v1/` |
| Console API | `https://apis.fotohub.app/v1/console/` |

::: info API Versioning
All current endpoints use the `/v1/` prefix. When breaking changes are introduced, a new version prefix (e.g., `/v2/`) will be released. The previous version will remain available for at least 12 months after deprecation notice.
:::

## Quick Start

Get up and running with the FOTOhub API in three steps. You can make your first generation in under 60 seconds.

### Step 1: Get Your API Key

Navigate to [fotohub.app/console](https://fotohub.app/console) and open the **Keys** tab. Click **"Create New Key"** to generate a production key (prefixed with `fh_live_`) or a sandbox key (prefixed with `fh_test_`). Copy the key immediately — it will not be shown again.

::: warning Key Security
Your API key grants access to billable resources. Store it securely in environment variables or a secrets manager. Never commit keys to source control or expose them in client-side code.
:::

### Step 2: Make Your First Request

Generate an image using SeedDream 5.0 Lite. The response includes the generated image URL and billing details.

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key_here",
        "Content-Type": "application/json"
    },
    json={
        "model": "seedream-5-0-260128",
        "prompt": "A futuristic cityscape at sunset, photorealistic",
        "width": 1024,
        "height": 1024,
        "steps": 25
    }
)

result = response.json()
print(f"Image URL: {result['url']}")
print(f"Credits used: {result['billing']['credits_used']}")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/image",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key_here",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "seedream-5-0-260128",
      prompt: "A futuristic cityscape at sunset, photorealistic",
      width: 1024,
      height: 1024,
      steps: 25,
    }),
  }
);

const result = await response.json();
console.log(`Image URL: ${result.url}`);
console.log(`Credits used: ${result.billing.credits_used}`);
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedream-5-0-260128",
    "prompt": "A futuristic cityscape at sunset, photorealistic",
    "width": 1024,
    "height": 1024,
    "steps": 25
  }'
```

:::

### Step 3: Check Your Balance

Verify your remaining credits and wallet balance to ensure you have sufficient funds for continued usage.

::: code-group

```python [Python]
response = requests.get(
    "https://apis.fotohub.app/v1/billing/balance",
    headers={"Authorization": "Bearer fh_live_your_api_key_here"}
)

balance = response.json()
print(f"Credits remaining: {balance['credits']['remaining']}")
print(f"Wallet balance: {balance['wallet']['balance']} PLN")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/billing/balance",
  {
    headers: {
      "Authorization": "Bearer fh_live_your_api_key_here",
    },
  }
);

const balance = await response.json();
console.log(`Credits remaining: ${balance.credits.remaining}`);
console.log(`Wallet balance: ${balance.wallet.balance} PLN`);
```

```bash [cURL]
curl https://apis.fotohub.app/v1/billing/balance \
  -H "Authorization: Bearer fh_live_your_api_key_here"
```

:::

**Example response:**

```json
{
  "tier": "starter",
  "credits": {
    "remaining_4h": 45,
    "remaining_period": 890
  },
  "wallet": {
    "balance": 150.00,
    "currency": "PLN"
  }
}
```

## Authentication Overview

All requests require a Bearer token in the `Authorization` header:

```
Authorization: Bearer fh_live_your_api_key_here
```

### Key Types

| Prefix | Environment | Description |
|--------|-------------|-------------|
| `fh_live_` | Production | Full access, charges real credits/wallet |
| `fh_test_` | Sandbox | Limited models, no billing charges |

### Required Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Authorization` | string | Yes | Bearer token with your API key. Format: `Bearer fh_live_*` or `Bearer fh_test_*` |
| `Content-Type` | string | Yes | Must be `application/json` for all requests with a body. `multipart/form-data` accepted for file uploads. |
| `X-Request-Id` | string | No | Optional idempotency key. If provided, duplicate requests with the same ID within 24h will return the cached response. |
| `X-Fotohub-Version` | string | No | API version date string (default: `2026-01-01`). Pins your request to a specific API behavior version. |

### Example Request Structure

```http
POST /v1/ai/generate/image HTTP/1.1
Host: apis.fotohub.app
Authorization: Bearer fh_live_abc123def456
Content-Type: application/json
X-Request-Id: req_unique_id_12345

{
  "model": "seedream-5-0-260128",
  "prompt": "A serene mountain landscape",
  "width": 1024,
  "height": 768,
  "steps": 25,
  "guidance_scale": 7.5
}
```

See [Authentication](/api/authentication) for full details on key types, scopes, rotation, and JWT auth.

## Response Format

Every successful API response includes the requested data along with a `billing` object that details the cost of the operation. This provides full transparency on resource consumption for every request.

### Successful Response

```json
{
  "id": "gen_8f3k2j1m4n5p",
  "object": "image",
  "created": 1721234567,
  "model": "seedream-5-0-260128",
  "url": "https://s3point.fotohub.app/generations/gen_8f3k2j1m4n5p.png",
  "width": 1024,
  "height": 1024,
  "metadata": {
    "prompt": "A futuristic cityscape at sunset, photorealistic",
    "steps": 25,
    "guidance_scale": 7.5,
    "seed": 4281937562,
    "inference_time_ms": 3420
  },
  "billing": {
    "credits_used": 5,
    "credits_remaining": 495,
    "wallet_charged": 0.00,
    "wallet_balance": 150.00,
    "cost_breakdown": {
      "base_cost": 4,
      "resolution_multiplier": 1.0,
      "steps_multiplier": 1.0,
      "total": 5
    },
    "billing_mode": "credits"
  }
}
```

### Error Response

Error responses follow a consistent structure with an `error` object:

```json
{
  "error": {
    "code": "invalid_parameter",
    "message": "Parameter 'width' must be between 256 and 2048",
    "param": "width",
    "type": "validation_error"
  },
  "request_id": "req_abc123"
}
```

## Billing Overview

FOTOhub uses a dual-mode billing system designed for flexibility.

### Credits (Prepaid)

Monthly allowance included with your subscription tier. Credits are consumed first for every billable operation. Unused credits do not roll over to the next billing period.

### Wallet (Pay-per-use)

PLN balance that acts as a fallback when credits are exhausted. Top up via card, BLIK, or bank transfer. Charged at per-operation rates.

::: tip Billing Priority
Credits are always deducted first. When your monthly credit allowance is exhausted, the system automatically falls back to your wallet balance. Some models (BytePlus SeedDream, AWS Bedrock-routed models) use token-based billing where cost is calculated per input/output token rather than a fixed credit amount per operation.
:::

See [Billing & Pricing](/api/billing) for full details on credit costs per model, wallet top-up, and invoicing.

## Rate Limits

Rate limits are enforced per API key and vary by subscription tier. Limits are calculated on a per-minute sliding window. When exceeded, requests receive a `429 Too Many Requests` response.

| Tier | Requests/Minute | Concurrent Jobs | Burst Limit |
|------|----------------|-----------------|-------------|
| Free | 10 | 2 | 15 |
| Developer | 60 | 5 | 90 |
| Startup | 300 | 20 | 450 |
| Business | 1,000 | 50 | 1,500 |
| Enterprise | 5,000 | 200 | 7,500 |

### Rate Limit Headers

Every response includes rate limit headers to help you implement client-side throttling:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed per minute |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `X-RateLimit-Reset` | Unix timestamp when the rate limit resets |

## HTTP Status Codes

The API uses standard HTTP status codes to indicate success or failure.

| Code | Status | Description |
|------|--------|-------------|
| `200` | OK | Request succeeded. Response body contains the requested data. |
| `201` | Created | Resource created successfully. Returned for POST requests that create new entities. |
| `400` | Bad Request | Invalid request body or parameters. Check the `error.param` field for specifics. |
| `401` | Unauthorized | Missing or invalid API key. Verify your Authorization header format. |
| `403` | Forbidden | API key lacks permission for this operation. Check key scopes in your console. |
| `404` | Not Found | The requested resource does not exist. Verify the endpoint path and resource ID. |
| `429` | Rate Limited | Too many requests. Back off and retry after `X-RateLimit-Reset`. |
| `500` | Server Error | Internal server error. Retry with exponential backoff. If persistent, contact support. |

::: tip Retry Strategy
For 429 and 5xx errors, implement exponential backoff starting at 1 second with a maximum of 5 retries. The SDKs handle this automatically. For 4xx errors (except 429), do not retry — fix the request parameters first.
:::

## SDKs

Official SDKs are available for Python and TypeScript/JavaScript. They provide type-safe interfaces, automatic retries, streaming support, and built-in error handling.

### Installation

| Language | Package | Install Command | Requirements |
|----------|---------|-----------------|--------------|
| Python | `fotohub-sdk` | `pip install fotohub-sdk` | Python 3.8+ |
| TypeScript | `@fotohub/sdk` | `npm install @fotohub/sdk` | Node.js 18+, Deno, edge runtimes |

### SDK Usage

::: code-group

```python [Python]
from fotohub import FotohubClient

client = FotohubClient(api_key="fh_live_your_api_key_here")

# Generate an image
image = client.images.generate(
    model="seedream-5-0-260128",
    prompt="A futuristic cityscape at sunset",
    width=1024,
    height=1024
)

print(f"URL: {image.url}")
print(f"Credits used: {image.billing.credits_used}")
```

```typescript [TypeScript]
import { FotohubClient } from "@fotohub/sdk";

const client = new FotohubClient({
  apiKey: "fh_live_your_api_key_here",
});

// Generate an image
const image = await client.images.generate({
  model: "seedream-5-0-260128",
  prompt: "A futuristic cityscape at sunset",
  width: 1024,
  height: 1024,
});

console.log(`URL: ${image.url}`);
console.log(`Credits used: ${image.billing.creditsUsed}`);
```

:::

### SDK Features

- **Automatic retries** with exponential backoff for transient errors
- **Type safety** with full TypeScript definitions and Python type hints
- **Streaming support** for chat completions and long-running generations
- **Async/await** via `fotohub.AsyncClient` (Python) or native promises (TypeScript)
- **Built-in error handling** with typed exception classes
- **Request logging** and debug mode for development

## Next Steps

- [Authentication](/api/authentication) — Key types, scopes, rotation, and JWT auth
- [Image Generation](/api/image-generation) — 25+ models, credit and token billing
- [Video Generation](/api/video-generation) — Veo, Kling, Hailuo, Seedance
- [Music & Audio](/api/music-audio) — Stable Audio, MMAudio
- [Chat / LLM](/api/chat-llm) — Claude, GPT-4o, Gemini, DeepSeek
- [Billing & Pricing](/api/billing) — Understand credits, tokens, wallet
- [Webhooks](/api/webhooks) — Real-time event notifications
- [Error Handling](/api/errors) — Detailed error codes and troubleshooting
