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
| `video.ready` | Video post-processing complete and file is available for download. |
| `music.ready` | Music/audio generation finished and file is available for download. |
| `credits.low` | Credits dropped below 10% of monthly allowance. Sent once per billing cycle. |
| `credits.depleted` | Both credits and wallet are empty. Operations will fail until topped up. |
| `billing.low_credits` | Wallet balance dropped below 20 PLN threshold. |
| `billing.charged` | Wallet charged for an operation. Includes amount and operation details. |
| `key.used` | API key used from a new IP address (security monitoring). |

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
    "model": "veo-2.0-generate-001",
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
    "model": "veo-2.0-generate-001",
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

### video.ready

```json
{
  "id": "evt_vid789",
  "type": "video.ready",
  "created_at": "2026-07-17T12:05:00Z",
  "data": {
    "job_id": "vj_render1",
    "model": "kling-v3",
    "output_url": "https://s3point.fotohub.app/generations/vj_render1.mp4",
    "duration_seconds": 10,
    "resolution": "1080p",
    "file_size_bytes": 15728640
  }
}
```

### music.ready

```json
{
  "id": "evt_mus012",
  "type": "music.ready",
  "created_at": "2026-07-17T12:10:00Z",
  "data": {
    "job_id": "mj_track1",
    "model": "music-minimax",
    "output_url": "https://s3point.fotohub.app/generations/mj_track1.mp3",
    "duration_seconds": 30,
    "sample_rate": 44100,
    "file_size_bytes": 524288
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

### billing.low_credits

```json
{
  "id": "evt_blc456",
  "type": "billing.low_credits",
  "created_at": "2026-07-17T15:00:00Z",
  "data": {
    "wallet_balance_pln": 18.50,
    "threshold_pln": 20,
    "top_up_url": "https://fotohub.app/console/billing"
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
    "model": "kling-v3",
    "amount_pln": 5.50,
    "wallet_balance_after": 94.50,
    "job_id": "vj_charged1"
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

### Signature Verification

::: code-group

```python [Python]
import hmac
import hashlib

def verify_signature(payload_bytes: bytes, signature: str, secret: str) -> bool:
    """Verify the webhook signature from X-FotoHub-Signature header."""
    expected = hmac.new(
        secret.encode("utf-8"),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


# Usage with Flask
from flask import Flask, request, abort

app = Flask(__name__)
WEBHOOK_SECRET = "your_webhook_secret_here"

@app.route("/webhook/fotohub", methods=["POST"])
def handle_webhook():
    signature = request.headers.get("X-FotoHub-Signature", "")
    if not verify_signature(request.data, signature, WEBHOOK_SECRET):
        abort(401)
    event = request.json
    # Process event...
    return "", 200
```

```typescript [TypeScript]
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

// Usage with Express
import express from "express";

const app = express();
app.use(express.raw({ type: "application/json" }));

const WEBHOOK_SECRET = process.env.FOTOHUB_WEBHOOK_SECRET!;

app.post("/webhook/fotohub", (req, res) => {
  const signature = req.headers["x-fotohub-signature"] as string;
  if (!verifySignature(req.body.toString(), signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "Invalid signature" });
  }
  const event = JSON.parse(req.body.toString());
  // Process event...
  res.status(200).json({ received: true });
});
```

```go [Go]
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

func verifySignature(payload []byte, signature string, secret string) bool {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	// Read the raw body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Verify signature
	signature := r.Header.Get("X-FotoHub-Signature")
	secret := os.Getenv("FOTOHUB_WEBHOOK_SECRET")
	if !verifySignature(body, signature, secret) {
		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	// Process event (parse JSON, route by type, etc.)
	fmt.Fprintf(w, `{"received": true}`)
}

func main() {
	http.HandleFunc("/webhook/fotohub", webhookHandler)
	http.ListenAndServe(":3000", nil)
}
```

```bash [cURL]
# Verify a webhook signature manually (for debugging)
# Given: payload.json contains the raw webhook body
# Given: WEBHOOK_SECRET is your secret

WEBHOOK_SECRET="your_webhook_secret_here"
RECEIVED_SIGNATURE="sha256=abc123..."

# Compute expected signature
EXPECTED=$(cat payload.json | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print $2}')
EXPECTED_FULL="sha256=$EXPECTED"

# Compare
if [ "$EXPECTED_FULL" = "$RECEIVED_SIGNATURE" ]; then
  echo "Signature valid"
else
  echo "Signature INVALID - do not trust this payload"
fi

# Send a test webhook to verify your endpoint
curl -X POST https://apis.fotohub.app/v1/console/webhooks/wh_abc123/test \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json"
```

:::

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
| 3rd retry | 30 seconds | Medium backoff |
| 4th retry | 120 seconds | Final attempt |

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

All management endpoints require authentication via API key or JWT session token.

### Endpoint Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/console/webhooks` | Create a new webhook |
| `GET` | `/v1/console/webhooks` | List all webhooks |
| `PATCH` | `/v1/console/webhooks/{id}` | Update a webhook |
| `DELETE` | `/v1/console/webhooks/{id}` | Delete a webhook |
| `POST` | `/v1/console/webhooks/{id}/test` | Send a test event |
| `GET` | `/v1/console/webhooks/{id}/logs` | View delivery logs |

---

### Create Webhook

```
POST /v1/console/webhooks
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | **Yes** | Display name for the webhook (1-100 chars). |
| `url` | string | **Yes** | HTTPS endpoint URL. Must be publicly accessible (no private IPs). |
| `events` | string[] | **Yes** | Array of event types to subscribe to. |
| `headers` | object | No | Custom headers to include with each delivery (max 10). |

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

webhook = client.webhooks.create(
    name="Production Notifications",
    url="https://your-server.com/webhook",
    events=["generation.completed", "generation.failed", "credits.low"],
    headers={"X-Custom-Source": "fotohub"}
)

print(f"Webhook ID: {webhook.id}")
print(f"Secret (save this!): {webhook.secret}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const webhook = await client.webhooks.create({
  name: "Production Notifications",
  url: "https://your-server.com/webhook",
  events: ["generation.completed", "generation.failed", "credits.low"],
  headers: { "X-Custom-Source": "fotohub" },
});

console.log(`Webhook ID: ${webhook.id}`);
console.log(`Secret (save this!): ${webhook.secret}`);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"name":   "Production Notifications",
		"url":    "https://your-server.com/webhook",
		"events": []string{"generation.completed", "generation.failed", "credits.low"},
		"headers": map[string]string{
			"X-Custom-Source": "fotohub",
		},
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/console/webhooks", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	fmt.Printf("Webhook ID: %s\n", result["id"])
	fmt.Printf("Secret (save this!): %s\n", result["secret"])
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/console/webhooks \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Notifications",
    "url": "https://your-server.com/webhook",
    "events": ["generation.completed", "generation.failed", "credits.low"],
    "headers": {"X-Custom-Source": "fotohub"}
  }'
```

:::

**Response (201 Created):**

```json
{
  "id": "wh_abc123",
  "name": "Production Notifications",
  "url": "https://your-server.com/webhook",
  "events": ["generation.completed", "generation.failed", "credits.low"],
  "secret": "7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c...",
  "active": true,
  "headers": {"X-Custom-Source": "fotohub"},
  "created_at": "2026-07-17T12:00:00Z",
  "updated_at": "2026-07-17T12:00:00Z"
}
```

::: warning Save the Secret
The `secret` is auto-generated and shown **only once** at creation. You cannot supply a custom secret. Store it securely for signature verification.
:::

---

### List Webhooks

```
GET /v1/console/webhooks
```

Returns all registered webhooks for your account (max 10 per user).

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

webhooks = client.webhooks.list()
for wh in webhooks:
    status = "active" if wh.active else "inactive"
    print(f"[{status}] {wh.name} -> {wh.url}")
    print(f"  Events: {', '.join(wh.events)}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const webhooks = await client.webhooks.list();
for (const wh of webhooks) {
  const status = wh.active ? "active" : "inactive";
  console.log(`[${status}] ${wh.name} -> ${wh.url}`);
  console.log(`  Events: ${wh.events.join(", ")}`);
}
```

```go [Go]
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Webhook struct {
	ID     string   `json:"id"`
	Name   string   `json:"name"`
	URL    string   `json:"url"`
	Events []string `json:"events"`
	Active bool     `json:"active"`
}

func main() {
	req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/console/webhooks", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var webhooks []Webhook
	json.NewDecoder(resp.Body).Decode(&webhooks)

	for _, wh := range webhooks {
		status := "inactive"
		if wh.Active {
			status = "active"
		}
		fmt.Printf("[%s] %s -> %s\n", status, wh.Name, wh.URL)
	}
}
```

```bash [cURL]
curl https://apis.fotohub.app/v1/console/webhooks \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

**Response (200 OK):**

```json
[
  {
    "id": "wh_abc123",
    "name": "Production Notifications",
    "url": "https://your-server.com/webhook",
    "events": ["generation.completed", "generation.failed", "credits.low"],
    "active": true,
    "created_at": "2026-07-17T12:00:00Z",
    "updated_at": "2026-07-17T12:00:00Z"
  }
]
```

---

### Update Webhook

```
PATCH /v1/console/webhooks/{id}
```

Update name, URL, events, active status, or custom headers of an existing webhook.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | No | Updated display name |
| `url` | string | No | New endpoint URL (HTTPS only) |
| `events` | string[] | No | Updated event subscriptions |
| `active` | boolean | No | Enable or disable the webhook |
| `headers` | object | No | Updated custom headers |

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Add video.ready and music.ready events
updated = client.webhooks.update(
    "wh_abc123",
    events=[
        "generation.completed",
        "generation.failed",
        "video.ready",
        "music.ready",
        "credits.low",
    ],
    active=True
)
print(f"Updated: {updated.name}, events: {updated.events}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const updated = await client.webhooks.update("wh_abc123", {
  events: [
    "generation.completed",
    "generation.failed",
    "video.ready",
    "music.ready",
    "credits.low",
  ],
  active: true,
});
console.log(`Updated: ${updated.name}, events: ${updated.events.join(", ")}`);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"events": []string{
			"generation.completed",
			"generation.failed",
			"video.ready",
			"music.ready",
			"credits.low",
		},
		"active": true,
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("PATCH",
		"https://apis.fotohub.app/v1/console/webhooks/wh_abc123",
		bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	fmt.Printf("Updated: %s\n", result["name"])
}
```

```bash [cURL]
curl -X PATCH https://apis.fotohub.app/v1/console/webhooks/wh_abc123 \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "events": ["generation.completed", "generation.failed", "video.ready", "music.ready", "credits.low"],
    "active": true
  }'
```

:::

---

### Delete Webhook

```
DELETE /v1/console/webhooks/{id}
```

Permanently removes the webhook. Returns 204 No Content.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

client.webhooks.delete("wh_abc123")
print("Webhook deleted")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

await client.webhooks.delete("wh_abc123");
console.log("Webhook deleted");
```

```go [Go]
package main

import (
	"fmt"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("DELETE",
		"https://apis.fotohub.app/v1/console/webhooks/wh_abc123", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 204 {
		fmt.Println("Webhook deleted")
	}
}
```

```bash [cURL]
curl -X DELETE https://apis.fotohub.app/v1/console/webhooks/wh_abc123 \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

---

### Test Webhook

```
POST /v1/console/webhooks/{id}/test
```

Sends a test event to your endpoint. The webhook must be active. Fires a `test` event type so you can verify connectivity and signature verification without triggering real events.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.webhooks.test("wh_abc123")
print(f"Test delivery status: {result.status_code}")
print(f"Response time: {result.response_time_ms}ms")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.webhooks.test("wh_abc123");
console.log(`Test delivery status: ${result.statusCode}`);
console.log(`Response time: ${result.responseTimeMs}ms`);
```

```go [Go]
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("POST",
		"https://apis.fotohub.app/v1/console/webhooks/wh_abc123/test", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	fmt.Printf("Test delivery status: %v\n", result["status_code"])
	fmt.Printf("Response time: %vms\n", result["response_time_ms"])
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/console/webhooks/wh_abc123/test \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

**Test event payload your endpoint receives:**

```json
{
  "id": "evt_test_xyz",
  "type": "test",
  "created_at": "2026-07-17T12:00:00Z",
  "data": {
    "message": "This is a test webhook delivery from FOTOhub.",
    "webhook_id": "wh_abc123"
  }
}
```

---

### View Delivery Logs

```
GET /v1/console/webhooks/{id}/logs
```

Returns the last 50 delivery attempts with status codes, response body preview, success flag, and timestamps. Useful for debugging failed deliveries.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | No | Number of log entries to return (1-50, default 50) |
| `event_type` | string | No | Filter logs by event type |
| `success` | boolean | No | Filter by delivery success/failure |

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

logs = client.webhooks.logs("wh_abc123", limit=10)
for log in logs:
    status = "OK" if log.success else "FAILED"
    print(f"[{status}] {log.event_type} -> HTTP {log.status_code} ({log.response_time_ms}ms)")
    if not log.success:
        print(f"  Error: {log.response_body[:100]}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const logs = await client.webhooks.logs("wh_abc123", { limit: 10 });
for (const log of logs) {
  const status = log.success ? "OK" : "FAILED";
  console.log(`[${status}] ${log.eventType} -> HTTP ${log.statusCode} (${log.responseTimeMs}ms)`);
  if (!log.success) {
    console.log(`  Error: ${log.responseBody.slice(0, 100)}`);
  }
}
```

```go [Go]
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type DeliveryLog struct {
	EventType      string `json:"event_type"`
	StatusCode     int    `json:"status_code"`
	Success        bool   `json:"success"`
	ResponseTimeMs int    `json:"response_time_ms"`
	ResponseBody   string `json:"response_body"`
	CreatedAt      string `json:"created_at"`
}

func main() {
	req, _ := http.NewRequest("GET",
		"https://apis.fotohub.app/v1/console/webhooks/wh_abc123/logs?limit=10", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var logs []DeliveryLog
	json.NewDecoder(resp.Body).Decode(&logs)

	for _, log := range logs {
		status := "OK"
		if !log.Success {
			status = "FAILED"
		}
		fmt.Printf("[%s] %s -> HTTP %d (%dms)\n",
			status, log.EventType, log.StatusCode, log.ResponseTimeMs)
	}
}
```

```bash [cURL]
curl "https://apis.fotohub.app/v1/console/webhooks/wh_abc123/logs?limit=10" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

**Response (200 OK):**

```json
[
  {
    "id": "del_xyz789",
    "event_id": "evt_abc123",
    "event_type": "generation.completed",
    "status_code": 200,
    "success": true,
    "response_time_ms": 145,
    "response_body": "{\"received\": true}",
    "attempt": 1,
    "created_at": "2026-07-17T12:00:01Z"
  },
  {
    "id": "del_xyz790",
    "event_id": "evt_def456",
    "event_type": "generation.failed",
    "status_code": 500,
    "success": false,
    "response_time_ms": 2300,
    "response_body": "Internal Server Error",
    "attempt": 1,
    "created_at": "2026-07-17T12:01:01Z"
  }
]
```

## Webhook Handler Examples

Complete webhook handler implementations for common frameworks. These include signature verification, event routing, idempotency, and proper response handling.

### Full Handler with Event Routing

::: code-group

```python [Python]
"""
Complete FOTOhub webhook handler with Flask.
Includes signature verification, idempotency, and async processing.
"""
from flask import Flask, request, jsonify
import hmac
import hashlib
import os
import json
import redis
from datetime import timedelta

app = Flask(__name__)
WEBHOOK_SECRET = os.environ["FOTOHUB_WEBHOOK_SECRET"]

# Redis for idempotency tracking
r = redis.Redis(host="localhost", port=6379, db=0)


def verify_signature(payload: bytes, signature: str) -> bool:
    """Verify HMAC-SHA256 signature."""
    expected = hmac.new(
        WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


def is_duplicate(event_id: str) -> bool:
    """Check if we already processed this event (idempotency)."""
    key = f"webhook:processed:{event_id}"
    if r.exists(key):
        return True
    # Mark as processed with 48h TTL
    r.setex(key, timedelta(hours=48), "1")
    return False


@app.route("/webhook/fotohub", methods=["POST"])
def handle_webhook():
    # 1. Verify signature
    signature = request.headers.get("X-FotoHub-Signature", "")
    if not verify_signature(request.data, signature):
        return jsonify({"error": "Invalid signature"}), 401

    # 2. Parse event
    event = request.json
    event_id = event["id"]
    event_type = event["type"]

    # 3. Idempotency check
    if is_duplicate(event_id):
        return jsonify({"received": True, "duplicate": True}), 200

    # 4. Route by event type
    handlers = {
        "generation.completed": handle_generation_completed,
        "generation.failed": handle_generation_failed,
        "video.ready": handle_video_ready,
        "music.ready": handle_music_ready,
        "credits.low": handle_credits_low,
        "credits.depleted": handle_credits_depleted,
        "billing.low_credits": handle_billing_low_credits,
        "billing.charged": handle_billing_charged,
        "key.used": handle_key_used,
    }

    handler = handlers.get(event_type)
    if handler:
        handler(event["data"])

    # 5. Acknowledge receipt quickly
    return jsonify({"received": True}), 200


def handle_generation_completed(data):
    """Download and process completed generation."""
    print(f"Generation complete: {data['job_id']} -> {data['output_url']}")
    # Queue for async download/processing

def handle_generation_failed(data):
    """Log failed generation for review."""
    print(f"Generation failed: {data['job_id']} - {data['error']}")

def handle_video_ready(data):
    """Video is ready for download."""
    print(f"Video ready: {data['job_id']} ({data['duration_seconds']}s)")

def handle_music_ready(data):
    """Music track is ready for download."""
    print(f"Music ready: {data['job_id']} ({data['duration_seconds']}s)")

def handle_credits_low(data):
    """Alert team about low credits."""
    print(f"Credits low: {data['credits_remaining']}/{data['credits_total']}")

def handle_credits_depleted(data):
    """Emergency: credits depleted."""
    print(f"ALERT: Credits depleted! {data['message']}")

def handle_billing_low_credits(data):
    """Wallet balance below threshold."""
    print(f"Wallet low: {data['wallet_balance_pln']} PLN")

def handle_billing_charged(data):
    """Sync charge to accounting system."""
    print(f"Charged: {data['amount_pln']} PLN for {data['operation']}")

def handle_key_used(data):
    """Security: new IP detected."""
    if data.get("first_seen"):
        print(f"New IP {data['ip_address']} using key {data['key_name']}")


if __name__ == "__main__":
    app.run(port=3000)
```

```typescript [TypeScript]
/**
 * Complete FOTOhub webhook handler with Express.
 * Includes signature verification, idempotency, and async processing.
 */
import express from "express";
import crypto from "crypto";
import Redis from "ioredis";

const app = express();
app.use(express.raw({ type: "application/json" }));

const WEBHOOK_SECRET = process.env.FOTOHUB_WEBHOOK_SECRET!;
const redis = new Redis();

function verifySignature(payload: Buffer, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(`sha256=${expected}`),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

async function isDuplicate(eventId: string): Promise<boolean> {
  const key = `webhook:processed:${eventId}`;
  const exists = await redis.exists(key);
  if (exists) return true;
  await redis.setex(key, 172800, "1"); // 48h TTL
  return false;
}

interface WebhookEvent {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, any>;
}

app.post("/webhook/fotohub", async (req, res) => {
  // 1. Verify signature
  const signature = req.headers["x-fotohub-signature"] as string;
  if (!verifySignature(req.body, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // 2. Parse event
  const event: WebhookEvent = JSON.parse(req.body.toString());

  // 3. Idempotency check
  if (await isDuplicate(event.id)) {
    return res.status(200).json({ received: true, duplicate: true });
  }

  // 4. Route by event type
  switch (event.type) {
    case "generation.completed":
      handleGenerationCompleted(event.data);
      break;
    case "generation.failed":
      handleGenerationFailed(event.data);
      break;
    case "video.ready":
      handleVideoReady(event.data);
      break;
    case "music.ready":
      handleMusicReady(event.data);
      break;
    case "credits.low":
      handleCreditsLow(event.data);
      break;
    case "credits.depleted":
      handleCreditsDepleted(event.data);
      break;
    case "billing.low_credits":
      handleBillingLowCredits(event.data);
      break;
    case "billing.charged":
      handleBillingCharged(event.data);
      break;
    case "key.used":
      handleKeyUsed(event.data);
      break;
  }

  // 5. Acknowledge receipt quickly
  res.status(200).json({ received: true });
});

function handleGenerationCompleted(data: any) {
  console.log(`Generation complete: ${data.job_id} -> ${data.output_url}`);
}

function handleGenerationFailed(data: any) {
  console.log(`Generation failed: ${data.job_id} - ${data.error}`);
}

function handleVideoReady(data: any) {
  console.log(`Video ready: ${data.job_id} (${data.duration_seconds}s)`);
}

function handleMusicReady(data: any) {
  console.log(`Music ready: ${data.job_id} (${data.duration_seconds}s)`);
}

function handleCreditsLow(data: any) {
  console.log(`Credits low: ${data.credits_remaining}/${data.credits_total}`);
}

function handleCreditsDepleted(data: any) {
  console.error(`ALERT: Credits depleted! ${data.message}`);
}

function handleBillingLowCredits(data: any) {
  console.log(`Wallet low: ${data.wallet_balance_pln} PLN`);
}

function handleBillingCharged(data: any) {
  console.log(`Charged: ${data.amount_pln} PLN for ${data.operation}`);
}

function handleKeyUsed(data: any) {
  if (data.first_seen) {
    console.log(`New IP ${data.ip_address} using key ${data.key_name}`);
  }
}

app.listen(3000, () => console.log("Webhook handler running on :3000"));
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
	"log"
	"net/http"
	"os"
	"sync"
)

var (
	webhookSecret = os.Getenv("FOTOHUB_WEBHOOK_SECRET")
	// Simple in-memory dedup (use Redis in production)
	processedEvents = make(map[string]bool)
	mu              sync.Mutex
)

type WebhookEvent struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"`
	CreatedAt string                 `json:"created_at"`
	Data      map[string]interface{} `json:"data"`
}

func verifySignature(payload []byte, signature string) bool {
	mac := hmac.New(sha256.New, []byte(webhookSecret))
	mac.Write(payload)
	expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

func isDuplicate(eventID string) bool {
	mu.Lock()
	defer mu.Unlock()
	if processedEvents[eventID] {
		return true
	}
	processedEvents[eventID] = true
	return false
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Read body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// 2. Verify signature
	signature := r.Header.Get("X-FotoHub-Signature")
	if !verifySignature(body, signature) {
		http.Error(w, `{"error":"Invalid signature"}`, http.StatusUnauthorized)
		return
	}

	// 3. Parse event
	var event WebhookEvent
	if err := json.Unmarshal(body, &event); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// 4. Idempotency check
	if isDuplicate(event.ID) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"received":true,"duplicate":true}`)
		return
	}

	// 5. Route by event type
	switch event.Type {
	case "generation.completed":
		log.Printf("Generation complete: %v -> %v", event.Data["job_id"], event.Data["output_url"])
	case "generation.failed":
		log.Printf("Generation failed: %v - %v", event.Data["job_id"], event.Data["error"])
	case "video.ready":
		log.Printf("Video ready: %v", event.Data["job_id"])
	case "music.ready":
		log.Printf("Music ready: %v", event.Data["job_id"])
	case "credits.low":
		log.Printf("Credits low: %v remaining", event.Data["credits_remaining"])
	case "credits.depleted":
		log.Printf("ALERT: Credits depleted!")
	case "billing.low_credits":
		log.Printf("Wallet low: %v PLN", event.Data["wallet_balance_pln"])
	case "billing.charged":
		log.Printf("Charged: %v PLN for %v", event.Data["amount_pln"], event.Data["operation"])
	case "key.used":
		log.Printf("Key used from IP: %v", event.Data["ip_address"])
	}

	// 6. Acknowledge receipt
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"received":true}`)
}

func main() {
	http.HandleFunc("/webhook/fotohub", webhookHandler)
	log.Println("Webhook handler running on :3000")
	log.Fatal(http.ListenAndServe(":3000", nil))
}
```

```bash [cURL]
# Test your webhook handler locally with a simulated delivery

# 1. Generate a test signature
PAYLOAD='{"id":"evt_test_001","type":"generation.completed","created_at":"2026-07-17T12:00:00Z","data":{"job_id":"vj_xyz","generation_type":"video","model":"veo-2.0-generate-001","output_url":"https://s3point.fotohub.app/generations/vj_xyz.mp4","duration":5,"billing":{"method":"credits","credits_used":155,"pln_charged":31.00}}}'
SECRET="your_webhook_secret_here"
SIGNATURE="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')"

# 2. Send to your local handler
curl -X POST http://localhost:3000/webhook/fotohub \
  -H "Content-Type: application/json" \
  -H "X-FotoHub-Signature: $SIGNATURE" \
  -H "X-FotoHub-Timestamp: 2026-07-17T12:00:00Z" \
  -H "X-FotoHub-Event: generation.completed" \
  -H "X-FotoHub-Delivery-Id: del_test_001" \
  -d "$PAYLOAD"

# Expected response: {"received": true}
```

:::

## Debugging Tips

### Common Issues

| Problem | Solution |
|---------|----------|
| Signature mismatch | Ensure you verify against the raw request body bytes, not a parsed/re-serialized JSON string. |
| Timeout errors | Return 200 immediately and process asynchronously. Do not perform heavy work before responding. |
| Webhook disabled | Check delivery logs for the error pattern. Fix your endpoint, then re-enable in the console. |
| Missing events | Verify the webhook subscribes to the correct event types. Check the `events` array. |
| Duplicate events | Implement idempotency by tracking the `id` field of each processed event. |
| Wrong event format | Use `express.raw()` or `request.data` to get raw bytes before parsing. |

### Delivery Log Analysis

View delivery history in the console at **fotohub.app/console** -> **Settings** -> **Webhooks** -> select webhook -> **Logs**, or via the API:

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Get failed deliveries only
logs = client.webhooks.logs("wh_abc123", success=False, limit=20)
for log in logs:
    print(f"[FAILED] {log.event_type} at {log.created_at}")
    print(f"  HTTP {log.status_code} - Attempt {log.attempt}")
    print(f"  Response: {log.response_body[:200]}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Get failed deliveries only
const logs = await client.webhooks.logs("wh_abc123", {
  success: false,
  limit: 20,
});
for (const log of logs) {
  console.log(`[FAILED] ${log.eventType} at ${log.createdAt}`);
  console.log(`  HTTP ${log.statusCode} - Attempt ${log.attempt}`);
  console.log(`  Response: ${log.responseBody.slice(0, 200)}`);
}
```

```go [Go]
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET",
		"https://apis.fotohub.app/v1/console/webhooks/wh_abc123/logs?success=false&limit=20",
		nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()

	var logs []map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&logs)
	for _, log := range logs {
		fmt.Printf("[FAILED] %s at %s\n", log["event_type"], log["created_at"])
		fmt.Printf("  HTTP %v - Attempt %v\n", log["status_code"], log["attempt"])
	}
}
```

```bash [cURL]
# Get failed delivery logs
curl "https://apis.fotohub.app/v1/console/webhooks/wh_abc123/logs?success=false&limit=20" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

Each log entry includes:

- **Timestamp** -- When the delivery was attempted
- **Event type** -- Which event was sent
- **HTTP status** -- Response code from your endpoint (or `timeout`)
- **Response time** -- How long your endpoint took to respond
- **Attempt number** -- Which retry attempt (1-4)
- **Response body** -- First 512 bytes of your endpoint's response

### Testing Locally

Use a tunneling service like ngrok to expose your local development server:

```bash
# Start your local webhook handler
python app.py  # or: npx ts-node server.ts

# In another terminal, create a tunnel
ngrok http 3000

# Register the ngrok URL as your webhook endpoint
curl -X POST https://apis.fotohub.app/v1/console/webhooks \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local Dev",
    "url": "https://abc123.ngrok.io/webhook/fotohub",
    "events": ["generation.completed", "generation.failed", "video.ready", "music.ready"]
  }'

# Send a test event
curl -X POST https://apis.fotohub.app/v1/console/webhooks/wh_abc123/test \
  -H "Authorization: Bearer fh_live_your_api_key"
```

## Event Filtering Patterns

### Subscribe to Generation Events Only

```json
{
  "events": ["generation.completed", "generation.failed", "video.ready", "music.ready"]
}
```

### Subscribe to Billing Events Only

```json
{
  "events": ["credits.low", "credits.depleted", "billing.low_credits", "billing.charged"]
}
```

### Subscribe to Security Events Only

```json
{
  "events": ["key.used"]
}
```

### Subscribe to All Events

```json
{
  "events": [
    "generation.completed",
    "generation.failed",
    "video.ready",
    "music.ready",
    "credits.low",
    "credits.depleted",
    "billing.low_credits",
    "billing.charged",
    "key.used"
  ]
}
```

## Limits

| Constraint | Value |
|------------|-------|
| Maximum webhooks per account | 10 |
| Request timeout | 5 seconds |
| Maximum retries | 4 (5 total attempts) |
| Auto-disable threshold | 10 consecutive failures |
| Minimum plan | Startup |
| URL scheme | HTTPS only |
| Payload size | Up to 64 KB |
| Custom headers per webhook | 10 |
| Event types per webhook | Unlimited (select from available events) |

## Related APIs

- [Rate Limits](/api/rate-limits) -- Understand request quotas for webhook management endpoints.
- [Error Handling](/api/errors) -- Error codes returned by webhook management endpoints.
- [Authentication](/api/authentication) -- API key and JWT authentication details.
