# WooCommerce Integration

The WooCommerce side of the FOTOhub AI plugin turns your catalog into batch AI work: pick products with real filters, choose an operation and a preset, see the cost before you commit, and review every result as a draft before it touches the store.

Bulk work does not run in your WordPress process. Batches are submitted to the [FOTOhub commerce bridge](/integrations/commerce-bridge), which paces the work, retries per item and posts signed callbacks back to your site.

| | |
|---|---|
| Plugin | FOTOhub AI — Creative Powerhouse 2.1.0 |
| Requires WooCommerce | 7.0 (tested to 9.4) |
| Requires WordPress / PHP | 6.0 / 8.0 |
| HPOS | Compatible — declared via `FeaturesUtil::declare_compatibility( 'custom_order_tables', … )` |
| Bridge base | `https://apis.fotohub.app/v1/commerce` |
| Platform identifier | `woocommerce` |
| Repository | [fotohubapp/wordpress-plugin](https://github.com/fotohubapp/wordpress-plugin) |

::: tip Everything on this page is greppable
Every menu slug, AJAX action, REST route, option key, table, capability and hook below exists in the plugin source. Anything not built is listed in [Planned](#planned).
:::

## Installation and connection

Install the [FOTOhub AI plugin](/integrations/wordpress). WooCommerce features activate automatically: `FotohubAI::init_hooks()` boots `Fotohub_Bulk` and `Fotohub_Video` when the `WooCommerce` class is present or `woocommerce/woocommerce.php` is in `active_plugins`. `Fotohub_Commerce` boots unconditionally, so an in-flight job can still deliver results after a plugin swap.

Connect from **WooCommerce → FOTOhub Bulk AI**:

1. Paste your API key. `ajax_connect` validates it against `GET /v1/billing/balance` before storing anything — a bad key never gets saved.
2. The plugin registers the store with the bridge: `POST /v1/commerce/connections` with `platform: "woocommerce"`, your `home_url()`, the site name, the callback URL, and a settings blob carrying the locale, WordPress version and WooCommerce version.
3. The returned `callback_secret` is stored encrypted in `fotohub_bridge_callback_secret`; the connection ID goes in `fotohub_bridge_connection_id` and the URL it was registered for in `fotohub_bridge_connection_host`.

If the site is later moved or cloned to a different URL, `Fotohub_Bridge::get_connection_id()` notices the host mismatch and re-registers, so a staging copy does not receive production callbacks.

**Check connection** on the dashboard runs `ajax_health`, which combines `GET /v1/commerce/health`, a balance call and the connection lookup, reporting `bridge_status`, `service`, `connection_id`, `credits`, `callback_url` and whether a callback secret is stored.

## Admin menu

| Menu path | Slug | Capability |
|-----------|------|-----------|
| WooCommerce → FOTOhub Bulk AI | `fotohub-commerce` | `manage_woocommerce` |
| WooCommerce → FOTOhub Drafts | `fotohub-drafts` | `manage_woocommerce` |
| FOTOhub AI → MCP & Assistants | `fotohub-ai-mcp` | `manage_options` |

`Fotohub_Commerce::register_menus()` attaches the first two under `woocommerce` when `Fotohub_Products::is_available()`, and falls back to the `fotohub-ai` parent when WooCommerce is absent, so the pages never orphan. Both page renderers additionally guard with `manage_woocommerce` **or** `manage_options` (`guard_page()`), and `wp_die()` otherwise.

The core plugin menu (Dashboard, Settings, Stability Tools, Analytics, Scheduler, Bulk Generate) is documented on the [WordPress page](/integrations/wordpress#admin-menu).

## The bulk wizard

**WooCommerce → FOTOhub Bulk AI** is a five-step wizard (`admin/views/commerce-page.php`, driven by `admin/js/commerce.js`).

### Step 1 — Choose products

Filters, all resolved server-side by `Fotohub_Products::query()`:

| Control | Field | Implementation |
|---------|-------|----------------|
| Search | `search` | `WP_Query` `s` |
| Category | `category` | `tax_query` on `product_cat` by term ID |
| Product type | `product_type` | `tax_query` on `product_type`; `simple`, `variable`, `grouped`, `external` |
| Fewer images than | `max_images` | `posts_clauses` filter joining `_thumbnail_id` and `_product_image_gallery`, counting featured + comma-separated gallery IDs |
| Price range | `min_price` / `max_price` | `meta_query` on `_price` as `DECIMAL(10,2)` |
| Missing description only | `missing_description` | `posts_clauses`: empty `post_content` or under 40 characters after trimming |

Products in `publish`, `draft`, `private` and `pending` are all listed. Paging is 20 per page by default (max 200), and the structural filters run through `posts_clauses` precisely so `found_posts` and `max_num_pages` stay correct — the count in the pager is the real count.

**Select all matching** sets `ids_only`, which returns every matching ID in one pass, capped at 2,000 so a runaway catalog cannot exhaust memory. Selection is capped again at submit time: `read_job_request()` slices `product_ids` to the first 500.

Each row shows the thumbnail, title, SKU, type, status, image count, whether it has a description, price and variation count (`Fotohub_Products::summarize()`).

### Step 2 — Operation

Nine operations, from `Fotohub_Commerce::get_operations()`. `needs_image` marks the ones that require an existing product image.

| Kind | Label | Needs a source image |
|------|-------|----------------------|
| `image_generate` | Generate product images | no |
| `image_edit` | Edit existing images | yes |
| `bg_remove` | Remove background | yes |
| `bg_replace` | Replace background | yes |
| `upscale` | Upscale images | yes |
| `recolor` | Recolour product | yes |
| `description` | Write descriptions | no |
| `alt_text` | Write image alt text | yes |
| `complete_listing` | Complete listing | no |

`Fotohub_Bridge::IMAGE_KINDS` covers the six image kinds; `TEXT_KINDS` covers `description`, `alt_text` and `complete_listing`. `complete_listing` gets both option groups because it produces images and copy in one pass.

A checkbox on this step, **include variations**, is posted as `include_variations` and switches item building to per-variation mode.

### Step 3 — Model and style

The image model dropdown is built from `Fotohub_Bridge::get_image_models()` with credits per image shown in each label. Default: `seedream-5-0-260128`.

| Model ID | Label | Credits per image |
|----------|-------|-------------------|
| `seedream-5-0-260128` | SeedDream 5.0 (recommended) | 2.0 |
| `dola-seedream-5-0-pro-260628` | SeedDream 5.0 Pro | 3.0 |
| `gpt-image-2` | GPT Image 2 | 2.0 |
| `nano-banana-pro` | Nano Banana Pro | 5.3 |
| `nano-banana-fast` | Nano Banana Fast | 2.0 |
| `imagen-4-standard` | Imagen 4 Standard | 3.0 |
| `imagen-4-ultra` | Imagen 4 Ultra | 5.0 |
| `imagen-4-fast` | Imagen 4 Fast | 2.0 |

An unrecognised model posted from the browser is discarded and replaced with the default (`read_job_request()`).

Below the model, the preset gallery. Presets come from `GET /v1/commerce/presets`, cached for five minutes in the `fotohub_bridge_presets` transient, and are grouped by `Fotohub_Bridge::group_presets()` in the display order from `get_preset_categories()`:

| Category | UI label |
|----------|----------|
| `bundle` | Complete looks |
| `background` | Backgrounds |
| `scene` | Scenes |
| `lighting` | Lighting |
| `composition` | Composition |
| `channel` | Sales channels |
| `description_tone` | Copy tone |

Bundles come first because a bundle already composes a background, a lighting setup, a composition and a prompt template — one click instead of four. Presets outside the known categories are appended rather than dropped.

`Fotohub_Bridge::preset_label()` shows the Polish name on Polish stores when the preset carries a `name_pl`; all 63 seeded presets do. The **Remember as this store's default** checkbox stores the slug in `fotohub_bridge_default_preset` via `ajax_save_default_preset`.

See [Commerce Bridge](/integrations/commerce-bridge) for the full slug catalog.

### Step 4 — Options

Everything here is validated server-side by `Fotohub_Commerce::read_options()`; unknown values are dropped, never forwarded.

| Option | Accepted values | Notes |
|--------|-----------------|-------|
| `language` | `en`, `pl`, `de` | Defaults to `Fotohub_Bridge::default_language()` from the site locale |
| `tone` | `professional`, `casual`, `luxury`, `playful`, `technical`, `minimal` | Defaults to `professional` |
| `brand_rules` | free text | Truncated to 2,000 characters, applied to every item in the batch |
| `num_images` | 1–4 | Image kinds only, clamped |
| `aspect_ratio` | `1:1`, `4:5`, `3:4`, `16:9`, `9:16` | Image kinds only |
| `output_format` | `png`, `jpeg`, `webp` | Image kinds only |
| `background` | free text | `bg_replace`; truncated to 300 characters |
| `recolor_prompt` | free text | `recolor`; truncated to 300 characters |
| `target_object` | free text | `recolor`; truncated to 200 characters |
| `fields` | see below | Text kinds only |

Selectable copy fields (`Fotohub_Commerce::get_text_fields()`): `title`, `short_description`, `description`, `meta_title`, `meta_description`, `alt_text`, `faq`, `json_ld`. With nothing checked the plugin defaults to `alt_text` for the `alt_text` kind and to `title`, `short_description`, `description` for everything else.

### Step 5 — Review and submit

`ajax_estimate` calls `POST /v1/commerce/estimate` and returns the item count, product count, images per item, credits per item, total credits, available credits and a `sufficient` flag. The **Start batch** button stays disabled until the estimate says the balance covers the batch, and the shortfall message links straight to top-up.

Submitting calls `ajax_submit`, which posts `POST /v1/commerce/jobs` and stores the returned job state locally. The response carries `job_id`, `status`, `total_items` and `estimated_credits`.

### Idempotency

`Fotohub_Bridge::build_idempotency_key()` fingerprints the batch:

```php
'wp-' . substr( hash( 'sha256', home_url() . '|' . $kind . '|' . implode( ',', $sorted_external_ids ) ), 0, 40 )
```

The same store, the same operation and the same set of items in any order produce the same key, so a double-clicked form or a browser retry replays the original job (HTTP 200) instead of billing twice.

## Job items and variations

`Fotohub_Products::build_job_items()` builds the payload the bridge receives.

For a simple product:

```json
{
  "external_id": "128",
  "sku": "MUG-01",
  "source_image_url": "https://store.example/wp-content/uploads/2026/07/mug.jpg",
  "product_context": {
    "title": "Stoneware mug 350 ml",
    "category": "Kitchen, Mugs",
    "attributes": { "Colour": "sand", "Material": "stoneware", "Weight": "0.4 kg" },
    "price": "89.00 PLN",
    "current_description": "Hand-glazed stoneware mug…"
  }
}
```

`product_context` is assembled by `build_product_context()`: title and category names (first three), up to 12 attributes with taxonomy slugs resolved to term names, the price with the store currency, weight and formatted dimensions, and the current description trimmed to 600 characters with an ellipsis.

With **include variations** enabled on a variable product, one item is emitted per variation:

```json
{
  "external_id": "128:132",
  "variant_id": "132",
  "sku": "MUG-01-SAND",
  "source_image_url": "https://store.example/wp-content/uploads/2026/07/mug-sand.jpg",
  "product_context": {
    "title": "Stoneware mug 350 ml — sand, 350 ml",
    "attributes": { "Colour": "sand", "Capacity": "350 ml", "Material": "stoneware" },
    "price": "89.00 PLN"
  }
}
```

`build_variation_context()` merges the variation's own attributes over the parent's (variation wins), appends the attribute values to the title, and uses the variation price when it has one. The source image is the variation's own image, falling back to the parent's.

`external_id` encodes the target: `"<product_id>"` for a parent, `"<product_id>:<variation_id>"` for a variation. `Fotohub_Products::parse_external_id()` reverses it when results come back, which is how a draft knows whether to set the parent image or the variation image.

Items whose kind needs a source image and that have none are skipped: `image_edit`, `bg_remove`, `bg_replace`, `upscale`, `recolor` and `alt_text` all require one. If that empties the batch, submission fails with a clear message rather than queuing nothing.

## Progress, retry and cancel

The progress view polls `ajax_job_status`, which fetches `GET /v1/commerce/jobs/{id}` plus a page of `GET /v1/commerce/jobs/{id}/items` and returns:

- **Job**: `id`, `status`, `kind`, `total_items`, `done_items`, `failed_items`, `spent_credits`, `estimated_credits`.
- **Items**: `id`, `external_id`, resolved `product_id` / `variation_id`, `product_title`, `sku`, `status`, `attempts`, `error_message`, `credits_used`.
- **`drafted`**: how many completed items were harvested into drafts on this poll.

Job statuses from the bridge: `queued`, `processing`, `completed`, `completed_with_errors`, `failed`, `cancelled`, `awaiting_credits`.

Buttons on the panel:

| Button | AJAX action | Bridge call |
|--------|-------------|-------------|
| Retry failed only | `fotohub_commerce_retry_failed` | `POST /jobs/{id}/retry-failed` → `{ requeued }` |
| Cancel batch | `fotohub_commerce_cancel_job` | `POST /jobs/{id}/cancel` |
| Review drafts | — | Links to `admin.php?page=fotohub-drafts` |
| Start another batch | — | Resets the wizard |

Every poll calls `Fotohub_Drafts::remember_job_state()`, which keeps the last 25 job states in the `fotohub_bridge_jobs` option. That is what powers the **Recent batches** table — batch, operation, status, done/total, failed, credits and last update — and it is why the progress view survives a page reload. Clicking a row reopens that batch.

`ajax_sync_job` is the belt-and-braces path: it pages through every `completed` item of a job (100 at a time, up to 2,000) and harvests them into drafts. Use it when callbacks never reached the site — a firewall, a staging URL, a plugin conflict during the run.

### Low balance warning

`render_low_balance_notice()` prints a warning on any admin screen whose ID contains `fotohub` when the balance drops below `Fotohub_Commerce::LOW_BALANCE_THRESHOLD` (50 credits), with a top-up link. The same threshold is passed to the browser as `fotohubCommerce.lowBalance`.

## Drafts review

Nothing an AI produces is written to a product until you approve it. **WooCommerce → FOTOhub Drafts** is where that happens.

### What a draft holds

`Fotohub_Drafts::record()` stores, per completed job item:

- `job_id`, `item_id` — unique together, so a webhook and a poll for the same item cannot duplicate a draft.
- `product_id`, `variation_id` — parsed from `external_id`.
- `kind` — the operation that produced it.
- `payload` — the normalized result: `image_urls[]` and a `text{}` map restricted to the eight allowed fields.
- `before_snapshot` — the live values captured at record time: title, description, short description, featured image ID and URL, alt text, and the Yoast meta title/description. This is what the review UI diffs against.
- `credits_used`, `created_at`, `resolved_at`, `error_message`.

Draft IDs are also linked onto the product as `_fotohub_draft` post meta, and unlinked when the draft is resolved — so the count on the dashboard is always live.

A draft that carries neither images nor text is not stored at all, and a draft the merchant already decided on is never resurrected by a later poll (`record()` returns the existing ID untouched when the status is not `pending`).

### The review screen

Status tabs (`pending`, `approved`, `rejected`, `failed`, `all`) with counts from `get_status_counts()`, 20 drafts per page by default (max 100). Each draft card shows:

- Product title, linked to the product editor, with a **Variation #N** badge when the draft targets a variation.
- Status badge, the `kind` as a code tag, and the timestamp.
- For image drafts: the current product image beside up to four generated images, each opening full-size in a new tab.
- For text drafts: a current-versus-proposed diff per field, both sides stripped of tags and trimmed to 90 words.
- Credits spent on that item.
- **Approve and apply** / **Reject** per draft, plus bulk approve and bulk reject over the selected drafts.

### What approval writes

`Fotohub_Drafts::approve()` requires `edit_products` **or** `manage_woocommerce`, and refuses a draft that is not `pending`.

**Images** (`apply_images()`):

- Each URL is sideloaded with `Fotohub_Media::sideload_image()`; a single bad URL is skipped rather than losing the batch, and an empty result fails the draft with a message.
- Every imported attachment is tagged `_fotohub_generated` and `_fotohub_job_id`.
- Variation draft: the first image becomes the variation image (`set_image_id()` on the variation), extras enrich the parent gallery.
- Parent draft with no featured image: the first image becomes the featured image, the rest go to the gallery.
- Parent draft that already has a featured image: everything goes to the gallery. Your existing hero image is never replaced silently.
- The gallery is merged, deduplicated and order-preserving.

**Text** (`apply_text()`):

| Field | Written to |
|-------|-----------|
| `title` | `WC_Product::set_name()` |
| `description` | `set_description()`, through `wp_kses_post()` |
| `short_description` | `set_short_description()`, through `wp_kses_post()` |
| `faq` | `_fotohub_faq` post meta, sanitized into question/answer pairs |
| `json_ld` | `_fotohub_json_ld` post meta |
| `meta_title` / `meta_description` | Yoast (`_yoast_wpseo_title`, `_yoast_wpseo_metadesc`) and/or Rank Math (`rank_math_title`, `rank_math_description`) when detected; otherwise `_fotohub_meta_title` / `_fotohub_meta_description` so the copy is not discarded |
| `alt_text` | `_wp_attachment_image_alt` on the featured image of the approved target (the variation's own image for a variation draft) |

Yoast is detected through `WPSEO_VERSION` or `WPSEO_Options`; Rank Math through the `RankMath` class or `RANK_MATH_VERSION`. If both are active, both are written.

**Rejection** (`reject()`) marks the row and touches no product data.

Bulk operations collect per-draft outcomes: `bulk_approve()` returns `{ approved, failed, errors[] }` keyed by draft ID, so a partial failure tells you exactly which items and why.

### Draft hooks

```php
/**
 * Fires after a FOTOhub draft has been written to a product.
 *
 * @param int   $draft_id
 * @param array $draft    The full draft row, including before_snapshot.
 * @param array $applied  { images: int, fields: string[] }
 */
add_action( 'fotohub_draft_approved', function ( int $draft_id, array $draft, array $applied ) {
    if ( in_array( 'title', $applied['fields'], true ) ) {
        // Re-index the product in your search engine, for example.
    }
}, 10, 3 );
```

## Bridge callback

The bridge posts events to a single REST route.

| | |
|---|---|
| Route | `POST /wp-json/fotohub-ai/v1/commerce/callback` |
| Registered by | `Fotohub_Commerce::register_rest_routes()` |
| Namespace constant | `Fotohub_Bridge::REST_NAMESPACE` = `fotohub-ai/v1` |
| Route constant | `Fotohub_Bridge::REST_CALLBACK_ROUTE` = `/commerce/callback` |
| Authentication | `X-FotoHub-Signature` — HMAC-SHA256 hex of the raw body, keyed by the stored `callback_secret` |

`verify_callback_signature()` is the route's `permission_callback`: a WordPress capability would be wrong here, because the caller is a server with no user session. It reads the header as `x_fotohub_signature`, computes the digest over `$request->get_body()`, and compares with `hash_equals()` on the lowercased, trimmed value. Missing signature → 401. Mismatch → 401. No stored secret → 403.

Events handled:

| Event | Effect |
|-------|--------|
| `commerce.item.completed` | Records the item as a pending draft |
| `commerce.job.completed` | Marks the remembered job state `completed` |
| `commerce.job.failed` | Marks it `failed` |
| `commerce.job.awaiting_credits` | Marks it `awaiting_credits` |

Every verified callback, including unknown event names, fires:

```php
/**
 * Fires for every verified bridge callback.
 *
 * @param string $event Event name, e.g. commerce.item.completed.
 * @param array  $data  Event payload.
 */
add_action( 'fotohub_commerce_callback', function ( string $event, array $data ) {
    if ( 'commerce.job.awaiting_credits' === $event ) {
        wp_mail( get_option( 'admin_email' ), 'FOTOhub batch paused', 'Top up credits to resume.' );
    }
}, 10, 2 );
```

The receiver always answers `200 {"received": true}` once the signature verifies, so the bridge does not retry a job it already delivered.

Verifying the signature yourself:

::: code-group

```python [Python]
import hashlib
import hmac

def verify(raw_body: bytes, header: str, callback_secret: str) -> bool:
    expected = hmac.new(callback_secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header.strip().lower())
```

```typescript [TypeScript]
import { createHmac, timingSafeEqual } from "node:crypto";

export function verify(rawBody: Buffer, header: string, callbackSecret: string): boolean {
  const expected = createHmac("sha256", callbackSecret).update(rawBody).digest("hex");
  const got = header.trim().toLowerCase();
  if (expected.length !== got.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(got));
}
```

```bash [cURL]
# Reproduce the digest for a captured body to debug a 401.
openssl dgst -sha256 -hmac "$FOTOHUB_CALLBACK_SECRET" -hex < body.json
```

:::

## AJAX actions

Thirteen actions, all registered as `wp_ajax_fotohub_commerce_<name>` in `Fotohub_Commerce::init()`. Every one calls `Fotohub_Commerce::verify()`, which checks the `fotohub_commerce_nonce` nonce and requires `manage_woocommerce` **or** `manage_options`.

| Action | Handler | What it does |
|--------|---------|--------------|
| `fotohub_commerce_products` | `ajax_products` | Paged, filtered product search |
| `fotohub_commerce_presets` | `ajax_presets` | Grouped preset catalog + stored default |
| `fotohub_commerce_estimate` | `ajax_estimate` | Cost preflight |
| `fotohub_commerce_submit` | `ajax_submit` | Submit the batch job |
| `fotohub_commerce_job_status` | `ajax_job_status` | Poll job + items, harvest drafts |
| `fotohub_commerce_retry_failed` | `ajax_retry_failed` | Requeue failed items |
| `fotohub_commerce_cancel_job` | `ajax_cancel_job` | Cancel the job |
| `fotohub_commerce_sync_job` | `ajax_sync_job` | Page every completed item into drafts |
| `fotohub_commerce_health` | `ajax_health` | Bridge + key + connection health |
| `fotohub_commerce_connect` | `ajax_connect` | Validate key, register connection |
| `fotohub_commerce_disconnect` | `ajax_disconnect` | Delete connection, forget credentials |
| `fotohub_commerce_draft_action` | `ajax_draft_action` | Bulk approve / reject drafts |
| `fotohub_commerce_save_default_preset` | `ajax_save_default_preset` | Remember the store default preset |

The nonce action is `fotohub_commerce_nonce` (`Fotohub_Commerce::NONCE_ACTION`) — distinct from the `fotohub_ai_nonce` used by the WordPress-side handlers.

A 402 from the bridge is surfaced as structured data, not a generic error: `error_payload()` turns `fotohub_insufficient_credits` into `{ insufficient: true, required_credits, available_credits }` so the UI can name the shortfall.

## Product editor

### FOTOhub AI tab

`Fotohub_Bulk` adds a **FOTOhub AI** tab to the WooCommerce product data panel (`woocommerce_product_data_tabs`, priority 80). It offers a custom prompt, an image count (1–4), and a photo style: Product Photography (White BG), Lifestyle Shot, Studio Lighting, Flat Lay, or Custom. **Generate Product Photos** posts `fotohub_generate_product_photos`, which generates immediately and attaches the results: the first image becomes the featured image if the product has none, otherwise everything is appended to the gallery.

Prompt construction (`Fotohub_Bulk::build_product_prompt()`) prefixes the product name and a 30-word description excerpt with the style phrase:

| Style | Prefix |
|-------|--------|
| `product` (default) | Professional product photography on clean white background of |
| `lifestyle` | Lifestyle product photography of |
| `studio` | Professional studio photography with dramatic lighting of |
| `flat-lay` | Flat lay product photography from above of |

Every prompt closes with "High resolution, commercial quality, e-commerce ready."

::: tip This is the single-product path
The tab writes to the product directly. For batches, use the wizard — its results are drafts, and its prompts come from presets rather than this fixed template.
:::

### Video tab

`Fotohub_Video` adds a **Video** tab (priority 81) plus a generation modal on the product editor. See the [WordPress page](/integrations/wordpress#video-generation) for the models, the polling cron and the `[fotohub_product_video]` shortcode.

### Product list bulk action

`Fotohub_Bulk` adds **Generate AI Photos (FOTOhub)** to the products list bulk actions (`bulk_actions-edit-product`, value `fotohub_generate_photos`), shown only when an API key is stored.

`handle_product_bulk_actions()` requires `edit_products` or `manage_woocommerce` and never generates inline — 20 products times a multi-second API call would blow past any gateway timeout. Work is handed off:

1. **Action Scheduler**, when available: `as_enqueue_async_action( 'fotohub_generate_product_photos_job', array( $payload ), 'fotohub-ai' )`. The group is `fotohub-ai`, so the jobs are filterable under **WooCommerce → Status → Scheduled Actions**.
2. **Fallback**: `Fotohub_Scheduler::schedule_job( 'bulk_product_photos', … )`, drained by the plugin's own five-minute cron.

The worker in both cases is `Fotohub_Bulk::run_product_photos_job()`, which sets the analytics product context, generates, sideloads and attaches. The redirect carries `fotohub_products_queued` and `fotohub_products_errors`, or `fotohub_products_denied`, and `product_bulk_notices()` renders the result.

The default payload is `num_images: 2` (clamped 1–4) at 1024x1024 with style `product`.

## Options, tables and meta

### Option keys

| Option | Purpose |
|--------|---------|
| `fotohub_bridge_connection_id` | Bridge connection ID |
| `fotohub_bridge_callback_secret` | Callback secret, AES-256-CBC encrypted at rest |
| `fotohub_bridge_connection_host` | `home_url()` the connection was registered for |
| `fotohub_bridge_default_preset` | Store default preset slug |
| `fotohub_bridge_jobs` | Last 25 job states for the progress UI |

Shared options (`fotohub_ai_api_key`, `fotohub_ai_default_model`, …) are on the [WordPress page](/integrations/wordpress#complete-option-key-list).

### Drafts table

`{$wpdb->prefix}fotohub_drafts`, created by `Fotohub_Drafts::install_table()`:

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint unsigned, PK | |
| `job_id` | varchar(64) | Bridge job |
| `item_id` | varchar(64) | Bridge item |
| `kind` | varchar(32) | Operation |
| `product_id` | bigint unsigned | Indexed |
| `variation_id` | bigint unsigned | 0 for a parent |
| `status` | varchar(20) | `pending`, `approved`, `rejected`, `failed`; indexed |
| `payload` | longtext | `{ image_urls[], text{} }` |
| `before_snapshot` | longtext | Live values at record time |
| `error_message` | text | |
| `credits_used` | decimal(10,4) | |
| `created_at` / `resolved_at` | datetime | |

Unique key `uniq_item (job_id, item_id)` is what makes callback and poll delivery idempotent. Further indexes on `status`, `product_id` and `job_id`.

The other two tables — `fotohub_usage` and `fotohub_jobs` — are documented on the [WordPress page](/integrations/wordpress#database-tables).

### Post meta written by the commerce flow

| Meta key | On | Written by |
|----------|----|-----------|
| `_fotohub_draft` | product | Pending draft IDs |
| `_fotohub_generated` | attachment | Imported from an approved draft |
| `_fotohub_job_id` | attachment | Job that produced it |
| `_fotohub_faq` | product | Approved FAQ block |
| `_fotohub_json_ld` | product | Approved JSON-LD schema |
| `_fotohub_meta_title` / `_fotohub_meta_description` | product | Approved SEO copy with no SEO plugin present |
| `_wp_attachment_image_alt` | attachment | Approved alt text |
| `_yoast_wpseo_title` / `_yoast_wpseo_metadesc` | product | Approved SEO copy, Yoast active |
| `rank_math_title` / `rank_math_description` | product | Approved SEO copy, Rank Math active |

## Capability summary

| Surface | Requirement |
|---------|-------------|
| Bulk AI and Drafts pages | `manage_woocommerce` (menu) and `manage_woocommerce` or `manage_options` (renderer) |
| `fotohub_commerce_*` AJAX | `manage_woocommerce` or `manage_options`, plus the `fotohub_commerce_nonce` nonce |
| Draft approve / reject | `edit_products` or `manage_woocommerce` |
| Product list bulk action | `edit_products` or `manage_woocommerce` |
| Product editor generation | `upload_files`, plus the `fotohub_ai_nonce` nonce |
| Bridge callback route | HMAC signature only — no capability |

## Rate pacing

You do not configure concurrency. The bridge spreads dispatch across at most half of a platform's per-minute ceiling and clamps against a daily cap, so a large batch cannot exhaust your store's API budget or trip a marketplace limit. Budgets live in `PLATFORM_RATE_BUDGETS` in `server/commerce-bridge/app/models/schemas.py` — see [Commerce Bridge](/integrations/commerce-bridge#rate-pacing).

## Requirements

- WordPress 6.0+, WooCommerce 7.0+ (tested to 9.4), PHP 8.0+
- Publicly reachable image URLs — the bridge fetches `source_image_url` for edit, background, upscale, recolor and alt-text kinds. A password-protected staging site cannot serve source images.
- A publicly reachable REST route for callbacks, or use **Sync results** to pull them instead
- Action Scheduler (bundled with WooCommerce) for queued product bulk actions
- A FOTOhub account with credits

## Troubleshooting

| Symptom | Cause and fix |
|---------|---------------|
| "WooCommerce is not active" on the wizard | `Fotohub_Products::is_available()` checks `wc_get_product()` and `WC_Product`. WooCommerce is inactive or failed to load. |
| "None of the selected products can be processed" | The kind needs a source image and none of the selection has one. Generate images first, or pick `image_generate` / `description`. |
| Estimate says insufficient credits | The batch cost exceeds the balance. Reduce the selection, drop `num_images`, pick a cheaper model, or top up. |
| Submitting again did not create a second job | Correct: the idempotency key matched, so the original job was replayed. Change the selection or the operation to start a new batch. |
| Drafts never appear | Callbacks are not reaching the site. Open the batch and use **Sync results**, which pages every completed item into drafts over the REST client. |
| Callback returns 401 | Signature mismatch. A proxy that rewrites or re-encodes the body invalidates the digest — the HMAC is over the raw bytes. |
| Callback returns 403 | No callback secret stored. Reconnect from the Bulk AI page to re-register and receive a fresh secret. |
| Approving a draft did not replace the main image | By design. A product that already has a featured image receives new images into the gallery. |
| Approved meta title went nowhere visible | Neither Yoast nor Rank Math is active, so the copy is parked in `_fotohub_meta_title`. Activate an SEO plugin and re-approve, or read the meta in your theme. |
| Variation images all landed on the parent | **Include variations** was not checked, so one item per product was submitted. Re-run with it enabled. |
| Job sits in `awaiting_credits` | The batch paused mid-run when credits ran out. Top up; the bridge resumes. |
| Bulk action queued nothing | No API key stored, or neither Action Scheduler nor `Fotohub_Scheduler` is available. |

## Planned

Not built. Do not plan around these.

- **REST endpoints for commerce operations.** There is no `POST /wp-json/fotohub-ai/v1/wc/generate-product-image`, `wc/bulk-generate`, `wc/generate-description` or `GET wc/catalog-stats`. The only commerce REST route is the signed callback receiver; everything else is admin AJAX.
- **WooCommerce-specific hooks.** No `fotohub_wc_product_image_generated`, `fotohub_wc_bulk_start`, `fotohub_wc_product_prompt` or `fotohub_wc_description_params`. The commerce actions that do exist are `fotohub_draft_approved` and `fotohub_commerce_callback`.
- **A WooCommerce settings tab.** There is no **WooCommerce → Settings → FOTOhub AI** section. Configuration lives under **FOTOhub AI → Settings** and in the wizard. In particular there is no "auto-generate on publish", no default-style setting, no default-background setting and no bulk-concurrency setting — pacing is the bridge's job.
- **A "Generate Gallery with AI" button.** The FOTOhub AI product tab generates 1–4 images in one go; there is no separate gallery control.
- **A "Generate Variation Images" button on the Variations tab.** Per-variation generation exists, but it is the **include variations** checkbox in the wizard, not a button on the variations panel.
- **A custom preset editor.** `Fotohub_Bridge::create_preset()` can call `POST /v1/commerce/presets`, but no admin screen exposes it. Create custom presets through the API for now.
- **Draft editing before approval.** You can approve or reject a draft; you cannot tweak the generated copy in the review screen first. Approve, then edit the product.
- **Per-draft field selection on approval.** Approval applies every field in the draft payload. Choose fields at submit time instead.
- **CSV export of drafts.** Analytics exports usage; drafts have no export.

## Links

- [WordPress plugin](/integrations/wordpress) — media library, copywriter, analytics, scheduler
- [Commerce Bridge](/integrations/commerce-bridge) — job kinds, presets, callbacks, rate pacing
- [Integrations overview](/integrations/overview)
- [GitHub: fotohubapp/wordpress-plugin](https://github.com/fotohubapp/wordpress-plugin)
- [Image Generation API](/api/image-generation) · [Billing & Pricing](/api/billing) · [Webhooks](/api/webhooks)
