# IDA Q 1.0

IDA Q 1.0 is FOTOhub's proprietary text-to-image generation model, built and hosted entirely on our own GPU infrastructure. It is the third pillar of FOTOhub's in-house AI stack, alongside [Gabriel AI](/api/gabriel-ai) (the platform orchestrator) and IDA Voice & Audio (our text-to-speech and music engine).

IDA Q 1.0 is engineered around three things that most image models get wrong: precise text rendering, deliberate composition control, and native multilingual understanding. Every prompt — regardless of language — is automatically translated and restructured by FOTOhub's own prompt engine before it reaches the model, so you never need to write prompt-engineering boilerplate yourself.

::: info Asynchronous generation
Unlike every other model on this platform, IDA Q 1.0 runs on a single dedicated GPU behind a global queue. Generation takes 30 seconds to ~3.5 minutes depending on resolution — `POST /v1/ai/generate/image` with `model: "ida-q-image"` returns immediately with a `job_id`, and you poll a separate status endpoint until it's done. Both official SDKs handle this transparently — see [Code Examples](#code-examples).
:::

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/ai/generate/image` (with `model: "ida-q-image"`) | API key | Submit a generation job — returns `202` with `job_id` |
| GET | `/v1/ai/generate/image/ida-q/{job_id}` | API key | Poll job status — returns the finished images once complete |

---

## POST /v1/ai/generate/image

Submit an IDA Q 1.0 generation request. Billing happens at submit time — the credits are spent whether or not you ever poll for the result, so make sure to retrieve it via the `poll_url`.

**Authentication:** API key (`fh_live_*` / `fh_test_*`)

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|--------------|
| `prompt` | string | Yes | Description of the desired image, in any language. Quoted text (e.g. `"Open Now"`) is preserved verbatim in the output; everything else is translated and expanded automatically. |
| `model` | string | Yes | Must be `"ida-q-image"`. |
| `aspect_ratio` | string | No | One of `"1:1"`, `"16:9"`, `"9:16"`, `"4:3"`, `"3:4"`, `"3:2"`, `"2:3"`, `"21:9"`. Defaults to `"1:1"`. Any other value silently falls back to `1:1`. |
| `image_size` | string | No | Resolution tier: `"1K"` (1024×1024, ~30s), `"1.5K"` (1536×1536, ~90s), or `"2K"` (2048×2048, ~3.5min). Defaults to `"1K"`. |
| `num_images` | integer | No | Number of images per request. **Hard cap: 2.** Values above 2 are silently clamped. |
| `seed` | integer | No | Seed for reproducible generation. Range: 0–4294967295. |

### Response — 202 Accepted

```json
{
  "model": "ida-q-image",
  "job_id": "8f4e2a1c-9b3d-4c5e-8a1f-2d3e4f5a6b7c",
  "status": "queued",
  "credits_used": 0.5,
  "billing": {
    "method": "credits",
    "pln_charged": 0
  },
  "estimated_seconds": 30,
  "poll_url": "https://apis.fotohub.app/v1/ai/generate/image/ida-q/8f4e2a1c-9b3d-4c5e-8a1f-2d3e4f5a6b7c"
}
```

### Examples

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="your-api-key")

# generate_ida_q() submits the job and polls for you — one call, finished result.
result = client.generate_ida_q(
    prompt="A cinematic portrait of an astronaut on Mars at sunset, dramatic lighting",
    aspect_ratio="16:9",
    image_size="1.5K",
)

print(result["images"][0])
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: 'your-api-key' });

// generateIdaQ() submits the job and polls for you — one call, finished result.
const result = await client.generateIdaQ({
  prompt: 'A cinematic portrait of an astronaut on Mars at sunset, dramatic lighting',
  aspect_ratio: '16:9',
  image_size: '1.5K',
});

console.log(result.images[0]);
```

```bash [cURL]
# Step 1: submit
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -d '{
    "prompt": "A cinematic portrait of an astronaut on Mars at sunset, dramatic lighting",
    "model": "ida-q-image",
    "aspect_ratio": "16:9",
    "image_size": "1.5K"
  }'

# Step 2: poll (repeat every few seconds until status is "completed" or "failed")
curl https://apis.fotohub.app/v1/ai/generate/image/ida-q/8f4e2a1c-9b3d-4c5e-8a1f-2d3e4f5a6b7c \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```

:::

---

## GET /v1/ai/generate/image/ida-q/{job_id}

Poll the status of a submitted IDA Q 1.0 job. Returns immediately with the current state — call it in a loop with a short delay (both SDKs do this for you at a 3-second interval).

**Authentication:** API key (must be the same account that submitted the job)

### Response

| Field | Type | Description |
|-------|------|--------------|
| `job_id` | string | The job identifier |
| `status` | string | `"queued"` \| `"processing"` \| `"completed"` \| `"failed"` |
| `progress` | integer | 0–100 |
| `estimated_seconds` | integer | Original estimate at submit time |
| `images` | string[] | Present only when `status: "completed"` |
| `metadata` | object | Present only when `status: "completed"` |
| `error` | string | Present only when `status: "failed"` — a safe, user-facing message (never a stack trace or internal error) |

```json
// While processing:
{ "job_id": "8f4e2a1c-...", "status": "processing", "progress": 60, "estimated_seconds": 30 }

// When done:
{
  "job_id": "8f4e2a1c-...",
  "status": "completed",
  "progress": 100,
  "images": ["https://s1.fotohub.app/storage/v1/object/public/photos/.../ai-gen-....png"],
  "metadata": { "model": "ida-q-image" }
}
```

---

## Capabilities

| Feature | IDA Q 1.0 |
|---|---|
| Text-to-image | Yes |
| Image editing / img2img | No |
| Max images per request | 2 |
| Max resolution | 2048 × 2048 |
| Aspect ratios | `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `21:9` |
| Text rendering on images | Best-in-class — headlines, labels, signage render cleanly |
| Multilingual prompts | Yes — automatic translation, any input language |
| Negative prompt | Not supported |
| Guidance scale / steps | Not exposed (handled internally) |
| Seed control | Yes |
| Generation mode | Asynchronous (queue + poll) |

---

## How Prompt Structuring Works

IDA Q 1.0 was trained on richly structured scene descriptions, not bare keyword strings — a prompt like `"a cat"` gives the model far less to work with than a full description of the scene, lighting, and composition. Writing that level of detail by hand for every request is tedious, so FOTOhub built an automatic prompt engine that sits in front of the model and does it for you.

Every prompt you send passes through this engine before generation:

1. **Translation.** Any input language is translated to English. Quoted text — signage, labels, brand names — is preserved exactly as written, in its original language and script.
2. **Structuring.** The scene is decomposed into a **background** (the setting — walls, sky, ground, ambient light) and a list of **elements** (the distinct subjects, objects, and text in the scene), each with its own detailed description. Where useful, elements are given normalized bounding-box coordinates so the model knows roughly where each thing belongs in the frame.
3. **Generation.** The structured description — not your raw text — is what actually drives the model.

This all happens automatically and is not something you configure or see in the API response; it's internal to how IDA Q 1.0 turns your idea into pixels. Conceptually, though, a short prompt like:

```
A cinematic portrait of an astronaut on Mars at sunset, holding a sign that says "Earth Calling"
```

is expanded, roughly, into something shaped like:

```json
{
  "high_level_description": "A cinematic portrait of an astronaut standing on the Martian surface at sunset, holding up a handheld sign.",
  "compositional_deconstruction": {
    "background": "The rust-colored Martian desert stretches to the horizon under a dusty orange-brown sky, the sun low and hazy near the horizon line, distant low hills barely visible through atmospheric haze.",
    "elements": [
      { "type": "obj", "desc": "An astronaut in a white pressurized spacesuit with a reflective gold-tinted visor, standing centered in the frame, one arm raised holding a sign toward the camera." },
      { "type": "text", "text": "Earth Calling", "desc": "Bold white lettering on a dark handheld placard, angled slightly toward the viewer." }
    ]
  }
}
```

The practical takeaway: you don't need to write JSON or think about backgrounds/elements/bounding-boxes yourself — just describe the scene the way you naturally would, in whatever language you like, and be as specific as you want about named subjects, quoted text, and details you care about. The engine fills in the structure; it never discards or genericizes what you explicitly asked for.

---

## Pricing

| Model | Price | Notes |
|---|---|---|
| **IDA Q 1.0** | **0.10 PLN / request** (0.5 credits) | Self-hosted, FOTOhub proprietary |
| Nano Banana (Gemini 2.5 Flash Image) | 0.40 PLN / request | Third-party, for comparison |
| GPT Image 2 | 2.00 PLN / request | Third-party, for comparison |

::: tip Cost Advantage
IDA Q 1.0 costs a fraction of Google's Nano Banana (Gemini Flash Image) and 20x less than GPT Image 2 — because it runs on FOTOhub's own infrastructure with no third-party licensing fee to pass through. `num_images: 2` charges 2x the base rate.
:::

---

## Benchmarks

On the independent **DesignArena** benchmark (Elo rating, real-world design task quality), IDA Q 1.0's underlying engine ranks **5th in the world**:

| Rank | Model | Elo |
|---|---|---|
| 1 | GPT Image 2 | 1405 |
| 2 | GPT-Image-1.5 | 1327 |
| 3 | Gemini 3.1 Flash Image Gen 2K | 1318 |
| 4 | Gemini 3.1 Flash Image Gen | 1310 |
| **5** | **IDA Q 1.0** | **1285** |
| 6 | Gemini 3 Pro Image Gen 2K (Nano) | 1284 |
| 7 | Gemini 3 Pro Image Preview | 1259 |
| — | Recraft V4.1 Utility Pro | 1245 |
| — | Krea 2 Medium / Large | 1245 / 1235 |
| — | FLUX.2 [flex] / [pro] | 1244 / 1239 |
| — | Seedream Lite 5.0 | 1236 |
| — | Imagen 4 Ultra Generate Preview | 1233 |

IDA Q 1.0 clearly outperforms Recraft, Krea 2, FLUX.2, Seedream Lite, and Imagen 4 Ultra — models that are today's standard across many design tools — while sitting just below the very top tier (GPT Image 2, GPT-Image-1.5, Gemini 3.1 Flash).

---

## Code Examples

### Basic generation

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="your-api-key")

result = client.generate_ida_q(
    prompt="A minimalist poster with the headline 'Future of Creation' in bold sans-serif type, deep blue and orange gradient background"
)

for url in result["images"]:
    print(url)
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: 'your-api-key' });

const result = await client.generateIdaQ({
  prompt: "A minimalist poster with the headline 'Future of Creation' in bold sans-serif type, deep blue and orange gradient background",
});

for (const url of result.images) {
  console.log(url);
}
```

:::

### High resolution (2K, longer wait)

::: code-group

```python [Python]
result = client.generate_ida_q(
    prompt="Luxurious minimalist living room interior with large windows, concrete walls, natural daylight",
    aspect_ratio="16:9",
    image_size="2K",       # ~3.5 minutes
    timeout=300,           # give it enough time to finish
)
```

```typescript [TypeScript]
const result = await client.generateIdaQ({
  prompt: 'Luxurious minimalist living room interior with large windows, concrete walls, natural daylight',
  aspect_ratio: '16:9',
  image_size: '2K',            // ~3.5 minutes
  timeout_seconds: 300,        // give it enough time to finish
});
```

:::

### Multilingual prompt with quoted text

::: code-group

```python [Python]
# Polish prompt with a quoted sign — the scene is translated, "Dzień dobry" stays verbatim.
result = client.generate_ida_q(
    prompt="Filiżanka gorącej kawy na drewnianym stole w kawiarni, obok kartka z odręcznym napisem 'Dzień dobry', poranne światło",
    aspect_ratio="1:1",
)
```

```typescript [TypeScript]
// Polish prompt with a quoted sign — the scene is translated, "Dzień dobry" stays verbatim.
const result = await client.generateIdaQ({
  prompt: "Filiżanka gorącej kawy na drewnianym stole w kawiarni, obok kartka z odręcznym napisem 'Dzień dobry', poranne światło",
  aspect_ratio: '1:1',
});
```

:::

### Manual submit + poll (without SDK helpers)

```bash
JOB=$(curl -s -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A neon-lit sports car at night, wet street reflections", "model": "ida-q-image", "aspect_ratio": "16:9"}')

JOB_ID=$(echo $JOB | jq -r '.job_id')

until [ "$(curl -s https://apis.fotohub.app/v1/ai/generate/image/ida-q/$JOB_ID -H "Authorization: Bearer fh_live_YOUR_API_KEY" | jq -r '.status')" = "completed" ]; do
  sleep 3
done

curl -s https://apis.fotohub.app/v1/ai/generate/image/ida-q/$JOB_ID -H "Authorization: Bearer fh_live_YOUR_API_KEY" | jq '.images'
```

---

## Rate Limits & Queue

IDA Q 1.0 runs on a single dedicated GPU — unlike third-party models, it cannot burst-scale on demand. A global queue serves all requests across every account:

- **Max concurrent generation:** 1 job at a time, platform-wide.
- **Max queue length:** 25 jobs. New submissions beyond this return `429` with `code: "QUEUE_FULL"` and are automatically refunded.
- **Typical wait**, in addition to your own job's generation time: up to several minutes under load. Check `estimated_seconds` in the submit response for your own job's expected generation time (queue wait is not included in that figure).

If low, predictable latency matters more than cost for your use case, consider a third-party model (see the [Model Comparison Table](/api/image-generation#model-comparison-table)) for that specific request.

---

## Error Handling

| Status | Code | Meaning |
|---|---|---|
| 400 | `validation_error` | Missing `prompt`, or malformed request |
| 401 | `unauthorized` | Missing or invalid API key |
| 402 | `insufficient_credits` | Not enough credits/wallet balance to bill the request |
| 404 | — | `job_id` not found, or belongs to a different account |
| 429 | `QUEUE_FULL` | IDA Q 1.0's queue is full — request was refunded, retry shortly |
| 429 | `rate_limit_exceeded` | Your tier's requests-per-minute limit was exceeded |

Failed jobs (`status: "failed"` from the polling endpoint) always return a safe, generic `error` message — internal errors, GPU details, and stack traces are never exposed.
