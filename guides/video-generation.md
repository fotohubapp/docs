# Guide: Video Generation with the SDK

Generate videos from text or images using 7 AI models from 6 leading providers. Video generation is async — you submit a job and poll for completion.

::: info Async by Design
Video generation takes 30 seconds to 5 minutes depending on the model and duration. The API returns a `job_id` immediately, and you poll for the result. The SDKs provide `wait_for_video` helpers that handle polling automatically.
:::

## Prerequisites

- API key from [fotohub.app/settings/api](https://fotohub.app/settings/api)
- Python: `pip install fotohub` — or TypeScript: `npm install fotohub`

---

## Basic Text-to-Video

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub()

# Submit the job
job = client.generate_video(
    prompt="A golden retriever running through a field of sunflowers, slow motion, cinematic",
    model="seedance",
)

# Wait for completion (polls automatically)
result = client.wait_for_video(job.job_id, timeout=300)
print(f"Video URL: {result.video_url}")
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

// Submit the job
const job = await client.generateVideo({
  prompt: "A golden retriever running through a field of sunflowers, slow motion, cinematic",
  model: "seedance",
});

// Wait for completion
const result = await client.waitForVideo(job.jobId, { timeout: 300_000 });
console.log(`Video: ${result.videoUrl}`);
```
```go [Go]
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
    "time"
)

func main() {
    // Submit job
    payload, _ := json.Marshal(map[string]interface{}{
        "prompt": "A golden retriever running through a field of sunflowers, slow motion, cinematic",
        "model":  "seedance",
    })

    req, _ := http.NewRequest("POST",
        "https://apis.fotohub.app/v1/ai/generate/video",
        bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    req.Header.Set("Content-Type", "application/json")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()

    var job struct {
        JobID string `json:"job_id"`
    }
    json.NewDecoder(resp.Body).Decode(&job)
    fmt.Printf("Job submitted: %s\n", job.JobID)

    // Poll for completion
    for {
        statusReq, _ := http.NewRequest("GET",
            "https://apis.fotohub.app/v1/ai/video/status/"+job.JobID, nil)
        statusReq.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
        statusResp, _ := http.DefaultClient.Do(statusReq)

        var status struct {
            Status   string `json:"status"`
            VideoURL string `json:"video_url"`
        }
        json.NewDecoder(statusResp.Body).Decode(&status)
        statusResp.Body.Close()

        if status.Status == "completed" {
            fmt.Printf("Video: %s\n", status.VideoURL)
            break
        } else if status.Status == "failed" {
            fmt.Println("Generation failed")
            break
        }
        fmt.Printf("Status: %s\n", status.Status)
        time.Sleep(5 * time.Second)
    }
}
```
```bash [cURL]
# Submit
JOB_ID=$(curl -s -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A golden retriever running through a field", "model": "seedance"}' \
  | jq -r '.job_id')

echo "Job: $JOB_ID"

# Poll until done
while true; do
  RESULT=$(curl -s "https://apis.fotohub.app/v1/ai/video/status/$JOB_ID" \
    -H "Authorization: Bearer $FOTOHUB_API_KEY")
  STATUS=$(echo "$RESULT" | jq -r '.status')
  echo "Status: $STATUS"
  [ "$STATUS" = "completed" ] && echo "URL: $(echo $RESULT | jq -r '.video_url')" && break
  [ "$STATUS" = "failed" ] && echo "Failed!" && break
  sleep 5
done
```
:::

---

## How Async Jobs Work

1. **Submit** → you get a `job_id` immediately (no credits charged yet)
2. **Queue** → job enters model queue (status: `queued`)
3. **Process** → model generates frames (status: `processing`)
4. **Complete** → video ready for download (status: `completed`, credits charged)

```
Submit → queued → processing → completed
                              └→ failed (credits NOT charged)
```

The SDK `wait_for_video` / `waitForVideo` method handles polling with exponential backoff.

---

## Image-to-Video (I2V)

Animate a still image — the model uses the image as the first frame and generates motion:

::: code-group
```python [Python]
job = client.generate_video(
    prompt="Camera slowly zooming in, gentle wind moving the leaves",
    image_url="https://example.com/landscape.jpg",
    model="seedance",
)
result = client.wait_for_video(job.job_id)
print(f"Video: {result.video_url}")
```
```typescript [TypeScript]
const job = await client.generateVideo({
  prompt: "Camera slowly zooming in, gentle wind moving the leaves",
  imageUrl: "https://example.com/landscape.jpg",
  model: "seedance",
});
const result = await client.waitForVideo(job.jobId);
console.log(`Video: ${result.videoUrl}`);
```
```go [Go]
payload, _ := json.Marshal(map[string]interface{}{
    "prompt":    "Camera slowly zooming in, gentle wind moving the leaves",
    "image_url": "https://example.com/landscape.jpg",
    "model":     "seedance",
})
// ... standard request + polling
```
```bash [cURL]
curl -s -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Camera slowly zooming in, gentle wind moving the leaves",
    "image_url": "https://example.com/landscape.jpg",
    "model": "seedance"
  }' | jq '.job_id'
```
:::

### I2V Best Practices

| Tip | Details |
|-----|---------|
| Use clear subjects | Images with a single focal point animate better |
| Describe the motion | "camera panning left" is better than "nice video" |
| Match aspect ratio | Set `aspect_ratio` to match your source image |
| Avoid text in images | Text gets distorted during animation |
| High-res sources | 720p+ source images produce smoother videos |

---

## Video Models Comparison

| Model | Duration | Resolution | Best for | Credits (5s) | Speed |
|-------|----------|-----------|----------|:------------:|-------|
| `wan-video` | up to 30s | 1080p | Anime, stylized, budget | 8 | 30-60s |
| `hailuo` | up to 30s | 1080p | Natural motion, people | 8 | 45-90s |
| `veo-2` | up to 30s | 1080p | Best overall, fast + high quality | 10 | 60-120s |
| `kling` | up to 60s | 1080p | Cinematic, dramatic, longest clips | 10 | 90-180s |
| `seedance` | up to 30s | 1080p | High-quality production, motion | 10 | 60-120s |
| `sora-2` | up to 20s | 4K | Physics realism, premium | 12 | 120-300s |
| `veo-3` | up to 30s | 4K | Photorealism, synced audio, cinematic | 15 | 120-300s |

### Model Selection Decision Tree

```
Need a quick, cheap preview?
  → wan-video or hailuo (lowest cost per second)
Need the best overall balance of quality + speed?
  → veo-2
Need production quality with strong motion?
  → seedance or kling
Need the longest clips (up to 60s)?
  → kling
Need photorealism or synchronized audio?
  → veo-3
Need premium physics realism?
  → sora-2
Budget-conscious bulk generation?
  → wan-video or hailuo
```

---

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | Video description |
| `model` | string | required | Model ID |
| `image_url` | string | — | Source image for img2video |
| `resolution` | string | `1080p` | `720p`, `1080p`, `4k` |
| `duration` | int | `5` | Duration in seconds (5, 10, 15, 30, 60) |
| `aspect_ratio` | string | `16:9` | Output aspect ratio |
| `seed` | int | random | Reproducible output |
| `webhook_url` | string | — | URL to notify on completion |

---

## Async Workflow Patterns

### Pattern 1: Fire-and-Forget with Webhook

Best for background processing — submit and get notified:

::: code-group
```python [Python]
# Submit with webhook — no polling needed
job = client.generate_video(
    prompt="Product showcase, 360 rotation",
    model="seedance",
    webhook_url="https://your-app.com/webhooks/video-done",
)
print(f"Submitted: {job.job_id}")
# Your webhook receives the result when ready
```
```typescript [TypeScript]
const job = await client.generateVideo({
  prompt: "Product showcase, 360 rotation",
  model: "seedance",
  webhookUrl: "https://your-app.com/webhooks/video-done",
});
console.log(`Submitted: ${job.jobId}`);
// Webhook receives result
```
```go [Go]
payload, _ := json.Marshal(map[string]interface{}{
    "prompt":      "Product showcase, 360 rotation",
    "model":       "seedance",
    "webhook_url": "https://your-app.com/webhooks/video-done",
})
// Submit — no need to poll
```
```bash [cURL]
curl -s -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Product showcase, 360 rotation",
    "model": "seedance",
    "webhook_url": "https://your-app.com/webhooks/video-done"
  }'
# Webhook receives result — no polling needed
```
:::

### Pattern 2: SDK Auto-Polling

Simplest for synchronous scripts:

```python
# SDK handles polling with exponential backoff
result = client.wait_for_video(job.job_id, timeout=300)
```

### Pattern 3: Manual Polling with Progress

For UIs that need progress updates:

::: code-group
```python [Python]
import time

job = client.generate_video(prompt="...", model="seedance")

while True:
    status = client.get_video_status(job.job_id)
    print(f"Status: {status.status} | Progress: {status.progress}%")

    if status.status == "completed":
        print(f"Done: {status.video_url}")
        break
    elif status.status == "failed":
        print(f"Failed: {status.error}")
        break

    time.sleep(5)
```
```typescript [TypeScript]
const job = await client.generateVideo({ prompt: "...", model: "seedance" });

const poll = setInterval(async () => {
  const status = await client.getVideoStatus(job.jobId);
  console.log(`Status: ${status.status} | Progress: ${status.progress}%`);

  if (status.status === "completed") {
    clearInterval(poll);
    console.log(`Done: ${status.videoUrl}`);
  } else if (status.status === "failed") {
    clearInterval(poll);
    console.error(`Failed: ${status.error}`);
  }
}, 5000);
```
```go [Go]
// Poll loop
for {
    req, _ := http.NewRequest("GET",
        "https://apis.fotohub.app/v1/ai/video/status/"+jobID, nil)
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    resp, _ := http.DefaultClient.Do(req)
    var s struct {
        Status   string `json:"status"`
        Progress int    `json:"progress"`
        VideoURL string `json:"video_url"`
    }
    json.NewDecoder(resp.Body).Decode(&s)
    resp.Body.Close()
    fmt.Printf("Status: %s (%d%%)\n", s.Status, s.Progress)
    if s.Status == "completed" || s.Status == "failed" {
        break
    }
    time.Sleep(5 * time.Second)
}
```
```bash [cURL]
# Poll with progress display
while true; do
  RESULT=$(curl -s "https://apis.fotohub.app/v1/ai/video/status/$JOB_ID" \
    -H "Authorization: Bearer $FOTOHUB_API_KEY")
  STATUS=$(echo "$RESULT" | jq -r '.status')
  PROGRESS=$(echo "$RESULT" | jq -r '.progress // 0')
  echo "Status: $STATUS ($PROGRESS%)"
  [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ] && break
  sleep 5
done
```
:::

---

## Batch Video Processing

Process multiple videos concurrently — submit all jobs first, then poll:

```python
import asyncio
from fotohub import FotoHub

client = FotoHub()

async def batch_video(prompts: list[str], max_concurrent: int = 5):
    semaphore = asyncio.Semaphore(max_concurrent)

    async def submit(prompt):
        async with semaphore:
            return await client.async_generate_video(
                prompt=prompt, model="seedance"
            )

    # Submit all
    jobs = await asyncio.gather(*[submit(p) for p in prompts])
    job_ids = [j.job_id for j in jobs]
    print(f"Submitted {len(job_ids)} jobs")

    # Poll all
    results = await asyncio.gather(*[
        client.async_wait_for_video(jid, timeout=300)
        for jid in job_ids
    ])
    return results
```

For detailed batch patterns, see the [Batch Processing Guide](/guides/batch-processing).

---

## Video Prompt Engineering

### Effective Motion Descriptions

| Good prompt | Why it works |
|------------|-------------|
| "Camera slowly pans left revealing a cityscape" | Specific camera motion |
| "Woman turns head to the right, hair flowing" | Clear subject action |
| "Rain drops falling in slow motion, macro lens" | Speed + camera info |
| "Time-lapse of clouds moving across sunset sky" | Time scale specified |

| Weak prompt | Why it fails |
|-------------|-------------|
| "Nice city video" | No motion description |
| "A beautiful scene" | No subject, no action |
| "Make it look good" | No visual direction |

### Duration Guidelines

| Duration | Best for | Notes |
|----------|----------|-------|
| 3-5s | Product shots, loops, GIFs | Most consistent quality |
| 5-8s | Short scenes, social clips | Sweet spot for most models |
| 8-10s | Narratives, transitions | Requires premium models |
| 15-60s | Long-form scenes | Higher cost; `kling` supports up to 60s |

---

## Handling Long Jobs

Videos can take 1-5 minutes depending on the model. Configure timeouts:

::: code-group
```python [Python]
# Custom timeout and poll interval
result = client.wait_for_video(
    job.job_id,
    timeout=600,       # max 10 minutes
    poll_interval=3,   # check every 3 seconds
)
```
```typescript [TypeScript]
const result = await client.waitForVideo(job.jobId, {
  timeout: 600_000,    // 10 minutes
  pollInterval: 3_000, // every 3s
});
```
```go [Go]
// Custom polling with timeout
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
defer cancel()

for {
    select {
    case <-ctx.Done():
        fmt.Println("Timeout!")
        return
    default:
        // Poll status...
        time.Sleep(3 * time.Second)
    }
}
```
```bash [cURL]
# Timeout after 10 minutes
TIMEOUT=600
START=$(date +%s)
while true; do
  ELAPSED=$(( $(date +%s) - START ))
  [ $ELAPSED -ge $TIMEOUT ] && echo "Timeout!" && break
  # ... poll status
  sleep 3
done
```
:::

---

## Error Handling

::: code-group
```python [Python]
from fotohub import FotoHub, VideoJobTimeoutError, InsufficientCreditsError, ModelUnavailableError

client = FotoHub()

try:
    job = client.generate_video(prompt="...", model="seedance")
    result = client.wait_for_video(job.job_id, timeout=120)
except VideoJobTimeoutError:
    print("Video took too long — try a faster model or shorter duration")
except InsufficientCreditsError:
    print("Not enough credits for video generation")
except ModelUnavailableError as e:
    print(f"Model {e.model} unavailable — try seedance as fallback")
```
```typescript [TypeScript]
import { VideoJobTimeoutError, InsufficientCreditsError, ModelUnavailableError } from "fotohub/errors";

try {
  const job = await client.generateVideo({ prompt: "...", model: "seedance" });
  const result = await client.waitForVideo(job.jobId, { timeout: 120_000 });
} catch (e) {
  if (e instanceof VideoJobTimeoutError) {
    console.error("Timeout — try faster model");
  } else if (e instanceof InsufficientCreditsError) {
    console.error("Not enough credits");
  } else if (e instanceof ModelUnavailableError) {
    console.error(`Model unavailable — use fallback`);
  }
}
```
```go [Go]
// Check for specific error conditions
if resp.StatusCode == 402 {
    fmt.Println("Insufficient credits for video generation")
} else if resp.StatusCode == 503 {
    fmt.Println("Model unavailable — try fallback")
}
```
```bash [cURL]
# Submit with error check
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "model": "seedance"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
case $HTTP_CODE in
  402) echo "Insufficient credits" ;;
  503) echo "Model unavailable" ;;
  429) echo "Rate limited" ;;
esac
```
:::

---

## Performance Tips

1. **Prototype with budget models** — Use `wan-video` or `hailuo` (8 credits, 30-90s) before committing to premium models
2. **Shorter is better** — 5s videos are 2-3x faster and cheaper than 10s
3. **Use I2V for consistency** — Starting from an image gives more predictable results
4. **Webhook over polling** — Saves API requests and reduces load
5. **Batch submissions** — Submit all jobs first, then poll, rather than submit-wait-submit
6. **Cache job results** — Video URLs are valid for 24 hours, cache them
7. **Off-peak hours** — Queue times are shorter during 02:00-08:00 CET

---

## Related

- [Video Generation API Reference](/api/video-generation)
- [Image Generation Guide](/guides/image-generation) — Generate source images for I2V
- [Batch Processing](/guides/batch-processing) — Process many videos concurrently
- [Webhooks Guide](/guides/webhooks) — Get notified on completion
- [SDK Setup](/guides/sdk-setup)
- [Models Catalog](/api/models)
