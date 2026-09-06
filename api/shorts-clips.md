# Shorts & Clips V2 API

Transform videos into viral short-form content, generate AI videos from scratch, convert articles into video recaps, or create talking-head avatar videos — all through a single unified API.

| | |
|---|---|
| **Modes** | Clip (extract from video), Create (AI-generate), Recap (article→video), Avatar (talking head) |
| **Pipeline** | Automated multi-step processing with real-time WebSocket progress |
| **AI Features** | B-Roll suggestions, Series AI split, virality scoring, auto-captions |
| **Languages** | 23 languages for transcription and captions |
| **Output** | MP4, up to 1080p, configurable aspect ratio (9:16, 16:9, 1:1, 4:5) |
| **Publishing** | Direct publishing to TikTok, YouTube, Instagram, Facebook, LinkedIn |

---

## Two ways to use Shorts

FOTOhub exposes Shorts through **two distinct interfaces**. They are separate systems with different base URLs, authentication, and request shapes — pick the one that matches your use case.

### 1. Pipeline REST API (programmatic / SDK)

A stateless, step-based REST API for building your own pipelines or calling from the SDK.

| | |
|---|---|
| **Base URL** | `https://apis.fotohub.app` |
| **Paths** | `POST /v1/shorts/<step>` — `ingest`, `transcribe`, `detect-scenes`, `generate-clips`, `captions`, `reframe`, `render`, `agent` |
| **Auth** | API key — `Authorization: Bearer fh_live_...` |
| **Model** | Stateless. Each call takes a `video_url` and returns the step result plus billing info. No projects or clips are stored. |

See the full reference in [Pipeline REST API](#pipeline-rest-api).

### 2. Console RPC (`shorts-process`)

The stateful project/clip system that powers the web dashboard: server-side projects, clips, series, templates, publishing, and analytics.

| | |
|---|---|
| **Base URL** | `https://s1.fotohub.app/functions/v1/shorts-process` |
| **Method** | Always `POST`, with `{"action": "...", ...params}` in the body |
| **Auth** | Supabase **session token** — `Authorization: Bearer <session_token>` (the JWT from your logged-in dashboard session). **Not** an `fh_live_*` API key. |
| **Model** | Stateful. Create a project, process it, then read back clips. |

Copy-paste examples for every action live in the [Shorts Console](/api/shorts-console).

::: warning Two different transports — don't mix them
The console operations documented below (projects, clips, series, templates, publishing, analytics) are **not** reachable as dedicated RESTful resource paths. They are all dispatched through the single `shorts-process` endpoint via the `action` field, authenticated with a **session token** — not an API key. For programmatic access with an `fh_live_*` API key, use the [Pipeline REST API](#pipeline-rest-api) instead.
:::

---

## Projects

Projects are the top-level container for all shorts workflows. Each project has a mode that determines its processing pipeline.

::: info Transport
Project operations are **Console RPC** calls. Every request is a `POST` to `https://s1.fotohub.app/functions/v1/shorts-process` with an `action` field in the body, authenticated with a **Supabase session token** (not an `fh_live_*` API key). The signatures below show the `action` and its parameters.
:::

### Create Project

Create a new shorts project.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_create_project", ... }
```

**Billing:** No credits charged for creation

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `mode` | string | Yes | — | Pipeline mode: `clip`, `create`, `recap`, or `avatar` |
| `title` | string | No | Auto-generated | Project title |
| `source_url` | string | No | — | Video URL (YouTube, TikTok, Instagram, Vimeo) or uploaded file path. Required for `clip` mode. |
| `source_type` | string | No | Auto-detected | `youtube`, `tiktok`, `instagram`, `vimeo`, `upload`, `article` |
| `settings` | object | No | `{}` | Mode-specific configuration (language, caption_style, aspect_ratio, etc.) |
| `avatar_config` | object | No | — | Avatar mode configuration (face image, voice, script) |
| `brand_kit_id` | string | No | — | Apply brand kit (logo, colors, fonts) to all generated clips |
| `brief` | string | No | — | Creative brief for `create` mode |

**Response:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "user-uuid",
  "title": "My Short",
  "mode": "clip",
  "status": "draft",
  "source_url": "https://youtube.com/watch?v=...",
  "settings": {},
  "created_at": "2026-07-22T10:00:00Z",
  "steps_completed": []
}
```

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="YOUR_API_KEY")

project = client.shorts.create_project(
    mode="clip",
    source_url="https://youtube.com/watch?v=dQw4w9WgXcQ",
    title="Best Moments",
    settings={
        "language": "en",
        "caption_style": "karaoke",
        "aspect_ratio": "9:16",
        "max_clips": 5
    }
)
print(project.id)
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "YOUR_API_KEY" });

const project = await client.shorts.createProject({
  mode: "clip",
  sourceUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
  title: "Best Moments",
  settings: {
    language: "en",
    captionStyle: "karaoke",
    aspectRatio: "9:16",
    maxClips: 5
  }
});
console.log(project.id);
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
		"action":     "v2_create_project",
		"mode":       "clip",
		"source_url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
		"title":      "Best Moments",
		"settings": map[string]interface{}{
			"language":      "en",
			"caption_style": "karaoke",
			"aspect_ratio":  "9:16",
			"max_clips":     5,
		},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	fmt.Printf("Project ID: %s\n", result["id"])
}
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_create_project",
    "mode": "clip",
    "source_url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Best Moments",
    "settings": {
      "language": "en",
      "caption_style": "karaoke",
      "aspect_ratio": "9:16",
      "max_clips": 5
    }
  }'
```
:::

---

### List Projects

Retrieve all projects for the authenticated user.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_list_projects", ... }
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | `20` | Max results (1-100) |
| `offset` | integer | No | `0` | Pagination offset |

**Response:**

```json
{
  "projects": [
    {
      "id": "uuid",
      "title": "My Short",
      "mode": "clip",
      "status": "completed",
      "source_url": "...",
      "input_duration_seconds": 324,
      "current_step": "done",
      "steps_completed": ["ingest", "transcribe", "detect", "clip", "caption", "render"],
      "processing_time_ms": 45000,
      "created_at": "2026-07-22T10:00:00Z",
      "completed_at": "2026-07-22T10:01:15Z"
    }
  ],
  "total": 1
}
```

::: code-group
```python [Python]
projects = client.shorts.list_projects(limit=10)
for p in projects:
    print(f"{p.title} — {p.status}")
```

```typescript [TypeScript]
const { projects } = await client.shorts.listProjects({ limit: 10 });
projects.forEach(p => console.log(`${p.title} — ${p.status}`));
```

```go [Go]
payload := map[string]interface{}{
    "action": "v2_list_projects",
    "limit":  10,
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)

var result map[string]interface{}
json.Unmarshal(respBody, &result)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_list_projects", "limit": 10}'
```
:::

---

### Get Project

Get full project details including all clips.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_get_project", "project_id": "..." }
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Project UUID |

**Response:**

```json
{
  "project": {
    "id": "uuid",
    "title": "My Short",
    "mode": "clip",
    "status": "completed",
    "settings": { "language": "en", "caption_style": "karaoke" },
    "source_url": "...",
    "steps_completed": ["ingest", "transcribe", "detect", "clip", "caption", "render"]
  },
  "clips": [
    {
      "id": "clip-uuid",
      "user_title": "Epic Hook",
      "hook_text": "You won't believe what happens next...",
      "virality_score": 87,
      "duration": 28.5,
      "start_time": 45.2,
      "end_time": 73.7,
      "status": "rendered",
      "renders": {
        "9:16": { "url": "https://...", "status": "rendered" }
      }
    }
  ]
}
```

::: code-group
```python [Python]
result = client.shorts.get_project("project-uuid")
print(f"Clips: {len(result.clips)}")
```

```typescript [TypeScript]
const { project, clips } = await client.shorts.getProject("project-uuid");
console.log(`Clips: ${clips.length}`);
```

```go [Go]
payload := map[string]interface{}{
    "action":     "v2_get_project",
    "project_id": "project-uuid",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_get_project", "project_id": "project-uuid"}'
```
:::

---

### Delete Project

Delete a project and all associated clips. Cancels any running pipeline.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_delete_project", "project_id": "..." }
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Project UUID |

::: code-group
```python [Python]
client.shorts.delete_project("project-uuid")
```

```typescript [TypeScript]
await client.shorts.deleteProject("project-uuid");
```

```go [Go]
payload := map[string]interface{}{
    "action":     "v2_delete_project",
    "project_id": "project-uuid",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_delete_project", "project_id": "project-uuid"}'
```
:::

---

### Start Pipeline

Start or resume processing for a project. This triggers the full automated pipeline for the project's mode.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_process_project", "project_id": "...", "settings": {} }
```

**Billing:** Credits charged per step (see [Pricing & Credits](#pricing-credits))

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | string | Yes | — | Project UUID |
| `settings` | object | No | `{}` | Override or add pipeline settings |

**Pipeline steps by mode:**

| Mode | Steps |
|------|-------|
| `clip` | ingest → transcribe → detect → clip → caption → reframe → render |
| `create` | script → storyboard → generate → render |
| `avatar` | voice → lip-sync → render |
| `recap` | scrape → script → storyboard → generate → render |

**Response:**

```json
{
  "status": "started",
  "project_id": "uuid",
  "mode": "clip"
}
```

::: code-group
```python [Python]
result = client.shorts.process_project("project-uuid", settings={
    "caption_style": "bold",
    "max_clips": 3,
    "min_duration": 15,
    "max_duration": 60
})
```

```typescript [TypeScript]
const result = await client.shorts.processProject("project-uuid", {
  settings: {
    captionStyle: "bold",
    maxClips: 3,
    minDuration: 15,
    maxDuration: 60
  }
});
```

```go [Go]
payload := map[string]interface{}{
    "action":     "v2_process_project",
    "project_id": "project-uuid",
    "settings": map[string]interface{}{
        "caption_style": "bold",
        "max_clips":     3,
        "min_duration":  15,
        "max_duration":  60,
    },
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_process_project",
    "project_id": "project-uuid",
    "settings": {
      "caption_style": "bold",
      "max_clips": 3,
      "min_duration": 15,
      "max_duration": 60
    }
  }'
```
:::

::: warning
Pipeline processing is asynchronous. Use WebSocket or polling to track progress.
:::

---

### Cancel Pipeline

Cancel a running pipeline processing.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_cancel_project", "project_id": "..." }
```

::: code-group
```python [Python]
client.shorts.cancel_project("project-uuid")
```

```typescript [TypeScript]
await client.shorts.cancelProject("project-uuid");
```

```go [Go]
payload := map[string]interface{}{
    "action":     "v2_cancel_project",
    "project_id": "project-uuid",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_cancel_project", "project_id": "project-uuid"}'
```
:::

---

## Clips

Clips are the output units — individual short-form videos extracted or generated from a project.

::: info Transport
Clip operations are **Console RPC** calls — `POST https://s1.fotohub.app/functions/v1/shorts-process` with an `action` field, authenticated with a **Supabase session token**.
:::

### List Clips

Get all clips for a project, sorted by virality score.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_list_clips", "project_id": "..." }
```

**Response:**

```json
{
  "clips": [
    {
      "id": "clip-uuid",
      "project_id": "project-uuid",
      "user_title": "The Hook Moment",
      "hook_text": "Here's what nobody tells you about...",
      "virality_score": 92,
      "duration": 34.2,
      "start_time": 120.5,
      "end_time": 154.7,
      "tags": ["hook", "storytelling", "viral"],
      "status": "rendered",
      "renders": {
        "9:16": { "url": "https://...", "status": "rendered" },
        "1:1": { "url": "https://...", "status": "rendered" }
      },
      "thumbnail_url": "https://...",
      "transcript_segment": { "segments": [...] },
      "score_breakdown": {
        "hook_strength": 0.95,
        "pacing": 0.88,
        "completeness": 0.91,
        "topic": "storytelling"
      }
    }
  ]
}
```

::: code-group
```python [Python]
clips = client.shorts.list_clips("project-uuid")
for clip in clips:
    print(f"{clip.user_title} — Score: {clip.virality_score}")
```

```typescript [TypeScript]
const { clips } = await client.shorts.listClips("project-uuid");
clips.forEach(c => console.log(`${c.userTitle} — Score: ${c.viralityScore}`));
```

```go [Go]
payload := map[string]interface{}{
    "action":     "v2_list_clips",
    "project_id": "project-uuid",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_list_clips", "project_id": "project-uuid"}'
```
:::

---

### Get Clip

Get full details for a single clip.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_get_clip", "clip_id": "..." }
```

::: code-group
```python [Python]
clip = client.shorts.get_clip("clip-uuid")
print(clip.renders)
```

```typescript [TypeScript]
const { clip } = await client.shorts.getClip("clip-uuid");
console.log(clip.renders);
```

```go [Go]
payload := map[string]interface{}{
    "action":  "v2_get_clip",
    "clip_id": "clip-uuid",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_get_clip", "clip_id": "clip-uuid"}'
```
:::

---

### Update Clip

Update clip metadata (title, notes, favorite status).

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_update_clip", "clip_id": "...", ... }
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_title` | string | No | Custom title |
| `user_notes` | string | No | Notes/annotations |
| `is_favorite` | boolean | No | Mark as favorite |
| `is_discarded` | boolean | No | Soft-delete (hide from results) |
| `tags` | string[] | No | Custom tags |

::: code-group
```python [Python]
client.shorts.update_clip("clip-uuid", user_title="My Best Hook", is_favorite=True)
```

```typescript [TypeScript]
await client.shorts.updateClip("clip-uuid", {
  userTitle: "My Best Hook",
  isFavorite: true
});
```

```go [Go]
payload := map[string]interface{}{
    "action":      "v2_update_clip",
    "clip_id":     "clip-uuid",
    "user_title":  "My Best Hook",
    "is_favorite": true,
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_update_clip",
    "clip_id": "clip-uuid",
    "user_title": "My Best Hook",
    "is_favorite": true
  }'
```
:::

---

### Render Clip

Queue a render for a specific clip in a given aspect ratio and quality.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_render_clip", "clip_id": "...", ... }
```

**Billing:** 1-3 credits per render (depending on quality)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `aspect_ratio` | string | No | `9:16` | `9:16`, `16:9`, `1:1`, `4:5` |
| `quality` | string | No | `social_1080p` | `social_720p`, `social_1080p`, `pro_1080p` |

**Response:**

```json
{
  "queued": true,
  "aspect_ratio": "9:16"
}
```

::: code-group
```python [Python]
client.shorts.render_clip("clip-uuid", aspect_ratio="9:16", quality="social_1080p")
```

```typescript [TypeScript]
await client.shorts.renderClip("clip-uuid", {
  aspectRatio: "9:16",
  quality: "social_1080p"
});
```

```go [Go]
payload := map[string]interface{}{
    "action":       "v2_render_clip",
    "clip_id":      "clip-uuid",
    "aspect_ratio": "9:16",
    "quality":      "social_1080p",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_render_clip",
    "clip_id": "clip-uuid",
    "aspect_ratio": "9:16",
    "quality": "social_1080p"
  }'
```
:::

---

### Delete Clip

Permanently delete a clip.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_delete_clip", "clip_id": "..." }
```

::: code-group
```python [Python]
client.shorts.delete_clip("clip-uuid")
```

```typescript [TypeScript]
await client.shorts.deleteClip("clip-uuid");
```

```go [Go]
payload := map[string]interface{}{
    "action":  "v2_delete_clip",
    "clip_id": "clip-uuid",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_delete_clip", "clip_id": "clip-uuid"}'
```
:::

---

## Create Mode

Generate short-form videos entirely from AI — provide a brief, get a script, storyboard, and final video.

### Generate Script

Generate a structured video script from a creative brief using FOTOhub AI.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_generate_script", "project_id": "...", ... }
```

**Billing:** 2 credits

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brief` | string | Yes | — | Creative brief describing the video (10-2000 chars) |
| `target_duration` | integer | No | `60` | Target video duration in seconds (15-180) |
| `style` | string | No | — | Visual style hint (e.g., "cinematic", "energetic", "minimalist") |
| `platform` | string | No | — | Target platform ("tiktok", "youtube_shorts", "instagram_reels") |

**Response:**

```json
{
  "status": "generated",
  "script": {
    "title": "5 Things Nobody Tells You About Startups",
    "hook": "I lost $50k in 3 months. Here's what I wish someone told me.",
    "scenes": [
      {
        "scene_number": 1,
        "duration_seconds": 8,
        "narration": "Three years ago, I quit my job...",
        "visual_description": "Person at desk, packing belongings into a box",
        "text_overlay": "Day 1: The Leap"
      }
    ],
    "outro_cta": "Follow for Part 2",
    "total_duration_seconds": 58,
    "mood": "inspirational",
    "tags": ["startup", "entrepreneurship", "lessons"]
  }
}
```

::: code-group
```python [Python]
result = client.shorts.generate_script("project-uuid",
    brief="5 surprising facts about deep sea creatures that will blow your mind",
    target_duration=45,
    platform="tiktok"
)
print(f"Script: {result.script.title} ({result.script.total_duration_seconds}s)")
```

```typescript [TypeScript]
const result = await client.shorts.generateScript("project-uuid", {
  brief: "5 surprising facts about deep sea creatures that will blow your mind",
  targetDuration: 45,
  platform: "tiktok"
});
console.log(`Script: ${result.script.title}`);
```

```go [Go]
payload := map[string]interface{}{
    "action":          "v2_generate_script",
    "project_id":      "project-uuid",
    "brief":           "5 surprising facts about deep sea creatures",
    "target_duration": 45,
    "platform":        "tiktok",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)

var result map[string]interface{}
json.Unmarshal(respBody, &result)
script := result["script"].(map[string]interface{})
fmt.Printf("Script: %s\n", script["title"])
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_generate_script",
    "project_id": "project-uuid",
    "brief": "5 surprising facts about deep sea creatures",
    "target_duration": 45,
    "platform": "tiktok"
  }'
```
:::

---

### Generate Storyboard

Convert a script into a visual storyboard with scene-by-scene prompts for video generation.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_generate_storyboard", "project_id": "..." }
```

**Billing:** 2 credits

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `script` | object | No | Uses project's script | Override script object |

**Response:**

```json
{
  "status": "storyboard_created",
  "storyboard": {
    "scenes": [
      {
        "scene_number": 1,
        "video_prompt": "Cinematic shot of person at desk, warm lighting, office environment",
        "duration_seconds": 8,
        "transition": "fade",
        "narration": "Three years ago, I quit my job..."
      }
    ]
  }
}
```

::: code-group
```python [Python]
result = client.shorts.generate_storyboard("project-uuid")
print(f"Scenes: {len(result.storyboard.scenes)}")
```

```typescript [TypeScript]
const result = await client.shorts.generateStoryboard("project-uuid");
console.log(`Scenes: ${result.storyboard.scenes.length}`);
```

```go [Go]
payload := map[string]interface{}{
    "action":     "v2_generate_storyboard",
    "project_id": "project-uuid",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_generate_storyboard", "project_id": "project-uuid"}'
```
:::

---

### Generate Video

Generate the final video from storyboard using AI video generation (Seedance 2.0).

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_generate_video", "project_id": "...", ... }
```

**Billing:** 15-50 credits per scene (depending on resolution and model)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | string | No | `fast` | Video model: `fast` (5s generation), `pro` (higher quality), `mini` (cheaper) |
| `resolution` | string | No | `720p` | `480p`, `720p`, `1080p` |

::: warning Credits
Video generation is credit-intensive. A 45-second video with 5 scenes at 720p costs approximately 75-100 credits.
:::

::: code-group
```python [Python]
result = client.shorts.generate_video("project-uuid", model="pro", resolution="1080p")
```

```typescript [TypeScript]
const result = await client.shorts.generateVideo("project-uuid", {
  model: "pro",
  resolution: "1080p"
});
```

```go [Go]
payload := map[string]interface{}{
    "action":     "v2_generate_video",
    "project_id": "project-uuid",
    "model":      "pro",
    "resolution": "1080p",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_generate_video",
    "project_id": "project-uuid",
    "model": "pro",
    "resolution": "1080p"
  }'
```
:::

---

## Avatar Mode

Generate talking-head videos with AI-driven lip sync and voice.

### Generate Avatar Video

Create an avatar video from a face image and script/audio.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_generate_avatar", "project_id": "...", ... }
```

**Billing:** 10-25 credits (depending on duration)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `face_image_url` | string | Yes | — | URL to face image (front-facing, clear) |
| `script` | string | No | — | Text to speak (uses TTS) |
| `audio_url` | string | No | — | Pre-recorded audio URL (alternative to script) |
| `voice_id` | string | No | Default voice | Voice ID from FOTOhub Voice library |
| `language` | string | No | `en` | Language for TTS |

::: code-group
```python [Python]
result = client.shorts.generate_avatar("project-uuid",
    face_image_url="https://storage.fotohub.app/.../face.jpg",
    script="Welcome to my channel! Today I'm going to show you...",
    voice_id="voice-energetic-female",
    language="en"
)
```

```typescript [TypeScript]
const result = await client.shorts.generateAvatar("project-uuid", {
  faceImageUrl: "https://storage.fotohub.app/.../face.jpg",
  script: "Welcome to my channel! Today I'm going to show you...",
  voiceId: "voice-energetic-female",
  language: "en"
});
```

```go [Go]
payload := map[string]interface{}{
    "action":         "v2_generate_avatar",
    "project_id":     "project-uuid",
    "face_image_url": "https://storage.fotohub.app/.../face.jpg",
    "script":         "Welcome to my channel! Today I'm going to show you...",
    "voice_id":       "voice-energetic-female",
    "language":       "en",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_generate_avatar",
    "project_id": "project-uuid",
    "face_image_url": "https://storage.fotohub.app/.../face.jpg",
    "script": "Welcome to my channel!",
    "voice_id": "voice-energetic-female"
  }'
```
:::

---

## Recap Mode

Convert articles and blog posts into engaging video recaps with AI narration and visuals.

### Scrape Article

Extract text content from a URL for video recap generation.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_recap_scrape", "project_id": "...", "url": "..." }
```

**Billing:** 1 credit

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Project UUID |
| `url` | string | Yes | Article URL to scrape |

**Response:**

```json
{
  "status": "scraped",
  "title": "The Future of AI in Creative Industries",
  "word_count": 2340,
  "domain": "techcrunch.com",
  "preview": "First 500 characters of the article text..."
}
```

::: code-group
```python [Python]
result = client.shorts.scrape_article("project-uuid",
    url="https://techcrunch.com/2026/07/20/ai-creative-tools/"
)
print(f"Scraped: {result.title} ({result.word_count} words)")
```

```typescript [TypeScript]
const result = await client.shorts.scrapeArticle("project-uuid", {
  url: "https://techcrunch.com/2026/07/20/ai-creative-tools/"
});
console.log(`Scraped: ${result.title} (${result.wordCount} words)`);
```

```go [Go]
payload := map[string]interface{}{
    "action":     "v2_recap_scrape",
    "project_id": "project-uuid",
    "url":        "https://techcrunch.com/2026/07/20/ai-creative-tools/",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)

var result map[string]interface{}
json.Unmarshal(respBody, &result)
fmt.Printf("Scraped: %s (%v words)\n", result["title"], result["word_count"])
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_recap_scrape",
    "project_id": "project-uuid",
    "url": "https://techcrunch.com/2026/07/20/ai-creative-tools/"
  }'
```
:::

---

### Generate Recap Script

Generate a video script from the scraped article content.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_recap_generate_script", "project_id": "...", ... }
```

**Billing:** 3 credits

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `target_duration` | integer | No | `45` | Target video duration in seconds |
| `style` | string | No | `informative` | Script style: `informative`, `dramatic`, `casual`, `professional` |
| `language` | string | No | `en` | Output language |

**Response:**

```json
{
  "status": "script_generated",
  "title": "AI is Changing Creative Work Forever",
  "scenes": 5,
  "total_duration": 48,
  "script": {
    "title": "AI is Changing Creative Work Forever",
    "hook": "In 2026, AI didn't replace creators — it made them 10x faster.",
    "scenes": [
      {
        "scene_number": 1,
        "duration_seconds": 8,
        "narration": "Something incredible happened in the creative industry this year...",
        "visual_description": "Split screen: traditional artist vs AI-assisted creator",
        "text_overlay": "The Creative Revolution"
      }
    ],
    "outro_cta": "Read the full article — link in bio",
    "total_duration_seconds": 48,
    "mood": "informative",
    "tags": ["ai", "creativity", "technology"]
  }
}
```

::: code-group
```python [Python]
result = client.shorts.generate_recap_script("project-uuid",
    target_duration=60,
    style="dramatic",
    language="en"
)
print(f"Script: {result.script.title} ({result.total_duration}s, {result.scenes} scenes)")
```

```typescript [TypeScript]
const result = await client.shorts.generateRecapScript("project-uuid", {
  targetDuration: 60,
  style: "dramatic",
  language: "en"
});
console.log(`Script: ${result.script.title}`);
```

```go [Go]
payload := map[string]interface{}{
    "action":          "v2_recap_generate_script",
    "project_id":      "project-uuid",
    "target_duration": 60,
    "style":           "dramatic",
    "language":        "en",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)

var result map[string]interface{}
json.Unmarshal(respBody, &result)
fmt.Printf("Script: %s\n", result["title"])
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_recap_generate_script",
    "project_id": "project-uuid",
    "target_duration": 60,
    "style": "dramatic",
    "language": "en"
  }'
```
:::

---

### Get Recap Script

Retrieve the current script for a recap project.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_recap_get_script", "project_id": "..." }
```

::: code-group
```python [Python]
result = client.shorts.get_recap_script("project-uuid")
print(result.script)
```

```typescript [TypeScript]
const { script } = await client.shorts.getRecapScript("project-uuid");
console.log(script);
```

```go [Go]
payload := map[string]interface{}{
    "action":     "v2_recap_get_script",
    "project_id": "project-uuid",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_recap_get_script", "project_id": "project-uuid"}'
```
:::

---

## Series

Organize clips into episodic series with auto-numbering and narrative management.

::: info Transport
Series operations are **Console RPC** calls — `POST https://s1.fotohub.app/functions/v1/shorts-process` with an `action` field, authenticated with a **Supabase session token**.
:::

### List Series

Get all series for the authenticated user.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_list_series" }
```

**Response:**

```json
{
  "series": [
    {
      "id": "series-uuid",
      "title": "Startup Lessons",
      "description": "Weekly lessons from building in public",
      "status": "active",
      "episode_count": 12,
      "settings": {},
      "created_at": "2026-07-01T10:00:00Z",
      "updated_at": "2026-07-22T15:30:00Z"
    }
  ]
}
```

::: code-group
```python [Python]
series_list = client.shorts.list_series()
for s in series_list:
    print(f"{s.title} — {s.episode_count} episodes")
```

```typescript [TypeScript]
const { series } = await client.shorts.listSeries();
series.forEach(s => console.log(`${s.title} — ${s.episodeCount} episodes`));
```

```go [Go]
payload := map[string]interface{}{
    "action": "v2_list_series",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_list_series"}'
```
:::

---

### Create Series

Create a new clip series.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_create_series", ... }
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `title` | string | Yes | — | Series title |
| `description` | string | No | — | Series description |
| `brand_kit_id` | string | No | — | Brand kit to apply to all episodes |
| `settings` | object | No | `{}` | Series-level settings |

::: code-group
```python [Python]
series = client.shorts.create_series(
    title="Startup Lessons",
    description="Weekly lessons from building in public"
)
print(series.id)
```

```typescript [TypeScript]
const series = await client.shorts.createSeries({
  title: "Startup Lessons",
  description: "Weekly lessons from building in public"
});
console.log(series.id);
```

```go [Go]
payload := map[string]interface{}{
    "action":      "v2_create_series",
    "title":       "Startup Lessons",
    "description": "Weekly lessons from building in public",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)

var result map[string]interface{}
json.Unmarshal(respBody, &result)
fmt.Printf("Series ID: %s\n", result["id"])
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_create_series",
    "title": "Startup Lessons",
    "description": "Weekly lessons from building in public"
  }'
```
:::

---

### Get Series

Get series details with all episodes.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_get_series", "series_id": "..." }
```

**Response:**

```json
{
  "series": {
    "id": "series-uuid",
    "title": "Startup Lessons",
    "status": "active",
    "episode_count": 5
  },
  "episodes": [
    {
      "id": "clip-uuid",
      "user_title": "Episode 1: The Idea",
      "episode_number": 1,
      "duration": 32,
      "virality_score": 85,
      "status": "rendered",
      "renders": { "9:16": { "url": "..." } },
      "thumbnail_url": "https://..."
    }
  ]
}
```

::: code-group
```python [Python]
result = client.shorts.get_series("series-uuid")
print(f"{result.series.title} — {len(result.episodes)} episodes")
```

```typescript [TypeScript]
const { series, episodes } = await client.shorts.getSeries("series-uuid");
console.log(`${series.title} — ${episodes.length} episodes`);
```

```go [Go]
payload := map[string]interface{}{
    "action":    "v2_get_series",
    "series_id": "series-uuid",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_get_series", "series_id": "series-uuid"}'
```
:::

---

### Update Series

Update series metadata or status.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_update_series", "series_id": "...", ... }
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | No | New title |
| `description` | string | No | New description |
| `status` | string | No | `active`, `paused`, `completed`, `archived` |
| `settings` | object | No | Updated settings |

::: code-group
```python [Python]
client.shorts.update_series("series-uuid", title="Startup Lessons Season 2", status="active")
```

```typescript [TypeScript]
await client.shorts.updateSeries("series-uuid", {
  title: "Startup Lessons Season 2",
  status: "active"
});
```

```go [Go]
payload := map[string]interface{}{
    "action":    "v2_update_series",
    "series_id": "series-uuid",
    "title":     "Startup Lessons Season 2",
    "status":    "active",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_update_series",
    "series_id": "series-uuid",
    "title": "Startup Lessons Season 2"
  }'
```
:::

---

### Add Clips to Series

Add clips to a series with auto-incrementing episode numbers.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_add_to_series", "series_id": "...", "clip_ids": [...] }
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clip_ids` | string[] | Yes | Array of clip UUIDs to add |

**Response:**

```json
{
  "status": "added",
  "episodes": [
    { "clip_id": "clip-1", "episode_number": 6 },
    { "clip_id": "clip-2", "episode_number": 7 }
  ]
}
```

::: code-group
```python [Python]
result = client.shorts.add_to_series("series-uuid", clip_ids=["clip-1", "clip-2"])
print(f"Added {len(result.episodes)} episodes")
```

```typescript [TypeScript]
const result = await client.shorts.addToSeries("series-uuid", {
  clipIds: ["clip-1", "clip-2"]
});
console.log(`Added ${result.episodes.length} episodes`);
```

```go [Go]
payload := map[string]interface{}{
    "action":    "v2_add_to_series",
    "series_id": "series-uuid",
    "clip_ids":  []string{"clip-1", "clip-2"},
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_add_to_series",
    "series_id": "series-uuid",
    "clip_ids": ["clip-1", "clip-2"]
  }'
```
:::

---

### Reorder Series

Reorder episodes within a series.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_reorder_series", "series_id": "...", "order": [...] }
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `order` | string[] | Yes | Clip IDs in desired order |

::: code-group
```python [Python]
client.shorts.reorder_series("series-uuid", order=["clip-3", "clip-1", "clip-2"])
```

```typescript [TypeScript]
await client.shorts.reorderSeries("series-uuid", {
  order: ["clip-3", "clip-1", "clip-2"]
});
```

```go [Go]
payload := map[string]interface{}{
    "action":    "v2_reorder_series",
    "series_id": "series-uuid",
    "order":     []string{"clip-3", "clip-1", "clip-2"},
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_reorder_series",
    "series_id": "series-uuid",
    "order": ["clip-3", "clip-1", "clip-2"]
  }'
```
:::

---

### Delete Series

Delete a series (clips are preserved, just unlinked).

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_delete_series", "series_id": "..." }
```

::: code-group
```python [Python]
client.shorts.delete_series("series-uuid")
```

```typescript [TypeScript]
await client.shorts.deleteSeries("series-uuid");
```

```go [Go]
payload := map[string]interface{}{
    "action":    "v2_delete_series",
    "series_id": "series-uuid",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_delete_series", "series_id": "series-uuid"}'
```
:::

---

### AI Split Series

Use AI to analyze clips and intelligently group them into narrative episodes with cliffhangers.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_series_ai_split", "series_id": "...", ... }
```

**Billing:** 3 credits

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `clip_ids` | string[] | Yes | — | Clip UUIDs to split into episodes |
| `target_episodes` | integer | No | Auto (clips/3) | Number of target episodes |
| `style` | string | No | `narrative` | Split style: `narrative`, `educational`, `suspense` |

**Styles:**

| Style | Description |
|-------|-------------|
| `narrative` | Story arcs with beginning, middle, end per episode |
| `educational` | Progressive learning — each episode builds on prior |
| `suspense` | Tension building with dramatic hooks between episodes |

**Response:**

```json
{
  "series_id": "series-uuid",
  "episodes_created": 3,
  "plan": {
    "episodes": [
      {
        "episode_number": 1,
        "title": "The Discovery",
        "clip_ids": ["clip-1", "clip-4"],
        "hook_for_next": "But what they found next changed everything...",
        "narrative_note": "Sets up the mystery, introduces the characters"
      },
      {
        "episode_number": 2,
        "title": "The Twist",
        "clip_ids": ["clip-2", "clip-5"],
        "hook_for_next": "And that's when the real challenge began...",
        "narrative_note": "Reveals the complication, raises stakes"
      },
      {
        "episode_number": 3,
        "title": "The Resolution",
        "clip_ids": ["clip-3", "clip-6"],
        "hook_for_next": "",
        "narrative_note": "Climax and resolution, call to action"
      }
    ],
    "series_narrative": "A three-part journey of discovery and resolution"
  }
}
```

::: code-group
```python [Python]
result = client.shorts.ai_split_series("series-uuid",
    clip_ids=["clip-1", "clip-2", "clip-3", "clip-4", "clip-5", "clip-6"],
    target_episodes=3,
    style="narrative"
)
for ep in result.plan.episodes:
    print(f"Ep {ep.episode_number}: {ep.title} — {ep.hook_for_next}")
```

```typescript [TypeScript]
const result = await client.shorts.aiSplitSeries("series-uuid", {
  clipIds: ["clip-1", "clip-2", "clip-3", "clip-4", "clip-5", "clip-6"],
  targetEpisodes: 3,
  style: "narrative"
});
result.plan.episodes.forEach(ep =>
  console.log(`Ep ${ep.episodeNumber}: ${ep.title}`)
);
```

```go [Go]
payload := map[string]interface{}{
    "action":          "v2_series_ai_split",
    "series_id":       "series-uuid",
    "clip_ids":        []string{"clip-1", "clip-2", "clip-3", "clip-4", "clip-5", "clip-6"},
    "target_episodes": 3,
    "style":           "narrative",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)

var result map[string]interface{}
json.Unmarshal(respBody, &result)
fmt.Printf("Episodes created: %v\n", result["episodes_created"])
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_series_ai_split",
    "series_id": "series-uuid",
    "clip_ids": ["clip-1", "clip-2", "clip-3", "clip-4", "clip-5", "clip-6"],
    "target_episodes": 3,
    "style": "narrative"
  }'
```
:::

---

## Templates

Save and reuse caption/style configurations as templates.

::: info Transport
Template operations are **Console RPC** calls — `POST https://s1.fotohub.app/functions/v1/shorts-process` with an `action` field, authenticated with a **Supabase session token**.
:::

### List Templates

Get your templates plus popular public templates.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_list_templates" }
```

**Response:**

```json
{
  "templates": [
    {
      "id": "template-uuid",
      "name": "Viral Captions",
      "description": "Bold captions with emoji emphasis",
      "category": "captions",
      "is_public": false,
      "config": {
        "caption_style": "bold",
        "font_size": 48,
        "position": "center",
        "color": "#FFFFFF",
        "background": "gradient_dark"
      },
      "use_count": 23,
      "created_at": "2026-06-15T10:00:00Z"
    }
  ]
}
```

::: code-group
```python [Python]
templates = client.shorts.list_templates()
for t in templates:
    print(f"{t.name} ({t.category}) — used {t.use_count}x")
```

```typescript [TypeScript]
const { templates } = await client.shorts.listTemplates();
templates.forEach(t => console.log(`${t.name} — used ${t.useCount}x`));
```

```go [Go]
payload := map[string]interface{}{
    "action": "v2_list_templates",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_list_templates"}'
```
:::

---

### Create Template

Save current configuration as a reusable template.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_create_template", ... }
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | Yes | — | Template name |
| `config` | object | Yes | — | Configuration to save |
| `category` | string | No | `custom` | Category: `captions`, `reframe`, `render`, `custom` |
| `description` | string | No | — | Template description |

::: code-group
```python [Python]
template = client.shorts.create_template(
    name="My Brand Style",
    config={
        "caption_style": "karaoke",
        "font": "Inter Bold",
        "primary_color": "#7C3AED",
        "aspect_ratio": "9:16"
    },
    category="captions"
)
```

```typescript [TypeScript]
const template = await client.shorts.createTemplate({
  name: "My Brand Style",
  config: {
    captionStyle: "karaoke",
    font: "Inter Bold",
    primaryColor: "#7C3AED",
    aspectRatio: "9:16"
  },
  category: "captions"
});
```

```go [Go]
payload := map[string]interface{}{
    "action":   "v2_create_template",
    "name":     "My Brand Style",
    "category": "captions",
    "config": map[string]interface{}{
        "caption_style": "karaoke",
        "font":          "Inter Bold",
        "primary_color": "#7C3AED",
        "aspect_ratio":  "9:16",
    },
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_create_template",
    "name": "My Brand Style",
    "config": {
      "caption_style": "karaoke",
      "font": "Inter Bold",
      "primary_color": "#7C3AED"
    },
    "category": "captions"
  }'
```
:::

---

### Delete Template

Delete a template you own.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_delete_template", "template_id": "..." }
```

::: code-group
```python [Python]
client.shorts.delete_template("template-uuid")
```

```typescript [TypeScript]
await client.shorts.deleteTemplate("template-uuid");
```

```go [Go]
payload := map[string]interface{}{
    "action":      "v2_delete_template",
    "template_id": "template-uuid",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_delete_template", "template_id": "template-uuid"}'
```
:::

---

### Apply Template

Apply a template's configuration to a clip.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_apply_template", "template_id": "...", "clip_id": "..." }
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clip_id` | string | Yes | Clip UUID to apply template to |

::: code-group
```python [Python]
client.shorts.apply_template("template-uuid", clip_id="clip-uuid")
```

```typescript [TypeScript]
await client.shorts.applyTemplate("template-uuid", { clipId: "clip-uuid" });
```

```go [Go]
payload := map[string]interface{}{
    "action":      "v2_apply_template",
    "template_id": "template-uuid",
    "clip_id":     "clip-uuid",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_apply_template",
    "template_id": "template-uuid",
    "clip_id": "clip-uuid"
  }'
```
:::

---

## Analytics

Track usage, costs, and real-world performance of your shorts.

::: info Transport
Analytics operations are **Console RPC** calls — `POST https://s1.fotohub.app/functions/v1/shorts-process` with an `action` field, authenticated with a **Supabase session token**.
:::

### Dashboard

Aggregated analytics overview for your account.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_analytics_dashboard" }
```

**Response:**

```json
{
  "total_credits_used": 245.50,
  "total_events": 87,
  "avg_processing_time_ms": 23400,
  "event_breakdown": {
    "ingest": 15,
    "transcribe": 15,
    "clip": 12,
    "render": 20,
    "publish": 10,
    "script_generate": 8,
    "video_generate": 7
  },
  "projects": {
    "total": 15,
    "by_status": {
      "completed": 12,
      "processing": 1,
      "draft": 2
    }
  },
  "recent_events": [
    {
      "event_type": "render",
      "credits_used": 2.5,
      "processing_time_ms": 8500,
      "created_at": "2026-07-22T15:30:00Z"
    }
  ]
}
```

::: code-group
```python [Python]
dashboard = client.shorts.get_dashboard()
print(f"Credits used: {dashboard.total_credits_used}")
print(f"Projects: {dashboard.projects.total}")
```

```typescript [TypeScript]
const dashboard = await client.shorts.getDashboard();
console.log(`Credits used: ${dashboard.totalCreditsUsed}`);
```

```go [Go]
payload := map[string]interface{}{
    "action": "v2_analytics_dashboard",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_analytics_dashboard"}'
```
:::

---

### Cost Report

Detailed credit breakdown by operation type.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_analytics_cost_report" }
```

**Response:**

```json
{
  "total": 245.50,
  "by_operation": {
    "video_generate": 120.0,
    "render": 45.5,
    "transcribe": 30.0,
    "ingest": 20.0,
    "script_generate": 16.0,
    "publish": 10.0,
    "broll_suggest": 4.0
  },
  "event_count": 87
}
```

::: code-group
```python [Python]
report = client.shorts.get_cost_report()
print(f"Total: {report.total} credits")
for op, cost in report.by_operation.items():
    print(f"  {op}: {cost}")
```

```typescript [TypeScript]
const report = await client.shorts.getCostReport();
console.log(`Total: ${report.total} credits`);
```

```go [Go]
payload := map[string]interface{}{
    "action": "v2_analytics_cost_report",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_analytics_cost_report"}'
```
:::

---

### Submit Performance

Submit real-world performance metrics for a clip (views, likes, shares from social platforms).

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_submit_performance", "clip_id": "...", ... }
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `clip_id` | string | Yes | — | Clip UUID |
| `views` | integer | No | — | View count |
| `likes` | integer | No | — | Like count |
| `shares` | integer | No | — | Share count |
| `platform` | string | No | `tiktok` | Platform source |

::: tip
Submitting performance data improves the AI's virality scoring for future clips.
:::

::: code-group
```python [Python]
client.shorts.submit_performance("clip-uuid",
    views=50000,
    likes=3200,
    shares=450,
    platform="tiktok"
)
```

```typescript [TypeScript]
await client.shorts.submitPerformance("clip-uuid", {
  views: 50000,
  likes: 3200,
  shares: 450,
  platform: "tiktok"
});
```

```go [Go]
payload := map[string]interface{}{
    "action":   "v2_submit_performance",
    "clip_id":  "clip-uuid",
    "views":    50000,
    "likes":    3200,
    "shares":   450,
    "platform": "tiktok",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_submit_performance",
    "clip_id": "clip-uuid",
    "views": 50000,
    "likes": 3200,
    "shares": 450,
    "platform": "tiktok"
  }'
```
:::

---

## B-Roll AI

Get AI-powered suggestions for stock footage inserts to enhance your clips.

### Suggest B-Roll

Analyze a clip's transcript and suggest where to insert B-Roll footage with stock footage search queries.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_broll_suggest", "clip_id": "..." }
```

**Billing:** 2 credits

**Response:**

```json
{
  "clip_id": "clip-uuid",
  "suggestions": [
    {
      "timestamp": 5.2,
      "duration": 3,
      "search_query": "city skyline sunset timelapse",
      "description": "Aerial shot of city at golden hour",
      "rationale": "Visual break during narration about urban growth, creates emotional connection to the topic"
    },
    {
      "timestamp": 18.0,
      "duration": 2.5,
      "search_query": "hands typing code laptop",
      "description": "Close-up of developer working",
      "rationale": "Illustrates the technical concept being discussed in this segment"
    },
    {
      "timestamp": 32.5,
      "duration": 4,
      "search_query": "team celebration office",
      "description": "People high-fiving in modern office",
      "rationale": "Reinforces success story at the emotional peak of the narrative"
    }
  ]
}
```

::: code-group
```python [Python]
result = client.shorts.suggest_broll("clip-uuid")
for suggestion in result.suggestions:
    print(f"  @{suggestion.timestamp}s → search: '{suggestion.search_query}'")
    print(f"    {suggestion.rationale}")
```

```typescript [TypeScript]
const result = await client.shorts.suggestBRoll("clip-uuid");
result.suggestions.forEach(s =>
  console.log(`@${s.timestamp}s — ${s.searchQuery}: ${s.description}`)
);
```

```go [Go]
payload := map[string]interface{}{
    "action":  "v2_broll_suggest",
    "clip_id": "clip-uuid",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)

var result map[string]interface{}
json.Unmarshal(respBody, &result)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_broll_suggest", "clip_id": "clip-uuid"}'
```
:::

---

## Batch Render

Render multiple clips from a project in one request.

### Batch Render

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_batch_render", "project_id": "...", ... }
```

**Billing:** 1-3 credits per clip rendered

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `project_id` | string | Yes | — | Project UUID |
| `clip_ids` | string[] | No | All clips | Specific clips to render (omit for all) |
| `quality` | string | No | `social_1080p` | Render quality |
| `aspect_ratio` | string | No | `9:16` | Output aspect ratio |

**Response:**

```json
{
  "status": "started",
  "project_id": "project-uuid"
}
```

::: code-group
```python [Python]
result = client.shorts.batch_render(
    project_id="project-uuid",
    clip_ids=["clip-1", "clip-2", "clip-3"],
    quality="social_1080p",
    aspect_ratio="9:16"
)
```

```typescript [TypeScript]
const result = await client.shorts.batchRender({
  projectId: "project-uuid",
  clipIds: ["clip-1", "clip-2", "clip-3"],
  quality: "social_1080p",
  aspectRatio: "9:16"
});
```

```go [Go]
payload := map[string]interface{}{
    "action":       "v2_batch_render",
    "project_id":   "project-uuid",
    "clip_ids":     []string{"clip-1", "clip-2", "clip-3"},
    "quality":      "social_1080p",
    "aspect_ratio": "9:16",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_batch_render",
    "project_id": "project-uuid",
    "clip_ids": ["clip-1", "clip-2", "clip-3"],
    "quality": "social_1080p",
    "aspect_ratio": "9:16"
  }'
```
:::

::: warning
Batch render runs asynchronously. Poll the project or clips endpoint to check render status.
:::

---

## Publishing

Publish clips directly to social media platforms.

::: info Transport
Publishing operations are **Console RPC** calls — `POST https://s1.fotohub.app/functions/v1/shorts-process` with an `action` field, authenticated with a **Supabase session token**.
:::

### List Social Accounts

Get connected social media accounts.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_list_social_accounts" }
```

**Response:**

```json
{
  "accounts": [
    {
      "id": "account-uuid",
      "platform": "tiktok",
      "account_name": "@mychannel",
      "account_avatar_url": "https://...",
      "scopes": ["video.upload", "video.publish"],
      "token_expires_at": "2026-08-22T00:00:00Z"
    }
  ]
}
```

::: code-group
```python [Python]
accounts = client.shorts.list_social_accounts()
for acc in accounts:
    print(f"{acc.platform}: {acc.account_name}")
```

```typescript [TypeScript]
const { accounts } = await client.shorts.listSocialAccounts();
accounts.forEach(a => console.log(`${a.platform}: ${a.accountName}`));
```

```go [Go]
payload := map[string]interface{}{
    "action": "v2_list_social_accounts",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_list_social_accounts"}'
```
:::

---

### Publish Clip

Publish or schedule a clip to a social platform.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_publish", "clip_id": "...", "platform": "...", ... }
```

**Billing:** 1 credit per publish

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `clip_id` | string | Yes | — | Clip UUID (must be rendered) |
| `platform` | string | Yes | — | `youtube`, `tiktok`, `instagram`, `facebook`, `linkedin` |
| `account_id` | string | No | Default account | Social account UUID |
| `title` | string | No | Clip title | Post title |
| `description` | string | No | — | Post description/caption |
| `hashtags` | string[] | No | `[]` | Hashtags (without #) |
| `scheduled_at` | string | No | Immediate | ISO timestamp for scheduled publishing |

**Response:**

```json
{
  "queued": true,
  "queue_id": "queue-uuid",
  "scheduled_at": null,
  "platform": "tiktok"
}
```

::: code-group
```python [Python]
result = client.shorts.publish("clip-uuid",
    platform="tiktok",
    title="You won't believe this!",
    hashtags=["viral", "shorts", "fyp"],
    description="Part 1 of my startup journey"
)
```

```typescript [TypeScript]
const result = await client.shorts.publish({
  clipId: "clip-uuid",
  platform: "tiktok",
  title: "You won't believe this!",
  hashtags: ["viral", "shorts", "fyp"],
  description: "Part 1 of my startup journey"
});
```

```go [Go]
payload := map[string]interface{}{
    "action":      "v2_publish",
    "clip_id":     "clip-uuid",
    "platform":    "tiktok",
    "title":       "You won't believe this!",
    "hashtags":    []string{"viral", "shorts", "fyp"},
    "description": "Part 1 of my startup journey",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_publish",
    "clip_id": "clip-uuid",
    "platform": "tiktok",
    "title": "You won'\''t believe this!",
    "hashtags": ["viral", "shorts", "fyp"]
  }'
```
:::

---

### Batch Publish

Publish multiple clips to multiple platforms at once.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_batch_publish", ... }
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clip_ids` | string[] | Yes* | Clip UUIDs |
| `platforms` | string[] | Yes* | Platforms (cross-product with clip_ids) |
| `scheduled_at` | string | No | Schedule all for this time |
| `clips` | object[] | No* | Full control: array of individual publish configs |

*Either `clip_ids` + `platforms` OR `clips` is required.

**Response:**

```json
{
  "queued": 6,
  "results": [
    { "clip_id": "clip-1", "platform": "tiktok", "status": "queued" },
    { "clip_id": "clip-1", "platform": "youtube", "status": "queued" },
    { "clip_id": "clip-2", "platform": "tiktok", "status": "queued" }
  ]
}
```

::: code-group
```python [Python]
result = client.shorts.batch_publish(
    clip_ids=["clip-1", "clip-2", "clip-3"],
    platforms=["tiktok", "youtube"],
    scheduled_at="2026-07-23T09:00:00Z"
)
print(f"Queued: {result.queued}")
```

```typescript [TypeScript]
const result = await client.shorts.batchPublish({
  clipIds: ["clip-1", "clip-2", "clip-3"],
  platforms: ["tiktok", "youtube"],
  scheduledAt: "2026-07-23T09:00:00Z"
});
```

```go [Go]
payload := map[string]interface{}{
    "action":       "v2_batch_publish",
    "clip_ids":     []string{"clip-1", "clip-2", "clip-3"},
    "platforms":    []string{"tiktok", "youtube"},
    "scheduled_at": "2026-07-23T09:00:00Z",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_batch_publish",
    "clip_ids": ["clip-1", "clip-2", "clip-3"],
    "platforms": ["tiktok", "youtube"],
    "scheduled_at": "2026-07-23T09:00:00Z"
  }'
```
:::

---

### Get Publish Queue

View scheduled and completed publish jobs.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_get_publish_queue", ... }
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | string | No | All | Filter: `scheduled`, `published`, `failed`, `cancelled` |
| `limit` | integer | No | `50` | Max results (1-200) |

::: code-group
```python [Python]
queue = client.shorts.get_publish_queue(status="scheduled")
for item in queue:
    print(f"{item.clip_id} → {item.platform} at {item.scheduled_at}")
```

```typescript [TypeScript]
const { queue } = await client.shorts.getPublishQueue({ status: "scheduled" });
queue.forEach(q => console.log(`${q.clipId} → ${q.platform}`));
```

```go [Go]
payload := map[string]interface{}{
    "action": "v2_get_publish_queue",
    "status": "scheduled",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_get_publish_queue", "status": "scheduled"}'
```
:::

---

### Publishing Analytics

Overview of publishing performance.

```
POST https://s1.fotohub.app/functions/v1/shorts-process
{ "action": "v2_publish_analytics" }
```

**Response:**

```json
{
  "published": 45,
  "scheduled": 3,
  "failed": 2,
  "by_platform": {
    "tiktok": 20,
    "youtube": 15,
    "instagram": 10
  }
}
```

::: code-group
```python [Python]
analytics = client.shorts.get_publish_analytics()
print(f"Published: {analytics.published}, Scheduled: {analytics.scheduled}")
```

```typescript [TypeScript]
const analytics = await client.shorts.getPublishAnalytics();
console.log(`Published: ${analytics.published}`);
```

```go [Go]
payload := map[string]interface{}{
    "action": "v2_publish_analytics",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://s1.fotohub.app/functions/v1/shorts-process", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer YOUR_SESSION_TOKEN")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
respBody, _ := io.ReadAll(resp.Body)
fmt.Println(string(respBody))
```

```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_publish_analytics"}'
```
:::

---

## Pipeline REST API

The Pipeline REST API is a **stateless, step-based** interface for building your own shorts pipeline or calling from the SDK. It is a completely separate system from the Console RPC documented above.

| | |
|---|---|
| **Base URL** | `https://apis.fotohub.app` |
| **Auth** | API key — `Authorization: Bearer fh_live_...` |
| **Method** | `POST` to `/v1/shorts/<step>` |
| **State** | None. Each call takes a `video_url` and returns the step result. There are no server-side projects, clips, or `job_id`s — you pass the output URL of one step as the `video_url` of the next. |

Every endpoint returns the same envelope: the operation name, credits charged, a billing summary, and the step-specific fields from the processing engine:

```json
{
  "operation": "generate-clips",
  "credits_used": 5,
  "billing": { "success": true, "remaining_credits": 995 },
  "...": "step-specific fields"
}
```

::: tip Auth reminder
These endpoints use your `fh_live_*` API key, **not** a Supabase session token. Get your API key at [fotohub.app/console](https://fotohub.app/console).
:::

### Ingest

Ingest a source video into the pipeline (downloads and normalizes it).

```
POST /v1/shorts/ingest
```

**Billing:** 2 credits

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | — | URL of the source video to process |
| `title` | string | No | — | Optional title for the video |

::: code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/shorts/ingest \
  -H "Authorization: Bearer fh_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Best Moments"
  }'
```

```python [Python]
import requests

resp = requests.post(
    "https://apis.fotohub.app/v1/shorts/ingest",
    headers={"Authorization": "Bearer fh_live_..."},
    json={"video_url": "https://youtube.com/watch?v=dQw4w9WgXcQ", "title": "Best Moments"},
)
data = resp.json()
print(data["operation"], data["credits_used"])
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/shorts/ingest", {
  method: "POST",
  headers: {
    Authorization: "Bearer fh_live_...",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    video_url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Best Moments",
  }),
});
const data = await resp.json();
console.log(data.operation, data.credits_used);
```
:::

---

### Transcribe

Transcribe video audio with WhisperX (23 languages supported).

```
POST /v1/shorts/transcribe
```

**Billing:** 2 credits

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | — | URL of the video to transcribe |
| `language` | string | No | `auto` | Source language (`auto` or ISO code: `en`, `pl`, `de`, `fr`, `es`, ...) |
| `model` | string | No | `whisperx` | Transcription model |

```bash
curl -X POST https://apis.fotohub.app/v1/shorts/transcribe \
  -H "Authorization: Bearer fh_live_..." \
  -H "Content-Type: application/json" \
  -d '{"video_url": "https://.../video.mp4", "language": "auto"}'
```

---

### Detect Scenes

Detect scene changes using YOLOv8 and visual analysis.

```
POST /v1/shorts/detect-scenes
```

**Billing:** 3 credits

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | — | URL of the video for scene detection |
| `sensitivity` | float | No | `0.5` | Detection sensitivity, `0.1`–`1.0` (`0.1` = fewer scenes, `1.0` = more) |

```bash
curl -X POST https://apis.fotohub.app/v1/shorts/detect-scenes \
  -H "Authorization: Bearer fh_live_..." \
  -H "Content-Type: application/json" \
  -d '{"video_url": "https://.../video.mp4", "sensitivity": 0.5}'
```

---

### Generate Clips

AI-powered clip selection and ranking.

```
POST /v1/shorts/generate-clips
```

**Billing:** 5 credits

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | — | URL of the source video |
| `transcript` | string | No | — | Pre-computed transcript (if available) |
| `num_clips` | integer | No | `5` | Number of clips to generate (`1`–`20`) |
| `min_duration` | integer | No | `15` | Minimum clip duration in seconds (`5`–`60`) |
| `max_duration` | integer | No | `60` | Maximum clip duration in seconds (`15`–`180`) |
| `style` | string | No | `viral` | Clip style: `viral`, `informative`, `storytelling`, `highlight` |

::: code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/shorts/generate-clips \
  -H "Authorization: Bearer fh_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://.../video.mp4",
    "num_clips": 5,
    "min_duration": 15,
    "max_duration": 60,
    "style": "viral"
  }'
```

```python [Python]
import requests

resp = requests.post(
    "https://apis.fotohub.app/v1/shorts/generate-clips",
    headers={"Authorization": "Bearer fh_live_..."},
    json={
        "video_url": "https://.../video.mp4",
        "num_clips": 5,
        "min_duration": 15,
        "max_duration": 60,
        "style": "viral",
    },
)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/shorts/generate-clips", {
  method: "POST",
  headers: {
    Authorization: "Bearer fh_live_...",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    video_url: "https://.../video.mp4",
    num_clips: 5,
    min_duration: 15,
    max_duration: 60,
    style: "viral",
  }),
});
console.log(await resp.json());
```
:::

---

### Captions

Generate animated captions for a video clip.

```
POST /v1/shorts/captions
```

**Billing:** 2 credits

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | — | URL of the video |
| `style` | string | No | `karaoke` | Caption style: `karaoke`, `subtitle`, `bold`, `minimal`, `animated` |
| `language` | string | No | `auto` | Caption language |
| `font` | string | No | — | Font family for captions |
| `position` | string | No | `bottom` | Position: `top`, `center`, `bottom` |

```bash
curl -X POST https://apis.fotohub.app/v1/shorts/captions \
  -H "Authorization: Bearer fh_live_..." \
  -H "Content-Type: application/json" \
  -d '{"video_url": "https://.../clip.mp4", "style": "karaoke", "position": "bottom"}'
```

---

### Reframe

Smart reframe — change aspect ratio with intelligent subject tracking.

```
POST /v1/shorts/reframe
```

**Billing:** 3 credits

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | — | URL of the source video |
| `target_ratio` | string | No | `9:16` | Target aspect ratio: `9:16`, `1:1`, `4:5`, `16:9` |
| `focus` | string | No | `auto` | Focus tracking: `auto` (face/subject), `center`, `rule-of-thirds` |

```bash
curl -X POST https://apis.fotohub.app/v1/shorts/reframe \
  -H "Authorization: Bearer fh_live_..." \
  -H "Content-Type: application/json" \
  -d '{"video_url": "https://.../clip.mp4", "target_ratio": "9:16", "focus": "auto"}'
```

---

### Render

Render a final short-form video with captions and effects.

```
POST /v1/shorts/render
```

**Billing:** 5 credits

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | — | URL of the source clip |
| `captions` | boolean | No | `true` | Include captions |
| `caption_style` | string | No | `karaoke` | Caption style |
| `aspect_ratio` | string | No | `9:16` | Output aspect ratio |
| `quality` | string | No | `high` | Render quality: `draft`, `medium`, `high` |
| `watermark` | boolean | No | `false` | Add FOTOhub watermark |

```bash
curl -X POST https://apis.fotohub.app/v1/shorts/render \
  -H "Authorization: Bearer fh_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://.../clip.mp4",
    "captions": true,
    "caption_style": "karaoke",
    "aspect_ratio": "9:16",
    "quality": "high",
    "watermark": false
  }'
```

---

### Agent Mode

Fully automated pipeline — input one video URL and receive multiple finished shorts. The agent runs the whole pipeline internally: ingest → transcribe → detect scenes → generate clips → captions → reframe → render.

```
POST /v1/shorts/agent
```

**Billing:** 15 credits (full pipeline)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | — | URL of the source video |
| `num_shorts` | integer | No | `3` | Number of shorts to generate (`1`–`10`) |
| `style` | string | No | `viral` | Content style: `viral`, `informative`, `storytelling`, `highlight` |
| `aspect_ratio` | string | No | `9:16` | Output aspect ratio: `9:16`, `1:1`, `4:5` |
| `captions` | boolean | No | `true` | Auto-generate captions |
| `caption_style` | string | No | `karaoke` | Caption style for all clips |
| `language` | string | No | `auto` | Content language |

::: code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/shorts/agent \
  -H "Authorization: Bearer fh_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "num_shorts": 3,
    "style": "viral",
    "aspect_ratio": "9:16",
    "captions": true,
    "caption_style": "karaoke",
    "language": "auto"
  }'
```

```python [Python]
import requests

resp = requests.post(
    "https://apis.fotohub.app/v1/shorts/agent",
    headers={"Authorization": "Bearer fh_live_..."},
    json={
        "video_url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
        "num_shorts": 3,
        "style": "viral",
        "aspect_ratio": "9:16",
        "captions": True,
        "caption_style": "karaoke",
        "language": "auto",
    },
)
data = resp.json()
print(f"{data['operation']} — {data['credits_used']} credits")
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/shorts/agent", {
  method: "POST",
  headers: {
    Authorization: "Bearer fh_live_...",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    video_url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    num_shorts: 3,
    style: "viral",
    aspect_ratio: "9:16",
    captions: true,
    caption_style: "karaoke",
    language: "auto",
  }),
});
const data = await resp.json();
console.log(`${data.operation} — ${data.credits_used} credits`);
```
:::

---

## Pricing & Credits

**Pipeline REST API** (`/v1/shorts/*`, API key):

| Operation | Credits | Notes |
|-----------|---------|-------|
| Ingest | 2 | Per video |
| Transcribe | 2 | Per video |
| Detect Scenes | 3 | Per video |
| Generate Clips | 5 | Per video (AI analysis) |
| Captions | 2 | Per video |
| Reframe | 3 | Per video |
| Render | 5 | Per clip |
| Agent Mode (full pipeline) | 15 | All steps combined |

**Console RPC** (`shorts-process`, session token):

| Operation | Credits | Notes |
|-----------|---------|-------|
| Create Project | 0 | Free |
| Render Clip | 1-3 | Per clip (depends on quality) |
| Script Generation | 2 | Per script |
| Storyboard | 2 | Per storyboard |
| Video Generation (AI) | 15-50 | Per scene (model + resolution) |
| Article Scrape | 1 | Per article |
| Recap Script | 3 | Per script |
| B-Roll AI Suggest | 2 | Per clip |
| Series AI Split | 3 | Per split operation |
| Publish | 1 | Per platform per clip |
| Batch Render | 1-3 | Per clip |

::: tip Subscription Plans
Higher-tier plans receive discounted credit rates. See [fotohub.app/pricing](https://fotohub.app/pricing) for plan details.
:::

---

## Rate Limits

| Tier | Requests/min | Concurrent pipelines | Notes |
|------|-------------|---------------------|-------|
| Free | 10 | 1 | |
| Pro | 30 | 3 | |
| Business | 60 | 10 | |
| Enterprise | Custom | Custom | Contact sales |

Rate limit headers are included in every response:
- `X-RateLimit-Limit` — max requests per window
- `X-RateLimit-Remaining` — remaining requests
- `X-RateLimit-Reset` — window reset time (unix timestamp)

---

## Error Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| `400` | Bad Request | Invalid parameters, missing required fields |
| `401` | Unauthorized | Invalid or expired API key |
| `403` | Forbidden | Insufficient credits, feature not enabled |
| `404` | Not Found | Project/clip/series doesn't exist or belongs to another user |
| `409` | Conflict | Pipeline already running for this project |
| `422` | Unprocessable | Content extraction failed (e.g., empty article) |
| `429` | Rate Limited | Too many requests — wait and retry |
| `500` | Server Error | Internal error — retry or contact support |
| `502` | Bad Gateway | Upstream service unavailable (e.g., video download failed) |

All errors return:
```json
{
  "detail": "Human-readable error message"
}
```

---

## Webhooks

Set a `webhook_url` when creating a project to receive status updates.

**Webhook Payload:**

```json
{
  "event": "project.completed",
  "project_id": "uuid",
  "status": "completed",
  "clips_count": 5,
  "processing_time_ms": 45000,
  "timestamp": "2026-07-22T15:30:00Z"
}
```

**Events:**
- `project.started` — Pipeline started
- `project.step_completed` — Individual step finished
- `project.completed` — All steps done, clips available
- `project.failed` — Pipeline failed
- `publish.completed` — Clip published to platform
- `publish.failed` — Publishing failed

---

## WebSocket Progress

Connect to WebSocket for real-time pipeline progress.

```
wss://gpu.fotohub.app/shorts-engine/ws/shorts/{project_id}
```

**Messages received:**

```json
{"type": "step_start", "step": "transcribe", "progress": 0.2}
{"type": "step_complete", "step": "transcribe", "progress": 0.4}
{"type": "clip_found", "clip_id": "...", "score": 87, "title": "..."}
{"type": "complete", "clips_count": 5}
{"type": "error", "message": "..."}
```

**Messages you can send:**
- `"ping"` — receive `{"type": "pong"}`
- `"cancel"` — cancel pipeline

---

## Supported Languages

| Code | Language | Code | Language |
|------|----------|------|----------|
| `en` | English | `fr` | French |
| `es` | Spanish | `de` | German |
| `pt` | Portuguese | `it` | Italian |
| `pl` | Polish | `nl` | Dutch |
| `ru` | Russian | `uk` | Ukrainian |
| `ja` | Japanese | `ko` | Korean |
| `zh` | Chinese | `ar` | Arabic |
| `hi` | Hindi | `tr` | Turkish |
| `sv` | Swedish | `da` | Danish |
| `fi` | Finnish | `no` | Norwegian |
| `cs` | Czech | `ro` | Romanian |
| `hu` | Hungarian | | |

---

## Caption Styles

| Style | Description | Best For |
|-------|-------------|----------|
| `karaoke` | Word-by-word highlight, bold pop | TikTok, Reels |
| `subtitle` | Classic bottom subtitles | YouTube Shorts |
| `bold` | Large centered bold text | Motivational, hooks |
| `minimal` | Small, clean, unobtrusive | Professional content |
| `animated` | Motion graphics captions | Creative, trendy |

## Asynchronous Clipping Pipeline (`/v1/shorts/clips/*`)

For long-form video processing (podcasts, webinars, interviews, YouTube videos), the asynchronous clipping pipeline ingests the source, transcribes speech, detects viral moments, computes virality and retention scores, reframes to 9:16 vertical video, generates styled captions, cuts filler words, creates video covers, and renders finished clips in the background.

Billed once per job at the `shorts_clip_job` rate (see [`GET /v1/pricing`](/api/billing)).

---

### Endpoints

| Method | Endpoint | Description | Cost |
|--------|----------|-------------|------|
| `POST` | `/v1/shorts/clips` | Submit a clipping job (returns `202 Accepted` immediately) | `shorts_clip_job` rate |
| `GET` | `/v1/shorts/clips` | List your jobs (paginated, newest first) | Free |
| `GET` | `/v1/shorts/clips/{job_id}` | Retrieve job status, live progress, and rendered clips | Free |
| `POST` | `/v1/shorts/clips/{job_id}/cancel` | Cancel a running clipping job | Free |
| `GET` | `/v1/shorts/clips/events` | Webhook event schema & signature catalog | Free |
| `POST` | `/v1/shorts/clips/webhook-test` | Send test payload to verify HMAC signature | Free |
| `GET` | `/v1/shorts/clips/webhook-deliveries` | Audit log of recent webhook delivery attempts | Free |

---

### 1. Submit Clipping Job

```
POST /v1/shorts/clips
```

#### Parameters

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `source_url` | string | **Yes** | — | Public video URL or storage path. |
| `source_type` | string | No | auto | `url`, `youtube`, `tiktok`, `instagram`, `vimeo`, `upload`, `fh_library`. |
| `title` | string | No | `null` | Job title (max 200 chars). |
| `language` | string | No | auto | ISO language code (e.g. `en`, `pl`, `es`). |
| `max_clips` | integer | No | `10` | Maximum number of clips to extract (1 to 30). |
| `min_duration` | integer | No | `15` | Minimum clip duration in seconds (5 to 180). |
| `max_duration` | integer | No | `60` | Maximum clip duration in seconds (10 to 300). |
| `aspect_ratio` | string | No | `"9:16"` | Target aspect ratio: `"9:16"`, `"1:1"`, `"4:5"`, `"16:9"`. |
| `caption_style` | string | No | `"hormozi"` | Caption style: `"hormozi"`, `"beasty"`, `"clean"`, `"karaoke"`, `"minimal"`, `"neon"`, `"typewriter"`, `"bold"`, `"none"`. |
| `captions` | boolean | No | `true` | Generate animated captions. |
| `reframe` | boolean | No | `true` | Smart face-tracking vertical reframing. |
| `hooks` | boolean | No | `true` | Extract title hooks and highlights. |
| `covers` | boolean | No | `true` | Auto-generate cover thumbnails. |
| `broll` | boolean | No | `false` | Insert contextual AI B-roll clips. |
| `enhance_audio` | boolean | No | `true` | Studio sound clarity enhancement. |
| `remove_filler` | boolean | No | `true` | Remove filler words ("um", "uh", pauses). |
| `retention_model`| boolean | No | `true` | Score clips using AI virality and retention models. |
| `webhook_url` | string | No | `null` | HTTPS endpoint called when job moves or finishes. |
| `webhook_secret`| string | No | `null` | Secret used to compute HMAC-SHA256 signature in `X-FotoHub-Signature`. |
| `webhook_events`| string[] | No | all | List of events to receive (default: all). |
| `reference` | string | No | `null` | Client ID echoed in every webhook payload. |

#### Response Example (`202 Accepted`)

```json
{
  "operation": "clip_job",
  "cost_usd": 0.35,
  "job_id": "8f3b2c1a-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "status": "queued",
  "reference": "episode-42",
  "poll_url": "/api/v2/clipping/jobs/8f3b2c1a-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "webhook": true,
  "estimated_clips": 10
}
```

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_YOUR_API_KEY",
    "Content-Type": "application/json",
}
payload = {
    "source_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Podcast Episode 42",
    "max_clips": 5,
    "caption_style": "hormozi",
    "webhook_url": "https://myapp.com/webhooks/shorts",
    "webhook_secret": "whsec_supersecretkey123456",
    "reference": "ep-42",
}

resp = requests.post("https://apis.fotohub.app/v1/shorts/clips", headers=headers, json=payload)
print(resp.status_code, resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/shorts/clips", {
  method: "POST",
  headers: {
    Authorization: "Bearer fh_live_YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    source_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Podcast Episode 42",
    max_clips: 5,
    caption_style: "hormozi",
    webhook_url: "https://myapp.com/webhooks/shorts",
    webhook_secret: "whsec_supersecretkey123456",
    reference: "ep-42",
  }),
});
console.log(resp.status, await resp.json());
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
		"source_url":     "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		"title":          "Podcast Episode 42",
		"max_clips":      5,
		"caption_style":  "hormozi",
		"webhook_url":    "https://myapp.com/webhooks/shorts",
		"webhook_secret": "whsec_supersecretkey123456",
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/shorts/clips", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println(resp.StatusCode, string(respBody))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/shorts/clips \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Podcast Episode 42",
    "max_clips": 5,
    "caption_style": "hormozi",
    "webhook_url": "https://myapp.com/webhooks/shorts",
    "webhook_secret": "whsec_supersecretkey123456"
  }'
```

:::

---

### 2. Poll Job Status & Clips

```
GET /v1/shorts/clips/{job_id}?clips=true
```

#### Response Example

```json
{
  "job_id": "8f3b2c1a-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "status": "completed",
  "running": false,
  "steps_completed": ["ingest", "transcribe", "detect_scenes", "clip", "captions", "reframe", "render"],
  "clip_count": 3,
  "clips": [
    {
      "id": "clip_01",
      "title": "Why compounding works",
      "hook": "The biggest mistake people make in their 20s",
      "start": 142.5,
      "end": 185.0,
      "duration": 42.5,
      "virality_score": 94,
      "retention_score": 88,
      "blended_score": 91,
      "cover_url": "https://s3point.fotohub.app/covers/clip_01.jpg",
      "outputs": [
        {
          "url": "https://s3point.fotohub.app/renders/clip_01.mp4",
          "aspect_ratio": "9:16",
          "width": 1080,
          "height": 1920,
          "duration": 42.5,
          "size_mb": 18.2
        }
      ]
    }
  ]
}
```

---

### 3. Webhook Delivery & Signature Verification

When `webhook_url` is specified, FOTOhub sends HTTP `POST` requests when job events occur.

#### Events
- `shorts.job.started`: Pipeline processing started.
- `shorts.clip.rendered`: A single clip finished rendering.
- `shorts.job.completed`: All clips finished; includes full clip array and scores.
- `shorts.job.failed`: Processing failed; includes error details and partial clips.

#### Verifying Signatures
If `webhook_secret` is configured, FOTOhub includes the header `X-FotoHub-Signature`:

```python
import hashlib, hmac

expected_signature = hmac.new(
    webhook_secret.encode("utf-8"),
    raw_request_body_bytes,
    hashlib.sha256
).hexdigest()

is_valid = hmac.compare_digest(expected_signature, request.headers["X-FotoHub-Signature"])
```
