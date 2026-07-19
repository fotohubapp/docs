# Integrations Hub

The Integrations Hub is FOTOhub's developer platform for building, testing, monitoring, and deploying API integrations. Access it at [fotohub.app/integrations-hub](https://fotohub.app/integrations-hub).

**Key features:**
- AI-powered integration wizard (4-step guided setup)
- App management with API keys, webhooks, and scopes
- Sandbox testing environment with preset requests
- Interactive API documentation browser
- Real-time monitoring and service health checks
- Template library with pre-built integration patterns

---

## Platform Overview

| Route | Purpose |
|-------|---------|
| `/integrations-hub` | Dashboard — stats, quick actions, recent apps |
| `/integrations-hub/wizard` | AI Wizard — 4-step guided integration setup |
| `/integrations-hub/apps` | App Management — create, list, configure apps |
| `/integrations-hub/apps/:id` | App Detail — keys, webhooks, settings, metrics |
| `/integrations-hub/apps/:id/sandbox` | App Sandbox — test API calls for specific app |
| `/integrations-hub/sandbox` | General Sandbox — test any API call |
| `/integrations-hub/templates` | Template Catalog — pre-built integration patterns |
| `/integrations-hub/monitoring` | Monitoring — traffic, latency, service status |
| `/integrations-hub/docs` | API Docs — interactive endpoint browser |

---

## Getting Started

### 1. Create an App

Every integration starts with an app. An app is a logical container for:
- API keys (authentication)
- Webhooks (event notifications)
- Scopes (permissions)
- Usage metrics

Navigate to **Apps** → **Create App** and fill in:

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Display name for your integration (e.g., "Production Backend") |
| Description | No | What this app does |
| Use Case | Yes | Category: E-commerce, Agency, SaaS, Media, or Custom |

### 2. Generate an API Key

In your app's detail page, go to the **API Keys** tab:

1. Click **Create Key**
2. The key is displayed once — copy and store it securely
3. Use it as a Bearer token in all API requests

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A mountain landscape at sunset", "model": "seedream-5-0-260128"}'
```

### 3. Test in Sandbox

Before going to production, test your API calls in the Sandbox:

1. Select HTTP method (GET, POST, PUT, DELETE, PATCH)
2. Enter the endpoint path (e.g., `/v1/ai/generate/image`)
3. Add request body (JSON)
4. Click **Execute**
5. View response with status code, timing, and full body

---

## AI Wizard

The AI Wizard guides you through integration setup in 4 steps, using AI to recommend the best APIs, architecture, and configuration for your use case.

### Step 1: Select Use Case

Choose your integration type:

| Use Case | Examples | Typical APIs |
|----------|----------|--------------|
| **E-commerce** | Product photo generation, catalog images | Image generation, remove background, upscale |
| **Marketing Agency** | Campaign visuals, social media content | Image + video generation, social publishing |
| **SaaS Platform** | User-facing AI features, API reselling | Chat completions, image generation, billing |
| **Media & Content** | Video production, podcast creation | Video generation, music, TTS, transcription |
| **Custom** | Anything else | Full API access |

### Step 2: Configure

After selecting a use case, you can optionally provide a brief describing your specific needs. The AI analyzes your requirements and generates:

- **Recommended APIs** — which endpoints to use, with credit costs and rate limits
- **Architecture suggestions** — how to structure your integration
- **SDK code snippets** — ready-to-use code in Python and TypeScript
- **Webhook events** — which events to subscribe to
- **Estimated monthly credits** — cost projection based on expected volume
- **Suggested plan** — which subscription tier fits your usage

### Step 3: Sandbox Testing

Test the recommended configuration directly in the sandbox. All preset requests are pre-filled based on the AI's recommendations.

### Step 4: Deploy

Create your app with the configured settings. The wizard:
1. Creates the app with appropriate scopes
2. Generates your first API key
3. Sets up recommended webhooks
4. Provides a deployment checklist

---

## App Management

### App Status

| Status | Meaning |
|--------|---------|
| `active` | App is live, API keys work normally |
| `sandbox` | Testing mode, limited rate limits |
| `suspended` | Temporarily disabled (billing issue or abuse) |
| `archived` | Permanently disabled, data retained 30 days |

### API Key Management

Each app can have multiple API keys. Keys are scoped to the app's permissions.

**Create a key:**
```typescript
// Via the Integrations Hub UI or programmatically:
POST /v1/auth/keys
{
  "name": "Production v2",
  "keyType": "live",
  "rateLimitPerMinute": 120,
  "projectId": "your-app-id"
}
```

**Key lifecycle:**
- Keys are shown once at creation — store securely
- Revoke compromised keys immediately (cannot be undone)
- Create separate keys for production vs. staging
- Set IP allowlists for production keys

### Webhook Configuration

Receive real-time notifications when events occur in your app.

**Create a webhook:**

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Display name |
| URL | Yes | HTTPS endpoint (no private IPs) |
| Events | Yes | Which events to subscribe to |

**Available events:**
- `generation.completed` — Image/video/music generation finished
- `generation.failed` — Generation failed with error
- `credits.low` — Credits below 10% threshold
- `credits.depleted` — No credits remaining
- `key.used` — API key used from new IP
- `billing.charged` — Wallet charged for operation

**Testing webhooks:**
Use the **Test** button to send a synthetic event to your endpoint. Verify your signature verification logic works before going live.

### API Scopes

Apps have granular permission scopes that restrict what API keys can access:

| Scope | Allows |
|-------|--------|
| `images:generate` | Image generation (all models) |
| `images:edit` | Image editing (upscale, remove-bg, inpaint) |
| `video:generate` | Video generation (all models) |
| `audio:generate` | Music, SFX, and TTS generation |
| `audio:transcribe` | Speech-to-text transcription |
| `agents:run` | Execute agent workflows |
| `agents:manage` | Create/edit/delete workflows |
| `storage:read` | Read from S3 buckets |
| `storage:write` | Write to S3 buckets |
| `social:publish` | Publish to social platforms |
| `social:analytics` | Read social media analytics |
| `webhooks:manage` | Create/modify webhooks |
| `billing:read` | View billing and credit balance |

---

## Sandbox

The Sandbox is an isolated testing environment where you can make real API calls without affecting production data.

### Preset Requests

Quick-start with common API calls:

::: code-group

```json [Generate Image]
POST /v1/ai/generate/image
{
  "prompt": "Professional product photo of a leather bag on white background",
  "model": "seedream-5-0-260128",
  "aspect_ratio": "1:1"
}
```

```json [Remove Background]
POST /v1/ai/remove-background
{
  "image_url": "https://example.com/photo.jpg"
}
```

```json [List Models]
GET /v1/models
// No body required
```

```json [Check Balance]
GET /v1/billing/balance
// No body required
```

:::

### Response Inspector

For each request, the sandbox shows:
- **Status code** — color-coded (green 2xx, amber 4xx, red 5xx)
- **Response time** — in milliseconds
- **Response size** — payload bytes
- **Headers** — full response headers
- **Body** — formatted JSON with syntax highlighting

### Tips

- Sandbox uses your app's real API key — credits are consumed
- Use sandbox mode keys (`keyType: "test"`) for free testing with rate-limited responses
- Request history is stored per-session — export results for documentation
- Use the "Copy as cURL" button to reproduce requests in terminal

---

## Template Catalog

Pre-built integration patterns you can install and customize.

### Categories

| Category | Templates | Difficulty |
|----------|-----------|------------|
| E-commerce | Product photo pipeline, Catalog generator | Beginner–Intermediate |
| Agency | Social campaign builder, Client asset generator | Intermediate |
| SaaS | AI feature wrapper, Usage-based billing | Intermediate–Advanced |
| Media | Video production pipeline, Podcast workflow | Advanced |
| Custom | HTTP proxy, Webhook relay, Data pipeline | Varies |

### Using Templates

1. Browse the catalog and filter by use case
2. Click **Use** on a template
3. The wizard opens with the template's configuration pre-filled
4. Customize parameters for your needs
5. Deploy as a new app

### Template Properties

Each template includes:
- **Description** — what it does and when to use it
- **Difficulty** — beginner, intermediate, or advanced
- **Estimated time** — how long to integrate
- **Features** — key capabilities (tags)
- **Required APIs** — which endpoints it uses
- **Code examples** — ready-to-run Python and TypeScript

---

## Monitoring

Real-time observability for your integrations.

### Metrics Dashboard

Four key metrics at a glance:

| Metric | Description |
|--------|-------------|
| **Total Requests** | API calls in the last 30 days |
| **Avg Latency** | Mean response time across all endpoints |
| **Error Rate** | Percentage of 4xx/5xx responses |
| **Credits/Hour** | Average credit consumption rate |

### Traffic Chart

Visual representation of requests over the last 24 hours:
- **Purple bars** — successful requests
- **Red bars** — errors (4xx + 5xx)
- Hover for exact counts per time bucket
- Auto-refresh available (30-second interval)

### Service Status

Real-time health of all FOTOhub services:

| Service | Typical Latency | What It Covers |
|---------|-----------------|----------------|
| API Server | ~45ms | Core API routing, auth |
| Agent Engine | ~120ms | Workflow orchestration |
| Image Generation | ~2.1s | All image models |
| Video Generation | ~45s | Async video jobs |
| Audio Services | ~1.8s | Music, TTS, STT |
| Storage (S3) | ~35ms | Object storage operations |
| Webhooks | ~80ms | Event delivery |
| Cloud Compute | ~200ms | GPU instance management |
| Billing Engine | ~50ms | Credit deduction, wallet |

Each service shows:
- **Status** — operational / degraded / outage
- **Latency** — current response time
- **Health check** — green (healthy) / yellow (slow) / red (down)

---

## OAuth Connections

Connect external services to use in agent workflows and integrations.

### Supported Providers

| Provider | Capabilities |
|----------|-------------|
| **Google** | Photos, Drive, Calendar, Sheets, Gmail |
| **Slack** | Send messages, upload files |
| **Discord** | Send messages to channels |
| **Telegram** | Send notifications |
| **Notion** | Create pages, query databases |

### Setting Up a Connection

1. Go to your app's settings or the Agent Engine connections panel
2. Click **Add Connection**
3. Select the provider
4. Complete the OAuth flow (redirects to provider's auth page)
5. Grant permissions
6. Connection is stored securely (tokens in vault)

### Token Refresh

- **Google tokens** are automatically refreshed before expiration
- **Slack/Discord/Telegram** tokens are long-lived
- Connection health is checked periodically
- Failed connections show in Monitoring with error details

---

## Code Examples

### Python: Complete Integration Flow

```python
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_key_here")

# Generate product images
result = client.images.generate(
    prompt="Professional product photo of wireless headphones, white background, studio lighting",
    model="seedream-5-0-260128",
    aspect_ratio="1:1",
    num_images=4
)

for i, url in enumerate(result.images):
    print(f"Image {i+1}: {url}")

# Check credit usage
balance = client.billing.get_balance()
print(f"Credits remaining: {balance.credits.remaining}/{balance.credits.limit}")
print(f"Wallet: {balance.wallet.available_pln} PLN")
```

### TypeScript: Webhook Handler

```typescript
import crypto from "crypto";
import express from "express";

const app = express();
app.use(express.raw({ type: "application/json" }));

const WEBHOOK_SECRET = process.env.FOTOHUB_WEBHOOK_SECRET!;

app.post("/webhook", (req, res) => {
  // Verify signature
  const signature = req.headers["x-fotohub-signature"] as string;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(req.body)
    .digest("hex");

  if (!crypto.timingSafeEqual(
    Buffer.from(`sha256=${expected}`),
    Buffer.from(signature)
  )) {
    return res.status(401).send("Invalid signature");
  }

  const event = JSON.parse(req.body.toString());

  switch (event.type) {
    case "generation.completed":
      console.log(`Generation done: ${event.data.output_url}`);
      // Process the generated asset
      break;
    case "credits.low":
      console.log(`Low credits: ${event.data.credits_remaining}`);
      // Alert your team or auto-topup
      break;
  }

  res.status(200).send("OK");
});

app.listen(3000);
```

### Python: Sandbox-Style Testing

```python
import requests

BASE_URL = "https://apis.fotohub.app"
API_KEY = "fh_live_your_key_here"
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Test image generation
resp = requests.post(f"{BASE_URL}/v1/ai/generate/image", headers=headers, json={
    "prompt": "Test image",
    "model": "seedream-5-0-260128"
})
print(f"Status: {resp.status_code}")
print(f"Response: {resp.json()}")

# Test balance check
resp = requests.get(f"{BASE_URL}/v1/billing/balance", headers=headers)
print(f"Balance: {resp.json()}")

# Test model catalog
resp = requests.get(f"{BASE_URL}/v1/models")
models = resp.json()
print(f"Available models: {len(models)}")
```

### TypeScript: App with Rate Limiting

```typescript
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

class RateLimitedClient {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsThisMinute = 0;
  private readonly maxPerMinute = 60;

  async generate(prompt: string) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await client.images.generate({
            prompt,
            model: "seedream-5-0-260128"
          });
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      if (this.requestsThisMinute >= this.maxPerMinute) {
        await new Promise(r => setTimeout(r, 60_000));
        this.requestsThisMinute = 0;
      }
      const task = this.queue.shift()!;
      await task();
      this.requestsThisMinute++;
    }

    this.processing = false;
  }
}
```

---

## Best Practices

### Security

- **Rotate keys regularly** — create new keys and revoke old ones every 90 days
- **Use IP allowlists** — restrict production keys to your server IPs
- **Verify webhook signatures** — always check `X-FotoHub-Signature` before processing
- **Separate environments** — use different apps for development, staging, and production
- **Never expose keys in frontend** — API keys belong on your backend server only

### Performance

- **Cache model responses** — identical prompts produce different results, but model catalogs and pricing can be cached
- **Use webhooks over polling** — for async operations (video, long music), webhooks are more efficient
- **Batch where possible** — generate multiple images in one request (`num_images: 4`)
- **Choose models wisely** — `imagen-3-fast` (1 credit) vs `imagen-4-ultra` (5 credits) for different quality needs

### Cost Management

- **Set credit budgets per app** — prevent runaway spending
- **Monitor credits/hour** — use the Monitoring dashboard to spot anomalies
- **Subscribe to `credits.low` webhook** — get alerted before you run out
- **Use the billing estimate endpoint** — calculate costs before committing to batch operations

### Integration Architecture

- **Idempotent handlers** — webhook events may be delivered more than once
- **Graceful degradation** — handle 429 (rate limit) and 503 (service unavailable) with retries
- **Async for heavy work** — video generation takes 30-60s; use webhooks to get notified
- **Health checks** — poll `/health` to detect outages before your users do

---

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| 401 Unauthorized | Check API key format (`fh_live_...`), ensure key is active |
| 402 Payment Required | Credits depleted — top up via billing or upgrade plan |
| 403 Forbidden | Key lacks required scope for this endpoint |
| 429 Too Many Requests | Rate limit hit — reduce frequency or upgrade plan |
| 500 Server Error | Transient — retry with exponential backoff |
| Webhook not received | Check URL is HTTPS, publicly accessible, returns 200 within 5s |

### Debug Checklist

1. **Verify key works:** `GET /v1/billing/balance` with your key
2. **Check scopes:** Does your app have the required scope for this API?
3. **Check rate limits:** Are you exceeding your plan's requests/minute?
4. **Check credits:** Do you have enough credits for this operation?
5. **Check model availability:** `GET /v1/models` to see active models
6. **Check webhook logs:** View delivery logs in app detail → Webhooks tab

---

## API Reference

The Integrations Hub interacts with these API groups:

| API Group | Base Path | Auth | Documentation |
|-----------|-----------|------|---------------|
| AI Generation | `/v1/ai/generate/*` | API Key | [Image](/api/image-generation), [Video](/api/video-generation), [Music](/api/music-audio) |
| Chat / LLM | `/v1/ai/chat/*` | API Key | [Chat](/api/chat-llm) |
| Billing | `/v1/billing/*` | API Key / JWT | [Billing](/api/billing) |
| Webhooks | `/v1/console/webhooks` | JWT | [Webhooks](/api/webhooks) |
| Agent Workflows | `/engine/v1/*` | JWT / API Key | [Agents](/api/agents) |
| S3 Storage | `/v1/storage/s3/*` | JWT | [Storage](/api/storage) |
| Console | `/v1/console/*` | JWT | [Console](/api/console-api) |
| Auth / Keys | `/v1/auth/*` | JWT | [Console](/api/console-api) |
| Models Catalog | `/v1/models` | Public | [Models](/api/models) |
| System Health | `/health` | Public | — |

::: tip Full API Explorer
Use the built-in **API Docs** page at `/integrations-hub/docs` for interactive endpoint browsing with parameter details, request builders, and live response examples.
:::
