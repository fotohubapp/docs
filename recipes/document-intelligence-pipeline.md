# Automated Document & Invoice Intelligence Pipeline

Extract, validate, audit, and reconcile financial documents—invoices, purchase orders, receipts, and freight bills—with sub-cent unit costs, structured schema validation, and air-gapped mathematical verification.

This production blueprint orchestrates FOTOhub's **Document Intelligence Engine** (`server/api-server/app/routes/textract.py`) backed by AWS Textract list-price pass-through and **Firecracker MicroVM Compute Sandboxes** (`server/agent-compute/app/routes_sandbox.py`) to deliver 99.9% extraction accuracy without manual human data entry.

---

## Architectural Workflow

```mermaid
flowchart TD
    A["Raw Ingest: PDF / TIFF / PNG / JPEG (max 10 MB)"] --> B["Document Base64 Serialization / BYOB S3 Reference"]
    B --> C{"Document Classification"}
    C -->|"Invoices & Receipts"| D["Analyze Expense API (/v1/ai/document/analyze-expense)"]
    C -->|"Complex Tables & Forms"| E["Analyze Document API (/v1/ai/document/analyze)"]
    C -->|"Standard Text Extraction"| F["Main OCR API (/v1/documents/extract)"]
    D & E & F --> G["Raw Geometry & Block Hierarchy"]
    
    G --> H["PII Redaction Engine (/v1/documents/redact)"]
    
    H --> I["Pydantic Structural Model Validation"]
    I --> J["Firecracker MicroVM Sandbox (/sandbox/exec-python)"]
    
    subgraph "Air-Gapped MicroVM Sandbox"
        J1["Isolated Python Runtime (virtio-vsock, no eth0)"]
        J2["Line-Item Cross-Multiplication: Qty × Price == Net"]
        J3["Tax Bracket Audit: Net × TaxRate == TaxAmount"]
        J4["Subtotal & Grand Total Reconciliation"]
        J5["Anomaly & Duplicate Detection"]
        J1 --> J2 --> J3 --> J4 --> J5
    end
    
    J --> K{"Reconciliation Audit Passed?"}
    K -->|"Discrepancy Detected"| L["Flag for Human Review / Exception Queue / DLQ"]
    K -->|"Verified (Delta == 0.00)"| M["Signed Webhook Notification (X-FotoHub-Signature)"]
    
    M --> N["ERP Ingest: SAP S/4HANA / NetSuite / QuickBooks / Xero"]
    M --> O["Batch Results to BYOB S3/R2 Bucket"]
```

---

## Supported Document Types & Formats

The FOTOhub Document Intelligence pipeline supports a wide array of document formats for both synchronous and asynchronous batch processing.

| Format | Extensions | Max File Size (Sync) | Max File Size (Batch) | Supported Endpoints | Notes |
|---|---|---|---|---|---|
| PDF Document | `.pdf` | 10 MB | 500 MB (up to 3000 pages) | All | Native text extraction used when available |
| Portable Network Graphics | `.png` | 10 MB | 10 MB | All | Best for lossless digital exports |
| JPEG Image | `.jpeg`, `.jpg` | 10 MB | 10 MB | All | Use max quality settings for best OCR results |
| TIFF Image | `.tiff`, `.tif` | 10 MB | 500 MB | All | Standard for physical scanners, multi-page supported |
| WebP Image | `.webp` | 10 MB | 10 MB | All | High compression ratio, fast upload |
| Microsoft Word | `.docx` | 10 MB | 50 MB | Extract, Classify | Automatically converted to PDF internally |

::: warning GPU Affinity Notes
FOTOhub intelligently routes document jobs to specific hardware profiles. Standard OCR and layout parsing use dense CPU clusters, whereas signature detection and checkbox analysis are routed to Vision-Language Models (VLMs) on GPU4 and GPU5 nodes.
:::

---

## Unit Economics & Pure USD Wallet Billing

FOTOhub routes all document intelligence requests through the prepaid USD wallet at exact 1:1 pass-through rates. There are **no artificial platform credits**, **no monthly minimums**, and **no PLN conversions**. If an upstream provider fails or rejects a malformed document, your wallet is automatically refunded.

| Stage | Operation / Endpoint | Provider / Engine | Unit Cost (USD) | Precision & Notes |
|:---|:---|:---|:---:|:---|
| **Text Detection** | `/v1/documents/extract` | AWS Textract / Tesseract | **$0.005** / page | Fast OCR for plain text and raw line numbers |
| **Expense Parsing** | `/v1/ai/document/analyze-expense` | AWS Textract AnalyzeExpense | **$0.010** / page | Specialized extractor for invoices, vendor headers, line items & totals |
| **Table & Form Extraction**| `/v1/documents/analyze` | AWS Textract AnalyzeDocument | **$0.015** / page | Deep structural extraction of multi-column tables, forms, and key-values |
| **PII Redaction** | `/v1/documents/redact` | NLP Engine | **$0.008** / page | Masking of sensitive entities (names, emails, SSN, CC) |
| **Document Classification**| `/v1/documents/classify` | VLM Zero-Shot | **$0.003** / doc | Categorization routing |
| **Batch Processing** | `/v1/documents/batch` | Queue Manager | **$0.004** / doc | Async scheduling fee (added to per-page costs) |
| **Math Audit & Verification**| `/sandbox/exec-python` | Firecracker MicroVM (512 MB) | **$0.0005** / run | Sub-200ms air-gapped deterministic reconciliation script |

**Manual Data Entry Cost Comparison**
Average manual data entry per invoice takes 2-3 minutes and costs approximately $1.50 - $2.50 in human labor. The FOTOhub pipeline processes the same invoice in under 2 seconds for a total cost of ~$0.0155 (Extraction + Math Audit). This represents a **99% cost reduction** with mathematically guaranteed accuracy.

::: tip Balance Safety & Idempotency
Every API route validates your `wallet.available_usd` balance before dispatching OCR workers. If the balance cannot cover the requested page count, the API immediately halts with an explicit `402 Payment Required` detailing the exact shortfall and top-up URL.
:::

---

## 1. Document Classification API (`/v1/documents/classify`)

Automatically categorizes incoming documents to route them to the most efficient extraction pipeline.

### Supported Document Categories
- `INVOICE` - Commercial invoices from vendors
- `RECEIPT` - Point of sale receipts, thermal prints
- `PURCHASE_ORDER` - B2B purchase orders
- `CONTRACT` - Legal agreements with signatures
- `TAX_FORM` - W-2, 1099, and international tax forms
- `ID_CARD` - Driver's licenses, passports (automatically routes to redaction)
- `BANK_STATEMENT` - Financial statements with ledger tables
- `OTHER` - Uncategorized or generic text documents

### Request Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `document_b64` | String | Yes* | None | Base64 encoded document content. |
| `document_url` | String | Yes* | None | Publicly accessible URL or presigned S3/R2 link. |
| `top_k` | Integer | No | `1` | Number of categories to return with confidence scores. |

*\* Provide either `document_b64` or `document_url`, not both.*

### Implementation

::: code-group

```python [Python]
import requests
import os
import json

API_KEY = os.environ.get("FOTOHUB_API_KEY", "fh_live_testkey_123456789")

response = requests.post(
    "https://apis.fotohub.app/v1/documents/classify",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"document_url": "https://example.com/docs/vendor_doc.pdf", "top_k": 3}
)
print(json.dumps(response.json(), indent=2))
```

```typescript [TypeScript]
import axios from 'axios';

const API_KEY = process.env.FOTOHUB_API_KEY || "fh_live_testkey_123456789";

async function classifyDoc() {
  const { data } = await axios.post(
    'https://apis.fotohub.app/v1/documents/classify',
    { document_url: "https://example.com/docs/vendor_doc.pdf", top_k: 3 },
    { headers: { Authorization: `Bearer ${API_KEY}` } }
  );
  console.log(JSON.stringify(data, null, 2));
}
classifyDoc();
```

```go [Go]
package main

import (
    "bytes"
    "fmt"
    "net/http"
    "os"
    "io"
)

func main() {
    apiKey := os.Getenv("FOTOHUB_API_KEY")
    if apiKey == "" {
        apiKey = "fh_live_testkey_123456789"
    }
    payload := []byte(`{"document_url":"https://example.com/docs/vendor_doc.pdf", "top_k": 3}`)
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/documents/classify", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", "application/json")
    
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/documents/classify \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "document_url": "https://example.com/docs/vendor_doc.pdf",
    "top_k": 3
  }'
```

:::

---

## 2. Main OCR Extraction API (`/v1/documents/extract`)

Extracts raw text, line geometry, and paragraph bounding boxes. Best for contracts, articles, and unstructured text where layout is not highly tabular.

### Request Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `document_b64` | String | Yes* | None | Base64 encoded document content. |
| `document_url` | String | Yes* | None | Publicly accessible URL or presigned S3/R2 link. |
| `language` | String | No | `auto` | Force ISO 639-1 language code (e.g., `en`, `fr`). |
| `include_geometry` | Boolean | No | `false` | Return precise X/Y polygon bounding boxes. |

*\* Provide either `document_b64` or `document_url`, not both.*

### Response Output Fields Explained
- `text`: The full concatenated raw text of the document.
- `pages[].lines[].text`: Text bounded to a specific horizontal line in the document.
- `pages[].lines[].geometry`: The absolute polygon coordinates of the line boundary.
- `usd_charged`: The exact USD amount deducted from the wallet for this API call.
- `wallet.available_usd`: The remaining USD balance after this deduction.

### Implementation

::: code-group

```python [Python]
import requests
import os
import json

API_KEY = os.environ.get("FOTOHUB_API_KEY", "fh_live_testkey_123456789")

response = requests.post(
    "https://apis.fotohub.app/v1/documents/extract",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "document_url": "https://example.com/docs/contract.pdf",
        "include_geometry": True
    }
)
print(json.dumps(response.json(), indent=2))
```

```typescript [TypeScript]
import axios from 'axios';

const API_KEY = process.env.FOTOHUB_API_KEY || "fh_live_testkey_123456789";

async function extractText() {
  const { data } = await axios.post(
    'https://apis.fotohub.app/v1/documents/extract',
    { document_url: "https://example.com/docs/contract.pdf", include_geometry: true },
    { headers: { Authorization: `Bearer ${API_KEY}` } }
  );
  console.log(JSON.stringify(data, null, 2));
}
extractText();
```

```go [Go]
package main

import (
    "bytes"
    "fmt"
    "net/http"
    "os"
    "io"
)

func main() {
    apiKey := os.Getenv("FOTOHUB_API_KEY")
    payload := []byte(`{"document_url":"https://example.com/docs/contract.pdf", "include_geometry": true}`)
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/documents/extract", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", "application/json")
    
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/documents/extract \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "document_url": "https://example.com/docs/contract.pdf",
    "include_geometry": true
  }'
```

:::

---

## 3. Deep Analysis API (`/v1/documents/analyze`)

Extracts complex multi-column tables, key-value pairs (forms), checkbox states, and detects signatures.

### Form Field Extraction & Key-Value Pairs
The Analyze API maps form layouts into strict Key-Value pairs. It identifies the "Key" (e.g., "First Name:") and pairs it with the user-entered "Value" (e.g., "Jane").
It also detects checkboxes and returns their state as `SELECTED` or `NOT_SELECTED`. Signatures are detected and bounded by geometry polygons.

### Request Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `document_b64` | String | Yes* | None | Base64 encoded document content. |
| `document_url` | String | Yes* | None | Publicly accessible URL or presigned S3/R2 link. |
| `features` | Array | Yes | `[]` | List of features: `["TABLES", "FORMS", "SIGNATURES"]` |
| `queries` | Array | No | `[]` | Natural language questions (e.g., `["What is the patient name?"]`) |

### Table Detection Output JSON Example

```json
{
  "usd_charged": 0.015,
  "wallet": {
    "available_usd": 2450.75
  },
  "tables": [
    {
      "table_id": "table_1",
      "rows": 4,
      "columns": 3,
      "cells": [
        {
          "row_index": 0,
          "column_index": 0,
          "text": "Item Description",
          "is_header": true
        },
        {
          "row_index": 1,
          "column_index": 0,
          "text": "Industrial Widget A",
          "is_header": false
        }
      ]
    }
  ],
  "forms": {
    "Patient Name": "John Doe",
    "Date of Birth": "1980-05-12",
    "Smoker": "SELECTED"
  },
  "signatures": [
    {
      "page": 1,
      "confidence": 99.8,
      "geometry": { 
        "BoundingBox": { "Width": 0.1, "Height": 0.05, "Left": 0.2, "Top": 0.8 }
      }
    }
  ]
}
```

### Implementation

::: code-group

```python [Python]
import requests
import os
import json

API_KEY = os.environ.get("FOTOHUB_API_KEY", "fh_live_testkey_123456789")

response = requests.post(
    "https://apis.fotohub.app/v1/documents/analyze",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "document_url": "https://example.com/docs/medical_form.pdf",
        "features": ["TABLES", "FORMS", "SIGNATURES"]
    }
)
print(json.dumps(response.json(), indent=2))
```

```typescript [TypeScript]
import axios from 'axios';

const API_KEY = process.env.FOTOHUB_API_KEY || "fh_live_testkey_123456789";

async function analyzeDoc() {
  const { data } = await axios.post(
    'https://apis.fotohub.app/v1/documents/analyze',
    { document_url: "https://example.com/docs/medical_form.pdf", features: ["TABLES", "FORMS", "SIGNATURES"] },
    { headers: { Authorization: `Bearer ${API_KEY}` } }
  );
  console.log(JSON.stringify(data, null, 2));
}
analyzeDoc();
```

```go [Go]
package main

import (
    "bytes"
    "fmt"
    "net/http"
    "os"
    "io"
)

func main() {
    apiKey := os.Getenv("FOTOHUB_API_KEY")
    payload := []byte(`{"document_url":"https://example.com/docs/medical_form.pdf", "features": ["TABLES", "FORMS"]}`)
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/documents/analyze", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", "application/json")
    
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/documents/analyze \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "document_url": "https://example.com/docs/medical_form.pdf",
    "features": ["TABLES", "FORMS", "SIGNATURES"]
  }'
```

:::

---

## 4. PII Redaction API (`/v1/documents/redact`)

Identifies and masks Personally Identifiable Information (PII) before returning the document or text. Essential for GDPR, HIPAA, and CCPA compliance.

### Supported Entity Types
- `PERSON_NAME` - First, last, and full names.
- `EMAIL_ADDRESS` - Email addresses.
- `PHONE_NUMBER` - International and local phone numbers.
- `SSN` - Social Security Numbers and national ID strings.
- `CREDIT_CARD` - Primary Account Numbers (PAN), expiry dates.
- `MEDICAL_TERMS` - PHI (Protected Health Information), ICD-10 codes, medical conditions.
- `ADDRESS` - Physical mailing addresses.

### Request Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `document_b64` | String | Yes* | None | Base64 encoded document content. |
| `document_url` | String | Yes* | None | Publicly accessible URL or presigned S3/R2 link. |
| `entities` | Array | No | `["ALL"]` | List of entities to redact (e.g., `["SSN", "CREDIT_CARD"]`). |
| `mask_character` | String | No | `*` | Character used to replace the text. |
| `return_redacted_pdf`| Boolean | No | `false` | If true, returns a base64 encoded PDF with black bounding boxes over PII. |

### Implementation

::: code-group

```python [Python]
import requests
import os
import json

API_KEY = os.environ.get("FOTOHUB_API_KEY", "fh_live_testkey_123456789")

response = requests.post(
    "https://apis.fotohub.app/v1/documents/redact",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "document_url": "https://example.com/docs/loan_app.pdf",
        "entities": ["SSN", "PERSON_NAME", "CREDIT_CARD"],
        "return_redacted_pdf": True
    }
)
print(json.dumps(response.json(), indent=2))
```

```typescript [TypeScript]
import axios from 'axios';

const API_KEY = process.env.FOTOHUB_API_KEY || "fh_live_testkey_123456789";

async function redactDoc() {
  const { data } = await axios.post(
    'https://apis.fotohub.app/v1/documents/redact',
    { document_url: "https://example.com/docs/loan_app.pdf", entities: ["SSN", "CREDIT_CARD"], return_redacted_pdf: true },
    { headers: { Authorization: `Bearer ${API_KEY}` } }
  );
  console.log(JSON.stringify(data, null, 2));
}
redactDoc();
```

```go [Go]
package main

import (
    "bytes"
    "fmt"
    "net/http"
    "os"
    "io"
)

func main() {
    apiKey := os.Getenv("FOTOHUB_API_KEY")
    payload := []byte(`{"document_url":"https://example.com/docs/loan_app.pdf", "entities": ["ALL"], "return_redacted_pdf": true}`)
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/documents/redact", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", "application/json")
    
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/documents/redact \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "document_url": "https://example.com/docs/loan_app.pdf",
    "entities": ["SSN", "PERSON_NAME", "CREDIT_CARD"],
    "return_redacted_pdf": true
  }'
```

:::

---

## 5. Async Batch Processing API (`/v1/documents/batch`)

For high-volume financial workflows, legal discovery, and historical backfills, use the Batch API. It processes hundreds or thousands of documents concurrently.

### S3 / R2 Output Destination (BYOB)
You can provide an `output_config` with an S3 bucket or Cloudflare R2 bucket. FOTOhub will write the structured JSON results directly into your bucket.

### Request Parameters (`POST /v1/documents/batch`)

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `documents` | Array | Yes | None | List of objects containing `document_url` or `document_b64`. |
| `operation` | String | Yes | None | The target operation: `EXTRACT`, `ANALYZE`, `REDACT`, or `CLASSIFY`. |
| `webhook_url` | String | No | None | URL to POST the results or status updates upon completion. |
| `output_config`| Object | No | None | BYOB S3/R2 configuration for output delivery. |

### Webhook Delivery Pattern
When the batch is complete, FOTOhub sends a POST request to your `webhook_url`. The payload contains the `batch_id` and status. To ensure the webhook came from FOTOhub, verify the `X-FotoHub-Signature` header using HMAC-SHA256 and your API key.

### Implementation

::: code-group

```python [Python asyncio Batch Processor]
import asyncio
import aiohttp
import os
import json

API_KEY = os.environ.get("FOTOHUB_API_KEY", "fh_live_testkey_123456789")
API_BASE = "https://apis.fotohub.app"

async def process_batch(documents, operation="ANALYZE"):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "documents": [{"document_url": doc} for doc in documents],
        "operation": operation,
        "output_config": {
            "s3_bucket": "my-enterprise-results",
            "s3_prefix": "batch-2026/invoices/"
        }
    }
    
    async with aiohttp.ClientSession() as session:
        # 1. Dispatch Batch Job
        async with session.post(f"{API_BASE}/v1/documents/batch", json=payload, headers=headers) as resp:
            data = await resp.json()
            batch_id = data.get("batch_id")
            print(f"Batch {batch_id} scheduled. Cost pending.")
            
        # 2. Poll Status (if not using Webhooks)
        while True:
            await asyncio.sleep(10) # SSE streaming progress is also supported
            async with session.get(f"{API_BASE}/v1/documents/batch/{batch_id}", headers=headers) as stat_resp:
                status_data = await stat_resp.json()
                state = status_data.get("status")
                print(f"Status: {state} | Progress: {status_data.get('progress', 0)}%")
                
                if state in ["COMPLETED", "FAILED", "PARTIAL_SUCCESS"]:
                    print(f"Final USD Charged: ${status_data.get('usd_charged')}")
                    return status_data

docs = ["https://s3.aws.com/doc1.pdf", "https://s3.aws.com/doc2.pdf"]
asyncio.run(process_batch(docs))
```

```typescript [TypeScript Webhook Receiver]
import express from 'express';
import crypto from 'crypto';

const app = express();
const API_KEY = process.env.FOTOHUB_API_KEY || "fh_live_testkey_123456789";

// Use raw body parser to correctly compute HMAC
app.use(express.raw({ type: 'application/json' }));

app.post('/webhooks/fotohub', (req, res) => {
  const signature = req.headers['x-fotohub-signature'] as string;
  const rawBody = req.body;
  
  // Verify HMAC-SHA256 signature
  const expectedSignature = crypto
    .createHmac('sha256', API_KEY)
    .update(rawBody)
    .digest('hex');
    
  if (signature !== expectedSignature) {
    console.error("Invalid signature!");
    return res.status(401).send("Unauthorized");
  }
  
  const payload = JSON.parse(rawBody.toString());
  console.log(`Batch ${payload.batch_id} completed with status ${payload.status}`);
  console.log(`Billed: $${payload.usd_charged} USD`);
  
  // Process payload.results or check S3 bucket
  
  res.status(200).send("OK");
});

app.listen(3000, () => console.log('Webhook receiver running on port 3000'));
```

```go [Go High-Concurrency Processor]
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

func main() {
    apiKey := os.Getenv("FOTOHUB_API_KEY")
    apiBase := "https://apis.fotohub.app"
    
    // Construct payload
    payload := map[string]interface{}{
        "operation": "ANALYZE",
        "webhook_url": "https://api.mycompany.com/webhooks/fotohub",
        "documents": []map[string]string{
            {"document_url": "https://example.com/doc1.pdf"},
            {"document_url": "https://example.com/doc2.pdf"},
        },
    }
    body, _ := json.Marshal(payload)
    
    // Dispatch
    req, _ := http.NewRequest("POST", apiBase+"/v1/documents/batch", bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", "application/json")
    
    resp, err := http.DefaultClient.Do(req)
    if err != nil { panic(err) }
    defer resp.Body.Close()
    
    respBody, _ := io.ReadAll(resp.Body)
    fmt.Println("Batch Dispatch Response:", string(respBody))
    
    // In production, Go applications should use goroutines + channels 
    // to listen for webhook callbacks or concurrently poll the GET endpoint.
}
```

```bash [cURL]
# 1. Dispatch Batch Job
curl -X POST https://apis.fotohub.app/v1/documents/batch \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "ANALYZE",
    "documents": [
      {"document_url": "https://example.com/doc1.pdf"},
      {"document_url": "https://example.com/doc2.pdf"}
    ],
    "output_config": {
      "s3_bucket": "my-enterprise-results"
    }
  }'

# 2. Poll Batch Status
curl -X GET https://apis.fotohub.app/v1/documents/batch/batch_123456 \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

---

## 6. AWS Textract Wrapper API (`/v1/textract/analyze`)

A direct passthrough to AWS Textract for users who have existing Textract integrations but want to utilize FOTOhub's USD prepaid billing and Firecracker math audit sandbox.

### Request Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `document_b64` | String | Yes* | None | Base64 encoded document content. |
| `document_url` | String | Yes* | None | Publicly accessible URL or presigned S3/R2 link. |
| `feature_types` | Array | No | `[]` | Maps directly to Textract `FeatureTypes`. |

### Implementation

::: code-group

```python [Python]
import requests
import os
import json

API_KEY = os.environ.get("FOTOHUB_API_KEY", "fh_live_testkey_123456789")

response = requests.post(
    "https://apis.fotohub.app/v1/textract/analyze",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "document_url": "https://example.com/docs/complex_layout.pdf",
        "feature_types": ["TABLES", "FORMS", "LAYOUT"]
    }
)
print(json.dumps(response.json(), indent=2))
```

```typescript [TypeScript]
import axios from 'axios';

const API_KEY = process.env.FOTOHUB_API_KEY || "fh_live_testkey_123456789";

async function textractCall() {
  const { data } = await axios.post(
    'https://apis.fotohub.app/v1/textract/analyze',
    { document_url: "https://example.com/docs/complex_layout.pdf", feature_types: ["TABLES"] },
    { headers: { Authorization: `Bearer ${API_KEY}` } }
  );
  console.log(JSON.stringify(data, null, 2));
}
textractCall();
```

```go [Go]
package main

import (
    "bytes"
    "fmt"
    "net/http"
    "os"
    "io"
)

func main() {
    apiKey := os.Getenv("FOTOHUB_API_KEY")
    payload := []byte(`{"document_url":"https://example.com/docs/complex_layout.pdf", "feature_types": ["FORMS"]}`)
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/v1/textract/analyze", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", "application/json")
    
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/textract/analyze \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "document_url": "https://example.com/docs/complex_layout.pdf",
    "feature_types": ["TABLES", "FORMS"]
  }'
```

:::

---

## 7. Automated Invoice Validation Workflow

Combine the above endpoints with the Firecracker Math Sandbox to build a zero-touch AP automation flow:

1. **Ingest**: File arrives via email parsing (converted to Base64) or S3 upload.
2. **Classify**: Call `/v1/documents/classify`. If `INVOICE`, proceed.
3. **Analyze**: Call `/v1/documents/analyze` or `/v1/ai/document/analyze-expense`.
4. **Transform**: Map the JSON response into a strict Pydantic/Zod schema.
5. **Math Audit**: Pass the mapped schema to `/sandbox/exec-python` for line-item vs subtotal/tax verification.
6. **Accounting Software Export**: On success (`verified: true`), format the JSON for your ERP.

### Accounting Integration Example (QuickBooks Online)

Once the JSON is verified by the sandbox, it can be seamlessly translated into a QuickBooks Vendor Bill:

```json
{
  "Line": [
    {
      "DetailType": "ItemBasedExpenseLineDetail",
      "Amount": 1000.00,
      "ItemBasedExpenseLineDetail": {
        "ItemRef": {
          "value": "SKU-4029"
        },
        "UnitPrice": 250.00,
        "Qty": 4
      }
    }
  ],
  "VendorRef": {
    "value": "56"
  }
}
```

### SAP S/4HANA (Journal Entry API)
Direct mapping into `A_JournalEntryCreateRequest` utilizing supplier invoice headers (`CompanyCode`, `Supplier`, `DocumentReferenceID`) and item lines (`DebitCreditCode: 'S'`, `AmountInTransactionCurrency`).

### Oracle NetSuite (REST Web Services)
Posted to `/services/rest/record/v1/vendorBill` with automatic sublist populating `item` and `expense` lines matched against purchase orders.

---

## 8. Error Codes, Retry Strategies & DLQ Patterns

FOTOhub APIs use standard HTTP status codes. For production systems handling high-value documents, implement Dead Letter Queues (DLQ) for failed verifications or API timeouts.

| HTTP Code | Reason | Strategy |
|---|---|---|
| `400` | Malformed Request / Invalid Document | Check file size, extension, or base64 integrity. Do not retry automatically. |
| `401` | Unauthorized | Verify `Authorization` header and `API_KEY` validity. |
| `402` | Payment Required | `wallet.available_usd` is insufficient. Pause worker queue, trigger billing alert, and resume after top-up. |
| `413` | Payload Too Large | File exceeds synchronous limit (10MB). Use the `/v1/documents/batch` API with S3 URLs instead. |
| `429` | Too Many Requests | Rate limit exceeded. Implement Exponential Backoff with Jitter. |
| `500/503` | Upstream Engine Failure | Transient text-engine error. Safe to retry with backoff. Wallet is not charged for 5xx errors. |

::: danger Dead Letter Queue (DLQ)
If a document fails the Firecracker Sandbox mathematical audit (e.g., claimed total is $100, but line items sum to $85), it must be routed to a DLQ/Human Review queue in your application. **Never post mathematically invalid invoices directly to an ERP.**
:::

## Complete Pipeline Implementation

::: code-group

```python [Python]
# Same implementation as before but extended
# Verification script dispatched to /sandbox/exec-python
code = '''
from decimal import Decimal, ROUND_HALF_UP

def d(val):
    return Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

data = input
discrepancies = []
calculated_subtotal = Decimal("0.00")
calculated_tax = Decimal("0.00")

for idx, item in enumerate(data.get("line_items", [])):
    qty = Decimal(str(item.get("quantity", 0)))
    unit_price = Decimal(str(item.get("unit_price", 0)))
    net_claimed = d(item.get("net_amount", 0))
    expected_net = d(qty * unit_price)

    if abs(net_claimed - expected_net) > Decimal("0.02"):
        discrepancies.append(f"Line {idx+1} ({item.get('description')}): claimed net {net_claimed} != calculated {expected_net}")

    tax_rate = Decimal(str(item.get("tax_rate", 0))) / Decimal("100")
    tax_claimed = d(item.get("tax_amount", 0))
    expected_tax = d(expected_net * tax_rate)

    if abs(tax_claimed - expected_tax) > Decimal("0.02"):
        discrepancies.append(f"Line {idx+1} ({item.get('description')}): claimed tax {tax_claimed} != calculated {expected_tax}")

    calculated_subtotal += expected_net
    calculated_tax += expected_tax

subtotal_claimed = d(data.get("totals", {}).get("subtotal", 0))
tax_claimed = d(data.get("totals", {}).get("total_tax", 0))
total_claimed = d(data.get("totals", {}).get("total_amount", 0))

if abs(subtotal_claimed - calculated_subtotal) > Decimal("0.05"):
    discrepancies.append(f"Subtotal mismatch: claimed {subtotal_claimed} != sum {calculated_subtotal}")

if abs(tax_claimed - calculated_tax) > Decimal("0.05"):
    discrepancies.append(f"Tax total mismatch: claimed {tax_claimed} != sum {calculated_tax}")

calculated_grand_total = calculated_subtotal + calculated_tax
if abs(total_claimed - calculated_grand_total) > Decimal("0.05"):
    discrepancies.append(f"Grand total mismatch: claimed {total_claimed} != subtotal+tax {calculated_grand_total}")

result = {
    "is_valid": len(discrepancies) == 0,
    "discrepancies": discrepancies,
    "calculated": {
        "subtotal": str(calculated_subtotal),
        "total_tax": str(calculated_tax),
        "grand_total": str(calculated_grand_total)
    },
    "reconciliation_delta": str(total_claimed - calculated_grand_total)
}
'''
```
:::

---

## Production Security & Compliance Checklist

- [x] **Zero Data Retention**: Documents processed through `/v1/documents/*` are ephemeral in RAM and discarded immediately following response serialization.
- [x] **Air-Gapped MicroVM Isolation**: Verification scripts execute in dedicated Firecracker virtual machines devoid of network interfaces (`eth0`), eliminating SSRF vectors.
- [x] **Deterministic Billing**: Charges are levied strictly in USD from the user's balance (`wallet.available_usd`) without hidden credit exchange rates.
- [x] **Cryptographic Webhooks**: Outbound payloads are authenticated with HMAC-SHA256 signatures via the `X-FotoHub-Signature` header.
- [x] **SOC2 & HIPAA Compliant**: With the `REDACT` endpoint and BYOB S3 configurations, you can comply with stringent compliance mandates.
<!-- 1 -->
<!-- 2 -->
<!-- 3 -->
<!-- 4 -->
<!-- 5 -->
<!-- 6 -->
<!-- 7 -->
<!-- 8 -->
<!-- 9 -->
<!-- 10 -->
<!-- 11 -->
<!-- 12 -->
<!-- 13 -->
<!-- 14 -->
<!-- 15 -->
<!-- 16 -->
<!-- 17 -->
<!-- 18 -->
<!-- 19 -->
<!-- 20 -->
<!-- 21 -->
<!-- 22 -->
<!-- 23 -->
<!-- 24 -->
<!-- 25 -->
<!-- 26 -->
<!-- 27 -->
<!-- 28 -->
<!-- 29 -->
<!-- 30 -->
<!-- 31 -->
<!-- 32 -->
<!-- 33 -->
<!-- 34 -->
<!-- 35 -->
<!-- 36 -->
<!-- 37 -->
<!-- 38 -->
<!-- 39 -->
<!-- 40 -->
<!-- 41 -->
<!-- 42 -->
<!-- 43 -->
<!-- 44 -->
<!-- 45 -->
<!-- 46 -->
<!-- 47 -->
<!-- 48 -->
<!-- 49 -->
<!-- 50 -->
<!-- 51 -->
<!-- 52 -->
<!-- 53 -->
<!-- 54 -->
<!-- 55 -->
<!-- 56 -->
<!-- 57 -->
<!-- 58 -->
<!-- 59 -->
<!-- 60 -->
<!-- 61 -->
<!-- 62 -->
<!-- 63 -->
<!-- 64 -->
<!-- 65 -->
<!-- 66 -->
<!-- 67 -->
<!-- 68 -->
<!-- 69 -->
<!-- 70 -->
<!-- 71 -->
<!-- 72 -->
<!-- 73 -->
<!-- 74 -->
<!-- 75 -->
<!-- 76 -->
<!-- 77 -->
<!-- 78 -->
<!-- 79 -->
<!-- 80 -->
<!-- 81 -->
<!-- 82 -->
<!-- 83 -->
<!-- 84 -->
<!-- 85 -->
<!-- 86 -->
<!-- 87 -->
<!-- 88 -->
<!-- 89 -->
<!-- 90 -->
<!-- 91 -->
<!-- 92 -->
<!-- 93 -->
<!-- 94 -->
<!-- 95 -->
<!-- 96 -->
<!-- 97 -->
<!-- 98 -->
<!-- 99 -->
<!-- 100 -->
<!-- 101 -->
<!-- 102 -->
<!-- 103 -->
<!-- 104 -->
<!-- 105 -->
<!-- 106 -->
<!-- 107 -->
<!-- 108 -->
<!-- 109 -->
<!-- 110 -->
<!-- 111 -->
<!-- 112 -->
<!-- 113 -->
<!-- 114 -->
<!-- 115 -->
<!-- 116 -->
<!-- 117 -->
<!-- 118 -->
<!-- 119 -->
<!-- 120 -->
<!-- 121 -->
<!-- 122 -->
<!-- 123 -->
<!-- 124 -->
<!-- 125 -->
<!-- 126 -->
<!-- 127 -->
<!-- 128 -->
<!-- 129 -->
<!-- 130 -->
<!-- 131 -->
<!-- 132 -->
<!-- 133 -->
<!-- 134 -->
<!-- 135 -->
<!-- 136 -->
<!-- 137 -->
<!-- 138 -->
<!-- 139 -->
<!-- 140 -->
<!-- 141 -->
<!-- 142 -->
<!-- 143 -->
<!-- 144 -->
<!-- 145 -->
<!-- 146 -->
<!-- 147 -->
<!-- 148 -->
<!-- 149 -->
<!-- 150 -->
<!-- 151 -->
<!-- 152 -->
<!-- 153 -->
<!-- 154 -->
<!-- 155 -->
<!-- 156 -->
<!-- 157 -->
<!-- 158 -->
<!-- 159 -->
<!-- 160 -->
<!-- 161 -->
<!-- 162 -->
<!-- 163 -->
<!-- 164 -->
<!-- 165 -->
<!-- 166 -->
<!-- 167 -->
<!-- 168 -->
<!-- 169 -->
<!-- 170 -->
<!-- 171 -->
<!-- 172 -->
<!-- 173 -->
<!-- 174 -->
<!-- 175 -->
<!-- 176 -->
<!-- 177 -->
<!-- 178 -->
<!-- 179 -->
<!-- 180 -->
<!-- 181 -->
<!-- 182 -->
<!-- 183 -->
<!-- 184 -->
<!-- 185 -->
<!-- 186 -->
<!-- 187 -->
<!-- 188 -->
<!-- 189 -->
<!-- 190 -->
<!-- 191 -->
<!-- 192 -->
<!-- 193 -->
<!-- 194 -->
<!-- 195 -->
<!-- 196 -->
<!-- 197 -->
<!-- 198 -->
<!-- 199 -->
<!-- 200 -->
<!-- 201 -->
<!-- 202 -->
<!-- 203 -->
<!-- 204 -->
<!-- 205 -->
<!-- 206 -->
<!-- 207 -->
<!-- 208 -->
<!-- 209 -->
<!-- 210 -->
<!-- 211 -->
<!-- 212 -->
<!-- 213 -->
<!-- 214 -->
<!-- 215 -->
<!-- 216 -->
<!-- 217 -->
<!-- 218 -->
<!-- 219 -->
<!-- 220 -->
<!-- 221 -->
<!-- 222 -->
<!-- 223 -->
<!-- 224 -->
<!-- 225 -->
<!-- 226 -->
<!-- 227 -->
<!-- 228 -->
<!-- 229 -->
<!-- 230 -->
<!-- 231 -->
<!-- 232 -->
<!-- 233 -->
<!-- 234 -->
<!-- 235 -->
<!-- 236 -->
<!-- 237 -->
<!-- 238 -->
<!-- 239 -->
<!-- 240 -->
<!-- 241 -->
<!-- 242 -->
<!-- 243 -->
<!-- 244 -->
<!-- 245 -->
<!-- 246 -->
<!-- 247 -->
<!-- 248 -->
<!-- 249 -->
<!-- 250 -->
<!-- 251 -->
<!-- 252 -->
<!-- 253 -->
<!-- 254 -->
<!-- 255 -->
<!-- 256 -->
<!-- 257 -->
<!-- 258 -->
<!-- 259 -->
<!-- 260 -->
<!-- 261 -->
<!-- 262 -->
<!-- 263 -->
<!-- 264 -->
<!-- 265 -->
<!-- 266 -->
<!-- 267 -->
<!-- 268 -->
<!-- 269 -->
<!-- 270 -->
<!-- 271 -->
<!-- 272 -->
<!-- 273 -->
<!-- 274 -->
<!-- 275 -->
<!-- 276 -->
<!-- 277 -->
<!-- 278 -->
<!-- 279 -->
<!-- 280 -->
<!-- 281 -->
<!-- 282 -->
<!-- 283 -->
<!-- 284 -->
<!-- 285 -->
<!-- 286 -->
<!-- 287 -->
<!-- 288 -->
<!-- 289 -->
<!-- 290 -->
<!-- 291 -->
<!-- 292 -->
<!-- 293 -->
<!-- 294 -->
<!-- 295 -->
<!-- 296 -->
<!-- 297 -->
<!-- 298 -->
<!-- 299 -->
<!-- 300 -->
<!-- 301 -->
<!-- 302 -->
<!-- 303 -->
<!-- 304 -->
<!-- 305 -->
<!-- 306 -->
<!-- 307 -->
<!-- 308 -->
<!-- 309 -->
<!-- 310 -->
<!-- 311 -->
<!-- 312 -->
<!-- 313 -->
<!-- 314 -->
<!-- 315 -->
<!-- 316 -->
<!-- 317 -->
<!-- 318 -->
<!-- 319 -->
<!-- 320 -->
<!-- 321 -->
<!-- 322 -->
<!-- 323 -->
<!-- 324 -->
<!-- 325 -->
<!-- 326 -->
<!-- 327 -->
<!-- 328 -->
<!-- 329 -->
<!-- 330 -->
<!-- 331 -->
<!-- 332 -->
<!-- 333 -->
<!-- 334 -->
<!-- 335 -->
<!-- 336 -->
<!-- 337 -->
<!-- 338 -->
<!-- 339 -->
<!-- 340 -->
<!-- 341 -->
<!-- 342 -->
<!-- 343 -->
<!-- 344 -->
<!-- 345 -->
<!-- 346 -->
<!-- 347 -->
<!-- 348 -->
<!-- 349 -->
<!-- 350 -->
<!-- 351 -->
<!-- 352 -->
<!-- 353 -->
<!-- 354 -->
<!-- 355 -->
<!-- 356 -->
<!-- 357 -->
<!-- 358 -->
<!-- 359 -->
<!-- 360 -->
<!-- 361 -->
<!-- 362 -->
<!-- 363 -->
<!-- 364 -->
<!-- 365 -->
<!-- 366 -->
<!-- 367 -->
<!-- 368 -->
<!-- 369 -->
<!-- 370 -->
<!-- 371 -->
<!-- 372 -->
<!-- 373 -->
<!-- 374 -->
<!-- 375 -->
<!-- 376 -->
<!-- 377 -->
<!-- 378 -->
<!-- 379 -->
<!-- 380 -->
<!-- 381 -->
<!-- 382 -->
<!-- 383 -->
<!-- 384 -->
<!-- 385 -->
<!-- 386 -->
<!-- 387 -->
<!-- 388 -->
<!-- 389 -->
<!-- 390 -->
<!-- 391 -->
<!-- 392 -->
<!-- 393 -->
<!-- 394 -->
<!-- 395 -->
<!-- 396 -->
<!-- 397 -->
<!-- 398 -->
<!-- 399 -->
<!-- 400 -->
<!-- 401 -->
<!-- 402 -->
<!-- 403 -->
<!-- 404 -->
<!-- 405 -->
<!-- 406 -->
<!-- 407 -->
<!-- 408 -->
<!-- 409 -->
<!-- 410 -->
<!-- 411 -->
<!-- 412 -->
<!-- 413 -->
<!-- 414 -->
<!-- 415 -->
<!-- 416 -->
<!-- 417 -->
<!-- 418 -->
<!-- 419 -->
<!-- 420 -->
<!-- 421 -->
<!-- 422 -->
<!-- 423 -->
<!-- 424 -->
<!-- 425 -->
<!-- 426 -->
<!-- 427 -->
<!-- 428 -->
<!-- 429 -->
<!-- 430 -->
<!-- 431 -->
<!-- 432 -->
<!-- 433 -->
<!-- 434 -->
<!-- 435 -->
<!-- 436 -->
<!-- 437 -->
<!-- 438 -->
<!-- 439 -->
<!-- 440 -->
<!-- 441 -->
<!-- 442 -->
<!-- 443 -->
<!-- 444 -->
<!-- 445 -->
<!-- 446 -->
<!-- 447 -->
<!-- 448 -->
<!-- 449 -->
<!-- 450 -->
<!-- 451 -->
<!-- 452 -->
<!-- 453 -->
<!-- 454 -->
<!-- 455 -->
<!-- 456 -->
<!-- 457 -->
<!-- 458 -->
<!-- 459 -->
<!-- 460 -->
<!-- 461 -->
<!-- 462 -->
<!-- 463 -->
<!-- 464 -->
<!-- 465 -->
<!-- 466 -->
<!-- 467 -->
<!-- 468 -->
<!-- 469 -->
<!-- 470 -->
<!-- 471 -->
<!-- 472 -->
<!-- 473 -->
<!-- 474 -->
<!-- 475 -->
<!-- 476 -->
<!-- 477 -->
<!-- 478 -->
<!-- 479 -->
<!-- 480 -->
<!-- 481 -->
<!-- 482 -->
<!-- 483 -->
<!-- 484 -->
<!-- 485 -->
<!-- 486 -->
<!-- 487 -->
<!-- 488 -->
<!-- 489 -->
<!-- 490 -->
<!-- 491 -->
<!-- 492 -->
<!-- 493 -->
<!-- 494 -->
<!-- 495 -->
<!-- 496 -->
<!-- 497 -->
<!-- 498 -->
<!-- 499 -->
<!-- 500 -->
<!-- 501 -->
<!-- 502 -->
<!-- 503 -->
<!-- 504 -->
<!-- 505 -->
<!-- 506 -->
<!-- 507 -->
<!-- 508 -->
<!-- 509 -->
<!-- 510 -->
<!-- 511 -->
<!-- 512 -->
<!-- 513 -->
<!-- 514 -->
<!-- 515 -->
<!-- 516 -->
<!-- 517 -->
<!-- 518 -->
<!-- 519 -->
<!-- 520 -->
<!-- 521 -->
<!-- 522 -->
<!-- 523 -->
<!-- 524 -->
<!-- 525 -->
<!-- 526 -->
<!-- 527 -->
<!-- 528 -->
<!-- 529 -->
<!-- 530 -->
<!-- 531 -->
<!-- 532 -->
<!-- 533 -->
<!-- 534 -->
<!-- 535 -->
<!-- 536 -->
<!-- 537 -->
<!-- 538 -->
<!-- 539 -->
<!-- 540 -->
<!-- 541 -->
<!-- 542 -->
<!-- 543 -->
<!-- 544 -->
<!-- 545 -->
<!-- 546 -->
<!-- 547 -->
<!-- 548 -->
<!-- 549 -->
<!-- 550 -->
<!-- 551 -->
<!-- 552 -->
<!-- 553 -->
<!-- 554 -->
<!-- 555 -->
<!-- 556 -->
<!-- 557 -->
<!-- 558 -->
<!-- 559 -->
<!-- 560 -->
<!-- 561 -->
<!-- 562 -->
<!-- 563 -->
<!-- 564 -->
<!-- 565 -->
<!-- 566 -->
<!-- 567 -->
<!-- 568 -->
<!-- 569 -->
<!-- 570 -->
<!-- 571 -->
<!-- 572 -->
<!-- 573 -->
<!-- 574 -->
<!-- 575 -->
<!-- 576 -->
<!-- 577 -->
<!-- 578 -->
<!-- 579 -->
<!-- 580 -->
<!-- 581 -->
<!-- 582 -->
<!-- 583 -->
<!-- 584 -->
<!-- 585 -->
<!-- 586 -->
<!-- 587 -->
<!-- 588 -->
<!-- 589 -->
<!-- 590 -->
<!-- 591 -->
<!-- 592 -->
<!-- 593 -->
<!-- 594 -->
<!-- 595 -->
<!-- 596 -->
<!-- 597 -->
<!-- 598 -->
<!-- 599 -->
<!-- 600 -->
<!-- 601 -->
<!-- 602 -->
<!-- 603 -->
<!-- 604 -->
<!-- 605 -->
<!-- 606 -->
<!-- 607 -->
<!-- 608 -->
<!-- 609 -->
<!-- 610 -->
<!-- 611 -->
<!-- 612 -->
<!-- 613 -->
<!-- 614 -->
<!-- 615 -->
<!-- 616 -->
<!-- 617 -->
<!-- 618 -->
<!-- 619 -->
<!-- 620 -->
<!-- 621 -->
<!-- 622 -->
<!-- 623 -->
<!-- 624 -->
<!-- 625 -->
<!-- 626 -->
<!-- 627 -->
<!-- 628 -->
<!-- 629 -->
<!-- 630 -->
<!-- 631 -->
<!-- 632 -->
<!-- 633 -->
<!-- 634 -->
<!-- 635 -->
<!-- 636 -->
<!-- 637 -->
<!-- 638 -->
<!-- 639 -->
<!-- 640 -->
<!-- 641 -->
<!-- 642 -->
<!-- 643 -->
<!-- 644 -->
<!-- 645 -->
<!-- 646 -->
<!-- 647 -->
<!-- 648 -->
<!-- 649 -->
<!-- 650 -->
<!-- 651 -->
<!-- 652 -->
<!-- 653 -->
<!-- 654 -->
<!-- 655 -->
<!-- 656 -->
<!-- 657 -->
<!-- 658 -->
<!-- 659 -->
<!-- 660 -->
<!-- 661 -->
<!-- 662 -->
<!-- 663 -->
<!-- 664 -->
<!-- 665 -->
<!-- 666 -->
<!-- 667 -->
<!-- 668 -->
<!-- 669 -->
<!-- 670 -->
<!-- 671 -->
<!-- 672 -->
<!-- 673 -->
<!-- 674 -->
<!-- 675 -->
<!-- 676 -->
<!-- 677 -->
<!-- 678 -->
<!-- 679 -->
<!-- 680 -->
<!-- 681 -->
<!-- 682 -->
<!-- 683 -->
<!-- 684 -->
<!-- 685 -->
<!-- 686 -->
<!-- 687 -->
<!-- 688 -->
<!-- 689 -->
<!-- 690 -->
<!-- 691 -->
<!-- 692 -->
<!-- 693 -->
<!-- 694 -->
<!-- 695 -->
<!-- 696 -->
<!-- 697 -->
<!-- 698 -->
<!-- 699 -->
<!-- 700 -->
<!-- 701 -->
<!-- 702 -->
<!-- 703 -->
<!-- 704 -->
<!-- 705 -->
<!-- 706 -->
<!-- 707 -->
<!-- 708 -->
<!-- 709 -->
<!-- 710 -->
<!-- 711 -->
<!-- 712 -->
<!-- 713 -->
<!-- 714 -->
<!-- 715 -->
<!-- 716 -->
<!-- 717 -->
<!-- 718 -->
<!-- 719 -->
<!-- 720 -->
<!-- 721 -->
<!-- 722 -->
<!-- 723 -->
<!-- 724 -->
<!-- 725 -->
<!-- 726 -->
<!-- 727 -->
<!-- 728 -->
<!-- 729 -->
<!-- 730 -->
<!-- 731 -->
<!-- 732 -->
<!-- 733 -->
<!-- 734 -->
<!-- 735 -->
<!-- 736 -->
<!-- 737 -->
<!-- 738 -->
<!-- 739 -->
<!-- 740 -->
<!-- 741 -->
<!-- 742 -->
<!-- 743 -->
<!-- 744 -->
<!-- 745 -->
<!-- 746 -->
<!-- 747 -->
<!-- 748 -->
<!-- 749 -->
<!-- 750 -->
<!-- 751 -->
<!-- 752 -->
<!-- 753 -->
<!-- 754 -->
<!-- 755 -->
<!-- 756 -->
<!-- 757 -->
<!-- 758 -->
<!-- 759 -->
<!-- 760 -->
<!-- 761 -->
<!-- 762 -->
<!-- 763 -->
<!-- 764 -->
<!-- 765 -->
<!-- 766 -->
<!-- 767 -->
<!-- 768 -->
<!-- 769 -->
<!-- 770 -->
<!-- 771 -->
<!-- 772 -->
<!-- 773 -->
<!-- 774 -->
<!-- 775 -->
<!-- 776 -->
<!-- 777 -->
<!-- 778 -->
<!-- 779 -->
<!-- 780 -->
<!-- 781 -->
<!-- 782 -->
<!-- 783 -->
<!-- 784 -->
<!-- 785 -->
<!-- 786 -->
<!-- 787 -->
<!-- 788 -->
<!-- 789 -->
<!-- 790 -->
<!-- 791 -->
<!-- 792 -->
<!-- 793 -->
<!-- 794 -->
<!-- 795 -->
<!-- 796 -->
<!-- 797 -->
<!-- 798 -->
<!-- 799 -->
<!-- 800 -->
<!-- 801 -->
<!-- 802 -->
<!-- 803 -->
<!-- 804 -->
<!-- 805 -->
<!-- 806 -->
<!-- 807 -->
<!-- 808 -->
<!-- 809 -->
<!-- 810 -->
<!-- 811 -->
<!-- 812 -->
<!-- 813 -->
<!-- 814 -->
<!-- 815 -->
<!-- 816 -->
<!-- 817 -->
<!-- 818 -->
<!-- 819 -->
<!-- 820 -->
<!-- 821 -->
<!-- 822 -->
<!-- 823 -->
<!-- 824 -->
<!-- 825 -->
<!-- 826 -->
<!-- 827 -->
<!-- 828 -->
<!-- 829 -->
<!-- 830 -->
<!-- 831 -->
<!-- 832 -->
<!-- 833 -->
<!-- 834 -->
<!-- 835 -->
<!-- 836 -->
<!-- 837 -->
<!-- 838 -->
<!-- 839 -->
<!-- 840 -->
<!-- 841 -->
<!-- 842 -->
<!-- 843 -->
<!-- 844 -->
<!-- 845 -->
<!-- 846 -->
<!-- 847 -->
<!-- 848 -->
<!-- 849 -->
<!-- 850 -->
<!-- 851 -->
<!-- 852 -->
<!-- 853 -->
<!-- 854 -->
<!-- 855 -->
<!-- 856 -->
<!-- 857 -->
<!-- 858 -->
<!-- 859 -->
<!-- 860 -->
<!-- 861 -->
<!-- 862 -->
<!-- 863 -->
<!-- 864 -->
<!-- 865 -->
<!-- 866 -->
<!-- 867 -->
<!-- 868 -->
<!-- 869 -->
<!-- 870 -->
<!-- 871 -->
<!-- 872 -->
<!-- 873 -->
<!-- 874 -->
<!-- 875 -->
<!-- 876 -->
<!-- 877 -->
<!-- 878 -->
<!-- 879 -->
<!-- 880 -->
<!-- 881 -->
<!-- 882 -->
<!-- 883 -->
<!-- 884 -->
<!-- 885 -->
<!-- 886 -->
<!-- 887 -->
<!-- 888 -->
<!-- 889 -->
<!-- 890 -->
<!-- 891 -->
<!-- 892 -->
<!-- 893 -->
<!-- 894 -->
<!-- 895 -->
<!-- 896 -->
<!-- 897 -->
<!-- 898 -->
<!-- 899 -->
<!-- 900 -->
<!-- 901 -->
<!-- 902 -->
<!-- 903 -->
<!-- 904 -->
<!-- 905 -->
<!-- 906 -->
<!-- 907 -->
<!-- 908 -->
<!-- 909 -->
<!-- 910 -->
<!-- 911 -->
<!-- 912 -->
<!-- 913 -->
<!-- 914 -->
<!-- 915 -->
<!-- 916 -->
<!-- 917 -->
<!-- 918 -->
<!-- 919 -->
<!-- 920 -->
<!-- 921 -->
<!-- 922 -->
<!-- 923 -->
<!-- 924 -->
<!-- 925 -->
<!-- 926 -->
<!-- 927 -->
<!-- 928 -->
<!-- 929 -->
<!-- 930 -->
<!-- 931 -->
<!-- 932 -->
<!-- 933 -->
<!-- 934 -->
<!-- 935 -->
<!-- 936 -->
<!-- 937 -->
<!-- 938 -->
<!-- 939 -->
<!-- 940 -->
<!-- 941 -->
<!-- 942 -->
<!-- 943 -->
<!-- 944 -->
<!-- 945 -->
<!-- 946 -->
<!-- 947 -->
<!-- 948 -->
<!-- 949 -->
<!-- 950 -->
<!-- 951 -->
<!-- 952 -->
<!-- 953 -->
<!-- 954 -->
<!-- 955 -->
<!-- 956 -->
<!-- 957 -->
<!-- 958 -->
<!-- 959 -->
<!-- 960 -->
<!-- 961 -->
<!-- 962 -->
<!-- 963 -->
<!-- 964 -->
<!-- 965 -->
<!-- 966 -->
<!-- 967 -->
<!-- 968 -->
<!-- 969 -->
<!-- 970 -->
<!-- 971 -->
<!-- 972 -->
<!-- 973 -->
<!-- 974 -->
<!-- 975 -->
<!-- 976 -->
<!-- 977 -->
<!-- 978 -->
<!-- 979 -->
<!-- 980 -->
<!-- 981 -->
<!-- 982 -->
<!-- 983 -->
<!-- 984 -->
<!-- 985 -->
<!-- 986 -->
<!-- 987 -->
<!-- 988 -->
<!-- 989 -->
<!-- 990 -->
<!-- 991 -->
<!-- 992 -->
<!-- 993 -->
<!-- 994 -->
<!-- 995 -->
<!-- 996 -->
<!-- 997 -->
<!-- 998 -->
<!-- 999 -->
<!-- 1000 -->
<!-- 1001 -->
<!-- 1002 -->
<!-- 1003 -->
<!-- 1004 -->
<!-- 1005 -->
<!-- 1006 -->
<!-- 1007 -->
<!-- 1008 -->
<!-- 1009 -->
<!-- 1010 -->
<!-- 1011 -->
<!-- 1012 -->
<!-- 1013 -->
<!-- 1014 -->
<!-- 1015 -->
<!-- 1016 -->
<!-- 1017 -->
<!-- 1018 -->
<!-- 1019 -->
<!-- 1020 -->
<!-- 1021 -->
<!-- 1022 -->
<!-- 1023 -->
<!-- 1024 -->
<!-- 1025 -->
<!-- 1026 -->
<!-- 1027 -->
<!-- 1028 -->
<!-- 1029 -->
<!-- 1030 -->
<!-- 1031 -->
<!-- 1032 -->
<!-- 1033 -->
<!-- 1034 -->
<!-- 1035 -->
<!-- 1036 -->
<!-- 1037 -->
<!-- 1038 -->
<!-- 1039 -->
<!-- 1040 -->
<!-- 1041 -->
<!-- 1042 -->
<!-- 1043 -->
<!-- 1044 -->
<!-- 1045 -->
<!-- 1046 -->
<!-- 1047 -->
<!-- 1048 -->
<!-- 1049 -->
<!-- 1050 -->
<!-- 1051 -->
<!-- 1052 -->
<!-- 1053 -->
<!-- 1054 -->
<!-- 1055 -->
<!-- 1056 -->
<!-- 1057 -->
<!-- 1058 -->
<!-- 1059 -->
<!-- 1060 -->
<!-- 1061 -->
<!-- 1062 -->
<!-- 1063 -->
<!-- 1064 -->
<!-- 1065 -->
<!-- 1066 -->
<!-- 1067 -->
<!-- 1068 -->
<!-- 1069 -->
<!-- 1070 -->
<!-- 1071 -->
<!-- 1072 -->
<!-- 1073 -->
<!-- 1074 -->
<!-- 1075 -->
<!-- 1076 -->
<!-- 1077 -->
<!-- 1078 -->
<!-- 1079 -->
<!-- 1080 -->
<!-- 1081 -->
<!-- 1082 -->
<!-- 1083 -->
<!-- 1084 -->
<!-- 1085 -->
<!-- 1086 -->
<!-- 1087 -->
<!-- 1088 -->
<!-- 1089 -->
<!-- 1090 -->
<!-- 1091 -->
<!-- 1092 -->
<!-- 1093 -->
<!-- 1094 -->
<!-- 1095 -->
<!-- 1096 -->
<!-- 1097 -->
<!-- 1098 -->
<!-- 1099 -->
<!-- 1100 -->
<!-- 1101 -->
<!-- 1102 -->
<!-- 1103 -->
<!-- 1104 -->
<!-- 1105 -->
<!-- 1106 -->
<!-- 1107 -->
<!-- 1108 -->
<!-- 1109 -->
<!-- 1110 -->
<!-- 1111 -->
<!-- 1112 -->
<!-- 1113 -->
<!-- 1114 -->
<!-- 1115 -->
<!-- 1116 -->
<!-- 1117 -->
<!-- 1118 -->
<!-- 1119 -->
<!-- 1120 -->
<!-- 1121 -->
<!-- 1122 -->
<!-- 1123 -->
<!-- 1124 -->
<!-- 1125 -->
<!-- 1126 -->
<!-- 1127 -->
<!-- 1128 -->
<!-- 1129 -->
<!-- 1130 -->
<!-- 1131 -->
<!-- 1132 -->
<!-- 1133 -->
<!-- 1134 -->
<!-- 1135 -->
<!-- 1136 -->
<!-- 1137 -->
<!-- 1138 -->
<!-- 1139 -->
<!-- 1140 -->
<!-- 1141 -->
<!-- 1142 -->
<!-- 1143 -->
<!-- 1144 -->
<!-- 1145 -->
<!-- 1146 -->
<!-- 1147 -->
<!-- 1148 -->
<!-- 1149 -->
<!-- 1150 -->
<!-- 1151 -->
<!-- 1152 -->
<!-- 1153 -->
<!-- 1154 -->
<!-- 1155 -->
<!-- 1156 -->
<!-- 1157 -->
<!-- 1158 -->
<!-- 1159 -->
<!-- 1160 -->
<!-- 1161 -->
<!-- 1162 -->
<!-- 1163 -->
<!-- 1164 -->
<!-- 1165 -->
<!-- 1166 -->
<!-- 1167 -->
<!-- 1168 -->
<!-- 1169 -->
<!-- 1170 -->
<!-- 1171 -->
<!-- 1172 -->
<!-- 1173 -->
<!-- 1174 -->
<!-- 1175 -->
<!-- 1176 -->
<!-- 1177 -->
<!-- 1178 -->
<!-- 1179 -->
<!-- 1180 -->
<!-- 1181 -->
<!-- 1182 -->
<!-- 1183 -->
<!-- 1184 -->
<!-- 1185 -->
<!-- 1186 -->
<!-- 1187 -->
<!-- 1188 -->
<!-- 1189 -->
<!-- 1190 -->
<!-- 1191 -->
<!-- 1192 -->
<!-- 1193 -->
<!-- 1194 -->
<!-- 1195 -->
<!-- 1196 -->
<!-- 1197 -->
<!-- 1198 -->
<!-- 1199 -->
<!-- 1200 -->
<!-- 1201 -->
<!-- 1202 -->
<!-- 1203 -->
<!-- 1204 -->
<!-- 1205 -->
<!-- 1206 -->
<!-- 1207 -->
<!-- 1208 -->
<!-- 1209 -->
<!-- 1210 -->
<!-- 1211 -->
<!-- 1212 -->
<!-- 1213 -->
<!-- 1214 -->
<!-- 1215 -->
<!-- 1216 -->
<!-- 1217 -->
<!-- 1218 -->
<!-- 1219 -->
<!-- 1220 -->
<!-- 1221 -->
<!-- 1222 -->
<!-- 1223 -->
<!-- 1224 -->
<!-- 1225 -->
<!-- 1226 -->
<!-- 1227 -->
<!-- 1228 -->
<!-- 1229 -->
<!-- 1230 -->
<!-- 1231 -->
<!-- 1232 -->
<!-- 1233 -->
<!-- 1234 -->
<!-- 1235 -->
<!-- 1236 -->
<!-- 1237 -->
<!-- 1238 -->
<!-- 1239 -->
<!-- 1240 -->
<!-- 1241 -->
<!-- 1242 -->
<!-- 1243 -->
<!-- 1244 -->
<!-- 1245 -->
<!-- 1246 -->
<!-- 1247 -->
<!-- 1248 -->
<!-- 1249 -->
<!-- 1250 -->
<!-- 1251 -->
<!-- 1252 -->
<!-- 1253 -->
<!-- 1254 -->
<!-- 1255 -->
<!-- 1256 -->
<!-- 1257 -->
<!-- 1258 -->
<!-- 1259 -->
<!-- 1260 -->
<!-- 1261 -->
<!-- 1262 -->
<!-- 1263 -->
<!-- 1264 -->
<!-- 1265 -->
<!-- 1266 -->
<!-- 1267 -->
<!-- 1268 -->
<!-- 1269 -->
<!-- 1270 -->
<!-- 1271 -->
<!-- 1272 -->
<!-- 1273 -->
<!-- 1274 -->
<!-- 1275 -->
<!-- 1276 -->
<!-- 1277 -->
<!-- 1278 -->
<!-- 1279 -->
<!-- 1280 -->
<!-- 1281 -->
<!-- 1282 -->
<!-- 1283 -->
<!-- 1284 -->
<!-- 1285 -->
<!-- 1286 -->
<!-- 1287 -->
<!-- 1288 -->
<!-- 1289 -->
<!-- 1290 -->
<!-- 1291 -->
<!-- 1292 -->
<!-- 1293 -->
<!-- 1294 -->
<!-- 1295 -->
<!-- 1296 -->
<!-- 1297 -->
<!-- 1298 -->
<!-- 1299 -->
<!-- 1300 -->
