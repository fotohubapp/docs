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
    
    subgraph Pre-Flight & AI Analysis
        A --> B["Vision & Context Analysis (/v1/ai/analyze-image)"]
        B --> MOD["Content Moderation Pre-flight (/v1/social/moderate)"]
        MOD --> C["Platform-Specific Copywriting Engine (/v1/social/captions/generate)"]
    end
    
    subgraph Adaptation
        C --> D1["TikTok Variant (Fast Hook, Sound Tags, Trends)"]
        C --> D2["IG Reels Variant (Aesthetic Luxury, First-Comment Cloud)"]
        C --> D3["YouTube Shorts Variant (SEO Keywords, CTR Title)"]
        C --> D4["X / Twitter Variant (Punchy 280-char Thread Hook)"]
        C --> D5["LinkedIn Variant (Professional, Case Study Format)"]
        
        A --> RESIZE["Multi-platform Format Adaptation (/v1/media/resize)"]
        RESIZE --> D1
        RESIZE --> D2
        RESIZE --> D3
        RESIZE --> D4
        RESIZE --> D5
    end
    
    subgraph Scheduling
        D1 & D2 & D3 & D4 & D5 --> E["Optimal Publishing Window Calculator (/v1/social/optimal-time)"]
        E --> F["Schedule Unified Multi-Channel Post (POST /v1/social/schedule)"]
    end
    
    subgraph Execution
        F --> G["FotoHUB Background Scheduler Engine (APScheduler / Celery)"]
        G --> H["OAuth Publication Dispatch (TikTok, Meta Graph, YT Data, X API)"]
    end
    
    subgraph Post-Execution
        H --> I["Signed Webhook Broadcast (social.post.published / X-FotoHub-Signature)"]
        I --> J["Automated First-Comment Engagement Injection"]
        H --> K["Post Performance & Engagement Sync (/v1/social/analytics/{post_id})"]
        H --> BYOB["BYOB S3/R2 Export: Auto-archive Metadata + Media"]
    end
```

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

### `POST /v1/social/accounts/connect`

Generates an OAuth connection link to redirect your users to.

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `platform` | string | **Yes** | — | `"tiktok"`, `"instagram"`, `"youtube"`, `"twitter"`, `"linkedin"` |
| `redirect_uri` | string | **Yes** | — | The URI FOTOhub will redirect back to after auth |
| `scopes` | string[] | No | All | Specific permissions required |

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/social/accounts/connect"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
data = {
    "platform": "tiktok",
    "redirect_uri": "https://your-app.com/callback/tiktok"
}
response = requests.post(url, headers=headers, json=data)
print(response.json())
```

```typescript [TypeScript]
import axios from 'axios';

async function connectAccount() {
  const response = await axios.post('https://apis.fotohub.app/v1/social/accounts/connect', {
    platform: 'tiktok',
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
	url := "https://apis.fotohub.app/v1/social/accounts/connect"
	payload := []byte(`{"platform":"tiktok","redirect_uri":"https://your-app.com/callback/tiktok"}`)
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
curl -X POST https://apis.fotohub.app/v1/social/accounts/connect \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "tiktok",
    "redirect_uri": "https://your-app.com/callback/tiktok"
  }'
```

:::

### `GET /v1/social/accounts`

List all connected accounts.

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `status` | string | No | `active` | Filter by `active`, `expired`, `all` |
| `platform` | string | No | — | Filter by specific platform |

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/social/accounts"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
}
response = requests.get(url, headers=headers)
print(response.json())
```

```typescript [TypeScript]
import axios from 'axios';

async function listAccounts() {
  const response = await axios.get('https://apis.fotohub.app/v1/social/accounts', {
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
	url := "https://apis.fotohub.app/v1/social/accounts"
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	
	client := &http.Client{}
	resp, _ := client.Do(req)
	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/social/accounts \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

---

## 5. Content Moderation Pre-Flight

Before attempting to schedule a post, check for platform compliance.

### `POST /v1/social/moderate`

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `media_url` | string | **Yes** | — | Public URL to media |
| `text` | string | No | — | Associated text |

::: tip Pre-flight Savings
A rejected post on TikTok can shadowban an account. Running a $0.002 pre-flight check saves hours of debugging.
:::

---

## 6. Multi-Platform Format Adaptation

FOTOhub can automatically pad, crop, or resize video assets.

### `POST /v1/media/resize`

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `media_url` | string | **Yes** | — | Public URL to media |
| `target_aspect_ratio` | string | **Yes** | — | e.g. `9:16`, `16:9`, `1:1` |
| `strategy` | string | No | `smart_crop` | `pad`, `crop`, `smart_crop` |

---

## 7. Caption Generation & Hashtag Optimization

Generate customized captions per platform based on a single topic.

### `POST /v1/social/captions/generate`

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `topic` | string | **Yes** | — | Subject matter |
| `platform` | string | **Yes** | — | Target platform |
| `tone` | string | No | `casual` | `professional`, `casual`, `funny`, `luxury` |
| `include_hashtags` | boolean | No | `true` | Append hashtags |
| `hashtag_count` | integer | No | `5` | Number of tags |

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/social/captions/generate"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
data = {
    "topic": "AI virtual try-on technology demo",
    "platform": "instagram",
    "tone": "luxury",
    "include_hashtags": True,
    "hashtag_count": 15
}
response = requests.post(url, headers=headers, json=data)
print(response.json())
```

```typescript [TypeScript]
import axios from 'axios';

async function generateCaption() {
  const response = await axios.post('https://apis.fotohub.app/v1/social/captions/generate', {
    topic: 'AI virtual try-on technology demo',
    platform: 'instagram',
    tone: 'luxury',
    include_hashtags: true,
    hashtag_count: 15
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
	url := "https://apis.fotohub.app/v1/social/captions/generate"
	payload := []byte(`{"topic":"AI virtual try-on technology demo","platform":"instagram","tone":"luxury","include_hashtags":true,"hashtag_count":15}`)
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
curl -X POST https://apis.fotohub.app/v1/social/captions/generate \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AI virtual try-on technology demo",
    "platform": "instagram",
    "tone": "luxury",
    "include_hashtags": true,
    "hashtag_count": 15
  }'
```

:::

---

## 8. Publishing & Scheduling

Schedule or instantly publish to multiple platforms.

### `POST /v1/social/schedule` (or `/v1/social/publish`)

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `media_url` | string | **Yes** | — | The video/image URL |
| `target_accounts` | string[] | **Yes** | — | Array of account UUIDs |
| `scheduled_at` | string | No | `now` | ISO8601 UTC time for scheduling |
| `variants` | object[] | **Yes** | — | Overrides per platform |

#### Variant Object

| Field | Type | Description |
|---|---|---|
| `platform` | string | `tiktok`, `instagram`, etc. |
| `text` | string | Caption text |
| `first_comment` | string | Optional first comment text |

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/social/schedule"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
data = {
    "media_url": "https://static.fotohub.app/demo/vid.mp4",
    "target_accounts": ["acc_123", "acc_456"],
    "scheduled_at": "2026-10-10T12:00:00Z",
    "variants": [
        {"platform": "tiktok", "text": "Check this out!"},
        {"platform": "instagram", "text": "Aesthetic vibe.", "first_comment": "#tags #here"}
    ]
}
response = requests.post(url, headers=headers, json=data)
print(response.json())
```

```typescript [TypeScript]
import axios from 'axios';

async function schedulePost() {
  const response = await axios.post('https://apis.fotohub.app/v1/social/schedule', {
    media_url: 'https://static.fotohub.app/demo/vid.mp4',
    target_accounts: ['acc_123', 'acc_456'],
    scheduled_at: '2026-10-10T12:00:00Z',
    variants: [
      {platform: 'tiktok', text: 'Check this out!'},
      {platform: 'instagram', text: 'Aesthetic vibe.', first_comment: '#tags #here'}
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
	url := "https://apis.fotohub.app/v1/social/schedule"
	payload := []byte(`{"media_url":"https://static.fotohub.app/demo/vid.mp4","target_accounts":["acc_123"],"scheduled_at":"2026-10-10T12:00:00Z","variants":[{"platform":"tiktok","text":"Wow!"}]}`)
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
curl -X POST https://apis.fotohub.app/v1/social/schedule \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "media_url": "https://static.fotohub.app/demo/vid.mp4",
    "target_accounts": ["acc_123"],
    "scheduled_at": "2026-10-10T12:00:00Z",
    "variants": [{"platform": "tiktok", "text": "Wow!"}]
  }'
```

:::

---

## 9. Async Bulk Publish

If you are scheduling massive content calendars (e.g., 20+ posts a week).

### `POST /v1/social/bulk`

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `jobs` | object[] | **Yes** | — | Array of schedule objects |

::: tip SSE Streaming
Bulk endpoints return a `202 Accepted` with a `job_id`. You can connect via Server-Sent Events (SSE) to monitor progress, or wait for the webhook.
:::

---

## 10. Engagement Analytics

Fetch post analytics after publication.

### `GET /v1/social/analytics/{post_id}`

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `post_id` | string | **Yes** | — | ID returned from publish/schedule |

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/social/analytics/post_123"
headers = {
    "Authorization": "Bearer fh_live_your_api_key"
}
response = requests.get(url, headers=headers)
print(response.json())
```

```typescript [TypeScript]
import axios from 'axios';

async function getAnalytics() {
  const response = await axios.get('https://apis.fotohub.app/v1/social/analytics/post_123', {
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
	url := "https://apis.fotohub.app/v1/social/analytics/post_123"
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	
	client := &http.Client{}
	resp, _ := client.Do(req)
	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/social/analytics/post_123 \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

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
    url = "https://apis.fotohub.app/v1/social/schedule"
    async with aiohttp.ClientSession(headers=HEADERS) as session:
        tasks = [schedule_single(session, url, post) for post in posts]
        results = await asyncio.gather(*tasks)
        return results

# Usage
# posts = [{"media_url": "...", "target_accounts": ["..."]}, ...]
# results = asyncio.run(batch_schedule(posts))
```

---

## 13. A/B Caption Testing

Publish the same video with two caption variants sequentially to measure performance.
1. Post Variant A today at 5 PM.
2. Archive the post after 24h.
3. Post Variant B tomorrow at 5 PM.
4. Compare `/v1/social/analytics/{post_id}` engagement metrics.

---

## 14. Rate Limit Handling & Retries

Platform specific rate limits:
- TikTok: 200/day
- Instagram: 25/hour
- LinkedIn: 100/day

If FOTOhub receives a rate limit, the API returns HTTP 429. Implement exponential backoff or use our background scheduler.

### DLQ (Dead Letter Queue) Pattern
All failed asynchronous publish jobs are queued into a DLQ. You can poll `/v1/social/dlq` to replay failed messages.

---

## 15. BYOB (Bring Your Own Bucket) S3/R2 Export

Automatically archive published content and metadata to your AWS S3 or Cloudflare R2 buckets.

Provide credentials in the Console. FOTOhub will save:
- `post_123.mp4`
- `post_123_metadata.json` (contains analytics up to 7 days, caption variants, and hashtags)

---

## 16. Error Codes

| Code | HTTP Status | Description | Solution |
|---|---|---|---|
| `account_suspended` | 400 | Social account is blocked. | Resolve block on platform. |
| `invalid_token` | 401 | FOTOhub API Key is invalid. | Check API key. |
| `oauth_expired` | 403 | Platform OAuth token expired. | Re-connect via `/v1/social/accounts/connect`. |
| `rate_limit_exceeded` | 429 | Exceeded platform limits. | Wait or reduce volume. |
| `media_too_large` | 400 | File exceeds platform max. | Compress or trim video. |
| `insufficient_funds` | 402 | USD wallet empty. | Top up in FOTOhub console. |




































































































































































































































































































































































































































































































































