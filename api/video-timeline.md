# Video Timeline API

Edit a video with API calls instead of a browser. A **project** holds the same timeline the FOTOhub video editor uses: tracks, clips, text, transitions, markers. You create a project, send batches of **operations** to change it, check the result with **lint** and **capture** (still frames), and **render** the final file. Every project opens in the editor at the `editorUrl` the API returns, so a person can pick up where an agent or a script left off.

Use it to build automated montage pipelines, to let an AI agent cut footage through [MCP](#mcp-tools) or the [SDKs](#sdks), or to run edits from [Flows](#flows-nodes). For the one-shot endpoints (transcode, merge, speed, subtitles) see [Video Editing](/api/video-editing).

**Base URL:** `https://apis.fotohub.app`
**Authentication:** Bearer token (API key or OAuth), as for every FOTOhub API. See [Authentication](/api/authentication).

## Endpoints

| Endpoint | Description | Cost |
|----------|-------------|------|
| `POST /v1/video/projects` | Create a project from media or a template | Free |
| `GET /v1/video/projects` | List your API projects | Free |
| `GET /v1/video/projects/{id}` | Project state: digest, media, versions | Free |
| `DELETE /v1/video/projects/{id}` | Delete a project | Free |
| `POST /v1/video/projects/{id}/ops` | Apply up to 40 operations | Free |
| `POST /v1/video/projects/{id}/digest` | Full digest, or details of chosen clips | Free |
| `POST /v1/video/projects/{id}/lint` | Check the edit for problems | Free |
| `POST /v1/video/projects/{id}/capture` | Still frames and contact sheets (async job) | Flat fee per call |
| `POST /v1/video/projects/{id}/render` | Render to a video file (async job) | Per output minute |
| `POST /v1/video/projects/{id}/auto-edit` | Edit the project for you (async job) | Base fee + AI usage |
| `POST /v1/video/projects/{id}/auto-edit/{jobId}/apply` | Commit the draft of an Auto-Edit run | Free |
| `GET /v1/video/jobs/{jobId}` | State of a capture, render or Auto-Edit job | Free |
| `GET /v1/video/ops/catalog` | JSON Schema of every operation | Free |
| `POST /v1/video/detect-scenes` | Find scene cuts in a media file | Per call |
| `POST /v1/video/detect-silence` | Find silent ranges | Per call |
| `POST /v1/video/detect-beats` | Find beats and tempo | Per call |
| `POST /v1/video/transcribe` | Start a transcription (job) | Per call |
| `GET /v1/video/transcribe/{jobId}` | Transcription state and result | Free |

Capture, render and the analysis endpoints are billed per call or per minute. The amount charged is in the `billing` block of each response and in your usage history; the [Pricing](/guides/pricing) guide does not list these operations yet. Failed capture and render jobs are refunded automatically. When you use a FOTOhub account (OAuth) on a plan that includes rendering, a render is included in the plan and nothing is charged; its `billing` block says so.

Auto-Edit is billed in three parts, described in [Auto-Edit](#auto-edit).

## Conventions

### Wire format

Requests and responses use **camelCase** (`projectId`, `saveRev`, `editorUrl`, `expectedSaveRev`). On requests, the snake_case spellings (`expected_save_rev`, `dry_run`, `storage_path`, `place_media`, `clip_ids`, `media_id`, `project_id`, `noise_floor_db`, `min_silence_duration`, `min_scene_duration`) are accepted as aliases. Unknown request fields are rejected with `invalid-body`. Two things are not camelCase: the `billing` block and the top-level `cost_usd` on paid responses are snake_case, and a failed transcription carries `error_kind` and `error_message` next to the camelCase `errorKind` and `errorMessage`. Examples on this page leave `cost_usd` out.

### Time

Timeline values in operations are **ticks**: integers, where one second is `ticksPerSecond` ticks (currently **6000**, also returned by the catalog and on every project). 2.5 s is `15000`. Capture times and render ranges are in **seconds** (decimals allowed).

### Media

A project refers to media by the **media id** returned when you create it (the `assetId` field on each item of `media`). Media are never referenced by URL inside operations, and media cannot be added to a project after it is created: put every file you need in `media` when you create it.

Media you pass as `url` must be public **HTTPS** URLs. FOTOhub copies the file into your own storage first; private and internal addresses are refused (`media-blocked`). Alternatively pass `storagePath` of a file already in your storage (`<bucket>/<userId>/...`). Limits: 2 GB per video, 200 MB per audio file, 50 MB per image, 50 media items per project.

### Errors

Every error from these endpoints uses one envelope, including validation errors and rate limits:

```json
{
  "error": {
    "code": "save-conflict",
    "message": "the project was changed since expectedSaveRev",
    "details": { "currentSaveRev": 7 }
  }
}
```

`details` is optional and depends on the code. Errors raised by the editing service carry `details.path`, a JSON pointer to the offending field. Validation errors raised by the API itself (an unknown field, an empty `ops` array, more than 40 operations) carry `details.errors`, a list of `{ "loc", "msg", "type" }` entries instead. Other details you may see are `retryable`, `currentSaveRev` and `known`. Always branch on `code`, not on the text.

**Status and code do not always match one to one.** An error from the editing service keeps its code; a server-side failure there arrives as `502` with the same code (for example `internal`). Codes:

| Code | HTTP | Meaning |
|------|------|---------|
| `unauthorized` | 401 | Missing or invalid credentials. |
| `payment-required` | 402 / 403 | No funds for a paid call. Nothing was charged. Top up, then retry. |
| `insufficient-credits` | 402 | The render was refused for lack of credits. |
| `not-found` | 404 | The project, job or version does not exist, or is not yours. The two cases are deliberately indistinguishable. |
| `route-not-found` | 404 | No such route. |
| `media-not-found` | 404 / 422 | `mediaId` does not exist in that project (analysis, 404), or a `storagePath` on create points at nothing (422). |
| `draft-not-found` | 404 | `apply` on an Auto-Edit draft that was already applied or has expired. |
| `bad-request` | 400 | Malformed request. |
| `method-not-allowed` | 405 | The route does not accept that method. |
| `invalid-body` | 422 | The request failed validation. `details.path` or `details.errors[]` says where. |
| `invalid-ops` | 422 | An `ops` batch does not match the catalog: `details.path` is a JSON pointer such as `/ops/0/ids`, or `details.errors[]` with `loc` such as `["body","ops","0","ids"]`. |
| `invalid-request` | 422 | The render or capture request was rejected as a whole. |
| `save-conflict` | 409 | `expectedSaveRev` does not match. The project changed since you read it. `details.currentSaveRev` has the current value. |
| `document-too-large` | 413 | The edit would push the project document past 2 MB. |
| `payload-too-large` | 413 | Request body over the limit (2 MB). |
| `project-limit` | 409 | You reached the limit of 200 API projects. Delete some. |
| `invalid-media` | 422 | On create: the media could not be placed on the timeline, or does not fit the template slots. `details` lists `failed`, `violations` or a `reason`. |
| `media-kind-mismatch` | 422 | On create: an item's `kind` does not match the file, or a `storagePath` is in the wrong bucket for its type. |
| `media-blocked` | 422 | A media URL is not allowed: not HTTPS, private or internal address, or a file type that cannot be used in a project. |
| `media-too-large` | 413 | A media file exceeds the size limit for its type. |
| `media-unsupported` | 422 | Analysis endpoints: only audio and video files can be analysed. |
| `media-unreadable` | 422 | The file could not be read (no duration, corrupt or not playable). |
| `media-upload-failed` | 502 | Copying the media into your storage failed. `details.retryable` is `true`. |
| `media-unavailable` | 502 | The media could not be fetched. |
| `media-timeout` | 504 | Fetching and copying the media took longer than 60 s. Use smaller files, or upload them and pass `storagePath`. |
| `create-timeout` | 504 | Creating the project took too long **and it may still exist**. See [Retrying safely](#retrying-safely). |
| `timeline-timeout` | 504 | The editing backend did not answer in time. `details.retryable` is `true`, but when the call was `/ops` the batch **may have been saved**: see [Retrying safely](#retrying-safely). |
| `start-timeout` | 504 | Preparing a capture or render took too long. Nothing was charged. Retry. |
| `empty-timeline` | 422 | The project has no clips to capture or render. |
| `no-cuts` | 422 | `cuts` capture on a project whose main track has no clips. |
| `invalid-times` | 422 | Capture `times` outside the timeline. |
| `too-long` | 422 | Capture on a timeline longer than 15 minutes. |
| `invalid-size` | 422 | Capture `width` gives a shorter side under 16 px. |
| `too-large` | 422 | The capture frame size is outside the allowed range. |
| `unknown-rule` | 422 | A name in lint `rules` is not a known rule. `details.known` lists the valid names. |
| `render-rejected` | 422 | The renderer refused the render settings. The message says which. |
| `text-raster-failed` | 422 | A text clip could not be prepared for rendering. `details.clipId` names it. |
| `raster-upload-failed` | 502 | Text overlays could not be stored for rendering. Retryable. |
| `no-footage` | 422 | Auto-Edit on a project with no video or audio media. |
| `ai-budget-exceeded` | 422 | The Auto-Edit request cannot be done within `aiBudgetUsd`. |
| `plan-required` | 403 | Auto-Edit needs a paid FOTOhub plan when you use it with your FOTOhub account. |
| `plan-unavailable` | 503 | Your plan could not be verified. Retryable. |
| `busy` | 429 | Auto-Edit has no free slot. Retryable; the base fee is refunded. |
| `auto-edit-unavailable` | 502 / 503 | Auto-Edit is temporarily unavailable. Retryable. If the message says the start was not confirmed, the run may exist: read the job list before starting another. |
| `job-running` | 409 | `apply` on an Auto-Edit run that has not finished. Retry later. |
| `no-draft` | 409 | `apply` on a run with no draft to commit: it was applied already, it failed, or it ran with `autoApply: true`. |
| `rate-limited` | 429 | Too many requests. Wait `Retry-After` seconds. See [Limits](#limits). |
| `engine-busy` | 503 / 429 | The media processor has no free slot. `Retry-After` says when to retry. |
| `idempotency-key-invalid` | 400 | `X-Idempotency-Key` is longer than 255 characters. |
| `idempotency-key-reuse` | 422 | The same key was used with a different request body. |
| `idempotency-in-progress` | 409 | The first request with this key is still running. Retry after `Retry-After` (5 s). |
| `job-store-unavailable` | 502 | Job bookkeeping is unavailable. Retryable; a paid call is refunded. |
| `store-unavailable` | 502 | Project storage is unavailable. Retryable. |
| `timeline-unavailable` | 502 | The editing backend returned an invalid response or is unreachable. Retryable. |
| `engine-unavailable` | 502 | The video engine is unreachable. Retryable; a paid call is refunded. |
| `render-unavailable` | 502 | Rendering is temporarily unavailable. Retryable. |
| `lint-unavailable` | 501 | Lint is not available on this deployment. |
| `analysis-failed` | 502 | The analysis could not complete for this file (check it is a valid recording). Refunded. |
| `analysis-unavailable` | 502 | The analysis service is unavailable. Refunded. |
| `analysis-timeout` | 504 | The file took too long to analyse. Use a shorter file. Refunded. |
| `internal` | 502 | An unexpected failure in the editing backend. |
| `internal-error` | 500 | An unexpected failure in the API. |

A job that fails after it started reports its own short code in the job's `reason` (see [Jobs](#jobs)), for example `render-failed`, or `start-lost` for an Auto-Edit run that never started.

### Retrying safely

Send an `X-Idempotency-Key` header (any string up to 255 characters, for example a UUID) on `POST` requests you might retry. Within 24 hours a repeat with the same key and the same body returns the **first result** (the response carries `Idempotent-Replay: true`) instead of doing the work again, which means no second project and no second charge. A repeat with a different body is `idempotency-key-reuse`; a repeat while the first is still running is `idempotency-in-progress`.

Two rules worth knowing:

- **Creating a project.** If you get `create-timeout`, the project may already exist. Do not retry with the same key (it replays the same ambiguous answer); list your projects first, and retry with a new key only if it is not there.
- **Applying operations.** A `timeline-timeout` or `timeline-unavailable` on `/ops` is ambiguous (`retryable` is `false` there): the batch may or may not have been saved. Retrying **with the same idempotency key** replays that same error while the key is retained; it never applies the batch twice. Applying twice can only happen when you retry **without** the key, which is why you should also send `expectedSaveRev` with every batch: if the first attempt was saved, the retry answers `save-conflict`. After an ambiguous error, read the project (`GET`) and compare `saveRev` before deciding.

### Limits

Rate limits are per API key (or OAuth session) and answer `429 rate-limited` with a `Retry-After` header.

| Route | Limit |
|-------|-------|
| `/v1/video/projects` (create, list, get, delete, digest, lint) | 120 / min, shared |
| `/v1/video/projects/{id}/ops` | 240 / min |
| `/v1/video/projects/{id}/capture` | 20 / min, and **20 per hour per account** |
| `/v1/video/projects/{id}/render`, `/auto-edit` | 10 / min |
| `/v1/video/jobs/{jobId}` | 60 / min, shared across your jobs |
| `/v1/video/ops/catalog` | 240 / min |
| `/v1/video/detect-scenes`, `detect-silence`, `detect-beats` | 20 / min, **one shared bucket** |
| `POST /v1/video/transcribe` | 15 / min |
| `GET /v1/video/transcribe/{jobId}` | 60 / min per job |

The hourly capture limit is per account and is shared with anything else on your account that uses capture, including Auto-Edit. When you hit it the `Retry-After` header tells you how long to wait. Other limits: 40 operations per batch, 24 capture times per call, 2 MB per project document, 200 API projects, 50 saved versions per project. When the renderer has no free slot the call answers `engine-busy` with a `Retry-After` header.

---

## Create a project

```
POST /v1/video/projects
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `title` | string | No | `Untitled` | Project title, up to 200 characters. |
| `aspect` | string | No | `16:9` | `16:9`, `9:16`, `1:1`, `4:5` or `4:3`. |
| `fps` | integer | No | template or 30 | Frames per second: `24`, `25`, `30`, `50` or `60`. |
| `media` | array | No | `[]` | Up to 50 items: `{ "url": "https://..." }` or `{ "storagePath": "bucket/userId/..." }`, plus optional `kind` (`video`, `audio`, `image`) and `name`. Give exactly one of `url` or `storagePath` per item. |
| `template` | object | No | — | `{ "id": "<template id>" }`. Media fill the template's slots. |
| `placeMedia` | string | No | `sequence` | `sequence` lays the media one after another on the timeline; `none` registers them without placing them. Ignored with a template. |

Creating with URLs downloads and copies the files, and has a total budget of 90 seconds (60 s for the media). For large files, upload to your storage first and pass `storagePath`.

### Response

`201`

```json
{
  "projectId": "6f1c2a52-6b1e-4f0a-9d2f-1d0f1b6f7a10",
  "saveRev": 1,
  "ticksPerSecond": 6000,
  "media": [
    { "assetId": "media-1", "kind": "video", "name": "interview.mp4", "duration": 84.2, "durationTicks": 505200, "hasAudio": true, "width": 1920, "height": 1080 }
  ],
  "digest": {
    "v": 1,
    "project": { "id": "6f1c2a52-6b1e-4f0a-9d2f-1d0f1b6f7a10", "fps": 30, "aspect": "16:9", "durationTicks": 505200, "duration": "1:24.2" },
    "tracks": [ { "id": "track-1", "kind": "main" } ],
    "clips": [ { "id": "clip-1", "trackId": "track-1", "type": "video", "start": 0, "duration": 505200 } ],
    "markers": [], "selection": [], "playhead": 0
  },
  "unplacedMedia": [],
  "editorUrl": "https://fotohub.app/fh/editor/lite/6f1c2a52-6b1e-4f0a-9d2f-1d0f1b6f7a10"
}
```

- `saveRev` is the project's revision number. It goes up on every save, including edits made in the editor.
- `digest` is a compact summary of the timeline: `project` (fps, aspect, duration), `tracks`, `clips` (with ids, tracks, start and duration in ticks) and `markers`. Read clip and track ids from it.
- `unplacedMedia` lists media that were registered but not put on the timeline, each with a `reason` (for example `no-free-slot` when a template has fewer slots than media). Nothing is dropped silently.
- `editorUrl` opens the same project in the FOTOhub editor.

## Get, list and delete

```
GET    /v1/video/projects?limit=50
GET    /v1/video/projects/{id}
DELETE /v1/video/projects/{id}
```

`GET /{id}` returns `projectId`, `title`, `saveRev`, `updatedAt`, `ticksPerSecond`, `digest`, `media`, `editorUrl` and `versions`. Add `?include=doc` to also get the full project document. `versions` lists saved snapshots (`id`, `createdAt`, optional `label`); a snapshot of the state after the batch is saved whenever you pass `label` to an ops call, and automatically every 10 saves. The list returns `projects[]` with `projectId`, `title`, `updatedAt` and `editorUrl`. `limit` is 1 to 100.

## Apply operations

```
POST /v1/video/projects/{id}/ops
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ops` | array | Yes | 1 to 40 [operations](#operations-reference). |
| `dryRun` | boolean | No | Validate and preview the result without saving. |
| `expectedSaveRev` | integer | No | Fail with `save-conflict` if the project's `saveRev` is different (someone else edited it). |
| `label` | string | No | Save a named version of the project as it is **after** this batch, so you can find that state later. Up to 60 characters. Without `label`, a version is also saved automatically every 10 saves. |
| `note` | string | No | Free-form note on why the batch was applied. Up to 2000 characters. |

### Batch semantics

A batch is **not all-or-nothing per operation**:

- An operation that is rejected (for example a clip id that does not exist) is **skipped and reported**: its entry in `results` has `ok: false` and a `reason`, and `rejected` counts them. The accepted operations are still applied and saved.
- The whole batch is **rolled back only if the resulting timeline would break the project rules** (for example overlapping clips on a track). You get HTTP 200 with `rolledBack: true` and `violations`, and nothing is saved: the project and `saveRev` are unchanged.
- If no operation is accepted, `ok` is `false` and nothing is saved.
- A malformed batch (does not match the catalog) is `422 invalid-ops`.

Check `ok`, `rolledBack` and `rejected` on every response.

To reference a clip created earlier in the same batch, give the `insertClip` a `"ref": "intro"` and write `"$ref:intro"` wherever a later operation expects a clip id. The `refs` field of the response maps refs to the real ids.

```json
{
  "ok": true,
  "rolledBack": false,
  "saveRev": 2,
  "accepted": 2,
  "rejected": 0,
  "results": [{ "ok": true }, { "ok": true }],
  "refs": { "intro": "clip-9" },
  "violations": [],
  "digestDelta": { "added": [{ "id": "clip-9" }], "removed": [], "changed": [], "tracksAdded": [], "durationTicks": 523200 }
}
```

With `dryRun: true` the response has `dryRun: true`, the current `saveRev` and a `digestDelta` (added, removed and changed clips, new tracks, new duration) describing what changes. A saved batch may include `versionSaved` and `warnings`.

## Digest

```
POST /v1/video/projects/{id}/digest
```

With an empty body it returns `{ "saveRev", "digest" }`. Send `{ "view": "clips", "clipIds": ["clip-9"] }` (up to 10 ids) for the full properties of chosen clips; ids that do not exist come back in `missing`.

## Lint

```
POST /v1/video/projects/{id}/lint
```

Checks the edit for common problems without changing it. Lint first, then capture: it is free and instant.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rules` | array of strings | No | Only run these [rules](#lint-rules). An empty array means all rules. An unknown name answers `422 unknown-rule`. |
| `severity` | array of strings | No | Only report these levels: `error`, `warn` or `info` (`warning` is accepted as a synonym of `warn`). An empty array means all levels. |

A single string is accepted in place of a one-item array. The response carries the project's `saveRev`, the `findings` and a `counts` object:

```json
{
  "saveRev": 7,
  "findings": [
    {
      "rule": "HOLE_IN_COVERAGE",
      "severity": "warn",
      "message": "No video or image covers 1.4s here: the export shows background colour.",
      "at": 74400,
      "atSeconds": 12.4,
      "end": 82800,
      "endSeconds": 13.8,
      "params": { "seconds": 1.4 },
      "fix": "none"
    },
    {
      "rule": "SOURCE_MISSING",
      "severity": "error",
      "message": "Source file is missing; relink it before exporting.",
      "clipId": "clip-3",
      "trackId": "track-1",
      "suggestion": "Source is missing; re-add the media via its storagePath.",
      "fix": "relink"
    }
  ],
  "counts": { "error": 1, "warn": 1, "info": 0 },
  "available": true
}
```

| Finding field | Meaning |
|---------------|---------|
| `rule` | The rule code. |
| `severity` | `error`, `warn` or `info`. |
| `message` | English, self-contained description. Branch on `rule`, not on the text. |
| `clipId`, `clipIds` | The first clip concerned, and all of them when more than one is (for example both overlapping captions). |
| `trackId` | The track concerned, when the rule names one. |
| `at`, `atSeconds` | Start of the range on the project timeline, in ticks and in seconds. |
| `end`, `endSeconds` | End of that range, in ticks and in seconds. |
| `params` | Numbers and strings behind the finding (for example `{ "seconds": 1.4 }`; times are in seconds). |
| `fix` | A hint: `relink`, `trim-to-content` or `none`. |
| `suggestion` | A short text on how to resolve it, when there is one. |

Every field except `rule`, `severity` and `message` is optional.

### Lint rules {#lint-rules}

| Rule | Reports |
|------|---------|
| `HOLE_IN_COVERAGE` | A stretch of the timeline where nothing is visible. |
| `CLIP_NEVER_VISIBLE` | A clip that is fully covered by another, or otherwise never shown. `params.reason` says why. |
| `ZERO_DURATION` | A clip with zero or invalid duration. |
| `SOURCE_MISSING` | A clip whose media file is missing. |
| `SOURCE_EXPIRED` | A media link that expired and could not be refreshed. |
| `TEXT_OUTSIDE_SAFE_AREA` | Text that may extend past the safe area of the project's aspect ratio (an estimate). |
| `CAPTIONS_OVERLAP` | Two captions that overlap in time at the same screen position. |
| `AUDIO_CLIPPING` | Audio likely to clip (an estimate from the clip volume). |

## Capture

```
POST /v1/video/projects/{id}/capture
```

Renders still frames of the **current** timeline and packs them into labelled contact sheets, so you can look at an edit without rendering the whole video. It is far cheaper and faster than a render and is the way to verify an edit.

Give **exactly one** selector:

| Parameter | Type | Description |
|-----------|------|-------------|
| `times` | number[] | Timeline seconds, 1 to 24 values. |
| `count` | integer | 1 to 24 frames spread evenly across the timeline. |
| `cuts` | boolean | `true` for one frame per shot of the main track. |
| `width` | integer | Frame width in pixels, 16 to 1280. The shorter side is capped at 720 px, so a wide `width` on a vertical project is scaled down. |
| `sheet` | object | `{ "maxCells": 1-12, "maxEdge": 256-1568 }` to shape the contact sheets. |

**`cuts` semantics.** With `cuts: true` the frame is taken at the **midpoint of each shot** (the middle of the clip, not at the edit point), so you see what the viewer sees during the shot. Each shot appears once. If the main track has more than 24 shots the frames are thinned evenly, and the response says so in `cuts`.

Capture is asynchronous. It answers `202` with a job and bills a flat fee per call:

```json
{
  "jobId": "0d3c1a52-8b2e-4c2a-a1f4-3c2f0a9d6b11",
  "status": "queued",
  "projectId": "6f1c2a52-6b1e-4f0a-9d2f-1d0f1b6f7a10",
  "saveRev": 2,
  "times": [1.5, 6.0, 11.25],
  "width": 640,
  "height": 360,
  "currency": "USD",
  "billing": { "currency": "USD", "method": "wallet" }
}
```

Poll [`GET /v1/video/jobs/{jobId}`](#jobs). A completed capture job carries:

```json
{
  "jobId": "0d3c1a52-8b2e-4c2a-a1f4-3c2f0a9d6b11",
  "kind": "capture",
  "status": "completed",
  "progress": 100,
  "frames": [
    { "index": 0, "t": 1.5, "actualT": 1.5, "label": "0:01.5", "sheet": 0, "x": 0, "y": 0, "w": 640, "h": 360 }
  ],
  "sheets": [ { "url": "https://.../sheet-0.jpg", "width": 1920, "height": 720 } ],
  "missing": []
}
```

- `frames` follow the order of your `times`. `t` is the time you asked for, `actualT` the time of the frame actually taken (frames are quantised to 0.25 s). `sheet` is an index into `sheets`, and `x`, `y`, `w`, `h` locate the frame's cell on that sheet.
- `sheets` are image URLs. More than 12 frames means several sheets.
- `missing` lists points (`index`, `t`) whose frame could not be extracted.

## Render

```
POST /v1/video/projects/{id}/render
```

Renders the project to a video file. It is asynchronous: the call answers `202` with a job, and you poll [the job](#jobs) until it completes.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | string | `mp4` | `mp4`, `webm`, `mov`, `gif`, `mp3` or `wav`. Case-insensitive. |
| `codec` | string | `h264` | `h264`, `h265` or `prores`. |
| `quality` | string | `standard` | `standard`, `high` or `ultra`. `draft` is accepted as an alias of `standard`, not a lower tier. |
| `resolution` | string | project size | `720p`, `1080p`, `2k` or `4k`. |
| `fps` | integer | project fps | 1 to 120. |
| `bitrate` | string | auto | For example `8M` or `4500k`. |
| `range` | object | whole timeline | `{ "in": 2.0, "out": 12.5 }`, seconds. |
| `contentCredentials` | boolean | — | Embed Content Credentials in the file. |
| `contentAiDeclared` | boolean | — | Declare AI-generated content in those credentials. |

Rendering is billed **per minute of output** (rounded up, at least one minute); `billedMinutes` in the response says how many. If the render fails you are refunded automatically. If the project changes between your request and the start of the render, you get `save-conflict` and are not charged. Render once, when the edit is finished: use lint and capture to check your work along the way.

## Jobs

```
GET /v1/video/jobs/{jobId}
```

Capture, render and Auto-Edit all return a job. Statuses: `queued`, `running`, `completed`, `failed`, `cancelled`.

```json
{
  "jobId": "5a7f0b0e-3c1d-4c0f-8a4e-0d7b1b2f9e11",
  "kind": "render",
  "projectId": "6f1c2a52-6b1e-4f0a-9d2f-1d0f1b6f7a10",
  "status": "completed",
  "progress": 100,
  "outputUrl": "https://.../render.mp4",
  "outputSize": 18432011
}
```

A running job may include `queuePosition`; a finished one may include `warnings`. A `failed` or `cancelled` job has `error` (a short, safe message), sometimes `reason`, and `refunded: true` when the charge was returned. Poll every 3 to 5 seconds; jobs are only visible to the account that started them. Download render output promptly: result URLs are temporary.

## Operations reference

`GET /v1/video/ops/catalog` returns the JSON Schema of the `ops` array (`schema`), explanatory `notes`, `ticksPerSecond` and `maxOps`. Use it to validate or generate operations. The tables below are generated from the same schema.

Insert a 3 s clip at 10 s (the media id comes from the project's `media`):

```json
{"ops": [{"op": "insertClip", "ref": "b-roll", "clip": {"type": "video", "assetId": "media-1", "duration": 18000}, "at": {"start": 60000}}]}
```

Trim 1 s off the end of a clip and ripple the following clips:

```json
{"ops": [{"op": "trimClip", "id": "clip-1", "edge": "end", "delta": -6000, "ripple": true}]}
```

<!-- BEGIN GENERATED: ops-reference (scripts/gen-ops-reference.mjs) -->

There are 22 operations. Every operation is an object with an `op` discriminator; unknown fields are rejected.

| Operation | Fields |
|---|---|
| [`addMarker`](#op-addmarker) | `marker` |
| [`addTrack`](#op-addtrack) | `index`, `kind`, `label` |
| [`addTransition`](#op-addtransition) | `alignment`, `duration`, `fromClipId`, `toClipId`, `trackId`, `type` |
| [`deleteClips`](#op-deleteclips) | `ids`, `leaveGap`, `ripple` |
| [`detachAudio`](#op-detachaudio) | `id`, `ref`, `trackLabel` |
| [`insertClip`](#op-insertclip) | `at`, `clip`, `ref`, `ripple` |
| [`insertGap`](#op-insertgap) | `at`, `duration`, `ripple` |
| [`joinClips`](#op-joinclips) | `ids` |
| [`moveClips`](#op-moveclips) | `delta`, `ids`, `targetTrackId` |
| [`moveTrack`](#op-movetrack) | `id`, `toIndex` |
| [`removeMarker`](#op-removemarker) | `id` |
| [`removeTrack`](#op-removetrack) | `id` |
| [`removeTransition`](#op-removetransition) | `id` |
| [`rollEdit`](#op-rolledit) | `delta`, `leftId` |
| [`setClipProps`](#op-setclipprops) | `id`, `patch`, `ripple` |
| [`setProjectProps`](#op-setprojectprops) | `aspectRatio`, `backgroundColor`, `fps`, `title` |
| [`setTrackProps`](#op-settrackprops) | `id`, `patch` |
| [`slipClip`](#op-slipclip) | `delta`, `id` |
| [`splitClips`](#op-splitclips) | `at`, `ids` |
| [`trimClip`](#op-trimclip) | `delta`, `edge`, `id`, `ripple` |
| [`updateMarker`](#op-updatemarker) | `id`, `patch` |
| [`updateTransition`](#op-updatetransition) | `id`, `patch` |

### addMarker {#op-addmarker}

| Field | Type | Required |
|---|---|---|
| `marker` | [MarkerInput](#shape-markerinput) | yes |

### addTrack {#op-addtrack}

| Field | Type | Required |
|---|---|---|
| `index` | integer (≥ 0) | no |
| `kind` | `"main"` \| `"overlay"` \| `"audio"` | yes |
| `label` | string | no |

### addTransition {#op-addtransition}

| Field | Type | Required |
|---|---|---|
| `alignment` | `"center"` \| `"before"` \| `"after"` | no |
| `duration` | integer (≥ 1) | yes |
| `fromClipId` | string (≤ 128 chars) | yes |
| `toClipId` | string (≤ 128 chars) | yes |
| `trackId` | string (≤ 128 chars) | yes |
| `type` | `"none"` \| `"fade"` \| `"cross-dissolve"` \| `"slide-left"` \| `"slide-right"` \| `"wipe"` \| `"zoom"` \| `"blur"` \| `"wipe-left"` \| `"wipe-up"` \| `"wipe-down"` \| `"iris"` \| `"dip-to-black"` | yes |

### deleteClips {#op-deleteclips}

| Field | Type | Required |
|---|---|---|
| `ids` | string (≤ 128 chars)[] (min 1, max 40) | yes |
| `leaveGap` | boolean | no |
| `ripple` | boolean | no |

### detachAudio {#op-detachaudio}

| Field | Type | Required |
|---|---|---|
| `id` | string (≤ 128 chars) | yes |
| `ref` | string | no |
| `trackLabel` | string (≤ 60 chars) | no |

### insertClip {#op-insertclip}

| Field | Type | Required |
|---|---|---|
| `at` | [InsertAt](#shape-insertat) | yes |
| `clip` | [NewVideoAudioClip](#shape-newvideoaudioclip) \| [NewImageClip](#shape-newimageclip) \| [NewTextClip](#shape-newtextclip) \| [NewGapClip](#shape-newgapclip) | yes |
| `ref` | string | no |
| `ripple` | boolean | no |

### insertGap {#op-insertgap}

| Field | Type | Required |
|---|---|---|
| `at` | integer (≥ 0) | yes |
| `duration` | integer (≥ 1) | yes |
| `ripple` | boolean | no |

### joinClips {#op-joinclips}

| Field | Type | Required |
|---|---|---|
| `ids` | string (≤ 128 chars)[] (min 2, max 40) | yes |

### moveClips {#op-moveclips}

| Field | Type | Required |
|---|---|---|
| `delta` | integer | yes |
| `ids` | string (≤ 128 chars)[] (min 1, max 40) | yes |
| `targetTrackId` | string (≤ 128 chars) | no |

### moveTrack {#op-movetrack}

| Field | Type | Required |
|---|---|---|
| `id` | string (≤ 128 chars) | yes |
| `toIndex` | integer (≥ 0) | yes |

### removeMarker {#op-removemarker}

| Field | Type | Required |
|---|---|---|
| `id` | string | yes |

### removeTrack {#op-removetrack}

| Field | Type | Required |
|---|---|---|
| `id` | string (≤ 128 chars) | yes |

### removeTransition {#op-removetransition}

| Field | Type | Required |
|---|---|---|
| `id` | string | yes |

### rollEdit {#op-rolledit}

| Field | Type | Required |
|---|---|---|
| `delta` | integer | yes |
| `leftId` | string (≤ 128 chars) | yes |

### setClipProps {#op-setclipprops}

| Field | Type | Required |
|---|---|---|
| `id` | string (≤ 128 chars) | yes |
| `patch` | [AllowedClipPatch](#shape-allowedclippatch) | yes |
| `ripple` | boolean | no |

### setProjectProps {#op-setprojectprops}

| Field | Type | Required |
|---|---|---|
| `aspectRatio` | `"16:9"` \| `"9:16"` \| `"1:1"` \| `"4:5"` \| `"4:3"` | no |
| `backgroundColor` | string (≤ 64 chars) | no |
| `fps` | `24` \| `25` \| `30` \| `50` \| `60` | no |
| `title` | string (≤ 200 chars) | no |

### setTrackProps {#op-settrackprops}

| Field | Type | Required |
|---|---|---|
| `id` | string (≤ 128 chars) | yes |
| `patch` | [TrackPatch](#shape-trackpatch) | yes |

### slipClip {#op-slipclip}

| Field | Type | Required |
|---|---|---|
| `delta` | integer | yes |
| `id` | string (≤ 128 chars) | yes |

### splitClips {#op-splitclips}

| Field | Type | Required |
|---|---|---|
| `at` | integer (≥ 0) | yes |
| `ids` | string (≤ 128 chars)[] (min 1, max 40) | yes |

### trimClip {#op-trimclip}

| Field | Type | Required |
|---|---|---|
| `delta` | integer | yes |
| `edge` | `"start"` \| `"end"` | yes |
| `id` | string (≤ 128 chars) | yes |
| `ripple` | boolean | no |

### updateMarker {#op-updatemarker}

| Field | Type | Required |
|---|---|---|
| `id` | string | yes |
| `patch` | [MarkerPatch](#shape-markerpatch) | yes |

### updateTransition {#op-updatetransition}

| Field | Type | Required |
|---|---|---|
| `id` | string | yes |
| `patch` | [TransitionPatch](#shape-transitionpatch) | yes |

### Shared shapes

#### AllowedClipPatch {#shape-allowedclippatch}

| Field | Type | Required |
|---|---|---|
| `animationIn` | [ClipAnimation](#shape-clipanimation) | no |
| `animationOut` | [ClipAnimation](#shape-clipanimation) | no |
| `bgColor` | string | no |
| `blendMode` | `"multiply"` \| `"screen"` \| `"darken"` \| `"lighten"` \| `"difference"` \| `"exclusion"` \| `"overlay"` \| `"soft-light"` \| `"hard-light"` \| `"color-dodge"` \| `"color-burn"` \| `"lighter"` | no |
| `captionPreset` | `"oneWord"` \| `"whisper"` \| `"cascade"` \| `"spotlight"` \| `"paper"` \| `"pop"` \| `"stark"` | no |
| `color` | string | no |
| `colorCorrection` | [ColorCorrection](#shape-colorcorrection) | no |
| `cropRegion` | [CropRegion](#shape-cropregion) | no |
| `duckAmount` | number (≥ 0, ≤ 1) | no |
| `duckUnderVoice` | boolean | no |
| `fadeIn` | integer (≥ 0) | no |
| `fadeOut` | integer (≥ 0) | no |
| `fillColor` | string | no |
| `fillGradient` | string | no |
| `filterPreset` | string | no |
| `fitMode` | `"fit"` \| `"fill"` \| `"crop"` | no |
| `fontFamily` | string | no |
| `fontSize` | number | no |
| `isReversed` | boolean | no |
| `keyframes` | [Keyframe](#shape-keyframe)[] (max 64) | no |
| `muted` | boolean | no |
| `name` | string | no |
| `opacity` | number (≥ 0, ≤ 1) | no |
| `overlayBorderRadius` | number | no |
| `overlayShape` | `"rectangle"` \| `"circle"` \| `"rounded"` | no |
| `position` | [Position](#shape-position) | no |
| `speed` | number (≥ 0.25, ≤ 4) | no |
| `text` | string | no |
| `textStyle` | [TextStyle](#shape-textstyle) | no |
| `transform` | [Transform](#shape-transform) | no |
| `transitionIn` | [ClipTransition](#shape-cliptransition) | no |
| `transitionOut` | [ClipTransition](#shape-cliptransition) | no |
| `volume` | number (≥ 0, ≤ 2) | no |
| `words` | [Word](#shape-word)[] | no |

#### ClipAnimation {#shape-clipanimation}

| Field | Type | Required |
|---|---|---|
| `duration` | integer (≥ 0) | yes |
| `type` | `"none"` \| `"fade"` \| `"slide-up"` \| `"slide-down"` \| `"slide-left"` \| `"slide-right"` \| `"scale"` \| `"bounce"` \| `"typewriter"` \| `"blur"` \| `"rotate"` \| `"zoom"` \| `"pan"` | yes |

#### ClipTransition {#shape-cliptransition}

| Field | Type | Required |
|---|---|---|
| `duration` | integer (≥ 0) | yes |
| `type` | `"none"` \| `"fade"` \| `"cross-dissolve"` \| `"slide-left"` \| `"slide-right"` \| `"wipe"` \| `"zoom"` \| `"blur"` \| `"wipe-left"` \| `"wipe-up"` \| `"wipe-down"` \| `"iris"` \| `"dip-to-black"` | yes |

#### ColorCorrection {#shape-colorcorrection}

| Field | Type | Required |
|---|---|---|
| `brightness` | number | no |
| `contrast` | number | no |
| `exposure` | number | no |
| `gamma` | number | no |
| `hue` | number | no |
| `saturation` | number | no |
| `sharpen` | number | no |
| `temperature` | number | no |
| `vignette` | number | no |

#### CropRegion {#shape-cropregion}

| Field | Type | Required |
|---|---|---|
| `h` | number | yes |
| `w` | number | yes |
| `x` | number | yes |
| `y` | number | yes |

#### InsertAt {#shape-insertat}

| Field | Type | Required |
|---|---|---|
| `start` | integer (≥ 0) | no |
| `trackId` | string (≤ 128 chars) | no |

#### Keyframe {#shape-keyframe}

| Field | Type | Required |
|---|---|---|
| `autoEdit` | string (≤ 40 chars) | no |
| `easing` | `"linear"` \| `"easeIn"` \| `"easeOut"` \| `"easeInOut"` | no |
| `id` | string (≤ 64 chars) | yes |
| `prop` | `"x"` \| `"y"` \| `"scale"` \| `"rotation"` \| `"opacity"` \| `"volume"` \| `"cropX"` \| `"cropY"` \| `"cropW"` \| `"cropH"` \| `"maskCenterX"` \| `"maskCenterY"` \| `"maskWidth"` \| `"maskHeight"` \| `"colorBrightness"` \| `"colorContrast"` | yes |
| `time` | integer (≥ 0) | yes |
| `value` | number | yes |

#### MarkerInput {#shape-markerinput}

| Field | Type | Required |
|---|---|---|
| `color` | string | yes |
| `label` | string | yes |
| `time` | integer (≥ 0) | yes |

#### MarkerPatch {#shape-markerpatch}

| Field | Type | Required |
|---|---|---|
| `color` | string | no |
| `label` | string | no |
| `time` | integer (≥ 0) | no |

#### NewGapClip {#shape-newgapclip}

| Field | Type | Required |
|---|---|---|
| `duration` | integer (≥ 1) | yes |
| `type` | `"gap"` | yes |

#### NewImageClip {#shape-newimageclip}

| Field | Type | Required |
|---|---|---|
| `assetId` | string | yes |
| `autoEdit` | string (≤ 40 chars) | no |
| `duration` | integer (≥ 1) | yes |
| `name` | string | no |
| `props` | [AllowedClipPatch](#shape-allowedclippatch) | no |
| `type` | `"image"` | yes |

#### NewTextClip {#shape-newtextclip}

| Field | Type | Required |
|---|---|---|
| `autoEdit` | string (≤ 40 chars) | no |
| `duration` | integer (≥ 1) | yes |
| `preset` | `"plain"` \| `"karaoke"` \| `"box"` \| `"outline"` | no |
| `props` | [AllowedClipPatch](#shape-allowedclippatch) | no |
| `text` | string | yes |
| `type` | `"text"` | yes |

#### NewVideoAudioClip {#shape-newvideoaudioclip}

| Field | Type | Required |
|---|---|---|
| `assetId` | string | yes |
| `autoEdit` | string (≤ 40 chars) | no |
| `duration` | integer (≥ 1) | yes |
| `name` | string | no |
| `props` | [AllowedClipPatch](#shape-allowedclippatch) | no |
| `sourceIn` | integer (≥ 0) | no |
| `speed` | number (≥ 0.25, ≤ 4) | no |
| `type` | `"video"` \| `"audio"` | yes |

#### Position {#shape-position}

| Field | Type | Required |
|---|---|---|
| `x` | number | yes |
| `y` | number | yes |

#### TextStyle {#shape-textstyle}

| Field | Type | Required |
|---|---|---|
| `align` | `"left"` \| `"center"` \| `"right"` | no |
| `backgroundColor` | string | no |
| `bold` | boolean | no |
| `color` | string | no |
| `fontFamily` | string | no |
| `fontSize` | number | no |
| `fontWeight` | string \| integer | no |
| `italic` | boolean | no |
| `letterSpacing` | number | no |
| `lineHeight` | number | no |
| `opacity` | number | no |
| `shadow` | boolean | no |
| `strokeColor` | string | no |
| `strokeWidth` | number | no |
| `textShadow` | string | no |
| `underline` | boolean | no |

#### TrackPatch {#shape-trackpatch}

| Field | Type | Required |
|---|---|---|
| `height` | integer (≥ 24, ≤ 200) | no |
| `label` | string | no |
| `locked` | boolean | no |
| `muted` | boolean | no |
| `solo` | boolean | no |
| `visible` | boolean | no |
| `volume` | number (≥ 0, ≤ 2) | no |

#### Transform {#shape-transform}

| Field | Type | Required |
|---|---|---|
| `rotation` | number | yes |
| `scale` | number (> 0) | yes |
| `scaleY` | number (> 0) | no |
| `x` | number | yes |
| `y` | number | yes |

#### TransitionPatch {#shape-transitionpatch}

| Field | Type | Required |
|---|---|---|
| `alignment` | `"center"` \| `"before"` \| `"after"` | no |
| `duration` | integer (≥ 1) | no |
| `type` | `"none"` \| `"fade"` \| `"cross-dissolve"` \| `"slide-left"` \| `"slide-right"` \| `"wipe"` \| `"zoom"` \| `"blur"` \| `"wipe-left"` \| `"wipe-up"` \| `"wipe-down"` \| `"iris"` \| `"dip-to-black"` | no |

#### Word {#shape-word}

| Field | Type | Required |
|---|---|---|
| `end` | integer (≥ 0) | yes |
| `start` | integer (≥ 0) | yes |
| `text` | string | yes |

<!-- END GENERATED: ops-reference -->

---

## Analysis endpoints

Analysis endpoints (files up to 512 MB) read a media file and return timings you can turn into operations. Each takes a source: **either** `url` (public HTTPS) **or** both `projectId` and `mediaId` (a media item of one of your projects). They are billed per call (the `billing` block of the response shows the amount); a call that fails is refunded.

### Detect scenes

```
POST /v1/video/detect-scenes
```

Optional `threshold` (0 to 1, default `0.4`; lower finds more cuts) and `minSceneDuration` (seconds, default `0.5`). Returns `cuts` (times in seconds) and `duration`.

### Detect silence

```
POST /v1/video/detect-silence
```

Optional `noiseFloorDb` (-120 to 0, default `-30`) and `minSilenceDuration` (seconds, default `0.3`). Returns `ranges` (each with a start and end in seconds), `totalSilentDuration` and `duration`.

### Detect beats

```
POST /v1/video/detect-beats
```

Returns `beats` (times in seconds), `bpm`, `confident` and `duration`.

The three `detect-*` endpoints share one rate-limit bucket of 20 calls per minute.

### Transcribe

```
POST /v1/video/transcribe
GET  /v1/video/transcribe/{jobId}
```

Body: the source, plus optional `language` (`auto` by default, or an ISO code such as `en`, `pl`, `de`) and `hotwords` (up to 50 names or terms, each up to 64 characters, to favour). The start call answers with a job:

```json
{ "jobId": "tr_8f2c1d9a", "status": "queued", "currency": "USD", "billing": { "currency": "USD", "method": "wallet" } }
```

Poll the `GET` route (every 3 seconds is fine) until `status` is `completed`. The `result` holds the transcript: `segments` with `start`, `end`, `text` and per-word timings in **seconds**. A word whose timing is marked `estimated` was interpolated; do not cut on it. Statuses are `queued`, `processing`, `completed` and `failed`. A failed job carries `errorKind` (`media`, `unavailable`, `failed`, `expired` or `timeout`), a readable `errorMessage`, and `refunded`.

Convert seconds to ticks (`seconds * 6000`) when you feed analysis results into operations.

---

## A complete loop

Create a project from a clip, put a title on it, check, look, render.

::: code-group

```bash [cURL]
API=https://apis.fotohub.app
AUTH="Authorization: Bearer fh_live_your_api_key"

# 1. Create
PROJECT=$(curl -s -X POST "$API/v1/video/projects" -H "$AUTH" -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -d '{"title":"Launch teaser","aspect":"16:9","media":[{"url":"https://example.com/clip.mp4"}]}')
ID=$(echo "$PROJECT" | jq -r .projectId)
echo "$PROJECT" | jq -r .editorUrl

# 2. Apply operations: trim the first second off the start of the first clip
CLIP=$(echo "$PROJECT" | jq -r '.digest.clips[0].id')
curl -s -X POST "$API/v1/video/projects/$ID/ops" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"expectedSaveRev\":1,\"ops\":[{\"op\":\"trimClip\",\"id\":\"$CLIP\",\"edge\":\"start\",\"delta\":6000,\"ripple\":true}]}"

# 3. Lint
curl -s -X POST "$API/v1/video/projects/$ID/lint" -H "$AUTH" -H "Content-Type: application/json" -d '{}'

# 4. Capture three frames and poll the job
JOB=$(curl -s -X POST "$API/v1/video/projects/$ID/capture" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"count":3,"width":640}' | jq -r .jobId)
curl -s "$API/v1/video/jobs/$JOB" -H "$AUTH"

# 5. Render
RENDER=$(curl -s -X POST "$API/v1/video/projects/$ID/render" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"format":"mp4","quality":"high","resolution":"1080p"}' | jq -r .jobId)
curl -s "$API/v1/video/jobs/$RENDER" -H "$AUTH"
```

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# 1. Create
project = client.create_video_project(
    title="Launch teaser",
    aspect="16:9",
    media=[{"url": "https://example.com/clip.mp4"}],
)
project_id = project["projectId"]
print(project["editorUrl"], project["unplacedMedia"])

# 2. Apply operations. Ticks: 6000 per second.
clip_id = project["digest"]["clips"][0]["id"]
result = client.apply_video_ops(
    project_id,
    [{"op": "trimClip", "id": clip_id, "edge": "start", "delta": 6000, "ripple": True}],
    expected_save_rev=project["saveRev"],
    label="Trim intro",
)
if result["rolledBack"]:
    print(result["violations"])
elif result["rejected"]:
    print([r for r in result["results"] if not r["ok"]])

# 3. Lint
print(client.lint_video_project(project_id))

# 4. Capture and wait for the finished job
capture = client.capture_video_project(project_id, count=3, wait=True)
print(capture["sheets"][0]["url"], capture["frames"][0])

# 5. Render (billed per output minute)
render = client.render_video_project(project_id, format="mp4", resolution="1080p", wait=True)
print(render["outputUrl"])
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

// 1. Create
const project = await client.createVideoProject({
  title: "Launch teaser",
  aspect: "16:9",
  media: [{ url: "https://example.com/clip.mp4" }],
});
console.log(project.editorUrl, project.unplacedMedia);

// 2. Apply operations. Ticks: 6000 per second.
const clipId = project.digest.clips[0].id;
const result = await client.applyVideoOps(project.projectId, {
  ops: [{ op: "trimClip", id: clipId, edge: "start", delta: 6000, ripple: true }],
  expectedSaveRev: project.saveRev,
  label: "Trim intro",
});
if (result.rolledBack) console.log(result.violations);

// 3. Lint
console.log(await client.lintVideoProject(project.projectId));

// 4. Capture and wait for the finished job
const capture = await client.captureVideoProject(project.projectId, { count: 3, wait: true });
console.log(capture.sheets?.[0].url, capture.frames?.[0]);

// 5. Render (billed per output minute)
const render = await client.renderVideoProject(project.projectId, {
  format: "mp4",
  resolution: "1080p",
  wait: true,
});
console.log(render.outputUrl);
```

:::

Analysis examples:

::: code-group

```python [Python]
cuts = client.detect_video_scenes(url="https://example.com/clip.mp4", threshold=0.4)
job = client.transcribe_video(project_id=project_id, media_id="media-1", language="auto")
transcript = client.get_video_transcription(job["jobId"])
```

```typescript [TypeScript]
const cuts = await client.detectVideoScenes({ url: "https://example.com/clip.mp4", threshold: 0.4 });
const job = await client.transcribeVideo({ projectId: project.projectId, mediaId: "media-1", language: "auto" });
const transcript = await client.getVideoTranscription(job.jobId!);
```

:::

## SDKs

| Operation | Python (`pip install fotohub`) | TypeScript (`npm install fotohub`) |
|-----------|-------------------------------|------------------------------------|
| Create | `create_video_project` | `createVideoProject` |
| List / get / delete | `list_video_projects`, `get_video_project`, `delete_video_project` | `listVideoProjects`, `getVideoProject`, `deleteVideoProject` |
| Apply operations | `apply_video_ops(project_id, ops, dry_run=, expected_save_rev=, label=, note=)` | `applyVideoOps(projectId, { ops, dryRun, expectedSaveRev, label, note })` |
| Digest / lint | `digest_video_project`, `lint_video_project` | `digestVideoProject`, `lintVideoProject` |
| Capture | `capture_video_project(project_id, times= / count= / cuts=, width=, sheet=, wait=)` | `captureVideoProject(projectId, { times / count / cuts, width, sheet, wait })` |
| Render | `render_video_project(project_id, format=, quality=, resolution=, codec=, fps=, bitrate=, time_range=, wait=)` | `renderVideoProject(projectId, { format, quality, resolution, codec, fps, bitrate, range, wait })` |
| Auto-Edit | `auto_edit_video_project(project_id, style=, mode=, toggles=, language=, aspect=, ai_budget_usd=, auto_apply=, brief=, wait=)`, `apply_video_auto_edit(project_id, job_id, expected_save_rev=)` | `autoEditVideoProject(projectId, { style, mode, toggles, language, aspect, aiBudgetUsd, autoApply, brief, wait })`, `applyVideoAutoEdit(projectId, jobId, { expectedSaveRev })` |
| Jobs | `get_video_job`, `wait_for_video_job` | `getVideoJob`, `waitForVideoJob` |
| Catalog | `get_video_ops_catalog` | `getVideoOpsCatalog` |
| Analysis | `detect_video_scenes`, `detect_video_silence`, `detect_video_beats`, `transcribe_video`, `get_video_transcription` | `detectVideoScenes`, `detectVideoSilence`, `detectVideoBeats`, `transcribeVideo`, `getVideoTranscription` |

The Python `AsyncFotoHub` client has the same methods. The SDKs send an idempotency key for you where it is safe. Python's `render_video_project` defaults `quality` to `high` and `capture_video_project` defaults `width` to 640; the API itself defaults to `standard` quality.

With `wait=True` (`wait: true`) capture, render and Auto-Edit return the finished job. A job that ends `failed` or `cancelled` raises an exception:

- **Python** raises `VideoJobFailedError` with `job_id`, `reason` and `refunded` attributes; its `code` is the job's `code`, when it has one. Waiting past `max_wait` raises `VideoJobTimeoutError`.
- **TypeScript** raises `JobFailedError`, whose `code` is the job's `reason` (or `job_failed`) and whose `details.refunded` says whether the charge was returned. Waiting past `maxWaitMs` raises `JobTimeoutError`.

A timeout does not stop the job: keep polling it with `get_video_job` / `getVideoJob`.

## MCP tools

The [FOTOhub MCP server](/api/mcp) exposes the same workflow to AI agents as **13 tools**. Whether they appear is decided per deployment, not per account: they are switched on together with the Video Timeline API, and `video_auto_edit` has a second switch of its own. Without Auto-Edit the server lists 12 tools; with it, 13. If your client shows no `video_*` tools, the deployment you are connected to has not enabled them.

| Tool | Does |
|------|------|
| `video_project_create` | Create a project (media, aspect, template); returns `editorUrl`. |
| `video_project_get` | Get a project's digest and media, or list projects when no id is given. |
| `video_ops_catalog` | The operation schema and notes. |
| `video_apply_edit` | Apply a batch of operations. |
| `video_lint` | Lint the edit. |
| `video_capture` | Frames and contact sheets (flat fee). |
| `video_render` | Render the final file (per minute); returns a job. |
| `video_job_status` | Poll a capture, render or Auto-Edit job. |
| `video_auto_edit` | Start an Auto-Edit run (the 13th tool; it has its own switch). |
| `video_detect_scenes`, `video_detect_silence`, `video_detect_beats` | Analysis. |
| `video_transcribe` | Word-level transcript in seconds. |

The `fotohub-video-editor` skill is enabled by the same switch as the tools. Together with it, the tools give an agent the working loop: analyse footage, apply operations, lint, capture, fix, and render only when the edit is done. See [Edit video with an agent](/guides/edit-video-with-an-agent).

## Flows nodes

Two nodes bring the API into [Flows](/api/agents):

- **Timeline Edit** (`fotohub.video.timeline_edit`) applies a batch of operations (up to 40) to a project, with an optional dry run. If the batch is rolled back, or no operation is accepted (`ok` is `false`), the node leaves through its error port rather than reporting success. It outputs the new `saveRev` and the refs of created clips.
- **Render Timeline** (`fotohub.video.render_timeline`) renders a project as your own account, optionally applying operations first, and either waits and returns the file URL or returns the job id for a later step.

Both call the public API with your account, so the billing and limits above apply.

---

## Auto-Edit

Auto-Edit lets FOTOhub edit a project for you, the same way it does in the editor: it analyses the footage, cuts, adds captions, b-roll and audio, and checks its own result before it finishes. It runs as a background job.

### Start a run

```
POST /v1/video/projects/{id}/auto-edit
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mode` | string | `auto_edit` | `auto_edit` for a full edit, or `cut` for a cut proposal only. |
| `style` | string | — | `viral`, `podcast`, `explainer`, `storytelling` or `captions-only`. Required for `auto_edit`. |
| `toggles` | object | all on | Switch parts of the edit off with `false`: `cutSilences`, `removeFillers`, `broll`, `zooms`, `graphics`, `sfx`, `music`, `captions`, `maps`. |
| `language` | string | `auto` | Spoken language: `auto`, `pl`, `en` or `de`. |
| `aspect` | string | project aspect | `16:9`, `9:16`, `1:1` or `4:5`. |
| `aiBudgetUsd` | number | `0` | The most this run may spend on generated media, in USD, 0 to 50. `0` uses stock and existing media only. |
| `autoApply` | boolean | `true` | `false` keeps the result as a draft until you call `apply`. |
| `brief` | object | — | `cut` mode only, and required there: the cut brief (for example profile, target length, pacing, order). |

The project needs at least one video or audio media file. Send an `X-Idempotency-Key` to make a retry safe: within 24 hours the same key returns the first result instead of starting, and charging for, a second run.

```json
{
  "jobId": "a3b1c4d2-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  "status": "running",
  "projectId": "6f1c2a52-6b1e-4f0a-9d2f-1d0f1b6f7a10",
  "currency": "USD",
  "billing": { "currency": "USD", "method": "wallet" }
}
```

The call answers `202`. Poll [`GET /v1/video/jobs/{jobId}`](#jobs) every 3 to 5 seconds.

### Job status

An Auto-Edit job has `"kind": "auto_edit"` and the [usual job fields](#jobs), plus:

| Field | Meaning |
|-------|---------|
| `stages` | Progress by stage, in order: `signals`, `cuts`, `brief`, `broll`, `graphics`, `audio`, `captions`, `apply`. Each entry has `stage`, `status` and, when known, `pct` and `detail`. |
| `report` | What the run did and what it skipped, including the media spend (`creditsSpent`) and whether the result was committed. |
| `usage` | AI usage: `inputTokens`, `cacheReadTokens`, `cacheWriteTokens`, `outputTokens` and `billed`. Once billed it also has `units` and what was charged (`chargedUsd`, `chargedCredits`). |
| `committed` | `true` when the result was written to the project. |
| `saveRev` | The project's new revision after the result was committed. |
| `baseSaveRev` | The revision the run started from. |
| `expiresInSeconds` | On a finished `autoApply: false` run, how long the draft is kept (about 30 minutes from creation). |
| `refunded` | On a `failed` or `cancelled` job: `true` when the base fee was returned. |

Nothing is left half-edited: if the run's own operations are rejected, the draft is discarded instead of being applied to your project.

### Apply a draft

With `autoApply: false`, a finished run keeps its result as a draft. Review it, then commit it:

```
POST /v1/video/projects/{id}/auto-edit/{jobId}/apply
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `expectedSaveRev` | integer | No | The project revision the draft may replace. Defaults to the revision the run started from. |

On success it answers `{ "jobId", "projectId", "committed": true, "saveRev" }`, with the new `digest` when the project changed. If the project changed since the run started, you get `409 save-conflict` with `details.currentSaveRev`, and the draft is kept: re-run, or pass the current `expectedSaveRev` if you accept the changes over the draft. Applying before the run has finished answers `409 job-running`; applying a run with no draft answers `409 no-draft`.

### Billing

An Auto-Edit run is billed in three parts:

1. **A base fee per run**, charged when the run starts. It is refunded if the run fails or is cancelled, and when the run cannot be started.
2. **AI usage**, billed by tokens after the run. Tokens used by a run that fails are still billed, because the work was done.
3. **Generated media**, billed as usual at each model's rate and capped by `aiBudgetUsd`. It is not refunded with the base fee.

The `billing` block of the start response shows the base fee charged, and the finished job's `usage` shows what AI usage cost. The amounts charged are in the `billing` block of the start response and in the finished job. On the FOTOhub account (OAuth) it uses your plan credits first and then the wallet, as everywhere else; it requires a paid plan there (`plan-required` otherwise). It is limited to 10 requests per minute and its self-check uses the same hourly capture allowance as [Capture](#capture).

### Examples

::: code-group

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_...")

job = client.auto_edit_video_project(
    project_id,
    style="podcast",
    language="en",
    ai_budget_usd=0,
    auto_apply=False,
    wait=True,
)
print(job["report"])

# Happy with it? Commit the draft.
client.apply_video_auto_edit(project_id, job["jobId"], expected_save_rev=job["baseSaveRev"])
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_..." });

const job = await client.autoEditVideoProject(projectId, {
  style: "podcast",
  language: "en",
  aiBudgetUsd: 0,
  autoApply: false,
  wait: true,
});
console.log(job.report);

// Happy with it? Commit the draft.
await client.applyVideoAutoEdit(projectId, job.jobId, { expectedSaveRev: job.baseSaveRev });
```

```bash [curl]
curl -s -X POST "$API/v1/video/projects/$ID/auto-edit" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{ "style": "podcast", "language": "en", "autoApply": false }'

curl -s -X POST "$API/v1/video/projects/$ID/auto-edit/$JOB/apply" \
  -H "$AUTH" -H "Content-Type: application/json" -d '{}'
```

:::

The SDK methods are marked experimental. The MCP tool is `video_auto_edit`.
