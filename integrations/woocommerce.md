# WooCommerce Integration

Generate AI product photos, remove backgrounds, and bulk-process your WooCommerce catalog. Part of the FOTOhub WordPress plugin with WooCommerce-specific features.

## Installation

Install the [FOTOhub WordPress Plugin](/integrations/wordpress) — WooCommerce features activate automatically when WooCommerce is detected.

## Features

### Product Photo Generation

Generate AI product images directly from the WooCommerce product editor:

1. Edit any product in **Products → All Products**
2. In the **Product Image** panel, click **"Generate with AI"**
3. The plugin auto-builds a prompt from product name, category, and attributes
4. Choose style and options
5. Generated image is set as the product image

### Product Gallery Generation

Generate multiple images for the product gallery:

1. In the product editor, scroll to **Product Gallery**
2. Click **"Generate Gallery with AI"**
3. Select how many images and which styles
4. Images are added to the gallery

### Bulk Catalog Processing

Process your entire product catalog at once:

1. Go to **WooCommerce → FOTOhub Bulk**
2. Filter products (by category, missing images, price range)
3. Choose actions:
   - Generate product photos
   - Remove backgrounds
   - Upscale images
   - Generate descriptions
4. Set concurrency and click **Start**
5. Live progress bar with per-product status

### AI Product Descriptions

Generate SEO-optimized descriptions:

1. Edit product → click **"AI Description"** button
2. Choose tone: professional, casual, luxury, technical
3. Generated description appears in the editor
4. Edit and save

### Variation Image Generation

Auto-generate images for product variations:

1. Variable product → **Variations** tab
2. Click **"Generate Variation Images"**
3. Plugin uses variation attributes (color, size, material) to create unique prompts
4. Each variation gets its own AI-generated image

## WooCommerce Hooks

```php
// After product photo is generated
do_action('fotohub_wc_product_image_generated', $product_id, $attachment_id);

// Before bulk catalog processing
do_action('fotohub_wc_bulk_start', $product_ids, $actions);

// Filter auto-generated prompt for a product
add_filter('fotohub_wc_product_prompt', function($prompt, $product) {
    // Add brand-specific styling instructions
    $brand = $product->get_attribute('brand');
    return "{$prompt}, {$brand} brand style photography";
}, 10, 2);

// Filter description generation parameters
add_filter('fotohub_wc_description_params', function($params, $product) {
    $params['tone'] = 'luxury';
    $params['include_specs'] = true;
    return $params;
}, 10, 2);
```

## Settings

In **WooCommerce → Settings → FOTOhub AI**:

| Setting | Default | Description |
|---------|---------|-------------|
| Auto-generate on publish | Off | Generate product image when product is published |
| Default style | `product` | Photo style (product, lifestyle, flat-lay) |
| Default background | `white` | Background type |
| Include attributes in prompt | On | Use product attributes in AI prompt |
| Image dimensions | 1024x1024 | Generated image size |
| Bulk concurrency | 3 | Parallel generations in bulk mode |

## Prompt Building

The plugin automatically builds prompts from WooCommerce product data:

```
"Professional {style} photography of {product_name},
 {category} category, {attributes},
 {background} background, studio lighting, high quality"
```

**Example:**
- Product: "Men's Slim Fit Chinos"
- Category: "Pants"
- Attributes: color=navy, material=cotton
- Style: product

**Generated prompt:**
> "Professional product photography of Men's Slim Fit Chinos, pants category, navy cotton, white background, studio lighting, high quality"

## REST Endpoints

```
POST /wp-json/fotohub/v1/wc/generate-product-image
POST /wp-json/fotohub/v1/wc/bulk-generate
POST /wp-json/fotohub/v1/wc/generate-description
GET  /wp-json/fotohub/v1/wc/catalog-stats
```

### Example: Generate Product Image via API

```bash
curl -X POST https://yourstore.com/wp-json/fotohub/v1/wc/generate-product-image \
  -H "X-WP-Nonce: your_nonce" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 42, "style": "lifestyle", "num_images": 3}'
```

## Requirements

- WordPress 6.0+
- WooCommerce 8.0+
- PHP 8.0+
- FOTOhub API key with active credits

## Links

- [WordPress Plugin Setup](/integrations/wordpress)
- [GitHub: fotohubapp/wordpress-plugin](https://github.com/fotohubapp/wordpress-plugin)
- [FOTOhub Console](https://fotohub.app/console)
- [Image Generation API](/api/image-generation)
