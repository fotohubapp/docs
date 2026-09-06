# FH Claw: Persistent Autonomous AI Assistants

Deploy dedicated, containerized autonomous agents powered by the **FH Claw Engine** (`server/agent-compute/app/routes_claw.py`).

Unlike ephemeral one-shot task scripts, **FH Claw** instances maintain persistent state, memory, customized personalities ("Souls"), external communication channels (Telegram, Discord, Slack, WhatsApp, Email), and recurring background cron automations.

::: info
**Base URL:** `https://apis.fotohub.app/compute/v1`
**Endpoints Route:** `/v1/claws`
:::

---

## 1. FH Claw Architecture Deep Dive

The FH Claw architecture is designed for multi-modal, persistent, and highly available autonomous agents. It isolates execution in Firecracker MicroVMs while connecting to an intelligent routing plane.

```mermaid
flowchart TD
    subgraph Communication Channels
        TG["Telegram Bot"]
        DC["Discord Bot"]
        SL["Slack App"]
        WA["WhatsApp Business"]
        EM["Email Bridge"]
        Web["Web Console / Mobile"]
    end

    subgraph FotoHUB Agent Control Plane
        Router["Claw Gateway & Router (Port 8795)"]
        Soul["Soul Engine (Personality, Tone, Directives)"]
        Skills["Skill Registry & GitHub Dynamic Loader"]
        Cron["Autonomous Scheduler (Cron Engine)"]
        Billing["Billing Service (USD Wallet)"]
    end

    subgraph User Isolated Execution Environment
        ClawDocker["Dedicated OpenClaw Container"]
        MemStore["Persistent Vector Memory (Pinecone/Milvus)"]
        Workspace["Virtual Workspace Filesystem (EBS)"]
        Sandboxes["Firecracker MicroVMs (Code Execution)"]
    end

    TG & DC & SL & WA & EM & Web <--> Router
    Router <--> Soul & ClawDocker
    Router <--> Billing
    ClawDocker <--> Skills & Cron & MemStore & Workspace & Sandboxes
```

### Key Components Expanded

- **Claw Gateway & Router:** 
  Manages ingress and egress for your agent, translating messages from various platforms into standardized Claw Actions. Handles rate limiting, authentication, and websocket streaming.
- **Soul Engine:** 
  Injects system prompts, context constraints, tone adjustments, and hardcoded boundaries into every reasoning step. This ensures that a customer support bot doesn't start talking like a pirate, unless instructed to.
- **Persistent Vector Memory:** 
  Automatically embeds conversational history and file context, providing semantic recall across months of interactions. Uses highly optimized HNSW indexes for sub-millisecond retrieval.
- **Firecracker MicroVMs:** 
  Allows your Claw to safely write and execute Python, Node, and bash scripts to solve complex analytical tasks without compromising the host. Each execution gets a fresh microVM launched in < 100ms.
- **Autonomous Scheduler (Cron Engine):**
  A distributed cron system that triggers agent reasoning loops at scheduled intervals, enabling background monitoring and proactive alerts.

---

## 2. Authentication & Base URL

All requests to the FH Claw API require authentication via a Bearer token using your FotoHub live API key.

```http
Authorization: Bearer fh_live_YOUR_API_KEY
```

::: warning Security Best Practices
Never expose your `fh_live_` keys in client-side code (e.g., React, Vue, iOS apps). Always route requests through your backend to protect your billing account. Use `fh_test_` keys for development, which mock responses and do not incur USD charges.
:::

---

## 3. Pricing & Billing (USD Wallet)

FH Claw billing is derived directly from your **USD Wallet**. We charge a hybrid model: per hour of active Claw uptime (for the container overhead), plus a small per-token fee depending on the reasoning model selected.

### 3.1. Claw Instance Tiers

| Tier | Resources | Price per Hour | Monthly Cap (Estimated) | Best For | Storage Limit | Max Sandbox Executions/hr |
|:---|:---|:---|:---|:---|:---|:---|
| **Starter** | 1 vCPU / 2GB RAM | $0.02 / hr | ~$14.40 / mo | Hobby projects, simple chat bots. | 10 GB | 100 |
| **Pro** | 2 vCPU / 4GB RAM | $0.08 / hr | ~$57.60 / mo | Production workloads, team bots. | 50 GB | 1,000 |
| **Ultimate** | 4 vCPU / 8GB RAM | $0.20 / hr | ~$144.00 / mo | Heavy code execution, cron tasks. | 200 GB | 10,000 |
| **Enterprise** | Custom | Custom | Custom | VPC Peering, SOC2 compliance. | Unlimited | Unlimited |

### 3.2. Reasoning Model Costs (Per 1K Tokens)

| Model Mode | Input Pricing | Output Pricing | Core Model Family | Suggested Use Cases |
|:---|:---|:---|:---|:---|
| `standard` | $0.0015 | $0.0020 | Llama 3 8B / Flash | Fast, cheap, great for simple extraction and basic chat. |
| `deep` | $0.0030 | $0.0150 | Claude 3.5 Sonnet | Complex reasoning, coding, professional writing, RAG. |
| `reasoning`| $0.0050 | $0.0200 | DeepSeek R1 / Opus | Multi-step agentic planning, mathematical proofs. |

*Note: All billing is automatically deducted from your FotoHub USD wallet balance. If your balance hits $0.00, your Claws will be paused. Vectors are retained for 30 days post-pause.*

---

## 4. Complete API Reference

Manage the full lifecycle of your Claw instances programmatically.

### 4.1. Create a Claw (`POST /v1/claws`)

Creates a new Claw instance and immediately begins provisioning the container. Returns the `claw_id`.

**Request Schema:**

```json
{
  "name": "string (required) - unique slug format (e.g. 'my-claw-1')",
  "display_name": "string (optional) - human readable name",
  "tier": "string (optional) - starter | pro | ultimate | enterprise (default: starter)",
  "model_mode": "string (optional) - standard | deep | reasoning (default: standard)",
  "soul_config": {
    "personality": "string - detailed description of persona",
    "instructions": "string - hardcoded operational rules",
    "tone": "string - conversational tone",
    "language": "string - ISO 639-1 language code (e.g. 'en')"
  }
}
```

::: code-group

```python [Python]
import os
import requests

url = "https://apis.fotohub.app/compute/v1/claws"
headers = {
    "Authorization": f"Bearer {os.getenv('FOTOHUB_API_KEY')}",
    "Content-Type": "application/json"
}
payload = {
    "name": "data-cruncher",
    "display_name": "Data Cruncher Pro",
    "tier": "pro",
    "model_mode": "deep",
    "soul_config": {
        "personality": "You are a meticulous data engineer with 10 years of experience.",
        "instructions": "Always validate CSV schemas before processing. Never drop tables.",
        "tone": "professional and concise",
        "language": "en"
    }
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

```typescript [TypeScript]
import axios from 'axios';

async function createClaw() {
  const response = await axios.post('https://apis.fotohub.app/compute/v1/claws', {
    name: "data-cruncher",
    display_name: "Data Cruncher Pro",
    tier: "pro",
    model_mode: "deep",
    soul_config: {
      personality: "You are a meticulous data engineer with 10 years of experience.",
      instructions: "Always validate CSV schemas before processing. Never drop tables.",
      tone: "professional and concise",
      language: "en"
    }
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.FOTOHUB_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  console.log(response.data);
}
createClaw();
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

func main() {
	url := "https://apis.fotohub.app/compute/v1/claws"
	payload := map[string]interface{}{
		"name":         "data-cruncher",
		"display_name": "Data Cruncher Pro",
		"tier":         "pro",
		"model_mode":   "deep",
		"soul_config": map[string]string{
			"personality":  "You are a meticulous data engineer.",
			"instructions": "Always validate CSV schemas before processing.",
			"tone":         "professional",
			"language":     "en",
		},
	}
	jsonPayload, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	fmt.Println("Status:", resp.Status)
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/claws   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "name": "data-cruncher",
    "display_name": "Data Cruncher Pro",
    "tier": "pro",
    "model_mode": "deep",
    "soul_config": {
      "personality": "You are a meticulous data engineer.",
      "instructions": "Always validate CSV schemas before processing.",
      "tone": "professional",
      "language": "en"
    }
  }'
```
:::

### 4.2. List Claws (`GET /v1/claws`)

Retrieve a list of all your provisioned Claws.

::: code-group
```bash [cURL]
curl -X GET https://apis.fotohub.app/compute/v1/claws   -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

```python [Python]
response = requests.get(
    "https://apis.fotohub.app/compute/v1/claws", 
    headers={"Authorization": f"Bearer {api_key}"}
)
print(response.json())
```
:::

**Response:**
```json
{
  "claws": [
    {
      "claw_id": "claw_123abc",
      "name": "data-cruncher",
      "status": "running",
      "created_at": "2026-09-06T12:00:00Z"
    }
  ],
  "total": 1
}
```

### 4.3. Get Claw Details (`GET /v1/claws/:id`)

Retrieve metadata, uptime, and configuration of a specific Claw.

::: code-group
```bash [cURL]
curl -X GET https://apis.fotohub.app/compute/v1/claws/data-cruncher   -H "Authorization: Bearer $FOTOHUB_API_KEY"
```
:::

**Response:**
```json
{
  "claw_id": "claw_123abc",
  "name": "data-cruncher",
  "tier": "pro",
  "model_mode": "deep",
  "status": "running",
  "uptime_seconds": 3600,
  "soul_config": {
    "personality": "You are a meticulous data engineer.",
    "instructions": "Always validate CSV schemas before processing.",
    "tone": "professional",
    "language": "en"
  },
  "memory_vectors_count": 1450
}
```

### 4.4. Update Claw (`PATCH /v1/claws/:id`)

Modify a Claw's tier, model mode, or soul configuration without dropping its memory or restarting the core container.

::: code-group
```bash [cURL]
curl -X PATCH https://apis.fotohub.app/compute/v1/claws/data-cruncher   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "model_mode": "reasoning",
    "tier": "ultimate",
    "soul_config": {
      "tone": "urgent"
    }
  }'
```
:::

### 4.5. Delete Claw (`DELETE /v1/claws/:id`)

Permanently destroys a Claw, its isolated container, and all associated vector memory. **This action cannot be undone.**

::: code-group
```bash [cURL]
curl -X DELETE https://apis.fotohub.app/compute/v1/claws/data-cruncher   -H "Authorization: Bearer $FOTOHUB_API_KEY"
```
:::

### 4.6. Send Message (`POST /v1/claws/:id/messages`)

Interact directly with your Claw via API. The Claw will evaluate the message, update its memory, potentially run tools/skills, and respond. Responses are streamed by default if `stream=true`.

::: code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/claws/data-cruncher/messages   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "role": "user",
    "content": "Please analyze the Q3 revenue CSV I uploaded earlier.",
    "stream": false
  }'
```

```python [Python]
payload = {
    "role": "user",
    "content": "Please analyze the Q3 revenue CSV I uploaded earlier.",
    "stream": False
}
response = requests.post(
    "https://apis.fotohub.app/compute/v1/claws/data-cruncher/messages",
    json=payload,
    headers={"Authorization": f"Bearer {api_key}"}
)
print(response.json()['message']['content'])
```
:::

### 4.7. Get Memory State (`GET /v1/claws/:id/memory`)

Retrieve a summary of the Claw's current contextual memory and conversation history length.

::: code-group
```bash [cURL]
curl -X GET https://apis.fotohub.app/compute/v1/claws/data-cruncher/memory   -H "Authorization: Bearer $FOTOHUB_API_KEY"
```
:::

### 4.8. Clear Memory (`POST /v1/claws/:id/memory/clear`)

Wipe the Claw's contextual vector memory, giving it a fresh start. Does not affect the Soul configuration or installed skills.

::: code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/claws/data-cruncher/memory/clear   -H "Authorization: Bearer $FOTOHUB_API_KEY"
```
:::

### 4.9. Trigger Background Run (`POST /v1/claws/:id/runs`)

Dispatch an asynchronous background task to the Claw. The Claw will execute the instructions in the background and optionally notify external channels when complete. Perfect for long-running scripts or batch jobs.

::: code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/claws/data-cruncher/runs   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "instructions": "Scan the AWS bucket for new logs, parse them, and generate a PDF report.",
    "callback_url": "https://my-app.com/webhooks/claw-done"
  }'
```
:::

---

## 5. External Communication Channels

Claws are designed to live where your users live. You can bind a Claw to multiple communication channels simultaneously. Zero server infrastructure required on your end.

### 5.1. Slack Integration

Requires a Slack App with `chat:write`, `app_mentions:read`, and `im:history` scopes.

```json
// POST /v1/claws/:id/channels
{
  "channel": "slack",
  "token": "xoxb-your-slack-bot-token",
  "config": {
    "allowed_channels": ["#engineering-alerts", "#devops"],
    "respond_to_threads": true
  }
}
```

### 5.2. Discord Integration

Requires a Discord Bot token from the Developer Portal.

```json
// POST /v1/claws/:id/channels
{
  "channel": "discord",
  "token": "MTE..._discord_token",
  "config": {
    "listen_to_dms": true,
    "allowed_guilds": ["123456789012345678"]
  }
}
```

### 5.3. Telegram Integration

Requires a BotFather token. Highly recommended for personal assistants.

```json
// POST /v1/claws/:id/channels
{
  "channel": "telegram",
  "token": "7182938491:AAHk..._token",
  "config": {
    "allowed_user_ids": ["129481920"]
  }
}
```

### 5.4. WhatsApp Integration

Requires Meta Business Cloud API credentials.

```json
// POST /v1/claws/:id/channels
{
  "channel": "whatsapp",
  "token": "EAAGm..._whatsapp_token",
  "config": {
    "phone_number_id": "1234567890",
    "verify_token": "my_custom_verify_token"
  }
}
```

### 5.5. Email Bridge

Provides your Claw with a dedicated inbox (e.g., `claw-abc123@agents.fotohub.app`). It can read and reply to emails automatically.

```json
// POST /v1/claws/:id/channels
{
  "channel": "email",
  "config": {
    "forwarding_addresses": ["admin@mycompany.com"],
    "signature": "---
Sent by Artemis Claw"
  }
}
```

---

## 6. Real-World Claw Use Cases & Configurations

Explore these 8 massive, highly detailed configuration templates to inspire your next Claw deployment. These configs are designed to be submitted directly to the `soul_config` payload.

### Case 1: Data Engineering AI (Airflow & dbt Integration)

**Scenario:** An autonomous agent that monitors Apache Airflow DAGs, debugs failed dbt models, and pushes fix PRs to GitHub.

**JSON Payload:**
```json
{
  "name": "data-eng-claw",
  "tier": "ultimate",
  "model_mode": "reasoning",
  "soul_config": {
    "personality": "Senior Data Engineer specializing in Snowflake, dbt, and Airflow. You are highly analytical and proactive.",
    "instructions": "1. Monitor the provided Airflow API endpoints for DAG failures.
2. If a DAG fails, fetch the logs from the Airflow API.
3. Analyze the stack trace and identify the root cause.
4. If it is a SQL error in a dbt model, clone the repository, generate a proposed SQL fix, and use your GitHub skill to open a Pull Request.
5. Alert the team in the Slack #data-ops channel with a summary of the failure, the root cause, and a link to your PR.",
    "tone": "technical, direct, and solution-oriented",
    "language": "en"
  }
}
```
**Recommended Skills:** `github`, `airflow_api`, `dbt_cloud`
**Cron Automation:** "Every 15 minutes, check Airflow `/dags/failed` endpoint."

### Case 2: DevOps SRE Bot (Kubernetes, AWS)

**Scenario:** A Site Reliability Engineer assistant that lives in Slack, triages PagerDuty alerts, and can safely read (but not write) AWS logs.

**JSON Payload:**
```json
{
  "name": "sre-guardian-claw",
  "tier": "pro",
  "model_mode": "deep",
  "soul_config": {
    "personality": "Vigilant Site Reliability Engineer. You are calm under pressure and prioritize system uptime and MTTR.",
    "instructions": "1. You are connected to PagerDuty webhooks. When an incident triggers, acknowledge it immediately.
2. Identify the affected service from the incident payload.
3. Query AWS CloudWatch for the last 15 minutes of logs for that service.
4. Query the Kubernetes cluster (read-only) for pod status and recent events in the relevant namespace.
5. Summarize the anomalies, potential root causes, and recommended mitigation steps.
6. Post this summary directly to the PagerDuty incident thread and the linked Slack channel.
7. NEVER execute destructive commands (e.g., kubectl delete, aws ec2 terminate).",
    "tone": "calm, authoritative, and concise",
    "language": "en"
  }
}
```
**Recommended Skills:** `pagerduty`, `aws_cloudwatch_readonly`, `kubectl_readonly`

### Case 3: Social Media Manager (Twitter, LinkedIn, Scheduling)

**Scenario:** An agent that reads tech news, drafts highly engaging tweets and LinkedIn posts, and schedules them.

**JSON Payload:**
```json
{
  "name": "growth-hacker-claw",
  "tier": "starter",
  "model_mode": "standard",
  "soul_config": {
    "personality": "Witty, engaging, and trendy social media manager who understands tech culture, memes, and algorithmic growth.",
    "instructions": "1. Scrape HackerNews (top 10) and TechCrunch daily at 9 AM EST.
2. Identify 3 trending topics relevant to developers and startups.
3. Draft 1 engaging Twitter thread (max 280 chars per tweet, 3-5 tweets) and 1 professional yet compelling LinkedIn post for each topic.
4. Send the drafts to me via Telegram for approval.
5. Wait for my response. If I reply 'approved', use the Buffer API to schedule the posts spread across the next 48 hours.
6. If I reply with edits, revise the drafts and resend.",
    "tone": "enthusiastic, witty, and engaging",
    "language": "en"
  }
}
```
**Recommended Skills:** `web_scraper`, `buffer_api`

### Case 4: Financial Analyst (SEC Filings, Market Scraping)

**Scenario:** A deep-research agent that pulls 10-K filings, parses XBRL data, and runs discounted cash flow (DCF) models in Python.

**JSON Payload:**
```json
{
  "name": "quant-analyst-claw",
  "tier": "ultimate",
  "model_mode": "reasoning",
  "soul_config": {
    "personality": "Rigorous, data-driven quantitative financial analyst. You rely solely on primary sources and hard data.",
    "instructions": "1. When asked to evaluate a stock ticker, immediately download its latest 10-K and 10-Q filings from the SEC EDGAR database.
2. Extract key financial metrics: revenue, operating income, free cash flow, debt, and shares outstanding.
3. Write and execute a Python script in your secure sandbox to build a Discounted Cash Flow (DCF) model using conservative growth assumptions.
4. Generate a detailed markdown report including the extracted metrics, the DCF valuation range, and a summary of the 'Risk Factors' section from the 10-K.
5. Present the final report with clear disclaimers that this is not financial advice.",
    "tone": "professional, objective, and analytical",
    "language": "en"
  }
}
```
**Recommended Skills:** `edgar_sec`, `python_sandbox`, `yfinance`

### Case 5: HR & Onboarding Assistant (Slack, Notion docs)

**Scenario:** A friendly agent that welcomes new hires in Slack, answers policy questions by reading the company Notion, and collects emergency contacts.

**JSON Payload:**
```json
{
  "name": "hr-buddy-claw",
  "tier": "starter",
  "model_mode": "standard",
  "soul_config": {
    "personality": "Warm, empathetic, and highly organized Human Resources assistant. You make everyone feel welcome.",
    "instructions": "1. When a user joins the Slack workspace, send them a warm welcome DM introducing yourself.
2. Provide them with links to the IT setup guide and the employee handbook.
3. Ask them to provide their emergency contact information, and record their response in the HR system.
4. When employees ask questions about policies (e.g., PTO, holidays, expenses), use the Notion API to search the employee handbook and provide a concise answer with a link to the source document.
5. If a question is too sensitive, related to payroll, or involves disputes, politely escalate the issue by tagging human-hr@company.com.",
    "tone": "warm, friendly, and helpful",
    "language": "en"
  }
}
```
**Recommended Skills:** `notion_search`, `slack_directory`

### Case 6: Cyber Security Threat Intel (CISA alerts, SIEM)

**Scenario:** An intelligence agent that monitors RSS feeds for zero-days, checks the internal SIEM for indicators of compromise (IoCs), and generates threat briefings.

**JSON Payload:**
```json
{
  "name": "threat-intel-claw",
  "tier": "pro",
  "model_mode": "deep",
  "soul_config": {
    "personality": "Paranoid but highly analytical threat intelligence officer. You prioritize speed and accuracy.",
    "instructions": "1. Continuously monitor CISA alerts, major security vendor blogs, and Twitter security researchers via RSS.
2. When a new vulnerability (CVE) is published with a CVSS score > 8.0, immediately parse the alert.
3. Extract any Indicators of Compromise (IoCs) such as malicious IP addresses, domains, or file hashes.
4. Query our internal Splunk API to determine if any of these IoCs have been observed in our network within the last 30 days.
5. Generate a Threat Intel Briefing detailing the CVE, the risk to our specific tech stack, and the results of the Splunk query.
6. Post the briefing immediately to the #security-alerts Slack channel.",
    "tone": "urgent, clinical, and precise",
    "language": "en"
  }
}
```
**Recommended Skills:** `rss_reader`, `splunk_api`, `cve_database`

### Case 7: Customer Support Triage (Zendesk, Email)

**Scenario:** A front-line support agent that reads incoming Zendesk tickets, categorizes them, attempts to solve simple questions, and routes complex issues.

**JSON Payload:**
```json
{
  "name": "support-triage-claw",
  "tier": "pro",
  "model_mode": "deep",
  "soul_config": {
    "personality": "Patient, polite, and highly efficient customer support representative.",
    "instructions": "1. Analyze all new incoming Zendesk tickets.
2. Tag each ticket with appropriate categories (e.g., 'billing', 'technical', 'feature-request', 'login-issue').
3. Determine the sentiment of the user (e.g., 'frustrated', 'neutral'). If frustrated, escalate priority.
4. If the ticket is a known technical question, search the documentation via Algolia and draft a polite, helpful reply to the user.
5. If the confidence in your answer is below 90%, do NOT reply to the user. Instead, add an internal note with your findings and reassign the ticket to the 'Tier 2 Human Support' group.",
    "tone": "empathetic, helpful, and professional",
    "language": "en"
  }
}
```
**Recommended Skills:** `zendesk_agent`, `algolia_search`

### Case 8: Executive Personal Assistant (Email, Calendar)

**Scenario:** A hyper-competent assistant that manages a CEO's inbox, negotiates meeting times over email, and sends daily briefings via WhatsApp.

**JSON Payload:**
```json
{
  "name": "executive-assistant-claw",
  "tier": "pro",
  "model_mode": "reasoning",
  "soul_config": {
    "personality": "Highly efficient, discreet, and proactive executive assistant. You act as an impenetrable but polite gatekeeper.",
    "instructions": "1. Monitor my connected Gmail inbox 24/7.
2. Automatically archive newsletters and polite reject cold sales pitches.
3. For emails requesting a meeting with me, check my Google Calendar for free 30-minute slots next week.
4. Reply to the sender offering 3 specific time options. If they confirm, send a calendar invite with a Google Meet link.
5. Flag emails from my board of directors or VIP clients with a 'URGENT' label.
6. Send me a WhatsApp message at 7:00 AM every day containing: my schedule for the day, a summary of urgent emails, and a brief weather report.",
    "tone": "professional, brief, and impeccably polite",
    "language": "en"
  }
}
```
**Recommended Skills:** `gmail_api`, `google_calendar`, `whatsapp_sender`

---

## 7. The Memory Architecture In-Depth

Claws possess two distinct forms of memory, enabling them to maintain context over vast timeframes:

1. **Short-Term Context (Sliding Window):** 
   The immediate conversation history. Older messages are progressively summarized and shifted out of the direct LLM context window to save token costs and prevent context degradation.
2. **Long-Term Vector Memory (RAG):** 
   Behind the scenes, the Claw automatically embeds key facts, user preferences, and file contents into an isolated Vector Store (using Pinecone or Milvus). 
   - When a user asks "What did we decide last month regarding the database migration?", the Claw queries its vector memory using semantic search.
   - It retrieves the relevant historical context chunks and injects them into the current prompt, allowing it to answer accurately as if it remembered the conversation perfectly.

---

## 8. Conclusion

FH Claw represents a paradigm shift from traditional API endpoints to persistent, thinking AI companions. By combining isolated execution environments, stateful vector memory, and rich communication channels, you can automate complex, multi-step workflows that previously required entire engineering teams to build and maintain.

Start building your first Claw today by issuing a `POST /v1/claws` request!

---

## 9. Troubleshooting & FAQ

**Q: My Claw keeps losing context after 100 messages, why?**
A: Ensure that Vector Memory is fully enabled for your tier. While the short-term sliding window handles recent messages, long-term semantic recall relies on the background embedding process. Check the `/v1/claws/:id/memory` endpoint to verify that `memory_vectors_count` is increasing.

**Q: Can I run custom Docker images in the Sandbox?**
A: Currently, the Firecracker MicroVM sandboxes run a hardened, standard Python/Node environment pre-loaded with common data science and utility libraries. Custom Docker images are only supported on the **Enterprise** tier via dedicated VPC peering.

**Q: How do I handle authentication for third-party APIs inside a Claw?**
A: Never hardcode API keys in the `soul_config`. Instead, use the FotoHub Secrets Manager. You can inject secrets into the Claw's environment variables by linking them during creation. The Claw can then access them securely via `os.environ`.

**Q: Why did my background run timeout?**
A: Background runs (`POST /v1/claws/:id/runs`) have a default timeout based on your tier. Starter tier times out at 5 minutes, Pro at 15 minutes, and Ultimate at 60 minutes. If your task requires more time, break it into smaller sub-tasks and have the Claw chain them using its internal scheduler.

**Q: How do I monitor my Claw's token usage in real-time?**
A: Use the FotoHub Web Console and navigate to **Billing > Agents**. You can also set up budget alerts that will notify you via email or Slack if a specific Claw exceeds its daily token allocation.

**Q: What happens to my data if I delete a Claw?**
A: Deleting a Claw via `DELETE /v1/claws/:id` is a hard delete. The container is destroyed, and the isolated Pinecone namespace containing its vector memory is permanently purged. Please export any important memories using the API before initiating a delete.

---

### End of Documentation
