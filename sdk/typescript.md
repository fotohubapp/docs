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
console.log(`Credits used: ${result.credits_used}`);
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
  /** Model ID. Supported: veo-2, veo-3, wan, kling, hailuo, seedance, sora-2 */
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
console.log(`Credits used: ${result.credits_used}`);
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

// Access billing information
console.log(`Credits used: ${result.credits_used}`);
console.log(`Credits remaining: ${result.billing.credits_remaining}`);
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
  /** Credits consumed */
  credits_used: number;
  /** Billing information */
  billing: BillingInfo;
  /** Array of generated image URLs */
  images: string[];
  /** Generation metadata */
  metadata?: ImageMetadata;
}

interface BillingInfo {
  credits_used: number;
  credits_remaining?: number;
}
```

## Video Generation

Video generation is synchronous — the promise resolves once the video is ready and the result carries the finished `video_url`. There is no job to poll.

```typescript
const result = await client.generateVideo({
  prompt: 'A drone flying over a mountain landscape, cinematic',
  model: 'veo-3',
  duration: 5,
  aspect_ratio: '16:9',
});

console.log(`Video URL: ${result.video_url}`);
console.log(`Credits used: ${result.credits_used}`);
```

### Image-to-Video

```typescript
const result = await client.generateVideo({
  prompt: 'Gentle camera zoom, subtle movement in the clouds',
  model: 'veo-3',
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
  /** Credits consumed */
  credits_used: number;
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

## Music Generation

```typescript
const result = await client.generateMusic({
  prompt: 'Upbeat electronic music with synthesizers, 120 BPM',
  model: 'minimax',
  duration: 30,
});

console.log(`Audio URL: ${result.audio_url}`);
console.log(`Duration: ${result.duration}s`);
console.log(`Credits used: ${result.credits_used}`);
```

### MusicResult Response Type

```typescript
interface MusicResult {
  /** Model used */
  model: string;
  /** Credits consumed */
  credits_used: number;
  /** URL to the generated audio file */
  audio_url: string;
  /** Duration in seconds */
  duration: number;
}
```

## Chat Completions

### Standard Chat (Credit-Based)

```typescript
const chat = await client.chat({
  messages: [{ role: 'user', content: 'Explain quantum computing' }],
  model: 'gemini-flash',
  temperature: 0.7,
  max_tokens: 1024,
});

console.log(chat.choices[0].message.content);
console.log(`Credits used: ${chat.credits_used}`);
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
  /** Credits consumed */
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
    credits_used: number;
    credits_remaining?: number;
  };
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
import { FotoHub } from 'fotohub';

app.post('/api/chat', async (req, res) => {
  const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

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

```typescript
// app/api/chat/route.ts
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

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
    creditsUsed: result.credits_used,
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
  credits_used: number; // credits charged for the call
}
```

The 13 tool IDs, their credit cost, and which extra inputs they consume:

| `tool_id`             | Credits | Mask     | Prompt   | Reference |
| --------------------- | ------- | -------- | -------- | --------- |
| `fast-upscale`        | 1       | —        | —        | —         |
| `conservative-upscale`| 2       | —        | —        | —         |
| `creative-upscale`    | 3       | —        | —        | —         |
| `remove-background`   | 1       | —        | —        | —         |
| `erase-object`        | 2       | required | —        | —         |
| `inpaint`             | 3       | required | required | —         |
| `outpaint`            | 3       | optional | required | —         |
| `search-replace`      | 3       | —        | required | —         |
| `search-recolor`      | 3       | —        | required | —         |
| `style-transfer`      | 2       | —        | —        | required  |
| `style-guide`         | 2       | —        | required | required  |
| `control-sketch`      | 3       | —        | required | —         |
| `control-structure`   | 3       | —        | required | —         |

### List Available Tools

```typescript
listStabilityTools(): Promise<StabilityTool[]>
```

Returns all available Stability AI tools with their credit cost and input requirements (`GET /stability/tools`).

::: code-group
```typescript [TypeScript]
import { FotoHub } from 'fotohub';

// Pass your Supabase session access_token, not an fh_live_* API key.
const client = new FotoHub({ apiKey: process.env.SUPABASE_ACCESS_TOKEN! });

const tools = await client.listStabilityTools();
for (const tool of tools) {
  console.log(`${tool.id}: ${tool.credits} credits (mask=${tool.requires_mask}, prompt=${tool.requires_prompt})`);
}
```

```python [Python]
from fotohub import FotoHub

# Pass your Supabase session access_token, not an fh_live_* API key.
client = FotoHub(api_key=os.environ["SUPABASE_ACCESS_TOKEN"])

for tool in client.stability_tools():
    print(f"{tool['id']}: {tool['credits']} credits (mask={tool['requires_mask']})")
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
        fmt.Printf("%s: %d credits\n", tool.ID, tool.Credits)
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

Upscales an image to a higher resolution. `type` defaults to `'fast'` (1 credit); `'conservative'` costs 2 credits and `'creative'` costs 3. Each mode maps to the tool IDs `fast-upscale`, `conservative-upscale`, and `creative-upscale`.

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
console.log(`Credits used: ${result.credits_used}, seed: ${result.seed}`);
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
print(f"Credits used: {result['credits_used']}")
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
    fmt.Printf("Credits used: %v\n", result.CreditsUsed)
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
# → { "image": "<base64>", "tool": "creative-upscale", "seed": null, "credits_used": 3 }
```
:::

### Remove Background

```typescript
stabilityRemoveBackground(imageBase64: string): Promise<StabilityResult>
```

Removes the background from an image, returning a transparent PNG in `result.image` (base64). Costs 1 credit.

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

Runs the `erase-object` tool: erases the masked region from an image and fills it with context-aware content. The **mask is required** and is a base64 image where white marks the area to erase. Costs 2 credits.

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

Fills a masked region with AI-generated content guided by a text prompt. Both the **mask and prompt are required**. Costs 3 credits.

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

Extends an image beyond its borders in the specified directions (pixels to extend per side). A `prompt` is required by the model (pass one via `runStabilityTool` if you need to guide the fill); a `mask` is optional. Costs 3 credits.

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

Finds objects matching `searchPrompt` in the image and replaces them with content described by `replacePrompt`. Under the hood the replacement text is sent as `prompt` and the target as `search_prompt`. Costs 3 credits.

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

Recolors a specific object in the image. `searchPrompt` selects the object to recolor and `newColor` describes the target color. This maps to the `search-recolor` tool (`search_prompt` = the object, `prompt` = the new color). Costs 3 credits.

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

Applies the visual style of a reference image to the content of the source image. The **reference image is required** and is sent as the base64 `reference` field. Costs 2 credits.

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
  model: 'triposr',
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
    model="triposr",
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
        Model:   "triposr",
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
    "model": "triposr",
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
console.log(`Credits: ${result.billing.credits_used}`);
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
print(f"Credits: {result.billing.credits_used}")
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
fmt.Printf("Credits: %d\n", result.Billing.CreditsUsed)
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

Returns all available 3D generation models with their capabilities, credit costs, and supported modes.

::: code-group
```typescript [TypeScript]
const models = await client.list3DModels();
for (const m of models) {
  console.log(`${m.name} (${m.id}): ${m.credits} credits — ${m.speed}`);
  console.log(`  Modes: ${m.modes.join(', ')}`);
}
```

```python [Python]
models = client.list_3d_models()
for m in models:
    print(f"{m.name} ({m.id}): {m.credits} credits - {m.speed}")
    print(f"  Modes: {', '.join(m.modes)}")
```

```go [Go]
models, _ := client.List3DModels()
for _, m := range models {
    fmt.Printf("%s (%s): %d credits - %s\n", m.Name, m.ID, m.Credits, m.Speed)
    fmt.Printf("  Modes: %v\n", m.Modes)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/3d/models \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Available 3D Models

| Model | Credits | Speed | Modes |
|-------|---------|-------|-------|
| `triposr` | 5 | ~3s | image-to-3d |
| `sf3d` | 5 | <1s | image-to-3d |
| `shap-e` | 10 | ~15s | text-to-3d |
| `trellis` | 15 | ~15s | image-to-3d |
| `hunyuan3d` | 25 | ~30s | both |

## Billing

Manage credits, wallet balance, pricing information, transactions, and top-up packages.

### Get Balance

```typescript
getBalance(): Promise<Balance>
```

Returns your current credit balance and wallet balance in PLN.

::: code-group
```typescript [TypeScript]
const balance = await client.getBalance();
console.log(`Credits: ${balance.credits_available}`);
console.log(`Wallet: ${balance.wallet_pln} PLN`);
console.log(`Plan: ${balance.plan}`);
```

```python [Python]
balance = client.get_balance()
print(f"Credits: {balance.credits_available}")
print(f"Wallet: {balance.wallet_pln} PLN")
print(f"Plan: {balance.plan}")
```

```go [Go]
balance, _ := client.GetBalance()
fmt.Printf("Credits: %d\n", balance.CreditsAvailable)
fmt.Printf("Wallet: %.2f PLN\n", balance.WalletPLN)
fmt.Printf("Plan: %s\n", balance.Plan)
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/billing/balance \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Get Pricing

```typescript
getPricing(category?: string): Promise<PricingInfo>
```

Returns pricing for all models, optionally filtered by category (`image`, `video`, `audio`, `chat`, `3d`).

::: code-group
```typescript [TypeScript]
const pricing = await client.getPricing('image');
for (const model of pricing.models) {
  console.log(`${model.id}: ${model.credits_per_generation} credits`);
}
```

```python [Python]
pricing = client.get_pricing(category="image")
for model in pricing.models:
    print(f"{model.id}: {model.credits_per_generation} credits")
```

```go [Go]
pricing, _ := client.GetPricing("image")
for _, model := range pricing.Models {
    fmt.Printf("%s: %d credits\n", model.ID, model.CreditsPerGeneration)
}
```

```bash [cURL]
curl -X GET "https://apis.fotohub.app/v1/billing/pricing?category=image" \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Get Plans

```typescript
getPlans(): Promise<Plan[]>
```

Returns all available subscription plans with their features and pricing in PLN.

::: code-group
```typescript [TypeScript]
const plans = await client.getPlans();
for (const plan of plans) {
  console.log(`${plan.name}: ${plan.price_monthly} PLN/mo — ${plan.credits_monthly} credits`);
}
```

```python [Python]
plans = client.get_plans()
for plan in plans:
    print(f"{plan.name}: {plan.price_monthly} PLN/mo - {plan.credits_monthly} credits")
```

```go [Go]
plans, _ := client.GetPlans()
for _, plan := range plans {
    fmt.Printf("%s: %.0f PLN/mo - %d credits\n", plan.Name, plan.PriceMonthly, plan.CreditsMonthly)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/billing/plans \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Get Credits

```typescript
getCredits(): Promise<CreditInfo>
```

Returns detailed credit information including monthly allocation, used, remaining, and reset date.

::: code-group
```typescript [TypeScript]
const credits = await client.getCredits();
console.log(`Monthly: ${credits.monthly_allocation}`);
console.log(`Used: ${credits.used}`);
console.log(`Remaining: ${credits.remaining}`);
console.log(`Resets: ${credits.reset_date}`);
```

```python [Python]
credits = client.get_credits()
print(f"Monthly: {credits.monthly_allocation}")
print(f"Used: {credits.used}")
print(f"Remaining: {credits.remaining}")
print(f"Resets: {credits.reset_date}")
```

```go [Go]
credits, _ := client.GetCredits()
fmt.Printf("Monthly: %d\n", credits.MonthlyAllocation)
fmt.Printf("Used: %d\n", credits.Used)
fmt.Printf("Remaining: %d\n", credits.Remaining)
fmt.Printf("Resets: %s\n", credits.ResetDate)
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/billing/credits \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Set Overage Limit

```typescript
setOverageLimit(hardLimitPln: number, projectId?: string): Promise<void>
```

Sets a hard spending limit in PLN. Once reached, API calls return `402`. Optionally scope to a specific project.

::: code-group
```typescript [TypeScript]
// Set a global hard limit of 500 PLN
await client.setOverageLimit(500);

// Set a per-project limit
await client.setOverageLimit(100, 'proj_abc123');
```

```python [Python]
# Set a global hard limit of 500 PLN
client.set_overage_limit(500)

# Set a per-project limit
client.set_overage_limit(100, project_id="proj_abc123")
```

```go [Go]
// Global limit
client.SetOverageLimit(500, "")

// Per-project limit
client.SetOverageLimit(100, "proj_abc123")
```

```bash [cURL]
curl -X PUT https://apis.fotohub.app/v1/billing/overage-limit \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"hard_limit_pln": 500, "project_id": "proj_abc123"}'
```
:::

### Get Top-Up Packages

```typescript
getTopupPackages(): Promise<TopupPackage[]>
```

Returns available credit top-up packages with pricing in PLN.

::: code-group
```typescript [TypeScript]
const packages = await client.getTopupPackages();
for (const pkg of packages) {
  console.log(`${pkg.slug}: ${pkg.credits} credits for ${pkg.price_pln} PLN`);
}
```

```python [Python]
packages = client.get_topup_packages()
for pkg in packages:
    print(f"{pkg.slug}: {pkg.credits} credits for {pkg.price_pln} PLN")
```

```go [Go]
packages, _ := client.GetTopupPackages()
for _, pkg := range packages {
    fmt.Printf("%s: %d credits for %.0f PLN\n", pkg.Slug, pkg.Credits, pkg.PricePLN)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/billing/topup-packages \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Create Top-Up

```typescript
createTopup(packageSlug: string): Promise<{ checkout_url: string }>
```

Initiates a credit top-up purchase. Returns a Stripe checkout URL to complete payment.

::: code-group
```typescript [TypeScript]
const { checkout_url } = await client.createTopup('credits-500');
console.log(`Complete purchase: ${checkout_url}`);
// Redirect user to checkout_url
```

```python [Python]
result = client.create_topup("credits-500")
print(f"Complete purchase: {result.checkout_url}")
```

```go [Go]
result, _ := client.CreateTopup("credits-500")
fmt.Printf("Complete purchase: %s\n", result.CheckoutURL)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/billing/topup \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"package_slug": "credits-500"}'
```
:::

### Get Transactions

```typescript
getTransactions(page?: number, limit?: number): Promise<Transaction[]>
```

Returns paginated transaction history (credits spent, top-ups, refunds).

::: code-group
```typescript [TypeScript]
const transactions = await client.getTransactions(1, 25);
for (const tx of transactions) {
  console.log(`${tx.created_at} | ${tx.type} | ${tx.amount} ${tx.currency} | ${tx.description}`);
}
```

```python [Python]
transactions = client.get_transactions(page=1, limit=25)
for tx in transactions:
    print(f"{tx.created_at} | {tx.type} | {tx.amount} {tx.currency} | {tx.description}")
```

```go [Go]
transactions, _ := client.GetTransactions(1, 25)
for _, tx := range transactions {
    fmt.Printf("%s | %s | %.2f %s | %s\n", tx.CreatedAt, tx.Type, tx.Amount, tx.Currency, tx.Description)
}
```

```bash [cURL]
curl -X GET "https://apis.fotohub.app/v1/billing/transactions?page=1&limit=25" \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Estimate Cost

```typescript
estimateCost(operation: string, params: Record<string, any>): Promise<CostEstimate>
```

Estimates the cost of an operation before executing it. Does not consume credits.

::: code-group
```typescript [TypeScript]
const estimate = await client.estimateCost('image_generation', {
  model: 'seedream-5-0-260128',
  num_images: 4,
});
console.log(`Estimated: ${estimate.credits} credits (${estimate.pln} PLN)`);
```

```python [Python]
estimate = client.estimate_cost("image_generation", {
    "model": "seedream-5-0-260128",
    "num_images": 4,
})
print(f"Estimated: {estimate.credits} credits ({estimate.pln} PLN)")
```

```go [Go]
estimate, _ := client.EstimateCost("image_generation", map[string]any{
    "model":      "seedream-5-0-260128",
    "num_images": 4,
})
fmt.Printf("Estimated: %d credits (%.2f PLN)\n", estimate.Credits, estimate.PLN)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/billing/estimate \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "image_generation",
    "params": {"model": "seedream-5-0-260128", "num_images": 4}
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
  console.log(`${inv.date} | ${inv.amount_pln} PLN | ${inv.status} | ${inv.pdf_url}`);
}
```

```python [Python]
invoices = client.get_invoices()
for inv in invoices:
    print(f"{inv.date} | {inv.amount_pln} PLN | {inv.status} | {inv.pdf_url}")
```

```go [Go]
invoices, _ := client.GetInvoices()
for _, inv := range invoices {
    fmt.Printf("%s | %.2f PLN | %s | %s\n", inv.Date, inv.AmountPLN, inv.Status, inv.PDFURL)
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

Returns all available tiers with features, limits, and pricing in PLN.

::: code-group
```typescript [TypeScript]
const catalog = await client.getTierCatalog();
for (const tier of catalog.tiers) {
  console.log(`${tier.name}: ${tier.rpm} rpm, ${tier.credits_monthly} credits/mo`);
  if (tier.price_monthly > 0) {
    console.log(`  Price: ${tier.price_monthly} PLN/mo`);
  }
}
```

```python [Python]
catalog = client.get_tier_catalog()
for tier in catalog.tiers:
    print(f"{tier.name}: {tier.rpm} rpm, {tier.credits_monthly} credits/mo")
    if tier.price_monthly > 0:
        print(f"  Price: {tier.price_monthly} PLN/mo")
```

```go [Go]
catalog, _ := client.GetTierCatalog()
for _, tier := range catalog.Tiers {
    fmt.Printf("%s: %d rpm, %d credits/mo\n", tier.Name, tier.RPM, tier.CreditsMonthly)
    if tier.PriceMonthly > 0 {
        fmt.Printf("  Price: %.0f PLN/mo\n", tier.PriceMonthly)
    }
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/tiers/catalog \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Get Current Tier

```typescript
getCurrentTier(): Promise<CurrentTier>
```

Returns your current tier with usage stats and limits.

::: code-group
```typescript [TypeScript]
const tier = await client.getCurrentTier();
console.log(`Tier: ${tier.name} (${tier.type})`);
console.log(`Rate limit: ${tier.limits.rpm} rpm`);
console.log(`Credits used: ${tier.usage.credits_used}/${tier.limits.credits_monthly}`);
```

```python [Python]
tier = client.get_current_tier()
print(f"Tier: {tier.name} ({tier.type})")
print(f"Rate limit: {tier.limits.rpm} rpm")
print(f"Credits used: {tier.usage.credits_used}/{tier.limits.credits_monthly}")
```

```go [Go]
tier, _ := client.GetCurrentTier()
fmt.Printf("Tier: %s (%s)\n", tier.Name, tier.Type)
fmt.Printf("Rate limit: %d rpm\n", tier.Limits.RPM)
fmt.Printf("Credits used: %d/%d\n", tier.Usage.CreditsUsed, tier.Limits.CreditsMonthly)
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

Returns a side-by-side comparison of all tiers with feature matrix and pricing.

::: code-group
```typescript [TypeScript]
const comparison = await client.compareTiers();
for (const row of comparison.features) {
  const values = comparison.tiers.map(t => row.values[t.slug] ? 'Y' : '-').join(' | ');
  console.log(`${row.name}: ${values}`);
}
```

```python [Python]
comparison = client.compare_tiers()
for row in comparison.features:
    values = " | ".join("Y" if row.values.get(t.slug) else "-" for t in comparison.tiers)
    print(f"{row.name}: {values}")
```

```go [Go]
comparison, _ := client.CompareTiers()
for _, row := range comparison.Features {
    fmt.Printf("%s: ", row.Name)
    for _, t := range comparison.Tiers {
        if row.Values[t.Slug] {
            fmt.Print("Y | ")
        } else {
            fmt.Print("- | ")
        }
    }
    fmt.Println()
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/tiers/compare \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Subscribe to Tier

```typescript
subscribeTier(slug: string): Promise<{ checkout_url: string }>
```

Initiates a tier subscription. Returns a Stripe checkout URL for payment.

::: code-group
```typescript [TypeScript]
const { checkout_url } = await client.subscribeTier('sub-developer');
console.log(`Subscribe: ${checkout_url}`);
// Redirect user to checkout_url
```

```python [Python]
result = client.subscribe_tier("sub-developer")
print(f"Subscribe: {result.checkout_url}")
```

```go [Go]
result, _ := client.SubscribeTier("sub-developer")
fmt.Printf("Subscribe: %s\n", result.CheckoutURL)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/tiers/subscribe \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"slug": "sub-developer"}'
```
:::

### Get Wallet

```typescript
getWallet(): Promise<Wallet>
```

Returns your wallet balance and currency.

::: code-group
```typescript [TypeScript]
const wallet = await client.getWallet();
console.log(`Balance: ${wallet.balance} ${wallet.currency}`);
```

```python [Python]
wallet = client.get_wallet()
print(f"Balance: {wallet.balance} {wallet.currency}")
```

```go [Go]
wallet, _ := client.GetWallet()
fmt.Printf("Balance: %.2f %s\n", wallet.Balance, wallet.Currency)
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/tiers/wallet \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

### Top Up Wallet

```typescript
topupWallet(amount: number): Promise<{ session_url: string }>
```

Initiates a wallet top-up for the given amount (PLN). Returns a Stripe payment session URL.

::: code-group
```typescript [TypeScript]
const { session_url } = await client.topupWallet(100);
console.log(`Pay: ${session_url}`);
// Redirect user to session_url
```

```python [Python]
result = client.topup_wallet(100)
print(f"Pay: {result.session_url}")
```

```go [Go]
result, _ := client.TopupWallet(100)
fmt.Printf("Pay: %s\n", result.SessionURL)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/tiers/wallet/topup \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
```
:::

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

::: code-group
```typescript [TypeScript]
const webhook = await client.createWebhook({
  url: 'https://myapp.com/webhooks/fotohub',
  events: ['video.completed', 'video.failed', '3d.completed'],
  description: 'Production webhook',
});

console.log(`ID: ${webhook.id}`);
console.log(`Secret: ${webhook.secret}`);  // Store securely — shown only once
```

```python [Python]
webhook = client.create_webhook(
    url="https://myapp.com/webhooks/fotohub",
    events=["video.completed", "video.failed", "3d.completed"],
    description="Production webhook",
)
print(f"ID: {webhook.id}")
print(f"Secret: {webhook.secret}")  # Store securely
```

```go [Go]
webhook, _ := client.CreateWebhook(fotohub.WebhookOptions{
    URL:         "https://myapp.com/webhooks/fotohub",
    Events:      []string{"video.completed", "video.failed", "3d.completed"},
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
    "events": ["video.completed", "video.failed", "3d.completed"],
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
  events: ['video.completed', 'video.failed', '3d.completed', 'billing.threshold'],
  status: 'active',
});
console.log(`Updated: ${updated.id}, events: ${updated.events.length}`);
```

```python [Python]
updated = client.update_webhook("wh_abc123",
    events=["video.completed", "video.failed", "3d.completed", "billing.threshold"],
    status="active",
)
print(f"Updated: {updated.id}, events: {len(updated.events)}")
```

```go [Go]
updated, _ := client.UpdateWebhook("wh_abc123", fotohub.WebhookUpdateOptions{
    Events: []string{"video.completed", "video.failed", "3d.completed", "billing.threshold"},
    Status: "active",
})
fmt.Printf("Updated: %s, events: %d\n", updated.ID, len(updated.Events))
```

```bash [cURL]
curl -X PATCH https://apis.fotohub.app/v1/webhooks/wh_abc123 \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "events": ["video.completed", "video.failed", "3d.completed", "billing.threshold"],
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
console.log(`Model: ${classification.recommended_model}`); // 'triposr'
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
gabrielRecommend(opts?: { history?: string[]; budget_credits?: number; category?: string }): Promise<Recommendation[]>
```

Returns personalized model and workflow recommendations based on your usage history and preferences.

::: code-group
```typescript [TypeScript]
const recommendations = await client.gabrielRecommend({
  history: ['product photos', 'background removal', 'upscaling'],
  budget_credits: 50,
  category: 'image',
});

for (const rec of recommendations) {
  console.log(`${rec.model}: ${rec.reason} (${rec.estimated_credits} credits)`);
}
```

```python [Python]
recommendations = client.gabriel_recommend(
    history=["product photos", "background removal", "upscaling"],
    budget_credits=50,
    category="image"
)
for rec in recommendations:
    print(f"{rec.model}: {rec.reason} ({rec.estimated_credits} credits)")
```

```go [Go]
recommendations, _ := client.GabrielRecommend(fotohub.RecommendOptions{
    History:       []string{"product photos", "background removal", "upscaling"},
    BudgetCredits: 50,
    Category:      "image",
})
for _, rec := range recommendations {
    fmt.Printf("%s: %s (%d credits)\n", rec.Model, rec.Reason, rec.EstimatedCredits)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/gabriel/recommend \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "history": ["product photos", "background removal", "upscaling"],
    "budget_credits": 50,
    "category": "image"
  }'
```
:::

## Models

### List Models

```typescript
listModels(category?: string): Promise<Model[]>
```

Returns all available AI models, optionally filtered by category (`image`, `video`, `audio`, `chat`, `3d`).

::: code-group
```typescript [TypeScript]
// List all models
const allModels = await client.listModels();
console.log(`Total models: ${allModels.length}`);

// Filter by category
const imageModels = await client.listModels('image');
for (const m of imageModels) {
  console.log(`${m.id}: ${m.name} — ${m.credits} credits (${m.status})`);
}
```

```python [Python]
# List all models
all_models = client.list_models()
print(f"Total models: {len(all_models)}")

# Filter by category
image_models = client.list_models(category="image")
for m in image_models:
    print(f"{m.id}: {m.name} - {m.credits} credits ({m.status})")
```

```go [Go]
// List all models
allModels, _ := client.ListModels("")
fmt.Printf("Total models: %d\n", len(allModels))

// Filter by category
imageModels, _ := client.ListModels("image")
for _, m := range imageModels {
    fmt.Printf("%s: %s - %d credits (%s)\n", m.ID, m.Name, m.Credits, m.Status)
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
  /** Category: image, video, audio, chat, 3d */
  category: string;
  /** Credit cost per generation */
  credits: number;
  /** Current availability status */
  status: 'active' | 'beta' | 'deprecated';
  /** Supported features and parameters */
  capabilities: string[];
  /** Provider (for informational purposes) */
  provider: string;
}
```

## Error Handling

The SDK provides a typed error hierarchy for precise error handling across all methods.

### Error Classes

```typescript
import {
  FotohubError,
  InsufficientCreditsError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
} from 'fotohub/errors';
```

### Comprehensive Error Handling

::: code-group
```typescript [TypeScript]
import { FotoHub } from 'fotohub';
import {
  FotohubError,
  InsufficientCreditsError,
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
  } else if (e instanceof InsufficientCreditsError) {
    // Not enough credits or wallet balance (402)
    console.error(`Need: ${e.required} credits, Have: ${e.available}`);
    console.error('Top up at fotohub.app/console');
  } else if (e instanceof RateLimitError) {
    // Too many requests (429) — SDK retries automatically, but may still throw
    console.error(`Rate limited. Retry after ${e.retryAfter}s`);
  } else if (e instanceof ValidationError) {
    // Invalid request parameters (400)
    console.error(`Invalid param "${e.param}": ${e.message}`);
  } else if (e instanceof FotohubError) {
    // Other API errors (4xx/5xx)
    console.error(`[${e.status}] ${e.code}: ${e.message}`);
    console.error(`Request ID: ${e.requestId}`);
  } else {
    // Network errors, timeouts, etc.
    throw e;
  }
}
```

```python [Python]
from fotohub import FotoHub
from fotohub.errors import (
    FotoHubError,
    AuthenticationError,
    InsufficientCreditsError,
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
except InsufficientCreditsError as e:
    print(f"Need: {e.required} credits, Have: {e.available}")
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after}s")
except ValidationError as e:
    print(f"Invalid param '{e.param}': {e.message}")
except FotoHubError as e:
    print(f"[{e.status}] {e.code}: {e.message}")
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
        var creditsErr *fotohub.InsufficientCreditsError
        var rateErr *fotohub.RateLimitError
        var valErr *fotohub.ValidationError
        var apiErr *fotohub.FotohubError

        switch {
        case errors.As(err, &authErr):
            fmt.Println("Invalid API key.")
        case errors.As(err, &creditsErr):
            fmt.Printf("Need: %d, Have: %d\n", creditsErr.Required, creditsErr.Available)
        case errors.As(err, &rateErr):
            fmt.Printf("Rate limited. Retry after %ds\n", rateErr.RetryAfter)
        case errors.As(err, &valErr):
            fmt.Printf("Invalid param '%s': %s\n", valErr.Param, valErr.Message)
        case errors.As(err, &apiErr):
            fmt.Printf("[%d] %s: %s\n", apiErr.Status, apiErr.Code, apiErr.Message)
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
# 401: {"error": {"code": "authentication_failed", "message": "Invalid API key"}}
# 402: {"error": {"code": "insufficient_credits", "message": "...", "required": 5, "available": 2}}
# 429: {"error": {"code": "rate_limit_exceeded", "message": "...", "retry_after": 30}}
# 400: {"error": {"code": "validation_error", "message": "...", "param": "model"}}

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

class AuthenticationError extends FotohubError {
  // status is always 401
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
```

### Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `authentication_failed` | 401 | Invalid or missing API key |
| `insufficient_credits` | 402 | Not enough credits or wallet balance |
| `rate_limit_exceeded` | 429 | Too many requests, retry after delay |
| `validation_error` | 400 | Invalid request parameters |
| `model_not_found` | 404 | Requested model does not exist |
| `model_unavailable` | 503 | Model temporarily unavailable |
| `content_filtered` | 451 | Content blocked by safety filters |
| `internal_error` | 500 | Server-side error |

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
All FOTOhub chat models work through the OpenAI-compatible endpoint (Gemini, Claude, GPT, DeepSeek, and more). Image and video generation use FOTOhub-specific endpoints.
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
| `chat(options)` | Chat completion (credit-based) | `Promise<ChatResult>` |
| `chatClaude(options)` | Premium chat completion (token-based) | `Promise<ChatResult>` |
| `chatStream(options)` | Streaming chat completion | `Promise<ChatStream>` |
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
| `getCredits()` | Get credit details | `Promise<CreditsInfo>` |
| `setOverageLimit(hardLimitPln, projectId?)` | Set spending limit | `Promise<OverageResult>` |
| `getTopupPackages()` | Get top-up packages | `Promise<TopupPackage[]>` |
| `createTopup(packageSlug)` | Create top-up checkout | `Promise<TopupResult>` |
| `getTransactions(options?)` | Get transaction history | `Promise<TransactionPage>` |
| `estimateCost(operations)` | Estimate operation cost | `Promise<CostEstimate>` |
| `getInvoices()` | Get invoices | `Promise<Invoice[]>` |
| `getTierCatalog()` | Get all tiers | `Promise<TierCatalog>` |
| `getCurrentTier()` | Get your current tier | `Promise<TierInfo>` |
| `compareTiers()` | Compare all tiers | `Promise<TierComparison>` |
| `subscribeTier(tierSlug)` | Subscribe to tier | `Promise<{ checkout_url: string }>` |
| `getWallet()` | Get wallet balance | `Promise<WalletInfo>` |
| `topupWallet(amount)` | Top up wallet | `Promise<{ checkout_url: string }>` |
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
- 402 (insufficient credits)
- 404 (not found)

```typescript
const client = new FotoHub({
  apiKey: 'fh_live_your_key_here',
  maxRetries: 5,        // up to 5 retries
  timeout: 120_000,     // 2 minute timeout per attempt
});
```
