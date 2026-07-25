# Guide: CLI Setup & Usage

Install and use the FOTOhub CLI to generate AI content, chat with LLMs, manage storage, and automate workflows — all from your terminal.

## Installation

### Node.js CLI (recommended)

```bash
npm install -g fotohubapp-cli
```

Requires **Node.js 20+**. After installation, the `fotohub` command is available globally.

```bash
fotohub --version
# 3.0.0
```

### Python SDK (for scripting)

```bash
pip install fotohub
```

Requires **Python 3.9+**. Provides programmatic access to all CLI operations via the `FotoHub` class. See [SDK Setup](/guides/sdk-setup) for details.

---

## Authentication

### Browser Login (recommended)

```bash
fotohub auth login
```

This opens your browser for secure OAuth authentication. Your API key is validated and then stored **securely** — in your operating system's keychain (macOS Keychain, Windows Credential Manager, Linux libsecret) when available, or in an encrypted file (`~/.fotohub/creds.enc`, AES-256-GCM, `0600`) as a fallback on headless systems. It is **never** written to `config.json` in plaintext. See [Credential Storage](#credential-storage) below.

### Manual Key Entry

```bash
# Paste key interactively
fotohub auth login --manual

# Pass key directly (useful for CI)
fotohub auth login fh_live_your_key_here
```

### Environment Variable

```bash
export FOTOHUB_API_KEY=fh_live_your_key_here
```

### Auth Priority

The CLI resolves credentials in this order:

1. `--api-key` flag (highest priority)
2. `FOTOHUB_API_KEY` environment variable
3. OS keychain (macOS Keychain / Windows Credential Manager / Linux libsecret)
4. Encrypted file fallback (`~/.fotohub/creds.enc`)
5. Legacy plaintext `~/.fotohub/config.json` (read-only; auto-migrated to secure storage on first use)

### Verify Authentication

```bash
fotohub auth whoami
# FOTOhub Account
# Email:    you@example.com
# Plan:     Developer
# Credits:  420 remaining
# Wallet:   15.00 PLN
# Key:      fh_live_abcd...xyz9
```

### Logout

```bash
fotohub auth logout
```

---

## Interactive Mode

Running `fotohub` with no arguments (in a terminal, without `--json`) launches the interactive agent — a full-screen chat interface where the model can call FOTOhub tools (image, video, music, speech, 3D, storage, billing) and any connected [MCP servers](#mcp-servers) on your behalf:

```bash
fotohub
```

Type your request in natural language and the agent decides which tools to run — e.g. *"generate a watercolor cat and tell me my credit balance"* will call `generate_image` and `billing_balance`, showing each tool call inline as it runs.

Anything that is not a slash command is sent to the model as a message.

### Approval before spending

Image, video, music, speech and 3D generation cost credits, so the agent asks before running them:

```
Approve paid action?
  builtin__generate_image
  prompt: a watercolor cat  width: 1024  height: 1024
  y once · a always this session · n deny (Esc · Ctrl+C stops the turn)
```

Read-only tools (model lists, balance, usage, status) never prompt. Set the policy with `/mode`:

| Mode | Behaviour |
|------|-----------|
| `plan` | Refuse anything that writes or spends. The model explains what it would do. |
| `auto` | Ask before each paid action (default). |
| `yolo` | Never ask. |

### Editing

The composer is multiline and supports readline-style editing:

| Key | Action |
|-----|--------|
| `Enter` | Send |
| `Shift+Enter`, `Alt+Enter`, `Ctrl+J`, or a trailing `\` | New line |
| `↑` / `↓` | Prompt history (or move between lines when the prompt is multiline) |
| `Ctrl+R` | Search prompt history |
| `Ctrl+A` / `Ctrl+E` | Start / end of line |
| `Ctrl+W`, `Alt+Backspace` | Delete previous word |
| `Ctrl+K` / `Ctrl+U` | Delete to end / start of line, `Ctrl+Y` pastes it back |
| `Alt+←` / `Alt+→` | Move by word |
| `Tab` | Complete a slash command |
| `Esc` | Stop a running response |
| `Ctrl+C` | Stop, then again to exit |

Pasting works as one operation — a multi-line paste does not send a message per line, and a large paste collapses to a `[pasted 40 lines]` placeholder that expands when you send.

History is kept in `~/.fotohub/history.jsonl`. Prompts that appear to contain a credential are never written there.

### Sessions

Conversations are saved, so you can pick one back up:

```bash
fotohub --continue          # newest session for this directory
fotohub --resume            # same, explicitly
fotohub --resume <id>       # a specific session
```

Transcripts live in `~/.fotohub/sessions/` (`0600`, in a `0700` directory) and are written after each completed turn. Anything that looks like a credential is replaced with a placeholder rather than stored.

### Slash Commands

Type `/` to open an autocomplete menu, then `Tab` to complete.

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/model` | Open the model picker (arrow keys to choose) |
| `/models` | List every image and video generation model |
| `/mode [plan\|auto\|yolo]` | Show or set the approval policy |
| `/tools` | Show every tool the agent can call |
| `/mcp` | View connected MCP servers & their tools |
| `/usage` | Requests, tokens and spend |
| `/status` | Platform health per service |
| `/whoami` | Show account, plan, and credits |
| `/system <prompt>` | Set a system prompt (no argument shows the current one) |
| `/export [file\|md]` | Write the conversation to a file (json or markdown) |
| `/resume` | List saved sessions |
| `/clear` | Reset the conversation |
| `/login` / `/logout` | Authenticate / clear credentials |
| `/quit` | Exit |

> **Note:** `/model` lists the models the agent endpoint accepts, which differ from the plain-chat model IDs in `fotohub models list`. Use arrow keys and Enter to select.

### Appearance

Colours follow your terminal. `NO_COLOR` (or a non-TTY, or `TERM=dumb`) disables them entirely and switches to ASCII glyphs; a light background is detected automatically. Force a specific palette with `FOTOHUB_THEME=dark|light|high-contrast|mono`.

---

## Headless Mode (scripting)

Run a single agent turn non-interactively — for scripts, CI, or piping into other tools:

```bash
# Plain text on stdout
fotohub -p "list my image models"

# A JSON summary
fotohub -p "how many credits do I have?" --output-format json

# NDJSON event stream, one object per line
fotohub -p "generate a logo" --output-format stream-json --yolo | jq -c 'select(.type=="tool_call")'
```

### Headless Options

| Flag | Description |
|------|-------------|
| `-p, --print <prompt>` | The prompt to run |
| `--output-format <fmt>` | `text` (default), `json`, or `stream-json` |
| `--mode <mode>` | `plan`, `auto` (default) or `yolo` |
| `--yolo` | Allow paid tools without asking |
| `--allow-tool <name>` | Pre-approve one tool (repeatable) |
| `--deny-tool <name>` | Always refuse one tool (repeatable) |
| `--model <id>` | Agent model |
| `--system <prompt>` | System prompt |

Because a headless run cannot ask for approval, **paid tools are refused by default**. Pass `--yolo`, or `--allow-tool builtin__generate_image` to permit just one. The refusal explains this rather than pretending you declined.

`--json` is not accepted with `-p`: it belongs to the data subcommands, whose output shape is a stable contract. Use `--output-format json` instead.

### Event Schema

`stream-json` emits newline-delimited JSON. Every event carries `v` (the schema version) and a `type`:

| Type | Payload |
|------|---------|
| `session_start` | `sessionId`, `model`, `mode` |
| `text_delta` | `text` |
| `tool_call` | `id`, `name`, `input` |
| `tool_result` | `id`, `content`, `isError` |
| `usage` | `inputTokens`, `outputTokens` |
| `result` | `text`, `inputTokens`, `outputTokens` |
| `error` | `message` |

Exit codes: `0` success, `2` invalid usage, non-zero otherwise.

---

## Generate Images

```bash
# Basic generation
fotohub generate image "a futuristic city at sunset"

# Short alias
fotohub gen image "portrait of a cat in watercolor style"

# Full options
fotohub gen image "product photo of headphones on marble surface" \
  --model seedream-5-0-260128 \
  --width 1024 --height 1024 \
  --num 4 \
  --negative-prompt "blurry, low quality" \
  --seed 42 \
  --output headphones.png
```

### Image Options

| Flag | Description | Default |
|------|-------------|---------|
| `-m, --model <id>` | Model ID | `seedream-5-0-260128` |
| `-W, --width <px>` | Width in pixels | 1024 |
| `-H, --height <px>` | Height in pixels | 1024 |
| `-n, --num <count>` | Number of images (1-4) | 1 |
| `--aspect-ratio <ratio>` | Aspect ratio (16:9, 1:1, 9:16) | -- |
| `--negative-prompt <text>` | What to avoid in the image | -- |
| `--seed <number>` | Reproducibility seed | random |
| `-o, --output <path>` | Save first image to local file | -- |

### Example Output

```
Image generated successfully!

  #1 https://s3point.fotohub.app/generations/abc123/0.png
      seed: 42
  #2 https://s3point.fotohub.app/generations/abc123/1.png
      seed: 43

  Credits used: 2
```

---

## Generate Video

```bash
# Text-to-video
fotohub gen video "a drone shot flying over snow-capped mountains at golden hour" \
  --model veo-3.1-generate-001 \
  --duration 10

# Image-to-video (animate a photo)
fotohub gen video "camera slowly zooms in, subtle movement" \
  --image https://example.com/photo.jpg \
  --model kling-v3 \
  --duration 5

# Asynchronous models return a job ID immediately
fotohub gen video "waves at sunset"

# Save output locally
fotohub gen video "waves crashing on a rocky shore" \
  --output waves.mp4
```

### Video Options

| Flag | Description | Default |
|------|-------------|---------|
| `-m, --model <id>` | Model ID (see `fotohub models list --category video`) | `veo-3.1-generate-001` |
| `-d, --duration <seconds>` | Duration in seconds | 5 |
| `--aspect-ratio <ratio>` | Aspect ratio (16:9, 9:16, 1:1) | 16:9 |
| `--image <url>` | Input image for image-to-video | -- |
| `-o, --output <path>` | Save video to local file | -- |
| `--no-wait` | Deprecated, accepted but inert (async jobs always return immediately) | -- |

Some video models answer synchronously and the CLI prints the URL (and honors `-o`). The rest are asynchronous: they return a job ID immediately, and the finished video is delivered to your [FOTOhub library](https://fotohub.app/generate/videoai). There is no status endpoint for those jobs yet, so the CLI does not poll.

---

## Generate 3D Models

Turn an image (or a text prompt) into a downloadable 3D model.

```bash
# Image-to-3D (default mode)
fotohub gen 3d --file product-photo.png --output model.glb

# Text-to-3D
fotohub gen 3d --mode text-to-3d --model shap-e --prompt "a low-poly wooden chair" \
  --output chair.glb

# Choose format and quality
fotohub gen 3d --file sculpture.jpg --format obj --quality high --output sculpture.obj
```

### 3D Options

| Flag | Description | Default |
|------|-------------|---------|
| `--mode <mode>` | `image-to-3d` or `text-to-3d` | `image-to-3d` |
| `-m, --model <id>` | Model ID (currently available: `triposr` for image-to-3d, `shap-e` for text-to-3d) | `triposr` |
| `-f, --file <path>` | Input image file (required for `image-to-3d`) | -- |
| `-p, --prompt <text>` | Text prompt (required for `text-to-3d`) | -- |
| `--format <fmt>` | Output format (`glb`, `obj`, `stl`, `usdz`) | `glb` |
| `--quality <q>` | Quality (`draft`, `standard`, `high`) | `standard` |
| `-o, --output <path>` | Save 3D model to local file | -- |
| `--no-wait` | Submit and return the job ID immediately | -- |

The CLI reads the input image locally and uploads it, then polls until the model is ready.

> **Note:** `sf3d`, `trellis`, and `hunyuan3d` are recognized by the API but not yet enabled. Use `triposr` (image-to-3d) or `shap-e` (text-to-3d) today.

---

## Generate Music

```bash
# Text-to-music
fotohub gen music "upbeat electronic track with heavy synths and driving bass" \
  --duration 60 \
  --output track.mp3

# Instrumental only
fotohub gen music "gentle ambient piano with rain sounds" \
  --instrumental \
  --duration 120
```

### Music Options

| Flag | Description | Default |
|------|-------------|---------|
| `-m, --model <id>` | Model ID (`minimax`, `elevenlabs`) | `minimax` |
| `-d, --duration <seconds>` | Duration in seconds (the backend accepts up to 300; clips over 60s are billed at a higher tier) | 30 |
| `--instrumental` | Generate instrumental only (no vocals) | -- |
| `-o, --output <path>` | Save audio to local file | -- |

---

## Generate Speech (TTS)

```bash
# Basic text-to-speech
fotohub gen speech "Welcome to FOTOhub, the AI creative platform." \
  --language en \
  --output welcome.mp3

# Short alias
fotohub gen tts "Witamy w FOTOhub" --language pl

# Custom voice
fotohub gen speech "Breaking news report" \
  --voice news-anchor-1 \
  --output news.mp3
```

### Speech Options

| Flag | Description | Default |
|------|-------------|---------|
| `-v, --voice <id>` | Voice ID or name | platform default |
| `-l, --language <code>` | Language code (en, pl, de, fr, es) | en |
| `-o, --output <path>` | Save audio to local file | -- |

---

## Chat with LLMs

### One-Shot Mode

Send a single message and get a streaming response:

```bash
# Quick question
fotohub chat send "Explain REST APIs in 3 sentences"

# With specific model and system prompt
fotohub chat send "Review this code for security issues" \
  --model claude-sonnet \
  --system "You are a senior security engineer" \
  --temperature 0.3

# Non-streaming (full response at once)
fotohub chat send "Generate 5 product names for a coffee brand" --no-stream
```

### Chat Send Options

| Flag | Description | Default |
|------|-------------|---------|
| `-m, --model <id>` | Model ID (`claude-sonnet`, `gpt-4o`, `gemini-pro`, `gemini-flash`) | `claude-sonnet` |
| `-s, --system <prompt>` | System prompt | -- |
| `-t, --temperature <temp>` | Temperature (0-2) | 1 |
| `--no-stream` | Disable streaming | -- |

### Interactive Chat Mode

```bash
fotohub chat
```

Launches a dedicated, plain-streaming chat session with persistent context (this is the lightweight readline REPL, distinct from the full [interactive agent](#interactive-mode)):

```
FOTOhub Chat — claude-sonnet
Commands: /quit /clear /model /system /tokens /export

You > What is quantum computing?
AI  Quantum computing leverages quantum mechanics...

You > How does it compare to classical computing?
AI  Classical computers use bits (0 or 1), while quantum...
```

### Chat Session Commands

| Command | Description |
|---------|-------------|
| `/quit` | Exit chat session |
| `/clear` | Reset conversation context |
| `/model <id>` | Switch model mid-conversation (e.g. `/model gpt-4o`) |
| `/system <prompt>` | Set the system prompt |
| `/tokens` | Show approximate token count |
| `/export` | Print the conversation as JSON |

---

## Models

### List All Models

```bash
# List all available models
fotohub models list

# Filter by category
fotohub models list --category image
fotohub models list --category video
fotohub models list --category chat
fotohub models list --category audio

# Filter by provider
fotohub models list --provider google
fotohub models list --provider anthropic
```

### Example Output

```
52 models available

Model ID              Provider    Category  Cost   Status
seedream-5-0-260128   bytedance   image     2 cr   active
veo-3.1-generate-001  google      video     12 cr  active
claude-sonnet         anthropic   chat      2 cr   active
minimax               minimax     audio     3 cr   active
...
```

> The header shows the exact number of models returned, and the `Cost` column is a flat credit figure (`N cr`) — per-second video pricing is applied at billing time, not shown in this table.

### Model Details

```bash
fotohub models info seedream-5-0-260128
```

---

## Cloud Storage

The CLI provides S3-compatible cloud storage management.

### List Buckets

```bash
fotohub storage list
```

```
2 bucket(s)

Name         Region        Size    Created       Status
my-renders   eu-central-1  1.2 GB  2026-06-14    active
project-xyz  eu-central-1  340 MB  2026-07-02    active
```

### Create a Bucket

```bash
fotohub storage create my-renders --region eu-central-1 --size 50
```

### List Objects

```bash
fotohub storage ls my-renders --prefix videos/
```

### Upload a File

```bash
# Upload with auto-detected content type
fotohub storage upload ./render.mp4 -b my-renders

# Custom object key
fotohub storage upload ./photo.jpg -b my-renders --key assets/hero.jpg

# Explicit content type
fotohub storage upload ./data.json -b my-renders --content-type application/json
```

### Download a File

```bash
fotohub storage download videos/output.mp4 -b my-renders -o local-copy.mp4
```

---

## Billing & Usage

### Check Balance

```bash
fotohub billing balance
```

```
FOTOhub Billing

  Plan:       Developer
  Credits:    420 / 500 remaining (84%)
  Used:       80 credits this period
  Wallet:     15.00 PLN
  Resets:     2026-08-01
  Overage:    50 PLN limit
```

### Usage Breakdown

```bash
fotohub billing usage --period month
```

### Transaction History

```bash
fotohub billing history --limit 50
```

---

## API Key Management

### List Keys

```bash
fotohub auth keys list
```

```
Name            Key             Created     Last Used   Scopes
--------------  --------------  ----------  ----------  ---------------
Production Key  fh_live_abc...  2026-06-01  2026-07-24  All
Image Worker    fh_live_def...  2026-07-10  Never       images, storage
```

### Create a New Key

```bash
fotohub auth keys create --name "Production Server Key"

# Optionally scope the key (comma-separated)
fotohub auth keys create --name "Image Worker" --scopes images,storage
```

```
API key created successfully!

Key:  fh_live_new_key_here_full_value
ID:   key_9f2c1a8e

Save this key now — it will not be shown again.
```

Available scopes: `images`, `video`, `chat`, `audio`, `storage`, `compute`, `billing`, `keys`.

---

## Workflows

Execute DAG-based automation workflows from the terminal.

### List Workflows

```bash
fotohub workflow list
```

### Run a Workflow

```bash
fotohub workflow run abc123def --input '{"prompt": "generate 5 product images"}'
```

### Check Execution Status

```bash
fotohub workflow status exec_456
```

---

## System Status

Check platform health from the terminal:

```bash
fotohub status
```

```
FOTOhub System Status  operational

  API Version: 3.2.1
  Uptime:      99.98%

  Services:

    OK  Image Generation (82ms)
    OK  Video Generation (140ms)
    OK  Chat / LLM (61ms)
    OK  Storage (48ms)
```

The service list is returned by the API, so it reflects whatever FOTOhub is currently monitoring.

---

## Configuration

### Config File Location

Non-secret preferences are stored in `~/.fotohub/config.json` with restricted permissions (0600). Your API key is **not** kept here — it lives in the OS keychain or the encrypted fallback file (see [Credential Storage](#credential-storage)).

```json
{
  "defaultModel": "seedream-5-0-260128",
  "baseUrl": "https://apis.fotohub.app"
}
```

### View Configuration

```bash
fotohub config list
```

### Set Defaults

```bash
# Set default image model
fotohub config set defaultModel seedream-5-0-260128

# Set custom API endpoint (self-hosted, staging, etc.)
fotohub config set baseUrl https://apis.staging.fotohub.app
```

### Get a Specific Value

```bash
fotohub config get defaultModel
```

### Available Config Keys

| Key | Description | Default |
|-----|-------------|---------|
| `defaultModel` | Default model for image generation | `seedream-5-0-260128` |
| `baseUrl` | API base URL | `https://apis.fotohub.app` |

> For machine-readable output, pass `--json` to any command (see [JSON Output](#json-output-scripting)) rather than setting a persistent format.

---

## Credential Storage

Your API key is stored **securely**, never as plaintext in a config file. The CLI resolves a storage backend automatically:

1. **OS keychain (preferred).** On macOS the key goes into the login Keychain, on Windows into Credential Manager, and on Linux into the Secret Service (libsecret / GNOME Keyring / KWallet). You can inspect it with your platform's native tools, e.g. on macOS:

   ```bash
   security find-generic-password -s fotohub-cli
   ```

2. **Encrypted file fallback.** When no keychain is available — common on headless Linux servers and inside containers — the key is written to `~/.fotohub/creds.enc` (permissions `0600`) using **AES-256-GCM**. The encryption key is derived with scrypt from a machine-bound random salt (`~/.fotohub/creds.salt`, `0600`).

   For stronger protection, set a passphrase — the key is then derived from it instead of the salt file alone:

   ```bash
   export FOTOHUB_CRED_PASSPHRASE="your-strong-passphrase"
   ```

   > **Honest limitation:** without a passphrase, the encrypted file is obfuscation-at-rest bound to the salt file on the same machine. It protects against casual disk/backup leakage, **not** a determined local attacker who can read both files. For high-security environments, use a passphrase or prefer the OS keychain.

Bearer tokens for [MCP servers](#mcp-servers) use the same secure storage and are never written to `mcp.json`.

Legacy installs that kept a plaintext `apiKey` in `~/.fotohub/config.json` are migrated automatically on first use: the key is moved into secure storage and stripped from the file (your non-secret preferences are preserved).

---

## JSON Output (Scripting)

All commands support `--json` for machine-readable output, making it easy to integrate with scripts and pipelines:

```bash
# Get image URLs as JSON
fotohub gen image "a cat" --json | jq '.images[0].url'

# List models and filter
fotohub models list --json | jq '.[] | select(.category == "image") | .id'

# Check balance programmatically
CREDITS=$(fotohub billing balance --json | jq '.credits_remaining')
echo "Remaining: $CREDITS"

# Generate and immediately open
URL=$(fotohub gen image "sunset" --json | jq -r '.images[0].url')
curl -o image.png "$URL" && open image.png
```

---

## Batch Operations

### Generate Multiple Images in a Loop

```bash
#!/bin/bash
PROMPTS=("sunset over ocean" "mountain landscape" "city at night" "forest path")

for prompt in "${PROMPTS[@]}"; do
  echo "Generating: $prompt"
  fotohub gen image "$prompt" \
    --model seedream-5-0-260128 \
    --output "$(echo $prompt | tr ' ' '-').png" \
    --json >> results.json
done
```

### Batch Processing with Python SDK

```python
from fotohub import FotoHub

client = FotoHub()  # Uses FOTOHUB_API_KEY env var

prompts = [
    "product photo of wireless earbuds on white background",
    "product photo of smart watch on marble surface",
    "product photo of laptop in a modern office",
]

for prompt in prompts:
    result = client.generate_image(
        prompt=prompt,
        model="seedream-5-0-260128",
        num_images=2,
    )
    for img in result["images"]:
        print(f"Generated: {img['url']}")
```

### Parallel Generation with xargs

```bash
cat prompts.txt | xargs -P 4 -I {} fotohub gen image "{}" --json >> outputs.jsonl
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `FOTOHUB_API_KEY` | API key (alternative to `fotohub auth login`) |
| `FOTOHUB_BASE_URL` | Custom API base URL (default: `https://apis.fotohub.app`) |
| `FOTOHUB_CRED_PASSPHRASE` | Passphrase for the encrypted credential fallback (see [Credential Storage](#credential-storage)) |
| `NO_COLOR` | Disable colored output ([no-color.org](https://no-color.org)) |

---

## Global Options

These flags work with any command:

| Flag | Description |
|------|-------------|
| `--api-key <key>` | Override stored API key for this invocation |
| `--json` | Output raw JSON (machine-readable) |
| `--no-color` | Disable ANSI colors |
| `--base-url <url>` | Custom API endpoint |
| `--verbose` | Show debug information (request/response details) |
| `-v, --version` | Show CLI version |

---

## Shell Completions

### Bash

Add to your `~/.bashrc`:

```bash
eval "$(fotohub --completion bash)"
```

### Zsh

Add to your `~/.zshrc`:

```bash
eval "$(fotohub --completion zsh)"
```

### Fish

```bash
fotohub --completion fish | source
```

After adding completions, restart your shell or run `source ~/.bashrc` (or equivalent).

You can also use the `completion` subcommand (equivalent to the `--completion` flag), which auto-detects your shell from `$SHELL` when the argument is omitted:

```bash
fotohub completion bash
fotohub completion        # auto-detect from $SHELL
```

---

## MCP Servers

The CLI is a full [Model Context Protocol](https://modelcontextprotocol.io) client. It can connect to external MCP servers and make their tools available to the [interactive agent](#interactive-mode), connect to FOTOhub's own MCP server in one command, and expose itself as an MCP server for other clients (Claude Desktop, Cursor).

### Connect to the FOTOhub MCP Server

```bash
fotohub mcp connect
```

Registers FOTOhub's hosted MCP server using your existing API key and discovers its tools. Once connected, the interactive agent can call them directly.

### Add an External MCP Server

```bash
# Remote server over Streamable HTTP
fotohub mcp add search --url https://mcp.example.com/

# With a bearer token (stored securely — never written to mcp.json)
fotohub mcp add search --url https://mcp.example.com/ --token "$MY_TOKEN"

# Local server over stdio (spawns a command)
fotohub mcp add local-fs \
  --command npx \
  --args "-y @modelcontextprotocol/server-filesystem /tmp"
```

> **Security:** adding a `--command` server lets the CLI spawn a local process, so it prompts for confirmation. Pass `-y`/`--yes` to skip the prompt in non-interactive use. Remote URLs are validated against SSRF (private/loopback/link-local addresses are rejected).

### Manage Servers

```bash
fotohub mcp list                # List registered servers
fotohub mcp tools <name>        # List tools discovered on a server
fotohub mcp remove <name>       # Remove a registered server
```

### Expose the CLI as an MCP Server

Run the CLI as a local stdio MCP server so tools like Claude Desktop or Cursor can call FOTOhub actions (image, storage, models, billing) directly:

```bash
fotohub mcp serve
```

Example Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "fotohub": {
      "command": "fotohub",
      "args": ["mcp", "serve"]
    }
  }
}
```

Server registrations are stored in `~/.fotohub/mcp.json` (0600). Any bearer tokens are kept in secure credential storage, never in that file.

### MCP Command Reference

| Command | Description |
|---------|-------------|
| `fotohub mcp connect` | One-command connect to the FOTOhub MCP server |
| `fotohub mcp add <name>` | Register a server (`--url` or `--command`) |
| `fotohub mcp list` | List registered servers |
| `fotohub mcp tools <name>` | List tools on a registered server |
| `fotohub mcp remove <name>` | Remove a registered server |
| `fotohub mcp serve` | Expose this CLI as a local stdio MCP server |

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Generate Assets
on:
  push:
    branches: [main]

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm install -g fotohubapp-cli

      - name: Generate hero image
        env:
          FOTOHUB_API_KEY: ${{ secrets.FOTOHUB_API_KEY }}
        run: |
          fotohub gen image "modern SaaS dashboard hero" \
            --model seedream-5-0-260128 \
            --width 1920 --height 1080 \
            --output assets/hero.png
```

### Docker

```dockerfile
FROM node:20-alpine
RUN npm install -g fotohubapp-cli
ENV FOTOHUB_API_KEY=${FOTOHUB_API_KEY}
ENTRYPOINT ["fotohub"]
```

---

## Troubleshooting

### "No API key found"

Run `fotohub auth login` or set the `FOTOHUB_API_KEY` environment variable.

### "Permission denied" on global install

Use `sudo npm install -g fotohubapp-cli` or configure npm prefix:

```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g fotohubapp-cli
```

### Slow video/music generation

3D jobs are polled until completion. Asynchronous video models instead return a job ID right away — the finished file lands in your FOTOhub library, since there is no per-job status endpoint yet.

### Rate limit errors (429)

Your plan has a per-minute request limit. The CLI automatically retries with exponential backoff. Check which plan you are on:

```bash
fotohub billing balance
```

### Insufficient credits (402)

Check your balance and consider upgrading or purchasing a top-up:

```bash
fotohub billing balance
```

### Connection timeout

If you are behind a proxy or firewall:

```bash
# Set custom endpoint
fotohub --base-url https://apis.fotohub.app gen image "test"

# Or permanently
fotohub config set baseUrl https://apis.fotohub.app
```

### Debug mode

Add `--verbose` to any command to see full request/response details:

```bash
fotohub gen image "test" --verbose
```

---

## Command Reference (Quick)

```
fotohub                           Launch interactive agent
fotohub auth login                Authenticate (browser OAuth)
fotohub auth login --manual       Authenticate (paste key)
fotohub auth logout               Clear credentials
fotohub auth whoami               Show account info
fotohub auth keys list            List API keys
fotohub auth keys create -n NAME  Create new API key

fotohub generate image <prompt>   Generate image
fotohub generate video <prompt>   Generate video
fotohub generate 3d --file <img>  Generate a 3D model
fotohub generate music <prompt>   Generate music
fotohub generate speech <text>    Text-to-speech (alias: tts)

fotohub chat                      Interactive chat session
fotohub chat send <message>       One-shot chat message

fotohub models list               List all models
fotohub models info <id>          Model details

fotohub storage list              List buckets
fotohub storage create <name>     Create bucket
fotohub storage ls <bucket>       List objects
fotohub storage upload <file>     Upload file
fotohub storage download <key>    Download file

fotohub billing balance           Show credit balance
fotohub billing usage            Usage breakdown
fotohub billing history          Transaction history

fotohub workflow list            List workflows
fotohub workflow run <id>        Execute workflow
fotohub workflow status <id>     Check execution status

fotohub config list              Show configuration
fotohub config set <key> <val>   Set config value
fotohub config get <key>         Get config value

fotohub mcp connect              Connect to the FOTOhub MCP server
fotohub mcp add <name>           Register an MCP server (--url or --command)
fotohub mcp list                 List registered MCP servers
fotohub mcp tools <name>         List a server's tools
fotohub mcp remove <name>        Remove a registered server
fotohub mcp serve                Expose this CLI as an MCP server

fotohub completion [shell]       Print a shell-completion script
fotohub status                   Platform health check
```

---

## Related

- [API Reference](/api/getting-started)
- [SDK Installation](/guides/sdk-setup)
- [Image Generation Guide](/guides/image-generation)
- [Chat & Streaming Guide](/guides/chat-streaming)
- [npm package](https://www.npmjs.com/package/fotohubapp-cli)
- [GitHub source](https://github.com/fotohubapp/cli)
