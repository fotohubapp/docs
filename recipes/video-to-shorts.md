# Video to Viral Shorts Pipeline

Automatically transform webinars, video podcasts, interview broadcasts, and YouTube long-form videos into high-converting, broadcast-grade vertical Shorts, Instagram Reels, and TikToks.

This enterprise blueprint orchestrates FOTOhub's **Shorts Engine** (`server/shorts-engine/`), coordinating an automated 11-stage pipeline: audio-visual ingest, WhisperX timestamped transcription, prosody structural analysis, narrative clip extraction, multi-dimensional B-Score virality evaluation, automated hook card generation, AI face-tracking 9:16 reframe (with multi-camera layouts), animated karaoke caption generation with ASS bounce keyframes, contextual B-roll cutaway overlay, broadcast audio mastering with -14 LUFS sidechain ducking, and hardware-accelerated NVENC GPU composition.

> [!TIP] Specialized Media Recipes
> - For dedicated studio podcast layouts and multi-host setups, see **[Long-Form Podcast to Viral Shorts Studio](./podcast-to-clips.md)**.
> - For generating performance video ads from e-commerce product URLs, see **[Automated UGC Video Ads](./ugc-video-campaigns.md)**.
> - For multilingual lip-syncing and re-voicing, see **[Multilingual Lip-Sync & Video Dubbing](./lip-sync-dubbing.md)**.

---

## 11-Stage Pipeline Architecture

The FOTOhub Shorts Engine executes an automated directed acyclic graph (DAG) across dedicated GPU and CPU worker nodes. Each stage produces immutable intermediate artifacts verified through cryptographic checksums.

```mermaid
flowchart TD
    subgraph INGESTION ["Stage 1 & 2: Ingest & Speech Extraction"]
        A["1. Ingest (Source URL / S3 / YouTube)"] --> B["Codec & Container Validation (FFmpeg)"]
        B --> C["Audio Extraction (48kHz Stereo WAV)"]
        C --> D["2. Transcribe (Whisper Large-v3 / WhisperX)"]
        D --> E["Word-Level Timestamps & Diarization"]
    end

    subgraph ANALYSIS ["Stage 3, 4 & 5: Structural & Virality Analysis"]
        E --> F["3. Structural Prosody Analysis<br/>(Acoustic Energy & Pitch Variance)"]
        F --> G["4. Narrative Clip Segmentation<br/>(15s–60s Cohesion Windows)"]
        G --> H["5. Virality Scoring (B-Score Engine)<br/>(Claude 3.5 / DeepSeek: Hook, Value, Emotion)"]
    end

    subgraph CREATIVE_ASSEMBLY ["Stage 6, 7, 8 & 9: Visual & Caption Generation"]
        H --> I["6. Hook Generation<br/>(High-Contrast Opening Cards)"]
        H --> J["7. Smart 9:16 Reframe<br/>(YOLOv8 + MediaPipe Face Tracking)"]
        I & J --> K["8. Animated Karaoke Captions<br/>(Word-Level ASS Bounce & Glow)"]
        K --> L["9. Contextual B-Roll Insertion<br/>(Semantic Cutaways & Punch-Ins)"]
    end

    subgraph AUDIO_RENDER ["Stage 10 & 11: Mastering & GPU Render"]
        L --> M["10. Audio Chain & Ducking<br/>(Silence Trimming & -14 LUFS Mastering)"]
        M --> N["11. Hardware NVENC GPU Render<br/>(1080x1920 H.264 + Cover Generation)"]
        N --> O["Cloud Delivery (BYOB S3 / R2) & Webhook"]
    end
```

---

## Deep Technical Breakdown of All 11 Steps

### Step 1: Ingest & Container Normalization
The ingestion worker fetches the source media, validates container headers, guards against network attacks, and establishes standardized audio-video streams:
- **SSRF & Security Isolation**: The ingestion engine validates source URLs against a strict security policy. Private IPv4/IPv6 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.1`, `169.254.169.254`) are blocked before initiating socket connections, preventing Server-Side Request Forgery against cloud metadata APIs.
- **Protocol & Source Support**: Accepts direct HTTPS URLs, Amazon S3 (`s3://`), Cloudflare R2 (`r2://`), Supabase Storage, and YouTube/Vimeo URLs via integrated `yt-dlp` stream extraction.
- **Normalization**: Source streams are demuxed. Video is probed for corrupted frames and variable frame rates (VFR), normalizing to a fixed 30.0 or 60.0 FPS. Audio is extracted as a uncompressed 48,000 Hz, 24-bit stereo WAV container (`pcm_s24le`).
- **Timeout Ceiling**: 300 seconds default, dynamically scaling for videos exceeding 60 minutes.

### Step 2: High-Precision Transcription & Diarization
Accurate word-level timestamps and speaker identification form the temporal foundation for clipping, caption rendering, and camera cuts:
- **Acoustic Model**: Whisper Large-v3 coupled with WhisperX forced alignment using wav2vec 2.0 phoneme models.
- **Temporal Precision**: Computes precise start and end millisecond timestamps (`start_ms`, `end_ms`) for every single word with an empirical error margin under $\pm 15\text{ ms}$.
- **Speaker Diarization**: Leverages pyannote.audio neural embedding clustering to assign speaker identities (`SPEAKER_00`, `SPEAKER_01`, `SPEAKER_02`) to every transcribed phrase, enabling multi-camera logic.
- **Multilingual Support**: Supports 23 major languages with automatic language identification (LID) and cross-lingual translation capabilities.

### Step 3: Structural Analysis & Prosody Extraction
Raw transcripts lack semantic rhythm. The structural analysis step measures acoustic and linguistic signals to detect natural topic transitions:
- **Prosody Energy Spikes**: Computes root-mean-square (RMS) acoustic energy and fundamental frequency ($F_0$) pitch variance across 100ms sliding windows. High arousal indicates moments of humor, revelation, debate, or intensity.
- **Laughter & Applause Detection**: Pre-trained AudioSet CNN classifiers detect acoustic events (laughter, gasps, applause, background musical swells).
- **Silence & Breathing Boundaries**: Identifies natural pauses ($> 400\text{ ms}$) to prevent cutting clips mid-sentence or chopping trailing syllables.

### Step 4: Narrative Clip Segmentation
Shorts cannot simply be random 30-second video slices; they must function as self-contained mini-narratives:
- **Duration Constraints**: Configurable boundaries (default: minimum 15 seconds, maximum 60 seconds).
- **Narrative Arc Detection**: Analyzes text embeddings to locate complete thought units containing an opening premise, an escalating premise or tension, and a satisfying punchline or resolution.
- **Window Candidate Generation**: Generates 15 to 40 candidate segments per hour of source footage for virality scoring.

### Step 5: Multi-Dimensional Virality Scoring (B-Score)
Candidate clips are evaluated by a specialized multi-modal scoring model (combining Claude 3.5 / DeepSeek reasoning with acoustic metrics) against FOTOhub's proprietary **B-Score (Broadcast Virality Score)**:

$$\text{B-Score} = 0.30 \cdot H + 0.25 \cdot C + 0.20 \cdot E + 0.15 \cdot P + 0.10 \cdot V$$

| Dimension | Weight | Detection Method | Description |
|:---|:---:|:---|:---|
| **Hook Power ($H$)** | 30% | First 3s NLP + Acoustic Pitch Jump | Curiosity gap, provocative statement, controversy, pattern interruption in opening seconds. |
| **Content Value ($C$)** | 25% | LLM Semantic Payoff Evaluation | Standalone insight, actionable tutorial, or revelation that provides immediate viewer utility. |
| **Emotional Impact ($E$)** | 20% | Dynamic Range & Vocal Arousal | Vocal conviction, acoustic laughter, intensity spikes, and emphatic delivery. |
| **Pacing & Energy ($P$)** | 15% | Words Per Minute (WPM) & Dead Air | Penalizes dragging pauses; rewards snappy delivery within the optimal 140–180 WPM window. |
| **Visual Appeal ($V$)** | 10% | Face Landmark Expression | Facial animation, smiling, gesturing, and visual movement detected via computer vision. |

Clips are ranked by B-Score. The engine extracts the top-$k$ highest-scoring candidates based on the requested `max_clips` parameter.

### Step 6: Automated Hook Generation
The first 2.5 seconds dictate whether a user swipes past on TikTok or Instagram Reels. When `hooks: true` is set:
- **Curiosity Gap Copywriting**: Generates punchy opening titles designed for mobile screens (e.g., "The $10M Cloud Mistake Nobody Talks About").
- **Visual Card Overlay**: Compiles a stylized opening graphic card rendered in the top-third or center of the frame during the first 2.0–3.0 seconds.
- **Hook Catalogue Integration**: Selects proven high-retention copy templates (The Negative Hook, The Contrarian Question, The Secret Revelation).

### Step 7: Smart 9:16 Reframe & Multi-Camera Layouts
Horizontally recorded video (16:9 1920x1080) must be intelligently reframed into full-bleed vertical video (9:16 1080x1920):
- **YOLOv8 & MediaPipe Tracking**: Detects facial landmarks and upper body torso bounding boxes on every frame.
- **Cinematic Camera Easing**: A spring-damper easing filter smooths pan movements across frames, eliminating jittery camera jerks when speakers tilt their heads.
- **Multi-Camera Engine**: Supports 4 distinct layout modes (`single`, `stack`, `pip`, `dynamic_cut`) detailed in the layout section below.

### Step 8: Animated Karaoke Captions
Captions are rendered directly into the video stream using custom Advanced SubStation Alpha (`.ass`) tracks:
- **Word-Level Highlighting**: Words illuminate precisely as spoken, using customizable highlight colors (e.g., `#FFDF00` Canary Yellow, `#00FF66` Neon Green).
- **Bounce Keyframe Transformations**: Incorporates ASS vector tags (`\t(\fscx115\fscy115)`) to create dynamic pop-in bounce animations on emphasized keywords.
- **Auto-Inserted Contextual Emojis**: Scans dialogue tokens and inserts high-resolution colored emojis (🔥, 🚀, 💡, 💰, ⚠️) synchronized to keyword timestamps.
- **Typography Presets**: Includes `hormozi` (high-contrast yellow/white uppercase font with heavy black outline), `beasty` (bold green comic styling), `neon` (glowing drop-shadow borders), `clean` (modern Helvetica minimalism), and `typewriter`.

### Step 9: Contextual B-Roll Insertion & Punch-Ins
Monotonous "talking head" footage suffers sharp viewer drop-off after 4 seconds:
- **Semantic Keyword Extraction**: Identifies visual concepts in the transcript (e.g., "cryptocurrency crash", "server farm", "growth graph").
- **Asset Sourcing**: Overlays matching high-resolution 9:16 stock footage, AI-generated generative cutaways, or custom library assets.
- **Punch-In Zooms**: Automatically injects dynamic $1.15\times$ punch-in zoom cuts on energetic sentence transitions to reset viewer visual fatigue.

### Step 10: Broadcast Audio Chain & -14 LUFS Ducking
Mobile viewers demand clear, punchy audio that cuts through ambient phone speaker distortion:
1. **Filler Word Removal**: Detects and cleanly splices out vocal pauses (`um`, `uh`, `er`, `like`) without introducing audible clicks or phase cancellation.
2. **High-Pass Filter**: 80 Hz steep 18dB/octave high-pass filter eliminates room rumble and mechanical mic vibrations.
3. **FFT De-Noiser**: Removes stationary background hiss and HVAC hum (`afftdn=nr=12:nf=-25`).
4. **De-Esser & Compression**: Attenuates harsh 4–8 kHz vocal sibilance and tightens dynamic range.
5. **Background Music Sidechain Ducking**: Injects ambient music tracks that automatically attenuate by `-16 dB` whenever the primary speaker talks, smoothly returning to baseline during pauses.
6. **2-Pass EBU R128 Loudness Normalization**: Targets an integrated loudness of **-14.0 LUFS** ($\pm 0.5$ LU) with a true peak ceiling of $-1.5\text{ dBTP}$, adhering strictly to YouTube Shorts, TikTok, and Meta Reels broadcast delivery standards.

### Step 11: Hardware NVENC GPU Rendering & High-CTR Cover
The final video composition executes on dedicated AWS/GCP GPU worker instances:
- **NVIDIA NVENC H.264 / HEVC**: Hardware-accelerated multi-layer video filtering (`h264_nvenc`) compiles the 1080x1920 video at CRF 18, utilizing NVMM zero-copy memory buffers for fast rendering throughput.
- **High-CTR Cover Generation**: Automatically extracts the single most expressive facial frame from the clip, crops it to 9:16, enhances micro-contrast, and composites a bold headline card, producing an optimized thumbnail (`cover_01.jpg`).

---

## Multi-Camera Layout Engine in Depth

When converting widescreen interviews or group discussions into vertical 9:16 videos, a single static crop often isolates or excludes participants. FOTOhub provides four specialized layout modes:

```mermaid
flowchart LR
    subgraph SINGLE ["1. Single Speaker"]
        direction TB
        S1["[Active Speaker Centered]<br/>1080x1920 Viewport"]
    end

    subgraph STACK ["2. Stack (Split Screen)"]
        direction TB
        ST1["Host (Top 50% - 1080x960)<br/>Active: 100% Brightness"]
        ST2["Guest (Bottom 50% - 1080x960)<br/>Inactive: Dimmed (18% Luminance Attenuation)"]
    end

    subgraph PIP ["3. Picture-in-Picture"]
        direction TB
        P1["Main Presentation / Screen Share (1080x1920 Background)"]
        P2["Floating Circular Host Cutout (320x320 with Drop Shadow)"]
    end

    subgraph DYNAMIC ["4. Dynamic Cut"]
        direction TB
        D1["Speaker A speaking → Show Speaker A"]
        D2["Speaker B responds → Hard Cut to Speaker B (300ms Hysteresis)"]
    end
```

### Layout Specifications

| Layout Mode | Description | Ideal Content Type | Configuration Key |
|:---|:---|:---|:---|
| `single` | Continuously pans and zooms to frame the dominant speaker. | Solo tutorials, single-host vlogs, monologues | `settings.multicam: "single"` |
| `stack` | Splits the vertical frame horizontally: Host in the top 50% (1080x960) and Guest in the bottom 50% (1080x960). Inactive speakers are subtly dimmed (`multicam_dim: 0.18`). | 2-person podcasts, remote interviews, debates | `settings.multicam: "stack"` |
| `pip` | Fullscreen background showing slides, screen recording, or game stream, with a floating 320x320 camera feed. | Software tutorials, gaming streams, keynote slides | `settings.multicam: "pip"` |
| `dynamic_cut` | Executes instantaneous camera cuts to whichever speaker holds the floor, using a 300ms smoothing hysteresis. | Panel discussions, multi-guest talk shows | `settings.multicam: "dynamic"` |

### The `multicam_dim: 0.18` Visual Focus Mechanism
In `stack` split-screen layouts, viewers can become confused when both speakers appear equally prominent while only one is speaking. FOTOhub applies an 18% luminance attenuation ($Y' = 0.82 \cdot Y$) to the inactive participant's crop box. When the guest begins speaking, the engine smoothly transitions the brightness over 8 frames (266ms), naturally guiding the viewer's gaze to the active speaker without distracting cuts.

---

## Real-Time SSE Streaming Progress (`/v1/shorts/clips/{id}/events`)

Rather than polling endpoints in a loop, enterprise integrations can subscribe to real-time Server-Sent Events (SSE) to receive micro-step progress updates, virality scores, and immediate clip ready notifications.

### SSE Stream Endpoint
```http
GET https://apis.fotohub.app/v1/shorts/clips/{job_id}/events
Authorization: Bearer fh_live_your_api_key
Accept: text/event-stream
```

### SSE Event Stream Protocol

```
event: step_started
data: {"job_id":"job_908f0a21","step":"transcribe","label":"Transcribing audio (WhisperX)","progress_pct":12,"timestamp":1788712010}

event: step_progress
data: {"job_id":"job_908f0a21","step":"transcribe","progress_pct":22,"words_processed":3840,"timestamp":1788712025}

event: step_completed
data: {"job_id":"job_908f0a21","step":"transcribe","duration_ms":32100,"timestamp":1788712042}

event: clip_ready
data: {"job_id":"job_908f0a21","clip_id":"clip_3821a9ef","clip_number":1,"total_clips":3,"virality_score":94.2,"video_url":"https://storage.fotohub.app/shorts/job_908f0a21/clip_01.mp4","cover_url":"https://storage.fotohub.app/shorts/job_908f0a21/cover_01.jpg","duration_s":42.6,"title":"Why MicroVMs Beat Containers","timestamp":1788712095}

event: job_completed
data: {"job_id":"job_908f0a21","status":"completed","total_clips":3,"total_runtime_s":135.2,"processing_time_s":84.7,"usd_charged":0.7500,"balance_usd":48.2500,"timestamp":1788712125}
```

---

## Pure USD Prepaid Wallet Billing & Economics

FOTOhub operates on a **pure USD wallet model** (`wallet.available_usd`). All jobs and modular pipeline steps bill strictly against your prepaid USD wallet balance with no synthetic credits, token bundles, or foreign currency adjustments.

### Pricing Structure

| Service Item | USD Price | Metering Scope | Technical Description |
|:---|:---:|:---|:---|
| **Full Clipping Job (`shorts_clip_job`)** | **$0.75 / job** | Up to 60-min input video, yields up to 30 clips | Complete 11-step end-to-end pipeline execution |
| **Ingest Step (`shorts_ingest`)** | $0.05 / request | Container decode & audio extraction | Demuxing and 48kHz audio normalization |
| **WhisperX Transcribe (`shorts_transcribe`)** | $0.05 / request | Up to 15 min audio | Word-level timestamps and diarization |
| **Scene Detection (`shorts_detect_scenes`)** | $0.08 / request | Video shot boundary detection | Visual scene transition extraction |
| **Clip Generation (`shorts_generate_clips`)**| $0.12 / request | AI narrative & virality scoring | Claude 3.5 / DeepSeek B-Score analysis |
| **Karaoke Captions (`shorts_captions`)** | $0.05 / request | ASS subtitle track compilation | Word bounce keyframe generation |
| **Smart Reframe (`shorts_reframe`)** | $0.08 / request | Face tracking & 9:16 viewport crop | YOLOv8 + MediaPipe camera path |
| **GPU Render (`shorts_render`)** | $0.12 / request | Hardware NVENC video composition | 1080x1920 MP4 export |
| **Audio Chain (`shorts_audio`)** | $0.05 / request | DSP filtering & -14 LUFS ducking | De-ess, compress, sidechain ducking |
| **B-Roll Sourcing (`shorts_broll`)** | $0.10 / request | Semantic cutaway overlays | Transcript concept matching |
| **High-CTR Cover (`shorts_cover`)** | $0.05 / request | Neural facial expression thumbnail | High-contrast title card thumbnail |

### Unit Economics Comparison
- **A typical 60-minute podcast processed into 5 viral shorts** costs **$0.75 USD total**, which equals **$0.15 USD per published short**.
- In comparison, manual video editor agencies charge between **$25.00 and $60.00 USD per short** with a 48-hour delivery turnaround. FOTOhub renders all 5 clips in under 90 seconds.

---

## Unified Job Submission Implementation

Submit an entire long-form video to the Shorts Engine using the unified `POST /v1/shorts/clips` endpoint.

::: code-group

```python [Python]
"""
FOTOhub Shorts Engine: Submit an asynchronous 11-stage clipping job.
Configures 9:16 reframe, stack multicam, karaoke captions, and signed webhooks.
"""

import os
import requests
from typing import Dict, Any

API_KEY = os.environ.get("FOTOHUB_API_KEY", "fh_live_sample_key_9021")
BASE_URL = "https://apis.fotohub.app"

def submit_viral_shorts_job(video_url: str) -> Dict[str, Any]:
    payload = {
        "source_url": video_url,
        "title": "Scaling AI Infrastructure to 10M Users",
        "max_clips": 3,
        "min_duration": 20,
        "max_duration": 60,
        "aspect_ratio": "9:16",
        "caption_style": "karaoke",
        "captions": True,
        "reframe": True,
        "hooks": True,
        "covers": True,
        "broll": True,
        "enhance_audio": True,
        "remove_filler": True,
        "retention_model": True,
        "webhook_url": "https://api.mybrand.com/webhooks/fotohub",
        "webhook_secret": "whsec_live_production_secret_9981",
        "reference": "podcast_ep_104_batch",
        "settings": {
            "multicam": "stack",
            "multicam_dim": 0.18,
            "caption_highlight_color": "#FFDF00",
            "audio": {
                "target_lufs": -14.0,
                "denoise": True
            }
        }
    }

    resp = requests.post(
        f"{BASE_URL}/v1/shorts/clips",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json=payload,
        timeout=30
    )
    resp.raise_for_status()
    data = resp.json()

    print(f"Clipping Job Submitted: {data['job_id']}")
    print(f"Status: {data['status']}")
    print(f"USD Charged: ${data.get('charged_usd', 0.75):.2f} USD | Remaining Balance: ${data.get('user_balance_usd', 0):.2f} USD")
    return data

if __name__ == "__main__":
    submit_viral_shorts_job("https://storage.fotohub.app/raw/podcast_ep104.mp4")
```

```typescript [TypeScript]
/**
 * FOTOhub Shorts Engine: Submit an asynchronous clipping job in TypeScript.
 */

interface ClippingJobResponse {
  job_id: string;
  operation: string;
  status: string;
  charged_usd: number;
  user_balance_usd: number;
  progress_pct: number;
  created_at: string;
}

const API_KEY = process.env.FOTOHUB_API_KEY || "fh_live_sample_key_9021";
const BASE_URL = "https://apis.fotohub.app";

async function dispatchShortsJob(videoUrl: string): Promise<ClippingJobResponse> {
  const response = await fetch(`${BASE_URL}/v1/shorts/clips`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_url: videoUrl,
      title: "Keynote AI Highlights 2026",
      max_clips: 3,
      min_duration: 20,
      max_duration: 60,
      aspect_ratio: "9:16",
      caption_style: "karaoke",
      captions: true,
      reframe: true,
      hooks: true,
      covers: true,
      broll: true,
      enhance_audio: true,
      remove_filler: true,
      retention_model: true,
      webhook_url: "https://api.mybrand.com/webhooks/fotohub",
      webhook_secret: "whsec_live_production_secret_9981",
      settings: {
        multicam: "stack",
        multicam_dim: 0.18,
        caption_highlight_color: "#FFDF00",
        audio: { target_lufs: -14.0, denoise: true },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`API error (${response.status}): ${await response.text()}`);
  }

  const data: ClippingJobResponse = await response.json();
  console.log(`[Job Queued] ID: ${data.job_id} | USD Charged: $${data.charged_usd} | Balance: $${data.user_balance_usd} USD`);
  return data;
}

dispatchShortsJob("https://storage.fotohub.app/raw/podcast_ep104.mp4").catch(console.error);
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

type ClippingResponse struct {
	JobID          string  `json:"job_id"`
	Operation      string  `json:"operation"`
	Status         string  `json:"status"`
	ChargedUSD     float64 `json:"charged_usd"`
	UserBalanceUSD float64 `json:"user_balance_usd"`
}

func main() {
	payload := map[string]interface{}{
		"source_url":      "https://storage.fotohub.app/raw/podcast_ep104.mp4",
		"title":           "AI Cloud Economics 2026",
		"max_clips":       3,
		"min_duration":    20,
		"max_duration":    60,
		"aspect_ratio":    "9:16",
		"caption_style":   "karaoke",
		"captions":        true,
		"reframe":         true,
		"hooks":           true,
		"covers":          true,
		"broll":           true,
		"enhance_audio":   true,
		"remove_filler":   true,
		"retention_model": true,
		"webhook_url":     "https://api.mybrand.com/webhooks/fotohub",
		"webhook_secret":  "whsec_live_production_secret_9981",
		"settings": map[string]interface{}{
			"multicam":     "stack",
			"multicam_dim": 0.18,
			"audio": map[string]interface{}{
				"target_lufs": -14.0,
				"denoise":     true,
			},
		},
	}

	b, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/shorts/clips", bytes.NewBuffer(b))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	var res ClippingResponse
	json.Unmarshal(respBytes, &res)

	fmt.Printf("[✓] Clipping Job Dispatched: %s (Charged: $%.2f USD | Balance: $%.2f USD)\n",
		res.JobID, res.ChargedUSD, res.UserBalanceUSD)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/shorts/clips \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source_url": "https://storage.fotohub.app/raw/podcast_ep104.mp4",
    "title": "AI Cloud Economics 2026",
    "max_clips": 3,
    "min_duration": 20,
    "max_duration": 60,
    "aspect_ratio": "9:16",
    "caption_style": "karaoke",
    "captions": true,
    "reframe": true,
    "hooks": true,
    "covers": true,
    "broll": true,
    "enhance_audio": true,
    "remove_filler": true,
    "retention_model": true,
    "webhook_url": "https://api.mybrand.com/webhooks/fotohub",
    "webhook_secret": "whsec_live_production_secret_9981",
    "settings": {
      "multicam": "stack",
      "multicam_dim": 0.18,
      "caption_highlight_color": "#FFDF00",
      "audio": {
        "target_lufs": -14.0,
        "denoise": true
      }
    }
  }'
```

:::

---

## Real-Time SSE Progress Consumer Implementation

Consume real-time SSE stream events from `/v1/shorts/clips/{id}/events` to render live progress bars and receive individual clips as they finish rendering.

::: code-group

```python [Python]
"""
FOTOhub SSE Progress Consumer using httpx.
Streams real-time clipping milestones and clip_ready events.
"""

import os
import json
import httpx

API_KEY = os.environ.get("FOTOHUB_API_KEY", "fh_live_sample_key_9021")
JOB_ID = "job_908f0a21"
SSE_URL = f"https://apis.fotohub.app/v1/shorts/clips/{JOB_ID}/events"

def stream_job_events():
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "text/event-stream"
    }

    with httpx.stream("GET", SSE_URL, headers=headers, timeout=900) as response:
        print(f"Connected to SSE stream for job: {JOB_ID}\n")
        current_event = None

        for line in response.iter_lines():
            line = line.strip()
            if not line:
                continue

            if line.startswith("event:"):
                current_event = line.replace("event:", "").strip()
            elif line.startswith("data:"):
                data_str = line.replace("data:", "").strip()
                payload = json.loads(data_str)

                if current_event == "step_started":
                    print(f"▶ [Stage Started] {payload['step']}: {payload['label']} ({payload['progress_pct']}%)")
                elif current_event == "step_progress":
                    print(f"  ... [{payload['step']}] Progress: {payload['progress_pct']}%")
                elif current_event == "clip_ready":
                    print(f"\n★ [Clip Ready!] Clip #{payload['clip_number']}: '{payload['title']}'")
                    print(f"   Virality Score: {payload['virality_score']}/100")
                    print(f"   Video URL: {payload['video_url']}")
                    print(f"   Cover URL: {payload['cover_url']}\n")
                elif current_event == "job_completed":
                    print(f"✔ [Job Complete] Billed: ${payload['usd_charged']:.2f} USD | Remaining Balance: ${payload['balance_usd']:.2f} USD")
                    break

if __name__ == "__main__":
    stream_job_events()
```

```typescript [TypeScript]
/**
 * FOTOhub SSE Progress Consumer in TypeScript / Node.js.
 * Uses eventsource or fetch streaming to handle real-time pipeline events.
 */

import EventSource from "eventsource";

const API_KEY = process.env.FOTOHUB_API_KEY || "fh_live_sample_key_9021";
const JOB_ID = "job_908f0a21";
const SSE_URL = `https://apis.fotohub.app/v1/shorts/clips/${JOB_ID}/events`;

const es = new EventSource(SSE_URL, {
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    Accept: "text/event-stream",
  },
});

es.addEventListener("step_started", (e: any) => {
  const data = JSON.parse(e.data);
  console.log(`▶ Step Started: ${data.step} (${data.progress_pct}%) - ${data.label}`);
});

es.addEventListener("clip_ready", (e: any) => {
  const clip = JSON.parse(e.data);
  console.log(`★ Clip ${clip.clip_number} Ready! Score: ${clip.virality_score}`);
  console.log(`  URL: ${clip.video_url}`);
});

es.addEventListener("job_completed", (e: any) => {
  const summary = JSON.parse(e.data);
  console.log(`✔ All Clips Rendered! Charged: $${summary.usd_charged} USD`);
  es.close();
});

es.onerror = (err) => {
  console.error("SSE connection error:", err);
  es.close();
};
```

```go [Go]
package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
)

func main() {
	jobID := "job_908f0a21"
	url := fmt.Sprintf("https://apis.fotohub.app/v1/shorts/clips/%s/events", jobID)

	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
	req.Header.Set("Accept", "text/event-stream")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	reader := bufio.NewReader(resp.Body)
	var currentEvent string

	fmt.Printf("Streaming SSE progress for job %s...\n", jobID)
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			break
		}
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		if strings.HasPrefix(line, "event:") {
			currentEvent = strings.TrimSpace(strings.TrimPrefix(line, "event:"))
		} else if strings.HasPrefix(line, "data:") {
			dataStr := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
			var payload map[string]interface{}
			json.Unmarshal([]byte(dataStr), &payload)

			switch currentEvent {
			case "step_started":
				fmt.Printf("▶ Step Started: %s (Progress: %.0f%%)\n", payload["step"], payload["progress_pct"])
			case "clip_ready":
				fmt.Printf("★ Clip Ready! Score: %.1f | URL: %s\n", payload["virality_score"], payload["video_url"])
			case "job_completed":
				fmt.Printf("✔ Job Completed! Charged: $%.2f USD\n", payload["usd_charged"])
				return
			}
		}
	}
}
```

```bash [cURL]
curl -N -H "Authorization: Bearer $FOTOHUB_API_KEY" \
     -H "Accept: text/event-stream" \
     https://apis.fotohub.app/v1/shorts/clips/job_908f0a21/events
```

:::

---

## Modular Step-by-Step Pipeline REST API (`/v1/shorts/*`)

For custom orchestration architectures where you manage your own database, state machine, or workflow engine (e.g., Temporal, AWS Step Functions), FOTOhub exposes stateless REST endpoints for each step of the pipeline.

::: code-group

```python [Python]
"""
FOTOhub Modular Pipeline: Call individual REST steps in sequence.
"""

import os
import requests

API_KEY = os.environ["FOTOHUB_API_KEY"]
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# 1. Ingest
ingest_res = requests.post(
    "https://apis.fotohub.app/v1/shorts/ingest",
    headers=HEADERS,
    json={"video_url": "https://storage.fotohub.app/raw/keynote.mp4"}
).json()
print("Ingest:", ingest_res["operation"], f"USD Charged: ${ingest_res.get('usd_charged', 0.05)}")

# 2. Transcribe
trans_res = requests.post(
    "https://apis.fotohub.app/v1/shorts/transcribe",
    headers=HEADERS,
    json={"video_url": ingest_res["normalized_url"], "language": "en"}
).json()

# 3. Smart Reframe (9:16)
reframe_res = requests.post(
    "https://apis.fotohub.app/v1/shorts/reframe",
    headers=HEADERS,
    json={"video_url": ingest_res["normalized_url"], "aspect_ratio": "9:16", "mode": "stack"}
).json()

# 4. Render
render_res = requests.post(
    "https://apis.fotohub.app/v1/shorts/render",
    headers=HEADERS,
    json={"video_url": reframe_res["reframed_url"], "captions_url": trans_res["captions_url"]}
).json()
print("Final Render URL:", render_res["video_url"])
```

```typescript [TypeScript]
const API_KEY = process.env.FOTOHUB_API_KEY!;
const headers = { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" };

// 1. Ingest
const ingestRes = await fetch("https://apis.fotohub.app/v1/shorts/ingest", {
  method: "POST",
  headers,
  body: JSON.stringify({ video_url: "https://storage.fotohub.app/raw/interview.mp4" }),
});
const ingestData = await ingestRes.json();

// 2. Transcribe
const transRes = await fetch("https://apis.fotohub.app/v1/shorts/transcribe", {
  method: "POST",
  headers,
  body: JSON.stringify({ video_url: ingestData.normalized_url }),
});
const transData = await transRes.json();
console.log("Transcribed Words:", transData.words?.length);
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
	payload, _ := json.Marshal(map[string]string{
		"video_url": "https://storage.fotohub.app/raw/keynote.mp4",
	})
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/shorts/ingest", bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Ingest Step Output:", string(body))
}
```

```bash [cURL]
# Call Ingest Step
curl -X POST https://apis.fotohub.app/v1/shorts/ingest \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"video_url":"https://storage.fotohub.app/raw/podcast.mp4"}'
```

:::

---

## Production Webhook Notification & Signature Verification

FOTOhub delivers real-time notifications for both individual clip completions and overall project finishes. Every webhook request includes cryptographic signatures in the `X-FotoHub-Signature` header.

### Event: `shorts.clip.rendered`
Dispatched whenever an individual vertical short completes hardware GPU rendering:

```json
{
  "event": "shorts.clip.rendered",
  "timestamp": 1788712095,
  "job_id": "job_908f0a21",
  "reference": "podcast_ep_104_batch",
  "data": {
    "clip_id": "clip_3821a9ef",
    "clip_number": 1,
    "total_clips": 3,
    "virality_score": 94.2,
    "score_breakdown": {
      "hook_power": 98.0,
      "content_value": 95.0,
      "emotional_impact": 92.0,
      "pacing_energy": 91.0,
      "visual_appeal": 89.0
    },
    "title": "Why MicroVMs Beat Containers for Security",
    "hook": "Stop running untrusted customer code in shared Docker containers.",
    "duration_s": 42.6,
    "aspect_ratio": "9:16",
    "video_url": "https://storage.fotohub.app/shorts/job_908f0a21/clip_01.mp4",
    "cover_url": "https://storage.fotohub.app/shorts/job_908f0a21/cover_01.jpg",
    "predicted_retention_pct": 88.5
  }
}
```

### Event: `shorts.job.completed`
Dispatched when all requested clips for the source video have finished:

```json
{
  "event": "shorts.job.completed",
  "timestamp": 1788712125,
  "job_id": "job_908f0a21",
  "reference": "podcast_ep_104_batch",
  "data": {
    "total_clips": 3,
    "total_runtime_s": 135.2,
    "processing_time_s": 84.7,
    "billing": {
      "usd_charged": 0.7500,
      "balance_usd": 48.2500,
      "currency": "USD"
    },
    "clips": [
      {
        "clip_id": "clip_3821a9ef",
        "score": 94.2,
        "video_url": "https://storage.fotohub.app/shorts/job_908f0a21/clip_01.mp4"
      },
      {
        "clip_id": "clip_99a80b12",
        "score": 87.5,
        "video_url": "https://storage.fotohub.app/shorts/job_908f0a21/clip_02.mp4"
      },
      {
        "clip_id": "clip_12d45c88",
        "score": 82.1,
        "video_url": "https://storage.fotohub.app/shorts/job_908f0a21/clip_03.mp4"
      }
    ]
  }
}
```

### Webhook Verification Implementations

::: code-group

```python [Python (FastAPI)]
"""
Production FastAPI Webhook Receiver verifying X-FotoHub-Signature with HMAC-SHA256.
"""

import hmac
import hashlib
import time
from fastapi import FastAPI, Request, HTTPException, Header

app = FastAPI()
WEBHOOK_SECRET = "whsec_live_production_secret_9981"

@app.post("/webhooks/fotohub")
async def receive_shorts_webhook(
    request: Request,
    x_fotohub_signature: str = Header(..., alias="X-FotoHub-Signature"),
    x_fotohub_timestamp: int = Header(..., alias="X-FotoHub-Timestamp")
):
    # 1. Replay attack validation (300s window)
    if abs(int(time.time()) - x_fotohub_timestamp) > 300:
        raise HTTPException(status_code=400, detail="Timestamp expired")

    # 2. Extract raw body buffer
    raw_body = await request.body()

    # 3. Compute expected signature
    signed_payload = f"{x_fotohub_timestamp}.".encode("utf-8") + raw_body
    expected_sig = hmac.new(
        WEBHOOK_SECRET.encode("utf-8"),
        signed_payload,
        hashlib.sha256
    ).hexdigest()

    # 4. Constant-time comparison
    if not hmac.compare_digest(expected_sig, x_fotohub_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()
    event_type = payload.get("event")

    if event_type == "shorts.clip.rendered":
        clip = payload["data"]
        print(f"[Webhook] Clip Ready: '{clip['title']}' (Score: {clip['virality_score']})")
        print(f"  Video URL: {clip['video_url']}")
        # Schedule auto-publishing to TikTok / Reels

    elif event_type == "shorts.job.completed":
        summary = payload["data"]
        print(f"[Webhook] Job {payload['job_id']} Finished: {summary['total_clips']} clips produced.")
        print(f"  USD Charged: ${summary['billing']['usd_charged']:.2f} USD")

    return {"status": "ok"}
```

```typescript [TypeScript (Express / Next.js)]
/**
 * Production Node.js Webhook Receiver verifying X-FotoHub-Signature.
 */

import express, { Request, Response } from "express";
import crypto from "crypto";

const app = express();
const WEBHOOK_SECRET = "whsec_live_production_secret_9981";

app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

app.post("/webhooks/fotohub", (req: Request, res: Response) => {
  const signature = req.headers["x-fotohub-signature"] as string;
  const timestampHeader = req.headers["x-fotohub-timestamp"] as string;

  if (!signature || !timestampHeader) {
    return res.status(400).send("Missing signature headers");
  }

  const timestamp = parseInt(timestampHeader, 10);
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) {
    return res.status(400).send("Timestamp drift > 300s");
  }

  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  hmac.update(`${timestamp}.`);
  hmac.update((req as any).rawBody);
  const expectedSig = hmac.digest("hex");

  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expectedSig, "hex");

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return res.status(401).send("Invalid signature");
  }

  const { event, job_id, data } = req.body;
  if (event === "shorts.clip.rendered") {
    console.log(`[Clip Rendered] ${data.title} -> ${data.video_url}`);
  } else if (event === "shorts.job.completed") {
    console.log(`[Job Completed] ${job_id} -> USD Charged: $${data.billing.usd_charged} USD`);
  }

  return res.status(200).json({ received: true });
});

app.listen(3000, () => console.log("Shorts webhook listener on port 3000"));
```

:::

---

## Production Node.js Worker Pool & Batch Pipeline

For publishers processing hundreds of long-form videos per week, this production script orchestrates a concurrent worker pool, submits jobs, monitors progress, and downloads finished vertical videos to a local output directory.

```typescript
/**
 * Production Batch Shorts Processor with Concurrency Control & Auto-Download.
 */

import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const API_KEY = process.env.FOTOHUB_API_KEY!;
const BASE_URL = "https://apis.fotohub.app";
const CONCURRENCY_LIMIT = 3;

interface VideoTask {
  sourceUrl: string;
  title: string;
}

const queue: VideoTask[] = [
  { sourceUrl: "https://storage.fotohub.app/raw/podcast_ep101.mp4", title: "Ep 101 - AI Agents" },
  { sourceUrl: "https://storage.fotohub.app/raw/podcast_ep102.mp4", title: "Ep 102 - GPU Clusters" },
  { sourceUrl: "https://storage.fotohub.app/raw/podcast_ep103.mp4", title: "Ep 103 - MicroVMs" },
];

async function downloadFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(destPath);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
}

async function processVideo(task: VideoTask) {
  console.log(`[Starting Task] ${task.title}...`);

  // 1. Submit Job
  const submitRes = await fetch(`${BASE_URL}/v1/shorts/clips`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_url: task.sourceUrl,
      title: task.title,
      max_clips: 3,
      aspect_ratio: "9:16",
      caption_style: "hormozi",
      captions: true,
      reframe: true,
      settings: { multicam: "stack", multicam_dim: 0.18 }
    }),
  });

  const job = await submitRes.json();
  const jobId = job.job_id;
  console.log(`[Job Dispatched] ID: ${jobId} for ${task.title}`);

  // 2. Poll for Completion
  while (true) {
    await new Promise((r) => setTimeout(r, 6000));
    const statusRes = await fetch(`${BASE_URL}/v1/shorts/clips/${jobId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const status = await statusRes.json();

    if (status.status === "completed") {
      console.log(`[Job Succeeded] ${task.title}: ${status.clips.length} clips ready.`);
      const outDir = path.join(process.cwd(), "downloads", jobId);
      fs.mkdirSync(outDir, { recursive: true });

      for (const clip of status.clips) {
        const dest = path.join(outDir, `${clip.clip_id}.mp4`);
        console.log(`  Downloading ${clip.title} to ${dest}...`);
        await downloadFile(clip.video_url, dest);
      }
      break;
    }

    if (status.status === "failed") {
      console.error(`[Job Failed] ${task.title}: ${status.error}`);
      break;
    }
  }
}

async function runWorkerPool() {
  const pool: Promise<void>[] = [];
  for (const item of queue) {
    const promise = processVideo(item).then(() => {
      pool.splice(pool.indexOf(promise), 1);
    });
    pool.push(promise);
    if (pool.length >= CONCURRENCY_LIMIT) {
      await Promise.race(pool);
    }
  }
  await Promise.all(pool);
  console.log("All batch video clipping tasks completed successfully!");
}

runWorkerPool().catch(console.error);
```

---

## Viewer Retention Modeling & Feedback Loop

The Shorts Engine contains an integrated **Retention Modeling Engine** (`PipelineStep: retention`). Before initiating the final hardware GPU render, the engine predicts the second-by-second viewer drop-off curve for the candidate edit:

```mermaid
flowchart LR
    A["Proposed Edit Plan<br/>(Captions, Pacing, Cuts)"] --> B["Retention Predictive Model<br/>(Trained on 10M+ Shorts)"]
    B --> C{"Predicted Drop-Off Spike<br/>at Second 00:08?"}
    C -->|Yes| D["Auto-Inject Visual Pattern Interrupt<br/>(1.15x Punch-In Zoom + Emoji Pop)"]
    C -->|No| E["Proceed Directly to NVENC GPU Render"]
    D --> E
```

### The Drop-Off Correction Cycle
1. **Pacing Lull Detection**: If a speaker takes $> 600\text{ ms}$ between words or delivers a monotone segment, the retention model predicts a $>12\%$ drop-off probability.
2. **Automated Interruption**: The edit plan automatically schedules an ASS bounce keyframe, an active B-roll cutaway, or a camera punch-in zoom exactly 0.5 seconds before the predicted lull.
3. **Pacing Tightening**: Trims trailing silence by up to 150ms per phrase without modifying pitch.

---

## Parameter Reference Table

### `POST /v1/shorts/clips`

| Parameter | Type | Required | Default | Allowed Values | Description |
|:---|:---:|:---:|:---:|:---|:---|
| `source_url` | string | Yes | — | HTTP, HTTPS, S3, R2, YouTube URL | Source video file or stream (max 2048 chars). |
| `title` | string | No | Auto | String (max 200 chars) | Project title for dashboard indexing. |
| `language` | string | No | Auto | ISO language code (`en`, `es`, `de`, `fr`, etc.) | Source audio spoken language. |
| `max_clips` | int | No | `10` | `1` – `30` | Maximum number of viral shorts to extract and render. |
| `min_duration` | int | No | `15` | `5` – `180` | Minimum duration in seconds for candidate clips. |
| `max_duration` | int | No | `60` | `10` – `300` | Maximum duration in seconds for candidate clips. |
| `aspect_ratio` | string | No | `"9:16"` | `"9:16"`, `"1:1"`, `"4:5"`, `"16:9"` | Target visual aspect ratio for final renders. |
| `caption_style` | string | No | `"hormozi"` | `"hormozi"`, `"beasty"`, `"clean"`, `"karaoke"`, `"neon"`, `"typewriter"`, `"bold"`, `"none"` | Typography and animation preset for subtitles. |
| `captions` | bool | No | `true` | `true`, `false` | Enable or disable burn-in karaoke captions. |
| `reframe` | bool | No | `true` | `true`, `false` | Enable or disable intelligent face-tracking crop. |
| `hooks` | bool | No | `true` | `true`, `false` | Generate high-contrast opening hook title cards. |
| `covers` | bool | No | `true` | `true`, `false` | Generate high-CTR thumbnail cover images. |
| `broll` | bool | No | `false` | `true`, `false` | Automatically source and overlay contextual B-roll footage. |
| `enhance_audio` | bool | No | `true` | `true`, `false` | Apply noise removal, EQ, compression, and -14 LUFS mastering. |
| `remove_filler` | bool | No | `true` | `true`, `false` | Detect and cleanly remove vocal filler pauses (`um`, `uh`). |
| `retention_model`| bool | No | `true` | `true`, `false` | Run retention predictive modeling to insert pattern interrupts. |
| `webhook_url` | string | No | `null` | Valid HTTPS URL | Webhook endpoint for completion notifications. |
| `webhook_secret` | string | No | `null` | String (8–256 chars) | Secret used to sign `X-FotoHub-Signature`. |
| `reference` | string | No | `null` | String (max 200 chars) | Customer identifier echoed back in all payloads. |
| `settings.multicam` | string | No | `"single"` | `"single"`, `"stack"`, `"pip"`, `"dynamic"` | Multi-camera framing mode for multi-person footage. |
| `settings.multicam_dim` | float | No | `0.18` | `0.00` – `0.50` | Luminance attenuation percentage applied to inactive speakers in `stack` mode. |
| `settings.caption_highlight_color` | string | No | `"#FFDF00"` | Hex color string | Active word highlight color in karaoke subtitles. |
| `settings.audio.target_lufs` | float | No | `-14.0` | `-24.0` – `-10.0` | Integrated loudness target according to EBU R128. |
| `settings.audio.denoise` | bool | No | `true` | `true`, `false` | Enable FFT background noise suppression. |

---

## Failure Recovery & Operational Best Practices

### 1. High-Noise Audio Handling
If the source video was recorded in an echoey conference hall or windy exterior:
- Set `settings.audio.denoise: true` in your job request.
- The pipeline applies a multi-stage noise gate and spectral subtraction pass before WhisperX runs, preventing transcription degradation.

### 2. Extreme Crowd / Multi-Person Clutter
In panel discussions with 5 or more on-screen people:
- Use `settings.multicam: "dynamic"` rather than `stack`. Dynamic cutting tracks whichever speaker exceeds speech probability thresholds without overcrowding vertical screen space.

### 3. Webhook Delivery Failures & Retries
- FOTOhub retries failed webhook deliveries up to 5 times with exponential backoff (10s, 30s, 2m, 10m, 30m) upon receiving non-2xx responses.
- Always implement idempotency checks on `payload.data.clip_id` to prevent duplicate processing.
