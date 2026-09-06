# Social Studio API

FotoHUB Social Studio (`/v1/social`) provides multi-platform social media publishing, scheduling, calendar management, and AI content assistance across Facebook, Instagram, LinkedIn, Twitter/X, and TikTok.

Base URL: `https://apis.fotohub.app/v1`

---

## Supported Social Platforms

| Platform | Supported Content Types | Direct Auto-Posting |
|----------|-------------------------|:-------------------:|
| **Instagram** | Feed Photos, Carousels, Reels, Stories | Yes |
| **TikTok** | Short-form Videos, Photo Carousels | Yes |
| **Facebook** | Page Posts, Photos, Videos, Reels | Yes |
| **LinkedIn** | Member & Company Posts, Multi-image, Documents | Yes |
| **Twitter / X** | Tweets, Threads, Images, Videos | Yes |

---

## Account Management

### 1. List Connected Accounts

```
GET /v1/accounts
```

#### Response Example

```json
{
  "accounts": [
    {
      "id": "acc_instagram_01",
      "platform": "instagram",
      "platform_account_id": "17841405309211234",
      "account_name": "fotohub_official",
      "profile_picture_url": "https://s3point.fotohub.app/profiles/ig_pic.jpg",
      "status": "active",
      "follower_count": 28400
    },
    {
      "id": "acc_tiktok_02",
      "platform": "tiktok",
      "platform_account_id": "open_id_abcdef12345",
      "account_name": "@fotohubapp",
      "status": "active",
      "follower_count": 51200
    }
  ]
}
```

---

### 2. Connect Account (OAuth Flow)

```
GET /v1/accounts/connect/{platform}?redirect_uri=https://fotohub.app/console/social
```

Returns OAuth authorization URL for Facebook/Instagram, LinkedIn, Twitter/X, or TikTok with pre-configured publication scopes.

---

## Posts & Multi-Platform Publishing

### 1. Create Post (Draft or Scheduled)

```
POST /v1/posts
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | **Yes** | Post body text / caption. |
| `target_accounts` | string[] | **Yes** | IDs of connected accounts to publish to. |
| `media` | object[] | No | Array of `{url, media_type, thumbnail_url}` objects. |
| `scheduled_at` | string (ISO) | No | Scheduled publishing time in UTC. If omitted, post is saved as `draft`. |
| `hashtags` | string[] | No | List of hashtags. |
| `first_comment` | string | No | Automatic first comment (e.g. for Instagram hashtags). |
| `variants` | object[] | No | Platform-specific overrides for text and media. |
| `link_url` | string | No | Attachment URL (LinkedIn/Facebook). |

#### Request Example

```json
{
  "text": "Introducing AI Video Generation 2.0 on FotoHUB! Render 4K cinematic video in seconds.",
  "target_accounts": ["acc_instagram_01", "acc_tiktok_02"],
  "scheduled_at": "2026-09-10T14:00:00Z",
  "media": [
    {
      "url": "https://s3point.fotohub.app/renders/video_v2.mp4",
      "media_type": "video"
    }
  ],
  "hashtags": ["#AIvideo", "#CreativeTools", "#VideoEditing"],
  "first_comment": "Try it now at fotohub.app 🚀"
}
```

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json",
}
payload = {
    "text": "Introducing AI Video Generation 2.0 on FotoHUB!",
    "target_accounts": ["acc_instagram_01", "acc_tiktok_02"],
    "scheduled_at": "2026-09-10T14:00:00Z",
}
resp = requests.post("https://apis.fotohub.app/v1/posts", headers=headers, json=payload)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/posts", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    text: "Introducing AI Video Generation 2.0 on FotoHUB!",
    target_accounts: ["acc_instagram_01", "acc_tiktok_02"],
    scheduled_at: "2026-09-10T14:00:00Z",
  }),
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
		"text":            "Introducing AI Video Generation 2.0 on FotoHUB!",
		"target_accounts": []string{"acc_instagram_01", "acc_tiktok_02"},
		"scheduled_at":    "2026-09-10T14:00:00Z",
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/posts", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer YOUR_JWT_TOKEN")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println(string(respBody))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Introducing AI Video Generation 2.0 on FotoHUB!",
    "target_accounts": ["acc_instagram_01", "acc_tiktok_02"],
    "scheduled_at": "2026-09-10T14:00:00Z"
  }'
```

:::

---

### 2. Immediate Publishing

```
POST /v1/posts/{post_id}/publish
```

Executes instant publication across all specified target accounts. Returns status and platform post IDs/URLs.

---

## Content Calendar

### 1. Get Grouped Calendar

```
GET /v1/calendar?view=month&date_from=2026-09-01&date_to=2026-09-30
```

Returns posts grouped by date (`YYYY-MM-DD`) for rendering calendar grids.

### 2. Reschedule Post (Drag-and-Drop)

```
POST /v1/calendar/reschedule
```

Payload: `{"post_id": "...", "scheduled_at": "2026-09-12T16:30:00Z"}`.
