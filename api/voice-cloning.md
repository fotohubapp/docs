# Voice Cloning & Verification

::: warning Not available on the public API
Voice cloning, emotion-vector TTS, tag-based expressive TTS, voice comparison,
deepfake detection, and voice forensics are **not available** through the
public FOTOhub API. Every endpoint earlier revisions of this page documented
returns `404` in production:

- `POST /v1/ai/voice/clone`
- `POST /v1/ai/voice/clone/preview`
- `POST /v1/ai/voice/clone/list`
- `DELETE /v1/ai/voice/clone/{voice_uid}`
- `POST /v1/ai/voice/emotional`
- `POST /v1/ai/voice/compare`
- `POST /v1/ai/voice/deepfake-detect`
- `POST /v1/ai/voice/forensics`

There is no `client.voice.clone()`, `client.voice.compare()`,
`client.voice.deepfake_detect()`, or `client.voice.forensics()` in the Python
or TypeScript SDKs, and no `voice_uid` / `emotion_vec` parameter accepted
anywhere on the public API.

Voice cloning is a real, priced capability in FOTOhub's internal model
catalogue — `GET /v1/models` lists a billable model `voice-clone`
(`$0.797`/request, `is_active: true`), and it runs on FOTOhub's self-hosted
IDA Voice engine (Chatterbox TTS, GPU3). But that model has **no working
caller today**, on any surface:

- **REST:** not reachable through `/v1/ai/generate/speech` or any other
  documented endpoint. Being priced and active in the catalogue means it is
  billable once something calls it, not that a route exists today.
- **MCP:** the MCP server registers a `voice_clone` tool, but its
  implementation is a stub — it makes no backend call and always returns
  "Voice cloning is not yet available via MCP." The tool used to call
  `POST /voice_clone/train` on chatterbox-server, a route that doesn't
  exist and 404s; that call was removed, and the real cloning code
  (`music-server`'s `voice_clone.py` / `tts.py`) still has nothing public in
  front of it. A tool being registered is not proof it does anything —
  see [MCP Integration](/guides/mcp-integration) for what MCP tools actually
  work today. The same is true of the `separate_stems` MCP tool: registered,
  but a stub that always returns "Stem separation is not yet available via
  MCP" rather than calling `music-server`'s real (but unbilled, so not
  public-facing) `/stems` route.
- **Dashboard:** the MCP stub's own error message points users at "the
  FOTOhub dashboard's Voice Cloning page" instead — that first-party UI is
  the one place this actually runs today, outside the scope of this
  developer API reference.

The public `POST /v1/ai/generate/speech` endpoint can select the same
underlying engine with `"model": "ida-voice"`, but only as a fixed built-in
voice — it does not accept a reference-audio upload, a saved voice profile,
or an emotion vector. There is currently no public route or working MCP tool
to clone a voice, compare two samples for speaker identity, or run
deepfake/forensic analysis on audio. If a route for `voice-clone` ships, it
will be documented here with real, verified paths.
:::

## What's actually available today

For speech and audio production today, use one of the following:

| Capability | Endpoint | Notes |
|------------|----------|-------|
| **Voice Agents** | `POST /v1/voice/agents` (see [Voice Agents](/api/voice-agents)) | Realtime conversational agents with prebuilt voices, powered by xAI Grok Voice. |
| **Text-to-Speech (built-in voices)** | `POST /v1/ai/generate/speech` | `model`: `"google"`, `"ida-voice"`, or `"grok"`. No cloning, no emotion vector. |
| **Gemini Generative TTS** | `POST /v1/ai/tts/gemini/synthesize` | Expressive voices with natural-language style prompting. See [Music & Audio](/api/music-audio#gemini-generative-tts-vertex-ai). |
| **Azure Speech Neural TTS** | `POST /v1/ai/tts/azure/synthesize` | Neural voices across many languages, with SSML emotion/role controls. See [Music & Audio](/api/music-audio#azure-speech-neural-tts). |
| **Amazon Polly TTS** | `POST /v1/ai/tts/polly/synthesize` | See [Music & Audio](/api/music-audio). |

None of these accept a reference audio upload to clone a new voice, compare
two samples for speaker identity, or detect synthetic/deepfake audio — those
capabilities are not exposed on the public API today.

### Example: built-in-voice TTS

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

audio = client.request(
    "POST", "/v1/ai/generate/speech",
    json={
        "text": "Hello, this is a test of the IDA Voice engine.",
        "model": "ida-voice",
        "language": "en",
    },
)
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/generate/speech" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test of the IDA Voice engine.",
    "model": "ida-voice",
    "language": "en"
  }'
```

:::

See [Music & Audio](/api/music-audio) for the full text-to-speech reference,
including pricing, supported languages per provider, and voice lists.
