# Video Editing

Professional video editing and processing API. Transcode formats, merge clips, adjust speed, stabilize shaky footage, generate subtitles, apply effects, add watermarks, AI upscale, and let AI direct your edits — all through a single REST API.

All endpoints accept video URLs (publicly accessible) and return processed video URLs. Results are stored for 48 hours.

## Endpoints

| Endpoint | Description | Credits |
|----------|-------------|---------|
| `POST /v1/video/transcode` | Convert format/codec | 1 |
| `POST /v1/video/merge` | Merge multiple videos | 2 |
| `POST /v1/video/speed` | Change speed / slow-mo | 2 |
| `POST /v1/video/stabilize` | AI stabilization | 3 |
| `POST /v1/video/subtitles` | Generate & embed subtitles | 3 |
| `POST /v1/video/effects` | Apply video effects | 2 |
| `POST /v1/video/watermark` | Add watermark | 2 |
| `POST /v1/video/upscale` | AI upscaling 2x/4x | 4 |
| `POST /v1/video/ai-director` | AI plan & remix | 5 |

**Authentication:** Bearer token (API key)  
**Base URL:** `https://apis.fotohub.app`

---

## Transcode

```
POST /v1/video/transcode
```

Convert a video to a different format, codec, resolution, or bitrate. Supports all major containers (MP4, MOV, WebM, MKV) and codecs (H.264, H.265/HEVC, VP9, AV1).

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | — | URL of the video to transcode. Must be publicly accessible. Max 2GB. |
| `format` | string | No | `mp4` | Output container format: `mp4`, `mov`, `webm`, `mkv`. |
| `codec` | string | No | `h264` | Video codec: `h264`, `h265`, `vp9`, `av1`. |
| `resolution` | string | No | `original` | Output resolution: `original`, `4k`, `1080p`, `720p`, `480p`, or custom `WxH` (e.g. `1920x1080`). |
| `bitrate` | string | No | `auto` | Target bitrate: `auto`, or specific value like `5M`, `10M`, `20M` (megabits/s). |
| `audio_codec` | string | No | `aac` | Audio codec: `aac`, `opus`, `mp3`, `copy` (passthrough). |
| `fps` | number | No | `original` | Output frame rate: `original`, `24`, `25`, `30`, `60`. |

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/videos/processed/transcode_a1b2c3d4.mp4",
  "usd_charged": 1,
  "billing": {
    "method": "wallet",
    "usd_charged": 1,
    "usd_charged": 0,
    "pln_charged": 0
  },
  "duration_seconds": 42.5,
  "file_size_bytes": 15728640,
  "output_format": "mp4",
  "output_codec": "h264",
  "output_resolution": "1920x1080",
  "processing_time_ms": 8200
}
```

### Code Examples

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.video.transcode(
    video_url="https://example.com/raw-footage.mov",
    format="mp4",
    codec="h265",
    resolution="1080p",
    bitrate="10M",
)

print(f"Transcoded: {result.output_url}")
print(f"File size: {result.file_size_bytes / 1024 / 1024:.1f} MB")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.video.transcode({
  videoUrl: "https://example.com/raw-footage.mov",
  format: "mp4",
  codec: "h265",
  resolution: "1080p",
  bitrate: "10M",
});

console.log(`Transcoded: ${result.outputUrl}`);
console.log(`File size: ${(result.fileSizeBytes / 1024 / 1024).toFixed(1)} MB`);
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
		"video_url":  "https://example.com/raw-footage.mov",
		"format":     "mp4",
		"codec":      "h265",
		"resolution": "1080p",
		"bitrate":    "10M",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/transcode", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	fmt.Printf("Transcoded: %s\n", result["output_url"])
	fmt.Printf("File size: %.1f MB\n", result["file_size_bytes"].(float64)/1024/1024)
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/video/transcode" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/raw-footage.mov",
    "format": "mp4",
    "codec": "h265",
    "resolution": "1080p",
    "bitrate": "10M"
  }'
```

:::

---

## Merge Videos

```
POST /v1/video/merge
```

Merge multiple video clips into a single video. Clips are concatenated in the order provided. Supports transition effects between clips and automatic audio normalization.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_urls` | array | Yes | — | Array of video URLs to merge, in order. Minimum 2, maximum 20 clips. Each must be publicly accessible. |
| `transition` | string | No | `none` | Transition between clips: `none`, `crossfade`, `fade_black`, `fade_white`, `dissolve`, `wipe_left`, `wipe_right`. |
| `transition_duration` | number | No | `0.5` | Transition duration in seconds (0.1-3.0). Only used when `transition` is not `none`. |
| `normalize_audio` | boolean | No | `true` | Normalize audio levels across all clips to prevent volume jumps. |
| `output_format` | string | No | `mp4` | Output format: `mp4`, `mov`, `webm`. |
| `resolution` | string | No | `auto` | Output resolution: `auto` (uses first clip's resolution), `4k`, `1080p`, `720p`, or custom `WxH`. |

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/videos/processed/merge_x9y8z7w6.mp4",
  "usd_charged": 2,
  "billing": {
    "method": "wallet",
    "usd_charged": 2,
    "usd_charged": 0,
    "pln_charged": 0
  },
  "duration_seconds": 128.4,
  "clips_merged": 4,
  "file_size_bytes": 52428800,
  "output_resolution": "1920x1080",
  "processing_time_ms": 15400
}
```

### Code Examples

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.video.merge(
    video_urls=[
        "https://example.com/intro.mp4",
        "https://example.com/main-content.mp4",
        "https://example.com/outro.mp4",
    ],
    transition="crossfade",
    transition_duration=1.0,
    normalize_audio=True,
)

print(f"Merged video: {result.output_url}")
print(f"Total duration: {result.duration_seconds}s")
print(f"Clips merged: {result.clips_merged}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.video.merge({
  videoUrls: [
    "https://example.com/intro.mp4",
    "https://example.com/main-content.mp4",
    "https://example.com/outro.mp4",
  ],
  transition: "crossfade",
  transitionDuration: 1.0,
  normalizeAudio: true,
});

console.log(`Merged video: ${result.outputUrl}`);
console.log(`Total duration: ${result.durationSeconds}s`);
console.log(`Clips merged: ${result.clipsMerged}`);
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
		"video_urls": []string{
			"https://example.com/intro.mp4",
			"https://example.com/main-content.mp4",
			"https://example.com/outro.mp4",
		},
		"transition":          "crossfade",
		"transition_duration": 1.0,
		"normalize_audio":     true,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/merge", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	fmt.Printf("Merged video: %s\n", result["output_url"])
	fmt.Printf("Total duration: %.1fs\n", result["duration_seconds"])
	fmt.Printf("Clips merged: %.0f\n", result["clips_merged"])
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/video/merge" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_urls": [
      "https://example.com/intro.mp4",
      "https://example.com/main-content.mp4",
      "https://example.com/outro.mp4"
    ],
    "transition": "crossfade",
    "transition_duration": 1.0,
    "normalize_audio": true
  }'
```

:::

---

## Change Speed

```
POST /v1/video/speed
```

Change video playback speed or create slow-motion effects. Supports speed factors from 0.1x (10x slower) to 8x. Audio pitch correction is applied automatically when slowing down or speeding up.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | — | URL of the video to process. Max 2GB. |
| `speed` | number | Yes | — | Speed multiplier: `0.1` to `8.0`. Values < 1.0 = slow motion, > 1.0 = speed up. |
| `preserve_audio_pitch` | boolean | No | `true` | Correct audio pitch when changing speed. Set `false` for chipmunk/deep effects. |
| `interpolation` | string | No | `optical_flow` | Frame interpolation for slow-mo: `optical_flow` (best quality, AI-powered), `blend` (fast, slight blur), `duplicate` (fastest, choppy at extreme slow-mo). |
| `output_format` | string | No | `mp4` | Output format: `mp4`, `mov`, `webm`. |

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/videos/processed/speed_f5e4d3c2.mp4",
  "usd_charged": 2,
  "billing": {
    "method": "wallet",
    "usd_charged": 2,
    "usd_charged": 0,
    "pln_charged": 0
  },
  "original_duration_seconds": 10.0,
  "output_duration_seconds": 40.0,
  "speed_factor": 0.25,
  "interpolation": "optical_flow",
  "processing_time_ms": 12600
}
```

### Code Examples

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Slow motion (4x slower)
result = client.video.speed(
    video_url="https://example.com/action-clip.mp4",
    speed=0.25,
    interpolation="optical_flow",
)

print(f"Slow-mo: {result.output_url}")
print(f"Duration: {result.original_duration_seconds}s -> {result.output_duration_seconds}s")

# Speed up (2x faster)
result = client.video.speed(
    video_url="https://example.com/tutorial.mp4",
    speed=2.0,
    preserve_audio_pitch=True,
)
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Slow motion (4x slower)
const result = await client.video.speed({
  videoUrl: "https://example.com/action-clip.mp4",
  speed: 0.25,
  interpolation: "optical_flow",
});

console.log(`Slow-mo: ${result.outputUrl}`);
console.log(`Duration: ${result.originalDurationSeconds}s -> ${result.outputDurationSeconds}s`);

// Speed up (2x faster)
const fast = await client.video.speed({
  videoUrl: "https://example.com/tutorial.mp4",
  speed: 2.0,
  preserveAudioPitch: true,
});
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
	// Slow motion (4x slower)
	payload := map[string]interface{}{
		"video_url":     "https://example.com/action-clip.mp4",
		"speed":         0.25,
		"interpolation": "optical_flow",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/speed", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	fmt.Printf("Slow-mo: %s\n", result["output_url"])
	fmt.Printf("Duration: %.1fs -> %.1fs\n",
		result["original_duration_seconds"], result["output_duration_seconds"])
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/video/speed" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/action-clip.mp4",
    "speed": 0.25,
    "interpolation": "optical_flow"
  }'
```

:::

---

## AI Stabilization

```
POST /v1/video/stabilize
```

AI-powered video stabilization that removes camera shake and jitter. Uses deep learning motion estimation to produce smooth, cinematic results even from handheld or action camera footage.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | — | URL of the video to stabilize. Max 2GB. |
| `strength` | string | No | `medium` | Stabilization strength: `light` (subtle, preserves natural motion), `medium` (balanced), `heavy` (maximum stability, may crop more). |
| `crop_mode` | string | No | `auto` | How to handle stabilization crop: `auto` (AI decides), `fixed` (constant border crop), `dynamic` (variable crop per frame), `none` (allow black borders). |
| `smoothness` | number | No | `0.7` | Motion smoothness factor (0.1-1.0). Lower = allows more natural camera movement. Higher = locked-off tripod feel. |
| `output_format` | string | No | `mp4` | Output format: `mp4`, `mov`, `webm`. |

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/videos/processed/stabilize_b1c2d3e4.mp4",
  "usd_charged": 3,
  "billing": {
    "method": "wallet",
    "usd_charged": 3,
    "usd_charged": 0,
    "pln_charged": 0
  },
  "stability_score": {
    "before": 0.32,
    "after": 0.91
  },
  "crop_percentage": 8.5,
  "duration_seconds": 25.0,
  "processing_time_ms": 18700
}
```

### Code Examples

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.video.stabilize(
    video_url="https://example.com/handheld-footage.mp4",
    strength="heavy",
    smoothness=0.9,
    crop_mode="auto",
)

print(f"Stabilized: {result.output_url}")
print(f"Stability score: {result.stability_score['before']} -> {result.stability_score['after']}")
print(f"Crop applied: {result.crop_percentage}%")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.video.stabilize({
  videoUrl: "https://example.com/handheld-footage.mp4",
  strength: "heavy",
  smoothness: 0.9,
  cropMode: "auto",
});

console.log(`Stabilized: ${result.outputUrl}`);
console.log(`Stability: ${result.stabilityScore.before} -> ${result.stabilityScore.after}`);
console.log(`Crop applied: ${result.cropPercentage}%`);
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
		"video_url":  "https://example.com/handheld-footage.mp4",
		"strength":   "heavy",
		"smoothness": 0.9,
		"crop_mode":  "auto",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/stabilize", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	fmt.Printf("Stabilized: %s\n", result["output_url"])
	score := result["stability_score"].(map[string]interface{})
	fmt.Printf("Stability: %.2f -> %.2f\n", score["before"], score["after"])
	fmt.Printf("Crop applied: %.1f%%\n", result["crop_percentage"])
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/video/stabilize" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/handheld-footage.mp4",
    "strength": "heavy",
    "smoothness": 0.9,
    "crop_mode": "auto"
  }'
```

:::

---

## Generate & Embed Subtitles

```
POST /v1/video/subtitles
```

Automatically transcribes speech in the video using AI speech recognition and embeds styled subtitles. Supports 50+ languages with auto-detection. Returns both the subtitled video and an SRT file.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | — | URL of the video to subtitle. Max 2GB. |
| `language` | string | No | `auto` | Source language: `auto` (auto-detect), or ISO 639-1 code (`en`, `pl`, `de`, `fr`, `es`, `ja`, `zh`, `ko`, etc.). |
| `translate_to` | string | No | `null` | Translate subtitles to another language. ISO 639-1 code. Set to translate while keeping original audio. |
| `style` | string | No | `default` | Subtitle style: `default`, `minimal`, `bold`, `outline`, `karaoke` (word-by-word highlight), `tiktok` (centered, large). |
| `font_size` | integer | No | `24` | Font size in pixels (12-72). |
| `font_color` | string | No | `#ffffff` | Text color as hex code. |
| `background_color` | string | No | `#000000aa` | Background box color with alpha (hex + alpha, e.g. `#000000aa`). Set `transparent` for no background. |
| `position` | string | No | `bottom` | Subtitle position: `top`, `center`, `bottom`. |
| `max_words_per_line` | integer | No | `12` | Maximum words per subtitle line (5-25). Shorter = more readable on mobile. |
| `burn_in` | boolean | No | `true` | Burn subtitles into video (hardcoded). Set `false` to only return SRT/VTT file without modifying video. |

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/videos/processed/subtitles_m4n5o6p7.mp4",
  "srt_url": "https://s1.fotohub.app/storage/v1/object/public/videos/processed/subtitles_m4n5o6p7.srt",
  "vtt_url": "https://s1.fotohub.app/storage/v1/object/public/videos/processed/subtitles_m4n5o6p7.vtt",
  "usd_charged": 3,
  "billing": {
    "method": "wallet",
    "usd_charged": 3,
    "usd_charged": 0,
    "pln_charged": 0
  },
  "language_detected": "en",
  "segments": 47,
  "total_words": 312,
  "duration_seconds": 95.2,
  "processing_time_ms": 22400
}
```

### Code Examples

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Auto-detect language, embed styled subtitles
result = client.video.subtitles(
    video_url="https://example.com/interview.mp4",
    style="bold",
    font_size=28,
    position="bottom",
    max_words_per_line=8,
)

print(f"Subtitled video: {result.output_url}")
print(f"SRT file: {result.srt_url}")
print(f"Language: {result.language_detected}")
print(f"Segments: {result.segments}")

# Translate subtitles to English
result = client.video.subtitles(
    video_url="https://example.com/polish-video.mp4",
    language="pl",
    translate_to="en",
    style="tiktok",
)
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Auto-detect language, embed styled subtitles
const result = await client.video.subtitles({
  videoUrl: "https://example.com/interview.mp4",
  style: "bold",
  fontSize: 28,
  position: "bottom",
  maxWordsPerLine: 8,
});

console.log(`Subtitled video: ${result.outputUrl}`);
console.log(`SRT file: ${result.srtUrl}`);
console.log(`Language: ${result.languageDetected}`);

// Translate subtitles
const translated = await client.video.subtitles({
  videoUrl: "https://example.com/polish-video.mp4",
  language: "pl",
  translateTo: "en",
  style: "tiktok",
});
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
		"video_url":          "https://example.com/interview.mp4",
		"style":             "bold",
		"font_size":         28,
		"position":          "bottom",
		"max_words_per_line": 8,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/subtitles", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	fmt.Printf("Subtitled video: %s\n", result["output_url"])
	fmt.Printf("SRT file: %s\n", result["srt_url"])
	fmt.Printf("Language: %s\n", result["language_detected"])
	fmt.Printf("Segments: %.0f\n", result["segments"])
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/video/subtitles" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/interview.mp4",
    "style": "bold",
    "font_size": 28,
    "position": "bottom",
    "max_words_per_line": 8
  }'
```

:::

---

## Apply Video Effects

```
POST /v1/video/effects
```

Apply visual effects and filters to a video. Supports color grading, cinematic looks, stylization, and compositing effects. Multiple effects can be applied in a single call.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | — | URL of the video to process. Max 2GB. |
| `effects` | array | Yes | — | Array of effects to apply in order. Each effect has a `type` and optional parameters. |
| `output_format` | string | No | `mp4` | Output format: `mp4`, `mov`, `webm`. |

### Effects Array

Each effect in the array is an object with `type` and effect-specific parameters:

| Effect Type | Parameters | Description |
|-------------|-----------|-------------|
| `color_grade` | `preset`: `cinematic`, `warm`, `cool`, `vintage`, `noir`, `teal_orange`, `pastel` | Apply a color grading LUT/preset |
| `brightness` | `value`: -100 to 100 | Adjust brightness |
| `contrast` | `value`: -100 to 100 | Adjust contrast |
| `saturation` | `value`: -100 to 100 | Adjust color saturation (-100 = grayscale) |
| `blur` | `radius`: 1-50 | Apply Gaussian blur to entire frame |
| `vignette` | `intensity`: 0.1-1.0 | Add dark vignette around edges |
| `sharpen` | `amount`: 0.1-3.0 | Sharpen video (useful after upscaling) |
| `denoise` | `strength`: `light`, `medium`, `heavy` | AI noise reduction |
| `letterbox` | `ratio`: `2.35:1`, `2.39:1`, `1.85:1`, `16:9` | Add cinematic letterbox bars |
| `film_grain` | `intensity`: 0.1-1.0, `size`: `fine`, `medium`, `coarse` | Add analog film grain texture |
| `glitch` | `intensity`: 0.1-1.0, `style`: `digital`, `vhs`, `rgb_split` | Digital glitch effect |
| `reverse` | — | Reverse video playback |

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/videos/processed/effects_q8r7s6t5.mp4",
  "usd_charged": 2,
  "billing": {
    "method": "wallet",
    "usd_charged": 2,
    "usd_charged": 0,
    "pln_charged": 0
  },
  "effects_applied": ["color_grade", "vignette", "letterbox", "film_grain"],
  "duration_seconds": 60.0,
  "processing_time_ms": 9800
}
```

### Code Examples

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.video.effects(
    video_url="https://example.com/raw-video.mp4",
    effects=[
        {"type": "color_grade", "preset": "cinematic"},
        {"type": "vignette", "intensity": 0.4},
        {"type": "letterbox", "ratio": "2.35:1"},
        {"type": "film_grain", "intensity": 0.2, "size": "fine"},
    ],
)

print(f"Styled video: {result.output_url}")
print(f"Effects applied: {result.effects_applied}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.video.effects({
  videoUrl: "https://example.com/raw-video.mp4",
  effects: [
    { type: "color_grade", preset: "cinematic" },
    { type: "vignette", intensity: 0.4 },
    { type: "letterbox", ratio: "2.35:1" },
    { type: "film_grain", intensity: 0.2, size: "fine" },
  ],
});

console.log(`Styled video: ${result.outputUrl}`);
console.log(`Effects applied: ${result.effectsApplied}`);
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
		"video_url": "https://example.com/raw-video.mp4",
		"effects": []map[string]interface{}{
			{"type": "color_grade", "preset": "cinematic"},
			{"type": "vignette", "intensity": 0.4},
			{"type": "letterbox", "ratio": "2.35:1"},
			{"type": "film_grain", "intensity": 0.2, "size": "fine"},
		},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/effects", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	fmt.Printf("Styled video: %s\n", result["output_url"])
	fmt.Printf("Effects applied: %v\n", result["effects_applied"])
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/video/effects" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/raw-video.mp4",
    "effects": [
      {"type": "color_grade", "preset": "cinematic"},
      {"type": "vignette", "intensity": 0.4},
      {"type": "letterbox", "ratio": "2.35:1"},
      {"type": "film_grain", "intensity": 0.2, "size": "fine"}
    ]
  }'
```

:::

---

## Add Watermark

```
POST /v1/video/watermark
```

Add a text or image watermark to a video. Supports positioning, opacity, scaling, and optional animation. Useful for branding, copyright protection, or previews.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | — | URL of the video to watermark. Max 2GB. |
| `watermark_type` | string | Yes | — | Type of watermark: `text` or `image`. |
| `text` | string | Conditional | — | Watermark text. Required when `watermark_type` is `text`. Max 100 characters. |
| `image_url` | string | Conditional | — | URL of watermark image (PNG with transparency recommended). Required when `watermark_type` is `image`. |
| `position` | string | No | `bottom_right` | Position: `top_left`, `top_center`, `top_right`, `center`, `bottom_left`, `bottom_center`, `bottom_right`. |
| `opacity` | number | No | `0.7` | Watermark opacity (0.1-1.0). |
| `scale` | number | No | `0.15` | Watermark scale relative to video width (0.05-0.5). Only for image watermarks. |
| `margin` | integer | No | `20` | Margin from edge in pixels (0-100). |
| `font_size` | integer | No | `32` | Font size for text watermarks (12-120). |
| `font_color` | string | No | `#ffffff` | Text color as hex code. |
| `rotation` | number | No | `0` | Rotation angle in degrees (-180 to 180). Use `-30` for diagonal watermarks. |
| `repeat` | boolean | No | `false` | Tile watermark across entire frame (for strong copyright protection). |

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/videos/processed/watermark_u4v3w2x1.mp4",
  "usd_charged": 2,
  "billing": {
    "method": "wallet",
    "usd_charged": 2,
    "usd_charged": 0,
    "pln_charged": 0
  },
  "watermark_type": "image",
  "position": "bottom_right",
  "duration_seconds": 45.0,
  "processing_time_ms": 5200
}
```

### Code Examples

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Image watermark (logo)
result = client.video.watermark(
    video_url="https://example.com/client-preview.mp4",
    watermark_type="image",
    image_url="https://example.com/my-logo.png",
    position="bottom_right",
    opacity=0.6,
    scale=0.12,
    margin=30,
)

# Text watermark (copyright)
result = client.video.watermark(
    video_url="https://example.com/portfolio-piece.mp4",
    watermark_type="text",
    text="PREVIEW - example.com",
    position="center",
    opacity=0.3,
    font_size=48,
    rotation=-30,
    repeat=True,
)

print(f"Watermarked: {result.output_url}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Image watermark (logo)
const result = await client.video.watermark({
  videoUrl: "https://example.com/client-preview.mp4",
  watermarkType: "image",
  imageUrl: "https://example.com/my-logo.png",
  position: "bottom_right",
  opacity: 0.6,
  scale: 0.12,
  margin: 30,
});

// Text watermark (copyright)
const text = await client.video.watermark({
  videoUrl: "https://example.com/portfolio-piece.mp4",
  watermarkType: "text",
  text: "PREVIEW - example.com",
  position: "center",
  opacity: 0.3,
  fontSize: 48,
  rotation: -30,
  repeat: true,
});

console.log(`Watermarked: ${result.outputUrl}`);
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
	// Image watermark (logo)
	payload := map[string]interface{}{
		"video_url":      "https://example.com/client-preview.mp4",
		"watermark_type": "image",
		"image_url":      "https://example.com/my-logo.png",
		"position":       "bottom_right",
		"opacity":        0.6,
		"scale":          0.12,
		"margin":         30,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/watermark", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	fmt.Printf("Watermarked: %s\n", result["output_url"])
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/video/watermark" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/client-preview.mp4",
    "watermark_type": "image",
    "image_url": "https://example.com/my-logo.png",
    "position": "bottom_right",
    "opacity": 0.6,
    "scale": 0.12,
    "margin": 30
  }'
```

:::

---

## AI Upscale

```
POST /v1/video/upscale
```

AI-powered video upscaling using deep learning super-resolution. Increases resolution by 2x or 4x while preserving detail and reducing artifacts. Ideal for restoring old footage or preparing content for large displays.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | — | URL of the video to upscale. Max 2GB. Input resolution must be at most 1080p for 4x, 2160p for 2x. |
| `scale` | integer | Yes | — | Upscale factor: `2` (2x resolution) or `4` (4x resolution). |
| `model` | string | No | `general` | AI model optimized for content type: `general` (balanced), `animation` (anime/cartoon), `face` (face-focused enhancement), `film` (legacy film restoration). |
| `denoise` | boolean | No | `true` | Apply AI denoising during upscale. Reduces compression artifacts and noise. |
| `sharpen` | number | No | `0.5` | Post-upscale sharpening (0.0-1.0). Higher = sharper but may introduce ringing. |
| `output_format` | string | No | `mp4` | Output format: `mp4`, `mov`. |

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/videos/processed/upscale_y1z2a3b4.mp4",
  "usd_charged": 4,
  "billing": {
    "method": "wallet",
    "usd_charged": 4,
    "usd_charged": 0,
    "pln_charged": 0
  },
  "input_resolution": "960x540",
  "output_resolution": "3840x2160",
  "scale_factor": 4,
  "model_used": "general",
  "duration_seconds": 30.0,
  "file_size_bytes": 125829120,
  "processing_time_ms": 145000
}
```

### Code Examples

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Upscale old 480p footage to 1080p (2x)
result = client.video.upscale(
    video_url="https://example.com/old-video-480p.mp4",
    scale=2,
    model="film",
    denoise=True,
)

print(f"Upscaled: {result.output_url}")
print(f"Resolution: {result.input_resolution} -> {result.output_resolution}")

# Upscale anime to 4K (4x)
result = client.video.upscale(
    video_url="https://example.com/anime-720p.mp4",
    scale=4,
    model="animation",
    sharpen=0.3,
)
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Upscale old footage to 1080p
const result = await client.video.upscale({
  videoUrl: "https://example.com/old-video-480p.mp4",
  scale: 2,
  model: "film",
  denoise: true,
});

console.log(`Upscaled: ${result.outputUrl}`);
console.log(`Resolution: ${result.inputResolution} -> ${result.outputResolution}`);

// Upscale anime to 4K
const anime = await client.video.upscale({
  videoUrl: "https://example.com/anime-720p.mp4",
  scale: 4,
  model: "animation",
  sharpen: 0.3,
});
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
	// Upscale old 480p footage to 1080p (2x)
	payload := map[string]interface{}{
		"video_url": "https://example.com/old-video-480p.mp4",
		"scale":     2,
		"model":     "film",
		"denoise":   true,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/upscale", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	fmt.Printf("Upscaled: %s\n", result["output_url"])
	fmt.Printf("Resolution: %s -> %s\n", result["input_resolution"], result["output_resolution"])
	fmt.Printf("Scale: %.0fx\n", result["scale_factor"])
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/video/upscale" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/old-video-480p.mp4",
    "scale": 2,
    "model": "film",
    "denoise": true
  }'
```

:::

---

## AI Director

```
POST /v1/video/ai-director
```

AI analyzes your video content and automatically creates a polished edit. The AI Director can trim dead air, cut to the beat of music, apply color grading, add transitions, and structure the video with a narrative flow. Ideal for turning raw footage into finished content.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | — | URL of the source video. Max 2GB. |
| `video_urls` | array | No | `[]` | Additional video clips for AI to work with. Up to 10 URLs. The AI selects and orders the best segments. |
| `style` | string | No | `auto` | Editing style: `auto` (AI decides), `cinematic` (slow, dramatic), `fast_paced` (quick cuts), `documentary` (clean, informative), `social` (vertical, engaging, TikTok/Reels), `music_video` (cut to beat). |
| `music_url` | string | No | `null` | Background music URL. If provided, AI syncs cuts to beat. |
| `target_duration` | number | No | `null` | Target output duration in seconds. AI trims to fit. If null, AI decides optimal length. |
| `instructions` | string | No | `null` | Natural language instructions for the AI director (e.g. "Focus on the product shots, remove talking head segments, add cinematic color grade"). Max 500 characters. |
| `include_subtitles` | boolean | No | `false` | Auto-generate and embed subtitles in the final edit. |
| `output_format` | string | No | `mp4` | Output format: `mp4`, `mov`. |
| `aspect_ratio` | string | No | `original` | Output aspect ratio: `original`, `16:9`, `9:16` (vertical), `1:1` (square), `4:5` (Instagram). |

### Response

```json
{
  "output_url": "https://s1.fotohub.app/storage/v1/object/public/videos/processed/director_c5d6e7f8.mp4",
  "usd_charged": 5,
  "billing": {
    "method": "wallet",
    "usd_charged": 5,
    "usd_charged": 0,
    "pln_charged": 0
  },
  "edit_summary": "Created a 45-second cinematic edit from 3 clips. Applied teal-orange color grade, added crossfade transitions at beat drops, trimmed dead air segments.",
  "scenes_used": 8,
  "clips_analyzed": 3,
  "output_duration_seconds": 45.0,
  "input_total_duration_seconds": 180.0,
  "effects_applied": ["color_grade:teal_orange", "transitions:crossfade", "trim", "audio_normalize"],
  "processing_time_ms": 52000
}
```

### Code Examples

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Simple: let AI edit a long video into a short
result = client.video.ai_director(
    video_url="https://example.com/raw-footage-10min.mp4",
    style="social",
    target_duration=60,
    aspect_ratio="9:16",
    include_subtitles=True,
)

print(f"AI edit: {result.output_url}")
print(f"Summary: {result.edit_summary}")

# Advanced: multi-clip with music and instructions
result = client.video.ai_director(
    video_url="https://example.com/main-interview.mp4",
    video_urls=[
        "https://example.com/broll-1.mp4",
        "https://example.com/broll-2.mp4",
    ],
    music_url="https://example.com/background-track.mp3",
    style="documentary",
    target_duration=120,
    instructions="Keep the interview as the main thread. Cut to B-roll during pauses. Add lower-third text for speaker names.",
)
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Let AI create a social media clip
const result = await client.video.aiDirector({
  videoUrl: "https://example.com/raw-footage-10min.mp4",
  style: "social",
  targetDuration: 60,
  aspectRatio: "9:16",
  includeSubtitles: true,
});

console.log(`AI edit: ${result.outputUrl}`);
console.log(`Summary: ${result.editSummary}`);

// Multi-clip documentary edit
const doc = await client.video.aiDirector({
  videoUrl: "https://example.com/main-interview.mp4",
  videoUrls: [
    "https://example.com/broll-1.mp4",
    "https://example.com/broll-2.mp4",
  ],
  musicUrl: "https://example.com/background-track.mp3",
  style: "documentary",
  targetDuration: 120,
  instructions: "Keep the interview as the main thread. Cut to B-roll during pauses.",
});
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
	// Let AI create a social media clip
	payload := map[string]interface{}{
		"video_url":         "https://example.com/raw-footage-10min.mp4",
		"style":             "social",
		"target_duration":   60,
		"aspect_ratio":      "9:16",
		"include_subtitles": true,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/ai-director", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	fmt.Printf("AI edit: %s\n", result["output_url"])
	fmt.Printf("Summary: %s\n", result["edit_summary"])
	fmt.Printf("Scenes used: %.0f\n", result["scenes_used"])
	fmt.Printf("Duration: %.1fs (from %.1fs input)\n",
		result["output_duration_seconds"], result["input_total_duration_seconds"])
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/video/ai-director" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/raw-footage-10min.mp4",
    "style": "social",
    "target_duration": 60,
    "aspect_ratio": "9:16",
    "include_subtitles": true
  }'
```

:::

---

## Pricing

All video editing operations run on FOTOhub FFmpeg GPU nodes and are billed flat per operation in USD:

| Operation | Price Key | USD Cost | Description |
|-----------|-----------|---------:|-------------|
| Transcode | `video_transcode` | $0.053591 | Format/codec conversion, resolution change |
| Merge | `video_merge` | $0.107181 | Concatenate multiple video clips |
| Speed | `video_speed` | $0.107181 | Speed adjustment (0.25x–4.0x) |
| Stabilize | `video_stabilize` | $0.160772 | Video stabilization and jitter reduction |
| Subtitles | `video_subtitles` | $0.160772 | Subtitle burn-in with styling |
| Effects | `video_effects` | $0.107181 | Visual filters, color adjustments |
| Watermark | `video_watermark` | $0.107181 | Logo/watermark overlay |
| AI Upscale | `video_upscale` | $0.214362 | AI super-resolution (up to 4K) |
| AI Director | `video_ai_director` | $0.267953 | Automated pacing, scene cuts, layout |

**Billing notes:**
- Billed directly from your prepaid USD wallet at 1:1 pass-through cost.
- Video duration does not change the operation cost — flat rate per request.

## Rate Limits

Rate limits depend on your subscription tier:

### Per-Tier Limits

| Endpoint | Free | Creator (29 PLN/mo) | Pro (79 PLN/mo) | Business (199 PLN/mo) | Enterprise |
|----------|------|---------------------|-----------------|----------------------|------------|
| `transcode` | 5/min | 15/min | 40/min | 120/min | Custom |
| `merge` | 3/min | 10/min | 30/min | 100/min | Custom |
| `speed` | 5/min | 15/min | 40/min | 120/min | Custom |
| `stabilize` | 3/min | 10/min | 30/min | 80/min | Custom |
| `subtitles` | 3/min | 10/min | 30/min | 80/min | Custom |
| `effects` | 5/min | 15/min | 40/min | 120/min | Custom |
| `watermark` | 5/min | 15/min | 40/min | 120/min | Custom |
| `upscale` | 2/min | 5/min | 15/min | 40/min | Custom |
| `ai-director` | 2/min | 5/min | 15/min | 40/min | Custom |

### Monthly Credits Included

| Tier | Monthly Credits | Transcodes | AI Upscales | AI Director |
|------|----------------|------------|-------------|-------------|
| Free | 50 | 50 | 12 | 10 |
| Creator | 500 | 500 | 125 | 100 |
| Pro | 2000 | 2000 | 500 | 400 |
| Business | 8000 | 8000 | 2000 | 1600 |
| Enterprise | Custom | Custom | Custom | Custom |

### Burst Limits

All tiers have a burst limit of 3x the per-minute rate for up to 10 seconds. Example: Pro tier can burst to 120 req/min on `transcode` for 10s before throttling to 40/min.

### Rate Limit Headers

Every response includes:

```
X-RateLimit-Limit: 40
X-RateLimit-Remaining: 38
X-RateLimit-Reset: 1719936000
```

Exceeding the limit returns HTTP 429 with a `Retry-After` header (seconds until reset).

---

## Supported Formats

**Input:**
- MP4 (.mp4) — H.264, H.265
- MOV (.mov) — ProRes, H.264
- WebM (.webm) — VP8, VP9
- MKV (.mkv) — H.264, H.265, VP9
- AVI (.avi) — legacy support
- Maximum file size: 2GB
- Maximum duration: 60 minutes (Free), 180 minutes (paid tiers)
- Maximum resolution: 4K (3840x2160) input, 8K output for upscale

**Output:**
- MP4 — universal compatibility (default)
- MOV — professional workflows (ProRes-compatible)
- WebM — web-optimized, smaller files

---

## Error Responses

### 400 — Invalid Input

```json
{
  "detail": "Invalid parameter: speed must be between 0.1 and 8.0"
}
```

### 402 — Insufficient Funds

```json
{
  "detail": "Insufficient credits. Required: 4, available: 2. Top up at fotohub.app/billing"
}
```

### 413 — Video Too Large

```json
{
  "detail": "Video file too large (max 2GB)"
}
```

### 422 — Unsupported Format

```json
{
  "detail": "Unsupported input format: .flv. Supported: mp4, mov, webm, mkv, avi"
}
```

### 502 — Processing Failed

```json
{
  "detail": "Video processing failed: codec error during transcode"
}
```

### 503 — Service Unavailable

```json
{
  "detail": "Video processing service temporarily unavailable"
}
```

### 504 — Timeout

```json
{
  "detail": "Video processing timed out (max 10 minutes)"
}
```

---

## SDK Reference

### Python SDK

```bash
pip install fotohub
```

All video editing methods are under `client.video.*`:

| Method | Endpoint |
|--------|----------|
| `client.video.transcode()` | POST /v1/video/transcode |
| `client.video.merge()` | POST /v1/video/merge |
| `client.video.speed()` | POST /v1/video/speed |
| `client.video.stabilize()` | POST /v1/video/stabilize |
| `client.video.subtitles()` | POST /v1/video/subtitles |
| `client.video.effects()` | POST /v1/video/effects |
| `client.video.watermark()` | POST /v1/video/watermark |
| `client.video.upscale()` | POST /v1/video/upscale |
| `client.video.ai_director()` | POST /v1/video/ai-director |

### TypeScript SDK

```bash
npm install fotohub
```

| Method | Endpoint |
|--------|----------|
| `client.video.transcode()` | POST /v1/video/transcode |
| `client.video.merge()` | POST /v1/video/merge |
| `client.video.speed()` | POST /v1/video/speed |
| `client.video.stabilize()` | POST /v1/video/stabilize |
| `client.video.subtitles()` | POST /v1/video/subtitles |
| `client.video.effects()` | POST /v1/video/effects |
| `client.video.watermark()` | POST /v1/video/watermark |
| `client.video.upscale()` | POST /v1/video/upscale |
| `client.video.aiDirector()` | POST /v1/video/ai-director |

---

## Combined Workflow Examples

### Full Post-Production Pipeline

Process raw footage through multiple operations in sequence to produce a polished final video.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

source = "https://example.com/raw-footage.mov"

# Step 1: Stabilize shaky footage
stabilized = client.video.stabilize(
    video_url=source,
    strength="medium",
    smoothness=0.8,
)
print(f"Stabilized: {stabilized.output_url}")

# Step 2: Apply cinematic color grade and effects
styled = client.video.effects(
    video_url=stabilized.output_url,
    effects=[
        {"type": "color_grade", "preset": "teal_orange"},
        {"type": "vignette", "intensity": 0.3},
        {"type": "film_grain", "intensity": 0.15, "size": "fine"},
    ],
)
print(f"Styled: {styled.output_url}")

# Step 3: Add subtitles
subtitled = client.video.subtitles(
    video_url=styled.output_url,
    style="bold",
    font_size=24,
    position="bottom",
)
print(f"Subtitled: {subtitled.output_url}")

# Step 4: Add branding watermark
final = client.video.watermark(
    video_url=subtitled.output_url,
    watermark_type="image",
    image_url="https://example.com/logo.png",
    position="top_right",
    opacity=0.5,
    scale=0.08,
)
print(f"Final: {final.output_url}")
# Total credits: 3 + 2 + 3 + 2 = 10
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const source = "https://example.com/raw-footage.mov";

// Step 1: Stabilize
const stabilized = await client.video.stabilize({
  videoUrl: source,
  strength: "medium",
  smoothness: 0.8,
});

// Step 2: Color grade + effects
const styled = await client.video.effects({
  videoUrl: stabilized.outputUrl,
  effects: [
    { type: "color_grade", preset: "teal_orange" },
    { type: "vignette", intensity: 0.3 },
    { type: "film_grain", intensity: 0.15, size: "fine" },
  ],
});

// Step 3: Subtitles
const subtitled = await client.video.subtitles({
  videoUrl: styled.outputUrl,
  style: "bold",
  fontSize: 24,
  position: "bottom",
});

// Step 4: Watermark
const final = await client.video.watermark({
  videoUrl: subtitled.outputUrl,
  watermarkType: "image",
  imageUrl: "https://example.com/logo.png",
  position: "top_right",
  opacity: 0.5,
  scale: 0.08,
});

console.log(`Final: ${final.outputUrl}`);
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

func postVideo(endpoint string, payload map[string]interface{}) map[string]interface{} {
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app"+endpoint, bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")
	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	return result
}

func main() {
	source := "https://example.com/raw-footage.mov"

	// Step 1: Stabilize
	stabilized := postVideo("/v1/video/stabilize", map[string]interface{}{
		"video_url":  source,
		"strength":   "medium",
		"smoothness": 0.8,
	})

	// Step 2: Effects
	styled := postVideo("/v1/video/effects", map[string]interface{}{
		"video_url": stabilized["output_url"],
		"effects": []map[string]interface{}{
			{"type": "color_grade", "preset": "teal_orange"},
			{"type": "vignette", "intensity": 0.3},
			{"type": "film_grain", "intensity": 0.15, "size": "fine"},
		},
	})

	// Step 3: Subtitles
	subtitled := postVideo("/v1/video/subtitles", map[string]interface{}{
		"video_url": styled["output_url"],
		"style":     "bold",
		"font_size": 24,
		"position":  "bottom",
	})

	// Step 4: Watermark
	final := postVideo("/v1/video/watermark", map[string]interface{}{
		"video_url":      subtitled["output_url"],
		"watermark_type": "image",
		"image_url":      "https://example.com/logo.png",
		"position":       "top_right",
		"opacity":        0.5,
		"scale":          0.08,
	})

	fmt.Printf("Final: %s\n", final["output_url"])
}
```

```bash [cURL]
# Step 1: Stabilize
STAB=$(curl -s -X POST "https://apis.fotohub.app/v1/video/stabilize" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"video_url": "https://example.com/raw-footage.mov", "strength": "medium"}')
STAB_URL=$(echo $STAB | jq -r '.output_url')

# Step 2: Effects
STYLED=$(curl -s -X POST "https://apis.fotohub.app/v1/video/effects" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"video_url\": \"$STAB_URL\", \"effects\": [{\"type\": \"color_grade\", \"preset\": \"teal_orange\"}]}")
STYLED_URL=$(echo $STYLED | jq -r '.output_url')

# Step 3: Subtitles
SUBBED=$(curl -s -X POST "https://apis.fotohub.app/v1/video/subtitles" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"video_url\": \"$STYLED_URL\", \"style\": \"bold\"}")
SUBBED_URL=$(echo $SUBBED | jq -r '.output_url')

# Step 4: Watermark
FINAL=$(curl -s -X POST "https://apis.fotohub.app/v1/video/watermark" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"video_url\": \"$SUBBED_URL\", \"watermark_type\": \"image\", \"image_url\": \"https://example.com/logo.png\", \"position\": \"top_right\"}")
echo $FINAL | jq '.output_url'
```

:::

---

### Batch Transcode for Multi-Platform Delivery

Generate multiple output versions optimized for different platforms.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

source = "https://example.com/master-4k.mov"

# Platform-specific presets
platforms = [
    {"name": "YouTube 4K", "resolution": "4k", "codec": "h265", "bitrate": "35M"},
    {"name": "YouTube 1080p", "resolution": "1080p", "codec": "h264", "bitrate": "12M"},
    {"name": "Twitter/X", "resolution": "720p", "codec": "h264", "bitrate": "5M"},
    {"name": "Web (VP9)", "resolution": "1080p", "codec": "vp9", "format": "webm"},
]

results = []
for platform in platforms:
    result = client.video.transcode(
        video_url=source,
        format=platform.get("format", "mp4"),
        codec=platform["codec"],
        resolution=platform["resolution"],
        bitrate=platform.get("bitrate", "auto"),
    )
    results.append({"name": platform["name"], "url": result.output_url, "size": result.file_size_bytes})
    print(f"{platform['name']}: {result.output_url} ({result.file_size_bytes / 1024 / 1024:.1f} MB)")

print(f"\nTotal credits used: {len(platforms)} (1 per transcode)")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const source = "https://example.com/master-4k.mov";

const platforms = [
  { name: "YouTube 4K", resolution: "4k", codec: "h265", bitrate: "35M" },
  { name: "YouTube 1080p", resolution: "1080p", codec: "h264", bitrate: "12M" },
  { name: "Twitter/X", resolution: "720p", codec: "h264", bitrate: "5M" },
  { name: "Web (VP9)", resolution: "1080p", codec: "vp9", format: "webm" },
];

const results = await Promise.all(
  platforms.map(p =>
    client.video.transcode({
      videoUrl: source,
      format: p.format ?? "mp4",
      codec: p.codec,
      resolution: p.resolution,
      bitrate: p.bitrate ?? "auto",
    })
  )
);

results.forEach((r, i) => {
  console.log(`${platforms[i].name}: ${r.outputUrl} (${(r.fileSizeBytes / 1024 / 1024).toFixed(1)} MB)`);
});
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
	source := "https://example.com/master-4k.mov"

	platforms := []map[string]string{
		{"name": "YouTube 4K", "resolution": "4k", "codec": "h265", "bitrate": "35M", "format": "mp4"},
		{"name": "YouTube 1080p", "resolution": "1080p", "codec": "h264", "bitrate": "12M", "format": "mp4"},
		{"name": "Twitter/X", "resolution": "720p", "codec": "h264", "bitrate": "5M", "format": "mp4"},
		{"name": "Web (VP9)", "resolution": "1080p", "codec": "vp9", "bitrate": "auto", "format": "webm"},
	}

	for _, p := range platforms {
		payload := map[string]interface{}{
			"video_url":  source,
			"format":     p["format"],
			"codec":      p["codec"],
			"resolution": p["resolution"],
			"bitrate":    p["bitrate"],
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/transcode", bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
		req.Header.Set("Content-Type", "application/json")

		resp, _ := http.DefaultClient.Do(req)
		respBody, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		var result map[string]interface{}
		json.Unmarshal(respBody, &result)
		fmt.Printf("%s: %s (%.1f MB)\n", p["name"], result["output_url"],
			result["file_size_bytes"].(float64)/1024/1024)
	}
}
```

```bash [cURL]
SOURCE="https://example.com/master-4k.mov"

# YouTube 4K
curl -s -X POST "https://apis.fotohub.app/v1/video/transcode" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"video_url\": \"$SOURCE\", \"codec\": \"h265\", \"resolution\": \"4k\", \"bitrate\": \"35M\"}" | jq '{url: .output_url, size_mb: (.file_size_bytes / 1048576)}'

# YouTube 1080p
curl -s -X POST "https://apis.fotohub.app/v1/video/transcode" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"video_url\": \"$SOURCE\", \"codec\": \"h264\", \"resolution\": \"1080p\", \"bitrate\": \"12M\"}" | jq '{url: .output_url, size_mb: (.file_size_bytes / 1048576)}'

# Web VP9
curl -s -X POST "https://apis.fotohub.app/v1/video/transcode" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"video_url\": \"$SOURCE\", \"format\": \"webm\", \"codec\": \"vp9\", \"resolution\": \"1080p\"}" | jq '{url: .output_url, size_mb: (.file_size_bytes / 1048576)}'
```

:::

---

### Highlight Reel with AI Director + Upscale

Let AI select the best moments from raw footage, then upscale the result.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# AI selects best moments and creates highlight reel
highlights = client.video.ai_director(
    video_url="https://example.com/event-footage-2hr.mp4",
    style="fast_paced",
    target_duration=90,
    music_url="https://example.com/upbeat-track.mp3",
    instructions="Pick the most energetic and visually striking moments. Cut to the beat.",
)
print(f"AI highlight: {highlights.output_url}")
print(f"Summary: {highlights.edit_summary}")

# Upscale the 720p highlight reel to 4K
upscaled = client.video.upscale(
    video_url=highlights.output_url,
    scale=4,
    model="general",
    denoise=True,
    sharpen=0.4,
)
print(f"4K version: {upscaled.output_url}")
print(f"Resolution: {upscaled.input_resolution} -> {upscaled.output_resolution}")
# Total credits: 5 (director) + 4 (upscale) = 9
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// AI highlight reel
const highlights = await client.video.aiDirector({
  videoUrl: "https://example.com/event-footage-2hr.mp4",
  style: "fast_paced",
  targetDuration: 90,
  musicUrl: "https://example.com/upbeat-track.mp3",
  instructions: "Pick the most energetic and visually striking moments. Cut to the beat.",
});

console.log(`AI highlight: ${highlights.outputUrl}`);

// Upscale to 4K
const upscaled = await client.video.upscale({
  videoUrl: highlights.outputUrl,
  scale: 4,
  model: "general",
  denoise: true,
  sharpen: 0.4,
});

console.log(`4K version: ${upscaled.outputUrl}`);
console.log(`Resolution: ${upscaled.inputResolution} -> ${upscaled.outputResolution}`);
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

func post(endpoint string, payload map[string]interface{}) map[string]interface{} {
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app"+endpoint, bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")
	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(respBody, &result)
	return result
}

func main() {
	// AI highlight reel
	highlights := post("/v1/video/ai-director", map[string]interface{}{
		"video_url":       "https://example.com/event-footage-2hr.mp4",
		"style":           "fast_paced",
		"target_duration": 90,
		"music_url":       "https://example.com/upbeat-track.mp3",
		"instructions":    "Pick the most energetic moments. Cut to the beat.",
	})
	fmt.Printf("AI highlight: %s\n", highlights["output_url"])

	// Upscale to 4K
	upscaled := post("/v1/video/upscale", map[string]interface{}{
		"video_url": highlights["output_url"],
		"scale":     4,
		"model":     "general",
		"denoise":   true,
		"sharpen":   0.4,
	})
	fmt.Printf("4K version: %s\n", upscaled["output_url"])
	fmt.Printf("Resolution: %s -> %s\n", upscaled["input_resolution"], upscaled["output_resolution"])
}
```

```bash [cURL]
# Step 1: AI Director highlight reel
HIGHLIGHTS=$(curl -s -X POST "https://apis.fotohub.app/v1/video/ai-director" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/event-footage-2hr.mp4",
    "style": "fast_paced",
    "target_duration": 90,
    "music_url": "https://example.com/upbeat-track.mp3",
    "instructions": "Pick the most energetic moments. Cut to the beat."
  }')
HIGHLIGHT_URL=$(echo $HIGHLIGHTS | jq -r '.output_url')
echo "AI highlight: $HIGHLIGHT_URL"

# Step 2: Upscale to 4K
curl -s -X POST "https://apis.fotohub.app/v1/video/upscale" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"video_url\": \"$HIGHLIGHT_URL\", \"scale\": 4, \"model\": \"general\", \"denoise\": true}" \
  | jq '{url: .output_url, resolution: .output_resolution}'
```

:::

---

## Performance Tips

### Optimize Processing Speed

- **Prefer H.264 over H.265 for intermediate files** — H.264 encodes faster. Use H.265 only for final delivery where file size matters.
- **Use `auto` bitrate** when you do not have specific distribution requirements. The encoder selects optimal quality.
- **Process at native resolution** until the final step. Avoid unnecessary upscale/downscale in intermediate operations.
- **Use webhooks** instead of polling for long-running operations like AI Director or upscale to avoid holding open connections.

### Reduce API Costs

- **Combine operations** — Use AI Director instead of separate stabilize + effects + speed + trim calls when you want AI-driven editing.
- **Skip redundant transcodes** — If your source is already MP4/H.264 and you only need effects, skip the transcode step.
- **Use effects array** — Apply multiple visual effects in a single `/effects` call (2 credits total) instead of separate calls per effect.
- **Batch merge** — Concatenate all clips in one `/merge` call (2 credits) instead of merging pairs incrementally.

### File Size Optimization

| Target | Recommended Settings |
|--------|---------------------|
| Web streaming | H.264, 1080p, 5-8M bitrate, MP4 |
| Social media | H.264, 720p-1080p, 5M bitrate, MP4 |
| Archive | H.265, original resolution, 15-20M, MKV |
| Mobile delivery | H.264, 720p, 3M bitrate, MP4 |
| High-quality display | H.265, 4K, 20-35M, MOV |

### Common Workflow Patterns

| Workflow | Operations | Credits | Time Estimate |
|----------|-----------|---------|---------------|
| Quick social clip | Speed + Effects + Subtitles | 7 | ~30s |
| Professional edit | Stabilize + Effects + Subtitles + Watermark | 10 | ~60s |
| Full AI pipeline | AI Director + Upscale | 9 | ~3-5min |
| Multi-platform delivery | 4x Transcode | 4 | ~30s |
| Film restoration | Upscale + Stabilize + Effects | 9 | ~5-8min |
| Event highlight reel | Merge + Speed + Effects + Subtitles | 9 | ~45s |

---

## Use Cases

### Content Creators

- Turn 10-minute vlogs into 60-second social clips with AI Director
- Add animated captions for TikTok/Reels engagement
- Apply consistent brand color grading across all content
- Generate platform-specific versions (9:16, 16:9, 1:1) in one batch

### Film & Video Production

- Stabilize handheld footage without expensive hardware
- Apply film grain and color grading for cinematic look
- Upscale archival footage for modern 4K displays
- Merge multi-camera edits with smooth transitions

### E-Commerce & Marketing

- Add product watermarks for preview videos
- Generate translated subtitles for international markets
- Speed up product demos for attention-grabbing ads
- Create highlight reels from event recordings

### Education & Corporate

- Auto-generate subtitles for accessibility compliance
- Merge lecture segments with transitions
- Stabilize presentation recordings from webcams
- Add logo watermarks to training videos

---

## Enterprise

For higher limits, SLA guarantees, dedicated processing capacity, and priority queues:
- Email: sales@fotohub.app
- Custom rate limits up to 1000 req/min
- Guaranteed processing times (P95 SLA)
- Dedicated GPU instances for upscale and AI Director
- Volume discounts starting at 10,000 operations/month
- On-premise deployment available
