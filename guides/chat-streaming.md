# Guide: Chat & LLM Streaming

Use FOTOhub's OpenAI-compatible chat API to build conversational AI applications with streaming responses.

## Prerequisites

- API key from [fotohub.app/settings/api](https://fotohub.app/settings/api)
- Python: `pip install fotohub` — or TypeScript: `npm install fotohub`

---

## Basic Chat Completion

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub()

response = client.chat(
    model="claude-sonnet",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is quantum computing in simple terms?"},
    ],
)

print(response.choices[0].message.content)
print(f"Tokens: {response.usage.total_tokens}")
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

const response = await client.chat({
  model: "claude-sonnet",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "What is quantum computing in simple terms?" },
  ],
});

console.log(response.choices[0].message.content);
```
:::

---

## Streaming (Real-time Responses)

Stream tokens as they're generated — ideal for chat UIs:

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub()

stream = client.chat_stream(
    model="claude-sonnet",
    messages=[
        {"role": "user", "content": "Write a haiku about programming"},
    ],
)

for chunk in stream:
    if chunk.content:
        print(chunk.content, end="", flush=True)
print()  # newline at end
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

const stream = await client.chatStream({
  model: "claude-sonnet",
  messages: [
    { role: "user", content: "Write a haiku about programming" },
  ],
});

for await (const chunk of stream) {
  if (chunk.content) {
    process.stdout.write(chunk.content);
  }
}
console.log();
```
:::

---

## Available Models

The streaming `/v1/ai/chat/completions` endpoint bills flat credits (1 for `gemini-flash`, 2 otherwise). The four core credit-based chat IDs:

| Model | ID | Credits/req | Best for |
|-------|-----|:-----------:|----------|
| Gemini Flash | `gemini-flash` | 1 | Default — fast responses, bulk tasks |
| Gemini Pro | `gemini-pro` | 2 | Balanced quality, general use |
| GPT-4o | `gpt-4o` | 2 | Multimodal, vision, creative |
| Claude Sonnet | `claude-sonnet` | 2 | Coding, analysis, reasoning |

The endpoint also accepts additional provider-family IDs (Claude, GPT, Grok, Qwen, Gemini variants) at the same flat 1–2 credit rate. Always fetch the authoritative list at runtime via `GET /v1/models?category=text`. For per-token billing on premium models, use `/v1/ai/chat/claude`.

See the full [Chat / LLM API reference](/api/chat-llm) for the complete model list and billing details.

---

## Multi-turn Conversation

Maintain context by passing the full message history:

```python
messages = [
    {"role": "system", "content": "You are a Python tutor."},
]

# Turn 1
messages.append({"role": "user", "content": "What is a decorator?"})
response = client.chat(model="claude-sonnet", messages=messages)
messages.append({"role": "assistant", "content": response.choices[0].message.content})

# Turn 2
messages.append({"role": "user", "content": "Show me an example"})
response = client.chat(model="claude-sonnet", messages=messages)
print(response.choices[0].message.content)
```

---

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model` | string | required | LLM model ID |
| `messages` | array | required | Conversation history |
| `temperature` | float | 1.0 | Creativity (0=deterministic, 2=creative) |
| `max_tokens` | int | model max | Maximum response length |
| `stream` | bool | false | Enable streaming |
| `top_p` | float | 1.0 | Nucleus sampling |

---

## Streaming in a Web App (Next.js)

```typescript
// app/api/chat/route.ts
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = await client.chatStream({
    model: "claude-sonnet",
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.content) {
          controller.enqueue(encoder.encode(chunk.content));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

---

## Related

- [Chat / LLM API Reference](/api/chat-llm)
- [SDK Setup](/guides/sdk-setup)
- [Token Billing Guide](/guides/token-billing)
