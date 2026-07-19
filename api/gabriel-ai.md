# Gabriel AI Orchestrator

Gabriel is FOTOhub's intelligent platform orchestrator — a proprietary AI layer that classifies user intent, routes requests to optimal features, selects the best available model, builds prompts, and orchestrates multi-step workflows.

Gabriel AI is free to use for authenticated users and provides real-time suggestions, streaming responses, and proactive recommendations.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/ai/gabriel` | Bearer JWT | Classify intent and route (single-shot) |
| POST | `/v1/ai/gabriel/stream` | Bearer JWT | Streaming orchestration (SSE) |
| POST | `/v1/ai/gabriel/suggest` | None | Lightweight autocomplete suggestions |
| POST | `/v1/ai/gabriel/recommend` | None | Proactive context-aware recommendations |
| POST | `/v1/ai/translate` | None | Translate text |

---

## POST /v1/ai/gabriel

Classify user intent and return a routing decision with optimal model selection, credit estimation, and contextual tips.

**Rate limit:** 30 requests/minute per user

**Authentication:** Bearer JWT (from Supabase Auth)

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | User's natural language request (max 1000 chars) |
| `language` | string | No | Language code (default: `"pl"`) |
| `context` | object | No | Additional context for better classification |
| `enhance_prompt` | boolean | No | When true, Gabriel enriches the prompt using model-specific architecture knowledge |

#### Context Object

| Field | Type | Description |
|-------|------|-------------|
| `user_tier` | string | User's subscription tier (`"free"`, `"pro"`, `"business"`) |
| `credits_remaining` | integer | Current credit balance |
| `recent_tools` | string[] | Last 5 features the user used |
| `brand_id` | string | Active brand kit ID (for brand-aware suggestions) |

### Response

| Field | Type | Description |
|-------|------|-------------|
| `action` | string | `"route"` \| `"answer"` \| `"workflow"` \| `"error"` |
| `target` | string | Feature path to navigate to (e.g., `/generate/image`) |
| `params` | object | Pre-configured parameters for the target feature |
| `model_selected` | string | Optimal available model for the request |
| `suggested_actions` | array | Alternative actions the user might want |
| `confidence` | float | Classification confidence (0.0 - 1.0) |
| `credits_estimated` | integer | Estimated credit cost |
| `tips` | string[] | Contextual prompt engineering tips |

### Actions

| Action | Description |
|--------|-------------|
| `route` | Navigate user to a FOTOhub feature with pre-filled parameters |
| `answer` | Direct text response (FAQ, help, platform guidance) |
| `workflow` | Multi-step task requiring sequential operations |
| `error` | Classification failed or timed out |

### Examples

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="your-api-key")

result = client.gabriel.classify(
    prompt="Generate a cinematic photo of a sunset over mountains",
    language="en",
    enhance_prompt=True
)

print(result)
# {
#   "action": "route",
#   "target": "/generate/image",
#   "params": {
#     "model": "seedream-5-0-260128",
#     "prompt": "a sunset over mountains, cinematic color grading, golden hour, dramatic volumetric clouds, 8K, ultra detailed, shallow depth of field"
#   },
#   "model_selected": "seedream-5-0-260128",
#   "confidence": 0.95,
#   "credits_estimated": 1,
#   "tips": ["Seedream excels at photorealism — add '8K, sharp detail' for best results"]
# }
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: 'your-api-key' });

const result = await client.gabriel.classify({
  prompt: 'Make a 5-second video of a cat walking through a garden',
  language: 'en',
  context: { credits_remaining: 50 }
});

// {
//   "action": "route",
//   "target": "/generate/video",
//   "params": { "model": "seedance-2-0-fast", "duration": 5, "prompt": "..." },
//   "model_selected": "seedance-2-0-fast",
//   "confidence": 0.92,
//   "credits_estimated": 1,
//   "tips": ["Seedance: describe camera movement for dynamic videos"]
// }
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/gabriel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "Create a brand identity for my coffee shop",
    "language": "en",
    "enhance_prompt": true,
    "context": {
      "user_tier": "pro",
      "credits_remaining": 100
    }
  }'
```

:::

---

## POST /v1/ai/gabriel/stream

Streaming orchestration via Server-Sent Events (SSE). Provides progressive feedback as Gabriel processes the request — reduces perceived latency and enables real-time UX.

**Rate limit:** 30 requests/minute per user

**Authentication:** Bearer JWT

### Request Body

Same as `/v1/ai/gabriel` (prompt, language, context).

### SSE Event Types

Events are sent as `data: {json}\n\n` lines. The stream ends with `data: [DONE]\n\n`.

| Event Type | Description | Fields |
|------------|-------------|--------|
| `thinking` | Gabriel is processing | `content`: status message |
| `routing` | Intent classified, routing in progress | `tool`: tool being called, `content`: description |
| `result` | Final routing decision | Same fields as single-shot response |
| `error` | Processing failed | `message`: error description |

### Example

```typescript
const response = await fetch('https://apis.fotohub.app/v1/ai/gabriel/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    prompt: 'Generate a portrait photo with dramatic lighting',
    language: 'en'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;

      const event = JSON.parse(data);
      switch (event.type) {
        case 'thinking':
          console.log('Processing:', event.content);
          break;
        case 'routing':
          console.log('Using tool:', event.tool);
          break;
        case 'result':
          console.log('Route:', event.target, event.model_selected);
          console.log('Tips:', event.tips);
          break;
      }
    }
  }
}
```

### Stream Timeline

```
Client                    Gabriel
  |--- POST /stream ------->|
  |<-- thinking: "..." ------|  (immediate, <100ms)
  |<-- routing: {...} -------|  (after intent classification)
  |<-- result: {...} --------|  (final decision + tips)
  |<-- data: [DONE] ---------|
```

---

## POST /v1/ai/gabriel/suggest

Lightweight autocomplete suggestions. No LLM call — pure in-memory fuzzy matching for sub-50ms response times. Use this for keystroke-speed suggestions as the user types.

**Rate limit:** 60 requests/minute per IP

**Authentication:** None required

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `partial` | string | Yes | Partial user input (min 2 chars, max 200) |
| `tab` | string | No | Current tab context: `"all"`, `"image"`, `"video"`, `"audio"` |
| `page` | string | No | Current page path (e.g., `/generate/new`) |

### Response

| Field | Type | Description |
|-------|------|-------------|
| `suggestions` | array | Up to 5 ranked suggestions |

#### Suggestion Object

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | Suggestion text |
| `category` | string | `"prompt"` \| `"tip"` \| `"model"` \| `"feature"` |
| `target` | string | Optional navigation target |
| `icon` | string | Optional icon identifier |

### Example

::: code-group

```typescript [TypeScript]
// Debounce to 300ms for optimal UX
const suggestions = await fetch('https://apis.fotohub.app/v1/ai/gabriel/suggest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    partial: 'portrait photo',
    tab: 'image',
    page: '/generate/new'
  })
}).then(r => r.json());

// {
//   "suggestions": [
//     { "text": "portrait photo, studio lighting, shallow depth of field, 8K", "category": "prompt", "icon": "camera" },
//     { "text": "Try Seedream for best portrait quality (1 credit)", "category": "tip", "icon": "sparkles" },
//     { "text": "Use face enhancement for portrait shots", "category": "feature", "target": "/tools/enhance", "icon": "wand" }
//   ]
// }
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/gabriel/suggest \
  -H "Content-Type: application/json" \
  -d '{"partial": "sunset", "tab": "image"}'
```

:::

### Integration Pattern

```typescript
// Recommended: debounced suggestions with local fallback
let debounceTimer: number;

function onInputChange(value: string) {
  // Show local suggestions immediately
  showLocalSuggestions(value);

  // Fetch API suggestions after 300ms pause
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    if (value.length >= 2) {
      const { suggestions } = await fetchSuggestions(value);
      if (suggestions.length > 0) {
        replaceSuggestions(suggestions); // API results take priority
      }
    }
  }, 300);
}
```

---

## POST /v1/ai/gabriel/recommend

Proactive context-aware recommendations. Returns 1-3 relevant tips based on the user's current state. Template-based (no LLM call), responds in <100ms.

**Rate limit:** 30 requests/minute per IP

**Authentication:** None required

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | string | No | Current page path |
| `recent_actions` | string[] | No | Last few actions taken |
| `credits_remaining` | integer | No | User's credit balance |
| `has_brand` | boolean | No | Whether user has a brand kit |

### Response

| Field | Type | Description |
|-------|------|-------------|
| `recommendations` | array | Up to 3 contextual recommendations |

#### Recommendation Object

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | Recommendation text |
| `target` | string | Navigation target |
| `icon` | string | Icon identifier |

### Example

```bash
curl -X POST https://apis.fotohub.app/v1/ai/gabriel/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "page": "/generate/new",
    "credits_remaining": 5,
    "has_brand": false
  }'

# Response:
# {
#   "recommendations": [
#     { "text": "Low credits — Seedream gives best quality at 1 credit", "target": "/generate/new", "icon": "coins" },
#     { "text": "Create a Brand Kit for consistent style across generations", "target": "/brand", "icon": "palette" }
#   ]
# }
```

---

## POST /v1/ai/translate

Translate text between languages using FOTOhub's built-in translation engine.

**Rate limit:** 60 requests/minute per IP

**Authentication:** None required

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | Yes | Text to translate (max 10,000 chars) |
| `target_language` | string | Yes | Target language code (e.g., `"en"`, `"pl"`, `"de"`) |
| `source_language` | string | No | Source language (auto-detected if omitted) |

### Response

| Field | Type | Description |
|-------|------|-------------|
| `translated_text` | string | The translation |
| `source_language` | string | Detected/specified source language |
| `target_language` | string | Target language |
| `character_count` | integer | Character count of translated text |

### Examples

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="your-api-key")

result = client.translate(
    text="The quick brown fox jumps over the lazy dog",
    target_language="pl"
)
# { "translated_text": "Szybki brązowy lis przeskakuje nad leniwym psem", ... }
```

```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/v1/ai/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Bonjour le monde',
    target_language: 'en',
    source_language: 'fr'
  })
});

const { translated_text } = await response.json();
// "Hello world"
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hallo Welt",
    "target_language": "en"
  }'
```

:::

---

## Orchestrator Capabilities

Gabriel provides 10 function-calling tools for intelligent platform routing:

| Tool | Description |
|------|-------------|
| `route_to_image_generation` | Route to image generation with optimal model + params |
| `route_to_video_generation` | Route to video generation with model + duration |
| `route_to_chat` | Route to LLM chat with selected model |
| `route_to_music_generation` | Route to music/audio generation |
| `route_to_image_editing` | Route to image editing tools (upscale, bg remove, etc.) |
| `route_to_3d_generation` | Route to 3D model generation |
| `answer_question` | Direct text answer for FAQ/help |
| `route_to_brand` | Route to brand kit management |
| `route_to_tools` | Route to platform tools (face swap, lip sync, etc.) |
| `create_workflow` | Multi-step workflow for complex tasks |

### Dynamic Model Awareness

Gabriel only recommends models that are **currently available**. Model availability is checked against the platform's model status database (refreshed every 60 seconds). If a model is disabled or experiencing issues, Gabriel automatically selects the next best alternative.

### Prompt Enhancement

When `enhance_prompt: true` is set, Gabriel applies model-specific prompt engineering:

| Model Family | Enhancement Strategy |
|-------------|---------------------|
| Seedream | Adds photorealistic quality terms, resolution hints, optimized structure |
| Seedance | Adds camera movement, temporal progression, cinematic terms |
| FLUX | Adds detailed composition, style-specific tokens |
| Wan | Adds motion description, scene progression |

### Multi-Step Workflows

When a request requires multiple operations, Gabriel returns `action: "workflow"` with a steps array:

```json
{
  "action": "workflow",
  "params": {
    "steps": [
      { "action": "route_to_image_generation", "target": "/generate/new", "params": {"model": "seedream-5-0-260128", "prompt": "..."} },
      { "action": "route_to_image_editing", "target": "/tools/remove-bg", "params": {"tool": "background_removal"} },
      { "action": "route_to_brand", "target": "/brand", "params": {"action": "save_asset"} }
    ],
    "description": "Generate logo, remove background, save to brand kit"
  }
}
```

---

## Credit Estimation

Gabriel estimates costs for 30+ models:

### Image Models

| Model | Credits/image |
|-------|--------------|
| `dola-seedream-5-0-pro-260628` | 1.0 |
| `seedream-5-0-260128` | 1.0 |
| `seedream-4-5-251128` | 1.0 |
| `seedream-4-0-250828` | 1.0 |
| `flux-2-pro` | 1.5 |
| `flux-2-max` | 3.5 |
| `flux-2-flex` | 2.5 |
| `flux-2-klein-4b` | 0.7 |
| `flux-2-klein-9b` | 1.0 |
| `flux-1.1-pro-ultra` | 3.0 |
| `flux-1.1-pro` | 2.0 |
| `flux-kontext-pro` | 2.0 |
| `flux-kontext-max` | 4.0 |
| `wan2.6-t2i` | 1.5 |
| `wan2.5-t2i-preview` | 1.0 |
| `z-image-turbo` | 0.8 |
| `grok-imagine-image-pro` | 3.5 |
| `grok-imagine-image` | 1.0 |

### Video Models

| Model | Credits/generation |
|-------|-------------------|
| `seedance-2-0-pro` | 1.0 |
| `seedance-2-0-fast` | 1.0 |
| `seedance-2-0-mini` | 1.0 |
| `seedance-1-5-pro-251215` | 1.0 |
| `seedance-1-0-pro-250528` | 1.0 |
| `hailuo` | 8.0 |
| `sora-2-azure` | 8.0 |
| `sora-2-pro` | 19.0 |
| `wan2.6-t2v` | 10.0 |
| `grok-video` | 10.0 |
| `veo-3.1` | 15.0 |

::: tip PROMO PRICING
Seedance and Seedream models = **1 credit flat** regardless of resolution or duration.
:::

---

## Error Handling

All endpoints gracefully degrade on failure:

| Scenario | Behavior |
|----------|----------|
| Timeout (>5s for Gabriel, >10s for Translate) | Returns error action / original text |
| Model error | Auto-failover to backup model (transparent to caller) |
| Rate limit exceeded | HTTP 429 with `retry-after` header |
| Invalid JWT | HTTP 401 (for authenticated endpoints) |
| Missing prompt | HTTP 422 with validation details |

### Model Failover

Gabriel uses a multi-model failover chain. If the primary model is unavailable, it automatically falls back without returning an error:

```
Primary → Backup 1 → Backup 2
```

The response always succeeds unless all models in the chain are down.

---

## Integration Patterns

### Building a Conversational Assistant

```python
from fotohub import FotoHub

client = FotoHub(api_key="your-api-key")

def handle_user_message(message: str, user_context: dict):
    result = client.gabriel.classify(
        prompt=message,
        language="en",
        context=user_context,
        enhance_prompt=True
    )
    
    if result["action"] == "route":
        return {
            "message": f"I'll use {result['model_selected']} (~{result['credits_estimated']} credits)",
            "action": result["target"],
            "params": result["params"],
            "tips": result.get("tips", [])
        }
    elif result["action"] == "workflow":
        steps = result["params"]["steps"]
        return {
            "message": f"This requires {len(steps)} steps: {result['params']['description']}",
            "workflow": steps
        }
    elif result["action"] == "answer":
        return {"message": result["answer"]}
    else:
        return {"message": "I couldn't understand that request."}
```

### Real-time Suggestions with Streaming

```typescript
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: 'your-api-key' });

// 1. Autocomplete as user types (debounced 300ms)
const suggestions = await client.gabriel.suggest('portrait photo', {
  tab: 'image',
  page: '/generate/new'
});

// 2. Stream the final classification
const stream = await client.gabriel.stream({
  prompt: 'Generate a cinematic portrait with dramatic lighting',
  language: 'en'
});

for await (const event of stream) {
  if (event.type === 'thinking') updateUI('Processing...');
  if (event.type === 'routing') updateUI(`Using ${event.tool}...`);
  if (event.type === 'result') navigateTo(event.target, event.params);
}
```

### Proactive Onboarding Tips

```typescript
// Show contextual tips when user lands on a page
const { recommendations } = await fetch(
  'https://apis.fotohub.app/v1/ai/gabriel/recommend',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      page: '/generate/new',
      credits_remaining: user.credits,
      has_brand: user.brands.length > 0,
      recent_actions: ['image_generation', 'image_generation']
    })
  }
).then(r => r.json());

// Display as floating chips:
// "Try video generation — Seedance creates 5s clips for 1 credit"
// "Create a Brand Kit for consistent style"
```

### Multi-language App with Auto-translation

```typescript
async function translateUI(texts: string[], targetLang: string) {
  const results = await Promise.all(
    texts.map(text =>
      fetch('https://apis.fotohub.app/v1/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target_language: targetLang })
      }).then(r => r.json())
    )
  );
  return results.map(r => r.translated_text);
}
```
