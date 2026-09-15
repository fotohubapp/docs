# MCP (Model Context Protocol)

Connect FOTOhub's 30 creative AI tools to any MCP-compatible client — Claude Desktop, Cursor, Windsurf, VS Code Copilot, and more.

## Quick Start

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "fotohub": {
      "url": "https://apis.fotohub.app/mcp/",
      "headers": {
        "Authorization": "Bearer fh_live_YOUR_API_KEY"
      }
    }
  }
}
```

### Cursor / Windsurf

Add to your MCP settings:

```json
{
  "mcpServers": {
    "fotohub": {
      "url": "https://apis.fotohub.app/mcp/",
      "headers": {
        "Authorization": "Bearer fh_live_YOUR_API_KEY"
      }
    }
  }
}
```

### VS Code (GitHub Copilot)

In `.vscode/mcp.json`:

```json
{
  "servers": {
    "fotohub": {
      "type": "http",
      "url": "https://apis.fotohub.app/mcp/",
      "headers": {
        "Authorization": "Bearer fh_live_YOUR_API_KEY"
      }
    }
  }
}
```

## Authentication

All requests require a Bearer token with your FOTOhub API key:

```
Authorization: Bearer fh_live_YOUR_API_KEY
```

Get your API key at [fotohub.app/console](https://fotohub.app/console) → API Keys.

## Available Tools (30)

### Image (8 tools)

| Tool | Description |
|------|-------------|
| `generate_image` | Generate an image from text prompt. Models: seedream, flux-2-pro, imagen-4, grok-imagine |
| `edit_image` | Edit an image (inpaint, background swap, outpaint) |
| `upscale_image` | AI super-resolution (2x/4x) |
| `remove_background` | Remove background from image |
| `enhance_prompt` | AI-enhance your image prompt for better results |
| `analyze_image` | Analyze image (tags, colors, NSFW detection, OCR) |
| `style_transfer` | Apply artistic style to an image |
| `inpaint_image` | Remove or replace objects in an image |

### Video (7 tools)

| Tool | Description |
|------|-------------|
| `generate_video` | Generate video from text (async — returns job_id) |
| `image_to_video` | Animate a still image into video |
| `extend_video` | Extend an existing video |
| `generate_story` | Create multi-scene film with voiceover |
| `generate_shorts` | Auto-cut long video into social shorts |
| `get_job_status` | Check status of async video/music jobs |
| `add_subtitles` | Add subtitles to a video |

### Audio (6 tools)

| Tool | Description |
|------|-------------|
| `text_to_speech` | Convert text to speech (multiple voices/languages) |
| `generate_music` | Generate music from description (async) |
| `generate_sfx` | Generate sound effects |
| `transcribe_audio` | Speech-to-text transcription |
| `voice_clone` | Clone a voice from audio sample |
| `separate_stems` | Separate audio into vocal/drum/bass/other tracks |

### Chat (3 tools)

| Tool | Description |
|------|-------------|
| `chat_completion` | LLM chat (Claude, GPT, Gemini) |
| `translate_text` | Translate text between languages |
| `gabriel_route` | Smart intent classifier — analyzes prompt and suggests best action |

### Utility (4 tools)

| Tool | Description |
|------|-------------|
| `check_balance` | Check your prepaid USD wallet balance |
| `list_models` | List all available AI models with pricing |
| `list_generations` | View generation history |
| `search_photos` | Semantic photo search in your library |

### Training (2 tools)

| Tool | Description |
|------|-------------|
| `create_training_job` | Start a LoRA/voice training job |
| `get_training_status` | Check training job progress |

## Async Operations

Video generation, music creation, and training are asynchronous. They return a `job_id` — use `get_job_status` to poll for completion:

```
1. generate_video(prompt="A sunset over mountains") → job_id: "vid_abc123"
2. get_job_status(job_id="vid_abc123") → {status: "processing", progress: 45}
3. get_job_status(job_id="vid_abc123") → {status: "completed", video_url: "https://..."}
```

## Resources

The server also exposes MCP resources for browsing:

| URI | Description |
|-----|-------------|
| `fotohub://models/image` | Available image generation models |
| `fotohub://models/video` | Available video generation models |
| `fotohub://models/audio` | Available audio/music models |
| `fotohub://pricing` | Current pricing table |
| `fotohub://balance` | Your prepaid USD wallet balance |

## Prompts

Pre-built prompt templates for common workflows:

| Prompt | Description |
|--------|-------------|
| `creative_brief` | Generate a creative brief for a project |
| `video_director` | Plan a multi-scene video production |
| `product_photo` | Generate product photography |

## Protocol Details

- **Protocol version**: 2025-03-26
- **Transport**: Streamable HTTP (JSON-RPC 2.0 over POST, optional SSE)
- **Server endpoint**: `https://apis.fotohub.app/mcp/`
- **Health check**: `GET https://apis.fotohub.app/mcp/health`

## Billing

Each generation tool call deducts pure USD from your prepaid wallet. Use `check_balance` to monitor usage. Pricing varies by model — use `list_models` to see current rates.

If wallet funds run out mid-request, you'll receive an error: `"insufficient_funds — top up at fotohub.app/console"`
