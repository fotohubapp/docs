# Our AI Models

FOTOhub develops proprietary AI systems that power core platform capabilities. These models run on our dedicated GPU infrastructure across European data centers, providing low-latency inference, full data sovereignty, and cost advantages over cloud-only providers.

## Gabriel AI Orchestrator

Gabriel is FOTOhub's intelligent platform orchestrator — a proprietary AI layer that sits between users and 50+ AI models, making the entire platform feel like a single coherent assistant.

### What Gabriel Does

| Capability | Description |
|-----------|-------------|
| **Intent Classification** | Understands natural language requests and maps them to platform features |
| **Model Selection** | Dynamically selects the optimal model based on task, quality needs, and cost |
| **Prompt Engineering** | Enriches user prompts with model-specific optimizations |
| **Multi-step Workflows** | Orchestrates complex tasks requiring sequential operations |
| **Proactive Suggestions** | Context-aware recommendations as users navigate the platform |
| **Auto-translation** | Real-time translation across 30+ languages |

### Architecture

```
User Input → Gabriel Orchestrator
                 ├── Intent Classifier (proprietary fine-tuned model)
                 ├── Model Router (availability + cost + quality scoring)
                 ├── Prompt Enhancer (per-model architecture knowledge)
                 ├── Workflow Engine (multi-step task decomposition)
                 └── Feedback Loop (learns from user corrections)
```

### Benchmarks

| Metric | Score | Details |
|--------|-------|---------|
| Intent accuracy | 96.2% | Tested on 10,000+ real user queries across PL/EN/DE |
| Routing precision | 98.7% | Correct model selected for the task type |
| Prompt enhancement lift | +34% | Quality improvement measured by user satisfaction ratings |
| Reliability | No published number | Requests route through a multi-model failover chain — if the selected model or engine fails, Gabriel retries against the next healthy candidate and a failed generation is refunded rather than silently dropped |

### Key Features

- **Dynamic Model Awareness** — Only recommends models that are currently healthy (checked every 60s)
- **Cost Optimization** — Routes to the most cost-effective model for each task
- **10 Function-Calling Tools** — Image, Video, Chat, Music, 3D, Editing, Brand, Tools, Workflows, Q&A
- **Multi-language** — Natively handles PL, EN, DE, FR, ES + 25 more
- **Zero Extra Cost** — Gabriel routing is free; you only pay for the downstream generation

### API Access

```bash
POST https://apis.fotohub.app/v1/ai/gabriel         # Single-shot classification
POST https://apis.fotohub.app/v1/ai/gabriel/stream   # Streaming SSE
POST https://apis.fotohub.app/v1/ai/gabriel/suggest  # Autocomplete (no auth)
POST https://apis.fotohub.app/v1/ai/gabriel/recommend # Proactive tips (no auth)
```

See [Gabriel AI API Reference](/api/gabriel-ai) for complete endpoint documentation.

---

## IDA Q 1.0

**IDA Q 1.0** is FOTOhub's proprietary text-to-image generation model — built and hosted entirely on our own GPU infrastructure, engineered around precise text rendering, deliberate composition control, and native multilingual understanding.

### Capabilities

| Feature | Specification |
|---------|--------------|
| **Generation** | Text-to-image (no image editing/img2img) |
| **Max images per request** | 2 |
| **Max resolution** | 2048 × 2048 |
| **Aspect ratios** | 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 21:9 |
| **Multilingual prompts** | Yes — automatic translation, any input language |
| **Text rendering** | Best-in-class — headlines, labels, signage |
| **Seed control** | Yes, reproducible outputs |
| **Generation mode** | Asynchronous (submit + poll, single-GPU queue) |
| **Generation time** | ~30s (1K) / ~90s (1.5K) / ~3.5min (2K) |

### Benchmarks

On the independent DesignArena benchmark (Elo rating, real-world design task quality):

| Metric | IDA Q 1.0 | Industry Position |
|--------|-----------|-------------------|
| DesignArena Elo | 1285 | 5th worldwide |
| vs. Recraft V4.1 Utility Pro (1245) | +40 Elo | Ahead |
| vs. Krea 2 Large (1235) | +50 Elo | Ahead |
| vs. FLUX.2 [pro] (1239) | +46 Elo | Ahead |
| vs. Seedream Lite 5.0 (1236) | +49 Elo | Ahead |
| vs. Imagen 4 Ultra Preview (1233) | +52 Elo | Ahead |
| vs. GPT Image 2 (1405) | -120 Elo | Behind (top-tier gap) |

### Prompt Intelligence

Every prompt passes through FOTOhub's own prompt engine before generation — automatic translation to English, expansion of short/casual descriptions into fully detailed scene structure, and verbatim preservation of quoted text and named brands. You write a normal description in any language; the engine handles the rest. See the [full breakdown](/api/ida-q#how-prompt-structuring-works) of how this works.

### Pricing

| Model | Price (USD) | Unit | Meter |
|-------|------------:|------|-------|
| IDA Q 1.0 (`ida-q-image`) | **$0.00** | per request | Free (self-hosted EU GPU cluster) |

::: tip Fully Free Self-Hosted Image Generation
IDA Q 1.0 is engineered and hosted entirely on FOTOhub's dedicated European GPU cluster. Because there is zero third-party vendor licensing or per-inference cloud cost, generations are **100% free ($0.00)** and deduct nothing from your API wallet.
:::

### API Access

```bash
POST https://apis.fotohub.app/v1/ai/generate/image        # Submit (model: "ida-q-image")
GET  https://apis.fotohub.app/v1/ai/generate/image/ida-q/{job_id}  # Poll for result
```

See [IDA Q 1.0 API Reference](/api/ida-q) for complete endpoint documentation.

---

## IDA Music

**IDA Music** is FOTOhub's proprietary music generation engine. It produces full songs with vocals, lyrics, and complex multi-instrument arrangements up to 8 minutes long — running entirely on our GPU infrastructure.

### Capabilities

| Feature | Specification |
|---------|--------------|
| **Duration** | 30 seconds to 8 minutes |
| **Output** | Full songs with vocals OR instrumentals |
| **Vocals** | Male/female, 12+ languages (EN, ZH, JA, KO, ES, FR, DE, IT, PT, RU, AR, HI) |
| **Genres** | Any genre — pop, rock, electronic, jazz, classical, hip-hop, ambient, cinematic, folk, metal |
| **Lyrics** | Custom lyrics with structure tags, or AI-generated |
| **Quality Presets** | Draft (15s), Standard (30s), High (45s), Max (90s) |
| **Formats** | MP3, WAV, FLAC |
| **Batch** | 1–4 variations per request |
| **Seed Control** | Reproducible outputs |

### Audio Quality Benchmarks

| Metric | IDA Music | Industry Average |
|--------|-----------|-----------------|
| Sample rate | 48 kHz | 44.1 kHz |
| Bit depth | 24-bit | 16-bit |
| Frequency response | 20 Hz – 20 kHz | 20 Hz – 16 kHz |
| Dynamic range | 96 dB | 72 dB |
| THD+N | <0.01% | <0.05% |
| Vocal clarity (PESQ) | 4.2 / 5.0 | 3.6 / 5.0 |
| Musical coherence | 4.5 / 5.0 | 3.8 / 5.0 |
| Lyric intelligibility | 94% | 82% |

### Quality Presets

| Preset | Steps | Guidance | Sampler | Generation Time |
|--------|-------|----------|---------|-----------------|
| Draft | 20 | 5.0 | Euler | ~15 seconds |
| Standard | 40 | 5.0 | Euler | ~30 seconds |
| High | 50 | 7.0 | Euler | ~45 seconds |
| Max | 50 | 7.0 | Heun + ADG | ~90 seconds |

### Song Structure Control

IDA Music supports detailed structural tags for professional music production:

```
[intro], [verse], [chorus], [bridge], [outro],
[pre-chorus], [hook], [interlude], [break],
[drop], [solo], [ad-lib], [fade-out]
```

### Musical Parameters

| Parameter | Range | Description |
|-----------|-------|-------------|
| BPM | 60–220 | Tempo control |
| Key/Scale | All major/minor keys | Tonal center |
| Time Signature | 4/4, 3/4, 6/8, 5/4, 7/8 | Rhythmic structure |
| Vocal Language | 12+ languages | Singing language |
| Vocal Gender | Male / Female / Auto | Voice type |

### Pricing

IDA Music is billed **per started minute of generated audio**:

| Engine | Model ID | USD / Minute | 30s Track | 60s Track | 120s Track |
|--------|----------|-------------:|----------:|----------:|-----------:|
| MiniMax Music | `minimax` | **$0.025** | $0.0125 | $0.025 | $0.050 |
| IDA Cloud Music | `elevenlabs` | **$0.045** | $0.0225 | $0.045 | $0.090 |

::: tip Cost Advantage
Billed at exact provider rates ($0.025–$0.045 per minute) directly from your prepaid wallet. A complete 2-minute soundtrack costs just $0.05 on MiniMax or $0.09 on IDA Cloud Music, with zero platform markups.
:::

### API Access

```bash
POST https://apis.fotohub.app/v1/ai/generate/music          # Generate music
```

There is no separate lyrics-composer endpoint — pass your own lyrics (or omit them
for an instrumental track) directly in the `POST /v1/ai/generate/music` request.

See [Music & Audio API Reference](/api/music-audio) for complete endpoint documentation.

---

## IDA Voice

FOTOhub's proprietary voice synthesis system providing natural-sounding speech with voice cloning capabilities.

### Capabilities

| Feature | Specification |
|---------|--------------|
| **Languages** | 30+ languages with native pronunciation |
| **Voice Cloning** | Custom voice from audio sample |
| **Expressiveness** | Emotion, pace, emphasis control |
| **SSML Support** | Fine-grained prosody control |
| **Streaming** | Real-time audio streaming for low latency |
| **Max Input** | 5,000 characters per request |

### Voice Quality

| Metric | IDA Voice | Standard TTS |
|--------|-----------|--------------|
| MOS (Mean Opinion Score) | 4.3 / 5.0 | 3.7 / 5.0 |
| Naturalness | 4.4 / 5.0 | 3.5 / 5.0 |
| Intelligibility | 98% | 95% |
| Emotion accuracy | 89% | 71% |
| Clone similarity | 92% | — |

### Pricing

Billed **per 1,000 characters submitted**:

| Voice Model Tier | Provider Alias | Price (USD) | Unit |
|------------------|----------------|------------:|------|
| IDA Voice Standard (`mars-flash`) | `google` | **$0.015** | per 1,000 characters |
| IDA Voice Pro / Clone (`mars-pro`) | `elevenlabs` | **$0.030** | per 1,000 characters |

### API Access

```bash
POST https://apis.fotohub.app/v1/ai/generate/speech
```

---

## IDA Audio (Sound Effects)

Instant generation of sound effects and ambient audio from text descriptions.

### Capabilities

| Feature | Specification |
|---------|--------------|
| **Duration** | 1–30 seconds |
| **Categories** | Nature, mechanical, sci-fi, UI, foley, ambient, impacts, musical |
| **Format** | MP3 (default), WAV |
| **Latency** | 2–5 seconds generation time |

### Pricing

Billed **flat per generation** (any duration up to 30s):

| SFX Engine | Price Key | Price (USD) | Unit |
|------------|-----------|------------:|------|
| ElevenLabs SFX | `elevenlabs-sfx` | **$0.015** | per request |
| FOTOhub Studio SFX | `sfx-elevenlabs` | **$0.040193** | per request |

### API Access

```bash
POST https://apis.fotohub.app/v1/ai/generate/sfx
```

---

## Platform-wide AI Features

Beyond dedicated models, FOTOhub's AI layer provides:

| Feature | Technology | Cost |
|---------|-----------|------|
| **Smart Search** | Semantic vector search across user's media library | Free |
| **Auto-tagging** | Automatic metadata extraction from uploaded images | Free |
| **Brand Consistency** | AI-enforced style matching from brand kits | Free |
| **Content Safety** | Real-time NSFW and policy detection | Free |
| **Prompt Translation** | Automatic prompt translation to optimal model language | Free |

---

## Infrastructure

Most proprietary models run on FOTOhub's dedicated GPU cluster in the EU. The one
exception is textured 3D generation, which runs on a GPU in the US — no EU cloud
zone had the required GPU capacity available, so that specific workload is not
EU-hosted.

| Resource | Specification |
|----------|--------------|
| **Location** | EU (Frankfurt, eu-central-1), except textured 3D generation (US) |
| **GPU** | NVIDIA A100 80GB / L4 |
| **Inference** | Custom optimized pipeline |
| **Reliability** | Multi-model failover — a failed generation retries against a healthy alternative and is refunded rather than left to fail silently. No uptime SLA is published. |
| **Data** | GDPR-compliant, no training on user data |

### Why Self-Hosted

| Advantage | Benefit |
|-----------|---------|
| **Cost** | 60–80% lower per-inference cost vs cloud APIs |
| **Latency** | Direct EU routing, no transcontinental hops |
| **Privacy** | Data never leaves FOTOhub infrastructure |
| **Control** | Custom quality tuning, no provider deprecation risk |
| **Rate Limits** | No external throttling — capacity scales with demand |

---

## Comparison

### FOTOhub vs. Cloud-Only Platforms

| Capability | FOTOhub | Cloud-Only |
|-----------|---------|------------|
| Music generation (8 min) | $0.20–$0.36 ($0.025–$0.045/min) | $2–5 per track |
| Voice synthesis | $0.015–$0.030/1K chars | $0.015–$0.030/1K chars |
| Intelligent routing | Free (Gabriel) | Not available |
| Model selection | Automatic, 50+ models | Manual, 1 provider |
| Prompt enhancement | Free, per-model optimized | Not available |
| Multi-step workflows | Orchestrated by Gabriel | Manual chaining |
| EU data residency | Default | Extra cost / unavailable |

::: info Continuous Improvement
Our proprietary models are continuously improved through architecture upgrades, training data curation, and inference optimization. Updates are deployed seamlessly — no API changes required.
:::
