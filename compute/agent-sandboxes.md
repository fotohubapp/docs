# Agent Sandboxes & Firecracker microVMs

Execute untrusted agent-generated code, shell scripts, and multi-step data processing tasks in high-isolation microVMs booted in under 200 milliseconds.

Managed by the **Agent Compute Engine** (`server/agent-compute/`), sandboxes isolate each tenant session using hardware-level KVM virtualization backed by AWS Firecracker with an automated Docker container fallback.

---

## Sandbox Architecture & Security Boundary

```mermaid
flowchart TD
    subgraph Host Environment (Bare Metal KVM)
        A["Agent Task Execution (POST /sandbox/exec-python)"] --> B["SandboxManager"]
        B --> C{"KVM Available?"}
        C -->|"Yes (Production Bare-Metal)"| D["Warm Firecracker Pool (CID 100+)"]
        C -->|"No (Fallback Environment)"| E["Docker Container Sandbox (cgroups v2)"]
        
        D --> F["vsock Channel (Guest Port 9999)"]
        E --> F2["Local Pipe / Standard I/O"]
    end

    subgraph Firecracker microVM Jail (Guest Environment)
        F --> G["Execution Guest Daemon"]
        G --> H["Isolated Memory & vCPU (Max 2GB RAM / 1 vCPU)"]
        G --> I["Seccomp BPF Syscall Filter"]
        G --> J["Workspace Directory (/sandbox/workspace)"]
    end

    subgraph Persistent Storage Layer
        J <--> K["User Persistent Workspace (/data/workspaces/{user_id})"]
    end

    G --> L["Result Envelope ({ok, value, stdout, stderr, duration_ms})"]
```

---

## Core Security & Performance Guarantees

1. **Sub-200ms Cold Starts**: The `SandboxManager` maintains a warm pool (`pool_size=3`) of pre-booted microVMs. When an execution request arrives, a VM is claimed instantaneously without the multi-second boot latency of traditional virtualization.
2. **Vsock Communication (Zero TCP/IP Attack Surface)**: Host-to-guest communications flow strictly across Linux `virtio-vsock` (Context ID + Port 9999). The guest kernel has no virtual network interfaces, preventing Server-Side Request Forgery (SSRF) and local intranet scanning.
3. **Seccomp BPF Syscall Filtering**: Blocks privilege escalation and prevents malicious kernel calls.
4. **Persistent Virtual Workspace**: Files created or modified during execution persist in `/data/workspaces/{user_id}` and map directly to `/sandbox/workspace` across subsequent runs.
5. **Deterministic Value Extraction**: Code results assigned to `result = ...` are serialized and parsed cleanly through sentinel stream delimiters (`__FOTOHUB_RESULT__`), preventing stdout noise from corrupting programmatic outputs.

---

## Executing Python Code in Sandboxes

Send arbitrary Python code with structured input variables:

### Endpoint: `POST /sandbox/exec-python`

#### Headers
- `Authorization: Bearer fh_live_...`
- `Content-Type: application/json`

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `code` | string | **Yes** | — | Python snippet to execute. Assign output to `result = ...`. |
| `input` | object | No | `{}` | Key-value dictionary injected as the predefined global `input`. |
| `timeout_s` | integer | No | `30` | Maximum execution time in seconds (1 to 120). |
| `memory_mb` | integer | No | `512` | Memory ceiling in megabytes (up to 2048 MB). |

#### Response Example

```json
{
  "ok": true,
  "value": {
    "sample_count": 1000,
    "mean": 50.04,
    "std_dev": 9.98
  },
  "stdout": "Loaded 1,000 observations successfully.\nComputed standard summary metrics.\n",
  "stderr": "",
  "error": null,
  "duration_ms": 142
}
```

---

## Multi-Language SDK Examples

::: code-group

```python [Python]
from fotohub import FotoHub
import os

client = FotoHub(api_key=os.environ["FOTOHUB_API_KEY"])

# Execute statistical analysis with structured inputs & outputs
execution = client.post("/sandbox/exec-python", {
    "code": """
import numpy as np

# 'input' dictionary is automatically injected
raw_data = input.get("values", [])
arr = np.array(raw_data)

mean_val = float(np.mean(arr))
p95_val = float(np.percentile(arr, 95))

# Assign final return object to 'result'
result = {
    "count": len(arr),
    "mean": round(mean_val, 2),
    "p95": round(p95_val, 2)
}
print(f"Calculated p95={result['p95']} across {result['count']} items")
    """,
    "input": {
        "values": [12.4, 45.1, 89.3, 102.5, 4.2, 78.9, 120.4, 65.2]
    },
    "timeout_s": 15,
    "memory_mb": 512
})

print("Success:", execution["ok"])
print("Returned Data:", execution["value"])
print("Console Output:", execution["stdout"])
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function executeSandboxCode() {
  const response = await client.post("/sandbox/exec-python", {
    code: `
import math

radius = input.get("radius", 1.0)
area = math.pi * (radius ** 2)
circumference = 2 * math.pi * radius

result = {"radius": radius, "area": round(area, 4), "circumference": round(circumference, 4)}
print("Area calculated successfully.")
    `,
    input: { radius: 14.5 },
    timeout_s: 10,
  });

  console.log("Returned value:", response.data.value);
  console.log("Stdout:", response.data.stdout);
}

executeSandboxCode();
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type ExecRequest struct {
	Code     string                 `json:"code"`
	Input    map[string]interface{} `json:"input"`
	TimeoutS int                    `json:"timeout_s"`
}

func main() {
	payload := ExecRequest{
		Code: "import sys
print('Python version:', sys.version)
result = {'status': 'healthy'}
",
		Input: map[string]interface{}{"service": "analyzer"},
		TimeoutS: 10,
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/sandbox/exec-python", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	fmt.Println("Result:", string(respBytes))
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/sandbox/exec-python   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "code": "result = {"sum": sum(input["numbers"])}; print("Done")",
    "input": {"numbers": [10, 20, 30, 40, 50]},
    "timeout_s": 5
  }'
```

:::

---

## Virtual Workspace File Management

Files placed into `/sandbox/workspace/` persist across executions and can be managed directly via REST:

### 1. List Files in Workspace

```bash
curl -X GET https://apis.fotohub.app/v1/workspace/files   -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

Response:
```json
{
  "files": [
    {
      "path": "distribution.csv",
      "size_bytes": 14920,
      "modified_at": "2026-09-06T15:20:00Z"
    },
    {
      "path": "charts/retention.png",
      "size_bytes": 184910,
      "modified_at": "2026-09-06T15:22:15Z"
    }
  ]
}
```

### 2. Upload Data into Workspace

Upload CSVs, images, or reference files for sandbox scripts to process:

```bash
curl -X POST https://apis.fotohub.app/v1/workspace/upload   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -F "file=@./dataset.csv"   -F "path=data/dataset.csv"
```

### 3. Download Artifact from Workspace

Download files generated by sandboxed scripts:

```bash
curl -X GET https://apis.fotohub.app/v1/workspace/download/charts/retention.png   -H "Authorization: Bearer $FOTOHUB_API_KEY"   --output "retention_chart.png"
```

### 4. Delete File from Workspace

```bash
curl -X DELETE https://apis.fotohub.app/v1/workspace/files/data/dataset.csv   -H "Authorization: Bearer $FOTOHUB_API_KEY"
```
