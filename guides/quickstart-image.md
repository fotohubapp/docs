# Image quickstart

35 image models behind one endpoint. This is the only synchronous generation
path that most integrations ever need.

> Prerequisite: a key and a funded wallet — see the [Quickstart](/guides/quickstart).

## The endpoint

```
POST https://apis.fotohub.app/v1/ai/generate/image
```

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedream-5-0-260128",
    "prompt": "a single green apple on a white studio backdrop, soft light",
    "aspect_ratio": "1:1"
  }'
```

## Request fields

| Field | Type | Notes |
|---|---|---|
| `prompt` | string | **Required.** A missing prompt is a `400` and is not charged. |
| `model` | string | Defaults to `imagen-3-fast`. Any id from `GET /v1/models?category=image`. |
| `width` / `height` | int | Default 1024×1024. |
| `aspect_ratio` | string | `1:1`, `16:9`, `9:16`, `4:3`, `3:4`. |
| `num_images` | int | Charged up front; the difference is refunded if the provider returns fewer. Most providers cap this at 1–4. |
| `image_size` | string | `1K`, `2K`, `4K`. Derived from width/height when omitted. |
| `negative_prompt` | string | Optional. |
| `style` | string | Optional. |
| `seed` | int | Optional, for reproducibility. |

::: warning num_images is not a free multiplier
It is billed per delivered image, and it is charged before generation. Two
models clamp it silently on the provider side, so the platform clamps it
*before* billing instead: the `mai-image` family serves exactly one image per
request whatever `n` says. Imagen also downgrades 4K to 2K on some models, and
the platform caps `image_size` to what actually renders so you are not charged
the 4K rate for a 2K file.
:::

## Response

A `200` with `images[]`, a `billing` block and a `usage` block. The real body is
shown in full in the [Quickstart](/guides/quickstart#_3-your-first-call).

The two fields to read are `images[0].url` (a **signed, expiring** URL) and
`cost_usd`. `width` and `height` on the image object are not populated — take
the dimensions from `usage.resolution`.

## Picking a model

```bash
curl -s "https://apis.fotohub.app/v1/models?category=image"
```

No key needed. Some representative per-request rates from the live catalogue:

| Model | USD / image |
|---|---|
| `ida-q-image` — our own model, asynchronous | 0.0266 |
| `seedream-5-0-260128` | 0.0558 |
| `flux-2-pro` | 0.0478 |
| `gpt-image-1` | 0.1594 |

Rates move. Read them from `GET /v1/pricing`, which is what the biller reads.

## IDA Q is the one asynchronous image model

`ida-q-image` runs on our own GPU on a single-GPU queue, so it does not answer
on the same request. It returns `202` with a `job_id` and a `poll_url`:

```json
{
  "model": "ida-q-image",
  "job_id": "…",
  "status": "queued",
  "estimated_seconds": 25,
  "poll_url": "https://apis.fotohub.app/v1/ai/generate/image/ida-q/…"
}
```

Poll `GET /v1/ai/generate/image/ida-q/{job_id}` until `status` is `completed`.
See [IDA Q 1.0](/api/ida-q).

## Editing an existing image

```
POST https://apis.fotohub.app/v1/ai/edit/image
```

Synchronous, same response shape. See [Image Editing](/api/image-editing).

## Delivering straight to your own bucket

Pass an `output` object on the request and the result is written to your own
storage instead of leaving you to download a signed URL before it expires. See
[Bucket delivery](/guides/bucket-delivery).

## Next

[Image Generation reference](/api/image-generation) ·
[Model catalogue](/api/models) ·
[Video quickstart](/guides/quickstart-video)
