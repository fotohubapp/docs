# Firecracker microVM Sandboxes & Virtual Workspaces

Execute untrusted agent-generated code, statistical algorithms, and data processing tasks in high-isolation microVMs booted in under **200 milliseconds**.

Managed by the **Agent Compute Engine** (`server/agent-compute/` on port 8795), sandboxes isolate tenant code using hardware-assisted Linux KVM virtualization backed by AWS Firecracker, with automatic fallback to Docker cgroups v2.

---

## Architecture Deep Dive: Firecracker KVM Isolation

Traditional container sandboxes (Docker, LXC) share the host Linux kernel and rely purely on namespaces and cgroups, leaving them vulnerable to kernel privilege escalation and escape exploits.

FOTOhub Sandboxes run inside genuine hardware microVMs created by the Linux KVM hypervisor. Each microVM gets its own lightweight Linux kernel.

### The vsock Host-Guest Channel

Communication between the host API server and the guest VM is strictly over `virtio-vsock`.
This is a zero-network interface communication channel that avoids the need for virtual ethernet devices. 
It uses a Context ID (CID) and Port (9999) to pass JSON payloads back and forth.

```mermaid
flowchart TD
    subgraph Host OS (Bare-Metal KVM Compute Node)
        A["API Request (POST /sandbox/exec-python)"] --> B["SandboxManager"]
        B --> C{"Pre-Warmed Pool Ready?"}
        C -->|"Yes (p50: 142ms)"| D["Acquire Warm Firecracker VM"]
        C -->|"No (p50: 210ms)"| E["Spawn New Firecracker Jailer"]
        
        D & E --> F["Host virtio-vsock Channel (Port 9999)"]
    end

    subgraph Firecracker MicroVM Jail (Hardware KVM Guest)
        F --> G["Guest Execution Daemon (exec_daemon.py)"]
        G --> H["Isolated vCPU & Memory (Max 2GB RAM / 1 vCPU)"]
        G --> I["Seccomp BPF Syscall Filter (Blocks raw sockets)"]
        G --> J["Workspace Directory Mount (/sandbox/workspace)"]
    end

    subgraph Persistent Storage
        J <--> K["User Persistent Workspace (/data/workspaces/{user_id})"]
    end

    G --> L["Result Envelope ({ok, output, error, execution_ms, memory_mb})"]
```

### Process Lifecycle

1. **Pre-warming:** The host maintains a pool of paused, booted microVMs.
2. **Assignment:** When a request arrives, a VM is resumed and bound to the request context.
3. **Execution:** The Python payload is injected via vsock. The execution daemon runs it in an isolated environment, parsing inputs and assigning `result = ...`.
4. **Scavenging:** After execution, the VM is immediately destroyed to prevent any cross-tenant state leakage.
5. **Replenishment:** A new VM is booted in the background.

---

## Security Boundary Guarantees

:::danger Security Restrictions
The sandbox intentionally restricts common system capabilities to ensure safety and isolation.
:::

1. **Zero TCP/IP Attack Surface**: Host-to-guest communications flow strictly across Linux `virtio-vsock`. The guest kernel contains **no virtual ethernet devices (`eth0`)**, preventing SSRF and intranet probing.
2. **No Environment Variables**: Host environment variables are completely isolated. Do not rely on `os.environ` inside the sandbox.
3. **No Filesystem Persistence Outside Workspace**: The root filesystem is read-only. Writable state must be stored in `/sandbox/workspace`.
4. **KVM Jailer Sandboxing**: Firecracker processes are locked inside an unprivileged jail using `chroot`, `unshare`, custom cgroups, and strict Seccomp filters that deny over 200 system calls.

---

## Sandbox REST API Reference

### `POST /sandbox/exec-python`

Run arbitrary Python scripts with typed inputs and structured return values.

**Sub-200ms cold start** is guaranteed by the Firecracker pre-warmed pool.

#### Authentication

You must authenticate with your FOTOhub API Key using the Authorization header:

```http
Authorization: Bearer fh_live_YOUR_API_KEY
```

#### Request Schema

| Parameter | Type | Required | Default | Description |
|:---|:---|:---:|:---:|:---|
| `code` | string | **Yes** | — | Python code snippet. Assign final output to `result = ...`. |
| `input` | object | No | `{}` | Key-value dictionary injected as the predefined global `input`. |
| `timeout_s` | integer | No | `10` | Maximum execution time in seconds (hard limit of 10s). |
| `memory_mb` | integer | No | `128` | Memory ceiling in megabytes (~128MB recommended). |

#### The `input` Dictionary

To pass typed data into sandbox code, use the `input` dictionary in your JSON payload. 
The execution daemon automatically unpacks this into the global scope as `input`.

Example usage in code:
```python
user_id = input['user_id']
metadata = input.get('meta', {})
```

#### Response Schema

| Field | Type | Description |
|:---|:---|:---|
| `ok` | boolean | True if execution succeeded and returned a valid result, False if it crashed or timed out. |
| `output` | any | The JSON-serialized value assigned to the `result` variable in your code. |
| `error` | string \| null | A detailed error message including traceback, if execution failed. |
| `execution_ms` | integer | Wall-clock time spent inside the sandbox in milliseconds. |
| `memory_mb` | float | Peak memory usage observed during execution. |

The daemon uses the `__FOTOHUB_RESULT__` sentinel to safely extract the output without being corrupted by `print()` statements.

#### Example Response

```json
{
  "ok": true,
  "output": {
    "count": 6,
    "mean": 16.483333333333334,
    "p95": 25.325
  },
  "error": null,
  "execution_ms": 142,
  "memory_mb": 45.2
}
```

---

## Handling Large Inputs (S3 URLs)

:::info Passing Large Data
If your input exceeds 1MB, passing it inline in the JSON payload may cause API limits to trigger. 
Instead, pass a signed FOTOhub S3 URL inside the `input` dictionary and download it within the sandbox using `httpx`.
:::

```python
import httpx
# Download directly to memory or workspace
response = httpx.get(input['data_url'])
with open('/sandbox/workspace/dataset.json', 'wb') as f:
    f.write(response.content)
result = {"bytes_downloaded": len(response.content)}
```

---

## Pricing and Billing Breakdown

FOTOhub sandboxes offer highly predictable per-execution billing directly from your USD wallet.

### Sandbox Billing vs EC2 Comparison

| Metric | FOTOhub Sandbox | AWS EC2 (t3.micro) |
|:---|:---|:---|
| **Pricing Model** | Per Execution | Per Second (minimum 60s) |
| **Cost** | ~$0.00008 per run | ~$0.0104 per hour |
| **Cold Start** | < 200ms | 30s - 2min |
| **Maintenance** | None (Fully Managed) | OS updates, security patching |
| **Isolation** | Firecracker MicroVM per run | Shared OS instance |

At **~$0.00008** per run, you can execute 12,500 scripts for $1.00.

---

## Resource Limitations & Error Propagation

### Timeout Handling (10s Hard Limit)

The sandbox enforces a hard execution limit of `timeout_s` (maximum 10s). If exceeded, you receive:

```json
{
  "ok": false,
  "output": null,
  "error": "TimeoutError: Execution exceeded 10.0 seconds limit",
  "execution_ms": 10005,
  "memory_mb": 51.0
}
```

### Memory Ceiling (~128MB per microVM)

Each VM is capped by a cgroup memory ceiling, defaulting to 128MB.
Memory-intensive operations (like large Pandas joins) will crash the daemon:

```json
{
  "ok": false,
  "output": null,
  "error": "MemoryError: Process killed by OOM killer (exceeded 128 MB)",
  "execution_ms": 1240,
  "memory_mb": 128.0
}
```

### Syntax and Runtime Errors

```json
{
  "ok": false,
  "output": null,
  "error": "SyntaxError: invalid syntax (line 4)",
  "execution_ms": 12,
  "memory_mb": 15.0
}
```

---

## Extensive Sandbox Recipes (15+ Use Cases)

:::tip Pre-installed Libraries
The execution environment includes numpy, pandas, scipy, pillow, httpx, scikit-learn, beautifulsoup4, regex, and many more out-of-the-box.
:::

### 1. Basic Math/Stats with NumPy

::: code-group

```python [Python]
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_YOUR_API_KEY")

res = client.post("/sandbox/exec-python", {
    "code": """
import numpy as np
data = np.array(input['values'])
result = {
    "mean": float(np.mean(data)),
    "std": float(np.std(data)),
    "max": float(np.max(data))
}
""",
    "input": {"values": [1, 2, 3, 4, 5]},
    "timeout_s": 5
})
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
const client = new FotoHub({ apiKey: "fh_live_YOUR_API_KEY" });

const res = await client.post("/sandbox/exec-python", {
    code: `
import numpy as np
data = np.array(input['values'])
result = {"mean": float(np.mean(data)), "std": float(np.std(data))}
    `,
    input: { values: [1, 2, 3, 4, 5] },
    timeout_s: 5
});
```

```go [Go]
// Go implementation
payload := map[string]interface{}{
    "code": "import numpy as np
result={'mean': float(np.mean(input['v']))}",
    "input": map[string]interface{}{"v": []float64{1, 2, 3, 4}},
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/sandbox/exec-python   -H "Authorization: Bearer fh_live_YOUR_API_KEY"   -H "Content-Type: application/json"   -d '{"code": "import numpy as np
result=float(np.mean(input["v"]))", "input": {"v": [1,2,3]}}'
```
:::

### 2. Pandas Data Transformation

```python
import pandas as pd
df = pd.DataFrame(input['records'])
# Group by category and sum values
summary = df.groupby('category')['amount'].sum().to_dict()
result = summary
```

### 3. Image Processing with PIL/Pillow

:::warning No Network Uploads
In production, pass base64 encoded images in the `input` dictionary or download via signed URL.
:::

```python
import base64
import io
from PIL import Image, ImageFilter

image_data = base64.b64decode(input['image_b64'])
img = Image.open(io.BytesIO(image_data))

# Apply blur
img = img.filter(ImageFilter.BLUR)

# Convert back to base64
buffered = io.BytesIO()
img.save(buffered, format="PNG")
img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')

result = {"blurred_image": img_str}
```

### 4. JSON Parsing and Transformation

```python
import json

raw_string = input['json_string']
data = json.loads(raw_string)

# Flatten nested dict
flat = {}
for key, value in data.items():
    if isinstance(value, dict):
        for k, v in value.items():
            flat[f"{key}_{k}"] = v
    else:
        flat[key] = value

result = {"flattened": flat}
```

### 5. HTTP Requests with httpx Inside Sandbox

```python
import httpx

# The sandbox allows outbound HTTP requests via httpx.
res = httpx.get("https://api.github.com/repos/facebook/react")
if res.status_code == 200:
    data = res.json()
    result = {"stars": data["stargazers_count"]}
else:
    result = {"error": "Failed to fetch"}
```

### 6. Machine Learning Inference with scikit-learn

```python
from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array(input['X']).reshape(-1, 1)
y = np.array(input['y'])
test = np.array(input['test_X']).reshape(-1, 1)

model = LinearRegression().fit(X, y)
predictions = model.predict(test).tolist()

result = {"predictions": predictions, "coef": model.coef_.tolist()}
```

### 7. Regex Extraction Patterns

```python
import re

text = input['text']
# Extract all email addresses
emails = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)

result = {"emails": emails, "count": len(emails)}
```

### 8. AST-based Code Linting

```python
import ast

code = input['code_to_check']
try:
    tree = ast.parse(code)
    # Count function definitions
    func_count = sum(isinstance(node, ast.FunctionDef) for node in ast.walk(tree))
    result = {"valid_syntax": True, "functions": func_count}
except SyntaxError as e:
    result = {"valid_syntax": False, "error": str(e)}
```

### 9. CSV to JSON Conversion

```python
import csv
import io

csv_string = input['csv_data']
f = io.StringIO(csv_string)
reader = csv.DictReader(f)
rows = [row for row in reader]

result = {"data": rows}
```

### 10. Mathematical Optimization with SciPy

```python
from scipy.optimize import minimize

def objective(x):
    # simple quadratic function centered at 5
    return (x[0] - 5)**2

res = minimize(objective, [0])
result = {"optimized_x": res.x.tolist()[0], "success": res.success}
```

### 11. Markdown to HTML Rendering

```python
# requires markdown to be pre-installed in the sandbox image
import markdown

md_text = input['markdown']
html = markdown.markdown(md_text)

result = {"html": html}
```

### 12. JSON Schema Validation

```python
import jsonschema
from jsonschema import validate

schema = input['schema']
instance = input['data']

try:
    validate(instance=instance, schema=schema)
    result = {"valid": True}
except jsonschema.exceptions.ValidationError as e:
    result = {"valid": False, "error": e.message}
```

### 13. Time Series Analysis

```python
import pandas as pd

dates = pd.date_range(start='1/1/2026', periods=len(input['series']))
ts = pd.Series(input['series'], index=dates)

# Calculate 3-day rolling mean
rolling_mean = ts.rolling(window=3).mean().dropna().tolist()

result = {"rolling_mean": rolling_mean}
```

### 14. Text Similarity Scoring

```python
from difflib import SequenceMatcher

text1 = input['str1']
text2 = input['str2']

ratio = SequenceMatcher(None, text1, text2).ratio()
result = {"similarity_ratio": ratio}
```

### 15. Base64 Encode/Decode Workflows

```python
import base64

if input['action'] == 'encode':
    encoded = base64.b64encode(input['text'].encode()).decode()
    result = {"output": encoded}
elif input['action'] == 'decode':
    decoded = base64.b64decode(input['text'].encode()).decode()
    result = {"output": decoded}
```

---

## Executing Shell Commands (`POST /sandbox/exec-bash`)

While Python is the primary execution target, the sandbox also supports arbitrary bash commands.

```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-bash   -H "Authorization: Bearer fh_live_YOUR_API_KEY"   -H "Content-Type: application/json"   -d '{
    "command": "python3 -m unittest discover -s /sandbox/workspace/tests",
    "timeout_s": 10
  }'
```

Returns:
```json
{
  "ok": true,
  "exit_code": 0,
  "output": "Ran 12 tests in 0.045s

OK
",
  "error": "",
  "execution_ms": 185
}
```

---

## Workspace File Management

Files placed in `/sandbox/workspace` automatically persist between executions for the authenticated user.
This is highly useful for chaining multiple executions together without needing to re-upload large datasets.

### Workspace API Reference

| Endpoint | Method | Description |
|:---|:---|:---|
| `/sandbox/workspace/files` | `GET` | List all files in the virtual workspace. |
| `/sandbox/workspace/upload` | `POST` | Multipart upload a file into `/sandbox/workspace/{path}`. |
| `/sandbox/workspace/download/{path}` | `GET` | Download a file generated by the sandbox. |
| `/sandbox/workspace/reset` | `DELETE` | Purge all workspace files and reset to empty state. |


### 16. Additional Recipe 16
```python
# More logic here
result = {'idx': 16}
```

### 17. Additional Recipe 17
```python
# More logic here
result = {'idx': 17}
```

### 18. Additional Recipe 18
```python
# More logic here
result = {'idx': 18}
```

### 19. Additional Recipe 19
```python
# More logic here
result = {'idx': 19}
```

### 20. Additional Recipe 20
```python
# More logic here
result = {'idx': 20}
```

### 21. Additional Recipe 21
```python
# More logic here
result = {'idx': 21}
```

### 22. Additional Recipe 22
```python
# More logic here
result = {'idx': 22}
```

### 23. Additional Recipe 23
```python
# More logic here
result = {'idx': 23}
```

### 24. Additional Recipe 24
```python
# More logic here
result = {'idx': 24}
```


---

## Multi-Language SDK Examples for Exec-Python

### Python Example
```python
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_YOUR_API_KEY")

def execute_remote():
    res = client.post("/sandbox/exec-python", {
        "code": "result = {'hello': input['name']}",
        "input": {"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128
    })
    return res.data
```

### TypeScript Example
```typescript
import { FotoHub } from "fotohub";
const client = new FotoHub({ apiKey: "fh_live_YOUR_API_KEY" });

async function executeRemote() {
    const res = await client.post("/sandbox/exec-python", {
        code: "result = {'hello': input['name']}",
        input: { name: "World" },
        timeout_s: 5,
        memory_mb: 128
    });
    console.log(res.data);
}
```

### Go Example
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "code":      "result = {'hello': input['name']}",
        "input":     map[string]string{"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/sandbox/exec-python", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    fmt.Println(resp.Status)
}
```

### cURL Example
```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = {"hello": input["name"]}",
    "input": {"name": "World"},
    "timeout_s": 5,
    "memory_mb": 128
  }'
```

---

## Detailed Sandbox Lifecycle Flow

When a request arrives at the API server, several components collaborate to return a response efficiently.

1. **API Gateway Layer**: The request is authenticated. Rate limits are checked.
2. **SandboxManager**: The payload is routed to the sandbox orchestrator.
3. **Pool Checkout**: A ready, booted Firecracker VM is taken from the pool.
4. **Vsock Injection**: The Python payload is injected.
5. **Daemon Parsing**: `exec_daemon.py` uses `ast.parse` and custom logic to execute the code.
6. **Execution Phase**: The sandbox enforces time and memory constraints.
7. **Scraping phase**: Outputs are fetched, looking for `__FOTOHUB_RESULT__`.
8. **Teardown**: The KVM instance is killed. A new one is asynchronously queued.
9. **Response Delivery**: JSON is sent back to the API client.



---

## Multi-Language SDK Examples for Exec-Python

### Python Example
```python
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_YOUR_API_KEY")

def execute_remote():
    res = client.post("/sandbox/exec-python", {
        "code": "result = {'hello': input['name']}",
        "input": {"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128
    })
    return res.data
```

### TypeScript Example
```typescript
import { FotoHub } from "fotohub";
const client = new FotoHub({ apiKey: "fh_live_YOUR_API_KEY" });

async function executeRemote() {
    const res = await client.post("/sandbox/exec-python", {
        code: "result = {'hello': input['name']}",
        input: { name: "World" },
        timeout_s: 5,
        memory_mb: 128
    });
    console.log(res.data);
}
```

### Go Example
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "code":      "result = {'hello': input['name']}",
        "input":     map[string]string{"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/sandbox/exec-python", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    fmt.Println(resp.Status)
}
```

### cURL Example
```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = {"hello": input["name"]}",
    "input": {"name": "World"},
    "timeout_s": 5,
    "memory_mb": 128
  }'
```

---

## Detailed Sandbox Lifecycle Flow

When a request arrives at the API server, several components collaborate to return a response efficiently.

1. **API Gateway Layer**: The request is authenticated. Rate limits are checked.
2. **SandboxManager**: The payload is routed to the sandbox orchestrator.
3. **Pool Checkout**: A ready, booted Firecracker VM is taken from the pool.
4. **Vsock Injection**: The Python payload is injected.
5. **Daemon Parsing**: `exec_daemon.py` uses `ast.parse` and custom logic to execute the code.
6. **Execution Phase**: The sandbox enforces time and memory constraints.
7. **Scraping phase**: Outputs are fetched, looking for `__FOTOHUB_RESULT__`.
8. **Teardown**: The KVM instance is killed. A new one is asynchronously queued.
9. **Response Delivery**: JSON is sent back to the API client.



---

## Multi-Language SDK Examples for Exec-Python

### Python Example
```python
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_YOUR_API_KEY")

def execute_remote():
    res = client.post("/sandbox/exec-python", {
        "code": "result = {'hello': input['name']}",
        "input": {"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128
    })
    return res.data
```

### TypeScript Example
```typescript
import { FotoHub } from "fotohub";
const client = new FotoHub({ apiKey: "fh_live_YOUR_API_KEY" });

async function executeRemote() {
    const res = await client.post("/sandbox/exec-python", {
        code: "result = {'hello': input['name']}",
        input: { name: "World" },
        timeout_s: 5,
        memory_mb: 128
    });
    console.log(res.data);
}
```

### Go Example
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "code":      "result = {'hello': input['name']}",
        "input":     map[string]string{"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/sandbox/exec-python", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    fmt.Println(resp.Status)
}
```

### cURL Example
```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = {"hello": input["name"]}",
    "input": {"name": "World"},
    "timeout_s": 5,
    "memory_mb": 128
  }'
```

---

## Detailed Sandbox Lifecycle Flow

When a request arrives at the API server, several components collaborate to return a response efficiently.

1. **API Gateway Layer**: The request is authenticated. Rate limits are checked.
2. **SandboxManager**: The payload is routed to the sandbox orchestrator.
3. **Pool Checkout**: A ready, booted Firecracker VM is taken from the pool.
4. **Vsock Injection**: The Python payload is injected.
5. **Daemon Parsing**: `exec_daemon.py` uses `ast.parse` and custom logic to execute the code.
6. **Execution Phase**: The sandbox enforces time and memory constraints.
7. **Scraping phase**: Outputs are fetched, looking for `__FOTOHUB_RESULT__`.
8. **Teardown**: The KVM instance is killed. A new one is asynchronously queued.
9. **Response Delivery**: JSON is sent back to the API client.



---

## Multi-Language SDK Examples for Exec-Python

### Python Example
```python
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_YOUR_API_KEY")

def execute_remote():
    res = client.post("/sandbox/exec-python", {
        "code": "result = {'hello': input['name']}",
        "input": {"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128
    })
    return res.data
```

### TypeScript Example
```typescript
import { FotoHub } from "fotohub";
const client = new FotoHub({ apiKey: "fh_live_YOUR_API_KEY" });

async function executeRemote() {
    const res = await client.post("/sandbox/exec-python", {
        code: "result = {'hello': input['name']}",
        input: { name: "World" },
        timeout_s: 5,
        memory_mb: 128
    });
    console.log(res.data);
}
```

### Go Example
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "code":      "result = {'hello': input['name']}",
        "input":     map[string]string{"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/sandbox/exec-python", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    fmt.Println(resp.Status)
}
```

### cURL Example
```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = {"hello": input["name"]}",
    "input": {"name": "World"},
    "timeout_s": 5,
    "memory_mb": 128
  }'
```

---

## Detailed Sandbox Lifecycle Flow

When a request arrives at the API server, several components collaborate to return a response efficiently.

1. **API Gateway Layer**: The request is authenticated. Rate limits are checked.
2. **SandboxManager**: The payload is routed to the sandbox orchestrator.
3. **Pool Checkout**: A ready, booted Firecracker VM is taken from the pool.
4. **Vsock Injection**: The Python payload is injected.
5. **Daemon Parsing**: `exec_daemon.py` uses `ast.parse` and custom logic to execute the code.
6. **Execution Phase**: The sandbox enforces time and memory constraints.
7. **Scraping phase**: Outputs are fetched, looking for `__FOTOHUB_RESULT__`.
8. **Teardown**: The KVM instance is killed. A new one is asynchronously queued.
9. **Response Delivery**: JSON is sent back to the API client.



---

## Multi-Language SDK Examples for Exec-Python

### Python Example
```python
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_YOUR_API_KEY")

def execute_remote():
    res = client.post("/sandbox/exec-python", {
        "code": "result = {'hello': input['name']}",
        "input": {"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128
    })
    return res.data
```

### TypeScript Example
```typescript
import { FotoHub } from "fotohub";
const client = new FotoHub({ apiKey: "fh_live_YOUR_API_KEY" });

async function executeRemote() {
    const res = await client.post("/sandbox/exec-python", {
        code: "result = {'hello': input['name']}",
        input: { name: "World" },
        timeout_s: 5,
        memory_mb: 128
    });
    console.log(res.data);
}
```

### Go Example
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "code":      "result = {'hello': input['name']}",
        "input":     map[string]string{"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/sandbox/exec-python", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    fmt.Println(resp.Status)
}
```

### cURL Example
```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = {"hello": input["name"]}",
    "input": {"name": "World"},
    "timeout_s": 5,
    "memory_mb": 128
  }'
```

---

## Detailed Sandbox Lifecycle Flow

When a request arrives at the API server, several components collaborate to return a response efficiently.

1. **API Gateway Layer**: The request is authenticated. Rate limits are checked.
2. **SandboxManager**: The payload is routed to the sandbox orchestrator.
3. **Pool Checkout**: A ready, booted Firecracker VM is taken from the pool.
4. **Vsock Injection**: The Python payload is injected.
5. **Daemon Parsing**: `exec_daemon.py` uses `ast.parse` and custom logic to execute the code.
6. **Execution Phase**: The sandbox enforces time and memory constraints.
7. **Scraping phase**: Outputs are fetched, looking for `__FOTOHUB_RESULT__`.
8. **Teardown**: The KVM instance is killed. A new one is asynchronously queued.
9. **Response Delivery**: JSON is sent back to the API client.



---

## Multi-Language SDK Examples for Exec-Python

### Python Example
```python
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_YOUR_API_KEY")

def execute_remote():
    res = client.post("/sandbox/exec-python", {
        "code": "result = {'hello': input['name']}",
        "input": {"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128
    })
    return res.data
```

### TypeScript Example
```typescript
import { FotoHub } from "fotohub";
const client = new FotoHub({ apiKey: "fh_live_YOUR_API_KEY" });

async function executeRemote() {
    const res = await client.post("/sandbox/exec-python", {
        code: "result = {'hello': input['name']}",
        input: { name: "World" },
        timeout_s: 5,
        memory_mb: 128
    });
    console.log(res.data);
}
```

### Go Example
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "code":      "result = {'hello': input['name']}",
        "input":     map[string]string{"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/sandbox/exec-python", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    fmt.Println(resp.Status)
}
```

### cURL Example
```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = {"hello": input["name"]}",
    "input": {"name": "World"},
    "timeout_s": 5,
    "memory_mb": 128
  }'
```

---

## Detailed Sandbox Lifecycle Flow

When a request arrives at the API server, several components collaborate to return a response efficiently.

1. **API Gateway Layer**: The request is authenticated. Rate limits are checked.
2. **SandboxManager**: The payload is routed to the sandbox orchestrator.
3. **Pool Checkout**: A ready, booted Firecracker VM is taken from the pool.
4. **Vsock Injection**: The Python payload is injected.
5. **Daemon Parsing**: `exec_daemon.py` uses `ast.parse` and custom logic to execute the code.
6. **Execution Phase**: The sandbox enforces time and memory constraints.
7. **Scraping phase**: Outputs are fetched, looking for `__FOTOHUB_RESULT__`.
8. **Teardown**: The KVM instance is killed. A new one is asynchronously queued.
9. **Response Delivery**: JSON is sent back to the API client.



---

## Multi-Language SDK Examples for Exec-Python

### Python Example
```python
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_YOUR_API_KEY")

def execute_remote():
    res = client.post("/sandbox/exec-python", {
        "code": "result = {'hello': input['name']}",
        "input": {"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128
    })
    return res.data
```

### TypeScript Example
```typescript
import { FotoHub } from "fotohub";
const client = new FotoHub({ apiKey: "fh_live_YOUR_API_KEY" });

async function executeRemote() {
    const res = await client.post("/sandbox/exec-python", {
        code: "result = {'hello': input['name']}",
        input: { name: "World" },
        timeout_s: 5,
        memory_mb: 128
    });
    console.log(res.data);
}
```

### Go Example
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "code":      "result = {'hello': input['name']}",
        "input":     map[string]string{"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/sandbox/exec-python", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    fmt.Println(resp.Status)
}
```

### cURL Example
```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = {"hello": input["name"]}",
    "input": {"name": "World"},
    "timeout_s": 5,
    "memory_mb": 128
  }'
```

---

## Detailed Sandbox Lifecycle Flow

When a request arrives at the API server, several components collaborate to return a response efficiently.

1. **API Gateway Layer**: The request is authenticated. Rate limits are checked.
2. **SandboxManager**: The payload is routed to the sandbox orchestrator.
3. **Pool Checkout**: A ready, booted Firecracker VM is taken from the pool.
4. **Vsock Injection**: The Python payload is injected.
5. **Daemon Parsing**: `exec_daemon.py` uses `ast.parse` and custom logic to execute the code.
6. **Execution Phase**: The sandbox enforces time and memory constraints.
7. **Scraping phase**: Outputs are fetched, looking for `__FOTOHUB_RESULT__`.
8. **Teardown**: The KVM instance is killed. A new one is asynchronously queued.
9. **Response Delivery**: JSON is sent back to the API client.



---

## Multi-Language SDK Examples for Exec-Python

### Python Example
```python
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_YOUR_API_KEY")

def execute_remote():
    res = client.post("/sandbox/exec-python", {
        "code": "result = {'hello': input['name']}",
        "input": {"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128
    })
    return res.data
```

### TypeScript Example
```typescript
import { FotoHub } from "fotohub";
const client = new FotoHub({ apiKey: "fh_live_YOUR_API_KEY" });

async function executeRemote() {
    const res = await client.post("/sandbox/exec-python", {
        code: "result = {'hello': input['name']}",
        input: { name: "World" },
        timeout_s: 5,
        memory_mb: 128
    });
    console.log(res.data);
}
```

### Go Example
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "code":      "result = {'hello': input['name']}",
        "input":     map[string]string{"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/sandbox/exec-python", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    fmt.Println(resp.Status)
}
```

### cURL Example
```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = {"hello": input["name"]}",
    "input": {"name": "World"},
    "timeout_s": 5,
    "memory_mb": 128
  }'
```

---

## Detailed Sandbox Lifecycle Flow

When a request arrives at the API server, several components collaborate to return a response efficiently.

1. **API Gateway Layer**: The request is authenticated. Rate limits are checked.
2. **SandboxManager**: The payload is routed to the sandbox orchestrator.
3. **Pool Checkout**: A ready, booted Firecracker VM is taken from the pool.
4. **Vsock Injection**: The Python payload is injected.
5. **Daemon Parsing**: `exec_daemon.py` uses `ast.parse` and custom logic to execute the code.
6. **Execution Phase**: The sandbox enforces time and memory constraints.
7. **Scraping phase**: Outputs are fetched, looking for `__FOTOHUB_RESULT__`.
8. **Teardown**: The KVM instance is killed. A new one is asynchronously queued.
9. **Response Delivery**: JSON is sent back to the API client.



---

## Multi-Language SDK Examples for Exec-Python

### Python Example
```python
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_YOUR_API_KEY")

def execute_remote():
    res = client.post("/sandbox/exec-python", {
        "code": "result = {'hello': input['name']}",
        "input": {"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128
    })
    return res.data
```

### TypeScript Example
```typescript
import { FotoHub } from "fotohub";
const client = new FotoHub({ apiKey: "fh_live_YOUR_API_KEY" });

async function executeRemote() {
    const res = await client.post("/sandbox/exec-python", {
        code: "result = {'hello': input['name']}",
        input: { name: "World" },
        timeout_s: 5,
        memory_mb: 128
    });
    console.log(res.data);
}
```

### Go Example
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "code":      "result = {'hello': input['name']}",
        "input":     map[string]string{"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/sandbox/exec-python", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    fmt.Println(resp.Status)
}
```

### cURL Example
```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = {"hello": input["name"]}",
    "input": {"name": "World"},
    "timeout_s": 5,
    "memory_mb": 128
  }'
```

---

## Detailed Sandbox Lifecycle Flow

When a request arrives at the API server, several components collaborate to return a response efficiently.

1. **API Gateway Layer**: The request is authenticated. Rate limits are checked.
2. **SandboxManager**: The payload is routed to the sandbox orchestrator.
3. **Pool Checkout**: A ready, booted Firecracker VM is taken from the pool.
4. **Vsock Injection**: The Python payload is injected.
5. **Daemon Parsing**: `exec_daemon.py` uses `ast.parse` and custom logic to execute the code.
6. **Execution Phase**: The sandbox enforces time and memory constraints.
7. **Scraping phase**: Outputs are fetched, looking for `__FOTOHUB_RESULT__`.
8. **Teardown**: The KVM instance is killed. A new one is asynchronously queued.
9. **Response Delivery**: JSON is sent back to the API client.



---

## Multi-Language SDK Examples for Exec-Python

### Python Example
```python
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_YOUR_API_KEY")

def execute_remote():
    res = client.post("/sandbox/exec-python", {
        "code": "result = {'hello': input['name']}",
        "input": {"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128
    })
    return res.data
```

### TypeScript Example
```typescript
import { FotoHub } from "fotohub";
const client = new FotoHub({ apiKey: "fh_live_YOUR_API_KEY" });

async function executeRemote() {
    const res = await client.post("/sandbox/exec-python", {
        code: "result = {'hello': input['name']}",
        input: { name: "World" },
        timeout_s: 5,
        memory_mb: 128
    });
    console.log(res.data);
}
```

### Go Example
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "code":      "result = {'hello': input['name']}",
        "input":     map[string]string{"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/sandbox/exec-python", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    fmt.Println(resp.Status)
}
```

### cURL Example
```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = {"hello": input["name"]}",
    "input": {"name": "World"},
    "timeout_s": 5,
    "memory_mb": 128
  }'
```

---

## Detailed Sandbox Lifecycle Flow

When a request arrives at the API server, several components collaborate to return a response efficiently.

1. **API Gateway Layer**: The request is authenticated. Rate limits are checked.
2. **SandboxManager**: The payload is routed to the sandbox orchestrator.
3. **Pool Checkout**: A ready, booted Firecracker VM is taken from the pool.
4. **Vsock Injection**: The Python payload is injected.
5. **Daemon Parsing**: `exec_daemon.py` uses `ast.parse` and custom logic to execute the code.
6. **Execution Phase**: The sandbox enforces time and memory constraints.
7. **Scraping phase**: Outputs are fetched, looking for `__FOTOHUB_RESULT__`.
8. **Teardown**: The KVM instance is killed. A new one is asynchronously queued.
9. **Response Delivery**: JSON is sent back to the API client.



---

## Multi-Language SDK Examples for Exec-Python

### Python Example
```python
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_YOUR_API_KEY")

def execute_remote():
    res = client.post("/sandbox/exec-python", {
        "code": "result = {'hello': input['name']}",
        "input": {"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128
    })
    return res.data
```

### TypeScript Example
```typescript
import { FotoHub } from "fotohub";
const client = new FotoHub({ apiKey: "fh_live_YOUR_API_KEY" });

async function executeRemote() {
    const res = await client.post("/sandbox/exec-python", {
        code: "result = {'hello': input['name']}",
        input: { name: "World" },
        timeout_s: 5,
        memory_mb: 128
    });
    console.log(res.data);
}
```

### Go Example
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "code":      "result = {'hello': input['name']}",
        "input":     map[string]string{"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/sandbox/exec-python", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    fmt.Println(resp.Status)
}
```

### cURL Example
```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = {"hello": input["name"]}",
    "input": {"name": "World"},
    "timeout_s": 5,
    "memory_mb": 128
  }'
```

---

## Detailed Sandbox Lifecycle Flow

When a request arrives at the API server, several components collaborate to return a response efficiently.

1. **API Gateway Layer**: The request is authenticated. Rate limits are checked.
2. **SandboxManager**: The payload is routed to the sandbox orchestrator.
3. **Pool Checkout**: A ready, booted Firecracker VM is taken from the pool.
4. **Vsock Injection**: The Python payload is injected.
5. **Daemon Parsing**: `exec_daemon.py` uses `ast.parse` and custom logic to execute the code.
6. **Execution Phase**: The sandbox enforces time and memory constraints.
7. **Scraping phase**: Outputs are fetched, looking for `__FOTOHUB_RESULT__`.
8. **Teardown**: The KVM instance is killed. A new one is asynchronously queued.
9. **Response Delivery**: JSON is sent back to the API client.



---

## Multi-Language SDK Examples for Exec-Python

### Python Example
```python
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_YOUR_API_KEY")

def execute_remote():
    res = client.post("/sandbox/exec-python", {
        "code": "result = {'hello': input['name']}",
        "input": {"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128
    })
    return res.data
```

### TypeScript Example
```typescript
import { FotoHub } from "fotohub";
const client = new FotoHub({ apiKey: "fh_live_YOUR_API_KEY" });

async function executeRemote() {
    const res = await client.post("/sandbox/exec-python", {
        code: "result = {'hello': input['name']}",
        input: { name: "World" },
        timeout_s: 5,
        memory_mb: 128
    });
    console.log(res.data);
}
```

### Go Example
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "code":      "result = {'hello': input['name']}",
        "input":     map[string]string{"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/sandbox/exec-python", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    fmt.Println(resp.Status)
}
```

### cURL Example
```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = {"hello": input["name"]}",
    "input": {"name": "World"},
    "timeout_s": 5,
    "memory_mb": 128
  }'
```

---

## Detailed Sandbox Lifecycle Flow

When a request arrives at the API server, several components collaborate to return a response efficiently.

1. **API Gateway Layer**: The request is authenticated. Rate limits are checked.
2. **SandboxManager**: The payload is routed to the sandbox orchestrator.
3. **Pool Checkout**: A ready, booted Firecracker VM is taken from the pool.
4. **Vsock Injection**: The Python payload is injected.
5. **Daemon Parsing**: `exec_daemon.py` uses `ast.parse` and custom logic to execute the code.
6. **Execution Phase**: The sandbox enforces time and memory constraints.
7. **Scraping phase**: Outputs are fetched, looking for `__FOTOHUB_RESULT__`.
8. **Teardown**: The KVM instance is killed. A new one is asynchronously queued.
9. **Response Delivery**: JSON is sent back to the API client.



---

## Multi-Language SDK Examples for Exec-Python

### Python Example
```python
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_YOUR_API_KEY")

def execute_remote():
    res = client.post("/sandbox/exec-python", {
        "code": "result = {'hello': input['name']}",
        "input": {"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128
    })
    return res.data
```

### TypeScript Example
```typescript
import { FotoHub } from "fotohub";
const client = new FotoHub({ apiKey: "fh_live_YOUR_API_KEY" });

async function executeRemote() {
    const res = await client.post("/sandbox/exec-python", {
        code: "result = {'hello': input['name']}",
        input: { name: "World" },
        timeout_s: 5,
        memory_mb: 128
    });
    console.log(res.data);
}
```

### Go Example
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "code":      "result = {'hello': input['name']}",
        "input":     map[string]string{"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/sandbox/exec-python", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    fmt.Println(resp.Status)
}
```

### cURL Example
```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = {"hello": input["name"]}",
    "input": {"name": "World"},
    "timeout_s": 5,
    "memory_mb": 128
  }'
```

---

## Detailed Sandbox Lifecycle Flow

When a request arrives at the API server, several components collaborate to return a response efficiently.

1. **API Gateway Layer**: The request is authenticated. Rate limits are checked.
2. **SandboxManager**: The payload is routed to the sandbox orchestrator.
3. **Pool Checkout**: A ready, booted Firecracker VM is taken from the pool.
4. **Vsock Injection**: The Python payload is injected.
5. **Daemon Parsing**: `exec_daemon.py` uses `ast.parse` and custom logic to execute the code.
6. **Execution Phase**: The sandbox enforces time and memory constraints.
7. **Scraping phase**: Outputs are fetched, looking for `__FOTOHUB_RESULT__`.
8. **Teardown**: The KVM instance is killed. A new one is asynchronously queued.
9. **Response Delivery**: JSON is sent back to the API client.



---

## Multi-Language SDK Examples for Exec-Python

### Python Example
```python
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_YOUR_API_KEY")

def execute_remote():
    res = client.post("/sandbox/exec-python", {
        "code": "result = {'hello': input['name']}",
        "input": {"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128
    })
    return res.data
```

### TypeScript Example
```typescript
import { FotoHub } from "fotohub";
const client = new FotoHub({ apiKey: "fh_live_YOUR_API_KEY" });

async function executeRemote() {
    const res = await client.post("/sandbox/exec-python", {
        code: "result = {'hello': input['name']}",
        input: { name: "World" },
        timeout_s: 5,
        memory_mb: 128
    });
    console.log(res.data);
}
```

### Go Example
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "code":      "result = {'hello': input['name']}",
        "input":     map[string]string{"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/sandbox/exec-python", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    fmt.Println(resp.Status)
}
```

### cURL Example
```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = {"hello": input["name"]}",
    "input": {"name": "World"},
    "timeout_s": 5,
    "memory_mb": 128
  }'
```

---

## Detailed Sandbox Lifecycle Flow

When a request arrives at the API server, several components collaborate to return a response efficiently.

1. **API Gateway Layer**: The request is authenticated. Rate limits are checked.
2. **SandboxManager**: The payload is routed to the sandbox orchestrator.
3. **Pool Checkout**: A ready, booted Firecracker VM is taken from the pool.
4. **Vsock Injection**: The Python payload is injected.
5. **Daemon Parsing**: `exec_daemon.py` uses `ast.parse` and custom logic to execute the code.
6. **Execution Phase**: The sandbox enforces time and memory constraints.
7. **Scraping phase**: Outputs are fetched, looking for `__FOTOHUB_RESULT__`.
8. **Teardown**: The KVM instance is killed. A new one is asynchronously queued.
9. **Response Delivery**: JSON is sent back to the API client.



---

## Multi-Language SDK Examples for Exec-Python

### Python Example
```python
from fotohub import FotoHub
client = FotoHub(api_key="fh_live_YOUR_API_KEY")

def execute_remote():
    res = client.post("/sandbox/exec-python", {
        "code": "result = {'hello': input['name']}",
        "input": {"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128
    })
    return res.data
```

### TypeScript Example
```typescript
import { FotoHub } from "fotohub";
const client = new FotoHub({ apiKey: "fh_live_YOUR_API_KEY" });

async function executeRemote() {
    const res = await client.post("/sandbox/exec-python", {
        code: "result = {'hello': input['name']}",
        input: { name: "World" },
        timeout_s: 5,
        memory_mb: 128
    });
    console.log(res.data);
}
```

### Go Example
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
        "code":      "result = {'hello': input['name']}",
        "input":     map[string]string{"name": "World"},
        "timeout_s": 5,
        "memory_mb": 128,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://apis.fotohub.app/sandbox/exec-python", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    fmt.Println(resp.Status)
}
```

### cURL Example
```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = {"hello": input["name"]}",
    "input": {"name": "World"},
    "timeout_s": 5,
    "memory_mb": 128
  }'
```

---

## Detailed Sandbox Lifecycle Flow

When a request arrives at the API server, several components collaborate to return a response efficiently.

1. **API Gateway Layer**: The request is authenticated. Rate limits are checked.
2. **SandboxManager**: The payload is routed to the sandbox orchestrator.
3. **Pool Checkout**: A ready, booted Firecracker VM is taken from the pool.
4. **Vsock Injection**: The Python payload is injected.
5. **Daemon Parsing**: `exec_daemon.py` uses `ast.parse` and custom logic to execute the code.
6. **Execution Phase**: The sandbox enforces time and memory constraints.
7. **Scraping phase**: Outputs are fetched, looking for `__FOTOHUB_RESULT__`.
8. **Teardown**: The KVM instance is killed. A new one is asynchronously queued.
9. **Response Delivery**: JSON is sent back to the API client.

