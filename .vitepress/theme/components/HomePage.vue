<script setup>
import { ref, onMounted } from 'vue'
import { data as bakedBlogPosts } from '../blogPosts.data'
import { fetchLatestPosts } from '../blogFeed'

/**
 * "Latest from the blog" starts from the build-time snapshot so the section is in
 * the static HTML, then refetches on mount. The data loader alone left the list
 * frozen at whatever was published the day the docs were last built, which is a
 * module that claims to show the latest and silently doesn't.
 */
const blogPosts = ref(bakedBlogPosts || [])

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

/**
 * Scroll-triggered reveal.
 *
 * Deliberately a POSITION test on scroll, not an IntersectionObserver. Every
 * revealed block starts at `opacity: 0`, so a missed callback is not a missed
 * animation — it is permanently invisible content. IntersectionObserver only
 * reports what was intersecting on the frames it happens to sample: scroll fast
 * (wheel fling, anchor jump, scripted scroll) and sections that flew past
 * between two frames never fire at all. That left everything from Capabilities
 * down stuck at zero opacity.
 *
 * `top < innerHeight` is true for anything at or above the current scroll
 * position, so once you have passed a section it stays eligible no matter how
 * many frames were dropped getting there. The listener detaches itself once
 * every block has been revealed.
 */
const revealed = ref(new Set())
onMounted(() => {
  let pending = [...document.querySelectorAll('[data-reveal]')]

  // Runs synchronously in the scroll handler, NOT inside requestAnimationFrame.
  // Deferring to a frame drops checks whenever frames are coalesced (fast wheel
  // fling, scripted scroll), and a dropped check on a one-shot reveal is
  // permanently hidden content, so the few rects this costs are worth it: there
  // are only nine observed elements and the list shrinks to zero as they reveal.
  const check = () => {
    const limit = window.innerHeight - 40
    const hit = pending.filter(el => el.getBoundingClientRect().top < limit)
    if (hit.length) {
      hit.forEach(el => revealed.value.add(el.dataset.reveal))
      revealed.value = new Set(revealed.value)
      pending = pending.filter(el => !hit.includes(el))
    }
    if (!pending.length) {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }

  window.addEventListener('scroll', check, { passive: true })
  window.addEventListener('resize', check, { passive: true })
  check()
})

onMounted(async () => {
  const fresh = await fetchLatestPosts()
  if (!fresh.length) return
  blogPosts.value = fresh

  // The section is `v-if`'d on the list being non-empty, so if the build-time
  // snapshot came back empty its node did not exist when the reveal pass above
  // collected its targets — and every revealed block starts at opacity 0, so it
  // would render and stay invisible. Mark it revealed as we fill it.
  revealed.value = new Set(revealed.value).add('blog')
})

// ─── Install block: one card, three package managers, real copy-to-clipboard ───
const installs = [
  { id: 'python', label: 'Python', cmd: 'pip install fotohub' },
  { id: 'node', label: 'Node', cmd: 'npm install fotohub' },
  { id: 'cli', label: 'CLI', cmd: 'npm install -g fotohubapp-cli' }
]
const copied = ref('')
async function copyCmd(item) {
  try {
    await navigator.clipboard.writeText(item.cmd)
    copied.value = item.id
    setTimeout(() => { if (copied.value === item.id) copied.value = '' }, 1400)
  } catch { /* clipboard blocked (http, permissions) — the command stays selectable */ }
}

// ─── Quickstart block ───
/*
 * The first screen of an API reference should contain a request and the reply
 * it actually produces. Everything in this block was executed against
 * production on 2026-09-18 with a real key: the response pane is the trimmed
 * body that came back, not a plausible-looking invention, down to the
 * `cost_usd` and the `usage.resolution` the run reported.
 *
 * `/v1/ai/generate/image` is synchronous — it holds the connection until the
 * image exists (~21 s for this one) and there is no job to poll. Video and 3D
 * are the opposite shape, which is why the tab strip says so instead of
 * leaving a developer to discover it on their first timeout.
 */
const quickTabs = [
  {
    id: 'curl',
    label: 'cURL',
    lang: 'bash',
    code: `curl -X POST https://apis.fotohub.app/v1/ai/generate/image \\
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "seedream-5-0-260128",
    "prompt": "a single green apple on a white studio backdrop",
    "aspect_ratio": "1:1"
  }'`
  },
  {
    id: 'python',
    label: 'Python',
    lang: 'python',
    code: `from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

result = client.generate_image(
    "a single green apple on a white studio backdrop",
    model="seedream-5-0-260128",
    aspect_ratio="1:1",
)

print(result["images"][0]["url"])
print(result["cost_usd"], "USD")`
  },
  {
    id: 'node',
    label: 'TypeScript',
    lang: 'typescript',
    code: `import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_..." });

const result = await client.generateImage({
  model: "seedream-5-0-260128",
  prompt: "a single green apple on a white studio backdrop",
  aspectRatio: "1:1",
});

console.log(result.images[0].url);`
  }
]
const activeTab = ref('curl')
const copiedCode = ref(false)
async function copyActiveCode() {
  const tab = quickTabs.find(t => t.id === activeTab.value)
  if (!tab) return
  try {
    await navigator.clipboard.writeText(tab.code)
    copiedCode.value = true
    setTimeout(() => { copiedCode.value = false }, 1400)
  } catch { /* clipboard blocked — the code stays selectable */ }
}

// Trimmed from the real 200 response. The image object carries 67 columns, most
// of them null internals; the four shown are the four anyone uses.
const quickResponse = `{
  "model": "seedream-5-0-260128",
  "cost_usd": 0.0315,
  "currency": "USD",
  "billing": { "method": "wallet", "balance_usd": 5.1486 },
  "usage": {
    "generated_images": 1,
    "resolution": "2048x2048",
    "generation_ms": 16998
  },
  "images": [{
    "id": "38eacb12-2bd9-46ce-aab1-5fce671a003a",
    "url": "https://s1.fotohub.app/storage/v1/object/sign/\u2026",
    "file_size": 122541
  }]
}`

const quickSteps = [
  { n: '01', title: 'Get a key', body: 'Create one in Console \u2192 Keys and top up the prepaid wallet. Keys look like <code>fh_live_\u2026</code> and are shown once.', link: '/api/authentication', linkText: 'Authentication' },
  { n: '02', title: 'Pick a model', body: '<code>GET /v1/models</code> is public \u2014 no key needed. It answers the live catalogue with per-request USD rates, so you can price a run before you make it.', link: '/api/models', linkText: 'Model catalogue' },
  { n: '03', title: 'Handle the two shapes', body: 'Image, chat and speech return the result on the same request. Video, 3D and IDA Q return a <code>job_id</code> you poll. Nothing else differs.', link: '/api/surface-map', linkText: 'API surface map' }
]

// ─── Static data ───
const products = [
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`,
    title: 'API Platform',
    description: 'One REST API over 100+ models — images, video, audio, chat, 3D — with the billing, storage and job handling already done.',
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

/**
 * The two in-house systems. They were styled exactly like S3 Storage in the
 * capability grid, so nothing on the page said which parts of the platform are
 * FOTOhub's own. They now carry a marker in the grid as well as the lead cells.
 */
const FLAGSHIP = ['Gabriel AI Orchestrator', 'IDA Q 1.0']

/*
 * Card imagery: each of these five is one photograph of the thing the card is
 * about — the studio and the finished catalogue for "Use cases", a desk with the
 * editor and the shipped app for "Showcase", one laptop and one returned image
 * for "Quickstart", the physical bottle beside its four variants for "Image
 * Generation", one client cabled to three tools for "MCP". The set they replaced
 * was abstract gradient art, which told a developer nothing about the page.
 *
 * They are WebP at 2x the rendered box (1132x380 for the use-case visuals,
 * 740x300 for the guide thumbs), not the 1.7-3.0 MB PNGs that were here before:
 * 11 MB of decorative background-image for five strips no taller than 190 CSS px.
 */
const useCases = [
  {
    title: 'Use cases',
    description: 'Learn how teams are using FOTOhub API to automate content, build products, and ship faster.',
    button: 'Explore use cases',
    link: '/guides/best-practices',
    image: 'https://static.fotohub.app/images/docs/usecase-teams.webp'
  },
  {
    title: 'Showcase',
    description: 'Discover what developers are building with FOTOhub — integrations, apps, creative workflows.',
    button: 'Explore demos',
    link: '/integrations/overview',
    image: 'https://static.fotohub.app/images/docs/showcase-developers.webp'
  }
]

const guides = [
  { title: 'Quickstart', category: 'Getting Started', link: '/guides/quickstart', image: 'https://static.fotohub.app/images/docs/guide-quickstart.webp' },
  { title: 'Image Generation', category: 'Tutorials', link: '/guides/image-generation', image: 'https://static.fotohub.app/images/docs/guide-image-generation.webp' },
  { title: 'MCP Integration', category: 'Integrations', link: '/guides/mcp-integration', image: 'https://static.fotohub.app/images/docs/guide-mcp-integration.webp' }
]

/*
 * Platform figures.
 *
 * Every number here is read off a live endpoint, not off a slide. The counts
 * come from `GET https://apis.fotohub.app/v1/models` (public, no key needed)
 * and `GET https://apis.fotohub.app/mcp/health`, both checked 2026-09-18.
 *
 * What used to sit here was "200+ AI models", "21 providers", "99.9% Uptime
 * SLA" and "<200ms API latency". The catalogue answers 106 models from 19
 * providers, and no uptime SLA is contracted and no latency budget is measured
 * or published — the same two claims were removed from the marketing site for
 * exactly that reason. Docs are the one surface a developer is entitled to
 * treat as literal, so the row now carries only things they can re-check
 * themselves with curl.
 */
const stats = [
  { value: '106', label: 'Models in the catalogue' },
  { value: '19', label: 'Upstream providers' },
  { value: '57', label: 'MCP tools' },
  { value: '4', label: 'Run on our own GPUs' },
  { value: '1', label: 'API key for all of it' }
]

const resources = [
  { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`, title: 'Documentation', description: 'Complete API reference and guides', link: '/api/getting-started' },
  { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`, title: 'Community', description: 'Join our Discord and connect with developers', link: 'https://discord.gg/fotohub' },
  { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`, title: 'Status', description: 'Check the status of FOTOhub services', link: 'https://status.fotohub.app' },
  { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`, title: 'Console', description: 'Manage your API keys and usage', link: 'https://fotohub.app/console' }
]

/** Ticker copy is derived from the capability list — nothing invented. */
const tickerWords = features.map(f => f.title)
</script>

<template>
  <div class="home-page">
    <!-- ───────── Hero ─────────
         Left: the statement. Right: the one thing a developer actually needs in
         the first screen — the install line, copyable. -->
    <section class="hero">
      <div class="hero-split">
        <div class="hero-left">
          <p class="eyebrow"><span class="eyebrow-dot"></span>Developer platform</p>
          <h1 class="hero-title">Build with the full power of generative AI</h1>
          <p class="hero-subtitle">Images, video, music, 3D, chat and agents behind one API key, one SDK and one bill.</p>
          <ul class="hero-points">
            <li><span class="hero-point-check">✓</span>100+ models from 19 providers — one key, one SDK, one bill</li>
            <li><span class="hero-point-check">✓</span>Chain image &rarr; video &rarr; audio in just a few lines</li>
            <li><span class="hero-point-check">✓</span>Typed Python &amp; TypeScript SDKs — streaming and auto-retry built in</li>
          </ul>
        </div>

        <div class="hero-right">
          <div class="install-card">
            <div class="install-head">
              <span class="install-head-label">Install</span>
              <span class="install-head-hint">one line, any stack</span>
            </div>
            <button
              v-for="item in installs"
              :key="item.id"
              type="button"
              class="install-row"
              @click="copyCmd(item)"
            >
              <span class="install-lang">{{ item.label }}</span>
              <code>{{ item.cmd }}</code>
              <span class="install-copy">{{ copied === item.id ? 'copied' : 'copy' }}</span>
            </button>
            <a href="/guides/sdk-setup" class="install-foot">SDK setup guide &rarr;</a>
          </div>
          <div class="hero-actions">
            <a href="/api/getting-started" class="btn-primary">Get started</a>
            <a href="/api/image-generation" class="btn-secondary">API Reference</a>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────── Quickstart ─────────
         The first thing below the fold is a request and the reply production
         actually returned for it. A docs home that opens on feature cards makes
         a developer hunt for the one paragraph they came for. -->
    <section class="section quickstart" data-reveal="quickstart">
      <div class="rule-head">
        <span class="rule-no">01</span>
        <span class="rule-line"></span>
        <span class="rule-label">Your first call</span>
        <a href="/guides/quickstart" class="view-all">Full quickstart &rarr;</a>
      </div>

      <div class="qs-split" :class="{ 'is-visible': revealed.has('quickstart') }">
        <div class="qs-pane qs-pane--request">
          <div class="qs-pane-head">
            <div class="qs-tabs" role="tablist">
              <button
                v-for="tab in quickTabs"
                :key="tab.id"
                type="button"
                role="tab"
                class="qs-tab"
                :class="{ 'is-active': activeTab === tab.id }"
                :aria-selected="activeTab === tab.id"
                @click="activeTab = tab.id"
              >{{ tab.label }}</button>
            </div>
            <button type="button" class="qs-copy" @click="copyActiveCode">
              {{ copiedCode ? 'copied' : 'copy' }}
            </button>
          </div>
          <pre class="qs-code"><code>{{ quickTabs.find(t => t.id === activeTab).code }}</code></pre>
        </div>

        <div class="qs-pane qs-pane--response">
          <div class="qs-pane-head">
            <span class="qs-status"><span class="qs-status-dot"></span>200 OK &middot; 21.0 s</span>
            <span class="qs-verified">real response, trimmed</span>
          </div>
          <pre class="qs-code qs-code--json"><code>{{ quickResponse }}</code></pre>
        </div>
      </div>

      <ol class="qs-steps">
        <li v-for="(step, i) in quickSteps" :key="step.n" class="qs-step" :class="{ 'is-visible': revealed.has('quickstart') }" :style="{ transitionDelay: `${200 + i * 90}ms` }">
          <span class="qs-step-no">{{ step.n }}</span>
          <h4 class="qs-step-title">{{ step.title }}</h4>
          <p class="qs-step-body" v-html="step.body"></p>
          <a :href="step.link" class="qs-step-link">{{ step.linkText }} &rarr;</a>
        </li>
      </ol>
    </section>

    <!-- ───────── In-house systems ─────────
         Inverted cells: the only two blocks on the page rendered on ink, so the
         platform's own models are unmistakably the loudest thing after the hero. -->
    <section class="section proprietary" data-reveal="prop">
      <div class="rule-head">
        <span class="rule-no">02</span>
        <span class="rule-line"></span>
        <span class="rule-label">Built in-house</span>
      </div>
      <div class="prop-grid">
        <a href="/api/gabriel-ai" class="prop-cell" :class="{ 'is-visible': revealed.has('prop') }">
          <span class="prop-badge"><span class="prop-dot"></span>Orchestrator</span>
          <span class="prop-name">Gabriel AI</span>
          <span class="prop-desc">Natural-language routing to every model</span>
          <span class="prop-arrow">&rarr;</span>
        </a>
        <a href="/api/ida-q" class="prop-cell prop-cell--cyan" :class="{ 'is-visible': revealed.has('prop') }">
          <span class="prop-badge"><span class="prop-dot"></span>Proprietary Model</span>
          <span class="prop-name">IDA Q 1.0</span>
          <span class="prop-desc">Precision text rendering, in-house image generation</span>
          <span class="prop-arrow">&rarr;</span>
        </a>
      </div>

      <!-- Platform figures: a ruled row, not five boxes. -->
      <dl class="stat-row">
        <div v-for="(stat, i) in stats" :key="stat.label" class="stat-item" :class="{ 'is-visible': revealed.has('prop') }" :style="{ transitionDelay: `${120 + i * 70}ms` }">
          <dt class="stat-value">{{ stat.value }}</dt>
          <dd class="stat-label">{{ stat.label }}</dd>
        </div>
      </dl>
    </section>

    <!-- ───────── Three ways in ───────── -->
    <section class="section products" data-reveal="products">
      <div class="rule-head">
        <span class="rule-no">03</span>
        <span class="rule-line"></span>
        <span class="rule-label">Three ways in</span>
      </div>
      <div class="products-grid">
        <a v-for="(product, i) in products" :key="product.title" :href="product.link" class="product-card" :class="{ 'is-visible': revealed.has('products') }" :style="{ transitionDelay: `${i * 100}ms` }">
          <span class="product-index">{{ String(i + 1).padStart(2, '0') }}</span>
          <div class="product-icon" v-html="product.icon"></div>
          <h3 class="product-title">{{ product.title }}</h3>
          <p class="product-desc">{{ product.description }}</p>
          <span class="product-arrow">&rarr;</span>
        </a>
      </div>
    </section>

    <!-- Ticker: horizontal movement between two vertical stacks. -->
    <div class="ticker" aria-hidden="true">
      <div class="ticker-track">
        <span v-for="(w, i) in [...tickerWords, ...tickerWords]" :key="`t${i}`" class="ticker-item">
          {{ w }}<i>✳</i>
        </span>
      </div>
    </div>

    <!-- ───────── Capabilities ─────────
         A ruled index, not 13 identical rounded rectangles. Each row's own hue
         only appears on hover, so the page never shows more than one accent. -->
    <section class="section features" data-reveal="features">
      <div class="rule-head">
        <span class="rule-no">04</span>
        <span class="rule-line"></span>
        <span class="rule-label">Capabilities</span>
        <a href="/api/getting-started" class="view-all">View all APIs &rarr;</a>
      </div>
      <div class="features-grid">
        <a
          v-for="(feat, i) in features"
          :key="feat.title"
          :href="feat.link"
          class="feature-row"
          :class="{ 'is-visible': revealed.has('features'), 'is-flagship': FLAGSHIP.includes(feat.title) }"
          :style="{ '--accent': feat.accent, transitionDelay: `${i * 40}ms` }"
        >
          <span class="feature-no">{{ String(i + 1).padStart(2, '0') }}</span>
          <div class="feature-icon" v-html="feat.icon"></div>
          <div class="feature-body">
            <h4 class="feature-title">
              {{ feat.title }}
              <span v-if="FLAGSHIP.includes(feat.title)" class="feature-flag">FOTOhub</span>
            </h4>
            <p class="feature-desc">{{ feat.description }}</p>
          </div>
        </a>
      </div>
    </section>

    <!-- ───────── Featured ───────── -->
    <section class="section featured" data-reveal="featured">
      <div class="featured-card" :class="{ 'is-visible': revealed.has('featured') }">
        <div class="featured-content">
          <span class="featured-label">Featured</span>
          <h3 class="featured-title">Gabriel AI Orchestrator</h3>
          <p class="featured-desc">Natural language routing across the whole catalogue. Intent classification, prompt enhancement, auto-failover. Just describe what you need — Gabriel picks the best model and optimizes your prompt automatically.</p>
          <a href="/api/gabriel-ai" class="featured-link">Read the Gabriel AI guide &rarr;</a>
        </div>
        <div class="featured-visual" style="background-image: url(https://static.fotohub.app/images/docs/gabriel-orchestrator.png)">
          <div class="featured-visual-overlay"></div>
        </div>
      </div>
    </section>

    <!-- ───────── Use cases / Showcase ───────── -->
    <section class="section use-cases" data-reveal="usecases">
      <div class="rule-head">
        <span class="rule-no">05</span>
        <span class="rule-line"></span>
        <span class="rule-label">In production</span>
      </div>
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

    <!-- ───────── Blog ─────────
         A ruled list with small covers: three more image-top cards after the use
         cases would have been the fourth identical grid in a row. -->
    <section class="section blog" v-if="blogPosts.length" data-reveal="blog">
      <div class="rule-head">
        <span class="rule-no">06</span>
        <span class="rule-line"></span>
        <span class="rule-label">Latest from the blog</span>
        <a href="https://fotohub.app/news" class="view-all" target="_blank">View all &rarr;</a>
      </div>
      <div class="blog-list">
        <a v-for="(post, i) in blogPosts.slice(0, 3)" :key="post.slug" :href="`https://fotohub.app/news/${post.slug}`" target="_blank" class="blog-item" :class="{ 'is-visible': revealed.has('blog') }" :style="{ transitionDelay: `${i * 100}ms` }">
          <div class="blog-cover" :style="getCoverUrl(post.cover_image) ? { backgroundImage: `url(${getCoverUrl(post.cover_image)})` } : { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }"></div>
          <div class="blog-body">
            <div class="blog-meta-row">
              <span v-if="post.category" class="blog-tag">{{ post.category.name }}</span>
              <span class="blog-meta">{{ formatDate(post.created_at) }}</span>
            </div>
            <h4 class="blog-title">{{ post.title }}</h4>
            <p class="blog-desc">{{ post.excerpt }}</p>
          </div>
          <span class="blog-arrow">&rarr;</span>
        </a>
      </div>
    </section>

    <!-- ───────── Guides ───────── -->
    <section class="section guides" data-reveal="guides">
      <div class="rule-head">
        <span class="rule-no">07</span>
        <span class="rule-line"></span>
        <span class="rule-label">Guides &amp; tutorials</span>
        <a href="/guides/quickstart" class="view-all">View all &rarr;</a>
      </div>
      <div class="guides-grid">
        <a v-for="(guide, i) in guides" :key="guide.title" :href="guide.link" class="guide-card" :class="{ 'is-visible': revealed.has('guides') }" :style="{ transitionDelay: `${i * 100}ms` }">
          <div class="guide-thumb" :style="{ backgroundImage: `url(${guide.image})` }">
            <div class="guide-thumb-overlay"></div>
            <span class="guide-category">{{ guide.category }}</span>
          </div>
          <div class="guide-text">
            <h4 class="guide-title">{{ guide.title }}</h4>
            <span class="guide-go">&rarr;</span>
          </div>
        </a>
      </div>
    </section>

    <!-- ───────── Resources ───────── -->
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
/*
 * FOTOhub docs home — technical-editorial.
 *
 *   ink    the page's type + the two inverted in-house cells
 *   edge   every hairline; the layout is drawn with rules, not with boxes
 *   accent one hue, used in single-digit percentages of any view. A capability's
 *          own colour is revealed on hover only, so the grid is never a pastel
 *          confetti of thirteen unrelated tints.
 *
 * Depth comes from hairlines, ink inversion and tight type, not from a purple
 * radial glow behind the hero (which every generated docs theme ships with).
 */
.home-page {
  --ink: #0a0a0b;
  --on-ink: #fafaf9;
  --edge: rgba(10, 10, 11, 0.12);
  --edge-soft: rgba(10, 10, 11, 0.06);
  --accent: #7c3aed;
  /* The accent at 8.5-10.5px (rule numbers, the FOTOhub flag, blog tags) needs
     4.5:1, and #7c3aed only reaches 2.4:1 on white. Small type uses this darker
     step; anything 24px+ or purely decorative keeps --accent. */
  --accent-ink: #5b21b6;
  --cyan: #0e7490;
  --mono: var(--vp-font-family-mono);

  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
}

.dark .home-page {
  --ink: #f4f4f5;
  --on-ink: #09090b;
  /* A hairline at 14%/7% of near-white over #09090a is technically visible to a
     colour picker and invisible to an eye: the whole layout is drawn with these
     rules, so on the dark ground they carry the same job the borders and cards
     carry elsewhere and have to be raised accordingly. */
  --edge: rgba(244, 244, 245, 0.24);
  --edge-soft: rgba(244, 244, 245, 0.13);
  --accent: #a78bfa;
  --accent-ink: #c4b5fd;
  --cyan: #22d3ee;
}

/* ─── Shared motion ─── */
@keyframes ticker-slide {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.8); }
}

/* ─── Mono label used everywhere a label is needed ─── */
.eyebrow,
.rule-label,
.rule-no,
.install-head-label,
.install-lang,
.install-copy,
.stat-label,
.prop-badge,
.feature-no,
.feature-flag,
.featured-label,
.guide-category,
.blog-tag,
.blog-meta,
.product-index {
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

/* ─── Section rhythm ─── */
.section { padding: 0 0 88px; }

.rule-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

/* Section numbers are boxed; item numbers inside the lists are bare mono. Both
   were the same violet mono digit before, which made a section header and a list
   row read as the same rank a few inches apart. Shape carries the hierarchy now,
   so it survives at any colour. */
.rule-no {
  flex-shrink: 0;
  color: var(--ink);
  font-size: 9.5px;
  line-height: 1;
  padding: 5px 6px 4px;
  border: 1px solid var(--edge);
  border-radius: 4px;
}

.rule-line { flex: 1; height: 1px; background: var(--edge); }
.rule-label { color: var(--vp-c-text-2); flex-shrink: 0; }

.view-all {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  text-decoration: none;
  flex-shrink: 0;
  padding-left: 16px;
  border-left: 1px solid var(--edge);
  transition: color 0.2s;
}

.view-all:hover { color: var(--ink); }

/* ─── Hero ─── */
/* The background rules are gone. Three vertical hairlines at thirds sat under a
   1.35fr/0.85fr split, so they lined up with nothing on the page and read as a
   pattern rather than as structure. One horizontal rule at the bottom does the
   job they were meant to do: it hands the hero to the same hairline grid the
   numbered sections below are drawn with. */
.hero {
  position: relative;
  padding: 62px 0 64px;
  margin-bottom: 44px;
  border-bottom: 1px solid var(--edge-soft);
}

.hero-split {
  position: relative;
  display: grid;
  grid-template-columns: 1.35fr 0.85fr;
  gap: 56px;
  align-items: start;
}

/* The left column is deliberately NOT animated. This page is statically
   generated, so a hero gated on `opacity: 0` until Vue hydrates and adds a
   class means the first painted frame — the one that decides LCP — has no
   headline in it. The install card is not an LCP candidate, so it is the only
   half that gets an entrance, and it runs off the CSS parse rather than off a
   scroll listener: nothing to miss, nothing to wait for. */
.hero-right {
  animation: hero-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
}

@keyframes hero-in {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--vp-c-text-3);
  margin: 0 0 22px;
}

/* Static. A pulsing dot in the first line of the page is a consumer-app tell,
   and the same animation still runs on `.prop-dot` a screen below, where a live
   indicator on the in-house systems actually means something. */
.eyebrow-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
}

/* 800 at -0.045em and 0.98 line-height is a landing-page headline; this is the
   front door of an API reference. Backing off to 700/-0.03em keeps the tight
   editorial voice without the letters colliding at 58px. The hard <br> is gone
   too: it broke after "power" at every width, including the ones where the line
   had room. `balance` picks the break per viewport. */
.hero-title {
  font-size: clamp(36px, 4.6vw, 58px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: var(--ink);
  margin: 0 0 18px;
  text-wrap: balance;
}

/* Two sentences at 54ch rendered four lines deep and pushed the checklist — and
   with it the fold — down the page. One sentence, one job: name the mechanism
   the headline promises. */
.hero-subtitle {
  font-size: 16px;
  line-height: 1.62;
  color: var(--vp-c-text-2);
  margin: 0 0 28px;
  max-width: 46ch;
}

.hero-points {
  list-style: none;
  padding: 0;
  margin: 0 0 32px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.hero-points li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  padding: 11px 0;
  border-top: 1px solid var(--edge-soft);
}

.hero-points li:last-child { border-bottom: 1px solid var(--edge-soft); }

/* The checklist is the last thing in the left column now that the buttons moved
   under the install card, so it no longer needs to clear anything below it. */
.hero-left .hero-points { margin-bottom: 0; }

/* The check used to sit in a rounded 16px box. Three boxed ticks stacked on
   full-width hairlines read as a pricing-table feature matrix, which is the one
   thing this block is not. The glyph alone carries it, so it takes the darker
   accent step to hold 4.5:1 at this size. */
.hero-point-check {
  flex-shrink: 0;
  width: 14px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--accent-ink);
}

/* Under the install card in the right column: the CTA now sits with the thing it
   is a call to action for, instead of at the bottom of a column of prose. */
.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
.hero-actions .btn-primary,
.hero-actions .btn-secondary { flex: 1 1 auto; justify-content: center; }

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 13px 26px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-decoration: none;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.btn-primary {
  background: var(--ink);
  color: var(--on-ink);
  border: 1px solid var(--ink);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px -12px color-mix(in srgb, var(--ink) 60%, transparent);
}

.btn-secondary {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--edge);
}

.btn-secondary:hover {
  border-color: var(--ink);
  transform: translateY(-2px);
}

/* ─── Install card ─── */
.install-card {
  /* Dropped so the card's head aligns nearer the H1's baseline rather than its
     cap-height, which had the frame sitting visibly above the headline. */
  margin-top: 20px;
  border: 1px solid var(--edge);
  border-radius: 12px;
  background: var(--vp-c-bg-alt);
  overflow: hidden;
}

.install-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--edge);
  background: var(--vp-c-bg-soft);
}

.install-head-label { color: var(--vp-c-text-3); }

/* Was three grey circles imitating a macOS titlebar — skeuomorphic chrome on a
   block that is not a window. The space now says something true about the card. */
.install-head-hint {
  font-family: var(--mono);
  font-size: 9.5px;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3);
  opacity: 0.75;
}

.install-row {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: none;
  border-bottom: 1px solid var(--edge-soft);
  background: transparent;
  text-align: left;
  cursor: pointer;
  font: inherit;
  transition: background 0.18s;
}

.install-row:hover { background: var(--vp-c-bg-soft); }
.install-lang { color: var(--vp-c-text-3); font-size: 9.5px; }

.install-row code {
  font-family: var(--mono);
  font-size: 12.5px;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.install-copy {
  color: var(--vp-c-text-3);
  opacity: 0;
  transition: opacity 0.18s, color 0.18s;
  font-size: 9.5px;
}

.install-row:hover .install-copy { opacity: 1; }
.install-row:hover .install-copy:not(:empty) { color: var(--accent); }

.install-foot {
  display: block;
  padding: 13px 16px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.2s, background 0.2s;
}

.install-foot:hover { color: var(--accent); background: var(--vp-c-bg-soft); }

/* ─── Quickstart ───
 * Two panes on one hairline grid: the request you send and the body production
 * sent back. They share a border rather than floating as two cards, so the pair
 * reads as one transaction instead of two unrelated code samples.
 */
.quickstart { }

.qs-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid var(--edge);
  border-radius: 12px;
  overflow: hidden;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.qs-split.is-visible { opacity: 1; transform: none; }

.qs-pane { display: flex; flex-direction: column; min-width: 0; }
.qs-pane--request { border-right: 1px solid var(--edge); }

/* The response pane sits on a faintly tinted ground so the eye can tell at a
   glance which half it is looking at without a second heading. */
.qs-pane--response { background: color-mix(in srgb, var(--ink) 3%, transparent); }

.qs-pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--edge-soft);
  min-height: 44px;
}

.qs-tabs { display: flex; gap: 2px; }

.qs-tab {
  appearance: none;
  background: transparent;
  border: 0;
  border-radius: 6px;
  padding: 5px 11px;
  font-family: var(--mono);
  font-size: 11.5px;
  letter-spacing: 0.02em;
  color: color-mix(in srgb, var(--ink) 55%, transparent);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.qs-tab:hover { color: var(--ink); background: var(--edge-soft); }

.qs-tab.is-active {
  color: var(--on-ink);
  background: var(--ink);
}

.qs-copy {
  appearance: none;
  background: transparent;
  border: 1px solid var(--edge);
  border-radius: 6px;
  padding: 4px 10px;
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--ink) 60%, transparent);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.qs-copy:hover { color: var(--ink); border-color: var(--ink); }

.qs-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--ink);
}

.qs-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #15803d;
  flex: none;
}

.dark .qs-status-dot { background: #4ade80; }

.qs-verified {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--ink) 45%, transparent);
}

.qs-code {
  margin: 0;
  padding: 18px 16px 20px;
  /* Capped rather than free-growing: the two panes share a row, so an
     unbounded response pane leaves the request pane as several hundred pixels
     of empty box next to it. */
  max-height: 460px;
  overflow: auto;
  flex: 1;
  background: transparent;
  font-family: var(--mono);
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--ink);
  white-space: pre;
  tab-size: 2;
}

.qs-code code { font: inherit; color: inherit; background: none; padding: 0; }

.qs-code--json { color: color-mix(in srgb, var(--ink) 78%, transparent); }

/* ─── Quickstart steps ─── */
.qs-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--edge);
}

.qs-step {
  padding: 22px 22px 22px 0;
  border-right: 1px solid var(--edge-soft);
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

.qs-step:not(:first-child) { padding-left: 22px; }
.qs-step:last-child { border-right: 0; }
.qs-step.is-visible { opacity: 1; transform: none; }

.qs-step-no {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.1em;
  color: var(--accent-ink);
}

.qs-step-title {
  margin: 8px 0 6px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.qs-step-body {
  margin: 0 0 10px;
  font-size: 13.5px;
  line-height: 1.6;
  color: color-mix(in srgb, var(--ink) 66%, transparent);
}

.qs-step-body :deep(code) {
  font-family: var(--mono);
  font-size: 12px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--edge-soft);
  color: var(--ink);
}

.qs-step-link {
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--ink);
  text-decoration: none;
  border-bottom: 1px solid var(--edge);
  padding-bottom: 2px;
  transition: border-color 0.15s;
}

.qs-step-link:hover { border-color: var(--ink); }

/* ─── In-house cells (inverted) ─── */
.prop-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.prop-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 30px 30px 32px;
  border-radius: 14px;
  background: var(--ink);
  color: var(--on-ink);
  text-decoration: none;
  overflow: hidden;
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.prop-cell:nth-child(2) { transition-delay: 90ms; }
.prop-cell.is-visible { opacity: 1; transform: translateY(0); }

/* Hairline field inside the ink cell — texture without an image. */
.prop-cell::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(90deg, color-mix(in srgb, var(--on-ink) 8%, transparent) 1px, transparent 1px);
  background-size: 22px 100%;
  opacity: 0.7;
  pointer-events: none;
}

.prop-cell::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.prop-cell:hover::after { transform: scaleX(1); }
.prop-cell--cyan::after { background: var(--cyan); }

/* 62% of the ink colour put ORCHESTRATOR / PROPRIETARY MODEL at ~3.6:1 — under
   the 4.5:1 a 10.5px label needs, and these two labels are what identify the
   cells as ours. Same for the descriptions below them. */
.prop-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: color-mix(in srgb, var(--on-ink) 78%, transparent);
}

.prop-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
  animation: dot-pulse 2.4s ease-in-out infinite;
}

.prop-cell--cyan .prop-dot { background: var(--cyan); }

.prop-name {
  position: relative;
  font-size: clamp(28px, 3.2vw, 38px);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
}

.prop-desc {
  position: relative;
  font-size: 13.5px;
  line-height: 1.5;
  color: color-mix(in srgb, var(--on-ink) 82%, transparent);
  max-width: 34ch;
}

.prop-arrow {
  position: absolute;
  right: 26px;
  bottom: 26px;
  font-size: 17px;
  color: color-mix(in srgb, var(--on-ink) 50%, transparent);
  transform: translateX(-6px);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.prop-cell:hover .prop-arrow { opacity: 1; transform: translateX(0); }

/* ─── Stat row ─── */
.stat-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  margin: 12px 0 0;
  border-top: 1px solid var(--edge);
}

.stat-item {
  padding: 22px 18px 4px 0;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

.stat-item + .stat-item { padding-left: 20px; border-left: 1px solid var(--edge-soft); }
.stat-item.is-visible { opacity: 1; transform: translateY(0); }

.stat-value {
  font-size: clamp(24px, 2.6vw, 32px);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.stat-label {
  margin: 9px 0 0;
  color: var(--vp-c-text-3);
  font-size: 9.5px;
  line-height: 1.5;
}

/* ─── Products ─── */
.products-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-top: 1px solid var(--edge); }

.product-card {
  position: relative;
  padding: 30px 28px 56px;
  border-bottom: 1px solid var(--edge);
  text-decoration: none;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s;
}

.product-card + .product-card { border-left: 1px solid var(--edge); }
.product-card.is-visible { opacity: 1; transform: translateY(0); }
.product-card:hover { background: var(--vp-c-bg-soft); }

.product-index { position: absolute; top: 30px; right: 26px; color: var(--vp-c-text-3); }
.product-icon { margin-bottom: 22px; color: var(--vp-c-text-2); transition: color 0.25s, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.product-card:hover .product-icon { color: var(--accent); transform: translateY(-2px); }
.product-title { font-size: 19px; font-weight: 700; letter-spacing: -0.025em; color: var(--ink); margin: 0 0 9px; }
.product-desc { font-size: 14px; line-height: 1.6; color: var(--vp-c-text-2); margin: 0; max-width: 32ch; }

.product-arrow {
  position: absolute;
  bottom: 24px;
  left: 28px;
  font-size: 17px;
  color: var(--accent);
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.product-card:hover .product-arrow { opacity: 1; transform: translateX(0); }

/* ─── Ticker ─── */
.ticker {
  position: relative;
  overflow: hidden;
  /* The band is a separator, so it needs air on both sides of the rules as well
     as between them: at 16px the 26px type sat almost on the hairlines and the
     whole strip read as a squeezed row of the section above it. */
  margin: 12px 0 96px;
  padding: 28px 0;
  border-top: 1px solid var(--edge);
  border-bottom: 1px solid var(--edge);
  mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
}

.ticker-track {
  display: flex;
  width: max-content;
  animation: ticker-slide 46s linear infinite;
}

.ticker-item {
  display: inline-flex;
  align-items: center;
  gap: 26px;
  padding-right: 26px;
  font-size: clamp(18px, 2.4vw, 26px);
  font-weight: 600;
  letter-spacing: -0.035em;
  /* 22% measured 1.65:1 — the words were decoration you could not read. 46%
     cleared the large-text threshold on paper but still looked washed out beside
     the ink type above it; 58% keeps the band recessive without reading as a
     rendering fault. */
  color: color-mix(in srgb, var(--ink) 58%, transparent);
  white-space: nowrap;
}

.ticker-item i { font-style: normal; font-size: 12px; color: var(--accent); }

/* ─── Capabilities index ─── */
.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 0;
  border-top: 1px solid var(--edge);
}

.feature-row {
  position: relative;
  display: grid;
  grid-template-columns: 30px 26px 1fr;
  align-items: start;
  gap: 14px;
  padding: 18px 22px 18px 0;
  border-bottom: 1px solid var(--edge-soft);
  text-decoration: none;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), background 0.22s;
}

.feature-row:nth-child(even) { padding-left: 22px; border-left: 1px solid var(--edge-soft); }

/* 13 capabilities in two columns leaves the last one stranded beside a hole.
   An odd final row spans the full width instead, so the index always closes on a
   complete line — and it keeps working if a 14th capability is ever added. */
.feature-row:last-child:nth-child(odd) { grid-column: 1 / -1; }
.feature-row:last-child:nth-child(odd) .feature-desc { max-width: 76ch; }

.feature-row.is-visible { opacity: 1; transform: translateY(0); }
.feature-row:hover { background: var(--vp-c-bg-soft); }

/* The accent bar is the only place a capability's own hue appears. */
.feature-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--accent);
  transform: scaleY(0);
  transform-origin: top;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.feature-row:hover::before { transform: scaleY(1); }

.feature-no { color: var(--vp-c-text-3); padding-top: 4px; font-size: 9.5px; }
.feature-icon { color: var(--vp-c-text-3); transition: color 0.22s; }
.feature-row:hover .feature-icon { color: var(--accent); }
.feature-body { min-width: 0; }

.feature-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14.5px;
  font-weight: 650;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin: 0 0 4px;
}

.feature-flag {
  font-size: 8.5px;
  letter-spacing: 0.1em;
  color: var(--accent-ink);
  padding: 2px 6px;
  /* Keyed off --accent-ink, not --accent. Both flags are supposed to be the same
     mark, but each row sets its own --accent inline for the hover bar, so the
     border inherited IDA Q's cyan and Gabriel's violet — two different badges
     for one label. */
  border: 1px solid color-mix(in srgb, var(--accent-ink) 34%, transparent);
  border-radius: 4px;
}

.feature-desc { font-size: 12.5px; line-height: 1.55; color: var(--vp-c-text-2); margin: 0; }
.feature-row.is-flagship .feature-no { color: var(--accent-ink); }

/* ─── Featured ───
   Ruled, not carded. As a rounded 18px panel on a tinted fill it was the only
   floating container left on a page that draws everything else with hairlines,
   so it read as a leftover from the previous design rather than an emphasis. */
.featured-card {
  display: grid;
  grid-template-columns: 1fr 0.78fr;
  gap: 44px;
  align-items: center;
  padding: 40px 0;
  border-top: 1px solid var(--edge);
  border-bottom: 1px solid var(--edge);
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.featured-card.is-visible { opacity: 1; transform: translateY(0); }

.featured-label {
  display: inline-block;
  color: var(--accent-ink);
  margin-bottom: 14px;
  padding-left: 26px;
  position: relative;
}

.featured-label::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 18px;
  height: 1px;
  background: var(--accent);
}

.featured-title { font-size: clamp(24px, 2.8vw, 32px); font-weight: 700; letter-spacing: -0.035em; color: var(--ink); margin: 0 0 14px; line-height: 1.05; }
.featured-desc { font-size: 14.5px; line-height: 1.65; color: var(--vp-c-text-2); margin: 0 0 22px; max-width: 52ch; }

.featured-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  text-decoration: none;
  border-bottom: 1px solid var(--edge);
  padding-bottom: 3px;
  transition: gap 0.2s, border-color 0.2s, color 0.2s;
}

.featured-link:hover { gap: 12px; color: var(--accent); border-color: var(--accent); }

.featured-visual {
  aspect-ratio: 4 / 3;
  /* Square, like the band it now sits in. A 12px radius + hairline ring was left
     over from when the whole block was a rounded card, so the image read as a
     card floating inside a ruled section. */
  overflow: hidden;
  background-size: cover;
  background-position: center;
  position: relative;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.featured-card:hover .featured-visual { transform: scale(1.015); }

/* The Gabriel render is a bright violet orb on black. On the light page that is
   the intended focal point; on the dark page the same luminance next to #09090a
   blooms and pulls the eye off the heading, so it is pulled back to match. */
.dark .featured-visual { filter: brightness(0.82) saturate(0.9); }
.dark .featured-card:hover .featured-visual { filter: brightness(1) saturate(1); }

.featured-visual-overlay {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 0 1px var(--edge);
}

/* ─── Use cases ─── */
.use-cases-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }

.use-case-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--edge);
  border-radius: 14px;
  overflow: hidden;
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s;
}

.use-case-card.is-visible { opacity: 1; transform: translateY(0); }
.use-case-card:hover { border-color: var(--ink); }

.use-case-visual {
  width: 100%;
  height: 190px;
  background-size: cover;
  background-position: center;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  filter: saturate(0.85);
}

.use-case-card:hover .use-case-visual { transform: scale(1.03); filter: saturate(1); }

.use-case-content { padding: 26px 28px 28px; }
.use-case-title { font-size: 19px; font-weight: 700; letter-spacing: -0.025em; color: var(--ink); margin: 0 0 9px; }
.use-case-desc { font-size: 14px; line-height: 1.6; color: var(--vp-c-text-2); margin: 0 0 18px; }

.btn-dark {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  background: var(--ink);
  color: var(--on-ink);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s;
}

.btn-dark:hover { transform: translateY(-2px); box-shadow: 0 10px 22px -12px color-mix(in srgb, var(--ink) 60%, transparent); }

/* ─── Blog list ─── */
.blog-list { border-top: 1px solid var(--edge); }

.blog-item {
  position: relative;
  display: grid;
  grid-template-columns: 132px 1fr 28px;
  align-items: center;
  gap: 26px;
  padding: 20px 4px;
  border-bottom: 1px solid var(--edge-soft);
  text-decoration: none;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), background 0.22s;
}

.blog-item.is-visible { opacity: 1; transform: translateY(0); }
.blog-item:hover { background: var(--vp-c-bg-soft); }

.blog-cover {
  width: 132px;
  height: 82px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  border: 1px solid var(--edge);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.blog-item:hover .blog-cover { transform: scale(1.03); }

.blog-meta-row { display: flex; align-items: center; gap: 12px; margin-bottom: 7px; }
.blog-tag { color: var(--accent-ink); }
.blog-meta { color: var(--vp-c-text-3); }
.blog-title { font-size: 16px; font-weight: 650; letter-spacing: -0.02em; color: var(--ink); margin: 0 0 6px; line-height: 1.3; }
.blog-desc { font-size: 13px; color: var(--vp-c-text-2); margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.blog-arrow { font-size: 16px; color: var(--vp-c-text-3); opacity: 0; transform: translateX(-6px); transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
.blog-item:hover .blog-arrow { opacity: 1; transform: translateX(0); color: var(--accent); }

/* ─── Guides ─── */
.guides-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }

.guide-card {
  border: 1px solid var(--edge);
  border-radius: 14px;
  overflow: hidden;
  text-decoration: none;
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s;
}

.guide-card.is-visible { opacity: 1; transform: translateY(0); }
.guide-card:hover { border-color: var(--ink); }

.guide-thumb {
  position: relative;
  width: 100%;
  height: 150px;
  background-size: cover;
  background-position: center;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  filter: saturate(0.85);
}

.guide-card:hover .guide-thumb { transform: scale(1.04); filter: saturate(1); }

/* The category label sits on top of an arbitrary photograph, so the scrim has to
   be dark enough to guarantee its contrast rather than merely "look" moody: at
   0.55 the label landed on a light patch of one thumbnail at 1:1. */
.guide-thumb-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 34%, rgba(0, 0, 0, 0.82) 100%);
}

.guide-category {
  position: absolute;
  left: 14px;
  bottom: 12px;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
}

.guide-text { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 18px; }
.guide-title { font-size: 15px; font-weight: 650; letter-spacing: -0.02em; color: var(--ink); margin: 0; }
.guide-go { font-size: 15px; color: var(--vp-c-text-3); transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), color 0.22s; }
.guide-card:hover .guide-go { transform: translateX(4px); color: var(--accent); }

/* ─── Resources ─── */
.resources { border-top: 1px solid var(--edge); padding: 52px 0 40px; }
.resources-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }

.resource-item {
  padding: 6px 24px 6px 0;
  text-decoration: none;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

.resource-item + .resource-item { padding-left: 24px; border-left: 1px solid var(--edge-soft); }
.resource-item.is-visible { opacity: 1; transform: translateY(0); }

.resource-icon { color: var(--vp-c-text-3); margin-bottom: 14px; transition: color 0.25s, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.resource-item:hover .resource-icon { color: var(--accent); transform: translateY(-2px); }
.resource-title { font-size: 14.5px; font-weight: 650; letter-spacing: -0.02em; color: var(--ink); margin: 0 0 5px; transition: color 0.2s; }
.resource-item:hover .resource-title { color: var(--accent); }
.resource-desc { font-size: 13px; color: var(--vp-c-text-2); line-height: 1.5; margin: 0; }

/* ─── Touch / no-hover ───
   Everything that carries meaning on hover has to have a resting state too. On a
   phone the capability index was 13 typographically identical rows and the copy
   affordance on the install card never appeared at all. */
@media (hover: none) {
  .install-copy { opacity: 1; }

  /* Resting accent bar, alternating so consecutive rows stay distinguishable
     without painting thirteen unrelated tints at full strength. */
  .feature-row::before { transform: scaleY(1); opacity: 0.55; }
  .feature-row:nth-child(even)::before { opacity: 0.28; }
  .feature-icon { color: var(--vp-c-text-2); }
  .product-arrow,
  .prop-arrow,
  .blog-arrow { opacity: 1; transform: none; }
}

/* ─── Reduced motion ─── */
@media (prefers-reduced-motion: reduce) {
  .ticker-track { animation: none; }
  .prop-dot { animation: none; }
  .hero-right { animation: none; }
  .prop-cell,
  .stat-item,
  .product-card,
  .feature-row,
  .featured-card,
  .use-case-card,
  .blog-item,
  .guide-card,
  .resource-item {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

/* ─── Responsive ─── */
@media (max-width: 860px) {
  .qs-split { grid-template-columns: 1fr; }
  /* The shared hairline has to move with the axis, or the two panes stack with
     a rule down the side of nothing. */
  .qs-pane--request { border-right: 0; border-bottom: 1px solid var(--edge); }
  .qs-steps { grid-template-columns: 1fr; }
  .qs-step { border-right: 0; border-bottom: 1px solid var(--edge-soft); padding: 18px 0; }
  .qs-step:not(:first-child) { padding-left: 0; }
  .qs-step:last-child { border-bottom: 0; }
}

@media (max-width: 560px) {
  .qs-code { font-size: 11.5px; padding: 14px 12px 16px; }
  .qs-pane-head { flex-wrap: wrap; row-gap: 6px; }
}

@media (max-width: 1023px) {
  .hero-split { grid-template-columns: 1fr; gap: 40px; }
  .products-grid { grid-template-columns: repeat(2, 1fr); }
  .product-card:nth-child(3) { border-left: none; }
  .guides-grid { grid-template-columns: repeat(2, 1fr); }
  .resources-grid { grid-template-columns: repeat(2, 1fr); row-gap: 28px; }
  .resource-item:nth-child(3) { padding-left: 0; border-left: none; }
  .featured-card { grid-template-columns: 1fr; gap: 28px; padding: 34px; }
}

@media (max-width: 768px) {
  .home-page { padding: 0 18px; }
  .hero { padding: 40px 0 44px; margin-bottom: 34px; }
  .hero-title { font-size: clamp(30px, 8vw, 40px); letter-spacing: -0.025em; }
  .hero-subtitle { font-size: 15.5px; }
  .section { padding: 0 0 60px; }
  .rule-head { flex-wrap: wrap; gap: 12px; }
  .view-all { padding-left: 0; border-left: none; }
  .prop-grid { grid-template-columns: 1fr; }
  .prop-cell { padding: 24px 22px 26px; }
  .stat-row { grid-template-columns: repeat(2, 1fr); }
  .stat-item { padding: 18px 14px 14px 0; border-top: 1px solid var(--edge-soft); }
  .stat-item:nth-child(odd) { padding-left: 0; border-left: none; }
  .stat-item:nth-child(1), .stat-item:nth-child(2) { border-top: none; }
  /* Five figures in two columns strand the fifth next to a gap. It spans the pair
     instead, which also reads as the summary figure it is. */
  .stat-item:last-child:nth-child(odd) { grid-column: 1 / -1; }

  /* At 390px the three-column install row squeezed the command into an ellipsis
     ("npm install -g fotohubapp…"). The command IS the content, so the label
     moves above it and the code gets the full width. */
  .install-row {
    grid-template-columns: 1fr auto;
    grid-template-areas: 'lang copy' 'cmd cmd';
    row-gap: 6px;
  }
  .install-lang { grid-area: lang; }
  .install-copy { grid-area: copy; opacity: 1; }
  .install-row code { grid-area: cmd; font-size: 13px; overflow-wrap: anywhere; white-space: normal; text-overflow: clip; }
  .products-grid { grid-template-columns: 1fr; }
  .product-card + .product-card { border-left: none; }
  /* Mobile shrinks the type below the 24px large-text threshold, so the tint has
     to come up with it to keep 4.5:1. */
  .ticker { margin: 8px 0 60px; padding: 20px 0; }
  .ticker-item { color: color-mix(in srgb, var(--ink) 72%, transparent); }
  .features-grid { grid-template-columns: 1fr; }
  .feature-row:nth-child(even) { padding-left: 0; border-left: none; }
  .use-cases-grid { grid-template-columns: 1fr; }
  .use-case-visual { height: 150px; }
  .featured-card { padding: 26px; }
  .blog-item { grid-template-columns: 96px 1fr; gap: 16px; align-items: start; }
  .blog-cover { width: 96px; height: 68px; }
  .blog-arrow { display: none; }
  .guides-grid { grid-template-columns: 1fr; }
  .resources-grid { grid-template-columns: 1fr; row-gap: 0; }
  .resource-item { padding: 20px 0; border-top: 1px solid var(--edge-soft); }
  .resource-item + .resource-item { padding-left: 0; border-left: none; }
}
</style>
