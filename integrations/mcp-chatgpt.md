# FOTOhub in ChatGPT

FOTOhub is published in the ChatGPT app directory. Turn it on once and ChatGPT
can generate and edit images, video, speech, music and 3D on FOTOhub's own GPUs,
show the results inline in the conversation, and tell you what each one cost.

## Turn it on

1. Open ChatGPT → **Settings → Apps & Connectors** (or the **+** menu in the
   composer → **Apps**).
2. Search for **FOTOhub** and enable it.
3. ChatGPT opens a FOTOhub sign-in page. Approve it.

That is the whole setup. You do not paste an API key and you do not copy a
server URL — signing in *is* the credential step, and it is what makes the
billing behave correctly (see below).

::: tip Prefer to connect it by URL?
You can add it as a custom connector instead, pointing at
`https://apis.fotohub.app/mcp/`. Same server, same 57 tools. The directory app
is easier and gets you the inline widgets and starter prompts; the manual route
is there if your workspace restricts directory apps.
:::

## What ChatGPT can do once it is connected

| Area | Examples |
|---|---|
| **Images** | Generate, edit, inpaint, remove or replace a background, add a shadow, upscale, denoise, restore faces, style transfer, depth map, analyse |
| **Video** | Text-to-video, image-to-video, extend a clip, multi-scene story, burn subtitles, upscale, transcode, watermark, retime |
| **Audio** | Speech from text, music, sound effects, transcription |
| **3D** | Textured mesh from a prompt or a photo, in GLB / OBJ / STL / USDZ |
| **Money** | Price a job *before* running it, estimate a batch, compare models, check balance, list transactions |
| **Your library** | Search your photos, list past generations, save a result to your own bucket, get a fresh download link |

Three good first prompts, the same three shown on the app's directory page:

> Turn my product photo into a clean white-background listing image

> Make a 5-second vertical clip of my product for Reels, with captions

> What would a 10-second 1080p video cost me, and what's my balance?

The third one is worth trying first. Quoting is free and takes nothing from your
account, so it is a safe way to see how the app behaves before it spends
anything.

## Results appear in the chat, not as a link dump

FOTOhub ships three inline widgets, so certain answers render as a component
rather than a wall of text:

| Widget | Used by |
|---|---|
| **Gallery** | `generate_image`, `edit_image`, `inpaint_image`, `style_transfer`, `remove_background`, `replace_background`, `blur_background`, `add_shadow`, `enhance_image`, `denoise_image`, `restore_faces`, `depth_map`, `list_generations` |
| **Player** | `generate_video`, `image_to_video`, `extend_video`, `generate_story`, `add_subtitles`, `upscale_video`, `transcode_video`, `add_watermark`, `change_video_speed`, `text_to_speech`, `generate_music`, `generate_sfx`, `get_job_status` |
| **Price table** | `compare_prices` |

The plain-text answer is always sent alongside the widget, so nothing is lost if
your client does not render it.

`upscale_image` deliberately has no gallery: it runs through an image route that
answers with base64 rather than a URL, and pushing a multi-megabyte data URI
through the transport on every call would cost more than the picture is worth.

## Skills come with the app

Four workflow skills are served by the FOTOhub server itself, so ChatGPT picks
up the right sequence of calls without you explaining it:

| Skill | When it applies |
|---|---|
| `fotohub-generation-basics` | Any make / edit / price request. Choosing a real model id, quoting first, reading the billing line, polling async jobs, rescuing links before they expire. |
| `fotohub-product-photography` | A product photo turned into sellable imagery — cut-out, background, shadow, finishing, in the right order. |
| `fotohub-short-video-ad` | A short promo or social video: write the shot, run the async job, then add voice, music and subtitles in the correct order. |
| `fotohub-brand-kit` | A consistent *set* of assets rather than one file — holding a style across calls and sizing per platform. |

## How you are billed

This is the part worth reading before you generate anything expensive.

When you connect through the directory app (or any OAuth sign-in), FOTOhub mints
a key marked `credits_first`. That means:

1. Your **subscription credits** are spent first.
2. When they run out, the **prepaid USD wallet** takes over.
3. A single call can be split across both.

A raw `fh_live_*` API key behaves differently — it only ever spends the USD
wallet. So the same prompt can settle differently depending on how you
connected.

Every result states what was actually charged and what is left. Report that
figure rather than an estimate; it is the one the ledger recorded.

::: warning Generated links expire
Results come back as signed URLs that stop working after about an hour. If you
want to keep something, ask FOTOhub to save it to your storage while the link is
fresh — `save_to_storage` copies it into your own bucket, and
`get_download_link` mints a new link for it later.
:::

## Long jobs

Video and 3D are asynchronous: the first call returns a `job_id`, and ChatGPT
polls `get_job_status` until it is done. A 10-second clip is typically a minute
or two. You can keep talking while it runs; ask for the status and it will check.

## Three tools you will not see

The server defines 60 tools and registers 57. These three are switched off
because the service behind them is not deployed, and a tool that appears and
then fails is worse than one that is absent:

- `generate_shorts`
- `create_training_job`
- `get_training_status`

Two more are registered but **inert** — `voice_clone` and `separate_stems`
answer with a "not yet available" message rather than doing the work. Both
capabilities exist in the FOTOhub web app; neither has a public endpoint behind
it yet.

## If something goes wrong

| Symptom | Cause |
|---|---|
| "Insufficient funds" | Credits and wallet are both empty. Top up at [fotohub.app/console](https://fotohub.app/console). |
| A tool is missing | It is one of the three gated tools above. |
| A result link 404s | The signed URL expired. Re-generate, or use `get_download_link` if it was saved. |
| Sign-in loops | Sign out of the app in **Settings → Apps & Connectors** and reconnect. |

## Next

[MCP overview](/integrations/mcp) ·
[FOTOhub in Claude](/integrations/mcp-claude) ·
[MCP protocol reference](/api/mcp)
