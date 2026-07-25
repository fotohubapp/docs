# Rate Limits

FOTOhub enforces rate limits per API key to ensure fair usage and protect service stability. Limits are applied on a per-minute sliding window basis. Every response includes headers to help you track your current consumption.

::: info Automatic Handling
The official SDKs (Python and TypeScript) handle rate limiting automatically with built-in exponential backoff and jitter. If you are building a new integration, start with the SDK for the smoothest experience.
:::

## Tier Limits

Your rate limit is determined by your tier. Limits are measured in requests per minute (rpm) and apply across all endpoints for your API key.

### Pay-As-You-Go Tiers

| Tier | Requirements | Requests / Minute | Daily Quota |
|------|-------------|-------------------|-------------|
| PAYG Basic | Fund wallet | 30 | 200 |
| PAYG Standard | 100 PLN balance or 200 PLN lifetime spend | 120 | 2,000 |
| PAYG Premium | 500 PLN balance or 2,000 PLN lifetime spend | 500 | 10,000 |

### Subscription Tiers

| Tier | Price | Requests / Minute | Daily Quota | Monthly Credits |
|------|-------|-------------------|-------------|-----------------|
| Free | 0 PLN/mo | 10 | 50 | 50 |
| Developer | 49 PLN/mo | 60 | 500 | 500 |
| Startup | 199 PLN/mo | 300 | 5,000 | 5,000 |
| Business | 799 PLN/mo | 1,000 | 50,000 | 25,000 |
| Enterprise | Custom | 5,000 | Unlimited | Unlimited |

### Your Current Tier

Check your current tier and limits:

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

tier = client.tiers.current()
print(f"Tier: {tier.name}")
print(f"Rate limit: {tier.requests_per_minute} rpm")
print(f"Daily quota: {tier.daily_quota}")
print(f"Credits remaining: {tier.credits_remaining}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

const tier = await client.tiers.current();
console.log(`Tier: ${tier.name}`);
console.log(`Rate limit: ${tier.requestsPerMinute} rpm`);
console.log(`Daily quota: ${tier.dailyQuota}`);
console.log(`Credits remaining: ${tier.creditsRemaining}`);
```

```go [Go]
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type TierInfo struct {
	Name              string `json:"name"`
	RequestsPerMinute int    `json:"requests_per_minute"`
	DailyQuota        int    `json:"daily_quota"`
	CreditsRemaining  int    `json:"credits_remaining"`
}

func main() {
	req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/tiers/current", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var tier TierInfo
	json.NewDecoder(resp.Body).Decode(&tier)
	fmt.Printf("Tier: %s\n", tier.Name)
	fmt.Printf("Rate limit: %d rpm\n", tier.RequestsPerMinute)
	fmt.Printf("Daily quota: %d\n", tier.DailyQuota)
}
```

```bash [cURL]
curl https://apis.fotohub.app/v1/tiers/current \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

The `X-Tier` header in every response tells you which tier was resolved for that request.

### Burst Allowance

Each tier allows temporary bursts within its 4-hour burst window. For example, a Developer plan (500 credit 4h burst) can use credits freely within that window before being throttled. This prevents rate-spiking bots while allowing legitimate traffic patterns.

| Tier | Burst Multiplier | Burst Duration |
|------|------------------|----------------|
| Free | 2x (20 rpm) | 5 seconds |
| Developer | 2x (120 rpm) | 5 seconds |
| Startup | 3x (900 rpm) | 10 seconds |
| Business | 3x (3,000 rpm) | 10 seconds |
| Enterprise | 5x (25,000 rpm) | 30 seconds |

## Rate Limit Headers

Every API response includes the following headers so you can monitor your usage and proactively throttle before hitting limits.

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Maximum number of requests allowed in the current window | `60` |
| `X-RateLimit-Remaining` | Number of requests remaining in the current window | `42` |
| `X-RateLimit-Reset` | Unix timestamp (seconds) when the current window resets | `1721234560` |
| `X-Tier` | The tier resolved for this request | `developer` |
| `Retry-After` | Seconds to wait before retrying (only present on 429 responses) | `12` |

### Example Response Headers

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1721234560
X-Tier: developer
```

### Example 429 Response Headers

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1721234572
Retry-After: 12
X-Tier: developer
```

## 429 Too Many Requests

When your request exceeds the rate limit, the API responds with HTTP status 429 and a JSON body indicating how long to wait before retrying.

```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded. Retry after 12 seconds.",
  "retry_after": 12,
  "details": {
    "limit": 60,
    "remaining": 0,
    "reset_at": "2026-07-18T12:00:12Z"
  },
  "request_id": "req_5mXk8pNqW3vL7yRt"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `error` | string | Error code, always `"rate_limit_exceeded"` |
| `message` | string | Human-readable error message with retry guidance |
| `retry_after` | integer | Number of seconds to wait before retrying the request |
| `details.limit` | integer | Your per-minute request limit |
| `details.remaining` | integer | Requests remaining (always 0 when rate limited) |
| `details.reset_at` | string | ISO 8601 timestamp when the window resets |

::: danger Important
Do not retry immediately after receiving a 429. Doing so will extend your cooldown period. Always wait at least the number of seconds indicated in the `retry_after` field before sending your next request.
:::

## Exponential Backoff with Jitter

The recommended retry strategy for rate-limited requests. Start with the server-provided `Retry-After` value (or 1 second as fallback), double on each subsequent retry, and add random jitter to prevent thundering herd problems when multiple clients retry simultaneously.

### Algorithm

```
delay = min(base_delay * 2^attempt + random_jitter, max_delay)

Where:
  base_delay  = max(Retry-After header, 1 second)
  max_delay   = 60 seconds
  max_retries = 5
  jitter      = random(0, 1 second)

Example sequence (without Retry-After):
  Attempt 1: ~1.4s  (1 * 2^0 + 0.4 jitter)
  Attempt 2: ~2.7s  (1 * 2^1 + 0.7 jitter)
  Attempt 3: ~4.2s  (1 * 2^2 + 0.2 jitter)
  Attempt 4: ~8.9s  (1 * 2^3 + 0.9 jitter)
  Attempt 5: ~16.1s (1 * 2^4 + 0.1 jitter)
```

### Implementation

::: code-group

```python [Python]
import time
import random
import requests

API_BASE = "https://apis.fotohub.app/v1"
API_KEY = "fh_live_your_api_key"

def make_request_with_backoff(
    method: str,
    endpoint: str,
    payload: dict = None,
    max_retries: int = 5,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
) -> dict:
    """
    Make an API request with exponential backoff and jitter.
    Respects Retry-After header for 429 responses.
    """
    url = f"{API_BASE}{endpoint}"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    for attempt in range(max_retries + 1):
        response = requests.request(
            method, url, json=payload, headers=headers, timeout=60
        )

        # Success - return the response
        if response.status_code < 400:
            return response.json()

        # Rate limited - implement backoff
        if response.status_code == 429:
            if attempt == max_retries:
                raise Exception(
                    f"Rate limit exceeded after {max_retries} retries. "
                    f"request_id: {response.json().get('request_id', 'unknown')}"
                )

            # Prefer Retry-After header, fallback to exponential backoff
            retry_after = response.headers.get("Retry-After")
            if retry_after:
                wait_time = float(retry_after)
            else:
                wait_time = min(base_delay * (2 ** attempt), max_delay)

            # Add jitter to prevent thundering herd
            jitter = random.uniform(0, 1)
            total_wait = min(wait_time + jitter, max_delay)

            # Log remaining capacity
            remaining = response.headers.get("X-RateLimit-Remaining", "?")
            reset_at = response.headers.get("X-RateLimit-Reset", "?")

            print(
                f"Rate limited (attempt {attempt + 1}/{max_retries}). "
                f"Waiting {total_wait:.1f}s. "
                f"Remaining: {remaining}, Reset: {reset_at}"
            )
            time.sleep(total_wait)
            continue

        # Server errors (500, 502, 503, 504) - also retry
        if response.status_code >= 500:
            if attempt == max_retries:
                response.raise_for_status()

            wait_time = min(base_delay * (2 ** attempt), max_delay)
            jitter = random.uniform(0, 1)
            time.sleep(wait_time + jitter)
            continue

        # Client errors (400, 401, 402, 403, etc.) - do NOT retry
        response.raise_for_status()

    raise Exception(f"Max retries ({max_retries}) exceeded for {endpoint}")


# Usage example
result = make_request_with_backoff(
    "POST",
    "/ai/generate/image",
    {
        "model": "seedream-5-0-260128",
        "prompt": "A futuristic cityscape at sunset",
        "width": 1024,
        "height": 1024,
    },
)
print(f"Generated image: {result['url']}")
```

```typescript [TypeScript]
const API_BASE = "https://apis.fotohub.app/v1";
const API_KEY = "fh_live_your_api_key";

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

async function makeRequestWithBackoff<T>(
  method: string,
  endpoint: string,
  payload?: Record<string, unknown>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 5, baseDelay = 1000, maxDelay = 60000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    // Success
    if (response.ok) {
      return (await response.json()) as T;
    }

    // Rate limited - backoff and retry
    if (response.status === 429) {
      if (attempt === maxRetries) {
        const body = await response.json();
        throw new Error(
          `Rate limit exceeded after ${maxRetries} retries. ` +
          `request_id: ${body.request_id}`
        );
      }

      // Prefer Retry-After header
      const retryAfterHeader = response.headers.get("Retry-After");
      let waitTime: number;

      if (retryAfterHeader) {
        waitTime = parseFloat(retryAfterHeader) * 1000;
      } else {
        waitTime = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      }

      // Add jitter (0-1000ms)
      const jitter = Math.random() * 1000;
      const totalWait = Math.min(waitTime + jitter, maxDelay);

      const remaining = response.headers.get("X-RateLimit-Remaining");
      const resetAt = response.headers.get("X-RateLimit-Reset");

      console.warn(
        `Rate limited (attempt ${attempt + 1}/${maxRetries}). ` +
        `Waiting ${(totalWait / 1000).toFixed(1)}s. ` +
        `Remaining: ${remaining}, Reset: ${resetAt}`
      );

      await new Promise((r) => setTimeout(r, totalWait));
      continue;
    }

    // Server errors (500+) - also retry
    if (response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Server error ${response.status}: ${await response.text()}`);
      }
      const waitTime = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 1000;
      await new Promise((r) => setTimeout(r, waitTime + jitter));
      continue;
    }

    // Client errors - do NOT retry
    const errorBody = await response.json();
    throw new Error(
      `API error ${response.status} [${errorBody.error}]: ${errorBody.message}`
    );
  }

  throw new Error("Unreachable");
}

// Usage example
const result = await makeRequestWithBackoff<{ url: string }>(
  "POST",
  "/ai/generate/image",
  {
    model: "seedream-5-0-260128",
    prompt: "A futuristic cityscape at sunset",
    width: 1024,
    height: 1024,
  }
);
console.log(`Generated image: ${result.url}`);
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
	"strconv"
	"time"
)

const (
	apiBase    = "https://apis.fotohub.app/v1"
	apiKey     = "fh_live_your_api_key"
	maxRetries = 5
	baseDelay  = 1 * time.Second
	maxDelay   = 60 * time.Second
)

func makeRequestWithBackoff(method, endpoint string, payload interface{}) (map[string]interface{}, error) {
	var bodyBytes []byte
	if payload != nil {
		var err error
		bodyBytes, err = json.Marshal(payload)
		if err != nil {
			return nil, err
		}
	}

	for attempt := 0; attempt <= maxRetries; attempt++ {
		var req *http.Request
		var err error

		if bodyBytes != nil {
			req, err = http.NewRequest(method, apiBase+endpoint, bytes.NewReader(bodyBytes))
		} else {
			req, err = http.NewRequest(method, apiBase+endpoint, nil)
		}
		if err != nil {
			return nil, err
		}

		req.Header.Set("Authorization", "Bearer "+apiKey)
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 60 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			if attempt == maxRetries {
				return nil, err
			}
			wait := calculateBackoff(attempt)
			time.Sleep(wait)
			continue
		}
		defer resp.Body.Close()

		// Success
		if resp.StatusCode < 400 {
			var result map[string]interface{}
			json.NewDecoder(resp.Body).Decode(&result)
			return result, nil
		}

		// Rate limited
		if resp.StatusCode == 429 {
			if attempt == maxRetries {
				return nil, fmt.Errorf("rate limit exceeded after %d retries", maxRetries)
			}

			var waitTime time.Duration
			if retryAfter := resp.Header.Get("Retry-After"); retryAfter != "" {
				seconds, _ := strconv.ParseFloat(retryAfter, 64)
				waitTime = time.Duration(seconds * float64(time.Second))
			} else {
				waitTime = calculateBackoff(attempt)
			}

			// Add jitter
			jitter := time.Duration(rand.Float64() * float64(time.Second))
			totalWait := waitTime + jitter
			if totalWait > maxDelay {
				totalWait = maxDelay
			}

			remaining := resp.Header.Get("X-RateLimit-Remaining")
			fmt.Printf("Rate limited (attempt %d/%d). Waiting %v. Remaining: %s\n",
				attempt+1, maxRetries, totalWait, remaining)
			time.Sleep(totalWait)
			continue
		}

		// Server errors - retry
		if resp.StatusCode >= 500 {
			if attempt == maxRetries {
				return nil, fmt.Errorf("server error %d after %d retries", resp.StatusCode, maxRetries)
			}
			time.Sleep(calculateBackoff(attempt))
			continue
		}

		// Client errors - do not retry
		var errBody map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errBody)
		return nil, fmt.Errorf("API error %d [%v]: %v",
			resp.StatusCode, errBody["error"], errBody["message"])
	}

	return nil, fmt.Errorf("max retries exceeded")
}

func calculateBackoff(attempt int) time.Duration {
	delay := float64(baseDelay) * math.Pow(2, float64(attempt))
	if delay > float64(maxDelay) {
		delay = float64(maxDelay)
	}
	jitter := rand.Float64() * float64(time.Second)
	return time.Duration(delay + jitter)
}

func main() {
	result, err := makeRequestWithBackoff("POST", "/ai/generate/image", map[string]interface{}{
		"model":  "seedream-5-0-260128",
		"prompt": "A futuristic cityscape at sunset",
		"width":  1024,
		"height": 1024,
	})
	if err != nil {
		panic(err)
	}
	fmt.Printf("Generated image: %s\n", result["url"])
}
```

```bash [cURL]
#!/bin/bash
# FOTOhub API request with exponential backoff and jitter

API_BASE="https://apis.fotohub.app/v1"
API_KEY="fh_live_your_api_key"
MAX_RETRIES=5

fotohub_request() {
  local method="$1"
  local endpoint="$2"
  local payload="$3"
  local attempt=0
  local base_delay=1

  while [ $attempt -le $MAX_RETRIES ]; do
    # Make the request, capture headers and body separately
    response=$(curl -s -w "\n%{http_code}" \
      -X "$method" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -D /tmp/fh_headers.txt \
      ${payload:+-d "$payload"} \
      "$API_BASE$endpoint")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    # Success
    if [ "$http_code" -lt 400 ] 2>/dev/null; then
      echo "$body"
      return 0
    fi

    # Rate limited (429)
    if [ "$http_code" = "429" ]; then
      if [ $attempt -eq $MAX_RETRIES ]; then
        echo "Rate limit exceeded after $MAX_RETRIES retries" >&2
        return 1
      fi

      # Get Retry-After from headers
      retry_after=$(grep -i "Retry-After:" /tmp/fh_headers.txt \
        | awk '{print $2}' | tr -d '\r')

      if [ -n "$retry_after" ]; then
        wait_time=$retry_after
      else
        wait_time=$((base_delay * (2 ** attempt)))
      fi

      # Add jitter (0-1 second using $RANDOM)
      jitter=$(echo "scale=2; $RANDOM / 32767" | bc)
      total_wait=$(echo "$wait_time + $jitter" | bc)

      # Cap at 60 seconds
      if [ "$(echo "$total_wait > 60" | bc)" -eq 1 ]; then
        total_wait=60
      fi

      remaining=$(grep -i "X-RateLimit-Remaining:" /tmp/fh_headers.txt \
        | awk '{print $2}' | tr -d '\r')
      echo "Rate limited (attempt $((attempt+1))/$MAX_RETRIES). " \
           "Waiting ${total_wait}s. Remaining: $remaining" >&2
      sleep "$total_wait"
      attempt=$((attempt + 1))
      continue
    fi

    # Server errors (500+) - retry
    if [ "$http_code" -ge 500 ] 2>/dev/null; then
      if [ $attempt -eq $MAX_RETRIES ]; then
        echo "Server error $http_code after $MAX_RETRIES retries: $body" >&2
        return 1
      fi
      wait_time=$((base_delay * (2 ** attempt)))
      sleep "$wait_time"
      attempt=$((attempt + 1))
      continue
    fi

    # Client errors (4xx) - do not retry
    echo "API error HTTP $http_code: $body" >&2
    return 1
  done

  echo "Max retries exceeded" >&2
  return 1
}

# Usage
fotohub_request "POST" "/ai/generate/image" '{
  "model": "seedream-5-0-260128",
  "prompt": "A futuristic cityscape at sunset",
  "width": 1024,
  "height": 1024
}'
```

:::

## Circuit Breaker Pattern

After multiple consecutive failures, implement a circuit breaker to pause requests locally and avoid overwhelming a recovering service. This protects both your application and the API from cascading failures.

### Circuit Breaker States

| State | Behavior |
|-------|----------|
| **Closed** | Requests flow normally. Failures are counted. |
| **Open** | All requests are immediately rejected locally (no API call made). |
| **Half-Open** | A single probe request is allowed through. If it succeeds, circuit closes. If it fails, circuit re-opens. |

### State Transitions

```
  [Closed] ---(failure_count >= threshold)---> [Open]
  [Open] ---(reset_timeout elapsed)---> [Half-Open]
  [Half-Open] ---(probe succeeds)---> [Closed]
  [Half-Open] ---(probe fails)---> [Open]
```

### Implementation

::: code-group

```python [Python]
import time
from enum import Enum
from typing import Callable, TypeVar

T = TypeVar("T")


class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    """
    Circuit breaker for FOTOhub API calls.
    Opens after consecutive failures, waits, then probes with a single request.
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        reset_timeout: float = 30.0,
        half_open_max_calls: int = 1,
    ):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.half_open_max_calls = half_open_max_calls
        self.failure_count = 0
        self.last_failure_time = 0.0
        self.state = CircuitState.CLOSED
        self.half_open_calls = 0

    def execute(self, fn: Callable[..., T], *args, **kwargs) -> T:
        """Execute a function through the circuit breaker."""
        self._check_state_transition()

        if self.state == CircuitState.OPEN:
            remaining = self.reset_timeout - (time.time() - self.last_failure_time)
            raise CircuitOpenError(
                f"Circuit breaker is open. Retry after {remaining:.0f}s"
            )

        if self.state == CircuitState.HALF_OPEN:
            if self.half_open_calls >= self.half_open_max_calls:
                raise CircuitOpenError("Circuit breaker half-open: probe in progress")
            self.half_open_calls += 1

        try:
            result = fn(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure(e)
            raise

    def _check_state_transition(self):
        if self.state == CircuitState.OPEN:
            elapsed = time.time() - self.last_failure_time
            if elapsed >= self.reset_timeout:
                self.state = CircuitState.HALF_OPEN
                self.half_open_calls = 0

    def _on_success(self):
        self.failure_count = 0
        self.state = CircuitState.CLOSED
        self.half_open_calls = 0

    def _on_failure(self, error: Exception):
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            print(
                f"Circuit breaker OPEN after {self.failure_count} failures. "
                f"Will probe in {self.reset_timeout}s."
            )
        elif self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.OPEN
            print("Circuit breaker re-opened after failed probe.")


class CircuitOpenError(Exception):
    pass


# Usage with the backoff function
breaker = CircuitBreaker(failure_threshold=5, reset_timeout=30.0)


def generate_image(prompt: str) -> dict:
    return breaker.execute(
        make_request_with_backoff,
        "POST",
        "/ai/generate/image",
        {"model": "seedream-5-0-260128", "prompt": prompt},
    )


# Handle circuit breaker errors gracefully
try:
    result = generate_image("A mountain landscape")
    print(f"URL: {result['url']}")
except CircuitOpenError as e:
    print(f"Service unavailable: {e}")
    # Fall back to cached result, queue for later, or show maintenance page
except Exception as e:
    print(f"Request failed: {e}")
```

```typescript [TypeScript]
type CircuitState = "closed" | "open" | "half-open";

class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: CircuitState = "closed";
  private halfOpenCalls = 0;

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 30000,
    private readonly halfOpenMaxCalls: number = 1
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.checkStateTransition();

    if (this.state === "open") {
      const remaining = Math.ceil(
        (this.resetTimeoutMs - (Date.now() - this.lastFailureTime)) / 1000
      );
      throw new CircuitOpenError(
        `Circuit breaker is open. Retry after ${remaining}s`
      );
    }

    if (this.state === "half-open") {
      if (this.halfOpenCalls >= this.halfOpenMaxCalls) {
        throw new CircuitOpenError(
          "Circuit breaker half-open: probe in progress"
        );
      }
      this.halfOpenCalls++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private checkStateTransition(): void {
    if (this.state === "open") {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.resetTimeoutMs) {
        this.state = "half-open";
        this.halfOpenCalls = 0;
      }
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = "closed";
    this.halfOpenCalls = 0;
  }

  private onFailure(error: any): void {
    // Only count server errors and rate limits
    const status = error?.status ?? error?.statusCode ?? 0;
    if (status >= 500 || status === 429) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = "open";
        console.warn(
          `Circuit breaker OPEN after ${this.failureCount} failures. ` +
          `Will probe in ${this.resetTimeoutMs / 1000}s.`
        );
      } else if (this.state === "half-open") {
        this.state = "open";
        console.warn("Circuit breaker re-opened after failed probe.");
      }
    }
  }
}

class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CircuitOpenError";
  }
}

// Usage
const breaker = new CircuitBreaker(5, 30000);

async function generateImage(prompt: string) {
  return breaker.execute(() =>
    makeRequestWithBackoff<{ url: string }>("POST", "/ai/generate/image", {
      model: "seedream-5-0-260128",
      prompt,
    })
  );
}

try {
  const result = await generateImage("A mountain landscape");
  console.log(`URL: ${result.url}`);
} catch (e) {
  if (e instanceof CircuitOpenError) {
    console.log(`Service unavailable: ${e.message}`);
    // Fall back to cached result or show maintenance page
  } else {
    console.error(`Request failed: ${e}`);
  }
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
	state            CircuitState
	failureCount     int
	lastFailureTime  time.Time
	failureThreshold int
	resetTimeout     time.Duration
}

var ErrCircuitOpen = errors.New("circuit breaker is open")

func NewCircuitBreaker(threshold int, timeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		failureThreshold: threshold,
		resetTimeout:     timeout,
		state:            StateClosed,
	}
}

func (cb *CircuitBreaker) Execute(fn func() (map[string]interface{}, error)) (map[string]interface{}, error) {
	cb.mu.Lock()

	// Check if we should transition from open to half-open
	if cb.state == StateOpen {
		if time.Since(cb.lastFailureTime) >= cb.resetTimeout {
			cb.state = StateHalfOpen
		} else {
			remaining := cb.resetTimeout - time.Since(cb.lastFailureTime)
			cb.mu.Unlock()
			return nil, fmt.Errorf("%w: retry after %v", ErrCircuitOpen, remaining.Round(time.Second))
		}
	}
	cb.mu.Unlock()

	// Execute the function
	result, err := fn()

	cb.mu.Lock()
	defer cb.mu.Unlock()

	if err != nil {
		cb.failureCount++
		cb.lastFailureTime = time.Now()
		if cb.failureCount >= cb.failureThreshold {
			cb.state = StateOpen
			fmt.Printf("Circuit breaker OPEN after %d failures. Will probe in %v.\n",
				cb.failureCount, cb.resetTimeout)
		} else if cb.state == StateHalfOpen {
			cb.state = StateOpen
		}
		return nil, err
	}

	// Success - reset
	cb.failureCount = 0
	cb.state = StateClosed
	return result, nil
}

func main() {
	breaker := NewCircuitBreaker(5, 30*time.Second)

	result, err := breaker.Execute(func() (map[string]interface{}, error) {
		return makeRequestWithBackoff("POST", "/ai/generate/image", map[string]interface{}{
			"model":  "seedream-5-0-260128",
			"prompt": "A mountain landscape",
		})
	})

	if err != nil {
		if errors.Is(err, ErrCircuitOpen) {
			fmt.Printf("Service unavailable: %v\n", err)
		} else {
			fmt.Printf("Request failed: %v\n", err)
		}
		return
	}
	fmt.Printf("URL: %s\n", result["url"])
}
```

```bash [cURL]
#!/bin/bash
# Simple circuit breaker for shell scripts
# Tracks consecutive failures in a temp file

CIRCUIT_FILE="/tmp/fotohub_circuit.json"
FAILURE_THRESHOLD=5
RESET_TIMEOUT=30  # seconds

check_circuit() {
  if [ ! -f "$CIRCUIT_FILE" ]; then
    echo "closed"
    return
  fi

  failures=$(jq -r '.failures' "$CIRCUIT_FILE" 2>/dev/null || echo 0)
  last_failure=$(jq -r '.last_failure' "$CIRCUIT_FILE" 2>/dev/null || echo 0)
  now=$(date +%s)
  elapsed=$((now - last_failure))

  if [ "$failures" -ge "$FAILURE_THRESHOLD" ]; then
    if [ "$elapsed" -lt "$RESET_TIMEOUT" ]; then
      echo "open"
    else
      echo "half-open"
    fi
  else
    echo "closed"
  fi
}

record_failure() {
  failures=$(jq -r '.failures' "$CIRCUIT_FILE" 2>/dev/null || echo 0)
  failures=$((failures + 1))
  echo "{\"failures\": $failures, \"last_failure\": $(date +%s)}" > "$CIRCUIT_FILE"

  if [ "$failures" -ge "$FAILURE_THRESHOLD" ]; then
    echo "Circuit breaker OPEN after $failures failures" >&2
  fi
}

record_success() {
  echo '{"failures": 0, "last_failure": 0}' > "$CIRCUIT_FILE"
}

# Usage with fotohub_request function
fotohub_with_circuit() {
  state=$(check_circuit)
  if [ "$state" = "open" ]; then
    echo "Circuit breaker is open. Service unavailable." >&2
    return 1
  fi

  if fotohub_request "$@"; then
    record_success
    return 0
  else
    record_failure
    return 1
  fi
}
```

:::

## Proactive Rate Monitoring

Instead of waiting for 429 errors, monitor the `X-RateLimit-Remaining` header and throttle proactively when capacity is low.

::: code-group

```python [Python]
import time
import threading
from collections import deque

class RateLimitMonitor:
    """
    Monitor rate limit headers and throttle proactively.
    Slows down requests when remaining capacity drops below threshold.
    """

    def __init__(self, throttle_threshold: float = 0.1):
        self.throttle_threshold = throttle_threshold  # Throttle at 10% remaining
        self.limit = 60
        self.remaining = 60
        self.reset_at = 0
        self._lock = threading.Lock()

    def update_from_headers(self, headers: dict):
        """Update rate limit state from response headers."""
        with self._lock:
            if "X-RateLimit-Limit" in headers:
                self.limit = int(headers["X-RateLimit-Limit"])
            if "X-RateLimit-Remaining" in headers:
                self.remaining = int(headers["X-RateLimit-Remaining"])
            if "X-RateLimit-Reset" in headers:
                self.reset_at = int(headers["X-RateLimit-Reset"])

    def should_throttle(self) -> bool:
        """Check if we should slow down requests."""
        with self._lock:
            if self.limit == 0:
                return False
            ratio = self.remaining / self.limit
            return ratio <= self.throttle_threshold

    def get_throttle_delay(self) -> float:
        """Calculate how long to wait before next request."""
        with self._lock:
            if self.remaining <= 0:
                # Wait until reset
                wait = max(0, self.reset_at - time.time())
                return min(wait, 60)
            if self.should_throttle():
                # Spread remaining requests evenly until reset
                time_until_reset = max(1, self.reset_at - time.time())
                return time_until_reset / max(1, self.remaining)
            return 0

    @property
    def usage_percent(self) -> float:
        with self._lock:
            if self.limit == 0:
                return 0
            return ((self.limit - self.remaining) / self.limit) * 100


# Usage
monitor = RateLimitMonitor(throttle_threshold=0.1)

def monitored_request(method: str, endpoint: str, payload: dict = None) -> dict:
    """Make a request with proactive rate monitoring."""
    # Throttle if needed
    delay = monitor.get_throttle_delay()
    if delay > 0:
        print(f"Proactive throttle: waiting {delay:.1f}s ({monitor.usage_percent:.0f}% used)")
        time.sleep(delay)

    response = make_request_with_backoff(method, endpoint, payload)

    # Note: in real code, update from actual response headers
    # monitor.update_from_headers(response.headers)
    return response
```

```typescript [TypeScript]
class RateLimitMonitor {
  private limit = 60;
  private remaining = 60;
  private resetAt = 0;
  private throttleThreshold: number;

  constructor(throttleThreshold = 0.1) {
    this.throttleThreshold = throttleThreshold;
  }

  updateFromHeaders(headers: Headers): void {
    const limit = headers.get("X-RateLimit-Limit");
    const remaining = headers.get("X-RateLimit-Remaining");
    const reset = headers.get("X-RateLimit-Reset");

    if (limit) this.limit = parseInt(limit, 10);
    if (remaining) this.remaining = parseInt(remaining, 10);
    if (reset) this.resetAt = parseInt(reset, 10);
  }

  shouldThrottle(): boolean {
    if (this.limit === 0) return false;
    const ratio = this.remaining / this.limit;
    return ratio <= this.throttleThreshold;
  }

  getThrottleDelay(): number {
    if (this.remaining <= 0) {
      const wait = Math.max(0, this.resetAt - Math.floor(Date.now() / 1000));
      return Math.min(wait, 60) * 1000;
    }
    if (this.shouldThrottle()) {
      const timeUntilReset = Math.max(1, this.resetAt - Math.floor(Date.now() / 1000));
      return (timeUntilReset / Math.max(1, this.remaining)) * 1000;
    }
    return 0;
  }

  get usagePercent(): number {
    if (this.limit === 0) return 0;
    return ((this.limit - this.remaining) / this.limit) * 100;
  }
}

// Usage
const monitor = new RateLimitMonitor(0.1);

async function monitoredRequest<T>(
  method: string,
  endpoint: string,
  payload?: Record<string, unknown>
): Promise<T> {
  const delay = monitor.getThrottleDelay();
  if (delay > 0) {
    console.log(
      `Proactive throttle: waiting ${(delay / 1000).toFixed(1)}s ` +
      `(${monitor.usagePercent.toFixed(0)}% used)`
    );
    await new Promise((r) => setTimeout(r, delay));
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  // Update monitor from response
  monitor.updateFromHeaders(response.headers);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

```go [Go]
package main

import (
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"
)

type RateLimitMonitor struct {
	mu                sync.Mutex
	limit             int
	remaining         int
	resetAt           int64
	throttleThreshold float64
}

func NewRateLimitMonitor(threshold float64) *RateLimitMonitor {
	return &RateLimitMonitor{
		limit:             60,
		remaining:         60,
		throttleThreshold: threshold,
	}
}

func (m *RateLimitMonitor) UpdateFromHeaders(headers http.Header) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if v := headers.Get("X-RateLimit-Limit"); v != "" {
		m.limit, _ = strconv.Atoi(v)
	}
	if v := headers.Get("X-RateLimit-Remaining"); v != "" {
		m.remaining, _ = strconv.Atoi(v)
	}
	if v := headers.Get("X-RateLimit-Reset"); v != "" {
		m.resetAt, _ = strconv.ParseInt(v, 10, 64)
	}
}

func (m *RateLimitMonitor) GetThrottleDelay() time.Duration {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.remaining <= 0 {
		wait := m.resetAt - time.Now().Unix()
		if wait < 0 {
			wait = 0
		}
		if wait > 60 {
			wait = 60
		}
		return time.Duration(wait) * time.Second
	}

	if m.limit > 0 {
		ratio := float64(m.remaining) / float64(m.limit)
		if ratio <= m.throttleThreshold {
			timeUntilReset := m.resetAt - time.Now().Unix()
			if timeUntilReset < 1 {
				timeUntilReset = 1
			}
			delayPerReq := float64(timeUntilReset) / float64(m.remaining)
			return time.Duration(delayPerReq * float64(time.Second))
		}
	}

	return 0
}

func (m *RateLimitMonitor) UsagePercent() float64 {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.limit == 0 {
		return 0
	}
	return float64(m.limit-m.remaining) / float64(m.limit) * 100
}

// Usage in main()
func example() {
	monitor := NewRateLimitMonitor(0.1)

	delay := monitor.GetThrottleDelay()
	if delay > 0 {
		fmt.Printf("Proactive throttle: waiting %v (%.0f%% used)\n",
			delay, monitor.UsagePercent())
		time.Sleep(delay)
	}
	// ... make request, then update:
	// monitor.UpdateFromHeaders(resp.Header)
}
```

```bash [cURL]
#!/bin/bash
# Monitor rate limit headers from response

API_BASE="https://apis.fotohub.app/v1"
API_KEY="fh_live_your_api_key"

# Make request and check rate limit headers
response=$(curl -s -D /tmp/fh_headers.txt \
  -H "Authorization: Bearer $API_KEY" \
  "$API_BASE/ai/models")

# Extract rate limit info
limit=$(grep -i "X-RateLimit-Limit:" /tmp/fh_headers.txt | awk '{print $2}' | tr -d '\r')
remaining=$(grep -i "X-RateLimit-Remaining:" /tmp/fh_headers.txt | awk '{print $2}' | tr -d '\r')
reset=$(grep -i "X-RateLimit-Reset:" /tmp/fh_headers.txt | awk '{print $2}' | tr -d '\r')

echo "Rate Limit: $remaining / $limit remaining"
echo "Resets at: $(date -d @$reset 2>/dev/null || date -r $reset 2>/dev/null)"

# Calculate usage percentage
if [ -n "$limit" ] && [ "$limit" -gt 0 ]; then
  used=$((limit - remaining))
  percent=$((used * 100 / limit))
  echo "Usage: ${percent}%"

  if [ $percent -ge 90 ]; then
    echo "WARNING: Rate limit nearly exhausted. Slow down requests." >&2
  fi
fi
```

:::

## Best Practices

### Implement Exponential Backoff

Start with a 1-second delay, double on each retry, and cap at 60 seconds. Add random jitter (0-1s) to prevent thundering herd problems when multiple clients retry simultaneously.

### Cache Responses Where Possible

Many endpoints return data that does not change frequently. Cache model listings, pricing info, and completed generation results to avoid redundant API calls.

### Use Bulk Endpoints

When available, use batch/bulk endpoints to combine multiple operations into a single request. This counts as one request against your rate limit instead of many.

### Monitor X-RateLimit-Remaining

Proactively check the remaining header value. When it drops below 10% of your limit, voluntarily slow down your request rate to avoid hitting the wall.

### Separate Read and Write Keys

Use different API keys for high-frequency read operations (model listing, job polling) and low-frequency write operations (generation, uploads). This prevents reads from exhausting your write budget.

### Queue Heavy Operations

For batch processing, use a job queue with rate-aware consumers that respect the API limits. Process items at a sustainable rate rather than bursting all at once.

## Quick Reference

| Behavior | Details |
|----------|---------|
| Window type | Sliding window, per-minute |
| Scope | Per API key (not per IP or user) |
| Burst allowance | 2-5x base limit for 5-30 seconds (tier-dependent) |
| Error code on limit | HTTP 429 Too Many Requests |
| Retry guidance | `Retry-After` header + `retry_after` field in body |
| Recommended strategy | Exponential backoff with jitter, cap at 60s |
| Usage monitoring | `X-RateLimit-Remaining` header in every response |
| Tier upgrades | Take effect immediately, no restart needed |
| Circuit breaker | Open after 5 failures, probe after 30s |

## Related APIs

- [Error Handling](/api/errors) -- Full error code reference and retry strategies.
- [Webhooks](/api/webhooks) -- Receive notifications instead of polling.
- [Authentication](/api/authentication) -- API key management and scopes.
