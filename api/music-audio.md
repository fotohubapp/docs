# Music & Audio

Complete audio generation and processing suite. Generate original music tracks and sound effects from text descriptions, convert text to natural-sounding speech with multiple voice options, transcribe audio to text, translate audio between languages, and dub content while preserving speaker voice characteristics.

| Capability | Description | Duration/Limits |
|------------|-------------|-----------------|
| **Music** | AI Composition (IDA Music, MiniMax) | 5–480 seconds |
| **SFX** | Sound Effects | instant generation |
| **TTS** | Text-to-Speech (IDA Voice) | 30+ languages |
| **STT** | Transcription | auto language detect |

---

## IDA Music

FOTOhub's proprietary music generation engine — **IDA Music** — runs on dedicated GPU infrastructure. It generates full songs with vocals, lyrics, and complex arrangements up to 8 minutes long.

### Endpoint

```
POST /v1/ai/generate/music
```

Use `model: "ida-music"` to route to IDA Music.

**Billing:** 2 credits (≤3 min) or 4 credits (>3 min)

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | **Yes** | — | Detailed description: genre, instruments, mood, vocal style, energy. |
| `model` | string | **Yes** | — | Must be `"ida-music"` |
| `lyrics` | string | No | — | Song lyrics with structure tags: `[verse]`, `[chorus]`, `[bridge]`, `[outro]`. Auto-generated if omitted. |
| `duration` | integer | No | `120` | Duration in seconds. Range: 30–480. |
| `bpm` | integer | No | auto | Target tempo (60–220 BPM). |
| `key_scale` | string | No | auto | Musical key: `"C major"`, `"A minor"`, `"F# major"`, etc. |
| `time_signature` | string | No | `"4/4"` | Time signature: `"4/4"`, `"3/4"`, `"6/8"`, `"5/4"`, `"7/8"`. |
| `vocal_language` | string | No | `"en"` | Vocal language: `"en"`, `"zh"`, `"ja"`, `"ko"`, `"es"`, `"fr"`, `"de"`, `"it"`, `"pt"`, `"ru"`, `"ar"`, `"hi"`, `"instrumental"`. |
| `vocal_gender` | string | No | `"auto"` | `"male"`, `"female"`, or `"auto"`. |
| `is_instrumental` | boolean | No | `false` | When true, generates instrumental only (ignores lyrics/vocal params). |
| `quality` | string | No | `"standard"` | `"draft"` (fast, 20 steps), `"standard"` (balanced, 40 steps), `"high"` (best, 50 steps), `"max"` (highest, Heun sampler). |
| `batch_size` | integer | No | `1` | Generate 1–4 variations in one request. |
| `seed` | integer | No | random | Reproducibility seed. |
| `audio_format` | string | No | `"mp3"` | Output format: `"mp3"`, `"wav"`, `"flac"`. |

### Quality Presets

| Preset | Steps | Guidance | Sampler | Speed |
|--------|-------|----------|---------|-------|
| `draft` | 20 | 5.0 | Euler | ~15s |
| `standard` | 40 | 5.0 | Euler | ~30s |
| `high` | 50 | 7.0 | Euler | ~45s |
| `max` | 50 | 7.0 | Heun + ADG | ~90s |

### Response

```json
{
  "model": "ida-music",
  "credits_used": 2,
  "audio_url": "https://gpu.fotohub.app/static/generations/acestep_abc123.mp3",
  "audio_urls": ["https://gpu.fotohub.app/static/generations/acestep_abc123.mp3"],
  "title": "Neon Pulse",
  "lyrics": "[verse]\nCity lights are burning bright...",
  "duration": 120,
  "metadata": {
    "bpm": 128,
    "key_scale": "A minor",
    "time_signature": "4/4",
    "vocal_language": "en",
    "seed": 42
  }
}
```

### Compose Lyrics (Free)

Generate lyrics and suggested parameters using the built-in AI composer — no credits charged.

```
POST /v1/ai/generate/music/compose
```

```json
{
  "prompt": "Upbeat summer pop song about road trips and freedom",
  "vocal_language": "en",
  "vocal_gender": "female",
  "duration": 180
}
```

**Response:**
```json
{
  "lyrics": "[verse]\nWindows down on the highway...\n[chorus]\nWe're chasing sunsets...",
  "title": "Highway Sunsets",
  "cover_prompt": "Retro convertible driving through desert at golden hour",
  "suggested_bpm": 118,
  "suggested_key": "G major",
  "suggested_time_signature": "4/4",
  "suggested_duration": 180,
  "suggested_genre": "pop"
}
```

### Lyric Structure Tags

Use these tags in `lyrics` to control song structure:

```
[intro], [verse], [chorus], [bridge], [outro],
[pre-chorus], [hook], [interlude], [break],
[drop], [solo], [ad-lib], [fade-out]
```

### Example

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/music",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Epic cinematic orchestral piece with soaring strings, "
                  "powerful brass, and dramatic percussion. Build from quiet "
                  "to a thunderous climax.",
        "model": "ida-music",
        "duration": 180,
        "key_scale": "D minor",
        "time_signature": "4/4",
        "is_instrumental": True,
        "quality": "high",
        "audio_format": "flac"
    }
)

result = response.json()
print(f"Audio: {result['audio_url']}")
print(f"Credits: {result['credits_used']}")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/music",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "Epic cinematic orchestral piece with soaring strings, " +
              "powerful brass, and dramatic percussion.",
      model: "ida-music",
      duration: 180,
      key_scale: "D minor",
      time_signature: "4/4",
      is_instrumental: true,
      quality: "high",
      audio_format: "flac",
    }),
  }
);

const result = await response.json();
console.log(`Audio: ${result.audio_url}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/music" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Epic cinematic orchestral piece with soaring strings, powerful brass, and dramatic percussion.",
    "model": "ida-music",
    "duration": 180,
    "key_scale": "D minor",
    "is_instrumental": true,
    "quality": "high",
    "audio_format": "flac"
  }'
```

:::

::: tip IDA Music vs Cloud Models
**IDA Music** runs on FOTOhub's own GPU infrastructure, which means: lower latency for European users, no external rate limits, full control over output quality, and significantly lower cost (2–4 credits vs 5–25 for cloud models). Use IDA Music for production music, and MiniMax for quick drafts or specific vocal styles.
:::

---

## Music Generation (Cloud)

### Endpoint

```
POST /v1/ai/generate/music
```

**Billing:** 5–25 credits (tiered by duration)

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | **Yes** | — | Detailed description of the music. Include genre, instruments, mood, energy level, and intended use case. |
| `model` | string | No | `"minimax"` | `"minimax"` — cloud music generation with tiered pricing. |
| `duration` | integer | No | `30` | Duration in seconds. Range: 5–180. Longer tracks cost more. |
| `genre` | string | No | — | Genre hint: `"electronic"`, `"jazz"`, `"classical"`, `"hip-hop"`, `"ambient"`, `"rock"`, `"folk"`, `"cinematic"`. |
| `mood` | string | No | — | Mood hint: `"happy"`, `"melancholic"`, `"energetic"`, `"calm"`, `"dark"`, `"uplifting"`, `"mysterious"`. |
| `tempo` | integer | No | `120` | Target tempo in BPM. Range: 60–200. |
| `instrumental` | boolean | No | `true` | When true, generates instrumental-only (no vocals). Set false for vocal elements. |

### Pricing

| Model | Credits | PLN | Notes |
|-------|---------|-----|-------|
| MiniMax Music | 5 / 10 / 25 | 0.30/min | ≤30s: 5cr, ≤60s: 10cr, >60s: 25cr |

### Response

```json
{
  "model": "minimax",
  "credits_used": 5,
  "billing": {
    "method": "credits",
    "credits_used": 5,
    "pln_charged": 1.50
  },
  "audio_url": "https://s1.fotohub.app/storage/v1/object/public/generations/audio/mj_xyz789.mp3",
  "duration": 30,
  "format": "mp3"
}
```

::: info Credit Tiers (MiniMax)
MiniMax uses tiered pricing: **5 credits** for ≤30s, **10 credits** for ≤60s, **25 credits** for >60s (up to 180s).
:::

### Example

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/music",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Upbeat electronic dance track with pulsing synths, "
                  "crisp hi-hats, deep bass drops, and euphoric buildup "
                  "sections. Suitable for a product launch video.",
        "model": "minimax",
        "duration": 60,
        "genre": "electronic",
        "mood": "energetic",
        "tempo": 128,
        "instrumental": True
    }
)

result = response.json()
print(f"Audio URL: {result['audio_url']}")
print(f"Duration: {result['duration']}s")
print(f"Credits used: {result['credits_used']}")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/music",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "Upbeat electronic dance track with pulsing synths, " +
              "crisp hi-hats, deep bass drops, and euphoric buildup " +
              "sections. Suitable for a product launch video.",
      model: "minimax",
      duration: 60,
      genre: "electronic",
      mood: "energetic",
      tempo: 128,
      instrumental: true,
    }),
  }
);

const result = await response.json();
console.log("Audio URL:", result.audio_url);
console.log(`Duration: ${result.duration}s`);
console.log(`Credits used: ${result.credits_used}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/music" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Upbeat electronic dance track with pulsing synths, crisp hi-hats, deep bass drops, and euphoric buildup sections.",
    "model": "minimax",
    "duration": 60,
    "genre": "electronic",
    "mood": "energetic",
    "tempo": 128,
    "instrumental": true
  }'
```

:::

---

## Sound Effects

### Endpoint

```
POST /v1/ai/generate/sfx
```

**Billing:** 3 credits (fixed, regardless of duration)

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | **Yes** | — | Description of the sound effect. Be specific about source, environment, and characteristics. |
| `duration` | integer | No | `5` | Duration in seconds. Range: 1–30. Most SFX work best at 3–10 seconds. |

### Response

```json
{
  "credits_used": 3,
  "billing": {
    "method": "credits",
    "credits_used": 3,
    "pln_charged": 0.225
  },
  "audio_url": "https://s1.fotohub.app/storage/v1/object/public/generations/sfx/sfx_r4nd0m.mp3",
  "duration": 5,
  "format": "mp3"
}
```

### Example

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/sfx",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "Sci-fi laser gun firing three rapid shots, "
                  "with a reverberating echo in a metallic corridor",
        "duration": 3
    }
)

result = response.json()
print(f"SFX URL: {result['audio_url']}")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/sfx",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "Sci-fi laser gun firing three rapid shots, " +
              "with a reverberating echo in a metallic corridor",
      duration: 3,
    }),
  }
);

const result = await response.json();
console.log("SFX URL:", result.audio_url);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/sfx" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Sci-fi laser gun firing three rapid shots, with a reverberating echo in a metallic corridor",
    "duration": 3
  }'
```

:::

---

## Text-to-Speech

### Endpoint

```
POST /v1/ai/generate/speech
```

**Billing:** 1–2 credits per 1000 characters

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | **Yes** | — | Text to synthesize. Max 5000 characters. Supports SSML for advanced control. |
| `model` | string | No | `"google"` | TTS engine: `"google"` (fast, cost-effective) or `"ida-voice"` (natural, cloned voices). |
| `voice_id` | string | No | — | Voice preset ID. Google: `"pl-PL-Standard-A"`, `"en-US-Neural2-F"`, etc. IDA Voice: custom voice ID from dashboard. |
| `language` | string | No | `"en"` | Target language: `"pl"`, `"en"`, `"de"`, `"fr"`, `"es"`. |
| `speed` | number | No | `1.0` | Speech speed multiplier. Range: 0.5–2.0. |
| `pitch` | number | No | `0` | Pitch adjustment in semitones. Range: -10 to +10. |

### Pricing

| Model | Credits | PLN | Notes |
|-------|---------|-----|-------|
| Google Cloud TTS | 1 | 0.09 | per 1000 characters, fast |
| IDA Voice Pro | 2 | 0.18 | per 1000 characters, natural voice, cloning |

### Response

```json
{
  "model": "google",
  "credits_used": 1,
  "billing": {
    "method": "credits",
    "credits_used": 1,
    "pln_charged": 0.09
  },
  "audio_url": "https://s1.fotohub.app/storage/v1/object/public/generations/speech/tts_k8m2n1.mp3",
  "duration": 12.4,
  "format": "mp3",
  "characters_processed": 847
}
```

### Example

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/speech",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "text": "Witaj w FOTOhub! Nasza platforma umozliwia "
                "generowanie obrazow, wideo i muzyki za pomoca "
                "sztucznej inteligencji.",
        "model": "google",
        "voice_id": "pl-PL-Standard-B",
        "language": "pl",
        "speed": 1.0,
        "pitch": 0
    }
)

result = response.json()
print(f"Audio URL: {result['audio_url']}")
print(f"Duration: {result['duration']}s")
print(f"Characters processed: {result['characters_processed']}")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/speech",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: "Witaj w FOTOhub! Nasza platforma umozliwia " +
            "generowanie obrazow, wideo i muzyki za pomoca " +
            "sztucznej inteligencji.",
      model: "google",
      voice_id: "pl-PL-Standard-B",
      language: "pl",
      speed: 1.0,
      pitch: 0,
    }),
  }
);

const result = await response.json();
console.log("Audio URL:", result.audio_url);
console.log(`Duration: ${result.duration}s`);
console.log(`Characters: ${result.characters_processed}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/speech" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Witaj w FOTOhub! Nasza platforma umozliwia generowanie obrazow, wideo i muzyki za pomoca sztucznej inteligencji.",
    "model": "google",
    "voice_id": "pl-PL-Standard-B",
    "language": "pl",
    "speed": 1.0,
    "pitch": 0
  }'
```

:::

::: tip IDA Voice Cloning
With IDA Voice Pro, you can use custom cloned voices. Upload a voice sample via the FOTOhub dashboard to create a custom voice_id, then reference it in API calls. Cloned voices support all languages with natural accent preservation.
:::

---

## Speech-to-Text (Transcription)

### Endpoint

```
POST /v1/ai/transcribe
```

**Billing:** 1 credit per minute of audio

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `audio_url` | string | **Yes** | — | URL of audio file (MP3, WAV, M4A, FLAC, OGG, WebM). Max 500MB, max 4 hours. |
| `language` | string | No | `"auto"` | Source language or `"auto"` for detection. Options: `"pl"`, `"en"`, `"de"`, `"fr"`, `"es"`. |
| `mode` | string | No | `"transcribe"` | `"transcribe"` (same language), `"translate"` (to English), or `"dub"` (re-synthesize in target language). |
| `timestamps` | boolean | No | `true` | Include word-level timestamps for subtitle generation. |
| `diarize` | boolean | No | `false` | Enable speaker diarization (identify different speakers). |

### Response

```json
{
  "credits_used": 3,
  "billing": {
    "method": "credits",
    "credits_used": 3,
    "pln_charged": 0.18
  },
  "text": "Dzien dobry, chcialbym zamowic projekt graficzny dla mojej firmy...",
  "language_detected": "pl",
  "duration_minutes": 2.8,
  "segments": [
    {
      "start": 0.0,
      "end": 3.2,
      "text": "Dzien dobry, chcialbym zamowic",
      "speaker": null
    },
    {
      "start": 3.2,
      "end": 6.8,
      "text": "projekt graficzny dla mojej firmy...",
      "speaker": null
    }
  ],
  "confidence": 0.96
}
```

### Example

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/transcribe",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "audio_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/meeting-recording.mp3",
        "language": "auto",
        "mode": "transcribe",
        "timestamps": True,
        "diarize": True
    }
)

result = response.json()
print(f"Detected language: {result['language_detected']}")
print(f"Full transcript: {result['text']}")

for segment in result["segments"]:
    speaker = segment.get("speaker", "Unknown")
    print(f"[{segment['start']:.1f}s - {segment['end']:.1f}s] "
          f"Speaker {speaker}: {segment['text']}")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/transcribe",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_url: "https://s1.fotohub.app/storage/v1/object/public/uploads/meeting-recording.mp3",
      language: "auto",
      mode: "transcribe",
      timestamps: true,
      diarize: true,
    }),
  }
);

const result = await response.json();
console.log(`Detected language: ${result.language_detected}`);
console.log(`Full transcript: ${result.text}`);

for (const segment of result.segments) {
  const speaker = segment.speaker ?? "Unknown";
  console.log(
    `[${segment.start.toFixed(1)}s - ${segment.end.toFixed(1)}s] ` +
    `Speaker ${speaker}: ${segment.text}`
  );
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/transcribe" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/meeting-recording.mp3",
    "language": "auto",
    "mode": "transcribe",
    "timestamps": true,
    "diarize": true
  }'
```

:::

---

## Audio Translation

Uses the same endpoint as transcription with `mode: "translate"`.

```
POST /v1/ai/transcribe
```

**Billing:** 2 credits per minute of audio

Set `"mode": "translate"` to translate any spoken audio to English text.

### Response

```json
{
  "credits_used": 4,
  "billing": {
    "method": "credits",
    "credits_used": 4,
    "pln_charged": 0.24
  },
  "text": "Good morning, I would like to order a graphic design project for my company...",
  "source_language": "pl",
  "target_language": "en",
  "duration_minutes": 2.0,
  "confidence": 0.94
}
```

::: info
Audio translation always outputs English text, regardless of source language. The source language is auto-detected and reported in the response.
:::

---

## Audio Dubbing

Translate and re-synthesize audio while preserving the original speaker's voice characteristics.

```
POST /v1/ai/transcribe
```

**Billing:** 5 credits per minute of audio

### Additional Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mode` | string | **Yes** | Must be `"dub"` |
| `target_language` | string | **Yes** | Target language: `"pl"`, `"en"`, `"de"`, `"fr"`, `"es"` |
| `preserve_timing` | boolean | No | Match original speech timing for video sync (default: true) |

### Response

```json
{
  "credits_used": 15,
  "billing": {
    "method": "credits",
    "credits_used": 15,
    "pln_charged": 0.90
  },
  "audio_url": "https://s1.fotohub.app/storage/v1/object/public/generations/dubbed/dub_q2w3e4.mp3",
  "source_language": "pl",
  "target_language": "en",
  "duration_minutes": 3.0,
  "speakers_detected": 2,
  "format": "mp3"
}
```

### Example

::: code-group

```python [Python]
import requests

# Dub a Polish podcast episode into English
response = requests.post(
    "https://apis.fotohub.app/v1/ai/transcribe",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "audio_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/podcast-ep01.mp3",
        "mode": "dub",
        "target_language": "en",
        "preserve_timing": True
    }
)

result = response.json()
print(f"Dubbed audio: {result['audio_url']}")
print(f"Source: {result['source_language']} -> Target: {result['target_language']}")
print(f"Speakers detected: {result['speakers_detected']}")
print(f"Credits used: {result['credits_used']}")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/transcribe",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_url: "https://s1.fotohub.app/storage/v1/object/public/uploads/podcast-ep01.mp3",
      mode: "dub",
      target_language: "en",
      preserve_timing: true,
    }),
  }
);

const result = await response.json();
console.log(`Dubbed audio: ${result.audio_url}`);
console.log(`Source: ${result.source_language} -> Target: ${result.target_language}`);
console.log(`Speakers detected: ${result.speakers_detected}`);
console.log(`Credits used: ${result.credits_used}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/transcribe" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/podcast-ep01.mp3",
    "mode": "dub",
    "target_language": "en",
    "preserve_timing": true
  }'
```

:::

::: warning Processing Time
Audio dubbing is the most computationally intensive audio operation. Expect processing times of 2–5× the audio duration. For files longer than 10 minutes, the response will include a `job_id` for asynchronous polling.
:::

---

## Pricing Summary

| Service | Model | Credits | PLN Cost | Unit |
|---------|-------|---------|----------|------|
| Music | IDA Music (≤3 min) | 2 | 0.15 | per generation |
| Music | IDA Music (>3 min) | 4 | 0.30 | per generation |
| Music | MiniMax | 5–25 | 0.30/min | tiered by duration |
| Sound Effects | — | 3 | 0.225 | fixed per generation |
| TTS (IDA Voice) | google | 1 | 0.09 | per 1000 characters |
| TTS (IDA Voice) | ida-voice | 2 | 0.18 | per 1000 characters |
| Transcription | — | 1 | 0.06 | per minute of audio |
| Translation | — | 2 | 0.12 | per minute of audio |
| Dubbing | — | 5 | 0.30 | per minute of audio |

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `bad_request` | Invalid parameters: unsupported format, duration out of range, invalid voice_id. |
| 402 | `insufficient_credits` | Not enough credits for the requested operation. |
| 413 | `file_too_large` | Audio file exceeds 500MB. Compress or split before uploading. |
| 422 | `unprocessable_audio` | File corrupted, unsupported codec, or no detectable speech. |
| 429 | `rate_limit_exceeded` | Audio limits: 20 req/min (TTS/SFX), 10 req/min (music), 5 req/min (transcription/dubbing). |
