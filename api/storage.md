# S3 Cloud Storage

FOTOhub provides three tiers of object storage — from simple managed buckets to enterprise-grade AWS S3 with CDN, replication, lifecycle policies, and more.

**Base URL:** `https://apis.fotohub.app`

**Authentication:** Bearer JWT token in the `Authorization` header.

---

## Storage Tiers

| Tier | Prefix | Backend | Best For |
|------|--------|---------|----------|
| Simple Buckets | `/v1/buckets` | Supabase Storage | Quick file storage, small projects |
| S3 Enterprise | `/v1/storage/s3/*` (e.g. `/v1/storage/s3/buckets`) | Real AWS S3 | Production apps, large-scale storage |
| Rental Packages | `/v1/storage` | Managed S3 | Teams, shared workspaces |

---

## Simple Buckets

Lightweight bucket management backed by Supabase Storage. Auth via API key.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/buckets` | List buckets |
| POST | `/v1/buckets` | Create bucket |
| GET | `/v1/buckets/:id` | Get bucket |
| PATCH | `/v1/buckets/:id` | Update bucket |
| DELETE | `/v1/buckets/:id` | Delete bucket + files |

### Create Bucket

```
POST /v1/buckets
```

```json
{
  "name": "my-project-assets",
  "is_public": false,
  "max_file_size_mb": 100,
  "allowed_mime_types": ["image/png", "image/jpeg", "video/mp4"]
}
```

**Response:**
```json
{
  "id": "bucket_abc123",
  "name": "my-project-assets",
  "path_prefix": "user_123/my-project-assets",
  "is_active": true,
  "is_public": false,
  "region": "eu",
  "max_file_size_mb": 100,
  "allowed_mime_types": ["image/png", "image/jpeg", "video/mp4"],
  "created_at": "2026-07-18T12:00:00Z"
}
```

::: tip
Bucket names are sanitized to `[a-zA-Z0-9_-]` and limited to 50 characters.
:::

::: warning Simple Buckets are EU-only
`region` is accepted on create, but `"eu"` is the only value FOTOhub-managed
storage accepts — it defaults to `"eu"` when omitted, and anything else is a
`400`. These buckets physically live in `eu-central-1`; there is no managed
option in another region.

For output that must land somewhere else, do not use `region` — create an
[output destination](/guides/bucket-delivery) pointing at your own bucket in
that region instead, and route a key's generations there.

`region` cannot be changed after creation (`PATCH /v1/buckets/:id` rejects it
with a `400`): it records where the bytes already live, and relabelling it
would not move a single one. `GET /v1/buckets` and `GET /v1/buckets/:id`
both echo the stored value.
:::

### What storage costs

Simple Buckets are billed **hourly from your prepaid wallet**, in USD, for the
bytes you are holding at the time — not per upload and not per request. Uploading
a file costs nothing; keeping it costs the per-GB-hour rate for as long as it is
there, and deleting it stops the accrual on the next hourly run.

The rate is published under `storage` in
[`GET /v1/pricing`](/api/billing) and is 1:1 with the AWS S3 list price
for `eu-central-1`. Read it from the API rather than hardcoding it.

```json
{
  "storage": {
    "standard": {
      "price_per_gb_monthly": "0.024500",
      "price_per_gb_hourly": "0.00003356",
      "currency": "USD",
      "source": "AWS S3 Standard eu-central-1 list price"
    }
  }
}
```

::: warning An empty wallet cannot accept uploads
`POST /v1/photos/upload` returns `402 insufficient_funds` when your wallet
balance is `$0.00`, because storage bills every hour for as long as the bytes
are held. Any positive balance is enough to upload — there is no per-request
price to cover.

```json
{
  "detail": {
    "error": "insufficient_funds",
    "message": "Insufficient funds: your wallet balance is $0.00. Storage is billed from the wallet every hour for the bytes you hold, so an empty wallet cannot accept new uploads. Top up your wallet to continue.",
    "balance_usd": 0,
    "billed": "hourly_storage",
    "charged": false,
    "topup_url": "https://fotohub.app/console/wallet"
  }
}
```

Unlike the per-request `402` from a generation endpoint, this one carries no
`required_usd` or `shortfall_usd`: there is no single amount to quote. Branch on
`error === "insufficient_funds"`, not on those fields.
:::

::: tip Uploads without a bucket land in `api-uploads`
`POST /v1/photos/upload` accepts an upload with no `bucket_name`. Those files are
filed into an `api-uploads` bucket created automatically on your account the first
time you need it, so their storage is metered like everything else.

It is an ordinary bucket: it appears in `GET /v1/buckets`, its files list under
`GET /v1/photos?bucket_name=api-uploads`, and `DELETE /v1/buckets/:id` removes it
and its contents. It is created **private**, so those uploads come back as signed
URLs unless you pass `is_public=true`.
:::

---

## S3 Enterprise

Full AWS S3 with 70+ API endpoints covering every S3 feature. Auth via JWT.

**Base prefix:** `https://apis.fotohub.app/v1/storage/s3`

### Plan Limits

| Plan | Max S3 Buckets |
|------|---------------|
| Free | 1 |
| Developer / Starter | 5 |
| Startup / Medium | 10 |
| Pro / Business | 25 |
| Enterprise | 1000 |

### Storage Classes and Pricing

| Class | USD/GB/month | Best For |
|-------|-------------|----------|
| `STANDARD` | $0.0245 | Frequently accessed data |
| `STANDARD_IA` | $0.0135 | Infrequent access (30-day minimum) |
| `ONEZONE_IA` | $0.0108 | Non-critical infrequent access |
| `INTELLIGENT_TIERING` | $0.0245 | Unknown access patterns |
| `GLACIER_IR` | $0.005 | Archive with instant retrieval |
| `GLACIER` | $0.0045 | Long-term archive (minutes retrieval) |
| `DEEP_ARCHIVE` | $0.00205 | Compliance archives (hours retrieval) |

### Billing Modes

| Mode | Description |
|------|-------------|
| `wallet` | Deducted from your FOTOhub USD wallet. A reservation deposit of approximately 1.5 days of full-quota storage cost is held at creation (minimum **$0.15**). Hourly reconciliation via billing engine. |
| `invoice_monthly` | Billed monthly on your invoice. Available for Pro and Enterprise plans. |

::: warning
Wallet mode requires sufficient balance for the reservation deposit. If your wallet balance is too low, bucket creation will fail.
:::

---

### Bucket CRUD

#### Provision a Bucket

```
POST /v1/storage/s3/buy
```

Creates a real AWS S3 bucket with IAM credentials. Requires wallet balance for the reservation deposit.

**Request:**
```json
{
  "display_name": "production-media",
  "description": "Media assets for production app",
  "region": "eu-central-1",
  "default_storage_class": "STANDARD",
  "quota_gb": 100,
  "versioning_enabled": true,
  "encryption_type": "SSE-S3",
  "encryption_kms_key_id": null,
  "block_public_access": true,
  "mfa_delete_enabled": false,
  "billing_mode": "wallet",
  "tags": { "env": "production", "team": "media" }
}
```

**Request Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `display_name` | string | Yes | — | Bucket display name (1-100 chars) |
| `description` | string | No | `null` | Optional description |
| `region` | string | No | `eu-central-1` | AWS region (see Available Regions) |
| `default_storage_class` | string | No | `STANDARD` | Default storage class for objects |
| `quota_gb` | integer | No | `null` | Storage quota (1 - 1,048,576 GB) |
| `versioning_enabled` | boolean | No | `false` | Enable object versioning |
| `encryption_type` | string | No | `SSE-S3` | `SSE-S3` or `aws:kms` |
| `encryption_kms_key_id` | string | No | `null` | Custom KMS key ARN (required if `aws:kms`) |
| `block_public_access` | boolean | No | `true` | Block all public access |
| `mfa_delete_enabled` | boolean | No | `false` | Require MFA for deletes |
| `billing_mode` | string | No | `wallet` | `wallet` or `invoice_monthly` |
| `tags` | object | No | `null` | Key-value tags (max 50 tags) |

**Response:**
```json
{
  "bucket": {
    "id": "s3_bucket_xyz",
    "aws_bucket_name": "fotohub-customer-abc123-production-media",
    "region": "eu-central-1",
    "status": "active"
  },
  "access_key_id": "fhk_live_...",
  "secret_access_key": "...",
  "endpoint": "https://s3point.fotohub.app",
  "region": "eu-central-1",
  "s3_uri": "s3://fotohub-customer-abc123-production-media/",
  "example_aws_cli": "aws s3 ls s3://... --endpoint-url https://s3point.fotohub.app",
  "example_boto3": "boto3.client('s3', endpoint_url='https://s3point.fotohub.app', ...)",
  "warning": "Save your secret_access_key now — it will NEVER be shown again."
}
```

::: warning Credentials are virtual and endpoint is ours
The keys returned are FOTOhub virtual keys (`fhk_live_*`) against
`https://s3point.fotohub.app`, not raw AWS IAM keys against an AWS endpoint —
raw AWS credentials never leave the server. The wallet reservation is charged
before provisioning but is **not** echoed in this response; read it from
`GET /v1/billing/transactions` (`s3_bucket_reservation`).
:::

#### List Buckets

```
GET /v1/storage/s3/buckets
```

Returns all S3 buckets owned by the authenticated user.

**Response:**
```json
{
  "buckets": [
    {
      "id": "s3_bucket_xyz",
      "display_name": "production-media",
      "region": "eu-central-1",
      "status": "active",
      "storage_class": "STANDARD",
      "quota_gb": 100,
      "used_bytes": 5368709120,
      "created_at": "2026-07-01T10:00:00Z"
    }
  ]
}
```

#### Get Bucket Details

```
GET /v1/storage/s3/buckets/{bucket_id}
```

Returns full details for a single bucket including configuration and usage.

#### Upgrade Bucket

```
POST /v1/storage/s3/buckets/{bucket_id}/upgrade
```

Increase quota or change storage class on an existing bucket.

**Request:**
```json
{
  "quota_gb": 500,
  "default_storage_class": "INTELLIGENT_TIERING"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `quota_gb` | integer | New quota (must be larger than current) |
| `default_storage_class` | string | New default storage class |

#### Delete Bucket

```
DELETE /v1/storage/s3/buckets/{bucket_id}
```

Cancels and deletes the bucket. Bucket must be empty (no objects). Returns remaining wallet reservation credit.

::: warning
This action is irreversible. All credentials associated with the bucket are immediately revoked.
:::

---

### Credentials

#### List Access Keys

```
GET /v1/storage/s3/buckets/{bucket_id}/credentials
```

Returns all active access key pairs for the bucket.

**Response:**
```json
{
  "credentials": [
    {
      "access_key_id": "AKIA...",
      "label": "api-server-v1",
      "created_at": "2026-07-01T10:00:00Z",
      "last_used": "2026-07-18T09:30:00Z",
      "status": "active"
    }
  ]
}
```

#### Rotate Keys

```
POST /v1/storage/s3/buckets/{bucket_id}/regenerate-keys
```

Generate new credentials with optional grace period for the old ones.

**Request:**
```json
{
  "label": "api-server-v2",
  "revoke_old_immediately": false,
  "grace_period_days": 7
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | string | No | Human-readable label for the new key |
| `revoke_old_immediately` | boolean | `false` | If `true`, old key is disabled immediately |
| `grace_period_days` | integer | `7` | Days before old key expires (0-30) |

**Response:**
```json
{
  "new_credentials": {
    "access_key_id": "AKIA...",
    "secret_access_key": "wJalr...",
    "label": "api-server-v2"
  },
  "old_key_expires_at": "2026-07-25T10:00:00Z"
}
```

::: tip
Use a grace period to rotate keys without downtime. Deploy new credentials to your services, then let the old key expire naturally.
:::

---

### Usage and Metrics

#### Current Usage

```
GET /v1/storage/s3/buckets/{bucket_id}/usage
```

Returns current storage usage statistics.

**Response:**
```json
{
  "bucket_id": "s3_bucket_xyz",
  "total_objects": 15420,
  "total_bytes": 53687091200,
  "total_gb": 50.0,
  "quota_gb": 100,
  "usage_percent": 50.0,
  "by_storage_class": {
    "STANDARD": { "objects": 12000, "bytes": 42949672960 },
    "GLACIER": { "objects": 3420, "bytes": 10737418240 }
  },
  "last_updated": "2026-07-18T12:00:00Z"
}
```

#### CloudWatch Metrics

```
GET /v1/storage/s3/buckets/{bucket_id}/metrics
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `metric` | string | `BucketSizeBytes` | Metric name |
| `start` | string | 7 days ago | ISO 8601 start time |
| `end` | string | now | ISO 8601 end time |
| `period` | integer | `86400` | Aggregation period in seconds |

Available metrics: `BucketSizeBytes`, `NumberOfObjects`, `AllRequests`, `GetRequests`, `PutRequests`, `4xxErrors`, `5xxErrors`, `BytesDownloaded`, `BytesUploaded`.

#### Get Pricing

```
GET /v1/storage/s3/pricing
```

Returns the full pricing table for all storage classes and request types.

#### Cost Estimator

```
POST /v1/storage/s3/estimate
```

Estimate monthly costs before provisioning.

**Request:**
```json
{
  "region": "eu-central-1",
  "storage_class": "STANDARD",
  "storage_gb": 500,
  "put_requests": 100000,
  "get_requests": 1000000,
  "egress_gb": 50,
  "retrieval_gb": 0,
  "period_days": 30
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `region` | string | No | AWS region |
| `storage_class` | string | Yes | Storage class to estimate |
| `storage_gb` | number | Yes | Storage amount in GB |
| `put_requests` | integer | No | Number of PUT/POST requests |
| `get_requests` | integer | No | Number of GET requests |
| `egress_gb` | number | No | Data transfer out in GB |
| `retrieval_gb` | number | No | Data retrieval in GB (Glacier classes) |
| `period_days` | integer | No | Estimation period (1-366, default 30) |

**Response:**
```json
{
  "region": "eu-central-1",
  "storage_class": "STANDARD",
  "period_days": 30,
  "usd_pln_rate": 3.732,
  "line_items": [
    {
      "label": "Storage (STANDARD)",
      "quantity": 500,
      "unit": "GB-month",
      "unit_price_usd": 0.0245,
      "unit_price_pln": 0.0914,
      "amount_usd": 12.25,
      "amount_pln": 45.72
    },
    {
      "label": "Egress (tiered)",
      "quantity": 50,
      "unit": "GB",
      "unit_price_usd": 0.09,
      "unit_price_pln": 0.3359,
      "amount_usd": 4.50,
      "amount_pln": 16.79
    }
  ],
  "subtotal_usd": 17.70,
  "subtotal_pln": 66.04,
  "flat_fee_pln": 2.00,
  "total_usd": 17.70,
  "total_pln": 68.04
}
```

::: info Why this response has both currencies
AWS quotes storage in USD, so `*_usd` are the authoritative numbers and
`*_pln` are a convenience conversion at `usd_pln_rate` (live NBP mid). The
platform's flat per-bucket fee is PLN-denominated, which is why `flat_fee_pln`
has no USD twin and `total_usd` equals `subtotal_usd` (it excludes that fee).
There is no `storage_usd` / `requests_usd` / `egress_usd` top-level field —
per-component amounts live in `line_items[]`.
:::

#### List Regions

```
GET /v1/storage/s3/regions
```

Regions open for bucket creation, in the order the console offers them (EU
first). This is the authoritative list: a region absent from it, or present with
`"available": false`, will be rejected by `POST /v1/storage/s3/buckets`.

**Response:**
```json
[
  {
    "region": "eu-central-1",
    "available": true,
    "display_name": "Frankfurt",
    "city": "Frankfurt",
    "country_code": "DE",
    "continent": "Europe",
    "gdpr_compliant": true
  },
  {
    "region": "us-west-2",
    "available": true,
    "display_name": "Oregon",
    "city": "Boardman",
    "country_code": "US",
    "continent": "North America",
    "gdpr_compliant": false
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `region` | string | AWS region code — pass this as `region` when creating a bucket |
| `available` | boolean | `false` means temporarily closed to new buckets |
| `continent` | string | `Europe`, `North America`, `Asia Pacific`, `South America` |
| `gdpr_compliant` | boolean | `true` only for EEA regions (see [Available Regions](#available-regions)) |

---

### Object Operations

#### List Objects

```
POST /v1/storage/s3/buckets/{bucket_id}/objects/list
```

**Request:**
```json
{
  "prefix": "uploads/2026/07/",
  "delimiter": "/",
  "max_keys": 100,
  "continuation_token": null
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `prefix` | string | `""` | Filter by key prefix |
| `continuation_token` | string | `null` | Pagination token from previous response |
| `max_keys` | integer | `1000` | Results per page (1-1000) |
| `delimiter` | string | `null` | Delimiter for hierarchy (typically `/`) |

**Response:**
```json
{
  "objects": [
    {
      "key": "uploads/2026/07/photo-001.jpg",
      "size": 2048576,
      "last_modified": "2026-07-18T12:00:00Z",
      "storage_class": "STANDARD",
      "etag": "\"d41d8cd98f00b204e9800998ecf8427e\""
    }
  ],
  "common_prefixes": ["uploads/2026/07/thumbnails/"],
  "is_truncated": false,
  "continuation_token": null
}
```

#### Presigned Upload

Generate a presigned URL for direct-to-S3 upload (bypasses the API server):

```
POST /v1/storage/s3/buckets/{bucket_id}/objects/presign-upload
```

**Request:**
```json
{
  "key": "media/video-001.mp4",
  "content_type": "video/mp4",
  "content_length": 104857600,
  "expires_in": 3600,
  "storage_class": "STANDARD",
  "metadata": { "uploaded_by": "api", "project": "xyz" }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | Yes | Object key (path) |
| `content_type` | string | No | MIME type |
| `content_length` | integer | No | Expected file size in bytes |
| `expires_in` | integer | No | URL expiry in seconds (60-604,800) |
| `storage_class` | string | No | Target storage class |
| `metadata` | object | No | Custom metadata key-value pairs |

**Response:**
```json
{
  "upload_url": "https://s3.eu-central-1.amazonaws.com/fotohub-customer-abc123/media/video-001.mp4?X-Amz-...",
  "expires_at": "2026-07-18T13:00:00Z",
  "headers": {
    "Content-Type": "video/mp4",
    "x-amz-meta-uploaded_by": "api",
    "x-amz-meta-project": "xyz"
  }
}
```

::: tip
Use presigned URLs to upload large files directly to S3 without routing through the API server. This reduces latency and avoids request size limits.
:::

#### Presigned Download

```
POST /v1/storage/s3/buckets/{bucket_id}/objects/presign-download
```

**Request:**
```json
{
  "key": "media/video-001.mp4",
  "version_id": null,
  "expires_in": 3600,
  "response_content_disposition": "attachment; filename=\"video.mp4\""
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | Yes | Object key |
| `version_id` | string | No | Specific version (if versioning enabled) |
| `expires_in` | integer | No | URL expiry in seconds (60-604,800) |
| `response_content_disposition` | string | No | Override Content-Disposition header |

**Response:**
```json
{
  "url": "https://s3.eu-central-1.amazonaws.com/...",
  "expires_at": "2026-07-18T13:00:00Z"
}
```

#### Batch Delete

```
POST /v1/storage/s3/buckets/{bucket_id}/objects/delete
```

**Request:**
```json
{
  "keys": ["tmp/file1.txt", "tmp/file2.txt", "tmp/file3.txt"],
  "version_ids": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `keys` | string[] | Yes | Object keys to delete (max 1000) |
| `version_ids` | string[] | No | Corresponding version IDs (same length as keys) |

**Response:**
```json
{
  "deleted": ["tmp/file1.txt", "tmp/file2.txt", "tmp/file3.txt"],
  "errors": []
}
```

#### Copy Object

```
POST /v1/storage/s3/buckets/{bucket_id}/objects/copy
```

**Request:**
```json
{
  "source_key": "uploads/original.jpg",
  "dest_key": "processed/thumbnail.jpg",
  "metadata_directive": "COPY"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source_key` | string | Yes | Source object key |
| `dest_key` | string | Yes | Destination object key |
| `metadata_directive` | string | No | `COPY` (keep metadata) or `REPLACE` (use new metadata) |

---

### Multipart Upload

For files larger than 100 MB, use multipart upload for reliability and resumability. Each part can be 5 MB to 5 GB.

#### Flow

1. **Create** - get an `upload_id`
2. **Presign parts** - upload each chunk directly to S3
3. **Complete** - assemble all parts into the final object
4. (Optional) **Abort** - cancel an incomplete upload

#### Initiate Multipart Upload

```
POST /v1/storage/s3/buckets/{bucket_id}/multipart/create
```

**Request:**
```json
{
  "key": "large-video.mp4",
  "content_type": "video/mp4",
  "storage_class": "STANDARD",
  "metadata": { "duration": "3600" }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | Yes | Object key |
| `content_type` | string | No | MIME type |
| `storage_class` | string | No | Target storage class |
| `metadata` | object | No | Custom metadata |

**Response:**
```json
{
  "upload_id": "abc123xyz",
  "key": "large-video.mp4",
  "bucket_id": "s3_bucket_xyz"
}
```

#### Presign Part

```
POST /v1/storage/s3/buckets/{bucket_id}/multipart/presign-part
```

**Request:**
```json
{
  "upload_id": "abc123xyz",
  "key": "large-video.mp4",
  "part_number": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `upload_id` | string | Yes | Upload ID from create step |
| `key` | string | Yes | Object key |
| `part_number` | integer | Yes | Part number (1-10,000) |

**Response:**
```json
{
  "url": "https://s3.eu-central-1.amazonaws.com/...?partNumber=1&uploadId=abc123xyz&X-Amz-...",
  "part_number": 1,
  "expires_at": "2026-07-18T13:00:00Z"
}
```

#### Complete Multipart Upload

```
POST /v1/storage/s3/buckets/{bucket_id}/multipart/complete
```

**Request:**
```json
{
  "upload_id": "abc123xyz",
  "key": "large-video.mp4",
  "parts": [
    { "part_number": 1, "etag": "\"a54357aff0632cce46d942af68356b38\"" },
    { "part_number": 2, "etag": "\"0dc9c85be847e1f3f788d65e49cdd67b\"" }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `upload_id` | string | Yes | Upload ID |
| `key` | string | Yes | Object key |
| `parts` | array | Yes | List of parts with `part_number` and `etag` (max 10,000) |

#### Abort Multipart Upload

```
POST /v1/storage/s3/buckets/{bucket_id}/multipart/abort
```

**Request:**
```json
{
  "upload_id": "abc123xyz",
  "key": "large-video.mp4"
}
```

Aborts an in-progress multipart upload and frees any uploaded parts.

---

### Permissions

#### Bucket Policy

```
GET    /v1/storage/s3/buckets/{bucket_id}/policy
PUT    /v1/storage/s3/buckets/{bucket_id}/policy
DELETE /v1/storage/s3/buckets/{bucket_id}/policy
```

**PUT Request:**
```json
{
  "policy_json": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "AllowPublicRead",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::bucket-name/*"
      }
    ]
  }
}
```

#### Validate Policy

```
POST /v1/storage/s3/buckets/{bucket_id}/policy/validate
```

Validates a policy document before applying it. Returns validation errors if the policy is malformed or contains unsupported actions.

**Request:**
```json
{
  "policy_json": { ... }
}
```

**Response:**
```json
{
  "valid": true,
  "warnings": []
}
```

#### CORS Configuration

```
GET    /v1/storage/s3/buckets/{bucket_id}/cors
PUT    /v1/storage/s3/buckets/{bucket_id}/cors
DELETE /v1/storage/s3/buckets/{bucket_id}/cors
```

**PUT Request:**
```json
{
  "rules": [
    {
      "allowed_methods": ["GET", "PUT", "POST"],
      "allowed_origins": ["https://myapp.com", "https://staging.myapp.com"],
      "allowed_headers": ["*"],
      "expose_headers": ["ETag", "x-amz-meta-custom-header"],
      "max_age_seconds": 3600
    }
  ]
}
```

#### Public Access Block

```
GET /v1/storage/s3/buckets/{bucket_id}/public-access-block
PUT /v1/storage/s3/buckets/{bucket_id}/public-access-block
```

**PUT Request:**
```json
{
  "block_public_acls": true,
  "ignore_public_acls": true,
  "block_public_policy": true,
  "restrict_public_buckets": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `block_public_acls` | boolean | Block public ACLs on objects |
| `ignore_public_acls` | boolean | Ignore existing public ACLs |
| `block_public_policy` | boolean | Block public bucket policies |
| `restrict_public_buckets` | boolean | Restrict cross-account access |

#### Object Ownership

```
GET /v1/storage/s3/buckets/{bucket_id}/ownership
PUT /v1/storage/s3/buckets/{bucket_id}/ownership
```

**PUT Request:**
```json
{
  "ownership": "BucketOwnerEnforced"
}
```

Values: `BucketOwnerEnforced` | `BucketOwnerPreferred` | `ObjectWriter`

#### ACL (Read-Only)

```
GET /v1/storage/s3/buckets/{bucket_id}/acl
```

Returns the current access control list. ACLs are read-only; use bucket policies for access control.

---

### Security

#### Versioning

```
GET /v1/storage/s3/buckets/{bucket_id}/versioning
PUT /v1/storage/s3/buckets/{bucket_id}/versioning
```

**PUT Request:**
```json
{
  "status": "Enabled",
  "mfa_delete": "Disabled"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `Enabled` or `Suspended` |
| `mfa_delete` | string | `Enabled` or `Disabled` |

#### List Object Versions

```
GET /v1/storage/s3/buckets/{bucket_id}/versions
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prefix` | string | `""` | Filter by key prefix |
| `max_keys` | integer | `1000` | Results per page (1-1000) |
| `key_marker` | string | `null` | Pagination: start after this key |
| `version_id_marker` | string | `null` | Pagination: start after this version |

**Response:**
```json
{
  "versions": [
    {
      "key": "document.pdf",
      "version_id": "v1_abc123",
      "is_latest": true,
      "size": 1048576,
      "last_modified": "2026-07-18T12:00:00Z"
    },
    {
      "key": "document.pdf",
      "version_id": "v1_xyz789",
      "is_latest": false,
      "size": 524288,
      "last_modified": "2026-07-15T10:00:00Z"
    }
  ],
  "is_truncated": false
}
```

#### Restore Version

```
POST /v1/storage/s3/buckets/{bucket_id}/versions/restore
```

**Request:**
```json
{
  "key": "document.pdf",
  "version_id": "v1_xyz789"
}
```

Creates a new version by copying the specified old version as the latest.

#### Delete Version

```
POST /v1/storage/s3/buckets/{bucket_id}/versions/delete
```

**Request:**
```json
{
  "key": "document.pdf",
  "version_id": "v1_xyz789"
}
```

Permanently deletes a specific version. Cannot be undone.

#### Encryption

```
GET    /v1/storage/s3/buckets/{bucket_id}/encryption
PUT    /v1/storage/s3/buckets/{bucket_id}/encryption
DELETE /v1/storage/s3/buckets/{bucket_id}/encryption
```

**PUT Request:**
```json
{
  "algorithm": "aws:kms",
  "kms_master_key_id": "arn:aws:kms:eu-central-1:123456:key/abcdef",
  "bucket_key_enabled": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `algorithm` | string | `AES256`, `aws:kms`, or `aws:kms:dsse` |
| `kms_master_key_id` | string | KMS key ARN (required for `aws:kms`) |
| `bucket_key_enabled` | boolean | Reduce KMS request costs with bucket keys |

#### Object Lock (WORM)

```
GET /v1/storage/s3/buckets/{bucket_id}/object-lock
PUT /v1/storage/s3/buckets/{bucket_id}/object-lock
```

**PUT Request:**
```json
{
  "enabled": true,
  "mode": "COMPLIANCE",
  "retention_days": 365
}
```

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Enable object lock |
| `mode` | string | `GOVERNANCE` (overridable) or `COMPLIANCE` (immutable) |
| `retention_days` | integer | Retention period in days (1-36,500) |
| `retention_years` | integer | Alternative: retention in years (1-100) |

::: warning
COMPLIANCE mode locks cannot be shortened or removed by any user, including the account owner. Use GOVERNANCE mode for testing.
:::

---

### Behavior Configuration

#### Tags

```
GET    /v1/storage/s3/buckets/{bucket_id}/tags
PUT    /v1/storage/s3/buckets/{bucket_id}/tags
DELETE /v1/storage/s3/buckets/{bucket_id}/tags
```

**PUT Request:**
```json
{
  "tags": [
    { "key": "Environment", "value": "production" },
    { "key": "Team", "value": "media" },
    { "key": "CostCenter", "value": "CC-1234" }
  ]
}
```

#### Access Logging

```
GET /v1/storage/s3/buckets/{bucket_id}/logging
PUT /v1/storage/s3/buckets/{bucket_id}/logging
```

**PUT Request:**
```json
{
  "enabled": true,
  "target_bucket": "s3_bucket_logs",
  "target_prefix": "access-logs/production-media/"
}
```

#### Transfer Acceleration

```
GET /v1/storage/s3/buckets/{bucket_id}/accelerate
PUT /v1/storage/s3/buckets/{bucket_id}/accelerate
```

**PUT Request:**
```json
{
  "status": "Enabled"
}
```

Values: `Enabled` | `Suspended`

::: tip
Transfer Acceleration uses CloudFront edge locations to speed up uploads from distant clients. Ideal for global user bases uploading to a single region.
:::

#### Request Payment

```
GET /v1/storage/s3/buckets/{bucket_id}/request-payment
PUT /v1/storage/s3/buckets/{bucket_id}/request-payment
```

**PUT Request:**
```json
{
  "payer": "Requester"
}
```

Values: `BucketOwner` | `Requester`

#### Intelligent Tiering

```
GET    /v1/storage/s3/buckets/{bucket_id}/intelligent-tiering
PUT    /v1/storage/s3/buckets/{bucket_id}/intelligent-tiering
DELETE /v1/storage/s3/buckets/{bucket_id}/intelligent-tiering/{config_id}
```

**PUT Request:**
```json
{
  "id": "archive-config",
  "status": "Enabled",
  "prefix": "data/",
  "tag": { "key": "archive", "value": "true" },
  "tierings": [
    { "days": 90, "access_tier": "ARCHIVE_ACCESS" },
    { "days": 180, "access_tier": "DEEP_ARCHIVE_ACCESS" }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Configuration identifier |
| `status` | string | `Enabled` or `Disabled` |
| `prefix` | string | Filter by key prefix |
| `tag` | object | Filter by tag `{key, value}` |
| `tierings` | array | Tier transitions (days 90-9999) |
| `tierings[].access_tier` | string | `ARCHIVE_ACCESS` or `DEEP_ARCHIVE_ACCESS` |

---

### Lifecycle Rules

```
GET    /v1/storage/s3/buckets/{bucket_id}/lifecycle
PUT    /v1/storage/s3/buckets/{bucket_id}/lifecycle
DELETE /v1/storage/s3/buckets/{bucket_id}/lifecycle
```

Define rules for automatic object transitions and expiration.

**PUT Request:**
```json
{
  "rules": [
    {
      "id": "archive-old-media",
      "status": "Enabled",
      "prefix": "media/",
      "transitions": [
        { "days": 30, "storage_class": "STANDARD_IA" },
        { "days": 90, "storage_class": "GLACIER" }
      ],
      "expiration": { "days": 365 },
      "noncurrent_version_transitions": [
        { "noncurrent_days": 30, "storage_class": "GLACIER" }
      ],
      "noncurrent_version_expiration": { "noncurrent_days": 90 },
      "abort_incomplete_multipart_upload": { "days_after_initiation": 7 }
    }
  ]
}
```

::: tip
Always include an `abort_incomplete_multipart_upload` rule to clean up failed uploads and avoid unnecessary storage charges.
:::

---

### Website Hosting

```
GET    /v1/storage/s3/buckets/{bucket_id}/website
PUT    /v1/storage/s3/buckets/{bucket_id}/website
DELETE /v1/storage/s3/buckets/{bucket_id}/website
```

Configure a bucket as a static website.

**PUT Request:**
```json
{
  "index_document": "index.html",
  "error_document": "404.html",
  "redirect_all_requests_to": null,
  "routing_rules": [
    {
      "condition": { "key_prefix_equals": "docs/" },
      "redirect": { "replace_key_prefix_with": "documentation/" }
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `index_document` | string | Default index page |
| `error_document` | string | Custom error page |
| `redirect_all_requests_to` | string | Redirect all traffic to this URL |
| `routing_rules` | array | Conditional routing rules |

---

### Notifications

```
GET /v1/storage/s3/buckets/{bucket_id}/notifications
PUT /v1/storage/s3/buckets/{bucket_id}/notifications
```

Configure event notifications for object operations.

**PUT Request:**
```json
{
  "sns": [
    {
      "arn": "arn:aws:sns:eu-central-1:123456:my-topic",
      "events": ["s3:ObjectCreated:*"],
      "filter_prefix": "uploads/",
      "filter_suffix": ".jpg"
    }
  ],
  "sqs": [],
  "lambda": [
    {
      "arn": "arn:aws:lambda:eu-central-1:123456:function:process-upload",
      "events": ["s3:ObjectCreated:Put", "s3:ObjectCreated:CompleteMultipartUpload"],
      "filter_prefix": "raw/"
    }
  ],
  "event_bridge_enabled": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sns` | array | SNS topic notifications |
| `sqs` | array | SQS queue notifications |
| `lambda` | array | Lambda function triggers |
| `event_bridge_enabled` | boolean | Send all events to EventBridge |

---

### Access Points

Named network endpoints with individual policies for shared bucket access.

#### List Access Points

```
GET /v1/storage/s3/buckets/{bucket_id}/access-points
```

#### Create Access Point

```
POST /v1/storage/s3/buckets/{bucket_id}/access-points
```

**Request:**
```json
{
  "name": "analytics-team",
  "vpc_id": "vpc-abc123",
  "block_public_access": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Access point name (3-50 chars, lowercase alphanumeric + hyphens) |
| `vpc_id` | string | No | Restrict to a specific VPC |
| `block_public_access` | boolean | No | Block public access through this endpoint |

#### Get Access Point

```
GET /v1/storage/s3/buckets/{bucket_id}/access-points/{name}
```

#### Delete Access Point

```
DELETE /v1/storage/s3/buckets/{bucket_id}/access-points/{name}
```

#### Access Point Policy

```
GET    /v1/storage/s3/buckets/{bucket_id}/access-points/{name}/policy
PUT    /v1/storage/s3/buckets/{bucket_id}/access-points/{name}/policy
DELETE /v1/storage/s3/buckets/{bucket_id}/access-points/{name}/policy
```

**PUT Request:**
```json
{
  "policy_json": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": { "AWS": "arn:aws:iam::123456:role/analytics" },
        "Action": ["s3:GetObject"],
        "Resource": "arn:aws:s3:eu-central-1:123456:accesspoint/analytics-team/object/*"
      }
    ]
  }
}
```

---

### Replication

```
GET    /v1/storage/s3/buckets/{bucket_id}/replication
PUT    /v1/storage/s3/buckets/{bucket_id}/replication
DELETE /v1/storage/s3/buckets/{bucket_id}/replication
```

Configure cross-region replication for disaster recovery or compliance.

**PUT Request:**
```json
{
  "rules": [
    {
      "id": "replicate-to-us",
      "status": "Enabled",
      "priority": 1,
      "prefix": "",
      "destination": {
        "bucket_arn": "arn:aws:s3:::fotohub-customer-abc123-backup",
        "region": "us-east-1",
        "storage_class": "STANDARD_IA"
      },
      "delete_marker_replication": true,
      "replica_modifications": true
    }
  ]
}
```

::: warning
Both source and destination buckets must have versioning enabled for replication to work.
:::

---

### CDN (CloudFront)

Attach a CloudFront distribution to your bucket for global low-latency delivery.

#### Request SSL Certificate

```
POST /v1/storage/s3/buckets/{bucket_id}/cdn/certificate
```

**Request:**
```json
{
  "domain_names": ["cdn.myapp.com", "assets.myapp.com"]
}
```

Maximum 10 domain names per certificate. Certificate is issued via AWS ACM and requires DNS validation.

| Field | Type | Description |
|-------|------|-------------|
| `domain_names` | string[] | Custom domains (max 10) |

**Response:**
```json
{
  "certificate_arn": "arn:aws:acm:us-east-1:123456:certificate/abc-123",
  "status": "PENDING_VALIDATION",
  "validation_records": [
    {
      "domain": "cdn.myapp.com",
      "type": "CNAME",
      "name": "_abc123.cdn.myapp.com",
      "value": "_xyz789.acm-validations.aws"
    }
  ]
}
```

#### Get Certificate Status

```
GET /v1/storage/s3/buckets/{bucket_id}/cdn/certificate?certificate_arn=arn:aws:acm:...
```

#### Delete Certificate

```
DELETE /v1/storage/s3/buckets/{bucket_id}/cdn/certificate?certificate_arn=arn:aws:acm:...
```

#### Create Distribution

```
POST /v1/storage/s3/buckets/{bucket_id}/cdn
```

**Request:**
```json
{
  "custom_domain_names": ["cdn.myapp.com"],
  "certificate_arn": "arn:aws:acm:us-east-1:123456:certificate/abc-123",
  "default_root_object": "index.html",
  "price_class": "PriceClass_100",
  "comment": "Production CDN for media assets"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `custom_domain_names` | string[] | No | Custom domains (certificate must cover them) |
| `certificate_arn` | string | No | ACM certificate ARN (required for custom domains) |
| `default_root_object` | string | No | Default root document |
| `price_class` | string | No | `PriceClass_All`, `PriceClass_200`, `PriceClass_100` |
| `comment` | string | No | Distribution description |

**Response:**
```json
{
  "distribution": {
    "id": "E1234ABCDEF",
    "domain_name": "d1234abcdef.cloudfront.net",
    "status": "InProgress",
    "custom_domains": ["cdn.myapp.com"],
    "price_class": "PriceClass_100"
  }
}
```

#### Get/List Distributions

```
GET /v1/storage/s3/buckets/{bucket_id}/cdn
GET /v1/storage/s3/buckets/{bucket_id}/cdn?distribution_id=E1234ABCDEF
```

#### Invalidate Cache

```
POST /v1/storage/s3/buckets/{bucket_id}/cdn/invalidate
```

**Request:**
```json
{
  "distribution_id": "E1234ABCDEF",
  "paths": ["/images/*", "/css/main.css"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `distribution_id` | string | CloudFront distribution ID |
| `paths` | string[] | Paths to invalidate (max 1000, supports wildcards) |

#### Disable Distribution

```
DELETE /v1/storage/s3/buckets/{bucket_id}/cdn?distribution_id=E1234ABCDEF
```

Disables the distribution. Must wait for status to become `Deployed` before finalizing deletion.

#### Finalize Delete Distribution

```
DELETE /v1/storage/s3/buckets/{bucket_id}/cdn/finalize?distribution_id=E1234ABCDEF
```

Permanently deletes a disabled distribution. Only callable after the distribution status is `Deployed` (disabled).

---

### Inventory

Schedule automated inventory reports for object auditing.

#### List Inventory Configurations

```
GET /v1/storage/s3/buckets/{bucket_id}/inventory
```

#### Create/Update Inventory

```
PUT /v1/storage/s3/buckets/{bucket_id}/inventory
```

**Request:**
```json
{
  "id": "weekly-full-inventory",
  "destination_bucket_arn": "arn:aws:s3:::fotohub-customer-abc123-inventory",
  "destination_prefix": "inventory/production-media/",
  "destination_format": "CSV",
  "frequency": "Weekly",
  "included_object_versions": "All",
  "optional_fields": ["Size", "LastModifiedDate", "StorageClass", "ETag", "IsMultipartUploaded"],
  "enabled": true,
  "filter_prefix": "media/"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Configuration identifier |
| `destination_bucket_arn` | string | Target bucket for inventory files |
| `destination_prefix` | string | Prefix in destination bucket |
| `destination_format` | string | `CSV`, `ORC`, or `Parquet` |
| `frequency` | string | `Daily` or `Weekly` |
| `included_object_versions` | string | `All` or `Current` |
| `optional_fields` | string[] | Additional fields to include |
| `enabled` | boolean | Enable/disable the configuration |
| `filter_prefix` | string | Only inventory objects with this prefix |

#### Delete Inventory Configuration

```
DELETE /v1/storage/s3/buckets/{bucket_id}/inventory/{config_id}
```

---

## Rental Packages

Managed storage with simple monthly pricing. No AWS knowledge required.

### List Packages

```
GET /v1/storage/packages
```

Returns available packages with fixed monthly pricing. Storage rental is the
one part of the catalog still priced in **PLN** — `price_pln_monthly` runs
1.50 / 7.50 / 15 / 50 / 80 PLN for 10 GB / 50 GB / 100 GB / 500 GB / 1 TB
standard, and 4.50 / 22.50 / 45 PLN for the 10/50/100 GB SSD premium tiers.
It is not wallet-billed, so the USD cutover did not touch it.

### Rent Storage

```
POST /v1/storage/rent
```

```json
{
  "package": "storage-50gb",
  "name": "my-project-assets",
  "region": "eu"
}
```

**Response:**
```json
{
  "rental": {
    "id": "rental_abc",
    "name": "my-project-assets",
    "size_gb": 50,
    "tier": "standard",
    "price_monthly_pln": 7.50,
    "region": "eu",
    "status": "active",
    "used_bytes": 0
  },
  "package": { "slug": "storage-50gb", "gb": 50, "tier": "standard" },
  "message": "Successfully rented 50 GB standard storage"
}
```

### Shared Spaces

Create storage accessible by multiple users or API keys:

```
POST /v1/storage/shared/create
```

```json
{
  "name": "team-assets",
  "size_gb": 100,
  "allowed_users": ["user-id-1", "user-id-2"],
  "permissions": "write"
}
```

Permissions: `read` | `write` | `admin`

### Storage Stats

```
GET /v1/storage/stats
```

**Response:**
```json
{
  "total_files": 1234,
  "total_bytes": 5368709120,
  "total_gb": 5.0,
  "buckets_count": 3,
  "buckets": [
    { "id": "...", "name": "assets", "rental": false, "shared": false },
    { "id": "...", "name": "team-media", "rental": true, "shared": false }
  ]
}
```

---

## Code Examples

### Python: Full S3 Workflow

```python
import httpx

API = "https://apis.fotohub.app/v1/storage/s3"
HEADERS = {"Authorization": "Bearer YOUR_JWT"}

# 1. Estimate costs
estimate = httpx.post(f"{API}/estimate", headers=HEADERS, json={
    "storage_class": "STANDARD",
    "storage_gb": 100,
    "put_requests": 50000,
    "get_requests": 200000,
    "egress_gb": 20,
    "period_days": 30
}).json()
print(f"Estimated cost: ${estimate['total_usd']}/month")

# 2. Create bucket
bucket = httpx.post(f"{API}/buy", headers=HEADERS, json={
    "display_name": "media-production",
    "region": "eu-central-1",
    "default_storage_class": "INTELLIGENT_TIERING",
    "quota_gb": 100,
    "versioning_enabled": True,
    "encryption_type": "SSE-S3"
}).json()

bucket_id = bucket["bucket"]["id"]
creds = bucket["bucket"]["credentials"]

# 3. Upload file via presigned URL
presign = httpx.post(
    f"{API}/buckets/{bucket_id}/objects/presign-upload",
    headers=HEADERS,
    json={"key": "photos/hero.jpg", "content_type": "image/jpeg", "expires_in": 600}
).json()

with open("hero.jpg", "rb") as f:
    httpx.put(presign["upload_url"], content=f.read(),
              headers={"Content-Type": "image/jpeg"})

# 4. Generate download link
download = httpx.post(
    f"{API}/buckets/{bucket_id}/objects/presign-download",
    headers=HEADERS,
    json={"key": "photos/hero.jpg", "expires_in": 86400}
).json()
print(f"Download: {download['url']}")
```

### Python: Multipart Upload

```python
import httpx

API = "https://apis.fotohub.app/v1/storage/s3"
HEADERS = {"Authorization": "Bearer YOUR_JWT"}
BUCKET_ID = "your-bucket-id"
BASE = f"{API}/buckets/{BUCKET_ID}"

# 1. Initiate multipart upload
mp = httpx.post(f"{BASE}/multipart/create", headers=HEADERS, json={
    "key": "large-video.mp4",
    "content_type": "video/mp4",
    "storage_class": "STANDARD"
}).json()

upload_id = mp["upload_id"]

# 2. Upload parts (5 MB each)
PART_SIZE = 5 * 1024 * 1024
parts = []

with open("large-video.mp4", "rb") as f:
    part_num = 1
    while chunk := f.read(PART_SIZE):
        # Get presigned URL for this part
        presign = httpx.post(f"{BASE}/multipart/presign-part", headers=HEADERS, json={
            "upload_id": upload_id,
            "key": "large-video.mp4",
            "part_number": part_num
        }).json()

        # Upload directly to S3
        resp = httpx.put(presign["url"], content=chunk)
        parts.append({"part_number": part_num, "etag": resp.headers["etag"]})
        part_num += 1

# 3. Complete
httpx.post(f"{BASE}/multipart/complete", headers=HEADERS, json={
    "upload_id": upload_id,
    "key": "large-video.mp4",
    "parts": parts
})

print(f"Uploaded {part_num - 1} parts successfully")
```

### TypeScript: Set Up CDN

```typescript
const API = 'https://apis.fotohub.app/v1/storage/s3';
const headers = {
  Authorization: `Bearer ${jwt}`,
  'Content-Type': 'application/json'
};
const bucketId = 'your-bucket-id';

// 1. Request SSL certificate
const cert = await fetch(`${API}/buckets/${bucketId}/cdn/certificate`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ domain_names: ['cdn.myapp.com'] })
}).then(r => r.json());

console.log('Add these DNS records for validation:');
cert.validation_records.forEach((record: any) => {
  console.log(`  ${record.type} ${record.name} -> ${record.value}`);
});

// 2. Poll for certificate validation (wait for DNS propagation)
let certStatus = 'PENDING_VALIDATION';
while (certStatus === 'PENDING_VALIDATION') {
  await new Promise(resolve => setTimeout(resolve, 30000));
  const status = await fetch(
    `${API}/buckets/${bucketId}/cdn/certificate?certificate_arn=${cert.certificate_arn}`,
    { headers }
  ).then(r => r.json());
  certStatus = status.status;
}

// 3. Create CloudFront distribution
const cdn = await fetch(`${API}/buckets/${bucketId}/cdn`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    custom_domain_names: ['cdn.myapp.com'],
    certificate_arn: cert.certificate_arn,
    default_root_object: 'index.html',
    price_class: 'PriceClass_100'
  })
}).then(r => r.json());

console.log(`CDN domain: ${cdn.distribution.domain_name}`);
console.log('Add CNAME: cdn.myapp.com -> ' + cdn.distribution.domain_name);
```

### TypeScript: Lifecycle and Versioning

```typescript
const API = 'https://apis.fotohub.app/v1/storage/s3';
const headers = {
  Authorization: `Bearer ${jwt}`,
  'Content-Type': 'application/json'
};
const bucketId = 'your-bucket-id';

// Enable versioning
await fetch(`${API}/buckets/${bucketId}/versioning`, {
  method: 'PUT',
  headers,
  body: JSON.stringify({ status: 'Enabled', mfa_delete: 'Disabled' })
});

// Set lifecycle rules
await fetch(`${API}/buckets/${bucketId}/lifecycle`, {
  method: 'PUT',
  headers,
  body: JSON.stringify({
    rules: [
      {
        id: 'optimize-storage-costs',
        status: 'Enabled',
        prefix: '',
        transitions: [
          { days: 30, storage_class: 'STANDARD_IA' },
          { days: 90, storage_class: 'GLACIER_IR' },
          { days: 365, storage_class: 'DEEP_ARCHIVE' }
        ],
        noncurrent_version_expiration: { noncurrent_days: 30 },
        abort_incomplete_multipart_upload: { days_after_initiation: 3 }
      }
    ]
  })
});

// Set up intelligent tiering for unpredictable workloads
await fetch(`${API}/buckets/${bucketId}/intelligent-tiering`, {
  method: 'PUT',
  headers,
  body: JSON.stringify({
    id: 'auto-archive',
    status: 'Enabled',
    prefix: 'data/',
    tierings: [
      { days: 90, access_tier: 'ARCHIVE_ACCESS' },
      { days: 180, access_tier: 'DEEP_ARCHIVE_ACCESS' }
    ]
  })
});
```

---

## Available Regions

16 AWS regions across 4 continents. `GET /v1/storage/s3/regions` is the
authoritative list — it returns only regions currently open for new buckets, so
prefer it over this table if you build a region picker.

| Region | Code | Continent | EEA |
|--------|------|-----------|-----|
| Frankfurt | `eu-central-1` | Europe | Yes |
| Ireland | `eu-west-1` | Europe | Yes |
| Paris | `eu-west-3` | Europe | Yes |
| Stockholm | `eu-north-1` | Europe | Yes |
| London | `eu-west-2` | Europe | No |
| N. Virginia | `us-east-1` | North America | No |
| Ohio | `us-east-2` | North America | No |
| N. California | `us-west-1` | North America | No |
| Oregon | `us-west-2` | North America | No |
| Canada (Central) | `ca-central-1` | North America | No |
| Tokyo | `ap-northeast-1` | Asia Pacific | No |
| Seoul | `ap-northeast-2` | Asia Pacific | No |
| Singapore | `ap-southeast-1` | Asia Pacific | No |
| Sydney | `ap-southeast-2` | Asia Pacific | No |
| Mumbai | `ap-south-1` | Asia Pacific | No |
| São Paulo | `sa-east-1` | South America | No |

The **EEA** column is about where personal data legally rests, not where the
servers are: London is in Europe but the UK is a third country post-Brexit, so
transfers there rely on an adequacy decision rather than being intra-EEA.

::: tip Choosing a region
Pick the region closest to the application that will **read** the files. Storage,
request and egress prices are per-region and differ substantially — Frankfurt
storage is $0.0245/GB against Oregon's $0.023, and São Paulo egress is $0.15/GB
against Europe's $0.09. Call `POST /v1/storage/s3/estimate` with a candidate
region for the exact figures before you provision.
:::

---

## Error Handling

All endpoints return standard HTTP status codes with JSON error bodies:

```json
{
  "error": "bucket_quota_exceeded",
  "message": "Storage quota of 100 GB exceeded. Current usage: 100.5 GB.",
  "details": {
    "quota_gb": 100,
    "used_gb": 100.5
  }
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request (validation error, invalid parameters) |
| 401 | Missing or invalid JWT token |
| 403 | Insufficient plan or permissions |
| 404 | Bucket or object not found |
| 409 | Conflict (bucket name taken, operation in progress) |
| 422 | Unprocessable (e.g., insufficient wallet balance) |
| 429 | Rate limited |
| 500 | Internal server error |

---

## Rate Limits

| Endpoint Group | Rate Limit |
|----------------|-----------|
| Bucket CRUD | 10 requests/minute |
| Object operations | 100 requests/minute |
| Presigned URLs | 200 requests/minute |
| Metrics/usage | 30 requests/minute |
| CDN operations | 5 requests/minute |

---

## Endpoint Reference

Complete list of all S3 Enterprise endpoints:

### Bucket Management

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/storage/s3/buy` | Provision a new S3 bucket |
| GET | `/v1/storage/s3/buckets` | List all buckets |
| GET | `/v1/storage/s3/buckets/{bucket_id}` | Get bucket details |
| POST | `/v1/storage/s3/buckets/{bucket_id}/upgrade` | Upgrade bucket |
| DELETE | `/v1/storage/s3/buckets/{bucket_id}` | Delete bucket |

### Credentials

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/storage/s3/buckets/{bucket_id}/credentials` | List access keys |
| POST | `/v1/storage/s3/buckets/{bucket_id}/regenerate-keys` | Rotate keys |

### Usage and Pricing

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/storage/s3/buckets/{bucket_id}/usage` | Current usage stats |
| GET | `/v1/storage/s3/buckets/{bucket_id}/metrics` | CloudWatch metrics |
| GET | `/v1/storage/s3/pricing` | Pricing table |
| POST | `/v1/storage/s3/estimate` | Cost estimator |
| GET | `/v1/storage/s3/regions` | Available regions |

### Object Operations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/storage/s3/buckets/{bucket_id}/objects/list` | List objects |
| POST | `/v1/storage/s3/buckets/{bucket_id}/objects/presign-upload` | Presigned upload URL |
| POST | `/v1/storage/s3/buckets/{bucket_id}/objects/presign-download` | Presigned download URL |
| POST | `/v1/storage/s3/buckets/{bucket_id}/objects/delete` | Batch delete objects |
| POST | `/v1/storage/s3/buckets/{bucket_id}/objects/copy` | Copy object |

### Multipart Upload

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/storage/s3/buckets/{bucket_id}/multipart/create` | Initiate upload |
| POST | `/v1/storage/s3/buckets/{bucket_id}/multipart/presign-part` | Presign part URL |
| POST | `/v1/storage/s3/buckets/{bucket_id}/multipart/complete` | Complete upload |
| POST | `/v1/storage/s3/buckets/{bucket_id}/multipart/abort` | Abort upload |

### Permissions

| Method | Path | Description |
|--------|------|-------------|
| GET/PUT/DELETE | `/v1/storage/s3/buckets/{bucket_id}/policy` | Bucket policy |
| POST | `/v1/storage/s3/buckets/{bucket_id}/policy/validate` | Validate policy |
| GET/PUT/DELETE | `/v1/storage/s3/buckets/{bucket_id}/cors` | CORS configuration |
| GET/PUT | `/v1/storage/s3/buckets/{bucket_id}/public-access-block` | Public access block |
| GET/PUT | `/v1/storage/s3/buckets/{bucket_id}/ownership` | Object ownership |
| GET | `/v1/storage/s3/buckets/{bucket_id}/acl` | ACL (read-only) |

### Security

| Method | Path | Description |
|--------|------|-------------|
| GET/PUT | `/v1/storage/s3/buckets/{bucket_id}/versioning` | Versioning |
| GET | `/v1/storage/s3/buckets/{bucket_id}/versions` | List versions |
| POST | `/v1/storage/s3/buckets/{bucket_id}/versions/restore` | Restore version |
| POST | `/v1/storage/s3/buckets/{bucket_id}/versions/delete` | Delete version |
| GET/PUT/DELETE | `/v1/storage/s3/buckets/{bucket_id}/encryption` | Encryption |
| GET/PUT | `/v1/storage/s3/buckets/{bucket_id}/object-lock` | Object lock |

### Behavior

| Method | Path | Description |
|--------|------|-------------|
| GET/PUT/DELETE | `/v1/storage/s3/buckets/{bucket_id}/tags` | Tags |
| GET/PUT | `/v1/storage/s3/buckets/{bucket_id}/logging` | Access logging |
| GET/PUT | `/v1/storage/s3/buckets/{bucket_id}/accelerate` | Transfer acceleration |
| GET/PUT | `/v1/storage/s3/buckets/{bucket_id}/request-payment` | Request payment |
| GET/PUT | `/v1/storage/s3/buckets/{bucket_id}/intelligent-tiering` | Intelligent tiering |
| DELETE | `/v1/storage/s3/buckets/{bucket_id}/intelligent-tiering/{config_id}` | Delete tiering config |

### Lifecycle

| Method | Path | Description |
|--------|------|-------------|
| GET/PUT/DELETE | `/v1/storage/s3/buckets/{bucket_id}/lifecycle` | Lifecycle rules |

### Website Hosting

| Method | Path | Description |
|--------|------|-------------|
| GET/PUT/DELETE | `/v1/storage/s3/buckets/{bucket_id}/website` | Static website config |

### Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET/PUT | `/v1/storage/s3/buckets/{bucket_id}/notifications` | Event notifications |

### Access Points

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/storage/s3/buckets/{bucket_id}/access-points` | List access points |
| POST | `/v1/storage/s3/buckets/{bucket_id}/access-points` | Create access point |
| GET | `/v1/storage/s3/buckets/{bucket_id}/access-points/{name}` | Get access point |
| DELETE | `/v1/storage/s3/buckets/{bucket_id}/access-points/{name}` | Delete access point |
| GET/PUT/DELETE | `/v1/storage/s3/buckets/{bucket_id}/access-points/{name}/policy` | Access point policy |

### Replication

| Method | Path | Description |
|--------|------|-------------|
| GET/PUT/DELETE | `/v1/storage/s3/buckets/{bucket_id}/replication` | Cross-region replication |

### CDN (CloudFront)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/storage/s3/buckets/{bucket_id}/cdn/certificate` | Request SSL certificate |
| GET | `/v1/storage/s3/buckets/{bucket_id}/cdn/certificate` | Get certificate status |
| DELETE | `/v1/storage/s3/buckets/{bucket_id}/cdn/certificate` | Delete certificate |
| POST | `/v1/storage/s3/buckets/{bucket_id}/cdn` | Create distribution |
| GET | `/v1/storage/s3/buckets/{bucket_id}/cdn` | Get/list distributions |
| POST | `/v1/storage/s3/buckets/{bucket_id}/cdn/invalidate` | Invalidate cache |
| DELETE | `/v1/storage/s3/buckets/{bucket_id}/cdn` | Disable distribution |
| DELETE | `/v1/storage/s3/buckets/{bucket_id}/cdn/finalize` | Finalize delete |

### Inventory

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/storage/s3/buckets/{bucket_id}/inventory` | List inventory configs |
| PUT | `/v1/storage/s3/buckets/{bucket_id}/inventory` | Create/update inventory |
| DELETE | `/v1/storage/s3/buckets/{bucket_id}/inventory/{config_id}` | Delete inventory config |

## Public Custom Domain Aliases (`*.s3point.fotohub.app`)

A custom bucket alias provisions a public vanity hostname under `*.s3point.fotohub.app` (for example, `mybrand.s3point.fotohub.app`). It allows your users and web visitors to fetch generated assets or uploaded media via clean, anonymous HTTPS URLs without AWS SigV4 signatures.

### Security Model
- AWS Block Public Access remains **ON** on your underlying bucket; the bucket is never opened directly to the internet.
- The `s3-gateway` signs incoming anonymous `GET` and `HEAD` requests using internal infrastructure credentials.
- Anonymous access is restricted strictly to object keys starting with prefixes listed in `public_prefixes`.
- Creating an alias starts with `public_prefixes: []` (publishing **nothing**). Going public requires an explicit, audited configuration. Root (`/`), empty (`""`), and wildcard (`*`) prefixes are prohibited to prevent accidental exposure of private bucket keys.

### Tier Limits on Aliases

| Plan Tier | Max Aliases per Bucket |
|-----------|:----------------------:|
| `free` | 1 |
| `developer` / `starter` | 2 |
| `startup` / `medium` | 3 |
| `pro` / `professional` / `business` | 5 |
| `enterprise` | 25 |

---

### Alias Endpoints

#### 1. List Bucket Aliases

```
GET /v1/storage/s3/buckets/{bucket_id}/aliases
```

##### Response Example

```json
[
  {
    "id": "7b1c3e5a-8d2f-4a6c-9e1b-3f5a7c9d1e3f",
    "alias": "marketing-assets",
    "bucket_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "public_prefixes": ["public/", "campaigns/2026/"],
    "status": "active",
    "hostname": "marketing-assets.s3point.fotohub.app",
    "public_base_url": "https://marketing-assets.s3point.fotohub.app",
    "is_publicly_readable": true,
    "created_at": "2026-08-10T14:30:00Z",
    "updated_at": "2026-08-12T09:15:00Z"
  }
]
```

---

#### 2. Create Alias

Claim a single-label DNS alias under `s3point.fotohub.app`.

```
POST /v1/storage/s3/buckets/{bucket_id}/aliases
```

##### Parameters

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `alias` | string | **Yes** | — | Single DNS label: 3–63 chars, lowercase letters, digits, and hyphens. Dots and punycode (`xn--`) are not allowed. Reserved names (`api`, `admin`, `s3`, `gateway`, etc.) are blocked. |
| `public_prefixes` | string[] | No | `[]` | List of allowed public folder prefixes (max 20). Defaults to empty for safety. |

##### Request Example

```json
{
  "alias": "media-production",
  "public_prefixes": ["gallery/", "previews/"]
}
```

::: code-group

```python [Python]
import requests

headers = {
    "Authorization": "Bearer fh_live_YOUR_API_KEY",
    "Content-Type": "application/json",
}
resp = requests.post(
    "https://apis.fotohub.app/v1/storage/s3/buckets/3fa85f64-5717-4562-b3fc-2c963f66afa6/aliases",
    headers=headers,
    json={"alias": "media-production", "public_prefixes": ["gallery/"]},
)
print(resp.status_code, resp.json())
```

```typescript [TypeScript]
const resp = await fetch(
  "https://apis.fotohub.app/v1/storage/s3/buckets/3fa85f64-5717-4562-b3fc-2c963f66afa6/aliases",
  {
    method: "POST",
    headers: {
      Authorization: "Bearer fh_live_YOUR_API_KEY",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      alias: "media-production",
      public_prefixes: ["gallery/"],
    }),
  }
);
console.log(await resp.json());
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"alias":           "media-production",
		"public_prefixes": []string{"gallery/"},
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/storage/s3/buckets/3fa85f64-5717-4562-b3fc-2c963f66afa6/aliases", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println(string(respBody))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/storage/s3/buckets/3fa85f64-5717-4562-b3fc-2c963f66afa6/aliases \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "media-production",
    "public_prefixes": ["gallery/"]
  }'
```

:::

---

#### 3. Update Alias

Modify published prefixes or toggle alias status (`active` or `disabled`).

```
PATCH /v1/storage/s3/buckets/{bucket_id}/aliases/{alias}
```

::: warning Empty Array vs Null
Passing `"public_prefixes": []` unpublishes all prefixes immediately (safe revocation). Passing `null` or omitting the field leaves prefixes unchanged.
:::

---

#### 4. Delete Alias

```
DELETE /v1/storage/s3/buckets/{bucket_id}/aliases/{alias}
```

---

## Bucket Audit Logging

Retrieve an immutable audit trail of operations executed against a bucket, including creation, lifecycle modifications, CORS/tag changes, credential rotation, alias updates, and deletion requests.

```
GET /v1/storage/s3/buckets/{bucket_id}/audit
```

Audit entries are preserved even after bucket deletion.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | `50` | Number of entries to return (1 to 200). |
| `offset` | integer | `0` | Number of entries to skip for pagination. |
| `category` | string | `null` | Filter by category: `"bucket"`, `"object"`, `"alias"`, `"credential"`. |
| `success_only` | boolean | `null` | `true` for successful operations only, `false` for failures only, omit for both. |

#### Response Example

```json
{
  "entries": [
    {
      "id": "91238472-1234-5678-abcd-ef0123456789",
      "action": "alias_create",
      "category": "alias",
      "bucket_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "ip_address": "198.51.100.42",
      "success": true,
      "error_code": null,
      "request_summary": {
        "alias": "media-production",
        "public_prefixes": ["gallery/"]
      },
      "created_at": "2026-09-06T15:00:00Z"
    }
  ],
  "limit": 50,
  "offset": 0,
  "has_more": false
}
```

::: code-group

```python [Python]
import requests

headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}
params = {"limit": 20, "category": "alias"}
resp = requests.get(
    "https://apis.fotohub.app/v1/storage/s3/buckets/3fa85f64-5717-4562-b3fc-2c963f66afa6/audit",
    headers=headers,
    params=params,
)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch(
  "https://apis.fotohub.app/v1/storage/s3/buckets/3fa85f64-5717-4562-b3fc-2c963f66afa6/audit?limit=20&category=alias",
  {
    headers: { Authorization: "Bearer YOUR_JWT_TOKEN" },
  }
);
console.log(await resp.json());
```

```go [Go]
package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/storage/s3/buckets/3fa85f64-5717-4562-b3fc-2c963f66afa6/audit?limit=20", nil)
	req.Header.Set("Authorization", "Bearer YOUR_JWT_TOKEN")
	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl "https://apis.fotohub.app/v1/storage/s3/buckets/3fa85f64-5717-4562-b3fc-2c963f66afa6/audit?limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

:::
