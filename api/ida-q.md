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

Submit an IDA Q 1.0 generation request. Billing happens at submit time, not at completion, so the submit response is the only place the cost of the job is reported — the poll endpoint never returns it. IDA Q currently renders at **$0.00**, so what you are really committing at submit is a queue slot: the job runs whether or not you ever poll for it, so retrieve it via the `poll_url`.

**Authentication:** API key (`fh_live_*` / `fh_test_*`)

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|--------------|
| `prompt` | string | Yes | Description of the desired image, in any language. Quoted text (e.g. `"Open Now"`) is preserved verbatim in the output; everything else is translated and expanded automatically. |
| `model` | string | Yes | Must be `"ida-q-image"`. |
| `aspect_ratio` | string | No | One of `"1:1"`, `"16:9"`, `"9:16"`, `"4:3"`, `"3:4"`, `"3:2"`, `"2:3"`, `"21:9"`. Defaults to `"1:1"`. Any other value silently falls back to `1:1`. |
| `image_size` | string | No | Resolution tier: `"1K"` (1024×1024, ~30s), `"1.5K"` (1536×1536, ~90s), or `"2K"` (2048×2048, ~3.5min). `"3K"` and `"4K"` are accepted and capped to `"2K"` — see [Resolution](#resolution). Anything else is a `400`. Defaults to `"1K"`. |
| `num_images` | integer | No | Number of images per request. **Hard cap: 2** — 3 to 8 are silently clamped to 2 *before* billing, so you are never charged for images the queue will not produce. Must be a whole number between 1 and 8; anything else (including `0`, `2.5` and `"2"`) is a `400`. |
| `seed` | integer | No | Seed for reproducible generation. Range: 0–4294967295. |
| `width` / `height` | integer | No | Not forwarded to the model — the pixel size comes from `aspect_ratio` × `image_size`. If you send them **without** `image_size`, the longest side picks the tier for you: ≥3072 → `4K` (capped to 2K), ≥1536 → `2K`, otherwise `1K`. |
| `negative_prompt` | string | No | Accepted by the queue row, but IDA Q ignores it — the prompt engine controls composition instead. |

### Response — 202 Accepted

```json
{
  "model": "ida-q-image",
  "job_id": "8f4e2a1c-9b3d-4c5e-8a1f-2d3e4f5a6b7c",
  "status": "queued",
  "cost_usd": 0,
  "currency": "USD",
  "billing": {
    "cost_usd": 0,
    "balance_usd": 24.312,
    "currency": "USD",
    "method": "wallet",
    "model": "prepaid"
  },
  "estimated_seconds": 30,
  "poll_url": "https://apis.fotohub.app/v1/ai/generate/image/ida-q/8f4e2a1c-9b3d-4c5e-8a1f-2d3e4f5a6b7c"
}
```

`cost_usd` is `0` because IDA Q runs on FOTOhub's own GPUs and is billed at cost — there is no provider invoice behind it to pass through. `balance_usd` is still your real wallet balance, unchanged by this call. There is no `credits_used` field and no `pln_charged`: the API is prepaid in USD and consults no credit balance or plan allowance.

::: tip The one model an empty wallet can still run
Everywhere else on this API a `$0.00` balance is a hard stop — see [Billing & Pricing](/api/billing). IDA Q is the exception, and deliberately so: a zero-price operation is settled without a balance check, because there is no provider invoice to cover and refusing it would protect nothing. So an account that has run its wallet down to zero can keep generating with `ida-q-image` while it tops up.

This is a property of the price, not a plan feature. If IDA Q is ever priced above zero, it stops being free and starts being refused at `$0.00` like every other model.
:::

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
| Max resolution | 2048 × 2048 (`2K`; `3K`/`4K` are capped to it) |
| Price | $0.00 per image — self-hosted |
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

## Resolution

`image_size` picks the pixel size, the wait, and — on every other model — the price. Here it only picks the first two.

| `image_size` | Rendered | Typical generation time |
|---|---|---|
| `1K` (default) | 1024 × 1024 (× aspect ratio) | ~30s |
| `1.5K` | 1536 × 1536 | ~90s |
| `2K` | 2048 × 2048 | ~3.5 min |
| `3K`, `4K` | **capped to 2K** | ~3.5 min |

The cap is the GPU's ceiling, not a policy: IDA Q runs in NF4 on a single L40S and peaks at 33.8 GB of VRAM at 2048 × 2048, so a larger request renders at 2K rather than failing. `estimated_seconds` in the submit response reflects the size that will actually be rendered, which matters because both SDKs poll against it.

The pixel dimensions are the aspect ratio's base size scaled by the tier, rounded to a multiple of 16, with the long edge never above 2048:

| `aspect_ratio` | `1K` | `1.5K` | `2K` |
|---|---|---|---|
| `1:1` | 1024 × 1024 | 1536 × 1536 | 2048 × 2048 |
| `16:9` | 1344 × 768 | 2016 × 1152 | 2048 × 1168 |
| `9:16` | 768 × 1344 | 1152 × 2016 | 1168 × 2048 |
| `4:3` | 1152 × 864 | 1728 × 1296 | 2048 × 1536 |
| `3:4` | 864 × 1152 | 1296 × 1728 | 1536 × 2048 |
| `3:2` | 1216 × 832 | 1824 × 1248 | 2048 × 1392 |
| `2:3` | 832 × 1216 | 1248 × 1824 | 1392 × 2048 |
| `21:9` | 1536 × 672 | 2048 × 896 | 2048 × 896 |

Where the 2048 edge limit bites, the *other* edge shrinks with it so the shape you asked for is the shape you get — `21:9` therefore stops growing after `1.5K`, and `16:9` at `2K` is 2048 × 1168 rather than a taller crop. There is no `width`/`height` on this model, so the aspect ratio is the only handle you have on framing and it is never silently traded for pixels.

---

## Pricing

| Model | Price per image | Notes |
|---|---|---|
| **IDA Q 1.0** | **$0.00** | Self-hosted on FOTOhub GPUs — no provider invoice to pass through |
| Gemini 2.5 Flash Image (Nano Banana) | $0.039 | Third-party, for comparison |
| GPT Image 2 | $0.006 at 1K · $0.053 at 2K · $0.211 at 4K | Third-party, for comparison |
| Imagen 4 Ultra | $0.06 | Third-party, for comparison |

`num_images: 2` charges twice the per-image price, which on IDA Q is still $0.00.

::: tip Why it is free
Every third-party model on this API is sold at the provider's own rate — you pay what the render costs us. IDA Q has no provider: it runs on FOTOhub's own hardware, which is already paid for, so there is no cost to pass on. That is also why it is the slowest model here and the only one with a queue. Comparison figures above are the real charges on this API today, taken from the same rate table that bills them.
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

The two endpoints are also rate-limited, and by **two different limiters** — worth knowing because polling is the side that runs hot:

| | Limiter | Default | `429` body |
|---|---|---|---|
| `POST /v1/ai/generate/image` | Per **API key** | 60 req/min, raisable per key up to 600 in the console | `{ "error": "rate_limit_exceeded", "limit_rpm": 60, "scope": "api_key" }` |
| `GET .../ida-q/{job_id}` | Per **account** | Your tier's rate (see below) | `{ "error": "rate_limit_exceeded", "tier": "...", "limit_rpm": ... }` |

Account rates: 30/min on Pay-As-You-Go Basic, 120 on PAYG Standard, 500 on PAYG Premium; 60 on Developer, 300 on Startup, 1000 on Business, 5000 on Enterprise. Both limiters return `Retry-After: 60` and the `X-RateLimit-Limit` / `-Remaining` / `-Reset` headers, so read the headers rather than counting requests yourself.

::: warning Polling a 2K job on the lowest tier
The SDKs poll every 3 seconds — 20 requests a minute. A `2K` render takes ~3.5 minutes, so one job spends about 70 polls and two-thirds of a PAYG Basic account's 30/min budget for the duration. Two concurrent jobs will rate-limit each other. Poll at 10-second intervals for long renders, or raise your tier.
:::

If low, predictable latency matters more than cost for your use case, consider a third-party model (see the [Model Comparison Table](/api/image-generation#model-comparison-table)) for that specific request.

---

## Error Handling

| Status | Code | Meaning |
|---|---|---|
| 400 | — | `prompt` is missing, `num_images` is not a whole number 1–8, or `image_size` is not one of `1K`/`1.5K`/`2K`/`3K`/`4K`. `detail` is a plain string. |
| 401 | — | Missing `Authorization` header, or a token that is neither an `fh_` key nor a valid JWT |
| 403 | `api_access_required` | The account has no paid plan, no prepaid balance and no access grant. Carries `topup_url` and `upgrade_url`. |
| 403 | `account_suspended` | Account is banned or deactivated |
| 404 | — | `job_id` not found, or it belongs to a different account or a different model |
| 429 | `QUEUE_FULL` | The queue holds more than 25 jobs. Any charge is refunded before the error is raised: `charged: false` and a `message` confirming your wallet was not charged. Retry shortly. |
| 429 | `rate_limit_exceeded` | Rate limited. `scope: "api_key"` on submit, or a `tier` + `limit_rpm` on the poll — see [Rate Limits & Queue](#rate-limits-queue). |
| 503 | `entitlement_check_unavailable` | The entitlement check could not run. This fails closed by design; retry. |

Every other model can also return `402` with `code: "insufficient_funds"` when the wallet cannot cover the request — see [Billing & Pricing](/api/billing) for that payload. IDA Q cannot: it costs $0.00, and a zero-price operation is settled without a balance check.

Failed jobs (`status: "failed"` from the polling endpoint) always return a safe, generic `error` message — internal errors, GPU details, and stack traces are never exposed. A job that fails after it was queued is not refunded, because at $0.00 there is nothing to refund.
