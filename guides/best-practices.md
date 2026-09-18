# Best Practices

Production-ready patterns for integrating with FOTOhub API.

## Authentication

- **Use environment variables** — Never hardcode API keys in source code
- **Rotate keys regularly** — Set expiration dates (90 days recommended)
- **Use scoped keys** — Only grant permissions the key actually needs
- **IP allowlist** — Restrict keys to your server IPs in production

## Error Handling

- **Always handle 402** — The prepaid USD wallet can run dry mid-session. This is
  about the wallet, not fotohub.app subscription credits -- the two are separate
  balances and a key never spends the latter.
- **Implement retries** — Use exponential backoff for 429 and 5xx errors
- **Use idempotency keys** — Prevent duplicate billing on network retries
- **Log the request ID** — Present as the `X-Request-Id` response header on every
  call; only duplicated into the error body on a `500`.

```python
import time
from fotohub.exceptions import RateLimitError, InsufficientFundsError

def generate_safe(client, prompt, max_retries=3):
    for attempt in range(max_retries + 1):
        try:
            return client.generate_image(prompt=prompt, model="seedream-5-0-260128")
        except RateLimitError as e:
            if attempt < max_retries:
                time.sleep(e.retry_after)
            else:
                raise
        except InsufficientFundsError as e:
            # Nothing was charged. Alert ops team, don't retry.
            notify_ops(f"Wallet empty: need ${e.shortfall_usd} more")
            raise
```

## Performance

- **Batch when possible** — Use `num_images: 4` instead of 4 calls
- **Use webhooks over polling** — For async operations (video generation)
- **Cache model listings** — `/v1/models` changes infrequently
- **Prefer SeedDream for images** — Best quality/cost ratio, fast inference

## Cost Optimization

- **Monitor with webhooks** — Subscribe to `billing.charged` and `billing.insufficient_funds` (confirmed live; `credits.low` is accepted as a subscription but no emitter for it could be found in the codebase -- see [Webhooks](/api/webhooks#available-events))
- **Set hard limits** — Configure per-project spending caps in Console
- **Use appropriate models** — Don't use Ultra/4K models when Standard suffices
- **Check balance before batch** — Verify credits before large job queues

## Security

- **Verify webhook signatures** — Always validate HMAC before processing
- **Use HTTPS everywhere** — For API calls and webhook endpoints
- **Audit key usage** — Review access logs in Console regularly
- **Don't expose keys to clients** — Proxy through your backend

## Model Selection

| Use Case | Recommended Model | Why |
|----------|-------------------|-----|
| General images | `seedream-5-0-260128` | Best quality/price |
| Fast previews | `imagen-3-fast` | 1 credit, fast |
| 4K quality | `imagen-4-ultra` | Native 4K generation |
| Text in images | `seedream-5-0-260128` | Superior text rendering |
| Photo editing | `imagen-4-standard` | Best editing |
| Budget video | `hailuo-o2` | 8 credits/5s |
| Quality video | `veo-3.1-generate-001` | Best motion quality, native audio |
| Fast chat | `gemini-flash` | 1 credit, instant |
| Complex reasoning | `claude-sonnet-4.6` | Top accuracy |
