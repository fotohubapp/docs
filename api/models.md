# Models Catalog

Complete reference of all AI models available through the FOTOhub API. The platform provides access to 50+ models from 10+ providers covering image generation, video creation, chat/LLM, music, audio, and visual analysis.

## List Models

Retrieve the full catalog of available models or filter by category.

### Endpoint

```
GET /v1/models
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category: `image`, `video`, `chat`, `audio`, `analysis` |
| `status` | string | Filter by status: `active`, `deprecated`, `beta` |
| `provider` | string | Filter by provider: `google`, `openai`, `bfl`, `byteplus`, `xai`, `kling`, `minimax`, `anthropic`, `deepseek`, `stability` |

### Response Format

```json
{
  "models": [
    {
      "id": "imagen-4-standard",
      "name": "Imagen 4 Standard",
      "provider": "google",
      "category": "image",
      "status": "active",
      "pricing": {
        "price_pln": 0.45,
        "credits": 3,
        "unit": "per image",
        "billing_type": "fixed"
      },
      "capabilities": {
        "max_resolution": "2048x2048",
        "supports_negative_prompt": true,
        "supports_img2img": false
      },
      "created_at": "2025-03-15T00:00:00Z"
    }
  ],
  "total": 52,
  "category_counts": {
    "image": 25,
    "video": 7,
    "chat": 15,
    "audio": 6,
    "analysis": 4
  }
}
```

### Code Example

```bash
# List all active models
curl -X GET "https://apis.fotohub.app/v1/models?status=active" \
  -H "Authorization: Bearer fh_live_your_api_key"

# List only image generation models
curl -X GET "https://apis.fotohub.app/v1/models?category=image" \
  -H "Authorization: Bearer fh_live_your_api_key"

# Filter by provider
curl -X GET "https://apis.fotohub.app/v1/models?provider=google" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

```javascript
const response = await fetch('https://apis.fotohub.app/v1/models?category=image', {
  headers: {
    'Authorization': 'Bearer fh_live_your_api_key'
  }
});

const { models } = await response.json();

// Find cheapest model
const cheapest = models.sort((a, b) => a.pricing.price_pln - b.pricing.price_pln)[0];
console.log(`Cheapest: ${cheapest.name} at ${cheapest.pricing.price_pln} PLN`);
```

---

## Pricing Notes

All pricing is shown in PLN (Polish Zloty). Credits are deducted from your monthly plan allowance; wallet charges apply when credits are exhausted.

- Prices marked with **\*** are token-based estimates for a standard 1024x1024 generation (~4096 tokens). Actual cost depends on output resolution.
- All other prices are fixed per operation.
- Chat models use blended token pricing (input + output averaged). See [Billing](/api/billing) for exact input/output rates.

---

## Image Generation Models

25 models from 7 providers. Models are sorted by price within each provider group.

### Google — Imagen

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `imagen-3-fast` | Imagen 3 Fast | 0.12 | 1 | per image, 512px | active |
| `imagen-3-standard` | Imagen 3 Standard | 0.24 | 2 | per image, 1K | active |
| `imagen-4-fast` | Imagen 4 Fast | 0.18 | 2 | per image, 1K | active |
| `imagen-4-standard` | Imagen 4 Standard | 0.45 | 3 | per image, 1K-2K | active |
| `imagen-4-ultra` | Imagen 4 Ultra | 0.90 | 5 | per image, 4K | active |

**Recommended:** `imagen-4-standard` -- Best balance of quality and cost for general-purpose photorealistic generation at up to 2K resolution.

### OpenAI — DALL-E and GPT Image

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `dall-e-3-standard` | DALL-E 3 | 0.24 | 2 | per image, 1K | active |
| `dall-e-3-hd` | DALL-E 3 HD | 0.48 | 4 | per image, 2K | active |
| `gpt-image-1` | GPT Image 1 | 0.60 | 4 | per image, 1K-2K | active |

**Use case:** Strong text rendering in images, creative illustrations, and artistic compositions.

### BytePlus — SeedDream (Token-based)

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `seedream-4-0-250828` | SeedDream 4.0 | 0.049* | 2 | ~price at 1024x1024 | active |
| `seedream-5-0-260128` | SeedDream 5.0 Lite | 0.049* | 2 | ~price at 1024x1024 | active |
| `seedream-4-5-251128` | SeedDream 4.5 | 0.061* | 3 | ~price at 1024x1024 | active |
| `seededit-3-0-i2i-250628` | SeedEdit 3.0 | 0.061* | 3 | image-to-image | active |
| `dola-seedream-5-0-pro-260628` | SeedDream 5.0 Pro | 0.086* | 3 | ~price at 1024x1024 | active |

**Recommended:** `dola-seedream-5-0-pro-260628` -- Highest detail and prompt adherence among budget models. Supports up to 4K output.

**Note:** SeedDream models use token-based billing. The price scales with output resolution. Prices shown are estimates for standard 1024x1024 generation.

### xAI — Grok Imagine

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `grok-imagine-image` | Grok Imagine | 0.12 | 1 | per image, 1K | active |
| `grok-imagine-image-pro` | Grok Imagine Pro | 0.42 | 4 | per image, 2K | active |

**Use case:** Creative and artistic generation with strong style diversity.

### BFL — FLUX

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `flux-2-klein-4b` | FLUX.2 Klein 4B | 0.084 | 1 | per image, 1K (ultra-fast) | active |
| `flux-2-pro` | FLUX.2 Pro | 0.18 | 2 | per image, 1K | active |
| `flux-1.1-pro` | FLUX 1.1 Pro | 0.24 | 2 | per image, 1K | active |
| `flux-kontext-pro` | FLUX Kontext Pro | 0.24 | 2 | per image, context-aware | active |
| `flux-1.1-pro-ultra` | FLUX 1.1 Pro Ultra | 0.36 | 3 | per image, 4K | active |
| `flux-2-max` | FLUX.2 Max | 0.42 | 4 | per image, 4K | active |
| `flux-kontext-max` | FLUX Kontext Max | 0.48 | 4 | per image, 2K | active |

**Use case:** `flux-2-klein-4b` for sub-second inference (prototyping, real-time apps). `flux-kontext-pro` and `flux-kontext-max` for context-aware editing and character consistency.

### MiniMax

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `minimax-image-01` | MiniMax Image | 0.021 | 1 | per image, 1K | active |

**Use case:** Cheapest image model on the platform. Good for bulk generation, thumbnails, and non-critical applications where cost is the primary concern.

### Kling — Image

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `kling-v2-1` | Kling v2.1 | 0.24 | 2 | per image, 1K | active |
| `kling-v3` | Kling v3 | 0.60 | 5 | per image, 1K | active |
| `kling-v3-omni` | Kling v3 Omni | 0.90 | 8 | per image, 2K | active |

**Use case:** Versatile multi-style generation. Kling v3 Omni excels at both photorealistic and artistic styles.

---

## Video Generation Models

7 models for text-to-video and image-to-video generation. Priced per 5-second clip of output video.

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `wan-2.1` | Wan 2.1 | 0.90 | 8 | per 5-sec clip | active |
| `hunyuan-video` | Hunyuan Video | 1.20 | 10 | per 5-sec clip | active |
| `veo-2` | Veo 2 (Google) | 1.50 | 10 | per 5-sec clip | active |
| `kling-v2-master` | Kling v2 Master | 1.80 | 15 | per 5-sec clip | active |
| `runway-gen4` | Runway Gen-4 | 2.10 | 18 | per 5-sec clip | active |
| `kling-v2.5-master` | Kling v2.5 Master | 2.40 | 20 | per 5-sec clip | active |
| `veo-3` | Veo 3 (Google) | 3.00 | 25 | per 5-sec clip | active |

**Recommended:** `kling-v2.5-master` -- Best overall video quality with strong motion coherence and prompt adherence.

**Budget pick:** `wan-2.1` -- Lowest cost per clip with acceptable quality for social media content.

**Premium pick:** `veo-3` -- Highest quality, cinematic output with natural lighting and camera motion.

---

## Chat and LLM Models

15 models accessible via the OpenAI-compatible `/v1/chat/completions` endpoint. Token-based billing (per 1K tokens).

### Anthropic

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `claude-3.5-haiku` | Claude 3.5 Haiku | 0.005 | 1 | per 1K tokens | active |
| `claude-sonnet-4-20250514` | Claude Sonnet 4 | 0.018 | 1 | per 1K tokens | active |
| `claude-opus-4-20250514` | Claude Opus 4 | 0.090 | 5 | per 1K tokens | active |

### OpenAI

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `gpt-4.1-nano` | GPT-4.1 Nano | 0.001 | 1 | per 1K tokens | active |
| `gpt-4o-mini` | GPT-4o Mini | 0.002 | 1 | per 1K tokens | active |
| `gpt-4.1-mini` | GPT-4.1 Mini | 0.003 | 1 | per 1K tokens | active |
| `gpt-4.1` | GPT-4.1 | 0.012 | 1 | per 1K tokens | active |
| `gpt-4o` | GPT-4o | 0.015 | 1 | per 1K tokens | active |

**Recommended:** `gpt-4o` -- Best general-purpose chat model. Strong reasoning, fast, reliable.

### Google

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `gemini-2.0-flash` | Gemini 2.0 Flash | 0.001 | 1 | per 1K tokens | active |
| `gemini-2.5-flash` | Gemini 2.5 Flash | 0.002 | 1 | per 1K tokens | active |
| `gemini-2.5-pro` | Gemini 2.5 Pro | 0.008 | 1 | per 1K tokens | active |

### DeepSeek

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `deepseek-v3` | DeepSeek V3 | 0.002 | 1 | per 1K tokens | active |
| `deepseek-r1` | DeepSeek R1 | 0.005 | 1 | per 1K tokens | active |

### xAI

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `grok-3-mini` | Grok 3 Mini | 0.004 | 1 | per 1K tokens | active |
| `grok-3` | Grok 3 | 0.018 | 1 | per 1K tokens | active |

::: info Token Billing
Chat models are billed per token processed (input + output). The price shown is a blended average per 1K tokens. Input tokens are generally cheaper than output tokens. See the [Billing](/api/billing) section for exact per-direction rates.
:::

---

## Music and Audio Models

6 models for music generation, sound effects, text-to-speech, and speech-to-text.

### Music Generation

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `minimax-music-01` | MiniMax Music | 0.18 | 2 | per 30-sec track | active |
| `stable-audio-2` | Stable Audio 2.0 | 0.36 | 3 | per 30-sec track | active |
| `mmaudio` | MMAudio | 0.24 | 2 | per 10-sec clip | active |

**Use case:** `minimax-music-01` for background music and jingles. `stable-audio-2` for higher quality production music. `mmaudio` for short sound effects and audio-for-video.

### Text-to-Speech (TTS)

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `chatterbox-tts` | Chatterbox TTS | 0.06 | 1 | per 1K characters | active |
| `elevenlabs-tts` | ElevenLabs TTS | 0.18 | 2 | per 1K characters | active |

**Use case:** `chatterbox-tts` for budget voiceovers and narration. `elevenlabs-tts` for premium natural-sounding voices with emotion control and voice cloning.

### Speech-to-Text (STT)

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `whisper-large-v3` | Whisper Large v3 | 0.06 | 1 | per minute of audio | active |

**Use case:** Transcription, subtitles, meeting notes. Supports 99+ languages with automatic language detection.

---

## Analysis Models

4 models for image analysis, captioning, OCR, and visual Q&A.

| Model ID | Name | Price (PLN) | Credits | Unit | Status |
|----------|------|-------------|---------|------|--------|
| `gemini-2.5-flash-vision` | Gemini 2.5 Flash Vision | 0.003 | 1 | per image analyzed | active |
| `gemini-2.5-pro-vision` | Gemini 2.5 Pro Vision | 0.008 | 1 | per image analyzed | active |
| `gpt-4o-vision` | GPT-4o Vision | 0.012 | 1 | per image analyzed | active |
| `claude-sonnet-4-vision` | Claude Sonnet 4 Vision | 0.015 | 1 | per image analyzed | active |

**Recommended:** `gemini-2.5-pro-vision` -- Best accuracy-to-cost ratio for image understanding, OCR, and detailed captioning.

**Budget pick:** `gemini-2.5-flash-vision` -- Fastest and cheapest, suitable for bulk analysis and classification tasks.

---

## Storage and Compute Resources

Resources included with plans. Overage charged from wallet.

| Resource | Included | Overage Rate | Notes |
|----------|----------|--------------|-------|
| File Storage | 10 GB | 0.10 PLN/GB/month | Images, videos, audio files |
| Bandwidth | 50 GB | 0.05 PLN/GB | Download transfers |
| Agent Compute | 100 minutes | 0.30 PLN/minute | Firecracker microVMs |
| Batch Processing | 1,000 jobs | 0.01 PLN/job | Async job queue |

---

## Model Selection Guide

Choosing the right model depends on your priorities: quality, speed, cost, or resolution.

### Best for Quality

- `imagen-4-ultra` -- 4K photorealistic, highest fidelity from Google
- `dola-seedream-5-0-pro-260628` -- Highest detail and prompt adherence
- `kling-v3-omni` -- Versatile multi-style with exceptional coherence

### Best for Speed

- `flux-2-klein-4b` -- Sub-second inference, ideal for real-time apps
- `imagen-3-fast` -- Optimized pipeline, fast with good quality
- `imagen-4-fast` -- Latest generation, fast variant

### Best Value (Cost)

- `minimax-image-01` -- 0.021 PLN per image, cheapest on platform
- `seedream-4-0-250828` -- Excellent quality-to-price ratio at 0.049 PLN
- `seedream-5-0-260128` -- Latest generation at budget pricing

### Best for 4K Output

- `imagen-4-ultra` -- Native 4K generation
- `flux-1.1-pro-ultra` -- 4K with fine detail preservation
- `flux-2-max` -- 4K output, latest FLUX architecture
- All SeedDream models -- Support up to 4K resolution

---

## Model Status

Each model has one of the following statuses:

| Status | Description |
|--------|-------------|
| `active` | Fully operational, recommended for production use |
| `beta` | Available but may have changes to pricing or behavior |
| `deprecated` | Still functional but scheduled for removal. Migrate to replacement |
| `maintenance` | Temporarily unavailable for updates |

Check model availability programmatically:

```bash
# Get only active models
curl -X GET "https://apis.fotohub.app/v1/models?status=active" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

::: tip Try Before You Commit
Use the FOTOhub Playground at [fotohub.app/playground](https://fotohub.app/playground) to compare models side-by-side with the same prompt before choosing one for production use. Sandbox API keys (`fh_test_`) can be used for testing without incurring charges.
:::
