# Zapier & Make Integration

::: warning Coming Soon
The official FOTOhub Zapier integration is in development. In the meantime, use the **Webhooks by Zapier** action to connect directly to the FOTOhub API.
:::

## Using FOTOhub API with Zapier (Today)

You can use FOTOhub with Zapier right now via the **Webhooks by Zapier** action.

### Generate Image on Trigger

1. Create a new Zap with your trigger (e.g., new Shopify product, new Airtable row)
2. Add action: **Webhooks by Zapier → Custom Request**
3. Configure:

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `https://apis.fotohub.app/v1/ai/generate/image` |
| Headers | `Authorization: Bearer fh_live_your_key`<br>`Content-Type: application/json` |
| Body | `{"prompt": "{{trigger_field}}", "model": "seedream-5-0-260128"}` |

4. The response contains `images[0]` with the generated URL

### Remove Background Automation

Trigger: New image uploaded to Google Drive

```json
{
  "image_url": "{{google_drive_url}}",
  "output_format": "png"
}
```

POST to: `https://apis.fotohub.app/v1/ai/remove-background`

### Video Generation + Webhook

For async operations (video generation), use webhooks:

1. **Step 1:** POST to `/v1/ai/generate/video` → get `job_id`
2. **Step 2:** Set up a webhook URL in your Zap
3. **Step 3:** Register the webhook: POST to `/v1/webhooks` with the Zap webhook URL
4. When the video completes, FOTOhub sends the result to your Zap

## Using with Make (Integromat)

Same approach using Make's **HTTP** module:

1. Add **HTTP → Make a request** module
2. URL: `https://apis.fotohub.app/v1/ai/generate/image`
3. Method: POST
4. Headers: `Authorization: Bearer fh_live_...`
5. Body: JSON with your prompt

## Planned Official Integration

The upcoming official Zapier app will include:

**Triggers:**
- Image generation completed
- Video generation completed
- Batch job completed
- Credit balance low

**Actions:**
- Generate image
- Generate video
- Remove background
- Upscale image
- Chat completion
- Generate speech

**Searches:**
- Get generation status
- Get billing balance
- List models

## n8n Integration

For self-hosted automation, use n8n's HTTP Request node:

```json
{
  "method": "POST",
  "url": "https://apis.fotohub.app/v1/ai/generate/image",
  "headers": {
    "Authorization": "Bearer fh_live_your_key",
    "Content-Type": "application/json"
  },
  "body": {
    "prompt": "={{ $json.description }}",
    "model": "seedream-5-0-260128"
  }
}
```

## Links

- [API Authentication](/api/authentication)
- [Image Generation API](/api/image-generation)
- [Webhooks](/api/webhooks)
- [API Reference](/api/getting-started)
