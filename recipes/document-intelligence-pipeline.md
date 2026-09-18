# Invoice & Receipt Extraction Recipe

::: warning This recipe was substantially rewritten
Earlier revisions of this page described a "Document & Invoice Intelligence
Pipeline" with document classification, PII redaction, async batch
processing with S3/webhook delivery, a Firecracker MicroVM sandbox for
line-item reconciliation, and direct ERP ingest into SAP/NetSuite/
QuickBooks/Xero. **None of that exists.** The endpoints it was built on —
`/v1/documents/classify`, `/v1/documents/extract`, `/v1/documents/redact`,
`/v1/documents/batch`, `/v1/textract/analyze` — all return `404`. There is
no classification step, no redaction engine, no batch/webhook API, no
sandboxed reconciliation service, and no ERP connector anywhere on the
platform.

What's real: three single-document AWS Textract routes under
`/v1/ai/document/*` (see [Document Intelligence](/api/document-intelligence)
for the full reference). They authenticate with a **Supabase user session
JWT**, not an `fh_live_*` API key — so this recipe, as written below, is
something you run from a context that holds a first-party user session
(FOTOhub's own backend or a server acting on a signed-in user's behalf), not
something a third-party integration can call today.

This page is now a small, honest recipe for one document at a time: extract
an invoice with `analyze-expense`, and reconcile the line-item math
yourself, client-side, in your own code.
:::

---

## What's actually possible today

| Step | Reality |
|---|---|
| Ingest one invoice/receipt (PDF/JPEG/PNG/TIFF, ≤10 MB) | Real — `POST /v1/ai/document/analyze-expense` |
| Extract vendor, totals, dates, line items | Real, via AWS Textract `AnalyzeExpense` |
| Classify document type before routing | Not available — no endpoint |
| Redact PII before storage | Not available — no endpoint |
| Submit many documents as one async batch job | Not available — call the endpoint once per document, synchronously |
| Get a webhook when processing finishes | Not available — the HTTP response is the only result you get |
| Deliver results straight to an S3/R2 bucket | Not available — you receive JSON in the response and store it yourself |
| Verify line-item math (`qty × price == total`) | Possible, but it's your own client-side arithmetic — there is no sandboxed verification service |
| Push results into SAP/NetSuite/QuickBooks/Xero | Not available — there is no ERP connector; you'd call those systems' own APIs yourself |

---

## Extract one invoice

```http
POST /v1/ai/document/analyze-expense
Authorization: Bearer <supabase_user_jwt>
Content-Type: application/json
```

Body: `{ "document": "<base64-encoded PDF/JPEG/PNG/TIFF, max 10 MB>" }`

Billing: $0.01/page from the USD wallet, refunded automatically if Textract
fails to process the document.

::: code-group

```python [Python]
import base64
import httpx

def extract_invoice(path: str, supabase_user_jwt: str) -> dict:
    with open(path, "rb") as f:
        doc_b64 = base64.b64encode(f.read()).decode()

    resp = httpx.post(
        "https://apis.fotohub.app/v1/ai/document/analyze-expense",
        headers={"Authorization": f"Bearer {supabase_user_jwt}"},
        json={"document": doc_b64},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json()
```

```bash [cURL]
DOC_B64=$(base64 -w 0 invoice.pdf)
curl -X POST "https://apis.fotohub.app/v1/ai/document/analyze-expense" \
  -H "Authorization: Bearer $SUPABASE_USER_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"document\": \"$DOC_B64\"}"
```

:::

The response shape is documented in full at
[Document Intelligence → Analyze Expense](/api/document-intelligence#analyze-expense-invoice-receipt-extraction).
In short: `expenses[].summary` holds vendor/date/total fields with a
confidence score each, and `expenses[].line_items` holds raw
`{FIELD_TYPE: value}` rows with no confidence score.

## Reconcile line items yourself

Textract does not verify that line items sum to the stated total — that
check, if you want it, is ordinary arithmetic you run on the response:

```python
def reconcile(expense: dict, tolerance: float = 0.01) -> bool:
    """Returns True if line items sum to the extracted total, within tolerance.

    This is plain client-side math over Textract's output — there is no
    verification service on the API side.
    """
    def to_float(s: str) -> float:
        return float(s.replace("$", "").replace(",", "").strip() or 0)

    total_str = expense["summary"].get("TOTAL", {}).get("value")
    if not total_str:
        return False  # nothing to check against

    stated_total = to_float(total_str)
    line_sum = sum(
        to_float(item.get("PRICE", "0"))
        for item in expense["line_items"]
    )
    return abs(stated_total - line_sum) <= tolerance
```

## Processing multiple documents

There is no batch endpoint, so process a list of files with an ordinary loop
and your own concurrency limit — respect normal HTTP rate limits and the
per-request 10 MB cap:

```python
import asyncio

async def extract_many(paths: list[str], supabase_user_jwt: str, concurrency: int = 4):
    sem = asyncio.Semaphore(concurrency)
    results = []

    async def one(path: str):
        async with sem:
            results.append(extract_invoice(path, supabase_user_jwt))

    await asyncio.gather(*(one(p) for p in paths))
    return results
```

Store the JSON results wherever you'd like — the API does not deliver them
to storage on your behalf.

---

## Errors

| HTTP Status | Meaning |
|:---|:---|
| `400` | Missing `document`, or the file exceeds 10 MB. |
| `401` | Missing/invalid/expired Supabase user JWT. An `fh_live_*` API key does not work on this endpoint. |
| `402` | Insufficient wallet balance. Top up at [fotohub.app/console/billing](https://fotohub.app/console/billing). |
| `502` | Textract failed on this document (unsupported format, corrupted file, transient AWS error). The charge is refunded automatically — retry. |
