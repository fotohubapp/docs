# Firecracker microVM Sandboxes & Virtual Workspaces

Execute untrusted agent-generated code, statistical algorithms, and data processing tasks in high-isolation microVMs booted in under **200 milliseconds**.

Managed by the **Agent Compute Engine** (`server/agent-compute/` on port 8795), sandboxes isolate tenant code using hardware-assisted Linux KVM virtualization backed by AWS Firecracker, with automatic fallback to Docker cgroups v2.

---

## Sandbox Security Boundary & Vsock Architecture

Traditional container sandboxes (Docker, LXC) share the host Linux kernel and rely purely on namespaces and cgroups, leaving them vulnerable to kernel privilege escalation and escape exploits.

FOTOhub Sandboxes run inside genuine hardware microVMs created by the Linux KVM hypervisor:

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

    G --> L["Result Envelope ({ok, value, stdout, stderr, duration_ms})"]
```

### Core Security Guarantees

1. **Zero TCP/IP Attack Surface**: Host-to-guest communications flow strictly across Linux `virtio-vsock` (Context ID + Port 9999). The guest kernel contains **no virtual ethernet devices (`eth0`)**, preventing Server-Side Request Forgery (SSRF), internal intranet probing, and network flooding.
2. **KVM Jailer Sandboxing**: Firecracker processes are locked inside an unprivileged jail using `chroot`, `unshare`, custom cgroups, and strict Seccomp filters that deny over 200 system calls.
3. **Sub-200ms Cold Execution**: The `SandboxManager` maintains a dynamically replenished pool of pre-booted microVMs (`pool_size=3`), completely eliminating traditional VM startup delays.
4. **Deterministic Sentinel Value Parsing**: Return values assigned to `result = ...` are extracted via atomic stream sentinels (`__FOTOHUB_RESULT__`), ensuring noisy stdout logs never corrupt programmatic JSON responses.

---

## Sandbox REST API Reference

### 1. Execute Python Code: `POST /sandbox/exec-python`

Run arbitrary Python scripts with typed inputs and structured return values.

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|:---|:---|:---:|:---:|:---|
| `code` | string | **Yes** | — | Python code snippet. Assign final output to `result = ...`. |
| `input` | object | No | `{}` | Key-value dictionary injected as the predefined global `input`. |
| `timeout_s` | integer | No | `30` | Maximum execution time in seconds (1 to 120). |
| `memory_mb` | integer | No | `512` | Memory ceiling in megabytes (up to 2048 MB). |

#### Request Example

::: code-group

```python [Python]
from fotohub import FotoHub
import os

client = FotoHub(api_key=os.environ["FOTOHUB_API_KEY"])

response = client.post("/sandbox/exec-python", {
    "code": """
import numpy as np
data = np.array(input['measurements'])
result = {
    "count": len(data),
    "mean": float(np.mean(data)),
    "p95": float(np.percentile(data, 95))
}
print("Calculation complete.")
""",
    "input": {"measurements": [12.4, 15.8, 14.2, 28.5, 13.9, 14.1]},
    "timeout_s": 10,
    "memory_mb": 512
})

print(response)
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runSandbox() {
  const res = await client.post("/sandbox/exec-python", {
    code: `
import math
radius = input['radius']
result = {"circumference": 2 * math.pi * radius, "area": math.pi * (radius ** 2)}
`,
    input: { radius: 10 },
    timeout_s: 5,
  });

  console.log("Calculated:", res.data.value);
}

runSandbox();
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "result = {\"sum\": sum(input[\"numbers\"])}",
    "input": {"numbers": [10, 20, 30, 40]},
    "timeout_s": 10
  }'
```

:::

#### Response Example

```json
{
  "ok": true,
  "value": {
    "count": 6,
    "mean": 16.483333333333334,
    "p95": 25.225
  },
  "stdout": "Calculation complete.\n",
  "stderr": "",
  "error": null,
  "duration_ms": 142
}
```

---

### 2. Execute Shell Commands: `POST /sandbox/exec-bash`

Execute arbitrary bash commands, compile source code, or run test suites.

```bash
curl -X POST https://apis.fotohub.app/sandbox/exec-bash \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "python3 -m unittest discover -s /sandbox/workspace/tests",
    "timeout_s": 30
  }'
```

#### Response Example

```json
{
  "ok": true,
  "exit_code": 0,
  "stdout": "Ran 12 tests in 0.045s\n\nOK\n",
  "stderr": "",
  "duration_ms": 185
}
```

---

### 3. Workspace File Management

Files placed in `/sandbox/workspace` automatically persist between executions for the authenticated user.

| Endpoint | Method | Description |
|:---|:---|:---|
| `/sandbox/workspace/files` | `GET` | List all files in the virtual workspace. |
| `/sandbox/workspace/upload` | `POST` | Multipart upload a file into `/sandbox/workspace/{path}`. |
| `/sandbox/workspace/download/{path}` | `GET` | Download a file generated by the sandbox. |
| `/sandbox/workspace/reset` | `DELETE` | Purge all workspace files and reset to empty state. |

#### Example: Uploading Data and Downloading Results

```bash
# 1. Upload a CSV dataset to workspace
curl -X POST https://apis.fotohub.app/sandbox/workspace/upload \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -F "file=@sales_2026.csv" \
  -F "path=/sandbox/workspace/data/sales.csv"

# 2. Process data in sandbox and generate output chart
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import pandas as pd; df = pd.read_csv(\"/sandbox/workspace/data/sales.csv\"); df.describe().to_csv(\"/sandbox/workspace/summary.csv\"); result = {\"rows\": len(df)}"
  }'

# 3. Download the generated summary CSV
curl -X GET https://apis.fotohub.app/sandbox/workspace/download/summary.csv \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -o summary.csv
```

---

## Pre-Installed Scientific Libraries

Every microVM runtime image includes optimized binaries for standard Python packages:
- **Data & Math:** `numpy`, `pandas`, `scipy`, `sympy`, `scikit-learn`
- **Visualization:** `matplotlib` (Agg headless), `seaborn`
- **Text & Parsing:** `beautifulsoup4`, `lxml`, `regex`, `pypdf`, `pdfminer.six`
- **Utilities:** `requests`, `pytz`, `dateutil`, `pillow` (PIL)\n