# Delivering generations to your own bucket

By default, everything the API generates lands in FOTOhub storage and comes back
as a signed URL that expires. That is fine for a script that downloads the file
and moves on. It is not fine if you are building a product on top of it: you
want the object in a bucket you own, at a key you chose, behind a hostname you
can put in your own HTML.

This guide sets that up end to end. At the end, a call to
`seedance-2-0-mini` writes straight into your bucket at
`private/2026/08/<job>.mp4`, and anything you drop under `public/` is readable
at `https://acme.s3point.fotohub.app/public/...` with no signature at all.

Everything below uses your Supabase session JWT (the console's own token) except
the generation call itself, which uses an `fh_live_` API key.

```
Base URL: https://apis.fotohub.app
```

## The shape of it

Four objects, in this order:

1. **A bucket.** Real AWS S3, provisioned for you, in the region you pick. You
   never see or hold its credentials.
2. **An alias** — `<label>.s3point.fotohub.app`. Optional, and only needed if
   you want anonymous public reads. An alias with no published prefixes exposes
   nothing.
3. **A destination.** The thing generations point at. For a bucket we
   provisioned this is `kind: "console_bucket"` and carries no credentials.
4. **A routing rule on an API key** — "anything matching `seedance-2-0-*` goes
   to this destination, at this key layout".

You can skip step 4 and set a single default destination on the key, or skip
both and name the bucket per request. All three work; see
[Precedence](#precedence).

## 1. Buy a bucket

```bash
curl -X POST https://apis.fotohub.app/v1/storage/s3/buy \
  -H "Authorization: Bearer $FH_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Acme production output",
    "region": "eu-central-1",
    "default_storage_class": "STANDARD",
    "quota_gb": 500,
    "versioning_enabled": false,
    "encryption_type": "SSE-S3",
    "billing_mode": "wallet"
  }'
```

```json
{
  "id": "9a1f7c30-4b2e-4d81-9f65-c2e08d7a1b34",
  "display_name": "Acme production output",
  "aws_bucket_name": "fh-cust-9a1f7c30",
  "region": "eu-central-1",
  "status": "active",
  "quota_gb": 500,
  "billing_state": "current"
}
```

Provisioning is a multi-step saga — bucket, encryption, public-access block, a
dedicated IAM user with a permissions boundary scoped to this one bucket — so
the call can take 30–60 seconds. If any step fails the whole thing is rolled
back and a wallet reservation is refunded; you never end up owning half a
bucket.

Keep `id`. Every call below takes it.

::: tip Billing modes
`wallet` reserves roughly 1.5 days of full-quota storage cost up front and
debits your USD balance hourly thereafter. `invoice_monthly` skips the
reservation. Storage, requests and egress are billed in USD at cost-plus rates;
`POST /v1/storage/s3/estimate` will price a workload before you commit.
:::

::: warning Block Public Access stays on
`block_public_access` defaults to `true` and there is no reason to change it.
Public reads are served by the FOTOhub gateway from an alias's published
prefixes — not by S3 — so you get anonymous access to exactly the folders you
name while the bucket itself stays closed. Object ACLs are never touched.
:::

## 2. Publish a hostname (optional)

Only needed if you want URLs that work without a signature.

```bash
curl -X POST "https://apis.fotohub.app/v1/storage/s3/buckets/$BUCKET_ID/aliases" \
  -H "Authorization: Bearer $FH_JWT" \
  -H "Content-Type: application/json" \
  -d '{"alias": "acme", "public_prefixes": []}'
```

```json
{
  "id": "3f1c9b22-77ad-4e0a-b3d6-91f4e5c8a207",
  "alias": "acme",
  "bucket_id": "9a1f7c30-4b2e-4d81-9f65-c2e08d7a1b34",
  "status": "active",
  "public_prefixes": [],
  "hostname": "acme.s3point.fotohub.app",
  "public_base_url": "https://acme.s3point.fotohub.app",
  "is_publicly_readable": false
}
```

The hostname exists, and it serves nothing. `is_publicly_readable` is `false`
because `public_prefixes` is empty — creating an alias never exposes an object.
Going public is a separate, deliberate call:

```bash
curl -X PATCH "https://apis.fotohub.app/v1/storage/s3/buckets/$BUCKET_ID/aliases/acme" \
  -H "Authorization: Bearer $FH_JWT" \
  -H "Content-Type: application/json" \
  -d '{"public_prefixes": ["public/"]}'
```

Now `https://acme.s3point.fotohub.app/public/hero.mp4` is a plain anonymous
`GET`. `https://acme.s3point.fotohub.app/private/hero.mp4` is a 403, and so is
a bucket listing.

### Alias rules

- One DNS label: 3–63 characters, lowercase letters, digits and hyphens,
  starting and ending alphanumeric. No dots — the wildcard certificate covers
  exactly one level, so `a.b.s3point.fotohub.app` has no valid certificate and
  is not served.
- Punycode (`xn--`) is refused.
- `www`, `api`, `admin`, `s3`, `static`, `cdn`, `gateway`, `health`,
  `internal`, `fotohub`, `mail`, `ftp`, `ns1`, `ns2` are reserved.

### Prefix rules

- Name a folder: `public/`, `assets/renders/`. Up to 20 prefixes per alias.
- No leading slash. S3 keys do not have one, so `/public/` would match nothing
  while looking right.
- No wildcards. `public/*` is refused rather than silently treated as a literal
  `*` folder — to publish everything, publish `""`… which is also refused. If
  you want the whole bucket public, say so with a top-level folder and put
  everything in it.
- A prefix already covered by a shorter one is dropped, so the stored list
  always reflects your real exposure rather than implying it is narrower than it
  is.

### Unpublishing

`public_prefixes: []` unpublishes everything. This is not the same as omitting
the field:

| Request body | Effect |
|---|---|
| `{"public_prefixes": []}` | Unpublish everything; hostname stays |
| `{"status": "disabled"}` | Alias stops resolving; prefix list preserved |
| `{"public_prefixes": ["public/"], "status": "active"}` | Both set |

Omitted means "leave alone". Sending `null` is not a way to say "empty".

Public responses carry `X-Robots-Tag: noindex` — if you want your generations
indexed, serve them through your own hostname.

## 3. Create the destination

For a bucket FOTOhub provisioned, there is nothing to authenticate: name it.

```bash
curl -X POST https://apis.fotohub.app/v1/destinations \
  -H "Authorization: Bearer $FH_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme production",
    "kind": "console_bucket",
    "bucketId": "9a1f7c30-4b2e-4d81-9f65-c2e08d7a1b34"
  }'
```

```json
{
  "id": "c47b8e91-2d5f-4a06-8b3c-1e9f7d602a58",
  "name": "Acme production",
  "kind": "console_bucket",
  "bucket_id": "9a1f7c30-4b2e-4d81-9f65-c2e08d7a1b34",
  "status": "active",
  "path_prefix": ""
}
```

Ownership of `bucketId` is verified against your account, not trusted — a
bucket id belonging to someone else resolves to nothing, both here and again at
delivery time.

::: details Bringing your own bucket instead
If the bucket is yours already — AWS, Cloudflare R2, Backblaze B2, MinIO,
DigitalOcean Spaces, Wasabi — use `kind: "external_s3"` and supply credentials:

```json
{
  "name": "Acme R2",
  "kind": "external_s3",
  "providerPreset": "r2",
  "accountId": "your-cf-account-id",
  "bucketName": "acme-renders",
  "accessKeyId": "...",
  "secretAccessKey": "...",
  "pathPrefix": "fotohub/"
}
```

The preset resolves the endpoint and addressing style for you. Credentials are
envelope-encrypted under a KMS key and only ever decrypted inside the storage
service — they are never returned by any endpoint, including this one. Creation
round-trips a probe object (`PUT`, `HEAD`, `DELETE`) so the response tells you
whether the bucket genuinely works, rather than only whether it looked
plausible.

Grant the credentials `s3:PutObject` on the prefix and nothing more. Delivery
never lists, reads or deletes.
:::

## 4. Point a key at it

Create a key, then attach a per-model rule. The create response carries the id
the rule route needs:

```bash
KEY=$(curl -sX POST https://apis.fotohub.app/v1/auth/keys \
  -H "Authorization: Bearer $FH_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme production", "keyType": "write", "scopes": ["video", "images"]}')

KEY_ID=$(echo "$KEY"  | jq -r .meta.id)
SECRET=$(echo "$KEY"  | jq -r .apiKey)   # shown once — store it now
```

```bash
curl -X POST "https://apis.fotohub.app/v1/auth/keys/$KEY_ID/output-rules" \
  -H "Authorization: Bearer $FH_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "modelPattern": "seedance-2-0-*",
    "destinationId": "c47b8e91-2d5f-4a06-8b3c-1e9f7d602a58",
    "pathTemplate": "private/{YYYY}/{MM}/{job_id}.{ext}",
    "priority": 10
  }'
```

`modelPattern` is a glob against the canonical all-dashes model id, so
`seedance-2-0-*` covers `seedance-2-0-mini` and its siblings. Lowest `priority`
wins, which lets a broad rule and a specific one coexist:

```json
[
  {"modelPattern": "dola-seedream-5-0-pro-260628", "destinationId": "...", "priority": 10},
  {"modelPattern": "*",                            "destinationId": "...", "priority": 100}
]
```

### Path templates

| Token | Expands to |
|---|---|
| `{model}` | the model id |
| `{job_id}` | the generation's job id |
| `{user_id}` | your account id |
| `{date}` | `2026-08-07` |
| `{YYYY}` `{MM}` `{DD}` | date parts |
| `{ext}` | the file extension, without the dot |

A template ending in `/` is treated as a prefix and the original filename is
appended. Templates are validated when you save them, not when a generation
runs — so a typo is a `400` here rather than a surprise months later, after
you have paid for the generation. Absolute paths, `..`, backslashes, empty
segments and unknown tokens are all refused.

Anything substituted into a key is sanitised to `[A-Za-z0-9._-]`, so a model id
or job id cannot introduce a path separator.

## 5. Generate

Nothing special — just use the key.

```bash
curl -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance-2-0-mini",
    "prompt": "slow dolly across a lit workshop bench, shallow depth of field",
    "duration": 5
  }'
```

The response is unchanged: a signed FOTOhub URL, so existing code keeps working.
Delivery to your bucket happens alongside it, and the object appears at
`private/2026/08/<job_id>.mp4`.

Delivery is deliberately detached from the response. If your bucket is slow or
briefly unavailable, your generation still returns — it does not wait, and it
does not fail. The consequence is the honest one: **the response returning does
not prove the object arrived.** If your pipeline depends on the object being
there, check for it, or list the prefix. Per-destination write counts, byte
totals, the last write time and the last error are on the destination row.

`keepLocalCopy` on the key (default `true`) controls whether the FOTOhub copy
survives until retention expires. Set it to `false` once you trust the delivery
and want to stop paying for two copies.

## Precedence

Three levels, highest first. Each falls through to the next rather than failing,
because by the time delivery runs you have already been billed.

**1. The request body.** Per call, no configuration:

```json
{
  "model": "seedance-2-0-mini",
  "prompt": "...",
  "output": {
    "bucket": "acme",
    "prefix": "campaigns/spring/{job_id}.{ext}"
  }
}
```

`bucket` takes either a bucket id or an alias label — both are resolved against
your account. A prefix here gets the same validation as a saved template, and is
dropped (not fataled) if malformed.

**2. A per-model rule on the key** — step 4 above.

**3. The key's default destination** — `destinationId` when creating or
patching a key. Applies to every model with no matching rule.

With none of the three, output stays in FOTOhub storage and behaves exactly as
it always has.

## Security notes

Worth knowing rather than discovering:

- **A bucket id is not a capability.** Every route that takes one re-reads the
  row filtered by your account, and delivery re-checks at write time — a bucket
  can change hands or be decommissioned long after a rule was written.
- **Publishing is an alias property, never an object property.** There is no
  per-object "make public". A file is anonymously readable only while a prefix
  covering it is published on an active alias, so revoking access is one PATCH
  and takes effect immediately for every object at once.
- **Public reads are `GET` and `HEAD` only.** Listing is refused, and so is
  every S3 subresource query (`?acl`, `?policy`, `?uploads`, `?versions`, and
  33 others). An anonymous write is refused.
- **A denial tells you nothing.** An unknown alias and an out-of-prefix key
  return byte-identical responses, so the public endpoint cannot be used to
  discover which buckets or folders exist.
- **Credentials for an external destination are write-only in practice.** Grant
  `s3:PutObject` and nothing else; nothing in the delivery path needs more.

## Endpoint reference

| Method | Path | Auth |
|---|---|---|
| `POST` | `/v1/storage/s3/buy` | JWT |
| `GET` | `/v1/storage/s3/buckets` | JWT |
| `GET` | `/v1/storage/s3/buckets/{id}` | JWT |
| `GET` | `/v1/storage/s3/buckets/{id}/aliases` | JWT |
| `POST` | `/v1/storage/s3/buckets/{id}/aliases` | JWT |
| `PATCH` | `/v1/storage/s3/buckets/{id}/aliases/{alias}` | JWT |
| `DELETE` | `/v1/storage/s3/buckets/{id}/aliases/{alias}` | JWT |
| `GET` | `/v1/destinations` | JWT |
| `POST` | `/v1/destinations` | JWT |
| `PATCH` | `/v1/destinations/{id}` | JWT |
| `POST` | `/v1/destinations/{id}/verify` | JWT |
| `DELETE` | `/v1/destinations/{id}` | JWT |
| `POST` | `/v1/auth/keys` | JWT |
| `GET` | `/v1/auth/keys/{id}/output-rules` | JWT |
| `POST` | `/v1/auth/keys/{id}/output-rules` | JWT |
| `PATCH` | `/v1/auth/keys/{id}/output-rules/{rule_id}` | JWT |
| `DELETE` | `/v1/auth/keys/{id}/output-rules/{rule_id}` | JWT |

## See also

- [S3 Cloud Storage](/api/storage) — the full bucket API: objects, multipart,
  versioning, lifecycle, CORS, replication
- [Webhooks](/guides/webhooks) — get told when a generation finishes
- [Pricing & Costs](/guides/pricing) — storage and egress rates
