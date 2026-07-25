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
| **Wallet (PLN)** | Token-level billing after credits are exhausted | Pay-as-you-go, high-volume usage |

Credits are consumed first. When depleted, the system falls back to wallet billing automatically — no interruption.

### Credit Costs by Category

| Category | Range | Example |
|----------|-------|---------|
| Image generation | 1-5 credits | seedream-5-0-260128 = 2 credits |
| Video generation | 8-15 credits (per 5s) | wan-video = 8 credits/5s |
| Chat / text | 1-2 credits | gemini-flash = 1 credit |
| Audio / TTS | 1-3 credits | IDA Voice = 1 credit |
| Music generation | 3-8 credits | music generation = 3 credits |

### Wallet (Token-Based) Pricing

When credits are exhausted, each operation is billed per token in PLN:

| Model tier | Input (PLN/1M tokens) | Output (PLN/1M tokens) |
|-----------|----------------------|----------------------|
| Economy (Haiku-class) | 1.00 | 5.00 |
| Standard (Sonnet-class) | 12.00 | 60.00 |
| Premium (Opus-class) | 60.00 | 300.00 |
| Image models | — | 0.20 - 1.50 per image |
| Video models | — | 0.50 - 5.00 per second |

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
  → wan-video (8 credits / 5s)
Budget-conscious bulk video?
  → hailuo (8 credits / 5s)
Production quality?
  → veo-2 (10 credits / 5s), kling (10 credits / 5s), or seedance (10 credits / 5s)
Longer clips (up to 60s)?
  → sora-2 (12 credits / 5s)
Maximum cinematic quality (with audio)?
  → veo-3 (15 credits / 5s)
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

## Gabriel Auto-Routing (Recommended)

Gabriel is FOTOhub's AI router. Instead of choosing a model yourself, describe your intent and Gabriel picks the optimal model for cost/quality.

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub()

# Gabriel picks the best model for the task
response = client.chat(
    message="Summarize this article in 3 bullet points: ...",
    routing="auto",  # Gabriel decides
)

# Check which model was selected
print(f"Model used: {response.model}")
print(f"Cost: {response.usage.cost_pln} PLN")
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

const response = await client.chat({
  message: "Summarize this article in 3 bullet points: ...",
  routing: "auto",
});

console.log(`Model: ${response.model}`);
console.log(`Cost: ${response.usage.costPln} PLN`);
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
        "message": "Summarize this article in 3 bullet points: ...",
        "routing": "auto",
    }
    body, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/chat", bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    req.Header.Set("Content-Type", "application/json")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    fmt.Printf("Model: %s\n", result["model"])
}
```
```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/chat \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Summarize this article in 3 bullet points: ...",
    "routing": "auto"
  }'
```
:::

### Routing Modes

| Mode | Behavior | Typical savings |
|------|----------|----------------|
| `auto` | Gabriel picks best model for task | 40-60% vs always using premium |
| `economy` | Force cheapest capable model | 70-80% savings |
| `quality` | Force highest quality model | 0% (premium pricing) |
| `balanced` | Middle ground | 20-30% savings |

---

## Batch Processing Savings

Processing multiple items together reduces overhead and enables bulk discounts.

### Concurrent Generation

::: code-group
```python [Python]
import asyncio
from fotohub import FotoHub

client = FotoHub()

async def batch_generate(prompts: list[str]):
    """Generate images concurrently — 40% faster than sequential."""
    tasks = [
        client.async_generate_image(
            prompt=p,
            model="seedream-5-0-260128",
        )
        for p in prompts
    ]
    results = await asyncio.gather(*tasks)
    return results

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

### Batch Pricing Tiers

| Monthly volume (PLN) | Discount |
|---------------------|----------|
| 0 - 100 | Standard pricing |
| 100 - 500 | 5% discount |
| 500 - 2,000 | 10% discount |
| 2,000+ | 15% discount (contact sales) |

---

## Top-Up Bonuses

Wallet top-ups include bonus credits:

| Top-up amount | Bonus | Effective rate |
|--------------|-------|---------------|
| 50 PLN | +5 PLN | 10% bonus |
| 100 PLN | +15 PLN | 15% bonus |
| 200 PLN | +40 PLN | 20% bonus |
| 500 PLN | +125 PLN | 25% bonus |

::: tip
The 500 PLN tier gives 625 PLN effective balance — the best per-unit rate. If you expect to spend more than 200 PLN/month, top up in larger amounts.
:::

---

## Monitoring Spending

### Real-Time Usage Dashboard

Check current spend at [fotohub.app/billing/usage](https://fotohub.app/billing/usage):

- Daily/weekly/monthly breakdown by category
- Per-model cost analysis
- Credit remaining vs. wallet usage ratio

### Programmatic Usage Check

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub()

usage = client.get_usage(period="current_month")
print(f"Credits used: {usage.credits_used}/{usage.credits_total}")
print(f"Wallet spent: {usage.wallet_spent_pln} PLN")
print(f"Top model: {usage.top_models[0].name} ({usage.top_models[0].cost_pln} PLN)")
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

const usage = await client.getUsage({ period: "current_month" });
console.log(`Credits: ${usage.creditsUsed}/${usage.creditsTotal}`);
console.log(`Wallet: ${usage.walletSpentPln} PLN`);
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
    req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/billing/usage?period=current_month", nil)
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()

    var usage map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&usage)
    fmt.Printf("Credits used: %v\n", usage["credits_used"])
    fmt.Printf("Wallet spent: %v PLN\n", usage["wallet_spent_pln"])
}
```
```bash [cURL]
curl -s https://apis.fotohub.app/v1/billing/usage?period=current_month \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" | jq .
```
:::

### Budget Alerts via Webhooks

Set up automatic alerts when spending thresholds are reached:

```python
# Configure in console or via API
client.set_budget_alert(
    threshold_pln=100,
    action="webhook",
    webhook_url="https://your-app.com/alerts/budget",
)
```

Events emitted: `credits.low`, `credits.depleted`, `budget.threshold_reached`

See the [Webhooks Guide](/guides/webhooks) for full integration details.

---

## Cost Optimization Strategies

### 1. Use Gabriel Routing for Chat

Never hardcode a premium model for simple tasks. Gabriel routes 70% of typical queries to economy models with no quality loss.

### 2. Cache Repeated Generations

If you generate similar images repeatedly (e.g., product variants), use `seed` to get deterministic results and cache URLs.

### 3. Start with Lite Models

For video, always prototype with `wan-video` (8 credits / 5s) before committing to `veo-3` (15 credits / 5s).

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
| Social video | wan-video (8 cr / 5s) | veo-3 (15 cr / 5s) | 47% |
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
