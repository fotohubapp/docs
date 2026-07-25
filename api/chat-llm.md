# Chat / LLM

FOTOhub provides two chat completion endpoints supporting multiple LLM providers.
The **OpenAI-compatible** endpoint follows the standard OpenAI chat completions format, making it a drop-in replacement for existing integrations.
The **premium** endpoint provides access to premium chat models with token-based billing for precise cost control.

Both endpoints support multi-turn conversations, system prompts, and return detailed billing information in every response. Streaming via Server-Sent Events is available on the OpenAI-compatible endpoint.

::: info OpenAI SDK Compatible
The `/v1/ai/chat/completions` endpoint is fully compatible with the OpenAI Python and TypeScript SDKs. Simply change the base URL to `https://apis.fotohub.app/v1/ai` and use your FOTOhub API key. See the [OpenAI Compatibility](#openai-sdk-compatibility) section below for drop-in usage examples.
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
| `messages` | array | **Yes** | -- | Array of message objects. Each message has a `role` (system, user, or assistant) and `content` (string or array for vision). System messages set behavior, user messages are inputs, assistant messages are for multi-turn context. |
| `temperature` | number | No | `0.7` | Controls randomness/creativity of the output. Range 0-2. Lower values (0.1-0.3) produce focused, deterministic output. Higher values (1.0-2.0) produce more creative, varied responses. |
| `max_tokens` | integer | No | `2048` | Maximum number of tokens to generate in the response. Limits output length. Does not guarantee exact length -- model may stop earlier at a natural completion point. |
| `stream` | boolean | No | `false` | Enable Server-Sent Events streaming. When true, partial message deltas are sent as they become available. See Streaming section below for parsing details. |

### Pricing Table -- Standard Models (Credit-Based)

All standard models use simple credit-based billing. 1 credit = 0.0375 PLN.

| Model | ID | Credits/req | ~PLN/1K tokens | Best for |
|-------|-----|:-----------:|:--------------:|----------|
| Gemini Flash | `gemini-flash` | 1 | 0.00045 | Fast responses, bulk tasks |
| Gemini Pro | `gemini-pro` | 2 | 0.0075 | Balanced quality, general use |
| GPT-4o | `gpt-4o` | 2 | 0.015 | Multimodal, vision, creative |
| Claude Sonnet | `claude-sonnet` | 2 | 0.018 | Code, analysis, reasoning |

::: tip Token-Based Billing
For per-token billing with precise cost control, use the [Premium Chat endpoint](#premium-chat-token-based-billing) (`/v1/ai/chat/claude`). The OpenAI-compatible endpoint documented here always bills flat credits (1 for `gemini-flash`, 2 otherwise).
:::

### Available Models

The authoritative, always-current list is returned by `GET /v1/models?category=text` — query it at runtime rather than hard-coding a list. In addition to the four credit-based models in the pricing table above, the endpoint accepts the following provider families (billed at the flat 1-2 credit rate). Some models require a subscription tier as noted.

#### Anthropic Claude

| Model | ID | Tier |
|-------|-----|------|
| Claude Haiku 4.5 | `claude-haiku-4-5` | — |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | — |
| Claude Opus 4.5 | `claude-opus-4-5` | — |
| Claude Opus 4.6 | `claude-opus-4-6` | — |

#### OpenAI GPT

| Model | ID | Tier |
|-------|-----|------|
| GPT-5.1 | `gpt-5.1` | Starter |
| GPT-5.4 | `gpt-5.4` | Starter |
| GPT-5.4 Pro | `gpt-5.4-pro` | Medium |

#### xAI Grok

| Model | ID | Tier |
|-------|-----|------|
| Grok 4 Fast | `grok-4-fast-reasoning` | Starter |
| Grok 4.1 Fast | `grok-4-1-fast-reasoning` | Starter |
| Grok 4.1 Fast (no reasoning) | `grok-4-1-fast-non-reasoning` | Starter |

#### Alibaba Qwen

| Model | ID | Tier |
|-------|-----|------|
| Qwen 3 Max | `qwen3-max` | — |
| Qwen Plus | `qwen-plus` | — |
| Qwen Flash | `qwen-flash` | — |

#### Google Gemini

| Model | ID | Tier |
|-------|-----|------|
| Gemini 2.5 Flash | `gemini-2.5-flash` | — |
| Gemini 2.5 Flash Lite | `gemini-2.5-flash-lite` | — |
| Gemini 2.5 Pro | `gemini-2.5-pro` | Starter |
| Gemini 3 Flash (preview) | `gemini-3-flash-preview` | Medium |
| Gemini 3.1 Pro (preview) | `gemini-3.1-pro-preview` | Medium |

::: warning Model IDs must match exactly
Passing an unrecognized `model` value does not error — the request is served by the default fast Gemini model instead. Always use an exact ID from `GET /v1/models` (or the tables above) to get the model you intend, and note that the credit-based endpoint uses dash notation (`claude-sonnet-4-6`), while the premium endpoint uses dots (`claude-sonnet-4.6`).
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

## Premium Chat (Token-Based Billing)

```
POST /v1/ai/chat/claude
```

**Auth:** API Key (Bearer token) | **Billing:** token-based (per-token pricing)

Access to FOTOhub's premium chat models — the Claude-class and Nova-class families — with precise token-based billing and per-token cost breakdowns. Ideal when you need exact cost control instead of flat per-request credits.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | string | No | `claude-sonnet-4.6` | Premium model ID. Must be one of the supported models listed in the pricing table below. Sending an unsupported ID returns `400 Unknown model`. |
| `messages` | array | **Yes** | -- | Array of message objects with `role` (user or assistant) and `content` (string or array for vision). Note: the system prompt is passed via the separate `system` parameter, not as a message. |
| `temperature` | number | No | `0.7` | Controls randomness. Range 0-1 for Claude models, 0-2 for Nova models. Lower = more deterministic. |
| `max_tokens` | integer | No | `4096` | Maximum tokens to generate. |
| `system` | string | No | -- | System prompt that defines the assistant's behavior and persona. Passed separately from messages. Supports multi-paragraph instructions. |

::: info Streaming
The premium endpoint returns a single complete response (no SSE streaming). For token-by-token streaming, use the [OpenAI-compatible endpoint](#openai-compatible-chat-completions) with `stream: true`.
:::

### Premium Models (Token-Based Pricing)

All models below use per-token PLN billing. Prices are the underlying per-1M-token rates; the final PLN charge is computed from your actual input/output token counts.

#### Claude

| Model | ID | Input ($/1M) | Output ($/1M) | Features |
|-------|-----|-------------|--------------|----------|
| Claude Sonnet 4.6 | `claude-sonnet-4.6` | $3.00 | $15.00 | Vision, 200K ctx, tool-use (default) |
| Claude Sonnet 4.5 | `claude-sonnet-4.5` | $3.00 | $15.00 | Vision, 200K ctx |
| Claude Sonnet 4 | `claude-sonnet-4` | $3.00 | $15.00 | Vision, 200K ctx |
| Claude Haiku 4.5 | `claude-haiku-4.5` | $0.80 | $4.00 | Vision, 200K ctx, fastest |

#### Nova

| Model | ID | Input ($/1M) | Output ($/1M) | Features |
|-------|-----|-------------|--------------|----------|
| Nova Premier | `nova-premier` | $2.50 | $10.00 | Best Nova, complex tasks |
| Nova Pro | `nova-pro` | $0.80 | $3.20 | Vision, reasoning, balanced |
| Nova Lite | `nova-lite` | $0.06 | $0.24 | Vision, fast, budget |
| Nova 2 Lite | `nova-2-lite` | $0.04 | $0.16 | Vision, new generation |
| Nova Micro | `nova-micro` | $0.035 | $0.14 | Text-only, cheapest |

::: tip Model IDs use dot notation
Premium model IDs use dots (`claude-sonnet-4.6`), unlike the credit-based endpoint which uses dashes (`claude-sonnet-4-6`). Use the exact ID from the table above.
:::

::: warning Token-Based Billing
Premium models use token-based billing, meaning costs are calculated per-token after generation completes. The `billing.cost_breakdown` field in the response provides exact input/output token counts and the resulting PLN charge. A minimum of 1 credit-equivalent is deducted per request.
:::

### Response

```json
{
  "id": "chatcmpl-fh-xyz789",
  "object": "chat.completion",
  "created": 1719849600,
  "model": "claude-sonnet-4.6",
  "billing": {
    "method": "credits",
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

The **OpenAI-compatible** endpoint (`/v1/ai/chat/completions`) supports streaming via Server-Sent Events (SSE). Set `stream: true` in your request to receive partial responses as they are generated. Each chunk contains a delta with the new content fragment. The stream ends with a `[DONE]` message. The premium endpoint (`/v1/ai/chat/claude`) returns a single complete response and does not stream.

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

```go [Go]
package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

func main() {
	payload := map[string]interface{}{
		"model":    "gemini-flash",
		"messages": []map[string]string{{"role": "user", "content": "Explain quantum computing"}},
		"stream":   true,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/chat/completions", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	scanner := bufio.NewScanner(resp.Body)
	var fullContent string

	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		data := strings.TrimPrefix(line, "data: ")
		if data == "[DONE]" {
			break
		}

		var chunk map[string]interface{}
		if err := json.Unmarshal([]byte(data), &chunk); err != nil {
			continue
		}

		choices := chunk["choices"].([]interface{})
		delta := choices[0].(map[string]interface{})["delta"].(map[string]interface{})
		if content, ok := delta["content"].(string); ok {
			fullContent += content
			fmt.Print(content)
		}
	}
	fmt.Println()
	fmt.Printf("Total: %s\n", fullContent)
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

### Token-Based (Premium Endpoint)

- Per-token pricing (input + output separately)
- Input tokens typically cheaper than output tokens
- Exact cost shown in the `cost_breakdown` field
- Minimum credit charge applies per request
- Cost = (input_tokens x input_rate) + (output_tokens x output_rate)

::: tip Estimating Costs
A typical conversational exchange (100-word prompt, 200-word response) uses approximately 75 input tokens + 150 output tokens = 225 total tokens. With gemini-flash, this costs approximately 0.0001 PLN. With premium `claude-sonnet-4.6`, approximately 0.012 PLN.
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
	payload := map[string]interface{}{
		"model":       "gemini-flash",
		"messages":    []map[string]string{{"role": "user", "content": "What is the capital of France?"}},
		"temperature": 0.3,
		"max_tokens":  256,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/chat/completions", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	json.Unmarshal(respBody, &data)

	choices := data["choices"].([]interface{})
	message := choices[0].(map[string]interface{})["message"].(map[string]interface{})
	fmt.Println(message["content"])

	usage := data["usage"].(map[string]interface{})
	fmt.Printf("Tokens used: %.0f\n", usage["total_tokens"])
	fmt.Printf("Credits used: %.0f\n", data["credits_used"])
}
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

Build multi-turn conversations by including the full message history in each request. The model uses previous messages as context to maintain coherent dialogue.

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

# Continue the conversation
messages.append({"role": "user", "content": "Now show me how to write to a file"})
response = requests.post(url, json={
    "model": "gemini-pro",
    "messages": messages,
    "temperature": 0.5,
    "max_tokens": 512
}, headers=headers)

data = response.json()
print(data["choices"][0]["message"]["content"])
```

```typescript [TypeScript]
interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

const url = "https://apis.fotohub.app/v1/ai/chat/completions";
const headers = {
  "Authorization": "Bearer fh_live_your_api_key",
  "Content-Type": "application/json",
};

const messages: Message[] = [
  { role: "system", content: "You are a helpful coding assistant. Be concise." },
  { role: "user", content: "How do I read a file in Python?" },
  { role: "assistant", content: "Use open() with a context manager:\n\nwith open('file.txt', 'r') as f:\n    content = f.read()" },
  { role: "user", content: "What about reading it line by line?" },
];

let response = await fetch(url, {
  method: "POST",
  headers,
  body: JSON.stringify({
    model: "gemini-pro",
    messages,
    temperature: 0.5,
    max_tokens: 512,
  }),
});

let data = await response.json();
console.log(data.choices[0].message.content);

// Append for next turn
messages.push(data.choices[0].message);
messages.push({ role: "user", content: "Now show me how to write to a file" });

response = await fetch(url, {
  method: "POST",
  headers,
  body: JSON.stringify({
    model: "gemini-pro",
    messages,
    temperature: 0.5,
    max_tokens: 512,
  }),
});

data = await response.json();
console.log(data.choices[0].message.content);
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

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	Temperature float64   `json:"temperature"`
	MaxTokens   int       `json:"max_tokens"`
}

func chat(messages []Message) (string, error) {
	payload := ChatRequest{
		Model:       "gemini-pro",
		Messages:    messages,
		Temperature: 0.5,
		MaxTokens:   512,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/chat/completions", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	json.Unmarshal(respBody, &data)

	choices := data["choices"].([]interface{})
	message := choices[0].(map[string]interface{})["message"].(map[string]interface{})
	return message["content"].(string), nil
}

func main() {
	messages := []Message{
		{Role: "system", Content: "You are a helpful coding assistant. Be concise."},
		{Role: "user", Content: "How do I read a file in Python?"},
		{Role: "assistant", Content: "Use open() with a context manager:\n\nwith open('file.txt', 'r') as f:\n    content = f.read()"},
		{Role: "user", Content: "What about reading it line by line?"},
	}

	reply, _ := chat(messages)
	fmt.Println(reply)

	// Continue conversation
	messages = append(messages, Message{Role: "assistant", Content: reply})
	messages = append(messages, Message{Role: "user", Content: "Now show me how to write to a file"})

	reply, _ = chat(messages)
	fmt.Println(reply)
}
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

### Premium Usage -- Claude with System Prompt

Use the premium endpoint for token-based billing with precise cost control. The `system` parameter is passed separately from messages.

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ai/chat/claude"
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
const response = await fetch("https://apis.fotohub.app/v1/ai/chat/claude", {
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
	payload := map[string]interface{}{
		"model":  "claude-sonnet-4.6",
		"system": "You are a senior software architect. Provide detailed, production-ready advice. Include code examples when relevant. Consider scalability, maintainability, and security.",
		"messages": []map[string]string{
			{"role": "user", "content": "Design a rate limiting system for a REST API that handles 10K req/s"},
		},
		"temperature": 0.4,
		"max_tokens":  4096,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/chat/claude", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	json.Unmarshal(respBody, &data)

	choices := data["choices"].([]interface{})
	message := choices[0].(map[string]interface{})["message"].(map[string]interface{})
	fmt.Println(message["content"])

	billing := data["billing"].(map[string]interface{})
	fmt.Println("\n--- Billing ---")
	fmt.Printf("Method: %s\n", billing["method"])

	breakdown := billing["cost_breakdown"].(map[string]interface{})
	fmt.Printf("Input tokens: %.0f\n", breakdown["input_tokens"])
	fmt.Printf("Output tokens: %.0f\n", breakdown["output_tokens"])
	fmt.Printf("Total cost: %v PLN\n", billing["pln_charged"])
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/chat/claude" \
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

### Vision -- Analyzing Images

Send images to vision-capable models by passing a content array with both text and image URL objects. Supported on Claude, GPT, Nova Lite/Pro, and Gemini models.

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ai/chat/completions"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}

response = requests.post(url, json={
    "model": "gpt-4o",
    "messages": [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Describe this image in detail. What objects are visible?"},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://example.com/photo.jpg"
                    }
                }
            ]
        }
    ],
    "max_tokens": 1024
}, headers=headers)

data = response.json()
print(data["choices"][0]["message"]["content"])
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
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Describe this image in detail. What objects are visible?" },
          {
            type: "image_url",
            image_url: {
              url: "https://example.com/photo.jpg",
            },
          },
        ],
      },
    ],
    max_tokens: 1024,
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content);
console.log(`Credits used: ${data.credits_used}`);
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
	payload := map[string]interface{}{
		"model": "gpt-4o",
		"messages": []map[string]interface{}{
			{
				"role": "user",
				"content": []map[string]interface{}{
					{"type": "text", "text": "Describe this image in detail. What objects are visible?"},
					{
						"type": "image_url",
						"image_url": map[string]string{
							"url": "https://example.com/photo.jpg",
						},
					},
				},
			},
		},
		"max_tokens": 1024,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/chat/completions", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	json.Unmarshal(respBody, &data)

	choices := data["choices"].([]interface{})
	message := choices[0].(map[string]interface{})["message"].(map[string]interface{})
	fmt.Println(message["content"])
	fmt.Printf("Credits used: %.0f\n", data["credits_used"])
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/chat/completions" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": [
          {"type": "text", "text": "Describe this image in detail. What objects are visible?"},
          {"type": "image_url", "image_url": {"url": "https://example.com/photo.jpg"}}
        ]
      }
    ],
    "max_tokens": 1024
  }'
```

:::

::: tip Vision-Capable Models
The following models support image input. On `/v1/ai/chat/completions`: `gpt-4o`, `claude-sonnet`, `gemini-pro`, `gemini-flash`. On the token-billed `/v1/ai/chat/claude` endpoint: `claude-sonnet-4.6`, `claude-sonnet-4.5`, `claude-sonnet-4`, `claude-haiku-4.5`, `nova-pro`, `nova-lite`, `nova-2-lite`.
:::

### Budget-Friendly with Nova

::: code-group

```python [Python]
import requests

url = "https://apis.fotohub.app/v1/ai/chat/claude"
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
const response = await fetch("https://apis.fotohub.app/v1/ai/chat/claude", {
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
	// Nova Micro — ultra-budget for classification, extraction, simple tasks
	payload := map[string]interface{}{
		"model": "nova-micro",
		"messages": []map[string]string{
			{"role": "user", "content": "Classify this review as positive/negative: 'Great product, fast shipping!'"},
		},
		"temperature": 0.1,
		"max_tokens":  10,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/chat/claude", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	json.Unmarshal(respBody, &data)

	choices := data["choices"].([]interface{})
	message := choices[0].(map[string]interface{})["message"].(map[string]interface{})
	fmt.Println(message["content"]) // "positive"

	billing := data["billing"].(map[string]interface{})
	fmt.Printf("Cost: %v PLN\n", billing["pln_charged"])
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/chat/claude" \
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

## OpenAI SDK Compatibility {#openai-sdk-compatibility}

The `/v1/ai/chat/completions` endpoint is a drop-in replacement for the OpenAI API. Use the official OpenAI SDK with your FOTOhub API key and base URL -- no code changes required beyond configuration.

::: code-group

```python [Python]
from openai import OpenAI

# Point the OpenAI client at FOTOhub
client = OpenAI(
    api_key="fh_live_your_api_key",
    base_url="https://apis.fotohub.app/v1/ai"
)

# Use exactly like the OpenAI API
response = client.chat.completions.create(
    model="gemini-flash",          # Any FOTOhub model ID
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain REST APIs in 3 sentences."}
    ],
    temperature=0.7,
    max_tokens=256,
    stream=False
)

print(response.choices[0].message.content)
print(f"Model: {response.model}")
print(f"Tokens: {response.usage.total_tokens}")
```

```typescript [TypeScript]
import OpenAI from "openai";

// Point the OpenAI client at FOTOhub
const client = new OpenAI({
  apiKey: "fh_live_your_api_key",
  baseURL: "https://apis.fotohub.app/v1/ai",
});

// Use exactly like the OpenAI API
const response = await client.chat.completions.create({
  model: "gemini-flash",          // Any FOTOhub model ID
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Explain REST APIs in 3 sentences." },
  ],
  temperature: 0.7,
  max_tokens: 256,
  stream: false,
});

console.log(response.choices[0].message.content);
console.log(`Model: ${response.model}`);
console.log(`Tokens: ${response.usage?.total_tokens}`);
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

// FOTOhub is OpenAI-compatible — use any HTTP client with the same payload format.
// For Go, use github.com/sashabaranov/go-openai or plain HTTP:
func main() {
	payload := map[string]interface{}{
		"model": "gemini-flash",
		"messages": []map[string]string{
			{"role": "system", "content": "You are a helpful assistant."},
			{"role": "user", "content": "Explain REST APIs in 3 sentences."},
		},
		"temperature": 0.7,
		"max_tokens":  256,
	}
	body, _ := json.Marshal(payload)

	// Same endpoint as OpenAI — just change the base URL
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/chat/completions", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	json.Unmarshal(respBody, &data)

	choices := data["choices"].([]interface{})
	message := choices[0].(map[string]interface{})["message"].(map[string]interface{})
	fmt.Println(message["content"])
}
```

```bash [cURL]
# Same format as OpenAI — just change the URL and API key
curl -X POST "https://apis.fotohub.app/v1/ai/chat/completions" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-flash",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Explain REST APIs in 3 sentences."}
    ],
    "temperature": 0.7,
    "max_tokens": 256
  }'
```

:::

::: info Migration from OpenAI
To migrate existing OpenAI integrations to FOTOhub:
1. Change `base_url` / `baseURL` to `https://apis.fotohub.app/v1/ai`
2. Replace your OpenAI API key with your FOTOhub key (`fh_live_...`)
3. Optionally change the `model` parameter to a FOTOhub model ID (or keep `gpt-4o` -- it works)

All standard OpenAI parameters are supported: `messages`, `temperature`, `max_tokens`, `stream`, `top_p`, `frequency_penalty`, `presence_penalty`.
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
