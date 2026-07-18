# Chat / LLM

FOTOhub provides two chat completion endpoints supporting multiple LLM providers.
The **OpenAI-compatible** endpoint follows the standard OpenAI chat completions format, making it a drop-in replacement for existing integrations.
The **Bedrock-native** endpoint provides access to AWS Bedrock models with token-based billing for precise cost control.

Both endpoints support streaming via Server-Sent Events, multi-turn conversations, system prompts, and return detailed billing information in every response.

::: info OpenAI SDK Compatible
The `/v1/ai/chat/completions` endpoint is fully compatible with the OpenAI Python and TypeScript SDKs. Simply change the base URL to `https://apis.fotohub.app/v1/ai` and use your FOTOhub API key.
:::

---

## OpenAI-Compatible Chat Completions

```
POST /v1/ai/chat/completions
```

**Auth:** API Key (Bearer token) | **Billing:** 1-2 credits per request

Standard chat completions endpoint compatible with OpenAI SDKs. Supports Google Gemini, OpenAI GPT, and Anthropic Claude models with credit-based billing.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | string | No | `gemini-flash` | Model ID to use for completion. See pricing table below for available models. |
| `messages` | array | **Yes** | -- | Array of message objects. Each message has a `role` (system, user, or assistant) and `content` (string). System messages set behavior, user messages are inputs, assistant messages are for multi-turn context. |
| `temperature` | number | No | `0.7` | Controls randomness/creativity of the output. Range 0-2. Lower values (0.1-0.3) produce focused, deterministic output. Higher values (1.0-2.0) produce more creative, varied responses. |
| `max_tokens` | integer | No | `2048` | Maximum number of tokens to generate in the response. Limits output length. Does not guarantee exact length -- model may stop earlier at a natural completion point. |
| `stream` | boolean | No | `false` | Enable Server-Sent Events streaming. When true, partial message deltas are sent as they become available. See Streaming section below for parsing details. |

### Available Models

FOTOhub supports 30+ LLM models from 12 providers. All accessible through the same `/v1/ai/chat/completions` endpoint.

#### FOTOhub

| Model | ID | Description |
|-------|-----|-------------|
| FOTOhub AI | `fotohub-ai` | Default model — fast, capable, balanced |
| FOTOhub Coder | `fotohub-coder` | Optimized for code generation |

#### Anthropic Claude

| Model | ID | Description |
|-------|-----|-------------|
| Claude Haiku 4.5 | `claude-haiku-4-5` | Fast, cheap — good for simple tasks |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | Intelligent + fast — best value |
| Claude Opus 4.5 | `claude-opus-4-5` | Deep thinking, extended reasoning |
| Claude Opus 4.6 | `claude-opus-4-6` | Maximum capabilities — latest |

#### OpenAI

| Model | ID | Description |
|-------|-----|-------------|
| GPT-5.1 | `gpt-5.1` | Creative, multi-modal |

#### xAI Grok

| Model | ID | Description |
|-------|-----|-------------|
| Grok 4 Fast | `grok-4-fast-reasoning` | Fast reasoning, 2M context |
| Grok 4.1 Fast | `grok-4-1-fast-reasoning` | Latest reasoning, 2M context |
| Grok 4.1 Fast NR | `grok-4-1-fast-non-reasoning` | No reasoning overhead |

#### DeepSeek

| Model | ID | Description |
|-------|-----|-------------|
| DeepSeek V4 Flash | `deepseek-v4-flash-260425` | Fast, efficient |
| DeepSeek V3.2 | `deepseek-v3-2-251201` | Balanced |
| DeepSeek V4 Pro | `deepseek-v4-pro-260425` | Deep reasoning |
| DeepSeek R1 | `deepseek-r1` | Chain-of-thought reasoning |

#### Alibaba Qwen

| Model | ID | Description |
|-------|-----|-------------|
| Qwen Flash | `qwen-flash` | Efficient, cheap |
| Qwen Plus | `qwen-plus` | Reasoning-focused |
| Qwen 3 Max | `qwen3-max` | Maximum capabilities |

#### Moonshot Kimi

| Model | ID | Description |
|-------|-----|-------------|
| Kimi K2.5 | `kimi-k2.5` | Latest, intelligent |

#### Amazon Nova

| Model | ID | Description |
|-------|-----|-------------|
| Nova Micro | `nova-micro` | Ultra fast, ultra cheap |
| Nova Lite | `nova-lite` | Fast, cheap |
| Nova 2 Lite | `nova-2-lite` | New gen, fast |
| Nova Pro | `nova-pro` | Balanced, efficient |

#### Mistral AI

| Model | ID | Description |
|-------|-----|-------------|
| Mistral Large 3 | `mistral-large-3` | 675B parameters, maximum capabilities |

#### MiniMax

| Model | ID | Description |
|-------|-----|-------------|
| MiniMax M2.5 | `minimax-m2.5` | Creative, fast |

#### Z.AI

| Model | ID | Description |
|-------|-----|-------------|
| GLM 5 | `glm-5` | Intelligent, balanced |

::: tip Model Selection Guide
- **Fast & cheap**: `fotohub-ai`, `nova-micro`, `qwen-flash`, `claude-haiku-4-5`
- **Best balance**: `claude-sonnet-4-6`, `deepseek-v3-2-251201`, `qwen-plus`
- **Maximum quality**: `claude-opus-4-6`, `gpt-5.1`, `mistral-large-3`
- **Reasoning/thinking**: `deepseek-r1`, `deepseek-v4-pro-260425`, `grok-4-fast-reasoning`, `claude-opus-4-5`
- **Code generation**: `fotohub-coder`, `claude-sonnet-4-6`, `deepseek-v4-flash-260425`
:::

### Response

```json
{
  "id": "chatcmpl-fh-abc123",
  "object": "chat.completion",
  "created": 1719849600,
  "model": "gemini-flash",
  "credits_used": 1,
  "billing": {
    "method": "credits",
    "credits_used": 1,
    "pln_charged": 0.0375
  },
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The Eiffel Tower is a wrought-iron lattice tower located on the Champ de Mars in Paris, France. It was constructed from 1887 to 1889 as the centerpiece of the 1889 World's Fair."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175
  }
}
```

---

## Bedrock-Native Chat (Token-Based Billing)

```
POST /v1/ai/chat/bedrock
```

**Auth:** API Key (Bearer token) | **Billing:** token-based (per-token pricing)

Direct access to AWS Bedrock models including Claude (Anthropic) and Nova (Amazon) families. Uses precise token-based billing with per-token cost breakdowns.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | string | **Yes** | -- | Bedrock model ID. Must be one of the supported models listed in the pricing table below. No default -- model must be explicitly specified. |
| `messages` | array | **Yes** | -- | Array of message objects with `role` (user or assistant) and `content` (string). Note: system messages are passed via the separate `system` parameter for Bedrock models. |
| `temperature` | number | No | `0.7` | Controls randomness. Range 0-1 for Claude models, 0-2 for Nova models. Lower = more deterministic. |
| `max_tokens` | integer | No | `4096` | Maximum tokens to generate. Claude models support up to 8192. Nova models support up to 4096. |
| `system` | string | No | -- | System prompt that defines the assistant's behavior and persona. Passed separately from messages for Bedrock's native format. Supports multi-paragraph instructions. |
| `stream` | boolean | No | `false` | Enable SSE streaming for real-time token delivery. Same format as the OpenAI-compatible endpoint. |

### Bedrock Models (Token-Based Pricing)

| Model | ID | Price (per 1K tokens) | Credits |
|-------|-----|----------------------|---------|
| Claude Sonnet 4.6 | `claude-sonnet-4.6` | 0.054 PLN | 2 ::: tip Recommended |
| Claude Sonnet 4.5 | `claude-sonnet-4.5` | 0.054 PLN | 2 |
| Claude Sonnet 4 | `claude-sonnet-4` | 0.054 PLN | 2 |
| Claude Haiku 4.5 | `claude-haiku-4.5` | 0.015 PLN | 1 |
| Claude Opus 4.6 | `claude-opus-4.6` | 0.27 PLN | 5 |
| Nova Pro | `nova-pro` | 0.012 PLN | 1 |
| Nova Lite | `nova-lite` | 0.0009 PLN | 1 |
| Nova Micro | `nova-micro` | 0.000525 PLN | 1 |
| Nova Premier | `nova-premier` | 0.0375 PLN | 2 |
| Nova 2 Lite | `nova-2-lite` | 0.0006 PLN | 1 |

::: warning Token-Based Billing
Bedrock models use token-based billing, meaning costs are calculated per-token after generation completes. The `billing.cost_breakdown` field in the response provides exact input/output token counts and the resulting PLN charge. Credits are also deducted as a minimum charge per request.
:::

### Response

```json
{
  "id": "chatcmpl-bedrock-xyz789",
  "object": "chat.completion",
  "created": 1719849600,
  "model": "claude-sonnet-4.6",
  "billing": {
    "method": "tokens",
    "credits_used": 2,
    "pln_charged": 0.0945,
    "cost_breakdown": {
      "input_tokens": 150,
      "output_tokens": 500,
      "total_tokens": 650,
      "cost_pln": 0.0945
    }
  },
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Here is a detailed analysis of the architectural patterns used in your codebase..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "input_tokens": 150,
    "output_tokens": 500,
    "total_tokens": 650
  }
}
```

---

## Streaming

Both endpoints support streaming via Server-Sent Events (SSE). Set `stream: true` in your request to receive partial responses as they are generated. Each chunk contains a delta with the new content fragment. The stream ends with a `[DONE]` message.

::: info SSE Format
Each event is prefixed with `data: ` followed by a JSON object. The final event is `data: [DONE]`. Events are separated by two newlines. The `billing` field is included only in the final chunk before [DONE].
:::

### Stream Chunk Format

```
data: {"id":"chatcmpl-fh-abc123","object":"chat.completion.chunk","model":"gemini-flash","choices":[{"index":0,"delta":{"role":"assistant","content":"The"},"finish_reason":null}]}

data: {"id":"chatcmpl-fh-abc123","object":"chat.completion.chunk","model":"gemini-flash","choices":[{"index":0,"delta":{"content":" Eiffel"},"finish_reason":null}]}

data: {"id":"chatcmpl-fh-abc123","object":"chat.completion.chunk","model":"gemini-flash","choices":[{"index":0,"delta":{"content":" Tower"},"finish_reason":null}]}

data: {"id":"chatcmpl-fh-abc123","object":"chat.completion.chunk","model":"gemini-flash","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"billing":{"method":"credits","credits_used":1,"pln_charged":0.0375},"usage":{"prompt_tokens":25,"completion_tokens":48,"total_tokens":73}}

data: [DONE]
```

### Streaming Example -- SSE Parsing

::: code-group

```python [Python]
import requests
import json

url = "https://apis.fotohub.app/v1/ai/chat/completions"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {
    "model": "gemini-flash",
    "messages": [{"role": "user", "content": "Explain quantum computing"}],
    "stream": True
}

response = requests.post(url, json=payload, headers=headers, stream=True)

full_content = ""
for line in response.iter_lines():
    if line:
        line = line.decode("utf-8")
        if line.startswith("data: "):
            data = line[6:]  # Remove "data: " prefix
            if data == "[DONE]":
                break
            chunk = json.loads(data)
            delta = chunk["choices"][0]["delta"]
            if "content" in delta:
                full_content += delta["content"]
                print(delta["content"], end="", flush=True)

print()  # Final newline
print(f"Total: {full_content}")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "gemini-flash",
    messages: [{ role: "user", content: "Explain quantum computing" }],
    stream: true,
  }),
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();
let fullContent = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value, { stream: true });
  const lines = text.split("\n");

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6);
      if (data === "[DONE]") break;

      const chunk = JSON.parse(data);
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullContent += content;
        process.stdout.write(content);
      }
    }
  }
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/chat/completions" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -N \
  -d '{
    "model": "gemini-flash",
    "messages": [
      {"role": "user", "content": "Explain quantum computing"}
    ],
    "stream": true
  }'
```

:::

---

## Token Counting & Billing

Tokens are the fundamental unit of text processing for LLMs. A token is approximately 4 characters or 0.75 words in English. Both input (prompt) and output (completion) tokens are counted toward billing.

### Credit-Based (OpenAI-Compatible Endpoint)

- Fixed credit cost per request (1-2 credits)
- PLN charge calculated from total tokens used
- Credits deducted immediately on request start
- If generation fails, credits are refunded
- Token counts included in response for transparency

### Token-Based (Bedrock Endpoint)

- Per-token pricing (input + output separately)
- Input tokens typically cheaper than output tokens
- Exact cost shown in the `cost_breakdown` field
- Minimum credit charge applies per request
- Cost = (input_tokens x input_rate) + (output_tokens x output_rate)

::: tip Estimating Costs
A typical conversational exchange (100-word prompt, 200-word response) uses approximately 75 input tokens + 150 output tokens = 225 total tokens. With gemini-flash, this costs approximately 0.0001 PLN. With claude-sonnet-4.6 on Bedrock, approximately 0.012 PLN.
:::

---

## Code Examples

### Basic Chat Completion

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ai/chat/completions"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}

response = requests.post(url, json={
    "model": "gemini-flash",
    "messages": [
        {"role": "user", "content": "What is the capital of France?"}
    ],
    "temperature": 0.3,
    "max_tokens": 256
}, headers=headers)

data = response.json()
print(data["choices"][0]["message"]["content"])
print(f"Tokens used: {data['usage']['total_tokens']}")
print(f"Credits used: {data['credits_used']}")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "gemini-flash",
    messages: [
      { role: "user", content: "What is the capital of France?" }
    ],
    temperature: 0.3,
    max_tokens: 256,
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content);
console.log(`Tokens used: ${data.usage.total_tokens}`);
console.log(`Credits used: ${data.credits_used}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/chat/completions" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-flash",
    "messages": [
      {"role": "user", "content": "What is the capital of France?"}
    ],
    "temperature": 0.3,
    "max_tokens": 256
  }'
```

:::

### Multi-Turn Conversation

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ai/chat/completions"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}

# Build conversation history
messages = [
    {"role": "system", "content": "You are a helpful coding assistant. Be concise."},
    {"role": "user", "content": "How do I read a file in Python?"},
    {"role": "assistant", "content": "Use open() with a context manager:\n\nwith open('file.txt', 'r') as f:\n    content = f.read()"},
    {"role": "user", "content": "What about reading it line by line?"}
]

response = requests.post(url, json={
    "model": "gemini-pro",
    "messages": messages,
    "temperature": 0.5,
    "max_tokens": 512
}, headers=headers)

data = response.json()
print(data["choices"][0]["message"]["content"])

# Append assistant response for next turn
messages.append(data["choices"][0]["message"])
```

```typescript [TypeScript]
interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

const messages: Message[] = [
  { role: "system", content: "You are a helpful coding assistant. Be concise." },
  { role: "user", content: "How do I read a file in Python?" },
  { role: "assistant", content: "Use open() with a context manager:\n\nwith open('file.txt', 'r') as f:\n    content = f.read()" },
  { role: "user", content: "What about reading it line by line?" },
];

const response = await fetch("https://apis.fotohub.app/v1/ai/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "gemini-pro",
    messages,
    temperature: 0.5,
    max_tokens: 512,
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content);

// Append for next turn
messages.push(data.choices[0].message);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/chat/completions" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-pro",
    "messages": [
      {"role": "system", "content": "You are a helpful coding assistant."},
      {"role": "user", "content": "How do I read a file in Python?"},
      {"role": "assistant", "content": "Use open() with a context manager."},
      {"role": "user", "content": "What about reading it line by line?"}
    ],
    "temperature": 0.5,
    "max_tokens": 512
  }'
```

:::

### Bedrock with System Prompt

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ai/chat/bedrock"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}

response = requests.post(url, json={
    "model": "claude-sonnet-4.6",
    "system": """You are a senior software architect. Provide detailed,
production-ready advice. Include code examples when relevant.
Consider scalability, maintainability, and security in all recommendations.""",
    "messages": [
        {"role": "user", "content": "Design a rate limiting system for a REST API that handles 10K req/s"}
    ],
    "temperature": 0.4,
    "max_tokens": 4096
}, headers=headers)

data = response.json()
content = data["choices"][0]["message"]["content"]
billing = data["billing"]

print(content)
print(f"\n--- Billing ---")
print(f"Method: {billing['method']}")
print(f"Input tokens: {billing['cost_breakdown']['input_tokens']}")
print(f"Output tokens: {billing['cost_breakdown']['output_tokens']}")
print(f"Total cost: {billing['pln_charged']} PLN")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/chat/bedrock", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4.6",
    system: `You are a senior software architect. Provide detailed,
production-ready advice. Include code examples when relevant.
Consider scalability, maintainability, and security.`,
    messages: [
      { role: "user", content: "Design a rate limiting system for a REST API that handles 10K req/s" }
    ],
    temperature: 0.4,
    max_tokens: 4096,
  }),
});

const data = await response.json();
const content = data.choices[0].message.content;
const billing = data.billing;

console.log(content);
console.log("\n--- Billing ---");
console.log(`Method: ${billing.method}`);
console.log(`Input tokens: ${billing.cost_breakdown.input_tokens}`);
console.log(`Output tokens: ${billing.cost_breakdown.output_tokens}`);
console.log(`Total cost: ${billing.pln_charged} PLN`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/chat/bedrock" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4.6",
    "system": "You are a senior software architect. Provide production-ready advice.",
    "messages": [
      {"role": "user", "content": "Design a rate limiting system for a REST API"}
    ],
    "temperature": 0.4,
    "max_tokens": 4096
  }'
```

:::

### Budget-Friendly with Nova

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ai/chat/bedrock"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}

# Nova Micro — ultra-budget option for simple tasks
# At 0.000525 PLN/1K tokens, process 1M tokens for ~0.53 PLN
response = requests.post(url, json={
    "model": "nova-micro",
    "messages": [
        {"role": "user", "content": "Classify this review as positive/negative: 'Great product, fast shipping!'"}
    ],
    "temperature": 0.1,  # Low temp for classification
    "max_tokens": 10
}, headers=headers)

data = response.json()
print(data["choices"][0]["message"]["content"])  # "positive"
print(f"Cost: {data['billing']['pln_charged']} PLN")  # ~0.000005 PLN
```

```typescript [TypeScript]
// Nova Micro — ultra-budget for classification, extraction, simple tasks
const response = await fetch("https://apis.fotohub.app/v1/ai/chat/bedrock", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "nova-micro",
    messages: [
      { role: "user", content: "Classify this review as positive/negative: 'Great product, fast shipping!'" }
    ],
    temperature: 0.1,
    max_tokens: 10,
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content); // "positive"
console.log(`Cost: ${data.billing.pln_charged} PLN`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/chat/bedrock" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nova-micro",
    "messages": [
      {"role": "user", "content": "Classify: positive or negative? Great product!"}
    ],
    "temperature": 0.1,
    "max_tokens": 10
  }'
```

:::

---

## Error Responses

### 400 -- Invalid Request

```json
{
  "error": {
    "type": "invalid_request",
    "message": "messages array is required and must contain at least one message",
    "code": "missing_messages"
  }
}
```

### 402 -- Insufficient Credits

```json
{
  "error": {
    "type": "billing_error",
    "message": "Insufficient credits. Required: 2, available: 0",
    "code": "insufficient_credits",
    "credits_required": 2,
    "credits_available": 0
  }
}
```

### 429 -- Rate Limited

```json
{
  "error": {
    "type": "rate_limit",
    "message": "Rate limit exceeded. Please retry after 2 seconds.",
    "code": "rate_limited",
    "retry_after": 2
  }
}
```

---

## Rate Limits

::: danger Rate Limits by Tier
- **Free tier:** 10 requests/minute, 100 requests/day
- **Pro tier:** 60 requests/minute, 5,000 requests/day
- **Enterprise:** Custom limits -- contact support
- Streaming requests count as 1 request regardless of duration
:::
