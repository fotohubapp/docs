# Quickstart

From nothing to a generated image in about five minutes. Every request and
response on this page was executed against production on 2026-09-18 — the costs
and timings are the ones the platform actually reported, not illustrations.

## 1. Get a key

Create an account at [fotohub.app](https://fotohub.app), then open
[Console → Keys](https://fotohub.app/console/keys) and create a key. It is shown
once and looks like `fh_live_…`.

Top up the prepaid wallet in [Console → Wallet](https://fotohub.app/console/wallet).
API usage is billed from that wallet in USD, to six decimal places.

```bash
export FOTOHUB_API_KEY="fh_live_your_key_here"
```

## 2. Look before you spend

Two endpoints are **public — no key required** — and both are worth calling
before you write any code:

```bash
# The live model catalogue: ids, categories, per-unit USD rates
curl -s https://apis.fotohub.app/v1/models | head -c 400

# The authoritative rate table the biller actually uses
curl -s https://apis.fotohub.app/v1/pricing | head -c 400
```

As of this writing the catalogue answers **106 models across 19 providers** —
56 video, 35 image, 10 audio, 5 text. Filter it with
`GET /v1/models?category=image`.

::: tip Price a run before you make it
`/v1/pricing` currently reports `"margin": 1.0`, meaning the price you are
charged is the upstream provider's own rate. Read the rate from the endpoint
rather than copying a number out of a guide — guides go stale, the endpoint
does not.
:::

## 3. Your first call

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedream-5-0-260128",
    "prompt": "a single green apple on a white studio backdrop, soft light",
    "aspect_ratio": "1:1"
  }'
```

This returned `200 OK` after **21.0 seconds** and charged **$0.0315**:

```json
{
  "model": "seedream-5-0-260128",
  "cost_usd": 0.0315,
  "currency": "USD",
  "billing": {
    "method": "wallet",
    "cost_usd": 0.0315,
    "balance_usd": 5.1486,
    "currency": "USD"
  },
  "usage": {
    "generated_images": 1,
    "resolution": "2048x2048",
    "generation_ms": 16998,
    "transfer_ms": 1800
  },
  "images": [
    {
      "id": "38eacb12-2bd9-46ce-aab1-5fce671a003a",
      "url": "https://s1.fotohub.app/storage/v1/object/sign/api-generations/…",
      "storage_path": "…/ai-gen-1789720747872-2ae9d8.png",
      "file_size": 122541
    }
  ]
}
```

::: warning Two things that surprise people here
`images[0].url` is a **signed URL with an expiry** — download the file or copy
it into your own storage rather than treating it as permanent.

The image object carries ~67 columns, most of them internal and null. Read
`id`, `url`, `storage_path` and `file_size`; ignore the rest. In particular
`width` and `height` on the image object come back `null` — the dimensions you
want are in `usage.resolution`.
:::

## 4. The only two response shapes

This is the single most useful thing to learn about the API, and it is worth
learning now rather than on your first timeout.

**Synchronous** — the result comes back on the same request. The connection is
held open for as long as generation takes (21 s above).

| Endpoint | Returns |
|---|---|
| `POST /v1/ai/generate/image` | `images[]` |
| `POST /v1/ai/generate/music` | audio URL |
| `POST /v1/ai/generate/sfx` | audio URL |
| `POST /v1/ai/generate/speech` | audio URL |
| `POST /v1/ai/chat/completions` | message |
| `POST /v1/ai/generate/3d` | the finished mesh |
| `POST /v1/ai/edit/image` | `images[]` |

**Asynchronous** — `202 Accepted` with a `job_id` and a `poll_url`, which you
poll until `status` is `completed` or `failed`.

| Submit | Poll |
|---|---|
| `POST /v1/ai/generate/video` | `GET /v1/ai/generate/video/{job_id}` |
| `POST /v1/ai/generate/image` with `model: ida-q-image` | `GET /v1/ai/generate/image/ida-q/{job_id}` |
| `POST /v1/ai/tryon` | `GET /v1/ai/tryon/{job_id}` |

::: warning 3D looks async and is not
`POST /v1/ai/generate/3d` returns the finished model on the same request.
`GET /v1/ai/generate/3d/{job_id}` exists, but it is **not** a poll — it re-signs
the expiring download link for an asset that is already finished. A loop written
against it as a poll never terminates, because the record is `completed` the
first time you read it.
:::

An async submit looks like this:

```json
{
  "model": "ida-q-image",
  "job_id": "…",
  "status": "queued",
  "estimated_seconds": 25,
  "poll_url": "https://apis.fotohub.app/v1/ai/generate/image/ida-q/…"
}
```

Note that **the charge happens at submit time**, not at completion. If the
engine then fails the job, the poll that observes the failure issues the refund
and says so in the response.

## 5. Install an SDK

::: code-group

```bash [Python]
pip install fotohub
```

```bash [TypeScript]
npm install fotohub
```

```bash [CLI]
npm install -g fotohubapp-cli
```

:::

The SDK client reads `FOTOHUB_API_KEY` from the environment when you do not
pass a key explicitly.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub()  # reads FOTOHUB_API_KEY

result = client.generate_image(
    "a single green apple on a white studio backdrop",
    model="seedream-5-0-260128",
    aspect_ratio="1:1",
)

# generate_image returns a plain dict, not an object — subscript it.
print(result["images"][0]["url"])
print(result["cost_usd"], result["currency"])

print(client.get_balance())
print(client.list_models(category="image"))
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY });

const result = await client.generateImage({
  model: "seedream-5-0-260128",
  prompt: "a single green apple on a white studio backdrop",
  aspectRatio: "1:1",
});

console.log(result.images[0].url);
```

:::

For the genuinely async endpoints the Python SDK ships blocking helpers so you
do not have to write the poll loop yourself: `wait_for_video()` and
`wait_for_tryon()`. (`wait_for_3d()` also exists, but 3D returns its result
inline — you do not need it.)

## 6. Handle the errors you will actually hit

| Status | Meaning | What to do |
|---|---|---|
| `400` | Missing or invalid field — e.g. no `prompt` | Fix the body; nothing was charged |
| `401` | Key missing, malformed or revoked | Check the `Authorization: Bearer` header |
| `402` | `insufficient_funds` — the wallet cannot cover the call | Top up in Console → Wallet |
| `429` | Rate limit | Back off and retry; see [Rate Limits](/api/rate-limits) |
| `5xx` | Engine failure | The charge is refunded; retry is safe |

A `402` is returned **before** any GPU is touched, so a wallet that is too thin
costs you nothing but the round trip.

## Where to go next

Pick the quickstart for what you are building:

- [Images](/guides/quickstart-image) — 35 models, synchronous, seconds
- [Video](/guides/quickstart-video) — 56 models, asynchronous, per-second billing
- [Audio, speech & music](/guides/quickstart-audio) — synchronous, per-minute and per-1K-character billing
- [3D models](/guides/quickstart-3d) — asynchronous, per-request billing

Then: [Authentication](/api/authentication) ·
[Model catalogue](/api/models) ·
[Webhooks](/guides/webhooks) ·
[Python SDK](/sdk/python)
