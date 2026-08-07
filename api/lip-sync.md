# AI Lip-Sync

Generate perfectly synchronized lip-synced videos by combining face video footage with any audio track. FOTOhub's Lip-Sync API supports three distinct engines optimized for different quality and speed requirements — from real-time previews to ultra-high-fidelity 4K production output.

::: info Overview
The Lip-Sync API is asynchronous — submit a job and receive a `job_id` for polling or webhook delivery. All engines accept standard video and audio formats, and output MP4 or WebM with configurable resolution. Credits are charged per job regardless of input duration (within model limits).
:::

---

## Engine Comparison

| Engine | Architecture | Max Resolution | Max Duration | Speed | Credits | Best For |
|--------|-------------|---------------|--------------|-------|---------|----------|
| `musetalk` | Real-time feed-forward | 512x512 | 60s | ~3s/frame | 8 | Real-time previews, drafts, social media |
| `latentsync` | Diffusion-based | 1024x1024 | 30s | ~8s/frame | 15 | HD content, YouTube, presentations |
| `facefusion` | Multi-stage pipeline | 3840x2160 (4K) | 120s | ~15s/frame | 20 | Film production, commercials, broadcast |

### Engine Details

#### MuseTalk (Real-Time Preview)

A lightweight feed-forward model optimized for speed. Processes video at near real-time rates, making it ideal for rapid iteration during the creative process. Supports frontal face angles (0-15 degrees) and works well with webcam-quality footage.

- **Architecture:** Single-pass neural network, no diffusion steps
- **Face angles:** 0-15 degrees from frontal
- **Audio requirements:** Clean speech, single speaker
- **Output FPS:** Matches source (up to 30fps)
- **Multi-face:** Not supported (single face only)

#### LatentSync (HD Diffusion)

A diffusion-based model that produces natural mouth interior detail including teeth and tongue movement. Handles moderate face angles and delivers broadcast-ready HD output suitable for professional presentations, YouTube content, and corporate videos.

- **Architecture:** Latent diffusion with temporal attention
- **Face angles:** 0-30 degrees from frontal
- **Audio requirements:** Clean speech preferred, handles mild background noise
- **Output FPS:** Matches source (up to 30fps)
- **Multi-face:** Supported (select via `face_index`)

#### FaceFusion (Ultra Multi-Stage)

A production-grade multi-stage pipeline combining face detection, lip synchronization, expression restoration, and optional super-resolution. Produces broadcast-quality output up to 4K resolution with the most natural facial expressions of all engines.

- **Architecture:** Detection, sync, expression, super-resolution pipeline
- **Face angles:** 0-45 degrees from frontal
- **Audio requirements:** Any quality (built-in noise filtering)
- **Output FPS:** Matches source (up to 60fps)
- **Multi-face:** Supported (select via `face_index`)
- **4K upscale:** Built-in super-resolution for lower-res sources

::: tip Choosing an Engine
Start with `musetalk` for quick iterations and preview. Once you are happy with the audio timing, switch to `latentsync` or `facefusion` for the final render. This workflow saves credits during the creative process.
:::

---

## Generate Lip-Synced Video

### Endpoint

```
POST /v1/video/lip-sync
```

**Authentication:** Bearer token (API key)
**Billing:** 8-20 credits per generation (varies by engine)
**Processing:** Asynchronous — returns a `job_id` for polling

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | **Yes** | — | URL to the source face video. Supported formats: MP4, MOV, WebM. Must contain a clearly visible face. |
| `audio_url` | string | **Yes** | — | URL to the audio track for lip-sync. Supported formats: MP3, WAV, M4A, OGG. Speech audio works best. |
| `model` | string | No | `"musetalk"` | Engine identifier: `"musetalk"`, `"latentsync"`, or `"facefusion"`. |
| `output_format` | string | No | `"mp4"` | Output video format: `"mp4"` or `"webm"`. |
| `output_resolution` | string | No | `"auto"` | Output resolution: `"auto"` (match source), `"512"`, `"720"`, `"1080"`, `"4k"`. Higher resolutions require `facefusion` model. |
| `face_detection_threshold` | float | No | `0.5` | Confidence threshold for face detection. Range: 0.1-0.9. Lower values detect more faces but may produce artifacts. |
| `enhance_face` | boolean | No | `false` | Apply face restoration enhancement to the output. Improves quality for low-resolution source videos. Adds ~20% processing time. |
| `padding_top` | integer | No | `0` | Extra padding above face bounding box in pixels. Useful when hairstyles are cropped. Range: 0-100. |
| `padding_bottom` | integer | No | `0` | Extra padding below face bounding box in pixels. Range: 0-100. |
| `webhook_url` | string | No | — | URL to receive a POST callback when the job completes. The payload includes the full response body. |
| `trim_audio` | boolean | No | `true` | If audio is longer than video, trim audio to match video length. If `false`, video frames will loop to match audio length. |
| `face_index` | integer | No | `0` | When multiple faces are detected, select which face to sync (0-indexed). |

### Request Example

```json
{
  "video_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/presenter.mp4",
  "audio_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/narration_en.mp3",
  "model": "latentsync",
  "output_format": "mp4",
  "enhance_face": true,
  "webhook_url": "https://your-app.com/webhooks/lip-sync"
}
```

### Response

```json
{
  "job_id": "ls_7f3a9b2c4e1d",
  "status": "processing",
  "model": "latentsync",
  "estimated_time_seconds": 45,
  "credits_reserved": 15,
  "created_at": "2026-07-22T14:30:00Z"
}
```

### Completed Job Response (via polling or webhook)

```json
{
  "job_id": "ls_7f3a9b2c4e1d",
  "status": "completed",
  "model": "latentsync",
  "credits_used": 15,
  "billing": {
    "method": "credits",
    "credits_used": 15,
    "usd_charged": 0,
    "pln_charged": 0
  },
  "output": {
    "video_url": "https://s1.fotohub.app/storage/v1/object/public/generations/lipsync_7f3a9b2c4e1d.mp4",
    "duration_seconds": 24.5,
    "resolution": "1024x1024",
    "file_size_mb": 18.3
  },
  "metadata": {
    "faces_detected": 1,
    "face_index_used": 0,
    "processing_time_ms": 42300,
    "source_video_fps": 30,
    "output_fps": 30
  },
  "created_at": "2026-07-22T14:30:00Z",
  "completed_at": "2026-07-22T14:30:42Z"
}
```

### Error Response

```json
{
  "error": {
    "code": "no_face_detected",
    "message": "No face was detected in the source video. Ensure a clearly visible face is present in the first frame.",
    "credits_refunded": 15
  }
}
```

Common error codes:

| Code | Description |
|------|-------------|
| `no_face_detected` | No face found in source video |
| `audio_too_long` | Audio exceeds model max duration |
| `video_too_short` | Video is under 1 second |
| `invalid_format` | Unsupported video or audio format |
| `resolution_exceeded` | Requested resolution exceeds model capability |
| `processing_failed` | Internal rendering error (credits refunded) |

---

## List Available Models

### Endpoint

```
GET /v1/video/lip-sync/models
```

**Authentication:** Bearer token (API key)
**Billing:** Free (no credits charged)

### Response

```json
{
  "models": [
    {
      "id": "musetalk",
      "name": "MuseTalk 1.5",
      "provider": "Tencent",
      "description": "Fast real-time lip synchronization optimized for speed and low latency.",
      "max_resolution": "512x512",
      "max_duration_seconds": 60,
      "credits": 8,
      "supports_enhance": true,
      "supports_multi_face": false,
      "output_formats": ["mp4", "webm"],
      "status": "available"
    },
    {
      "id": "latentsync",
      "name": "LatentSync 1.6",
      "provider": "ByteDance",
      "description": "Diffusion-based lip sync with high accuracy and natural mouth movement.",
      "max_resolution": "1024x1024",
      "max_duration_seconds": 30,
      "credits": 15,
      "supports_enhance": true,
      "supports_multi_face": true,
      "output_formats": ["mp4", "webm"],
      "status": "available"
    },
    {
      "id": "facefusion",
      "name": "FaceFusion 3.x",
      "provider": "FaceFusion",
      "description": "Ultra-quality multi-stage pipeline with expression restoration and 4K support.",
      "max_resolution": "3840x2160",
      "max_duration_seconds": 120,
      "credits": 20,
      "supports_enhance": true,
      "supports_multi_face": true,
      "output_formats": ["mp4", "webm"],
      "status": "available"
    }
  ]
}
```

---

## Check Job Status

### Endpoint

```
GET /v1/video/lip-sync/status/{job_id}
```

**Authentication:** Bearer token (API key)
**Billing:** Free (no credits charged)

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `job_id` | string | The job identifier returned from the generation endpoint |

### Response (Processing)

```json
{
  "job_id": "ls_7f3a9b2c4e1d",
  "status": "processing",
  "progress": 65,
  "estimated_remaining_seconds": 15,
  "model": "latentsync"
}
```

### Response (Completed)

Returns the full completed job response as shown in the generation endpoint section above.

### Response (Failed)

```json
{
  "job_id": "ls_7f3a9b2c4e1d",
  "status": "failed",
  "error": {
    "code": "processing_failed",
    "message": "Face tracking lost at frame 342. Ensure the face remains visible throughout the video.",
    "credits_refunded": 15
  }
}
```

### Status Values

| Status | Description |
|--------|-------------|
| `queued` | Job is waiting in the processing queue |
| `processing` | Actively generating the lip-synced video |
| `completed` | Done — output URL available |
| `failed` | Processing failed — credits refunded |

---

## Code Examples

### Basic Lip-Sync Generation

Submit a lip-sync job with the default MuseTalk engine for fast results.

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Generate lip-synced video with fast engine
job = client.video.lip_sync(
    video_url="https://example.com/presenter.mp4",
    audio_url="https://example.com/narration.mp3",
    model="musetalk"
)

print(f"Job started: {job.job_id}")
print(f"Estimated time: {job.estimated_time_seconds}s")

# Poll until complete
result = client.video.lip_sync_wait(job.job_id, poll_interval=3)

print(f"Output: {result.output.video_url}")
print(f"Credits used: {result.credits_used}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Generate lip-synced video with fast engine
const job = await client.video.lipSync({
  videoUrl: "https://example.com/presenter.mp4",
  audioUrl: "https://example.com/narration.mp3",
  model: "musetalk",
});

console.log(`Job started: ${job.jobId}`);
console.log(`Estimated time: ${job.estimatedTimeSeconds}s`);

// Poll until complete
const result = await client.video.lipSyncWait(job.jobId, { pollInterval: 3000 });

console.log(`Output: ${result.output.videoUrl}`);
console.log(`Credits used: ${result.creditsUsed}`);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

func main() {
	// Submit lip-sync job
	payload := map[string]interface{}{
		"video_url": "https://example.com/presenter.mp4",
		"audio_url": "https://example.com/narration.mp3",
		"model":     "musetalk",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/lip-sync", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var job map[string]interface{}
	json.Unmarshal(respBody, &job)
	jobID := job["job_id"].(string)
	fmt.Printf("Job started: %s\n", jobID)

	// Poll for completion
	for {
		pollReq, _ := http.NewRequest("GET",
			fmt.Sprintf("https://apis.fotohub.app/v1/video/lip-sync/status/%s", jobID), nil)
		pollReq.Header.Set("Authorization", "Bearer fh_live_your_api_key")

		pollResp, _ := http.DefaultClient.Do(pollReq)
		pollBody, _ := io.ReadAll(pollResp.Body)
		pollResp.Body.Close()

		var status map[string]interface{}
		json.Unmarshal(pollBody, &status)

		if status["status"] == "completed" {
			output := status["output"].(map[string]interface{})
			fmt.Printf("Output: %s\n", output["video_url"])
			break
		} else if status["status"] == "failed" {
			fmt.Printf("Failed: %v\n", status["error"])
			break
		}
		fmt.Printf("Progress: %.0f%%\n", status["progress"])
		time.Sleep(3 * time.Second)
	}
}
```

```bash [cURL]
# Submit lip-sync job
JOB=$(curl -s -X POST https://apis.fotohub.app/v1/video/lip-sync \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/presenter.mp4",
    "audio_url": "https://example.com/narration.mp3",
    "model": "musetalk"
  }')

JOB_ID=$(echo $JOB | jq -r '.job_id')
echo "Job started: $JOB_ID"

# Poll for completion
while true; do
  STATUS=$(curl -s "https://apis.fotohub.app/v1/video/lip-sync/status/$JOB_ID" \
    -H "Authorization: Bearer fh_live_your_api_key")
  STATE=$(echo $STATUS | jq -r '.status')
  echo "Status: $STATE"
  if [ "$STATE" = "completed" ]; then
    echo $STATUS | jq '.output.video_url'
    break
  elif [ "$STATE" = "failed" ]; then
    echo $STATUS | jq '.error'
    break
  fi
  sleep 3
done
```
:::

---

### HD Production with LatentSync

Generate broadcast-quality HD lip-sync with face enhancement enabled.

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# HD lip-sync for professional content
job = client.video.lip_sync(
    video_url="https://example.com/presenter.mp4",
    audio_url="https://example.com/narration_spanish.mp3",
    model="latentsync",
    enhance_face=True,
    output_resolution="1080",
    output_format="mp4"
)

print(f"Job started: {job.job_id}")
print(f"Estimated time: {job.estimated_time_seconds}s")

# Wait for completion with progress tracking
result = client.video.lip_sync_wait(job.job_id, poll_interval=5)

print(f"Output: {result.output.video_url}")
print(f"Resolution: {result.output.resolution}")
print(f"Duration: {result.output.duration_seconds}s")
print(f"File size: {result.output.file_size_mb} MB")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// HD lip-sync for professional content
const job = await client.video.lipSync({
  videoUrl: "https://example.com/presenter.mp4",
  audioUrl: "https://example.com/narration_spanish.mp3",
  model: "latentsync",
  enhanceFace: true,
  outputResolution: "1080",
  outputFormat: "mp4",
});

console.log(`Job started: ${job.jobId}`);

// Wait for completion
const result = await client.video.lipSyncWait(job.jobId, { pollInterval: 5000 });

console.log(`Output: ${result.output.videoUrl}`);
console.log(`Resolution: ${result.output.resolution}`);
console.log(`Duration: ${result.output.durationSeconds}s`);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

func main() {
	payload := map[string]interface{}{
		"video_url":         "https://example.com/presenter.mp4",
		"audio_url":         "https://example.com/narration_spanish.mp3",
		"model":             "latentsync",
		"enhance_face":      true,
		"output_resolution": "1080",
		"output_format":     "mp4",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/lip-sync", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var job map[string]interface{}
	json.Unmarshal(respBody, &job)
	jobID := job["job_id"].(string)
	fmt.Printf("Job started: %s (est. %.0fs)\n", jobID, job["estimated_time_seconds"])

	// Poll for completion
	for {
		pollReq, _ := http.NewRequest("GET",
			fmt.Sprintf("https://apis.fotohub.app/v1/video/lip-sync/status/%s", jobID), nil)
		pollReq.Header.Set("Authorization", "Bearer fh_live_your_api_key")

		pollResp, _ := http.DefaultClient.Do(pollReq)
		pollBody, _ := io.ReadAll(pollResp.Body)
		pollResp.Body.Close()

		var status map[string]interface{}
		json.Unmarshal(pollBody, &status)

		if status["status"] == "completed" {
			output := status["output"].(map[string]interface{})
			fmt.Printf("Output: %s\n", output["video_url"])
			fmt.Printf("Resolution: %s\n", output["resolution"])
			fmt.Printf("Duration: %.1fs\n", output["duration_seconds"])
			break
		} else if status["status"] == "failed" {
			fmt.Printf("Failed: %v\n", status["error"])
			break
		}
		time.Sleep(5 * time.Second)
	}
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/video/lip-sync \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/presenter.mp4",
    "audio_url": "https://example.com/narration_spanish.mp3",
    "model": "latentsync",
    "enhance_face": true,
    "output_resolution": "1080",
    "output_format": "mp4"
  }'
```
:::

---

### 4K Broadcast with FaceFusion

Generate ultra-high-quality 4K lip-sync for film and broadcast production.

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# 4K broadcast-quality lip-sync
job = client.video.lip_sync(
    video_url="https://example.com/actor_4k.mp4",
    audio_url="https://example.com/dubbed_audio_jp.wav",
    model="facefusion",
    enhance_face=True,
    output_resolution="4k",
    output_format="mp4",
    face_detection_threshold=0.6,
    padding_top=20,
    padding_bottom=10,
)

print(f"Job started: {job.job_id}")
print(f"Estimated time: {job.estimated_time_seconds}s")

# FaceFusion can take 2-3 minutes for 4K — use longer poll interval
result = client.video.lip_sync_wait(job.job_id, poll_interval=10)

print(f"Output: {result.output.video_url}")
print(f"Resolution: {result.output.resolution}")
print(f"File size: {result.output.file_size_mb} MB")
print(f"Processing time: {result.metadata.processing_time_ms / 1000:.1f}s")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// 4K broadcast-quality lip-sync
const job = await client.video.lipSync({
  videoUrl: "https://example.com/actor_4k.mp4",
  audioUrl: "https://example.com/dubbed_audio_jp.wav",
  model: "facefusion",
  enhanceFace: true,
  outputResolution: "4k",
  outputFormat: "mp4",
  faceDetectionThreshold: 0.6,
  paddingTop: 20,
  paddingBottom: 10,
});

console.log(`Job started: ${job.jobId}`);

// Manual polling with progress display
let status = await client.video.lipSyncStatus(job.jobId);
while (status.status === "processing" || status.status === "queued") {
  console.log(`Progress: ${status.progress ?? 0}%`);
  await new Promise((r) => setTimeout(r, 10000));
  status = await client.video.lipSyncStatus(job.jobId);
}

if (status.status === "completed") {
  console.log(`Video ready: ${status.output.videoUrl}`);
  console.log(`Resolution: ${status.output.resolution}`);
  console.log(`File size: ${status.output.fileSizeMb} MB`);
} else {
  console.error(`Failed: ${status.error.message}`);
}
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

func main() {
	payload := map[string]interface{}{
		"video_url":                "https://example.com/actor_4k.mp4",
		"audio_url":               "https://example.com/dubbed_audio_jp.wav",
		"model":                   "facefusion",
		"enhance_face":            true,
		"output_resolution":       "4k",
		"output_format":           "mp4",
		"face_detection_threshold": 0.6,
		"padding_top":             20,
		"padding_bottom":          10,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/lip-sync", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var job map[string]interface{}
	json.Unmarshal(respBody, &job)
	jobID := job["job_id"].(string)
	fmt.Printf("Job started: %s\n", jobID)

	// Poll with longer interval for 4K processing
	for {
		pollReq, _ := http.NewRequest("GET",
			fmt.Sprintf("https://apis.fotohub.app/v1/video/lip-sync/status/%s", jobID), nil)
		pollReq.Header.Set("Authorization", "Bearer fh_live_your_api_key")

		pollResp, _ := http.DefaultClient.Do(pollReq)
		pollBody, _ := io.ReadAll(pollResp.Body)
		pollResp.Body.Close()

		var status map[string]interface{}
		json.Unmarshal(pollBody, &status)

		if status["status"] == "completed" {
			output := status["output"].(map[string]interface{})
			fmt.Printf("Video ready: %s\n", output["video_url"])
			fmt.Printf("Resolution: %s\n", output["resolution"])
			fmt.Printf("File size: %.1f MB\n", output["file_size_mb"])
			break
		} else if status["status"] == "failed" {
			errObj := status["error"].(map[string]interface{})
			fmt.Printf("Failed: %s\n", errObj["message"])
			break
		}
		if prog, ok := status["progress"]; ok {
			fmt.Printf("Progress: %.0f%%\n", prog)
		}
		time.Sleep(10 * time.Second)
	}
}
```

```bash [cURL]
# Submit 4K lip-sync job
curl -X POST https://apis.fotohub.app/v1/video/lip-sync \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/actor_4k.mp4",
    "audio_url": "https://example.com/dubbed_audio_jp.wav",
    "model": "facefusion",
    "enhance_face": true,
    "output_resolution": "4k",
    "output_format": "mp4",
    "face_detection_threshold": 0.6,
    "padding_top": 20,
    "padding_bottom": 10
  }'
```
:::

---

### Multi-Language Dubbing Pipeline

Dub a video into multiple languages using batch job submission with webhooks.

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Submit lip-sync jobs for multiple language dubs
languages = {
    "es": "https://storage.example.com/narration_spanish.mp3",
    "fr": "https://storage.example.com/narration_french.mp3",
    "de": "https://storage.example.com/narration_german.mp3",
    "ja": "https://storage.example.com/narration_japanese.mp3",
    "pt": "https://storage.example.com/narration_portuguese.mp3",
}

jobs = {}
for lang, audio_url in languages.items():
    job = client.video.lip_sync(
        video_url="https://storage.example.com/presenter_original.mp4",
        audio_url=audio_url,
        model="latentsync",
        enhance_face=True,
        webhook_url=f"https://your-app.com/webhooks/lip-sync?lang={lang}"
    )
    jobs[lang] = job.job_id
    print(f"Submitted {lang}: {job.job_id}")

print(f"\nTotal jobs: {len(jobs)}")
print(f"Credits reserved: {len(jobs) * 15}")
print("Results will be delivered via webhook.")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Submit lip-sync jobs for multiple language dubs
const languages: Record<string, string> = {
  es: "https://storage.example.com/narration_spanish.mp3",
  fr: "https://storage.example.com/narration_french.mp3",
  de: "https://storage.example.com/narration_german.mp3",
  ja: "https://storage.example.com/narration_japanese.mp3",
  pt: "https://storage.example.com/narration_portuguese.mp3",
};

const jobs: Record<string, string> = {};

for (const [lang, audioUrl] of Object.entries(languages)) {
  const job = await client.video.lipSync({
    videoUrl: "https://storage.example.com/presenter_original.mp4",
    audioUrl,
    model: "latentsync",
    enhanceFace: true,
    webhookUrl: `https://your-app.com/webhooks/lip-sync?lang=${lang}`,
  });
  jobs[lang] = job.jobId;
  console.log(`Submitted ${lang}: ${job.jobId}`);
}

console.log(`\nTotal jobs: ${Object.keys(jobs).length}`);
console.log(`Credits reserved: ${Object.keys(jobs).length * 15}`);
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
	languages := map[string]string{
		"es": "https://storage.example.com/narration_spanish.mp3",
		"fr": "https://storage.example.com/narration_french.mp3",
		"de": "https://storage.example.com/narration_german.mp3",
		"ja": "https://storage.example.com/narration_japanese.mp3",
		"pt": "https://storage.example.com/narration_portuguese.mp3",
	}

	for lang, audioURL := range languages {
		payload := map[string]interface{}{
			"video_url":    "https://storage.example.com/presenter_original.mp4",
			"audio_url":    audioURL,
			"model":        "latentsync",
			"enhance_face": true,
			"webhook_url":  fmt.Sprintf("https://your-app.com/webhooks/lip-sync?lang=%s", lang),
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/lip-sync", bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
		req.Header.Set("Content-Type", "application/json")

		resp, _ := http.DefaultClient.Do(req)
		respBody, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		var job map[string]interface{}
		json.Unmarshal(respBody, &job)
		fmt.Printf("Submitted %s: %s\n", lang, job["job_id"])
	}
	fmt.Printf("\nTotal jobs: %d, Credits reserved: %d\n", len(languages), len(languages)*15)
}
```

```bash [cURL]
# Submit multiple language dubs
for LANG in es fr de ja pt; do
  echo "Submitting $LANG..."
  curl -s -X POST https://apis.fotohub.app/v1/video/lip-sync \
    -H "Authorization: Bearer fh_live_your_api_key" \
    -H "Content-Type: application/json" \
    -d '{
      "video_url": "https://storage.example.com/presenter_original.mp4",
      "audio_url": "https://storage.example.com/narration_'$LANG'.mp3",
      "model": "latentsync",
      "enhance_face": true,
      "webhook_url": "https://your-app.com/webhooks/lip-sync?lang='$LANG'"
    }' | jq '{lang: "'$LANG'", job_id: .job_id}'
done
```
:::

---

### Multi-Face Selection

When a video contains multiple people, select which face to lip-sync.

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Interview video with two people — sync the interviewer (face index 1)
job = client.video.lip_sync(
    video_url="https://example.com/interview_two_people.mp4",
    audio_url="https://example.com/new_question.mp3",
    model="latentsync",
    face_index=1,  # Second face detected (0-indexed)
    face_detection_threshold=0.4,  # Lower threshold to detect both faces
)

result = client.video.lip_sync_wait(job.job_id)
print(f"Faces detected: {result.metadata.faces_detected}")
print(f"Face synced: index {result.metadata.face_index_used}")
print(f"Output: {result.output.video_url}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Interview video with two people — sync the interviewer (face index 1)
const job = await client.video.lipSync({
  videoUrl: "https://example.com/interview_two_people.mp4",
  audioUrl: "https://example.com/new_question.mp3",
  model: "latentsync",
  faceIndex: 1,
  faceDetectionThreshold: 0.4,
});

const result = await client.video.lipSyncWait(job.jobId);
console.log(`Faces detected: ${result.metadata.facesDetected}`);
console.log(`Face synced: index ${result.metadata.faceIndexUsed}`);
console.log(`Output: ${result.output.videoUrl}`);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

func main() {
	payload := map[string]interface{}{
		"video_url":                "https://example.com/interview_two_people.mp4",
		"audio_url":               "https://example.com/new_question.mp3",
		"model":                   "latentsync",
		"face_index":              1,
		"face_detection_threshold": 0.4,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/lip-sync", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var job map[string]interface{}
	json.Unmarshal(respBody, &job)
	jobID := job["job_id"].(string)

	// Poll for completion
	for {
		pollReq, _ := http.NewRequest("GET",
			fmt.Sprintf("https://apis.fotohub.app/v1/video/lip-sync/status/%s", jobID), nil)
		pollReq.Header.Set("Authorization", "Bearer fh_live_your_api_key")

		pollResp, _ := http.DefaultClient.Do(pollReq)
		pollBody, _ := io.ReadAll(pollResp.Body)
		pollResp.Body.Close()

		var status map[string]interface{}
		json.Unmarshal(pollBody, &status)

		if status["status"] == "completed" {
			metadata := status["metadata"].(map[string]interface{})
			fmt.Printf("Faces detected: %.0f\n", metadata["faces_detected"])
			fmt.Printf("Face synced: index %.0f\n", metadata["face_index_used"])
			output := status["output"].(map[string]interface{})
			fmt.Printf("Output: %s\n", output["video_url"])
			break
		} else if status["status"] == "failed" {
			fmt.Printf("Failed: %v\n", status["error"])
			break
		}
		time.Sleep(5 * time.Second)
	}
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/video/lip-sync \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/interview_two_people.mp4",
    "audio_url": "https://example.com/new_question.mp3",
    "model": "latentsync",
    "face_index": 1,
    "face_detection_threshold": 0.4
  }'
```
:::

---

### Audio Looping Mode

When audio is longer than video, loop the video frames to match audio duration.

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Short video loop (5s) with longer audio (30s)
# Video frames will loop 6x to match audio length
job = client.video.lip_sync(
    video_url="https://example.com/short_loop_5s.mp4",
    audio_url="https://example.com/long_narration_30s.mp3",
    model="musetalk",
    trim_audio=False,  # Loop video instead of trimming audio
)

result = client.video.lip_sync_wait(job.job_id)
print(f"Output duration: {result.output.duration_seconds}s")
print(f"Output: {result.output.video_url}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Short video loop (5s) with longer audio (30s)
const job = await client.video.lipSync({
  videoUrl: "https://example.com/short_loop_5s.mp4",
  audioUrl: "https://example.com/long_narration_30s.mp3",
  model: "musetalk",
  trimAudio: false, // Loop video instead of trimming audio
});

const result = await client.video.lipSyncWait(job.jobId);
console.log(`Output duration: ${result.output.durationSeconds}s`);
console.log(`Output: ${result.output.videoUrl}`);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

func main() {
	payload := map[string]interface{}{
		"video_url":  "https://example.com/short_loop_5s.mp4",
		"audio_url":  "https://example.com/long_narration_30s.mp3",
		"model":      "musetalk",
		"trim_audio": false,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/lip-sync", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var job map[string]interface{}
	json.Unmarshal(respBody, &job)
	jobID := job["job_id"].(string)

	for {
		pollReq, _ := http.NewRequest("GET",
			fmt.Sprintf("https://apis.fotohub.app/v1/video/lip-sync/status/%s", jobID), nil)
		pollReq.Header.Set("Authorization", "Bearer fh_live_your_api_key")

		pollResp, _ := http.DefaultClient.Do(pollReq)
		pollBody, _ := io.ReadAll(pollResp.Body)
		pollResp.Body.Close()

		var status map[string]interface{}
		json.Unmarshal(pollBody, &status)

		if status["status"] == "completed" {
			output := status["output"].(map[string]interface{})
			fmt.Printf("Duration: %.1fs\n", output["duration_seconds"])
			fmt.Printf("Output: %s\n", output["video_url"])
			break
		} else if status["status"] == "failed" {
			break
		}
		time.Sleep(3 * time.Second)
	}
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/video/lip-sync \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/short_loop_5s.mp4",
    "audio_url": "https://example.com/long_narration_30s.mp3",
    "model": "musetalk",
    "trim_audio": false
  }'
```
:::

---

### List Available Models

Query engine capabilities and status before submitting jobs.

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

models = client.video.lip_sync_models()

for model in models:
    print(f"{model.id}: {model.name}")
    print(f"  Credits: {model.credits}")
    print(f"  Max resolution: {model.max_resolution}")
    print(f"  Max duration: {model.max_duration_seconds}s")
    print(f"  Multi-face: {model.supports_multi_face}")
    print(f"  Status: {model.status}")
    print()
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const { models } = await client.video.lipSyncModels();

models.forEach(model => {
  console.log(`${model.id}: ${model.name}`);
  console.log(`  Credits: ${model.credits}`);
  console.log(`  Max resolution: ${model.maxResolution}`);
  console.log(`  Max duration: ${model.maxDurationSeconds}s`);
  console.log(`  Multi-face: ${model.supportsMultiFace}`);
  console.log(`  Status: ${model.status}`);
  console.log();
});
```

```go [Go]
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/video/lip-sync/models", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(body, &result)

	models := result["models"].([]interface{})
	for _, m := range models {
		model := m.(map[string]interface{})
		fmt.Printf("%s: %s — %v credits, max %vs\n",
			model["id"], model["name"], model["credits"], model["max_duration_seconds"])
	}
}
```

```bash [cURL]
curl https://apis.fotohub.app/v1/video/lip-sync/models \
  -H "Authorization: Bearer fh_live_your_api_key" | jq '.models[] | {id, name, credits, max_resolution, status}'
```
:::

---

## Use Cases

### Content Dubbing & Localization

Translate video content into multiple languages while maintaining natural lip movement. Record audio in the target language, then generate a lip-synced version that matches the new narration perfectly.

- E-learning course localization
- Documentary dubbing
- Product demo translations
- Corporate training videos in multiple languages

### Virtual Presenters & Avatars

Create AI-powered presenters from a single reference video. Feed any text-to-speech audio to produce new presentations without reshooting.

- Automated news anchors
- Personalized sales videos at scale
- Customer support video responses
- Dynamic tutorial content

### Social Media & Creator Tools

Generate lip-synced content for social platforms. Use `musetalk` for rapid turnaround on trending content.

- Reaction videos with translated audio
- Character voice-overs
- Meme content with custom audio
- Multilingual influencer content

### Film & Broadcast Production

Use `facefusion` for production-grade output suitable for broadcast, advertising, and film post-production.

- ADR (Automated Dialogue Replacement)
- Voice actor substitution
- Commercial localization for international markets
- Archival footage restoration with new narration

---

## Detailed Engine Comparison

| Feature | MuseTalk | LatentSync | FaceFusion |
|---------|----------|------------|------------|
| **Max Resolution** | 512x512 | 1024x1024 | 3840x2160 |
| **Max Duration** | 60s | 30s | 120s |
| **Face Angle Limit** | 15 degrees | 30 degrees | 45 degrees |
| **Multi-face** | No | Yes | Yes |
| **Face Enhancement** | Yes | Yes | Yes |
| **Mouth Detail** | Basic | Teeth + tongue | Full expression |
| **Expression Preservation** | Minimal | Good | Excellent |
| **Processing Speed** | ~3s/frame | ~8s/frame | ~15s/frame |
| **Min Source Quality** | 360p | 480p | 480p (upscales) |
| **Audio Noise Tolerance** | Low | Moderate | High |
| **4K Upscale** | No | No | Yes (built-in) |
| **Output Formats** | MP4, WebM | MP4, WebM | MP4, WebM |
| **Credits** | 8 | 15 | 20 |
| **Approx. USD** | $0.4287 | $0.8039 | $1.07 |

### Choosing by Use Case

| Use Case | Recommended Engine | Why |
|----------|-------------------|-----|
| Social media clips | `musetalk` | Fast, cheap, good enough for mobile |
| YouTube videos | `latentsync` | HD quality, natural mouth movement |
| Corporate presentations | `latentsync` | Professional quality, reasonable speed |
| Film ADR | `facefusion` | Highest quality, handles angles |
| TV commercials | `facefusion` | 4K support, expression restoration |
| E-learning dubbing | `latentsync` | Clean HD, multi-face support |
| Real-time preview | `musetalk` | Fastest turnaround |
| Archival restoration | `facefusion` | Built-in enhancement and upscale |

---

## Pricing

| Engine | Credits | Approx. USD | Best For |
|--------|---------|-------------|----------|
| `musetalk` | 8 | $0.4287 | Quick previews, social media, drafts |
| `latentsync` | 15 | $0.8039 | HD content, professional presentations |
| `facefusion` | 20 | $1.07 | 4K production, broadcast, film |

::: info Credit Costs
All lip-sync engines use flat credit pricing per job regardless of video duration (within model limits). A 5-second clip costs the same as a 60-second clip on `musetalk`. The USD column is what a job costs from your wallet once the included credits run out, at $0.0536 per credit.
:::

---

## Rate Limits

| Limit | Value |
|-------|-------|
| Requests per minute | 5 |
| Max concurrent jobs | 3 |
| Max file upload size | 500 MB |
| Job result retention | 24 hours |

Exceeding rate limits returns a `429 Too Many Requests` response with a `Retry-After` header indicating when you can make the next request.

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Maximum 5 requests per minute.",
    "retry_after_seconds": 12
  }
}
```

---

## Tips for Best Results

### Video Requirements

- **Face visibility:** The face must be clearly visible and unobstructed throughout the entire video. Avoid frames where the face turns beyond the model's angle limit.
- **Lighting:** Even, consistent lighting produces the best results. Avoid harsh shadows across the face or rapidly changing lighting conditions.
- **Resolution:** Source video should be at least as high resolution as the target output. Upscaling from 480p to 4K will produce artifacts (except with FaceFusion which has built-in super-resolution).
- **Stability:** Use a tripod or stabilized footage. Excessive camera shake degrades face tracking quality.
- **Frame rate:** 24-30 fps recommended. Higher frame rates (60fps) increase processing time proportionally.
- **Background:** Simple, non-distracting backgrounds help the model focus on face geometry.

### Audio Requirements

- **Clean speech:** Use clear, well-recorded speech audio. Background music or noise reduces lip-sync accuracy.
- **Sample rate:** 16kHz minimum, 44.1kHz or 48kHz recommended.
- **Format:** WAV provides best quality; MP3 at 192kbps+ is acceptable.
- **Silence padding:** Include 0.5s of silence at the beginning and end of the audio for clean transitions.
- **Single speaker:** Multi-speaker audio confuses the lip-sync model. Process each speaker separately.

### Engine-Specific Tips

#### MuseTalk (Fast Preview)
- Best with frontal face angles (0-15 degrees)
- Works well with webcam-quality footage
- Ideal for rapid iteration — test audio timing before committing to HD

#### LatentSync (HD Production)
- Handles moderate face angles (up to 30 degrees)
- Produces natural mouth interior detail (teeth, tongue)
- Best with professional lighting and HD source footage

#### FaceFusion (4K Broadcast)
- Supports extreme face angles (up to 45 degrees)
- Multi-stage pipeline: detection, sync, expression restoration, super-resolution
- Use `enhance_face: true` for best results on older or compressed source footage
- Allow extra processing time — 4K output with enhancement can take 2-3 minutes

### Common Pitfalls

| Issue | Cause | Solution |
|-------|-------|----------|
| Mouth flickers | Low source resolution | Use higher-quality source video or enable `enhance_face` |
| Jaw misalignment | Face turned too far | Keep face angle within model limits |
| Audio/video desync | Variable frame rate source | Re-encode source to constant frame rate before upload |
| Artifacts at edges | Tight face crop | Increase `padding_top` and `padding_bottom` values |
| Poor lip accuracy | Noisy audio | Pre-process audio to remove background noise |

---

## Webhook Payload

When you provide a `webhook_url`, FOTOhub sends a POST request to that URL upon job completion or failure.

### Headers

```
Content-Type: application/json
X-FotoHub-Signature: sha256=<hmac_signature>
X-FotoHub-Event: lip-sync.completed
```

### Payload (Success)

```json
{
  "event": "lip-sync.completed",
  "job_id": "ls_7f3a9b2c4e1d",
  "status": "completed",
  "output": {
    "video_url": "https://s1.fotohub.app/storage/v1/object/public/generations/lipsync_7f3a9b2c4e1d.mp4",
    "duration_seconds": 24.5,
    "resolution": "1024x1024",
    "file_size_mb": 18.3
  },
  "credits_used": 15,
  "created_at": "2026-07-22T14:30:00Z",
  "completed_at": "2026-07-22T14:30:42Z"
}
```

### Payload (Failure)

```json
{
  "event": "lip-sync.failed",
  "job_id": "ls_7f3a9b2c4e1d",
  "status": "failed",
  "error": {
    "code": "no_face_detected",
    "message": "No face was detected in the source video."
  },
  "credits_refunded": 15,
  "created_at": "2026-07-22T14:30:00Z",
  "failed_at": "2026-07-22T14:30:05Z"
}
```

### Verifying Webhook Signatures

Verify the `X-FotoHub-Signature` header to ensure webhook authenticity:

::: code-group
```python [Python]
import hmac
import hashlib

def verify_webhook(payload_body: bytes, signature_header: str, webhook_secret: str) -> bool:
    expected = hmac.new(
        webhook_secret.encode(),
        payload_body,
        hashlib.sha256
    ).hexdigest()
    received = signature_header.replace("sha256=", "")
    return hmac.compare_digest(expected, received)
```

```typescript [TypeScript]
import { createHmac, timingSafeEqual } from "crypto";

function verifyWebhook(payloadBody: Buffer, signatureHeader: string, webhookSecret: string): boolean {
  const expected = createHmac("sha256", webhookSecret)
    .update(payloadBody)
    .digest("hex");
  const received = signatureHeader.replace("sha256=", "");
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}
```

```go [Go]
import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "strings"
)

func verifyWebhook(payloadBody []byte, signatureHeader string, webhookSecret string) bool {
    mac := hmac.New(sha256.New, []byte(webhookSecret))
    mac.Write(payloadBody)
    expected := hex.EncodeToString(mac.Sum(nil))
    received := strings.TrimPrefix(signatureHeader, "sha256=")
    return hmac.Equal([]byte(expected), []byte(received))
}
```

```bash [cURL]
# Verify signature with openssl
echo -n "$PAYLOAD_BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print $2}'
# Compare with the value after "sha256=" in the X-FotoHub-Signature header
```
:::

---

## Related APIs

- [Image Generation](/api/image-generation) — Generate source face images
- [Music & Audio](/api/music-audio) — Generate speech audio via TTS for lip-sync input
- [Voice Cloning](/api/voice-cloning) — Clone voices for personalized dubbing
- [Shorts & Clips](/api/shorts-clips) — Create short-form content with integrated lip-sync
- [Models](/api/models) — Full model catalog and status
