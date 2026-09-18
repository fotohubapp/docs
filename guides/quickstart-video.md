# Video quickstart

56 video models. Video is **asynchronous and billed per second of output**, which
makes it the most expensive thing to get wrong — read the billing note before
your first call.

> Prerequisite: a key and a funded wallet — see the [Quickstart](/guides/quickstart).

## Submit

```
POST https://apis.fotohub.app/v1/ai/generate/video
```

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "veo-3.1-fast-generate-001",
    "prompt": "a slow dolly across a rainy neon street at night",
    "duration": 5,
    "aspect_ratio": "16:9",
    "resolution": "720p"
  }'
```

| Field | Notes |
|---|---|
| `prompt` | Required. |
| `model` | Any id from `GET /v1/models?category=video`. |
| `duration` | Seconds. **This multiplies the bill directly.** |
| `aspect_ratio` | `16:9`, `9:16`, `1:1`. |
| `resolution` | `720p`, `1080p`, `4k` — subject to what the model supports. |
| `image_url` | Optional first frame, for image-to-video. |

## Poll

The submit returns `202` with a `job_id`. Poll:

```
GET https://apis.fotohub.app/v1/ai/generate/video/{job_id}
```

until `status` is `completed` or `failed`. The response carries `progress`,
`result_video_url`, `result_thumbnail_url` and `error_message`.

::: tip The poll is what refunds you
The wallet is charged at submit time. When a generation fails on the engine
side, it is the **first poll that observes the failure** that issues the refund
— guarded so that polling repeatedly cannot pay you twice. So do not abandon a
job you believe has failed: poll it once more and collect the refund.
:::

The Python SDK wraps the loop: `client.wait_for_video(job_id)`.

## What per-second billing means in practice

Rates from the live catalogue, per second of output:

| Model | USD / second | 5-second clip |
|---|---|---|
| `wan2.2-t2v-plus` | 0.0956 | ~$0.48 |
| `kling-v2-5-turbo` | 0.1275 | ~$0.64 |
| `veo-3.1-fast-generate-001` | 0.3985 | ~$1.99 |
| `veo-3.1-generate-001` | 0.9565 | ~$4.78 |
| `sora-2-pro` | 1.5144 | ~$7.57 |
| `wan2.6-r2v` | 7.1734 | ~$35.87 |

A three-order-of-magnitude spread sits inside one endpoint. Call
`GET /v1/pricing` and compute the cost before you submit, especially in a loop.

## Seedance models take a wider parameter set

Models matching `seedance-*` accept considerably more than the table above:

| Field | Notes |
|---|---|
| `duration` | 2.0 line: 4–15 s. 1.x line: 5–10 s. Clamped, and billed as clamped. |
| `resolution` | 480p/720p everywhere; 1080p on `seedance-2-0-pro` and all 1.x; **4K only on `seedance-2-0-pro`**. An unsupported value is a `400`, never a silent downgrade — because price scales with it. |
| `aspect_ratio` | `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `21:9`, `adaptive`. |
| `generate_audio` | Native soundtrack. Doubles the rate on the 1.5-pro line. |
| `image_url` / `last_frame_url` | First and final frame. |
| `reference_images` | Up to 9 — URLs or `{mimeType, base64}`. 2.0 only. |
| `reference_videos` | Up to 3. 2.0 only. |
| `reference_audios` | Up to 3; requires at least one image or video. 2.0 only. |
| `asset_ids` | Pre-registered `asset://` portrait ids. 2.0 only. |

## Next

[Video Generation reference](/api/video-generation) ·
[Webhooks](/guides/webhooks) — stop polling and get told instead ·
[3D quickstart](/guides/quickstart-3d)
