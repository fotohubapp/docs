# IDA Q: Self-Hosted Image Model

::: warning This page previously described a different product
Earlier revisions of this page documented **IDA Q** as an interactive "intelligent
assistant" with its own chat endpoint (`POST /v1/ai/ida-q`), SSE streaming, a
cost-preflight planner, multi-turn threads, and an embeddable iframe widget. None of
that exists in production — there is no such endpoint and no such assistant.

**IDA Q 1.0 is actually FOTOhub's proprietary, self-hosted image generation model.**
It is submitted like any other image model through `POST /v1/ai/generate/image`
with `model: "ida-q-image"`, and — because it runs on our own single-GPU queue
rather than a synchronous provider — it is the one image model on the platform that
is **asynchronous**: you get a `job_id` back and poll for the result.
:::

---

## What it is

IDA Q 1.0 runs entirely on FOTOhub's own infrastructure rather than reselling a
third-party image API. That keeps the marginal cost near zero, but it also means
generation goes through a real, capacity-limited queue: expect **30 seconds to
3.5 minutes** depending on resolution and how many images are ahead of yours, not
the near-instant response you get from a synchronous provider.

| | |
|---|---|
| Model id | `ida-q-image` |
| Submit | `POST /v1/ai/generate/image` |
| Poll | `GET /v1/ai/generate/image/ida-q/{job_id}` |
| Max images per request | 2 |
| Resolutions | `1K` (~30s), `1.5K` (~92s), `2K` (~210s) — times are per image |

---

## Submitting a job

Use the standard image generation endpoint and set `model` to `ida-q-image`. Because
this model is async, the response is a `202` with a `job_id` and a `poll_url` —
**not** an image.

::: code-group

```python [Python]
import os
import requests

API_KEY = os.environ["FOTOHUB_API_KEY"]
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

payload = {
    "model": "ida-q-image",
    "prompt": "Editorial studio macro photograph of a titanium chronograph wristwatch on dark polished slate, soft directional key light, 8k detail",
    "num_images": 1,
    "image_size": "1K",
    "aspect_ratio": "1:1",
}

res = requests.post("https://apis.fotohub.app/v1/ai/generate/image", headers=headers, json=payload)
data = res.json()
print(f"job_id: {data['job_id']}  status: {data['status']}  poll_url: {data['poll_url']}")
```

```typescript [TypeScript]
const res = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "ida-q-image",
    prompt: "Editorial studio macro photograph of a titanium chronograph wristwatch on dark polished slate, soft directional key light, 8k detail",
    num_images: 1,
    image_size: "1K",
    aspect_ratio: "1:1",
  }),
});
const data = await res.json();
console.log(data.job_id, data.status, data.poll_url);
```

```bash [cURL]
curl -s -X POST "https://apis.fotohub.app/v1/ai/generate/image" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ida-q-image",
    "prompt": "Editorial studio macro photograph of a titanium chronograph wristwatch on dark polished slate, soft directional key light, 8k detail",
    "num_images": 1,
    "image_size": "1K",
    "aspect_ratio": "1:1"
  }'
```

:::

### Submit response (`202 Accepted`)

```json
{
  "model": "ida-q-image",
  "job_id": "9f8e7d6c-5b4a-4321-8765-abcdef012345",
  "status": "queued",
  "usd_charged": 0.0450,
  "balance_usd": 48.7210,
  "estimated_seconds": 30,
  "poll_url": "https://apis.fotohub.app/v1/ai/generate/image/ida-q/9f8e7d6c-5b4a-4321-8765-abcdef012345"
}
```

Billing happens at submit time, before the GPU runs the job. If the model is
disabled or the queue is full, the charge is refunded and the request fails with
`503`/`429` (see [Error Handling](#error-handling) below) — you are never charged
for a job that never ran.

---

## Polling for the result

Poll `GET /v1/ai/generate/image/ida-q/{job_id}` — the same `job_id` from the submit
response — until `status` is `completed` or `failed`.

```bash
curl -s "https://apis.fotohub.app/v1/ai/generate/image/ida-q/9f8e7d6c-5b4a-4321-8765-abcdef012345" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

While queued/running:

```json
{
  "job_id": "9f8e7d6c-5b4a-4321-8765-abcdef012345",
  "status": "processing",
  "progress": 40,
  "estimated_seconds": 30
}
```

Once complete:

```json
{
  "job_id": "9f8e7d6c-5b4a-4321-8765-abcdef012345",
  "status": "completed",
  "progress": 100,
  "estimated_seconds": 30,
  "images": ["https://s3point.fotohub.app/generations/img_abc123.webp"],
  "metadata": { "model": "ida-q-image" }
}
```

On failure:

```json
{
  "job_id": "9f8e7d6c-5b4a-4321-8765-abcdef012345",
  "status": "failed",
  "progress": 0,
  "error": "Generation failed. Please try again."
}
```

A failed IDA Q job is **not** automatically refunded — check your transaction
history (`GET /v1/console/billing/transactions`) if a job fails and you were
charged.

---

## Error Handling

| Status Code | Cause |
|:---|:---|
| `400 Bad Request` | Missing `prompt`, or an invalid `image_size`/`aspect_ratio`. |
| `401 Unauthorized` | Missing or revoked Bearer token. |
| `402 Payment Required` | Wallet balance too low to cover the charge. |
| `429 Too Many Requests` | `QUEUE_FULL` — more than 25 jobs already queued on the single-GPU worker. The charge is refunded automatically. |
| `503 Service Unavailable` | `MODEL_DISABLED` — IDA Q 1.0 is temporarily switched off. You are not charged. |

---

## Related

- **[Image Generation](/api/image-generation)** — the shared `/v1/ai/generate/image` endpoint IDA Q submits through, including the other (synchronous) models available on it.
- **[Gabriel AI](/api/gabriel-ai)** — FOTOhub's actual prompt-routing/classification endpoint, if you were looking for an assistant that decides which model or pipeline to call.
