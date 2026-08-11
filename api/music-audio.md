# Music & Audio

Audio generation and processing. Generate original music tracks and sound effects from text descriptions, convert text to natural-sounding speech with multiple voice options, and transcribe audio to text. Translation and dubbing are built by composing these endpoints — see the [Dubbing Pipeline](#dubbing-pipeline).

| Capability | Description | Duration/Limits |
|------------|-------------|-----------------|
| **Music** | AI composition (MiniMax, ElevenLabs) | 10–300 seconds |
| **SFX** | Sound effects | 1–30 seconds |
| **TTS** | Text-to-speech (IDA Voice, Google, Grok, Polly, GPT Audio) | max 3000 chars/request |
| **STT** | Transcription | max 240 minutes, auto language detect |

---

## Music Generation

FOTOhub generates full music tracks from a text description via two cloud
providers. Requests are synchronous: the response carries a finished `audio_url`.

::: warning Endpoint scope
`POST /v1/ai/generate/music` generates music and nothing else. It reads `model`,
`prompt`, `duration`, `genre`, `mood`, `bpm`, `loop` and `instrumental` — any
other field in the body is ignored, including `mode`. There is no mastering,
stem-separation or analysis mode on this endpoint, and no `/music/compose`
endpoint. Sending `mode` does not switch behaviour: the request is still billed
and served as a music generation.
:::

### Endpoint

```
POST /v1/ai/generate/music
```

**Billing:** 5 credits/min (`minimax`) or 12 credits/min (`elevenlabs`), per started minute

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | **Yes** | — | Detailed description of the music. Include genre, instruments, mood, energy level, and intended use case. |
| `model` | string | No | `"minimax"` | `"minimax"` or `"elevenlabs"`. Any other value returns `400` with the supported list. |
| `duration` | integer | No | `30` | Duration in seconds. Range: **10–300**. Under 10 returns `400`; over 300 is clamped. Billed per started minute, so longer tracks cost more. |
| `genre` | string | No* | — | Genre hint: `"electronic"`, `"jazz"`, `"classical"`, `"hip-hop"`, `"ambient"`, `"rock"`, `"folk"`, `"cinematic"`. **Required for `"elevenlabs"`** — that provider rejects a missing genre, so the call is refused with `400` before billing. |
| `mood` | string | No | — | Mood hint: `"happy"`, `"melancholic"`, `"energetic"`, `"calm"`, `"dark"`, `"uplifting"`, `"mysterious"`. |
| `bpm` | integer | No | auto | Target tempo in BPM. Range: 60–200; outside that returns `400`. `tempo` is accepted as a deprecated alias. |
| `loop` | boolean | No | `false` | Generate a seamlessly loopable track. |
| `instrumental` | boolean | No | `true` | When true, generates instrumental-only (no vocals). Set false for vocal elements. |

### Pricing

Billed **per started minute**, per model — not on a duration ladder. A 90-second
track is 2 minutes.

| Model | Credits/min | Notes |
|-------|:-----------:|-------|
| MiniMax Music | 5 | Cloud generation, default |
| ElevenLabs Music | 12 | Higher fidelity, `genre` required |

Both endpoints are synchronous: the response carries a finished `audio_url`. If
generation fails the charge is refunded automatically.

### Response

```json
{
  "model": "minimax",
  "credits_used": 5,
  "billing": {
    "method": "credits",
    "credits_used": 5,
    "usd_charged": 0,
    "pln_charged": 0
  },
  "audio_url": "https://s1.fotohub.app/storage/v1/object/public/generations/audio/mj_xyz789.mp3",
  "duration": 30,
  "format": "mp3"
}
```

::: info Rounding
Billing rounds up to the whole minute, so a 30-second and a 60-second track both
cost one minute. A 61-second track costs two.
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
        "bpm": 128,
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
      bpm: 128,
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
		"bpm":          128,
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
    "bpm": 128,
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
    "usd_charged": 0,
    "pln_charged": 0
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
| `text` | string | **Yes** | — | Text to synthesize. Max **3000** characters, or **1200** for `"ida-voice"` / `"ida-voice-pro"` — see the length limits note below. Over the limit returns `400` before anything is billed. |
| `model` | string | No | `"google"` | TTS engine: `"google"` (fast, cost-effective), `"ida-voice-pro"` (natural, premium), `"ida-voice"` (self-hosted, voice cloning) or `"grok"` (26 multilingual voices, cheapest). `"elevenlabs"` is accepted as a legacy alias for `"ida-voice-pro"`. |
| `voice_id` | string | No | — | Voice preset ID. Google: `"pl-PL-Standard-A"`, `"en-US-Neural2-F"`. IDA Voice: custom voice ID from dashboard. Grok: `"eve"`, `"ara"`, `"leo"` and 23 more — see [Grok voices](#grok-voices). |
| `language` | string | No | `"en"` | Target language: `"pl"`, `"en"`, `"de"`, `"fr"`, `"es"`. |
| `speed` | number | No | `1.0` | Speech speed multiplier. Range: 0.5–2.0. |
| `pitch` | number | No | `0` | Pitch adjustment in semitones. Range: -10 to +10. Ignored by `"grok"`. |

### Pricing

| Model | Credits | USD | Notes |
|-------|---------|-----|-------|
| Grok Voice | 0.7 | $0.0375 | per 1000 characters, 26 multilingual voices |
| Google Cloud TTS | 1 | $0.0241 | per 1000 characters, fast |
| IDA Voice Pro | 2 | $0.0482 | per 1000 characters, natural voice, cloning |

Billed per 1000 characters, not per request, and the block count is fractional
above the first one — a 2500-character synthesis bills 2.5 blocks, not 3. The
first block is always charged in full, so anything under 1000 characters costs
one block. `characters_processed` in the response is the figure billed.

::: warning Length limits are transport limits
This endpoint is synchronous and the gateway cuts a proxied request at 100
seconds. `"ida-voice"` renders roughly 0.058s per character, so its 1200-character
cap is about 70 seconds of synthesis plus headroom for the upload — a higher cap
would sell a request that cannot finish. If a long call does time out the charge
is refunded, but the request is still lost, so split long texts client-side.
:::

### Grok voices

All 26 Grok voices are multilingual — one voice speaks any supported language, so
pick by character rather than by locale.

**Female:** `ara`, `carina`, `celeste`, `eve`, `iris`, `luna`, `lux`
**Male:** `altair`, `atlas`, `castor`, `cosmo`, `helios`, `helix`, `kepler`, `leo`, `lumen`, `naksh`, `orion`, `perseus`, `rex`, `rigel`, `sal`, `sirius`, `ursa`, `zagan`, `zenith`

```python
response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/speech",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
    json={
        "text": "Witaj w FOTOhub!",
        "model": "grok",
        "voice_id": "eve",
        "language": "pl",
        "speed": 1.0,
    },
)
print(response.json()["audio_url"])
```

Grok responses report the voice used and the billed character count:

```json
{
  "model": "grok",
  "credits_used": 0.7,
  "audio_url": "https://s1.fotohub.app/storage/v1/object/public/audio/.../grok-tts.mp3",
  "format": "mp3",
  "voice": "eve",
  "characters_processed": 61
}
```

### Response

```json
{
  "model": "google",
  "credits_used": 1,
  "billing": {
    "method": "credits",
    "credits_used": 1,
    "usd_charged": 0,
    "pln_charged": 0
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

| Model | Credits | USD | Notes |
|-------|---------|-----|-------|
| GPT Audio 1.5 | 2 | $0.1072 | per request, WAV HD output |

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

**Billing:** per started minute of input audio, in USD

### Transcribe

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `audio` | string | **Yes** | — | Base64-encoded audio (WAV, MP3, OGG, FLAC, WebM). Max 25MB, max **240 minutes**. |
| `model` | string | No | `"voxtral-small"` | Model: `"voxtral-small"` (24B, quality) or `"voxtral-mini"` (3B, fast). |
| `language` | string | No | — | Language hint for better accuracy. |
| `prompt` | string | No | — | Context/instruction for the model. |

**Response:**

```json
{
  "text": "Transcribed text content here...",
  "model": "voxtral-small",
  "minutes_billed": 2,
  "cost_usd": 0.04,
  "currency": "USD",
  "tokens": { "input": 1200, "output": 150 }
}
```

The duration is measured from the file itself and rounded up to whole minutes —
a 95-second clip bills 2 minutes. `minutes_billed` is the figure the charge was
computed from. If the header is unreadable the charge is one minute, the smallest
honest amount. A failed transcription is refunded automatically, and every request
rejected with a `400` is refused before the wallet is touched.

### Summarize

Same parameters as transcribe, plus:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `format` | string | No | `"bullets"` | Summary format: `"bullets"` or `"paragraph"`. |

Returns both transcription and summary in a single call. Priced as the per-minute
transcription **plus one fixed summarisation charge** — the summary is a single
completion capped at 4096 tokens, so it does not grow with the length of the
audio.

### Pricing

| Model | Transcribe | Summarize | Quality | Speed |
|-------|-----------|-----------|---------|-------|
| Voxtral Small 24B | $0.020 / minute | $0.020 / minute + $0.010 | High (LLM-quality context) | ~10s |
| Voxtral Mini 3B | $0.005 / minute | $0.005 / minute + $0.005 | Good (fast) | ~3s |

Worked examples, Voxtral Small:

| Audio length | Minutes billed | Transcribe | Summarize |
|---|---|---|---|
| 40 seconds | 1 | $0.020 | $0.030 |
| 95 seconds | 2 | $0.040 | $0.050 |
| 60 minutes | 60 | $1.200 | $1.210 |

Both legs are itemised per model in [`GET /v1/pricing`](/api/billing).

---

## Speech-to-Text (Transcription)

### Endpoint

```
POST /v1/ai/transcribe
```

**Billing:** 0.3 credits per started minute of input audio, both models

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `audio_url` | string | **Yes** | — | URL of audio file (MP3, WAV, M4A, MP4, FLAC, OGG, WebM). Max **240 minutes**; longer returns `400` before billing. |
| `model` | string | No | `"default"` | `"default"` or `"grok"` (per-word timestamps). Both bill 0.3 credits per started minute. |
| `language` | string | No | `"auto"` | Source language or `"auto"` for detection. |

The duration is measured from the file itself, then rounded up to whole minutes —
a 90-second clip bills 2 minutes. `minutes_billed` in the response is the figure
charged. If the header is unreadable the charge is one minute, the smallest
honest amount. A failed transcription is refunded automatically.

::: warning No translate or dub mode
This endpoint transcribes in the source language. It reads only `audio_url`,
`language` and `model` — `mode`, `timestamps` and `diarize` are ignored, so
sending `mode: "translate"` or `mode: "dub"` returns a plain transcript and still
bills for it. To translate, pass the transcript to
[`/v1/ai/chat/completions`](/api/chat-llm); to dub, feed the translation to
[`/v1/ai/generate/speech`](#text-to-speech). The
[Dubbing Pipeline](#dubbing-pipeline) below shows both steps.
:::

#### Grok transcription

`model: "grok"` returns a `words` array with a start/end offset for every word —
useful for subtitles and word-accurate seeking. It bills 0.3 credits per started
minute and does not do diarization or emotion analysis.

```json
{
  "model": "grok",
  "credits_used": 0.3,
  "text": "Transkrypcja publicznego API ze znacznikami czasu.",
  "language": "pl",
  "duration": 3.7,
  "words": [
    { "text": "Transkrypcja", "start": 0.08, "end": 0.88 },
    { "text": "publicznego", "start": 0.96, "end": 1.59 },
    { "text": "API", "start": 1.73, "end": 2.11 }
  ]
}
```

### Response

```json
{
  "credits_used": 3,
  "billing": {
    "method": "credits",
    "credits_used": 3,
    "usd_charged": 0,
    "pln_charged": 0
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

| Category | Model | Price | Best For |
|----------|-------|-------|----------|
| **Music** | MiniMax | 5 credits / min | Jingles, drafts, full tracks |
| **Music** | ElevenLabs Music | 12 credits / min | Higher fidelity, `genre` required |
| **SFX** | ElevenLabs SFX | 3 credits | Sound effects, foley — fixed per generation |
| **TTS** | Grok Voice | 0.7 credits / 1K chars | Cheapest, 26 multilingual voices |
| **TTS** | Google Cloud TTS | 1 credit / 1K chars | Budget TTS, fast |
| **TTS** | IDA Voice / Pro | 2 credits / 1K chars | Natural voice, cloning |
| **TTS** | GPT Audio 1.5 | 2 credits / request | Premium quality, voice instructions |
| **TTS** | Polly (Neural) | 1 credit / 10K chars | Bulk narration, 106 voices |
| **Transcription** | Default | 0.3 credits / min | Diarization, emotion analysis |
| **Transcription** | Grok | 0.3 credits / min | Per-word timestamps |
| **Transcription** | Voxtral Small | $0.020 / min | LLM-quality context |
| **Transcription** | Voxtral Mini | $0.005 / min | Fast transcription |

::: info Choosing a TTS Model
- **Grok Voice** (0.7 cr/1K) — cheapest, one voice speaks any language
- **Google Cloud TTS** (1 cr/1K) — fast, cost-effective, good for UI narration and notifications
- **IDA Voice Pro** (2 cr/1K) — natural prosody, supports voice cloning, best for branded voices
- **GPT Audio 1.5** (2 cr/request) — highest quality, supports freeform style instructions, ideal for podcasts and audiobooks
- **Polly** (1 cr/10K chars) — cheapest for bulk content, 106 voices across 41 languages
:::

---

## Related APIs

- **[Voice Cloning](/api/voice-cloning)** — create and use cloned voices, emotional TTS, voice forensics
- **[Shorts & Clips](/api/shorts-clips)** — audio-driven video clips with caption generation
- **[Voice Agents](/api/voice-agents)** — two-way spoken conversations instead of one-shot TTS: define a persona, voice and tools, then mint browser session tokens
- **[Realtime Voice](/api/realtime-voice)** — the integration guide for those sessions: WebSocket transport, mic capture, PCM16 playback, tool calls

---

## Pricing Summary

| Service | Model | Price | Unit |
|---------|-------|-------|------|
| Music | MiniMax | 5 credits | per started minute |
| Music | ElevenLabs | 12 credits | per started minute |
| Sound Effects | ElevenLabs SFX | 3 credits | fixed per generation |
| TTS | Grok Voice | 0.7 credits | per 1000 characters |
| TTS | Google Cloud | 1 credit | per 1000 characters |
| TTS | IDA Voice / Pro | 2 credits | per 1000 characters |
| TTS | GPT Audio 1.5 | 2 credits | per request |
| TTS | Polly (Neural) | 1 credit | per 10,000 characters |
| Transcription | Default | 0.3 credits | per started minute |
| Transcription | Grok | 0.3 credits | per started minute |
| Transcription | Voxtral Mini | $0.005 | per started minute |
| Transcription | Voxtral Small | $0.020 | per started minute |
| Voxtral summarize | Mini / Small | + $0.005 / + $0.010 | once per request, on top of the per-minute rate |

Character-billed endpoints charge fractional blocks above the first (2500 chars =
2.5 blocks); minute-billed endpoints round up to the whole minute, so a 95-second
file bills 2 minutes. Every response reports what was charged — `cost_usd` on the
USD-priced endpoints, `credits_used` on the rest — alongside
`characters_processed` or `minutes_billed`.

`GET /v1/pricing` returns the live figures with their units and an itemised
breakdown per leg, which is the authoritative source if this table and the API
ever disagree.

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `bad_request` | Invalid parameters: unsupported format, duration out of range, invalid voice_id. |
| 402 | `insufficient_funds` | Wallet balance will not cover the request. The body carries `required_usd`, `balance_usd`, `shortfall_usd` and `topup_url`. |
| 413 | `file_too_large` | Audio file exceeds 500MB. Compress or split before uploading. |
| 422 | `unprocessable_audio` | File corrupted, unsupported codec, or no detectable speech. |
| 429 | `rate_limit_exceeded` | Audio limits: 20 req/min (TTS/SFX), 10 req/min (music), 5 req/min (transcription/dubbing). |
