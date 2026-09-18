# MCP Server API

FOTOhub exposes a fully-compliant MCP (Model Context Protocol) server that lets AI assistants and agents call creative AI tools directly. This page documents the server endpoint, authentication, protocol details, and available capabilities.

::: warning Three tools are not registered in production, two more are registered but inert
The registry defines 60 tools; production serves **57**. `generate_shorts`,
`create_training_job` and `get_training_status` are gated on services that are
not deployed (`SHORTS_ENGINE_URL` and `TRAINING_ENGINE_URL`), so they do not
appear in `tools/list` and cannot be called today. They are documented below
because the gate is configuration, not removal — but do not build against them.

Separately, `voice_clone` and `separate_stems` **are** registered and answer
`tools/call` successfully, but they call no backend — they always return a
fixed "not yet available via MCP" message. So 55 of the 57 listed tools
actually do something.

`GET https://apis.fotohub.app/mcp/health` returns the live count and is
authoritative over any number written on this page.
:::

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

There are two ways to authenticate, and they bill differently (see [Billing](#billing)).

### API Key

All MCP requests can use a Bearer token in the `Authorization` header:

```
Authorization: Bearer fh_live_YOUR_API_KEY
```

Get your API key at [fotohub.app/settings/api](https://fotohub.app/settings/api). There is no separate sandbox/test key prefix — `fh_live_*` is the only kind issued.

::: warning
MCP connections inherit the permissions of the API key. Use scoped keys for production integrations.
:::

### OAuth 2.1

The server also supports OAuth 2.1 with PKCE and dynamic client registration, used by clients such as ChatGPT and Claude's own "Sign in" connector flow — you do not need to pre-generate an API key for this path. Discovery documents:

```
GET https://apis.fotohub.app/.well-known/oauth-authorization-server
GET https://apis.fotohub.app/.well-known/oauth-protected-resource
```

| Field | Value |
|-------|-------|
| Issuer | `https://apis.fotohub.app/mcp` |
| Authorization endpoint | `https://apis.fotohub.app/mcp/oauth/authorize` |
| Token endpoint | `https://apis.fotohub.app/mcp/oauth/token` |
| Registration endpoint | `https://apis.fotohub.app/mcp/oauth/register` (dynamic client registration) |
| Grant types | `authorization_code`, `refresh_token` |
| PKCE | `S256` |
| Token auth methods | `client_secret_post`, `none` |
| Scopes | `mcp:read`, `mcp:write`, `mcp:image`, `mcp:video`, `mcp:audio`, `mcp:chat`, `mcp:training`, `mcp:billing` |

A key minted through this flow carries `metadata.billing_mode = "credits_first"` and spends the account's subscription credits before falling back to the prepaid USD wallet — unlike a raw `fh_live_*` key, which always spends the USD wallet only.

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

Tool results are **human-readable text**, not a JSON payload embedded in the text block — a heading, each asset URL on its own line, then a cost line:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Generated with seedream-5-0-260128:\nhttps://s1.fotohub.app/storage/v1/object/public/...\nCost: $0.0315 · wallet $6.51 left"
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

## Tools (57 active, 60 registered)

### Image Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `generate_image` | Generate image from text prompt | `prompt`, `model`, `width`, `height`, `negative_prompt`, `num_images`, `aspect_ratio` |
| `edit_image` | Edit an image (edit, inpaint, outpaint, style, background) | `image_url`, `prompt`, `mode`, `model`, `mask_url` |
| `upscale_image` | AI super-resolution (2x or 4x) | `image_url`, `scale` |
| `remove_background` | Remove background from an image | `image_url` |
| `enhance_prompt` | AI-enhance a prompt for better generation results | `prompt`, `style` |
| `analyze_image` | Analyze image (tags, colors, NSFW, OCR) | `image_url`, `features` |
| `style_transfer` | Apply artistic style to an image | `image_url`, `style_prompt`, `strength` |
| `inpaint_image` | Remove or replace objects in an image | `image_url`, `mask_url`, `prompt` |

### Editing Tools

Image/video post-processing — background follow-ups, restoration, and video finishing.

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `replace_background` | Remove a background and replace it with a color/gradient/image | `image_url`, `background`, `background_type`, `feather`, `output_format` |
| `blur_background` | Blur the background, keep the subject sharp (portrait mode) | `image_url`, `blur_radius`, `feather`, `output_format` |
| `add_shadow` | Add a realistic drop shadow to a cut-out subject | `image_url`, `shadow_type`, `shadow_opacity`, `shadow_offset_x`, `shadow_offset_y`, `shadow_blur`, `shadow_color`, `output_format` |
| `enhance_image` | One-pass AI auto-enhancement (exposure, contrast, sharpness, color) | `image_url`, `mode`, `strength`, `output_format` |
| `denoise_image` | Remove grain/noise from a photo | `image_url`, `strength`, `output_format` |
| `restore_faces` | Restore blurry/degraded faces (GFPGAN) | `image_url`, `upscale`, `output_format` |
| `depth_map` | Generate a monocular depth map from an image | `image_url`, `output_type`, `output_format` |
| `upscale_video` | Upscale a video's resolution | `video_url`, `scale` |
| `transcode_video` | Convert container/codec/resolution/quality | `video_url`, `output_format`, `codec`, `quality`, `resolution` |
| `add_watermark` | Burn a text watermark into a video | `video_url`, `text`, `position`, `opacity`, `font_size`, `color` |
| `change_video_speed` | Slow-motion or time-lapse retiming | `video_url`, `speed`, `interpolation` |

### Video Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `generate_video` | Generate video from text (async) | `prompt`, `model`, `duration`, `aspect_ratio` |
| `image_to_video` | Animate a still image into video | `image_url`, `prompt`, `duration` |
| `extend_video` | Extend an existing video | `video_url`, `prompt`, `seconds` |
| `generate_story` | Create multi-scene film with voiceover | `scenes`, `voice`, `music` |
| `generate_shorts` ⚠️ | Auto-cut long video into social shorts — **not registered in production** | `video_url`, `target_count`, `style`, `add_captions` |
| `get_job_status` | Check status of async jobs | `job_id` |
| `add_subtitles` | Add subtitles to a video | `video_url`, `language`, `style` |

### Audio Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `text_to_speech` | Convert text to speech | `text`, `voice`, `model`, `language`, `speed` |
| `generate_music` | Generate music from description (synchronous) | `prompt`, `duration`, `model`, `instrumental`, `genre` |
| `generate_sfx` | Generate sound effects | `prompt`, `duration` |
| `transcribe_audio` | Speech-to-text transcription | `audio_url`, `language` |
| `voice_clone` ⚠️ | **Registered but inert** — returns a fixed "not yet available via MCP" message, calls no backend | `audio_url`, `name` |
| `separate_stems` ⚠️ | **Registered but inert** — returns a fixed "not yet available via MCP" message, calls no backend | `audio_url`, `stems` |

### 3D Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `generate_3d_from_text` | Generate a 3D model from a text description | `prompt`, `quality`, `output_format` |
| `generate_3d_from_image` | Generate a 3D model from a single image | `image_base64`, `model`, `quality`, `output_format` |
| `list_3d_models` | List available 3D models with prices | (none) |
| `get_3d_result` | Fetch a finished 3D generation by job id | `job_id` |

### Studio Tools (UGC Ads)

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `create_ugc_project` | Create a new UGC ad project (free) | `title`, `brief` |
| `list_ugc_projects` | List the caller's UGC ad projects | (none) |
| `estimate_ugc_cost` | Price a UGC blueprint before rendering (free) | `document` |
| `set_ugc_blueprint` | Save the scene-script blueprint a render is made from (free) | `project_id`, `blueprint_json` |
| `render_ugc_video` | Start rendering a UGC ad video (async) | `project_id`, `variant_label`, `idempotency_key` |
| `get_ugc_job` | Check a UGC render's progress and running cost | `job_id` |

### Chat Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `chat_completion` | LLM chat completion (Claude- and Nova-class models only) | `prompt`, `model`, `system_prompt`, `max_tokens`, `temperature` |
| `translate_text` | Translate text between languages | `text`, `target_language`, `source_language` |
| `gabriel_route` | Smart intent classifier for prompt routing | `prompt` |

### Pricing Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_price` | Look up the exact USD price for one model | `model` |
| `estimate_cost` | Estimate the USD cost of a generation before calling it | `model`, `count`, `seconds`, `characters`, `minutes`, `resolution`, `quality`, `tokens_in`, `tokens_out`, `with_audio`, `video_input` |
| `compare_prices` | Compare USD prices across every model in a category | `category` |

### Storage Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `list_buckets` | List your FOTOhub-managed S3 storage buckets | (none) |
| `list_files` | List files/folders inside a storage bucket | `bucket`, `prefix`, `max_keys` |
| `save_to_storage` | Copy a (short-lived) generation link into your own bucket | `url`, `bucket`, `key` |
| `get_download_link` | Get a temporary signed download URL for a stored file | `bucket`, `key`, `expires_in` |

### Utility Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `check_balance` | Check your prepaid USD wallet balance and month-to-date spend | (none) |
| `list_models` | List available AI models with pricing (`image`\|`video`\|`audio`\|`text`) | `category` |
| `list_generations` | List your most recent generated **images** (max 12) | `limit` |
| `get_usage_summary` | Summarize the last 30 days of API call volume | (none) |
| `get_transactions` | List recent USD wallet transactions (ledger) | `limit` |
| `search_photos` | Semantic photo search in your library | `query`, `limit` |

### Training Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `create_training_job` ⚠️ | Start a LoRA or voice training job — **not registered in production** | `type`, `dataset_url`, `config` |
| `get_training_status` ⚠️ | Check training job progress — **not registered in production** | `job_id` |

---

## Complete Tool Reference

Detailed parameter specifications for every MCP tool, organized by domain.

### Image Tools (8)

#### `generate_image`

Generate an AI image from a text description.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | `string` | Yes | — | Text description of the image to generate |
| `model` | `string` | No | `seedream-5-0-260128` | Model ID. Options: `seedream-5-0-260128`, `flux-2-pro`, `imagen-4-standard`, `grok-imagine-image-quality`, `gpt-image-1`, `kling-v3-omni`, `minimax-image-01`. `dall-e-3` is retired — the route rejects it with a 400 pointing at `gpt-image-1`. |
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

### Editing Tools (11)

Image/video post-processing — the finishing work done right after a generation, or on a photo/clip the user already has. Every route here is billed in USD from the same prepaid wallet as generation.

#### `replace_background`

Remove an image's background and replace it with a new one (color, gradient, or another image).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | `string` | Yes | — | URL of the source image |
| `background` | `string` | Yes | — | Hex color (`#ffffff`), CSS gradient, or an image URL. AI-generated (free-text) backgrounds are NOT supported — passing free text fails with 501 before anything is charged. |
| `background_type` | `string` | No | `auto` | `color`, `gradient`, `image`, or `auto` (detected from `background`) |
| `feather` | `integer` | No | `2` | 0-20, edge softness where the subject meets the new background |
| `output_format` | `string` | No | `png` | `png`, `jpeg`, or `webp` |

**Returns:** The composited image plus the cut-out transparent PNG.

---

#### `blur_background`

Blur an image's background while keeping the subject sharp (bokeh / portrait mode).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | `string` | Yes | — | URL of the source image |
| `blur_radius` | `integer` | No | `15` | 1-50, Gaussian blur strength |
| `feather` | `integer` | No | `2` | 0-20, edge softness at the subject boundary |
| `output_format` | `string` | No | `jpeg` | `png`, `jpeg`, or `webp` |

**Returns:** The composited image.

---

#### `add_shadow`

Add a realistic drop shadow to a cut-out subject. Requires a transparent PNG as input — run `remove_background` first if needed.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | `string` | Yes | — | URL of the (transparent) source image |
| `shadow_type` | `string` | No | `natural` | `natural` (AI-detected lighting), `drop` (simple offset), or `contact` (flat, along the bottom edge) |
| `shadow_opacity` | `float` | No | `0.5` | 0-1 |
| `shadow_offset_x` | `integer` | No | `0` | Pixels, negative moves left |
| `shadow_offset_y` | `integer` | No | `10` | Pixels, negative moves up |
| `shadow_blur` | `integer` | No | `10` | 0-50 |
| `shadow_color` | `string` | No | `#000000` | Hex color |
| `output_format` | `string` | No | `png` | `png`/`webp` keep transparency; `jpeg` mattes onto white |

**Returns:** The image with shadow applied.

---

#### `enhance_image`

AI auto-enhancement — fixes exposure, contrast, sharpness and color in one pass. Good default for "make this photo look better" with no specific problem named.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | `string` | Yes | — | URL of the source image |
| `mode` | `string` | No | `auto` | Accepted for forward compatibility — the current deployment runs a single fixed enhancement pass regardless of value |
| `strength` | `float` | No | `1.0` | Accepted for forward compatibility, same caveat as `mode` |
| `output_format` | `string` | No | `jpeg` | `jpeg`, `png`, or `webp` |

**Returns:** The enhanced image.

---

#### `denoise_image`

Remove grain/noise from a photo (e.g. a low-light or high-ISO shot).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | `string` | Yes | — | URL of the source image |
| `strength` | `float` | No | `0.5` | 0.1 (light) to 1.0 (aggressive) — higher values also soften fine detail |
| `output_format` | `string` | No | `jpeg` | `jpeg`, `png`, or `webp` |

**Returns:** The denoised image.

---

#### `restore_faces`

Restore blurry, low-resolution, or degraded faces in a photo (GFPGAN). Faces are detected automatically across the whole image.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | `string` | Yes | — | URL of the source image |
| `upscale` | `integer` | No | `1` | `1` (no resize), `2`, or `4` — upscales the whole image while restoring faces |
| `output_format` | `string` | No | `png` | `jpeg`, `png`, or `webp` |

**Returns:** The restored image.

---

#### `depth_map`

Generate a monocular depth map from a single image (Depth Anything V2). Useful for 3D/parallax effects, relighting, or as a mask input for other edits.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | `string` | Yes | — | URL of the source image |
| `output_type` | `string` | No | `grayscale` | `grayscale` (near=dark/far=light) or `colored` (viridis colormap). Raw 16-bit metric depth is not supported. |
| `output_format` | `string` | No | `png` | `png` or `webp` |

**Returns:** The depth map as an image.

---

#### `upscale_video`

Upscale a video's resolution using AI super-resolution. Slow — large/long videos can take several minutes; the call blocks until the render finishes.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | `string` | Yes | — | URL of the source video |
| `scale` | `integer` | No | `2` | `2`, `3`, or `4` |

**Returns:** A link to the upscaled video (no inline preview — MCP image content blocks only carry pictures).

---

#### `transcode_video`

Convert a video to a different container, codec, resolution, or quality.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | `string` | Yes | — | URL of the source video |
| `output_format` | `string` | No | `mp4` | `mp4`, `webm`, `mov`, `gif`, or `prores` |
| `codec` | `string` | No | *(format default)* | `h264`, `h265`, `vp9`, or `prores` |
| `quality` | `string` | No | `high` | `draft`, `standard`, `high`, or `ultra` — FFmpeg presets; an unlisted value is rejected before anything is charged |
| `resolution` | `string` | No | *(source)* | `480p`, `720p`, `1080p`, `1440p`, or `4K` |

**Returns:** A link to the converted video.

---

#### `add_watermark`

Burn a text watermark into a video. Text only — image/logo watermarks are not supported by this endpoint.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | `string` | Yes | — | URL of the source video |
| `text` | `string` | No | `FOTOhub` | Watermark text |
| `position` | `string` | No | `bottom_right` | `top_left`, `top_right`, `bottom_left`, `bottom_right`, `center`, or `tiled` |
| `opacity` | `float` | No | `0.3` | 0.05-1.0 |
| `font_size` | `integer` | No | `24` | 10-120pt |
| `color` | `string` | No | `white` | `white`, `black`, `red`, `yellow`, or `gray` |

**Returns:** A link to the watermarked video.

---

#### `change_video_speed`

Change a video's playback speed — slow-motion or time-lapse.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | `string` | Yes | — | URL of the source video |
| `speed` | `float` | Yes | — | 0.1-10.0. Below 1.0 slows down (0.25 = 4x slow-motion), above 1.0 speeds up |
| `interpolation` | `string` | No | `blend` | `none` (fastest, choppiest), `blend` (balanced), or `mci` (motion-compensated, smoothest but slowest) |

**Returns:** A link to the retimed video.

---

### Video Tools (7)

#### `generate_video`

Generate a video from text (or animate an image with `image_url`). This is an **async** operation — returns a `job_id`. Use `get_job_status` to poll.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | `string` | Yes | — | Text description of the video |
| `model` | `string` | No | `veo-3.1-generate-001` | See `GET /v1/models?category=video` for the full list, or trigger the route's own 400 by passing an unknown id (it names every supported id). Examples: `veo-3.1-generate-001`, `veo-3.1-fast-generate-001`, `sora-2`, `kling-v2-1-master`, `hailuo-2.3`, `seedance-2-0-mini`, `wan2.2-t2v-plus` |
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
| `model` | `string` | No | `kling-v2-1-master` | Best i2v models: `kling-v2-1-master`, `seedance-2-0-mini`, `hailuo-2.3` |
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

#### `generate_shorts` {#generate-shorts}

::: danger Not registered in production
Gated on `SHORTS_ENGINE_URL`, which is unset. This tool is absent from `tools/list`.
:::

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
| `text` | `string` | Yes | — | Text to convert to speech. Max 3000 characters, or 1200 for the `ida-voice` models. |
| `voice` | `string` | No | *(model default)* | Leave empty for the model's default. `grok` takes names like `eve`. |
| `model` | `string` | No | `google` | `google` (fast), `ida-voice-pro` (natural), `ida-voice` (cloning), `grok` (26 multilingual voices). Anything else is rejected with 400. |
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
                "voice": "eve",
                "model": "grok",
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
        voice: "eve",
        model: "grok",
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
            "voice":    "eve",
            "model":    "grok",
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
        "voice": "eve",
        "model": "grok",
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
| `duration` | `integer` | No | `30` | Duration in seconds: 10-300 |
| `model` | `string` | No | `minimax` | `minimax` or `elevenlabs` |
| `instrumental` | `boolean` | No | `false` | If `true`, generate without vocals |
| `genre` | `string` | No | `""` | **Required** when `model=elevenlabs` |

**Returns:** The finished audio URL — this call is **synchronous**, not async (use `estimate_cost` beforehand to check the price).

---

#### `generate_sfx`

Generate a sound effect from a text description.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | `string` | Yes | — | Description of the sound (e.g. "thunder crack", "footsteps on gravel", "laser beam") |
| `duration` | `float` | No | `3.0` | Duration in seconds, clamped up to 30 |

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

#### `voice_clone` ⚠️ {#voice-clone}

::: danger Registered but inert
This tool is present in `tools/list` and returns HTTP 200, but it calls no backend. The old route it targeted (`POST /voice_clone/train` on the chatterbox proxy) never existed and always 404'd, so this call never worked. The real cloning routes have no billed public API endpoint fronting them yet. It always returns the fixed string *"Voice cloning is not yet available via MCP. Use the FOTOhub dashboard's Voice Cloning page instead."* — nothing is charged.
:::

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `audio_url` | `string` | Yes | — | URL of the voice sample (accepted but unused) |
| `name` | `string` | No | `custom_voice` | Name for the cloned voice (accepted but unused) |

**Returns:** A fixed "not yet available" message. No job is created.

---

#### `separate_stems` ⚠️ {#separate-stems}

::: danger Registered but inert
This tool is present in `tools/list` and returns HTTP 200, but it calls no backend. The underlying route (music-server `/stems`) is real but only sees an internal proxy principal, never a real `user_id`, so it has no billed public API endpoint fronting it. It always returns the fixed string *"Stem separation is not yet available via MCP. Use the FOTOhub dashboard's Audio Stems tool instead."* — nothing is charged.
:::

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `audio_url` | `string` | Yes | — | URL of the audio file (accepted but unused) |
| `stems` | `string` | No | `vocals,drums,bass,other` | Comma-separated stems to extract (accepted but unused) |

**Returns:** A fixed "not yet available" message. No job is created.

---

### 3D Tools (4)

3D generation is proxied through the `ai-generate-3d` edge function, billed in USD from the same prepaid wallet as image/video generation. Model ids use the public `fh-*` names.

#### `generate_3d_from_text`

Generate a 3D model from a text description. Best for simple, recognisable objects — a chair, a mug, a rocket. For anything detailed, generate an image first and use `generate_3d_from_image` instead — image-conditioned reconstruction is markedly better than text-to-3D at this size.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | `string` | Yes | — | Text description of the 3D object |
| `quality` | `string` | No | `standard` | `draft`, `standard`, or `high` |
| `output_format` | `string` | No | `glb` | `glb`, `obj`, `stl`, or `usdz` |

**Returns:** A download link plus the credits/USD charged.

---

#### `generate_3d_from_image`

Generate a 3D model from a single image. Pass the image as base64 **without** a `data:` prefix.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_base64` | `string` | Yes | — | Source image, base64-encoded, no `data:` prefix |
| `model` | `string` | No | `fh-lite-3d` | `fh-lite-3d` (fast, ~3s, untextured geometry) or `fh-pro-3d` (high detail + PBR textures, ~2-3min, requires a Professional plan) |
| `quality` | `string` | No | `standard` | `draft`, `standard`, or `high`. Maps to real engine settings (diffusion steps, mesh resolution) on `fh-pro-3d`; on `fh-lite-3d` it affects post-processing only. |
| `output_format` | `string` | No | `glb` | `glb`, `obj`, `stl`, or `usdz` |

**Returns:** A download link plus the credits/USD charged.

---

#### `list_3d_models`

List the available 3D models with prices and what each one is for. Call before generating if unsure which model fits — a model can be temporarily offline for maintenance.

*(No parameters.)*

**Returns:** Each model's id, description, USD price, and speed.

---

#### `get_3d_result`

Fetch a finished 3D generation by its job id, with a fresh download link. Links expire — re-fetch rather than reusing an old URL.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `job_id` | `string` | Yes | — | The job id from `generate_3d_from_text` / `generate_3d_from_image` |

**Returns:** Status and a fresh download link.

---

### Studio Tools — UGC Ads (6)

UGC (user-generated-content-style) ads are multi-scene product videos with an AI avatar speaking a script, proxied at `/v1/ugc/*` to ugc-engine. It is **not** a single generate-and-done call — it is a 4-stage pipeline: **project** (`create_ugc_project`) → **blueprint** (`set_ugc_blueprint`, the scene script — required before rendering) → **render** (`render_ugc_video`, starts an async job, gates on wallet balance) → **job** (`get_ugc_job`, poll for progress — the wallet is charged scene-by-scene as each one finishes, not upfront). `list_ugc_projects` and `estimate_ugc_cost` are read-only/pricing-only and fit anywhere in that order. UGC never touches subscription credits through this API — it settles from the same prepaid USD wallet as every other route.

#### `create_ugc_project`

Create a new UGC ad project. Free — nothing is generated yet. This is stage 1 of 4; the returned project id is needed for every later step.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `title` | `string` | No | `Untitled UGC` | A short name for the project |
| `brief` | `object` | No | `{}` | Optional free-form dict describing the product/campaign |

**Returns:** The new project's id, title, and status.

---

#### `list_ugc_projects`

List the caller's UGC ad projects, newest first.

*(No parameters.)*

**Returns:** Id, title, status, and creation time for each project.

---

#### `estimate_ugc_cost`

Price a UGC blueprint before rendering it. Charges nothing.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `document` | `object` | Yes | — | The full blueprint JSON (scenes, avatar, script lines, product shots, timing) |

**Returns:** Estimated video seconds / spoken lines and the price in USD. The price can be partial — token-metered voice providers cannot be quoted up front and are priced once a scene is actually delivered.

---

#### `set_ugc_blueprint`

Save the blueprint (shooting document) a UGC render is made from. This is the step between creating a project and rendering it — without it, `render_ugc_video` always fails with 409. Free.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `project_id` | `string` | Yes | — | From `create_ugc_project` |
| `blueprint_json` | `string` | Yes | — | The blueprint document as a JSON object string (actor, scenes, script, product shots) |

**Returns:** The saved version and, when the engine reports one, a price estimate.

---

#### `render_ugc_video`

Start rendering a UGC ad video from a project's saved blueprint. **Async.** Requires a blueprint to already be attached (409 otherwise). Refuses to start (402, nothing charged) if the wallet cannot cover the blueprint's estimated cost.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `project_id` | `string` | Yes | — | From `create_ugc_project` / `list_ugc_projects` |
| `variant_label` | `string` | No | — | Label if rendering multiple variants of the same project |
| `idempotency_key` | `string` | No | — | A repeated call with the same key returns the already-started render instead of starting a second one |

**Returns:** The job id and the quoted (not-yet-charged) price. Nothing is charged by this call itself — charges happen scene-by-scene as the render progresses.

---

#### `get_ugc_job`

Check a UGC render's progress and what it has cost so far.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `job_id` | `string` | Yes | — | The id returned by `render_ugc_video` |

**Returns:** Overall status, the running USD cost charged so far, and each scene's own status.

---

### Chat Tools (3)

#### `chat_completion`

Get an AI chat completion from a Claude- or Nova-class model. GPT, Gemini, and DeepSeek model ids are **not** accepted on this route — passing one is rejected with 400.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | `string` | Yes | — | The user message |
| `model` | `string` | No | `claude-haiku-4.5` | `claude-sonnet-4.6`, `claude-sonnet-4.5`, `claude-sonnet-4`, `claude-haiku-4.5`, `nova-pro`, `nova-lite`, `nova-micro`, `nova-premier`, `nova-2-lite` |
| `system_prompt` | `string` | No | `""` | System prompt for context |
| `max_tokens` | `integer` | No | `2048` | Maximum tokens to generate |
| `temperature` | `float` | No | `0.7` | Sampling temperature: 0.0-2.0 |

**Returns:** Generated text, token usage, and the USD cost charged to the prepaid wallet.

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
                "model": "claude-haiku-4.5",
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
        model: "claude-haiku-4.5",
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
            "model":       "claude-haiku-4.5",
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
        "model": "claude-haiku-4.5",
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

### Pricing Tools (3)

#### `get_price`

Look up the exact USD price FOTOhub charges for one AI model. Use before recommending a model, or whenever the user asks how much a model costs. Pass the same id you would give a `generate_*` tool.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | `string` | Yes | — | The model id |

**Returns:** Every priced "leg" of the model (most have one leg named `output`; video and TTS models can have several) with its unit (`per_piece`, `per_second`, `per_minute`, `per_1k_chars`, `per_1k_tokens`, `per_1m_tokens`, `per_request`, `per_gb_month`) and rate.

---

#### `estimate_cost`

Estimate the USD cost of a generation **before** calling a `generate_*` tool. Pass only the parameters that apply to the model's kind (see the tool's own description for the full dispatch logic — it varies by pricing shape: per-image, per-second-with-resolution, per-character, dual-token, or flat-rate).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | `string` | Yes | — | The model id |
| `count` | `integer` | No | `1` | Number of images / flat-rate units |
| `seconds` | `float` | No | `0.0` | Clip duration for per-second/resolution models |
| `characters` | `integer` | No | `0` | Text length for per-1K-character TTS models |
| `minutes` | `float` | No | `0.0` | For per-minute jobs (translation, dubbing, audio-stems) |
| `resolution` | `string` | No | `""` | Required for resolution-alternative legs (e.g. Seedance) |
| `quality` | `string` | No | `""` | `low`/`medium`/`high` for the gpt-image-* tier family |
| `tokens_in` / `tokens_out` | `integer` | No | `0` | For dual-token speech models (these two add together) |
| `with_audio` / `video_input` | `boolean` | No | `false` | Selects the `audio`/`video_in` leg where it exists — replaces the resolution rate, never adds to it |

**Returns:** The computed USD amount with the arithmetic shown, or an explanation of what parameter is missing.

---

#### `compare_prices`

Compare FOTOhub's USD prices across every model in one category.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | `string` | Yes | — | `image`, `video`, `audio`, `chat`, `3d`, or `storage` |

**Returns:** Every model in the category, cheapest to priciest, with its rate. Category classification is a best-effort heuristic — confirm any specific model with `get_price`.

---

### Storage Tools (4)

FOTOhub-managed S3 storage, proxied to s3-engine. The real problem this module solves: a generation result link is a short-lived signed URL (expires roughly an hour after the call) — `save_to_storage` copies the bytes into a bucket the user actually owns before that window closes.

#### `list_buckets`

List your FOTOhub-managed S3 storage buckets. Call before `list_files`, `save_to_storage`, or `get_download_link` to find a bucket's name/id.

*(No parameters.)*

**Returns:** Each bucket's display name, region, and current size. Empty means no buckets yet — buckets are bought at fotohub.app/console/storage, not created by this tool.

---

#### `list_files`

List files (and folders) inside one of your storage buckets.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bucket` | `string` | Yes | — | Bucket display name (as `list_buckets` shows it) or UUID |
| `prefix` | `string` | No | `""` | Narrows the listing to one folder, e.g. `renders/2026-09/` |
| `max_keys` | `integer` | No | `100` | Max files to return (1-1000) |

**Returns:** Up to `max_keys` files with size and last-modified time, plus any subfolders visible at this level. A listing with only subfolders and no files is not empty — descend into one of them.

---

#### `save_to_storage`

Download a generated file and save it into your own storage bucket. Call this right after `generate_image`/`generate_video`/`generate_*` returns a URL — those links expire roughly an hour later.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | `string` | Yes | — | The exact link a generation tool just returned |
| `bucket` | `string` | Yes | — | Bucket display name or UUID |
| `key` | `string` | Yes | — | Path to save it under inside the bucket, e.g. `renders/sunset.png` |

**Returns:** Confirmation with the byte size saved, or an error if the source link already expired. Does not overwrite-protect — an existing object at `key` is replaced.

---

#### `get_download_link`

Get a temporary signed download URL for a file already in your storage bucket.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bucket` | `string` | Yes | — | Bucket display name or UUID |
| `key` | `string` | Yes | — | The object's key (check with `list_files` first) |
| `expires_in` | `integer` | No | `3600` | Seconds until the link stops working (max `604800` = 7 days) — not a permanent URL |

**Returns:** The signed download URL.

---

### Utility Tools (6)

#### `check_balance`

Check your prepaid USD wallet balance and this month's spend. The API is prepaid in USD and has no credits — this tool does **not** return a subscription tier or a 4h/period credit count (an earlier version did; that shape no longer exists on the route).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| *(none)* | — | — | — | No parameters required |

**Returns:** Available wallet balance (USD), pending holds, month-to-date spend (and any monthly spend limit), and your API plan name.

---

#### `list_models`

List available AI models with pricing.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | `string` | No | `""` | `image`, `video`, `audio`, `text` (empty = all). `chat` is accepted as an alias for `text`. **3D models are not in this catalog** — passing `3d` returns an explanation instead of results; call `list_3d_models` instead. |

**Returns:** Model id, category, and the USD rate the wallet is actually billed at (falls back to the catalog's display price, marked `(list)`, when no billing rate is published — call `get_price` before quoting one of those, since the display price is often higher than the real charge).

---

#### `list_generations`

List the **images** you have generated on FOTOhub most recently. The platform publishes no listing route for video or audio, so a generated clip cannot be found this way.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | `integer` | No | `10` | Number of results, capped at `12` |

**Returns:** Newest first — the prompt each one was made from, when, and a fresh (about one hour) download link.

---

#### `get_usage_summary`

Summarize your last 30 days of API usage — call **volume**, not spend. For the wallet ledger use `get_transactions`; for the current balance use `check_balance`.

*(No parameters.)*

**Returns:** Total requests and tokens over 30 days, cost by currency, and the top 5 endpoints and top 5 models by call count.

---

#### `get_transactions`

List your recent wallet transactions — the USD wallet ledger (top-ups, per-call charges, refunds), not usage volume or the current balance.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | `integer` | No | `20` | Number of results, capped at `200` |

**Returns:** Timestamp, type, amount, and description for each transaction, newest first. Rows recorded before the platform's PLN→USD migration may show PLN instead of USD.

---

#### `search_photos`

Semantic search through your photo library using AI embeddings. Finds images matching a natural language description.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | `string` | Yes | — | Natural language search query (e.g. "sunset over mountains") |
| `limit` | `integer` | No | `10` | Max results (max 50) |

**Returns:** Matching photos with similarity scores and URLs.

---

### Training Tools (2 — not registered in production)

::: danger Not registered in production
Both training tools are gated on `TRAINING_ENGINE_URL`, which is unset because
training-engine is not deployed. They are absent from `tools/list`.
:::

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
| `fotohub://models/3d` | Available 3D generation models |
| `fotohub://pricing` | Current pricing table (all models) |
| `fotohub://balance` | Your current prepaid USD wallet balance |
| `fotohub://guide/getting-started` | Onboarding guide for a new MCP client |
| `fotohub://limits` | Current per-tool limits (character caps, durations, etc.) |

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
| `creative_brief` | Structured image-generation brief | `subject`, `style`, `mood`, `format` |
| `video_director` | Plan a multi-scene video production | `concept`, `duration`, `style` |
| `product_photo` | Generate product photography | `product`, `background`, `angle`, `lighting` |
| `ecommerce_product_shots` | A set of product photos across several background variants | `product_name`, `key_features`, `background_variants`, `aspect_ratio` |
| `social_media_pack` | Copy + matching visuals sized for several platforms from one idea | `idea`, `platforms`, `brand_voice`, `num_variants` |
| `ugc_ad_pipeline` | Plan and produce a UGC-style ad within a fixed USD budget | `product_name`, `target_audience`, `budget_usd`, `duration_seconds`, `platform` |
| `avatar_profile_photo` | Generate an avatar / profile photo from a description | `description`, `style`, `background`, `aspect_ratio` |
| `voiceover_script` | Turn a script into narration, handling TTS length limits | `script_text`, `tone`, `language`, `voice_model` |
| `budget_constrained_generation` | Plan any generation task inside a fixed USD budget | `goal`, `budget_usd`, `category` |

### Using a Prompt

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "prompts/get",
  "params": {
    "name": "creative_brief",
    "arguments": {
      "subject": "a mountain lake at dawn",
      "style": "photorealistic",
      "mood": "serene",
      "format": "landscape"
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

Authentication and transport-level failures are plain HTTP errors, not JSON-RPC error objects — a missing/invalid bearer token returns HTTP 401 with a JSON body (`{"error": "..."}"`) and a `WWW-Authenticate` header pointing at OAuth discovery, before the request ever reaches the MCP layer:

```json
{"error": "Invalid or expired API key"}
```

Once inside the MCP layer, a tool that fails (insufficient wallet balance, a model rejecting the request, a downstream 5xx) returns a normal `tools/call` **result** whose content is an error message — MCP tool errors are reported as text content, not as JSON-RPC-level failures, so check the returned text rather than assuming a thrown exception. Genuine JSON-RPC-level errors are limited to the protocol layer itself:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Unknown skill: <uri>"
  }
}
```

### Error Codes (JSON-RPC / protocol layer)

| Code | Meaning |
|------|---------|
| `-32600` | Invalid request (malformed JSON-RPC) |
| `-32601` | Method not found |
| `-32602` | Invalid params, or an unknown `skill://` URI |
| `-32002` | Resource not found (`resources/read` on an unknown `fotohub://` URI) |

Domain-level failures (insufficient balance, an unavailable model, a content-policy rejection) do **not** have dedicated JSON-RPC codes — they come back as the tool's own text result (e.g. a 402 from the wallet gate is surfaced as an explanatory string, not a JSON-RPC error).

---

## Rate Limits

MCP requests are authenticated the same way as the REST API and share the same account-level limits. See [API Rate Limits](/api/rate-limits) for current numbers — there is no MCP-specific rate limit table.

---

## Billing

Billing depends on how the calling credential was obtained, not on which tool was called:

- **A raw `fh_live_*` API key** (the kind you create at [fotohub.app/settings/api](https://fotohub.app/settings/api)) spends only the account's prepaid **USD wallet**. There is no credits concept on this path.
- **A key minted through the OAuth 2.1 flow** (see [Authentication](#authentication) below) carries `metadata.billing_mode = "credits_first"` and spends the account's **subscription credits first**, falling back to the prepaid USD wallet once those are exhausted — a single call can even be split across both.

Use `check_balance` to check the current wallet balance, `get_transactions` for the wallet ledger, `get_usage_summary` for call volume, and `get_price` / `estimate_cost` / `compare_prices` to see rates before generating.

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
User Message → Chat-Live → Claude (tool_use loop)
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
POST https://apis.fotohub.app/v1/chat/mcp/servers
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
    "https://apis.fotohub.app/v1/chat/mcp/servers",
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
const resp = await fetch("https://apis.fotohub.app/v1/chat/mcp/servers", {
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

req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/chat/mcp/servers", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer <supabase_jwt>")
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
result, _ := io.ReadAll(resp.Body)
fmt.Println(string(result))
```
```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/chat/mcp/servers \
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
GET https://apis.fotohub.app/v1/chat/mcp/servers
```

Returns all active MCP servers for the authenticated user, including their discovered tools.

#### Delete a Server

```
DELETE https://apis.fotohub.app/v1/chat/mcp/servers/:server_id
```

Removes the server and its stored credentials from Vault.

---

### Tool Use Loop (max 5 rounds)

When a user sends a chat message with `mcpEnabled: true`, Chat-Live:

1. **Collects tools** — fetches all discovered tools from the user's registered external MCP servers
2. **Formats for the model** — converts MCP tool schemas to Claude's `tool_use` format (Chat-Live's tool-calling loop runs on a Claude model regardless of which model answers elsewhere in the app)
3. **Sends to LLM** — includes tools in the model request alongside the user message
4. **Executes tool calls** — if the LLM responds with `tool_use`, Chat-Live connects to the appropriate external MCP server and calls the tool
5. **Returns result** — feeds the tool result back to the LLM for the next round
6. **Repeats** — up to 5 rounds maximum, then forces a text response

Tool names are namespaced as `server_name__tool_name` to prevent collisions across servers.

### SSE Events for Tool Progress

During streaming responses, Chat-Live emits SSE events that include tool execution status:

```
data: {"type": "mcp_tool_start", "server": "my-tools", "tool": "search", "arguments": {...}}

data: {"type": "mcp_tool_result", "server": "my-tools", "tool": "search", "result": {...}}

data: {"type": "delta", "content": "Based on the search results..."}

data: {"type": "done", "credits_used": 0.000045, "input_tokens": 512, "output_tokens": 128, "model": "claude-haiku-4.5"}

data: [DONE]
```

| Event Type | Description |
|------------|-------------|
| `mcp_tool_start` | The model requested a tool call (includes server, tool name and arguments) |
| `mcp_tool_result` | Tool execution completed (includes the server, tool name and result) |
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
                    "model": "kling-v2-1-master",
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
        model: 'kling-v2-1-master',
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
