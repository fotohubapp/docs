# Image Analysis

Extract structured information from images using AI-powered analysis. Detect objects, faces, text (OCR), dominant colors, content safety (NSFW), and semantic labels. Also includes a prompt enhancement endpoint to improve generation prompts using AI.

| | |
|---|---|
| **Features** | 6 analysis types: labels, faces, nsfw, ocr, colors, objects |
| **Cost** | 1 credit per analysis ($0.0161 from the wallet once credits are exhausted) |
| **Latency** | 2-8 seconds depending on features selected |

---

## Analyze Image

### Endpoint

```
POST /v1/ai/analyze/image
```

**Authentication:** API Key (Bearer token)  
**Billing:** 1 credit per request (flat rate regardless of features selected)

### Request Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | Yes | -- | URL of the image to analyze. Must be publicly accessible or a FOTOhub storage URL. Supports JPEG, PNG, WebP, and GIF (first frame). Maximum file size: 20MB. |
| `features` | string[] | No | `["labels", "objects"]` | Array of analysis features to run. Options: `"labels"`, `"objects"`, `"faces"`, `"nsfw"`, `"ocr"`, `"colors"`, `"landmarks"`, `"logos"`. `"text"` is an alias for `"ocr"` and `"safe_search"` for `"nsfw"`. Multiple features can be combined in a single request. An unrecognised name returns `400` — it is not ignored. |
| `language` | string | No | `"en"` | Language hint passed to the provider. It biases OCR toward the expected script; label names are always returned in English. Send `"auto"` to omit the hint entirely. |
| `max_labels` | integer | No | `50` | Maximum number of labels to return when using the labels feature. Range: 1-50. Labels are returned in descending confidence order. |
| `min_confidence` | number | No | `0` | Minimum confidence threshold (0.0-1.0), applied to `labels`, `objects` and `faces`. `nsfw` and `ocr` carry no numeric score, so the threshold does not apply to them. Default `0` returns everything the provider found. |

::: tip Fixed Cost
Image analysis costs a flat **1 credit** per request ($0.0161 billed from your USD wallet once included credits are exhausted), regardless of how many features you select. Requesting every feature in a single call is therefore cheaper than making one call per feature.
:::

---

## Response Format

The response includes only the features you requested. Each feature returns its
results under a dedicated key in the response object.

::: warning Confidence scores and bounding boxes
Not every annotation carries a numeric confidence. Face detection and content
safety return **likelihood buckets** (`VERY_UNLIKELY` … `VERY_LIKELY`), not
floats, and OCR blocks carry no per-block confidence at all. Bounding boxes come
back in two coordinate systems, so always read `bounding_box.units`: `"pixels"`
for faces and OCR, `"normalized"` (0-1 fractions of width and height) for
objects.
:::

### Full Analysis Response (All Features)

```json
{
  "credits_used": 1,
  "billing": {
    "method": "credits",
    "credits_used": 1,
    "usd_charged": 0
  },
  "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/photo.jpg",
  "features_analyzed": ["labels", "faces", "nsfw", "ocr", "colors", "objects"],
  "auto_tags": ["outdoor", "mountain", "landscape", "person", "backpack"],
  "labels": [
    { "name": "outdoor", "confidence": 0.98 },
    { "name": "mountain", "confidence": 0.95 },
    { "name": "landscape", "confidence": 0.94 },
    { "name": "nature", "confidence": 0.92 },
    { "name": "sky", "confidence": 0.91 }
  ],
  "faces": [
    {
      "bounding_box": { "x": 120, "y": 80, "width": 150, "height": 180, "units": "pixels" },
      "confidence": 0.97,
      "likelihood": {
        "joy": "VERY_LIKELY",
        "sorrow": "VERY_UNLIKELY",
        "anger": "VERY_UNLIKELY",
        "surprise": "UNLIKELY",
        "headwear": "VERY_UNLIKELY",
        "blurred": "VERY_UNLIKELY"
      }
    }
  ],
  "nsfw": {
    "is_safe": true,
    "likelihood": {
      "adult": "VERY_UNLIKELY",
      "violence": "VERY_UNLIKELY",
      "racy": "UNLIKELY",
      "medical": "VERY_UNLIKELY",
      "spoof": "VERY_UNLIKELY"
    }
  },
  "ocr": {
    "text": "Welcome to\nMountain View Lodge\nEst. 2019",
    "blocks": [
      { "text": "Welcome", "bounding_box": { "x": 50, "y": 20, "width": 110, "height": 30, "units": "pixels" } },
      { "text": "to", "bounding_box": { "x": 168, "y": 22, "width": 30, "height": 28, "units": "pixels" } }
    ]
  },
  "colors": {
    "dominant": [
      { "hex": "#2d5a8e", "score": 0.41, "percentage": 35.2 },
      { "hex": "#f4a460", "score": 0.22, "percentage": 22.8 },
      { "hex": "#228b22", "score": 0.18, "percentage": 18.5 }
    ]
  },
  "objects": [
    {
      "name": "person",
      "confidence": 0.96,
      "bounding_box": { "x": 0.09, "y": 0.07, "width": 0.19, "height": 0.52, "units": "normalized" }
    },
    {
      "name": "backpack",
      "confidence": 0.89,
      "bounding_box": { "x": 0.13, "y": 0.15, "width": 0.07, "height": 0.13, "units": "normalized" }
    }
  ]
}
```

`auto_tags` is a flat, deduplicated, lower-cased union of the labels, objects,
landmarks and logos that were detected — the shortcut when all you want is a tag
list to index.


## Feature Details

Requesting a feature that was not detected in the image returns an empty array
for it (`"faces": []`), not a missing key.

### labels — Semantic Labels

High-level semantic labels describing image content: scenes, activities, objects
and styles. Useful for auto-tagging, categorisation and search indexing.

- **Returns:** array of `{ name, confidence }`, confidence descending, names lower-cased.
- **Control:** `max_labels` (1-50) trims the list, `min_confidence` filters it.

### faces — Face Detection

Detects faces and returns a detection confidence plus expression likelihoods.
**Age, gender and accessory attributes are not returned.**

- **Returns:** array of `{ bounding_box, confidence, likelihood }`.
- **Likelihood keys:** `joy`, `sorrow`, `anger`, `surprise`, `headwear`, `blurred`, each one of `VERY_UNLIKELY`, `UNLIKELY`, `POSSIBLE`, `LIKELY`, `VERY_LIKELY`.
- **Note:** no identification or recognition is performed and no face templates are created. Under the EU AI Act the expression estimate is an emotion-recognition feature, so inform the people in your images that you use it.

### nsfw — Content Safety

Evaluates the image for unsafe content. Also accepted as `safe_search`.

- **Returns:** `{ is_safe, likelihood }` where `likelihood` covers `adult`, `violence`, `racy`, `medical` and `spoof`.
- **Threshold:** `is_safe` is `false` when any of `adult`, `violence` or `racy` is `LIKELY` or `VERY_LIKELY`. For a stricter or looser policy, read `likelihood` yourself instead of trusting the flag.
- **Use case:** upload moderation, generated-content filtering, policy enforcement.

### ocr — Text Extraction

Extracts visible text. Also accepted as `text`.

- **Returns:** `{ text, blocks }` — the full concatenated string plus one entry per detected word with its pixel bounding box. Blocks carry no confidence score.
- **Languages:** auto-detected. Pass `language` to hint the expected script when detection struggles.

### colors — Color Palette

Extracts the dominant colour palette.

- **Returns:** `{ dominant: [{ hex, score, percentage }] }`. `percentage` is the share of pixels; `score` is the provider's own relevance weighting.
- **Not returned:** human-readable colour names, `palette_type`, `brightness`.

### objects — Object Detection

Detects and localises individual objects.

- **Returns:** array of `{ name, confidence, bounding_box }` with **normalized** coordinates (0-1 fractions), not pixels. Multiply by the image width/height to crop.
- **Filtering:** `min_confidence` applies here too.

### landmarks / logos

Two extra features not covered by the six above: `landmarks` returns recognised
places and `logos` returns recognised brand marks, both as
`{ name, confidence }`. They are included in `auto_tags` when requested.


## Code Examples

### Full Image Analysis

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/analyze/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/photo.jpg",
        "features": ["labels", "faces", "nsfw", "ocr", "colors", "objects"],
        "language": "en",
        "max_labels": 10,
        "min_confidence": 0.5
    }
)

data = response.json()
print(f"Credits used: {data['credits_used']}")

# Access labels
for label in data["labels"]:
    print(f"  {label['name']}: {label['confidence']:.2f}")

# Check content safety
if data["nsfw"]["is_safe"]:
    print("Content is safe")
else:
    print("Content flagged - review required")

# Extract text
if data.get("ocr"):
    print(f"Extracted text: {data['ocr']['text']}")

# Get dominant colors
for color in data["colors"]["dominant"]:
    print(f"  {color['hex']}: {color['percentage']}%")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/analyze/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    image_url: "https://s1.fotohub.app/storage/v1/object/public/uploads/photo.jpg",
    features: ["labels", "faces", "nsfw", "ocr", "colors", "objects"],
    language: "en",
    max_labels: 10,
    min_confidence: 0.5
  })
});

const data = await response.json();
console.log(`Credits used: ${data.credits_used}`);

// Access labels
for (const label of data.labels) {
  console.log(`  ${label.name}: ${label.confidence.toFixed(2)}`);
}

// Check content safety
if (data.nsfw.is_safe) {
  console.log("Content is safe");
} else {
  console.log("Content flagged - review required");
}

// Extract text via OCR
if (data.ocr) {
  console.log(`Extracted text: ${data.ocr.text}`);
}

// Get dominant colors
for (const color of data.colors.dominant) {
  console.log(`  ${color.hex}: ${color.percentage}%`);
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/analyze/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/photo.jpg",
    "features": ["labels", "faces", "nsfw", "ocr", "colors", "objects"],
    "language": "en",
    "max_labels": 10,
    "min_confidence": 0.5
  }'
```

:::

### Content Moderation (NSFW Check Only)

::: code-group

```python [Python]
import requests

def check_content_safety(image_url: str) -> bool:
    """Check if an image is safe for display."""
    response = requests.post(
        "https://apis.fotohub.app/v1/ai/analyze/image",
        headers={
            "Authorization": "Bearer fh_live_your_api_key",
            "Content-Type": "application/json"
        },
        json={
            "image_url": image_url,
            "features": ["nsfw"]
        }
    )
    data = response.json()
    return data["nsfw"]["is_safe"]

# Usage in upload pipeline
uploaded_url = "https://s1.fotohub.app/storage/v1/object/public/uploads/user-photo.jpg"
if check_content_safety(uploaded_url):
    print("Image approved for publishing")
else:
    print("Image rejected - content policy violation")
```

```typescript [TypeScript]
async function checkContentSafety(imageUrl: string): Promise<boolean> {
  const response = await fetch("https://apis.fotohub.app/v1/ai/analyze/image", {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_your_api_key",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      image_url: imageUrl,
      features: ["nsfw"]
    })
  });
  const data = await response.json();
  return data.nsfw.is_safe;
}

// Usage in upload pipeline
const uploadedUrl = "https://s1.fotohub.app/storage/v1/object/public/uploads/user-photo.jpg";
const isSafe = await checkContentSafety(uploadedUrl);
console.log(isSafe ? "Image approved" : "Image rejected");
```

```bash [cURL]
# Quick NSFW check - minimal request
curl -X POST "https://apis.fotohub.app/v1/ai/analyze/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/user-upload.jpg",
    "features": ["nsfw"]
  }'
```

:::

### OCR — Document Text Extraction

::: code-group

```python [Python]
import requests

response = requests.post(
    "https://apis.fotohub.app/v1/ai/analyze/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "image_url": "https://example.com/receipt.jpg",
        "features": ["ocr"]
    }
)

data = response.json()

# Get full text
full_text = data["ocr"]["text"]
print(f"Full text:\n{full_text}")

# Get individual text blocks with positions
for block in data["ocr"]["blocks"]:
    box = block["bounding_box"]
    print(f"'{block['text']}' at ({box['x']}, {box['y']}) [{box['units']}]")
```

```typescript [TypeScript]
const response = await fetch("https://apis.fotohub.app/v1/ai/analyze/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    image_url: "https://example.com/receipt.jpg",
    features: ["ocr"]
  })
});

const data = await response.json();

// Get full text
console.log("Full text:", data.ocr.text);

// Get individual text blocks with positions
for (const block of data.ocr.blocks) {
  const box = block.bounding_box;
  console.log(`'${block.text}' at (${box.x}, ${box.y}) [${box.units}]`);
}
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/analyze/image" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/receipt.jpg",
    "features": ["ocr"]
  }'
```

:::

---

## Prompt Enhancement

Enhance short or vague image generation prompts into detailed, high-quality descriptions. The AI expands your prompt with relevant details about composition, lighting, style, and technical aspects to produce better generation results.

### Endpoint

```
POST /v1/ai/enhance-prompt
```

**Authentication:** API Key (Bearer token)  
**Billing:** 1 credit per request

### Request Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes | -- | The original prompt to enhance. Can be a few words or a sentence. The AI will expand it with relevant creative details while preserving your intent. |
| `style` | string | No | -- | Optional style direction to guide enhancement. Examples: `"photorealistic"`, `"cinematic"`, `"anime"`, `"oil-painting"`, `"3d-render"`, `"watercolor"`, `"minimalist"`, `"fantasy-art"`. When omitted, the AI infers the best style from context. |
| `target_model` | string | No | -- | Optional model ID that the enhanced prompt will be used with. The AI optimizes the prompt structure for the target model's strengths (e.g., more detailed for FLUX, more structured for Imagen). |
| `length` | string | No | `"medium"` | Target length of the enhanced prompt. `"short"` (1-2 sentences), `"medium"` (3-4 sentences), `"long"` (5-8 sentences with extensive detail). |

### Response

```json
{
  "credits_used": 1,
  "billing": {
    "method": "credits",
    "credits_used": 1,
    "usd_charged": 0,
    "pln_charged": 0
  },
  "original_prompt": "a cat on a roof",
  "enhanced_prompt": "A sleek tabby cat perched on the edge of a terracotta rooftop at golden hour, silhouetted against a warm sunset sky with streaks of orange and purple. The cat gazes into the distance with alert, luminous eyes. Shallow depth of field with the background city skyline softly blurred. Shot from a low angle, cinematic composition with natural warm lighting.",
  "style_applied": "cinematic",
  "enhancements_added": ["composition", "lighting", "atmosphere", "camera_angle", "depth_of_field"]
}
```

### Code Examples

::: code-group

```python [Python]
import requests

# Enhance a simple prompt before generation
response = requests.post(
    "https://apis.fotohub.app/v1/ai/enhance-prompt",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": "a cat on a roof",
        "style": "cinematic",
        "length": "medium"
    }
)

data = response.json()
enhanced = data["enhanced_prompt"]
print(f"Enhanced: {enhanced}")

# Now use the enhanced prompt for image generation
gen_response = requests.post(
    "https://apis.fotohub.app/v1/ai/generate/image",
    headers={
        "Authorization": "Bearer fh_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "prompt": enhanced,
        "model": "imagen-4-standard",
        "aspect_ratio": "16:9"
    }
)

gen_data = gen_response.json()
print(f"Image: {gen_data['images'][0]}")
```

```typescript [TypeScript]
// Enhance a simple prompt before generation
const enhanceResponse = await fetch("https://apis.fotohub.app/v1/ai/enhance-prompt", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "a cat on a roof",
    style: "cinematic",
    length: "medium"
  })
});

const enhanceData = await enhanceResponse.json();
const enhanced = enhanceData.enhanced_prompt;
console.log(`Enhanced: ${enhanced}`);

// Now use the enhanced prompt for image generation
const genResponse = await fetch("https://apis.fotohub.app/v1/ai/generate/image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fh_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: enhanced,
    model: "imagen-4-standard",
    aspect_ratio: "16:9"
  })
});

const genData = await genResponse.json();
console.log(`Image: ${genData.images[0]}`);
```

```bash [cURL]
curl -X POST "https://apis.fotohub.app/v1/ai/enhance-prompt" \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a cat on a roof",
    "style": "cinematic",
    "length": "medium"
  }'
```

:::

::: tip Combine with Generation
For a streamlined workflow, you can skip the separate enhance call and pass `enhance_prompt: true` directly in your image generation request. The API will automatically enhance the prompt before generating. This adds 1 extra credit to the generation cost.
:::

---

## Error Responses

Errors come back in the standard API shape — a `detail` string. See
[Error Handling](/api/errors) for the full contract.

### 400 — Missing or Invalid Input

Either `image_url` was absent, or one or more values in `features` is not a
recognised feature name. Nothing is charged: validation runs before billing.

```json
{ "detail": "Unknown features: sentiment. Supported: colors, faces, labels, landmarks, logos, nsfw, objects, ocr, safe_search, text" }
```

### 402 — Insufficient Credits

Credits are exhausted and the wallet cannot cover the charge.

### 424 — Analysis Failed

The image could not be analysed — most often because `image_url` is not
publicly reachable, is not a supported image type, or exceeds the 20 MB limit.
The credit is refunded automatically and the body says so:

```json
{ "detail": "Google Vision API Error: Image not found or forbidden (no credits were charged for this request)" }
```

### 429 — Rate Limit Exceeded

Image analysis falls under the default limit of 60 requests per minute (also
capped by your key's own `rate_limit_per_minute`). The `Retry-After` header says
when to retry. The rate-limiter body uses `error`, not `detail`:

```json
{ "error": "Rate limit exceeded. Please try again later." }
```

---

## Use Cases

### Accessibility

Use the `labels` and `ocr` features to generate alt text for images automatically. Combine semantic labels with extracted text to create meaningful descriptions for screen readers.

### Content Moderation

Deploy the `nsfw` feature in your upload pipeline to automatically flag or reject content that violates your platform policies. Read `nsfw.likelihood` rather than the `is_safe` flag when you need a stricter policy than "LIKELY or worse on adult, violence or racy".

### Data Extraction

Use `ocr` to digitize documents, receipts, business cards, and signage. The block-level bounding boxes allow you to reconstruct document layout and extract structured data from forms.

### Design Automation

Use the `colors` feature to extract palettes from reference images, then apply them to templates, themes, or brand assets. Each entry gives a hex value and the share of pixels it covers, so you can weight a generated theme by prominence.

### Search and Discovery

Combine `labels` and `objects` to build rich search indexes. Auto-tag uploaded content for faceted search, recommendation engines, and content similarity matching.

### Face-Aware Cropping

Use the `faces` feature to detect face positions before cropping or resizing images, ensuring faces are never cut off in thumbnails or responsive layouts. Face boxes are in pixels (`units: "pixels"`), so they can be applied to the source image directly.

---

## Pricing

| Operation | Credits | Wallet price |
|-----------|---------|--------------|
| Image analysis (any combination of features) | 1 | $0.0161 |
| Prompt enhancement | 1 | $0.0001 |

The wallet price applies only once your included credits are exhausted; while credits cover the
request, `billing.usd_charged` is `0`.

::: tip Batch Analysis
For analysing multiple images, send them as separate parallel requests rather than sequentially — but stay under 60 requests per minute, or the 61st gets a `429`. There is no idempotency-key support on this endpoint, so a blind retry of a request that already succeeded is charged again; retry only on `4xx`/`5xx`, where a failed analysis is refunded automatically.
:::
