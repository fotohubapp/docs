# Architecture Overview

How FOTOhub processes your requests — from API call to generated content.

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT (Your App)                         │
│         Python SDK · TypeScript SDK · REST API · MCP              │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE (WAF + CDN)                        │
│         Rate limiting · DDoS protection · SSL termination         │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                                │
│                    apis.fotohub.app (HTTPS)                       │
│            Route splitting · Load balancing · CORS                │
└──────┬──────────┬──────────┬──────────┬──────────┬───────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
│  Core    ││  Image   ││  Video   ││  Audio   ││ Billing  │
│  API     ││  Service ││  Service ││  Service ││ Service  │
│          ││          ││          ││          ││          │
│ Gabriel  ││ Text-to- ││ Text-to- ││ Music    ││ Credits  │
│ Chat/LLM ││ image +  ││ video +  ││ TTS/STT  ││ Payments │
│ Analyze  ││ editing  ││ i2v      ││ SFX      ││ Tiers    │
│ Translate││          ││          ││ Voice    ││ Wallet   │
└──────┬───┘└──────┬───┘└──────┬───┘└──────────┘└──────────┘
       │           │           │
       ▼           ▼           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      GPU CLUSTER                                  │
│    gpu.fotohub.app · Local inference for select models           │
│    Image · Video · 3D · TTS · Lip-sync                          │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                     │
│  PostgreSQL · Object Storage (S3) · Edge Functions               │
│  Auth · Realtime · Vector search                                 │
└──────────────────────────────────────────────────────────────────┘
```

## Request Lifecycle

### 1. Authentication

Every request is authenticated via Bearer JWT or API key:

```
Authorization: Bearer fh_live_sk2Kj8mN4pQ7...
```

The API gateway validates the token, resolves the user/project, and checks tier limits (RPM, daily quota, burst) before forwarding.

### 2. Rate Limiting

Three layers of rate limiting:

| Layer | Scope | Limits |
|-------|-------|--------|
| Cloudflare WAF | IP-based | 1000 req/min (global) |
| Tier limits | Per-user | 10-300 RPM (by tier) |
| Burst protection | Per-user | 4-hour rolling window |

Exceeding limits returns `HTTP 429` with `Retry-After` header.

### 3. Routing

The API gateway routes by path prefix to the appropriate service:

| Prefix | Handled by |
|--------|-----------|
| `/v1/ai/generate/image` | Image service |
| `/v1/ai/generate/video` | Video service |
| `/v1/ai/generate/music` | Audio service |
| `/v1/ai/gabriel` | Core API |
| `/v1/ai/chat` | Core API |
| `/v1/billing` | Billing service |
| `/v1/tiers` | Billing service |

### 4. Credit Deduction

Credits are deducted **before** generation starts (pre-authorization). If generation fails, credits are automatically refunded within 60 seconds.

```
Request → Auth → Check balance → Deduct → Generate → Return result
                                    │
                                    └→ On failure: Refund
```

### 5. Provider Routing

Each service routes every model to the best available upstream provider, with automatic failover. If the primary provider for a model is unavailable, the service transparently retries against a healthy alternative — the caller sees no difference beyond a small latency increase. Provider selection, regional routing, and failover chains are managed internally and may change without notice; your integration only ever targets the stable public model ID (for example `seedream-5-0-260128`, `flux-2-pro`, or `veo-3.1-generate-001`).

## Infrastructure

### Regions

| Component | Region | Provider |
|-----------|--------|----------|
| API Server | eu-central-1 | AWS |
| Database | eu-central-1 | AWS (self-hosted) |
| GPU Cluster | eu-central-1 | AWS |
| CDN | Global edge | CloudFront |
| WAF | Global edge | Cloudflare |
| Storage (S3) | eu-central-1 | AWS S3 |

### Availability

- **API Gateway**: Multi-instance behind load balancer
- **Database**: PostgreSQL with streaming replication
- **Storage**: S3 with 99.999999999% durability
- **GPU**: Hot-standby with health checks every 10s
- **Edge Functions**: 252 Deno workers, auto-scaling

### Security

| Layer | Protection |
|-------|-----------|
| Transport | TLS 1.3 (Cloudflare Full Strict) |
| Authentication | JWT + scoped API keys |
| Database | Row-Level Security (RLS) on all tables |
| Secrets | Managed secret store with periodic rotation |
| WAF | Cloudflare managed + OWASP rulesets |
| Audit | All API calls logged with user/IP/action |

## Async Operations

Video and 3D generation are **asynchronous** — they return a `job_id` immediately:

```
POST /generate/video → { job_id: "vj_abc123", status: "queued" }

# Poll until complete
GET /generate/video/vj_abc123 → { status: "processing", progress: 45 }
GET /generate/video/vj_abc123 → { status: "completed", video_url: "..." }
```

Or use webhooks to get notified when done:

```json
{
  "event": "generation.completed",
  "data": {
    "job_id": "vj_abc123",
    "type": "video",
    "video_url": "https://s3point.fotohub.app/..."
  }
}
```

## Edge Functions

252 serverless Deno functions handle specialized logic:

- **Queue management**: Priority queues for paid vs free users
- **Webhook delivery**: Signed payloads with 3x retry
- **Credit operations**: Atomic deduct/refund with race protection
- **Model status**: Health checks + auto-disable on failures
- **Analytics**: Real-time aggregation for usage dashboards
