# Guide: Video Generation with the SDK

Generate videos from text or images using 15+ AI models. Video generation is async — you submit a job and poll for completion.

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
    model="seedance-2-0-lite",
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
  model: "seedance-2-0-lite",
});

// Wait for completion
const result = await client.waitForVideo(job.jobId, { timeout: 300_000 });
console.log(`Video: ${result.videoUrl}`);
```
```bash [cURL]
# Submit
JOB_ID=$(curl -s -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A golden retriever running through a field", "model": "seedance-2-0-lite"}' \
  | jq -r '.job_id')

# Poll until done
while true; do
  STATUS=$(curl -s https://apis.fotohub.app/v1/ai/video/status/$JOB_ID \
    -H "Authorization: Bearer $FOTOHUB_API_KEY" | jq -r '.status')
  echo "Status: $STATUS"
  [ "$STATUS" = "completed" ] && break
  sleep 5
done
```
:::

---

## How Async Jobs Work

1. **Submit** → you get a `job_id` immediately
2. **Poll** → check status until `completed` or `failed`
3. **Download** → get the video URL from the final response

Job statuses: `queued` → `processing` → `completed` (or `failed`)

The SDK `wait_for_video` / `waitForVideo` method handles polling for you with exponential backoff.

---

## Image-to-Video

Animate a still image:

::: code-group
```python [Python]
job = client.generate_video(
    prompt="Camera slowly zooming in, gentle wind moving the leaves",
    image_url="https://example.com/landscape.jpg",
    model="seedance-2-0-lite",
)
result = client.wait_for_video(job.job_id)
```
```typescript [TypeScript]
const job = await client.generateVideo({
  prompt: "Camera slowly zooming in, gentle wind moving the leaves",
  imageUrl: "https://example.com/landscape.jpg",
  model: "seedance-2-0-lite",
});
const result = await client.waitForVideo(job.jobId);
```
:::

---

## Video Models

| Model | Duration | Best for | Credits |
|-------|----------|----------|---------|
| `seedance-2-0-lite` | 5s | Fast previews | 5 |
| `seedance-2-0` | 10s | High quality | 15 |
| `hailuo-minimax` | 6s | Motion quality | 10 |
| `kling-1-6` | 10s | Cinematic | 20 |
| `veo-3-1` | 8s | Photorealism | 25 |
| `wan-2-1-video` | 5s | Anime/stylized | 8 |

---

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | Video description |
| `model` | string | required | Model ID |
| `image_url` | string | — | Source image for img2video |
| `duration` | int | model default | Duration in seconds |
| `aspect_ratio` | string | `16:9` | Output aspect ratio |
| `seed` | int | random | Reproducible output |

---

## Handling Long Jobs

Videos can take 1-5 minutes depending on the model. The SDK handles this:

```python
# Custom timeout and poll interval
result = client.wait_for_video(
    job.job_id,
    timeout=600,       # max 10 minutes
    poll_interval=3,   # check every 3 seconds
)
```

If you prefer manual polling:

```python
import time

job = client.generate_video(prompt="...", model="seedance-2-0-lite")

while True:
    status = client.get_video_status(job.job_id)
    print(f"Status: {status.status} ({status.progress}%)")
    
    if status.status == "completed":
        print(f"Done: {status.video_url}")
        break
    elif status.status == "failed":
        print(f"Failed: {status.error}")
        break
    
    time.sleep(5)
```

---

## Error Handling

```python
from fotohub import FotoHub, VideoJobTimeoutError, InsufficientCreditsError

try:
    job = client.generate_video(prompt="...", model="seedance-2-0-lite")
    result = client.wait_for_video(job.job_id, timeout=120)
except VideoJobTimeoutError:
    print("Video took too long — try a faster model or shorter duration")
except InsufficientCreditsError:
    print("Not enough credits for video generation")
```

---

## Related

- [Video Generation API Reference](/api/video-generation)
- [Image Generation Guide](/guides/image-generation)
- [SDK Setup](/guides/sdk-setup)
- [Models Catalog](/api/models)
