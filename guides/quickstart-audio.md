# Audio, speech & music quickstart

Three separate synchronous endpoints, three different billing units. That last
point is the one that catches people out, so it is the first table on this page.

> Prerequisite: a key and a funded wallet — see the [Quickstart](/guides/quickstart).

## Billing units differ per endpoint

| Capability | Endpoint | Billed per |
|---|---|---|
| Music | `POST /v1/ai/generate/music` | **minute of output** |
| Sound effects | `POST /v1/ai/generate/sfx` | **request** |
| Speech | `POST /v1/ai/generate/speech` | **1,000 characters of input** |
| Transcription | `POST /v1/ai/transcribe` | **minute of input** |

Live rates: `music-minimax` $0.0797/min, `music-elevenlabs` $0.1993/min,
`sfx-elevenlabs` $0.0598/request, `tts-google` $0.0239 per 1K characters,
`tts-elevenlabs` $0.0478 per 1K characters, `transcription` $0.0159/min.
Confirm against `GET /v1/pricing` before you rely on them.

## Music

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/music \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "minimax",
    "prompt": "warm lo-fi beat for a product demo",
    "genre": "lo-fi",
    "duration": 30,
    "bpm": 90,
    "instrumental": true
  }'
```

| Field | Notes |
|---|---|
| `prompt` | Required. |
| `model` | `minimax` or `elevenlabs`. |
| `duration` | 10–300 seconds. Checked **before** billing. |
| `genre` | **Required for `elevenlabs`**, optional for `minimax`. |
| `mood` | Optional. |
| `bpm` | 60–200. `tempo` is accepted as a deprecated alias. |
| `loop` | Optional. |
| `instrumental` | Optional. |

`duration` and `bpm` are the providers' own limits and are validated before the
wallet is touched, so an out-of-range value costs nothing.

## Sound effects

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/sfx \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a heavy wooden door closing in a stone hall", "duration": 5}'
```

`duration` is capped at 30 seconds. Billed per request, so a 5-second effect and
a 30-second effect cost the same.

## Speech

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/speech \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Dzień dobry — to jest test syntezy mowy.",
    "model": "google",
    "language": "pl",
    "speed": 1.0
  }'
```

| Field | Notes |
|---|---|
| `text` | Required. Length cap depends on the model — see below. |
| `model` | `google`, `ida-voice-pro`, `ida-voice` or `grok`. |
| `voice_id` | Optional, model-specific. Leave it out for the model's default; `grok` takes names like `eve`. |
| `language` | e.g. `pl`, `en`, `de`. |
| `speed` | Default `1.0`. |
| `pitch` | Default `0`. |

| Model | Character cap | Notes |
|---|---|---|
| `google` | 3,000 | The cheap, fast tier |
| `grok` | 3,000 | 26 multilingual voices |
| `ida-voice-pro` | **1,200** | The natural-sounding tier |
| `ida-voice` | **1,200** | Self-hosted on our own GPU |

`mars-flash`, `mars-pro`, `chatterbox-tts` and the legacy `elevenlabs` alias are
also accepted and map onto the same engines. Anything else is rejected with a
`400` naming the supported set.

Over-length text is rejected **before** the wallet is touched, and the error
says which cap you hit and that up to 3,000 characters is available on the
`mars-pro` / `mars-flash` voices — so a too-long string costs you nothing.

Billed per 1,000 characters of **input text**, not per request — the same
200-character string costs the same whether the audio is fast or slow.

### Provider-specific TTS

If you need a specific provider's voice catalogue rather than the generic
endpoint, three provider routes are exposed directly, each with a matching
voice listing:

```
POST /v1/ai/tts/azure/synthesize     GET /v1/ai/tts/azure/voices
POST /v1/ai/tts/gemini/synthesize    GET /v1/ai/tts/gemini/voices
POST /v1/ai/tts/polly/synthesize     GET /v1/ai/tts/polly/voices
```

There is also `POST /v1/ai/generate/speech/gpt`.

## Transcription

```
POST /v1/ai/transcribe
POST /v1/ai/transcribe/voxtral/transcribe
POST /v1/ai/transcribe/voxtral/summarize
```

The Voxtral pair transcribes and summarises in one pass; the plain route just
transcribes.

## What is priced but not exposed

The public catalogue (`GET /v1/models?category=audio`) lists four audio
capabilities that have **no public endpoint today**: `voice-clone`,
`audio-mastering`, `audio-stems` and `audio-translation`. They carry prices
because they run inside the platform, but there is currently no API route that
invokes them. Do not build against them until they appear in this reference.

## Next

[Music & Audio reference](/api/music-audio) ·
[Realtime Voice](/api/realtime-voice) ·
[Voice Agents](/api/voice-agents)
