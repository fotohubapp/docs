# Magento 2 Module

Bulk AI product photography and descriptions for Adobe Commerce and Magento Open Source, built on Magento's native Bulk Operations framework.

::: info What it does
- **Bulk product photos** from the product grid — select products, pick a preset, run
- **AI descriptions** with tone and language control (English, Polish, German)
- **Draft-first review** — nothing touches a live product until an admin approves it
- **Native bulk operations** — jobs appear in **System → Bulk Actions** with Magento's own retry
- **Variant images** for configurable products
- **CLI and cron** for scheduled catalog work
:::

## Requirements

| | |
|---|---|
| Magento | 2.4.6 or newer (Open Source or Adobe Commerce) |
| PHP | 8.1 or newer |
| FOTOhub | An API key from [fotohub.app/console](https://fotohub.app/console) |

The module also works on **Adobe Commerce Cloud** — it uses the same REST and GraphQL APIs as Open Source.

## Installation

### Via Composer (recommended)

```bash
composer require fotohub/module-ai
bin/magento module:enable FotoHub_AI
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento cache:flush
```

### Manual

Copy the module into `app/code/FotoHub/AI`, then:

```bash
bin/magento module:enable FotoHub_AI
bin/magento setup:upgrade
bin/magento setup:di:compile   # required in production mode
bin/magento cache:flush
```

Verify it registered:

```bash
bin/magento module:status FotoHub_AI
```

Two tables are created: `fotohub_job` (job tracking) and `fotohub_draft` (pending results awaiting approval).

## Configuration

**Stores → Configuration → FOTOhub AI** (or **FOTOhub AI → Settings** in the module menu).

| Field | Description |
|-------|-------------|
| `enabled` | Master switch for the module |
| `api_key` | Your `fh_live_` key. Stored encrypted using Magento's `Encrypted` backend model. |
| `bridge_url` | Commerce Bridge base URL. Default `https://apis.fotohub.app` |
| `default_model` | Image model preselected in the wizard |
| `default_preset` | Preset preselected in the wizard |
| `default_language` | `en`, `pl` or `de` for generated copy |
| `default_tone` | Brand voice for generated copy |
| `brand_rules` | Free-text instructions applied to all copy: banned words, required claims, length |
| `enable_auto_alt` | Generate alt text automatically for new product images |
| `poll_enabled` | Let cron poll the bridge for finished work |
| `auto_approve` | Skip the draft step and apply results directly. Off by default. |
| `timeout` | HTTP timeout in seconds for bridge calls |
| `debug` | Verbose logging to `var/log/` |

::: warning auto_approve bypasses review
Leave `auto_approve` off unless you have already validated your presets on a small batch. With it on, generated images and copy are written straight onto live products.
:::

Set values from the CLI instead of the admin if you prefer:

```bash
bin/magento config:set fotohub_ai/general/bridge_url https://apis.fotohub.app
bin/magento config:set fotohub_ai/general/default_model seedream-5-0-260128
bin/magento config:set fotohub_ai/general/default_preset fashion-studio
bin/magento cache:flush
```

The API key is encrypted, so set it through the admin UI, or use an environment override in `app/etc/env.php` if your deployment pipeline manages secrets.

## Permissions

The module declares these ACL resources — grant them under **System → Permissions → User Roles**:

| Resource | Grants |
|----------|--------|
| `FotoHub_AI::fotohub` | Access to the FOTOhub AI menu |
| `FotoHub_AI::generate` | Submit bulk jobs |
| `FotoHub_AI::jobs` | View and manage jobs |
| `FotoHub_AI::drafts` | Approve or reject generated results |
| `FotoHub_AI::config` | Change module configuration |

Separating `generate` from `drafts` lets you have staff who can run jobs but not publish results.

## Admin menu

| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `fotohub/dashboard/index` | Credit balance, recent jobs, connection health, MCP setup |
| Bulk Generate | `fotohub/generate/index` | The 5-step job wizard |
| Jobs | `fotohub/job/index` | Job grid with per-item detail |
| Drafts | `fotohub/draft/index` | Review queue with approve and reject |
| Settings | Stores → Configuration → FOTOhub AI | Configuration |

## Generating from the product grid

The fastest route is the product grid mass action.

1. **Catalog → Products**
2. Filter to the products you want — for example everything in a category, or products with no description
3. Tick them, then choose **Generate with FOTOhub AI** from the Actions menu
4. The wizard opens with your selection preloaded

### The wizard

| Step | What you choose |
|------|-----------------|
| 1. Products | Confirm the selection carried over from the grid |
| 2. Operation | What to generate — see the operations table below |
| 3. Model and preset | Image model plus a preset from the shared library |
| 4. Options | Aspect ratio, images per product, or for copy: tone, language and which fields |
| 5. Review | Credit estimate against your balance, then submit |

The estimate is live: it shows *"N products × M images = X credits, you have Y"* and blocks submission when your balance is short, so a job never dies halfway through a catalog.

### Operations

| Operation | Produces | Credits per product |
|-----------|----------|---------------------|
| Generate image | A new product photo from the preset | 2–5.3 depending on model |
| Edit image | An edited version of an existing photo | 2–5.3 |
| Remove background | Transparent cutout | 2 |
| Replace background | New background: colour, image or scene | 4 |
| Upscale | Higher resolution | 1 |
| Recolour | Colourway variant without a reshoot | 3 |
| Description | Title, descriptions and SEO meta | 1 |
| Alt text | Accessibility text from the image | 1 |
| Complete listing | Images, copy and alt text together | sum of the above |

Presets, models and pricing are shared across every FOTOhub integration — see the [Commerce Bridge reference](/integrations/commerce-bridge#preset-library) for the full library and the [models catalog](/api/models) for capabilities.

## Reviewing drafts

Results land in **FOTOhub AI → Drafts** rather than on your products.

- **Images** show a before and after comparison
- **Copy** shows the current text beside the generated text
- **Approve** writes the result to the product: images are added to the gallery, copy to the relevant attributes, alt text to the gallery entry label
- **Reject** discards it

Approve individually or select several and use the grid mass action. Because approval is the only write path, a bad preset costs you credits but never damages your catalog.

For configurable products, per-variant jobs write to the matching child product's image on approval.

## Jobs and Bulk Operations

Jobs use Magento's native Bulk Operations framework, so they appear in **System → Bulk Actions** alongside your other bulk work, with Magento's built-in retry.

Failure handling distinguishes two cases:

- **Retriable** — a rate limit or timeout from the AI provider. Magento can retry these.
- **Not retriable** — an invalid SKU or a product with no source image. Retrying will not help, so the item is marked failed with a reason.

**FOTOhub AI → Jobs** adds a per-item view: status, SKU, error text, and a **Retry failed only** action so you never pay again for products that already succeeded.

## CLI

Two commands are registered:

```bash
# Poll the bridge for finished work and import results as drafts
bin/magento fotohub:jobs:sync

# Submit a job without the admin UI
bin/magento fotohub:generate --sku=SKU-1 --sku=SKU-2 \
  --kind=image_generate \
  --preset=fashion-studio \
  --model=seedream-5-0-260128
```

Run `bin/magento fotohub:generate --help` for the full option list.

## Cron

The module registers `fotohub_ai_poll_jobs` on the default group, running every minute (`* * * * *`). It polls in-flight jobs, imports completed items as drafts, and posts an admin notification when a job finishes.

Confirm Magento cron is running:

```bash
bin/magento cron:run --group=default
```

Cron polling can be switched off with the `poll_enabled` setting if you would rather rely on webhooks.

## Webhook callbacks

The module exposes a REST endpoint for bridge events:

```
POST <your-store>/rest/V1/fotohub/callback
```

It verifies the `X-FotoHub-Signature` header — an HMAC-SHA256 of the raw body keyed by the connection's callback secret — and rejects anything that does not match. Register the URL when connecting the store, and drafts appear without waiting for the next cron tick.

If your store is not reachable from the internet, leave the callback unset and rely on cron polling.

## Content Security Policy

The module ships a CSP whitelist entry for `apis.fotohub.app` and `s1.fotohub.app` (where generated images are served). If you have a custom restrictive policy, allow those hosts in `connect-src` and `img-src`.

## Managing your catalog from an AI assistant

The Dashboard page includes a ready-to-copy configuration for connecting Claude Desktop, Cursor or any MCP-capable assistant to FOTOhub:

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
| Menu missing after install | `bin/magento module:status FotoHub_AI`, then `setup:upgrade` and `cache:flush`. In production mode you also need `setup:di:compile`. |
| "Invalid or revoked API key" | Re-enter the key in Stores → Configuration → FOTOhub AI. Confirm it is active in the console and starts with `fh_live_`. |
| Jobs stay queued | Magento cron is not running, or `poll_enabled` is off. Run `bin/magento cron:run --group=default` and check `var/log/`. |
| Drafts never appear | The job may still be running — check FOTOhub AI → Jobs. If it completed, verify cron polling or the callback URL. |
| `402` insufficient credits | Top up in the console, then use **Retry failed only** on the job. The batch parked itself instead of charging item by item. |
| Images approved but not visible | Flush the cache and reindex: `bin/magento indexer:reindex catalog_product_price` and regenerate media if you use a CDN. |
| Bulk action absent from the grid | Clear generated code and flush: `rm -rf generated/* && bin/magento cache:flush`. |

Enable the `debug` setting for verbose logging while diagnosing.

## Related

- [Commerce Bridge API](/integrations/commerce-bridge) — the job, preset and webhook contract
- [Models catalog](/api/models) — every model with pricing
- [Integrations overview](/integrations/overview) — all supported platforms
