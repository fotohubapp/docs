# Voice Agents

The Voice Agents API lets you define your own realtime voice assistants — persona, voice, greeting, language and function-calling tools — and mint short-lived session tokens that a browser can use to hold a live, spoken conversation with them.

It is powered by **FOTOhub Realtime Voice**, the same speech-to-speech engine that drives the assistant inside the FOTOhub app: full-duplex audio, server-side turn detection, streaming transcripts and tool calls over a single WebSocket.

::: info Capabilities
- **Reusable agents** — store a persona once, start as many conversations as you need
- **Ad-hoc sessions** — compute the persona per call and store nothing
- **26 multilingual voices** — one voice speaks any supported language
- **Function calling** — declare up to 24 JSON-Schema tools per agent
- **Browser-safe credentials** — sessions hand out a ~10 minute client secret, never your API key
- **Barge-in** — server-side VAD lets the caller interrupt the assistant mid-sentence
:::

**Base URL:** `https://apis.fotohub.app`
**Authentication:** `Authorization: Bearer fh_live_your_api_key`
**Billing:** 5 credits per minted session

::: tip Building the browser side?
This page is the REST reference. For the WebSocket protocol, mic capture, audio playback and a copy-pasteable client, see **[Realtime Voice Integration](/api/realtime-voice)**.
:::

---

## Endpoints

| Method | Path | Key type | Description |
|--------|------|----------|-------------|
| GET | `/v1/voice/voices` | any | List the 26 available voices |
| POST | `/v1/voice/agents` | write | Create an agent — returns `201` |
| GET | `/v1/voice/agents` | any | List your agents, newest first |
| GET | `/v1/voice/agents/{agent_id}` | any | Fetch one agent |
| PATCH | `/v1/voice/agents/{agent_id}` | write | Partial update |
| DELETE | `/v1/voice/agents/{agent_id}` | write | Delete an agent |
| POST | `/v1/voice/agents/{agent_id}/sessions` | write | Mint a session for a stored agent — `201`, billed |
| POST | `/v1/voice/sessions` | write | Mint an ad-hoc session from an inline config — `201`, billed |

Every endpoint is scoped to the key's owner. An `agent_id` that belongs to somebody else returns `404`, never the row.

::: warning Read-only keys cannot write or start sessions
`POST`, `PATCH` and `DELETE` — including both session endpoints — require a key created with **write** or **admin** access. A read-only key gets `403`. Minting a session is a write because it spends credits.
:::

---

## The agent object

```json
{
  "id": "8f1c4d2e-91b7-4a0f-9c3d-5e2a7b6f0d11",
  "name": "Storefront Concierge",
  "instructions": "You are the voice concierge for a Polish photo studio. Answer in the caller's language, keep replies under two sentences, and use the check_availability tool before promising any slot.",
  "voice": "eve",
  "greeting": "Dzien dobry, w czym moge pomoc?",
  "language": "pl",
  "tools": [
    {
      "name": "check_availability",
      "description": "Check open studio slots for a given date",
      "parameters": {
        "type": "object",
        "properties": { "date": { "type": "string", "description": "ISO date, e.g. 2026-08-04" } },
        "required": ["date"]
      }
    }
  ],
  "model": "fotohub-realtime-voice",
  "temperature": 0.7,
  "metadata": { "tenant": "studio-krakow", "channel": "web" },
  "is_active": true,
  "created_at": "2026-07-30T11:22:33.412Z",
  "updated_at": "2026-07-30T11:22:33.412Z"
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string (uuid) | server-assigned | Agent identifier, used in every per-agent path |
| `name` | string | required | Human-readable name. Max **80** characters, trimmed, must not be empty |
| `instructions` | string | required | System prompt / persona. Max **8000** characters, trimmed, must not be empty |
| `voice` | string | `"eve"` | One of the 26 ids from `GET /v1/voice/voices`. Lower-cased before validation |
| `greeting` | string \| null | `null` | Opening line the assistant says first. Max **500** characters |
| `language` | string | `"pl"` | Language hint, 2–8 characters (`"pl"`, `"en"`, `"de"`, `"pt-BR"`, …) |
| `tools` | object[] | `[]` | Function tools, max **24**. See [Tools](#tools) |
| `model` | string | server-assigned | Opaque engine identifier. Read-only — echo it back if you log it, do not branch on it |
| `temperature` | number \| null | `null` | Sampling temperature, **0–2**. `null` means the engine default |
| `metadata` | object | `{}` | Free-form key/value store. Never interpreted by FOTOhub |
| `is_active` | boolean | `true` | When `false`, session minting is refused with `400`. Settable via `PATCH` only |
| `created_at` | string (ISO 8601) | server-assigned | Creation timestamp |
| `updated_at` | string (ISO 8601) | server-assigned | Last modification timestamp |

::: info `model` is opaque
The API returns an engine identifier so you can correlate support tickets and usage rows. Treat it as an opaque string: it is not a public model name, it is not selectable per request, and it may change without notice. There is exactly one realtime voice engine today.
:::

### Tools

Each entry in `tools` is normalised to `{name, description, parameters}` — any other key you send is dropped.

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | **Yes** | Must match `^[a-zA-Z0-9_-]{1,64}$`. Must be unique within the agent |
| `description` | string | No | Truncated to 1000 characters. Defaults to `""` |
| `parameters` | object | No | JSON Schema for the arguments. Defaults to `{"type": "object", "properties": {}}` |

A bad tool array fails the whole request with `400`: a non-object entry, a name that breaks the pattern, a duplicate name, `parameters` that is not an object, or a non-string `description`.

Function calls arrive over the WebSocket, not over REST — see [handling a tool call](/api/realtime-voice#handling-a-tool-call).

---

## List voices

```http
GET /v1/voice/voices
```

Works with any valid key, costs nothing.

**Response `200`:**

```json
{
  "voices": [
    { "id": "eve", "name": "Eve", "language": "multilingual" },
    { "id": "ara", "name": "Ara", "language": "multilingual" },
    { "id": "celeste", "name": "Celeste", "language": "multilingual" }
  ],
  "count": 26
}
```

All 26 voices are multilingual — a single voice speaks any supported language, so pick by character rather than by locale.

**Feminine:** `ara`, `carina`, `celeste`, `eve`, `iris`, `luna`, `lux`

**Masculine:** `altair`, `atlas`, `castor`, `cosmo`, `helios`, `helix`, `kepler`, `leo`, `lumen`, `naksh`, `orion`, `perseus`, `rex`, `rigel`, `sal`, `sirius`, `ursa`, `zagan`, `zenith`

::: tip Do not hardcode the list
Prefer `GET /v1/voice/voices` over this table — the endpoint is the authority, and an unknown id fails the request with `400` rather than falling back silently.
:::

---

## Create an agent

```http
POST /v1/voice/agents
```

**Request:**

```json
{
  "name": "Storefront Concierge",
  "instructions": "You are the voice concierge for a Polish photo studio. Answer in the caller's language and keep replies under two sentences.",
  "voice": "eve",
  "greeting": "Dzien dobry, w czym moge pomoc?",
  "language": "pl",
  "temperature": 0.7,
  "tools": [
    {
      "name": "check_availability",
      "description": "Check open studio slots for a given date",
      "parameters": {
        "type": "object",
        "properties": { "date": { "type": "string" } },
        "required": ["date"]
      }
    }
  ],
  "metadata": { "tenant": "studio-krakow" }
}
```

Only `name` and `instructions` are required. `is_active` cannot be set here — new agents are always active.

**Response `201`:** the full [agent object](#the-agent-object).

### Example

::: code-group

```python [Python]
import requests

BASE = "https://apis.fotohub.app"
HEADERS = {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
}

agent = requests.post(
    f"{BASE}/v1/voice/agents",
    headers=HEADERS,
    json={
        "name": "Storefront Concierge",
        "instructions": (
            "You are the voice concierge for a Polish photo studio. "
            "Answer in the caller's language and keep replies under two sentences."
        ),
        "voice": "eve",
        "greeting": "Dzien dobry, w czym moge pomoc?",
        "language": "pl",
        "temperature": 0.7,
    },
).json()

print(f"Agent: {agent['id']} ({agent['voice']})")
```

```typescript [TypeScript]
const BASE = "https://apis.fotohub.app";
const HEADERS = {
  "Authorization": "Bearer fh_live_your_api_key",
  "Content-Type": "application/json",
};

const agent = await fetch(`${BASE}/v1/voice/agents`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({
    name: "Storefront Concierge",
    instructions:
      "You are the voice concierge for a Polish photo studio. " +
      "Answer in the caller's language and keep replies under two sentences.",
    voice: "eve",
    greeting: "Dzien dobry, w czym moge pomoc?",
    language: "pl",
    temperature: 0.7,
  }),
}).then((r) => r.json());

console.log(`Agent: ${agent.id} (${agent.voice})`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/voice/agents" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Storefront Concierge",
    "instructions": "You are the voice concierge for a Polish photo studio. Answer in the callers language and keep replies under two sentences.",
    "voice": "eve",
    "greeting": "Dzien dobry, w czym moge pomoc?",
    "language": "pl",
    "temperature": 0.7
  }'
```

:::

---

## List agents

```http
GET /v1/voice/agents?limit=50&offset=0
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | `50` | Page size. Clamped to **1–200** |
| `offset` | integer | `0` | Rows to skip. Negative values are clamped to `0` |

Ordered by `created_at` descending.

**Response `200`:**

```json
{
  "agents": [
    { "id": "8f1c4d2e-91b7-4a0f-9c3d-5e2a7b6f0d11", "name": "Storefront Concierge", "voice": "eve" }
  ],
  "count": 1,
  "limit": 50,
  "offset": 0
}
```

Each element is a full [agent object](#the-agent-object) — abbreviated above. `count` is the size of **this page**, not the total number of agents, so keep paging while `count == limit`.

---

## Get an agent

```http
GET /v1/voice/agents/{agent_id}
```

**Response `200`:** the [agent object](#the-agent-object). Unknown or foreign ids return `404`.

---

## Update an agent

```http
PATCH /v1/voice/agents/{agent_id}
```

A true partial update: only the keys present in the body are touched. Sending `{}` fails with `400 No updatable fields supplied`.

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Same rules as create — still cannot be empty |
| `instructions` | string | Same rules as create — still cannot be empty |
| `voice` | string | Must be a known voice id |
| `greeting` | string \| null | Send `null` to remove the greeting |
| `language` | string | 2–8 characters |
| `tools` | object[] | Replaces the array wholesale, it is not merged. Send `[]` to remove all tools |
| `temperature` | number \| null | 0–2, or `null` for the engine default |
| `metadata` | object | Replaces the object wholesale |
| `is_active` | boolean | `false` blocks new sessions for this agent |

```json
{ "voice": "luna", "temperature": 0.5, "is_active": false }
```

**Response `200`:** the updated [agent object](#the-agent-object) with a refreshed `updated_at`.

::: warning `tools` and `metadata` are replaced, not merged
Read the agent, modify the array or object client-side, and send the whole thing back. A `PATCH` with a single tool leaves the agent with exactly one tool.
:::

---

## Delete an agent

```http
DELETE /v1/voice/agents/{agent_id}
```

**Response `200`:**

```json
{ "deleted": true, "id": "8f1c4d2e-91b7-4a0f-9c3d-5e2a7b6f0d11" }
```

Deleting an agent does not terminate conversations already running against a minted secret. Set `is_active: false` first if you need to stop new sessions while draining the old ones.

---

## Mint a session for an agent

```http
POST /v1/voice/agents/{agent_id}/sessions
```

**Billing:** 5 credits, charged before the token is minted. No request body.

This is the endpoint your **server** calls, in response to a user pressing "talk". It returns a short-lived credential your browser can use directly.

**Response `201`:**

```json
{
  "client_secret": "rt_cs_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  "expires_at": 1785412953,
  "model": "fotohub-realtime-voice",
  "websocket_url": "wss://<host-returned-by-the-api>/v1/realtime?model=<engine-id>",
  "subprotocols": [
    "realtime",
    "openai-insecure-api-key.rt_cs_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
  ],
  "session": {
    "voice": "eve",
    "instructions": "You are the voice concierge for a Polish photo studio...",
    "greeting": "Dzien dobry, w czym moge pomoc?",
    "language": "pl",
    "tools": [],
    "temperature": 0.7
  },
  "agent_id": "8f1c4d2e-91b7-4a0f-9c3d-5e2a7b6f0d11",
  "credits_used": 5,
  "billing": { "method": "credits", "usd_charged": 0, "pln_charged": 0 }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `client_secret` | string | Ephemeral credential, **~600 seconds** of validity. Safe to hand to a browser |
| `expires_at` | number \| null | Expiry timestamp, passed through from the engine. May be `null` — do not rely on it as your only clock, start a ~600 s timer of your own when you mint |
| `model` | string | Opaque engine identifier, same value as on the agent |
| `websocket_url` | string | The realtime endpoint. **Use it verbatim** — do not parse, rewrite or hardcode it |
| `subprotocols` | string[] | Exactly the array to pass as the second argument of `new WebSocket()`. See below |
| `session` | object | The config to apply with `session.update` after the socket opens |
| `agent_id` | string \| null | The agent this session belongs to. `null` for ad-hoc sessions |
| `credits_used` | number | Always `5` |
| `billing` | object | `{ "method": "credits" \| "wallet", "usd_charged": number, "pln_charged": number }` — `pln_charged` is a legacy mirror; read `usd_charged` |

::: danger The subprotocols array is the only way to authenticate
A browser `WebSocket` cannot set request headers, so the credential travels as a subprotocol:

```js
const ws = new WebSocket(session.websocket_url, session.subprotocols);
```

Both alternatives are dead ends, verified against production: an `Authorization: Bearer` header is impossible from a browser and rejected anyway, and appending `?client_secret=…` to the URL returns **401**.

The second entry is prefixed with the literal `openai-insecure-api-key.` — a protocol-level literal required by the realtime transport, not a product name. Pass the array through untouched; rewriting that prefix breaks the handshake.
:::

::: warning Mint server-side, one secret per conversation
Never ship an `fh_live_*` key to a browser. Expose a thin endpoint on your own backend that authenticates your user, calls this endpoint, and returns only `client_secret`, `websocket_url`, `subprotocols` and `session`. Mint a fresh secret for every conversation — they expire in about ten minutes and are not renewable.
:::

---

## Mint an ad-hoc session

```http
POST /v1/voice/sessions
```

**Billing:** 5 credits. Nothing is persisted — use this when the persona is computed per call (an order number in the prompt, a per-tenant script, an A/B variant).

**Request:**

```json
{
  "instructions": "You are helping order #A-4821. The customer ordered 60 prints; delivery is scheduled for Friday.",
  "voice": "atlas",
  "greeting": "Hi, I can help with order A-4821.",
  "language": "en",
  "temperature": 0.6,
  "tools": []
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `instructions` | string | `""` | System prompt, max 8000 characters. Optional here, unlike on an agent |
| `voice` | string | `"eve"` | Must be a known voice id |
| `greeting` | string \| null | `null` | Max 500 characters |
| `language` | string | `"pl"` | 2–8 characters |
| `tools` | object[] | `[]` | Same shape and limits as an agent's tools |
| `temperature` | number \| null | `null` | 0–2 |

**Response `201`:** identical shape to the agent session, with `agent_id: null` and `session` echoing exactly the config you sent (after normalisation).

::: tip Agent or ad-hoc?
Use an **agent** when the persona is stable and you want it editable without a deploy — the persona lives server-side, and switching voices is a `PATCH`. Use **ad-hoc** when the prompt is assembled from live data. Both cost the same.
:::

---

## Pricing

| Operation | Credits | USD | Unit |
|-----------|---------|-----|------|
| Realtime voice session | 5 | $0.2680 | per minted session |
| Agent CRUD, voice list | 0 | Free | — |

The unit is **one minted client secret**, not one minute of audio. A single session covers the whole conversation the caller holds against that secret, up to its ~10 minute lifetime. A 20 second call and a 9 minute call cost the same; a conversation that outlives the secret needs a new session, so it costs 5 credits again.

Billing follows the standard dual-mode flow: included credits first, then the USD wallet once the credit allowance is exhausted (5 credits price out at $0.2680). `billing.method` on the response tells you which path was taken. If the engine fails to return a secret, the charge is reversed automatically — you are never billed for a session you cannot connect to.

::: info Budgeting a voice product
Cost scales with conversations started, not minutes spoken, so the failure mode to guard against is users repeatedly opening and abandoning the widget. Mint on the first real utterance rather than on page load, and reuse the same secret if the user reconnects within the window.
:::

---

## Error responses

| Status | When |
|--------|------|
| 400 | `name` or `instructions` missing, empty, or over the length limit; unknown `voice`; `language` not 2–8 characters; `temperature` outside 0–2; malformed `tools` (bad name, duplicate name, non-object entry, non-object `parameters`); `metadata` not an object; `is_active` not a boolean; `PATCH` with no updatable fields; the agent is inactive |
| 401 | Missing `Authorization` header, or an invalid/expired key |
| 402 | Not enough credits for the 5-credit session, or the monthly overage limit has been reached. No token is minted and nothing is charged |
| 403 | The key is read-only — a write or admin key is required for create, update, delete and both session endpoints. Bucket-scoped keys are refused here too: they carry no key type to authorise a write |
| 404 | `Voice agent not found` — unknown id, or an agent belonging to another account |
| 429 | Too many requests. See [Rate Limits](/api/rate-limits). A `Retry-After` header tells you how long to wait |
| 500 | The agent could not be created, updated or deleted |
| 502 | The realtime engine was unreachable or returned no secret. Credits already taken are refunded automatically |
| 503 | `Realtime voice is not configured` — the engine is unavailable server-side. Retry later |

Errors use the platform-wide shape:

```json
{ "detail": "Unknown voice 'nova'. See GET /v1/voice/voices for the 26 valid ids." }
```

::: warning Treat 402 as a product state, not an exception
The credit check runs before anything else, so a `402` means the conversation never started. Show the user a "top up to keep talking" state instead of a generic error — a voice UI that fails silently after the mic is already live is the worst possible outcome.
:::

---

## Related APIs

- **[Realtime Voice Integration](/api/realtime-voice)** — the WebSocket protocol, mic capture, playback and tool calls
- **[Music & Audio](/api/music-audio)** — one-shot TTS, transcription, translation and dubbing
- **[Voice Cloning](/api/voice-cloning)** — custom cloned voices for non-realtime speech
- **[Agent Workflows](/api/agents)** — DAG automation you can drive from a voice tool call
