# Cost Optimization Guide

Maximize output quality while minimizing spend. This guide covers model selection strategies, billing mechanics, batch savings, and monitoring tools.

::: info Key Takeaway
FOTOhub uses a **credit + wallet** hybrid billing system. Credits from your plan are consumed first (fixed cost per operation), then wallet balance is charged at token-level granularity. Choosing the right model for each task can reduce costs by 60-80% without sacrificing quality.
:::

---

## Billing Model Overview

FOTOhub has two billing layers:

| Layer | How it works | Best for |
|-------|-------------|----------|
| **Credits** | Fixed cost per operation (e.g., 1 credit = 1 image) | Predictable budgets, included in plans |
| **Wallet (USD)** | Token-level billing after credits are exhausted | Pay-as-you-go, high-volume usage |

Credits are consumed first. When depleted, the system falls back to wallet billing automatically — no interruption.

### Credit Costs by Category

| Category | Range | Example |
|----------|-------|---------|
| Image generation | 1-5 credits | seedream-5-0-260128 = 2 credits |
| Video generation | 8-15 credits (per 5s) | wan2.2-t2v-plus = 6 credits/5s |
| Chat / text | 1-2 credits | gemini-flash = 1 credit |
| Audio / TTS | 1-3 credits | IDA Voice = 1 credit |
| Music generation | 3-8 credits | music generation = 3 credits |

### Wallet (Token-Based) Pricing

When credits are exhausted, each operation is billed from your USD wallet:

| Model tier | Input (USD/1M tokens) | Output (USD/1M tokens) |
|-----------|----------------------|----------------------|
| Economy (Haiku-class) | $1.20 | $6.00 |
| Standard (Sonnet-class) | $4.50 | $22.50 |
| Premium (Opus-class) | $22.50 | $112.50 |
| Image models | — | $0.02 – $0.24 per image |
| Video models | — | $0.06 – $0.64 per second |

Rates include the platform margin. Per-model prices are returned live by
`GET /v1/models` and `GET /v1/billing/pricing`, both in USD.

---

## Model Selection Decision Tree

Use the cheapest model that meets your quality threshold:

### Image Generation

```
Need photorealistic text rendering?
  → flux-2-pro (2.0 credits)
Need general purpose, fast?
  → seedream-5-0-260128 (2.0 credits)   ← DEFAULT
Need multi-image compose / virtual try-on?
  → grok-imagine-image-pro (3.0 credits)
Budget generation (fastest / cheapest)?
  → flux-2-klein-4b (1.0 credits) or minimax-image-01 (1.0 credits)
Need maximum detail (4K)?
  → imagen-4-ultra (5.0 credits)
Need premium quality?
  → imagen-4-standard (3.0 credits)
```

### Video Generation

```
Quick preview / prototype?
  → wan2.2-t2v-plus (6 credits / 5s)
Budget-conscious bulk video?
  → hailuo-o2 (8 credits / 5s)
Production quality?
  → veo-2.0-generate-001 (155 credits / 5s), kling-v3 (25 credits / 5s), or seedance-2-0-pro (47 credits / 5s)
Longer clips (up to 60s)?
  → sora-2 (12 credits / 5s)
Maximum cinematic quality (with audio)?
  → veo-3.1-generate-001 (60 credits / 5s)
```

### Chat / Text AI

```
Simple classification / extraction?
  → Gabriel auto-routing (picks cheapest capable model)
Creative writing / complex reasoning?
  → Gabriel with quality=high
Bulk summarization?
  → Gabriel with quality=economy
```

---

## Gabriel Model Selection

Gabriel is FOTOhub's model router. It does **not** run the generation for you —
`POST /v1/ai/gabriel` classifies your intent and returns a routing *decision*
(which endpoint and model to use, plus a credit estimate). You then call that
endpoint yourself. Ask Gabriel first when you don't know which model is cheapest
for a task; skip it when you already do, since the extra round trip buys nothing.

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub()

decision = client.gabriel_classify(
    "Summarize this article in 3 bullet points: ...",
    language="en",
)

print(decision["action"])            # "route" | "answer" | "workflow" | "error"
print(decision.get("target"))        # e.g. "/generate/new"
print(decision.get("model_selected"))
print(decision.get("credits_estimated"))
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

const decision = await client.gabrielClassify({
  prompt: "Summarize this article in 3 bullet points: ...",
  language: "en",
});

console.log(decision.action, decision.target);
console.log(decision.model_selected, decision.credits_estimated);
```
```go [Go]
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
)

func main() {
    payload := map[string]interface{}{
        "prompt":   "Summarize this article in 3 bullet points: ...",
        "language": "en",
    }
    body, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/gabriel", bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    req.Header.Set("Content-Type", "application/json")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    fmt.Printf("action=%v model=%v credits=%v\n",
        result["action"], result["model_selected"], result["credits_estimated"])
}
```
```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/gabriel \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Summarize this article in 3 bullet points: ...",
    "language": "en"
  }'
```
:::

::: warning There are no routing modes
Earlier revisions of this page documented a `routing` parameter with `auto` /
`economy` / `quality` / `balanced` modes and quoted savings percentages for each.
No such parameter exists on any endpoint. The request body is `prompt`,
`language`, `context` and `enhance_prompt` — nothing else. Cost control comes
from picking a cheaper model ID yourself (see the tables above), not from a
routing mode.

Related endpoints: `POST /v1/ai/gabriel/stream` (same decision, streamed as SSE),
`POST /v1/ai/gabriel/suggest` (autocomplete, unauthenticated) and
`POST /v1/ai/gabriel/recommend`.
:::

::: tip Gabriel is currently free
`/v1/ai/gabriel` enforces tier access but contains no billing call, so
classification does not consume credits today. The public catalogue lists
`gabriel_classify` at 1 credit, so treat free calls as subject to change and do
not build a cost model that depends on it.
:::

---

## Batch Processing Savings

Processing multiple items together reduces overhead and enables bulk discounts.

### Concurrent Generation

::: code-group
```python [Python]
import asyncio
from fotohub import AsyncFotoHub

# Concurrency needs the async client. There is no async_generate_image() method
# on the sync FotoHub class -- AsyncFotoHub.generate_image() is awaitable.
async def batch_generate(prompts: list[str]):
    """Generate images concurrently — the calls overlap instead of queueing."""
    async with AsyncFotoHub() as client:
        tasks = [
            client.generate_image(prompt=p, model="seedream-5-0-260128")
            for p in prompts
        ]
        # return_exceptions keeps one content-policy rejection from
        # discarding the images that did succeed (and were billed).
        return await asyncio.gather(*tasks, return_exceptions=True)

prompts = [
    "Product photo: wireless headphones, white background",
    "Product photo: smart watch, white background",
    "Product photo: phone case, white background",
]

results = asyncio.run(batch_generate(prompts))
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

const prompts = [
  "Product photo: wireless headphones, white background",
  "Product photo: smart watch, white background",
  "Product photo: phone case, white background",
];

// Generate all concurrently
const results = await Promise.allSettled(
  prompts.map((prompt) =>
    client.generateImage({ prompt, model: "seedream-5-0-260128" })
  )
);

const successful = results.filter((r) => r.status === "fulfilled");
console.log(`${successful.length}/${prompts.length} succeeded`);
```
```go [Go]
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
    "sync"
)

func generateImage(prompt string, wg *sync.WaitGroup, results chan<- string) {
    defer wg.Done()
    payload, _ := json.Marshal(map[string]string{
        "prompt": prompt,
        "model":  "seedream-5-0-260128",
    })
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/image", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    req.Header.Set("Content-Type", "application/json")
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    results <- fmt.Sprintf("%v", result)
}

func main() {
    prompts := []string{
        "Product photo: wireless headphones, white background",
        "Product photo: smart watch, white background",
        "Product photo: phone case, white background",
    }

    var wg sync.WaitGroup
    results := make(chan string, len(prompts))

    for _, p := range prompts {
        wg.Add(1)
        go generateImage(p, &wg, results)
    }
    wg.Wait()
    close(results)

    for r := range results {
        fmt.Println(r)
    }
}
```
```bash [cURL]
# Parallel generation with xargs (4 concurrent)
echo "wireless headphones
smart watch
phone case" | xargs -P 4 -I {} curl -s -X POST \
  https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Product photo: {}, white background", "model": "seedream-5-0-260128"}'
```
:::

### Volume Savings

There is no automatic monthly-volume discount. Volume savings come from two
places instead: larger top-up packages carry more bonus credits (see below),
and Enterprise contracts are priced individually — [contact sales](mailto:sales@fotohub.app).

---

## Top-Up Bonuses

Wallet top-ups add USD to your balance **and** grant bonus credits on top:

| Package slug | Amount | Bonus credits | Bonus % |
|-------------|--------|---------------|---------|
| `topup-50` | $15 | +100 | 0% |
| `topup-100` | $25 | +250 | 5% |
| `topup-250` | $60 | +700 | 10% |
| `topup-500` | $120 | +1,500 | 15% |
| `topup-1000` | $225 | +3,500 | 20% |
| `topup-5000` | $1,000 | +20,000 | 25% |

::: warning Slug names are historical
The slugs still read `topup-50` … `topup-5000` from the pre-USD pricing and no
longer match the amount. Always send the **slug**, and read the amount from
`GET /v1/billing/topup/packages` (`amount_usd`) rather than parsing it out of
the slug.
:::

::: tip
`topup-5000` carries the best bonus rate. `topup-500` ($120) also unlocks the
Pay-As-You-Go Premium tier, which raises your rate limit to 500 req/min.
:::

---

## Monitoring Spending

### Real-Time Usage Dashboard

Check current spend at [fotohub.app/billing/usage](https://fotohub.app/billing/usage):

- Daily/weekly/monthly breakdown by category
- Per-model cost analysis
- Credit remaining vs. wallet usage ratio

### Programmatic Usage Check

::: warning `GET /v1/usage`, no SDK helper, no `period` parameter
The endpoint is `GET /v1/usage` — `/v1/billing/usage` does not exist (`404`).
Neither SDK wraps it: there is no `get_usage()` in Python nor `getUsage()` in
TypeScript, so call it over plain HTTP.

It always returns a fixed **last-30-days** window; `period` is not read. The
response is `{subscription, keys, totals, daily, topEndpoints, topModels,
latestEvents}`, where `totals.currency` is a list of `{currency, amount}` pairs
because rows written before the USD cutover are still stored in PLN.
:::

::: code-group
```python [Python]
import os

import requests

usage = requests.get(
    "https://apis.fotohub.app/v1/usage",
    headers={"Authorization": f"Bearer {os.environ['FOTOHUB_API_KEY']}"},
    timeout=30,
).json()

print(f"Requests (30d): {usage['totals']['totalRequests']}")
print(f"Tokens (30d): {usage['totals']['totalTokens']}")
for row in usage["totals"]["currency"]:
    print(f"Spent: {row['amount']} {row['currency']}")
if usage["topModels"]:
    top = usage["topModels"][0]
    print(f"Top model: {top['modelId']} ({top['count']} calls)")
```
```typescript [TypeScript]
const res = await fetch("https://apis.fotohub.app/v1/usage", {
  headers: { Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}` },
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const usage = await res.json();

console.log(`Requests (30d): ${usage.totals.totalRequests}`);
for (const row of usage.totals.currency) {
  console.log(`Spent: ${row.amount} ${row.currency}`);
}
```
```go [Go]
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
    "os"
)

func main() {
    req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/usage", nil)
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()

    var usage map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&usage)
    totals := usage["totals"].(map[string]interface{})
    fmt.Printf("Requests: %v\n", totals["totalRequests"])
    fmt.Printf("Spend by currency: %v\n", totals["currency"])
}
```
```bash [cURL]
curl -s https://apis.fotohub.app/v1/usage \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" | jq .
```
:::

### Budget Alerts via Webhooks

Set up automatic alerts when spending thresholds are reached:

```python
# Cap monthly wallet overage (USD). Charges beyond this return HTTP 402.
client.set_overage_limit(25)  # $25 per calendar month
```

Events emitted: `credits.low` (credits exhausted, falling back to the wallet),
`credits.depleted` (wallet could not cover the charge) and `billing.charged`
(a wallet charge succeeded, with `amount_usd`).

See the [Webhooks Guide](/guides/webhooks) for full integration details.

---

## Cost Optimization Strategies

### 1. Use Gabriel Routing for Chat

Never hardcode a premium model for simple tasks. Gabriel routes 70% of typical queries to economy models with no quality loss.

### 2. Cache Repeated Generations

If you generate similar images repeatedly (e.g., product variants), use `seed` to get deterministic results and cache URLs.

### 3. Start with Lite Models

For video, always prototype with `wan2.2-t2v-plus` (6 credits / 5s) before committing to `veo-3.1-generate-001` (60 credits / 5s).

### 4. Use Appropriate Resolution

- Thumbnails: 512x512 (cheapest)
- Social media: 1024x1024 (standard)
- Print: 2048x2048 (premium cost)

### 5. Batch During Off-Peak

Queues are shorter during off-peak hours (02:00-08:00 CET), resulting in faster processing and fewer timeouts (which waste credits on retries).

### 6. Monitor and Adjust

Review your usage weekly. The top 3 models by spend are usually where optimization has the biggest impact.

---

## Cost Comparison Table

| Task | Cheap option | Premium option | Savings |
|------|-------------|---------------|---------|
| Product photo | flux-2-klein-4b (1 cr) | imagen-4-ultra (5 cr) | 80% |
| Social video | wan2.2-t2v-plus (6 cr / 5s) | veo-3.1-generate-001 (60 cr / 5s) | 90% |
| Chat summary | gemini-flash (1 cr) | claude-sonnet (2 cr) | 50% |
| TTS narration | IDA Voice (1 cr) | — | — |
| Bulk 100 images | 100 credits | 500 credits (premium) | 80% |

---

## Related

- [Pricing Details](/guides/pricing)
- [Token Billing Explained](/guides/token-billing)
- [Batch Processing Guide](/guides/batch-processing)
- [Gabriel Chat Guide](/api/chat-llm)
- [Webhooks for Budget Alerts](/guides/webhooks)
