# Multilingual Lip-Sync & Video Dubbing

::: warning This recipe was substantially rewritten
Earlier revisions described a pipeline built on `/v1/audio/separate`
(Demucs vocal isolation), `/v1/audio/transcribe`, `/v1/audio/tts`,
`/v1/audio/voice-sonic/generate` (zero-shot voice cloning), a
bring-your-own-bucket S3/R2 output destination for lip-sync jobs, and a
`lip_sync.job.completed` webhook with signature verification. Most of that
does not exist:

- **No vocal/stem separation endpoint anywhere on the API.** You cannot
  isolate dialogue from background music before dubbing.
- **No voice cloning.** There is no way to make the dubbed audio sound like
  the original speaker — see [Voice Cloning](/api/voice-cloning). Dubbed
  audio uses one of the built-in TTS voices instead.
- **No BYOB S3 destination parameter on lip-sync requests** — the request
  body is `video_url`, `audio_url`, `model`, `duration`, `enhance_face`,
  `output_format`, nothing else.
- **The lip-sync completion event is not subscribable.** The webhook system
  itself is real (`POST /v1/console/webhooks`, HMAC-signed deliveries), but
  its allow-list of subscribable events does not include a lip-sync
  completion event — poll the status endpoint instead.
- **No batch/multi-language dispatch endpoint** — process each language with
  your own loop.

What follows is what actually works: transcribe → translate → synthesize
speech in a built-in voice → lip-sync. All four calls take an `fh_live_*`
API key.
:::

---

## Pipeline

```mermaid
flowchart LR
    A[Original video + audio] --> B["POST /v1/ai/transcribe"]
    B --> C["POST /v1/ai/translate (per target language)"]
    C --> D["POST /v1/ai/generate/speech (built-in voice)"]
    D --> E["POST /v1/video/lip-sync"]
    E --> F[Finished dubbed video]
```

Because there is no stem separation, the new dubbed audio replaces the
**entire** original audio track — any background music or sound effects
under the original dialogue are lost unless you re-add them yourself before
the lip-sync step.

---

## 1. Transcribe the source audio

```http
POST /v1/ai/transcribe
```

Body: `{ "audio_url": "https://...", "language": "en" }` — billed per
started minute of input audio (see `GET /v1/pricing` for the current rate).

```python
import httpx

def transcribe(audio_url: str, api_key: str, language: str = "en") -> dict:
    resp = httpx.post(
        "https://apis.fotohub.app/v1/ai/transcribe",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"audio_url": audio_url, "language": language},
    )
    resp.raise_for_status()
    return resp.json()  # {"text": "...", "language": "...", ...}
```

## 2. Translate the transcript

```http
POST /v1/ai/translate
```

Body: `{ "text": "...", "target_language": "es", "source_language": "en" }`
— **not billed**, but rate-limited per subscription tier.

```python
def translate(text: str, target_language: str, api_key: str, source_language: str = None) -> str:
    resp = httpx.post(
        "https://apis.fotohub.app/v1/ai/translate",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"text": text, "target_language": target_language, "source_language": source_language},
    )
    resp.raise_for_status()
    return resp.json()["translated_text"]
```

## 3. Synthesize the dubbed audio

```http
POST /v1/ai/generate/speech
```

Body: `{ "text": "...", "model": "google" | "ida-voice" | "grok", "language": "es", "voice_id": "...", "speed": 1.0, "pitch": 0 }`
— max 3000 characters, billed per 1000 characters. `ida-voice` (self-hosted
IDA Voice / Chatterbox) supports 1200 characters per call; `google` and
`grok` support the full 3000. There is no way to match the original
speaker's voice — you're picking a built-in voice, not cloning one.

```python
def synthesize(text: str, language: str, api_key: str, model: str = "google") -> str:
    resp = httpx.post(
        "https://apis.fotohub.app/v1/ai/generate/speech",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"text": text, "model": model, "language": language},
    )
    resp.raise_for_status()
    return resp.json()["audio_url"]
```

## 4. Lip-sync the video to the new audio

```http
POST /v1/video/lip-sync
```

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `video_url` | string | **Yes** | — | URL of the face/reference video. |
| `audio_url` | string | **Yes** | — | URL of the audio to sync to (the dubbed track from step 3). |
| `model` | string | No | `musetalk` | `musetalk` (fast, ≤60s, 512×512), `latentsync` (HD, ≤30s, 1024×1024), `facefusion` (ultra, ≤120s, up to 4K). |
| `duration` | number | No | `5.0` | Seconds to process; billed per second, capped at the model's max. |
| `enhance_face` | boolean | No | `true` | Apply face enhancement post-processing. |
| `output_format` | string | No | `"mp4"` | `mp4` or `webm`. |

This call is **synchronous** — it blocks (up to 600s server-side) and
returns the finished result merged into the response body, so you generally
don't need to poll. See `GET /v1/video/lip-sync/models` for the current
per-second price of each model.

```python
def lip_sync(video_url: str, audio_url: str, api_key: str, model: str = "musetalk", duration: float = 10.0) -> dict:
    resp = httpx.post(
        "https://apis.fotohub.app/v1/video/lip-sync",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "video_url": video_url,
            "audio_url": audio_url,
            "model": model,
            "duration": duration,
        },
        timeout=600,
    )
    resp.raise_for_status()
    return resp.json()  # inspect the JSON for the delivered video's URL
```

### Optional: poll job status

```http
GET /v1/video/lip-sync/status/{job_id}
```

Free to call. Only useful if you tracked a `job_id` from a prior response —
there is no separate "dispatch, then poll" mode; the POST above already
returns the finished job.

---

## Putting it together: dub one video into several languages

There is no batch endpoint, so loop client-side. This also makes clear where
the real cost is: one transcription call, then one translate + speech +
lip-sync call **per target language**.

```python
def dub_video(video_url: str, source_audio_url: str, target_languages: list[str], api_key: str) -> dict[str, dict]:
    transcript = transcribe(source_audio_url, api_key)
    results = {}
    for lang in target_languages:
        translated = translate(transcript["text"], lang, api_key)
        dubbed_audio_url = synthesize(translated, lang, api_key)
        results[lang] = lip_sync(video_url, dubbed_audio_url, api_key, model="latentsync")
    return results

dub_video(
    video_url="https://storage.fotohub.app/videos/keynote.mp4",
    source_audio_url="https://storage.fotohub.app/videos/keynote.mp4",
    target_languages=["es", "fr", "de"],
    api_key="fh_live_your_api_key",
)
```

For real concurrency, run the per-language loop body with
`asyncio.gather` (and a `Semaphore` to bound how many run at once) instead
of a plain `for` loop — there's no platform-side parallelism to rely on.

---

## Errors

| HTTP Status | Meaning |
|:---|:---|
| `400` | Invalid parameter (e.g. `text` too long for `/v1/ai/generate/speech`, or an unrecognized `model`). |
| `401` | Missing or invalid `fh_live_*` API key. |
| `402` | Insufficient wallet balance. Top up at [fotohub.app/console/billing](https://fotohub.app/console/billing). |
| `404` | (status endpoint only) Job not found, or not owned by the caller. |
| `502` | Upstream engine unreachable or rejected the request. Charges made before the failure are refunded automatically. |
