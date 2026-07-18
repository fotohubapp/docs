# Guide: CLI Setup & Usage

Install and use the FOTOhub CLI to generate AI content, chat with LLMs, manage storage, and automate workflows — all from your terminal.

## Installation

```bash
npm install -g fotohubapp-cli
```

Requires **Node.js 18+**. After installation, the `fotohub` command is available globally.

Verify:
```bash
fotohub --version
# 1.0.0
```

---

## Authentication

Get your API key from [fotohub.app/settings/api](https://fotohub.app/settings/api), then:

```bash
fotohub auth login
# Enter your API key: fh_live_...
# ✓ API key validated successfully.
```

Alternatively, set the `FOTOHUB_API_KEY` environment variable:

```bash
export FOTOHUB_API_KEY=fh_live_your_key_here
```

Check your account:
```bash
fotohub auth whoami
```

---

## Generate Images

```bash
# Basic generation
fotohub generate image "a futuristic city at sunset"

# With options
fotohub gen image "portrait of a cat" \
  --model seedream-5-0-260128 \
  --width 1024 --height 1024 \
  --num 4 \
  --output cat.png
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--model` | Model ID | `seedream-5-0-260128` |
| `--width` | Width in pixels | 1024 |
| `--height` | Height in pixels | 1024 |
| `--num` | Number of images | 1 |
| `--aspect-ratio` | Aspect ratio (16:9, 1:1, 9:16) | — |
| `--negative-prompt` | What to avoid | — |
| `--seed` | Reproducibility seed | random |
| `--output` | Save to file | — |

---

## Generate Video

```bash
# Text-to-video
fotohub gen video "a drone shot over mountains" --model veo-3 --duration 10

# Image-to-video
fotohub gen video "camera slowly zooms in" \
  --image https://example.com/photo.jpg \
  --model kling-2.0 \
  --duration 5
```

The CLI automatically waits for the video to complete and displays the URL.

---

## Generate Music

```bash
fotohub gen music "upbeat electronic track with synths" \
  --duration 60 \
  --output track.mp3

# Instrumental only
fotohub gen music "ambient piano" --instrumental --duration 120
```

---

## Chat with LLMs

### Interactive Mode (Streaming)

```bash
fotohub chat
# FOTOhub Chat (claude-sonnet-4-20250514)
# Type /quit to exit, /clear to reset, /model <id> to switch
#
# You: What is quantum computing?
# AI: Quantum computing leverages quantum mechanics...
```

**In-chat commands:**
- `/quit` — Exit
- `/clear` — Reset conversation
- `/model deepseek-r1` — Switch model
- `/system You are a Python expert` — Set system prompt

### One-shot Mode

```bash
# Get a quick answer
fotohub chat send "Explain REST APIs in 3 sentences"

# With a specific model and system prompt
fotohub chat send "Review this code" \
  --model claude-sonnet-4-20250514 \
  --system "You are a senior code reviewer"
```

### Available Models

30+ models from 12 providers:

```bash
fotohub models list --category chat
```

Popular choices: `claude-sonnet-4-20250514`, `gpt-5.1`, `grok-4-fast-reasoning`, `deepseek-r1`, `qwen-flash`

---

## Cloud Storage

```bash
# List buckets
fotohub storage list

# Create a bucket
fotohub storage create my-renders --region eu-central-1 --size 50

# Upload a file
fotohub storage upload ./render.mp4 -b my-renders

# List objects
fotohub storage ls my-renders --prefix videos/

# Download
fotohub storage download videos/output.mp4 -b my-renders -o local.mp4
```

---

## Billing & Usage

```bash
# Check balance
fotohub billing balance
# Plan:     Developer
# Credits:  420 / 500 remaining (84%)
# Wallet:   15.00 PLN

# Usage breakdown
fotohub billing usage --period month

# Transaction history
fotohub billing history --limit 50
```

---

## Workflows

Execute DAG-based automation workflows:

```bash
# List workflows
fotohub workflow list

# Run a workflow
fotohub workflow run abc123def --input '{"prompt": "generate 5 images"}'

# Check execution status
fotohub workflow status exec_456
```

---

## Configuration

Credentials are stored in `~/.fotohub/config.json` (file permissions: 0600).

```bash
# View all config
fotohub config list

# Set default model
fotohub config set defaultModel seedream-5-0-260128

# Set output format
fotohub config set outputFormat json
```

**Auth priority:** `--api-key` flag > `FOTOHUB_API_KEY` env > config file.

---

## JSON Output (Scripting)

All commands support `--json` for machine-readable output:

```bash
# Get image URLs as JSON
fotohub gen image "a cat" --json | jq '.images[0].url'

# List models and filter
fotohub models list --json | jq '.[] | select(.category == "image") | .id'

# Check balance programmatically
CREDITS=$(fotohub billing balance --json | jq '.credits_remaining')
```

---

## Global Options

| Flag | Description |
|------|-------------|
| `--api-key <key>` | Override stored API key |
| `--json` | Raw JSON output |
| `--no-color` | Disable ANSI colors |
| `--base-url <url>` | Custom API endpoint |
| `--verbose` | Debug info |
| `-v, --version` | Show version |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `FOTOHUB_API_KEY` | API key (alternative to `fotohub auth login`) |
| `FOTOHUB_BASE_URL` | Custom API base URL |
| `NO_COLOR` | Disable colors ([no-color.org](https://no-color.org)) |

---

## Troubleshooting

**"No API key found"** — Run `fotohub auth login` or set `FOTOHUB_API_KEY`.

**"Permission denied" on global install** — Use `sudo npm install -g fotohubapp-cli` or configure npm prefix.

**Slow video/music generation** — These are async jobs; the CLI polls until complete. Use `--no-wait` to get the job ID immediately.

---

## Related

- [API Reference](/api/getting-started)
- [SDK Installation](/guides/sdk-setup)
- [Image Generation Guide](/guides/image-generation)
- [Chat & Streaming Guide](/guides/chat-streaming)
- [npm package](https://www.npmjs.com/package/fotohubapp-cli)
- [GitHub source](https://github.com/fotohubapp/cli)
