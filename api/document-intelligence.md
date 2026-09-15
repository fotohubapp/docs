# Document Intelligence API

Extract text, structured tables, form fields, key-value pairs, invoices, receipts, and PII from documents and images using AI-powered OCR, AWS Textract, and vision language models.

All operations are billed directly in **USD** from your prepaid wallet. No credits, no token packs, no PLN.

**Base URL:** `https://apis.fotohub.app`

**Supported formats:** PDF, JPEG, PNG, TIFF, WEBP, DOCX (max 20MB per document, multi-page PDFs supported)

---

## Endpoint Overview

| Method | Endpoint | Cost | Description |
|:---|:---|:---|:---|
| `POST` | `/v1/ai/document/detect-text` | $0.005/page | Fast OCR — plain text extraction |
| `POST` | `/v1/ai/document/analyze` | $0.015/page | Tables + forms + key-value + signatures |
| `POST` | `/v1/ai/document/analyze-expense` | $0.012/document | Invoice/receipt structured extraction |
| `POST` | `/v1/documents/extract` | $0.005/page | URL-based OCR with structured JSON output |
| `POST` | `/v1/documents/redact` | $0.008/page | PII redaction (names, emails, SSNs, cards) |
| `POST` | `/v1/documents/classify` | $0.003/document | Document type classification |
| `POST` | `/v1/documents/batch` | $0.004/document | Async bulk processing of multiple documents |
| `GET` | `/v1/documents/batch/{batch_id}` | Free | Poll batch job status |
| `POST` | `/v1/textract/analyze` | $0.015/page | AWS Textract: complex forms, tables, handwriting |

---

## Detect Text (OCR)

Simple, fast text extraction from images and single-page documents.

**Cost:** $0.005 per page

### Request

```
POST /v1/ai/document/detect-text
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json
```

### Parameters

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `document` | string | **Yes** | — | Base64-encoded document (PDF/image), max 20MB |
| `document_url` | string | Conditional | — | Public URL alternative to base64 upload |
| `language_hints` | string[] | No | `["en"]` | ISO 639-1 language codes to improve accuracy |
| `output_format` | string | No | `"json"` | Response format: `"json"` or `"text"` |

### Response

```json
{
  "text": "FOTOhub Invoice #2026-07-001\nDate: 2026-07-19\nCustomer: Acme Corporation\nTotal: $142.50 USD",
  "lines": [
    { "text": "FOTOhub Invoice #2026-07-001", "confidence": 99.8, "page": 1 },
    { "text": "Date: 2026-07-19", "confidence": 99.5, "page": 1 },
    { "text": "Customer: Acme Corporation", "confidence": 99.1, "page": 1 }
  ],
  "total_lines": 12,
  "pages_processed": 1,
  "usd_charged": 0.005,
  "processing_ms": 420
}
```

### Code Examples

::: code-group

```python [Python]
import base64
import httpx

api_key = "fh_live_your_api_key"

with open("invoice.png", "rb") as f:
    doc_b64 = base64.b64encode(f.read()).decode()

response = httpx.post(
    "https://apis.fotohub.app/v1/ai/document/detect-text",
    headers={"Authorization": f"Bearer {api_key}"},
    json={"document": doc_b64, "language_hints": ["en"]}
)

result = response.json()
print(result["text"])
print(f"Cost: ${result['usd_charged']:.4f}")
```

```typescript [TypeScript]
import fs from 'fs';

const doc = fs.readFileSync('invoice.png').toString('base64');

const response = await fetch('https://apis.fotohub.app/v1/ai/document/detect-text', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer fh_live_your_api_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    document: doc,
    language_hints: ['en'],
  }),
});

const result = await response.json();
console.log(result.text);
console.log(`Cost: $${result.usd_charged}`);
```

```go [Go]
package main

import (
    "bytes"
    "encoding/base64"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

func main() {
    fileBytes, _ := os.ReadFile("invoice.png")
    docB64 := base64.StdEncoding.EncodeToString(fileBytes)

    body, _ := json.Marshal(map[string]interface{}{
        "document":       docB64,
        "language_hints": []string{"en"},
    })

    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/ai/document/detect-text", bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
    req.Header.Set("Content-Type", "application/json")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    result, _ := io.ReadAll(resp.Body)
    fmt.Println(string(result))
}
```

```bash [cURL]
# Base64 encode the document then submit
DOC_B64=$(base64 -w 0 invoice.png)
curl -X POST "https://apis.fotohub.app/v1/ai/document/detect-text" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"document\": \"$DOC_B64\"}" | jq '{text, usd_charged}'

# Or use a public URL directly
curl -X POST "https://apis.fotohub.app/v1/ai/document/detect-text" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"document_url": "https://storage.fotohub.app/docs/invoice.pdf"}'
```

:::

---

## Analyze Document (Tables + Forms)

Advanced analysis with table extraction, form key-value pairs, signature detection, and structural layout mapping.

**Cost:** $0.015 per page

### Parameters

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `document` | string | **Yes** | — | Base64-encoded document (PDF/image), max 20MB |
| `document_url` | string | Conditional | — | Public URL alternative |
| `features` | string[] | No | `["TABLES", "FORMS"]` | Features: `"TABLES"`, `"FORMS"`, `"SIGNATURES"`, `"LAYOUT"`, `"CHECKBOXES"` |
| `pages` | integer[] | No | all | Specific page numbers to analyze (1-indexed) |
| `output_format` | string | No | `"json"` | Response format |

### Response

```json
{
  "text": "Full text content of the document...",
  "lines": [
    { "text": "Invoice Number: FH-2026-1001", "confidence": 99.2, "page": 1 }
  ],
  "tables": [
    {
      "page": 1,
      "rows": [
        ["Item", "Quantity", "Unit Price", "Total"],
        ["Seedream Image Generation (1000 images)", "1", "$45.00", "$45.00"],
        ["Seedance Video Generation (50 clips)", "1", "$12.00", "$12.00"],
        ["Cloud Storage (50 GB/month)", "1", "$1.23", "$1.23"]
      ],
      "confidence": 98.7
    }
  ],
  "key_values": [
    { "key": "Invoice Number", "value": "FH-2026-1001", "confidence": 99.1 },
    { "key": "Date", "value": "2026-07-19", "confidence": 99.5 },
    { "key": "Customer", "value": "Acme Corporation", "confidence": 98.8 },
    { "key": "Due Date", "value": "2026-08-19", "confidence": 97.3 }
  ],
  "signatures": [],
  "checkboxes": [
    { "label": "I agree to Terms & Conditions", "checked": true, "confidence": 95.0 }
  ],
  "total_blocks": 142,
  "pages_processed": 1,
  "usd_charged": 0.015,
  "processing_ms": 1240
}
```

### Code Examples

::: code-group

```python [Python]
import base64
import httpx

api_key = "fh_live_your_api_key"

with open("form.pdf", "rb") as f:
    doc_b64 = base64.b64encode(f.read()).decode()

result = httpx.post(
    "https://apis.fotohub.app/v1/ai/document/analyze",
    headers={"Authorization": f"Bearer {api_key}"},
    json={
        "document": doc_b64,
        "features": ["TABLES", "FORMS", "SIGNATURES", "CHECKBOXES"]
    }
).json()

# Print extracted tables
for table in result["tables"]:
    print(f"Table on page {table['page']}:")
    for row in table["rows"]:
        print("  " + " | ".join(row))

# Print form fields
for kv in result["key_values"]:
    print(f"  {kv['key']}: {kv['value']} (confidence: {kv['confidence']:.1f}%)")

print(f"\nCost: ${result['usd_charged']:.4f}")
```

```typescript [TypeScript]
import fs from 'fs';

const doc = fs.readFileSync('form.pdf').toString('base64');

const result = await fetch('https://apis.fotohub.app/v1/ai/document/analyze', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer fh_live_your_api_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    document: doc,
    features: ['TABLES', 'FORMS', 'CHECKBOXES'],
  }),
}).then(r => r.json());

// Export tables as CSV-like structure
for (const table of result.tables) {
  console.log(`Table (page ${table.page}):`);
  for (const row of table.rows) {
    console.log(row.join('\t'));
  }
}
```

```bash [cURL]
DOC_B64=$(base64 -w 0 form.pdf)
curl -X POST "https://apis.fotohub.app/v1/ai/document/analyze" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{
    \"document\": \"$DOC_B64\",
    \"features\": [\"TABLES\", \"FORMS\", \"SIGNATURES\"]
  }" | jq '.key_values'
```

:::

---

## Analyze Expense (Invoice & Receipt Extraction)

Specialized extraction for invoices, receipts, and expense documents. Returns vendor info, line items, totals, tax, and dates in a richly structured format optimized for accounting workflows.

**Cost:** $0.012 per document

### Parameters

| Parameter | Type | Required | Description |
|:---|:---|:---|:---|
| `document` | string | **Yes** | Base64-encoded invoice/receipt. Max 20MB. |
| `document_url` | string | Conditional | Public URL alternative to base64 upload |
| `currency_hint` | string | No | ISO 4217 currency code hint (e.g. `"USD"`, `"EUR"`) |

### Response

```json
{
  "expenses": [
    {
      "summary": {
        "VENDOR_NAME": { "value": "Acme Cloud Services Inc.", "confidence": 98.7 },
        "VENDOR_ADDRESS": { "value": "123 Tech Drive, San Francisco, CA 94105", "confidence": 95.2 },
        "INVOICE_RECEIPT_DATE": { "value": "2026-07-19", "confidence": 99.1 },
        "DUE_DATE": { "value": "2026-08-19", "confidence": 97.5 },
        "INVOICE_RECEIPT_ID": { "value": "INV-2026-4821", "confidence": 99.3 },
        "TOTAL": { "value": "$142.50", "confidence": 99.5 },
        "TAX": { "value": "$12.50", "confidence": 98.2 },
        "SUBTOTAL": { "value": "$130.00", "confidence": 99.0 },
        "PAYMENT_TERMS": { "value": "Net 30", "confidence": 94.1 }
      },
      "line_items": [
        { "ITEM": "GPU Compute Hours (A10G, 4 hours)", "QUANTITY": "4", "UNIT_PRICE": "$2.50", "PRICE": "$10.00" },
        { "ITEM": "Image Generation API (2,000 images)", "QUANTITY": "1", "UNIT_PRICE": "$90.00", "PRICE": "$90.00" },
        { "ITEM": "S3 Storage (100 GB/month)", "QUANTITY": "1", "UNIT_PRICE": "$2.45", "PRICE": "$2.45" },
        { "ITEM": "Data Transfer (500 GB)", "QUANTITY": "1", "UNIT_PRICE": "$27.55", "PRICE": "$27.55" }
      ]
    }
  ],
  "document_count": 1,
  "usd_charged": 0.012,
  "processing_ms": 890
}
```

### Code Examples

::: code-group

```python [Python]
import base64
import httpx

api_key = "fh_live_your_api_key"

with open("invoice.jpg", "rb") as f:
    doc_b64 = base64.b64encode(f.read()).decode()

result = httpx.post(
    "https://apis.fotohub.app/v1/ai/document/analyze-expense",
    headers={"Authorization": f"Bearer {api_key}"},
    json={"document": doc_b64, "currency_hint": "USD"}
).json()

for expense in result["expenses"]:
    summary = expense["summary"]
    print(f"Vendor: {summary['VENDOR_NAME']['value']}")
    print(f"Invoice: {summary['INVOICE_RECEIPT_ID']['value']}")
    print(f"Total: {summary['TOTAL']['value']}")
    print(f"Date: {summary['INVOICE_RECEIPT_DATE']['value']}")
    print("\nLine Items:")
    for item in expense["line_items"]:
        print(f"  {item.get('ITEM', '?')} × {item.get('QUANTITY', '1')} = {item.get('PRICE', '?')}")

print(f"\nExtraction cost: ${result['usd_charged']:.4f}")
```

```typescript [TypeScript]
import fs from 'fs';

const doc = fs.readFileSync('invoice.jpg').toString('base64');

const result = await fetch('https://apis.fotohub.app/v1/ai/document/analyze-expense', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer fh_live_your_api_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ document: doc, currency_hint: 'USD' }),
}).then(r => r.json());

// Map to a flat invoice object for ERP ingestion
const invoice = {
  vendor: result.expenses[0].summary.VENDOR_NAME.value,
  invoiceId: result.expenses[0].summary.INVOICE_RECEIPT_ID.value,
  date: result.expenses[0].summary.INVOICE_RECEIPT_DATE.value,
  total: result.expenses[0].summary.TOTAL.value,
  lineItems: result.expenses[0].line_items,
};

console.log(JSON.stringify(invoice, null, 2));
```

```bash [cURL]
DOC_B64=$(base64 -w 0 invoice.jpg)
curl -X POST "https://apis.fotohub.app/v1/ai/document/analyze-expense" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"document\": \"$DOC_B64\"}" | jq '.expenses[0].summary'
```

:::

---

## URL-Based Document Extraction

Extract text from a publicly accessible document URL without base64 encoding. Ideal for processing documents already stored in S3, Google Drive, or CDN.

**Cost:** $0.005 per page

```
POST /v1/documents/extract
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json
```

```json
{
  "url": "https://storage.fotohub.app/docs/contract.pdf",
  "output_format": "json",
  "include_layout": true,
  "pages": [1, 2, 3]
}
```

::: code-group

```python [Python]
import httpx

result = httpx.post(
    "https://apis.fotohub.app/v1/documents/extract",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
    json={
        "url": "https://storage.fotohub.app/docs/contract.pdf",
        "output_format": "json",
        "include_layout": True
    }
).json()

print(f"Extracted {result['pages_processed']} pages, ${result['usd_charged']:.4f} charged")
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/documents/extract" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://storage.fotohub.app/docs/contract.pdf",
    "include_layout": true
  }' | jq '.text'
```

:::

---

## PII Redaction

Automatically detect and redact personally identifiable information from documents before storage or sharing.

**Cost:** $0.008 per page

### PII Entity Types Supported

| Entity Type | Examples |
|:---|:---|
| `PERSON` | Names, titles |
| `EMAIL` | email@domain.com |
| `PHONE` | +1-555-123-4567 |
| `SSN` | 123-45-6789 |
| `CREDIT_CARD` | 4111 1111 1111 1111 |
| `IBAN` | DE89370400440532013000 |
| `DATE_OF_BIRTH` | 15/03/1985 |
| `PASSPORT` | AB1234567 |
| `DRIVER_LICENSE` | D1234567 |
| `IP_ADDRESS` | 192.168.1.1 |
| `MEDICAL_ID` | Patient record numbers |

### Request

```
POST /v1/documents/redact
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json
```

```json
{
  "document_url": "https://storage.fotohub.app/docs/patient_record.pdf",
  "redact_entities": ["PERSON", "EMAIL", "PHONE", "SSN", "DATE_OF_BIRTH"],
  "redaction_style": "black_box",
  "output_format": "pdf"
}
```

| Parameter | Type | Default | Description |
|:---|:---|:---|:---|
| `document_url` | string | — | URL of document to redact |
| `document` | string | — | Base64-encoded alternative |
| `redact_entities` | string[] | all | Entity types to redact |
| `redaction_style` | string | `"black_box"` | `"black_box"`, `"white_box"`, `"asterisks"`, `"lorem"` |
| `output_format` | string | `"pdf"` | Output format: `"pdf"`, `"png"`, `"json"` (returns redacted text) |

::: code-group

```python [Python]
import httpx

result = httpx.post(
    "https://apis.fotohub.app/v1/documents/redact",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
    json={
        "document_url": "https://storage.fotohub.app/docs/patient_record.pdf",
        "redact_entities": ["PERSON", "EMAIL", "SSN", "DATE_OF_BIRTH"],
        "redaction_style": "black_box",
        "output_format": "pdf"
    }
).json()

print(f"Redacted document URL: {result['redacted_url']}")
print(f"Entities found: {result['entities_found']}")
print(f"Cost: ${result['usd_charged']:.4f}")
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/documents/redact" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "document_url": "https://storage.fotohub.app/docs/employee_form.pdf",
    "redact_entities": ["PERSON", "SSN", "EMAIL"],
    "redaction_style": "black_box"
  }' | jq '{redacted_url, entities_found, usd_charged}'
```

:::

---

## Document Classification

Automatically classify document type for routing and workflow automation.

**Cost:** $0.003 per document

### Supported Document Categories

| Category | Examples |
|:---|:---|
| `invoice` | Vendor invoices, purchase orders |
| `receipt` | Store receipts, expense receipts |
| `contract` | Service agreements, NDAs, leases |
| `id_card` | Driver's license, passport, national ID |
| `medical_record` | Lab results, prescriptions |
| `bank_statement` | Account statements, wire confirmations |
| `tax_form` | W-2, 1099, VAT returns |
| `shipping_label` | FedEx, DHL, UPS labels |
| `resume` | CVs, resumes |
| `other` | Unrecognized document type |

```bash
curl -X POST "https://apis.fotohub.app/v1/documents/classify" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "document_url": "https://storage.fotohub.app/docs/unknown_doc.pdf"
  }'
```

Response:
```json
{
  "category": "invoice",
  "confidence": 97.3,
  "subcategory": "vendor_invoice",
  "suggested_workflow": "accounts_payable",
  "usd_charged": 0.003
}
```

---

## Batch Document Processing

Process multiple documents asynchronously. Returns a `batch_id` immediately; poll for completion.

**Cost:** $0.004 per document (base rate, operations add on top)

### Submit Batch

```
POST /v1/documents/batch
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json
```

```json
{
  "documents": [
    { "url": "https://storage.fotohub.app/docs/invoice_001.pdf", "operation": "extract" },
    { "url": "https://storage.fotohub.app/docs/invoice_002.pdf", "operation": "extract" },
    { "url": "https://storage.fotohub.app/docs/contract.pdf", "operation": "analyze", "features": ["TABLES", "FORMS"] }
  ],
  "webhook_url": "https://api.yourapp.com/webhooks/fotohub",
  "webhook_secret": "whsec_your_secret",
  "output_destination": {
    "type": "s3",
    "bucket": "your-bucket",
    "prefix": "extracted-docs/",
    "region": "us-east-1"
  }
}
```

Response (`202 Accepted`):
```json
{
  "batch_id": "batch_abc123xyz",
  "total_documents": 3,
  "estimated_completion_s": 45,
  "estimated_cost_usd": 0.037,
  "status": "queued"
}
```

### Poll Batch Status

```bash
curl "https://apis.fotohub.app/v1/documents/batch/batch_abc123xyz" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

```json
{
  "batch_id": "batch_abc123xyz",
  "status": "completed",
  "total": 3,
  "completed": 3,
  "failed": 0,
  "usd_charged": 0.037,
  "results": [
    {
      "document_url": "https://storage.fotohub.app/docs/invoice_001.pdf",
      "status": "success",
      "output_url": "s3://your-bucket/extracted-docs/invoice_001_result.json"
    },
    {
      "document_url": "https://storage.fotohub.app/docs/invoice_002.pdf",
      "status": "success",
      "output_url": "s3://your-bucket/extracted-docs/invoice_002_result.json"
    },
    {
      "document_url": "https://storage.fotohub.app/docs/contract.pdf",
      "status": "success",
      "output_url": "s3://your-bucket/extracted-docs/contract_result.json"
    }
  ]
}
```

### Batch Processing in Python (50 Documents)

```python
import asyncio
import httpx
import time

API_KEY = "fh_live_your_api_key"
BASE = "https://apis.fotohub.app"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

async def process_invoice_batch(invoice_urls: list[str]) -> dict:
    """Submit a batch of invoices and wait for completion."""
    async with httpx.AsyncClient() as client:
        # Submit batch
        batch_response = await client.post(
            f"{BASE}/v1/documents/batch",
            headers=HEADERS,
            json={
                "documents": [
                    {"url": url, "operation": "analyze-expense"}
                    for url in invoice_urls
                ],
                "webhook_url": "https://api.yourapp.com/webhooks/fotohub"
            }
        )
        batch = batch_response.json()
        batch_id = batch["batch_id"]
        print(f"Batch {batch_id} submitted: {len(invoice_urls)} documents, estimated ${batch['estimated_cost_usd']:.3f}")

        # Poll until complete
        while True:
            status_resp = await client.get(
                f"{BASE}/v1/documents/batch/{batch_id}",
                headers=HEADERS
            )
            status = status_resp.json()

            print(f"  Progress: {status['completed']}/{status['total']} ({status['status']})")

            if status["status"] in ("completed", "failed", "partial"):
                return status

            await asyncio.sleep(5)

# Process 50 invoices
invoice_urls = [f"https://storage.fotohub.app/invoices/inv_{i:03d}.pdf" for i in range(1, 51)]
result = asyncio.run(process_invoice_batch(invoice_urls))
print(f"\nDone: {result['completed']} processed, ${result['usd_charged']:.4f} charged")
```

---

## AWS Textract Wrapper

For complex handwritten forms, ID cards, and specialized document types, the Textract endpoint provides AWS Textract's advanced analysis capabilities.

**Cost:** $0.015 per page

```
POST /v1/textract/analyze
Authorization: Bearer fh_live_your_api_key
Content-Type: application/json
```

```json
{
  "document_url": "https://storage.fotohub.app/docs/handwritten_form.jpg",
  "feature_types": ["TABLES", "FORMS", "SIGNATURES"],
  "queries": [
    { "text": "What is the patient's date of birth?" },
    { "text": "What medications are listed?" }
  ]
}
```

::: code-group

```python [Python]
import httpx

result = httpx.post(
    "https://apis.fotohub.app/v1/textract/analyze",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
    json={
        "document_url": "https://storage.fotohub.app/docs/tax_form_w2.jpg",
        "feature_types": ["FORMS", "TABLES"],
        "queries": [
            {"text": "What is the employer EIN?"},
            {"text": "What is the federal income tax withheld?"}
        ]
    }
).json()

# Key-value pairs extracted
for kv in result.get("key_values", []):
    if kv["confidence"] > 90:
        print(f"  {kv['key']}: {kv['value']}")

print(f"\nCost: ${result['usd_charged']:.4f}")
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/textract/analyze" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "document_url": "https://storage.fotohub.app/docs/medical_intake_form.jpg",
    "feature_types": ["FORMS", "SIGNATURES"]
  }' | jq '.key_values | map(select(.confidence > 90))'
```

:::

---

## Pricing Summary

| Operation | Cost | Provider Backend |
|:---|:---|:---|
| OCR (detect-text) | $0.005/page | Vision LLM |
| Analyze (tables + forms) | $0.015/page | AWS Textract |
| Analyze Expense (invoices) | $0.012/document | AWS Textract |
| URL Extraction | $0.005/page | Vision LLM |
| PII Redaction | $0.008/page | AWS Comprehend + Vision |
| Classification | $0.003/document | Claude + Vision |
| Batch (base fee) | $0.004/document | Async queue |
| Textract Advanced | $0.015/page | AWS Textract |

::: tip Cost-Efficient Patterns
- For plain text only: use `detect-text` ($0.005) not `analyze` ($0.015)
- For high-volume batches: use `POST /v1/documents/batch` — it includes BYOB S3 delivery, saving egress fees
- For simple invoices: `analyze-expense` at $0.012 often gives better results than general `analyze` at $0.015
:::

---

## Error Responses

| HTTP Status | Code | Description |
|:---|:---|:---|
| `400` | `unsupported_format` | Document format not supported. Use PDF, JPEG, PNG, TIFF, WEBP, or DOCX. |
| `400` | `document_too_large` | File exceeds 20MB limit. Compress or split the document. |
| `400` | `too_many_pages` | PDF has more than 500 pages. Split into multiple requests. |
| `402` | `INSUFFICIENT_FUNDS` | Wallet balance insufficient for this operation. Top up at [fotohub.app/console/billing](https://fotohub.app/console/billing). |
| `422` | `unreadable_document` | Document is corrupted, password-protected, or too low resolution (min 150 DPI). |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many document requests per minute. Implement exponential backoff. |
| `503` | `service_unavailable` | Temporary backend outage. Retry after 30 seconds. |

::: warning INSUFFICIENT_FUNDS
If you see a `402 INSUFFICIENT_FUNDS` error, your prepaid USD wallet balance is too low for the requested operation. Top up at [fotohub.app/console/billing](https://fotohub.app/console/billing). There are no credits or subscription plans that can substitute for wallet balance.
:::
