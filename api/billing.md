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
    {"slug": "topup-50", "name": "$15", "amount_usd": 15},
    {"slug": "topup-100", "name": "$25", "amount_usd": 25},
    {"slug": "topup-250", "name": "$60", "amount_usd": 60},
    {"slug": "topup-500", "name": "$120", "amount_usd": 120},
    {"slug": "topup-1000", "name": "$225", "amount_usd": 225},
    {"slug": "topup-5000", "name": "$1000", "amount_usd": 1000}
  ]
}
```

The slugs are historical (named after old PLN amounts before the 2026-08-05
USD cutover) and are stable identifiers — treat them as opaque and read
`amount_usd` for the real price. There is no bonus percentage and nothing
here is denominated in credits: a package credits exactly its `amount_usd` to
the wallet.

---

### POST /v1/billing/topup

Initiate a wallet top-up via Stripe Checkout. Returns a checkout URL.

**Authentication:** JWT (session token)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `package` | string | **Yes** | One of the slugs above |
| `pay_currency` | string | No | `usd` (default) or `pln`. Only changes what Stripe charges — the wallet is always credited `amount_usd` |

```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_live_...",
  "package": { "slug": "topup-250", "name": "$60", "amount_usd": 60 },
  "pay_currency": "usd"
}
```

Because the wallet is credited from the package's `amount_usd` rather than
from what Stripe actually collected, exchange-rate movement between quote and
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
authenticates with your dashboard session token. An `fh_live_*` / `fh_test_*`
key is rejected with `401` — changing your own spending cap is an
account-level action, not delegated to API keys.
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

## API Plans

API subscription plans buy **rate limits and model access** — never wallet
funds. Every call is still charged to the prepaid USD wallet, so a subscriber
on `api-business` with a `$0` balance gets `402` exactly like a subscriber on
no plan at all.

::: info Plans are priced in PLN
Wallet spending, per-request billing, and top-up packages are all USD. API
subscription plans are the one remaining PLN-denominated surface —
`price_pln` on each plan row.
:::

| Plan | Monthly Price | Rate Limit | Storage | Models |
|------|-------------|-----------|---------|--------|
| Free | 0 PLN | 10 rpm | 1 GB | 4 basic models |
| Developer | 49 PLN | 60 rpm | 10 GB | All standard |
| **Startup** | **199 PLN** | **300 rpm** | **100 GB** | **All models incl. premium** |
| Business | 799 PLN | 1,000 rpm | 500 GB | All + beta, SLA 99.9% |
| Enterprise | Custom | 5,000 rpm | Unlimited | Custom |

::: warning Each plan row still carries a `credits_monthly` grant
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
# Charged in USD (card, Link)
curl -X POST "https://apis.fotohub.app/v1/billing/topup" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"package": "topup-250"}'

# Same $60 credited, charged in PLN (BLIK, card, bank transfer)
curl -X POST "https://apis.fotohub.app/v1/billing/topup" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"package": "topup-250", "pay_currency": "pln"}'
```

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/billing/topup",
    headers={
        "Authorization": "Bearer YOUR_JWT_TOKEN",
        "Content-Type": "application/json"
    },
    json={"package": "topup-250"}
)

result = response.json()
pkg = result["package"]
print(f"Checkout URL: {result['checkout_url']}")
print(f"Crediting ${pkg['amount_usd']}, charged in {result['pay_currency'].upper()}")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/billing/topup", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ package: "topup-250" })
});

const result = await response.json();
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
