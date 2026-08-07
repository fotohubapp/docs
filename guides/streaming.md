# Streaming Guide

Receive AI responses token-by-token using Server-Sent Events (SSE). Streaming provides real-time output for chat interfaces without waiting for the full response to complete.

::: warning One endpoint streams: `/v1/ai/agent/stream`
`POST /v1/ai/agent/stream` is the **only** streaming endpoint in the FOTOhub API.

The chat endpoints do **not** stream:

- `/v1/ai/chat/completions` accepts `stream: true` for drop-in OpenAI SDK
  compatibility and then ignores it — you get one ordinary JSON body back.
- `/v1/ai/chat/claude` always returns a single complete response.

There is no `chat.completion.chunk` object anywhere in this API. An earlier
revision of this guide documented a `POST /v1/ai/chat` endpoint and a
`chat_stream()` SDK method; neither exists — that path returns `404`.
:::

::: info When to Use Streaming
Use streaming when building chat interfaces, live previews, or any UX where users benefit from seeing partial results immediately. For batch/background processing, use the standard synchronous API instead.
:::

---

## How Streaming Works

1. Client `POST`s to `/v1/ai/agent/stream`. Your key is checked **before** the
   stream opens, so a bad key is a plain `401` rather than a frame you have to
   parse to discover you were rejected.
2. Server sends `data:` frames as the model produces them.
3. A `done` frame carries `stop_reason`, `usage` and `billing`.
4. A final `data: [DONE]` closes the stream.

Frames are discriminated by a **`type`** field — not by `choices[].delta` as in
the OpenAI wire format:

| `type` | Payload | Notes |
|--------|---------|-------|
| `text_delta` | `text` | The next fragment of assistant text. Empty fragments are not sent. |
| `tool_use` | `id`, `name`, `input` | Emitted once the call is fully accumulated — never partial JSON. |
| `done` | `stop_reason`, `usage`, `billing` | Last frame before `[DONE]`. See the caveat below. |
| `error` | `message` | Terminal. `[DONE]` still follows it. |

```
data: {"type":"text_delta","text":"Quantum"}

data: {"type":"text_delta","text":" computing"}

data: {"type":"done","stop_reason":"end_turn","usage":{"input_tokens":12,"output_tokens":5,"total_tokens":17},"billing":{"method":"credits","credits_used":2,"usd_charged":0}}

data: [DONE]
```

::: warning `done` is not guaranteed
`[DONE]` always terminates the stream, but `done` does not always precede it. It
is omitted when the turn produced no tokens at all (an upstream failure before
generation started), and replaced by an `error` frame when generation succeeded
but settlement did not. **Treat `[DONE]` as the end of the stream and `done` as
optional metadata** — a client that blocks waiting for `done` can hang.
:::

### Request body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messages` | array | **Yes** | The conversation so far. Empty or missing returns `400`. |
| `model` | string | No | `claude-sonnet-4.6` (default), `claude-sonnet-4.5`, `claude-sonnet-4`, `claude-haiku-4.5`. Any other value returns `400` listing the valid ones. |
| `system` | string | No | System prompt. Pass it here, not as a `system` role in `messages`. |
| `tools` | array | No | Tool definitions. Must be a list if present, else `400`. |
| `max_tokens` | integer | No | Default `4096`. |
| `temperature` | number | No | Default `0.7`. |

This route is the streaming twin of `POST /v1/ai/agent`: same contract, same
billing, same single-turn semantics. Only tool-capable models are accepted, which
is why the Nova models offered on `/v1/ai/chat/claude` are absent here.

---

## Basic Streaming

Neither SDK ships a working streaming helper for this endpoint yet, so these
examples use plain HTTP.

::: code-group
```python [Python]
import json
import requests

resp = requests.post(
    "https://apis.fotohub.app/v1/ai/agent/stream",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json",
    },
    json={
        "model": "claude-sonnet-4.6",
        "messages": [
            {"role": "user", "content": "Explain quantum computing in simple terms"}
        ],
    },
    stream=True,
)
resp.raise_for_status()   # 401 / 400 surface here, before any frame

full_text = ""
for line in resp.iter_lines():
    if not line:
        continue
    line = line.decode("utf-8")
    if not line.startswith("data: "):
        continue
    data = line[6:]
    if data == "[DONE]":
        break

    frame = json.loads(data)
    if frame["type"] == "text_delta":
        full_text += frame["text"]
        print(frame["text"], end="", flush=True)
    elif frame["type"] == "done":
        usage = frame["usage"]
        print(f"\n\n[Tokens: {usage['input_tokens']} in, "
              f"{usage['output_tokens']} out]")
        print(f"[Billed: {frame['billing']['credits_used']} credits, "
              f"${frame['billing']['usd_charged']}]")
    elif frame["type"] == "error":
        raise RuntimeError(frame["message"])

print()
```
```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/agent/stream", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4.6",
    messages: [
      { role: "user", content: "Explain quantum computing in simple terms" },
    ],
  }),
});

if (!response.ok) throw new Error(`HTTP ${response.status}`);

const reader = response.body!.getReader();
const decoder = new TextDecoder();
let fullText = "";
// A single read() can end mid-frame, so buffer until the blank-line separator.
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
      fullText += frame.text;
      process.stdout.write(frame.text);
    } else if (frame.type === "done") {
      console.log(`\n\n[Tokens: ${frame.usage.total_tokens}]`, frame.billing);
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
    "io"
    "net/http"
    "os"
    "strings"
)

type StreamFrame struct {
    Type string `json:"type"`
    // text_delta
    Text string `json:"text"`
    // tool_use
    ID    string                 `json:"id"`
    Name  string                 `json:"name"`
    Input map[string]interface{} `json:"input"`
    // done
    StopReason string `json:"stop_reason"`
    Usage      struct {
        InputTokens  int `json:"input_tokens"`
        OutputTokens int `json:"output_tokens"`
        TotalTokens  int `json:"total_tokens"`
    } `json:"usage"`
    Billing struct {
        Method      string  `json:"method"`
        CreditsUsed int     `json:"credits_used"`
        USDCharged  float64 `json:"usd_charged"`
    } `json:"billing"`
    // error
    Message string `json:"message"`
}

func main() {
    payload, _ := json.Marshal(map[string]interface{}{
        "model": "claude-sonnet-4.6",
        "messages": []map[string]string{
            {"role": "user", "content": "Explain quantum computing in simple terms"},
        },
    })

    req, _ := http.NewRequest("POST",
        "https://apis.fotohub.app/v1/ai/agent/stream",
        bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error: %v\n", err)
        os.Exit(1)
    }
    defer resp.Body.Close()

    if resp.StatusCode >= 400 {
        body, _ := io.ReadAll(resp.Body)
        fmt.Fprintf(os.Stderr, "HTTP %d: %s\n", resp.StatusCode, body)
        os.Exit(1)
    }

    scanner := bufio.NewScanner(resp.Body)
    for scanner.Scan() {
        line := scanner.Text()
        if !strings.HasPrefix(line, "data: ") {
            continue
        }
        data := strings.TrimPrefix(line, "data: ")
        if data == "[DONE]" {
            break
        }

        var frame StreamFrame
        if err := json.Unmarshal([]byte(data), &frame); err != nil {
            continue
        }

        switch frame.Type {
        case "text_delta":
            fmt.Print(frame.Text)
        case "tool_use":
            fmt.Printf("\n[tool_use %s %s %v]\n", frame.ID, frame.Name, frame.Input)
        case "done":
            fmt.Printf("\n\n[Tokens: %d in, %d out] [Credits: %d]\n",
                frame.Usage.InputTokens, frame.Usage.OutputTokens,
                frame.Billing.CreditsUsed)
        case "error":
            fmt.Fprintf(os.Stderr, "\nStream error: %s\n", frame.Message)
        }
    }
    fmt.Println()
}
```
```bash [cURL]
# -N disables curl's own buffering, so frames print as they arrive.
curl -N -X POST https://apis.fotohub.app/v1/ai/agent/stream \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4.6",
    "messages": [
      {"role": "user", "content": "Explain quantum computing in simple terms"}
    ]
  }'
```
:::

---

## Streaming with Conversation History

The endpoint is stateless — it keeps no conversation for you. Send the whole
history on every call and append the assistant's previous reply yourself. Note
that the system prompt goes in the top-level `system` field, not in `messages`.

::: code-group
```python [Python]
import json
import requests

URL = "https://apis.fotohub.app/v1/ai/agent/stream"
HEADERS = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
}
SYSTEM = "You are a helpful coding assistant."


def stream_turn(messages: list[dict]) -> str:
    """Stream one assistant turn and return its full text."""
    resp = requests.post(
        URL, headers=HEADERS,
        json={"model": "claude-sonnet-4.6", "system": SYSTEM, "messages": messages},
        stream=True,
    )
    resp.raise_for_status()

    text = ""
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
            text += frame["text"]
            print(frame["text"], end="", flush=True)
        elif frame["type"] == "error":
            raise RuntimeError(frame["message"])
    return text


messages = [{"role": "user", "content": "What is a closure in JavaScript?"}]
reply = stream_turn(messages)

# Append the assistant turn before asking a follow-up.
messages.append({"role": "assistant", "content": reply})
messages.append({"role": "user", "content": "Show me an example"})

print("\n\n---\n")
stream_turn(messages)
```
```typescript [TypeScript]
type Msg = { role: "user" | "assistant"; content: string };

const SYSTEM = "You are a helpful coding assistant.";

async function streamTurn(messages: Msg[]): Promise<string> {
  const response = await fetch("https://apis.fotohub.app/v1/ai/agent/stream", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "claude-sonnet-4.6", system: SYSTEM, messages }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let text = "";
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
        text += frame.text;
        process.stdout.write(frame.text);
      } else if (frame.type === "error") {
        throw new Error(frame.message);
      }
    }
  }
  return text;
}

const messages: Msg[] = [
  { role: "user", content: "What is a closure in JavaScript?" },
];
const reply = await streamTurn(messages);

messages.push({ role: "assistant", content: reply });
messages.push({ role: "user", content: "Show me an example" });

console.log("\n\n---\n");
await streamTurn(messages);
```
```bash [cURL]
# Multi-turn: the whole history goes in every request.
curl -N -X POST https://apis.fotohub.app/v1/ai/agent/stream \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4.6",
    "system": "You are a helpful coding assistant.",
    "messages": [
      {"role": "user", "content": "What is a closure in JavaScript?"},
      {"role": "assistant", "content": "A closure is a function that..."},
      {"role": "user", "content": "Show me an example"}
    ]
  }'
```
:::

---

## Tool Use While Streaming

`tool_use` frames arrive only once the call is fully accumulated, so you never
have to reassemble partial JSON. The server never executes tools — a `done`
frame with `stop_reason: "tool_use"` is your cue to run the tool locally and
send a follow-up request with the result appended.

```python
import json
import requests


def one_round(messages, tools):
    """Stream one turn. Returns (assistant_blocks, stop_reason)."""
    resp = requests.post(
        "https://apis.fotohub.app/v1/ai/agent/stream",
        headers={"Authorization": "Bearer fh_live_your_api_key",
                 "Content-Type": "application/json"},
        json={"model": "claude-sonnet-4.6", "messages": messages, "tools": tools},
        stream=True,
    )
    resp.raise_for_status()

    blocks, text, stop_reason = [], "", "end_turn"
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
            text += frame["text"]
            print(frame["text"], end="", flush=True)
        elif frame["type"] == "tool_use":
            if text:
                blocks.append({"type": "text", "text": text})
                text = ""
            blocks.append({
                "type": "tool_use",
                "id": frame["id"],
                "name": frame["name"],
                "input": frame["input"],
            })
        elif frame["type"] == "done":
            stop_reason = frame["stop_reason"]
        elif frame["type"] == "error":
            raise RuntimeError(frame["message"])

    if text:
        blocks.append({"type": "text", "text": text})
    return blocks, stop_reason


tools = [{
    "name": "get_weather",
    "description": "Current weather for a city",
    "input_schema": {
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"],
    },
}]
messages = [{"role": "user", "content": "What's the weather in Warsaw?"}]

while True:
    blocks, stop_reason = one_round(messages, tools)
    messages.append({"role": "assistant", "content": blocks})
    if stop_reason != "tool_use":
        break

    # Run each requested tool locally and feed the results back as a user turn.
    results = []
    for block in blocks:
        if block["type"] == "tool_use":
            output = my_tool_registry[block["name"]](**block["input"])
            results.append({
                "type": "tool_result",
                "tool_use_id": block["id"],
                "content": json.dumps(output),
            })
    messages.append({"role": "user", "content": results})
```

::: warning Every round is billed
Each call to this endpoint is one billed turn. A tool loop that takes four rounds
is charged four times — see [Cost Optimization](/guides/cost-optimization).
:::

---

## React Streaming Component

```typescript
// components/StreamingChat.tsx
import { useState, useCallback, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function StreamingChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Call YOUR backend, which proxies to /v1/ai/agent/stream and forwards
      // the frames unchanged. An fh_live_* key must never reach the browser.
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      let buffer = "";

      // Add an empty assistant message to append into.
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Split on the SSE record separator, not on "\n" — a single read()
        // can end mid-frame, and JSON.parse of half a frame throws.
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const raw of frames) {
          if (!raw.startsWith("data: ")) continue;
          const data = raw.slice(6).trim();
          if (data === "[DONE]") break outer;

          const frame = JSON.parse(data);
          if (frame.type === "text_delta") {
            assistantText += frame.text;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: assistantText,
              };
              return updated;
            });
          } else if (frame.type === "error") {
            throw new Error(frame.message);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled — the partial response stays on screen.
        console.log("Stream cancelled by user");
      } else {
        console.error("Stream error:", err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error: Failed to get response." },
        ]);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, messages, isStreaming]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
            <span className="inline-block px-3 py-2 rounded-lg bg-gray-100">
              {msg.content}
              {isStreaming && i === messages.length - 1 && msg.role === "assistant" && (
                <span className="animate-pulse">|</span>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="p-4 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded"
          disabled={isStreaming}
        />
        {isStreaming ? (
          <button onClick={cancelStream} className="px-4 py-2 bg-red-500 text-white rounded">
            Stop
          </button>
        ) : (
          <button onClick={sendMessage} className="px-4 py-2 bg-blue-500 text-white rounded">
            Send
          </button>
        )}
      </div>
    </div>
  );
}
```

::: danger Never stream directly from the browser
`fh_live_*` keys are server-side credentials. Put a route of your own in front of
`/v1/ai/agent/stream` and forward the frames, as above.
:::

---

## Stream Cancellation

Abort the HTTP request to stop receiving frames — `resp.close()` in `requests`,
`AbortController` in the browser, `context` cancellation in Go.

::: warning Cancelling does not save credits
Billing runs exactly once, from the accumulated token usage, and it **still runs
when the client disconnects mid-stream** — settlement is handed to a background
task precisely so an interrupted turn is not free. Those tokens were generated
and charged upstream either way.

Cancel to save **time and bandwidth**, not money. The one thing cancelling does
reduce is further generation, so an early abort on a very long answer can lower
the final `output_tokens` — but you are always billed for what was produced
before you hung up.
:::

::: code-group
```python [Python]
import json
import requests

resp = requests.post(
    "https://apis.fotohub.app/v1/ai/agent/stream",
    headers={"Authorization": "Bearer fh_live_your_api_key",
             "Content-Type": "application/json"},
    json={"model": "claude-sonnet-4.6",
          "messages": [{"role": "user", "content": "Write a long essay about space"}]},
    stream=True,
)
resp.raise_for_status()

fragments = 0
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
        fragments += 1
        if fragments >= 100:
            resp.close()   # stop reading; the turn is still billed
            print("\n[Cancelled after 100 fragments]")
            break
```
```typescript [TypeScript]
const controller = new AbortController();

const response = await fetch("https://apis.fotohub.app/v1/ai/agent/stream", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4.6",
    messages: [{ role: "user", content: "Write a long essay about space" }],
  }),
  signal: controller.signal,
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();
let buffer = "";
let fragments = 0;

try {
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
        process.stdout.write(frame.text);
        if (++fragments >= 100) {
          controller.abort();
          console.log("\n[Cancelled after 100 fragments]");
          break outer;
        }
      }
    }
  }
} catch (e) {
  if (!(e instanceof Error && e.name === "AbortError")) throw e;
}
```
```bash [cURL]
# Hang up after 5 seconds. The turn is still billed for what was produced.
timeout 5 curl -N -X POST https://apis.fotohub.app/v1/ai/agent/stream \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4.6",
    "messages": [{"role": "user", "content": "Write a long essay about space"}]
  }'
```
:::

---

## Token-by-Token Rendering

For smooth UI rendering, buffer fragments and render with `requestAnimationFrame`:

```typescript
// Smooth rendering with requestAnimationFrame
class TokenRenderer {
  private queue: string[] = [];
  private isRendering = false;
  private element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  push(text: string) {
    this.queue.push(text);
    if (!this.isRendering) {
      this.render();
    }
  }

  private render() {
    this.isRendering = true;
    const renderFrame = () => {
      if (this.queue.length === 0) {
        this.isRendering = false;
        return;
      }
      // Render up to 3 fragments per frame for smoothness
      const batch = this.queue.splice(0, 3).join("");
      this.element.textContent += batch;
      requestAnimationFrame(renderFrame);
    };
    requestAnimationFrame(renderFrame);
  }
}

// Usage: feed it every text_delta as it arrives.
const renderer = new TokenRenderer(document.getElementById("output")!);

// ...inside the frame loop from the examples above:
//   if (frame.type === "text_delta") renderer.push(frame.text);
```

A `text_delta` is a fragment of text, not necessarily one token — do not use the
number of frames as a token count. The authoritative counts are in the `done`
frame's `usage`.

---

## Error Handling in Streams

Two failure modes need separate handling.

**Before the stream opens** — an ordinary HTTP status you can check on the
response:

| Status | Cause |
|--------|-------|
| `401` | Missing or invalid API key. Deliberately checked before the first frame. |
| `400` | Empty/missing `messages`, an unknown `model`, or a `tools` value that is not a list. |

**Mid-stream** — an `error` frame. `[DONE]` still follows it, so a loop that only
watches for `[DONE]` exits silently having produced partial text. Always branch
on `type === "error"`.

::: warning Insufficient credits arrive as a frame, not a 402
This route does not pre-authorise. It generates first and settles afterwards, so
an exhausted balance produces an `error` frame **after** the text — never an HTTP
`402`. Do not assume a `2xx` response means the turn was paid for; confirm via
the `done` frame's `billing`.
:::

::: code-group
```python [Python]
import json
import time
import requests


def stream_with_retry(messages: list[dict], max_retries: int = 3) -> str:
    for attempt in range(max_retries):
        try:
            resp = requests.post(
                "https://apis.fotohub.app/v1/ai/agent/stream",
                headers={"Authorization": "Bearer fh_live_your_api_key",
                         "Content-Type": "application/json"},
                json={"model": "claude-sonnet-4.6", "messages": messages},
                stream=True,
                # (connect, read) -- a stalled stream must not hang forever.
                timeout=(10, 60),
            )
            resp.raise_for_status()   # 401 / 400 / 429 land here

            full_text = ""
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
                    full_text += frame["text"]
                    print(frame["text"], end="", flush=True)
                elif frame["type"] == "error":
                    # Terminal. Tokens already produced are still billed, so
                    # blind retries cost real money -- keep max_retries small.
                    raise RuntimeError(frame["message"])
            return full_text

        except requests.HTTPError as e:
            status = e.response.status_code
            if status in (400, 401):
                raise            # never retry a bad request or a bad key
            if status == 429:
                time.sleep(int(e.response.headers.get("Retry-After", 2 ** attempt)))
                continue
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)

    raise RuntimeError("Max retries exceeded")
```
```typescript [TypeScript]
async function streamWithRetry(
  messages: { role: string; content: string }[],
  maxRetries = 3,
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch("https://apis.fotohub.app/v1/ai/agent/stream", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "claude-sonnet-4.6", messages }),
    });

    if (response.status === 400 || response.status === 401) {
      throw new Error(`Not retryable: HTTP ${response.status}`);
    }
    if (!response.ok) {
      if (attempt === maxRetries - 1) throw new Error(`HTTP ${response.status}`);
      const retryAfter = Number(response.headers.get("Retry-After") ?? 2 ** attempt);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
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
          fullText += frame.text;
          process.stdout.write(frame.text);
        } else if (frame.type === "error") {
          throw new Error(frame.message);
        }
      }
    }
    return fullText;
  }
  throw new Error("Max retries exceeded");
}
```
```bash [cURL]
# Separate the HTTP status from the stream body: a 401 has no frames at all.
STATUS=$(curl -s -o /tmp/stream.txt -w "%{http_code}" -N -X POST \
  https://apis.fotohub.app/v1/ai/agent/stream \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-sonnet-4.6","messages":[{"role":"user","content":"Hello"}]}')

if [ "$STATUS" -ge 400 ]; then
  echo "Rejected before streaming: HTTP $STATUS" >&2
  cat /tmp/stream.txt >&2
  exit 1
fi

# A mid-stream failure is a frame, not a status code.
if grep -q '"type":"error"' /tmp/stream.txt; then
  echo "Stream failed mid-flight:" >&2
  grep '"type":"error"' /tmp/stream.txt >&2
fi
```
:::

---

## Performance Tips

1. **Keep connections alive** — reuse the HTTP client/session across streams
2. **Buffer rendering** — don't update the DOM on every fragment; batch with `requestAnimationFrame`
3. **Buffer parsing** — split on `\n\n`; never assume one `read()` is one frame
4. **Pick the right model** — `claude-haiku-4.5` is the fastest and cheapest of the four
5. **Set timeouts** — a stream stalled for >30 s should be cancelled and retried
6. **Don't expect cancellation to save credits** — see [Stream Cancellation](#stream-cancellation)

---

## Related

- [Chat API Reference](/api/chat-llm)
- [Error Handling Guide](/guides/error-handling)
- [SDK Setup](/guides/sdk-setup)
- [Cost Optimization](/guides/cost-optimization)
