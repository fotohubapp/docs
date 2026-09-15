# Multilingual Lip-Sync & Video Dubbing

Re-voice keynote speakers, actors, corporate trainers, and video creators across multiple languages while preserving original vocal timbre, pitch inflection, emotional resonance, and photo-realistic mouth synchronization.

This enterprise blueprint coordinates vocal stem isolation, timestamped speech translation, zero-shot voice cloning, dynamic audio-video desync compensation, and neural facial retargeting powered by FOTOhub's **Lip-Sync Engine** (`server/lip-sync-engine/`).

---

## Architectural Workflow

The automated dubbing pipeline ingests high-definition video, isolates acoustic components, synthesizes natural-sounding speech in the target language matching the original voice, adjusts syllable timing to avoid desynchronization, retargets mouth landmarks using diffusion or GAN models, and multiplexes the final mastered audio back into the video container.

```mermaid
flowchart TD
    subgraph INGEST ["1. Source Ingest & Demuxing"]
        A["Source Video (MP4 / MOV / S3)"] --> B["Demux Video & Master Audio"]
        B --> C["Raw 48kHz Stereo Audio Track"]
        B --> D["Video Frames (30/60 FPS, No Audio)"]
    end

    subgraph AUDIO_SEPARATION ["2. Neural Audio Separation (Demucs v4)"]
        C --> E["POST /v1/audio/separate"]
        E --> F["Isolated Vocals Stem (Clean Speech)"]
        E --> G["Isolated Accompaniment Stem (Music + SFX + Ambience)"]
    end

    subgraph SPEECH_PIPELINE ["3. Transcription & Translation"]
        F --> H["POST /v1/audio/transcribe (Whisper Large-v3)"]
        H --> I["Word-Level Timestamps & Diarization"]
        I --> J["Target Language Translation (ES, DE, FR, JA, etc.)"]
    end

    subgraph VOICE_SYNTHESIS ["4. Zero-Shot Voice Synthesis"]
        F & J --> K["POST /v1/audio/voice-sonic/generate<br/>(Voice Sonic / Azure Neural / Gemini TTS)"]
        K --> L["Target Language Synthesized Speech"]
    end

    subgraph TIMING_ALIGNMENT ["5. Prosody & Desync Alignment"]
        I & L --> M["Duration Analysis & Pitch-Preserving WSOLA Stretch"]
        M --> N["Time-Aligned Target Vocal Stem"]
    end

    subgraph LIP_SYNC_ENGINE ["6. Neural Facial Retargeting"]
        D & N --> O["POST /v1/video/lip-sync"]
        O --> P{"Engine Inference Tier"}
        P -->|fast| Q["MuseTalk 1.5 (720p, ~0.3x Realtime)"]
        P -->|hd| R["LatentSync 1.6 (1080p, CFG 2.0 Diffusion)"]
        P -->|ultra| S["FaceFusion 3.x + GFPGAN 1.4 + LivePortrait"]
        Q & R & S --> T["Retargeted Lip & Facial Motion Video"]
    end

    subgraph MASTERING ["7. Audio Multiplexing & BYOB Delivery"]
        T & G & N --> U["DSP Master: Sidechain Ducking & EBU R128 (-14 LUFS)"]
        U --> V["Final Dubbed 1080p/4K Video"]
        V --> W["BYOB Push: AWS S3 / Cloudflare R2 (/v1/destinations)"]
        W --> X["HMAC-SHA256 Webhook Notification"]
    end
```

---

## Core Technical Foundations

### 1. Vocal Track Isolation via Demucs v4 (`/v1/audio/separate`)
High-quality lip-syncing requires an immaculate, isolated vocal track without background music, environmental noise, or sound effects bleeding into the acoustic feature extractor:
- **Underlying Architecture**: Hybrid Transformer Demucs v4 (`htdemucs_ft`), fine-tuned on multi-track studio stems.
- **Stem Routing**: The endpoint splits audio into `vocals` and `accompaniment` (combining drums, bass, instruments, and Foley).
- **Acoustic Integrity**: Bleed rejection is $> 18\text{ dB}$, ensuring speech synthesis and Whisper transcription operate solely on human formant frequencies without musical hallucination.
- **Preservation of Sound Design**: The isolated accompaniment track is cached and later remixed with the new target-language speech, ensuring background music and cinematic sound design remain 100% intact.

### 2. Speech Transcription & Translation via Whisper Large-v3 (`/v1/audio/transcribe`)
Accurate word-level timestamping and syntactic boundaries are prerequisites for phoneme mapping and desynchronization prevention:
- **Model**: OpenAI Whisper Large-v3 with specialized CTC phoneme alignment heads.
- **Timestamp Precision**: Returns word-level boundaries (`start_ms`, `end_ms`, `confidence`) with $\le 20\text{ ms}$ jitter.
- **Translation Quality**: Supports direct translation into 98 languages or integrates with LLM translation passes to preserve contextual idioms, technical terms, and regional colloquialisms.

### 3. Zero-Shot Voice Cloning via Voice Sonic (`/v1/audio/voice-sonic/generate`)
To create convincing multilingual dubs, the translated speech must preserve the original speaker's distinctive vocal identity:
- **Voice Sonic Engine**: Extracts a 512-dimensional speaker timbre embedding from as little as 3 seconds of the isolated vocal stem.
- **Prosody Transfer**: Matches the speaker's vocal pitch range, intonation contours, and breath patterns while articulating native phonemes in the target language.
- **Fallback TTS Support**: When deterministic brand voices are preferred, the pipeline seamlessly interfaces with Azure Neural TTS (`en-US-JennyMultilingualNeural`, `es-ES-ElviraNeural`) or Gemini TTS via `POST /v1/audio/tts`.

---

## Audio Desync Prevention & Dynamic Audio Stretching

A universal challenge in video dubbing is **linguistic syllable duration disparity**:
- Spanish and Italian text typically contains **15% to 25% more syllables** than equivalent English text.
- German compound nouns require **20% to 30% longer acoustic duration**.
- Japanese speech cadence relies on morae, creating completely different rhythmic intervals.

If a translated Spanish sentence takes 12.5 seconds to speak, but the actor on screen only spoke for 10.0 seconds, naive lip retargeting fails: the speaker's mouth continues moving after their physical gesture ends, or speech bleeds into the next video cut.

```mermaid
sequenceDiagram
    participant S as Source Speech Segment (10.0s)
    participant T as Translated Text (Spanish)
    participant TTS as Voice Sonic Engine (Output: 12.2s)
    participant DSP as Dynamic WSOLA Time-Stretcher
    participant LS as Lip-Sync Engine (10.0s Video)

    S->>T: Translate with Whisper Large-v3
    T->>TTS: Synthesize Speech
    TTS-->>DSP: Raw Audio (12.2s, Tempo Ratio = 0.82)
    DSP->>DSP: Apply atempo=1.22 (Preserve F0 pitch)
    DSP-->>LS: Aligned Target Vocal Stem (10.0s)
    LS->>LS: Apply Lip Retargeting on 10.0s Frames
```

### Mathematical Time-Stretching (WSOLA & Rubberband)

FOTOhub solves this through an automated acoustic time-alignment pass:

$$\text{Speed Ratio } R = \frac{\Delta T_{\text{source}}}{\Delta T_{\text{synthesized}}}$$

1. **Duration Extraction**: FOTOhub computes the millisecond duration of each utterance from the Whisper transcription.
2. **Tempo Adjustment Without Pitch Distortion**:
   - For mild disparities ($0.80 \le R \le 1.25$), FOTOhub applies **Waveform Similarity Overlap-Add (WSOLA)** or the **Rubberband phase-vocoder DSP algorithm** (`ffmpeg -filter:a "atempo=R"`). This accelerates or decelerates the synthesized audio to fit the exact video mouth duration while preserving fundamental pitch ($F_0$) and vocal formants.
3. **Adaptive LLM Compression**:
   - If $R < 0.80$ (synthesizing the phrase at native speed would require an unnatural $>25\%$ speedup), FOTOhub triggers an automatic LLM compression prompt, instructing the translation layer to rewrite the sentence with fewer syllables while preserving full semantic meaning.
4. **Pause Insertion**:
   - If $R > 1.25$ (the target language is significantly shorter), FOTOhub introduces natural acoustic breath pauses and punctuation pauses at clause boundaries rather than artificially dragging out vowel phonemes.

---

## Lip-Sync Engine Modes & Models

The FOTOhub Lip-Sync Engine (`server/lip-sync-engine/`) provides three specialized inference tiers configured via the `mode` parameter:

| Mode | Underlying Architecture | Speed / Latency | Native Resolution | GPU Hardware | Primary Target Use Case |
|:---|:---|:---|:---|:---|:---|
| `fast` | **MuseTalk 1.5** | ~0.3x realtime | 720p | NVIDIA L4 / T4 | Interactive avatars, rapid drafting, social media clips |
| `hd` | **LatentSync 1.6** | ~1.5x realtime | 1080p | NVIDIA A10G / L40S | Commercial YouTube videos, corporate webinars, interviews |
| `ultra` | **FaceFusion 3.x** | ~3.5x realtime | Up to 4K | NVIDIA A100 / H100 | Cinematic trailers, broadcast television, extreme close-ups |

### Detailed Mode Breakdown & Tuning Parameters

#### 1. `fast` Mode: MuseTalk 1.5
MuseTalk operates in latent space using a lightweight spatial-temporal UNet. It crops the lower half of the face using facial landmarks, encodes audio frames via Whisper-extracted acoustic features, and blends the synthesized mouth patch back into the source video frame with boundary feathering.
- **Bounding Box Shift (`bbox_shift`)**: MuseTalk detects facial landmarks (chin, jawline, nose) to crop the target mouth region. If a speaker has a prominent jawline, facial hair, or is captured from a low camera angle, set `bbox_shift` (integer in pixels, typical range `-10` to `+15`) to vertically translate the crop window and avoid chin cutoff or nose boundary artifacts.
- **Throughput**: Processes at approximately 0.3x realtime (~18 seconds to render a 60-second clip on an NVIDIA L4 GPU).

#### 2. `hd` Mode: LatentSync 1.6
LatentSync replaces direct blending with a conditional diffusion process operating directly on latents. It preserves temporal consistency across frames, completely eliminating the "flutter" or flickering common to traditional GAN models.
- **Guidance Scale (`guidance_scale`)**: LatentSync uses Classifier-Free Guidance (CFG). FOTOhub benchmarks demonstrate that `2.0` provides the ideal balance between crisp phoneme-to-viseme synchronization and natural skin textures. Values above `3.5` cause over-sharpening around the vermilion border.
- **Inference Steps (`inference_steps`)**: Controls the reverse diffusion denoising iterations. Default is `30` steps. For rapid previews, `20` steps decreases processing time by 33% with minimal visual difference; `45` steps is recommended for 4K source plates.
- **Seed (`seed`)**: Fixed integer for deterministic generation across re-runs.

#### 3. `ultra` Mode: FaceFusion 3.x + GFPGAN 1.4 + LivePortrait
The `ultra` tier is an ensemble pipeline designed for high-resolution theatrical and advertising production. It chains three distinct neural models per video frame:
1. **Lip Synchronization**: `lip_syncer_model: "wav2lip_gan"` generates high-fidelity phoneme mouth configurations.
2. **Face Super-Resolution**: `face_enhancer_model: "gfpgan_1.4"` (or `"codeformer"`) restores microscopic skin pores, lip creases, teeth geometry, and removes compression artifacts.
3. **Expression Restoration**: `expression_restorer_model: "live_portrait"` re-injects micro-expressions, eye saccades, natural blink rates, and eyebrow twitches that GAN synchers inadvertently freeze.
4. **Face Enhancer Blend (`face_enhancer_blend`)**: Integer `0` to `100` controlling the alpha blend percentage between the restored neural face and the original background frame (recommended: `80` to `85`).
5. **Expression Blend (`expression_restorer_blend`)**: Integer `0` to `100` controlling how aggressively natural blinks and brow twitches are restored (recommended: `75` to `80`).

---

## Multi-Speaker Diarization & Facial Targeting

When a video contains multiple speakers (e.g., talk shows, panel discussions, interviews), blindly applying lip synchronization to the full video frame distorts the mouths of passive listeners.

FOTOhub handles multi-speaker video through an automated diarization and spatial tracking pipeline:

```mermaid
flowchart LR
    A["Multi-Speaker Video Frame"] --> B["YOLOv8-Face Detection"]
    B --> C["Face 0: Host<br/>[x1, y1, w1, h1]"]
    B --> D["Face 1: Guest<br/>[x2, y2, w2, h2]"]
    
    E["Audio Stream"] --> F["PyAnnote Diarization"]
    F --> G["Timestamp 00:04 - 00:12:<br/>Host Speaking (SPEAKER_00)"]
    
    C & G --> H["Optical Flow & Active Mouth Match"]
    H --> I["Retarget Face 0 ONLY"]
    D --> J["Preserve Face 1 Unaltered (No Masking)"]
```

1. **Acoustic Diarization**: Whisper Large-v3 and pyannote.audio assign speaker tags (`SPEAKER_00`, `SPEAKER_01`) to millisecond ranges.
2. **Computer Vision Landmark Association**:
   - YOLOv8-Face detects all active face bounding boxes per frame.
   - Lip motion variance (optical flow on mouth landmarks) identifies which bounding box corresponds to the active speaker's acoustic phonemes.
3. **Selective Facial Masking**:
   - The engine retargets only the active speaker's bounding box.
   - Passive participants remain unaltered, preserving natural reactions and background expressions.

::: tip Multi-Speaker Parameter
When dispatching multi-speaker jobs, pass `speaker_id: "SPEAKER_00"` in the request, or enable `auto_diarize: true` to let FOTOhub dynamically switch bounding boxes based on speaker turn-taking.
:::

---

## Production Economics & Pure USD Wallet Billing

All operations are billed strictly in **USD** against your prepaid wallet balance (`wallet.available_usd`). There are **zero synthetic tokens, credits, token packs, or foreign currency conversions**. Charges are deducted in real-time with pass-through micro-cent precision.

### Itemized Service Unit Costs

| Service / Step | Endpoint | Underlying Technology | USD Unit Rate | Metering Unit |
|:---|:---|:---|:---:|:---|
| **Audio Stem Separation** | `POST /v1/audio/separate` | Demucs v4 (Vocals + Accompaniment) | **$0.0200** | Flat per audio file ($\le 15$ min) |
| **Speech Transcription & Translation**| `POST /v1/audio/transcribe`| Whisper Large-v3 | **$0.0150** | Per minute of source audio |
| **Zero-Shot Voice Cloning** | `POST /v1/audio/voice-sonic/generate` | Voice Sonic Engine | **$0.0250** | Per minute of generated speech |
| **Azure Neural / Gemini TTS** | `POST /v1/audio/tts` | Neural TTS Engine | **$0.0120** | Per minute of generated speech |
| **Fast Lip-Sync (`mode: fast`)** | `POST /v1/video/lip-sync` | MuseTalk 1.5 (720p) | **$0.0400** | Per minute of processed video |
| **HD Diffusion Lip-Sync (`mode: hd`)** | `POST /v1/video/lip-sync` | LatentSync 1.6 (1080p, CFG 2.0) | **$0.0800** | Per minute of processed video |
| **Ultra Cinema Retargeting (`mode: ultra`)**| `POST /v1/video/lip-sync` | FaceFusion 3.x + GFPGAN 1.4 | **$0.1200** | Per minute of processed video |
| **BYOB S3/R2 Export** | `POST /v1/destinations` | Direct Cloud Push | **$0.0000** | Free / Zero egress fee |

### Example Cost Calculations

#### Scenario A: 60-Second Social Media Video (HD Mode)
- Audio Stem Separation: $0.0200
- Transcription & Translation (1 min): $0.0150
- Voice Cloning (1 min): $0.0250
- LatentSync 1.6 HD Processing (1 min): $0.0800
- **Total USD Charged:** **$0.1400 USD**

#### Scenario B: 10-Minute Executive Keynote (Fast Mode)
- Audio Stem Separation: $0.0200
- Transcription & Translation (10 min): $0.1500
- Voice Cloning (10 min): $0.2500
- MuseTalk 1.5 Fast Processing (10 min): $0.4000
- **Total USD Charged:** **$0.8200 USD**

#### Scenario C: 30-Second Luxury Cosmetic Ad (Ultra 4K Mode)
- Audio Stem Separation: $0.0200
- Transcription & Translation (0.5 min): $0.0075
- Voice Cloning (0.5 min): $0.0125
- FaceFusion + GFPGAN Ultra Processing (0.5 min): $0.0600
- **Total USD Charged:** **$0.1000 USD**

::: info Wallet Balance Safety Envelopes
Every API response returns `usd_charged` and `balance_usd`. If your balance falls below the cost of an operation, the API returns HTTP 402 with `{"detail": "insufficient_wallet_balance", "available_usd": 0.04, "required_usd": 0.08}`.
:::

---

## Single Video Implementation Guide

This end-to-end integration demonstrates how to ingest a master video, isolate stems, translate dialogue, clone the speaker's vocal timbre, retarget lip motion, and stream progress.

### 4-Way Code Implementation

::: code-group

```python [Python]
"""
FOTOhub Multilingual Lip-Sync & Dubbing Pipeline (Python SDK).
Executes vocal isolation, translation, zero-shot voice cloning, and HD lip retargeting.
"""

import os
import time
import requests
from typing import Dict, Any

API_KEY = os.environ.get("FOTOHUB_API_KEY", "fh_live_sample_key_9021")
BASE_URL = "https://apis.fotohub.app"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def poll_job_until_complete(job_id: str, poll_interval: int = 3, timeout_seconds: int = 600) -> Dict[str, Any]:
    """Polls any asynchronous FOTOhub job until completion."""
    start_time = time.time()
    while time.time() - start_time < timeout_seconds:
        resp = requests.get(f"{BASE_URL}/v1/jobs/{job_id}", headers=headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        status = data.get("status")

        if status == "completed":
            return data
        elif status in ("failed", "error"):
            raise RuntimeError(f"Job {job_id} failed: {data.get('error')}")

        progress = data.get("progress", 0)
        print(f"  [Polling] Job {job_id} is {status} ({progress}%)...")
        time.sleep(poll_interval)

    raise TimeoutError(f"Job {job_id} exceeded timeout of {timeout_seconds}s")

def dub_video_to_language(video_url: str, target_language: str = "es") -> Dict[str, Any]:
    print(f"\n=======================================================")
    print(f"Starting Multilingual Dubbing Pipeline: Target = {target_language.upper()}")
    print(f"Source: {video_url}")
    print(f"=======================================================")

    # Step 1: Separate audio stems (Vocals + Accompaniment)
    print("\n[Step 1/4] Separating vocal track from background audio (Demucs v4)...")
    sep_resp = requests.post(
        f"{BASE_URL}/v1/audio/separate",
        headers=headers,
        json={
            "audio_url": video_url,
            "stems": ["vocals", "accompaniment"]
        },
        timeout=30
    )
    sep_resp.raise_for_status()
    sep_data = sep_resp.json()
    sep_job_id = sep_data["job_id"]
    print(f"Stem separation job queued: {sep_job_id} (USD Charged: ${sep_data.get('usd_charged', 0.02):.4f})")

    sep_result = poll_job_until_complete(sep_job_id)
    vocal_url = sep_result["result"]["vocals_url"]
    bg_audio_url = sep_result["result"]["accompaniment_url"]
    print(f"Vocals isolated: {vocal_url}")
    print(f"Background audio isolated: {bg_audio_url}")

    # Step 2: Transcribe and translate speech to target language
    print(f"\n[Step 2/4] Transcribing & translating to '{target_language}' (Whisper Large-v3)...")
    transcribe_resp = requests.post(
        f"{BASE_URL}/v1/audio/transcribe",
        headers=headers,
        json={
            "audio_url": vocal_url,
            "task": "translate",
            "target_language": target_language,
            "word_timestamps": True
        },
        timeout=60
    )
    transcribe_resp.raise_for_status()
    transcribe_data = transcribe_resp.json()
    translated_text = transcribe_data["text"]
    print(f"Translated Text ({len(translated_text.split())} words):\n\"{translated_text}\"")

    # Step 3: Zero-Shot Voice Cloning in Target Language
    print("\n[Step 3/4] Synthesizing cloned voice with original timbre (Voice Sonic)...")
    voice_resp = requests.post(
        f"{BASE_URL}/v1/audio/voice-sonic/generate",
        headers=headers,
        json={
            "reference_audio_url": vocal_url,
            "text": translated_text,
            "language": target_language,
            "speed": 1.0,
            "preserve_pitch": True
        },
        timeout=60
    )
    voice_resp.raise_for_status()
    voice_data = voice_resp.json()
    new_speech_url = voice_data["audio_url"]
    print(f"Cloned speech generated: {new_speech_url}")

    # Step 4: Dispatch Neural Lip-Sync Retargeting (HD Mode)
    print("\n[Step 4/4] Retargeting facial motion (LatentSync 1.6 HD Mode)...")
    lip_sync_resp = requests.post(
        f"{BASE_URL}/v1/video/lip-sync",
        headers=headers,
        json={
            "video_url": video_url,
            "audio_url": new_speech_url,
            "background_audio_url": bg_audio_url,
            "mode": "hd",
            "guidance_scale": 2.0,
            "inference_steps": 30,
            "seed": 1247,
            "output_format": "mp4"
        },
        timeout=30
    )
    lip_sync_resp.raise_for_status()
    lip_data = lip_sync_resp.json()
    lip_job_id = lip_data["job_id"]
    print(f"Lip-sync task queued: {lip_job_id}")
    print(f"USD Charged: ${lip_data.get('usd_charged', 0.08):.4f} | Wallet Balance: ${lip_data.get('balance_usd', 0):.2f} USD")

    final_result = poll_job_until_complete(lip_job_id, timeout_seconds=900)
    final_video_url = final_result["result"]["video_url"]

    print("\n=======================================================")
    print(f"Pipeline Completed Successfully!")
    print(f"Rendered Output Video: {final_video_url}")
    print(f"Total Processing Time: {final_result.get('duration_seconds', 0):.1f}s")
    print(f"=======================================================")
    return final_result

if __name__ == "__main__":
    SOURCE_VIDEO = "https://storage.fotohub.app/raw/ceo_keynote_2026.mp4"
    dub_video_to_language(SOURCE_VIDEO, target_language="es")
```

```typescript [TypeScript]
/**
 * FOTOhub Multilingual Lip-Sync & Dubbing Pipeline (TypeScript).
 * Uses fetch with typed interfaces, pure USD billing inspection, and polling.
 */

interface JobPollResponse<T = Record<string, any>> {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress?: number;
  result?: T;
  error?: string;
  usd_charged?: number;
  balance_usd?: number;
  duration_seconds?: number;
}

const API_KEY = process.env.FOTOHUB_API_KEY || "fh_live_sample_key_9021";
const BASE_URL = "https://apis.fotohub.app";

const authHeaders = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollJob<T>(jobId: string, timeoutMs: number = 600000): Promise<JobPollResponse<T>> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const res = await fetch(`${BASE_URL}/v1/jobs/${jobId}`, { headers: authHeaders });
    if (!res.ok) {
      throw new Error(`Polling failed with status ${res.status}: ${await res.text()}`);
    }
    const data: JobPollResponse<T> = await res.json();
    if (data.status === "completed") return data;
    if (data.status === "failed") throw new Error(`Job ${jobId} failed: ${data.error}`);

    console.log(`  [Poll] Job ${jobId} is ${data.status} (${data.progress ?? 0}%)...`);
    await sleep(3000);
  }
  throw new Error(`Job ${jobId} timed out after ${timeoutMs / 1000}s`);
}

async function runDubbingWorkflow(videoUrl: string, targetLang: string) {
  console.log(`Starting dubbing for ${videoUrl} to ${targetLang.toUpperCase()}`);

  // Step 1: Stem separation
  console.log("Step 1: Separating vocals and accompaniment...");
  const sepRes = await fetch(`${BASE_URL}/v1/audio/separate`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      audio_url: videoUrl,
      stems: ["vocals", "accompaniment"],
    }),
  });
  if (!sepRes.ok) throw new Error(`Separation failed: ${await sepRes.text()}`);
  const sepJson = await sepRes.json();
  const sepJob = await pollJob<{ vocals_url: string; accompaniment_url: string }>(sepJson.job_id);

  const vocalUrl = sepJob.result!.vocals_url;
  const bgAudioUrl = sepJob.result!.accompaniment_url;

  // Step 2: Transcribe & Translate
  console.log("Step 2: Transcribing & translating audio...");
  const transRes = await fetch(`${BASE_URL}/v1/audio/transcribe`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      audio_url: vocalUrl,
      task: "translate",
      target_language: targetLang,
      word_timestamps: true,
    }),
  });
  if (!transRes.ok) throw new Error(`Transcription failed: ${await transRes.text()}`);
  const transData = await transRes.json();
  const translatedText: string = transData.text;

  // Step 3: Zero-shot voice clone
  console.log("Step 3: Generating cloned vocal stem...");
  const voiceRes = await fetch(`${BASE_URL}/v1/audio/voice-sonic/generate`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      reference_audio_url: vocalUrl,
      text: translatedText,
      language: targetLang,
      speed: 1.0,
    }),
  });
  if (!voiceRes.ok) throw new Error(`Voice cloning failed: ${await voiceRes.text()}`);
  const voiceData = await voiceRes.json();
  const newSpeechUrl: string = voiceData.audio_url;

  // Step 4: Retarget Lips via LatentSync HD
  console.log("Step 4: Submitting Lip-Sync retargeting task...");
  const lipRes = await fetch(`${BASE_URL}/v1/video/lip-sync`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      video_url: videoUrl,
      audio_url: newSpeechUrl,
      background_audio_url: bgAudioUrl,
      mode: "hd",
      guidance_scale: 2.0,
      inference_steps: 30,
      seed: 1247,
    }),
  });
  if (!lipRes.ok) throw new Error(`Lip-sync failed: ${await lipRes.text()}`);
  const lipJson = await lipRes.json();
  console.log(`Lip-sync dispatched: ${lipJson.job_id} (USD Charged: $${lipJson.usd_charged} USD)`);

  const finished = await pollJob<{ video_url: string }>(lipJson.job_id, 900000);
  console.log(`Dubbing Complete! Final Video: ${finished.result!.video_url}`);
  console.log(`Wallet Balance: $${finished.balance_usd ?? lipJson.balance_usd} USD`);
}

runDubbingWorkflow("https://storage.fotohub.app/raw/ceo_keynote_2026.mp4", "de").catch(console.error);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

const baseURL = "https://apis.fotohub.app"

type AsyncResponse struct {
	JobID      string  `json:"job_id"`
	Status     string  `json:"status"`
	USDCharged float64 `json:"usd_charged"`
	BalanceUSD float64 `json:"balance_usd"`
	Progress   int     `json:"progress"`
	Error      string  `json:"error,omitempty"`
	Result     struct {
		VocalsURL        string `json:"vocals_url"`
		AccompanimentURL string `json:"accompaniment_url"`
		VideoURL         string `json:"video_url"`
	} `json:"result,omitempty"`
}

type TranscribeResponse struct {
	Text string `json:"text"`
}

type VoiceSonicResponse struct {
	AudioURL string `json:"audio_url"`
}

func doRequest(method, endpoint string, payload interface{}) ([]byte, error) {
	var body io.Reader
	if payload != nil {
		b, err := json.Marshal(payload)
		if err != nil {
			return nil, err
		}
		body = bytes.NewBuffer(b)
	}

	req, err := http.NewRequest(method, baseURL+endpoint, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("API error (%d): %s", resp.StatusCode, string(respBytes))
	}
	return respBytes, nil
}

func pollJob(jobID string) (*AsyncResponse, error) {
	for i := 0; i < 200; i++ {
		bytesResp, err := doRequest("GET", "/v1/jobs/"+jobID, nil)
		if err != nil {
			return nil, err
		}
		var state AsyncResponse
		if err := json.Unmarshal(bytesResp, &state); err != nil {
			return nil, err
		}

		if state.Status == "completed" {
			return &state, nil
		}
		if state.Status == "failed" {
			return nil, fmt.Errorf("job failed: %s", state.Error)
		}
		fmt.Printf("  Polling job %s... status=%s (%d%%)\n", jobID, state.Status, state.Progress)
		time.Sleep(3 * time.Second)
	}
	return nil, fmt.Errorf("job %s timed out", jobID)
}

func main() {
	videoURL := "https://storage.fotohub.app/raw/ceo_keynote_2026.mp4"
	targetLang := "fr"

	fmt.Println("=== Starting FOTOhub Go Dubbing Pipeline ===")

	// 1. Separate Audio Stems
	sepPayload := map[string]interface{}{
		"audio_url": videoURL,
		"stems":     []string{"vocals", "accompaniment"},
	}
	sepRaw, err := doRequest("POST", "/v1/audio/separate", sepPayload)
	if err != nil {
		panic(err)
	}
	var sepInit AsyncResponse
	json.Unmarshal(sepRaw, &sepInit)
	fmt.Printf("Stem separation queued: %s (Charged: $%.4f USD)\n", sepInit.JobID, sepInit.USDCharged)

	sepDone, err := pollJob(sepInit.JobID)
	if err != nil {
		panic(err)
	}

	// 2. Transcribe & Translate
	transPayload := map[string]interface{}{
		"audio_url":       sepDone.Result.VocalsURL,
		"task":            "translate",
		"target_language": targetLang,
	}
	transRaw, err := doRequest("POST", "/v1/audio/transcribe", transPayload)
	if err != nil {
		panic(err)
	}
	var transResult TranscribeResponse
	json.Unmarshal(transRaw, &transResult)
	fmt.Printf("Translated Text: %s\n", transResult.Text)

	// 3. Zero-Shot Voice Clone
	clonePayload := map[string]interface{}{
		"reference_audio_url": sepDone.Result.VocalsURL,
		"text":                transResult.Text,
		"language":            targetLang,
		"speed":               1.0,
	}
	cloneRaw, err := doRequest("POST", "/v1/audio/voice-sonic/generate", clonePayload)
	if err != nil {
		panic(err)
	}
	var cloneResult VoiceSonicResponse
	json.Unmarshal(cloneRaw, &cloneResult)

	// 4. Lip-Sync HD
	lipPayload := map[string]interface{}{
		"video_url":            videoURL,
		"audio_url":            cloneResult.AudioURL,
		"background_audio_url": sepDone.Result.AccompanimentURL,
		"mode":                 "hd",
		"guidance_scale":       2.0,
		"inference_steps":      30,
		"seed":                 1247,
	}
	lipRaw, err := doRequest("POST", "/v1/video/lip-sync", lipPayload)
	if err != nil {
		panic(err)
	}
	var lipInit AsyncResponse
	json.Unmarshal(lipRaw, &lipInit)
	fmt.Printf("Lip-sync job dispatched: %s (Charged: $%.4f USD | Balance: $%.2f USD)\n",
		lipInit.JobID, lipInit.USDCharged, lipInit.BalanceUSD)

	finalJob, err := pollJob(lipInit.JobID)
	if err != nil {
		panic(err)
	}
	fmt.Printf("[✓] Master dubbed video ready: %s\n", finalJob.Result.VideoURL)
}
```

```bash [cURL]
# 1. Dispatch Audio Stem Separation (Demucs v4)
SEP_JOB=$(curl -s -X POST https://apis.fotohub.app/v1/audio/separate \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://storage.fotohub.app/raw/ceo_keynote_2026.mp4",
    "stems": ["vocals", "accompaniment"]
  }')

SEP_ID=$(echo $SEP_JOB | jq -r '.job_id')
echo "Separation Job ID: $SEP_ID (USD Charged: $(echo $SEP_JOB | jq -r '.usd_charged'))"

# (Wait for separation to finish)
sleep 15
SEP_STATUS=$(curl -s -H "Authorization: Bearer $FOTOHUB_API_KEY" https://apis.fotohub.app/v1/jobs/$SEP_ID)
VOCAL_URL=$(echo $SEP_STATUS | jq -r '.result.vocals_url')
BG_URL=$(echo $SEP_STATUS | jq -r '.result.accompaniment_url')

# 2. Transcribe & Translate to Spanish
TRANSCRIPT=$(curl -s -X POST https://apis.fotohub.app/v1/audio/transcribe \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"audio_url\": \"$VOCAL_URL\",
    \"task\": \"translate\",
    \"target_language\": \"es\"
  }" | jq -r '.text')

echo "Translated Text: $TRANSCRIPT"

# 3. Clone Speaker Voice in Spanish
CLONED_AUDIO=$(curl -s -X POST https://apis.fotohub.app/v1/audio/voice-sonic/generate \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"reference_audio_url\": \"$VOCAL_URL\",
    \"text\": $(echo $TRANSCRIPT | jq -R .),
    \"language\": \"es\",
    \"speed\": 1.0
  }" | jq -r '.audio_url')

# 4. Dispatch LatentSync HD Lip-Sync Job
curl -s -X POST https://apis.fotohub.app/v1/video/lip-sync \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_url\": \"https://storage.fotohub.app/raw/ceo_keynote_2026.mp4\",
    \"audio_url\": \"$CLONED_AUDIO\",
    \"background_audio_url\": \"$BG_URL\",
    \"mode\": \"hd\",
    \"guidance_scale\": 2.0,
    \"inference_steps\": 30,
    \"seed\": 1247
  }" | jq .
```

:::

---

## Automated Multilingual Batch Script (1 Video to 5 Languages)

Global content publishers often require a single source video to be dubbed simultaneously into multiple target markets (e.g., Spanish, German, French, Japanese, and Brazilian Portuguese).

The script below executes the stem separation once, and then fans out across five concurrent worker tasks, each executing language-specific translation, zero-shot voice synthesis, and LatentSync retargeting.

::: code-group

```python [Python]
"""
FOTOhub 1-to-5 Multilingual Batch Dubbing Orchestrator.
Dubs a master source video into 5 languages concurrently with worker pool management.
"""

import asyncio
import os
import aiohttp
from typing import Dict, List, Any

API_KEY = os.environ.get("FOTOHUB_API_KEY", "fh_live_sample_key_9021")
BASE_URL = "https://apis.fotohub.app"

TARGET_LANGUAGES = [
    {"code": "es", "name": "Spanish"},
    {"code": "de", "name": "German"},
    {"code": "fr", "name": "French"},
    {"code": "ja", "name": "Japanese"},
    {"code": "pt-BR", "name": "Portuguese (Brazil)"}
]

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

async def poll_async_job(session: aiohttp.ClientSession, job_id: str, label: str) -> Dict[str, Any]:
    while True:
        async with session.get(f"{BASE_URL}/v1/jobs/{job_id}", headers=HEADERS) as resp:
            data = await resp.json()
            status = data.get("status")
            if status == "completed":
                return data
            if status == "failed":
                raise RuntimeError(f"[{label}] Job {job_id} failed: {data.get('error')}")
            await asyncio.sleep(4)

async def dub_language_worker(
    session: aiohttp.ClientSession,
    video_url: str,
    vocal_url: str,
    bg_url: str,
    lang_info: Dict[str, str],
    destination_id: str
) -> Dict[str, Any]:
    code = lang_info["code"]
    name = lang_info["name"]
    print(f"[{name}] Translating dialogue...")

    # 1. Transcribe & Translate
    async with session.post(
        f"{BASE_URL}/v1/audio/transcribe",
        headers=HEADERS,
        json={"audio_url": vocal_url, "task": "translate", "target_language": code}
    ) as resp:
        t_data = await resp.json()
        translated_text = t_data["text"]

    # 2. Voice Sonic Zero-Shot Clone
    print(f"[{name}] Synthesizing cloned vocal track...")
    async with session.post(
        f"{BASE_URL}/v1/audio/voice-sonic/generate",
        headers=HEADERS,
        json={"reference_audio_url": vocal_url, "text": translated_text, "language": code}
    ) as resp:
        v_data = await resp.json()
        cloned_audio_url = v_data["audio_url"]

    # 3. Neural Lip-Sync Job (HD Mode with BYOB S3 Push)
    print(f"[{name}] Dispatched LatentSync HD job...")
    async with session.post(
        f"{BASE_URL}/v1/video/lip-sync",
        headers=HEADERS,
        json={
            "video_url": video_url,
            "audio_url": cloned_audio_url,
            "background_audio_url": bg_url,
            "mode": "hd",
            "guidance_scale": 2.0,
            "inference_steps": 30,
            "seed": 1247,
            "destination_id": destination_id,
            "output_filename": f"dubs/keynote_{code}.mp4"
        }
    ) as resp:
        lip_data = await resp.json()
        lip_job_id = lip_data["job_id"]

    result = await poll_async_job(session, lip_job_id, name)
    print(f"[✓ {name}] Dubbing Complete! URL: {result['result']['video_url']}")
    return {
        "language": code,
        "video_url": result["result"]["video_url"],
        "usd_charged": lip_data.get("usd_charged", 0.08)
    }

async def run_batch_dubbing(video_url: str, destination_id: str):
    async with aiohttp.ClientSession() as session:
        print(f"Step 1: Running single Demucs v4 stem isolation...")
        async with session.post(
            f"{BASE_URL}/v1/audio/separate",
            headers=HEADERS,
            json={"audio_url": video_url, "stems": ["vocals", "accompaniment"]}
        ) as resp:
            sep_init = await resp.json()

        sep_job = await poll_async_job(session, sep_init["job_id"], "Demucs")
        vocal_url = sep_job["result"]["vocals_url"]
        bg_url = sep_job["result"]["accompaniment_url"]
        print(f"Master stems ready. Fan-out to 5 languages concurrently...")

        tasks = [
            dub_language_worker(session, video_url, vocal_url, bg_url, lang, destination_id)
            for lang in TARGET_LANGUAGES
        ]
        results = await asyncio.gather(*tasks)

        print("\nAll 5 Languages Rendered Successfully:")
        total_spent = sep_init.get("usd_charged", 0.02) + sum(r["usd_charged"] for r in results)
        for r in results:
            print(f" - {r['language']}: {r['video_url']}")
        print(f"Total Batch Cost: ${total_spent:.4f} USD")

if __name__ == "__main__":
    asyncio.run(run_batch_dubbing(
        video_url="https://storage.fotohub.app/raw/ceo_keynote_2026.mp4",
        destination_id="dest_s3_production_eu_west"
    ))
```

```typescript [TypeScript]
/**
 * FOTOhub 1-to-5 Multilingual Batch Dubbing Orchestrator (TypeScript/Node.js).
 * Executes concurrent fan-out using Promise.all with typed responses.
 */

const API_KEY = process.env.FOTOHUB_API_KEY!;
const BASE_URL = "https://apis.fotohub.app";

const TARGET_LANGS = [
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
  { code: "ja", label: "Japanese" },
  { code: "pt-BR", label: "Portuguese" },
];

async function pollAsync(jobId: string): Promise<any> {
  while (true) {
    const res = await fetch(`${BASE_URL}/v1/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await res.json();
    if (data.status === "completed") return data;
    if (data.status === "failed") throw new Error(`Job ${jobId} failed: ${data.error}`);
    await new Promise((r) => setTimeout(r, 4000));
  }
}

async function executeBatchDub(videoUrl: string, destId: string) {
  console.log("Separating stems once for all target languages...");
  const sepRes = await fetch(`${BASE_URL}/v1/audio/separate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ audio_url: videoUrl, stems: ["vocals", "accompaniment"] }),
  });
  const sepJson = await sepRes.json();
  const sepJob = await pollAsync(sepJson.job_id);
  const vocalUrl = sepJob.result.vocals_url;
  const bgUrl = sepJob.result.accompaniment_url;

  console.log("Stem separation complete. Fan-out across 5 languages in parallel...");

  const workers = TARGET_LANGS.map(async (lang) => {
    // 1. Transcribe & Translate
    const transRes = await fetch(`${BASE_URL}/v1/audio/transcribe`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ audio_url: vocalUrl, task: "translate", target_language: lang.code }),
    });
    const transJson = await transRes.json();

    // 2. Clone Voice
    const voiceRes = await fetch(`${BASE_URL}/v1/audio/voice-sonic/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reference_audio_url: vocalUrl, text: transJson.text, language: lang.code }),
    });
    const voiceJson = await voiceRes.json();

    // 3. Lip-Sync
    const lipRes = await fetch(`${BASE_URL}/v1/video/lip-sync`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        video_url: videoUrl,
        audio_url: voiceJson.audio_url,
        background_audio_url: bgUrl,
        mode: "hd",
        guidance_scale: 2.0,
        inference_steps: 30,
        destination_id: destId,
      }),
    });
    const lipJson = await lipRes.json();
    const finalJob = await pollAsync(lipJson.job_id);

    console.log(`[✓ ${lang.label}] Rendered: ${finalJob.result.video_url}`);
    return { lang: lang.code, url: finalJob.result.video_url };
  });

  const allOutputs = await Promise.all(workers);
  console.log("Batch Dubbing Finished:", allOutputs);
}

executeBatchDub("https://storage.fotohub.app/raw/keynote.mp4", "dest_s3_production_eu_west");
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"
	"time"
)

type LangJob struct {
	Code  string
	Label string
}

func main() {
	languages := []LangJob{
		{"es", "Spanish"},
		{"de", "German"},
		{"fr", "French"},
		{"ja", "Japanese"},
		{"pt-BR", "Portuguese"},
	}

	videoURL := "https://storage.fotohub.app/raw/keynote.mp4"
	apiKey := os.Getenv("FOTOHUB_API_KEY")

	fmt.Println("=== FOTOhub Concurrent Go Batch Dubber ===")
	// Step 1: Stem separation
	fmt.Println("Extracting audio stems with Demucs v4...")
	vocalURL := "https://storage.fotohub.app/stems/vocals_master.wav"
	bgURL := "https://storage.fotohub.app/stems/bg_master.wav"

	var wg sync.WaitGroup
	results := make(chan string, len(languages))

	for _, lang := range languages {
		wg.Add(1)
		go func(l LangJob) {
			defer wg.Done()
			fmt.Printf("[%s] Starting parallel dubbing...\n", l.Label)

			payload := map[string]interface{}{
				"video_url":            videoURL,
				"audio_url":            vocalURL,
				"background_audio_url": bgURL,
				"mode":                 "hd",
				"guidance_scale":       2.0,
				"inference_steps":      30,
				"destination_id":       "dest_s3_production_eu_west",
			}
			b, _ := json.Marshal(payload)
			req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/video/lip-sync", bytes.NewBuffer(b))
			req.Header.Set("Authorization", "Bearer "+apiKey)
			req.Header.Set("Content-Type", "application/json")

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				fmt.Printf("[%s] Request failed: %v\n", l.Label, err)
				return
			}
			defer resp.Body.Close()
			bodyBytes, _ := io.ReadAll(resp.Body)

			var res map[string]interface{}
			json.Unmarshal(bodyBytes, &res)
			jobID := res["job_id"].(string)

			// Poll for completion
			for {
				time.Sleep(5 * time.Second)
				pReq, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/jobs/"+jobID, nil)
				pReq.Header.Set("Authorization", "Bearer "+apiKey)
				pResp, _ := http.DefaultClient.Do(pReq)
				pBody, _ := io.ReadAll(pResp.Body)
				pResp.Body.Close()

				var pState map[string]interface{}
				json.Unmarshal(pBody, &pState)
				if pState["status"] == "completed" {
					resObj := pState["result"].(map[string]interface{})
					outURL := resObj["video_url"].(string)
					fmt.Printf("[✓ %s] Finished: %s\n", l.Label, outURL)
					results <- fmt.Sprintf("%s: %s", l.Code, outURL)
					break
				}
			}
		}(lang)
	}

	wg.Wait()
	close(results)

	fmt.Println("\nAll 5 Languages Rendered:")
	for r := range results {
		fmt.Println(" -", r)
	}
}
```

```bash [cURL]
# Shell loop running 5 parallel language jobs in background
TARGET_LANGS=("es" "de" "fr" "ja" "pt-BR")
VIDEO_URL="https://storage.fotohub.app/raw/keynote.mp4"
VOCAL_URL="https://storage.fotohub.app/stems/vocals_master.wav"
BG_URL="https://storage.fotohub.app/stems/bg_master.wav"

for LANG in "${TARGET_LANGS[@]}"; do
  echo "Dispatching $LANG dubbing job..."
  curl -s -X POST https://apis.fotohub.app/v1/video/lip-sync \
    -H "Authorization: Bearer $FOTOHUB_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"video_url\": \"$VIDEO_URL\",
      \"audio_url\": \"$VOCAL_URL\",
      \"background_audio_url\": \"$BG_URL\",
      \"mode\": \"hd\",
      \"guidance_scale\": 2.0,
      \"inference_steps\": 30,
      \"destination_id\": \"dest_s3_production_eu_west\",
      \"metadata\": {\"target_lang\": \"$LANG\"}
    }" | jq -r '.job_id' &
done

wait
echo "All 5 language jobs dispatched to FOTOhub GPU cluster."
```

:::

---

## Bring-Your-Own-Bucket (BYOB) Storage Integration

By default, rendered videos are hosted on FOTOhub edge storage for 7 days. For enterprise compliance, HIPAA/SOC-2 privacy, and zero-egress workflows, FOTOhub routes rendered outputs directly to your own **AWS S3, Cloudflare R2, or Google Cloud Storage** bucket via `/v1/destinations`.

### 1. Registering an S3 / R2 Destination

Configure your storage destination once using your private bucket credentials:

::: code-group

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/destinations \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "s3_compatible",
    "name": "Production EU-West Video Lake",
    "endpoint": "https://s3.eu-west-1.amazonaws.com",
    "bucket": "corp-media-dubbed-prod",
    "region": "eu-west-1",
    "access_key_id": "AKIAIOSFODNN7EXAMPLE",
    "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "path_prefix": "dubs/2026/",
    "public_url_base": "https://cdn.mycompany.com/dubs/2026/"
  }'
```

```python [Python]
import os
import requests

resp = requests.post(
    "https://apis.fotohub.app/v1/destinations",
    headers={
        "Authorization": f"Bearer {os.environ['FOTOHUB_API_KEY']}",
        "Content-Type": "application/json"
    },
    json={
        "provider": "cloudflare_r2",
        "name": "Global Media R2 Edge",
        "endpoint": "https://a1b2c3d4e5f6.r2.cloudflarestorage.com",
        "bucket": "media-dubs-global",
        "access_key_id": os.environ["R2_ACCESS_KEY_ID"],
        "secret_access_key": os.environ["R2_SECRET_ACCESS_KEY"],
        "path_prefix": "outputs/lip-sync/",
        "public_url_base": "https://media.mybrand.com/outputs/lip-sync/"
    }
)
dest = resp.json()
print(f"Destination Created: {dest['destination_id']} (Status: {dest['status']})")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/destinations", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    provider: "s3_compatible",
    name: "Corporate Video Bucket",
    endpoint: "https://s3.us-east-1.amazonaws.com",
    bucket: "enterprise-lip-sync-vault",
    region: "us-east-1",
    access_key_id: process.env.AWS_ACCESS_KEY_ID,
    secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
    path_prefix: "localized/",
    public_url_base: "https://videos.mycorp.internal/localized/",
  }),
});
const destination = await response.json();
console.log("Registered destination:", destination.destination_id);
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	payload := map[string]interface{}{
		"provider":          "s3_compatible",
		"name":              "Primary Dubbing Bucket",
		"endpoint":          "https://s3.eu-central-1.amazonaws.com",
		"bucket":            "frankfurt-video-storage",
		"region":            "eu-central-1",
		"access_key_id":     os.Getenv("AWS_ACCESS_KEY_ID"),
		"secret_access_key": os.Getenv("AWS_SECRET_ACCESS_KEY"),
		"path_prefix":       "render-cache/",
		"public_url_base":   "https://cdn.mycorp.de/render-cache/",
	}
	b, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/destinations", bytes.NewBuffer(b))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	fmt.Println("Destination response:", string(bodyBytes))
}
```

:::

#### Verification Response
```json
{
  "destination_id": "dest_s3_production_eu_west",
  "status": "verified",
  "verified_at": "2026-09-06T16:20:00Z",
  "provider": "s3_compatible",
  "bucket": "corp-media-dubbed-prod",
  "region": "eu-west-1"
}
```

### 2. Referencing Destination in Lip-Sync Requests

Add `"destination_id": "dest_s3_production_eu_west"` to your `POST /v1/video/lip-sync` payload. When rendering completes, the GPU worker uploads the final MP4 directly to your bucket and delivers your custom CDN URL in the webhook payload.

---

## Production Webhook Notification & Signature Verification

FOTOhub delivers real-time notifications when lip-sync operations complete, eliminating the need to poll `/v1/jobs/{id}`.

### Signature Verification Security
Every webhook HTTP request includes two security headers:
- `X-FotoHub-Signature`: Hex-encoded `HMAC-SHA256` signature calculated across `${timestamp}.${raw_payload}` using your webhook secret.
- `X-FotoHub-Timestamp`: Unix timestamp (seconds) when the event was dispatched.

::: tip Replay Attack Prevention
Always verify that `Math.abs(Date.now() / 1000 - timestamp) < 300` (within a 5-minute tolerance window) to protect against replay attacks.
:::

### Webhook Event: `lip_sync.job.completed`

```json
{
  "event": "lip_sync.job.completed",
  "timestamp": 1788712400,
  "job_id": "job_ls_890123ab",
  "user_id": "usr_998124ef",
  "data": {
    "mode": "hd",
    "resolution": "1080p",
    "duration_seconds": 45.2,
    "video_url": "https://cdn.mycompany.com/dubs/2026/keynote_es.mp4",
    "guidance_scale": 2.0,
    "inference_steps": 30,
    "seed": 1247,
    "billing": {
      "usd_charged": 0.0800,
      "balance_usd": 14.9200,
      "currency": "USD"
    }
  }
}
```

### Production Webhook Verification Implementations

::: code-group

```python [Python (FastAPI)]
"""
Production FastAPI Webhook Receiver for FOTOhub Lip-Sync Events.
Validates HMAC-SHA256 signatures and guards against replay attacks.
"""

import hmac
import hashlib
import time
from fastapi import FastAPI, Request, HTTPException, Header

app = FastAPI()
WEBHOOK_SECRET = "whsec_live_production_secret_9981"

@app.post("/webhooks/fotohub")
async def handle_fotohub_webhook(
    request: Request,
    x_fotohub_signature: str = Header(..., alias="X-FotoHub-Signature"),
    x_fotohub_timestamp: int = Header(..., alias="X-FotoHub-Timestamp")
):
    # 1. Replay attack check (5-minute tolerance window)
    now = int(time.time())
    if abs(now - x_fotohub_timestamp) > 300:
        raise HTTPException(status_code=400, detail="Timestamp out of bounds (replay attack protection)")

    # 2. Read raw payload
    raw_body = await request.body()

    # 3. Compute expected HMAC-SHA256
    signed_payload = f"{x_fotohub_timestamp}.".encode("utf-8") + raw_body
    expected_signature = hmac.new(
        WEBHOOK_SECRET.encode("utf-8"),
        signed_payload,
        hashlib.sha256
    ).hexdigest()

    # 4. Constant-time signature comparison
    if not hmac.compare_digest(expected_signature, x_fotohub_signature):
        raise HTTPException(status_code=401, detail="Invalid HMAC-SHA256 signature")

    # 5. Process validated event
    payload = await request.json()
    event_type = payload.get("event")

    if event_type == "lip_sync.job.completed":
        data = payload["data"]
        job_id = payload["job_id"]
        video_url = data["video_url"]
        usd_charged = data["billing"]["usd_charged"]
        remaining_balance = data["billing"]["balance_usd"]

        print(f"[✓ Webhook] Job {job_id} Completed!")
        print(f"  Rendered Video: {video_url}")
        print(f"  Billed: ${usd_charged:.4f} USD | Wallet Balance: ${remaining_balance:.2f} USD")

    elif event_type == "lip_sync.job.failed":
        print(f"[✗ Webhook] Job {payload['job_id']} Failed: {payload.get('error')}")

    return {"received": True}
```

```typescript [TypeScript (Express / Next.js)]
/**
 * Production Node.js Webhook Receiver for FOTOhub Events.
 * Validates HMAC-SHA256 signatures with crypto.timingSafeEqual.
 */

import express, { Request, Response } from "express";
import crypto from "crypto";

const app = express();
const WEBHOOK_SECRET = "whsec_live_production_secret_9981";

// Preserve raw body buffer for HMAC calculation
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

app.post("/webhooks/fotohub", (req: Request, res: Response) => {
  const signature = req.headers["x-fotohub-signature"] as string;
  const timestampHeader = req.headers["x-fotohub-timestamp"] as string;

  if (!signature || !timestampHeader) {
    return res.status(400).send("Missing security headers");
  }

  const timestamp = parseInt(timestampHeader, 10);
  const now = Math.floor(Date.now() / 1000);

  // 1. Replay attack validation (5-minute tolerance)
  if (Math.abs(now - timestamp) > 300) {
    return res.status(400).send("Timestamp drift exceeds 300s");
  }

  // 2. Compute HMAC-SHA256
  const rawPayload = (req as any).rawBody;
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  hmac.update(`${timestamp}.`);
  hmac.update(rawPayload);
  const expectedSignature = hmac.digest("hex");

  // 3. Constant-time comparison
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return res.status(401).send("Invalid signature");
  }

  const { event, job_id, data } = req.body;
  if (event === "lip_sync.job.completed") {
    console.log(`[Webhook] Job ${job_id} ready at: ${data.video_url}`);
    console.log(`USD Charged: $${data.billing.usd_charged} | Balance: $${data.billing.balance_usd} USD`);
  }

  return res.status(200).json({ received: true });
});

app.listen(3000, () => console.log("Webhook listener running on port 3000"));
```

:::

---

## Parameter Reference Guide

### `POST /v1/video/lip-sync`

| Parameter | Type | Required | Default | Allowed Values | Description |
|:---|:---:|:---:|:---:|:---|:---|
| `video_url` | string | Yes | — | Valid HTTP/HTTPS/S3 URL | Source video file containing visible faces (max 256 MB, up to 120s per clip). |
| `audio_url` | string | Yes | — | Valid HTTP/HTTPS/S3 URL | Driving audio file containing speech (WAV or MP3, max 32 MB). |
| `background_audio_url`| string | No | `null` | Valid HTTP/HTTPS/S3 URL | Optional accompaniment or music stem. If provided, FOTOhub auto-multiplexes it with the retargeted vocals using -14 LUFS ducking. |
| `mode` | string | No | `"fast"` | `"fast"`, `"hd"`, `"ultra"` | Neural retargeting engine tier. |
| `guidance_scale` | float | No | `2.0` | `1.0` – `5.0` | Classifier-Free Guidance (CFG) multiplier used in `hd` (LatentSync) mode. |
| `inference_steps` | int | No | `30` | `15` – `50` | Reverse diffusion denoising steps in `hd` mode. |
| `seed` | int | No | `1247` | Integer $\ge 0$ | Random seed for deterministic generation. |
| `bbox_shift` | int | No | `0` | `-30` – `30` | Vertical pixel adjustment for mouth crop in `fast` (MuseTalk) mode. |
| `lip_syncer_model` | string | No | `"wav2lip_gan"`| `"wav2lip_gan"`, `"wav2lip"` | Core GAN syncher used in `ultra` mode. |
| `face_enhancer_model` | string | No | `"gfpgan_1.4"`| `"gfpgan_1.4"`, `"codeformer"` | Neural face restoration model used in `ultra` mode. |
| `face_enhancer_blend` | int | No | `80` | `0` – `100` | Opacity percentage blending restored face onto background frame. |
| `expression_restorer_model`| string| No| `"live_portrait"`| `"live_portrait"`, `"none"` | Restores natural eye blinks and micro-expressions in `ultra` mode. |
| `expression_restorer_blend`| int| No| `75` | `0` – `100` | Intensity blend of natural eye blinks and brow motion. |
| `output_quality` | int | No | `95` | `50` – `100` | NVENC H.264 CRF encoding quality. |
| `destination_id` | string | No | `null` | Registered UUID/ID | External S3/R2 bucket destination configured via `/v1/destinations`. |
| `webhook_url` | string | No | `null` | HTTPS URL | Endpoint receiving HMAC-signed delivery events. |
| `webhook_secret` | string | No | `null` | String (8-256 chars) | Secret key used to generate `X-FotoHub-Signature`. |
| `auto_diarize` | bool | No | `false` | `true`, `false` | Enables multi-speaker face tracking and selective retargeting. |
| `speaker_id` | string | No | `null` | String (e.g. `SPEAKER_00`) | Explicit speaker identifier targeted for lip retargeting. |

---

## Troubleshooting & Failure Mitigation

### 1. Chin Clipping & Beard Artifacts (`fast` Mode)
- **Symptom**: The lower chin appears truncated or exhibits unnatural skin boundary lines.
- **Root Cause**: The default MuseTalk landmark detector placed the bounding box too high, clipping the lower mandible.
- **Remedy**: Increment `bbox_shift` to `+5`, `+8`, or `+12`. For low-angle camera shots looking up at the speaker, set `bbox_shift: 10`.

### 2. Over-Smoothing of Facial Pores (`hd` Mode)
- **Symptom**: The mouth and teeth appear waxy or lack natural skin pore details.
- **Root Cause**: Setting `guidance_scale` above `3.5` or `inference_steps` below `20`.
- **Remedy**: Lock `guidance_scale: 2.0` and increase `inference_steps: 35`.

### 3. Syllable Desync at Sentence Endings
- **Symptom**: Mouth movements stop 1 second before vocal audio finishes.
- **Root Cause**: Synthesized audio was longer than the source speech segment without WSOLA tempo scaling.
- **Remedy**: Ensure `word_timestamps: true` is enabled on `/v1/audio/transcribe` and verify audio stretching is enabled during voice cloning.

### 4. Insufficient Wallet Balance (HTTP 402)
- **Symptom**: API returns `HTTP 402 Payment Required` with detail `insufficient_wallet_balance`.
- **Remedy**: Top up your USD balance via [Console Billing](https://fotohub.app/console/billing) or configure automated USD wallet balance reload triggers via Stripe.

---

## Complete End-to-End Test Suite

Validate your integration using this automated test script that executes health verification, preflight wallet checks, and full dubbing dispatch:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "==> 1. Checking FOTOhub API Cluster Health..."
curl -sf https://apis.fotohub.app/v1/health | jq .

echo "==> 2. Verifying USD Prepaid Wallet Balance..."
BALANCE=$(curl -sf -H "Authorization: Bearer $FOTOHUB_API_KEY" https://apis.fotohub.app/v1/wallet | jq -r '.wallet.available_usd')
echo "Current Balance: \$$BALANCE USD"

if (( $(echo "$BALANCE < 0.20" | bc -l) )); then
  echo "ERROR: Wallet balance too low for dubbing test. Please top up at fotohub.app/console/billing"
  exit 1
fi

echo "==> 3. Running Preflight Lip-Sync Request..."
curl -sf -X POST https://apis.fotohub.app/v1/video/lip-sync \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://storage.fotohub.app/raw/sample_host.mp4",
    "audio_url": "https://storage.fotohub.app/audio/spanish_sample.wav",
    "mode": "fast",
    "bbox_shift": 4
  }' | jq .
```
