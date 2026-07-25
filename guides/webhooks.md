# Webhook Integration Guide

Build real-time integrations that react to FOTOhub events — no polling required.

::: info When to Use Webhooks
Use webhooks instead of polling when you need to react to async events (video completion, credit alerts, billing). Webhooks reduce your API call volume, lower latency, and provide a push-based architecture for production systems.
:::

## Use Cases

- **Progress tracking** — Notify users when async video generation completes
- **Budget alerts** — Get warned before credits run out
- **Audit logging** — Track all API key usage and billing events
- **Automation** — Trigger downstream workflows on generation complete
- **Batch monitoring** — Track progress of large batch jobs

---

## Setup

### 1. Create an Endpoint

Your server needs an HTTPS endpoint that accepts POST requests. Here are production-ready implementations:

::: code-group
```python [Python]
from flask import Flask, request, jsonify
import hmac
import hashlib
import time

app = Flask(__name__)
WEBHOOK_SECRET = "whsec_your_secret_from_console"


def verify_signature(payload: bytes, signature: str, timestamp: str) -> bool:
    """Verify webhook authenticity using HMAC-SHA256."""
    # Check timestamp to prevent replay attacks (5 min window)
    current_time = int(time.time())
    if abs(current_time - int(timestamp)) > 300:
        return False

    # Compute expected signature
    signed_payload = f"{timestamp}.{payload.decode()}"
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        signed_payload.encode(),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(signature, expected)


@app.route("/webhooks/fotohub", methods=["POST"])
def handle_fotohub_webhook():
    # Extract headers
    signature = request.headers.get("X-FotoHub-Signature", "")
    timestamp = request.headers.get("X-FotoHub-Timestamp", "")

    # Verify signature
    if not verify_signature(request.data, signature, timestamp):
        return jsonify({"error": "Invalid signature"}), 401

    # Parse event
    event = request.json
    event_type = event["event"]
    data = event["data"]

    # Route to handler
    if event_type == "generation.completed":
        handle_generation_completed(data)
    elif event_type == "generation.failed":
        handle_generation_failed(data)
    elif event_type == "credits.low":
        send_alert(f"Credits low: {data['message']}")
    elif event_type == "credits.depleted":
        send_alert("CRITICAL: Credits depleted!")
    elif event_type == "billing.charged":
        log_billing(data)

    # Return 200 quickly — process async if needed
    return jsonify({"received": True}), 200


def handle_generation_completed(data):
    """Process completed generation."""
    print(f"Completed: {data['type']} via {data['model']}")
    if data["type"] == "video":
        # Download or store the video URL
        print(f"Video URL: {data.get('video_url')}")
    elif data["type"] == "image":
        print(f"Image URL: {data.get('image_url')}")


def handle_generation_failed(data):
    """Handle failed generation — maybe retry."""
    print(f"Failed: {data['type']} via {data['model']} — {data.get('error')}")


def send_alert(message):
    """Send alert (Slack, email, etc.)."""
    print(f"ALERT: {message}")


def log_billing(data):
    """Log billing event for audit."""
    print(f"Charged: {data['amount_pln']} PLN via {data['method']}")


if __name__ == "__main__":
    app.run(port=3000)
```
```typescript [TypeScript]
import express from "express";
import crypto from "crypto";

const app = express();
const WEBHOOK_SECRET = "whsec_your_secret_from_console";

// Raw body needed for signature verification
app.use("/webhooks/fotohub", express.raw({ type: "application/json" }));

function verifySignature(
  payload: Buffer,
  signature: string,
  timestamp: string
): boolean {
  // Check timestamp (5 min window)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    return false;
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload.toString()}`;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(signedPayload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

app.post("/webhooks/fotohub", (req, res) => {
  const signature = req.headers["x-fotohub-signature"] as string;
  const timestamp = req.headers["x-fotohub-timestamp"] as string;

  if (!verifySignature(req.body, signature, timestamp)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = JSON.parse(req.body.toString());
  const { event: eventType, data } = event;

  switch (eventType) {
    case "generation.completed":
      console.log(`Completed: ${data.type} via ${data.model}`);
      if (data.type === "video") {
        console.log(`Video: ${data.video_url}`);
      }
      break;
    case "generation.failed":
      console.error(`Failed: ${data.error}`);
      break;
    case "credits.low":
      sendAlert(`Credits low: ${data.message}`);
      break;
    case "credits.depleted":
      sendAlert("CRITICAL: Credits depleted!");
      break;
    case "billing.charged":
      console.log(`Charged: ${data.amount_pln} PLN`);
      break;
  }

  // Return 200 immediately
  res.json({ received: true });
});

function sendAlert(message: string) {
  console.log(`ALERT: ${message}`);
  // Send to Slack, PagerDuty, email, etc.
}

app.listen(3000, () => console.log("Webhook server on :3000"));
```
```go [Go]
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "io"
    "math"
    "net/http"
    "strconv"
    "time"
)

const webhookSecret = "whsec_your_secret_from_console"

type WebhookEvent struct {
    Event     string                 `json:"event"`
    Timestamp string                 `json:"timestamp"`
    Data      map[string]interface{} `json:"data"`
}

func verifySignature(payload []byte, signature, timestamp string) bool {
    // Check timestamp (5 min window)
    ts, err := strconv.ParseInt(timestamp, 10, 64)
    if err != nil {
        return false
    }
    if math.Abs(float64(time.Now().Unix()-ts)) > 300 {
        return false
    }

    // Compute HMAC
    signedPayload := fmt.Sprintf("%s.%s", timestamp, string(payload))
    mac := hmac.New(sha256.New, []byte(webhookSecret))
    mac.Write([]byte(signedPayload))
    expected := hex.EncodeToString(mac.Sum(nil))

    return hmac.Equal([]byte(signature), []byte(expected))
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
    body, err := io.ReadAll(r.Body)
    if err != nil {
        http.Error(w, "Bad request", 400)
        return
    }

    signature := r.Header.Get("X-FotoHub-Signature")
    timestamp := r.Header.Get("X-FotoHub-Timestamp")

    if !verifySignature(body, signature, timestamp) {
        http.Error(w, "Invalid signature", 401)
        return
    }

    var event WebhookEvent
    if err := json.Unmarshal(body, &event); err != nil {
        http.Error(w, "Invalid JSON", 400)
        return
    }

    switch event.Event {
    case "generation.completed":
        fmt.Printf("Completed: %v via %v\n", event.Data["type"], event.Data["model"])
    case "generation.failed":
        fmt.Printf("Failed: %v\n", event.Data["error"])
    case "credits.low":
        fmt.Printf("ALERT: Credits low — %v\n", event.Data["message"])
    case "credits.depleted":
        fmt.Println("CRITICAL: Credits depleted!")
    case "billing.charged":
        fmt.Printf("Charged: %v PLN\n", event.Data["amount_pln"])
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(200)
    json.NewEncoder(w).Encode(map[string]bool{"received": true})
}

func main() {
    http.HandleFunc("/webhooks/fotohub", webhookHandler)
    fmt.Println("Webhook server on :3000")
    http.ListenAndServe(":3000", nil)
}
```
```bash [cURL]
# Test your webhook endpoint locally
curl -X POST http://localhost:3000/webhooks/fotohub \
  -H "Content-Type: application/json" \
  -H "X-FotoHub-Signature: test_signature" \
  -H "X-FotoHub-Timestamp: $(date +%s)" \
  -d '{
    "event": "generation.completed",
    "timestamp": "2026-07-22T10:30:00Z",
    "data": {
      "type": "image",
      "model": "seedream-5-0-260128",
      "image_url": "https://storage.fotohub.app/images/test.png"
    }
  }'
```
:::

### 2. Register in Console

Go to [Console → Webhooks](https://fotohub.app/console/webhooks):

1. Click **Create Webhook**
2. Enter your endpoint URL (must be HTTPS in production)
3. Select events to subscribe to
4. Save the signing secret displayed (starts with `whsec_`)

### 3. Test

Click the **Test** button next to your webhook. Check delivery logs for the response.

---

## Event Payloads

### generation.completed

```json
{
  "event": "generation.completed",
  "timestamp": "2026-07-22T10:30:00Z",
  "data": {
    "job_id": "job_abc123",
    "type": "image",
    "model": "seedream-5-0-260128",
    "image_url": "https://storage.fotohub.app/images/abc123.png",
    "tokens": 16384,
    "cost_pln": 0.20,
    "duration_ms": 3200
  }
}
```

### generation.failed

```json
{
  "event": "generation.failed",
  "timestamp": "2026-07-22T10:30:00Z",
  "data": {
    "job_id": "job_def456",
    "type": "video",
    "model": "veo-3",
    "error": "Model timeout after 300s",
    "error_code": "timeout"
  }
}
```

### credits.low

```json
{
  "event": "credits.low",
  "timestamp": "2026-07-22T10:30:00Z",
  "data": {
    "credits_remaining": 5,
    "credits_total": 100,
    "operation": "generate_image:seedream-5-0-260128",
    "message": "Credits low (5 remaining). Falling back to wallet billing."
  }
}
```

### credits.depleted

```json
{
  "event": "credits.depleted",
  "timestamp": "2026-07-22T10:30:00Z",
  "data": {
    "wallet_balance_pln": 12.50,
    "message": "All credits consumed. Future operations charged to wallet."
  }
}
```

### billing.charged

```json
{
  "event": "billing.charged",
  "timestamp": "2026-07-22T10:30:00Z",
  "data": {
    "operation": "generate_video:seedance",
    "amount_pln": 1.50,
    "method": "wallet",
    "wallet_balance_pln": 48.50
  }
}
```

### budget.threshold_reached

```json
{
  "event": "budget.threshold_reached",
  "timestamp": "2026-07-22T10:30:00Z",
  "data": {
    "threshold_pln": 100,
    "current_spend_pln": 102.30,
    "period": "2026-07"
  }
}
```

---

## Signature Verification

Every webhook request includes two headers for verification:

| Header | Description |
|--------|-------------|
| `X-FotoHub-Signature` | HMAC-SHA256 hex digest |
| `X-FotoHub-Timestamp` | Unix timestamp of send time |

The signature is computed over: `{timestamp}.{raw_body}`

**Always verify signatures** — without verification, anyone could send fake events to your endpoint.

---

## Local Development with ngrok

Use ngrok to test webhooks locally during development:

```bash
# Install ngrok
# macOS: brew install ngrok
# Linux: snap install ngrok

# Start your webhook server
python app.py  # or npm start, go run main.go

# In another terminal, create tunnel
ngrok http 3000
# Output: https://abc123.ngrok-free.app -> http://localhost:3000

# Register the ngrok URL in FOTOhub console:
# https://abc123.ngrok-free.app/webhooks/fotohub
```

::: warning
ngrok URLs change on restart (free tier). For persistent development URLs, use `ngrok http 3000 --domain=your-domain.ngrok-free.app` (requires free ngrok account).
:::

---

## Production Best Practices

### 1. Return 200 Immediately

Process events asynchronously. If your handler takes >5 seconds, FOTOhub times out and retries.

```python
from flask import Flask, request, jsonify
import threading

@app.route("/webhooks/fotohub", methods=["POST"])
def webhook():
    # Verify signature first
    event = request.json

    # Queue for async processing
    threading.Thread(target=process_event, args=(event,)).start()

    # Return immediately
    return jsonify({"received": True}), 200


def process_event(event):
    """Heavy processing happens here, outside the request."""
    # Download video, update database, send notifications, etc.
    pass
```

### 2. Implement Idempotency

Webhooks may be delivered more than once. Use the `job_id` or event ID to deduplicate:

```python
import redis

r = redis.Redis()

def process_webhook(event):
    event_id = f"{event['event']}:{event['data'].get('job_id', event['timestamp'])}"

    # Check if already processed
    if r.setnx(f"webhook:processed:{event_id}", "1"):
        r.expire(f"webhook:processed:{event_id}", 86400)  # 24h TTL
        # Process the event
        handle_event(event)
    else:
        # Already processed — skip
        pass
```

### 3. Handle Retries Gracefully

FOTOhub retries failed deliveries:

| Attempt | Delay | Total elapsed |
|---------|-------|---------------|
| 1 | Immediate | 0s |
| 2 | 1s | 1s |
| 3 | 2s | 3s |
| 4 (final) | 4s | 7s |

After 4 failed attempts, the event is logged as undelivered. Check the console for failed deliveries.

### 4. Monitor Webhook Health

Auto-disable triggers after 10 consecutive failures. To prevent this:

- Monitor your endpoint uptime
- Set up health checks for your webhook server
- Use a message queue (Redis, SQS) as a buffer between webhook receipt and processing

---

## Reliability

- **4 retries** with exponential backoff (0s, 1s, 2s, 4s)
- **5-second timeout** per attempt
- **Auto-disable** after 10 consecutive failures
- **Delivery logs** available in Console for 30 days
- Events are generated for up to 24 hours before being discarded

---

## Security Checklist

- [ ] Verify HMAC signature on every request
- [ ] Check `X-FotoHub-Timestamp` to prevent replay attacks (5-minute window)
- [ ] Return 200 quickly (process async if needed)
- [ ] Use HTTPS with a valid certificate (required in production)
- [ ] Don't expose your webhook secret in client code
- [ ] Implement idempotency to handle duplicate deliveries
- [ ] Use a dedicated URL path (not your root `/`)
- [ ] Rate-limit your webhook endpoint to prevent abuse
- [ ] Log all webhook events for debugging

---

## Subscribing to Events Programmatically

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub()

# Create webhook subscription
webhook = client.create_webhook(
    url="https://your-app.com/webhooks/fotohub",
    events=["generation.completed", "generation.failed", "credits.low"],
)
print(f"Webhook ID: {webhook.id}")
print(f"Secret: {webhook.secret}")  # Store this securely

# List webhooks
webhooks = client.list_webhooks()
for wh in webhooks:
    print(f"  {wh.id}: {wh.url} ({', '.join(wh.events)})")

# Delete webhook
client.delete_webhook(webhook.id)
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

// Create webhook
const webhook = await client.createWebhook({
  url: "https://your-app.com/webhooks/fotohub",
  events: ["generation.completed", "generation.failed", "credits.low"],
});
console.log(`ID: ${webhook.id}, Secret: ${webhook.secret}`);

// List
const webhooks = await client.listWebhooks();
webhooks.forEach((wh) => console.log(`  ${wh.id}: ${wh.url}`));

// Delete
await client.deleteWebhook(webhook.id);
```
```go [Go]
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
)

func main() {
    // Create webhook
    payload, _ := json.Marshal(map[string]interface{}{
        "url":    "https://your-app.com/webhooks/fotohub",
        "events": []string{"generation.completed", "generation.failed", "credits.low"},
    })

    req, _ := http.NewRequest("POST",
        "https://apis.fotohub.app/v1/webhooks",
        bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    req.Header.Set("Content-Type", "application/json")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()

    var result struct {
        ID     string `json:"id"`
        Secret string `json:"secret"`
    }
    json.NewDecoder(resp.Body).Decode(&result)
    fmt.Printf("Webhook ID: %s\nSecret: %s\n", result.ID, result.Secret)
}
```
```bash [cURL]
# Create webhook
curl -X POST https://apis.fotohub.app/v1/webhooks \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/fotohub",
    "events": ["generation.completed", "generation.failed", "credits.low"]
  }'

# List webhooks
curl -s https://apis.fotohub.app/v1/webhooks \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" | jq .

# Delete webhook
curl -X DELETE https://apis.fotohub.app/v1/webhooks/wh_abc123 \
  -H "Authorization: Bearer $FOTOHUB_API_KEY"
```
:::

---

## Related

- [Video Generation Guide](/guides/video-generation) — Async jobs that emit webhooks
- [Batch Processing Guide](/guides/batch-processing) — Webhook-based progress tracking
- [Error Handling Guide](/guides/error-handling) — Handle webhook delivery failures
- [Cost Optimization](/guides/cost-optimization) — Budget alerts via webhooks
