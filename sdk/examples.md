# SDK Examples

Real-world, production-ready examples for common FOTOhub SDK workflows.

## Batch Image Generation

Process a list of prompts concurrently with progress tracking.

::: code-group

```python [Python]
import asyncio
from fotohub import FotoHub

client = FotoHub()

async def batch_generate(prompts: list[str], model: str = "seedream-5-0-260128"):
    """Generate images for multiple prompts with progress tracking."""
    results = []
    total_cost = 0.0

    for i, prompt in enumerate(prompts, 1):
        result = client.generate_image(
            prompt=prompt,
            model=model,
            aspect_ratio="16:9"
        )
        results.append({
            "prompt": prompt,
            "url": result.images[0],
            "cost": result.billing.usd_charged
        })
        total_cost += result.billing.usd_charged
        print(f"[{i}/{len(prompts)}] Done: {prompt[:50]}...")

    print(f"\nBatch complete: {len(results)} images, total cost: ${total_cost:.4f}")
    return results

# Product photography batch
prompts = [
    "Professional product photo: wireless earbuds on white background, studio lighting",
    "Professional product photo: smartwatch on marble surface, soft shadows",
    "Professional product photo: laptop in modern office, shallow depth of field",
    "Professional product photo: phone case with plant in background, natural light",
    "Professional product photo: headphones on wooden desk, dramatic lighting",
]

results = asyncio.run(batch_generate(prompts))

# Save URLs for downstream use
for r in results:
    print(f"  {r['url']}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

interface BatchResult {
  prompt: string;
  url: string;
  cost: number;
}

async function batchGenerate(
  prompts: string[],
  model = "seedream-5-0-260128"
): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  let totalCost = 0;

  for (let i = 0; i < prompts.length; i++) {
    const result = await client.generateImage({
      prompt: prompts[i],
      model,
      aspectRatio: "16:9",
    });

    results.push({
      prompt: prompts[i],
      url: result.images[0],
      cost: result.billing.usd_charged,
    });
    totalCost += result.billing.usd_charged;
    console.log(`[${i + 1}/${prompts.length}] Done: ${prompts[i].slice(0, 50)}...`);
  }

  console.log(`\nBatch complete: ${results.length} images, total: $${totalCost.toFixed(4)}`);
  return results;
}

const prompts = [
  "Professional product photo: wireless earbuds on white background, studio lighting",
  "Professional product photo: smartwatch on marble surface, soft shadows",
  "Professional product photo: laptop in modern office, shallow depth of field",
];

batchGenerate(prompts).then((results) => {
  results.forEach((r) => console.log(`  ${r.url}`));
});
```

:::

## Build a Chatbot with Streaming

Full chatbot with conversation history and real-time streaming output.

::: code-group

```python [Python]
import json
import os

import requests

# Streaming does not go through the SDK: the SDK's chat methods target
# /v1/ai/chat/completions, which never streams. /v1/ai/agent/stream is the only
# SSE endpoint, so the chatbot below calls it directly.
API_KEY = os.environ["FOTOHUB_API_KEY"]
STREAM_URL = "https://apis.fotohub.app/v1/ai/agent/stream"


class Chatbot:
    def __init__(self, system_prompt: str, model: str = "claude-sonnet-4.6"):
        # Agent model ids, not the chat ids: claude-sonnet-4.6 /
        # claude-sonnet-4.5 / claude-sonnet-4 / claude-haiku-4.5.
        self.model = model
        # The system prompt is a top-level field here, not a message.
        self.system = system_prompt
        self.messages: list[dict] = []

    def stream_reply(self, user_input: str) -> str:
        """Send a message and stream the response as it is produced."""
        self.messages.append({"role": "user", "content": user_input})
        full_response = ""

        print("Assistant: ", end="", flush=True)
        resp = requests.post(
            STREAM_URL,
            headers={"Authorization": f"Bearer {API_KEY}",
                     "Content-Type": "application/json"},
            json={
                "model": self.model,
                "system": self.system,
                "messages": self.messages,
                "temperature": 0.7,
                "max_tokens": 1024,
            },
            stream=True,
        )
        resp.raise_for_status()

        for line in resp.iter_lines():
            if not line:
                continue
            payload = line.decode("utf-8")
            if not payload.startswith("data: "):
                continue
            data = payload[6:]
            if data == "[DONE]":
                break
            frame = json.loads(data)
            if frame["type"] == "text_delta":
                print(frame["text"], end="", flush=True)
                full_response += frame["text"]
            elif frame["type"] == "error":
                raise RuntimeError(frame["message"])

        print()  # newline after stream
        self.messages.append({"role": "assistant", "content": full_response})
        return full_response

    def reset(self):
        """Clear conversation history. The system prompt is kept separately."""
        self.messages = []


# Usage
bot = Chatbot(
    system_prompt="You are a helpful photography assistant. Give concise, "
    "practical advice about camera settings, composition, and lighting."
)

# Interactive loop
print("Photography Assistant (type 'quit' to exit, 'reset' to clear history)\n")
while True:
    user_input = input("You: ").strip()
    if user_input.lower() == "quit":
        break
    if user_input.lower() == "reset":
        bot.reset()
        print("(conversation cleared)\n")
        continue
    bot.stream_reply(user_input)
    print()
```

```typescript [TypeScript]
import * as readline from "readline";

// client.chatStream() targets /v1/ai/chat/completions, which never streams --
// it yields zero chunks while still billing. /v1/ai/agent/stream is the only
// SSE endpoint, so this calls it directly.
const API_KEY = process.env.FOTOHUB_API_KEY!;
const STREAM_URL = "https://apis.fotohub.app/v1/ai/agent/stream";

interface Message {
  role: "user" | "assistant";
  content: string;
}

class Chatbot {
  private messages: Message[] = [];
  private model: string;
  private system: string;

  // Agent model ids, not the chat ids.
  constructor(systemPrompt: string, model = "claude-sonnet-4.6") {
    this.model = model;
    this.system = systemPrompt;
  }

  async streamReply(userInput: string): Promise<string> {
    this.messages.push({ role: "user", content: userInput });
    let fullResponse = "";

    process.stdout.write("Assistant: ");
    const response = await fetch(STREAM_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        system: this.system,
        messages: this.messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    // One read() can end mid-frame, so buffer to the blank-line separator.
    let buffer = "";

    outer: while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const raw of frames) {
        if (!raw.startsWith("data: ")) continue;
        const data = raw.slice(6).trim();
        if (data === "[DONE]") break outer;
        const frame = JSON.parse(data);
        if (frame.type === "text_delta") {
          process.stdout.write(frame.text);
          fullResponse += frame.text;
        } else if (frame.type === "error") {
          throw new Error(frame.message);
        }
      }
    }

    console.log();
    this.messages.push({ role: "assistant", content: fullResponse });
    return fullResponse;
  }

  reset(): void {
    // The system prompt lives outside the message list, so this clears all.
    this.messages = [];
  }
}

async function main() {
  const bot = new Chatbot(
    "You are a helpful photography assistant. Give concise, practical advice."
  );

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

  console.log("Photography Assistant (type 'quit' to exit)\n");
  while (true) {
    const input = await ask("You: ");
    if (input.trim().toLowerCase() === "quit") break;
    if (input.trim().toLowerCase() === "reset") {
      bot.reset();
      console.log("(conversation cleared)\n");
      continue;
    }
    await bot.streamReply(input.trim());
    console.log();
  }
  rl.close();
}

main();
```

:::

## Video Generation with Webhook Notification

Submit a video generation job and receive results via webhook.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub()

# Submit a video generation job with webhook callback
job = client.generate_video(
    prompt="Aerial drone shot flying over a misty mountain range at sunrise, "
    "cinematic color grading, 4K quality",
    model="kling-v3",
    duration=5,
    aspect_ratio="16:9",
    webhook_url="https://yourapp.com/webhook/fotohub",
    webhook_events=["generation.completed", "generation.failed"]
)

print(f"Job submitted: {job.id}")
print(f"Status: {job.status}")  # "processing"
print(f"Estimated time: {job.estimated_seconds}s")

# Option A: Poll for completion (if you cannot use webhooks)
import time

while job.status == "processing":
    time.sleep(10)
    job = client.get_job(job.id)
    print(f"  Status: {job.status} ({job.progress}%)")

if job.status == "completed":
    print(f"Video URL: {job.result.video_url}")
    print(f"Credits used: {job.credits_used}")
else:
    print(f"Failed: {job.error}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function generateVideo() {
  const job = await client.generateVideo({
    prompt:
      "Aerial drone shot flying over a misty mountain range at sunrise, " +
      "cinematic color grading, 4K quality",
    model: "kling-v3",
    duration: 5,
    aspectRatio: "16:9",
    webhookUrl: "https://yourapp.com/webhook/fotohub",
    webhookEvents: ["generation.completed", "generation.failed"],
  });

  console.log(`Job submitted: ${job.id}`);
  console.log(`Status: ${job.status}`);

  // Poll for completion
  let current = job;
  while (current.status === "processing") {
    await new Promise((r) => setTimeout(r, 10000));
    current = await client.getJob(job.id);
    console.log(`  Status: ${current.status} (${current.progress}%)`);
  }

  if (current.status === "completed") {
    console.log(`Video URL: ${current.result.video_url}`);
    console.log(`Credits used: ${current.credits_used}`);
  } else {
    console.log(`Failed: ${current.error}`);
  }
}

generateVideo();
```

:::

## Music Generation for a Podcast Intro

Generate a custom music track for podcast branding.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub()

# Generate a podcast intro jingle
result = client.generate_music(
    prompt="Upbeat electronic podcast intro music, professional, modern, "
    "builds energy in first 3 seconds, clean ending. No vocals.",
    model="music-minimax",
    duration=8,
    sample_rate=44100,
    format="mp3"
)

print(f"Audio URL: {result.audio_url}")
print(f"Duration: {result.duration}s")
print(f"Credits used: {result.credits_used}")

# Download the file
import urllib.request
urllib.request.urlretrieve(result.audio_url, "podcast_intro.mp3")
print("Saved: podcast_intro.mp3")

# Generate variations
styles = ["warm acoustic guitar", "lo-fi chill beats", "orchestral cinematic"]
for style in styles:
    variation = client.generate_music(
        prompt=f"{style} podcast intro, 8 seconds, professional, clean ending",
        model="music-minimax",
        duration=8
    )
    print(f"  {style}: {variation.audio_url}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import * as fs from "fs";
import * as https from "https";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function generatePodcastIntro() {
  const result = await client.generateMusic({
    prompt:
      "Upbeat electronic podcast intro music, professional, modern, " +
      "builds energy in first 3 seconds, clean ending. No vocals.",
    model: "music-minimax",
    duration: 8,
    sampleRate: 44100,
    format: "mp3",
  });

  console.log(`Audio URL: ${result.audioUrl}`);
  console.log(`Duration: ${result.duration}s`);
  console.log(`Credits used: ${result.credits_used}`);

  // Generate style variations
  const styles = ["warm acoustic guitar", "lo-fi chill beats", "orchestral cinematic"];
  for (const style of styles) {
    const variation = await client.generateMusic({
      prompt: `${style} podcast intro, 8 seconds, professional, clean ending`,
      model: "music-minimax",
      duration: 8,
    });
    console.log(`  ${style}: ${variation.audioUrl}`);
  }
}

generatePodcastIntro();
```

:::

## Image Editing Pipeline

Chain operations: generate a base image, edit it, then upscale the result.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub()

# Step 1: Generate the base image
print("Step 1: Generating base image...")
base = client.generate_image(
    prompt="Modern minimalist living room with large windows, natural light, "
    "white walls, wooden floor, single green plant",
    model="seedream-5-0-260128",
    aspect_ratio="16:9"
)
print(f"  Base image: {base.images[0]}")

# Step 2: Edit the image (add furniture)
print("Step 2: Editing image...")
edited = client.edit_image(
    image_url=base.images[0],
    prompt="Add a mid-century modern sofa in navy blue and a coffee table "
    "with books on it, maintaining the same lighting and style",
    model="seedream-5-0-260128",
    strength=0.7
)
print(f"  Edited image: {edited.images[0]}")

# Step 3: Upscale to high resolution
print("Step 3: Upscaling to 4K...")
upscaled = client.upscale_image(
    image_url=edited.images[0],
    scale=4  # 2x or 4x
)
print(f"  Upscaled image: {upscaled.images[0]}")

# Cost summary. Only the generate call reports money (`billing.usd_charged`);
# the edit and upscale routes report credits only.
total_credits = (
    base.billing.credits_used +
    edited.credits_used +
    upscaled.credits_used
)
print(f"\nPipeline complete!")
print(f"  Base image charge: ${base.billing.usd_charged}")
print(f"  Total credits: {total_credits}")
print(f"  Final image: {upscaled.images[0]}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function imageEditingPipeline() {
  // Step 1: Generate base image
  console.log("Step 1: Generating base image...");
  const base = await client.generateImage({
    prompt:
      "Modern minimalist living room with large windows, natural light, " +
      "white walls, wooden floor, single green plant",
    model: "seedream-5-0-260128",
    aspectRatio: "16:9",
  });
  console.log(`  Base image: ${base.images[0]}`);

  // Step 2: Edit the image
  console.log("Step 2: Editing image...");
  const edited = await client.editImage({
    imageUrl: base.images[0],
    prompt:
      "Add a mid-century modern sofa in navy blue and a coffee table " +
      "with books on it, maintaining the same lighting and style",
    model: "seedream-5-0-260128",
    strength: 0.7,
  });
  console.log(`  Edited image: ${edited.images[0]}`);

  // Step 3: Upscale
  console.log("Step 3: Upscaling to 4K...");
  const upscaled = await client.upscaleImage({
    imageUrl: edited.images[0],
    scale: 4, // 2x or 4x
  });
  console.log(`  Upscaled image: ${upscaled.images[0]}`);

  const totalCredits =
    base.billing.credits_used + edited.credits_used + upscaled.credits_used;
  console.log(`\nPipeline complete! Base charge: $${base.billing.usd_charged}, total credits: ${totalCredits}`);
  console.log(`  Final image: ${upscaled.images[0]}`);
}

imageEditingPipeline();
```

:::

## Cost Monitoring with Balance Checking

Guard against overspending by checking balance before expensive operations.

::: code-group

```python [Python]
from fotohub import FotoHub, InsufficientCreditsError

client = FotoHub()

def safe_generate(prompt: str, min_credits: int = 10, **kwargs):
    """Only generate if sufficient credits remain."""
    balance = client.get_balance()
    remaining = balance.credits.remaining_period

    if remaining < min_credits:
        print(f"WARNING: Only {remaining} credits left (minimum: {min_credits})")
        print(f"  Tier: {balance.tier}")
        print(f"  Period resets: {balance.credits.reset_date}")
        print(f"  Wallet balance: ${balance.wallet.balance}")
        raise InsufficientCreditsError(
            f"Credits too low: {remaining} < {min_credits}"
        )

    result = client.generate_image(prompt=prompt, **kwargs)
    new_balance = client.get_balance()
    print(f"Generated! Credits used: {remaining - new_balance.credits.remaining_period}")
    print(f"  Remaining: {new_balance.credits.remaining_period}")
    return result


# Daily usage report
def print_usage_report():
    """Print a summary of current usage and costs."""
    balance = client.get_balance()
    credits = balance.credits
    usage_pct = (1 - credits.remaining_period / credits.limit_period) * 100

    print("=== FOTOhub Usage Report ===")
    print(f"  Tier: {balance.tier}")
    print(f"  Credits: {credits.remaining_period}/{credits.limit_period} "
          f"({usage_pct:.1f}% used)")
    print(f"  Wallet: ${balance.wallet.balance}")
    print(f"  Resets: {credits.reset_date}")

    if usage_pct > 80:
        print("  STATUS: High usage - consider upgrading tier")
    elif usage_pct > 50:
        print("  STATUS: Moderate usage")
    else:
        print("  STATUS: Healthy")


print_usage_report()
```

```typescript [TypeScript]
import { FotoHub, InsufficientCreditsError } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function safeGenerate(
  prompt: string,
  minCredits = 10,
  options: Record<string, unknown> = {}
) {
  const balance = await client.getBalance();
  const remaining = balance.credits.remainingPeriod;

  if (remaining < minCredits) {
    console.warn(`WARNING: Only ${remaining} credits left (minimum: ${minCredits})`);
    console.warn(`  Tier: ${balance.tier}`);
    console.warn(`  Resets: ${balance.credits.resetDate}`);
    throw new InsufficientCreditsError(
      `Credits too low: ${remaining} < ${minCredits}`
    );
  }

  const result = await client.generateImage({ prompt, ...options });
  const newBalance = await client.getBalance();
  console.log(
    `Generated! Credits used: ${remaining - newBalance.credits.remainingPeriod}`
  );
  return result;
}

async function printUsageReport() {
  const balance = await client.getBalance();
  const { remainingPeriod, limitPeriod, resetDate } = balance.credits;
  const usagePct = (1 - remainingPeriod / limitPeriod) * 100;

  console.log("=== FOTOhub Usage Report ===");
  console.log(`  Tier: ${balance.tier}`);
  console.log(`  Credits: ${remainingPeriod}/${limitPeriod} (${usagePct.toFixed(1)}% used)`);
  console.log(`  Wallet: $${balance.wallet.balance}`);
  console.log(`  Resets: ${resetDate}`);
  console.log(`  Status: ${usagePct > 80 ? "HIGH USAGE" : "Healthy"}`);
}

printUsageReport();
```

:::

## Rate Limit Handling with Retry Decorator

Automatic retry with exponential backoff for rate-limited requests.

::: code-group

```python [Python]
import time
import functools
from fotohub import FotoHub, RateLimitError, ApiError

client = FotoHub()

def retry_on_rate_limit(max_retries: int = 5, base_delay: float = 1.0):
    """Decorator that retries on rate limit errors with exponential backoff."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except RateLimitError as e:
                    if attempt == max_retries:
                        raise
                    wait = e.retry_after or (base_delay * (2 ** attempt))
                    print(f"  Rate limited. Retrying in {wait:.1f}s "
                          f"(attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait)
                except ApiError as e:
                    if e.status_code >= 500 and attempt < max_retries:
                        wait = base_delay * (2 ** attempt)
                        print(f"  Server error ({e.status_code}). "
                              f"Retrying in {wait:.1f}s...")
                        time.sleep(wait)
                    else:
                        raise
        return wrapper
    return decorator


@retry_on_rate_limit(max_retries=3)
def generate_image(prompt: str, **kwargs):
    return client.generate_image(prompt=prompt, **kwargs)


# Use it safely in bulk operations
prompts = ["A red car", "A blue house", "A green tree"]
for prompt in prompts:
    result = generate_image(prompt, model="seedream-5-0-260128")
    print(f"OK: {result.images[0]}")
```

```typescript [TypeScript]
import { FotoHub, RateLimitError, ApiError } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof RateLimitError && attempt < maxRetries) {
        const wait = (e.retryAfter ?? baseDelay / 1000) * 1000;
        console.log(
          `  Rate limited. Retrying in ${wait}ms (attempt ${attempt + 1}/${maxRetries})`
        );
        await new Promise((r) => setTimeout(r, wait));
      } else if (
        e instanceof ApiError &&
        e.statusCode >= 500 &&
        attempt < maxRetries
      ) {
        const wait = baseDelay * 2 ** attempt;
        console.log(`  Server error. Retrying in ${wait}ms...`);
        await new Promise((r) => setTimeout(r, wait));
      } else {
        throw e;
      }
    }
  }
  throw new Error("Unreachable");
}

// Usage
async function main() {
  const prompts = ["A red car", "A blue house", "A green tree"];
  for (const prompt of prompts) {
    const result = await withRetry(() =>
      client.generateImage({ prompt, model: "seedream-5-0-260128" })
    );
    console.log(`OK: ${result.images[0]}`);
  }
}

main();
```

:::

## Webhook Receiver Server

Complete webhook receiver implementations for processing async job results.

::: code-group

```python [Flask]
import hmac
import hashlib
from flask import Flask, request, jsonify

app = Flask(__name__)
WEBHOOK_SECRET = "whsec_your_secret_here"

def verify_signature(payload: bytes, signature: str) -> bool:
    """Verify the webhook signature from FOTOhub."""
    expected = hmac.new(
        WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)

@app.route("/webhook/fotohub", methods=["POST"])
def handle_webhook():
    signature = request.headers.get("X-FotoHub-Signature", "")

    if not verify_signature(request.data, signature):
        return jsonify({"error": "Invalid signature"}), 401

    event = request.json
    event_type = event["event"]
    data = event["data"]

    if event_type == "generation.completed":
        print(f"Completed: {data['type']} via {data['model']}")
        print(f"  Job ID: {data['job_id']}")
        print(f"  Result: {data['result_url']}")
        print(f"  Cost: ${data['cost_usd']}")
        # Store result in your database
        # db.save_result(data["job_id"], data["result_url"])

    elif event_type == "generation.failed":
        print(f"Failed: {data['job_id']} - {data['error']}")
        # Notify your team or retry
        # alerting.send(f"Generation failed: {data['error']}")

    elif event_type == "credits.low":
        remaining = data["remaining"]
        print(f"Low credits alert: {remaining} remaining")
        # Send email notification

    elif event_type == "credits.depleted":
        print("CRITICAL: Credits depleted!")
        # Pause scheduled jobs

    return jsonify({"received": True}), 200

if __name__ == "__main__":
    app.run(port=3000)
```

```typescript [Express]
import express from "express";
import crypto from "crypto";

const app = express();
const WEBHOOK_SECRET = "whsec_your_secret_here";

app.use(express.raw({ type: "application/json" }));

function verifySignature(payload: Buffer, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expected}`),
    Buffer.from(signature)
  );
}

app.post("/webhook/fotohub", (req, res) => {
  const signature = req.headers["x-fotohub-signature"] as string;

  if (!verifySignature(req.body, signature || "")) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = JSON.parse(req.body.toString());
  const { event: eventType, data } = event;

  switch (eventType) {
    case "generation.completed":
      console.log(`Completed: ${data.type} via ${data.model}`);
      console.log(`  Job ID: ${data.job_id}`);
      console.log(`  Result: ${data.result_url}`);
      // await db.saveResult(data.job_id, data.result_url);
      break;

    case "generation.failed":
      console.error(`Failed: ${data.job_id} - ${data.error}`);
      // await alerting.notify(`Generation failed: ${data.error}`);
      break;

    case "credits.low":
      console.warn(`Low credits: ${data.remaining} remaining`);
      break;

    case "credits.depleted":
      console.error("CRITICAL: Credits depleted!");
      break;
  }

  res.json({ received: true });
});

app.listen(3000, () => console.log("Webhook server on port 3000"));
```

:::

## Multi-Modal Workflow

Generate an image and then create a video from it (image-to-video pipeline).

::: code-group

```python [Python]
import time
from fotohub import FotoHub

client = FotoHub()

def image_to_video_pipeline(
    image_prompt: str,
    motion_prompt: str,
    video_duration: int = 5
):
    """Generate an image, then animate it into a video."""

    # Step 1: Generate the keyframe image
    print("Generating keyframe image...")
    image_result = client.generate_image(
        prompt=image_prompt,
        model="seedream-5-0-260128",
        aspect_ratio="16:9"
    )
    image_url = image_result.images[0]
    print(f"  Image ready: {image_url}")

    # Step 2: Generate video from the image
    print("Generating video from keyframe...")
    video_job = client.generate_video(
        image_url=image_url,
        prompt=motion_prompt,
        model="kling-v3",
        duration=video_duration,
        mode="image-to-video"
    )
    print(f"  Video job: {video_job.id}")

    # Step 3: Wait for completion
    while video_job.status == "processing":
        time.sleep(5)
        video_job = client.get_job(video_job.id)
        print(f"  Progress: {video_job.progress}%")

    if video_job.status == "completed":
        print(f"\nPipeline complete!")
        print(f"  Video: {video_job.result.video_url}")
        print(f"  Image charge: ${image_result.billing.usd_charged}")
        print(f"  Video credits: {video_job.credits_used}")
        return video_job.result.video_url
    else:
        print(f"Video generation failed: {video_job.error}")
        return None


# Create an animated product showcase
video_url = image_to_video_pipeline(
    image_prompt="Sleek electric sports car in a futuristic showroom, "
    "dramatic lighting, reflective floor, photorealistic",
    motion_prompt="Camera slowly orbits around the car, reflections "
    "shift on the body, subtle light flares",
    video_duration=5
)
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function imageToVideoPipeline(
  imagePrompt: string,
  motionPrompt: string,
  videoDuration = 5
): Promise<string | null> {
  // Step 1: Generate keyframe
  console.log("Generating keyframe image...");
  const imageResult = await client.generateImage({
    prompt: imagePrompt,
    model: "seedream-5-0-260128",
    aspectRatio: "16:9",
  });
  const imageUrl = imageResult.images[0];
  console.log(`  Image ready: ${imageUrl}`);

  // Step 2: Generate video from image
  console.log("Generating video from keyframe...");
  let videoJob = await client.generateVideo({
    imageUrl,
    prompt: motionPrompt,
    model: "kling-v3",
    duration: videoDuration,
    mode: "image-to-video",
  });
  console.log(`  Video job: ${videoJob.id}`);

  // Step 3: Poll for completion
  while (videoJob.status === "processing") {
    await new Promise((r) => setTimeout(r, 5000));
    videoJob = await client.getJob(videoJob.id);
    console.log(`  Progress: ${videoJob.progress}%`);
  }

  if (videoJob.status === "completed") {
    console.log(`\nPipeline complete!`);
    console.log(`  Video: ${videoJob.result.video_url}`);
    console.log(`  Image charge: $${imageResult.billing.usd_charged}`);
    console.log(`  Video credits: ${videoJob.credits_used}`);
    return videoJob.result.videoUrl;
  }

  console.error(`Video generation failed: ${videoJob.error}`);
  return null;
}

imageToVideoPipeline(
  "Sleek electric sports car in a futuristic showroom, dramatic lighting",
  "Camera slowly orbits around the car, reflections shift on the body",
  5
);
```

:::

## Error Recovery Patterns

Robust error handling for production applications.

::: code-group

```python [Python]
import time
import logging
from fotohub import (
    FotoHub,
    RateLimitError,
    InsufficientCreditsError,
    ModelUnavailableError,
    ApiError,
    ValidationError,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fotohub_app")

client = FotoHub()

# Fallback model chain: if primary is unavailable, try alternatives
FALLBACK_MODELS = ["seedream-5-0-260128", "flux-kontext-pro", "dall-e-3-standard"]

def resilient_generate(prompt: str, **kwargs) -> dict | None:
    """Generate an image with full error recovery."""

    for model in FALLBACK_MODELS:
        for attempt in range(3):
            try:
                result = client.generate_image(
                    prompt=prompt, model=model, **kwargs
                )
                logger.info(f"Success with {model} on attempt {attempt + 1}")
                return {
                    "url": result.images[0],
                    "model": model,
                    "cost": result.billing.usd_charged
                }

            except RateLimitError as e:
                wait = e.retry_after or (2 ** attempt)
                logger.warning(f"Rate limited ({model}). Waiting {wait}s...")
                time.sleep(wait)

            except InsufficientCreditsError:
                logger.error("No credits remaining. Cannot proceed.")
                return None  # No point trying other models

            except ModelUnavailableError:
                logger.warning(f"Model {model} unavailable. Trying next...")
                break  # Try next model in fallback chain

            except ValidationError as e:
                logger.error(f"Invalid request: {e.message}")
                return None  # Fix the request, do not retry

            except ApiError as e:
                if e.status_code >= 500:
                    wait = 2 ** attempt
                    logger.warning(f"Server error ({e.status_code}). "
                                   f"Retry in {wait}s...")
                    time.sleep(wait)
                else:
                    logger.error(f"API error: {e.status_code} - {e.message}")
                    return None

    logger.error("All models and retries exhausted.")
    return None


# Usage with graceful degradation
result = resilient_generate(
    "Professional headshot of a business executive, studio lighting",
    aspect_ratio="1:1"
)

if result:
    print(f"Generated with {result['model']}: {result['url']}")
else:
    print("Generation failed after all recovery attempts.")
    # Use a placeholder image, queue for later, or notify the user
```

```typescript [TypeScript]
import {
  FotoHub,
  RateLimitError,
  InsufficientCreditsError,
  ModelUnavailableError,
  ApiError,
  ValidationError,
} from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

const FALLBACK_MODELS = ["seedream-5-0-260128", "flux-kontext-pro", "dall-e-3-standard"];

interface GenerateResult {
  url: string;
  model: string;
  cost: number;
}

async function resilientGenerate(
  prompt: string,
  options: Record<string, unknown> = {}
): Promise<GenerateResult | null> {
  for (const model of FALLBACK_MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await client.generateImage({
          prompt,
          model,
          ...options,
        });
        console.log(`Success with ${model} on attempt ${attempt + 1}`);
        return {
          url: result.images[0],
          model,
          cost: result.billing.usd_charged,
        };
      } catch (e) {
        if (e instanceof RateLimitError) {
          const wait = (e.retryAfter ?? 2 ** attempt) * 1000;
          console.warn(`Rate limited (${model}). Waiting ${wait}ms...`);
          await new Promise((r) => setTimeout(r, wait));
        } else if (e instanceof InsufficientCreditsError) {
          console.error("No credits remaining.");
          return null;
        } else if (e instanceof ModelUnavailableError) {
          console.warn(`Model ${model} unavailable. Trying next...`);
          break;
        } else if (e instanceof ValidationError) {
          console.error(`Invalid request: ${(e as ValidationError).message}`);
          return null;
        } else if (e instanceof ApiError && e.statusCode >= 500) {
          const wait = 2 ** attempt * 1000;
          console.warn(`Server error. Retry in ${wait}ms...`);
          await new Promise((r) => setTimeout(r, wait));
        } else {
          throw e;
        }
      }
    }
  }

  console.error("All models and retries exhausted.");
  return null;
}

// Usage
async function main() {
  const result = await resilientGenerate(
    "Professional headshot of a business executive, studio lighting",
    { aspectRatio: "1:1" }
  );

  if (result) {
    console.log(`Generated with ${result.model}: ${result.url}`);
  } else {
    console.log("Generation failed. Using placeholder.");
  }
}

main();
```

:::

## Cookbook Recipes

### E-Commerce Product Photo

Generate a product image, remove its background, and enhance the final result in one pipeline.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub()

# Generate product image
image = client.generate_image(
    prompt="Professional product photo: leather handbag on white surface, studio lighting",
    model="seedream-5-0-260128",
    aspect_ratio="1:1"
)

# Remove background
nobg = client.remove_background(image_url=image.images[0])

# Enhance for e-commerce
enhanced = client.enhance_image(image_url=nobg.images[0], preset="product")

print(f"Final: {enhanced.images[0]}")
print(f"Image charge: ${image.billing.usd_charged}")
print(f"Credits: {image.billing.credits_used + nobg.credits_used + enhanced.credits_used}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function productPhoto() {
  const image = await client.generateImage({
    prompt: "Professional product photo: leather handbag on white surface, studio lighting",
    model: "seedream-5-0-260128",
    aspectRatio: "1:1",
  });

  const nobg = await client.removeBackground({ imageUrl: image.images[0] });
  const enhanced = await client.enhanceImage({ imageUrl: nobg.images[0], preset: "product" });

  console.log(`Final: ${enhanced.images[0]}`);
  const totalCredits =
    image.billing.credits_used + nobg.credits_used + enhanced.credits_used;
  console.log(`Image charge: $${image.billing.usd_charged}`);
  console.log(`Credits: ${totalCredits}`);
}

productPhoto();
```

```go [Go]
package main

import (
	"fmt"
	"github.com/fotohubapp/sdk-go"
)

func main() {
	client := fotohub.NewClient("fh_live_your_api_key")

	image, _ := client.GenerateImage(&fotohub.GenerateImageParams{
		Prompt:      "Professional product photo: leather handbag on white surface, studio lighting",
		Model:       "seedream-5-0-260128",
		AspectRatio: "1:1",
	})

	nobg, _ := client.RemoveBackground(&fotohub.RemoveBackgroundParams{
		ImageURL: image.Images[0],
	})

	enhanced, _ := client.EnhanceImage(&fotohub.EnhanceImageParams{
		ImageURL: nobg.Images[0],
		Preset:   "product",
	})

	fmt.Printf("Final: %s\n", enhanced.Images[0])
}
```

```bash [cURL]
# Step 1: Generate product image
IMAGE_URL=$(curl -s -X POST https://apis.fotohub.app/v1/images/generate \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Professional product photo: leather handbag on white surface, studio lighting","model":"seedream-5-0-260128","aspect_ratio":"1:1"}' \
  | jq -r '.images[0]')

# Step 2: Remove background
NOBG_URL=$(curl -s -X POST https://apis.fotohub.app/v1/images/remove-background \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"image_url\":\"$IMAGE_URL\"}" | jq -r '.images[0]')

# Step 3: Enhance
curl -s -X POST https://apis.fotohub.app/v1/images/enhance \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"image_url\":\"$NOBG_URL\",\"preset\":\"product\"}" | jq '.images[0]'
```

:::

### Multi-Turn Chatbot

Send a conversation with full history to maintain context across turns.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub()

messages = [
    {"role": "system", "content": "You are a helpful travel assistant."},
    {"role": "user", "content": "I want to visit Japan in October."},
    {"role": "assistant", "content": "October is great for autumn foliage! Would you like city or nature focus?"},
    {"role": "user", "content": "Nature focus. Suggest a 3-day itinerary."},
]

response = client.chat(messages=messages, model="gemini-flash", max_tokens=1024)
print(response.content)
print(f"Tokens: {response.usage.total_tokens}, Credits: {response.credits_used}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function multiTurnChat() {
  const messages = [
    { role: "system" as const, content: "You are a helpful travel assistant." },
    { role: "user" as const, content: "I want to visit Japan in October." },
    { role: "assistant" as const, content: "October is great for autumn foliage! Would you like city or nature focus?" },
    { role: "user" as const, content: "Nature focus. Suggest a 3-day itinerary." },
  ];

  const response = await client.chat({ messages, model: "gemini-flash", maxTokens: 1024 });
  console.log(response.content);
  console.log(`Tokens: ${response.usage.total_tokens}, Credits: ${response.credits_used}`);
}

multiTurnChat();
```

```go [Go]
package main

import (
	"fmt"
	"github.com/fotohubapp/sdk-go"
)

func main() {
	client := fotohub.NewClient("fh_live_your_api_key")

	messages := []fotohub.Message{
		{Role: "system", Content: "You are a helpful travel assistant."},
		{Role: "user", Content: "I want to visit Japan in October."},
		{Role: "assistant", Content: "October is great for autumn foliage! Would you like city or nature focus?"},
		{Role: "user", Content: "Nature focus. Suggest a 3-day itinerary."},
	}

	resp, _ := client.Chat(&fotohub.ChatParams{
		Messages: messages, Model: "gemini-flash", MaxTokens: 1024,
	})

	fmt.Println(resp.Content)
	fmt.Printf("Tokens: %d, Credits: %d\n", resp.Usage.TotalTokens, resp.CreditsUsed)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/chat/completions \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-flash",
    "max_tokens": 1024,
    "messages": [
      {"role": "system", "content": "You are a helpful travel assistant."},
      {"role": "user", "content": "I want to visit Japan in October."},
      {"role": "assistant", "content": "October is great for autumn foliage! Would you like city or nature focus?"},
      {"role": "user", "content": "Nature focus. Suggest a 3-day itinerary."}
    ]
  }'
```

:::

### Voice-Over Pipeline

Transcribe a video, translate the transcript, then generate TTS audio in the target language.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub()

# Step 1: Transcribe original video
transcript = client.transcribe(audio_url="https://example.com/video.mp4", language="en")
print(f"Transcript: {transcript.text[:100]}...")

# Step 2: Translate to Polish
translation = client.chat(
    messages=[{"role": "user", "content": f"Translate to Polish:\n{transcript.text}"}],
    model="gemini-flash"
)

# Step 3: Generate IDA Voice TTS in Polish
audio = client.text_to_speech(
    text=translation.content,
    voice="ida-pl-narrator",
    model="ida-voice",
    format="mp3"
)
print(f"Voice-over: {audio.audio_url}")
print(f"Duration: {audio.duration_seconds}s")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function voiceOverPipeline() {
  // Transcribe
  const transcript = await client.transcribe({
    audioUrl: "https://example.com/video.mp4",
    language: "en",
  });

  // Translate
  const translation = await client.chat({
    messages: [{ role: "user", content: `Translate to Polish:\n${transcript.text}` }],
    model: "gemini-flash",
  });

  // Generate TTS
  const audio = await client.textToSpeech({
    text: translation.content,
    voice: "ida-pl-narrator",
    model: "ida-voice",
    format: "mp3",
  });

  console.log(`Voice-over: ${audio.audioUrl}, Duration: ${audio.durationSeconds}s`);
}

voiceOverPipeline();
```

```go [Go]
package main

import (
	"fmt"
	"github.com/fotohubapp/sdk-go"
)

func main() {
	client := fotohub.NewClient("fh_live_your_api_key")

	transcript, _ := client.Transcribe(&fotohub.TranscribeParams{
		AudioURL: "https://example.com/video.mp4", Language: "en",
	})

	translation, _ := client.Chat(&fotohub.ChatParams{
		Messages: []fotohub.Message{{Role: "user", Content: "Translate to Polish:\n" + transcript.Text}},
		Model:    "gemini-flash",
	})

	audio, _ := client.TextToSpeech(&fotohub.TTSParams{
		Text: translation.Content, Voice: "ida-pl-narrator", Model: "ida-voice", Format: "mp3",
	})

	fmt.Printf("Voice-over: %s (%ds)\n", audio.AudioURL, audio.DurationSeconds)
}
```

```bash [cURL]
# Step 1: Transcribe
TRANSCRIPT=$(curl -s -X POST https://apis.fotohub.app/v1/audio/transcribe \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"audio_url":"https://example.com/video.mp4","language":"en"}' | jq -r '.text')

# Step 2: Translate
TRANSLATED=$(curl -s -X POST https://apis.fotohub.app/v1/chat/completions \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"gemini-flash\",\"messages\":[{\"role\":\"user\",\"content\":\"Translate to Polish:\\n$TRANSCRIPT\"}]}" \
  | jq -r '.content')

# Step 3: TTS
curl -s -X POST https://apis.fotohub.app/v1/audio/tts \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"$TRANSLATED\",\"voice\":\"ida-pl-narrator\",\"model\":\"ida-voice\",\"format\":\"mp3\"}" | jq '.audio_url'
```

:::

### Batch Image Processing

Process 50 images concurrently with proper concurrency control.

::: code-group

```python [Python]
import asyncio
from fotohub import FotoHub

client = FotoHub()

async def process_image(sem: asyncio.Semaphore, url: str) -> dict:
    async with sem:
        result = client.remove_background(image_url=url)
        return {"original": url, "processed": result.images[0]}

async def batch_process(image_urls: list[str], concurrency: int = 10):
    sem = asyncio.Semaphore(concurrency)
    tasks = [process_image(sem, url) for url in image_urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    success = [r for r in results if isinstance(r, dict)]
    errors = [r for r in results if isinstance(r, Exception)]
    print(f"Done: {len(success)} OK, {len(errors)} failed")
    return success

# 50 product images
urls = [f"https://example.com/products/{i}.jpg" for i in range(50)]
results = asyncio.run(batch_process(urls))
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function batchProcess(imageUrls: string[], concurrency = 10) {
  const results: PromiseSettledResult<{ original: string; processed: string }>[] = [];

  for (let i = 0; i < imageUrls.length; i += concurrency) {
    const batch = imageUrls.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (url) => {
        const result = await client.removeBackground({ imageUrl: url });
        return { original: url, processed: result.images[0] };
      })
    );
    results.push(...batchResults);
    console.log(`Processed ${Math.min(i + concurrency, imageUrls.length)}/${imageUrls.length}`);
  }

  const success = results.filter((r) => r.status === "fulfilled").length;
  console.log(`Done: ${success} OK, ${results.length - success} failed`);
  return results;
}

const urls = Array.from({ length: 50 }, (_, i) => `https://example.com/products/${i}.jpg`);
batchProcess(urls);
```

```go [Go]
package main

import (
	"fmt"
	"sync"
	"github.com/fotohubapp/sdk-go"
)

func main() {
	client := fotohub.NewClient("fh_live_your_api_key")
	urls := make([]string, 50)
	for i := range urls {
		urls[i] = fmt.Sprintf("https://example.com/products/%d.jpg", i)
	}

	var wg sync.WaitGroup
	sem := make(chan struct{}, 10) // concurrency limit
	var mu sync.Mutex
	var success int

	for _, url := range urls {
		wg.Add(1)
		go func(u string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			_, err := client.RemoveBackground(&fotohub.RemoveBackgroundParams{ImageURL: u})
			mu.Lock()
			if err == nil {
				success++
			}
			mu.Unlock()
		}(url)
	}

	wg.Wait()
	fmt.Printf("Done: %d/%d OK\n", success, len(urls))
}
```

```bash [cURL]
# Process images in parallel (max 10 concurrent with xargs)
seq 0 49 | xargs -P 10 -I {} curl -s -X POST https://apis.fotohub.app/v1/images/remove-background \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"image_url":"https://example.com/products/{}.jpg"}' \
  -o "output_{}.json"

echo "Batch complete. Check output_*.json files."
```

:::

### Video with Retry

Submit a video generation job and poll with exponential backoff, handling timeouts gracefully.

::: code-group

```python [Python]
import time
from fotohub import FotoHub, ApiError

client = FotoHub()

def generate_video_with_retry(prompt: str, max_wait: int = 300, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            job = client.generate_video(prompt=prompt, model="kling-v3", duration=5)
            break
        except ApiError as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)
    else:
        return None

    elapsed = 0
    backoff = 5
    while job.status == "processing" and elapsed < max_wait:
        time.sleep(backoff)
        elapsed += backoff
        backoff = min(backoff * 1.5, 30)
        job = client.get_job(job.id)
        print(f"  [{elapsed}s] {job.status} - {job.progress}%")

    if job.status == "completed":
        return job.result.video_url
    elif elapsed >= max_wait:
        raise TimeoutError(f"Job {job.id} did not complete within {max_wait}s")
    else:
        raise RuntimeError(f"Job failed: {job.error}")

url = generate_video_with_retry("A cat playing piano in a jazz club, cinematic")
print(f"Video: {url}")
```

```typescript [TypeScript]
import { FotoHub, ApiError } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function generateVideoWithRetry(prompt: string, maxWait = 300, maxRetries = 3) {
  let job;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      job = await client.generateVideo({ prompt, model: "kling-v3", duration: 5 });
      break;
    } catch (e) {
      if (attempt === maxRetries - 1) throw e;
      await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
    }
  }
  if (!job) throw new Error("Failed to submit job");

  let elapsed = 0;
  let backoff = 5;
  while (job.status === "processing" && elapsed < maxWait) {
    await new Promise((r) => setTimeout(r, backoff * 1000));
    elapsed += backoff;
    backoff = Math.min(backoff * 1.5, 30);
    job = await client.getJob(job.id);
    console.log(`  [${elapsed}s] ${job.status} - ${job.progress}%`);
  }

  if (job.status === "completed") return job.result.videoUrl;
  if (elapsed >= maxWait) throw new Error(`Timeout after ${maxWait}s`);
  throw new Error(`Job failed: ${job.error}`);
}

generateVideoWithRetry("A cat playing piano in a jazz club, cinematic").then(console.log);
```

```go [Go]
package main

import (
	"fmt"
	"math"
	"time"
	"github.com/fotohubapp/sdk-go"
)

func main() {
	client := fotohub.NewClient("fh_live_your_api_key")

	var job *fotohub.Job
	for attempt := 0; attempt < 3; attempt++ {
		var err error
		job, err = client.GenerateVideo(&fotohub.GenerateVideoParams{
			Prompt: "A cat playing piano in a jazz club, cinematic", Model: "kling-v3", Duration: 5,
		})
		if err == nil {
			break
		}
		time.Sleep(time.Duration(math.Pow(2, float64(attempt))) * time.Second)
	}

	elapsed := 0.0
	backoff := 5.0
	for job.Status == "processing" && elapsed < 300 {
		time.Sleep(time.Duration(backoff) * time.Second)
		elapsed += backoff
		backoff = math.Min(backoff*1.5, 30)
		job, _ = client.GetJob(job.ID)
		fmt.Printf("  [%.0fs] %s - %d%%\n", elapsed, job.Status, job.Progress)
	}

	if job.Status == "completed" {
		fmt.Printf("Video: %s\n", job.Result.VideoURL)
	}
}
```

```bash [cURL]
# Submit job
JOB_ID=$(curl -s -X POST https://apis.fotohub.app/v1/video/generate \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A cat playing piano in a jazz club, cinematic","model":"kling-v3","duration":5}' \
  | jq -r '.id')

# Poll with exponential backoff
BACKOFF=5
for i in $(seq 1 20); do
  sleep $BACKOFF
  STATUS=$(curl -s https://apis.fotohub.app/v1/jobs/$JOB_ID \
    -H "Authorization: Bearer fh_live_your_api_key" | jq -r '.status')
  echo "[$((BACKOFF * i))s] $STATUS"
  [ "$STATUS" = "completed" ] && break
  [ "$STATUS" = "failed" ] && exit 1
  BACKOFF=$(echo "$BACKOFF * 1.5" | bc | cut -d. -f1)
  [ $BACKOFF -gt 30 ] && BACKOFF=30
done

# Get result
curl -s https://apis.fotohub.app/v1/jobs/$JOB_ID \
  -H "Authorization: Bearer fh_live_your_api_key" | jq '.result.video_url'
```

:::

### Gabriel Auto-Router

Send a prompt to Gabriel to classify the best model, then use it for generation.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub()

def auto_generate(prompt: str):
    # Gabriel classifies the prompt and picks the optimal model
    classification = client.gabriel_classify(prompt=prompt)
    model = classification.recommended_model
    category = classification.category

    print(f"Gabriel says: use '{model}' (category: {category})")

    if category == "image":
        result = client.generate_image(prompt=prompt, model=model)
        return result.images[0]
    elif category == "video":
        job = client.generate_video(prompt=prompt, model=model, duration=5)
        return job.id
    elif category == "chat":
        result = client.chat(messages=[{"role": "user", "content": prompt}], model=model)
        return result.content

prompt = "A photorealistic sunset over the ocean with dramatic clouds"
output = auto_generate(prompt)
print(f"Output: {output}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function autoGenerate(prompt: string) {
  const classification = await client.gabrielClassify({ prompt });
  const { recommendedModel, category } = classification;
  console.log(`Gabriel says: use '${recommendedModel}' (category: ${category})`);

  if (category === "image") {
    const result = await client.generateImage({ prompt, model: recommendedModel });
    return result.images[0];
  } else if (category === "video") {
    const job = await client.generateVideo({ prompt, model: recommendedModel, duration: 5 });
    return job.id;
  } else {
    const result = await client.chat({
      messages: [{ role: "user", content: prompt }],
      model: recommendedModel,
    });
    return result.content;
  }
}

autoGenerate("A photorealistic sunset over the ocean with dramatic clouds").then(console.log);
```

```go [Go]
package main

import (
	"fmt"
	"github.com/fotohubapp/sdk-go"
)

func main() {
	client := fotohub.NewClient("fh_live_your_api_key")
	prompt := "A photorealistic sunset over the ocean with dramatic clouds"

	classification, _ := client.GabrielClassify(&fotohub.ClassifyParams{Prompt: prompt})
	model := classification.RecommendedModel
	fmt.Printf("Gabriel says: use '%s' (category: %s)\n", model, classification.Category)

	if classification.Category == "image" {
		result, _ := client.GenerateImage(&fotohub.GenerateImageParams{Prompt: prompt, Model: model})
		fmt.Printf("Image: %s\n", result.Images[0])
	} else if classification.Category == "video" {
		job, _ := client.GenerateVideo(&fotohub.GenerateVideoParams{Prompt: prompt, Model: model, Duration: 5})
		fmt.Printf("Job: %s\n", job.ID)
	}
}
```

```bash [cURL]
# Classify prompt with Gabriel
RESULT=$(curl -s -X POST https://apis.fotohub.app/v1/gabriel/classify \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A photorealistic sunset over the ocean with dramatic clouds"}')

MODEL=$(echo $RESULT | jq -r '.recommended_model')
CATEGORY=$(echo $RESULT | jq -r '.category')
echo "Gabriel: use $MODEL ($CATEGORY)"

# Use the recommended model
curl -s -X POST https://apis.fotohub.app/v1/images/generate \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"A photorealistic sunset over the ocean with dramatic clouds\",\"model\":\"$MODEL\"}" \
  | jq '.images[0]'
```

:::

### Webhook Server

A complete webhook handler that verifies HMAC signatures for secure event processing.

::: code-group

```python [Python]
import hmac
import hashlib
from flask import Flask, request, jsonify

app = Flask(__name__)
WEBHOOK_SECRET = "whsec_your_secret_here"

@app.route("/webhook/fotohub", methods=["POST"])
def handle_webhook():
    signature = request.headers.get("X-FotoHub-Signature", "")
    expected = "sha256=" + hmac.new(
        WEBHOOK_SECRET.encode(), request.data, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        return jsonify({"error": "invalid signature"}), 401

    event = request.json
    match event["event"]:
        case "generation.completed":
            print(f"Done: {event['data']['job_id']} -> {event['data']['result_url']}")
        case "generation.failed":
            print(f"Failed: {event['data']['job_id']}: {event['data']['error']}")
        case "credits.low":
            print(f"Low credits: {event['data']['remaining']} left")

    return jsonify({"received": True}), 200

if __name__ == "__main__":
    app.run(port=3000)
```

```typescript [TypeScript]
import express from "express";
import crypto from "crypto";

const app = express();
const WEBHOOK_SECRET = "whsec_your_secret_here";

app.use(express.raw({ type: "application/json" }));

app.post("/webhook/fotohub", (req, res) => {
  const signature = req.headers["x-fotohub-signature"] as string || "";
  const expected = "sha256=" + crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(req.body)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return res.status(401).json({ error: "invalid signature" });
  }

  const event = JSON.parse(req.body.toString());
  switch (event.event) {
    case "generation.completed":
      console.log(`Done: ${event.data.job_id} -> ${event.data.result_url}`);
      break;
    case "generation.failed":
      console.error(`Failed: ${event.data.job_id}: ${event.data.error}`);
      break;
    case "credits.low":
      console.warn(`Low credits: ${event.data.remaining} left`);
      break;
  }

  res.json({ received: true });
});

app.listen(3000, () => console.log("Webhook server on :3000"));
```

```go [Go]
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const webhookSecret = "whsec_your_secret_here"

func verifySignature(body []byte, signature string) bool {
	mac := hmac.New(sha256.New, []byte(webhookSecret))
	mac.Write(body)
	expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(r.Body)
	sig := r.Header.Get("X-FotoHub-Signature")

	if !verifySignature(body, sig) {
		http.Error(w, `{"error":"invalid signature"}`, 401)
		return
	}

	var event struct {
		Event string                 `json:"event"`
		Data  map[string]interface{} `json:"data"`
	}
	json.Unmarshal(body, &event)
	fmt.Printf("Event: %s, Job: %v\n", event.Event, event.Data["job_id"])

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"received":true}`))
}

func main() {
	http.HandleFunc("/webhook/fotohub", webhookHandler)
	fmt.Println("Webhook server on :3000")
	http.ListenAndServe(":3000", nil)
}
```

```bash [cURL]
# Test webhook locally (simulate FOTOhub sending an event)
SECRET="whsec_your_secret_here"
PAYLOAD='{"event":"generation.completed","data":{"job_id":"job_abc123","result_url":"https://cdn.fotohub.app/result.mp4"}}'
SIGNATURE="sha256=$(echo -n $PAYLOAD | openssl dgst -sha256 -hmac $SECRET | awk '{print $2}')"

curl -X POST http://localhost:3000/webhook/fotohub \
  -H "Content-Type: application/json" \
  -H "X-FotoHub-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

:::

### Streaming Chat

Real-time server-sent events (SSE) streaming for responsive chat interfaces.

`POST /v1/ai/agent/stream` is the only streaming endpoint. The chat endpoints
(`/v1/ai/chat/completions`, `/v1/ai/chat/claude`) accept `stream: true` and
ignore it, returning one complete JSON body — and neither SDK's stream helper
works against them, so these examples use plain HTTP. Frames carry a `type`
field: `text_delta`, `tool_use`, `done`, `error`. See the
[Streaming Guide](/guides/streaming).

::: code-group

```python [Python]
import json
import os

import requests

resp = requests.post(
    "https://apis.fotohub.app/v1/ai/agent/stream",
    headers={"Authorization": f"Bearer {os.environ['FOTOHUB_API_KEY']}",
             "Content-Type": "application/json"},
    json={
        "model": "claude-sonnet-4.6",
        "max_tokens": 512,
        "messages": [{"role": "user", "content": "Write a short poem about code."}],
    },
    stream=True,
)
resp.raise_for_status()

full_text = ""
for line in resp.iter_lines():
    if not line:
        continue
    payload = line.decode("utf-8")
    if not payload.startswith("data: "):
        continue
    data = payload[6:]
    if data == "[DONE]":
        break
    frame = json.loads(data)
    if frame["type"] == "text_delta":
        print(frame["text"], end="", flush=True)
        full_text += frame["text"]
    elif frame["type"] == "done":
        print(f"\n\nTotal tokens: {frame['usage']['total_tokens']}")
    elif frame["type"] == "error":
        raise RuntimeError(frame["message"])
```

```typescript [TypeScript]
async function streamChat() {
  const response = await fetch("https://apis.fotohub.app/v1/ai/agent/stream", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4.6",
      max_tokens: 512,
      messages: [{ role: "user", content: "Write a short poem about code." }],
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  // One read() can end mid-frame, so buffer to the blank-line separator.
  let buffer = "";

  outer: while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const raw of frames) {
      if (!raw.startsWith("data: ")) continue;
      const data = raw.slice(6).trim();
      if (data === "[DONE]") break outer;
      const frame = JSON.parse(data);
      if (frame.type === "text_delta") {
        process.stdout.write(frame.text);
        fullText += frame.text;
      } else if (frame.type === "error") {
        throw new Error(frame.message);
      }
    }
  }
  console.log(`\n\nTotal length: ${fullText.length} chars`);
}

streamChat();
```

```go [Go]
package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
)

func main() {
	body := `{"model":"claude-sonnet-4.6","max_tokens":512,"messages":[{"role":"user","content":"Write a short poem about code."}]}`
	req, _ := http.NewRequest("POST",
		"https://apis.fotohub.app/v1/ai/agent/stream", strings.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		data := strings.TrimPrefix(line, "data: ")
		if data == "[DONE]" {
			break
		}
		var frame struct {
			Type string `json:"type"`
			Text string `json:"text"`
		}
		json.Unmarshal([]byte(data), &frame)
		if frame.Type == "text_delta" {
			fmt.Print(frame.Text)
		}
	}
	fmt.Println()
}
```

```bash [cURL]
curl -N -X POST https://apis.fotohub.app/v1/ai/agent/stream \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4.6",
    "max_tokens": 512,
    "messages": [{"role": "user", "content": "Write a short poem about code."}]
  }'
```

:::

### MCP Setup

Configure Claude Desktop to use FOTOhub as an MCP tool server.

::: code-group

```python [Python]
# Claude Desktop config: ~/.config/claude-desktop/claude_desktop_config.json
# FOTOhub's MCP server is a remote Streamable HTTP endpoint — no local install needed.
config = {
    "mcpServers": {
        "fotohub": {
            "url": "https://apis.fotohub.app/mcp/",
            "headers": {
                "Authorization": "Bearer fh_live_your_api_key"
            }
        }
    }
}

# Verify MCP server is reachable
from fotohub import FotoHub

client = FotoHub()
tools = client.mcp.list_tools()
print(f"Available MCP tools: {len(tools)}")
for tool in tools:
    print(f"  - {tool.name}: {tool.description}")
```

```typescript [TypeScript]
// Claude Desktop config: ~/.config/claude-desktop/claude_desktop_config.json
// FOTOhub's MCP server is a remote Streamable HTTP endpoint — no local install needed.
const config = {
  mcpServers: {
    fotohub: {
      url: "https://apis.fotohub.app/mcp/",
      headers: {
        Authorization: "Bearer fh_live_your_api_key",
      },
    },
  },
};

// Verify MCP connectivity
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function verifyMcp() {
  const tools = await client.mcp.listTools();
  console.log(`Available MCP tools: ${tools.length}`);
  tools.forEach((t) => console.log(`  - ${t.name}: ${t.description}`));
}

verifyMcp();
```

```go [Go]
package main

import (
	"encoding/json"
	"fmt"
	"os"
)

// Generate Claude Desktop config programmatically.
// FOTOhub's MCP server is a remote Streamable HTTP endpoint — no local install needed.
func main() {
	config := map[string]interface{}{
		"mcpServers": map[string]interface{}{
			"fotohub": map[string]interface{}{
				"url": "https://apis.fotohub.app/mcp/",
				"headers": map[string]string{
					"Authorization": "Bearer fh_live_your_api_key",
				},
			},
		},
	}

	data, _ := json.MarshalIndent(config, "", "  ")
	configPath := os.ExpandEnv("$HOME/.config/claude-desktop/claude_desktop_config.json")
	os.WriteFile(configPath, data, 0644)
	fmt.Printf("Config written to %s\n", configPath)
}
```

```bash [cURL]
# Test the MCP server endpoint directly (JSON-RPC over Streamable HTTP)
curl -s -X POST https://apis.fotohub.app/mcp/ \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools[] | {name, description}'

# Claude Desktop config (save to ~/.config/claude-desktop/claude_desktop_config.json):
# {
#   "mcpServers": {
#     "fotohub": {
#       "url": "https://apis.fotohub.app/mcp/",
#       "headers": { "Authorization": "Bearer fh_live_your_api_key" }
#     }
#   }
# }
```

:::

### Cost Monitor

Check your balance, estimate operation cost, and alert when credits are running low.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub()

def cost_monitor(alert_threshold: int = 50):
    balance = client.get_balance()
    remaining = balance.credits.remaining_period
    limit = balance.credits.limit_period
    usage_pct = (1 - remaining / limit) * 100

    print(f"Credits: {remaining}/{limit} ({usage_pct:.1f}% used)")
    print(f"Wallet: ${balance.wallet.balance}")
    print(f"Resets: {balance.credits.reset_date}")

    # Estimate cost of planned operations
    estimate = client.estimate_cost(operations=[
        {"type": "image_generate", "model": "seedream-5-0-260128", "count": 20},
        {"type": "video_generate", "model": "kling-v3", "count": 5},
    ])
    print(f"\nPlanned cost estimate: {estimate.total_credits} credits (${estimate.total_usd})")

    if remaining < alert_threshold:
        print(f"\nALERT: Only {remaining} credits left! Consider upgrading.")
        return False
    if remaining < estimate.total_credits:
        print(f"\nWARNING: Not enough credits for planned operations.")
        return False
    return True

cost_monitor()
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function costMonitor(alertThreshold = 50) {
  const balance = await client.getBalance();
  const { remainingPeriod, limitPeriod, resetDate } = balance.credits;
  const usagePct = (1 - remainingPeriod / limitPeriod) * 100;

  console.log(`Credits: ${remainingPeriod}/${limitPeriod} (${usagePct.toFixed(1)}% used)`);
  console.log(`Wallet: $${balance.wallet.balance}`);
  console.log(`Resets: ${resetDate}`);

  const estimate = await client.estimateCost({
    operations: [
      { type: "image_generate", model: "seedream-5-0-260128", count: 20 },
      { type: "video_generate", model: "kling-v3", count: 5 },
    ],
  });
  console.log(`\nPlanned cost: ${estimate.total_credits} credits ($${estimate.total_usd})`);

  if (remainingPeriod < alertThreshold) {
    console.warn(`\nALERT: Only ${remainingPeriod} credits left!`);
    return false;
  }
  return remainingPeriod >= estimate.totalCredits;
}

costMonitor();
```

```go [Go]
package main

import (
	"fmt"
	"github.com/fotohubapp/sdk-go"
)

func main() {
	client := fotohub.NewClient("fh_live_your_api_key")

	balance, _ := client.GetBalance()
	remaining := balance.Credits.RemainingPeriod
	limit := balance.Credits.LimitPeriod
	usagePct := (1 - float64(remaining)/float64(limit)) * 100

	fmt.Printf("Credits: %d/%d (%.1f%% used)\n", remaining, limit, usagePct)
	fmt.Printf("Wallet: $%.2f\n", balance.Wallet.Balance)

	estimate, _ := client.EstimateCost(&fotohub.EstimateCostParams{
		Operations: []fotohub.Operation{
			{Type: "image_generate", Model: "seedream-5-0-260128", Count: 20},
			{Type: "video_generate", Model: "kling-v3", Count: 5},
		},
	})
	fmt.Printf("Planned cost: %d credits ($%.4f)\n", estimate.TotalCredits, estimate.TotalUSD)

	if remaining < 50 {
		fmt.Println("\nALERT: Low credits!")
	}
}
```

```bash [cURL]
# Check balance
curl -s https://apis.fotohub.app/v1/billing/balance \
  -H "Authorization: Bearer fh_live_your_api_key" | jq '{
    credits_remaining: .credits.remaining_period,
    credits_limit: .credits.limit_period,
    wallet_usd: .wallet.balance,
    resets: .credits.reset_date
  }'

# Estimate cost of planned operations
curl -s -X POST https://apis.fotohub.app/v1/billing/estimate \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {"type": "image_generate", "model": "seedream-5-0-260128", "count": 20},
      {"type": "video_generate", "model": "kling-v3", "count": 5}
    ]
  }' | jq '{total_credits, total_usd}'
```

:::

## Next Steps

- [API Reference](/api/getting-started) for complete endpoint documentation
- [Webhooks Guide](/api/webhooks) for async event handling details
- [Rate Limits](/api/rate-limits) for throughput planning
- [Models Catalog](/api/models) for available models and pricing
