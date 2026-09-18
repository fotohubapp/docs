# API Playground

Test FOTOhub API endpoints directly from your browser or terminal. Every example below uses real, working cURL commands — copy, replace `fh_live_your_api_key` with your key from [Console → Keys](https://fotohub.app/console/keys), and run.

All API calls debit your **prepaid USD wallet** at transparent rates with no credit conversion. The expected cost is shown for each example.

::: tip Interactive Console
For a live GUI with request builder, response visualization, and syntax highlighting, visit [fotohub.app/console](https://fotohub.app/console) — no code required.
:::

---

## Image Generation

### Text-to-Image (Seedream 5.0)

Generate a professional product photo. Cost: **$0.045 / image**.

::: code-group

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedream-5-0-260128",
    "prompt": "Professional product photography, white sneakers on marble surface, soft studio lighting, clean white background, 4K detail",
    "aspect_ratio": "1:1",
    "num_images": 1
  }'
```

```python [Python]
import httpx

response = httpx.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
    json={
        "model": "seedream-5-0-260128",
        "prompt": "Professional product photography, white sneakers on marble surface, soft studio lighting, clean white background, 4K detail",
        "aspect_ratio": "1:1",
        "num_images": 1
    }
)
data = response.json()
print(data["images"][0])  # CDN URL of generated image
print(f"Cost: ${data['usd_charged']:.4f}")
```

```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/v1/ai/generate/image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer fh_live_your_api_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'seedream-5-0-260128',
    prompt: 'Professional product photography, white sneakers on marble surface, soft studio lighting',
    aspect_ratio: '1:1',
    num_images: 1,
  }),
});

const data = await response.json();
console.log(data.images[0]);      // CDN image URL
console.log(`Cost: $${data.usd_charged}`);
```

```go [Go]
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

func main() {
    body, _ := json.Marshal(map[string]interface{}{
        "model":        "seedream-5-0-260128",
        "prompt":       "Professional product photography, white sneakers on marble, studio lighting",
        "aspect_ratio": "1:1",
        "num_images":   1,
    })

    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/image", bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
    req.Header.Set("Content-Type", "application/json")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    result, _ := io.ReadAll(resp.Body)
    fmt.Println(string(result))
}
```

:::

Expected response:
```json
{
  "images": ["https://s3point.fotohub.app/generations/img_abc123.webp"],
  "model": "seedream-5-0-260128",
  "usd_charged": 0.045,
  "generation_time_ms": 2340
}
```

### FLUX.1 Pro (Ultra-Photorealistic)

Cost: **$0.030 / image**.

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "flux-2-pro",
    "prompt": "Cinematic portrait of a fashion model in Paris at dusk, golden hour, editorial Vogue style",
    "aspect_ratio": "2:3",
    "steps": 28,
    "guidance": 3.5
  }'
```

### Batch Image Generation (4 Variants)

Generate 4 variations in a single call. Cost: **$0.180** (4 × $0.045).

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedream-5-0-260128",
    "prompt": "Luxury skincare serum bottle on black marble, dramatic side lighting",
    "aspect_ratio": "1:1",
    "num_images": 4,
    "seed": 42
  }'
```

---

## Video Generation

### Text-to-Video (Seedance 2.0 Pro — 5s clip)

Submit asynchronously, then poll for result. Cost: **$0.240 / 5s clip**.

```bash
# Step 1: Submit job (returns immediately with job_id)
JOB_ID=$(curl -s -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance-2-0-pro",
    "prompt": "Drone flying over a misty pine forest at golden sunrise, cinematic slow motion, 4K",
    "duration": 5,
    "aspect_ratio": "16:9"
  }' | jq -r '.job_id')

echo "Job submitted: $JOB_ID"

# Step 2: Poll until complete
while true; do
  RESULT=$(curl -s "https://apis.fotohub.app/v1/ai/generate/video/$JOB_ID" \
    -H "Authorization: Bearer fh_live_your_api_key")
  STATUS=$(echo $RESULT | jq -r '.status')
  echo "Status: $STATUS"
  
  if [ "$STATUS" = "completed" ]; then
    echo "Video URL: $(echo $RESULT | jq -r '.video_url')"
    echo "Cost: $(echo $RESULT | jq -r '.usd_charged')"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Failed: $(echo $RESULT | jq -r '.error')"
    break
  fi
  
  sleep 10
done
```

### Image-to-Video (Kling v2.1 — animate your image)

Cost: **$0.130 / 5s clip**.

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kling-v2-1",
    "prompt": "The model turns her head slowly and smiles gently",
    "image_url": "https://s3point.fotohub.app/uploads/model_portrait.jpg",
    "duration": 5,
    "aspect_ratio": "9:16"
  }'
```

---

## Chat Completion

### Claude Sonnet 4 (Streaming)

Cost: **$0.003 / 1K input tokens**, **$0.015 / 1K output tokens**.

```bash
curl -X POST https://apis.fotohub.app/v1/ai/chat/completions \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "messages": [
      {"role": "system", "content": "You are a senior Python engineer specializing in async code."},
      {"role": "user", "content": "Write a FastAPI endpoint that validates HMAC-SHA256 webhook signatures"}
    ],
    "stream": true,
    "max_tokens": 2000
  }'
```

### Gemini 2.0 Flash (Fast + Cheap)

Cost: **$0.000075 / 1K input tokens**.

```bash
curl -X POST https://apis.fotohub.app/v1/ai/chat/completions \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2-0-flash",
    "messages": [
      {"role": "user", "content": "Summarize the key benefits of a prepaid API billing model vs subscription credits"}
    ],
    "max_tokens": 500
  }'
```

---

## Music & Audio Generation

### AI Music (MiniMax — 30s instrumental)

Cost: **$0.015 / 30s clip**.

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/music \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "minimax",
    "prompt": "Upbeat electronic track, energetic, 128 BPM, future bass, driving synths",
    "duration": 30,
    "instrumental": true
  }'
```

### Sound Effect Generation (MMAudio)

Synthesize a realistic sound effect. Cost: **$0.008 / 5s**.

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/sfx \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Heavy metal door slamming shut in a concrete corridor with echo reverb",
    "duration_s": 3.0,
    "steps": 25,
    "cfg_strength": 4.5
  }'
```

### Text-to-Speech (AWS Polly voices)

Convert text to natural-sounding voice. Cost: **$0.015 / 1K characters**.

```bash
curl -X POST https://apis.fotohub.app/v1/ai/tts/polly/synthesize \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome to FOTOhub Creative AI Platform. Your creative possibilities are limitless.",
    "voice_id": "Joanna",
    "engine": "neural",
    "output_format": "mp3"
  }'
```

---

## Background Removal

### Standard Background Removal

Cost: **$0.003 / image**.

```bash
curl -X POST https://apis.fotohub.app/v1/images/remove-background \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -F "file=@product.jpg"
```

### Advanced SAM2 Alpha Segmentation (edge-feathered)

Cost: **$0.008 / image**.

```bash
curl -X POST https://apis.fotohub.app/v1/images/remove-background/advanced \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -F "file=@fashion_model.jpg" \
  -F "feather=3" \
  -F "output_format=png"
```

---

## Document OCR & Intelligence

### Extract Text from PDF

Cost: **$0.005 / page**. Raw text detection, no table/form structure — the document goes in the JSON body as base64, not multipart.

```bash
curl -X POST https://apis.fotohub.app/v1/ai/document/detect-text \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"document\": \"$(base64 -w0 invoice.pdf)\"}"
```

### Table Extraction

Structured extraction with tables/forms/signatures. Also base64 in the JSON body.

```bash
curl -X POST https://apis.fotohub.app/v1/ai/document/analyze \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"document\": \"$(base64 -w0 financial_statement.pdf)\", \"features\": [\"TABLES\", \"FORMS\", \"SIGNATURES\"]}"
```

---

## 3D Model Generation

Generate a textured 3D mesh from an image. Cost: **$0.120 / model**.

The image goes in the JSON body as base64 (`image_base64`), not a URL, and `mode` must be either `image-to-3d` or `text-to-3d`. This endpoint is **synchronous** — it holds the connection open (up to ~3 minutes) and returns the finished model's `url` in the same response. There is no job/poll pattern here.

```bash
curl -s -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{
    \"mode\": \"image-to-3d\",
    \"model\": \"fh-pro-3d\",
    \"image_base64\": \"$(base64 -w0 sneaker.jpg)\",
    \"format\": \"glb\",
    \"quality\": \"high\"
  }" | jq -r '.url'
```

---

## Virtual Try-On

Place a garment on a model. Cost: **$0.024 / image**.

```bash
JOB_ID=$(curl -s -X POST https://apis.fotohub.app/v1/ai/tryon \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "person_image_url": "https://s3point.fotohub.app/models/model_f_01.jpg",
    "garment_image_url": "https://s3point.fotohub.app/uploads/tshirt_flatlay.jpg",
    "category": "tops",
    "garment_photo_type": "flat-lay"
  }' | jq -r '.job_id')

curl "https://apis.fotohub.app/v1/ai/tryon/$JOB_ID" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

---

## Shorts / Podcast Clipping

Clip a 60-minute podcast into 5 viral shorts. Cost: **~$0.75 per job**.

```bash
curl -X POST https://apis.fotohub.app/v1/shorts/clips \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "source_url": "https://storage.fotohub.app/raw/podcast_ep104.mp4",
    "max_clips": 5,
    "min_duration": 20,
    "max_duration": 60,
    "aspect_ratio": "9:16",
    "captions": true,
    "caption_style": "karaoke",
    "enhance_audio": true,
    "hooks": true,
    "webhook_url": "https://api.yourapp.com/webhooks/fotohub"
  }'
```

---

## Lip-Sync & Dubbing

Sync audio to video with neural lip-sync. Cost: **$0.080 / 5s video**.

```bash
curl -X POST https://apis.fotohub.app/v1/video/lip-sync \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://storage.fotohub.app/raw/speaker.mp4",
    "audio_url": "https://storage.fotohub.app/raw/dubbed_spanish.mp3",
    "model": "musetalk",
    "face_enhancement": true
  }'
```

---

## Gabriel AI (Intelligent Prompt Router)

### Route to the Right Feature

Gabriel automatically classifies your prompt and routes it to the optimal model:

```bash
curl -X POST https://apis.fotohub.app/v1/ai/gabriel \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Make a cinematic video of ocean waves at sunset with dramatic orchestral music",
    "language": "en",
    "enhance_prompt": true
  }'
```

Response:
```json
{
  "intent": "video_with_audio",
  "route": "video_generation + music_audio",
  "enhanced_prompt": "Dramatic ocean waves crashing on rocky coastline at sunset, golden light reflecting on water, slow motion, cinematic 4K, film grain",
  "suggested_model": "seedance-2-0-pro",
  "estimated_cost_usd": 0.255
}
```

### Prompt Autocomplete (No Auth Required)

```bash
curl -X POST https://apis.fotohub.app/v1/ai/gabriel/suggest \
  -H "Content-Type: application/json" \
  -d '{"partial": "product photo with", "tab": "image"}'
```

### Contextual Recommendations (No Auth Required)

```bash
curl -X POST https://apis.fotohub.app/v1/ai/gabriel/recommend \
  -H "Content-Type: application/json" \
  -d '{"page": "/generate/new", "wallet_balance_usd": 15.50, "has_brand": false}'
```

---

## Translation

Convert text between 50+ languages. Cost: **$0.0006 / 1K characters**.

```bash
curl -X POST https://apis.fotohub.app/v1/ai/translate \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"text": "The quick brown fox jumps over the lazy dog", "target_language": "ja"}'
```

---

## Billing & Wallet

### Check Your Balance

```bash
curl https://apis.fotohub.app/v1/billing/balance \
  -H "Authorization: Bearer fh_live_your_api_key"
```

Response:
```json
{
  "available_usd": 47.83,
  "total_deposited_usd": 200.00,
  "currency": "USD"
}
```

### Usage Analytics

```bash
curl "https://apis.fotohub.app/v1/usage?period=7d" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  | jq '{spend: .totals.total_usd_charged, requests: .totals.total_requests}'
```

### Transaction History

```bash
curl "https://apis.fotohub.app/v1/billing/transactions?limit=10" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

---

## Models Catalog

```bash
# List all image models
curl "https://apis.fotohub.app/v1/models?category=image" \
  -H "Authorization: Bearer fh_live_your_api_key"

# List video models with pricing
curl "https://apis.fotohub.app/v1/models?category=video" \
  -H "Authorization: Bearer fh_live_your_api_key" | jq '.models[] | {id, usd_per_5s}'

# Get a specific model's details (there is no per-model endpoint — filter the list)
curl "https://apis.fotohub.app/v1/models?category=video" \
  -H "Authorization: Bearer fh_live_your_api_key" | jq '.models[] | select(.id == "seedance-2-0-pro")'
```

---

## Error Handling

FOTOhub uses standard HTTP status codes. Always check `error.code` for machine-readable details:

```bash
# Example: low balance error
curl -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"model": "seedance-2-0-pro", "prompt": "test", "duration": 5}' 2>&1
```

```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Wallet balance $0.10 is below the minimum required $0.24 for this operation.",
    "available_usd": 0.10,
    "required_usd": 0.24,
    "topup_url": "https://fotohub.app/console/billing"
  }
}
```

| HTTP Status | Error Code | Meaning |
|:---|:---|:---|
| `400` | `VALIDATION_ERROR` | Missing or invalid request parameters |
| `401` | `INVALID_API_KEY` | API key is invalid or revoked |
| `402` | `INSUFFICIENT_FUNDS` | Wallet balance too low for this operation |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many requests per minute |
| `503` | `MODEL_OVERLOADED` | GPU inference queue at capacity — retry with backoff |

See the full [Error Reference](/api/errors) for all error codes and retry strategies.

---

::: tip Test with Console
The [fotohub.app/console](https://fotohub.app/console) web console includes a built-in API playground with interactive request builder, real-time response viewer, and cost calculator — no terminal needed.
:::
