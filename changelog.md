# Changelog

Track new models, features, and improvements to the FOTOhub API.

---

## July 2026

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

### Seedance 2.0 Models <Badge type="info" text="UPDATED" />

Next-generation video models now available:
- **seedance-2-0-pro**: Highest quality, cinematic output
- **seedance-2-0-fast**: 3x faster, great quality, 1 credit
- **seedance-2-0-mini**: Ultra-fast previews, 1 credit

### Dola SeedDream 5.0 Pro <Badge type="info" text="UPDATED" />

Latest SeedDream variant with improved prompt following, better text rendering, and enhanced photorealism. 1 credit per image.

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

### Veo 3.1 <Badge type="info" text="UPDATED" />

Google's latest video model with improved temporal coherence and 4K output support. 15 credits per generation.

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
