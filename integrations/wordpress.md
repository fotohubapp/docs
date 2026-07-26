# WordPress Plugin

**FOTOhub AI — Creative Powerhouse** is the official WordPress plugin. It brings AI image generation into the media library, thirteen professional editing tools, an AI copywriter with REST endpoints and a Gutenberg sidebar, a server-rendered image block, usage analytics with a dashboard widget, and a background job queue.

This page covers the WordPress core of the plugin. The commerce side — bulk product jobs, drafts review, the product picker and the bridge callback — is documented on the [WooCommerce page](/integrations/woocommerce).

| | |
|---|---|
| Plugin name | FOTOhub AI — Creative Powerhouse |
| Version | 2.1.0 |
| Text domain | `fotohub-ai` |
| Requires WordPress | 6.0 (tested to 6.7) |
| Requires PHP | 8.0 |
| API base | `https://apis.fotohub.app` |
| Repository | [fotohubapp/wordpress-plugin](https://github.com/fotohubapp/wordpress-plugin) |
| License | GPL-2.0+ |

::: tip Everything on this page is greppable
Every hook, filter, AJAX action, REST route, option key, table name and menu slug below exists in the plugin source. Features that are not built yet are listed in [Planned](#planned) and nowhere else.
:::

## Installation

1. Upload the `fotohub-ai` folder to `wp-content/plugins/`, or install the zip from **Plugins → Add New**.
2. Activate the plugin.
3. Go to **FOTOhub AI → Settings** and paste your API key.
4. Click **Test Connection** — the plugin calls `GET /v1/billing/balance` and reports your credit balance.

Activation (`FotohubAI::activate()`) seeds the default options and creates the three custom tables. It aborts with `wp_die()` on PHP older than 8.0.

### Get an API key

1. Create an account at [fotohub.app](https://fotohub.app).
2. Open **Settings → API Keys** in the FOTOhub dashboard.
3. Create a key (`fh_live_*` for production, `fh_test_*` for testing) and paste it into the plugin.

The key is encrypted at rest with AES-256-CBC using a SHA-256 key derived from your `AUTH_KEY` salt (`Fotohub_API::store_secret()` / `read_secret()`). It is never printed on a page, never sent to the browser and never written to the usage log.

## Admin menu

The plugin registers exactly one top-level menu. Every page below is a real submenu registered in `Fotohub_Admin::add_menu_pages()` or `Fotohub_Commerce::register_menus()`.

| Menu path | Slug | Capability | Source |
|-----------|------|-----------|--------|
| FOTOhub AI | `fotohub-ai` | `manage_options` | `admin/views/dashboard-page.php` |
| FOTOhub AI → Dashboard | `fotohub-ai` | `manage_options` | `admin/views/dashboard-page.php` |
| FOTOhub AI → Settings | `fotohub-ai-settings` | `manage_options` | `admin/views/settings-page.php` |
| FOTOhub AI → Stability Tools | `fotohub-ai-stability` | `upload_files` | `admin/views/stability-tools.php` |
| FOTOhub AI → Analytics | `fotohub-ai-analytics` | `manage_options` | `Fotohub_Analytics::render_analytics_report()` |
| FOTOhub AI → Scheduler | `fotohub-ai-scheduler` | `manage_options` | `admin/views/scheduler-page.php` |
| FOTOhub AI → Bulk Generate | `fotohub-ai-bulk` | `manage_options` | `admin/views/bulk-page.php` |
| FOTOhub AI → MCP & Assistants | `fotohub-ai-mcp` | `manage_options` | `admin/views/mcp-page.php` |

All pages live under `admin.php?page=<slug>`. Two further pages (**FOTOhub Bulk AI** and **FOTOhub Drafts**) are registered under the WooCommerce menu when WooCommerce is active — see the [WooCommerce page](/integrations/woocommerce).

The plugin also adds action links on the Plugins screen: **Settings** always, and **Bulk AI** when WooCommerce is detected (`Fotohub_Admin::add_action_links()`).

## Settings

**FOTOhub AI → Settings** renders a standard `options.php` form for the `fotohub_ai_settings` group. Four settings are registered:

| Field | Option key | Default | Notes |
|-------|-----------|---------|-------|
| API Key | `fotohub_ai_api_key` | `''` | Sanitized through `Fotohub_Admin::sanitize_api_key()`, stored encrypted. A masked value (`***abcd`) is a no-op. |
| Default Model | `fotohub_ai_default_model` | `seedream-5-0-260128` | Dropdown built from `Fotohub_Bridge::get_image_models()`, showing credits per image. |
| Default Width | `fotohub_ai_default_width` | `1024` | 256–2048, step 64. |
| Default Height | `fotohub_ai_default_height` | `1024` | 256–2048, step 64. |

### Image models offered in the UI

`Fotohub_Bridge::get_image_models()` is the single catalog used by the settings dropdown, the wizard and the Gutenberg block.

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

Credits are the platform's billing unit. Consult [Billing & Pricing](/api/billing) for the PLN value of a credit on your plan.

### Complete option key list

| Option | Created by | Read by |
|--------|-----------|---------|
| `fotohub_ai_api_key` | activation, settings | `Fotohub_API::get_api_key()` |
| `fotohub_ai_default_model` | activation, settings | `Fotohub_API::generate_image()` |
| `fotohub_ai_default_width` | activation, settings | `Fotohub_API::generate_image()` |
| `fotohub_ai_default_height` | activation, settings | `Fotohub_API::generate_image()` |
| `fotohub_ai_default_video_model` | activation | *seeded but not read* — the video modal reads `Fotohub_Video::SUPPORTED_MODELS` |
| `fotohub_ai_scheduler_batch_size` | activation | *seeded but not read* — `process_queue()` takes a `$batch_size` argument (5 by default, 50 nightly) |
| `fotohub_ai_scheduler_notify_email` | activation | *seeded but not read* — `notify_completion()` mails `get_option('admin_email')` |
| `fotohub_ai_notify_completion` | — | `Fotohub_Scheduler::notify_completion()`, defaults to `yes` |
| `fotohub_ai_db_version` | `Fotohub_Analytics::install_table()` | — |
| `fotohub_bridge_connection_id` | bridge registration | `Fotohub_Bridge` |
| `fotohub_bridge_callback_secret` | bridge registration | `Fotohub_Bridge::get_callback_secret()` (encrypted) |
| `fotohub_bridge_connection_host` | bridge registration | `Fotohub_Bridge::get_connection_id()` |
| `fotohub_bridge_default_preset` | wizard | `Fotohub_Commerce::ajax_presets()` |
| `fotohub_bridge_jobs` | job submit / poll | `Fotohub_Drafts::get_job_states()` |

Three of these are seeded at activation but never read back. They are listed here for completeness so nobody hunts for a setting screen that does not exist.

### Transients

| Transient | TTL | Purpose |
|-----------|-----|---------|
| `fotohub_ai_balance_cache` | 5 min | `Fotohub_API::get_cached_balance()` |
| `fotohub_ai_balance` | 5 min | `Fotohub_Analytics::get_cached_balance()` |
| `fotohub_ai_models_cache` | 1 hour | `GET /v1/models` |
| `fotohub_ai_pricing_cache` | 1 day | `GET /v1/billing/pricing` |
| `fotohub_stability_tools_cache` | 1 day | `GET /stability/tools` |
| `fotohub_bridge_presets` | 5 min | `GET /v1/commerce/presets` |

## Media library

`Fotohub_Media::init()` wires the media library integration.

### Generate with AI

A **Generate with AI** button is injected into the upload UI via the `post-upload-ui` action (`Fotohub_Media::add_generate_button()`), and the modal (`admin/views/generate-modal.php`) is printed in the footer of `upload.php`, `post.php` and `post-new.php`. The modal posts the `fotohub_generate_image` AJAX action; results are sideloaded with `media_handle_sideload()` and become normal WordPress attachments.

### Row actions

`Fotohub_Media` adds two row actions to every image in the media library through the `media_row_actions` filter:

- **Remove Background** — posts `fotohub_remove_bg`
- **Upscale** — posts `fotohub_upscale`

`Fotohub_Stability` adds thirteen more row actions through the same filter, one per Stability tool, keyed `fotohub_stability_<tool_id_with_underscores>` (for example `fotohub_stability_remove_background`, `fotohub_stability_search_and_replace`).

### Bulk action

The `bulk_actions-upload` filter adds one bulk action: **Remove Background (FOTOhub)**, value `fotohub_bulk_remove_bg`, handled by `Fotohub_Media::handle_bulk_actions()`. Results are appended as new attachments and the count is reported in an admin notice via the `fotohub_processed` / `fotohub_errors` query args.

::: warning This bulk action runs inline
`handle_bulk_actions()` calls the API synchronously in the admin request, one call per selected image. Keep selections small. The WooCommerce product bulk action, by contrast, is queued — see the [WooCommerce page](/integrations/woocommerce).
:::

## Stability tools

**FOTOhub AI → Stability Tools** (`upload_files`) exposes thirteen tools. `Fotohub_Stability::get_available_tools()` is the authoritative list; every tool declares what it requires.

| Tool ID | Label | Requires |
|---------|-------|----------|
| `creative-upscale` | Creative Upscale | image, prompt |
| `fast-upscale` | Fast Upscale | image |
| `conservative-upscale` | Conservative Upscale | image |
| `remove-background` | Remove Background | image |
| `erase` | Erase Object | image, mask |
| `inpaint` | Inpaint | image, mask, prompt |
| `outpaint` | Outpaint | image, padding |
| `search-and-replace` | Search & Replace | image, prompt |
| `search-and-recolor` | Search & Recolor | image, prompt |
| `style-transfer` | Style Transfer | image, reference |
| `control-sketch` | Control: Sketch | image, prompt |
| `control-structure` | Control: Structure | image, prompt |
| `image-to-video` | Image to Video | image |

All thirteen run through a single AJAX action, `fotohub_stability_tool`, handled by `Fotohub_Stability::ajax_process_tool()`. The handler:

1. Verifies the `fotohub_ai_nonce` nonce and the `upload_files` capability.
2. Validates the tool ID against `get_available_tools()`.
3. Reads the attachment, base64-encodes it (`get_image_base64()`), and enforces the tool's `requires` list — a missing mask returns `needs_mask: true` so the browser can open the mask painter.
4. Calls `POST /stability/{tool_id}` and saves the base64 result as a new attachment.

Output format is constrained to `png`, `webp` or `jpeg`. Outpaint padding is clamped to 1024 px per side. The saved attachment records `_fotohub_stability_tool` and `_fotohub_stability_source` post meta.

## AI copywriter

`Fotohub_Copywriter::init()` registers a classic-editor meta box, a Gutenberg sidebar script, and seven REST routes.

### Meta box

**FOTOhub AI Writer** appears in the side column of `post`, `page` and `product` edit screens (`add_meta_boxes`). Buttons: Suggest Titles, Generate Excerpt, SEO Slug, Article from Outline, and — on products only — Product Description. The tone selector offers `professional`, `casual`, `luxury`, `technical`.

### Gutenberg sidebar

`enqueue_block_editor_assets` loads `admin/js/gutenberg-ai-writer.js` with the `wp-plugins`, `wp-edit-post`, `wp-components`, `wp-data`, `wp-element`, `wp-i18n` and `wp-api-fetch` dependencies, localized as `fotohubAIWriter` with `restUrl` and a `wp_rest` nonce. The sidebar is only enqueued when an API key is stored.

### REST routes

Namespace: **`fotohub-ai/v1`**. Permission callback for the copywriter routes is `current_user_can('edit_posts')` **and** a stored API key (`Fotohub_Copywriter::rest_permission_check()`).

| Method | Route | Arguments | Response |
|--------|-------|-----------|----------|
| POST | `/wp-json/fotohub-ai/v1/generate-titles` | `topic` (required), `count` (default 5, clamped 1–10) | `{ titles: string[] }` |
| POST | `/wp-json/fotohub-ai/v1/generate-excerpt` | `content` (required) | `{ excerpt: string }` |
| POST | `/wp-json/fotohub-ai/v1/generate-article` | `outline` (required) | `{ article: string }` (HTML, `wp_kses_post`) |
| POST | `/wp-json/fotohub-ai/v1/generate-product-description` | `product_name`, `details` (both required), `tone` (`professional`\|`casual`\|`luxury`\|`technical`) | `{ description: string }` |
| POST | `/wp-json/fotohub-ai/v1/generate-alt-text` | `attachment_id` (required) | `{ alt_text: string }` |
| POST | `/wp-json/fotohub-ai/v1/generate-slug` | `title` (required) | `{ slug: string }` |
| POST | `/wp-json/fotohub-ai/v1/bulk-alt-text` | `batch_size` (default 20, clamped 1–50) | `{ processed, failed, remaining, results[] }` |

One more route lives in the same namespace — `POST /wp-json/fotohub-ai/v1/commerce/callback` — the signed bridge receiver. It is documented on the [WooCommerce page](/integrations/woocommerce#bridge-callback).

::: warning There is no `fotohub/v1` namespace
Older documentation described routes under `fotohub/v1` (`/generate`, `/upscale`, `/balance`, `/models`). Those never existed. The only namespace the plugin registers is `fotohub-ai/v1`, and the only routes in it are the eight above.
:::

### Example: generate titles

::: code-group

```bash [cURL]
# Requires a logged-in WordPress session cookie plus a matching REST nonce.
curl -X POST https://yoursite.com/wp-json/fotohub-ai/v1/generate-titles \
  -H "X-WP-Nonce: $WP_REST_NONCE" \
  -H "Content-Type: application/json" \
  -b "$WP_COOKIE_JAR" \
  -d '{"topic": "sustainable packaging for small shops", "count": 5}'
```

```javascript [TypeScript]
// Inside a block editor script — apiFetch handles the nonce for you.
import apiFetch from '@wordpress/api-fetch';

const { titles } = await apiFetch<{ titles: string[] }>({
  path: '/fotohub-ai/v1/generate-titles',
  method: 'POST',
  data: { topic: 'sustainable packaging for small shops', count: 5 },
});
```

```python [Python]
# Server-to-server: authenticate with a WordPress application password.
import requests

response = requests.post(
    "https://yoursite.com/wp-json/fotohub-ai/v1/generate-titles",
    auth=("editor", "xxxx xxxx xxxx xxxx xxxx xxxx"),
    json={"topic": "sustainable packaging for small shops", "count": 5},
    timeout=60,
)
response.raise_for_status()
print(response.json()["titles"])
```

:::

Alt text generation writes the result straight to `_wp_attachment_image_alt` on the attachment, so a successful call also fixes the accessibility metadata.

## Gutenberg block

`Fotohub_Blocks::init()` registers one block from `blocks/fotohub-image/block.json`:

| | |
|---|---|
| Block name | `fotohub/image` |
| Title | FOTOhub AI Image |
| Category | media |
| API version | 3 |
| Editor script | `admin/js/blocks.js` |
| Render | Server-side, `Fotohub_Blocks::render()` |

Attributes: `attachmentId` (number), `url`, `alt`, `caption`, `prompt`, `model` (default `seedream-5-0-260128`), `aspectRatio` (default `1:1`), `align` (default `center`). Supports `align` (left, center, right, wide, full) and margin spacing; `html` editing is disabled.

Because rendering happens server-side, markup is generated from the attachment at render time rather than frozen into `post_content`: replacing the image or updating its alt text is reflected immediately. If the attachment is missing and no `url` is set, the block renders nothing rather than a broken image.

The editor script receives `fotohubBlocks` with `ajaxUrl`, the `fotohub_ai_nonce` nonce and the model list, and generates through the `fotohub_generate_image` AJAX action.

## Bulk Generate (prompt list)

**FOTOhub AI → Bulk Generate** takes a list of prompts, not products. Paste one prompt per line, or upload a CSV/TXT file; the page counts prompts, then posts `fotohub_bulk_generate`. Each prompt is generated in turn and sideloaded into the media library; the response reports per-prompt successes and errors.

For product-driven bulk work use **WooCommerce → FOTOhub Bulk AI** instead, which submits one batch job to the commerce bridge and returns reviewable drafts.

## Video generation

`Fotohub_Video` only loads when WooCommerce is active (see `FotohubAI::init_hooks()`), because its UI lives in the product editor. It contributes:

- A **Video** tab in the WooCommerce product data panel (`woocommerce_product_data_tabs`, priority 81).
- A generation modal in the footer of `post.php` / `post-new.php`, rendered only on the `product` post type.
- Four AJAX actions: `fotohub_generate_video`, `fotohub_poll_video_status`, `fotohub_generate_turntable`, `fotohub_generate_lifestyle_video`.
- A polling cron, `fotohub_video_poll_jobs`, on a custom `every_two_minutes` interval registered through `cron_schedules`.
- A shortcode, `[fotohub_product_video]`.

Video models offered in the modal (`Fotohub_Video::SUPPORTED_MODELS`): `veo-2`, `veo-3`, `wan`, `kling`, `hailuo`, `seedance`, `sora-2`.

::: warning Model IDs in the video modal are provider shorthands
`POST /v1/ai/generate/video` accepts fully-qualified model IDs such as `veo-3.1-fast-generate-001`, `wan2.6-t2v`, `seedance-2-0-pro` or `sora-2`. Of the seven shorthands in the modal, only `sora-2` matches a real route entry. Pick your model from the [Video Generation](/api/video-generation) catalog and expect the other six shorthands to be rejected by the API until the modal list is corrected.
:::

### Shortcode

```html
<!-- Videos for the current product -->
[fotohub_product_video]

<!-- Videos for a specific product, autoplaying, muted, looped -->
[fotohub_product_video id="42" autoplay="true" loop="true" muted="true" controls="true" width="100%"]
```

Attributes: `id` (defaults to `get_the_ID()`), `autoplay`, `loop`, `muted`, `controls`, `width`. Videos are read from the `_fotohub_video_jobs` / `_fotohub_generated_video` attachment relationship; the shortcode outputs nothing when a product has no generated video.

`[fotohub_product_video]` is the **only** shortcode the plugin registers. There is no `[fotohub_image]` or `[fotohub_balance]` shortcode.

## Usage analytics

`Fotohub_Analytics::init()` listens on the `fotohub_api_request_completed` action, which `Fotohub_API::request()` and `Fotohub_Bridge::request()` fire after **every** API call. One row per call is written to `{$wpdb->prefix}fotohub_usage`.

Recorded columns: `user_id`, `endpoint`, `category`, `model`, `credits_used`, `response_status`, `duration_ms`, `post_id`, `product_id`, `created_at`. Pure bookkeeping calls (`billing` category, successful, zero credits) are skipped so the log stays about actual work.

Categories are derived from the endpoint path by `Fotohub_API::categorize_endpoint()`: `commerce`, `video`, `music`, `chat`, `billing`, `image`, `other`.

**FOTOhub AI → Analytics** (`manage_options`) renders:

- A period selector: 7, 30 or 90 days. The value drives the SQL date filter through `Fotohub_Analytics::normalize_period()` and `period_start()`.
- Credits and generation counts per category and per model.
- Top products by credit spend (`get_top_products()`).
- Recent rows (`get_recent_rows()`, newest first, up to 200).
- Recent billing transactions from `GET /v1/billing/transactions`.
- A Chart.js chart of usage by model. Chart.js 4.4.1 is loaded from jsDelivr; no copy is vendored in the plugin.

### CSV export

The **Export CSV** button links to `admin.php?page=fotohub-ai-analytics&action=export_csv` with a `fotohub_export_csv` nonce. `Fotohub_Analytics::handle_csv_export()` checks `manage_options` and the nonce, then streams up to 10,000 rows with the columns: ID, User ID, Endpoint, Category, Model, Credits Used, Status, Duration (ms), Post ID, Product ID, Date. The same export is reachable over AJAX as `fotohub_export_csv`.

### Dashboard widget

`wp_dashboard_setup` registers **FOTOhub AI Usage** (`manage_options` only). It shows the credit balance — flagged as low under 50 credits — plus 30-day counts and credits per category, and links to the full analytics page. On `index.php` the plugin enqueues only `admin/css/analytics.css` so the widget stays styled without loading the whole admin bundle.

### Attaching context to a log row

```php
// Tag the next API calls with a product, then clear the context.
Fotohub_Analytics::set_request_context( array( 'product_id' => 128 ) );
$api = new Fotohub_API();
$api->generate_image( 'studio packshot of a ceramic mug' );
Fotohub_Analytics::clear_request_context();
```

`set_request_context()` accepts `post_id` and `product_id`. `Fotohub_Bulk::run_product_photos_job()` uses exactly this pattern so background generations are attributable to a product.

## Job scheduler

`Fotohub_Scheduler` is a WP-Cron-backed queue in `{$wpdb->prefix}fotohub_jobs`.

### Cron hooks and intervals

| Hook | Recurrence | Handler |
|------|-----------|---------|
| `fotohub_process_queue` | `fotohub_every_5_minutes` (300 s) | `Fotohub_Scheduler::process_queue()` — 5 jobs per run |
| `fotohub_nightly_batch` | `daily`, first run at 02:00 site time | `run_nightly_batch()` — 50 jobs per run |
| `fotohub_retry_failed` | `fotohub_every_5_minutes` | `retry_failed()` — resets `failed` rows below `max_attempts` to `pending` |
| `fotohub_video_poll_jobs` | `every_two_minutes` (120 s) | `Fotohub_Video::cron_poll_pending_jobs()` |
| `fotohub_generate_product_photos_job` | Action Scheduler async, or the queue table | `Fotohub_Bulk::run_product_photos_job()` |

Custom intervals `fotohub_every_5_minutes` and `fotohub_nightly` are registered through the `cron_schedules` filter, and `every_two_minutes` through a second `cron_schedules` callback in `Fotohub_Video`. Events are scheduled on `admin_init` (`maybe_schedule_events()`), after the intervals are known to WP-Cron.

### Job types

`Fotohub_Scheduler::JOB_TYPES` — anything else is rejected by `schedule_job()`, which returns `0`:

`generate_image`, `generate_video`, `remove_background`, `bulk_product_photos`, `bulk_alt_text`

Statuses: `pending`, `running`, `completed`, `failed`. Default `max_attempts` is 3; a job that throws is set back to `pending` until attempts are exhausted, then `failed`.

### Scheduler page

**FOTOhub AI → Scheduler** lists jobs with status tabs, pagination, per-row Cancel / Retry / View buttons, and a "schedule new job" form that posts the `fotohub_schedule_job` AJAX action. Completion mail is sent by `notify_completion()` to `get_option('admin_email')` unless `fotohub_ai_notify_completion` is set to anything other than `yes`.

### Scheduling a job from code

```php
$job_id = Fotohub_Scheduler::schedule_job(
    'bulk_alt_text',
    array( 'attachment_ids' => array( 11, 12, 13 ) ),
    '2026-08-01 02:00:00' // optional; null runs on the next queue pass
);
```

### Housekeeping helpers

```php
Fotohub_Scheduler::get_jobs( 'failed', 1, 20 );  // { jobs, total }
Fotohub_Scheduler::get_status_counts();          // per-status + 'all'
Fotohub_Scheduler::cancel_job( $job_id );
Fotohub_Scheduler::cleanup_old_jobs( 30 );       // delete completed older than N days
Fotohub_Scheduler::unschedule_all();
```

## AJAX actions

Every action below is registered with `add_action( 'wp_ajax_<action>', ... )` and requires the `fotohub_ai_nonce` nonce in a `nonce` field.

| Action | Handler | Capability |
|--------|---------|-----------|
| `fotohub_generate_image` | `Fotohub_Ajax` | `upload_files` |
| `fotohub_remove_bg` | `Fotohub_Ajax` | `upload_files` |
| `fotohub_upscale` | `Fotohub_Ajax` | `upload_files` |
| `fotohub_test_connection` | `Fotohub_Ajax` | `manage_options` |
| `fotohub_bulk_generate` | `Fotohub_Ajax` | `upload_files` |
| `fotohub_generate_product_photos` | `Fotohub_Ajax` | `upload_files` |
| `fotohub_generate_copy` | `Fotohub_Ajax` | `upload_files` |
| `fotohub_analyze_image` | `Fotohub_Ajax` | `upload_files` |
| `fotohub_bulk_alt_text` | `Fotohub_Ajax` | `upload_files` + `manage_options` |
| `fotohub_schedule_job` | `Fotohub_Ajax` | `upload_files` + `manage_options` |
| `fotohub_get_analytics` | `Fotohub_Ajax` | `upload_files` + `manage_options` |
| `fotohub_estimate_cost` | `Fotohub_Ajax` | `upload_files` |
| `fotohub_export_csv` | `Fotohub_Ajax` | `upload_files` + `manage_options` |
| `fotohub_stability_tool` | `Fotohub_Stability` | `upload_files` |
| `fotohub_generate_video` | `Fotohub_Video` | `upload_files` |
| `fotohub_poll_video_status` | `Fotohub_Video` | `upload_files` |
| `fotohub_generate_turntable` | `Fotohub_Video` | `upload_files` |
| `fotohub_generate_lifestyle_video` | `Fotohub_Video` | `upload_files` |

There are exactly 18 `wp_ajax_*` actions plus the 13 `fotohub_commerce_*` actions documented on the [WooCommerce page](/integrations/woocommerce#ajax-actions). No `wp_ajax_nopriv_*` handler is registered anywhere: none of these endpoints is reachable by a logged-out visitor.

`fotohub_generate_turntable` and `fotohub_generate_lifestyle_video` have server handlers but no caller in the bundled admin JavaScript; the shipped video modal posts `fotohub_generate_video` with a video type. They are usable from custom code.

## Actions and filters for developers

The plugin fires five actions. These are the complete set — there is no `fotohub_image_generated`, `fotohub_bulk_start`, `fotohub_bulk_complete`, `fotohub_generate_prompt`, `fotohub_default_options` or `fotohub_before_save` hook.

### `fotohub_api_request_completed`

Fired after every FOTOhub API call, by both the REST client and the bridge client.

```php
add_action(
    'fotohub_api_request_completed',
    function ( string $endpoint, string $category, string $model, float $credits, bool $success, int $duration_ms ) {
        if ( ! $success ) {
            error_log( "FOTOhub call failed: {$endpoint} ({$duration_ms}ms)" );
        }
    },
    10,
    6
);
```

### `fotohub_job_completed`

Fired by the scheduler when a queued job finishes successfully.

```php
add_action( 'fotohub_job_completed', function ( int $job_id, $result ) {
    // $result is the decoded API response for the job.
}, 10, 2 );
```

### `fotohub_draft_approved`

Fired after a commerce draft has been written to a product. See the [WooCommerce page](/integrations/woocommerce#draft-hooks).

### `fotohub_commerce_callback`

Fired for every verified bridge callback. See the [WooCommerce page](/integrations/woocommerce#bridge-callback).

### Filters the plugin adds to WordPress

The plugin registers callbacks on these core filters. It does not define any filter of its own, so there is no supported way to rewrite a prompt or override default generation options through a filter — pass explicit options to `Fotohub_API` instead.

| Filter | Purpose |
|--------|---------|
| `plugin_action_links_{basename}` | Settings and Bulk AI links |
| `media_row_actions` | Remove Background / Upscale, plus 13 Stability tools |
| `bulk_actions-upload` | Remove Background (FOTOhub) |
| `handle_bulk_actions-upload` | Runs the media bulk action |
| `bulk_actions-edit-product` | Generate AI Photos (FOTOhub) — WooCommerce only |
| `handle_bulk_actions-edit-product` | Queues product photo jobs — WooCommerce only |
| `woocommerce_product_data_tabs` | Video tab — WooCommerce only |
| `cron_schedules` | `fotohub_every_5_minutes`, `fotohub_nightly`, `every_two_minutes` |
| `posts_clauses` | Structural product filters in the picker — WooCommerce only |

### Using the API client directly

```php
$api = new Fotohub_API();               // uses the stored, decrypted key
if ( ! $api->is_configured() ) {
    return;
}

$result = $api->generate_image( 'flat lay of three linen napkins on oak', array(
    'model'      => 'imagen-4-standard',
    'width'      => 1024,
    'height'     => 1280,
    'num_images' => 2,
) );

if ( is_wp_error( $result ) ) {
    return;
}

foreach ( $result['images'] as $image ) {
    $attachment_id = Fotohub_Media::sideload_image( $image['url'] );
}
```

Useful methods on `Fotohub_API`: `generate_image()`, `edit_image()`, `remove_background()`, `replace_background()`, `upscale_image()`, `enhance_image()`, `clip_tag()`, `analyze_image()`, `generate_alt_text()`, `enhance_prompt()`, `chat()`, `generate_video()`, `generate_music()`, `generate_sfx()`, `generate_speech()`, `transcribe()`, `stability_tool()` and the per-tool wrappers, `get_balance()`, `get_cached_balance()`, `get_pricing()`, `estimate_cost()`, `get_transactions()`, `list_models()`, `get_stability_tools()`, `test_connection()`.

`chat()` accepts four model aliases only — `gemini-flash`, `gemini-pro`, `gpt-4o`, `claude-sonnet` — and silently coerces anything else to `claude-sonnet`, because the endpoint rejects unknown IDs with HTTP 400.

## Database tables

Three tables are created on activation and dropped on uninstall.

| Table | Created by | Purpose |
|-------|-----------|---------|
| `{prefix}fotohub_usage` | `Fotohub_Analytics::install_table()` | One row per API call: endpoint, category, model, credits, status, duration, post/product |
| `{prefix}fotohub_jobs` | `Fotohub_Scheduler::install_table()` | Queue: `job_type`, `status`, `payload`, `result`, `attempts`, `max_attempts`, `scheduled_at`, timestamps |
| `{prefix}fotohub_drafts` | `Fotohub_Drafts::install_table()` | Draft-first write-back store — see the [WooCommerce page](/integrations/woocommerce#drafts-table) |

## Post meta keys

| Meta key | Written by |
|----------|-----------|
| `_wp_attachment_image_alt` | Alt text generation (core WordPress key) |
| `_fotohub_generated` | Attachments created from an approved draft or a generated video |
| `_fotohub_job_id` | Bridge job that produced an attachment |
| `_fotohub_stability_tool` | Tool that produced an attachment |
| `_fotohub_stability_source` | Source attachment of a Stability result |
| `_fotohub_video_jobs` | Pending video jobs on a product |
| `_fotohub_generated_video` | Generated video attachment marker |
| `_fotohub_video_parent` | Product a generated video belongs to |
| `_fotohub_draft` | Pending draft IDs on a product |
| `_fotohub_faq` | Approved FAQ block |
| `_fotohub_json_ld` | Approved JSON-LD product schema |
| `_fotohub_meta_title` | Approved meta title when no SEO plugin is active |
| `_fotohub_meta_description` | Approved meta description when no SEO plugin is active |

## Uninstall

`uninstall.php` runs only under `WP_UNINSTALL_PLUGIN` and removes everything, per site across a multisite network:

- Drops `fotohub_jobs`, `fotohub_usage`, `fotohub_drafts`.
- Deletes every option matching `fotohub_%`, and every `transient_fotohub_%` / `transient_timeout_fotohub_%` row.
- Deletes all 12 plugin post meta keys with `delete_metadata( 'post', 0, $key, '', true )`.
- Clears the scheduled hooks `fotohub_ai_clear_cache`, `fotohub_process_queue`, `fotohub_nightly_batch`, `fotohub_retry_failed`, `fotohub_video_poll_jobs`, `fotohub_generate_product_photos_job`, and calls `as_unschedule_all_actions()` when Action Scheduler is present.
- On multisite, also deletes network options matching `fotohub_%` from `sitemeta`.

Export anything you want to keep — the analytics CSV especially — before uninstalling.

## MCP and assistants

**FOTOhub AI → MCP & Assistants** prints a copyable Claude Desktop config and a Cursor config for `https://apis.fotohub.app/mcp/`. Connecting an assistant gives it the same FOTOhub tools the plugin uses. See [MCP Integration](/integrations/mcp).

## Localization

- Text domain `fotohub-ai`, loaded from `/languages` on `init`.
- `languages/fotohub-ai.pot` ships with the plugin.
- Polish is complete: `fotohub-ai-pl_PL.po` / `.mo` cover the whole interface.
- The bridge picks the copy language from the site locale (`Fotohub_Bridge::store_locale()` / `default_language()`), falling back to `en` outside `en`, `pl`, `de`.
- Preset names are shown in Polish on Polish sites when the preset carries a `name_pl`.

## Security model

- **Key at rest** — AES-256-CBC with a key derived from `AUTH_KEY`; decryption falls back to the raw value so a pre-encryption install keeps working.
- **AJAX** — every handler calls `check_ajax_referer()` and a capability check. Read-only image work needs `upload_files`; analytics, scheduling and the CSV export additionally need `manage_options`.
- **REST** — copywriter routes require `edit_posts` plus a stored key. The commerce callback route authenticates with an HMAC signature instead of a WordPress capability, because the caller is a server, not a user.
- **Signature comparison** — `hash_equals()` on the hex digest, never `==`.
- **Escaping** — product- and API-derived strings are escaped at output and inserted as text.
- **HPOS** — compatibility with WooCommerce custom order tables is declared through `FeaturesUtil::declare_compatibility()`.

## Requirements

- WordPress 6.0 or newer (tested to 6.7)
- PHP 8.0 or newer
- cURL or `allow_url_fopen` for the WordPress HTTP API
- `openssl` for encrypted key storage (the plugin degrades to plaintext storage without it)
- WP-Cron running, or a real system cron hitting `wp-cron.php`, for the scheduler and video polling
- A FOTOhub account with credits

## Troubleshooting

| Symptom | Cause and fix |
|---------|---------------|
| "No API key configured" on Test Connection | The key was saved as the masked placeholder. Retype the full key; `sanitize_api_key()` treats any value containing `***` as unchanged. |
| Test Connection reports a transport error | Outbound HTTPS to `apis.fotohub.app` is blocked. Check the host firewall and any `WP_HTTP_BLOCK_EXTERNAL` constant. |
| Analytics page is empty | No API call has been made since activation, or the `fotohub_usage` table is missing. Deactivate and reactivate to re-run `install_table()`. |
| Chart on the analytics page does not render | jsDelivr is blocked by a CSP or an offline environment. Chart.js is loaded from the CDN by design. |
| Scheduler jobs stay `pending` | WP-Cron is disabled (`DISABLE_WP_CRON`). Add a system cron that requests `wp-cron.php`. |
| Video generation fails with a model error | The modal ships provider shorthands. Use a fully-qualified model ID from the [Video Generation](/api/video-generation) catalog. |
| Media bulk background removal times out | That bulk action runs inline. Process fewer images per batch. |
| Stability tool asks for a mask repeatedly | The tool requires one (`erase`, `inpaint`). Paint a mask in the browser before submitting. |
| "You do not have permission" on a FOTOhub page | Editors have `upload_files` but not `manage_options`. Only the Stability Tools page is available to them. |

## Planned

Not built. Do not plan around these.

- **REST endpoints for image work.** There is no `POST /wp-json/fotohub-ai/v1/generate`, `remove-background`, `upscale`, `balance` or `models`. Image operations are AJAX-only today; a headless REST surface is planned.
- **Public filters.** No `fotohub_generate_prompt`, `fotohub_default_options` or `fotohub_before_save` filter exists. A documented filter API for prompt and option rewriting is planned.
- **WP-CLI commands.** There is no `wp fotohub …` command; nothing in the plugin references `WP_CLI`. CLI commands for bulk alt text and queue draining are planned.
- **Featured-image generation from the post editor.** The AI Writer sidebar generates text, and the media modal generates images, but there is no one-click "generate featured image" control in the Featured Image panel.
- **Bulk featured-image generation for posts.** Bulk Generate takes a prompt list; it does not walk posts that lack a featured image.
- **A settings screen for the scheduler.** `fotohub_ai_scheduler_batch_size`, `fotohub_ai_scheduler_notify_email` and `fotohub_ai_default_video_model` are seeded at activation but no UI writes them and no code reads them.
- **Shortcodes for images and balance.** Only `[fotohub_product_video]` exists.
- **A `FOTOHUB_TIMEOUT` constant.** Timeouts are fixed in code: 120 s for the REST client, 45 s for the bridge client.
- **Corrected video model list.** The modal's seven shorthands need replacing with real model IDs.

## Links

- [WooCommerce integration](/integrations/woocommerce) — bulk product jobs and drafts
- [Commerce Bridge](/integrations/commerce-bridge) — the batching service behind bulk jobs
- [Integrations overview](/integrations/overview)
- [GitHub: fotohubapp/wordpress-plugin](https://github.com/fotohubapp/wordpress-plugin)
- [Image Generation API](/api/image-generation) · [Video Generation API](/api/video-generation) · [Billing & Pricing](/api/billing)
- [PHP SDK](/sdk/php)
