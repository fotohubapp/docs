# Story Studio

AI-powered multi-scene video story generation. Create complete narrative videos from a single prompt — Story Studio handles concept development, character design, storyboard creation, video generation, voice-over narration, and final composition automatically.

::: info Pipeline Architecture
Story Studio uses a **6-step sequential pipeline** with Server-Sent Events (SSE) streaming for real-time progress. You can run the full pipeline in one call or execute individual steps for granular control.
:::

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        STORY STUDIO PIPELINE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐   ┌────────────┐   ┌──────────┐   ┌──────────────────┐  │
│  │ Step 1   │   │  Step 2    │   │ Step 3   │   │     Step 4       │  │
│  │ Concept  │──▶│ Characters │──▶│  Frames  │──▶│  Video Gen       │  │
│  │ (3 cr)   │   │  (5 cr)    │   │ (5 cr)   │   │  (10 cr)         │  │
│  └──────────┘   └────────────┘   └──────────┘   └──────────────────┘  │
│                                                          │              │
│                                                          ▼              │
│                  ┌──────────────────┐   ┌──────────────────────────┐   │
│                  │     Step 6       │   │        Step 5             │   │
│                  │  Final Compose   │◀──│      Voice-Over           │   │
│                  │    (4 cr)        │   │       (3 cr)              │   │
│                  └──────────────────┘   └──────────────────────────┘   │
│                          │                                              │
│                          ▼                                              │
│                  ┌──────────────────┐                                   │
│                  │   Final Video    │                                   │
│                  │   (MP4 output)   │                                   │
│                  └──────────────────┘                                   │
│                                                                         │
│  Total: 30 credits for full pipeline                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Step Breakdown

| Step | Name | Credits | Description |
|------|------|---------|-------------|
| 1 | **Concept** | 3 | Generates story structure: title, synopsis, scene breakdowns, mood, pacing |
| 2 | **Characters** | 5 | Creates consistent character designs with descriptions and reference images |
| 3 | **Frames** | 5 | Generates storyboard frames — visual keyframes for each scene |
| 4 | **Videos** | 10 | Produces video clips for each scene using the selected video model |
| 5 | **Voice-Over** | 3 | Generates narration audio with timing synchronization |
| 6 | **Final** | 4 | Composites all elements into the finished video with transitions and audio |

---

## Full Pipeline (SSE Streaming)

Run the complete 6-step pipeline with real-time progress updates via Server-Sent Events.

### Endpoint

```
POST /v1/story/generate
```

**Authentication:** Bearer token (API key)
**Billing:** 30 credits (full pipeline)
**Response:** `text/event-stream` (SSE)

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | **Yes** | — | Story description. Be specific about theme, setting, tone, and desired outcome. Max 2000 characters. |
| `style` | string | No | `"cinematic"` | Visual style preset. See supported styles below. |
| `video_model` | string | No | `"veo-2"` | Video generation model for scene clips. |
| `num_scenes` | integer | No | `4` | Number of scenes in the story. Range: 2–8. |
| `duration` | integer | No | `60` | Target total duration in seconds. Range: 15–180. |
| `aspect_ratio` | string | No | `"16:9"` | Output aspect ratio: `"16:9"`, `"9:16"`, `"1:1"`. |
| `voice` | string | No | `"narrator-male-1"` | Voice preset for narration. See voice options below. |
| `language` | string | No | `"en"` | Narration language: `"en"`, `"pl"`, `"de"`, `"fr"`, `"es"`, `"it"`, `"pt"`, `"ja"`, `"ko"`, `"zh"`. |
| `music_style` | string | No | `"auto"` | Background music style. `"auto"` matches story mood. Options: `"epic"`, `"ambient"`, `"upbeat"`, `"dramatic"`, `"none"`. |
| `character_consistency` | boolean | No | `true` | Maintain visual consistency of characters across scenes. |
| `seed` | integer | No | random | Seed for reproducible generation. |

### SSE Event Format

The response stream emits events in standard SSE format:

```
event: step_start
data: {"step": 1, "name": "concept", "message": "Generating story concept..."}

event: step_progress
data: {"step": 1, "progress": 50, "message": "Developing scene structure..."}

event: step_complete
data: {"step": 1, "name": "concept", "result": {...}}

event: step_start
data: {"step": 2, "name": "characters", "message": "Designing characters..."}

...

event: complete
data: {"story_id": "story_abc123", "video_url": "https://...", "credits_used": 30}

event: error
data: {"step": 3, "code": "generation_failed", "message": "Frame generation failed", "retry": true}
```

### Event Types

| Event | Description |
|-------|-------------|
| `step_start` | A pipeline step has begun processing |
| `step_progress` | Progress update within a step (0–100) |
| `step_complete` | Step finished with result data |
| `complete` | Full pipeline finished — contains final video URL |
| `error` | An error occurred — includes `retry` flag indicating if the step can be retried |

### Full Pipeline Response (final `complete` event)

```json
{
  "story_id": "story_7f3k9m2x",
  "video_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/final.mp4",
  "thumbnail_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/thumb.jpg",
  "credits_used": 30,
  "duration": 62,
  "scenes": [
    {
      "index": 0,
      "title": "The Discovery",
      "video_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/scene_0.mp4",
      "frame_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/frame_0.jpg",
      "narration": "In a world where memories could be traded like currency..."
    }
  ],
  "characters": [
    {
      "id": "char_01",
      "name": "Elena",
      "description": "A determined memory archivist in her 30s with silver-streaked dark hair",
      "reference_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/char_01.png"
    }
  ],
  "metadata": {
    "style": "cinematic",
    "video_model": "veo-2",
    "aspect_ratio": "16:9",
    "seed": 847291,
    "generation_time_ms": 142000
  }
}
```

---

## Individual Step Endpoints

Use these endpoints for granular control over the pipeline — ideal for interactive workflows where users review and modify output between steps.

### Step 1: Concept

Generate the story concept including title, synopsis, scene structure, and narrative arc.

```
POST /v1/story/step/concept
```

**Billing:** 3 credits

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | **Yes** | — | Story description and requirements. |
| `style` | string | No | `"cinematic"` | Visual style for the story. |
| `num_scenes` | integer | No | `4` | Target number of scenes (2–8). |
| `duration` | integer | No | `60` | Target duration in seconds. |
| `language` | string | No | `"en"` | Language for script and narration text. |

#### Response

```json
{
  "story_id": "story_7f3k9m2x",
  "credits_used": 3,
  "concept": {
    "title": "The Memory Market",
    "synopsis": "In a near-future city, a memory archivist discovers that someone is stealing childhood memories from the elderly to sell to the wealthy elite.",
    "tone": "suspenseful, thought-provoking",
    "setting": "Neo-Tokyo, 2084",
    "scenes": [
      {
        "index": 0,
        "title": "The Discovery",
        "description": "Elena notices patterns in the memory bank — certain memories are being systematically erased.",
        "duration": 15,
        "mood": "mysterious",
        "narration_text": "In a world where memories could be traded like currency, Elena was one of the few who still believed some things were priceless."
      },
      {
        "index": 1,
        "title": "The Investigation",
        "description": "She traces the missing memories to a high-end auction house in the upper city.",
        "duration": 15,
        "mood": "tense",
        "narration_text": "The trail led upward — past the neon sprawl and into the chrome towers where the city's elite conducted their secret trade."
      }
    ],
    "characters_needed": [
      {"role": "protagonist", "description": "Memory archivist, determined, mid-30s"},
      {"role": "antagonist", "description": "Wealthy collector, charming but ruthless"}
    ]
  }
}
```

---

### Step 2: Characters

Generate consistent character designs based on the story concept.

```
POST /v1/story/step/characters
```

**Billing:** 5 credits

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `story_id` | string | **Yes** | — | Story ID from Step 1. |
| `characters` | array | No | — | Override character descriptions. If omitted, uses `characters_needed` from concept. |
| `characters[].role` | string | Yes | — | Character role: `"protagonist"`, `"antagonist"`, `"supporting"`. |
| `characters[].description` | string | Yes | — | Detailed visual description. |
| `characters[].age` | string | No | — | Age range: `"child"`, `"teen"`, `"young-adult"`, `"adult"`, `"elderly"`. |
| `characters[].gender` | string | No | — | `"male"`, `"female"`, `"non-binary"`. |
| `style` | string | No | inherited | Override visual style from concept. |

#### Response

```json
{
  "story_id": "story_7f3k9m2x",
  "credits_used": 5,
  "characters": [
    {
      "id": "char_01",
      "role": "protagonist",
      "name": "Elena Vasquez",
      "description": "A determined memory archivist in her mid-30s with silver-streaked dark hair pulled into a practical bun, warm brown eyes behind round wireframe glasses, wearing a navy utility coat with holographic ID patches.",
      "reference_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/char_01.png",
      "consistency_embedding": "emb_char01_7f3k9m2x"
    },
    {
      "id": "char_02",
      "role": "antagonist",
      "name": "Marcus Chen",
      "description": "A refined collector in his 50s with slicked-back silver hair, sharp features, and a tailored pearl-gray suit with subtle luminescent threading.",
      "reference_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/char_02.png",
      "consistency_embedding": "emb_char02_7f3k9m2x"
    }
  ]
}
```

---

### Step 3: Frames

Generate storyboard keyframes for each scene.

```
POST /v1/story/step/frames
```

**Billing:** 5 credits

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `story_id` | string | **Yes** | — | Story ID from previous steps. |
| `scene_overrides` | array | No | — | Override specific scene descriptions before frame generation. |
| `scene_overrides[].index` | integer | Yes | — | Scene index to override. |
| `scene_overrides[].description` | string | Yes | — | Updated scene description. |
| `resolution` | string | No | `"1080p"` | Frame resolution: `"720p"`, `"1080p"`, `"4k"`. |

#### Response

```json
{
  "story_id": "story_7f3k9m2x",
  "credits_used": 5,
  "frames": [
    {
      "scene_index": 0,
      "frame_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/frame_0.jpg",
      "composition_notes": "Wide shot of Elena at her workstation, holographic memory fragments floating around her. Cool blue lighting with warm amber accents from the data streams.",
      "camera_direction": "slow push-in"
    },
    {
      "scene_index": 1,
      "frame_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/frame_1.jpg",
      "composition_notes": "Low angle shot looking up at the chrome auction house tower, neon reflections in rain-slicked streets below.",
      "camera_direction": "tilt up"
    }
  ]
}
```

---

### Step 4: Videos

Generate video clips for each scene using AI video models.

```
POST /v1/story/step/videos
```

**Billing:** 10 credits

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `story_id` | string | **Yes** | — | Story ID from previous steps. |
| `video_model` | string | No | `"veo-2"` | Video generation model. See supported models below. |
| `scene_indices` | array | No | all | Specific scene indices to generate. Useful for regenerating individual scenes. |
| `motion_intensity` | string | No | `"medium"` | Camera/subject motion: `"low"`, `"medium"`, `"high"`. |
| `fps` | integer | No | `24` | Frames per second: `24`, `30`. |

#### Supported Video Models

| Model | Provider | Best For | Max Duration |
|-------|----------|----------|--------------|
| `veo-2` | Google | Photorealistic, high consistency | 8s per clip |
| `seedance` | ByteDance | Fast generation, good motion | 5s per clip |
| `wan` | Alibaba | Artistic styles, anime | 5s per clip |
| `hailuo` | MiniMax | Cinematic quality, smooth motion | 6s per clip |

#### Response

```json
{
  "story_id": "story_7f3k9m2x",
  "credits_used": 10,
  "videos": [
    {
      "scene_index": 0,
      "video_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/scene_0.mp4",
      "duration": 5.2,
      "model_used": "veo-2"
    },
    {
      "scene_index": 1,
      "video_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/scene_1.mp4",
      "duration": 5.0,
      "model_used": "veo-2"
    }
  ]
}
```

---

### Step 5: Voice-Over

Generate narration audio synchronized to scene timing.

```
POST /v1/story/step/voiceover
```

**Billing:** 3 credits

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `story_id` | string | **Yes** | — | Story ID from previous steps. |
| `voice` | string | No | `"narrator-male-1"` | Voice preset identifier. |
| `language` | string | No | `"en"` | Narration language. |
| `speed` | float | No | `1.0` | Speech speed multiplier (0.75–1.5). |
| `narration_overrides` | array | No | — | Override narration text for specific scenes. |
| `narration_overrides[].scene_index` | integer | Yes | — | Scene index. |
| `narration_overrides[].text` | string | Yes | — | Custom narration text. |

#### Voice Presets

| Voice ID | Description |
|----------|-------------|
| `narrator-male-1` | Deep, authoritative male narrator |
| `narrator-male-2` | Warm, conversational male voice |
| `narrator-female-1` | Clear, professional female narrator |
| `narrator-female-2` | Soft, intimate female voice |
| `narrator-dramatic` | Theatrical, expressive delivery |
| `narrator-documentary` | Neutral, informative tone |

#### Response

```json
{
  "story_id": "story_7f3k9m2x",
  "credits_used": 3,
  "voiceover": {
    "full_audio_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/narration.mp3",
    "segments": [
      {
        "scene_index": 0,
        "audio_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/narr_0.mp3",
        "text": "In a world where memories could be traded like currency...",
        "start_time": 0.0,
        "end_time": 4.8,
        "duration": 4.8
      },
      {
        "scene_index": 1,
        "audio_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/narr_1.mp3",
        "text": "The trail led upward — past the neon sprawl...",
        "start_time": 5.2,
        "end_time": 10.1,
        "duration": 4.9
      }
    ],
    "total_duration": 48.6
  }
}
```

---

### Step 6: Final Composition

Composite all elements (video clips, voice-over, background music, transitions) into the final video.

```
POST /v1/story/step/final
```

**Billing:** 4 credits

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `story_id` | string | **Yes** | — | Story ID from previous steps. |
| `music_style` | string | No | `"auto"` | Background music: `"epic"`, `"ambient"`, `"upbeat"`, `"dramatic"`, `"none"`, `"auto"`. |
| `transition` | string | No | `"crossfade"` | Scene transition type: `"crossfade"`, `"cut"`, `"fade-black"`, `"dissolve"`, `"wipe"`. |
| `transition_duration` | float | No | `0.5` | Transition duration in seconds (0.2–2.0). |
| `music_volume` | float | No | `0.3` | Background music volume relative to narration (0.0–1.0). |
| `add_subtitles` | boolean | No | `false` | Burn subtitles into the video. |
| `subtitle_style` | string | No | `"minimal"` | Subtitle style: `"minimal"`, `"bold"`, `"karaoke"`, `"cinematic"`. |
| `output_format` | string | No | `"mp4"` | Output format: `"mp4"`, `"webm"`. |
| `output_quality` | string | No | `"1080p"` | Output resolution: `"720p"`, `"1080p"`, `"4k"`. |

#### Response

```json
{
  "story_id": "story_7f3k9m2x",
  "credits_used": 4,
  "video_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/final.mp4",
  "thumbnail_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/thumb.jpg",
  "duration": 62,
  "file_size_mb": 48.2,
  "resolution": "1920x1080",
  "metadata": {
    "scenes_count": 4,
    "transition": "crossfade",
    "music_style": "ambient",
    "has_subtitles": false,
    "total_generation_time_ms": 142000
  }
}
```

---

## Regeneration Endpoints

Regenerate individual elements without re-running the full pipeline.

### Regenerate Character

```
POST /v1/story/regenerate/character
```

**Billing:** 3 credits

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `story_id` | string | **Yes** | — | Story ID. |
| `character_id` | string | **Yes** | — | Character ID to regenerate (e.g., `"char_01"`). |
| `description` | string | No | — | Updated character description. Uses original if omitted. |
| `style_hints` | string | No | — | Additional style guidance for the regeneration. |

#### Response

```json
{
  "story_id": "story_7f3k9m2x",
  "credits_used": 3,
  "character": {
    "id": "char_01",
    "role": "protagonist",
    "name": "Elena Vasquez",
    "description": "A determined memory archivist in her mid-30s...",
    "reference_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/char_01_v2.png",
    "consistency_embedding": "emb_char01_7f3k9m2x_v2",
    "version": 2
  }
}
```

### Regenerate Frame

```
POST /v1/story/regenerate/frame
```

**Billing:** 3 credits

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `story_id` | string | **Yes** | — | Story ID. |
| `scene_index` | integer | **Yes** | — | Scene index to regenerate the frame for. |
| `description` | string | No | — | Updated scene description for the frame. |
| `camera_direction` | string | No | — | Override camera direction: `"push-in"`, `"pull-out"`, `"pan-left"`, `"pan-right"`, `"tilt-up"`, `"tilt-down"`, `"static"`, `"orbit"`. |

#### Response

```json
{
  "story_id": "story_7f3k9m2x",
  "credits_used": 3,
  "frame": {
    "scene_index": 1,
    "frame_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/frame_1_v2.jpg",
    "composition_notes": "Updated composition with lower camera angle...",
    "camera_direction": "tilt-up",
    "version": 2
  }
}
```

---

## Visual Styles

| Style | Description | Best For |
|-------|-------------|----------|
| `cinematic` | Film-quality lighting, depth of field, color grading | Drama, thriller, narrative |
| `anime` | Japanese animation style with bold colors and expressions | Fantasy, action, youth content |
| `cartoon` | Stylized 2D/3D with vibrant colors | Children's content, comedy, explainers |
| `documentary` | Naturalistic, observational, muted tones | Educational, corporate, non-fiction |
| `fantasy` | Ethereal lighting, magical elements, rich environments | World-building, epic narratives |
| `scifi` | Futuristic, neon accents, high-tech environments | Tech stories, space, cyberpunk |

---

## Pricing

| Endpoint | Credits | PLN Equivalent |
|----------|---------|----------------|
| Full pipeline (`/v1/story/generate`) | 30 | 4.50 zl |
| Step 1: Concept | 3 | 0.45 zl |
| Step 2: Characters | 5 | 0.75 zl |
| Step 3: Frames | 5 | 0.75 zl |
| Step 4: Videos | 10 | 1.50 zl |
| Step 5: Voice-Over | 3 | 0.45 zl |
| Step 6: Final Composition | 4 | 0.60 zl |
| Regenerate Character | 3 | 0.45 zl |
| Regenerate Frame | 3 | 0.45 zl |

::: tip Cost Optimization
Running steps individually costs the same total (30 credits) as the full pipeline. The advantage is creative control — you can review and adjust between steps without paying extra.
:::

---

## Code Examples

### Python SDK

#### Full Pipeline with SSE Streaming

```python
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Full pipeline with streaming progress
story = client.story.generate(
    prompt="A detective in 1920s Paris investigates a series of art thefts "
           "from the Louvre, only to discover the paintings are being replaced "
           "with forgeries that contain hidden messages.",
    style="cinematic",
    video_model="veo-2",
    num_scenes=4,
    duration=60,
    voice="narrator-male-1",
    language="en",
    music_style="dramatic"
)

# Stream progress events
for event in story.stream():
    if event.type == "step_start":
        print(f"Starting: {event.data['name']}")
    elif event.type == "step_progress":
        print(f"  Progress: {event.data['progress']}%")
    elif event.type == "step_complete":
        print(f"  Completed: {event.data['name']}")
    elif event.type == "complete":
        print(f"Video ready: {event.data['video_url']}")
    elif event.type == "error":
        print(f"  Error: {event.data['message']}")
```

#### Step-by-Step with Review

```python
from fotohub import FotoHub

client = FotoHub(api_key="fh_live_your_api_key")

# Step 1: Generate concept
concept = client.story.step_concept(
    prompt="A tiny robot discovers emotions for the first time in a junkyard",
    style="cartoon",
    num_scenes=5,
    duration=90
)
print(f"Title: {concept.concept['title']}")
print(f"Scenes: {len(concept.concept['scenes'])}")

# Step 2: Generate characters
characters = client.story.step_characters(
    story_id=concept.story_id
)
for char in characters.characters:
    print(f"  {char['name']}: {char['description']}")

# Regenerate a character if needed
updated_char = client.story.regenerate_character(
    story_id=concept.story_id,
    character_id="char_01",
    description="A small rusty robot with one blue LED eye and one broken eye, "
                "antenna bent at an angle, covered in moss and wildflowers"
)

# Step 3: Generate storyboard frames
frames = client.story.step_frames(
    story_id=concept.story_id
)

# Step 4: Generate video clips
videos = client.story.step_videos(
    story_id=concept.story_id,
    video_model="wan",
    motion_intensity="medium"
)

# Step 5: Add voice-over narration
voiceover = client.story.step_voiceover(
    story_id=concept.story_id,
    voice="narrator-female-2",
    speed=0.9
)

# Step 6: Final composition
final = client.story.step_final(
    story_id=concept.story_id,
    music_style="ambient",
    transition="crossfade",
    add_subtitles=True,
    subtitle_style="cinematic"
)

print(f"Final video: {final.video_url}")
print(f"Duration: {final.duration}s")
print(f"Total credits: 30")
```

---

### TypeScript SDK

#### Full Pipeline with SSE Streaming

```typescript
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

async function generateStory() {
  const stream = await client.story.generate({
    prompt:
      "A street musician in Tokyo discovers their melody can make plants grow, " +
      "transforming the concrete jungle into a garden paradise.",
    style: "anime",
    videoModel: "wan",
    numScenes: 4,
    duration: 60,
    voice: "narrator-female-1",
    language: "en",
    musicStyle: "upbeat",
  });

  for await (const event of stream) {
    switch (event.type) {
      case "step_start":
        console.log(`Starting: ${event.data.name}`);
        break;
      case "step_progress":
        console.log(`  Progress: ${event.data.progress}%`);
        break;
      case "step_complete":
        console.log(`  Done: ${event.data.name}`);
        break;
      case "complete":
        console.log(`Video: ${event.data.video_url}`);
        console.log(`Credits: ${event.data.credits_used}`);
        break;
      case "error":
        console.error(`Error at step ${event.data.step}: ${event.data.message}`);
        break;
    }
  }
}

generateStory();
```

#### Step-by-Step with Review

```typescript
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: "fh_live_your_api_key" });

async function createStoryStepByStep() {
  // Step 1: Concept
  const concept = await client.story.stepConcept({
    prompt: "A grandmother teaches her granddaughter ancient recipes that hold family secrets",
    style: "documentary",
    numScenes: 4,
    duration: 75,
  });

  console.log(`Story: ${concept.concept.title}`);

  // Step 2: Characters
  const characters = await client.story.stepCharacters({
    storyId: concept.storyId,
  });

  // Step 3: Frames
  const frames = await client.story.stepFrames({
    storyId: concept.storyId,
  });

  // Regenerate a frame with different composition
  const newFrame = await client.story.regenerateFrame({
    storyId: concept.storyId,
    sceneIndex: 2,
    cameraDirection: "push-in",
  });

  // Step 4: Videos
  const videos = await client.story.stepVideos({
    storyId: concept.storyId,
    videoModel: "hailuo",
    motionIntensity: "low",
  });

  // Step 5: Voice-over
  const voiceover = await client.story.stepVoiceover({
    storyId: concept.storyId,
    voice: "narrator-female-2",
    language: "en",
  });

  // Step 6: Final
  const final = await client.story.stepFinal({
    storyId: concept.storyId,
    musicStyle: "ambient",
    transition: "dissolve",
    addSubtitles: true,
    outputQuality: "1080p",
  });

  console.log(`Final video: ${final.videoUrl}`);
}

createStoryStepByStep();
```

---

### cURL Examples

#### Full Pipeline (SSE Streaming)

```bash
curl -N -X POST https://apis.fotohub.app/v1/story/generate \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "prompt": "A lonely lighthouse keeper on a remote island receives mysterious messages in bottles that predict the future",
    "style": "cinematic",
    "video_model": "veo-2",
    "num_scenes": 4,
    "duration": 60,
    "voice": "narrator-male-1",
    "music_style": "dramatic"
  }'
```

Output (streamed):
```
event: step_start
data: {"step": 1, "name": "concept", "message": "Generating story concept..."}

event: step_progress
data: {"step": 1, "progress": 30, "message": "Building narrative structure..."}

event: step_progress
data: {"step": 1, "progress": 80, "message": "Refining scene breakdowns..."}

event: step_complete
data: {"step": 1, "name": "concept", "result": {"title": "Messages from Tomorrow", "scenes": [...]}}

event: step_start
data: {"step": 2, "name": "characters", "message": "Designing characters..."}

...

event: complete
data: {"story_id": "story_7f3k9m2x", "video_url": "https://s1.fotohub.app/storage/v1/object/public/stories/story_7f3k9m2x/final.mp4", "credits_used": 30}
```

#### Individual Steps

```bash
# Step 1: Concept
curl -X POST https://apis.fotohub.app/v1/story/step/concept \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Two rival chefs compete in a cooking battle with supernatural ingredients",
    "style": "anime",
    "num_scenes": 5,
    "duration": 90
  }'

# Step 2: Characters (using story_id from Step 1)
curl -X POST https://apis.fotohub.app/v1/story/step/characters \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "story_id": "story_7f3k9m2x"
  }'

# Step 3: Frames
curl -X POST https://apis.fotohub.app/v1/story/step/frames \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "story_id": "story_7f3k9m2x"
  }'

# Step 4: Videos
curl -X POST https://apis.fotohub.app/v1/story/step/videos \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "story_id": "story_7f3k9m2x",
    "video_model": "wan",
    "motion_intensity": "high"
  }'

# Step 5: Voice-Over
curl -X POST https://apis.fotohub.app/v1/story/step/voiceover \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "story_id": "story_7f3k9m2x",
    "voice": "narrator-dramatic",
    "speed": 1.1
  }'

# Step 6: Final Composition
curl -X POST https://apis.fotohub.app/v1/story/step/final \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "story_id": "story_7f3k9m2x",
    "music_style": "epic",
    "transition": "crossfade",
    "add_subtitles": true,
    "subtitle_style": "bold",
    "output_quality": "1080p"
  }'

# Regenerate a character
curl -X POST https://apis.fotohub.app/v1/story/regenerate/character \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "story_id": "story_7f3k9m2x",
    "character_id": "char_02",
    "description": "A flamboyant rival chef with a tall white hat, fiery red apron, and mischievous grin"
  }'

# Regenerate a frame
curl -X POST https://apis.fotohub.app/v1/story/regenerate/frame \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "story_id": "story_7f3k9m2x",
    "scene_index": 3,
    "camera_direction": "orbit"
  }'
```

---

## Use Cases

### Marketing Videos

Generate branded short-form video content for product launches, campaigns, and social media ads.

```python
story = client.story.generate(
    prompt="A sleek smartwatch transforms the daily routine of a busy professional — "
           "from morning workout tracking to seamless meeting reminders, "
           "ending with a sunset notification to relax. Product: TechWear Pro.",
    style="cinematic",
    video_model="veo-2",
    num_scenes=4,
    duration=30,
    aspect_ratio="9:16",
    voice="narrator-male-2",
    music_style="upbeat"
)
```

### Social Media Content

Create vertical short-form stories optimized for Instagram Reels, TikTok, and YouTube Shorts.

```python
story = client.story.generate(
    prompt="5 surprising facts about deep ocean creatures, "
           "each fact revealed with dramatic underwater visuals",
    style="documentary",
    video_model="hailuo",
    num_scenes=5,
    duration=45,
    aspect_ratio="9:16",
    voice="narrator-dramatic",
    music_style="ambient"
)
```

### Educational Content

Produce explainer videos and educational narratives for courses, tutorials, and training materials.

```python
story = client.story.generate(
    prompt="How photosynthesis works: follow a single photon of light "
           "from the sun into a leaf cell, through the chloroplast, "
           "and witness the chemical transformation that feeds all life on Earth.",
    style="documentary",
    video_model="veo-2",
    num_scenes=6,
    duration=120,
    voice="narrator-female-1",
    language="en",
    music_style="ambient"
)
```

### Creative Storytelling

Bring original stories to life for entertainment, portfolio pieces, or personal projects.

```python
story = client.story.generate(
    prompt="A paper crane left on a park bench comes to life at midnight "
           "and embarks on a journey to find the child who folded it, "
           "flying over a sleeping city illuminated by streetlamps and stars.",
    style="anime",
    video_model="wan",
    num_scenes=5,
    duration=90,
    voice="narrator-female-2",
    music_style="ambient",
    character_consistency=True
)
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "insufficient_credits",
    "message": "This request requires 30 credits but your balance is 12.",
    "required_credits": 30,
    "current_balance": 12
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `insufficient_credits` | 402 | Not enough credits for the requested operation. |
| `invalid_story_id` | 404 | Story ID not found or expired (stories expire after 24 hours). |
| `step_dependency` | 400 | Attempted to run a step before its prerequisite completed. |
| `generation_failed` | 500 | Video or image generation failed. Retry is usually safe. |
| `model_unavailable` | 503 | Selected video model is temporarily unavailable. |
| `rate_limited` | 429 | Too many concurrent story generations. Max 3 concurrent per account. |
| `invalid_scene_index` | 400 | Scene index out of range for this story. |
| `content_filtered` | 400 | Prompt was rejected by content safety filters. |

### SSE Error Events

When an error occurs during streaming, you receive an `error` event instead of a `step_complete`:

```
event: error
data: {"step": 4, "code": "generation_failed", "message": "Video generation timed out for scene 2", "retry": true}
```

If `retry` is `true`, you can call the individual step endpoint to retry just that step without re-running the full pipeline.

---

## Rate Limits

| Tier | Concurrent Stories | Requests/min |
|------|-------------------|--------------|
| Free | 1 | 5 |
| Pro | 3 | 20 |
| Business | 10 | 60 |
| Enterprise | Unlimited | Custom |

---

## Best Practices

1. **Write detailed prompts** — Include setting, characters, mood, and narrative arc. Vague prompts produce generic results.

2. **Choose the right model** — Use `veo-2` for photorealistic content, `wan` for anime/artistic styles, `hailuo` for cinematic smooth motion, `seedance` for fast iteration.

3. **Use step-by-step for production** — The individual step endpoints let you review and adjust at each stage, resulting in higher quality output.

4. **Regenerate selectively** — If one character or frame is not right, regenerate just that element (3 credits) instead of re-running the full pipeline (30 credits).

5. **Match duration to content** — Shorter stories (15–30s) work best for social media. Longer stories (60–180s) suit educational and narrative content.

6. **Leverage character consistency** — Keep `character_consistency: true` (default) to ensure characters look the same across all scenes.
