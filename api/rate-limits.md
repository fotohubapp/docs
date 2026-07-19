# Rate Limits

FOTOhub enforces rate limits per API key to ensure fair usage and protect service stability. Limits are applied on a per-minute sliding window basis. Every response includes headers to help you track your current consumption.

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
| Developer | 49 PLN/mo | 60 | 500 | 500 |
| Startup | 199 PLN/mo | 300 | 5,000 | 5,000 |
| Business | 799 PLN/mo | 1,000 | 50,000 | 25,000 |
| Enterprise | Custom | 5,000 | Unlimited | Unlimited |

### Your Current Tier

Check your current tier and limits:

```bash
curl https://apis.fotohub.app/v1/tiers/current \
  -H "Authorization: Bearer fh_live_your_key"
```

The `X-Tier` header in every response tells you which tier was resolved for that request.

### Burst Allowance

Each tier allows temporary bursts within its 4-hour burst window. For example, a Developer plan (500 credit 4h burst) can use credits freely within that window before being throttled. This prevents rate-spiking bots while allowing legitimate traffic patterns.

## Rate Limit Headers

Every API response includes the following headers so you can monitor your usage and proactively throttle before hitting limits.

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Maximum number of requests allowed in the current window | `60` |
| `X-RateLimit-Remaining` | Number of requests remaining in the current window | `42` |
| `X-RateLimit-Reset` | Unix timestamp (seconds) when the current window resets | `1721234560` |
| `Retry-After` | Seconds to wait before retrying (only present on 429 responses) | `12` |

### Example Response Headers

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1721234560
```

### Example 429 Response Headers

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1721234572
Retry-After: 12
```

## 429 Too Many Requests

When your request exceeds the rate limit, the API responds with HTTP status 429 and a JSON body indicating how long to wait before retrying.

```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded. Retry after 12 seconds.",
  "retry_after": 12
}
```

| Field | Type | Description |
|-------|------|-------------|
| `error` | string | Error code, always `"rate_limit_exceeded"` |
| `message` | string | Human-readable error message with retry guidance |
| `retry_after` | integer | Number of seconds to wait before retrying the request |

::: danger Important
Do not retry immediately after receiving a 429. Doing so will extend your cooldown period. Always wait at least the number of seconds indicated in the `retry_after` field before sending your next request.
:::

## Best Practices

Follow these guidelines to minimize rate limit errors and maximize throughput from your allocated quota.

### Implement Exponential Backoff

Start with a 1-second delay, double on each retry, and cap at 60 seconds. Add random jitter (0-1s) to prevent thundering herd problems when multiple clients retry simultaneously.

### Cache Responses Where Possible

Many endpoints return data that does not change frequently. Cache model listings, pricing info, and completed generation results to avoid redundant API calls.

### Use Bulk Endpoints

When available, use batch/bulk endpoints to combine multiple operations into a single request. This counts as one request against your rate limit instead of many.

### Monitor X-RateLimit-Remaining

Proactively check the remaining header value. When it drops below 10% of your limit, voluntarily slow down your request rate to avoid hitting the wall.

## Retry Logic Examples

The following examples demonstrate proper retry handling with exponential backoff and respect for the `Retry-After` header and `retry_after` body values returned by the API.

### Python

```python
import time
import random
import requests

API_BASE = "https://apis.fotohub.app/v1"
API_KEY = "fh_live_..."

def make_request(endpoint: str, payload: dict, max_retries: int = 5) -> dict:
    """
    Make an API request with exponential backoff retry logic.
    Respects Retry-After header and retry_after field in 429 responses.
    """
    url = f"{API_BASE}{endpoint}"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    for attempt in range(max_retries):
        response = requests.post(url, json=payload, headers=headers)

        # Success - return the response
        if response.status_code == 200:
            return response.json()

        # Rate limited - implement backoff
        if response.status_code == 429:
            # Prefer Retry-After header, fallback to body field
            retry_after = response.headers.get("Retry-After")
            if retry_after:
                wait_time = int(retry_after)
            else:
                body = response.json()
                wait_time = body.get("retry_after", 2 ** attempt)

            # Add jitter to prevent thundering herd
            jitter = random.uniform(0, 1)
            total_wait = min(wait_time + jitter, 60)

            print(
                f"Rate limited (attempt {attempt + 1}/{max_retries}). "
                f"Waiting {total_wait:.1f}s before retry..."
            )
            time.sleep(total_wait)
            continue

        # Other errors - raise immediately
        response.raise_for_status()

    raise Exception(
        f"Max retries ({max_retries}) exceeded for {endpoint}"
    )


# Usage example
result = make_request(
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

### TypeScript

```typescript
const API_BASE = "https://apis.fotohub.app/v1";
const API_KEY = "fh_live_...";

async function makeRequest<T>(
  endpoint: string,
  payload: Record<string, unknown>,
  maxRetries = 5
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Success
    if (response.ok) {
      return (await response.json()) as T;
    }

    // Rate limited - backoff and retry
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("Retry-After");
      let waitTime: number;

      if (retryAfterHeader) {
        waitTime = parseInt(retryAfterHeader, 10);
      } else {
        const body = await response.json();
        waitTime = body.retry_after ?? Math.pow(2, attempt);
      }

      // Add jitter to prevent thundering herd
      const jitter = Math.random();
      const totalWait = Math.min(waitTime + jitter, 60);

      console.warn(
        `Rate limited (attempt ${attempt + 1}/${maxRetries}). ` +
        `Waiting ${totalWait.toFixed(1)}s...`
      );

      await new Promise((r) => setTimeout(r, totalWait * 1000));
      continue;
    }

    // Other HTTP errors
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  throw new Error(`Max retries (${maxRetries}) exceeded for ${endpoint}`);
}

// Usage example
const result = await makeRequest<{ url: string }>(
  "/ai/generate/image",
  { model: "seedream-5-0-260128", prompt: "A futuristic cityscape at sunset" }
);
console.log("Generated image:", result.url);
```

### cURL (Bash)

```bash
#!/bin/bash
# FOTOhub API request with retry logic

API_BASE="https://apis.fotohub.app/v1"
API_KEY="fh_live_..."
MAX_RETRIES=5

fotohub_request() {
  local endpoint="$1"
  local payload="$2"
  local attempt=0

  while [ $attempt -lt $MAX_RETRIES ]; do
    response=$(curl -s -w "\n%{http_code}" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -D /tmp/fh_headers.txt \
      -d "$payload" \
      "$API_BASE$endpoint")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ]; then
      echo "$body"
      return 0
    fi

    if [ "$http_code" = "429" ]; then
      retry_after=$(grep -i "Retry-After:" /tmp/fh_headers.txt \
        | awk '{print $2}' | tr -d '\r')
      [ -z "$retry_after" ] && retry_after=$((2 ** attempt))

      echo "Rate limited. Waiting ${retry_after}s..." >&2
      sleep "$retry_after"
      attempt=$((attempt + 1))
      continue
    fi

    echo "Error HTTP $http_code: $body" >&2
    return 1
  done

  echo "Max retries exceeded" >&2
  return 1
}

# Usage
fotohub_request "/ai/generate/image" '{
  "model": "seedream-5-0-260128",
  "prompt": "A futuristic cityscape at sunset"
}'
```

## Quick Reference

| Behavior | Details |
|----------|---------|
| Window type | Sliding window, per-minute |
| Scope | Per API key (not per IP or user) |
| Burst allowance | 2x base limit for 5 seconds |
| Error code on limit | HTTP 429 Too Many Requests |
| Retry guidance | `Retry-After` header + `retry_after` field in body |
| Recommended strategy | Exponential backoff with jitter, cap at 60s |
| Usage monitoring | `X-RateLimit-Remaining` header in every response |
| Tier upgrades | Take effect immediately, no restart needed |
