# Voice Cloning & Verification

Clone any voice from a short audio sample and generate speech in 23 languages with full emotion control. Zero-shot voice cloning requires no fine-tuning — upload a 10-30 second reference clip and start generating immediately. Built on FOTOhub's proprietary IDA Voice engine running on dedicated GPU infrastructure.

| Capability | Description | Credits |
|------------|-------------|---------|
| **Voice Cloning** | Create a reusable voice from a reference audio clip | 2 |
| **Clone Preview** | Test a cloned voice before saving | Free |
| **Emotional TTS** | Generate speech with 10-dimensional emotion control | 1 |
| **Expressive TTS** | Tag-based segment generation with inline emotion/SFX | 1 |
| **Voice Comparison** | Compare two audio samples for speaker similarity | 1 |
| **Deepfake Detection** | Detect AI-generated or manipulated audio | 2 |
| **Voice Forensics** | Full forensic analysis report | 3 |

---

## Voice Cloning Workflow

The voice cloning pipeline follows four steps: record, upload, clone, and use.

```
┌─────────┐     ┌─────────┐     ┌─────────────┐     ┌──────────────┐
│ Record  │ ──► │ Upload  │ ──► │ Clone Voice │ ──► │ Generate TTS │
│ 10-30s  │     │ Audio   │     │ (2 credits) │     │ with voice   │
└─────────┘     └─────────┘     └─────────────┘     └──────────────┘
```

1. **Record** a clear audio sample (10-30 seconds) of the target voice
2. **Upload** the audio file via the clone endpoint (WAV, MP3, FLAC, OGG, M4A supported)
3. **Clone** the voice — the system extracts speaker embeddings and creates a reusable voice profile
4. **Generate** speech using the cloned `voice_id` in any TTS endpoint

::: tip Reference Audio Quality
For best results, use a clean recording with minimal background noise, no music, and a single speaker. Longer samples (20-30s) produce higher fidelity clones. The speaker should use natural speech patterns — avoid reading in a monotone.
:::

---

## Endpoints

### Create Voice Clone

Clone a voice from an uploaded audio file. Extracts speaker embeddings via IDA Voice on GPU infrastructure and saves the voice profile for reuse.

```
POST /v1/ai/voice/clone
```

**Content-Type:** `multipart/form-data`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `file` | file | **Yes** | — | Audio file (WAV, MP3, FLAC, OGG, M4A). 10-30s recommended, max 50 MB. |
| `voice_name` | string | **Yes** | — | Display name for the cloned voice. |
| `language` | string | No | `"en"` | Primary language of the reference audio. |
| `gender` | integer | No | `1` | Speaker gender: `1` = male, `2` = female. |
| `age` | integer | No | `30` | Approximate speaker age (used for metadata). |
| `description` | string | No | `""` | Optional description of the voice characteristics. |
| `enhance_audio` | boolean | No | `false` | Apply noise reduction to the reference before cloning. |
| `generate_preview` | boolean | No | `true` | Generate a TTS preview sample after cloning. |

#### Response

```json
{
  "success": true,
  "voice_id": "vc_a1b2c3d4e5f6",
  "voice_uid": "vc_a1b2c3d4e5f6",
  "name": "Alex Narrator",
  "preview_url": "https://s1.fotohub.app/storage/v1/object/sign/audio/user123/voice-clones/vc_a1b2c3d4e5f6-sample.mp3?token=...",
  "generation_id": "550e8400-e29b-41d4-a716-446655440000",
  "credits_used": 2,
  "processing_time_ms": 4250,
  "sample_duration": 3.2,
  "provider": "ida-voice"
}
```

#### Example

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

# Clone a voice from a reference audio file
result = client.voice.clone(
    file=open("reference_voice.wav", "rb"),
    voice_name="Alex Narrator",
    language="en",
    gender=1,
    description="Deep male narrator voice, warm tone"
)

print(f"Voice ID: {result.voice_id}")
print(f"Preview: {result.preview_url}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import fs from "fs";

const client = new FotoHub({ apiKey: "fh_live_..." });

const result = await client.voice.clone({
  file: fs.createReadStream("reference_voice.wav"),
  voiceName: "Alex Narrator",
  language: "en",
  gender: 1,
  description: "Deep male narrator voice, warm tone",
});

console.log(`Voice ID: ${result.voiceId}`);
console.log(`Preview: ${result.previewUrl}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/voice/clone" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@reference_voice.wav" \
  -F "voice_name=Alex Narrator" \
  -F "language=en" \
  -F "gender=1" \
  -F "description=Deep male narrator voice, warm tone" \
  -F "generate_preview=true"
```

:::

---

### Preview Cloned Voice

Generate a TTS preview for a cloned voice without saving. Useful for testing before committing to a clone.

```
POST /v1/ai/voice/clone/preview
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `voice_uid` | string | **Yes** | — | The voice ID returned from the clone endpoint. |
| `language` | string | No | `"en"` | Language for the preview text. |
| `text` | string | No | auto | Custom preview text. If omitted, uses a built-in sample for the selected language. |

#### Response

```json
{
  "success": true,
  "preview_url": "https://s1.fotohub.app/storage/v1/object/sign/audio/user123/voice-previews/vc_a1b2c3d4e5f6_1721654321000.mp3?token=..."
}
```

#### Example

::: code-group

```python [Python]
result = client.voice.preview(
    voice_uid="vc_a1b2c3d4e5f6",
    language="en",
    text="Hello, this is a test of my cloned voice."
)
print(f"Preview URL: {result.preview_url}")
```

```typescript [TypeScript]
const preview = await client.voice.preview({
  voiceUid: "vc_a1b2c3d4e5f6",
  language: "en",
  text: "Hello, this is a test of my cloned voice.",
});
console.log(`Preview URL: ${preview.previewUrl}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/voice/clone/preview" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "voice_uid": "vc_a1b2c3d4e5f6",
    "language": "en",
    "text": "Hello, this is a test of my cloned voice."
  }'
```

:::

---

### List Cloned Voices

Retrieve all saved cloned voices for the authenticated user.

```
POST /v1/ai/voice/clone/list
```

#### Response

```json
{
  "success": true,
  "voices": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "voice_id": "vc_a1b2c3d4e5f6",
      "voice_uid": "vc_a1b2c3d4e5f6",
      "name": "Alex Narrator",
      "mode": "clone",
      "description": "Deep male narrator voice, warm tone",
      "language": "en",
      "gender": 1,
      "preview_url": "https://s1.fotohub.app/storage/v1/object/sign/audio/...",
      "created_at": "2026-07-20T14:30:00Z",
      "provider": "ida-voice"
    }
  ]
}
```

#### Example

::: code-group

```python [Python]
voices = client.voice.list()
for voice in voices.voices:
    print(f"{voice.name} ({voice.voice_id}) — {voice.language}")
```

```typescript [TypeScript]
const voices = await client.voice.list();
for (const voice of voices.voices) {
  console.log(`${voice.name} (${voice.voiceId}) - ${voice.language}`);
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/voice/clone/list" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

:::

---

### Delete Cloned Voice

Permanently delete a cloned voice profile.

```
DELETE /v1/ai/voice/clone/{voice_uid}
```

#### Response

```json
{
  "success": true,
  "status": "deleted"
}
```

#### Example

::: code-group

```python [Python]
client.voice.delete("vc_a1b2c3d4e5f6")
```

```typescript [TypeScript]
await client.voice.delete("vc_a1b2c3d4e5f6");
```

```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/v1/ai/voice/clone/vc_a1b2c3d4e5f6" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

:::

---

## Emotional TTS

Generate speech with fine-grained emotion control using a 10-dimensional emotion vector. Each dimension represents an emotion intensity from 0.0 to 1.0, and dimensions can be mixed for nuanced expressions.

```
POST /v1/ai/voice/emotional
```

### Emotion Dimensions

| Index | Dimension | Description |
|-------|-----------|-------------|
| 0 | `happy` | Joy, happiness, delight |
| 1 | `sad` | Sadness, sorrow, melancholy |
| 2 | `angry` | Anger, fury, frustration |
| 3 | `fear` | Fear, anxiety, terror |
| 4 | `surprise` | Surprise, astonishment, shock |
| 5 | `disgust` | Disgust, revulsion, contempt |
| 6 | `calm` | Calm, peaceful, serene |
| 7 | `neutral` | Neutral, default, no emotion |
| 8 | `whisper` | Whisper, hushed, breathy |
| 9 | `shout` | Shout, loud, forceful |

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | **Yes** | — | Text to synthesize (max 5000 characters). |
| `language` | string | No | `"en"` | Output language code (see supported languages). |
| `emotion_vec` | array | No | neutral | 10-element float array, each 0.0-1.0. |
| `emotion` | string | No | — | Shorthand: emotion name (e.g., `"happy"`, `"angry"`). |
| `intensity` | float | No | `1.0` | Intensity multiplier when using `emotion` shorthand. |
| `voice_uid` | string | No | — | Use a cloned voice by its ID. |
| `builtin_voice` | string | No | — | Use a built-in voice preset. |
| `cfg_weight` | float | No | `0.5` | Classifier-free guidance weight (0.0-1.0). |
| `temperature` | float | No | `0.8` | Sampling temperature (0.05-5.0). |
| `seed` | integer | No | `0` | Reproducibility seed (0 = random). |

### Response

Returns audio bytes directly with metadata in response headers:

| Header | Description |
|--------|-------------|
| `X-Processing-Time-Ms` | Generation time in milliseconds |
| `X-Audio-Duration` | Output audio duration in seconds |
| `X-Sample-Rate` | Audio sample rate (Hz) |
| `X-Emotion-Vec` | Applied emotion vector (comma-separated) |

### Example

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

# Generate with mixed emotions: mostly happy with a hint of surprise
audio = client.voice.emotional(
    text="I can't believe we actually won the championship!",
    language="en",
    emotion_vec=[0.7, 0.0, 0.0, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0],
    voice_uid="vc_a1b2c3d4e5f6",
)

with open("excited_speech.wav", "wb") as f:
    f.write(audio.content)
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_..." });

// Generate with emotion shorthand
const audio = await client.voice.emotional({
  text: "I can't believe we actually won the championship!",
  language: "en",
  emotion: "happy",
  intensity: 0.8,
  voiceUid: "vc_a1b2c3d4e5f6",
});

fs.writeFileSync("excited_speech.wav", audio.content);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/voice/emotional" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I cannot believe we actually won the championship!",
    "language": "en",
    "emotion_vec": [0.7, 0.0, 0.0, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0],
    "voice_uid": "vc_a1b2c3d4e5f6"
  }' \
  --output excited_speech.wav
```

:::

::: info Emotion Mixing
Dimensions are independent and can be combined. For example, `[0.5, 0.3, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]` produces a bittersweet tone mixing happiness with sadness. The model normalizes extreme combinations internally.
:::

---

## Expressive TTS

Generate speech with inline emotion tags, pauses, and sound effect insertions. The text is parsed into segments, each generated with mapped parameters and concatenated with crossfade.

```
POST /v1/ai/generate/speech
```

Set `speech_model: "ida-voice"` (IDA Voice) and include tags in the text field.

### Supported Tags

| Tag Type | Syntax | Example |
|----------|--------|---------|
| **Emotion** | `[emotion_name]` | `[excited]Hello everyone![calm]Let me explain.` |
| **Pause** | `<break time="Xms"/>` | `Hello.<break time="500ms"/>How are you?` |
| **Pause (short)** | `<#seconds#>` | `Hello.<#0.5#>How are you?` |
| **Sound** | `(sound_name)` | `That was hilarious!(laughing)Anyway...` |

### Available Emotions

High energy: `happy`, `excited`, `cheerful`, `enthusiastic`, `joyful`
Low energy: `sad`, `melancholy`, `disappointed`
Aggressive: `angry`, `furious`, `shouting`, `frustrated`
Soft: `whispering`, `gentle`, `calm`, `reassuring`, `soothing`
Reactive: `fearful`, `scared`, `surprised`, `shocked`
Stylistic: `sarcastic`, `dramatic`, `mysterious`, `romantic`, `ironic`
Functional: `speaking slowly`, `speaking fast`, `patient`, `teaching`, `narrating`

### Available Sound Effects

`laughing`, `chuckling`, `sighing`, `gasping`, `coughing`, `clearing throat`, `yawning`, `crying`, `applause`, `sniffing`, `groaning`

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | **Yes** | — | Text with optional inline tags. |
| `language` | string | No | `"en"` | Output language code. |
| `voice_uid` | string | No | — | Cloned voice ID. |
| `builtin_voice` | string | No | — | Built-in voice preset name. |
| `exaggeration` | float | No | `0.5` | Base expressiveness (0.0-2.0). Higher = more dramatic. |
| `cfg_weight` | float | No | `0.5` | Classifier-free guidance (0.0-1.0). Higher = more controlled. |
| `temperature` | float | No | `0.8` | Sampling randomness (0.5-5.0). |
| `speed` | float | No | `1.0` | Playback speed (0.5-2.0). Post-generation time-stretch. |
| `crossfade_ms` | integer | No | `50` | Crossfade duration between segments (ms). |
| `seed` | integer | No | `0` | Reproducibility seed. |

### Example

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

# Expressive narration with emotion shifts and pauses
script = """[excited]Welcome to the show, everyone!
<break time="800ms"/>
[calm]Today we're going to explore something fascinating.
<#0.5#>
[whispering]But first, let me tell you a secret...
(gasping)
[surprised]Did you hear that?!"""

audio = client.voice.generate(
    text=script,
    language="en",
    voice_uid="vc_a1b2c3d4e5f6",
    exaggeration=0.7,
    speed=1.0,
)

with open("narration.wav", "wb") as f:
    f.write(audio.content)
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_..." });

const script = `[excited]Welcome to the show, everyone!
<break time="800ms"/>
[calm]Today we're going to explore something fascinating.
<#0.5#>
[whispering]But first, let me tell you a secret...
(gasping)
[surprised]Did you hear that?!`;

const audio = await client.voice.generate({
  text: script,
  language: "en",
  voiceUid: "vc_a1b2c3d4e5f6",
  exaggeration: 0.7,
  speed: 1.0,
});

fs.writeFileSync("narration.wav", audio.content);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/speech" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "[excited]Welcome to the show!(gasping)[surprised]What was that?!",
    "language": "en",
    "speech_model": "ida-voice",
    "voice_uid": "vc_a1b2c3d4e5f6",
    "exaggeration": 0.7
  }' \
  --output narration.wav
```

:::

---

## Voice Comparison

Compare two audio samples to determine if they contain the same speaker. Uses SpeechBrain ECAPA-TDNN embeddings with state-of-the-art accuracy (0.8% EER on VoxCeleb1).

```
POST /v1/ai/voice/compare
```

**Content-Type:** `multipart/form-data`

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `reference_audio` | file | **Yes** | — | Original voice sample (reference). |
| `test_audio` | file | **Yes** | — | Voice sample to compare against the reference. |
| `threshold` | float | No | `0.25` | Similarity threshold. Lower = stricter matching. |

### Response

```json
{
  "success": true,
  "similarity_score": 0.8234,
  "is_same_speaker": true,
  "confidence": "very_high",
  "threshold_used": 0.25,
  "processing_time_ms": 1450,
  "credits_used": 1
}
```

**Confidence levels:**

| Score Range | Confidence | Interpretation |
|-------------|------------|----------------|
| > 0.70 | `very_high` | Almost certainly the same speaker |
| 0.50 - 0.70 | `high` | Very likely the same speaker |
| 0.30 - 0.50 | `medium` | Possibly the same speaker |
| < 0.30 | `low` | Unlikely to be the same speaker |

### Example

::: code-group

```python [Python]
result = client.voice.compare(
    reference_audio=open("original_voice.wav", "rb"),
    test_audio=open("suspicious_audio.mp3", "rb"),
    threshold=0.25,
)

print(f"Same speaker: {result.is_same_speaker}")
print(f"Similarity: {result.similarity_score:.1%}")
print(f"Confidence: {result.confidence}")
```

```typescript [TypeScript]
const result = await client.voice.compare({
  referenceAudio: fs.createReadStream("original_voice.wav"),
  testAudio: fs.createReadStream("suspicious_audio.mp3"),
  threshold: 0.25,
});

console.log(`Same speaker: ${result.isSameSpeaker}`);
console.log(`Similarity: ${(result.similarityScore * 100).toFixed(1)}%`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/voice/compare" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "reference_audio=@original_voice.wav" \
  -F "test_audio=@suspicious_audio.mp3" \
  -F "threshold=0.25"
```

:::

---

## Deepfake Detection

Analyze audio to determine if it was generated by AI or synthetically manipulated. Uses a wav2vec2-large model fine-tuned on the ASVspoof 2021 dataset, detecting TTS synthesis, voice conversion, replay attacks, and GAN-generated audio.

```
POST /v1/ai/voice/deepfake-detect
```

**Content-Type:** `multipart/form-data`

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `audio_file` | file | **Yes** | — | Audio file to analyze (max 200 MB, max 10 minutes). |

### Response

```json
{
  "success": true,
  "is_deepfake": true,
  "deepfake_probability": 0.9142,
  "confidence": "very_high",
  "model_used": "MelodyMachine/Deepfake-audio-detection-V2",
  "processing_time_ms": 2830,
  "credits_used": 2
}
```

**Probability interpretation:**

| Range | Assessment |
|-------|-----------|
| 0.85 - 1.00 | Almost certainly AI-generated |
| 0.65 - 0.85 | Likely AI-generated |
| 0.35 - 0.65 | Inconclusive — requires further analysis |
| 0.15 - 0.35 | Likely authentic |
| 0.00 - 0.15 | Almost certainly authentic |

### Example

::: code-group

```python [Python]
result = client.voice.deepfake_detect(
    audio_file=open("suspicious_call.mp3", "rb")
)

if result.is_deepfake:
    print(f"WARNING: AI-generated audio detected ({result.deepfake_probability:.1%} probability)")
else:
    print(f"Audio appears authentic ({1 - result.deepfake_probability:.1%} confidence)")
```

```typescript [TypeScript]
const result = await client.voice.deepfakeDetect({
  audioFile: fs.createReadStream("suspicious_call.mp3"),
});

if (result.isDeepfake) {
  console.log(`WARNING: AI-generated (${(result.deepfakeProbability * 100).toFixed(1)}%)`);
} else {
  console.log(`Audio appears authentic`);
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/voice/deepfake-detect" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "audio_file=@suspicious_call.mp3"
```

:::

---

## Voice Forensics

Run a comprehensive forensic analysis on audio including spectral consistency checks, compression artifact detection, splice/edit detection, and noise floor analysis.

```
POST /v1/ai/voice/forensics
```

**Content-Type:** `multipart/form-data`

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `primary_audio` | file | **Yes** | — | Main audio file to analyze. |
| `reference_audio` | file | No | — | Optional reference file for speaker comparison. |

### Response (Full Report)

```json
{
  "success": true,
  "report_id": "550e8400-e29b-41d4-a716-446655440000",
  "speaker_comparison": {
    "similarity_score": 0.7821,
    "is_same_speaker": true,
    "confidence": "very_high"
  },
  "deepfake_analysis": [
    {
      "filename": "interview.mp3",
      "is_deepfake": false,
      "deepfake_probability": 0.0823,
      "confidence": "very_high"
    }
  ],
  "forensic_analysis": [
    {
      "filename": "interview.mp3",
      "duration_seconds": 45.2,
      "authenticity_score": 0.92,
      "spectral_centroid_mean": 1842.3,
      "spectral_consistency": 0.94,
      "compression_detected": false,
      "energy_jumps_count": 1,
      "energy_jump_positions": [12.45],
      "rms_mean_db": -18.4,
      "silence_ratio": 0.08
    }
  ],
  "overall_risk_level": "low",
  "overall_score": 0.92,
  "recommendations": [
    "Audio appears authentic - no anomalies detected"
  ],
  "processing_time_ms": 5420,
  "credits_used": 3
}
```

**Risk levels:**

| Level | Score | Meaning |
|-------|-------|---------|
| `low` | 0.8 - 1.0 | No significant anomalies detected |
| `medium` | 0.6 - 0.8 | Minor inconsistencies, may warrant review |
| `high` | 0.4 - 0.6 | Significant anomalies detected |
| `critical` | 0.0 - 0.4 | Strong indicators of manipulation or synthesis |

### Forensic Metrics Explained

| Metric | What It Measures |
|--------|-----------------|
| `authenticity_score` | Overall authenticity (0-1, higher = more authentic) |
| `spectral_consistency` | Whether spectral profile is uniform throughout (detects splices) |
| `compression_detected` | Whether lossy compression artifacts are present |
| `energy_jumps_count` | Number of sudden volume changes (indicates edits) |
| `spectral_flatness_mean` | How noise-like vs tonal the signal is (synthesis indicator) |
| `silence_ratio` | Proportion of silent frames (unusual patterns = manipulation) |

### Example

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

# Full forensic analysis with speaker comparison
report = client.voice.forensics(
    primary_audio=open("interview_recording.mp3", "rb"),
    reference_audio=open("known_speaker_sample.wav", "rb"),
)

print(f"Risk Level: {report.overall_risk_level}")
print(f"Authenticity Score: {report.overall_score:.1%}")
print(f"Same Speaker: {report.speaker_comparison.is_same_speaker}")

for rec in report.recommendations:
    print(f"  - {rec}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_..." });

const report = await client.voice.forensics({
  primaryAudio: fs.createReadStream("interview_recording.mp3"),
  referenceAudio: fs.createReadStream("known_speaker_sample.wav"),
});

console.log(`Risk: ${report.overallRiskLevel}`);
console.log(`Score: ${(report.overallScore * 100).toFixed(1)}%`);
report.recommendations.forEach((r) => console.log(`  - ${r}`));
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/voice/forensics" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "primary_audio=@interview_recording.mp3" \
  -F "reference_audio=@known_speaker_sample.wav"
```

:::

---

## Supported Languages

Voice cloning and TTS generation support 23 languages with zero-shot capability — no language-specific training required for cloned voices.

| Code | Language | Code | Language |
|------|----------|------|----------|
| `ar` | Arabic | `ms` | Malay |
| `da` | Danish | `nl` | Dutch |
| `de` | German | `no` | Norwegian |
| `el` | Greek | `pl` | Polish |
| `en` | English | `pt` | Portuguese |
| `es` | Spanish | `ru` | Russian |
| `fi` | Finnish | `sv` | Swedish |
| `fr` | French | `sw` | Swahili |
| `he` | Hebrew | `tr` | Turkish |
| `hi` | Hindi | `zh` | Chinese (Mandarin) |
| `it` | Italian | | |
| `ja` | Japanese | | |
| `ko` | Korean | | |

::: tip Cross-lingual Cloning
A voice cloned from an English sample can generate speech in any of the 23 supported languages while maintaining the speaker's vocal characteristics. The system preserves timbre, pitch, and speaking patterns across languages.
:::

---

## Pricing

| Operation | Credits | Description |
|-----------|---------|-------------|
| Voice Clone | 2 | Create a new voice from reference audio |
| Clone Preview | Free | Test cloned voice (included with clone) |
| Emotional TTS | 1 | Generate speech with emotion control |
| Expressive TTS | 1 | Tag-based expressive generation |
| Standard TTS | 1 | Basic text-to-speech with cloned voice |
| Voice Comparison | 1 | Compare two voice samples |
| Deepfake Detection | 2 | Analyze audio for AI generation markers |
| Voice Forensics (full report) | 3 | Comprehensive forensic analysis |

::: info Credit Refunds
If a generation fails due to a system error (not invalid input), credits are automatically refunded to your account. Failed requests due to invalid audio format or empty text are not charged.
:::

---

## Best Practices

### Reference Audio for Cloning

| Requirement | Recommendation |
|-------------|----------------|
| **Duration** | 10-30 seconds (20s optimal). Shorter clips reduce quality. |
| **Format** | WAV or FLAC preferred. MP3 acceptable but introduces compression artifacts. |
| **Sample Rate** | 16 kHz minimum, 44.1 kHz recommended. |
| **Environment** | Quiet room, no background music or other speakers. |
| **Content** | Natural conversational speech. Avoid monotone reading. |
| **File Size** | Max 50 MB per file. |
| **Speakers** | Single speaker only. Multi-speaker audio will produce poor results. |

### Expressive Generation Tips

- Start with moderate `exaggeration` (0.5-0.7) and increase gradually
- Use `cfg_weight` to control how closely output follows the voice reference (higher = more controlled)
- Combine emotion tags with pauses for natural-sounding transitions
- Keep individual text segments under 300 characters for best quality
- Use `crossfade_ms: 50` (default) for smooth segment transitions
- Emotion tags persist until the next tag — no need to repeat for consecutive sentences

### Deepfake Detection Accuracy

- Best results with 10-30 second audio clips
- The model analyzes the middle 30 seconds of longer files
- Higher accuracy on speech than music or environmental audio
- Accuracy may be reduced on heavily compressed audio (low bitrate MP3)
- For critical decisions, combine with the full forensics report

### Error Handling

All endpoints return standard FOTOhub error responses:

```json
{
  "detail": "Error description"
}
```

| HTTP Code | Meaning |
|-----------|---------|
| 400 | Invalid input (file too small, unsupported format, empty text) |
| 401 | Missing or invalid authentication token |
| 402 | Insufficient credits |
| 413 | File too large (exceeds 50 MB for clone, 200 MB for analysis) |
| 502 | GPU service temporarily unavailable |
| 503 | Model loading in progress (retry after 10-30 seconds) |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Voice Clone | 10 requests/minute |
| Emotional/Expressive TTS | 30 requests/minute |
| Voice Comparison | 20 requests/minute |
| Deepfake Detection | 15 requests/minute |
| Voice Forensics | 5 requests/minute |

Exceeding rate limits returns HTTP 429 with a `Retry-After` header indicating seconds until the next request window.

---

## Accepted Audio Formats

All voice endpoints accept the following audio formats:

| Format | Extensions | MIME Types |
|--------|-----------|------------|
| WAV | `.wav` | `audio/wav`, `audio/x-wav` |
| MP3 | `.mp3` | `audio/mpeg`, `audio/mp3` |
| FLAC | `.flac` | `audio/flac` |
| AAC | `.aac`, `.m4a` | `audio/aac`, `audio/mp4`, `audio/x-m4a` |
| OGG | `.ogg` | `audio/ogg` |
| WebM | `.webm` | `audio/webm` |
