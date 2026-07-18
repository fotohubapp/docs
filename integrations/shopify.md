# Shopify Integration

Generate AI product photos, remove backgrounds, and bulk-process your entire Shopify catalog with FOTOhub AI.

## Installation

```bash
npm install @fotohub/shopify
```

**Requirements:** Node.js 18+

## Quick Start

```typescript
import { FotoHubShopify } from '@fotohub/shopify';

const fotohub = new FotoHubShopify({
  apiKey: 'fh_live_your_key_here',
  shopDomain: 'your-store.myshopify.com',
});

// Generate a product photo
const result = await fotohub.generateProductPhoto({
  title: 'Premium Leather Wallet',
  product_type: 'Accessories',
  tags: ['leather', 'minimalist', 'black'],
}, {
  style: 'product',
  background: 'white',
  numImages: 3,
});

console.log(result.images); // [{url: "https://...", width: 1024, height: 1024}]
```

## Configuration

```typescript
import { FotoHubShopify } from '@fotohub/shopify';

const fotohub = new FotoHubShopify({
  apiKey: 'fh_live_your_key_here',       // Required
  shopDomain: 'store.myshopify.com',     // Optional: for product context
});
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiKey` | `string` | Yes | FOTOhub API key |
| `shopDomain` | `string` | No | Your Shopify store domain |

## Features

### Product Photo Generation

Generate professional product photos from product data. The integration automatically builds optimal prompts from your product title, type, and tags.

```typescript
const result = await fotohub.generateProductPhoto({
  title: 'Organic Cotton T-Shirt',
  product_type: 'Clothing',
  tags: ['cotton', 'sustainable', 'navy-blue'],
  description: 'Premium organic cotton crew neck t-shirt',
}, {
  style: 'product',       // 'product' | 'lifestyle' | 'flat-lay' | 'model-shot'
  background: 'white',    // 'white' | 'transparent' | 'studio' | 'lifestyle'
  aspectRatio: '1:1',
  numImages: 4,
});
```

#### Photo Styles

| Style | Description | Best For |
|-------|-------------|----------|
| `product` | Clean product shot, studio lighting | Marketplace listings |
| `lifestyle` | Product in context/scene | Social media, ads |
| `flat-lay` | Top-down arranged layout | Fashion, accessories |
| `model-shot` | On model/in use | Clothing, wearables |

### Lifestyle Photos

Generate context/scene photos for social media and marketing:

```typescript
const result = await fotohub.generateLifestylePhoto(
  {
    title: 'Ceramic Coffee Mug',
    product_type: 'Kitchen',
  },
  'Cozy morning kitchen with sunlight streaming through window'
);
```

### Background Removal

Remove backgrounds from existing product images:

```typescript
const processed = await fotohub.removeProductBackground(
  'https://cdn.shopify.com/your-product-image.jpg'
);

console.log(processed.url);      // Transparent PNG URL
console.log(processed.format);   // 'png'
```

### Image Upscaling

Upscale low-resolution product images for hi-res displays:

```typescript
const upscaled = await fotohub.upscaleProductImage(
  'https://cdn.shopify.com/your-product-image.jpg',
  4  // 2x or 4x
);

console.log(upscaled.url);
console.log(`${upscaled.width}x${upscaled.height}`);
```

### AI Product Descriptions

Generate SEO-optimized product descriptions:

```typescript
const description = await fotohub.generateProductDescription(
  {
    title: 'Wireless Bluetooth Headphones',
    product_type: 'Electronics',
    tags: ['wireless', 'noise-canceling', 'premium'],
  },
  {
    tone: 'professional',   // 'professional' | 'casual' | 'luxury' | 'technical'
    length: 'medium',       // 'short' | 'medium' | 'long'
  }
);

console.log(description);
// "Experience pure audio freedom with our Wireless Bluetooth Headphones..."
```

## Bulk Processing

### Bulk Generate Photos

Process multiple products at once with concurrency control and progress tracking:

```typescript
const products = [
  { id: '1', title: 'Leather Wallet', product_type: 'Accessories' },
  { id: '2', title: 'Silk Scarf', product_type: 'Fashion' },
  { id: '3', title: 'Canvas Backpack', product_type: 'Bags' },
  // ... 100+ products
];

const result = await fotohub.bulkGeneratePhotos(products, {
  style: 'product',
  background: 'white',
  concurrency: 5,
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total} (${Math.round(completed/total*100)}%)`);
  },
});

console.log(`Completed: ${result.completed}`);
console.log(`Failed: ${result.failed}`);
console.log(`Total credits: ${result.creditsUsed}`);

for (const item of result.items) {
  if (item.status === 'completed') {
    console.log(`${item.product.title}: ${item.images[0].url}`);
  }
}
```

### Process Entire Catalog

Apply multiple actions to your catalog in one pass:

```typescript
const result = await fotohub.processCatalog(products, [
  { type: 'remove-background' },
  { type: 'generate', options: { style: 'lifestyle', numImages: 2 } },
  { type: 'description', options: { tone: 'luxury' } },
], (completed, total) => {
  process.stdout.write(`\r${completed}/${total}`);
});
```

### Catalog Actions

| Action | Description | Options |
|--------|-------------|---------|
| `generate` | Generate new product photos | `style`, `background`, `numImages` |
| `remove-background` | Remove backgrounds from existing images | - |
| `upscale` | Upscale existing product images | `scale` (2 or 4) |
| `description` | Generate AI product description | `tone`, `length` |

## Error Handling

```typescript
import { FotoHubShopify } from '@fotohub/shopify';

const fotohub = new FotoHubShopify({ apiKey: 'fh_live_...' });

try {
  const result = await fotohub.generateProductPhoto(product, { style: 'product' });
} catch (error) {
  if (error.code === 'insufficient_credits') {
    console.error('Not enough credits. Top up at fotohub.app/console');
  } else if (error.code === 'rate_limit_exceeded') {
    console.error(`Rate limited. Retry after ${error.retryAfter}s`);
  } else {
    console.error(`Error: ${error.message}`);
  }
}
```

## Shopify App Bridge (Optional)

For building a full Shopify app with embedded admin UI, use alongside `@shopify/shopify-api`:

```typescript
import { FotoHubShopify } from '@fotohub/shopify';
import shopify from '@shopify/shopify-api';

// Fetch products from Shopify Admin API
const session = await shopify.auth.getSession(req, res);
const client = new shopify.clients.Rest({ session });
const { body } = await client.get({ path: 'products' });

// Generate photos for all products
const fotohub = new FotoHubShopify({ apiKey: process.env.FOTOHUB_API_KEY });
const results = await fotohub.bulkGeneratePhotos(body.products, {
  style: 'product',
  background: 'white',
});
```

## Types Reference

```typescript
interface ShopifyProduct {
  id: string | number;
  title: string;
  description?: string;
  tags?: string[];
  product_type?: string;
  vendor?: string;
  variants?: ShopifyVariant[];
  images?: ShopifyImage[];
}

interface GenerateOptions {
  model?: string;
  style?: 'product' | 'lifestyle' | 'flat-lay' | 'model-shot';
  background?: 'white' | 'transparent' | 'studio' | 'lifestyle';
  aspectRatio?: string;
  numImages?: number;
}

interface BulkOptions extends GenerateOptions {
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
}

interface BulkResult {
  completed: number;
  failed: number;
  creditsUsed: number;
  items: Array<{
    product: ShopifyProduct;
    status: 'completed' | 'failed';
    images?: Array<{ url: string; width: number; height: number }>;
    error?: string;
  }>;
}
```

## Links

- [GitHub: fotohubapp/shopify-app](https://github.com/fotohubapp/shopify-app)
- [npm: @fotohub/shopify](https://www.npmjs.com/package/@fotohub/shopify)
- [FOTOhub API Reference](/api/getting-started)
- [TypeScript SDK](/sdk/typescript)
