# Realtime Voice Integration

**FOTOhub Realtime Voice** is a speech-to-speech engine: the caller speaks, the model hears raw audio and answers with raw audio, over one WebSocket. There is no transcribe-then-think-then-synthesize chain to stitch together, and no round trip through your server on the audio path.

This page is the integration guide — the transport, the events, mic capture, playback and tool calls. For the REST surface that creates agents and mints tokens, see **[Voice Agents](/api/voice-agents)**.

::: info At a glance
- **Transport:** WebSocket, JSON control frames, base64 audio payloads
- **Audio:** PCM16, mono, **24 kHz**, both directions
- **Turn-taking:** server-side VAD — you do not implement silence detection
- **Latency:** first audio arrives ~1.4 s after the caller stops speaking
- **Auth:** a ~600 second client secret passed as a WebSocket subprotocol
:::

---

## Architecture

Your server holds the FOTOhub API key. The browser only ever holds a session secret that expires in about ten minutes. Audio flows directly between the browser and FOTOhub — your server is on the control path, not the media path.

```
┌──────────────────────┐                    ┌────────────────────────┐
│      Browser         │                    │      Your server       │
│                      │   1. POST /token   │                        │
│  user taps "Talk" ───┼───────────────────▶│  authenticate the user │
│                      │                    │            │           │
│                      │                    │            ▼           │
│                      │                    │  POST /v1/voice/       │
│                      │                    │    agents/{id}/        │
│                      │                    │    sessions            │
│                      │                    │  Bearer fh_live_...    │
│                      │                    │            │           │
│   client_secret      │   2. 200 OK        │            ▼           │
│   websocket_url     ◀┼────────────────────┤   ┌─────────────────┐  │
│   subprotocols       │  (never the        │   │ 5 credits billed│  │
│   session            │   API key)         │   └─────────────────┘  │
└──────────┬───────────┘                    └───────────┬────────────┘
           │                                            │
           │  3. new WebSocket(websocket_url,           │  REST, key stays
           │       subprotocols)                        │  server-side
           │                                            │
           ▼                                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     FOTOhub Realtime Voice                            │
│                                                                       │
│   ◀── session.update            (your config: voice, prompt, tools)   │
│   ──▶ session.updated           (ready to talk)                       │
│   ◀── input_audio_buffer.append (mic PCM16 @ 24 kHz, base64)          │
│   ──▶ input_audio_buffer.speech_started / speech_stopped   (VAD)      │
│   ──▶ response.output_audio.delta          (spoken reply, PCM16)      │
│   ──▶ response.output_audio_transcript.delta / .done                  │
│   ──▶ response.function_call_arguments.done   (a tool wants running)  │
│   ◀── conversation.item.create  → function_call_output                │
│   ──▶ response.done                                                   │
└──────────────────────────────────────────────────────────────────────┘
```

::: danger Never put an `fh_live_*` key in browser code
Bundled, in a data attribute, fetched from a "private" config endpoint — it is all the same thing: a long-lived key that can spend your credits, readable by anyone who opens devtools. The session endpoint exists precisely so you never have to. Mint server-side, hand out the ten-minute secret.
:::

---

## Step 1 — mint a token on your server

One thin endpoint: authenticate your own user, call FOTOhub, forward only the four fields the browser needs.

::: code-group

```javascript [Node / Express]
import express from "express";

const app = express();
const FOTOHUB_KEY = process.env.FOTOHUB_API_KEY;   // fh_live_...
const AGENT_ID = process.env.FOTOHUB_VOICE_AGENT_ID;

app.post("/api/voice/token", async (req, res) => {
  // Your own auth first — this endpoint spends 5 credits per call.
  if (!req.user) return res.status(401).json({ error: "unauthorized" });

  const upstream = await fetch(
    `https://apis.fotohub.app/v1/voice/agents/${AGENT_ID}/sessions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FOTOHUB_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!upstream.ok) {
    const { detail } = await upstream.json().catch(() => ({}));
    // 402 = out of credits, 403 = read-only key, 503 = engine unavailable.
    return res.status(upstream.status).json({ error: detail ?? "voice_unavailable" });
  }

  const session = await upstream.json();

  // Forward only what the browser needs. Not `model`, not `billing`.
  res.json({
    client_secret: session.client_secret,
    expires_at: session.expires_at,
    websocket_url: session.websocket_url,
    subprotocols: session.subprotocols,
    session: session.session,
  });
});

app.listen(3000);
```

```python [Python / requests]
import os
import requests

BASE = "https://apis.fotohub.app"
HEADERS = {
    "Authorization": f"Bearer {os.environ['FOTOHUB_API_KEY']}",
    "Content-Type": "application/json",
}


def mint_session(agent_id: str) -> dict:
    """Mint a browser session for a stored agent. Costs 5 credits."""
    resp = requests.post(
        f"{BASE}/v1/voice/agents/{agent_id}/sessions",
        headers=HEADERS,
        timeout=20,
    )
    resp.raise_for_status()          # 402 = no credits, 403 = read-only key
    data = resp.json()
    return {
        "client_secret": data["client_secret"],
        "expires_at": data["expires_at"],
        "websocket_url": data["websocket_url"],
        "subprotocols": data["subprotocols"],
        "session": data["session"],
    }


def mint_adhoc_session(instructions: str, voice: str = "eve") -> dict:
    """Same, but with the persona computed per call — nothing is stored."""
    resp = requests.post(
        f"{BASE}/v1/voice/sessions",
        headers=HEADERS,
        json={
            "instructions": instructions,
            "voice": voice,
            "language": "en",
            "greeting": "Hi, how can I help?",
        },
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json()


if __name__ == "__main__":
    agent = requests.post(
        f"{BASE}/v1/voice/agents",
        headers=HEADERS,
        json={
            "name": "Support Line",
            "instructions": "You are a concise support agent. Keep answers under two sentences.",
            "voice": "eve",
            "language": "en",
        },
    ).json()

    session = mint_session(agent["id"])
    print("secret expires at:", session["expires_at"])
    print("subprotocols:", session["subprotocols"])
```

```bash [cURL]
# Mint a session for a stored agent (5 credits)
curl -X POST "https://apis.fotohub.app/v1/voice/agents/AGENT_ID/sessions" \
  -H "Authorization: Bearer fh_live_your_api_key"

# Or ad-hoc, with the persona inline
curl -X POST "https://apis.fotohub.app/v1/voice/sessions" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "instructions": "You are a concise support agent.",
    "voice": "eve",
    "language": "en"
  }'
```

:::

---

## Step 2 — connect from the browser

```js
const ws = new WebSocket(session.websocket_url, session.subprotocols);
```

That is the whole handshake. `subprotocols` is the array the API returned:

```json
["realtime", "openai-insecure-api-key.rt_cs_a1b2c3d4..."]
```

::: danger The subprotocol is the only way to authenticate
A browser `WebSocket` cannot set request headers — the API has no `headers` option, by design. So the credential travels in the `Sec-WebSocket-Protocol` handshake instead. Both alternatives fail in production: an `Authorization: Bearer` header is unreachable from a browser, and appending `?client_secret=…` to the URL returns **401**.

The `openai-insecure-api-key.` prefix on the second entry is a protocol-level literal required by the realtime transport, not a product name. Pass the array through byte-for-byte — rewriting or reordering it breaks the handshake.
:::

Two more rules that will cost you an afternoon otherwise:

- **Use `websocket_url` verbatim.** It is returned per session and carries the engine selector. Do not hardcode it, do not reconstruct it.
- **Call `getUserMedia()` inside the click handler**, before or alongside the socket. Browsers only grant mic access from within a user-gesture call stack; awaiting a `fetch` first and *then* asking is a common way to get a silent denial on Safari.

---

## Step 3 — configure the session

Send `session.update` as soon as the socket opens, then wait for `session.updated` before streaming audio. The `session` object from the token response has everything you need.

```js
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: "session.update",
    session: {
      voice: session.session.voice,
      instructions: session.session.instructions,
      turn_detection: { type: "server_vad" },
      tools: (session.session.tools || []).map((t) => ({ type: "function", ...t })),
    },
  }));
};
```

`turn_detection: { type: "server_vad" }` puts turn-taking on the server: it decides when the caller has finished a thought and starts generating. You do not need a silence timer, an energy threshold, or a push-to-talk button.

`greeting` and `language` from the session config are **yours to apply** — the engine does not read them. Speak the greeting by injecting it as the first user turn once the session is ready (see the full client below), and fold the language hint into `instructions` when you build the agent.

---

## Events

Frames are JSON with a `type`. These are the ones a production client handles.

### Sent by you

| Event | Purpose |
|-------|---------|
| `session.update` | Apply voice, instructions, turn detection and tools. Send once on open |
| `input_audio_buffer.append` | One chunk of mic audio: `{ type, audio }` where `audio` is base64 PCM16 |
| `conversation.item.create` | Inject a text turn, or return a tool result |
| `response.create` | Ask for a reply now — needed after injecting a turn or a tool result |

### Received by you

| Event | Payload | Meaning |
|-------|---------|---------|
| `session.updated` | `session` | Config accepted. Start streaming mic audio |
| `input_audio_buffer.speech_started` | — | VAD heard the caller start. Stop playback here to allow barge-in |
| `input_audio_buffer.speech_stopped` | — | VAD heard the caller stop. A reply is coming |
| `response.output_audio.delta` | `delta` | Base64 PCM16 chunk of the spoken reply. Queue and play |
| `response.output_audio_transcript.delta` | `delta` | Incremental text of what the assistant is saying |
| `response.output_audio_transcript.done` | `transcript` | Final text of the assistant's turn |
| `conversation.item.input_audio_transcription.completed` | `transcript`, `status` | Final text of the **caller's** turn |
| `response.function_call_arguments.delta` | `call_id`, `delta` | Partial JSON arguments — accumulate per `call_id` |
| `response.function_call_arguments.done` | `call_id`, `name`, `arguments` | A tool call is ready to run. `arguments` is a JSON **string** |
| `response.done` | — | The turn is complete |
| `error` | `error` | Engine-side error. Surface it and close cleanly |

::: tip Barge-in is two lines
On `input_audio_buffer.speech_started`, stop every scheduled audio node and reset your playback clock. Without it the assistant keeps talking over the caller and the conversation feels broken, no matter how good the model is.
:::

::: info Caller transcripts
`conversation.item.input_audio_transcription.completed` is only emitted when input transcription is enabled on the session. The assistant's own transcript (`response.output_audio_transcript.*`) always arrives, so caption the assistant from those events and treat caller captions as optional.
:::

---

## Audio format

PCM16, mono, 24 kHz, in both directions. Matching your `AudioContext` rate to 24 kHz means no resampling anywhere in the pipeline — do this and audio quality problems mostly disappear.

| Direction | Format | Encoding | Chunk size |
|-----------|--------|----------|------------|
| Browser → engine | PCM16 mono 24 kHz | base64 in `input_audio_buffer.append` | ~60 ms (1440 samples) works well |
| Engine → browser | PCM16 mono 24 kHz | base64 in `response.output_audio.delta` | variable, schedule sequentially |

Capture with an **AudioWorklet**, not `ScriptProcessorNode` — the latter runs on the main thread and drops frames the moment your UI re-renders.

Playback needs a scheduling clock, not `new Audio()`. Keep a `nextPlayTime` cursor, start each buffer at `max(currentTime + 0.02, nextPlayTime)`, and advance the cursor by the buffer duration. Chunks then abut seamlessly instead of overlapping or clicking.

---

## Complete browser client

Self-contained, no dependencies. It mints a token from your backend, connects, captures the mic, plays the reply, handles barge-in and answers one tool call.

```html
<button id="talk">Talk</button>
<div id="log"></div>

<script type="module">
const SAMPLE_RATE = 24000;

// AudioWorklet: batch mic samples into ~60 ms frames and post them to the main thread.
const WORKLET = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buf = new Float32Array(0);
    this._target = 1440; // 60 ms at 24 kHz — small enough for snappy VAD
  }
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const merged = new Float32Array(this._buf.length + input[0].length);
      merged.set(this._buf, 0);
      merged.set(input[0], this._buf.length);
      this._buf = merged;
      while (this._buf.length >= this._target) {
        this.port.postMessage(this._buf.slice(0, this._target));
        this._buf = this._buf.slice(this._target);
      }
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

// ── Your tools ──────────────────────────────────────────────────────────────
// Declared on the agent as {name, description, parameters}; implemented here.
const TOOLS = {
  async check_availability({ date }) {
    const r = await fetch(`/api/slots?date=${encodeURIComponent(date)}`);
    return r.json();               // returned to the model as JSON
  },
};

class VoiceSession {
  constructor(log) {
    this.log = log;
    this.ws = null;
    this.ctx = null;
    this.stream = null;
    this.worklet = null;
    this.source = null;
    this.out = null;
    this.scheduled = new Set();
    this.nextPlayTime = 0;
    this.ready = false;
    this.pendingArgs = new Map();
  }

  async start() {
    // 1. Mic FIRST — getUserMedia must run inside the user-gesture call stack.
    await this.startAudio();

    // 2. Token from YOUR backend, which holds the FOTOhub API key.
    const res = await fetch('/api/voice/token', { method: 'POST' });
    if (!res.ok) throw new Error((await res.json()).error || 'token failed');
    this.config = await res.json();

    // 3. Connect. The credential rides in the subprotocol array, verbatim:
    //    a browser WebSocket cannot send an Authorization header.
    this.ws = new WebSocket(this.config.websocket_url, this.config.subprotocols);
    this.ws.onopen = () => this.sendSessionUpdate();
    this.ws.onmessage = (e) => {
      try { this.handle(JSON.parse(e.data)); } catch { /* ignore bad frame */ }
    };
    this.ws.onclose = () => { this.ready = false; this.stopAudio(); };
    this.ws.onerror = () => this.log('connection failed');
  }

  stop() {
    if (this.ws) { this.ws.onclose = null; this.ws.close(); this.ws = null; }
    this.stopAudio();
    this.ready = false;
  }

  send(payload) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(payload));
  }

  sendSessionUpdate() {
    const s = this.config.session;
    this.send({
      type: 'session.update',
      session: {
        voice: s.voice,
        instructions: s.instructions,
        turn_detection: { type: 'server_vad' },
        tools: (s.tools || []).map((t) => ({ type: 'function', ...t })),
      },
    });
  }

  sendText(text) {
    this.send({
      type: 'conversation.item.create',
      item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] },
    });
    this.send({ type: 'response.create' });
  }

  handle(msg) {
    switch (msg.type) {
      case 'session.updated':
        if (this.ready) break;
        this.ready = true;
        this.log('connected');
        // The engine does not speak `greeting` on its own — prompt it.
        if (this.config.session.greeting) this.sendText(this.config.session.greeting);
        break;

      case 'response.output_audio.delta':
        if (msg.delta) this.play(msg.delta);
        break;

      case 'response.output_audio_transcript.done':
        this.log(`assistant: ${msg.transcript || ''}`);
        break;

      case 'conversation.item.input_audio_transcription.completed':
        this.log(`you: ${msg.transcript || ''}`);
        break;

      case 'input_audio_buffer.speech_started':
        this.interrupt();                       // barge-in
        break;

      case 'response.function_call_arguments.delta':
        this.pendingArgs.set(
          msg.call_id,
          (this.pendingArgs.get(msg.call_id) || '') + (msg.delta || ''),
        );
        break;

      case 'response.function_call_arguments.done':
        this.pendingArgs.delete(msg.call_id);
        this.runTool(msg.call_id, msg.name, msg.arguments);
        break;

      case 'error':
        this.log(`error: ${msg.error?.message || 'unknown'}`);
        break;
    }
  }

  async runTool(callId, name, rawArgs) {
    let args = {};
    try { args = rawArgs ? JSON.parse(rawArgs) : {}; } catch { /* keep empty */ }

    let output;
    try {
      const fn = TOOLS[name];
      output = fn ? await fn(args) : { error: `unknown tool: ${name}` };
    } catch (err) {
      output = { error: String(err) };            // tell the model, do not throw
    }

    // `output` must be a STRING. Then ask for the spoken follow-up.
    this.send({
      type: 'conversation.item.create',
      item: { type: 'function_call_output', call_id: callId, output: JSON.stringify(output) },
    });
    this.send({ type: 'response.create' });
  }

  // ── Audio in ──────────────────────────────────────────────────────────────
  async startAudio() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: SAMPLE_RATE, channelCount: 1,
        echoCancellation: true, noiseSuppression: true, autoGainControl: true,
      },
    });

    this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE, latencyHint: 'interactive' });
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
    try { await this.ctx.audioWorklet.addModule(url); } finally { URL.revokeObjectURL(url); }

    this.out = this.ctx.createGain();
    this.out.connect(this.ctx.destination);

    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.worklet = new AudioWorkletNode(this.ctx, 'pcm-processor');
    this.worklet.port.onmessage = (e) => {
      if (!this.ready) return;                   // drop audio until session.updated
      this.send({ type: 'input_audio_buffer.append', audio: encodePCM16(e.data) });
    };

    // The worklet only runs if the graph pulls it, but routing the mic to the
    // speakers would echo — so pull it through a muted gain node.
    const mute = this.ctx.createGain();
    mute.gain.value = 0;
    this.source.connect(this.worklet);
    this.worklet.connect(mute);
    mute.connect(this.ctx.destination);
  }

  stopAudio() {
    this.interrupt();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.worklet?.disconnect();
    this.source?.disconnect();
    this.out?.disconnect();
    this.ctx?.close();
    this.stream = this.worklet = this.source = this.out = this.ctx = null;
  }

  // ── Audio out ─────────────────────────────────────────────────────────────
  play(base64) {
    if (!this.ctx || !this.out) return;

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const pcm = new Int16Array(bytes.buffer);

    const buffer = this.ctx.createBuffer(1, pcm.length, SAMPLE_RATE);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 32768;

    const node = this.ctx.createBufferSource();
    node.buffer = buffer;
    node.connect(this.out);

    // Sequential scheduling: chunks abut instead of overlapping.
    const startAt = Math.max(this.ctx.currentTime + 0.02, this.nextPlayTime);
    node.start(startAt);
    this.nextPlayTime = startAt + buffer.duration;
    this.scheduled.add(node);
    node.onended = () => this.scheduled.delete(node);
  }

  /** Cut playback dead so the caller can talk over the assistant. */
  interrupt() {
    this.scheduled.forEach((n) => { try { n.stop(); } catch { /* ended */ } });
    this.scheduled.clear();
    this.nextPlayTime = 0;
  }
}

function encodePCM16(samples) {
  const out = new Uint8Array(samples.length * 2);
  const view = new DataView(out.buffer);
  for (let i = 0; i < samples.length; i++) {
    const c = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, c < 0 ? c * 0x8000 : c * 0x7fff, true);   // little-endian
  }
  let binary = '';
  for (let i = 0; i < out.length; i++) binary += String.fromCharCode(out[i]);
  return btoa(binary);
}

// ── Wire it up ──────────────────────────────────────────────────────────────
const logEl = document.getElementById('log');
const log = (line) => { logEl.textContent += `${line}\n`; };

let voice = null;
document.getElementById('talk').addEventListener('click', async () => {
  if (voice) { voice.stop(); voice = null; log('ended'); return; }
  voice = new VoiceSession(log);
  try { await voice.start(); } catch (err) { log(String(err)); voice = null; }
});
</script>
```

---

## Handling a tool call

Function calling is what turns a talking model into something useful — it can check an order, book a slot, or read your database mid-sentence.

1. **Declare** the tool on the agent (or in the ad-hoc session body) as `{name, description, parameters}`, where `parameters` is a JSON Schema object. See [Tools](/api/voice-agents#tools) for the naming rules.
2. **Advertise** it on the socket in `session.update` as `{ type: "function", name, description, parameters }`.
3. **Receive** `response.function_call_arguments.done` with `call_id`, `name` and `arguments`. Note that `arguments` is a **JSON string**, not an object — parse it, and tolerate a parse failure rather than throwing inside the socket handler.
4. **Return** the result and ask for the follow-up:

```js
ws.send(JSON.stringify({
  type: "conversation.item.create",
  item: {
    type: "function_call_output",
    call_id: callId,
    output: JSON.stringify({ slots: ["10:00", "14:30"] }),   // string, not object
  },
}));
ws.send(JSON.stringify({ type: "response.create" }));
```

::: warning `output` must be a string, and `response.create` is not optional
Passing an object as `output` silently produces a turn where the model has no data. Forgetting `response.create` leaves the caller in dead air — the model has the result but was never asked to speak. Both are the same bug from the user's side: "it stopped answering".
:::

For long-running tools, return a placeholder immediately (`{"status": "checking"}`) so the assistant can say "one moment", then inject the real answer as a second turn when it lands. Ten seconds of silence on a voice call feels like a dropped connection.

---

## Latency and quality

| Stage | Typical |
|-------|---------|
| Token mint (your server → FOTOhub) | 200–600 ms, once per conversation |
| WebSocket open + `session.updated` | 300–800 ms |
| Caller stops speaking → first audio out | **~1.4 s** |
| Tool call round trip | your handler's latency, plus ~400 ms |

Things that measurably help:

- **Pre-mint on intent, not on page load.** Mint when the user reaches for the mic, so the socket is opening while permission is granted. Do not mint on render — that is 5 credits for a session nobody used.
- **Keep `instructions` short and imperative.** "Keep replies under two sentences" measurably shortens time-to-first-word, because the model commits sooner.
- **Enable `echoCancellation`.** Without it the assistant's own voice re-enters the mic and VAD interrupts the assistant mid-sentence, on repeat.
- **Handle barge-in.** It is the difference between a demo and a product.

---

## Reconnecting

The client secret is valid for about **600 seconds** and cannot be renewed. Plan for the boundary rather than discovering it in production:

- Track `expires_at` from the token response and refresh **before** it lapses, not after the socket dies.
- Refreshing means minting a new session — another **5 credits**. Conversations longer than ten minutes cost 5 credits per session started.
- The new session starts with no history. If continuity matters, keep the transcript client-side (from the transcript events) and replay a summary as the first `conversation.item.create` on the new socket.
- If the socket closes unexpectedly, stop the mic and tear down the `AudioContext` before reconnecting. Reusing a half-closed graph produces silent capture that no amount of retrying fixes.

---

## Troubleshooting

| Symptom | Cause |
|---------|-------|
| Handshake fails immediately, `401` | `subprotocols` was modified, reordered, or rebuilt by hand. Pass the array through verbatim |
| Handshake fails, secret is minutes old | The secret expired — TTL is ~600 s. Mint a fresh one |
| Socket opens, then nothing happens | `session.update` was never sent, or audio was streamed before `session.updated` arrived |
| Assistant never hears the caller | `AudioContext` sample rate is not 24 kHz, or the worklet is not connected to a destination and so is never pulled |
| Reply audio clicks or overlaps | Chunks played as they arrive instead of scheduled against a `nextPlayTime` cursor |
| Reply audio is chipmunked or slow | Sample-rate mismatch between capture, `createBuffer` and playback. All three must be 24 kHz |
| Assistant interrupts itself constantly | Echo cancellation is off, so its own output re-triggers VAD |
| Assistant goes silent after a tool call | `output` was not a JSON string, or `response.create` was not sent |
| `402` when minting | Out of credits and the wallet or overage limit is exhausted. Nothing was charged |
| `403` when minting | The key is read-only. Sessions require a write or admin key |
| `503` when minting | The realtime engine is unavailable server-side. Retry with backoff |

---

## Related APIs

- **[Voice Agents](/api/voice-agents)** — REST reference: agent CRUD, session minting, voices, pricing
- **[Music & Audio](/api/music-audio)** — one-shot TTS and transcription when you do not need a conversation
- **[Voice Cloning](/api/voice-cloning)** — custom cloned voices for non-realtime speech
- **[Agent Workflows](/api/agents)** — call a DAG workflow from a voice tool call
