# Gabriel AI Orchestrator

Gabriel is FOTOhub's intelligent platform orchestrator — a lightweight AI layer that classifies user intent in natural language and routes requests to the optimal feature with pre-configured parameters.

Gabriel AI is a proprietary orchestration model optimized for intent classification. It's free to use and requires no authentication.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/ai/gabriel` | Classify intent and route |
| POST | `/v1/ai/translate` | Translate text |

---

## POST /v1/ai/gabriel

Classify user intent and return a routing decision with optimal model selection and credit estimation.

**Rate limit:** 30 requests/minute per IP

**Authentication:** None required (cost negligible)

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | User's natural language request (max 1000 chars) |
| `language` | string | No | Language code (default: `"pl"`) |
| `context` | object | No | Additional context for better classification |

### Response

| Field | Type | Description |
|-------|------|-------------|
| `action` | string | `"route"` \| `"answer"` \| `"error"` |
| `target` | string | Feature path to navigate to (e.g., `/generate/image`) |
| `params` | object | Pre-configured parameters for the target feature |
| `model_selected` | string | Optimal model for the request |
| `suggested_actions` | array | Alternative actions the user might want |
| `confidence` | float | Classification confidence (0.0 - 1.0) |
| `credits_estimated` | integer | Estimated credit cost |

### Actions

| Action | Description |
|--------|-------------|
| `route` | Navigate user to a FOTOhub feature with parameters |
| `answer` | Direct text response (FAQ, help) |
| `error` | Classification failed or timed out |

### Examples

::: code-group

```python [Python]
import httpx

response = httpx.post(
    "https://apis.fotohub.app/v1/ai/gabriel",
    json={
        "prompt": "Generate a photo of a sunset over mountains",
        "language": "en"
    }
)

result = response.json()
# {
#   "action": "route",
#   "target": "/generate/image",
#   "params": {
#     "model": "seedream-5-0-260128",
#     "prompt": "a sunset over mountains, golden hour, dramatic clouds"
#   },
#   "model_selected": "seedream-5-0-260128",
#   "confidence": 0.95,
#   "credits_estimated": 1
# }
```

```typescript [TypeScript]
const response = await fetch('https://apis.fotohub.app/v1/ai/gabriel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Make a 5-second video of a cat walking',
    language: 'en'
  })
});

const result = await response.json();
// {
//   "action": "route",
//   "target": "/generate/video",
//   "params": { "model": "seedance-2-0-fast", "duration": 5 },
//   "model_selected": "seedance-2-0-fast",
//   "confidence": 0.92,
//   "credits_estimated": 1
// }
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/gabriel \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Translate this text to English: Cześć, jak się masz?",
    "language": "pl"
  }'
```

:::

### Credit Estimation Table

Gabriel estimates costs for 30+ models:

#### Image Models

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

#### Video Models

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
Until July 6, 2026: All Seedance/Seedream models = **1 credit flat** regardless of resolution or duration.
:::

---

## POST /v1/ai/translate

Translate text between languages using FOTOhub's built-in translation engine.

**Rate limit:** 60 requests/minute per IP

**Authentication:** None required (called by edge functions with pre-validated auth)

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
import httpx

response = httpx.post(
    "https://apis.fotohub.app/v1/ai/translate",
    json={
        "text": "The quick brown fox jumps over the lazy dog",
        "target_language": "pl"
    }
)

result = response.json()
# {
#   "translated_text": "Szybki brązowy lis przeskakuje nad leniwym psem",
#   "source_language": "auto",
#   "target_language": "pl",
#   "character_count": 49
# }
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

### Error Handling

Both endpoints gracefully degrade on failure:

| Scenario | Behavior |
|----------|----------|
| Timeout (>5s for Gabriel, >10s for Translate) | Returns original text / error action |
| Model error | Falls back to error response, never throws |
| Rate limit exceeded | HTTP 429 with retry-after header |

### Integration Patterns

**Building a conversational assistant:**

```python
import httpx

def handle_user_message(message: str):
    # 1. Classify intent via Gabriel
    result = httpx.post(
        "https://apis.fotohub.app/v1/ai/gabriel",
        json={"prompt": message, "language": "en"}
    ).json()
    
    if result["action"] == "route":
        # 2. Route to the correct feature
        target = result["target"]
        params = result["params"]
        estimated_cost = result["credits_estimated"]
        
        # 3. Confirm with user before spending credits
        return {
            "message": f"I'll use {result['model_selected']} (~{estimated_cost} credits)",
            "action": target,
            "params": params
        }
    
    elif result["action"] == "answer":
        return {"message": result["answer"]}
    
    else:
        return {"message": "I couldn't understand that request."}
```

**Multi-language app with auto-translation:**

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
