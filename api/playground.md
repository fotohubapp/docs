# API Playground

Test FOTOhub API endpoints directly from your terminal. Copy any example below and replace `YOUR_API_KEY` with your key from [Console → Keys](https://fotohub.app/console/keys).

## Image Generation

Generate a product photo:

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedream-5-0-260128",
    "prompt": "Professional product photography, white sneakers on marble surface, soft studio lighting, clean background",
    "aspect_ratio": "1:1",
    "num_images": 1
  }'
```

Expected response:
```json
{
  "images": ["https://s3point.fotohub.app/generations/..."],
  "model": "seedream-5-0-260128",
  "credits_used": 1,
  "generation_time_ms": 2340
}
```

## Video Generation

Create a 5-second cinematic clip:

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance-2-0-fast",
    "prompt": "Drone flying over a misty forest at sunrise, cinematic, 4K",
    "duration": 5,
    "aspect_ratio": "16:9"
  }'
```

Then poll for the result:
```bash
curl https://apis.fotohub.app/v1/ai/generate/video/JOB_ID \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Chat Completion

Stream a response from Gemini:

```bash
curl -X POST https://apis.fotohub.app/v1/ai/chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-flash",
    "messages": [
      {"role": "system", "content": "You are a helpful coding assistant."},
      {"role": "user", "content": "Write a Python function to calculate Fibonacci numbers"}
    ],
    "stream": true,
    "max_tokens": 1000
  }'
```

## Gabriel AI (No Auth Required)

### Suggest — autocomplete as you type:

```bash
curl -X POST https://apis.fotohub.app/v1/ai/gabriel/suggest \
  -H "Content-Type: application/json" \
  -d '{"partial": "product photo", "tab": "image"}'
```

### Recommend — get contextual tips:

```bash
curl -X POST https://apis.fotohub.app/v1/ai/gabriel/recommend \
  -H "Content-Type: application/json" \
  -d '{"page": "/generate/new", "credits_remaining": 5, "has_brand": false}'
```

### Classify — route to the right feature:

```bash
curl -X POST https://apis.fotohub.app/v1/ai/gabriel \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Make a cinematic video of ocean waves at sunset",
    "language": "en",
    "enhance_prompt": true
  }'
```

## Translation (No Auth Required)

```bash
curl -X POST https://apis.fotohub.app/v1/ai/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "The quick brown fox", "target_language": "pl"}'
```

## Music Generation

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/music \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "minimax",
    "prompt": "Upbeat electronic track, energetic, 128 BPM, future bass",
    "duration": 30,
    "instrumental": true
  }'
```

## Check Your Balance

```bash
curl https://apis.fotohub.app/v1/billing/balance \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## List Available Models

```bash
curl "https://apis.fotohub.app/v1/models?category=image" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

::: tip Interactive Console
For a full interactive experience with response visualization, visit [fotohub.app/console](https://fotohub.app/console) — it includes a built-in API explorer with request builder and response viewer.
:::
