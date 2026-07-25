# Our AI Models

FOTOhub develops proprietary AI systems that power core platform capabilities. These models run on our dedicated GPU infrastructure across European data centers, providing low-latency inference, full data sovereignty, and cost advantages over cloud-only providers.

## Gabriel AI Orchestrator

Gabriel is FOTOhub's intelligent platform orchestrator — a proprietary AI layer that sits between users and 50+ AI models, making the entire platform feel like a single coherent assistant.

### What Gabriel Does

| Capability | Description | Latency |
|-----------|-------------|---------|
| **Intent Classification** | Understands natural language requests and maps them to platform features | <100ms |
| **Model Selection** | Dynamically selects the optimal model based on task, quality needs, and cost | <50ms |
| **Prompt Engineering** | Enriches user prompts with model-specific optimizations | <200ms |
| **Multi-step Workflows** | Orchestrates complex tasks requiring sequential operations | <500ms |
| **Proactive Suggestions** | Context-aware recommendations as users navigate the platform | <50ms |
| **Auto-translation** | Real-time translation across 30+ languages | <300ms |

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
| Response latency (P95) | 180ms | Single-shot classification, EU datacenter |
| Streaming first token | <80ms | SSE stream begins before full classification completes |
| Availability | 99.97% | Multi-model failover chain, auto-recovery |

### Key Features

- **Dynamic Model Awareness** — Only recommends models that are currently healthy (checked every 60s)
- **Cost Optimization** — Routes to the best quality-per-credit model for each task
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

| Model | Price | Unit |
|-------|-------|------|
| IDA Q 1.0 | 0.10 | PLN / request |

::: tip Cost Advantage
IDA Q 1.0 costs a fraction of Google's Nano Banana (Gemini Flash Image) and roughly 20x less than GPT Image 2 — a direct result of running on our own infrastructure with zero third-party licensing cost to pass through.
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

| Duration | Credits | PLN |
|----------|---------|-----|
| ≤ 3 minutes | 2 | 0.15 |
| > 3 minutes | 4 | 0.30 |

::: tip Cost Advantage
IDA Music costs 2–4 credits per generation. Comparable cloud services charge 5–25 credits for similar output. Running on our own infrastructure means: lower latency for European users, no external rate limits, and full control over output quality.
:::

### API Access

```bash
POST https://apis.fotohub.app/v1/ai/generate/music          # Generate music
POST https://apis.fotohub.app/v1/ai/generate/music/compose   # AI lyrics composer (free)
```

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

| Model | Credits | Per |
|-------|---------|-----|
| IDA Voice | 2 | 1,000 characters |

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

| Credits | Per |
|---------|-----|
| 3 | generation (any duration) |

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

All proprietary models run on FOTOhub's dedicated GPU cluster:

| Resource | Specification |
|----------|--------------|
| **Location** | EU (Frankfurt, eu-central-1) |
| **GPU** | NVIDIA A100 80GB / L4 |
| **Inference** | Custom optimized pipeline |
| **Availability** | 99.97% uptime (multi-node redundancy) |
| **Data** | GDPR-compliant, no training on user data |
| **Latency** | <200ms P95 for European users |

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
| Music generation (8 min) | 4 credits (~$0.30) | $2–5 per track |
| Voice synthesis | 2 credits/1K chars | $0.015–0.030/1K chars |
| Intelligent routing | Free (Gabriel) | Not available |
| Model selection | Automatic, 50+ models | Manual, 1 provider |
| Prompt enhancement | Free, per-model optimized | Not available |
| Multi-step workflows | Orchestrated by Gabriel | Manual chaining |
| EU data residency | Default | Extra cost / unavailable |

::: info Continuous Improvement
Our proprietary models are continuously improved through architecture upgrades, training data curation, and inference optimization. Updates are deployed seamlessly — no API changes required.
:::
