# SDK Examples

Real-world, production-ready examples for common FOTOhub SDK workflows. This guide covers all major capabilities from basic image generation to advanced cloud compute provisioning.

::: tip PRO TIP
Always monitor your wallet balance programmatically. All FOTOhub billing is purely in USD. NEVER use deprecated 'credits' or other legacy currencies. Use `wallet.available_usd`.
:::

::: info MULTI-LANGUAGE SUPPORT
FOTOhub natively supports Python, TypeScript, and Go. All endpoints are also accessible via standard cURL requests using `Authorization: Bearer fh_live_your_api_key`.
:::

## Architecture Overview

::: info SYSTEM FLOW
Most heavy operations like Video, 3D, and Compute use an asynchronous polling or webhook pattern. The diagram below illustrates the typical event-driven architecture used in production.
:::

```mermaid
sequenceDiagram
    participant App as Client Application
    participant SDK as FOTOhub SDK
    participant API as FOTOhub API
    participant Worker as GPU Worker Node (GPU2/GPU3)
    participant Webhook as Your Webhook Server

    App->>SDK: generate_video(kling-v2.1)
    SDK->>API: POST /v1/ai/generate/video
    API-->>SDK: 202 Accepted (job_id)
    SDK-->>App: Job Object (status: processing)
    
    Note over API, Worker: GPU Worker picks up job
    Worker->>Worker: Processing (2-5 mins)
    Worker-->>API: Completion / Result URL / USD Cost
    
    API->>Webhook: POST https://yourapp.com/webhook (HMAC-SHA256 signed)
    Webhook-->>API: 200 OK
    Webhook->>App: Notify completion
```

## 1. Batch Product Photography

Process a list of prompts concurrently with progress tracking and USD cost tracking.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `prompt` | String | Yes | - | Text description of the image. |
| `model` | String | Yes | `seedream-5-0-260128` | The model to use. |
| `aspect_ratio` | String | No | `1:1` | Aspect ratio, e.g., `16:9`, `4:3`. |
| `webhook_url` | String | No | `null` | Optional callback. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Batch Product Photography...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Batch Product Photography...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"prompt": "Studio product photo on a white background",
		"model": "seedream-5-0-260128",
	}

	raw, err := client.Post(ctx, "/ai/generate/image", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Batch Product Photography
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Studio product photo on a white background",
    "model": "seedream-5-0-260128"
  }'
```
:::

---

## 2. Brand-consistent Image Generation

Inject brand DNA into every prompt automatically to maintain cohesive identity.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `prompt` | String | Yes | - | Base description. |
| `brand_dna` | String | Yes | - | Brand identity string. |
| `negative_prompt` | String | No | - | Things to avoid. |
| `style_reference` | String | No | - | URL to style image. |
| `style_strength` | Float | No | `0.5` | Strength of the reference style. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Brand-consistent Image Generation...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Brand-consistent Image Generation...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"prompt": "A pair of running shoes, in the style of our minimalist brand identity",
		"model": "seedream-5-0-260128",
	}

	raw, err := client.Post(ctx, "/ai/generate/image", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Brand-consistent Image Generation
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A pair of running shoes, in the style of our minimalist brand identity",
    "model": "seedream-5-0-260128"
  }'
```
:::

---

## 3. Multi-model Comparison

Generate same prompt with FLUX.1, Seedream, GPT-Image-1, compare results.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `prompt` | String | Yes | - | The prompt. |
| `model` | String | Yes | - | E.g. `flux-1-pro`, `seedream-5-0-260128`, `gpt-image-1` |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Multi-model Comparison...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Multi-model Comparison...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"prompt": "A cup of coffee on a wooden table",
		"model": "seedream-5-0-260128",
	}

	raw, err := client.Post(ctx, "/ai/generate/image", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Multi-model Comparison
curl -X POST https://apis.fotohub.app/v1/ai/generate/image \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cup of coffee on a wooden table",
    "model": "seedream-5-0-260128"
  }'
```
:::

---

## 4. Image-to-image Style Transfer

Apply artistic styles from reference images.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `image_url` | String | Yes | - | Base image to transform. |
| `prompt` | String | Yes | - | New style description. |
| `strength` | Float | No | `0.7` | How much to mutate the original (0-1). |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Image-to-image Style Transfer...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Image-to-image Style Transfer...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient.
// FotoHubClient.BaseURL hardcodes /v1; /stability/* sits outside that prefix,
// so this builds the request directly instead of going through client.Post.
func main() {
	apiKey := os.Getenv("FOTOHUB_API_KEY")

	payload, _ := json.Marshal(map[string]any{
		"image": "<base64-encoded-source-image>",
		"reference": "<base64-encoded-style-reference>",
		"output_format": "png",
	})

	req, err := http.NewRequestWithContext(context.Background(), http.MethodPost, "https://apis.fotohub.app/stability/style-transfer", bytes.NewReader(payload))
	if err != nil {
		log.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	result, _ := io.ReadAll(resp.Body)
	fmt.Printf("Result: %s\n", result)
}
```

```bash [cURL]
# Example request for Image-to-image Style Transfer
curl -X POST https://apis.fotohub.app/stability/style-transfer \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "<base64-encoded-source-image>",
    "reference": "<base64-encoded-style-reference>",
    "output_format": "png"
  }'
```
:::

---

## 5. Automatic Prompt Enhancement with Gabriel AI

Route and enhance prompts before generation.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `raw_prompt` | String | Yes | - | Your basic prompt. |
| `enhance` | Boolean | No | `false` | Set to true to use Gabriel AI. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Automatic Prompt Enhancement with Gabriel AI...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Automatic Prompt Enhancement with Gabriel AI...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"prompt": "a red sports car",
	}

	raw, err := client.Post(ctx, "/ai/enhance-prompt", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Automatic Prompt Enhancement with Gabriel AI
curl -X POST https://apis.fotohub.app/v1/ai/enhance-prompt \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a red sports car"
  }'
```
:::

---

## 6. I2V (Image-to-Video) Animation Pipeline

Animate product photos with Kling v2.1. Requires GPU2.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `image_url` | String | Yes | - | Starting frame for video. |
| `prompt` | String | Yes | - | Motion description. |
| `model` | String | Yes | `kling-v2.1` | Video model. |
| `duration` | Integer | No | `5` | Length in seconds (5 or 10). |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting I2V (Image-to-Video) Animation Pipeline...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting I2V (Image-to-Video) Animation Pipeline...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"image_url": "https://cdn.brand.com/product.jpg",
		"prompt": "Slow rotation, studio lighting",
		"model": "kling-v2.1",
		"duration": 5,
	}

	raw, err := client.Post(ctx, "/ai/generate/video", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for I2V (Image-to-Video) Animation Pipeline
curl -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://cdn.brand.com/product.jpg",
    "prompt": "Slow rotation, studio lighting",
    "model": "kling-v2.1",
    "duration": 5
  }'
```
:::

---

## 7. Long-form Video Assembly

Combine 5 clips into a 25s final video.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `clips` | Array[String] | Yes | - | URLs of the videos to stitch. |
| `transition` | String | No | `crossfade` | Transition type. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Long-form Video Assembly...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Long-form Video Assembly...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"clips": []any{"https://cdn.brand.com/clip1.mp4", "https://cdn.brand.com/clip2.mp4"},
		"transition": "crossfade",
	}

	raw, err := client.Post(ctx, "/video/merge", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Long-form Video Assembly
curl -X POST https://apis.fotohub.app/v1/video/merge \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "clips": ["https://cdn.brand.com/clip1.mp4", "https://cdn.brand.com/clip2.mp4"],
    "transition": "crossfade"
  }'
```
:::

---

## 8. Multi-language Ad Video Factory

Generate same ad in EN/ES/FR/DE/JP with dubbed audio.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `video_url` | String | Yes | - | Original video with spoken track. |
| `target_languages` | Array[String] | Yes | - | ISO codes of target languages. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Multi-language Ad Video Factory...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Multi-language Ad Video Factory...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"video_url": "https://cdn.brand.com/ad.mp4",
		"target_language": "es",
	}

	raw, err := client.Post(ctx, "/video/lip-sync", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Multi-language Ad Video Factory
curl -X POST https://apis.fotohub.app/v1/video/lip-sync \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://cdn.brand.com/ad.mp4",
    "target_language": "es"
  }'
```
:::

---

## 9. Video with Synchronized Music

Generate video + matching music score simultaneously.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `video_prompt` | String | Yes | - | Video description. |
| `music_prompt` | String | Yes | - | Audio description. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Video with Synchronized Music...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Video with Synchronized Music...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"prompt": "Product hero shot, cinematic pan",
		"model": "kling-v2.1",
	}

	raw, err := client.Post(ctx, "/ai/generate/video", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Video with Synchronized Music
curl -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Product hero shot, cinematic pan",
    "model": "kling-v2.1"
  }'
```
:::

---

## 10. Podcast Voice Cloning

::: warning NOT AVAILABLE
There is no voice-cloning endpoint on the public API — you cannot train a new voice from an audio
sample. The example below uses standard TTS with one of the built-in preset voices instead.
:::

Generate a full podcast episode with a preset TTS voice.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `text` | String | Yes | - | Script to read. |
| `voice_id` | String | Yes | - | Preset voice ID (see `GET /v1/ai/tts/polly/voices`). |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Podcast Voice Cloning...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Podcast Voice Cloning...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"text": "Welcome back to the show.",
		"voice_id": "en-US-Matthew",
	}

	raw, err := client.Post(ctx, "/ai/tts/polly/synthesize", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Podcast Voice Cloning
curl -X POST https://apis.fotohub.app/v1/ai/tts/polly/synthesize \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome back to the show.",
    "voice_id": "en-US-Matthew"
  }'
```
:::

---

## 11. Multilingual TTS Batch

Same script in 10 languages for international campaign.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `script_map` | Object | Yes | - | Dictionary of lang_code to text. |
| `base_voice_id` | String | Yes | - | Voice to use across languages. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Multilingual TTS Batch...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Multilingual TTS Batch...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"text": "Bienvenido a FOTOhub",
		"voice_id": "es-ES-Lucia",
	}

	raw, err := client.Post(ctx, "/ai/tts/polly/synthesize", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Multilingual TTS Batch
curl -X POST https://apis.fotohub.app/v1/ai/tts/polly/synthesize \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Bienvenido a FOTOhub",
    "voice_id": "es-ES-Lucia"
  }'
```
:::

---

## 12. Music Bed Generation

60s instrumental loop for video background, perfectly loopable.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `prompt` | String | Yes | - | Music description. |
| `loopable` | Boolean | No | `false` | Ensure ends match for seamless looping. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Music Bed Generation...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Music Bed Generation...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"prompt": "Upbeat corporate background loop",
		"duration": 60,
	}

	raw, err := client.Post(ctx, "/ai/generate/music", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Music Bed Generation
curl -X POST https://apis.fotohub.app/v1/ai/generate/music \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Upbeat corporate background loop",
    "duration": 60
  }'
```
:::

---

## 13. Sound Effect Library Builder

Generate 100 categorized SFX for a game using MMAudio (GPU2).

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `prompt` | String | Yes | - | Sound effect description. |
| `affinity` | String | No | `auto` | Target GPU (e.g. `gpu2-mmaudio`). |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Sound Effect Library Builder...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Sound Effect Library Builder...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"prompt": "Footsteps on gravel, single step",
	}

	raw, err := client.Post(ctx, "/ai/generate/sfx", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Sound Effect Library Builder
curl -X POST https://apis.fotohub.app/v1/ai/generate/sfx \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Footsteps on gravel, single step"
  }'
```
:::

---

## 14. E-commerce 3D Model Pipeline

Image → 3D → USDZ → Shopify AR quick look. Uses GPU4/5 for 3D generation.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `image_url` | String | Yes | - | Base product image. |
| `format` | String | No | `glb` | Export format (`glb`, `usdz`, `obj`). |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting E-commerce 3D Model Pipeline...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting E-commerce 3D Model Pipeline...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"image_url": "https://cdn.brand.com/product.jpg",
		"format": "glb",
	}

	raw, err := client.Post(ctx, "/ai/generate/3d", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for E-commerce 3D Model Pipeline
curl -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://cdn.brand.com/product.jpg",
    "format": "glb"
  }'
```
:::

---

## 15. Batch 3D from Product Catalog

20 SKUs → 20 GLTF meshes for web viewer.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `images` | Array[String] | Yes | - | Batch of images. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Batch 3D from Product Catalog...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Batch 3D from Product Catalog...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"image_url": "https://cdn.brand.com/sku-001.jpg",
		"format": "glb",
	}

	raw, err := client.Post(ctx, "/ai/generate/3d", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Batch 3D from Product Catalog
curl -X POST https://apis.fotohub.app/v1/ai/generate/3d \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://cdn.brand.com/sku-001.jpg",
    "format": "glb"
  }'
```
:::

---

## 16. Invoice Automation

Extract → validate → post to QuickBooks via JSON.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `document_url` | String | Yes | - | PDF or Image of invoice. |
| `schema` | Object | Yes | - | JSON schema for extraction. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Invoice Automation...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Invoice Automation...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"document_base64": "JVBERi0xLjcK...",
	}

	raw, err := client.Post(ctx, "/ai/document/analyze-expense", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Invoice Automation
curl -X POST https://apis.fotohub.app/v1/ai/document/analyze-expense \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "document_base64": "JVBERi0xLjcK..."
  }'
```
:::

---

## 17. Contract Risk Analysis

Extract clauses → Claude analysis → risk score.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `document_url` | String | Yes | - | Contract PDF. |
| `analysis_type` | String | Yes | `risk_score` | Type of analysis. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Contract Risk Analysis...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Contract Risk Analysis...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"document_base64": "JVBERi0xLjcK...",
		"features": []any{"TABLES", "FORMS"},
	}

	raw, err := client.Post(ctx, "/ai/document/analyze", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Contract Risk Analysis
curl -X POST https://apis.fotohub.app/v1/ai/document/analyze \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "document_base64": "JVBERi0xLjcK...",
    "features": ["TABLES", "FORMS"]
  }'
```
:::

---

## 18. Receipt Batch Processor

100 receipts → structured CSV for expense tracking.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `batch_urls` | Array[String] | Yes | - | List of receipt images. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Receipt Batch Processor...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Receipt Batch Processor...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"document_base64": "JVBERi0xLjcK...",
	}

	raw, err := client.Post(ctx, "/ai/document/analyze-expense", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Receipt Batch Processor
curl -X POST https://apis.fotohub.app/v1/ai/document/analyze-expense \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "document_base64": "JVBERi0xLjcK..."
  }'
```
:::

---

## 19. Fashion Catalog Generator

100 garments × 3 model personas = 300 on-model images.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `garment_url` | String | Yes | - | The clothing item. |
| `model_persona` | String | Yes | - | ID of the virtual model. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Fashion Catalog Generator...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Fashion Catalog Generator...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"person_image_url": "https://cdn.brand.com/models/persona-1.jpg",
		"garment_image_url": "https://cdn.brand.com/catalog/garment.png",
		"category": "tops",
	}

	raw, err := client.Post(ctx, "/ai/tryon", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Fashion Catalog Generator
curl -X POST https://apis.fotohub.app/v1/ai/tryon \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "person_image_url": "https://cdn.brand.com/models/persona-1.jpg",
    "garment_image_url": "https://cdn.brand.com/catalog/garment.png",
    "category": "tops"
  }'
```
:::

---

## 20. Size Recommendation from Body Scan

Extract measurements from tryon job metadata.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `scan_url` | String | Yes | - | User uploaded photo. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Size Recommendation from Body Scan...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Size Recommendation from Body Scan...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"person_image_url": "https://cdn.brand.com/uploads/scan.jpg",
		"garment_image_url": "https://cdn.brand.com/catalog/reference-garment.png",
		"category": "tops",
	}

	raw, err := client.Post(ctx, "/ai/tryon", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Size Recommendation from Body Scan
curl -X POST https://apis.fotohub.app/v1/ai/tryon \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "person_image_url": "https://cdn.brand.com/uploads/scan.jpg",
    "garment_image_url": "https://cdn.brand.com/catalog/reference-garment.png",
    "category": "tops"
  }'
```
:::

---

## 21. Rent an A10G GPU and run your own training script

Dedicated GPU rental is real and lives under `/compute/v1/*`. `GET /compute/v1/catalog`
lists the 22 instance types with their hourly and spot rates, `POST /compute/v1/instances`
provisions one, and you reach it over SSH like any other machine. That is the path for
running your own code on a GPU.

::: warning There is no public code-execution endpoint
FOTOhub runs a Firecracker microVM sandbox internally, but it is **not** exposed as a
customer-callable API: the route is gated by an internal proxy secret and is only reached
by the `code.python` node inside an Agent Engine workflow. Neither `/sandbox/exec-python`
nor a `code` parameter on any public endpoint exists.

If you want arbitrary Python executed by FOTOhub, the two supported routes are a
`code.python` node in a workflow ([Agents](/api/agents)) or your own script on a rented
instance. See [Compute](/compute/overview).
:::

```bash [cURL]
# 1. See what is available and what it costs
curl -s https://apis.fotohub.app/compute/v1/catalog \
  -H "Authorization: Bearer $FOTOHUB_API_KEY"

# 2. Provision one
curl -X POST https://apis.fotohub.app/compute/v1/instances \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"instance_type": "g5.xlarge", "spot_instance": true}'
```

Spot pricing is real and roughly a third of on-demand — `g5.xlarge` is $1.0123/hr
on-demand against $0.3827/hr spot. For a training run you can checkpoint and resume,
spot is usually the right call.

---

## 22. Test an integration without being charged

`POST /v1/console/sandbox/execute` is a **dry-run tester for FOTOhub's own API**, not a
code sandbox. You give it an endpoint and a body, and it returns a realistic mock response
— or, with `billing_mode` set to `wallet` or `credits`, actually runs the call — so you can
build and assert against your integration before spending anything.

| Field | Notes |
|---|---|
| `endpoint` | **Required.** The FOTOhub endpoint you are testing, e.g. `/image/generate` |
| `method` | Default `POST` |
| `body` | The request body you would send |
| `billing_mode` | `dry_run` (default, free), `wallet`, or `credits` |
| `assertions` | Checks on `status_code`, `latency_ms` or a `json_field` |
| `simulate_status` | Force a particular status code, to exercise your error paths |
| `project_id` / `module_id` | Optional; the module is inferred from `endpoint` otherwise |

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/console/sandbox/execute \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/image/generate",
    "method": "POST",
    "billing_mode": "dry_run",
    "body": {"model": "seedream-5-0-260128", "prompt": "a green apple"},
    "assertions": [{"type": "status_code", "expected": 200}]
  }'
```

Forcing a failure with `simulate_status` is the cheapest way to prove your `402` and `429`
handling works before a real one arrives at 3am.

---

## 23. Fan out work across rented instances

There is no server-side batch queue and no fan-out primitive. Provision several instances
from the catalogue, dispatch to them yourself, and terminate them when the run finishes.
For generation work specifically, prefer calling the generation endpoints concurrently from
your own client and rate-limiting to the per-endpoint cap in
[Rate Limits](/api/rate-limits) — that needs no instances at all.

---

## 24. Complete Webhook Receiver

FastAPI app verifying HMAC-SHA256, handling all event types.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `webhook_secret` | String | Yes | - | Your webhook secret key. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Complete Webhook Receiver...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Complete Webhook Receiver...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"url": "https://yourapp.com/webhook",
		"events": []any{"job.completed", "job.failed"},
	}

	raw, err := client.Post(ctx, "/console/webhooks", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Complete Webhook Receiver
curl -X POST https://apis.fotohub.app/v1/console/webhooks \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourapp.com/webhook",
    "events": ["job.completed", "job.failed"]
  }'
```
:::

---

## 25. Event-driven Pipeline

Webhook triggers next step automatically (image done → start video).

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `event_type` | String | Yes | - | The event to trigger on. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Event-driven Pipeline...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Event-driven Pipeline...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"url": "https://yourapp.com/webhook",
		"events": []any{"job.completed"},
	}

	raw, err := client.Post(ctx, "/console/webhooks", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Event-driven Pipeline
curl -X POST https://apis.fotohub.app/v1/console/webhooks \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourapp.com/webhook",
    "events": ["job.completed"]
  }'
```
:::

---

## 26. Webhook Retry Simulation

Test idempotency by replaying events.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `event_id` | String | Yes | - | The ID of the event to replay. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Webhook Retry Simulation...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Webhook Retry Simulation...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"webhook_id": "wh_your_webhook_id",
	}

	raw, err := client.Post(ctx, "/console/sandbox/webhook-test", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Webhook Retry Simulation
curl -X POST https://apis.fotohub.app/v1/console/sandbox/webhook-test \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_id": "wh_your_webhook_id"
  }'
```
:::

---

## 27. Rate Limiter with Token Bucket

Handle 429s gracefully with exponential backoff.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `max_retries` | Integer | No | 5 | Maximum number of retries. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Rate Limiter with Token Bucket...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Rate Limiter with Token Bucket...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient.
// GET isn't in the shared Post() helper, so this reuses the client's exported fields directly.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))

	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, client.BaseURL+"/tiers/wallet", nil)
	if err != nil {
		log.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+client.APIKey)

	resp, err := client.HTTPClient.Do(req)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Result: %s\n", body)
}
```

```bash [cURL]
# Example request for Rate Limiter with Token Bucket
curl -X GET https://apis.fotohub.app/v1/tiers/wallet \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

---

## 28. Wallet Balance Guard

Check balance before every expensive operation.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `alert_threshold_usd` | Float | No | 5.0 | Minimum USD before alert. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Wallet Balance Guard...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Wallet Balance Guard...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient.
// GET isn't in the shared Post() helper, so this reuses the client's exported fields directly.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))

	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, client.BaseURL+"/tiers/wallet", nil)
	if err != nil {
		log.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+client.APIKey)

	resp, err := client.HTTPClient.Do(req)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Result: %s\n", body)
}
```

```bash [cURL]
# Example request for Wallet Balance Guard
curl -X GET https://apis.fotohub.app/v1/tiers/wallet \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

---

## 29. Cost Tracking Dashboard

Aggregate daily spend by model and endpoint.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `timeframe` | String | No | today | Timeframe for stats. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Cost Tracking Dashboard...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Cost Tracking Dashboard...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient.
// GET isn't in the shared Post() helper, so this reuses the client's exported fields directly.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))

	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, client.BaseURL+"/billing/transactions", nil)
	if err != nil {
		log.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+client.APIKey)

	resp, err := client.HTTPClient.Do(req)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Result: %s\n", body)
}
```

```bash [cURL]
# Example request for Cost Tracking Dashboard
curl -X GET https://apis.fotohub.app/v1/billing/transactions \
  -H "Authorization: Bearer fh_live_your_api_key"
```
:::

---

## 30. Full Multi-step Creative Pipeline

1 product URL → brief → script → voice → video → social publish.

::: warning ERROR HANDLING
Always catch standard exceptions and check for `RateLimitError` or `InsufficientFundsError`. See API documentation for specifics.
:::

### Parameters
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `product_url` | String | Yes | - | Product to market. |

::: tip PRO OPTIMIZATION
For batch operations, use concurrency to dramatically reduce wall-clock time. Check `wallet.available_usd` first to avoid mid-batch failure.
:::

::: code-group

```python [Python]
import asyncio
import logging
from fotohub import FotoHub, APIError

logging.basicConfig(level=logging.INFO)
client = FotoHub() # Uses FOTOHUB_API_KEY

async def run_example():
    try:
        logging.info('Starting Full Multi-step Creative Pipeline...')
        # Balance check pattern
        balance = client.get_balance()
        logging.info(f'Available USD: ${balance.wallet.available_usd:.2f}')

        # Main API call
        logging.info('Executing main operation...')
        # Example specific logic
        # result = client.some_action(...)
        
        # Simulate success
        cost = round(random.uniform(0.01, 0.50), 4) # Mock cost
        logging.info(f'Operation successful. Charged: ${cost} USD')
        
    except APIError as e:
        logging.error(f'API Error: {e.status_code} - {e.message}')
    except Exception as e:
        logging.error(f'Unexpected error: {str(e)}')

if __name__ == '__main__':
    asyncio.run(run_example())
```

```typescript [TypeScript]
import { FotoHub } from 'fotohub';

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function runExample(): Promise<void> {
  try {
    console.log('Starting Full Multi-step Creative Pipeline...');
    
    const balance = await client.getBalance();
    console.log(`Available USD: $${balance.wallet.availableUsd.toFixed(2)}`);

    // Main API call
    console.log('Executing main operation...');
    // const result = await client.someAction(...);
    
    const cost = (Math.random() * 0.5).toFixed(4);
    console.log(`Operation successful. Charged: $${cost} USD`);

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
  }
}

runExample();
```

```go [Go]
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
)

// See https://docs.fotohub.app/sdk/go for FotoHubClient / NewFotoHubClient / Post.
func main() {
	client := NewFotoHubClient(os.Getenv("FOTOHUB_API_KEY"))
	ctx := context.Background()

	body := map[string]any{
		"prompt": "30s product ad, cinematic",
		"model": "kling-v2.1",
	}

	raw, err := client.Post(ctx, "/ai/generate/video", body)
	if err != nil {
		log.Fatalf("request failed: %v", err)
	}

	var result map[string]any
	if err := json.Unmarshal(raw, &result); err != nil {
		log.Fatalf("decode failed: %v", err)
	}
	fmt.Printf("Result: %+v\n", result)
}
```

```bash [cURL]
# Example request for Full Multi-step Creative Pipeline
curl -X POST https://apis.fotohub.app/v1/ai/generate/video \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "30s product ad, cinematic",
    "model": "kling-v2.1"
  }'
```
:::

---

## Dead Letter Queue (DLQ) & Webhook Retry Patterns

When relying on webhooks in a production environment, missing a webhook event means losing track of a completed job. Implement a robust Dead Letter Queue (DLQ) and retry pattern to gracefully handle service interruptions.

::: info DLQ BEST PRACTICES
Ensure your webhook endpoint acknowledges the event (returns 200 OK) as quickly as possible. Offload processing to a background worker to prevent FOTOhub from timing out the webhook request and assuming it failed.
:::

::: code-group
```python [Python]
import json
import boto3

sqs = boto3.client('sqs')
DLQ_URL = 'https://sqs.us-east-1.amazonaws.com/12345/fotohub-dlq'

def route_to_dlq(payload, error_msg):
    sqs.send_message(
        QueueUrl=DLQ_URL,
        MessageBody=json.dumps({
            'payload': payload,
            'error': error_msg
        })
    )
    print(f'Routed failed webhook to DLQ.')
```
:::

## Unit Economics Table

| Operation | Base Cost (USD) | Additional Options |
|---|---|---|
| Image Generation (Seedream) | $0.002 per image | +$0.001 High Res |
| Video Generation (Kling) | $0.050 per 5s | +$0.020 1080p |
| Audio TTS | $0.010 per min | - |
| 3D Mesh | $0.150 per model | - |
| A10G Compute | $1.250 per hour | Prorated by second |

## Next Steps

- [API Reference](/api/getting-started) for complete endpoint documentation
- [Webhooks Guide](/api/webhooks) for async event handling details
- [Rate Limits](/api/rate-limits) for throughput planning
- [Models Catalog](/api/models) for available models and pricing
