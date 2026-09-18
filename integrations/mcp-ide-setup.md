# Modern MCP Setup (Claude, Cursor, Cline, Roo Code, Windsurf)

Connect Claude Desktop, Cursor, VS Code Cline, Roo Code, and Windsurf to FOTOhub's creative AI tools via the open **Model Context Protocol (MCP)**.

FOTOhub runs a production FastMCP server (`server/mcp-server/`) accessible over **Streamable HTTP** (recommended, zero-install remote transport) and local **stdio**. `GET https://apis.fotohub.app/mcp/health` always reports the live tool count and is authoritative over any number on this page.

---

## Connection Transports

| Transport | Connection Endpoint | Authentication | Advantages |
|:---|:---|:---|:---|
| **Streamable HTTP (Remote)** | `https://apis.fotohub.app/mcp/` | `Bearer fh_live_...` or OAuth 2.1 | Zero local dependencies, always up to date, accessible anywhere |
| **Local stdio** | `python main.py --stdio` (from a clone of `server/mcp-server/`) | `FOTOHUB_API_KEY` env var | Direct local execution, offline proxying |

There is no standalone published package that runs the stdio server — it ships as part of the `server/mcp-server/` service in the FOTOhub repo. For most clients, Streamable HTTP (Option A below) needs no local install at all and is the simpler path; use stdio only if you specifically need a local process.

---

## IDE & Assistant Configuration Guides

### 1. Claude Desktop

Edit your Claude Desktop configuration file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

#### Option A: Streamable HTTP (Remote — Recommended)

```json
{
  "mcpServers": {
    "fotohub": {
      "type": "http",
      "url": "https://apis.fotohub.app/mcp/",
      "headers": {
        "Authorization": "Bearer fh_live_your_api_key_here"
      }
    }
  }
}
```

#### Option B: Local stdio (Python, from a clone of the repo)

```json
{
  "mcpServers": {
    "fotohub": {
      "command": "python",
      "args": ["/absolute/path/to/fotohub/server/mcp-server/main.py", "--stdio"],
      "env": {
        "FOTOHUB_API_KEY": "fh_live_your_api_key_here"
      }
    }
  }
}
```

This requires a local clone of the FOTOhub repo with `server/mcp-server`'s dependencies installed (`pip install -r requirements.txt` inside that directory) — there is no `pip install`/`uvx`-able package that runs this server standalone.

---

### 2. Cursor

In Cursor, open **Settings → Features → MCP**:

1. Click **+ Add New MCP Server**.
2. Set **Name** to `fotohub`.
3. Set **Type** to `http`.
4. Set **Server URL** to:
   ```
   https://apis.fotohub.app/mcp/
   ```
5. In **Headers**, add:
   ```json
   {
     "Authorization": "Bearer fh_live_your_api_key_here"
   }
   ```
6. Alternatively, edit `.cursor/mcp.json` in your workspace root:

```json
{
  "mcpServers": {
    "fotohub": {
      "type": "http",
      "url": "https://apis.fotohub.app/mcp/",
      "headers": {
        "Authorization": "Bearer fh_live_your_api_key_here"
      }
    }
  }
}
```

---

### 3. VS Code Cline

Open the Cline panel in VS Code, click the **MCP Servers** icon (plug icon), select **Installed MCP Servers**, and click **Edit Global MCP Settings**:

```json
{
  "mcpServers": {
    "fotohub": {
      "url": "https://apis.fotohub.app/mcp/",
      "transport": "streamable-http",
      "headers": {
        "Authorization": "Bearer fh_live_your_api_key_here"
      },
      "autoApprove": [
        "check_balance",
        "list_models",
        "analyze_image"
      ]
    }
  }
}
```

---

### 4. Roo Code

In VS Code with Roo Code installed, edit `~/.roo/mcp_settings.json` or click **Roo Settings → MCP**:

```json
{
  "mcpServers": {
    "fotohub": {
      "url": "https://apis.fotohub.app/mcp/",
      "headers": {
        "Authorization": "Bearer fh_live_your_api_key_here"
      }
    }
  }
}
```

---

### 5. Windsurf (Codeium)

In Windsurf, open **Settings → Windsurf Settings → Cascade → MCP Servers** and click **Open mcp_config.json**:

```json
{
  "mcpServers": {
    "fotohub": {
      "serverUrl": "https://apis.fotohub.app/mcp/",
      "headers": {
        "Authorization": "Bearer fh_live_your_api_key_here"
      }
    }
  }
}
```

---

## The FOTOhub Tool Catalog

**57 tools are active** (`GET /mcp/health` is authoritative). Two of those are registered but currently inert (`voice_clone`, `separate_stems` — they answer with a fixed "not yet available via MCP" message and call no backend). Three more are defined but not registered in production because their backing engine is not deployed (`generate_shorts`, `create_training_job`, `get_training_status`). Full per-tool parameters: [MCP API Reference](/api/mcp).

### Image Tools (8)
`generate_image` · `edit_image` · `upscale_image` · `remove_background` · `enhance_prompt` · `analyze_image` · `style_transfer` · `inpaint_image`

### Editing Tools (11)
`replace_background` · `blur_background` · `add_shadow` · `enhance_image` · `denoise_image` · `restore_faces` · `depth_map` · `upscale_video` · `transcode_video` · `add_watermark` · `change_video_speed`

### Video Tools (6 active, 1 gated)
`generate_video` · `image_to_video` · `extend_video` · `generate_story` · `get_job_status` · `add_subtitles` — plus `generate_shorts` ⚠️ (not registered in production)

### Audio Tools (4 working, 2 inert)
`text_to_speech` · `generate_music` · `generate_sfx` · `transcribe_audio` — plus `voice_clone` ⚠️ and `separate_stems` ⚠️ (registered but inert, see above)

### 3D Tools (4)
`generate_3d_from_text` · `generate_3d_from_image` · `list_3d_models` · `get_3d_result`

### Studio Tools — UGC Ads (6)
`create_ugc_project` · `list_ugc_projects` · `estimate_ugc_cost` · `set_ugc_blueprint` · `render_ugc_video` · `get_ugc_job`

### Chat Tools (3)
`chat_completion` (Claude- and Nova-class models only) · `translate_text` · `gabriel_route`

### Pricing Tools (3)
`get_price` · `estimate_cost` · `compare_prices`

### Storage Tools (4)
`list_buckets` · `list_files` · `save_to_storage` · `get_download_link`

### Utility Tools (6)
`check_balance` · `list_models` · `list_generations` · `get_usage_summary` · `get_transactions` · `search_photos`

### Training Tools (0 active, 2 gated)
`create_training_job` ⚠️ and `get_training_status` ⚠️ are defined but not registered in production (their backing training-engine is not deployed).

---

## MCP Resources

Read-only context URIs your assistant can inspect without consuming generation balance:

| Resource URI | Description |
|:---|:---|
| `fotohub://models/image` | Image generation model catalog |
| `fotohub://models/video` | Video generation models |
| `fotohub://models/audio` | Music and TTS models |
| `fotohub://models/3d` | 3D generation models |
| `fotohub://pricing` | Full model catalog and USD pricing table |
| `fotohub://balance` | Current prepaid USD wallet balance |
| `fotohub://guide/getting-started` | Onboarding guide for a new MCP client |
| `fotohub://limits` | Current per-tool limits (character caps, durations, etc.) |

---

## Built-In MCP Prompts

FOTOhub provides reusable prompt templates accessible inside your IDE via `/`:

- **`creative_brief`**: Structured image-generation brief (`subject`, `style`, `mood`, `format`).
- **`video_director`**: Breaks a concept into multi-scene camera/lighting directions (`concept`, `duration`, `style`).
- **`product_photo`**: Commercial e-commerce photography prompt builder (`product`, `background`, `angle`, `lighting`).
- **`ecommerce_product_shots`**: One product across several background variants for marketplace listings.
- **`social_media_pack`**: Copy + matching visuals sized for multiple platforms from one idea.
- **`ugc_ad_pipeline`**: Plans and produces a UGC-style ad within a fixed USD budget.
- **`avatar_profile_photo`**: Avatar/profile photo generation.
- **`voiceover_script`**: Turns a script into narration, handling the TTS character limits.
- **`budget_constrained_generation`**: Plans any generation task inside a fixed USD budget.

Full argument lists: [MCP API Reference](/api/mcp).

---

## Authentication & Billing

Two credential types work, and they bill differently:

- A raw `fh_live_*` API key (from [fotohub.app/settings/api](https://fotohub.app/settings/api)) spends only the account's prepaid **USD wallet**.
- A key minted through **OAuth 2.1** (dynamic client registration at `https://apis.fotohub.app/mcp/oauth/register`) spends the account's **subscription credits first**, then falls back to the USD wallet.

There is no separate sandbox/test key prefix — `fh_live_*` is the only kind issued. Full OAuth endpoint details: [MCP API Reference](/api/mcp#authentication).
