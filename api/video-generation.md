# Video Generation

Generate high-quality AI videos from text prompts or source images. FOTOhub provides access to 30+ video models across 6 providers, supporting text-to-video, image-to-video, reference-to-video, and video editing workflows. Generate clips up to 60 seconds, with configurable aspect ratios and resolutions up to 4K.

| | |
|---|---|
| **Models** | 30+ models from 6 providers |
| **Duration** | 2-60 seconds, model-dependent (longest single clip: 30s on `seedance-2-5`) |
| **Resolution** | 480p, 720p, 1080p, 4K (model-dependent) |
| **Modes** | Text-to-video, image-to-video, reference-to-video, video-to-video editing, native audio, lip-sync |

::: warning Canonical model catalog
The set of `model` IDs accepted below is served dynamically. Always query `GET /v1/models?category=video` for the authoritative, always-current list — see the [full Video Generation Models catalog](/api/models#video-generation-models) for pricing across every provider.
:::

## Endpoint

```
POST /v1/ai/generate/video
```

**Authentication:** Bearer token (API key)  
**Billing:** per-second credits (model-dependent, 1.2-90 credits/s), or a flat per-video amount for MiniMax Hailuo models.

## Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | **Yes** | — | Detailed description of the video to generate. Include subject, action, style, camera movement, and lighting for best results. |
| `model` | string | No | `"veo-3.1-generate-001"` | Video generation model to use. See [Model Pricing](#model-pricing) below or `GET /v1/models?category=video` for the full, current list. Examples: `"veo-3.1-generate-001"`, `"wan2.6-t2v"`, `"seedance-2-5"`, `"seedance-2-0-pro"`, `"kling-v3"`, `"sora-2"`, `"grok-imagine-video-1.5"`, `"gemini-omni-flash"`. |
| `duration` | integer | No | `5` | Video duration in seconds (capped at 60). Supported values vary by model. |
| `aspect_ratio` | string | No | `"16:9"` | Output aspect ratio. Options: `"16:9"` (landscape), `"9:16"` (portrait/vertical), `"1:1"` (square). |
| `image_url` | string | No | — | URL of a source image for image-to-video generation. When provided, the video will animate from this starting frame. Must be a publicly accessible URL or a FOTOhub storage URL. |
| `resolution` | string | No | `"1080p"` | Output video resolution. Options: `"720p"`, `"1080p"`, `"4k"` — availability depends on model (e.g. `veo-2.0-generate-001` is 720p-only; `gemini-omni-flash` is fixed at 720p). |

## Response Format

### Completed Response (200)

```json
{
  "model": "veo-3.1-generate-001",
  "credits_used": 60,
  "video_url": "https://s1.fotohub.app/storage/v1/object/public/generations/videos/vj_abc123.mp4",
  "job_id": "vj_abc123",
  "status": "completed",
  "duration": 5
}
```

This endpoint reports the charge as `credits_used` only -- there is no `billing`
object on the video response. When your plan allowance is exhausted the same
credits are drawn from the USD wallet at $0.0536 per credit, so the 60 credits
above bill $3.22. Use `GET /v1/billing/usage` for the money figure.

### Processing Response (202)

```json
{
  "job_id": "vj_abc123def456",
  "status": "processing",
  "model": "veo-3.1-generate-001",
  "estimated_seconds": 120,
  "poll_url": "https://apis.fotohub.app/v1/ai/jobs/vj_abc123def456",
  "webhook_supported": true
}
```

::: info Asynchronous Processing
Video generation can take 30 seconds to several minutes depending on the model and duration. When the video is still processing, the response will include `"status": "processing"` and a `job_id`. Use this ID to poll for completion or configure a webhook to receive notifications.
:::

## Model Pricing

Per-second pricing for the most commonly used model per provider (see the [full catalog](/api/models#video-generation-models) for every variant):

| Model | ID | Credits/s | Provider | Notes |
|-------|-----|:---------:|----------|-------|
| Wan 2.2 Plus | `wan2.2-t2v-plus` | 1.2 | Alibaba | cheapest tier |
| Seedance 2.0 Mini | `seedance-2-0-mini` | 2.8 | ByteDance | budget |
| Kling v2.5 Turbo | `kling-v2-5-turbo` | 1.6 | Kuaishou | |
| Hailuo O2 | `hailuo-o2` | — | MiniMax | 6 credits flat, per video |
| **Google Veo 3.1** | `veo-3.1-generate-001` | **12** | Google | native audio, up to 4K |
| Gemini Omni Flash | `gemini-omni-flash` | 6 | Google | native audio, T2V+I2V |
| OpenAI Sora 2 | `sora-2` | 8 | OpenAI | |
| Grok Video 1.5 | `grok-imagine-video-1.5` | 9 | xAI | lip-sync |
| **Seedance 2.5** | `seedance-2-5` | **14.5** (720p) / 6.4 (480p) | ByteDance | up to **30s in one clip**, audio at no extra cost |

::: tip Recommended Model
**`veo-3.1-generate-001`** offers the best balance of quality, native audio, and features (last-frame + reference images) for most use cases. Use **`wan2.2-t2v-plus`** or **`wan2.2-i2v-plus`** for budget-conscious batch processing, or **`gemini-omni-flash`** when you want native audio without Veo's higher per-second cost. For anything longer than 15 seconds, **`seedance-2-5`** is the only single-request option — see [Seedance 2.5](#seedance-2-5-long-clips-video-editing) below.
:::

### Credit Scaling by Duration

Almost every model bills `credits/s × duration` (MiniMax Hailuo is the exception — flat per-video pricing regardless of duration):

| Duration | Example (`veo-3.1-generate-001`, 12 cr/s) |
|----------|---------------------------------------------|
| 5 seconds | 60 credits ($3.22 from wallet) |
| 10 seconds | 120 credits ($6.43 from wallet) |
| 15 seconds | 180 credits ($9.65 from wallet) |

USD figures are the wallet fallback at $0.0536 per credit, charged only after
your plan's monthly credit allowance is used up.

::: info Formula
`total_credits = credits_per_second × duration`

For example, a 10-second `wan2.2-t2v-plus` video costs: `1.2 × 10 = 12 credits`
:::

## Model Comparison

| Model | Provider | Credits/s | Max Duration | Resolution | Audio | Key Features |
|-------|----------|:---------:|:------------:|:----------:|:-----:|--------------|
| `veo-3.1-generate-001` | Google | 12 | 8s | 4K | native | last-frame, reference images |
| `gemini-omni-flash` | Google | 6 | 10s | 720p | native (automatic) | reference-to-video |
| `wan2.2-t2v-plus` / `-i2v-plus` | Alibaba | 1.2 | 15s | 1080p | none | cheapest, artistic |
| `kling-v3` | Kuaishou | 5 | 15s | 1080p | optional | realistic motion |
| `hailuo-o2` | MiniMax | — (flat) | 10s | 1080p | none | first+last frame |
| `seedance-2-5` | ByteDance | 14.5 (720p) | **30s** | 720p | native, **included** | longest single clip, video-to-video editing, 30 image + 10 video + 10 audio references |
| `seedance-2-0-pro` | ByteDance | 9.4 | 15s | 4K | native | highest Seedance resolution |
| `sora-2` | OpenAI | 8 | 12s | 1080p | native | physics-accurate |
| `grok-imagine-video-1.5` | xAI | 9 | 15s | 1080p | none | **lip-sync** generation |

::: tip Choosing a Model
- **Best overall**: `veo-3.1-generate-001` -- native audio, high quality, competitive price
- **Maximum quality**: `veo-3.1-generate-001` or `sora-2` -- ultra-quality output, cinematic results
- **Longest clip / video editing**: `seedance-2-5` -- 4-30s in a single request, audio at no extra cost
- **Highest Seedance resolution**: `seedance-2-0-pro` -- up to 4K (2.5 tops out at 720p)
- **Budget batch processing**: `wan2.2-t2v-plus` / `wan2.2-i2v-plus` -- lowest cost per second
- **Native audio without Veo**: `gemini-omni-flash` -- automatic audio, no surcharge tier
- **Lip-sync generation**: `grok-imagine-video-1.5` -- portrait + script → talking head
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
        "model": "veo-3.1-generate-001",
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
      model: "veo-3.1-generate-001",
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
		"model":        "veo-3.1-generate-001",
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
    "model": "veo-3.1-generate-001",
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
        "model": "kling-v3",
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
      model: "kling-v3",
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
		"model":        "kling-v3",
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
    "model": "kling-v3",
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
        "model": "veo-3.1-generate-001",
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
      model: "veo-3.1-generate-001",
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
		"model":        "veo-3.1-generate-001",
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
    "model": "veo-3.1-generate-001",
    "duration": 10,
    "aspect_ratio": "16:9",
    "resolution": "4k"
  }'
```

:::

### Video with Audio (Veo 3.1 / Gemini Omni Flash)

Two model families generate synchronized audio alongside the video -- ambient sounds, speech, and music are produced automatically based on the scene described in your prompt. No separate audio generation step is required.

- **`veo-3.1-generate-001`** (and other Veo 3.x models) -- audio is opt-in via the `audio: true` flag, billed at a higher per-second rate (audio tier vs. silent tier).
- **`gemini-omni-flash`** -- audio is generated automatically on every clip, no flag needed and no separate billing tier.

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
        "model": "veo-3.1-generate-001",
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
      model: "veo-3.1-generate-001",
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
		"model":        "veo-3.1-generate-001",
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
    "model": "veo-3.1-generate-001",
    "duration": 10,
    "aspect_ratio": "16:9",
    "resolution": "1080p",
    "audio": true
  }'
```

:::

::: info Veo / Omni Audio Generation
When `audio: true` is set with a Veo 3.x model, or automatically with `gemini-omni-flash`, the audio track is scene-appropriate and synchronized to the visual content. This includes:
- **Ambient sounds** -- environment noise matching the scene (traffic, wind, crowd)
- **Sound effects** -- action-triggered audio (footsteps, impacts, splashes)
- **Speech** -- if characters are talking in the prompt, dialogue is generated
- **Music** -- if musical instruments or singing are described

The output MP4 includes a full AAC audio track. Audio generation adds approximately 15-30 seconds to processing time. Other models (`veo-2.0-generate-001`, `kling-v3`, `wan2.2-t2v-plus`, etc.) produce silent video by default.
:::

---

## Seedance 2.5 — long clips, video editing

`seedance-2-5` is the only model on the platform that produces a **30-second clip in
a single request**, and the only one that takes an existing video as input. It is
also the one Seedance tier where **native audio costs nothing extra** — the
per-second rate is identical with `generate_audio` on or off.

| | |
|---|---|
| **Model ID** | `seedance-2-5` |
| **Duration** | any integer **4-30** seconds (`3` and `31` are rejected with a 400) |
| **Resolution** | `480p`, `720p` — **1080p and 4K are not supported** and return a 400 |
| **Frame rate** | 24 fps |
| **Price** | **14.5 credits/s** at 720p, **6.4 credits/s** at 480p |
| **Price with a video reference** | 17.6 credits/s at 720p, 7.8 at 480p (the source frames bill as input) |
| **Audio** | native, **included in the price** |
| **References** | up to **30 images**, **10 videos**, **10 audio clips** |
| **Output container** | `mp4` (default) or `mov` |
| **Mode** | asynchronous — returns `202` + `job_id`, poll or use a webhook |

A 30-second 720p clip costs `14.5 × 30 = 435 credits`. A 5-second 480p draft of the
same shot costs `6.4 × 5 = 32` — draft at 480p, finish at 720p.

::: warning 720p ceiling
2.5 is not a superset of 2.0 Pro. It reaches 30 seconds but stops at 720p, while
`seedance-2-0-pro` reaches 4K but stops at 15 seconds. Sending `resolution: "1080p"`
to `seedance-2-5` returns a 400 rather than silently downgrading, because the price
scales with resolution and a silent downgrade would mean charging for pixels you
never received.
:::

### Parameters (Seedance-only)

These are accepted in addition to the [standard parameters](#request-parameters) above.

| Parameter | Type | Description |
|-----------|------|-------------|
| `generate_audio` | boolean | Native soundtrack. Free on 2.5 — the per-second rate is the same either way. Alias: `audio`. |
| `image_url` | string | First frame (image-to-video). |
| `last_frame_url` | string | Final frame. With `image_url` this becomes a first+last frame interpolation. |
| `reference_images` | array | Up to 30. URLs, or `{"mimeType": "...", "base64": "..."}` objects. |
| `reference_videos` | array | Up to 10. Attaching one switches the request to reference / editing / extension mode. |
| `reference_audios` | array | Up to 10. Requires at least one image or video reference. |
| `asset_ids` | array | Pre-registered `asset://` portrait IDs — see [face consistency](#face-consistency-asset-ids). |
| `output_format` | string | `"mp4"` (default) or `"mov"`. |
| `smart_ratio` | boolean | Let the model pick the aspect ratio. Equivalent to `aspect_ratio: "adaptive"`. |
| `smart_duration` | boolean | Let the model pick the duration. Equivalent to `duration: -1`. |
| `callback_url` | string | HTTPS URL POSTed once the job reaches a terminal state, with the same body as the poll route. Retried at 1s/2s/4s on a non-2xx, then dropped. Alias: `webhook_url`. |
| `negative_prompt` | string | Recorded on the job. |
| `seed` | integer | Recorded on the job. |
| `aspect_ratio` | string | `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `21:9`, or `adaptive`. |

`quality` (alias of `resolution`), `image_urls` (`[first]` or `[first, last]`),
`video_urls` and `audio_urls` are accepted as aliases so an integration written
against a Seedance reseller's API works by changing only the base URL and key.

### Task types and locked parameters

2.5 infers what you are asking for from the prompt and the attached media, and three
of the five task types then **fix** `aspect_ratio` (and for editing, `duration`) to
whatever the input clip has. FOTOhub resolves those locks before billing and returns
the effective values on the `202`, so you are charged for what is actually rendered.

| Task type | Triggered by | Locked |
|-----------|--------------|--------|
| `t2v` | prompt only | — |
| `reference` | any image / video / `asset_ids` attached | — |
| `frames` | `image_url` and/or `last_frame_url` | `aspect_ratio` → `adaptive` |
| `editing` | a reference video + edit wording ("remove the…", "replace the…") | `aspect_ratio` → `adaptive`, `duration` → source length |
| `extension` | a reference video + extension wording ("extend forward", "continue the video") | `aspect_ratio` → `adaptive` |

The `202` response includes `"task_type"` so you can confirm which one was inferred.

::: tip duration: -1
Send `duration: -1` (or `smart_duration: true`) to match the source clip's length.
Because the real length is unknown until the clip is decoded, the request is billed
at the 30-second ceiling and `duration_requested: -1` is echoed back on the `202`.
:::

### Generate a 30-second clip

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

video = client.generate_seedance(
    prompt=(
        "A chef plates a dish in a warm restaurant kitchen: hands dust herbs over "
        "seared scallops, steam rises, the camera pushes in slowly. Ambient kitchen "
        "sounds and a low jazz bed."
    ),
    model="seedance-2-5",
    duration=30,
    resolution="720p",
    aspect_ratio="16:9",
    generate_audio=True,
)

print(video["video_url"])       # already finished — submit + poll handled for you
print(video["credits_used"])    # 435
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const video = await client.generateSeedance({
  prompt:
    "A chef plates a dish in a warm restaurant kitchen: hands dust herbs over " +
    "seared scallops, steam rises, the camera pushes in slowly. Ambient kitchen " +
    "sounds and a low jazz bed.",
  model: "seedance-2-5",
  duration: 30,
  resolution: "720p",
  aspect_ratio: "16:9",
  generate_audio: true,
});

console.log(video.video_url);    // already finished
console.log(video.credits_used); // 435
```

```bash [cURL]
# Submit — returns 202 with a job_id and poll_url
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A chef plates a dish in a warm restaurant kitchen, steam rising, camera pushes in slowly",
    "model": "seedance-2-5",
    "duration": 30,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": true
  }'

# Poll until status is "completed"
curl "https://apis.fotohub.app/v1/ai/generate/video/vj_abc123def456" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

Submit response (`202`):

```json
{
  "model": "seedance-2-5",
  "job_id": "8f1c2d3e-4b5a-6c7d-8e9f-0a1b2c3d4e5f",
  "status": "queued",
  "credits_used": 435,
  "billing": {
    "method": "credits",
    "breakdown": {
      "credits_per_second": 14.5,
      "duration_seconds": 30,
      "resolution": "720p",
      "audio": true
    }
  },
  "duration": 30,
  "resolution": "720p",
  "aspect_ratio": "16:9",
  "generate_audio": true,
  "task_type": "t2v",
  "estimated_seconds": 240,
  "poll_url": "https://apis.fotohub.app/v1/ai/generate/video/8f1c2d3e-4b5a-6c7d-8e9f-0a1b2c3d4e5f"
}
```

### Edit an existing video

Attach a reference video and describe the change. The output keeps the source
geometry and length, so `aspect_ratio` and `duration` are resolved for you.

```bash
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Replace the grey sky with a clear blue sky and warm afternoon light",
    "model": "seedance-2-5",
    "resolution": "720p",
    "reference_videos": ["https://s1.fotohub.app/storage/v1/object/public/videos/source.mp4"],
    "duration": -1
  }'
```

The response reports `"task_type": "editing"` and `"aspect_ratio": "adaptive"`.

### Extend an existing video

Same shape, extension wording instead:

```bash
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Extend forward: the camera continues past the doorway into a sunlit courtyard",
    "model": "seedance-2-5",
    "duration": 10,
    "resolution": "720p",
    "reference_videos": ["https://s1.fotohub.app/storage/v1/object/public/videos/source.mp4"]
  }'
```

::: info A video reference costs more
The source clip's frames bill as input, so a request with `reference_videos` is
charged at 17.6 credits/s at 720p (7.8 at 480p) instead of the base rate. Image and
audio references do not change the rate.
:::

### Face consistency (asset IDs)

Register a portrait once, then reuse it across generations so the same face appears
in every clip:

```bash
# 1. Register (free — returns {asset_id, uri, status})
curl -X POST "https://apis.fotohub.app/v1/ai/assets/register" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://s1.fotohub.app/storage/v1/object/public/photos/face.jpg"}'

# 2. Reuse it
curl -X POST "https://apis.fotohub.app/v1/ai/generate/video" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "The same woman walks through a night market, neon reflections on wet pavement",
    "model": "seedance-2-5",
    "duration": 15,
    "resolution": "720p",
    "asset_ids": ["asset://..."]
  }'
```

The `image_url` must be an HTTPS URL on a FOTOhub host — upload the file first. Asset
IDs are scoped to your account and rejected with a 400 if they belong to someone else.

::: warning Two flags are refused, not ignored
`content_filter: false` and `web_search: true` return a `400`. The upstream provider
accepts any unknown field with a 200, so neither flag does anything — accepting them
silently would let you build on a guarantee that does not exist. `content_filter: true`
is accepted, since standard moderation is what already happens.
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
        "model": "veo-3.1-generate-001",
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
      model: "veo-3.1-generate-001",
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
		"model":      "veo-3.1-generate-001",
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
    "model": "veo-3.1-generate-001",
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
        "model": "veo-3.1-generate-001",
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
      model: "veo-3.1-generate-001",
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
	"model":       "veo-3.1-generate-001",
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
    "model": "veo-3.1-generate-001",
    "duration": 10,
    "webhook_url": "https://your-server.com/webhooks/fotohub"
  }'
```

:::

### Webhook Payload

When the video is ready (or fails), FOTOhub sends a `POST` request to your
`webhook_url`. The body is the job record itself — there is **no** `event` /
`timestamp` envelope and **no** `billing` block:

```json
{
  "job_id": "vj_abc123def456",
  "status": "completed",
  "progress": 100,
  "model": "veo-3.1-generate-001",
  "video_url": "https://s1.fotohub.app/storage/v1/object/public/generations/videos/vj_abc123def456.mp4",
  "duration": 10,
  "completed_at": "2026-07-23T14:30:00Z"
}
```

On failure the same shape arrives with `"status": "failed"` and an `error`
string instead of `video_url`.

::: warning Branch on `status`, not on an event name
There is no `event` key to switch on. `video.ready` and `video.progress` are
**not** real events — `POST /v1/webhooks` rejects both with
`400 Invalid events`. See [Webhook Events](#webhook-events) for the events you
can actually subscribe to.

Billing figures are not delivered by the callback either. Read them from the
generation response at submit time, or from `GET /v1/billing/usage`.
:::

::: tip Only `https` callbacks to public hosts
The worker refuses any non-`https` callback URL, and any URL resolving to a
private IP range, so `http://localhost:...` will never be called. Use a tunnel
(ngrok, Cloudflare Tunnel) when testing locally.
:::

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

    # The body IS the job record -- no event/data envelope.
    job = request.json
    if job["status"] == "completed":
        print(f"Video ready: {job['video_url']}")
        # Process the completed video (download, store, notify user...)
    elif job["status"] == "failed":
        print(f"Video failed: {job.get('error')}")

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

  // The body IS the job record -- no event/data envelope.
  const { status, video_url, error } = JSON.parse(req.body.toString());
  if (status === "completed") {
    console.log(`Video ready: ${video_url}`);
    // Process the completed video...
  } else if (status === "failed") {
    console.error(`Video failed: ${error}`);
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

// The callback body IS the job record -- no event/data envelope.
type WebhookJob struct {
	JobID       string  `json:"job_id"`
	Status      string  `json:"status"`
	Progress    int     `json:"progress"`
	Model       string  `json:"model"`
	VideoURL    string  `json:"video_url"`
	Duration    float64 `json:"duration"`
	CompletedAt string  `json:"completed_at"`
	Error       string  `json:"error"`
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

	var job WebhookJob
	json.Unmarshal(body, &job)

	switch job.Status {
	case "completed":
		fmt.Printf("Video ready: %s\n", job.VideoURL)
		// Process the completed video...
	case "failed":
		fmt.Printf("Video failed: %s\n", job.Error)
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
    "job_id": "vj_abc123def456",
    "status": "completed",
    "progress": 100,
    "model": "veo-3.1-generate-001",
    "video_url": "https://s1.fotohub.app/storage/v1/object/public/generations/videos/vj_abc123def456.mp4",
    "duration": 10,
    "completed_at": "2026-07-23T14:30:00Z"
  }'
```

:::

### Webhook Events

These are the events accepted by `POST /v1/webhooks`. Any other value — including
`video.ready` and `video.progress`, which older revisions of this page
documented — is rejected with `400 Invalid events`.

| Event | Description |
|-------|-------------|
| `generation.completed` | Any generation finished successfully, video included. |
| `generation.failed` | A generation failed. |
| `credits.low` | Credit balance crossed the low-water mark. |
| `credits.depleted` | Credits exhausted; further calls bill the USD wallet. |
| `billing.charged` | A wallet charge was settled. |
| `key.used` | An API key was used. |
| `images.batch.completed` | A batch image job finished. |

There is no progress event for video. Poll `GET /v1/ai/generate/video/{job_id}`
for intermediate progress.

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
