# Integrations

Connect FOTOhub AI to your existing tools and platforms. Generate product photos, remove backgrounds, create AI content, and automate your creative workflow directly from your e-commerce store, CMS, or automation platform.

## Official Integrations

### E-commerce

| Platform | Type | Features | Status |
|----------|------|----------|--------|
| [Shopify](/integrations/shopify) | npm package | Product photo generation, background removal, bulk catalog, AI descriptions | Stable |
| [WooCommerce](/integrations/woocommerce) | WordPress plugin | Media library AI, product photos, bulk generation, gallery management | Stable |
| [PrestaShop](/integrations/prestashop) | PS Module | Product image AI, bulk catalog processing, admin panel | Stable |

### CMS & Platforms

| Platform | Type | Features | Status |
|----------|------|----------|--------|
| [WordPress](/integrations/wordpress) | Plugin | Media library AI generation, post thumbnails, Gutenberg block | Stable |

### Automation

| Platform | Type | Features | Status |
|----------|------|----------|--------|
| [Zapier](/integrations/zapier) | Integration | Triggers & actions for image/video generation | Coming soon |
| n8n | Node | Custom node for all FOTOhub endpoints | Coming soon |
| [Make](/integrations/zapier) | Module | Visual automation with AI generation | Coming soon |

## How It Works

All integrations use the FOTOhub API under the hood. They provide a convenient interface tailored to each platform while using the same:

1. **API Key authentication** (`fh_live_...`)
2. **Credit-based billing** (same balance across all integrations)
3. **Model catalog** (40+ image models, 10+ video models, 30+ LLMs)
4. **Webhook notifications** (async job completion)

```
Your Store/CMS → FOTOhub Integration → FOTOhub API → AI Models → Result
```

## Getting Started

### 1. Get an API Key

Sign up at [fotohub.app/console](https://fotohub.app/console) and create an API key in the developer console.

### 2. Install the Integration

Choose your platform from the list above and follow the installation guide.

### 3. Configure

Enter your API key in the integration's settings panel. Most integrations auto-detect your plan and available credits.

### 4. Generate

Use the platform-native interface to generate images, remove backgrounds, or create content. All generations use your FOTOhub credit balance.

## Common Use Cases

### Product Photography

Generate professional product photos from text descriptions. Ideal for:
- New product listings without a photoshoot
- Seasonal/promotional variants
- A/B testing different visual styles
- Lifestyle shots and context images

### Background Removal

Automatically remove backgrounds from product images:
- Clean white backgrounds for marketplaces
- Transparent PNGs for compositing
- Batch processing entire catalogs

### Bulk Catalog Processing

Process hundreds of products at once:
- Generate missing product images
- Standardize image styles across catalog
- Upscale low-resolution images
- Create multiple variants per product

### AI Product Descriptions

Generate SEO-optimized product descriptions:
- Multiple languages
- Adjustable tone (professional, casual, luxury)
- Feature extraction from images

## API Key Scopes

All integrations use the same API key. Your key has access to:

| Capability | Endpoint |
|------------|----------|
| Image Generation | `POST /v1/ai/generate/image` |
| Video Generation | `POST /v1/ai/generate/video` |
| Background Removal | `POST /v1/ai/remove-background` |
| Image Upscaling | `POST /v1/ai/upscale` |
| Chat / LLM | `POST /v1/ai/chat/completions` |
| Speech Generation | `POST /v1/ai/generate/speech` |
| Models Catalog | `GET /v1/models` |
| Billing & Balance | `GET /v1/billing/balance` |
| Webhooks | `POST /v1/webhooks` |

## Building Custom Integrations

Need an integration for a platform we don't support yet? Use our SDKs:

- **[Python SDK](/sdk/python)** — `pip install fotohub`
- **[TypeScript SDK](/sdk/typescript)** — `npm install fotohub`
- **[PHP SDK](/sdk/php)** — `composer require fotohub/fotohub-php`
- **[REST API](/api/getting-started)** — Direct HTTP calls

See the [API Reference](/api/getting-started) for all available endpoints.
