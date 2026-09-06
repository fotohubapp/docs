# Scheduled Tasks & Recurring Cron Workflows

Automate recurring agent tasks, automated data audits, and batch generation pipelines using the **Agent Scheduler** (`server/agent-compute/app/routes_templates.py`).

Schedules support full standard 5-part Linux cron syntax, custom timezone specifications (`Europe/Warsaw`, `UTC`, `America/New_York`), automated retry policies, and post-action dispatching.

---

## Schedule Lifecycle Architecture

```mermaid
flowchart LR
    A["Cron Trigger (e.g. '0 9 * * 1')"] --> B["Scheduler Engine (APScheduler)"]
    B --> C["Pre-Flight Wallet Check"]
    C -->|Balance OK| D["Dispatch Task (Template / Prompt)"]
    D --> E["Firecracker MicroVM / Agent Orchestrator"]
    E --> F{"Task Result"}
    
    F -->|Success| G["Post Actions"]
    G --> H["Send Email / Webhook / Chain Task"]
    
    F -->|Failure| I{"Retry Policy Configured?"}
    I -->|Yes (max 2 retries)| J["Wait delay_minutes & Re-attempt"]
    I -->|No| K["Dispatch Failure Webhook"]
```

---

## 1. Creating a Recurring Schedule

Submit a cron definition with explicit post-actions and failure handling:

### Endpoint: `POST /v1/schedules`

::: code-group

```python [Python]
from fotohub import FotoHub
import os

client = FotoHub(api_key=os.environ["FOTOHUB_API_KEY"])

schedule = client.post("/v1/schedules", {
    "description": "Weekly Competitor Pricing Audit",
    "schedule": "0 9 * * 1",  # Every Monday at 09:00 AM
    "timezone": "Europe/Warsaw",
    "variables": {
        "competitor_urls": "https://brand-a.com,https://brand-b.com",
        "category": "apparel"
    },
    "post_actions": {
        "send_notification": True,
        "send_email": True,
        "email_to": "analytics@yourbrand.com",
        "save_result": True,
        "save_to_folder": "/reports/pricing",
        "webhook_url": "https://api.yourbrand.com/webhooks/pricing-report"
    },
    "retry_config": {
        "retry_on_failure": True,
        "max_retries": 2,
        "retry_delay_minutes": 15
    },
    "auto_execute": True,
    "priority": 2
})

print(f"Schedule registered: {schedule['schedule_id']}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function createDailyBackupSchedule() {
  const res = await client.post("/v1/schedules", {
    description: "Daily Model Weights Backup to S3",
    schedule: "0 2 * * *", // 2:00 AM daily
    timezone: "UTC",
    post_actions: {
      webhook_url: "https://ops.yourdomain.com/backup-complete",
      send_notification: true,
    },
  });

  console.log("Schedule ID:", res.data.schedule_id);
}

createDailyBackupSchedule();
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/schedules   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "description": "Hourly Log Aggregation",
    "schedule": "0 * * * *",
    "timezone": "UTC",
    "auto_execute": true
  }'
```

:::

---

## 2. Managing & Pausing Schedules

Toggle schedules on and off without deleting their configuration:

```bash
# Pause or resume an active schedule
curl -X POST https://apis.fotohub.app/v1/schedules/sch_91283abc/toggle   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{"active": false}'
```

---

## 3. Pre-Built Task Templates

Explore available system templates via `GET /v1/templates`:

| Template ID | Category | Description | Default Priority |
|:---|:---|:---|:---:|
| `competitor_price_tracker` | `market_research` | Scrapes target e-commerce sites and builds pricing variance matrix. | `2` (High) |
| `seo_keyword_serp_audit` | `marketing` | Tracks Google ranking positions for primary brand keywords. | `3` (Normal) |
| `social_calendar_generator` | `content` | Produces 7 days of synchronized multi-platform video/image copy. | `3` (Normal) |
| `database_health_check` | `devops` | Checks query latency, index bloat, and connection pool saturation. | `1` (Critical) |

Execute any template instantly:
```bash
curl -X POST https://apis.fotohub.app/v1/templates/competitor_price_tracker/run   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "variables": {"target_domain": "competitor.com"}
  }'
```
