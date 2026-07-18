# PrestaShop Module

Generate AI product images, remove backgrounds, and bulk-process your PrestaShop catalog with the FOTOhub AI module.

## Installation

1. Download the module from [GitHub](https://github.com/fotohubapp/prestashop-module)
2. Go to **Modules → Module Manager** in PrestaShop back office
3. Click **Upload a Module** and select the zip file
4. Click **Configure** after installation

Or via command line:

```bash
cd /var/www/prestashop/modules/
unzip fotohubai.zip
php bin/console prestashop:module install fotohubai
```

## Configuration

After installation, go to **Modules → FOTOhub AI → Configure**:

| Setting | Description |
|---------|-------------|
| API Key | Your FOTOhub API key (`fh_live_...`) |
| Default Model | Image generation model (default: `seedream-5-0-260128`) |
| Image Width | Default width for generated images |
| Image Height | Default height for generated images |

Click **Test Connection** to verify your API key works.

## Features

### Product Image Generation

Generate AI images directly from the product edit page:

1. Edit any product in **Catalog → Products**
2. Go to the **Images** tab
3. Click **"Generate with FOTOhub AI"** button
4. The module auto-creates a prompt from product name, category, and features
5. Choose style and number of images
6. Generated images are added to the product gallery

### Bulk Catalog Processing

Process multiple products at once:

1. Go to **Catalog → FOTOhub Bulk** (added by the module)
2. Filter products by category, manufacturer, or missing images
3. Select action:
   - **Generate** — Create new product photos
   - **Remove Background** — Process existing product images
   - **Upscale** — Enhance low-resolution images
4. Click **Start Processing**
5. Progress bar shows real-time status

### Background Removal

Remove backgrounds from product images:

1. Edit product → Images tab
2. Select an existing image
3. Click **"Remove Background"**
4. Transparent PNG is saved as a new product image

### Image Upscaling

Upscale low-resolution product images:

1. Edit product → Images tab
2. Select image to upscale
3. Click **"Upscale (2x/4x)"**
4. High-resolution version replaces the original

## Admin Controller

The module adds a dedicated admin page at **Catalog → FOTOhub Bulk** with:

- Product list with image status indicators
- Batch selection (checkbox per product)
- Action selector (generate / remove-bg / upscale)
- Queue progress with thumbnails
- Credit balance display
- Generation history log

## Hooks

The module uses PrestaShop hooks for seamless integration:

| Hook | Purpose |
|------|---------|
| `displayAdminProductsExtra` | Adds "Generate with AI" button on product page |
| `actionAdminProductsControllerSaveAfter` | Optional auto-generation on product save |
| `displayBackOfficeHeader` | Loads admin CSS/JS assets |

## Smarty Variables

In custom templates, access FOTOhub data:

```smarty
{* Check if FOTOhub is configured *}
{if $fotohub_configured}
  <p>Credits remaining: {$fotohub_credits}</p>
  <p>Plan: {$fotohub_plan}</p>
{/if}
```

## API Client

The module includes `FotoHubApiClient` class for custom development:

```php
// In a custom PrestaShop controller or module
require_once _PS_MODULE_DIR_ . 'fotohubai/classes/FotoHubApiClient.php';

$client = new FotoHubApiClient(
    Configuration::get('FOTOHUBAI_API_KEY')
);

// Generate an image
$result = $client->generateImage(
    'Professional product photo: ' . $product->name,
    ['model' => 'seedream-5-0-260128', 'width' => 1024, 'height' => 1024]
);

// Remove background
$result = $client->removeBackground($imageUrl);

// Check balance
$balance = $client->getBalance();
```

## Multi-language Support

The module respects PrestaShop's multi-language system:

- Prompts are built from the active back-office language
- Generated images are assigned to all languages (shared images)
- Admin interface is translatable

## Requirements

- PrestaShop 8.0+
- PHP 8.0+
- cURL extension enabled
- Active FOTOhub account with API key

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Connection failed" | Check API key in module configuration |
| "Insufficient credits" | Top up at fotohub.app/console |
| Images not saving | Check `img/p/` directory permissions (755) |
| Module not appearing | Clear PrestaShop cache: Advanced Parameters → Performance |
| Timeout on bulk | Reduce batch size or increase PHP `max_execution_time` |

## Links

- [GitHub: fotohubapp/prestashop-module](https://github.com/fotohubapp/prestashop-module)
- [FOTOhub Console](https://fotohub.app/console)
- [PHP SDK](/sdk/php)
- [API Reference](/api/getting-started)
