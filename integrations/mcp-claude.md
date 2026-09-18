# FOTOhub in Claude

FOTOhub is not listed in Anthropic's connector directory, so you add it yourself
as a **custom connector**. It takes one URL and a sign-in, and it works across
Claude on the web, Claude Desktop and Claude Code.

## Add it as a custom connector

1. Open Claude → **Settings → Connectors**.
2. Choose **Add custom connector**.
3. Paste the server URL:

```
https://apis.fotohub.app/mcp/
```

4. Claude discovers the FOTOhub authorisation server and opens a sign-in page.
   Approve it.

There is no API key to paste. Claude registers itself automatically — the server
supports OAuth 2.1 dynamic client registration, so no one has to pre-create a
client ID for your workspace.

::: info The dedicated hostname works too
`https://mcp.fotohub.app/` resolves to the same service. Use whichever your
network policy prefers; they are interchangeable.
:::

Custom connectors are a paid-plan feature on Anthropic's side. If **Add custom
connector** is not offered in your Settings, that is a plan or workspace-policy
limit, not a FOTOhub one — the stdio route below still works.

## Claude Code

From a terminal:

```bash
claude mcp add --transport http fotohub https://apis.fotohub.app/mcp/
```

Then run `/mcp` inside Claude Code and authenticate. Once connected, the 57
FOTOhub tools are available to the agent like any other tool — which makes
"generate the hero image for this landing page and drop it in `public/`" a
single instruction rather than a context switch.

## Claude Desktop with a local stdio server

If you would rather not go over the network at all, the server also speaks
stdio. Point Claude Desktop at a local checkout:

```json
{
  "mcpServers": {
    "fotohub": {
      "command": "python",
      "args": ["main.py", "--stdio"],
      "cwd": "/path/to/server/mcp-server",
      "env": { "FOTOHUB_API_KEY": "fh_live_your_key" }
    }
  }
}
```

This path uses a raw API key rather than OAuth, which changes how you are
billed — see below.

## What Claude can do with it

The same 57 tools the rest of the platform exposes: image generation and the
eleven editing operations, video generation and post-production, speech, music,
sound effects, transcription, textured 3D, UGC ad projects, your photo library,
storage, and the pricing tools.

Four workflow skills ride along with the server, so Claude gets the *sequence*
right rather than just the tool list — the cut-out-then-background-then-shadow
order for product shots, the write-the-shot-then-render order for video ads, and
the quote-before-you-spend habit for anything billable.

Claude renders FOTOhub's answers as text and links. The inline widgets the
server publishes are drawn by hosts that implement the MCP Apps UI extension;
Claude shows the text block, which is always sent alongside, so nothing is
missing — it just is not a gallery component.

## How you are billed

It depends on how you connected, and the difference is real money:

| Connection | Settles against |
|---|---|
| Custom connector / Claude Code (OAuth sign-in) | **Subscription credits first**, then the prepaid USD wallet. A single call can be split across both. |
| Local stdio with `FOTOHUB_API_KEY` | The prepaid USD wallet only. |

Every tool result states what was charged and what remains. Quoting is free:
`get_price`, `estimate_cost` and `compare_prices` take nothing from your account,
so ask Claude to price a video before it renders one.

::: warning Results are signed URLs that expire
Generated files come back as links valid for roughly an hour. Ask Claude to
`save_to_storage` anything worth keeping while the link is still fresh;
`get_download_link` then mints a new link on demand.
:::

## Things that are not there

Three tools are defined but not registered in production, because the service
behind each is not deployed: `generate_shorts`, `create_training_job` and
`get_training_status`.

Two more are registered but inert — `voice_clone` and `separate_stems` return a
"not yet available via MCP" message instead of doing the work. Both exist in the
FOTOhub web app; neither has a public endpoint yet.

## Troubleshooting

| Symptom | What it means |
|---|---|
| Connector added but no tools | Authentication did not complete. Re-open the connector and sign in again. |
| `401` on every call | The OAuth token was revoked, or the stdio `FOTOHUB_API_KEY` is wrong or revoked. |
| `402 insufficient_funds` | Credits and wallet are both exhausted. Top up in [Console → Wallet](https://fotohub.app/console/wallet). |
| A long video never finishes | It is an async job — ask Claude to check `get_job_status` with the `job_id`. |
| **Add custom connector** missing | An Anthropic plan/workspace restriction. Use the stdio configuration above. |

## Next

[MCP overview](/integrations/mcp) ·
[FOTOhub in ChatGPT](/integrations/mcp-chatgpt) ·
[IDE setup — Cursor, VS Code and others](/integrations/mcp-ide-setup) ·
[MCP protocol reference](/api/mcp)
