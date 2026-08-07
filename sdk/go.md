# Go HTTP Patterns

Use Go's standard library (`net/http`) to integrate with the FOTOhub API. There is no official Go SDK — these patterns show idiomatic, production-ready HTTP integration using only the standard library.

::: info No SDK Required
Go's `net/http` package is powerful enough for direct API integration. The patterns below give you a reusable client with retries, streaming, async polling, file uploads, webhook verification, and rate limiting — all without third-party dependencies.
:::

## Quick Start

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

result = client.images.generate(
    prompt="A serene mountain landscape at golden hour",
    model="seedream-5-0-260128",
    aspect_ratio="16:9"
)
print(f"Image URL: {result.url}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const result = await client.images.generate({
  prompt: "A serene mountain landscape at golden hour",
  model: "seedream-5-0-260128",
  aspectRatio: "16:9",
});
console.log(`Image URL: ${result.url}`);
```

```go [Go]
package main

import (
    "encoding/json"
    "fmt"
    "log"
)

func main() {
    client := NewFotoHubClient("fh_live_your_api_key")

    body := map[string]interface{}{
        "prompt":       "A serene mountain landscape at golden hour",
        "model":        "seedream-5-0-260128",
        "aspect_ratio": "16:9",
    }

    var result struct {
        URL     string `json:"url"`
        Billing struct {
            CreditsUsed int     `json:"credits_used"`
            USDCharged  float64 `json:"usd_charged"`
        } `json:"billing"`
    }

    resp, err := client.Post("/v1/ai/generate/image", body)
    if err != nil {
        log.Fatal(err)
    }
    json.Unmarshal(resp, &result)
    fmt.Printf("Image URL: %s\n", result.URL)
    fmt.Printf("Cost: $%.4f\n", result.Billing.USDCharged)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape at golden hour",
    "model": "seedream-5-0-260128",
    "aspect_ratio": "16:9"
  }'
```

:::

---

## Reusable Client Struct

A production-ready HTTP client with base URL configuration, automatic retries with exponential backoff, and configurable timeouts. Use a single instance across your application — it is safe for concurrent use.

::: code-group

```python [Python]
from fotohub import FotoHub

# The Python SDK handles retries, timeouts, and auth internally
client = FotoHub(
    api_key="fh_live_your_api_key",
    base_url="https://apis.fotohub.app",
    timeout=60.0,
    max_retries=3,
)
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

// The TypeScript SDK handles retries, timeouts, and auth internally
const client = new FotoHub({
  apiKey: "fh_live_your_api_key",
  baseURL: "https://apis.fotohub.app",
  timeout: 60000,
  maxRetries: 3,
});
```

```go [Go]
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "math"
    "math/rand"
    "net/http"
    "os"
    "time"
)

// FotoHubClient is a reusable HTTP client for the FOTOhub API.
// It is safe for concurrent use from multiple goroutines.
type FotoHubClient struct {
    BaseURL    string
    APIKey     string
    HTTPClient *http.Client
    MaxRetries int
    RetryBase  time.Duration
}

// NewFotoHubClient creates a client with sensible defaults.
// Pass your API key directly or set FOTOHUB_API_KEY in the environment.
func NewFotoHubClient(apiKey string) *FotoHubClient {
    if apiKey == "" {
        apiKey = os.Getenv("FOTOHUB_API_KEY")
    }
    return &FotoHubClient{
        BaseURL: "https://apis.fotohub.app",
        APIKey:  apiKey,
        HTTPClient: &http.Client{
            Timeout: 60 * time.Second,
        },
        MaxRetries: 3,
        RetryBase:  1 * time.Second,
    }
}

// Post sends a JSON POST request and returns the response body.
// Automatically retries on 429 (rate limited) and 5xx errors.
func (c *FotoHubClient) Post(path string, payload interface{}) ([]byte, error) {
    body, err := json.Marshal(payload)
    if err != nil {
        return nil, fmt.Errorf("marshal payload: %w", err)
    }

    var lastErr error
    for attempt := 0; attempt <= c.MaxRetries; attempt++ {
        if attempt > 0 {
            backoff := c.RetryBase * time.Duration(math.Pow(2, float64(attempt-1)))
            jitter := time.Duration(rand.Int63n(int64(backoff / 2)))
            time.Sleep(backoff + jitter)
        }

        req, err := http.NewRequest("POST", c.BaseURL+path, bytes.NewReader(body))
        if err != nil {
            return nil, fmt.Errorf("create request: %w", err)
        }
        req.Header.Set("Authorization", "Bearer "+c.APIKey)
        req.Header.Set("Content-Type", "application/json")
        req.Header.Set("User-Agent", "fotohub-go/1.0")

        resp, err := c.HTTPClient.Do(req)
        if err != nil {
            lastErr = err
            continue
        }

        respBody, _ := io.ReadAll(resp.Body)
        resp.Body.Close()

        // Success
        if resp.StatusCode >= 200 && resp.StatusCode < 300 {
            return respBody, nil
        }

        // Retryable status codes
        if resp.StatusCode == 429 || resp.StatusCode >= 500 {
            lastErr = &FotoHubError{
                StatusCode: resp.StatusCode,
                Code:       "retryable",
                Message:    string(respBody),
            }
            continue
        }

        // Non-retryable error — parse and return immediately
        var apiErr FotoHubError
        if json.Unmarshal(respBody, &apiErr) == nil && apiErr.Code != "" {
            apiErr.StatusCode = resp.StatusCode
            return nil, &apiErr
        }
        return nil, &FotoHubError{
            StatusCode: resp.StatusCode,
            Code:       "unknown",
            Message:    string(respBody),
        }
    }
    return nil, fmt.Errorf("max retries exceeded: %w", lastErr)
}

// Get sends an authenticated GET request and returns the response body.
func (c *FotoHubClient) Get(path string) ([]byte, error) {
    req, err := http.NewRequest("GET", c.BaseURL+path, nil)
    if err != nil {
        return nil, err
    }
    req.Header.Set("Authorization", "Bearer "+c.APIKey)
    req.Header.Set("User-Agent", "fotohub-go/1.0")

    resp, err := c.HTTPClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    if resp.StatusCode >= 400 {
        var apiErr FotoHubError
        if json.Unmarshal(body, &apiErr) == nil && apiErr.Code != "" {
            apiErr.StatusCode = resp.StatusCode
            return nil, &apiErr
        }
        return nil, &FotoHubError{
            StatusCode: resp.StatusCode,
            Code:       "unknown",
            Message:    string(body),
        }
    }
    return body, nil
}
```

```bash [cURL]
# cURL does not use a persistent client, but you can set variables:
export FOTOHUB_API_KEY="fh_live_your_api_key"
export FOTOHUB_BASE="https://apis.fotohub.app"

# Then use in requests:
curl -X POST "$FOTOHUB_BASE/v1/ai/generate/image" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "model": "seedream-5-0-260128"}'
```

:::

---

## Error Types

Custom error struct that captures HTTP status code, machine-readable error code, and a human-readable message. Integrates with Go's `errors.As` for clean error handling.

::: code-group

```python [Python]
from fotohub import FotoHub, FotoHubError, InsufficientCreditsError, RateLimitError

client = FotoHub(api_key="fh_live_your_api_key")

try:
    result = client.images.generate(prompt="test", model="seedream-5-0-260128")
except InsufficientCreditsError as e:
    print(f"Need more credits. Credits available: {e.credits_available}")
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after}s")
except FotoHubError as e:
    print(f"API error [{e.code}]: {e.message}")
```

```typescript [TypeScript]
import { FotoHub, FotoHubError } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

try {
  const result = await client.images.generate({
    prompt: "test",
    model: "seedream-5-0-260128",
  });
} catch (err) {
  if (err instanceof FotoHubError) {
    switch (err.code) {
      case "insufficient_credits":
        console.log(`Need more credits. Credits available: ${err.creditsAvailable}`);
        break;
      case "rate_limited":
        console.log(`Retry after ${err.retryAfter}s`);
        break;
      default:
        console.log(`API error [${err.code}]: ${err.message}`);
    }
  }
}
```

```go [Go]
package main

import (
    "encoding/json"
    "errors"
    "fmt"
    "log"
)

// FotoHubError represents an API error with structured fields.
type FotoHubError struct {
    StatusCode int    `json:"-"`
    Code       string `json:"code"`
    Message    string `json:"message"`
    Param      string `json:"param,omitempty"`
    RetryAfter int    `json:"retry_after,omitempty"`
}

func (e *FotoHubError) Error() string {
    return fmt.Sprintf("fotohub [%d] %s: %s", e.StatusCode, e.Code, e.Message)
}

// IsRetryable returns true for transient errors (429, 5xx).
func (e *FotoHubError) IsRetryable() bool {
    return e.StatusCode == 429 || e.StatusCode >= 500
}

// IsInsufficientCredits checks if the user ran out of credits.
func (e *FotoHubError) IsInsufficientCredits() bool {
    return e.Code == "insufficient_credits"
}

// IsRateLimited checks if the request was rate limited.
func (e *FotoHubError) IsRateLimited() bool {
    return e.Code == "rate_limited"
}

// IsContentPolicy checks for content moderation violations.
func (e *FotoHubError) IsContentPolicy() bool {
    return e.Code == "content_policy"
}

// Example usage with errors.As:
func main() {
    client := NewFotoHubClient("fh_live_your_api_key")

    _, err := client.Post("/v1/ai/generate/image", map[string]interface{}{
        "prompt": "test",
        "model":  "seedream-5-0-260128",
    })
    if err != nil {
        var fhErr *FotoHubError
        if errors.As(err, &fhErr) {
            switch {
            case fhErr.IsInsufficientCredits():
                fmt.Printf("Top up your wallet. Code: %s\n", fhErr.Code)
            case fhErr.IsRateLimited():
                fmt.Printf("Slow down. Retry after %d seconds\n", fhErr.RetryAfter)
            case fhErr.IsContentPolicy():
                fmt.Printf("Content blocked: %s\n", fhErr.Message)
            default:
                fmt.Printf("API error [%s]: %s\n", fhErr.Code, fhErr.Message)
            }
        } else {
            // Network error, timeout, DNS failure, etc.
            log.Fatalf("Request failed: %v", err)
        }
    }

    _ = json.Unmarshal // suppress unused import in example
}
```

```bash [cURL]
# Error responses return HTTP 4xx/5xx with JSON body:
# HTTP 402:
# {"code": "insufficient_credits", "message": "Not enough credits"}
#
# HTTP 429:
# {"code": "rate_limited", "message": "Too many requests", "retry_after": 5}
#
# HTTP 422:
# {"code": "content_policy", "message": "Prompt violates guidelines"}

curl -s -w "\nHTTP %{http_code}\n" \
  -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "model": "seedream-5-0-260128"}'
```

:::

### Error Codes Reference

| HTTP Status | Code | Description |
|:-----------:|------|-------------|
| 401 | `authentication_failed` | Invalid or expired API key |
| 402 | `insufficient_credits` | Not enough credits or wallet balance |
| 422 | `invalid_params` | Missing or invalid request parameters |
| 422 | `content_policy` | Prompt violates content guidelines |
| 429 | `rate_limited` | Too many requests (check `retry_after`) |
| 503 | `model_unavailable` | Model temporarily offline |

---

## Chat Streaming (SSE)

Parse Server-Sent Events using `bufio.Scanner`. The API sends `data:` prefixed
JSON frames, terminated by `data: [DONE]`.

::: warning Stream from `/v1/ai/agent/stream`
That is the only streaming endpoint. `/v1/ai/chat/completions` accepts
`stream: true` and ignores it, returning one complete JSON body; `POST
/v1/ai/chat` does not exist at all (`404`).

Frames are discriminated by a `type` field — `text_delta`, `tool_use`, `done`,
`error` — not by `choices[].delta`. `stream: true` is not needed in the body: the
endpoint always streams. Model IDs here are `claude-sonnet-4.6` (default),
`claude-sonnet-4.5`, `claude-sonnet-4` and `claude-haiku-4.5`; the chat IDs
(`gemini-flash`, `claude-sonnet`, …) are not accepted. See the
[Streaming Guide](/guides/streaming).
:::

::: code-group

```python [Python]
import json
import os

import requests

# The Python SDK has no streaming method for this endpoint (chat_stream() does
# not exist, and chat(stream=True) targets the non-streaming chat route).
resp = requests.post(
    "https://apis.fotohub.app/v1/ai/agent/stream",
    headers={"Authorization": f"Bearer {os.environ['FOTOHUB_API_KEY']}",
             "Content-Type": "application/json"},
    json={
        "model": "claude-sonnet-4.6",
        "messages": [{"role": "user",
                      "content": "Explain quantum computing in simple terms"}],
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
    elif frame["type"] == "done":
        u = frame["usage"]
        print(f"\n[Tokens: {u['input_tokens']} in, {u['output_tokens']} out]")
    elif frame["type"] == "error":
        raise RuntimeError(frame["message"])
```

```typescript [TypeScript]
// client.chatStream() targets the non-streaming chat route and yields nothing,
// so call the agent endpoint directly.
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
// One read() can end mid-frame, so buffer to the blank-line separator.
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
      process.stdout.write(frame.text);
    } else if (frame.type === "done") {
      console.log(`\n[Tokens: ${frame.usage.total_tokens}]`, frame.billing);
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
    "os"
    "strings"
)

// StreamFrame represents one SSE frame from the agent endpoint. The frames are
// a union discriminated by Type, so the fields are flattened here: Text is set
// on text_delta, Usage on done, Message on error.
type StreamFrame struct {
    Type  string `json:"type"`
    Text  string `json:"text"`
    Usage struct {
        InputTokens  int `json:"input_tokens"`
        OutputTokens int `json:"output_tokens"`
        TotalTokens  int `json:"total_tokens"`
    } `json:"usage"`
    Message string `json:"message"`
}

func main() {
    apiKey := os.Getenv("FOTOHUB_API_KEY")
    if apiKey == "" {
        apiKey = "fh_live_your_api_key"
    }

    // Build the streaming request. No "stream" flag: this route always streams.
    payload, _ := json.Marshal(map[string]interface{}{
        "model": "claude-sonnet-4.6",
        "messages": []map[string]string{
            {"role": "user", "content": "Explain quantum computing in simple terms"},
        },
    })

    req, err := http.NewRequest("POST",
        "https://apis.fotohub.app/v1/ai/agent/stream",
        bytes.NewReader(payload))
    if err != nil {
        fmt.Fprintf(os.Stderr, "Failed to create request: %v\n", err)
        os.Exit(1)
    }
    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Accept", "text/event-stream")

    // Send request — use a client without timeout for long streams
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Request failed: %v\n", err)
        os.Exit(1)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        fmt.Fprintf(os.Stderr, "HTTP %d\n", resp.StatusCode)
        os.Exit(1)
    }

    // Parse SSE stream line by line
    scanner := bufio.NewScanner(resp.Body)
    for scanner.Scan() {
        line := scanner.Text()

        // SSE lines are prefixed with "data: "
        if !strings.HasPrefix(line, "data: ") {
            continue
        }

        data := strings.TrimPrefix(line, "data: ")

        // End of stream signal
        if data == "[DONE]" {
            fmt.Println()
            break
        }

        // Parse the JSON frame
        var frame StreamFrame
        if err := json.Unmarshal([]byte(data), &frame); err != nil {
            continue
        }

        switch frame.Type {
        case "text_delta":
            fmt.Print(frame.Text)
        case "tool_use":
            fmt.Print("\n[tool call]\n")
        case "done":
            fmt.Printf("\n[Tokens: %d in, %d out]\n",
                frame.Usage.InputTokens, frame.Usage.OutputTokens)
        case "error":
            fmt.Fprintf(os.Stderr, "\nstream error: %s\n", frame.Message)
            os.Exit(1)
        }
    }

    if err := scanner.Err(); err != nil {
        fmt.Fprintf(os.Stderr, "Stream read error: %v\n", err)
        os.Exit(1)
    }
}
```

```bash [cURL]
# Stream with cURL — tokens appear in real time
curl -N -X POST https://apis.fotohub.app/v1/ai/agent/stream \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "model": "claude-sonnet-4.6",
    "messages": [
      {"role": "user", "content": "Explain quantum computing in simple terms"}
    ]
  }'
```

:::

### SSE Event Format

Frames are separated by a blank line and each `data:` payload is JSON:

```
data: {"type":"text_delta","text":"Hello"}

data: {"type":"text_delta","text":" world"}

data: {"type":"done","usage":{"input_tokens":12,"output_tokens":45,"total_tokens":57},"billing":{"credits_used":2}}

data: [DONE]
```

::: warning `done` is optional, `[DONE]` is not
The `done` frame is skipped when the turn produced no tokens at all, and replaced
by an `error` frame when generation succeeded but billing settlement failed.
Break on `[DONE]` — a client that waits for `done` can hang.

`bufio.Scanner` above works because this endpoint puts one `data:` payload per
line, but if you buffer bytes yourself, split on the `\n\n` record separator
rather than assuming one read is one frame.
:::

---

## Video Generation with Async Polling

Video generation returns a job ID. Poll the status endpoint using a goroutine and `time.Ticker` until completion or timeout.

::: code-group

```python [Python]
import time
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Start video generation (returns immediately with job_id)
job = client.videos.generate(
    prompt="A timelapse of clouds over a mountain range",
    model="veo-2.0-generate-001",
    duration=5,
    aspect_ratio="16:9",
)
print(f"Job started: {job.job_id}")

# Poll until complete (SDK handles this internally with wait())
result = client.jobs.wait(job.job_id, timeout=600, poll_interval=5)
print(f"Video URL: {result.video_url}")
print(f"Credits used: {result.credits_used}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Start video generation
const job = await client.videos.generate({
  prompt: "A timelapse of clouds over a mountain range",
  model: "veo-2.0-generate-001",
  duration: 5,
  aspectRatio: "16:9",
});
console.log(`Job started: ${job.jobId}`);

// Poll until complete
const result = await client.jobs.wait(job.jobId, {
  timeout: 600_000,
  pollInterval: 5000,
  onProgress: (pct) => console.log(`Progress: ${pct}%`),
});
console.log(`Video URL: ${result.videoUrl}`);
```

```go [Go]
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "os"
    "time"
)

// VideoJob represents the initial response from video generation.
type VideoJob struct {
    JobID            string `json:"job_id"`
    Status           string `json:"status"`
    EstimatedSeconds int    `json:"estimated_seconds"`
}

// VideoStatus represents a polling response.
type VideoStatus struct {
    JobID    string  `json:"job_id"`
    Status   string  `json:"status"`
    Progress int     `json:"progress"`
    VideoURL string  `json:"video_url"`
    Error    string  `json:"error"`
    Billing  struct {
        CreditsUsed int     `json:"credits_used"`
        USDCharged  float64 `json:"usd_charged"`
    } `json:"billing"`
}

// PollVideoJob polls the job status using a goroutine and time.Ticker.
// Returns the final status on the result channel.
func PollVideoJob(ctx context.Context, client *FotoHubClient, jobID string, interval time.Duration) <-chan VideoStatus {
    resultCh := make(chan VideoStatus, 1)

    go func() {
        defer close(resultCh)
        ticker := time.NewTicker(interval)
        defer ticker.Stop()

        for {
            select {
            case <-ctx.Done():
                resultCh <- VideoStatus{
                    JobID:  jobID,
                    Status: "timeout",
                    Error:  "polling timed out",
                }
                return
            case <-ticker.C:
                body, err := client.Get(fmt.Sprintf("/v1/ai/jobs/%s", jobID))
                if err != nil {
                    continue // retry on next tick
                }

                var status VideoStatus
                if err := json.Unmarshal(body, &status); err != nil {
                    continue
                }

                switch status.Status {
                case "completed":
                    resultCh <- status
                    return
                case "failed":
                    resultCh <- status
                    return
                default:
                    fmt.Printf("  Progress: %d%%\n", status.Progress)
                }
            }
        }
    }()

    return resultCh
}

func main() {
    client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))

    // Step 1: Start video generation
    payload := map[string]interface{}{
        "prompt":       "A timelapse of clouds over a mountain range",
        "model":        "veo-2.0-generate-001",
        "duration":     5,
        "aspect_ratio": "16:9",
    }

    respBody, err := client.Post("/v1/ai/generate/video", payload)
    if err != nil {
        log.Fatalf("Failed to start video generation: %v", err)
    }

    var job VideoJob
    if err := json.Unmarshal(respBody, &job); err != nil {
        log.Fatalf("Failed to parse job response: %v", err)
    }
    fmt.Printf("Job started: %s (ETA: %ds)\n", job.JobID, job.EstimatedSeconds)

    // Step 2: Poll with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
    defer cancel()

    resultCh := PollVideoJob(ctx, client, job.JobID, 5*time.Second)
    result := <-resultCh

    switch result.Status {
    case "completed":
        fmt.Printf("Video URL: %s\n", result.VideoURL)
        fmt.Printf("Credits used: %d ($%.4f)\n",
            result.Billing.CreditsUsed, result.Billing.USDCharged)
    case "failed":
        log.Fatalf("Video generation failed: %s", result.Error)
    case "timeout":
        log.Fatal("Polling timed out after 10 minutes")
    }
}
```

```bash [cURL]
# Step 1: Start video generation
JOB_ID=$(curl -s -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A timelapse of clouds over a mountain range",
    "model": "veo-2.0-generate-001",
    "duration": 5,
    "aspect_ratio": "16:9"
  }' | jq -r '.job_id')

echo "Job started: $JOB_ID"

# Step 2: Poll until complete
while true; do
  STATUS=$(curl -s https://apis.fotohub.app/v1/ai/jobs/$JOB_ID \
    -H "Authorization: Bearer fh_live_your_api_key")
  
  STATE=$(echo "$STATUS" | jq -r '.status')
  
  if [ "$STATE" = "completed" ]; then
    echo "Video URL: $(echo $STATUS | jq -r '.video_url')"
    break
  elif [ "$STATE" = "failed" ]; then
    echo "FAILED: $(echo $STATUS | jq -r '.error')"
    exit 1
  fi
  
  echo "Progress: $(echo $STATUS | jq -r '.progress')%"
  sleep 5
done
```

:::

---

## File Upload (multipart/form-data)

Upload images for image-to-image, background removal, or analysis. Uses `multipart/form-data` encoding with the standard `mime/multipart` package.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Upload a file for background removal
with open("photo.jpg", "rb") as f:
    result = client.images.remove_background(file=f, format="png")

print(f"Result URL: {result.url}")
print(f"Credits used: {result.billing.credits_used}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import fs from "fs";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Upload a file for background removal
const file = fs.createReadStream("photo.jpg");
const result = await client.images.removeBackground({
  file,
  format: "png",
});

console.log(`Result URL: ${result.url}`);
console.log(`Credits used: ${result.billing.creditsUsed}`);
```

```go [Go]
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "log"
    "mime/multipart"
    "net/http"
    "os"
    "path/filepath"
)

// UploadResult holds the API response for file-based operations.
type UploadResult struct {
    URL     string `json:"url"`
    Billing struct {
        CreditsUsed int     `json:"credits_used"`
        USDCharged  float64 `json:"usd_charged"`
    } `json:"billing"`
}

// UploadFile sends a multipart/form-data request with a file and optional fields.
func UploadFile(client *FotoHubClient, endpoint, filePath string, fields map[string]string) (*UploadResult, error) {
    // Open the file
    file, err := os.Open(filePath)
    if err != nil {
        return nil, fmt.Errorf("open file: %w", err)
    }
    defer file.Close()

    // Create multipart body
    var buf bytes.Buffer
    writer := multipart.NewWriter(&buf)

    // Add the file part
    part, err := writer.CreateFormFile("file", filepath.Base(filePath))
    if err != nil {
        return nil, fmt.Errorf("create form file: %w", err)
    }
    if _, err := io.Copy(part, file); err != nil {
        return nil, fmt.Errorf("copy file data: %w", err)
    }

    // Add additional form fields
    for key, value := range fields {
        if err := writer.WriteField(key, value); err != nil {
            return nil, fmt.Errorf("write field %s: %w", key, err)
        }
    }

    writer.Close()

    // Build the request
    req, err := http.NewRequest("POST", client.BaseURL+endpoint, &buf)
    if err != nil {
        return nil, fmt.Errorf("create request: %w", err)
    }
    req.Header.Set("Authorization", "Bearer "+client.APIKey)
    req.Header.Set("Content-Type", writer.FormDataContentType())
    req.Header.Set("User-Agent", "fotohub-go/1.0")

    // Send
    resp, err := client.HTTPClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("send request: %w", err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)

    if resp.StatusCode >= 400 {
        var apiErr FotoHubError
        if json.Unmarshal(body, &apiErr) == nil && apiErr.Code != "" {
            apiErr.StatusCode = resp.StatusCode
            return nil, &apiErr
        }
        return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
    }

    var result UploadResult
    if err := json.Unmarshal(body, &result); err != nil {
        return nil, fmt.Errorf("parse response: %w", err)
    }
    return &result, nil
}

func main() {
    client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))

    // Upload an image for background removal (FOTOhub Remover)
    result, err := UploadFile(client, "/v1/ai/remove-background", "photo.jpg", map[string]string{
        "format": "png",
    })
    if err != nil {
        log.Fatalf("Upload failed: %v", err)
    }

    fmt.Printf("Result URL: %s\n", result.URL)
    fmt.Printf("Credits used: %d ($%.4f)\n",
        result.Billing.CreditsUsed, result.Billing.USDCharged)
}
```

```bash [cURL]
# Upload image for background removal (FOTOhub Remover)
curl -X POST https://apis.fotohub.app/v1/ai/remove-background \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -F "file=@photo.jpg" \
  -F "format=png"
```

:::

::: tip File Size Limits
Maximum upload size is 20 MB per file. Supported formats: JPEG, PNG, WebP, GIF. For larger files, upload to FOTOhub Storage first and pass the resulting URL.
:::

---

## Webhook Handler

Receive real-time notifications for async events (video completion, credit alerts). Verifies HMAC-SHA256 signatures to ensure payloads originate from FOTOhub.

::: code-group

```python [Python]
from flask import Flask, request, jsonify
import hmac
import hashlib
import time

app = Flask(__name__)
WEBHOOK_SECRET = "whsec_your_secret_from_console"

def verify_signature(payload: bytes, signature: str, timestamp: str) -> bool:
    if abs(int(time.time()) - int(timestamp)) > 300:
        return False
    signed = f"{timestamp}.{payload.decode()}"
    expected = hmac.new(WEBHOOK_SECRET.encode(), signed.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected)

@app.route("/webhooks/fotohub", methods=["POST"])
def handle_webhook():
    sig = request.headers.get("X-FotoHub-Signature", "")
    ts = request.headers.get("X-FotoHub-Timestamp", "")
    if not verify_signature(request.data, sig, ts):
        return jsonify({"error": "Invalid signature"}), 401
    
    event = request.json
    if event["event"] == "generation.completed":
        print(f"Completed: {event['data']['video_url']}")
    elif event["event"] == "credits.low":
        print(f"Warning: {event['data']['message']}")
    
    return jsonify({"received": True}), 200

if __name__ == "__main__":
    app.run(port=3000)
```

```typescript [TypeScript]
import express from "express";
import crypto from "crypto";

const app = express();
const WEBHOOK_SECRET = "whsec_your_secret_from_console";

app.use("/webhooks/fotohub", express.raw({ type: "application/json" }));

function verifySignature(payload: Buffer, signature: string, timestamp: string): boolean {
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) return false;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(`${timestamp}.${payload.toString()}`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

app.post("/webhooks/fotohub", (req, res) => {
  const sig = req.headers["x-fotohub-signature"] as string;
  const ts = req.headers["x-fotohub-timestamp"] as string;
  if (!verifySignature(req.body, sig, ts)) {
    return res.status(401).json({ error: "Invalid signature" });
  }
  const { event, data } = JSON.parse(req.body.toString());
  if (event === "generation.completed") console.log(`Done: ${data.video_url}`);
  res.json({ received: true });
});

app.listen(3000);
```

```go [Go]
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "io"
    "log"
    "math"
    "net/http"
    "strconv"
    "time"
)

const webhookSecret = "whsec_your_secret_from_console"

// WebhookEvent represents an incoming webhook payload.
type WebhookEvent struct {
    Event     string          `json:"event"`
    Timestamp string          `json:"timestamp"`
    Data      json.RawMessage `json:"data"`
}

// GenerationData holds fields for generation.completed events.
type GenerationData struct {
    JobID    string `json:"job_id"`
    Type     string `json:"type"`
    Model    string `json:"model"`
    VideoURL string `json:"video_url"`
    ImageURL string `json:"image_url"`
}

// CreditsData holds fields for credit alert events.
type CreditsData struct {
    Remaining int    `json:"remaining"`
    Message   string `json:"message"`
}

// verifyWebhookSignature validates the HMAC-SHA256 signature.
// Format: HMAC(secret, "{timestamp}.{body}")
func verifyWebhookSignature(payload []byte, signature, timestamp string) bool {
    // Reject requests older than 5 minutes (replay protection)
    ts, err := strconv.ParseInt(timestamp, 10, 64)
    if err != nil {
        return false
    }
    if math.Abs(float64(time.Now().Unix()-ts)) > 300 {
        return false
    }

    // Compute expected HMAC-SHA256
    signedPayload := fmt.Sprintf("%s.%s", timestamp, string(payload))
    mac := hmac.New(sha256.New, []byte(webhookSecret))
    mac.Write([]byte(signedPayload))
    expected := hex.EncodeToString(mac.Sum(nil))

    return hmac.Equal([]byte(signature), []byte(expected))
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    // Read body
    body, err := io.ReadAll(r.Body)
    if err != nil {
        http.Error(w, "Bad request", http.StatusBadRequest)
        return
    }
    defer r.Body.Close()

    // Verify signature
    signature := r.Header.Get("X-FotoHub-Signature")
    timestamp := r.Header.Get("X-FotoHub-Timestamp")

    if !verifyWebhookSignature(body, signature, timestamp) {
        http.Error(w, "Invalid signature", http.StatusUnauthorized)
        return
    }

    // Parse event
    var event WebhookEvent
    if err := json.Unmarshal(body, &event); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    // Route by event type
    switch event.Event {
    case "generation.completed":
        var data GenerationData
        json.Unmarshal(event.Data, &data)
        fmt.Printf("[WEBHOOK] %s completed: job=%s url=%s\n",
            data.Type, data.JobID, data.VideoURL)

    case "generation.failed":
        var data struct {
            JobID string `json:"job_id"`
            Error string `json:"error"`
        }
        json.Unmarshal(event.Data, &data)
        fmt.Printf("[WEBHOOK] Generation failed: job=%s error=%s\n",
            data.JobID, data.Error)

    case "credits.low":
        var data CreditsData
        json.Unmarshal(event.Data, &data)
        fmt.Printf("[WEBHOOK] Credits low: %d remaining — %s\n",
            data.Remaining, data.Message)

    case "credits.depleted":
        fmt.Println("[WEBHOOK] CRITICAL: Credits depleted!")

    case "billing.charged":
        var data struct {
            Operation string  `json:"operation"`
            AmountUSD float64 `json:"amount_usd"`
            Method    string  `json:"method"`
        }
        json.Unmarshal(event.Data, &data)
        fmt.Printf("[WEBHOOK] Charged: $%.4f for %s via %s\n",
            data.AmountUSD, data.Operation, data.Method)

    default:
        fmt.Printf("[WEBHOOK] Unknown event: %s\n", event.Event)
    }

    // Always return 200 quickly
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"received":true}`))
}

func main() {
    http.HandleFunc("/webhooks/fotohub", webhookHandler)
    fmt.Println("Webhook server listening on :3000")
    log.Fatal(http.ListenAndServe(":3000", nil))
}
```

```bash [cURL]
# Test your webhook endpoint locally:
TIMESTAMP=$(date +%s)
BODY='{"event":"generation.completed","timestamp":"'$TIMESTAMP'","data":{"job_id":"vj_test","type":"video","video_url":"https://example.com/video.mp4"}}'
SIGNATURE=$(echo -n "${TIMESTAMP}.${BODY}" | openssl dgst -sha256 -hmac "whsec_your_secret_from_console" | awk '{print $2}')

curl -X POST http://localhost:3000/webhooks/fotohub \
  -H "Content-Type: application/json" \
  -H "X-FotoHub-Signature: $SIGNATURE" \
  -H "X-FotoHub-Timestamp: $TIMESTAMP" \
  -d "$BODY"
```

:::

### Webhook Events

| Event | Trigger |
|-------|---------|
| `generation.completed` | Async job (video, music) finished successfully |
| `generation.failed` | Async job encountered an error |
| `credits.low` | Credits dropped below 10% of plan quota |
| `credits.depleted` | Zero credits remaining |
| `billing.charged` | Wallet charged for a pay-as-you-go operation |

Configure webhooks in the [FOTOhub Console](https://fotohub.app/console) under **Settings > Webhooks**.

---

## Rate Limiter

Client-side rate limiting using `time.Ticker` to stay within your tier's requests-per-minute quota. Prevents 429 errors before they happen.

::: code-group

```python [Python]
import time
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Simple rate limiter: max 30 requests/minute
prompts = ["landscape at sunset", "portrait in studio", "abstract art", "city at night"]
interval = 60.0 / 30  # 2 seconds between requests

for prompt in prompts:
    result = client.images.generate(prompt=prompt, model="seedream-5-0-260128")
    print(f"Generated: {result.url}")
    time.sleep(interval)
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Simple rate limiter: max 30 requests/minute
const prompts = ["landscape at sunset", "portrait in studio", "abstract art"];
const interval = (60 / 30) * 1000; // 2000ms

for (const prompt of prompts) {
  const result = await client.images.generate({ prompt, model: "seedream-5-0-260128" });
  console.log(`Generated: ${result.url}`);
  await new Promise((r) => setTimeout(r, interval));
}
```

```go [Go]
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "os"
    "sync"
    "time"
)

// RateLimiter controls the rate of outgoing API requests.
// It uses a time.Ticker to enforce a minimum interval between requests.
type RateLimiter struct {
    ticker  *time.Ticker
    mu      sync.Mutex
    maxRPM  int
    current int
    resetAt time.Time
}

// NewRateLimiter creates a limiter that allows maxRPM requests per minute.
func NewRateLimiter(maxRPM int) *RateLimiter {
    interval := time.Minute / time.Duration(maxRPM)
    return &RateLimiter{
        ticker:  time.NewTicker(interval),
        maxRPM:  maxRPM,
        current: 0,
        resetAt: time.Now().Add(time.Minute),
    }
}

// Wait blocks until a request slot is available.
func (rl *RateLimiter) Wait() {
    <-rl.ticker.C
}

// Stop releases the ticker resources.
func (rl *RateLimiter) Stop() {
    rl.ticker.Stop()
}

// TokenBucketLimiter provides a more advanced token bucket implementation.
type TokenBucketLimiter struct {
    mu       sync.Mutex
    tokens   int
    maxToken int
    refillAt time.Duration
    lastFill time.Time
}

// NewTokenBucketLimiter creates a bucket with capacity = maxRPM, refills every minute.
func NewTokenBucketLimiter(maxRPM int) *TokenBucketLimiter {
    return &TokenBucketLimiter{
        tokens:   maxRPM,
        maxToken: maxRPM,
        refillAt: time.Minute,
        lastFill: time.Now(),
    }
}

// Acquire blocks until a token is available, returns true.
func (tb *TokenBucketLimiter) Acquire() bool {
    for {
        tb.mu.Lock()
        // Refill tokens if a minute has passed
        elapsed := time.Since(tb.lastFill)
        if elapsed >= tb.refillAt {
            tb.tokens = tb.maxToken
            tb.lastFill = time.Now()
        }

        if tb.tokens > 0 {
            tb.tokens--
            tb.mu.Unlock()
            return true
        }

        // Wait until next refill
        waitTime := tb.refillAt - elapsed
        tb.mu.Unlock()
        time.Sleep(waitTime)
    }
}

func main() {
    client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))

    // Create a rate limiter: 30 requests per minute (Free/PAYG Basic tier)
    limiter := NewRateLimiter(30)
    defer limiter.Stop()

    prompts := []string{
        "A serene mountain landscape at golden hour",
        "A cyberpunk street scene at night",
        "A minimalist Japanese garden",
        "An abstract painting with bold colors",
        "A cozy coffee shop interior",
    }

    for _, prompt := range prompts {
        // Wait for rate limit slot
        limiter.Wait()

        body, err := client.Post("/v1/ai/generate/image", map[string]interface{}{
            "prompt": prompt,
            "model":  "seedream-5-0-260128",
        })
        if err != nil {
            log.Printf("Failed for prompt %q: %v", prompt, err)
            continue
        }

        var result struct {
            URL string `json:"url"`
        }
        json.Unmarshal(body, &result)
        fmt.Printf("Generated: %s\n", result.URL)
    }
}
```

```bash [cURL]
# Simple rate limiting in bash: sleep between requests
PROMPTS=("landscape at sunset" "portrait in studio" "abstract art")
INTERVAL=2  # seconds between requests (30 rpm)

for PROMPT in "${PROMPTS[@]}"; do
  curl -s -X POST https://apis.fotohub.app/v1/ai/generate/image \
    -H "Authorization: Bearer fh_live_your_api_key" \
    -H "Content-Type: application/json" \
    -d "{\"prompt\": \"$PROMPT\", \"model\": \"seedream-5-0-260128\"}" \
    | jq -r '.url'
  sleep $INTERVAL
done
```

:::

### Rate Limit Tiers (PLN pricing)

| Tier | Price | Requests/Minute |
|------|------:|:---------------:|
| Free | 0 PLN/mo | 10 |
| Developer | 49 PLN/mo | 60 |
| Startup | 199 PLN/mo | 300 |
| Business | 799 PLN/mo | 1,000 |
| Enterprise | Custom | 5,000 |

### Rate Limit Headers

Every response includes these headers for tracking your current usage:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Your tier's requests-per-minute quota |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |
| `Retry-After` | Seconds to wait (only on 429 responses) |

---

## Complete Example

A full program that combines the client, error handling, rate limiting, and async video polling into one compilable file.

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Check balance
balance = client.billing.balance()
print(f"Credits: {balance.credits.remaining}")
print(f"Wallet: ${balance.wallet.balance}")

# Generate image
img = client.images.generate(
    prompt="A minimalist logo for a tech startup",
    model="seedream-5-0-260128",
    aspect_ratio="1:1",
)
print(f"Image: {img.url}")

# Generate video (async)
job = client.videos.generate(
    prompt="Logo animation with particle effects",
    model="veo-2.0-generate-001",
    duration=5,
)
result = client.jobs.wait(job.job_id, timeout=600)
print(f"Video: {result.video_url}")
print(f"Credits used: {result.credits_used}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// Check balance
const balance = await client.billing.balance();
console.log(`Credits: ${balance.credits.remaining}`);
console.log(`Wallet: $${balance.wallet.balance}`);

// Generate image
const img = await client.images.generate({
  prompt: "A minimalist logo for a tech startup",
  model: "seedream-5-0-260128",
  aspectRatio: "1:1",
});
console.log(`Image: ${img.url}`);

// Generate video (async)
const job = await client.videos.generate({
  prompt: "Logo animation with particle effects",
  model: "veo-2.0-generate-001",
  duration: 5,
});
const result = await client.jobs.wait(job.jobId, { timeout: 600_000 });
console.log(`Video: ${result.videoUrl}`);
console.log(`Credits used: ${result.creditsUsed}`);
```

```go [Go]
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "os"
    "time"
)

func main() {
    client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))

    // Step 1: Check balance
    balanceBody, err := client.Get("/v1/billing/balance")
    if err != nil {
        log.Fatalf("Balance check failed: %v", err)
    }
    var balance struct {
        Credits struct {
            Remaining int `json:"remaining_period"`
        } `json:"credits"`
        Wallet struct {
            Balance  float64 `json:"balance"`
            Currency string  `json:"currency"`
        } `json:"wallet"`
    }
    json.Unmarshal(balanceBody, &balance)
    fmt.Printf("Credits: %d\n", balance.Credits.Remaining)
    fmt.Printf("Wallet: %.2f %s\n", balance.Wallet.Balance, balance.Wallet.Currency)

    // Step 2: Generate an image
    imgBody, err := client.Post("/v1/ai/generate/image", map[string]interface{}{
        "prompt":       "A minimalist logo for a tech startup",
        "model":        "seedream-5-0-260128",
        "aspect_ratio": "1:1",
    })
    if err != nil {
        log.Fatalf("Image generation failed: %v", err)
    }
    var img struct {
        URL     string `json:"url"`
        Billing struct {
            CreditsUsed int     `json:"credits_used"`
            USDCharged  float64 `json:"usd_charged"`
        } `json:"billing"`
    }
    json.Unmarshal(imgBody, &img)
    fmt.Printf("Image: %s (%d credits)\n", img.URL, img.Billing.CreditsUsed)

    // Step 3: Generate video (async)
    videoBody, err := client.Post("/v1/ai/generate/video", map[string]interface{}{
        "prompt":   "Logo animation with particle effects",
        "model":    "veo-2.0-generate-001",
        "duration": 5,
    })
    if err != nil {
        log.Fatalf("Video generation failed: %v", err)
    }
    var job VideoJob
    json.Unmarshal(videoBody, &job)
    fmt.Printf("Video job started: %s\n", job.JobID)

    // Step 4: Poll for completion
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
    defer cancel()

    resultCh := PollVideoJob(ctx, client, job.JobID, 5*time.Second)
    result := <-resultCh

    if result.Status == "completed" {
        fmt.Printf("Video: %s\n", result.VideoURL)
        fmt.Printf("Total cost: $%.4f\n", result.Billing.USDCharged)
    } else {
        log.Fatalf("Video failed: %s", result.Error)
    }
}
```

```bash [cURL]
# Check balance
curl -s https://apis.fotohub.app/v1/billing/balance \
  -H "Authorization: Bearer fh_live_your_api_key" | jq .

# Generate image
curl -s -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A minimalist logo", "model": "seedream-5-0-260128"}' \
  | jq '{url, credits: .billing.credits_used}'

# Generate video + poll
JOB=$(curl -s -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Logo animation", "model": "veo-2.0-generate-001", "duration": 5}' \
  | jq -r '.job_id')

while true; do
  S=$(curl -s "https://apis.fotohub.app/v1/ai/jobs/$JOB" \
    -H "Authorization: Bearer fh_live_your_api_key")
  [ "$(echo $S | jq -r .status)" = "completed" ] && echo $S | jq . && break
  sleep 5
done
```

:::

---

## Configuration Reference

| Setting | Default | Description |
|---------|---------|-------------|
| `BaseURL` | `https://apis.fotohub.app` | API base URL |
| `HTTPClient.Timeout` | `60s` | Request timeout |
| `MaxRetries` | `3` | Max retries for 429 and 5xx errors |
| `RetryBase` | `1s` | Base delay for exponential backoff |

---

## See Also

- [API Getting Started](/api/getting-started) — authentication and first request
- [Python SDK](/sdk/python) — Python client reference
- [TypeScript SDK](/sdk/typescript) — TypeScript/JavaScript client reference
- [Error Handling Guide](/guides/error-handling) — comprehensive error handling patterns
- [Streaming Guide](/guides/streaming) — real-time streaming patterns
- [Webhooks Guide](/guides/webhooks) — webhook setup and verification
- [Rate Limits](/api/rate-limits) — tier quotas and headers
