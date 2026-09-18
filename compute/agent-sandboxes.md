# Firecracker microVM Sandboxes

FOTOhub runs untrusted, agent-generated Python in high-isolation microVMs booted in
under **200 milliseconds**.

Managed by the **Agent Compute Engine**, sandboxes isolate tenant code using hardware-assisted
Linux KVM virtualization via Firecracker, with an automatic fallback to Docker cgroups v2 when
Firecracker/KVM isn't available on the host.

:::warning Not a standalone public API
`POST /sandbox/exec-python` is an **internal** route on the Agent Compute service, gated by
a proxy secret (`X-Proxy-Secret`) that only other FOTOhub backend services hold — it does not
accept an `fh_live_*` API key and is not reachable as a customer-facing REST endpoint. You run
code in a sandbox by adding a `code.python` node to an **Agent Engine workflow**
(`POST /engine/v1/workflows`); the workflow runtime calls the sandbox on your behalf and bills
the wall-clock time as part of the workflow run. Earlier drafts of this page described
`exec-python` (and a nonexistent `exec-bash`) as something you could curl directly — that was
wrong and has been removed below.
:::

---

## Architecture: Firecracker KVM Isolation

Traditional container sandboxes (Docker, LXC) share the host Linux kernel and rely on
namespaces and cgroups, which leaves them exposed to kernel privilege-escalation and escape
exploits.

FOTOhub sandboxes run inside genuine hardware microVMs created by the Linux KVM hypervisor.
Each microVM boots its own lightweight Linux kernel, is provisioned with **2 vCPU / 2048 MiB
RAM**, and talks to the host exclusively over `virtio-vsock` on guest port **9999** — there is
no virtual ethernet device inside the guest.

```mermaid
flowchart TD
    subgraph Host["Host OS (Agent Compute Engine)"]
        A["code.python node call (internal, proxy-secret auth)"] --> B["FirecrackerSandbox"]
        B --> C{"Firecracker/KVM available?"}
        C -->|"Yes"| D["Boot microVM (2 vCPU / 2048 MiB)"]
        C -->|"No"| E["Fall back to Docker cgroups v2"]
        D --> F["Host vsock UDS proxy (guest port 9999)"]
    end

    subgraph Guest["Firecracker MicroVM (Hardware KVM Guest)"]
        F --> G["Guest exec_daemon"]
        G --> H["Wrapped Python: input injected, result captured"]
    end

    G --> I["Response: {ok, value, stdout, stderr, error, duration_ms}"]
```

### Process Lifecycle

1. **Boot:** A microVM is booted (or an already-booted one from the warm pool is reused).
2. **Vsock handshake:** The host waits for the guest's `exec_daemon` to answer a ping over the
   vsock UDS proxy before sending real work.
3. **Execution:** The user's code is wrapped (input is JSON-decoded into a module-level `input`
   global, and the code's `result = ...` assignment is captured via a `__FOTOHUB_RESULT__`
   stdout sentinel so `print()` output never corrupts the return value).
4. **Teardown:** The VM is destroyed after the call to prevent any cross-tenant state leakage.

---

## Security Boundary Guarantees

:::danger Security Restrictions
The sandbox intentionally restricts common system capabilities to ensure isolation.
:::

1. **No virtual ethernet device.** Host-to-guest communication is exclusively `virtio-vsock`;
   the guest has no `eth0`, which rules out SSRF and intranet probing from inside sandboxed code.
2. **No inherited environment.** Host environment variables are not exposed to the guest; don't
   rely on `os.environ` inside sandboxed code.
3. **Ephemeral by design.** Each execution gets a fresh microVM; nothing persists across calls
   unless your workflow explicitly passes state back in via `input`.

---

## Running Code: the `code.python` Workflow Node

There is no public `POST /sandbox/exec-python` endpoint. To execute Python, add a
`code.python` node to an Agent Engine workflow:

```json
{
  "type": "code.python",
  "params": {
    "code": "import numpy as np\ndata = np.array(input['values'])\nresult = {'mean': float(np.mean(data))}",
    "timeout_s": 30,
    "memory_mb": 512
  }
}
```

| Parameter | Type | Default | Notes |
|:---|:---|:---:|:---|
| `code` | string | — | Python source. Assign the return value to `result = ...`. |
| `input` | object | `{}` | The node's incoming data, injected as the global `input` dict. |
| `timeout_s` | integer | `30` | Server-side hard cap of **120s** regardless of what you request. |
| `memory_mb` | integer | `512` | Soft ceiling passed to the sandbox; not independently verified per-recipe below. |

Create/manage the workflow via the real Agent Engine routes:

```bash
curl -X POST https://apis.fotohub.app/engine/v1/workflows \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "sandbox-demo", "nodes": [{"type": "code.python", "params": {"code": "result = 1 + 1"}}]}'
```

### Response shape

The sandbox call itself (internal) returns:

```json
{
  "ok": true,
  "value": { "mean": 3.0 },
  "stdout": "",
  "stderr": "",
  "error": null,
  "duration_ms": 142
}
```

`value` carries whatever you assigned to `result`; there is no separate `memory_mb` field in
the response — memory pressure shows up as an `ok: false` / OOM error instead.

---

## Resource Limits

- **Timeout:** requests may ask for any `timeout_s`, but the route clamps it to a **120-second
  hard maximum**; the default if you omit it is 30s.
- **Memory:** the microVM itself is provisioned with 2048 MiB; the `memory_mb` request
  parameter (default 512) is a soft ceiling for your own accounting, not a guaranteed hard cap
  independently verified for every workload shape.
- **Timeout error example:**

```json
{ "ok": false, "value": null, "error": "TimeoutError: execution exceeded the configured timeout", "duration_ms": 30004 }
```

---

## Billing

Sandbox wall-clock time bills at **$0.0002 per second**, added on
top of the model-token cost for the workflow step that triggered it — there is no separate,
standalone "per sandbox call" product or invoice line. A 400ms execution therefore adds about
**$0.00008** to that step's cost. Billing happens only after the node completes successfully;
a failed or timed-out execution is not charged.

---

## Example Recipes

These are `code` payloads you can drop straight into a `code.python` node's `params.code`.
The execution environment includes numpy, pandas, scipy, pillow, httpx, scikit-learn, and
beautifulsoup4.

### 1. Basic Math/Stats with NumPy

```python
import numpy as np
data = np.array(input['values'])
result = {
    "mean": float(np.mean(data)),
    "std": float(np.std(data)),
    "max": float(np.max(data))
}
```

### 2. Pandas Data Transformation

```python
import pandas as pd
df = pd.DataFrame(input['records'])
summary = df.groupby('category')['amount'].sum().to_dict()
result = summary
```

### 3. Image Processing with PIL/Pillow

:::warning
Pass images as base64 in `input`, or a signed FOTOhub S3 URL to fetch with `httpx` — the guest
has no inbound network access to fetch anything else.
:::

```python
import base64, io
from PIL import Image, ImageFilter

image_data = base64.b64decode(input['image_b64'])
img = Image.open(io.BytesIO(image_data)).filter(ImageFilter.BLUR)

buffered = io.BytesIO()
img.save(buffered, format="PNG")
result = {"blurred_image": base64.b64encode(buffered.getvalue()).decode('utf-8')}
```

### 4. JSON Parsing and Transformation

```python
import json
data = json.loads(input['json_string'])
flat = {}
for key, value in data.items():
    if isinstance(value, dict):
        for k, v in value.items():
            flat[f"{key}_{k}"] = v
    else:
        flat[key] = value
result = {"flattened": flat}
```

### 5. HTTP Requests with httpx Inside the Sandbox

```python
import httpx
res = httpx.get("https://api.github.com/repos/facebook/react")
result = {"stars": res.json()["stargazers_count"]} if res.status_code == 200 else {"error": "fetch failed"}
```

### 6. Scikit-learn Inference

```python
from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array(input['X']).reshape(-1, 1)
y = np.array(input['y'])
model = LinearRegression().fit(X, y)
result = {"predictions": model.predict(np.array(input['test_X']).reshape(-1, 1)).tolist()}
```

### 7. Regex Extraction

```python
import re
emails = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', input['text'])
result = {"emails": emails, "count": len(emails)}
```

### 8. AST-based Code Linting

```python
import ast
try:
    tree = ast.parse(input['code_to_check'])
    result = {"valid_syntax": True, "functions": sum(isinstance(n, ast.FunctionDef) for n in ast.walk(tree))}
except SyntaxError as e:
    result = {"valid_syntax": False, "error": str(e)}
```

### 9. CSV to JSON

```python
import csv, io
reader = csv.DictReader(io.StringIO(input['csv_data']))
result = {"data": [row for row in reader]}
```

### 10. Mathematical Optimization with SciPy

```python
from scipy.optimize import minimize
res = minimize(lambda x: (x[0] - 5) ** 2, [0])
result = {"optimized_x": res.x.tolist()[0], "success": res.success}
```

### 11. Base64 Encode/Decode

```python
import base64
if input['action'] == 'encode':
    result = {"output": base64.b64encode(input['text'].encode()).decode()}
elif input['action'] == 'decode':
    result = {"output": base64.b64decode(input['text'].encode()).decode()}
```
