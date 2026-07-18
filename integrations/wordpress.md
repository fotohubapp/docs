# WordPress Plugin

Generate AI images directly in your WordPress media library, create post thumbnails, and bulk-process your content with FOTOhub AI.

## Installation

1. Download the plugin from [GitHub](https://github.com/fotohubapp/wordpress-plugin)
2. Upload to `wp-content/plugins/fotohub-ai/`
3. Activate in **Plugins → Installed Plugins**
4. Go to **Settings → FOTOhub AI** and enter your API key

Or install via WP-CLI:

```bash
wp plugin install https://github.com/fotohubapp/wordpress-plugin/releases/latest/download/fotohub-ai.zip --activate
```

## Configuration

Navigate to **Settings → FOTOhub AI** in your WordPress admin:

| Setting | Description |
|---------|-------------|
| API Key | Your FOTOhub API key (`fh_live_...`) |
| Default Model | Model for image generation (default: `seedream-5-0-260128`) |
| Default Size | Image dimensions for generated images |
| Auto-thumbnails | Automatically generate featured images for new posts |

## Features

### Media Library AI Generation

Generate images directly from the WordPress Media Library:

1. Go to **Media → Add New**
2. Click **"Generate with AI"** tab
3. Enter your prompt
4. Choose model and options
5. Click **Generate** — image is added to your media library

The generated image is stored as a standard WordPress attachment with full metadata.

### Post/Page Featured Images

Generate AI featured images for posts and pages:

1. Edit any post or page
2. In the **Featured Image** panel, click **"Generate with AI"**
3. Describe the image you want
4. Generated image is set as the featured image

### Gutenberg Block

Use the **FOTOhub AI Image** block in the block editor:

1. Add a new block → search "FOTOhub"
2. Enter prompt in the block settings
3. Click Generate
4. Image appears inline in your content

### Bulk Thumbnail Generation

Generate featured images for multiple posts at once:

1. Go to **Tools → FOTOhub Bulk**
2. Select posts without featured images
3. Choose generation settings
4. Click **Start Bulk Generation**
5. Progress bar shows completion status

### Background Removal

Remove backgrounds from any image in your media library:

1. Go to **Media Library**
2. Click any image → **Edit**
3. Click **"Remove Background"**
4. Transparent PNG is saved as a new attachment

### Image Upscaling

Upscale low-resolution images:

1. Select image in Media Library
2. Click **"Upscale with AI"**
3. Choose scale (2x or 4x)
4. Hi-res version is saved as new attachment

## Hooks & Filters

### Actions

```php
// Fires after an AI image is generated
do_action('fotohub_image_generated', $attachment_id, $prompt, $model);

// Fires before bulk generation starts
do_action('fotohub_bulk_start', $post_ids, $options);

// Fires after bulk generation completes
do_action('fotohub_bulk_complete', $results);
```

### Filters

```php
// Modify the prompt before sending to API
add_filter('fotohub_generate_prompt', function($prompt, $post) {
    return "Professional blog header: " . $prompt;
}, 10, 2);

// Modify default generation options
add_filter('fotohub_default_options', function($options) {
    $options['model'] = 'imagen-4-standard';
    $options['width'] = 1200;
    $options['height'] = 630;
    return $options;
});

// Filter the generated image before saving
add_filter('fotohub_before_save', function($image_url, $prompt) {
    // Custom processing
    return $image_url;
}, 10, 2);
```

## REST API Endpoints

The plugin registers WordPress REST endpoints for headless/AJAX usage:

```
POST /wp-json/fotohub/v1/generate
POST /wp-json/fotohub/v1/remove-background
POST /wp-json/fotohub/v1/upscale
GET  /wp-json/fotohub/v1/balance
GET  /wp-json/fotohub/v1/models
```

### Example: Generate via REST

```bash
curl -X POST https://yoursite.com/wp-json/fotohub/v1/generate \
  -H "X-WP-Nonce: your_nonce" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A mountain landscape at sunset", "model": "seedream-5-0-260128"}'
```

## Shortcodes

```html
<!-- Display a generated image -->
[fotohub_image prompt="A sunset over mountains" model="seedream-5-0-260128" width="800"]

<!-- Display account balance -->
[fotohub_balance]
```

## Requirements

- WordPress 6.0+
- PHP 8.0+
- Active FOTOhub account with API key
- `allow_url_fopen` or cURL extension enabled

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid API key" | Check key in Settings → FOTOhub AI. Must start with `fh_live_` |
| Images not generating | Check credit balance at fotohub.app/console |
| Timeout errors | Increase `FOTOHUB_TIMEOUT` in wp-config.php |
| Permission denied | Ensure your WordPress role has `upload_files` capability |

## Links

- [GitHub: fotohubapp/wordpress-plugin](https://github.com/fotohubapp/wordpress-plugin)
- [FOTOhub Console](https://fotohub.app/console)
- [API Reference](/api/getting-started)
- [PHP SDK](/sdk/php)
