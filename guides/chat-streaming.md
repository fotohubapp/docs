# Guide: Chat & LLM Streaming

Use FOTOhub's OpenAI-compatible chat API to build conversational AI applications.

::: danger `/v1/ai/chat/completions` does not stream
The endpoint accepts `stream: true` for drop-in OpenAI SDK compatibility and then
**ignores it** — you always get one complete JSON body back. There is no
`chat.completion.chunk` frame anywhere in this API.

This has a sharp edge in both SDKs: `client.chat(..., stream=True)` (Python) and
`client.chatStream(...)` (TypeScript) return a stream reader that finds no SSE
frames in the JSON body, so it yields **zero chunks and raises no error** — while
the request is still billed. Do not use them until they are repointed.

For real token-by-token output use `POST /v1/ai/agent/stream`, documented in the
[Streaming Guide](/guides/streaming). The examples on this page use the
non-streaming call, which is what the endpoint actually does.
:::

## Prerequisites

- API key from [fotohub.app/console](https://fotohub.app/console)
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

# chat() returns a plain dict, not an object -- index it.
print(response["choices"][0]["message"]["content"])
print(f"Credits: {response['credits_used']}")
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

::: warning Do not rely on `usage` here
`credits_used` is authoritative — billing on this endpoint is a flat per-request
credit charge, so it is always populated.

`usage` is also present in the response, but it is passed straight through from
the upstream provider and falls back to an empty object `{}` when the provider
omits it. Read it defensively (`response.get("usage", {}).get("total_tokens")`)
rather than assuming `total_tokens` exists. For guaranteed token counts use
`/v1/ai/chat/claude` (per-token billing) or `/v1/ai/agent/stream`.
:::

---

## Real-time Responses

For streaming output, use the agent endpoint. It is the only SSE route in the
API:

```python
import json
import requests

resp = requests.post(
    "https://apis.fotohub.app/v1/ai/agent/stream",
    headers={"Authorization": "Bearer fh_live_your_api_key",
             "Content-Type": "application/json"},
    json={
        "model": "claude-sonnet-4.6",   # note: agent model IDs differ from chat IDs
        "messages": [{"role": "user", "content": "Write a haiku about programming"}],
    },
    stream=True,
)
resp.raise_for_status()

for line in resp.iter_lines():
    if not line:
        continue
    payload = line.decode("utf-8")
    if not payload.startswith("data: "):
        continue
    data = payload[6:]
    if data == "[DONE]":
        break
    frame = json.loads(data)
    if frame["type"] == "text_delta":
        print(frame["text"], end="", flush=True)
print()
```

Frame types, request parameters, cancellation semantics and error handling are
covered in the [Streaming Guide](/guides/streaming).

---

## Available Models

`/v1/ai/chat/completions` bills a flat credit charge per request and accepts
**exactly four** model IDs. Anything else returns `400` with the supported list —
it is not silently downgraded to a default.

| Model | ID | Credits/req | Best for |
|-------|-----|:-----------:|----------|
| Gemini Flash | `gemini-flash` | 1 | Default — fast responses, bulk tasks |
| Gemini Pro | `gemini-pro` | 2 | Balanced quality, general use |
| GPT-4o | `gpt-4o` | 2 | Multimodal, vision, creative |
| Claude Sonnet | `claude-sonnet` | 2 | Coding, analysis, reasoning |

Only `gemini-flash` costs 1 credit; the other three cost 2.

::: warning These four IDs are the whole list
Provider-family aliases (`gpt-5.1`, `claude-sonnet-4-6`, Grok or Qwen IDs) are
**not** accepted here, even though some appear in `GET /v1/models?category=text`,
which lists the platform catalogue rather than this endpoint's inputs. The IDs
above map to newer models internally — `gpt-4o` routes to GPT-5.1 and
`claude-sonnet` to Claude Sonnet 4.6 — so treat them as stable aliases.

The agent endpoint has its own separate set (`claude-sonnet-4.6`,
`claude-sonnet-4.5`, `claude-sonnet-4`, `claude-haiku-4.5`); IDs are not
interchangeable between the two.
:::

For per-token billing on premium models, use `/v1/ai/chat/claude`. See the full
[Chat / LLM API reference](/api/chat-llm) for billing details.

---

## Multi-turn Conversation

The endpoint is stateless — pass the full history on every call:

```python
messages = [
    {"role": "system", "content": "You are a Python tutor."},
]

# Turn 1
messages.append({"role": "user", "content": "What is a decorator?"})
response = client.chat(model="claude-sonnet", messages=messages)
reply = response["choices"][0]["message"]["content"]
messages.append({"role": "assistant", "content": reply})

# Turn 2
messages.append({"role": "user", "content": "Show me an example"})
response = client.chat(model="claude-sonnet", messages=messages)
print(response["choices"][0]["message"]["content"])
```

---

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model` | string | `gemini-flash` | One of the four IDs above. Unknown values return `400`. |
| `messages` | array | required | Conversation history. Empty returns `400`. |
| `temperature` | float | — | **Accepted but ignored.** |
| `max_tokens` | int | — | **Accepted but ignored.** |
| `stream` | bool | — | **Accepted but ignored.** Never streams. |
| `top_p` | float | — | **Accepted but ignored.** |

::: warning Only `model` and `messages` are read
The endpoint accepts the full OpenAI request body without erroring so existing
clients keep working, but it acts on `model` and `messages` alone. Sampling
parameters are discarded silently: sending them is harmless and will not change
the output. For sampling control, use `/v1/ai/chat/claude` or
`/v1/ai/agent/stream`, both of which honour `temperature` and `max_tokens`.

One further difference from OpenAI: the array is split before it is forwarded —
the **last** message is treated as the prompt and everything before it as
history. So end your array with the user turn you want answered. If the last
element is an assistant message (an OpenAI-style prefill), it is dropped and the
preceding user message is sent as the prompt *and* kept in history, i.e. asked
twice. Prefill is not supported here.
:::

---

## Streaming in a Web App (Next.js)

Proxy the agent endpoint and forward its frames. Your API key stays server-side:

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json();

  const upstream = await fetch("https://apis.fotohub.app/v1/ai/agent/stream", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "claude-sonnet-4.6", messages }),
  });

  // Auth and validation failures happen before the stream opens, so surface
  // them as real status codes instead of an empty 200 stream.
  if (!upstream.ok) {
    return new Response(await upstream.text(), { status: upstream.status });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readable = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = "";
      try {
        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Split on the SSE record separator: one read() can end mid-frame.
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const raw of frames) {
            if (!raw.startsWith("data: ")) continue;
            const data = raw.slice(6).trim();
            if (data === "[DONE]") break outer;

            const frame = JSON.parse(data);
            if (frame.type === "text_delta") {
              controller.enqueue(encoder.encode(frame.text));
            } else if (frame.type === "error") {
              controller.enqueue(encoder.encode(`\n[error: ${frame.message}]`));
              break outer;
            }
          }
        }
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
```

---

## Related

- [Streaming Guide](/guides/streaming) — the real SSE endpoint
- [Chat / LLM API Reference](/api/chat-llm)
- [SDK Setup](/guides/sdk-setup)
- [Token Billing Guide](/guides/token-billing)
