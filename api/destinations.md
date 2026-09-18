# Output destinations (BYOB — bring your own bucket)

Attach an S3-compatible bucket you own, bind an API key to it, and everything
that key generates lands in your storage instead of leaving you to download
expiring signed URLs.

::: warning These endpoints are configured from a session, not from an API key
`/v1/destinations` authenticates with a **user session JWT**. An `fh_live_*` key
gets `401` on every one of them — verified against production.

That is the intended split. You *create* a destination once, signed in to the
Console. Your API key then *uses* it automatically on every generation. There
is nothing to call at generation time, and your bucket credentials never travel
in a generation request.
:::

## How the pieces fit

1. Create a destination (Console, or the endpoints below from a session).
   FOTOhub verifies the credentials immediately — see below.
2. Bind it to an API key, via the `destination_id` field on
   `POST /v1/auth/keys`, or on an existing key with
   `PATCH /v1/auth/keys/{key_id}`.
3. Generate as usual. Output is written to your bucket, and the response
   carries a `delivery` block describing where it went.

Per-key delivery rules — different models or endpoints writing to different
prefixes — are managed through
`GET,POST /v1/auth/keys/{key_id}/output-rules` and
`PATCH,DELETE /v1/auth/keys/{key_id}/output-rules/{rule_id}`.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/v1/destinations/presets` | **Public — no auth.** Static provider config for a connect form. |
| `GET` | `/v1/destinations` | List your destinations, each with the keys pointed at it |
| `POST` | `/v1/destinations` | Attach a bucket. Returns `201`. |
| `PATCH` | `/v1/destinations/{destination_id}` | Rename, re-key, enable/disable |
| `POST` | `/v1/destinations/{destination_id}/verify` | Re-run the credential probe |
| `DELETE` | `/v1/destinations/{destination_id}` | Detach. Accepts `?force=true`. |

## Supported providers

`GET /v1/destinations/presets` is public and returns the live list with each
provider's regions and quirks:

| `providerPreset` | Provider |
|---|---|
| `aws` | Amazon S3 |
| `r2` | Cloudflare R2 |
| `b2` | Backblaze B2 |
| `spaces` | DigitalOcean Spaces |
| `wasabi` | Wasabi |
| `custom` | Any S3-compatible endpoint (MinIO and others) |

Each preset carries `needs_account_id`, `needs_endpoint` and `force_path_style`,
so a connect form can ask for exactly the fields that provider requires rather
than showing every field to everyone.

## Creating a destination

```http
POST /v1/destinations
Content-Type: application/json
```

| Field | Type | Notes |
|---|---|---|
| `name` | string | **Required.** 1–80 characters. |
| `providerPreset` | string | Default `aws`. One of the presets above. |
| `bucketName` | string | Your bucket, max 255 characters. |
| `region` | string | Default `eu-central-1`. |
| `accountId` | string | Required by providers whose preset says `needs_account_id` — Cloudflare R2, for instance. |
| `endpointUrl` | string | Required when `providerPreset` is `custom`. |
| `forcePathStyle` | boolean | Overrides the preset's default. MinIO usually needs `true`. |
| `pathPrefix` | string | Prefix every object with this, e.g. `fotohub/renders`. |
| `accessKeyId` | string | Your access key. |
| `secretAccessKey` | string | Your secret. |

::: tip The create call proves the bucket works before it returns
Attaching a destination is not a config write. FOTOhub round-trips a probe
object against your bucket as part of the create — `PUT`, then `HEAD`, then
`DELETE` — so a `201` means credentials, permissions, region and endpoint are
all genuinely correct.

The alternative is worse than it sounds: a destination that merely *looked*
valid would fail later, silently, on somebody else's generation, long after you
had stopped watching. `POST /v1/destinations/{destination_id}/verify` re-runs
the same probe on demand, which is the right thing to call after you rotate the
bucket's credentials.
:::

## Updating

`PATCH /v1/destinations/{destination_id}` accepts `name`, `pathPrefix`,
`status` (`active` or `disabled`), and a new `accessKeyId` /
`secretAccessKey` pair. Disabling a destination leaves generations writing to
FOTOhub storage rather than failing them.

## Related

[Delivery to your bucket](/guides/bucket-delivery) ·
[Authentication](/api/authentication) ·
[API surface map](/api/surface-map)
