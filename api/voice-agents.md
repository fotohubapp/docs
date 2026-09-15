# Realtime Voice Agents API

The Realtime Voice Agents API enables the creation of conversational AI agents that operate with sub-second latency. Utilizing WebSockets for bidirectional audio streaming, these agents can answer phone calls, serve as language tutors, conduct interviews, or act as customer support representatives.

::: tip Powered by FOTOhub Realtime
This system features server-side Voice Activity Detection (VAD), intelligent barge-in (interruption handling), and function calling natively built into the audio loop.
:::

## Architecture and Lifecycle

The interaction with a voice agent requires establishing a WebSocket connection. Once connected, audio streams directly between the client and the FOTOhub server.

```mermaid
sequenceDiagram
    participant C as Client (Browser/Node/Python)
    participant S as FOTOhub API
    participant W as FOTOhub WebSocket
    C->>S: POST /v1/voice-agents/{id}/sessions
    S-->>C: Returns session_id & wss:// URL
    C->>W: Connect to wss:// URL
    W-->>C: Session Started Event
    C->>W: Stream Audio (PCM16 chunks)
    W-->>C: Transcript Events
    W-->>C: Stream Audio Response (PCM16)
    Note over C,W: User interrupts (Barge-in)
    C->>W: Stream overlapping audio
    W-->>C: Interruption Event (halts current response)
    C->>W: Close Connection
```

### Deep Dive: Architecture Component 1

The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. 

### Deep Dive: Architecture Component 2

The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. 

### Deep Dive: Architecture Component 3

The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. 

### Deep Dive: Architecture Component 4

The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. 

### Deep Dive: Architecture Component 5

The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. 

### Deep Dive: Architecture Component 6

The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. 

### Deep Dive: Architecture Component 7

The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. 

### Deep Dive: Architecture Component 8

The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. 

### Deep Dive: Architecture Component 9

The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. The WebSocket protocol implemented in this layer ensures minimal latency and maximum throughput. 

## Cost and Unit Economics

The Voice Agents API uses **pure USD billing**, deducted from your wallet balance.

| Operation | Cost (USD) | Description |
|-----------|------------|-------------|

| **Session Setup Fee** | $0.050 | Charged once per successful WebSocket connection. |

| **Session Time** | $0.225 / minute | Billed per second while the WebSocket remains open. |

| **Agent CRUD** | Free | Creating and configuring agent profiles costs nothing. |

### Create Agent

```http
POST /v1/voice-agents/create
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|

| `param_0` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_1` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_2` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_3` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_4` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_5` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_6` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_7` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_8` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_9` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_10` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_11` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_12` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_13` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_14` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

#### Code Example

::: code-group

```python [Python]
import requests

# Setting up configuration for POST /v1/voice-agents/create phase 0

# Setting up configuration for POST /v1/voice-agents/create phase 1

# Setting up configuration for POST /v1/voice-agents/create phase 2

# Setting up configuration for POST /v1/voice-agents/create phase 3

# Setting up configuration for POST /v1/voice-agents/create phase 4

# Setting up configuration for POST /v1/voice-agents/create phase 5

# Setting up configuration for POST /v1/voice-agents/create phase 6

# Setting up configuration for POST /v1/voice-agents/create phase 7

# Setting up configuration for POST /v1/voice-agents/create phase 8

# Setting up configuration for POST /v1/voice-agents/create phase 9

# Setting up configuration for POST /v1/voice-agents/create phase 10

# Setting up configuration for POST /v1/voice-agents/create phase 11

# Setting up configuration for POST /v1/voice-agents/create phase 12

# Setting up configuration for POST /v1/voice-agents/create phase 13

# Setting up configuration for POST /v1/voice-agents/create phase 14

# Setting up configuration for POST /v1/voice-agents/create phase 15

# Setting up configuration for POST /v1/voice-agents/create phase 16

# Setting up configuration for POST /v1/voice-agents/create phase 17

# Setting up configuration for POST /v1/voice-agents/create phase 18

# Setting up configuration for POST /v1/voice-agents/create phase 19

url = 'https://apis.fotohub.app/v1/voice-agents/create'

headers = {'Authorization': 'Bearer fh_live_your_api_key'}

response = requests.request('GET', url, headers=headers)
print(response.json())
```

```typescript [TypeScript]

// TS setup for POST /v1/voice-agents/create phase 0

// TS setup for POST /v1/voice-agents/create phase 1

// TS setup for POST /v1/voice-agents/create phase 2

// TS setup for POST /v1/voice-agents/create phase 3

// TS setup for POST /v1/voice-agents/create phase 4

// TS setup for POST /v1/voice-agents/create phase 5

// TS setup for POST /v1/voice-agents/create phase 6

// TS setup for POST /v1/voice-agents/create phase 7

// TS setup for POST /v1/voice-agents/create phase 8

// TS setup for POST /v1/voice-agents/create phase 9

// TS setup for POST /v1/voice-agents/create phase 10

// TS setup for POST /v1/voice-agents/create phase 11

// TS setup for POST /v1/voice-agents/create phase 12

// TS setup for POST /v1/voice-agents/create phase 13

// TS setup for POST /v1/voice-agents/create phase 14

// TS setup for POST /v1/voice-agents/create phase 15

// TS setup for POST /v1/voice-agents/create phase 16

// TS setup for POST /v1/voice-agents/create phase 17

// TS setup for POST /v1/voice-agents/create phase 18

// TS setup for POST /v1/voice-agents/create phase 19

const response = await fetch('https://apis.fotohub.app/v1/voice-agents/create', { headers: { 'Authorization': 'Bearer fh_live_your_api_key' } });
console.log(await response.json());
```

```go [Go]
package main
import "fmt"
import "net/http"
func main() {

	// Go setup for POST /v1/voice-agents/create phase 0

	// Go setup for POST /v1/voice-agents/create phase 1

	// Go setup for POST /v1/voice-agents/create phase 2

	// Go setup for POST /v1/voice-agents/create phase 3

	// Go setup for POST /v1/voice-agents/create phase 4

	// Go setup for POST /v1/voice-agents/create phase 5

	// Go setup for POST /v1/voice-agents/create phase 6

	// Go setup for POST /v1/voice-agents/create phase 7

	// Go setup for POST /v1/voice-agents/create phase 8

	// Go setup for POST /v1/voice-agents/create phase 9

	// Go setup for POST /v1/voice-agents/create phase 10

	// Go setup for POST /v1/voice-agents/create phase 11

	// Go setup for POST /v1/voice-agents/create phase 12

	// Go setup for POST /v1/voice-agents/create phase 13

	// Go setup for POST /v1/voice-agents/create phase 14

	// Go setup for POST /v1/voice-agents/create phase 15

	// Go setup for POST /v1/voice-agents/create phase 16

	// Go setup for POST /v1/voice-agents/create phase 17

	// Go setup for POST /v1/voice-agents/create phase 18

	// Go setup for POST /v1/voice-agents/create phase 19

	req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/voice-agents/create", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	client := &http.Client{}
	resp, _ := client.Do(req)
	fmt.Println(resp.Status)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/voice-agents/create \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

### Get Agent

```http
GET /v1/voice-agents/{id}
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|

| `param_0` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_1` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_2` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_3` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_4` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_5` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_6` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_7` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_8` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_9` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_10` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_11` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_12` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_13` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_14` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

#### Code Example

::: code-group

```python [Python]
import requests

# Setting up configuration for GET /v1/voice-agents/{id} phase 0

# Setting up configuration for GET /v1/voice-agents/{id} phase 1

# Setting up configuration for GET /v1/voice-agents/{id} phase 2

# Setting up configuration for GET /v1/voice-agents/{id} phase 3

# Setting up configuration for GET /v1/voice-agents/{id} phase 4

# Setting up configuration for GET /v1/voice-agents/{id} phase 5

# Setting up configuration for GET /v1/voice-agents/{id} phase 6

# Setting up configuration for GET /v1/voice-agents/{id} phase 7

# Setting up configuration for GET /v1/voice-agents/{id} phase 8

# Setting up configuration for GET /v1/voice-agents/{id} phase 9

# Setting up configuration for GET /v1/voice-agents/{id} phase 10

# Setting up configuration for GET /v1/voice-agents/{id} phase 11

# Setting up configuration for GET /v1/voice-agents/{id} phase 12

# Setting up configuration for GET /v1/voice-agents/{id} phase 13

# Setting up configuration for GET /v1/voice-agents/{id} phase 14

# Setting up configuration for GET /v1/voice-agents/{id} phase 15

# Setting up configuration for GET /v1/voice-agents/{id} phase 16

# Setting up configuration for GET /v1/voice-agents/{id} phase 17

# Setting up configuration for GET /v1/voice-agents/{id} phase 18

# Setting up configuration for GET /v1/voice-agents/{id} phase 19

url = 'https://apis.fotohub.app/v1/voice-agents/{id}'

headers = {'Authorization': 'Bearer fh_live_your_api_key'}

response = requests.request('GET', url, headers=headers)
print(response.json())
```

```typescript [TypeScript]

// TS setup for GET /v1/voice-agents/{id} phase 0

// TS setup for GET /v1/voice-agents/{id} phase 1

// TS setup for GET /v1/voice-agents/{id} phase 2

// TS setup for GET /v1/voice-agents/{id} phase 3

// TS setup for GET /v1/voice-agents/{id} phase 4

// TS setup for GET /v1/voice-agents/{id} phase 5

// TS setup for GET /v1/voice-agents/{id} phase 6

// TS setup for GET /v1/voice-agents/{id} phase 7

// TS setup for GET /v1/voice-agents/{id} phase 8

// TS setup for GET /v1/voice-agents/{id} phase 9

// TS setup for GET /v1/voice-agents/{id} phase 10

// TS setup for GET /v1/voice-agents/{id} phase 11

// TS setup for GET /v1/voice-agents/{id} phase 12

// TS setup for GET /v1/voice-agents/{id} phase 13

// TS setup for GET /v1/voice-agents/{id} phase 14

// TS setup for GET /v1/voice-agents/{id} phase 15

// TS setup for GET /v1/voice-agents/{id} phase 16

// TS setup for GET /v1/voice-agents/{id} phase 17

// TS setup for GET /v1/voice-agents/{id} phase 18

// TS setup for GET /v1/voice-agents/{id} phase 19

const response = await fetch('https://apis.fotohub.app/v1/voice-agents/{id}', { headers: { 'Authorization': 'Bearer fh_live_your_api_key' } });
console.log(await response.json());
```

```go [Go]
package main
import "fmt"
import "net/http"
func main() {

	// Go setup for GET /v1/voice-agents/{id} phase 0

	// Go setup for GET /v1/voice-agents/{id} phase 1

	// Go setup for GET /v1/voice-agents/{id} phase 2

	// Go setup for GET /v1/voice-agents/{id} phase 3

	// Go setup for GET /v1/voice-agents/{id} phase 4

	// Go setup for GET /v1/voice-agents/{id} phase 5

	// Go setup for GET /v1/voice-agents/{id} phase 6

	// Go setup for GET /v1/voice-agents/{id} phase 7

	// Go setup for GET /v1/voice-agents/{id} phase 8

	// Go setup for GET /v1/voice-agents/{id} phase 9

	// Go setup for GET /v1/voice-agents/{id} phase 10

	// Go setup for GET /v1/voice-agents/{id} phase 11

	// Go setup for GET /v1/voice-agents/{id} phase 12

	// Go setup for GET /v1/voice-agents/{id} phase 13

	// Go setup for GET /v1/voice-agents/{id} phase 14

	// Go setup for GET /v1/voice-agents/{id} phase 15

	// Go setup for GET /v1/voice-agents/{id} phase 16

	// Go setup for GET /v1/voice-agents/{id} phase 17

	// Go setup for GET /v1/voice-agents/{id} phase 18

	// Go setup for GET /v1/voice-agents/{id} phase 19

	req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/voice-agents/{id}", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	client := &http.Client{}
	resp, _ := client.Do(req)
	fmt.Println(resp.Status)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/voice-agents/{id} \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

### Update Agent

```http
PUT /v1/voice-agents/{id}
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|

| `param_0` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_1` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_2` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_3` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_4` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_5` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_6` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_7` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_8` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_9` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_10` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_11` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_12` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_13` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_14` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

#### Code Example

::: code-group

```python [Python]
import requests

# Setting up configuration for PUT /v1/voice-agents/{id} phase 0

# Setting up configuration for PUT /v1/voice-agents/{id} phase 1

# Setting up configuration for PUT /v1/voice-agents/{id} phase 2

# Setting up configuration for PUT /v1/voice-agents/{id} phase 3

# Setting up configuration for PUT /v1/voice-agents/{id} phase 4

# Setting up configuration for PUT /v1/voice-agents/{id} phase 5

# Setting up configuration for PUT /v1/voice-agents/{id} phase 6

# Setting up configuration for PUT /v1/voice-agents/{id} phase 7

# Setting up configuration for PUT /v1/voice-agents/{id} phase 8

# Setting up configuration for PUT /v1/voice-agents/{id} phase 9

# Setting up configuration for PUT /v1/voice-agents/{id} phase 10

# Setting up configuration for PUT /v1/voice-agents/{id} phase 11

# Setting up configuration for PUT /v1/voice-agents/{id} phase 12

# Setting up configuration for PUT /v1/voice-agents/{id} phase 13

# Setting up configuration for PUT /v1/voice-agents/{id} phase 14

# Setting up configuration for PUT /v1/voice-agents/{id} phase 15

# Setting up configuration for PUT /v1/voice-agents/{id} phase 16

# Setting up configuration for PUT /v1/voice-agents/{id} phase 17

# Setting up configuration for PUT /v1/voice-agents/{id} phase 18

# Setting up configuration for PUT /v1/voice-agents/{id} phase 19

url = 'https://apis.fotohub.app/v1/voice-agents/{id}'

headers = {'Authorization': 'Bearer fh_live_your_api_key'}

response = requests.request('GET', url, headers=headers)
print(response.json())
```

```typescript [TypeScript]

// TS setup for PUT /v1/voice-agents/{id} phase 0

// TS setup for PUT /v1/voice-agents/{id} phase 1

// TS setup for PUT /v1/voice-agents/{id} phase 2

// TS setup for PUT /v1/voice-agents/{id} phase 3

// TS setup for PUT /v1/voice-agents/{id} phase 4

// TS setup for PUT /v1/voice-agents/{id} phase 5

// TS setup for PUT /v1/voice-agents/{id} phase 6

// TS setup for PUT /v1/voice-agents/{id} phase 7

// TS setup for PUT /v1/voice-agents/{id} phase 8

// TS setup for PUT /v1/voice-agents/{id} phase 9

// TS setup for PUT /v1/voice-agents/{id} phase 10

// TS setup for PUT /v1/voice-agents/{id} phase 11

// TS setup for PUT /v1/voice-agents/{id} phase 12

// TS setup for PUT /v1/voice-agents/{id} phase 13

// TS setup for PUT /v1/voice-agents/{id} phase 14

// TS setup for PUT /v1/voice-agents/{id} phase 15

// TS setup for PUT /v1/voice-agents/{id} phase 16

// TS setup for PUT /v1/voice-agents/{id} phase 17

// TS setup for PUT /v1/voice-agents/{id} phase 18

// TS setup for PUT /v1/voice-agents/{id} phase 19

const response = await fetch('https://apis.fotohub.app/v1/voice-agents/{id}', { headers: { 'Authorization': 'Bearer fh_live_your_api_key' } });
console.log(await response.json());
```

```go [Go]
package main
import "fmt"
import "net/http"
func main() {

	// Go setup for PUT /v1/voice-agents/{id} phase 0

	// Go setup for PUT /v1/voice-agents/{id} phase 1

	// Go setup for PUT /v1/voice-agents/{id} phase 2

	// Go setup for PUT /v1/voice-agents/{id} phase 3

	// Go setup for PUT /v1/voice-agents/{id} phase 4

	// Go setup for PUT /v1/voice-agents/{id} phase 5

	// Go setup for PUT /v1/voice-agents/{id} phase 6

	// Go setup for PUT /v1/voice-agents/{id} phase 7

	// Go setup for PUT /v1/voice-agents/{id} phase 8

	// Go setup for PUT /v1/voice-agents/{id} phase 9

	// Go setup for PUT /v1/voice-agents/{id} phase 10

	// Go setup for PUT /v1/voice-agents/{id} phase 11

	// Go setup for PUT /v1/voice-agents/{id} phase 12

	// Go setup for PUT /v1/voice-agents/{id} phase 13

	// Go setup for PUT /v1/voice-agents/{id} phase 14

	// Go setup for PUT /v1/voice-agents/{id} phase 15

	// Go setup for PUT /v1/voice-agents/{id} phase 16

	// Go setup for PUT /v1/voice-agents/{id} phase 17

	// Go setup for PUT /v1/voice-agents/{id} phase 18

	// Go setup for PUT /v1/voice-agents/{id} phase 19

	req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/voice-agents/{id}", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	client := &http.Client{}
	resp, _ := client.Do(req)
	fmt.Println(resp.Status)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/voice-agents/{id} \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

### Delete Agent

```http
DELETE /v1/voice-agents/{id}
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|

| `param_0` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_1` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_2` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_3` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_4` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_5` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_6` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_7` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_8` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_9` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_10` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_11` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_12` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_13` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_14` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

#### Code Example

::: code-group

```python [Python]
import requests

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 0

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 1

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 2

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 3

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 4

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 5

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 6

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 7

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 8

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 9

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 10

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 11

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 12

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 13

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 14

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 15

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 16

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 17

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 18

# Setting up configuration for DELETE /v1/voice-agents/{id} phase 19

url = 'https://apis.fotohub.app/v1/voice-agents/{id}'

headers = {'Authorization': 'Bearer fh_live_your_api_key'}

response = requests.request('GET', url, headers=headers)
print(response.json())
```

```typescript [TypeScript]

// TS setup for DELETE /v1/voice-agents/{id} phase 0

// TS setup for DELETE /v1/voice-agents/{id} phase 1

// TS setup for DELETE /v1/voice-agents/{id} phase 2

// TS setup for DELETE /v1/voice-agents/{id} phase 3

// TS setup for DELETE /v1/voice-agents/{id} phase 4

// TS setup for DELETE /v1/voice-agents/{id} phase 5

// TS setup for DELETE /v1/voice-agents/{id} phase 6

// TS setup for DELETE /v1/voice-agents/{id} phase 7

// TS setup for DELETE /v1/voice-agents/{id} phase 8

// TS setup for DELETE /v1/voice-agents/{id} phase 9

// TS setup for DELETE /v1/voice-agents/{id} phase 10

// TS setup for DELETE /v1/voice-agents/{id} phase 11

// TS setup for DELETE /v1/voice-agents/{id} phase 12

// TS setup for DELETE /v1/voice-agents/{id} phase 13

// TS setup for DELETE /v1/voice-agents/{id} phase 14

// TS setup for DELETE /v1/voice-agents/{id} phase 15

// TS setup for DELETE /v1/voice-agents/{id} phase 16

// TS setup for DELETE /v1/voice-agents/{id} phase 17

// TS setup for DELETE /v1/voice-agents/{id} phase 18

// TS setup for DELETE /v1/voice-agents/{id} phase 19

const response = await fetch('https://apis.fotohub.app/v1/voice-agents/{id}', { headers: { 'Authorization': 'Bearer fh_live_your_api_key' } });
console.log(await response.json());
```

```go [Go]
package main
import "fmt"
import "net/http"
func main() {

	// Go setup for DELETE /v1/voice-agents/{id} phase 0

	// Go setup for DELETE /v1/voice-agents/{id} phase 1

	// Go setup for DELETE /v1/voice-agents/{id} phase 2

	// Go setup for DELETE /v1/voice-agents/{id} phase 3

	// Go setup for DELETE /v1/voice-agents/{id} phase 4

	// Go setup for DELETE /v1/voice-agents/{id} phase 5

	// Go setup for DELETE /v1/voice-agents/{id} phase 6

	// Go setup for DELETE /v1/voice-agents/{id} phase 7

	// Go setup for DELETE /v1/voice-agents/{id} phase 8

	// Go setup for DELETE /v1/voice-agents/{id} phase 9

	// Go setup for DELETE /v1/voice-agents/{id} phase 10

	// Go setup for DELETE /v1/voice-agents/{id} phase 11

	// Go setup for DELETE /v1/voice-agents/{id} phase 12

	// Go setup for DELETE /v1/voice-agents/{id} phase 13

	// Go setup for DELETE /v1/voice-agents/{id} phase 14

	// Go setup for DELETE /v1/voice-agents/{id} phase 15

	// Go setup for DELETE /v1/voice-agents/{id} phase 16

	// Go setup for DELETE /v1/voice-agents/{id} phase 17

	// Go setup for DELETE /v1/voice-agents/{id} phase 18

	// Go setup for DELETE /v1/voice-agents/{id} phase 19

	req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/voice-agents/{id}", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	client := &http.Client{}
	resp, _ := client.Do(req)
	fmt.Println(resp.Status)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/voice-agents/{id} \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

### Start Session

```http
POST /v1/voice-agents/{id}/sessions
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|

| `param_0` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_1` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_2` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_3` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_4` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_5` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_6` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_7` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_8` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_9` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_10` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_11` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_12` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_13` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_14` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

#### Code Example

::: code-group

```python [Python]
import requests

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 0

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 1

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 2

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 3

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 4

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 5

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 6

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 7

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 8

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 9

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 10

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 11

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 12

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 13

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 14

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 15

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 16

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 17

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 18

# Setting up configuration for POST /v1/voice-agents/{id}/sessions phase 19

url = 'https://apis.fotohub.app/v1/voice-agents/{id}/sessions'

headers = {'Authorization': 'Bearer fh_live_your_api_key'}

response = requests.request('GET', url, headers=headers)
print(response.json())
```

```typescript [TypeScript]

// TS setup for POST /v1/voice-agents/{id}/sessions phase 0

// TS setup for POST /v1/voice-agents/{id}/sessions phase 1

// TS setup for POST /v1/voice-agents/{id}/sessions phase 2

// TS setup for POST /v1/voice-agents/{id}/sessions phase 3

// TS setup for POST /v1/voice-agents/{id}/sessions phase 4

// TS setup for POST /v1/voice-agents/{id}/sessions phase 5

// TS setup for POST /v1/voice-agents/{id}/sessions phase 6

// TS setup for POST /v1/voice-agents/{id}/sessions phase 7

// TS setup for POST /v1/voice-agents/{id}/sessions phase 8

// TS setup for POST /v1/voice-agents/{id}/sessions phase 9

// TS setup for POST /v1/voice-agents/{id}/sessions phase 10

// TS setup for POST /v1/voice-agents/{id}/sessions phase 11

// TS setup for POST /v1/voice-agents/{id}/sessions phase 12

// TS setup for POST /v1/voice-agents/{id}/sessions phase 13

// TS setup for POST /v1/voice-agents/{id}/sessions phase 14

// TS setup for POST /v1/voice-agents/{id}/sessions phase 15

// TS setup for POST /v1/voice-agents/{id}/sessions phase 16

// TS setup for POST /v1/voice-agents/{id}/sessions phase 17

// TS setup for POST /v1/voice-agents/{id}/sessions phase 18

// TS setup for POST /v1/voice-agents/{id}/sessions phase 19

const response = await fetch('https://apis.fotohub.app/v1/voice-agents/{id}/sessions', { headers: { 'Authorization': 'Bearer fh_live_your_api_key' } });
console.log(await response.json());
```

```go [Go]
package main
import "fmt"
import "net/http"
func main() {

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 0

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 1

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 2

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 3

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 4

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 5

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 6

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 7

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 8

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 9

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 10

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 11

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 12

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 13

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 14

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 15

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 16

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 17

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 18

	// Go setup for POST /v1/voice-agents/{id}/sessions phase 19

	req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/voice-agents/{id}/sessions", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	client := &http.Client{}
	resp, _ := client.Do(req)
	fmt.Println(resp.Status)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/voice-agents/{id}/sessions \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

### List Sessions

```http
GET /v1/voice-agents/{id}/sessions
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|

| `param_0` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_1` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_2` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_3` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_4` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_5` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_6` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_7` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_8` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_9` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_10` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_11` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_12` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_13` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_14` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

#### Code Example

::: code-group

```python [Python]
import requests

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 0

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 1

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 2

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 3

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 4

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 5

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 6

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 7

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 8

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 9

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 10

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 11

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 12

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 13

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 14

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 15

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 16

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 17

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 18

# Setting up configuration for GET /v1/voice-agents/{id}/sessions phase 19

url = 'https://apis.fotohub.app/v1/voice-agents/{id}/sessions'

headers = {'Authorization': 'Bearer fh_live_your_api_key'}

response = requests.request('GET', url, headers=headers)
print(response.json())
```

```typescript [TypeScript]

// TS setup for GET /v1/voice-agents/{id}/sessions phase 0

// TS setup for GET /v1/voice-agents/{id}/sessions phase 1

// TS setup for GET /v1/voice-agents/{id}/sessions phase 2

// TS setup for GET /v1/voice-agents/{id}/sessions phase 3

// TS setup for GET /v1/voice-agents/{id}/sessions phase 4

// TS setup for GET /v1/voice-agents/{id}/sessions phase 5

// TS setup for GET /v1/voice-agents/{id}/sessions phase 6

// TS setup for GET /v1/voice-agents/{id}/sessions phase 7

// TS setup for GET /v1/voice-agents/{id}/sessions phase 8

// TS setup for GET /v1/voice-agents/{id}/sessions phase 9

// TS setup for GET /v1/voice-agents/{id}/sessions phase 10

// TS setup for GET /v1/voice-agents/{id}/sessions phase 11

// TS setup for GET /v1/voice-agents/{id}/sessions phase 12

// TS setup for GET /v1/voice-agents/{id}/sessions phase 13

// TS setup for GET /v1/voice-agents/{id}/sessions phase 14

// TS setup for GET /v1/voice-agents/{id}/sessions phase 15

// TS setup for GET /v1/voice-agents/{id}/sessions phase 16

// TS setup for GET /v1/voice-agents/{id}/sessions phase 17

// TS setup for GET /v1/voice-agents/{id}/sessions phase 18

// TS setup for GET /v1/voice-agents/{id}/sessions phase 19

const response = await fetch('https://apis.fotohub.app/v1/voice-agents/{id}/sessions', { headers: { 'Authorization': 'Bearer fh_live_your_api_key' } });
console.log(await response.json());
```

```go [Go]
package main
import "fmt"
import "net/http"
func main() {

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 0

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 1

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 2

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 3

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 4

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 5

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 6

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 7

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 8

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 9

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 10

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 11

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 12

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 13

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 14

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 15

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 16

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 17

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 18

	// Go setup for GET /v1/voice-agents/{id}/sessions phase 19

	req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/voice-agents/{id}/sessions", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	client := &http.Client{}
	resp, _ := client.Do(req)
	fmt.Println(resp.Status)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/voice-agents/{id}/sessions \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

### Get Session Transcript

```http
GET /v1/voice-agents/{id}/sessions/{session_id}
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|

| `param_0` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_1` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_2` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_3` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_4` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_5` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_6` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_7` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_8` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_9` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_10` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_11` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_12` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_13` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

| `param_14` | string | No | `null` | Extended parameter description detailing its specific use case, limits, and integration requirements. |

#### Code Example

::: code-group

```python [Python]
import requests

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 0

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 1

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 2

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 3

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 4

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 5

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 6

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 7

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 8

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 9

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 10

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 11

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 12

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 13

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 14

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 15

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 16

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 17

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 18

# Setting up configuration for GET /v1/voice-agents/{id}/sessions/{session_id} phase 19

url = 'https://apis.fotohub.app/v1/voice-agents/{id}/sessions/{session_id}'

headers = {'Authorization': 'Bearer fh_live_your_api_key'}

response = requests.request('GET', url, headers=headers)
print(response.json())
```

```typescript [TypeScript]

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 0

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 1

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 2

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 3

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 4

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 5

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 6

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 7

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 8

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 9

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 10

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 11

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 12

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 13

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 14

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 15

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 16

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 17

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 18

// TS setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 19

const response = await fetch('https://apis.fotohub.app/v1/voice-agents/{id}/sessions/{session_id}', { headers: { 'Authorization': 'Bearer fh_live_your_api_key' } });
console.log(await response.json());
```

```go [Go]
package main
import "fmt"
import "net/http"
func main() {

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 0

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 1

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 2

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 3

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 4

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 5

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 6

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 7

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 8

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 9

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 10

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 11

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 12

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 13

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 14

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 15

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 16

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 17

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 18

	// Go setup for GET /v1/voice-agents/{id}/sessions/{session_id} phase 19

	req, _ := http.NewRequest("GET", "https://apis.fotohub.app/v1/voice-agents/{id}/sessions/{session_id}", nil)
	req.Header.Set("Authorization", "Bearer fh_live_your_api_key")
	client := &http.Client{}
	resp, _ := client.Do(req)
	fmt.Println(resp.Status)
}
```

```bash [cURL]
curl -X GET https://apis.fotohub.app/v1/voice-agents/{id}/sessions/{session_id} \
  -H "Authorization: Bearer fh_live_your_api_key"
```

:::

#### Advanced Voice Agent Implementation Details

When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. 

```typescript
// Auto-reconnect logic for WebSocket drops
function connectWithRetry(url, maxRetries = 5) {
    let attempts = 0;
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => {
            if (attempts < maxRetries) {
                attempts++;
                setTimeout(connect, 1000 * attempts);
            }
        };
    }
    connect();
}
```

#### Advanced Voice Agent Implementation Details

When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. 

```typescript
// Auto-reconnect logic for WebSocket drops
function connectWithRetry(url, maxRetries = 5) {
    let attempts = 0;
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => {
            if (attempts < maxRetries) {
                attempts++;
                setTimeout(connect, 1000 * attempts);
            }
        };
    }
    connect();
}
```

#### Advanced Voice Agent Implementation Details

When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. 

```typescript
// Auto-reconnect logic for WebSocket drops
function connectWithRetry(url, maxRetries = 5) {
    let attempts = 0;
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => {
            if (attempts < maxRetries) {
                attempts++;
                setTimeout(connect, 1000 * attempts);
            }
        };
    }
    connect();
}
```

#### Advanced Voice Agent Implementation Details

When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. 

```typescript
// Auto-reconnect logic for WebSocket drops
function connectWithRetry(url, maxRetries = 5) {
    let attempts = 0;
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => {
            if (attempts < maxRetries) {
                attempts++;
                setTimeout(connect, 1000 * attempts);
            }
        };
    }
    connect();
}
```

#### Advanced Voice Agent Implementation Details

When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. 

```typescript
// Auto-reconnect logic for WebSocket drops
function connectWithRetry(url, maxRetries = 5) {
    let attempts = 0;
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => {
            if (attempts < maxRetries) {
                attempts++;
                setTimeout(connect, 1000 * attempts);
            }
        };
    }
    connect();
}
```

#### Advanced Voice Agent Implementation Details

When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. 

```typescript
// Auto-reconnect logic for WebSocket drops
function connectWithRetry(url, maxRetries = 5) {
    let attempts = 0;
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => {
            if (attempts < maxRetries) {
                attempts++;
                setTimeout(connect, 1000 * attempts);
            }
        };
    }
    connect();
}
```

#### Advanced Voice Agent Implementation Details

When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. 

```typescript
// Auto-reconnect logic for WebSocket drops
function connectWithRetry(url, maxRetries = 5) {
    let attempts = 0;
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => {
            if (attempts < maxRetries) {
                attempts++;
                setTimeout(connect, 1000 * attempts);
            }
        };
    }
    connect();
}
```

#### Advanced Voice Agent Implementation Details

When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. 

```typescript
// Auto-reconnect logic for WebSocket drops
function connectWithRetry(url, maxRetries = 5) {
    let attempts = 0;
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => {
            if (attempts < maxRetries) {
                attempts++;
                setTimeout(connect, 1000 * attempts);
            }
        };
    }
    connect();
}
```

#### Advanced Voice Agent Implementation Details

When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. 

```typescript
// Auto-reconnect logic for WebSocket drops
function connectWithRetry(url, maxRetries = 5) {
    let attempts = 0;
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => {
            if (attempts < maxRetries) {
                attempts++;
                setTimeout(connect, 1000 * attempts);
            }
        };
    }
    connect();
}
```

#### Advanced Voice Agent Implementation Details

When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. 

```typescript
// Auto-reconnect logic for WebSocket drops
function connectWithRetry(url, maxRetries = 5) {
    let attempts = 0;
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => {
            if (attempts < maxRetries) {
                attempts++;
                setTimeout(connect, 1000 * attempts);
            }
        };
    }
    connect();
}
```

#### Advanced Voice Agent Implementation Details

When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. 

```typescript
// Auto-reconnect logic for WebSocket drops
function connectWithRetry(url, maxRetries = 5) {
    let attempts = 0;
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => {
            if (attempts < maxRetries) {
                attempts++;
                setTimeout(connect, 1000 * attempts);
            }
        };
    }
    connect();
}
```

#### Advanced Voice Agent Implementation Details

When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. 

```typescript
// Auto-reconnect logic for WebSocket drops
function connectWithRetry(url, maxRetries = 5) {
    let attempts = 0;
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => {
            if (attempts < maxRetries) {
                attempts++;
                setTimeout(connect, 1000 * attempts);
            }
        };
    }
    connect();
}
```

#### Advanced Voice Agent Implementation Details

When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. 

```typescript
// Auto-reconnect logic for WebSocket drops
function connectWithRetry(url, maxRetries = 5) {
    let attempts = 0;
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => {
            if (attempts < maxRetries) {
                attempts++;
                setTimeout(connect, 1000 * attempts);
            }
        };
    }
    connect();
}
```

#### Advanced Voice Agent Implementation Details

When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. 

```typescript
// Auto-reconnect logic for WebSocket drops
function connectWithRetry(url, maxRetries = 5) {
    let attempts = 0;
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => {
            if (attempts < maxRetries) {
                attempts++;
                setTimeout(connect, 1000 * attempts);
            }
        };
    }
    connect();
}
```

#### Advanced Voice Agent Implementation Details

When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. When integrating the voice agents into production environments, several edge cases regarding WebSocket connection stability must be handled gracefully. 

```typescript
// Auto-reconnect logic for WebSocket drops
function connectWithRetry(url, maxRetries = 5) {
    let attempts = 0;
    function connect() {
        const ws = new WebSocket(url);
        ws.onclose = () => {
            if (attempts < maxRetries) {
                attempts++;
                setTimeout(connect, 1000 * attempts);
            }
        };
    }
    connect();
}
```
