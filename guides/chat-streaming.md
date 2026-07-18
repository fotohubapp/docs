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
    model="claude-sonnet-4-20250514",
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
  model: "claude-sonnet-4-20250514",
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
    model="claude-sonnet-4-20250514",
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
  model: "claude-sonnet-4-20250514",
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

FOTOhub supports 30+ LLM models from 12 providers. Popular options:

| Model | Provider | Best for |
|-------|----------|----------|
| `fotohub-ai` | FOTOhub | Default — fast, capable |
| `claude-sonnet-4-6` | Anthropic | Coding, analysis, best value |
| `claude-opus-4-6` | Anthropic | Maximum capabilities |
| `gpt-5.1` | OpenAI | Creative, multi-modal |
| `grok-4-fast-reasoning` | xAI | Fast reasoning, 2M context |
| `deepseek-r1` | DeepSeek | Chain-of-thought reasoning |
| `qwen-flash` | Alibaba | Ultra fast, cheap |
| `nova-micro` | Amazon | Ultra fast, ultra cheap |
| `mistral-large-3` | Mistral | 675B, maximum quality |
| `kimi-k2.5` | Moonshot | Latest intelligent |

See the full [Chat / LLM API reference](/api/chat-llm) for all 30+ models.

---

## Multi-turn Conversation

Maintain context by passing the full message history:

```python
messages = [
    {"role": "system", "content": "You are a Python tutor."},
]

# Turn 1
messages.append({"role": "user", "content": "What is a decorator?"})
response = client.chat(model="claude-sonnet-4-20250514", messages=messages)
messages.append({"role": "assistant", "content": response.choices[0].message.content})

# Turn 2
messages.append({"role": "user", "content": "Show me an example"})
response = client.chat(model="claude-sonnet-4-20250514", messages=messages)
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
    model: "claude-sonnet-4-20250514",
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
