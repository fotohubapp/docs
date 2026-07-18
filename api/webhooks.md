# Webhooks

Receive real-time HTTP notifications when async operations complete -- video generation, music generation, batch processing, and more. Instead of polling for job status, register a URL and receive notifications the moment a result is ready.

::: info Availability
Webhooks are available on **Startup** tier and above. Free and Developer plans can poll job status via the `/v1/jobs/:id` endpoint instead.
:::

## Use Cases

- **Async generation pipelines** -- Get notified when video or music generation completes, then download and process the result automatically.
- **Credit monitoring** -- Receive alerts when credits run low so you can top up before operations fail.
- **Security auditing** -- Track API key usage from new IP addresses.
- **Billing integration** -- Sync charge events with your own billing or accounting system.
- **Batch orchestration** -- Trigger downstream workflows when batch operations finish.

## Available Events

Subscribe to specific event types to receive only the notifications relevant to your integration.

| Event | Description |
|-------|-------------|
| `generation.completed` | Image, video, or music generation finished successfully. Includes output URL and billing info. |
| `generation.failed` | Generation failed with an error. Includes error reason and partial billing info. |
| `credits.low` | Credits dropped below 10% of monthly allowance. Sent once per billing cycle. |
| `credits.depleted` | Both credits and wallet are empty. Operations will fail until topped up. |
| `key.used` | API key used from a new IP address (security monitoring). |
| `billing.charged` | Wallet charged for an operation. Includes amount and operation details. |

## Event Payload Examples

All webhook deliveries use a consistent envelope format. The `data` field contains event-specific information.

### generation.completed

```json
{
  "id": "evt_abc123",
  "type": "generation.completed",
  "created_at": "2026-07-17T12:00:00Z",
  "data": {
    "job_id": "vj_xyz",
    "generation_type": "video",
    "model": "veo-2",
    "output_url": "https://s3point.fotohub.app/generations/vj_xyz.mp4",
    "duration": 5,
    "billing": {
      "method": "credits",
      "credits_used": 10,
      "pln_charged": 3.75
    }
  }
}
```

### generation.failed

```json
{
  "id": "evt_def456",
  "type": "generation.failed",
  "created_at": "2026-07-17T12:01:00Z",
  "data": {
    "job_id": "vj_failed1",
    "generation_type": "video",
    "model": "veo-2",
    "error": "content_policy_violation",
    "error_message": "The prompt was rejected by the safety filter.",
    "billing": {
      "method": "credits",
      "credits_used": 0,
      "pln_charged": 0
    }
  }
}
```

### credits.low

```json
{
  "id": "evt_ghi789",
  "type": "credits.low",
  "created_at": "2026-07-17T14:00:00Z",
  "data": {
    "credits_remaining": 42,
    "credits_total": 500,
    "percent_remaining": 8.4,
    "billing_cycle_ends": "2026-08-01T00:00:00Z"
  }
}
```

### credits.depleted

```json
{
  "id": "evt_jkl012",
  "type": "credits.depleted",
  "created_at": "2026-07-17T16:30:00Z",
  "data": {
    "credits_remaining": 0,
    "wallet_balance_pln": 0,
    "billing_cycle_ends": "2026-08-01T00:00:00Z",
    "message": "All credits and wallet funds exhausted. Top up to continue."
  }
}
```

### key.used

```json
{
  "id": "evt_mno345",
  "type": "key.used",
  "created_at": "2026-07-17T09:15:00Z",
  "data": {
    "key_id": "key_abc",
    "key_name": "Production Key",
    "ip_address": "203.0.113.42",
    "country": "PL",
    "first_seen": true
  }
}
```

### billing.charged

```json
{
  "id": "evt_pqr678",
  "type": "billing.charged",
  "created_at": "2026-07-17T10:45:00Z",
  "data": {
    "operation": "video_generation",
    "model": "kling-2.0",
    "amount_pln": 5.50,
    "wallet_balance_after": 94.50,
    "job_id": "vj_charged1"
  }
}
```

::: tip Idempotency
Each event has a unique `id` field. Store processed event IDs to handle potential duplicate deliveries gracefully.
:::

## Security: Signature Verification

Every webhook delivery includes an `X-FotoHub-Signature` header containing an HMAC-SHA256 signature. Always verify this signature to ensure the payload originated from FOTOhub and was not tampered with.

### Headers Included

| Header | Description |
|--------|-------------|
| `X-FotoHub-Signature` | HMAC-SHA256 hex digest of the raw request body, prefixed with `sha256=` |
| `X-FotoHub-Timestamp` | ISO 8601 timestamp of the delivery attempt |
| `X-FotoHub-Event` | The event type (e.g., `generation.completed`) |
| `X-FotoHub-Delivery-Id` | Unique ID for this delivery attempt |

### Python Verification

```python
import hmac
import hashlib

def verify_signature(payload_bytes: bytes, signature: str, secret: str) -> bool:
    """Verify the webhook signature from X-FotoHub-Signature header."""
    expected = hmac.new(
        secret.encode(),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

### TypeScript Verification

```typescript
import crypto from "crypto";

function verifySignature(
  payloadBody: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payloadBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expected}`),
    Buffer.from(signature)
  );
}
```

::: warning Security
Never skip signature verification in production. Without it, any third party can send fake events to your webhook endpoint.
:::

## Delivery: Retries and Reliability

If your endpoint returns a non-2xx status code or does not respond within **5 seconds**, FOTOhub will retry delivery with exponential backoff.

### Retry Schedule

| Attempt | Delay | Notes |
|---------|-------|-------|
| 1st retry | 1 second | Immediate retry for transient failures |
| 2nd retry | 5 seconds | Short backoff |
| 3rd retry | 30 seconds | Final attempt |

### Auto-Disable Policy

After **10 consecutive failed delivery attempts** across any events, the webhook is automatically disabled. When this happens:

1. You receive an email notification about the disabled webhook.
2. The webhook status changes to `inactive` in the API and console.
3. Events that would have been delivered are dropped (not queued).
4. You can re-enable the webhook in the console after fixing your endpoint.

### Best Practices for Reliability

- **Respond quickly** -- Return a 200 status within 5 seconds. Process the event asynchronously after acknowledging receipt.
- **Use a queue** -- For heavy processing, push events to a message queue (Redis, SQS, RabbitMQ) and process them separately.
- **Handle duplicates** -- Store processed event IDs to deduplicate. The same event may be delivered more than once during retries.
- **HTTPS only** -- Webhook URLs must use HTTPS. Plain HTTP is rejected.
- **No private IPs** -- URLs cannot point to localhost, 10.x, 172.16-31.x, or 192.168.x ranges.

## Webhook Management API

All management endpoints require authentication with your API key.

### Create Webhook

```
POST /v1/console/webhooks
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | HTTPS endpoint URL that will receive events. Must be publicly accessible. |
| `events` | string[] | Yes | Array of event types to subscribe to. Use `["*"]` for all events. |
| `secret` | string | No | Custom signing secret. If omitted, one is generated and returned. |

```bash
curl -X POST https://apis.fotohub.app/v1/console/webhooks \
  -H "Authorization: Bearer fh_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhook",
    "events": ["generation.completed", "generation.failed", "credits.low"]
  }'
```

**Response (201 Created):**

```json
{
  "id": "wh_abc123",
  "url": "https://your-server.com/webhook",
  "events": ["generation.completed", "generation.failed", "credits.low"],
  "secret": "whsec_7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c",
  "active": true,
  "created_at": "2026-07-17T12:00:00Z"
}
```

::: warning Save the Secret
The `secret` is shown **only once** at creation. Store it securely -- you need it to verify webhook signatures.
:::

### List Webhooks

```
GET /v1/console/webhooks
```

Returns all registered webhooks for your account.

### Update Webhook

```
PATCH /v1/console/webhooks/{id}
```

Update the URL, events, or active status of an existing webhook.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | No | New endpoint URL |
| `events` | string[] | No | Updated event subscriptions |
| `active` | boolean | No | Enable or disable the webhook |

### Delete Webhook

```
DELETE /v1/console/webhooks/{id}
```

Permanently removes the webhook. Pending deliveries are cancelled.

### Test Webhook

```
POST /v1/console/webhooks/{id}/test
```

Sends a test event to your endpoint so you can verify connectivity and signature verification without triggering a real event.

### View Delivery Logs

```
GET /v1/console/webhooks/{id}/logs
```

Returns recent delivery attempts with status codes, response times, and any error messages. Useful for debugging failed deliveries.

## Webhook Handler Examples

Complete webhook handler implementations for common frameworks. These include signature verification, event routing, and proper response handling.

### Express.js (TypeScript)

```typescript
import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.raw({ type: "application/json" }));

const WEBHOOK_SECRET = process.env.FOTOHUB_WEBHOOK_SECRET!;

app.post("/webhook/fotohub", (req, res) => {
  // 1. Verify signature
  const signature = req.headers["x-fotohub-signature"] as string;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(req.body)
    .digest("hex");

  if (!crypto.timingSafeEqual(
    Buffer.from(`sha256=${expected}`),
    Buffer.from(signature)
  )) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // 2. Parse event
  const event = JSON.parse(req.body.toString());

  // 3. Route by event type
  switch (event.type) {
    case "generation.completed":
      handleGenerationCompleted(event.data);
      break;
    case "generation.failed":
      handleGenerationFailed(event.data);
      break;
    case "credits.low":
      notifyAdmins(event.data);
      break;
    case "billing.charged":
      syncBillingRecord(event.data);
      break;
  }

  // 4. Acknowledge receipt quickly
  res.status(200).json({ received: true });
});

app.listen(3000);
```

### Flask (Python)

```python
from flask import Flask, request, jsonify
import hmac
import hashlib
import os

app = Flask(__name__)
WEBHOOK_SECRET = os.environ["FOTOHUB_WEBHOOK_SECRET"]

def verify_signature(payload: bytes, signature: str) -> bool:
    expected = hmac.new(
        WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)

@app.route("/webhook/fotohub", methods=["POST"])
def handle_webhook():
    # 1. Verify signature
    signature = request.headers.get("X-FotoHub-Signature", "")
    if not verify_signature(request.data, signature):
        return jsonify({"error": "Invalid signature"}), 401

    # 2. Parse event
    event = request.json

    # 3. Route by event type
    handlers = {
        "generation.completed": handle_generation_completed,
        "generation.failed": handle_generation_failed,
        "credits.low": notify_admins,
        "credits.depleted": handle_credits_depleted,
        "billing.charged": sync_billing_record,
    }

    handler = handlers.get(event["type"])
    if handler:
        handler(event["data"])

    # 4. Acknowledge receipt quickly
    return jsonify({"received": True}), 200

if __name__ == "__main__":
    app.run(port=3000)
```

## Debugging Tips

### Common Issues

| Problem | Solution |
|---------|----------|
| Signature mismatch | Ensure you verify against the raw request body bytes, not a parsed/re-serialized JSON string. |
| Timeout errors | Return 200 immediately and process asynchronously. Do not perform heavy work before responding. |
| Webhook disabled | Check delivery logs for the error pattern. Fix your endpoint, then re-enable in the console. |
| Missing events | Verify the webhook subscribes to the correct event types. Check the `events` array. |
| Duplicate events | Implement idempotency by tracking the `id` field of each processed event. |

### Delivery Logs

View delivery history in the console at **fotohub.app/console** -> **Settings** -> **Webhooks** -> select webhook -> **Logs**, or via the API:

```bash
curl https://apis.fotohub.app/v1/console/webhooks/wh_abc123/logs \
  -H "Authorization: Bearer fh_live_your_api_key_here"
```

Each log entry includes:

- **Timestamp** -- When the delivery was attempted
- **Event type** -- Which event was sent
- **HTTP status** -- Response code from your endpoint (or `timeout`)
- **Response time** -- How long your endpoint took to respond
- **Attempt number** -- Which retry attempt (1-4)

### Testing Locally

Use a tunneling service like ngrok to expose your local development server:

```bash
# Start your local webhook handler
python app.py  # or: npx ts-node server.ts

# In another terminal, create a tunnel
ngrok http 3000

# Register the ngrok URL as your webhook endpoint
curl -X POST https://apis.fotohub.app/v1/console/webhooks \
  -H "Authorization: Bearer fh_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://abc123.ngrok.io/webhook/fotohub",
    "events": ["*"]
  }'

# Send a test event
curl -X POST https://apis.fotohub.app/v1/console/webhooks/wh_abc123/test \
  -H "Authorization: Bearer fh_live_your_api_key_here"
```

## Limits

| Constraint | Value |
|------------|-------|
| Maximum webhooks per account | 10 |
| Request timeout | 5 seconds |
| Maximum retries | 3 (4 total attempts) |
| Auto-disable threshold | 10 consecutive failures |
| Minimum plan | Startup |
| URL scheme | HTTPS only |
| Payload size | Up to 64 KB |
