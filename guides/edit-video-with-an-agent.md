# Edit Video with an Agent

Let an AI agent cut a video for you: it analyses your footage, edits a real project through the [Video Timeline API](/api/video-timeline), looks at the result, and hands you a project that opens in the FOTOhub editor. This guide connects an agent through MCP and shows a working session.

## What you need

- A FOTOhub account and an [API key](/api/authentication), or OAuth sign-in from your MCP client.
- An MCP client such as Claude Desktop, Claude Code or Cursor, connected to the FOTOhub MCP server (see [MCP Integration](/guides/mcp-integration)).
- Footage at public HTTPS URLs, or files already in your FOTOhub storage.

## 1. Connect the MCP server

Add FOTOhub to your client:

```json
{
  "mcpServers": {
    "fotohub": {
      "url": "https://apis.fotohub.app/mcp/",
      "headers": { "Authorization": "Bearer fh_live_your_api_key" }
    }
  }
}
```

When the Video Timeline API is enabled on the FOTOhub deployment you connect to (a deployment-wide setting, not per account), the client lists the timeline tools: `video_project_create`, `video_project_get`, `video_ops_catalog`, `video_apply_edit`, `video_lint`, `video_capture`, `video_render`, `video_job_status`, the analysis tools (`video_detect_scenes`, `video_detect_silence`, `video_detect_beats`, `video_transcribe`) and, when Auto-Edit is also enabled, `video_auto_edit`: 12 tools without it, 13 with it. See [MCP tools](/api/video-timeline#mcp-tools) for what each does.

## 2. Add the video editor skill

FOTOhub ships a `fotohub-video-editor` skill for the MCP server. It teaches the agent the working method so you do not have to: analyse first, apply operations in small batches, lint, capture to look at the result, and render only at the end. Ask your client to load it, or reference it in your first message: "Use the fotohub-video-editor skill."

The method matters because rendering costs time and money, while lint is free and capture is cheap. An agent that checks its work with lint and capture and renders once will finish faster and cheaper than one that renders to see what it did.

## 3. Ask for an edit

A prompt that works well names the source, the goal, the format and the length:

> Take https://example.com/interview.mp4 and make a 45-second vertical cut for social media. Remove the silences, keep the strongest answer, and add captions. Show me contact sheets before you render, and give me the editor link.

What the agent does with that:

1. **Creates a project** with `video_project_create` (aspect `9:16`) and reads the media ids and the `editorUrl` from the reply.
2. **Analyses the footage** with `video_transcribe` and `video_detect_silence`. Times come back in seconds.
3. **Reads the operation catalog** with `video_ops_catalog`, then **edits** with `video_apply_edit`: splitting, trimming and deleting clips, adding text. Timeline values are in ticks (6000 per second), so it converts seconds to ticks. It passes `expectedSaveRev` so a change you make in the editor at the same moment is never overwritten silently.
4. **Checks its work** with `video_lint` (free), then `video_capture` with `cuts: true` to see one frame from the middle of each shot on a contact sheet.
5. **Fixes** what it saw and captures again.
6. **Renders** once with `video_render`, polls `video_job_status`, and returns the file URL together with the `editorUrl`.

## 4. Take over in the editor

Open the `editorUrl` from the reply. The project is the same document the editor uses, so everything the agent did is editable by hand: move a clip, restyle a caption, then render from the editor as usual. If you and the agent edit at the same time, the agent's next save is rejected with `save-conflict` rather than overwriting your changes, and it re-reads the project and continues.

## Without MCP: the same loop in code

The tools map one to one onto the API and the SDKs, so a script can do the same. This Python script creates a project, trims leading silence found by analysis, and checks the result:

```python
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")
TPS = 6000  # ticks per second

project = client.create_video_project(
    title="Interview cut",
    aspect="9:16",
    media=[{"url": "https://example.com/interview.mp4"}],
)
pid = project["projectId"]
media_id = project["media"][0]["assetId"]
clip_id = project["digest"]["clips"][0]["id"]

# Analysis results are in seconds; operations take ticks.
silence = client.detect_video_silence(project_id=pid, media_id=media_id, min_silence_duration=0.6)
first = silence["ranges"][0] if silence["ranges"] else None
if first and first["start"] < 0.1:
    result = client.apply_video_ops(
        pid,
        [{"op": "trimClip", "id": clip_id, "edge": "start", "delta": int(first["end"] * TPS), "ripple": True}],
        expected_save_rev=project["saveRev"],
        label="Trim leading silence",
    )
    print(result["accepted"], "accepted,", result["rejected"], "rejected")

print(client.lint_video_project(pid))
sheets = client.capture_video_project(pid, cuts=True, wait=True)
print([s["url"] for s in sheets["sheets"]])
print(project["editorUrl"])
```

The same steps in TypeScript use `detectVideoSilence`, `applyVideoOps`, `lintVideoProject` and `captureVideoProject`. For an image in the project (a title card or a cover), generate it with the [Image Generation API](/api/image-generation) and `seedream-5-0-260128`, then pass its URL in `media` when you create the project.

## Costs and safety

- Creating projects, applying operations, linting and reading state are free.
- Capture is a flat fee per call; rendering is billed per minute of output; analysis is billed per call. The `billing` block of each response shows the amount charged; a render on a plan that includes it is not charged. Failed capture, render and analysis jobs are refunded automatically.
- Give the agent a bounded task. Capture is limited to 20 calls per hour per account, and every response carries a `Retry-After` header when a limit is hit.
- Send an `X-Idempotency-Key` on calls the agent might repeat, so a retry never creates a second project or a second charge.

## Next steps

- [Video Timeline API](/api/video-timeline): every endpoint, error code and operation.
- [MCP Integration](/guides/mcp-integration): connecting clients and OAuth.
- [Agent Workflows](/api/agents): run timeline edits as part of a Flow.
