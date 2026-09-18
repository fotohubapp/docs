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

## Available tools (57)

The live count is served by `GET https://apis.fotohub.app/mcp/health`, which reads
the registry rather than a constant — treat it as authoritative over this page.

The tool registry defines 60 tools. Three are **gated off in production** because
the service behind them is not deployed, and a registered tool that 403s is worse
than an absent one: `generate_shorts` (needs `SHORTS_ENGINE_URL`) and the two
training tools `create_training_job` / `get_training_status` (need
`TRAINING_ENGINE_URL`). That leaves the 57 below.

Two of those 57 are registered but **inert**: `voice_clone` and `separate_stems`
appear in `tools/list` and answer successfully, but their implementations return
a short "not yet available via MCP" message and never call a backend. They are
marked ⚠️ in the tables. So 55 tools actually do work. Both capabilities exist in
the FOTOhub dashboard; neither has a billed public endpoint behind it yet.

### Image (8)

| Tool | Description |
|------|-------------|
| `generate_image` | Generate an image from a text prompt |
| `edit_image` | Edit an image (inpaint, background swap, outpaint) |
| `upscale_image` | AI super-resolution |
| `remove_background` | Remove the background from an image |
| `enhance_prompt` | Rewrite an image prompt for better results |
| `analyze_image` | Tags, colours, NSFW detection, OCR |
| `style_transfer` | Apply an artistic style to an image |
| `inpaint_image` | Remove or replace objects in an image |

### Editing — image and video post-production (11)

| Tool | Description |
|------|-------------|
| `replace_background` | Swap an image background |
| `blur_background` | Depth-aware background blur |
| `add_shadow` | Composite a natural shadow |
| `enhance_image` | General quality enhancement |
| `denoise_image` | Noise reduction |
| `restore_faces` | Face restoration |
| `depth_map` | Produce a depth map |
| `upscale_video` | Video super-resolution |
| `transcode_video` | Re-encode to another format or codec |
| `add_watermark` | Overlay a watermark |
| `change_video_speed` | Retime a video |

### Video (6)

| Tool | Description |
|------|-------------|
| `generate_video` | Generate video from text (async — returns `job_id`) |
| `image_to_video` | Animate a still image |
| `extend_video` | Extend an existing video |
| `generate_story` | Multi-scene film with voiceover |
| `get_job_status` | Poll any async job |
| `add_subtitles` | Burn subtitles into a video |

### Audio (6)

| Tool | Description |
|------|-------------|
| `text_to_speech` | Speech synthesis, multiple voices and languages |
| `generate_music` | Music from a description (async) |
| `generate_sfx` | Sound effects |
| `transcribe_audio` | Speech to text |
| `voice_clone` ⚠️ | Registered but **disabled** — returns a message pointing at the dashboard. It calls no backend. |
| `separate_stems` ⚠️ | Registered but **disabled** — returns a message pointing at the dashboard. It calls no backend. |

### 3D (4)

| Tool | Description |
|------|-------------|
| `generate_3d_from_text` | Text to 3D mesh |
| `generate_3d_from_image` | Image to 3D mesh |
| `list_3d_models` | Available 3D engines, with prices and availability |
| `get_3d_result` | Fetch a finished 3D job |

### Studio — UGC ads (6)

| Tool | Description |
|------|-------------|
| `create_ugc_project` | Start a UGC ad project |
| `list_ugc_projects` | List your projects |
| `estimate_ugc_cost` | Price a render before running it |
| `set_ugc_blueprint` | Set the project blueprint |
| `render_ugc_video` | Render the ad |
| `get_ugc_job` | Poll a render |

### Chat (3)

| Tool | Description |
|------|-------------|
| `chat_completion` | LLM chat |
| `translate_text` | Translate between languages |
| `gabriel_route` | Intent classification — suggests the best action for a prompt |

### Pricing (3)

| Tool | Description |
|------|-------------|
| `get_price` | The rate for one model |
| `estimate_cost` | Cost of a specific run before you make it |
| `compare_prices` | Compare models for the same job |

### Storage (4)

| Tool | Description |
|------|-------------|
| `list_buckets` | Your buckets |
| `list_files` | Files in a bucket |
| `save_to_storage` | Copy a generated file into your own bucket before its link expires |
| `get_download_link` | Fresh signed link for a stored file |

### Account (6)

| Tool | Description |
|------|-------------|
| `check_balance` | Prepaid USD wallet balance |
| `list_models` | Full model catalogue with pricing |
| `list_generations` | Generation history |
| `get_usage_summary` | Usage roll-up |
| `get_transactions` | Wallet transactions |
| `search_photos` | Semantic search over your library |

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
