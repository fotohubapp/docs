# Billing & Pricing

FOTOhub's API is a **prepaid USD wallet**. There are no API credits and no
free tier: every billed call is charged against your wallet balance at the
provider's own rate, 1:1, with no platform fee added. At a `$0` balance every
billed endpoint returns `402` and refuses to run — nothing is queued, and
nothing is charged on credit.

::: warning Credits exist only on fotohub.app
The web app's subscriptions are denominated in credits. Those credits belong
to the web app and cannot pay for an API call — a key on an account with 5,000
web-app credits and a `$0` API wallet still gets `402` on every billed
request. If you see a `credits` field anywhere in an API response, it is
either a deprecated leftover (documented below) or describes the *web app's*
counter, never something the API will spend for you.
:::

## How Billing Works

```
Request → Authentication → require_funds() (before calling the provider)
                                    ↓
                    Balance covers the price?
                ↓ No                              ↓ Yes
   402, nothing charged,                 Call the provider, then
   nothing runs                          bill_operation() debits the wallet
                                                    ↓
                              Response with billing breakdown (billing.cost_usd)
```

1. **Authentication** — the request is authenticated via API key; the wallet
   balance is loaded.
2. **Funds check** — `require_funds()` runs *before* the provider is called on
   every billed route. A `$0` balance stops the request here — it never reaches
   the provider, so nothing is charged for work that didn't happen.
3. **Execution** — for flat-price operations (most image/video/3D models),
   the price is known up front and charged, then the provider runs. For
   token-billed operations (chat, some image editing), the provider runs
   first and the wallet is debited from the real token count afterward.
4. **Response** — every billed response includes a `billing` block with the
   exact USD amount taken and the resulting balance.

::: warning A handful of routes still bill after the provider call
Six routes historically billed *after* the provider answered rather than
before (BytePlus images, Dreamina extras, Seedance submit, Grok STT top-up,
chat completions, Polly/Azure TTS). Chat is billed this way by necessity — the
price depends on tokens the provider hasn't generated yet — and is still
gated by a pre-flight balance check so a $0 wallet is refused before any
tokens are spent. The rest are a known ordering gap, not the intended design.
:::

## The `billing` Object

Every billed response includes a `billing` block:

```json
{
  "cost_usd": 0.0563,
  "currency": "USD",
  "billing": {
    "cost_usd": 0.0563,
    "balance_usd": 34.1237,
    "currency": "USD",
    "method": "wallet",
    "model": "prepaid"
  }
}
```

`method` is always `"wallet"` and `model` is always `"prepaid"` — there is no
other way to pay. `billing.balance_usd` is the wallet balance **after** this
charge, so you can watch it to decide when to top up before the next request
is refused.

On token-billed endpoints (chat), `billing` additionally carries a `legs`
array breaking the charge into input/output token lines — see
[Chat & LLM Models](/api/models#chat-and-llm-models).

::: warning `credits_used` is gone
Routes used to return `"credits_used": 3` — a number in a currency the API
does not accept. Some published SDK types still declare the field as
`@deprecated` for compatibility; it is never populated by a current server.
Read `cost_usd`, never `credits_used ?? 0` — the latter reports a real charge
as a free generation.
:::

## Insufficient Funds (402)

A refused request returns a single error shape everywhere in the API:

```json
{
  "detail": {
    "error": "insufficient_funds",
    "code": "insufficient_funds",
    "message": "Insufficient funds: this request costs $0.0563 but your balance is $0.0000. Top up your wallet with at least $0.0563 to continue. The FOTOhub API is prepaid: no credits or subscription plan can pay for API usage.",
    "required_usd": 0.0563,
    "balance_usd": 0.0,
    "shortfall_usd": 0.0563,
    "currency": "USD",
    "charged": false,
    "charged_usd": 0,
    "topup_url": "https://fotohub.app/console?tab=billing"
  }
}
```

`charged` is always `false` on this response — the request was stopped before
the provider was called, so nothing was spent. If a provider call fails
*after* being billed, the wallet is refunded and the failure response says so
explicitly (see [Errors](/api/errors)).

## Wallet & Pricing Endpoints

### GET /v1/billing/balance

**Authentication:** API Key (Bearer token)

```json
{
  "wallet": {
    "balance_usd": 34.1237,
    "pending_usd": 0.0,
    "total_topped_up_usd": 60.0,
    "currency": "USD"
  },
  "spend": {
    "this_month_usd": 4.62,
    "monthly_limit_usd": 120.0,
    "currency": "USD"
  },
  "billing_model": "prepaid_wallet_usd",
  "api_subscription": null
}
```

`monthly_limit_usd` is `null` unless you've set one with
[`PUT /v1/billing/overage-limit`](#hard-spending-limits) below. `api_subscription`
is the active row from an [API subscription plan](#api-plans), or `null` — a
plan governs rate limits and model access, never funds a call.

---

### GET /v1/billing/pricing

**Authentication:** Public (no auth required)

Returns the pricing catalog by category (`image_generation`, video, audio,
3D, storage, compute…), plus the current API plans, top-up packages, and
storage packages.

```json
{
  "currency": "USD",
  "margin_info": "Prices are the provider's own rate, 1:1, with no platform fee added. Billed in USD from your prepaid wallet balance.",
  "pricing": {
    "image_generation": {
      "description": "AI Image Generation",
      "unit": "per image",
      "currency": "USD",
      "models": {
        "imagen-3-fast": { "name": "Imagen 3 Fast (512px)", "price": 0.0322 },
        "seedream-5-0-260128": { "name": "SeedDream 5.0 Lite (2K-4K)", "price": 0.0563 }
      }
    }
  },
  "api_plans": [ ],
  "topup_packages": [ ],
  "storage_packages": [ ]
}
```

::: warning This is a display catalog, not the biller
`GET /v1/billing/pricing` is a legacy PLN catalog converted to USD at the live
NBP mid rate on every call, so its `price` figures can drift slightly from the
actual charge and move day to day with the exchange rate. It is not what
`bill_operation` charges against. For the number that will actually be
charged — quoted directly in USD, per leg, with a `verified` flag — use
[`GET /v1/pricing`](/api/models#pricing-notes), which is the source of truth.
:::

::: warning Some entries still carry a `credits` field
It is a display leftover from before the USD migration and is not consumed by
anything — the API has no credit unit to spend it in. Read `price`.
:::

---

### GET /v1/billing/plans

Same as `/v1/billing/pricing`'s `api_plans` field, standalone. See
[API Plans](#api-plans) below.

---

### GET /v1/billing/topup/packages

**Authentication:** None required

```json
{
  "packages": [
    {"slug": "topup-50",     "name": "$15",     "amount_usd": 15,    "bonus_usd": 0,    "total_usd": 15,    "bonus_pct": 0},
    {"slug": "topup-100",    "name": "$25",     "amount_usd": 25,    "bonus_usd": 0,    "total_usd": 25,    "bonus_pct": 0},
    {"slug": "topup-250",    "name": "$60",     "amount_usd": 60,    "bonus_usd": 0,    "total_usd": 60,    "bonus_pct": 0},
    {"slug": "topup-500",    "name": "$120",    "amount_usd": 120,   "bonus_usd": 0,    "total_usd": 120,   "bonus_pct": 0},
    {"slug": "scale-500",    "name": "$500",    "amount_usd": 500,   "bonus_usd": 25,   "total_usd": 525,   "bonus_pct": 5},
    {"slug": "scale-1000",   "name": "$1,000",  "amount_usd": 1000,  "bonus_usd": 100,  "total_usd": 1100,  "bonus_pct": 10, "popular": true},
    {"slug": "scale-2000",   "name": "$2,000",  "amount_usd": 2000,  "bonus_usd": 240,  "total_usd": 2240,  "bonus_pct": 12},
    {"slug": "scale-3000",   "name": "$3,000",  "amount_usd": 3000,  "bonus_usd": 390,  "total_usd": 3390,  "bonus_pct": 13},
    {"slug": "scale-5000",   "name": "$5,000",  "amount_usd": 5000,  "bonus_usd": 750,  "total_usd": 5750,  "bonus_pct": 15},
    {"slug": "scale-7500",   "name": "$7,500",  "amount_usd": 7500,  "bonus_usd": 1275, "total_usd": 8775,  "bonus_pct": 17},
    {"slug": "scale-10000",  "name": "$10,000", "amount_usd": 10000, "bonus_usd": 1800, "total_usd": 11800, "bonus_pct": 18},
    {"slug": "scale-15000",  "name": "$15,000", "amount_usd": 15000, "bonus_usd": 3000, "total_usd": 18000, "bonus_pct": 20, "best_value": true}
  ],
  "min_usd": 10,
  "max_usd": 15000,
  "bonus_tiers": [
    {"min_usd": 15000, "pct": 0.20},
    {"min_usd": 10000, "pct": 0.18},
    {"min_usd": 7500,  "pct": 0.17},
    {"min_usd": 5000,  "pct": 0.15},
    {"min_usd": 3000,  "pct": 0.13},
    {"min_usd": 2000,  "pct": 0.12},
    {"min_usd": 1000,  "pct": 0.10},
    {"min_usd": 500,   "pct": 0.05}
  ],
  "notes": "Prepaid USD balance. Volume bonuses are credited as extra dollars in the same transaction as the payment, and the balance never expires."
}
```

**`amount_usd` is what Stripe charges. `total_usd` is what lands in the wallet.**
From $500 up, every top-up earns a volume bonus in extra real dollars — pay
$1,000 and you get $1,100 to spend, pay $15,000 and you get $18,000. The bonus
is credited in the same transaction as the payment, is spendable on any
operation, and does not expire.

`bonus_tiers` is ordered highest threshold first and the first entry at or below
your amount wins, so a quote is `floor(amount * pct * 100) / 100` for that entry
and `0` if none match. Iterate it in the order given — sorting it ascending would
quote a $15,000 top-up at 5% instead of 20%. The rungs do not stack, and the
bonus is floored to the cent, so a $499 top-up earns nothing.

::: warning The four starter slugs are not their amounts
`topup-50` charges **$15**, `topup-100` **$25**, `topup-250` **$60** and
`topup-500` **$120** — historical names from the pre-USD PLN pricing, kept
because shipped SDK builds send them. The `scale-*` slugs do match their dollar
amounts. `topup-1000` ($225) and `topup-5000` ($1,000) are retired from the list
but still resolve, and earn whatever bonus their amount qualifies for. Treat
every slug as opaque and read `amount_usd` / `total_usd`.
:::

---

### POST /v1/billing/topup

Initiate a wallet top-up via Stripe Checkout. Returns a checkout URL.

**Authentication:** JWT (session token)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `package` | string | No | One of the slugs above. Provide this or `amount_usd` |
| `amount_usd` | number | No | Custom amount, $10–$15,000, whole cents only. Earns the same volume bonus as a package of the same size. Provide this or `package` |
| `pay_currency` | string | No | `usd` (default) or `pln`. Only changes what Stripe charges — the wallet is always credited the same USD amount |

```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_live_...",
  "package": {
    "slug": "scale-1000",
    "name": "$1,000",
    "amount_usd": 1000,
    "bonus_usd": 100,
    "total_usd": 1100,
    "bonus_pct": 10,
    "popular": true
  },
  "amount_usd": 1000,
  "bonus_usd": 100,
  "total_credited_usd": 1100,
  "pay_currency": "usd"
}
```

`package` is `null` when you send `amount_usd` instead of a slug — read the
top-level `amount_usd`, `bonus_usd` and `total_credited_usd`, which are
populated on both paths.

The `bonus_usd` here is a quote. The grant itself is recomputed server-side from
the same ladder when Stripe confirms the payment, so nothing in the checkout
metadata can raise it. Capture writes two ledger rows you can see in
`GET /v1/billing/transactions`: a `top_up` for what you paid and a
`top_up_bonus` for the bonus.

Because the wallet is credited from the resolved USD amount rather than from
what Stripe actually collected, exchange-rate movement between quote and
settlement never desyncs your balance. Polish customers can pass
`"pay_currency": "pln"` to unlock BLIK and Polish bank transfer alongside
card, while the wallet still receives the USD amount.

---

### GET /v1/billing/transactions

Paginated wallet ledger — charges, refunds, top-ups.

**Authentication:** API Key (Bearer token)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-based) |
| `pageSize` | integer | 50 | Rows per page (max 200) |
| `type` | string | — | Filter by transaction type |

```json
{
  "data": [
    {
      "id": "8f2c1e04-...",
      "created_at": "2026-08-06T09:14:22Z",
      "type": "deduction",
      "amount_pln": null,
      "amount_usd": -0.0563,
      "description": "generate_image (seedream-5-0-260128)",
      "metadata": { "operation": "generate_image" }
    },
    {
      "id": "3ab77d51-...",
      "created_at": "2026-07-02T11:03:47Z",
      "type": "deduction",
      "amount_pln": 0.21,
      "amount_usd": null,
      "description": "generate_image (flux-2-pro)",
      "metadata": { "operation": "generate_image" }
    }
  ],
  "page": 1,
  "page_size": 50
}
```

::: warning Two currencies in one history
Rows written before the 2026-08-05 USD cutover carry `amount_pln` with
`amount_usd: null`; rows after it are the reverse. **Branch on which field is
non-null — never sum the two together**, and never treat a null as zero when
totalling. Amounts are signed: negative is a charge, positive is a top-up or
refund. The response has no `total` or `has_more`: page until you get fewer
rows than `page_size`.
:::

---

### POST /v1/billing/estimate

Price a batch of operations in USD before running them — see
[SDK: Estimate Cost](/sdk/typescript#estimate-cost) for the full request/response
shape and worked examples.

## Hard Spending Limits

Set an optional monthly USD cap with `PUT /v1/billing/overage-limit`, scoped
to the whole account or to one project. Once reached, further wallet charges
fail with `402` — this is a self-imposed ceiling *below* your balance, not a
credit line above it.

```bash
curl -X PUT "https://apis.fotohub.app/v1/billing/overage-limit" \
  -H "Authorization: Bearer YOUR_SESSION_JWT" \
  -H "Content-Type: application/json" \
  -d '{"hard_limit_usd": 120}'

# Cap a single project instead
curl -X PUT "https://apis.fotohub.app/v1/billing/overage-limit" \
  -H "Authorization: Bearer YOUR_SESSION_JWT" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "YOUR_PROJECT_ID", "hard_limit_usd": 120}'
```

::: warning This endpoint needs a session JWT, not an API key
Unlike the rest of the billing endpoints, `PUT /v1/billing/overage-limit`
authenticates with your dashboard session token. An `fh_live_*` API key
is rejected with `401` — changing your own spending cap is an
account-level action, not delegated to API keys. (There is no `fh_test_*`
prefix — every FOTOhub API key is `fh_live_*`; see [Authentication](/api/authentication).)
:::

A project-level limit takes precedence over the account-level one when the
request is attributed to that project. Pass `0` or `null` to disable — the
response then reads back `"hard_limit_usd": null` rather than `0`. A negative
or non-numeric value is rejected with `400` and the previously stored limit
is left untouched.

::: tip "Overage" is the wrong word, kept for one release
The response still exposes an `overage` block under
[`GET /v1/billing/balance`](#get-v1-billing-balance) alongside `spend`, with
the same numbers under the old key names. There is no overage on a prepaid
account — spending past the balance is declined, not billed — but the field
is kept one release so an SDK still reading `overage.spent_this_month`
doesn't break.
:::

## API Plans — retired

**Paid API subscription plans were retired on 2026-08-13.**
`POST /v1/tiers/subscribe` now answers `410` with
`{"error": "api_subscriptions_retired"}` for every tier, and
`GET /v1/billing/plans` (and `api_plans` in
[`GET /v1/billing/pricing`](#get-v1-billing-pricing)) return an empty array. The
key is kept rather than removed so a client that indexes it doesn't raise.

Nothing is lost: a plan never funded a call. Every call was always charged to the
prepaid USD wallet, so a subscriber with a `$0` balance got `402` exactly like
someone on no plan.

**Rate limits now follow your wallet, for free.** Balance and lifetime spend
unlock throughput automatically — see [Rate Limits](/api/rate-limits) and
`GET /v1/tiers/catalog`, where `billing_cycle` reads `prepaid`:

| Tier | Price | Unlocks at | Rate limit | Storage |
|------|-------|-----------|-----------|---------|
| `payg-basic` | Free | Wallet only | 30 rpm | 5 GB |
| `payg-standard` | Free | $25 balance or $50 lifetime spend | 120 rpm | 50 GB |
| **`payg-premium`** | **Free** | **$120 balance or $500 lifetime spend** | **500 rpm** | **200 GB** |
| `sub-enterprise` | Custom | By application | 5,000 rpm | Unlimited |

So a top-up is the only upgrade path — and it is the cheaper one, since from $500
up it also earns a [volume bonus of 5–20%](#get-v1-billing-topup-packages) in
extra spendable dollars, which a monthly fee never did. For above `payg-premium`,
apply via `POST /v1/tiers/enterprise/apply`.

The retired `sub-developer` / `sub-startup` / `sub-business` slugs still resolve
for accounts that held one before the cutover, and those accounts keep their
limits. Every one now reports `price_monthly: null` and `purchasable: false`.

::: warning Legacy plan rows still carry a `credits_monthly` grant
It is spendable only inside the fotohub.app web app's own subscription
system — never on this API. `null` means unlimited on that plan; it never
means "no credits, but the wallet covers it." Ignore the field when deciding
whether a call will succeed; only `wallet.balance_usd` decides that.
:::

## Code Examples

### Check Balance

::: code-group

```bash [cURL]
curl -X GET "https://apis.fotohub.app/v1/billing/balance" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

```python [Python]
import requests

response = requests.get(
    "https://apis.fotohub.app/v1/billing/balance",
    headers={"Authorization": "Bearer YOUR_API_KEY"}
)

balance = response.json()
print(f"Balance: ${balance['wallet']['balance_usd']:.4f}")
print(f"Spent this month: ${balance['spend']['this_month_usd']:.2f}")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/billing/balance", {
  headers: { "Authorization": "Bearer YOUR_API_KEY" }
});

const balance = await response.json();
console.log(`Balance: $${balance.wallet.balance_usd.toFixed(4)}`);
console.log(`Spent this month: $${balance.spend.this_month_usd.toFixed(2)}`);
```

:::

### Get Pricing Catalog

::: code-group

```bash [cURL]
# Public endpoint — no auth required
curl -X GET "https://apis.fotohub.app/v1/billing/pricing"
```

```python [Python]
import requests

response = requests.get("https://apis.fotohub.app/v1/billing/pricing")
pricing = response.json()

for model_id, info in pricing["pricing"]["image_generation"]["models"].items():
    print(f"{model_id}: ${info['price']}")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/billing/pricing");
const pricing = await response.json();

const imageModels = pricing.pricing.image_generation.models;
for (const [modelId, info] of Object.entries(imageModels)) {
  console.log(`${modelId}: $${info.price}`);
}
```

:::

### List Transactions

::: code-group

```bash [cURL]
curl -X GET "https://apis.fotohub.app/v1/billing/transactions?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

```python [Python]
import requests

response = requests.get(
    "https://apis.fotohub.app/v1/billing/transactions",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    params={"page": 1, "pageSize": 10},
)

rows = response.json()["data"]

# Post-cutover rows carry amount_usd; older ones carry amount_pln. Keep the
# two apart -- adding them would produce a figure in no currency at all.
spend_usd = sum(r["amount_usd"] for r in rows if r["amount_usd"] is not None)
spend_pln = sum(r["amount_pln"] for r in rows if r["amount_usd"] is None)
print(f"Last {len(rows)} transactions: ${spend_usd:.2f} USD", end="")
if spend_pln:
    print(f" + {spend_pln:.2f} PLN (pre-cutover)", end="")
print()
```

```typescript [TypeScript]
const params = new URLSearchParams({ page: "1", pageSize: "10" });

const response = await fetch(
  `https://apis.fotohub.app/v1/billing/transactions?${params}`,
  { headers: { "Authorization": "Bearer YOUR_API_KEY" } }
);

const { data } = await response.json();

// Never sum amount_usd and amount_pln together — see the warning above.
const spendUsd = data
  .filter(r => r.amount_usd !== null)
  .reduce((sum, r) => sum + r.amount_usd, 0);
console.log(`${data.length} transactions, $${spendUsd.toFixed(2)} USD`);
```

:::

### Top Up Wallet

::: code-group

```bash [cURL]
# $1,000 charged, $1,100 credited (10% volume bonus)
curl -X POST "https://apis.fotohub.app/v1/billing/topup" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"package": "scale-1000"}'

# A custom amount earns the same bonus: $2,500 credits $2,825 (13%)
curl -X POST "https://apis.fotohub.app/v1/billing/topup" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount_usd": 2500}'

# Same amount credited, charged in PLN (BLIK, card, bank transfer)
curl -X POST "https://apis.fotohub.app/v1/billing/topup" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"package": "scale-1000", "pay_currency": "pln"}'
```

```python [Python]
import math
import requests

# Quote any amount against the live ladder instead of hardcoding it.
ladder = requests.get(
    "https://apis.fotohub.app/v1/billing/topup/packages"
).json()

def bonus_for(amount_usd: float) -> float:
    # bonus_tiers is ordered highest-first; the first match wins.
    for tier in ladder["bonus_tiers"]:
        if amount_usd >= tier["min_usd"]:
            return math.floor(amount_usd * tier["pct"] * 100) / 100
    return 0.0

print(f"$2,500 would earn +${bonus_for(2500):,.2f}")  # +$325.00

response = requests.post(
    "https://apis.fotohub.app/v1/billing/topup",
    headers={
        "Authorization": "Bearer YOUR_JWT_TOKEN",
        "Content-Type": "application/json"
    },
    json={"package": "scale-1000"}
)

result = response.json()
print(f"Checkout URL: {result['checkout_url']}")
print(f"Charge: ${result['amount_usd']:,.2f} in {result['pay_currency'].upper()}")
print(f"Volume bonus: +${result['bonus_usd']:,.2f}")
print(f"Lands in the wallet: ${result['total_credited_usd']:,.2f}")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/billing/topup", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json"
  },
  // Or { amount_usd: 2500 } for a custom amount — same bonus ladder.
  body: JSON.stringify({ package: "scale-1000" })
});

const result = await response.json();
// $1,000 charged, $1,100 credited — show the customer what they gain.
console.log(`+$${result.bonus_usd} bonus, $${result.total_credited_usd} total`);
// Redirect user to complete payment
window.location.href = result.checkout_url;
```

:::

## Webhook Events

Set up [webhooks](/api/webhooks) to get notified about billing events. Every
payload uses the same envelope: `event`, `timestamp`, `data`, and `attempt`
(the delivery attempt number, starting at 1).

### `billing.charged`

Fired whenever a wallet USD charge succeeds.

```json
{
  "event": "billing.charged",
  "timestamp": "2026-08-06T14:30:00Z",
  "attempt": 1,
  "data": {
    "operation": "generate_image",
    "amount_usd": 0.0563,
    "method": "wallet"
  }
}
```

### `billing.insufficient_funds`

Fired on a `402` — the wallet could not cover the request. Carries the same
`required_usd` / `balance_usd` figures as the HTTP error body, so a partner
learns their wallet stopped a request without parsing the refused call's
own response.

### `billing.refunded`

Fired when a charge is reversed — a provider call failed after billing and the
wallet was credited back.

### `billing.unfunded`

Rare: a reserved-then-settled operation whose real cost exceeded both the
hold and the balance, leaving an uncollected shortfall. Always the platform's
own reconciliation problem, surfaced rather than hidden.

### `generation.refunded`

A failed generation's charge was reversed. Carries `cost_usd` and `job_id`,
so it reconciles against the `billing.charged` that preceded it.

::: warning `credits.low` and `credits.depleted` are web-app-only
Both event names are still accepted by the webhook subscription list because
the same `integration_webhooks` table serves fotohub.app's own credit-based
subscriptions. They fire from the web app's paths, never from this API — an
API-only integration should subscribe to the `billing.*` events above
instead.
:::

::: tip Webhook Configuration
Configure webhook endpoints in your dashboard under **Settings > Webhooks**.
All webhook payloads are signed with your webhook secret for verification.
See the [Webhooks documentation](/api/webhooks) for setup details.
:::
