# Virtual Try-On

The Try-On API dresses a photo of a person in a photo of a garment. You supply one person image and one garment image, say whether the garment is a top, a bottom or a one-piece, and the API returns a render of that person wearing that garment. It is a garment transfer, not a body simulation: it does not measure fit, predict size, or guarantee that fabric drapes the way the real product would. Used on model or product photography it produces catalog-grade results; used as a size advisor it will disappoint.

::: info Capabilities
- **One garment per call** — a top, a bottom, or a one-piece dress/suit
- **1–4 renders per request**, billed per output image
- **Flat-lay packshots or on-model references** both work, and you tell the API which one you sent
- **Reproducible output** via `seed`
- **Garment catalogue** — reference a stored garment by `garment_id` instead of re-uploading it
- **Person photos are not kept** — an upload is purged within 24 h; only the render is stored permanently
:::

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/ai/tryon` | API key | Submit a try-on job — returns `202` with a `job_id` |
| GET | `/v1/ai/tryon/{job_id}` | API key | Poll the job until it completes or fails |

**Base URL:** `https://apis.fotohub.app`
**Authentication:** `Authorization: Bearer fh_live_your_api_key`
**Model:** `virtual-try-on-001`

---

## Latency: about 11 seconds per image

Measured on production, not estimated: **p50 10.7 s, p95 11.9 s** for a single image, across all three garment categories. Add 2-4 s if you poll on a 3-second interval, so budget **~12-15 s** from submit to a URL you can display. Four images in one request take roughly four times as long.

`estimated_seconds` on the submit and poll responses is a conservative 8 s per image and is deliberately lower than the measured figure — treat it as a hint for a progress bar, not a deadline. Size your own timeouts off the numbers above.

::: warning This is not a realtime effect — plan your UI around it
No hosted try-on API returns in under ~5 seconds, ours included. Anyone promising you a live camera overlay is doing something else.

If you are building a storefront widget, **pre-render your popular SKUs** against a small set of model photos and serve those from your own CDN. Reserve live calls for the long tail, and always show a progress state while the job runs. Treating try-on as an instant filter produces abandoned carts, support tickets, and refund requests over "the button is broken" — it is not broken, it is thinking.
:::

## Why the API is asynchronous

Holding an HTTP connection open for ten-plus seconds is a bad deal for everyone: proxies and load balancers time it out, mobile networks drop it, and a retry after a timeout re-runs work you already paid for. So try-on is a job. You submit, get a `job_id` and a `poll_url` back immediately, and poll until the render is ready.

```
  POST /v1/ai/tryon
        │
        │  credits charged here, before the job exists
        ▼
   ┌──────────┐
   │  queued  │
   └────┬─────┘
        │  worker picks it up
        ▼
   ┌────────────┐
   │ processing │  progress: 0 → 100
   └─────┬──────┘
         │
    ┌────┴─────┐
    ▼          ▼
┌───────────┐ ┌────────┐
│ completed │ │ failed │
│  images[] │ │ error  │
└───────────┘ └────────┘
```

Billing happens at submit time, before the job row is created — so the credits are spent whether or not you ever poll. If the job cannot be queued, the charge is reversed automatically (credits refunded, or PLN returned to the wallet if the request was billed as overage).

---

## POST /v1/ai/tryon

Submit a try-on job.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `person_image_url` | string | **Yes** | — | Publicly reachable URL of the person photo. Full-body or three-quarter framing, single person, garment area unobstructed. |
| `garment_image_url` | string | Conditional | — | Publicly reachable URL of the garment photo. Required unless you pass `garment_id`. |
| `garment_id` | uuid | Conditional | — | A garment from the catalogue. Used only when `garment_image_url` is absent. Supplies the garment image, and overrides `category` and `garment_photo_type`. |
| `category` | string | No | `"tops"` | `"tops"`, `"bottoms"` or `"one-pieces"`. Any other value is rejected with `400`. |
| `garment_photo_type` | string | No | `"flat-lay"` | How the garment reference was shot: `"flat-lay"`, `"model"` or `"auto"`. |
| `num_images` | integer | No | `1` | Renders to produce, 1–4. Values outside the range are clamped, not rejected. Credits are charged per image. |
| `seed` | integer | No | random | Fixed seed for reproducible output. Same inputs plus same seed give the same render. |

Only `person_image_url` plus one of `garment_image_url` / `garment_id` are strictly required. Everything else has a working default — but `category` and `garment_photo_type` are the two fields that most affect output quality, so set them deliberately.

### Response — 202 Accepted

```json
{
  "model": "virtual-try-on-001",
  "job_id": "7c1e9f42-3a5b-4d8e-9f01-2b3c4d5e6f70",
  "status": "queued",
  "category": "tops",
  "credits_used": 2,
  "billing": {
    "method": "credits",
    "pln_charged": 0
  },
  "estimated_seconds": 8,
  "poll_url": "https://apis.fotohub.app/v1/ai/tryon/7c1e9f42-3a5b-4d8e-9f01-2b3c4d5e6f70"
}
```

`category` is echoed back because a `garment_id` may have changed it. Use the returned value, not the one you sent.

`billing.method` is `"credits"` when the cost came out of your credit balance, or `"wallet"` when credits were exhausted and the request was billed as PLN overage — in which case `pln_charged` is non-zero.

### Response — 402 Payment Required

Credits are checked and charged before the job is created, so a short balance fails the submit outright and nothing is queued.

```json
{
  "detail": "Insufficient wallet balance. Need 0.36 PLN. Credits exhausted, wallet empty. Top up to continue."
}
```

The same status is returned when a monthly overage limit is in the way:

```json
{
  "detail": "Monthly overage limit reached (50.00/50.00 PLN). Top up your wallet or increase the limit."
}
```

---

## GET /v1/ai/tryon/{job_id}

Poll a job. Returns immediately with the current state — call it in a loop with a short delay. A 2-second interval is a sensible floor; polling faster only burns rate limit.

The job must belong to the account that submitted it. Anything else — a wrong ID, another account's job, or a job that is not a try-on — returns `404`.

### Status values

| Status | Meaning |
|--------|---------|
| `queued` | Accepted and charged, not started yet |
| `processing` | Running. `progress` climbs from 0 to 100 |
| `completed` | Done. `images` holds the render URLs |
| `failed` | Not done. `error` explains why. |

### Response — in progress

```json
{
  "job_id": "7c1e9f42-3a5b-4d8e-9f01-2b3c4d5e6f70",
  "status": "processing",
  "progress": 40,
  "estimated_seconds": 8
}
```

### Response — completed

```json
{
  "job_id": "7c1e9f42-3a5b-4d8e-9f01-2b3c4d5e6f70",
  "status": "completed",
  "progress": 100,
  "estimated_seconds": 8,
  "images": [
    "https://s1.fotohub.app/storage/v1/object/public/photos/1f2e3d4c-5b6a-7980-a1b2-c3d4e5f60718/ai-gen-1769512800123-9a8b7c.png"
  ],
  "metadata": {
    "model": "virtual-try-on-001"
  }
}
```

### Response — failed

```json
{
  "job_id": "7c1e9f42-3a5b-4d8e-9f01-2b3c4d5e6f70",
  "status": "failed",
  "progress": 0,
  "estimated_seconds": 8,
  "error": "Try-on produced no image — the photo was likely blocked by a safety filter"
}
```

The most common failure is a safety filter rejecting the person photo. Retry with a different photo rather than the same one — the filter is deterministic enough that a repeat will fail the same way.

---

## The garment catalogue

A garment can be referenced instead of uploaded. Pass `garment_id` with no `garment_image_url`, and the API looks the garment up and uses its stored image.

A catalogue garment also **overrides the `category` you sent, and supplies `garment_photo_type` if you did not send one.** That is deliberate, not a quirk: those two fields drive output quality more than any other input, and a stored garment knows its own answer. A caller guessing `tops` for a jumpsuit produces a visibly worse render than the catalogue's own `one-pieces`. If you disagree with a stored garment's classification, fix the garment rather than fighting it per request — the override always wins.

An unknown `garment_id` returns `404 Garment not found`. `garment_image_url` takes precedence: if you pass both, the URL is used and the ID is ignored.

::: tip Catalogue is opt-in, URLs are the default path
No shared garments are published yet, so unless you have created your own catalogue entries, use `garment_image_url`. Every example on this page does.
:::

Garments are stored per account, with an optional shared library of system garments readable by everyone. Each entry carries a name, a category, a photo type, an image URL and an optional thumbnail — so a picker UI can render the catalogue without touching the try-on API at all.

---

## Choosing the category and photo type

### Category

| Value | Use for | Notes |
|-------|---------|-------|
| `tops` | Shirts, t-shirts, blouses, jackets, coats, sweaters | The default, and the most reliable |
| `bottoms` | Trousers, jeans, skirts, shorts | Needs the waistline visible in the person photo |
| `one-pieces` | Dresses, jumpsuits, overalls, suits worn as one garment | Use this rather than `tops` for anything covering torso and legs |

There is no "both" — a top and a bottom are two calls on two garments. Chain them by feeding the first render back in as the `person_image_url` of the second call.

### Photo type

`garment_photo_type` tells the model how much of the garment it has to infer.

| Value | Send when | Effect |
|-------|-----------|--------|
| `flat-lay` | The garment is a packshot: laid flat, on a hanger, on a plain background, no person | The whole garment is visible, so nothing is inferred. Best fidelity. **Default.** |
| `model` | The garment is worn by someone in the reference photo | The garment is separated from the reference model first, so occluded parts (a tucked hem, an arm across the chest) are reconstructed |
| `auto` | You genuinely do not know, e.g. mixed supplier feeds | Left to the model to decide. Correct when it works, wrong sometimes — prefer an explicit value |

**Flat-lay references give better renders.** If you have both a packshot and a lifestyle shot of the same product, send the packshot.

### Input photo quality

- One person, facing the camera, garment area unobstructed by arms, bags or props
- Even lighting; heavy shadow across the garment area degrades the render
- Plain or uncluttered background on the garment reference
- JPEG or PNG; both images are fetched server-side, so no upload step is needed
- Publicly reachable URLs — a signed URL that expires before the worker fetches it will fail the job

---

## Pricing

| Item | Credits | Notes |
|------|:-------:|-------|
| One output image | **2** | `virtual-try-on-001` |
| A request with `num_images: 4` | **8** | 2 credits × 4 images |

When your credit balance is exhausted, the request falls through to PLN wallet billing at **0.36 PLN per output image**. Credits are the cheaper path — see [Billing](/api/billing) for balance, top-ups and overage limits.

Credits are charged at submit, not at completion. A job that fails after being queued is **not** automatically refunded — check the `status` on your poll and treat a `failed` job as a support case if it was not your input's fault.

---

## Complete worked example

Submit, poll to completion, download the render.

::: code-group

```python [Python]
import os
import time
import requests

BASE = "https://apis.fotohub.app/v1/ai"
HEADERS = {
    "Authorization": f"Bearer {os.environ['FOTOHUB_API_KEY']}",
    "Content-Type": "application/json",
}
TERMINAL = {"completed", "failed"}


def try_on(person_url: str, garment_url: str, category: str = "tops") -> list[str]:
    submit = requests.post(f"{BASE}/tryon", headers=HEADERS, json={
        "person_image_url": person_url,
        "garment_image_url": garment_url,
        "category": category,
        "garment_photo_type": "flat-lay",
        "num_images": 1,
        "seed": 42,
    })
    if submit.status_code == 402:
        raise RuntimeError(f"out of credits: {submit.json()['detail']}")
    submit.raise_for_status()

    job = submit.json()
    print(f"queued {job['job_id']}, ~{job['estimated_seconds']}s, {job['credits_used']} credits")

    # ~11s per image, so poll rather than hold the connection open.
    deadline = time.time() + job["estimated_seconds"] * 4 + 30
    while time.time() < deadline:
        time.sleep(2)
        status = requests.get(f"{BASE}/tryon/{job['job_id']}", headers=HEADERS).json()
        print(f"  {status['status']} {status['progress']}%")
        if status["status"] in TERMINAL:
            break
    else:
        raise TimeoutError(f"job {job['job_id']} never finished")

    if status["status"] == "failed":
        raise RuntimeError(status["error"])
    return status["images"]


images = try_on(
    person_url="https://example.com/model-front.jpg",
    garment_url="https://example.com/linen-shirt-packshot.jpg",
    category="tops",
)

for i, url in enumerate(images):
    with open(f"tryon-{i}.png", "wb") as fh:
        fh.write(requests.get(url).content)
    print(f"saved tryon-{i}.png from {url}")
```

```typescript [TypeScript]
import { writeFile } from "node:fs/promises";

const BASE = "https://apis.fotohub.app/v1/ai";
const headers = {
  Authorization: `Bearer ${process.env.FOTOHUB_API_KEY}`,
  "Content-Type": "application/json",
};
const TERMINAL = ["completed", "failed"];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function tryOn(personUrl: string, garmentUrl: string, category = "tops") {
  const submit = await fetch(`${BASE}/tryon`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      person_image_url: personUrl,
      garment_image_url: garmentUrl,
      category,
      garment_photo_type: "flat-lay",
      num_images: 1,
      seed: 42,
    }),
  });

  const job = await submit.json();
  if (submit.status === 402) throw new Error(`out of credits: ${job.detail}`);
  if (!submit.ok) throw new Error(`submit failed: ${submit.status}`);

  console.log(`queued ${job.job_id}, ~${job.estimated_seconds}s, ${job.credits_used} credits`);

  // ~11s per image, so poll rather than hold the connection open.
  const deadline = Date.now() + job.estimated_seconds * 4000 + 30_000;
  let status;
  while (Date.now() < deadline) {
    await sleep(2000);
    status = await fetch(`${BASE}/tryon/${job.job_id}`, { headers }).then((r) => r.json());
    console.log(`  ${status.status} ${status.progress}%`);
    if (TERMINAL.includes(status.status)) break;
  }

  if (!status || !TERMINAL.includes(status.status)) throw new Error("job never finished");
  if (status.status === "failed") throw new Error(status.error);
  return status.images as string[];
}

const images = await tryOn(
  "https://example.com/model-front.jpg",
  "https://example.com/linen-shirt-packshot.jpg",
  "tops",
);

for (const [i, url] of images.entries()) {
  const bytes = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
  await writeFile(`tryon-${i}.png`, bytes);
  console.log(`saved tryon-${i}.png from ${url}`);
}
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

const base = "https://apis.fotohub.app/v1/ai"

type submitResp struct {
	JobID            string  `json:"job_id"`
	CreditsUsed      float64 `json:"credits_used"`
	EstimatedSeconds int     `json:"estimated_seconds"`
	Detail           string  `json:"detail"`
}

type statusResp struct {
	Status   string   `json:"status"`
	Progress int      `json:"progress"`
	Images   []string `json:"images"`
	Error    string   `json:"error"`
}

func do(req *http.Request) (*http.Response, error) {
	req.Header.Set("Authorization", "Bearer "+os.Getenv("FOTOHUB_API_KEY"))
	req.Header.Set("Content-Type", "application/json")
	return http.DefaultClient.Do(req)
}

func tryOn(personURL, garmentURL, category string) ([]string, error) {
	body, _ := json.Marshal(map[string]interface{}{
		"person_image_url":   personURL,
		"garment_image_url":  garmentURL,
		"category":           category,
		"garment_photo_type": "flat-lay",
		"num_images":         1,
		"seed":               42,
	})

	req, _ := http.NewRequest("POST", base+"/tryon", bytes.NewBuffer(body))
	resp, err := do(req)
	if err != nil {
		return nil, err
	}
	var job submitResp
	json.NewDecoder(resp.Body).Decode(&job)
	resp.Body.Close()

	if resp.StatusCode == http.StatusPaymentRequired {
		return nil, fmt.Errorf("out of credits: %s", job.Detail)
	}
	if resp.StatusCode != http.StatusAccepted {
		return nil, fmt.Errorf("submit failed: %d", resp.StatusCode)
	}
	fmt.Printf("queued %s, ~%ds, %.0f credits\n", job.JobID, job.EstimatedSeconds, job.CreditsUsed)

	// ~11s per image, so poll rather than hold the connection open.
	deadline := time.Now().Add(time.Duration(job.EstimatedSeconds*4+30) * time.Second)
	for time.Now().Before(deadline) {
		time.Sleep(2 * time.Second)

		sreq, _ := http.NewRequest("GET", base+"/tryon/"+job.JobID, nil)
		sresp, err := do(sreq)
		if err != nil {
			continue // transient; keep polling
		}
		var st statusResp
		json.NewDecoder(sresp.Body).Decode(&st)
		sresp.Body.Close()

		fmt.Printf("  %s %d%%\n", st.Status, st.Progress)
		switch st.Status {
		case "completed":
			return st.Images, nil
		case "failed":
			return nil, fmt.Errorf("try-on failed: %s", st.Error)
		}
	}
	return nil, fmt.Errorf("job %s never finished", job.JobID)
}

func main() {
	images, err := tryOn(
		"https://example.com/model-front.jpg",
		"https://example.com/linen-shirt-packshot.jpg",
		"tops",
	)
	if err != nil {
		panic(err)
	}

	for i, url := range images {
		resp, err := http.Get(url)
		if err != nil {
			panic(err)
		}
		data, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		name := fmt.Sprintf("tryon-%d.png", i)
		os.WriteFile(name, data, 0o644)
		fmt.Printf("saved %s from %s\n", name, url)
	}
}
```

```bash [cURL]
AUTH="Authorization: Bearer fh_live_your_api_key"

# 1. submit — returns 202 with a job_id and a poll_url
JOB=$(curl -sX POST https://apis.fotohub.app/v1/ai/tryon \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{
    "person_image_url": "https://example.com/model-front.jpg",
    "garment_image_url": "https://example.com/linen-shirt-packshot.jpg",
    "category": "tops",
    "garment_photo_type": "flat-lay",
    "num_images": 1,
    "seed": 42
  }' | jq -r '.job_id')

echo "queued $JOB"

# 2. poll every 2s until the job leaves the running states (~11s per image)
for _ in $(seq 1 30); do
  sleep 2
  STATE=$(curl -s "https://apis.fotohub.app/v1/ai/tryon/$JOB" -H "$AUTH")
  echo "$STATE" | jq -r '"  \(.status) \(.progress)%"'
  case "$(echo "$STATE" | jq -r .status)" in
    completed|failed) break ;;
  esac
done

# 3. download the render (or print the error)
echo "$STATE" | jq -r '.error // empty'
echo "$STATE" | jq -r '.images[]? ' | while read -r url; do
  curl -s -o "tryon-$(basename "$url")" "$url"
  echo "saved tryon-$(basename "$url")"
done
```

:::

---

## Consent and privacy — requirements, not suggestions

Try-on v1 is built for **model photography and product photography**: images you own or have a licence to, of people who agreed to be photographed for commercial use. Using it on anything else is a breach of these terms.

**You must not upload:**

- Photos of anyone who has not consented to their image being used this way
- Photos of minors, under any circumstances
- Photos of identifiable third parties scraped from social media, dating profiles, messaging apps or public web pages
- Photos intended to place someone in clothing that is sexual, degrading, or would misrepresent them

**What we do with a person photo:**

- It is a job input, not a stored asset. It is read by the worker that produces the render, and is never written to your media library.
- If you uploaded it through FOTOhub, it is deleted automatically **within 24 hours** by a scheduled purge. The window exists so one person photo can be tried against several garments in a session; it is not an archive. If you passed your own `person_image_url`, the file is yours and we never touch it.
- The render is stored in your account's storage, like any other generation output. You control its lifetime.
- Person photos are not used to train models.

**What you must do if you expose this to end users:**

1. Ask for explicit, informed consent before their photo is uploaded, and record that you asked.
2. Tell them the photo leaves their device and is processed by a third-party AI service.
3. Give them a way to delete the resulting renders.
4. Do not retain the source photo yourself longer than the session needs it.

::: warning Renders are synthetic and must be labelled
A try-on image is a generated depiction, not a photograph of that person in that garment. In a storefront, label it as a visualisation. Presenting a render as a real product photo is misleading advertising in most jurisdictions, and it will not match what arrives in the box.
:::

---

## Errors

| Status | Applies to | Meaning | What to do |
|--------|-----------|---------|-----------|
| `400` | POST | `person_image_url` missing | Send a reachable person photo URL |
| `400` | POST | Neither `garment_image_url` nor `garment_id` supplied | Send one of them |
| `400` | POST | `category` is not `tops`, `bottoms` or `one-pieces` | Use a supported category |
| `401` | both | Missing, invalid or revoked API key | Check the `Authorization: Bearer fh_live_*` header |
| `402` | POST | Not enough credits, or the monthly overage limit is reached | Top up, or raise the limit, then resubmit |
| `403` | GET | Your plan does not include image generation | Upgrade the plan |
| `404` | POST | `garment_id` does not resolve to a garment | Verify the ID |
| `404` | GET | No such job for this account, or it is not a try-on job | Verify the `job_id` came from this key |
| `429` | both | Rate limit exceeded | Back off and honour `Retry-After` |
| `500` | POST | The job could not be queued | The charge is reversed automatically; retry |

A failure inside the render itself does not show up as an HTTP error on submit — the job is accepted, then reports `status: "failed"` with an `error` on the poll. Always inspect the poll response instead of assuming a `202` means success.

---

## Related

- [Image generation](/api/image-generation) — text-to-image and the full model catalogue
- [Image editing](/api/image-editing) — masked edits, inpainting and object removal on an existing photo
- [Background Removal Pro](/api/background-removal) — clean packshots to use as garment references
- [Commerce Bridge](/integrations/commerce-bridge) — bulk catalog runs across hundreds of products
- [Billing](/api/billing) — credits, wallet overage and spending limits
- [Rate limits](/api/rate-limits) — per-plan request budgets
- [Error handling](/api/errors) — platform-wide error conventions
