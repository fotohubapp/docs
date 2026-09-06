# Long-Form Podcast to Viral Shorts Studio

Transform 60-minute podcast episodes, interview streams, and YouTube webinars into ready-to-publish vertical viral shorts (TikTok, Instagram Reels, YouTube Shorts) with automated multi-speaker tracking, virality scoring, animated karaoke captions, and broadcast-grade audio mastering.

This recipe leverages FotoHUB's **Shorts Engine** (`server/shorts-engine/`), coordinating Whisper Large-v3 timestamped transcription, Claude 3.5 / DeepSeek virality scoring, computer-vision face tracking with multi-speaker split layouts, semantic B-roll cutaway insertion, and 2-pass EBU R128 loudness normalization (-14 LUFS).

---

## Production Architecture

```mermaid
flowchart TD
    A["1. Long-Form Ingest<br/>(YouTube URL / S3 60-min MP4)"] --> B["2. Whisper Large-v3 Transcription<br/>(Word-level start_ms, end_ms, speaker_id)"]
    B --> C["3. Acoustic Prosody & Topic Analysis<br/>(Arousal spikes, speaker turn-taking)"]
    C --> D["4. Virality Scoring (B-Score)<br/>(Claude 3.5 / DeepSeek: Hook, Value, Emotion)"]
    D --> E["5. Top Clip Extraction<br/>(15s–60s narrative units with payoffs)"]
    E --> F["6. 9:16 Face-Tracking & Multi-Cam<br/>(Auto camera cut or Stacked Split with dimming)"]
    F --> G["7. Word-by-Word Karaoke Captions<br/>(Dynamic ASS glow, bounce & emojis)"]
    G --> H["8. Contextual B-Roll Overlay<br/>(Transcript-triggered cutaways)"]
    H --> I["9. Audio Chain & -14 LUFS Normalization<br/>(De-noise, De-ess, Compress, EBU R128)"]
    I --> J["10. NVENC GPU Render & Cover Thumbnails<br/>(1080x1920 MP4 + high-CTR cover cards)"]
```

---

## Core Pipeline Capabilities

### 1. High-Precision Whisper Large-v3 Transcription
Audio is demuxed and transcribed with word-level boundary detection. The acoustic model outputs:
- Normalized millisecond timestamps (`start_ms`, `end_ms`).
- Word confidence scores.
- Diarization tags separating host (`SPEAKER_00`) from guest (`SPEAKER_01`).

### 2. Multi-Dimensional Virality Scoring (B-Score)
Rather than guessing solely from text, FotoHUB combines acoustic prosody measurements with Claude 3.5 / DeepSeek narrative evaluations across 5 weighted dimensions:

$$\text{B-Score} = 0.30 \cdot H + 0.25 \cdot V + 0.20 \cdot E + 0.15 \cdot P + 0.10 \cdot A$$

| Dimension | Weight | Detection Method | Description |
|:---|:---:|:---|:---|
| **Hook Power ($H$)** | 30% | First 3s NLP + Acoustic Pitch | Provocative opening query, controversy, hook words (`secret`, `mistake`, `truth`, `never`). |
| **Content Value ($V$)** | 25% | Claude 3.5 Semantic Analysis | Standalone insight or takeaway that delivers a clear payoff without needing the full episode. |
| **Emotional Impact ($E$)** | 20% | Prosody Energy & Arousal | Voice dynamic range, laughing, vocal conviction, and intensity peaks. |
| **Pacing & Energy ($P$)** | 15% | Words-per-minute & Pause Ratios | Eliminates dead air and drags, targeting optimal 140–180 WPM tempo. |
| **Visual Appeal ($A$)** | 10% | Landmark Expression Score | Engaged facial expressions and body language cues. |

### 3. Multi-Speaker Reframe & Multicam Layouts
When two or more people speak in a landscape frame, the engine provides two reframing strategies:
- **`stack` (Split Screen)**: Stacks Host on top and Guest on bottom in a 9:16 viewport. Inactive speakers are subtly dimmed (`dim_inactive: 0.18`) so the viewer's gaze automatically tracks the active speaker.
- **`dynamic` (Active Speaker Switch)**: Seamless camera cuts panning to whoever holds the floor with smoothing easing algorithms.

### 4. Broadcast Audio Chain & -14 LUFS Normalization
To conform to TikTok, YouTube, and Instagram loudness standards, audio passes through an 8-stage DSP pipeline:
1. **High-Pass Filter**: 80 Hz cutoff removes rumble and mic handling noise.
2. **FFT Denoiser**: `afftdn=nr=12:nf=-25` scrubs room hiss.
3. **Noise Gate**: `agate=threshold=0.01:ratio=10` removes breathing artifacts.
4. **De-Esser**: `firequalizer` attenuates 4–9 kHz sibilance.
5. **Compressor**: `acompressor=threshold=-20dB:ratio=4:makeup=2` tightens dynamic range.
6. **Presence EQ**: Boosts 2–5 kHz for vocal intelligibility on mobile phone speakers.
7. **Brickwall Limiter**: Caps peaks at -0.95 dBFS to eliminate digital clipping.
8. **2-Pass EBU R128 Loudness**: Targets integrated **-14 LUFS** with $\le -1.5\text{ dBTP}$ true peak.

---

## API Request & Response Specification

### Asynchronous Clipping Job Submission

Submit a full 60-minute podcast via `POST /v1/shorts/clips`. The request returns immediately with HTTP `202 Accepted` and executes asynchronously on GPU1.

```http
POST https://apis.fotohub.app/v1/shorts/clips
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json

{
  "source_url": "https://storage.fotohub.app/raw/tech_podcast_ep104.mp4",
  "source_type": "url",
  "title": "All-In Podcast Ep 104 AI Economics",
  "language": "en",
  "max_clips": 5,
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
  "webhook_url": "https://api.yourdomain.com/webhooks/fotohub",
  "webhook_secret": "whsec_79a8bc43f9012d4e8",
  "reference": "podcast_ep104_batch",
  "settings": {
    "multicam": "stack",
    "multicam_dim": 0.18,
    "caption_highlight_color": "#FFDF00",
    "audio": {
      "target_lufs": -14.0,
      "denoise": true
    }
  }
}
```

#### Synchronous Response (HTTP 202)

```json
{
  "operation": "clip_job",
  "charged_usd": 0.75,
  "user_balance_usd": 48.25,
  "job_id": "job_948a01bf28",
  "status": "processing",
  "progress_pct": 5,
  "created_at": "2026-09-06T16:15:00Z"
}
```

---

## Webhook Notifications

FotoHUB signs webhook payloads using HMAC-SHA256 in the `X-FotoHub-Signature` header. Listen for these events:

### Event: `shorts.clip.rendered`

Fired sequentially as each individual viral short finishes rendering:

```json
{
  "event": "shorts.clip.rendered",
  "timestamp": "2026-09-06T16:18:22Z",
  "job_id": "job_948a01bf28",
  "reference": "podcast_ep104_batch",
  "data": {
    "clip_id": "clip_78a1bc09",
    "virality_score": 93.5,
    "score_breakdown": {
      "hook_power": 96,
      "content_value": 94,
      "emotional_impact": 91,
      "pacing_energy": 90,
      "visual_appeal": 88
    },
    "title": "Why Autonomous AI Agents Will Replace Middle Management",
    "hook": "Stop hiring managers for tasks software can execute in 3 seconds.",
    "duration_s": 44.8,
    "timestamps": { "start_ms": 742000, "end_ms": 786800 },
    "video_url": "https://storage.fotohub.app/shorts/job_948a01bf28/clip_01_9x16.mp4",
    "cover_url": "https://storage.fotohub.app/shorts/job_948a01bf28/cover_01.jpg",
    "metrics": {
      "integrated_lufs": -14.05,
      "true_peak_db": -1.5,
      "filler_words_removed": 6,
      "multicam_layout": "stack"
    }
  }
}
```

---

## 4-Way Production Code Snippets

::: code-group

```python [Python]
"""Long-Form Podcast to Viral Shorts Pipeline with Webhook Support."""

import hmac
import hashlib
import os
import time
import requests

API_KEY = os.environ.get("FOTOHUB_API_KEY", "fh_live_sample_key")
BASE_URL = "https://apis.fotohub.app"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

def submit_podcast_job(source_video_url: str, webhook_url: str, webhook_secret: str) -> dict:
    print(f"Submitting 60-minute podcast: {source_video_url}")
    
    payload = {
        "source_url": source_video_url,
        "source_type": "url",
        "title": "AI Summit 2026 Keynote & Debate",
        "language": "en",
        "max_clips": 5,
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
        "webhook_url": webhook_url,
        "webhook_secret": webhook_secret,
        "reference": "summit_2026_ep01",
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

    resp = requests.post(f"{BASE_URL}/v1/shorts/clips", headers=HEADERS, json=payload, timeout=30)
    resp.raise_for_status()
    job = resp.json()
    job_id = job["job_id"]
    print(f"Job accepted: {job_id} (Charged: ${job.get('charged_usd', 0):.2f} USD)")

    # Optional polling fallback if webhooks are delayed
    print("Monitoring processing status...")
    for _ in range(60):
        status_resp = requests.get(f"{BASE_URL}/v1/shorts/clips/{job_id}", headers=HEADERS, timeout=15)
        status = status_resp.json()
        state = status.get("status")
        progress = status.get("progress_pct", 0)
        print(f"  Status: {state} ({progress}%)")

        if state == "completed":
            clips = status.get("clips", [])
            print(f"\nSuccessfully generated {len(clips)} viral shorts:")
            for c in clips:
                print(f"  - [{c.get('virality_score')} pts] {c.get('title')}: {c.get('video_url')}")
            return status
        elif state in ("failed", "error"):
            raise RuntimeError(f"Clipping job failed: {status.get('error')}")

        time.sleep(10)

    raise TimeoutError("Job did not complete in allotted time")

def verify_webhook_signature(payload_bytes: bytes, signature_header: str, secret: str) -> bool:
    """Validate X-FotoHub-Signature HMAC-SHA256."""
    expected = hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header)

if __name__ == "__main__":
    submit_podcast_job(
        source_video_url="https://storage.fotohub.app/raw/tech_podcast_ep104.mp4",
        webhook_url="https://api.yourbrand.com/webhooks/fotohub",
        webhook_secret="whsec_secret_key_production"
    )
```

```typescript [TypeScript]
/**
 * Podcast to Viral Shorts Studio in TypeScript.
 */

import crypto from "crypto";

const API_KEY = process.env.FOTOHUB_API_KEY || "fh_live_sample_key";
const BASE_URL = "https://apis.fotohub.app";

interface ClipJobResponse {
  operation: string;
  charged_usd: number;
  job_id: string;
  status: string;
}

async function convertPodcastToShorts(videoUrl: string, webhookUrl: string, secret: string) {
  console.log(`Submitting long-form podcast: ${videoUrl}`);

  const payload = {
    source_url: videoUrl,
    source_type: "url",
    title: "Venture Podcast Season 4",
    language: "en",
    max_clips: 5,
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
    webhook_url: webhookUrl,
    webhook_secret: secret,
    reference: "venture_podcast_ep4",
    settings: {
      multicam: "stack",
      multicam_dim: 0.18,
      audio: { target_lufs: -14.0, denoise: true },
    },
  };

  const res = await fetch(`${BASE_URL}/v1/shorts/clips`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`HTTP Error ${res.status}: ${await res.text()}`);
  }

  const job = (await res.json()) as ClipJobResponse;
  console.log(`Clipping job initiated: ${job.job_id} (Fee: $${job.charged_usd} USD)`);
  return job;
}

export function verifyWebhook(rawBody: Buffer, signature: string, secret: string): boolean {
  const hash = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

convertPodcastToShorts(
  "https://storage.fotohub.app/raw/tech_podcast_ep104.mp4",
  "https://api.yourbrand.com/webhooks/fotohub",
  "whsec_secret_key_production"
).catch(console.error);
```

```go [Go]
package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type ClipRequest struct {
	SourceURL     string                 `json:"source_url"`
	SourceType    string                 `json:"source_type"`
	Title         string                 `json:"title"`
	Language      string                 `json:"language"`
	MaxClips      int                    `json:"max_clips"`
	MinDuration   int                    `json:"min_duration"`
	MaxDuration   int                    `json:"max_duration"`
	AspectRatio   string                 `json:"aspect_ratio"`
	CaptionStyle  string                 `json:"caption_style"`
	Captions      bool                   `json:"captions"`
	Reframe       bool                   `json:"reframe"`
	Hooks         bool                   `json:"hooks"`
	Covers        bool                   `json:"covers"`
	Broll         bool                   `json:"broll"`
	EnhanceAudio  bool                   `json:"enhance_audio"`
	RemoveFiller  bool                   `json:"remove_filler"`
	Retention     bool                   `json:"retention_model"`
	WebhookURL    string                 `json:"webhook_url"`
	WebhookSecret string                 `json:"webhook_secret"`
	Settings      map[string]interface{} `json:"settings"`
}

func main() {
	apiKey := os.Getenv("FOTOHUB_API_KEY")
	url := "https://apis.fotohub.app/v1/shorts/clips"

	reqBody := ClipRequest{
		SourceURL:     "https://storage.fotohub.app/raw/tech_podcast_ep104.mp4",
		SourceType:    "url",
		Title:         "AI Roundtable 2026",
		Language:      "en",
		MaxClips:      5,
		MinDuration:   20,
		MaxDuration:   60,
		AspectRatio:   "9:16",
		CaptionStyle:  "karaoke",
		Captions:      true,
		Reframe:       true,
		Hooks:         true,
		Covers:        true,
		Broll:         true,
		EnhanceAudio:  true,
		RemoveFiller:  true,
		Retention:     true,
		WebhookURL:    "https://api.yourbrand.com/webhooks/fotohub",
		WebhookSecret: "whsec_79a8bc43f9012d4e8",
		Settings: map[string]interface{}{
			"multicam":     "stack",
			"multicam_dim": 0.18,
			"audio": map[string]interface{}{
				"target_lufs": -14.0,
				"denoise":     true,
			},
		},
	}

	data, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	fmt.Printf("Job response: %s\n", string(bodyBytes))
}

func VerifySignature(body []byte, signature, secret string) bool {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}
```

```bash [cURL]
# 1. Submit long-form podcast for automatic clipping
curl -X POST https://apis.fotohub.app/v1/shorts/clips \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source_url": "https://storage.fotohub.app/raw/tech_podcast_ep104.mp4",
    "source_type": "url",
    "title": "Tech Podcast Ep 104 Highlights",
    "language": "en",
    "max_clips": 5,
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
    "webhook_url": "https://api.yourdomain.com/webhooks/fotohub",
    "webhook_secret": "whsec_production_secret_01",
    "settings": {
      "multicam": "stack",
      "multicam_dim": 0.18,
      "audio": {
        "target_lufs": -14.0,
        "denoise": true
      }
    }
  }'

# 2. Check job progress
curl -X GET https://apis.fotohub.app/v1/shorts/clips/job_948a01bf28 \
  -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

:::

---

## Parameter Specifications

| Parameter | Type | Required | Default | Description |
|:---|:---|:---:|:---|:---|
| `source_url` | string | **Yes** | — | Public MP4 URL or YouTube link to ingest. Max 2048 chars. |
| `max_clips` | integer | No | 10 | Max clips to discover and render (range: 1–30). |
| `min_duration` | integer | No | 15 | Minimum duration in seconds (range: 5–180). |
| `max_duration` | integer | No | 60 | Maximum duration in seconds (range: 10–300). |
| `aspect_ratio` | string | No | `"9:16"` | Target aspect ratio: `"9:16"`, `"1:1"`, `"4:5"`, or `"16:9"`. |
| `caption_style` | string | No | `"karaoke"` | Style: `"karaoke"`, `"hormozi"`, `"beasty"`, `"neon"`, `"clean"`, `"minimal"`. |
| `settings.multicam` | string | No | `"stack"` | `"stack"` (Top/Bottom split) or `"auto"` (active speaker crop). |
| `settings.multicam_dim` | float | No | `0.18` | Visual brightness dimming applied to the inactive speaker (0.0 to 1.0). |
| `settings.audio.target_lufs` | float | No | `-14.0` | EBU R128 loudness target in LUFS (-24.0 to -9.0). |
| `webhook_url` | string | No | — | HTTPS endpoint receiving event notifications on completion. |
| `webhook_secret` | string | No | — | Secret string used to sign HMAC-SHA256 headers. |

---

## Exact USD Pricing Breakdown

Billing is deducted from your unified **prepaid USD wallet balance** at job submission time.

| Operation | Unit Cost (USD) | Notes |
|:---|:---:|:---|
| **Full Clipping Job (`shorts_clip_job`)** | **$0.75 / job** | Flat rate covering ingest, transcription, virality scoring, multi-speaker reframing, captions, B-roll, audio mastering, and NVENC GPU rendering. |
| **Ingest Only (`shorts_ingest`)** | $0.05 / video | Standalone step endpoint |
| **Transcription (`shorts_transcribe`)** | $0.05 / video | Standalone WhisperX speech recognition |
| **Scene Detection (`shorts_detect_scenes`)** | $0.08 / video | Standalone scene cut detection |
| **Clip Generation (`shorts_generate_clips`)** | $0.12 / video | Standalone LLM moment scoring |
| **Smart Reframe (`shorts_reframe`)** | $0.08 / clip | Standalone face tracking and 9:16 crop |
| **Karaoke Captions (`shorts_captions`)** | $0.05 / clip | Standalone ASS subtitle compilation |
| **GPU Render (`shorts_render`)** | $0.12 / clip | Standalone NVENC composite |

### Real-World Cost Analysis

Extracting 5 high-converting vertical viral shorts from a 60-minute podcast episode costs **$0.75 USD total**, or **$0.15 per short**.
