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
      { text: 'Guides', link: '/guides/quickstart' },
      { text: 'Console', link: 'https://fotohub.app/console' },
    ],

    sidebar: {
      '/api/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/api/getting-started' },
            { text: 'Authentication', link: '/api/authentication' },
            { text: 'Rate Limits', link: '/api/rate-limits' },
            { text: 'Error Handling', link: '/api/errors' },
          ],
        },
        {
          text: 'AI Generation',
          items: [
            { text: 'Image Generation', link: '/api/image-generation' },
            { text: 'Video Generation', link: '/api/video-generation' },
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
            { text: 'Examples', link: '/sdk/examples' },
          ],
        },
      ],
      '/guides/': [
        {
          text: 'Guides',
          items: [
            { text: 'Quickstart', link: '/guides/quickstart' },
            { text: 'Token Billing', link: '/guides/token-billing' },
            { text: 'Webhook Integration', link: '/guides/webhooks' },
            { text: 'Best Practices', link: '/guides/best-practices' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/fotohub' },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/fotohub/docs/edit/main/:path',
      text: 'Suggest changes',
    },

    footer: {
      copyright: '© 2026 FOTOhub. All rights reserved.',
    },
  },
})
