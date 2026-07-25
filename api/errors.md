# Error Handling

The FOTOhub API uses conventional HTTP status codes and returns structured JSON error responses for every failure. This page covers all error codes, the response format, retry strategies, idempotency, and best practices for building resilient integrations.

::: info SDK Auto-Handling
The official SDKs (Python and TypeScript) classify errors automatically, retry transient failures with exponential backoff, and raise typed exceptions. If you are building a new integration, start with the SDK for the smoothest experience.
:::

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
  "message": "Model 'kling' is temporarily offline for maintenance.",
  "details": {
    "model": "kling",
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

### Implementation — Retry with Exponential Backoff

::: code-group

```python [Python]
import time
import random
import requests

API_BASE = "https://apis.fotohub.app/v1"
API_KEY = "fh_live_your_api_key"

RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


class FotohubAPIError(Exception):
    """Structured error from the FOTOhub API."""

    def __init__(self, status: int, error: str, message: str, request_id: str, details: dict = None):
        super().__init__(message)
        self.status = status
        self.error = error
        self.request_id = request_id
        self.details = details or {}


def request_with_retry(
    method: str,
    path: str,
    json_body: dict = None,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
) -> dict:
    """
    Make an API request with automatic retry on transient errors.
    Respects Retry-After header for 429 responses.
    Does NOT retry client errors (400, 401, 402, 403, 404, 409, 422).
    """
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
            details = error_body.get("details", {})

            # Non-retryable error — raise immediately
            if response.status_code not in RETRYABLE_STATUS_CODES:
                raise FotohubAPIError(
                    response.status_code, error_code, message, request_id, details
                )

            # Retryable error — check if we have retries left
            if attempt == max_retries:
                raise FotohubAPIError(
                    response.status_code, error_code, message, request_id, details
                )

            # Calculate delay with exponential backoff + jitter
            if response.status_code == 429:
                # Prefer server-provided Retry-After
                delay = float(response.headers.get("Retry-After", base_delay * (2 ** attempt)))
            else:
                delay = min(base_delay * (2 ** attempt), max_delay)

            jitter = random.uniform(0, 1)
            total_delay = delay + jitter

            print(
                f"[{error_code}] Retry {attempt + 1}/{max_retries} in {total_delay:.1f}s "
                f"(request_id: {request_id})"
            )
            time.sleep(total_delay)

        except requests.exceptions.Timeout:
            if attempt == max_retries:
                raise
            delay = min(base_delay * (2 ** attempt), max_delay) + random.uniform(0, 1)
            time.sleep(delay)

    raise Exception(f"Max retries ({max_retries}) exceeded for {path}")


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
        print(f"Bad request: {e} — fields: {e.details.get('fields', [])}")
    elif e.error == "model_unavailable":
        print(f"Model offline: {e} — try a fallback model")
    else:
        print(f"API error [{e.error}]: {e} (request_id: {e.request_id})")
```

```typescript [TypeScript]
const API_BASE = "https://apis.fotohub.app/v1";
const API_KEY = "fh_live_your_api_key";

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

interface FotohubErrorBody {
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

  constructor(status: number, body: FotohubErrorBody) {
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

    const errorBody: FotohubErrorBody = await response.json();

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

    console.warn(
      `[${errorBody.error}] Retry ${attempt + 1}/${maxRetries} ` +
        `in ${(totalDelay / 1000).toFixed(1)}s ` +
        `(request_id: ${errorBody.request_id})`
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
      case "model_unavailable":
        console.error(`Model offline: ${e.message} — try a fallback model`);
        break;
      default:
        console.error(
          `API error [${e.code}]: ${e.message} (request_id: ${e.requestId})`
        );
    }
  }
}
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
	maxRetries = 3
	baseDelay  = 1 * time.Second
	maxDelay   = 30 * time.Second
)

// FotohubAPIError represents a structured API error.
type FotohubAPIError struct {
	Status    int                    `json:"-"`
	Error     string                 `json:"error"`
	Message   string                 `json:"message"`
	Details   map[string]interface{} `json:"details,omitempty"`
	RequestID string                 `json:"request_id"`
}

func (e *FotohubAPIError) Unwrap() string {
	return fmt.Sprintf("[%s] %s (request_id: %s)", e.Error, e.Message, e.RequestID)
}

// Retryable status codes
var retryableStatusCodes = map[int]bool{
	429: true, 500: true, 502: true, 503: true, 504: true,
}

func requestWithRetry(method, path string, payload interface{}) (map[string]interface{}, error) {
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
			req, err = http.NewRequest(method, apiBase+path, bytes.NewReader(bodyBytes))
		} else {
			req, err = http.NewRequest(method, apiBase+path, nil)
		}
		if err != nil {
			return nil, err
		}

		req.Header.Set("Authorization", "Bearer "+apiKey)
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 60 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			// Network error — retry with backoff
			if attempt == maxRetries {
				return nil, fmt.Errorf("network error after %d retries: %w", maxRetries, err)
			}
			time.Sleep(calculateBackoff(attempt))
			continue
		}
		defer resp.Body.Close()

		// Success
		if resp.StatusCode < 400 {
			var result map[string]interface{}
			json.NewDecoder(resp.Body).Decode(&result)
			return result, nil
		}

		// Parse error body
		var apiErr FotohubAPIError
		json.NewDecoder(resp.Body).Decode(&apiErr)
		apiErr.Status = resp.StatusCode

		// Non-retryable client error
		if !retryableStatusCodes[resp.StatusCode] {
			return nil, fmt.Errorf("API error %d [%s]: %s (request_id: %s)",
				apiErr.Status, apiErr.Error, apiErr.Message, apiErr.RequestID)
		}

		// Last attempt — return error
		if attempt == maxRetries {
			return nil, fmt.Errorf("API error %d [%s] after %d retries: %s (request_id: %s)",
				apiErr.Status, apiErr.Error, maxRetries, apiErr.Message, apiErr.RequestID)
		}

		// Calculate wait time
		var waitTime time.Duration
		if resp.StatusCode == 429 {
			if retryAfter := resp.Header.Get("Retry-After"); retryAfter != "" {
				seconds, _ := strconv.ParseFloat(retryAfter, 64)
				waitTime = time.Duration(seconds * float64(time.Second))
			} else {
				waitTime = calculateBackoff(attempt)
			}
		} else {
			waitTime = calculateBackoff(attempt)
		}

		// Add jitter
		jitter := time.Duration(rand.Float64() * float64(time.Second))
		totalWait := waitTime + jitter
		if totalWait > maxDelay {
			totalWait = maxDelay
		}

		fmt.Printf("[%s] Retry %d/%d in %v (request_id: %s)\n",
			apiErr.Error, attempt+1, maxRetries, totalWait, apiErr.RequestID)
		time.Sleep(totalWait)
	}

	return nil, fmt.Errorf("max retries (%d) exceeded for %s", maxRetries, path)
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
	result, err := requestWithRetry("POST", "/ai/generate/image", map[string]interface{}{
		"model":  "seedream-5-0-260128",
		"prompt": "A serene mountain landscape at golden hour",
		"width":  1024,
		"height": 1024,
	})
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	fmt.Printf("Generated: %s\n", result["url"])
}
```

```bash [cURL]
#!/bin/bash
# FOTOhub API request with exponential backoff and jitter.
# Retries on 429, 500, 502, 503, 504. Stops on 4xx client errors.

API_BASE="https://apis.fotohub.app/v1"
API_KEY="fh_live_your_api_key"
MAX_RETRIES=3

fotohub_request() {
  local method="$1"
  local endpoint="$2"
  local payload="$3"
  local attempt=0
  local base_delay=1

  while [ $attempt -le $MAX_RETRIES ]; do
    # Make the request, capture status code separately
    local tmpfile=$(mktemp)
    local http_code
    http_code=$(curl -s -w "%{http_code}" \
      -X "$method" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -D /tmp/fh_headers.txt \
      -o "$tmpfile" \
      ${payload:+-d "$payload"} \
      "$API_BASE$endpoint")

    local body
    body=$(cat "$tmpfile")
    rm -f "$tmpfile"

    # Success (2xx)
    if [ "$http_code" -lt 400 ] 2>/dev/null; then
      echo "$body"
      return 0
    fi

    # Non-retryable client errors (400, 401, 402, 403, 404, 409, 413, 422)
    if [ "$http_code" -ge 400 ] && [ "$http_code" -lt 429 ] 2>/dev/null; then
      echo "Client error HTTP $http_code: $body" >&2
      return 1
    fi
    if [ "$http_code" -gt 429 ] && [ "$http_code" -lt 500 ] 2>/dev/null; then
      echo "Client error HTTP $http_code: $body" >&2
      return 1
    fi

    # Retryable (429, 500-504) — check retries left
    if [ $attempt -eq $MAX_RETRIES ]; then
      echo "Failed after $MAX_RETRIES retries. HTTP $http_code: $body" >&2
      return 1
    fi

    # Calculate wait time
    local wait_time
    if [ "$http_code" = "429" ]; then
      # Prefer Retry-After header
      local retry_after
      retry_after=$(grep -i "Retry-After:" /tmp/fh_headers.txt \
        | awk '{print $2}' | tr -d '\r')
      if [ -n "$retry_after" ]; then
        wait_time=$retry_after
      else
        wait_time=$((base_delay * (2 ** attempt)))
      fi
    else
      wait_time=$((base_delay * (2 ** attempt)))
    fi

    # Add jitter (0-1 second)
    local jitter
    jitter=$(echo "scale=2; $RANDOM / 32767" | bc)
    local total_wait
    total_wait=$(echo "$wait_time + $jitter" | bc)

    # Cap at 30 seconds
    if [ "$(echo "$total_wait > 30" | bc)" -eq 1 ]; then
      total_wait=30
    fi

    local request_id
    request_id=$(echo "$body" | jq -r '.request_id // "unknown"')
    local error_code
    error_code=$(echo "$body" | jq -r '.error // "unknown"')

    echo "[$error_code] Retry $((attempt+1))/$MAX_RETRIES in ${total_wait}s (request_id: $request_id)" >&2
    sleep "$total_wait"
    attempt=$((attempt + 1))
  done

  echo "Max retries exceeded" >&2
  return 1
}

# Usage
result=$(fotohub_request "POST" "/ai/generate/image" '{
  "model": "seedream-5-0-260128",
  "prompt": "A serene mountain landscape at golden hour",
  "width": 1024,
  "height": 1024
}')

if [ $? -eq 0 ]; then
  echo "Generated: $(echo "$result" | jq -r '.url')"
else
  echo "Generation failed"
fi
```

:::

## Rate Limit Handling

When you receive a `429` response, the server includes a `Retry-After` header indicating how many seconds to wait before retrying. Always respect this value rather than using arbitrary delays.

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

### Handling Retry-After

::: code-group

```python [Python]
import time
import requests

def handle_rate_limit(response: requests.Response) -> float:
    """
    Respect the Retry-After header from rate-limited responses.
    Returns the number of seconds waited.
    """
    retry_after = response.headers.get("Retry-After")
    if retry_after:
        wait_seconds = float(retry_after)
        print(f"Rate limited. Waiting {wait_seconds}s before retry...")
        time.sleep(wait_seconds)
        return wait_seconds
    else:
        # Fallback: exponential backoff starting at 5s
        print("Rate limited (no Retry-After). Waiting 5s...")
        time.sleep(5)
        return 5.0


# Proactive monitoring — throttle before hitting the limit
def check_rate_limit_headers(response: requests.Response) -> bool:
    """
    Check rate limit headers and warn if nearing the limit.
    Returns True if you should slow down.
    """
    remaining = response.headers.get("X-RateLimit-Remaining")
    limit = response.headers.get("X-RateLimit-Limit")

    if remaining and limit:
        ratio = int(remaining) / int(limit)
        if ratio <= 0.1:
            print(f"WARNING: Only {remaining}/{limit} requests remaining in window")
            return True
    return False
```

```typescript [TypeScript]
async function handleRateLimit(response: Response): Promise<number> {
  /**
   * Respect the Retry-After header from rate-limited responses.
   * Returns the number of milliseconds waited.
   */
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) {
    const waitMs = parseFloat(retryAfter) * 1000;
    console.log(`Rate limited. Waiting ${retryAfter}s before retry...`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return waitMs;
  } else {
    // Fallback: 5 second delay
    console.log("Rate limited (no Retry-After). Waiting 5s...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return 5000;
  }
}

// Proactive monitoring — throttle before hitting the limit
function checkRateLimitHeaders(response: Response): boolean {
  const remaining = response.headers.get("X-RateLimit-Remaining");
  const limit = response.headers.get("X-RateLimit-Limit");

  if (remaining && limit) {
    const ratio = parseInt(remaining) / parseInt(limit);
    if (ratio <= 0.1) {
      console.warn(`WARNING: Only ${remaining}/${limit} requests remaining`);
      return true; // Should slow down
    }
  }
  return false;
}
```

```go [Go]
package main

import (
	"fmt"
	"net/http"
	"strconv"
	"time"
)

// handleRateLimit respects the Retry-After header and blocks until safe to retry.
func handleRateLimit(resp *http.Response) time.Duration {
	retryAfter := resp.Header.Get("Retry-After")
	if retryAfter != "" {
		seconds, err := strconv.ParseFloat(retryAfter, 64)
		if err == nil {
			wait := time.Duration(seconds * float64(time.Second))
			fmt.Printf("Rate limited. Waiting %v before retry...\n", wait)
			time.Sleep(wait)
			return wait
		}
	}

	// Fallback: 5 second delay
	fmt.Println("Rate limited (no Retry-After). Waiting 5s...")
	time.Sleep(5 * time.Second)
	return 5 * time.Second
}

// checkRateLimitHeaders returns true if the client should slow down.
func checkRateLimitHeaders(resp *http.Response) bool {
	remainingStr := resp.Header.Get("X-RateLimit-Remaining")
	limitStr := resp.Header.Get("X-RateLimit-Limit")

	if remainingStr != "" && limitStr != "" {
		remaining, _ := strconv.Atoi(remainingStr)
		limit, _ := strconv.Atoi(limitStr)
		if limit > 0 {
			ratio := float64(remaining) / float64(limit)
			if ratio <= 0.1 {
				fmt.Printf("WARNING: Only %d/%d requests remaining in window\n",
					remaining, limit)
				return true
			}
		}
	}
	return false
}
```

```bash [cURL]
#!/bin/bash
# Handle rate limiting from FOTOhub API responses

API_BASE="https://apis.fotohub.app/v1"
API_KEY="fh_live_your_api_key"

# Make a request and check rate limit status
response=$(curl -s -D /tmp/fh_headers.txt \
  -H "Authorization: Bearer $API_KEY" \
  -w "\n%{http_code}" \
  "$API_BASE/ai/models")

http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "429" ]; then
  # Extract Retry-After header
  retry_after=$(grep -i "Retry-After:" /tmp/fh_headers.txt \
    | awk '{print $2}' | tr -d '\r')

  if [ -n "$retry_after" ]; then
    echo "Rate limited. Waiting ${retry_after}s..." >&2
    sleep "$retry_after"
  else
    echo "Rate limited. Waiting 5s..." >&2
    sleep 5
  fi
fi

# Proactive monitoring
remaining=$(grep -i "X-RateLimit-Remaining:" /tmp/fh_headers.txt \
  | awk '{print $2}' | tr -d '\r')
limit=$(grep -i "X-RateLimit-Limit:" /tmp/fh_headers.txt \
  | awk '{print $2}' | tr -d '\r')

if [ -n "$remaining" ] && [ -n "$limit" ] && [ "$limit" -gt 0 ]; then
  percent_used=$(( (limit - remaining) * 100 / limit ))
  echo "Rate limit usage: ${percent_used}% ($remaining/$limit remaining)"

  if [ $percent_used -ge 90 ]; then
    echo "WARNING: Approaching rate limit. Slow down requests." >&2
  fi
fi
```

:::

## Idempotency Keys

To safely retry requests without risking duplicate charges or duplicate generations, include the `X-Idempotency-Key` header. If a request with the same key is received within 24 hours, the API returns the original cached response without re-executing the operation.

### Rules

::: warning Important
- Keys must be unique per distinct operation (use UUIDs).
- Keys expire after 24 hours.
- Same key + different request body = returns the original cached response (not the new request).
- Keys are scoped to your API key — different API keys can use the same idempotency key independently.
- Only applicable to mutating operations (POST, PUT, PATCH). GET requests are naturally idempotent.
:::

### Implementation

::: code-group

```python [Python]
import uuid
import time
import random
import requests

API_BASE = "https://apis.fotohub.app/v1"
API_KEY = "fh_live_your_api_key"


def generate_with_idempotency(prompt: str, max_retries: int = 3) -> dict:
    """
    Generate an image with idempotency protection.
    Safe to retry on failure — the server guarantees at-most-once execution.
    """
    # Generate a unique key for this logical operation
    idempotency_key = str(uuid.uuid4())

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotency_key,
    }

    payload = {
        "model": "seedream-5-0-260128",
        "prompt": prompt,
        "width": 1024,
        "height": 1024,
    }

    for attempt in range(max_retries):
        try:
            response = requests.post(
                f"{API_BASE}/ai/generate/image",
                headers=headers,
                json=payload,
                timeout=60,
            )

            if response.status_code < 400:
                return response.json()

            # Retryable errors — safe to retry with same idempotency key
            if response.status_code in (429, 500, 502, 503, 504):
                if attempt < max_retries - 1:
                    delay = min(1 * (2 ** attempt), 30) + random.uniform(0, 1)
                    print(f"Retrying ({attempt + 1}/{max_retries}) in {delay:.1f}s...")
                    time.sleep(delay)
                    continue

            # Non-retryable error
            error_body = response.json()
            raise Exception(
                f"API error [{error_body['error']}]: {error_body['message']} "
                f"(request_id: {error_body['request_id']})"
            )

        except requests.exceptions.Timeout:
            # Timeout — safe to retry with same idempotency key
            if attempt < max_retries - 1:
                delay = min(2 * (2 ** attempt), 30)
                time.sleep(delay)
                continue
            raise

    raise Exception(f"Failed after {max_retries} retries")


# Usage — even if the first request times out, the retry returns the same
# cached result (charged only once)
result = generate_with_idempotency("A sunset over the ocean")
print(f"URL: {result['url']}")
```

```typescript [TypeScript]
import { randomUUID } from "crypto";

const API_BASE = "https://apis.fotohub.app/v1";
const API_KEY = "fh_live_your_api_key";

async function generateWithIdempotency(
  prompt: string,
  maxRetries = 3
): Promise<{ url: string }> {
  /**
   * Generate an image with idempotency protection.
   * Safe to retry on failure — at-most-once execution guaranteed.
   */
  const idempotencyKey = randomUUID();

  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    "X-Idempotency-Key": idempotencyKey,
  };

  const body = JSON.stringify({
    model: "seedream-5-0-260128",
    prompt,
    width: 1024,
    height: 1024,
  });

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`${API_BASE}/ai/generate/image`, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(60000),
      });

      if (response.ok) {
        return response.json();
      }

      // Retryable errors — safe to retry with same idempotency key
      if ([429, 500, 502, 503, 504].includes(response.status)) {
        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          const jitter = Math.random() * 1000;
          console.warn(`Retrying (${attempt + 1}/${maxRetries}) in ${((delay + jitter) / 1000).toFixed(1)}s...`);
          await new Promise((r) => setTimeout(r, delay + jitter));
          continue;
        }
      }

      // Non-retryable error
      const errorBody = await response.json();
      throw new Error(
        `API error [${errorBody.error}]: ${errorBody.message} ` +
          `(request_id: ${errorBody.request_id})`
      );
    } catch (e: any) {
      if (e.name === "TimeoutError" && attempt < maxRetries - 1) {
        const delay = Math.min(2000 * Math.pow(2, attempt), 30000);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      if (attempt === maxRetries - 1) throw e;
    }
  }

  throw new Error(`Failed after ${maxRetries} retries`);
}

// Usage — even if the first request times out, the retry returns the
// same cached result (charged only once)
const result = await generateWithIdempotency("A sunset over the ocean");
console.log(`URL: ${result.url}`);
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
	"time"

	"github.com/google/uuid"
)

const (
	apiBase = "https://apis.fotohub.app/v1"
	apiKey  = "fh_live_your_api_key"
)

func generateWithIdempotency(prompt string, maxRetries int) (map[string]interface{}, error) {
	// Generate a unique key for this logical operation
	idempotencyKey := uuid.New().String()

	payload, _ := json.Marshal(map[string]interface{}{
		"model":  "seedream-5-0-260128",
		"prompt": prompt,
		"width":  1024,
		"height": 1024,
	})

	retryableStatusCodes := map[int]bool{
		429: true, 500: true, 502: true, 503: true, 504: true,
	}

	for attempt := 0; attempt < maxRetries; attempt++ {
		req, _ := http.NewRequest("POST",
			apiBase+"/ai/generate/image",
			bytes.NewReader(payload))
		req.Header.Set("Authorization", "Bearer "+apiKey)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Idempotency-Key", idempotencyKey)

		client := &http.Client{Timeout: 60 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			// Network/timeout error — safe to retry with same key
			if attempt < maxRetries-1 {
				delay := time.Duration(math.Min(
					float64(2*time.Second)*math.Pow(2, float64(attempt)),
					float64(30*time.Second),
				))
				time.Sleep(delay)
				continue
			}
			return nil, err
		}
		defer resp.Body.Close()

		// Success
		if resp.StatusCode < 400 {
			var result map[string]interface{}
			json.NewDecoder(resp.Body).Decode(&result)
			return result, nil
		}

		// Retryable errors — safe to retry with same idempotency key
		if retryableStatusCodes[resp.StatusCode] && attempt < maxRetries-1 {
			delay := math.Min(
				float64(time.Second)*math.Pow(2, float64(attempt)),
				float64(30*time.Second),
			)
			jitter := rand.Float64() * float64(time.Second)
			fmt.Printf("Retrying (%d/%d) in %v...\n", attempt+1, maxRetries,
				time.Duration(delay+jitter))
			time.Sleep(time.Duration(delay + jitter))
			continue
		}

		// Non-retryable error
		var errBody map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errBody)
		return nil, fmt.Errorf("API error [%v]: %v (request_id: %v)",
			errBody["error"], errBody["message"], errBody["request_id"])
	}

	return nil, fmt.Errorf("failed after %d retries", maxRetries)
}

func main() {
	result, err := generateWithIdempotency("A sunset over the ocean", 3)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	fmt.Printf("URL: %s\n", result["url"])
}
```

```bash [cURL]
#!/bin/bash
# Idempotent request with retry for FOTOhub API.
# Uses X-Idempotency-Key header to prevent duplicate executions.

API_BASE="https://apis.fotohub.app/v1"
API_KEY="fh_live_your_api_key"

# Generate a unique idempotency key (UUID v4)
IDEMPOTENCY_KEY=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen)
MAX_RETRIES=3
attempt=0

echo "Using idempotency key: $IDEMPOTENCY_KEY"

while [ $attempt -lt $MAX_RETRIES ]; do
  response=$(curl -s -w "\n%{http_code}" \
    -X POST "$API_BASE/ai/generate/image" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -H "X-Idempotency-Key: $IDEMPOTENCY_KEY" \
    --max-time 60 \
    -d '{
      "model": "seedream-5-0-260128",
      "prompt": "A sunset over the ocean",
      "width": 1024,
      "height": 1024
    }')

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  # Success
  if [ "$http_code" -lt 400 ] 2>/dev/null; then
    echo "Generated: $(echo "$body" | jq -r '.url')"
    exit 0
  fi

  # Retryable errors (429, 500-504) — safe to retry with same key
  if [ "$http_code" = "429" ] || [ "$http_code" -ge 500 ] 2>/dev/null; then
    attempt=$((attempt + 1))
    if [ $attempt -lt $MAX_RETRIES ]; then
      delay=$((1 * (2 ** (attempt - 1))))
      echo "Retrying ($attempt/$MAX_RETRIES) in ${delay}s..." >&2
      sleep $delay
      continue
    fi
  fi

  # Non-retryable error or max retries reached
  echo "Error HTTP $http_code: $body" >&2
  exit 1
done

echo "Failed after $MAX_RETRIES retries" >&2
exit 1
```

:::

## Circuit Breaker Pattern

After multiple consecutive failures, implement a circuit breaker to pause requests and avoid overwhelming a recovering service. This protects both your application and the API from cascading failures.

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

### Configuration Recommendations

| Parameter | Default | Description |
|-----------|---------|-------------|
| `failure_threshold` | 5 | Consecutive failures before opening the circuit |
| `reset_timeout` | 30s | Time to wait before allowing a probe request |
| `half_open_max_calls` | 1 | Number of probe requests allowed in half-open state |
| `counted_statuses` | 429, 500-504 | HTTP statuses counted as failures |

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


class CircuitOpenError(Exception):
    """Raised when the circuit breaker is open and rejecting requests."""
    pass


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
        # Only count retryable errors
        status = getattr(error, "status", 0)
        if status >= 500 or status == 429:
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


# Usage with the retry function
breaker = CircuitBreaker(failure_threshold=5, reset_timeout=30.0)


def generate_image(prompt: str) -> dict:
    return breaker.execute(
        request_with_retry,
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
except FotohubAPIError as e:
    print(f"API error: {e}")
```

```typescript [TypeScript]
type CircuitState = "closed" | "open" | "half-open";

class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CircuitOpenError";
  }
}

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
        throw new CircuitOpenError("Circuit breaker half-open: probe in progress");
      }
      this.halfOpenCalls++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error: any) {
      this.onFailure(error);
      throw error;
    }
  }

  private checkStateTransition(): void {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
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

// Usage with the retry function
const breaker = new CircuitBreaker(5, 30000);

async function generateImage(prompt: string) {
  return breaker.execute(() =>
    requestWithRetry<{ url: string }>("POST", "/ai/generate/image", {
      model: "seedream-5-0-260128",
      prompt,
    })
  );
}

// Handle circuit breaker errors gracefully
try {
  const result = await generateImage("A mountain landscape");
  console.log(`URL: ${result.url}`);
} catch (e) {
  if (e instanceof CircuitOpenError) {
    console.log(`Service unavailable: ${e.message}`);
    // Fall back to cached result or show maintenance page
  } else if (e instanceof FotohubAPIError) {
    console.error(`API error [${e.code}]: ${e.message}`);
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

var ErrCircuitOpen = errors.New("circuit breaker is open")

type CircuitBreaker struct {
	mu               sync.Mutex
	state            CircuitState
	failureCount     int
	lastFailureTime  time.Time
	failureThreshold int
	resetTimeout     time.Duration
	halfOpenCalls    int
	halfOpenMax      int
}

func NewCircuitBreaker(threshold int, timeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		failureThreshold: threshold,
		resetTimeout:     timeout,
		state:            StateClosed,
		halfOpenMax:      1,
	}
}

func (cb *CircuitBreaker) Execute(fn func() (map[string]interface{}, error)) (map[string]interface{}, error) {
	cb.mu.Lock()

	// Check state transition
	if cb.state == StateOpen {
		if time.Since(cb.lastFailureTime) >= cb.resetTimeout {
			cb.state = StateHalfOpen
			cb.halfOpenCalls = 0
		} else {
			remaining := cb.resetTimeout - time.Since(cb.lastFailureTime)
			cb.mu.Unlock()
			return nil, fmt.Errorf("%w: retry after %v", ErrCircuitOpen, remaining.Round(time.Second))
		}
	}

	if cb.state == StateHalfOpen && cb.halfOpenCalls >= cb.halfOpenMax {
		cb.mu.Unlock()
		return nil, fmt.Errorf("%w: probe in progress", ErrCircuitOpen)
	}

	if cb.state == StateHalfOpen {
		cb.halfOpenCalls++
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
			fmt.Println("Circuit breaker re-opened after failed probe.")
		}
		return nil, err
	}

	// Success — reset
	cb.failureCount = 0
	cb.state = StateClosed
	cb.halfOpenCalls = 0
	return result, nil
}

func main() {
	breaker := NewCircuitBreaker(5, 30*time.Second)

	result, err := breaker.Execute(func() (map[string]interface{}, error) {
		return requestWithRetry("POST", "/ai/generate/image", map[string]interface{}{
			"model":  "seedream-5-0-260128",
			"prompt": "A mountain landscape",
		})
	})

	if err != nil {
		if errors.Is(err, ErrCircuitOpen) {
			fmt.Printf("Service unavailable: %v\n", err)
			// Fall back to cached result or queue for later
		} else {
			fmt.Printf("API error: %v\n", err)
		}
		return
	}
	fmt.Printf("URL: %s\n", result["url"])
}
```

```bash [cURL]
#!/bin/bash
# Simple circuit breaker for shell scripts.
# Tracks consecutive failures in a temp file and pauses requests
# when the threshold is exceeded.

CIRCUIT_FILE="/tmp/fotohub_circuit.json"
FAILURE_THRESHOLD=5
RESET_TIMEOUT=30  # seconds

# Initialize circuit state file
init_circuit() {
  if [ ! -f "$CIRCUIT_FILE" ]; then
    echo '{"failures": 0, "last_failure": 0}' > "$CIRCUIT_FILE"
  fi
}

# Check circuit state: returns "closed", "open", or "half-open"
check_circuit() {
  init_circuit
  local failures last_failure now elapsed

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

# Record a failure
record_failure() {
  init_circuit
  local failures
  failures=$(jq -r '.failures' "$CIRCUIT_FILE" 2>/dev/null || echo 0)
  failures=$((failures + 1))
  echo "{\"failures\": $failures, \"last_failure\": $(date +%s)}" > "$CIRCUIT_FILE"

  if [ "$failures" -ge "$FAILURE_THRESHOLD" ]; then
    echo "Circuit breaker OPEN after $failures failures. Will probe in ${RESET_TIMEOUT}s." >&2
  fi
}

# Record a success (reset the circuit)
record_success() {
  echo '{"failures": 0, "last_failure": 0}' > "$CIRCUIT_FILE"
}

# Make a request through the circuit breaker
fotohub_with_circuit() {
  local state
  state=$(check_circuit)

  if [ "$state" = "open" ]; then
    local failures last_failure remaining
    last_failure=$(jq -r '.last_failure' "$CIRCUIT_FILE")
    remaining=$((RESET_TIMEOUT - ($(date +%s) - last_failure)))
    echo "Circuit breaker is open. Retry after ${remaining}s." >&2
    return 1
  fi

  # Make the actual request (uses fotohub_request from retry example)
  if fotohub_request "$@"; then
    record_success
    return 0
  else
    record_failure
    return 1
  fi
}

# Usage
fotohub_with_circuit "POST" "/ai/generate/image" '{
  "model": "seedream-5-0-260128",
  "prompt": "A mountain landscape"
}'
```

:::

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
// From response header (always present in every response)
X-Request-ID: req_7kXm9pLqR2vN4wYz
```

When contacting support, include:
1. The `request_id`
2. Timestamp of the request
3. The endpoint and parameters used

### Logging Request IDs

::: code-group

```python [Python]
import logging
import requests

logger = logging.getLogger("fotohub")


def log_fotohub_request(response: requests.Response, endpoint: str) -> None:
    """Log every FOTOhub API response for traceability."""
    request_id = response.headers.get("X-Request-ID", "unknown")

    if response.status_code < 400:
        logger.info(
            f"FOTOhub OK: {endpoint} -> {response.status_code} "
            f"(request_id: {request_id})"
        )
    else:
        try:
            error_body = response.json()
            logger.error(
                f"FOTOhub ERROR: [{error_body['error']}] {error_body['message']} "
                f"endpoint={endpoint} status={response.status_code} "
                f"request_id={error_body.get('request_id', request_id)}"
            )
        except ValueError:
            logger.error(
                f"FOTOhub ERROR: {endpoint} -> {response.status_code} "
                f"(request_id: {request_id}, body not JSON)"
            )


# Usage
response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
    json={"model": "seedream-5-0-260128", "prompt": "A landscape"},
)
log_fotohub_request(response, "/ai/generate/image")
```

```typescript [TypeScript]
function logFotohubRequest(
  response: Response,
  endpoint: string,
  body?: Record<string, unknown>
): void {
  const requestId = response.headers.get("X-Request-ID") ?? "unknown";

  if (response.ok) {
    console.log(
      `FOTOhub OK: ${endpoint} -> ${response.status} (request_id: ${requestId})`
    );
  } else {
    // Log the error details for debugging
    response
      .clone()
      .json()
      .then((errorBody) => {
        console.error(
          `FOTOhub ERROR: [${errorBody.error}] ${errorBody.message} ` +
            `endpoint=${endpoint} status=${response.status} ` +
            `request_id=${errorBody.request_id ?? requestId}`
        );
      })
      .catch(() => {
        console.error(
          `FOTOhub ERROR: ${endpoint} -> ${response.status} ` +
            `(request_id: ${requestId}, body not JSON)`
        );
      });
  }
}

// Usage
const response = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    Authorization: "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ model: "seedream-5-0-260128", prompt: "A landscape" }),
});
logFotohubRequest(response, "/ai/generate/image");
```

```go [Go]
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func logFotohubRequest(resp *http.Response, endpoint string) {
	requestID := resp.Header.Get("X-Request-ID")
	if requestID == "" {
		requestID = "unknown"
	}

	if resp.StatusCode < 400 {
		log.Printf("FOTOhub OK: %s -> %d (request_id: %s)",
			endpoint, resp.StatusCode, requestID)
	} else {
		var errBody map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&errBody); err == nil {
			log.Printf("FOTOhub ERROR: [%v] %v endpoint=%s status=%d request_id=%v",
				errBody["error"], errBody["message"],
				endpoint, resp.StatusCode,
				errBody["request_id"])
		} else {
			log.Printf("FOTOhub ERROR: %s -> %d (request_id: %s, body not JSON)",
				endpoint, resp.StatusCode, requestID)
		}
	}
}

// Usage in your request flow
func example() {
	req, _ := http.NewRequest("POST",
		"https://apis.fotohub.app/v1/ai/generate/image", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Network error: %v", err)
		return
	}
	defer resp.Body.Close()

	logFotohubRequest(resp, "/ai/generate/image")

	// Always include request_id in alerts to your monitoring system
	requestID := resp.Header.Get("X-Request-ID")
	if resp.StatusCode >= 500 {
		fmt.Printf("ALERT: Server error on /ai/generate/image — request_id: %s\n", requestID)
	}
}
```

```bash [cURL]
#!/bin/bash
# Log request IDs from every FOTOhub API call

API_BASE="https://apis.fotohub.app/v1"
API_KEY="fh_live_your_api_key"

# Make request and capture both headers and body
response=$(curl -s -w "\n%{http_code}" \
  -D /tmp/fh_headers.txt \
  -X POST "$API_BASE/ai/generate/image" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "seedream-5-0-260128", "prompt": "A landscape"}')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

# Extract request_id from headers
request_id=$(grep -i "X-Request-ID:" /tmp/fh_headers.txt \
  | awk '{print $2}' | tr -d '\r')

# Log appropriately
if [ "$http_code" -lt 400 ] 2>/dev/null; then
  echo "[OK] /ai/generate/image -> HTTP $http_code (request_id: $request_id)"
else
  error_code=$(echo "$body" | jq -r '.error // "unknown"')
  message=$(echo "$body" | jq -r '.message // "unknown"')
  echo "[ERROR] [$error_code] $message (HTTP $http_code, request_id: $request_id)" >&2

  # For server errors, save full context for support ticket
  if [ "$http_code" -ge 500 ] 2>/dev/null; then
    echo "Support ticket info:" >&2
    echo "  request_id: $request_id" >&2
    echo "  timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >&2
    echo "  endpoint: POST /ai/generate/image" >&2
    echo "  status: $http_code" >&2
  fi
fi
```

:::

## Error Recovery by Category

Complete error handling patterns for each category of error. Use the `error` field for programmatic routing and implement the appropriate recovery strategy.

### Authentication Errors (401)

::: code-group

```python [Python]
from fotohub import FotoHub

def handle_auth_error(error_code: str, request_id: str):
    """Handle authentication failures with appropriate recovery."""
    if error_code == "invalid_api_key":
        # Key format wrong — check environment variable
        print("Invalid API key format. Keys must start with fh_live_ or fh_test_.")
        print("Check your FOTOHUB_API_KEY environment variable.")
    elif error_code == "expired_api_key":
        # Key expired — generate a new one
        print("API key has expired. Generate a new key at fotohub.app/console/keys")
    elif error_code == "revoked_api_key":
        # Key was manually revoked — cannot be restored
        print("API key was revoked. Create a new key — revoked keys cannot be restored.")
    else:
        print(f"Authentication failed [{error_code}] (request_id: {request_id})")


# Usage pattern with SDK
try:
    client = FotoHub(api_key="fh_live_your_api_key")
    result = client.images.generate(
        model="seedream-5-0-260128",
        prompt="A landscape",
    )
except Exception as e:
    if hasattr(e, "status") and e.status == 401:
        handle_auth_error(e.error, e.request_id)
```

```typescript [TypeScript]
function handleAuthError(errorCode: string, requestId: string): void {
  switch (errorCode) {
    case "invalid_api_key":
      console.error(
        "Invalid API key format. Keys must start with fh_live_ or fh_test_."
      );
      console.error("Check your FOTOHUB_API_KEY environment variable.");
      break;
    case "expired_api_key":
      console.error(
        "API key has expired. Generate a new key at fotohub.app/console/keys"
      );
      break;
    case "revoked_api_key":
      console.error(
        "API key was revoked. Create a new key - revoked keys cannot be restored."
      );
      break;
    default:
      console.error(`Authentication failed [${errorCode}] (request_id: ${requestId})`);
  }
}

// Usage pattern
try {
  const result = await requestWithRetry("POST", "/ai/generate/image", {
    model: "seedream-5-0-260128",
    prompt: "A landscape",
  });
} catch (e) {
  if (e instanceof FotohubAPIError && e.status === 401) {
    handleAuthError(e.code, e.requestId);
  }
}
```

```go [Go]
package main

import "fmt"

func handleAuthError(errorCode, requestID string) {
	switch errorCode {
	case "invalid_api_key":
		fmt.Println("Invalid API key format. Keys must start with fh_live_ or fh_test_.")
		fmt.Println("Check your FOTOHUB_API_KEY environment variable.")
	case "expired_api_key":
		fmt.Println("API key has expired. Generate a new key at fotohub.app/console/keys")
	case "revoked_api_key":
		fmt.Println("API key was revoked. Create a new key — revoked keys cannot be restored.")
	default:
		fmt.Printf("Authentication failed [%s] (request_id: %s)\n", errorCode, requestID)
	}
}
```

```bash [cURL]
#!/bin/bash
# Handle 401 authentication errors

response=$(curl -s -w "\n%{http_code}" \
  -X POST "https://apis.fotohub.app/v1/ai/generate/image" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "seedream-5-0-260128", "prompt": "A landscape"}')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "401" ]; then
  error_code=$(echo "$body" | jq -r '.error')

  case "$error_code" in
    invalid_api_key)
      echo "Invalid API key. Check FOTOHUB_API_KEY env var." >&2
      echo "Keys must start with fh_live_ or fh_test_." >&2
      ;;
    expired_api_key)
      echo "API key expired. Generate a new key at fotohub.app/console/keys" >&2
      ;;
    revoked_api_key)
      echo "API key revoked. Create a new key." >&2
      ;;
  esac
  exit 1
fi
```

:::

### Billing Errors (402)

::: code-group

```python [Python]
def handle_billing_error(error_code: str, details: dict):
    """Handle billing failures and guide user to resolution."""
    if error_code == "insufficient_credits":
        required = details.get("required_credits", "?")
        available = details.get("available_credits", "?")
        top_up_url = details.get("top_up_url", "https://fotohub.app/console/billing")
        print(f"Insufficient credits: need {required}, have {available}")
        print(f"Top up at: {top_up_url}")
        # Option: auto-switch to wallet payment if credits exhausted
        return {"action": "top_up", "url": top_up_url}

    elif error_code == "wallet_empty":
        print("Wallet balance is zero. Add funds to continue.")
        return {"action": "add_funds", "url": "https://fotohub.app/console/billing"}

    elif error_code == "payment_failed":
        print("Payment method declined. Update your card details.")
        return {"action": "update_payment", "url": "https://fotohub.app/console/billing/payment"}


# Usage — graceful degradation in a web app
try:
    result = request_with_retry("POST", "/ai/generate/image", {
        "model": "seedream-5-0-260128",
        "prompt": "A landscape",
    })
except FotohubAPIError as e:
    if e.status == 402:
        recovery = handle_billing_error(e.error, e.details)
        # Show user a friendly billing page redirect
        # return redirect(recovery["url"])
```

```typescript [TypeScript]
interface BillingRecovery {
  action: "top_up" | "add_funds" | "update_payment";
  url: string;
}

function handleBillingError(
  errorCode: string,
  details: Record<string, unknown>
): BillingRecovery {
  switch (errorCode) {
    case "insufficient_credits": {
      const required = details.required_credits ?? "?";
      const available = details.available_credits ?? "?";
      const topUpUrl =
        (details.top_up_url as string) ?? "https://fotohub.app/console/billing";
      console.error(`Insufficient credits: need ${required}, have ${available}`);
      return { action: "top_up", url: topUpUrl };
    }
    case "wallet_empty":
      console.error("Wallet balance is zero. Add funds to continue.");
      return { action: "add_funds", url: "https://fotohub.app/console/billing" };
    case "payment_failed":
      console.error("Payment method declined. Update your card details.");
      return {
        action: "update_payment",
        url: "https://fotohub.app/console/billing/payment",
      };
    default:
      return { action: "top_up", url: "https://fotohub.app/console/billing" };
  }
}

// Usage in a Next.js API route or similar
try {
  const result = await requestWithRetry("POST", "/ai/generate/image", {
    model: "seedream-5-0-260128",
    prompt: "A landscape",
  });
} catch (e) {
  if (e instanceof FotohubAPIError && e.status === 402) {
    const recovery = handleBillingError(e.code, e.details ?? {});
    // Redirect user to billing page
    // return NextResponse.redirect(recovery.url);
  }
}
```

```go [Go]
package main

import "fmt"

type BillingRecovery struct {
	Action string
	URL    string
}

func handleBillingError(errorCode string, details map[string]interface{}) BillingRecovery {
	switch errorCode {
	case "insufficient_credits":
		required := details["required_credits"]
		available := details["available_credits"]
		topUpURL, _ := details["top_up_url"].(string)
		if topUpURL == "" {
			topUpURL = "https://fotohub.app/console/billing"
		}
		fmt.Printf("Insufficient credits: need %v, have %v\n", required, available)
		return BillingRecovery{Action: "top_up", URL: topUpURL}

	case "wallet_empty":
		fmt.Println("Wallet balance is zero. Add funds to continue.")
		return BillingRecovery{Action: "add_funds", URL: "https://fotohub.app/console/billing"}

	case "payment_failed":
		fmt.Println("Payment method declined. Update your card details.")
		return BillingRecovery{Action: "update_payment", URL: "https://fotohub.app/console/billing/payment"}

	default:
		return BillingRecovery{Action: "top_up", URL: "https://fotohub.app/console/billing"}
	}
}
```

```bash [cURL]
#!/bin/bash
# Handle 402 billing errors

response=$(curl -s -w "\n%{http_code}" \
  -X POST "https://apis.fotohub.app/v1/ai/generate/image" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "seedream-5-0-260128", "prompt": "A landscape"}')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "402" ]; then
  error_code=$(echo "$body" | jq -r '.error')
  top_up_url=$(echo "$body" | jq -r '.details.top_up_url // "https://fotohub.app/console/billing"')

  case "$error_code" in
    insufficient_credits)
      required=$(echo "$body" | jq -r '.details.required_credits')
      available=$(echo "$body" | jq -r '.details.available_credits')
      echo "Insufficient credits: need $required, have $available" >&2
      echo "Top up at: $top_up_url" >&2
      ;;
    wallet_empty)
      echo "Wallet empty. Add funds at: $top_up_url" >&2
      ;;
    payment_failed)
      echo "Payment declined. Update card at fotohub.app/console/billing/payment" >&2
      ;;
  esac
  exit 1
fi
```

:::

### Model and Generation Errors (500/502/503)

::: code-group

```python [Python]
import time

# Fallback model configuration
FALLBACK_MODELS = {
    "seedream-5-0-260128": "flux-2-klein-4b",
    "kling": "veo-2",
    "music-minimax": None,  # No fallback
}


def generate_with_fallback(
    model: str,
    prompt: str,
    max_retries: int = 2,
    **kwargs,
) -> dict:
    """
    Generate with automatic model fallback on provider errors.
    Tries the primary model first, then falls back to an alternative.
    """
    models_to_try = [model]
    fallback = FALLBACK_MODELS.get(model)
    if fallback:
        models_to_try.append(fallback)

    last_error = None
    for current_model in models_to_try:
        try:
            result = request_with_retry(
                "POST",
                "/ai/generate/image",
                {"model": current_model, "prompt": prompt, **kwargs},
                max_retries=max_retries,
            )
            if current_model != model:
                print(f"Used fallback model: {current_model} (primary: {model})")
            return result

        except FotohubAPIError as e:
            last_error = e
            if e.error in ("model_unavailable", "model_overloaded", "provider_error"):
                print(f"Model {current_model} unavailable [{e.error}], trying fallback...")
                continue
            elif e.error == "timeout":
                print(f"Model {current_model} timed out, trying fallback...")
                continue
            else:
                # Non-model error (auth, billing, validation) — do not fallback
                raise

    # All models failed
    raise last_error


# Usage
result = generate_with_fallback(
    model="seedream-5-0-260128",
    prompt="A mountain at sunset",
    width=1024,
    height=1024,
)
print(f"URL: {result['url']}")
```

```typescript [TypeScript]
// Fallback model configuration
const FALLBACK_MODELS: Record<string, string | null> = {
  "seedream-5-0-260128": "flux-2-klein-4b",
  "kling": "veo-2",
  "music-minimax": null, // No fallback
};

async function generateWithFallback(
  model: string,
  prompt: string,
  options: Record<string, unknown> = {}
): Promise<{ url: string }> {
  /**
   * Generate with automatic model fallback on provider errors.
   * Tries primary model first, then alternative.
   */
  const modelsToTry = [model];
  const fallback = FALLBACK_MODELS[model];
  if (fallback) modelsToTry.push(fallback);

  let lastError: Error | null = null;

  for (const currentModel of modelsToTry) {
    try {
      const result = await requestWithRetry<{ url: string }>(
        "POST",
        "/ai/generate/image",
        { model: currentModel, prompt, ...options },
        { maxRetries: 2 }
      );

      if (currentModel !== model) {
        console.warn(`Used fallback model: ${currentModel} (primary: ${model})`);
      }
      return result;
    } catch (e) {
      lastError = e as Error;
      if (e instanceof FotohubAPIError) {
        const modelErrors = ["model_unavailable", "model_overloaded", "provider_error", "timeout"];
        if (modelErrors.includes(e.code)) {
          console.warn(`Model ${currentModel} unavailable [${e.code}], trying fallback...`);
          continue;
        }
      }
      // Non-model error — do not fallback
      throw e;
    }
  }

  throw lastError;
}

// Usage
const result = await generateWithFallback("seedream-5-0-260128", "A mountain at sunset", {
  width: 1024,
  height: 1024,
});
console.log(`URL: ${result.url}`);
```

```go [Go]
package main

import (
	"fmt"
	"strings"
)

var fallbackModels = map[string]string{
	"seedream-5-0-260128": "flux-2-klein-4b",
	"kling":               "veo-2",
}

var modelErrorCodes = map[string]bool{
	"model_unavailable": true,
	"model_overloaded":  true,
	"provider_error":    true,
	"timeout":           true,
}

func generateWithFallback(model, prompt string, opts map[string]interface{}) (map[string]interface{}, error) {
	modelsToTry := []string{model}
	if fallback, ok := fallbackModels[model]; ok {
		modelsToTry = append(modelsToTry, fallback)
	}

	var lastErr error
	for _, currentModel := range modelsToTry {
		payload := map[string]interface{}{
			"model":  currentModel,
			"prompt": prompt,
		}
		for k, v := range opts {
			payload[k] = v
		}

		result, err := requestWithRetry("POST", "/ai/generate/image", payload)
		if err == nil {
			if currentModel != model {
				fmt.Printf("Used fallback model: %s (primary: %s)\n", currentModel, model)
			}
			return result, nil
		}

		lastErr = err
		// Check if it's a model-related error worth falling back from
		errStr := err.Error()
		isModelError := false
		for code := range modelErrorCodes {
			if strings.Contains(errStr, code) {
				isModelError = true
				break
			}
		}

		if isModelError {
			fmt.Printf("Model %s unavailable, trying fallback...\n", currentModel)
			continue
		}

		// Non-model error — do not fallback
		return nil, err
	}

	return nil, lastErr
}

func main() {
	result, err := generateWithFallback("seedream-5-0-260128", "A mountain at sunset",
		map[string]interface{}{"width": 1024, "height": 1024})
	if err != nil {
		fmt.Printf("All models failed: %v\n", err)
		return
	}
	fmt.Printf("URL: %s\n", result["url"])
}
```

```bash [cURL]
#!/bin/bash
# Generate with model fallback on provider errors

API_BASE="https://apis.fotohub.app/v1"
API_KEY="fh_live_your_api_key"

generate_with_fallback() {
  local primary_model="$1"
  local fallback_model="$2"
  local prompt="$3"

  # Try primary model
  local response http_code body
  response=$(curl -s -w "\n%{http_code}" \
    -X POST "$API_BASE/ai/generate/image" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"model\": \"$primary_model\", \"prompt\": \"$prompt\", \"width\": 1024, \"height\": 1024}")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -lt 400 ] 2>/dev/null; then
    echo "$body"
    return 0
  fi

  # Check if error is model-related (worth trying fallback)
  local error_code
  error_code=$(echo "$body" | jq -r '.error // ""')

  case "$error_code" in
    model_unavailable|model_overloaded|provider_error|timeout)
      if [ -n "$fallback_model" ]; then
        echo "Primary model $primary_model unavailable, trying $fallback_model..." >&2

        response=$(curl -s -w "\n%{http_code}" \
          -X POST "$API_BASE/ai/generate/image" \
          -H "Authorization: Bearer $API_KEY" \
          -H "Content-Type: application/json" \
          -d "{\"model\": \"$fallback_model\", \"prompt\": \"$prompt\", \"width\": 1024, \"height\": 1024}")

        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')

        if [ "$http_code" -lt 400 ] 2>/dev/null; then
          echo "Used fallback model: $fallback_model" >&2
          echo "$body"
          return 0
        fi
      fi
      ;;
  esac

  echo "Error: $body" >&2
  return 1
}

# Usage
generate_with_fallback "seedream-5-0-260128" "flux-2-klein-4b" "A mountain at sunset"
```

:::

### Validation Errors (400/422)

Validation errors indicate a problem with the request parameters. The `details.fields` array tells you exactly which parameters are invalid and why.

::: code-group

```python [Python]
def handle_validation_error(error: FotohubAPIError) -> dict:
    """
    Parse validation errors and return structured feedback.
    Useful for building user-facing form validation.
    """
    fields = error.details.get("fields", [])
    field_errors = {}

    for field_info in fields:
        field_name = field_info.get("field", "unknown")
        reason = field_info.get("reason", "Invalid value")
        field_errors[field_name] = reason

    return field_errors


# Usage — building a generation form
try:
    result = request_with_retry("POST", "/ai/generate/image", {
        "model": "seedream-5-0-260128",
        "prompt": "",  # Empty — will trigger validation error
        "width": 5000,  # Too large — will trigger validation error
    })
except FotohubAPIError as e:
    if e.error == "invalid_parameters":
        field_errors = handle_validation_error(e)
        for field, reason in field_errors.items():
            print(f"  {field}: {reason}")
        # Output:
        #   prompt: Prompt must not be empty
        #   width: Value 5000 exceeds maximum of 2048
    elif e.error == "missing_required_field":
        missing = e.details.get("field", "unknown")
        print(f"Missing required field: {missing}")
```

```typescript [TypeScript]
interface FieldError {
  field: string;
  reason: string;
}

function handleValidationError(
  error: FotohubAPIError
): Record<string, string> {
  /**
   * Parse validation errors into a field -> message map.
   * Useful for form validation UI.
   */
  const fields = (error.details?.fields as FieldError[]) ?? [];
  const fieldErrors: Record<string, string> = {};

  for (const { field, reason } of fields) {
    fieldErrors[field] = reason;
  }

  return fieldErrors;
}

// Usage — building a generation form
try {
  const result = await requestWithRetry("POST", "/ai/generate/image", {
    model: "seedream-5-0-260128",
    prompt: "", // Empty
    width: 5000, // Too large
  });
} catch (e) {
  if (e instanceof FotohubAPIError) {
    if (e.code === "invalid_parameters") {
      const fieldErrors = handleValidationError(e);
      for (const [field, reason] of Object.entries(fieldErrors)) {
        console.error(`  ${field}: ${reason}`);
      }
      // Show errors next to form fields in UI
    } else if (e.code === "missing_required_field") {
      const missing = (e.details?.field as string) ?? "unknown";
      console.error(`Missing required field: ${missing}`);
    }
  }
}
```

```go [Go]
package main

import (
	"encoding/json"
	"fmt"
)

type FieldError struct {
	Field  string `json:"field"`
	Reason string `json:"reason"`
}

func handleValidationError(details map[string]interface{}) map[string]string {
	fieldErrors := make(map[string]string)

	fieldsRaw, ok := details["fields"]
	if !ok {
		return fieldErrors
	}

	// Re-marshal and unmarshal to parse the nested structure
	fieldsJSON, _ := json.Marshal(fieldsRaw)
	var fields []FieldError
	json.Unmarshal(fieldsJSON, &fields)

	for _, f := range fields {
		fieldErrors[f.Field] = f.Reason
	}
	return fieldErrors
}

// Usage
func example() {
	_, err := requestWithRetry("POST", "/ai/generate/image", map[string]interface{}{
		"model":  "seedream-5-0-260128",
		"prompt": "",   // Empty
		"width":  5000, // Too large
	})
	if err != nil {
		// Parse error details (simplified for example)
		fmt.Printf("Validation error: %v\n", err)
		// In production, parse the error body for field-level details
	}
}
```

```bash [cURL]
#!/bin/bash
# Handle 400/422 validation errors

response=$(curl -s -w "\n%{http_code}" \
  -X POST "https://apis.fotohub.app/v1/ai/generate/image" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "seedream-5-0-260128", "prompt": "", "width": 5000}')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "400" ] || [ "$http_code" = "422" ]; then
  error_code=$(echo "$body" | jq -r '.error')

  if [ "$error_code" = "invalid_parameters" ]; then
    echo "Validation errors:" >&2
    echo "$body" | jq -r '.details.fields[] | "  \(.field): \(.reason)"' 2>/dev/null
  elif [ "$error_code" = "missing_required_field" ]; then
    field=$(echo "$body" | jq -r '.details.field')
    echo "Missing required field: $field" >&2
  elif [ "$error_code" = "unsupported_format" ]; then
    echo "Unsupported file format. Use JPEG, PNG, WebP, MP4, or MP3." >&2
  fi
  exit 1
fi
```

:::

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

### Use model fallbacks for production

Always configure a fallback model for generation endpoints. If the primary model is unavailable (503) or overloaded, transparently switch to an alternative to maintain service uptime.

### Implement graceful degradation

When the circuit breaker opens or all retries are exhausted, serve cached content, show a maintenance message, or queue the operation for later — do not show a raw error to end users.

::: tip
The official SDKs (Python and TypeScript) handle retries, idempotency, and error classification automatically. If you are building a new integration, start with the SDK rather than raw HTTP — see the [SDKs section](/sdk/python) for installation and usage.
:::

## Related APIs

- [Rate Limits](/api/rate-limits) -- Tier limits, headers, and backoff strategies.
- [Webhooks](/api/webhooks) -- Receive async notifications instead of polling.
- [Authentication](/api/authentication) -- API key management, scopes, and rotation.
