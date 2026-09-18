# Batch Processing Guide

Process hundreds or thousands of AI generations concurrently with proper rate limiting, error recovery, and progress tracking.

::: info When to Use Batch Processing
Use batch processing for product catalogs, content pipelines, bulk media generation, and any workflow that processes more than 10 items. This guide covers concurrent execution patterns in all four languages with rate-aware queuing and webhook-based progress.
:::

---

## Architecture Overview

```
Your App
  |
  ├─ Rate Limiter (respects X-RateLimit-* headers)
  ├─ Concurrent Worker Pool (asyncio / Promise / goroutine)
  ├─ Progress Tracker (webhook or polling)
  └─ Error Recovery (retry failed items)
       |
       v
  FOTOhub API (rate-limited per tier)
```

Rate limits by tier:

| Tier | Requests/min | Concurrent | Recommended batch size |
|------|-------------|-----------|----------------------|
| Free | 10 | 2 | 5 |
| Pro | 60 | 10 | 20 |
| Business | 300 | 50 | 100 |
| Enterprise | Custom | Custom | 500+ |

---

## Concurrent Image Generation

::: code-group
```python [Python]
import asyncio
from fotohub import FotoHub

client = FotoHub()


async def generate_one(prompt: str, semaphore: asyncio.Semaphore) -> dict:
    """Generate a single image, respecting concurrency limit."""
    async with semaphore:
        try:
            result = await client.async_generate_image(
                prompt=prompt,
                model="seedream-5-0-260128",
            )
            return {"status": "success", "url": result.images[0].url, "prompt": prompt}
        except Exception as e:
            return {"status": "error", "error": str(e), "prompt": prompt}


async def batch_generate(prompts: list[str], max_concurrent: int = 10):
    """Process all prompts with bounded concurrency."""
    semaphore = asyncio.Semaphore(max_concurrent)
    tasks = [generate_one(p, semaphore) for p in prompts]

    results = []
    for coro in asyncio.as_completed(tasks):
        result = await coro
        results.append(result)
        # Progress
        done = len(results)
        print(f"Progress: {done}/{len(prompts)} ({100*done//len(prompts)}%)")

    succeeded = [r for r in results if r["status"] == "success"]
    failed = [r for r in results if r["status"] == "error"]
    print(f"\nDone: {len(succeeded)} succeeded, {len(failed)} failed")
    return results


# Run batch
prompts = [
    f"Product photo: item {i}, white background, studio lighting"
    for i in range(50)
]

results = asyncio.run(batch_generate(prompts, max_concurrent=10))
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

interface BatchResult {
  status: "success" | "error";
  prompt: string;
  url?: string;
  error?: string;
}

async function batchGenerate(
  prompts: string[],
  maxConcurrent = 10
): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  let completed = 0;

  // Process in chunks to respect concurrency limits
  for (let i = 0; i < prompts.length; i += maxConcurrent) {
    const chunk = prompts.slice(i, i + maxConcurrent);

    const chunkResults = await Promise.allSettled(
      chunk.map(async (prompt) => {
        const result = await client.generateImage({
          prompt,
          model: "seedream-5-0-260128",
        });
        return { prompt, url: result.images[0].url };
      })
    );

    for (const [idx, result] of chunkResults.entries()) {
      completed++;
      if (result.status === "fulfilled") {
        results.push({
          status: "success",
          prompt: result.value.prompt,
          url: result.value.url,
        });
      } else {
        results.push({
          status: "error",
          prompt: chunk[idx],
          error: result.reason?.message ?? "Unknown error",
        });
      }
      console.log(`Progress: ${completed}/${prompts.length}`);
    }
  }

  const succeeded = results.filter((r) => r.status === "success");
  const failed = results.filter((r) => r.status === "error");
  console.log(`\nDone: ${succeeded.length} succeeded, ${failed.length} failed`);
  return results;
}

// Run
const prompts = Array.from(
  { length: 50 },
  (_, i) => `Product photo: item ${i}, white background, studio lighting`
);

const results = await batchGenerate(prompts, 10);
```
```go [Go]
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
    "sync"
    "sync/atomic"
)

type BatchResult struct {
    Status string `json:"status"`
    Prompt string `json:"prompt"`
    URL    string `json:"url,omitempty"`
    Error  string `json:"error,omitempty"`
}

func batchGenerate(prompts []string, maxConcurrent int) []BatchResult {
    results := make([]BatchResult, len(prompts))
    var completed int64

    sem := make(chan struct{}, maxConcurrent)
    var wg sync.WaitGroup

    for i, prompt := range prompts {
        wg.Add(1)
        go func(idx int, p string) {
            defer wg.Done()
            sem <- struct{}{}        // Acquire
            defer func() { <-sem }() // Release

            payload, _ := json.Marshal(map[string]string{
                "prompt": p,
                "model":  "seedream-5-0-260128",
            })

            req, _ := http.NewRequest("POST",
                "https://apis.fotohub.app/v1/ai/generate/image",
                bytes.NewBuffer(payload))
            req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
            req.Header.Set("Content-Type", "application/json")

            resp, err := http.DefaultClient.Do(req)
            if err != nil {
                results[idx] = BatchResult{Status: "error", Prompt: p, Error: err.Error()}
            } else {
                defer resp.Body.Close()
                if resp.StatusCode == 200 {
                    var body map[string]interface{}
                    json.NewDecoder(resp.Body).Decode(&body)
                    images := body["images"].([]interface{})
                    url := images[0].(string)
                    results[idx] = BatchResult{Status: "success", Prompt: p, URL: url}
                } else {
                    results[idx] = BatchResult{Status: "error", Prompt: p, Error: fmt.Sprintf("HTTP %d", resp.StatusCode)}
                }
            }

            done := atomic.AddInt64(&completed, 1)
            fmt.Printf("Progress: %d/%d\n", done, len(prompts))
        }(i, prompt)
    }

    wg.Wait()
    return results
}

func main() {
    prompts := make([]string, 50)
    for i := range prompts {
        prompts[i] = fmt.Sprintf("Product photo: item %d, white background", i)
    }

    results := batchGenerate(prompts, 10)

    succeeded := 0
    for _, r := range results {
        if r.Status == "success" {
            succeeded++
        }
    }
    fmt.Printf("Done: %d/%d succeeded\n", succeeded, len(results))
}
```
```bash [cURL]
#!/bin/bash
# Batch generate with GNU parallel (respects concurrency limit)

# Create prompts file
for i in $(seq 1 50); do
  echo "Product photo: item $i, white background, studio lighting"
done > /tmp/prompts.txt

# Process with 10 concurrent workers
cat /tmp/prompts.txt | parallel -j 10 --bar \
  'curl -s -X POST https://apis.fotohub.app/v1/ai/generate/image \
    -H "Authorization: Bearer $FOTOHUB_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"prompt\": \"{}\", \"model\": \"seedream-5-0-260128\"}" \
    | jq -r ".images[0].url"' \
  > /tmp/results.txt

echo "Generated $(wc -l < /tmp/results.txt) images"
```
:::

---

## Rate-Aware Queue

Automatically respect API rate limits using response headers:

::: code-group
```python [Python]
import asyncio
import time
from fotohub import FotoHub
from fotohub.exceptions import RateLimitError

client = FotoHub()


class RateAwareQueue:
    """Queue that respects API rate limits dynamically."""

    def __init__(self, requests_per_minute: int = 60):
        self.rpm = requests_per_minute
        self.interval = 60.0 / requests_per_minute
        self.last_request = 0.0
        self.lock = asyncio.Lock()

    async def acquire(self):
        async with self.lock:
            now = time.monotonic()
            wait = self.interval - (now - self.last_request)
            if wait > 0:
                await asyncio.sleep(wait)
            self.last_request = time.monotonic()

    def update_from_headers(self, remaining: int, reset: float):
        """Dynamically adjust rate based on API response headers."""
        if remaining <= 5:
            # Approaching limit — slow down
            self.interval = max(self.interval * 1.5, 2.0)
        elif remaining > 30:
            # Plenty of headroom — speed up
            self.interval = 60.0 / self.rpm


queue = RateAwareQueue(requests_per_minute=55)  # Leave 5rpm buffer


async def generate_rate_limited(prompt: str) -> dict:
    """Generate with rate limiting."""
    await queue.acquire()

    max_retries = 3
    for attempt in range(max_retries):
        try:
            result = await client.async_generate_image(
                prompt=prompt,
                model="seedream-5-0-260128",
            )
            # Update rate info from response
            queue.update_from_headers(
                remaining=result.rate_limit_remaining,
                reset=result.rate_limit_reset,
            )
            return {"status": "success", "url": result.images[0].url}
        except RateLimitError as e:
            await asyncio.sleep(e.retry_after)
        except Exception as e:
            if attempt == max_retries - 1:
                return {"status": "error", "error": str(e)}
            await asyncio.sleep(2 ** attempt)
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { RateLimitError } from "fotohub/errors";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

class RateAwareQueue {
  private interval: number;
  private lastRequest = 0;
  private pending: Array<() => void> = [];
  private processing = false;

  constructor(requestsPerMinute = 60) {
    this.interval = (60 * 1000) / requestsPerMinute;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const wait = this.interval - (now - this.lastRequest);
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    this.lastRequest = Date.now();
  }

  slowDown() {
    this.interval = Math.min(this.interval * 1.5, 5000);
  }

  speedUp(requestsPerMinute: number) {
    this.interval = (60 * 1000) / requestsPerMinute;
  }
}

const queue = new RateAwareQueue(55);

async function generateRateLimited(prompt: string) {
  await queue.acquire();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await client.generateImage({
        prompt,
        model: "seedream-5-0-260128",
      });
      return { status: "success" as const, url: result.images[0].url };
    } catch (e) {
      if (e instanceof RateLimitError) {
        queue.slowDown();
        await new Promise((r) => setTimeout(r, (e.retryAfter ?? 2) * 1000));
      } else if (attempt === 2) {
        return { status: "error" as const, error: String(e) };
      }
    }
  }
  return { status: "error" as const, error: "Max retries" };
}
```
```go [Go]
package main

import (
    "sync"
    "time"
)

type RateAwareQueue struct {
    mu          sync.Mutex
    interval    time.Duration
    lastRequest time.Time
}

func NewRateAwareQueue(rpm int) *RateAwareQueue {
    return &RateAwareQueue{
        interval: time.Minute / time.Duration(rpm),
    }
}

func (q *RateAwareQueue) Acquire() {
    q.mu.Lock()
    defer q.mu.Unlock()

    elapsed := time.Since(q.lastRequest)
    if elapsed < q.interval {
        time.Sleep(q.interval - elapsed)
    }
    q.lastRequest = time.Now()
}

func (q *RateAwareQueue) SlowDown() {
    q.mu.Lock()
    defer q.mu.Unlock()
    q.interval = time.Duration(float64(q.interval) * 1.5)
    if q.interval > 5*time.Second {
        q.interval = 5 * time.Second
    }
}

// Usage: call queue.Acquire() before each API request
```
```bash [cURL]
#!/bin/bash
# Rate-limited batch with sleep between requests

RATE_LIMIT=55  # requests per minute
INTERVAL=$(echo "scale=2; 60 / $RATE_LIMIT" | bc)

while IFS= read -r prompt; do
  curl -s -X POST https://apis.fotohub.app/v1/ai/generate/image \
    -H "Authorization: Bearer $FOTOHUB_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"prompt\": \"$prompt\", \"model\": \"seedream-5-0-260128\"}" \
    | jq -r '.images[0].url' >> results.txt

  sleep "$INTERVAL"
done < prompts.txt
```
:::

---

## Batch Video Generation (Async Jobs)

Video generation is already async. For batches, submit all jobs first, then poll for results:

::: code-group
```python [Python]
import asyncio
from fotohub import FotoHub

client = FotoHub()


async def batch_video(prompts: list[str], max_concurrent: int = 5):
    """Submit video jobs concurrently, then poll all for completion."""
    semaphore = asyncio.Semaphore(max_concurrent)

    async def submit_one(prompt: str) -> str:
        async with semaphore:
            job = await client.async_generate_video(
                prompt=prompt,
                model="seedance-2-0-pro",
            )
            return job.job_id

    # Phase 1: Submit all jobs
    print(f"Submitting {len(prompts)} video jobs...")
    job_ids = await asyncio.gather(*[submit_one(p) for p in prompts])
    print(f"All {len(job_ids)} jobs submitted. Polling for results...")

    # Phase 2: Poll all jobs
    results = {}
    pending = set(job_ids)

    while pending:
        for job_id in list(pending):
            status = await client.async_get_video_status(job_id)
            if status.status == "completed":
                results[job_id] = {"url": status.video_url, "status": "success"}
                pending.discard(job_id)
            elif status.status == "failed":
                results[job_id] = {"error": status.error, "status": "failed"}
                pending.discard(job_id)

        if pending:
            print(f"  {len(results)}/{len(job_ids)} complete, {len(pending)} pending...")
            await asyncio.sleep(5)

    return results


prompts = [
    "Product showcase: item rotating 360 degrees, white background",
    "Nature scene: river flowing through forest, drone shot",
    "Urban timelapse: city traffic at night, long exposure effect",
]

results = asyncio.run(batch_video(prompts))
```
```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function batchVideo(prompts: string[], maxConcurrent = 5) {
  // Phase 1: Submit all jobs
  console.log(`Submitting ${prompts.length} video jobs...`);
  const jobIds: string[] = [];

  for (let i = 0; i < prompts.length; i += maxConcurrent) {
    const chunk = prompts.slice(i, i + maxConcurrent);
    const jobs = await Promise.all(
      chunk.map((prompt) =>
        client.generateVideo({ prompt, model: "seedance-2-0-pro" })
      )
    );
    jobIds.push(...jobs.map((j) => j.jobId));
  }

  console.log(`All ${jobIds.length} submitted. Polling...`);

  // Phase 2: Poll until all complete
  const results = new Map<string, { url?: string; error?: string }>();
  const pending = new Set(jobIds);

  while (pending.size > 0) {
    for (const jobId of [...pending]) {
      const status = await client.getVideoStatus(jobId);
      if (status.status === "completed") {
        results.set(jobId, { url: status.videoUrl });
        pending.delete(jobId);
      } else if (status.status === "failed") {
        results.set(jobId, { error: status.error });
        pending.delete(jobId);
      }
    }
    if (pending.size > 0) {
      console.log(`  ${results.size}/${jobIds.length} complete`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  return results;
}
```
```go [Go]
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
    "os"
    "sync"
    "time"
)

func submitVideoJob(prompt string) (string, error) {
    // Submit and return job_id (implementation similar to earlier examples)
    // Returns job_id string
    return "job_xyz", nil
}

func pollVideoStatus(jobID string) (string, string, error) {
    req, _ := http.NewRequest("GET",
        "https://apis.fotohub.app/v1/ai/generate/video/"+jobID, nil)
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return "", "", err
    }
    defer resp.Body.Close()
    var result struct {
        Status   string `json:"status"`
        VideoURL string `json:"video_url"`
        Error    string `json:"error"`
    }
    json.NewDecoder(resp.Body).Decode(&result)
    return result.Status, result.VideoURL, nil
}

func batchVideo(prompts []string, maxConcurrent int) {
    sem := make(chan struct{}, maxConcurrent)
    var mu sync.Mutex
    jobIDs := make([]string, 0, len(prompts))

    // Phase 1: Submit
    var wg sync.WaitGroup
    for _, p := range prompts {
        wg.Add(1)
        go func(prompt string) {
            defer wg.Done()
            sem <- struct{}{}
            defer func() { <-sem }()
            jobID, _ := submitVideoJob(prompt)
            mu.Lock()
            jobIDs = append(jobIDs, jobID)
            mu.Unlock()
        }(p)
    }
    wg.Wait()
    fmt.Printf("Submitted %d jobs. Polling...\n", len(jobIDs))

    // Phase 2: Poll
    pending := make(map[string]bool)
    for _, id := range jobIDs {
        pending[id] = true
    }
    for len(pending) > 0 {
        for id := range pending {
            status, _, _ := pollVideoStatus(id)
            if status == "completed" || status == "failed" {
                delete(pending, id)
            }
        }
        fmt.Printf("  %d/%d complete\n", len(jobIDs)-len(pending), len(jobIDs))
        time.Sleep(5 * time.Second)
    }
}

func main() {
    prompts := []string{"Product rotating", "Nature scene", "Urban timelapse"}
    batchVideo(prompts, 5)
}
```
```bash [cURL]
#!/bin/bash
# Submit video jobs in batch, then poll

# Phase 1: Submit all jobs
JOB_IDS=()
while IFS= read -r prompt; do
  JOB_ID=$(curl -s -X POST https://apis.fotohub.app/v1/ai/generate/video \
    -H "Authorization: Bearer $FOTOHUB_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"prompt\": \"$prompt\", \"model\": \"seedance\"}" \
    | jq -r '.job_id')
  JOB_IDS+=("$JOB_ID")
  echo "Submitted: $JOB_ID"
  sleep 1  # Rate limit
done < video_prompts.txt

echo "Submitted ${#JOB_IDS[@]} jobs. Polling..."

# Phase 2: Poll until all complete
PENDING=("${JOB_IDS[@]}")
while [ ${#PENDING[@]} -gt 0 ]; do
  NEW_PENDING=()
  for JOB_ID in "${PENDING[@]}"; do
    STATUS=$(curl -s "https://apis.fotohub.app/v1/ai/generate/video/$JOB_ID" \
      -H "Authorization: Bearer $FOTOHUB_API_KEY" | jq -r '.status')
    if [ "$STATUS" != "completed" ] && [ "$STATUS" != "failed" ]; then
      NEW_PENDING+=("$JOB_ID")
    fi
  done
  PENDING=("${NEW_PENDING[@]}")
  echo "  ${#PENDING[@]} still pending..."
  sleep 5
done
echo "All done!"
```
:::

---

## Progress Tracking with Webhooks

For large batches, use webhooks instead of polling:

```python
import asyncio
from fotohub import FotoHub

client = FotoHub()


async def batch_with_webhook(prompts: list[str]):
    """Submit jobs with webhook callback — no polling needed."""
    job_ids = []

    for prompt in prompts:
        job = await client.async_generate_video(
            prompt=prompt,
            model="seedance-2-0-pro",
            webhook_url="https://your-app.com/webhooks/batch-progress",
            webhook_events=["generation.completed", "generation.failed"],
        )
        job_ids.append(job.job_id)

    return job_ids


# Your webhook server receives progress updates
# See /guides/webhooks for full server implementation
```

Webhook payload for batch progress:

```json
{
  "event": "generation.completed",
  "timestamp": "2026-07-22T10:30:00Z",
  "attempt": 1,
  "data": {
    "type": "video",
    "model": "seedance-2-0-pro",
    "credits": 5,
    "duration": 5
  }
}
```

---

## Retry Failed Items

After a batch completes, retry only the failed items:

::: code-group
```python [Python]
async def batch_with_retry(prompts: list[str], max_retries: int = 2):
    """Run batch, then retry failures up to max_retries times."""
    pending = [{"prompt": p, "attempts": 0} for p in prompts]
    all_results = []

    for round_num in range(max_retries + 1):
        if not pending:
            break

        print(f"Round {round_num + 1}: Processing {len(pending)} items...")
        results = await batch_generate([item["prompt"] for item in pending])

        next_pending = []
        for item, result in zip(pending, results):
            if result["status"] == "success":
                all_results.append(result)
            else:
                item["attempts"] += 1
                if item["attempts"] <= max_retries:
                    next_pending.append(item)
                else:
                    all_results.append(result)  # Give up

        pending = next_pending
        if pending:
            print(f"  {len(pending)} failed, retrying...")
            await asyncio.sleep(5)  # Cool down before retry

    return all_results
```
```typescript [TypeScript]
async function batchWithRetry(prompts: string[], maxRetries = 2) {
  let pending = prompts.map((prompt) => ({ prompt, attempts: 0 }));
  const allResults: BatchResult[] = [];

  for (let round = 0; round <= maxRetries; round++) {
    if (pending.length === 0) break;
    console.log(`Round ${round + 1}: Processing ${pending.length} items...`);

    const results = await batchGenerate(
      pending.map((p) => p.prompt),
      10
    );

    const nextPending: typeof pending = [];
    for (let i = 0; i < pending.length; i++) {
      if (results[i].status === "success") {
        allResults.push(results[i]);
      } else {
        pending[i].attempts++;
        if (pending[i].attempts <= maxRetries) {
          nextPending.push(pending[i]);
        } else {
          allResults.push(results[i]); // Give up
        }
      }
    }

    pending = nextPending;
    if (pending.length > 0) {
      console.log(`  ${pending.length} failed, retrying...`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  return allResults;
}
```
```go [Go]
package main

import "fmt"

type PendingItem struct {
    Prompt   string
    Attempts int
}

func batchWithRetry(prompts []string, maxRetries int) []BatchResult {
    pending := make([]PendingItem, len(prompts))
    for i, p := range prompts {
        pending[i] = PendingItem{Prompt: p, Attempts: 0}
    }

    var allResults []BatchResult

    for round := 0; round <= maxRetries; round++ {
        if len(pending) == 0 {
            break
        }
        fmt.Printf("Round %d: Processing %d items\n", round+1, len(pending))

        currentPrompts := make([]string, len(pending))
        for i, p := range pending {
            currentPrompts[i] = p.Prompt
        }
        results := batchGenerate(currentPrompts, 10)

        var nextPending []PendingItem
        for i, r := range results {
            if r.Status == "success" {
                allResults = append(allResults, r)
            } else {
                pending[i].Attempts++
                if pending[i].Attempts <= maxRetries {
                    nextPending = append(nextPending, pending[i])
                } else {
                    allResults = append(allResults, r)
                }
            }
        }
        pending = nextPending
    }
    return allResults
}
```
```bash [cURL]
#!/bin/bash
# Retry failed items from a previous batch

FAILED_FILE="failed_prompts.txt"
RESULTS_FILE="results.txt"
MAX_RETRIES=2

for retry in $(seq 1 $MAX_RETRIES); do
  if [ ! -s "$FAILED_FILE" ]; then
    echo "No failures to retry"
    break
  fi

  echo "Retry $retry: $(wc -l < $FAILED_FILE) items"
  NEW_FAILURES=""

  while IFS= read -r prompt; do
    RESULT=$(curl -s -w "\n%{http_code}" -X POST \
      https://apis.fotohub.app/v1/ai/generate/image \
      -H "Authorization: Bearer $FOTOHUB_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"prompt\": \"$prompt\", \"model\": \"seedream-5-0-260128\"}")

    HTTP_CODE=$(echo "$RESULT" | tail -1)
    if [ "$HTTP_CODE" -lt 400 ]; then
      echo "$RESULT" | sed '$d' | jq -r '.images[0].url' >> "$RESULTS_FILE"
    else
      NEW_FAILURES="$NEW_FAILURES\n$prompt"
    fi
    sleep 1
  done < "$FAILED_FILE"

  echo -e "$NEW_FAILURES" | sed '/^$/d' > "$FAILED_FILE"
done
```
:::

---

## Saving Results

Store batch results for later processing:

```python
import json
from pathlib import Path


def save_batch_results(results: list[dict], output_path: str):
    """Save results as JSONL (one JSON object per line)."""
    path = Path(output_path)
    with path.open("w") as f:
        for result in results:
            f.write(json.dumps(result) + "\n")
    print(f"Saved {len(results)} results to {path}")


def load_batch_results(input_path: str) -> list[dict]:
    """Load JSONL results."""
    results = []
    with open(input_path) as f:
        for line in f:
            results.append(json.loads(line))
    return results


# Usage
save_batch_results(results, "batch_2026-07-22.jsonl")
```

---

## Performance Tips

1. **Start small** — Test with 5 items before running 500
2. **Leave rate limit headroom** — Use 90% of your tier limit (e.g., 55/60 RPM for Pro)
3. **Use cheaper models for prototyping** — Validate prompts with seedream before using imagen-4
4. **Process during off-peak** — 02:00-08:00 CET has lower queue times
5. **Use webhooks for video batches** — Polling 100 video jobs wastes requests
6. **Save intermediate results** — Write to JSONL after each chunk so crashes don't lose progress
7. **Monitor with the usage API** — Check spend mid-batch to avoid surprises

---

## Related

- [Cost Optimization](/guides/cost-optimization) — Model selection for batch workloads
- [Error Handling](/guides/error-handling) — Retry and circuit breaker patterns
- [Webhooks](/guides/webhooks) — Progress callbacks for async jobs
- [Rate Limits](/api/rate-limits) — Tier limits and headers
