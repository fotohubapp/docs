# Modern MCP Setup (Claude, Cursor, Cline, Roo Code, Windsurf)

Connect Claude Desktop, Cursor, VS Code Cline, Roo Code, and Windsurf to 28+ creative AI generation tools via the open **Model Context Protocol (MCP)**.

FOTOhub runs a production FastMCP server (`server/mcp-server/`) accessible over **Streamable HTTP** (recommended, zero-install remote transport) and local **stdio**.

---

## Connection Transports

| Transport | Connection Endpoint | Authentication | Advantages |
|:---|:---|:---|:---|
| **Streamable HTTP (Remote)** | `https://apis.fotohub.app/mcp/` | `Bearer fh_live_...` or OAuth 2.1 | Zero local dependencies, always up to date, accessible anywhere |
| **Local stdio** | `python main.py --stdio` | `FOTOHUB_API_KEY` env var | Direct local execution, offline proxying |

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

#### Option B: Local stdio (Python)

```json
{
  "mcpServers": {
    "fotohub": {
      "command": "uvx",
      "args": ["fotohub-mcp", "--stdio"],
      "env": {
        "FOTOHUB_API_KEY": "fh_live_your_api_key_here"
      }
    }
  }
}
```

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
        "describe_image"
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

## The FOTOhub Tool Catalog (28 Production Tools)

### Image & 3D Generation Tools
- **`generate_image`**: Text-to-image with Seedream, FLUX.2 Pro, DALL-E 3, Midjourney-style models.
- **`edit_image`**: Inpainting and instruction-based image transformations.
- **`upscale_image`**: Neural super-resolution (2x/4x) with detail enhancement.
- **`remove_background`**: Precise studio alpha cutout.
- **`try_on`**: Virtual fashion try-on onto human models.
- **`generate_3d`**: 2D photo to watertight `.glb` 3D mesh.
- **`describe_image`**: Multimodal visual scene breakdown and prompt extraction.
- **`analyze_document`**: Visual OCR and key-value document intelligence.

### Video & Animation Tools
- **`generate_video`**: Text/image-to-video with Veo 3.1, Kling 2.1, and LTX-Video.
- **`generate_shorts`**: Automated viral vertical video generation.
- **`edit_video`**: Trimming, aspect ratio conversion, and speed ramping.
- **`generate_story`**: Multi-scene storyboard video production.
- **`generate_lip_sync`**: Facial retargeting matching video to audio.
- **`motion_transfer`**: Drive portrait motion from a driving video.
- **`video_to_audio`**: Automated sound effects and Foley matching video events.

### Audio & Music Tools
- **`generate_music`**: High-fidelity AI music generation (genres, BPM, instruments).
- **`generate_voice`**: Expressive text-to-speech with emotion control.
- **`clone_voice`**: Zero-shot voice cloning from a 5-second audio sample.
- **`generate_sound_effects`**: Cinematic whooshes, ambient backgrounds, and impacts.
- **`transcribe_audio`**: Whisper Large-v3 timestamped transcription.
- **`separate_audio`**: Demucs vocal/instrument stem isolation.

### Chat & Orchestration Tools
- **`chat_completion`**: Multi-model LLM inference (Claude 3.7, GPT-4o, DeepSeek).
- **`agent_workflow`**: Multi-step creative agent planner.
- **`orchestrate`**: Autonomous end-to-end campaign generator.

### Utility Tools
- **`list_models`**: Catalog of 50+ available models and per-token pricing.
- **`check_balance`**: Query your real-time available prepaid USD wallet.
- **`get_job_status`**: Asynchronous job polling for video and 3D tasks.
- **`upload_file`**: Upload assets to FOTOhub high-speed edge storage.

---

## MCP Resources

Read-only context URIs your assistant can inspect without consuming generation credits:

| Resource URI | Description |
|:---|:---|
| `fotohub://models/image` | Real-time image model catalog and features |
| `fotohub://models/video` | Video generation models, durations, and resolution limits |
| `fotohub://models/audio` | Music and TTS voices catalog |
| `fotohub://pricing` | Full credit pricing table and USD exchange rates |
| `fotohub://balance` | Current user credit balance and wallet status |

---

## Built-In MCP Prompts

FOTOhub provides reusable prompt templates accessible inside your IDE via `/`:

- **`/creative_brief`**: Generates a structured image generation brief optimized for Seedream or FLUX.
- **`/video_director`**: Deconstructs a narrative concept into multi-scene camera movements and lighting setups.
- **`/product_photo`**: Commercial e-commerce photography prompt builder with studio lighting specs.
