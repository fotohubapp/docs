# Webhook Integration Guide

Build real-time integrations that react to FOTOhub events.

## Use Cases

- **Progress tracking** — Notify users when async video generation completes
- **Budget alerts** — Get warned before credits run out
- **Audit logging** — Track all API key usage and billing events
- **Automation** — Trigger downstream workflows on generation complete

## Setup

### 1. Create an Endpoint

Your server needs an HTTPS endpoint that accepts POST requests:

```python
from flask import Flask, request, jsonify
import hmac
import hashlib

app = Flask(__name__)
WEBHOOK_SECRET = "your_secret_from_console"

@app.route("/webhooks/fotohub", methods=["POST"])
def handle_fotohub_webhook():
    # Verify signature
    signature = request.headers.get("X-FotoHub-Signature", "")
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        request.data,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected):
        return jsonify({"error": "Invalid signature"}), 401
    
    # Process event
    event = request.json
    event_type = event["event"]
    data = event["data"]
    
    if event_type == "generation.completed":
        handle_generation(data)
    elif event_type == "credits.low":
        send_alert("Credits running low!")
    elif event_type == "credits.depleted":
        send_alert("CRITICAL: Credits depleted!")
    
    return jsonify({"received": True}), 200
```

### 2. Register in Console

Go to [Console → Webhooks](https://fotohub.app/console/webhooks):

1. Click **Create Webhook**
2. Enter your endpoint URL (must be HTTPS)
3. Select events to subscribe to
4. Save the secret displayed

### 3. Test

Click the **Test** button next to your webhook. Check delivery logs for the response.

## Event Payloads

### generation.completed

```json
{
  "event": "generation.completed",
  "timestamp": "2026-07-18T14:30:00Z",
  "data": {
    "type": "image",
    "model": "seedream-5-0-260128",
    "tokens": 16384,
    "cost_pln": 0.20
  }
}
```

### generation.failed

```json
{
  "event": "generation.failed",
  "timestamp": "2026-07-18T14:30:00Z",
  "data": {
    "type": "video",
    "model": "veo-2",
    "error": "Model timeout"
  }
}
```

### credits.low

```json
{
  "event": "credits.low",
  "timestamp": "2026-07-18T14:30:00Z",
  "data": {
    "operation": "generate_image:seedream-5-0-260128",
    "message": "Credits exhausted, falling back to wallet billing."
  }
}
```

### billing.charged

```json
{
  "event": "billing.charged",
  "timestamp": "2026-07-18T14:30:00Z",
  "data": {
    "operation": "generate_image:seedream-5-0-260128",
    "amount_pln": 0.20,
    "method": "wallet"
  }
}
```

## Reliability

- **3 retries** with exponential backoff (1s, 2s, 4s)
- **5-second timeout** per attempt
- **Auto-disable** after 10 consecutive failures
- Check delivery logs in Console to debug issues

## Security Checklist

- [ ] Verify HMAC signature on every request
- [ ] Check `X-FotoHub-Timestamp` to prevent replay attacks
- [ ] Return 200 quickly (process async if needed)
- [ ] Use HTTPS with a valid certificate
- [ ] Don't expose your webhook secret in client code
