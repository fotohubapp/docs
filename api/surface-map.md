# API surface map

One page that answers "what is the URL?" for every part of the platform.

Most integration bugs against this API are not wrong request bodies — they are
requests sent to a path that does not exist, because the public prefix is not
the one the service uses internally. This page is the map. Everything on it was
verified against production on 2026-09-18.

## How to check any path yourself

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://apis.fotohub.app<PATH>
```

| Status | Meaning |
|---|---|
| `404` | The route does not exist. Nothing will make it work. |
| `401` / `403` | It exists and needs authentication. You have the right path. |
| `400` / `422` | It exists and rejected your (empty) body. You have the right path. |
| `405` | It exists, but not for that HTTP verb. |

This is worth doing before you file a bug: it separates "wrong URL" from
"wrong request" in one command.

## The gateway prefixes

`apis.fotohub.app` is a gateway in front of fifteen services. Each prefix below
is stripped before the service sees the request, which is why a service's own
`/v1/workflows` route is publicly `/engine/v1/workflows`.

| Public prefix | Service | What lives there |
|---|---|---|
| *(no prefix)* | api-server | Generation, editing, storage, console, auth, billing — the bulk of the API |
| `/engine/v1/` | agent-engine | Workflows, runs, nodes, connections, schedules, audit |
| `/brand/v1/` | brand-engine | Brands, brand DNA, faces, guidelines |
| `/social/v1/` | social-engine | Posts, scheduling, accounts, analytics, A/B tests |
| `/compute/v1/` | compute-engine | EC2 rental: catalogue, instances, volumes |
| `/s3/v1/` | s3-engine | S3-compatible bucket management |
| `/billing/` | billing-engine | Invoices |
| `/ads/`, `/marketing/`, `/video-director/`, `/seedance/` | as named | Domain services |
| `/v1/chat/` | chat-live | Chat session and MCP OAuth plumbing |
| `/v1/commerce/` | commerce-bridge | E-commerce connectors |
| `/mcp/` | mcp-server | Model Context Protocol — 57 tools for ChatGPT, Claude and any MCP client. See [MCP overview](/integrations/mcp) |
| `/ugc/` | ugc-engine | **First-party only** — session JWT, rejects API keys |
| `/stability/` | api-server | Advanced image editing tools |

::: warning The one trap worth memorising
There are two UGC surfaces and they are not interchangeable.
`POST /v1/ugc/projects` accepts an `fh_live_*` API key. `POST /ugc/projects`
does not — it answers `401` to the very same key, because it expects a
first-party session JWT. **If you hold an API key, use `/v1/ugc/*`.**
:::

## Generation — `/v1/ai/*`

| Endpoint | Shape |
|---|---|
| `POST /v1/ai/generate/image` | synchronous |
| `POST /v1/ai/generate/video` → `GET /v1/ai/generate/video/{job_id}` | async |
| `POST /v1/ai/generate/3d` | synchronous — `GET /v1/ai/generate/3d/{job_id}` re-signs the link, it is not a poll |
| `POST /v1/ai/generate/music`, `/sfx`, `/speech`, `/speech/gpt` | synchronous |
| `POST /v1/ai/chat/completions` | synchronous |
| `POST /v1/ai/tryon` → `GET /v1/ai/tryon/{job_id}` | async |
| `POST /v1/ai/edit/image` | synchronous |
| `POST /v1/ai/transcribe`, `/transcribe/voxtral/transcribe`, `/transcribe/voxtral/summarize` | synchronous |
| `POST /v1/ai/tts/{azure,gemini,polly}/synthesize` + `GET .../voices` | synchronous |
| `POST /v1/ai/document/analyze`, `/analyze-expense`, `/detect-text` | synchronous |

See [Quickstart §4](/guides/quickstart#_4-the-only-two-response-shapes) for what
"synchronous" and "async" mean for your code.

## Image operations — `/v1/images/*` and `/stability/*`

Fourteen image operations sit under `/v1/images/`, all `POST`:
`add-shadow`, `batch`, `blur-background`, `clip-embed`, `clip-tag`,
`color-grade`, `colorize`, `denoise`, `depth-map`, `enhance`, `face-restore`,
`remove-background`, `remove-background/advanced`, `replace-background`.

The advanced editing tools are `POST /stability/{tool_id}`, with `tool_id` one
of: `fast-upscale`, `creative-upscale`, `conservative-upscale`,
`remove-background`, `erase-object`, `inpaint`, `outpaint`, `search-replace`,
`search-recolor`, `style-transfer`, `style-guide`, `control-sketch`,
`control-structure`. `GET /stability/tools` lists them live.

## Video operations — `/v1/video/*`

`ai-director`, `effects`, `lip-sync`, `merge`, `speed`, `stabilize`,
`subtitles`, `transcode`, `upscale`, `watermark` — all `POST`. Lip-sync also has
`GET /v1/video/lip-sync/models` and `GET /v1/video/lip-sync/status/{job_id}`.

## Shorts — `/v1/shorts/*`

`POST /v1/shorts/clips` starts a job, `GET /v1/shorts/clips/{job_id}` polls it,
and `GET /v1/shorts/clips/events` is a Server-Sent Events stream. Also:
`agent`, `captions`, `detect-scenes`, `generate-clips`, `ingest`, `reframe`,
`transcribe`, and `POST /v1/shorts/clips/{job_id}/cancel`.

## Compute — `/compute/v1/*`

`GET /compute/v1/catalog` lists the 22 rentable instance types with hourly and
spot rates; `/compute/v1/instances` provisions and manages them.

The AWS infrastructure sub-routes are mounted **twice**, so both of these work
and mean the same thing:

```
/compute/v1/alarms
/compute/v1/aws/alarms
```

Available there: `vpcs`, `subnets`, `security-groups`, `load-balancers`,
`target-groups` (plus `/register` and `/deregister`), `auto-scaling`, `alarms`,
`s3/buckets` and `access-keys`.

VPC peering and AWS PrivateLink are **not** offered — there is no route for
either.

## Account, keys and money

| Endpoint | Purpose |
|---|---|
| `GET /v1/models` | The live model catalogue. **Public — no key needed.** |
| `GET /v1/pricing` | The rate table the biller reads. **Public — no key needed.** |
| `GET,POST /v1/auth/keys` | List and create API keys |
| `POST /v1/auth/keys/{key_id}/rotate` | Rotate a key |
| `GET /v1/billing/invoices` | Invoices |
| `GET,POST /v1/console/webhooks` | Webhook subscriptions |
| `POST /v1/console/webhooks/{webhook_id}/test` | Fire a test delivery |
| `GET,POST /v1/destinations` | Bring-your-own-bucket delivery targets |
| `POST /v1/destinations/{destination_id}/verify` | Check a destination's credentials |
| `POST /v1/console/sandbox/execute` | Dry-run a call against FOTOhub's own API without being charged. Not a code sandbox. |

## Code execution is not a public capability

FOTOhub runs a Firecracker microVM sandbox internally, but it is gated by an
internal proxy secret and reached only by the `code.python` node inside an Agent
Engine workflow. There is no public endpoint that takes a `code` parameter, and
`/sandbox/exec-python` does not exist. To have FOTOhub run your code, use a
workflow node or rent an instance under `/compute/v1/*`.

## Assistants reach all of this through MCP

Everything above is also callable by an AI assistant, without you writing a
client. The MCP server at `/mcp/` exposes 57 of these capabilities as tools,
with OAuth 2.1 sign-in, and it is listed in the official MCP registry as
`app.fotohub/fotohub`.

- [FOTOhub in ChatGPT](/integrations/mcp-chatgpt) — published in the app directory
- [FOTOhub in Claude](/integrations/mcp-claude) — added as a custom connector
- [IDE setup](/integrations/mcp-ide-setup) — Cursor, VS Code, Cline

Note the billing difference: an OAuth sign-in spends subscription credits before
the USD wallet, while an `fh_live_*` key spends the wallet only.

## Things that are priced but have no endpoint

The model catalogue is broader than the API. These carry prices because they run
inside the platform, but no public route invokes them today:
`voice-clone`, `audio-mastering`, `audio-translation`, `audio-stems`.

Two MCP tools (`voice_clone`, `separate_stems`) are registered but return a
"not yet available" message rather than calling a backend. Do not build against
any of these until they appear in this reference.

## There is no sandbox

There is no `fh_test_*` key type and no mock-response mode. Every key is
`fh_live_*` and every successful call spends real money from the prepaid wallet.
Develop against the cheapest model in the category you need — `GET /v1/pricing`
will tell you which that is.
