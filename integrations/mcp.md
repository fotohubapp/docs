# MCP (Model Context Protocol)

MCP is the open standard that lets an AI assistant call someone else's tools.
FOTOhub runs an MCP server, so any MCP-capable client can generate and edit
images, video, speech, music and 3D on our own GPUs — and be told exactly what
each call cost.

FOTOhub is listed in the official MCP registry as **`app.fotohub/fotohub`**.

## Pick your client

| Client | How you connect | Guide |
|---|---|---|
| **ChatGPT** | Published in the app directory — search for FOTOhub and enable it | [FOTOhub in ChatGPT](/integrations/mcp-chatgpt) |
| **Claude** (web, Desktop, Code) | Add a custom connector pointing at the server URL, then sign in | [FOTOhub in Claude](/integrations/mcp-claude) |
| **Cursor, VS Code, Windsurf, other IDEs** | Config file with the server URL and an API key | [IDE setup](/integrations/mcp-ide-setup) |
| **Your own client** | Streamable HTTP or local stdio | [Protocol reference](/api/mcp) |

## The server

```
https://apis.fotohub.app/mcp/     primary
https://mcp.fotohub.app/          dedicated hostname, same service
```

`GET https://apis.fotohub.app/mcp/health` is public and returns the live tool
count — treat it as authoritative over any number written in these docs.

**Transports:** Streamable HTTP for remote clients, stdio for a local process.

## Two ways to authenticate, and they bill differently

This is the single most important thing on this page.

| Credential | How you get it | What it spends |
|---|---|---|
| **OAuth 2.1 sign-in** | Enabling the ChatGPT app, or adding the Claude connector — the client registers itself | **Subscription credits first**, then the prepaid USD wallet. One call can be split across both. |
| **`fh_live_*` API key** | [Console → Keys](https://fotohub.app/console/keys), passed as `Authorization: Bearer` | The prepaid USD wallet only. |

The OAuth path needs no pre-registration: the server supports dynamic client
registration, PKCE (`S256`) and refresh tokens. Discovery lives at
`/.well-known/oauth-authorization-server`, with scopes `mcp:read`, `mcp:write`,
`mcp:image`, `mcp:video`, `mcp:audio`, `mcp:chat`, `mcp:training` and
`mcp:billing`.

## Inline results, where the host supports them

The server publishes three UI resources — a **gallery** for anything that
returns pictures, a **player** for video and audio, and a **price table** for
model comparisons — so results render as components instead of link lists.
Hosts that implement the MCP Apps UI extension draw them; every other client
gets the text block, which is always sent alongside. Nothing is lost either way.

## Skills ship with the server

Four workflow skills (`fotohub-generation-basics`,
`fotohub-product-photography`, `fotohub-short-video-ad`, `fotohub-brand-kit`)
are served directly by the server over the MCP skills extension. A client that
supports it imports them on connect, which is what makes an assistant run the
cut-out → background → shadow order correctly instead of guessing.

## Quick start with an API key

If you are wiring up an IDE or your own client rather than ChatGPT or Claude,
the shape is the same everywhere: the URL plus a Bearer token.

```json
{
  "mcpServers": {
    "fotohub": {
      "url": "https://apis.fotohub.app/mcp/",
      "headers": { "Authorization": "Bearer fh_live_YOUR_API_KEY" }
    }
  }
}
```

VS Code's `.vscode/mcp.json` uses `servers` with `"type": "http"` instead of
`mcpServers`. Per-IDE files are in the [IDE setup guide](/integrations/mcp-ide-setup).

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

What a call settles against depends on how you connected — see
[the two credentials](#two-ways-to-authenticate-and-they-bill-differently)
above. An OAuth sign-in spends subscription credits first and falls through to
the prepaid USD wallet; a raw `fh_live_*` key spends the wallet only. A single
call can be split across both.

Every tool result states what was actually charged and what is left. Use that
figure rather than an estimate.

Quoting is free. `get_price`, `estimate_cost` and `compare_prices` take nothing
from your account, so price a video before you render one. `check_balance`
reports what you have.

When both credits and wallet are exhausted the call fails with
`insufficient_funds` **before** any GPU work starts, so an underfunded account
costs you nothing but the round trip. Top up at
[fotohub.app/console](https://fotohub.app/console).

## Next

[FOTOhub in ChatGPT](/integrations/mcp-chatgpt) ·
[FOTOhub in Claude](/integrations/mcp-claude) ·
[IDE setup](/integrations/mcp-ide-setup) ·
[Protocol reference](/api/mcp)
