# Agent Workflows

FOTOhub's Agent Engine is a DAG-based workflow automation platform with Temporal orchestration, 16 node categories, real-time SSE streaming, MCP tool integration, and built-in analytics.

Build complex AI pipelines that chain image generation, video creation, audio processing, LLM agent loops, HTTP actions, and custom logic — with visual editing, scheduling, webhooks, and monitoring.

**Base URL:** `https://apis.fotohub.app/engine/v1`

**Authentication:** Bearer token (JWT or API key) in the `Authorization` header.

**Requires:** Medium plan or higher.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Agent Engine                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌────────────┐   ┌────────────┐   ┌─────────────────────────┐  │
│  │  REST API  │──▶│  Planner   │──▶│   Temporal Workflow      │  │
│  │  (FastAPI) │   │ (validate, │   │   (durable execution,   │  │
│  │            │   │  compile)  │   │    retries, signals)     │  │
│  └────────────┘   └────────────┘   └─────────────────────────┘  │
│        │                                     │                   │
│        │          ┌──────────────────────────┘                   │
│        │          ▼                                               │
│        │   ┌──────────────────────────────────────────────┐      │
│        │   │            DAG Executor                       │      │
│        │   │  (topological order, parallel branches)       │      │
│        │   └──────────────────────────────────────────────┘      │
│        │                    │                                     │
│        ▼                    ▼                                     │
│  ┌──────────┐   ┌──────────────────────────────────────────┐    │
│  │   SSE    │   │            Node Runtime                   │    │
│  │  Events  │   │  ┌────────┐ ┌─────────┐ ┌────────────┐  │    │
│  └──────────┘   │  │AI Agent│ │ FOTOhub │ │Integrations│  │    │
│                  │  │(LLM +  │ │(image,  │ │(HTTP, MCP, │  │    │
│  ┌──────────┐   │  │ tools) │ │video,   │ │email,      │  │    │
│  │Connectors│   │  └────────┘ │audio)   │ │storage)    │  │    │
│  │(secrets) │   │             └─────────┘ └────────────┘  │    │
│  └──────────┘   └──────────────────────────────────────────┘    │
│                                                                    │
│  ┌──────────┐   ┌──────────┐   ┌─────────────────────────┐     │
│  │Schedules │   │Knowledge │   │  Analytics / Tests       │     │
│  │(cron)    │   │(RAG docs)│   │  (evaluation, QA)       │     │
│  └──────────┘   └──────────┘   └─────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### WorkflowSpec

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `nodes` | NodeSpec[] | required | Processing steps in the graph |
| `edges` | EdgeSpec[] | required | Connections between nodes |
| `variables` | object | `{}` | Shared workflow-level variables |
| `trigger` | TriggerSpec | required | How the workflow starts (`manual`\|`schedule`\|`webhook`\|`event`) |
| `max_execution_time_s` | integer | `3600` | Maximum wall-clock time in seconds |
| `max_credits` | integer \| null | `null` | Credit budget cap for entire run |
| `max_steps` | integer | `500` | Maximum total node executions |
| `error_handler` | string | `"stop"` | `"stop"` \| `"continue"` \| `"retry"` |

### NodeSpec

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | required | Unique identifier within the workflow |
| `type` | string | required | Node type (e.g., `"fotohub.image.generate"`) |
| `position` | [number, number] | required | Visual canvas position `[x, y]` |
| `params` | object | `{}` | Parameters (schema-driven from node definition) |
| `credentials` | object | `{}` | Map of credential slot to connection_id |
| `retry` | object \| null | `null` | `{max_attempts, backoff}` retry config |
| `timeout_s` | integer \| null | `null` | Per-node timeout in seconds |
| `continue_on_error` | boolean | `false` | Whether to proceed when this node fails |
| `disabled` | boolean | `false` | Skip this node during execution |
| `notes` | string \| null | `null` | Developer notes (not executed) |

### EdgeSpec

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | required | Unique edge identifier |
| `source` | string | required | Source node id |
| `source_port` | string | `"main"` | Output port on source node |
| `target` | string | required | Target node id |
| `target_port` | string | `"main"` | Input port on target node |
| `animated` | boolean | `false` | Visual animation in editor |

### NodeOutput

Every node execution produces a `NodeOutput`:

```json
{
  "ok": true,
  "output": { "main": { "images": ["https://..."] } },
  "credits_used": 2,
  "error": null,
  "logs": [{ "level": "info", "message": "Generated 1 image", "ts": "2026-07-18T12:00:03Z" }],
  "duration_ms": 2840
}
```

### Template Expressions

Nodes reference upstream outputs using: `&#123;&#123;node_id.output.port.field&#125;&#125;`

- `&#123;&#123;input.output.main.prompt&#125;&#125;` — prompt from the input node
- `&#123;&#123;generate.output.main.images[0]&#125;&#125;` — first image URL from generate node
- `&#123;&#123;variables.webhook_url&#125;&#125;` — a workflow-level variable

---

## Node Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `ai_agent` | Tool-using AI loop | LLM with tool calls, configurable models |
| `core_io` | Input/Output | Workflow input/output definitions |
| `core_logic` | Flow control | Conditionals, loops, switches |
| `core_triggers` | Trigger definitions | Manual, schedule, webhook, event |
| `fotohub_image` | Image generation | Generate and edit images |
| `fotohub_image_ext` | Extended image ops | Advanced transformations |
| `fotohub_video` | Video generation | Create videos from prompts/images |
| `fotohub_video_ext` | Extended video ops | Advanced video processing |
| `fotohub_audio` | Audio generation | Generate music and audio |
| `fotohub_audio_ext` | Extended audio | Audio post-processing |
| `fotohub_brand` | Brand assets | Brand-aware generation |
| `fotohub_social` | Social media | Publish to social platforms |
| `integrations` | External services | HTTP requests, email |
| `knowledge_nodes` | RAG/Retrieval | Document search and retrieval |
| `logic_ext` | Advanced logic | Complex routing and transforms |
| `storage` | File operations | S3, file storage |

### AI Agent Node Details

The `ai_agent` node runs a multi-turn tool-using loop powered by FOTOhub AI (proprietary):

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model` | string | required | Model identifier (e.g., `"claude-sonnet-4-6"`) |
| `system` | string | `""` | System prompt |
| `prompt` | string | required | User prompt (supports template expressions) |
| `tools` | string[] | `[]` | Tool IDs available to the agent |
| `tool_strategy` | string | `"auto"` | `"auto"` (LLM decides) \| `"required"` (must use) \| `"none"` (disabled) |
| `max_steps` | integer | `15` | Maximum LLM turns in the loop |
| `max_credits` | integer \| null | `null` | Credit cap for this agent node |
| `temperature` | number | `0.7` | Sampling temperature |

The agent builds messages, calls the LLM, dispatches any `tool_use` blocks, appends results, and loops until the LLM produces a final response or limits are reached. Credits are calculated per-token based on model pricing.

---

## Execution Model

1. **Start** — Client calls `POST /v1/runs`
2. **Compile** — Planner validates DAG, checks for cycles, resolves types
3. **Queue** — Insert `agent_runs` row with `status='queued'`
4. **Enqueue** — Submit to Temporal workflow engine
5. **Execute** — DAG executor walks nodes in topological order; parallel branches run concurrently
6. **Output** — Each node produces `NodeOutput` (ok/error + output ports)
7. **Resolve** — Downstream nodes access upstream data via `&#123;&#123;node_id.output.port.field&#125;&#125;`
8. **Stream** — SSE events emitted: `node_started`, `node_output`, `node_completed`, `run_finished`
9. **Terminate** — Run reaches: `completed`, `failed`, `timed_out`, or `cancelled`

### Stuck Run Recovery

A background reaper runs every 5 minutes, marking any run stuck in `running` for more than 1 hour as `timed_out`.

---

## Endpoints: Workflows

### List Workflows

```http
GET /v1/workflows?limit=50&offset=0&include_legacy=false
```

### Create Workflow

```http
POST /v1/workflows
```

```json
{
  "name": "Image Batch Processor",
  "description": "Generate multiple image variants from a brief",
  "spec": {
    "nodes": [
      { "id": "input", "type": "core_io.input", "position": [0, 100], "params": {} },
      {
        "id": "generate", "type": "fotohub.image.generate", "position": [300, 100],
        "params": { "model": "seedream-5-0-260128", "prompt": "&#123;&#123;input.output.main.prompt}}", "width": 1024, "height": 1024 },
        "retry": { "max_attempts": 3, "backoff": "exponential" }
      }
    ],
    "edges": [{ "id": "e1", "source": "input", "target": "generate" }],
    "variables": {},
    "trigger": { "type": "manual", "config": {} },
    "max_credits": 50,
    "error_handler": "retry"
  },
  "tags": ["images", "batch"]
}
```

### Get Workflow

```http
GET /v1/workflows/{workflow_id}
```

### Update Workflow

```http
PUT /v1/workflows/{workflow_id}
```

All fields optional: `name`, `description`, `spec`, `tags`, `active`.

### Delete Workflow

```http
DELETE /v1/workflows/{workflow_id}
```

::: warning
Deleting a workflow does not cancel active runs. Cancel them first.
:::

### Duplicate Workflow

```http
POST /v1/workflows/{workflow_id}/duplicate
```

Creates a copy with `"(Copy)"` appended to the name.

---

## Endpoints: Runs

### Start a Run

```http
POST /v1/runs
```

```json
{
  "workflow_id": "wf_abc123",
  "input": { "prompt": "A futuristic cityscape at night", "style": "cyberpunk" },
  "trigger_type": "manual",
  "credits_max": 20,
  "spec_override": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow_id` | string | yes | Workflow to execute |
| `input` | object | yes | Input data for the workflow |
| `trigger_type` | string | no | `"manual"` \| `"schedule"` \| `"webhook"` \| `"test"` |
| `credits_max` | integer | no | Override per-run credit cap |
| `spec_override` | WorkflowSpec | no | Ad-hoc spec (run without saving changes) |

**Response:**

```json
{
  "run_id": "run_xyz789",
  "temporal_workflow_id": "fotohub-run-xyz789",
  "status": "queued",
  "created_at": "2026-07-18T12:00:00Z"
}
```

### List Runs

```http
GET /v1/runs?workflow_id=wf_abc123&limit=50
```

### Get Run Status

```http
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
  "credits_max": 20,
  "node_outputs": {
    "enhance": {
      "ok": true,
      "output": { "main": { "text": "A sprawling neon-lit metropolis..." } },
      "credits_used": 2,
      "duration_ms": 1800
    }
  }
}
```

### Cancel a Run

```http
POST /v1/runs/{run_id}/cancel
```

Immediately stops the workflow. Status transitions to `cancelled`.

### Retry a Run

```http
POST /v1/runs/{run_id}/retry
```

Creates a new run from a `failed`, `cancelled`, or `timed_out` run using the same spec and input. Returns a new `run_id`.

### Send Signal

```http
POST /v1/runs/{run_id}/signals/{signal_name}
```

| Signal Name | Purpose |
|-------------|---------|
| `approve` | Approve a pending human-in-the-loop step |
| `webhook` | Continue with webhook data payload |
| `cancel` | Cancel the run via signal |

```json
{
  "payload": { "approved": true, "comment": "Looks good, proceed" }
}
```

### Stream Events (SSE)

```http
GET /v1/runs/{run_id}/events?since_seq=0
```

Returns a Server-Sent Events stream. Use `since_seq` for reconnection (each event has a monotonically increasing `seq`).

**Event types:**

| Event | Fields | Description |
|-------|--------|-------------|
| `node_started` | `node_id`, `seq`, `timestamp` | Node begins execution |
| `node_output` | `node_id`, `seq`, `output`, `credits_used` | Node produced output |
| `node_completed` | `node_id`, `seq`, `duration_ms`, `ok` | Node finished |
| `run_finished` | `seq`, `status`, `total_credits`, `duration_ms` | Run reached terminal state |

**Example stream:**

```
event: node_started
data: {"node_id": "enhance", "seq": 1, "timestamp": "2026-07-18T12:00:02Z"}

event: node_output
data: {"node_id": "enhance", "seq": 2, "output": {"main": {"text": "..."}}, "credits_used": 2}

event: node_completed
data: {"node_id": "enhance", "seq": 3, "duration_ms": 1800, "ok": true}

event: node_started
data: {"node_id": "generate_hero", "seq": 4, "timestamp": "2026-07-18T12:00:04Z"}

event: node_started
data: {"node_id": "generate_square", "seq": 5, "timestamp": "2026-07-18T12:00:04Z"}

event: node_completed
data: {"node_id": "generate_hero", "seq": 6, "duration_ms": 3200, "ok": true}

event: node_completed
data: {"node_id": "generate_square", "seq": 7, "duration_ms": 3400, "ok": true}

event: run_finished
data: {"seq": 8, "status": "completed", "total_credits": 8, "duration_ms": 5200}
```

::: tip
Parallel branches execute concurrently. Note both `generate_hero` and `generate_square` start before either completes.
:::

---

## Endpoints: Schedules

### List Schedules

```http
GET /v1/schedules
```

### Create Schedule

```http
POST /v1/schedules
```

```json
{
  "workflow_id": "wf_abc123",
  "cron": "0 9 * * MON-FRI",
  "timezone": "Europe/Warsaw",
  "active": true
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `workflow_id` | string | required | Workflow to schedule |
| `cron` | string | required | Standard 5-field cron expression |
| `timezone` | string | `"Europe/Warsaw"` | IANA timezone for cron evaluation |
| `active` | boolean | `true` | Whether the schedule is enabled |

### Update Schedule

```http
PATCH /v1/schedules/{schedule_id}
```

Fields: `active`, `cron`, `timezone` (all optional).

### Delete Schedule

```http
DELETE /v1/schedules/{schedule_id}
```

---

## Endpoints: Templates

### List Templates

```http
GET /v1/templates?category=marketing&difficulty=beginner&featured=true&limit=50
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category |
| `difficulty` | string | `"beginner"` \| `"intermediate"` \| `"advanced"` |
| `featured` | boolean | Show only featured templates |
| `limit` | integer | Max results (default 50) |

### Get Template Details

```http
GET /v1/templates/{template_id}
```

Returns full template including workflow spec, required connections, and setup instructions.

### Install Template

```http
POST /v1/templates/{template_id}/install
```

Creates a new workflow from the template. Increments the template's `use_count`.

---

## Endpoints: Connections

Connections store credentials securely. Secrets are never exposed in API responses.

### List Connections

```http
GET /v1/connections
```

### Create Connection

```http
POST /v1/connections
```

```json
{
  "provider": "openai",
  "name": "Production OpenAI",
  "secret": "sk-...",
  "metadata": { "model_access": ["gpt-4o"] }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | string | yes | Service provider identifier |
| `name` | string | yes | Human-readable name |
| `secret` | string | yes | API key or token (stored encrypted) |
| `metadata` | object | no | Additional configuration |

::: warning
Secrets are stored encrypted at rest and only decrypted during node execution. They are never returned in API responses.
:::

### Delete Connection

```http
DELETE /v1/connections/{connection_id}
```

### Test Connection

```http
POST /v1/connections/{connection_id}/test
```

Validates stored credentials by making a test request to the provider.

```json
{ "valid": true, "latency_ms": 142, "message": "Connection successful" }
```

---

## Endpoints: Node Catalog

### List Node Types

```http
GET /v1/nodes?category=fotohub_image&subcategory=generate&tag=pro
```

### Get Node Definition

```http
GET /v1/nodes/{node_type}
```

Returns full definition including parameter JSON Schema, port definitions, credential slots, and examples.

```json
{
  "type": "fotohub.image.generate",
  "category": "fotohub_image",
  "name": "Generate Image",
  "params_schema": {
    "type": "object",
    "properties": {
      "model": { "type": "string", "enum": ["seedream-5-0-260128", "flux-2-pro"] },
      "prompt": { "type": "string" },
      "width": { "type": "integer", "default": 1024 },
      "height": { "type": "integer", "default": 1024 }
    },
    "required": ["model", "prompt"]
  },
  "inputs": [{ "name": "main", "schema": {} }],
  "outputs": [{ "name": "main", "schema": { "images": "string[]" } }]
}
```

---

## Endpoints: Tools

### Per-Workflow Tools

```http
GET /v1/tools/workflow/{workflow_id}
```

List active tools for a workflow.

```http
POST /v1/tools/workflow/{workflow_id}
```

Upsert a tool (creates or updates):

```json
{ "tool_id": "web_search", "category": "search", "active": true, "config": { "max_results": 10 } }
```

```http
DELETE /v1/tools/workflow/{workflow_id}/{tool_id}
```

### MCP Servers

```http
GET /v1/tools/mcp
```

List registered MCP servers.

```http
POST /v1/tools/mcp
```

Register a new MCP server:

```json
{ "name": "Knowledge Base", "url": "https://mcp.example.com/sse", "transport": "sse", "auth_token": "Bearer token_..." }
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Human-readable server name |
| `url` | string | yes | MCP server endpoint URL |
| `transport` | string | yes | `"sse"` \| `"stdio"` |
| `auth_token` | string | no | Authentication token |

```http
POST /v1/tools/mcp/{server_id}/discover
```

Re-discover tools from the MCP server. Returns updated tool list.

```http
DELETE /v1/tools/mcp/{server_id}
```

---

## Endpoints: Knowledge

Knowledge documents provide RAG context to AI agent nodes.

```http
GET /v1/knowledge?workflow_id=wf_abc123
```

```http
POST /v1/knowledge
```

```json
{
  "workflow_id": "wf_abc123",
  "title": "Brand Guidelines",
  "source_type": "url",
  "source_url": "https://example.com/brand-guide.pdf"
}
```

Or with inline text:

```json
{
  "workflow_id": "wf_abc123",
  "title": "Product Catalog",
  "source_type": "text",
  "text": "Our flagship product is the FotoLens Pro..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow_id` | string | yes | Parent workflow |
| `title` | string | yes | Document title |
| `source_type` | string | yes | `"url"` \| `"text"` |
| `source_url` | string | conditional | URL to fetch (when `"url"`) |
| `text` | string | conditional | Inline content (when `"text"`) |

```http
DELETE /v1/knowledge/{doc_id}
```

---

## Endpoints: Analytics

Define evaluation criteria and data points for automated run analysis.

### Criteria

```http
GET /v1/analytics/criteria/{workflow_id}
```

```http
POST /v1/analytics/criteria
```

```json
{
  "workflow_id": "wf_abc123",
  "name": "Brand Consistency",
  "description": "How well output matches brand guidelines",
  "weight": 0.4,
  "llm_prompt": "Rate brand consistency from 1-10. Consider color palette, tone, and visual style."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow_id` | string | yes | Parent workflow |
| `name` | string | yes | Criterion name |
| `description` | string | yes | What this measures |
| `weight` | number | yes | Weight in composite score (0-1) |
| `llm_prompt` | string | yes | Prompt sent to evaluator LLM |

```http
DELETE /v1/analytics/criteria/{id}
```

### Data Points

```http
GET /v1/analytics/data-points/{workflow_id}
```

```http
POST /v1/analytics/data-points
```

```json
{
  "workflow_id": "wf_abc123",
  "name": "generation_time",
  "data_type": "number",
  "description": "Total generation time in seconds",
  "enum_values": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow_id` | string | yes | Parent workflow |
| `name` | string | yes | Data point identifier |
| `data_type` | string | yes | `"string"` \| `"number"` \| `"boolean"` \| `"enum"` |
| `description` | string | yes | What this captures |
| `enum_values` | string[] | conditional | Valid values (when `"enum"`) |

```http
DELETE /v1/analytics/data-points/{id}
```

### Run Analyses

```http
GET /v1/analytics/run-analyses/{workflow_id}?limit=50
```

Returns evaluated results for past runs:

```json
{
  "analyses": [{
    "id": "analysis_001",
    "run_id": "run_xyz789",
    "scores": { "Output Quality": 8.5, "Brand Consistency": 7.2 },
    "composite_score": 7.98,
    "data_points": { "output_format": "image", "generation_time": 5.1 },
    "analyzed_at": "2026-07-18T12:01:00Z"
  }]
}
```

---

## Endpoints: Tests

Workflow tests define assertions that validate run outputs.

### List Tests

```http
GET /v1/tests/workflow/{workflow_id}
```

### Create Test

```http
POST /v1/tests
```

```json
{
  "workflow_id": "wf_abc123",
  "name": "Basic generation test",
  "kind": "assertion",
  "input": { "prompt": "A red apple on a white table" },
  "assertions": [
    { "path": "generate.output.main.images", "operator": "length_gte", "value": 1 },
    { "path": "generate.ok", "operator": "eq", "value": true },
    { "path": "generate.credits_used", "operator": "lte", "value": 5 }
  ]
}
```

**Assertion operators:** `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `contains`, `length_gte`, `length_lte`, `exists`

### Delete Test

```http
DELETE /v1/tests/{test_id}
```

### Run Test

```http
POST /v1/tests/{test_id}/run
```

Creates a run with `trigger_type="test"` and evaluates assertions against output:

```json
{
  "test_id": "test_001",
  "run_id": "run_test_456",
  "result": "passed",
  "assertions": [
    { "path": "generate.output.main.images", "operator": "length_gte", "value": 1, "actual": 2, "passed": true },
    { "path": "generate.credits_used", "operator": "lte", "value": 5, "actual": 3, "passed": true }
  ],
  "duration_ms": 4200
}
```

---

## Endpoints: Webhooks

Public webhook endpoint for triggering workflows (no Bearer token required).

```http
POST /v1/hooks/{webhook_id}/{path}
```

The `webhook_id` is assigned to a workflow's webhook trigger. The `path` allows routing different events.

**HMAC Verification (optional):** Include `x-fh-signature: sha256=<hex-hmac>` header. The HMAC secret is configured in the workflow's trigger settings.

**Request body:** Any valid JSON, passed as workflow `input`.

**Response:** `200 OK` with `{ "run_id": "run_hook_789", "status": "queued" }`

---

## Endpoints: Widget

Widgets embed workflow interactions in external applications.

### Get Widget Config

```http
GET /v1/widget/{workflow_id}
```

### Upsert Widget Config

```http
PUT /v1/widget/{workflow_id}
```

```json
{
  "workflow_id": "wf_abc123",
  "interface": {
    "title": "Photo Generator",
    "description": "Generate product photos from descriptions",
    "fields": [
      { "name": "prompt", "type": "text", "label": "Description", "required": true },
      { "name": "style", "type": "select", "label": "Style", "options": ["minimal", "lifestyle"] }
    ]
  },
  "allowed_domains": ["https://myapp.com", "https://staging.myapp.com"],
  "collect_feedback": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow_id` | string | yes | Target workflow |
| `interface` | object | yes | Widget UI config (title, fields, etc.) |
| `allowed_domains` | string[] | yes | CORS-allowed embed domains |
| `collect_feedback` | boolean | no | Collect user feedback on outputs |

---

## Code Examples

### Python: Create and Run a Workflow

```python
import httpx
import time

BASE = "https://apis.fotohub.app/engine/v1"
HEADERS = {"Authorization": "Bearer YOUR_API_KEY"}

# Create workflow
workflow = httpx.post(f"{BASE}/workflows", headers=HEADERS, json={
    "name": "Product Photo Generator",
    "spec": {
        "nodes": [
            {"id": "input", "type": "core_io.input", "position": [0, 100], "params": {}},
            {
                "id": "enhance_prompt", "type": "ai_agent", "position": [300, 100],
                "params": {
                    "model": "claude-sonnet-4-6",
                    "system": "You are a product photography director.",
                    "prompt": "Create a detailed prompt for: &#123;&#123;input.output.main.product}}",
                    "max_steps": 5
                }
            },
            {
                "id": "generate", "type": "fotohub.image.generate", "position": [600, 100],
                "params": {"model": "seedream-5-0-260128", "prompt": "&#123;&#123;enhance_prompt.output.main.text}}", "width": 1536, "height": 1024},
                "retry": {"max_attempts": 2, "backoff": "exponential"}
            }
        ],
        "edges": [
            {"id": "e1", "source": "input", "target": "enhance_prompt"},
            {"id": "e2", "source": "enhance_prompt", "target": "generate"}
        ],
        "trigger": {"type": "manual", "config": {}},
        "max_credits": 15
    }
}).json()

# Start a run
run = httpx.post(f"{BASE}/runs", headers=HEADERS, json={
    "workflow_id": workflow["id"],
    "input": {"product": "minimalist leather wallet, white background"}
}).json()

# Poll for completion
while True:
    status = httpx.get(f"{BASE}/runs/{run['run_id']}", headers=HEADERS).json()
    if status["status"] in ("completed", "failed", "timed_out", "cancelled"):
        break
    time.sleep(2)

print(f"Status: {status['status']}, Credits: {status['credits_used']}")
```

### Python: Stream Events (SSE)

```python
import httpx
import json

BASE = "https://apis.fotohub.app/engine/v1"
HEADERS = {"Authorization": "Bearer YOUR_API_KEY"}

with httpx.stream("GET", f"{BASE}/runs/run_xyz789/events", headers=HEADERS) as response:
    event_type = ""
    for line in response.iter_lines():
        if line.startswith("event:"):
            event_type = line[7:]
        elif line.startswith("data:"):
            data = json.loads(line[6:])
            if event_type == "node_started":
                print(f"[START] {data['node_id']}")
            elif event_type == "node_completed":
                print(f"[DONE]  {data['node_id']} ({data['duration_ms']}ms)")
            elif event_type == "run_finished":
                print(f"Run {data['status']} - Credits: {data['total_credits']}")
                break
```

### Python: Schedules and MCP

```python
import httpx

BASE = "https://apis.fotohub.app/engine/v1"
HEADERS = {"Authorization": "Bearer YOUR_API_KEY"}

# Schedule a workflow
schedule = httpx.post(f"{BASE}/schedules", headers=HEADERS, json={
    "workflow_id": "wf_abc123",
    "cron": "0 9 * * MON-FRI",
    "timezone": "Europe/Warsaw"
}).json()

# Register an MCP server
server = httpx.post(f"{BASE}/tools/mcp", headers=HEADERS, json={
    "name": "Company KB",
    "url": "https://mcp.internal.example.com/sse",
    "transport": "sse",
    "auth_token": "Bearer internal_token_..."
}).json()

# Discover its tools
discovery = httpx.post(f"{BASE}/tools/mcp/{server['id']}/discover", headers=HEADERS).json()
print(f"Discovered {discovery['tools_discovered']} tools")
```

### TypeScript: Stream Events

```typescript
const BASE = "https://apis.fotohub.app/engine/v1";
const API_KEY = "YOUR_API_KEY";

// Start a run
const { run_id } = await fetch(`${BASE}/runs`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    workflow_id: "wf_abc123",
    input: { prompt: "A serene mountain landscape at golden hour" },
  }),
}).then(r => r.json());

// Stream events (use eventsource-polyfill for custom headers)
const eventSource = new EventSource(`${BASE}/runs/${run_id}/events`);

eventSource.addEventListener("node_started", (e: MessageEvent) => {
  console.log(`[START] ${JSON.parse(e.data).node_id}`);
});

eventSource.addEventListener("node_completed", (e: MessageEvent) => {
  const { node_id, duration_ms } = JSON.parse(e.data);
  console.log(`[DONE] ${node_id} (${duration_ms}ms)`);
});

eventSource.addEventListener("run_finished", (e: MessageEvent) => {
  const { status, total_credits } = JSON.parse(e.data);
  console.log(`Run ${status} - Credits: ${total_credits}`);
  eventSource.close();
});
```

### TypeScript: Human-in-the-Loop Signals

```typescript
const BASE = "https://apis.fotohub.app/engine/v1";
const API_KEY = "YOUR_API_KEY";

// Approve a pending step
async function approveStep(runId: string, approved: boolean, comment?: string) {
  await fetch(`${BASE}/runs/${runId}/signals/approve`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ payload: { approved, comment } }),
  });
}

// Usage: workflow pauses at a wait_signal node, your app detects it and presents to user
await approveStep("run_xyz789", true, "Image quality approved, proceed to publish");
```

---

## Error Handling

### Workflow-Level Error Handler

| Mode | Behavior |
|------|----------|
| `stop` | Abort the entire run immediately. Status becomes `failed`. |
| `continue` | Skip the failed node, continue with remaining DAG branches. |
| `retry` | Retry using the node's `retry` config, then stop if still failing. |

### Per-Node Override

```json
{
  "id": "risky_call",
  "type": "integrations.http",
  "params": { "url": "https://unreliable-api.com/data" },
  "continue_on_error": true,
  "retry": { "max_attempts": 3, "backoff": "exponential" },
  "timeout_s": 30
}
```

### API Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `INVALID_SPEC` | Workflow spec validation failed (cycles, invalid types) |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `TIER_LIMIT` | Operation exceeds plan limits |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `RUN_NOT_CANCELLABLE` | Run already in terminal state |
| 422 | `VALIDATION_ERROR` | Request body validation failed |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

All errors return: `{ "error": { "code": "...", "message": "...", "details": {} } }`

---

## Limits and Pricing

| Tier | Workflows | Concurrent Runs | Max Credits/Run | Max Execution Time |
|------|-----------|-----------------|-----------------|-------------------|
| Free | 0 | 0 | - | - |
| Starter | 0 | 0 | - | - |
| Medium | 10 | 3 | 100 | 1 hour |
| Pro | 50 | 10 | 500 | 4 hours |
| Business | 200 | 25 | 2,000 | 12 hours |
| Enterprise | Unlimited | 100 | Custom | 24 hours |

::: warning
Free and Starter plans do not have access to Agent Workflows. Upgrade to Medium or higher.
:::

### Credit Usage

- **AI Agent nodes** — per-token pricing based on the selected model
- **Image/Video/Audio generation** — same credits as equivalent direct API calls
- **HTTP/Logic/Storage nodes** — zero credits (infrastructure nodes)

The `credits_max` field acts as a budget cap. Runs fail with `CREDITS_EXHAUSTED` if the cap is reached.

---

## Best Practices

### Workflow Design

- **Set credit caps.** Always configure `max_credits` to prevent runaway spending from retry loops or recursive agents.
- **Use meaningful node IDs.** `enhance_prompt` is easier to debug in template expressions than `node_7`.
- **Enable retries for external calls.** HTTP and generation nodes should use exponential backoff.
- **Leverage parallel branches.** The DAG executor runs independent branches concurrently — structure your graph accordingly.

### Security

- **Use connections for secrets.** Never put API keys directly in node params.
- **Enable HMAC for webhooks.** Always verify webhook authenticity in production.
- **Restrict widget domains.** Only allow specific domains in `allowed_domains`.
- **Test connections regularly.** Detect expired credentials before they cause run failures.

### Operations

- **Monitor via SSE.** Long-running workflows benefit from real-time event streaming.
- **Use `spec_override` for testing.** Iterate without saving, then commit once working.
- **Minimize agent steps.** Set `max_steps` on AI agent nodes to the minimum needed.
- **Write assertion tests.** Use `POST /v1/tests` to validate workflow behavior automatically.
