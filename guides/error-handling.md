# Error Handling Guide

Build resilient applications that gracefully handle failures, rate limits, and transient errors from the FOTOhub API.

::: info Production Essentials
Every production integration should implement: (1) signature verification, (2) exponential backoff with jitter, (3) circuit breaker pattern, and (4) per-error-code recovery. This guide covers all four with complete code examples.
:::

---

## Error Response Format

The API is FastAPI, so every error sits under a single `detail` key -- there is
**no** `{"error": {"code", "message", "status", "retry_after", "request_id"}}`
envelope. `detail` is a plain string for most failures, and an object (or, on
`422`, an array) for the handful that carry structured context:

```json
{
  "detail": {
    "error": "insufficient_funds",
    "message": "Insufficient funds: this request costs $0.045 but your balance is $0.002. Top up at least $0.043 to continue.",
    "required_usd": 0.045,
    "balance_usd": 0.002,
    "shortfall_usd": 0.043,
    "topup_url": "https://fotohub.app/console/wallet"
  }
}
```

| Field | Type | Always present | Description |
|-------|------|-----------------|-------------|
| `detail` | string \| object \| array | Yes | The only field most endpoints return. A string for simple failures; an object for the ones with context; an array of `{type, loc, msg, input}` on a `422`. |
| `detail.error` | string | No | Machine-readable code in snake_case, only on the specific endpoints listed in [Error Codes Reference](/api/errors#error-codes-reference). Most failures — 400, 401, and every 5xx — carry none. |
| `detail.message` | string | No | Human-readable description, where `detail` is an object. |
| `request_id` | string | Only on `500` | Present as the `X-Request-Id` **response header** on every call; only duplicated into the body on a `500`. Prefer the header. |

For the full, endpoint-by-endpoint catalog of which status carries which shape, see [Error Handling reference](/api/errors).

---

## Error Codes Reference

There is no universal code catalog spanning every status the way a REST API with a single envelope would have. The codes that do exist, grouped by what they refuse, live in [`/api/errors`](/api/errors#error-codes-reference) — this guide does not duplicate that table, because a stale copy here would drift from it. The load-bearing fact for building a client is simpler than a catalog:

| Status | Has an `error` code? | Recovery |
|--------|----------------------|----------|
| `400` | No — plain string in `detail` | Fix the request. Log `detail` for the reason. |
| `401` | No — plain string in `detail` | Check the API key; see [Authentication](/api/authentication#error-responses). |
| `402` | **Yes**, always `insufficient_funds` (or `plan_gate_exceeded` for a resource cap) | Top up, or upgrade the plan. |
| `403` | Sometimes — `insufficient_scope`, `api_access_required`, `feature_not_available`, and a few others are structured; an IP-allowlist 403 is a plain string. | Depends on the code — see the reference. |
| `404` | No — plain string | Verify the id/path. |
| `422` | No — FastAPI's own array of `{type, loc, msg, input}` | Log the array; `loc` names the offending field. |
| `429` | Sometimes — the per-key limiter's body has `error: "rate_limit_exceeded"`; the earlier gateway limiter's body has no `detail` wrapper at all (`{"error": "Rate limit exceeded..."}`, a plain string, not an object). | Respect `Retry-After`. |
| `5xx` | No — plain string, the same shape for a timeout, an overloaded model, or a malformed upstream response | Retry with backoff; branch on the HTTP status, not on parsed text. |

Always branch on the **HTTP status code** first. Only read `detail.error` where the reference above says a given status/route actually carries one.

---

## Basic Error Handling

::: code-group
```python [Python]
from fotohub import FotoHub
from fotohub.exceptions import (
    FotoHubError,
    ValidationError,
    AuthError,
    RateLimitError,
    InsufficientFundsError,
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
    # 400 or 422 — fix your request. `errors` is FastAPI's per-field list on a
    # 422 (empty on a plain-string 400).
    print(f"Invalid request: {e.message}")
    for field_error in e.errors:
        print(f"  {field_error}")

except AuthError:
    # 401/403 — bad, expired or revoked API key
    print("Check your FOTOHUB_API_KEY environment variable")

except RateLimitError as e:
    # 429 — slow down
    print(f"Rate limited. Retry after {e.retry_after}s")

except InsufficientFundsError as e:
    # 402 — no balance. Nothing was charged (e.charged is always False).
    print(f"Need ${e.shortfall_usd} more — top up: {e.topup_url}")

except ServerError as e:
    # 5xx — transient, including a model that is temporarily unavailable.
    # There is no separate "model unavailable" exception — branch on
    # e.status_code (502/503/504) if you need to try a fallback model.
    print(f"Server error (HTTP {e.status_code}). Retrying...")

except FotoHubError as e:
    # Catch-all for any other API error
    print(f"API error: {e.message} (HTTP {e.status_code})")
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";
import {
  FotoHubError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  InsufficientFundsError,
  ServerError,
} from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

try {
  const result = await client.generateImage({
    prompt: "A mountain landscape at sunset",
    model: "seedream-5-0-260128",
  });
  console.log(result.images[0].url);
} catch (e) {
  if (e instanceof ValidationError) {
    console.error(`Invalid request: ${e.message}`, e.fieldErrors);
  } else if (e instanceof AuthenticationError) {
    console.error("Check your FOTOHUB_API_KEY");
  } else if (e instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${e.retryAfter}s`);
  } else if (e instanceof InsufficientFundsError) {
    console.error(`Need $${e.shortfallUsd} more — top up: ${e.topupUrl}`);
  } else if (e instanceof ServerError) {
    // No separate "model unavailable" class — branch on e.statusCode
    // (502/503/504) if you need to try a fallback model.
    console.error(`Server error (HTTP ${e.statusCode}). Retrying...`);
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

// The API is FastAPI: every error sits under `detail`, a plain string for most
// failures or an object for the ones with structured context (402, some 403s).
// There is no top-level `error` object and no `retry_after` in the body --
// that value, when present, comes from the `Retry-After` response header.
type ErrorDetail struct {
    Error   string `json:"error"`
    Message string `json:"message"`
}

type ErrorResponse struct {
    // `Detail` is a string on most endpoints. `json.RawMessage` lets the
    // caller decide whether to unmarshal it as a string or as ErrorDetail,
    // rather than guessing wrong and losing the message.
    Detail json.RawMessage `json:"detail"`
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

        // Try the structured shape first; fall back to a plain string.
        var detail ErrorDetail
        _ = json.Unmarshal(errResp.Detail, &detail)
        var plain string
        _ = json.Unmarshal(errResp.Detail, &plain)

        switch resp.StatusCode {
        case 429:
            return "", fmt.Errorf("rate limited, retry after %s", resp.Header.Get("Retry-After"))
        case 401:
            return "", fmt.Errorf("authentication failed: %s", plain)
        case 402:
            return "", fmt.Errorf("insufficient funds: %s", detail.Message)
        default:
            if detail.Error != "" {
                return "", fmt.Errorf("[%s] %s", detail.Error, detail.Message)
            }
            return "", fmt.Errorf("HTTP %d: %s", resp.StatusCode, plain)
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
  # `detail` is a plain string on most endpoints, an object with
  # error/message on the ones that carry context (mainly 402).
  ERROR_MSG=$(echo "$BODY" | jq -r 'if (.detail | type) == "object" then .detail.message else .detail end')
  echo "Error (HTTP $HTTP_CODE): $ERROR_MSG" >&2

  case $HTTP_CODE in
    429) echo "Rate limited. Wait and retry." ;;
    401) echo "Check your API key." ;;
    402) echo "Insufficient funds — top up the wallet." ;;
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
import { RateLimitError, ServerError } from "fotohub";

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
import { ServerError } from "fotohub";

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

Both SDKs retry automatically with a fixed internal exponential-backoff curve.
`max_retries`/`maxRetries` and `timeout` are configurable at the client level;
there is no `retry_delay`/`retryDelay` or `retry_max_delay`/`retryMaxDelay`
parameter in either SDK -- the backoff curve itself is not tunable, only how
many attempts it gets:

::: code-group
```python [Python]
from fotohub import FotoHub

# Configure retry behavior at client level
client = FotoHub(
    max_retries=3,   # Default is 3
    timeout=120.0,   # Default is 120.0 seconds
)

# Or disable retries entirely
client_no_retry = FotoHub(max_retries=0)
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({
  apiKey: process.env.FOTOHUB_API_KEY!,
  maxRetries: 3,      // Default is 3
  timeout: 60_000,    // Default is 60000ms (60s)
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

### Model Unavailable (502/503/504) — Fallback Model

There is no separate "model unavailable" exception — a provider failure of any
kind raises `ServerError`, and there is no error code to tell "overloaded" from
"timed out" from "bad upstream response" apart. Branch on `status_code` only if
you need to, and otherwise just treat any `ServerError` as fallback-worthy:

```python
from fotohub.exceptions import ServerError

FALLBACK_MODELS = ["seedream-5-0-260128", "grok-imagine-image", "flux-2-klein-4b"]

def generate_with_fallback(prompt: str):
    for model in FALLBACK_MODELS:
        try:
            return client.generate_image(prompt=prompt, model=model)
        except ServerError:
            continue
    raise Exception("All models unavailable")
```

### Insufficient Funds (402) — Graceful Degradation

```python
from fotohub.exceptions import InsufficientFundsError

try:
    result = client.generate_image(prompt="...", model="imagen-4-standard")
except InsufficientFundsError as e:
    # Fall back to a cheaper model. Nothing was charged for the refused call.
    result = client.generate_image(prompt="...", model="seedream-5-0-260128")
    print(f"Using standard model (wallet short ${e.shortfall_usd})")
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
    # No error code for a provider failure — branch on the HTTP status.
    if e.status_code == 504:
        # Reduce complexity
        result = client.generate_video(
            prompt="Simple scene...",
            model="seedance-2-0-pro",
            duration=5,
        )
```

---

## Idempotency

Retrying a non-idempotent request that charges your wallet risks paying for the same work twice —
the dangerous case is a timeout or a `504` that arrives *after* the generation
already started. The `X-Idempotency-Key` header closes that gap: a repeat with
the same key within 24 hours returns the original response instead of running
the operation again.

### With an SDK: automatic

Both official SDKs retry on their own (three attempts by default), so from
version **1.10.0** they mint one key per logical call and reuse it across that
call's retries. You do not have to do anything — the code you already have is
protected:

::: code-group
```python [Python]
# fotohub >= 1.10.0 — the retries inside this call share one
# X-Idempotency-Key, so a timeout after the render started is replayed,
# not charged again.
result = client.generate_image(
    prompt="Product photo",
    model="seedream-5-0-260128",
)
```
```typescript [TypeScript]
// fotohub >= 1.10.0 — same guarantee, nothing to pass.
const result = await client.generateImage({
  prompt: "Product photo",
  model: "seedream-5-0-260128",
});
```
:::

Two separate calls always get two different keys, even with identical
arguments: asking twice means you want two generations, and collapsing them
would lose one you paid for.

### Calling the API directly

Send the header yourself, and reuse the same value for every retry of the same
logical operation:

::: code-group
```go [Go]
package main

import (
    "github.com/google/uuid"
    "net/http"
)

func main() {
    // One key for the operation — reused by every retry of it.
    idempotencyKey := uuid.New().String()

    req, _ := http.NewRequest("POST",
        "https://apis.fotohub.app/v1/ai/generate/image", nil)
    req.Header.Set("X-Idempotency-Key", idempotencyKey)
    // ... rest of request
}
```
```bash [cURL]
# Reusing this key on a retry replays the first result instead of charging again
IDEM_KEY=$(uuidgen)

curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDEM_KEY" \
  -d '{"prompt": "Product photo", "model": "seedream-5-0-260128"}'
```
:::

A replayed response carries `Idempotent-Replay: true`, which is how you tell it
from a fresh, separately charged execution. If your first attempt is still
running you get `409` with `Retry-After` — retry to collect its result. Reusing
a key with a *different* body is `422`, not a replay.

See [Idempotency Keys](/api/errors#idempotency-keys) for the full rules and which
endpoints are covered.

---

## Logging Best Practices

Always log the request id for debugging with FOTOhub support. It is reliably
present as the `X-Request-Id` **response header** on every call; the SDK's base
`FotoHubError` does not carry a `.request_id` attribute, but it does expose
`.response_body`, which has a `request_id` key on a `500`:

```python
import logging

logger = logging.getLogger("fotohub")

try:
    result = client.generate_image(prompt="...", model="seedream-5-0-260128")
    logger.info("Generated image", extra={"model": "seedream-5-0-260128"})
except FotoHubError as e:
    logger.error("API error", extra={
        "status_code": e.status_code,
        "message": e.message,
        # Populated only on a 500 — otherwise rely on the X-Request-Id header
        # captured by your HTTP client/proxy logging.
        "request_id": (e.response_body or {}).get("request_id"),
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
