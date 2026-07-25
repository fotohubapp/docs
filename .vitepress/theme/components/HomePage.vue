<script setup>
import { ref, onMounted } from 'vue'
import { data as blogPostsData } from '../blogPosts.data'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getCoverUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) {
    if (path.includes('fotohub.app/') && !path.includes('s1.fotohub.app') && !path.includes('static.fotohub.app')) {
      const filename = path.split('/').pop()
      return `https://static.fotohub.app/blog/${filename}`
    }
    return path
  }
  return `https://s1.fotohub.app/storage/v1/object/public/photos/${path}`
}

// Scroll-triggered reveal
const revealed = ref(new Set())
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        revealed.value.add(entry.target.dataset.reveal)
        revealed.value = new Set(revealed.value)
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })

  document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el))
})

// ─── Static data ───
const products = [
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`,
    title: 'API Platform',
    description: 'Use our APIs and 200+ models to build your own AI experiences — images, video, audio, chat, 3D.',
    link: '/api/getting-started'
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
    title: 'MCP Server',
    description: 'Connect FOTOhub to Claude, ChatGPT, Cursor, and any AI assistant via Model Context Protocol.',
    link: '/integrations/mcp'
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m8 6 4-4 4 4"/><path d="M12 2v10.3"/><path d="M4 13.4A2 2 0 0 0 3 15v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1a2 2 0 0 0-1-1.7"/><path d="M21 21H3"/><path d="M15 21v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/></svg>`,
    title: 'SDKs & Tools',
    description: 'Python, TypeScript, PHP SDKs with streaming, auto-retry, and full type safety.',
    link: '/sdk/python'
  }
]

const features = [
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    title: 'Image Generation',
    description: '25+ models — Seedream 5.0, FLUX.2, Grok Imagine, WAN 2.6, Gemini. Text-to-image, img2img, inpainting, upscaling. From 0.7 cr/image.',
    link: '/api/image-generation',
    accent: '#7c3aed'
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>`,
    title: 'Video Generation',
    description: '15+ models — Seedance 2.0, Veo 3.1, Sora 2 Pro, Hailuo, WAN 2.6, Grok Video. Text-to-video, image-to-video, up to 60s.',
    link: '/api/video-generation',
    accent: '#e11d48'
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    title: 'Music & Audio',
    description: 'Music generation, SFX, 30+ TTS voices, speech-to-text, translation, dubbing. MiniMax, IDA Music, Stable Audio.',
    link: '/api/music-audio',
    accent: '#f59e0b'
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    title: 'Chat / LLM',
    description: '35+ models, OpenAI-compatible. Claude 4.6, GPT-5.1, DeepSeek V3.2/R1, Grok 4.1, Qwen3, Devstral 2. Streaming, tool use, vision.',
    link: '/api/chat-llm',
    accent: '#059669'
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3z"/><path d="M12 12l9-4.5"/><path d="M12 12v9"/><path d="M12 12L3 7.5"/></svg>`,
    title: '3D Generation',
    description: 'Image-to-3D & text-to-3D. TripoSR, SF3D, Hunyuan3D, TRELLIS. GLB/OBJ/STL/USDZ export. PBR materials.',
    link: '/api/3d-generation',
    accent: '#0891b2'
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
    title: 'Gabriel AI Orchestrator',
    description: 'Natural language routing. Intent classification, model selection, prompt enhancement, workflow orchestration. Free tier.',
    link: '/api/gabriel-ai',
    accent: '#7c3aed'
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`,
    title: 'IDA Q 1.0',
    description: 'FOTOhub proprietary image model. Best-in-class text rendering, native multilingual prompts, top-5 worldwide benchmark. 0.10 PLN/image.',
    link: '/api/ida-q',
    accent: '#06b6d4'
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,
    title: 'Agent Workflows',
    description: 'Visual DAG editor for AI pipelines. 8 node types, event streaming, scheduled triggers, Temporal orchestration.',
    link: '/api/agents',
    accent: '#2563eb'
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
    title: 'Cloud GPU',
    description: 'On-demand A10G, A100, H100. Per-hour billing, spot pricing (60% off), SSH access, custom images.',
    link: '/api/cloud-computing',
    accent: '#4f46e5'
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>`,
    title: 'S3 Storage',
    description: 'Enterprise object storage — presigned URLs, multipart, CDN, lifecycle, versioning, encryption. 60+ endpoints.',
    link: '/api/storage',
    accent: '#0d9488'
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`,
    title: 'Usage Analytics',
    description: 'Real-time monitoring, cost breakdown by model/endpoint/key, daily trends, anomaly detection.',
    link: '/api/usage-analytics',
    accent: '#d97706'
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
    title: 'Billing Engine',
    description: 'Dual billing — credits (predictable) or tokens (precise). Wallet, auto-topup, hard limits per project, buster packs.',
    link: '/api/billing',
    accent: '#dc2626'
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
    title: 'Webhooks',
    description: 'Real-time HTTP events — generation, credits, billing. HMAC-SHA256 signed, 3x retry, exponential backoff.',
    link: '/api/webhooks',
    accent: '#1d4ed8'
  }
]

const useCases = [
  {
    title: 'Use cases',
    description: 'Learn how teams are using FOTOhub API to automate content, build products, and ship faster.',
    button: 'Explore use cases',
    link: '/guides/best-practices',
    image: 'https://static.fotohub.app/images/docs/usecase-ecommerce.png'
  },
  {
    title: 'Showcase',
    description: 'Discover what developers are building with FOTOhub — integrations, apps, creative workflows.',
    button: 'Explore demos',
    link: '/integrations/overview',
    image: 'https://static.fotohub.app/images/docs/showcase-creative-ai.png'
  }
]

const guides = [
  { title: 'Quickstart', category: 'Getting Started', link: '/guides/quickstart', image: 'https://static.fotohub.app/images/docs/guide-quickstart.png' },
  { title: 'Image Generation', category: 'Tutorials', link: '/guides/image-generation', image: 'https://static.fotohub.app/images/docs/guide-image-generation.png' },
  { title: 'MCP Integration', category: 'Integrations', link: '/guides/mcp-integration', image: 'https://static.fotohub.app/images/docs/guide-mcp-integration.png' }
]

const stats = [
  { value: '200+', label: 'AI models' },
  { value: '10+', label: 'Providers' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<200ms', label: 'API latency' }
]

const resources = [
  { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`, title: 'Documentation', description: 'Complete API reference and guides', link: '/api/getting-started' },
  { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`, title: 'Community', description: 'Join our Discord and connect with developers', link: 'https://discord.gg/fotohub' },
  { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`, title: 'Status', description: 'Check the status of FOTOhub services', link: 'https://status.fotohub.app' },
  { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`, title: 'Console', description: 'Manage your API keys and usage', link: 'https://fotohub.app/console' }
]
</script>

<template>
  <div class="home-page">
    <!-- Hero with animated gradient mesh -->
    <section class="hero" data-reveal="hero">
      <div class="hero-glow"></div>
      <div class="hero-grid-bg"></div>
      <div class="hero-split">
        <div class="hero-left" :class="{ 'is-visible': revealed.has('hero') }">
          <h1 class="hero-title">Build with the full power of generative AI</h1>
          <p class="hero-subtitle">Docs and resources to help you build with FOTOhub — images, video, music, 3D, chat, agents. One unified API.</p>
          <ul class="hero-points">
            <li><span class="hero-point-check">✓</span>One SDK, 200+ models — no provider juggling</li>
            <li><span class="hero-point-check">✓</span>Chain image &rarr; video &rarr; audio in a few lines</li>
            <li><span class="hero-point-check">✓</span>Typed Python &amp; TypeScript, streaming, auto-retry</li>
          </ul>
          <div class="hero-actions">
            <a href="/api/getting-started" class="btn-primary">Get started</a>
            <a href="/api/image-generation" class="btn-secondary">API Reference</a>
          </div>
          <div class="hero-install">
            <code>pip install fotohub</code>
            <span class="hero-install-sep"></span>
            <code>npm install fotohub</code>
            <span class="hero-install-sep"></span>
            <code>npm install -g fotohubapp-cli</code>
          </div>
        </div>
        <div class="hero-right" :class="{ 'is-visible': revealed.has('hero') }">
          <div class="hero-code-window">
            <div class="hero-code-dots"><span></span><span></span><span></span></div>
            <pre><code><span class="hl-kw">from</span> <span class="hl-mod">fotohub</span> <span class="hl-kw">import</span> FotoHub
client = FotoHub()

<span class="hl-cm"># Generate an image</span>
image = client.<span class="hl-fn">generate_image</span>(
    <span class="hl-param">prompt</span>=<span class="hl-str">"A serene mountain lake at golden hour"</span>,
    <span class="hl-param">model</span>=<span class="hl-str">"seedream-5-0-260128"</span>,
    <span class="hl-param">aspect_ratio</span>=<span class="hl-str">"16:9"</span>
)

<span class="hl-cm"># Chat with any model — same client</span>
reply = client.<span class="hl-fn">chat</span>(
    <span class="hl-param">message</span>=<span class="hl-str">"Describe this image in one sentence"</span>,
    <span class="hl-param">image_url</span>=image[<span class="hl-str">"images"</span>][<span class="hl-num">0</span>]
)</code></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Bar (with Gabriel AI orchestrator + IDA Q 1.0) -->
    <section class="stats-bar" data-reveal="stats">
      <div class="stat-proprietary-col">
        <a href="/api/gabriel-ai" class="stat-gabriel" :class="{ 'is-visible': revealed.has('stats') }">
          <div class="stat-gabriel-glow"></div>
          <span class="stat-gabriel-badge"><span class="stat-gabriel-dot"></span>Orchestrator</span>
          <span class="stat-gabriel-name">Gabriel AI</span>
          <span class="stat-gabriel-desc">Natural-language routing to every model</span>
        </a>
        <a href="/api/ida-q" class="stat-idaq" :class="{ 'is-visible': revealed.has('stats') }">
          <div class="stat-idaq-glow"></div>
          <span class="stat-idaq-badge"><span class="stat-idaq-dot"></span>Proprietary Model</span>
          <span class="stat-idaq-name">IDA Q 1.0</span>
          <span class="stat-idaq-desc">Precision text rendering, in-house image generation</span>
        </a>
      </div>
      <div class="stat-grid">
        <div v-for="(stat, i) in stats" :key="stat.label" class="stat-item" :class="{ 'is-visible': revealed.has('stats') }" :style="{ transitionDelay: `${i * 80}ms` }">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </section>

    <!-- Product Cards -->
    <section class="section products" data-reveal="products">
      <div class="products-grid">
        <a v-for="(product, i) in products" :key="product.title" :href="product.link" class="product-card" :class="{ 'is-visible': revealed.has('products') }" :style="{ transitionDelay: `${i * 100}ms` }">
          <div class="product-icon" v-html="product.icon"></div>
          <h3 class="product-title">{{ product.title }}</h3>
          <p class="product-desc">{{ product.description }}</p>
          <span class="product-arrow">&rarr;</span>
        </a>
      </div>
    </section>

    <!-- Features Grid (all 12 capabilities) -->
    <section class="section features" data-reveal="features">
      <div class="section-header">
        <h2 class="section-title">Capabilities</h2>
        <a href="/api/getting-started" class="view-all">View all APIs &rarr;</a>
      </div>
      <div class="features-grid">
        <a v-for="(feat, i) in features" :key="feat.title" :href="feat.link" class="feature-card" :class="{ 'is-visible': revealed.has('features') }" :style="{ transitionDelay: `${i * 50}ms` }">
          <div class="feature-icon-wrap" :style="{ '--accent': feat.accent }">
            <div class="feature-icon" v-html="feat.icon" :style="{ color: feat.accent }"></div>
          </div>
          <div class="feature-body">
            <h4 class="feature-title">{{ feat.title }}</h4>
            <p class="feature-desc">{{ feat.description }}</p>
          </div>
        </a>
      </div>
    </section>

    <!-- Featured -->
    <section class="section featured" data-reveal="featured">
      <div class="featured-card" :class="{ 'is-visible': revealed.has('featured') }">
        <div class="featured-content">
          <span class="featured-label">Featured</span>
          <h3 class="featured-title">Gabriel AI Orchestrator</h3>
          <p class="featured-desc">Natural language routing to 200+ models. Intent classification, prompt enhancement, auto-failover. Just describe what you need — Gabriel picks the best model and optimizes your prompt automatically.</p>
          <a href="/api/gabriel-ai" class="featured-link">Read the Gabriel AI guide &rarr;</a>
        </div>
        <div class="featured-visual" style="background-image: url(https://static.fotohub.app/images/docs/gabriel-orchestrator.png)">
          <div class="featured-visual-overlay"></div>
        </div>
      </div>
    </section>

    <!-- Use Cases -->
    <section class="section use-cases" data-reveal="usecases">
      <div class="use-cases-grid">
        <div v-for="(uc, i) in useCases" :key="uc.title" class="use-case-card" :class="{ 'is-visible': revealed.has('usecases') }" :style="{ transitionDelay: `${i * 120}ms` }">
          <div class="use-case-visual" :style="{ backgroundImage: `url(${uc.image})` }"></div>
          <div class="use-case-content">
            <h3 class="use-case-title">{{ uc.title }}</h3>
            <p class="use-case-desc">{{ uc.description }}</p>
            <a :href="uc.link" class="btn-dark">{{ uc.button }} &rarr;</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Blog Posts (Build-time loaded from Supabase) -->
    <section class="section blog" v-if="blogPostsData && blogPostsData.length" data-reveal="blog">
      <div class="section-header">
        <h2 class="section-title">Latest from the blog</h2>
        <a href="https://fotohub.app/news" class="view-all" target="_blank">View all &rarr;</a>
      </div>
      <div class="blog-grid">
        <a v-for="(post, i) in blogPostsData.slice(0, 3)" :key="post.slug" :href="`https://fotohub.app/news/${post.slug}`" target="_blank" class="blog-card" :class="{ 'is-visible': revealed.has('blog') }" :style="{ transitionDelay: `${i * 100}ms` }">
          <div class="blog-cover" :style="getCoverUrl(post.cover_image) ? { backgroundImage: `url(${getCoverUrl(post.cover_image)})` } : { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }">
            <span v-if="post.category" class="blog-tag">{{ post.category.name }}</span>
          </div>
          <div class="blog-body">
            <h4 class="blog-title">{{ post.title }}</h4>
            <p class="blog-desc">{{ post.excerpt }}</p>
            <span class="blog-meta">{{ formatDate(post.created_at) }}</span>
          </div>
        </a>
      </div>
    </section>

    <!-- Guides Grid -->
    <section class="section guides" data-reveal="guides">
      <div class="section-header">
        <h2 class="section-title">Guides & tutorials</h2>
        <a href="/guides/quickstart" class="view-all">View all &rarr;</a>
      </div>
      <div class="guides-grid">
        <a v-for="(guide, i) in guides" :key="guide.title" :href="guide.link" class="guide-card" :class="{ 'is-visible': revealed.has('guides') }" :style="{ transitionDelay: `${i * 100}ms` }">
          <div class="guide-thumb" :style="{ backgroundImage: `url(${guide.image})` }">
            <div class="guide-thumb-overlay"></div>
          </div>
          <div class="guide-text">
            <h4 class="guide-title">{{ guide.title }}</h4>
            <span class="guide-category">{{ guide.category }}</span>
          </div>
        </a>
      </div>
    </section>

    <!-- Resources -->
    <section class="section resources" data-reveal="resources">
      <div class="resources-grid">
        <a v-for="(res, i) in resources" :key="res.title" :href="res.link" class="resource-item" :class="{ 'is-visible': revealed.has('resources') }" :style="{ transitionDelay: `${i * 80}ms` }">
          <div class="resource-icon" v-html="res.icon"></div>
          <h4 class="resource-title">{{ res.title }}</h4>
          <p class="resource-desc">{{ res.description }}</p>
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ─── Keyframes ─── */
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(1deg); }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes grid-fade {
  0% { opacity: 0; }
  50% { opacity: 0.4; }
  100% { opacity: 0; }
}

/* ─── Hero ─── */
.hero {
  padding: 80px 0 72px;
  position: relative;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  top: -40%;
  left: 0;
  right: 0;
  width: 100%;
  height: 700px;
  background: radial-gradient(ellipse 100% 80% at 50% 0%, rgba(124, 58, 237, 0.1) 0%, rgba(124, 58, 237, 0.04) 40%, transparent 70%);
  animation: pulse-glow 6s ease-in-out infinite;
  pointer-events: none;
}

.dark .hero-glow {
  background: radial-gradient(ellipse 100% 80% at 50% 0%, rgba(167, 139, 250, 0.12) 0%, rgba(124, 58, 237, 0.05) 40%, transparent 70%);
}

.hero-grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
  animation: grid-fade 8s ease-in-out infinite;
  pointer-events: none;
}

.dark .hero-grid-bg {
  background-image:
    linear-gradient(rgba(167, 139, 250, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(167, 139, 250, 0.05) 1px, transparent 1px);
}

.hero-split {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 40px;
  align-items: center;
  position: relative;
}

.hero-left {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-left.is-visible { opacity: 1; transform: translateY(0); }

.hero-right {
  opacity: 0;
  transform: translateY(20px) translateX(20px);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
}

.hero-right.is-visible { opacity: 1; transform: translateY(0) translateX(0); }

.hero-title {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -0.035em;
  color: var(--vp-c-text-1);
  margin: 0 0 14px;
  line-height: 1.12;
}

.hero-subtitle {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin: 0 0 20px;
}

.hero-points {
  list-style: none;
  padding: 0;
  margin: 0 0 26px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.hero-points li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.hero-point-check {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 800;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.hero-install {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
  flex-wrap: wrap;
}

.hero-install code {
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 6px 12px;
}

.hero-install-sep {
  width: 1px;
  height: 16px;
  background: var(--vp-c-divider);
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 13px 28px;
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
  border-radius: 100px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.btn-primary:hover {
  transform: translateY(-1px);
  opacity: 0.88;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 13px 28px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
  border-radius: 100px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  backdrop-filter: blur(8px);
}

.btn-secondary:hover {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-brand-1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
}

/* ─── Hero Code Block ─── */
.hero-code-window {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px 24px;
  text-align: left;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.7;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
}

.dark .hero-code-window {
  background: #111118;
  border-color: #1e1e2a;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.hero-code-dots {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
}

.hero-code-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vp-c-divider);
}

.hero-code-window pre {
  margin: 0;
  padding: 0;
  background: none;
  overflow-x: auto;
}

.hero-code-window code {
  color: var(--vp-c-text-1);
  font-size: 13px;
  white-space: pre;
}

.hero-code-window .hl-kw { color: #7c3aed; }
.hero-code-window .hl-mod { color: var(--vp-c-text-1); }
.hero-code-window .hl-param { color: #059669; }
.hero-code-window .hl-str { color: #d97706; }
.hero-code-window .hl-num { color: #0891b2; }
.hero-code-window .hl-fn { color: #2563eb; }
.hero-code-window .hl-cm { color: var(--vp-c-text-3); font-style: italic; }

.dark .hero-code-window .hl-kw { color: #a78bfa; }
.dark .hero-code-window .hl-param { color: #6ee7b7; }
.dark .hero-code-window .hl-str { color: #fbbf24; }
.dark .hero-code-window .hl-num { color: #67e8f9; }
.dark .hero-code-window .hl-fn { color: #93c5fd; }

/* ─── Stats Bar (Gabriel + stats) ─── */
.stats-bar {
  display: grid;
  grid-template-columns: 1.1fr 2fr;
  gap: 1px;
  margin-bottom: 80px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  overflow: hidden;
  background: var(--vp-c-divider);
}

/* Column stacking Gabriel + IDA Q proprietary-model cells */
.stat-proprietary-col {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--vp-c-divider);
}

/* Gabriel lead cell */
.stat-gabriel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 24px 28px;
  text-decoration: none;
  overflow: hidden;
  background: linear-gradient(140deg, var(--vp-c-bg) 0%, var(--vp-c-brand-soft) 160%);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease;
  opacity: 0;
  transform: translateY(16px);
}

.stat-gabriel.is-visible { opacity: 1; transform: translateY(0); }
.stat-gabriel:hover { background: linear-gradient(140deg, var(--vp-c-bg-soft) 0%, var(--vp-c-brand-soft) 140%); }

.stat-gabriel-glow {
  position: absolute;
  top: -70%;
  right: -40%;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.16) 0%, transparent 65%);
  border-radius: 50%;
  animation: pulse-glow 6s ease-in-out infinite;
  pointer-events: none;
}

.stat-gabriel-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--vp-c-brand-1);
  position: relative;
  z-index: 1;
}

.stat-gabriel-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 6px var(--vp-c-brand-1);
  animation: pulse-glow 2s ease-in-out infinite;
}

.stat-gabriel-name {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--vp-c-text-1);
  line-height: 1.05;
  position: relative;
  z-index: 1;
}

.stat-gabriel-desc {
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--vp-c-text-3);
  position: relative;
  z-index: 1;
}

/* IDA Q 1.0 lead cell (same treatment as Gabriel, cyan accent) */
.stat-idaq {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 24px 28px;
  text-decoration: none;
  overflow: hidden;
  background: linear-gradient(140deg, var(--vp-c-bg) 0%, rgba(6, 182, 212, 0.08) 160%);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease;
  opacity: 0;
  transform: translateY(16px);
  transition-delay: 80ms;
}

.stat-idaq.is-visible { opacity: 1; transform: translateY(0); }
.stat-idaq:hover { background: linear-gradient(140deg, var(--vp-c-bg-soft) 0%, rgba(6, 182, 212, 0.14) 140%); }

.stat-idaq-glow {
  position: absolute;
  top: -70%;
  right: -40%;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, transparent 65%);
  border-radius: 50%;
  animation: pulse-glow 6s ease-in-out infinite;
  pointer-events: none;
}

.stat-idaq-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #06b6d4;
  position: relative;
  z-index: 1;
}

.stat-idaq-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #06b6d4;
  box-shadow: 0 0 6px #06b6d4;
  animation: pulse-glow 2s ease-in-out infinite;
}

.stat-idaq-name {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--vp-c-text-1);
  line-height: 1.05;
  position: relative;
  z-index: 1;
}

.stat-idaq-desc {
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--vp-c-text-3);
  position: relative;
  z-index: 1;
}

/* Stats grid (nested) */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--vp-c-divider);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 28px 16px;
  background: var(--vp-c-bg);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s ease;
  opacity: 0;
  transform: translateY(16px);
}

.stat-item.is-visible { opacity: 1; transform: translateY(0); }
.stat-item:hover { background: var(--vp-c-bg-soft); }

.stat-value {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--vp-c-text-1);
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-3);
}

/* ─── Section common ─── */
.section { padding: 0 0 80px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.section-title { font-size: 22px; font-weight: 700; color: var(--vp-c-text-1); margin: 0; letter-spacing: -0.02em; }
.view-all { font-size: 13px; font-weight: 500; color: var(--vp-c-text-3); text-decoration: none; transition: all 0.2s; padding: 6px 12px; border-radius: 100px; border: 1px solid transparent; }
.view-all:hover { color: var(--vp-c-brand-1); border-color: var(--vp-c-brand-soft); background: var(--vp-c-brand-soft); }

/* ─── Product Cards ─── */
.products-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

.product-card {
  padding: 32px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(24px);
}

.product-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.product-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  padding: 1px;
  background: linear-gradient(135deg, transparent, rgba(124, 58, 237, 0.3), transparent);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s;
}

.product-card:hover::before { opacity: 1; }

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 60px rgba(124, 58, 237, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04);
  border-color: transparent;
}

.dark .product-card:hover {
  box-shadow: 0 20px 60px rgba(124, 58, 237, 0.12), 0 4px 16px rgba(0, 0, 0, 0.3);
}

.product-icon { margin-bottom: 20px; color: var(--vp-c-text-2); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.product-card:hover .product-icon { transform: scale(1.1) rotate(-3deg); }
.product-title { font-size: 18px; font-weight: 700; color: var(--vp-c-text-1); margin: 0 0 8px; letter-spacing: -0.01em; }
.product-desc { font-size: 14px; line-height: 1.6; color: var(--vp-c-text-2); margin: 0; }
.product-arrow { position: absolute; bottom: 28px; right: 28px; font-size: 18px; color: var(--vp-c-text-3); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); opacity: 0; transform: translateX(-8px); }
.product-card:hover .product-arrow { opacity: 1; transform: translateX(0); color: var(--vp-c-brand-1); }

/* ─── Features Grid ─── */
.features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

.feature-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(16px);
}

.feature-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.feature-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.03), transparent);
  transition: left 0.5s ease;
}

.feature-card:hover::after { left: 100%; }

.feature-card:hover {
  border-color: color-mix(in srgb, var(--accent, #7c3aed) 25%, transparent);
  background: var(--vp-c-bg-soft);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.dark .feature-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.feature-icon-wrap {
  flex-shrink: 0;
  margin-top: 2px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent, #7c3aed) 8%, transparent);
  transition: all 0.25s;
}

.feature-card:hover .feature-icon-wrap {
  background: color-mix(in srgb, var(--accent, #7c3aed) 14%, transparent);
  transform: scale(1.05);
}

.feature-icon { flex-shrink: 0; }
.feature-body { min-width: 0; }
.feature-title { font-size: 13px; font-weight: 600; color: var(--vp-c-text-1); margin: 0 0 3px; }
.feature-desc { font-size: 12px; line-height: 1.45; color: var(--vp-c-text-2); margin: 0; }

/* ─── Featured ─── */
.featured-card {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 40px;
  align-items: center;
  padding: 48px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  background: linear-gradient(135deg, var(--vp-c-bg) 0%, var(--vp-c-bg-soft) 100%);
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(24px);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.featured-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.featured-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.06) 0%, transparent 60%);
  border-radius: 50%;
  pointer-events: none;
}

.featured-label { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--vp-c-brand-1); margin-bottom: 12px; padding: 4px 10px; background: var(--vp-c-brand-soft); border-radius: 100px; }
.featured-title { font-size: 24px; font-weight: 700; color: var(--vp-c-text-1); margin: 0 0 12px; letter-spacing: -0.02em; }
.featured-desc { font-size: 14px; line-height: 1.7; color: var(--vp-c-text-2); margin: 0 0 20px; max-width: 480px; }
.featured-link { font-size: 14px; font-weight: 600; color: var(--vp-c-brand-1); text-decoration: none; transition: all 0.2s; display: inline-flex; align-items: center; gap: 4px; }
.featured-link:hover { gap: 8px; }

.featured-visual {
  height: 200px;
  border-radius: 14px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  position: relative;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.featured-card:hover .featured-visual { transform: scale(1.02) rotate(0.5deg); }

.featured-visual-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, transparent 60%);
  border-radius: 14px;
}

/* ─── Use Cases ─── */
.use-cases-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }

.use-case-card {
  display: grid;
  grid-template-columns: 1fr;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  opacity: 0;
  transform: translateY(20px);
}

.use-case-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.use-case-card:hover {
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.06);
  transform: translateY(-3px);
  border-color: var(--vp-c-brand-soft);
}

.dark .use-case-card:hover { box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3); }

.use-case-visual {
  width: 100%;
  height: 160px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.use-case-card:hover .use-case-visual { transform: scale(1.04); }

.use-case-content { padding: 24px 28px; }
.use-case-title { font-size: 17px; font-weight: 700; color: var(--vp-c-text-1); margin: 0 0 8px; letter-spacing: -0.01em; }
.use-case-desc { font-size: 14px; line-height: 1.6; color: var(--vp-c-text-2); margin: 0 0 16px; }

.btn-dark {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-dark:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }

/* ─── Blog ─── */
.blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

.blog-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  overflow: hidden;
  text-decoration: none;
  background: var(--vp-c-bg);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  opacity: 0;
  transform: translateY(20px);
}

.blog-card.is-visible { opacity: 1; transform: translateY(0); }

.blog-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  border-color: var(--vp-c-brand-soft);
}

.dark .blog-card:hover { box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3); }
.blog-card:hover .blog-title { color: var(--vp-c-brand-1); }
.blog-card:hover .blog-cover { transform: scale(1.05); }

.blog-cover {
  position: relative;
  width: 100%;
  height: 160px;
  background-size: cover;
  background-position: center;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.blog-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 100px;
}

.blog-body { padding: 18px 20px 20px; display: flex; flex-direction: column; flex: 1; }
.blog-title { font-size: 15px; font-weight: 600; color: var(--vp-c-text-1); margin: 0 0 8px; line-height: 1.35; transition: color 0.2s; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.blog-desc { font-size: 13px; color: var(--vp-c-text-2); margin: 0 0 12px; line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }
.blog-meta { font-size: 12px; color: var(--vp-c-text-3); font-weight: 500; }

/* ─── Guides Grid ─── */
.guides-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

.guide-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  opacity: 0;
  transform: translateY(20px);
}

.guide-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.guide-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  border-color: var(--vp-c-brand-soft);
}

.dark .guide-card:hover { box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3); }

.guide-thumb {
  width: 100%;
  height: 140px;
  background-size: cover;
  background-position: center;
  position: relative;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.guide-card:hover .guide-thumb { transform: scale(1.05); }

.guide-thumb-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(0, 0, 0, 0.3) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.guide-card:hover .guide-thumb-overlay { opacity: 1; }

.guide-text { padding: 16px 20px; }
.guide-title { font-size: 14px; font-weight: 600; color: var(--vp-c-text-1); margin: 0 0 4px; }
.guide-category { font-size: 12px; color: var(--vp-c-text-3); font-weight: 500; }

/* ─── Resources ─── */
.resources { border-top: 1px solid var(--vp-c-divider); padding: 64px 0 40px; }
.resources-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }

.resource-item {
  text-align: center;
  text-decoration: none;
  padding: 24px 16px;
  border-radius: 14px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  opacity: 0;
  transform: translateY(16px);
}

.resource-item.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.resource-item:hover {
  background: var(--vp-c-bg-soft);
  transform: translateY(-3px);
}

.resource-item:hover .resource-title { color: var(--vp-c-brand-1); }
.resource-item:hover .resource-icon { transform: scale(1.15); color: var(--vp-c-brand-1); }

.resource-icon { display: flex; justify-content: center; margin-bottom: 14px; color: var(--vp-c-text-3); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.resource-title { font-size: 14px; font-weight: 600; color: var(--vp-c-text-1); margin: 0 0 4px; transition: color 0.2s; }
.resource-desc { font-size: 13px; color: var(--vp-c-text-2); line-height: 1.5; margin: 0; }

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .hero { padding: 50px 0 40px; }
  .hero-split { grid-template-columns: 1fr; gap: 32px; }
  .hero-title { font-size: 30px; }
  .hero-subtitle { font-size: 15px; }
  .stats-bar { grid-template-columns: 1fr; margin-bottom: 56px; }
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .stat-value { font-size: 26px; }
  .stat-gabriel { padding: 22px 24px; }
  .stat-gabriel-name { font-size: 21px; }
  .stat-idaq { padding: 22px 24px; }
  .stat-idaq-name { font-size: 21px; }
  .products-grid { grid-template-columns: 1fr; }
  .features-grid { grid-template-columns: 1fr; }
  .use-cases-grid { grid-template-columns: 1fr; }
  .use-case-visual { height: 120px; }
  .featured-card { grid-template-columns: 1fr; padding: 28px; gap: 24px; }
  .featured-visual { height: 140px; }
  .blog-grid { grid-template-columns: 1fr; }
  .guides-grid { grid-template-columns: 1fr; }
  .resources-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
  .section { padding: 0 0 56px; }
}

@media (min-width: 769px) and (max-width: 1023px) {
  .products-grid { grid-template-columns: repeat(2, 1fr); }
  .features-grid { grid-template-columns: repeat(2, 1fr); }
  .blog-grid { grid-template-columns: repeat(2, 1fr); }
  .guides-grid { grid-template-columns: repeat(2, 1fr); }
  .resources-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
