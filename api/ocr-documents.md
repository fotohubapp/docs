# OCR & Document Intelligence

::: warning First-party only — not reachable with an `fh_live_*` API key
All FOTOhub document/OCR routes authenticate with a Supabase **user session
JWT**, the same token the web app itself uses — not an `fh_live_*` developer
API key. If you only hold an API key, every endpoint on this page returns
`401`.

This page previously documented `POST /v1/ai/document/ocr`,
`POST /v1/ai/document/invoice`, `POST /v1/ai/document/redact`,
`POST /v1/ai/document/pdf-to-images`, `POST /v1/ai/document/batch`, and
`POST /v1/ai/document/export`. None of those routes exist — they return
`404`. There is no PII redaction, PDF-to-image conversion, batch OCR, or
result-export endpoint on the API. Full detail on the three real endpoints
below — parameters, response shapes, errors — lives on
[Document Intelligence](/api/document-intelligence); this page is the
OCR-focused summary of the same three routes.
:::

**Base URL:** `https://apis.fotohub.app` · **Auth:** `Authorization: Bearer <supabase_user_jwt>`
**Formats:** PDF, JPEG, PNG, TIFF — max **10 MB** per document

---

## OCR — Text Detection

Plain text extraction, no structural analysis.

```http
POST /v1/ai/document/detect-text
```

**Billing:** $0.0015/page, charged from the USD wallet.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document` | string | **Yes** | Base64-encoded image/PDF, max 10 MB. |

```bash
DOC_B64=$(base64 -w 0 receipt.jpg)
curl -X POST "https://apis.fotohub.app/v1/ai/document/detect-text" \
  -H "Authorization: Bearer $SUPABASE_USER_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"document\": \"$DOC_B64\"}"
```

Response: `{ "text": "...", "lines": [{"text": "...", "confidence": 99.8}], "total_lines": 12, "cost_usd": 0.0015, ... }`

See [Document Intelligence → Detect Text](/api/document-intelligence#detect-text-ocr) for the full response shape.

---

## Invoice & Receipt Extraction

Structured vendor/line-item/total extraction via AWS Textract's
`AnalyzeExpense`.

```http
POST /v1/ai/document/analyze-expense
```

**Billing:** $0.01/page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document` | string | **Yes** | Base64-encoded invoice/receipt, max 10 MB. |

```bash
DOC_B64=$(base64 -w 0 invoice.jpg)
curl -X POST "https://apis.fotohub.app/v1/ai/document/analyze-expense" \
  -H "Authorization: Bearer $SUPABASE_USER_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"document\": \"$DOC_B64\"}"
```

See [Document Intelligence → Analyze Expense](/api/document-intelligence#analyze-expense-invoice-receipt-extraction)
for the full response shape (`summary` fields carry confidence, `line_items`
fields do not).

---

## Analyze — Tables & Forms

Table extraction and form key-value pairs.

```http
POST /v1/ai/document/analyze
```

**Billing:** flat $0.015/page regardless of which `features` you request.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `document` | string | **Yes** | — | Base64-encoded document, max 10 MB. |
| `features` | string[] | No | `["TABLES", "FORMS"]` | `"TABLES"`, `"FORMS"`, `"SIGNATURES"`, `"LAYOUT"`. |

```bash
DOC_B64=$(base64 -w 0 form.pdf)
curl -X POST "https://apis.fotohub.app/v1/ai/document/analyze" \
  -H "Authorization: Bearer $SUPABASE_USER_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"document\": \"$DOC_B64\", \"features\": [\"TABLES\", \"FORMS\"]}"
```

See [Document Intelligence → Analyze Document](/api/document-intelligence#analyze-document-tables-forms)
for the full response shape — note `tables` is a list of raw `string[][]`
grids, not objects with page/confidence metadata.

---

## Error Responses

| HTTP Status | Description |
|:---|:---|
| `400` | Missing `document` field, or document exceeds 10 MB. |
| `401` | Missing/invalid/expired Supabase user JWT — **not** an `fh_live_*` API key. |
| `402` | Insufficient wallet balance. Top up at [fotohub.app/console/billing](https://fotohub.app/console/billing). |
| `502` | Textract failed to process the document; the charge is refunded automatically. |
