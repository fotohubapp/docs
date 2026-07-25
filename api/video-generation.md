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
| `model` | string | No | `"veo-2"` | Video generation model to use. Options: `"veo-2"`, `"veo-3"`, `"wan-video"`, `"kling"`, `"hailuo"`, `"seedance"`, `"sora-2"`. |
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
| Wan Video (WAN) | `wan-video` | 8 | 0.45 | Alibaba |
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

## Model Comparison

| Model | Provider | Credits/5s | PLN/sec | Max Duration | Resolution | Speed | Quality | Key Features |
|-------|----------|:----------:|:-------:|:------------:|:----------:|:-----:|:-------:|--------------|
| `veo-2` | Google | 10 | 0.50 | 30s | 1080p | Fast | High | img2vid, txt2vid |
| `veo-3` | Google | 15 | 0.80 | 30s | 4K | Medium | Ultra | audio, cinematic |
| `wan-video` | Alibaba | 8 | 0.30 | 30s | 1080p | Fast | Good | artistic, multishot |
| `kling` | Kuaishou | 10 | 0.40 | 60s | 1080p | Medium | High | realistic, motion |
| `hailuo` | MiniMax | 8 | 0.35 | 30s | 1080p | Fast | Good | balanced |
| `seedance` | ByteDance | 10 | 0.45 | 30s | 1080p | Medium | High | dance, motion |
| `sora-2` | OpenAI | 12 | 0.60 | 20s | 4K | Slow | Ultra | physics, premium |

::: tip Choosing a Model
- **Best overall**: `veo-2` -- fast, high quality, competitive price
- **Maximum quality**: `veo-3` or `sora-2` -- ultra-quality output, cinematic results
- **Budget batch processing**: `wan-video` or `hailuo` -- lowest cost per second
- **Longest clips**: `kling` -- supports up to 60 seconds
- **With audio**: `veo-3` -- generates synchronized audio automatically
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

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"prompt":       "A golden retriever running through a sunlit meadow, cinematic slow motion, shallow depth of field, warm afternoon light, shot on 35mm film",
		"model":        "veo-2",
		"duration":     5,
		"aspect_ratio": "16:9",
		"resolution":   "1080p",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/video", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	fmt.Printf("Video URL: %s\n", result["video_url"])
	fmt.Printf("Credits used: %v\n", result["credits_used"])
}
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

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"prompt":       "The subject slowly turns their head and smiles, gentle breeze moves their hair, soft natural lighting",
		"model":        "kling",
		"duration":     5,
		"aspect_ratio": "9:16",
		"image_url":    "https://s1.fotohub.app/storage/v1/object/public/uploads/portrait.jpg",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/video", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	if result["status"] == "processing" {
		fmt.Printf("Job queued: %s\n", result["job_id"])
		fmt.Println("Poll GET /v1/ai/jobs/{job_id} for completion")
	} else {
		fmt.Printf("Video ready: %s\n", result["video_url"])
	}
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

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"prompt":       "Aerial drone shot of a coastal city at sunset, golden hour lighting, waves crashing against cliffs, smooth camera pan from left to right, hyperrealistic",
		"model":        "veo-3",
		"duration":     10,
		"aspect_ratio": "16:9",
		"resolution":   "4k",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/video", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	// 4K generations may take longer; check status
	if result["status"] == "processing" {
		fmt.Printf("Processing job: %s\n", result["job_id"])
		fmt.Println("Estimated wait: 2-5 minutes for 4K")
	} else {
		fmt.Printf("Video URL: %s\n", result["video_url"])
		fmt.Printf("Credits used: %v\n", result["credits_used"])
	}
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

### Video with Audio (Veo 3)

Veo 3 can generate synchronized audio alongside the video -- ambient sounds, speech, and music are produced automatically based on the scene described in your prompt. No separate audio generation step is required.

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
        "prompt": "A street musician playing acoustic guitar in a busy market, "
                  "crowd chatter and footsteps in background, warm string tones, "
                  "camera slowly dollies in on the performer's hands",
        "model": "veo-3",
        "duration": 10,
        "aspect_ratio": "16:9",
        "resolution": "1080p",
        "audio": True
    }
)

result = response.json()
if result["status"] == "completed":
    print(f"Video with audio: {result['video_url']}")
    print(f"Audio included: {result.get('has_audio', True)}")
else:
    print(f"Processing: {result['job_id']}")
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
      prompt: "A street musician playing acoustic guitar in a busy market, " +
              "crowd chatter and footsteps in background, warm string tones, " +
              "camera slowly dollies in on the performer's hands",
      model: "veo-3",
      duration: 10,
      aspect_ratio: "16:9",
      resolution: "1080p",
      audio: true,
    }),
  }
);

const result = await response.json();
if (result.status === "completed") {
  console.log("Video with audio:", result.video_url);
  console.log("Audio included:", result.has_audio ?? true);
} else {
  console.log(`Processing: ${result.job_id}`);
}
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"prompt":       "A street musician playing acoustic guitar in a busy market, crowd chatter and footsteps in background, warm string tones, camera slowly dollies in on the performer's hands",
		"model":        "veo-3",
		"duration":     10,
		"aspect_ratio": "16:9",
		"resolution":   "1080p",
		"audio":        true,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/video", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	if result["status"] == "completed" {
		fmt.Printf("Video with audio: %s\n", result["video_url"])
	} else {
		fmt.Printf("Processing: %s\n", result["job_id"])
	}
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A street musician playing acoustic guitar in a busy market, crowd chatter and footsteps in background, warm string tones, camera slowly dollies in on the performers hands",
    "model": "veo-3",
    "duration": 10,
    "aspect_ratio": "16:9",
    "resolution": "1080p",
    "audio": true
  }'
```

:::

::: info Veo 3 Audio Generation
When `audio: true` is set with `veo-3`, the model generates scene-appropriate audio synchronized to the visual content. This includes:
- **Ambient sounds** -- environment noise matching the scene (traffic, wind, crowd)
- **Sound effects** -- action-triggered audio (footsteps, impacts, splashes)
- **Speech** -- if characters are talking in the prompt, dialogue is generated
- **Music** -- if musical instruments or singing are described

The output MP4 includes a full AAC audio track. Audio generation adds approximately 15-30 seconds to processing time. Other models (`veo-2`, `kling`, etc.) produce silent video by default.
:::

---

## Asynchronous Jobs

Video generation is computationally intensive and may take 30 seconds to several minutes depending on model, duration, and resolution. When a generation is still in progress, the API returns a `job_id` with status `"processing"`. You can either poll for completion or use webhooks.

### Poll Endpoint

```
GET /v1/ai/jobs/{job_id}
```

### Submit and Poll Pattern

The recommended pattern is: submit the generation request, receive a `job_id`, then poll until completion. This avoids HTTP timeouts on long-running generations.

::: code-group

```python [Python]
import requests
import time

# Step 1: Submit generation request
response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/video",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Cinematic aerial shot of a mountain range at sunrise, "
                  "volumetric fog in valleys, golden light on peaks, drone flyover",
        "model": "veo-3",
        "duration": 15,
        "resolution": "4k"
    }
)

result = response.json()
job_id = result["job_id"]
print(f"Job submitted: {job_id}")

# Step 2: Poll for completion
while True:
    status_response = requests.get(
        f"https://apis.fotohub.app/v1/ai/jobs/{job_id}",
        headers={"Authorization": "Bearer fh_live_your_api_key"}
    )
    job = status_response.json()

    if job["status"] == "completed":
        print(f"Video ready: {job['video_url']}")
        print(f"Credits used: {job['credits_used']}")
        break
    elif job["status"] == "failed":
        print(f"Generation failed: {job['error']}")
        break
    else:
        print(f"Still processing... ({job.get('progress', 0)}%)")
        time.sleep(3)
```

```typescript [TypeScript]
// Step 1: Submit generation request
const submitResponse = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/video",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "Cinematic aerial shot of a mountain range at sunrise, " +
              "volumetric fog in valleys, golden light on peaks, drone flyover",
      model: "veo-3",
      duration: 15,
      resolution: "4k",
    }),
  }
);

const { job_id: jobId } = await submitResponse.json();
console.log(`Job submitted: ${jobId}`);

// Step 2: Poll for completion
async function pollJob(id: string): Promise<string> {
  while (true) {
    const res = await fetch(
      `https://apis.fotohub.app/v1/ai/jobs/${id}`,
      { headers: { "Authorization": "Bearer fh_live_your_api_key" } }
    );
    const job = await res.json();

    if (job.status === "completed") {
      console.log(`Credits used: ${job.credits_used}`);
      return job.video_url;
    } else if (job.status === "failed") {
      throw new Error(job.error);
    }

    console.log(`Processing... ${job.progress ?? 0}%`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

const videoUrl = await pollJob(jobId);
console.log("Video ready:", videoUrl);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type JobResponse struct {
	JobID       string  `json:"job_id"`
	Status      string  `json:"status"`
	VideoURL    string  `json:"video_url"`
	CreditsUsed float64 `json:"credits_used"`
	Progress    int     `json:"progress"`
	Error       string  `json:"error"`
}

func main() {
	// Step 1: Submit generation request
	payload := map[string]interface{}{
		"prompt":     "Cinematic aerial shot of a mountain range at sunrise, volumetric fog in valleys, golden light on peaks, drone flyover",
		"model":      "veo-3",
		"duration":   15,
		"resolution": "4k",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/video", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var submitResult JobResponse
	json.NewDecoder(resp.Body).Decode(&submitResult)
	fmt.Printf("Job submitted: %s\n", submitResult.JobID)

	// Step 2: Poll with goroutine using time.NewTicker
	done := make(chan JobResponse)
	go func() {
		ticker := time.NewTicker(3 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			pollReq, _ := http.NewRequest("GET",
				fmt.Sprintf("https://apis.fotohub.app/v1/ai/jobs/%s", submitResult.JobID), nil)
			pollReq.Header.Set("Authorization", "Bearer fh_live_your_api_key")

			pollResp, err := http.DefaultClient.Do(pollReq)
			if err != nil {
				continue
			}

			var job JobResponse
			json.NewDecoder(pollResp.Body).Decode(&job)
			pollResp.Body.Close()

			if job.Status == "completed" || job.Status == "failed" {
				done <- job
				return
			}
			fmt.Printf("Processing... %d%%\n", job.Progress)
		}
	}()

	// Wait for result
	finalJob := <-done
	if finalJob.Status == "completed" {
		fmt.Printf("Video ready: %s\n", finalJob.VideoURL)
		fmt.Printf("Credits used: %.0f\n", finalJob.CreditsUsed)
	} else {
		fmt.Printf("Generation failed: %s\n", finalJob.Error)
	}
}
```

```bash [cURL]
# Step 1: Submit generation request
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Cinematic aerial shot of a mountain range at sunrise, volumetric fog in valleys, golden light on peaks, drone flyover",
    "model": "veo-3",
    "duration": 15,
    "resolution": "4k"
  }'

# Response: {"job_id": "vj_abc123def456", "status": "processing", ...}

# Step 2: Poll for completion (repeat every 3 seconds)
curl -X GET "https://apis.fotohub.app/v1/ai/jobs/vj_abc123def456" \
  -H "Authorization: Bearer fh_live_your_api_key"

# Response when completed:
# {
#   "job_id": "vj_abc123def456",
#   "status": "completed",
#   "video_url": "https://s1.fotohub.app/storage/v1/object/public/generations/videos/vj_abc123def456.mp4",
#   "duration": 15,
#   "credits_used": 45
# }
```

:::

### Job Status Values

| Status | Description |
|--------|-------------|
| `processing` | Video is being generated. Poll again in 3 seconds. |
| `completed` | Video is ready. The `video_url` field contains the download link. |
| `failed` | Generation failed. The `error` field contains the reason. |

## Webhook Notifications

Instead of polling, you can receive real-time notifications when video generation completes. Configure a webhook endpoint in your [account settings](https://fotohub.app/settings/api) or pass `webhook_url` in the request body.

### Webhook Setup

::: code-group

```python [Python]
import requests

# Submit video with webhook URL
response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/video",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "A futuristic city skyline at night, neon reflections on wet streets",
        "model": "veo-2",
        "duration": 10,
        "webhook_url": "https://your-server.com/webhooks/fotohub"
    }
)

result = response.json()
print(f"Job submitted: {result['job_id']}")
print("You will receive a POST to your webhook when ready")
```

```typescript [TypeScript]
// Submit video with webhook URL
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/video",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "A futuristic city skyline at night, neon reflections on wet streets",
      model: "veo-2",
      duration: 10,
      webhook_url: "https://your-server.com/webhooks/fotohub",
    }),
  }
);

const result = await response.json();
console.log(`Job submitted: ${result.job_id}`);
console.log("You will receive a POST to your webhook when ready");
```

```go [Go]
payload := map[string]interface{}{
	"prompt":      "A futuristic city skyline at night, neon reflections on wet streets",
	"model":       "veo-2",
	"duration":    10,
	"webhook_url": "https://your-server.com/webhooks/fotohub",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/video", bytes.NewBuffer(body))
req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()

var result map[string]interface{}
json.NewDecoder(resp.Body).Decode(&result)
fmt.Printf("Job submitted: %s\n", result["job_id"])
fmt.Println("You will receive a POST to your webhook when ready")
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic city skyline at night, neon reflections on wet streets",
    "model": "veo-2",
    "duration": 10,
    "webhook_url": "https://your-server.com/webhooks/fotohub"
  }'
```

:::

### Webhook Payload

When the video is ready (or fails), FOTOhub sends a `POST` request to your `webhook_url` with the following payload:

```json
{
  "event": "video.ready",
  "timestamp": "2026-07-23T14:30:00Z",
  "data": {
    "job_id": "vj_abc123def456",
    "status": "completed",
    "model": "veo-2",
    "video_url": "https://s1.fotohub.app/storage/v1/object/public/generations/videos/vj_abc123def456.mp4",
    "duration": 10,
    "credits_used": 20,
    "billing": {
      "method": "credits",
      "credits_used": 20,
      "pln_charged": 1.50
    }
  }
}
```

### Handling Webhooks

::: code-group

```python [Python]
from flask import Flask, request, jsonify
import hmac
import hashlib

app = Flask(__name__)
WEBHOOK_SECRET = "whsec_your_webhook_secret"

@app.route("/webhooks/fotohub", methods=["POST"])
def handle_webhook():
    # Verify signature
    signature = request.headers.get("X-FotoHub-Signature")
    payload = request.get_data()
    expected = hmac.new(
        WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        return jsonify({"error": "Invalid signature"}), 401

    event = request.json
    if event["event"] == "video.ready":
        data = event["data"]
        if data["status"] == "completed":
            print(f"Video ready: {data['video_url']}")
            # Process the completed video (download, store, notify user...)
        else:
            print(f"Video failed: {data.get('error')}")

    return jsonify({"received": True}), 200
```

```typescript [TypeScript]
import { createHmac, timingSafeEqual } from "crypto";
import express from "express";

const app = express();
const WEBHOOK_SECRET = "whsec_your_webhook_secret";

app.post("/webhooks/fotohub", express.raw({ type: "application/json" }), (req, res) => {
  // Verify signature
  const signature = req.headers["x-fotohub-signature"] as string;
  const expected = createHmac("sha256", WEBHOOK_SECRET)
    .update(req.body)
    .digest("hex");

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = JSON.parse(req.body.toString());
  if (event.event === "video.ready") {
    const { status, video_url, error } = event.data;
    if (status === "completed") {
      console.log(`Video ready: ${video_url}`);
      // Process the completed video...
    } else {
      console.error(`Video failed: ${error}`);
    }
  }

  res.json({ received: true });
});

app.listen(3000);
```

```go [Go]
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const webhookSecret = "whsec_your_webhook_secret"

type WebhookEvent struct {
	Event     string `json:"event"`
	Timestamp string `json:"timestamp"`
	Data      struct {
		JobID       string  `json:"job_id"`
		Status      string  `json:"status"`
		VideoURL    string  `json:"video_url"`
		CreditsUsed float64 `json:"credits_used"`
		Error       string  `json:"error"`
	} `json:"data"`
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(r.Body)

	// Verify signature
	signature := r.Header.Get("X-FotoHub-Signature")
	mac := hmac.New(sha256.New, []byte(webhookSecret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(signature), []byte(expected)) {
		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	var event WebhookEvent
	json.Unmarshal(body, &event)

	if event.Event == "video.ready" {
		if event.Data.Status == "completed" {
			fmt.Printf("Video ready: %s\n", event.Data.VideoURL)
			// Process the completed video...
		} else {
			fmt.Printf("Video failed: %s\n", event.Data.Error)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"received": true}`))
}

func main() {
	http.HandleFunc("/webhooks/fotohub", webhookHandler)
	http.ListenAndServe(":3000", nil)
}
```

```bash [cURL]
# Test your webhook endpoint locally with a sample payload:
curl -X POST "http://localhost:3000/webhooks/fotohub" \
  -H "Content-Type: application/json" \
  -H "X-FotoHub-Signature: your_computed_signature" \
  -d '{
    "event": "video.ready",
    "timestamp": "2026-07-23T14:30:00Z",
    "data": {
      "job_id": "vj_abc123def456",
      "status": "completed",
      "video_url": "https://s1.fotohub.app/storage/v1/object/public/generations/videos/vj_abc123def456.mp4",
      "duration": 10,
      "credits_used": 20
    }
  }'
```

:::

### Webhook Events

| Event | Description |
|-------|-------------|
| `video.ready` | Video generation completed successfully or failed. Check `data.status` for result. |
| `video.progress` | Optional progress update (sent every 25%). Only if `webhook_progress: true` is set in request. |

::: warning Webhook Security
- Always verify the `X-FotoHub-Signature` header using HMAC-SHA256 with your webhook secret
- Your webhook secret is available in [Account Settings > API > Webhooks](https://fotohub.app/settings/api)
- Respond with HTTP 200 within 10 seconds or the delivery will be retried (up to 3 attempts)
- Failed deliveries are retried with exponential backoff: 10s, 60s, 300s
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

---

## Related APIs

Looking for more video capabilities? See these related endpoints:

| API | Description | Link |
|-----|-------------|------|
| **Video Editing** | Transcode, merge, stabilize, upscale, effects, watermarks, AI Director | [Video Editing →](/api/video-editing) |
| **Shorts & Clips** | Auto-generate short-form content from long videos (WhisperX + YOLOv8 + LLM scoring) | [Shorts & Clips →](/api/shorts-clips) |
| **Story Studio** | Multi-scene AI story generation with characters, storyboards, and narration | [Story Studio →](/api/story-studio) |
| **Lip-Sync** | Sync lips to audio using MuseTalk, LatentSync, or FaceFusion | [Lip-Sync →](/api/lip-sync) |
