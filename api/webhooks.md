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

This table is the platform's exact `ALLOWED_EVENTS` allow-list -- subscribing to
anything outside it is rejected at creation time (`400 Invalid events: ...`), and
nothing outside it can ever be delivered, because delivery matches on
`events.contains([event])`.

| Event | Description |
|-------|-------------|
| `generation.completed` | Image, video, or music generation finished successfully. Includes output URL and billing info. |
| `generation.failed` | Generation failed with an error. Includes error reason and partial billing info. |
| `generation.refunded` | A failed generation's charge was reversed. Carries `cost_usd` and `job_id` -- reconciles against the `billing.charged` that preceded it. |
| `generation.started` | A generation began processing. |
| `credits.low` | Plan credits are exhausted; the operation fell back to wallet billing. Meant to fire from the fotohub.app web app's own credit paths, not from API-key traffic -- but no emitter for it could be found anywhere in `server/`, `supabase/functions/` or the migrations at the time of writing (see the warning below). An API-only integration should subscribe to the `billing.*` events instead, which are confirmed live. |
| `credits.depleted` | Same status as `credits.low`: documented intent, no emitter found. |
| `key.used` | Accepted as a subscription target, but **no code path emits it today** — subscribing to it will never deliver anything. |
| `billing.charged` | Wallet charged for an operation, in USD. Includes `amount_usd`, `operation` and `method`. |
| `billing.insufficient_funds` | The `402` case: a request was refused for lack of funds. Carries `required_usd` and `balance_usd`, so you learn the wallet stopped a request without parsing the error of the call that was refused. |
| `billing.refunded` | A charge was reversed. |
| `billing.unfunded` | A reserved-then-settled operation's real cost exceeded both the hold and the balance. Rare, and always FOTOhub's error rather than the customer's. |
| `images.batch.completed` | A batch image job finished. |
| `background.removed` / `background.replaced` / `background.blurred` / `shadow.added` | Background/shadow operation finished. |
| `commerce.job.completed` / `commerce.job.failed` / `commerce.item.completed` / `commerce.job.awaiting_credits` | Commerce Bridge batch events. |
| `shorts.job.started` / `shorts.job.completed` / `shorts.job.failed` / `shorts.clip.rendered` | Shorts clipping job lifecycle, delivered by shorts-engine's own webhook path (account subscriptions only -- a clipping job can also take a per-job `webhook_url`, delivered directly by the engine and independent of this subscription system). |

::: warning Real events that exist but cannot be subscribed to
A handful of events fire internally (`fire_event(...)` in the codebase) but are
**not** on `ALLOWED_EVENTS`, so no account webhook can ever receive them --
subscribing to them is simply rejected as an unknown event name:

- `video.lip_sync.completed`
- `shorts.agent.completed`, `shorts.clips.generated`, `shorts.render.completed`
  (a different shorts pipeline from the `shorts.job.*` / `shorts.clip.rendered`
  events above, which come from shorts-engine and *are* subscribable)
- `story.generate.started`, `story.completed`
- `enterprise.application_submitted`

If your integration needs one of these, poll the relevant job/resource status
endpoint instead -- there is no webhook path for them today.
:::

::: warning `credits.low` and `credits.depleted` have no emitter found
Unlike `key.used`, these two are not source-commented as unfired -- a test in
`api-server` explicitly says they are "emitted outside this service" on the
fotohub.app subscription side. But a repository-wide search for the literal
event names, across `server/`, `supabase/functions/` and the SQL migrations,
turns up no call site that actually fires either one -- the same symptom as
`key.used`, just without the comment admitting it. Treat both as unverified in
practice: they are accepted subscriptions, and may be silently delivering
nothing, until an emitter is found or added.
:::

::: warning Money fields are USD
Every monetary field in a webhook payload (`amount_usd`, `needed_usd`) is USD.
The wallet, per-request billing and top-ups moved to USD on 2026-08-05.
:::

## Event Payload Examples

All webhook deliveries use the same envelope: `{ "event", "timestamp", "data", "attempt" }`.
`event` is the event type, `timestamp` is an ISO-8601 string, `attempt` is the
1-based delivery attempt, and `data` carries the event-specific fields.

### generation.completed

`data` is a flat set of billing/identity fields set by the route that fired it --
not a nested `billing` object, and not the same fields on every route. There is
**no `job_id` and no `output_url`** on this event; get the result the way you
normally would (the synchronous API response, or by polling the job). `duration`
appears on video/music routes, `tokens` on token-billed ones; a plain image
generation has neither:

```json
{
  "event": "generation.completed",
  "timestamp": "2026-07-17T12:00:00Z",
  "attempt": 1,
  "data": {
    "type": "video",
    "model": "veo-2.0-generate-001",
    "duration": 5,
    "cost_usd": 0.45
  }
}
```

### generation.failed

Also flat, and also with **no `job_id`**. `error` is the failure message itself
(truncated to 200 characters), not a short machine code -- there is no separate
`error_message` field. `refunded` is present on routes where a charge could have
already been taken; it is absent on routes where the failure is caught before
any charge:

```json
{
  "event": "generation.failed",
  "timestamp": "2026-07-17T12:01:00Z",
  "attempt": 1,
  "data": {
    "type": "video",
    "model": "veo-2.0-generate-001",
    "error": "The prompt was rejected by the safety filter.",
    "refunded": true
  }
}
```

### generation.refunded

Unlike the two events above, this one **does** carry `job_id` -- it exists specifically
to reconcile against the `billing.charged` (or the `cost_usd` on `generation.completed`)
that preceded it:

```json
{
  "event": "generation.refunded",
  "timestamp": "2026-07-17T12:02:00Z",
  "attempt": 1,
  "data": {
    "type": "video",
    "model": "veo-2.0-generate-001",
    "cost_usd": 0.45,
    "job_id": "vj_xyz"
  }
}
```

### credits.low / credits.depleted

No emitter for either event could be found in the codebase (see the warning
under [Available Events](#available-events)), so the shape below is the
documented intent, not something observed live. Treat it as unconfirmed:

```json
{
  "event": "credits.low",
  "timestamp": "2026-07-17T14:00:00Z",
  "attempt": 1,
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
  "timestamp": "2026-07-17T10:45:00Z",
  "attempt": 1,
  "data": {
    "operation": "generate_video:kling-v3",
    "amount_usd": 1.47,
    "balance_usd": 8.53,
    "currency": "USD"
  }
}
```

### billing.insufficient_funds

The `402` case, fired the moment a request is refused for lack of funds:

```json
{
  "event": "billing.insufficient_funds",
  "timestamp": "2026-07-17T10:46:00Z",
  "attempt": 1,
  "data": {
    "operation": "generate_video:kling-v3",
    "required_usd": 1.47,
    "balance_usd": 0.02
  }
}
```

### billing.refunded

```json
{
  "event": "billing.refunded",
  "timestamp": "2026-07-17T10:47:00Z",
  "attempt": 1,
  "data": {
    "operation": "generate_video:kling-v3",
    "amount_usd": 1.47,
    "reason": "generation_failed"
  }
}
```

### billing.unfunded

A reserved-then-settled operation whose real cost exceeded both the hold and the
balance -- always FOTOhub's error, not the customer's:

```json
{
  "event": "billing.unfunded",
  "timestamp": "2026-07-17T10:48:00Z",
  "attempt": 1,
  "data": {
    "operation": "generate_video:kling-v3",
    "unfunded_usd": 0.31
  }
}
```

### key.used

```json
{
  "event": "key.used",
  "timestamp": "2026-07-17T09:15:00Z",
  "attempt": 1,
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
The envelope has no delivery id. Deduplicate on the event-specific identifier in
`data` (`job_id` where present) combined with `event` and `timestamp`, and check
`attempt > 1` to spot a retry of a request you may already have processed.
:::

## Security: Signature Verification

Every webhook delivery includes an `X-FotoHub-Signature` header containing an HMAC-SHA256 signature. Always verify this signature to ensure the payload originated from FOTOhub and was not tampered with.

### Headers Included

| Header | Description |
|--------|-------------|
| `X-FotoHub-Signature` | HMAC-SHA256 hex digest of the raw request body. **No `sha256=` prefix.** |
| `X-FotoHub-Event` | The event type (e.g., `generation.completed`) |

The signature is computed over the raw body only — the timestamp is inside the
JSON payload, not concatenated into the signed string. Compare against a plain
hex digest.

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
    return hmac.compare_digest(expected, signature)


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
    Buffer.from(expected),
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
	expected := hex.EncodeToString(mac.Sum(nil))
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
RECEIVED_SIGNATURE="abc123..."

# Compute expected signature (raw hex, no prefix)
EXPECTED=$(cat payload.json | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print $2}')

# Compare
if [ "$EXPECTED" = "$RECEIVED_SIGNATURE" ]; then
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

If your endpoint returns a non-2xx status code or the request fails, FOTOhub
retries with exponential backoff. There are **3 attempts in total**, and the
`attempt` field in the payload tells you which one you are receiving.

### Retry Schedule

| Attempt | Delay before it | Notes |
|---------|-----------------|-------|
| 1 | — | Initial delivery |
| 2 | 1 second | First retry |
| 3 | 2 seconds | Final attempt |

After attempt 3 the delivery is recorded as failed in the delivery logs and the
event is dropped (not queued).

### Failures Never Disable Your Webhook

There is no auto-disable and no failure counter. A webhook stays `active` until
you set `active: false` yourself via `PATCH /v1/console/webhooks/{id}`, no
matter how many deliveries fail. Nothing emails you about failures either --
poll `GET /v1/console/webhooks/{id}/logs` if you need to know.

Every failed delivery is simply logged and its event dropped, so a broken
endpoint silently loses events instead of accumulating a backlog.

### Best Practices for Reliability

- **Respond quickly** -- Return a 200 status within 5 seconds. Process the event asynchronously after acknowledging receipt.
- **Use a queue** -- For heavy processing, push events to a message queue (Redis, SQS, RabbitMQ) and process them separately.
- **Handle duplicates** -- Retries repeat the whole delivery, so your endpoint may see the same event more than once. There is no event id to key on: build your own from `event` + `timestamp` + a subject id inside `data`, and treat `attempt > 1` as a possible repeat.
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

webhook = client.create_webhook(
    name="Production Notifications",
    url="https://your-server.com/webhook",
    events=["generation.completed", "generation.failed", "credits.low"],
    headers={"X-Custom-Source": "fotohub"}
)

print(f"Webhook ID: {webhook['id']}")
print(f"Secret (save this!): {webhook['secret']}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const webhook = await client.createWebhook({
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

webhooks = client.list_webhooks()
for wh in webhooks:
    status = "active" if wh["active"] else "inactive"
    print(f"[{status}] {wh['name']} -> {wh['url']}")
    print(f"  Events: {', '.join(wh['events'])}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const webhooks = await client.listWebhooks();
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

# Add batch and billing events
updated = client.update_webhook(
    "wh_abc123",
    events=[
        "generation.completed",
        "generation.failed",
        "images.batch.completed",
        "billing.charged",
        "credits.low",
    ],
    active=True
)
print(f"Updated: {updated['name']}, events: {updated['events']}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const updated = await client.updateWebhook("wh_abc123", {
  events: [
    "generation.completed",
    "generation.failed",
    "images.batch.completed",
    "billing.charged",
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
			"images.batch.completed",
			"billing.charged",
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
    "events": ["generation.completed", "generation.failed", "images.batch.completed", "billing.charged", "credits.low"],
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

client.delete_webhook("wh_abc123")
print("Webhook deleted")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

await client.deleteWebhook("wh_abc123");
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

Sends a test delivery to your endpoint. The webhook must be active.

It fires **the webhook's own first configured event type** — there is no `test`
event type, because `test` is not an allowed event and no webhook's `events`
array can contain it. So a webhook subscribed to `generation.completed` receives
a `generation.completed` delivery whose `data` is `{"test": true, ...}`. Branch
on `data.test` if you need to ignore it in production logic.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.test_webhook("wh_abc123")
print(f"Fired: {result['success']} - {result['message']}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.testWebhook("wh_abc123");
console.log(`Fired: ${result.success} - ${result.message}`);
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
	fmt.Printf("Fired: %v - %v\n", result["success"], result["message"])
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/console/webhooks/wh_abc123/test \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

**Test event payload your endpoint receives** (assuming the webhook's first
configured event is `generation.completed`):

```json
{
  "event": "generation.completed",
  "timestamp": "2026-07-17T12:00:00Z",
  "attempt": 1,
  "data": {
    "test": true,
    "timestamp": "2026-07-17T12:00:00Z",
    "webhook_id": "wh_abc123"
  }
}
```

**Endpoint response:**

```json
{
  "success": true,
  "message": "Test event fired successfully.",
  "timestamp": "2026-07-17T12:00:00Z"
}
```

`success: false` with `"Delivery attempted but your endpoint did not return a
success response after 3 tries."` means your server rejected all 3 attempts.

---

### View Delivery Logs

```
GET /v1/console/webhooks/{id}/logs
```

Returns the last 50 delivery attempts with response status, response body
preview, success flag, and timestamps. Useful for debugging failed deliveries.

This endpoint takes **no query parameters** — it always returns the most recent
50 rows, newest first. Filter client-side on `event` and `success`.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

logs = client.get_webhook_logs("wh_abc123")
for log in logs[:10]:
    status = "OK" if log["success"] else "FAILED"
    print(f"[{status}] {log['event']} -> HTTP {log['response_status']} at {log['attempted_at']}")
    if not log["success"]:
        print(f"  Error: {(log.get('response_body') or '')[:100]}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const logs = await client.getWebhookLogs("wh_abc123");
for (const log of logs.slice(0, 10)) {
  const status = log.success ? "OK" : "FAILED";
  console.log(`[${status}] ${log.event} -> HTTP ${log.response_status} at ${log.attempted_at}`);
  if (!log.success) {
    console.log(`  Error: ${(log.response_body ?? "").slice(0, 100)}`);
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
	ID             string `json:"id"`
	Event          string `json:"event"`
	ResponseStatus int    `json:"response_status"`
	ResponseBody   string `json:"response_body"`
	Success        bool   `json:"success"`
	AttemptedAt    string `json:"attempted_at"`
}

func main() {
	req, _ := http.NewRequest("GET",
		"https://apis.fotohub.app/v1/console/webhooks/wh_abc123/logs", nil)
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
		fmt.Printf("[%s] %s -> HTTP %d at %s\n",
			status, log.Event, log.ResponseStatus, log.AttemptedAt)
	}
}
```

```bash [cURL]
curl https://apis.fotohub.app/v1/console/webhooks/wh_abc123/logs \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

**Response (200 OK):**

```json
[
  {
    "id": "del_xyz789",
    "event": "generation.completed",
    "payload": { "event": "generation.completed", "timestamp": "...", "data": {} },
    "response_status": 200,
    "response_body": "{\"received\": true}",
    "success": true,
    "attempted_at": "2026-07-17T12:00:01Z"
  },
  {
    "id": "del_xyz790",
    "event": "generation.failed",
    "payload": { "event": "generation.failed", "timestamp": "...", "data": {} },
    "response_status": 500,
    "response_body": "Internal Server Error",
    "success": false,
    "attempted_at": "2026-07-17T12:01:01Z"
  }
]
```

The columns are `event` / `response_status` / `attempted_at` — not
`event_type` / `status_code` / `created_at`. There is no `response_time_ms`
and no `event_id`.

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
    return hmac.compare_digest(expected, signature)


def is_duplicate(dedup_key: str) -> bool:
    """Check if we already processed this event (idempotency).

    FOTOhub sends no delivery/event id, so build the key yourself from the
    envelope: event + timestamp + whatever identifies the subject.
    """
    key = f"webhook:processed:{dedup_key}"
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
    event_type = event["event"]
    dedup_key = ":".join([
        event_type, event["timestamp"],
        str(event.get("data", {}).get("job_id", "")),
    ])

    # 3. Idempotency check
    if is_duplicate(dedup_key):
        return jsonify({"received": True, "duplicate": True}), 200

    # 4. Route by event type
    handlers = {
        "generation.completed": handle_generation_completed,
        "generation.failed": handle_generation_failed,
        "credits.low": handle_credits_low,
        "credits.depleted": handle_credits_depleted,
        "billing.charged": handle_billing_charged,
        "key.used": handle_key_used,
    }

    handler = handlers.get(event_type)
    if handler:
        handler(event["data"])

    # 5. Acknowledge receipt quickly
    return jsonify({"received": True}), 200


def handle_generation_completed(data):
    """Note the completed generation. No job_id or output_url on this event --
    fetch the result the way you normally would (sync response or job poll)."""
    print(f"Generation complete: {data['type']}/{data['model']} cost ${data.get('cost_usd', 0)}")
    # Queue for async download/processing

def handle_generation_failed(data):
    """Log failed generation for review. No job_id on this event either."""
    print(f"Generation failed: {data['type']}/{data['model']} - {data['error']}")

def handle_credits_low(data):
    """Plan credits exhausted -- wallet billing takes over."""
    print(f"Credits low on {data['operation']}: {data['message']}")

def handle_credits_depleted(data):
    """Emergency: the wallet could not cover the charge."""
    print(f"ALERT: wallet short ${data['needed_usd']} on {data['operation']}")

def handle_billing_charged(data):
    """Sync charge to accounting system."""
    print(f"Charged: ${data['amount_usd']} for {data['operation']}, balance now ${data['balance_usd']}")

def handle_key_used(data):
    """Security: new IP detected.

    Subscribable, but nothing in the platform emits key.used today, so its
    `data` shape is not contractual -- read defensively.
    """
    print(f"key.used: {data}")


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
      Buffer.from(expected),
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
  event: string;
  timestamp: string;
  attempt: number;
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

  // 3. Idempotency check -- no delivery id is sent, so derive a key
  const dedupKey = `${event.event}:${event.timestamp}:${event.data.job_id ?? ""}`;
  if (await isDuplicate(dedupKey)) {
    return res.status(200).json({ received: true, duplicate: true });
  }

  // 4. Route by event type
  switch (event.event) {
    case "generation.completed":
      handleGenerationCompleted(event.data);
      break;
    case "generation.failed":
      handleGenerationFailed(event.data);
      break;
    case "credits.low":
      handleCreditsLow(event.data);
      break;
    case "credits.depleted":
      handleCreditsDepleted(event.data);
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
  // No job_id or output_url on this event -- fetch the result the way you
  // normally would (sync response or job poll).
  console.log(`Generation complete: ${data.type}/${data.model} cost $${data.cost_usd ?? 0}`);
}

function handleGenerationFailed(data: any) {
  console.log(`Generation failed: ${data.type}/${data.model} - ${data.error}`);
}

function handleCreditsLow(data: any) {
  console.log(`Credits low on ${data.operation}: ${data.message}`);
}

function handleCreditsDepleted(data: any) {
  console.error(`ALERT: wallet short $${data.needed_usd} on ${data.operation}`);
}

function handleBillingCharged(data: any) {
  console.log(`Charged: $${data.amount_usd} for ${data.operation}`);
}

function handleKeyUsed(data: any) {
  // Subscribable, but nothing emits key.used today -- shape is not contractual.
  console.log("key.used:", data);
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
	Event     string                 `json:"event"`
	Timestamp string                 `json:"timestamp"`
	Attempt   int                    `json:"attempt"`
	Data      map[string]interface{} `json:"data"`
}

func verifySignature(payload []byte, signature string) bool {
	mac := hmac.New(sha256.New, []byte(webhookSecret))
	mac.Write(payload)
	expected := hex.EncodeToString(mac.Sum(nil))
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

	// 4. Idempotency check -- no delivery id is sent, so derive a key
	dedupKey := fmt.Sprintf("%s:%s:%v", event.Event, event.Timestamp, event.Data["job_id"])
	if isDuplicate(dedupKey) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"received":true,"duplicate":true}`)
		return
	}

	// 5. Route by event type
	switch event.Event {
	case "generation.completed":
		// No job_id or output_url on this event -- fetch the result the way
		// you normally would (sync response or job poll).
		log.Printf("Generation complete: %v/%v cost $%v", event.Data["type"], event.Data["model"], event.Data["cost_usd"])
	case "generation.failed":
		log.Printf("Generation failed: %v/%v - %v", event.Data["type"], event.Data["model"], event.Data["error"])
	case "credits.low":
		log.Printf("Credits low on %v: %v", event.Data["operation"], event.Data["message"])
	case "credits.depleted":
		log.Printf("ALERT: wallet short $%v on %v", event.Data["needed_usd"], event.Data["operation"])
	case "billing.charged":
		log.Printf("Charged: $%v for %v", event.Data["amount_usd"], event.Data["operation"])
	case "key.used":
		// Nothing emits key.used today -- shape is not contractual.
		log.Printf("key.used: %v", event.Data)
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
PAYLOAD='{"event":"generation.completed","timestamp":"2026-07-17T12:00:00Z","attempt":1,"data":{"type":"video","model":"veo-2.0-generate-001","duration":5,"cost_usd":0.45}}'
SECRET="your_webhook_secret_here"
SIGNATURE="$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')"

# 2. Send to your local handler
curl -X POST http://localhost:3000/webhook/fotohub \
  -H "Content-Type: application/json" \
  -H "X-FotoHub-Signature: $SIGNATURE" \
  -H "X-FotoHub-Event: generation.completed" \
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
| Duplicate events | There is no event `id`. Dedupe on `event` + `timestamp` + a subject id from `data`, and treat `attempt > 1` as a retry of something you may already have. |
| Wrong event format | Use `express.raw()` or `request.data` to get raw bytes before parsing. |

### Delivery Log Analysis

View delivery history in the console at **fotohub.app/console** -> **Settings** -> **Webhooks** -> select webhook -> **Logs**, or via the API:

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# The endpoint has no filters -- fetch the last 50 and filter locally
logs = client.get_webhook_logs("wh_abc123")
for log in (l for l in logs if not l["success"]):
    print(f"[FAILED] {log['event']} at {log['attempted_at']}")
    print(f"  HTTP {log['response_status']}")
    print(f"  Response: {(log.get('response_body') or '')[:200]}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// The endpoint has no filters -- fetch the last 50 and filter locally
const logs = await client.getWebhookLogs("wh_abc123");
for (const log of logs.filter((l) => !l.success)) {
  console.log(`[FAILED] ${log.event} at ${log.attempted_at}`);
  console.log(`  HTTP ${log.response_status}`);
  console.log(`  Response: ${(log.response_body ?? "").slice(0, 200)}`);
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
		"https://apis.fotohub.app/v1/console/webhooks/wh_abc123/logs", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()

	var logs []map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&logs)
	for _, log := range logs {
		if log["success"] == true {
			continue
		}
		fmt.Printf("[FAILED] %s at %s\n", log["event"], log["attempted_at"])
		fmt.Printf("  HTTP %v\n", log["response_status"])
	}
}
```

```bash [cURL]
# Get delivery logs (last 50, newest first -- filter on .success yourself)
curl https://apis.fotohub.app/v1/console/webhooks/wh_abc123/logs \
  -H "Authorization: Bearer fh_live_your_api_key" | jq '[.[] | select(.success == false)]' 
```

:::

Each log entry includes:

- **Timestamp** (`attempted_at`) -- When the delivery was attempted
- **Event type** (`event`) -- Which event was sent
- **HTTP status** (`response_status`) -- Response code from your endpoint
- **Success** (`success`) -- Whether the response was 2xx
- **Response body** (`response_body`) -- First 1000 characters of your endpoint's response

There is no response-time field and no attempt-number column on the log row itself -- the `attempt` number lives inside the delivered `payload`, not as a separate log column.

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
    "events": ["generation.completed", "generation.failed", "images.batch.completed"]
  }'

# Send a test event
curl -X POST https://apis.fotohub.app/v1/console/webhooks/wh_abc123/test \
  -H "Authorization: Bearer fh_live_your_api_key"
```

## Event Filtering Patterns

### Subscribe to Generation Events Only

```json
{
  "events": ["generation.started", "generation.completed", "generation.failed", "generation.refunded", "images.batch.completed"]
}
```

### Subscribe to Billing Events Only

```json
{
  "events": ["billing.charged", "billing.insufficient_funds", "billing.refunded", "billing.unfunded", "credits.low", "credits.depleted"]
}
```

### Subscribe to Security Events Only

```json
{
  "events": ["key.used"]
}
```

::: tip
`key.used` is accepted here without error, but nothing in the platform emits it today -- subscribing to it produces no calls. See [Available Events](#available-events).
:::

### Subscribe to All Events

```json
{
  "events": [
    "generation.started",
    "generation.completed",
    "generation.failed",
    "generation.refunded",
    "images.batch.completed",
    "credits.low",
    "credits.depleted",
    "billing.charged",
    "billing.insufficient_funds",
    "billing.refunded",
    "billing.unfunded",
    "background.removed",
    "background.replaced",
    "background.blurred",
    "shadow.added",
    "commerce.job.completed",
    "commerce.job.failed",
    "commerce.item.completed",
    "commerce.job.awaiting_credits",
    "shorts.job.started",
    "shorts.job.completed",
    "shorts.job.failed",
    "shorts.clip.rendered",
    "key.used"
  ]
}
```

## Limits

| Constraint | Value |
|------------|-------|
| Maximum webhooks per account | 10 |
| Request timeout | Not enforced by the delivery worker -- there is no server-side cutoff on how long it waits for your response. Respond within a few seconds anyway (see [Best Practices](#best-practices-for-reliability) above); a slow endpoint delays the next retry attempt and looks identical to a hung one from the console. |
| Maximum attempts | 3 (initial + 2 retries, at 1s then 2s) |
| Auto-disable | None -- see [Failures Never Disable Your Webhook](#failures-never-disable-your-webhook) above. There is no failure counter and no threshold. |
| Minimum plan | Startup |
| URL scheme | HTTPS only |
| Payload size | Not enforced by the delivery worker -- a generation's `data` payload is normally well under a few KB. |
| Custom headers per webhook | 10 |
| Event types per webhook | Unlimited, from the [Available Events](#available-events) allow-list above |

## Related APIs

- [Rate Limits](/api/rate-limits) -- Understand request quotas for webhook management endpoints.
- [Error Handling](/api/errors) -- Error codes returned by webhook management endpoints.
- [Authentication](/api/authentication) -- API key and JWT authentication details.
