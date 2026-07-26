# Integrations

Connect FOTOhub AI to your store or CMS. Generate product photography, remove and replace backgrounds, write product copy, and process an entire catalog without leaving your admin.

## Supported platforms

| Platform | Type | Bulk jobs | Draft review | Descriptions | Variants | Status |
|----------|------|:---------:|:------------:|:------------:|:--------:|--------|
| [Magento 2](/integrations/magento) | Composer module | yes | yes | yes | yes | Stable |
| [WooCommerce](/integrations/woocommerce) | WordPress plugin | yes | yes | yes | yes | Stable |
| [WordPress](/integrations/wordpress) | Plugin | yes | yes | yes | — | Stable |
| [PrestaShop](/integrations/prestashop) | PS 8 module | yes | yes | yes | yes | Stable |
| [Shopify](/integrations/shopify) | TS library + embedded app | yes | yes | yes | yes | Beta |
| [BigCommerce](/integrations/bigcommerce) | Node app | yes | yes | yes | yes | Beta |
| [Shoper](/integrations/shoper) | Node app | yes | yes | yes | — | Beta |
| [n8n](/integrations/n8n) | Community node | yes | — | yes | — | Beta |
| [MCP](/integrations/mcp) | AI assistants | — | — | yes | — | Stable |
| [Zapier / Make](/integrations/zapier) | Webhooks | — | — | — | — | Planned |

**Also covered without extra work:** Adobe Commerce Cloud uses the same APIs as Magento Open Source, so the Magento module works there. Shopify Plus uses the same Admin API as standard Shopify.

## How it works

Every integration is a thin client over one shared backend, the **Commerce Bridge**. The plugin knows how to read and write its own platform; the bridge owns everything else.

```
  Your store admin                Commerce Bridge                FOTOhub core
┌────────────────────┐        ┌──────────────────────┐        ┌────────────────┐
│ product picker     │──REST─▶│ queue + fan-out      │──HTTP─▶│ image models   │
│ preset selector    │        │ per-item retry       │        │ LLM copy       │
│ progress UI        │◀─poll──│ preset library       │        │ billing        │
│ draft review       │        │ cost preflight       │        └────────────────┘
│ write-back         │◀─hook──│ signed callbacks     │
└────────────────────┘        └──────────────────────┘
```

That split is why every platform behaves the same way: the same presets, the same credit costs, the same retry semantics. Preset and pricing updates reach every store without a plugin release.

If you are building your own integration, the bridge is a documented public API — see the [Commerce Bridge reference](/integrations/commerce-bridge).

## What every integration gives you

**Bulk with a safety net.** Submit up to 500 products per job. Each product is processed independently, so one bad SKU does not sink the batch. Failed items retry on their own, and **Retry failed only** never charges you twice for products that already succeeded.

**Cost known upfront.** Before a job starts you see *"N products × M images = X credits, you have Y"*. If your balance is short you get a clear refusal instead of a run that dies halfway through your catalog. When credits do run out mid-job, the batch parks itself rather than charging item by item — top up and retry to resume.

**Nothing goes live unreviewed.** Results land as drafts. Images show a before/after comparison, copy shows a word-level diff against the current text. Approve individually or in bulk. Approval is the only write path, so a bad preset costs credits but never damages your catalog.

**Copy that matches the product.** Descriptions are generated from real product data — title, category, attributes, price — in 6 tones and 3 languages (English, Polish, German), covering title, short and long description, SEO meta, alt text, FAQ and JSON-LD.

## Preset library

Presets compose along orthogonal axes instead of being a flat list of prompts, so you can recombine looks rather than pick one canned result. All 63 presets ship with both English and Polish names.

| Category | Count | Examples |
|----------|-------|----------|
| Bundles | 8 | `fashion-studio`, `jewelry-luxury`, `food-appetizing` |
| Backgrounds | 14 | `pure-white`, `marble-surface`, `linen-fabric` |
| Scenes | 12 | `kitchen-counter`, `outdoor-nature`, `christmas-seasonal` |
| Lighting | 8 | `soft-studio-softbox`, `golden-hour`, `dramatic-low-key` |
| Composition | 9 | `hero-three-quarter`, `top-down-flat-lay`, `ghost-mannequin` |
| Channels | 6 | `amazon-main`, `allegro-pl`, `instagram-feed` |
| Tones | 6 | `tone-professional`, `tone-luxury`, `tone-technical` |

Channel presets carry hard constraints, so output is marketplace-compliant by construction: `amazon-main` enforces 1:1 at 1000 px minimum on pure white with no props or text. Full list in the [bridge reference](/integrations/commerce-bridge#preset-library).

## Models

The same catalog is available everywhere:

| Model | Credits | Best for |
|-------|---------|----------|
| `seedream-5-0-260128` | 2 | Default. Strong quality at low cost, up to 4K |
| `dola-seedream-5-0-pro-260628` | 3 | Highest detail and prompt adherence |
| `gpt-image-2` | 2 | Text rendering in images |
| `nano-banana-pro` | 5.3 | Premium photorealism |
| `nano-banana-fast` | 2 | Fast iteration |
| `imagen-4-standard` | 3 | Photorealistic product shots |
| `imagen-4-ultra` | 5 | Native 4K |
| `imagen-4-fast` | 2 | Budget batches |

See the [models catalog](/api/models) for capabilities and the full platform inventory.

## Getting started

1. **Get an API key** at [fotohub.app/console](https://fotohub.app/console)
2. **Install the integration** for your platform from the table above
3. **Connect** — paste the key, the plugin validates it and shows your balance
4. **Try a small batch first** — three or four products, so you can judge a preset before committing credits to the whole catalog
5. **Review the drafts**, approve what works, and scale up

::: tip Validate presets on a handful of products
Presets behave differently across product categories. A ten-product trial costs a few credits and tells you far more than reading preset names.
:::

## Roadmap

These platforms are researched and planned but **not yet available**:

| Platform | Note |
|----------|------|
| BaseLinker | Multichannel hub — reaches Allegro, Amazon, eBay, Empik and others through one integration |
| Allegro | Direct marketplace integration with per-locale listing translations |
| Wix Stores | Catalog V3 |
| Etsy | Requires Etsy commercial API access |
| IdoSell | Polish platform |
| Squarespace Commerce | Requires a Commerce Advanced plan |
| Shopware 6 | DACH market |
| Zapier / Make | Webhook-driven automation |

Need one of these sooner, or a platform not listed? The [Commerce Bridge API](/integrations/commerce-bridge) is public and documented — you can build against it today, and headless stacks (Saleor, Medusa, Vendure and similar) can register as a `custom` platform.

## Building your own

- **[Commerce Bridge API](/integrations/commerce-bridge)** — bulk jobs, presets, webhooks
- **[Python SDK](/sdk/python)** — `pip install fotohub`
- **[TypeScript SDK](/sdk/typescript)** — `npm install fotohub`
- **[PHP SDK](/sdk/php)** — `composer require fotohub/fotohub-php`
- **[REST API](/api/getting-started)** — direct HTTP

All integration source is public at [github.com/fotohubapp](https://github.com/fotohubapp).
