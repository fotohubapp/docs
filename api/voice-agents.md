# Realtime Voice Agents API

The Realtime Voice Agents API creates conversational AI agents that talk over
a WebSocket with sub-second latency, powered by xAI Grok Voice. Define a
persona once (instructions, voice, greeting, language, function tools) and
mint short-lived browser session tokens for it whenever a user starts talking.

::: tip Powered by xAI Grok Voice
FOTOhub never exposes the underlying xAI API key to the browser. Every
session call returns a ~10 minute ephemeral `client_secret` plus the exact
WebSocket subprotocol array to connect with instead.
:::

## Architecture and Lifecycle

```mermaid
sequenceDiagram
    participant C as Client (Browser)
    participant S as FOTOhub API
    participant W as xAI Realtime WebSocket
    C->>S: POST /v1/voice/agents/{agent_id}/sessions
    S-->>C: client_secret, websocket_url, subprotocols
    C->>W: Connect with subprotocols
    W-->>C: Session started
    C->>W: Stream audio (PCM16)
    W-->>C: Transcript + audio response events
    C->>W: Close connection
```

1. **Create an agent** once with `POST /v1/voice/agents` (persona, voice, tools).
2. **Mint a session** for that agent with `POST /v1/voice/agents/{agent_id}/sessions`
   whenever a user starts a call. This is the billed step.
3. **Connect** the browser directly to `websocket_url` using the returned
   `subprotocols` array — the real xAI credential never touches the client.
4. For a persona computed per-call instead of stored, use
   `POST /v1/voice/sessions` and skip step 1.

---

## Voices

### List Voices

```http
GET /v1/voice/voices
```

Returns all realtime voices available to voice agents (26 multilingual xAI
Grok Voice presets).

#### Response

```json
{
  "voices": [
    { "id": "eve", "name": "Eve", "language": "multilingual" },
    { "id": "ara", "name": "Ara", "language": "multilingual" }
  ],
  "count": 26
}
```

#### Example

::: code-group

```bash [cURL]
curl -X GET "https://apis.fotohub.app/v1/voice/voices" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

```python [Python]
import requests

resp = requests.get(
    "https://apis.fotohub.app/v1/voice/voices",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
)
print(resp.json())
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/voice/voices", {
  headers: { Authorization: "Bearer fh_live_your_api_key" },
});
console.log(await resp.json());
```

:::

---

## Agents

Agents are owned by the caller (`fh_live_*` key) and persisted, so they can
be reused across sessions.

### Create Agent

```http
POST /v1/voice/agents
```

Requires a write-scoped API key.

#### Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | **Yes** | — | Display name, max 80 characters. |
| `instructions` | string | **Yes** | — | System prompt / persona, max 8000 characters. |
| `voice` | string | No | `eve` | One of the ids from `GET /v1/voice/voices`. |
| `greeting` | string | No | `null` | Opening line, max 500 characters. |
| `language` | string | No | `pl` | 2-8 character language hint (e.g. `pl`, `en`, `de`). |
| `tools` | array | No | `[]` | Function tools: `[{name, description, parameters}]`, max 24, `name` must match `^[a-zA-Z0-9_-]{1,64}$`. |
| `temperature` | number | No | `null` | Sampling temperature, `0.0`-`2.0`. |
| `metadata` | object | No | `{}` | Free-form key/value store. |

#### Response — `201 Created`

```json
{
  "id": "5b1a...",
  "name": "Support Agent",
  "instructions": "You are a calm, concise customer support agent...",
  "voice": "eve",
  "greeting": "Hi, how can I help you today?",
  "language": "en",
  "tools": [],
  "model": "fotohub-realtime-voice",
  "temperature": null,
  "metadata": {},
  "is_active": true,
  "created_at": "2026-09-18T10:00:00Z",
  "updated_at": "2026-09-18T10:00:00Z"
}
```

#### Example

::: code-group

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/voice/agents" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Support Agent",
    "instructions": "You are a calm, concise customer support agent for FOTOhub.",
    "voice": "eve",
    "greeting": "Hi, how can I help you today?",
    "language": "en"
  }'
```

```python [Python]
import requests

resp = requests.post(
    "https://apis.fotohub.app/v1/voice/agents",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
    json={
        "name": "Support Agent",
        "instructions": "You are a calm, concise customer support agent for FOTOhub.",
        "voice": "eve",
        "greeting": "Hi, how can I help you today?",
        "language": "en",
    },
)
agent = resp.json()
print(agent["id"])
```

```typescript [TypeScript]
const resp = await fetch("https://apis.fotohub.app/v1/voice/agents", {
  method: "POST",
  headers: {
    Authorization: "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Support Agent",
    instructions: "You are a calm, concise customer support agent for FOTOhub.",
    voice: "eve",
    greeting: "Hi, how can I help you today?",
    language: "en",
  }),
});
const agent = await resp.json();
console.log(agent.id);
```

:::

### List Agents

```http
GET /v1/voice/agents
```

| Query Parameter | Type | Default | Description |
|------------------|------|---------|-------------|
| `limit` | integer | `50` | Max results, 1-200. |
| `offset` | integer | `0` | Pagination offset. |

#### Response

```json
{
  "agents": [ { "id": "5b1a...", "name": "Support Agent", "...": "..." } ],
  "count": 1,
  "limit": 50,
  "offset": 0
}
```

```bash [cURL]
curl -X GET "https://apis.fotohub.app/v1/voice/agents?limit=20" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

### Get Agent

```http
GET /v1/voice/agents/{agent_id}
```

Returns `404` if the agent does not exist or is not owned by the caller.

```bash [cURL]
curl -X GET "https://apis.fotohub.app/v1/voice/agents/5b1a..." \
  -H "Authorization: Bearer fh_live_your_api_key"
```

### Update Agent

```http
PATCH /v1/voice/agents/{agent_id}
```

Requires a write-scoped API key. Partial update — send only the fields you
want to change. Accepts the same body fields as create, plus `is_active`
(boolean).

::: code-group

```bash [cURL]
curl -X PATCH "https://apis.fotohub.app/v1/voice/agents/5b1a..." \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{ "greeting": "Thanks for calling FOTOhub support.", "is_active": true }'
```

```python [Python]
resp = requests.patch(
    "https://apis.fotohub.app/v1/voice/agents/5b1a...",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
    json={"greeting": "Thanks for calling FOTOhub support.", "is_active": True},
)
```

```typescript [TypeScript]
await fetch("https://apis.fotohub.app/v1/voice/agents/5b1a...", {
  method: "PATCH",
  headers: {
    Authorization: "Bearer fh_live_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ greeting: "Thanks for calling FOTOhub support.", isActive: true }),
});
```

:::

### Delete Agent

```http
DELETE /v1/voice/agents/{agent_id}
```

Requires a write-scoped API key.

```json
{ "deleted": true, "id": "5b1a..." }
```

```bash [cURL]
curl -X DELETE "https://apis.fotohub.app/v1/voice/agents/5b1a..." \
  -H "Authorization: Bearer fh_live_your_api_key"
```

---

## Sessions

Sessions mint the browser's realtime credential. Nothing about a session is
persisted or queryable afterwards — there is no list-sessions or
transcript-lookup endpoint. Capture the transcript client-side from the
WebSocket's own transcript events if you need one.

Both session endpoints are **billed** and require a write-scoped API key.
Check the current USD rate for `voice_realtime_session` with
[`GET /v1/pricing`](/api/getting-started#pricing) before relying on a fixed
number — the response's `usd_charged` / `balance_usd` fields always report
what was actually charged.

### Create Session for a Stored Agent

```http
POST /v1/voice/agents/{agent_id}/sessions
```

Fails with `400` if the agent is `is_active: false`, and `503` if realtime
voice is not configured on the server. Billing is refunded automatically if
the upstream provider fails to issue a credential.

#### Response — `201 Created`

```json
{
  "client_secret": "sk_live_ephemeral...",
  "expires_at": "2026-09-18T10:10:00Z",
  "model": "fotohub-realtime-voice",
  "websocket_url": "wss://api.x.ai/v1/realtime?model=grok-voice-latest",
  "subprotocols": ["realtime", "openai-insecure-api-key.sk_live_ephemeral..."],
  "session": {
    "voice": "eve",
    "instructions": "You are a calm, concise customer support agent...",
    "greeting": "Hi, how can I help you today?",
    "language": "en",
    "tools": [],
    "temperature": null
  },
  "agent_id": "5b1a...",
  "usd_charged": 0.267953,
  "balance_usd": 12.40
}
```

::: code-group

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/voice/agents/5b1a.../sessions" \
  -H "Authorization: Bearer fh_live_your_api_key"
```

```python [Python]
resp = requests.post(
    "https://apis.fotohub.app/v1/voice/agents/5b1a.../sessions",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
)
session = resp.json()
print(session["websocket_url"], session["subprotocols"])
```

```typescript [TypeScript]
const resp = await fetch(
  "https://apis.fotohub.app/v1/voice/agents/5b1a.../sessions",
  { method: "POST", headers: { Authorization: "Bearer fh_live_your_api_key" } },
);
const session = await resp.json();
const ws = new WebSocket(session.websocket_url, session.subprotocols);
```

:::

### Create Ad-hoc Session

```http
POST /v1/voice/sessions
```

Same billing and response shape as above, but nothing is stored — use this
when the persona is computed per call instead of reused.

#### Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `instructions` | string | No | `""` | System prompt, max 8000 characters. |
| `voice` | string | No | `eve` | One of the ids from `GET /v1/voice/voices`. |
| `greeting` | string | No | `null` | Opening line, max 500 characters. |
| `language` | string | No | `pl` | 2-8 character language hint. |
| `tools` | array | No | `[]` | Function tools, same shape as agent creation. |
| `temperature` | number | No | `null` | `0.0`-`2.0`. |

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/voice/sessions" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "instructions": "You are a friendly Polish-language tour guide.",
    "voice": "luna",
    "language": "pl"
  }'
```

---

## Errors

| HTTP Code | Meaning |
|-----------|---------|
| 400 | Invalid parameter, or agent is `is_active: false` |
| 401 | Missing or invalid API key |
| 402 | Insufficient wallet balance for the session |
| 403 | Read-only key used on a write endpoint (create/update/delete/session) |
| 404 | Agent not found, or not owned by the caller |
| 502 | Voice provider (xAI) unreachable or rejected the request |
| 503 | Realtime voice is not configured on the server |
