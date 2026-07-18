# Agent Workflows

FOTOhub's Agent Engine is a full DAG-based workflow automation platform with Temporal orchestration, 8 built-in node types, and real-time execution streaming.

Build complex AI pipelines that chain image generation, LLM calls, HTTP actions, and custom code — all with visual editing, scheduling, and monitoring.

**Base URL:** `https://apis.fotohub.app/engine/v1`

**Requires:** Medium plan or higher

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Agent Engine                        │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐  │
│  │ Workflow  │───▶│ Planner  │───▶│   Temporal   │  │
│  │  CRUD    │    │ (compile)│    │   Worker     │  │
│  └──────────┘    └──────────┘    └──────────────┘  │
│                                         │           │
│  ┌──────────────────────────────────────┘           │
│  ▼                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Executor │──│  Nodes   │──│   Integrations   │  │
│  │  (DAG)   │  │ (8 types)│  │  (OAuth, MCP)    │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Workflow

A workflow is a directed acyclic graph (DAG) of nodes connected by edges. Each workflow has:

| Field | Type | Description |
|-------|------|-------------|
| `nodes` | NodeSpec[] | Processing steps |
| `edges` | EdgeSpec[] | Connections between nodes |
| `variables` | object | Shared workflow variables |
| `trigger` | TriggerSpec | How the workflow starts |
| `max_execution_time_s` | integer | Timeout (default: 3600) |
| `max_credits` | integer | Credit budget cap |
| `max_steps` | integer | Maximum node executions (default: 500) |
| `error_handler` | string | `"stop"` \| `"continue"` \| `"retry"` |

### Node Types

| Type | Description | Use Case |
|------|-------------|----------|
| `llm_agent` | Call any AI model (Anthropic, OpenAI, Google, etc.) | Text generation, analysis, decisions |
| `http_action` | Make HTTP requests to any API | External integrations, webhooks |
| `code_node` | Execute custom Python or JavaScript | Data transformation, logic |
| `edge_fn` | Call a Supabase Edge Function | Platform integrations |
| `mcp_node` | Use Model Context Protocol tools | Advanced AI tool use |
| `builtin_logic` | Conditionals, loops, switches | Flow control |
| `dispatch` | Fan-out parallel execution | Batch processing |

### NodeSpec

```json
{
  "id": "node_1",
  "type": "fotohub.image.generate",
  "position": [100, 200],
  "params": {
    "model": "seedream-5-0-260128",
    "prompt": "{{input.description}}",
    "width": 1024,
    "height": 1024
  },
  "credentials": {
    "api_key": "connection_abc123"
  },
  "retry": { "max_attempts": 3, "backoff": "exponential" },
  "timeout_s": 60,
  "continue_on_error": false,
  "disabled": false
}
```

### Triggers

| Type | Description |
|------|-------------|
| `manual` | Start via API call or UI button |
| `schedule` | Cron expression (e.g., `"0 9 * * MON"`) |
| `webhook` | Triggered by incoming HTTP request |
| `event` | Triggered by platform events |

---

## Endpoints

### Workflows

#### List Workflows

```
GET /v1/workflows?limit=50&offset=0&include_legacy=false
```

**Response:**
```json
{
  "workflows": [
    {
      "id": "wf_abc123",
      "name": "Daily Report Generator",
      "description": "Generates and emails daily analytics report",
      "tags": ["reporting", "automation"],
      "engine_version": 2,
      "active": true,
      "created_at": "2026-06-15T10:00:00Z",
      "updated_at": "2026-07-01T14:30:00Z",
      "last_executed_at": "2026-07-18T09:00:00Z",
      "total_executions": 33
    }
  ],
  "limit": 50,
  "offset": 0
}
```

#### Create Workflow

```
POST /v1/workflows
```

**Request:**
```json
{
  "name": "Image Batch Processor",
  "description": "Generate multiple image variants from a brief",
  "spec": {
    "nodes": [
      {
        "id": "input",
        "type": "builtin_logic",
        "params": { "operation": "extract_input" }
      },
      {
        "id": "generate",
        "type": "fotohub.image.generate",
        "params": {
          "model": "seedream-5-0-260128",
          "prompt": "{{input.prompt}}",
          "num_images": 4
        }
      },
      {
        "id": "store",
        "type": "http_action",
        "params": {
          "url": "{{variables.webhook_url}}",
          "method": "POST",
          "body": "{{generate.output}}"
        }
      }
    ],
    "edges": [
      { "id": "e1", "source": "input", "target": "generate" },
      { "id": "e2", "source": "generate", "target": "store" }
    ],
    "variables": {
      "webhook_url": "https://myapp.com/webhook/images"
    },
    "trigger": { "type": "manual" },
    "max_credits": 50
  },
  "tags": ["images", "batch"]
}
```

---

### Runs

#### Start a Run

```
POST /v1/runs
```

**Request:**
```json
{
  "workflow_id": "wf_abc123",
  "input": {
    "prompt": "A futuristic cityscape at night",
    "style": "cyberpunk"
  },
  "trigger_type": "manual",
  "credits_max": 20
}
```

**Response:**
```json
{
  "run_id": "run_xyz789",
  "temporal_workflow_id": "fotohub-run-xyz789",
  "status": "queued",
  "created_at": "2026-07-18T12:00:00Z"
}
```

#### Ad-hoc Run (without saving workflow)

```json
{
  "workflow_id": "wf_abc123",
  "spec_override": {
    "nodes": [...],
    "edges": [...]
  },
  "input": { "prompt": "test" }
}
```

#### Get Run Status

```
GET /v1/runs/{run_id}
```

**Response:**
```json
{
  "id": "run_xyz789",
  "workflow_id": "wf_abc123",
  "status": "running",
  "started_at": "2026-07-18T12:00:01Z",
  "current_node": "generate",
  "nodes_completed": 1,
  "nodes_total": 3,
  "credits_used": 4,
  "events": [...]
}
```

#### Stream Events (SSE)

```
GET /v1/runs/{run_id}/events
```

Returns a Server-Sent Events stream:

```
event: node_started
data: {"node_id": "generate", "timestamp": "2026-07-18T12:00:02Z"}

event: node_output
data: {"node_id": "generate", "output": {"images": [...]}, "credits_used": 4}

event: node_completed
data: {"node_id": "generate", "duration_ms": 3200}

event: run_completed
data: {"status": "completed", "total_credits": 4, "duration_ms": 5100}
```

---

### Schedules

```
GET    /v1/schedules           — List scheduled workflows
POST   /v1/schedules           — Create schedule (cron + workflow_id)
PATCH  /v1/schedules/:id       — Update schedule
DELETE /v1/schedules/:id       — Remove schedule
```

### Templates

```
GET    /v1/templates           — List pre-built workflow templates
GET    /v1/templates/:id       — Get template details
POST   /v1/templates/:id/use   — Create workflow from template
```

### Connections

```
GET    /v1/connections         — List OAuth/API connections
POST   /v1/connections         — Add new connection
DELETE /v1/connections/:id     — Remove connection
```

### Node Catalog

```
GET    /v1/nodes               — List all available node types
GET    /v1/nodes/:type         — Get node schema + docs
```

---

## Code Examples

### Python: Create and Run a Workflow

```python
import httpx

BASE = "https://apis.fotohub.app/engine/v1"
HEADERS = {"Authorization": "Bearer YOUR_API_KEY"}

# 1. Create workflow
workflow = httpx.post(f"{BASE}/workflows", headers=HEADERS, json={
    "name": "Product Photo Generator",
    "spec": {
        "nodes": [
            {
                "id": "enhance_prompt",
                "type": "llm_agent",
                "params": {
                    "model": "claude-sonnet-4-6",
                    "system": "You are a product photography director.",
                    "prompt": "Create a detailed prompt for: {{input.product}}"
                }
            },
            {
                "id": "generate_hero",
                "type": "fotohub.image.generate",
                "params": {
                    "model": "flux-2-pro",
                    "prompt": "{{enhance_prompt.output.text}}",
                    "width": 1536,
                    "height": 1024
                }
            },
            {
                "id": "generate_square",
                "type": "fotohub.image.generate",
                "params": {
                    "model": "flux-2-pro",
                    "prompt": "{{enhance_prompt.output.text}}, square crop",
                    "width": 1024,
                    "height": 1024
                }
            }
        ],
        "edges": [
            {"id": "e1", "source": "enhance_prompt", "target": "generate_hero"},
            {"id": "e2", "source": "enhance_prompt", "target": "generate_square"}
        ],
        "max_credits": 10
    }
}).json()

# 2. Start a run
run = httpx.post(f"{BASE}/runs", headers=HEADERS, json={
    "workflow_id": workflow["id"],
    "input": {"product": "minimalist leather wallet, white background"}
}).json()

print(f"Run started: {run['run_id']}")

# 3. Poll for completion
import time
while True:
    status = httpx.get(f"{BASE}/runs/{run['run_id']}", headers=HEADERS).json()
    if status["status"] in ("completed", "failed", "timed_out"):
        break
    time.sleep(2)

print(f"Status: {status['status']}, Credits: {status['credits_used']}")
```

### TypeScript: Stream Run Events

```typescript
const runId = 'run_xyz789';

const eventSource = new EventSource(
  `https://apis.fotohub.app/engine/v1/runs/${runId}/events`,
  { headers: { Authorization: `Bearer ${apiKey}` } }
);

eventSource.addEventListener('node_started', (e) => {
  const data = JSON.parse(e.data);
  console.log(`Node ${data.node_id} started`);
});

eventSource.addEventListener('node_output', (e) => {
  const data = JSON.parse(e.data);
  console.log(`Node ${data.node_id} output:`, data.output);
});

eventSource.addEventListener('run_completed', (e) => {
  const data = JSON.parse(e.data);
  console.log(`Run done! Credits used: ${data.total_credits}`);
  eventSource.close();
});

eventSource.addEventListener('error', (e) => {
  console.error('Stream error:', e);
  eventSource.close();
});
```

---

## Node Execution Model

Each node produces a `NodeOutput`:

```json
{
  "ok": true,
  "output": {
    "main": { "images": ["https://..."] }
  },
  "credits_used": 2,
  "error": null,
  "logs": [
    {"level": "info", "message": "Generated 1 image", "ts": "..."}
  ],
  "duration_ms": 2840
}
```

Nodes reference upstream outputs via template expressions: `{{node_id.output.port.field}}`

---

## Limits & Pricing

| Tier | Workflows | Concurrent Runs | Max Credits/Run | Max Execution Time |
|------|-----------|-----------------|-----------------|-------------------|
| Free | 0 | 0 | - | - |
| Starter | 0 | 0 | - | - |
| Medium | 10 | 3 | 100 | 1 hour |
| Pro | 50 | 10 | 500 | 4 hours |
| Business | 200 | 25 | 2000 | 12 hours |
| Enterprise | Unlimited | 100 | Custom | 24 hours |

Credits are deducted per node execution (same rates as direct API calls).

---

## Error Handling

The `error_handler` field controls behavior when a node fails:

| Mode | Behavior |
|------|----------|
| `stop` | Abort the entire run immediately |
| `continue` | Skip the failed node, continue with remaining DAG |
| `retry` | Retry the node (up to `retry.max_attempts`) |

Individual nodes can override with `continue_on_error: true`.

### Stuck Run Recovery

Runs stuck in `running` for >1 hour are automatically marked as `timed_out` by a background reaper (every 5 minutes).
