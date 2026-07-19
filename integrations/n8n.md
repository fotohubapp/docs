# n8n Integration

Official FOTOhub community node for [n8n](https://n8n.io) — the open-source workflow automation platform. Automate AI image generation, video creation, 3D model generation, background removal, and more in your n8n workflows.

## Installation

In your n8n instance, go to **Settings → Community Nodes** and install:

```
n8n-nodes-fotohub
```

Or install via CLI:

```bash
cd ~/.n8n
npm install n8n-nodes-fotohub
```

Then restart your n8n instance.

## Authentication

1. In n8n, go to **Credentials → New Credential**
2. Search for "FOTOhub API"
3. Enter your API key (get one at [fotohub.app/console](https://fotohub.app/console))
4. Save

## Available Nodes

### FOTOhub (Action Node)

The main action node with the following resources and operations:

| Resource | Operations |
|----------|-----------|
| **Image** | Generate, Remove Background, Upscale, Edit |
| **Video** | Generate |
| **3D Model** | Image to 3D, Text to 3D |
| **Music** | Generate |
| **Speech** | Generate, Transcribe |
| **Chat** | Complete |
| **Analysis** | Analyze |

### FOTOhub Trigger

Webhook-based trigger node that fires on FOTOhub events:

| Event | Description |
|-------|-------------|
| `generation.completed` | An AI generation job completed successfully |
| `generation.failed` | A generation job failed |
| `credits.low` | Account credits dropped below threshold |
| `video.ready` | A video generation completed |
| `3d.ready` | A 3D model generation completed |

## Example Workflows

### Product Photo Pipeline

Automate product photography for e-commerce:

1. **Trigger**: New product added in Shopify
2. **FOTOhub**: Remove background from product photo
3. **FOTOhub**: Generate lifestyle background ("product on marble countertop")
4. **FOTOhub**: Upscale to 4K
5. **Shopify**: Update product with new images

### AI Content Generation

Generate social media assets:

1. **Schedule Trigger**: Every Monday at 9am
2. **FOTOhub (Chat)**: Generate image prompt from product description
3. **FOTOhub (Image)**: Generate image from prompt
4. **FOTOhub (Video)**: Create 5s product animation
5. **Slack**: Post to #marketing channel

### 3D Product Catalog

Convert product photos to 3D models:

1. **Trigger**: New file in Google Drive folder
2. **FOTOhub (Image)**: Remove background
3. **FOTOhub (3D)**: Convert to 3D model (GLB format)
4. **Google Drive**: Save 3D file
5. **FOTOhub Trigger**: Wait for `3d.ready`
6. **Slack**: Notify team

## Configuration

### Rate Limits

The node respects your FOTOhub tier's rate limits. If you hit a limit, n8n will show a 429 error. Use the **Wait** node between FOTOhub operations if processing many items.

### Timeouts

Video and 3D generation can take 30-60 seconds. The node uses a 120-second timeout by default. For very long operations, combine with the FOTOhub Trigger node.

## Pricing

Using FOTOhub through n8n consumes credits from your FOTOhub account at the same rates as direct API calls. See [Billing & Pricing](/api/billing) for credit costs per operation.

## Support

- FOTOhub docs: [docs.fotohub.app](https://docs.fotohub.app)
- n8n docs: [docs.n8n.io](https://docs.n8n.io)
- Issues: [github.com/fotohubapp/n8n-nodes-fotohub](https://github.com/fotohubapp/n8n-nodes-fotohub/issues)
