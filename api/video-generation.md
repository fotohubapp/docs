# Video Generation

Generate high-quality AI videos from text prompts or source images. FOTOhub provides access to 7 video models from 6 leading providers, supporting both text-to-video and image-to-video workflows. Generate clips from 5 to 60 seconds in length, with configurable aspect ratios and resolutions up to 4K.

| | |
|---|---|
| **Models** | 7 models from 6 providers |
| **Duration** | 5-60 seconds, configurable |
| **Resolution** | 720p, 1080p, 4K |
| **Modes** | Text-to-video, Image-to-video |

## Endpoint

```
POST /v1/ai/generate/video
```

**Authentication:** Bearer token (API key)  
**Billing:** 8-15 credits per 5-second clip (scales with duration)

## Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | **Yes** | — | Detailed description of the video to generate. Include subject, action, style, camera movement, and lighting for best results. |
| `model` | string | No | `"veo-2"` | Video generation model to use. Options: `"veo-2"`, `"veo-3"`, `"wan"`, `"kling"`, `"hailuo"`, `"seedance"`, `"sora-2"`. |
| `duration` | integer | No | `5` | Video duration in seconds. Accepted values: 5, 10, 15, 30, 60. Longer durations consume proportionally more credits. |
| `aspect_ratio` | string | No | `"16:9"` | Output aspect ratio. Options: `"16:9"` (landscape), `"9:16"` (portrait/vertical), `"1:1"` (square). |
| `image_url` | string | No | — | URL of a source image for image-to-video generation. When provided, the video will animate from this starting frame. Must be a publicly accessible URL or a FOTOhub storage URL. |
| `resolution` | string | No | `"1080p"` | Output video resolution. Options: `"720p"` (1280x720), `"1080p"` (1920x1080), `"4k"` (3840x2160). Higher resolutions may increase generation time. |

## Response Format

### Completed Response (200)

```json
{
  "model": "veo-2",
  "credits_used": 10,
  "billing": {
    "method": "credits",
    "credits_used": 10,
    "pln_charged": 3.75
  },
  "video_url": "https://s1.fotohub.app/storage/v1/object/public/generations/videos/vj_abc123.mp4",
  "job_id": "vj_abc123",
  "status": "completed",
  "duration": 5
}
```

### Processing Response (202)

```json
{
  "job_id": "vj_abc123def456",
  "status": "processing",
  "model": "veo-3",
  "estimated_seconds": 120,
  "poll_url": "https://apis.fotohub.app/v1/ai/jobs/vj_abc123def456",
  "webhook_supported": true
}
```

::: info Asynchronous Processing
Video generation can take 30 seconds to several minutes depending on the model and duration. When the video is still processing, the response will include `"status": "processing"` and a `job_id`. Use this ID to poll for completion or configure a webhook to receive notifications.
:::

## Model Pricing

Base price per 5-second clip:

| Model | ID | Credits (5s) | Price (PLN) | Provider |
|-------|-----|:------------:|:-----------:|----------|
| Wan Video | `wan` | 8 | 0.45 | Alibaba |
| Hailuo (MiniMax) | `hailuo` | 8 | 0.525 | MiniMax |
| Kling AI | `kling` | 10 | 0.60 | Kuaishou |
| Seedance | `seedance` | 10 | 0.675 | ByteDance |
| **Google Veo 2** | `veo-2` | **10** | **0.75** | Google |
| OpenAI Sora 2 | `sora-2` | 12 | 0.90 | OpenAI |
| Google Veo 3 | `veo-3` | 15 | 1.20 | Google |

::: tip Recommended Model
**Veo 2** offers the best balance of quality, speed, and cost for most use cases. Use **Veo 3** for maximum quality when budget allows, or **Wan** for budget-conscious batch processing.
:::

### Credit Scaling by Duration

Credits scale linearly with video duration. The base credit cost shown above is for a 5-second clip. Longer durations multiply accordingly:

| Duration | Multiplier | Example (Veo 2) |
|----------|:----------:|-----------------|
| 5 seconds | 1x | 10 credits (0.75 PLN) |
| 10 seconds | 2x | 20 credits (1.50 PLN) |
| 15 seconds | 3x | 30 credits (2.25 PLN) |
| 30 seconds | 5x | 50 credits (3.75 PLN) |
| 60 seconds | 10x | 100 credits (7.50 PLN) |

::: info Formula
`total_credits = base_credits x (duration / 5)`

For example, a 30-second Kling video costs: `10 x (30 / 5) = 60 credits`
:::

## Code Examples

### Text-to-Video

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/video",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "A golden retriever running through a sunlit meadow, "
                  "cinematic slow motion, shallow depth of field, "
                  "warm afternoon light, shot on 35mm film",
        "model": "veo-2",
        "duration": 5,
        "aspect_ratio": "16:9",
        "resolution": "1080p"
    }
)

result = response.json()
print(f"Video URL: {result['video_url']}")
print(f"Credits used: {result['credits_used']}")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/video",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "A golden retriever running through a sunlit meadow, " +
              "cinematic slow motion, shallow depth of field, " +
              "warm afternoon light, shot on 35mm film",
      model: "veo-2",
      duration: 5,
      aspect_ratio: "16:9",
      resolution: "1080p",
    }),
  }
);

const result = await response.json();
console.log("Video URL:", result.video_url);
console.log("Credits used:", result.credits_used);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A golden retriever running through a sunlit meadow, cinematic slow motion, shallow depth of field, warm afternoon light, shot on 35mm film",
    "model": "veo-2",
    "duration": 5,
    "aspect_ratio": "16:9",
    "resolution": "1080p"
  }'
```

:::

### Image-to-Video

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/video",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "The subject slowly turns their head and smiles, "
                  "gentle breeze moves their hair, soft natural lighting",
        "model": "kling",
        "duration": 5,
        "aspect_ratio": "9:16",
        "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/portrait.jpg"
    }
)

result = response.json()
if result["status"] == "processing":
    print(f"Job queued: {result['job_id']}")
    print("Poll GET /v1/ai/jobs/{job_id} for completion")
else:
    print(f"Video ready: {result['video_url']}")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/video",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "The subject slowly turns their head and smiles, " +
              "gentle breeze moves their hair, soft natural lighting",
      model: "kling",
      duration: 5,
      aspect_ratio: "9:16",
      image_url: "https://s1.fotohub.app/storage/v1/object/public/uploads/portrait.jpg",
    }),
  }
);

const result = await response.json();
if (result.status === "processing") {
  console.log(`Job queued: ${result.job_id}`);
  console.log("Poll GET /v1/ai/jobs/{job_id} for completion");
} else {
  console.log(`Video ready: ${result.video_url}`);
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "The subject slowly turns their head and smiles, gentle breeze moves their hair, soft natural lighting",
    "model": "kling",
    "duration": 5,
    "aspect_ratio": "9:16",
    "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/portrait.jpg"
  }'
```

:::

### High-Resolution (4K)

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/video",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Aerial drone shot of a coastal city at sunset, "
                  "golden hour lighting, waves crashing against cliffs, "
                  "smooth camera pan from left to right, hyperrealistic",
        "model": "veo-3",
        "duration": 10,
        "aspect_ratio": "16:9",
        "resolution": "4k"
    }
)

result = response.json()
# 4K generations may take longer; check status
if result["status"] == "processing":
    print(f"Processing job: {result['job_id']}")
    print(f"Estimated wait: 2-5 minutes for 4K")
else:
    print(f"Video URL: {result['video_url']}")
    print(f"Credits used: {result['credits_used']}")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/video",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "Aerial drone shot of a coastal city at sunset, " +
              "golden hour lighting, waves crashing against cliffs, " +
              "smooth camera pan from left to right, hyperrealistic",
      model: "veo-3",
      duration: 10,
      aspect_ratio: "16:9",
      resolution: "4k",
    }),
  }
);

const result = await response.json();
// 4K generations may take longer; check status
if (result.status === "processing") {
  console.log(`Processing job: ${result.job_id}`);
  console.log("Estimated wait: 2-5 minutes for 4K");
} else {
  console.log(`Video URL: ${result.video_url}`);
  console.log(`Credits used: ${result.credits_used}`);
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Aerial drone shot of a coastal city at sunset, golden hour lighting, waves crashing against cliffs, smooth camera pan from left to right, hyperrealistic",
    "model": "veo-3",
    "duration": 10,
    "aspect_ratio": "16:9",
    "resolution": "4k"
  }'
```

:::

## Asynchronous Jobs

Video generation is computationally intensive and may take 30 seconds to several minutes depending on model, duration, and resolution. When a generation is still in progress, the API returns a `job_id` with status `"processing"`. You can either poll for completion or use webhooks.

### Poll Endpoint

```
GET /v1/ai/jobs/{job_id}
```

### Poll for Completion

::: code-group

```python [Python]
import requests
import time

job_id = "vj_abc123def456"

while True:
    status_response = requests.get(
        f"https://apis.fotohub.app/v1/ai/jobs/{job_id}",
        headers={"Authorization": "Bearer fh_live_your_api_key"}
    )
    job = status_response.json()

    if job["status"] == "completed":
        print(f"Video ready: {job['video_url']}")
        break
    elif job["status"] == "failed":
        print(f"Generation failed: {job['error']}")
        break
    else:
        print(f"Still processing... ({job.get('progress', 0)}%)")
        time.sleep(5)
```

```typescript [TypeScript]
const jobId = "vj_abc123def456";

async function pollJob(id: string): Promise<string> {
  while (true) {
    const res = await fetch(
      `https://apis.fotohub.app/v1/ai/jobs/${id}`,
      { headers: { "Authorization": "Bearer fh_live_your_api_key" } }
    );
    const job = await res.json();

    if (job.status === "completed") {
      return job.video_url;
    } else if (job.status === "failed") {
      throw new Error(job.error);
    }

    console.log(`Processing... ${job.progress ?? 0}%`);
    await new Promise((r) => setTimeout(r, 5000));
  }
}

const videoUrl = await pollJob(jobId);
console.log("Video ready:", videoUrl);
```

```bash [cURL]
# Poll for job completion
curl -X GET "https://apis.fotohub.app/v1/ai/jobs/vj_abc123def456" \
  -H "Authorization: Bearer fh_live_your_api_key"

# Response when completed:
# {
#   "job_id": "vj_abc123def456",
#   "status": "completed",
#   "video_url": "https://s1.fotohub.app/storage/v1/object/public/...",
#   "duration": 10,
#   "credits_used": 30
# }
```

:::

### Job Status Values

| Status | Description |
|--------|-------------|
| `processing` | Video is being generated. Poll again in 5 seconds. |
| `completed` | Video is ready. The `video_url` field contains the download link. |
| `failed` | Generation failed. The `error` field contains the reason. |

::: tip Webhook Notifications
Instead of polling, configure a webhook URL in your account settings. FOTOhub will send a POST request to your endpoint when the video is ready. The webhook payload includes the full job response with the `video_url`. Subscribe to the `generation.completed` event.
:::

## Error Responses

| Status | Code | Description |
|:------:|------|-------------|
| `400` | `bad_request` | Invalid parameters. Check that `duration` is one of the accepted values (5, 10, 15, 30, 60), `model` is a valid model ID, and `aspect_ratio` is a supported format. |
| `401` | `unauthorized` | Missing or invalid API key. Ensure your `Authorization` header contains a valid `Bearer fh_live_...` token. |
| `402` | `insufficient_credits` | Your account does not have enough credits for this generation. Video generation requires 8-100+ credits depending on model and duration. Top up your account or reduce the duration/resolution. |
| `429` | `rate_limit_exceeded` | Video generation is limited to 5 requests per minute per API key. Wait for current generations to complete before submitting new ones. The response includes a `Retry-After` header indicating when you can retry. |
| `504` | `gateway_timeout` | The generation exceeded the maximum wait time. This typically occurs with long durations (30-60s) or 4K resolution. For these cases, the API automatically returns a `job_id` for async polling rather than timing out. If you receive this error, retry with a shorter duration or lower resolution. |

### Error Response Example

```json
{
  "error": {
    "code": "insufficient_credits",
    "message": "Your account has 5 credits remaining but this generation requires 30 credits.",
    "required_credits": 30,
    "available_credits": 5
  }
}
```

::: warning Rate Limits
Video generation is rate-limited to **5 requests per minute** per API key. This limit applies across all video models. For higher throughput, contact sales for enterprise tier access with dedicated GPU capacity.
:::

## Tips and Best Practices

::: tip Prompt Engineering for Video
For best results, include these elements in your prompt:
- **Subject** - What appears in the video (person, animal, landscape)
- **Action** - What is happening (running, flying, dissolving)
- **Style** - Visual aesthetic (cinematic, anime, documentary)
- **Camera** - Movement and framing (dolly zoom, aerial pan, close-up)
- **Lighting** - Time of day and mood (golden hour, neon-lit, overcast)
:::

::: tip Image-to-Video Best Practices
When using `image_url` for image-to-video generation:
- Use high-resolution source images (at least 1024x1024)
- Ensure the image is publicly accessible or hosted on FOTOhub storage
- Keep the prompt consistent with what is visible in the source image
- Kling and Hailuo models tend to produce the most natural animations from still images
:::

::: warning Credit Consumption
Video generation is the most credit-intensive operation in the API. A single 60-second Veo 3 clip costs 150 credits. Always check `billing.credits_used` in the response to track consumption. Consider starting with short 5-second test clips before generating longer videos.
:::

::: info Output Format
All generated videos are delivered in MP4 format (H.264 codec) with AAC audio track (silent). Videos are stored for 30 days and accessible via the returned `video_url`. Download and save videos to your own storage for permanent retention.
:::
