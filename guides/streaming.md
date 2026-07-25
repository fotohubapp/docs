# Streaming Guide

Receive AI chat responses token-by-token using Server-Sent Events (SSE). Streaming provides real-time output for chat interfaces without waiting for the full response to complete.

::: info When to Use Streaming
Use streaming when building chat interfaces, live previews, or any UX where users benefit from seeing partial results immediately. For batch/background processing, use the standard synchronous API instead.
:::

---

## How Streaming Works

1. Client opens an SSE connection to the chat endpoint
2. Server sends tokens as `data:` events as they are generated
3. A final `data: [DONE]` event signals completion
4. Client closes the connection

Each SSE event contains a JSON chunk:

```
data: {"id":"msg_abc","type":"content","delta":{"text":"Hello"}}
data: {"id":"msg_abc","type":"content","delta":{"text":" world"}}
data: {"id":"msg_abc","type":"usage","usage":{"input_tokens":12,"output_tokens":5}}
data: [DONE]
```

---

## Basic Streaming

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub()

# Stream chat response
stream = client.chat_stream(
    message="Explain quantum computing in simple terms",
    model="gabriel",  # Or any chat model
)

for chunk in stream:
    if chunk.type == "content":
        print(chunk.delta.text, end="", flush=True)
    elif chunk.type == "usage":
        print(f"\n\n[Tokens: {chunk.usage.input_tokens} in, {chunk.usage.output_tokens} out]")

print()  # Final newline
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

const stream = await client.chatStream({
  message: "Explain quantum computing in simple terms",
  model: "gabriel",
});

for await (const chunk of stream) {
  if (chunk.type === "content") {
    process.stdout.write(chunk.delta.text);
  } else if (chunk.type === "usage") {
    console.log(`\n\n[Tokens: ${chunk.usage.inputTokens} in, ${chunk.usage.outputTokens} out]`);
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
    "os"
    "strings"
)

type StreamChunk struct {
    ID    string `json:"id"`
    Type  string `json:"type"`
    Delta struct {
        Text string `json:"text"`
    } `json:"delta"`
    Usage struct {
        InputTokens  int `json:"input_tokens"`
        OutputTokens int `json:"output_tokens"`
    } `json:"usage"`
}

func main() {
    payload, _ := json.Marshal(map[string]interface{}{
        "message": "Explain quantum computing in simple terms",
        "model":   "gabriel",
        "stream":  true,
    })

    req, _ := http.NewRequest("POST",
        "https://apis.fotohub.app/v1/ai/chat",
        bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Accept", "text/event-stream")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error: %v\n", err)
        os.Exit(1)
    }
    defer resp.Body.Close()

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

        var chunk StreamChunk
        if err := json.Unmarshal([]byte(data), &chunk); err != nil {
            continue
        }

        if chunk.Type == "content" {
            fmt.Print(chunk.Delta.Text)
        } else if chunk.Type == "usage" {
            fmt.Printf("\n\n[Tokens: %d in, %d out]\n",
                chunk.Usage.InputTokens, chunk.Usage.OutputTokens)
        }
    }
    fmt.Println()
}
```
```bash [cURL]
# Stream with cURL — see tokens appear in real time
curl -N -X POST https://apis.fotohub.app/v1/ai/chat \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "message": "Explain quantum computing in simple terms",
    "model": "gabriel",
    "stream": true
  }'
```
:::

---

## Streaming with Conversation History

Maintain multi-turn conversations while streaming:

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub()

messages = [
    {"role": "system", "content": "You are a helpful coding assistant."},
    {"role": "user", "content": "What is a closure in JavaScript?"},
]

# First turn
full_response = ""
stream = client.chat_stream(messages=messages)
for chunk in stream:
    if chunk.type == "content":
        full_response += chunk.delta.text
        print(chunk.delta.text, end="", flush=True)

# Add assistant response to history
messages.append({"role": "assistant", "content": full_response})
messages.append({"role": "user", "content": "Show me an example"})

# Second turn — continues the conversation
print("\n\n---\n")
stream = client.chat_stream(messages=messages)
for chunk in stream:
    if chunk.type == "content":
        print(chunk.delta.text, end="", flush=True)
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

const messages = [
  { role: "system" as const, content: "You are a helpful coding assistant." },
  { role: "user" as const, content: "What is a closure in JavaScript?" },
];

// First turn
let fullResponse = "";
const stream1 = await client.chatStream({ messages });
for await (const chunk of stream1) {
  if (chunk.type === "content") {
    fullResponse += chunk.delta.text;
    process.stdout.write(chunk.delta.text);
  }
}

// Continue conversation
messages.push({ role: "assistant", content: fullResponse });
messages.push({ role: "user", content: "Show me an example" });

console.log("\n\n---\n");
const stream2 = await client.chatStream({ messages });
for await (const chunk of stream2) {
  if (chunk.type === "content") {
    process.stdout.write(chunk.delta.text);
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
    "os"
    "strings"
)

type Message struct {
    Role    string `json:"role"`
    Content string `json:"content"`
}

func streamChat(messages []Message) (string, error) {
    payload, _ := json.Marshal(map[string]interface{}{
        "messages": messages,
        "stream":   true,
    })

    req, _ := http.NewRequest("POST",
        "https://apis.fotohub.app/v1/ai/chat",
        bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Accept", "text/event-stream")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()

    var fullText strings.Builder
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
        var chunk struct {
            Type  string `json:"type"`
            Delta struct {
                Text string `json:"text"`
            } `json:"delta"`
        }
        json.Unmarshal([]byte(data), &chunk)
        if chunk.Type == "content" {
            fmt.Print(chunk.Delta.Text)
            fullText.WriteString(chunk.Delta.Text)
        }
    }
    fmt.Println()
    return fullText.String(), nil
}

func main() {
    messages := []Message{
        {Role: "system", Content: "You are a helpful coding assistant."},
        {Role: "user", Content: "What is a closure in JavaScript?"},
    }

    response, _ := streamChat(messages)
    messages = append(messages, Message{Role: "assistant", Content: response})
    messages = append(messages, Message{Role: "user", Content: "Show me an example"})

    fmt.Println("\n---")
    streamChat(messages)
}
```
```bash [cURL]
# Multi-turn conversation with streaming
curl -N -X POST https://apis.fotohub.app/v1/ai/chat \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful coding assistant."},
      {"role": "user", "content": "What is a closure in JavaScript?"},
      {"role": "assistant", "content": "A closure is a function that..."},
      {"role": "user", "content": "Show me an example"}
    ],
    "stream": true
  }'
```
:::

---

## React Streaming Component

A production-ready React component for streaming chat:

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

    // Create abort controller for cancellation
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("https://apis.fotohub.app/v1/ai/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_FOTOHUB_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          stream: true,
        }),
        signal: controller.signal,
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content") {
              assistantText += parsed.delta.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantText,
                };
                return updated;
              });
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled — keep partial response
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

---

## Stream Cancellation

Cancel an in-progress stream to stop token generation (saves credits):

::: code-group
```python [Python]
import signal
from fotohub import FotoHub

client = FotoHub()

# Cancel after receiving 100 tokens
token_count = 0
stream = client.chat_stream(message="Write a long essay about space")

for chunk in stream:
    if chunk.type == "content":
        print(chunk.delta.text, end="", flush=True)
        token_count += 1
        if token_count >= 100:
            stream.close()  # Cancels generation, stops billing
            print("\n[Cancelled after 100 tokens]")
            break
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

const controller = new AbortController();
let tokenCount = 0;

const stream = await client.chatStream(
  { message: "Write a long essay about space" },
  { signal: controller.signal }
);

try {
  for await (const chunk of stream) {
    if (chunk.type === "content") {
      process.stdout.write(chunk.delta.text);
      tokenCount++;
      if (tokenCount >= 100) {
        controller.abort(); // Cancels generation
        console.log("\n[Cancelled after 100 tokens]");
        break;
      }
    }
  }
} catch (e) {
  if (e instanceof Error && e.name === "AbortError") {
    // Expected when we cancel
  } else {
    throw e;
  }
}
```
```go [Go]
package main

import (
    "bufio"
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
    "strings"
)

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    payload, _ := json.Marshal(map[string]interface{}{
        "message": "Write a long essay about space",
        "stream":  true,
    })

    req, _ := http.NewRequestWithContext(ctx, "POST",
        "https://apis.fotohub.app/v1/ai/chat",
        bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Accept", "text/event-stream")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()

    tokenCount := 0
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
        var chunk struct {
            Type  string `json:"type"`
            Delta struct{ Text string `json:"text"` } `json:"delta"`
        }
        json.Unmarshal([]byte(data), &chunk)
        if chunk.Type == "content" {
            fmt.Print(chunk.Delta.Text)
            tokenCount++
            if tokenCount >= 100 {
                cancel() // Cancel context, stop generation
                fmt.Println("\n[Cancelled after 100 tokens]")
                break
            }
        }
    }
}
```
```bash [cURL]
# Cancel with timeout (stops after 5 seconds of streaming)
timeout 5 curl -N -X POST https://apis.fotohub.app/v1/ai/chat \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "Write a long essay about space", "stream": true}'
```
:::

---

## Token-by-Token Rendering

For smooth UI rendering, buffer tokens and render with a typing effect:

```typescript
// Smooth token rendering with requestAnimationFrame
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
      // Render up to 3 tokens per frame for smoothness
      const batch = this.queue.splice(0, 3).join("");
      this.element.textContent += batch;
      requestAnimationFrame(renderFrame);
    };
    requestAnimationFrame(renderFrame);
  }
}

// Usage with streaming
const renderer = new TokenRenderer(document.getElementById("output")!);
const stream = await client.chatStream({ message: "Hello" });
for await (const chunk of stream) {
  if (chunk.type === "content") {
    renderer.push(chunk.delta.text);
  }
}
```

---

## Error Handling in Streams

::: code-group
```python [Python]
from fotohub import FotoHub
from fotohub.exceptions import FotoHubError, RateLimitError
import time

client = FotoHub()

def stream_with_retry(message: str, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            stream = client.chat_stream(message=message)
            full_text = ""
            for chunk in stream:
                if chunk.type == "content":
                    full_text += chunk.delta.text
                    print(chunk.delta.text, end="", flush=True)
                elif chunk.type == "error":
                    raise FotoHubError(chunk.error.message)
            return full_text
        except RateLimitError as e:
            time.sleep(e.retry_after)
        except FotoHubError as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)
    raise Exception("Max retries exceeded")
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { RateLimitError, FotoHubError } from "fotohub/errors";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function streamWithRetry(message: string, maxRetries = 3): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const stream = await client.chatStream({ message });
      let fullText = "";
      for await (const chunk of stream) {
        if (chunk.type === "content") {
          fullText += chunk.delta.text;
          process.stdout.write(chunk.delta.text);
        }
      }
      return fullText;
    } catch (e) {
      if (e instanceof RateLimitError) {
        await new Promise((r) => setTimeout(r, (e.retryAfter ?? 1) * 1000));
      } else if (attempt === maxRetries - 1) {
        throw e;
      } else {
        await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
      }
    }
  }
  throw new Error("Max retries exceeded");
}
```
```go [Go]
package main

import (
    "fmt"
    "time"
)

func streamWithRetry(message string, maxRetries int) error {
    for attempt := 0; attempt < maxRetries; attempt++ {
        err := doStream(message) // implementation from earlier examples
        if err == nil {
            return nil
        }
        wait := time.Duration(1<<uint(attempt)) * time.Second
        fmt.Printf("Retry %d/%d in %v\n", attempt+1, maxRetries, wait)
        time.Sleep(wait)
    }
    return fmt.Errorf("max retries exceeded")
}

func doStream(message string) error {
    // Full streaming implementation (see basic example above)
    return nil
}

func main() {
    if err := streamWithRetry("Hello", 3); err != nil {
        fmt.Printf("Error: %v\n", err)
    }
}
```
```bash [cURL]
# Stream with error checking
RESPONSE=$(curl -s -w "\n%{http_code}" -N -X POST \
  https://apis.fotohub.app/v1/ai/chat \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "Hello", "stream": true}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" -ge 400 ]; then
  echo "Error $HTTP_CODE — retrying..." >&2
fi
```
:::

---

## Performance Tips

1. **Keep connections alive** — Reuse the HTTP client/session across streams
2. **Buffer rendering** — Don't update DOM on every single token; batch with requestAnimationFrame
3. **Cancel early** — If the user navigates away, abort the stream to save credits
4. **Use Gabriel routing** — Streaming latency varies by model; Gabriel picks fast models for simple queries
5. **Set timeouts** — Streams that stall for >30s should be cancelled and retried

---

## Related

- [Chat API Reference](/api/chat-llm)
- [Error Handling Guide](/guides/error-handling)
- [SDK Setup](/guides/sdk-setup)
- [Cost Optimization](/guides/cost-optimization) — Cancellation saves credits
