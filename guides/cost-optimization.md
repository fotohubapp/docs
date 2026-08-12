# Cost Optimization Guide

Maximize output quality while minimizing spend. This guide covers model selection strategies, billing mechanics, batch savings, and monitoring tools.

::: info Key Takeaway
The API is **prepaid USD from a wallet**. There is one billing layer, not two:
every request is priced in dollars at the provider's own rate and deducted from
your balance. Credits belong to a fotohub.app subscription and cannot pay for API
usage. Choosing the right model per task cuts spend 60-80% with no quality loss.
:::

---

## Billing Model Overview

One wallet, one currency, no invoice at month end:

```
Wallet balance ($) − price of each request = remaining balance
```

| | |
|-|-|
| **Currency** | USD only. No PLN, no FX conversion at request time. |
| **Model** | Prepaid. You cannot spend money you have not deposited. |
| **Empty wallet** | `402 insufficient_funds` before the provider is called. Nothing is charged. |
| **Margin** | `1.0` today — prices are the provider's own rate, 1:1. |
| **Precision** | 6 decimal places, so a cheap request can legitimately cost $0.000398. |

Credits cannot pay for any of it. An account holding 5 000 credits and $0.00 in
its wallet gets a 402 on every call — `GET /v1/billing/balance` returns
`billing_model: "prepaid_wallet_usd"` and no credit field at all.

### The meter differs by category

You cannot infer the unit from the model name, so `GET /v1/pricing` publishes it
per model:

| Category | Meter | Typical range |
|----------|-------|---------------|
| Image generation | per delivered image | $0.015 – $0.24 |
| Video generation | per second of output | $0.017 – $0.70/s |
| Seedance video | per 1000 **output** tokens | $0.0012 – $0.0107 |
| Chat / LLM | per 1M tokens, in and out rated separately | $0.30 – $15.00 / 1M |
| TTS | per 1000 characters | $0.015 – $0.03 |
| Transcription, music, audio | per minute | $0.001 – $0.08 |
| Storage | per GB-month, accrued hourly | $0.0245 |

Every entry also carries `verified`: `true` means the figure came off the
provider's own price list or invoice, `false` means it is our recorded copy and
has not been reconciled against one. `GET /v1/pricing/audit` lists which is which.

---

## Model Selection Decision Tree

Use the cheapest model that meets your quality threshold:

### Image Generation

```
Need photorealistic text rendering?
  → flux-2-pro ($0.03 at 1K — but $0.255 at 4K, so send image_size)
Need general purpose, fast?
  → seedream-5-0-260128 ($0.0315, flat at every resolution)   ← DEFAULT
Need multi-image compose / virtual try-on?
  → grok-imagine-image-pro ($0.05 at 1K, $0.07 above)
Budget generation (fastest / cheapest)?
  → flux-2-klein-4b ($0.015005) or minimax-image-01 ($0.03)
Need maximum detail?
  → imagen-4-ultra ($0.160772)
Need premium quality?
  → imagen-4-standard ($0.080386)
```

### Video Generation

Prices are per second, so the clip length is a multiplier — and the duration you
send is snapped to what the model renders before it is billed.

```
Quick preview / prototype?
  → wan2.2-t2v-plus ($0.02/s → $0.10 for 5s)
Budget-conscious bulk video?
  → hailuo-o2 ($0.017/s, but its shortest render is 6s → $0.102)
Production quality?
  → veo-3.1-lite-generate-001 ($0.03/s → $0.15)
    kling-v3 ($0.077/s → $0.385)
    seedance-2-0-pro ($0.7623 for 5s at 720p, token-priced)
Longest single clip?
  → seedance-2-5 (up to 30s; $6.94 at 720p, $3.09 at 480p)
Maximum cinematic quality, native audio?
  → veo-3.1-generate-001 ($0.20/s → $1.00 for 5s, $1.60 for its 8s maximum)
```

No video model renders 60 seconds. Veo caps at 8s, Kling/Hailuo/Wan at 10s,
Sora 2 at 12s (`sora-2-pro` 25s), Grok at 15s, and only `seedance-2-5` reaches 30s.

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
(which endpoint and model to use). You then call that endpoint yourself. Ask
Gabriel first when you don't know which model is cheapest for a task; skip it when
you already do, since the extra round trip buys nothing.

::: danger Do not price anything from `credits_estimated`
The response still carries a `credits_estimated` field. **Ignore it.** It is a
leftover from consumer-web credit pricing, its numbers are stale, and the API does
not bill in credits at all. Price the model Gabriel picked with
`GET /v1/pricing?model=<id>` and nothing else. The field survives only because
published SDKs type it as non-optional; it will be removed after a deprecation
window.
:::

::: code-group
```python [Python]
import os

import requests
from fotohub import FotoHub

client = FotoHub()

decision = client.gabriel_classify(
    "Summarize this article in 3 bullet points: ...",
    language="en",
)

print(decision["action"])            # "route" | "answer" | "workflow" | "error"
print(decision.get("target"))        # e.g. "/generate/new"
print(decision.get("model_selected"))

# Then price what it chose — do NOT read credits_estimated.
price = requests.get(
    "https://apis.fotohub.app/v1/pricing",
    params={"model": decision["model_selected"]},
    headers={"Authorization": f"Bearer {os.environ['FOTOHUB_API_KEY']}"},
    timeout=30,
).json()
print(price["legs"]["output"])       # {"unit": ..., "price_usd": ...}
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

const decision = await client.gabrielClassify({
  prompt: "Summarize this article in 3 bullet points: ...",
  language: "en",
});

console.log(decision.action, decision.target);
console.log(decision.model_selected);

// Then price what it chose — do NOT read credits_estimated.
const res = await fetch(
  `https://apis.fotohub.app/v1/pricing?model=${decision.model_selected}`,
  { headers: { Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}` } },
);
const price = await res.json();
console.log(price.legs.output); // { unit, price_usd }
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
    // Price the chosen model with GET /v1/pricing?model=... — the
    // credits_estimated field in this response is stale and must not be used.
    fmt.Printf("action=%v model=%v\n",
        result["action"], result["model_selected"])
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
`/v1/ai/gabriel` enforces rate limits but contains no billing call, so a
classification costs **$0.00** and your wallet is untouched. It still consumes your
rate limit. The routing model does cost us tokens, so treat free as subject to
change rather than a guarantee — don't build a cost model that depends on
unlimited free classification.
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

There is no volume discount and no bonus on a top-up: **$25 deposited is $25
spendable**, at every package size. What a larger balance does buy is throughput —
the pay-as-you-go tiers activate off wallet balance or lifetime spend, with no
subscription — and Enterprise contracts, which are priced individually
([contact sales](mailto:sales@fotohub.app)).

---

## Top-Up Packages

`GET /v1/billing/topup/packages` is the authoritative list:

| Package slug | Amount credited | Unlocks |
|-------------|----------------:|---------|
| `topup-50` | $15 | — |
| `topup-100` | $25 | PAYG Standard: 120 rpm, 10 concurrent jobs, 100 MB uploads |
| `topup-250` | $60 | (Standard) |
| `topup-500` | $120 | PAYG Premium: 500 rpm, 30 concurrent jobs, 500 MB uploads |
| `topup-1000` | $225 | (Premium) |
| `topup-5000` | $1,000 | (Premium) |

The two thresholds are $25 and $120 of balance, and the package amounts land
exactly on them — `topup-100` puts you in Standard, `topup-500` in Premium. A
lifetime spend of $50 or $500 reaches the same tiers without holding the balance.

::: warning Slug names are historical, and there is no bonus
The slugs still read `topup-50` … `topup-5000` from the pre-USD pricing and no
longer match the amount — send the **slug** and read `amount_usd` from the
packages endpoint rather than parsing the number out of the slug.

Earlier revisions of this page advertised bonus credits ("+250 credits, 5%") per
package. That grant never existed: the checkout wrote it into Stripe metadata and
the webhook credited only the dollar amount, so a $15 top-up has always added
exactly $15. The claim has been removed rather than corrected, because there are no
credits in this product to grant. If volume pricing returns it will be extra
**dollars** on the balance.
:::

---

## Monitoring Spending

### Real-Time Usage Dashboard

Check wallet balance and spend in the [console](https://fotohub.app/console/wallet):

- Balance, top-up history and the ledger entry behind every charge
- Spend by day and by model, in USD
- Any monthly spend cap you have set, and how much of it is used

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

The wallet balance is already a hard ceiling, but you can set a lower monthly one —
useful for a shared key or an experiment you do not want draining a funded account:

```python
# Cap spend for the calendar month (USD). Requests past it return HTTP 402
# with code "spend_limit_reached" — distinct from insufficient_funds, because
# topping up will not clear it.
client.set_overage_limit(25)  # $25 per calendar month

client.set_overage_limit(0)   # 0 or None disables the cap
```

Subscribe to these to hear about money moving:

| Event | Fires when |
|-------|-----------|
| `billing.charged` | A charge settled. Carries the USD amount. |
| `billing.refunded` | A charge was reversed. |
| `billing.insufficient_funds` | A request was refused. Carries `required_usd` and `balance_usd`, so this is your low-balance alarm. |
| `generation.refunded` | A failed job's charge went back to the wallet. Reconciles against the `billing.charged` that preceded it. |

Take `billing.charged` **and** its reversals, not just the first: a ledger built on
debits alone over-counts spend on every failed job. `credits.low` and
`credits.depleted` are also subscribable but belong to fotohub.app subscriptions —
the API never emits them.

See the [Webhooks Guide](/guides/webhooks) for full integration details.

---

## Cost Optimization Strategies

### 1. Ask Gabriel which model, don't hardcode a premium one

Gabriel is free and returns a routing *decision*, not a generation — so the pattern
is `POST /v1/ai/gabriel` to pick the model, `GET /v1/pricing?model=<id>` to price it,
then call the generation endpoint yourself. That costs one free round trip and saves
you from defaulting to `claude-sonnet` for a classification `gemini-flash` does for
6x less. Skip it when you already know the model — it buys nothing then.

### 2. Reuse results instead of regenerating

`seed` is accepted on the image routes and forwarded to the provider, so the same
prompt plus the same seed gives you a repeatable render. Store the returned URL
against `(prompt, model, seed)` and serve the stored one: a cache hit costs $0.00,
and re-running a `seedream-5-0-260128` render you already have costs $0.0315 to get
the same picture back.

Note the asymmetry when you build that cache: image URLs are durable, while **video
and audio URLs are signed and expire after one hour**. Cache the media, or the
`job_id`, not the video URL.

### 3. Start with Lite Models

For video, always prototype with `wan2.2-t2v-plus` ($0.10 for 5s) before committing
to `veo-3.1-generate-001` ($1.00 for 5s). Ten Wan previews cost the same as one Veo
clip, so the draft pass is effectively free next to the final render.

### 4. Send the resolution you want

Twelve image models and `sora-2-pro` price **per resolution**, and this is a real
trap: omitting the field bills the **top** tier, not the cheapest one. A 1K
`flux-2-pro` render is $0.03 with `image_size` set and $0.255 without it — an 8.5x
step for a field you forgot. `sora-2-pro` behaves the same way: $0.30/s at 720p,
$0.70/s at 1080p, and 1080p is what you get by default.

Everything else is flat-rated: `seedream-5-0-260128` is $0.0315 at every resolution,
`imagen-4-ultra` $0.160772 at every resolution. Sending `image_size` to a flat model
costs nothing and saves you from remembering which is which. Seedance video is a
third case — resolution feeds the **token count** rather than a rate tier, so a 720p
clip is genuinely ~2x a 480p one.

### 5. Batch During Off-Peak

Queues are shorter during off-peak hours (02:00-08:00 CET), resulting in faster
processing and fewer timeouts. A timed-out job is refunded, but the retry is a new
charge, so fewer retries is less spend.

### 6. Monitor and Adjust

Review your usage weekly and start with whatever you call most. Note that
`GET /v1/usage` ranks `topModels` by **call count, not spend** — five `veo-3.1`
renders outspend a thousand `gemini-flash` calls, so multiply each model's count by
its rate before deciding where to optimise. `latestEvents[].cost` carries the per-call
amount, and the [console](https://fotohub.app/console/wallet) breaks spend down by
model directly.

---

## Cost Comparison Table

Same job, cheapest model that does it against the premium one. Every figure is USD
off `GET /v1/pricing`.

| Task | Cheap option | Premium option | Saving |
|------|-------------|---------------|-------:|
| Product photo | `flux-2-klein-4b` $0.015005 | `imagen-4-ultra` $0.160772 | 91% |
| Product photo, good default | `seedream-5-0-260128` $0.0315 | `gemini-3-pro-image` $0.134 | 76% |
| Social video, 5s | `wan2.2-t2v-plus` $0.10 | `veo-3.1-generate-001` $1.00 | 90% |
| Seedance clip, 5s | `seedance-2-0-mini` $0.38115 (720p) | `seedance-2-5` $1.16523 (720p) | 67% |
| Chat summary (75 in / 150 out) | `gemini-flash` $0.000398 | `claude-sonnet` $0.002475 | 84% |
| TTS, 1000 characters | `tts-google` / `tts-azure` $0.015 | `tts-elevenlabs` $0.03 | 50% |
| Bulk 100 images | $1.50 on `flux-2-klein-4b` | $16.08 on `imagen-4-ultra` | 91% |

The "premium option" column is not a warning — `imagen-4-ultra` earns its price on a
hero shot. The point is that the whole batch rarely needs it, and the spread between
the two columns is roughly 10x on images and video, so choosing per-asset instead of
per-project is where the money is.

---

## Related

- [Pricing Details](/guides/pricing)
- [Token Billing Explained](/guides/token-billing)
- [Batch Processing Guide](/guides/batch-processing)
- [Gabriel Chat Guide](/api/chat-llm)
- [Webhooks for Budget Alerts](/guides/webhooks)
