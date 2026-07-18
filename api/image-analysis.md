# Image Analysis

Extract structured information from images using AI-powered analysis. Detect objects, faces, text (OCR), dominant colors, content safety (NSFW), and semantic labels. Also includes a prompt enhancement endpoint to improve generation prompts using AI.

| | |
|---|---|
| **Features** | 6 analysis types: labels, faces, nsfw, ocr, colors, objects |
| **Cost** | 1 credit (0.06 PLN) per analysis |
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
| `features` | string[] | No | `["labels"]` | Array of analysis features to run. Options: `"labels"`, `"faces"`, `"nsfw"`, `"ocr"`, `"colors"`, `"objects"`. Multiple features can be combined in a single request. |
| `language` | string | No | `"en"` | Language for label and description output. Supported: `"en"` (English), `"pl"` (Polish), `"de"` (German), `"fr"` (French), `"es"` (Spanish). OCR extracts text in any language regardless of this setting. |
| `max_labels` | integer | No | `10` | Maximum number of labels to return when using the labels feature. Range: 1-50. Labels are returned in descending confidence order. |
| `min_confidence` | number | No | `0.5` | Minimum confidence threshold (0.0-1.0) for returned results. Lower values return more results but may include less accurate detections. |

::: tip Fixed Cost
Image analysis costs a flat **1 credit (0.06 PLN)** per request, regardless of how many features you select. Analyzing all 6 features in a single request is more cost-effective than making 6 separate calls.
:::

---

## Response Format

The response includes only the features you requested. Each feature returns its results under a dedicated key in the response object.

### Full Analysis Response (All Features)

```json
{
  "credits_used": 1,
  "billing": {
    "method": "credits",
    "credits_used": 1,
    "pln_charged": 0.06
  },
  "image_url": "https://s1.fotohub.app/storage/v1/object/public/uploads/photo.jpg",
  "features_analyzed": ["labels", "faces", "nsfw", "ocr", "colors", "objects"],
  "labels": [
    { "name": "outdoor", "confidence": 0.98 },
    { "name": "mountain", "confidence": 0.95 },
    { "name": "landscape", "confidence": 0.94 },
    { "name": "nature", "confidence": 0.92 },
    { "name": "sky", "confidence": 0.91 },
    { "name": "sunset", "confidence": 0.87 },
    { "name": "clouds", "confidence": 0.82 }
  ],
  "faces": [
    {
      "bounding_box": { "x": 120, "y": 80, "width": 150, "height": 180 },
      "confidence": 0.97,
      "attributes": {
        "age_estimate": 32,
        "gender": "female",
        "emotion": "happy",
        "glasses": false,
        "beard": false
      }
    }
  ],
  "nsfw": {
    "is_safe": true,
    "scores": {
      "safe": 0.97,
      "suggestive": 0.02,
      "adult": 0.005,
      "violence": 0.003,
      "gore": 0.001
    }
  },
  "ocr": {
    "text": "Welcome to\nMountain View Lodge\nEst. 2019",
    "blocks": [
      {
        "text": "Welcome to",
        "confidence": 0.99,
        "bounding_box": { "x": 50, "y": 20, "width": 200, "height": 30 }
      },
      {
        "text": "Mountain View Lodge",
        "confidence": 0.98,
        "bounding_box": { "x": 40, "y": 55, "width": 250, "height": 35 }
      },
      {
        "text": "Est. 2019",
        "confidence": 0.95,
        "bounding_box": { "x": 80, "y": 95, "width": 120, "height": 25 }
      }
    ]
  },
  "colors": {
    "dominant": [
      { "hex": "#2D5A8E", "name": "Steel Blue", "percentage": 35.2 },
      { "hex": "#F4A460", "name": "Sandy Brown", "percentage": 22.8 },
      { "hex": "#228B22", "name": "Forest Green", "percentage": 18.5 },
      { "hex": "#F5F5DC", "name": "Beige", "percentage": 12.3 },
      { "hex": "#4A4A4A", "name": "Dark Gray", "percentage": 11.2 }
    ],
    "palette_type": "warm",
    "brightness": 0.62
  },
  "objects": [
    {
      "name": "person",
      "confidence": 0.96,
      "bounding_box": { "x": 100, "y": 60, "width": 200, "height": 400 }
    },
    {
      "name": "backpack",
      "confidence": 0.89,
      "bounding_box": { "x": 140, "y": 120, "width": 80, "height": 100 }
    },
    {
      "name": "mountain",
      "confidence": 0.94,
      "bounding_box": { "x": 0, "y": 0, "width": 1024, "height": 500 }
    }
  ],
  "metadata": {
    "input_size": "1024x768",
    "processing_time_ms": 3450
  }
}
```

---

## Feature Details

### Labels — Semantic Labels

Returns high-level semantic labels describing the image content. Labels are ranked by confidence and cover categories like scenes, activities, objects, and styles. Useful for auto-tagging, content categorization, and search indexing.

- **Returns:** Array of `{ name, confidence }` objects sorted by confidence descending.
- **Control:** Use `max_labels` and `min_confidence` to filter results.

### Faces — Face Detection

Detects faces in the image and returns bounding boxes with estimated attributes including age, gender, emotion, and accessories (glasses, beard). Supports up to 20 faces per image.

- **Returns:** Array of face objects with `bounding_box`, `confidence`, and `attributes`.
- **Emotions:** happy, sad, angry, surprised, neutral, fearful, disgusted.
- **Note:** Face detection does not perform identification or recognition. No biometric data is stored.

### NSFW — Content Safety

Evaluates the image for content safety across multiple categories. Returns a boolean safety flag and detailed confidence scores for each category. Use this to moderate user-uploaded content or validate AI-generated images.

- **Categories:** safe, suggestive, adult, violence, gore.
- **Threshold:** `is_safe` is true when all unsafe categories score below 0.15.
- **Use case:** User upload moderation, generated content filtering, content policy enforcement.

### OCR — Text Extraction

Extracts all visible text from the image using optical character recognition. Returns both the full concatenated text and individual text blocks with positions and confidence scores. Supports printed and handwritten text in any language.

- **Returns:** Full text string plus array of blocks with position data.
- **Languages:** Auto-detects text language. Works with Latin, Cyrillic, CJK, Arabic, and more.
- **Best for:** Document digitization, receipt scanning, sign reading, watermark detection.

### Colors — Color Palette

Extracts the dominant color palette from the image. Returns up to 5 dominant colors with hex values, human-readable names, and percentage coverage. Also includes palette type classification and overall brightness score.

- **Returns:** Array of dominant colors plus `palette_type` and `brightness`.
- **Palette types:** warm, cool, neutral, vibrant, muted, monochrome.
- **Use case:** Design tools, theme generation, color matching, accessibility checks.

### Objects — Object Detection

Detects and localizes individual objects in the image with bounding boxes. Returns object class names, confidence scores, and pixel-level positions. Supports 600+ object categories from the COCO and Open Images vocabularies.

- **Returns:** Array of objects with `name`, `confidence`, and `bounding_box` coordinates.
- **Coordinates:** Bounding box in pixels (x, y, width, height) relative to original image dimensions.
- **Max objects:** Up to 50 objects per image, filtered by `min_confidence`.

---

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
    print(f"  {color['hex']} ({color['name']}): {color['percentage']}%")
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
  console.log(`  ${color.hex} (${color.name}): ${color.percentage}%`);
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
    print(f"[{block['confidence']:.2f}] '{block['text']}' "
          f"at ({block['bounding_box']['x']}, {block['bounding_box']['y']})")
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
  console.log(
    `[${block.confidence.toFixed(2)}] '${block.text}' ` +
    `at (${block.bounding_box.x}, ${block.bounding_box.y})`
  );
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
    "pln_charged": 0.06
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

### 400 — Invalid Feature

One or more values in the `features` array is not a valid feature name. Valid options: labels, faces, nsfw, ocr, colors, objects.

### 422 — Image Not Accessible

The provided `image_url` could not be fetched. Ensure the URL is publicly accessible, returns a valid image content type, and the file is under 20MB.

### 429 — Rate Limit Exceeded

Image analysis is limited to 60 requests per minute. The `Retry-After` header indicates when to retry.

### Error Response Example

```json
{
  "error": {
    "code": "invalid_request",
    "message": "Invalid feature: 'sentiment'. Valid features: labels, faces, nsfw, ocr, colors, objects",
    "status": 400,
    "details": {
      "invalid_features": ["sentiment"],
      "valid_features": ["labels", "faces", "nsfw", "ocr", "colors", "objects"]
    }
  }
}
```

---

## Use Cases

### Accessibility

Use the `labels` and `ocr` features to generate alt text for images automatically. Combine semantic labels with extracted text to create meaningful descriptions for screen readers.

### Content Moderation

Deploy the `nsfw` feature in your upload pipeline to automatically flag or reject content that violates your platform policies. The multi-category scoring allows you to set custom thresholds per category.

### Data Extraction

Use `ocr` to digitize documents, receipts, business cards, and signage. The block-level bounding boxes allow you to reconstruct document layout and extract structured data from forms.

### Design Automation

Use the `colors` feature to extract palettes from reference images, then apply them to templates, themes, or brand assets. The palette type classification helps match images to design contexts.

### Search and Discovery

Combine `labels` and `objects` to build rich search indexes. Auto-tag uploaded content for faceted search, recommendation engines, and content similarity matching.

### Face-Aware Cropping

Use the `faces` feature to detect face positions before cropping or resizing images, ensuring faces are never cut off in thumbnails or responsive layouts.

---

## Pricing

| Operation | Cost |
|-----------|------|
| Image analysis (any combination of features) | 1 credit (0.06 PLN) |
| Prompt enhancement | 1 credit (0.06 PLN) |

::: tip Batch Analysis
For analyzing multiple images, send them as separate parallel requests rather than sequentially. The API supports up to 60 concurrent analysis requests per minute, so you can process a batch of images efficiently. Use the `X-Idempotency-Key` header to safely retry failed requests without double-charging.
:::
