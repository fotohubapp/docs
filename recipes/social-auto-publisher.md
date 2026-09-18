# Automated Social Studio & Multi-Platform Publisher

Turn raw creative video and image assets into high-converting, platform-tailored social campaigns automatically scheduled, published, and tracked across TikTok, Instagram Reels, YouTube Shorts, LinkedIn, and X (Twitter).

Powered by FOTOhub's **Social Studio** (`server/social-engine/`), this recipe links vision analysis, LLM copywriting, multi-account OAuth dispatch, automated first-comment hashtag strategies, and post-publish performance analytics into a single autonomous pipeline.

::: tip Why Automate?
Manual social media publishing is slow and prone to errors. Using FOTOhub's robust Social Studio API allows you to build an internal content calendar that adapts aspect ratios, injects trending hashtags, and optimally schedules your content while keeping track of analytics—all via API.
:::

---

## 1. Architectural Workflow

```mermaid
flowchart TD
    subgraph Ingestion
        A["Raw Media Asset Ingestion (S3 / Video to Shorts / Virtual Try-On)"] 
    end
    
    subgraph AI Analysis
        A --> B["Vision & Context Analysis (/social/v1/ai/analyze-image)"]
        B --> C["Platform-Specific Copywriting Engine (/social/v1/ai/generate-caption)"]
    end
    
    subgraph Adaptation
        C --> D1["TikTok Variant (Fast Hook, Sound Tags, Trends)"]
        C --> D2["IG Reels Variant (Aesthetic Luxury, First-Comment Cloud)"]
        C --> D3["YouTube Shorts Variant (SEO Keywords, CTR Title)"]
        C --> D4["X / Twitter Variant (Punchy 280-char Thread Hook)"]
        C --> D5["LinkedIn Variant (Professional, Case Study Format)"]
    end
    
    subgraph Scheduling
        D1 & D2 & D3 & D4 & D5 --> E["Optimal Publishing Window Calculator (/social/v1/ai/optimal-time)"]
        E --> F["Create + Schedule Post (POST /social/v1/posts, with scheduled_at)"]
    end
    
    subgraph Execution
        F --> G["FotoHUB Background Scheduler Engine (APScheduler / Celery)"]
        G --> H["OAuth Publication Dispatch (TikTok, Meta Graph, YT Data, X API)"]
    end
    
    subgraph Post-Execution
        H --> I["Signed Webhook Broadcast (social.post.published / X-FotoHub-Signature)"]
        I --> J["Automated First-Comment Engagement Injection"]
        H --> K["Post Performance Sync (/social/v1/posts/{post_id} results, /social/v1/analytics/posts)"]
    end
```

::: info Not modelled above
There is no pre-flight content-moderation endpoint and no dedicated media-resize
endpoint on Social Studio — see the notes in sections 5 and 6 below. There is also
no BYOB S3/R2 auto-archive of published content; see section 15.
:::

::: info GPU Affinity
Under the hood, FOTOhub routes different operations to specialized GPU clusters:
- **GPU2**: MMAudio generation (if background music is added)
- **GPU3**: MuseTalk/LipSync (if a digital avatar is talking)
- **GPU4/5**: 3D Generation and high-end video encoding
:::

---

## 2. Platform-Specific Constraints

Each platform has strict constraints. The API automatically returns validation errors if these limits are breached.

| Platform | Max Video Duration | Aspect Ratio | Max File Size | Caption Length |
|---|---|---|---|---|
| TikTok | 10 min | 9:16 | 1 GB | 2,200 chars |
| Instagram Reels | 15 min | 9:16 | 1 GB | 2,200 chars |
| YouTube Shorts | 60 sec | 9:16 | 256 MB | 5,000 chars |
| LinkedIn | 10 min | 16:9 / 1:1 | 5 GB | 3,000 chars |
| Twitter/X | 2:20 min | any | 512 MB | 280 chars |

---

## 3. Production Economics & USD Billing

Social Studio operations are billed directly against your prepaid USD wallet at exact pass-through rates. **Pure USD billing only**.

| Operation | Cost (USD) | Description |
|:---|:---|:---|
| Caption generation with hashtags | $0.003 | AI text generation optimized per platform with hashtags |
| Single platform publish | $0.001 | Dispatched to one social network |
| Multi-platform bulk publish | $0.004 | Dispatched to up to 5 platforms at once |
| Analytics fetch | Free | Retrieve up-to-date engagement metrics |
| Optimal Time Analysis | $0.001 | Calculate best time to post |
| Multi-platform format adaptation | $0.020 | Auto-resize video for 9:16 / 1:1 / 16:9 |
| Content Moderation Pre-flight | $0.002 | Vision analysis to detect unsafe/violating content |

---

## 4. OAuth Account Connection Flow

To publish, you must first connect social accounts via OAuth. 

### `POST /social/v1/accounts/connect/{platform}`

Generates an OAuth connection link to redirect your users to. `platform` is a
path segment, not a body field.

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `platform` (path) | string | **Yes** | — | `"tiktok"`, `"instagram"`, `"youtube"`, `"twitter"`, `"linkedin"` |
| `redirect_uri` | string | No | account default | The URI FOTOhub will redirect back to after auth |
| `scopes` | string[] | No | — | Specific permissions required |

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/social/v1/accounts/connect/tiktok"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
data = {
    "redirect_uri": "https://your-app.com/callback/tiktok"
}
response = requests.post(url, headers=headers, json=data)
print(response.json())
```

```typescript [TypeScript]
import axios from 'axios';

async function connectAccount() {
  const response = await axios.post('https://apis.fotohub.app/social/v1/accounts/connect/tiktok', {
    redirect_uri: 'https://your-app.com/callback/tiktok'
  }, {
    headers: {
      'Authorization': 'Bearer fh_live_your_api_key'
    }
  });
  console.log(response.data);
}
```

```go [Go]
package main

import (
	"bytes"
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {
	url := "https://apis.fotohub.app/social/v1/accounts/connect/tiktok"
	payload := []byte(`{"redirect_uri":"https://your-app.com/callback/tiktok"}`)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{}
	resp, _ := client.Do(req)
	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/social/v1/accounts/connect/tiktok \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "redirect_uri": "https://your-app.com/callback/tiktok"
  }'
```

:::

### `GET /social/v1/accounts`

List all connected accounts. Takes no filter query parameters.

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/social/v1/accounts"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
}
response = requests.get(url, headers=headers)
print(response.json())
```

```typescript [TypeScript]
import axios from 'axios';

async function listAccounts() {
  const response = await axios.get('https://apis.fotohub.app/social/v1/accounts', {
    headers: {
      'Authorization': 'Bearer fh_live_your_api_key'
    }
  });
  console.log(response.data);
}
```

```go [Go]
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {
	url := "https://apis.fotohub.app/social/v1/accounts"
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	
	client := &http.Client{}
	resp, _ := client.Do(req)
	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/social/v1/accounts \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

---

## 5. Content Moderation Pre-Flight

::: warning No content-moderation endpoint exists
There is no `/social/moderate` (or equivalent) call on Social Studio, or
anywhere else in the public surface. There is no automated pre-flight
compliance check before scheduling — review content yourself before publishing.
:::

---

## 6. Multi-Platform Format Adaptation

::: warning No media-resize endpoint exists
FOTOhub does not offer a video pad/crop/resize call on the Social Studio (or any
other public) surface — the only `resize` in the public API is
`POST /compute/instances/{instance_id}/resize`, which resizes a compute instance
and has nothing to do with media. Prepare each aspect ratio (9:16 / 1:1 / 16:9)
of your asset yourself before uploading.
:::

---

## 7. Caption Generation & Hashtag Optimization

Generate customized captions per platform based on a single topic.

### `POST /social/v1/ai/generate-caption`

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `platform` | string | **Yes** | — | Target platform |
| `topic` | string | No | — | Subject matter |
| `tone` | string | No | `professional` | `professional`, `casual`, `humorous`, `inspirational`, `educational` |
| `include_emojis` | boolean | No | `true` | Include emojis |
| `count` | integer | No | `3` | Number of caption variants to generate (1-10) |

Hashtags are a separate call — see `POST /social/v1/ai/suggest-hashtags`.

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/social/v1/ai/generate-caption"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
data = {
    "topic": "AI virtual try-on technology demo",
    "platform": "instagram",
    "tone": "inspirational",
    "include_emojis": True,
    "count": 3
}
response = requests.post(url, headers=headers, json=data)
print(response.json())
```

```typescript [TypeScript]
import axios from 'axios';

async function generateCaption() {
  const response = await axios.post('https://apis.fotohub.app/social/v1/ai/generate-caption', {
    topic: 'AI virtual try-on technology demo',
    platform: 'instagram',
    tone: 'inspirational',
    include_emojis: true,
    count: 3
  }, {
    headers: {
      'Authorization': 'Bearer fh_live_your_api_key'
    }
  });
  console.log(response.data);
}
```

```go [Go]
package main

import (
	"bytes"
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {
	url := "https://apis.fotohub.app/social/v1/ai/generate-caption"
	payload := []byte(`{"topic":"AI virtual try-on technology demo","platform":"instagram","tone":"inspirational","include_emojis":true,"count":3}`)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{}
	resp, _ := client.Do(req)
	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/social/v1/ai/generate-caption \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AI virtual try-on technology demo",
    "platform": "instagram",
    "tone": "inspirational",
    "include_emojis": true,
    "count": 3
  }'
```

:::

---

## 8. Publishing & Scheduling

Schedule or instantly publish to multiple platforms.

### `POST /social/v1/posts`

There is no separate `/schedule` or `/publish` endpoint at this stage — creating
a post with `scheduled_at` set is what schedules it (status becomes `scheduled`
and it auto-publishes at that time). To publish immediately instead, create the
post without `scheduled_at`, then call `POST /social/v1/posts/{post_id}/publish`.

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `media_urls` | string[] | No | `[]` | The video/image URL(s) |
| `account_ids` | string[] | No | `[]` | Array of account IDs |
| `scheduled_at` | string | No | — | ISO8601 UTC time for scheduling |
| `variants` | object[] | No | — | Platform-specific overrides |

#### Variant Object

| Field | Type | Description |
|---|---|---|
| `platform` | string | `tiktok`, `instagram`, etc. |
| `text` | string | Caption text override |

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/social/v1/posts"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
data = {
    "media_urls": ["https://static.fotohub.app/demo/vid.mp4"],
    "account_ids": ["acc_123", "acc_456"],
    "scheduled_at": "2026-10-10T12:00:00Z",
    "variants": [
        {"platform": "tiktok", "text": "Check this out!"},
        {"platform": "instagram", "text": "Aesthetic vibe."}
    ]
}
response = requests.post(url, headers=headers, json=data)
print(response.json())
```

```typescript [TypeScript]
import axios from 'axios';

async function schedulePost() {
  const response = await axios.post('https://apis.fotohub.app/social/v1/posts', {
    media_urls: ['https://static.fotohub.app/demo/vid.mp4'],
    account_ids: ['acc_123', 'acc_456'],
    scheduled_at: '2026-10-10T12:00:00Z',
    variants: [
      {platform: 'tiktok', text: 'Check this out!'},
      {platform: 'instagram', text: 'Aesthetic vibe.'}
    ]
  }, {
    headers: {
      'Authorization': 'Bearer fh_live_your_api_key'
    }
  });
  console.log(response.data);
}
```

```go [Go]
package main

import (
	"bytes"
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {
	url := "https://apis.fotohub.app/social/v1/posts"
	payload := []byte(`{"media_urls":["https://static.fotohub.app/demo/vid.mp4"],"account_ids":["acc_123"],"scheduled_at":"2026-10-10T12:00:00Z","variants":[{"platform":"tiktok","text":"Wow!"}]}`)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{}
	resp, _ := client.Do(req)
	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/social/v1/posts \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "media_urls": ["https://static.fotohub.app/demo/vid.mp4"],
    "account_ids": ["acc_123"],
    "scheduled_at": "2026-10-10T12:00:00Z",
    "variants": [{"platform": "tiktok", "text": "Wow!"}]
  }'
```

:::

---

## 9. Bulk-Importing a Content Calendar

If you are populating a large content calendar (e.g., 20+ posts at once), import
them all in one call — each entry can carry its own media, targets and
`scheduled_at`. This is not "publish one payload to many platforms" (a single
`POST /social/v1/posts` call already does that via `account_ids`); it's for
importing many *different* posts at once.

### `POST /social/v1/posts/bulk-import`

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `posts` | object[] | **Yes** | — | Array of post data objects (`text`, `target_accounts`, `scheduled_at`, `hashtags`, `media`, ...) |
| `default_accounts` | string[] | No | — | Fallback target accounts for entries that don't specify their own |
| `default_status` | string | No | `draft` | `draft` or `scheduled` |

---

## 10. Engagement Analytics

Fetch post analytics after publication. There is no `/analytics/{post_id}`
endpoint — per-post results come back inline on the post resource itself.

### `GET /social/v1/posts/{post_id}`

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/social/v1/posts/post_123"
headers = {
    "Authorization": "Bearer fh_live_your_api_key"
}
response = requests.get(url, headers=headers)
print(response.json()["results"])  # per-platform publish/engagement outcomes
```

```typescript [TypeScript]
import axios from 'axios';

async function getAnalytics() {
  const response = await axios.get('https://apis.fotohub.app/social/v1/posts/post_123', {
    headers: {
      'Authorization': 'Bearer fh_live_your_api_key'
    }
  });
  console.log(response.data.results);
}
```

```go [Go]
package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {
	url := "https://apis.fotohub.app/social/v1/posts/post_123"
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	
	client := &http.Client{}
	resp, _ := client.Do(req)
	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/social/v1/posts/post_123 \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

For cross-post analytics sortable by engagement, use
`GET /social/v1/analytics/posts` (query params: `account_id`, `date_from`,
`date_to`, `sort_by`, `limit`, `offset`).

---

## 11. Webhooks & HMAC Verification

When async jobs complete, we POST to your webhook endpoint.

### Payload Examples

**Publish Success:**
```json
{
  "event": "social.post.published",
  "timestamp": "2026-09-12T18:00:04Z",
  "post_id": "post_123",
  "results": [
    {
      "platform": "tiktok",
      "success": true,
      "platform_post_id": "71982348719238",
      "url": "https://www.tiktok.com/@fotohubapp/video/71982348719238"
    }
  ]
}
```

**Publish Failed:**
```json
{
  "event": "social.post.failed",
  "timestamp": "2026-09-12T18:00:04Z",
  "post_id": "post_123",
  "error": {
    "code": "account_suspended",
    "message": "The TikTok account is suspended and cannot post."
  }
}
```

### TypeScript Express Webhook Receiver

```typescript [TypeScript]
import express from 'express';
import crypto from 'crypto';

const app = express();
const WEBHOOK_SECRET = process.env.FOTOHUB_WEBHOOK_SECRET!;

// Use raw body for HMAC validation
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-fotohub-signature'] as string;
  
  const hash = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (hash !== signature) {
    return res.status(401).send('Invalid signature');
  }

  const payload = JSON.parse(req.body.toString());
  console.log('Received event:', payload.event);

  if (payload.event === 'social.post.published') {
    console.log('Post published to:', payload.results);
  }

  res.status(200).send('OK');
});

app.listen(3000, () => console.log('Webhook receiver running on port 3000'));
```

### Python Webhook Receiver (FastAPI)

```python [Python]
from fastapi import FastAPI, Request, Header, HTTPException
import hmac
import hashlib
import os

app = FastAPI()
WEBHOOK_SECRET = os.getenv("FOTOHUB_WEBHOOK_SECRET", "").encode()

@app.post("/webhook")
async def webhook(request: Request, x_fotohub_signature: str = Header(None)):
    body = await request.body()
    
    computed_sig = hmac.new(WEBHOOK_SECRET, body, hashlib.sha256).hexdigest()
    
    if not hmac.compare_digest(computed_sig, x_fotohub_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
        
    payload = await request.json()
    print(f"Received event: {payload['event']}")
    
    return {"status": "ok"}
```

---

## 12. Advanced: Python Asyncio Batch Publisher

For heavy workloads (20+ posts/week), use asyncio.

```python
import asyncio
import aiohttp
import os

API_KEY = os.getenv("FOTOHUB_API_KEY")
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

async def schedule_single(session, url, data):
    async with session.post(url, json=data) as resp:
        return await resp.json()

async def batch_schedule(posts):
    url = "https://apis.fotohub.app/social/v1/posts"
    async with aiohttp.ClientSession(headers=HEADERS) as session:
        tasks = [schedule_single(session, url, post) for post in posts]
        results = await asyncio.gather(*tasks)
        return results

# Usage
# posts = [{"media_urls": ["..."], "account_ids": ["..."], "scheduled_at": "..."}, ...]
# results = asyncio.run(batch_schedule(posts))
```

For a real bulk import of many *different* posts in one call, prefer
`POST /social/v1/posts/bulk-import` (section 9) over N concurrent requests.

---

## 13. A/B Caption Testing

Publish the same video with two caption variants sequentially to measure performance.
1. Post Variant A today at 5 PM.
2. Delete or leave the post after 24h (there is no separate "archive" state — see section 4's post lifecycle).
3. Post Variant B tomorrow at 5 PM.
4. Compare their results via `GET /social/v1/posts/{post_id}` or `GET /social/v1/analytics/posts`.

---

## 14. Rate Limit Handling & Retries

Platform specific rate limits:
- TikTok: 200/day
- Instagram: 25/hour
- LinkedIn: 100/day

If FOTOhub receives a rate limit, the API returns HTTP 429. Implement exponential backoff or use our background scheduler.

::: warning No DLQ / replay endpoint
There is no dead-letter queue and no `/social/dlq` (or equivalent) to poll or
replay. A failed publish attempt lands in the post's `results`/`status` — inspect
`GET /social/v1/posts/{post_id}` and re-submit yourself if you want a retry.
:::

---

## 15. BYOB (Bring Your Own Bucket) S3/R2 Export

::: warning Not a real capability
Social Studio does not accept AWS/R2 credentials and does not auto-archive
published content or metadata to a customer-owned bucket. The closest real thing
is pulling your own analytics on demand via `GET /social/v1/analytics/export`
(`format=csv` or `json`), which returns the data directly in the response.
:::

---

## 16. Error Codes

| Code | HTTP Status | Description | Solution |
|---|---|---|---|
| `account_suspended` | 400 | Social account is blocked. | Resolve block on platform. |
| `invalid_token` | 401 | FOTOhub API Key is invalid. | Check API key. |
| `oauth_expired` | 403 | Platform OAuth token expired. | Re-connect via `/social/v1/accounts/connect/{platform}`. |
| `rate_limit_exceeded` | 429 | Exceeded platform limits. | Wait or reduce volume. |
| `media_too_large` | 400 | File exceeds platform max. | Compress or trim video. |
| `insufficient_funds` | 402 | USD wallet empty. | Top up in FOTOhub console. |




































































































































































































































































































































































































































































































































