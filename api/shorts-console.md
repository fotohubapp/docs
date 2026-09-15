# Shorts & Clips API Console

Ready-to-copy working examples for every Shorts **Console RPC** action — the stateful project/clip system that powers the web dashboard.

::: warning This is the Console RPC, not the Pipeline REST API
Everything on this page targets the **`shorts-process`** edge function and authenticates with a **Supabase session token** (the JWT from your logged-in dashboard session) — **not** an `fh_live_*` API key. Every request is a `POST` with an `action` field in the body; there are no REST paths like `/v1/shorts/projects`.

If you want a stateless, API-key-authenticated pipeline for programmatic/SDK use, see the [Pipeline REST API](/api/shorts-clips#pipeline-rest-api) instead. The distinction between the two is explained in [Two ways to use Shorts](/api/shorts-clips#two-ways-to-use-shorts).
:::

::: tip Base URL & auth
All requests go to: `https://s1.fotohub.app/functions/v1/shorts-process`

Replace `YOUR_SESSION_TOKEN` with your Supabase session token.
:::

---

## Quick Start — Create Your First Short in 3 Steps

### Step 1: Create a project

::: code-group
```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_create_project",
    "mode": "clip",
    "source_url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "My First Short",
    "settings": {
      "language": "en",
      "caption_style": "karaoke",
      "aspect_ratio": "9:16",
      "max_clips": 3
    }
  }'
```

```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="YOUR_API_KEY")

project = client.shorts.create_project(
    mode="clip",
    source_url="https://youtube.com/watch?v=dQw4w9WgXcQ",
    title="My First Short",
    settings={
        "language": "en",
        "caption_style": "karaoke",
        "aspect_ratio": "9:16",
        "max_clips": 3
    }
)
project_id = project.id
print(f"Created: {project_id}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "YOUR_API_KEY" });

const project = await client.shorts.createProject({
  mode: "clip",
  sourceUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
  title: "My First Short",
  settings: {
    language: "en",
    captionStyle: "karaoke",
    aspectRatio: "9:16",
    maxClips: 3
  }
});
const projectId = project.id;
```
:::

**Expected response:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "mode": "clip",
  "status": "draft",
  "title": "My First Short"
}
```

### Step 2: Start processing

::: code-group
```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_process_project",
    "project_id": "PROJECT_ID_FROM_STEP_1",
    "settings": {}
  }'
```

```python [Python]
result = client.shorts.process_project(project_id)
print(f"Status: {result.status}")  # "started"
```

```typescript [TypeScript]
const result = await client.shorts.processProject(projectId);
console.log(result.status); // "started"
```
:::

**Expected response:**
```json
{
  "status": "started",
  "project_id": "a1b2c3d4-...",
  "mode": "clip"
}
```

**USD charged:** ~10-15 (ingest + transcribe + detect + clip + caption + render)

### Step 3: Get your clips

Wait 30-60 seconds for processing, then:

::: code-group
```bash [cURL]
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_get_project",
    "project_id": "PROJECT_ID_FROM_STEP_1"
  }'
```

```python [Python]
import time
time.sleep(45)  # Wait for processing

result = client.shorts.get_project(project_id)
print(f"Status: {result.project.status}")
for clip in result.clips:
    print(f"  {clip.user_title} — Score: {clip.virality_score}")
    if clip.renders.get("9:16", {}).get("url"):
        print(f"    Download: {clip.renders['9:16']['url']}")
```

```typescript [TypeScript]
await new Promise(r => setTimeout(r, 45000));

const { project, clips } = await client.shorts.getProject(projectId);
console.log(`Status: ${project.status}`);
clips.forEach(clip => {
  console.log(`${clip.userTitle} — Score: ${clip.viralityScore}`);
});
```
:::

**Expected response (when complete):**
```json
{
  "project": { "status": "completed", "steps_completed": ["ingest","transcribe","detect","clip","caption","render"] },
  "clips": [
    {
      "id": "clip-uuid-1",
      "user_title": "The Unexpected Hook",
      "virality_score": 92,
      "duration": 28.5,
      "renders": { "9:16": { "url": "https://s3point.fotohub.app/...", "status": "rendered" } }
    }
  ]
}
```

---

## Projects Examples

### Create project from YouTube

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_create_project",
    "mode": "clip",
    "source_url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "YouTube Highlights",
    "settings": {
      "language": "en",
      "caption_style": "bold",
      "max_clips": 5,
      "min_duration": 15,
      "max_duration": 45
    }
  }'
```

### Create recap project from article

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_create_project",
    "mode": "recap",
    "title": "Tech News Recap"
  }'
```

### Create avatar project

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_create_project",
    "mode": "avatar",
    "title": "Welcome Video",
    "avatar_config": {
      "face_image_url": "https://storage.fotohub.app/.../face.jpg",
      "voice_id": "voice-energetic-female"
    }
  }'
```

### Create AI-generated video project

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_create_project",
    "mode": "create",
    "title": "AI Product Demo",
    "brief": "Show how our AI tool transforms a boring photo into a stunning artwork in 30 seconds"
  }'
```

### List projects with pagination

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_list_projects", "limit": 10, "offset": 0}'
```

---

## Clips Examples

### Render in multiple aspect ratios

```bash
# Render 9:16 (TikTok/Reels)
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_render_clip", "clip_id": "CLIP_ID", "aspect_ratio": "9:16", "quality": "social_1080p"}'

# Render 1:1 (Instagram Feed)
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_render_clip", "clip_id": "CLIP_ID", "aspect_ratio": "1:1", "quality": "social_1080p"}'

# Render 16:9 (YouTube)
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_render_clip", "clip_id": "CLIP_ID", "aspect_ratio": "16:9", "quality": "social_1080p"}'
```

### Batch render 5 clips

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_batch_render",
    "project_id": "PROJECT_ID",
    "clip_ids": ["clip-1", "clip-2", "clip-3", "clip-4", "clip-5"],
    "quality": "social_1080p",
    "aspect_ratio": "9:16"
  }'
```

### Update clip metadata

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_update_clip",
    "clip_id": "CLIP_ID",
    "user_title": "The Perfect Hook",
    "is_favorite": true,
    "tags": ["hook", "viral", "opening"]
  }'
```

---

## AI Features Examples

### Generate script from brief

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_generate_script",
    "project_id": "PROJECT_ID",
    "brief": "5 mind-blowing facts about the ocean that will make you rethink everything you know about our planet",
    "target_duration": 45,
    "style": "energetic",
    "platform": "tiktok"
  }'
```

**Expected response:**
```json
{
  "status": "generated",
  "script": {
    "title": "5 Ocean Facts That Will Blow Your Mind",
    "hook": "The ocean is deeper than Mount Everest is tall. And that's just the beginning.",
    "scenes": [
      { "scene_number": 1, "duration_seconds": 8, "narration": "...", "visual_description": "..." }
    ],
    "total_duration_seconds": 43
  }
}
```

### Generate storyboard + video

```bash
# Step 1: Generate storyboard from script
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_generate_storyboard", "project_id": "PROJECT_ID"}'

# Step 2: Generate video from storyboard (15-50 credits per scene)
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_generate_video",
    "project_id": "PROJECT_ID",
    "model": "pro",
    "resolution": "1080p"
  }'
```

### Scrape article + generate recap script

```bash
# Step 1: Scrape article
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_recap_scrape",
    "project_id": "PROJECT_ID",
    "url": "https://techcrunch.com/2026/07/20/ai-creative-tools-revolution/"
  }'

# Step 2: Generate video script from article
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_recap_generate_script",
    "project_id": "PROJECT_ID",
    "target_duration": 60,
    "style": "dramatic",
    "language": "en"
  }'

# Step 3: Get the generated script
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_recap_get_script", "project_id": "PROJECT_ID"}'
```

### B-Roll AI suggestions

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_broll_suggest", "clip_id": "CLIP_ID"}'
```

**Expected response:**
```json
{
  "clip_id": "clip-uuid",
  "suggestions": [
    {
      "timestamp": 5.2,
      "duration": 3,
      "search_query": "city skyline sunset timelapse",
      "description": "Aerial shot of city at golden hour",
      "rationale": "Visual break during narration about urban growth"
    },
    {
      "timestamp": 18.0,
      "duration": 2.5,
      "search_query": "hands typing code laptop closeup",
      "description": "Close-up of developer working on code",
      "rationale": "Illustrates the technical concept being discussed"
    }
  ]
}
```

### Series AI split

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_series_ai_split",
    "series_id": "SERIES_ID",
    "clip_ids": ["clip-1", "clip-2", "clip-3", "clip-4", "clip-5", "clip-6"],
    "target_episodes": 3,
    "style": "suspense"
  }'
```

**Expected response:**
```json
{
  "series_id": "series-uuid",
  "episodes_created": 3,
  "plan": {
    "episodes": [
      {
        "episode_number": 1,
        "title": "The Setup",
        "clip_ids": ["clip-1", "clip-4"],
        "hook_for_next": "But what they found next changed everything...",
        "narrative_note": "Introduces the problem, builds curiosity"
      }
    ],
    "series_narrative": "A three-part thriller about unexpected discoveries"
  }
}
```

---

## Series & Templates Examples

### Create series, add clips, reorder

```bash
# Create series
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_create_series",
    "title": "Weekly Startup Tips",
    "description": "One actionable tip every week"
  }'

# Add clips to series
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_add_to_series",
    "series_id": "SERIES_ID",
    "clip_ids": ["clip-1", "clip-2", "clip-3"]
  }'

# Reorder episodes
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_reorder_series",
    "series_id": "SERIES_ID",
    "order": ["clip-3", "clip-1", "clip-2"]
  }'
```

### Create custom template, apply to clip

```bash
# Create template
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_create_template",
    "name": "Brand Purple Style",
    "category": "captions",
    "config": {
      "caption_style": "karaoke",
      "font": "Inter Bold",
      "primary_color": "#7C3AED",
      "background_opacity": 0.6,
      "position": "center",
      "font_size": 48
    }
  }'

# Apply to clip
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_apply_template",
    "template_id": "TEMPLATE_ID",
    "clip_id": "CLIP_ID"
  }'
```

---

## Publishing Examples

### Publish to TikTok

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_publish",
    "clip_id": "CLIP_ID",
    "platform": "tiktok",
    "title": "This changes everything 🤯",
    "description": "5 things I learned building a startup",
    "hashtags": ["startup", "tech", "entrepreneur", "fyp"]
  }'
```

### Batch publish to multiple platforms

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_batch_publish",
    "clip_ids": ["clip-1", "clip-2", "clip-3"],
    "platforms": ["tiktok", "youtube", "instagram"]
  }'
```

This publishes all 3 clips to all 3 platforms (9 posts total).

### Schedule for later

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_publish",
    "clip_id": "CLIP_ID",
    "platform": "youtube",
    "title": "How I Built This in 24 Hours",
    "scheduled_at": "2026-07-25T14:00:00Z"
  }'
```

### View publish queue

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_get_publish_queue", "status": "scheduled"}'
```

---

## Analytics Examples

### Get dashboard summary

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_analytics_dashboard"}'
```

### Cost report

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "v2_analytics_cost_report"}'
```

### Submit real performance data

```bash
curl -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_submit_performance",
    "clip_id": "CLIP_ID",
    "views": 125000,
    "likes": 8400,
    "shares": 1200,
    "platform": "tiktok"
  }'
```

---

## Full Workflow: YouTube → Published Shorts

Complete end-to-end workflow from a YouTube video to published TikTok shorts.

::: code-group
```python [Python]
from fotohub import FotoHub
import time

client = FotoHub(api_key="YOUR_API_KEY")

# 1. Create project
project = client.shorts.create_project(
    mode="clip",
    source_url="https://youtube.com/watch?v=dQw4w9WgXcQ",
    title="Best Moments Compilation",
    settings={
        "language": "en",
        "caption_style": "karaoke",
        "aspect_ratio": "9:16",
        "max_clips": 5,
        "min_duration": 15,
        "max_duration": 60
    }
)
print(f"1. Project created: {project.id}")

# 2. Start processing
client.shorts.process_project(project.id)
print("2. Pipeline started")

# 3. Wait for completion (poll every 10s)
while True:
    result = client.shorts.get_project(project.id)
    if result.project.status in ("completed", "failed"):
        break
    print(f"   Status: {result.project.status} — Step: {result.project.current_step}")
    time.sleep(10)

if result.project.status == "failed":
    print(f"Failed: {result.project.error_message}")
    exit(1)

# 4. Review clips
clips = result.clips
print(f"3. Got {len(clips)} clips:")
for clip in clips:
    print(f"   • {clip.user_title} — Score: {clip.virality_score}")

# 5. Publish top 3 to TikTok
top_clips = sorted(clips, key=lambda c: c.virality_score, reverse=True)[:3]
result = client.shorts.batch_publish(
    clip_ids=[c.id for c in top_clips],
    platforms=["tiktok"]
)
print(f"4. Published {result.queued} clips to TikTok")

# 6. Check analytics
dashboard = client.shorts.get_dashboard()
print(f"5. Total USD charged: {dashboard.total_usd_spent}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "YOUR_API_KEY" });

// 1. Create project
const project = await client.shorts.createProject({
  mode: "clip",
  sourceUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
  title: "Best Moments Compilation",
  settings: {
    language: "en",
    captionStyle: "karaoke",
    aspectRatio: "9:16",
    maxClips: 5,
    minDuration: 15,
    maxDuration: 60
  }
});
console.log(`1. Project: ${project.id}`);

// 2. Start processing
await client.shorts.processProject(project.id);
console.log("2. Pipeline started");

// 3. Wait for completion
let result;
do {
  await new Promise(r => setTimeout(r, 10000));
  result = await client.shorts.getProject(project.id);
  console.log(`   ${result.project.status} — ${result.project.currentStep}`);
} while (!["completed", "failed"].includes(result.project.status));

// 4. Publish top clips
const topClips = result.clips
  .sort((a, b) => b.viralityScore - a.viralityScore)
  .slice(0, 3);

const pubResult = await client.shorts.batchPublish({
  clipIds: topClips.map(c => c.id),
  platforms: ["tiktok"]
});
console.log(`4. Published ${pubResult.queued} clips`);
```

```bash [cURL]
# 1. Create project
PROJECT_ID=$(curl -s -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "v2_create_project",
    "mode": "clip",
    "source_url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "settings": {"language":"en","caption_style":"karaoke","aspect_ratio":"9:16","max_clips":5}
  }' | jq -r '.id')
echo "Project: $PROJECT_ID"

# 2. Start pipeline
curl -s -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"v2_process_project\",\"project_id\":\"$PROJECT_ID\",\"settings\":{}}"

# 3. Wait 60s then get clips
sleep 60
curl -s -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"v2_get_project\",\"project_id\":\"$PROJECT_ID\"}" | jq '.clips[] | {title: .user_title, score: .virality_score}'
```
:::

---

## Full Workflow: Article → Video Recap

Convert a news article into an engaging video recap.

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="YOUR_API_KEY")

# 1. Create recap project
project = client.shorts.create_project(mode="recap", title="Tech News Recap")
print(f"Project: {project.id}")

# 2. Scrape the article
scrape = client.shorts.scrape_article(project.id,
    url="https://techcrunch.com/2026/07/20/ai-creative-tools-revolution/"
)
print(f"Scraped: {scrape.title} ({scrape.word_count} words)")

# 3. Generate video script
script = client.shorts.generate_recap_script(project.id,
    target_duration=45,
    style="informative",
    language="en"
)
print(f"Script: {script.script.title} ({script.total_duration}s, {script.scenes} scenes)")

# 4. Process full pipeline (storyboard + video generation)
client.shorts.process_project(project.id)
print("Pipeline started — video generation in progress...")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "YOUR_API_KEY" });

// 1. Create recap project
const project = await client.shorts.createProject({ mode: "recap", title: "Tech News Recap" });

// 2. Scrape article
const scrape = await client.shorts.scrapeArticle(project.id, {
  url: "https://techcrunch.com/2026/07/20/ai-creative-tools-revolution/"
});
console.log(`Scraped: ${scrape.title} (${scrape.wordCount} words)`);

// 3. Generate script
const script = await client.shorts.generateRecapScript(project.id, {
  targetDuration: 45,
  style: "informative"
});
console.log(`Script: ${script.script.title}`);

// 4. Process (generates video)
await client.shorts.processProject(project.id);
```

```bash [cURL]
# 1. Create recap project
PROJECT_ID=$(curl -s -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"v2_create_project","mode":"recap","title":"Tech News"}' | jq -r '.id')

# 2. Scrape article
curl -s -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"v2_recap_scrape\",\"project_id\":\"$PROJECT_ID\",\"url\":\"https://techcrunch.com/2026/07/20/ai-creative-tools-revolution/\"}"

# 3. Generate script
curl -s -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"v2_recap_generate_script\",\"project_id\":\"$PROJECT_ID\",\"target_duration\":45,\"style\":\"informative\"}"

# 4. Process pipeline
curl -s -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"v2_process_project\",\"project_id\":\"$PROJECT_ID\",\"settings\":{}}"
```
:::

---

## Full Workflow: AI-Generated Short from Scratch

Create a complete AI-generated short video from just a text brief.

::: code-group
```python [Python]
from fotohub import FotoHub

client = FotoHub(api_key="YOUR_API_KEY")

# 1. Create project
project = client.shorts.create_project(
    mode="create",
    title="Ocean Facts",
    brief="5 mind-blowing facts about the deep ocean"
)

# 2. Generate script
script = client.shorts.generate_script(project.id,
    brief="5 mind-blowing facts about the deep ocean that will change how you see our planet",
    target_duration=45,
    platform="tiktok"
)
print(f"Script: {len(script.script.scenes)} scenes, {script.script.total_duration_seconds}s")

# 3. Generate storyboard
storyboard = client.shorts.generate_storyboard(project.id)
print(f"Storyboard ready: {len(storyboard.storyboard.scenes)} scenes")

# 4. Generate video (expensive — 15-50 credits per scene)
video = client.shorts.generate_video(project.id, model="pro", resolution="1080p")
print(f"Video generation started")

# 5. Wait and get result
import time
time.sleep(120)  # AI video generation takes 1-3 minutes

result = client.shorts.get_project(project.id)
if result.clips:
    print(f"Video ready: {result.clips[0].renders}")
```

```bash [cURL]
# 1. Create + script + storyboard + video in sequence
PROJECT_ID=$(curl -s -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"v2_create_project","mode":"create","title":"Ocean Facts"}' | jq -r '.id')

curl -s -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"v2_generate_script\",\"project_id\":\"$PROJECT_ID\",\"brief\":\"5 mind-blowing facts about the deep ocean\",\"target_duration\":45}"

curl -s -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"v2_generate_storyboard\",\"project_id\":\"$PROJECT_ID\"}"

curl -s -X POST https://s1.fotohub.app/functions/v1/shorts-process \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"v2_generate_video\",\"project_id\":\"$PROJECT_ID\",\"model\":\"pro\",\"resolution\":\"1080p\"}"
```
:::

**Credits estimate:** ~80-150 credits total (script: 2, storyboard: 2, video: 75-125 depending on scenes)

---

## Error Handling

All errors return `{"detail": "message"}`. Handle common cases:

```python
from fotohub import FotoHub, FotoHubError

client = FotoHub(api_key="YOUR_API_KEY")

try:
    result = client.shorts.process_project("project-uuid")
except FotoHubError as e:
    if e.status == 403:
        print("Insufficient credits — top up at fotohub.app/billing")
    elif e.status == 404:
        print("Project not found")
    elif e.status == 429:
        print("Rate limited — wait and retry")
        time.sleep(5)
    else:
        print(f"Error {e.status}: {e.detail}")
```
