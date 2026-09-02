# Story Studio

Multi-scene narrative video from one prompt. Story Studio writes the story, designs the cast, draws a keyframe for every scene, renders each scene as a clip, narrates it and composes the finished MP4 — as one streaming call, or as eight separate calls you can review between.

::: info Six steps, two ways to drive them
`POST /v1/story/generate` runs the whole pipeline and streams progress as Server-Sent Events. The `/v1/story/step/*` endpoints run the same six steps one at a time, so your users can approve a concept, redraw a character or swap a video model before you pay for the expensive part.
:::

::: warning Scene renders are priced per model, per second — changed 2026-09-02
Step 4 used to cost one flat $0.535906 no matter what it rendered. It now costs what the clips cost: each scene is charged at its model's own per-second rate, the same rate `/v1/ai/generate/video` bills, and only for the scenes that are actually submitted. A four-scene story ranges from **$0.52** to **$4.66** depending on the model you pick, so `video_model` is now the field that decides your bill. See [What it costs](#what-it-costs).
:::

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STORY STUDIO PIPELINE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────┐   ┌──────────────┐   ┌────────────┐   ┌──────────────────┐ │
│  │  Step 1    │   │   Step 2     │   │  Step 3    │   │     Step 4       │ │
│  │  Concept   │──▶│  Characters  │──▶│  Frames    │──▶│  Scene clips     │ │
│  │ $0.267953  │   │  $0.267953   │   │ $0.267953  │   │  provider rate   │ │
│  └────────────┘   └──────────────┘   └────────────┘   └──────────────────┘ │
│                                                                │            │
│                                                                ▼            │
│                    ┌──────────────────┐   ┌────────────────────────────┐   │
│                    │     Step 6       │   │         Step 5             │   │
│                    │  Final compose   │◀──│       Voice-over           │   │
│                    │   $0.267953      │   │       $0.267953            │   │
│                    └──────────────────┘   └────────────────────────────┘   │
│                            │                                                │
│                            ▼                                                │
│                    ┌──────────────────┐                                     │
│                    │   Final MP4      │  final_video_url                    │
│                    └──────────────────┘                                     │
│                                                                             │
│  Steps 1-3, 5, 6 are our own GPU time — flat.                               │
│  Step 4 is a third-party invoice — per model, per second, per scene.         │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Step | Endpoint | What it produces | Price |
|------|----------|------------------|------:|
| 1 | `/step/concept` | title, summary, cast, scene-by-scene narration and visual prompts | 0.267953 |
| 2 | `/step/characters` | one reference image per character, in the story's style | 0.267953 |
| 3 | `/step/frames` | one storyboard keyframe per scene, using those references | 0.267953 |
| 4 | `/step/videos` | starts one clip per keyframe | [per model](#scene-render-prices) |
| — | `/step/poll-videos` | render status, and the clip URLs once ready | free |
| 5 | `/step/voiceover` | narration audio per scene | 0.267953 |
| 6 | `/step/final` | the composed MP4 with crossfades and mixed audio | 0.267953 |

---

## What it costs

Everything is charged in **USD from your prepaid wallet balance** — the API has no credits and no plan that includes generations. See [Billing](/api/billing).

| Price key | USD | Applies to |
|-----------|----:|------------|
| `story_step` | 0.267953 | each of steps 1, 2, 3, 5, 6 |
| `story_regenerate` | 0.160772 | `POST /regenerate/character`, `POST /regenerate/frame` |
| `story_full` | 1.607717 | the orchestration in `POST /generate` — **the clips are extra** |
| `story_step_videos:<model>` | [see below](#scene-render-prices) | the scene renders started by step 4 |
| `story_full_videos:<model>` | [see below](#scene-render-prices) | the same renders, when started by `POST /generate` |

The model-suffixed keys are what appears on your [wallet ledger](/api/billing#ledger) and in `GET /v1/usage`, so a charge names the model that caused it.

### Scene render prices

Each scene is priced on its own, at the model's rate for the length that model actually renders. Prices are for a 720p clip — every story scene renders at 720p.

| `video_model` | Provider | Per 5 s scene | 4-scene story | Per 8 s scene | Lengths it renders |
|---------------|----------|--------------:|--------------:|--------------:|--------------------|
| `seedance-1-5` | ByteDance | 0.130680 | **0.522720** | 0.208440 | 5, 6, 7, 8, 9, 10 s |
| `seedance-2-0-mini` *(default)* | ByteDance | 0.381150 | **1.524600** | 0.607950 | 4, 5, 6, 8, 10, 11, 12, 15 s |
| `seedance-2-0-fast` | ByteDance | 0.609840 | **2.439360** | 0.972720 | 4, 5, 6, 8, 10, 11, 12, 15 s |
| `seedance-2-0-pro` | ByteDance | 0.762300 | **3.049200** | 1.215900 | 4, 5, 6, 8, 10, 11, 12, 15 s |
| `seedance-2-5` | ByteDance | 1.165230 | **4.660920** | 1.858590 | 4, 5, 6, 8, 10, 12, 15, 20, 25, 30 s |
| `veo-3-1-fast` | Google | 0.320000 | **1.280000** | 0.640000 | 4, 6, 8 s |
| `veo-3-1` | Google | 0.800000 | **3.200000** | 1.600000 | 4, 6, 8 s |
| `wan` (Wan 2.6) | Alibaba | 0.500000 | **2.000000** | 0.800000 | 4, 5, 6, 7, 8, 9, 10 s |
| `happyhorse` (HappyHorse 1.1) | Alibaba | 0.500000 | **2.000000** | 0.800000 | 3, 4, 5, 6, 7, 8, 9, 10, 12, 15 s |

::: tip A duration snaps **down** onto that ladder
Veo renders 4, 6 or 8 seconds and nothing else, so `duration_per_scene: 5` on a Veo model is a **four-second** clip and is billed as four seconds. Ask for 7 seconds and you get 6. Below a model's floor you get its shortest step. This is the same rule the renderer applies, so the length you are billed for is always the length that exists.
:::

Worked examples, all at 720p:

| Request | Renders | Total |
|---------|---------|------:|
| 4 scenes × 5 s, `seedance-1-5` | 4 × 5 s | 0.522720 |
| 4 scenes × 5 s, default `seedance-2-0-mini` | 4 × 5 s | 1.524600 |
| 4 scenes × 5 s, `veo-3-1-fast` | 4 × 4 s | 1.280000 |
| 6 scenes × 15 s, `seedance-2-0-mini` | 6 × 15 s | 6.822900 |
| 6 scenes × 15 s, `seedance-2-5` — the largest request accepted | 6 × 15 s | 20.858580 |

Add the pipeline fees to those figures: **$1.339765** if you run the five flat steps yourself, or **$1.607717** if you let `POST /generate` orchestrate them.

### You are charged only for scenes that render

Step 4 quotes the scenes it is about to submit and settles down — never up — against what the renderer actually started:

- **A scene with no keyframe is never quoted.** If step 3 lost two of four scenes (a content filter, a provider error), step 4 charges for two.
- **A scene the renderer refuses is refunded.** The charge lands first because the wallet gates the provider call, then the difference comes back the moment step 4 returns. It appears on the ledger as an `api_refund` against the same operation.
- **Polling is free.** Step 4 already paid for the render; `/step/poll-videos` costs nothing however many times you call it.
- **`POST /generate` estimates, then settles.** Its response is a stream, so it charges for the scenes you asked for up front and refunds any it did not render, reporting that in a [`billing` event](#billing-event).

---

## Full pipeline (SSE streaming)

```
POST /v1/story/generate
```

**Auth:** `Authorization: Bearer fh_live_...` — key needs the `video` scope
**Billing:** `story_full` ($1.607717) + [the scene renders](#scene-render-prices)
**Response:** `text/event-stream`
**Rate limit:** 3 requests/min
**Runtime:** typically 4–12 minutes; the stream is open the whole time

### Request

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `prompt` | string | **required** | What the story is about. 3–2000 characters. |
| `style` | string | planner's choice | Free text — `cinematic`, `anime`, `watercolour`, `3D cartoon`, `pixel art`, `documentary`. Folded into the planner's brief and reused for every character and frame. |
| `num_scenes` | integer | `4` | 2–6. |
| `duration_per_scene` | integer | `5` | 3–15 seconds, [snapped down](#scene-render-prices) onto the model's ladder. |
| `video_model` | string | `seedance` | See [Video models](#video-models). |
| `voice` | string | default narrator | Numeric voice id from the FOTOhub voice catalogue. Omit it for the built-in multilingual narrator. |
| `language` | string | `en` | `en`, `pl` or `de` — the language the story and narration are written in. |
| `aspect_ratio` | string | `16:9` | `16:9`, `9:16` or `1:1`. |

```bash
curl -N -X POST "https://apis.fotohub.app/v1/story/generate" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A lighthouse keeper on the Baltic coast befriends a storm petrel that returns every autumn",
    "style": "watercolour",
    "num_scenes": 4,
    "duration_per_scene": 5,
    "video_model": "seedance-2-0-mini",
    "language": "en",
    "aspect_ratio": "16:9"
  }'
```

### Events

Four event names come down the wire. Branch on the event name and on `data.status` — new fields get added, so ignore what you do not know.

| Event | When | Payload |
|-------|------|---------|
| `pipeline` | opens and closes the run | `{"step": 0, "status": "started", "total_steps": 6}`, then `{"status": "completed"}` or `{"status": "failed", "error": "..."}` |
| `step` | every state change in steps 1–6 | `{"step": 1-6, "name": ..., "status": ..., "data": ...}` |
| `stream` | while step 1 is being written | `{"step": 1, "chunk": "...json fragment..."}` — the concept token by token |
| `billing` | only if money came back | see [below](#billing-event) |

`name` is `story_concept`, `characters`, `frames`, `videos`, `voiceover` or `final_video`. `status` is `started`, `progress`, `processing`, `polling`, `completed`, `failed` or `skipped`.

```
event: pipeline
data: {"step":0,"status":"started","total_steps":6}

event: step
data: {"step":1,"name":"story_concept","status":"started"}

event: stream
data: {"step":1,"chunk":"{\"title\": \"The Petrel and the Lamp\", \"summary\":"}

event: step
data: {"step":1,"name":"story_concept","status":"completed","data":{"title":"The Petrel and the Lamp","scenes":[...]}}

event: step
data: {"step":2,"name":"characters","status":"progress","index":0,"total":2,"item":{"name":"Antoni","description":"...","image_url":"https://...","role":"Main character"}}

event: step
data: {"step":3,"name":"frames","status":"progress","index":2,"total":4,"item":{"scene_number":3,"title":"The Storm","frame_url":"","frame_error":"content filter","visual_prompt":"..."}}

event: step
data: {"step":4,"name":"videos","status":"processing","data":[{"scene_number":1,"video_task_id":"cgt-2026...","video_status":"processing","video_error":""}]}

event: step
data: {"step":4,"name":"videos","status":"polling","data":[{"scene_number":1,"video_status":"processing","video_url":""}]}

event: step
data: {"step":6,"name":"final_video","status":"completed","data":{"status":"completed","final_video_url":"https://s1.fotohub.app/storage/v1/object/public/...","title":"The Petrel and the Lamp","duration":20}}

event: pipeline
data: {"status":"completed"}
```

The finished film is `final_video_url` in the **step 6 `completed`** event. There is no separate `complete` event and no `story_id`: the pipeline is stateless, which is why the step endpoints pass objects back and forth instead of an id.

Per-item progress matters on steps 2 and 3 — they generate one character and one frame at a time, and an item can fail on its own. `frame_error` on a `progress` or `completed` item is the reason a keyframe is missing; that scene will be skipped in step 4 and you will not be charged for it.

### `billing` event

Emitted only when the settle-up moved money — i.e. fewer scenes rendered than you were quoted for.

```
event: billing
data: {"billing":{"cost_usd":1.14345,"refunded_usd":0.38115,"scenes_rendered":3,"scenes_requested":4,"currency":"USD"}}
```

`cost_usd` is the final total for the whole request, `story_full` included.

### When it fails

The wallet is debited and the status line is already `200` before the first byte, so a mid-stream failure is reported in the stream, not as an HTTP error:

```
data: {"error":"Story engine returned HTTP 502","refunded":true,"cost_usd":0}
```

- **Nothing was produced** → the whole request is refunded and `refunded` is `true`.
- **Some scenes were produced, then the stream broke** → you get `"partial": true, "refunded": false` and a message saying so. Clips were rendered on hardware we paid for; contact support if the output is unusable.

---

## Step endpoints

Each step returns its output under the name the next step takes it back in, so responses chain into requests with no remapping. Every billed response carries the same money block:

```json
{
  "cost_usd": 0.267953,
  "currency": "USD",
  "billing": {
    "cost_usd": 0.267953,
    "balance_usd": 41.882,
    "currency": "USD",
    "method": "wallet",
    "model": "prepaid"
  }
}
```

### Step 1 — Concept

```
POST /v1/story/step/concept
```

**Billing:** `story_step` — $0.267953 · **Rate limit:** 10/min

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `prompt` | string | **required** | 3–2000 characters. |
| `style` | string | planner's choice | Free text. |
| `num_scenes` | integer | `4` | 2–6. |
| `duration_per_scene` | integer | `5` | 3–15 s, written onto every scene. |
| `language` | string | `en` | `en`, `pl`, `de`. |
| `aspect_ratio` | string | `16:9` | Recorded on every scene and used when the clips are rendered. |

```json
{
  "step": "concept",
  "cost_usd": 0.267953,
  "currency": "USD",
  "billing": { "...": "..." },
  "concept": {
    "title": "The Petrel and the Lamp",
    "summary": "A lighthouse keeper and a returning storm petrel keep each other's company across four autumns.",
    "language": "en",
    "style": "watercolour",
    "mood": "heartwarming",
    "target_audience": "all ages",
    "estimated_duration_seconds": 20,
    "characters": [
      {
        "name": "Antoni",
        "description": "A weathered keeper in his sixties, oilskin coat, grey stubble, kind eyes",
        "role": "Main character",
        "voice_traits": "warm male voice, slow, gravelly"
      }
    ],
    "scenes": [
      {
        "scene_number": 1,
        "title": "First Light",
        "narration": "Every autumn the same bird came back to the same window.",
        "narration_en": "Every autumn the same bird came back to the same window.",
        "dialogue": [{ "character": "Antoni", "line": "You are late this year.", "line_en": "You are late this year." }],
        "visual_prompt": "Watercolour, dawn, a stone lighthouse on a grey Baltic shore...",
        "video_prompt": "Slow push in on the lantern room as the light turns",
        "duration": 5,
        "aspect_ratio": "16:9"
      }
    ]
  }
}
```

Pass the whole `concept` object back, unmodified, to every later step. It carries the style and the per-scene duration and aspect ratio the renderer reads.

### Step 2 — Characters

```
POST /v1/story/step/characters
```

**Billing:** `story_step` — $0.267953 · **Rate limit:** 10/min

| Field | Type | Notes |
|-------|------|-------|
| `concept` | object | **required** — step 1's `concept`, unmodified. |
| `style` | string | Overrides the concept's style. Omit it to keep the cast consistent with the frames. |

```json
{
  "step": "characters",
  "cost_usd": 0.267953,
  "currency": "USD",
  "billing": { "...": "..." },
  "characters": [
    {
      "name": "Antoni",
      "description": "A weathered keeper in his sixties...",
      "role": "Main character",
      "image_url": "https://s1.fotohub.app/storage/v1/object/public/generated/..."
    }
  ],
  "characters_failed": ["Petrel"]
}
```

`characters_failed` names the characters whose reference image did not come back — their `image_url` is `""`. Redo one with [`/regenerate/character`](#regenerate-a-character) for $0.160772 instead of paying for the step again. If *no* character was produced the call is refunded and returns an error instead.

### Step 3 — Frames

```
POST /v1/story/step/frames
```

**Billing:** `story_step` — $0.267953 · **Rate limit:** 10/min

| Field | Type | Notes |
|-------|------|-------|
| `concept` | object | **required** — step 1's `concept`. |
| `characters` | array | **required** — step 2's `characters`, so the frames keep the same cast. |
| `style` | string | Overrides the concept's style. |

```json
{
  "step": "frames",
  "cost_usd": 0.267953,
  "currency": "USD",
  "billing": { "...": "..." },
  "frames": [
    {
      "scene_number": 1,
      "title": "First Light",
      "narration": "Every autumn the same bird came back to the same window.",
      "visual_prompt": "Watercolour, dawn, a stone lighthouse...",
      "duration": 5,
      "aspect_ratio": "16:9",
      "frame_url": "https://s1.fotohub.app/storage/v1/object/public/generated/..."
    },
    {
      "scene_number": 3,
      "title": "The Storm",
      "frame_url": "",
      "frame_error": "Image generation was blocked by the content filter",
      "duration": 5
    }
  ],
  "frames_failed": [3]
}
```

`frames_failed` lists the **scene numbers** with no keyframe, and each of those frames carries the reason in `frame_error`. Two useful things follow:

- Feed those numbers straight to [`/regenerate/frame`](#regenerate-a-frame) — it takes `scene_number` for exactly this reason.
- If you go on to step 4 anyway, frameless scenes are skipped and **not charged**.

### Step 4 — Scene clips

```
POST /v1/story/step/videos
```

**Billing:** [per model, per second, per scene](#scene-render-prices) · **Rate limit:** 10/min

Starts one render per keyframe and returns as soon as the jobs are accepted — the clips are **not** ready yet.

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `concept` | object | **required** | Step 1's `concept`. |
| `frames` | array | **required** | Step 3's `frames`, unmodified. |
| `video_model` | string | `seedance` | See [Video models](#video-models). Decides the bill. |
| `duration_per_scene` | integer | per scene | Overrides the length of **every** scene. 3–15 s. |
| `aspect_ratio` | string | per scene | Overrides the ratio of every scene. |

```json
{
  "step": "videos",
  "cost_usd": 1.1434500,
  "currency": "USD",
  "billing": { "...": "..." },
  "videos": [
    {
      "scene_number": 1,
      "duration": 5,
      "video_task_id": "cgt-20260902...",
      "video_status": "processing",
      "video_model": "seedance-2-0-mini",
      "video_provider": "byteplus",
      "video_url": ""
    },
    {
      "scene_number": 3,
      "video_status": "skipped",
      "video_error": "No keyframe for this scene"
    }
  ]
}
```

`cost_usd` above is three 5-second Seedance 2.0 Mini renders — the fourth scene had no keyframe, so it was neither submitted nor charged. Keep the `videos` array: the `video_task_id` on each scene is how you poll.

If not a single render could be submitted, the whole call is refunded and returns an error.

### Poll the renders

```
POST /v1/story/step/poll-videos
```

**Billing:** free · **Rate limit:** 10/min

| Field | Type | Notes |
|-------|------|-------|
| `videos` | array | **required** — step 4's `videos`, carrying their task ids. |

```json
{
  "step": "poll_videos",
  "videos": [
    {
      "scene_number": 1,
      "video_status": "completed",
      "video_url": "https://s1.fotohub.app/storage/v1/object/public/generated/scene_1.mp4",
      "duration": 5
    }
  ],
  "pending": 0
}
```

Poll every 10–15 seconds until `pending` is `0`, then pass the returned `videos` to step 5 or 6. How long a clip takes depends on the model, its length and the provider's queue; `POST /generate` gives a render up to 10 minutes before it moves on without it. `pending` counts scenes that are neither `completed`, `failed` nor `skipped`.

### Step 5 — Voice-over

```
POST /v1/story/step/voiceover
```

**Billing:** `story_step` — $0.267953 · **Rate limit:** 10/min

| Field | Type | Notes |
|-------|------|-------|
| `concept` | object | **required** — step 1's `concept`; its `language` picks the narrator. |
| `scenes` | array | **required** — the scenes from step 3 or from polling. Each scene's `narration` is what gets spoken. |
| `voice` | string | Numeric voice id, or omit for the default multilingual narrator. |

```json
{
  "step": "voiceover",
  "cost_usd": 0.267953,
  "currency": "USD",
  "billing": { "...": "..." },
  "scenes": [
    {
      "scene_number": 1,
      "narration": "Every autumn the same bird came back to the same window.",
      "video_url": "https://.../scene_1.mp4",
      "audio_url": "https://.../scene_1_narration.mp3",
      "duration": 5
    }
  ]
}
```

Every scene gains an `audio_url`; pass these scenes straight to step 6, which mixes each one over its own clip. A scene with empty `narration` gets no audio and is not an error.

### Step 6 — Final composition

```
POST /v1/story/step/final
```

**Billing:** `story_step` — $0.267953 · **Rate limit:** 10/min

| Field | Type | Notes |
|-------|------|-------|
| `concept` | object | **required** — step 1's `concept`. |
| `videos` | array | **required** — scenes from step 5 (or step 4 + polling), carrying `video_url` and optionally `audio_url`. |
| `voiceover_url` | string | One narration track for the whole story. Ignored when the scenes already carry their own `audio_url`. |
| `music_url` | string | Reserved — the composer does not mix a music bed yet, so this has no effect. |
| `transitions` | string | Reserved — the composer always crossfades. |

```json
{
  "step": "final",
  "cost_usd": 0.267953,
  "currency": "USD",
  "billing": { "...": "..." },
  "status": "completed",
  "final_video_url": "https://s1.fotohub.app/storage/v1/object/public/generated/story_final.mp4",
  "title": "The Petrel and the Lamp",
  "duration": 20
}
```

`duration` is the sum of the scene durations. Scenes with no `video_url` are left out; if none of them has one, the call is refunded and returns an error.

### Regenerate a character

```
POST /v1/story/regenerate/character
```

**Billing:** `story_regenerate` — $0.160772 · **Rate limit:** 10/min

| Field | Type | Notes |
|-------|------|-------|
| `concept` | object | **required** — step 1's `concept`. |
| `character_index` | integer | **required** — 0-based index into the concept's `characters`. |
| `style` | string | Overrides the concept's style. Omit it to keep the cast consistent. |

An index past the end of the cast is a `400` naming how many characters the concept actually has, and is not charged.

### Regenerate a frame

```
POST /v1/story/regenerate/frame
```

**Billing:** `story_regenerate` — $0.160772 · **Rate limit:** 10/min

| Field | Type | Notes |
|-------|------|-------|
| `concept` | object | **required** — step 1's `concept`. |
| `scene_number` | integer | 1-based, exactly as returned in `frames_failed`. |
| `frame_index` | integer | 0-based alternative. Send one or the other. |
| `characters` | array | **required** — step 2's `characters`, so the redraw keeps the same cast. |
| `style` | string | Overrides the concept's style. |

::: warning `scene_number`, not `frame_index`, when looping over `frames_failed`
`frames_failed` reports scene **numbers** (1-based). Feeding those into `frame_index` (0-based) silently redraws the neighbouring scene.
:::

---

## Video models

`video_model` accepts the ids below on `POST /generate` and `POST /step/videos`. The short aliases track the current release of each family, so `seedance` will point at a newer version over time; pin the explicit id if you need the price to stay put.

| Value | Renders on | Notes |
|-------|-----------|-------|
| `seedance` | Seedance 2.0 Mini | Default. Cheapest per second of the 2.0 family. |
| `seedance-2-0-mini` | Seedance 2.0 Mini | |
| `seedance-2-0-fast` | Seedance 2.0 Fast | |
| `seedance-2-0-pro` | Seedance 2.0 Pro | |
| `seedance-2-5` | Seedance 2.5 | Best motion; renders up to 30 s (a story scene is capped at 15). |
| `seedance-1-5` | Seedance 1.5 Pro | By far the cheapest option; 5 s floor. |
| `veo`, `veo-3-1-fast` | Veo 3.1 Fast | 4, 6 or 8 seconds only. |
| `veo-3-1` | Veo 3.1 | 4, 6 or 8 seconds only. |
| `wan`, `wan-2-6` | Wan 2.6 | Strong on stylised and illustrated looks. |
| `happyhorse`, `happyhorse-1-1` | HappyHorse 1.1 | API-only — not offered in the dashboard. |
| `hailuo` | Seedance 2.0 Mini | **Retired.** Still accepted so live integrations do not start failing, but it renders on the default model. |

Anything else is a `422` before you are charged. Story clips are always rendered **silent** at 720p — the narration is mixed in step 6, so a model's own audio track would only talk over it.

## Styles, languages and voices

- **`style`** is free text, forwarded to the planner and reused for every character image and keyframe. `cinematic`, `anime`, `watercolour`, `3D cartoon`, `pixel art`, `documentary`, `claymation` all work; so does a sentence. Omit it and the planner picks one that fits the story.
- **`language`** is `en`, `pl` or `de` — the language the story, the dialogue and the narration are written in. Anything else is a `422`.
- **`aspect_ratio`** is `16:9`, `9:16` or `1:1`, applied to keyframes and clips alike.
- **`voice`** must be a numeric voice id from the FOTOhub voice catalogue. Omit it and the story is narrated by our own multilingual engine, which picks a narrator for the story's language — that is the recommended path and the one that does not depend on a third-party TTS provider. A non-numeric id is ignored, not an error.

---

## Rate limits, scopes and timeouts

| | |
|---|---|
| `POST /v1/story/generate` | 3 requests/min |
| every `POST /v1/story/step/*`, `POST /v1/story/regenerate/*` | 10 requests/min |
| API key scope | `video` |
| Longest single call | step 4 and `/generate` hold the connection for up to 15 minutes |

Read your remaining budget from the `X-RateLimit-*` response headers. See [Rate limits](/api/rate-limits).

## Errors and refunds

Story Studio follows the [standard error envelope](/api/errors) — branch on the HTTP status, and read `detail`.

| Status | Means | Charged? |
|-------:|-------|----------|
| `402` | Not enough wallet balance for this step or these renders. `detail` carries `required_usd`, `balance_usd` and `shortfall_usd`. | no |
| `422` | A field the pipeline would have rejected — unknown `video_model`, `language` outside `en/pl/de`, `num_scenes` above 6. Validated before billing. | no |
| `400` | An index that is not in the concept you sent. | no |
| `424` / `502` | The renderer could not be reached, or answered with an error. | refunded |
| `500` | Includes a model we cannot price — the renders are refused rather than billed at a guess. | no |
| `503` | Story Studio is unavailable. | no |

Every step refunds itself if it produced nothing usable: no characters, no frames, no submitted render, no composed file. A step that produced *something* keeps its charge and reports the failures per item (`characters_failed`, `frames_failed`, `frame_error`, `video_error`) so you can redo just those.

---

## End-to-end example

The step path, in the order the objects flow. `jq` keeps the responses on disk so each call can pass the previous one back.

```bash
API="https://apis.fotohub.app/v1/story"
AUTH="Authorization: Bearer $FOTOHUB_API_KEY"
JSON="Content-Type: application/json"

# 1. Concept — $0.267953
curl -s -X POST "$API/step/concept" -H "$AUTH" -H "$JSON" -d '{
  "prompt": "A lighthouse keeper befriends a storm petrel that returns every autumn",
  "style": "watercolour", "num_scenes": 4, "duration_per_scene": 5, "language": "en"
}' > concept.json

# 2. Characters — $0.267953
jq '{concept: .concept}' concept.json > /tmp/req.json
curl -s -X POST "$API/step/characters" -H "$AUTH" -H "$JSON" -d @/tmp/req.json > characters.json
jq '.characters_failed' characters.json          # [] is what you want

# 3. Frames — $0.267953
jq -s '{concept: .[0].concept, characters: .[1].characters}' concept.json characters.json > /tmp/req.json
curl -s -X POST "$API/step/frames" -H "$AUTH" -H "$JSON" -d @/tmp/req.json > frames.json
jq '.frames_failed' frames.json                  # scene numbers to redraw, if any

# 4. Start the clips — 4 x 5 s on the default model = $1.524600
jq -s '{concept: .[0].concept, frames: .[1].frames, video_model: "seedance-2-0-mini"}' \
   concept.json frames.json > /tmp/req.json
curl -s -X POST "$API/step/videos" -H "$AUTH" -H "$JSON" -d @/tmp/req.json > videos.json
jq '.cost_usd' videos.json                       # what the renders actually cost

# 5. Poll until nothing is pending — free
until [ "$(jq '.pending' videos.json)" = "0" ]; do
  sleep 15
  jq '{videos: .videos}' videos.json > /tmp/req.json
  curl -s -X POST "$API/step/poll-videos" -H "$AUTH" -H "$JSON" -d @/tmp/req.json > videos.json
done

# 6. Narration — $0.267953
jq -s '{concept: .[0].concept, scenes: .[1].videos}' concept.json videos.json > /tmp/req.json
curl -s -X POST "$API/step/voiceover" -H "$AUTH" -H "$JSON" -d @/tmp/req.json > voiceover.json

# 7. Compose — $0.267953
jq -s '{concept: .[0].concept, videos: .[1].scenes}' concept.json voiceover.json > /tmp/req.json
curl -s -X POST "$API/step/final" -H "$AUTH" -H "$JSON" -d @/tmp/req.json | jq '.final_video_url'
```

The same flow in Python, with the polling loop written out:

```python
import time
import requests

API = "https://apis.fotohub.app/v1/story"
H = {"Authorization": "Bearer fh_live_your_api_key"}


def step(path: str, body: dict) -> dict:
    r = requests.post(f"{API}/{path}", json=body, headers=H, timeout=900)
    r.raise_for_status()
    return r.json()


concept = step("step/concept", {
    "prompt": "A lighthouse keeper befriends a storm petrel that returns every autumn",
    "style": "watercolour",
    "num_scenes": 4,
    "duration_per_scene": 5,
    "language": "en",
})["concept"]

characters = step("step/characters", {"concept": concept})["characters"]
frames = step("step/frames", {"concept": concept, "characters": characters})

if frames["frames_failed"]:
    # $0.160772 per redraw, instead of $0.267953 for the whole step
    for scene_number in frames["frames_failed"]:
        step("regenerate/frame", {
            "concept": concept,
            "scene_number": scene_number,
            "characters": characters,
        })

videos = step("step/videos", {
    "concept": concept,
    "frames": frames["frames"],
    "video_model": "seedance-2-0-mini",   # the field that decides the bill
})
print(f"renders cost ${videos['cost_usd']}")

while True:
    poll = step("step/poll-videos", {"videos": videos["videos"]})
    videos["videos"] = poll["videos"]
    if not poll["pending"]:
        break
    time.sleep(15)

narrated = step("step/voiceover", {"concept": concept, "scenes": videos["videos"]})
final = step("step/final", {"concept": concept, "videos": narrated["scenes"]})
print(final["final_video_url"], f"{final['duration']}s")
```

Streaming the one-call version:

```python
import json
import requests

with requests.post(
    "https://apis.fotohub.app/v1/story/generate",
    json={
        "prompt": "A lighthouse keeper befriends a storm petrel that returns every autumn",
        "style": "watercolour",
        "num_scenes": 4,
        "duration_per_scene": 5,
        "video_model": "seedance-2-0-mini",
    },
    headers={"Authorization": "Bearer fh_live_your_api_key"},
    stream=True,
    timeout=1200,
) as r:
    r.raise_for_status()
    event = None
    for line in r.iter_lines(decode_unicode=True):
        if not line:
            continue
        if line.startswith("event: "):
            event = line[7:]
        elif line.startswith("data: "):
            data = json.loads(line[6:])
            if event == "step" and data.get("status") in ("started", "completed", "failed"):
                print(f"step {data['step']} {data['name']}: {data['status']}")
            if event == "step" and data["name"] == "final_video" and data.get("status") == "completed":
                print("film:", data["data"]["final_video_url"])
            if event == "billing":
                b = data["billing"]
                print(f"refunded ${b['refunded_usd']} — {b['scenes_rendered']}/{b['scenes_requested']} scenes rendered")
            if event is None and "error" in data:
                print("failed:", data["error"], "refunded:", data.get("refunded"))
```

::: tip The SDKs do not wrap Story Studio yet
`fotohub` for Python and TypeScript covers images, video, audio and chat. Story Studio is HTTP-only for now — the requests above are the whole contract.
:::

---

## Notes and limits

- **The pipeline is stateless.** There is no story id and nothing is stored server-side between steps: what you hold in `concept`, `frames` and `videos` *is* the story. Keep them.
- **`POST /generate` also files a copy in your gallery.** Character images, keyframes, scene clips and the finished film are copied into the account's private library (`/dashboard/files`) as that run streams. The step endpoints do not — they return the generated-asset URLs and leave storage to you.
- **Steps 2 and 3 work item by item** and tolerate individual failures. A story that lost one of four keyframes still composes — from three scenes, charged for three renders.
- **Step 4 returns before the clips exist.** Calling step 5 or 6 with unpolled scenes composes empty clips; wait for `pending: 0`.
- **`music_url` and `transitions` are accepted and ignored.** The composer crossfades and mixes narration only; add a music bed yourself with [Video editing](/api/video-editing) or generate one with [`/v1/ai/generate/music`](/api/music-audio).
- **Concurrency** is bounded by the 3/min limit on `/generate` and by each provider's own queue; a `429` on step 4 while you are under your RPM is the provider's cap, not ours.
