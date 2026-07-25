# MCP Integration Guide

Connect FOTOhub's AI capabilities to your IDE, AI assistant, or agent framework using the Model Context Protocol (MCP).

::: info What is MCP?
MCP (Model Context Protocol) is an open standard that lets AI assistants call external tools and APIs. FOTOhub's MCP server exposes image generation, video generation, chat, and more as tools that Claude, VS Code Copilot, Cursor, and other MCP-compatible clients can use directly.
:::

---

## Prerequisites

- FOTOhub API key from [fotohub.app/settings/api](https://fotohub.app/settings/api)
- An MCP-compatible client (Claude Desktop, VS Code, Cursor, or any MCP SDK)

---

## Quick Start (2 Minutes)

### Step 1: Get Your API Key

1. Go to [fotohub.app/settings/api](https://fotohub.app/settings/api)
2. Click **Create API Key**
3. Name it (e.g., "MCP - Claude Desktop")
4. Copy the key (starts with `fh_live_`)

### Step 2: Configure Your Client

Choose your client below and add the FOTOhub MCP server configuration.

---

## Claude Desktop Configuration

Add to your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

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

Restart Claude Desktop. You should see FOTOhub tools available in the tools menu.

---

## VS Code (GitHub Copilot) Configuration

Add to your VS Code `settings.json` (Cmd/Ctrl+Shift+P → "Preferences: Open User Settings (JSON)"):

```json
{
  "mcp": {
    "servers": {
      "fotohub": {
        "url": "https://apis.fotohub.app/mcp/",
        "headers": {
          "Authorization": "Bearer fh_live_your_api_key"
        }
      }
    }
  }
}
```

Or add to `.vscode/mcp.json` in your project for team sharing:

```json
{
  "servers": {
    "fotohub": {
      "url": "https://apis.fotohub.app/mcp/",
      "headers": {
        "Authorization": "Bearer ${env:FOTOHUB_API_KEY}"
      }
    }
  }
}
```

---

## Cursor Configuration

Add to Cursor's MCP settings (Settings → MCP Servers → Add):

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

---

## Available MCP Tools

Once connected, your AI assistant can use these tools:

| Tool | Description | Example prompt |
|------|-------------|----------------|
| `generate_image` | Generate images from text | "Generate a product mockup of headphones" |
| `generate_video` | Generate videos (async) | "Create a 5s video of a sunset" |
| `edit_image` | Edit existing images | "Remove the background from this image" |
| `upscale_image` | Upscale image resolution | "Upscale this image to 4K" |
| `chat` | AI text generation | "Summarize this document" |
| `text_to_speech` | Convert text to speech | "Read this paragraph aloud" |
| `generate_music` | Generate music/audio | "Create a calm lo-fi beat" |
| `list_models` | List available models | "What image models are available?" |
| `check_usage` | Check credit balance | "How many credits do I have left?" |

---

## First Call Example

After configuring your client, try these prompts:

### In Claude Desktop

> "Use FOTOhub to generate a product photo of a minimalist desk lamp on a white background"

Claude will call the `generate_image` tool and display the result.

### In VS Code / Cursor

> "Generate a hero image for my landing page — abstract gradient in blue and purple, 16:9"

The assistant will use FOTOhub's MCP tools to generate the image and can save it to your project.

---

## Programmatic MCP Client

Build your own MCP client to integrate FOTOhub tools into custom agents:

::: code-group
```python [Python]
from fotohub import FotoHub

# The SDK includes MCP client support
client = FotoHub()

# List available tools
tools = client.mcp.list_tools()
for tool in tools:
    print(f"  {tool.name}: {tool.description}")

# Call a tool directly
result = client.mcp.call_tool(
    name="generate_image",
    arguments={
        "prompt": "A serene mountain lake at dawn",
        "model": "seedream-5-0-260128",
        "aspect_ratio": "16:9",
    },
)
print(f"Image URL: {result.content[0].text}")
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

// List available tools
const tools = await client.mcp.listTools();
tools.forEach((tool) => {
  console.log(`  ${tool.name}: ${tool.description}`);
});

// Call a tool
const result = await client.mcp.callTool({
  name: "generate_image",
  arguments: {
    prompt: "A serene mountain lake at dawn",
    model: "seedream-5-0-260128",
    aspectRatio: "16:9",
  },
});
console.log(`Image URL: ${result.content[0].text}`);
```
```go [Go]
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
)

func main() {
    // List tools
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/mcp/", nil)
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    req.Header.Set("Content-Type", "application/json")

    // MCP JSON-RPC: tools/list
    listPayload, _ := json.Marshal(map[string]interface{}{
        "jsonrpc": "2.0",
        "id":      1,
        "method":  "tools/list",
    })
    req.Body = io.NopCloser(bytes.NewBuffer(listPayload))
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()

    // Call a tool
    callPayload, _ := json.Marshal(map[string]interface{}{
        "jsonrpc": "2.0",
        "id":      2,
        "method":  "tools/call",
        "params": map[string]interface{}{
            "name": "generate_image",
            "arguments": map[string]string{
                "prompt":       "A serene mountain lake at dawn",
                "model":        "seedream-5-0-260128",
                "aspect_ratio": "16:9",
            },
        },
    })

    req2, _ := http.NewRequest("POST", "https://apis.fotohub.app/mcp/",
        bytes.NewBuffer(callPayload))
    req2.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    req2.Header.Set("Content-Type", "application/json")
    resp2, _ := http.DefaultClient.Do(req2)
    defer resp2.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp2.Body).Decode(&result)
    fmt.Printf("Result: %v\n", result)
}
```
```bash [cURL]
# List available MCP tools
curl -X POST https://apis.fotohub.app/mcp/ \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'

# Call generate_image tool
curl -X POST https://apis.fotohub.app/mcp/ \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "generate_image",
      "arguments": {
        "prompt": "A serene mountain lake at dawn",
        "model": "seedream-5-0-260128",
        "aspect_ratio": "16:9"
      }
    }
  }'
```
:::

---

## Use Cases

### Design Workflow in IDE

Use FOTOhub MCP in your IDE to generate assets while coding:

- "Generate placeholder images for my React components"
- "Create a favicon for this project — minimalist, blue"
- "Generate Open Graph images for each blog post title in my markdown files"

### AI Agent Integration

Build agents that use FOTOhub tools for creative tasks:

- Content generation pipelines (blog post + hero image + social media variants)
- E-commerce automation (product description + product photo generation)
- Marketing workflows (ad copy + ad creative in one agent loop)

### Rapid Prototyping

Use natural language in your IDE to quickly generate assets:

- "Make a logo for a coffee shop called 'Bean There'"
- "Generate 4 color variations of a sunset wallpaper"
- "Create a 5-second loading animation video"

---

## Environment Variables

For security, use environment variables instead of hardcoding your API key:

```bash
# Add to ~/.bashrc, ~/.zshrc, or .env
export FOTOHUB_API_KEY="fh_live_your_api_key"
```

Then reference in configs:

```json
{
  "mcpServers": {
    "fotohub": {
      "url": "https://apis.fotohub.app/mcp/",
      "headers": {
        "Authorization": "Bearer ${env:FOTOHUB_API_KEY}"
      }
    }
  }
}
```

::: warning
Never commit API keys to version control. Use environment variables or a secrets manager. Add `.env` to your `.gitignore`.
:::

---

## Troubleshooting

### "Tool not found" Error

- Verify your API key is valid at [fotohub.app/settings/api](https://fotohub.app/settings/api)
- Ensure the MCP server URL is exactly `https://apis.fotohub.app/mcp/`
- Restart your client application after config changes

### "Unauthorized" Error

- Check that the `Authorization` header format is `Bearer fh_live_...` (with space after Bearer)
- Ensure the key has not been revoked or expired
- Try generating a new key

### Connection Timeout

- Check your internet connection
- Verify no firewall/proxy is blocking `apis.fotohub.app`
- The MCP server supports HTTP/2 — ensure your client does too

### Tools Not Appearing

- In Claude Desktop: check the "hammer" icon in the input area — tools should be listed
- In VS Code: run "MCP: List Servers" from the command palette
- In Cursor: check Settings → MCP Servers for connection status

### Rate Limiting

MCP requests share your API key's rate limit. If you hit limits:

- Reduce concurrent tool calls in your agent
- Upgrade your plan for higher limits
- Add delays between rapid-fire tool invocations

---

## Security Best Practices

1. **Use scoped keys** — Create a dedicated API key for MCP with minimal permissions
2. **Rotate regularly** — Rotate MCP keys every 90 days
3. **Monitor usage** — Check [fotohub.app/billing/usage](https://fotohub.app/billing/usage) for unexpected spikes
4. **Environment variables** — Never hardcode keys in config files that get committed
5. **Revoke on compromise** — If a key leaks, revoke immediately at the console

---

## Related

- [API Overview](/api/getting-started) — Full API reference
- [SDK Setup](/guides/sdk-setup) — Python & TypeScript SDK installation
- [Authentication](/api/authentication) — API key management
- [Cost Optimization](/guides/cost-optimization) — Monitor MCP-driven spend
