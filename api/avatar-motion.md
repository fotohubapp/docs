# Avatar Motion & Motion Transfer API

Generate a talking avatar video from a portrait photo and an audio clip, or transfer the motion
from a driving video onto a static character image. Both are powered by BytePlus's OmniHuman
(1.0 / 1.5) and DreamActor M2.0 models.

::: info Overview
Both endpoints are asynchronous — submit a job and get back a `job_id` plus a `poll_url`; poll
that URL until `status` is `completed` or `failed`. Billing is USD, from your prepaid wallet,
charged per second of input at submit time. See [`GET /v1/pricing`](/api/billing#pricing) for the
current rate — the figures below are illustrative and can drift.
:::

## Models

| Model | Endpoint family | Input | Max length | ~USD/s |
|-------|------------------|-------|------------|--------|
| `omnihuman-1-0` | Avatar (`/v1/ai/avatar`) | portrait + audio | 15s audio | $0.12 |
| `omnihuman-1-5` | Avatar (`/v1/ai/avatar`) | portrait + audio | 15s audio | $0.12 |
| `dreamactor-m2` | Motion transfer (`/v1/ai/motion-transfer`) | portrait + driving video | 3–30s video | $0.05 |

OmniHuman 1.5 additionally supports multi-character scenes via a subject-detection pre-step;
single-subject inputs behave identically to 1.0.

---

## Generate Avatar Video

Generate a talking/performing avatar video from a portrait and an audio clip in one call — there
is no separate "create avatar, then animate" step.

### Endpoint

```
POST /v1/ai/avatar
```

**Authentication:** Bearer token (API key)
**Billing:** Charged in USD at submit time, per second of `duration_seconds` (capped at 15s),
refunded automatically if the job fails to start or later fails upstream.
**Processing:** Asynchronous — returns `202` with a `job_id` and `poll_url`.

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | **Yes** | — | Public http(s) URL to the portrait. JPEG/PNG/JFIF, ≤5MB, ≤4096×4096. |
| `audio_url` | string | **Yes** | — | Public http(s) URL to the audio. MP3, ≤15 seconds. |
| `model` | string | No | `"omnihuman-1-0"` | `"omnihuman-1-0"` or `"omnihuman-1-5"`. |
| `duration_seconds` | number | No | 15 (full ceiling) | Real length of `audio_url`, used for billing. Omitting it bills the full 15s ceiling; an accurate value only ever lowers the charge. |

### Request Example

```json
{
  "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/portrait.jpg",
  "audio_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/narration.mp3",
  "model": "omnihuman-1-5",
  "duration_seconds": 8.5
}
```

### Response (202)

```json
{
  "model": "omnihuman-1-5",
  "job_id": "5a1e2c3d-...-9f0b",
  "status": "queued",
  "cost_usd": 1.02,
  "currency": "USD",
  "billing": {
    "method": "wallet",
    "cost_usd": 1.02,
    "balance_usd": 48.31,
    "currency": "USD",
    "breakdown": {
      "currency": "USD",
      "rate_usd_per_second": 0.12,
      "duration_seconds": 8.5,
      "amount_usd": 1.02,
      "pricing_type": "per_second"
    }
  },
  "poll_url": "https://apis.fotohub.app/v1/ai/avatar/5a1e2c3d-...-9f0b"
}
```

---

## Poll Avatar Job

```
GET /v1/ai/avatar/{job_id}
```

Poll until `status` is `completed` or `failed`. Intermediate statuses are `queued` and
`processing`.

### Response — processing

```json
{
  "job_id": "5a1e2c3d-...-9f0b",
  "model": "omnihuman-1-5",
  "status": "processing",
  "cost_usd": 1.02,
  "currency": "USD",
  "duration": 8,
  "created_at": "2026-09-16T10:04:00+00:00"
}
```

### Response — completed

```json
{
  "job_id": "5a1e2c3d-...-9f0b",
  "model": "omnihuman-1-5",
  "status": "completed",
  "cost_usd": 1.02,
  "currency": "USD",
  "duration": 8,
  "created_at": "2026-09-16T10:04:00+00:00",
  "video_url": "https://s1.fotohub.app/storage/v1/object/public/generations/avatar_5a1e2c3d.mp4",
  "completed_at": "2026-09-16T10:04:41+00:00"
}
```

### Response — failed

```json
{
  "job_id": "5a1e2c3d-...-9f0b",
  "model": "omnihuman-1-5",
  "status": "failed",
  "cost_usd": 1.02,
  "currency": "USD",
  "duration": 8,
  "created_at": "2026-09-16T10:04:00+00:00",
  "error": "Upstream status: failed",
  "refunded": true
}
```

The wallet charge from submit time is refunded automatically the first time a poll observes the
failure — `refunded` reflects whether that refund has already happened.

---

## Motion Transfer

Transfer the motion from a driving video onto a static character portrait (DreamActor M2.0).

### Endpoint

```
POST /v1/ai/motion-transfer
```

**Authentication:** Bearer token (API key)
**Billing:** Charged in USD at submit time, per second of `duration_seconds` (3–30s range).
**Processing:** Asynchronous — returns `202` with a `job_id` and `poll_url`.

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | **Yes** | — | Public http(s) URL to the character portrait. JPEG/PNG, ≤4.7MB, ≤4096×4096. |
| `video_url` | string | **Yes** | — | Public http(s) URL to the driving video. MP4/MOV/WEBM, 3–30s, ≤2048×1440. |
| `duration_seconds` | number | No | 30 (full ceiling) | Real length of `video_url`, used for billing. Clamped to the 3–30s range. |
| `crop_first_second` | boolean | No | `true` | Trims the 1-second transition BytePlus prepends to the output. |

### Request Example

```json
{
  "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/character.png",
  "video_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/driving_clip.mp4",
  "duration_seconds": 12,
  "crop_first_second": true
}
```

### Response (202)

```json
{
  "model": "dreamactor-m2",
  "job_id": "7c2f1a9e-...-b31d",
  "status": "queued",
  "cost_usd": 0.60,
  "currency": "USD",
  "billing": {
    "method": "wallet",
    "cost_usd": 0.60,
    "balance_usd": 47.71,
    "currency": "USD",
    "breakdown": {
      "currency": "USD",
      "rate_usd_per_second": 0.05,
      "duration_seconds": 12,
      "amount_usd": 0.60,
      "pricing_type": "per_second"
    }
  },
  "poll_url": "https://apis.fotohub.app/v1/ai/motion-transfer/7c2f1a9e-...-b31d"
}
```

---

## Poll Motion Transfer Job

```
GET /v1/ai/motion-transfer/{job_id}
```

Same response shape as [Poll Avatar Job](#poll-avatar-job) above — `queued` / `processing` /
`completed` (with `video_url`) / `failed` (with `error` and `refunded`).

---

## Errors

Both endpoints follow the API-wide error format — see [Error Handling](/api/errors). In short:

| Status | Meaning |
|--------|---------|
| 400 | Missing/invalid `image_url`, `audio_url`, `video_url`, or an invalid `model`. Not charged. |
| 402 | Wallet balance cannot cover the request. Not charged. |
| 404 | `job_id` does not exist, or belongs to a different account. |
| 424 | The upstream provider (BytePlus) was unreachable or rejected the request. Automatically refunded. |
| 500 | Internal error (e.g. a pricing row is temporarily missing). Not charged — the response says so explicitly. |

::: warning No list or delete endpoint
There is currently no endpoint to list all of an account's avatar/motion-transfer jobs, and no
endpoint to delete one. Track `job_id` values on your own side as you create them.
:::
