import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'FOTOhub Docs',
  description: 'API Reference, SDKs, and Guides for the FOTOhub AI Platform',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#7c3aed' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'FOTOhub Docs' }],
    ['meta', { property: 'og:title', content: 'FOTOhub Developer Docs — 200+ AI Models, One API' }],
    ['meta', { property: 'og:description', content: 'Generate images, video, music, 3D, and chat with 200+ AI models through a single unified API. SDKs for Python, TypeScript, PHP.' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap', rel: 'stylesheet' }],
  ],

  themeConfig: {
    logo: {
      light: '/logo-light.png',
      dark: '/logo-dark.png',
    },
    siteTitle: false,

    nav: [
      { text: 'API Reference', link: '/api/getting-started' },
      { text: 'SDKs', link: '/sdk/python' },
      { text: 'Integrations', link: '/integrations/overview' },
      { text: 'Guides', link: '/guides/quickstart' },
      {
        text: 'Resources',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'Status', link: 'https://status.fotohub.app' },
          { text: 'Console', link: 'https://fotohub.app/console' },
          { text: 'Community', link: 'https://discord.gg/fotohub' },
        ],
      },
    ],

    sidebar: {
      '/api/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/api/getting-started' },
            { text: 'Authentication', link: '/api/authentication' },
            { text: 'Playground', link: '/api/playground' },
            { text: 'Rate Limits', link: '/api/rate-limits' },
            { text: 'Error Handling', link: '/api/errors' },
          ],
        },
        {
          text: 'AI Generation',
          items: [
            { text: 'Image Generation', link: '/api/image-generation' },
            { text: 'Video Generation', link: '/api/video-generation' },
            { text: '3D Generation', link: '/api/3d-generation' },
            { text: 'Music & Audio', link: '/api/music-audio' },
            { text: 'Chat / LLM', link: '/api/chat-llm' },
            { text: 'Image Editing', link: '/api/image-editing' },
            { text: 'Image Analysis', link: '/api/image-analysis' },
          ],
        },
        {
          text: 'Platform',
          items: [
            { text: 'Gabriel AI', link: '/api/gabriel-ai' },
            { text: 'Agent Workflows', link: '/api/agents' },
            { text: 'Cloud Computing', link: '/api/cloud-computing' },
            { text: 'S3 Storage', link: '/api/storage' },
            { text: 'Usage & Analytics', link: '/api/usage-analytics' },
            { text: 'Console API', link: '/api/console-api' },
            { text: 'Billing & Pricing', link: '/api/billing' },
            { text: 'Webhooks', link: '/api/webhooks' },
            { text: 'Models Catalog', link: '/api/models' },
          ],
        },
      ],
      '/sdk/': [
        {
          text: 'SDKs',
          items: [
            { text: 'Python SDK', link: '/sdk/python' },
            { text: 'TypeScript SDK', link: '/sdk/typescript' },
            { text: 'PHP SDK', link: '/sdk/php' },
            { text: 'Examples', link: '/sdk/examples' },
          ],
        },
      ],
      '/integrations/': [
        {
          text: 'Integrations',
          items: [
            { text: 'Overview', link: '/integrations/overview' },
            { text: 'Shopify', link: '/integrations/shopify' },
            { text: 'WordPress', link: '/integrations/wordpress' },
            { text: 'WooCommerce', link: '/integrations/woocommerce' },
            { text: 'PrestaShop', link: '/integrations/prestashop' },
            { text: 'Zapier & Make', link: '/integrations/zapier' },
            { text: 'n8n', link: '/integrations/n8n' },
          ],
        },
      ],
      '/guides/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Quickstart', link: '/guides/quickstart' },
            { text: 'CLI Setup', link: '/guides/cli-setup' },
            { text: 'SDK Installation', link: '/guides/sdk-setup' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Architecture', link: '/guides/architecture' },
            { text: 'Pricing & Costs', link: '/guides/pricing' },
            { text: 'Token Billing', link: '/guides/token-billing' },
            { text: 'Best Practices', link: '/guides/best-practices' },
          ],
        },
        {
          text: 'Tutorials',
          items: [
            { text: 'Image Generation', link: '/guides/image-generation' },
            { text: 'Video Generation', link: '/guides/video-generation' },
            { text: 'Chat & Streaming', link: '/guides/chat-streaming' },
            { text: 'Webhook Integration', link: '/guides/webhooks' },
            { text: 'Integrations Hub', link: '/guides/integrations-hub' },
          ],
        },
        {
          text: 'Resources',
          items: [
            { text: 'Migration Guide', link: '/guides/migration' },
            { text: 'FOTOhub vs Others', link: '/guides/compare' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/fotohubapp' },
      { icon: { svg: '<svg viewBox="0 0 27.23 27.23" xmlns="http://www.w3.org/2000/svg"><rect fill="currentColor" width="27.23" height="27.23" rx="2"/><polygon fill="var(--vp-c-bg)" points="5.8 21.75 13.66 21.75 13.66 9.98 17.59 9.98 17.59 21.75 21.51 21.75 21.51 5.8 5.8 5.8"/></svg>' }, link: 'https://www.npmjs.com/package/fotohub' },
      { icon: { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9.585 11.692h4.328s2.432.039 2.432-2.35V5.391S16.714 3 11.936 3C7.362 3 7.647 4.983 7.647 4.983l.006 2.055h4.363v.617H7.14S4.5 7.33 4.5 11.869c0 4.541 2.316 4.381 2.316 4.381h1.384v-2.105s-.074-2.316 2.286-2.316l.003-.001h-.001l.001.001zm-.287-4.5a.783.783 0 110-1.566.783.783 0 010 1.566z" fill="currentColor"/><path d="M14.415 12.308h-4.328s-2.432-.039-2.432 2.35v3.951S7.286 21 12.064 21c4.574 0 4.289-1.983 4.289-1.983l-.006-2.055h-4.363v-.617h4.876S19.5 16.67 19.5 12.131c0-4.541-2.316-4.381-2.316-4.381h-1.384v2.105s.074 2.316-2.286 2.316l-.003.001h.001l-.001-.001zm.287 4.5a.783.783 0 110 1.566.783.783 0 010-1.566z" fill="currentColor"/></svg>' }, link: 'https://pypi.org/project/fotohub/' },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/fotohubapp/docs/edit/main/:path',
      text: 'Suggest changes',
    },

    footer: {
      copyright: '© 2026 FOTOhub. All rights reserved.',
    },
  },
})
