# FotoHUB Social Studio API

FotoHUB Social Studio (`/v1/social`) provides multi-platform social media publishing, scheduling, calendar management, and AI content assistance across Facebook, Instagram, LinkedIn, Twitter/X, and TikTok.

Base URL: `https://apis.fotohub.app/v1`

::: tip
All API requests must be authenticated using your live API key. Test keys cannot interact with live social platform endpoints.
:::

---

## System Architecture

The FotoHUB Social Studio engine relies on a unified event bus to handle synchronous and asynchronous multi-platform social actions, including media transcoding and DLQ handling.

```mermaid
flowchart TD
    Client["Client App"] --> API["Social Studio API (v1/social)"]
    API --> Accounts["Account Management"]
    API --> AI["AI Content Generation"]
    API --> Pub["Publishing Engine"]
    
    Pub --> Q["Kafka Event Bus"]
    Q --> worker1["Transcoding Worker (GPU2)"]
    Q --> worker2["Publishing Worker"]
    
    worker1 --> S3["S3/R2 Blob Storage"]
    worker2 --> Platform["Social Platforms"]
    
    Platform --> webhook["Webhooks (Status/Analytics)"]
    webhook --> Client
```

---

## Unit Economics & Billing

All costs are explicitly billed in pure USD to your wallet balance (`wallet.available_usd`). We do not use credits, tokens, or synthetic currencies.

| Operation | Cost per Unit | Billed Metric |
|---|---|---|
| AI Caption Generation | $0.003 | Per API call |
| Multi-Platform Publish | $0.004 | Per account target |
| Account Connection | Free | N/A |
| Post Scheduling | Free | N/A |
| Analytics Fetch | Free | N/A |
| Video Transcoding | $0.015 | Per min of video processed |

---

## Platform Constraints

Before publishing, ensure your media files comply with platform-specific limitations.

| Platform | Max Duration | Aspect Ratio | Max File Size | Caption Length |
|---|---|---|---|---|
| TikTok | 10 min | 9:16 | 1 GB | 2,200 chars |
| Instagram Reels | 15 min | 9:16 | 1 GB | 2,200 chars |
| YouTube Shorts | 60 sec | 9:16 | 256 MB | 5,000 chars |
| LinkedIn | 10 min | 16:9 / 1:1 | 5 GB | 3,000 chars |
| Twitter/X | 2m20s | any | 512 MB | 280 chars |

::: warning
Attempting to upload files that exceed the `Max File Size` or `Max Duration` will result in an immediate `400 Bad Request` prior to initiating the external API call.
:::

---

## Rate Limits

Each platform enforces different request thresholds. Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`) are returned on all standard operations.

- **TikTok:** 200 posts per day per account.
- **Instagram:** 25 posts per hour per account.
- **Twitter/X:** 50 posts per 24 hours.

---

## Account Management

### 1. List Connected Accounts

Retrieve a list of all social accounts currently authenticated and linked to your workspace.

```
GET /v1/accounts
```

#### Response Parameters

| Field | Type | Description |
|---|---|---|
| `accounts` | array | List of connected account objects. |
| `accounts[].id` | string | The internal FotoHUB account ID. |
| `accounts[].platform` | string | One of: `instagram`, `tiktok`, `facebook`, `linkedin`, `twitter`. |
| `accounts[].status` | string | `active`, `disconnected`, `expired`. |
| `accounts[].follower_count` | integer | Current follower or subscriber count. |

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
}
resp = requests.get("https://apis.fotohub.app/v1/accounts", headers=headers)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/accounts", {
  method: "GET",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  }
});
const data = await resp.json();
console.log(data);
```

```go [Go]
package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/accounts", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/accounts \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json"
```

:::

### 2. Connect Account

Initiates the OAuth 2.0 flow for a specified platform.

```
POST /v1/accounts/connect
```

#### Request Parameters

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `platform` | string | **Yes** | - | Options: `instagram`, `tiktok`, `facebook`, `linkedin`, `twitter` |
| `redirect_uri` | string | **Yes** | - | URL to redirect users back to after authorization. |

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
}
payload = {
    "platform": "tiktok",
    "redirect_uri": "https://myapp.com/callbacks/social"
}
resp = requests.post("https://apis.fotohub.app/v1/accounts/connect", headers=headers, json=payload)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/accounts/connect", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    platform: "tiktok",
    redirect_uri: "https://myapp.com/callbacks/social"
  })
});
const data = await resp.json();
console.log(data);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]string{
		"platform":     "tiktok",
		"redirect_uri": "https://myapp.com/callbacks/social",
	}
	jsonValue, _ := json.Marshal(payload)
	
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/accounts/connect", bytes.NewBuffer(jsonValue))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/accounts/connect \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"platform":"tiktok","redirect_uri":"https://myapp.com/callbacks/social"}'
```

:::

### 3. Disconnect Account

Revokes the OAuth token and removes the account from your workspace.

```
DELETE /v1/accounts/{id}
```

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_your_api_key"
}
resp = requests.delete("https://apis.fotohub.app/v1/accounts/acc_12345", headers=headers)
print(resp.status_code)
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/accounts/acc_12345", {
  method: "DELETE",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key"
  }
});
console.log(resp.status);
```

```go [Go]
package main

import (
	"fmt"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/v1/accounts/acc_12345", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	
	fmt.Println(resp.StatusCode)
}
```

```bash [cURL]
curl -X DELETE https://apis.fotohub.app/v1/accounts/acc_12345 \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

---

## Publishing Engine

### 1. Publish Immediately

Execute a synchronous or near-synchronous post to target platforms. Note that some API calls might still return `202 Accepted` if video transcoding is required.

```
POST /v1/social/publish
```

#### Request Parameters

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `account_ids` | array of strings | **Yes** | - | Target account IDs to publish to. |
| `media_url` | string | **Yes** | - | URL of the media (image/video) to publish. |
| `caption` | string | No | `""` | The post text or caption. |
| `hashtags` | array of strings | No | `[]` | List of hashtags. |
| `first_comment` | string | No | `""` | The comment to post immediately after publishing. |
| `location_id` | string | No | `null` | Platform-specific location ID. |

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
}
payload = {
    "account_ids": ["acc_ig_01", "acc_tk_02"],
    "media_url": "https://s3.amazonaws.com/mybucket/video.mp4",
    "caption": "Check out this amazing new feature! 🔥",
    "hashtags": ["#feature", "#launch", "#tech"],
    "first_comment": "Link in bio!"
}
resp = requests.post("https://apis.fotohub.app/v1/social/publish", headers=headers, json=payload)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/social/publish", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    account_ids: ["acc_ig_01", "acc_tk_02"],
    media_url: "https://s3.amazonaws.com/mybucket/video.mp4",
    caption: "Check out this amazing new feature! 🔥",
    hashtags: ["#feature", "#launch", "#tech"],
    first_comment: "Link in bio!"
  })
});
console.log(await resp.json());
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"account_ids":   []string{"acc_ig_01", "acc_tk_02"},
		"media_url":     "https://s3.amazonaws.com/mybucket/video.mp4",
		"caption":       "Check out this amazing new feature! 🔥",
		"hashtags":      []string{"#feature", "#launch", "#tech"},
		"first_comment": "Link in bio!",
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/social/publish", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	
	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println(string(respBody))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/social/publish \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "account_ids": ["acc_ig_01", "acc_tk_02"],
    "media_url": "https://s3.amazonaws.com/mybucket/video.mp4",
    "caption": "Check out this amazing new feature! 🔥",
    "hashtags": ["#feature", "#launch", "#tech"],
    "first_comment": "Link in bio!"
  }'
```

:::

### 2. Schedule Post

Schedule a post for a future date/time. The time must be provided in ISO 8601 format and must be at least 15 minutes in the future.

```
POST /v1/social/schedule
```

#### Request Parameters

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `account_ids` | array of strings | **Yes** | - | Target account IDs to publish to. |
| `media_url` | string | **Yes** | - | URL of the media (image/video). |
| `caption` | string | No | `""` | The post text or caption. |
| `scheduled_at` | string | **Yes** | - | ISO 8601 timestamp in UTC. |

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
}
payload = {
    "account_ids": ["acc_tw_01"],
    "media_url": "https://s3.amazonaws.com/mybucket/image.png",
    "caption": "Coming next week...",
    "scheduled_at": "2027-10-01T12:00:00Z"
}
resp = requests.post("https://apis.fotohub.app/v1/social/schedule", headers=headers, json=payload)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/social/schedule", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    account_ids: ["acc_tw_01"],
    media_url: "https://s3.amazonaws.com/mybucket/image.png",
    caption: "Coming next week...",
    scheduled_at: "2027-10-01T12:00:00Z"
  })
});
console.log(await resp.json());
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"account_ids":  []string{"acc_tw_01"},
		"media_url":    "https://s3.amazonaws.com/mybucket/image.png",
		"caption":      "Coming next week...",
		"scheduled_at": "2027-10-01T12:00:00Z",
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/social/schedule", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	
	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println(string(respBody))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/social/schedule \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "account_ids": ["acc_tw_01"],
    "media_url": "https://s3.amazonaws.com/mybucket/image.png",
    "caption": "Coming next week...",
    "scheduled_at": "2027-10-01T12:00:00Z"
  }'
```

:::

### 3. List Posts

Retrieve a paginated list of posts.

```
GET /v1/social/posts
```

#### Request Parameters (Query Strings)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `status` | string | No | `all` | Filter by `published`, `scheduled`, `draft`, or `failed`. |
| `limit` | integer | No | `50` | Number of results per page (max 100). |
| `cursor` | string | No | `null` | Pagination cursor. |

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_your_api_key"
}
resp = requests.get("https://apis.fotohub.app/v1/social/posts?status=published&limit=10", headers=headers)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/social/posts?status=published&limit=10", {
  method: "GET",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
  }
});
console.log(await resp.json());
```

```go [Go]
package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/social/posts?status=published&limit=10", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X GET "https://apis.fotohub.app/v1/social/posts?status=published&limit=10" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

### 4. Get Post Details

```
GET /v1/social/posts/{id}
```

Fetches complete metadata and current analytics for a specific post.

### 5. Cancel Scheduled Post

```
DELETE /v1/social/posts/{id}
```

Cancels a post that is currently scheduled. Does not delete it entirely, moves it to `draft`.

### 6. Bulk Publish

Publish the identical payload to multiple platforms concurrently. 

```
POST /v1/social/bulk
```

---

## AI Content Assistance

Our AI models (running on GPU4/5 clusters) assist with creative captioning and hashtag discovery.

### 1. Generate Caption

Generate an optimized caption tailored to the platform.

```
POST /v1/social/captions/generate
```

#### Request Parameters

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `media_url` | string | No | `null` | Vision analysis will be performed if provided. |
| `platform` | string | **Yes** | - | e.g. `instagram`, `linkedin`. |
| `tone` | string | No | `professional` | `funny`, `casual`, `formal`, `viral`. |
| `language` | string | No | `en` | ISO 639-1 code. |
| `include_hashtags` | boolean | No | `true` | Include tags in output. |
| `num_hashtags` | integer | No | `5` | Between 5 and 30. |

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
}
payload = {
    "platform": "instagram",
    "tone": "viral",
    "include_hashtags": True,
    "num_hashtags": 10
}
resp = requests.post("https://apis.fotohub.app/v1/social/captions/generate", headers=headers, json=payload)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/social/captions/generate", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    platform: "instagram",
    tone: "viral",
    include_hashtags: true,
    num_hashtags: 10
  })
});
console.log(await resp.json());
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"platform":         "instagram",
		"tone":             "viral",
		"include_hashtags": true,
		"num_hashtags":     10,
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/social/captions/generate", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	
	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println(string(respBody))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/social/captions/generate \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "tone": "viral",
    "include_hashtags": true,
    "num_hashtags": 10
  }'
```

:::

### 2. Translate Caption

```
POST /v1/social/captions/translate
```

Translates an existing caption to a target language while preserving emojis, hashtags, and formatting.

### 3. Trending Hashtags

```
POST /v1/social/hashtags/trending
```

Fetches regional trending hashtags. Note: This requires active social graph sync.

---

## Analytics

Retrieve deep engagement metrics and account-level summaries.

### 1. Post Analytics

```
GET /v1/social/analytics/{post_id}
```

Returns `views`, `likes`, `shares`, `comments`, `saves`, `reach`, and `impressions`. 

### 2. Account Summary

```
GET /v1/social/analytics/summary?period=30d
```

Valid periods: `7d`, `30d`, `90d`.

---

## Webhooks & Event Handling

Listen for real-time status updates asynchronously. We recommend using a Dead Letter Queue (DLQ) pattern for handling missed deliveries.

### Supported Events
- `post.published`: Successfully pushed to platform.
- `post.failed`: Rejected by platform (usually media format issues).
- `analytics.milestone`: Post reached a specific view milestone.

### Verifying Signatures

Webhooks include an `X-FotoHub-Signature` header representing an HMAC-SHA256 hash of the payload using your Webhook Secret.

::: code-group

```python [Python]
import hmac
import hashlib
from flask import Flask, request, abort

app = Flask(__name__)
WEBHOOK_SECRET = "whsec_..."

@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-FotoHub-Signature')
    payload = request.get_data()
    
    expected_sig = hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        msg=payload,
        digestmod=hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected_sig, signature):
        abort(403)
        
    event = request.json
    print(f"Received event: {event['type']}")
    return '', 200
```

```typescript [TypeScript]
import express from 'express';
import crypto from 'crypto';

const app = express();
const WEBHOOK_SECRET = 'whsec_...';

app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-fotohub-signature'] as string;
  const payload = req.body; // Raw buffer

  const expectedSig = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSig) {
    return res.status(403).send('Invalid signature');
  }

  const event = JSON.parse(payload.toString());
  console.log(`Received event: ${event.type}`);
  res.status(200).send();
});
```

```go [Go]
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
)

func handleWebhook(w http.ResponseWriter, r *http.http.Request) {
	secret := []byte("whsec_...")
	signature := r.Header.Get("X-FotoHub-Signature")
	
	body, _ := io.ReadAll(r.Body)
	
	mac := hmac.New(sha256.New, secret)
	mac.Write(body)
	expectedMAC := hex.EncodeToString(mac.Sum(nil))
	
	if !hmac.Equal([]byte(signature), []byte(expectedMAC)) {
		http.Error(w, "Invalid signature", http.StatusForbidden)
		return
	}
	
	w.WriteHeader(http.StatusOK)
}
```

:::

---

## Content Calendar Automation Script

Below is a brief snippet showing how to use the API for an automated daily calendar population process.

```python
import requests
import datetime

def populate_calendar():
    # 1. Fetch upcoming planned images
    images = ["https://s3.local/img1.jpg", "https://s3.local/img2.jpg"]
    
    for i, img in enumerate(images):
        # 2. Generate Caption
        cap_resp = requests.post(
            "https://apis.fotohub.app/v1/social/captions/generate",
            headers={"Authorization": "Bearer fh_live_your_api_key"},
            json={"media_url": img, "platform": "instagram"}
        ).json()
        
        # 3. Schedule for Tomorrow
        run_date = datetime.datetime.utcnow() + datetime.timedelta(days=i+1)
        requests.post(
            "https://apis.fotohub.app/v1/social/schedule",
            headers={"Authorization": "Bearer fh_live_your_api_key"},
            json={
                "account_ids": ["acc_ig_01"],
                "media_url": img,
                "caption": cap_resp.get("caption", ""),
                "scheduled_at": run_date.isoformat() + "Z"
            }
        )
```

::: tip
In production systems, combine scheduling logic with the `webhook` events to auto-retry failed uploads via DLQ processing.
:::

---

## Detailed Error Codes

When interacting with the Social Studio API, you may encounter the following standardized error responses.

| Code | HTTP Status | Description | Action Required |
|---|---|---|---|
| `ERR_OAUTH_REVOKED` | 401 | The user revoked access on the target platform. | Prompt the user to reconnect the account. |
| `ERR_MEDIA_UNSUPPORTED` | 400 | The media format or codec is not supported by the platform. | Transcode the media using the FotoHUB Media API first. |
| `ERR_FILE_TOO_LARGE` | 400 | The media file exceeds the maximum allowed size. | Compress the media file. |
| `ERR_RATE_LIMIT_EXCEEDED` | 429 | The workspace or account has exceeded its publishing limits. | Implement backoff/retries as indicated by headers. |
| `ERR_CAPTION_TOO_LONG` | 400 | Caption exceeds platform limits. | Use the AI caption generator to shorten text. |
| `ERR_INVALID_SCHEDULE` | 400 | `scheduled_at` is in the past or less than 15 minutes away. | Adjust the scheduled time. |
| `ERR_PLATFORM_DOWN` | 502 | The upstream social platform API is unresponsive. | The system will auto-retry via DLQ. |

---

## Retries & Dead Letter Queue (DLQ)

The FotoHUB Publishing Engine employs an internal DLQ for transient errors (`5xx` from upstream platforms, network timeouts).

### Retry Policy
1. **Initial attempt:** Immediate upon schedule or manual trigger.
2. **First retry:** +5 minutes.
3. **Second retry:** +15 minutes.
4. **Third retry:** +1 hour.
5. **Final status:** If the third retry fails, the post status is set to `failed` and a `post.failed` webhook is dispatched.

::: tip
You do not need to implement manual retries for HTTP 502 or 503 errors from our API. The system will handle these natively. However, you MUST handle 429 Too Many Requests locally.
:::

---

## Advanced: Bring Your Own Bucket (BYOB)

For enterprise users, FotoHUB supports exporting transcoded media and analytics reports directly to your own AWS S3 or Cloudflare R2 bucket.

### 1. Configure S3 Export

```
POST /v1/social/config/export
```

#### Request Parameters

| Field | Type | Required | Description |
|---|---|---|---|
| `provider` | string | **Yes** | `aws` or `r2`. |
| `bucket_name` | string | **Yes** | Destination bucket name. |
| `region` | string | **Yes** | Bucket region (e.g., `us-east-1`). |
| `access_key` | string | **Yes** | IAM access key. |
| `secret_key` | string | **Yes** | IAM secret key. |

::: code-group

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/social/config/export \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "aws",
    "bucket_name": "my-enterprise-bucket",
    "region": "us-east-1",
    "access_key": "AKIA...",
    "secret_key": "..."
  }'
```

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
}
payload = {
    "provider": "aws",
    "bucket_name": "my-enterprise-bucket",
    "region": "us-east-1",
    "access_key": "AKIA...",
    "secret_key": "..."
}
requests.post("https://apis.fotohub.app/v1/social/config/export", headers=headers, json=payload)
```

```typescript [TypeScript]
fetch("https://apis.fotohub.app/v1/social/config/export", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    provider: "aws",
    bucket_name: "my-enterprise-bucket",
    region: "us-east-1",
    access_key: "AKIA...",
    secret_key: "..."
  })
});
```

```go [Go]
// Equivalent Go implementation omitted for brevity
```
:::

Once configured, FotoHUB will automatically sync post media and daily JSON analytics summaries to your bucket at 00:00 UTC.


---

## Hardware Acceleration (GPU Affinity)

FotoHUB uses a dedicated GPU cluster to accelerate heavy tasks related to social media content generation and preparation. When jobs are submitted to the API, they are routed to specific nodes based on GPU affinity:

- **GPU2 (MMAudio):** Handles advanced audio extraction and normalization, ensuring speech is audible on mobile devices.
- **GPU3 (MuseTalk/LipSync):** Syncs generated avatars with uploaded voiceovers.
- **GPU4 / GPU5 (3D):** Processes volumetric captures and 3D overlays before rendering them out as 2D MP4 files for Instagram/TikTok.

This dedicated hardware isolation guarantees that your multi-platform bulk publishing jobs won't be delayed by intensive AI training workloads running elsewhere on the network.

