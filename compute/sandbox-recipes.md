# Practical Sandboxes & MicroVM Recipes

Copy-paste ready, production-grade recipes for executing untrusted user code, statistical data pipelines, dynamic chart rendering, and automated file analysis inside isolated FOTOhub Firecracker microVMs.

All recipes execute via `POST /sandbox/exec-python` or `POST /sandbox/exec-bash` and return structured JSON in under **200 milliseconds**.

---

## Sandbox API Reference

The sandbox environment provides a highly secure, ephemeral environment for executing untrusted code.

### Endpoint
`POST https://apis.fotohub.app/sandbox/exec-python`

### Request Schema
```json
{
  "code": "string (Required) - The python code to execute",
  "inputs": "dict (Optional) - Key-value pairs injected into the environment as `input` dict",
  "timeout": "int (Optional) - Max execution time in seconds. Max 10.",
  "memory_limit_mb": "int (Optional) - Memory limit in MB. Default 512."
}
```

### Response Schema
```json
{
  "ok": "bool - Whether execution succeeded without exceptions or timeouts",
  "output": "string - Captured stdout / __FOTOHUB_RESULT__ value",
  "error": "string|null - Traceback if an error occurred",
  "execution_ms": "int - Wall time of execution",
  "memory_mb": "int - Peak memory usage"
}
```

### The `__FOTOHUB_RESULT__` Sentinel Pattern
To cleanly extract data from a sandbox execution without relying on fragile stdout parsing, assign your final result dictionary to the special `__FOTOHUB_RESULT__` variable. The sandbox runtime will automatically serialize this variable and return it in the `output` field.

```python
# Inside sandbox:
__FOTOHUB_RESULT__ = {"status": "success", "data": [1, 2, 3]}
```

---

## Security Boundaries & Limitations
- **No network access:** All outbound and inbound network requests are dropped at the hypervisor level.
- **No filesystem persistence:** The sandbox uses a `tmpfs` overlay. Everything is wiped instantly on exit.
- **No environment leakage:** Host environment variables are completely scrubbed.
- **Pre-installed Packages:** `numpy`, `pandas`, `scipy`, `PIL`, `sklearn`, `matplotlib`, `bs4`, `requests`, `httpx`.

---

## Pricing
Sandboxes are billed strictly per-execution from your USD wallet. NO credits, NO PLN.
**Cost:** $0.00008 / execution.

---

## Multi-Language Client Code

:::code-group
```python [Python]
import requests
def run_sandbox(code, inputs=None):
    res = requests.post(
        "https://apis.fotohub.app/sandbox/exec-python",
        headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
        json={"code": code, "inputs": inputs or {}}
    )
    return res.json()
```
```typescript [TypeScript]
import fetch from "node-fetch";
const runSandbox = async (code: string, inputs = {}) => {
  const res = await fetch("https://apis.fotohub.app/sandbox/exec-python", {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_YOUR_API_KEY",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ code, inputs })
  });
  return res.json();
};
```
```bash [cURL]
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"code": "print(1+1)"}'
```
```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func runSandbox(code string, inputs map[string]interface{}) {
	url := "https://apis.fotohub.app/sandbox/exec-python"
	payload := map[string]interface{}{"code": code, "inputs": inputs}
	jsonValue, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonValue))
	req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	res, _ := client.Do(req)
	defer res.Body.Close()
	fmt.Println("Sandbox executed")
}
```
:::

---

## 15 New Recipes

### 1. Pandas DataFrame operations (filter, groupby, pivot)
```python
code = '''
import pandas as pd
df = pd.DataFrame(inputs['data'])
filtered = df[df['sales'] > 100]
pivot = filtered.pivot_table(index='region', values='sales', aggfunc='sum')
__FOTOHUB_RESULT__ = pivot.to_dict()
'''
```

### 2. Regular expression batch extraction from HTML/text
```python
code = '''
import re
text = inputs['text']
emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
__FOTOHUB_RESULT__ = {"emails": emails}
'''
```

### 3. JSON Schema validation with jsonschema library
```python
code = '''
from jsonschema import validate
try:
    validate(instance=inputs['data'], schema=inputs['schema'])
    __FOTOHUB_RESULT__ = {"valid": True}
except Exception as e:
    __FOTOHUB_RESULT__ = {"valid": False, "error": str(e)}
'''
```

### 4. Base64 encode/decode binary data
```python
code = '''
import base64
decoded = base64.b64decode(inputs['b64_str'])
__FOTOHUB_RESULT__ = {"bytes_len": len(decoded)}
'''
```

### 5. Time series smoothing with SciPy
```python
code = '''
from scipy.signal import savgol_filter
smoothed = savgol_filter(inputs['series'], window_length=5, polyorder=2)
__FOTOHUB_RESULT__ = {"smoothed": smoothed.tolist()}
'''
```

### 6. PDF text extraction with pdfplumber
```python
code = '''
import pdfplumber
import io
import base64

pdf_bytes = base64.b64decode(inputs['pdf_b64'])
with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
    text = "\n".join([page.extract_text() for page in pdf.pages])
__FOTOHUB_RESULT__ = {"text": text}
'''
```

### 7. Markdown to HTML conversion with markdown library
```python
code = '''
import markdown
html = markdown.markdown(inputs['md_text'])
__FOTOHUB_RESULT__ = {"html": html}
'''
```

### 8. Text similarity scoring with difflib.SequenceMatcher
```python
code = '''
from difflib import SequenceMatcher
ratio = SequenceMatcher(None, inputs['text1'], inputs['text2']).ratio()
__FOTOHUB_RESULT__ = {"similarity": ratio}
'''
```

### 9. Bulk URL validation and status checking with httpx
*(Note: requires explicit network mock or pre-fetched data, as network is blocked)*
```python
code = '''
# Since network is blocked, we use this to parse and validate URL structures
from urllib.parse import urlparse
valid = [url for url in inputs['urls'] if urlparse(url).scheme in ('http', 'https')]
__FOTOHUB_RESULT__ = {"valid_urls": valid}
'''
```

### 10. YAML to JSON conversion and validation
```python
code = '''
import yaml
parsed = yaml.safe_load(inputs['yaml_str'])
__FOTOHUB_RESULT__ = {"json": parsed}
'''
```

### 11. Cryptographic hash computation (SHA-256, MD5, BLAKE2)
```python
code = '''
import hashlib
h = hashlib.sha256(inputs['text'].encode()).hexdigest()
__FOTOHUB_RESULT__ = {"sha256": h}
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
__FOTOHUB_RESULT__ = {"is_prime": is_prime(inputs['number'])}
'''
```

### 13. Color palette extraction from image bytes
```python
code = '''
from PIL import Image
import io, base64

img_bytes = base64.b64decode(inputs['image_b64'])
img = Image.open(io.BytesIO(img_bytes)).convert("P", palette=Image.ADAPTIVE, colors=5)
palette = img.getpalette()[:15]
__FOTOHUB_RESULT__ = {"palette": [palette[i:i+3] for i in range(0, 15, 3)]}
'''
```

### 14. ASCII chart generation from numerical data
```python
code = '''
def ascii_bar(val, max_val, width=20):
    bars = int((val / max_val) * width)
    return "█" * bars
chart = {k: ascii_bar(v, max(inputs['data'].values())) for k, v in inputs['data'].items()}
__FOTOHUB_RESULT__ = {"chart": chart}
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
__FOTOHUB_RESULT__ = {"distance_km": haversine(*inputs['coords'])}
'''
```

---

## Advanced Patterns

### Passing Large Data
Fetch from FOTOhub S3 inside the sandbox or chunk it.
```python
# Pass S3 keys via inputs instead of raw data
code = '''
import requests
# Using VPC endpoints for S3 (s1.fotohub.app) - no egress cost!
data = requests.get(f"http://s1.fotohub.app/{inputs['bucket']}/{inputs['key']}").content
'''
```

### Parallel Sandbox Execution
Use `asyncio` to fan-out sandbox tasks.
```python
import asyncio
import httpx

async def run_parallel(codes):
    async with httpx.AsyncClient() as client:
        tasks = [client.post("https://apis.fotohub.app/sandbox/exec-python", json={"code": c}) for c in codes]
        return await asyncio.gather(*tasks)
```

### Chunking Large Datasets
If your dataframe exceeds sandbox memory, split it across multiple requests.

```python
import pandas as pd
import math
import requests

def chunk_execution(df, chunk_size=10000):
    num_chunks = math.ceil(len(df) / chunk_size)
    results = []
    
    for i in range(num_chunks):
        chunk = df.iloc[i * chunk_size : (i + 1) * chunk_size]
        
        # Send chunk to sandbox
        res = requests.post(
            "https://apis.fotohub.app/sandbox/exec-python",
            headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
            json={
                "code": '''
                    import pandas as pd
                    df = pd.DataFrame(inputs['data'])
                    # Complex data processing here
                    res = df.groupby('category').sum()
                    __FOTOHUB_RESULT__ = res.to_dict()
                ''',
                "inputs": {"data": chunk.to_dict(orient="list")}
            }
        )
        results.append(res.json()["output"])
    
    # Merge results client-side
    return results
```

### Sandbox Result Caching Pattern
Repeatedly running the same operations on the same inputs can get expensive and slow. Implement a fast cache layer using Redis on your primary compute instance.

```python
import hashlib
import json
import redis
import requests

r = redis.Redis(host='localhost', port=6379, db=0)

def cached_sandbox_exec(code, inputs):
    # Create deterministic hash of inputs
    payload = json.dumps({"code": code, "inputs": inputs}, sort_keys=True)
    cache_key = f"sandbox_cache_{hashlib.md5(payload.encode()).hexdigest()}"
    
    # Check cache
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
        
    # Execute if not found
    res = requests.post(
        "https://apis.fotohub.app/sandbox/exec-python",
        headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
        json={"code": code, "inputs": inputs}
    )
    
    # Save to cache with TTL
    data = res.json()
    if data.get("ok"):
        r.setex(cache_key, 3600, json.dumps(data))
        
    return data
```

### Orchestrating Sandboxes with Apache Airflow
Integrate sandboxes as isolated task operators in your DAGs.

```python
from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from datetime import datetime
import requests

def run_ml_pipeline_step(**kwargs):
    res = requests.post(
        "https://apis.fotohub.app/sandbox/exec-python",
        headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
        json={
            "code": "import sklearn; ...; __FOTOHUB_RESULT__={'model_score': 0.94}"
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

### Sandbox Result Caching Pattern
Repeatedly running the same operations on the same inputs can get expensive and slow. Implement a fast cache layer using Redis on your primary compute instance.

```python
import hashlib
import json
import redis
import requests

r = redis.Redis(host='localhost', port=6379, db=0)

def cached_sandbox_exec(code, inputs):
    # Create deterministic hash of inputs
    payload = json.dumps({"code": code, "inputs": inputs}, sort_keys=True)
    cache_key = f"sandbox_cache_{hashlib.md5(payload.encode()).hexdigest()}"
    
    # Check cache
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
        
    # Execute if not found
    res = requests.post(
        "https://apis.fotohub.app/sandbox/exec-python",
        headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
        json={"code": code, "inputs": inputs}
    )
    
    # Save to cache with TTL
    data = res.json()
    if data.get("ok"):
        r.setex(cache_key, 3600, json.dumps(data))
        
    return data
```

### Orchestrating Sandboxes with Apache Airflow
Integrate sandboxes as isolated task operators in your DAGs.

```python
from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from datetime import datetime
import requests

def run_ml_pipeline_step(**kwargs):
    res = requests.post(
        "https://apis.fotohub.app/sandbox/exec-python",
        headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
        json={
            "code": "import sklearn; ...; __FOTOHUB_RESULT__={'model_score': 0.94}"
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

### Sandbox Result Caching Pattern
Repeatedly running the same operations on the same inputs can get expensive and slow. Implement a fast cache layer using Redis on your primary compute instance.

```python
import hashlib
import json
import redis
import requests

r = redis.Redis(host='localhost', port=6379, db=0)

def cached_sandbox_exec(code, inputs):
    # Create deterministic hash of inputs
    payload = json.dumps({"code": code, "inputs": inputs}, sort_keys=True)
    cache_key = f"sandbox_cache_{hashlib.md5(payload.encode()).hexdigest()}"
    
    # Check cache
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
        
    # Execute if not found
    res = requests.post(
        "https://apis.fotohub.app/sandbox/exec-python",
        headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
        json={"code": code, "inputs": inputs}
    )
    
    # Save to cache with TTL
    data = res.json()
    if data.get("ok"):
        r.setex(cache_key, 3600, json.dumps(data))
        
    return data
```

### Orchestrating Sandboxes with Apache Airflow
Integrate sandboxes as isolated task operators in your DAGs.

```python
from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from datetime import datetime
import requests

def run_ml_pipeline_step(**kwargs):
    res = requests.post(
        "https://apis.fotohub.app/sandbox/exec-python",
        headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
        json={
            "code": "import sklearn; ...; __FOTOHUB_RESULT__={'model_score': 0.94}"
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

### Sandbox Result Caching Pattern
Repeatedly running the same operations on the same inputs can get expensive and slow. Implement a fast cache layer using Redis on your primary compute instance.

```python
import hashlib
import json
import redis
import requests

r = redis.Redis(host='localhost', port=6379, db=0)

def cached_sandbox_exec(code, inputs):
    # Create deterministic hash of inputs
    payload = json.dumps({"code": code, "inputs": inputs}, sort_keys=True)
    cache_key = f"sandbox_cache_{hashlib.md5(payload.encode()).hexdigest()}"
    
    # Check cache
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
        
    # Execute if not found
    res = requests.post(
        "https://apis.fotohub.app/sandbox/exec-python",
        headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
        json={"code": code, "inputs": inputs}
    )
    
    # Save to cache with TTL
    data = res.json()
    if data.get("ok"):
        r.setex(cache_key, 3600, json.dumps(data))
        
    return data
```

### Orchestrating Sandboxes with Apache Airflow
Integrate sandboxes as isolated task operators in your DAGs.

```python
from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from datetime import datetime
import requests

def run_ml_pipeline_step(**kwargs):
    res = requests.post(
        "https://apis.fotohub.app/sandbox/exec-python",
        headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
        json={
            "code": "import sklearn; ...; __FOTOHUB_RESULT__={'model_score': 0.94}"
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

### Sandbox Result Caching Pattern
Repeatedly running the same operations on the same inputs can get expensive and slow. Implement a fast cache layer using Redis on your primary compute instance.

```python
import hashlib
import json
import redis
import requests

r = redis.Redis(host='localhost', port=6379, db=0)

def cached_sandbox_exec(code, inputs):
    # Create deterministic hash of inputs
    payload = json.dumps({"code": code, "inputs": inputs}, sort_keys=True)
    cache_key = f"sandbox_cache_{hashlib.md5(payload.encode()).hexdigest()}"
    
    # Check cache
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
        
    # Execute if not found
    res = requests.post(
        "https://apis.fotohub.app/sandbox/exec-python",
        headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
        json={"code": code, "inputs": inputs}
    )
    
    # Save to cache with TTL
    data = res.json()
    if data.get("ok"):
        r.setex(cache_key, 3600, json.dumps(data))
        
    return data
```

### Orchestrating Sandboxes with Apache Airflow
Integrate sandboxes as isolated task operators in your DAGs.

```python
from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from datetime import datetime
import requests

def run_ml_pipeline_step(**kwargs):
    res = requests.post(
        "https://apis.fotohub.app/sandbox/exec-python",
        headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
        json={
            "code": "import sklearn; ...; __FOTOHUB_RESULT__={'model_score': 0.94}"
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

### Sandbox Result Caching Pattern
Repeatedly running the same operations on the same inputs can get expensive and slow. Implement a fast cache layer using Redis on your primary compute instance.

```python
import hashlib
import json
import redis
import requests

r = redis.Redis(host='localhost', port=6379, db=0)

def cached_sandbox_exec(code, inputs):
    # Create deterministic hash of inputs
    payload = json.dumps({"code": code, "inputs": inputs}, sort_keys=True)
    cache_key = f"sandbox_cache_{hashlib.md5(payload.encode()).hexdigest()}"
    
    # Check cache
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
        
    # Execute if not found
    res = requests.post(
        "https://apis.fotohub.app/sandbox/exec-python",
        headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
        json={"code": code, "inputs": inputs}
    )
    
    # Save to cache with TTL
    data = res.json()
    if data.get("ok"):
        r.setex(cache_key, 3600, json.dumps(data))
        
    return data
```

### Orchestrating Sandboxes with Apache Airflow
Integrate sandboxes as isolated task operators in your DAGs.

```python
from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from datetime import datetime
import requests

def run_ml_pipeline_step(**kwargs):
    res = requests.post(
        "https://apis.fotohub.app/sandbox/exec-python",
        headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
        json={
            "code": "import sklearn; ...; __FOTOHUB_RESULT__={'model_score': 0.94}"
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
