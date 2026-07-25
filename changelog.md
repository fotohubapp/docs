# Changelog

Track new models, features, and improvements to the FOTOhub API.

---

## July 2026

### IDA Q 1.0 <Badge type="tip" text="NEW" />

FOTOhub's first proprietary image generation model, self-hosted on our own GPU infrastructure.

- **Top-5 worldwide** on the DesignArena Elo benchmark, ahead of Recraft, Krea 2, FLUX.2, Seedream, and Imagen 4 Ultra
- **Best-in-class text rendering** — clean headlines, labels, and signage
- **Native multilingual prompts** — automatic translation and scene restructuring for any input language, powered by FOTOhub's own prompt engine
- **Priced at 1.0 PLN/request** — same as Nano Banana (Gemini Flash Image), about half the price of GPT Image 2
- **Asynchronous by design** — single-GPU global queue, submit + poll pattern (30s–3.5min depending on resolution)
- **SDK support**: `client.generate_ida_q()` / `client.generateIdaQ()` in Python & TypeScript — handles submit + poll transparently

See the [IDA Q 1.0 API Reference](/api/ida-q) for full documentation.

### Veo 3.1, Veo 3.1 Fast, Gemini Omni Flash & Grok Video 1.5 <Badge type="tip" text="NEW" />

Four new video models added to the catalog:

- **`veo-3.1-generate-001`** ("Veo 3.1") — Google's highest-quality video model. Native audio, up to 4K resolution, last-frame + reference-image support. 12 credits/second.
- **`veo-3.1-fast-generate-001`** ("Veo 3.1 Fast") — Faster, lower-cost Veo 3.1 tier with native audio. 5 credits/second.
- **`gemini-omni-flash`** ("Gemini Omni Flash") — Native audio generated automatically on every clip, no separate surcharge tier. 6 credits/second.
- **`grok-imagine-video-1.5`** ("Grok Video 1.5") — The only generative video model with built-in lip-sync (portrait + script → talking head). 9 credits/second.

See the [Video Generation Models catalog](/api/models#video-generation-models) for full pricing across every provider.

### Gabriel AI Orchestrator <Badge type="tip" text="NEW" />

Full-featured AI orchestrator with natural language routing, prompt enhancement, and inline suggestions.

- **5 endpoints**: classify, stream, suggest, recommend, translate
- **Intelligent routing**: "make a photo of a cat" → image generation, "create a video" → video generation
- **Prompt enhancement**: model-aware prompt optimization (Seedream, Seedance, FLUX, WAN architectures)
- **Real-time suggestions**: <50ms autocomplete as you type
- **Proactive tips**: context-aware recommendations based on credits, brand state, and usage history
- **SDK support**: `client.gabriel_classify()` / `client.gabrielClassify()` in Python & TypeScript

### Usage & Analytics API <Badge type="tip" text="NEW" />

Real-time monitoring and cost analytics for all API operations.

- Per-model, per-endpoint, per-key cost breakdown
- Daily/weekly/monthly trend data
- Anomaly detection alerts
- Custom date range queries

### Seedance Video <Badge type="info" text="UPDATED" />

Next-generation Seedance video generation now available under the `seedance-2-0-pro` model ID:
- High-quality, cinematic output
- Fast turnaround for social-format clips
- Billed at 47 credits per 5-second segment

### Dola SeedDream 5.0 Pro <Badge type="info" text="UPDATED" />

Latest SeedDream variant with improved prompt following, better text rendering, and enhanced photorealism. 3 credits per image.

---

## June 2026

### Tier System v2 <Badge type="tip" text="NEW" />

Complete billing overhaul with wallet-based pricing:
- PAYG auto-resolution (free → developer → startup based on usage)
- Wallet with auto-topup
- Per-project hard spending limits
- 4-hour burst allowances
- Enterprise tier with custom SLAs

### Brand Assets System <Badge type="tip" text="NEW" />

Upload and manage brand assets (logos, colors, fonts) for brand-consistent AI generation.

### Veo 3.0 Improvements <Badge type="info" text="UPDATED" />

Improved temporal coherence for Google's Veo 3 video model. Note: this entry originally referred to "Veo 3.1" and listed a flat 15-credit generation cost — that was inaccurate. The real `veo-3.1-generate-001` (12 credits/second, native audio, up to 4K) shipped in July 2026; see the entry below.

---

## May 2026

### FLUX 2 Models <Badge type="tip" text="NEW" />

Full FLUX 2 lineup: Pro, Max, Flex, Klein 4B/9B. Best-in-class for artistic and creative generation.

### Grok Video & Image <Badge type="tip" text="NEW" />

xAI's Grok-powered generation models added to the catalog.

### Webhook System <Badge type="info" text="UPDATED" />

HMAC-SHA256 signed webhooks with 3x retry, exponential backoff, and delivery logs.

---

## Earlier

See the [full API reference](/api/getting-started) for comprehensive endpoint documentation.
