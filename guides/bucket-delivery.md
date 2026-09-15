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
    "region": "us-west-2",
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
  "region": "us-west-2",
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

### Choosing a region

`region` is where the bytes physically sit, and it is fixed for the life of the
bucket — there is no move operation. Pick for the latency your users see and for
the compliance story you have to tell:

16 regions across 4 continents:

| `region` | Location | GDPR-suitable |
|---|---|---|
| `eu-central-1` | Frankfurt, Germany | yes |
| `eu-west-1` | Dublin, Ireland | yes |
| `eu-west-3` | Paris, France | yes |
| `eu-north-1` | Stockholm, Sweden | yes |
| `eu-west-2` | London, UK | no — third country post-Brexit |
| `us-east-1` | N. Virginia, USA | no — data leaves the EEA |
| `us-east-2` | Ohio, USA | no — data leaves the EEA |
| `us-west-1` | N. California, USA | no — data leaves the EEA |
| `us-west-2` | Oregon, USA | no — data leaves the EEA |
| `ca-central-1` | Canada (Central) | no — data leaves the EEA |
| `ap-northeast-1` | Tokyo, Japan | no — data leaves the EEA |
| `ap-northeast-2` | Seoul, South Korea | no — data leaves the EEA |
| `ap-southeast-1` | Singapore | no — data leaves the EEA |
| `ap-southeast-2` | Sydney, Australia | no — data leaves the EEA |
| `ap-south-1` | Mumbai, India | no — data leaves the EEA |
| `sa-east-1` | São Paulo, Brazil | no — data leaves the EEA |

`GET /v1/storage/s3/regions` returns this list live, with an `available` flag.
Treat that endpoint as authoritative rather than hardcoding the table: a region
is offerable only while we can also *price* it, so the set can narrow.

Price follows region. Storage runs from $0.023/GB (Oregon, Ireland, Ohio) to
$0.0405 (São Paulo); egress from $0.09/GB in Europe and North America to
$0.15 in São Paulo. `POST /v1/storage/s3/estimate` gives the exact figures for a
candidate region before you commit.

A US bucket is a first-class choice, not a fallback — if your traffic is in
North America, `us-west-2` is the right answer and delivery works identically.
The examples below use `us-west-2` for exactly that reason.

::: warning A US region is a transfer out of the EEA
`us-west-2` is outside the EEA. If the generations contain personal data (faces,
customer photos, anything identifying), that transfer is yours to justify under
GDPR — we cannot do it for you. Where you have any doubt, use `eu-central-1`.
:::

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
| `{job_id}` | the generation's job id — unique per request |
| `{user_id}` | your account id |
| `{date}` | `2026-08-07` |
| `{YYYY}` `{MM}` `{DD}` | date parts |
| `{HH}` `{mm}` `{ss}` | UTC time parts, zero-padded |
| `{name}` | the source filename without its extension |
| `{index}` | position in the response, from `0` |
| `{ext}` | the file extension, without the dot |

A template ending in `/` is treated as a prefix and the original filename is
appended. Templates are validated when you save them, not when a generation
runs — so a typo is a `400` here rather than a surprise months later, after
you have paid for the generation. Absolute paths, `..`, backslashes, empty
segments and unknown tokens are all refused.

Anything substituted into a key is sanitised to `[A-Za-z0-9._-]`, so a model id
or job id cannot introduce a path separator.

::: warning A template that renders one key per response overwrites itself
An S3 `PUT` to a key that already exists returns `200` and replaces the object.
Nothing fails, nothing logs, and the generation you paid for is gone. So a
template must distinguish the files a single response can contain.

`public/{date}/{model}.{ext}` does not: ask for four images and it renders the
same key four times. Add `{index}` (or `{job_id}`, or `{HH}{mm}{ss}`):

```
public/{date}/{model}-{job_id}-{index}.{ext}
```

As a floor under templates that do collide, keys within one response are made
distinct before anything is written — the first keeps the rendered key, the rest
get `-2`, `-3`, … inserted before the extension (`hero.png`, `hero-2.png`).
`{index}` is for when you want to control that numbering yourself.

This only protects one response from itself. Two *separate* calls on a template
with no `{job_id}`, `{index}` or time token still resolve to the same key, and
the second one wins. If your keys must be stable and unique across calls, put
`{job_id}` in the template.
:::

### Which URL do I read the file from?

Two different hostnames, and they are not interchangeable:

| Hostname | Auth | Where it comes from |
|---|---|---|
| `<alias>.s3point.fotohub.app/<key>` | none, if the prefix is published | you create it in step 2 |
| `<bucket>.s3.<region>.amazonaws.com/<key>?X-Amz-…` | the signature in the query string | `presign-download` returns it |

The `s3point` host is the one to publish, put in HTML, or hand to a CDN. It is
stable, it carries no credentials, and revoking access is one `PATCH` on the
alias.

The raw `amazonaws.com` URL that `presign-download` returns is a *temporary*
capability, not an address. It expires (`expires_in`, one hour by default), and
the signature in it grants read access to that one object to whoever holds the
link — so it does not belong in a page, a cache, or a log. Strip the query string
and it becomes a plain `403`: a private bucket has no anonymous URL at all, which
is the point of buying one.

### Getting the bucket id out of an AWS URL

Presigned URLs and `delivery.bucket` both give you the *AWS bucket name*
(`fh-cust-3c685a01-moje-generacje-hvrx`), while every endpoint in this guide
takes the bucket's **id** (a UUID). The name embeds the first 8 hex characters of
your account id, a slug of the display name, and a random suffix — it is not
reversible into the UUID. Look it up instead:

```bash
# AWS bucket name → bucket id
curl -s https://apis.fotohub.app/v1/storage/s3/buckets \
  -H "Authorization: Bearer $FH_JWT" \
  | jq -r '.[] | select(.aws_bucket_name=="fh-cust-3c685a01-moje-generacje-hvrx") | .id'
```

The same listing answers "how full is it": each row carries
`current_size_bytes` and `current_object_count`, read from the bucket at request
time rather than from a daily snapshot, so an object delivered a minute ago is
already counted.

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

The `url` is unchanged — still a signed FOTOhub URL, so existing code keeps
working. Your bucket is an *additional* destination, not a redirect. What is new
is a `delivery` block, present only when routing resolved to a destination:

```json
{
  "model": "seedance-2-0-mini",
  "url": "https://s1.fotohub.app/storage/v1/object/sign/api-generations/...",
  "usd_charged": 3.7800,
  "delivery": {
    "kind": "console_bucket",
    "routed_by": "rule",
    "destination_id": "376ec105-06bc-4011-8b9e-20cc4e253ea8",
    "bucket": "fh-cust-9a1f7c30-acme-prod-a1b2c3d4e5-wxyz",
    "region": "us-west-2",
    "keys": ["private/2026/08/8f21c4de.mp4"],
    "status": "pending"
  }
}
```

| Field | Meaning |
|---|---|
| `kind` | `console_bucket` for a bucket we provisioned, `s3` for your own |
| `routed_by` | Which precedence level chose this: `request`, `rule`, `default` |
| `bucket` | The real AWS bucket name receiving the object |
| `region` | Where it lands — worth asserting in a compliance-sensitive pipeline |
| `keys` | The exact object keys that will be written |
| `status` | Always `pending` (see below) |

`keys` is the useful part: key layout is deterministic, so we can tell you the
destination key before the transfer finishes. **This is what you poll on** — a
`HEAD` on that key, not a blind `LIST` of the prefix.

`routed_by` answers "why did my file go *there*", which is otherwise
unanswerable without reading the key's rules and the request side by side.

::: warning `status` is always `pending`, and that is not a hedge
Delivery is deliberately detached from the response. If your bucket is slow or
briefly unavailable, your generation still returns — it does not wait, and it
does not fail. So **the response returning does not prove the object arrived**,
and a `delivery` block is a statement of intent, not a receipt. If your pipeline
depends on the object being there, wait on `keys`.
:::

`GET /v1/destinations` is the after-the-fact view. Each row carries
`writes_total`, `bytes_written`, `last_write_at` and `last_error`, so you can see
whether deliveries are landing without inspecting your bucket:

```bash
curl -s https://apis.fotohub.app/v1/destinations \
  -H "Authorization: Bearer $FH_JWT" \
  | jq '.destinations[] | {name, writes_total, bytes_written, last_write_at, last_error}'
```

Counters are advisory: they are updated after the object is written, so a
successful delivery whose counter update failed is still a successful delivery.
`last_error` is the field to alert on.

Absence of `delivery` is meaningful too: it means nothing matched, and the output
stayed in FOTOhub storage. If you expected a delivery, that is the signal that a
rule pattern does not match the model id you actually sent.

`keepLocalCopy` on the key (default `true`) controls whether the FOTOhub copy
survives until retention expires. Set it to `false` once you trust the delivery
and want to stop paying for two copies. It does not change the response — the
signed URL keeps working until retention elapses either way.

### Waiting for the object

```bash
KEY=$(curl -s -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" \
  -d '{"model":"seedance-2-0-mini","prompt":"...","duration":5}' \
  | jq -r '.delivery.keys[0]')

# Poll your own bucket for that exact key rather than listing the prefix.
until aws s3api head-object --bucket "$MY_BUCKET" --key "$KEY" >/dev/null 2>&1; do
  sleep 2
done
```

If you published the prefix (step 2), the same wait works with no credentials at
all — `curl -sfI "https://acme.s3point.fotohub.app/$KEY"`.

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

## Worked example: two models, one private US bucket

The common shape: an application generating video with `seedance-2-0-mini` and
stills with `dola-seedream-5-0-pro-260628`, both landing in a private bucket in
Oregon, nothing published. Copy-paste runnable — it is the same sequence our own
end-to-end test performs against production.

```bash
export FH_JWT="<your console session JWT>"
API=https://apis.fotohub.app

# 1. A private bucket in the US. No alias is created, so nothing is reachable
#    anonymously and there is no public hostname to leak.
BUCKET=$(curl -sX POST "$API/v1/storage/s3/buy" \
  -H "Authorization: Bearer $FH_JWT" -H "Content-Type: application/json" \
  -d '{"display_name":"Acme private output","region":"us-west-2",
       "quota_gb":100,"encryption_type":"SSE-S3","billing_mode":"wallet"}')
BUCKET_ID=$(echo "$BUCKET" | jq -r .id)

# 2. Register it as a destination. No credentials: we hold the bucket's IAM user.
DEST_ID=$(curl -sX POST "$API/v1/destinations" \
  -H "Authorization: Bearer $FH_JWT" -H "Content-Type: application/json" \
  -d "{\"name\":\"acme-private\",\"kind\":\"console_bucket\",
       \"bucketId\":\"$BUCKET_ID\",\"pathPrefix\":\"incoming\"}" | jq -r .id)

# 3. One key, two rules — each model gets its own folder layout.
KEY=$(curl -sX POST "$API/v1/auth/keys" \
  -H "Authorization: Bearer $FH_JWT" -H "Content-Type: application/json" \
  -d '{"name":"acme-app","keyType":"write","scopes":["video","images"],
       "keepLocalCopy":false}')
KEY_ID=$(echo "$KEY" | jq -r .meta.id)
SECRET=$(echo "$KEY" | jq -r .apiKey)      # shown once

for RULE in \
  '{"modelPattern":"seedance-2-0-mini","pathTemplate":"video/{YYYY}/{MM}/{job_id}.{ext}"}' \
  '{"modelPattern":"dola-seedream-5-0-pro-260628","pathTemplate":"stills/{date}/{job_id}.{ext}"}'
do
  curl -sX POST "$API/v1/auth/keys/$KEY_ID/output-rules" \
    -H "Authorization: Bearer $FH_JWT" -H "Content-Type: application/json" \
    -d "$(echo "$RULE" | jq --arg d "$DEST_ID" '. + {destinationId:$d, priority:10}')" >/dev/null
done

# 4. Generate. The delivery block tells you the destination key up front.
curl -sX POST "$API/v1/ai/generate/image" \
  -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" \
  -d '{"model":"dola-seedream-5-0-pro-260628",
       "prompt":"studio packshot of a brushed steel water bottle",
       "size":"1024x1024"}' | jq '.delivery'
```

```json
{
  "kind": "console_bucket",
  "routed_by": "rule",
  "destination_id": "f935771d-3384-4d0b-b62f-fa3504cba196",
  "bucket": "fh-cust-3c685a01-acme-private-07zp",
  "region": "us-west-2",
  "keys": ["incoming/stills/2026-08-07/9c1f4ade.png"],
  "status": "pending"
}
```

Note `pathPrefix` on the destination and `pathTemplate` on the rule compose —
prefix first — so one bucket can serve several applications without their key
layouts colliding.

Video is the async shape: `POST /v1/ai/generate/video` returns `202` with a
`job_id`, and the `delivery` block appears on the poll response that reports
`completed`, since that is when the object exists to deliver.

```bash
JOB=$(curl -sX POST "$API/v1/ai/generate/video" \
  -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" \
  -d '{"model":"seedance-2-0-mini","prompt":"slow dolly across a workshop bench",
       "duration":5}' | jq -r .job_id)

until [ "$(curl -s "$API/v1/ai/generate/video/$JOB" \
            -H "Authorization: Bearer $SECRET" | jq -r .status)" = "completed" ]; do
  sleep 10
done
```

Poll on a 10-second interval or slower. A 5-second `seedance-2-0-mini` render
takes roughly 60–150 seconds end to end.

::: tip Reading back from a private bucket
With no alias there is no public URL, and that is the point. Fetch through
`POST /v1/storage/s3/buckets/{id}/objects/presign-download`, which returns a
short-lived signed URL, or list with
`POST /v1/storage/s3/buckets/{id}/objects/list`. Pass `"delimiter": ""` when
listing if your keys are nested — the default `/` groups everything below the
prefix into `common_prefixes` and returns an empty `objects` array, which looks
exactly like an empty bucket.
:::

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

Anything marked "API key or JWT" works with an `fh_live_*` key, so the whole
buy-then-deliver flow can be scripted without a browser session. The rows marked
"JWT only" are console operations and will answer `401` to an API key.

| Method | Path | Auth |
|---|---|---|
| `POST` | `/v1/storage/s3/buy` | API key or JWT |
| `GET` | `/v1/storage/s3/buckets` | API key or JWT |
| `GET` | `/v1/storage/s3/buckets/{id}` | API key or JWT |
| `POST` | `/v1/storage/s3/estimate` | API key or JWT |
| `GET` | `/v1/storage/s3/regions` | API key or JWT |
| `GET` | `/v1/storage/s3/pricing` | API key or JWT |
| `GET` | `/v1/storage/s3/buckets/{id}/aliases` | API key or JWT |
| `POST` | `/v1/storage/s3/buckets/{id}/aliases` | API key or JWT |
| `PATCH` | `/v1/storage/s3/buckets/{id}/aliases/{alias}` | API key or JWT |
| `DELETE` | `/v1/storage/s3/buckets/{id}/aliases/{alias}` | API key or JWT |
| `DELETE` | `/v1/storage/s3/buckets/{id}` | JWT only |
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

- [Buy Storage & Generate via API](/guides/api-storage-and-generation) — the same
  flow end to end using only an API key, with a runnable script
- [S3 Cloud Storage](/api/storage) — the full bucket API: objects, multipart,
  versioning, lifecycle, CORS, replication
- [Webhooks](/guides/webhooks) — get told when a generation finishes
- [Pricing & Costs](/guides/pricing) — storage and egress rates
