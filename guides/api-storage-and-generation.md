FOTOhub API: buy storage, upload files, and send generated media straight to your own bucket

Everything in this guide is done with a single API key. You never need to open the web console, except for the one card payment that funds your balance.

What you can build with this

- Buy and configure real AWS S3 storage from the API, paid per hour from your prepaid balance
- Upload and download your own files, either through presigned URLs or with any S3 client
- Generate images with Seedream 5.0 and videos with Seedance 2.0 Mini, and have every result land directly in your bucket
- Register a face once as a reusable asset and use it across many video generations
- List, inspect and delete only your own registered assets, with no visibility into anyone else's

Before you start

- Base URL: `https://apis.fotohub.app`
- Storage endpoint for direct uploads: `https://s3point.fotohub.app` (AWS SigV4 signed requests only)
- Every call is authenticated with the header `Authorization: Bearer fh_live_...`
- All prices are in US dollars, charged from your prepaid balance. There are no credits and no subscriptions. Credits exist only in the fotohub.app web app and cannot pay for API usage
- Your balance can never go below zero. When a request costs more than you hold, nothing is generated and nothing is charged

Step 1: check your balance and top up

```bash
curl -s https://apis.fotohub.app/v1/billing/balance \
  -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

```json
{
  "wallet": {
    "balance_usd": 25.0,
    "pending_usd": 0.0,
    "total_topped_up_usd": 25.0,
    "currency": "USD"
  },
  "spend": {
    "this_month_usd": 0.0,
    "monthly_limit_usd": null,
    "currency": "USD"
  },
  "billing_model": "prepaid_wallet_usd"
}
```

Two things to know about the balance, both of which will save you debugging time:

- A partial balance answers `402` with `"error": "insufficient_funds"` and a `shortfall_usd` field telling you exactly how much more you need. Nothing is charged on a `402`, and the payload states `"charged": false` so you never have to guess
- A balance of exactly `0.00` answers `403` with `"error": "api_access_required"`, not `402`, because zero balance disables API access before the price of the request is even calculated. Treat both statuses as "needs funding". Keep a small buffer so a busy hour cannot take you to zero mid-integration

Top up at `https://fotohub.app/console/wallet`. That is the one step that needs a browser, because it is a card payment.

Step 2: price a bucket before you buy it

```bash
curl -s -X POST https://apis.fotohub.app/v1/storage/s3/estimate \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "region": "eu-central-1",
        "storage_class": "STANDARD",
        "storage_gb": 100,
        "put_requests": 50000,
        "get_requests": 200000,
        "egress_gb": 50,
        "period_days": 30
      }'
```

Notes on this call:

- The size field is `storage_gb`, not `quota_gb`. This endpoint rejects unknown fields, so a typo returns `422` rather than a silently wrong number
- The response carries `line_items`, `subtotal_usd` and `total_usd`, so you can see which component (storage, requests, egress) actually dominates your cost
- `STANDARD` costs about `0.0245` USD per GB per month. Cheaper classes are `STANDARD_IA`, `ONEZONE_IA`, `GLACIER_IR`, `GLACIER` and `DEEP_ARCHIVE`
- Storage is billed hourly on what you actually store, measured from CloudWatch, not on the capacity you declare. An empty 100 GB bucket costs almost nothing, so sizing generously is not expensive
- `quota_gb` is therefore a spending cap, not a purchase. Set it to the most you ever want to be able to store
- Requests and egress are billed on real counts too, and egress is tiered across all your buckets together
- There is also a small fixed fee per bucket per month, prorated hourly, which covers provisioning the bucket itself. Budget for it if you plan to run many small buckets rather than a few large ones

You can also read the raw price matrix with `GET /v1/storage/s3/pricing`, and the list of accepted regions with `GET /v1/storage/s3/regions`.

Step 3: buy the bucket

```bash
curl -s -X POST https://apis.fotohub.app/v1/storage/s3/buy \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "display_name": "production-media",
        "region": "eu-central-1",
        "quota_gb": 100,
        "default_storage_class": "STANDARD",
        "versioning_enabled": false,
        "encryption_type": "SSE-S3",
        "block_public_access": true,
        "billing_mode": "wallet"
      }'
```

The response, trimmed:

```json
{
  "bucket": {
    "id": "8f2c1d90-4e77-4a63-9b1e-2f5a7c8d0e11",
    "aws_bucket_name": "fh-cust-8f2c1d90-prod",
    "display_name": "production-media",
    "region": "eu-central-1",
    "status": "active",
    "quota_gb": 100
  },
  "access_key_id": "fhk_live_QcW8x...",
  "secret_access_key": "fhk_sec_9Za2v...",
  "endpoint": "https://s3point.fotohub.app",
  "region": "eu-central-1",
  "s3_uri": "s3://fh-cust-8f2c1d90-prod/",
  "example_boto3": "...",
  "warning": "Save your secret_access_key now, it will NEVER be shown again."
}
```

Points that matter here:

- The bucket id is nested: `bucket.id`, not a top level `id`
- This one call also gives you working S3 credentials. There is no separate step to create a key. Save `secret_access_key` immediately, it is returned exactly once
- `billing_mode: "wallet"` debits a small safety reservation from your balance right away, roughly 1.5 days of the full quota at your storage class, with a minimum of `0.15` USD. Hourly billing then charges what you actually store. If your balance is short you get a `402` with the exact shortfall and no bucket is created
- If provisioning fails at any step, the reservation is refunded automatically
- Provisioning runs a multi step saga and can take 30 to 60 seconds. Use a client timeout of at least 120 seconds
- `quota_gb` is a cap, from 1 to 1048576. You are billed on what you store, not on this number, and `POST .../upgrade` raises it later at no charge
- `block_public_access: true` is already the default, so you can omit it. It is shown here because it is worth being explicit about
- 16 AWS regions are accepted, not just `eu-central-1`. Call `GET /v1/storage/s3/regions` for the current list and pick the one closest to your users
- The credentials you receive are FOTOhub virtual keys (`fhk_live_` and `fhk_sec_`). Raw AWS credentials never leave our servers
- How many buckets you can own: a funded prepaid balance allows up to 25. Exceeding that returns `403` with `"error": "plan_gate_exceeded"`. That is a count limit, not a money problem, so topping up does not raise it

Save the bucket id, you will use it everywhere below:

```bash
export BUCKET_ID="8f2c1d90-4e77-4a63-9b1e-2f5a7c8d0e11"
```

Step 4: give the bucket a short alias

An alias is a readable single label you can use in place of the UUID when routing generated output. It makes your integration code far easier to read, and it lets you repoint a name later without touching your code.

```bash
curl -s -X POST "https://apis.fotohub.app/v1/storage/s3/buckets/$BUCKET_ID/aliases" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"alias": "prod-media", "public_prefixes": []}'
```

Rules for aliases:

- The alias must be a single DNS label: 3 to 63 characters, lowercase letters, digits and hyphens, starting and ending with a letter or digit. No dots
- Reserved names such as `www`, `api`, `admin`, `s3`, `static`, `cdn` and `gateway` are refused with `400` and `"error": "alias_reserved"`
- `public_prefixes` is empty by default on purpose. Creating an alias publishes nothing. Making a prefix world readable is a separate, explicit `PATCH`
- Alias count is capped per bucket. On an account that pays purely from the prepaid balance the cap is one alias per bucket, which is all this guide needs. Exceeding it returns `402` with `"error": "alias_limit_reached"`
- List them with `GET`, change one with `PATCH`, remove one with `DELETE`, all on the same path plus `/{alias}`

From now on you can write `"bucket": "prod-media"` instead of the UUID.

Step 5: put your own files into the bucket

Two independent ways in. Use whichever fits your stack, they write to the same bucket.

Option A, presigned URLs. Nothing to store, no AWS SDK needed, works straight from a browser.

```bash
curl -s -X POST "https://apis.fotohub.app/v1/storage/s3/buckets/$BUCKET_ID/objects/presign-upload" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "uploads/photo.jpg", "content_type": "image/jpeg", "expires_in": 3600}'
```

```json
{
  "bucket_id": "8f2c1d90-4e77-4a63-9b1e-2f5a7c8d0e11",
  "key": "uploads/photo.jpg",
  "method": "PUT",
  "url": "https://fh-cust-8f2c1d90-prod.s3.eu-central-1.amazonaws.com/uploads/photo.jpg?X-Amz-...",
  "expires_in": 3600,
  "headers": {"Content-Type": "image/jpeg"}
}
```

Then PUT the bytes to that url, sending exactly the headers the response listed:

```bash
curl -X PUT "$PRESIGNED_URL" -H "Content-Type: image/jpeg" --data-binary @photo.jpg
```

`expires_in` accepts 60 seconds up to 7 days. Downloads work the same way through `objects/presign-download`.

Option B, the S3 credentials from step 3. Best for the AWS SDK, `aws s3 sync`, `rclone`, or any S3 compatible tool.

```python
import boto3

s3 = boto3.client(
    "s3",
    endpoint_url="https://s3point.fotohub.app",
    aws_access_key_id="fhk_live_QcW8x...",
    aws_secret_access_key="fhk_sec_9Za2v...",
    region_name="eu-central-1",
)

s3.upload_file("photo.jpg", "fh-cust-8f2c1d90-prod", "uploads/photo.jpg")
```

Use the `access_key_id`, `secret_access_key` and `bucket.aws_bucket_name` from the buy response. `s3point.fotohub.app` is a transparent SigV4 proxy in front of AWS S3, so anything that speaks S3 works against it. An unsigned request returns `AccessDenied` with a note that requests must be signed with SigV4, which is expected behaviour and not a misconfiguration.

If you lost the secret, or you rotate credentials on a schedule:

```bash
curl -s -X POST "https://apis.fotohub.app/v1/storage/s3/buckets/$BUCKET_ID/regenerate-keys" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"label": "ci-pipeline"}'
```

This is a rotation, not a required first step. It returns a new `access_key_id` and `secret_access_key` once, and revokes the previous pair. Anything still using the old keys stops working immediately, so roll it during a maintenance window. `GET .../credentials` lists your keys with the secrets masked, which is useful for auditing but never returns a usable secret.

For files above roughly 100 MB use multipart:

```
POST /v1/storage/s3/buckets/{bucket_id}/multipart/create        {"key": "...", "content_type": "..."}
POST /v1/storage/s3/buckets/{bucket_id}/multipart/presign-part  {"upload_id": "...", "key": "...", "part_number": 1}
POST /v1/storage/s3/buckets/{bucket_id}/multipart/complete      {"upload_id": "...", "key": "...", "parts": [{"part_number": 1, "etag": "..."}]}
POST /v1/storage/s3/buckets/{bucket_id}/multipart/abort         {"upload_id": "...", "key": "..."}
```

Part numbers run 1 to 10000. Collect each part's ETag from its PUT response and send them all to `complete`, in order. Always `abort` an upload you gave up on, otherwise the incomplete parts keep occupying billable storage.

Listing and deleting objects:

```bash
curl -s -X POST "https://apis.fotohub.app/v1/storage/s3/buckets/$BUCKET_ID/objects/list" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prefix": "uploads/", "max_keys": 100, "delimiter": "/"}'

curl -s -X POST "https://apis.fotohub.app/v1/storage/s3/buckets/$BUCKET_ID/objects/delete" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"keys": ["uploads/photo.jpg"]}'
```

The list response carries `objects` (each with `key`, `size`, `last_modified`, `etag`, `storage_class`), plus `common_prefixes`, `is_truncated` and `next_continuation_token`. Pass that token back as `continuation_token` to page through. Batch delete takes up to 1000 keys per call. There is also `objects/copy` for server side copies.

Step 6: configure the bucket

Four settings are available to an API key. All are optional, and all are readable with `GET` on the same path.

Block public access, recommended for anything private. Already on by default from step 3, so this is only needed if you want to change it:

```bash
curl -s -X PUT "https://apis.fotohub.app/v1/storage/s3/buckets/$BUCKET_ID/public-access-block" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"block_public_acls": true, "ignore_public_acls": true,
       "block_public_policy": true, "restrict_public_buckets": true}'
```

CORS, if a browser reads or writes objects directly:

```bash
curl -s -X PUT "https://apis.fotohub.app/v1/storage/s3/buckets/$BUCKET_ID/cors" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"rules": [{"id": "web",
                  "allowed_methods": ["GET", "HEAD", "PUT"],
                  "allowed_origins": ["https://yourapp.com"],
                  "allowed_headers": ["*"],
                  "expose_headers": ["ETag"],
                  "max_age_seconds": 3600}]}'
```

Versioning, so an overwrite does not lose the previous file:

```bash
curl -s -X PUT "https://apis.fotohub.app/v1/storage/s3/buckets/$BUCKET_ID/versioning" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" -d '{"status": "Enabled"}'
```

Accepted values are `Enabled` and `Suspended`. Old versions keep occupying billable storage, so pair versioning with a lifecycle rule.

Lifecycle, to expire or archive automatically and keep the storage bill flat:

```bash
curl -s -X PUT "https://apis.fotohub.app/v1/storage/s3/buckets/$BUCKET_ID/lifecycle" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"rules": [
        {"id": "expire-temp",
         "status": "Enabled",
         "filter": {"prefix": "tmp/"},
         "expiration": {"days": 7}},
        {"id": "archive-old-video",
         "status": "Enabled",
         "filter": {"prefix": "video/"},
         "transitions": [{"days": 30, "storage_class": "STANDARD_IA"},
                         {"days": 180, "storage_class": "GLACIER_IR"}],
         "abort_incomplete_multipart_upload": {"days_after_initiation": 3}}
      ]}'
```

Lifecycle is the most nested body in the API, so a few notes:

- The rule identifier is `id`, and the on/off field is `status`, which is `Enabled` or `Suspended`
- The prefix goes inside `filter`, and expiry inside `expiration: {"days": N}`, not as flat fields
- Each transition needs exactly one of `days` or `date`. Sending both, or neither, is a `422`
- Also available: `noncurrent_version_expiration: {"noncurrent_days": N}` to clean up old versions, and `abort_incomplete_multipart_upload` so an abandoned upload does not bill forever
- At least one rule is required, up to 200

Other reads and changes available to an API key: `GET .../buckets` to list them all, `GET .../buckets/{id}` for detail, `GET .../buckets/{id}/usage` for bytes and object counts, `GET .../buckets/{id}/metrics`, and `POST .../buckets/{id}/upgrade` to raise `quota_gb` or change the default storage class.

Advanced settings stay in the web console by design: bucket policy, replication, CDN, access points, object lock, encryption keys, ownership and ACL, and bucket deletion. Each of those can expose or destroy data, so they require a signed in session rather than an API key. If you need one of them automated, contact us.

Step 7: send generated media straight to your bucket

This is the part that ties storage and generation together. Add an `output` block to any generation request and the result is written into your bucket.

```json
"output": {
  "bucket": "prod-media",
  "prefix": "video/{YYYY}/{MM}/",
  "visibility": "private"
}
```

- `bucket` accepts either the bucket UUID or the alias from step 4
- `prefix` is a path template. Available tokens: `{YYYY}`, `{MM}`, `{DD}`, `{HH}`, `{mm}`, `{ss}`, `{date}`, `{model}`, `{job_id}`, `{user_id}`, `{name}`, `{index}`, `{ext}`
- Ending the prefix with a slash means "put the file in this folder and keep its own filename", which is the safest form
- If you write a full key instead, include something unique such as `{job_id}`, `{name}` or `{index}`. A template like `images/{date}/{model}.{ext}` renders identically for every image in a batch. We do de-duplicate by appending `-2`, `-3` and so on, but a unique template is clearer
- `visibility` is `private` or `public`
- If the bucket reference is wrong, is not yours, or the template is invalid, the generation still succeeds and the file lands in FOTOhub storage with a signed URL. Delivery never fails a generation you already paid for, so a typo in a path costs you nothing
- Tenant isolation is rechecked at delivery time under your own account, so a guessed UUID or alias belonging to another customer resolves to nothing rather than to their bucket

The response tells you where the file is going:

```json
"delivery": {
  "kind": "console_bucket",
  "routed_by": "request",
  "bucket": "fh-cust-8f2c1d90-prod",
  "region": "eu-central-1",
  "keys": ["video/2026/08/a1b2c3.mp4"],
  "status": "pending"
}
```

`status` is always `pending`, because the copy into your bucket runs detached so you are not kept waiting on it. `keys` is the real destination, computed by the same code that performs the copy, so you can start watching for that exact key straight away.

If you want a default destination applied to every request from a key, without repeating the `output` block, that is configured per key in the web console. A per request `output` always takes precedence over it.

Step 8: generate an image with Seedream 5.0

Images are synchronous. The response comes back with the finished image and the exact amount charged.

```bash
curl -s -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "prompt": "a plain grey ceramic mug on a white table, product photo, soft light",
        "model": "seedream-5-0-260128",
        "num_images": 1,
        "aspect_ratio": "1:1",
        "image_size": "2K",
        "output": {"bucket": "prod-media", "prefix": "images/{date}/"}
      }'
```

```json
{
  "model": "seedream-5-0-260128",
  "cost_usd": 0.0315,
  "currency": "USD",
  "billing": {"cost_usd": 0.0315, "balance_usd": 24.9685, "method": "wallet"},
  "images": [{"url": "https://..."}],
  "delivery": {"bucket": "fh-cust-...", "keys": ["images/2026-08-14/mug.png"], "status": "pending"}
}
```

Points worth knowing:

- The field is `num_images`, not `n`
- `image_size` accepts `1K`, `1.5K`, `2K`, `3K` and `4K`. It is also derived from `width` and `height` if you send those instead. Price scales with resolution, so an unsupported value is a `400` rather than a silent downgrade
- Seedream is billed on output tokens, so the exact cost varies a little with the image. `cost_usd` is the real amount taken from your balance, and `billing.balance_usd` is what remains
- `dola-seedream-5-0-pro-260628` is the higher tier of the same family
- If a generation fails, nothing is charged, and the response says so explicitly. You never have to guess whether you paid for a failure

Step 9: generate a video with Seedance 2.0 Mini

Videos are asynchronous and charged at submit time. You get a `202` with a job id, then you poll.

```bash
curl -s -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "prompt": "a plain grey ceramic mug rotating slowly on a white table",
        "model": "seedance-2-0-mini",
        "duration": 5,
        "resolution": "480p",
        "aspect_ratio": "16:9",
        "output": {"bucket": "prod-media", "prefix": "video/{YYYY}/{MM}/"}
      }'
```

```json
{
  "model": "seedance-2-0-mini",
  "job_id": "99000f82-5135-400d-82e6-45a6482b3865",
  "status": "polling",
  "cost_usd": 0.177233,
  "currency": "USD",
  "billing": {
    "cost_usd": 0.177233,
    "balance_usd": 24.822767,
    "method": "wallet",
    "breakdown": {"rate_usd_per_second": 0.035447, "currency": "USD"}
  },
  "duration": 5,
  "resolution": "480p",
  "poll_url": "https://apis.fotohub.app/v1/ai/generate/video/99000f82-5135-400d-82e6-45a6482b3865"
}
```

Then poll until the status is terminal:

```bash
curl -s "https://apis.fotohub.app/v1/ai/generate/video/$JOB_ID" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

Statuses are `queued`, `processing`, `polling`, then either `completed` or `failed`. On `completed` you get `video_url`, `thumbnail_url`, `completed_at` and, when you routed the output, the `delivery` block with the keys in your bucket.

Video is priced per second of output, so `billing.breakdown.rate_usd_per_second` times `duration` is the whole calculation. A 5 second 480p clip runs about `0.18` USD. That also means the price is the same whether the result is good or not, so keep test clips at the minimum duration.

One timing detail: `status: "completed"` means the video is rendered, not that the copy into your bucket has finished. The copy runs detached and typically lands within a minute. If you list objects immediately after `completed` you may not see the key yet, which is expected. Either poll your own bucket for the key from the `delivery` block, or use S3 event notifications.

Parameters and limits for `seedance-2-0-mini`:

- `duration`: 4 to 15 seconds
- `resolution`: `480p` or `720p`. `seedance-2-0-pro` additionally offers `1080p` and `4K`
- `aspect_ratio`: `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `21:9` or `adaptive`
- `image_url` for image to video, `last_frame_url` to pin the final frame
- `generate_audio` for a native soundtrack
- `reference_images` up to 9, `reference_videos` up to 3, `reference_audios` up to 3
- `asset_ids` for pre registered faces, see the next step
- `callback_url`, an https endpoint we POST once the job reaches a terminal state, with the same body as the poll response. Retried after 1, 2 and 4 seconds on a non 2xx response, then dropped
- `negative_prompt` and `seed` are recorded on the job

Two rate limits to design around:

- Video submits: 5 per minute per key. Beyond that you get `429`. Queue your work instead of firing everything at once
- Video polls: 60 per minute. Poll every 5 to 10 seconds, which stays well inside the budget

Price scales with duration, resolution and audio, so read `GET /v1/pricing` rather than assuming a flat per clip rate. An unsupported duration or resolution is a `400`, never a silent downgrade, precisely because price depends on it.

Step 10: register a face as a reusable asset

To keep the same person across many videos, register their photo once and reference it by id afterwards. This works with the Seedance 2.0 models.

First upload the photo, because registration only accepts a URL on a FOTOhub host:

```bash
curl -s -X POST https://apis.fotohub.app/v1/photos/upload \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: image/jpeg" \
  -H "X-Filename: face.jpg" \
  --data-binary @face.jpg
```

Send raw bytes as shown, or JSON with `{"file_base64": "...", "filename": "...", "mime_type": "..."}`. Do not use multipart form uploads from a public client, they are challenged at the edge before they reach us. The response is the photo record including a `url` field. The upload itself costs nothing, you only pay hourly for the bytes stored. A `402` here means your balance is empty. This endpoint allows 20 requests per minute.

Then register the returned url:

```bash
curl -s -X POST https://apis.fotohub.app/v1/ai/assets/register \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://s1.fotohub.app/storage/v1/object/...", "retention_hours": 720}'
```

```json
{
  "asset_id": "a1b2c3d4",
  "uri": "asset://a1b2c3d4",
  "status": "Active",
  "source_url": "https://s1.fotohub.app/...",
  "retention_hours": 720,
  "expires_at": "2026-09-13T10:00:00Z"
}
```

Details that matter:

- Registration is free
- `image_url` must be https and on one of `s1.fotohub.app`, `static.fotohub.app`, `fotohub.app` or `www.fotohub.app`. Third party URLs are refused with a `400` that names the allowed hosts. Upload first, then register
- `retention_hours` is optional, from 1 to 8760. When it elapses the asset is deleted both at the provider and on our side. Use it to bound how long biometric data is kept. Omit it to keep the face until you delete it yourself. Note that `0` is rejected rather than treated as "no retention"

List your assets:

```bash
curl -s "https://apis.fotohub.app/v1/ai/assets?limit=50&offset=0" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

```json
{
  "assets": [
    {
      "asset_id": "a1b2c3d4",
      "uri": "asset://a1b2c3d4",
      "source_url": "https://s1.fotohub.app/...",
      "asset_type": "Image",
      "status": "Active",
      "source": "public_api",
      "retention_hours": 720,
      "expires_at": "2026-09-13T10:00:00Z",
      "purged_at": null,
      "created_at": "2026-08-14T10:00:00Z"
    }
  ],
  "count": 1
}
```

This list is filtered by account on the server. It contains only the assets registered with your own key, and never anyone else's, in the same way your assets are never visible to another customer. Requesting an asset id that belongs to someone else returns `404`, deliberately indistinguishable from an id that never existed. `limit` accepts 1 to 200 and defaults to 50, `offset` pages through the rest, newest first.

Inspect one asset, or delete it:

```bash
curl -s "https://apis.fotohub.app/v1/ai/assets/a1b2c3d4" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY"

curl -s -X DELETE "https://apis.fotohub.app/v1/ai/assets/a1b2c3d4" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

Step 11: generate from a registered asset

Pass the ids in `asset_ids`. Both `asset://a1b2c3d4` and the bare `a1b2c3d4` are accepted.

```bash
curl -s -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "prompt": "the person smiles and waves at the camera",
        "model": "seedance-2-0-mini",
        "duration": 5,
        "resolution": "720p",
        "asset_ids": ["asset://a1b2c3d4"],
        "output": {"bucket": "prod-media", "prefix": "video/{YYYY}/{MM}/"}
      }'
```

If any id in the list was not registered by your account, the whole request is refused with `403` before anything is charged. `asset_ids` is supported on the Seedance 2.0 family only.

Complete working example

This script runs the full flow: buy a bucket, alias it, set a lifecycle rule, generate an image and a video into it, then list what landed there.

```python
"""FOTOhub end to end: storage, generation, delivery. Python 3.9+, needs httpx."""
import os
import time

import httpx

BASE = "https://apis.fotohub.app"
KEY = os.environ["FOTOHUB_API_KEY"]
H = {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
ALIAS = "prod-media"


def check(r):
    """Turn the funding and quota errors into something actionable."""
    if r.status_code == 402:
        d = r.json().get("detail", {})
        raise SystemExit(
            f"Insufficient funds: need ${d.get('required_usd')}, "
            f"have ${d.get('balance_usd')}, short ${d.get('shortfall_usd')}. "
            f"Nothing was charged. Top up: {d.get('topup_url')}"
        )
    if r.status_code == 403 and "api_access" in r.text:
        raise SystemExit("Balance is exactly $0.00, which disables API access. Top up first.")
    if r.status_code == 403 and "plan_gate" in r.text:
        raise SystemExit("Bucket count limit reached. This is not a funding problem.")
    r.raise_for_status()
    return r.json()


def balance(c):
    return check(c.get(f"{BASE}/v1/billing/balance", headers=H))["wallet"]["balance_usd"]


# 180s, because provisioning a bucket is a saga and can take 30 to 60 seconds.
with httpx.Client(timeout=180) as c:
    print(f"balance at start: ${balance(c)}")

    # 1. Reuse a bucket if we already have one, otherwise buy.
    buckets = check(c.get(f"{BASE}/v1/storage/s3/buckets", headers=H))
    if buckets:
        bucket_id = buckets[0]["id"]
        print(f"reusing bucket {bucket_id} ({buckets[0]['aws_bucket_name']})")
    else:
        est = check(c.post(f"{BASE}/v1/storage/s3/estimate", headers=H, json={
            "region": "eu-central-1",
            "storage_class": "STANDARD",
            "storage_gb": 10,
            "period_days": 30,
        }))
        print(f"10 GB for 30 days: ${est['total_usd']}")

        bought = check(c.post(f"{BASE}/v1/storage/s3/buy", headers=H, json={
            "display_name": "production-media",
            "region": "eu-central-1",
            "quota_gb": 10,
            "default_storage_class": "STANDARD",
            "block_public_access": True,
            "billing_mode": "wallet",
        }))
        # The id is nested under "bucket", and the S3 keys come back right here.
        bucket_id = bought["bucket"]["id"]
        print(f"bought {bucket_id} ({bought['bucket']['aws_bucket_name']})")
        print(f"  endpoint:   {bought['endpoint']}")
        print(f"  access key: {bought['access_key_id']}")
        print(f"  secret:     {bought['secret_access_key']}   <-- SAVE THIS NOW")

        # 2. Alias, so output routing below reads as a name instead of a UUID.
        c.post(f"{BASE}/v1/storage/s3/buckets/{bucket_id}/aliases",
               headers=H, json={"alias": ALIAS, "public_prefixes": []})

        # 3. Expire scratch files so they stop billing after a week. Note the
        #    nesting: prefix goes in `filter`, expiry in `expiration`.
        check(c.put(f"{BASE}/v1/storage/s3/buckets/{bucket_id}/lifecycle", headers=H, json={
            "rules": [{"id": "expire-tmp",
                       "status": "Enabled",
                       "filter": {"prefix": "tmp/"},
                       "expiration": {"days": 7},
                       "abort_incomplete_multipart_upload": {"days_after_initiation": 3}}]
        }))

    # 4. Image: synchronous, charged on the response.
    img = check(c.post(f"{BASE}/v1/ai/generate/image", headers=H, json={
        "prompt": "a plain grey ceramic mug on a white table, product photo",
        "model": "seedream-5-0-260128",
        "num_images": 1,
        "image_size": "2K",
        # Trailing slash keeps the generated filename, which is already unique.
        "output": {"bucket": ALIAS, "prefix": "images/{date}/"},
    }))
    print(f"image charged ${img['cost_usd']}, "
          f"delivering to {img.get('delivery', {}).get('keys')}")

    # 5. Video: asynchronous, charged at submit.
    job = check(c.post(f"{BASE}/v1/ai/generate/video", headers=H, json={
        "prompt": "a plain grey ceramic mug rotating slowly on a white table",
        "model": "seedance-2-0-mini",
        "duration": 5,
        "resolution": "480p",
        "aspect_ratio": "16:9",
        "output": {"bucket": ALIAS, "prefix": "video/{YYYY}/{MM}/"},
    }))
    job_id = job["job_id"]
    print(f"video {job_id} charged ${job['cost_usd']} up front, "
          f"eta ~{job.get('estimated_seconds')}s")

    # 6. Poll. Never faster than every 5s: polls are capped at 60 per minute.
    state = {}
    for _ in range(75):
        time.sleep(8)
        state = check(c.get(f"{BASE}/v1/ai/generate/video/{job_id}", headers=H))
        if state["status"] in ("completed", "failed"):
            break
        print(f"  {state['status']} {state.get('progress', 0)}%")

    if state.get("status") == "completed":
        print(f"video ready: {state.get('video_url')}")
        want = (state.get("delivery") or {}).get("keys") or []
        # "completed" means rendered, not delivered. The copy is detached, so
        # wait for the key rather than assuming it is already there.
        for _ in range(12):
            listing = check(c.post(
                f"{BASE}/v1/storage/s3/buckets/{bucket_id}/objects/list",
                headers=H, json={"prefix": "video/", "max_keys": 200, "delimiter": ""}))
            have = {o["key"] for o in listing["objects"]}
            if all(k in have for k in want):
                print(f"delivered to your bucket: {want}")
                break
            time.sleep(10)
        else:
            print(f"still copying, expected keys: {want}")
    else:
        # A failed job is refunded automatically, and the response states it.
        print(f"video failed: {state.get('error')}, refunded: {state.get('refunded')}")

    print(f"balance at end: ${balance(c)}")

    # 7. What actually landed in the bucket.
    objs = check(c.post(f"{BASE}/v1/storage/s3/buckets/{bucket_id}/objects/list",
                        headers=H, json={"prefix": "", "max_keys": 50, "delimiter": ""}))
    for o in objs["objects"]:
        print(f"  {o['key']}  {o['size']} bytes  {o['storage_class']}")
```

Error handling you should implement

Handle these five cases and your integration behaves correctly under all normal conditions.

- `402 insufficient_funds`: you hold some money but not enough for this request. Read `shortfall_usd`, top up, retry. Nothing was charged, and the payload includes `"charged": false` to say so plainly
- `403 api_access_required`: your balance is exactly zero, which disables API access. Top up. Check for this as well as `402` when detecting a funding problem
- `403 plan_gate_exceeded`: you reached your bucket count limit. Not a money problem, and topping up will not raise it
- `429`: you exceeded a rate limit. Video submits allow 5 per minute, video polls 60 per minute, uploads 20 per minute, most other endpoints 60 per minute. Back off and retry
- `400`: an invalid parameter, for example an unsupported resolution for the chosen model. The message names the accepted values. We reject rather than substitute, because price depends on these values

Also worth knowing: `404` on a bucket or asset id means "not found or not yours", and the two cases are deliberately indistinguishable. `410` on a bucket means it is being decommissioned, in which case reads and downloads still work during the grace period but writes do not.

What you are charged for, and what you are not

- Images and videos: charged per generation, at the moment of the request. The exact figure is `cost_usd` on the response, and `billing.balance_usd` shows what remains
- Storage: charged hourly on the bytes you actually store, plus real request counts, plus tiered egress, plus a small fixed fee per bucket. Old object versions and abandoned multipart parts count as stored bytes
- Free: uploads, asset registration, listing, polling, balance checks, presigning, bucket configuration, and raising a quota
- Failed generations: not charged. If the failure happens after a charge, the refund is automatic and the response reports `refunded: true`

Your balance can never go negative on a generation. That is enforced in the database rather than only in application code, so a burst of concurrent requests cannot overdraw the account. When several requests race for the last dollar, exactly one succeeds and the rest get a clean `402`. We verified this on production: five parallel video submits against a balance funded for exactly one clip produced one `202` and four `402`s, ending at `0.00` with no double spend.

Storage works differently, because the bytes are already on disk by the time the hourly job runs and there is nothing to refuse. If your balance cannot cover an hour of storage, the wallet stops at `0.00` and the remainder is recorded as arrears against the bucket. You then have a 72 hour grace window to top up. Reads and downloads keep working throughout. If the arrears are still unpaid when the window closes, the bucket is suspended, so keep enough balance to cover your storage if you are relying on it in production. Topping up clears the arrears on the next hourly run.

Where to look next

- Full API reference: `https://docs.fotohub.app`
- Model catalogue: `GET /v1/models`, filter with `?category=image` or `?category=video`
- Current prices: `GET /v1/pricing`
- Your usage history: `GET /v1/usage`
- Balance and month to date spend: `GET /v1/billing/balance`
- Official SDKs: `pip install fotohub`, `npm install fotohub`
- Delivery to Your Bucket: `https://docs.fotohub.app/guides/bucket-delivery` covers destinations, per key routing rules and path templates in more depth
