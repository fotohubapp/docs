---
title: Brand Engine API Reference
description: Master documentation for the FOTOhub Brand Engine and Identity APIs, covering virtual faces, identity kits, brand guidelines, and automated compliance.
---

# Brand Engine API

The **FOTOhub Brand Engine** (`/brand/v1/brands`) is the centralized repository for brand visual identity kits, virtual brand faces and ambassadors, logos, product catalogs, color palettes, and automated brand compliance checking. 

This powerful engine acts as the unified configuration layer across all FOTOhub generation pipelines, allowing your AI image, video, and audio generation requests to automatically inject consistent brand styling, fonts, colors, and characters.

::: tip Unified Architecture
By using the Brand Engine, you no longer need to pass complex prompt injections for styles, colors, and LoRA character models in every single API call. Instead, simply pass the `brand_id` parameter to any generation endpoint, and the FOTOhub backend handles the context assembly.
:::

Base URL: `https://apis.fotohub.app/brand/v1/brands`

---

## Architecture Overview

The Brand Engine integrates deeply with FOTOhub's underlying GPU cluster and storage layers. FOTOhub employs a specialized orchestration layer that intelligently distributes brand-specific tasks across our geographically distributed GPU nodes.

```mermaid
flowchart TD
    API[FOTOhub API Gateway] --> BE[Brand Engine]
    BE --> DB[(Identity DB PostgreSQL)]
    BE --> C[(Redis Context Cache)]
    
    API --> GEN[Generation Pipelines]
    GEN --> C
    
    GEN --> GPU1[GPU Node 1: Flux / SDXL Core]
    GEN --> GPU2[GPU Node 2: MMAudio]
    GEN --> GPU3[GPU Node 3: MuseTalk / LipSync]
    GEN --> GPU4[GPU Node 4: 3D / ControlNet]
    GEN --> GPU5[GPU Node 5: 3D / Mesh Processing]
    
    GPU1 -.-> BYOB[BYOB S3/R2 Storage]
    GPU2 -.-> BYOB
    GPU3 -.-> BYOB
    GPU4 -.-> BYOB
```

::: info GPU Affinity & Allocation
The FOTOhub backend routes brand engine tasks to specialized GPU nodes based on the asset type and required compute topology:
- **GPU 1**: Handles high-resolution image and core generative tasks (Flux, SDXL, LoRA training for brand faces).
- **GPU 2 (MMAudio)**: Handles brand voice synthesis, background track generation, and auditory compliance.
- **GPU 3 (MuseTalk/LipSync)**: Dedicated to virtual brand ambassador lip-syncing and expression temporal consistency.
- **GPU 4/5 (3D)**: Manage 3D logo extrusion, mesh generation, spatial compliance checks, and ControlNet structure enforcement.
:::

---

## Unit Economics & Cost Breakdown

FOTOhub uses **pure USD billing only**. We do not use credits, token packs, PLN, zł, or any synthetic currencies. All costs are transparently deducted from your `wallet.available_usd` balance.

| Operation | Cost (USD) | Detailed Description |
|-----------|------------|-------------|
| **Brand DNA extraction** | `$0.015 / upload` | Vision-LLM extraction of brand guidelines from reference images (includes palette, tone, typography). |
| **Color extraction** | `$0.005 / upload` | Automated palette extraction and color naming via clustering. |
| **Face generation** | `$0.035 / face` | Master character generation using `nano-banana-pro` and identity locking. |
| **Perspective variant** | `$0.025 / angle` | Consistency-enforced rotation of master face (e.g., front, profile, three-quarter). |
| **Expression variant** | `$0.022 / variant`| Pose or facial expression modification with ControlNet enforcement. |
| **Compliance check** | `$0.005 / image` | Scoring an asset against brand identity parameters. |
| **Brand text generation**| `$0.003 / text` | AI copywriting aligned with brand tone of voice. |
| **Context Assembly** | `Free` | Injecting brand context into generation endpoints. |
| **Brand Export** | `Free` | Streaming brand configuration to BYOB storage. |

::: danger Account Balances
Ensure your `wallet.available_usd` has sufficient funds before initiating bulk generation tasks. Async jobs that run out of funds will instantly fail validation or be moved to the DLQ (Dead Letter Queue) with a `insufficient_funds` error state. To auto-top-up, use the `/v1/billing/auto-reload` endpoint.
:::

---

### List Brand Kits

Retrieve a paginated list of all brand identity kits associated with your workspace.

`GET /brand/v1/brands`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
response = requests.get(url, headers=headers)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const response = await fetch(url, { method: "GET", headers });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands"
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X GET "https://apis.fotohub.app/brand/v1/brands" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json"
```

:::

---

### Create Brand Kit

Initialize a new brand identity kit.

`POST /brand/v1/brands`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {"dummy_field": "dummy_value"}
response = requests.post(url, headers=headers, json=payload)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const body = JSON.stringify({ dummy_field: "dummy_value" });
  const response = await fetch(url, { method: "POST", headers, body });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
	"bytes"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands"
	payload := []byte(`{"dummy_field": "dummy_value"}`)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/brand/v1/brands" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"dummy_field": "dummy_value"}'
```

:::

---

### Get Full Brand Details

Fetch all stored configuration for a specific brand kit.

`GET /brand/v1/brands/{brand_id}`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
response = requests.get(url, headers=headers)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const response = await fetch(url, { method: "GET", headers });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands/{brand_id}"
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X GET "https://apis.fotohub.app/brand/v1/brands/{brand_id}" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json"
```

:::

---

### Update Brand Profile

Modify fields on an existing brand profile.

`PUT /brand/v1/brands/{brand_id}`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {"dummy_field": "dummy_value"}
response = requests.put(url, headers=headers, json=payload)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const body = JSON.stringify({ dummy_field: "dummy_value" });
  const response = await fetch(url, { method: "PUT", headers, body });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
	"bytes"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands/{brand_id}"
	payload := []byte(`{"dummy_field": "dummy_value"}`)
	req, _ := http.NewRequest("PUT", url, bytes.NewBuffer(payload))
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X PUT "https://apis.fotohub.app/brand/v1/brands/{brand_id}" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"dummy_field": "dummy_value"}'
```

:::

---

### Delete Brand

Permanently delete a brand and all associated assets, faces, and trained LoRAs.

`DELETE /brand/v1/brands/{brand_id}`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
response = requests.delete(url, headers=headers)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const response = await fetch(url, { method: "DELETE", headers });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands/{brand_id}"
	req, _ := http.NewRequest("DELETE", url, nil)
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/brand/v1/brands/{brand_id}" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json"
```

:::

---

### Get Brand Summary for LLMs

Returns a highly compressed, token-optimized text string representing the brand context.

`GET /brand/v1/brands/{brand_id}/summary`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/summary"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
response = requests.get(url, headers=headers)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/summary";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const response = await fetch(url, { method: "GET", headers });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands/{brand_id}/summary"
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X GET "https://apis.fotohub.app/brand/v1/brands/{brand_id}/summary" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json"
```

:::

---

### Get Full Context Map

Fetches the complete resolution map for the brand, including references to internal LoRAs, cached face embeddings, style presets, and resolved CDN URLs.

`GET /brand/v1/brands/{brand_id}/context`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/context"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
response = requests.get(url, headers=headers)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/context";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const response = await fetch(url, { method: "GET", headers });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands/{brand_id}/context"
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X GET "https://apis.fotohub.app/brand/v1/brands/{brand_id}/context" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json"
```

:::

---

### Export Brand Kit

Exports a static JSON/ZIP bundle of the entire brand kit to an external location (like a BYOB S3 bucket).

`POST /brand/v1/brands/{brand_id}/export`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/export"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {"dummy_field": "dummy_value"}
response = requests.post(url, headers=headers, json=payload)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/export";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const body = JSON.stringify({ dummy_field: "dummy_value" });
  const response = await fetch(url, { method: "POST", headers, body });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
	"bytes"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands/{brand_id}/export"
	payload := []byte(`{"dummy_field": "dummy_value"}`)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/brand/v1/brands/{brand_id}/export" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"dummy_field": "dummy_value"}'
```

:::

---

### Extract Dominant Colors

Upload a brand image to extract the core palette.

`POST /brand/v1/brands/{brand_id}/extract-colors`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/extract-colors"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {"dummy_field": "dummy_value"}
response = requests.post(url, headers=headers, json=payload)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/extract-colors";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const body = JSON.stringify({ dummy_field: "dummy_value" });
  const response = await fetch(url, { method: "POST", headers, body });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
	"bytes"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands/{brand_id}/extract-colors"
	payload := []byte(`{"dummy_field": "dummy_value"}`)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/brand/v1/brands/{brand_id}/extract-colors" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"dummy_field": "dummy_value"}'
```

:::

---

### Extract Brand DNA

Upload marketing collateral, packaging, or screenshots to automatically analyze and extract brand colors, visual style, tone of voice, typography, and keywords.

`POST /brand/v1/brands/{brand_id}/extract-dna`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/extract-dna"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {"dummy_field": "dummy_value"}
response = requests.post(url, headers=headers, json=payload)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/extract-dna";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const body = JSON.stringify({ dummy_field: "dummy_value" });
  const response = await fetch(url, { method: "POST", headers, body });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
	"bytes"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands/{brand_id}/extract-dna"
	payload := []byte(`{"dummy_field": "dummy_value"}`)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/brand/v1/brands/{brand_id}/extract-dna" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"dummy_field": "dummy_value"}'
```

:::

---

### Check Compliance

Score how closely a newly generated ad, banner, or photo matches the established brand guidelines on a scale of 0 to 100.

`POST /brand/v1/brands/{brand_id}/check-compliance`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/check-compliance"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {"dummy_field": "dummy_value"}
response = requests.post(url, headers=headers, json=payload)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/check-compliance";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const body = JSON.stringify({ dummy_field: "dummy_value" });
  const response = await fetch(url, { method: "POST", headers, body });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
	"bytes"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands/{brand_id}/check-compliance"
	payload := []byte(`{"dummy_field": "dummy_value"}`)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/brand/v1/brands/{brand_id}/check-compliance" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"dummy_field": "dummy_value"}'
```

:::

---

### Generate On-Brand Text

Generate copy (taglines, slogans, captions, or email subjects) that strictly adheres to the brand's stored tone of voice and keywords.

`POST /brand/v1/brands/{brand_id}/generate-text`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/generate-text"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {"dummy_field": "dummy_value"}
response = requests.post(url, headers=headers, json=payload)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/generate-text";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const body = JSON.stringify({ dummy_field: "dummy_value" });
  const response = await fetch(url, { method: "POST", headers, body });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
	"bytes"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands/{brand_id}/generate-text"
	payload := []byte(`{"dummy_field": "dummy_value"}`)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/brand/v1/brands/{brand_id}/generate-text" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"dummy_field": "dummy_value"}'
```

:::

---

### List Brand Faces

Retrieves all virtual ambassadors linked to this brand kit.

`GET /brand/v1/brands/{brand_id}/faces`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
response = requests.get(url, headers=headers)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const response = await fetch(url, { method: "GET", headers });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces"
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X GET "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json"
```

:::

---

### Generate Master Virtual Ambassador

Initialize a new digital character from text parameters. This is an async job.

`POST /brand/v1/brands/{brand_id}/faces/generate`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/generate"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {"dummy_field": "dummy_value"}
response = requests.post(url, headers=headers, json=payload)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/generate";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const body = JSON.stringify({ dummy_field: "dummy_value" });
  const response = await fetch(url, { method: "POST", headers, body });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
	"bytes"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/generate"
	payload := []byte(`{"dummy_field": "dummy_value"}`)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/generate" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"dummy_field": "dummy_value"}'
```

:::

---

### Get Face Details

Retrieves face settings, parameters used for generation, and all currently generated variant URLs.

`GET /brand/v1/brands/{brand_id}/faces/{face_id}`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/{face_id}"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
response = requests.get(url, headers=headers)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/{face_id}";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const response = await fetch(url, { method: "GET", headers });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/{face_id}"
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X GET "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/{face_id}" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json"
```

:::

---

### Delete Face

Removes the face embedding permanently.

`DELETE /brand/v1/brands/{brand_id}/faces/{face_id}`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/{face_id}"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
response = requests.delete(url, headers=headers)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/{face_id}";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const response = await fetch(url, { method: "DELETE", headers });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/{face_id}"
	req, _ := http.NewRequest("DELETE", url, nil)
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/{face_id}" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json"
```

:::

---

### Generate Perspective Variants

Create consistent alternative angles for a master face embedding.

`POST /brand/v1/brands/{brand_id}/faces/{face_id}/perspectives`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/{face_id}/perspectives"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {"dummy_field": "dummy_value"}
response = requests.post(url, headers=headers, json=payload)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/{face_id}/perspectives";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const body = JSON.stringify({ dummy_field: "dummy_value" });
  const response = await fetch(url, { method: "POST", headers, body });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
	"bytes"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/{face_id}/perspectives"
	payload := []byte(`{"dummy_field": "dummy_value"}`)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/{face_id}/perspectives" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"dummy_field": "dummy_value"}'
```

:::

---

### Generate Expression Variants

Create variations in facial expression or pose based on the master identity.

`POST /brand/v1/brands/{brand_id}/faces/{face_id}/expressions`

#### Path / Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand_id` | string | Yes | - | Resource identifier |
| `limit` | integer | No | `20` | Pagination limit |
| `offset` | integer | No | `0` | Pagination offset |
| `verbose` | boolean | No | `false` | Enable verbose output |

::: code-group

```python [Python]
import requests
import json
import time

url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/{face_id}/expressions"
headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
}
payload = {"dummy_field": "dummy_value"}
response = requests.post(url, headers=headers, json=payload)
print(response.status_code)
print(response.json())
```

```typescript [TypeScript]
async function callApi() {
  const url = "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/{face_id}/expressions";
  const headers = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  };
  const body = JSON.stringify({ dummy_field: "dummy_value" });
  const response = await fetch(url, { method: "POST", headers, body });
  const data = await response.json();
  console.log(data);
}
callApi();
```

```go [Go]
package main
import (
	"fmt"
	"io"
	"net/http"
	"bytes"
)
func main() {
	url := "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/{face_id}/expressions"
	payload := []byte(`{"dummy_field": "dummy_value"}`)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	req.Header.Add("Authorization", "Bearer fh_live_your_api_key")
	req.Header.Add("Content-Type", "application/json")
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/brand/v1/brands/{brand_id}/faces/{face_id}/expressions" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"dummy_field": "dummy_value"}'
```

:::

---


## Webhooks & Async Handling

For long-running tasks like face generation, massive multi-angle perspective rendering, or bulk DNA extraction, it is highly recommended to use FOTOhub Webhooks instead of repeatedly polling `GET /brand/v1/brands/{brand_id}/faces/{face_id}` for status.

::: warning No dedicated job queue on Brand Engine
Brand Engine does not expose a Dead Letter Queue or a generic job-retry endpoint. If a face generation or DNA extraction request fails (e.g. temporary GPU starvation or insufficient funds), re-submit the original request (`POST /brand/v1/brands/{brand_id}/faces/generate` or `POST /brand/v1/brands/{brand_id}/extract-dna`) rather than expecting an automatic retry queue.
:::

### Webhook Verification Flow

```mermaid
sequenceDiagram
    participant User Server
    participant FOTOhub
    FOTOhub->>FOTOhub: Job Completes (GPU Node)
    FOTOhub->>User Server: POST /webhook (Payload + X-FOTOhub-Signature)
    User Server->>User Server: Compute HMAC-SHA256
    User Server-->>FOTOhub: 200 OK
```

FOTOhub sends webhooks with a signature in the `X-FOTOhub-Signature` header. Always verify the HMAC-SHA256 signature to ensure the payload is authentic.

::: code-group
```python [Python]
import hmac
import hashlib
from fastapi import Request, HTTPException

WEBHOOK_SECRET = "whsec_your_webhook_secret"

async def verify_webhook(request: Request):
    payload = await request.body()
    signature_header = request.headers.get("X-FOTOhub-Signature")
    
    if not signature_header:
        raise HTTPException(status_code=400, detail="Missing signature")
        
    expected_mac = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected_mac, signature_header):
        raise HTTPException(status_code=401, detail="Invalid signature")
        
    print("Webhook successfully verified!")
    return True
```
```typescript [TypeScript]
import crypto from 'crypto';

const WEBHOOK_SECRET = "whsec_your_webhook_secret";

function verifyWebhook(rawBody: Buffer, signature: string): boolean {
  if (!signature) return false;
  
  const expectedMac = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
    
  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedMac),
    Buffer.from(signature)
  );
}

// In Express.js:
// app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
//   if (verifyWebhook(req.body, req.headers['x-fotohub-signature'])) {
//     res.status(200).send('OK');
//   } else {
//     res.status(401).send('Unauthorized');
//   }
// });
```
```go [Go]
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
)

const webhookSecret = "whsec_your_webhook_secret"

func verifyWebhook(w http.ResponseWriter, r *http.Request) {
	signature := r.Header.Get("X-FOTOhub-Signature")
	if signature == "" {
		http.Error(w, "Missing signature", http.StatusBadRequest)
		return
	}

	body, _ := io.ReadAll(r.Body)
	mac := hmac.New(sha256.New, []byte(webhookSecret))
	mac.Write(body)
	expectedMAC := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(signature), []byte(expectedMAC)) {
		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	w.WriteHeader(http.StatusOK)
}
```
:::

---

## Detailed Error Codes Reference

FOTOhub returns standard HTTP status codes along with a JSON body describing the error in detail.

| HTTP Code | Error Code string | Resolution / Note |
|-----------|-------------------|-------------------|
| `400` | `invalid_parameters` | One or more parameters failed validation. Check `details` array. |
| `401` | `unauthorized` | The API key is missing or invalid. |
| `402` | `insufficient_funds` | Your `wallet.available_usd` balance is too low for the request. |
| `403` | `forbidden_action` | Action not allowed for your workspace tier (e.g. missing 3D features). |
| `404` | `resource_not_found` | Brand kit or Face ID does not exist. |
| `413` | `payload_too_large` | Max payload size exceeded. For example, image file > 20MB. |
| `429` | `rate_limit_exceeded`| Max concurrent jobs reached for your tier. |
| `500` | `internal_server_error` | Unexpected backend error. A `trace_id` will be provided. |
| `503` | `gpu_node_offline` | Scheduled maintenance or temporary unavailability on the required GPU affinity group. |

