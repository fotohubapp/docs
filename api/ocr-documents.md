# OCR & Document Intelligence

Extract text from images, analyze document layouts, process invoices, redact sensitive data, and batch-process documents at scale. FOTOhub's OCR pipeline combines high-accuracy text detection with intelligent document understanding for 40+ languages.

::: danger Deprecation & Phantom Endpoints Notice
The endpoints previously listed on this page:
- `POST /v1/ai/document/ocr`
- `POST /v1/ai/document/redact`
- `POST /v1/ai/document/pdf-to-images`
- `POST /v1/ai/document/batch`
- `POST /v1/ai/document/export`
- `POST /v1/ai/document/invoice`

are deprecated non-functional routes. All production document processing is powered by AWS Textract at 1:1 pass-through USD pricing and documented on the canonical **[Document Intelligence](/api/document-intelligence)** page:
1. `POST /v1/ai/document/detect-text` — High-accuracy OCR & line detection ($0.0015 / page)
2. `POST /v1/ai/document/analyze` — Table and form field extraction ($0.015 / page)
3. `POST /v1/ai/document/analyze-expense` — Invoice & receipt breakdown ($0.010 / page)
:::

| Feature | Endpoint | Credits | Description |
|---------|----------|---------|-------------|
| **OCR** | `POST /v1/ai/document/ocr` | 1 | Detect and extract text from images |
| **Redact** | `POST /v1/ai/document/redact` | 2 | Redact PII and sensitive text for compliance |
| **PDF to Images** | `POST /v1/ai/document/pdf-to-images` | 1/page | Convert PDF pages to individual images |
| **Batch OCR** | `POST /v1/ai/document/batch` | 1/image | Process up to 100 images in a single request |
| **Export** | `POST /v1/ai/document/export` | Free | Export prior OCR results as JSON, CSV, or text |
| **Invoice** | `POST /v1/ai/document/invoice` | 3 | Extract structured data from invoices/receipts |
| **Analyze** | `POST /v1/ai/document/analyze` | 2 | Full document analysis with layout detection |

**Supported formats:** JPEG, PNG, TIFF, WebP, BMP, PDF (max 10MB per file, max 100 pages for batch).

::: info Authentication
All endpoints require a valid API key passed in the `Authorization` header:
```
Authorization: Bearer YOUR_API_KEY
```
Base URL: `https://apis.fotohub.app`
:::

---

## OCR — Text Detection

Fast, high-accuracy text extraction from any image. Returns detected text with per-line confidence scores, bounding boxes, and detected language.

### Endpoint

```
POST /v1/ai/document/ocr
```

**Billing:** 1 credit per image

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image` | string | **Yes** | — | Base64-encoded image or public URL. Max 10MB. |
| `language_hints` | array | No | auto-detect | ISO 639-1 codes to hint preferred languages, e.g. `["en", "pl", "de"]`. |
| `include_bounding_boxes` | boolean | No | `false` | Return pixel coordinates for each text block. |
| `output_format` | string | No | `"structured"` | `"structured"` (lines + metadata) or `"plain"` (raw text only). |

### Response

```json
{
  "text": "FOTOhub Invoice #FH-2026-0147\nDate: 2026-07-22\nBill To: Acme Corp\nTotal: 1,249.00 PLN",
  "lines": [
    {
      "text": "FOTOhub Invoice #FH-2026-0147",
      "confidence": 99.7,
      "bounding_box": { "x": 42, "y": 18, "width": 380, "height": 32 }
    },
    {
      "text": "Date: 2026-07-22",
      "confidence": 99.4,
      "bounding_box": { "x": 42, "y": 62, "width": 180, "height": 24 }
    },
    {
      "text": "Bill To: Acme Corp",
      "confidence": 98.9,
      "bounding_box": { "x": 42, "y": 94, "width": 210, "height": 24 }
    },
    {
      "text": "Total: 1,249.00 PLN",
      "confidence": 99.6,
      "bounding_box": { "x": 42, "y": 126, "width": 220, "height": 24 }
    }
  ],
  "detected_language": "en",
  "total_lines": 4,
  "credits_used": 1
}
```

### Examples

::: code-group

```python [Python]
import base64
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

# From a local file
with open("receipt.jpg", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

result = client.document.ocr(image=image_b64)
print(result.text)

# From a URL
result = client.document.ocr(
    image="https://example.com/document.png",
    language_hints=["en", "pl"],
    include_bounding_boxes=True
)

for line in result.lines:
    print(f"[{line.confidence:.1f}%] {line.text}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_..." });

// From a local file
const imageB64 = readFileSync("receipt.jpg").toString("base64");

const result = await client.document.ocr({
  image: imageB64,
  languageHints: ["en", "pl"],
  includeBoundingBoxes: true,
});

console.log(result.text);

for (const line of result.lines) {
  console.log(`[${line.confidence.toFixed(1)}%] ${line.text}`);
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/document/ocr" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "BASE64_ENCODED_IMAGE...",
    "language_hints": ["en", "pl"],
    "include_bounding_boxes": true
  }'
```

:::

---

## Redact — PII Removal

Automatically detect and mask personally identifiable information (PII) in documents. Returns a redacted image with sensitive text replaced by black bars, plus a report of what was detected.

### Endpoint

```
POST /v1/ai/document/redact
```

**Billing:** 2 credits per image

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image` | string | **Yes** | — | Base64-encoded image or public URL. Max 10MB. |
| `redaction_types` | array | No | all types | Specific PII types to redact. See table below. |
| `mask_style` | string | No | `"black_bar"` | `"black_bar"`, `"blur"`, or `"pixelate"`. |
| `return_detections` | boolean | No | `true` | Include list of detected PII items in response. |

### Redaction Types

| Type | Detects |
|------|---------|
| `NAME` | Full names, first/last names |
| `EMAIL` | Email addresses |
| `PHONE` | Phone numbers (international formats) |
| `ADDRESS` | Street addresses, postal codes, cities |
| `SSN` | Social security numbers, PESEL, national IDs |
| `CREDIT_CARD` | Credit/debit card numbers |
| `DATE_OF_BIRTH` | Birth dates |
| `BANK_ACCOUNT` | IBAN, account numbers |
| `LICENSE_PLATE` | Vehicle registration numbers |
| `PASSPORT` | Passport numbers |
| `IP_ADDRESS` | IPv4 and IPv6 addresses |
| `SIGNATURE` | Handwritten signatures (visual masking) |

### Response

```json
{
  "redacted_image": "https://s1.fotohub.app/storage/v1/object/public/generations/redact_abc123.png",
  "detections": [
    { "type": "NAME", "value": "Jan Kowalski", "confidence": 97.3, "masked": true },
    { "type": "EMAIL", "value": "jan@example.com", "confidence": 99.1, "masked": true },
    { "type": "PHONE", "value": "+48 600 123 456", "confidence": 98.5, "masked": true },
    { "type": "ADDRESS", "value": "ul. Marszalkowska 1, 00-001 Warszawa", "confidence": 96.8, "masked": true }
  ],
  "total_redactions": 4,
  "credits_used": 2
}
```

### Examples

::: code-group

```python [Python]
import base64
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

with open("contract.png", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

result = client.document.redact(
    image=image_b64,
    redaction_types=["NAME", "EMAIL", "PHONE", "SSN"],
    mask_style="black_bar"
)

print(f"Redacted {result.total_redactions} items")
print(f"Redacted image: {result.redacted_image}")

for detection in result.detections:
    print(f"  [{detection.type}] {detection.value}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_..." });

const imageB64 = readFileSync("contract.png").toString("base64");

const result = await client.document.redact({
  image: imageB64,
  redactionTypes: ["NAME", "EMAIL", "PHONE", "SSN"],
  maskStyle: "black_bar",
});

console.log(`Redacted ${result.totalRedactions} items`);
console.log(`Redacted image: ${result.redactedImage}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/document/redact" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "BASE64_ENCODED_IMAGE...",
    "redaction_types": ["NAME", "EMAIL", "PHONE", "SSN"],
    "mask_style": "black_bar"
  }'
```

:::

::: warning GDPR Compliance
Redacted images are stored temporarily (24 hours) then permanently deleted. The original image is never stored. For GDPR data processing agreements, contact support@fotohub.app.
:::

---

## PDF to Images

Convert PDF pages to individual high-resolution images for downstream OCR processing or display.

### Endpoint

```
POST /v1/ai/document/pdf-to-images
```

**Billing:** 1 credit per page converted

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `document` | string | **Yes** | — | Base64-encoded PDF. Max 10MB. |
| `pages` | string | No | `"all"` | Page range: `"all"`, `"1-5"`, `"1,3,7"`, or `"1-3,5,8-10"`. |
| `dpi` | integer | No | `200` | Output resolution: `72`, `150`, `200`, or `300`. |
| `format` | string | No | `"png"` | Output format: `"png"` or `"jpeg"`. |

### Response

```json
{
  "images": [
    {
      "page": 1,
      "url": "https://s1.fotohub.app/storage/v1/object/public/generations/pdf_p1_abc123.png",
      "width": 1654,
      "height": 2339
    },
    {
      "page": 2,
      "url": "https://s1.fotohub.app/storage/v1/object/public/generations/pdf_p2_abc123.png",
      "width": 1654,
      "height": 2339
    }
  ],
  "total_pages": 2,
  "credits_used": 2
}
```

### Examples

::: code-group

```python [Python]
import base64
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

with open("report.pdf", "rb") as f:
    pdf_b64 = base64.b64encode(f.read()).decode()

result = client.document.pdf_to_images(
    document=pdf_b64,
    pages="1-5",
    dpi=300,
    format="png"
)

for page in result.images:
    print(f"Page {page.page}: {page.url}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_..." });

const pdfB64 = readFileSync("report.pdf").toString("base64");

const result = await client.document.pdfToImages({
  document: pdfB64,
  pages: "1-5",
  dpi: 300,
  format: "png",
});

for (const page of result.images) {
  console.log(`Page ${page.page}: ${page.url}`);
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/document/pdf-to-images" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "document": "BASE64_ENCODED_PDF...",
    "pages": "1-5",
    "dpi": 300,
    "format": "png"
  }'
```

:::

---

## Batch OCR

Process multiple images in a single request. Ideal for multi-page documents, photo archives, or bulk digitization workflows. Up to 100 images per batch.

### Endpoint

```
POST /v1/ai/document/batch
```

**Billing:** 1 credit per image in the batch

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `images` | array | **Yes** | — | Array of base64-encoded images or URLs. Max 100 items, 10MB each. |
| `language_hints` | array | No | auto-detect | ISO 639-1 language codes applied to all images. |
| `include_bounding_boxes` | boolean | No | `false` | Return bounding boxes for each detected line. |

### Response

```json
{
  "results": [
    {
      "index": 0,
      "text": "Page 1 content here...",
      "lines": [
        { "text": "Page 1 content here...", "confidence": 99.2 }
      ],
      "detected_language": "en",
      "status": "success"
    },
    {
      "index": 1,
      "text": "Page 2 content here...",
      "lines": [
        { "text": "Page 2 content here...", "confidence": 98.8 }
      ],
      "detected_language": "en",
      "status": "success"
    }
  ],
  "total_processed": 2,
  "total_failed": 0,
  "credits_used": 2
}
```

### Examples

::: code-group

```python [Python]
import base64
import glob
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

# Batch process all images in a folder
images = []
for path in glob.glob("scanned_pages/*.jpg"):
    with open(path, "rb") as f:
        images.append(base64.b64encode(f.read()).decode())

result = client.document.batch(
    images=images,
    language_hints=["en"]
)

print(f"Processed {result.total_processed} pages")
for page in result.results:
    print(f"  Page {page.index + 1}: {page.text[:80]}...")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const client = new FotoHub({ apiKey: "fh_live_..." });

const dir = "scanned_pages";
const images = readdirSync(dir)
  .filter((f) => f.endsWith(".jpg"))
  .map((f) => readFileSync(join(dir, f)).toString("base64"));

const result = await client.document.batch({
  images,
  languageHints: ["en"],
});

console.log(`Processed ${result.totalProcessed} pages`);
for (const page of result.results) {
  console.log(`  Page ${page.index + 1}: ${page.text.slice(0, 80)}...`);
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/document/batch" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      "BASE64_IMAGE_1...",
      "BASE64_IMAGE_2...",
      "BASE64_IMAGE_3..."
    ],
    "language_hints": ["en"]
  }'
```

:::

---

## Export Results

Export OCR results from a previous request in JSON, CSV, or plain text format. This endpoint is free when referencing a prior OCR job.

### Endpoint

```
POST /v1/ai/document/export
```

**Billing:** Free (requires a valid `job_id` from a prior OCR/analyze call)

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `job_id` | string | **Yes** | — | Job ID from a previous OCR, batch, or analyze request. |
| `format` | string | No | `"json"` | Export format: `"json"`, `"csv"`, or `"text"`. |
| `include_confidence` | boolean | No | `true` | Include confidence scores in export. |
| `include_bounding_boxes` | boolean | No | `false` | Include bounding box coordinates. |

### Response

For `format: "json"`:
```json
{
  "export_url": "https://s1.fotohub.app/storage/v1/object/public/exports/ocr_export_abc123.json",
  "format": "json",
  "size_bytes": 4280,
  "expires_at": "2026-07-23T12:00:00Z",
  "credits_used": 0
}
```

For `format: "csv"`:
```json
{
  "export_url": "https://s1.fotohub.app/storage/v1/object/public/exports/ocr_export_abc123.csv",
  "format": "csv",
  "size_bytes": 2140,
  "expires_at": "2026-07-23T12:00:00Z",
  "credits_used": 0
}
```

### Examples

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

# First, run OCR
ocr_result = client.document.ocr(image=image_b64)

# Then export as CSV
export = client.document.export(
    job_id=ocr_result.job_id,
    format="csv",
    include_confidence=True
)

print(f"Download: {export.export_url}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_..." });

// First, run OCR
const ocrResult = await client.document.ocr({ image: imageB64 });

// Then export as CSV
const exportResult = await client.document.export({
  jobId: ocrResult.jobId,
  format: "csv",
  includeConfidence: true,
});

console.log(`Download: ${exportResult.exportUrl}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/document/export" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "ocr_job_abc123",
    "format": "csv",
    "include_confidence": true
  }'
```

:::

---

## Invoice Extraction

Extract structured data from invoices and receipts. Returns vendor details, dates, totals, tax breakdowns, line items, and payment information in a normalized schema.

### Endpoint

```
POST /v1/ai/document/invoice
```

**Billing:** 3 credits per document

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image` | string | **Yes** | — | Base64-encoded invoice/receipt image or URL. Max 10MB. |
| `extract_line_items` | boolean | No | `true` | Extract individual line items with quantities and prices. |
| `currency_hint` | string | No | auto-detect | ISO 4217 currency code hint, e.g. `"PLN"`, `"USD"`, `"EUR"`. |

### Response Schema

```json
{
  "invoice": {
    "vendor": {
      "name": "FOTOhub sp. z o.o.",
      "address": "ul. Mokotowska 15, 00-640 Warszawa",
      "tax_id": "PL5213900482",
      "confidence": 97.5
    },
    "customer": {
      "name": "Acme Corp Sp. z o.o.",
      "address": "ul. Nowy Swiat 42, 00-363 Warszawa",
      "tax_id": "PL1234567890",
      "confidence": 96.8
    },
    "details": {
      "invoice_number": "FH-2026/07/0147",
      "issue_date": "2026-07-22",
      "due_date": "2026-08-05",
      "payment_method": "bank_transfer",
      "bank_account": "PL 12 1234 5678 9012 3456 7890 1234"
    },
    "totals": {
      "subtotal": { "amount": 1249.00, "currency": "PLN" },
      "tax": { "amount": 287.27, "currency": "PLN", "rate": "23%" },
      "total": { "amount": 1536.27, "currency": "PLN" },
      "paid": { "amount": 0.00, "currency": "PLN" },
      "due": { "amount": 1536.27, "currency": "PLN" }
    },
    "line_items": [
      {
        "description": "AI Credits Bundle (5000)",
        "quantity": 1,
        "unit_price": { "amount": 999.00, "currency": "PLN" },
        "total": { "amount": 999.00, "currency": "PLN" },
        "confidence": 98.3
      },
      {
        "description": "Cloud Storage 500GB (monthly)",
        "quantity": 1,
        "unit_price": { "amount": 250.00, "currency": "PLN" },
        "total": { "amount": 250.00, "currency": "PLN" },
        "confidence": 97.9
      }
    ]
  },
  "document_type": "invoice",
  "detected_language": "pl",
  "overall_confidence": 97.6,
  "credits_used": 3
}
```

### Examples

::: code-group

```python [Python]
import base64
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

with open("invoice.pdf", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

result = client.document.invoice(
    image=image_b64,
    extract_line_items=True,
    currency_hint="PLN"
)

inv = result.invoice
print(f"Vendor: {inv.vendor.name}")
print(f"Invoice #: {inv.details.invoice_number}")
print(f"Total: {inv.totals.total.amount} {inv.totals.total.currency}")
print(f"Due date: {inv.details.due_date}")

print("\nLine items:")
for item in inv.line_items:
    print(f"  {item.description}: {item.total.amount} {item.total.currency}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_..." });

const imageB64 = readFileSync("invoice.pdf").toString("base64");

const result = await client.document.invoice({
  image: imageB64,
  extractLineItems: true,
  currencyHint: "PLN",
});

const inv = result.invoice;
console.log(`Vendor: ${inv.vendor.name}`);
console.log(`Invoice #: ${inv.details.invoiceNumber}`);
console.log(`Total: ${inv.totals.total.amount} ${inv.totals.total.currency}`);

for (const item of inv.lineItems) {
  console.log(`  ${item.description}: ${item.total.amount} ${item.total.currency}`);
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/document/invoice" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "BASE64_ENCODED_INVOICE...",
    "extract_line_items": true,
    "currency_hint": "PLN"
  }'
```

:::

---

## Analyze — Full Document Analysis

Comprehensive document analysis with layout detection, table extraction, form field recognition, and signature detection. Best for complex, multi-section documents.

### Endpoint

```
POST /v1/ai/document/analyze
```

**Billing:** 2 credits per page

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image` | string | **Yes** | — | Base64-encoded document image or URL. Max 10MB. |
| `features` | array | No | `["TEXT", "TABLES", "FORMS"]` | Features to extract. Options: `"TEXT"`, `"TABLES"`, `"FORMS"`, `"SIGNATURES"`, `"LAYOUT"`. |
| `language_hints` | array | No | auto-detect | ISO 639-1 codes to prioritize specific languages. |

### Response

```json
{
  "text": "Complete extracted text from the document...",
  "lines": [
    { "text": "Section 1: Agreement Terms", "confidence": 99.4, "type": "HEADING" },
    { "text": "This agreement is entered into...", "confidence": 98.7, "type": "PARAGRAPH" }
  ],
  "layout": {
    "sections": [
      { "type": "HEADER", "bounding_box": { "x": 0, "y": 0, "width": 800, "height": 60 } },
      { "type": "TABLE", "bounding_box": { "x": 40, "y": 200, "width": 720, "height": 300 } },
      { "type": "SIGNATURE_BLOCK", "bounding_box": { "x": 40, "y": 900, "width": 300, "height": 80 } }
    ]
  },
  "tables": [
    {
      "rows": [
        ["Service", "Period", "Amount"],
        ["AI Credits", "July 2026", "999.00 PLN"],
        ["Storage", "July 2026", "250.00 PLN"]
      ],
      "headers_detected": true,
      "confidence": 97.8
    }
  ],
  "forms": [
    { "key": "Company Name", "value": "FOTOhub sp. z o.o.", "confidence": 98.5 },
    { "key": "Registration Number", "value": "KRS 0000912345", "confidence": 97.2 }
  ],
  "signatures": [
    {
      "detected": true,
      "bounding_box": { "x": 50, "y": 910, "width": 180, "height": 60 },
      "confidence": 94.3
    }
  ],
  "total_blocks": 87,
  "credits_used": 2
}
```

### Examples

::: code-group

```python [Python]
import base64
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

with open("contract.pdf", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

result = client.document.analyze(
    image=image_b64,
    features=["TEXT", "TABLES", "FORMS", "SIGNATURES", "LAYOUT"]
)

# Full text
print(result.text)

# Tables
for table in result.tables:
    print("\n--- Table ---")
    for row in table.rows:
        print(" | ".join(row))

# Form fields
print("\n--- Form Fields ---")
for field in result.forms:
    print(f"{field.key}: {field.value}")

# Signatures
for sig in result.signatures:
    if sig.detected:
        print(f"Signature found at ({sig.bounding_box.x}, {sig.bounding_box.y})")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import { readFileSync } from "fs";

const client = new FotoHub({ apiKey: "fh_live_..." });

const imageB64 = readFileSync("contract.pdf").toString("base64");

const result = await client.document.analyze({
  image: imageB64,
  features: ["TEXT", "TABLES", "FORMS", "SIGNATURES", "LAYOUT"],
});

// Tables
for (const table of result.tables) {
  console.log("\n--- Table ---");
  for (const row of table.rows) {
    console.log(row.join(" | "));
  }
}

// Form fields
for (const field of result.forms) {
  console.log(`${field.key}: ${field.value}`);
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/document/analyze" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "BASE64_ENCODED_DOCUMENT...",
    "features": ["TEXT", "TABLES", "FORMS", "SIGNATURES", "LAYOUT"]
  }'
```

:::

---

## Supported Languages

FOTOhub OCR supports 40+ languages for text detection. Language detection is automatic, but you can provide hints for improved accuracy on multilingual documents.

| Language | Code | Language | Code | Language | Code |
|----------|------|----------|------|----------|------|
| English | `en` | Polish | `pl` | German | `de` |
| French | `fr` | Spanish | `es` | Italian | `it` |
| Portuguese | `pt` | Dutch | `nl` | Swedish | `sv` |
| Norwegian | `no` | Danish | `da` | Finnish | `fi` |
| Czech | `cs` | Slovak | `sk` | Hungarian | `hu` |
| Romanian | `ro` | Bulgarian | `bg` | Croatian | `hr` |
| Serbian | `sr` | Slovenian | `sl` | Ukrainian | `uk` |
| Russian | `ru` | Greek | `el` | Turkish | `tr` |
| Arabic | `ar` | Hebrew | `he` | Hindi | `hi` |
| Thai | `th` | Vietnamese | `vi` | Indonesian | `id` |
| Malay | `ms` | Japanese | `ja` | Chinese (Simplified) | `zh-CN` |
| Chinese (Traditional) | `zh-TW` | Korean | `ko` | Bengali | `bn` |
| Tamil | `ta` | Telugu | `te` | Marathi | `mr` |
| Gujarati | `gu` | Kannada | `kn` | Malayalam | `ml` |
| Punjabi | `pa` | Urdu | `ur` | | |

---

## Pricing

| Operation | Credits | Provider Cost | Best For |
|-----------|---------|---------------|----------|
| OCR (text detection) | 1 | $0.0015/page | Simple text extraction, receipts, labels |
| Redact (PII masking) | 2 | $0.003/page | GDPR compliance, data anonymization |
| PDF to Images | 1/page | $0.001/page | PDF preprocessing for OCR pipeline |
| Batch OCR | 1/image | $0.0015/image | Bulk digitization, archives |
| Export | Free | — | Downloading results in structured formats |
| Invoice extraction | 3 | $0.01/page | Accounting automation, expense tracking |
| Document analysis | 2 | $0.005/page | Complex documents, contracts, forms |

::: tip Volume Discounts
Processing over 1,000 documents per month? Contact sales@fotohub.app for volume pricing with up to 40% discounts.
:::

---

## Use Cases

### Document Digitization
Convert paper archives, scanned books, and legacy documents into searchable, indexed text. Use batch OCR for high-volume processing with export to CSV for database import.

### Compliance & Data Privacy
Automatically redact PII from documents before sharing or archiving. Detect names, emails, phone numbers, SSNs, and addresses. Meets GDPR Article 17 (right to erasure) and Article 25 (data protection by design) requirements.

### Financial Data Extraction
Process invoices, receipts, and expense reports at scale. Extract vendor names, amounts, dates, tax IDs, and line items into structured JSON for direct integration with accounting systems (SAP, QuickBooks, Xero).

### Accessibility
Convert image-based documents into machine-readable text for screen readers and assistive technology. Supports 40+ languages for international accessibility compliance (WCAG 2.1, Section 508).

### Form Processing
Digitize paper forms, applications, and surveys. The analyze endpoint detects form fields (key-value pairs) and checkbox states, enabling automated data entry workflows.

### Contract Analysis
Extract key terms, signature blocks, dates, and party names from contracts. Use layout detection to identify sections, tables of terms, and signature positions.

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `invalid_image` | Image could not be decoded. Verify base64 encoding or URL accessibility. |
| 400 | `unsupported_format` | File format not supported. Use JPEG, PNG, TIFF, WebP, BMP, or PDF. |
| 400 | `document_too_large` | File exceeds 10MB limit. Compress or split the document. |
| 400 | `batch_limit_exceeded` | Batch contains more than 100 images. Split into smaller batches. |
| 400 | `invalid_job_id` | Export job ID not found or expired. Job results expire after 24 hours. |
| 400 | `invalid_page_range` | PDF page range is invalid or exceeds document page count. |
| 402 | `insufficient_credits` | Not enough credits for this operation. Top up at fotohub.app/billing. |
| 413 | `payload_too_large` | Request body exceeds maximum size. Reduce image count or resolution. |
| 429 | `rate_limited` | Too many requests. Default: 60 requests/minute. See [Rate Limits](/api/rate-limits). |
| 500 | `ocr_failed` | Internal OCR engine error. Retry after a few seconds. |
| 503 | `service_unavailable` | OCR service temporarily unavailable. Check [status.fotohub.app](https://status.fotohub.app). |

---

## Rate Limits

| Tier | Requests/min | Batch size | Concurrent |
|------|-------------|------------|------------|
| Free | 10 | 10 images | 2 |
| Pro | 60 | 50 images | 10 |
| Business | 200 | 100 images | 25 |
| Enterprise | Custom | Custom | Custom |

See [Rate Limits](/api/rate-limits) for full details on tier-specific limits and retry strategies.
