# Guide: CLI Setup & Usage

Install and use the FOTOhub CLI to generate AI content, chat with LLMs, manage storage, and automate workflows — all from your terminal.

## Installation

### Node.js CLI (recommended)

```bash
npm install -g fotohubapp-cli
```

Requires **Node.js 18+**. After installation, the `fotohub` command is available globally.

```bash
fotohub --version
# 2.1.2
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

This opens your browser for secure OAuth authentication. Your API key is validated and stored in `~/.fotohub/config.json` with 0600 permissions.

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
3. `~/.fotohub/config.json` stored key

### Verify Authentication

```bash
fotohub auth whoami
# Email:   you@example.com
# Plan:    Developer
# Credits: 420/500 (4h window)
# Wallet:  15.00 PLN
```

### Logout

```bash
fotohub auth logout
```

---

## Interactive Mode

Running `fotohub` with no arguments launches the interactive REPL:

```bash
fotohub
```

```
  ╭──────────────────────────────────────╮
  │  FOTOhub AI Platform v2.1.2          │
  │  30+ models • 12 providers           │
  ╰──────────────────────────────────────╯

  Authenticated as you@example.com (Developer plan)

  fotohub > /help
```

### Interactive Commands

| Command | Description |
|---------|-------------|
| `/login` | Authenticate via browser |
| `/logout` | Clear stored credentials |
| `/whoami` | Show account info |
| `/generate image <prompt>` | Generate an image |
| `/generate video <prompt>` | Generate a video |
| `/generate music <prompt>` | Generate music |
| `/chat` | Toggle persistent chat mode |
| `/endchat` | Exit chat mode and clear context |
| `/model <id>` | Switch LLM model |
| `/models [category]` | List available models |
| `/system <prompt>` | Set system prompt |
| `/clear` | Clear chat context |
| `/multiline` | Enter multiline input mode |
| `/file <path> [prompt]` | Attach file to chat context |
| `/code <question>` | Ask with code-assistant system prompt |
| `/upscale <url> [scale]` | Upscale an image (2x or 4x) |
| `/img2video <url> [prompt]` | Convert image to video |
| `/voice <text> [--lang en]` | Text-to-speech |
| `/storage list` | List storage buckets |
| `/billing` | Show credit balance |
| `/workflow list` | List workflows |
| `/status` | Check system health |
| `/config list` | Show configuration |
| `/keys list` | Show API key info |
| `/history` | Show chat message history |
| `/export` | Export chat to JSON file |
| `/tokens` | Show session stats (messages, tokens, duration) |
| `/help` | Show all commands |
| `/quit` | Exit |

### Chat Mode

In interactive mode, any text that is not a slash command is sent as a chat message to the current model:

```
fotohub > What is quantum computing?

  AI Quantum computing leverages quantum mechanical phenomena such as
  superposition and entanglement to process information in fundamentally
  different ways than classical computers...

fotohub > /model deepseek-r1
  Model set to deepseek-r1

fotohub > Explain the same in simpler terms

  AI Think of regular computers as working with light switches...
```

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
  --model veo-3 \
  --duration 10

# Image-to-video (animate a photo)
fotohub gen video "camera slowly zooms in, subtle movement" \
  --image https://example.com/photo.jpg \
  --model kling-2.0 \
  --duration 5

# Save output locally
fotohub gen video "waves crashing on a rocky shore" \
  --output waves.mp4
```

### Video Options

| Flag | Description | Default |
|------|-------------|---------|
| `-m, --model <id>` | Model ID (veo-3, kling-2.0, wan-2.1) | `veo-3` |
| `-d, --duration <seconds>` | Duration in seconds | 5 |
| `--aspect-ratio <ratio>` | Aspect ratio (16:9, 9:16, 1:1) | 16:9 |
| `--image <url>` | Input image for image-to-video | -- |
| `-o, --output <path>` | Save video to local file | -- |
| `--wait` | Wait for completion (default: true) | true |

The CLI automatically polls the video generation job until completion (up to 6 minutes) and displays the final URL. For long jobs, use `--no-wait` to get the job ID immediately.

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
| `-m, --model <id>` | Model ID | `minimax-music` |
| `-d, --duration <seconds>` | Duration in seconds (5-180) | 30 |
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
  --model claude-sonnet-4-20250514 \
  --system "You are a senior security engineer" \
  --temperature 0.3

# Non-streaming (full response at once)
fotohub chat send "Generate 5 product names for a coffee brand" --no-stream
```

### Chat Send Options

| Flag | Description | Default |
|------|-------------|---------|
| `-m, --model <id>` | Model ID | `claude-sonnet-4-20250514` |
| `-s, --system <prompt>` | System prompt | -- |
| `-t, --temperature <temp>` | Temperature (0-2) | 1 |
| `--no-stream` | Disable streaming | -- |

### Interactive Chat Mode

```bash
fotohub chat
```

Launches a dedicated chat session with persistent context:

```
FOTOhub Chat (claude-sonnet-4-20250514)
Type /quit to exit, /clear to reset, /model <id> to switch

You: What is quantum computing?
AI: Quantum computing leverages quantum mechanics...

You: How does it compare to classical computing?
AI: Classical computers use bits (0 or 1), while quantum...
```

### Chat Session Commands

| Command | Description |
|---------|-------------|
| `/quit` | Exit chat session |
| `/clear` | Reset conversation context |
| `/model deepseek-r1` | Switch model mid-conversation |
| `/system You are a Python expert` | Set system prompt |

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
80 models available

Model ID                  Provider    Category  Cost    Status
seedream-5-0-260128       google      image     2 cr    active
veo-3                     google      video     10 cr   active
claude-sonnet-4-20250514  anthropic   chat      1 cr    active
minimax-music             minimax     audio     5 cr    active
...
```

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
Name          Region          Size
my-renders    eu-central-1    1.2 GB
project-xyz   eu-central-1    340 MB
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
API Keys
  Active key: fh_live_abc1...xyz9
  Plan:       Developer
  Rate limit: 120 req/min

  Manage keys: https://fotohub.app/console/keys
```

### Create a New Key

```bash
fotohub auth keys create "Production Server Key"
```

```
Created! Key: fh_live_new_key_here_full_value
Save this key -- it won't be shown again.
```

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
System Status: operational
  ● Image Generation
  ● Video Generation
  ● Music Generation
  ● Chat / LLM
  ● Storage
  ● Billing
```

---

## Configuration

### Config File Location

Credentials and settings are stored in `~/.fotohub/config.json` with restricted permissions (0600):

```json
{
  "apiKey": "fh_live_...",
  "defaultModel": "seedream-5-0-260128",
  "outputFormat": "text",
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

# Set default output format
fotohub config set outputFormat json

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
| `apiKey` | Stored API key | -- |
| `defaultModel` | Default model for image generation | `seedream-5-0-260128` |
| `outputFormat` | Default output format (`text` or `json`) | `text` |
| `baseUrl` | API base URL | `https://apis.fotohub.app` |

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

Video and music are async jobs. The CLI polls until completion (up to 6 minutes for video). Use `--no-wait` to get the job ID immediately and check status later.

### Rate limit errors (429)

Your plan has a per-minute request limit. The CLI automatically retries with exponential backoff. Check your limits:

```bash
fotohub auth keys list
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
fotohub                          Launch interactive mode
fotohub auth login               Authenticate (browser OAuth)
fotohub auth login --manual      Authenticate (paste key)
fotohub auth logout              Clear credentials
fotohub auth whoami              Show account info
fotohub auth keys list           List API keys
fotohub auth keys create [name]  Create new API key

fotohub generate image <prompt>  Generate image
fotohub generate video <prompt>  Generate video
fotohub generate music <prompt>  Generate music
fotohub generate speech <text>   Text-to-speech (alias: tts)

fotohub chat                     Interactive chat session
fotohub chat send <message>      One-shot chat message

fotohub models list              List all models
fotohub models info <id>         Model details

fotohub storage list             List buckets
fotohub storage create <name>    Create bucket
fotohub storage ls <bucket>      List objects
fotohub storage upload <file>    Upload file
fotohub storage download <key>   Download file

fotohub billing balance          Show credit balance
fotohub billing usage            Usage breakdown
fotohub billing history          Transaction history

fotohub workflow list            List workflows
fotohub workflow run <id>        Execute workflow
fotohub workflow status <id>     Check execution status

fotohub config list              Show configuration
fotohub config set <key> <val>   Set config value
fotohub config get <key>         Get config value

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
