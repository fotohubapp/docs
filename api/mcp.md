# MCP Server API

FOTOhub exposes a fully-compliant MCP (Model Context Protocol) server that lets AI assistants and agents call creative AI tools directly. This page documents the server endpoint, authentication, protocol details, and available capabilities.

---

## Endpoint

```
POST https://apis.fotohub.app/mcp/
```

The MCP server uses **Streamable HTTP** transport (JSON-RPC 2.0 over HTTP POST, with optional Server-Sent Events for streaming responses).

### Health Check

```
GET https://apis.fotohub.app/mcp/health
```

Returns `200 OK` with `{"status": "ok"}` when the server is operational.

---

## Authentication

All MCP requests require a Bearer token in the `Authorization` header:

```
Authorization: Bearer fh_live_YOUR_API_KEY
```

Get your API key at [fotohub.app/settings/api](https://fotohub.app/settings/api).

::: warning
MCP connections inherit the permissions of the API key. Use scoped keys for production integrations.
:::

---

## Protocol Specification

| Property | Value |
|----------|-------|
| Protocol version | `2025-03-26` |
| Transport | Streamable HTTP (JSON-RPC 2.0) |
| Content-Type | `application/json` |
| Streaming | Optional SSE (`text/event-stream`) |
| Session management | Stateless (no session tokens required) |

### JSON-RPC Format

All requests follow the JSON-RPC 2.0 format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "generate_image",
    "arguments": {
      "prompt": "A mountain landscape at sunrise",
      "model": "seedream-5-0-260128"
    }
  }
}
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"images\": [\"https://s1.fotohub.app/storage/v1/object/public/...\"], \"billing\": {\"credits_used\": 5}}"
      }
    ]
  }
}
```

---

## Capabilities

The FOTOhub MCP server advertises the following capabilities:

```json
{
  "capabilities": {
    "tools": { "listChanged": false },
    "resources": { "listChanged": false },
    "prompts": { "listChanged": false }
  }
}
```

---

## Tools (30)

### Image Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `generate_image` | Generate image from text prompt | `prompt`, `model`, `aspect_ratio`, `style`, `negative_prompt` |
| `edit_image` | Edit an image (inpaint, outpaint, background swap) | `image_url`, `prompt`, `mask_url`, `operation` |
| `upscale_image` | AI super-resolution (2x or 4x) | `image_url`, `scale` |
| `remove_background` | Remove background from an image | `image_url`, `format` |
| `enhance_prompt` | AI-enhance a prompt for better generation results | `prompt`, `model`, `style` |
| `analyze_image` | Analyze image (tags, colors, NSFW, OCR) | `image_url`, `features` |
| `style_transfer` | Apply artistic style to an image | `image_url`, `style`, `strength` |
| `inpaint_image` | Remove or replace objects in an image | `image_url`, `mask_url`, `prompt` |

### Video Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `generate_video` | Generate video from text (async) | `prompt`, `model`, `duration`, `aspect_ratio` |
| `image_to_video` | Animate a still image into video | `image_url`, `prompt`, `duration` |
| `extend_video` | Extend an existing video | `video_url`, `prompt`, `seconds` |
| `generate_story` | Create multi-scene film with voiceover | `scenes`, `voice`, `music` |
| `generate_shorts` | Auto-cut long video into social shorts | `video_url`, `count`, `style` |
| `get_job_status` | Check status of async jobs | `job_id` |
| `add_subtitles` | Add subtitles to a video | `video_url`, `language`, `style` |

### Audio Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `text_to_speech` | Convert text to speech | `text`, `voice`, `language`, `speech_model` |
| `generate_music` | Generate music from description (async) | `prompt`, `duration`, `genre` |
| `generate_sfx` | Generate sound effects | `prompt`, `duration` |
| `transcribe_audio` | Speech-to-text transcription | `audio_url`, `language` |
| `voice_clone` | Clone a voice from audio sample | `audio_url`, `name` |
| `separate_stems` | Separate audio into tracks | `audio_url`, `stems` |

### Chat Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `chat_completion` | LLM chat (Claude, GPT, Gemini) | `messages`, `model`, `temperature` |
| `translate_text` | Translate text between languages | `text`, `source_lang`, `target_lang` |
| `gabriel_route` | Smart intent classifier for prompt routing | `prompt` |

### Utility Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `check_balance` | Check your credit balance | (none) |
| `list_models` | List available AI models with pricing | `category` |
| `list_generations` | View generation history | `limit`, `offset` |
| `search_photos` | Semantic photo search in your library | `query`, `limit` |

### Training Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `create_training_job` | Start a LoRA or voice training job | `type`, `dataset_url`, `config` |
| `get_training_status` | Check training job progress | `job_id` |

---

## Complete Tool Reference

Detailed parameter specifications for every MCP tool, organized by domain.

### Image Tools (8)

#### `generate_image`

Generate an AI image from a text description.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | `string` | Yes | — | Text description of the image to generate |
| `model` | `string` | No | `seedream-5-0-260128` | Model ID. Options: `seedream-5-0-260128`, `flux-2-pro`, `imagen-4-standard`, `grok-imagine-image-pro`, `dall-e-3-standard`, `kling-v3-omni`, `minimax-image-01` |
| `width` | `integer` | No | `1024` | Output width in pixels |
| `height` | `integer` | No | `1024` | Output height in pixels |
| `negative_prompt` | `string` | No | `""` | What to avoid in the image |
| `num_images` | `integer` | No | `1` | Number of images to generate (max 4) |
| `aspect_ratio` | `string` | No | `""` | Aspect ratio override (e.g. `16:9`, `1:1`, `9:16`) |

**Returns:** Text listing generated image URLs and credits used.

::: code-group
```python [Python]
import httpx

resp = httpx.post(
    "https://apis.fotohub.app/mcp/",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
    json={
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "generate_image",
            "arguments": {
                "prompt": "A futuristic cityscape at sunset, neon lights",
                "model": "seedream-5-0-260128",
                "width": 1024,
                "height": 1024,
                "num_images": 2
            }
        }
    }
)
print(resp.json()["result"]["content"][0]["text"])
```
```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/mcp/", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "generate_image",
      arguments: {
        prompt: "A futuristic cityscape at sunset, neon lights",
        model: "seedream-5-0-260128",
        width: 1024,
        height: 1024,
        num_images: 2
      }
    }
  })
});
const data = await resp.json();
console.log(data.result.content[0].text);
```
```go [Go]
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "io"
)

func main() {
    body, _ := json.Marshal(map[string]any{
        "jsonrpc": "2.0",
        "id":      1,
        "method":  "tools/call",
        "params": map[string]any{
            "name": "generate_image",
            "arguments": map[string]any{
                "prompt":     "A futuristic cityscape at sunset, neon lights",
                "model":      "seedream-5-0-260128",
                "width":      1024,
                "height":     1024,
                "num_images": 2,
            },
        },
    })

    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/mcp/", bytes.NewReader(body))
    req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
    req.Header.Set("Content-Type", "application/json")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    result, _ := io.ReadAll(resp.Body)
    fmt.Println(string(result))
}
```
```bash [cURL]
curl -X POST https://apis.fotohub.app/mcp/ \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "generate_image",
      "arguments": {
        "prompt": "A futuristic cityscape at sunset, neon lights",
        "model": "seedream-5-0-260128",
        "width": 1024,
        "height": 1024,
        "num_images": 2
      }
    }
  }'
```
:::

---

#### `edit_image`

Edit an existing image using AI. Supports multiple modes.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | `string` | Yes | — | URL of the source image |
| `prompt` | `string` | Yes | — | Description of the desired edit |
| `mode` | `string` | No | `edit` | Operation mode: `edit`, `inpaint`, `outpaint`, `style`, `background` |
| `model` | `string` | No | `seededit-3-0-i2i-250628` | Edit model to use |
| `mask_url` | `string` | No | `""` | Mask image URL (for inpaint/outpaint modes) |

**Returns:** Edited image URL and credits used.

---

#### `upscale_image`

Upscale an image 2x or 4x using AI super-resolution.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | `string` | Yes | — | URL of the image to upscale |
| `scale` | `integer` | No | `2` | Scale factor: `2` or `4` |

**Returns:** URL of the upscaled image.

---

#### `remove_background`

Remove the background from an image. Returns a transparent PNG.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | `string` | Yes | — | URL of the image to process |

**Returns:** URL of the image with background removed (PNG with transparency).

---

#### `enhance_prompt`

Enhance and improve an image generation prompt using AI. Returns a more detailed, higher-quality prompt suitable for image generation.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | `string` | Yes | — | The original prompt to enhance |
| `style` | `string` | No | `""` | Style hint (e.g. `photorealistic`, `anime`, `oil painting`) |

**Returns:** Enhanced prompt text.

---

#### `analyze_image`

Analyze an image to detect objects, colors, faces, text (OCR), and NSFW content.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | `string` | Yes | — | URL of the image to analyze |
| `features` | `string` | No | `labels,colors,faces` | Comma-separated features: `labels`, `colors`, `faces`, `ocr`, `nsfw`, `caption` |

**Returns:** JSON object with detected features.

---

#### `style_transfer`

Apply an artistic style to an image based on a text description.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | `string` | Yes | — | URL of the source image |
| `style_prompt` | `string` | Yes | — | Description of the style to apply (e.g. "watercolor painting", "cyberpunk neon") |
| `strength` | `float` | No | `0.7` | Style strength: `0.0`-`1.0` (higher = more stylized) |

**Returns:** URL of the style-transferred image.

---

#### `inpaint_image`

Replace a masked area in an image with AI-generated content.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | `string` | Yes | — | URL of the source image |
| `mask_url` | `string` | Yes | — | Mask URL (white = replace, black = keep) |
| `prompt` | `string` | Yes | — | Description of what to generate in the masked area |

**Returns:** URL of the inpainted image.

---

### Video Tools (7)

#### `generate_video`

Generate a video from text (or animate an image with `image_url`). This is an **async** operation — returns a `job_id`. Use `get_job_status` to poll.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | `string` | Yes | — | Text description of the video |
| `model` | `string` | No | `veo-3.1-generate-001` | See `GET /v1/models?category=video` for the full list. Examples: `veo-3.1-generate-001`, `hailuo-o2`, `kling-v3`, `sora-2`, `seedance-2-0-pro`, `wan2.2-t2v-plus`, `gemini-omni-flash`, `grok-imagine-video-1.5` |
| `duration` | `integer` | No | `5` | Duration in seconds: `5` or `10` (model-dependent) |
| `aspect_ratio` | `string` | No | `16:9` | Aspect ratio: `16:9`, `9:16`, `1:1` |
| `image_url` | `string` | No | `""` | Source image for image-to-video generation |

**Returns:** Job ID, status, model, and credits charged.

::: code-group
```python [Python]
import httpx

resp = httpx.post(
    "https://apis.fotohub.app/mcp/",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
    json={
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "generate_video",
            "arguments": {
                "prompt": "A drone shot flying over snow-capped mountains at sunrise",
                "model": "veo-3.1-generate-001",
                "duration": 5,
                "aspect_ratio": "16:9"
            }
        }
    }
)
result = resp.json()["result"]["content"][0]["text"]
# Parse job_id from result, then poll with get_job_status
print(result)
```
```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/mcp/", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "generate_video",
      arguments: {
        prompt: "A drone shot flying over snow-capped mountains at sunrise",
        model: "veo-3.1-generate-001",
        duration: 5,
        aspect_ratio: "16:9"
      }
    }
  })
});
const data = await resp.json();
// Parse job_id from result, then poll with get_job_status
console.log(data.result.content[0].text);
```
```go [Go]
body, _ := json.Marshal(map[string]any{
    "jsonrpc": "2.0",
    "id":      1,
    "method":  "tools/call",
    "params": map[string]any{
        "name": "generate_video",
        "arguments": map[string]any{
            "prompt":       "A drone shot flying over snow-capped mountains at sunrise",
            "model":        "veo-3.1-generate-001",
            "duration":     5,
            "aspect_ratio": "16:9",
        },
    },
})

req, _ := http.NewRequest("POST", "https://apis.fotohub.app/mcp/", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
result, _ := io.ReadAll(resp.Body)
fmt.Println(string(result))
```
```bash [cURL]
curl -X POST https://apis.fotohub.app/mcp/ \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "generate_video",
      "arguments": {
        "prompt": "A drone shot flying over snow-capped mountains at sunrise",
        "model": "veo-3.1-generate-001",
        "duration": 5,
        "aspect_ratio": "16:9"
      }
    }
  }'
```
:::

---

#### `image_to_video`

Animate a still image into a video. **Async** — returns `job_id`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | `string` | Yes | — | URL of the source image to animate |
| `prompt` | `string` | No | `""` | Motion description (what should happen in the video) |
| `model` | `string` | No | `kling` | Best i2v models: `kling`, `seedance`, `hailuo` |
| `duration` | `integer` | No | `5` | Duration in seconds |

**Returns:** Job ID and status.

---

#### `extend_video`

Extend an existing video by generating additional frames. **Async** — returns `job_id`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | `string` | Yes | — | URL of the video to extend |
| `prompt` | `string` | No | `""` | Description of what should happen in the extension |
| `duration` | `integer` | No | `5` | Seconds to add |

**Returns:** Job ID and status.

---

#### `generate_story`

Generate a multi-scene AI film with voiceover — full creative pipeline. **Async**. Creates: concept analysis, characters, keyframes, video scenes, voiceover, and final edit. Costs approximately 30 credits. Takes 2-5 minutes to complete.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `concept` | `string` | Yes | — | Story concept / plot description |
| `style` | `string` | No | `cinematic` | Visual style (e.g. `cinematic`, `anime`, `documentary`) |
| `duration` | `integer` | No | `30` | Target duration: 15-60 seconds |
| `voice` | `string` | No | `auto` | Voiceover voice (or `auto` for AI selection) |

**Returns:** Job ID.

---

#### `generate_shorts`

Auto-cut a long video into short-form clips for TikTok/Reels/Shorts. **Async**. AI analyzes the video, finds the best moments, cuts, and adds captions.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | `string` | Yes | — | URL of the source video |
| `target_count` | `integer` | No | `3` | Number of short clips to produce |
| `style` | `string` | No | `dynamic` | Editing style for the shorts |
| `add_captions` | `boolean` | No | `true` | Whether to add AI-generated captions |

**Returns:** Job ID and target count.

---

#### `get_job_status`

Check the status of an async video/audio/training job. Returns status, progress percentage, and result URL when done.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `job_id` | `string` | Yes | — | The job ID returned by an async operation |

**Returns:** Status (`queued`/`processing`/`completed`/`failed`), progress %, and result URL on completion.

---

#### `add_subtitles`

Add AI-generated subtitles/captions to a video. **Async**.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | `string` | Yes | — | URL of the video |
| `language` | `string` | No | `auto` | Language: `auto` (detect), `en`, `pl`, `es`, `de`, `fr`, etc. |
| `style` | `string` | No | `modern` | Caption style: `modern`, `classic`, `bold`, `minimal` |

**Returns:** Job ID.

---

### Audio Tools (6)

#### `text_to_speech`

Convert text to speech using AI voice synthesis.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | `string` | Yes | — | Text to convert to speech |
| `voice` | `string` | No | `alloy` | Voice ID. For gpt-audio: `alloy`, `nova`, `shimmer`. Varies by model. |
| `model` | `string` | No | `gpt-audio` | TTS model: `gpt-audio`, `elevenlabs`, `google-tts` |
| `language` | `string` | No | `en` | Language code |
| `speed` | `float` | No | `1.0` | Speech speed multiplier |

**Returns:** Audio URL, duration, and voice used.

::: code-group
```python [Python]
import httpx

resp = httpx.post(
    "https://apis.fotohub.app/mcp/",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
    json={
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "text_to_speech",
            "arguments": {
                "text": "Welcome to FOTOhub, where creativity meets AI.",
                "voice": "nova",
                "model": "gpt-audio",
                "language": "en"
            }
        }
    }
)
print(resp.json()["result"]["content"][0]["text"])
```
```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/mcp/", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "text_to_speech",
      arguments: {
        text: "Welcome to FOTOhub, where creativity meets AI.",
        voice: "nova",
        model: "gpt-audio",
        language: "en"
      }
    }
  })
});
const data = await resp.json();
console.log(data.result.content[0].text);
```
```go [Go]
body, _ := json.Marshal(map[string]any{
    "jsonrpc": "2.0",
    "id":      1,
    "method":  "tools/call",
    "params": map[string]any{
        "name": "text_to_speech",
        "arguments": map[string]any{
            "text":     "Welcome to FOTOhub, where creativity meets AI.",
            "voice":    "nova",
            "model":    "gpt-audio",
            "language": "en",
        },
    },
})

req, _ := http.NewRequest("POST", "https://apis.fotohub.app/mcp/", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
result, _ := io.ReadAll(resp.Body)
fmt.Println(string(result))
```
```bash [cURL]
curl -X POST https://apis.fotohub.app/mcp/ \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "text_to_speech",
      "arguments": {
        "text": "Welcome to FOTOhub, where creativity meets AI.",
        "voice": "nova",
        "model": "gpt-audio",
        "language": "en"
      }
    }
  }'
```
:::

---

#### `generate_music`

Generate AI music from a text description. **Async** — returns `job_id`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | `string` | Yes | — | Description of the music (genre, mood, instruments) |
| `duration` | `integer` | No | `30` | Duration in seconds: 10-120 |
| `model` | `string` | No | `music-minimax` | Model: `music-minimax`, `music-elevenlabs` |
| `instrumental` | `boolean` | No | `false` | If `true`, generate without vocals |

**Returns:** Job ID (async) or audio URL (if model returns immediately).

---

#### `generate_sfx`

Generate a sound effect from a text description.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | `string` | Yes | — | Description of the sound (e.g. "thunder crack", "footsteps on gravel", "laser beam") |
| `duration` | `float` | No | `3.0` | Duration in seconds: 0.5-10 |

**Returns:** Audio URL.

---

#### `transcribe_audio`

Transcribe speech to text from an audio or video file. Returns the full transcription with timestamps.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `audio_url` | `string` | Yes | — | URL of the audio/video file |
| `language` | `string` | No | `auto` | Language: `auto` (detect), `en`, `pl`, `es`, `de`, `fr`, etc. |

**Returns:** Full transcription text, detected language, and duration.

---

#### `voice_clone`

Clone a voice from an audio sample (5-30 seconds of clear speech). **Async** — returns `job_id`. After training, the voice can be used in `text_to_speech`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `audio_url` | `string` | Yes | — | URL of the voice sample (5-30s of clear speech) |
| `name` | `string` | No | `custom_voice` | Name for the cloned voice |

**Returns:** Job ID and voice name.

---

#### `separate_stems`

Separate an audio track into individual stems using Demucs AI. **Async**.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `audio_url` | `string` | Yes | — | URL of the audio file |
| `stems` | `string` | No | `vocals,drums,bass,other` | Comma-separated stems to extract |

**Returns:** Job ID (async), or URLs for each separated stem.

---

### Chat Tools (3)

#### `chat_completion`

Get an AI chat completion from Claude, GPT, Gemini, or DeepSeek.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | `string` | Yes | — | The user message |
| `model` | `string` | No | `claude-haiku-4-5` | Model: `claude-haiku-4-5`, `claude-sonnet-4`, `gpt-4o`, `gpt-4o-mini`, `gemini-2.5-flash`, `gemini-2.5-pro`, `deepseek-r1`, `nova-pro` |
| `system_prompt` | `string` | No | `""` | System prompt for context |
| `max_tokens` | `integer` | No | `2048` | Maximum tokens to generate |
| `temperature` | `float` | No | `0.7` | Sampling temperature: 0.0-2.0 |

**Returns:** Generated text, token usage, and credits cost.

::: code-group
```python [Python]
import httpx

resp = httpx.post(
    "https://apis.fotohub.app/mcp/",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
    json={
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "chat_completion",
            "arguments": {
                "prompt": "Explain quantum computing in 3 sentences",
                "model": "claude-haiku-4-5",
                "temperature": 0.5
            }
        }
    }
)
print(resp.json()["result"]["content"][0]["text"])
```
```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/mcp/", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "chat_completion",
      arguments: {
        prompt: "Explain quantum computing in 3 sentences",
        model: "claude-haiku-4-5",
        temperature: 0.5
      }
    }
  })
});
const data = await resp.json();
console.log(data.result.content[0].text);
```
```go [Go]
body, _ := json.Marshal(map[string]any{
    "jsonrpc": "2.0",
    "id":      1,
    "method":  "tools/call",
    "params": map[string]any{
        "name": "chat_completion",
        "arguments": map[string]any{
            "prompt":      "Explain quantum computing in 3 sentences",
            "model":       "claude-haiku-4-5",
            "temperature": 0.5,
        },
    },
})

req, _ := http.NewRequest("POST", "https://apis.fotohub.app/mcp/", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
result, _ := io.ReadAll(resp.Body)
fmt.Println(string(result))
```
```bash [cURL]
curl -X POST https://apis.fotohub.app/mcp/ \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "chat_completion",
      "arguments": {
        "prompt": "Explain quantum computing in 3 sentences",
        "model": "claude-haiku-4-5",
        "temperature": 0.5
      }
    }
  }'
```
:::

---

#### `translate_text`

Translate text between languages using AI.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | `string` | Yes | — | Text to translate |
| `target_language` | `string` | No | `en` | Target language code: `en`, `pl`, `de`, `fr`, `es`, `it`, `pt`, `nl`, `ja`, `ko`, `zh`, `ru`, etc. |
| `source_language` | `string` | No | `auto` | Source language (`auto` = detect) |

**Returns:** Translated text with detected source language.

---

#### `gabriel_route`

Intelligent AI router — analyzes user intent and suggests the best action. Gabriel classifies the prompt and returns the recommended action and parameters.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | `string` | Yes | — | The user prompt to classify |

**Returns:** Suggested action, confidence score, and recommended parameters.

---

### Utility Tools (4)

#### `check_balance`

Check your current credit balance and wallet status.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| *(none)* | — | — | — | No parameters required |

**Returns:** Tier, remaining credits (4h window and period), wallet balance in PLN.

---

#### `list_models`

List available AI models with pricing.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | `string` | No | `""` | Filter by category: `image`, `video`, `audio`, `chat`, `3d` (empty = all) |

**Returns:** Table of model names, categories, and credit costs.

---

#### `list_generations`

List your recent AI generations (images, videos, music).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | `integer` | No | `10` | Number of results (max 50) |
| `category` | `string` | No | `""` | Filter by category |

**Returns:** List of generations with type, model, timestamp, and output URL.

---

#### `search_photos`

Semantic search through your photo library using AI embeddings. Finds images matching a natural language description.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | `string` | Yes | — | Natural language search query (e.g. "sunset over mountains") |
| `limit` | `integer` | No | `10` | Max results (max 50) |

**Returns:** Matching photos with similarity scores and URLs.

---

### Training Tools (2)

#### `create_training_job`

Start a model training job (LoRA fine-tuning or voice training). **Async**.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | `string` | Yes | — | Name for the training job |
| `model_type` | `string` | No | `lora` | Type: `lora` (image), `dreambooth`, `voice` |
| `base_model` | `string` | No | `flux-2-pro` | Base model to fine-tune |
| `training_images` | `string` | No | `""` | Comma-separated URLs of training images (10-30 recommended) |
| `steps` | `integer` | No | `1000` | Training steps |
| `trigger_word` | `string` | No | `""` | Keyword that activates your trained style/subject |

**Returns:** Job ID, name, type, base model, and steps.

::: code-group
```python [Python]
import httpx

resp = httpx.post(
    "https://apis.fotohub.app/mcp/",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
    json={
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "create_training_job",
            "arguments": {
                "name": "my-portrait-style",
                "model_type": "lora",
                "base_model": "flux-2-pro",
                "training_images": "https://example.com/img1.jpg,https://example.com/img2.jpg",
                "steps": 1500,
                "trigger_word": "mystyle"
            }
        }
    }
)
print(resp.json()["result"]["content"][0]["text"])
```
```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/mcp/", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "create_training_job",
      arguments: {
        name: "my-portrait-style",
        model_type: "lora",
        base_model: "flux-2-pro",
        training_images: "https://example.com/img1.jpg,https://example.com/img2.jpg",
        steps: 1500,
        trigger_word: "mystyle"
      }
    }
  })
});
const data = await resp.json();
console.log(data.result.content[0].text);
```
```go [Go]
body, _ := json.Marshal(map[string]any{
    "jsonrpc": "2.0",
    "id":      1,
    "method":  "tools/call",
    "params": map[string]any{
        "name": "create_training_job",
        "arguments": map[string]any{
            "name":            "my-portrait-style",
            "model_type":      "lora",
            "base_model":      "flux-2-pro",
            "training_images": "https://example.com/img1.jpg,https://example.com/img2.jpg",
            "steps":           1500,
            "trigger_word":    "mystyle",
        },
    },
})

req, _ := http.NewRequest("POST", "https://apis.fotohub.app/mcp/", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
result, _ := io.ReadAll(resp.Body)
fmt.Println(string(result))
```
```bash [cURL]
curl -X POST https://apis.fotohub.app/mcp/ \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_training_job",
      "arguments": {
        "name": "my-portrait-style",
        "model_type": "lora",
        "base_model": "flux-2-pro",
        "training_images": "https://example.com/img1.jpg,https://example.com/img2.jpg",
        "steps": 1500,
        "trigger_word": "mystyle"
      }
    }
  }'
```
:::

---

#### `get_training_status`

Check the status of a model training job.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `job_id` | `string` | Yes | — | The training job ID |

**Returns:** Status, progress %, estimated time remaining, and trained model ID when complete.

---

## Resources

MCP resources provide browsable context for AI assistants:

| URI Pattern | Description |
|-------------|-------------|
| `fotohub://models/image` | Available image generation models |
| `fotohub://models/video` | Available video generation models |
| `fotohub://models/audio` | Available audio/music models |
| `fotohub://pricing` | Current pricing table (all models) |
| `fotohub://balance` | Your current credit balance |

### Reading a Resource

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "fotohub://models/image"
  }
}
```

---

## Prompts

Pre-built prompt templates for common workflows:

| Prompt Name | Description | Arguments |
|-------------|-------------|-----------|
| `creative_brief` | Generate a creative brief for a project | `project_type`, `audience`, `tone` |
| `video_director` | Plan a multi-scene video production | `concept`, `duration`, `style` |
| `product_photo` | Generate product photography | `product`, `background`, `lighting` |

### Using a Prompt

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "prompts/get",
  "params": {
    "name": "creative_brief",
    "arguments": {
      "project_type": "social media campaign",
      "audience": "young professionals",
      "tone": "bold and playful"
    }
  }
}
```

---

## Async Operations

Video generation, music creation, and training jobs are asynchronous. Tool calls return a `job_id` immediately. Use the `get_job_status` tool to poll for completion:

```
1. generate_video(prompt="A sunset timelapse") → {job_id: "vid_abc123"}
2. get_job_status(job_id="vid_abc123") → {status: "processing", progress: 45}
3. get_job_status(job_id="vid_abc123") → {status: "completed", video_url: "..."}
```

### Job Status Values

| Status | Description |
|--------|-------------|
| `queued` | Job is waiting in the queue |
| `processing` | Job is actively being processed |
| `completed` | Job finished successfully (result URLs included) |
| `failed` | Job failed (error message included) |

---

## Error Handling

MCP errors follow JSON-RPC 2.0 error format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32001,
    "message": "Insufficient credits",
    "data": {
      "balance": 2,
      "required": 5,
      "top_up_url": "https://fotohub.app/console"
    }
  }
}
```

### Error Codes

| Code | Meaning |
|------|---------|
| `-32600` | Invalid request (malformed JSON-RPC) |
| `-32601` | Method not found |
| `-32602` | Invalid params |
| `-32001` | Insufficient credits |
| `-32002` | Rate limited (retry after `Retry-After` seconds) |
| `-32003` | Authentication failed |
| `-32004` | Model unavailable |
| `-32005` | Content policy violation |

---

## Rate Limits

MCP requests share rate limits with the REST API:

| Plan | Requests/min | Concurrent jobs |
|------|-------------|-----------------|
| Free | 10 | 2 |
| Pro | 60 | 10 |
| Business | 300 | 50 |
| Enterprise | Custom | Custom |

When rate limited, the error response includes a `retry_after` field (seconds).

---

## Billing

Each tool call deducts credits from your account based on the model and operation used. Use the `check_balance` tool to monitor usage, or `list_models` to see current rates.

Credit costs are identical to REST API calls for the same operations.

---

## Client Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "fotohub": {
      "url": "https://apis.fotohub.app/mcp/",
      "headers": {
        "Authorization": "Bearer fh_live_your_api_key"
      }
    }
  }
}
```

After saving, restart Claude Desktop. FOTOhub tools will appear in the tool picker (hammer icon). You can then ask Claude to generate images, create videos, and more — it will call FOTOhub tools automatically.

---

### VS Code / Cursor / Windsurf

Create `.vscode/mcp.json` in your project root:

```json
{
  "servers": {
    "fotohub": {
      "type": "http",
      "url": "https://apis.fotohub.app/mcp/",
      "headers": {
        "Authorization": "Bearer fh_live_your_api_key"
      }
    }
  }
}
```

For **Cursor** and **Windsurf**, add to your IDE settings (`settings.json` or the MCP settings panel):

```json
{
  "mcpServers": {
    "fotohub": {
      "url": "https://apis.fotohub.app/mcp/",
      "headers": {
        "Authorization": "Bearer fh_live_your_api_key"
      }
    }
  }
}
```

::: tip
Both Cursor and Windsurf support MCP natively. After adding the server, FOTOhub tools are available to the AI assistant in chat and composer modes.
:::

---

## Chat-Live Client (External MCP Servers)

FOTOhub Chat-Live allows users to connect their own external MCP servers, giving the AI assistant access to third-party tools alongside built-in FOTOhub capabilities. The system uses a Claude `tool_use` loop with a maximum of 5 rounds per message.

### Architecture

```
User Message → Chat-Live → LLM (Claude/Gemini/GPT)
                              ↓ tool_use
                         MCP Manager → External Server
                              ↓ result
                         LLM continues (max 5 rounds)
                              ↓
                         Final Response → SSE to user
```

### CRUD Endpoints for External MCP Servers

All endpoints require Supabase JWT authentication.

#### Register a Server

```
POST https://apis.fotohub.app/chat/mcp/servers
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Human-readable server name |
| `url` | `string` | Yes | MCP server URL (HTTPS recommended) |
| `auth_token` | `string` | No | Bearer token for the external server (stored encrypted in Vault) |

::: code-group
```python [Python]
import httpx

resp = httpx.post(
    "https://apis.fotohub.app/chat/mcp/servers",
    headers={
        "Authorization": "Bearer <supabase_jwt>",
        "Content-Type": "application/json"
    },
    json={
        "name": "my-tools",
        "url": "https://my-mcp-server.example.com/mcp",
        "auth_token": "sk_my_server_token"
    }
)
server = resp.json()
# {"id": "uuid", "name": "my-tools", "tools": [...discovered tools...]}
```
```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/chat/mcp/servers", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <supabase_jwt>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "my-tools",
    url: "https://my-mcp-server.example.com/mcp",
    auth_token: "sk_my_server_token"
  })
});
const server = await resp.json();
// {id: "uuid", name: "my-tools", tools: [...discovered tools...]}
```
```go [Go]
body, _ := json.Marshal(map[string]any{
    "name":       "my-tools",
    "url":        "https://my-mcp-server.example.com/mcp",
    "auth_token": "sk_my_server_token",
})

req, _ := http.NewRequest("POST", "https://apis.fotohub.app/chat/mcp/servers", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer <supabase_jwt>")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
result, _ := io.ReadAll(resp.Body)
fmt.Println(string(result))
```
```bash [cURL]
curl -X POST https://apis.fotohub.app/chat/mcp/servers \
  -H "Authorization: Bearer <supabase_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-tools",
    "url": "https://my-mcp-server.example.com/mcp",
    "auth_token": "sk_my_server_token"
  }'
```
:::

On registration, Chat-Live immediately connects to the server, calls `tools/list`, and persists the discovered tools. The response includes all discovered tool schemas.

#### List Servers

```
GET https://apis.fotohub.app/chat/mcp/servers
```

Returns all active MCP servers for the authenticated user, including their discovered tools.

#### Delete a Server

```
DELETE https://apis.fotohub.app/chat/mcp/servers/:server_id
```

Removes the server and its stored credentials from Vault.

---

### Tool Use Loop (max 5 rounds)

When a user sends a chat message with `mcpEnabled: true`, Chat-Live:

1. **Collects tools** — fetches all discovered tools from the user's registered external MCP servers
2. **Formats for LLM** — converts MCP tool schemas to the format expected by the active model (Claude `tool_use`, Gemini `function_declarations`, or OpenAI `functions`)
3. **Sends to LLM** — includes tools in the model request alongside the user message
4. **Executes tool calls** — if the LLM responds with `tool_use`, Chat-Live connects to the appropriate external MCP server and calls the tool
5. **Returns result** — feeds the tool result back to the LLM for the next round
6. **Repeats** — up to 5 rounds maximum, then forces a text response

Tool names are namespaced as `server_name__tool_name` to prevent collisions across servers.

### SSE Events for Tool Progress

During streaming responses, Chat-Live emits SSE events that include tool execution status:

```
data: {"type": "tool_start", "tool": "my-tools__search", "arguments": {...}}

data: {"type": "tool_result", "tool": "my-tools__search", "content": "..."}

data: {"type": "delta", "content": "Based on the search results..."}

data: {"type": "done", "credits_used": 0.45, "model": "claude-haiku-4-5"}

data: [DONE]
```

| Event Type | Description |
|------------|-------------|
| `tool_start` | LLM requested a tool call (includes tool name and arguments) |
| `tool_result` | Tool execution completed (includes result content) |
| `tool_error` | Tool execution failed (includes error message) |
| `delta` | Text content chunk from the LLM |
| `reasoning` | Thinking/reasoning token (for thinking models) |
| `done` | Final message with billing and token usage |

### Security

- **SSRF protection** — URLs are validated: no localhost, no private IPs, no metadata endpoints
- **Vault storage** — auth tokens are encrypted in Supabase Vault (never stored in plaintext)
- **OAuth discovery** — supports RFC 9728 / RFC 8414 OAuth metadata discovery for servers that require OAuth2
- **Timeout** — tool calls timeout after 30 seconds; server discovery after 15 seconds

---

## Programmatic MCP Connection

### Python (`mcp` library)

Connect programmatically using the official Python MCP SDK:

```python
import asyncio
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client


async def main():
    # Connect to FOTOhub MCP server
    async with streamablehttp_client(
        url="https://apis.fotohub.app/mcp/",
        headers={"Authorization": "Bearer fh_live_your_api_key"}
    ) as (read, write, _):
        async with ClientSession(read, write) as session:
            # Initialize the session (protocol handshake)
            await session.initialize()

            # Discover available tools
            tools = await session.list_tools()
            print(f"Available: {len(tools.tools)} tools")
            for tool in tools.tools[:5]:
                print(f"  - {tool.name}: {tool.description[:60]}")

            # Generate an image
            result = await session.call_tool(
                "generate_image",
                arguments={
                    "prompt": "A futuristic cityscape with flying cars",
                    "model": "seedream-5-0-260128",
                    "num_images": 1,
                }
            )
            print(f"\nResult: {result.content[0].text}")

            # Check your balance
            balance = await session.call_tool("check_balance", arguments={})
            print(f"\nBalance: {balance.content[0].text}")

            # List available models
            models = await session.call_tool(
                "list_models",
                arguments={"category": "image"}
            )
            print(f"\nImage models:\n{models.content[0].text}")

            # Read a resource
            resource = await session.read_resource("fotohub://pricing")
            print(f"\nPricing: {resource.contents[0].text[:200]}")

            # Generate video (async job)
            video = await session.call_tool(
                "generate_video",
                arguments={
                    "prompt": "A timelapse of clouds rolling over a valley",
                    "model": "veo-3.1-generate-001",
                    "duration": 5,
                }
            )
            print(f"\nVideo job: {video.content[0].text}")


if __name__ == "__main__":
    asyncio.run(main())
```

Install the SDK:

```bash
pip install mcp httpx
```

#### Polling Async Jobs

```python
import asyncio
import re
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client


async def generate_and_wait():
    async with streamablehttp_client(
        url="https://apis.fotohub.app/mcp/",
        headers={"Authorization": "Bearer fh_live_your_api_key"}
    ) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # Start video generation
            result = await session.call_tool(
                "generate_video",
                arguments={
                    "prompt": "Ocean waves crashing on rocks, cinematic slow motion",
                    "model": "kling-v3",
                    "duration": 5,
                }
            )
            text = result.content[0].text
            # Extract job_id from response
            match = re.search(r"Job ID: (\S+)", text)
            if not match:
                print("Failed to get job_id")
                return
            job_id = match.group(1)
            print(f"Started job: {job_id}")

            # Poll until completion
            for _ in range(60):  # max 5 minutes
                status = await session.call_tool(
                    "get_job_status",
                    arguments={"job_id": job_id}
                )
                status_text = status.content[0].text
                print(f"  {status_text.splitlines()[1]}")  # Status line

                if "completed" in status_text.lower():
                    print(f"\nDone! {status_text}")
                    return
                if "failed" in status_text.lower():
                    print(f"\nFailed: {status_text}")
                    return

                await asyncio.sleep(5)


asyncio.run(generate_and_wait())
```

---

### TypeScript (`@modelcontextprotocol/sdk`)

Connect using the official TypeScript MCP SDK:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function main() {
  // Create transport with auth
  const transport = new StreamableHTTPClientTransport(
    new URL('https://apis.fotohub.app/mcp/'),
    { headers: { Authorization: 'Bearer fh_live_your_api_key' } }
  );

  // Create client and connect
  const client = new Client({ name: 'my-app', version: '1.0.0' });
  await client.connect(transport);

  // Discover tools
  const tools = await client.listTools();
  console.log(`Available: ${tools.tools.length} tools`);
  for (const tool of tools.tools.slice(0, 5)) {
    console.log(`  - ${tool.name}: ${tool.description?.slice(0, 60)}`);
  }

  // Generate an image
  const imageResult = await client.callTool({
    name: 'generate_image',
    arguments: {
      prompt: 'A mountain landscape at golden hour, dramatic lighting',
      model: 'seedream-5-0-260128',
      aspect_ratio: '16:9',
    },
  });
  console.log('\nImage:', JSON.parse(imageResult.content[0].text));

  // Text to speech
  const ttsResult = await client.callTool({
    name: 'text_to_speech',
    arguments: {
      text: 'Hello from FOTOhub MCP!',
      voice: 'alloy',
      model: 'gpt-audio',
    },
  });
  console.log('\nTTS:', ttsResult.content[0].text);

  // Read pricing resource
  const pricing = await client.readResource({ uri: 'fotohub://pricing' });
  console.log('\nPricing:', pricing.contents[0].text.slice(0, 200));

  // Check balance
  const balance = await client.callTool({
    name: 'check_balance',
    arguments: {},
  });
  console.log('\nBalance:', balance.content[0].text);

  // Cleanup
  await client.close();
}

main().catch(console.error);
```

Install the SDK:

```bash
npm install @modelcontextprotocol/sdk
```

#### Multi-Tool Workflow Example

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function createVideoFromPrompt(concept: string) {
  const transport = new StreamableHTTPClientTransport(
    new URL('https://apis.fotohub.app/mcp/'),
    { headers: { Authorization: 'Bearer fh_live_your_api_key' } }
  );

  const client = new Client({ name: 'video-pipeline', version: '1.0.0' });
  await client.connect(transport);

  // Step 1: Enhance the prompt
  const enhanced = await client.callTool({
    name: 'enhance_prompt',
    arguments: { prompt: concept, style: 'cinematic' },
  });
  const betterPrompt = enhanced.content[0].text.replace('Enhanced prompt:\n', '');
  console.log('Enhanced:', betterPrompt);

  // Step 2: Generate a keyframe image
  const image = await client.callTool({
    name: 'generate_image',
    arguments: { prompt: betterPrompt, model: 'seedream-5-0-260128' },
  });
  const imageUrl = image.content[0].text.match(/https:\/\/\S+/)?.[0];
  console.log('Keyframe:', imageUrl);

  // Step 3: Animate the image into video
  if (imageUrl) {
    const video = await client.callTool({
      name: 'image_to_video',
      arguments: {
        image_url: imageUrl,
        prompt: betterPrompt,
        model: 'kling',
        duration: 5,
      },
    });
    console.log('Video job:', video.content[0].text);
  }

  // Step 4: Poll for completion
  // (extract job_id and poll get_job_status as shown above)

  await client.close();
}

createVideoFromPrompt('A serene Japanese garden with cherry blossoms falling');
```

---

## See Also

- [MCP Integration Guide](/guides/mcp-integration) — step-by-step setup walkthrough
- [MCP Integration (Integrations)](/integrations/mcp) — quick-start client configurations
- [Authentication](/api/authentication) — API key management
- [Rate Limits](/api/rate-limits) — detailed rate limit documentation
- [Billing](/api/billing) — credit system and pricing
