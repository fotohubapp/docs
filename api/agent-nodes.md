---
title: Agent Nodes Catalog (198 Nodes)
description: Exhaustive reference documentation for all 198 production agent nodes across 23 categories in the FotoHub Agent Engine.
---

# Agent Nodes Catalog (198 Nodes Reference)

The complete reference guide to **all 198 production-ready nodes** available in the FotoHub Agent Engine (`/dashboard/agents/*`). Every node is rigorously typed, equipped with input/output validation, error resilience, fallback policies, and full telemetry tracing within the DAG orchestrator.

::: tip EXECUTION RUNTIMES & ENGINES
FotoHub executes workflow nodes across 5 specialized execution runtimes:
- **Built-in Logic Engine** (`builtin`): Ultra-fast in-memory Python operations (conditions, JMESPath filters, aggregations).
- **Supabase Edge Functions** (`edge_fn`): Low-latency edge workers handling OAuth, third-party APIs, and lightweight logic.
- **Dedicated GPU Microservices** (`http`): High-throughput compute clusters powering `image-engine`, `video-engine`, and `music-server`.
- **Autonomous LLM Agents** (`llm_agent`): Multi-turn reasoning loops with native tool calling across Claude, GPT-4o, and Bedrock.
- **Model Context Protocol** (`mcp`): Standard Anthropic MCP client connecting external tool and resource servers directly into workflow graphs.
:::

## Category Overview (23 Categories)

| Category | Icon | Nodes | Primary Role & Business Use Case |
|---|:---:|:---:|---|
| [Workflow Triggers](#trigger) | ⚡ | **5** | Starting nodes that initiate workflow execution based on user interactions, scheduled cron... |
| [Autonomous Agents & Swarms](#agent) | 🤖 | **8** | Autonomous decision-making and orchestration nodes capable of multi-turn reasoning, tool c... |
| [Advanced Flow Control & Routers](#control) | 🧭 | **7** | Enterprise-grade traffic management and fault tolerance: canary A/B split testing, multi-t... |
| [FotoHub Shorts & Viral Reels](#fotohub-shorts) | ✂️ | **3** | Optimized for TikTok, Instagram Reels, and YouTube Shorts algorithms. Detects high-engagem... |
| [FotoHub UGC Studio & Virtual Try-On](#fotohub-ugc) | 🎭 | **3** | Authentic user-generated content creation: persuasive UGC video scripts (Hook-Problem-CTA)... |
| [FotoHub Creative Studio](#fotohub-creative) | ✨ | **1** | Commercial packshot automation: removes raw backgrounds and synthesizes photorealistic 3D ... |
| [Creative Studio & Styling](#creative) | 💡 | **1** | Advanced packshot styling and commercial set generation for fashion, cosmetics, luxury goo... |
| [FotoHub AI Image Processing](#fotohub-image) | 🎨 | **19** | Comprehensive 19-node image suite: state-of-the-art generation (Flux, Midjourney v6, SD3),... |
| [FotoHub AI Video Generation](#fotohub-video) | 🎬 | **12** | High-performance video engine: text/image-to-video (Luma, Runway, Kling), clip extension, ... |
| [FotoHub Audio, Voice & Music](#fotohub-audio) | 🎵 | **14** | Expressive text-to-speech in 100+ languages, generative music composition (Suno, Udio), ci... |
| [Real-Time Voice & Streaming Audio](#voice) | 🎙️ | **3** | Full-duplex conversational voice with sub-300ms latency, automatic voice activity detectio... |
| [FotoHub Brand Governance](#fotohub-brand) | 🏷️ | **6** | Automated brand compliance: PDF brand guideline extraction, color palette generation, inte... |
| [AI Models, LLMs & Vision](#ai) | 🧠 | **6** | Direct integration with top-tier foundation models (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 ... |
| [Knowledge Base & Vector Memory](#knowledge) | 📚 | **3** | Semantic document search (Retrieval-Augmented Generation), persistent agent vector memory,... |
| [Social Media Publishing & Scheduling](#social) | 📱 | **14** | Direct API publishing and intelligent scheduling across Instagram (Posts, Reels, Stories),... |
| [External Integrations & E-Commerce](#integration) | 🔌 | **61** | 61 production connectors for e-commerce platforms (Allegro, Shopify, WooCommerce, eBay, Et... |
| [Cloud Storage & Asset Delivery](#storage) | ☁️ | **10** | Secure asset management and Bring-Your-Own-Bucket (BYOB) delivery: FotoHub Gallery, AWS S3... |
| [Flow Logic & Data Transformation](#logic) | 🔀 | **15** | Deterministic execution control and data manipulation: If/Else conditional branching, mult... |
| [Workflow Input & Output Boundaries](#io) | 📥 | **2** | Entry-point parameter parsing, schema validation, and standardized workflow completion sum... |
| [Secure Code Sandboxes](#code) | ⌨️ | **2** | Isolated, resource-constrained execution sandboxes for Python (with NumPy, Pillow, Request... |
| [HTTP & REST API Client](#http) | 🌐 | **1** | Universal REST client supporting GET, POST, PUT, DELETE, and PATCH with custom headers, Be... |
| [System Safeguards & Rollback](#system) | 🛡️ | **1** | Workflow configuration snapshots and automated rollback safeguards that restore previous s... |
| [Developer Inspection Tooling](#developer) | 🛠️ | **1** | Inspection utilities, execution mock environments, and interactive test harnesses for deve... |
| **TOTAL** | 🚀 | **198** | **Full Production Node Catalog** |

---

## ⚡ Workflow Triggers <a id="trigger"></a>

> **Total Nodes:** 5 | **Category Identifier:** `trigger`

Starting nodes that initiate workflow execution based on user interactions, scheduled cron timers, incoming HTTP webhooks, input forms, or cryptographically signed HMAC-SHA256 payloads.

**Enterprise Use Case:** Triggering automated e-commerce asset generation on new store orders, scheduling daily 9:00 AM social media posts, or receiving secure payment webhooks from Stripe and PayPal.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `trigger.manual` | **Manual Trigger** | In: `main`<br>Out: `main` | `trigger` | Free (0 credits) |
| `trigger.schedule` | **Schedule Trigger** | In: `main`<br>Out: `main` | `trigger` | Free (0 credits) |
| `trigger.webhook` | **Webhook Trigger** | In: `main`<br>Out: `main` | `trigger` | Free (0 credits) |
| `trigger.form` | **Form Trigger** | In: `main`<br>Out: `main` | `trigger` | Free (0 credits) |
| `trigger.webhook_secure` | **Secure Webhook Trigger** | In: `none`<br>Out: `valid, invalid` | `builtin` | Free (0 credits) |

### Node Specifications (Workflow Triggers)

#### `trigger.manual` — Manual Trigger

Start this workflow manually from the dashboard or via API.

- **Executor Runtime:** `trigger`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `label` | `string` | No | `Manual run` | Shown to the user when they trigger this workflow. |

```json
{
  "id": "trigger_manual_1",
  "type": "trigger.manual",
  "position": [
    250,
    150
  ],
  "params": {
    "label": "Manual run"
  }
}
```

---

#### `trigger.schedule` — Schedule Trigger

Fire this workflow on a cron schedule.

- **Executor Runtime:** `trigger`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `cron` | `string` | Yes | `0 9 * * *` | Standard 5-field cron. e.g. '0 9 * * MON-FRI'. |
| `timezone` | `options` | No | `Europe/Warsaw` | <br>_Options:_ `Europe/Warsaw`, `Europe/London`, `UTC`, `America/New_York`, `America/Los_Angeles` (+1 more) |

```json
{
  "id": "trigger_schedule_1",
  "type": "trigger.schedule",
  "position": [
    250,
    150
  ],
  "params": {
    "cron": "0 9 * * *",
    "timezone": "Europe/Warsaw"
  }
}
```

---

#### `trigger.webhook` — Webhook Trigger

Start this workflow on HTTP POST to a public URL.

- **Executor Runtime:** `trigger`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `path_label` | `string` | No | _none_ | Human-friendly suffix appended after the random slug. |
| `method` | `options` | No | `POST` | <br>_Options:_ `POST`, `GET`, `PUT`, `DELETE` |
| `require_hmac` | `boolean` | No | `False` | If on, generated secret must match x-fh-signature header. |

```json
{
  "id": "trigger_webhook_1",
  "type": "trigger.webhook",
  "position": [
    250,
    150
  ],
  "params": {
    "method": "POST",
    "require_hmac": false
  }
}
```

---

#### `trigger.form` — Form Trigger

Renders a public web form; submissions start a run.

- **Executor Runtime:** `trigger`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `title` | `string` | Yes | `Submit` |  |
| `description_md` | `string` | No | _none_ |  |

```json
{
  "id": "trigger_form_1",
  "type": "trigger.form",
  "position": [
    250,
    150
  ],
  "params": {
    "title": "Submit"
  }
}
```

---

#### `trigger.webhook_secure` — Secure Webhook Trigger

Trigger workflow on HTTP POST verified with HMAC-SHA256 signature.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** None (Start Node)
- **Output Ports:** `valid` (any), `invalid` (any)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `secret_key` | `string` | No | `whsec_live_demo12345` | Sekretny klucz używany do obliczenia HMAC. |
| `signature_header` | `string` | No | `X-Hub-Signature-256` | Nagłówek podpisu |
| `allowed_ips` | `string` | No | `*` | Lista oddzielona przecinkami lub '*' dla wszystkich. |

```json
{
  "id": "trigger_webhook_secure_1",
  "type": "trigger.webhook_secure",
  "position": [
    250,
    150
  ],
  "params": {
    "secret_key": "whsec_live_demo12345",
    "signature_header": "X-Hub-Signature-256",
    "allowed_ips": "*"
  }
}
```

---

## 🤖 Autonomous Agents & Swarms <a id="agent"></a>

> **Total Nodes:** 8 | **Category Identifier:** `agent`

Autonomous decision-making and orchestration nodes capable of multi-turn reasoning, tool calling, real-time self-healing diagnostic recovery, multi-agent swarm fanout, and consensus jury aggregation.

**Enterprise Use Case:** An autonomous AI Creative Director that breaks a marketing brief into visual, video, and copy subtasks, reviews results via a critique loop, and automatically heals transient generation errors.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `agent.call_subagent` | **Call Subagent** | In: `main`<br>Out: `main` | `builtin` | Free (0 credits) |
| `agent.swarm_fanout` | **Agent Swarm Fan-Out** | In: `main`<br>Out: `main` | `builtin` | Free (0 credits) |
| `agent.critique_loop` | **Critique & Refinement Loop** | In: `main`<br>Out: `main` | `builtin` | Free (0 credits) |
| `agent.mcp_call` | **Call MCP Tool** | In: `main`<br>Out: `main` | `builtin` | Free (0 credits) |
| `mcp.hub_call` | **Wywołanie Narzędzia MCP Hub** | In: `main`<br>Out: `main` | `builtin` | Free (0 credits) |
| `agent.consensus_aggregate` | **Consensus Aggregate** | In: `main`<br>Out: `main` | `builtin` | Free (0 credits) |
| `agent.voice_dialogue` | **Real-Time Voice Agent** | In: `in`<br>Out: `main, transcription` | `builtin` | Free (0 credits) |
| `agent.self_healing` | **Autonomous Self-Healing** | In: `in`<br>Out: `repaired, fallback, fatal` | `builtin` | Free (0 credits) |

### Node Specifications (Autonomous Agents & Swarms)

#### `agent.call_subagent` — Call Subagent

Invoke another subagent and wait for its completion.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `workflow_id` | `string` | Yes | _none_ | ID workflow lub nazwa agenta do wywołania |
| `input_data` | `json` | No | _none_ | Obiekt wejściowy przekazywany do pod-agenta |
| `wait_for_completion` | `boolean` | No | `True` |  |
| `timeout_seconds` | `number` | No | `300` |  |

```json
{
  "id": "agent_call_subagent_1",
  "type": "agent.call_subagent",
  "position": [
    250,
    150
  ],
  "params": {
    "workflow_id": "<value>",
    "wait_for_completion": true,
    "timeout_seconds": 300
  }
}
```

---

#### `agent.swarm_fanout` — Agent Swarm Fan-Out

Distribute tasks across multiple specialized agents concurrently.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `tasks_path` | `string` | No | `$.items` | JSONPath wskazujący listę elementów do przetworzenia |
| `subagent_workflow_id` | `string` | Yes | _none_ |  |
| `concurrency` | `number` | No | `5` |  |
| `aggregation` | `options` | No | `array` | <br>_Options:_ `array`, `merge_dict`, `first_success` |

```json
{
  "id": "agent_swarm_fanout_1",
  "type": "agent.swarm_fanout",
  "position": [
    250,
    150
  ],
  "params": {
    "tasks_path": "$.items",
    "subagent_workflow_id": "<value>",
    "concurrency": 5,
    "aggregation": "array"
  }
}
```

---

#### `agent.critique_loop` — Critique & Refinement Loop

Evaluate output quality against criteria and retry until passing.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `task_prompt` | `string` | Yes | _none_ |  |
| `evaluation_rubric` | `string` | No | `Zgodność z promptem, estetyka, styl, poprawność logiczna` |  |
| `target_score` | `number` | No | `8` |  |
| `max_refinement_steps` | `number` | No | `3` |  |
| `evaluator_model` | `options` | No | `claude-3-7-sonnet` | <br>_Options:_ `claude-3-7-sonnet`, `gpt-5-turbo`, `gemini-2.5-pro`, `fast-evaluator` |

```json
{
  "id": "agent_critique_loop_1",
  "type": "agent.critique_loop",
  "position": [
    250,
    150
  ],
  "params": {
    "task_prompt": "<value>",
    "evaluation_rubric": "Zgodno\u015b\u0107 z promptem, estetyka, styl, poprawno\u015b\u0107 logiczna",
    "target_score": 8,
    "max_refinement_steps": 3
  }
}
```

---

#### `agent.mcp_call` — Call MCP Tool

Execute an external tool exposed via Model Context Protocol (MCP).

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `server_url` | `string` | Yes | _none_ |  |
| `tool_name` | `string` | Yes | _none_ |  |
| `arguments` | `json` | No | _none_ |  |
| `auth_token` | `string` | No | _none_ |  |

```json
{
  "id": "agent_mcp_call_1",
  "type": "agent.mcp_call",
  "position": [
    250,
    150
  ],
  "params": {
    "server_url": "<value>",
    "tool_name": "<value>"
  }
}
```

---

#### `mcp.hub_call` — Wywołanie Narzędzia MCP Hub

Dynamiczne wywołanie narzędzia z zarejestrowanego serwera MCP w wieloserwerowym hubie narzędzi.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `server_id` | `string` | Yes | _none_ |  |
| `tool_name` | `string` | Yes | _none_ |  |
| `arguments` | `json` | No | `{}` |  |
| `fail_silently` | `boolean` | No | `False` |  |

```json
{
  "id": "mcp_hub_call_1",
  "type": "mcp.hub_call",
  "position": [
    250,
    150
  ],
  "params": {
    "server_id": "<value>",
    "tool_name": "<value>",
    "arguments": {},
    "fail_silently": false
  }
}
```

---

#### `agent.consensus_aggregate` — Consensus Aggregate

Aggregate decisions from multiple agents with weighted voting.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `aggregation_strategy` | `options` | No | `majority_vote` | Algorytm wyłaniania konsensusu spośród odpowiedzi agentów roju<br>_Options:_ `majority_vote`, `weighted_confidence`, `llm_jury_synthesis`, `unanimous_or_fallback` |
| `min_quorum` | `number` | No | `2` | Minimalna liczba agentów popierających wariant lub minimalna liczba głosów |
| `fallback_strategy` | `options` | No | `highest_confidence` | Strategia postępowania w przypadku braku quorum lub remisu<br>_Options:_ `highest_confidence`, `first_valid`, `fail` |
| `confidence_field` | `string` | No | `confidence` | Nazwa pola określająca pewność/wagę odpowiedzi agenta (0.0-1.0) |

```json
{
  "id": "agent_consensus_aggregate_1",
  "type": "agent.consensus_aggregate",
  "position": [
    250,
    150
  ],
  "params": {
    "aggregation_strategy": "majority_vote",
    "min_quorum": 2,
    "fallback_strategy": "highest_confidence",
    "confidence_field": "confidence"
  }
}
```

---

#### `agent.voice_dialogue` — Real-Time Voice Agent

Interactive real-time voice dialogue with VAD silence detection.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `in` (any)
- **Output Ports:** `main` (any), `transcription` (string)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `voice_engine` | `options` | No | `elevenlabs_conversational` | Silnik głosu<br>_Options:_ `elevenlabs_conversational`, `openai_realtime_audio`, `gemini_multimodal_live` |
| `language` | `options` | No | `pl-PL` | Język dialogu<br>_Options:_ `pl-PL`, `en-US`, `de-DE` |
| `vad_threshold` | `number` | No | `0.5` | Próg detekcji głosu i przerywania mowy (barge-in). |

```json
{
  "id": "agent_voice_dialogue_1",
  "type": "agent.voice_dialogue",
  "position": [
    250,
    150
  ],
  "params": {
    "voice_engine": "elevenlabs_conversational",
    "language": "pl-PL",
    "vad_threshold": 0.5
  }
}
```

---

#### `agent.self_healing` — Autonomous Self-Healing

Catch runtime errors, inspect stack traces, and adapt execution.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `in` (any)
- **Output Ports:** `repaired` (any), `fallback` (any), `fatal` (any)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `strategy` | `options` | No | `schema_and_params` | Strategia naprawy<br>_Options:_ `schema_and_params`, `model_fallback`, `prompt_compression` |
| `max_repair_attempts` | `number` | No | `3` | Maks. liczba prób naprawy |
| `auto_commit_patch` | `boolean` | No | `True` | Automatycznie zatwierdź poprawkę |

```json
{
  "id": "agent_self_healing_1",
  "type": "agent.self_healing",
  "position": [
    250,
    150
  ],
  "params": {
    "strategy": "schema_and_params",
    "max_repair_attempts": 3,
    "auto_commit_patch": true
  }
}
```

---

## 🧭 Advanced Flow Control & Routers <a id="control"></a>

> **Total Nodes:** 7 | **Category Identifier:** `control`

Enterprise-grade traffic management and fault tolerance: canary A/B split testing, multi-tier fallback service matrices, guarded loops preventing infinite execution, dynamic routers, and parallel join gates.

**Enterprise Use Case:** Directing 10% of traffic to experimental video models with automatic failover to stable backup models if GPU latency exceeds thresholds, without interrupting client sessions.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `control.human_approval` | **Zatwierdzenie Człowieka (Human Gate)** | In: `main`<br>Out: `approved, rejected` | `builtin` | Free (0 credits) |
| `control.fallback_matrix` | **Fallback Matrix** | In: `main`<br>Out: `main` | `builtin` | Free (0 credits) |
| `control.dynamic_switch` | **Dynamic Switch** | In: `main`<br>Out: `case_1, case_2, case_3, default` | `builtin` | Free (0 credits) |
| `control.parallel_gate` | **Parallel Gate** | In: `main`<br>Out: `main` | `builtin` | Free (0 credits) |
| `control.loop_while` | **Loop While** | In: `main`<br>Out: `loop, done` | `builtin` | Free (0 credits) |
| `control.smart_router` | **Smart AI Router** | In: `main`<br>Out: `photo_generation, photo_editing, text_and_copy, data_analysis, fallback` | `builtin` | Free (0 credits) |
| `control.traffic_split` | **Traffic Splitter (A/B)** | In: `main`<br>Out: `variant_a, variant_b, variant_c` | `builtin` | Free (0 credits) |

### Node Specifications (Advanced Flow Control & Routers)

#### `control.human_approval` — Zatwierdzenie Człowieka (Human Gate)

Wstrzymuje wykonanie workflow do momentu akceptacji lub odrzucenia przez użytkownika ze ścisłą polityką SLA i eskalacją.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `approved` (main), `rejected` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `title` | `string` | Yes | _none_ |  |
| `message` | `string` | No | _none_ |  |
| `sla_minutes` | `number` | No | `60` |  |
| `timeout_policy` | `options` | No | `auto_reject` | <br>_Options:_ `auto_approve`, `auto_reject`, `escalate_webhook` |
| `escalation_webhook_url` | `string` | No | _none_ |  |
| `notification_channel` | `options` | No | `slack` | <br>_Options:_ `slack`, `discord`, `email`, `custom_webhook` |
| `timeout_hours` | `number` | No | `24` |  |
| `auto_approve_on_timeout` | `boolean` | No | `False` |  |

```json
{
  "id": "control_human_approval_1",
  "type": "control.human_approval",
  "position": [
    250,
    150
  ],
  "params": {
    "title": "<value>",
    "sla_minutes": 60,
    "timeout_policy": "auto_reject"
  }
}
```

---

#### `control.fallback_matrix` — Fallback Matrix

Cascade through fallback services if primary provider fails.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `primary_provider` | `string` | Yes | _none_ |  |
| `fallback_provider` | `string` | Yes | _none_ |  |
| `trigger_on` | `options` | No | `any_error` | <br>_Options:_ `any_error`, `rate_limit_only`, `timeout_only`, `server_error` |
| `max_retries` | `number` | No | `2` |  |

```json
{
  "id": "control_fallback_matrix_1",
  "type": "control.fallback_matrix",
  "position": [
    250,
    150
  ],
  "params": {
    "primary_provider": "<value>",
    "fallback_provider": "<value>",
    "trigger_on": "any_error",
    "max_retries": 2
  }
}
```

---

#### `control.dynamic_switch` — Dynamic Switch

Dynamic multi-branch routing based on runtime conditions.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `case_1` (main), `case_2` (main), `case_3` (main), `default` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `variable_path` | `string` | No | `status` | Pole z danych wejściowych np. intent, type, status |
| `case_1_value` | `string` | No | _none_ |  |
| `case_2_value` | `string` | No | _none_ |  |
| `case_3_value` | `string` | No | _none_ |  |

```json
{
  "id": "control_dynamic_switch_1",
  "type": "control.dynamic_switch",
  "position": [
    250,
    150
  ],
  "params": {
    "variable_path": "status"
  }
}
```

---

#### `control.parallel_gate` — Parallel Gate

Wait for multiple parallel branches to complete before continuing.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `sync_mode` | `options` | No | `wait_all` | <br>_Options:_ `wait_all`, `wait_first`, `quorum` |
| `timeout_seconds` | `number` | No | `60` |  |
| `allow_partial_failures` | `boolean` | No | `True` |  |

```json
{
  "id": "control_parallel_gate_1",
  "type": "control.parallel_gate",
  "position": [
    250,
    150
  ],
  "params": {
    "sync_mode": "wait_all",
    "timeout_seconds": 60,
    "allow_partial_failures": true
  }
}
```

---

#### `control.loop_while` — Loop While

Execute loop iterations until a condition evaluates to false.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `loop` (main), `done` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `condition_expr` | `string` | No | _none_ |  |
| `max_iterations` | `number` | No | `50` |  |
| `break_on_error` | `boolean` | No | `True` |  |
| `accumulator_path` | `string` | No | `results` |  |

```json
{
  "id": "control_loop_while_1",
  "type": "control.loop_while",
  "position": [
    250,
    150
  ],
  "params": {
    "max_iterations": 50,
    "break_on_error": true,
    "accumulator_path": "results"
  }
}
```

---

#### `control.smart_router` — Smart AI Router

Semantic intent routing to direct data to specialized handlers.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `photo_generation` (main), `photo_editing` (main), `text_and_copy` (main), `data_analysis` (main), `fallback` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `user_input_path` | `string` | No | `prompt` |  |
| `router_model` | `options` | No | `gemini-2.0-flash` | <br>_Options:_ `gpt-4o-mini`, `claude-3-5-haiku`, `gemini-2.0-flash` |
| `custom_context` | `string` | No | _none_ |  |

```json
{
  "id": "control_smart_router_1",
  "type": "control.smart_router",
  "position": [
    250,
    150
  ],
  "params": {
    "user_input_path": "prompt",
    "router_model": "gemini-2.0-flash"
  }
}
```

---

#### `control.traffic_split` — Traffic Splitter (A/B)

Split workflow traffic probabilistically between branches.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `variant_a` (main), `variant_b` (main), `variant_c` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `experiment_name` | `string` | No | `exp_v1` | Identyfikator eksperymentu A/B |
| `split_mode` | `options` | No | `sticky_hash` | Sticky hash gwarantuje, że ten sam użytkownik zawsze trafi do tego samego wariantu.<br>_Options:_ `sticky_hash`, `random` |
| `weight_a` | `number` | No | `50` |  |
| `weight_b` | `number` | No | `50` |  |
| `enable_variant_c` | `boolean` | No | `False` |  |
| `weight_c` | `number` | No | `0` |  |

```json
{
  "id": "control_traffic_split_1",
  "type": "control.traffic_split",
  "position": [
    250,
    150
  ],
  "params": {
    "experiment_name": "exp_v1",
    "split_mode": "sticky_hash",
    "weight_a": 50,
    "weight_b": 50
  }
}
```

---

## ✂️ FotoHub Shorts & Viral Reels <a id="fotohub-shorts"></a>

> **Total Nodes:** 3 | **Category Identifier:** `fotohub.shorts`

Optimized for TikTok, Instagram Reels, and YouTube Shorts algorithms. Detects high-engagement segments from long-form video, applies animated karaoke subtitles (Hormozi / MrBeast style), and appends branded bumpers.

**Enterprise Use Case:** Transforming a 60-minute podcast or webinar into 5 viral vertical 9:16 clips with animated word-by-word captions, sponsor bumpers, and aspect ratio adaptation in under 90 seconds.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `fotohub.shorts.clip_auto` | **Shorts: AI Auto-Clipper** | In: `main`<br>Out: `main, error` | `builtin` | 5 credits (~$0.0000) |
| `fotohub.shorts.subtitles_karaoke` | **Shorts: Karaoke Subtitles** | In: `main`<br>Out: `main, error` | `builtin` | 2 credits (~$0.0000) |
| `fotohub.shorts.add_bumper` | **Shorts: Brand Bumper** | In: `main`<br>Out: `main, error` | `builtin` | 1 credits (~$0.0000) |

### Node Specifications (FotoHub Shorts & Viral Reels)

#### `fotohub.shorts.clip_auto` — Shorts: AI Auto-Clipper

Detect viral video segments and format for TikTok/Reels.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** 5 credits (~$0.0000)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Yes | _none_ | Link do pliku wideo lub nagrania źródłowego |
| `max_clips` | `number` | No | `3` |  |
| `aspect_ratio` | `options` | No | `9:16` | <br>_Options:_ `9:16`, `1:1`, `4:5`, `16:9` |
| `caption_style` | `options` | No | `hormozi` | <br>_Options:_ `hormozi`, `beasty`, `karaoke`, `neon`, `clean` (+1 more) |
| `min_duration_s` | `number` | No | `15` |  |
| `max_duration_s` | `number` | No | `60` |  |

```json
{
  "id": "fotohub_shorts_clip_auto_1",
  "type": "fotohub.shorts.clip_auto",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<value>",
    "max_clips": 3,
    "aspect_ratio": "9:16",
    "caption_style": "hormozi"
  }
}
```

---

#### `fotohub.shorts.subtitles_karaoke` — Shorts: Karaoke Subtitles

Render dynamic word-by-word highlighted captions.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** 2 credits (~$0.0000)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Yes | _none_ |  |
| `style` | `options` | No | `hormozi` | <br>_Options:_ `hormozi`, `beasty`, `karaoke`, `neon`, `clean` (+1 more) |
| `highlight_color` | `string` | No | `#facc15` |  |
| `words_per_line` | `number` | No | `3` |  |
| `add_emojis` | `boolean` | No | `True` |  |

```json
{
  "id": "fotohub_shorts_subtitles_karaoke_1",
  "type": "fotohub.shorts.subtitles_karaoke",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<value>",
    "style": "hormozi",
    "highlight_color": "#facc15",
    "words_per_line": 3
  }
}
```

---

#### `fotohub.shorts.add_bumper` — Shorts: Brand Bumper

Attach branded video intro, outro, or logo watermark.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** 1 credits (~$0.0000)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Yes | _none_ |  |
| `bumper_type` | `options` | No | `outro` | <br>_Options:_ `intro`, `outro`, `both` |
| `brand_logo_url` | `string` | No | _none_ | Opcjonalny plik PNG z przezroczystością |
| `cta_text` | `string` | No | `Sprawdź link w bio!` |  |
| `duration_s` | `number` | No | `3` |  |

```json
{
  "id": "fotohub_shorts_add_bumper_1",
  "type": "fotohub.shorts.add_bumper",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<value>",
    "bumper_type": "outro",
    "cta_text": "Sprawd\u017a link w bio!"
  }
}
```

---

## 🎭 FotoHub UGC Studio & Virtual Try-On <a id="fotohub-ugc"></a>

> **Total Nodes:** 3 | **Category Identifier:** `fotohub.ugc`

Authentic user-generated content creation: persuasive UGC video scripts (Hook-Problem-CTA), photorealistic AI avatar rendering with synced lip movement, and AI virtual try-on (VTO) on model photos.

**Enterprise Use Case:** Generating 50 localized video variations of customer product reviews featuring diverse avatars for TikTok ad campaigns without physical studio shoots.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `fotohub.ugc.script_generator` | **UGC: Script Generator** | In: `main`<br>Out: `main, error` | `builtin` | 1 credits (~$0.0000) |
| `fotohub.ugc.actor_render` | **UGC: Render Actor** | In: `main`<br>Out: `main, error` | `builtin` | 10 credits (~$0.0000) |
| `fotohub.ugc.product_tryon` | **UGC: Virtual Try-On** | In: `main`<br>Out: `main, error` | `builtin` | 4 credits (~$0.0000) |

### Node Specifications (FotoHub UGC Studio & Virtual Try-On)

#### `fotohub.ugc.script_generator` — UGC: Script Generator

Generate viral Hook-Agitate-Solution UGC video scripts.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** 1 credits (~$0.0000)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `product_name` | `string` | Yes | _none_ |  |
| `product_url` | `string` | No | _none_ |  |
| `hook_style` | `options` | No | `curiosity` | <br>_Options:_ `curiosity`, `shock`, `question`, `before_after` |
| `target_audience` | `string` | No | `Kobiety i mężczyźni 18-35 zainteresowani nowościami` |  |
| `duration_target_s` | `number` | No | `30` |  |

```json
{
  "id": "fotohub_ugc_script_generator_1",
  "type": "fotohub.ugc.script_generator",
  "position": [
    250,
    150
  ],
  "params": {
    "product_name": "<value>",
    "hook_style": "curiosity",
    "target_audience": "Kobiety i m\u0119\u017cczy\u017ani 18-35 zainteresowani nowo\u015bciami"
  }
}
```

---

#### `fotohub.ugc.actor_render` — UGC: Render Actor

Generate AI video presenter speaking product review script.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** 10 credits (~$0.0000)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `actor_id` | `options` | No | `emma` | <br>_Options:_ `emma`, `lucas`, `sophie`, `marcus`, `elena` |
| `script_text` | `string` | Yes | _none_ |  |
| `product_image_url` | `string` | No | _none_ |  |
| `camera_angle` | `options` | No | `selfie` | <br>_Options:_ `selfie`, `close_up`, `medium` |

```json
{
  "id": "fotohub_ugc_actor_render_1",
  "type": "fotohub.ugc.actor_render",
  "position": [
    250,
    150
  ],
  "params": {
    "actor_id": "emma",
    "script_text": "<value>",
    "camera_angle": "selfie"
  }
}
```

---

#### `fotohub.ugc.product_tryon` — UGC: Virtual Try-On

Overlay apparel or garments onto photo models naturally.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** 4 credits (~$0.0000)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `person_image_url` | `string` | Yes | _none_ |  |
| `clothing_image_url` | `string` | Yes | _none_ |  |
| `category` | `options` | No | `tops` | <br>_Options:_ `tops`, `bottoms`, `one_piece`, `accessories` |
| `denoise_steps` | `number` | No | `30` |  |

```json
{
  "id": "fotohub_ugc_product_tryon_1",
  "type": "fotohub.ugc.product_tryon",
  "position": [
    250,
    150
  ],
  "params": {
    "person_image_url": "<value>",
    "clothing_image_url": "<value>",
    "category": "tops",
    "denoise_steps": 30
  }
}
```

---

## ✨ FotoHub Creative Studio <a id="fotohub-creative"></a>

> **Total Nodes:** 1 | **Category Identifier:** `fotohub.creative`

Commercial packshot automation: removes raw backgrounds and synthesizes photorealistic 3D advertising mockups with physically accurate lighting, ambient reflections, and cast shadows.

**Enterprise Use Case:** Turning a smartphone snapshot of a perfume bottle into an ultra-luxury marble pedestal advertisement bathed in sunrise lighting.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `fotohub.creative.product_mockup` | **Studio Product Mockup** | In: `main`<br>Out: `main, error` | `builtin` | 3 credits (~$0.0000) |

### Node Specifications (FotoHub Creative Studio)

#### `fotohub.creative.product_mockup` — Studio Product Mockup

Generate professional 3D studio lighting mockup for products.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** 3 credits (~$0.0000)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `product_image_url` | `string` | Yes | _none_ |  |
| `scene_theme` | `options` | No | `minimalist_studio` | <br>_Options:_ `minimalist_studio`, `luxury_marble`, `outdoor_nature`, `cyber_neon`, `cozy_wood` |
| `custom_prompt` | `string` | No | _none_ |  |
| `shadow_intensity` | `number` | No | `0.75` |  |

```json
{
  "id": "fotohub_creative_product_mockup_1",
  "type": "fotohub.creative.product_mockup",
  "position": [
    250,
    150
  ],
  "params": {
    "product_image_url": "<value>",
    "scene_theme": "minimalist_studio",
    "shadow_intensity": 0.75
  }
}
```

---

## 💡 Creative Studio & Styling <a id="creative"></a>

> **Total Nodes:** 1 | **Category Identifier:** `creative`

Advanced packshot styling and commercial set generation for fashion, cosmetics, luxury goods, and consumer electronics.

**Enterprise Use Case:** Standardizing an entire 500-product e-commerce catalog with matching seasonal backgrounds, camera angles, and shadow depths.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `ai.vision_analyzer` | **AI Vision Analyzer** | In: `main`<br>Out: `main` | `builtin` | Free (0 credits) |

### Node Specifications (Creative Studio & Styling)

#### `ai.vision_analyzer` — AI Vision Analyzer

Analyze visual image content, detect objects, and evaluate quality.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |
| `extract_color_palette` | `boolean` | No | `True` |  |
| `score_aesthetic` | `boolean` | No | `True` |  |
| `extract_ocr_text` | `boolean` | No | `True` |  |

```json
{
  "id": "ai_vision_analyzer_1",
  "type": "ai.vision_analyzer",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>",
    "extract_color_palette": true,
    "score_aesthetic": true,
    "extract_ocr_text": true
  }
}
```

---

## 🎨 FotoHub AI Image Processing <a id="fotohub-image"></a>

> **Total Nodes:** 19 | **Category Identifier:** `fotohub.image`

Comprehensive 19-node image suite: state-of-the-art generation (Flux, Midjourney v6, SD3), 8K super-resolution upscaling, alpha matting background removal, face-aware smart cropping, inpainting, outpainting, face swapping, and relighting.

**Enterprise Use Case:** End-to-end photo production pipeline: generate themed background, match subject lighting, retouch skin tones, and export in print-ready 300 DPI resolution.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `fotohub.gallery.save` | **FotoHub Gallery: Save** | In: `main`<br>Out: `main` | `builtin` | free |
| `fotohub.image.generate` | **Generate Image** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.upscale` | **Upscale Image** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.remove_bg` | **Remove Background** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.face_swap` | **Face Swap** | In: `main`<br>Out: `main, error` | `edge_fn` | per_operation |
| `fotohub.image.colorize` | **Colorize (B&W)** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.style_transfer` | **Style Transfer** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.inpaint` | **Inpaint** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.outpaint` | **Outpaint** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.face_restore` | **Restore Face** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.denoise` | **Denoise** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.auto_enhance` | **Auto-Enhance** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.color_grade` | **Color Grade** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.filter` | **Filter** | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.image.resize` | **Resize** | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.image.smart_crop` | **Smart Crop** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.watermark` | **Watermark** | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.image.generate_bg` | **Generate Background** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.deepfake` | **Deepfake Video** | In: `main`<br>Out: `main, error` | `edge_fn` | per_operation |

### Node Specifications (FotoHub AI Image Processing)

#### `fotohub.gallery.save` — FotoHub Gallery: Save

Save generated images directly to user FotoHub gallery.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `title` | `string` | No | _none_ |  |
| `visibility` | `options` | No | `private` | <br>_Options:_ `private`, `public`, `unlisted` |
| `image_url` | `string` | No | _none_ |  |

```json
{
  "id": "fotohub_gallery_save_1",
  "type": "fotohub.gallery.save",
  "position": [
    250,
    150
  ],
  "params": {
    "visibility": "private"
  }
}
```

---

#### `fotohub.image.generate` — Generate Image

Create a new image from a text prompt using any FOTOhub model.

- **Executor Runtime:** `http`
- **Microservice Service:** `image-engine` (endpoint: `/generate`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `model` | `options` | Yes | `dola-seedream-5-0-pro-260628` | <br>_Options:_ `dola-seedream-5-0-pro-260628`, `seedream-5-0-260128`, `seedream-4-5-251128`, `seedream-4-0-250828`, `gpt-image-2` (+34 more) |
| `prompt` | `string` | Yes | _none_ |  |
| `reference_image_url` | `string` | No | _none_ |  |
| `aspect_ratio` | `options` | No | `1:1` | <br>_Options:_ `1:1`, `16:9`, `9:16`, `4:3`, `3:4` (+3 more) |
| `count` | `number` | No | `1` |  |
| `` | `collapsible` | No | _none_ | Advanced |

```json
{
  "id": "fotohub_image_generate_1",
  "type": "fotohub.image.generate",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "dola-seedream-5-0-pro-260628",
    "prompt": "<value>",
    "aspect_ratio": "1:1"
  }
}
```

---

#### `fotohub.image.upscale` — Upscale Image

Increase image resolution 2×/4× with Real-ESRGAN.

- **Executor Runtime:** `http`
- **Microservice Service:** `image-engine` (endpoint: `/api/upscale`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |
| `scale` | `options` | No | `2` | <br>_Options:_ `2`, `4` |

```json
{
  "id": "fotohub_image_upscale_1",
  "type": "fotohub.image.upscale",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>",
    "scale": "2"
  }
}
```

---

#### `fotohub.image.remove_bg` — Remove Background

Cut out the subject of an image (rembg / ISNet).

- **Executor Runtime:** `http`
- **Microservice Service:** `image-engine` (endpoint: `/api/remove-bg`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |
| `model` | `options` | No | `isnet-general-use` | <br>_Options:_ `isnet-general-use`, `u2net`, `silueta` |

```json
{
  "id": "fotohub_image_remove_bg_1",
  "type": "fotohub.image.remove_bg",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>",
    "model": "isnet-general-use"
  }
}
```

---

#### `fotohub.image.face_swap` — Face Swap

Swap a face from a source image onto a target.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `source_url` | `string` | Yes | _none_ |  |
| `target_url` | `string` | Yes | _none_ |  |

```json
{
  "id": "fotohub_image_face_swap_1",
  "type": "fotohub.image.face_swap",
  "position": [
    250,
    150
  ],
  "params": {
    "source_url": "<value>",
    "target_url": "<value>"
  }
}
```

---

#### `fotohub.image.colorize` — Colorize (B&W)

Add color to a black & white photo.

- **Executor Runtime:** `http`
- **Microservice Service:** `image-engine` (endpoint: `/api/colorize`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |

```json
{
  "id": "fotohub_image_colorize_1",
  "type": "fotohub.image.colorize",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>"
  }
}
```

---

#### `fotohub.image.style_transfer` — Style Transfer

Apply an artistic style to a photo.

- **Executor Runtime:** `http`
- **Microservice Service:** `image-engine` (endpoint: `/generate`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |
| `style_prompt` | `string` | Yes | _none_ |  |

```json
{
  "id": "fotohub_image_style_transfer_1",
  "type": "fotohub.image.style_transfer",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>",
    "style_prompt": "<value>"
  }
}
```

---

#### `fotohub.image.inpaint` — Inpaint

Fill a masked region with AI-generated content matching the surroundings.

- **Executor Runtime:** `http`
- **Microservice Service:** `image-engine` (endpoint: `/api/inpaint`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |
| `mask_url` | `string` | Yes | _none_ |  |
| `prompt` | `string` | Yes | _none_ |  |

```json
{
  "id": "fotohub_image_inpaint_1",
  "type": "fotohub.image.inpaint",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>",
    "mask_url": "<value>",
    "prompt": "<value>"
  }
}
```

---

#### `fotohub.image.outpaint` — Outpaint

Extend an image beyond its original borders.

- **Executor Runtime:** `http`
- **Microservice Service:** `image-engine` (endpoint: `/api/outpaint`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |
| `direction` | `options` | No | `all` | <br>_Options:_ `left`, `right`, `up`, `down`, `all` |
| `pixels` | `number` | No | `256` |  |

```json
{
  "id": "fotohub_image_outpaint_1",
  "type": "fotohub.image.outpaint",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>",
    "direction": "all",
    "pixels": 256
  }
}
```

---

#### `fotohub.image.face_restore` — Restore Face

Clean up faces (GFPGAN) — great for old/low-res photos.

- **Executor Runtime:** `http`
- **Microservice Service:** `image-engine` (endpoint: `/api/face-restore`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |

```json
{
  "id": "fotohub_image_face_restore_1",
  "type": "fotohub.image.face_restore",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>"
  }
}
```

---

#### `fotohub.image.denoise` — Denoise

Remove grain and noise while keeping detail.

- **Executor Runtime:** `http`
- **Microservice Service:** `image-engine` (endpoint: `/api/denoise`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |
| `strength` | `number` | No | `50` |  |

```json
{
  "id": "fotohub_image_denoise_1",
  "type": "fotohub.image.denoise",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>",
    "strength": 50
  }
}
```

---

#### `fotohub.image.auto_enhance` — Auto-Enhance

One-click AI enhancement (exposure + sharpness + color).

- **Executor Runtime:** `http`
- **Microservice Service:** `image-engine` (endpoint: `/api/auto-enhance`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |

```json
{
  "id": "fotohub_image_auto_enhance_1",
  "type": "fotohub.image.auto_enhance",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>"
  }
}
```

---

#### `fotohub.image.color_grade` — Color Grade

Apply cinematic color LUT or custom grade.

- **Executor Runtime:** `http`
- **Microservice Service:** `image-engine` (endpoint: `/api/color-grade`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |
| `preset` | `options` | No | `cinematic` | <br>_Options:_ `natural`, `cinematic`, `warm`, `cool`, `vintage` (+4 more) |
| `intensity` | `number` | No | `60` |  |

```json
{
  "id": "fotohub_image_color_grade_1",
  "type": "fotohub.image.color_grade",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>",
    "preset": "cinematic",
    "intensity": 60
  }
}
```

---

#### `fotohub.image.filter` — Filter

Apply one of 9 classic filters.

- **Executor Runtime:** `http`
- **Microservice Service:** `image-engine` (endpoint: `/api/filter`)
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |
| `filter` | `options` | No | `sharpen` | <br>_Options:_ `grayscale`, `sepia`, `invert`, `blur`, `sharpen` (+4 more) |
| `strength` | `number` | No | `50` |  |

```json
{
  "id": "fotohub_image_filter_1",
  "type": "fotohub.image.filter",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>",
    "filter": "sharpen",
    "strength": 50
  }
}
```

---

#### `fotohub.image.resize` — Resize

Change an image's dimensions (with optional aspect lock).

- **Executor Runtime:** `http`
- **Microservice Service:** `image-engine` (endpoint: `/api/resize`)
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |
| `width` | `number` | Yes | _none_ |  |
| `height` | `number` | No | _none_ |  |
| `mode` | `options` | No | `fit` | <br>_Options:_ `fit`, `fill`, `stretch`, `crop` |

```json
{
  "id": "fotohub_image_resize_1",
  "type": "fotohub.image.resize",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>",
    "width": "<value>",
    "mode": "fit"
  }
}
```

---

#### `fotohub.image.smart_crop` — Smart Crop

Crop to a target aspect keeping the most important content.

- **Executor Runtime:** `http`
- **Microservice Service:** `image-engine` (endpoint: `/api/smart-crop`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |
| `aspect` | `options` | No | `1:1` | <br>_Options:_ `1:1`, `16:9`, `9:16`, `4:3`, `3:4` |

```json
{
  "id": "fotohub_image_smart_crop_1",
  "type": "fotohub.image.smart_crop",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>",
    "aspect": "1:1"
  }
}
```

---

#### `fotohub.image.watermark` — Watermark

Add text or image watermark.

- **Executor Runtime:** `http`
- **Microservice Service:** `image-engine` (endpoint: `/api/watermark`)
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |
| `text` | `string` | No | `© FOTOhub` |  |
| `position` | `options` | No | `bottom-right` | <br>_Options:_ `top-left`, `top-right`, `bottom-left`, `bottom-right`, `center` |
| `opacity` | `number` | No | `70` |  |

```json
{
  "id": "fotohub_image_watermark_1",
  "type": "fotohub.image.watermark",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>",
    "text": "\u00a9 FOTOhub",
    "position": "bottom-right",
    "opacity": 70
  }
}
```

---

#### `fotohub.image.generate_bg` — Generate Background

Composite a subject onto a freshly generated AI background.

- **Executor Runtime:** `http`
- **Microservice Service:** `image-engine` (endpoint: `/api/generate-bg`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |
| `bg_prompt` | `string` | Yes | _none_ |  |

```json
{
  "id": "fotohub_image_generate_bg_1",
  "type": "fotohub.image.generate_bg",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>",
    "bg_prompt": "<value>"
  }
}
```

---

#### `fotohub.image.deepfake` — Deepfake Video

Advanced multi-frame face swap for video (opt-in watermarking + audit log).

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `STARTER`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `source_face_url` | `string` | Yes | _none_ |  |
| `target_video_url` | `string` | Yes | _none_ |  |

```json
{
  "id": "fotohub_image_deepfake_1",
  "type": "fotohub.image.deepfake",
  "position": [
    250,
    150
  ],
  "params": {
    "source_face_url": "<value>",
    "target_video_url": "<value>"
  }
}
```

---

## 🎬 FotoHub AI Video Generation <a id="fotohub-video"></a>

> **Total Nodes:** 12 | **Category Identifier:** `fotohub.video`

High-performance video engine: text/image-to-video (Luma, Runway, Kling), clip extension, AI slow-motion frame interpolation, gyroscopic stabilization, NLE timeline rendering, and social format transcoding.

**Enterprise Use Case:** Creating dynamic 10-second social video teasers synced to musical beats, stabilized for handheld camera motion, and rendered in vertical MP4.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `fotohub.video.generate` | **Generate Video** | In: `main`<br>Out: `main, error` | `http` | per_second |
| `fotohub.video.animate_image` | **Animate Image** | In: `main`<br>Out: `main, error` | `http` | per_second |
| `fotohub.video.transcribe` | **Transcribe Video** | In: `main`<br>Out: `main, error` | `http` | per_minute |
| `fotohub.video.render_timeline` | **Render Timeline** | In: `main`<br>Out: `main, error` | `http` | per_second |
| `fotohub.video.transcode` | **Transcode** | In: `main`<br>Out: `main, error` | `http` | per_second |
| `fotohub.video.trim` | **Trim** | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.video.merge` | **Merge Videos** | In: `main`<br>Out: `main, error` | `http` | per_second |
| `fotohub.video.extract_audio` | **Extract Audio** | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.video.extract_frames` | **Extract Frames** | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.video.stabilize` | **Stabilize** | In: `main`<br>Out: `main, error` | `http` | per_second |
| `fotohub.video.compress` | **Compress** | In: `main`<br>Out: `main, error` | `http` | per_second |
| `fotohub.video.summarize` | **Summarize Video** | In: `main`<br>Out: `main, error` | `edge_fn` | per_minute |

### Node Specifications (FotoHub AI Video Generation)

#### `fotohub.video.generate` — Generate Video

Create a short video from a prompt or image using Veo, Sora, Hailuo, etc.

- **Executor Runtime:** `http`
- **Microservice Service:** `video-engine` (endpoint: `/generate`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_second

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `model` | `options` | Yes | `sora-2-azure` | <br>_Options:_ `sora-2-pro`, `sora-2-azure`, `veo-3.1-generate-001`, `veo-3.1-fast-generate-001`, `kling-v3` (+20 more) |
| `prompt` | `string` | Yes | _none_ |  |
| `first_frame_url` | `string` | No | _none_ |  |
| `last_frame_url` | `string` | No | _none_ |  |
| `duration_s` | `number` | No | `5` |  |
| `aspect_ratio` | `options` | No | `16:9` | <br>_Options:_ `16:9`, `9:16`, `1:1` |
| `resolution` | `options` | No | `720p` | <br>_Options:_ `720p`, `1080p`, `4k` |
| `generate_audio` | `options` | No | `true` | <br>_Options:_ `true`, `false` |

```json
{
  "id": "fotohub_video_generate_1",
  "type": "fotohub.video.generate",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "sora-2-azure",
    "prompt": "<value>"
  }
}
```

---

#### `fotohub.video.animate_image` — Animate Image

Turn a still image into a short animated clip.

- **Executor Runtime:** `http`
- **Microservice Service:** `video-engine` (endpoint: `/generate`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_second

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |
| `motion_prompt` | `string` | No | `subtle natural motion` |  |
| `duration_s` | `number` | No | `4` |  |

```json
{
  "id": "fotohub_video_animate_image_1",
  "type": "fotohub.video.animate_image",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>",
    "motion_prompt": "subtle natural motion",
    "duration_s": 4
  }
}
```

---

#### `fotohub.video.transcribe` — Transcribe Video

Extract speech transcript (Whisper / chatterbox).

- **Executor Runtime:** `http`
- **Microservice Service:** `chatterbox` (endpoint: `/transcribe`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_minute

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Yes | _none_ |  |
| `language` | `options` | No | `auto` | <br>_Options:_ `auto`, `en`, `pl`, `de`, `es` (+3 more) |

```json
{
  "id": "fotohub_video_transcribe_1",
  "type": "fotohub.video.transcribe",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<value>",
    "language": "auto"
  }
}
```

---

#### `fotohub.video.render_timeline` — Render Timeline

Render a full multi-track video project (clips, audio, text, effects).

- **Executor Runtime:** `http`
- **Microservice Service:** `video-engine` (endpoint: `/render`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_second

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `project_json` | `string` | Yes | _none_ | Full video-engine timeline spec. |
| `format` | `options` | No | `mp4` | <br>_Options:_ `mp4`, `webm`, `mov` |
| `quality` | `options` | No | `1080p` | <br>_Options:_ `1080p`, `720p`, `480p`, `4k` |

```json
{
  "id": "fotohub_video_render_timeline_1",
  "type": "fotohub.video.render_timeline",
  "position": [
    250,
    150
  ],
  "params": {
    "project_json": "<value>",
    "format": "mp4",
    "quality": "1080p"
  }
}
```

---

#### `fotohub.video.transcode` — Transcode

Convert a video to another format/codec/resolution.

- **Executor Runtime:** `http`
- **Microservice Service:** `video-engine` (endpoint: `/transcode`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_second

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Yes | _none_ |  |
| `format` | `options` | No | `mp4` | <br>_Options:_ `mp4`, `webm`, `mov`, `gif` |
| `quality` | `options` | No | `720p` | <br>_Options:_ `1080p`, `720p`, `480p` |

```json
{
  "id": "fotohub_video_transcode_1",
  "type": "fotohub.video.transcode",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<value>",
    "format": "mp4",
    "quality": "720p"
  }
}
```

---

#### `fotohub.video.trim` — Trim

Cut a video to [start, end] seconds.

- **Executor Runtime:** `http`
- **Microservice Service:** `video-engine` (endpoint: `/trim`)
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Yes | _none_ |  |
| `start_s` | `number` | No | `0` |  |
| `end_s` | `number` | Yes | _none_ |  |

```json
{
  "id": "fotohub_video_trim_1",
  "type": "fotohub.video.trim",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<value>",
    "start_s": 0,
    "end_s": "<value>"
  }
}
```

---

#### `fotohub.video.merge` — Merge Videos

Concatenate multiple clips into one.

- **Executor Runtime:** `http`
- **Microservice Service:** `video-engine` (endpoint: `/merge`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_second

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `urls_json` | `string` | Yes | _none_ |  |
| `transition` | `options` | No | `none` | <br>_Options:_ `none`, `fade`, `dissolve` |

```json
{
  "id": "fotohub_video_merge_1",
  "type": "fotohub.video.merge",
  "position": [
    250,
    150
  ],
  "params": {
    "urls_json": "<value>",
    "transition": "none"
  }
}
```

---

#### `fotohub.video.extract_audio` — Extract Audio

Pull audio track out as MP3.

- **Executor Runtime:** `http`
- **Microservice Service:** `video-engine` (endpoint: `/extract-audio`)
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Yes | _none_ |  |

```json
{
  "id": "fotohub_video_extract_audio_1",
  "type": "fotohub.video.extract_audio",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<value>"
  }
}
```

---

#### `fotohub.video.extract_frames` — Extract Frames

Grab N still frames from a video at even intervals.

- **Executor Runtime:** `http`
- **Microservice Service:** `video-engine` (endpoint: `/extract-frames`)
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Yes | _none_ |  |
| `count` | `number` | No | `10` |  |

```json
{
  "id": "fotohub_video_extract_frames_1",
  "type": "fotohub.video.extract_frames",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<value>",
    "count": 10
  }
}
```

---

#### `fotohub.video.stabilize` — Stabilize

Remove camera shake.

- **Executor Runtime:** `http`
- **Microservice Service:** `video-engine` (endpoint: `/stabilize`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_second

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Yes | _none_ |  |
| `strength` | `number` | No | `50` |  |

```json
{
  "id": "fotohub_video_stabilize_1",
  "type": "fotohub.video.stabilize",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<value>",
    "strength": 50
  }
}
```

---

#### `fotohub.video.compress` — Compress

Reduce file size while preserving quality.

- **Executor Runtime:** `http`
- **Microservice Service:** `video-engine` (endpoint: `/compress`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_second

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Yes | _none_ |  |
| `target_size_mb` | `number` | No | `25` |  |

```json
{
  "id": "fotohub_video_compress_1",
  "type": "fotohub.video.compress",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<value>",
    "target_size_mb": 25
  }
}
```

---

#### `fotohub.video.summarize` — Summarize Video

Generate a text summary of what's in a video.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** per_minute

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Yes | _none_ |  |
| `max_words` | `number` | No | `120` |  |

```json
{
  "id": "fotohub_video_summarize_1",
  "type": "fotohub.video.summarize",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<value>",
    "max_words": 120
  }
}
```

---

## 🎵 FotoHub Audio, Voice & Music <a id="fotohub-audio"></a>

> **Total Nodes:** 14 | **Category Identifier:** `fotohub.audio`

Expressive text-to-speech in 100+ languages, generative music composition (Suno, Udio), cinematic SFX, LUFS broadcast mastering, Whisper Large v3 speech-to-text, stem separation, and voice cloning.

**Enterprise Use Case:** Generating multilingual voiceovers, composing custom royalty-free lofi background music, and mastering the combined audio to Spotify and YouTube standards.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `fotohub.audio.generate_voice` | **Generate Voice** | In: `main`<br>Out: `main, error` | `edge_fn` | per_characters |
| `fotohub.audio.generate_music` | **Generate Music** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.audio.generate_sfx` | **Generate Sound Effects (SFX)** | In: `main`<br>Out: `main, error` | `edge_fn` | per_operation |
| `fotohub.audio.mastering` | **Audio Mastering** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.audio.dubbing` | **AI Dubbing** | In: `main`<br>Out: `main, error` | `edge_fn` | per_minute |
| `fotohub.audio.transcribe` | **Transcribe Audio** | In: `main`<br>Out: `main, error` | `http` | per_minute |
| `fotohub.audio.speech_to_speech` | **Audio: Speech-to-Speech** | In: `main`<br>Out: `main, error` | `edge_fn` | per_minute |
| `fotohub.audio.voice_clone` | **Voice Clone** | In: `main`<br>Out: `main, error` | `edge_fn` | per_characters |
| `fotohub.audio.mix` | **Mix Tracks** | In: `main`<br>Out: `main, error` | `http` | per_minute |
| `fotohub.audio.apply_effect` | **Apply Effect** | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.audio.normalize` | **Normalize Loudness** | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.audio.separate_stems` | **Separate Stems** | In: `main`<br>Out: `main, error` | `http` | per_minute |
| `fotohub.audio.trim` | **Trim Audio** | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.audio.merge` | **Merge Audio** | In: `main`<br>Out: `main, error` | `http` | free |

### Node Specifications (FotoHub Audio, Voice & Music)

#### `fotohub.audio.generate_voice` — Generate Voice

Text-to-speech using ElevenLabs / chatterbox voices.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** per_characters

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `model` | `options` | Yes | `elevenlabs` | <br>_Options:_ `elevenlabs`, `google-tts`, `openai-tts`, `bark` |
| `text` | `string` | Yes | _none_ |  |
| `voice_id` | `options` | No | `ola-pl` | <br>_Options:_ `rachel`, `adam`, `ola-pl`, `jakub-pl`, `bella` (+4 more) |
| `language` | `options` | No | `pl` | <br>_Options:_ `pl`, `en`, `de`, `es`, `fr` (+1 more) |
| `speed` | `number` | No | `1.0` |  |
| `stability` | `number` | No | `0.5` |  |

```json
{
  "id": "fotohub_audio_generate_voice_1",
  "type": "fotohub.audio.generate_voice",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "elevenlabs",
    "text": "<value>",
    "voice_id": "ola-pl",
    "language": "pl"
  }
}
```

---

#### `fotohub.audio.generate_music` — Generate Music

Create original music from a prompt (Stable Audio / Udio).

- **Executor Runtime:** `http`
- **Microservice Service:** `music-server` (endpoint: `/generate`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `model` | `options` | Yes | `suno-ai` | <br>_Options:_ `suno-ai`, `udio`, `stable-audio-2`, `musicgen` |
| `prompt` | `string` | Yes | _none_ |  |
| `genre` | `options` | No | `electronic` | <br>_Options:_ `electronic`, `hip-hop`, `pop`, `rock`, `classical` (+6 more) |
| `mood` | `options` | No | `energetic` | <br>_Options:_ `energetic`, `calm`, `epic`, `happy`, `dark` (+4 more) |
| `duration_s` | `number` | No | `30` |  |
| `instrumental` | `options` | No | `true` | <br>_Options:_ `true`, `false` |

```json
{
  "id": "fotohub_audio_generate_music_1",
  "type": "fotohub.audio.generate_music",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "suno-ai",
    "prompt": "<value>",
    "genre": "electronic",
    "mood": "energetic"
  }
}
```

---

#### `fotohub.audio.generate_sfx` — Generate Sound Effects (SFX)

Create custom sound effects from a descriptive prompt.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `prompt` | `string` | Yes | _none_ |  |
| `category` | `options` | No | `cinematic` | <br>_Options:_ `nature`, `urban`, `mechanical`, `digital`, `cinematic` (+1 more) |
| `duration_s` | `number` | No | `3` |  |

```json
{
  "id": "fotohub_audio_generate_sfx_1",
  "type": "fotohub.audio.generate_sfx",
  "position": [
    250,
    150
  ],
  "params": {
    "prompt": "<value>",
    "category": "cinematic",
    "duration_s": 3
  }
}
```

---

#### `fotohub.audio.mastering` — Audio Mastering

Professional AI audio mastering with EQ, compression and limiter presets.

- **Executor Runtime:** `http`
- **Microservice Service:** `music-server` (endpoint: `/master`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `audio_url` | `string` | Yes | _none_ |  |
| `preset` | `options` | No | `punchy` | <br>_Options:_ `punchy`, `warm`, `club`, `podcast`, `cinematic` |
| `target_lufs` | `number` | No | `-14` |  |

```json
{
  "id": "fotohub_audio_mastering_1",
  "type": "fotohub.audio.mastering",
  "position": [
    250,
    150
  ],
  "params": {
    "audio_url": "<value>",
    "preset": "punchy",
    "target_lufs": -14
  }
}
```

---

#### `fotohub.audio.dubbing` — AI Dubbing

Translate and dub spoken audio into another language with matching voice timbre.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** per_minute

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `audio_url` | `string` | Yes | _none_ |  |
| `target_language` | `options` | No | `en` | <br>_Options:_ `en`, `pl`, `de`, `es`, `fr` (+2 more) |
| `num_speakers` | `number` | No | `1` |  |

```json
{
  "id": "fotohub_audio_dubbing_1",
  "type": "fotohub.audio.dubbing",
  "position": [
    250,
    150
  ],
  "params": {
    "audio_url": "<value>",
    "target_language": "en",
    "num_speakers": 1
  }
}
```

---

#### `fotohub.audio.transcribe` — Transcribe Audio

Speech-to-text for an audio file.

- **Executor Runtime:** `http`
- **Microservice Service:** `chatterbox` (endpoint: `/transcribe`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_minute

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `audio_url` | `string` | Yes | _none_ |  |
| `language` | `options` | No | `auto` | <br>_Options:_ `auto`, `en`, `pl`, `de`, `es` |

```json
{
  "id": "fotohub_audio_transcribe_1",
  "type": "fotohub.audio.transcribe",
  "position": [
    250,
    150
  ],
  "params": {
    "audio_url": "<value>",
    "language": "auto"
  }
}
```

---

#### `fotohub.audio.speech_to_speech` — Audio: Speech-to-Speech

Convert spoken voice into a target character or tone.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** per_minute

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `audio_url` | `string` | Yes | _none_ |  |
| `target_voice` | `options` | No | `ola-pl` | <br>_Options:_ `rachel`, `adam`, `ola-pl`, `jakub-pl`, `bella` (+4 more) |
| `preserve_emotion` | `options` | No | `true` | <br>_Options:_ `true`, `false` |
| `remove_background` | `options` | No | `true` | <br>_Options:_ `true`, `false` |

```json
{
  "id": "fotohub_audio_speech_to_speech_1",
  "type": "fotohub.audio.speech_to_speech",
  "position": [
    250,
    150
  ],
  "params": {
    "audio_url": "<value>",
    "target_voice": "ola-pl",
    "preserve_emotion": "true",
    "remove_background": "true"
  }
}
```

---

#### `fotohub.audio.voice_clone` — Voice Clone

Clone a speaker's voice from a reference sample, then TTS with it.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `STARTER`
- **Execution Cost:** per_characters

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `reference_url` | `string` | Yes | _none_ | 5-30s of clean speech. |
| `text` | `string` | Yes | _none_ |  |
| `language` | `options` | No | `en` | <br>_Options:_ `en`, `pl`, `de`, `es`, `fr` |

```json
{
  "id": "fotohub_audio_voice_clone_1",
  "type": "fotohub.audio.voice_clone",
  "position": [
    250,
    150
  ],
  "params": {
    "reference_url": "<value>",
    "text": "<value>",
    "language": "en"
  }
}
```

---

#### `fotohub.audio.mix` — Mix Tracks

Combine multiple audio tracks with per-track volume + pan.

- **Executor Runtime:** `http`
- **Microservice Service:** `music-server` (endpoint: `/render`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_minute

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `tracks_json` | `string` | Yes | _none_ |  |

```json
{
  "id": "fotohub_audio_mix_1",
  "type": "fotohub.audio.mix",
  "position": [
    250,
    150
  ],
  "params": {
    "tracks_json": "<value>"
  }
}
```

---

#### `fotohub.audio.apply_effect` — Apply Effect

Apply EQ / reverb / compression / echo to a track.

- **Executor Runtime:** `http`
- **Microservice Service:** `music-server` (endpoint: `/effect`)
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `audio_url` | `string` | Yes | _none_ |  |
| `effect` | `options` | No | `reverb` | <br>_Options:_ `reverb`, `echo`, `compression`, `eq_bright`, `eq_warm` (+3 more) |
| `intensity` | `number` | No | `50` |  |

```json
{
  "id": "fotohub_audio_apply_effect_1",
  "type": "fotohub.audio.apply_effect",
  "position": [
    250,
    150
  ],
  "params": {
    "audio_url": "<value>",
    "effect": "reverb",
    "intensity": 50
  }
}
```

---

#### `fotohub.audio.normalize` — Normalize Loudness

2-pass EBU R128 loudness normalization.

- **Executor Runtime:** `http`
- **Microservice Service:** `music-server` (endpoint: `/normalize`)
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `audio_url` | `string` | Yes | _none_ |  |
| `target_lufs` | `number` | No | `-16` | −16 LUFS for podcasts, −14 for streaming |

```json
{
  "id": "fotohub_audio_normalize_1",
  "type": "fotohub.audio.normalize",
  "position": [
    250,
    150
  ],
  "params": {
    "audio_url": "<value>",
    "target_lufs": -16
  }
}
```

---

#### `fotohub.audio.separate_stems` — Separate Stems

Split a mix into vocals, drums, bass, other (demucs).

- **Executor Runtime:** `http`
- **Microservice Service:** `music-server` (endpoint: `/stems`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_minute

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `audio_url` | `string` | Yes | _none_ |  |

```json
{
  "id": "fotohub_audio_separate_stems_1",
  "type": "fotohub.audio.separate_stems",
  "position": [
    250,
    150
  ],
  "params": {
    "audio_url": "<value>"
  }
}
```

---

#### `fotohub.audio.trim` — Trim Audio

Cut audio to [start, end] seconds.

- **Executor Runtime:** `http`
- **Microservice Service:** `music-server` (endpoint: `/trim`)
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `audio_url` | `string` | Yes | _none_ |  |
| `start_s` | `number` | No | `0` |  |
| `end_s` | `number` | Yes | _none_ |  |

```json
{
  "id": "fotohub_audio_trim_1",
  "type": "fotohub.audio.trim",
  "position": [
    250,
    150
  ],
  "params": {
    "audio_url": "<value>",
    "start_s": 0,
    "end_s": "<value>"
  }
}
```

---

#### `fotohub.audio.merge` — Merge Audio

Join multiple clips end-to-end.

- **Executor Runtime:** `http`
- **Microservice Service:** `music-server` (endpoint: `/merge`)
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `urls_json` | `string` | Yes | _none_ |  |
| `crossfade_ms` | `number` | No | `0` |  |

```json
{
  "id": "fotohub_audio_merge_1",
  "type": "fotohub.audio.merge",
  "position": [
    250,
    150
  ],
  "params": {
    "urls_json": "<value>",
    "crossfade_ms": 0
  }
}
```

---

## 🎙️ Real-Time Voice & Streaming Audio <a id="voice"></a>

> **Total Nodes:** 3 | **Category Identifier:** `voice`

Full-duplex conversational voice with sub-300ms latency, automatic voice activity detection (VAD), interruption handling, and streaming WebSocket transcription and synthesis.

**Enterprise Use Case:** An interactive phone/web voice assistant that conducts customer consultations, answers technical photography questions, and books appointments.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `voice.conversation` | **Voice: Start Conversation** | In: `main`<br>Out: `main, error` | `builtin` | per_minute |
| `voice.end_call` | **Zakończ rozmowę** | In: `main`<br>Out: `main` | `builtin` | free |
| `voice.detect_language` | **Wykryj język** | In: `main`<br>Out: `main, error` | `builtin` | free |

### Node Specifications (Real-Time Voice & Streaming Audio)

#### `voice.conversation` — Voice: Start Conversation

Initiate real-time full-duplex conversational audio session.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** per_minute

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `first_message` | `string` | No | _none_ |  |
| `voice_id` | `string` | No | _none_ |  |
| `language` | `options` | No | `auto` | <br>_Options:_ `auto`, `pl`, `en`, `de`, `es` (+1 more) |

```json
{
  "id": "voice_conversation_1",
  "type": "voice.conversation",
  "position": [
    250,
    150
  ],
  "params": {
    "language": "auto"
  }
}
```

---

#### `voice.end_call` — Zakończ rozmowę

Zamyka bieżącą rozmowę głosową.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

```json
{
  "id": "voice_end_call_1",
  "type": "voice.end_call",
  "position": [
    250,
    150
  ],
  "params": {}
}
```

---

#### `voice.detect_language` — Wykryj język

Automatycznie wykrywa język mówcy w tle rozmowy.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

```json
{
  "id": "voice_detect_language_1",
  "type": "voice.detect_language",
  "position": [
    250,
    150
  ],
  "params": {}
}
```

---

## 🏷️ FotoHub Brand Governance <a id="fotohub-brand"></a>

> **Total Nodes:** 6 | **Category Identifier:** `fotohub.brand`

Automated brand compliance: PDF brand guideline extraction, color palette generation, intelligent logo watermarking, and Delta-E visual compliance enforcement gates.

**Enterprise Use Case:** Automatically rejecting and re-generating marketing assets when accent colors deviate by more than DeltaE=2.0 from official corporate guidelines.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `fotohub.brand.get_face` | **Brand: Get Face** | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.brand.generate_face` | **Brand: Generate Face** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.brand.get_logo` | **Brand: Get Logo** | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.brand.get_product_shot` | **Brand: Get Product Shot** | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.brand.extract_palette` | **Brand: Extract Palette** | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.brand.apply_to_image` | **Brand: Apply to Image** | In: `main`<br>Out: `main, error` | `http` | per_operation |

### Node Specifications (FotoHub Brand Governance)

#### `fotohub.brand.get_face` — Brand: Get Face

Fetch a brand face/character by ID.

- **Executor Runtime:** `http`
- **Microservice Service:** `brand-engine` (endpoint: `/v1/faces/{face_id}`)
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `face_id` | `string` | Yes | _none_ |  |

```json
{
  "id": "fotohub_brand_get_face_1",
  "type": "fotohub.brand.get_face",
  "position": [
    250,
    150
  ],
  "params": {
    "face_id": "<value>"
  }
}
```

---

#### `fotohub.brand.generate_face` — Brand: Generate Face

Generate a new brand face using the image-engine.

- **Executor Runtime:** `http`
- **Microservice Service:** `brand-engine` (endpoint: `/v1/faces/generate`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `brand_id` | `string` | Yes | _none_ |  |
| `prompt` | `string` | Yes | _none_ |  |
| `model` | `options` | No | `nano-banana-pro` | <br>_Options:_ `nano-banana-pro`, `imagen-4-ultra`, `gpt-image-1.5`, `flux-1-pro` |
| `perspective` | `options` | No | `front` | <br>_Options:_ `front`, `three-quarter-left`, `three-quarter-right`, `profile`, `back` |

```json
{
  "id": "fotohub_brand_generate_face_1",
  "type": "fotohub.brand.generate_face",
  "position": [
    250,
    150
  ],
  "params": {
    "brand_id": "<value>",
    "prompt": "<value>",
    "model": "nano-banana-pro",
    "perspective": "front"
  }
}
```

---

#### `fotohub.brand.get_logo` — Brand: Get Logo

Fetch a logo asset URL.

- **Executor Runtime:** `http`
- **Microservice Service:** `brand-engine` (endpoint: `/v1/logos/{logo_id}`)
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `logo_id` | `string` | Yes | _none_ |  |

```json
{
  "id": "fotohub_brand_get_logo_1",
  "type": "fotohub.brand.get_logo",
  "position": [
    250,
    150
  ],
  "params": {
    "logo_id": "<value>"
  }
}
```

---

#### `fotohub.brand.get_product_shot` — Brand: Get Product Shot

Fetch a stored product photo.

- **Executor Runtime:** `http`
- **Microservice Service:** `brand-engine` (endpoint: `/v1/products/{product_id}`)
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `product_id` | `string` | Yes | _none_ |  |

```json
{
  "id": "fotohub_brand_get_product_shot_1",
  "type": "fotohub.brand.get_product_shot",
  "position": [
    250,
    150
  ],
  "params": {
    "product_id": "<value>"
  }
}
```

---

#### `fotohub.brand.extract_palette` — Brand: Extract Palette

Extract dominant + complementary colors from an image.

- **Executor Runtime:** `http`
- **Microservice Service:** `brand-engine` (endpoint: `/v1/palette/extract`)
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |

```json
{
  "id": "fotohub_brand_extract_palette_1",
  "type": "fotohub.brand.extract_palette",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>"
  }
}
```

---

#### `fotohub.brand.apply_to_image` — Brand: Apply to Image

Composite logo/watermark/colors onto an image.

- **Executor Runtime:** `http`
- **Microservice Service:** `brand-engine` (endpoint: `/v1/brand/apply-to-image`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Yes | _none_ |  |
| `brand_id` | `string` | Yes | _none_ |  |
| `apply` | `options` | No | `logo` | <br>_Options:_ `logo`, `watermark`, `both` |

```json
{
  "id": "fotohub_brand_apply_to_image_1",
  "type": "fotohub.brand.apply_to_image",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<value>",
    "brand_id": "<value>",
    "apply": "logo"
  }
}
```

---

## 🧠 AI Models, LLMs & Vision <a id="ai"></a>

> **Total Nodes:** 6 | **Category Identifier:** `ai`

Direct integration with top-tier foundation models (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro) for multimodal vision analysis, OCR inspection, text generation, sentiment classification, and embeddings.

**Enterprise Use Case:** Multimodal QA inspection checking generated imagery for distorted hands, unintended text artifacts, or anatomical defects prior to publishing.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `ai.chat` | **AI Chat** | In: `main`<br>Out: `main, error` | `edge_fn` | per_tokens |
| `ai.agent` | **AI Agent** | In: `main, tools, memory`<br>Out: `main, error` | `llm_agent` | dynamic |
| `ai.extract` | **Extract Structured Data** | In: `main`<br>Out: `main, error` | `edge_fn` | per_tokens |
| `ai.classify` | **Classify** | In: `main`<br>Out: `main, error` | `edge_fn` | per_tokens |
| `analysis.evaluate` | **Analyze: Evaluate Run** | In: `main`<br>Out: `main, error` | `edge_fn` | per_tokens |
| `analysis.extract_data` | **Analyze: Extract Data** | In: `main`<br>Out: `main, error` | `edge_fn` | per_tokens |

### Node Specifications (AI Models, LLMs & Vision)

#### `ai.chat` — AI Chat

Single LLM call with a prompt. Great for text generation, classification, rewrites.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** per_tokens

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `model` | `options` | Yes | `claude-sonnet-4-6` | <br>_Options:_ `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`, `gpt-5.1`, `gpt-5-mini` (+2 more) |
| `system_prompt` | `string` | No | _none_ | Sets the model's role. |
| `user_prompt` | `string` | Yes | _none_ |  |
| `` | `collapsible` | No | _none_ | Advanced |

```json
{
  "id": "ai_chat_1",
  "type": "ai.chat",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "claude-sonnet-4-6",
    "user_prompt": "<value>"
  }
}
```

---

#### `ai.agent` — AI Agent

An LLM agent that can call tools (child nodes) to accomplish a goal. Wire any FOTOhub action as a tool by connecting to the 'tools' input.

- **Executor Runtime:** `llm_agent`
- **Required Tier:** `FREE`
- **Execution Cost:** dynamic

- **Input Ports:** `main` (main), `tools` (ai_tool), `memory` (ai_memory)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `model` | `options` | Yes | `claude-sonnet-4-6` | <br>_Options:_ `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`, `gpt-5.1`, `gpt-5-mini` (+2 more) |
| `instructions` | `string` | Yes | _none_ | Appended to the system prompt. |
| `user_goal` | `string` | Yes | _none_ |  |
| `` | `collapsible` | No | _none_ | Advanced |

```json
{
  "id": "ai_agent_1",
  "type": "ai.agent",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "claude-sonnet-4-6",
    "instructions": "<value>",
    "user_goal": "<value>"
  }
}
```

---

#### `ai.extract` — Extract Structured Data

Use an LLM to extract structured JSON matching a schema from free text.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** per_tokens

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `model` | `options` | No | `claude-haiku-4-5` | <br>_Options:_ `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`, `gpt-5.1`, `gpt-5-mini` (+2 more) |
| `text` | `string` | Yes | _none_ |  |
| `schema` | `json` | Yes | `{'type': 'object', 'properties': {'name': {'type': 'string'}}, 'required': ['name']}` |  |

```json
{
  "id": "ai_extract_1",
  "type": "ai.extract",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "claude-haiku-4-5",
    "text": "<value>",
    "schema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        }
      },
      "required": [
        "name"
      ]
    }
  }
}
```

---

#### `ai.classify` — Classify

Classify input into one of N labels.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** per_tokens

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `model` | `options` | No | `claude-haiku-4-5` | <br>_Options:_ `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`, `gpt-5.1`, `gpt-5-mini` (+2 more) |
| `input` | `string` | Yes | _none_ |  |
| `labels` | `json` | No | `['positive', 'neutral', 'negative']` | Array of string labels. |

```json
{
  "id": "ai_classify_1",
  "type": "ai.classify",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "claude-haiku-4-5",
    "input": "<value>",
    "labels": [
      "positive",
      "neutral",
      "negative"
    ]
  }
}
```

---

#### `analysis.evaluate` — Analyze: Evaluate Run

LLM evaluates workflow run quality against defined grading criteria.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** per_tokens

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `model` | `options` | No | `gemini-2.5-flash` | <br>_Options:_ `gemini-2.5-flash`, `claude-haiku-4-5`, `gpt-5-mini` |
| `transcript_path` | `string` | No | `$.output` |  |

```json
{
  "id": "analysis_evaluate_1",
  "type": "analysis.evaluate",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "gemini-2.5-flash",
    "transcript_path": "$.output"
  }
}
```

---

#### `analysis.extract_data` — Analyze: Extract Data

Extract structured entities and fields from unstructured text.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** per_tokens

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `model` | `options` | No | `claude-haiku-4-5` | <br>_Options:_ `gemini-2.5-flash`, `claude-haiku-4-5` |
| `text` | `string` | Yes | _none_ |  |

```json
{
  "id": "analysis_extract_data_1",
  "type": "analysis.extract_data",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "claude-haiku-4-5",
    "text": "<value>"
  }
}
```

---

## 📚 Knowledge Base & Vector Memory <a id="knowledge"></a>

> **Total Nodes:** 3 | **Category Identifier:** `knowledge`

Semantic document search (Retrieval-Augmented Generation), persistent agent vector memory, and partitioned tenant collections with automated TTL expiration.

**Enterprise Use Case:** Enabling customer service agents to answer inquiries using a 500-page enterprise knowledge base of camera gear, pricing tables, and studio policies.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `knowledge.retrieve` | **Knowledge Retrieve (RAG)** | In: `main`<br>Out: `main, error` | `edge_fn` | per_operation |
| `memory.store` | **Memory: Store Record** | In: `main`<br>Out: `main` | `builtin` | Free (0 credits) |
| `memory.query` | **Memory: Semantic Query** | In: `main`<br>Out: `main` | `builtin` | Free (0 credits) |

### Node Specifications (Knowledge Base & Vector Memory)

#### `knowledge.retrieve` — Knowledge Retrieve (RAG)

Retrieve relevant context passages from agent knowledge base.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `query` | `string` | Yes | _none_ |  |
| `k` | `number` | No | `5` |  |
| `source` | `options` | No | `workflow` | Zakres wyszukiwania.<br>_Options:_ `all`, `workflow`, `global` |

```json
{
  "id": "knowledge_retrieve_1",
  "type": "knowledge.retrieve",
  "position": [
    250,
    150
  ],
  "params": {
    "query": "<value>",
    "k": 5,
    "source": "workflow"
  }
}
```

---

#### `memory.store` — Memory: Store Record

Store facts or context into agent long-term memory.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `content` | `string` | Yes | _none_ |  |
| `namespace` | `string` | No | `default` | Izolacja logiczna / przestrzeń nazw pamięci |
| `collection_name` | `string` | No | `default` | Kolekcja wektorowa |
| `tenant_id` | `string` | No | _none_ | Identyfikator tenanta (domyślnie user_id) |
| `category` | `options` | No | `brand_voice` | <br>_Options:_ `brand_voice`, `user_preference`, `project_rule`, `fact` |
| `tags` | `string` | No | _none_ |  |
| `metadata` | `json` | No | _none_ | Dowolne metadane powiązane z wpisem |
| `ttl_seconds` | `number` | No | `0` |  |
| `ttl_days` | `number` | No | `0` |  |
| `embedding` | `json` | No | _none_ |  |

```json
{
  "id": "memory_store_1",
  "type": "memory.store",
  "position": [
    250,
    150
  ],
  "params": {
    "content": "<value>",
    "namespace": "default",
    "collection_name": "default"
  }
}
```

---

#### `memory.query` — Memory: Semantic Query

Query agent long-term vector memory for past interactions.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `query` | `string` | Yes | _none_ |  |
| `namespace` | `string` | No | `default` | Szukaj w zadanym namespace |
| `collection_name` | `string` | No | `default` | Nazwa kolekcji |
| `tenant_id` | `string` | No | _none_ | Identyfikator tenanta (domyślnie user_id) |
| `category_filter` | `options` | No | `all` | <br>_Options:_ `all`, `brand_voice`, `user_preference`, `project_rule`, `fact` |
| `filter_metadata` | `json` | No | _none_ | Zaawansowane filtry $eq, $in, $gte, $lte |
| `min_score` | `number` | No | `0.7` |  |
| `top_k` | `number` | No | `3` |  |
| `query_vector` | `json` | No | _none_ |  |

```json
{
  "id": "memory_query_1",
  "type": "memory.query",
  "position": [
    250,
    150
  ],
  "params": {
    "query": "<value>",
    "namespace": "default",
    "collection_name": "default"
  }
}
```

---

## 📱 Social Media Publishing & Scheduling <a id="social"></a>

> **Total Nodes:** 14 | **Category Identifier:** `social`

Direct API publishing and intelligent scheduling across Instagram (Posts, Reels, Stories), TikTok, YouTube Shorts, Facebook, LinkedIn, Twitter/X, and Pinterest, complete with hashtag optimization.

**Enterprise Use Case:** Simultaneously broadcasting a completed product video to 6 social networks with platform-tailored captions, optimal aspect ratios, and viral tags.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `social.publish_instagram_post` | **Instagram — Post** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.publish_instagram_reel` | **Instagram — Reel** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.publish_instagram_story` | **Instagram — Story** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.publish_facebook_post` | **Facebook — Post** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.publish_tiktok_video` | **Tiktok — Video** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.publish_youtube_short` | **Youtube — Short** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.publish_linkedin_post` | **Linkedin — Post** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.publish_twitter_post` | **Twitter — Post** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.publish_pinterest_pin` | **Pinterest — Pin** | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.schedule_post` | **Schedule Social Post** | In: `main`<br>Out: `main, error` | `http` | free |
| `social.generate_caption` | **Generate Caption** | In: `main`<br>Out: `main, error` | `edge_fn` | per_tokens |
| `social.generate_hashtags` | **Generate Hashtags** | In: `main`<br>Out: `main, error` | `edge_fn` | per_tokens |
| `social.listen_mentions` | **Listen: Mentions** | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.social.cross_publish` | **Multi-Social Publishing** | In: `main`<br>Out: `main, error` | `builtin` | 1 credits (~$0.0000) |

### Node Specifications (Social Media Publishing & Scheduling)

#### `social.publish_instagram_post` — Instagram — Post

Publish a post to Instagram.

- **Executor Runtime:** `http`
- **Microservice Service:** `social-engine` (endpoint: `/v1/instagram/publish/post`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Yes | _none_ |  |
| `media_url` | `string` | Yes | _none_ |  |

```json
{
  "id": "social_publish_instagram_post_1",
  "type": "social.publish_instagram_post",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<value>",
    "media_url": "<value>"
  }
}
```

---

#### `social.publish_instagram_reel` — Instagram — Reel

Publish a reel to Instagram.

- **Executor Runtime:** `http`
- **Microservice Service:** `social-engine` (endpoint: `/v1/instagram/publish/reel`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Yes | _none_ |  |
| `media_url` | `string` | Yes | _none_ |  |
| `thumbnail_url` | `string` | No | _none_ |  |
| `share_to_feed` | `boolean` | No | `True` |  |

```json
{
  "id": "social_publish_instagram_reel_1",
  "type": "social.publish_instagram_reel",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<value>",
    "media_url": "<value>",
    "share_to_feed": true
  }
}
```

---

#### `social.publish_instagram_story` — Instagram — Story

Publish a story to Instagram.

- **Executor Runtime:** `http`
- **Microservice Service:** `social-engine` (endpoint: `/v1/instagram/publish/story`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Yes | _none_ |  |
| `media_url` | `string` | Yes | _none_ |  |

```json
{
  "id": "social_publish_instagram_story_1",
  "type": "social.publish_instagram_story",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<value>",
    "media_url": "<value>"
  }
}
```

---

#### `social.publish_facebook_post` — Facebook — Post

Publish a post to Facebook.

- **Executor Runtime:** `http`
- **Microservice Service:** `social-engine` (endpoint: `/v1/facebook/publish/post`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Yes | _none_ |  |
| `media_url` | `string` | Yes | _none_ |  |
| `link_url` | `string` | No | _none_ |  |

```json
{
  "id": "social_publish_facebook_post_1",
  "type": "social.publish_facebook_post",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<value>",
    "media_url": "<value>"
  }
}
```

---

#### `social.publish_tiktok_video` — Tiktok — Video

Publish a video to Tiktok.

- **Executor Runtime:** `http`
- **Microservice Service:** `social-engine` (endpoint: `/v1/tiktok/publish/video`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Yes | _none_ |  |
| `media_url` | `string` | Yes | _none_ |  |
| `privacy` | `options` | No | `public` | <br>_Options:_ `public`, `friends`, `private` |

```json
{
  "id": "social_publish_tiktok_video_1",
  "type": "social.publish_tiktok_video",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<value>",
    "media_url": "<value>",
    "privacy": "public"
  }
}
```

---

#### `social.publish_youtube_short` — Youtube — Short

Publish a short to Youtube.

- **Executor Runtime:** `http`
- **Microservice Service:** `social-engine` (endpoint: `/v1/youtube/publish/short`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Yes | _none_ |  |
| `media_url` | `string` | Yes | _none_ |  |

```json
{
  "id": "social_publish_youtube_short_1",
  "type": "social.publish_youtube_short",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<value>",
    "media_url": "<value>"
  }
}
```

---

#### `social.publish_linkedin_post` — Linkedin — Post

Publish a post to Linkedin.

- **Executor Runtime:** `http`
- **Microservice Service:** `social-engine` (endpoint: `/v1/linkedin/publish/post`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Yes | _none_ |  |
| `media_url` | `string` | Yes | _none_ |  |

```json
{
  "id": "social_publish_linkedin_post_1",
  "type": "social.publish_linkedin_post",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<value>",
    "media_url": "<value>"
  }
}
```

---

#### `social.publish_twitter_post` — Twitter — Post

Publish a post to Twitter.

- **Executor Runtime:** `http`
- **Microservice Service:** `social-engine` (endpoint: `/v1/twitter/publish/post`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Yes | _none_ |  |
| `media_url` | `string` | Yes | _none_ |  |
| `reply_to_url` | `string` | No | _none_ |  |

```json
{
  "id": "social_publish_twitter_post_1",
  "type": "social.publish_twitter_post",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<value>",
    "media_url": "<value>"
  }
}
```

---

#### `social.publish_pinterest_pin` — Pinterest — Pin

Publish a pin to Pinterest.

- **Executor Runtime:** `http`
- **Microservice Service:** `social-engine` (endpoint: `/v1/pinterest/publish/pin`)
- **Required Tier:** `FREE`
- **Execution Cost:** per_operation

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Yes | _none_ |  |
| `media_url` | `string` | Yes | _none_ |  |
| `board_id` | `string` | Yes | _none_ |  |
| `link_url` | `string` | No | _none_ |  |

```json
{
  "id": "social_publish_pinterest_pin_1",
  "type": "social.publish_pinterest_pin",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<value>",
    "media_url": "<value>",
    "board_id": "<value>"
  }
}
```

---

#### `social.schedule_post` — Schedule Social Post

Queue a post for publication at a future time.

- **Executor Runtime:** `http`
- **Microservice Service:** `social-engine` (endpoint: `/v1/schedule`)
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `platform` | `options` | Yes | _none_ | <br>_Options:_ `instagram`, `facebook`, `tiktok`, `youtube`, `linkedin` (+2 more) |
| `caption` | `string` | Yes | _none_ |  |
| `media_url` | `string` | Yes | _none_ |  |
| `publish_at` | `string` | Yes | _none_ |  |

```json
{
  "id": "social_schedule_post_1",
  "type": "social.schedule_post",
  "position": [
    250,
    150
  ],
  "params": {
    "platform": "<value>",
    "caption": "<value>",
    "media_url": "<value>",
    "publish_at": "<value>"
  }
}
```

---

#### `social.generate_caption` — Generate Caption

LLM-generated caption + hashtags tuned to a platform.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** per_tokens

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `topic` | `string` | Yes | _none_ |  |
| `platform` | `options` | No | `instagram` | <br>_Options:_ `instagram`, `facebook`, `tiktok`, `youtube`, `linkedin` (+2 more) |
| `tone` | `options` | No | `casual` | <br>_Options:_ `casual`, `professional`, `funny`, `inspiring` |
| `hashtag_count` | `number` | No | `10` |  |

```json
{
  "id": "social_generate_caption_1",
  "type": "social.generate_caption",
  "position": [
    250,
    150
  ],
  "params": {
    "topic": "<value>",
    "platform": "instagram",
    "tone": "casual",
    "hashtag_count": 10
  }
}
```

---

#### `social.generate_hashtags` — Generate Hashtags

Produce N trending hashtags for a topic.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** per_tokens

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `topic` | `string` | Yes | _none_ |  |
| `count` | `number` | No | `10` |  |

```json
{
  "id": "social_generate_hashtags_1",
  "type": "social.generate_hashtags",
  "position": [
    250,
    150
  ],
  "params": {
    "topic": "<value>",
    "count": 10
  }
}
```

---

#### `social.listen_mentions` — Listen: Mentions

Poll a platform for brand mentions since last run.

- **Executor Runtime:** `http`
- **Microservice Service:** `social-engine` (endpoint: `/v1/listen/mentions`)
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `platform` | `options` | Yes | _none_ | <br>_Options:_ `instagram`, `facebook`, `tiktok`, `youtube`, `linkedin` (+2 more) |
| `keyword` | `string` | Yes | _none_ |  |
| `max_results` | `number` | No | `25` |  |

```json
{
  "id": "social_listen_mentions_1",
  "type": "social.listen_mentions",
  "position": [
    250,
    150
  ],
  "params": {
    "platform": "<value>",
    "keyword": "<value>",
    "max_results": 25
  }
}
```

---

#### `fotohub.social.cross_publish` — Multi-Social Publishing

Publish video or graphic simultaneously to TikTok, Reels, YouTube.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** 1 credits (~$0.0000)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Yes | _none_ |  |
| `title` | `string` | Yes | _none_ |  |
| `description` | `string` | No | _none_ |  |
| `platforms` | `options` | No | `all` | <br>_Options:_ `all`, `tiktok_reels`, `youtube_shorts` |
| `schedule_time` | `string` | No | _none_ |  |

```json
{
  "id": "fotohub_social_cross_publish_1",
  "type": "fotohub.social.cross_publish",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<value>",
    "title": "<value>",
    "platforms": "all"
  }
}
```

---

## 🔌 External Integrations & E-Commerce <a id="integration"></a>

> **Total Nodes:** 61 | **Category Identifier:** `integration`

61 production connectors for e-commerce platforms (Allegro, Shopify, WooCommerce, eBay, Etsy, PrestaShop, Shoper), payment processors (Stripe), CRMs (HubSpot, Salesforce), team messaging (Slack, Discord, Telegram, WhatsApp), and databases (Notion, Airtable, Google Sheets).

**Enterprise Use Case:** Automatically generating product listings on Allegro, Shopify, and eBay complete with AI packshots, localized copy, and real-time inventory synchronization.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `mcp.call_tool` | **MCP: Call Tool** | In: `main`<br>Out: `main, error` | `mcp` | free |
| `slack.send_message` | **Slack: Send Message** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `slack.upload_file` | **Slack: Upload File** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `gmail.send` | **Gmail: Send Email** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `gmail.list` | **Gmail: List Messages** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `calendar.create_event` | **Calendar: Create Event** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `drive.upload` | **Drive: Upload File** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `sheets.append_row` | **Sheets: Append Row** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `sheets.read_range` | **Sheets: Read Range** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `notion.create_page` | **Notion: Create Page** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `notion.query_db` | **Notion: Query Database** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `airtable.create_record` | **Airtable: Create Record** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `airtable.list_records` | **Airtable: List Records** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `discord.send_message` | **Discord: Send Message** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `telegram.send_message` | **Telegram: Send Message** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `twilio.send_sms` | **Twilio: Send SMS** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `shopify.create_product` | **Shopify: Create Product** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `shopify.update_product` | **Shopify: Update Product** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `shopify.list_products` | **Shopify: List Products** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `shopify.update_inventory` | **Shopify: Update Inventory** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `shopify.list_orders` | **Shopify: List Orders** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `shopify.fulfill_order` | **Shopify: Fulfill Order** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `woocommerce.create_product` | **WooCommerce: Create Product** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `woocommerce.update_product` | **WooCommerce: Update Product** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `woocommerce.list_orders` | **WooCommerce: List Orders** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `allegro.create_listing` | **Allegro: Create Listing** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `allegro.update_listing` | **Allegro: Aktualizuj ofertę** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `allegro.end_listing` | **Allegro: End Listing** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `allegro.list_orders` | **Allegro: List Orders** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `amazon.create_listing` | **Amazon: Create Listing** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `amazon.update_inventory` | **Amazon: Update Inventory** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `amazon.list_orders` | **Amazon: List Orders** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `etsy.create_listing` | **Etsy: Create Listing** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `etsy.update_listing` | **Etsy: Update Listing** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `etsy.list_orders` | **Etsy: Fetch Receipts** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `baselinker.add_product` | **BaseLinker: Dodaj produkt** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `baselinker.update_stock` | **BaseLinker: Aktualizuj stan** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `baselinker.publish_to_marketplace` | **BaseLinker: Wystaw na marketplace** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `baselinker.list_orders` | **BaseLinker: Pobierz zamówienia** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `ceneo.upload_feed` | **Ceneo: Prześlij feed XML** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `ceneo.list_orders` | **Ceneo: Pobierz zamówienia (Kupuję)** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `ceneo.update_order_status` | **Ceneo: Aktualizuj status zamówienia** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `ceneo.price_compare` | **Ceneo: Porównaj cenę** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `ebay.create_listing` | **eBay: Create Listing** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `ebay.update_listing` | **eBay: Update Listing** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `ebay.list_orders` | **eBay: List Orders** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `ebay.ship_order` | **eBay: Mark Shipped** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `empik.create_offer` | **Empik: Wystaw ofertę** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `empik.list_orders` | **Empik: Pobierz zamówienia** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `olx.create_ad` | **OLX: Wystaw ogłoszenie** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `olx.list_messages` | **OLX: Pobierz wiadomości** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `erli.create_listing` | **Erli: Wystaw ofertę** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `erli.list_orders` | **Erli: Pobierz zamówienia** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `zalando.create_article` | **Zalando: Create Article** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `zalando.update_stock` | **Zalando: Update Stock** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `zalando.list_orders` | **Zalando: List Orders** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `kaufland.create_offer` | **Kaufland: Create Offer** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `kaufland.list_orders` | **Kaufland: List Orders** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `stripe.create_checkout` | **Stripe: Create Checkout** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `stripe.list_customers` | **Stripe: List Customers** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `mailchimp.add_subscriber` | **Mailchimp: Add Subscriber** | In: `main`<br>Out: `main, error` | `edge_fn` | free |

### Node Specifications (External Integrations & E-Commerce)

#### `mcp.call_tool` — MCP: Call Tool

Invoke an external tool on a connected MCP server.

- **Executor Runtime:** `mcp`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `server_name` | `string` | Yes | _none_ |  |
| `tool_name` | `string` | Yes | _none_ |  |
| `arguments` | `json` | No | `{}` |  |

```json
{
  "id": "mcp_call_tool_1",
  "type": "mcp.call_tool",
  "position": [
    250,
    150
  ],
  "params": {
    "server_name": "<value>",
    "tool_name": "<value>",
    "arguments": {}
  }
}
```

---

#### `slack.send_message` — Slack: Send Message

Post a message to a channel or DM.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `channel` | `string` | Yes | _none_ |  |
| `text` | `string` | Yes | _none_ |  |
| `blocks` | `json` | No | _none_ | Slack Block Kit JSON (optional) |

```json
{
  "id": "slack_send_message_1",
  "type": "slack.send_message",
  "position": [
    250,
    150
  ],
  "params": {
    "channel": "<value>",
    "text": "<value>"
  }
}
```

---

#### `slack.upload_file` — Slack: Upload File

Share a file to a Slack channel.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `channel` | `string` | Yes | _none_ |  |
| `file_url` | `string` | Yes | _none_ |  |
| `title` | `string` | No | _none_ |  |

```json
{
  "id": "slack_upload_file_1",
  "type": "slack.upload_file",
  "position": [
    250,
    150
  ],
  "params": {
    "channel": "<value>",
    "file_url": "<value>"
  }
}
```

---

#### `gmail.send` — Gmail: Send Email

Send an email via the connected Gmail account.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `to` | `string` | Yes | _none_ |  |
| `cc` | `string` | No | _none_ |  |
| `subject` | `string` | Yes | _none_ |  |
| `body` | `string` | Yes | _none_ |  |
| `body_type` | `options` | No | `text` | <br>_Options:_ `text`, `html` |

```json
{
  "id": "gmail_send_1",
  "type": "gmail.send",
  "position": [
    250,
    150
  ],
  "params": {
    "to": "<value>",
    "subject": "<value>",
    "body": "<value>"
  }
}
```

---

#### `gmail.list` — Gmail: List Messages

Query messages using Gmail search syntax.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `query` | `string` | No | `is:unread` |  |
| `max_results` | `number` | No | `20` |  |

```json
{
  "id": "gmail_list_1",
  "type": "gmail.list",
  "position": [
    250,
    150
  ],
  "params": {
    "query": "is:unread",
    "max_results": 20
  }
}
```

---

#### `calendar.create_event` — Calendar: Create Event

Create a Google Calendar event.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `calendar_id` | `string` | No | `primary` |  |
| `title` | `string` | Yes | _none_ |  |
| `description` | `string` | No | _none_ |  |
| `start` | `string` | Yes | _none_ |  |
| `end` | `string` | Yes | _none_ |  |
| `attendees` | `string` | No | _none_ | Comma-separated emails |

```json
{
  "id": "calendar_create_event_1",
  "type": "calendar.create_event",
  "position": [
    250,
    150
  ],
  "params": {
    "calendar_id": "primary",
    "title": "<value>",
    "start": "<value>"
  }
}
```

---

#### `drive.upload` — Drive: Upload File

Upload a file to Google Drive.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `file_url` | `string` | Yes | _none_ |  |
| `folder_id` | `string` | No | _none_ | Target folder ID (optional) |
| `filename` | `string` | No | _none_ |  |

```json
{
  "id": "drive_upload_1",
  "type": "drive.upload",
  "position": [
    250,
    150
  ],
  "params": {
    "file_url": "<value>"
  }
}
```

---

#### `sheets.append_row` — Sheets: Append Row

Append a row to a Google Sheet.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `spreadsheet_id` | `string` | Yes | _none_ |  |
| `sheet_name` | `string` | No | `Sheet1` |  |
| `values` | `json` | Yes | _none_ | Array of cell values, e.g. ["A", 123, true] |

```json
{
  "id": "sheets_append_row_1",
  "type": "sheets.append_row",
  "position": [
    250,
    150
  ],
  "params": {
    "spreadsheet_id": "<value>",
    "sheet_name": "Sheet1",
    "values": "<value>"
  }
}
```

---

#### `sheets.read_range` — Sheets: Read Range

Read a range of cells from a Google Sheet.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `spreadsheet_id` | `string` | Yes | _none_ |  |
| `range` | `string` | Yes | _none_ |  |

```json
{
  "id": "sheets_read_range_1",
  "type": "sheets.read_range",
  "position": [
    250,
    150
  ],
  "params": {
    "spreadsheet_id": "<value>",
    "range": "<value>"
  }
}
```

---

#### `notion.create_page` — Notion: Create Page

Create a page in a Notion database.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `database_id` | `string` | Yes | _none_ |  |
| `properties` | `json` | Yes | _none_ |  |
| `content_md` | `string` | No | _none_ |  |

```json
{
  "id": "notion_create_page_1",
  "type": "notion.create_page",
  "position": [
    250,
    150
  ],
  "params": {
    "database_id": "<value>",
    "properties": "<value>"
  }
}
```

---

#### `notion.query_db` — Notion: Query Database

Fetch pages from a Notion database with filters.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `database_id` | `string` | Yes | _none_ |  |
| `filter` | `json` | No | _none_ | Notion filter object |
| `page_size` | `number` | No | `25` |  |

```json
{
  "id": "notion_query_db_1",
  "type": "notion.query_db",
  "position": [
    250,
    150
  ],
  "params": {
    "database_id": "<value>",
    "page_size": 25
  }
}
```

---

#### `airtable.create_record` — Airtable: Create Record

Create one record in an Airtable base/table.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `base_id` | `string` | Yes | _none_ |  |
| `table` | `string` | Yes | _none_ |  |
| `fields` | `json` | Yes | _none_ |  |

```json
{
  "id": "airtable_create_record_1",
  "type": "airtable.create_record",
  "position": [
    250,
    150
  ],
  "params": {
    "base_id": "<value>",
    "table": "<value>",
    "fields": "<value>"
  }
}
```

---

#### `airtable.list_records` — Airtable: List Records

Fetch records from a table (with optional filterByFormula).

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `base_id` | `string` | Yes | _none_ |  |
| `table` | `string` | Yes | _none_ |  |
| `filter_by_formula` | `string` | No | _none_ | Airtable formula, e.g. {Status}='active' |
| `max_records` | `number` | No | `50` |  |

```json
{
  "id": "airtable_list_records_1",
  "type": "airtable.list_records",
  "position": [
    250,
    150
  ],
  "params": {
    "base_id": "<value>",
    "table": "<value>",
    "max_records": 50
  }
}
```

---

#### `discord.send_message` — Discord: Send Message

Post to a Discord channel via webhook or bot token.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `channel_id` | `string` | Yes | _none_ |  |
| `content` | `string` | Yes | _none_ |  |
| `embeds` | `json` | No | _none_ |  |

```json
{
  "id": "discord_send_message_1",
  "type": "discord.send_message",
  "position": [
    250,
    150
  ],
  "params": {
    "channel_id": "<value>",
    "content": "<value>"
  }
}
```

---

#### `telegram.send_message` — Telegram: Send Message

Send a message via Telegram Bot API.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `chat_id` | `string` | Yes | _none_ |  |
| `text` | `string` | Yes | _none_ |  |
| `parse_mode` | `options` | No | `none` | <br>_Options:_ `none`, `Markdown`, `HTML` |

```json
{
  "id": "telegram_send_message_1",
  "type": "telegram.send_message",
  "position": [
    250,
    150
  ],
  "params": {
    "chat_id": "<value>",
    "text": "<value>",
    "parse_mode": "none"
  }
}
```

---

#### `twilio.send_sms` — Twilio: Send SMS

Send an SMS via Twilio.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `to` | `string` | Yes | _none_ |  |
| `body` | `string` | Yes | _none_ |  |

```json
{
  "id": "twilio_send_sms_1",
  "type": "twilio.send_sms",
  "position": [
    250,
    150
  ],
  "params": {
    "to": "<value>",
    "body": "<value>"
  }
}
```

---

#### `shopify.create_product` — Shopify: Create Product

Add a new product to the Shopify store.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `title` | `string` | Yes | _none_ |  |
| `description` | `string` | No | _none_ |  |
| `price` | `number` | Yes | _none_ |  |
| `images` | `json` | No | _none_ | Array of image URLs |
| `variants` | `json` | No | _none_ |  |

```json
{
  "id": "shopify_create_product_1",
  "type": "shopify.create_product",
  "position": [
    250,
    150
  ],
  "params": {
    "title": "<value>",
    "price": "<value>"
  }
}
```

---

#### `shopify.update_product` — Shopify: Update Product

Update product fields.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `product_id` | `string` | Yes | _none_ |  |
| `fields` | `json` | Yes | _none_ |  |

```json
{
  "id": "shopify_update_product_1",
  "type": "shopify.update_product",
  "position": [
    250,
    150
  ],
  "params": {
    "product_id": "<value>",
    "fields": "<value>"
  }
}
```

---

#### `shopify.list_products` — Shopify: List Products

Paginate products in the Shopify store.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `limit` | `number` | No | `50` |  |
| `status` | `string` | No | _none_ | active | draft | archived |

```json
{
  "id": "shopify_list_products_1",
  "type": "shopify.list_products",
  "position": [
    250,
    150
  ],
  "params": {
    "limit": 50
  }
}
```

---

#### `shopify.update_inventory` — Shopify: Update Inventory

Adjust stock level for a variant.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `inventory_item_id` | `string` | Yes | _none_ |  |
| `location_id` | `string` | Yes | _none_ |  |
| `available` | `number` | Yes | _none_ | Absolute available count (not delta). |

```json
{
  "id": "shopify_update_inventory_1",
  "type": "shopify.update_inventory",
  "position": [
    250,
    150
  ],
  "params": {
    "inventory_item_id": "<value>",
    "location_id": "<value>",
    "available": "<value>"
  }
}
```

---

#### `shopify.list_orders` — Shopify: List Orders

Fetch recent orders, optionally filtered.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `status` | `options` | No | `any` | <br>_Options:_ `any`, `open`, `closed`, `cancelled` |
| `financial_status` | `options` | No | `any` | <br>_Options:_ `any`, `paid`, `pending`, `refunded`, `partially_refunded` |
| `limit` | `number` | No | `50` |  |
| `since_id` | `string` | No | _none_ | Only orders after this id |

```json
{
  "id": "shopify_list_orders_1",
  "type": "shopify.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "status": "any",
    "financial_status": "any",
    "limit": 50
  }
}
```

---

#### `shopify.fulfill_order` — Shopify: Fulfill Order

Mark an order as fulfilled with tracking info.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `order_id` | `string` | Yes | _none_ |  |
| `tracking_number` | `string` | No | _none_ |  |
| `tracking_company` | `string` | No | _none_ |  |
| `notify_customer` | `boolean` | No | `True` |  |

```json
{
  "id": "shopify_fulfill_order_1",
  "type": "shopify.fulfill_order",
  "position": [
    250,
    150
  ],
  "params": {
    "order_id": "<value>",
    "notify_customer": true
  }
}
```

---

#### `woocommerce.create_product` — WooCommerce: Create Product

Create a product in WooCommerce via REST API.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `name` | `string` | Yes | _none_ |  |
| `sku` | `string` | No | _none_ |  |
| `regular_price` | `number` | Yes | _none_ |  |
| `description` | `string` | No | _none_ |  |
| `categories` | `json` | No | _none_ | Array of category IDs |
| `images` | `json` | No | _none_ | Array of image URLs |
| `status` | `options` | No | `publish` | <br>_Options:_ `publish`, `draft`, `private` |

```json
{
  "id": "woocommerce_create_product_1",
  "type": "woocommerce.create_product",
  "position": [
    250,
    150
  ],
  "params": {
    "name": "<value>",
    "regular_price": "<value>"
  }
}
```

---

#### `woocommerce.update_product` — WooCommerce: Update Product

Update WooCommerce product fields.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `product_id` | `string` | Yes | _none_ |  |
| `fields` | `json` | Yes | _none_ |  |

```json
{
  "id": "woocommerce_update_product_1",
  "type": "woocommerce.update_product",
  "position": [
    250,
    150
  ],
  "params": {
    "product_id": "<value>",
    "fields": "<value>"
  }
}
```

---

#### `woocommerce.list_orders` — WooCommerce: List Orders

Paginate recent WooCommerce orders.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `status` | `options` | No | `any` | <br>_Options:_ `any`, `pending`, `processing`, `completed`, `refunded` |
| `per_page` | `number` | No | `20` |  |

```json
{
  "id": "woocommerce_list_orders_1",
  "type": "woocommerce.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "status": "any",
    "per_page": 20
  }
}
```

---

#### `allegro.create_listing` — Allegro: Create Listing

Publish a new product auction or buy-now listing on Allegro.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `name` | `string` | Yes | _none_ | Tytuł oferty (max 75 zn.) |
| `category_id` | `string` | Yes | _none_ | ID kategorii Allegro (np. 257936) |
| `price` | `number` | Yes | _none_ | Cena w PLN |
| `quantity` | `number` | Yes | `1` |  |
| `description_html` | `string` | Yes | _none_ |  |
| `images` | `json` | No | _none_ | Do 16 URL-i zdjęć |
| `parameters` | `json` | No | _none_ | Parametry Allegro: [{id, values: [...]}, …] |
| `condition` | `options` | No | `NEW` | <br>_Options:_ `NEW`, `USED`, `NEW_OTHER`, `REFURBISHED` |
| `delivery_shipping_rates_id` | `string` | No | _none_ | ID cennika dostaw |
| `publication_status` | `options` | No | `ACTIVE` | <br>_Options:_ `ACTIVE`, `INACTIVE` |

```json
{
  "id": "allegro_create_listing_1",
  "type": "allegro.create_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "name": "<value>",
    "category_id": "<value>",
    "price": "<value>",
    "quantity": 1
  }
}
```

---

#### `allegro.update_listing` — Allegro: Aktualizuj ofertę

Zmień cenę, stan lub parametry oferty.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `offer_id` | `string` | Yes | _none_ |  |
| `fields` | `json` | Yes | _none_ | Obiekt z polami do aktualizacji |

```json
{
  "id": "allegro_update_listing_1",
  "type": "allegro.update_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "offer_id": "<value>",
    "fields": "<value>"
  }
}
```

---

#### `allegro.end_listing` — Allegro: End Listing

Terminate an active Allegro product listing or auction.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `offer_id` | `string` | Yes | _none_ |  |

```json
{
  "id": "allegro_end_listing_1",
  "type": "allegro.end_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "offer_id": "<value>"
  }
}
```

---

#### `allegro.list_orders` — Allegro: List Orders

Fetch incoming buyer orders and fulfillment statuses from Allegro.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `days` | `number` | No | `7` | Zamówienia z ostatnich N dni |
| `status` | `options` | No | `READY_FOR_PROCESSING` | <br>_Options:_ `BOUGHT`, `READY_FOR_PROCESSING`, `PROCESSING`, `READY_FOR_SHIPMENT`, `SENT` (+2 more) |

```json
{
  "id": "allegro_list_orders_1",
  "type": "allegro.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "days": 7,
    "status": "READY_FOR_PROCESSING"
  }
}
```

---

#### `amazon.create_listing` — Amazon: Create Listing

Submit a listing via Amazon SP-API.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `marketplace_id` | `string` | Yes | _none_ | np. A1PA6795UKMFR9 (DE), APJ6JRA9NG5V4 (IT) |
| `sku` | `string` | Yes | _none_ |  |
| `product_type` | `string` | Yes | _none_ | Amazon product-type (np. SHOES, BOOK, TOY) |
| `attributes` | `json` | Yes | _none_ | Attribute dict per SP-API schema |

```json
{
  "id": "amazon_create_listing_1",
  "type": "amazon.create_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "marketplace_id": "<value>",
    "sku": "<value>",
    "product_type": "<value>",
    "attributes": "<value>"
  }
}
```

---

#### `amazon.update_inventory` — Amazon: Update Inventory

Set SKU stock quantity in Amazon SP-API.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `sku` | `string` | Yes | _none_ |  |
| `quantity` | `number` | Yes | _none_ |  |

```json
{
  "id": "amazon_update_inventory_1",
  "type": "amazon.update_inventory",
  "position": [
    250,
    150
  ],
  "params": {
    "sku": "<value>",
    "quantity": "<value>"
  }
}
```

---

#### `amazon.list_orders` — Amazon: List Orders

Fetch recent Amazon orders for given marketplaces.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `marketplace_ids` | `string` | Yes | _none_ |  |
| `days` | `number` | No | `7` |  |

```json
{
  "id": "amazon_list_orders_1",
  "type": "amazon.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "marketplace_ids": "<value>",
    "days": 7
  }
}
```

---

#### `etsy.create_listing` — Etsy: Create Listing

Draft a new listing in your Etsy shop.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `title` | `string` | Yes | _none_ |  |
| `description` | `string` | Yes | _none_ |  |
| `price` | `number` | Yes | _none_ |  |
| `quantity` | `number` | Yes | `1` |  |
| `who_made` | `string` | No | `i_did` | i_did, collective, someone_else |
| `when_made` | `string` | No | `made_to_order` | np. made_to_order, 2020_2024 |
| `tags` | `json` | No | _none_ | Do 13 tagów (tablica stringów) |
| `materials` | `json` | No | _none_ |  |
| `image_ids` | `json` | No | _none_ | Uploaded image ids |

```json
{
  "id": "etsy_create_listing_1",
  "type": "etsy.create_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "title": "<value>",
    "description": "<value>",
    "price": "<value>",
    "quantity": 1
  }
}
```

---

#### `etsy.update_listing` — Etsy: Update Listing

Patch an existing Etsy listing.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `listing_id` | `string` | Yes | _none_ |  |
| `fields` | `json` | Yes | _none_ |  |

```json
{
  "id": "etsy_update_listing_1",
  "type": "etsy.update_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "listing_id": "<value>",
    "fields": "<value>"
  }
}
```

---

#### `etsy.list_orders` — Etsy: Fetch Receipts

Pobierz zamówienia (receipts) z Etsy shopu.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `was_paid` | `options` | No | `true` | <br>_Options:_ `any`, `true`, `false` |
| `was_shipped` | `options` | No | `false` | <br>_Options:_ `any`, `false` |
| `limit` | `number` | No | `25` |  |

```json
{
  "id": "etsy_list_orders_1",
  "type": "etsy.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "was_paid": "true",
    "was_shipped": "false",
    "limit": 25
  }
}
```

---

#### `baselinker.add_product` — BaseLinker: Dodaj produkt

Dodaj produkt do katalogu BaseLinker (wieloplatformowy).

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `inventory_id` | `string` | Yes | _none_ | ID magazynu BaseLinker |
| `sku` | `string` | Yes | _none_ |  |
| `name` | `string` | Yes | _none_ |  |
| `price_brutto` | `number` | Yes | _none_ |  |
| `quantity` | `number` | Yes | `0` |  |
| `description_html` | `string` | No | _none_ |  |
| `images` | `json` | No | _none_ |  |
| `features` | `json` | No | _none_ |  |

```json
{
  "id": "baselinker_add_product_1",
  "type": "baselinker.add_product",
  "position": [
    250,
    150
  ],
  "params": {
    "inventory_id": "<value>",
    "sku": "<value>",
    "name": "<value>",
    "price_brutto": "<value>"
  }
}
```

---

#### `baselinker.update_stock` — BaseLinker: Aktualizuj stan

Aktualizuj ilość sztuk SKU w magazynie BaseLinker.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `inventory_id` | `string` | Yes | _none_ |  |
| `sku` | `string` | Yes | _none_ |  |
| `quantity` | `number` | Yes | _none_ |  |

```json
{
  "id": "baselinker_update_stock_1",
  "type": "baselinker.update_stock",
  "position": [
    250,
    150
  ],
  "params": {
    "inventory_id": "<value>",
    "sku": "<value>",
    "quantity": "<value>"
  }
}
```

---

#### `baselinker.publish_to_marketplace` — BaseLinker: Wystaw na marketplace

Jednym kliknięciem wystaw produkt na Allegro/Amazon/eBay przez BaseLinker.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `inventory_id` | `string` | Yes | _none_ |  |
| `sku` | `string` | Yes | _none_ |  |
| `marketplace` | `options` | Yes | _none_ | <br>_Options:_ `allegro`, `amazon`, `ebay`, `empik`, `erli` (+1 more) |
| `marketplace_params` | `json` | No | _none_ | Platform-specific override (category_id, shipping, …) |

```json
{
  "id": "baselinker_publish_to_marketplace_1",
  "type": "baselinker.publish_to_marketplace",
  "position": [
    250,
    150
  ],
  "params": {
    "inventory_id": "<value>",
    "sku": "<value>",
    "marketplace": "<value>"
  }
}
```

---

#### `baselinker.list_orders` — BaseLinker: Pobierz zamówienia

Pobierz zamówienia z BaseLinker (wszystkie kanały).

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `days` | `number` | No | `7` |  |
| `status_id` | `string` | No | _none_ | Opcjonalny filtr statusu |

```json
{
  "id": "baselinker_list_orders_1",
  "type": "baselinker.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "days": 7
  }
}
```

---

#### `ceneo.upload_feed` — Ceneo: Prześlij feed XML

Wyślij plik XML z ofertami do Ceneo (price comparison).

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `feed_url` | `string` | Yes | _none_ | URL publicznego pliku XML (Ceneo pobiera cyklicznie) |
| `format` | `options` | No | `ceneo` | <br>_Options:_ `ceneo`, `google_shopping`, `custom` |

```json
{
  "id": "ceneo_upload_feed_1",
  "type": "ceneo.upload_feed",
  "position": [
    250,
    150
  ],
  "params": {
    "feed_url": "<value>",
    "format": "ceneo"
  }
}
```

---

#### `ceneo.list_orders` — Ceneo: Pobierz zamówienia (Kupuję)

Pobierz zamówienia z Ceneo Kupuję (marketplace).

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `days` | `number` | No | `7` |  |
| `status` | `options` | No | `pending` | <br>_Options:_ `any`, `pending`, `confirmed`, `shipped`, `cancelled` |

```json
{
  "id": "ceneo_list_orders_1",
  "type": "ceneo.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "days": 7,
    "status": "pending"
  }
}
```

---

#### `ceneo.update_order_status` — Ceneo: Aktualizuj status zamówienia

Zmień status (shipped/cancelled) w Ceneo Kupuję.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `order_id` | `string` | Yes | _none_ |  |
| `status` | `options` | Yes | _none_ | <br>_Options:_ `confirmed`, `shipped`, `delivered`, `cancelled` |
| `tracking_number` | `string` | No | _none_ | Numer przewozowy (dla shipped) |
| `courier` | `string` | No | _none_ | Np. DPD, InPost, DHL, Poczta Polska |

```json
{
  "id": "ceneo_update_order_status_1",
  "type": "ceneo.update_order_status",
  "position": [
    250,
    150
  ],
  "params": {
    "order_id": "<value>",
    "status": "<value>"
  }
}
```

---

#### `ceneo.price_compare` — Ceneo: Porównaj cenę

Pobierz ceny konkurencji dla danego EAN / nazwy produktu.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `ean` | `string` | No | _none_ | Kod EAN/GTIN produktu |
| `product_name` | `string` | No | _none_ | Alternatywnie: nazwa |
| `top_n` | `number` | No | `10` | Ile ofert zwrócić |

```json
{
  "id": "ceneo_price_compare_1",
  "type": "ceneo.price_compare",
  "position": [
    250,
    150
  ],
  "params": {
    "top_n": 10
  }
}
```

---

#### `ebay.create_listing` — eBay: Create Listing

Create a new fixed-price or auction listing on eBay.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `marketplace_id` | `string` | Yes | _none_ | np. EBAY_US, EBAY_DE, EBAY_PL |
| `sku` | `string` | Yes | _none_ |  |
| `title` | `string` | Yes | _none_ |  |
| `description_html` | `string` | Yes | _none_ |  |
| `price` | `number` | Yes | _none_ |  |
| `currency` | `string` | No | `EUR` |  |
| `quantity` | `number` | Yes | `1` |  |
| `category_id` | `string` | Yes | _none_ | eBay category ID (np. 9355) |
| `condition` | `options` | No | `NEW` | <br>_Options:_ `NEW`, `NEW_OTHER`, `USED_EXCELLENT`, `USED_GOOD`, `USED_ACCEPTABLE` (+1 more) |
| `images` | `json` | No | _none_ | Array of image URLs |
| `fulfillment_policy_id` | `string` | Yes | _none_ |  |
| `payment_policy_id` | `string` | Yes | _none_ |  |
| `return_policy_id` | `string` | Yes | _none_ |  |

```json
{
  "id": "ebay_create_listing_1",
  "type": "ebay.create_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "marketplace_id": "<value>",
    "sku": "<value>",
    "title": "<value>",
    "description_html": "<value>"
  }
}
```

---

#### `ebay.update_listing` — eBay: Update Listing

Update eBay listing price / quantity / fields.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `listing_id` | `string` | Yes | _none_ |  |
| `fields` | `json` | Yes | _none_ |  |

```json
{
  "id": "ebay_update_listing_1",
  "type": "ebay.update_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "listing_id": "<value>",
    "fields": "<value>"
  }
}
```

---

#### `ebay.list_orders` — eBay: List Orders

Fetch recent eBay orders (Fulfillment API).

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `days` | `number` | No | `7` |  |
| `order_status` | `options` | No | `ACTIVE` | <br>_Options:_ `ACTIVE`, `CANCELLED`, `COMPLETED`, `IN_PROGRESS` |

```json
{
  "id": "ebay_list_orders_1",
  "type": "ebay.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "days": 7,
    "order_status": "ACTIVE"
  }
}
```

---

#### `ebay.ship_order` — eBay: Mark Shipped

Create shipment fulfillment with tracking info.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `order_id` | `string` | Yes | _none_ |  |
| `tracking_number` | `string` | Yes | _none_ |  |
| `carrier` | `string` | Yes | _none_ | np. DHL, FEDEX, UPS, USPS, DPD, GLS |
| `line_items` | `json` | No | _none_ | Items to fulfill: [{lineItemId, quantity}, …] |

```json
{
  "id": "ebay_ship_order_1",
  "type": "ebay.ship_order",
  "position": [
    250,
    150
  ],
  "params": {
    "order_id": "<value>",
    "tracking_number": "<value>",
    "carrier": "<value>"
  }
}
```

---

#### `empik.create_offer` — Empik: Wystaw ofertę

Utwórz nową ofertę w Empik Marketplace (wymaga BaseLinker/Mirakl).

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `product_id` | `string` | Yes | _none_ | Empik product ID (lub EAN) |
| `price` | `number` | Yes | _none_ |  |
| `quantity` | `number` | Yes | `1` |  |
| `condition` | `options` | No | `NEW` | <br>_Options:_ `NEW`, `USED_GOOD`, `USED_NEW` |
| `shipping_type` | `string` | No | _none_ | np. standard, express |

```json
{
  "id": "empik_create_offer_1",
  "type": "empik.create_offer",
  "position": [
    250,
    150
  ],
  "params": {
    "product_id": "<value>",
    "price": "<value>",
    "quantity": 1,
    "condition": "NEW"
  }
}
```

---

#### `empik.list_orders` — Empik: Pobierz zamówienia

Pobierz zamówienia z Empik Marketplace.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `days` | `number` | No | `7` |  |
| `status` | `options` | No | `WAITING_ACCEPTANCE` | <br>_Options:_ `PENDING`, `WAITING_ACCEPTANCE`, `SHIPPING`, `SHIPPED`, `RECEIVED` (+2 more) |

```json
{
  "id": "empik_list_orders_1",
  "type": "empik.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "days": 7,
    "status": "WAITING_ACCEPTANCE"
  }
}
```

---

#### `olx.create_ad` — OLX: Wystaw ogłoszenie

Utwórz ogłoszenie na OLX.pl.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `title` | `string` | Yes | _none_ | Tytuł (max 70 zn.) |
| `description` | `string` | Yes | _none_ |  |
| `price` | `number` | Yes | _none_ |  |
| `category_id` | `string` | Yes | _none_ | ID kategorii OLX |
| `city` | `string` | Yes | _none_ |  |
| `images` | `json` | No | _none_ | Do 8 URL-i zdjęć |
| `advertiser_type` | `options` | No | `business` | <br>_Options:_ `private`, `business` |

```json
{
  "id": "olx_create_ad_1",
  "type": "olx.create_ad",
  "position": [
    250,
    150
  ],
  "params": {
    "title": "<value>",
    "description": "<value>",
    "price": "<value>",
    "category_id": "<value>"
  }
}
```

---

#### `olx.list_messages` — OLX: Pobierz wiadomości

Pobierz wiadomości od kupujących (dla obsługi).

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `unread_only` | `boolean` | No | `True` |  |
| `limit` | `number` | No | `50` |  |

```json
{
  "id": "olx_list_messages_1",
  "type": "olx.list_messages",
  "position": [
    250,
    150
  ],
  "params": {
    "unread_only": true,
    "limit": 50
  }
}
```

---

#### `erli.create_listing` — Erli: Wystaw ofertę

Wystaw ofertę w Erli (PL marketplace bez prowizji).

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `title` | `string` | Yes | _none_ |  |
| `category_id` | `string` | Yes | _none_ |  |
| `price` | `number` | Yes | _none_ |  |
| `quantity` | `number` | Yes | `1` |  |
| `description_html` | `string` | Yes | _none_ |  |
| `images` | `json` | No | _none_ |  |
| `ean` | `string` | No | _none_ | Kod EAN (zalecane) |

```json
{
  "id": "erli_create_listing_1",
  "type": "erli.create_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "title": "<value>",
    "category_id": "<value>",
    "price": "<value>",
    "quantity": 1
  }
}
```

---

#### `erli.list_orders` — Erli: Pobierz zamówienia

Pobierz zamówienia z Erli.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `days` | `number` | No | `7` |  |
| `status` | `options` | No | `new` | <br>_Options:_ `new`, `processing`, `shipped`, `completed`, `cancelled` |

```json
{
  "id": "erli_list_orders_1",
  "type": "erli.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "days": 7,
    "status": "new"
  }
}
```

---

#### `zalando.create_article` — Zalando: Create Article

Submit a fashion article to Zalando Partner Connect (ZDT).

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `ean` | `string` | Yes | _none_ | GTIN/EAN (required) |
| `article_config_id` | `string` | Yes | _none_ |  |
| `name` | `string` | Yes | _none_ |  |
| `price` | `number` | Yes | _none_ |  |
| `currency` | `string` | No | `EUR` |  |
| `images` | `json` | No | _none_ | Min. 4 images, up to 8 |
| `attributes` | `json` | No | _none_ | Zalando attribute schema per category |

```json
{
  "id": "zalando_create_article_1",
  "type": "zalando.create_article",
  "position": [
    250,
    150
  ],
  "params": {
    "ean": "<value>",
    "article_config_id": "<value>",
    "name": "<value>",
    "price": "<value>"
  }
}
```

---

#### `zalando.update_stock` — Zalando: Update Stock

Update stock level in Zalando Partner Connect.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `ean` | `string` | Yes | _none_ |  |
| `quantity` | `number` | Yes | _none_ |  |

```json
{
  "id": "zalando_update_stock_1",
  "type": "zalando.update_stock",
  "position": [
    250,
    150
  ],
  "params": {
    "ean": "<value>",
    "quantity": "<value>"
  }
}
```

---

#### `zalando.list_orders` — Zalando: List Orders

Fetch recent Zalando orders.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `days` | `number` | No | `7` |  |
| `order_status` | `options` | No | `ACCEPTED` | <br>_Options:_ `CREATED`, `ACCEPTED`, `SHIPPED`, `DELIVERED`, `CANCELLED` |

```json
{
  "id": "zalando_list_orders_1",
  "type": "zalando.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "days": 7,
    "order_status": "ACCEPTED"
  }
}
```

---

#### `kaufland.create_offer` — Kaufland: Create Offer

Create an offer in Kaufland Global Marketplace.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `ean` | `string` | Yes | _none_ |  |
| `price` | `number` | Yes | _none_ |  |
| `quantity` | `number` | Yes | `1` |  |
| `delivery_time_min` | `string` | No | `1` |  |
| `delivery_time_max` | `string` | No | `3` |  |
| `condition` | `options` | No | `NEW` | <br>_Options:_ `NEW`, `USED_LIKE_NEW`, `USED_VERY_GOOD`, `USED_GOOD`, `USED_ACCEPTABLE` |

```json
{
  "id": "kaufland_create_offer_1",
  "type": "kaufland.create_offer",
  "position": [
    250,
    150
  ],
  "params": {
    "ean": "<value>",
    "price": "<value>",
    "quantity": 1,
    "delivery_time_min": "1"
  }
}
```

---

#### `kaufland.list_orders` — Kaufland: List Orders

Fetch recent Kaufland orders.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `days` | `number` | No | `7` |  |
| `status` | `options` | No | `open` | <br>_Options:_ `open`, `shipped`, `delivered`, `canceled` |

```json
{
  "id": "kaufland_list_orders_1",
  "type": "kaufland.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "days": 7,
    "status": "open"
  }
}
```

---

#### `stripe.create_checkout` — Stripe: Create Checkout

Create a Checkout Session and return the URL.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `line_items` | `json` | Yes | _none_ | Stripe line_items array |
| `success_url` | `string` | Yes | _none_ |  |
| `cancel_url` | `string` | Yes | _none_ |  |
| `mode` | `options` | No | `payment` | <br>_Options:_ `payment`, `subscription` |

```json
{
  "id": "stripe_create_checkout_1",
  "type": "stripe.create_checkout",
  "position": [
    250,
    150
  ],
  "params": {
    "line_items": "<value>",
    "success_url": "<value>",
    "cancel_url": "<value>",
    "mode": "payment"
  }
}
```

---

#### `stripe.list_customers` — Stripe: List Customers

Paginate through Stripe customers.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `email` | `string` | No | _none_ | Filter by email |
| `limit` | `number` | No | `20` |  |

```json
{
  "id": "stripe_list_customers_1",
  "type": "stripe.list_customers",
  "position": [
    250,
    150
  ],
  "params": {
    "limit": 20
  }
}
```

---

#### `mailchimp.add_subscriber` — Mailchimp: Add Subscriber

Add or update a subscriber in a list.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `list_id` | `string` | Yes | _none_ |  |
| `email` | `string` | Yes | _none_ |  |
| `merge_fields` | `json` | No | _none_ |  |
| `double_optin` | `boolean` | No | `True` |  |

```json
{
  "id": "mailchimp_add_subscriber_1",
  "type": "mailchimp.add_subscriber",
  "position": [
    250,
    150
  ],
  "params": {
    "list_id": "<value>",
    "email": "<value>",
    "double_optin": true
  }
}
```

---

## ☁️ Cloud Storage & Asset Delivery <a id="storage"></a>

> **Total Nodes:** 10 | **Category Identifier:** `storage`

Secure asset management and Bring-Your-Own-Bucket (BYOB) delivery: FotoHub Gallery, AWS S3 (multipart upload and presigned URLs), Cloudflare R2 (zero egress fees), Google Cloud Storage, Dropbox, and Microsoft OneDrive.

**Enterprise Use Case:** Archiving high-resolution 4K master video files directly to an enterprise AWS S3 bucket while serving optimized WebP thumbnails from Cloudflare R2.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `storage.dropbox_upload` | **Dropbox: Upload** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `storage.dropbox_list` | **Dropbox: List Folder** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `storage.onedrive_upload` | **OneDrive: Upload** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `storage.s3_put` | **AWS S3: Put Object** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `storage.s3_get_url` | **AWS S3: Get Signed URL** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `storage.r2_put` | **Cloudflare R2: Put Object** | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `fotohub.files.save` | **FotoHub Files: Save File** | In: `main`<br>Out: `main, error` | `builtin` | free |
| `fotohub.bucket.upload` | **FOTOhub: Zapisz do Bucket S3** | In: `main`<br>Out: `main, error` | `builtin` | free |
| `fotohub.files.get` | **FotoHub Files: Get File** | In: `main`<br>Out: `main, error` | `builtin` | free |
| `fotohub.bucket.download` | **FOTOhub: Pobierz z Bucket S3** | In: `main`<br>Out: `main, error` | `builtin` | free |

### Node Specifications (Cloud Storage & Asset Delivery)

#### `storage.dropbox_upload` — Dropbox: Upload

Upload a file URL to Dropbox.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `file_url` | `string` | Yes | _none_ |  |
| `target_path` | `string` | Yes | _none_ |  |

```json
{
  "id": "storage_dropbox_upload_1",
  "type": "storage.dropbox_upload",
  "position": [
    250,
    150
  ],
  "params": {
    "file_url": "<value>",
    "target_path": "<value>"
  }
}
```

---

#### `storage.dropbox_list` — Dropbox: List Folder

List files in a Dropbox folder.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `folder_path` | `string` | No | `/` |  |

```json
{
  "id": "storage_dropbox_list_1",
  "type": "storage.dropbox_list",
  "position": [
    250,
    150
  ],
  "params": {
    "folder_path": "/"
  }
}
```

---

#### `storage.onedrive_upload` — OneDrive: Upload

Upload a file URL to OneDrive.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `file_url` | `string` | Yes | _none_ |  |
| `target_path` | `string` | Yes | _none_ |  |

```json
{
  "id": "storage_onedrive_upload_1",
  "type": "storage.onedrive_upload",
  "position": [
    250,
    150
  ],
  "params": {
    "file_url": "<value>",
    "target_path": "<value>"
  }
}
```

---

#### `storage.s3_put` — AWS S3: Put Object

Upload a file URL to an S3 bucket.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `bucket` | `string` | Yes | _none_ |  |
| `key` | `string` | Yes | _none_ |  |
| `file_url` | `string` | Yes | _none_ |  |
| `content_type` | `string` | No | _none_ |  |

```json
{
  "id": "storage_s3_put_1",
  "type": "storage.s3_put",
  "position": [
    250,
    150
  ],
  "params": {
    "bucket": "<value>",
    "key": "<value>",
    "file_url": "<value>"
  }
}
```

---

#### `storage.s3_get_url` — AWS S3: Get Signed URL

Create a pre-signed GET URL for an S3 object.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `bucket` | `string` | Yes | _none_ |  |
| `key` | `string` | Yes | _none_ |  |

```json
{
  "id": "storage_s3_get_url_1",
  "type": "storage.s3_get_url",
  "position": [
    250,
    150
  ],
  "params": {
    "bucket": "<value>",
    "key": "<value>"
  }
}
```

---

#### `storage.r2_put` — Cloudflare R2: Put Object

Upload a file URL to R2.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `bucket` | `string` | Yes | _none_ |  |
| `key` | `string` | Yes | _none_ |  |
| `file_url` | `string` | Yes | _none_ |  |

```json
{
  "id": "storage_r2_put_1",
  "type": "storage.r2_put",
  "position": [
    250,
    150
  ],
  "params": {
    "bucket": "<value>",
    "key": "<value>",
    "file_url": "<value>"
  }
}
```

---

#### `fotohub.files.save` — FotoHub Files: Save File

Persist an asset into FotoHub secure project storage.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `file_url` | `string` | No | _none_ |  |
| `name` | `string` | No | `plik-agenta.png` |  |
| `folder_id` | `string` | No | _none_ |  |

```json
{
  "id": "fotohub_files_save_1",
  "type": "fotohub.files.save",
  "position": [
    250,
    150
  ],
  "params": {
    "name": "plik-agenta.png"
  }
}
```

---

#### `fotohub.bucket.upload` — FOTOhub: Zapisz do Bucket S3

Zapisz obiekt w Twoim prywatnym buckecie S3 w chmurze FOTOhub.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `bucket_name` | `string` | Yes | _none_ |  |
| `key` | `string` | Yes | _none_ |  |
| `file_url` | `string` | No | _none_ |  |

```json
{
  "id": "fotohub_bucket_upload_1",
  "type": "fotohub.bucket.upload",
  "position": [
    250,
    150
  ],
  "params": {
    "bucket_name": "<value>",
    "key": "<value>"
  }
}
```

---

#### `fotohub.files.get` — FotoHub Files: Get File

Download or reference an asset from FotoHub storage bucket.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `file_id` | `string` | No | _none_ |  |
| `file_path` | `string` | No | _none_ |  |

```json
{
  "id": "fotohub_files_get_1",
  "type": "fotohub.files.get",
  "position": [
    250,
    150
  ],
  "params": {}
}
```

---

#### `fotohub.bucket.download` — FOTOhub: Pobierz z Bucket S3

Generuje bezpieczny URL dostępowy do obiektu w Twoim prywatnym buckecie S3.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `bucket_name` | `string` | Yes | _none_ |  |
| `key` | `string` | Yes | _none_ |  |

```json
{
  "id": "fotohub_bucket_download_1",
  "type": "fotohub.bucket.download",
  "position": [
    250,
    150
  ],
  "params": {
    "bucket_name": "<value>",
    "key": "<value>"
  }
}
```

---

## 🔀 Flow Logic & Data Transformation <a id="logic"></a>

> **Total Nodes:** 15 | **Category Identifier:** `logic`

Deterministic execution control and data manipulation: If/Else conditional branching, multi-case Switch, While/ForEach loops, math aggregations (SUM, AVG, MIN, MAX, COUNT), array sorting, deduplication, and JMESPath JSON restructuring.

**Enterprise Use Case:** Filtering a batch of 100 generated images, retaining only the top 5 highest-rated candidates, and sorting them descending by aesthetic score.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `logic.if` | **If** | In: `main`<br>Out: `true, false` | `builtin` | Free (0 credits) |
| `logic.switch` | **Switch** | In: `main`<br>Out: `default, case_1, case_2, case_3, case_4` | `builtin` | Free (0 credits) |
| `logic.merge` | **Merge** | In: `in_1, in_2, in_3`<br>Out: `main` | `builtin` | Free (0 credits) |
| `logic.delay` | **Delay** | In: `main`<br>Out: `main` | `builtin` | free |
| `data.set` | **Set Fields** | In: `main`<br>Out: `main` | `builtin` | free |
| `data.filter` | **Filter** | In: `main`<br>Out: `main` | `builtin` | free |
| `data.map` | **Map** | In: `main`<br>Out: `main` | `builtin` | free |
| `logic.approve` | **Approval Required** | In: `main`<br>Out: `approved, rejected` | `builtin` | free |
| `logic.loop` | **Loop over Items** | In: `main`<br>Out: `item, done` | `builtin` | free |
| `logic.parallel` | **Parallel Branches** | In: `main`<br>Out: `out_1, out_2, out_3, out_4` | `builtin` | free |
| `data.aggregate` | **Aggregate** | In: `main`<br>Out: `main` | `builtin` | free |
| `data.sort` | **Sort** | In: `main`<br>Out: `main` | `builtin` | free |
| `data.unique` | **Unique** | In: `main`<br>Out: `main` | `builtin` | free |
| `data.transform` | **JMESPath Transform** | In: `main`<br>Out: `main` | `builtin` | free |
| `logic.switch_expr` | **Switch (Expression)** | In: `main`<br>Out: `case_a, case_b, case_c, default` | `builtin` | free |

### Node Specifications (Flow Logic & Data Transformation)

#### `logic.if` — If

Branch the flow on a condition.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `true` (main), `false` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `condition` | `string` | Yes | _none_ | Expression that must evaluate to truthy |

```json
{
  "id": "logic_if_1",
  "type": "logic.if",
  "position": [
    250,
    150
  ],
  "params": {
    "condition": "<value>"
  }
}
```

---

#### `logic.switch` — Switch

Route to one of many branches by value.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `default` (main), `case_1` (main), `case_2` (main), `case_3` (main), `case_4` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `value` | `string` | Yes | _none_ |  |
| `cases` | `json` | No | `[{'match': 'active', 'port': 'case_1'}, {'match': 'pending', 'port': 'case_2'}]` | Array of {match, port}. |
| `default_port` | `string` | No | `default` |  |

```json
{
  "id": "logic_switch_1",
  "type": "logic.switch",
  "position": [
    250,
    150
  ],
  "params": {
    "value": "<value>",
    "cases": [
      {
        "match": "active",
        "port": "case_1"
      },
      {
        "match": "pending",
        "port": "case_2"
      }
    ],
    "default_port": "default"
  }
}
```

---

#### `logic.merge` — Merge

Combine multiple branches into one flow.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `in_1` (main), `in_2` (main), `in_3` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `strategy` | `options` | No | `merge_objects` | <br>_Options:_ `merge_objects`, `concat_arrays`, `wait_all` |

```json
{
  "id": "logic_merge_1",
  "type": "logic.merge",
  "position": [
    250,
    150
  ],
  "params": {
    "strategy": "merge_objects"
  }
}
```

---

#### `logic.delay` — Delay

Pause the run for N seconds.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `seconds` | `number` | No | `5` |  |

```json
{
  "id": "logic_delay_1",
  "type": "logic.delay",
  "position": [
    250,
    150
  ],
  "params": {
    "seconds": 5
  }
}
```

---

#### `data.set` — Set Fields

Add or override fields on the data flowing through.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `fields` | `json` | No | `{}` |  |
| `keep_input` | `boolean` | No | `True` |  |

```json
{
  "id": "data_set_1",
  "type": "data.set",
  "position": [
    250,
    150
  ],
  "params": {
    "fields": {},
    "keep_input": true
  }
}
```

---

#### `data.filter` — Filter

Keep only items matching a condition (JMESPath).

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `items_path` | `string` | No | `$.items` |  |
| `predicate_path` | `string` | No | _none_ |  |

```json
{
  "id": "data_filter_1",
  "type": "data.filter",
  "position": [
    250,
    150
  ],
  "params": {
    "items_path": "$.items"
  }
}
```

---

#### `data.map` — Map

Transform each item using a template.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `items_path` | `string` | No | `$.items` |  |
| `template` | `json` | No | `{'id': '$.id', 'name': '$.name'}` |  |

```json
{
  "id": "data_map_1",
  "type": "data.map",
  "position": [
    250,
    150
  ],
  "params": {
    "items_path": "$.items",
    "template": {
      "id": "$.id",
      "name": "$.name"
    }
  }
}
```

---

#### `logic.approve` — Approval Required

Pause the run until a user explicitly approves or rejects.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `approved` (main), `rejected` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `title` | `string` | Yes | `Please review` |  |
| `message` | `string` | No | _none_ |  |
| `timeout_hours` | `number` | No | `24` |  |

```json
{
  "id": "logic_approve_1",
  "type": "logic.approve",
  "position": [
    250,
    150
  ],
  "params": {
    "title": "Please review",
    "timeout_hours": 24
  }
}
```

---

#### `logic.loop` — Loop over Items

Execute downstream nodes once per item.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `item` (main), `done` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `items_path` | `string` | No | `$.items` |  |
| `max_iterations` | `number` | No | `1000` |  |
| `mode` | `options` | No | `sequential` | <br>_Options:_ `sequential`, `parallel` |

```json
{
  "id": "logic_loop_1",
  "type": "logic.loop",
  "position": [
    250,
    150
  ],
  "params": {
    "items_path": "$.items",
    "max_iterations": 1000,
    "mode": "sequential"
  }
}
```

---

#### `logic.parallel` — Parallel Branches

Run multiple branches concurrently and wait for all.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `out_1` (main), `out_2` (main), `out_3` (main), `out_4` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `wait_for` | `number` | No | `0` | 0 = all |

```json
{
  "id": "logic_parallel_1",
  "type": "logic.parallel",
  "position": [
    250,
    150
  ],
  "params": {
    "wait_for": 0
  }
}
```

---

#### `data.aggregate` — Aggregate

Sum / avg / min / max / count over an array path.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `items_path` | `string` | No | `$.items` |  |
| `field_path` | `string` | No | _none_ |  |
| `op` | `options` | No | `count` | <br>_Options:_ `sum`, `avg`, `min`, `max`, `count` |

```json
{
  "id": "data_aggregate_1",
  "type": "data.aggregate",
  "position": [
    250,
    150
  ],
  "params": {
    "items_path": "$.items",
    "op": "count"
  }
}
```

---

#### `data.sort` — Sort

Sort items by a field.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `items_path` | `string` | No | `$.items` |  |
| `field_path` | `string` | Yes | _none_ |  |
| `order` | `options` | No | `asc` | <br>_Options:_ `asc`, `desc` |

```json
{
  "id": "data_sort_1",
  "type": "data.sort",
  "position": [
    250,
    150
  ],
  "params": {
    "items_path": "$.items",
    "field_path": "<value>",
    "order": "asc"
  }
}
```

---

#### `data.unique` — Unique

Deduplicate items by a field.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `items_path` | `string` | No | `$.items` |  |
| `field_path` | `string` | No | _none_ | If empty, full-item equality. |

```json
{
  "id": "data_unique_1",
  "type": "data.unique",
  "position": [
    250,
    150
  ],
  "params": {
    "items_path": "$.items"
  }
}
```

---

#### `data.transform` — JMESPath Transform

Apply any JMESPath expression to produce a new structure.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `expression` | `string` | Yes | _none_ |  |

```json
{
  "id": "data_transform_1",
  "type": "data.transform",
  "position": [
    250,
    150
  ],
  "params": {
    "expression": "<value>"
  }
}
```

---

#### `logic.switch_expr` — Switch (Expression)

Route by a free-form expression evaluated once.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `case_a` (main), `case_b` (main), `case_c` (main), `default` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `value` | `string` | Yes | _none_ |  |
| `map` | `json` | No | `{'active': 'case_a', 'pending': 'case_b', 'done': 'case_c'}` |  |

```json
{
  "id": "logic_switch_expr_1",
  "type": "logic.switch_expr",
  "position": [
    250,
    150
  ],
  "params": {
    "value": "<value>",
    "map": {
      "active": "case_a",
      "pending": "case_b",
      "done": "case_c"
    }
  }
}
```

---

## 📥 Workflow Input & Output Boundaries <a id="io"></a>

> **Total Nodes:** 2 | **Category Identifier:** `io`

Entry-point parameter parsing, schema validation, and standardized workflow completion summaries.

**Enterprise Use Case:** Accepting initial client request payloads from web forms and packaging output CDN URLs for synchronous API responses.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `io.input_json` | **JSON Input** | In: `main`<br>Out: `main` | `builtin` | free |
| `io.output_save` | **Save Output** | In: `main`<br>Out: `main` | `builtin` | free |

### Node Specifications (Workflow Input & Output Boundaries)

#### `io.input_json` — JSON Input

Start the flow with a literal JSON object.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `data` | `json` | No | `{}` |  |

```json
{
  "id": "io_input_json_1",
  "type": "io.input_json",
  "position": [
    250,
    150
  ],
  "params": {
    "data": {}
  }
}
```

---

#### `io.output_save` — Save Output

Store a JSON or binary result to Supabase Storage and record the URL.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `bucket` | `options` | No | `agent-outputs` | <br>_Options:_ `photos`, `videos`, `audio`, `documents`, `agent-outputs` |
| `path` | `string` | No | _none_ |  |
| `public` | `boolean` | No | `False` |  |

```json
{
  "id": "io_output_save_1",
  "type": "io.output_save",
  "position": [
    250,
    150
  ],
  "params": {
    "bucket": "agent-outputs",
    "public": false
  }
}
```

---

## ⌨️ Secure Code Sandboxes <a id="code"></a>

> **Total Nodes:** 2 | **Category Identifier:** `code`

Isolated, resource-constrained execution sandboxes for Python (with NumPy, Pillow, Requests) and JavaScript (V8 engine) with strict CPU, memory, and timeout bounds.

**Enterprise Use Case:** Custom pricing calculations, parsing complex supplier XML/CSV feeds, or computing custom image aspect transformations.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `code.js` | **Code (JavaScript)** | In: `main`<br>Out: `main, error` | `code_js` | free |
| `code.python` | **Code (Python)** | In: `main`<br>Out: `main, error` | `code_python` | per_minute |

### Node Specifications (Secure Code Sandboxes)

#### `code.js` — Code (JavaScript)

Run a JavaScript snippet in a Deno sandbox (no network/fs).

- **Executor Runtime:** `code_js`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `code` | `string` | Yes | _none_ |  |
| `timeout_s` | `number` | No | `10` |  |

```json
{
  "id": "code_js_1",
  "type": "code.js",
  "position": [
    250,
    150
  ],
  "params": {
    "code": "<value>",
    "timeout_s": 10
  }
}
```

---

#### `code.python` — Code (Python)

Run a Python snippet in a sandboxed microVM (NumPy / Pandas / Pillow available).

- **Executor Runtime:** `code_python`
- **Required Tier:** `FREE`
- **Execution Cost:** per_minute

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `code` | `string` | Yes | _none_ |  |
| `timeout_s` | `number` | No | `30` |  |
| `memory_mb` | `number` | No | `512` |  |

```json
{
  "id": "code_python_1",
  "type": "code.python",
  "position": [
    250,
    150
  ],
  "params": {
    "code": "<value>",
    "timeout_s": 30,
    "memory_mb": 512
  }
}
```

---

## 🌐 HTTP & REST API Client <a id="http"></a>

> **Total Nodes:** 1 | **Category Identifier:** `http`

Universal REST client supporting GET, POST, PUT, DELETE, and PATCH with custom headers, Bearer/Basic authentication, retry policies, and timeout guards.

**Enterprise Use Case:** Fetching real-time exchange rates from external banking APIs or sending event webhooks to enterprise ERP systems.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `http.request` | **HTTP Request** | In: `main`<br>Out: `main, error` | `edge_fn` | free |

### Node Specifications (HTTP & REST API Client)

#### `http.request` — HTTP Request

Call any URL. Supports auth, pagination, retries. User-provided URLs go through an SSRF-safe egress.

- **Executor Runtime:** `edge_fn`
- **Required Tier:** `FREE`
- **Execution Cost:** free

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main), `error` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `method` | `options` | No | `GET` | <br>_Options:_ `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |
| `url` | `string` | Yes | _none_ |  |
| `headers` | `json` | No | `{}` |  |
| `query` | `json` | No | `{}` |  |
| `body` | `json` | No | `{}` |  |
| `body_format` | `options` | No | `json` | <br>_Options:_ `json`, `form`, `text`, `none` |
| `auth_type` | `options` | No | `none` | <br>_Options:_ `none`, `bearer`, `basic`, `api_key`, `oauth2` |

```json
{
  "id": "http_request_1",
  "type": "http.request",
  "position": [
    250,
    150
  ],
  "params": {
    "method": "GET",
    "url": "<value>",
    "headers": {},
    "query": {}
  }
}
```

---

## 🛡️ System Safeguards & Rollback <a id="system"></a>

> **Total Nodes:** 1 | **Category Identifier:** `system`

Workflow configuration snapshots and automated rollback safeguards that restore previous stable states when runtime anomalies are detected.

**Enterprise Use Case:** Protecting production sales bots from configuration drift by rolling back automatically if error rates surge above 2%.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `system.version_snapshot` | **System: Version Snapshot** | In: `in`<br>Out: `main, rollback` | `builtin` | Free (0 credits) |

### Node Specifications (System Safeguards & Rollback)

#### `system.version_snapshot` — System: Version Snapshot

Create a configuration snapshot for rollback safeguards.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `in` (any)
- **Output Ports:** `main` (any), `rollback` (any)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `snapshot_tag` | `string` | No | `v1.0-checkpoint` | Unikalna nazwa punktu kontrolnego. |
| `auto_rollback_on_failure` | `boolean` | No | `True` | Czy automatycznie wycofać zmiany w przypadku awarii kolejnego węzła. |

```json
{
  "id": "system_version_snapshot_1",
  "type": "system.version_snapshot",
  "position": [
    250,
    150
  ],
  "params": {
    "snapshot_tag": "v1.0-checkpoint",
    "auto_rollback_on_failure": true
  }
}
```

---

## 🛠️ Developer Inspection Tooling <a id="developer"></a>

> **Total Nodes:** 1 | **Category Identifier:** `developer`

Inspection utilities, execution mock environments, and interactive test harnesses for developing and debugging custom agent logic.

**Enterprise Use Case:** Simulating external API responses and edge function executions during workflow prototyping without incurring third-party API costs.

### Category Summary Table

| Node Type (`type`) | Display Name | Ports (In / Out) | Runtime | Cost Model |
|---|---|---|:---:|---|
| `ai.code_sandbox_exec` | **Piaskownica Kodu (Python / JS Sandbox)** | In: `main`<br>Out: `main` | `builtin` | Free (0 credits) |

### Node Specifications (Developer Inspection Tooling)

#### `ai.code_sandbox_exec` — Piaskownica Kodu (Python / JS Sandbox)

Wykonuje bezpieczny skrypt transformacji danych, kalkulacji matematycznych i formatowania JSON w izolowanym środowisku.

- **Executor Runtime:** `builtin`
- **Required Tier:** `FREE`
- **Execution Cost:** Free (0 credits)

- **Input Ports:** `main` (main)
- **Output Ports:** `main` (main)

**Configuration Parameters (`params`):**

| Parameter | Type | Required | Default | Description / Allowed Values |
|---|:---:|:---:|:---:|---|
| `language` | `options` | No | `python` | <br>_Options:_ `python`, `javascript` |
| `code` | `string` | No | `# Wejście dostępne pod zmienną: input_data
# Wynik przypisz do: output_data
output_data = {'status': 'processed', 'data': input_data}` |  |
| `timeout_ms` | `number` | No | `3000` |  |

```json
{
  "id": "ai_code_sandbox_exec_1",
  "type": "ai.code_sandbox_exec",
  "position": [
    250,
    150
  ],
  "params": {
    "language": "python",
    "code": "# Wej\u015bcie dost\u0119pne pod zmienn\u0105: input_data\n# Wynik przypisz do: output_data\noutput_data = {'status': 'processed', 'data': input_data}",
    "timeout_ms": 3000
  }
}
```

---

## Production Pipeline Recipes

These battle-tested DAG orchestrations demonstrate how specialized nodes interconnect into autonomous business pipelines.

### Recipe 1: E-Commerce Content Automation (Packshot ➔ 3D Studio Mockup ➔ Allegro & Instagram)

```
┌─────────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│ trigger.webhook │────▶│ fotohub.image.remove_bg│────▶│ fotohub.creative.mockup │
└─────────────────┘     └───────────────────────┘     └────────────────────────┘
                                                                   │
                        ┌──────────────────────────────────────────┴───────────────┐
                        ▼                                                          ▼
             ┌───────────────────────┐                                  ┌───────────────────────────┐
             │ allegro.create_listing│                                  │social.publish_instagram_re│
             └───────────────────────┘                                  └───────────────────────────┘
```

This workflow receives raw product images via Webhook, eliminates background clutter using alpha matting, composes the product into a photorealistic 3D studio scene with physically accurate lighting, and concurrently publishes the commercial listing on Allegro and promotional Reel on Instagram.

### Recipe 2: Viral Short-Form Video Engine with Auto-Clipper & Karaoke Captions

```
┌──────────────────┐     ┌────────────────────────┐     ┌──────────────────────────────┐
│ trigger.schedule │────▶│ fotohub.shorts.clip_auto│────▶│ fotohub.shorts.subtitles_kara│
└──────────────────┘     └────────────────────────┘     └──────────────────────────────┘
                                                                        │
                                 ┌──────────────────────────────────────┘
                                 ▼
                      ┌────────────────────────────┐     ┌──────────────────────────────┐
                      │ fotohub.shorts.add_bumper  │────▶│ fotohub.social.cross_publish │
                      └────────────────────────────┘     └──────────────────────────────┘
```

Runs on a daily schedule: fetches the latest webinar or podcast recording, pinpoints high-engagement segments using AI clipping, overlays dynamic karaoke subtitles (MrBeast / Hormozi style), attaches brand intro/outro bumpers, and broadcasts to TikTok, YouTube Shorts, and Instagram Reels simultaneously.

### Recipe 3: Multi-Agent Consensus Swarm with Self-Healing

```
┌──────────────────┐     ┌─────────────────────┐     ┌───────────────────────────────┐
│  core_io.input   │────▶│  agent.swarm_fanout │────▶│   agent.consensus_aggregate   │
└──────────────────┘     └─────────────────────┘     └───────────────────────────────┘
                                                                     │
                                     ┌───────────────────────────────┘
                                     ▼
                         ┌───────────────────────┐     ┌───────────────────────────────┐
                         │  agent.critique_loop  │────▶│      agent.self_healing       │
                         └───────────────────────┘     └───────────────────────────────┘
```

Dispatches prompts to 3 distinct LLM personas in parallel. The consensus node evaluates answers based on confidence weighting and quorum rules, passes the winning strategy into a critique loop, and automatically heals execution anomalies before producing the final decision.
