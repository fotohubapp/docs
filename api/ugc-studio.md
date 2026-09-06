# UGC Studio API

FotoHUB UGC Studio (`/ugc`) automates the end-to-end creation of vertical direct-response User-Generated Content (UGC) video ads for TikTok, Instagram Reels, and YouTube Shorts.

The pipeline converts an e-commerce product URL or brief into creative angles, spoken scripts, multi-scene blueprints, AI actor performances with lip-sync, and rendered video batches.

Base URL: `https://apis.fotohub.app/ugc`

---

## End-to-End UGC Workflow

```
┌──────────────┐     ┌────────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ Read Brief   │ ──► │ Make Angles    │ ──► │ Write Script │ ──► │ Cast Actor  │ ──► │ Render Ad /  │
│ (Product URL)│     │ (12 approaches)│     │ (Beat order) │     │ (BytePlus)  │     │ Batch Matrix │
└──────────────┘     └────────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
```

---

## Creative Ideation & Scripting

### 1. Ingest Product Brief

Parse an online store product page (Shopify, Amazon, WooCommerce) into a structured creative brief.

```
POST /ugc/creative/brief
```

#### Request Payload
```json
{
  "url": "https://example-skincare.com/products/hydra-serum"
}
```

#### Response Example
```json
{
  "product_name": "Hydra Glow Vitamin C Serum",
  "category": "Beauty & Personal Care",
  "value_propositions": [
    "Brightens dull skin in 7 days",
    "Contains 15% pure L-ascorbic acid and hyaluronic acid",
    "Fragrance-free and sensitive skin safe"
  ],
  "target_audience": "Women 22-38 struggling with hyperpigmentation",
  "disallowed_claims": ["Cures acne", "Permanent results"]
}
```

---

### 2. Generate Creative Angles

Produce distinct direct-response angles based on proven advertising frameworks.

```
POST /ugc/creative/angles
```

#### Parameters
- `brief`: Structured brief object.
- `count`: Number of angles to generate (default: 12).
- `formats`: Optional filter for formats (`problem_solution`, `unboxing`, `testimonial`, `myth_busting`, `before_after`, `secret_hack`).

---

### 3. Generate Spoken Script & Shot List

Turns an angle into a timed spoken script with visual action notes.

```
POST /ugc/creative/script
```

#### Parameters
- `brief`: Brief object.
- `angle`: Selected angle object.
- `speed`: Voice speaking rate (default `1.0`).

---

## AI Actors & Casting

### 1. Preview Candidates

Generate candidate looks from casting axes before committing to registration:

```
POST /ugc/actors/preview
```

#### Request Parameters
- `axes`: Casting attributes, e.g.:
  ```json
  {
    "type": "genz_skincare",
    "age": "early_20s",
    "gender": "female",
    "ethnicity": "latina",
    "vibe": "relatable_ugc"
  }
  ```
- `count`: 4 (generates 4 visual candidate options).

---

### 2. Register Actor Likeness

Registers the chosen character face with BytePlus so it can be animated and lip-synced.

```
POST /ugc/actors
```

#### Request Parameters
- `name`: Actor display name.
- `still_url`: The approved still image from `/preview`.
- `sheet_views`: Number of multi-angle views to render for 3D consistency.
- `consent_id`: Consent verification receipt (required if using real person photo uploads).

::: info Compliance & Likeness Removal
Calling `DELETE /ugc/actors/{id}` unregisters the face from BytePlus infrastructure immediately to honor compliance and right-to-be-forgotten obligations.
:::

---

## Rendering & Batch Variant Matrix

### 1. Estimate Render Cost

Estimate credit consumption before starting video generation:

```
POST /ugc/estimate
```

Pass the blueprint document to receive an exact cost breakdown for voice synthesis, actor lip-sync, B-roll, and final compositing.

---

### 2. Render Video Ad

```
POST /ugc/projects/{project_id}/render
```

#### Request Parameters
- `idempotency_key`: Unique client key to prevent double charges.
- `variant_label`: Label for tracking (e.g. `angle_a_hook_1`).
- `product_urls`: Map of asset slots to product image URLs.

Returns HTTP `202 Accepted` with `job_id`. Poll status with `GET /ugc/jobs/{job_id}`.

---

### 3. Batch Variant Testing Matrix

Test 10 to 30 creative variations by cross-multiplying actors, hooks, and call-to-actions under a strict spend ceiling.

```
POST /ugc/projects/{project_id}/batch
```

#### Parameters
```json
{
  "axes": {
    "actors": [
      { "actor_id": "act_sarah_01", "label": "Sarah" },
      { "actor_id": "act_maya_02", "label": "Maya" }
    ],
    "hooks": [
      { "id": "hook_1", "text": "Stop scrolling if your skin feels dry!" },
      { "id": "hook_2", "text": "Dermatologists are gatekeeping this secret." }
    ]
  },
  "max_spend_usd": 25.00,
  "on_over": "truncate"
}
```
