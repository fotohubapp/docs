<p align="center">
  <img src="https://static.fotohub.app/brand/fotohub-logo-dark.png" alt="FOTOhub" width="280" />
</p>

<h3 align="center">Official Documentation for the FOTOhub AI Platform</h3>

<p align="center">
  <a href="https://docs.fotohub.app">docs.fotohub.app</a> &nbsp;|&nbsp;
  <a href="https://fotohub.app">Platform</a> &nbsp;|&nbsp;
  <a href="https://fotohub.app/console">Console</a>
</p>

---

## About

Source for the [FOTOhub developer documentation](https://docs.fotohub.app) — covering 200+ AI models, cloud computing, storage, agent workflows, and the full platform API.

Built with [VitePress](https://vitepress.dev), deployed on nginx at `docs.fotohub.app`.

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (hot-reload at localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [VitePress](https://vitepress.dev) 1.6+ |
| UI | Vue 3, custom theme |
| Styling | CSS custom properties |
| Search | VitePress local search |
| Deploy | nginx on dedicated server |
| CDN | Cloudflare |

## Documentation Structure

```
docs-site/
├── index.md                 # Landing page
├── api/                     # API Reference (19 pages)
│   ├── getting-started.md   #   Introduction & setup
│   ├── authentication.md    #   Auth & API keys
│   ├── image-generation.md  #   Image generation (25+ models)
│   ├── video-generation.md  #   Video generation (15+ models)
│   ├── music-audio.md       #   Music, TTS, speech-to-text
│   ├── chat-llm.md          #   Chat completions (OpenAI-compatible)
│   ├── image-editing.md     #   Inpainting, upscaling, editing
│   ├── image-analysis.md    #   Vision & analysis
│   ├── gabriel-ai.md        #   Gabriel AI orchestrator
│   ├── agents.md            #   Agent workflows & DAG editor
│   ├── cloud-computing.md   #   GPU instances (A10G, A100, H100)
│   ├── storage.md           #   S3 storage (60+ endpoints)
│   ├── usage-analytics.md   #   Usage monitoring & analytics
│   ├── console-api.md       #   Developer console API
│   ├── billing.md           #   Credits, tokens, pricing
│   ├── webhooks.md          #   Real-time event notifications
│   ├── models.md            #   Full model catalog
│   ├── rate-limits.md       #   Rate limiting policies
│   └── errors.md            #   Error codes & handling
├── sdk/                     # SDK Documentation (3 pages)
│   ├── python.md            #   Python SDK (fotohub on PyPI)
│   ├── typescript.md        #   TypeScript SDK (@fotohub/sdk)
│   └── examples.md          #   Code examples & recipes
├── guides/                  # Guides (4 pages)
│   ├── quickstart.md        #   5-minute quickstart
│   ├── token-billing.md     #   Billing model explained
│   ├── webhooks.md          #   Webhook integration guide
│   └── best-practices.md    #   Production best practices
└── .vitepress/
    ├── config.ts            # VitePress configuration
    └── theme/               # Custom theme overrides
```

## Contributing

### Adding a New Page

1. Create a `.md` file in the appropriate directory (`api/`, `sdk/`, or `guides/`).
2. Add frontmatter with title and description:
   ```yaml
   ---
   title: Your Page Title
   description: Brief description for SEO.
   ---
   ```
3. Register the page in `.vitepress/config.ts` under the relevant sidebar section.
4. Build locally to verify: `npm run build`

### Style Guidelines

- Use standard Markdown with VitePress extensions (containers, code groups, badges).
- API endpoints: use `## POST /v1/endpoint` headings.
- Include request/response examples with syntax-highlighted code blocks.
- Add `:::tip`, `:::warning`, or `:::danger` containers for callouts.

## SDKs

| SDK | Package | Install |
|-----|---------|---------|
| Python | [fotohub](https://pypi.org/project/fotohub/) | `pip install fotohub` |
| TypeScript | [@fotohub/sdk](https://www.npmjs.com/package/@fotohub/sdk) | `npm install @fotohub/sdk` |

## License

[MIT](./LICENSE) — Copyright 2026 FOTOhub
