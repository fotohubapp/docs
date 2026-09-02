# Changelog

Track new models, features, and improvements to the FOTOhub API.

---

## September 2026

### Story Studio scene renders are priced per model <Badge type="warning" text="BREAKING" />

`POST /v1/story/step/videos` starts one clip per storyboard frame — on any of nine
models, at any length from 3 to 15 seconds, for up to six scenes — and used to
charge one flat **$0.535906** for all of it. That figure covered a four-scene story
on `seedance-1-5` and nothing else: the same request consumes $4.66 on
`seedance-2-5`, and the largest one the route accepts (six 15-second scenes on 2.5)
consumes **$20.86**.

Scene renders are now billed at the provider's own rate — per model, per second,
per scene — from the same table [`/v1/ai/generate/video`](/api/video-generation)
bills from:

| `video_model` | Per 5 s scene | 4-scene story |
|---|---:|---:|
| `seedance-1-5` | 0.130680 | 0.522720 |
| `seedance-2-0-mini` *(default)* | 0.381150 | 1.524600 |
| `veo-3-1-fast` | 0.320000 | 1.280000 |
| `wan` / `happyhorse` | 0.500000 | 2.000000 |
| `seedance-2-0-fast` | 0.609840 | 2.439360 |
| `seedance-2-0-pro` | 0.762300 | 3.049200 |
| `veo-3-1` | 0.800000 | 3.200000 |
| `seedance-2-5` | 1.165230 | 4.660920 |

What to change in an integration:

- **`video_model` now decides your bill.** Read `cost_usd` off the step 4 response
  rather than assuming a fixed line item, and pick `seedance-1-5` if price is the
  constraint — it is 3x cheaper than the default and 9x cheaper than `seedance-2-5`.
- **`story_step_videos` is no longer a price key** and has left `GET /v1/pricing`.
  The ledger now labels each charge `story_step_videos:<model>`, so a charge names
  the model that caused it. `story_step` (0.267953), `story_regenerate` (0.160772)
  and `story_full` (1.607717) are unchanged.
- **A duration snaps down onto the model's own ladder.** `duration_per_scene: 5`
  on a Veo model is a four-second clip, billed as four seconds — Veo renders 4, 6
  or 8 and nothing else.
- **You are only charged for scenes that render.** A scene whose keyframe failed in
  step 3 is never submitted and never quoted; anything the provider refuses is
  refunded against the same operation the moment step 4 returns.
  `POST /v1/story/generate` charges its estimate up front and reports any refund in
  a new `event: billing` frame carrying `refunded_usd`, `scenes_rendered` and
  `scenes_requested`.
- **`POST /v1/story/step/poll-videos`** — new, free, and the only way to get real
  clip URLs out of the step path. Poll it until `pending` is `0` before calling
  step 5 or 6.

Nine models are now selectable (`seedance`, `seedance-2-0-mini`, `-fast`, `-pro`,
`seedance-2-5`, `seedance-1-5`, `veo-3-1-fast`, `veo-3-1`, `wan`, `happyhorse`).
`hailuo` is retired — still accepted so live integrations do not start failing, but
it renders on the default model. Full reference: [Story Studio](/api/story-studio).

---

## August 2026

### Wallet top-up packages & volume bonus <Badge type="tip" text="NEW" />

Twelve fixed top-up packages, and every one from $500 up pays a volume bonus in
**dollars credited to your wallet** — not credits, not a discount code.

| Pay | Bonus | Credited |
|---|---|---|
| $15 / $25 / $60 / $120 | — | same |
| $500 | +5% | $525 |
| $1,000 | +10% | $1,100 |
| $2,000 | +12% | $2,240 |
| $3,000 | +13% | $3,390 |
| $5,000 | +15% | $5,750 |
| $7,500 | +17% | $8,775 |
| $10,000 | +18% | $11,800 |
| $15,000 | +20% | $18,000 |

A custom `amount_usd` earns the same ladder — $2,500 lands on the $2,000 rung and
is credited $2,800. The bonus is floored to the cent, so the figure quoted before
checkout is never above the figure granted after it. Nothing expires: a topped-up
balance stays until you spend it.

Read the amount you actually received from **`total_credited_usd`** on the
`POST /v1/tiers/wallet/topup` response, not from what you paid. (On the catalog,
`GET /v1/billing/topup/packages`, the same figure per package is `total_usd` —
that one is a quote, not a receipt.) The catalog is public, needs no key, and
publishes the ladder itself as `bonus_tiers` alongside `min_usd: 10` and
`max_usd: 15000`. See
[Get Top-Up Packages](/sdk/typescript#get-top-up-packages).

::: warning Package slugs are not amounts
The four starter slugs are pre-USD names: `topup-50` is **$15**, `topup-100` is
**$25**, `topup-250` is **$60**, `topup-500` is **$120**. The `scale-*` slugs do
match their amounts (`scale-1000` = $1,000). Send the slug, never the amount, as
`package`.
:::

### API subscriptions retired <Badge type="warning" text="BREAKING" />

`POST /v1/tiers/subscribe` now answers **HTTP 410** for every tier, with
`use_instead: "POST /v1/tiers/wallet/topup"`. There is no paid API plan any more —
the API is prepaid in USD, and rate limits are derived from your wallet balance
and lifetime spend.

What this changes if you integrated against it:

- **`GET /v1/billing/plans`** returns `{"plans": []}`. Still a 200; simply nothing
  to iterate.
- **`GET /v1/tiers/compare`** no longer carries `price_monthly` or
  `monthly_credits` (they quoted PLN prices for plans nobody can buy). It now
  states `currency: "USD"`, `billing_model: "prepaid_wallet_usd"`,
  `subscriptions_retired: true`, and marks each row `purchasable: false` with an
  `upgrade_path` of `"wallet_topup"` or, for `sub-enterprise`,
  `"contact_sales"`.
- **`GET /v1/tiers/catalog`** still publishes its `subscriptions` array, because
  those rows are live **rate-limit definitions** for accounts that already held a
  `sub-*` tier. They are flagged `purchasable: false`, `legacy: true`.
- **`bonus_credits` → `bonus_usd`** on every top-up response. The field never
  described credits; the wallet has only ever been in dollars.
- **Out of funds is `402 insufficient_funds`**, carrying `required_usd`,
  `balance_usd`, `shortfall_usd` and `charged: false` — a 402 moves no money and
  calls no provider. See [402 Payment Required](/api/errors#_402-payment-required).

To raise your limits, fund the wallet.

::: tip Credit figures in older entries below
Entries before this one price models in **credits**. That is the fotohub.app web
app's unit and it does not apply to the API: an API call is charged in USD from
the prepaid wallet at the provider's own rate, 1:1. A key holding web-app credits
and a $0 wallet gets a 402. Current USD rates are on
[Model Pricing](/api/models).
:::

### Registered face deletion & retention <Badge type="tip" text="NEW" />

A registered virtual portrait (`POST /v1/ai/assets/register`) is biometric data,
and it can now be erased on demand instead of only being written, never removed:

- **`DELETE /v1/ai/assets/{asset_id}`** — deletes the face at the provider and
  records the erasure locally. Idempotent (`already_deleted: true` on a repeat
  call); `404` if the asset is not yours; `502` — safe to retry — if the
  provider delete failed, in which case nothing was recorded as deleted.
- **`retention_hours`** (optional, 1-8760) on `POST /v1/ai/assets/register` —
  the asset self-deletes once it elapses. A background sweep runs every 15
  minutes, so expiry is eventually consistent shortly after `expires_at`, not
  exact to the second. Omit it to keep the face until you delete it.
- **`GET /v1/ai/assets`** and **`GET /v1/ai/assets/{asset_id}`** now also
  return `retention_hours`, `expires_at`, and `purged_at`.

See [Managing registered faces](/api/video-generation#managing-registered-faces)
for the full reference and response shapes.

### Storage bucket region field <Badge type="tip" text="NEW" />

`POST /v1/buckets` and `PATCH /v1/buckets/:id` now surface `region` explicitly:

- `POST /v1/buckets` accepts an optional `region`, but **`"eu"` is the only
  value FOTOhub-managed storage accepts** (default when omitted) — these
  buckets are stored in `eu-central-1`. Anything else is a `400` pointing you
  at [output destinations](/guides/bucket-delivery) for residency outside the EU.
- `PATCH /v1/buckets/:id` rejects `region` outright with a `400`: it records
  where the bytes already live, and a bucket cannot be relabelled into a
  different region without moving the data.
- `GET /v1/buckets` and `GET /v1/buckets/:id` include `region` on every row.

This does not affect S3 Enterprise (`/v1/storage/s3/*`), which already
provisions real AWS buckets across 16 regions — see [Available Regions](/api/storage#available-regions).

### Seedance 2.5 <Badge type="tip" text="NEW" />

`seedance-2-5` — the longest single-request clip on the platform, and the first model
that takes an existing video as input.

- **4-30 seconds in one request** (every integer in range; nothing else reaches past 15s)
- **Native audio included** — the per-second rate is identical with audio on or off
- **480p / 720p**, 24 fps, `mp4` or `mov` output
- **14.5 credits/s at 720p, 6.4 at 480p** — a 30s 720p clip is 435 credits, a 5s 480p draft is 32
- **Video-to-video editing and extension** — attach a source clip and describe the change
- **Up to 30 image + 10 video + 10 audio references**, plus reusable `asset_ids` for face consistency

Note: 2.5 is not a superset of `seedance-2-0-pro`. It reaches 30 seconds but stops at
720p; 2.0 Pro reaches 4K but stops at 15 seconds. Pick per shot.

See the [Seedance 2.5 reference](/api/video-generation#seedance-2-5-long-clips-video-editing)
for the full parameter set, the task types that lock `aspect_ratio`/`duration`, and
editing examples. SDK support: `client.generate_seedance()` / `client.generateSeedance()`
handles submit + poll transparently.

---

## July 2026

### IDA Q 1.0 <Badge type="tip" text="NEW" />

FOTOhub's first proprietary image generation model, self-hosted on our own GPU infrastructure.

- **Top-5 worldwide** on the DesignArena Elo benchmark, ahead of Recraft, Krea 2, FLUX.2, Seedream, and Imagen 4 Ultra
- **Best-in-class text rendering** — clean headlines, labels, and signage
- **Native multilingual prompts** — automatic translation and scene restructuring for any input language, powered by FOTOhub's own prompt engine
- **Priced at 0.5 credits/request** (≈ $0.027 if billed from your USD wallet) — the cheapest image model in the catalog
- **Asynchronous by design** — single-GPU global queue, submit + poll pattern (30s–3.5min depending on resolution)
- **SDK support**: `client.generate_ida_q()` / `client.generateIdaQ()` in Python & TypeScript — handles submit + poll transparently

See the [IDA Q 1.0 API Reference](/api/ida-q) for full documentation.

### Veo 3.1, Veo 3.1 Fast, Gemini Omni Flash & Grok Video 1.5 <Badge type="tip" text="NEW" />

Four new video models added to the catalog:

- **`veo-3.1-generate-001`** ("Veo 3.1") — Google's highest-quality video model. Native audio, up to 4K resolution, last-frame + reference-image support. 12 credits/second.
- **`veo-3.1-fast-generate-001`** ("Veo 3.1 Fast") — Faster, lower-cost Veo 3.1 tier with native audio. 5 credits/second.
- **`gemini-omni-flash`** ("Gemini Omni Flash") — Native audio generated automatically on every clip, no separate surcharge tier. 6 credits/second.
- **`grok-imagine-video-1.5`** ("Grok Video 1.5") — The only generative video model with built-in lip-sync (portrait + script → talking head). 9 credits/second.

See the [Video Generation Models catalog](/api/models#video-generation-models) for full pricing across every provider.

### Gabriel AI Orchestrator <Badge type="tip" text="NEW" />

Full-featured AI orchestrator with natural language routing, prompt enhancement, and inline suggestions.

- **5 endpoints**: classify, stream, suggest, recommend, translate
- **Intelligent routing**: "make a photo of a cat" → image generation, "create a video" → video generation
- **Prompt enhancement**: model-aware prompt optimization (Seedream, Seedance, FLUX, WAN architectures)
- **Real-time suggestions**: <50ms autocomplete as you type
- **Proactive tips**: context-aware recommendations based on credits, brand state, and usage history
- **SDK support**: `client.gabriel_classify()` / `client.gabrielClassify()` in Python & TypeScript

### Usage & Analytics API <Badge type="tip" text="NEW" />

Real-time monitoring and cost analytics for all API operations.

- Per-model, per-endpoint, per-key cost breakdown
- Daily/weekly/monthly trend data
- Anomaly detection alerts
- Custom date range queries

### Seedance Video <Badge type="info" text="UPDATED" />

Next-generation Seedance video generation now available under the `seedance-2-0-pro` model ID:
- High-quality, cinematic output
- Fast turnaround for social-format clips
- Billed at 47 credits per 5-second segment

### Dola SeedDream 5.0 Pro <Badge type="info" text="UPDATED" />

Latest SeedDream variant with improved prompt following, better text rendering, and enhanced photorealism. 3 credits per image.

---

## June 2026

### Tier System v2 <Badge type="tip" text="NEW" />

Complete billing overhaul with wallet-based pricing:
- PAYG auto-resolution (free → developer → startup based on usage)
- Wallet with auto-topup
- Per-project hard spending limits
- 4-hour burst allowances
- Enterprise tier with custom SLAs

### Brand Assets System <Badge type="tip" text="NEW" />

Upload and manage brand assets (logos, colors, fonts) for brand-consistent AI generation.

### Veo 3.0 Improvements <Badge type="info" text="UPDATED" />

Improved temporal coherence for Google's Veo 3 video model. Note: this entry originally referred to "Veo 3.1" and listed a flat 15-credit generation cost — that was inaccurate. The real `veo-3.1-generate-001` (12 credits/second, native audio, up to 4K) shipped in July 2026; see the entry below.

---

## May 2026

### FLUX 2 Models <Badge type="tip" text="NEW" />

Full FLUX 2 lineup: Pro, Max, Flex, Klein 4B/9B. Best-in-class for artistic and creative generation.

### Grok Video & Image <Badge type="tip" text="NEW" />

xAI's Grok-powered generation models added to the catalog.

### Webhook System <Badge type="info" text="UPDATED" />

HMAC-SHA256 signed webhooks with 3x retry, exponential backoff, and delivery logs.

---

## Earlier

See the [full API reference](/api/getting-started) for comprehensive endpoint documentation.
