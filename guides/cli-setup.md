# Guide: CLI Setup & Usage

Install and use the FOTOhub CLI to generate and edit images, post-produce video, run Shorts/Story/UGC pipelines, chat with LLMs, manage storage and webhooks, and check live USD pricing before you spend — all from your terminal.

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

Requires **Python 3.9+**. Provides programmatic access to the same operations via the `FotoHub` class. See [SDK Setup](/guides/sdk-setup) for details.

---

## What it costs

The API bills a **prepaid USD wallet**, not credits — every operation has a price you can look up before you spend anything.

```bash
fotohub pricing                         # every priced model, grouped (267 as of writing)
fotohub pricing --category image        # image | video | audio | chat | 3d | tools | other
fotohub pricing --search seedream       # substring match on the model id
fotohub pricing gpt-image-2.5-flare     # every leg, resolution tier, and note for one model
```

`fotohub pricing` reads the public `GET /v1/pricing` endpoint — the same table the wallet is charged against — and needs **no API key**.

Every `gen` command — `image`, `video`, `3d`, `music`, and `speech` — takes `--estimate`, which quotes the price and exits without generating or charging anything:

```bash
fotohub gen image "x" -m gpt-image-1 --size 4K -n 2 --estimate
```
```
Estimated cost · nothing has been generated or charged

  Model: gpt-image-1
  output: $0.167 per image → $0.334 (4K tier)

  Total: $0.334
```

`gen 3d --estimate` prices a request-priced leg (no duration or size to plug in), keyed as `3d_<model>`:

```bash
fotohub gen 3d --estimate                    # fh-lite-3d → $0.160772 per request
fotohub gen 3d --mode text-to-3d --model fh-text-3d --estimate   # $0.267953 per request
```

`gen speech --estimate` prices per 1000 characters, using the actual length of the text (or `--file`) you pass:

```bash
fotohub gen speech "Welcome to FOTOhub, the AI creative platform." --estimate
#   output: $0.015 per 1K characters → $0.000675 (google)
```

Only three speech engines have a published price row — `google` (`tts-google`), `elevenlabs` (`tts-elevenlabs`), and `grok` (`grok-tts`). For the others (`mars-pro`, `mars-flash`, `chatterbox-tts`, `ida-voice`, `ida-voice-pro`) the command deliberately refuses to guess:

```
Error: No published price for the 'mars-pro' engine — it has no row in /v1/pricing.
Engines with a published rate: google, elevenlabs, grok.
```

That refusal is intentional — not a bug — since those engines currently have no priced leg to quote from.

After a real, billable call, the command prints what it just cost and what is left in the wallet:

```
  $0.0315 · wallet $6.76 left · 1K tier
```

Prices under a dollar are shown to several significant digits on purpose — a Seedream image costs $0.0315, and rounding that to "$0.03" understates the bill by 10%.

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
```
```
FOTOhub Account
Email:    you@example.com
Plan:     Developer
Wallet:   $6.76
Key:      fh_live_abcd...xyz9
```

### Logout

```bash
fotohub auth logout
```

### API Key Management

```bash
fotohub auth keys list
fotohub auth keys create --name "Production Server Key" [--scopes images,storage] [--expires-in-days 90] [--rate-limit 120]
fotohub auth keys update <key-id> [--name ...] [--description ...] [--scopes ...] [--rate-limit <n>]
fotohub auth keys rotate <key-id>          # issues a new secret, revokes the old one
fotohub auth keys delete <key-id> --yes    # -y is required for non-interactive use
```

Available scopes: `images`, `video`, `chat`, `audio`, `storage`, `compute`, `billing`, `keys`. Rate limit is capped at 600 requests/minute.

---

## Interactive Mode

Running `fotohub` with no arguments (in a terminal, without `--json`) launches the interactive agent — a full-screen chat interface where the model can call FOTOhub tools (image, video, music, speech, 3D, storage, billing) and any connected [MCP servers](#mcp-servers) on your behalf:

```bash
fotohub
```

Type your request in natural language and the agent decides which tools to run — e.g. *"generate a watercolor cat and tell me my wallet balance"* will call `generate_image` and `billing_balance`, showing each tool call inline as it runs.

Anything that is not a slash command is sent to the model as a message.

### Approval before spending

Image, video, music, speech and 3D generation spend the wallet, so the agent asks before running them:

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
| `/model` | Switch the chat model |
| `/models` | List image & video generation models |
| `/mode [plan\|auto\|yolo]` | Show or set the approval policy |
| `/tools` | Show every tool the agent can call |
| `/mcp` | View connected MCP servers & their tools |
| `/usage` | Requests, tokens and spend this month |
| `/status` | Platform health per service |
| `/whoami` | Show account, plan, wallet |
| `/system <prompt>` | Set a system prompt |
| `/copy` | Print the last reply on its own, for copying |
| `/export [file\|md]` | Write the conversation to a file (json or markdown) |
| `/resume` | List saved sessions |
| `/clear` | Reset the conversation |
| `/login` / `/logout` | Authenticate / clear credentials |
| `/quit` | Exit |

### Appearance

Colours follow your terminal. `NO_COLOR` (or a non-TTY, or `TERM=dumb`) disables them entirely and switches to ASCII glyphs; a light background is detected automatically. Force a specific palette with `FOTOHUB_THEME=dark|light|high-contrast|mono`.

---

## Headless Mode (scripting)

Run a single agent turn non-interactively — for scripts, CI, or piping into other tools:

```bash
# Plain text on stdout
fotohub -p "list my image models"

# A JSON summary
fotohub -p "how much is left in my wallet?" --output-format json

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

---

## Generate

### Images

```bash
fotohub gen image "a futuristic city at sunset"
fotohub gen image "portrait of a cat in watercolor style" -m seedream-5-0-260128 -n 4 -o cat.png
```

| Flag | Description | Default |
|------|-------------|---------|
| `-m, --model <id>` | Model ID | `seedream-5-0-260128` |
| `-W, --width <px>` / `-H, --height <px>` | Pixel dimensions | 1024 / 1024 |
| `--size <tier>` | Resolution tier the price is quoted at: `1K`, `2K`, `4K` | derived from width/height |
| `-n, --num <count>` | Number of images | 1 |
| `--aspect-ratio <ratio>` | `1:1`, `16:9`, `9:16`, `4:3`, `3:4` | -- |
| `--style <style>` | Style hint passed to the model | -- |
| `--negative-prompt <text>` | What to avoid | -- |
| `--seed <number>` | Reproducibility seed | random |
| `-o, --output <path>` | Save to file — `-n 4 -o out.png` writes `out-1.png … out-4.png`, and this works under `--json` too | -- |
| `--estimate` | Quote the price and exit without generating | -- |
| `--list-models` | Print every supported model id and exit | -- |

There are **43 image models** across ByteDance, OpenAI, Google, Black Forest Labs, Stability AI, xAI, Microsoft, Luma AI, Alibaba and Zhipu — run `fotohub gen image --list-models` for the current list (it changes as models are added), or `fotohub pricing --category image` for the priced ones. An unknown `--model` id is caught locally, with a suggestion, before a request is sent.

```
Image generated

  #1 https://s3point.fotohub.app/generations/abc123/0.png
      seed: 42

  $0.0315 · wallet $6.76 left · 1K tier

  Links expire in about an hour — use -o <path> to keep a copy.
```

### Video

```bash
fotohub gen video "a drone shot flying over snow-capped mountains at golden hour" --duration 10
fotohub gen video "camera slowly zooms in" --image https://example.com/photo.jpg -m kling-v3
fotohub gen video --job <job-id>            # attach to a render already running
```

| Flag | Description | Default |
|------|-------------|---------|
| `-m, --model <id>` | Model ID | `veo-3.1-generate-001` |
| `-d, --duration <seconds>` | Duration | 5 |
| `--aspect-ratio <ratio>` | `16:9`, `9:16`, `1:1` | `16:9` |
| `--resolution <res>` | `720p`, `1080p`, `4k` | -- |
| `--image <url>` | Input image for image-to-video | -- |
| `-o, --output <path>` | Save the finished video | -- |
| `--job <id>` | Attach to an existing job instead of generating | -- |
| `--no-wait` | Submit and return the job id without waiting | -- |
| `--poll-interval <seconds>` | Seconds between status polls | 5 |
| `--timeout <seconds>` | Stop polling after this long | 900 |
| `--estimate` | Quote the price and exit without generating | -- |
| `--list-models` | Print every supported model id and exit | -- |

There are **49 video models** — Veo, Sora, Kling, Seedance, Wan, Hailuo, Grok Imagine and Gemini Omni Flash. Run `fotohub gen video --list-models` for the current list.

Video is asynchronous. By default the CLI submits the job and **polls it to completion**, printing progress as it goes. If a synchronous model answers immediately, the URL prints straight away. If `--timeout` is hit first, the command prints the job id rather than losing the render — pick it back up any time with:

```bash
fotohub gen video --job <job-id>
```

### 3D Models

```bash
fotohub gen 3d --file product-photo.png --output model.glb
fotohub gen 3d --mode text-to-3d --model fh-text-3d --prompt "a low-poly wooden chair" -o chair.glb
fotohub gen 3d --list-models
```

| Flag | Description | Default |
|------|-------------|---------|
| `--mode <mode>` | `image-to-3d` or `text-to-3d` | `image-to-3d` |
| `-m, --model <id>` | `fh-lite-3d` (image) or `fh-text-3d` (text) | `fh-lite-3d` |
| `-f, --file <path>` | Input image file (image-to-3d) | -- |
| `-p, --prompt <text>` | Text prompt, max 500 chars (text-to-3d) | -- |
| `--format <fmt>` | `glb`, `obj`, `stl`, `usdz` | `glb` |
| `--quality <q>` | `draft`, `standard`, `high`, `ultra` | `standard` |
| `-o, --output <path>` | Save the model | -- |
| `--refresh <file-id>` | Re-sign the link for an asset already generated (free) | -- |
| `--estimate` | Quote the price (keyed as `3d_<model>`) and exit without generating | -- |
| `--list-models` | List 3D models with live prices and availability | -- |

This endpoint is **synchronous** — the finished model comes back in the same response, so there is no job to poll. A third model, `fh-pro-3d`, exists in the catalogue but is currently switched off in production; `--list-models` marks it `unavailable` rather than pretending it doesn't exist.

### Music

```bash
fotohub gen music "upbeat electronic track with heavy synths and driving bass" -d 60 -o track.mp3
fotohub gen music "warm jazz café loop" -m elevenlabs --genre jazz --loop
```

| Flag | Description | Default |
|------|-------------|---------|
| `-m, --model <id>` | `minimax` or `elevenlabs` | `minimax` |
| `-d, --duration <seconds>` | 1–300 | 30 |
| `--genre <genre>` | **Required** for `elevenlabs`, optional for `minimax` | -- |
| `--mood <mood>` | Mood hint | -- |
| `--bpm <bpm>` | Target tempo | -- |
| `--loop` | Compose as a seamless loop | -- |
| `--instrumental` | No vocals | -- |
| `-o, --output <path>` | Save audio | -- |
| `--estimate` | Quote the price and exit without generating | -- |
| `--list-models` | Print supported models and exit | -- |

### Speech (TTS)

```bash
fotohub gen speech "Welcome to FOTOhub, the AI creative platform." -l en -o welcome.mp3
fotohub gen tts "Witamy w FOTOhub" -l pl
fotohub gen speech "Breaking news report" --voice-id news-anchor-1 -o news.mp3
```

| Flag | Description | Default |
|------|-------------|---------|
| `-m, --model <id>` | `google`, `ida-voice`, `ida-voice-pro`, `elevenlabs`, `mars-pro`, `mars-flash`, `chatterbox-tts`, `grok` | `google` |
| `--voice-id <id>` | Voice id for the chosen engine — **not** `--voice`, which the API does not read | -- |
| `-l, --language <lang>` | `en`, `pl`, `de` | `en` |
| `--speed <rate>` | Speaking rate, e.g. `0.8`, `1.2` | -- |
| `--pitch <semitones>` | Pitch shift | -- |
| `-f, --file <path>` | Read the text from a file instead of an argument | -- |
| `-o, --output <path>` | Save audio | -- |
| `--estimate` | Quote the price for the given text length and exit without generating | -- |
| `--list-models` | List supported engines and exit | -- |

Text caps at **3000 characters**. `ida-voice` and `chatterbox-tts` run on FOTOhub's own GPU3; `google` is an alias that currently maps to `mars-flash`, and `elevenlabs` is a legacy alias for `mars-pro`.

`--estimate` prices per 1000 characters of the text you actually passed (or `--file`). Only `google`, `elevenlabs` and `grok` have a published price row (`tts-google`, `tts-elevenlabs`, `grok-tts`); estimating any other engine (`mars-pro`, `mars-flash`, `chatterbox-tts`, `ida-voice`, `ida-voice-pro`) is refused with `No published price for the '<engine>' engine`, by design, rather than guessed.

---

## Edit and process images

A second command group, separate from `gen image`, for operating on an existing image (post-processing, not text-to-image):

```bash
fotohub image edit <image-url> "<prompt>" --mode inpaint|outpaint|bgswap|remove [--mask-url <url>]
fotohub image remove-bg <image-url> [--advanced --point 0.5,0.5 --feather 2 --smooth 0]
fotohub image replace-bg <image-url> <background> [--type color|gradient|image|auto]
fotohub image blur-bg <image-url> [--blur-radius 15]
fotohub image shadow <image-url> [--type natural|drop|contact] [--opacity 0.5]
fotohub image enhance <image-url> [--mode auto|portrait|landscape|product|food]
fotohub image denoise <image-url> [--strength 0.5] [--no-preserve-detail]
fotohub image colorize <image-url> [--style natural|vivid|vintage|artistic]
fotohub image restore-face <image-url> [--model codeformer|gfpgan] [--fidelity 0.7] [--upscale 1-4]
fotohub image depth <image-url> [--model midas|zoedepth] [--output-type grayscale|colored|raw]
fotohub image color-grade <image-url> [--preset cinematic|warm|cool|vintage|noir|teal-orange|pastel]
```

Every one of these takes an `-o, --output <path>` and, except `edit`, an `--output-format` (`png`/`jpeg`/`webp`, defaults vary by command). Notes worth knowing before you script against them:

- `image edit` always runs the same provider (Imagen 3 Capability) — there is no `--model` flag because the API accepts one but ignores it.
- `image replace-bg` does not support AI-generated (prompt) backgrounds yet; pass a hex color, a CSS gradient, or an image URL.
- Inputs are URLs. Upload a local file first with `fotohub storage upload`, then pass the returned URL.

Docs: [/api/image-editing](/api/image-editing)

---

## Post-produce video

A separate command group from `gen video` — for transforming footage you already have, rather than generating new footage:

```bash
fotohub video upscale <video-url> --scale 2|3|4
fotohub video lip-sync <video-url> <audio-url> [-m musetalk|latentsync|facefusion] [--duration 5]
fotohub video transcode <video-url> [--format mp4|webm|mov|gif|prores] [--codec h264|h265|vp9|prores] [--resolution 480p..4K]
fotohub video merge <video-url-1> <video-url-2> ... [--transition none|dissolve|fade|crossfade|wipeleft|wiperight|slidedown|slideup]
fotohub video speed <video-url> <0.1-10.0> [--interpolation none|blend|mci]
fotohub video stabilize <video-url> [--preset smooth|very_smooth|cinematic|action]
fotohub video subtitles <video-url> --srt-file captions.srt [--position top|bottom|center]
fotohub video effects <video-url> [--preset vintage|noir|warm|cool|cinematic|hdr] [--brightness -1..1] [--contrast 0..3] ...
fotohub video watermark <video-url> [--text "FOTOhub"] [--position bottom_right] [--opacity 0.3]
```

Each takes `-o, --output <path>`. A few behaviours that are easy to assume wrong:

- `video subtitles` does **not** transcribe speech — it burns in an SRT you already have, via `--srt` (inline) or `--srt-file`.
- `video watermark` only burns **text**; image watermarks are not supported.
- `video lip-sync` is billed per second (default 5.0s) and each model has a duration ceiling: `musetalk` (fast, ≤60s), `latentsync` (HD, ≤30s), `facefusion` (ultra, ≤120s). Pass `--no-wait` to get the job id back immediately instead of waiting.
- `video merge` takes 2–20 source URLs.

Docs: [/api/video-editing](/api/video-editing)

---

## Shorts, Story and UGC

### AI Shorts & Clips

Turns a long video into short, captioned clips in one call:

```bash
fotohub shorts create <source-url> \
  --max-clips 5 --caption-style hormozi --aspect-ratio 9:16 \
  --output clip.mp4

fotohub shorts status <job-id>
fotohub shorts list [--status completed] [--limit 20]
fotohub shorts cancel <job-id>
```

Key options: `--source-type` (`url`, `youtube`, `tiktok`, `instagram`, `vimeo`, `upload`, `fh_library` — auto-detected if omitted), `--min-duration`/`--max-duration`, `--caption-style` (`hormozi`, `beasty`, `clean`, `karaoke`, `minimal`, `neon`, `typewriter`, `bold`, `none`), `--no-captions`/`--no-reframe`/`--no-hooks`/`--no-covers`/`--no-enhance-audio`/`--no-remove-filler`/`--no-retention-model` to skip individual pipeline steps, `--broll` to opt in, and `--webhook-url`/`--webhook-secret`/`--reference` for async notification. By default the command polls to completion (`--no-wait` to return the job id immediately, `--timeout` to bound the wait).

### Story Studio

```bash
fotohub story generate "<prompt>" --num-scenes 4 --duration-per-scene 5 --aspect-ratio 9:16 -o story.mp4
```

`prompt` must be 3–2000 characters; `--num-scenes` is 2–6, `--duration-per-scene` is 3–15s each, `--video-model` defaults to `seedance`, `--voice <id>` sets narration (a default narrator is used if omitted), `--language` is `en`/`pl`/`de`. This call streams the whole multi-scene pipeline over one connection and can take several minutes — there is no separate job id or status endpoint, so the command blocks until it finishes.

### UGC Studio

```bash
fotohub ugc create "My Campaign" [--brief '{"...": "..."}']    # free — nothing generated yet
fotohub ugc get <project-id>
fotohub ugc blueprint <project-id> --file blueprint.json       # required before render
fotohub ugc estimate --file blueprint.json                     # price it first
fotohub ugc render <project-id> [--variant v1] [--product hero=https://...]
fotohub ugc job <job-id> [--no-wait] [-o out.mp4]
```

A project starts free; you save a blueprint document onto it, price the blueprint with `ugc estimate`, then `ugc render` to spend. `--idempotency-key` on `render` makes a retry hand back the same render instead of creating a second one. `ugc job` accepts either a job id or a render id (useful when the job record itself has aged out but the render link is still valid), and polls to completion unless `--no-wait` is given.

Docs: [/api/shorts-clips](/api/shorts-clips), [/api/story-studio](/api/story-studio), [/api/ugc-studio](/api/ugc-studio)

---

## Chat with LLMs

### One-Shot Mode

```bash
fotohub chat send "Explain REST APIs in 3 sentences"
fotohub chat send "Review this code for security issues" -m claude-sonnet -s "You are a senior security engineer" -t 0.3
fotohub chat send "Generate 5 product names for a coffee brand" --no-stream
```

| Flag | Description | Default |
|------|-------------|---------|
| `-m, --model <id>` | Model id — see the table below | `claude-sonnet` |
| `-s, --system <prompt>` | System prompt | -- |
| `-t, --temperature <temp>` | 0–2 | 1 |
| `--no-stream` | Get the full response at once instead of streaming | -- |

The public chat API accepts exactly these four model ids (each aliases to the underlying model shown):

| id | Aliases to | Provider |
|----|------------|----------|
| `claude-sonnet` | `claude-sonnet-4-6` | Anthropic |
| `gpt-4o` | `gpt-5.1` | OpenAI |
| `gemini-pro` | `gemini-2.5-pro` | Google |
| `gemini-flash` | `gemini-2.5-flash` | Google |

Any other id is rejected locally before a request is sent. (A broader catalogue is prepared server-side but not yet live — only the four ids above currently work.)

### Interactive Chat Mode

```bash
fotohub chat interactive
```

A dedicated, plain-streaming REPL with persistent context — distinct from the full [interactive agent](#interactive-mode) that runs when you type bare `fotohub`.

| Command | Description |
|---------|-------------|
| `/quit` (or `/exit`, `/q`) | Exit |
| `/clear` | Reset conversation context |
| `/model <id>` | Switch model mid-conversation |
| `/system <prompt>` | Set the system prompt |
| `/tokens` | Show approximate token count |
| `/export` | Print the conversation as JSON |

---

## Models

```bash
fotohub models list                              # all models
fotohub models list --category image             # image | video | chat | audio | analysis
fotohub models list --provider google
fotohub models info seedream-5-0-260128
```

```
106 models available

Model ID                        Provider           Category  Cost                Status
------------------------------  -----------------  --------  ------------------  ------
audio-mastering                 fotoHUB Engine     audio     $0.0398 / minute    active
tts-elevenlabs                  ElevenLabs         audio     $0.0478 / 1k_characters  active
...
```

Cost is the live USD rate, not a flat credit figure — this listing and `fotohub pricing` read the same table. `models info` resolves across the browsable catalogue, the price list, and the generation catalogue, and says which one answered: a generation-only id like `gpt-image-2` is not in `/v1/models`, so it is looked up in the pricing/generation catalogues instead of being reported as "not found".

---

## Cloud Storage

```bash
fotohub storage list
fotohub storage create my-renders --region eu-central-1 --size 50
fotohub storage ls my-renders --prefix videos/
fotohub storage upload ./render.mp4 -b my-renders [-k assets/hero.mp4] [--content-type video/mp4]
fotohub storage download videos/output.mp4 -b my-renders -o local-copy.mp4
```

Buckets can be passed by **name or id** everywhere — the name is what `storage list` prints, so that is what you'd naturally reach for.

---

## Billing & Usage

```bash
fotohub billing balance      # wallet, this month's spend, and any spend cap
fotohub billing usage        # requests, tokens, top endpoints and models
fotohub billing history      # wallet ledger, per operation and model — supports -l/--limit, -t/--type
fotohub billing estimate --file batch.json      # price a batch of operations before running them
fotohub billing topup --list-packages           # then --package <slug> or --amount <usd>
fotohub billing limit --amount 50               # or --disable to remove the cap
fotohub billing invoices
fotohub billing plans        # legacy subscription plans; the API itself is prepaid USD
```

```
FOTOhub Billing

  Plan:       Developer
  Wallet:     $6.76  (prepaid — API usage is billed from this)
  Spent:      $12.40 this month
```

`billing estimate` takes `-f/--file` (a JSON array of operations, or `{"operations": [...]}`) or `-o/--operations` inline; each operation looks like `{"type":"generate_image","model":"seedream-5-0-260128","count":5}` (types: `generate_image`, `generate_video`, `tts`, each with its own count/duration/characters field).

`billing topup` returns a **checkout URL** — it does not fund the wallet directly. Complete payment there, then re-check `fotohub billing balance`. Both `billing topup` and `billing invoices` currently require a dashboard login (JWT); they may answer 401 even with a valid `FOTOHUB_API_KEY`. Use `fotohub billing history` for API-key-visible spend in the meantime.

---

## Workflows

Execute DAG-based automation workflows from the terminal.

```bash
fotohub workflow list
fotohub workflow run abc123def --input '{"prompt": "generate 5 product images"}' [--credits-max 100] [--no-wait]
fotohub workflow status exec_456
```

`run` polls to completion by default (`--timeout`, default 300s); `--no-wait` returns as soon as the run starts.

---

## Webhooks

Notify your own endpoint as generation and billing events happen, instead of polling.

```bash
fotohub webhooks list
fotohub webhooks create "prod" https://example.com/hook -e generation.completed,credits.low
fotohub webhooks update <id> [--url ...] [--events ...] [--activate|--deactivate]
fotohub webhooks test <id>
fotohub webhooks logs <id>
fotohub webhooks delete <id> --yes   # -y is required for non-interactive use
```

`-H/--headers` on `create`/`update` accepts a JSON object of up to 10 extra headers to send with each delivery. Target URLs must be HTTPS and cannot point at a private/reserved IP.

Event names (`-e/--events`, comma-separated):

`generation.completed`, `generation.failed`, `generation.refunded`, `generation.started`, `credits.low`, `credits.depleted`, `key.used`, `billing.charged`, `billing.insufficient_funds`, `billing.refunded`, `billing.unfunded`, `images.batch.completed`, `background.removed`, `background.replaced`, `background.blurred`, `shadow.added`, `commerce.job.completed`, `commerce.job.failed`, `commerce.item.completed`, `commerce.job.awaiting_credits`, `shorts.job.started`, `shorts.job.completed`, `shorts.job.failed`, `shorts.clip.rendered`.

Docs: [/api/webhooks](/api/webhooks)

---

## System Status

```bash
fotohub status
```

```
FOTOhub System Status  operational

  Region:      eu-central-1

  Services:

    OK  api
    OK  billing
    OK  brand
    OK  s3
    OK  chat
    OK  social
    OK  agent
```

The service list is returned by the API, so it reflects whatever FOTOhub is currently monitoring. Status page: <https://fotohub.app/status>.

---

## Configuration

### Config File Location

Non-secret preferences are stored in `~/.fotohub/config.json` with restricted permissions (0600). Your API key is **not** kept here as plaintext — even `fotohub config set apiKey ...` routes it into secure storage rather than the file (see [Credential Storage](#credential-storage)).

```json
{
  "defaultModel": "seedream-5-0-260128",
  "baseUrl": "https://apis.fotohub.app"
}
```

```bash
fotohub config list
fotohub config get defaultModel
fotohub config set defaultModel seedream-5-0-260128
fotohub config set baseUrl https://apis.staging.fotohub.app
fotohub config unset defaultModel      # restores the built-in default
```

| Key | Description | Default |
|-----|-------------|---------|
| `defaultModel` | Default model for `gen image` | `seedream-5-0-260128` |
| `baseUrl` | API base URL | `https://apis.fotohub.app` |
| `apiKey` | Accepted by `config set` only; stored in the keychain/encrypted file, never in `config.json` | -- |

`config unset` only accepts `defaultModel`/`baseUrl` — remove the API key with `fotohub auth logout` instead.

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

Every subcommand supports `--json` for machine-readable output. The JSON is the API's own payload, unwrapped but not reshaped:

```bash
# Image URLs come back as {images:[{url, seed}]}
fotohub gen image "a cat" --json | jq -r '.images[0].url'

# Models list is a plain array
fotohub models list --json | jq '.[] | select(.category == "image") | .id'

# Wallet balance is under .wallet.balance_usd
BALANCE=$(fotohub billing balance --json | jq '.wallet.balance_usd')
echo "Wallet Balance: \$$BALANCE"

# Generate and immediately download
URL=$(fotohub gen image "sunset" --json | jq -r '.images[0].url')
curl -o image.png "$URL"
```

`-o/--output` also works together with `--json` — the file is saved and the JSON is still printed, so a script gets both the payload and a local copy.

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
| `FOTOHUB_THEME` | Interactive-mode palette: `dark`, `light`, `high-contrast`, `mono` |
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

```bash
eval "$(fotohub --completion bash)"   # ~/.bashrc
eval "$(fotohub --completion zsh)"    # ~/.zshrc
fotohub --completion fish | source
```

Or use the `completion` subcommand (equivalent, and auto-detects your shell from `$SHELL` when the argument is omitted):

```bash
fotohub completion bash
fotohub completion        # auto-detect from $SHELL
```

Restart your shell (or `source ~/.bashrc`) after adding it.

---

## MCP Servers

The CLI is a full [Model Context Protocol](https://modelcontextprotocol.io) client. It can connect to external MCP servers and make their tools available to the [interactive agent](#interactive-mode), connect to FOTOhub's own MCP server in one command, and expose itself as an MCP server for other clients (Claude Desktop, Cursor).

### Connect to the FOTOhub MCP Server

```bash
fotohub mcp connect
```

Registers FOTOhub's hosted MCP server using your existing API key and discovers its tools. Once connected, the interactive agent can call them directly.

> The public MCP endpoint URL is intentionally not pinned here — it is being re-verified separately after a transport issue, so `fotohub mcp connect` (which resolves it for you) is the reliable path rather than a hardcoded address.

### Add an External MCP Server

```bash
# Remote server over Streamable HTTP
fotohub mcp add search --url https://mcp.example.com/

# With a bearer token (stored securely — never written to mcp.json)
fotohub mcp add search --url https://mcp.example.com/ --token "$MY_TOKEN"

# Local server over stdio (spawns a command)
fotohub mcp add local-fs --command npx --args "-y @modelcontextprotocol/server-filesystem /tmp"
```

> **Security:** adding a `--command` server lets the CLI spawn a local process, so it prompts for confirmation. Pass `-y`/`--yes` to skip the prompt in non-interactive use. Remote URLs are validated against SSRF (private/loopback/link-local addresses are rejected).

### Manage Servers

```bash
fotohub mcp list                # List registered servers
fotohub mcp tools <name>        # List tools discovered on a server (--refresh to bypass the cache)
fotohub mcp remove <name>       # Remove a registered server
```

### Expose the CLI as an MCP Server

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

### A video render is taking a while

`gen video` polls by default and prints progress. If you don't want to wait in the foreground, pass `--no-wait` to get the job id back immediately, then check on it later with `fotohub gen video --job <id>` — the render is never abandoned, just detached from your terminal. `gen 3d` has no job to poll: it's synchronous and returns the finished model in one response.

### Rate limited (exit code 5)

Your key has a per-minute request limit. Check `fotohub auth keys list` for the configured rate limit, or raise it with `fotohub auth keys update <key-id> --rate-limit <n>`.

### Wallet cannot cover this call (exit code 4)

```bash
fotohub billing balance
fotohub billing topup --list-packages
```

### Connection timeout

```bash
# Set custom endpoint for one call
fotohub --base-url https://apis.fotohub.app gen image "test"

# Or permanently
fotohub config set baseUrl https://apis.fotohub.app
```

### Debug mode

Add `--verbose` to any command to see full request/response details:

```bash
fotohub gen image "test" --verbose
```

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | success |
| `1` | server error, timeout, or anything unclassified |
| `2` | bad request — invalid arguments, validation, not found |
| `3` | authentication or permission |
| `4` | the prepaid wallet cannot cover this call |
| `5` | rate limited — the same call may succeed later |
| `6` | the API could not be reached at all |

---

## Command Reference (Quick)

```
fotohub                           Launch interactive agent
fotohub auth login                Authenticate (browser OAuth)
fotohub auth login --manual       Authenticate (paste key)
fotohub auth logout               Clear credentials
fotohub auth whoami               Show account info
fotohub auth keys list|create|update|rotate|delete

fotohub pricing [model-id]        Live USD pricing (public, no key needed)

fotohub generate|gen image <prompt>    Generate image  (--estimate, --list-models)
fotohub generate|gen video <prompt>    Generate video  (--estimate, --list-models, --job)
fotohub generate|gen 3d --file <img>   Generate a 3D model (synchronous, --estimate, --list-models)
fotohub generate|gen music <prompt>    Generate music  (--estimate, --list-models)
fotohub generate|gen speech <text>     Text-to-speech, alias tts (--estimate, --list-models)

fotohub image edit|remove-bg|replace-bg|blur-bg|shadow|enhance|denoise|colorize|restore-face|depth|color-grade <url>
fotohub video upscale|lip-sync|transcode|merge|speed|stabilize|subtitles|effects|watermark <url>

fotohub shorts create|status|list|cancel
fotohub story generate <prompt>
fotohub ugc create|get|blueprint|estimate|render|job

fotohub chat send <message>       One-shot chat message
fotohub chat interactive          Interactive chat session

fotohub models list               List all models
fotohub models info <id>          Model details

fotohub storage list|create|ls|upload|download

fotohub billing balance|usage|history|estimate|topup|limit|invoices|plans

fotohub workflow list|run|status

fotohub webhooks list|create|update|delete|test|logs

fotohub config list|set|get|unset

fotohub mcp connect|add|list|tools|remove|serve

fotohub completion [shell]        Print a shell-completion script
fotohub status                    Platform health check
```

---

## Related

- [API Reference](/api/getting-started)
- [SDK Installation](/guides/sdk-setup)
- [Image Generation Guide](/guides/image-generation)
- [Chat & Streaming Guide](/guides/chat-streaming)
- [npm package](https://www.npmjs.com/package/fotohubapp-cli)
- [GitHub source](https://github.com/fotohubapp/cli)
