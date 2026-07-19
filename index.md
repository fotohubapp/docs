---
layout: home
hero:
  name: "FOTOhub for Developers"
  text: "One API. 200+ AI Models."
  tagline: "Image, video, music, 3D, chat — unified under a single endpoint. Ship creative AI features in minutes, not months."
  image:
    light: /logo-light.png
    dark: /logo-dark.png
    alt: FOTOhub
  actions:
    - theme: brand
      text: Get Started →
      link: /api/getting-started
    - theme: alt
      text: API Reference
      link: /api/image-generation
    - theme: alt
      text: View on GitHub
      link: https://github.com/fotohubapp

features:
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
    title: Image Generation
    details: "25+ models — SeedDream 5, FLUX 2, Grok Imagine, WAN, Imagen. Text-to-image, img2img, inpainting, upscaling. From 0.7 cr/image."
    link: /api/image-generation
    linkText: Image API →
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>'
    title: Video Generation
    details: "15+ models — Seedance 2.0, Veo 3.1, Hailuo, Sora 2, Kling. Text-to-video, image-to-video, up to 60s. Async polling."
    link: /api/video-generation
    linkText: Video API →
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>'
    title: Music & Audio
    details: "Music generation, SFX, 30+ TTS voices, speech-to-text, translation, dubbing. MiniMax, IDA Music, Stable Audio."
    link: /api/music-audio
    linkText: Audio API →
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
    title: Chat / LLM
    details: "OpenAI-compatible. Claude 4, GPT-4o, Gemini 2.5, DeepSeek. Streaming, tool use, vision. Per-token billing."
    link: /api/chat-llm
    linkText: Chat API →
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3z"/><path d="M12 12l9-4.5"/><path d="M12 12v9"/><path d="M12 12L3 7.5"/></svg>'
    title: 3D Generation
    details: "Image-to-3D & text-to-3D. TripoSR, SF3D, Hunyuan3D, TRELLIS. GLB/OBJ/STL/USDZ export. PBR materials."
    link: /api/3d-generation
    linkText: 3D API →
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>'
    title: Gabriel AI Orchestrator
    details: "Natural language → instant routing. Intent classification, model selection, prompt enhancement, workflow orchestration. Free tier."
    link: /api/gabriel-ai
    linkText: Gabriel API →
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>'
    title: Agent Workflows
    details: "Visual DAG editor for AI pipelines. 8 node types, event streaming, scheduled triggers, Temporal orchestration."
    link: /api/agents
    linkText: Agents API →
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>'
    title: Cloud GPU
    details: "On-demand A10G, A100, H100. Per-hour billing, spot pricing (60% off), SSH access, custom images."
    link: /api/cloud-computing
    linkText: Compute API →
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>'
    title: S3 Storage
    details: "Enterprise object storage — presigned URLs, multipart, CDN, lifecycle, versioning, encryption. 60+ endpoints."
    link: /api/storage
    linkText: Storage API →
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>'
    title: Usage Analytics
    details: "Real-time monitoring, cost breakdown by model/endpoint/key, daily trends, anomaly detection. Custom dashboard data."
    link: /api/usage-analytics
    linkText: Usage API →
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>'
    title: Billing Engine
    details: "Dual billing — credits (predictable) or tokens (precise). Wallet, auto-topup, hard limits per project, buster packs."
    link: /api/billing
    linkText: Billing API →
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>'
    title: Webhooks
    details: "Real-time HTTP events — generation, credits, billing. HMAC-SHA256 signed, 3x retry, exponential backoff."
    link: /api/webhooks
    linkText: Webhooks →
---

<div class="custom-home">

<section class="stats-bar">
  <div class="stat"><span class="stat-number">200+</span><span class="stat-label">AI Models</span></div>
  <div class="stat-divider"></div>
  <div class="stat"><span class="stat-number">5</span><span class="stat-label">SDKs</span></div>
  <div class="stat-divider"></div>
  <div class="stat"><span class="stat-number">60+</span><span class="stat-label">API Endpoints</span></div>
  <div class="stat-divider"></div>
  <div class="stat"><span class="stat-number">&lt;200ms</span><span class="stat-label">P95 Latency</span></div>
  <div class="stat-divider"></div>
  <div class="stat"><span class="stat-number">99.9%</span><span class="stat-label">Uptime</span></div>
</section>

<section class="code-preview">
  <div class="code-header">
    <div class="code-dots"><span></span><span></span><span></span></div>
    <div class="code-tabs">
      <span class="code-tab active">Python</span>
      <span class="code-tab">TypeScript</span>
      <span class="code-tab">cURL</span>
    </div>
  </div>

```python
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

# Generate an image — 1 credit, ~2 seconds
image = client.generate_image(
    prompt="Product photography, white sneakers on marble, studio lighting",
    model="seedream-5-0-260128",
    aspect_ratio="1:1"
)
print(image["images"][0])  # → https://s3point.fotohub.app/...

# Let Gabriel pick the best model for you
route = client.gabriel_classify(
    prompt="Make a 5s video of waves crashing on rocks",
    enhance_prompt=True
)
# → { action: "route", target: "/generate/video", model_selected: "seedance-2-0-fast" }
```

</section>

<section class="sdk-strip">
  <h3>Install in seconds</h3>
  <div class="sdk-grid">
    <div class="sdk-card">
      <code>pip install fotohub</code>
      <span class="sdk-badge">Python 3.8+</span>
    </div>
    <div class="sdk-card">
      <code>npm install fotohub</code>
      <span class="sdk-badge">Node 18+</span>
    </div>
    <div class="sdk-card">
      <code>composer require fotohub/sdk</code>
      <span class="sdk-badge">PHP 8.1+</span>
    </div>
  </div>
</section>

<section class="whats-new">
  <h3>What's New</h3>
  <div class="changelog-items">
    <div class="changelog-item">
      <span class="changelog-date">Jul 2026</span>
      <span class="changelog-badge new">NEW</span>
      <span class="changelog-text">Gabriel AI Orchestrator — natural language routing with auto-send, prompt enhancement, inline suggestions</span>
    </div>
    <div class="changelog-item">
      <span class="changelog-date">Jul 2026</span>
      <span class="changelog-badge new">NEW</span>
      <span class="changelog-text">Usage & Analytics API — real-time monitoring, cost breakdown, anomaly detection</span>
    </div>
    <div class="changelog-item">
      <span class="changelog-date">Jul 2026</span>
      <span class="changelog-badge improved">UPD</span>
      <span class="changelog-text">Seedance 2.0 Pro/Fast/Mini — next-gen video at 1 credit flat</span>
    </div>
    <div class="changelog-item">
      <span class="changelog-date">Jun 2026</span>
      <span class="changelog-badge improved">UPD</span>
      <span class="changelog-text">Tier system v2 — PAYG auto-resolution, wallet, burst limits</span>
    </div>
  </div>
</section>

</div>

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(135deg, #1e1b4b 0%, #7c3aed 50%, #2563eb 100%);
  --vp-home-hero-image-background-image: linear-gradient(-45deg, #7c3aed40 50%, #2563eb40 50%);
  --vp-home-hero-image-filter: blur(44px);
}

.dark {
  --vp-home-hero-name-background: -webkit-linear-gradient(135deg, #c4b5fd 0%, #a78bfa 50%, #60a5fa 100%);
  --vp-home-hero-image-background-image: linear-gradient(-45deg, #7c3aed20 50%, #2563eb20 50%);
}

@media (min-width: 640px) {
  :root { --vp-home-hero-image-filter: blur(56px); }
}
@media (min-width: 960px) {
  :root { --vp-home-hero-image-filter: blur(68px); }
}

/* ─── Hero ─── */

.VPHero .name {
  font-size: 2.4rem !important;
  letter-spacing: -0.04em;
  font-weight: 800 !important;
}

.VPHero .text {
  font-size: 1.8rem !important;
  letter-spacing: -0.02em;
  font-weight: 700 !important;
  background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dark .VPHero .text {
  background: linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@media (min-width: 640px) {
  .VPHero .name { font-size: 3rem !important; }
  .VPHero .text { font-size: 2.4rem !important; }
}
@media (min-width: 960px) {
  .VPHero .name { font-size: 3.6rem !important; }
  .VPHero .text { font-size: 2.8rem !important; }
}

.VPHero .tagline {
  font-size: 1.05rem !important;
  line-height: 1.6 !important;
  max-width: 580px;
  opacity: 0.75;
}

.VPHero .actions .action .VPButton {
  border-radius: 10px !important;
  font-weight: 600 !important;
  letter-spacing: 0.01em;
  transition: all 0.2s ease;
}

.VPHero .actions .action .VPButton.brand:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.3);
}

/* ─── Feature tiles ─── */

.VPFeatures {
  padding-top: 2rem !important;
}

.VPFeatures .container {
  max-width: 1200px !important;
}

.VPFeatures .VPFeature {
  border: none !important;
  border-radius: 14px !important;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  background: #f8fafc !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.04) !important;
}

.VPFeatures .VPFeature::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.VPFeatures .VPFeature:hover::before {
  opacity: 1;
}

.VPFeatures .VPFeature:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 16px 48px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.06) !important;
}

.dark .VPFeatures .VPFeature {
  background: rgba(22, 22, 29, 0.7) !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.04) !important;
}

.dark .VPFeatures .VPFeature:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 16px 48px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.08) !important;
  background: rgba(30, 27, 75, 0.4) !important;
}

/* Accent top bars */
.VPFeatures .items .item:nth-child(1) .VPFeature::before { background: linear-gradient(90deg, #7c3aed, #a78bfa); }
.VPFeatures .items .item:nth-child(2) .VPFeature::before { background: linear-gradient(90deg, #e11d48, #fb7185); }
.VPFeatures .items .item:nth-child(3) .VPFeature::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.VPFeatures .items .item:nth-child(4) .VPFeature::before { background: linear-gradient(90deg, #059669, #34d399); }
.VPFeatures .items .item:nth-child(5) .VPFeature::before { background: linear-gradient(90deg, #0891b2, #22d3ee); }
.VPFeatures .items .item:nth-child(6) .VPFeature::before { background: linear-gradient(90deg, #7c3aed, #c084fc); }
.VPFeatures .items .item:nth-child(7) .VPFeature::before { background: linear-gradient(90deg, #2563eb, #60a5fa); }
.VPFeatures .items .item:nth-child(8) .VPFeature::before { background: linear-gradient(90deg, #4f46e5, #818cf8); }
.VPFeatures .items .item:nth-child(9) .VPFeature::before { background: linear-gradient(90deg, #0d9488, #5eead4); }
.VPFeatures .items .item:nth-child(10) .VPFeature::before { background: linear-gradient(90deg, #d97706, #fcd34d); }
.VPFeatures .items .item:nth-child(11) .VPFeature::before { background: linear-gradient(90deg, #dc2626, #f87171); }
.VPFeatures .items .item:nth-child(12) .VPFeature::before { background: linear-gradient(90deg, #1d4ed8, #93c5fd); }

.VPFeatures .VPFeature .icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none !important;
  color: #374151;
  margin-bottom: 2px;
}

.dark .VPFeatures .VPFeature .icon {
  color: #e2e8f0;
}

.VPFeatures .VPFeature .title {
  font-weight: 650 !important;
  font-size: 1.02rem !important;
  letter-spacing: -0.01em;
}

.VPFeatures .VPFeature .details {
  font-size: 0.82rem !important;
  line-height: 1.55 !important;
  opacity: 0.7;
}

.VPFeatures .VPFeature .link-text {
  font-weight: 600 !important;
  font-size: 0.8rem !important;
}

/* ─── Stats bar ─── */

.stats-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 2rem 1rem;
  margin: -1rem auto 2rem;
  max-width: 800px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-number {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dark .stat-number {
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: currentColor;
  opacity: 0.1;
}

@media (max-width: 640px) {
  .stats-bar { gap: 1rem; }
  .stat-number { font-size: 1.3rem; }
  .stat-divider { height: 24px; }
}

/* ─── Code preview ─── */

.code-preview {
  max-width: 720px;
  margin: 0 auto 3rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04);
}

.dark .code-preview {
  box-shadow: 0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);
}

.code-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #f1f5f9;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.dark .code-header {
  background: #1a1a24;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.code-dots {
  display: flex;
  gap: 6px;
}

.code-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d1d5db;
}

.dark .code-dots span {
  background: #374151;
}

.code-dots span:nth-child(1) { background: #ef4444; }
.code-dots span:nth-child(2) { background: #f59e0b; }
.code-dots span:nth-child(3) { background: #22c55e; }

.code-tabs {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.code-tab {
  font-size: 0.72rem;
  font-weight: 500;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  opacity: 0.5;
  cursor: default;
}

.code-tab.active {
  opacity: 1;
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
}

.dark .code-tab.active {
  background: rgba(167, 139, 250, 0.15);
  color: #a78bfa;
}

.code-preview .language-python {
  margin: 0 !important;
  border-radius: 0 !important;
}

.code-preview div[class*="language-"] {
  margin: 0 !important;
  border-radius: 0 0 12px 12px !important;
}

/* ─── SDK strip ─── */

.sdk-strip {
  max-width: 720px;
  margin: 0 auto 3rem;
  text-align: center;
}

.sdk-strip h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.sdk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.sdk-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid rgba(0,0,0,0.06);
  transition: all 0.2s ease;
}

.sdk-card:hover {
  border-color: #7c3aed;
  background: rgba(124, 58, 237, 0.03);
}

.dark .sdk-card {
  background: rgba(22, 22, 29, 0.6);
  border: 1px solid rgba(255,255,255,0.06);
}

.dark .sdk-card:hover {
  border-color: #a78bfa;
  background: rgba(167, 139, 250, 0.05);
}

.sdk-card code {
  font-size: 0.82rem;
  font-weight: 600;
  color: #1e1b4b;
  background: none;
  padding: 0;
}

.dark .sdk-card code {
  color: #e2e8f0;
}

.sdk-badge {
  font-size: 0.65rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.5;
}

/* ─── What's New ─── */

.whats-new {
  max-width: 720px;
  margin: 0 auto 4rem;
}

.whats-new h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
  text-align: center;
}

.changelog-items {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.changelog-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid rgba(0,0,0,0.04);
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.changelog-item:hover {
  background: #f1f5f9;
}

.dark .changelog-item {
  background: rgba(22, 22, 29, 0.6);
  border: 1px solid rgba(255,255,255,0.04);
}

.dark .changelog-item:hover {
  background: rgba(30, 27, 75, 0.3);
}

.changelog-date {
  font-size: 0.7rem;
  font-weight: 600;
  opacity: 0.5;
  white-space: nowrap;
  min-width: 60px;
}

.changelog-badge {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  white-space: nowrap;
}

.changelog-badge.new {
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
}

.dark .changelog-badge.new {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.changelog-badge.improved {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
}

.dark .changelog-badge.improved {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.changelog-text {
  flex: 1;
  line-height: 1.4;
}

@media (max-width: 640px) {
  .changelog-item {
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .changelog-date { min-width: auto; }
}
</style>
