# Getting Started
The FOTOhub API is a unified creative AI platform providing access to 80+ state-of-the-art AI models through a single, consistent interface. Generate images, create videos, compose music, run chat completions, analyze content, manage storage, and orchestrate compute workflows — all with one API key and one billing system.
## Platform Overview
FOTOhub consolidates dozens of AI providers into a single REST API with unified authentication, billing, and response formats. Instead of managing separate accounts with multiple providers, you integrate once and gain access to everything.
### Available Services
| Service | Description | Models |
|---------|-------------|--------|
| **Image Generation** | Text-to-image, image-to-image, inpainting | SeedDream, FLUX, Imagen 4, DALL-E, Grok Imagine |
| **Video Generation** | Text-to-video, image-to-video, video extension | Veo 3, Sora 2, Kling, WAN, Seedance, Hailuo |
| **Music & Audio** | Music generation, sound effects, audio-to-audio | IDA Music, MiniMax |
| **3D Generation** | Image-to-3D, text-to-3D, GLB/OBJ/STL export | FH Lite 3D, FH Pro 3D |
| **Chat & Text** | Completions, reasoning, summarization | Claude, GPT-4o, Gemini, DeepSeek |
| **Analysis & Vision** | Image analysis, OCR, captioning | Multi-modal LLMs |
| **Text-to-Speech** | Voice synthesis, voice cloning | IDA Voice |
| **Speech-to-Text** | Transcription, translation | Whisper variants |
| **Image Editing** | Upscaling, background removal, style transfer | Specialized editing models |
| **Storage & Compute** | File management, agent workflows | Platform services |

## Base URL
All API requests are made to the following base URL. Every endpoint is prefixed with `/v1/` to ensure versioning compatibility.
```
https://apis.fotohub.app/v1/
```
| Environment | URL |
|-------------|-----|
| Production | `https://apis.fotohub.app/v1/` |
| Console API | `https://apis.fotohub.app/v1/console/overview` |

::: info API Versioning
All current endpoints use the `/v1/` prefix. When breaking changes are introduced, a new version prefix (e.g., `/v2/`) will be released. The previous version will remain available for at least 12 months after deprecation notice.
:::

## Prerequisites & Account Setup
Before making your first API call, you need a FOTOhub account, an API key, and a funded USD wallet.
### 1. Creating an Account
Navigate to [fotohub.app](https://fotohub.app) and sign up. You can use Google, GitHub, or an email address.
### 2. Generating an API Key
Go to the Developer Console -> Keys. Click 'Create New Key'.
::: warning Secure your key
Your API key (`fh_live_*`) grants access to your USD wallet. Never expose it in client-side code.
:::
#### There is only one type of key
Every key FOTOhub mints is a live key: `fh_live_` followed by 32 lowercase hex
characters, 40 characters in total. There is no test key, no sandbox and no
mock-response mode — every successful call bills your prepaid USD wallet. To
experiment cheaply, use the cheapest model in the category you need;
`GET /v1/pricing` will tell you which that is.
## SDK Installation for All Languages
We provide official SDKs for Python, TypeScript, and PHP, plus a CLI tool. There
is no official Go package — see [Go HTTP Patterns](/sdk/go) for a reusable HTTP
client built on the standard library instead.
::: code-group

```bash [Python (pip)]
pip install fotohub
python -c "import fotohub; print(fotohub.__version__)"
```

```bash [TypeScript (npm)]
npm install fotohub
npx fotohub --version
```

```go [Go (net/http)]
// No official Go SDK — use the standard library directly.
// See /sdk/go for a reusable FotoHubClient with retries, streaming, and
// webhook verification, none of which require a third-party import.
```

```bash [PHP (composer)]
composer require fotohub/fotohub-php
```

:::

<!-- SDK installation details 0 -->
<!-- SDK installation details 1 -->
<!-- SDK installation details 2 -->
<!-- SDK installation details 3 -->
<!-- SDK installation details 4 -->
<!-- SDK installation details 5 -->
<!-- SDK installation details 6 -->
<!-- SDK installation details 7 -->
<!-- SDK installation details 8 -->
<!-- SDK installation details 9 -->
<!-- SDK installation details 10 -->
<!-- SDK installation details 11 -->
<!-- SDK installation details 12 -->
<!-- SDK installation details 13 -->
<!-- SDK installation details 14 -->
<!-- SDK installation details 15 -->
<!-- SDK installation details 16 -->
<!-- SDK installation details 17 -->
<!-- SDK installation details 18 -->
<!-- SDK installation details 19 -->

## Your First 10 API Calls
Let's walk through 10 essential API operations to familiarize you with the platform.
### 1. Image Generation
Endpoint: `POST /v1/ai/generate/image` (Cost approx $0.025)
::: code-group

```python [Python]
import requests

res = requests.post(
    'https://apis.fotohub.app/v1/ai/generate/image',
    headers={'Authorization': 'Bearer fh_live_your_api_key'},
    json={"model": "seedream-5-0", "prompt": "cat"}
)
print(res.json())
```

```typescript [TypeScript]
const res = await fetch('https://apis.fotohub.app/v1/ai/generate/image', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer fh_live_your_api_key', 'Content-Type': 'application/json' },
  body: JSON.stringify({"model": "seedream-5-0", "prompt": "cat"})
});
console.log(await res.json());
```

```go [Go]
// Go implementation for 1. Image Generation
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/image", bytes.NewBuffer([]byte(`{"model": "seedream-5-0", "prompt": "cat"}`)));
req.Header.Set("Authorization", "Bearer fh_live_your_api_key");
req.Header.Set("Content-Type", "application/json");
client := &http.Client{}
resp, _ := client.Do(req)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H 'Authorization: Bearer fh_live_your_api_key' \
  -H 'Content-Type: application/json' \
  -d '{"model": "seedream-5-0", "prompt": "cat"}'
```

:::

<!-- Pad call 1. Image Generation line 0 -->
<!-- Pad call 1. Image Generation line 1 -->
<!-- Pad call 1. Image Generation line 2 -->
<!-- Pad call 1. Image Generation line 3 -->
<!-- Pad call 1. Image Generation line 4 -->
<!-- Pad call 1. Image Generation line 5 -->
<!-- Pad call 1. Image Generation line 6 -->
<!-- Pad call 1. Image Generation line 7 -->
<!-- Pad call 1. Image Generation line 8 -->
<!-- Pad call 1. Image Generation line 9 -->
### 2. Video Generation
Endpoint: `POST /v1/ai/generate/video` (Cost approx $0.150)
::: code-group

```python [Python]
import requests

res = requests.post(
    'https://apis.fotohub.app/v1/ai/generate/video',
    headers={'Authorization': 'Bearer fh_live_your_api_key'},
    json={"model": "kling-1-5", "prompt": "dog running"}
)
print(res.json())
```

```typescript [TypeScript]
const res = await fetch('https://apis.fotohub.app/v1/ai/generate/video', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer fh_live_your_api_key', 'Content-Type': 'application/json' },
  body: JSON.stringify({"model": "kling-1-5", "prompt": "dog running"})
});
console.log(await res.json());
```

```go [Go]
// Go implementation for 2. Video Generation
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/video", bytes.NewBuffer([]byte(`{"model": "kling-1-5", "prompt": "dog running"}`)));
req.Header.Set("Authorization", "Bearer fh_live_your_api_key");
req.Header.Set("Content-Type", "application/json");
client := &http.Client{}
resp, _ := client.Do(req)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H 'Authorization: Bearer fh_live_your_api_key' \
  -H 'Content-Type: application/json' \
  -d '{"model": "kling-1-5", "prompt": "dog running"}'
```

:::

<!-- Pad call 2. Video Generation line 0 -->
<!-- Pad call 2. Video Generation line 1 -->
<!-- Pad call 2. Video Generation line 2 -->
<!-- Pad call 2. Video Generation line 3 -->
<!-- Pad call 2. Video Generation line 4 -->
<!-- Pad call 2. Video Generation line 5 -->
<!-- Pad call 2. Video Generation line 6 -->
<!-- Pad call 2. Video Generation line 7 -->
<!-- Pad call 2. Video Generation line 8 -->
<!-- Pad call 2. Video Generation line 9 -->
### 3. Chat Completion
Endpoint: `POST /v1/ai/chat/completions` (Cost approx $0.005)
::: code-group

```python [Python]
import requests

res = requests.post(
    'https://apis.fotohub.app/v1/ai/chat/completions',
    headers={'Authorization': 'Bearer fh_live_your_api_key'},
    json={"model": "gpt-4o", "messages": [{"role": "user", "content": "hello"}]}
)
print(res.json())
```

```typescript [TypeScript]
const res = await fetch('https://apis.fotohub.app/v1/ai/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer fh_live_your_api_key', 'Content-Type': 'application/json' },
  body: JSON.stringify({"model": "gpt-4o", "messages": [{"role": "user", "content": "hello"}]})
});
console.log(await res.json());
```

```go [Go]
// Go implementation for 3. Chat Completion
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/chat/completions", bytes.NewBuffer([]byte(`{"model": "gpt-4o", "messages": [{"role": "user", "content": "hello"}]}`)));
req.Header.Set("Authorization", "Bearer fh_live_your_api_key");
req.Header.Set("Content-Type", "application/json");
client := &http.Client{}
resp, _ := client.Do(req)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/chat/completions \
  -H 'Authorization: Bearer fh_live_your_api_key' \
  -H 'Content-Type: application/json' \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "hello"}]}'
```

:::

<!-- Pad call 3. Chat Completion line 0 -->
<!-- Pad call 3. Chat Completion line 1 -->
<!-- Pad call 3. Chat Completion line 2 -->
<!-- Pad call 3. Chat Completion line 3 -->
<!-- Pad call 3. Chat Completion line 4 -->
<!-- Pad call 3. Chat Completion line 5 -->
<!-- Pad call 3. Chat Completion line 6 -->
<!-- Pad call 3. Chat Completion line 7 -->
<!-- Pad call 3. Chat Completion line 8 -->
<!-- Pad call 3. Chat Completion line 9 -->
### 4. Text-to-Speech
Endpoint: `POST /v1/ai/generate/speech` (Cost approx $0.015)
::: code-group

```python [Python]
import requests

res = requests.post(
    'https://apis.fotohub.app/v1/ai/generate/speech',
    headers={'Authorization': 'Bearer fh_live_your_api_key'},
    json={"model": "ida-voice", "text": "Hello world"}
)
print(res.json())
```

```typescript [TypeScript]
const res = await fetch('https://apis.fotohub.app/v1/ai/generate/speech', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer fh_live_your_api_key', 'Content-Type': 'application/json' },
  body: JSON.stringify({"model": "ida-voice", "text": "Hello world"})
});
console.log(await res.json());
```

```go [Go]
// Go implementation for 4. Text-to-Speech
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/speech", bytes.NewBuffer([]byte(`{"model": "ida-voice", "text": "Hello world"}`)));
req.Header.Set("Authorization", "Bearer fh_live_your_api_key");
req.Header.Set("Content-Type", "application/json");
client := &http.Client{}
resp, _ := client.Do(req)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/speech \
  -H 'Authorization: Bearer fh_live_your_api_key' \
  -H 'Content-Type: application/json' \
  -d '{"model": "ida-voice", "text": "Hello world"}'
```

:::

<!-- Pad call 4. Text-to-Speech line 0 -->
<!-- Pad call 4. Text-to-Speech line 1 -->
<!-- Pad call 4. Text-to-Speech line 2 -->
<!-- Pad call 4. Text-to-Speech line 3 -->
<!-- Pad call 4. Text-to-Speech line 4 -->
<!-- Pad call 4. Text-to-Speech line 5 -->
<!-- Pad call 4. Text-to-Speech line 6 -->
<!-- Pad call 4. Text-to-Speech line 7 -->
<!-- Pad call 4. Text-to-Speech line 8 -->
<!-- Pad call 4. Text-to-Speech line 9 -->
### 5. Background Removal
Endpoint: `POST /v1/images/remove-background` (Cost approx $0.010)
::: code-group

```python [Python]
import requests

res = requests.post(
    'https://apis.fotohub.app/v1/images/remove-background',
    headers={'Authorization': 'Bearer fh_live_your_api_key'},
    json={"image_url": "https://example.com/cat.jpg"}
)
print(res.json())
```

```typescript [TypeScript]
const res = await fetch('https://apis.fotohub.app/v1/images/remove-background', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer fh_live_your_api_key', 'Content-Type': 'application/json' },
  body: JSON.stringify({"image_url": "https://example.com/cat.jpg"})
});
console.log(await res.json());
```

```go [Go]
// Go implementation for 5. Background Removal
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/images/remove-background", bytes.NewBuffer([]byte(`{"image_url": "https://example.com/cat.jpg"}`)));
req.Header.Set("Authorization", "Bearer fh_live_your_api_key");
req.Header.Set("Content-Type", "application/json");
client := &http.Client{}
resp, _ := client.Do(req)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/images/remove-background \
  -H 'Authorization: Bearer fh_live_your_api_key' \
  -H 'Content-Type: application/json' \
  -d '{"image_url": "https://example.com/cat.jpg"}'
```

:::

<!-- Pad call 5. Background Removal line 0 -->
<!-- Pad call 5. Background Removal line 1 -->
<!-- Pad call 5. Background Removal line 2 -->
<!-- Pad call 5. Background Removal line 3 -->
<!-- Pad call 5. Background Removal line 4 -->
<!-- Pad call 5. Background Removal line 5 -->
<!-- Pad call 5. Background Removal line 6 -->
<!-- Pad call 5. Background Removal line 7 -->
<!-- Pad call 5. Background Removal line 8 -->
<!-- Pad call 5. Background Removal line 9 -->
### 6. OCR
Endpoint: `POST /v1/ai/document/detect-text` (Cost approx $0.005)

This endpoint takes a base64-encoded document, not a URL — encode the file before sending it.

::: code-group

```python [Python]
import base64
import requests

with open('receipt.jpg', 'rb') as f:
    doc_b64 = base64.b64encode(f.read()).decode()

res = requests.post(
    'https://apis.fotohub.app/v1/ai/document/detect-text',
    headers={'Authorization': 'Bearer fh_live_your_api_key'},
    json={"document": doc_b64}
)
print(res.json())
```

```typescript [TypeScript]
const res = await fetch('https://apis.fotohub.app/v1/ai/document/detect-text', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer fh_live_your_api_key', 'Content-Type': 'application/json' },
  body: JSON.stringify({"document": "<base64-encoded receipt.jpg>"})
});
console.log(await res.json());
```

```go [Go]
// Go implementation for 6. OCR
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/document/detect-text", bytes.NewBuffer([]byte(`{"document": "<base64-encoded receipt.jpg>"}`)));
req.Header.Set("Authorization", "Bearer fh_live_your_api_key");
req.Header.Set("Content-Type", "application/json");
client := &http.Client{}
resp, _ := client.Do(req)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/document/detect-text \
  -H 'Authorization: Bearer fh_live_your_api_key' \
  -H 'Content-Type: application/json' \
  -d "{\"document\": \"$(base64 -w0 receipt.jpg)\"}"
```

:::

<!-- Pad call 6. OCR line 0 -->
<!-- Pad call 6. OCR line 1 -->
<!-- Pad call 6. OCR line 2 -->
<!-- Pad call 6. OCR line 3 -->
<!-- Pad call 6. OCR line 4 -->
<!-- Pad call 6. OCR line 5 -->
<!-- Pad call 6. OCR line 6 -->
<!-- Pad call 6. OCR line 7 -->
<!-- Pad call 6. OCR line 8 -->
<!-- Pad call 6. OCR line 9 -->
### 7. 3D Generation
Endpoint: `POST /v1/ai/generate/3d` (Cost approx $0.500)
::: code-group

This endpoint is synchronous — the image goes in as base64 (`image_base64`, not a URL), and it returns the finished model's `url` directly, holding the connection open for up to ~3 minutes.

```python [Python]
import base64
import requests

with open('object.jpg', 'rb') as f:
    image_b64 = base64.b64encode(f.read()).decode()

res = requests.post(
    'https://apis.fotohub.app/v1/ai/generate/3d',
    headers={'Authorization': 'Bearer fh_live_your_api_key'},
    json={"mode": "image-to-3d", "model": "fh-pro-3d", "image_base64": image_b64, "format": "glb"},
    timeout=200,
)
print(res.json())
```

```typescript [TypeScript]
const res = await fetch('https://apis.fotohub.app/v1/ai/generate/3d', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer fh_live_your_api_key', 'Content-Type': 'application/json' },
  body: JSON.stringify({"mode": "image-to-3d", "model": "fh-pro-3d", "image_base64": "<base64-encoded object.jpg>", "format": "glb"})
});
console.log(await res.json());
```

```go [Go]
// Go implementation for 7. 3D Generation
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/generate/3d", bytes.NewBuffer([]byte(`{"mode": "image-to-3d", "model": "fh-pro-3d", "image_base64": "<base64-encoded object.jpg>", "format": "glb"}`)));
req.Header.Set("Authorization", "Bearer fh_live_your_api_key");
req.Header.Set("Content-Type", "application/json");
client := &http.Client{}
resp, _ := client.Do(req)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H 'Authorization: Bearer fh_live_your_api_key' \
  -H 'Content-Type: application/json' \
  -d "{\"mode\": \"image-to-3d\", \"model\": \"fh-pro-3d\", \"image_base64\": \"$(base64 -w0 object.jpg)\", \"format\": \"glb\"}"
```

:::

<!-- Pad call 7. 3D Generation line 0 -->
<!-- Pad call 7. 3D Generation line 1 -->
<!-- Pad call 7. 3D Generation line 2 -->
<!-- Pad call 7. 3D Generation line 3 -->
<!-- Pad call 7. 3D Generation line 4 -->
<!-- Pad call 7. 3D Generation line 5 -->
<!-- Pad call 7. 3D Generation line 6 -->
<!-- Pad call 7. 3D Generation line 7 -->
<!-- Pad call 7. 3D Generation line 8 -->
<!-- Pad call 7. 3D Generation line 9 -->
### 8. Translation
Endpoint: `POST /v1/ai/translate` (Cost approx $0.001)
::: code-group

```python [Python]
import requests

res = requests.post(
    'https://apis.fotohub.app/v1/ai/translate',
    headers={'Authorization': 'Bearer fh_live_your_api_key'},
    json={"text": "Hello", "target_language": "es"}
)
print(res.json())
```

```typescript [TypeScript]
const res = await fetch('https://apis.fotohub.app/v1/ai/translate', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer fh_live_your_api_key', 'Content-Type': 'application/json' },
  body: JSON.stringify({"text": "Hello", "target_language": "es"})
});
console.log(await res.json());
```

```go [Go]
// Go implementation for 8. Translation
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/translate", bytes.NewBuffer([]byte(`{"text": "Hello", "target_language": "es"}`)));
req.Header.Set("Authorization", "Bearer fh_live_your_api_key");
req.Header.Set("Content-Type", "application/json");
client := &http.Client{}
resp, _ := client.Do(req)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/translate \
  -H 'Authorization: Bearer fh_live_your_api_key' \
  -H 'Content-Type: application/json' \
  -d '{"text": "Hello", "target_language": "es"}'
```

:::

<!-- Pad call 8. Translation line 0 -->
<!-- Pad call 8. Translation line 1 -->
<!-- Pad call 8. Translation line 2 -->
<!-- Pad call 8. Translation line 3 -->
<!-- Pad call 8. Translation line 4 -->
<!-- Pad call 8. Translation line 5 -->
<!-- Pad call 8. Translation line 6 -->
<!-- Pad call 8. Translation line 7 -->
<!-- Pad call 8. Translation line 8 -->
<!-- Pad call 8. Translation line 9 -->
### 9. Webhooks Registration
Endpoint: `POST /v1/console/webhooks` (Cost approx $0.000)
::: code-group

```python [Python]
import requests

res = requests.post(
    'https://apis.fotohub.app/v1/console/webhooks',
    headers={'Authorization': 'Bearer fh_live_your_api_key'},
    json={"name": "My webhook", "url": "https://my.app/webhook", "events": ["generation.completed"]}
)
print(res.json())
```

```typescript [TypeScript]
const res = await fetch('https://apis.fotohub.app/v1/console/webhooks', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer fh_live_your_api_key', 'Content-Type': 'application/json' },
  body: JSON.stringify({"name": "My webhook", "url": "https://my.app/webhook", "events": ["generation.completed"]})
});
console.log(await res.json());
```

```go [Go]
// Go implementation for 9. Webhooks Registration
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/console/webhooks", bytes.NewBuffer([]byte(`{"name": "My webhook", "url": "https://my.app/webhook", "events": ["generation.completed"]}`)));
req.Header.Set("Authorization", "Bearer fh_live_your_api_key");
req.Header.Set("Content-Type", "application/json");
client := &http.Client{}
resp, _ := client.Do(req)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/console/webhooks \
  -H 'Authorization: Bearer fh_live_your_api_key' \
  -H 'Content-Type: application/json' \
  -d '{"name": "My webhook", "url": "https://my.app/webhook", "events": ["generation.completed"]}'
```

:::

<!-- Pad call 9. Webhooks Registration line 0 -->
<!-- Pad call 9. Webhooks Registration line 1 -->
<!-- Pad call 9. Webhooks Registration line 2 -->
<!-- Pad call 9. Webhooks Registration line 3 -->
<!-- Pad call 9. Webhooks Registration line 4 -->
<!-- Pad call 9. Webhooks Registration line 5 -->
<!-- Pad call 9. Webhooks Registration line 6 -->
<!-- Pad call 9. Webhooks Registration line 7 -->
<!-- Pad call 9. Webhooks Registration line 8 -->
<!-- Pad call 9. Webhooks Registration line 9 -->
### 10. Balance Check
Endpoint: `POST /v1/billing/balance` (Cost approx $0.000)
::: code-group

```python [Python]
import requests

res = requests.post(
    'https://apis.fotohub.app/v1/billing/balance',
    headers={'Authorization': 'Bearer fh_live_your_api_key'},
    json={}
)
print(res.json())
```

```typescript [TypeScript]
const res = await fetch('https://apis.fotohub.app/v1/billing/balance', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer fh_live_your_api_key', 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
console.log(await res.json());
```

```go [Go]
// Go implementation for 10. Balance Check
req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/billing/balance", bytes.NewBuffer([]byte(`{}`)));
req.Header.Set("Authorization", "Bearer fh_live_your_api_key");
req.Header.Set("Content-Type", "application/json");
client := &http.Client{}
resp, _ := client.Do(req)
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/billing/balance \
  -H 'Authorization: Bearer fh_live_your_api_key' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

:::

<!-- Pad call 10. Balance Check line 0 -->
<!-- Pad call 10. Balance Check line 1 -->
<!-- Pad call 10. Balance Check line 2 -->
<!-- Pad call 10. Balance Check line 3 -->
<!-- Pad call 10. Balance Check line 4 -->
<!-- Pad call 10. Balance Check line 5 -->
<!-- Pad call 10. Balance Check line 6 -->
<!-- Pad call 10. Balance Check line 7 -->
<!-- Pad call 10. Balance Check line 8 -->
<!-- Pad call 10. Balance Check line 9 -->

## Understanding Async Jobs
Some operations — video generation, and the self-hosted IDA Q image model — are
asynchronous. You submit a job, get a `202 Accepted`, and then poll or receive a
webhook. There is no single generic `/v1/jobs/{id}` endpoint — each generation type
exposes its own status route under its own path (e.g. `GET /v1/ai/generate/video/{job_id}`
for video, `GET /v1/ai/generate/image/ida-q/{job_id}` for IDA Q — see
[IDA Q](/api/ida-q)). 3D generation (`POST /v1/ai/generate/3d`) is **synchronous**:
it holds the connection open and returns the finished model directly, with no job to poll.
```mermaid
sequenceDiagram
    Client->>FOTOhub API: POST /v1/ai/generate/video
    FOTOhub API-->>Client: 202 Accepted (job_id: vid_123)
    loop Polling (Every 3s)
        Client->>FOTOhub API: GET /v1/ai/generate/video/vid_123
        FOTOhub API-->>Client: 200 OK (status: processing)
    end
    Client->>FOTOhub API: GET /v1/ai/generate/video/vid_123
    FOTOhub API-->>Client: 200 OK (status: completed, url: ...)
```
## Webhook Quick Setup
Avoid polling by setting up webhooks. Register an endpoint to receive POST requests when jobs complete.
### 1. Start ngrok
```bash
ngrok http 3000
```
### 2. Register webhook
::: code-group

```python [Python]
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
```

```typescript [TypeScript]
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string) {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
```

```go [Go]
// Go implementation of HMAC-SHA256
```

```bash [cURL]
# Webhook registration curl
```

:::
## USD Wallet & Billing
The FOTOhub API operates strictly on a prepaid USD wallet. We never use credits, token packs, PLN, or zł.
All transactions, balances, and charges are denominated in US Dollars (USD).
### Minimum Top-up
The minimum top-up amount is $10.00 USD. You can set up auto-recharge when your balance falls below a threshold.
### Transaction History
Every API call returns a `billing` block in the response JSON:
```json
{
  "billing": {
    "cost_usd": 0.025,
    "balance_usd": 99.975,
    "currency": "USD"
  }
}
```
## Rate Limits Overview
| Tier | Requests/Minute | Concurrent Jobs |
|------|----------------|-----------------|
| Basic | 30 | 3 |
| Standard | 120 | 10 |
| Pro | 500 | 50 |
When you exceed your limit, you will receive a `429 Too Many Requests` status code along with a `Retry-After` header.
## Error Handling Fundamentals
| Status | Code | Description |
|--------|------|-------------|
| 401 | `unauthorized` | Invalid or missing API key |
| 402 | `payment_required` | Insufficient USD balance |
| 429 | `rate_limit_exceeded` | Too many requests |
| 503 | `service_unavailable` | Model is currently down or overloaded |
### DLQ & Retry Patterns
We recommend implementing an exponential backoff strategy for 429 and 503 errors.
## Production Checklist

1. **API Key Security**: Use environment variables (`FOTOHUB_API_KEY`) and secret managers (AWS Secrets Manager, Vault, Doppler). Never commit keys or expose them in browser bundles.
2. **Prepaid USD Balance Buffer**: Maintain an active reserve in your USD wallet (`wallet.available_usd`) and configure programmatic balance monitoring to avoid `402 INSUFFICIENT_FUNDS` interruptions.
3. **Cryptographic Webhook Verification**: Implement HMAC-SHA256 signature verification (`X-FotoHub-Signature`) with timestamp checking (within 300s window) to reject replay attacks.
4. **Idempotency Keys**: Attach unique `idempotency_key` (UUIDv4) headers to all generation and mutation requests to safeguard against duplicate charges during network retries.
5. **Circuit Breakers & Exponential Backoff**: Implement exponential backoff with full jitter for transient `429 RATE_LIMIT_EXCEEDED` and `503 MODEL_OVERLOADED` responses.
6. **Dead-Letter Queue (DLQ)**: Buffer incoming webhook events to Redis/RabbitMQ/SQS and route failed events to a DLQ for diagnostics and replay.
7. **Timeout Budgets**: Configure per-service timeout budgets (e.g., 30s for sync images, 300s for polling async video/3D tasks).
8. **BYOB Destination Setup**: Configure S3/Cloudflare R2 external destinations via `/v1/destinations` to avoid secondary downloads and egress fees.
9. **Graceful Degradation**: Fall back to secondary models (e.g., Seedream 5.0 to FLUX 2 or Gemini Flash) when primary endpoints experience localized queue spikes.
10. **Structured Logging & Telemetry**: Log `request_id`, `usd_charged`, and `latency_ms` without logging sensitive customer prompt data or PII.
11. **Content Moderation Pre-Flight**: Run basic prompt compliance checks locally before dispatching to avoid avoidable 400 validation rejects.
12. **Region & Network Latency**: Benchmark latency against `eu-central-1` (Frankfurt) and consider peering or co-locating compute workloads.
13. **Rate Limit Concurrency**: Monitor active concurrent jobs and distribute batch jobs with semaphore-bounded worker pools.
14. **Output Container Validation**: Always verify content types and download assets immediately or sync them to persistent cloud storage.
15. **Health Checks & Uptime Monitoring**: Subscribe to [status.fotohub.app](https://status.fotohub.app) webhooks for real-time cluster incident updates.

## Next Steps

- **[Image Generation](/api/image-generation)** — Generate photorealistic imagery with FLUX.1, Seedream 5.0, and Imagen 3.
- **[Video Generation](/api/video-generation)** — Create cinematic clips using Seedance 2.0 Pro and Kling v2.1.
- **[Chat & LLM](/api/chat-llm)** — Integrate Claude 3.5 Sonnet, DeepSeek V3, and Gemini 2.0 with tool calling.
- **[Audio & Speech](/api/music-audio)** — Synthesize background scores, Foley sound effects, and multilingual TTS.
- **[3D Generation](/api/3d-generation)** — Convert 2D photos into watertight textured GLB and Apple AR USDZ meshes.
- **[Cloud Compute](/api/cloud-computing)** — Provision dedicated NVIDIA A10G/T4 GPU instances and Firecracker sandboxes.
- **[Multimodal Recipes](/recipes/overview)** — Explore 11 end-to-end production automation blueprints.
