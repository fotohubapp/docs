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

<!-- ─── TECH TAGS ─── -->
<section class="tech-tags">
  <span class="tag tag-purple">REST API</span>
  <span class="tag tag-blue">SSE Streaming</span>
  <span class="tag tag-green">WebSockets</span>
  <span class="tag tag-cyan">OpenAI-Compatible</span>
  <span class="tag tag-orange">JWT + API Keys</span>
  <span class="tag tag-pink">HMAC-SHA256 Webhooks</span>
  <span class="tag tag-purple">pgvector</span>
  <span class="tag tag-blue">S3-Compatible</span>
  <span class="tag tag-green">CDN (CloudFront)</span>
  <span class="tag tag-cyan">Edge Functions (Deno)</span>
  <span class="tag tag-orange">GPU Inference</span>
  <span class="tag tag-pink">Async Jobs</span>
</section>

<!-- ─── STATS BAR ─── -->
<section class="stats-bar">
  <div class="stat"><span class="stat-number">200+</span><span class="stat-label">AI Models</span></div>
  <div class="stat-divider"></div>
  <div class="stat"><span class="stat-number">5</span><span class="stat-label">SDKs</span></div>
  <div class="stat-divider"></div>
  <div class="stat"><span class="stat-number">60+</span><span class="stat-label">Endpoints</span></div>
  <div class="stat-divider"></div>
  <div class="stat"><span class="stat-number">252</span><span class="stat-label">Edge Functions</span></div>
  <div class="stat-divider"></div>
  <div class="stat"><span class="stat-number">&lt;180ms</span><span class="stat-label">P95 Latency</span></div>
  <div class="stat-divider"></div>
  <div class="stat"><span class="stat-number">99.9%</span><span class="stat-label">Uptime SLA</span></div>
</section>

<!-- ─── TERMINAL CODE PREVIEW ─── -->
<section class="code-preview">
  <div class="code-header">
    <div class="code-dots"><span></span><span></span><span></span></div>
    <div class="code-tabs">
      <span class="code-tab active">Python</span>
      <span class="code-tab">TypeScript</span>
      <span class="code-tab">cURL</span>
    </div>
    <span class="code-filename">app.py</span>
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

# Stream chat completions (OpenAI-compatible)
for chunk in client.chat(
    messages=[{"role": "user", "content": "Explain diffusion models in 3 sentences"}],
    model="gemini-flash",
    stream=True
):
    print(chunk["choices"][0]["delta"].get("content", ""), end="")
```

</section>

<!-- ─── INFRA SPECS ─── -->
<section class="infra-section">
  <h3>Infrastructure Specs</h3>
  <div class="infra-grid">
    <div class="infra-card">
      <div class="infra-icon">⚡</div>
      <div class="infra-title">Inference</div>
      <div class="infra-detail">NVIDIA A100 80GB + A10G<br>Local EU inference, no cold starts<br><code>avg 1.8s</code> image generation</div>
    </div>
    <div class="infra-card">
      <div class="infra-icon">🗄️</div>
      <div class="infra-title">Database</div>
      <div class="infra-detail">PostgreSQL 15 + pgvector<br>Row-Level Security on all tables<br><code>252</code> edge functions (Deno)</div>
    </div>
    <div class="infra-card">
      <div class="infra-icon">🌐</div>
      <div class="infra-title">Network</div>
      <div class="infra-detail">Cloudflare WAF + CDN<br>TLS 1.3, HTTP/3 (QUIC)<br><code>eu-central-1</code> data residency</div>
    </div>
    <div class="infra-card">
      <div class="infra-icon">📦</div>
      <div class="infra-title">Storage</div>
      <div class="infra-detail">S3-compatible object storage<br>CloudFront CDN distribution<br><code>11 nines</code> durability</div>
    </div>
  </div>
</section>

<!-- ─── REQUEST FLOW ASCII ─── -->
<section class="ascii-section">
  <h3>Request Flow</h3>
  <div class="ascii-box">
<pre>
  Client ─── HTTPS ──→ Cloudflare WAF ──→ nginx (API Gateway)
                                               │
                    ┌──────────────┬────────────┼────────────┬──────────────┐
                    ▼              ▼            ▼            ▼              ▼
              api-server     image-engine  video-engine  music-server  billing-engine
              :8791          :8090         :8092         :8093         :8094
                │              │              │
                │         ┌────┴────┐    ┌────┴────┐
                ▼         ▼         ▼    ▼         ▼
             Gabriel    BytePlus   BFL  Google   ByteDance
              (AI)      Seedream   FLUX  Veo     Seedance
                        WAN        Grok  Sora    Hailuo

  ┌─────────────────────────────────────────────────────────────────────┐
  │  PostgreSQL 15 │ Supabase Auth │ S3 Storage │ Edge Functions (252)  │
  └─────────────────────────────────────────────────────────────────────┘
</pre>
  </div>
</section>

<!-- ─── MODEL PROVIDERS ─── -->
<section class="providers-section">
  <h3>Providers Under the Hood</h3>
  <div class="provider-tags">
    <span class="provider">Google <span class="prov-count">Veo 3.1 · Imagen 4 · Gemini 2.5</span></span>
    <span class="provider">BytePlus <span class="prov-count">Seedream 5 · Seedance 2</span></span>
    <span class="provider">Black Forest Labs <span class="prov-count">FLUX 2 Pro/Max/Flex</span></span>
    <span class="provider">Anthropic <span class="prov-count">Claude Opus 4 · Sonnet 4.6</span></span>
    <span class="provider">OpenAI <span class="prov-count">GPT-4o · Sora 2</span></span>
    <span class="provider">xAI <span class="prov-count">Grok Imagine · Grok Video</span></span>
    <span class="provider">DeepSeek <span class="prov-count">R1 · V3</span></span>
    <span class="provider">MiniMax <span class="prov-count">Hailuo · Music Gen</span></span>
    <span class="provider">Stability AI <span class="prov-count">SD3 · Stable Audio</span></span>
    <span class="provider">Kling <span class="prov-count">Kling 2.0</span></span>
  </div>
</section>

<!-- ─── SDK INSTALL ─── -->
<section class="sdk-strip">
  <h3>Install in seconds</h3>
  <div class="sdk-grid">
    <div class="sdk-card">
      <code>pip install fotohub</code>
      <span class="sdk-badge">Python 3.8+ · PyPI</span>
    </div>
    <div class="sdk-card">
      <code>npm install fotohub</code>
      <span class="sdk-badge">Node 18+ · npm</span>
    </div>
    <div class="sdk-card">
      <code>composer require fotohub/sdk</code>
      <span class="sdk-badge">PHP 8.1+ · Packagist</span>
    </div>
  </div>
  <div class="sdk-features">
    <span class="sdk-feat">Full TypeScript types</span>
    <span class="sdk-feat">Streaming support</span>
    <span class="sdk-feat">Auto-retry + backoff</span>
    <span class="sdk-feat">Async/await</span>
    <span class="sdk-feat">Zero dependencies (Node)</span>
  </div>
</section>

<!-- ─── LATENCY TABLE ─── -->
<section class="perf-section">
  <h3>Performance Benchmarks</h3>
  <div class="perf-table">
    <div class="perf-row perf-header">
      <span>Operation</span><span>Model</span><span>P50</span><span>P95</span><span>Credits</span>
    </div>
    <div class="perf-row">
      <span>Image Gen</span><span class="mono">seedream-5-0</span><span class="perf-fast">1.8s</span><span>2.4s</span><span class="perf-credit">1.0</span>
    </div>
    <div class="perf-row">
      <span>Image Gen</span><span class="mono">flux-2-pro</span><span>3.2s</span><span>4.8s</span><span class="perf-credit">1.5</span>
    </div>
    <div class="perf-row">
      <span>Video Gen</span><span class="mono">seedance-2-fast</span><span>12s</span><span>18s</span><span class="perf-credit">1.0</span>
    </div>
    <div class="perf-row">
      <span>Chat (TTFT)</span><span class="mono">gemini-flash</span><span class="perf-fast">85ms</span><span>140ms</span><span class="perf-credit">~0.2</span>
    </div>
    <div class="perf-row">
      <span>Gabriel Route</span><span class="mono">gemma-4-e2b</span><span class="perf-fast">320ms</span><span>480ms</span><span class="perf-credit">0</span>
    </div>
    <div class="perf-row">
      <span>Suggest</span><span class="mono">fuzzy-match</span><span class="perf-fast">8ms</span><span>18ms</span><span class="perf-credit">0</span>
    </div>
  </div>
</section>

<!-- ─── WHAT'S NEW ─── -->
<section class="whats-new">
  <h3>What's New</h3>
  <div class="changelog-items">
    <div class="changelog-item">
      <span class="changelog-date">Jul 2026</span>
      <span class="changelog-badge new">NEW</span>
      <span class="changelog-text">Gabriel AI Orchestrator — NL routing, prompt enhancement, inline suggestions, auto-send</span>
    </div>
    <div class="changelog-item">
      <span class="changelog-date">Jul 2026</span>
      <span class="changelog-badge new">NEW</span>
      <span class="changelog-text">Usage & Analytics API — real-time monitoring, cost breakdown, anomaly detection</span>
    </div>
    <div class="changelog-item">
      <span class="changelog-date">Jul 2026</span>
      <span class="changelog-badge improved">UPD</span>
      <span class="changelog-text">Seedance 2.0 Pro/Fast/Mini — next-gen video, 1 credit flat</span>
    </div>
    <div class="changelog-item">
      <span class="changelog-date">Jun 2026</span>
      <span class="changelog-badge improved">UPD</span>
      <span class="changelog-text">Tier system v2 — PAYG auto-resolution, wallet, burst limits, per-project caps</span>
    </div>
    <div class="changelog-item">
      <span class="changelog-date">Jun 2026</span>
      <span class="changelog-badge new">NEW</span>
      <span class="changelog-text">Brand Assets API — upload logos, colors, fonts for brand-consistent generation</span>
    </div>
  </div>
</section>

<!-- ─── FOOTER CTA ─── -->
<section class="footer-cta">
  <div class="cta-content">
    <h3>Ready to ship?</h3>
    <p>50 free credits. No credit card required. First image in 60 seconds.</p>
    <div class="cta-buttons">
      <a href="/api/getting-started" class="cta-btn primary">Get API Key →</a>
      <a href="/guides/quickstart" class="cta-btn secondary">Read Quickstart</a>
    </div>
  </div>
  <div class="cta-terminal">
    <code>$ curl -X POST apis.fotohub.app/v1/ai/generate/image \</code>
    <code>    -H "Authorization: Bearer fh_live_..." \</code>
    <code>    -d '{"prompt":"hello world","model":"seedream-5-0-260128"}'</code>
    <code class="cta-response">← 200 OK  (1.8s · 1 credit · eu-central-1)</code>
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

/* ─── Tech tags ─── */

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  max-width: 800px;
  margin: -1rem auto 2rem;
  padding: 0 1rem;
}

.tag {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  border: 1px solid;
  transition: all 0.2s ease;
  cursor: default;
}

.tag:hover {
  transform: translateY(-1px);
}

.tag-purple { background: rgba(124,58,237,0.08); border-color: rgba(124,58,237,0.2); color: #7c3aed; }
.tag-blue { background: rgba(37,99,235,0.08); border-color: rgba(37,99,235,0.2); color: #2563eb; }
.tag-green { background: rgba(5,150,105,0.08); border-color: rgba(5,150,105,0.2); color: #059669; }
.tag-cyan { background: rgba(8,145,178,0.08); border-color: rgba(8,145,178,0.2); color: #0891b2; }
.tag-orange { background: rgba(217,119,6,0.08); border-color: rgba(217,119,6,0.2); color: #d97706; }
.tag-pink { background: rgba(219,39,119,0.08); border-color: rgba(219,39,119,0.2); color: #db2777; }

.dark .tag-purple { background: rgba(167,139,250,0.1); border-color: rgba(167,139,250,0.25); color: #c4b5fd; }
.dark .tag-blue { background: rgba(96,165,250,0.1); border-color: rgba(96,165,250,0.25); color: #93c5fd; }
.dark .tag-green { background: rgba(52,211,153,0.1); border-color: rgba(52,211,153,0.25); color: #6ee7b7; }
.dark .tag-cyan { background: rgba(34,211,238,0.1); border-color: rgba(34,211,238,0.25); color: #67e8f9; }
.dark .tag-orange { background: rgba(251,191,36,0.1); border-color: rgba(251,191,36,0.25); color: #fcd34d; }
.dark .tag-pink { background: rgba(244,114,182,0.1); border-color: rgba(244,114,182,0.25); color: #f9a8d4; }

/* ─── Code filename ─── */

.code-filename {
  font-size: 0.68rem;
  font-weight: 500;
  opacity: 0.45;
  font-family: 'JetBrains Mono', monospace;
  margin-left: auto;
}

/* ─── Infrastructure Specs ─── */

.infra-section {
  max-width: 800px;
  margin: 0 auto 3rem;
  padding: 0 1rem;
}

.infra-section h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1.2rem;
  letter-spacing: -0.02em;
  text-align: center;
}

.infra-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.infra-card {
  padding: 1.2rem;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid rgba(0,0,0,0.06);
  transition: all 0.25s ease;
}

.infra-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}

.dark .infra-card {
  background: rgba(22, 22, 29, 0.7);
  border: 1px solid rgba(255,255,255,0.06);
}

.dark .infra-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  border-color: rgba(167,139,250,0.2);
}

.infra-icon {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.infra-title {
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
  letter-spacing: -0.01em;
}

.infra-detail {
  font-size: 0.75rem;
  line-height: 1.6;
  opacity: 0.7;
}

.infra-detail code {
  font-size: 0.7rem;
  font-weight: 600;
  color: #7c3aed;
  background: rgba(124,58,237,0.08);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

.dark .infra-detail code {
  color: #c4b5fd;
  background: rgba(167,139,250,0.12);
}

/* ─── ASCII Request Flow ─── */

.ascii-section {
  max-width: 800px;
  margin: 0 auto 3rem;
  padding: 0 1rem;
}

.ascii-section h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
  text-align: center;
}

.ascii-box {
  background: #0f172a;
  border-radius: 12px;
  padding: 1.5rem;
  overflow-x: auto;
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.ascii-box pre {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  line-height: 1.5;
  color: #94a3b8;
  margin: 0;
  white-space: pre;
}

.dark .ascii-box {
  background: #0c0c14;
  border-color: rgba(124,58,237,0.15);
}

@media (max-width: 640px) {
  .ascii-box pre { font-size: 0.5rem; }
  .ascii-box { padding: 1rem 0.75rem; }
}

/* ─── Providers ─── */

.providers-section {
  max-width: 800px;
  margin: 0 auto 3rem;
  padding: 0 1rem;
}

.providers-section h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
  text-align: center;
}

.provider-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.provider {
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  background: #f1f5f9;
  border: 1px solid rgba(0,0,0,0.06);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
}

.provider:hover {
  border-color: #7c3aed;
  transform: translateY(-1px);
}

.dark .provider {
  background: rgba(22, 22, 29, 0.7);
  border: 1px solid rgba(255,255,255,0.08);
}

.dark .provider:hover {
  border-color: #a78bfa;
}

.prov-count {
  font-size: 0.65rem;
  font-weight: 400;
  opacity: 0.55;
}

/* ─── SDK features ─── */

.sdk-features {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 1rem;
}

.sdk-feat {
  font-size: 0.65rem;
  font-weight: 500;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: rgba(124,58,237,0.06);
  color: #6d28d9;
}

.dark .sdk-feat {
  background: rgba(167,139,250,0.1);
  color: #c4b5fd;
}

/* ─── Performance table ─── */

.perf-section {
  max-width: 720px;
  margin: 0 auto 3rem;
  padding: 0 1rem;
}

.perf-section h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
  text-align: center;
}

.perf-table {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.06);
}

.dark .perf-table {
  border-color: rgba(255,255,255,0.06);
}

.perf-row {
  display: grid;
  grid-template-columns: 1.2fr 1.5fr 0.7fr 0.7fr 0.8fr;
  align-items: center;
  padding: 0.6rem 1rem;
  font-size: 0.78rem;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}

.dark .perf-row {
  border-bottom-color: rgba(255,255,255,0.04);
}

.perf-row:last-child {
  border-bottom: none;
}

.perf-header {
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.6;
  background: #f8fafc;
}

.dark .perf-header {
  background: rgba(22, 22, 29, 0.8);
}

.perf-row:not(.perf-header):nth-child(even) {
  background: rgba(0,0,0,0.015);
}

.dark .perf-row:not(.perf-header):nth-child(even) {
  background: rgba(255,255,255,0.015);
}

.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
}

.perf-fast {
  color: #059669;
  font-weight: 600;
}

.dark .perf-fast {
  color: #34d399;
}

.perf-credit {
  font-weight: 600;
  color: #7c3aed;
}

.dark .perf-credit {
  color: #a78bfa;
}

@media (max-width: 640px) {
  .perf-row { font-size: 0.68rem; padding: 0.5rem 0.6rem; }
  .mono { font-size: 0.6rem; }
}

/* ─── Footer CTA ─── */

.footer-cta {
  max-width: 800px;
  margin: 0 auto 3rem;
  padding: 2rem;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(124,58,237,0.06), rgba(37,99,235,0.06));
  border: 1px solid rgba(124,58,237,0.12);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: center;
}

.dark .footer-cta {
  background: linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.06));
  border-color: rgba(124,58,237,0.2);
}

.cta-content h3 {
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 0.5rem;
}

.cta-content p {
  font-size: 0.85rem;
  opacity: 0.7;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.cta-buttons {
  display: flex;
  gap: 0.75rem;
}

.cta-btn {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.cta-btn.primary {
  background: #7c3aed;
  color: white;
}

.cta-btn.primary:hover {
  background: #6d28d9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124,58,237,0.3);
}

.cta-btn.secondary {
  background: rgba(0,0,0,0.04);
  color: inherit;
  border: 1px solid rgba(0,0,0,0.1);
}

.dark .cta-btn.secondary {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.1);
}

.cta-btn.secondary:hover {
  background: rgba(0,0,0,0.08);
}

.dark .cta-btn.secondary:hover {
  background: rgba(255,255,255,0.08);
}

.cta-terminal {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  background: #0f172a;
  padding: 1rem;
  border-radius: 10px;
  color: #94a3b8;
  overflow-x: auto;
}

.dark .cta-terminal {
  background: #0c0c14;
}

.cta-terminal code {
  white-space: nowrap;
  background: none;
  padding: 0;
  color: inherit;
  font-size: inherit;
}

.cta-response {
  color: #22c55e !important;
  margin-top: 0.3rem;
}

@media (max-width: 768px) {
  .footer-cta {
    grid-template-columns: 1fr;
    padding: 1.5rem;
    gap: 1.5rem;
  }
  .cta-buttons { flex-direction: column; }
}
</style>
