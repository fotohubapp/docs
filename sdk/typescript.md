# TypeScript SDK

Official TypeScript/JavaScript SDK for the FOTOhub API. Provides full type safety, tree-shaking support, automatic retries, streaming via async iterators, and built-in error handling. Works in Node.js 18+, Deno, and edge runtimes (Cloudflare Workers, Vercel Edge).

## Installation

::: code-group
```bash [npm]
npm install @fotohub/sdk
```

```bash [pnpm]
pnpm add @fotohub/sdk
```

```bash [yarn]
yarn add @fotohub/sdk
```

```bash [bun]
bun add @fotohub/sdk
```
:::

**Requirements:** Node.js 18+ (or any runtime with `fetch` and `ReadableStream` support).

## Quick Start

```typescript
import { FotohubClient } from '@fotohub/sdk';

const client = new FotohubClient({ apiKey: 'fh_live_your_key_here' });

// Generate an image
const result = await client.generateImage({
  prompt: 'A futuristic city at sunset',
  model: 'imagen-4-standard',
});

console.log(`Image: ${result.images[0]}`);
console.log(`Cost: ${result.billing.pln_charged} PLN`);
console.log(`Credits used: ${result.billing.credits_used}`);
```

## Client Initialization

### With API Key

```typescript
import { FotohubClient } from '@fotohub/sdk';

const client = new FotohubClient({
  apiKey: 'fh_live_your_key_here',
  baseUrl: 'https://apis.fotohub.app/v1',  // default
  timeout: 60_000,                          // 60s default
  maxRetries: 3,                            // automatic retries for 429/5xx
});
```

### With Environment Variable

```typescript
import { FotohubClient } from '@fotohub/sdk';

// Automatically reads FOTOHUB_API_KEY from process.env
const client = new FotohubClient();
```

Set the environment variable in your `.env` file:

```bash
# .env
FOTOHUB_API_KEY=fh_live_your_key_here
FOTOHUB_BASE_URL=https://apis.fotohub.app/v1
FOTOHUB_TIMEOUT=60000
FOTOHUB_MAX_RETRIES=3
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | `process.env.FOTOHUB_API_KEY` | Your API key (starts with `fh_live_` or `fh_test_`) |
| `baseUrl` | `string` | `https://apis.fotohub.app/v1` | API base URL |
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
  ChatCompletionOptions,
  ChatStreamOptions,

  // Response types
  ImageResult,
  VideoResult,
  MusicResult,
  ChatResult,
  ChatStreamChunk,

  // Common types
  BillingInfo,
  Balance,
  UsageStats,
  Model,
} from '@fotohub/sdk';
```

### GenerateImageOptions

```typescript
interface GenerateImageOptions {
  /** Text prompt describing the desired image */
  prompt: string;
  /** Model ID (e.g., 'imagen-4-standard', 'seedream-5-0-260128', 'flux-kontext-pro') */
  model: string;
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
  /** Aspect ratio shorthand (e.g., '16:9', '1:1', '9:16') */
  aspectRatio?: string;
  /** Number of images to generate (1-4) */
  numImages?: number;
  /** Negative prompt for exclusions */
  negativePrompt?: string;
  /** Generation seed for reproducibility */
  seed?: number;
  /** Per-request timeout override in ms */
  timeout?: number;
}
```

### GenerateVideoOptions

```typescript
interface GenerateVideoOptions {
  /** Text prompt describing the desired video */
  prompt: string;
  /** Model ID (e.g., 'kling-v2', 'veo-2', 'wan-2.1') */
  model: string;
  /** Video duration in seconds */
  duration?: number;
  /** Aspect ratio (e.g., '16:9', '9:16') */
  aspectRatio?: string;
  /** Input image URL for image-to-video */
  imageUrl?: string;
  /** Motion intensity (1-10) */
  motion?: number;
  /** Per-request timeout override in ms */
  timeout?: number;
}
```

### ChatCompletionOptions

```typescript
interface ChatCompletionOptions {
  /** Array of message objects */
  messages: ChatMessage[];
  /** Model ID (e.g., 'gemini-flash', 'claude-sonnet-4.6', 'gpt-4o') */
  model: string;
  /** System prompt */
  system?: string;
  /** Sampling temperature (0-2) */
  temperature?: number;
  /** Maximum tokens in response */
  maxTokens?: number;
  /** Top-p nucleus sampling */
  topP?: number;
  /** Stop sequences */
  stop?: string[];
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

## Image Generation

### Basic Generation

```typescript
import { FotohubClient } from '@fotohub/sdk';

const client = new FotohubClient({ apiKey: 'fh_live_your_key_here' });

const result = await client.generateImage({
  prompt: 'A futuristic city at sunset',
  model: 'imagen-4-standard',
});

console.log(`Image: ${result.images[0]}`);
console.log(`Cost: ${result.billing.pln_charged} PLN`);
```

### Multiple Images with Options

```typescript
const result = await client.generateImage({
  prompt: 'Professional product photography, white background, studio lighting',
  model: 'seedream-5-0-260128',
  aspectRatio: '1:1',
  numImages: 4,
  negativePrompt: 'blurry, low quality, distorted',
});

// Iterate over all generated images
for (const imageUrl of result.images) {
  console.log(imageUrl);
}

// Access billing information
console.log(`Total cost: ${result.billing.pln_charged} PLN`);
console.log(`Credits used: ${result.billing.credits_used}`);
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
  /** Array of generated image URLs */
  images: string[];
  /** Model used for generation */
  model: string;
  /** Billing breakdown */
  billing: {
    credits_used: number;
    pln_charged: number;
    billing_type: 'credits' | 'pln';
  };
  /** Generation metadata */
  metadata: {
    seed?: number;
    width: number;
    height: number;
    duration_ms: number;
  };
}
```

## Video Generation

```typescript
const result = await client.generateVideo({
  prompt: 'A drone flying over a mountain landscape, cinematic',
  model: 'kling-v2',
  duration: 5,
  aspectRatio: '16:9',
});

console.log(`Status: ${result.status}`);  // 'processing' | 'completed' | 'failed'
console.log(`Job ID: ${result.jobId}`);

// Poll for completion
const completed = await client.waitForVideo(result.jobId, {
  pollInterval: 5000,  // check every 5s
  maxWait: 300_000,    // timeout after 5 min
});

console.log(`Video URL: ${completed.videoUrl}`);
console.log(`Cost: ${completed.billing.pln_charged} PLN`);
```

### Image-to-Video

```typescript
const result = await client.generateVideo({
  prompt: 'Gentle camera zoom, subtle movement in the clouds',
  model: 'kling-v2',
  imageUrl: 'https://example.com/my-image.jpg',
  duration: 5,
  aspectRatio: '16:9',
});
```

### VideoResult Response Type

```typescript
interface VideoResult {
  /** Job ID for polling */
  jobId: string;
  /** Current status */
  status: 'processing' | 'completed' | 'failed';
  /** Video URL (available when status is 'completed') */
  videoUrl?: string;
  /** Billing breakdown */
  billing: {
    credits_used: number;
    pln_charged: number;
  };
}
```

## Music Generation

```typescript
const result = await client.generateMusic({
  prompt: 'Upbeat electronic music with synthesizers, 120 BPM',
  model: 'stable-audio',
  duration: 30,
});

console.log(`Audio URL: ${result.audioUrl}`);
console.log(`Duration: ${result.duration}s`);
console.log(`Cost: ${result.billing.pln_charged} PLN`);
```

### MusicResult Response Type

```typescript
interface MusicResult {
  /** URL to the generated audio file */
  audioUrl: string;
  /** Duration in seconds */
  duration: number;
  /** Audio format */
  format: 'mp3' | 'wav';
  /** Billing breakdown */
  billing: {
    credits_used: number;
    pln_charged: number;
  };
}
```

## Chat Completions

### Standard Chat (Credit-Based)

```typescript
const chat = await client.chat({
  messages: [{ role: 'user', content: 'Explain quantum computing' }],
  model: 'gemini-flash',
  temperature: 0.7,
  maxTokens: 1024,
});

console.log(chat.choices[0].message.content);
console.log(`Credits used: ${chat.billing.credits_used}`);
```

### Bedrock Chat (Token-Based Billing)

```typescript
const chat = await client.chatBedrock({
  messages: [{ role: 'user', content: 'Hello' }],
  model: 'claude-sonnet-4.6',
  system: 'You are a helpful assistant. Be concise.',
});

console.log(chat.choices[0].message.content);
console.log(`Tokens: ${chat.usage.total_tokens}`);
console.log(`Cost: ${chat.billing.cost_breakdown?.cost_pln} PLN`);
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
  maxTokens: 2048,
  topP: 0.9,
  stop: ['THE END'],
});
```

### ChatResult Response Type

```typescript
interface ChatResult {
  choices: Array<{
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'content_filter';
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  billing: {
    credits_used?: number;
    pln_charged?: number;
    cost_breakdown?: {
      input_cost_pln: number;
      output_cost_pln: number;
      cost_pln: number;
    };
  };
  model: string;
}
```

## Streaming with Async Iterators

The SDK provides native streaming support using async iterators. Streaming works with all chat models.

### Basic Streaming

```typescript
const stream = await client.chatStream({
  messages: [{ role: 'user', content: 'Write a story about space exploration' }],
  model: 'gemini-flash',
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

### Collecting Full Response from Stream

```typescript
const stream = await client.chatStream({
  messages: [{ role: 'user', content: 'List 10 programming languages' }],
  model: 'gemini-flash',
});

let fullContent = '';
let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    fullContent += content;
  }
  // Final chunk includes usage stats
  if (chunk.usage) {
    usage = chunk.usage;
  }
}

console.log('Full response:', fullContent);
console.log('Tokens used:', usage.total_tokens);
```

### Streaming to HTTP Response (Server-Sent Events)

```typescript
// Express.js / Node.js HTTP handler
import { FotohubClient } from '@fotohub/sdk';

app.post('/api/chat', async (req, res) => {
  const client = new FotohubClient();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await client.chatStream({
    messages: req.body.messages,
    model: 'gemini-flash',
  });

  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
});
```

### ChatStreamChunk Type

```typescript
interface ChatStreamChunk {
  choices: Array<{
    delta: {
      role?: 'assistant';
      content?: string;
    };
    finish_reason: 'stop' | 'length' | null;
    index: number;
  }>;
  /** Only present in the final chunk */
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}
```

## Error Handling

The SDK provides a typed error hierarchy for precise error handling.

### Error Classes

```typescript
import {
  FotohubError,
  InsufficientCreditsError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
} from '@fotohub/sdk/errors';
```

### Comprehensive Error Handling

```typescript
import { FotohubClient } from '@fotohub/sdk';
import {
  FotohubError,
  InsufficientCreditsError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
} from '@fotohub/sdk/errors';

const client = new FotohubClient({ apiKey: 'fh_live_your_key_here' });

try {
  const result = await client.generateImage({
    prompt: 'A landscape',
    model: 'seedream-5-0-260128',
  });
} catch (e) {
  if (e instanceof InsufficientCreditsError) {
    // User doesn't have enough credits or balance
    console.error(`Need: ${e.required}, Have: ${e.available}`);
    console.error('Top up at fotohub.app/console');
  } else if (e instanceof RateLimitError) {
    // Too many requests — wait and retry
    console.error(`Rate limited. Retry after ${e.retryAfter}s`);
  } else if (e instanceof AuthenticationError) {
    // Invalid or expired API key
    console.error('Invalid API key. Check your credentials.');
  } else if (e instanceof ValidationError) {
    // Invalid request parameters
    console.error(`Invalid request: ${e.message}`);
    console.error(`Parameter: ${e.param}`);
  } else if (e instanceof FotohubError) {
    // Other API errors
    console.error(`[${e.status}] ${e.code}: ${e.message}`);
  } else {
    // Network errors, timeouts, etc.
    throw e;
  }
}
```

### FotohubError Class

```typescript
class FotohubError extends Error {
  /** HTTP status code */
  status: number;
  /** Machine-readable error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Request ID for support inquiries */
  requestId?: string;
}

class InsufficientCreditsError extends FotohubError {
  /** Credits required for the operation */
  required: number;
  /** Credits currently available */
  available: number;
}

class RateLimitError extends FotohubError {
  /** Seconds to wait before retrying */
  retryAfter: number;
}

class ValidationError extends FotohubError {
  /** The parameter that failed validation */
  param: string;
}

class AuthenticationError extends FotohubError {
  // status is always 401
}
```

### Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `insufficient_credits` | 402 | Not enough credits or wallet balance |
| `rate_limit_exceeded` | 429 | Too many requests, retry after delay |
| `authentication_failed` | 401 | Invalid or missing API key |
| `validation_error` | 400 | Invalid request parameters |
| `model_not_found` | 404 | Requested model does not exist |
| `model_unavailable` | 503 | Model temporarily unavailable |
| `content_filtered` | 451 | Content blocked by safety filters |
| `internal_error` | 500 | Server-side error |

## Webhook Signature Verification

When receiving webhooks (e.g., for async video generation results), verify the signature to ensure authenticity.

```typescript
import { verifyWebhookSignature } from '@fotohub/sdk/webhooks';

// Express.js middleware
app.post('/webhooks/fotohub', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-fotohub-signature'] as string;
  const timestamp = req.headers['x-fotohub-timestamp'] as string;
  const body = req.body;

  const isValid = verifyWebhookSignature({
    payload: body,
    signature,
    timestamp,
    secret: process.env.FOTOHUB_WEBHOOK_SECRET!,
    // Optional: reject events older than 5 minutes
    tolerance: 300,
  });

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(body.toString());

  switch (event.type) {
    case 'video.completed':
      console.log(`Video ready: ${event.data.videoUrl}`);
      break;
    case 'video.failed':
      console.error(`Video failed: ${event.data.error}`);
      break;
  }

  res.status(200).json({ received: true });
});
```

### Signature Verification Options

```typescript
interface VerifyWebhookOptions {
  /** Raw request body (Buffer or string) */
  payload: Buffer | string;
  /** Value of x-fotohub-signature header */
  signature: string;
  /** Value of x-fotohub-timestamp header */
  timestamp: string;
  /** Your webhook signing secret */
  secret: string;
  /** Max age in seconds to accept (default: 300) */
  tolerance?: number;
}
```

## Next.js Integration

### App Router (Route Handler)

```typescript
// app/api/generate/route.ts
import { FotohubClient } from '@fotohub/sdk';
import { NextResponse } from 'next/server';

const client = new FotohubClient();

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

```typescript
// app/api/chat/route.ts
import { FotohubClient } from '@fotohub/sdk';

const client = new FotohubClient();

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = await client.chatStream({
    messages,
    model: 'gemini-flash',
  });

  // Convert async iterator to ReadableStream
  const readableStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const chunk of stream) {
        const data = `data: ${JSON.stringify(chunk)}\n\n`;
        controller.enqueue(encoder.encode(data));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
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

import { FotohubClient } from '@fotohub/sdk';

const client = new FotohubClient();

export async function generateImage(prompt: string) {
  const result = await client.generateImage({
    prompt,
    model: 'imagen-4-standard',
    aspectRatio: '16:9',
  });

  return {
    imageUrl: result.images[0],
    cost: result.billing.pln_charged,
  };
}
```

### Edge Runtime Support

```typescript
// app/api/chat/route.ts
import { FotohubClient } from '@fotohub/sdk';

// Works on Vercel Edge, Cloudflare Workers, Deno Deploy
export const runtime = 'edge';

const client = new FotohubClient();

export async function POST(request: Request) {
  const { messages } = await request.json();

  const chat = await client.chat({
    messages,
    model: 'gemini-flash',
  });

  return Response.json(chat);
}
```

## Balance and Usage

```typescript
// Check account balance
const balance = await client.getBalance();
console.log(`Credits: ${balance.credits_available}`);
console.log(`Wallet: ${balance.wallet_pln} PLN`);

// Get usage statistics
const usage = await client.getUsage({ period: '30d' });
console.log(`Total requests: ${usage.total_requests}`);
console.log(`Total spent: ${usage.total_pln} PLN`);
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

// Streaming
const stream = await client.chat.completions.create({
  model: 'gemini-flash',
  messages: [{ role: 'user', content: 'Write a poem' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

::: info
All FOTOhub chat models work through the OpenAI-compatible endpoint (Gemini, Claude via Bedrock, GPT-4o, DeepSeek). Image and video generation use FOTOhub-specific endpoints.
:::

## API Reference

### Client Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `generateImage(options)` | Generate images from text | `Promise<ImageResult>` |
| `generateVideo(options)` | Start video generation job | `Promise<VideoResult>` |
| `waitForVideo(jobId, options?)` | Poll until video completes | `Promise<VideoResult>` |
| `generateMusic(options)` | Generate audio/music | `Promise<MusicResult>` |
| `chat(options)` | Chat completion (credit-based) | `Promise<ChatResult>` |
| `chatBedrock(options)` | Chat via Bedrock (token-based) | `Promise<ChatResult>` |
| `chatStream(options)` | Streaming chat completion | `AsyncIterable<ChatStreamChunk>` |
| `getBalance()` | Get account balance | `Promise<Balance>` |
| `getUsage(options?)` | Get usage statistics | `Promise<UsageStats>` |
| `listModels()` | List available models | `Promise<Model[]>` |

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FOTOHUB_API_KEY` | Yes | - | API key (read automatically if not passed to constructor) |
| `FOTOHUB_BASE_URL` | No | `https://apis.fotohub.app/v1` | Override base URL for testing |
| `FOTOHUB_TIMEOUT` | No | `60000` | Default request timeout in ms |
| `FOTOHUB_MAX_RETRIES` | No | `3` | Max automatic retries for 429/5xx errors |

### Automatic Retries

The SDK automatically retries failed requests for transient errors:

- **429 Too Many Requests** - respects `Retry-After` header
- **500, 502, 503, 504** - exponential backoff with jitter

Retries do NOT apply to:
- 400 (validation errors)
- 401 (authentication errors)
- 402 (insufficient credits)
- 404 (not found)

```typescript
const client = new FotohubClient({
  apiKey: 'fh_live_your_key_here',
  maxRetries: 5,        // up to 5 retries
  timeout: 120_000,     // 2 minute timeout per attempt
});
```
