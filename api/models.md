# Models Catalog

Complete reference of all AI models available through the FOTOhub API. The platform provides access to 50+ models from 10+ providers covering image generation, video creation, chat/LLM, music, audio, and visual analysis. The catalog is served dynamically from `GET /v1/models` — always treat that live response as the source of truth, since models are added and retired frequently.

## List Models

Retrieve the full catalog of available models or filter by category.

### Endpoint

```
GET /v1/models
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category: `image`, `video`, `text`, `audio` |
| `includeInactive` | boolean | Include retired/inactive models in the response (default `false`) |

### Response Format

```json
{
  "models": [
    {
      "id": "imagen-4-standard",
      "name": "Imagen 4 Standard",
      "provider": "Google Vertex AI",
      "category": "image",
      "description": "Google Imagen 4 Standard image generation",
      "pricing_type": "request",
      "input_price_per_1k_tokens": null,
      "output_price_per_1k_tokens": null,
      "request_price": 0.45,
      "currency": "PLN",
      "request_limit_per_minute": 60,
      "token_limit_per_minute": null,
      "context_window": null,
      "max_output_tokens": null,
      "supports_batch": false,
      "is_active": true,
      "features": {},
      "metadata": {}
    }
  ]
}
```

The response is a flat `{ "models": [...] }` array. Each model exposes `pricing_type` (`request` for per-call pricing, or `token` for per-token models), the relevant price field (`request_price`, or `input_price_per_1k_tokens` / `output_price_per_1k_tokens`), plus rate-limit and capability fields. Use `?category=` to filter; the catalog currently returns models across the `image`, `video`, `text`, and `audio` categories.

### Code Example

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# List all image models
models = client.list_models(category="image")
for m in models:
    print(f"{m['id']}: {m['name']} ({m['request_price']} {m['currency']})")

# Find cheapest per-request model
per_request = [m for m in models if m["pricing_type"] == "request"]
cheapest = min(per_request, key=lambda m: m["request_price"])
print(f"Cheapest: {cheapest['name']} at {cheapest['request_price']} {cheapest['currency']}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// List image models
const models = await client.listModels("image");
models.forEach(m => {
  console.log(`${m.id}: ${m.name} (${m.request_price} ${m.currency})`);
});

// Find cheapest per-request model
const perRequest = models.filter(m => m.pricing_type === "request");
const cheapest = perRequest.sort((a, b) => a.request_price - b.request_price)[0];
console.log(`Cheapest: ${cheapest.name} at ${cheapest.request_price} ${cheapest.currency}`);
```

```go [Go]
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

func main() {
    req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/models?category=image", nil)
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)

    var result struct {
        Models []struct {
            ID           string  `json:"id"`
            Name         string  `json:"name"`
            PricingType  string  `json:"pricing_type"`
            RequestPrice float64 `json:"request_price"`
            Currency     string  `json:"currency"`
        } `json:"models"`
    }
    json.Unmarshal(body, &result)

    for _, m := range result.Models {
        fmt.Printf("%s: %s (%.2f %s)\n", m.ID, m.Name, m.RequestPrice, m.Currency)
    }
}
```

```bash [cURL]
# List all active models
curl -X GET "https://apis.fotohub.app/v1/models" \
  -H "Authorization: Bearer fh_live_your_api_key"

# List only image generation models
curl -X GET "https://apis.fotohub.app/v1/models?category=image" \
  -H "Authorization: Bearer fh_live_your_api_key"

# Include retired/inactive models
curl -X GET "https://apis.fotohub.app/v1/models?includeInactive=true" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

---

## Pricing Notes

All pricing is shown in PLN (Polish Zloty). Credits are deducted from your monthly plan allowance; wallet charges apply when credits are exhausted.

- Prices marked with **\*** are token-based estimates for a standard 1024x1024 generation (~4096 tokens). Actual cost depends on output resolution.
- All other prices are fixed per operation.
- Chat models use blended token pricing (input + output averaged). See [Billing](/api/billing) for exact input/output rates.

---

## Image Generation Models

27 image-generation models across multiple providers. Prices below are per-request in PLN, taken from the live `/v1/models` catalog. Query `GET /v1/models?category=image` for the authoritative, always-current list.

### Google — Imagen

| Model ID | Name | Price (PLN) | Unit |
|----------|------|-------------|------|
| `imagen-3-fast` | Imagen 3 Fast | 0.12 | per image, 512px |
| `imagen-3-standard` | Imagen 3 Standard | 0.24 | per image, 1K |
| `imagen-3-capability` | Imagen 3 Capability | 0.24 | per image, editing/capability |
| `imagen-4-standard` | Imagen 4 Standard | 0.45 | per image, 1K-2K |
| `imagen-4-ultra` | Imagen 4 Ultra | 0.90 | per image, 4K |

**Recommended:** `imagen-4-standard` -- Best balance of quality and cost for general-purpose photorealistic generation at up to 2K resolution.

### OpenAI — DALL-E and GPT Image

| Model ID | Name | Price (PLN) | Unit |
|----------|------|-------------|------|
| `dall-e-3-standard` | DALL-E 3 | 0.24 | per image, 1K |
| `dall-e-3-hd` | DALL-E 3 HD | 0.48 | per image, 2K |
| `gpt-image-1` | GPT Image 1 | 0.60 | per image, 1K-2K |

**Use case:** Strong text rendering in images, creative illustrations, premium photorealism.

### BytePlus — SeedDream

| Model ID | Name | Price (PLN) | Unit |
|----------|------|-------------|------|
| `seedream-4-0-250828` | SeedDream 4.0 | 0.18 | per image |
| `seedream-5-0-260128` | SeedDream 5.0 | 0.21 | per image |
| `seedream-4-5-251128` | SeedDream 4.5 | 0.24 | per image |
| `seededit-3-0-i2i-250628` | SeedEdit 3.0 | 0.24 | image-to-image |
| `dola-seedream-5-0-pro-260628` | SeedDream 5.0 Pro | 0.27 | per image |

**Recommended:** `seedream-5-0-260128` -- Excellent quality-to-price ratio, the default model in most examples. Supports up to 4K output. `dola-seedream-5-0-pro-260628` for highest detail and prompt adherence.

### xAI — Grok Imagine

| Model ID | Name | Price (PLN) | Capabilities |
|----------|------|-------------|--------------|
| `grok-imagine-image` | Grok Imagine | 0.12 | T2I + single-image edit, 1K, multiple aspect ratios |
| `grok-imagine-image-pro` | Grok Imagine Pro | 0.42 | T2I + multi-image combine + higher fidelity, 2K |

**Use cases:** Product photography, e-commerce listings, multi-image combine, social media content.

### BFL — FLUX

FLUX models for text-to-image and context-aware editing. Max resolution: 1440px per side.

| Model ID | Name | Price (PLN) | Unit |
|----------|------|-------------|------|
| `flux-2-klein-4b` | FLUX.2 Klein 4B | 0.084 | per image, budget |
| `flux-2-klein-9b` | FLUX.2 Klein 9B | 0.09 | per image, budget |
| `flux-2-pro` | FLUX.2 Pro | 0.18 | per image, up to 1440px |
| `flux-1.1-pro` | FLUX 1.1 Pro | 0.24 | per image, up to 1440px |
| `flux-kontext-pro` | FLUX Kontext Pro | 0.24 | per image, context-aware editing |
| `flux-1.1-pro-ultra` | FLUX 1.1 Pro Ultra | 0.36 | per image, up to 4MP |
| `flux-2-max` | FLUX.2 Max | 0.42 | per image, max fidelity |
| `flux-kontext-max` | FLUX Kontext Max | 0.48 | per image, premium editing |

**Use case:** `flux-kontext-pro` / `flux-kontext-max` for context-aware editing and style transfer. `flux-2-klein-*` for budget generation. `flux-2-max` for maximum fidelity.

### MiniMax

| Model ID | Name | Price (PLN) | Unit |
|----------|------|-------------|------|
| `minimax-image-01` | MiniMax Image | 0.021 | per image, 1K |

**Use case:** Lowest-cost image generation on the platform.

### Kling — Image

| Model ID | Name | Price (PLN) | Unit |
|----------|------|-------------|------|
| `kling-v2-1` | Kling v2.1 | 0.24 | per image, 1K |
| `kling-v3-image` | Kling v3 | 0.60 | per image, 1K |
| `kling-v3-omni` | Kling v3 Omni | 0.90 | per image, 2K |

**Use case:** Versatile multi-style generation with strong coherence; `kling-v3-omni` for the highest quality.

---

## Video Generation Models

7 models for text-to-video and image-to-video generation. Base cost is per 5-second segment, multiplied by `max(1, duration ÷ 5)` for longer videos.

| Model ID | Name | Base Credits (5s) | Max Duration | Status |
|----------|------|-------------------|--------------|--------|
| `wan-video` | WAN | 8 | 30s | active |
| `hailuo` | Hailuo (MiniMax) | 8 | 30s | active |
| `veo-2` | Veo 2 (Google) | 10 | 30s | active |
| `kling` | Kling Video | 10 | 30s | active |
| `seedance` | Seedance 2.0 (BytePlus) | 10 | 30s | active |
| `sora-2` | Sora 2 (OpenAI) | 12 | 60s | active |
| `veo-3` | Veo 3 (Google) | 15 | 60s | active |

**Recommended:** `veo-3` — Highest quality, cinematic output with natural motion and audio generation.

**Budget pick:** `wan-video` / `hailuo` — Lowest cost per clip with good quality for social media content.

**Best value:** `seedance` — Excellent motion quality at competitive pricing from BytePlus.

---

## Chat and LLM Models

FOTOhub exposes two chat endpoints with different billing models:

- **Credit-based** — `POST /v1/ai/chat/completions`, OpenAI-compatible, streaming, flat credit cost per request (1 credit for flash-tier models, 2 credits otherwise).
- **Token-based** — `POST /v1/ai/chat/claude`, exact per-token billing for premium models (no streaming).

::: warning Canonical chat catalog lives at `/v1/models`
The set of chat model IDs accepted by `/v1/ai/chat/completions` is served dynamically. Always query `GET /v1/models?category=text` for the authoritative list rather than hard-coding IDs. Model families shown below reflect the routing tiers available on the public API; exact IDs and availability change over time.
:::

### Credit-based (`/v1/ai/chat/completions`)

Routes across the following model families. See the [Chat/LLM API Reference](/api/chat-llm) for the current per-model pricing and the canonical ID list.

| Family | Typical tiers | Best for |
|--------|---------------|----------|
| **Claude** | Haiku, Sonnet, Opus | Quality writing, analysis, code |
| **GPT** | flash / standard / pro | Creative, reasoning, general |
| **Gemini** | Flash, Flash-Lite, Pro | Fast, long context, multimodal |
| **Grok** | fast-reasoning, fast | Real-time knowledge, reasoning |
| **Qwen** | Max, Plus, Flash, Coder | Multilingual, code, vision |
| **Kimi** | K2, K2 Thinking | 1M context, deep reasoning |
| **DeepSeek** | V3.x | Reasoning, code, budget |

**Budget pick:** a Gemini or Nova flash-tier model bills 1 credit. All other models bill 2 credits per request.

### Token-based premium (`/v1/ai/chat/claude`)

Nine premium models billed by exact input/output token usage: Claude Sonnet 4.6 / 4.5 / 4, Claude Haiku 4.5, and Amazon Nova Pro / Lite / Micro / Premier / 2 Lite. See [Chat/LLM → Premium Chat](/api/chat-llm) for token rates.

::: info Billing
Credit-based charges a flat, predictable fee per request. Token-based charges exact per-token rates (pay only for what you use). See [Chat/LLM API Reference](/api/chat-llm) for full pricing tables.
:::

---

## Music and Audio Models

### Music Generation

| Model ID | Name | Credits | Duration | Status |
|----------|------|---------|----------|--------|
| `ida-music` | IDA Music | 2–4 | up to 5 min | active |
| `minimax` | MiniMax Music | 5/10/25 | 30s/60s/120s | active |
| `ida-cloud` | IDA Cloud Music | 5/10/25 | 30s/60s/120s | active |

**IDA Music** — FOTOhub's proprietary music model. Supports lyrics, instrumental, 30+ genres, quality presets. 2 credits (standard) / 4 credits (high quality).

**MiniMax / IDA Cloud** — Cloud music generation. Tiered pricing by duration: 5cr (≤30s), 10cr (≤60s), 25cr (>60s).

### Sound Effects (SFX)

| Model ID | Credits | Duration | Status |
|----------|---------|----------|--------|
| `sfx` | 3 | up to 30s | active |

Text-to-SFX generation via `/v1/ai/generate/sfx`. Uses `prompt` field for description.

### Text-to-Speech (TTS)

| Provider | Credits | Features |
|----------|---------|----------|
| **AWS Polly** | 1 per 10K chars | 106 voices, 41 languages, neural + generative engines |
| Google TTS | 1 | 30+ languages, neural voices |
| IDA Voice Pro | 2 | Voice cloning, emotion control, 29 languages |

**AWS Polly** — cheapest TTS option. 106 voices (neural + generative), 41 languages including Polish. See [Music & Audio → Polly](/api/music-audio#text-to-speech-polly).

### Speech-to-Text (STT)

| Model | Credits | Features |
|-------|---------|----------|
| **Voxtral Small 24B** | 2 | LLM-quality transcription, context understanding |
| **Voxtral Mini 3B** | 1 | Fast budget transcription |
| Whisper Large v3 | 1 | 99+ languages, auto-detection, timestamps |

**Voxtral** — Mistral's speech-to-text LLM. Better context understanding than traditional ASR. See [Music & Audio → Voxtral](/api/music-audio#speech-to-text-voxtral).

**Use case:** Transcription, subtitles, meeting notes, dubbing pipelines.

---

## Analysis & Document Models

Image analysis, detection, OCR, and photo intelligence. These are returned under the `image` category in `/v1/models`.

| Model ID | Name | Price (PLN) | Unit |
|----------|------|-------------|------|
| `photo-analysis` | Photo Analysis | 0.06 | per image analyzed |
| `face-detection` | Face Detection | 0.06 | per image analyzed |
| `nsfw-detection` | NSFW / Safety Detection | 0.03 | per image analyzed |
| `ocr` | OCR (text extraction) | 0.09 | per image analyzed |

**Recommended:** `photo-analysis` -- General-purpose image understanding, captioning, and content classification.

**Budget pick:** `nsfw-detection` -- Fast, low-cost content-safety classification for moderation pipelines.

### Document Intelligence (Textract)

| Operation | Credits | Use Case |
|-----------|---------|----------|
| `detect-text` (OCR) | 1 | Simple text extraction from images/documents |
| `analyze` (Tables+Forms) | 3 | Table/form structured extraction |
| `analyze-expense` (Invoices) | 5 | Invoice/receipt data extraction |

See [Document Intelligence](/api/document-intelligence) for full API reference.

---

## 3D Generation Models

5 models for converting images or text to 3D assets. See [3D Generation](/api/3d-generation) for full API reference.

| Model ID | Name | Credits | Speed | Modes | Quality |
|----------|------|---------|-------|-------|---------|
| `triposr` | FH Lite 3D | 5 | ~3s | image-to-3d | ★★★ |
| `sf3d` | FH Fast 3D | 5 | <1s | image-to-3d | ★★★★ |
| `shap-e` | FH Text 3D | 10 | ~15s | text-to-3d | ★★ |
| `trellis` | FH HD 3D | 15 | ~15s | image-to-3d | ★★★★★ |
| `hunyuan3d` | FH Pro 3D | 25 | ~30s | both | ★★★★★ |

**Recommended:** `triposr` — Best speed-to-quality ratio for product photography and e-commerce use cases.

**Premium pick:** `hunyuan3d` — Highest quality with PBR textures, supports both image and text input. Ideal for production 3D assets.

**Output formats:** GLB (web/AR), OBJ (editing), STL (3D printing), USDZ (Apple AR).

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

- `imagen-3-fast` -- Optimized pipeline, fast with good quality
- `flux-2-klein-4b` -- Budget FLUX variant, fast at 0.084 PLN
- `grok-imagine-image` -- Fast inference at 0.12 PLN per image

### Best Value (Cost)

- `minimax-image-01` -- 0.021 PLN per image, cheapest on platform
- `flux-2-klein-4b` -- FLUX quality at 0.084 PLN
- `seedream-5-0-260128` -- Latest SeedDream generation at 0.21 PLN

### Best for 4K Output

- `imagen-4-ultra` -- Native 4K generation
- `dola-seedream-5-0-pro-260628` -- Highest detail SeedDream, supports up to 4K
- All SeedDream models -- Support up to 4K resolution

---

## Model Availability

Each model exposes an `is_active` boolean. Active models are fully operational and recommended for production use; inactive models are retired or temporarily disabled and are excluded from the default catalog response.

Check model availability programmatically:

```bash
# Get active models (default — inactive models are excluded)
curl -X GET "https://apis.fotohub.app/v1/models" \
  -H "Authorization: Bearer fh_live_your_api_key"

# Include retired/inactive models
curl -X GET "https://apis.fotohub.app/v1/models?includeInactive=true" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

::: tip Try Before You Commit
Use the FOTOhub Playground at [fotohub.app/playground](https://fotohub.app/playground) to compare models side-by-side with the same prompt before choosing one for production use. Sandbox API keys (`fh_test_`) can be used for testing without incurring charges.
:::

---

## Image Processing Tools

Professional image editing via Stability AI and FOTOhub proprietary engines.

| Tool | Credits | Description |
|------|---------|-------------|
| `upscale` (fast) | 2 | 2x AI upscale, instant |
| `upscale` (creative) | 3 | 4x AI upscale with detail enhancement |
| `remove_background` | 2 | Automatic background removal to transparent PNG |
| `erase` | 2 | Content-aware object removal via mask |
| `inpaint` | 2 | Generate new content in masked area |
| `outpaint` | 2 | Extend canvas in any direction |
| `search_replace` | 2 | Replace objects by text description |
| `recolor` | 2 | Change color of specific objects |
| `style_transfer` | 2 | Apply style from reference image |
| Color grading | 1 | AI color correction and grading |
| AI enhance | 1 | Automatic image enhancement |
| AI denoise | 1 | Remove noise while preserving detail |
| B&W colorization | 2 | Colorize black & white photos |
| Face restoration | 2 | Restore degraded/old faces |
| Depth map | 2 | Generate depth map from image |
| CLIP tagging | 1 | Auto-generate descriptive tags |

See [Image Processing](/api/image-processing) for full API reference.

---

## Lip-Sync & Face Animation

| Model | Credits | Speed | Quality | Description |
|-------|---------|-------|---------|-------------|
| `musetalk` | 8 | Fast | Good | Real-time lip-sync, MuseTalk 1.5 |
| `latentsync` | 15 | Medium | High | HD diffusion-based, LatentSync 1.6 |
| `facefusion` | 20 | Slow | Ultra | Multi-stage pipeline, FaceFusion 3.x |

See [Lip-Sync](/api/lip-sync) for full API reference.

---

## Shorts & Video Pipeline

Automated video-to-shorts pipeline with AI-powered editing.

| Step | Credits | Description |
|------|---------|-------------|
| Ingest | 2 | Upload and analyze video |
| Transcribe | 2 | Speech-to-text with WhisperX |
| Detect Scenes | 3 | Automatic scene boundaries |
| Generate Clips | 5 | AI-selected best moments |
| Captions | 2 | Auto-generated subtitles |
| Reframe | 3 | Smart aspect ratio adaptation |
| Render | 5 | Final short video output |
| **Full Agent** | **15** | **Entire pipeline automated** |

See [Shorts & Clips](/api/shorts-clips) for full API reference.

---

## Gabriel AI — Intelligent Orchestrator

Gabriel is FOTOhub's AI routing layer that classifies user intent and selects the optimal model automatically, balancing quality, speed, and cost.

| Endpoint | Latency | Description |
|----------|---------|-------------|
| `POST /v1/ai/gabriel` | ~200ms | Classify intent → recommend model |
| `POST /v1/ai/gabriel/stream` | SSE | Real-time thinking + routing stream |
| `POST /v1/ai/gabriel/suggest` | <50ms | Autocomplete suggestions |
| `POST /v1/ai/gabriel/recommend` | ~100ms | Context-aware recommendations |

**How it works:** Send a natural language prompt → Gabriel analyzes intent, estimates cost, selects the best model for quality/cost ratio, and optionally enhances your prompt before generation.

See [Gabriel AI](/api/gabriel-ai) for full API reference.

---

## MCP Server — 30 AI Tools for Assistants

FOTOhub exposes all capabilities as MCP (Model Context Protocol) tools, enabling AI assistants like Claude, Cursor, and VS Code Copilot to generate images, videos, music, and more.

| Domain | Tools | Examples |
|--------|-------|---------|
| Image | 8 | generate_image, edit_image, upscale, remove_bg, analyze |
| Video | 7 | generate_video, check_status, edit_video, generate_shorts |
| Audio | 6 | generate_music, generate_sfx, tts, transcribe, voice_clone |
| Chat | 3 | chat, chat_stream, enhance_prompt |
| Utility | 4 | check_balance, list_models, get_pricing, translate |
| Training | 2 | fine_tune, check_training_status |

**Transport:** Streamable HTTP at `https://apis.fotohub.app/mcp/`
**Auth:** Bearer `fh_live_*` tokens
**Health:** `GET https://apis.fotohub.app/mcp/health`

See [MCP Integration](/api/mcp) for tool reference and configuration examples.

---

## API Plans & Pricing Tiers

| Plan | Price/month | Credits | RPM | Storage | Key Features |
|------|-------------|---------|-----|---------|--------------|
| **Free** | 0 PLN | 50 | 10 | 1 GB | Basic models, 1 API key |
| **Developer** | 49 PLN | 500 | 60 | 10 GB | All standard models, 5 keys |
| **Startup** | 199 PLN | 5,000 | 300 | 100 GB | All + premium + beta, webhooks, 20 keys |
| **Business** | 799 PLN | 25,000 | 1,000 | 500 GB | Dedicated support, 99.9% SLA, unlimited keys |
| **Enterprise** | Custom | Unlimited | 5,000 | Unlimited | Custom models, SSO/SAML, dedicated infra |

See [Billing & Pricing](/api/billing) for full details, top-up packages, and wallet management.
