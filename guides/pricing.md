# Pricing & Cost Optimization

Understand how FOTOhub API pricing works and how to minimize costs for your use case.

## How Billing Works

The API is **prepaid, in US dollars**. You top up a wallet, every request is
priced in USD and deducted from that balance, and when the balance cannot cover a
request the API refuses it with `402` and charges nothing.

```
Wallet balance ($) − price of each request = remaining balance
```

Three things follow from that, and they surprise people coming from the web app:

- **Credits cannot pay for API usage.** Credits belong to a fotohub.app
  subscription. An account holding 5 000 credits and $0.00 in its wallet gets a
  402 on every API call. `GET /v1/billing/balance` returns
  `billing_model: "prepaid_wallet_usd"` and no credit field at all.
- **There is no invoice at the end of the month and no overage credit line.** You
  cannot spend money you have not already deposited.
- **Prices are the provider's own rate, 1:1.** The margin multiplier is `1.0`
  today, and every response that quotes a price also returns
  `provider_cost_usd` beside it so you can check that yourself.

Prices are held to 6 decimal places, so a single cheap request can legitimately
cost $0.000398.

### Reading a price

`GET /v1/pricing` publishes every rate, and each one carries the **unit** it is
denominated in — you cannot infer the meter from the model name:

| Unit | Applies to |
|------|-----------|
| `per_second` | most video models |
| `per_1k_tokens` | Seedance video, and chat when quoted per 1K |
| `per_1m_tokens` | chat / LLM |
| `per_piece` | images |
| `per_1k_chars` | text-to-speech |
| `per_minute` | transcription, music, audio |
| `per_gb_month` | storage |

Each entry also carries `verified`. `true` means the figure was read off the
provider's own price list or invoice; `false` means it is our recorded copy of
their published rate and has not been reconciled against an invoice.
`GET /v1/pricing/audit` lists which models are in which bucket.

::: warning `/v1/pricing` is the authoritative source
`GET /v1/models` also returns a `request_price` field per model, but that figure
can lag behind what you are actually billed — treat `GET /v1/pricing` as the source
of truth and `/v1/models` as a catalog listing only, not a price quote.
:::

## Image Generation Costs

Charged per delivered image. Models marked with a range charge per resolution —
pass `image_size` and you are billed that tier, not the highest one.

| Model | 1K | 2K | 4K |
|-------|---:|---:|---:|
| `flux-2-klein-4b` | $0.015005 | $0.015005 | $0.015005 |
| `grok-imagine-image` | $0.02 | $0.02 | $0.02 |
| `minimax-image-01` | $0.03 | $0.03 | $0.03 |
| `flux-2-pro` | $0.03 | $0.075 | $0.255 |
| `seedream-5-0-260128` | $0.0315 | $0.0315 | $0.0315 |
| `gemini-3.1-flash-lite-image` | $0.0336 | $0.0336 | $0.0336 |
| `gemini-2.5-flash-image` | $0.039 | $0.039 | $0.039 |
| `flux-1.1-pro` | $0.04 | $0.04 | $0.04 |
| `flux-kontext-pro` | $0.04 | $0.04 | $0.04 |
| `grok-imagine-image-pro` | $0.05 | $0.07 | $0.07 |
| `gemini-3.1-flash-image` | $0.067 | $0.101 | $0.151 |
| `imagen-4-standard` | $0.080386 | $0.080386 | $0.080386 |
| `gemini-3-pro-image` | $0.134 | $0.134 | $0.24 |
| `imagen-4-ultra` | $0.160772 | $0.160772 | $0.160772 |

::: tip BEST VALUE
**`seedream-5-0-260128`** at $0.0315 delivers premium quality for a third of what
the Imagen tier costs. Use it as your default.

If you are rendering at 1K, **`flux-2-pro`** is $0.03 — but check the tier column
before scaling up: the same model is $0.255 at 4K, an 8.5x step.
:::

## Video Generation Costs

Most video models are metered **per second of output**, so the price of a clip is
`rate × duration`. Durations are snapped to what the provider will actually
render before you are billed, so you pay for the clip you receive.

| Model | ID | $/second | 5s clip | Provider |
|-------|-----|---------:|--------:|----------|
| Hailuo O2 | `hailuo-o2` | $0.017 | $0.085 | MiniMax |
| Wan 2.2 Plus | `wan2.2-t2v-plus` | $0.02 | $0.10 | Alibaba |
| Kling v2.5 Turbo | `kling-v2-5-turbo` | $0.026 | $0.13 | Kuaishou |
| Veo 3.1 Lite | `veo-3.1-lite-generate-001` | $0.03 | $0.15 | Google |
| Kling v2.6 | `kling-v2-6` | $0.038 | $0.19 | Kuaishou |
| Hailuo 2.3 | `hailuo-2.3` | $0.047 | $0.235 | MiniMax |
| Veo 3.1 Fast | `veo-3.1-fast-generate-001` | $0.08 | $0.40 | Google |
| Gemini Omni Flash | `gemini-omni-flash` | $0.1014 | $0.507 | Google |
| OpenAI Sora 2 | `sora-2` | $0.13 | $0.65 | OpenAI |
| Grok Video 1.5 | `grok-imagine-video-1.5` | $0.14 | $0.70 | xAI |
| **Google Veo 3.1** | `veo-3.1-generate-001` | **$0.20** | $1.00 | Google |
| OpenAI Sora 2 Pro | `sora-2-pro` | $0.30 / $0.50 / $0.70 | $1.50 at 720p | OpenAI |

`sora-2-pro` prices per resolution ($0.30 at 720p, $0.50 at 1024p, $0.70 at
1080p). Send `resolution` and you are billed that tier. Omit it and you get the
1080p rate, so always send it.

See the [full catalog](/api/models#video-generation-models) for every variant, or
`GET /v1/pricing?model=<id>` for one.

::: tip BEST VALUE
**`hailuo-o2`** / **`wan2.2-t2v-plus`** are the lowest cost per second with solid
quality for social content. Step up to **`veo-3.1-generate-001`** for cinematic
output with native audio, or **`gemini-omni-flash`** for automatic native audio at
half the per-second rate.
:::

### Seedance: priced per output token

The Seedance family is the exception. ByteDance bills it **per 1000 output
tokens**, and the token count is a function of resolution and duration:

```
tokens          = floor(tokens_per_frame × (24 × seconds + 1))
tokens_per_frame = frame pixel count / 1024
```

| Model | $/1K tokens | 5s @ 480p | 5s @ 720p | 5s @ 1080p |
|-------|------------:|----------:|----------:|-----------:|
| `seedance-1-5-pro-251215` | $0.0012 | $0.060766 | $0.13068 | $0.29403 |
| `seedance-2-0-mini` | $0.0035 | $0.177233 | $0.38115 | — |
| `seedance-2-0-fast` | $0.0056 | $0.283573 | $0.60984 | — |
| `seedance-2-0-pro` | $0.007 (480p/720p) · $0.0077 (1080p) · $0.004 (4K) | $0.354466 | $0.7623 | $1.886693 |
| `seedance-2-5` | $0.0107 | $0.518276 | $1.16523 | — |

`seedance-1-5-pro-251215` charges $0.0024 per 1K when you ask for generated audio
— double the video rate, so a 5-second 720p clip with audio is $0.26136. Every
other Seedance tier includes audio at no extra cost.

Only `seedance-2-0-pro` reaches 4K ($3.9204 for 5 seconds). You do not have to do
this arithmetic yourself:
`GET /v1/pricing?model=seedance-2-5` returns `token_formula` and worked
`examples`, and `POST /v1/billing/estimate` prices a specific duration.

::: info Long clips
`seedance-2-5` is the only model that reaches 30 seconds in a single request —
648 900 output tokens, **$6.94** at 720p. Draft at 480p first: the same 30
seconds is $3.09 there, and a 5-second test is $0.52.

Native audio is included at both resolutions. Attaching a **source video** makes
the render *cheaper*, not dearer — input frames bill at $0.0064 per 1K instead of
$0.0107, so that same 30-second 720p clip is $4.15 as an edit.
:::

## Chat / LLM Costs

`/v1/ai/chat/completions` bills the tokens you actually use. Output tokens cost
4-8x input, so the two are rated separately.

| Model | $/1M in | $/1M out |
|-------|--------:|---------:|
| `gemini-flash` | $0.30 | $2.50 |
| `claude-haiku-4.5` | $0.80 | $4.00 |
| `gemini-pro` | $1.25 | $10.00 |
| `gpt-4o` | $3.00 | $15.00 |
| `claude-sonnet` | $3.00 | $15.00 |

A 75-token prompt with a 150-token answer is **$0.000398** on `gemini-flash`.

Pass the alias (`gemini-flash`, not `gemini-2.5-flash`) — the aliases are what the
rate table is keyed on. For a per-request `cost_breakdown`, use the premium
endpoint (`/v1/ai/chat/claude`). See the [Chat/LLM reference](/api/chat-llm).

## Storage Costs

FOTOhub-managed buckets are metered **hourly against the bytes you are holding**,
and the accrual is deducted from the same wallet:

| | Rate |
|-|-----:|
| Per GB-month | $0.0245 |
| Per GB-hour | $0.00003356 |

Holding 100 GB for a full month costs $2.45. Every storage class prices at the
Standard rate, because managed buckets live on S3 Standard in `eu-central-1`
whatever the class label says. Bring-your-own-bucket destinations are metered at
the real per-class rate of the region they are in.

## Free Operations

These cost **$0.00** and never touch the wallet:

- Gabriel AI classify / suggest / recommend
- Translation (`/v1/ai/translate`, up to 10 000 characters per request)
- Model catalog queries (`/v1/models`, `/v1/pricing`, `/v1/plans`)
- Billing, balance and usage queries
- Webhook management

They still consume your rate limit.

## When a Request Fails

Nothing is charged for a request that never produced output. Two distinct cases:

**Empty wallet** — `402`, before the provider is called, so there is nothing to
refund:

```json
{
  "error": "insufficient_funds",
  "message": "Insufficient funds: this request costs $0.381150 but your balance is $0.120000. Top up your wallet with at least $0.261150 to continue. The FOTOhub API is prepaid: no credits or subscription plan can pay for API usage.",
  "required_usd": 0.38115,
  "balance_usd": 0.12,
  "shortfall_usd": 0.26115,
  "charged": false,
  "charged_usd": 0,
  "topup_url": "https://fotohub.app/console/wallet"
}
```

Read `shortfall_usd` to size the top-up.

**Provider failure after the charge** — the wallet is refunded and the error says
so explicitly (`"No charge was made for this request."`). If you do not see that
sentence, reconcile against `GET /v1/tiers/usage` rather than assuming.

## Cost Optimization Tips

### 1. Estimate before you spend

`POST /v1/billing/estimate` prices a batch from the same rate table and the same
quote builders that bill it, so the estimate cannot disagree with the charge:

```python
estimate = client.estimate_cost([
    {"type": "generate_image", "model": "seedream-5-0-260128", "count": 100},
    {"type": "generate_video", "model": "veo-3.1-generate-001", "duration": 8, "count": 20},
    {"type": "chat", "model": "gemini-flash",
     "input_tokens": 400_000, "output_tokens": 100_000},
])
print(f"${estimate['total_usd']} — affordable: {estimate['sufficient']}")
# $36.1213 — affordable: True
# ($3.7513 for the images + $32.00 for 20 x 8s of Veo 3.1 + $0.37 of chat)
```

Read **`sufficient`** rather than comparing numbers yourself: it is the server's
own answer, and it degrades honestly when part of the batch has no published rate
(`priced: false`, `amount_usd: null` — never a misleading `0`).

Pass the fields the meter needs: `duration` for a per-second model,
`input_tokens`/`output_tokens` for chat, `image_size` for a resolution-stepped
image. An operation that omits them comes back unpriced with a reason instead of
a guess.

### 2. Draft cheap, finish expensive

The spread within a family is large enough that previews should not use the final
model:

```python
# Preview: $0.02/s
preview = client.generate_video(prompt="...", model="wan2.2-t2v-plus")

# Final: cinematic quality with native audio, $0.20/s
final = client.generate_video(prompt="...", model="veo-3.1-generate-001")
```

Ten 5-second previews cost $1.00 on Wan, the price of a single 5-second Veo 3.1
clip. The same applies within Seedance: draft at 480p, deliver at 720p.

### 3. Send the resolution you actually want

Twelve image models and `sora-2-pro` price per resolution, and omitting the field
bills the **top** tier. A 1K `flux-2-pro` render is $0.03 with `image_size` set
and $0.255 without it.

### 4. Use Gabriel AI for model selection

Gabriel is free and picks the cheapest model that can do the job:

```python
route = client.gabriel_classify(prompt="Generate a simple product photo")
print(route["model_selected"])
```

Then price what it chose with `GET /v1/pricing?model=<id>` before dispatching.

### 5. Cap your own spending

A wallet is already a hard ceiling, but you can set a lower monthly one — useful
for a shared key or an experiment you do not want draining a funded account:

```python
client.set_overage_limit(15)  # stop at $15 of spend this calendar month
```

Pass `0` or `null` to disable it and let the wallet balance be the only cap.

### 6. Monitor the balance you actually spend from

```python
balance = client.get_balance()
if balance["wallet"]["balance_usd"] < 5:
    # Top up, or stop dispatching work
    pass
```

There is no credit field to read here. `spend.this_month_usd` and
`spend.monthly_limit_usd` show the running total against any cap you set.

## Account Tiers

Tiers set **rate and concurrency limits**. They do not include an allowance and
they do not change prices — every account pays the same USD rate for the same
model and pays it out of its own wallet.

The pay-as-you-go tiers activate automatically from wallet balance or lifetime
spend, with no subscription:

| Tier | Unlocks at | RPM | Concurrent jobs | Max upload |
|------|-----------|----:|----------------:|-----------:|
| PAYG Basic | $0 | 30 | 3 | 25 MB |
| PAYG Standard | $25 balance or $50 lifetime spend | 120 | 10 | 100 MB |
| PAYG Premium | $120 balance or $500 lifetime spend | 500 | 30 | 500 MB |

Above that, Enterprise is provisioned by sales:

| Tier | Price | RPM | Concurrent jobs | Support |
|------|-------|----:|----------------:|---------|
| Enterprise | Custom | 5000 | 200 | Custom SLA |

Apply at `POST /v1/tiers/enterprise/apply` — it cannot be self-served.

**Paid API plans were retired on 2026-08-13.** There is nothing to subscribe to
and nothing to cancel: every tier is free, and it unlocks on your own wallet. So
the only way to raise your limits is to top up — which is also the cheaper one,
since from $500 up a top-up earns a
[volume bonus of 5–20%](#top-up-packages-and-the-volume-bonus) in extra spendable
dollars that a monthly fee never gave you.

See [Rate Limits](/api/rate-limits) for the burst windows and the
`X-RateLimit-*` headers.

## Top-Up Packages and the Volume Bonus

Fund the wallet with a package or any custom amount between **$10** and
**$15,000**. From $500 up, the top-up earns a **volume bonus** — extra real
dollars credited in the same transaction as the payment, spendable on any
operation, with no expiry:

| Slug | You pay | Bonus | Credited to wallet |
|------|--------:|------:|-------------------:|
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

The bonus is a function of the money, not of the package: typing `2500` into a
custom top-up earns the same 13% as any $2,500 preset would. Rungs do not stack —
only the highest one at or below your amount applies — and the bonus is floored to
the cent, so a $499 top-up earns nothing. Aim at the round numbers.

::: warning The four starter slugs are not their amounts
`topup-50` charges **$15**, `topup-100` **$25**, `topup-250` **$60** and
`topup-500` **$120** — historical names from the pre-USD PLN pricing. The
`scale-*` slugs do match their dollar amounts. Read `amount_usd` and `total_usd`
from `GET /v1/billing/topup/packages` rather than hardcoding any of it.
:::

Above $15,000, apply at `POST /v1/tiers/enterprise/apply` for invoicing. See
[Billing](/api/billing#get-v1-billing-topup-packages) for the full endpoint
contract and the machine-readable bonus ladder.
