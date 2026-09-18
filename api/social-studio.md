# FotoHUB Social Studio API

FotoHUB Social Studio (`/social/v1`) provides multi-platform social media publishing, scheduling, calendar management, and AI content assistance across Facebook, Instagram, LinkedIn, Twitter/X, and TikTok.

Base URL: `https://apis.fotohub.app/social/v1`

::: tip
All API requests must be authenticated using your live API key. Test keys cannot interact with live social platform endpoints.
:::

---

## System Architecture

The FotoHUB Social Studio engine relies on a unified event bus to handle synchronous and asynchronous multi-platform social actions, including media transcoding and DLQ handling.

```mermaid
flowchart TD
    Client["Client App"] --> API["Social Studio API (social/v1)"]
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
GET /social/v1/accounts
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
resp = requests.get("https://apis.fotohub.app/social/v1/accounts", headers=headers)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/social/v1/accounts", {
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
	req, _ := http.NewRequest("GET", "https://apis.fotohub.app/social/v1/accounts", nil)
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
curl -X GET https://apis.fotohub.app/social/v1/accounts \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json"
```

:::

### 2. Connect Account

Initiates the OAuth 2.0 flow for a specified platform.

```
POST /social/v1/accounts/connect/{platform}
```

#### Path Parameters

| Field | Type | Required | Description |
|---|---|---|---|
| `platform` | string | **Yes** | Options: `instagram`, `tiktok`, `facebook`, `linkedin`, `twitter` |

#### Request Body

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `redirect_uri` | string | No | account default | URL to redirect users back to after authorization. |
| `account_type` | string | No | - | `page`, `profile`, or `business`. |
| `scopes` | array of strings | No | - | Additional OAuth scopes to request. |

This returns an `oauth_url` to redirect the user to, plus a `state` token to verify on callback — it does not connect the account synchronously.

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
}
payload = {
    "redirect_uri": "https://myapp.com/callbacks/social"
}
resp = requests.post("https://apis.fotohub.app/social/v1/accounts/connect/tiktok", headers=headers, json=payload)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/social/v1/accounts/connect/tiktok", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
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
		"redirect_uri": "https://myapp.com/callbacks/social",
	}
	jsonValue, _ := json.Marshal(payload)
	
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/social/v1/accounts/connect/tiktok", bytes.NewBuffer(jsonValue))
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
curl -X POST https://apis.fotohub.app/social/v1/accounts/connect/tiktok \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"redirect_uri":"https://myapp.com/callbacks/social"}'
```

:::

### 3. Disconnect Account

Revokes the OAuth token and removes the account from your workspace.

```
DELETE /social/v1/accounts/{account_id}
```

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_your_api_key"
}
resp = requests.delete("https://apis.fotohub.app/social/v1/accounts/acc_12345", headers=headers)
print(resp.status_code)
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/social/v1/accounts/acc_12345", {
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
	req, _ := http.NewRequest("DELETE", "https://apis.fotohub.app/social/v1/accounts/acc_12345", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	
	fmt.Println(resp.StatusCode)
}
```

```bash [cURL]
curl -X DELETE https://apis.fotohub.app/social/v1/accounts/acc_12345 \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

---

## Publishing Engine

There is no single "publish now" call. You create a post resource, then either
publish it immediately or let it auto-publish at a `scheduled_at` time.

### 1. Publish Immediately

Create a post, then trigger a publish on it.

```
POST /social/v1/posts
POST /social/v1/posts/{post_id}/publish
```

#### Request Parameters — `POST /social/v1/posts`

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `account_ids` | array of strings | No | `[]` | Target account IDs to publish to. |
| `media_urls` | array of strings | No | `[]` | URLs of the media (image/video) to publish. |
| `text` | string | No | `""` | The post text or caption. |
| `hashtags` | array of strings | No | `[]` | List of hashtags. |
| `first_comment` | string | No | `""` | The comment to post immediately after publishing. |
| `post_type` | string | No | `post` | `post`, `story`, `reel`, `carousel`, `thread`, `poll`. |

Omit `scheduled_at` to create it as a `draft`, then call `.../publish` (optionally
with a `target_accounts` override) to push it live.

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
}
payload = {
    "account_ids": ["acc_ig_01", "acc_tk_02"],
    "media_urls": ["https://s3.amazonaws.com/mybucket/video.mp4"],
    "text": "Check out this amazing new feature! 🔥",
    "hashtags": ["#feature", "#launch", "#tech"],
    "first_comment": "Link in bio!"
}
post = requests.post("https://apis.fotohub.app/social/v1/posts", headers=headers, json=payload).json()
resp = requests.post(f"https://apis.fotohub.app/social/v1/posts/{post['id']}/publish", headers=headers, json={})
print(resp.json())
```

```typescript [TypeScript]
const headers = {
  "Authorization": "Bearer fh_live_your_api_key",
  "Content-Type": "application/json",
};
const post = await (await fetch("https://apis.fotohub.app/social/v1/posts", {
  method: "POST",
  headers,
  body: JSON.stringify({
    account_ids: ["acc_ig_01", "acc_tk_02"],
    media_urls: ["https://s3.amazonaws.com/mybucket/video.mp4"],
    text: "Check out this amazing new feature! 🔥",
    hashtags: ["#feature", "#launch", "#tech"],
    first_comment: "Link in bio!"
  })
})).json();

const resp = await fetch(`https://apis.fotohub.app/social/v1/posts/${post.id}/publish`, {
  method: "POST",
  headers,
  body: JSON.stringify({})
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
		"media_urls":    []string{"https://s3.amazonaws.com/mybucket/video.mp4"},
		"text":          "Check out this amazing new feature! 🔥",
		"hashtags":      []string{"#feature", "#launch", "#tech"},
		"first_comment": "Link in bio!",
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/social/v1/posts", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println(string(respBody))
	// Then POST https://apis.fotohub.app/social/v1/posts/{post_id}/publish with an empty body.
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/social/v1/posts \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "account_ids": ["acc_ig_01", "acc_tk_02"],
    "media_urls": ["https://s3.amazonaws.com/mybucket/video.mp4"],
    "text": "Check out this amazing new feature! 🔥",
    "hashtags": ["#feature", "#launch", "#tech"],
    "first_comment": "Link in bio!"
  }'
# then, with the returned post id:
curl -X POST https://apis.fotohub.app/social/v1/posts/post_abc123/publish \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

:::

### 2. Schedule Post

Same endpoint as creating a post — pass `scheduled_at` and the post is stored with
status `scheduled` and published automatically at that time. No separate call is
needed.

```
POST /social/v1/posts
```

#### Request Parameters

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `account_ids` | array of strings | No | `[]` | Target account IDs to publish to. |
| `media_urls` | array of strings | No | `[]` | URLs of the media (image/video). |
| `text` | string | No | `""` | The post text or caption. |
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
    "media_urls": ["https://s3.amazonaws.com/mybucket/image.png"],
    "text": "Coming next week...",
    "scheduled_at": "2027-10-01T12:00:00Z"
}
resp = requests.post("https://apis.fotohub.app/social/v1/posts", headers=headers, json=payload)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/social/v1/posts", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    account_ids: ["acc_tw_01"],
    media_urls: ["https://s3.amazonaws.com/mybucket/image.png"],
    text: "Coming next week...",
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
		"media_urls":   []string{"https://s3.amazonaws.com/mybucket/image.png"},
		"text":         "Coming next week...",
		"scheduled_at": "2027-10-01T12:00:00Z",
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/social/v1/posts", bytes.NewReader(body))
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
curl -X POST https://apis.fotohub.app/social/v1/posts \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "account_ids": ["acc_tw_01"],
    "media_urls": ["https://s3.amazonaws.com/mybucket/image.png"],
    "text": "Coming next week...",
    "scheduled_at": "2027-10-01T12:00:00Z"
  }'
```

:::

### 3. List Posts

Retrieve a paginated list of posts.

```
GET /social/v1/posts
```

#### Request Parameters (Query Strings)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `status` | string | No | - | Filter by `draft`, `scheduled`, `publishing`, `published`, or `failed`. |
| `platform` | string | No | - | Filter by platform. |
| `limit` | integer | No | `50` | Number of results per page (max 200). |
| `offset` | integer | No | `0` | Pagination offset. |

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_your_api_key"
}
resp = requests.get("https://apis.fotohub.app/social/v1/posts?status=published&limit=10", headers=headers)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/social/v1/posts?status=published&limit=10", {
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
	req, _ := http.NewRequest("GET", "https://apis.fotohub.app/social/v1/posts?status=published&limit=10", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X GET "https://apis.fotohub.app/social/v1/posts?status=published&limit=10" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

### 4. Get Post Details

```
GET /social/v1/posts/{post_id}
```

Fetches the post plus a `results` array with per-platform publish outcomes (used
for per-post analytics — there is no separate analytics-by-post-id endpoint).

### 5. Delete Post

```
DELETE /social/v1/posts/{post_id}
```

Permanently deletes the post and its publish results. This is a hard delete, not
a move to `draft` — cancel a scheduled post by `PATCH`-ing its `status` instead if
you want to keep the record.

### 6. Bulk Import Posts

Create up to `MAX_POSTS_PER_IMPORT` posts in one call — each entry can carry its
own text, media, target accounts and `scheduled_at`. This is for importing a batch
of *different* posts (e.g. a content calendar), not for fanning one payload out to
several platforms — a single `POST /social/v1/posts` call already publishes to every
account listed in `account_ids`.

```
POST /social/v1/posts/bulk-import
```

---

## AI Content Assistance

Our AI models (running on GPU4/5 clusters) assist with creative captioning and hashtag discovery.

### 1. Generate Caption

Generate an optimized caption tailored to the platform.

```
POST /social/v1/ai/generate-caption
```

#### Request Parameters

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `platform` | string | **Yes** | - | e.g. `instagram`, `linkedin`, `facebook`, `twitter`, `tiktok`. |
| `topic` | string | No | - | What the post is about. |
| `context` | string | No | - | Additional context about the post. |
| `tone` | string | No | `professional` | `professional`, `casual`, `humorous`, `inspirational`, `educational`. |
| `language` | string | No | `en` | ISO 639-1 code. |
| `include_emojis` | boolean | No | `true` | Include emojis in output. |
| `include_cta` | boolean | No | `false` | Include a call-to-action. |
| `count` | integer | No | `3` | Number of caption variants to generate (1-10). |

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
}
payload = {
    "platform": "instagram",
    "topic": "our new feature launch",
    "tone": "casual",
    "include_emojis": True,
    "count": 3
}
resp = requests.post("https://apis.fotohub.app/social/v1/ai/generate-caption", headers=headers, json=payload)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/social/v1/ai/generate-caption", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    platform: "instagram",
    topic: "our new feature launch",
    tone: "casual",
    include_emojis: true,
    count: 3
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
		"platform":       "instagram",
		"topic":          "our new feature launch",
		"tone":           "casual",
		"include_emojis": true,
		"count":          3,
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/social/v1/ai/generate-caption", bytes.NewReader(body))
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
curl -X POST https://apis.fotohub.app/social/v1/ai/generate-caption \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "topic": "our new feature launch",
    "tone": "casual",
    "include_emojis": true,
    "count": 3
  }'
```

:::

### 2. Translate Caption

There is no social-specific caption translator. Use FOTOhub's general-purpose
translation endpoint instead; it does not make platform-specific guarantees about
preserving hashtag/emoji placement, so review the output before posting.

```
POST /v1/ai/translate
```

### 3. Trending / Suggested Hashtags

```
POST /social/v1/ai/suggest-hashtags
```

#### Request Parameters

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `content` | string | **Yes** | - | The post text to suggest hashtags for. |
| `platform` | string | No | `instagram` | Platform to optimize hashtags for. |
| `count` | integer | No | `15` | Number of hashtags to return (1-30). |
| `include_trending` | boolean | No | `true` | Include currently-trending tags. |
| `include_niche` | boolean | No | `true` | Include smaller, niche-audience tags. |
| `language` | string | No | `en` | ISO 639-1 code. |

::: code-group

```bash [cURL]
curl -X POST https://apis.fotohub.app/social/v1/ai/suggest-hashtags \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Launching our new feature today!",
    "platform": "instagram",
    "include_trending": true
  }'
```

:::

---

## Analytics

Retrieve deep engagement metrics and account-level summaries.

### 1. Post Analytics

There is no analytics-by-post-id endpoint. Per-post results come back inline on
`GET /social/v1/posts/{post_id}` (its `results` array), or in bulk, sortable by
engagement, via:

```
GET /social/v1/analytics/posts
```

Query params: `account_id`, `date_from`, `date_to`, `sort_by`
(`engagement_rate`, `impressions`, `reach`, `likes`), `limit`, `offset`.

### 2. Account Summary

```
GET /social/v1/analytics/overview
```

Query params: `account_ids` (comma-separated), `date_from`, `date_to`. Returns
aggregate followers, reach, impressions, engagement and per-account breakdowns —
there is no `period=7d/30d/90d` shorthand; pass explicit `date_from`/`date_to`.

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
            "https://apis.fotohub.app/social/v1/ai/generate-caption",
            headers={"Authorization": "Bearer fh_live_your_api_key"},
            json={"platform": "instagram", "topic": "daily photo drop"}
        ).json()
        
        # 3. Schedule for Tomorrow
        run_date = datetime.datetime.utcnow() + datetime.timedelta(days=i+1)
        requests.post(
            "https://apis.fotohub.app/social/v1/posts",
            headers={"Authorization": "Bearer fh_live_your_api_key"},
            json={
                "account_ids": ["acc_ig_01"],
                "media_urls": [img],
                "text": (cap_resp.get("captions") or [""])[0],
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

## Advanced: Exporting Analytics Data

::: warning Not a bucket-sync feature
There is no "Bring Your Own Bucket" capability — Social Studio does not accept
AWS/R2 IAM credentials and does not push data to a customer-owned bucket on a
schedule. What exists is an on-demand analytics export you pull yourself.
:::

### 1. Export Analytics

```
GET /social/v1/analytics/export
```

#### Query Parameters

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `format` | string | No | `csv` | `csv` or `json`. |
| `account_ids` | string | No | - | Comma-separated account IDs to filter by. |
| `date_from` | string | No | - | ISO date, inclusive lower bound. |
| `date_to` | string | No | - | ISO date, inclusive upper bound. |

::: code-group

```bash [cURL]
curl -X GET "https://apis.fotohub.app/social/v1/analytics/export?format=json&date_from=2027-09-01" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

```python [Python]
import requests

headers = {"Authorization": "Bearer fh_live_your_api_key"}
resp = requests.get(
    "https://apis.fotohub.app/social/v1/analytics/export",
    headers=headers,
    params={"format": "json", "date_from": "2027-09-01"},
)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/social/v1/analytics/export?format=json&date_from=2027-09-01", {
  headers: { "Authorization": "Bearer fh_live_your_api_key" }
});
console.log(await resp.json());
```

:::

The response is the raw CSV/JSON payload, returned directly in the API response — not delivered to a bucket you configure.


---

## Hardware Acceleration (GPU Affinity)

FotoHUB uses a dedicated GPU cluster to accelerate heavy tasks related to social media content generation and preparation. When jobs are submitted to the API, they are routed to specific nodes based on GPU affinity:

- **GPU2 (MMAudio):** Handles advanced audio extraction and normalization, ensuring speech is audible on mobile devices.
- **GPU3 (MuseTalk/LipSync):** Syncs generated avatars with uploaded voiceovers.
- **GPU4 / GPU5 (3D):** Processes volumetric captures and 3D overlays before rendering them out as 2D MP4 files for Instagram/TikTok.

This dedicated hardware isolation guarantees that your multi-platform bulk publishing jobs won't be delayed by intensive AI training workloads running elsewhere on the network.

