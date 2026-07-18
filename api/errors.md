# Error Handling

The FOTOhub API uses conventional HTTP status codes and returns structured JSON error responses for every failure. This page covers all error codes, the response format, retry strategies, idempotency, and best practices for building resilient integrations.

## Error Response Format

Every error response follows a consistent JSON structure. Use the `error` field for programmatic handling and `message` for user-facing display. The `request_id` is included in every response for support ticket correlation.

```json
{
  "error": "insufficient_credits",
  "message": "Not enough credits to complete this operation. Required: 5, available: 2.",
  "details": {
    "required_credits": 5,
    "available_credits": 2,
    "top_up_url": "https://fotohub.app/console/billing"
  },
  "request_id": "req_7kXm9pLqR2vN4wYz"
}
```

### Response Fields

| Field | Type | Always Present | Description |
|-------|------|----------------|-------------|
| `error` | string | Yes | Machine-readable error code in snake_case. Use for switch/match statements. |
| `message` | string | Yes | Human-readable description. Safe to display to end users. |
| `details` | object | No | Additional context — varies by error code. May include limits, field names, or URLs. |
| `request_id` | string | Yes | Unique request identifier (`req_xxx`). Include in support tickets for fast resolution. |

## HTTP Status Codes

The API uses standard HTTP status codes to indicate the outcome of a request. Codes in the 2xx range indicate success, 4xx indicate client errors, and 5xx indicate server-side failures.

| Status | Name | Description | Retryable |
|--------|------|-------------|-----------|
| 200 | OK | Request succeeded. Response body contains the result. | No |
| 201 | Created | Resource successfully created (e.g., new API key, project). | No |
| 400 | Bad Request | Invalid parameters, malformed JSON, or missing required fields. | No |
| 401 | Unauthorized | Missing or invalid API key in the Authorization header. | No |
| 402 | Payment Required | Insufficient credits or wallet balance for this operation. | No |
| 403 | Forbidden | API key does not have permission for this resource or action. | No |
| 404 | Not Found | The endpoint or requested resource does not exist. | No |
| 409 | Conflict | Resource already exists (e.g., duplicate project name). | No |
| 413 | Payload Too Large | Request body or uploaded file exceeds the maximum allowed size. | No |
| 422 | Unprocessable Entity | Valid JSON but semantically invalid (e.g., negative duration). | No |
| 429 | Too Many Requests | Rate limit exceeded. Check Retry-After header. | Yes |
| 500 | Internal Server Error | Unexpected server-side failure. Please report with request_id. | Yes |
| 502 | Bad Gateway | Upstream AI provider timed out or returned invalid response. | Yes |
| 503 | Service Unavailable | Model or service temporarily down for maintenance. | Yes |
| 504 | Gateway Timeout | Request exceeded the maximum allowed processing time. | Yes |

## Error Codes Reference

Complete list of error codes returned in the `error` field. Use these for programmatic error handling and recovery logic.

### Authentication and Authorization

| Error Code | HTTP Status | Description | Recovery Action |
|------------|-------------|-------------|-----------------|
| `invalid_api_key` | 401 | The API key format is invalid or not recognized. | Check key format (must start with `fh_live_` or `fh_test_`). |
| `expired_api_key` | 401 | The API key has passed its expiration date. | Generate a new key in the console. |
| `revoked_api_key` | 401 | The API key was manually revoked. | Create a new key — revoked keys cannot be restored. |

### Billing and Credits

| Error Code | HTTP Status | Description | Recovery Action |
|------------|-------------|-------------|-----------------|
| `insufficient_credits` | 402 | Not enough credits for this operation. | Top up credits or upgrade plan at `/console/billing`. |
| `wallet_empty` | 402 | Wallet balance is zero. | Add funds to the wallet via Stripe checkout. |
| `payment_failed` | 402 | Automatic charge failed (e.g., card declined). | Update payment method in billing settings. |

### Rate Limiting

| Error Code | HTTP Status | Description | Recovery Action |
|------------|-------------|-------------|-----------------|
| `rate_limit_exceeded` | 429 | Too many requests in the current window. | Wait for Retry-After header duration, then retry. |
| `quota_exceeded` | 429 | Daily or monthly API quota has been reached. | Wait for quota reset or upgrade to a higher tier. |

### Model and Generation

| Error Code | HTTP Status | Description | Recovery Action |
|------------|-------------|-------------|-----------------|
| `invalid_model` | 400 | Model ID is not recognized or not available. | Check `/v1/models` for valid model IDs. |
| `model_unavailable` | 503 | Model is temporarily offline for maintenance. | Retry after a few minutes or use a fallback model. |
| `model_overloaded` | 503 | Model is experiencing high demand. | Retry with exponential backoff. |
| `generation_failed` | 500 | The AI provider returned an error during generation. | Retry the request. If persistent, contact support with request_id. |
| `provider_error` | 502 | Upstream provider timed out or is unreachable. | Retry after a short delay. Provider may be experiencing issues. |
| `timeout` | 502 | Generation exceeded the maximum allowed time. | Try a simpler prompt, lower resolution, or shorter duration. |

### Validation and Input

| Error Code | HTTP Status | Description | Recovery Action |
|------------|-------------|-------------|-----------------|
| `invalid_parameters` | 400 | One or more parameters have invalid values. | Check the `details.fields` array for specific invalid params. |
| `missing_required_field` | 400 | A required field was not included in the request. | Add the missing field listed in `details.field`. |
| `file_too_large` | 413 | Uploaded file exceeds the size limit. | Compress or resize the file. Max 20MB for images, 100MB for video. |
| `unsupported_format` | 400 | File format is not supported for this operation. | Convert to a supported format (JPEG, PNG, WebP, MP4, MP3). |

### Resource Limits

| Error Code | HTTP Status | Description | Recovery Action |
|------------|-------------|-------------|-----------------|
| `storage_limit_reached` | 403 | Storage allocation for the account is full. | Delete unused files or upgrade storage plan. |

### Example Error Responses

**400 Bad Request — Invalid Parameters:**

```json
{
  "error": "invalid_parameters",
  "message": "Parameter 'width' must be between 256 and 2048.",
  "details": {
    "fields": [
      { "field": "width", "reason": "Value 5000 exceeds maximum of 2048" }
    ]
  },
  "request_id": "req_3mPqX8nKj1vR7wLz"
}
```

**401 Unauthorized — Invalid API Key:**

```json
{
  "error": "invalid_api_key",
  "message": "The API key provided is not valid. Keys must start with fh_live_ or fh_test_.",
  "request_id": "req_9xYm2kLpN4qW6vRt"
}
```

**402 Payment Required — Insufficient Credits:**

```json
{
  "error": "insufficient_credits",
  "message": "Not enough credits to complete this operation. Required: 5, available: 2.",
  "details": {
    "required_credits": 5,
    "available_credits": 2,
    "top_up_url": "https://fotohub.app/console/billing"
  },
  "request_id": "req_7kXm9pLqR2vN4wYz"
}
```

**403 Forbidden — Storage Limit:**

```json
{
  "error": "storage_limit_reached",
  "message": "Your account has reached its storage limit of 10GB.",
  "details": {
    "used_bytes": 10737418240,
    "limit_bytes": 10737418240
  },
  "request_id": "req_4nWp7xKmQ3vL9yRt"
}
```

**404 Not Found:**

```json
{
  "error": "not_found",
  "message": "The resource at /v1/projects/proj_nonexistent was not found.",
  "request_id": "req_2pXk5mNqR8vW3yLz"
}
```

**409 Conflict:**

```json
{
  "error": "conflict",
  "message": "A project with the name 'my-project' already exists.",
  "details": {
    "existing_id": "proj_abc123"
  },
  "request_id": "req_8wLm3kXp5vN7qRyz"
}
```

**413 Payload Too Large:**

```json
{
  "error": "file_too_large",
  "message": "Uploaded file exceeds the maximum size of 20MB for images.",
  "details": {
    "file_size_bytes": 52428800,
    "max_size_bytes": 20971520
  },
  "request_id": "req_6yNk9mWpX2vL4qRt"
}
```

**422 Unprocessable Entity:**

```json
{
  "error": "invalid_parameters",
  "message": "Duration must be a positive number.",
  "details": {
    "fields": [
      { "field": "duration", "reason": "Value -5 is not a positive number" }
    ]
  },
  "request_id": "req_1qXm4kNpR7vW9yLz"
}
```

**429 Too Many Requests:**

```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded. Please retry after 5 seconds.",
  "details": {
    "limit": 60,
    "remaining": 0,
    "reset_at": "2026-07-18T12:00:05Z"
  },
  "request_id": "req_5mXk8pNqW3vL7yRt"
}
```

**500 Internal Server Error:**

```json
{
  "error": "generation_failed",
  "message": "An internal error occurred during generation. Please retry or contact support.",
  "request_id": "req_7wLm2kXpN4vR9qYz"
}
```

**502 Bad Gateway:**

```json
{
  "error": "provider_error",
  "message": "Upstream provider timed out. Please retry your request.",
  "details": {
    "provider": "stability",
    "timeout_ms": 30000
  },
  "request_id": "req_3pXk6mNqR9vW2yLt"
}
```

**503 Service Unavailable:**

```json
{
  "error": "model_unavailable",
  "message": "Model 'kling-v2.5' is temporarily offline for maintenance.",
  "details": {
    "model": "kling-v2.5",
    "estimated_recovery": "2026-07-18T13:00:00Z"
  },
  "request_id": "req_4nWp8xKmQ5vL3yRz"
}
```

**504 Gateway Timeout:**

```json
{
  "error": "timeout",
  "message": "Request exceeded the maximum processing time of 120 seconds.",
  "details": {
    "timeout_ms": 120000,
    "operation": "video_generation"
  },
  "request_id": "req_9xYm1kLpN6qW4vRt"
}
```

## Retry Strategies

Implement exponential backoff with jitter for transient errors (429, 500, 502, 503, 504). Never retry 4xx errors other than 429 — they indicate a problem with the request itself that must be fixed before retrying.

### Exponential Backoff Algorithm

```
delay = min(base_delay * 2^attempt + random_jitter, max_delay)

Example sequence:
  Attempt 1: ~1.0s  (1 * 2^0 + jitter)
  Attempt 2: ~2.3s  (1 * 2^1 + jitter)
  Attempt 3: ~4.7s  (1 * 2^2 + jitter)
  Attempt 4: ~8.1s  (1 * 2^3 + jitter)
  Attempt 5: ~16.5s (1 * 2^4 + jitter, capped at max_delay)

Recommended defaults:
  base_delay:  1 second
  max_delay:   30 seconds
  max_retries: 3-5
  jitter:      0 to 1 second (uniform random)
```

### Retry Decision Matrix

| Scenario | Action | Delay Strategy |
|----------|--------|----------------|
| 429 with Retry-After header | Retry | Use header value + small jitter |
| 429 without Retry-After | Retry | Exponential backoff (start at 1s) |
| 500 Internal Server Error | Retry | Exponential backoff (start at 2s) |
| 502 Bad Gateway | Retry | Exponential backoff (start at 5s) |
| 503 Service Unavailable | Retry | Exponential backoff (start at 5s) |
| 504 Gateway Timeout | Retry | Exponential backoff (start at 5s) |
| 400/401/402/403/404/409/422 | Do NOT retry | Fix request and resubmit |
| Network timeout | Retry | Exponential backoff + use idempotency key |

### Python Example — Retry with Exponential Backoff

```python
import time
import random
import requests

API_BASE = "https://apis.fotohub.app/v1"
API_KEY = "fh_live_your_key_here"

RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}

class FotohubAPIError(Exception):
    def __init__(self, status: int, error: str, message: str, request_id: str):
        super().__init__(message)
        self.status = status
        self.error = error
        self.request_id = request_id

def request_with_retry(
    method: str,
    path: str,
    json_body: dict = None,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
):
    """Make an API request with automatic retry on transient errors."""
    url = f"{API_BASE}{path}"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    for attempt in range(max_retries + 1):
        try:
            response = requests.request(
                method, url, headers=headers, json=json_body, timeout=60
            )

            if response.status_code < 400:
                return response.json()

            error_body = response.json()
            error_code = error_body.get("error", "unknown")
            message = error_body.get("message", "Unknown error")
            request_id = error_body.get("request_id", "")

            # Non-retryable error — raise immediately
            if response.status_code not in RETRYABLE_STATUS_CODES:
                raise FotohubAPIError(
                    response.status_code, error_code, message, request_id
                )

            # Retryable error — check if we have retries left
            if attempt == max_retries:
                raise FotohubAPIError(
                    response.status_code, error_code, message, request_id
                )

            # Calculate delay with exponential backoff + jitter
            if response.status_code == 429:
                # Prefer server-provided Retry-After
                delay = float(response.headers.get("Retry-After", base_delay * (2 ** attempt)))
            else:
                delay = min(base_delay * (2 ** attempt), max_delay)

            jitter = random.uniform(0, 1)
            total_delay = delay + jitter

            print(f"[{error_code}] Retry {attempt + 1}/{max_retries} in {total_delay:.1f}s "
                  f"(request_id: {request_id})")
            time.sleep(total_delay)

        except requests.exceptions.Timeout:
            if attempt == max_retries:
                raise
            delay = min(base_delay * (2 ** attempt), max_delay) + random.uniform(0, 1)
            time.sleep(delay)

# Usage
try:
    result = request_with_retry("POST", "/ai/generate/image", {
        "model": "seedream-5-0-260128",
        "prompt": "A serene mountain landscape at golden hour",
        "width": 1024,
        "height": 1024,
    })
    print(f"Generated: {result['url']}")

except FotohubAPIError as e:
    if e.error == "insufficient_credits":
        print(f"Out of credits! Top up at fotohub.app/console/billing")
    elif e.error == "invalid_parameters":
        print(f"Bad request: {e}")
    else:
        print(f"API error [{e.error}]: {e} (request_id: {e.request_id})")
```

### TypeScript Example — Retry with Exponential Backoff

```typescript
const API_BASE = "https://apis.fotohub.app/v1";
const API_KEY = "fh_live_your_key_here";

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

interface FotohubError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  request_id: string;
}

class FotohubAPIError extends Error {
  status: number;
  code: string;
  requestId: string;
  details?: Record<string, unknown>;

  constructor(status: number, body: FotohubError) {
    super(body.message);
    this.name = "FotohubAPIError";
    this.status = status;
    this.code = body.error;
    this.requestId = body.request_id;
    this.details = body.details;
  }
}

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

async function requestWithRetry<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 30000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.ok) {
      return response.json() as Promise<T>;
    }

    const errorBody: FotohubError = await response.json();

    // Non-retryable error
    if (!RETRYABLE_STATUS_CODES.has(response.status)) {
      throw new FotohubAPIError(response.status, errorBody);
    }

    // Last attempt — throw
    if (attempt === maxRetries) {
      throw new FotohubAPIError(response.status, errorBody);
    }

    // Calculate delay
    let delay: number;
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      delay = retryAfter
        ? parseFloat(retryAfter) * 1000
        : baseDelay * Math.pow(2, attempt);
    } else {
      delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    }

    // Add jitter (0-1000ms)
    const jitter = Math.random() * 1000;
    const totalDelay = delay + jitter;

    console.log(
      `[${errorBody.error}] Retry ${attempt + 1}/${maxRetries} ` +
      `in ${(totalDelay / 1000).toFixed(1)}s (request_id: ${errorBody.request_id})`
    );

    await new Promise((resolve) => setTimeout(resolve, totalDelay));
  }

  throw new Error("Unreachable");
}

// Usage
try {
  const result = await requestWithRetry<{ url: string }>(
    "POST",
    "/ai/generate/image",
    {
      model: "seedream-5-0-260128",
      prompt: "A serene mountain landscape at golden hour",
      width: 1024,
      height: 1024,
    }
  );
  console.log(`Generated: ${result.url}`);
} catch (e) {
  if (e instanceof FotohubAPIError) {
    switch (e.code) {
      case "insufficient_credits":
        console.error("Out of credits! Top up at fotohub.app/console/billing");
        break;
      case "invalid_parameters":
        console.error(`Bad request: ${e.message}`, e.details);
        break;
      default:
        console.error(`API error [${e.code}]: ${e.message} (request_id: ${e.requestId})`);
    }
  }
}
```

## Rate Limit Handling

When you receive a `429` response, the server includes a `Retry-After` header indicating how many seconds to wait before retrying.

### Rate Limit Response Headers

| Header | Description |
|--------|-------------|
| `Retry-After` | Number of seconds to wait before retrying |
| `X-RateLimit-Limit` | Maximum number of requests allowed in the current window |
| `X-RateLimit-Remaining` | Number of requests remaining in the current window |
| `X-RateLimit-Reset` | Unix timestamp when the rate limit window resets |

### Example Rate Limit Response

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 5
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1752844805
Content-Type: application/json

{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded. Please retry after 5 seconds.",
  "details": {
    "limit": 60,
    "remaining": 0,
    "reset_at": "2026-07-18T12:00:05Z"
  },
  "request_id": "req_5mXk8pNqW3vL7yRt"
}
```

### Handling Retry-After in Python

```python
import time
import requests

def handle_rate_limit(response):
    """Respect the Retry-After header from rate-limited responses."""
    retry_after = response.headers.get("Retry-After")
    if retry_after:
        wait_seconds = float(retry_after)
        print(f"Rate limited. Waiting {wait_seconds}s before retry...")
        time.sleep(wait_seconds)
    else:
        # Fallback: exponential backoff
        time.sleep(5)
```

### Handling Retry-After in TypeScript

```typescript
async function handleRateLimit(response: Response): Promise<void> {
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) {
    const waitMs = parseFloat(retryAfter) * 1000;
    console.log(`Rate limited. Waiting ${retryAfter}s before retry...`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  } else {
    // Fallback: 5 second delay
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
```

## Idempotency Keys

To safely retry requests without risking duplicate charges or duplicate generations, include the `X-Idempotency-Key` header. If a request with the same key is received within 24 hours, the API returns the original cached response without re-executing the operation.

### Python — Idempotent Request with Retry

```python
import uuid
import requests

# Generate a unique key per logical operation
idempotency_key = str(uuid.uuid4())

headers = {
    "Authorization": "Bearer fh_live_your_key_here",
    "Content-Type": "application/json",
    "X-Idempotency-Key": idempotency_key,
}

# First request
response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers=headers,
    json={"model": "seedream-5-0-260128", "prompt": "A sunset over the ocean"},
)

# If request times out or fails, safe to retry with the same key
# The server will return the cached result (no double billing)
response_retry = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers=headers,  # Same X-Idempotency-Key
    json={"model": "seedream-5-0-260128", "prompt": "A sunset over the ocean"},
)
# response_retry == response (same result, charged only once)
```

### TypeScript — Idempotent Request with Retry

```typescript
import { randomUUID } from "crypto";

// Generate a unique key per logical operation
const idempotencyKey = randomUUID();

async function generateWithIdempotency(prompt: string) {
  const headers = {
    Authorization: "Bearer fh_live_your_key_here",
    "Content-Type": "application/json",
    "X-Idempotency-Key": idempotencyKey,
  };

  const body = JSON.stringify({
    model: "seedream-5-0-260128",
    prompt,
  });

  // Safe to retry — same key guarantees at-most-once execution
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
        method: "POST",
        headers,
        body,
      });

      if (res.ok) return res.json();

      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }

      throw new Error(`API error: ${res.status}`);
    } catch (e) {
      if (attempt === 2) throw e;
    }
  }
}
```

### Idempotency Key Rules

::: warning Important
- Keys must be unique per distinct operation (use UUIDs).
- Keys expire after 24 hours.
- Same key + different request body = returns the original cached response (not the new request).
- Keys are scoped to your API key — different API keys can use the same idempotency key independently.
:::

## Circuit Breaker Pattern

After multiple consecutive failures, implement a circuit breaker to pause requests and avoid overwhelming a recovering service. This protects both your application and the API.

### Circuit Breaker States

| State | Behavior |
|-------|----------|
| **Closed** | Requests flow normally. Failures are counted. |
| **Open** | All requests are immediately rejected locally (no API call). |
| **Half-Open** | A single probe request is allowed through. If it succeeds, circuit closes. If it fails, circuit re-opens. |

### TypeScript — Circuit Breaker Implementation

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      // Check if enough time has passed to try again
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = "half-open";
      } else {
        throw new Error(
          `Circuit breaker is open. Retry after ${
            Math.ceil((this.resetTimeoutMs - (Date.now() - this.lastFailureTime)) / 1000)
          }s`
        );
      }
    }

    try {
      const result = await fn();
      // Success — reset the circuit
      this.failureCount = 0;
      this.state = "closed";
      return result;
    } catch (error: any) {
      // Only count server errors toward the circuit breaker
      if (error.status >= 500 || error.status === 429) {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.failureThreshold) {
          this.state = "open";
          console.warn(
            `Circuit breaker opened after ${this.failureCount} failures. ` +
            `Will retry in ${this.resetTimeoutMs / 1000}s.`
          );
        }
      }
      throw error;
    }
  }
}

// Usage
const breaker = new CircuitBreaker(5, 30000);

async function generateImage(prompt: string) {
  return breaker.execute(() =>
    requestWithRetry("POST", "/ai/generate/image", {
      model: "seedream-5-0-260128",
      prompt,
    })
  );
}
```

### Python — Circuit Breaker Implementation

```python
import time

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, reset_timeout: float = 30.0):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = "closed"  # closed, open, half-open

    def execute(self, fn, *args, **kwargs):
        if self.state == "open":
            elapsed = time.time() - self.last_failure_time
            if elapsed >= self.reset_timeout:
                self.state = "half-open"
            else:
                remaining = self.reset_timeout - elapsed
                raise RuntimeError(
                    f"Circuit breaker is open. Retry after {remaining:.0f}s"
                )

        try:
            result = fn(*args, **kwargs)
            # Success — reset
            self.failure_count = 0
            self.state = "closed"
            return result
        except FotohubAPIError as e:
            if e.status >= 500 or e.status == 429:
                self.failure_count += 1
                self.last_failure_time = time.time()

                if self.failure_count >= self.failure_threshold:
                    self.state = "open"
                    print(f"Circuit breaker opened after {self.failure_count} failures. "
                          f"Will retry in {self.reset_timeout}s.")
            raise

# Usage
breaker = CircuitBreaker(failure_threshold=5, reset_timeout=30.0)

def generate_image(prompt: str):
    return breaker.execute(
        request_with_retry,
        "POST", "/ai/generate/image",
        {"model": "seedream-5-0-260128", "prompt": prompt}
    )
```

## Request ID for Support

Every API response (success or error) includes a `request_id` field and an `X-Request-ID` response header. Always log these values — they allow our support team to quickly locate and diagnose issues.

```json
// From response body (always present in errors)
{
  "error": "generation_failed",
  "message": "Upstream provider returned an error",
  "request_id": "req_7kXm9pLqR2vN4wYz"
}
```

```http
// From response header (always present)
X-Request-ID: req_7kXm9pLqR2vN4wYz
```

When contacting support, include:
1. The `request_id`
2. Timestamp of the request
3. The endpoint and parameters used

### Logging Request IDs — Python

```python
import logging
import requests

logger = logging.getLogger("fotohub")

response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={"Authorization": "Bearer fh_live_your_key_here"},
    json={"model": "seedream-5-0-260128", "prompt": "A landscape"},
)

# Always log the request ID for debugging
request_id = response.headers.get("X-Request-ID", "unknown")
logger.info(f"FOTOhub request_id={request_id} status={response.status_code}")

if response.status_code >= 400:
    error_body = response.json()
    logger.error(
        f"FOTOhub API error: [{error_body['error']}] {error_body['message']} "
        f"(request_id: {error_body['request_id']})"
    )
```

## Error Handling Best Practices

### Always check error codes programmatically

Use the `error` field (not `message`) for control flow. Messages may change between versions; error codes are stable and part of the API contract.

### Log request_id with every call

Store `request_id` in your logs for every request. It is the fastest way to get help from support and enables end-to-end request tracing.

### Use idempotency keys for mutations

Any request that charges credits or creates resources should include the `X-Idempotency-Key` header. This prevents duplicate operations when retrying after timeouts or network errors.

### Implement circuit breakers

After 5+ consecutive 5xx errors, pause requests for 30 seconds to avoid overwhelming a recovering service. This protects your application from cascading failures.

### Set per-operation timeouts

Different operations have different expected durations. Configure timeouts accordingly:

| Operation | Recommended Timeout |
|-----------|-------------------|
| Image generation | 30s |
| Video generation | 120s |
| Chat / text generation | 30s |
| Image analysis | 15s |
| Audio generation | 60s |
| File upload | 30s |

### Handle 402 gracefully in UI

When users run out of credits, show a clear path to top up rather than a generic error page. The `details.top_up_url` field provides a direct link to the billing page.

::: tip
The official SDKs (Python and TypeScript) handle retries, idempotency, and error classification automatically. If you are building a new integration, start with the SDK rather than raw HTTP — see the [SDKs section](/sdk/python) for installation and usage.
:::
