# 3D quickstart

Text-to-3D and image-to-3D, running on our own GPUs. Synchronous, billed per
request rather than per second.

> Prerequisite: a key and a funded wallet — see the [Quickstart](/guides/quickstart).

## The models

```bash
curl -s https://apis.fotohub.app/v1/ai/generate/3d/models
```

No key needed. The live answer:

| Model | Mode | Typical time | USD / request | Available |
|---|---|---|---|---|
| `fh-lite-3d` | image-to-3d | ~3 s | 0.160772 | yes |
| `fh-text-3d` | text-to-3d | ~25 s | 0.267953 | yes |
| `fh-pro-3d` | image-to-3d | ~60 s | 0.803859 | **no** |

`fh-pro-3d` is in the catalogue but currently reports `available: false` — check
the endpoint rather than assuming, since that flag is what the router honours.

## Submit

```
POST https://apis.fotohub.app/v1/ai/generate/3d
```

::: code-group

```bash [text-to-3d]
curl -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "text-to-3d",
    "model": "fh-text-3d",
    "prompt": "a ceramic coffee mug with a rounded handle",
    "format": "glb",
    "quality": "standard"
  }'
```

```bash [image-to-3d]
curl -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "image-to-3d",
    "model": "fh-lite-3d",
    "image_base64": "'"$(base64 -w0 mug.png)"'",
    "format": "glb"
  }'
```

:::

| Field | Type | Notes |
|---|---|---|
| `mode` | string | **Required.** `image-to-3d` or `text-to-3d`. |
| `model` | string | **Required.** `fh-lite-3d`, `fh-text-3d` or `fh-pro-3d`. |
| `image_base64` | string | Required when `mode` is `image-to-3d`. |
| `prompt` | string | Required when `mode` is `text-to-3d`. Max 500 characters. |
| `quality` | string | `draft`, `standard`, `high`, `ultra`. Default `standard`. |
| `format` | string | `glb`, `obj`, `stl`, `usdz`. Default `glb`. |
| `options` | object | Model-specific extras. |

A mode/field mismatch — `text-to-3d` without a `prompt`, or `image-to-3d`
without `image_base64` — is a `400` raised **before** the wallet is charged.

## The response comes back on the same request

`POST /v1/ai/generate/3d` is **synchronous**: it holds the connection until the
mesh exists and returns it directly. There is no queue and nothing to poll.

`GET /v1/ai/generate/3d/{job_id}` does exist, but it is not a poll — it re-signs
the expiring download link for an asset that is already finished, and it is free.
Use it when a `url` from an earlier generation has expired. Passing the
`file_id` the generate call returned is what it expects.

The wallet is charged before the GPU is called. A `402` with
`code: insufficient_funds` means the wallet could not cover the request, and
nothing was started. A generation that fails on the engine side is refunded, and
the response says so explicitly.

## Where each model runs

This matters if your compliance posture depends on EU-only processing, so it is
worth being exact rather than reassuring.

- `fh-lite-3d` and `fh-text-3d` — the two models that are available today — run
  on our own GPU in AWS **eu-west-1**. Your data stays in the EU.
- `fh-pro-3d` runs on a GPU in the **United States**. It is the single FOTOhub
  workload outside Europe, because no European zone had the required GPU class
  free when that capacity was provisioned. It is currently reported
  `available: false` by `GET /v1/ai/generate/3d/models`, so in practice nothing
  you can call today leaves the EU — but check that flag rather than assuming it,
  because the model becoming available is what changes the answer.

Everything else on the platform runs on our own European infrastructure.

## Next

[3D Generation reference](/api/3d-generation) ·
[Model catalogue](/api/models)
