# SDK Examples

Real-world, production-ready examples for common FOTOhub SDK workflows.

## Batch Image Generation

Process a list of prompts concurrently with progress tracking.

::: code-group

```python [Python]
import asyncio
from fotohub import FotohubClient

client = FotohubClient()

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
            "cost": result.billing.cost_pln
        })
        total_cost += result.billing.cost_pln
        print(f"[{i}/{len(prompts)}] Done: {prompt[:50]}...")

    print(f"\nBatch complete: {len(results)} images, total cost: {total_cost:.2f} PLN")
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
import { FotohubClient } from "@fotohub/sdk";

const client = new FotohubClient({ apiKey: process.env.FOTOHUB_API_KEY! });

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
      cost: result.billing.costPln,
    });
    totalCost += result.billing.costPln;
    console.log(`[${i + 1}/${prompts.length}] Done: ${prompts[i].slice(0, 50)}...`);
  }

  console.log(`\nBatch complete: ${results.length} images, total: ${totalCost.toFixed(2)} PLN`);
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
from fotohub import FotohubClient

client = FotohubClient()

class Chatbot:
    def __init__(self, system_prompt: str, model: str = "gemini-flash"):
        self.model = model
        self.messages = [{"role": "system", "content": system_prompt}]

    def stream_reply(self, user_input: str) -> str:
        """Send a message and stream the response token by token."""
        self.messages.append({"role": "user", "content": user_input})
        full_response = ""

        print("Assistant: ", end="", flush=True)
        for chunk in client.chat_stream(
            messages=self.messages,
            model=self.model,
            temperature=0.7,
            max_tokens=1024
        ):
            print(chunk.delta, end="", flush=True)
            full_response += chunk.delta

        print()  # newline after stream
        self.messages.append({"role": "assistant", "content": full_response})
        return full_response

    def reset(self):
        """Clear conversation history, keeping the system prompt."""
        self.messages = [self.messages[0]]


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
import { FotohubClient } from "@fotohub/sdk";
import * as readline from "readline";

const client = new FotohubClient({ apiKey: process.env.FOTOHUB_API_KEY! });

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

class Chatbot {
  private messages: Message[];
  private model: string;

  constructor(systemPrompt: string, model = "gemini-flash") {
    this.model = model;
    this.messages = [{ role: "system", content: systemPrompt }];
  }

  async streamReply(userInput: string): Promise<string> {
    this.messages.push({ role: "user", content: userInput });
    let fullResponse = "";

    process.stdout.write("Assistant: ");
    const stream = await client.chatStream({
      messages: this.messages,
      model: this.model,
      temperature: 0.7,
      maxTokens: 1024,
    });

    for await (const chunk of stream) {
      process.stdout.write(chunk.delta);
      fullResponse += chunk.delta;
    }

    console.log();
    this.messages.push({ role: "assistant", content: fullResponse });
    return fullResponse;
  }

  reset(): void {
    this.messages = [this.messages[0]];
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
from fotohub import FotohubClient

client = FotohubClient()

# Submit a video generation job with webhook callback
job = client.generate_video(
    prompt="Aerial drone shot flying over a misty mountain range at sunrise, "
    "cinematic color grading, 4K quality",
    model="kling-v2",
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
    print(f"Cost: {job.billing.cost_pln} PLN")
else:
    print(f"Failed: {job.error}")
```

```typescript [TypeScript]
import { FotohubClient } from "@fotohub/sdk";

const client = new FotohubClient({ apiKey: process.env.FOTOHUB_API_KEY! });

async function generateVideo() {
  const job = await client.generateVideo({
    prompt:
      "Aerial drone shot flying over a misty mountain range at sunrise, " +
      "cinematic color grading, 4K quality",
    model: "kling-v2",
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
    console.log(`Video URL: ${current.result.videoUrl}`);
    console.log(`Cost: ${current.billing.costPln} PLN`);
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
from fotohub import FotohubClient

client = FotohubClient()

# Generate a podcast intro jingle
result = client.generate_music(
    prompt="Upbeat electronic podcast intro music, professional, modern, "
    "builds energy in first 3 seconds, clean ending. No vocals.",
    model="stable-audio",
    duration=8,
    sample_rate=44100,
    format="mp3"
)

print(f"Audio URL: {result.audio_url}")
print(f"Duration: {result.duration_seconds}s")
print(f"Cost: {result.billing.cost_pln} PLN")

# Download the file
import urllib.request
urllib.request.urlretrieve(result.audio_url, "podcast_intro.mp3")
print("Saved: podcast_intro.mp3")

# Generate variations
styles = ["warm acoustic guitar", "lo-fi chill beats", "orchestral cinematic"]
for style in styles:
    variation = client.generate_music(
        prompt=f"{style} podcast intro, 8 seconds, professional, clean ending",
        model="stable-audio",
        duration=8
    )
    print(f"  {style}: {variation.audio_url}")
```

```typescript [TypeScript]
import { FotohubClient } from "@fotohub/sdk";
import * as fs from "fs";
import * as https from "https";

const client = new FotohubClient({ apiKey: process.env.FOTOHUB_API_KEY! });

async function generatePodcastIntro() {
  const result = await client.generateMusic({
    prompt:
      "Upbeat electronic podcast intro music, professional, modern, " +
      "builds energy in first 3 seconds, clean ending. No vocals.",
    model: "stable-audio",
    duration: 8,
    sampleRate: 44100,
    format: "mp3",
  });

  console.log(`Audio URL: ${result.audioUrl}`);
  console.log(`Duration: ${result.durationSeconds}s`);
  console.log(`Cost: ${result.billing.costPln} PLN`);

  // Generate style variations
  const styles = ["warm acoustic guitar", "lo-fi chill beats", "orchestral cinematic"];
  for (const style of styles) {
    const variation = await client.generateMusic({
      prompt: `${style} podcast intro, 8 seconds, professional, clean ending`,
      model: "stable-audio",
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
from fotohub import FotohubClient

client = FotohubClient()

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
    model="clarity-upscaler",
    scale=4
)
print(f"  Upscaled image: {upscaled.images[0]}")

# Cost summary
total_cost = (
    base.billing.cost_pln +
    edited.billing.cost_pln +
    upscaled.billing.cost_pln
)
print(f"\nPipeline complete!")
print(f"  Total cost: {total_cost:.2f} PLN")
print(f"  Final image: {upscaled.images[0]}")
```

```typescript [TypeScript]
import { FotohubClient } from "@fotohub/sdk";

const client = new FotohubClient({ apiKey: process.env.FOTOHUB_API_KEY! });

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
    model: "clarity-upscaler",
    scale: 4,
  });
  console.log(`  Upscaled image: ${upscaled.images[0]}`);

  const totalCost =
    base.billing.costPln + edited.billing.costPln + upscaled.billing.costPln;
  console.log(`\nPipeline complete! Total cost: ${totalCost.toFixed(2)} PLN`);
  console.log(`  Final image: ${upscaled.images[0]}`);
}

imageEditingPipeline();
```

:::

## Cost Monitoring with Balance Checking

Guard against overspending by checking balance before expensive operations.

::: code-group

```python [Python]
from fotohub import FotohubClient, InsufficientCreditsError

client = FotohubClient()

def safe_generate(prompt: str, min_credits: int = 10, **kwargs):
    """Only generate if sufficient credits remain."""
    balance = client.get_balance()
    remaining = balance.credits.remaining_period

    if remaining < min_credits:
        print(f"WARNING: Only {remaining} credits left (minimum: {min_credits})")
        print(f"  Tier: {balance.tier}")
        print(f"  Period resets: {balance.credits.reset_date}")
        print(f"  Wallet balance: {balance.wallet.balance} PLN")
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
    print(f"  Wallet: {balance.wallet.balance} PLN")
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
import { FotohubClient, InsufficientCreditsError } from "@fotohub/sdk";

const client = new FotohubClient({ apiKey: process.env.FOTOHUB_API_KEY! });

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
  console.log(`  Wallet: ${balance.wallet.balance} PLN`);
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
from fotohub import FotohubClient, RateLimitError, ApiError

client = FotohubClient()

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
import { FotohubClient, RateLimitError, ApiError } from "@fotohub/sdk";

const client = new FotohubClient({ apiKey: process.env.FOTOHUB_API_KEY! });

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
        print(f"  Cost: {data['cost_pln']} PLN")
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
from fotohub import FotohubClient

client = FotohubClient()

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
        model="kling-v2",
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
        total_cost = image_result.billing.cost_pln + video_job.billing.cost_pln
        print(f"\nPipeline complete!")
        print(f"  Video: {video_job.result.video_url}")
        print(f"  Total cost: {total_cost:.2f} PLN")
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
import { FotohubClient } from "@fotohub/sdk";

const client = new FotohubClient({ apiKey: process.env.FOTOHUB_API_KEY! });

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
    model: "kling-v2",
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
    const totalCost = imageResult.billing.costPln + videoJob.billing.costPln;
    console.log(`\nPipeline complete!`);
    console.log(`  Video: ${videoJob.result.videoUrl}`);
    console.log(`  Total cost: ${totalCost.toFixed(2)} PLN`);
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
    FotohubClient,
    RateLimitError,
    InsufficientCreditsError,
    ModelUnavailableError,
    ApiError,
    ValidationError,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fotohub_app")

client = FotohubClient()

# Fallback model chain: if primary is unavailable, try alternatives
FALLBACK_MODELS = ["seedream-5-0-260128", "flux-kontext-pro", "dall-e-3"]

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
                    "cost": result.billing.cost_pln
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
  FotohubClient,
  RateLimitError,
  InsufficientCreditsError,
  ModelUnavailableError,
  ApiError,
  ValidationError,
} from "@fotohub/sdk";

const client = new FotohubClient({ apiKey: process.env.FOTOHUB_API_KEY! });

const FALLBACK_MODELS = ["seedream-5-0-260128", "flux-kontext-pro", "dall-e-3"];

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
          cost: result.billing.costPln,
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

## Next Steps

- [API Reference](/api/getting-started) for complete endpoint documentation
- [Webhooks Guide](/api/webhooks) for async event handling details
- [Rate Limits](/api/rate-limits) for throughput planning
- [Models Catalog](/api/models) for available models and pricing
