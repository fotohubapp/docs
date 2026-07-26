# BigCommerce

Bulk AI product photography and descriptions for BigCommerce stores, built on the V3 Catalog API and the FOTOhub Commerce Bridge.

::: info What it does
- **Bulk product photos** — filter your catalog, pick a preset, run one job
- **AI descriptions** in 6 tones and 3 languages, including SEO page title and meta description
- **Draft-first review** — results are held as metafields until you approve them
- **Variant images** for products with options
- **Adaptive rate limiting** driven by the headers BigCommerce returns, not a fixed delay
- **Scheduled jobs** for recurring catalog work
:::

## Requirements

| | |
|---|---|
| Store | Any BigCommerce plan with API account access |
| Node.js | 20 or newer |
| FOTOhub | An API key from [fotohub.app/console](https://fotohub.app/console) |

## Creating a store API account

1. In your BigCommerce control panel go to **Settings → API → Store-level API accounts**
2. **Create API account**, type **V2/V3 API token**
3. Grant these OAuth scopes:

| Scope | Access | Why |
|-------|--------|-----|
| Products | modify | Read the catalog, write descriptions, attach images |
| Product images | modify | Included in the Products scope on current API versions |

4. Save and copy the **Access Token** and **Store Hash** — the token is shown only once

::: tip Least privilege
Products is the only scope the app needs. Do not grant orders, customers or payments.
:::

## Installation

```bash
git clone https://github.com/fotohubapp/bigcommerce-app.git
cd bigcommerce-app
npm install
cp .env.example .env
# fill in .env
npm run build
npm start
```

The admin UI is served at `PUBLIC_URL` (default `http://localhost:3000`).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BC_STORE_HASH` | yes | Store hash from your API account |
| `BC_ACCESS_TOKEN` | yes | Access token from your API account |
| `FOTOHUB_API_KEY` | yes | Your `fh_live_` key |
| `FOTOHUB_CONFIG_SECRET` | yes | Encrypts stored credentials on disk |
| `FOTOHUB_API_ROOT` | no | API base, defaults to `https://apis.fotohub.app` |
| `PUBLIC_URL` | no | Public address of this app, used for the webhook URL |
| `HOST` / `PORT` | no | Listen address, defaults to `127.0.0.1:3000` |
| `ALLOWED_HOSTS` | no | Host allowlist when running behind a proxy |
| `TRUST_PROXY` | no | Set when terminating TLS upstream, so client IPs are read correctly |
| `SCHEDULER_ENABLED` | no | Enable recurring jobs |
| `FOTOHUB_IMAGE_HOSTS` | no | Extra hosts allowed as image sources |
| `LOG_LEVEL` | no | `debug`, `info`, `warn`, `error` |

::: warning FOTOHUB_CONFIG_SECRET
Credentials are encrypted with this secret. Losing or changing it means reconnecting the store. Set it once and keep it with your other deployment secrets.
:::

## Connecting the store

1. Open the app
2. Enter your FOTOhub API key — **Validate** shows your live credit balance
3. Enter the store hash and access token
4. **Connect** — the app registers a connection with the Commerce Bridge and stores the webhook secret

**Test connection** in Settings verifies both BigCommerce and FOTOhub in one call.

## Screens

| Screen | Purpose |
|--------|---------|
| Dashboard | Credits, active jobs, pending drafts, products missing descriptions |
| Product photos | Bulk job wizard for images |
| Descriptions | Wizard for copy: title, descriptions, SEO meta, alt text |
| Jobs | Progress with per-item detail and retry |
| Drafts | Review queue with before/after and text diff |
| Presets | Shared preset library |
| Schedules | Recurring jobs |
| Settings | Credentials, defaults, connection health |
| MCP | Claude Desktop and Cursor configuration |

## Selecting products

The product table reads the V3 catalog with filters for:

- **Keyword** search
- **Category** and **brand**
- **Missing description**
- **Image count** below a threshold
- **Availability** and visibility

Paging uses BigCommerce cursors, and **Select all matching** covers the whole filtered set rather than the visible page.

## Cost preflight

Before a job runs, the wizard calls the estimate endpoint and shows *"N products × M images = X credits, you have Y"*. Submission is blocked when your balance is short, so a run never dies partway through the catalog.

## Reviewing drafts

Results are stored as metafields in the `fotohub` namespace rather than written to products.

- **Images** — before/after comparison slider with keyboard support
- **Copy** — old and new text side by side with word-level diff
- **Approve** — writes to BigCommerce: images attached via remote `image_url`, copy to `description`, `page_title` and `meta_description`, alt text to the image description
- **Reject** — removes the draft metafield

Approval is transactional: the write to BigCommerce happens before the draft is marked approved, so a network failure cannot leave a draft marked applied when it was not. Drafts are deduplicated on the bridge item ID, so re-importing the same result twice will not double-apply it.

FAQ blocks and JSON-LD structured data, when generated, are stored as metafields you can render in your theme.

## Image attachment

BigCommerce fetches remote images itself, so the app passes the generated image URL to `POST /catalog/products/{id}/images` rather than proxying bytes. That keeps approval fast even for large batches. Source URLs are validated against an allowlist before being sent.

## Rate limiting

BigCommerce returns `X-Rate-Limit-Requests-Left` and `X-Rate-Limit-Time-Reset-Ms` on every response. The client reads those and throttles adaptively instead of sleeping a fixed amount, so it uses the headroom your plan actually has and backs off when it runs low. `429` responses are retried with exponential backoff.

The Commerce Bridge additionally spreads job dispatch so one bulk run cannot saturate your store's allowance — see [rate budgets](/integrations/commerce-bridge#rate-budgets).

## Workflows

For automation without the UI, the package exposes typed workflows:

```typescript
import { runJob, waitForJob } from "@fotohub/bigcommerce";

// Generate one photo per product for a filtered selection
const handle = await runJob("image_generate", {
  categories: [23],
  missingDescription: false,
}, {
  preset: "electronics-clean",
  model: "seedream-5-0-260128",
  numImages: 1,
});

const result = await waitForJob(handle, {
  onProgress: ({ done, total, failed }) =>
    console.log(`${done}/${total} done, ${failed} failed`),
});
```

Available job kinds: `image_generate`, `image_edit`, `bg_remove`, `bg_replace`, `upscale`, `recolor`, `description`, `alt_text`, `complete_listing`. Costs and options are documented in the [Commerce Bridge reference](/integrations/commerce-bridge#job-kinds).

## Scheduled jobs

With `SCHEDULER_ENABLED` set, the Schedules screen can run recurring work such as:

- Generate descriptions for products added since the last run
- Generate alt text for images that have none

Each schedule carries a per-run credit cap, so a runaway schedule cannot drain your balance. Last-run time and outcome are shown per schedule.

## App API

The UI is backed by these endpoints.

| Endpoint | Description |
|----------|-------------|
| `GET /api/status` | App state and CSRF token |
| `GET /api/settings` | Configuration without secrets |
| `POST /api/connect` / `POST /api/disconnect` | Store connection |
| `GET /api/health` | BigCommerce and FOTOhub health |
| `GET /api/dashboard` | Dashboard data |
| `GET /api/store` | Store info |
| `GET /api/products` | Catalog with filters and cursor paging |
| `GET /api/categories` / `GET /api/brands` | Taxonomy for filters |
| `GET /api/presets` | Preset library |
| `POST /api/estimate` | Cost preflight |
| `GET`, `POST /api/jobs` | List and create jobs |
| `GET /api/batches` | Grouped job batches |
| `GET /api/drafts` | Drafts, approve and reject |
| `GET /api/credits` | Credit balance |
| `GET`, `POST /api/schedules` | Recurring jobs |
| `POST /api/webhooks` | Bridge callback receiver |
| `GET /api/mcp-config` | MCP configuration snippet |
| `POST /api/language` | Switch UI language |

Mutating requests require an `X-CSRF-Token` header with the token from `/api/status`.

## Security

- The API key and access token are encrypted at rest and never logged or returned by the API
- Bridge webhooks are verified with HMAC-SHA256 and replay protection
- CSRF tokens on all mutating requests
- Per-IP rate limiting on write routes
- Product-derived strings are escaped before rendering — product titles are attacker-controlled input

::: danger Do not expose the app publicly without protection
It holds credentials for your store and your FOTOhub credits. It listens on `127.0.0.1` by default. If you expose it, put HTTPS and authentication in front, and set `TRUST_PROXY` and `ALLOWED_HOSTS`.
:::

## Managing your catalog from an AI assistant

The MCP screen provides a ready-to-copy configuration:

```json
{
  "mcpServers": {
    "fotohub": {
      "url": "https://apis.fotohub.app/mcp/",
      "headers": { "Authorization": "Bearer fh_live_your_api_key" }
    }
  }
}
```

See the [MCP integration guide](/integrations/mcp) for the full tool list.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| "Invalid or revoked API key" | Key must start with `fh_live_` and be active in the console |
| BigCommerce `401` | Token or store hash wrong, or the API account was deleted |
| BigCommerce `403` | The API account lacks the Products modify scope |
| No products listed | Filters too narrow, or the token lacks catalog access |
| Job stays queued | Check `/api/health`; large jobs are dispatched gradually on purpose |
| Drafts stay pending after approve | The write to BigCommerce failed — the error is shown on the item |
| `402` insufficient credits | Top up, then use **Retry failed only** |
| Image approved but not visible | BigCommerce processes remote images asynchronously; refresh after a moment |
| `429` from BigCommerce | Expected under load — the client backs off and continues |

Set `LOG_LEVEL=debug` for verbose logging while diagnosing.

## Related

- [Commerce Bridge API](/integrations/commerce-bridge) — the job, preset and webhook contract
- [Models catalog](/api/models) — every model with pricing
- [Integrations overview](/integrations/overview) — all supported platforms
