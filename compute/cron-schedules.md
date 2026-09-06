# Scheduled Tasks & Recurring Cron Workflows (Claws)

Automate recurring agent tasks, automated data audits, and batch generation pipelines using the **Agent Scheduler** and **Claws**. 

Schedules support full standard 5-part Linux cron syntax, custom timezone specifications (`Europe/Warsaw`, `UTC`, `America/New_York`), automated retry policies, and post-action dispatching.

---

## Base URL & Authentication

All requests to the Agent Scheduler API must be made to the following base URL:

```text
https://apis.fotohub.app/compute/v1
```

Authentication is required for all endpoints. You must provide your live API key in the `Authorization` header as a Bearer token. 

```text
Authorization: Bearer fh_live_YOUR_API_KEY
```

> [!WARNING]
> Never expose your `fh_live_` keys in client-side code. Always keep them secure in your backend servers or environment variables.

---

## Claw Architecture

Claws are our powerful abstractions for recurring agent workflows.

```mermaid
flowchart TD
    A["Cron Trigger (e.g. '0 9 * * 1')"] --> B["Claw Scheduler Engine"]
    B --> C["Pre-Flight Budget & Wallet Check"]
    C -->|Balance USD OK| D["Dispatch Claw Configuration"]
    D --> E["Firecracker MicroVM / Agent Orchestrator"]
    E --> F{"Task Result"}
    
    F -->|Success| G["Post Actions"]
    G --> H["Trigger Webhook / Chain Task"]
    
    F -->|Failure| I{"Retry Policy Configured?"}
    I -->|Yes (max retries)| J["Wait delay_minutes & Re-attempt"]
    I -->|No| K["Dispatch Failure Webhook"]
```

---

## Agent Scheduler API Reference

Manage your Claws using the following REST API endpoints.

### `POST /v1/claws`
Create a new recurring Claw configuration.

**Request Body:** (See *Complete Claw Configuration Schema*)

### `GET /v1/claws`
List all active and paused Claws.

**Query Parameters:**
- `status` (string, optional) - Filter by `active` or `paused`.
- `limit` (integer, optional) - Pagination limit. Default 100.
- `offset` (integer, optional) - Pagination offset. Default 0.

### `GET /v1/claws/:claw_id`
Retrieve a specific Claw by ID.

### `PUT /v1/claws/:claw_id`
Update a specific Claw configuration. Overwrites the existing configuration.

### `DELETE /v1/claws/:claw_id`
Delete a Claw. This action is irreversible. Future executions are cancelled immediately.

### `POST /v1/claws/:claw_id/runs/trigger`
Manually trigger an immediate run of a Claw, bypassing its cron schedule.

---

## Complete Claw Configuration Schema

The JSON payload for a Claw configuration contains instructions, schedule details, budget limits, and webhooks.

```json
{
  "name": "string", 
  "description": "string",
  "schedule": "string (cron expression)",
  "timezone": "string (IANA timezone)",
  "agent_config": {
    "model": "string (e.g. 'agent-v4-pro')",
    "system_prompt": "string",
    "temperature": "number (0.0 - 1.0)",
    "max_tokens": "integer"
  },
  "variables": {
    "key": "value (string, number, boolean, or JSON)"
  },
  "budget_control": {
    "max_cost_usd_per_run": "number",
    "monthly_budget_usd": "number",
    "action_on_budget_exceeded": "string ('pause' | 'alert_only' | 'terminate')"
  },
  "retry_policy": {
    "max_retries": "integer",
    "retry_delay_minutes": "integer",
    "exponential_backoff": "boolean"
  },
  "webhooks": {
    "on_success": "string (URL)",
    "on_failure": "string (URL)",
    "on_budget_alert": "string (URL)",
    "secret_token": "string"
  }
}
```

---

## Timezone Handling

Timezones are specified using the standard IANA timezone database formats. 

If no timezone is provided, `UTC` is used by default.

**Examples:**
- `America/Los_Angeles`
- `America/New_York`
- `Europe/London`
- `Europe/Warsaw`
- `Asia/Tokyo`
- `UTC`

> [!TIP]
> Always explicitly define your timezone to prevent daylight saving time (DST) anomalies from affecting your schedules.

---

## Cron Expression Reference

We support standard 5-part Linux cron syntax.

| Expression | Description |
|:---|:---|
| `* * * * *` | Every minute |
| `0 * * * *` | Every hour, at the start of the hour |
| `0 0 * * *` | Every day at midnight |
| `0 12 * * *` | Every day at noon |
| `0 9 * * 1` | Every Monday at 9:00 AM |
| `0 0 1 * *` | The 1st day of every month at midnight |
| `*/15 * * * *` | Every 15 minutes |
| `0 0-5 * * *` | Every hour from midnight through 5 AM |

---

## Budget and Cost Control (USD)

Claws allow strict budget enforcement in USD. You can set a maximum spend limit per run and a cumulative monthly budget.

- **`max_cost_usd_per_run`**: Limits the API and compute spend for a single invocation. If the agent consumes more tokens/compute than this USD value, the process is forcefully halted.
- **`monthly_budget_usd`**: Cumulative limit for the calendar month.
- **`action_on_budget_exceeded`**: Determines behavior when limits are reached.
  - `pause`: Automatically suspends the Claw.
  - `alert_only`: Fires a webhook but allows execution.
  - `terminate`: Deletes the Claw entirely.

---

## Webhook Schema

When a webhook is triggered by a Claw execution (success or failure), the following JSON payload is dispatched to your configured endpoint via `POST`.

```json
{
  "event_type": "claw.run.success",
  "claw_id": "clw_9876543210",
  "run_id": "run_0011223344",
  "timestamp": "2026-09-06T16:56:37Z",
  "cost_usd": 0.145,
  "execution_time_seconds": 12.4,
  "result": {
    "output_text": "Agent completed the task...",
    "extracted_data": {
       "key": "value"
    }
  },
  "error": null
}
```

Validate webhooks using the `x-fotohub-signature` header, which is an HMAC-SHA256 hash of the payload using your `secret_token`.

---

## Execution History

You can fetch the execution history of a specific Claw to monitor its performance, logs, and cost over time.

### `GET /v1/claws/:claw_id/runs`

**Response Example:**
```json
{
  "runs": [
    {
      "run_id": "run_0011223344",
      "status": "success",
      "started_at": "2026-09-06T16:56:00Z",
      "completed_at": "2026-09-06T16:56:12Z",
      "cost_usd": 0.145
    }
  ]
}
```

---

## 10 Production Cron Recipe Examples

Below are massive, production-ready examples of Claw configurations for various enterprise use-cases.

### 1. E-Commerce Competitor Price Scraper

Runs daily to scrape competitor sites, analyze price changes, and alert if our prices are non-competitive.

::: code-group

```python [Python]
import requests
import json

api_key = "fh_live_YOUR_API_KEY"
url = "https://apis.fotohub.app/compute/v1/claws"

payload = {
    "name": "Daily Price Scraper",
    "description": "Scrapes competitors every midnight",
    "schedule": "0 0 * * *",
    "timezone": "America/New_York",
    "agent_config": {
        "model": "agent-v4-pro",
        "system_prompt": "You are a price scraping bot. Visit competitor URLs, find product prices, and compare with our catalog.",
        "temperature": 0.1,
        "max_tokens": 8000
    },
    "variables": {
        "competitors": ["amazon.com", "bestbuy.com", "walmart.com"],
        "our_catalog_db": "postgres://user:pass@host/db"
    },
    "budget_control": {
        "max_cost_usd_per_run": 2.50,
        "monthly_budget_usd": 75.00,
        "action_on_budget_exceeded": "pause"
    },
    "retry_policy": {
        "max_retries": 3,
        "retry_delay_minutes": 5,
        "exponential_backoff": True
    },
    "webhooks": {
        "on_success": "https://api.yourbrand.com/webhooks/prices",
        "secret_token": "super_secret"
    }
}

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

```typescript [TypeScript]
import fetch from 'node-fetch';

const createScraperClaw = async () => {
  const response = await fetch('https://apis.fotohub.app/compute/v1/claws', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer fh_live_YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: "Daily Price Scraper",
      description: "Scrapes competitors every midnight",
      schedule: "0 0 * * *",
      timezone: "America/New_York",
      agent_config: {
        model: "agent-v4-pro",
        system_prompt: "You are a price scraping bot. Visit competitor URLs, find product prices, and compare with our catalog.",
        temperature: 0.1,
        max_tokens: 8000
      },
      variables: {
        competitors: ["amazon.com", "bestbuy.com", "walmart.com"],
        our_catalog_db: "postgres://user:pass@host/db"
      },
      budget_control: {
        max_cost_usd_per_run: 2.50,
        monthly_budget_usd: 75.00,
        action_on_budget_exceeded: "pause"
      },
      retry_policy: {
        max_retries: 3,
        retry_delay_minutes: 5,
        exponential_backoff: true
      },
      webhooks: {
        on_success: "https://api.yourbrand.com/webhooks/prices",
        secret_token: "super_secret"
      }
    })
  });
  
  const data = await response.json();
  console.log(data);
};

createScraperClaw();
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	url := "https://apis.fotohub.app/compute/v1/claws"
	payload := map[string]interface{}{
		"name":        "Daily Price Scraper",
		"description": "Scrapes competitors every midnight",
		"schedule":    "0 0 * * *",
		"timezone":    "America/New_York",
		"agent_config": map[string]interface{}{
			"model":         "agent-v4-pro",
			"system_prompt": "You are a price scraping bot. Visit competitor URLs, find product prices, and compare with our catalog.",
			"temperature":   0.1,
			"max_tokens":    8000,
		},
		"variables": map[string]interface{}{
			"competitors":    []string{"amazon.com", "bestbuy.com", "walmart.com"},
			"our_catalog_db": "postgres://user:pass@host/db",
		},
		"budget_control": map[string]interface{}{
			"max_cost_usd_per_run":      2.50,
			"monthly_budget_usd":        75.00,
			"action_on_budget_exceeded": "pause",
		},
		"retry_policy": map[string]interface{}{
			"max_retries":         3,
			"retry_delay_minutes": 5,
			"exponential_backoff": true,
		},
		"webhooks": map[string]interface{}{
			"on_success":   "https://api.yourbrand.com/webhooks/prices",
			"secret_token": "super_secret",
		},
	}

	jsonValue, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonValue))
	req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	fmt.Println("Status:", resp.Status)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/claws \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Price Scraper",
    "description": "Scrapes competitors every midnight",
    "schedule": "0 0 * * *",
    "timezone": "America/New_York",
    "agent_config": {
        "model": "agent-v4-pro",
        "system_prompt": "You are a price scraping bot. Visit competitor URLs, find product prices, and compare with our catalog.",
        "temperature": 0.1,
        "max_tokens": 8000
    },
    "variables": {
        "competitors": ["amazon.com", "bestbuy.com", "walmart.com"],
        "our_catalog_db": "postgres://user:pass@host/db"
    },
    "budget_control": {
        "max_cost_usd_per_run": 2.50,
        "monthly_budget_usd": 75.00,
        "action_on_budget_exceeded": "pause"
    },
    "retry_policy": {
        "max_retries": 3,
        "retry_delay_minutes": 5,
        "exponential_backoff": true
    },
    "webhooks": {
        "on_success": "https://api.yourbrand.com/webhooks/prices",
        "secret_token": "super_secret"
    }
  }'
```

:::

### 2. Weekly Social Media Copy Generation

Automatically writes LinkedIn and Twitter posts summarizing the week's blog articles.

::: code-group

```python [Python]
import requests
import json

payload = {
    "name": "Weekly Social Media Generator",
    "description": "Generates tweets and LinkedIn posts every Friday at 4 PM",
    "schedule": "0 16 * * 5",
    "timezone": "Europe/London",
    "agent_config": {
        "model": "agent-v4-pro",
        "system_prompt": "Read the company blog RSS feed and generate 5 engaging tweets and 2 professional LinkedIn posts.",
        "temperature": 0.7,
        "max_tokens": 4000
    },
    "variables": {
        "rss_feed_url": "https://blog.yourbrand.com/rss.xml",
        "brand_voice": "Professional but witty"
    },
    "budget_control": {
        "max_cost_usd_per_run": 1.00,
        "monthly_budget_usd": 10.00,
        "action_on_budget_exceeded": "pause"
    },
    "retry_policy": {
        "max_retries": 1,
        "retry_delay_minutes": 10,
        "exponential_backoff": False
    },
    "webhooks": {
        "on_success": "https://hooks.slack.com/services/T000/B000/XXX",
        "secret_token": "slack_secret"
    }
}

response = requests.post("https://apis.fotohub.app/compute/v1/claws", 
                         json=payload, 
                         headers={"Authorization": "Bearer fh_live_YOUR_API_KEY", "Content-Type": "application/json"})
```

```typescript [TypeScript]
import fetch from 'node-fetch';

const createSocialClaw = async () => {
  await fetch('https://apis.fotohub.app/compute/v1/claws', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer fh_live_YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: "Weekly Social Media Generator",
      description: "Generates tweets and LinkedIn posts every Friday at 4 PM",
      schedule: "0 16 * * 5",
      timezone: "Europe/London",
      agent_config: {
          model: "agent-v4-pro",
          system_prompt: "Read the company blog RSS feed and generate 5 engaging tweets and 2 professional LinkedIn posts.",
          temperature: 0.7,
          max_tokens: 4000
      },
      variables: {
          rss_feed_url: "https://blog.yourbrand.com/rss.xml",
          brand_voice: "Professional but witty"
      },
      budget_control: {
          max_cost_usd_per_run: 1.00,
          monthly_budget_usd: 10.00,
          action_on_budget_exceeded: "pause"
      },
      retry_policy: {
          max_retries: 1,
          retry_delay_minutes: 10,
          exponential_backoff: false
      },
      webhooks: {
          on_success: "https://hooks.slack.com/services/T000/B000/XXX",
          secret_token: "slack_secret"
      }
    })
  });
};
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
        "name": "Weekly Social Media Generator",
        "description": "Generates tweets and LinkedIn posts every Friday at 4 PM",
        "schedule": "0 16 * * 5",
        "timezone": "Europe/London",
        "agent_config": map[string]interface{}{
            "model": "agent-v4-pro",
            "system_prompt": "Read the company blog RSS feed and generate 5 engaging tweets and 2 professional LinkedIn posts.",
            "temperature": 0.7,
            "max_tokens": 4000,
        },
        "variables": map[string]interface{}{
            "rss_feed_url": "https://blog.yourbrand.com/rss.xml",
            "brand_voice": "Professional but witty",
        },
        "budget_control": map[string]interface{}{
            "max_cost_usd_per_run": 1.00,
            "monthly_budget_usd": 10.00,
            "action_on_budget_exceeded": "pause",
        },
        "retry_policy": map[string]interface{}{
            "max_retries": 1,
            "retry_delay_minutes": 10,
            "exponential_backoff": false,
        },
        "webhooks": map[string]interface{}{
            "on_success": "https://hooks.slack.com/services/T000/B000/XXX",
            "secret_token": "slack_secret",
        },
	}
	jsonValue, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://apis.fotohub.app/compute/v1/claws", bytes.NewBuffer(jsonValue))
	req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	client.Do(req)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/claws \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
      "name": "Weekly Social Media Generator",
      "description": "Generates tweets and LinkedIn posts every Friday at 4 PM",
      "schedule": "0 16 * * 5",
      "timezone": "Europe/London",
      "agent_config": {
          "model": "agent-v4-pro",
          "system_prompt": "Read the company blog RSS feed and generate 5 engaging tweets and 2 professional LinkedIn posts.",
          "temperature": 0.7,
          "max_tokens": 4000
      },
      "variables": {
          "rss_feed_url": "https://blog.yourbrand.com/rss.xml",
          "brand_voice": "Professional but witty"
      },
      "budget_control": {
          "max_cost_usd_per_run": 1.00,
          "monthly_budget_usd": 10.00,
          "action_on_budget_exceeded": "pause"
      },
      "retry_policy": {
          "max_retries": 1,
          "retry_delay_minutes": 10,
          "exponential_backoff": false
      },
      "webhooks": {
          "on_success": "https://hooks.slack.com/services/T000/B000/XXX",
          "secret_token": "slack_secret"
      }
  }'
```

:::

### 3. Hourly System Health Audit

Inspects API endpoints and database latency hourly, alerting the DevOps team if anomalies are detected.

::: code-group

```python [Python]
import requests
payload = {
    "name": "Hourly Health Audit",
    "schedule": "0 * * * *",
    "timezone": "UTC",
    "agent_config": {
        "model": "agent-v4-pro",
        "system_prompt": "Analyze the provided Datadog metrics and log patterns. Identify any anomalies.",
        "temperature": 0.0,
        "max_tokens": 2000
    },
    "budget_control": {
        "max_cost_usd_per_run": 0.50,
        "monthly_budget_usd": 300.00,
        "action_on_budget_exceeded": "alert_only"
    }
}
requests.post("https://apis.fotohub.app/compute/v1/claws", json=payload, headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```

```typescript [TypeScript]
// TS implementation omitted for brevity, similar structure to above.
```

```go [Go]
// Go implementation omitted for brevity, similar structure to above.
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/claws \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Hourly Health Audit", "schedule": "0 * * * *", "timezone": "UTC", "agent_config": {"model": "agent-v4-pro", "system_prompt": "Analyze metrics.", "temperature": 0.0}, "budget_control": {"max_cost_usd_per_run": 0.50, "monthly_budget_usd": 300.00, "action_on_budget_exceeded": "alert_only"}}'
```

:::

### 4. Daily Customer Support Ticket Summarization

Aggregates all Zendesk tickets from the previous day and produces a structured summary of top issues.

::: code-group

```python [Python]
import requests
payload = {
    "name": "Zendesk Summarizer",
    "schedule": "30 2 * * *",
    "timezone": "America/Los_Angeles",
    "agent_config": {
        "model": "agent-v4-pro",
        "system_prompt": "Summarize support tickets, categorize them by feature, and highlight major bugs.",
        "temperature": 0.2
    },
    "budget_control": {
        "max_cost_usd_per_run": 5.00,
        "monthly_budget_usd": 150.00,
        "action_on_budget_exceeded": "pause"
    }
}
requests.post("https://apis.fotohub.app/compute/v1/claws", json=payload, headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```

```typescript [TypeScript]
// TS implementation omitted for brevity.
```

```go [Go]
// Go implementation omitted for brevity.
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/claws \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Zendesk Summarizer", "schedule": "30 2 * * *", "timezone": "America/Los_Angeles", "agent_config": {"model": "agent-v4-pro", "system_prompt": "Summarize support tickets.", "temperature": 0.2}, "budget_control": {"max_cost_usd_per_run": 5.0, "monthly_budget_usd": 150.0, "action_on_budget_exceeded": "pause"}}'
```

:::

### 5. Bi-Weekly SEO Keyword SERP Audit

Every two weeks, the agent checks Google rankings for target keywords.

::: code-group

```python [Python]
import requests
payload = {
    "name": "Bi-Weekly SERP Audit",
    "schedule": "0 9 * * 1,15",
    "timezone": "UTC",
    "agent_config": {
        "model": "agent-v4-pro",
        "system_prompt": "Check SERP for our main keywords and track position changes."
    },
    "budget_control": {
        "max_cost_usd_per_run": 8.00,
        "monthly_budget_usd": 20.00,
        "action_on_budget_exceeded": "pause"
    }
}
requests.post("https://apis.fotohub.app/compute/v1/claws", json=payload, headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```

```typescript [TypeScript]
// TS implementation omitted for brevity.
```

```go [Go]
// Go implementation omitted for brevity.
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/claws \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Bi-Weekly SERP Audit", "schedule": "0 9 * * 1,15", "timezone": "UTC", "agent_config": {"model": "agent-v4-pro", "system_prompt": "Check SERP for our main keywords."}, "budget_control": {"max_cost_usd_per_run": 8.0, "monthly_budget_usd": 20.0, "action_on_budget_exceeded": "pause"}}'
```

:::

### 6. Monthly Expense Report Processor

Reads raw expense receipts from S3 and generates a structured CSV for accounting on the 1st of every month.

::: code-group

```python [Python]
import requests
payload = {
    "name": "Expense Processor",
    "schedule": "0 0 1 * *",
    "timezone": "UTC",
    "agent_config": {
        "model": "agent-v4-pro",
        "system_prompt": "Extract merchant, date, and amount from receipt images and output CSV."
    },
    "budget_control": {
        "max_cost_usd_per_run": 10.00,
        "monthly_budget_usd": 15.00,
        "action_on_budget_exceeded": "pause"
    }
}
requests.post("https://apis.fotohub.app/compute/v1/claws", json=payload, headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```

```typescript [TypeScript]
// TS implementation omitted for brevity.
```

```go [Go]
// Go implementation omitted for brevity.
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/claws \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Expense Processor", "schedule": "0 0 1 * *", "timezone": "UTC", "agent_config": {"model": "agent-v4-pro", "system_prompt": "Extract expenses"}, "budget_control": {"max_cost_usd_per_run": 10.0, "monthly_budget_usd": 15.0, "action_on_budget_exceeded": "pause"}}'
```

:::

### 7. Weekly Newsletter Curation

Compiles top industry news every Wednesday.

::: code-group

```python [Python]
import requests
payload = {
    "name": "Newsletter Curator",
    "schedule": "0 10 * * 3",
    "timezone": "Europe/London",
    "agent_config": {
        "model": "agent-v4-pro",
        "system_prompt": "Curate the top 5 AI news articles for our newsletter."
    },
    "budget_control": {
        "max_cost_usd_per_run": 2.00,
        "monthly_budget_usd": 10.00,
        "action_on_budget_exceeded": "pause"
    }
}
requests.post("https://apis.fotohub.app/compute/v1/claws", json=payload, headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```

```typescript [TypeScript]
// TS implementation omitted for brevity.
```

```go [Go]
// Go implementation omitted for brevity.
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/claws \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Newsletter Curator", "schedule": "0 10 * * 3", "timezone": "Europe/London", "agent_config": {"model": "agent-v4-pro", "system_prompt": "Curate news."}, "budget_control": {"max_cost_usd_per_run": 2.0, "monthly_budget_usd": 10.0, "action_on_budget_exceeded": "pause"}}'
```

:::

### 8. Daily GitHub Issue Triage

Tags, assigns, and prioritizes new GitHub issues.

::: code-group

```python [Python]
import requests
payload = {
    "name": "GitHub Triage",
    "schedule": "0 8 * * *",
    "timezone": "America/Los_Angeles",
    "agent_config": {
        "model": "agent-v4-pro",
        "system_prompt": "Read open GitHub issues and apply appropriate labels."
    },
    "budget_control": {
        "max_cost_usd_per_run": 1.50,
        "monthly_budget_usd": 50.00,
        "action_on_budget_exceeded": "alert_only"
    }
}
requests.post("https://apis.fotohub.app/compute/v1/claws", json=payload, headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```

```typescript [TypeScript]
// TS implementation omitted for brevity.
```

```go [Go]
// Go implementation omitted for brevity.
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/claws \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "GitHub Triage", "schedule": "0 8 * * *", "timezone": "America/Los_Angeles", "agent_config": {"model": "agent-v4-pro", "system_prompt": "Label issues."}, "budget_control": {"max_cost_usd_per_run": 1.50, "monthly_budget_usd": 50.0, "action_on_budget_exceeded": "alert_only"}}'
```

:::

### 9. Hourly Log Aggregation for Security

Scans access logs for suspicious activity.

::: code-group

```python [Python]
import requests
payload = {
    "name": "Security Log Scan",
    "schedule": "0 * * * *",
    "timezone": "UTC",
    "agent_config": {
        "model": "agent-v4-pro",
        "system_prompt": "Scan nginx logs for SQL injection attempts."
    },
    "budget_control": {
        "max_cost_usd_per_run": 3.00,
        "monthly_budget_usd": 250.00,
        "action_on_budget_exceeded": "alert_only"
    }
}
requests.post("https://apis.fotohub.app/compute/v1/claws", json=payload, headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```

```typescript [TypeScript]
// TS implementation omitted for brevity.
```

```go [Go]
// Go implementation omitted for brevity.
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/claws \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Security Log Scan", "schedule": "0 * * * *", "timezone": "UTC", "agent_config": {"model": "agent-v4-pro", "system_prompt": "Scan logs."}, "budget_control": {"max_cost_usd_per_run": 3.00, "monthly_budget_usd": 250.0, "action_on_budget_exceeded": "alert_only"}}'
```

:::

### 10. Quarterly Data Retention Cleanup

Every 3 months, finds and marks old user data for deletion.

::: code-group

```python [Python]
import requests
payload = {
    "name": "Retention Cleanup",
    "schedule": "0 0 1 1,4,7,10 *",
    "timezone": "UTC",
    "agent_config": {
        "model": "agent-v4-pro",
        "system_prompt": "Identify records older than 3 years for deletion."
    },
    "budget_control": {
        "max_cost_usd_per_run": 20.00,
        "monthly_budget_usd": 30.00,
        "action_on_budget_exceeded": "pause"
    }
}
requests.post("https://apis.fotohub.app/compute/v1/claws", json=payload, headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
```

```typescript [TypeScript]
// TS implementation omitted for brevity.
```

```go [Go]
// Go implementation omitted for brevity.
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/claws \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Retention Cleanup", "schedule": "0 0 1 1,4,7,10 *", "timezone": "UTC", "agent_config": {"model": "agent-v4-pro", "system_prompt": "Clean records."}, "budget_control": {"max_cost_usd_per_run": 20.00, "monthly_budget_usd": 30.0, "action_on_budget_exceeded": "pause"}}'
```

:::
