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

**Auth:** API Key (Bearer token) | **Billing:** per token

Standard chat completions endpoint compatible with OpenAI SDKs. Supports Google Gemini, OpenAI GPT, and Anthropic Claude models.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | string | No | `gemini-flash` | Model ID to use for completion. See pricing table below for available models. |
| `messages` | array | **Yes** | -- | Array of message objects. Each message has a `role` (system, user, or assistant) and `content` (string or array for vision). System messages set behavior, user messages are inputs, assistant messages are for multi-turn context. |
| `temperature` | number | No | -- | **Accepted but ignored.** See the compatibility note below. |
| `max_tokens` | integer | No | -- | **Accepted but ignored.** See the compatibility note below. |
| `stream` | boolean | No | -- | **Accepted but ignored.** This endpoint does not stream; see [Streaming](#streaming). |

::: warning Only `model` and `messages` are read
This endpoint exists for drop-in OpenAI SDK compatibility, so it accepts the full
OpenAI request body without erroring — but it only acts on `model` and
`messages`. `temperature`, `max_tokens`, `stream`, `top_p`,
`frequency_penalty` and `presence_penalty` are discarded silently: sending them
is harmless, but they will not change the output. If you need sampling control
or streaming, use the premium endpoint (`/v1/ai/chat/claude`) or the agent
endpoint (`/v1/ai/agent/stream`) instead.
:::

### Pricing Table

Billed on the tokens you actually use, in credits, at the per-1M rates below. The
charge is fractional: a short reply costs a fraction of one credit rather than
rounding up to a whole one. When your included credits are exhausted the request
is billed from your USD wallet instead.

| Model | ID | Credits/1M in | Credits/1M out | Best for |
|-------|-----|:-------------:|:--------------:|----------|
| Gemini Flash | `gemini-flash` | 20 | 166.7 | Fast responses, bulk tasks |
| Gemini Pro | `gemini-pro` | 83 | 667 | Balanced quality, general use |
| GPT-4o | `gpt-4o` | 200 | 1000 | Multimodal, vision, creative |
| Claude Sonnet | `claude-sonnet` | 200 | 1000 | Code, analysis, reasoning |

Output tokens cost 4-8x input tokens, which is why the two columns are quoted
separately -- a single blended number would misprice any workload that is not
half prompt and half completion. A 25-token prompt with a 150-token answer on
`gemini-flash` costs `25/1e6 * 20 + 150/1e6 * 166.7` = **0.0255 credits**.

The exact amount charged comes back on every response in `billing.credits_used`,
with `billing.basis: "tokens"` confirming it was derived from real token counts.

### Available Models

This endpoint accepts exactly the four IDs in the pricing table above. Any other
value returns `400 Unknown chat model` listing the supported set -- it is never
silently substituted with a default, so a typo fails loudly instead of quietly
serving you a different model.

`GET /v1/models?category=text` returns the same four. The premium endpoint
(`/v1/ai/chat/claude`) serves a different and larger family of models with their
own IDs in dot notation (`claude-sonnet-4.6`); those IDs are not accepted here.

### Response

```json
{
  "id": "chatcmpl-fh-abc123",
  "object": "chat.completion",
  "created": 1719849600,
  "model": "gemini-flash",
  "credits_used": 0.0255,
  "billing": {
    "method": "credits",
    "credits_used": 0.0255,
    "usd_charged": 0,
    "basis": "tokens"
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

Access to FOTOhub's premium chat models — the Claude-class and Nova-class families — with precise token-based billing and per-token cost breakdowns. Both endpoints bill on real token counts; the difference is that this one prices natively in USD and returns a `cost_breakdown`, while the OpenAI-compatible endpoint prices in credits.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | string | No | `claude-sonnet-4.6` | Premium model ID. Must be one of the supported models listed in the pricing table below. Sending an unsupported ID returns `400 Unknown model`. |
| `messages` | array | **Yes** | -- | Array of message objects with `role` (user or assistant) and `content` (string or array for vision). Note: the system prompt is passed via the separate `system` parameter, not as a message. |
| `temperature` | number | No | `0.7` | Controls randomness. Range 0-1 for Claude models, 0-2 for Nova models. Lower = more deterministic. |
| `max_tokens` | integer | No | `4096` | Maximum tokens to generate. |
| `system` | string | No | -- | System prompt that defines the assistant's behavior and persona. Passed separately from messages. Supports multi-paragraph instructions. |

::: info Streaming
The premium endpoint returns a single complete response (no SSE streaming). For
token-by-token streaming use [`POST /v1/ai/agent/stream`](#post-v1-ai-agent-stream)
— it serves the same premium models. The OpenAI-compatible endpoint does **not**
stream either, regardless of `stream: true`.
:::

### Premium Models (Token-Based Pricing)

All models below are billed natively in USD, per token. The figures below are the base per-1M-token USD rates; the amount charged is computed from your actual input/output token counts plus the platform margin and returned as `cost_usd`. Because the calculation never leaves USD it does not move with the PLN exchange rate, and this endpoint's `billing` object carries no PLN field at all.

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
Premium models use token-based billing, meaning costs are calculated per-token after generation completes. The `billing.cost_breakdown` field in the response provides exact input/output token counts and the resulting USD charge in `cost_usd`. A minimum of 1 credit-equivalent is deducted per request.

`usd_charged` is what actually left your **wallet**: it is `0` while the request is covered by
included credits (`method: "credits"`) and equals the operation price once credits run out
(`method: "wallet"`). `cost_breakdown.cost_usd` is the token cost either way — read that one to
attribute spend per request.
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
    "usd_charged": 0,
    "cost_breakdown": {
      "input_tokens": 150,
      "output_tokens": 500,
      "total_tokens": 650,
      "cost_usd": 0.011925
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

::: danger The chat endpoints do not stream
Neither `/v1/ai/chat/completions` nor `/v1/ai/chat/claude` streams. Both return
one complete JSON body. `stream: true` on the OpenAI-compatible endpoint is
accepted and then ignored — you will receive an ordinary `chat.completion`
response, **not** an SSE stream, and there is no `chat.completion.chunk` object
anywhere in this API.

The only streaming endpoint is **`POST /v1/ai/agent/stream`**, documented below.
:::

### POST /v1/ai/agent/stream

The streaming twin of `POST /v1/ai/agent`. Same request contract, same billing,
same single-turn semantics — the caller still drives each round of tool use. The
difference is that the assistant turn arrives as SSE frames instead of one JSON
body, so a CLI can render text as it is produced.

**Models** (a subset of the premium catalog — only models supporting tool-use):
`claude-sonnet-4.6` (default), `claude-sonnet-4.5`, `claude-sonnet-4`,
`claude-haiku-4.5`. An unlisted ID returns `400`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `messages` | array | **Yes** | Conversation so far. Empty or missing returns `400`. |
| `model` | string | No | One of the four IDs above. Default `claude-sonnet-4.6`. |
| `tools` | array | No | Tool definitions. Must be a list if present, else `400`. |

Authentication is checked **before** the stream opens, so an invalid key is a
plain `401` rather than an error frame you have to parse.

### Frame Format

Each frame is `data: ` followed by one JSON object, separated by two newlines.
The stream terminates with `data: [DONE]`. Note this is **not** the OpenAI chunk
format — frames are discriminated by a `type` field, not by `choices[].delta`.

| `type` | Payload |
|--------|---------|
| `text_delta` | `text` — the next fragment of assistant text |
| `tool_use` | `id`, `name`, `input` — emitted once the tool call is fully accumulated, never partially |
| `done` | `stop_reason`, `usage`, `billing` — always the last frame before `[DONE]` |
| `error` | `message` — terminal; `[DONE]` still follows |

```
data: {"type":"text_delta","text":"Let me check"}

data: {"type":"text_delta","text":" the weather."}

data: {"type":"tool_use","id":"toolu_01A","name":"get_weather","input":{"city":"Warsaw"}}

data: {"type":"done","stop_reason":"tool_use","usage":{"input_tokens":150,"output_tokens":48,"total_tokens":198},"billing":{"method":"credits","credits_used":2,"usd_charged":0}}

data: [DONE]
```

::: warning Disconnecting early does not avoid the charge
Billing runs exactly once, on completion, from the accumulated token usage. If
your client disconnects mid-stream the turn is still billed for what the model
produced — those tokens were generated and charged upstream either way. This is
the same behaviour as the blocking route.
:::

### Streaming Example -- SSE Parsing

::: code-group

```python [Python]
import requests
import json

url = "https://apis.fotohub.app/v1/ai/agent/stream"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {
    "model": "claude-sonnet-4.6",
    "messages": [{"role": "user", "content": "Explain quantum computing"}],
}

response = requests.post(url, json=payload, headers=headers, stream=True)

full_content = ""
for line in response.iter_lines():
    if not line:
        continue
    line = line.decode("utf-8")
    if not line.startswith("data: "):
        continue
    data = line[6:]  # Remove "data: " prefix
    if data == "[DONE]":
        break

    frame = json.loads(data)
    if frame["type"] == "text_delta":
        full_content += frame["text"]
        print(frame["text"], end="", flush=True)
    elif frame["type"] == "tool_use":
        print(f"\n[tool] {frame['name']}({frame['input']})")
    elif frame["type"] == "done":
        print(f"\nstop_reason={frame['stop_reason']} "
              f"credits={frame['billing']['credits_used']} "
              f"usd={frame['billing']['usd_charged']}")
    elif frame["type"] == "error":
        raise RuntimeError(frame["message"])
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/agent/stream", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4.6",
    messages: [{ role: "user", content: "Explain quantum computing" }],
  }),
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();
let fullContent = "";
// Frames are split by a blank line, and a single read() can end mid-frame --
// buffer until a separator is seen rather than parsing each chunk directly.
let buffer = "";

outer: while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const frames = buffer.split("\n\n");
  buffer = frames.pop() ?? "";

  for (const raw of frames) {
    if (!raw.startsWith("data: ")) continue;
    const data = raw.slice(6).trim();
    if (data === "[DONE]") break outer;

    const frame = JSON.parse(data);
    if (frame.type === "text_delta") {
      fullContent += frame.text;
      process.stdout.write(frame.text);
    } else if (frame.type === "tool_use") {
      console.log(`\n[tool] ${frame.name}`, frame.input);
    } else if (frame.type === "done") {
      console.log(`\nstop_reason=${frame.stop_reason}`, frame.billing);
    } else if (frame.type === "error") {
      throw new Error(frame.message);
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
		"model":    "claude-sonnet-4.6",
		"messages": []map[string]string{{"role": "user", "content": "Explain quantum computing"}},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/agent/stream", bytes.NewReader(body))
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

		var frame map[string]interface{}
		if err := json.Unmarshal([]byte(data), &frame); err != nil {
			continue
		}

		switch frame["type"] {
		case "text_delta":
			text, _ := frame["text"].(string)
			fullContent += text
			fmt.Print(text)
		case "tool_use":
			fmt.Printf("\n[tool] %v %v\n", frame["name"], frame["input"])
		case "done":
			fmt.Printf("\nstop_reason=%v billing=%v\n", frame["stop_reason"], frame["billing"])
		case "error":
			panic(frame["message"])
		}
	}
	fmt.Println()
	fmt.Printf("Total: %s\n", fullContent)
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/agent/stream" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -N \
  -d '{
    "model": "claude-sonnet-4.6",
    "messages": [
      {"role": "user", "content": "Explain quantum computing"}
    ]
  }'
```

:::

---

## Token Counting & Billing

Tokens are the fundamental unit of text processing for LLMs. A token is approximately 4 characters or 0.75 words in English. Both input (prompt) and output (completion) tokens are counted toward billing.

### Token-Based USD Wallet Billing

- Per-token pricing in USD (input and output rated separately at 1:1 provider cost)
- Billed directly from your prepaid USD wallet balance
- Billed **after** the completion, from the token counts the model reports, because they are not knowable before the call
- A pre-flight check validates that your wallet has available funds before dispatching to the provider
- Nothing is charged if the provider errors, so there is no refund to wait for
- Exact cost and remaining balance are returned in the `billing` object

::: tip Estimating Costs
A typical conversational exchange (100-word prompt, 200-word response) uses approximately 75 input tokens + 150 output tokens = 225 total tokens. On `gemini-flash` that costs ~$0.00003; on `claude-sonnet-4.6` it works out to roughly $0.0037.
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
	if b, ok := data["billing"].(map[string]interface{}); ok {
		fmt.Printf("Cost: $%.6f\n", b["cost_usd"])
	}
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
print(f"Token cost: {billing['cost_breakdown']['cost_usd']} USD")
print(f"Wallet charge: {billing['usd_charged']} USD")  # 0 while covered by credits
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
console.log(`Token cost: ${billing.cost_breakdown.cost_usd} USD`);
console.log(`Wallet charge: ${billing.usd_charged} USD`); // 0 while covered by credits
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
	fmt.Printf("Token cost: %v USD\n", breakdown["cost_usd"])
	fmt.Printf("Wallet charge: %v USD\n", billing["usd_charged"]) // 0 while covered by credits
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
# With margin: $0.0525 per 1M input tokens, $0.21 per 1M output tokens
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
print(f"Cost: {data['billing']['cost_breakdown']['cost_usd']} USD")  # ~$0.000002
```

```typescript [TypeScript]
// Nova Micro — ultra-budget: $0.0525 per 1M input tokens, $0.21 per 1M output (incl. margin)
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
console.log(`Cost: ${data.billing.cost_breakdown.cost_usd} USD`);
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
	breakdown := billing["cost_breakdown"].(map[string]interface{})
	fmt.Printf("Cost: %v USD\n", breakdown["cost_usd"])
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

All standard OpenAI parameters are **accepted** — your existing request bodies
will not error. Only `model` and `messages` change the result, however:
`temperature`, `max_tokens`, `stream`, `top_p`, `frequency_penalty` and
`presence_penalty` are ignored. If your integration depends on sampling
parameters or on streaming, migrate to `/v1/ai/chat/claude` or
`/v1/ai/agent/stream` rather than the compatibility shim.
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
