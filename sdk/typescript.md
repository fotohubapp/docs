# TypeScript SDK

Official TypeScript/JavaScript SDK for the FOTOhub API. Provides full type safety, tree-shaking support, automatic retries, streaming via async iterators, and built-in error handling. Works in Node.js 18+, Deno, and edge runtimes (Cloudflare Workers, Vercel Edge).

## Installation

::: code-group
```bash [npm]
npm install fotohub
```

```bash [pnpm]
pnpm add fotohub
```

```bash [yarn]
yarn add fotohub
```

```bash [bun]
bun add fotohub
```
:::

**Requirements:** Node.js 18+ (or any runtime with `fetch` and `ReadableStream` support).

## Quick Start

```typescript
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: 'fh_live_your_key_here' });

// Generate an image
const result = await client.generateImage({
  prompt: 'A futuristic city at sunset',
  model: 'imagen-4-standard',
});

console.log(`Image: ${result.images[0]}`);
console.log(`Cost: $${result.cost_usd}`);
```

## Client Initialization

### With API Key

```typescript
import { FotoHub } from 'fotohub';

const client = new FotoHub({
  apiKey: 'fh_live_your_key_here',
  baseUrl: 'https://apis.fotohub.app',  // default
  timeout: 60_000,                          // 60s default
  maxRetries: 3,                            // automatic retries for 429/5xx
});
```

### With Environment Variable

The TypeScript SDK does not read environment variables automatically — pass the key explicitly from `process.env`:

```typescript
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });
```

Store the key in your `.env` file and load it (e.g. with `dotenv`) before constructing the client:

```bash
# .env
FOTOHUB_API_KEY=fh_live_your_key_here
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | — (**required**) | Your API key (starts with `fh_live_` or `fh_test_`) |
| `baseUrl` | `string` | `https://apis.fotohub.app` | API base URL |
| `timeout` | `number` | `60000` | Request timeout in milliseconds |
| `maxRetries` | `number` | `3` | Max retries for transient errors (429, 5xx) |

::: warning Security
Never hardcode API keys in source code. Always use environment variables or a secrets manager (AWS Secrets Manager, Vault, Doppler) in production. Add `.env` to your `.gitignore`.
:::

## Type-Safe Interfaces

The SDK exports comprehensive TypeScript interfaces for all request and response types.

```typescript
import type {
  // Request options
  GenerateImageOptions,
  GenerateVideoOptions,
  GenerateMusicOptions,
  ChatOptions,
  ChatClaudeOptions,

  // Response types
  ImageResult,
  VideoResult,
  MusicResult,
  ChatResult,
  ChatStreamChunk,
  ChatStream,

  // Common types
  BillingInfo,
  BillingBalance,
  Model,
} from 'fotohub';
```

### GenerateImageOptions

```typescript
interface GenerateImageOptions {
  /** Text prompt describing the desired image */
  prompt: string;
  /** Model ID. Defaults to 'seedream-5-0-260128' */
  model?: string;
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
  /** Aspect ratio shorthand (e.g., '16:9', '1:1', '9:16') */
  aspect_ratio?: string;
  /** Number of images to generate (1-4) */
  num_images?: number;
  /** Negative prompt for exclusions */
  negative_prompt?: string;
  /** Style preset */
  style?: string;
  /** Generation seed for reproducibility */
  seed?: number;
  /** Guidance / CFG scale */
  guidance_scale?: number;
  /** Number of inference steps */
  steps?: number;
  /** Output format */
  output_format?: 'png' | 'jpeg' | 'webp';
  /** Reference image URL for img2img / style reference */
  reference_image_url?: string;
  /** Strength of the reference image (0.0-1.0) */
  reference_strength?: number;
}
```

### GenerateVideoOptions

```typescript
interface GenerateVideoOptions {
  /** Text prompt describing the desired video */
  prompt: string;
  /**
   * Model ID. See GET /v1/models?category=video for the full list. Examples:
   * veo-3.1-generate-001, veo-2.0-generate-001, wan2.2-t2v-plus, kling-v3,
   * hailuo-o2, sora-2.
   *
   * Seedance models are asynchronous and are not reachable through this method —
   * use generateSeedance() instead.
   */
  model?: string;
  /** Video duration in seconds */
  duration?: number;
  /** Aspect ratio (e.g., '16:9', '9:16', '1:1') */
  aspect_ratio?: string;
  /** Input image URL for image-to-video */
  image_url?: string;
  /** Resolution */
  resolution?: '720p' | '1080p' | '4k';
  /** Negative prompt */
  negative_prompt?: string;
  /** Random seed */
  seed?: number;
  /** Guidance scale */
  guidance_scale?: number;
  /** Frames per second */
  fps?: number;
}
```

### ChatOptions

```typescript
interface ChatOptions {
  /** Array of message objects */
  messages: ChatMessage[];
  /** Model ID (e.g., 'gemini-flash', 'gemini-pro', 'gpt-4o') */
  model?: string;
  /** System prompt (convenience, prepended to messages) */
  system?: string;
  /** Sampling temperature (0-2) */
  temperature?: number;
  /** Maximum tokens in response */
  max_tokens?: number;
  /** Whether to stream the response */
  stream?: boolean;
  /** Top-p nucleus sampling */
  top_p?: number;
  /** Stop sequences */
  stop?: string | string[];
  /** Frequency penalty (-2.0 to 2.0) */
  frequency_penalty?: number;
  /** Presence penalty (-2.0 to 2.0) */
  presence_penalty?: number;
}

// Premium token-based chat (dot-notation model IDs)
interface ChatClaudeOptions {
  messages: ChatMessage[];
  /** e.g. 'claude-sonnet-4.6', 'claude-haiku-4.5', 'nova-pro' */
  model?: string;
  temperature?: number;
  max_tokens?: number;
  system?: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

## Image Generation

### Basic Generation

```typescript
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: 'fh_live_your_key_here' });

const result = await client.generateImage({
  prompt: 'A futuristic city at sunset',
  model: 'imagen-4-standard',
});

console.log(`Image: ${result.images[0]}`);
console.log(`Cost: $${result.cost_usd}`);
```

### Multiple Images with Options

```typescript
const result = await client.generateImage({
  prompt: 'Professional product photography, white background, studio lighting',
  model: 'seedream-5-0-260128',
  aspect_ratio: '1:1',
  num_images: 4,
  negative_prompt: 'blurry, low quality, distorted',
});

// Iterate over all generated images
for (const imageUrl of result.images) {
  console.log(imageUrl);
}

// Access billing information -- the API is prepaid in USD
console.log(`Cost: $${result.cost_usd}`);
console.log(`Balance left: $${result.billing.balance_usd}`);
```

### With Explicit Dimensions

```typescript
const result = await client.generateImage({
  prompt: 'A panoramic mountain landscape',
  model: 'imagen-4-standard',
  width: 1920,
  height: 1080,
  seed: 42, // reproducible results
});
```

### ImageResult Response Type

```typescript
interface ImageResult {
  /** Model used for generation */
  model: string;
  /** USD charged. Same figure as `billing.cost_usd`. */
  cost_usd?: number;
  /** Always `'USD'`. */
  currency?: 'USD';
  /** Billing information */
  billing: BillingInfo;
  /** Array of generated image URLs */
  images: string[];
  /** Generation metadata */
  metadata?: ImageMetadata;
  /** @deprecated Not sent by the prepaid API. Use `cost_usd`. */
  credits_used?: number;
}

interface BillingInfo {
  /** USD charged, to six decimal places. */
  cost_usd: number;
  /** Wallet balance AFTER this charge. */
  balance_usd?: number | null;
  currency?: 'USD';
  method?: 'wallet';
  model?: 'prepaid';
}
```

::: warning Do not default `credits_used` to `0`
It is deprecated and absent on every current response. Code that reads
`result.credits_used ?? 0` reports a real charge as a free generation. Read
`cost_usd`.
:::

## Video Generation

Video generation is synchronous — the promise resolves once the video is ready and the result carries the finished `video_url`. There is no job to poll.

::: tip Seedance models
The Seedance family runs asynchronously and is not reachable through `generateVideo()`. Use [`generateSeedance()`](#seedance-long-clips-video-editing), which submits and polls for you.
:::

```typescript
const result = await client.generateVideo({
  prompt: 'A drone flying over a mountain landscape, cinematic',
  model: 'veo-3.1-generate-001',
  duration: 5,
  aspect_ratio: '16:9',
});

console.log(`Video URL: ${result.video_url}`);
console.log(`Cost: $${result.cost_usd}`);
```

### Image-to-Video

```typescript
const result = await client.generateVideo({
  prompt: 'Gentle camera zoom, subtle movement in the clouds',
  model: 'veo-3.1-generate-001',
  image_url: 'https://example.com/my-image.jpg',
  duration: 5,
  aspect_ratio: '16:9',
});
```

### VideoResult Response Type

```typescript
interface VideoResult {
  /** Model used */
  model: string;
  /** USD charged. Same figure as `billing.cost_usd`. */
  cost_usd?: number;
  /** @deprecated Not sent by the prepaid API. Use `cost_usd`. */
  credits_used?: number;
  /** Video output URL */
  video_url?: string;
  /** Current status */
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  /** Video duration in seconds */
  duration: number;
  /** Thumbnail URL */
  thumbnail_url?: string;
}
```

## Seedance (long clips, video editing)

Seedance models are asynchronous: the API answers 202 with a `job_id` and the
render runs in a queue. `generateSeedance()` submits, polls, and resolves once the
job is finished, so the result already contains `video_url`.

`seedance-2-5` (the default) is the only model that produces a **30-second clip in
one request**, and the only one that accepts a source video for editing or
extension. Native audio is **included in its price** — $0.0107 per 1000 output
tokens whether `generate_audio` is on or off, which works out to about $1.17 for a
5-second 720p clip and $6.99 for a 30-second one.

```typescript
const video = await client.generateSeedance({
  prompt:
    'A chef plates a dish in a warm restaurant kitchen: hands dust herbs over ' +
    'seared scallops, steam rises, the camera pushes in slowly.',
  duration: 30,          // 4-30 on 2.5; nothing else reaches past 15
  resolution: '720p',    // 480p | 720p — 1080p and 4K are a 400 on 2.5
  aspect_ratio: '16:9',
  generate_audio: true,  // free on 2.5
  onProgress: (r) => console.log(`${r.status} ${r.progress ?? 0}%`),
});

console.log(video.video_url);
console.log(video.cost_usd); // e.g. 6.99138
```

::: warning 720p ceiling
2.5 is not a superset of `seedance-2-0-pro`. It reaches 30 seconds but stops at
720p; 2.0 Pro reaches 4K but stops at 15 seconds. Requesting a resolution a model
does not support returns a 400 rather than downgrading silently, because the price
scales with resolution.
:::

### Edit or extend an existing video

Attach a source clip and describe the change. The output keeps the source geometry
and length, so those are resolved for you and the effective values come back on the
result.

```typescript
const edited = await client.generateSeedance({
  prompt: 'Replace the grey sky with a clear blue sky and warm afternoon light',
  reference_videos: ['https://s1.fotohub.app/storage/v1/object/public/videos/source.mp4'],
  duration: -1,               // match the source clip's length
});

console.log(edited.task_type);    // "editing"
console.log(edited.aspect_ratio); // "adaptive"
```

A source video raises the cost, because its frames bill as input tokens on top of
the output. Image and audio references do not change the rate. Price the exact call
with `estimateCost()` first if the difference matters.

### Face consistency

Register a portrait once (free), then reuse it across generations:

```typescript
const asset = await client.registerVideoAsset(
  'https://s1.fotohub.app/storage/v1/object/public/photos/face.jpg'
);

const video = await client.generateSeedance({
  prompt: 'The same woman walks through a night market, neon on wet pavement',
  duration: 15,
  asset_ids: [asset.uri],
});
```

### GenerateSeedanceOptions

```typescript
interface GenerateSeedanceOptions {
  /** Text prompt describing the video to generate */
  prompt: string;
  /** Default 'seedance-2-5'. Others: seedance-2-0-pro / -fast / -mini, seedance-1-5-pro-251215, seedance-1-0-pro-250528, seedance-1-0-pro-fast-251015 */
  model?: string;
  /** 2.5: 4-30. 2.0: 4-15. 1.x: 5-10. -1 matches a source clip's length */
  duration?: number;
  /** 2.5 accepts only 480p and 720p; seedance-2-0-pro accepts all four */
  resolution?: '480p' | '720p' | '1080p' | '4K';
  /** 16:9 | 9:16 | 1:1 | 4:3 | 3:4 | 21:9 | adaptive */
  aspect_ratio?: string;
  /** Native soundtrack. Free on 2.5 */
  generate_audio?: boolean;
  /** First frame (image-to-video) */
  image_url?: string;
  /** Final frame */
  last_frame_url?: string;
  /** Up to 30 on 2.5 (9 on 2.0). URLs or { mimeType, base64 } */
  reference_images?: SeedanceReference[];
  /** Up to 10 on 2.5 (3 on 2.0). Raises the rate — source frames bill as input */
  reference_videos?: SeedanceReference[];
  /** Up to 10 on 2.5 (3 on 2.0). Needs at least one image or video reference */
  reference_audios?: SeedanceReference[];
  /** Pre-registered asset:// portrait ids from registerVideoAsset() */
  asset_ids?: string[];
  /** Output container. 2.5 only */
  output_format?: 'mp4' | 'mov';
  negative_prompt?: string;
  seed?: number;
  /** HTTPS URL POSTed once the job reaches a terminal state */
  callback_url?: string;
  /** Let the model pick the aspect ratio */
  smart_ratio?: boolean;
  /** Let the model pick the duration */
  smart_duration?: boolean;
  /** Milliseconds between status checks (default 10 000) */
  pollInterval?: number;
  /** Max milliseconds to wait (default 1 800 000) */
  maxWait?: number;
  /** Called on every poll with the in-flight job */
  onProgress?: (result: SeedanceResult) => void;
}
```

### SeedanceResult Response Type

```typescript
interface SeedanceResult extends VideoResult {
  /** 0-100 while rendering */
  progress?: number;
  /** Resolution actually rendered */
  resolution?: string;
  /** Aspect ratio actually rendered ('adaptive' for editing/extension) */
  aspect_ratio?: string;
  /** Whether a native soundtrack was generated */
  generate_audio?: boolean;
  /** Inferred task: t2v | reference | editing | extension | frames */
  task_type?: string;
  /** USD charged. Same figure as `billing.cost_usd`. */
  cost_usd?: number;
  /** Charge detail — `cost_usd`, `balance_usd`, and a per-leg token breakdown */
  billing?: Record<string, unknown>;
  poll_url?: string;
  estimated_seconds?: number;
  created_at?: string;
  completed_at?: string;
  error_message?: string;
}
```

Throws `JobTimeoutError` if the job outlives `maxWait` (it may still finish — the
job id is on the error) and `JobFailedError` if the render fails, in which case the
wallet is refunded server-side and the response says so explicitly.

## Music Generation

```typescript
const result = await client.generateMusic({
  prompt: 'Upbeat electronic music with synthesizers, 120 BPM',
  model: 'minimax',
  duration: 30,
});

console.log(`Audio URL: ${result.audio_url}`);
console.log(`Duration: ${result.duration}s`);
console.log(`Cost: $${result.cost_usd}`);   // per minute: 30s on minimax is $0.0125
```

### MusicResult Response Type

```typescript
interface MusicResult {
  /** Model used */
  model: string;
  /** USD charged. Music is billed per minute of generated audio. */
  cost_usd?: number;
  /** @deprecated Not sent by the prepaid API. Use `cost_usd`. */
  credits_used?: number;
  /** URL to the generated audio file */
  audio_url: string;
  /** Duration in seconds */
  duration: number;
}
```

Only two providers are accepted: `minimax` ($0.025/min) and `elevenlabs`
($0.045/min).

## Chat Completions

### Standard Chat (OpenAI-compatible)

Billed from the real token counts of the completion. Four ids are accepted:
`gemini-flash`, `gemini-pro`, `gpt-4o`, `claude-sonnet`.

```typescript
const chat = await client.chat({
  messages: [{ role: 'user', content: 'Explain quantum computing' }],
  model: 'gemini-flash',
  temperature: 0.7,
  max_tokens: 1024,
});

console.log(chat.choices[0].message.content);
console.log(`Cost: $${chat.cost_usd}`);
console.log(`Tokens: ${chat.usage.prompt_tokens} in / ${chat.usage.completion_tokens} out`);
```

### Premium Chat (Token-Based Billing)

```typescript
const chat = await client.chatClaude({
  messages: [{ role: 'user', content: 'Hello' }],
  model: 'claude-sonnet-4.6',
  system: 'You are a helpful assistant. Be concise.',
});

console.log(chat.choices[0].message.content);
console.log(`Tokens: ${chat.usage.total_tokens}`);
```

### With System Prompt and Parameters

```typescript
const chat = await client.chat({
  messages: [
    { role: 'system', content: 'You are a creative writing assistant.' },
    { role: 'user', content: 'Write a short story about a robot' },
  ],
  model: 'gemini-flash',
  temperature: 1.2,
  max_tokens: 2048,
  top_p: 0.9,
  stop: ['THE END'],
});
```

### ChatResult Response Type

```typescript
interface ChatResult {
  /** Unique completion ID */
  id: string;
  /** Model used */
  model: string;
  /** USD charged, derived from the real token counts below. */
  cost_usd?: number;
  /** @deprecated Not sent by the prepaid API. Use `cost_usd`. */
  credits_used?: number;
  /** Completion choices */
  choices: Array<{
    index: number;
    message: { role: 'assistant'; content: string };
    finish_reason: 'stop' | 'length' | 'content_filter' | null;
  }>;
  /** Token usage */
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  /** Billing information */
  billing?: {
    cost_usd: number;
    balance_usd?: number | null;
    currency?: 'USD';
    /** `'tokens'` on chat — the charge came from the counts above. */
    basis?: 'tokens' | 'flat_fallback';
    /** Per-leg breakdown: input tokens and output tokens priced separately. */
    legs?: Array<Record<string, unknown>>;
  };
}
```

## Streaming

::: danger `client.chatStream()` yields nothing
`chatStream()` posts to `/v1/ai/chat/completions`, which **does not stream** — it
accepts `stream: true` for OpenAI compatibility and returns one complete JSON
body. The SDK's SSE parser finds no `data:` frames in that body, so the iterator
completes after **zero chunks and throws no error**, while the request is still
billed. Do not use it until it is repointed.

The one streaming endpoint is `POST /v1/ai/agent/stream`, which has no SDK
wrapper yet. Call it with `fetch`, as below. Full reference: the
[Streaming Guide](/guides/streaming).
:::

### Basic Streaming

Frames are discriminated by a `type` field (`text_delta`, `tool_use`, `done`,
`error`), not by `choices[].delta`, and the stream is terminated by
`data: [DONE]`.

```typescript
const response = await fetch('https://apis.fotohub.app/v1/ai/agent/stream', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4.6',
    messages: [{ role: 'user', content: 'Write a story about space exploration' }],
  }),
});
// Auth and validation fail before the stream opens, so they are real statuses.
if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);

const reader = response.body!.getReader();
const decoder = new TextDecoder();
let buffer = '';

outer: while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  // One read() can end mid-frame — buffer to the blank-line separator.
  buffer += decoder.decode(value, { stream: true });
  const frames = buffer.split('\n\n');
  buffer = frames.pop() ?? '';

  for (const raw of frames) {
    if (!raw.startsWith('data: ')) continue;
    const data = raw.slice(6).trim();
    if (data === '[DONE]') break outer;

    const frame = JSON.parse(data);
    if (frame.type === 'text_delta') {
      process.stdout.write(frame.text);
    } else if (frame.type === 'error') {
      throw new Error(frame.message);
    }
  }
}
```

### Collecting Full Response from Stream

Wrap the loop above in a helper so callers get the text plus the final `done`
metadata:

```typescript
interface AgentFrame {
  type: 'text_delta' | 'tool_use' | 'done' | 'error';
  text?: string;
  message?: string;
  usage?: { input_tokens: number; output_tokens: number; total_tokens: number };
  billing?: { cost_usd: number };
}

async function* agentFrames(messages: unknown[], model = 'claude-sonnet-4.6') {
  const response = await fetch('https://apis.fotohub.app/v1/ai/agent/stream', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';
    for (const raw of frames) {
      if (!raw.startsWith('data: ')) continue;
      const data = raw.slice(6).trim();
      if (data === '[DONE]') return;
      yield JSON.parse(data) as AgentFrame;
    }
  }
}

let fullContent = '';
let usage: AgentFrame['usage'] | undefined;

for await (const frame of agentFrames([
  { role: 'user', content: 'List 10 programming languages' },
])) {
  if (frame.type === 'text_delta') fullContent += frame.text;
  if (frame.type === 'done') usage = frame.usage;
  if (frame.type === 'error') throw new Error(frame.message);
}

console.log('Full response:', fullContent);
// usage may be undefined: the done frame is skipped when nothing was generated.
console.log('Tokens used:', usage?.total_tokens ?? 'unknown');
```

::: warning `done` is optional, `[DONE]` is not
The `done` frame is omitted when the turn produced no tokens at all, and replaced
by an `error` frame when generation succeeded but billing settlement failed. Exit
on `[DONE]`; treat `done` as optional metadata. A loop that waits for `done` can
hang.
:::

### Streaming to HTTP Response (Server-Sent Events)

Re-emit `text_delta` frames rather than proxying upstream frames verbatim, so
your own wire format stays under your control:

```typescript
// Express.js / Node.js HTTP handler
app.post('/api/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    for await (const frame of agentFrames(req.body.messages)) {
      if (frame.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: frame.text })}\n\n`);
      } else if (frame.type === 'error') {
        res.write(`data: ${JSON.stringify({ error: frame.message })}\n\n`);
        break;
      }
    }
  } finally {
    res.write('data: [DONE]\n\n');
    res.end();
  }
});
```

### ChatStreamChunk Type

This type ships in the SDK and describes the OpenAI chunk shape that
`chatStream()` expects. **Nothing on the API emits it** — it is kept for the
signature only. Note there is no `usage` field on it.

```typescript
interface ChatStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: { role?: 'assistant'; content?: string };
    finish_reason: 'stop' | 'length' | 'content_filter' | null;
  }>;
}
```

## Next.js Integration

### App Router (Route Handler)

```typescript
// app/api/generate/route.ts
import { FotoHub } from 'fotohub';
import { NextResponse } from 'next/server';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

export async function POST(request: Request) {
  const { prompt, model } = await request.json();

  try {
    const result = await client.generateImage({
      prompt,
      model: model || 'imagen-4-standard',
    });

    return NextResponse.json({
      images: result.images,
      billing: result.billing,
    });
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json(
        { error: e.message },
        { status: 500 }
      );
    }
    throw e;
  }
}
```

### App Router with Streaming

Proxy `/v1/ai/agent/stream` and forward the text. Your API key stays server-side:

```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  const { messages } = await request.json();

  const upstream = await fetch('https://apis.fotohub.app/v1/ai/agent/stream', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4.6', messages }),
  });

  // Pre-stream failures (401, 400, 429) are real statuses — pass them through
  // instead of opening an empty 200 stream.
  if (!upstream.ok) {
    return new Response(await upstream.text(), { status: upstream.status });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = '';
      try {
        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? '';

          for (const raw of frames) {
            if (!raw.startsWith('data: ')) continue;
            const data = raw.slice(6).trim();
            if (data === '[DONE]') break outer;

            const frame = JSON.parse(data);
            if (frame.type === 'text_delta') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: frame.text })}\n\n`));
            } else if (frame.type === 'error') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: frame.message })}\n\n`));
              break outer;
            }
          }
        }
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
        reader.releaseLock();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Server Action

```typescript
// app/actions/generate.ts
'use server';

import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

export async function generateImage(prompt: string) {
  const result = await client.generateImage({
    prompt,
    model: 'imagen-4-standard',
    aspect_ratio: '16:9',
  });

  return {
    imageUrl: result.images[0],
    costUsd: result.cost_usd,
  };
}
```

### Edge Runtime Support

```typescript
// app/api/chat/route.ts
import { FotoHub } from 'fotohub';

// Works on Vercel Edge, Cloudflare Workers, Deno Deploy
export const runtime = 'edge';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

export async function POST(request: Request) {
  const { messages } = await request.json();

  const chat = await client.chat({
    messages,
    model: 'gemini-flash',
  });

  return Response.json(chat);
}
```

## Stability AI Tools

FOTOhub exposes 13 Stability AI image-editing tools (upscaling, background removal, inpainting, outpainting, search & replace, recolor, style transfer, and more) through a single RPC endpoint: `POST /stability/{tool_id}`. Every tool takes a **base64-encoded** input image and returns a **base64-encoded** output image — there are no URLs on the way in or out.

::: warning Authentication: Supabase session required
The Stability tools currently require a **logged-in Supabase session token (JWT)**, not a standalone `fh_live_*` API key. Pass the session's `access_token` where the SDKs expect `apiKey` (it is sent verbatim as `Authorization: Bearer <token>`). Requests authenticated with only an API key are rejected.
:::

Every tool resolves to a `StabilityResult`:

```typescript
interface StabilityResult {
  image: string;        // base64-encoded output image (NOT a URL)
  tool: string;         // the tool_id that ran
  seed: number | null;  // seed used, when the model returns one
  cost_usd: number;     // USD charged for the call
}
```

The 13 tool IDs, their price, and which extra inputs they consume. Every price
below is ✅ verified against Stability's published rate:

| `tool_id`             | USD    | Mask     | Prompt   | Reference |
| --------------------- | -----: | -------- | -------- | --------- |
| `fast-upscale`        | 0.03   | —        | —        | —         |
| `outpaint`            | 0.06   | optional | required | —         |
| `erase-object`        | 0.07   | required | —        | —         |
| `inpaint`             | 0.07   | required | required | —         |
| `remove-background`   | 0.07   | —        | —        | —         |
| `search-replace`      | 0.07   | —        | required | —         |
| `search-recolor`      | 0.07   | —        | required | —         |
| `style-guide`         | 0.07   | —        | required | required  |
| `control-sketch`      | 0.07   | —        | required | —         |
| `control-structure`   | 0.07   | —        | required | —         |
| `style-transfer`      | 0.08   | —        | —        | required  |
| `conservative-upscale`| 0.40   | —        | —        | —         |
| `creative-upscale`    | 0.60   | —        | —        | —         |

::: warning The two heavy upscalers are 13-20x the fast one
`conservative-upscale` at $0.40 and `creative-upscale` at $0.60 cost more than a
5-second Veo 3.1 Lite video. Use `fast-upscale` at $0.03 unless you specifically
need detail synthesis.
:::

### List Available Tools

```typescript
listStabilityTools(): Promise<StabilityTool[]>
```

Returns all available Stability AI tools with their USD price and input requirements (`GET /stability/tools`).

::: code-group
```typescript [TypeScript]
import { FotoHub } from 'fotohub';

// Pass your Supabase session access_token, not an fh_live_* API key.
const client = new FotoHub({ apiKey: process.env.SUPABASE_ACCESS_TOKEN! });

const tools = await client.listStabilityTools();
for (const tool of tools) {
  console.log(`$${tool.price_usd} per ${tool.unit} — ${tool.id} (mask=${tool.requires_mask}, prompt=${tool.requires_prompt})`);
}
```

```python [Python]
from fotohub import FotoHub

# Pass your Supabase session access_token, not an fh_live_* API key.
client = FotoHub(api_key=os.environ["SUPABASE_ACCESS_TOKEN"])

for tool in client.stability_tools():
    print(f"{tool['id']}: ${tool['price_usd']} per {tool['unit']} (mask={tool['requires_mask']})")
```

```go [Go]
package main

import (
    "fmt"
    "os"
    "github.com/fotohubapp/sdk-go"
)

func main() {
    // Pass your Supabase session access_token, not an fh_live_* API key.
    client := fotohub.NewClient(os.Getenv("SUPABASE_ACCESS_TOKEN"))

    tools, _ := client.ListStabilityTools()
    for _, tool := range tools {
        fmt.Printf("%s: $%.2f\n", tool.ID, tool.PriceUSD)
    }
}
```

```bash [cURL]
# Requires a Supabase session token (JWT), not an fh_live_* API key.
curl https://apis.fotohub.app/stability/tools \
  -H "Authorization: Bearer <SUPABASE_JWT>"
```
:::

### Upscale Image

```typescript
stabilityUpscale(imageBase64: string, type?: 'fast' | 'creative' | 'conservative'): Promise<StabilityResult>
```

Upscales an image to a higher resolution. `type` defaults to `'fast'` ($0.03); `'conservative'` costs $0.40 and `'creative'` costs $0.60. Each mode maps to the tool IDs `fast-upscale`, `conservative-upscale`, and `creative-upscale`.

The examples below show the base64 input/output pattern once — read a file, base64-encode it, send it, and decode the returned string. Later tools reuse the same `imageBase64` variable without repeating the file-reading boilerplate.

::: code-group
```typescript [TypeScript]
import { FotoHub } from 'fotohub';
import { readFileSync, writeFileSync } from 'fs';

const client = new FotoHub({ apiKey: process.env.SUPABASE_ACCESS_TOKEN! });

// Input images are base64 strings, not URLs.
const imageBase64 = readFileSync('photo.jpg').toString('base64');

const result = await client.stabilityUpscale(imageBase64, 'creative');

// Output is base64 too — decode it to save the file.
writeFileSync('photo-upscaled.png', Buffer.from(result.image, 'base64'));
console.log(`Cost: $${result.cost_usd}, seed: ${result.seed}`);
```

```python [Python]
import base64
from fotohub import FotoHub

client = FotoHub(api_key=os.environ["SUPABASE_ACCESS_TOKEN"])

# Input images are base64 strings, not URLs.
with open("photo.jpg", "rb") as f:
    image_base64 = base64.b64encode(f.read()).decode()

result = client.stability_upscale(image_base64, type="creative")

# Output is base64 too — decode it to save the file.
with open("photo-upscaled.png", "wb") as f:
    f.write(base64.b64decode(result["image"]))
print(f"Cost: ${result['cost_usd']}")
```

```go [Go]
package main

import (
    "encoding/base64"
    "fmt"
    "os"
    "github.com/fotohubapp/sdk-go"
)

func main() {
    client := fotohub.NewClient(os.Getenv("SUPABASE_ACCESS_TOKEN"))

    // Input images are base64 strings, not URLs.
    data, _ := os.ReadFile("photo.jpg")
    imageB64 := base64.StdEncoding.EncodeToString(data)

    result, _ := client.StabilityUpscale(imageB64, "creative")

    // Output is base64 too — decode it to save the file.
    out, _ := base64.StdEncoding.DecodeString(result.Image)
    os.WriteFile("photo-upscaled.png", out, 0644)
    fmt.Printf("Cost: $%.2f\n", result.CostUSD)
}
```

```bash [cURL]
# tool_id = fast-upscale | conservative-upscale | creative-upscale
# Requires a Supabase session token (JWT), not an fh_live_* API key.
IMAGE_B64=$(base64 -w0 photo.jpg)
curl -X POST https://apis.fotohub.app/stability/creative-upscale \
  -H "Authorization: Bearer <SUPABASE_JWT>" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE_B64\", \"output_format\": \"png\"}"
# → { "image": "<base64>", "tool": "creative-upscale", "seed": null, "cost_usd": 0.6 }
```
:::

### Remove Background

```typescript
stabilityRemoveBackground(imageBase64: string): Promise<StabilityResult>
```

Removes the background from an image, returning a transparent PNG in `result.image` (base64). Costs $0.07.

::: code-group
```typescript [TypeScript]
// imageBase64 = readFileSync('product.jpg').toString('base64')
const result = await client.stabilityRemoveBackground(imageBase64);
writeFileSync('product-nobg.png', Buffer.from(result.image, 'base64'));
```

```python [Python]
# image_base64 = base64.b64encode(open("product.jpg", "rb").read()).decode()
result = client.stability_remove_background(image_base64)
open("product-nobg.png", "wb").write(base64.b64decode(result["image"]))
```

```go [Go]
// imageB64 = base64.StdEncoding.EncodeToString(data)
result, _ := client.StabilityRemoveBackground(imageB64)
out, _ := base64.StdEncoding.DecodeString(result.Image)
os.WriteFile("product-nobg.png", out, 0644)
```

```bash [cURL]
IMAGE_B64=$(base64 -w0 product.jpg)
curl -X POST https://apis.fotohub.app/stability/remove-background \
  -H "Authorization: Bearer <SUPABASE_JWT>" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE_B64\"}"
```
:::

### Erase Object

```typescript
stabilityErase(imageBase64: string, maskBase64: string): Promise<StabilityResult>
```

Runs the `erase-object` tool: erases the masked region from an image and fills it with context-aware content. The **mask is required** and is a base64 image where white marks the area to erase. Costs $0.07.

::: code-group
```typescript [TypeScript]
const imageBase64 = readFileSync('photo.jpg').toString('base64');
const maskBase64 = readFileSync('mask.png').toString('base64');

const result = await client.stabilityErase(imageBase64, maskBase64);
writeFileSync('photo-erased.png', Buffer.from(result.image, 'base64'));
```

```python [Python]
image_base64 = base64.b64encode(open("photo.jpg", "rb").read()).decode()
mask_base64 = base64.b64encode(open("mask.png", "rb").read()).decode()

result = client.stability_erase(image_base64, mask_base64)
open("photo-erased.png", "wb").write(base64.b64decode(result["image"]))
```

```go [Go]
imgData, _ := os.ReadFile("photo.jpg")
maskData, _ := os.ReadFile("mask.png")
imageB64 := base64.StdEncoding.EncodeToString(imgData)
maskB64 := base64.StdEncoding.EncodeToString(maskData)

result, _ := client.StabilityErase(imageB64, maskB64)
out, _ := base64.StdEncoding.DecodeString(result.Image)
os.WriteFile("photo-erased.png", out, 0644)
```

```bash [cURL]
IMAGE_B64=$(base64 -w0 photo.jpg)
MASK_B64=$(base64 -w0 mask.png)
curl -X POST https://apis.fotohub.app/stability/erase-object \
  -H "Authorization: Bearer <SUPABASE_JWT>" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE_B64\", \"mask\": \"$MASK_B64\"}"
```
:::

### Inpaint

```typescript
stabilityInpaint(imageBase64: string, maskBase64: string, prompt: string): Promise<StabilityResult>
```

Fills a masked region with AI-generated content guided by a text prompt. Both the **mask and prompt are required**. Costs $0.07.

::: code-group
```typescript [TypeScript]
const imageBase64 = readFileSync('room.jpg').toString('base64');
const maskBase64 = readFileSync('mask.png').toString('base64');

const result = await client.stabilityInpaint(
  imageBase64,
  maskBase64,
  'A modern leather couch'
);
writeFileSync('room-inpainted.png', Buffer.from(result.image, 'base64'));
```

```python [Python]
image_base64 = base64.b64encode(open("room.jpg", "rb").read()).decode()
mask_base64 = base64.b64encode(open("mask.png", "rb").read()).decode()

result = client.stability_inpaint(image_base64, mask_base64, "A modern leather couch")
open("room-inpainted.png", "wb").write(base64.b64decode(result["image"]))
```

```go [Go]
result, _ := client.StabilityInpaint(imageB64, maskB64, "A modern leather couch")
out, _ := base64.StdEncoding.DecodeString(result.Image)
os.WriteFile("room-inpainted.png", out, 0644)
```

```bash [cURL]
IMAGE_B64=$(base64 -w0 room.jpg)
MASK_B64=$(base64 -w0 mask.png)
curl -X POST https://apis.fotohub.app/stability/inpaint \
  -H "Authorization: Bearer <SUPABASE_JWT>" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE_B64\", \"mask\": \"$MASK_B64\", \"prompt\": \"A modern leather couch\"}"
```
:::

### Outpaint

```typescript
stabilityOutpaint(imageBase64: string, padding: { left?: number; right?: number; up?: number; down?: number }): Promise<StabilityResult>
```

Extends an image beyond its borders in the specified directions (pixels to extend per side). A `prompt` is required by the model (pass one via `runStabilityTool` if you need to guide the fill); a `mask` is optional. Costs $0.06.

::: code-group
```typescript [TypeScript]
// imageBase64 = readFileSync('landscape.jpg').toString('base64')
const result = await client.stabilityOutpaint(imageBase64, {
  left: 256,
  right: 256,
  up: 0,
  down: 128,
});
writeFileSync('landscape-extended.png', Buffer.from(result.image, 'base64'));
```

```python [Python]
result = client.stability_outpaint(image_base64, left=256, right=256, up=0, down=128)
open("landscape-extended.png", "wb").write(base64.b64decode(result["image"]))
```

```go [Go]
result, _ := client.StabilityOutpaint(imageB64, fotohub.OutpaintPadding{
    Left:  256,
    Right: 256,
    Up:    0,
    Down:  128,
})
out, _ := base64.StdEncoding.DecodeString(result.Image)
os.WriteFile("landscape-extended.png", out, 0644)
```

```bash [cURL]
IMAGE_B64=$(base64 -w0 landscape.jpg)
curl -X POST https://apis.fotohub.app/stability/outpaint \
  -H "Authorization: Bearer <SUPABASE_JWT>" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE_B64\", \"left\": 256, \"right\": 256, \"up\": 0, \"down\": 128, \"prompt\": \"open sky and rolling hills\"}"
```
:::

### Search and Replace

```typescript
stabilitySearchReplace(imageBase64: string, searchPrompt: string, replacePrompt: string): Promise<StabilityResult>
```

Finds objects matching `searchPrompt` in the image and replaces them with content described by `replacePrompt`. Under the hood the replacement text is sent as `prompt` and the target as `search_prompt`. Costs $0.07.

::: code-group
```typescript [TypeScript]
// imageBase64 = readFileSync('street.jpg').toString('base64')
const result = await client.stabilitySearchReplace(
  imageBase64,
  'parked cars',
  'flower beds with roses'
);
writeFileSync('street-replaced.png', Buffer.from(result.image, 'base64'));
```

```python [Python]
result = client.stability_search_replace(
    image_base64,
    search_prompt="parked cars",
    prompt="flower beds with roses",
)
open("street-replaced.png", "wb").write(base64.b64decode(result["image"]))
```

```go [Go]
result, _ := client.StabilitySearchReplace(imageB64, "parked cars", "flower beds with roses")
out, _ := base64.StdEncoding.DecodeString(result.Image)
os.WriteFile("street-replaced.png", out, 0644)
```

```bash [cURL]
IMAGE_B64=$(base64 -w0 street.jpg)
curl -X POST https://apis.fotohub.app/stability/search-replace \
  -H "Authorization: Bearer <SUPABASE_JWT>" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE_B64\", \"search_prompt\": \"parked cars\", \"prompt\": \"flower beds with roses\"}"
```
:::

### Recolor

```typescript
stabilityRecolor(imageBase64: string, searchPrompt: string, newColor: string): Promise<StabilityResult>
```

Recolors a specific object in the image. `searchPrompt` selects the object to recolor and `newColor` describes the target color. This maps to the `search-recolor` tool (`search_prompt` = the object, `prompt` = the new color). Costs $0.07.

::: code-group
```typescript [TypeScript]
// imageBase64 = readFileSync('car.jpg').toString('base64')
const result = await client.stabilityRecolor(
  imageBase64,
  'the car body',
  'deep metallic blue'
);
writeFileSync('car-recolored.png', Buffer.from(result.image, 'base64'));
```

```python [Python]
result = client.stability_recolor(
    image_base64,
    search_prompt="the car body",
    prompt="deep metallic blue",
)
open("car-recolored.png", "wb").write(base64.b64decode(result["image"]))
```

```go [Go]
result, _ := client.StabilityRecolor(imageB64, "the car body", "deep metallic blue")
out, _ := base64.StdEncoding.DecodeString(result.Image)
os.WriteFile("car-recolored.png", out, 0644)
```

```bash [cURL]
IMAGE_B64=$(base64 -w0 car.jpg)
curl -X POST https://apis.fotohub.app/stability/search-recolor \
  -H "Authorization: Bearer <SUPABASE_JWT>" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE_B64\", \"search_prompt\": \"the car body\", \"prompt\": \"deep metallic blue\"}"
```
:::

### Style Transfer

```typescript
stabilityStyleTransfer(imageBase64: string, referenceBase64: string): Promise<StabilityResult>
```

Applies the visual style of a reference image to the content of the source image. The **reference image is required** and is sent as the base64 `reference` field. Costs $0.08.

::: code-group
```typescript [TypeScript]
const imageBase64 = readFileSync('photo.jpg').toString('base64');
const referenceBase64 = readFileSync('watercolor-style.jpg').toString('base64');

const result = await client.stabilityStyleTransfer(imageBase64, referenceBase64);
writeFileSync('photo-styled.png', Buffer.from(result.image, 'base64'));
```

```python [Python]
image_base64 = base64.b64encode(open("photo.jpg", "rb").read()).decode()
reference_base64 = base64.b64encode(open("watercolor-style.jpg", "rb").read()).decode()

result = client.stability_style_transfer(image_base64, reference_base64)
open("photo-styled.png", "wb").write(base64.b64decode(result["image"]))
```

```go [Go]
result, _ := client.StabilityStyleTransfer(imageB64, referenceB64)
out, _ := base64.StdEncoding.DecodeString(result.Image)
os.WriteFile("photo-styled.png", out, 0644)
```

```bash [cURL]
IMAGE_B64=$(base64 -w0 photo.jpg)
REF_B64=$(base64 -w0 watercolor-style.jpg)
curl -X POST https://apis.fotohub.app/stability/style-transfer \
  -H "Authorization: Bearer <SUPABASE_JWT>" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE_B64\", \"reference\": \"$REF_B64\"}"
```
:::

### Run Any Tool Directly

For tools without a dedicated helper (`style-guide`, `control-sketch`, `control-structure`) — or to pass extra options like `negative_prompt`, `seed`, or `output_format` — call `runStabilityTool(toolId, options)` directly.

```typescript
runStabilityTool(toolId: string, options: {
  image: string; mask?: string; prompt?: string; reference?: string;
  search_prompt?: string; output_format?: string; seed?: number;
  negative_prompt?: string; left?: number; right?: number; up?: number; down?: number;
}): Promise<StabilityResult>
```

::: code-group
```typescript [TypeScript]
// imageBase64 = readFileSync('sketch.png').toString('base64')
const result = await client.runStabilityTool('control-sketch', {
  image: imageBase64,
  prompt: 'a photorealistic sports car, studio lighting',
  seed: 42,
  output_format: 'png',
});
writeFileSync('from-sketch.png', Buffer.from(result.image, 'base64'));
```

```python [Python]
result = client.stability_run(
    "control-sketch",
    image_base64,
    prompt="a photorealistic sports car, studio lighting",
    seed=42,
    output_format="png",
)
open("from-sketch.png", "wb").write(base64.b64decode(result["image"]))
```

```go [Go]
result, _ := client.RunStabilityTool("control-sketch", fotohub.StabilityOptions{
    Image:        imageB64,
    Prompt:       "a photorealistic sports car, studio lighting",
    Seed:         42,
    OutputFormat: "png",
})
out, _ := base64.StdEncoding.DecodeString(result.Image)
os.WriteFile("from-sketch.png", out, 0644)
```

```bash [cURL]
IMAGE_B64=$(base64 -w0 sketch.png)
curl -X POST https://apis.fotohub.app/stability/control-sketch \
  -H "Authorization: Bearer <SUPABASE_JWT>" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE_B64\", \"prompt\": \"a photorealistic sports car, studio lighting\", \"seed\": 42, \"output_format\": \"png\"}"
```
:::

## 3D Generation

Generate 3D models from images or text prompts. Supports GLB, OBJ, STL, and USDZ output formats.

### Generate 3D Model

```typescript
generate3D(opts: Generate3DOptions): Promise<Job>
```

Starts a 3D model generation job. Returns immediately with a job ID for polling.

::: code-group
```typescript [TypeScript]
import { FotoHub } from 'fotohub';
import { readFileSync } from 'fs';

const client = new FotoHub({ apiKey: 'fh_live_your_api_key' });

// Image to 3D
const imageBase64 = readFileSync('product.jpg').toString('base64');
const job = await client.generate3D({
  mode: 'image-to-3d',
  model: 'fh-lite-3d',
  image: imageBase64,
  format: 'glb',
  quality: 'standard',
});

console.log(`Job ID: ${job.id}, Status: ${job.status}`);
```

```python [Python]
import base64
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

with open("product.jpg", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

job = client.generate_3d(
    mode="image-to-3d",
    model="fh-lite-3d",
    image=image_b64,
    format="glb",
    quality="standard",
)
print(f"Job ID: {job.id}, Status: {job.status}")
```

```go [Go]
package main

import (
    "encoding/base64"
    "fmt"
    "os"
    "github.com/fotohubapp/sdk-go"
)

func main() {
    client := fotohub.NewClient("fh_live_your_api_key")

    data, _ := os.ReadFile("product.jpg")
    imageB64 := base64.StdEncoding.EncodeToString(data)

    job, _ := client.Generate3D(fotohub.Generate3DOptions{
        Mode:    "image-to-3d",
        Model:   "fh-lite-3d",
        Image:   imageB64,
        Format:  "glb",
        Quality: "standard",
    })
    fmt.Printf("Job ID: %s, Status: %s\n", job.ID, job.Status)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/3d/generate \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "image-to-3d",
    "model": "fh-lite-3d",
    "image": "<base64_encoded_image>",
    "format": "glb",
    "quality": "standard"
  }'
```
:::

### Get 3D Job Status

```typescript
get3DStatus(jobId: string): Promise<Status>
```

Retrieves the current status and progress of a 3D generation job.

::: code-group
```typescript [TypeScript]
const status = await client.get3DStatus('job_abc123');
console.log(`Status: ${status.status}`);  // 'queued' | 'processing' | 'completed' | 'failed'
console.log(`Progress: ${status.progress}%`);
if (status.status === 'completed') {
  console.log(`Download: ${status.url}`);
}
```

```python [Python]
status = client.get_3d_status("job_abc123")
print(f"Status: {status.status}")
print(f"Progress: {status.progress}%")
if status.status == "completed":
    print(f"Download: {status.url}")
```

```go [Go]
status, _ := client.Get3DStatus("job_abc123")
fmt.Printf("Status: %s\n", status.Status)
fmt.Printf("Progress: %d%%\n", status.Progress)
if status.Status == "completed" {
    fmt.Printf("Download: %s\n", status.URL)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/3d/status/job_abc123 \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Wait for 3D Completion

```typescript
waitFor3D(jobId: string, options?: { pollInterval?: number; timeout?: number; onProgress?: (status: Status) => void }): Promise<Result>
```

Polls a 3D generation job until completion or timeout. Returns the final result with download URL.

::: code-group
```typescript [TypeScript]
const result = await client.waitFor3D('job_abc123', {
  pollInterval: 3000,   // check every 3 seconds
  timeout: 120_000,     // give up after 2 minutes
  onProgress: (s) => console.log(`${s.status}: ${s.progress}%`),
});

console.log(`3D Model URL: ${result.url}`);
console.log(`Format: ${result.format}`);
console.log(`Cost: $${result.billing.cost_usd}`);
```

```python [Python]
result = client.wait_for_3d(
    "job_abc123",
    poll_interval=3.0,
    timeout=120.0,
    on_progress=lambda s: print(f"{s.status}: {s.progress}%"),
)
print(f"3D Model URL: {result.url}")
print(f"Format: {result.format}")
print(f"Cost: ${result.billing.cost_usd}")
```

```go [Go]
result, _ := client.WaitFor3D("job_abc123", fotohub.WaitOptions{
    PollInterval: 3 * time.Second,
    Timeout:      120 * time.Second,
    OnProgress: func(s fotohub.Status) {
        fmt.Printf("%s: %d%%\n", s.Status, s.Progress)
    },
})
fmt.Printf("3D Model URL: %s\n", result.URL)
fmt.Printf("Cost: $%.6f\n", result.Billing.CostUSD)
```

```bash [cURL]
# Poll manually until status is "completed"
while true; do
  STATUS=$(curl -s https://apis.fotohub.app/v1/3d/status/job_abc123 \
    -H "Authorization: Bearer fh_live_your_api_key")
  echo "$STATUS" | jq '.status'
  echo "$STATUS" | jq -e '.status == "completed"' && break
  sleep 3
done
```
:::

### List 3D Models

```typescript
list3DModels(): Promise<Model[]>
```

Returns all available 3D generation models with their USD price and supported modes. `price_usd` comes from the same rate table the charge uses, so it cannot drift from what you are billed.

::: code-group
```typescript [TypeScript]
const models = await client.list3DModels();
for (const m of models) {
  console.log(`${m.name} (${m.id}): $${m.price_usd} per ${m.unit} — ${m.speed}`);
  console.log(`  Mode: ${m.mode}`);
}
```

```python [Python]
models = client.list_3d_models()
for m in models:
    print(f"{m.name} ({m.id}): ${m.price_usd} per {m.unit} - {m.speed}")
    print(f"  Mode: {m.mode}")
```

```go [Go]
models, _ := client.List3DModels()
for _, m := range models {
    fmt.Printf("%s (%s): $%.6f per %s - %s\n", m.Name, m.ID, m.PriceUSD, m.Unit, m.Speed)
    fmt.Printf("  Mode: %s\n", m.Mode)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/ai/generate/3d/models \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Available 3D Models

| Model | USD | Speed | Mode |
|-------|----:|-------|------|
| `fh-lite-3d` | 0.160772 | ~3s | image-to-3d |
| `fh-text-3d` | 0.267953 | ~25s | text-to-3d |
| `fh-pro-3d` | 0.803859 | ~60s | image-to-3d |

## Billing

Manage the prepaid USD wallet, pricing information, transactions, and top-up packages. The API is prepaid — there are no credits, and nothing here is denominated in them.

### Get Balance

```typescript
getBalance(): Promise<BillingBalance>
```

Returns your prepaid wallet balance and this month's spend, both in USD. The
`credits` field this used to return came from `user_usage_tracker`, the **web
app's** subscription counter — it told API developers they had hundreds of
credits available while their spendable API balance was $0. The API is prepaid
and credits cannot pay for it. Read the tier separately with
[`getCurrentTier()`](#get-current-tier).

::: code-group
```typescript [TypeScript]
const balance = await client.getBalance();
console.log(`Balance: $${balance.wallet.balance_usd}`);
console.log(`Spent this month: $${balance.spend.this_month_usd}`);
```

```python [Python]
balance = client.get_balance()
print(f"Balance: ${balance['wallet']['balance_usd']}")
print(f"Spent this month: ${balance['spend']['this_month_usd']}")
```

```go [Go]
balance, _ := client.GetBalance()
fmt.Printf("Balance: $%.6f\n", balance.Wallet.BalanceUSD)
fmt.Printf("Spent this month: $%.6f\n", balance.Spend.ThisMonthUSD)
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/billing/balance \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Get Pricing

```typescript
getPricing(): Promise<PricingCatalog>
```

Returns the full USD pricing catalog. `margin_info` states the rule that applies
to every figure on it: the provider's own rate, 1:1, with no platform fee added,
billed from your prepaid wallet.

Prefer `GET /v1/pricing` (the [Model Pricing](/api/models) page) for anything you
display or budget against. Both endpoints are USD, but this one rounds each entry
to four decimals, so a fraction-of-a-cent leg (prompt enhancement is $0.0004)
reads as `0.0004` here while `/v1/pricing` gives you the unrounded per-unit rate
`bill_operation` actually charges. There is no credit column: `credit_costs` was
removed, because an API call cannot be paid for in credits — a key holding
web-app credits and a $0 wallet gets HTTP 402.

::: code-group
```typescript [TypeScript]
const pricing = await client.getPricing();
console.log(pricing.margin_info);
```

```python [Python]
pricing = client.get_pricing()
print(pricing["margin_info"])
```

```go [Go]
pricing, _ := client.GetPricing()
fmt.Println(pricing.MarginInfo)
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/billing/pricing \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Get Plans

```typescript
getPlans(): Promise<ApiPlan[]>
```

::: warning There are no plans to list
This endpoint returns an **empty array**. The API sells no subscription: rate
limits come from a tier that is derived from your wallet balance and lifetime
spend, and `POST /v1/tiers/subscribe` answers 410. It is still served as a 200 so
an integration already calling it keeps working — it will simply find nothing to
iterate. Use [`getTierCatalog()`](#get-tier-catalog) for the limits and
[`getTopupPackages()`](#get-top-up-packages) for what you can actually buy.
:::

```json
{ "plans": [] }
```

::: code-group
```typescript [TypeScript]
const plans = await client.getPlans();
for (const plan of plans) {
  console.log(`${plan.name}: ${plan.rate_limit_rpm} req/min`);
}
```

```python [Python]
plans = client.get_plans()
for plan in plans:
    print(f"{plan['name']}: {plan['rate_limit_rpm']} req/min")
```

```go [Go]
plans, _ := client.GetPlans()
for _, plan := range plans {
    fmt.Printf("%s: %d req/min\n", plan.Name, plan.RateLimitRPM)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/billing/plans \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Get Credits (deprecated)

```typescript
getCredits(): Promise<CreditsInfo>
```

::: warning The API has no credits
This endpoint is deprecated. It now answers with your wallet and a message
explaining that the API is prepaid in USD — `total`/`used`/`remaining`/`resets_at`
are **not** in the response. It was kept as a 200 rather than turned into a 404
so an integration already polling it gets a self-explanatory answer instead of
one it has to guess about. Use [`getBalance()`](#get-balance).
:::

::: code-group
```typescript [TypeScript]
const info = await client.getCredits();
console.log(info.message);               // why this endpoint has no credits
console.log(`Balance: $${info.wallet.balance_usd}`);
```

```python [Python]
info = client.get_credits()
print(info["message"])
print(f"Balance: ${info['wallet']['balance_usd']}")
```

```go [Go]
info, _ := client.GetCredits()
fmt.Println(info.Message)
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/billing/credits \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Set Overage Limit

```typescript
setOverageLimit(hardLimitUsd: number, projectId?: string): Promise<void>
```

Sets a hard spending limit in USD. Once reached, API calls return `402`. Optionally scope to a specific project; a project limit takes precedence over the account-wide one. Pass `0` to disable, which reads back as `hard_limit_usd: null`.

::: warning Requires a write-scoped key
This is the one billing endpoint that will not accept a read-only key — it
answers `403`. Use a key created with **write** or **admin** access, or your
dashboard session JWT. Raising your own spending cap is a privileged action.
:::

::: code-group
```typescript [TypeScript]
// Set an account-wide hard limit of $100
await client.setOverageLimit(100);

// Set a per-project limit
await client.setOverageLimit(25, 'a1b2c3d4-5e6f-7890-abcd-ef1234567890');
```

```python [Python]
# Set an account-wide hard limit of $100
client.set_overage_limit(100)

# Set a per-project limit
client.set_overage_limit(25, project_id="a1b2c3d4-5e6f-7890-abcd-ef1234567890")
```

```bash [cURL]
curl -X PUT https://apis.fotohub.app/v1/billing/overage-limit \
  -H "Authorization: Bearer fh_live_your_write_api_key" \
  -H "Content-Type: application/json" \
  -d '{"hard_limit_usd": 100, "project_id": "YOUR_PROJECT_ID"}'
```
:::

### Get Top-Up Packages

```typescript
getTopupPackages(): Promise<TopupPackage[]>
```

Returns the 12 wallet top-up packages. Each credits `total_usd` — what you pay
plus the **volume bonus**, which is extra spendable dollars, not a credit unit.
From $500 up every rung earns one, rising from 5% to 20%.

::: code-group
```typescript [TypeScript]
const packages = await client.getTopupPackages();
for (const pkg of packages) {
  console.log(
    `${pkg.slug}: pay $${pkg.amount_usd} → $${pkg.total_usd} in the wallet` +
      (pkg.bonus_usd ? ` (+$${pkg.bonus_usd}, ${pkg.bonus_pct}%)` : ''),
  );
}
// scale-1000: pay $1000 → $1100 in the wallet (+$100, 10%)
```

```python [Python]
packages = client.get_topup_packages()
for pkg in packages:
    print(f"{pkg['slug']}: pay ${pkg['amount_usd']} → ${pkg['total_usd']}")
```

```go [Go]
packages, _ := client.GetTopupPackages()
for _, pkg := range packages {
    fmt.Printf("%s: pay $%.0f → $%.0f\n", pkg.Slug, pkg.AmountUSD, pkg.TotalUSD)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/billing/topup/packages
```
:::

The endpoint is public — no key required — so you can render the pricing table
before a visitor signs up.

| Slug | You pay | Bonus | Credited |
|------|--------:|------:|---------:|
| `topup-50` | $15 | — | $15 |
| `topup-100` | $25 | — | $25 |
| `topup-250` | $60 | — | $60 |
| `topup-500` | $120 | — | $120 |
| `scale-500` | $500 | +$25 (5%) | $525 |
| **`scale-1000`** | **$1,000** | **+$100 (10%)** | **$1,100** |
| `scale-2000` | $2,000 | +$240 (12%) | $2,240 |
| `scale-3000` | $3,000 | +$390 (13%) | $3,390 |
| `scale-5000` | $5,000 | +$750 (15%) | $5,750 |
| `scale-7500` | $7,500 | +$1,275 (17%) | $8,775 |
| `scale-10000` | $10,000 | +$1,800 (18%) | $11,800 |
| **`scale-15000`** | **$15,000** | **+$3,000 (20%)** | **$18,000** |

::: warning The four starter slugs are not their amounts
`topup-50` charges **$15**, `topup-100` **$25**, `topup-250` **$60** and
`topup-500` **$120** — historical names from the pre-USD PLN pricing, kept so
nothing keying off `"topup-50"` breaks. The `scale-*` slugs do match their dollar
amounts. Read `amount_usd` / `total_usd` from the API rather than hardcoding
either. `topup-1000` ($225) and `topup-5000` ($1,000) still resolve but are no
longer listed.
:::

### Get the Package List with the Bonus Ladder

```typescript
getTopupPackageList(): Promise<TopupPackageList>
```

Returns the same packages plus `min_usd`, `max_usd` and `bonus_tiers` — the
machine-readable ladder. Use this when you quote a **custom** amount, because the
bonus is a function of the money, not of the package.

```typescript
const { packages, min_usd, max_usd, bonus_tiers } = await client.getTopupPackageList();

// bonus_tiers is ordered high → low; the FIRST match wins.
function bonusFor(amountUsd: number): number {
  const tier = bonus_tiers.find((t) => amountUsd >= t.min_usd);
  return tier ? Math.floor(amountUsd * tier.bonus_pct) / 100 : 0;
}

bonusFor(2500);  // 325 — the 13% rung
bonusFor(499);   // 0 — below the first rung
console.log(`Custom top-ups: $${min_usd}–$${max_usd}`);
```

Iterate `bonus_tiers` **in the order the API returns it** and stop at the first
match. Sorting it ascending would pay a $15,000 top-up the $500 rung's 5% instead
of 20% — a $2,250 error. Rungs never stack, and the bonus is floored to the cent.

### Create Top-Up

```typescript
createTopup(packageSlug: string): Promise<TopupResult>
```

Buys a wallet top-up package. Returns a checkout URL for payment; payment credits
`total_usd` — the amount paid plus the bonus — to the prepaid wallet, the only
thing that pays for API calls. The bonus lands as its own `top_up_bonus` ledger
row beside the `top_up` row.

::: code-group
```typescript [TypeScript]
const topup = await client.createTopup('scale-1000');
console.log(`Pay $${topup.amount_usd}, get $${topup.total_credited_usd}`);
// Pay $1000, get $1100
// Redirect user to topup.checkout_url
```

```python [Python]
result = client.create_topup("scale-1000")
print(f"Complete purchase: {result['checkout_url']}")
```

```go [Go]
result, _ := client.CreateTopup("scale-1000")
fmt.Printf("Complete purchase: %s\n", result.CheckoutURL)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/billing/topup \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"package": "scale-1000"}'
```
:::

Send `{"amount_usd": 2500}` instead of `package` for a custom amount between $10
and $15,000; `package` comes back `null` and the bonus is computed from the
ladder. Either way the bonus is **recomputed from the amount actually captured**
at payment, so a Stripe-side adjustment cannot desync it from the ladder.

### Get Transactions

```typescript
getTransactions(options?: { page?: number; pageSize?: number; type?: string }): Promise<TransactionPage>
```

Returns one page of the wallet ledger — charges, refunds, top-ups. Rows arrive
under `data`, and there is no total count: page until a page comes back
shorter than `pageSize`. Amounts are signed (negative is a charge); `amount_usd`
is `null` on rows from before the 2026-08-05 USD cutover, which carry
`amount_pln` instead.

::: code-group
```typescript [TypeScript]
const page = await client.getTransactions({ page: 1, pageSize: 25 });
for (const tx of page.data) {
  const amount = tx.amount_usd != null ? `$${tx.amount_usd.toFixed(6)}` : `${tx.amount_pln ?? 0} PLN (pre-USD)`;
  console.log(`${tx.created_at} | ${tx.type} | ${amount} | ${tx.description}`);
}
```

```python [Python]
page = client.get_transactions(page=1, page_size=25)
for tx in page["data"]:
    amount = f"${tx['amount_usd']:.6f}" if tx.get("amount_usd") is not None else f"{tx.get('amount_pln') or 0} PLN (pre-USD)"
    print(f"{tx['created_at']} | {tx['type']} | {amount} | {tx['description']}")
```

```go [Go]
page, _ := client.GetTransactions(fotohub.TransactionOptions{Page: 1, PageSize: 25})
for _, tx := range page.Data {
    fmt.Printf("%s | %s | $%.6f | %s\n", tx.CreatedAt, tx.Type, tx.AmountUSD, tx.Description)
}
```

```bash [cURL]
curl -X GET "https://apis.fotohub.app/v1/billing/transactions?page=1&pageSize=25" \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Estimate Cost

```typescript
estimateCost(operations: CostOperation[]): Promise<CostEstimate>
```

Prices a batch of operations in USD before running them, every figure at the
provider's own rate — nothing here touches FX. Because the account is prepaid,
the estimate is only half an answer: it comes back with the wallet balance and
a server-computed `sufficient` flag, so you never compare two numbers you may
have parsed as `0`. An operation with no published rate comes back
`priced: false` in `breakdown`, with a `reason`, and is excluded from
`total_usd` rather than silently counted as free — check the top-level `priced`
flag before trusting the total.

::: code-group
```typescript [TypeScript]
const estimate = await client.estimateCost([
  { type: "generate_image", model: "seedream-5-0-260128", count: 4 },
  { type: "generate_video", model: "seedance-2-0-mini", duration: 10 },
]);
console.log(`$${estimate.total_usd} vs $${estimate.balance_usd} — ok: ${estimate.sufficient}`);
if (!estimate.priced) console.warn("Estimate is partial", estimate.breakdown);
```

```python [Python]
estimate = client.estimate_cost([
    {"type": "generate_image", "model": "seedream-5-0-260128", "count": 4},
    {"type": "generate_video", "model": "seedance-2-0-mini", "duration": 10},
])
print(f"${estimate['total_usd']} vs ${estimate['balance_usd']} - ok: {estimate['sufficient']}")
```

```go [Go]
estimate, _ := client.EstimateCost([]fotohub.CostOperation{
    {Type: "generate_image", Model: "seedream-5-0-260128", Count: 4},
    {Type: "generate_video", Model: "seedance-2-0-mini", Duration: 10},
})
fmt.Printf("$%.6f vs $%.6f - ok: %v\n", estimate.TotalUSD, estimate.BalanceUSD, estimate.Sufficient)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/billing/estimate \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {"type": "generate_image", "model": "seedream-5-0-260128", "count": 4},
      {"type": "generate_video", "model": "seedance-2-0-mini", "duration": 10}
    ]
  }'
```
:::

### Get Invoices

```typescript
getInvoices(): Promise<Invoice[]>
```

Returns all invoices for your account, including download URLs for PDF receipts.

::: code-group
```typescript [TypeScript]
const invoices = await client.getInvoices();
for (const inv of invoices) {
  console.log(`${inv.created} | ${(inv.amount_paid / 100).toFixed(2)} ${inv.currency.toUpperCase()} | ${inv.status} | ${inv.invoice_pdf}`);
}
```

```python [Python]
invoices = client.get_invoices()
for inv in invoices:
    print(f"{inv['created']} | {inv['amount_paid'] / 100:.2f} {inv['currency'].upper()} | {inv['status']} | {inv['invoice_pdf']}")
```

```go [Go]
invoices, _ := client.GetInvoices()
for _, inv := range invoices {
    fmt.Printf("%d | %.2f %s | %s | %s\n", inv.Created, float64(inv.AmountPaid)/100, strings.ToUpper(inv.Currency), inv.Status, inv.InvoicePDF)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/billing/invoices \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

## Tiers

Manage subscription tiers, compare plans, and handle enterprise applications.

### Get Tier Catalog

```typescript
getTierCatalog(): Promise<TierCatalog>
```

Returns every tier with its features and limits. Nothing on it has a price: the
API is prepaid, so a tier is a **rate-limit definition**, not a product. Every
row carries `price_monthly: null` (or `0` on pay-as-you-go) and
`purchasable: false`, and the response states it outright:

```json
{
  "currency": "USD",
  "payg_currency": "USD",
  "billing_cycle": "prepaid",
  "subscriptions_retired": true,
  "overage_policy": "None. The API is prepaid: every call is charged to your wallet at the provider's own rate, and a call that would exceed your balance is declined with HTTP 402 instead of being billed."
}
```

::: code-group
```typescript [TypeScript]
const catalog = await client.getTierCatalog();
for (const tier of [...catalog.payg, ...catalog.subscriptions]) {
  // Print the limits, not a price — there is no price to print.
  console.log(
    `${tier.name}: ${tier.limits.rpm} rpm, ` +
    `${tier.limits.concurrent_jobs} concurrent, ` +
    `${tier.limits.storage_gb} GB`
  );
}
```

```python [Python]
catalog = client.get_tier_catalog()
for tier in [*catalog["payg"], *catalog["subscriptions"]]:
    lim = tier["limits"]
    print(f"{tier['name']}: {lim['rpm']} rpm, {lim['concurrent_jobs']} concurrent, {lim['storage_gb']} GB")
```

```go [Go]
catalog, _ := client.GetTierCatalog()
for _, tier := range append(catalog.Payg, catalog.Subscriptions...) {
    fmt.Printf("%s: %d rpm, %d concurrent, %d GB\n",
        tier.Name, tier.Limits.RPM, tier.Limits.ConcurrentJobs, tier.Limits.StorageGB)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/tiers/catalog \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

::: tip Why `subscriptions` still exists
The response has no flat `tiers` array — it arrives as two: `payg`, whose tier is
resolved automatically from your wallet balance and lifetime spend, and
`subscriptions`, which carries `subscriptions_retired: true`.

Those `sub-*` rows are **not** on sale. They are still published because they are
live rate-limit definitions: an account that held one before 2026-08-13 keeps
being served its limits, so the numbers it is enforced against have to be
readable. Each retired row states this per entry — `purchasable: false`,
`legacy: true`, `upgrade_path: "wallet_topup"`. The one exception is
`sub-enterprise`: never self-served, `upgrade_path: "contact_sales"`.

To raise your limits, fund the wallet — see
[Get Top-Up Packages](#get-top-up-packages).
:::

### Get Current Tier

```typescript
getCurrentTier(): Promise<TierInfo>
```

Returns your current tier, rate limits, and usage. The tier caps how *fast*
you may spend — rpm, burst, concurrency, model access. What actually *pays*
for calls is `wallet.balance_usd`; at `0` every billed endpoint returns 402
regardless of tier.

::: code-group
```typescript [TypeScript]
const tier = await client.getCurrentTier();
console.log(`Tier: ${tier.name} (${tier.limits.rpm} rpm)`);
console.log(`Today: ${tier.usage.requests_today} / ${tier.limits.daily_quota}`);
console.log(`Balance: $${tier.wallet.balance_usd}`);
```

```python [Python]
tier = client.get_current_tier()
print(f"Tier: {tier['name']} ({tier['limits']['rpm']} rpm)")
print(f"Today: {tier['usage']['requests_today']} / {tier['limits']['daily_quota']}")
print(f"Balance: ${tier['wallet']['balance_usd']}")
```

```go [Go]
tier, _ := client.GetCurrentTier()
fmt.Printf("Tier: %s (%d rpm)\n", tier.Name, tier.Limits.RPM)
fmt.Printf("Today: %d / %d\n", tier.Usage.RequestsToday, tier.Limits.DailyQuota)
fmt.Printf("Balance: $%.6f\n", tier.Wallet.BalanceUSD)
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/tiers/current \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Compare Tiers

```typescript
compareTiers(): Promise<TierComparison>
```

Returns every tier flattened into one comparison list of limits. It does not mark
which tier is yours — get that from [`getCurrentTier()`](#get-current-tier).

There is no price column. `price_monthly` and `monthly_credits` were removed from
this response on 2026-08-13 (they quoted 49/199/799 PLN for plans that cannot be
bought), and the top level now says what the API actually charges:

```json
{
  "currency": "USD",
  "billing_model": "prepaid_wallet_usd",
  "subscriptions_retired": true
}
```

Each row carries `purchasable: false` plus an `upgrade_path` —
`"wallet_topup"` for everything self-serve, `"contact_sales"` for
`sub-enterprise`.

::: code-group
```typescript [TypeScript]
const [{ tier: mine }, comparison] = await Promise.all([
  client.getCurrentTier(),
  client.compareTiers(),
]);
for (const row of comparison.tiers) {
  const marker = row.slug === mine ? ' ← current' : '';
  console.log(`${row.name}: ${row.rpm} rpm${marker}`);
}
```

```python [Python]
tier = client.get_current_tier()
comparison = client.compare_tiers()
for row in comparison["tiers"]:
    marker = " <- current" if row["slug"] == tier["tier"] else ""
    print(f"{row['name']}: {row['rpm']} rpm{marker}")
```

```go [Go]
comparison, _ := client.CompareTiers()
for _, row := range comparison.Tiers {
    fmt.Printf("%s: %d rpm\n", row.Name, row.RPM)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/tiers/compare \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Subscribe to Tier — retired

```typescript
/** @deprecated Retired 2026-08-13 — always throws. */
subscribeTier(slug: string): Promise<{ checkout_url: string }>
```

::: danger Removed as a product on 2026-08-13
`POST /v1/tiers/subscribe` answers **HTTP 410** for every tier, and this method
is a throwing stub kept only so upgrading the SDK gives you a compile-time
deprecation instead of a `TypeError` with nothing pointing at the replacement.

```json
{
  "error": "api_subscriptions_retired",
  "use_instead": "POST /v1/tiers/wallet/topup"
}
```
:::

There are no paid API plans. Rate limits follow the prepaid wallet: top up more
and the tier rises on its own, with no monthly commitment to cancel. The swap is
in your favour — from $500 up a top-up earns a 5–20% volume bonus that a monthly
fee never gave you.

::: code-group
```typescript [TypeScript]
// Before: await client.subscribeTier('sub-developer');   // now throws (410)
const topup = await client.createTopup('scale-1000');
console.log(`Pay $${topup.amount_usd}, get $${topup.total_credited_usd}`);
```

```python [Python]
# Before: client.subscribe_tier("sub-developer")   # now raises (410)
result = client.create_topup("scale-1000")
print(f"Complete purchase: {result['checkout_url']}")
```

```go [Go]
// Before: client.SubscribeTier("sub-developer")   // now returns a 410 error
result, _ := client.CreateTopup("scale-1000")
fmt.Printf("Complete purchase: %s\n", result.CheckoutURL)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/tiers/wallet/topup \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"amount_usd": 1000}'
```
:::

`sub-enterprise` is the one exception and was never bought this way: it is a
contract, via `POST /v1/tiers/enterprise/apply`.

### Get Wallet

```typescript
getWallet(): Promise<Wallet>
```

Returns your wallet balance in USD, this month's spend, and recent transactions.

::: code-group
```typescript [TypeScript]
const wallet = await client.getWallet();
console.log(`Balance: $${wallet.balance.available_usd}`);
console.log(`Spent this month: $${wallet.this_month.spent_usd}`);
```

```python [Python]
wallet = client.get_wallet()
print(f"Balance: ${wallet['balance']['available_usd']}")
print(f"Spent this month: ${wallet['this_month']['spent_usd']}")
```

```go [Go]
wallet, _ := client.GetWallet()
fmt.Printf("Balance: $%.2f\n", wallet.Balance.AvailableUSD)
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/tiers/wallet \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Top Up Wallet

```typescript
topupWallet(
  amountUsd: number,
  payCurrency?: "usd" | "pln"
): Promise<{
  checkout_url: string;
  amount_usd: number;
  /** Volume bonus in extra spendable dollars; `0` below $500. */
  bonus_usd: number;
  /** `amount_usd + bonus_usd` — the balance increase on payment. */
  total_credited_usd: number;
  pay_currency: string;
}>
```

Tops the wallet up by any amount between **$10** and **$15,000** — the package-free
path, for a slider or a text field. Returns a Stripe checkout URL. Polish customers
can add `pay_currency: 'pln'` to pay by BLIK/card/bank transfer in PLN while the
wallet is still credited the USD amount.

From $500 up the amount earns a **volume bonus** in extra spendable dollars, on the
same ladder the packages use, so a custom $2,500 is credited $2,825 exactly as a
$2,500 preset would be. `bonus_usd` and `total_credited_usd` are the quote;
`total_credited_usd` is what the balance becomes. The response's `bonus_credits`
field, if present, is a deprecated leftover that is always `null` — the bonus is
dollars, and this product has no credits.

::: code-group
```typescript [TypeScript]
const topup = await client.topupWallet(1000);
console.log(`Pay $${topup.amount_usd}, get $${topup.total_credited_usd}`);
// Pay $1000, get $1100
// Redirect user to topup.checkout_url

// Pay in PLN via BLIK while still crediting USD to the wallet
const blik = await client.topupWallet(1000, 'pln');
```

```python [Python]
result = client.topup_wallet(1000)
print(f"Pay: {result['checkout_url']} — credited ${result['total_credited_usd']}")
```

```go [Go]
result, _ := client.TopupWallet(1000)
fmt.Printf("Pay: %s\n", result.CheckoutURL)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/tiers/wallet/topup \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"amount_usd": 1000}'
```
:::

The bonus is recomputed from the amount actually captured at payment, so the quote
above can never disagree with the grant. Use
[`getTopupPackageList()`](#get-the-package-list-with-the-bonus-ladder) to show the
bonus **before** the customer commits.

### Apply for Enterprise

```typescript
applyEnterprise(): Promise<{ id: string; status: string }>
```

Submits an enterprise tier application. FOTOhub team will review and contact you.

::: code-group
```typescript [TypeScript]
const { id, status } = await client.applyEnterprise({
  company_name: 'Acme Corp',
  contact_email: 'api@acme.com',
  expected_usage: '50,000+ generations/month',
  use_case: 'E-commerce product photography at scale',
});
console.log(`Application ${id}: ${status}`);
```

```python [Python]
result = client.apply_enterprise(
    company_name="Acme Corp",
    contact_email="api@acme.com",
    expected_usage="50,000+ generations/month",
    use_case="E-commerce product photography at scale",
)
print(f"Application {result.id}: {result.status}")
```

```go [Go]
result, _ := client.ApplyEnterprise(fotohub.EnterpriseApplication{
    CompanyName:   "Acme Corp",
    ContactEmail:  "api@acme.com",
    ExpectedUsage: "50,000+ generations/month",
    UseCase:       "E-commerce product photography at scale",
})
fmt.Printf("Application %s: %s\n", result.ID, result.Status)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/tiers/enterprise/apply \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Acme Corp",
    "contact_email": "api@acme.com",
    "expected_usage": "50,000+ generations/month",
    "use_case": "E-commerce product photography at scale"
  }'
```
:::

## Webhooks

Manage webhooks for receiving async notifications about job completions, billing events, and more.

### List Webhooks

```typescript
listWebhooks(): Promise<Webhook[]>
```

Returns all configured webhooks for your account.

::: code-group
```typescript [TypeScript]
const webhooks = await client.listWebhooks();
for (const wh of webhooks) {
  console.log(`${wh.id}: ${wh.url} — events: ${wh.events.join(', ')} (${wh.status})`);
}
```

```python [Python]
webhooks = client.list_webhooks()
for wh in webhooks:
    print(f"{wh.id}: {wh.url} - events: {', '.join(wh.events)} ({wh.status})")
```

```go [Go]
webhooks, _ := client.ListWebhooks()
for _, wh := range webhooks {
    fmt.Printf("%s: %s - events: %v (%s)\n", wh.ID, wh.URL, wh.Events, wh.Status)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/webhooks \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Create Webhook

```typescript
createWebhook(opts: { url: string; events: string[]; description?: string }): Promise<Webhook & { secret: string }>
```

Creates a new webhook endpoint. Returns the webhook object including the signing `secret` (shown only once).

::: warning `events` is validated against a fixed list
Only these values are accepted; a single unknown entry rejects the whole call
with `400 Invalid events`:

`generation.completed`, `generation.failed`, `credits.low`, `credits.depleted`,
`key.used`, `billing.charged`, `images.batch.completed`, `background.removed`,
`background.replaced`, `background.blurred`, `shadow.added`,
`commerce.job.completed`, `commerce.job.failed`, `commerce.item.completed`,
`commerce.job.awaiting_credits`.

There are no media-specific events — video and 3D completions both arrive as
`generation.completed`. Earlier revisions of this page showed `video.completed`,
`3d.completed` and `billing.threshold`; none of those exist.
:::

::: code-group
```typescript [TypeScript]
const webhook = await client.createWebhook({
  url: 'https://myapp.com/webhooks/fotohub',
  events: ['generation.completed', 'generation.failed'],
  description: 'Production webhook',
});

console.log(`ID: ${webhook.id}`);
console.log(`Secret: ${webhook.secret}`);  // Store securely — shown only once
```

```python [Python]
webhook = client.create_webhook(
    url="https://myapp.com/webhooks/fotohub",
    events=["generation.completed", "generation.failed"],
    description="Production webhook",
)
print(f"ID: {webhook.id}")
print(f"Secret: {webhook.secret}")  # Store securely
```

```go [Go]
webhook, _ := client.CreateWebhook(fotohub.WebhookOptions{
    URL:         "https://myapp.com/webhooks/fotohub",
    Events:      []string{"generation.completed", "generation.failed"},
    Description: "Production webhook",
})
fmt.Printf("ID: %s\n", webhook.ID)
fmt.Printf("Secret: %s\n", webhook.Secret)  // Store securely
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/webhooks \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://myapp.com/webhooks/fotohub",
    "events": ["generation.completed", "generation.failed"],
    "description": "Production webhook"
  }'
```
:::

### Update Webhook

```typescript
updateWebhook(id: string, opts: { url?: string; events?: string[]; status?: 'active' | 'paused' }): Promise<Webhook>
```

Updates an existing webhook's URL, events, or status.

::: code-group
```typescript [TypeScript]
const updated = await client.updateWebhook('wh_abc123', {
  events: ['generation.completed', 'generation.failed', 'billing.charged'],
  status: 'active',
});
console.log(`Updated: ${updated.id}, events: ${updated.events.length}`);
```

```python [Python]
updated = client.update_webhook("wh_abc123",
    events=["generation.completed", "generation.failed", "billing.charged"],
    status="active",
)
print(f"Updated: {updated.id}, events: {len(updated.events)}")
```

```go [Go]
updated, _ := client.UpdateWebhook("wh_abc123", fotohub.WebhookUpdateOptions{
    Events: []string{"generation.completed", "generation.failed", "billing.charged"},
    Status: "active",
})
fmt.Printf("Updated: %s, events: %d\n", updated.ID, len(updated.Events))
```

```bash [cURL]
curl -X PATCH https://apis.fotohub.app/v1/webhooks/wh_abc123 \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "events": ["generation.completed", "generation.failed", "billing.charged"],
    "status": "active"
  }'
```
:::

### Delete Webhook

```typescript
deleteWebhook(id: string): Promise<void>
```

Permanently deletes a webhook endpoint.

::: code-group
```typescript [TypeScript]
await client.deleteWebhook('wh_abc123');
console.log('Webhook deleted');
```

```python [Python]
client.delete_webhook("wh_abc123")
print("Webhook deleted")
```

```go [Go]
client.DeleteWebhook("wh_abc123")
fmt.Println("Webhook deleted")
```

```bash [cURL]
curl -X DELETE https://apis.fotohub.app/v1/webhooks/wh_abc123 \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Test Webhook

```typescript
testWebhook(id: string): Promise<{ success: boolean; response_time_ms: number }>
```

Sends a test event to your webhook endpoint and reports whether it responded successfully.

::: code-group
```typescript [TypeScript]
const test = await client.testWebhook('wh_abc123');
console.log(`Success: ${test.success}, Response time: ${test.response_time_ms}ms`);
```

```python [Python]
test = client.test_webhook("wh_abc123")
print(f"Success: {test.success}, Response time: {test.response_time_ms}ms")
```

```go [Go]
test, _ := client.TestWebhook("wh_abc123")
fmt.Printf("Success: %t, Response time: %dms\n", test.Success, test.ResponseTimeMs)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/webhooks/wh_abc123/test \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Get Webhook Logs

```typescript
getWebhookLogs(id: string): Promise<WebhookLog[]>
```

Returns recent delivery attempts for a webhook, including status codes and response bodies.

::: code-group
```typescript [TypeScript]
const logs = await client.getWebhookLogs('wh_abc123');
for (const log of logs) {
  console.log(`${log.timestamp} | ${log.event} | ${log.status_code} | ${log.success ? 'OK' : 'FAIL'}`);
}
```

```python [Python]
logs = client.get_webhook_logs("wh_abc123")
for log in logs:
    status = "OK" if log.success else "FAIL"
    print(f"{log.timestamp} | {log.event} | {log.status_code} | {status}")
```

```go [Go]
logs, _ := client.GetWebhookLogs("wh_abc123")
for _, log := range logs {
    status := "OK"
    if !log.Success {
        status = "FAIL"
    }
    fmt.Printf("%s | %s | %d | %s\n", log.Timestamp, log.Event, log.StatusCode, status)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/webhooks/wh_abc123/logs \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

## Gabriel AI

Gabriel is FOTOhub's intelligent routing assistant. It classifies prompts, suggests completions, and recommends optimal models and parameters for your use case.

### Classify Prompt

```typescript
gabrielClassify(prompt: string, opts?: { context?: string }): Promise<Classification>
```

Classifies a user prompt into a category and suggests the best model and parameters.

::: code-group
```typescript [TypeScript]
const classification = await client.gabrielClassify(
  'Generate a 3D model of a sneaker from this photo',
  { context: 'e-commerce product pipeline' }
);

console.log(`Category: ${classification.category}`);      // 'image_to_3d'
console.log(`Model: ${classification.recommended_model}`); // 'fh-lite-3d'
console.log(`Confidence: ${classification.confidence}`);   // 0.95
console.log(`Parameters:`, classification.suggested_params);
```

```python [Python]
classification = client.gabriel_classify(
    "Generate a 3D model of a sneaker from this photo",
    context="e-commerce product pipeline"
)
print(f"Category: {classification.category}")
print(f"Model: {classification.recommended_model}")
print(f"Confidence: {classification.confidence}")
print(f"Parameters: {classification.suggested_params}")
```

```go [Go]
classification, _ := client.GabrielClassify("Generate a 3D model of a sneaker from this photo", fotohub.ClassifyOptions{
    Context: "e-commerce product pipeline",
})
fmt.Printf("Category: %s\n", classification.Category)
fmt.Printf("Model: %s\n", classification.RecommendedModel)
fmt.Printf("Confidence: %.2f\n", classification.Confidence)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/gabriel/classify \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Generate a 3D model of a sneaker from this photo",
    "context": "e-commerce product pipeline"
  }'
```
:::

### Suggest Completions

```typescript
gabrielSuggest(partial: string, opts?: { limit?: number; category?: string }): Promise<Suggestion[]>
```

Returns prompt completions and suggestions based on a partial input.

::: code-group
```typescript [TypeScript]
const suggestions = await client.gabrielSuggest('A cinematic drone shot of', {
  limit: 5,
  category: 'video',
});

for (const s of suggestions) {
  console.log(`${s.text} (score: ${s.score})`);
}
```

```python [Python]
suggestions = client.gabriel_suggest(
    "A cinematic drone shot of",
    limit=5,
    category="video"
)
for s in suggestions:
    print(f"{s.text} (score: {s.score})")
```

```go [Go]
suggestions, _ := client.GabrielSuggest("A cinematic drone shot of", fotohub.SuggestOptions{
    Limit:    5,
    Category: "video",
})
for _, s := range suggestions {
    fmt.Printf("%s (score: %.2f)\n", s.Text, s.Score)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/gabriel/suggest \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "partial": "A cinematic drone shot of",
    "limit": 5,
    "category": "video"
  }'
```
:::

### Get Recommendations

```typescript
gabrielRecommend(options?: GabrielRecommendOptions): Promise<GabrielRecommendation[]>
```

Returns proactive, context-aware recommendations based on user state. No
authentication required; template-based (<100ms response).

::: warning `credits_remaining` is a hint, not your API balance
It describes *your end user's* fotohub.app subscription credits — pass it
only if you are building on top of the web app. It never funds an API call.
Read [`getBalance()`](#get-balance) for the prepaid USD wallet that actually
pays for generations.
:::

::: code-group
```typescript [TypeScript]
const recs = await client.gabrielRecommend({
  page: '/generate/new',
  has_brand: false,
});

for (const rec of recs) {
  console.log(`${rec.text} → ${rec.target}`);
}
```

```python [Python]
recs = client.gabriel_recommend(page="/generate/new", has_brand=False)
for rec in recs:
    print(f"{rec['text']} -> {rec['target']}")
```

```go [Go]
recs, _ := client.GabrielRecommend(fotohub.GabrielRecommendOptions{
    Page:     "/generate/new",
    HasBrand: false,
})
for _, rec := range recs {
    fmt.Printf("%s -> %s\n", rec.Text, rec.Target)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/gabriel/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "page": "/generate/new",
    "has_brand": false
  }'
```
:::

## Models

### List Models

```typescript
listModels(category?: string): Promise<Model[]>
```

Returns all available AI models, optionally filtered by category (`image`, `video`, `text`, `audio`).
Multiply by the duration when `price_unit` is `"second"` — every video model
quotes per second, even though `pricing_type` says `"request"`.

::: code-group
```typescript [TypeScript]
// List all models
const allModels = await client.listModels();
console.log(`Total models: ${allModels.length}`);

// Filter by category
const videoModels = await client.listModels('video');
for (const m of videoModels) {
  console.log(`${m.name} (${m.id}): $${m.request_price} per ${m.request_price_per}`);
}
```

```python [Python]
# List all models
all_models = client.list_models()
print(f"Total models: {len(all_models)}")

# Filter by category
video_models = client.list_models(category="video")
for m in video_models:
    print(f"{m.name} ({m.id}): ${m.request_price} per {m.request_price_per}")
```

```go [Go]
// List all models
allModels, _ := client.ListModels("")
fmt.Printf("Total models: %d\n", len(allModels))

// Filter by category
videoModels, _ := client.ListModels("video")
for _, m := range videoModels {
    fmt.Printf("%s (%s): $%.6f per %s\n", m.Name, m.ID, m.RequestPrice, m.RequestPricePer)
}
```

```bash [cURL]
# All models
curl -X GET https://apis.fotohub.app/v1/models \
  -H "Authorization: Bearer fh_live_your_api_key"

# By category
curl -X GET "https://apis.fotohub.app/v1/models?category=image" \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Model Response Type

```typescript
interface Model {
  /** Unique model identifier */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Category: image, video, text, audio */
  category: string;
  /** Provider name */
  provider: string;
  /** Whether the model is currently offered */
  is_active: boolean;
  /**
   * Price of ONE unit of this model, in USD. The unit is `price_unit` — on a
   * video model this is per SECOND, so a 5s clip costs 5x this figure. `null`
   * on token-priced models.
   */
  request_price: number | null;
  /** What one unit of `request_price` buys: "request" | "second" | "minute" | "1k_characters" | "1k_tokens" */
  price_unit: string;
  /** The same thing as `price_unit`, spelled out for humans */
  request_price_per: string;
  /** Always "USD" */
  currency: string;
  /** USD per 1000 input tokens, on token-priced models */
  input_price_per_1k_tokens?: number | null;
  /** USD per 1000 output tokens, on token-priced models */
  output_price_per_1k_tokens?: number | null;
}
```

## Error Handling

The SDK provides a typed error hierarchy for precise error handling across all methods.

### Error Classes

```typescript
import {
  FotoHubError,
  InsufficientFundsError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
} from 'fotohub/errors';
```

::: warning `InsufficientCreditsError` is a deprecated alias
The API is prepaid in USD and has no credits. `InsufficientCreditsError` is
exported as the exact same class as `InsufficientFundsError` (so an existing
`instanceof InsufficientCreditsError` check still catches it), but the thrown
error's `code` is now `insufficient_funds`, not `insufficient_credits` — code
that compares the string needs updating. The alias is removed in the next
major version.
:::

### Comprehensive Error Handling

::: code-group
```typescript [TypeScript]
import { FotoHub } from 'fotohub';
import {
  FotoHubError,
  InsufficientFundsError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
} from 'fotohub/errors';

const client = new FotoHub({ apiKey: 'fh_live_your_api_key' });

try {
  const result = await client.generateImage({
    prompt: 'A landscape',
    model: 'seedream-5-0-260128',
  });
  console.log(`Image: ${result.images[0]}`);
} catch (e) {
  if (e instanceof AuthenticationError) {
    // Invalid or expired API key (401)
    console.error('Invalid API key. Check your credentials.');
  } else if (e instanceof InsufficientFundsError) {
    // Prepaid wallet is short (402) — nothing was charged
    console.error(`Need $${e.requiredUsd}, balance $${e.balanceUsd}`);
    console.error(`Top up $${e.shortfallUsd} at ${e.topupUrl}`);
  } else if (e instanceof RateLimitError) {
    // Too many requests (429) — SDK retries automatically, but may still throw
    console.error(`Rate limited. Retry after ${e.retryAfter}s`);
  } else if (e instanceof ValidationError) {
    // Invalid request parameters (422)
    console.error(`Validation failed: ${JSON.stringify(e.fieldErrors)}`);
  } else if (e instanceof FotoHubError) {
    // Other API errors (4xx/5xx)
    console.error(`[${e.statusCode}] ${e.code}: ${e.message}`);
  } else {
    // Network errors, timeouts, etc.
    throw e;
  }
}
```

```python [Python]
from fotohub import FotoHub
from fotohub.exceptions import (
    FotoHubError,
    AuthenticationError,
    InsufficientFundsError,
    RateLimitError,
    ValidationError,
)

client = FotoHub(api_key="fh_live_your_api_key")

try:
    result = client.generate_image(
        prompt="A landscape",
        model="seedream-5-0-260128",
    )
    print(f"Image: {result.images[0]}")
except AuthenticationError:
    print("Invalid API key. Check your credentials.")
except InsufficientFundsError as e:
    # Prepaid wallet is short. NOTHING was charged.
    print(f"Need ${e.required_usd}, balance ${e.balance_usd}")
    print(f"Top up ${e.shortfall_usd} at {e.topup_url}")
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after}s")
except ValidationError as e:
    print(f"Validation failed: {e.field_errors}")
except FotoHubError as e:
    print(f"[{e.status_code}] {e.code}: {e.message}")
```

```go [Go]
package main

import (
    "errors"
    "fmt"
    "github.com/fotohubapp/sdk-go"
)

func main() {
    client := fotohub.NewClient("fh_live_your_api_key")

    result, err := client.GenerateImage(fotohub.GenerateImageOptions{
        Prompt: "A landscape",
        Model:  "seedream-5-0-260128",
    })
    if err != nil {
        var authErr *fotohub.AuthenticationError
        var fundsErr *fotohub.InsufficientFundsError
        var rateErr *fotohub.RateLimitError
        var valErr *fotohub.ValidationError
        var apiErr *fotohub.FotoHubError

        switch {
        case errors.As(err, &authErr):
            fmt.Println("Invalid API key.")
        case errors.As(err, &fundsErr):
            fmt.Printf("Need $%.2f, balance $%.2f\n", fundsErr.RequiredUsd, fundsErr.BalanceUsd)
        case errors.As(err, &rateErr):
            fmt.Printf("Rate limited. Retry after %ds\n", rateErr.RetryAfter)
        case errors.As(err, &valErr):
            fmt.Printf("Validation failed: %v\n", valErr.FieldErrors)
        case errors.As(err, &apiErr):
            fmt.Printf("[%d] %s: %s\n", apiErr.StatusCode, apiErr.Code, apiErr.Message)
        default:
            fmt.Printf("Network error: %v\n", err)
        }
        return
    }
    fmt.Printf("Image: %s\n", result.Images[0])
}
```

```bash [cURL]
# Errors return JSON with code and message:
# 401: {"error": {"code": "authentication_error", "message": "Invalid API key"}}
# 402: {"detail": {"error": "insufficient_funds", "code": "insufficient_funds", "required_usd": 0.05, "balance_usd": 0.0, "shortfall_usd": 0.05, "charged": false, "topup_url": "..."}}
# 429: {"error": {"code": "rate_limit_exceeded", "message": "...", "retry_after": 30}}
# 422: {"error": {"code": "validation_error", "message": "...", "fieldErrors": {"model": ["required"]}}}

curl -X POST https://apis.fotohub.app/v1/image/generate \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A landscape", "model": "seedream-5-0-260128"}'

# Check HTTP status code:
# 200 = success, 4xx/5xx = error (parse JSON body for details)
```
:::

### Error Class Hierarchy

```typescript
class FotoHubError extends Error {
  /** Machine-readable error code */
  code: string;
  /** HTTP status code */
  statusCode: number | undefined;
  /** Additional error context */
  details: Record<string, unknown> | undefined;
}

class AuthenticationError extends FotoHubError {
  // statusCode is always 401
}

class InsufficientFundsError extends FotoHubError {
  // statusCode is always 402, code is "insufficient_funds"
  /** USD price of the refused request */
  requiredUsd: number | undefined;
  /** USD wallet balance at the time of the refusal */
  balanceUsd: number | undefined;
  /** The minimum top-up that would let this request through */
  shortfallUsd: number | undefined;
  /** Where to add funds */
  topupUrl: string | undefined;
  /** The operation that was refused, e.g. `generate_image:seedream-5-0-pro` */
  operation: string | undefined;
  /** Nothing was charged for a refused request. Always `false`. */
  get charged(): boolean;
}

class RateLimitError extends FotoHubError {
  /** Seconds to wait before retrying */
  retryAfter: number | undefined;
}

class ValidationError extends FotoHubError {
  /** Field-level validation errors */
  fieldErrors: Record<string, string[]> | undefined;
}
```

### Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `authentication_error` | 401 | Invalid or missing API key |
| `insufficient_funds` | 402 | Prepaid wallet balance too low — nothing charged |
| `rate_limit_exceeded` | 429 | Too many requests, retry after delay |
| `validation_error` | 422 | Invalid request parameters |
| `not_found` | 404 | Requested resource does not exist |
| `server_error` | 500 | Server-side error |

## Balance and Usage

```typescript
// Check account balance
const balance = await client.getBalance();
console.log(`Balance: $${balance.wallet.balance_usd}`);
console.log(`Spent this month: $${balance.spend.this_month_usd}`);

// Get usage statistics
const usage = await client.getUsage({ period: '30d' });
console.log(`Total requests: ${usage.totals.totalRequests}`);
```

## OpenAI SDK Compatibility

The chat completions endpoint is fully compatible with the OpenAI API format. Use the official OpenAI SDK as a drop-in client:

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'fh_live_your_key_here',
  baseURL: 'https://apis.fotohub.app/v1/ai',
});

// All OpenAI SDK features work
const response = await client.chat.completions.create({
  model: 'gemini-flash',
  messages: [{ role: 'user', content: 'Hello' }],
});
console.log(response.choices[0].message.content);

// Streaming is NOT supported here. `stream: true` is accepted and ignored, and
// the OpenAI SDK will hang or error waiting for chunks that never arrive.
// Use /v1/ai/agent/stream with fetch() instead — see the Streaming section above.
```

::: warning Four model IDs, and no streaming
The OpenAI-compatible endpoint accepts exactly `gemini-flash`, `gemini-pro`,
`gpt-4o` and `claude-sonnet`. Anything else returns `400` with the supported
list — it is not silently downgraded to a default. `gpt-4o` and `claude-sonnet`
are stable aliases that route to newer models internally.

`stream: true` is accepted for drop-in compatibility and then ignored; the
response is always one complete JSON body. Image and video generation use
FOTOhub-specific endpoints, not this one.
:::

## API Reference

### Client Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `generateImage(options)` | Generate images from text | `Promise<ImageResult>` |
| `generateVideo(options)` | Generate a video (synchronous — returns `video_url`) | `Promise<VideoResult>` |
| `generateMusic(options)` | Generate audio/music | `Promise<MusicResult>` |
| `generateSfx(options)` | Generate sound effects | `Promise<SfxResult>` |
| `generateSpeech(options)` | Text-to-speech synthesis | `Promise<SpeechResult>` |
| `transcribe(options)` | Transcribe audio to text | `Promise<TranscriptionResult>` |
| `chat(options)` | Standard chat completion (token-billed) | `Promise<ChatResult>` |
| `chatClaude(options)` | Premium chat completion (token-based) | `Promise<ChatResult>` |
| `chatStream(options)` | ⚠️ Broken — targets the non-streaming endpoint and yields zero chunks while still billing. Use `fetch` on `/v1/ai/agent/stream`. | `Promise<ChatStream>` |
| `analyzeImage(options)` | Analyze an image with vision models | `Promise<AnalysisResult>` |
| `enhancePrompt(prompt, style?)` | Improve a prompt with AI | `Promise<string>` |
| `editImage(options)` | Edit an image | `Promise<EditResult>` |
| `generate3D(options)` | Start 3D model generation | `Promise<ThreeDResult>` |
| `get3DStatus(jobId)` | Get 3D job status | `Promise<ThreeDResult>` |
| `waitFor3D(jobId, options?)` | Poll until 3D completes | `Promise<ThreeDResult>` |
| `list3DModels()` | List available 3D models | `Promise<ThreeDModelInfo[]>` |
| `listStabilityTools()` | List Stability AI tools | `Promise<StabilityTool[]>` |
| `runStabilityTool(toolId, options)` | Run any Stability tool by ID | `Promise<StabilityResult>` |
| `removeBackground(imageUrl)` | Remove image background | `Promise<StabilityResult>` |
| `upscaleImage(imageUrl, scale?)` | Upscale an image | `Promise<StabilityResult>` |
| `getBalance()` | Get account balance | `Promise<BillingBalance>` |
| `getPricing(category?)` | Get model pricing | `Promise<PricingCatalog>` |
| `getPlans()` | Get subscription plans | `Promise<ApiPlan[]>` |
| `getCredits()` | @deprecated — returns the wallet with a deprecation message | `Promise<CreditsInfo>` |
| `setOverageLimit(hardLimitUsd, projectId?)` | Set spending limit | `Promise<OverageResult>` |
| `getTopupPackages()` | Get top-up packages | `Promise<TopupPackage[]>` |
| `createTopup(packageSlug)` | Create top-up checkout | `Promise<TopupResult>` |
| `getTransactions(options?)` | Get transaction history | `Promise<TransactionPage>` |
| `estimateCost(operations)` | Estimate operation cost | `Promise<CostEstimate>` |
| `getInvoices()` | Get invoices | `Promise<Invoice[]>` |
| `getTierCatalog()` | Get all tiers | `Promise<TierCatalog>` |
| `getCurrentTier()` | Get your current tier | `Promise<TierInfo>` |
| `compareTiers()` | Compare all tiers | `Promise<TierComparison>` |
| ~~`subscribeTier(tierSlug)`~~ | **Retired 2026-08-13** — throws (410). Use `createTopup()` | `never` |
| `getTopupPackageList()` | Packages + bonus ladder + bounds | `Promise<TopupPackageList>` |
| `getWallet()` | Get wallet balance | `Promise<WalletInfo>` |
| `topupWallet(amountUsd, payCurrency?)` | Top up wallet | `Promise<{ checkout_url: string }>` |
| `applyEnterprise(application)` | Apply for enterprise | `Promise<{ id: string; status: string }>` |
| `listWebhooks()` | List webhooks | `Promise<Webhook[]>` |
| `createWebhook(options)` | Create webhook | `Promise<Webhook>` |
| `updateWebhook(id, options)` | Update webhook | `Promise<Webhook>` |
| `deleteWebhook(id)` | Delete webhook | `Promise<void>` |
| `testWebhook(id)` | Test webhook delivery | `Promise<WebhookTestResult>` |
| `getWebhookLogs(id)` | Get webhook logs | `Promise<WebhookLog[]>` |
| `gabrielClassify(options)` | Classify prompt intent | `Promise<...>` |
| `gabrielSuggest(options)` | Suggest completions | `Promise<...>` |
| `gabrielRecommend(options?)` | Get recommendations | `Promise<...>` |
| `translate(options)` | Translate text | `Promise<...>` |
| `listModels(category?)` | List available models | `Promise<Model[]>` |

### Environment Variables

The TypeScript SDK reads only the API key from the environment (and only when you pass it explicitly, e.g. `new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! })`). Base URL, timeout, and retries are set via constructor options.

| Variable | Description |
|----------|-------------|
| `FOTOHUB_API_KEY` | API key — pass it to the constructor as shown above |

### Automatic Retries

The SDK automatically retries failed requests for transient errors:

- **429 Too Many Requests** - respects `Retry-After` header
- **500, 502, 503, 504** - exponential backoff with jitter

Retries do NOT apply to:
- 400 (validation errors)
- 401 (authentication errors)
- 402 (insufficient funds)
- 404 (not found)

```typescript
const client = new FotoHub({
  apiKey: 'fh_live_your_key_here',
  maxRetries: 5,        // up to 5 retries
  timeout: 120_000,     // 2 minute timeout per attempt
});
```
