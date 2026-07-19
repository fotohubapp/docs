# Architecture Overview

How FOTOhub processes your requests — from API call to generated content.

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT (Your App)                         │
│         Python SDK · TypeScript SDK · PHP SDK · REST API          │
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
│                       API GATEWAY (nginx)                         │
│                    apis.fotohub.app:443                           │
│            Route splitting · Load balancing · CORS                │
└──────┬──────────┬──────────┬──────────┬──────────┬───────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
│ api-     ││ image-   ││ video-   ││ music-   ││ billing- │
│ server   ││ engine   ││ engine   ││ server   ││ engine   │
│ (8791)   ││ (8090)   ││ (8092)   ││ (8093)   ││ (8094)   │
│          ││          ││          ││          ││          │
│ Gabriel  ││ Seedream ││ Seedance ││ MiniMax  ││ Credits  │
│ Chat/LLM ││ FLUX     ││ Veo      ││ IDA      ││ Stripe   │
│ Analyze  ││ Grok     ││ Sora     ││ Stable   ││ Tiers    │
│ Translate││ WAN      ││ Hailuo   ││ Audio    ││ Wallet   │
└──────┬───┘└──────┬───┘└──────┬───┘└──────────┘└──────────┘
       │           │           │
       ▼           ▼           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      GPU CLUSTER                                  │
│    gpu.fotohub.app · A100/A10G · Local inference models          │
│    Image (TripoSR, FLUX local) · Video (WAN) · TTS · Lip-sync   │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                     │
│  PostgreSQL (Supabase) · S3 Storage · Edge Functions (252)       │
│  PostgREST · GoTrue (Auth) · Realtime · pgvector                 │
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

The API gateway routes by path prefix:

| Prefix | Service | Port |
|--------|---------|------|
| `/v1/ai/generate/image` | image-engine | 8090 |
| `/v1/ai/generate/video` | video-engine | 8092 |
| `/v1/ai/generate/music` | music-server | 8093 |
| `/v1/ai/gabriel` | api-server | 8791 |
| `/v1/ai/chat` | api-server | 8791 |
| `/v1/billing` | billing-engine | 8094 |
| `/v1/tiers` | billing-engine | 8094 |

### 4. Credit Deduction

Credits are deducted **before** generation starts (pre-authorization). If generation fails, credits are automatically refunded within 60 seconds.

```
Request → Auth → Check balance → Deduct → Generate → Return result
                                    │
                                    └→ On failure: Refund
```

### 5. Provider Routing

Each engine routes to the best available provider:

```python
# Internal model routing (simplified)
PROVIDERS = {
    "seedream-5-0-260128": ["byteplus-eu", "byteplus-us"],
    "flux-2-pro": ["bfl-direct", "replicate-fallback"],
    "veo-3.1": ["google-vertex-eu"],
}
```

If the primary provider is down, the engine automatically fails over to the next in chain — transparent to the caller.

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
| Authentication | JWT + API keys, IP allowlists |
| Database | Row-Level Security (RLS) on all tables |
| Secrets | AWS Secrets Manager, rotated quarterly |
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
