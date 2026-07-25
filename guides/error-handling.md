# Error Handling Guide

Build resilient applications that gracefully handle failures, rate limits, and transient errors from the FOTOhub API.

::: info Production Essentials
Every production integration should implement: (1) signature verification, (2) exponential backoff with jitter, (3) circuit breaker pattern, and (4) per-error-code recovery. This guide covers all four with complete code examples.
:::

---

## Error Response Format

All FOTOhub API errors follow a consistent JSON structure:

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests. Retry after 2.5 seconds.",
    "status": 429,
    "retry_after": 2.5,
    "request_id": "req_abc123xyz"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Machine-readable error code |
| `message` | string | Human-readable description |
| `status` | int | HTTP status code |
| `retry_after` | float | Seconds to wait (rate limits only) |
| `request_id` | string | Unique ID for support debugging |

---

## Error Codes Reference

### Client Errors (4xx)

| Code | HTTP | Cause | Recovery |
|------|------|-------|----------|
| `validation_error` | 400 | Invalid parameters | Fix request body |
| `invalid_model` | 400 | Model ID not found | Check [models catalog](/api/models) |
| `unauthorized` | 401 | Missing/invalid API key | Check key at fotohub.app/settings/api |
| `forbidden` | 403 | Key lacks permission | Upgrade key scope |
| `not_found` | 404 | Resource doesn't exist | Verify resource ID |
| `rate_limit_exceeded` | 429 | Too many requests | Wait `retry_after` seconds |
| `insufficient_credits` | 402 | No credits or wallet balance | Top up at fotohub.app/billing |
| `content_policy` | 400 | Prompt violates policy | Modify prompt content |
| `payload_too_large` | 413 | Request body > 10MB | Reduce image/file size |

### Server Errors (5xx)

| Code | HTTP | Cause | Recovery |
|------|------|-------|----------|
| `internal_error` | 500 | Server bug | Retry with backoff |
| `model_unavailable` | 503 | Model temporarily down | Retry or use fallback model |
| `timeout` | 504 | Generation took too long | Retry or reduce complexity |
| `overloaded` | 503 | System under heavy load | Retry with backoff |

---

## Basic Error Handling

::: code-group
```python [Python]
from fotohub import FotoHub
from fotohub.exceptions import (
    FotoHubError,
    ValidationError,
    AuthenticationError,
    RateLimitError,
    InsufficientCreditsError,
    ModelUnavailableError,
    ServerError,
)

client = FotoHub()

try:
    result = client.generate_image(
        prompt="A mountain landscape at sunset",
        model="seedream-5-0-260128",
    )
    print(result.images[0].url)

except ValidationError as e:
    # 400 — fix your request
    print(f"Invalid request: {e.message}")
    print(f"Field: {e.field}")  # which parameter is wrong

except AuthenticationError:
    # 401 — bad API key
    print("Check your FOTOHUB_API_KEY environment variable")

except RateLimitError as e:
    # 429 — slow down
    print(f"Rate limited. Retry after {e.retry_after}s")

except InsufficientCreditsError:
    # 402 — no balance
    print("Top up credits at fotohub.app/billing")

except ModelUnavailableError as e:
    # 503 — model down
    print(f"Model {e.model} is temporarily unavailable")

except ServerError as e:
    # 500/503/504 — transient
    print(f"Server error (request_id: {e.request_id}). Retrying...")

except FotoHubError as e:
    # Catch-all for any API error
    print(f"API error [{e.code}]: {e.message}")
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";
import {
  FotoHubError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  InsufficientCreditsError,
  ModelUnavailableError,
  ServerError,
} from "fotohub/errors";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

try {
  const result = await client.generateImage({
    prompt: "A mountain landscape at sunset",
    model: "seedream-5-0-260128",
  });
  console.log(result.images[0].url);
} catch (e) {
  if (e instanceof ValidationError) {
    console.error(`Invalid request: ${e.message} (field: ${e.field})`);
  } else if (e instanceof AuthenticationError) {
    console.error("Check your FOTOHUB_API_KEY");
  } else if (e instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${e.retryAfter}s`);
  } else if (e instanceof InsufficientCreditsError) {
    console.error("Top up at fotohub.app/billing");
  } else if (e instanceof ModelUnavailableError) {
    console.error(`Model ${e.model} unavailable, try fallback`);
  } else if (e instanceof ServerError) {
    console.error(`Server error (${e.requestId}). Retrying...`);
  } else if (e instanceof FotoHubError) {
    console.error(`API error [${e.code}]: ${e.message}`);
  } else {
    throw e; // Not an API error
  }
}
```
```go [Go]
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

type APIError struct {
    Code       string  `json:"code"`
    Message    string  `json:"message"`
    Status     int     `json:"status"`
    RetryAfter float64 `json:"retry_after"`
    RequestID  string  `json:"request_id"`
}

type ErrorResponse struct {
    Error APIError `json:"error"`
}

func generateImage(prompt string) (string, error) {
    payload, _ := json.Marshal(map[string]string{
        "prompt": prompt,
        "model":  "seedream-5-0-260128",
    })

    req, _ := http.NewRequest("POST",
        "https://apis.fotohub.app/v1/ai/generate/image",
        bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return "", fmt.Errorf("network error: %w", err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)

    if resp.StatusCode >= 400 {
        var errResp ErrorResponse
        json.Unmarshal(body, &errResp)

        switch resp.StatusCode {
        case 429:
            return "", fmt.Errorf("rate limited, retry after %.1fs", errResp.Error.RetryAfter)
        case 401:
            return "", fmt.Errorf("authentication failed")
        case 402:
            return "", fmt.Errorf("insufficient credits")
        default:
            return "", fmt.Errorf("[%s] %s", errResp.Error.Code, errResp.Error.Message)
        }
    }

    var result map[string]interface{}
    json.Unmarshal(body, &result)
    return fmt.Sprintf("%v", result), nil
}

func main() {
    url, err := generateImage("A mountain landscape at sunset")
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error: %v\n", err)
        os.Exit(1)
    }
    fmt.Println(url)
}
```
```bash [cURL]
# Check HTTP status code and parse error
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A mountain landscape", "model": "seedream-5-0-260128"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 400 ]; then
  ERROR_CODE=$(echo "$BODY" | jq -r '.error.code')
  ERROR_MSG=$(echo "$BODY" | jq -r '.error.message')
  echo "Error [$ERROR_CODE]: $ERROR_MSG" >&2

  case $HTTP_CODE in
    429) echo "Rate limited. Wait and retry." ;;
    401) echo "Check your API key." ;;
    402) echo "Insufficient credits." ;;
    *)   echo "Server error. Retry with backoff." ;;
  esac
  exit 1
fi

echo "$BODY" | jq '.images[0].url'
```
:::

---

## Exponential Backoff with Jitter

Never retry immediately or at fixed intervals. Use exponential backoff with random jitter to avoid thundering herd problems.

**Formula:** `wait = min(base * 2^attempt + random(0, jitter), max_wait)`

::: code-group
```python [Python]
import time
import random
from fotohub import FotoHub
from fotohub.exceptions import RateLimitError, ServerError

client = FotoHub()


def retry_with_backoff(func, max_retries=5, base_delay=1.0, max_delay=60.0):
    """Execute func with exponential backoff + jitter on retryable errors."""
    for attempt in range(max_retries):
        try:
            return func()
        except RateLimitError as e:
            # Use server-provided retry_after if available
            wait = e.retry_after if e.retry_after else base_delay * (2 ** attempt)
            jitter = random.uniform(0, wait * 0.3)
            sleep_time = min(wait + jitter, max_delay)
            print(f"Rate limited. Waiting {sleep_time:.1f}s (attempt {attempt + 1}/{max_retries})")
            time.sleep(sleep_time)
        except ServerError:
            wait = base_delay * (2 ** attempt)
            jitter = random.uniform(0, wait * 0.3)
            sleep_time = min(wait + jitter, max_delay)
            print(f"Server error. Retrying in {sleep_time:.1f}s (attempt {attempt + 1}/{max_retries})")
            time.sleep(sleep_time)

    raise Exception(f"Failed after {max_retries} retries")


# Usage
result = retry_with_backoff(
    lambda: client.generate_image(
        prompt="Mountain landscape",
        model="seedream-5-0-260128",
    )
)
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { RateLimitError, ServerError } from "fotohub/errors";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  baseDelay = 1000,
  maxDelay = 60000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt === maxRetries - 1) throw e;

      let wait: number;
      if (e instanceof RateLimitError && e.retryAfter) {
        wait = e.retryAfter * 1000;
      } else if (e instanceof RateLimitError || e instanceof ServerError) {
        wait = baseDelay * Math.pow(2, attempt);
      } else {
        throw e; // Non-retryable
      }

      const jitter = Math.random() * wait * 0.3;
      const sleepTime = Math.min(wait + jitter, maxDelay);
      console.log(`Retry ${attempt + 1}/${maxRetries} in ${(sleepTime / 1000).toFixed(1)}s`);
      await new Promise((resolve) => setTimeout(resolve, sleepTime));
    }
  }
  throw new Error(`Failed after ${maxRetries} retries`);
}

// Usage
const result = await retryWithBackoff(() =>
  client.generateImage({
    prompt: "Mountain landscape",
    model: "seedream-5-0-260128",
  })
);
```
```go [Go]
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "math"
    "math/rand"
    "net/http"
    "os"
    "time"
)

func retryWithBackoff(fn func() (*http.Response, error), maxRetries int) (*http.Response, error) {
    baseDelay := 1.0  // seconds
    maxDelay := 60.0  // seconds

    for attempt := 0; attempt < maxRetries; attempt++ {
        resp, err := fn()
        if err != nil {
            return nil, err // Network error, don't retry
        }

        // Success
        if resp.StatusCode < 400 {
            return resp, nil
        }

        // Non-retryable client error
        if resp.StatusCode >= 400 && resp.StatusCode < 500 && resp.StatusCode != 429 {
            return resp, fmt.Errorf("client error: %d", resp.StatusCode)
        }

        // Retryable: 429 or 5xx
        if attempt == maxRetries-1 {
            return resp, fmt.Errorf("failed after %d retries", maxRetries)
        }

        wait := math.Min(baseDelay*math.Pow(2, float64(attempt)), maxDelay)
        jitter := rand.Float64() * wait * 0.3
        sleepDuration := time.Duration((wait + jitter) * float64(time.Second))
        fmt.Printf("Retry %d/%d in %v\n", attempt+1, maxRetries, sleepDuration)
        time.Sleep(sleepDuration)
        resp.Body.Close()
    }
    return nil, fmt.Errorf("exhausted retries")
}

func main() {
    makeRequest := func() (*http.Response, error) {
        payload, _ := json.Marshal(map[string]string{
            "prompt": "Mountain landscape",
            "model":  "seedream-5-0-260128",
        })
        req, _ := http.NewRequest("POST",
            "https://apis.fotohub.app/v1/ai/generate/image",
            bytes.NewBuffer(payload))
        req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
        req.Header.Set("Content-Type", "application/json")
        return http.DefaultClient.Do(req)
    }

    resp, err := retryWithBackoff(makeRequest, 5)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error: %v\n", err)
        os.Exit(1)
    }
    defer resp.Body.Close()
    fmt.Println("Success!")
}
```
```bash [cURL]
#!/bin/bash
# Retry with exponential backoff

MAX_RETRIES=5
BASE_DELAY=1

for attempt in $(seq 1 $MAX_RETRIES); do
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    https://apis.fotohub.app/v1/ai/generate/image \
    -H "Authorization: Bearer $FOTOHUB_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"prompt": "Mountain landscape", "model": "seedream-5-0-260128"}')

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  # Success
  if [ "$HTTP_CODE" -lt 400 ]; then
    echo "$BODY" | jq '.images[0].url'
    exit 0
  fi

  # Non-retryable (400-428)
  if [ "$HTTP_CODE" -ge 400 ] && [ "$HTTP_CODE" -lt 429 ]; then
    echo "Non-retryable error ($HTTP_CODE): $(echo $BODY | jq -r '.error.message')" >&2
    exit 1
  fi

  # Retryable: calculate backoff
  DELAY=$(echo "$BASE_DELAY * 2 ^ ($attempt - 1)" | bc)
  JITTER=$(echo "scale=1; $RANDOM / 32768 * $DELAY * 0.3" | bc)
  SLEEP=$(echo "$DELAY + $JITTER" | bc)

  echo "Attempt $attempt/$MAX_RETRIES failed ($HTTP_CODE). Retrying in ${SLEEP}s..." >&2
  sleep "$SLEEP"
done

echo "Failed after $MAX_RETRIES retries" >&2
exit 1
```
:::

---

## Circuit Breaker Pattern

Prevent cascading failures by stopping requests to a failing endpoint temporarily.

::: code-group
```python [Python]
import time
from enum import Enum
from fotohub import FotoHub
from fotohub.exceptions import ServerError


class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if recovered


class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=30):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failures = 0
        self.state = CircuitState.CLOSED
        self.last_failure_time = 0

    def call(self, func):
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time >= self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
            else:
                raise Exception("Circuit breaker OPEN — requests blocked")

        try:
            result = func()
            self._on_success()
            return result
        except ServerError as e:
            self._on_failure()
            raise

    def _on_success(self):
        self.failures = 0
        self.state = CircuitState.CLOSED

    def _on_failure(self):
        self.failures += 1
        self.last_failure_time = time.time()
        if self.failures >= self.failure_threshold:
            self.state = CircuitState.OPEN


# Usage
client = FotoHub()
breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=30)

try:
    result = breaker.call(
        lambda: client.generate_image(prompt="test", model="seedream-5-0-260128")
    )
except Exception as e:
    print(f"Request failed: {e}")
    # Use fallback (cached result, default image, etc.)
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { ServerError } from "fotohub/errors";

enum CircuitState {
  CLOSED = "closed",
  OPEN = "open",
  HALF_OPEN = "half_open",
}

class CircuitBreaker {
  private failures = 0;
  private state = CircuitState.CLOSED;
  private lastFailureTime = 0;

  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 30_000
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.recoveryTimeout) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error("Circuit breaker OPEN - requests blocked");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (e) {
      if (e instanceof ServerError) {
        this.onFailure();
      }
      throw e;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }
}

// Usage
const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });
const breaker = new CircuitBreaker(5, 30_000);

try {
  const result = await breaker.call(() =>
    client.generateImage({ prompt: "test", model: "seedream-5-0-260128" })
  );
} catch (e) {
  console.error("Request failed, using fallback");
}
```
```go [Go]
package main

import (
    "errors"
    "fmt"
    "sync"
    "time"
)

type CircuitState int

const (
    StateClosed CircuitState = iota
    StateOpen
    StateHalfOpen
)

type CircuitBreaker struct {
    mu               sync.Mutex
    failures         int
    failureThreshold int
    recoveryTimeout  time.Duration
    state            CircuitState
    lastFailure      time.Time
}

func NewCircuitBreaker(threshold int, recovery time.Duration) *CircuitBreaker {
    return &CircuitBreaker{
        failureThreshold: threshold,
        recoveryTimeout:  recovery,
        state:            StateClosed,
    }
}

func (cb *CircuitBreaker) Call(fn func() error) error {
    cb.mu.Lock()
    if cb.state == StateOpen {
        if time.Since(cb.lastFailure) >= cb.recoveryTimeout {
            cb.state = StateHalfOpen
        } else {
            cb.mu.Unlock()
            return errors.New("circuit breaker OPEN")
        }
    }
    cb.mu.Unlock()

    err := fn()
    cb.mu.Lock()
    defer cb.mu.Unlock()

    if err != nil {
        cb.failures++
        cb.lastFailure = time.Now()
        if cb.failures >= cb.failureThreshold {
            cb.state = StateOpen
        }
        return err
    }

    cb.failures = 0
    cb.state = StateClosed
    return nil
}

func main() {
    breaker := NewCircuitBreaker(5, 30*time.Second)

    err := breaker.Call(func() error {
        // Make API request here
        return nil
    })
    if err != nil {
        fmt.Printf("Failed: %v (using fallback)\n", err)
    }
}
```
```bash [cURL]
#!/bin/bash
# Simple circuit breaker in bash (tracks failures in a file)

FAILURE_FILE="/tmp/fotohub_circuit_failures"
THRESHOLD=5
RECOVERY_TIMEOUT=30

# Check circuit state
check_circuit() {
  if [ ! -f "$FAILURE_FILE" ]; then
    return 0 # closed
  fi
  FAILURES=$(cat "$FAILURE_FILE" | wc -l)
  if [ "$FAILURES" -ge "$THRESHOLD" ]; then
    LAST=$(tail -1 "$FAILURE_FILE")
    NOW=$(date +%s)
    if [ $((NOW - LAST)) -lt $RECOVERY_TIMEOUT ]; then
      echo "Circuit OPEN. Waiting for recovery..." >&2
      return 1
    fi
  fi
  return 0
}

# Record failure
record_failure() {
  date +%s >> "$FAILURE_FILE"
}

# Record success (reset)
record_success() {
  rm -f "$FAILURE_FILE"
}

# Main
if ! check_circuit; then
  exit 1
fi

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "model": "seedream-5-0-260128"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" -ge 500 ]; then
  record_failure
  echo "Server error (circuit: $(cat $FAILURE_FILE | wc -l)/$THRESHOLD)" >&2
else
  record_success
  echo "$RESPONSE" | sed '$d' | jq .
fi
```
:::

---

## SDK Built-In Retry Configuration

Both SDKs have configurable retry behavior:

::: code-group
```python [Python]
from fotohub import FotoHub

# Configure retry behavior at client level
client = FotoHub(
    max_retries=3,           # Number of retries (default: 2)
    retry_delay=1.0,         # Base delay in seconds
    retry_max_delay=30.0,    # Maximum delay cap
    timeout=60.0,            # Request timeout in seconds
)

# Or disable retries entirely
client_no_retry = FotoHub(max_retries=0)
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({
  apiKey: process.env.FOTOHUB_API_KEY!,
  maxRetries: 3,
  retryDelay: 1000,
  retryMaxDelay: 30_000,
  timeout: 60_000,
});

// Disable retries
const noRetryClient = new FotoHub({
  apiKey: process.env.FOTOHUB_API_KEY!,
  maxRetries: 0,
});
```
```go [Go]
package main

import (
    "net/http"
    "time"
)

// Configure HTTP client with timeout
func newHTTPClient() *http.Client {
    return &http.Client{
        Timeout: 60 * time.Second,
        Transport: &http.Transport{
            MaxIdleConns:        100,
            MaxIdleConnsPerHost: 10,
            IdleConnTimeout:     90 * time.Second,
        },
    }
}

// Use custom client for all requests
var httpClient = newHTTPClient()
```
```bash [cURL]
# cURL retry options
curl --retry 3 \
     --retry-delay 2 \
     --retry-max-time 30 \
     --retry-all-errors \
     -X POST https://apis.fotohub.app/v1/ai/generate/image \
     -H "Authorization: Bearer $FOTOHUB_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "test", "model": "seedream-5-0-260128"}'
```
:::

---

## Per-Error Recovery Strategies

### Rate Limit (429) — Respect retry_after

```python
from fotohub.exceptions import RateLimitError
import time

try:
    result = client.generate_image(prompt="...", model="seedream-5-0-260128")
except RateLimitError as e:
    # ALWAYS use server-provided retry_after
    time.sleep(e.retry_after)
    # Then retry
    result = client.generate_image(prompt="...", model="seedream-5-0-260128")
```

### Model Unavailable (503) — Fallback Model

```python
from fotohub.exceptions import ModelUnavailableError

FALLBACK_MODELS = ["seedream-5-0-260128", "grok-imagine-image", "flux-2-klein-4b"]

def generate_with_fallback(prompt: str):
    for model in FALLBACK_MODELS:
        try:
            return client.generate_image(prompt=prompt, model=model)
        except ModelUnavailableError:
            continue
    raise Exception("All models unavailable")
```

### Insufficient Credits (402) — Graceful Degradation

```python
from fotohub.exceptions import InsufficientCreditsError

try:
    result = client.generate_image(prompt="...", model="imagen-4-standard")
except InsufficientCreditsError:
    # Fall back to cheaper model
    result = client.generate_image(prompt="...", model="seedream-5-0-260128")
    # Notify user
    print("Using standard model (premium credits exhausted)")
```

### Timeout (504) — Simplify Request

```python
from fotohub.exceptions import ServerError

try:
    result = client.generate_video(
        prompt="Complex scene with many characters...",
        model="veo-3.1-generate-001",
        duration=10,
    )
except ServerError as e:
    if e.code == "timeout":
        # Reduce complexity
        result = client.generate_video(
            prompt="Simple scene...",
            model="seedance-2-0-pro",
            duration=5,
        )
```

---

## Idempotency

For critical operations, use idempotency keys to prevent duplicate charges:

::: code-group
```python [Python]
import uuid

# Generate a unique key per logical operation
idempotency_key = str(uuid.uuid4())

result = client.generate_image(
    prompt="Product photo",
    model="seedream-5-0-260128",
    idempotency_key=idempotency_key,  # Safe to retry
)
```
```typescript [TypeScript]
import { randomUUID } from "crypto";

const idempotencyKey = randomUUID();

const result = await client.generateImage({
  prompt: "Product photo",
  model: "seedream-5-0-260128",
  idempotencyKey, // Safe to retry
});
```
```go [Go]
package main

import (
    "github.com/google/uuid"
    "net/http"
)

func main() {
    idempotencyKey := uuid.New().String()

    req, _ := http.NewRequest("POST",
        "https://apis.fotohub.app/v1/ai/generate/image", nil)
    req.Header.Set("Idempotency-Key", idempotencyKey)
    // ... rest of request
}
```
```bash [cURL]
# Idempotency key prevents duplicate charges on retry
IDEM_KEY=$(uuidgen)

curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEM_KEY" \
  -d '{"prompt": "Product photo", "model": "seedream-5-0-260128"}'
```
:::

---

## Logging Best Practices

Always log the `request_id` for debugging with FOTOhub support:

```python
import logging

logger = logging.getLogger("fotohub")

try:
    result = client.generate_image(prompt="...", model="seedream-5-0-260128")
    logger.info(f"Generated image", extra={
        "request_id": result.request_id,
        "model": "seedream-5-0-260128",
        "duration_ms": result.duration_ms,
    })
except FotoHubError as e:
    logger.error(f"API error", extra={
        "request_id": e.request_id,
        "error_code": e.code,
        "status": e.status,
    })
    # Include request_id when contacting support
```

---

## Rate Limits

| Tier | Requests/min | Concurrent | Burst |
|------|-------------|-----------|-------|
| Free | 10 | 2 | 15 |
| Pro | 60 | 10 | 100 |
| Business | 300 | 50 | 500 |
| Enterprise | Custom | Custom | Custom |

Rate limit headers on every response:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1721856000
```

---

## Related

- [Batch Processing Guide](/guides/batch-processing) — Handle errors in concurrent workflows
- [Cost Optimization](/guides/cost-optimization) — Avoid insufficient credits errors
- [SDK Setup](/guides/sdk-setup) — Configure retry behavior
- [API Reference](/api/getting-started) — Full endpoint documentation
