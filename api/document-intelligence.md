# Document Intelligence

Extract text, tables, forms, and structured data from documents and images using AI-powered OCR and document analysis.

| Feature | Endpoint | Credits | Description |
|---------|----------|---------|-------------|
| **OCR** | `POST /v1/ai/document/detect-text` | 1 | Simple text extraction |
| **Analyze** | `POST /v1/ai/document/analyze` | 3 | Tables + forms + key-value pairs |
| **Expense** | `POST /v1/ai/document/analyze-expense` | 5 | Invoice/receipt structured extraction |

**Supported formats:** PDF, JPEG, PNG, TIFF (max 10MB per document).

---

## Detect Text (OCR)

Simple, fast text extraction from images and documents.

### Endpoint

```
POST /v1/ai/document/detect-text
```

**Billing:** 1 credit per page

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document` | string | **Yes** | Base64-encoded document (PDF/image). Max 10MB. |

### Response

```json
{
  "text": "FOTOhub Invoice #2026-07-001\nDate: 2026-07-19\nCustomer: Jan Kowalski",
  "lines": [
    { "text": "FOTOhub Invoice #2026-07-001", "confidence": 99.8 },
    { "text": "Date: 2026-07-19", "confidence": 99.5 }
  ],
  "total_lines": 6,
  "credits_used": 1
}
```

### Example

::: code-group

```python [Python]
import base64
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

with open("document.png", "rb") as f:
    doc_b64 = base64.b64encode(f.read()).decode()

result = client.document.detect_text(document=doc_b64)
print(result.text)
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/document/detect-text" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "document": "BASE64_ENCODED_IMAGE..."
  }'
```

:::

---

## Analyze Document

Advanced analysis with table extraction, form fields (key-value pairs), and structural layout detection.

### Endpoint

```
POST /v1/ai/document/analyze
```

**Billing:** 3 credits per page

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `document` | string | **Yes** | — | Base64-encoded document. Max 10MB. |
| `features` | array | No | `["TABLES", "FORMS"]` | Features to extract: `"TABLES"`, `"FORMS"`, `"SIGNATURES"`, `"LAYOUT"`. |

### Response

```json
{
  "text": "Full text content of the document...",
  "lines": [
    { "text": "Line content", "confidence": 99.2 }
  ],
  "tables": [
    [
      ["Item", "Qty", "Price"],
      ["AI Credits 1000", "1", "49.99 PLN"],
      ["Storage 100GB", "1", "29.99 PLN"]
    ]
  ],
  "key_values": [
    { "key": "Invoice Number", "value": "FH-2026-001" },
    { "key": "Date", "value": "2026-07-19" },
    { "key": "Customer", "value": "Jan Kowalski" }
  ],
  "total_blocks": 142,
  "credits_used": 3
}
```

### Example

::: code-group

```python [Python]
import base64
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

with open("form.pdf", "rb") as f:
    doc_b64 = base64.b64encode(f.read()).decode()

result = client.document.analyze(
    document=doc_b64,
    features=["TABLES", "FORMS"]
)

# Access extracted tables
for table in result.tables:
    for row in table:
        print(" | ".join(row))

# Access form fields
for kv in result.key_values:
    print(f"{kv['key']}: {kv['value']}")
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/document/analyze" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "document": "BASE64_ENCODED_PDF...",
    "features": ["TABLES", "FORMS"]
  }'
```

:::

---

## Analyze Expense

Specialized extraction for invoices, receipts, and expense documents. Returns vendor info, line items, totals, tax, and dates in a structured format.

### Endpoint

```
POST /v1/ai/document/analyze-expense
```

**Billing:** 5 credits per document

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document` | string | **Yes** | Base64-encoded invoice/receipt. Max 10MB. |

### Response

```json
{
  "expenses": [
    {
      "summary": {
        "VENDOR_NAME": { "value": "FOTOhub sp. z o.o.", "confidence": 98.7 },
        "INVOICE_RECEIPT_DATE": { "value": "2026-07-19", "confidence": 99.1 },
        "TOTAL": { "value": "61.49 PLN", "confidence": 99.5 },
        "TAX": { "value": "11.50 PLN", "confidence": 98.2 },
        "SUBTOTAL": { "value": "49.99 PLN", "confidence": 99.0 }
      },
      "line_items": [
        { "ITEM": "AI Credits Bundle (1000)", "QUANTITY": "1", "PRICE": "49.99 PLN" }
      ]
    }
  ],
  "document_count": 1,
  "credits_used": 5
}
```

### Example

::: code-group

```python [Python]
import base64
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

with open("invoice.jpg", "rb") as f:
    doc_b64 = base64.b64encode(f.read()).decode()

result = client.document.analyze_expense(document=doc_b64)
for exp in result.expenses:
    print(f"Vendor: {exp['summary']['VENDOR_NAME']['value']}")
    print(f"Total: {exp['summary']['TOTAL']['value']}")
    for item in exp['line_items']:
        print(f"  - {item.get('ITEM', '?')}: {item.get('PRICE', '?')}")
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/document/analyze-expense" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "document": "BASE64_ENCODED_INVOICE..."
  }'
```

:::

---

## Pricing

| Operation | Credits | Provider Cost | Use Case |
|-----------|---------|---------------|----------|
| Detect Text (OCR) | 1 | $0.0015/page | Simple text extraction |
| Analyze (Tables+Forms) | 3 | $0.015/page | Structured document analysis |
| Analyze Expense | 5 | $0.01/page | Invoice/receipt processing |

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `unsupported_format` | Document format not supported. Use PDF, JPEG, PNG, or TIFF. |
| 400 | `document_too_large` | File exceeds 10MB limit. |
| 402 | `insufficient_credits` | Not enough credits for this operation. |
| 500 | `analysis_failed` | Internal processing error. Retry or contact support. |
