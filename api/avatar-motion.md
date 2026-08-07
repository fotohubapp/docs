# Avatar & Motion Transfer

Generate talking/performing avatar videos from a single portrait plus an audio clip, or transfer the motion from a driving video onto a static character image. Two distinct capabilities, both asynchronous (submit → poll → download), both billed per second of output.

| | |
|---|---|
| **Avatar models** | `omnihuman-1-0`, `omnihuman-1-5` |
| **Motion-transfer model** | `dreamactor-m2` |
| **Billing** | Per second of output, based on real input length |
| **Processing** | Asynchronous — returns a `job_id` for polling |

::: info Where Dreamina 4.6 lives
Dreamina 4.6 (still image generation, not avatar/motion) is documented on the [Image Generation](/api/image-generation) page as `model: "dreamina-4-6"` — it's a plain synchronous image call, not part of this async job pattern.
:::

---

## Avatar Generation (OmniHuman)

### Endpoint

```
POST /v1/ai/avatar
```

**Authentication:** Bearer token (API key)
**Billing:** 7.4 credits per second of output audio (capped at 15s = 111 credits max)
**Processing:** Asynchronous — returns a `job_id` for polling

OmniHuman takes a single portrait image and an audio clip and generates a video where the person speaks or performs in sync with the audio — no driving video needed, the motion is inferred entirely from the audio.

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | **Yes** | — | Public URL to a portrait image. JPEG, PNG, or JFIF. Max 5MB, max 4096×4096px. |
| `audio_url` | string | **Yes** | — | Public URL to an MP3 audio clip. Max 15 seconds — longer files are not rejected, but only the first 15s are billed and used. |
| `model` | string | No | `"omnihuman-1-0"` | `"omnihuman-1-0"` or `"omnihuman-1-5"`. 1.5 additionally supports multi-character scenes via subject detection; for a single subject the two behave identically. |
| `duration_seconds` | number | No | `15` (max) | The real length of `audio_url`, in seconds. **Providing this only ever lowers your charge** — if omitted, you are billed for the full 15-second ceiling regardless of how short your clip actually is. |

::: tip Always send `duration_seconds`
Billing scales with this value, clamped to the model's own 0-15s range. A 3-second clip billed without it costs the same as a 15-second one (111 credits) — sending the real length brings that down to ~23 credits.
:::

### Request Example

```json
{
  "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/portrait.jpg",
  "audio_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/narration.mp3",
  "model": "omnihuman-1-0",
  "duration_seconds": 8
}
```

### Response (202 Accepted)

```json
{
  "model": "omnihuman-1-0",
  "job_id": "7daa69b8-a2b7-402e-8759-bb64aa224eb2",
  "status": "queued",
  "credits_used": 60,
  "billing": {
    "method": "credits",
    "usd_charged": 0,
    "pln_charged": 0,
    "breakdown": {
      "rate_per_second": 7.4,
      "duration_seconds": 8.0,
      "credits_exact": 59.2,
      "credits_charged": 60,
      "pricing_type": "per_second"
    }
  },
  "poll_url": "https://apis.fotohub.app/v1/ai/avatar/7daa69b8-a2b7-402e-8759-bb64aa224eb2"
}
```

Credits are charged at submit time, rounded up to the nearest whole credit (`credits_exact` is what the raw rate × duration computes to; `credits_charged` is what actually left your balance). If the job later fails, the charge is refunded automatically — see [Polling](#polling-avatar-jobs).

### Polling Avatar Jobs

```
GET /v1/ai/avatar/{job_id}
```

Poll every 5-8 seconds. A live render of a single line of speech typically completes in under a minute.

**Processing:**
```json
{
  "job_id": "7daa69b8-a2b7-402e-8759-bb64aa224eb2",
  "model": "omnihuman-1-0",
  "status": "processing",
  "credits_used": 60.0,
  "duration": 8,
  "created_at": "2026-08-05T07:17:20.026457+00:00"
}
```

**Completed:**
```json
{
  "job_id": "7daa69b8-a2b7-402e-8759-bb64aa224eb2",
  "model": "omnihuman-1-0",
  "status": "completed",
  "credits_used": 60.0,
  "duration": 8,
  "created_at": "2026-08-05T07:17:20.026457+00:00",
  "video_url": "https://v16m-default.tiktokcdn.com/.../video.mp4"
}
```

**Failed** (credits already refunded by this point):
```json
{
  "job_id": "7daa69b8-a2b7-402e-8759-bb64aa224eb2",
  "model": "omnihuman-1-0",
  "status": "failed",
  "error": "Upstream status: not_found",
  "refunded": true
}
```

---

## Motion Transfer (DreamActor M2.0)

### Endpoint

```
POST /v1/ai/motion-transfer
```

**Authentication:** Bearer token (API key)
**Billing:** 3.1 credits per second of driving video, clamped to 3-30 seconds (9.3-93 credits per job)
**Processing:** Asynchronous — returns a `job_id` for polling

DreamActor transfers the motion from a driving video onto a static character image — the character in your image performs whatever the person in the driving video does. Unlike avatar generation, this needs a full video input, not just audio.

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | **Yes** | — | Public URL to the character portrait. JPEG or PNG. Max 4.7MB, max 4096×4096px. |
| `video_url` | string | **Yes** | — | Public URL to the driving video. MP4, MOV, or WebM. Must be 3-30 seconds, resolution between 200×200 and 2048×1440. |
| `duration_seconds` | number | No | `30` (max) | The real length of `video_url`, in seconds. Clamped server-side to 3-30s. As with the avatar endpoint, providing this only lowers your charge — omitting it bills the full 30-second ceiling. |
| `crop_first_second` | boolean | No | `true` | BytePlus prepends a 1-second transition to the raw output; this trims it. Leave this on unless you specifically want the transition frame. |

### Request Example

```json
{
  "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/character.jpg",
  "video_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/driving-dance.mp4",
  "duration_seconds": 6
}
```

### Response (202 Accepted)

```json
{
  "model": "dreamactor-m2",
  "job_id": "e394ebd0-84ec-4266-82e9-948f353ff223",
  "status": "queued",
  "credits_used": 19,
  "billing": {
    "method": "credits",
    "usd_charged": 0,
    "pln_charged": 0,
    "breakdown": {
      "rate_per_second": 3.1,
      "duration_seconds": 6.0,
      "credits_exact": 18.6,
      "credits_charged": 19,
      "pricing_type": "per_second"
    }
  },
  "poll_url": "https://apis.fotohub.app/v1/ai/motion-transfer/e394ebd0-84ec-4266-82e9-948f353ff223"
}
```

### Polling Motion-Transfer Jobs

```
GET /v1/ai/motion-transfer/{job_id}
```

Same status shape and refund behavior as [avatar polling](#polling-avatar-jobs) above — `processing`, `completed` with a `video_url`, or `failed` with `refunded: true`. Renders in the 3-30 second input range typically complete within 1-3 minutes; poll every 6-8 seconds.

---

## Code Examples

::: code-group

```python [Python — Avatar]
import requests
import time

response = requests.post(
    "https://apis.fotohub.app/v1/ai/avatar",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json",
    },
    json={
        "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/portrait.jpg",
        "audio_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/narration.mp3",
        "model": "omnihuman-1-0",
        "duration_seconds": 8,
    },
)
job = response.json()
job_id = job["job_id"]
print(f"Job submitted: {job_id}, will charge up to {job['credits_used']} credits")

while True:
    status = requests.get(
        f"https://apis.fotohub.app/v1/ai/avatar/{job_id}",
        headers={"Authorization": "Bearer fh_live_your_api_key"},
    ).json()

    if status["status"] == "completed":
        print("Video ready:", status["video_url"])
        break
    elif status["status"] == "failed":
        print("Failed:", status["error"], "— refunded:", status.get("refunded"))
        break

    time.sleep(6)
```

```python [Python — Motion Transfer]
import requests
import time

response = requests.post(
    "https://apis.fotohub.app/v1/ai/motion-transfer",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json",
    },
    json={
        "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/character.jpg",
        "video_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/driving-dance.mp4",
        "duration_seconds": 6,
    },
)
job = response.json()
job_id = job["job_id"]

while True:
    status = requests.get(
        f"https://apis.fotohub.app/v1/ai/motion-transfer/{job_id}",
        headers={"Authorization": "Bearer fh_live_your_api_key"},
    ).json()

    if status["status"] == "completed":
        print("Video ready:", status["video_url"])
        break
    elif status["status"] == "failed":
        print("Failed:", status["error"])
        break

    time.sleep(6)
```

```typescript [TypeScript — Avatar]
const submitRes = await fetch("https://apis.fotohub.app/v1/ai/avatar", {
  method: "POST",
  headers: {
    Authorization: "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    image_url: "https://s1.fotohub.app/storage/v1/object/public/uploads/portrait.jpg",
    audio_url: "https://s1.fotohub.app/storage/v1/object/public/uploads/narration.mp3",
    model: "omnihuman-1-0",
    duration_seconds: 8,
  }),
});
const { job_id: jobId } = await submitRes.json();

async function pollAvatar(id: string): Promise<string> {
  while (true) {
    const res = await fetch(`https://apis.fotohub.app/v1/ai/avatar/${id}`, {
      headers: { Authorization: "Bearer fh_live_your_api_key" },
    });
    const job = await res.json();

    if (job.status === "completed") return job.video_url;
    if (job.status === "failed") throw new Error(job.error);

    await new Promise((r) => setTimeout(r, 6000));
  }
}

console.log("Video ready:", await pollAvatar(jobId));
```

```typescript [TypeScript — Motion Transfer]
const submitRes = await fetch("https://apis.fotohub.app/v1/ai/motion-transfer", {
  method: "POST",
  headers: {
    Authorization: "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    image_url: "https://s1.fotohub.app/storage/v1/object/public/uploads/character.jpg",
    video_url: "https://s1.fotohub.app/storage/v1/object/public/uploads/driving-dance.mp4",
    duration_seconds: 6,
  }),
});
const { job_id: jobId } = await submitRes.json();

async function pollMotion(id: string): Promise<string> {
  while (true) {
    const res = await fetch(`https://apis.fotohub.app/v1/ai/motion-transfer/${id}`, {
      headers: { Authorization: "Bearer fh_live_your_api_key" },
    });
    const job = await res.json();

    if (job.status === "completed") return job.video_url;
    if (job.status === "failed") throw new Error(job.error);

    await new Promise((r) => setTimeout(r, 6000));
  }
}

console.log("Video ready:", await pollMotion(jobId));
```

```bash [cURL]
# Avatar — submit
curl -X POST "https://apis.fotohub.app/v1/ai/avatar" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/portrait.jpg",
    "audio_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/narration.mp3",
    "model": "omnihuman-1-0",
    "duration_seconds": 8
  }'

# Avatar — poll
curl "https://apis.fotohub.app/v1/ai/avatar/7daa69b8-a2b7-402e-8759-bb64aa224eb2" \
  -H "Authorization: Bearer fh_live_your_api_key"

# Motion transfer — submit
curl -X POST "https://apis.fotohub.app/v1/ai/motion-transfer" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/character.jpg",
    "video_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/driving-dance.mp4",
    "duration_seconds": 6
  }'

# Motion transfer — poll
curl "https://apis.fotohub.app/v1/ai/motion-transfer/e394ebd0-84ec-4266-82e9-948f353ff223" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

---

## Job Status Values

| Status | Description |
|--------|-------------|
| `queued` / `processing` | Job is running upstream. Poll again in 6-8 seconds. |
| `completed` | Video is ready. The `video_url` field contains the download link. |
| `failed` | Generation failed. The `error` field contains the reason, and `refunded: true` confirms the charge was reversed. |

## Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Missing or invalid `image_url` / `audio_url` / `video_url`, or an unrecognized `model` value. |
| `402` | Insufficient credits and wallet balance to cover the charge. |
| `404` | `job_id` not found, or it belongs to a different API key. |
| `424` | The upstream provider failed to start or complete the job. Credits are refunded automatically — the error message says so explicitly. |

```json
{
  "detail": "Upstream generation failed to start: image_url could not be fetched (no credits were charged for this request)"
}
```

## Tips and Best Practices

- **Host your own inputs.** `image_url`, `audio_url`, and `video_url` must all be publicly fetchable over HTTP(S) — the upstream provider downloads them directly. Use [`POST /v1/photos/upload`](/api/image-processing) to get a fetchable URL for a local file first.
- **Send `duration_seconds` whenever you know it.** Both endpoints bill the full ceiling (15s for avatar, 30s for motion transfer) when it's omitted — a 3-second clip costs the same as a 15-second one if you don't report the real length.
- **OmniHuman needs no driving video.** If you already have a video of the exact performance you want, use motion transfer instead — it will look more precise than trying to describe that performance through audio alone.
- **DreamActor's driving video sets the pace.** The output plays at whatever tempo the driving video moves — a fast dance clip produces a fast result regardless of the character image.

## Related APIs

- [Image Generation](/api/image-generation) — Dreamina 4.6 and 100+ other image models
- [Lip-Sync](/api/lip-sync) — audio-to-existing-video sync, for when you already have a talking-head video and just need new words
- [Video Generation](/api/video-generation) — text/image-to-video without a reference performance
