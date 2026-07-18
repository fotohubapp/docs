---
layout: home
hero:
  name: FOTOhub
  text: Developers & Integrations
  tagline: Build with 200+ AI models & integrations, cloud computing, S3 storage, and agent workflows — all through a single API. Token-based pricing, enterprise security, real-time webhooks.
  image:
    light: /logo-light.png
    dark: /logo-dark.png
    alt: FOTOhub
  actions:
    - theme: brand
      text: Get Started
      link: /api/getting-started
    - theme: alt
      text: API Reference
      link: /api/image-generation
    - theme: alt
      text: Python SDK
      link: /sdk/python

features:
  - icon: 🖼️
    title: Image Generation
    details: 25+ models — SeedDream 5.0, FLUX 2, Grok Imagine, WAN, Google Imagen. Text-to-image, image-to-image, inpainting, upscaling. From 0.7 credits/image.
    link: /api/image-generation
    linkText: Image API →
  - icon: 🎬
    title: Video Generation
    details: 15+ models — Seedance 2.0, Veo 3.1, Hailuo, Sora 2, Kling, WAN. Text-to-video, image-to-video, up to 60s. Async jobs with polling.
    link: /api/video-generation
    linkText: Video API →
  - icon: 🎵
    title: Music & Audio
    details: Music generation, sound effects, TTS (30+ voices), speech-to-text, translation, dubbing. Stable Audio, MMAudio, ElevenLabs, Chatterbox.
    link: /api/music-audio
    linkText: Audio API →
  - icon: 💬
    title: Chat / LLM
    details: OpenAI-compatible chat completions. Claude 4, GPT-4o, Gemini 2.5, DeepSeek R1. Streaming, function calling, vision. Per-token billing.
    link: /api/chat-llm
    linkText: Chat API →
  - icon: 🤖
    title: Agent Workflows
    details: Build complex AI pipelines with a visual DAG editor. 8 node types, Temporal orchestration, SSE event streaming, scheduled triggers.
    link: /api/agents
    linkText: Agents API →
  - icon: 🧠
    title: Gabriel AI Orchestrator
    details: Intent classification that routes natural language to the correct feature with optimal model selection. Credit estimation, zero-auth, 30 req/min.
    link: /api/gabriel-ai
    linkText: Gabriel API →
  - icon: ☁️
    title: Cloud Computing
    details: Provision GPU instances on demand — A10G, A100, H100. Per-hour billing, spot pricing (60% savings), custom startup scripts, SSH access.
    link: /api/cloud-computing
    linkText: Compute API →
  - icon: 📦
    title: S3 Cloud Storage
    details: Enterprise S3 with 60+ endpoints — presigned URLs, multipart upload, CDN (CloudFront), lifecycle policies, versioning, encryption, replication.
    link: /api/storage
    linkText: Storage API →
  - icon: 📊
    title: Usage & Analytics
    details: Real-time usage monitoring, daily cost breakdown, top models/endpoints, per-key stats. Build custom dashboards with comprehensive analytics data.
    link: /api/usage-analytics
    linkText: Usage API →
  - icon: 💳
    title: Billing & Pricing
    details: Dual billing — credits for predictable costs, tokens for precision. Wallet with auto-topup, hard spending limits per project, buster packs.
    link: /api/billing
    linkText: Billing API →
  - icon: 🔔
    title: Webhooks
    details: Real-time HTTP notifications — generation events, credit alerts, billing charges. HMAC-SHA256 signed, 3x retry with exponential backoff.
    link: /api/webhooks
    linkText: Webhooks →
  - icon: 🔐
    title: Console & Security
    details: Full developer console API — projects, API keys with IP allowlists, rate limits, fraud detection, system health monitoring. RBAC scopes.
    link: /api/console-api
    linkText: Console API →
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #7c3aed 30%, #2563eb);
  --vp-home-hero-image-background-image: linear-gradient(-45deg, #7c3aed50 50%, #2563eb50 50%);
  --vp-home-hero-image-filter: blur(44px);
}

.dark {
  --vp-home-hero-image-background-image: linear-gradient(-45deg, #7c3aed30 50%, #2563eb30 50%);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}
</style>
