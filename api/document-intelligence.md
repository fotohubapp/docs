# Document Intelligence API

Extract text, tables, form key-value pairs, and structured invoice/receipt
data from documents and images, backed by AWS Textract.

::: warning First-party only — not reachable with an `fh_live_*` API key
All three routes on this page authenticate with `verify_jwt`: a Supabase
**user session JWT**, the same token the FOTOhub web app itself uses. They do
not accept an `fh_live_*` developer API key. If you only hold an API key,
these endpoints will return `401` no matter what you send — there is
currently no document-intelligence capability on the public, third-party
`fh_live_*` surface.

This page previously also documented `POST /v1/documents/extract`,
`POST /v1/documents/redact`, `POST /v1/documents/classify`,
`POST /v1/documents/batch`, `GET /v1/documents/batch/{batch_id}`, and
`POST /v1/textract/analyze`. None of those routes exist — they all return
`404` in production. There is no PII redaction, document classification,
async batch processing, or URL-based extraction endpoint anywhere on the
API. The three endpoints below are the entire document-intelligence surface.
:::

**Base URL:** `https://apis.fotohub.app`

**Auth:** `Authorization: Bearer <supabase_user_jwt>` (not an API key)

**Supported formats:** PDF, JPEG, PNG, TIFF — max **10 MB** per document

---

## Endpoint Overview

| Method | Endpoint | Cost | Description |
|:---|:---|:---|:---|
| `POST` | `/v1/ai/document/detect-text` | $0.0015/page | Plain-text OCR, no layout analysis |
| `POST` | `/v1/ai/document/analyze` | $0.015/page | Tables + form key-value pairs |
| `POST` | `/v1/ai/document/analyze-expense` | $0.01/page | Invoice/receipt structured extraction |

---

## Detect Text (OCR)

Plain text extraction, no structural analysis.

```http
POST /v1/ai/document/detect-text
Authorization: Bearer <supabase_user_jwt>
Content-Type: application/json
```

### Body

| Parameter | Type | Required | Description |
|:---|:---|:---|:---|
| `document` | string | **Yes** | Base64-encoded document (PDF/JPEG/PNG/TIFF), max 10 MB. |

### Response

```json
{
  "text": "FOTOhub Invoice #2026-07-001\nDate: 2026-07-19\nTotal: $142.50 USD",
  "lines": [
    { "text": "FOTOhub Invoice #2026-07-001", "confidence": 99.8 },
    { "text": "Date: 2026-07-19", "confidence": 99.5 }
  ],
  "total_lines": 12,
  "cost_usd": 0.0015,
  "currency": "USD",
  "billing": { "cost_usd": 0.0015, "balance_usd": 12.40, "currency": "USD", "method": "wallet" }
}
```

### Example

::: code-group

```python [Python]
import base64
import httpx

with open("invoice.png", "rb") as f:
    doc_b64 = base64.b64encode(f.read()).decode()

resp = httpx.post(
    "https://apis.fotohub.app/v1/ai/document/detect-text",
    headers={"Authorization": f"Bearer {supabase_user_jwt}"},
    json={"document": doc_b64},
)
result = resp.json()
print(result["text"])
```

```bash [cURL]
DOC_B64=$(base64 -w 0 invoice.png)
curl -X POST "https://apis.fotohub.app/v1/ai/document/detect-text" \
  -H "Authorization: Bearer $SUPABASE_USER_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"document\": \"$DOC_B64\"}"
```

:::

---

## Analyze Document (Tables + Forms)

Table extraction and form key-value pairs.

```http
POST /v1/ai/document/analyze
Authorization: Bearer <supabase_user_jwt>
Content-Type: application/json
```

### Body

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `document` | string | **Yes** | — | Base64-encoded document, max 10 MB. |
| `features` | string[] | No | `["TABLES", "FORMS"]` | Any of `"TABLES"`, `"FORMS"`, `"SIGNATURES"`, `"LAYOUT"`. Unrecognized values are dropped silently. |

Billing is a flat $0.015/page regardless of which features you request —
requesting fewer features does not cost less.

### Response

`tables` is a list of raw 2D grids (`string[][]`), not objects with page or
confidence metadata. `key_values` entries have no confidence score.

```json
{
  "text": "Full text content of the document...",
  "lines": [ { "text": "Invoice Number: FH-2026-1001", "confidence": 99.2 } ],
  "tables": [
    [
      ["Item", "Quantity", "Unit Price", "Total"],
      ["Seedream Image Generation (1000 images)", "1", "$45.00", "$45.00"]
    ]
  ],
  "key_values": [
    { "key": "Invoice Number", "value": "FH-2026-1001" },
    { "key": "Date", "value": "2026-07-19" }
  ],
  "total_blocks": 142,
  "cost_usd": 0.015,
  "currency": "USD",
  "billing": { "cost_usd": 0.015, "balance_usd": 12.385, "currency": "USD", "method": "wallet" }
}
```

### Example

::: code-group

```python [Python]
import base64
import httpx

with open("form.pdf", "rb") as f:
    doc_b64 = base64.b64encode(f.read()).decode()

result = httpx.post(
    "https://apis.fotohub.app/v1/ai/document/analyze",
    headers={"Authorization": f"Bearer {supabase_user_jwt}"},
    json={"document": doc_b64, "features": ["TABLES", "FORMS"]},
).json()

for table in result["tables"]:
    for row in table:
        print(" | ".join(row))

for kv in result["key_values"]:
    print(f"  {kv['key']}: {kv['value']}")
```

```bash [cURL]
DOC_B64=$(base64 -w 0 form.pdf)
curl -X POST "https://apis.fotohub.app/v1/ai/document/analyze" \
  -H "Authorization: Bearer $SUPABASE_USER_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"document\": \"$DOC_B64\", \"features\": [\"TABLES\", \"FORMS\"]}"
```

:::

---

## Analyze Expense (Invoice & Receipt Extraction)

Vendor, line items, totals, tax, and dates, via AWS Textract's
`AnalyzeExpense`.

```http
POST /v1/ai/document/analyze-expense
Authorization: Bearer <supabase_user_jwt>
Content-Type: application/json
```

### Body

| Parameter | Type | Required | Description |
|:---|:---|:---|:---|
| `document` | string | **Yes** | Base64-encoded invoice/receipt, max 10 MB. |

### Response

`summary` values carry a confidence score; `line_items` fields do not.

```json
{
  "expenses": [
    {
      "summary": {
        "VENDOR_NAME": { "value": "Acme Cloud Services Inc.", "confidence": 98.7 },
        "INVOICE_RECEIPT_DATE": { "value": "2026-07-19", "confidence": 99.1 },
        "TOTAL": { "value": "$142.50", "confidence": 99.5 }
      },
      "line_items": [
        { "ITEM": "GPU Compute Hours (A10G, 4 hours)", "QUANTITY": "4", "PRICE": "$10.00" }
      ]
    }
  ],
  "document_count": 1,
  "cost_usd": 0.01,
  "currency": "USD",
  "billing": { "cost_usd": 0.01, "balance_usd": 12.375, "currency": "USD", "method": "wallet" }
}
```

### Example

::: code-group

```python [Python]
import base64
import httpx

with open("invoice.jpg", "rb") as f:
    doc_b64 = base64.b64encode(f.read()).decode()

result = httpx.post(
    "https://apis.fotohub.app/v1/ai/document/analyze-expense",
    headers={"Authorization": f"Bearer {supabase_user_jwt}"},
    json={"document": doc_b64},
).json()

for expense in result["expenses"]:
    summary = expense["summary"]
    print(f"Vendor: {summary.get('VENDOR_NAME', {}).get('value')}")
    print(f"Total: {summary.get('TOTAL', {}).get('value')}")
```

```bash [cURL]
DOC_B64=$(base64 -w 0 invoice.jpg)
curl -X POST "https://apis.fotohub.app/v1/ai/document/analyze-expense" \
  -H "Authorization: Bearer $SUPABASE_USER_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"document\": \"$DOC_B64\"}"
```

:::

---

## Error Responses

| HTTP Status | Description |
|:---|:---|
| `400` | Missing `document` field, or document exceeds 10 MB. |
| `401` | Missing/invalid/expired Supabase user JWT. **An `fh_live_*` API key does not work here.** |
| `402` | Insufficient wallet balance for this operation. Top up at [fotohub.app/console/billing](https://fotohub.app/console/billing). |
| `502` | Textract failed to process the document (unsupported format, corrupted file, or a transient AWS error). The charge is refunded automatically. |
