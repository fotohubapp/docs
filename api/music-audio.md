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
  "audio_url": "https://gpu.fotohub.app/static/generations/ida_m_abc123.mp3",
  "audio_urls": ["https://gpu.fotohub.app/static/generations/ida_m_abc123.mp3"],
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

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"prompt":          "Epic cinematic orchestral piece with soaring strings, powerful brass, and dramatic percussion.",
		"model":           "ida-music",
		"duration":        180,
		"key_scale":       "D minor",
		"time_signature":  "4/4",
		"is_instrumental": true,
		"quality":         "high",
		"audio_format":    "flac",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/music", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	fmt.Printf("Audio: %s\n", result["audio_url"])
	fmt.Printf("Credits: %v\n", result["credits_used"])
}
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

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"prompt":       "Upbeat electronic dance track with pulsing synths, crisp hi-hats, deep bass drops, and euphoric buildup sections.",
		"model":        "minimax",
		"duration":     60,
		"genre":        "electronic",
		"mood":         "energetic",
		"tempo":        128,
		"instrumental": true,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/music", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	fmt.Printf("Audio URL: %s\n", result["audio_url"])
	fmt.Printf("Duration: %vs\n", result["duration"])
	fmt.Printf("Credits used: %v\n", result["credits_used"])
}
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

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"prompt":   "Sci-fi laser gun firing three rapid shots, with a reverberating echo in a metallic corridor",
		"duration": 3,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/sfx", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	fmt.Printf("SFX URL: %s\n", result["audio_url"])
}
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

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"text":     "Witaj w FOTOhub! Nasza platforma umozliwia generowanie obrazow, wideo i muzyki za pomoca sztucznej inteligencji.",
		"model":    "google",
		"voice_id": "pl-PL-Standard-B",
		"language": "pl",
		"speed":    1.0,
		"pitch":    0,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/speech", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	fmt.Printf("Audio URL: %s\n", result["audio_url"])
	fmt.Printf("Duration: %vs\n", result["duration"])
	fmt.Printf("Characters processed: %v\n", result["characters_processed"])
}
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

## Text-to-Speech (Polly)

Budget TTS with 106 neural/generative voices across 41 languages. 10-50x cheaper than premium providers.

### Endpoints

```
GET  /v1/ai/tts/polly/voices
POST /v1/ai/tts/polly/synthesize
```

**Billing:** 1 credit per 10,000 characters

### List Voices

```
GET /v1/ai/tts/polly/voices?language=pl-PL
```

Returns available voices filtered by language code.

**Response:**

```json
{
  "voices": [
    {
      "id": "Ola",
      "name": "Ola",
      "language": "pl-PL",
      "language_name": "Polish",
      "gender": "Female",
      "engines": ["generative", "neural"]
    }
  ],
  "count": 5
}
```

### Synthesize Speech

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | **Yes** | — | Text to synthesize. Max 10,000 characters. Supports SSML. |
| `voice_id` | string | No | `"Ola"` | Voice ID from the voices list. |
| `engine` | string | No | `"neural"` | Engine: `"neural"`, `"generative"`, or `"standard"`. |
| `output_format` | string | No | `"mp3"` | Format: `"mp3"`, `"ogg_vorbis"`, or `"pcm"`. |
| `language_code` | string | No | — | Language hint (e.g., `"pl-PL"`, `"en-US"`). |

**Response:** Audio stream (binary) with headers:
- `X-Credits-Used` — credits charged
- `X-Characters` — characters processed

### Example

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")
audio = client.tts.polly(
    text="Witaj w FOTOhub!",
    voice_id="Ola",
    engine="neural"
)
# audio is bytes (mp3)
with open("output.mp3", "wb") as f:
    f.write(audio)
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/tts/polly/synthesize",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: "Witaj w FOTOhub! Generuje mowe za pomoca AI.",
      voice_id: "Ola",
      engine: "neural",
      output_format: "mp3",
    }),
  }
);

const audioBuffer = await response.arrayBuffer();
// Write to file (Node.js)
import { writeFileSync } from "fs";
writeFileSync("output.mp3", Buffer.from(audioBuffer));
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
)

func main() {
	payload := map[string]interface{}{
		"text":          "Witaj w FOTOhub! Generuje mowe za pomoca AI.",
		"voice_id":      "Ola",
		"engine":        "neural",
		"output_format": "mp3",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/tts/polly/synthesize", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	out, _ := os.Create("output.mp3")
	defer out.Close()
	io.Copy(out, resp.Body)
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/tts/polly/synthesize" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -o output.mp3 \
  -d '{
    "text": "Witaj w FOTOhub! Generuje mowe za pomoca AI.",
    "voice_id": "Ola",
    "engine": "neural",
    "output_format": "mp3"
  }'
```

:::

### Pricing

| Engine | Cost (AWS) | Credits | Languages |
|--------|-----------|---------|-----------|
| Neural | $0.016/1K chars | 1 per 10K chars | 41 |
| Generative | $0.030/1K chars | 1 per 10K chars | 41 |
| Standard | $0.004/1K chars | 1 per 10K chars | 41 |

::: tip Polish Voices
Available Polish voices: **Ola** (Female, neural+generative), **Ewa** (Female, generative), **Maja** (Female, standard), **Jan** (Male, standard), **Jacek** (Male, standard).
:::

---

## Text-to-Speech (GPT Audio 1.5)

Premium AI voice synthesis using OpenAI's GPT Audio 1.5 model. Natural-sounding speech with voice style instructions support — describe the tone, emotion, and pace you want.

### Endpoint

```
POST /v1/ai/generate/speech/gpt
```

**Billing:** 2 credits per request

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | **Yes** | — | Text to synthesize. Max 10,000 characters. |
| `voice` | string | No | `"alloy"` | Voice: `alloy`, `ash`, `ballad`, `coral`, `echo`, `fable`, `nova`, `onyx`, `sage`, `shimmer`, `verse` |
| `instructions` | string | No | — | Voice style instructions. E.g., "Speak calmly like an audiobook narrator" or "Energetic sports commentator tone". |

### Pricing

| Model | Credits | PLN | Notes |
|-------|---------|-----|-------|
| GPT Audio 1.5 | 2 | 0.40 | per request, WAV HD output |

### Response

```json
{
  "credits_used": 2,
  "audio_url": "https://s1.fotohub.app/storage/v1/object/public/audio/gpt-tts/...",
  "transcript": "The text as spoken by the model",
  "model": "gpt-audio-1.5",
  "voice": "nova",
  "format": "wav",
  "usage": {
    "input_tokens": 32,
    "output_tokens": 216,
    "total_tokens": 248
  }
}
```

### Example

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_key")

result = client.audio.speech(
    text="Welcome to FOTOhub! Generate images, video, and music with AI.",
    voice="nova",
    instructions="Speak warmly and naturally, like a podcast host",
)
print(f"Audio: {result.audio_url}")
```

```typescript [TypeScript]
const response = await fetch(
  "https://apis.fotohub.app/v1/ai/generate/speech/gpt",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: "Welcome to FOTOhub! Generate images, video, and music with AI.",
      voice: "nova",
      instructions: "Speak warmly and naturally, like a podcast host",
    }),
  }
);

const result = await response.json();
console.log(`Audio: ${result.audio_url}`);
console.log(`Voice: ${result.voice}`);
console.log(`Tokens: ${result.usage.total_tokens}`);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"text":         "Welcome to FOTOhub! Generate images, video, and music with AI.",
		"voice":        "nova",
		"instructions": "Speak warmly and naturally, like a podcast host",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/speech/gpt", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	fmt.Printf("Audio: %s\n", result["audio_url"])
	fmt.Printf("Voice: %s\n", result["voice"])
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/speech/gpt" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome to FOTOhub! Generate images, video, and music with AI.",
    "voice": "nova",
    "instructions": "Speak warmly and naturally, like a podcast host"
  }'
```

:::

::: tip Voice Style Instructions
GPT Audio 1.5 supports freeform instructions for voice style. You can control tone, pace, emotion, and speaking style. Examples:
- `"Speak slowly and clearly, like a meditation guide"`
- `"Excited and energetic, like announcing a product launch"`
- `"Professional news anchor tone, neutral and clear"`
- `"Whispered, intimate storytelling voice"`
:::

---

## Speech-to-Text (Voxtral)

LLM-quality transcription using Mistral Voxtral models. Better context understanding than traditional ASR.

### Endpoints

```
POST /v1/ai/transcribe/voxtral/transcribe
POST /v1/ai/transcribe/voxtral/summarize
```

**Billing:** 1–2 credits per audio file

### Transcribe

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `audio` | string | **Yes** | — | Base64-encoded audio (WAV, MP3, OGG, FLAC, WebM). Max 25MB. |
| `model` | string | No | `"voxtral-small"` | Model: `"voxtral-small"` (24B, quality) or `"voxtral-mini"` (3B, fast). |
| `language` | string | No | — | Language hint for better accuracy. |
| `prompt` | string | No | — | Context/instruction for the model. |

**Response:**

```json
{
  "text": "Transcribed text content here...",
  "model": "voxtral-small",
  "credits_used": 2,
  "tokens": { "input": 1200, "output": 150 }
}
```

### Summarize

Same parameters as transcribe, plus:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `format` | string | No | `"bullets"` | Summary format: `"bullets"` or `"paragraph"`. |

Returns both transcription and summary in a single call (3 credits).

### Pricing

| Model | Credits | Quality | Speed |
|-------|---------|---------|-------|
| Voxtral Small 24B | 2 | High (LLM-quality context) | ~10s |
| Voxtral Mini 3B | 1 | Good (fast) | ~3s |

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

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"audio_url":  "https://s1.fotohub.app/storage/v1/object/public/uploads/meeting-recording.mp3",
		"language":   "auto",
		"mode":       "transcribe",
		"timestamps": true,
		"diarize":    true,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/transcribe", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	fmt.Printf("Detected language: %s\n", result["language_detected"])
	fmt.Printf("Full transcript: %s\n", result["text"])
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

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"audio_url":       "https://s1.fotohub.app/storage/v1/object/public/uploads/podcast-ep01.mp3",
		"mode":            "dub",
		"target_language": "en",
		"preserve_timing": true,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/transcribe", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	fmt.Printf("Dubbed audio: %s\n", result["audio_url"])
	fmt.Printf("Source: %s -> Target: %s\n", result["source_language"], result["target_language"])
	fmt.Printf("Speakers detected: %v\n", result["speakers_detected"])
	fmt.Printf("Credits used: %v\n", result["credits_used"])
}
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

## Audio Mastering

Professional mastering chain — applies EQ, compression, limiting, stereo imaging, and loudness normalization.

```
POST /v1/ai/generate/music
```

Set `"mode": "master"` to use the mastering pipeline instead of generation.

**Billing:** 3 credits per track

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `audio_url` | string | **Yes** | URL of the audio file to master |
| `mode` | string | **Yes** | Must be `"master"` |
| `preset` | string | No | Mastering preset: `"streaming"` (Spotify/YouTube), `"cd"` (dynamic), `"podcast"` (voice-optimized), `"loud"` (maximum loudness) |
| `target_lufs` | number | No | Target integrated loudness (default: -14 LUFS for streaming) |
| `format` | string | No | Output: `"wav"` (24-bit), `"flac"`, `"mp3"` (320kbps) |

---

## Stem Separation (Demucs)

Separate a mixed audio track into individual stems using Meta's Demucs model.

```
POST /v1/ai/generate/music
```

Set `"mode": "stems"` to split audio into components.

**Billing:** 3 credits per track

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `audio_url` | string | **Yes** | URL of the mixed audio file |
| `mode` | string | **Yes** | Must be `"stems"` |
| `stems` | integer | No | Number of stems: `2` (vocals + instrumental), `4` (vocals + drums + bass + other), `6` (adds piano + guitar). Default: 4. |
| `format` | string | No | Output format per stem: `"wav"`, `"flac"`, `"mp3"` |

### Response

```json
{
  "credits_used": 3,
  "stems": {
    "vocals": "https://gpu.fotohub.app/static/stems/abc123_vocals.wav",
    "drums": "https://gpu.fotohub.app/static/stems/abc123_drums.wav",
    "bass": "https://gpu.fotohub.app/static/stems/abc123_bass.wav",
    "other": "https://gpu.fotohub.app/static/stems/abc123_other.wav"
  },
  "duration_seconds": 245
}
```

---

## Audio Analysis

Analyze audio properties: BPM, musical key, loudness (LUFS), dynamic range, frequency spectrum.

```
POST /v1/ai/generate/music
```

Set `"mode": "analyze"` for analysis (free, no credits).

### Response

```json
{
  "bpm": 128,
  "key": "A minor",
  "time_signature": "4/4",
  "loudness_lufs": -8.2,
  "dynamic_range_db": 6.4,
  "peak_db": -0.3,
  "duration_seconds": 234.5
}
```

---

## ACE-Step Composition

AI-powered music composition using the ACE-Step model — creates structured compositions with lyrics support.

```
POST /v1/ai/generate/music
```

Set `"model": "ace-step"` to use ACE-Step.

**Billing:** 3 credits per composition

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | **Yes** | Musical description (genre, mood, instruments, style) |
| `model` | string | **Yes** | Must be `"ace-step"` |
| `lyrics` | string | No | Song lyrics with structure tags |
| `duration` | integer | No | Duration in seconds (30-300) |
| `seed` | integer | No | Reproducibility seed |

---

## Dubbing Pipeline

A common production workflow: transcribe source audio, translate to another language, then synthesize speech in the target language. This 3-step pipeline gives you full control over each stage (edit the transcript, fix translations, choose voices).

### Workflow

1. **Transcribe** — extract text from source audio with timestamps
2. **Translate** — convert transcript to the target language
3. **Synthesize** — generate speech in the target language using Premium TTS

### Example

::: code-group

```python [Python]
import requests

BASE = "https://apis.fotohub.app"
HEADERS = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}

# Step 1: Transcribe the source audio
transcribe_resp = requests.post(
    f"{BASE}/v1/ai/transcribe",
    headers=HEADERS,
    json={
        "audio_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/lecture-pl.mp3",
        "language": "pl",
        "mode": "transcribe",
        "timestamps": True
    }
)
transcript = transcribe_resp.json()
print(f"Transcribed ({transcript['language_detected']}): {transcript['text'][:100]}...")

# Step 2: Translate (using mode: translate for English, or use your own translation)
translate_resp = requests.post(
    f"{BASE}/v1/ai/transcribe",
    headers=HEADERS,
    json={
        "audio_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/lecture-pl.mp3",
        "mode": "translate"
    }
)
translation = translate_resp.json()
translated_text = translation["text"]
print(f"Translated to EN: {translated_text[:100]}...")

# Step 3: Synthesize with Premium TTS (GPT Audio 1.5)
speech_resp = requests.post(
    f"{BASE}/v1/ai/generate/speech/gpt",
    headers=HEADERS,
    json={
        "text": translated_text,
        "voice": "onyx",
        "instructions": "Professional lecturer tone, clear and authoritative"
    }
)
result = speech_resp.json()
print(f"Dubbed audio: {result['audio_url']}")
total_credits = (transcript["credits_used"] +
                 translation["credits_used"] +
                 result["credits_used"])
print(f"Total credits: {total_credits}")
```

```typescript [TypeScript]
const BASE = "https://apis.fotohub.app";
const HEADERS = {
  "Authorization": "Bearer fh_live_your_api_key",
  "Content-Type": "application/json",
};

// Step 1: Transcribe the source audio
const transcribeResp = await fetch(`${BASE}/v1/ai/transcribe`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({
    audio_url: "https://s1.fotohub.app/storage/v1/object/public/uploads/lecture-pl.mp3",
    language: "pl",
    mode: "transcribe",
    timestamps: true,
  }),
});
const transcript = await transcribeResp.json();
console.log(`Transcribed (${transcript.language_detected}): ${transcript.text.slice(0, 100)}...`);

// Step 2: Translate to English
const translateResp = await fetch(`${BASE}/v1/ai/transcribe`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({
    audio_url: "https://s1.fotohub.app/storage/v1/object/public/uploads/lecture-pl.mp3",
    mode: "translate",
  }),
});
const translation = await translateResp.json();
const translatedText = translation.text;
console.log(`Translated to EN: ${translatedText.slice(0, 100)}...`);

// Step 3: Synthesize with Premium TTS (GPT Audio 1.5)
const speechResp = await fetch(`${BASE}/v1/ai/generate/speech/gpt`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({
    text: translatedText,
    voice: "onyx",
    instructions: "Professional lecturer tone, clear and authoritative",
  }),
});
const result = await speechResp.json();
console.log(`Dubbed audio: ${result.audio_url}`);
const totalCredits = transcript.credits_used + translation.credits_used + result.credits_used;
console.log(`Total credits: ${totalCredits}`);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

const base = "https://apis.fotohub.app"

func post(url string, payload map[string]interface{}) map[string]interface{} {
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	return result
}

func main() {
	// Step 1: Transcribe
	transcript := post(base+"/v1/ai/transcribe", map[string]interface{}{
		"audio_url":  "https://s1.fotohub.app/storage/v1/object/public/uploads/lecture-pl.mp3",
		"language":   "pl",
		"mode":       "transcribe",
		"timestamps": true,
	})
	fmt.Printf("Transcribed (%s): %s...\n", transcript["language_detected"], transcript["text"])

	// Step 2: Translate
	translation := post(base+"/v1/ai/transcribe", map[string]interface{}{
		"audio_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/lecture-pl.mp3",
		"mode":      "translate",
	})
	translatedText := translation["text"].(string)
	fmt.Printf("Translated to EN: %s...\n", translatedText[:100])

	// Step 3: Synthesize with Premium TTS
	result := post(base+"/v1/ai/generate/speech/gpt", map[string]interface{}{
		"text":         translatedText,
		"voice":        "onyx",
		"instructions": "Professional lecturer tone, clear and authoritative",
	})
	fmt.Printf("Dubbed audio: %s\n", result["audio_url"])
}
```

```bash [cURL]
# Step 1: Transcribe
curl -s -X POST "https://apis.fotohub.app/v1/ai/transcribe" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/lecture-pl.mp3",
    "language": "pl",
    "mode": "transcribe",
    "timestamps": true
  }' | jq '.text' > transcript.txt

# Step 2: Translate
curl -s -X POST "https://apis.fotohub.app/v1/ai/transcribe" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/lecture-pl.mp3",
    "mode": "translate"
  }' | jq -r '.text' > translated.txt

# Step 3: Synthesize with Premium TTS
TRANSLATED=$(cat translated.txt)
curl -X POST "https://apis.fotohub.app/v1/ai/generate/speech/gpt" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"$TRANSLATED\",
    \"voice\": \"onyx\",
    \"instructions\": \"Professional lecturer tone, clear and authoritative\"
  }"
```

:::

::: info Pipeline Costs
The manual dubbing pipeline costs approximately **5 credits per minute** of source audio: 1 credit (transcription) + 2 credits (translation) + 2 credits (GPT Audio TTS). For automated single-step dubbing with voice preservation, use `mode: "dub"` directly (5 credits/min).
:::

---

## Supported Languages

All audio services support the following 23 languages for transcription, translation, TTS, and dubbing.

| Code | Language | Transcription | TTS | Translation | Dubbing |
|------|----------|:---:|:---:|:---:|:---:|
| `ar` | Arabic | Yes | Yes | Yes | Yes |
| `da` | Danish | Yes | Yes | Yes | Yes |
| `de` | German | Yes | Yes | Yes | Yes |
| `el` | Greek | Yes | Yes | Yes | Yes |
| `en` | English | Yes | Yes | Yes | Yes |
| `es` | Spanish | Yes | Yes | Yes | Yes |
| `fi` | Finnish | Yes | Yes | Yes | Yes |
| `fr` | French | Yes | Yes | Yes | Yes |
| `he` | Hebrew | Yes | Yes | Yes | Yes |
| `hi` | Hindi | Yes | Yes | Yes | Yes |
| `it` | Italian | Yes | Yes | Yes | Yes |
| `ja` | Japanese | Yes | Yes | Yes | Yes |
| `ko` | Korean | Yes | Yes | Yes | Yes |
| `ms` | Malay | Yes | Yes | Yes | Yes |
| `nl` | Dutch | Yes | Yes | Yes | Yes |
| `no` | Norwegian | Yes | Yes | Yes | Yes |
| `pl` | Polish | Yes | Yes | Yes | Yes |
| `pt` | Portuguese | Yes | Yes | Yes | Yes |
| `ru` | Russian | Yes | Yes | Yes | Yes |
| `sv` | Swedish | Yes | Yes | Yes | Yes |
| `sw` | Swahili | Yes | Yes | Yes | Yes |
| `tr` | Turkish | Yes | Yes | Yes | Yes |
| `zh` | Chinese | Yes | Yes | Yes | Yes |

::: tip Language Auto-Detection
When `language` is set to `"auto"` (default for transcription), FOTOhub automatically detects the spoken language from the first 30 seconds of audio. The detected language code is returned in the response as `language_detected`.
:::

---

## Model Comparison

Quick reference for choosing the right model for your use case.

| Category | Model | Credits | PLN Cost | Best For |
|----------|-------|---------|----------|----------|
| **Music** | IDA Music (≤3 min) | 2 | 0.15 | Production music, European latency |
| **Music** | IDA Music (>3 min) | 4 | 0.30 | Long-form compositions, albums |
| **Music** | MiniMax (≤30s) | 5 | 0.38 | Short jingles, quick drafts |
| **Music** | MiniMax (≤60s) | 10 | 0.75 | Medium tracks, ads |
| **Music** | MiniMax (>60s) | 25 | 1.88 | Full tracks via cloud |
| **Music** | ElevenLabs Music | 10 | 0.75 | Vocal-focused tracks |
| **Music** | ACE-Step | 3 | 0.23 | Structured compositions with lyrics |
| **SFX** | ElevenLabs SFX | 3 | 0.23 | Sound effects, foley |
| **TTS** | Google Cloud TTS | 1 | 0.09 | Budget TTS, per 1K chars |
| **TTS** | IDA Voice Pro | 2 | 0.18 | Natural voice, cloning, per 1K chars |
| **TTS** | GPT Audio 1.5 | 2 | 0.40 | Premium quality, voice instructions |
| **TTS** | Polly (Neural) | 1 per 10K | 0.09 | Bulk narration, 106 voices |
| **Transcription** | Whisper | 1 | 0.06 | Per minute of audio |
| **Transcription** | Voxtral Small | 2 | 0.15 | LLM-quality context |
| **Transcription** | Voxtral Mini | 1 | 0.08 | Fast transcription |
| **Translation** | Whisper Translate | 2 | 0.12 | Per minute, to English |
| **Dubbing** | FOTOhub Dub | 5 | 0.30 | Per minute, voice preserved |
| **Mastering** | FOTOhub Master | 3 | 0.23 | Per track |
| **Stems** | Demucs | 3 | 0.23 | Per track, 2/4/6 stems |
| **Analysis** | FOTOhub Analyze | 0 | Free | BPM, key, loudness |

::: info Choosing a TTS Model
- **Google Cloud TTS** (1 cr) — fast, cost-effective, good for UI narration and notifications
- **IDA Voice Pro** (2 cr) — natural prosody, supports voice cloning, best for branded voices
- **GPT Audio 1.5** (2 cr) — highest quality, supports freeform style instructions, ideal for podcasts and audiobooks
- **Polly** (1 cr/10K chars) — cheapest for bulk content, 106 voices across 41 languages
:::

---

## Related APIs

- **[Voice Cloning](/api/voice-cloning)** — create and use cloned voices, emotional TTS, voice forensics
- **[Shorts & Clips](/api/shorts-clips)** — audio-driven video clips with caption generation

---

## Pricing Summary

| Service | Model | Credits | PLN Cost | Unit |
|---------|-------|---------|----------|------|
| Music | IDA Music (≤3 min) | 2 | 0.15 | per generation |
| Music | IDA Music (>3 min) | 4 | 0.30 | per generation |
| Music | MiniMax | 5–25 | 0.30/min | tiered by duration |
| Music | ElevenLabs | 10 | 0.75 | per generation |
| Music | ACE-Step | 3 | 0.23 | per composition |
| Sound Effects | ElevenLabs SFX | 3 | 0.23 | fixed per generation |
| TTS | Google Cloud | 1 | 0.09 | per 1000 characters |
| TTS | IDA Voice Pro | 2 | 0.18 | per 1000 characters |
| TTS | GPT Audio 1.5 | 2 | 0.40 | per request |
| TTS | Polly (Neural) | 1 | 0.09 | per 10,000 characters |
| Transcription | Whisper | 1 | 0.06 | per minute of audio |
| Transcription | Voxtral Small | 2 | 0.15 | per audio file |
| Translation | — | 2 | 0.12 | per minute of audio |
| Dubbing | — | 5 | 0.30 | per minute of audio |
| Mastering | — | 3 | 0.23 | per track |
| Stems | Demucs | 3 | 0.23 | per track |

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `bad_request` | Invalid parameters: unsupported format, duration out of range, invalid voice_id. |
| 402 | `insufficient_credits` | Not enough credits for the requested operation. |
| 413 | `file_too_large` | Audio file exceeds 500MB. Compress or split before uploading. |
| 422 | `unprocessable_audio` | File corrupted, unsupported codec, or no detectable speech. |
| 429 | `rate_limit_exceeded` | Audio limits: 20 req/min (TTS/SFX), 10 req/min (music), 5 req/min (transcription/dubbing). |
