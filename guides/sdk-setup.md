# SDK Installation & Setup

This guide walks you through installing and configuring the official FOTOhub SDKs for production use.

## Official Libraries

| Language | Package | Registry | Install |
|----------|---------|----------|---------|
| Python 3.9+ | `fotohub` | [PyPI](https://pypi.org/project/fotohub/) | `pip install fotohub` |
| TypeScript / Node.js 18+ | `fotohub` | [npm](https://www.npmjs.com/package/fotohub) | `npm install fotohub` |

Source code:
- Python: [github.com/fotohubapp/sdk-python](https://github.com/fotohubapp/sdk-python)
- TypeScript: [github.com/fotohubapp/sdk-node](https://github.com/fotohubapp/sdk-node)
- Examples: [github.com/fotohubapp/examples](https://github.com/fotohubapp/examples)

---

## Python SDK

### Install

```bash
pip install fotohub
```

Dependencies: `httpx` (HTTP client) + `pydantic` (type validation). Python 3.9 or higher required.

### Configure

```python
from fotohub import FotoHub

# Option 1: Pass API key directly
client = FotoHub(api_key="fh_live_...")

# Option 2: Use environment variable (recommended for production)
# export FOTOHUB_API_KEY=fh_live_...
client = FotoHub()
```

### Configuration Options

```python
client = FotoHub(
    api_key="fh_live_...",
    base_url="https://apis.fotohub.app",  # default
    timeout=120.0,                         # seconds (default: 120)
    max_retries=3,                         # automatic retry on 429/5xx
)
```

### Async Client

For high-throughput applications, use the async client:

```python
from fotohub import AsyncFotoHub

async with AsyncFotoHub(api_key="fh_live_...") as client:
    result = await client.generate_image(prompt="A sunset")
    print(result.images[0].url)
```

### Verify Installation

```python
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")
result = client.generate_image(
    prompt="Hello world test",
    model="seedream-5-0-260128"
)
print(f"Generated: {result.images[0].url}")
print(f"Credits used: {result.credits_used}")
```

---

## TypeScript SDK

### Install

::: code-group
```bash [npm]
npm install fotohub
```
```bash [pnpm]
pnpm add fotohub
```
```bash [yarn]
yarn add fotohub
```
```bash [bun]
bun add fotohub
```
:::

Zero dependencies. Uses native `fetch` — works in Node.js 18+, Deno, Bun, Cloudflare Workers, and browsers.

### Configure

```typescript
import { FotoHub } from "fotohub";

const client = new FotoHub({
  apiKey: process.env.FOTOHUB_API_KEY!,
});
```

### Configuration Options

```typescript
const client = new FotoHub({
  apiKey: "fh_live_...",          // required
  baseUrl: "https://apis.fotohub.app", // default
  timeout: 60_000,                // ms (default: 60000)
  maxRetries: 3,                  // automatic retry (default: 3)
  fetch: customFetch,             // optional custom fetch implementation
});
```

### Verify Installation

```typescript
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

const result = await client.generateImage({
  prompt: "Hello world test",
  model: "seedream-5-0-260128",
});
console.log(`Generated: ${result.images[0].url}`);
console.log(`Credits: ${result.creditsUsed}`);
```

---

## API Key Setup

1. Go to [fotohub.app/settings/api](https://fotohub.app/settings/api)
2. Click **Create API Key**
3. Copy the key (starts with `fh_live_` or `fh_test_`)
4. Store it securely — never commit to git

### Environment Variables

::: code-group
```bash [.env]
FOTOHUB_API_KEY=fh_live_your_key_here
```
```bash [Linux/macOS]
export FOTOHUB_API_KEY=fh_live_your_key_here
```
```powershell [Windows]
$env:FOTOHUB_API_KEY="fh_live_your_key_here"
```
:::

---

## Error Handling

Both SDKs throw typed exceptions you can catch:

::: code-group
```python [Python]
from fotohub import FotoHub, RateLimitError, InsufficientCreditsError, AuthError

client = FotoHub()

try:
    result = client.generate_image(prompt="test")
except AuthError:
    print("Invalid API key")
except RateLimitError as e:
    print(f"Rate limited — retry after {e.retry_after}s")
except InsufficientCreditsError:
    print("Top up credits at fotohub.app/billing")
```
```typescript [TypeScript]
import { FotoHub, RateLimitError, InsufficientCreditsError, AuthenticationError } from "fotohub";

const client = new FotoHub({ apiKey: "..." });

try {
  const result = await client.generateImage({ prompt: "test" });
} catch (e) {
  if (e instanceof AuthenticationError) {
    console.error("Invalid API key");
  } else if (e instanceof RateLimitError) {
    console.error(`Rate limited — retry after ${e.retryAfter}s`);
  } else if (e instanceof InsufficientCreditsError) {
    console.error("Top up credits at fotohub.app/billing");
  }
}
```
:::

---

## Next Steps

- [Quickstart Guide](/guides/quickstart) — generate your first image in 2 minutes
- [Image Generation API](/api/image-generation) — all parameters and models
- [Best Practices](/guides/best-practices) — production tips
- [Examples](https://github.com/fotohubapp/examples) — full code samples
