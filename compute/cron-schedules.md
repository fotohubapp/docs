# Scheduled Tasks & Recurring Cron Workflows (Claws)

Automate recurring agent tasks, automated data audits, and batch generation pipelines using **cron jobs attached to an FH Claw**.

Schedules use standard 5-part Linux cron syntax. A cron job runs on an existing, already-provisioned Claw — see [FH Claw Assistants](/compute/fh-claw-assistants) for how to create one.

> [!NOTE]
> This page previously described a standalone "Agent Scheduler" service with its own `agent_config`, per-run USD budgets, retry policies and outbound webhooks. None of that exists in the running service — cron jobs are a thin sub-resource of an FH Claw (`server/agent-compute/app/routes_claw.py`) with exactly three fields: `description`, `schedule`, `task`. The content below has been rewritten to match what is actually deployed.

---

## Base URL & Authentication

All requests to the FH Claw cron API must be made to the following base URL:

```text
https://comp1.fotohub.app
```

Authentication is required for all endpoints. You must provide your live API key in the `Authorization` header as a Bearer token.

```text
Authorization: Bearer fh_live_YOUR_API_KEY
```

> [!WARNING]
> Never expose your `fh_live_` keys in client-side code. Always keep them secure in your backend servers or environment variables.

---

## Claw Architecture

Each cron job you create is dispatched as a recurring reasoning loop on an already-running Claw.

```mermaid
flowchart TD
    A["Cron Trigger (e.g. '0 9 * * 1')"] --> B["Claw Cron Scheduler"]
    B --> C["Dispatch task to the Claw's OpenClaw Gateway"]
    C --> D["Firecracker MicroVM / Agent Reasoning Loop"]
    D --> E["Task Result appended to the Claw's message history"]
```

---

## Cron API Reference

Manage recurring cron jobs on an existing Claw using the following REST API endpoints.

### `POST /v1/claws/:claw_id/crons`
Create a recurring cron job on an existing Claw.

**Request Body:** (See *Cron Job Schema*)

### `GET /v1/claws/:claw_id/crons`
List the cron jobs configured on a Claw. The response is proxied from the Claw's own gateway, so its exact shape may vary by Claw version — treat it as a list of the cron objects you created.

> [!NOTE]
> There is currently no endpoint to update or delete a single cron job, and no endpoint to manually trigger an off-schedule run. Both were documented on an earlier version of this page and have been removed rather than left pointing at a 404.

---

## Cron Job Schema

The JSON payload for a cron job has exactly three fields:

```json
{
  "description": "string — human-readable label for the job",
  "schedule": "string — 5-part cron expression",
  "task": "string — natural-language instructions given to the Claw on each run"
}
```

There is no `timezone`, `agent_config`, `budget_control`, `retry_policy` or `webhooks` field — cost is billed the same way as any other message to the Claw (see [FH Claw Assistants](/compute/fh-claw-assistants) for pricing), and cron schedules run in UTC.

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

## Cost & Monitoring

There is no per-cron USD budget cap or outbound webhook mechanism — a cron run bills the same way as any other message to the Claw, deducted from your USD wallet. Monitor spend and history via the FotoHub Web Console (**Billing > Agents**) or by polling `GET /v1/claws/:claw_id/messages` for the Claw's conversation log.

---

## 10 Production Cron Recipe Examples

Below are massive, production-ready examples of Claw configurations for various enterprise use-cases.

### 1. E-Commerce Competitor Price Scraper

Runs daily to scrape competitor sites, analyze price changes, and alert if our prices are non-competitive.

::: code-group

```python [Python]
import requests

api_key = "fh_live_YOUR_API_KEY"
claw_id = "clw_your_existing_claw_id"  # create with POST /v1/claws first
url = f"https://comp1.fotohub.app/v1/claws/{claw_id}/crons"

payload = {
    "description": "Daily Price Scraper — scrapes competitors every midnight",
    "schedule": "0 0 * * *",
    "task": "Visit amazon.com, bestbuy.com and walmart.com, find current product prices for our catalog, and flag any of our SKUs that are no longer price-competitive."
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

const clawId = "clw_your_existing_claw_id"; // create with POST /v1/claws first

const createScraperCron = async () => {
  const response = await fetch(`https://comp1.fotohub.app/v1/claws/${clawId}/crons`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer fh_live_YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: "Daily Price Scraper — scrapes competitors every midnight",
      schedule: "0 0 * * *",
      task: "Visit amazon.com, bestbuy.com and walmart.com, find current product prices for our catalog, and flag any of our SKUs that are no longer price-competitive."
    })
  });

  const data = await response.json();
  console.log(data);
};

createScraperCron();
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
	clawID := "clw_your_existing_claw_id" // create with POST /v1/claws first
	url := "https://comp1.fotohub.app/v1/claws/" + clawID + "/crons"
	payload := map[string]interface{}{
		"description": "Daily Price Scraper — scrapes competitors every midnight",
		"schedule":    "0 0 * * *",
		"task":        "Visit amazon.com, bestbuy.com and walmart.com, find current product prices for our catalog, and flag any of our SKUs that are no longer price-competitive.",
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
curl -X POST https://comp1.fotohub.app/v1/claws/$CLAW_ID/crons \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Daily Price Scraper — scrapes competitors every midnight",
    "schedule": "0 0 * * *",
    "task": "Visit amazon.com, bestbuy.com and walmart.com, find current product prices for our catalog, and flag any of our SKUs that are no longer price-competitive."
  }'
```

:::

### 2. Weekly Social Media Copy Generation

Automatically writes LinkedIn and Twitter posts summarizing the week's blog articles.

::: code-group

```python [Python]
import requests

claw_id = "clw_your_existing_claw_id"  # create with POST /v1/claws first
payload = {
    "description": "Weekly Social Media Generator — posts every Friday at 4 PM",
    "schedule": "0 16 * * 5",
    "task": "Read the company blog RSS feed at https://blog.yourbrand.com/rss.xml and draft 5 engaging tweets and 2 professional LinkedIn posts in a professional but witty voice."
}

response = requests.post(
    f"https://comp1.fotohub.app/v1/claws/{claw_id}/crons",
    json=payload,
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY", "Content-Type": "application/json"}
)
```

```typescript [TypeScript]
import fetch from 'node-fetch';

const clawId = "clw_your_existing_claw_id"; // create with POST /v1/claws first

const createSocialCron = async () => {
  await fetch(`https://comp1.fotohub.app/v1/claws/${clawId}/crons`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer fh_live_YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: "Weekly Social Media Generator — posts every Friday at 4 PM",
      schedule: "0 16 * * 5",
      task: "Read the company blog RSS feed at https://blog.yourbrand.com/rss.xml and draft 5 engaging tweets and 2 professional LinkedIn posts in a professional but witty voice."
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
	clawID := "clw_your_existing_claw_id" // create with POST /v1/claws first
	payload := map[string]interface{}{
		"description": "Weekly Social Media Generator — posts every Friday at 4 PM",
		"schedule":    "0 16 * * 5",
		"task":        "Read the company blog RSS feed at https://blog.yourbrand.com/rss.xml and draft 5 engaging tweets and 2 professional LinkedIn posts in a professional but witty voice.",
	}
	jsonValue, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://comp1.fotohub.app/v1/claws/"+clawID+"/crons", bytes.NewBuffer(jsonValue))
	req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	client.Do(req)
}
```

```bash [cURL]
curl -X POST https://comp1.fotohub.app/v1/claws/$CLAW_ID/crons \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
      "description": "Weekly Social Media Generator — posts every Friday at 4 PM",
      "schedule": "0 16 * * 5",
      "task": "Read the company blog RSS feed at https://blog.yourbrand.com/rss.xml and draft 5 engaging tweets and 2 professional LinkedIn posts in a professional but witty voice."
  }'
```

:::

### 3. Hourly System Health Audit

Inspects API endpoints and database latency hourly, alerting the DevOps team if anomalies are detected.

::: code-group

```python [Python]
import requests
claw_id = "clw_your_existing_claw_id"  # create with POST /v1/claws first
payload = {
    "description": "Hourly Health Audit",
    "schedule": "0 * * * *",
    "task": "Analyze the provided Datadog metrics and log patterns. Identify any anomalies."
}
requests.post(
    f"https://comp1.fotohub.app/v1/claws/{claw_id}/crons",
    json=payload,
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}
)
```

```typescript [TypeScript]
// TS implementation omitted for brevity, similar structure to above.
```

```go [Go]
// Go implementation omitted for brevity, similar structure to above.
```

```bash [cURL]
curl -X POST https://comp1.fotohub.app/v1/claws/$CLAW_ID/crons \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"description": "Hourly Health Audit", "schedule": "0 * * * *", "task": "Analyze metrics."}'
```

:::

### 4. Daily Customer Support Ticket Summarization

Aggregates all Zendesk tickets from the previous day and produces a structured summary of top issues.

::: code-group

```python [Python]
import requests
claw_id = "clw_your_existing_claw_id"  # create with POST /v1/claws first
payload = {
    "description": "Zendesk Summarizer",
    "schedule": "30 2 * * *",
    "task": "Summarize support tickets, categorize them by feature, and highlight major bugs."
}
requests.post(
    f"https://comp1.fotohub.app/v1/claws/{claw_id}/crons",
    json=payload,
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}
)
```

```typescript [TypeScript]
// TS implementation omitted for brevity.
```

```go [Go]
// Go implementation omitted for brevity.
```

```bash [cURL]
curl -X POST https://comp1.fotohub.app/v1/claws/$CLAW_ID/crons \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"description": "Zendesk Summarizer", "schedule": "30 2 * * *", "task": "Summarize support tickets."}'
```

:::

### 5. Bi-Weekly SEO Keyword SERP Audit

Every two weeks, the agent checks Google rankings for target keywords.

::: code-group

```python [Python]
import requests
claw_id = "clw_your_existing_claw_id"  # create with POST /v1/claws first
payload = {
    "description": "Bi-Weekly SERP Audit",
    "schedule": "0 9 * * 1,15",
    "task": "Check SERP for our main keywords and track position changes."
}
requests.post(
    f"https://comp1.fotohub.app/v1/claws/{claw_id}/crons",
    json=payload,
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}
)
```

```typescript [TypeScript]
// TS implementation omitted for brevity.
```

```go [Go]
// Go implementation omitted for brevity.
```

```bash [cURL]
curl -X POST https://comp1.fotohub.app/v1/claws/$CLAW_ID/crons \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"description": "Bi-Weekly SERP Audit", "schedule": "0 9 * * 1,15", "task": "Check SERP for our main keywords."}'
```

:::

### 6. Monthly Expense Report Processor

Reads raw expense receipts from S3 and generates a structured CSV for accounting on the 1st of every month.

::: code-group

```python [Python]
import requests
claw_id = "clw_your_existing_claw_id"  # create with POST /v1/claws first
payload = {
    "description": "Expense Processor",
    "schedule": "0 0 1 * *",
    "task": "Extract merchant, date, and amount from receipt images and output CSV."
}
requests.post(
    f"https://comp1.fotohub.app/v1/claws/{claw_id}/crons",
    json=payload,
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}
)
```

```typescript [TypeScript]
// TS implementation omitted for brevity.
```

```go [Go]
// Go implementation omitted for brevity.
```

```bash [cURL]
curl -X POST https://comp1.fotohub.app/v1/claws/$CLAW_ID/crons \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"description": "Expense Processor", "schedule": "0 0 1 * *", "task": "Extract expenses"}'
```

:::

### 7. Weekly Newsletter Curation

Compiles top industry news every Wednesday.

::: code-group

```python [Python]
import requests
claw_id = "clw_your_existing_claw_id"  # create with POST /v1/claws first
payload = {
    "description": "Newsletter Curator",
    "schedule": "0 10 * * 3",
    "task": "Curate the top 5 AI news articles for our newsletter."
}
requests.post(
    f"https://comp1.fotohub.app/v1/claws/{claw_id}/crons",
    json=payload,
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}
)
```

```typescript [TypeScript]
// TS implementation omitted for brevity.
```

```go [Go]
// Go implementation omitted for brevity.
```

```bash [cURL]
curl -X POST https://comp1.fotohub.app/v1/claws/$CLAW_ID/crons \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"description": "Newsletter Curator", "schedule": "0 10 * * 3", "task": "Curate news."}'
```

:::

### 8. Daily GitHub Issue Triage

Tags, assigns, and prioritizes new GitHub issues.

::: code-group

```python [Python]
import requests
claw_id = "clw_your_existing_claw_id"  # create with POST /v1/claws first
payload = {
    "description": "GitHub Triage",
    "schedule": "0 8 * * *",
    "task": "Read open GitHub issues and apply appropriate labels."
}
requests.post(
    f"https://comp1.fotohub.app/v1/claws/{claw_id}/crons",
    json=payload,
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}
)
```

```typescript [TypeScript]
// TS implementation omitted for brevity.
```

```go [Go]
// Go implementation omitted for brevity.
```

```bash [cURL]
curl -X POST https://comp1.fotohub.app/v1/claws/$CLAW_ID/crons \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"description": "GitHub Triage", "schedule": "0 8 * * *", "task": "Label issues."}'
```

:::

### 9. Hourly Log Aggregation for Security

Scans access logs for suspicious activity.

::: code-group

```python [Python]
import requests
claw_id = "clw_your_existing_claw_id"  # create with POST /v1/claws first
payload = {
    "description": "Security Log Scan",
    "schedule": "0 * * * *",
    "task": "Scan nginx logs for SQL injection attempts."
}
requests.post(
    f"https://comp1.fotohub.app/v1/claws/{claw_id}/crons",
    json=payload,
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}
)
```

```typescript [TypeScript]
// TS implementation omitted for brevity.
```

```go [Go]
// Go implementation omitted for brevity.
```

```bash [cURL]
curl -X POST https://comp1.fotohub.app/v1/claws/$CLAW_ID/crons \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"description": "Security Log Scan", "schedule": "0 * * * *", "task": "Scan logs."}'
```

:::

### 10. Quarterly Data Retention Cleanup

Every 3 months, finds and marks old user data for deletion.

::: code-group

```python [Python]
import requests
claw_id = "clw_your_existing_claw_id"  # create with POST /v1/claws first
payload = {
    "description": "Retention Cleanup",
    "schedule": "0 0 1 1,4,7,10 *",
    "task": "Identify records older than 3 years for deletion."
}
requests.post(
    f"https://comp1.fotohub.app/v1/claws/{claw_id}/crons",
    json=payload,
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}
)
```

```typescript [TypeScript]
// TS implementation omitted for brevity.
```

```go [Go]
// Go implementation omitted for brevity.
```

```bash [cURL]
curl -X POST https://comp1.fotohub.app/v1/claws/$CLAW_ID/crons \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"description": "Retention Cleanup", "schedule": "0 0 1 1,4,7,10 *", "task": "Clean records."}'
```

:::
