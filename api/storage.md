# S3 Cloud Storage

FOTOhub provides three tiers of object storage — from simple managed buckets to enterprise-grade AWS S3 with CDN, replication, lifecycle policies, and more.

---

## Storage Tiers

| Tier | Prefix | Backend | Best For |
|------|--------|---------|----------|
| Simple Buckets | `/v1/buckets` | Supabase Storage | Quick file storage, small projects |
| S3 Enterprise | `/v1/storage/s3` | Real AWS S3 | Production apps, large-scale storage |
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
  "max_file_size_mb": 100,
  "allowed_mime_types": ["image/png", "image/jpeg", "video/mp4"],
  "created_at": "2026-07-18T12:00:00Z"
}
```

::: tip
Bucket names are sanitized to `[a-zA-Z0-9_-]` and limited to 50 characters.
:::

---

## S3 Enterprise

Full AWS S3 with 60+ API endpoints covering every S3 feature. Auth via JWT.

**Base prefix:** `/v1/storage/s3`

### Plan Limits

| Plan | Max S3 Buckets |
|------|---------------|
| Free | 1 |
| Developer/Starter | 5 |
| Startup/Medium | 10 |
| Pro/Business | 25 |
| Enterprise | 1000 |

### Provision a Bucket

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
  "block_public_access": true,
  "billing_mode": "wallet",
  "tags": { "env": "production", "team": "media" }
}
```

**Fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `display_name` | string | Required | Bucket display name (1-100 chars) |
| `region` | string | `eu-central-1` | AWS region |
| `default_storage_class` | string | `STANDARD` | Storage class |
| `quota_gb` | integer | null | Storage quota (1 - 1,048,576 GB) |
| `versioning_enabled` | boolean | false | Enable object versioning |
| `encryption_type` | string | `SSE-S3` | `SSE-S3` \| `aws:kms` |
| `encryption_kms_key_id` | string | null | Custom KMS key ARN |
| `block_public_access` | boolean | true | Block all public access |
| `mfa_delete_enabled` | boolean | false | Require MFA for deletes |
| `billing_mode` | string | `wallet` | `wallet` \| `invoice_monthly` |

**Response:**
```json
{
  "bucket": {
    "id": "s3_bucket_xyz",
    "aws_bucket_name": "fotohub-customer-abc123-production-media",
    "region": "eu-central-1",
    "status": "active",
    "credentials": {
      "access_key_id": "AKIA...",
      "secret_access_key": "wJalr...",
      "endpoint": "https://s3.eu-central-1.amazonaws.com"
    }
  },
  "reservation_pln": 0.50
}
```

### Storage Classes & Pricing

| Class | USD/GB/month | Best For |
|-------|-------------|----------|
| `STANDARD` | $0.0245 | Frequently accessed data |
| `STANDARD_IA` | $0.0135 | Infrequent access (30-day min) |
| `ONEZONE_IA` | $0.0108 | Non-critical infrequent access |
| `INTELLIGENT_TIERING` | $0.0245 | Unknown access patterns |
| `GLACIER_IR` | $0.005 | Archive with instant retrieval |
| `GLACIER` | $0.0045 | Long-term archive (minutes retrieval) |
| `DEEP_ARCHIVE` | $0.00205 | Compliance archives (hours retrieval) |

### Cost Estimator

```
POST /v1/storage/s3/estimate
```

```json
{
  "region": "eu-central-1",
  "storage_class": "STANDARD",
  "storage_gb": 500,
  "put_requests": 100000,
  "get_requests": 1000000,
  "egress_gb": 50,
  "period_days": 30
}
```

---

### Object Operations

#### List Objects

```
POST /v1/storage/s3/buckets/:id/objects/list
```

```json
{
  "prefix": "uploads/2026/07/",
  "delimiter": "/",
  "max_keys": 100,
  "continuation_token": null
}
```

#### Presigned Upload

Generate a presigned URL for direct upload (bypasses API server):

```
POST /v1/storage/s3/buckets/:id/objects/presign-upload
```

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

**Response:**
```json
{
  "upload_url": "https://s3.eu-central-1.amazonaws.com/...",
  "expires_at": "2026-07-18T13:00:00Z",
  "headers": {
    "Content-Type": "video/mp4",
    "x-amz-meta-uploaded_by": "api"
  }
}
```

#### Presigned Download

```
POST /v1/storage/s3/buckets/:id/objects/presign-download
```

```json
{
  "key": "media/video-001.mp4",
  "expires_in": 3600,
  "response_content_disposition": "attachment; filename=\"video.mp4\""
}
```

#### Batch Delete

```
POST /v1/storage/s3/buckets/:id/objects/delete
```

```json
{
  "keys": ["tmp/file1.txt", "tmp/file2.txt", "tmp/file3.txt"]
}
```

Maximum 1000 keys per request.

#### Copy Object

```
POST /v1/storage/s3/buckets/:id/objects/copy
```

```json
{
  "source_key": "uploads/original.jpg",
  "dest_key": "processed/thumbnail.jpg",
  "metadata_directive": "COPY"
}
```

---

### Multipart Upload

For files >100 MB, use multipart upload for reliability and resumability.

#### Flow

1. **Create** → get `upload_id`
2. **Presign parts** → upload each 5-100 MB chunk directly to S3
3. **Complete** → assemble all parts
4. (Optional) **Abort** → cancel if needed

```python
import httpx

BASE = "https://apis.fotohub.app/v1/storage/s3/buckets/{bucket_id}"
HEADERS = {"Authorization": "Bearer YOUR_JWT"}

# 1. Initiate
mp = httpx.post(f"{BASE}/multipart/create", headers=HEADERS, json={
    "key": "large-video.mp4",
    "content_type": "video/mp4"
}).json()

upload_id = mp["upload_id"]

# 2. Upload parts (5 MB each)
parts = []
with open("large-video.mp4", "rb") as f:
    part_num = 1
    while chunk := f.read(5 * 1024 * 1024):
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
```

---

### Bucket Configuration

#### Permissions

| Endpoint | Description |
|----------|-------------|
| `GET/PUT/DELETE /buckets/:id/policy` | Bucket access policy (JSON) |
| `POST /buckets/:id/policy/validate` | Validate policy before applying |
| `GET/PUT/DELETE /buckets/:id/cors` | CORS configuration |
| `GET/PUT /buckets/:id/public-access-block` | Block public access settings |
| `GET/PUT /buckets/:id/ownership` | Object ownership model |
| `GET /buckets/:id/acl` | Access control list (read-only) |

#### Security

| Endpoint | Description |
|----------|-------------|
| `GET/PUT /buckets/:id/versioning` | Enable/suspend versioning |
| `GET /buckets/:id/versions` | Browse object versions |
| `POST /buckets/:id/versions/restore` | Restore a previous version |
| `POST /buckets/:id/versions/delete` | Delete a specific version |
| `GET/PUT/DELETE /buckets/:id/encryption` | Server-side encryption |
| `GET/PUT /buckets/:id/object-lock` | WORM compliance lock |

#### Behavior

| Endpoint | Description |
|----------|-------------|
| `GET/PUT/DELETE /buckets/:id/tags` | Bucket tags |
| `GET/PUT /buckets/:id/logging` | Access logging |
| `GET/PUT /buckets/:id/accelerate` | Transfer acceleration |
| `GET/PUT /buckets/:id/request-payment` | Requester pays |
| `GET/PUT/DELETE /buckets/:id/intelligent-tiering` | Auto-tiering rules |

#### Lifecycle

```
GET/PUT/DELETE /v1/storage/s3/buckets/:id/lifecycle
```

Example rule — transition to Glacier after 90 days, delete after 365:

```json
{
  "rules": [
    {
      "id": "archive-old-media",
      "status": "Enabled",
      "prefix": "media/",
      "transitions": [
        { "days": 90, "storage_class": "GLACIER" }
      ],
      "expiration": { "days": 365 }
    }
  ]
}
```

#### CDN (CloudFront)

| Endpoint | Description |
|----------|-------------|
| `POST /buckets/:id/cdn/certificate` | Request ACM SSL certificate |
| `GET/DELETE /buckets/:id/cdn/certificate` | Manage certificates |
| `POST /buckets/:id/cdn` | Create CloudFront distribution |
| `GET /buckets/:id/cdn` | List distributions |
| `POST /buckets/:id/cdn/invalidate` | Cache invalidation |
| `DELETE /buckets/:id/cdn` | Disable distribution |

#### Other Features

| Feature | Endpoints |
|---------|-----------|
| Notifications | SNS/SQS/Lambda/EventBridge event triggers |
| Replication | Cross-region replication rules |
| Website Hosting | Static site configuration |
| Access Points | Named network endpoints with policies |
| Inventory | Scheduled object inventory reports |

---

### Credential Management

```
GET  /v1/storage/s3/buckets/:id/credentials   — List access keys
POST /v1/storage/s3/buckets/:id/regenerate-keys — Rotate credentials
```

**Rotate keys:**
```json
{
  "label": "api-server-v2",
  "revoke_old_immediately": false,
  "grace_period_days": 7
}
```

---

## Rental Packages

Managed storage with simple monthly pricing. No AWS knowledge required.

### List Packages

```
GET /v1/storage/packages
```

Returns available packages with fixed monthly pricing.

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
    "price_monthly_pln": 9.99,
    "region": "eu",
    "status": "active",
    "used_bytes": 0
  },
  "package": { "slug": "storage-50gb", "gb": 50, "tier": "standard" },
  "message": "Successfully rented 50 GB standard storage"
}
```

### Shared Spaces

Create storage accessible by multiple users/API keys:

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

### TypeScript: Set Up CDN

```typescript
const API = 'https://apis.fotohub.app/v1/storage/s3';
const headers = { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' };
const bucketId = 'your-bucket-id';

// 1. Request SSL certificate
const cert = await fetch(`${API}/buckets/${bucketId}/cdn/certificate`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ domain_names: ['cdn.myapp.com'] })
}).then(r => r.json());

// 2. Wait for DNS validation...

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
```

---

## Available Regions

| Region | Code | S3 | CDN |
|--------|------|----|----|
| Frankfurt | `eu-central-1` | Yes | Yes |
| Virginia | `us-east-1` | Yes | Yes |
| Oregon | `us-west-2` | Yes | Yes |
| Singapore | `ap-southeast-1` | Yes | Yes |
