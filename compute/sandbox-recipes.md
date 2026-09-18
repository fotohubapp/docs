# Practical Sandboxes & MicroVM Recipes

Copy-paste ready `code` snippets for statistical data pipelines, file parsing, and small
scoring/analysis jobs, meant to run inside a `code.python` node of an Agent Engine workflow —
FOTOhub's isolated Firecracker microVM sandbox.

:::warning Not a standalone public API
There is no directly callable `POST /sandbox/exec-python` or `exec-bash` endpoint — the real
route lives on the internal Agent Compute service, gated by a proxy secret your API key does
not have. You run these snippets by putting them in the `code` parameter of a `code.python` node
inside an Agent Engine workflow (`POST /engine/v1/workflows`). Full mechanism, request/response
schema, and architecture: [Firecracker Sandboxes](/compute/agent-sandboxes).
:::

### Request shape (inside the `code.python` node's `params`)
```json
{
  "code": "string (required) — the Python source. Assign your return value to result = ...",
  "input": "object (optional) — injected as the global `input` dict",
  "timeout_s": "integer (optional, default 30, hard-capped at 120)",
  "memory_mb": "integer (optional, default 512)"
}
```

### Response shape
```json
{
  "ok": true,
  "value": "whatever you assigned to result",
  "stdout": "",
  "stderr": "",
  "error": null,
  "duration_ms": 142
}
```

---

## Security Boundaries & Limitations
- **No network access by default:** the guest has no virtual ethernet device (`virtio-vsock` only).
- **No filesystem persistence:** state does not survive between executions unless you pass it back via `input` on the next call.
- **No environment leakage:** host environment variables are not exposed to the guest.
- **Pre-installed packages:** `numpy`, `pandas`, `scipy`, `PIL`, `scikit-learn`, `httpx`, `beautifulsoup4`.

---

## Billing
Sandbox wall-clock time bills at **$0.0002/second**, added to the cost of the workflow step that
triggered it — there's no separate "per sandbox call" line item. A 400ms execution adds about
**$0.00008** to that step.

---

## 15 Recipes

Each of these is a `code` string for the `code.python` node's `params.code` — read `input[...]`,
assign your answer to `result`.

### 1. Pandas DataFrame operations (filter, groupby, pivot)
```python
code = '''
import pandas as pd
df = pd.DataFrame(input['data'])
filtered = df[df['sales'] > 100]
pivot = filtered.pivot_table(index='region', values='sales', aggfunc='sum')
result = pivot.to_dict()
'''
```

### 2. Regular expression batch extraction from HTML/text
```python
code = '''
import re
text = input['text']
emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
result = {"emails": emails}
'''
```

### 3. JSON Schema validation with jsonschema library
```python
code = '''
from jsonschema import validate
try:
    validate(instance=input['data'], schema=input['schema'])
    result = {"valid": True}
except Exception as e:
    result = {"valid": False, "error": str(e)}
'''
```

### 4. Base64 encode/decode binary data
```python
code = '''
import base64
decoded = base64.b64decode(input['b64_str'])
result = {"bytes_len": len(decoded)}
'''
```

### 5. Time series smoothing with SciPy
```python
code = '''
from scipy.signal import savgol_filter
smoothed = savgol_filter(input['series'], window_length=5, polyorder=2)
result = {"smoothed": smoothed.tolist()}
'''
```

### 6. PDF text extraction with pdfplumber
```python
code = '''
import pdfplumber
import io
import base64

pdf_bytes = base64.b64decode(input['pdf_b64'])
with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
    text = "\n".join([page.extract_text() for page in pdf.pages])
result = {"text": text}
'''
```

### 7. Markdown to HTML conversion with markdown library
```python
code = '''
import markdown
html = markdown.markdown(input['md_text'])
result = {"html": html}
'''
```

### 8. Text similarity scoring with difflib.SequenceMatcher
```python
code = '''
from difflib import SequenceMatcher
ratio = SequenceMatcher(None, input['text1'], input['text2']).ratio()
result = {"similarity": ratio}
'''
```

### 9. Bulk URL validation and status checking with httpx
*(Note: requires explicit network mock or pre-fetched data, as network is blocked)*
```python
code = '''
# Since network is blocked, we use this to parse and validate URL structures
from urllib.parse import urlparse
valid = [url for url in input['urls'] if urlparse(url).scheme in ('http', 'https')]
result = {"valid_urls": valid}
'''
```

### 10. YAML to JSON conversion and validation
```python
code = '''
import yaml
parsed = yaml.safe_load(input['yaml_str'])
result = {"json": parsed}
'''
```

### 11. Cryptographic hash computation (SHA-256, MD5, BLAKE2)
```python
code = '''
import hashlib
h = hashlib.sha256(input['text'].encode()).hexdigest()
result = {"sha256": h}
'''
```

### 12. Number theory computations (primes, factorization)
```python
code = '''
def is_prime(n):
    if n < 2: return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0: return False
    return True
result = {"is_prime": is_prime(input['number'])}
'''
```

### 13. Color palette extraction from image bytes
```python
code = '''
from PIL import Image
import io, base64

img_bytes = base64.b64decode(input['image_b64'])
img = Image.open(io.BytesIO(img_bytes)).convert("P", palette=Image.ADAPTIVE, colors=5)
palette = img.getpalette()[:15]
result = {"palette": [palette[i:i+3] for i in range(0, 15, 3)]}
'''
```

### 14. ASCII chart generation from numerical data
```python
code = '''
def ascii_bar(val, max_val, width=20):
    bars = int((val / max_val) * width)
    return "█" * bars
chart = {k: ascii_bar(v, max(input['data'].values())) for k, v in input['data'].items()}
result = {"chart": chart}
'''
```

### 15. Geospatial distance calculation (Haversine formula)
```python
code = '''
import math
def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat, dlon = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))
result = {"distance_km": haversine(*input['coords'])}
'''
```

---

## Advanced Patterns

### Passing Large Data
The guest has no network access by default, so you cannot `requests.get()` an S3 URL from
inside the sandbox. Instead, fetch the data on the workflow side (an `http.request` or
`s3.download` node before the `code.python` node) and pass the bytes/text in via `input`, or
pass a short-lived signed URL in `input` if a later node needs to fetch it itself with network
access enabled.

### Chunking Large Datasets
If your dataframe exceeds the sandbox's memory ceiling, split it across multiple `code.python`
node runs and merge client-side:

```python
import pandas as pd
import math

def chunk_execution(fotohub_client, workflow_id, df, chunk_size=10000):
    num_chunks = math.ceil(len(df) / chunk_size)
    results = []

    for i in range(num_chunks):
        chunk = df.iloc[i * chunk_size : (i + 1) * chunk_size]
        code = '''
import pandas as pd
df = pd.DataFrame(input['data'])
res = df.groupby('category').sum()
result = res.to_dict()
'''
        run = fotohub_client.run_workflow(
            workflow_id,
            code=code,
            input={"data": chunk.to_dict(orient="list")},
        )
        results.append(run["value"])

    return results
```

### Sandbox Result Caching Pattern
Repeatedly running the same operations on the same inputs can get expensive and slow. Cache the
result on your own side rather than re-triggering the workflow.

```python
import hashlib
import json
import redis

r = redis.Redis(host='localhost', port=6379, db=0)

def cached_workflow_run(fotohub_client, workflow_id, code, input_data):
    payload = json.dumps({"code": code, "input": input_data}, sort_keys=True)
    cache_key = f"sandbox_cache_{hashlib.md5(payload.encode()).hexdigest()}"

    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    result = fotohub_client.run_workflow(workflow_id, code=code, input=input_data)

    if result.get("ok"):
        r.setex(cache_key, 3600, json.dumps(result))

    return result
```

### Orchestrating Sandbox Workflows with Apache Airflow
Trigger an Agent Engine workflow (containing a `code.python` node) as an isolated task operator
in your DAG.

```python
from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from datetime import datetime
import requests

def run_ml_pipeline_step(**kwargs):
    res = requests.post(
        "https://apis.fotohub.app/engine/v1/workflows",
        headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
        json={
            "name": "airflow-ml-step",
            "nodes": [{
                "type": "code.python",
                "params": {"code": "import sklearn; result = {'model_score': 0.94}"}
            }]
        }
    )
    return res.json()

dag = DAG('sandbox_ml_pipeline', start_date=datetime(2026, 1, 1))

task = PythonOperator(
    task_id='train_model_sandboxed',
    python_callable=run_ml_pipeline_step,
    dag=dag
)
```

