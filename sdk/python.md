# Python SDK

The official Python SDK for the **FOTOhub Creative AI Platform & Compute Cloud**. It provides a fully typed, asynchronous and synchronous interface for all FOTOhub platform services: multimodal generative AI (images, video, audio, 3D, shorts), cloud compute instance provisioning (EC2 A10G/T4 in Frankfurt), Firecracker microVM sandboxes, S3 object storage, autonomous agents, and enterprise billing.

Built on modern Python standards (**Python 3.8+**, recommended **Python 3.10+ / 3.11 / 3.12**), the SDK features both synchronous (`FotoHub`) and asynchronous (`AsyncFotoHub`) clients, Pydantic v2 data models, automatic retries with jittered exponential backoff, HTTP/2 multiplexing, connection pooling, and strict type safety with `mypy` and `pyright` support.

---

## Installation

Install the base package via `pip`, `uv`, or `poetry`:

::: code-group

```bash [pip]
pip install fotohub
```

```bash [uv]
uv add fotohub
```

```bash [poetry]
poetry add fotohub
```

:::

### Optional Dependencies & Feature Extras

Tailor the installation to your project requirements using modular extras:

```bash
# Asynchronous support with httpx HTTP/2 and aiofiles
pip install "fotohub[async]"

# Cloud Compute & AWS Infrastructure tooling (boto3, paramiko)
pip install "fotohub[compute]"

# Cryptographic webhook signature verification (cryptography)
pip install "fotohub[webhooks]"

# Full Pydantic v2 schemas and runtime validation
pip install "fotohub[types]"

# All features combined
pip install "fotohub[all]"
```

| Extra | Included Packages | Primary Use Case |
|:---|:---|:---|
| `async` | `httpx[http2]>=0.27.0`, `aiofiles>=23.2.0` | High-throughput asynchronous pipelines, FastAPI, asyncio event loops |
| `compute` | `boto3>=1.34.0`, `paramiko>=3.4.0` | Direct EC2/EBS management, automated SSH key injection, SSM scripts |
| `webhooks` | `cryptography>=42.0.0` | Ed25519 and HMAC-SHA256 signature verification for inbound webhooks |
| `types` | `pydantic>=2.7.0` | Deep request/response model validation and IDE autocompletion |
| `all` | All of the above | Full-stack production applications and developer platforms |

---

## Quick Start

Initialize the client and run generative, compute, and sandbox workflows in seconds:

```python
import os
from fotohub import FotoHub

# 1. Initialize client (reads FOTOHUB_API_KEY from environment)
client = FotoHub()

# 2. Generate a photorealistic image
result = client.images.generate(
    prompt="Cinematic shot of an astronaut walking through a neon rainforest, 8k resolution, photorealistic",
    model="seedream-5-0-260128",
    aspect_ratio="16:9",
    guidance_scale=7.5
)

print(f"Generated Image: {result.images[0].url}")
print(f"Wallet Deducted: ${result.cost_usd:.6f} USD")
print(f"Remaining Balance: ${result.billing.balance_usd:.2f} USD")

# 3. Check GPU compute catalog (NVIDIA A10G & T4 instances in Frankfurt)
catalog = client.compute.catalog.list()
for machine in catalog.machines[:3]:
    print(f"GPU: {machine.instance_type} - Spot: ${machine.spot_price_usd:.4f}/hr | On-Demand: ${machine.hourly_rate_usd:.4f}/hr")

# 4. Execute a Firecracker MicroVM Python sandbox task (<200ms cold start)
sandbox_run = client.sandbox.execute(
    code="""
import numpy as np
data = np.random.normal(loc=50, scale=10, size=1000)
result = {"mean": float(np.mean(data)), "p95": float(np.percentile(data, 95))}
print(f"Calculated: {result}")
"""
)

print(f"Sandbox Output: {sandbox_run.output.strip()}")
print(f"Sandbox Latency: {sandbox_run.execution_ms}ms")
```

---

## Client Architecture & Initialization

The SDK provides two primary entry points:
- `FotoHub`: Synchronous blocking client using persistent HTTP connection pools.
- `AsyncFotoHub`: Asynchronous non-blocking client designed for `asyncio`, FastAPI, and high-concurrency event loops.

```
                    ┌────────────────────────┐
                    │   FotoHub / Async      │
                    │   (Unified Client)     │
                    └───────────┬────────────┘
                                │
   ┌──────────────┬─────────────┼──────────────┬──────────────┐
   │              │             │              │              │
┌──▼───────┐ ┌────▼─────┐ ┌─────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│  images  │ │  videos  │ │  compute   │ │  sandbox   │ │  storage   │
│  audio   │ │  shorts  │ │  network   │ │  agents    │ │  wallet    │
└──────────┘ └──────────┘ └────────────┘ └────────────┘ └────────────┘
```

### Full Configuration Options

```python
from fotohub import FotoHub

client = FotoHub(
    api_key="fh_live_your_production_api_key_here",
    base_url="https://apis.fotohub.app",       # Primary production gateway
    compute_url="https://apis.fotohub.app/compute/v1", # Dedicated Compute control plane
    timeout=60.0,                              # Request timeout in seconds
    max_retries=4,                             # Auto-retries on 429, 502, 503, 504
    default_headers={"X-Custom-Client": "MyService/2.4.0"},
    proxy="http://proxy.internal.corp:8080",   # Optional HTTP/HTTPS proxy
    http2=True                                 # Enable HTTP/2 multiplexing
)
```

### Environment Variables Reference

| Environment Variable | Default | Description |
|:---|:---|:---|
| `FOTOHUB_API_KEY` | *None* (Required) | API key, starting with `fh_live_`. |
| `FOTOHUB_BASE_URL` | `https://apis.fotohub.app` | Base REST API URL. |
| `FOTOHUB_COMPUTE_URL`| `https://apis.fotohub.app/compute/v1` | Dedicated compute gateway URL. |
| `FOTOHUB_TIMEOUT` | `60.0` | Default timeout in seconds for API calls. |
| `FOTOHUB_MAX_RETRIES`| `3` | Maximum automatic retries on transient errors. |
| `FOTOHUB_HTTP_PROXY` | *None* | Outbound proxy URL for corporate networks. |
| `FOTOHUB_LOG_LEVEL` | `INFO` | Internal SDK logging (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |

::: tip Production Best Practice: Secret Rotation & Zero Hardcoding
Never hardcode API keys in version control. Use `.env` files in development (with `.gitignore`) and cloud secret managers (AWS Secrets Manager, GCP Secret Manager, Vault) in production:
```bash
export FOTOHUB_API_KEY="fh_live_9a7b8c..."
```
:::

---

## Type-Safe Interfaces & Pydantic V2 Schemas

The SDK provides 100% type coverage with Pydantic v2 schemas and TypedDict interfaces. This enables runtime parameter validation, deep IDE autocompletion, and zero serialization overhead.

### Core Type Definitions

```python
from typing import List, Optional, Dict, Any, Union, Literal
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime

class GeneratedImage(BaseModel):
    """Represents a single rendered image asset."""
    url: str = Field(..., description="CDN URL of the generated image asset")
    width: int = Field(..., description="Width in pixels")
    height: int = Field(..., description="Height in pixels")
    content_type: str = Field("image/png", description="MIME type")
    seed_used: Optional[int] = Field(None, description="Seed used for this variation")

class BillingInfo(BaseModel):
    """Pure USD prepaid wallet deduction details."""
    cost_usd: float = Field(..., description="USD debited from wallet for this specific operation")
    balance_usd: Optional[float] = Field(None, description="Remaining wallet balance after operation")
    currency: Literal["USD"] = Field("USD", description="Always USD")
    method: Literal["wallet"] = Field("wallet", description="Deduction method")

class ImageResult(BaseModel):
    """Response returned by client.images.generate()."""
    model: str = Field(..., description="Model ID executed")
    cost_usd: float = Field(..., description="USD amount charged")
    currency: Literal["USD"] = Field("USD", description="Currency of charge")
    billing: BillingInfo = Field(..., description="Wallet ledger state")
    images: List[GeneratedImage] = Field(..., description="List of generated image variations")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Generation parameters and timestamps")

class VideoResult(BaseModel):
    """Response returned by client.videos.generate()."""
    job_id: Optional[str] = Field(None, description="Job ID if asynchronous")
    model: str = Field(..., description="Model ID executed")
    status: Literal["queued", "processing", "completed", "failed"]
    video_url: Optional[str] = Field(None, description="Final rendered MP4 URL")
    duration: float = Field(..., description="Duration in seconds")
    aspect_ratio: str = Field(..., description="Aspect ratio of video")
    cost_usd: float = Field(..., description="USD amount charged")
    has_audio: bool = Field(False, description="Whether soundtrack is attached")
    billing: BillingInfo = Field(..., description="Wallet billing details")

class SeedanceResult(BaseModel):
    """Response returned by client.videos.generate_seedance()."""
    job_id: str = Field(..., description="Seedance pipeline job ID")
    status: Literal["completed", "failed", "processing"]
    video_url: Optional[str] = Field(None, description="Rendered video URL")
    duration: float = Field(..., description="Duration in seconds (up to 30s)")
    resolution: str = Field(..., description="720p or 4K")
    aspect_ratio: str = Field(..., description="Aspect ratio format")
    has_audio: bool = Field(True, description="Native audio included")
    tokens_consumed: int = Field(..., description="Input and output tokens billed")
    cost_usd: float = Field(..., description="Total USD cost")
    billing: BillingInfo = Field(..., description="Wallet billing state")

class AudioResult(BaseModel):
    """Response returned by client.audio.* operations."""
    audio_url: str = Field(..., description="CDN URL of generated audio file")
    duration: float = Field(..., description="Duration in seconds")
    format: str = Field("mp3", description="Audio container format")
    cost_usd: float = Field(..., description="USD charged")
    billing: BillingInfo

class Model3DResult(BaseModel):
    """Response returned by client.models_3d.wait_for_completion()."""
    job_id: str = Field(..., description="3D meshing job ID")
    status: Literal["pending", "processing", "completed", "failed"]
    model_url: Optional[str] = Field(None, description="GLB mesh URL")
    usdz_url: Optional[str] = Field(None, description="Apple AR QuickLook USDZ URL")
    format: str = Field("glb", description="Default container format")
    vertex_count: Optional[int] = Field(None, description="Polygon vertex count")
    face_count: Optional[int] = Field(None, description="Polygon triangle count")
    cost_usd: float = Field(..., description="USD charged")
    billing: BillingInfo

class ComputeInstance(BaseModel):
    """Represents a live or stopped EC2 GPU/CPU compute instance."""
    id: str = Field(..., description="FOTOhub Instance ID")
    name: str = Field(..., description="Human-readable node label")
    instance_type: str = Field(..., description="AWS machine type (e.g. g5.xlarge)")
    status: Literal["provisioning", "running", "stopping", "stopped", "terminating", "terminated"]
    region: str = Field("eu-central-1", description="AWS Region")
    availability_zone: str = Field("eu-central-1a", description="Availability Zone")
    public_ip: Optional[str] = Field(None, description="Public IPv4 address")
    private_ip: Optional[str] = Field(None, description="Private VPC IPv4 address")
    spot_instance: bool = Field(False, description="Whether instance is Spot discounted")
    hourly_rate_usd: float = Field(..., description="Hourly rate in USD")
    created_at: datetime
    max_runtime_hours: int = Field(..., description="Safety auto-stop threshold")

class SandboxResult(BaseModel):
    """Result of Firecracker MicroVM Python code execution."""
    ok: bool = Field(..., description="Whether script finished without exception")
    output: str = Field(..., description="Captured stdout or sentinel output")
    error: Optional[str] = Field(None, description="Captured stderr or exception trace")
    result: Optional[Dict[str, Any]] = Field(None, description="Parsed __FOTOHUB_RESULT__ object")
    execution_ms: int = Field(..., description="Execution time in milliseconds")
    memory_mb: int = Field(..., description="Peak RAM usage in megabytes")
    cost_usd: float = Field(0.00008, description="Fixed execution cost")

class ShortsJob(BaseModel):
    """Asynchronous vertical clipping pipeline state."""
    job_id: str
    status: Literal["queued", "processing", "completed", "failed"]
    clips_count: int
    step_index: int = Field(..., description="Current stage in 11-step pipeline")
    progress_pct: float
    clips: List[Dict[str, Any]] = []

class LipSyncResult(BaseModel):
    """Neural lip retargeting output."""
    video_url: str = Field(..., description="Synchronized output video URL")
    engine: str = Field("latentsync", description="Engine used")
    duration: float = Field(..., description="Duration in seconds")
    cost_usd: float
    billing: BillingInfo
```

---

## Image Generation & Editing (`client.images`)

Generate photorealistic imagery from text, edit existing visuals, and apply professional studio enhancements.

### Basic Generation

```python
from fotohub import FotoHub

client = FotoHub()

response = client.images.generate(
    prompt="A modern Scandinavian living room, morning light pouring through floor-to-ceiling windows, minimal furniture, photorealistic",
    model="seedream-5-0-260128",
    aspect_ratio="16:9",
    num_images=2,
    seed=102938
)

for idx, img in enumerate(response.images):
    print(f"Image {idx+1}: {img.url} ({img.width}x{img.height})")

print(f"USD Charged: ${response.cost_usd:.4f}")
print(f"Available Balance: ${response.billing.balance_usd:.2f}")
```

### Multiple Variations with Negative Prompts

```python
response = client.images.generate(
    prompt="Artisan ceramic coffee mug on rustic wooden table, cinematic steam, macro photography",
    model="imagen-4-ultra",
    negative_prompt="blurry, distorted, plastic, oversaturated, text, watermark",
    num_images=4,
    guidance_scale=8.0,
    seed=42
)

for i, img in enumerate(response.images):
    print(f"Variation {i+1}: {img.url}")
```

### With Explicit Pixel Dimensions

```python
response = client.images.generate(
    prompt="Panoramic banner of futuristic Tokyo skyline, neon lights reflecting on wet asphalt",
    model="flux-2-pro",
    width=1920,
    height=800,
    output_format="webp"
)

print(f"Banner URL: {response.images[0].url}")
```

### Parameters Reference

| Parameter | Type | Default | Description |
|:---|:---|:---|:---|
| `prompt` | `str` | *Required* | Detailed prompt describing visual contents, lighting, and composition. |
| `model` | `str` | `"seedream-5-0-260128"` | Model identifier (e.g., `seedream-5-0-260128`, `imagen-4-ultra`, `flux-2-pro`, `flux-2-max`). |
| `negative_prompt` | `Optional[str]` | `None` | Unwanted elements (blurry, low quality, artifacts). |
| `aspect_ratio` | `str` | `"1:1"` | Shorthand ratios: `"1:1"`, `"16:9"`, `"9:16"`, `"4:3"`, `"3:4"`, `"21:9"`. |
| `width` / `height` | `Optional[int]` | `None` | Exact pixel dimensions (overrides `aspect_ratio`). |
| `num_images` | `int` | `1` | Number of image variations to generate (1 to 4). |
| `guidance_scale` | `float` | `7.0` | Classifier-Free Guidance (CFG) scale (1.0 to 20.0). |
| `seed` | `Optional[int]` | `None` | Deterministic seed for reproducible generation. |
| `output_format` | `str` | `"png"` | Output encoding: `"png"`, `"jpeg"`, or `"webp"`. |
| `webhook_url` | `Optional[str]` | `None` | Optional HTTPS endpoint to receive completion payloads. |

### Stability AI Editing Tools

Inpaint, outpaint, remove backgrounds, and upscale using native Stability AI tool integrations:

```python
# 1. High-Resolution Upscaling (2x / 4x)
upscaled = client.images.stability_upscale(
    image_url="https://s1.fotohub.app/storage/v1/object/public/images/input.jpg",
    mode="creative",       # "fast" (2x instant) or "creative" (4x generative detail)
    output_format="webp"
)
print(f"Upscaled Asset: {upscaled.url}")

# 2. Studio Background Removal
isolated = client.images.stability_remove_background(
    image_url="https://s1.fotohub.app/storage/v1/object/public/products/shoe.jpg",
    output_format="png"    # Returns RGBA PNG with transparent alpha channel
)
print(f"Transparent PNG: {isolated.url}")

# 3. Canvas Outpainting (Expanding boundaries)
extended = client.images.stability_outpaint(
    image_url="https://s1.fotohub.app/storage/v1/object/public/photos/portrait.jpg",
    left=300,
    right=300,
    prompt="A bustling Tokyo pedestrian crossing at night with neon lights"
)
print(f"Extended Canvas: {extended.url}")

# 4. Content-Aware Eraser
cleaned = client.images.stability_erase(
    image_url="https://s1.fotohub.app/storage/v1/object/public/photos/street.jpg",
    mask_url="https://s1.fotohub.app/storage/v1/object/public/masks/car_mask.png"
)
print(f"Object Erased: {cleaned.url}")

# 5. Search and Replace Object
replaced = client.images.stability_search_replace(
    image_url="https://s1.fotohub.app/storage/v1/object/public/photos/living_room.jpg",
    search_prompt="the grey couch",
    replace_prompt="a luxurious vintage green velvet Chesterfield sofa"
)
print(f"Replaced Image: {replaced.url}")

# 6. Object Recoloring
recolored = client.images.stability_recolor(
    image_url="https://s1.fotohub.app/storage/v1/object/public/photos/dress.jpg",
    prompt="make it deep royal purple",
    target_object="the silk evening gown"
)
print(f"Recolored Image: {recolored.url}")
```

---

## Video Generation (`client.videos`)

Generate cinematic video assets using state-of-the-art models including Google Veo 3.1, ByteDance Seedance 2.5, OpenAI Sora 2, Hailuo O2, and Wan 2.2.

### Synchronous Video Generation (Veo 3.1, Sora 2, Wan 2.2)

```python
# Video calls block until generation completes and return the ready video URL
video = client.videos.generate(
    prompt="FPV drone diving through a snow-covered mountain gorge at dusk, cinematic 4K, realistic physics",
    model="veo-3.1-generate-001",
    duration=5,
    aspect_ratio="16:9"
)

print(f"Rendered Video: {video.video_url}")
print(f"Duration: {video.duration}s")
print(f"Cost: ${video.cost_usd:.4f} USD")
```

### Image-to-Video Animation

```python
video = client.videos.generate(
    prompt="Camera slowly orbits around the statue, cinematic lighting with lens flare",
    model="veo-3.1-generate-001",
    image_url="https://s1.fotohub.app/storage/v1/object/public/sculptures/david.jpg",
    duration=5,
    aspect_ratio="16:9"
)
print(f"Animated Video: {video.video_url}")
```

### Video Parameters

| Parameter | Type | Required | Description |
|:---|:---|:---|:---|
| `prompt` | `str` | Yes | Text description of the video |
| `model` | `str` | Yes | Model ID (e.g., `veo-3.1-generate-001`, `veo-2.0-generate-001`, `kling-v3`, `hailuo-o2`, `sora-2`, `wan2.2-t2v-plus`) |
| `duration` | `int` | No | Duration in seconds (model-dependent, default: 5) |
| `aspect_ratio` | `str` | No | Aspect ratio (`16:9`, `9:16`, `1:1`) |
| `image_url` | `str` | No | Start frame image URL for image-to-video |

---

## ByteDance Seedance (Long Clips & Video Editing)

Seedance 2.5 supports **up to 30 seconds of continuous generation in a single call**, native audio track synthesis, and video-to-video editing.

```python
# 1. 30-Second Text-to-Video with Native Soundtrack
long_clip = client.videos.generate_seedance(
    prompt=(
        "A chef plates a dish in a warm restaurant kitchen: hands dust herbs over "
        "seared scallops, steam rises, the camera pushes in slowly."
    ),
    duration=30,            # 4-30s on 2.5; nothing else reaches past 15s
    resolution="720p",      # 480p | 720p on 2.5
    aspect_ratio="16:9",
    generate_audio=True     # Included at zero extra cost on Seedance 2.5
)

print(f"Seedance Video: {long_clip.video_url}")
print(f"Cost: ${long_clip.cost_usd:.4f} USD")

# 2. Video-to-Video Transformation (Style / Lighting Shift)
edited_video = client.videos.generate_seedance(
    prompt="Replace the grey sky with a clear blue sky and warm afternoon light",
    reference_videos=["https://s1.fotohub.app/storage/v1/object/public/videos/source.mp4"],
    duration=-1             # -1 matches source video length automatically
)

print(f"Edited Video: {edited_video.video_url}")

# 3. Persistent Character Biometric Consistency
face_asset = client.videos.register_video_asset(
    "https://s1.fotohub.app/storage/v1/object/public/photos/face.jpg"
)

character_video = client.videos.generate_seedance(
    prompt="The same woman walks through a night market, neon on wet pavement",
    duration=15,
    asset_ids=[face_asset.uri]
)
print(f"Consistent Character Video: {character_video.video_url}")
```

### Seedance Parameters Reference

| Parameter | Type | Description |
|:---|:---|:---|
| `prompt` | `str` | Text description of the video |
| `model` | `str` | Default `seedance-2-5`. Others: `seedance-2-0-pro`, `seedance-2-0-fast` |
| `duration` | `int` | 2.5: 4-30s. 2.0: 4-15s. `-1` matches a source clip |
| `resolution` | `str` | 2.5: `480p`, `720p`. 2.0 Pro also `1080p`, `4K` |
| `aspect_ratio` | `str` | `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `21:9`, `adaptive` |
| `generate_audio` | `bool` | Native soundtrack. Free on 2.5 |
| `image_url` | `str` | First frame image |
| `reference_videos` | `list` | Up to 10 on 2.5 (3 on 2.0) |
| `asset_ids` | `list` | Pre-registered `asset://` portrait ids |
| `poll_interval` | `float` | Seconds between status checks (default 10.0) |
| `timeout` | `float` | Max seconds to wait (default 1800.0) |

---

## Music, Audio, SFX & Text-to-Speech (`client.audio`)

Synthesize broadcast-quality music, contextual Foley sound effects, and multilingual speech.

```python
# 1. Instrumental Music Generation
track = client.audio.generate_music(
    prompt="Chill lo-fi hip hop beat with vinyl crackle and smooth electric piano",
    duration=60,            # In seconds
    genre="lofi",
    instrumental=True
)
print(f"Music Track: {track.audio_url} (Cost: ${track.cost_usd:.4f})")

# 2. Cinematic Foley & Sound Effects
sfx = client.audio.generate_sfx(
    prompt="Thunder rolling in the distance with light rain on gravel",
    duration=10
)
print(f"SFX URL: {sfx.audio_url}")

# 3. Multilingual Neural Speech (Gemini TTS / Azure)
speech = client.audio.synthesize_speech(
    text="Welcome to FOTOhub, the creative AI platform and compute cloud.",
    voice="alloy",
    speed=1.0,
    engine="gemini"         # "gemini" (30 voices) or "azure" (700+ voices)
)
print(f"Speech URL: {speech.audio_url}")

# 4. Whisper Audio Transcription with Timestamps
transcription = client.audio.transcribe(
    audio_url="https://s1.fotohub.app/storage/v1/object/public/podcasts/clip.mp3",
    language="en",
    timestamp_granularities=["word", "segment"]
)
print(f"Transcribed: {transcription.text[:100]}...")
```

---

## 3D Geometry Generation (`client.models_3d`)

Transform 2D images or text prompts into game-ready 3D meshes with quad topology and PBR materials.

```python
import base64
from fotohub import FotoHub

client = FotoHub()

# 1. Image to 3D
with open("product.jpg", "rb") as f:
    b64_image = base64.b64encode(f.read()).decode("utf-8")

result = client.models_3d.create_job(
    mode="image-to-3d",
    model="fh-pro-3d",      # Quad remeshing + PBR materials
    image=b64_image,
    format="glb"
)

# Wait for completion
completed = client.models_3d.wait_for_completion(result.job_id, poll_interval=3.0, timeout=120.0)
print(f"3D Model URL: {completed.model_url}")
print(f"Cost: ${completed.cost_usd:.4f} USD")

# 2. Text to 3D
text_3d = client.models_3d.create_job(
    mode="text-to-3d",
    model="fh-text-3d",
    prompt="A medieval stone castle with towers",
    quality="high",
    format="glb"
)
```

---

## Cloud Compute & On-Demand GPUs (`client.compute`)

Provision, manage, and scale real AWS EC2 instances (NVIDIA A10G and T4) in **Frankfurt (`eu-central-1`)** directly from Python.

### Querying the Live Hardware Catalog

```python
from fotohub import FotoHub

client = FotoHub()

catalog = client.compute.catalog.list()

print(f"Available Instance Types: {len(catalog.machines)}")
for m in catalog.machines:
    if m.gpu_count > 0:
        print(f"[{m.instance_type}] {m.name}")
        print(f"  GPU: {m.gpu_count}x {m.gpu} ({m.vram}) | vCPU: {m.vcpu} | RAM: {m.ram_gb}GB")
        print(f"  Spot: ${m.spot_price_usd:.4f}/hr | On-Demand: ${m.hourly_rate_usd:.4f}/hr ({m.currency})")
```

### Preflight Cost Estimation & Eligibility

```python
# 1. Check wallet eligibility (must have >= $0.50 USD)
eligibility = client.compute.instances.check_eligibility()
if not eligibility.allowed:
    print(f"Cannot provision: {eligibility.reason} (Balance: ${eligibility.wallet_balance:.2f} USD)")
    exit(1)

# 2. Preflight cost estimation
quote = client.compute.instances.estimate_cost(
    catalog_id="g5.xlarge",
    root_volume_type="gp3",
    root_volume_size_gb=100,
    additional_volume_size_gb=200,
    spot_instance=True,
    max_runtime_hours=12
)

print(f"Machine Rate: ${quote.estimate.machine_per_hour:.4f}/hr")
print(f"Storage Rate: ${quote.estimate.ebs_per_hour:.4f}/hr")
print(f"Total Hourly: ${quote.estimate.hourly_rate_usd:.4f}/hr")
print(f"Estimated 12h Run: ${quote.estimate.total_estimated_cost_usd:.2f} USD")
```

### Provisioning an On-Demand or Spot GPU Instance

```python
instance = client.compute.instances.provision(
    catalog_id="g5.xlarge",                  # NVIDIA A10G 24GB
    name="pytorch-training-node-01",
    region="eu-central-1",
    availability_zone="eu-central-1a",
    spot_instance=True,                      # 62% Spot market discount
    max_runtime_hours=8,                     # Safety ceiling: auto-stop after 8h
    root_volume_type="gp3",
    root_volume_size_gb=150,
    os_image="ubuntu-2204-lts",
    install_presets=["docker", "python-ml", "monitoring"],
    startup_script="""#!/bin/bash
pip install vllm transformers accelerate
echo "Ready for inference" > /tmp/status.txt
""",
    security_group_rules=[
        {"protocol": "tcp", "port": 22, "cidr": "0.0.0.0/0", "description": "SSH"},
        {"protocol": "tcp", "port": 8000, "cidr": "0.0.0.0/0", "description": "vLLM API"}
    ],
    labels={"env": "production", "team": "nlp"}
)

print(f"Instance ID: {instance.id} (Status: {instance.status})")

# Wait for instance to transition to 'running'
running_instance = client.compute.instances.wait_until_running(instance.id, timeout=300)
print(f"Public IP: {running_instance.public_ip}")

# Download SSH Key
ssh_key = client.compute.instances.get_ssh_key(instance.id)
with open("instance_key.pem", "w") as f:
    f.write(ssh_key.private_key)
os.chmod("instance_key.pem", 0o600)

print(f"Connect with: ssh -i instance_key.pem ubuntu@{running_instance.public_ip}")
```

### Lifecycle Control, EBS Volumes & Metrics

```python
# Stop (preserves disk state, only EBS storage billed)
client.compute.instances.stop(instance.id)

# Start again
client.compute.instances.start(instance.id)

# Online Hot Resize (Stop -> Resize -> Start)
client.compute.instances.resize(instance.id, instance_type="g5.2xlarge")

# Attach an extra EBS volume (io2 Block Express for high IOPS)
volume = client.compute.volumes.attach(
    instance_id=instance.id,
    size_gb=500,
    type="io2",
    device="/dev/xvdf",
    iops=25000
)
print(f"Attached Volume ID: {volume.volume_id}")

# Fetch Real-Time CloudWatch Telemetry
metrics = client.compute.instances.get_metrics(instance.id)
print(f"CPU Utilization: {metrics.cpu_utilization:.1f}%")
print(f"GPU Utilization: {metrics.gpu_utilization:.1f}%")
print(f"VRAM Used: {metrics.gpu_memory_used_gb:.1f} GB")

# Irreversible Termination
client.compute.instances.terminate(instance.id)
```

---

## Firecracker microVM Sandboxes (`client.sandbox`)

Execute arbitrary, untrusted Python code in hardware-isolated Linux microVMs booted in under **200 milliseconds**.

### Architecture & Security Guarantees
- **Isolation**: Hardware-level Linux KVM virtualization via AWS Firecracker.
- **Limits**: Hard 10-second execution timeout, 512MB RAM ceiling, non-root user.
- **Zero Ingress/Egress**: No external network access inside sandbox; completely air-gapped.
- **Cost**: Flat $0.00008 USD per execution deducted directly from prepaid wallet.

### Basic & Statistical Code Execution

```python
from fotohub import FotoHub

client = FotoHub()

run = client.sandbox.execute(
    code="""
import pandas as pd
import numpy as np

df = pd.DataFrame({
    "sku": ["SKU-A", "SKU-B", "SKU-C"],
    "revenue": [12500, 48200, 31900],
    "units": [125, 480, 290]
})

df["aov"] = df["revenue"] / df["units"]
print(df.to_string())
""",
    timeout=5
)

if run.ok:
    print("Stdout Output:")
    print(run.output)
    print(f"Execution Duration: {run.execution_ms}ms")
    print(f"Peak Memory: {run.memory_mb}MB")
else:
    print(f"Execution Failed: {run.error}")
```

### Passing Inputs & Structured Result Extraction

Use the `inputs` dictionary and the `__FOTOHUB_RESULT__` sentinel for clean, type-safe data roundtripping:

```python
payload = {
    "transactions": [12.50, 45.00, 99.95, 120.00, 15.20],
    "tax_rate": 0.23
}

run = client.sandbox.execute(
    code="""
# 'inputs' dictionary is automatically injected into global scope
txns = inputs.get("transactions", [])
tax = inputs.get("tax_rate", 0.0)

subtotal = sum(txns)
total_tax = subtotal * tax
grand_total = subtotal + total_tax

import json
# The sentinel variable returns structured JSON directly to SDK
__FOTOHUB_RESULT__ = {
    "subtotal": round(subtotal, 2),
    "tax": round(total_tax, 2),
    "grand_total": round(grand_total, 2)
}
""",
    inputs=payload,
    timeout=5
)

print("Parsed Result:", run.result)
# Output: {'subtotal': 292.65, 'tax': 67.31, 'grand_total': 359.96}
```

---

## Shorts Factory & Video Clipping (`client.shorts`)

Automate the transformation of long-form video files into viral 9:16 vertical Shorts with Whisper transcription, speech virality scoring, AI face tracking, and animated karaoke captions.

```python
from fotohub import FotoHub

client = FotoHub()

# 1. Ingest YouTube URL or S3 MP4 and generate viral clips
job = client.shorts.create_clipping_job(
    source_url="https://s1.fotohub.app/storage/v1/object/public/podcasts/episode_42.mp4",
    target_aspect_ratio="9:16",
    max_clips=5,
    min_clip_duration_s=20,
    max_clip_duration_s=55,
    caption_style="karaoke-bounce",
    caption_color="#FFDD00",
    face_tracking=True,     # Keeps active speaker centered in vertical frame
    virality_threshold=80   # Filter clips scoring >= 80/100
)

print(f"Clipping Job Dispatched: {job.job_id}")

# 2. Stream Real-Time Pipeline Progress via Server-Sent Events (SSE)
for event in client.shorts.stream_job_events(job.job_id):
    print(f"[{event.step_index}/11] {event.stage_name}: {event.message} ({event.progress_pct}%)")
    if event.is_complete:
        break

# 3. Retrieve finished rendered clips
clips = client.shorts.get_clips(job.job_id)
for c in clips:
    print(f"Clip: {c.title} (Virality Score: {c.virality_score}/100)")
    print(f"Download: {c.download_url}")
```

---

## Lip-Sync & Dubbing Engine (`client.lip_sync`)

Retarget lip movements to match foreign audio or translate full video assets into multiple languages with voice cloning.

```python
from fotohub import FotoHub

client = FotoHub()

# High-Precision Neural Lip Retargeting
dubbed = client.lip_sync.generate(
    face_video_url="https://s1.fotohub.app/storage/v1/object/public/videos/presenter.mp4",
    audio_track_url="https://s1.fotohub.app/storage/v1/object/public/audio/spanish_voice.mp3",
    engine="latentsync",    # "latentsync" (photorealistic) or "musetalk" (ultra-fast)
    active_crop=True        # Focus bounding box on lower facial region
)

print(f"Synchronized Video: {dubbed.video_url}")
print(f"Cost: ${dubbed.cost_usd:.4f} USD")
```

---

## Brand Engine & Virtual Faces (`client.brand`)

Extract persistent visual identities ("Brand DNA") and render consistent virtual brand ambassadors across multi-scene lifestyle shoots.

```python
# 1. Extract Brand DNA from guidelines or moodboards
brand_dna = client.brand.extract_dna(
    brand_name="Nordic Lumina",
    moodboard_urls=[
        "https://s1.fotohub.app/storage/v1/object/public/brands/nl_01.jpg",
        "https://s1.fotohub.app/storage/v1/object/public/brands/nl_02.jpg"
    ]
)
print(f"Extracted DNA Embedding: {brand_dna.dna_id}")

# 2. Create a Persistent Virtual Brand Ambassador Face
face = client.brand.create_virtual_face(
    name="Astrid",
    dna_id=brand_dna.dna_id,
    gender="female",
    ethnicity="scandinavian",
    age=27,
    hair="blonde wavy"
)
print(f"Virtual Face Registered: {face.face_id}")

# 3. Generate Character in 20 Diverse Lifestyle Settings with Biometric Consistency
photoshoot = client.brand.generate_photoshoot(
    face_id=face.face_id,
    scenes=[
        "Drinking coffee at an outdoor cafe in Copenhagen, overcast autumn morning",
        "Working on a laptop in a minimalist architectural studio, warm interior lights",
        "Walking through a modern art museum in a tailored beige overcoat"
    ],
    aspect_ratio="4:5",
    num_variations_per_scene=2
)

for scene_result in photoshoot.results:
    print(f"Scene: {scene_result.prompt}")
    for url in scene_result.image_urls:
        print(f"  Asset: {url}")
```

---

## Social Studio & Multi-Platform Publishing (`client.social`)

Schedule and automatically publish rendered visual media to TikTok, Instagram Reels, YouTube Shorts, and X (Twitter) with AI-tailored copywriting and hashtags.

```python
post = client.social.schedule_post(
    platforms=["tiktok", "instagram_reels", "youtube_shorts"],
    media_url="https://s1.fotohub.app/storage/v1/object/public/videos/viral_clip.mp4",
    title="3 AI Tools That Will Save You 10 Hours a Week",
    generate_captions=True, # Generates platform-specific hooks & emojis
    schedule_time="2026-09-07T18:00:00Z", # ISO-8601 UTC
    tags=["#ai", "#productivity", "#techhacks"]
)

print(f"Post Scheduled: ID {post.schedule_id} across {len(post.platforms)} platforms")
```

---

## UGC Studio & AI Actors

::: warning No `client.ugc` — and two different hosts underneath
There is no `client.ugc` in the SDK; call these with raw `httpx`/`requests`. And UGC itself
splits across two surfaces:

- Creative ideation — `POST /ugc/creative/brief`, `/ugc/creative/angles`, `/ugc/creative/script`
  — is first-party only: a Supabase user session JWT, not an `fh_live_*` API key. `POST /v1/ugc/hooks`
  does not exist anywhere.
- Project creation, blueprint, render, job status, and pricing **are** a real `fh_live_*`
  API-key surface, at `POST/GET /v1/ugc/projects`, `PUT /v1/ugc/projects/{id}/blueprint`,
  `POST /v1/ugc/projects/{id}/render`, `GET /v1/ugc/jobs/{id}`, and `POST /v1/ugc/estimate`.
  `POST /v1/ugc/render` (flat, no project) does not exist.
:::

---

## Document Intelligence & OCR (`client.document`)

Extract key-value pairs, nested tables, line items, and invoice totals from PDFs and scanned TIFF/JPEG receipts with Pydantic validation:

```python
from pydantic import BaseModel, Field
from typing import List
from fotohub import FotoHub

class InvoiceItem(BaseModel):
    description: str
    quantity: int
    unit_price: float
    total: float

class InvoiceData(BaseModel):
    invoice_number: str
    date: str
    vendor_name: str
    items: List[InvoiceItem]
    tax_amount: float
    grand_total: float

client = FotoHub()

# There is no client.document namespace or Pydantic-typed wrapper — call
# POST /v1/ai/document/analyze directly and validate the JSON yourself.
import base64
import httpx

with open("sample_invoice.pdf", "rb") as f:
    doc_b64 = base64.b64encode(f.read()).decode()

raw = httpx.post(
    "https://apis.fotohub.app/v1/ai/document/analyze",
    headers={"Authorization": "Bearer fh_live_your_api_key"},
    json={"document_base64": doc_b64, "features": ["TABLES", "FORMS"]},
).json()
doc = InvoiceData.model_validate(raw)

print(f"Vendor: {doc.vendor_name}, Invoice #{doc.invoice_number}")
print(f"Grand Total: ${doc.grand_total:.2f}")
for item in doc.items:
    print(f" - {item.description} ({item.quantity}x @ ${item.unit_price}) = ${item.total}")
```

---

## S3 Object Storage & BYOB External Destinations

Store assets in managed FOTOhub S3 buckets ($0.0245/GB-month with **$0.00 intra-cluster egress**) or stream outputs directly into your own AWS S3, Cloudflare R2, or GCP buckets.

::: warning No `client.storage` namespace
There is no `POST /v1/storage/s3/upload` and no SDK wrapper for any of this — S3 uploads go through
a presigned-URL flow, called over raw HTTP.
:::

```python
import httpx

api_key = "fh_live_your_api_key"
headers = {"Authorization": f"Bearer {api_key}"}
bucket_id = "my-project-assets"

# 1. Ask for a presigned upload URL, then PUT the file straight to S3
presign = httpx.post(
    f"https://apis.fotohub.app/v1/storage/s3/buckets/{bucket_id}/objects/presign-upload",
    headers=headers,
    json={"key": "audio/raw_recording.wav", "content_type": "audio/wav"},
).json()

with open("raw_recording.wav", "rb") as f:
    httpx.put(presign["upload_url"], content=f.read(), headers={"Content-Type": "audio/wav"})

# 2. Generate a presigned download URL (short-lived — it always carries an expiry)
signed = httpx.post(
    f"https://apis.fotohub.app/v1/storage/s3/buckets/{bucket_id}/objects/presign-download",
    headers=headers,
    json={"key": "audio/raw_recording.wav", "expires_in_seconds": 3600},
).json()
print(f"Temporary Download URL: {signed['download_url']}")

# 3. Configure a Bring-Your-Own-Bucket (BYOB) external destination
destination = httpx.post(
    "https://apis.fotohub.app/v1/destinations",
    headers=headers,
    json={
        "name": "Enterprise Cloudflare R2",
        "provider": "cloudflare_r2",
        "bucket_name": "company-media-prod",
        "endpoint_url": "https://your_account_id.r2.cloudflarestorage.com",
        "access_key_id": "r2_access_key...",
        "secret_access_key": "r2_secret_key...",
        "region": "auto",
    },
).json()
print(f"Destination Verified & Connected: ID {destination['id']}")
```

---

## Chat Completions & OpenAI Drop-In (`client.chat`)

Interact with frontier LLMs (Claude Sonnet 4.6, GPT-4o, Gemini 2.0 Flash, DeepSeek R1) using exact token-based billing or drop-in OpenAI SDK compatibility.

### Native Chat Method

```python
response = client.chat(
    messages=[
        {"role": "system", "content": "You are a senior systems architect specializing in distributed GPU clusters."},
        {"role": "user", "content": "Explain NVLink vs PCIe 5.0 interconnect bandwidth bottlenecks in multi-GPU DDP."}
    ],
    model="claude-sonnet-4.6",
    temperature=0.3,
    max_tokens=2048
)

print(response['choices'][0]['message']['content'])
print(f"Tokens: {response['usage']['prompt_tokens']} in / {response['usage']['completion_tokens']} out")
print(f"Cost: ${response['cost_usd']:.6f} USD")
```

### Premium Claude Chat (`chat_claude`)

```python
response = client.chat_claude(
    messages=[
        {"role": "user", "content": "Write a high-performance Python script to benchmark disk IOPS."}
    ],
    model="claude-sonnet-4.6",
    system="You are a senior Linux kernel engineer.",
    max_tokens=4096,
    temperature=0.7
)

print(response['choices'][0]['message']['content'])
print(f"Cost: ${response['billing']['cost_breakdown']['cost_usd']}")
```

### Drop-in Replacement for the Official OpenAI SDK

You can seamlessly redirect the official `openai` Python package to FOTOhub:

```python
from openai import OpenAI

# Simply configure base_url and your FOTOhub API Key
client = OpenAI(
    api_key="fh_live_your_fotohub_api_key",
    base_url="https://apis.fotohub.app/v1/ai"
)

stream = client.chat.completions.create(
    model="gemini-flash",
    messages=[{"role": "user", "content": "Write a Python script to benchmark disk IOPS."}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

---

## Gabriel AI (Intelligent Model Routing)

Gabriel is FOTOhub's intelligent orchestrator that classifies user intent and routes prompts to the optimal model based on cost, quality, and latency requirements.

```python
# 1. Classify Intent and Get Model Recommendation
route = client.gabriel_classify(
    prompt="Generate a 4K photorealistic product packshot of a luxury ceramic coffee mug with studio lighting",
    language="en",
    context={"workflow": "e-commerce"}
)

print(f"Target Service: {route['target']}")
print(f"Recommended Model: {route['model_selected']}")
print(f"Optimization Rationale: {route['tips']}")

# 2. Fast Autocomplete Suggestions (<50ms)
suggestions = client.gabriel_suggest(
    partial="a hyperrealistic macro shot of",
    tab="create"
)

for s in suggestions:
    print(f"- {s['text']} ({s['category']})")
```

---

## Prepaid USD Wallet, Billing & Spending Caps (`client.wallet`)

The FOTOhub platform operates strictly on a **prepaid USD wallet** model. There are no surprise monthly invoices, no synthetic credit conversions, and no hidden fees.

```python
from fotohub import FotoHub

client = FotoHub()

# 1. Inspect Available Balance & Monthly Spend
balance = client.wallet.get_balance()
print(f"Available Balance: ${balance['wallet']['balance_usd']:.2f} USD")
print(f"Monthly Spend: ${balance['spend']['this_month_usd']:.2f} USD")
print(f"Billing Model: {balance['billing_model']}")

# 2. Pre-Calculate Expected Cost of Multiple Operations
quote = client.wallet.estimate([
    {"type": "image", "model": "seedream-5-0-260128", "count": 10},
    {"type": "video", "model": "veo-3.1-generate-001", "duration": 15},
    {"type": "compute", "catalog_id": "g5.xlarge", "hours": 4}
])

print(f"Calculated Cost: ${quote['total_usd']:.4f} USD")
print(f"Wallet Sufficient: {quote['sufficient']}")

# 3. Top Up Balance with Volume Bonus Ladder (From $500: +5% to +20% extra USD)
topup = client.wallet.create_topup(amount_usd=1000)
print(f"Payment Link: {topup['checkout_url']}")
print(f"Payment Amount: ${topup['amount_usd']:.2f}")
print(f"Bonus Added: +${topup['bonus_usd']:.2f} USD")
print(f"Total Credited to Wallet: ${topup['total_credited_usd']:.2f} USD")

# 4. Enforce Hard Spending Caps per Project / Account
client.wallet.set_overage_limit(
    hard_limit_usd=50.00,
    project_id="staging-test-env"
)
```

---

## Webhook Management & Cryptographic Security (`fotohub.webhooks`)

Verify inbound asynchronous event notifications using HMAC-SHA256 signatures and timestamp replay defense (300-second window):

### FastAPI Implementation

```python
from fastapi import FastAPI, Request, HTTPException, Header
from fotohub.webhooks import verify_signature, InvalidSignatureError

app = FastAPI()
WEBHOOK_SECRET = "whsec_your_webhook_signing_secret"

@app.post("/webhooks/fotohub")
async def handle_fotohub_event(
    request: Request,
    x_fotohub_signature: str = Header(...),
    x_fotohub_timestamp: str = Header(...)
):
    body = await request.body()
    
    try:
        verify_signature(
            payload=body,
            signature=x_fotohub_signature,
            timestamp=x_fotohub_timestamp,
            secret=WEBHOOK_SECRET,
            tolerance_seconds=300
        )
    except InvalidSignatureError as err:
        raise HTTPException(status_code=401, detail=f"Invalid webhook signature: {err}")
    
    event = await request.json()
    event_type = event.get("type")
    
    if event_type == "generation.completed":
        print(f"Generation ready: {event['data']['url']}")
    elif event_type == "video.completed":
        print(f"Video rendered: {event['data']['video_url']}")
    elif event_type == "compute.instance.interruption":
        print(f"Spot instance will terminate in 2 minutes: {event['data']['instance_id']}")
        
    return {"received": True}
```

### Flask Implementation

```python
from flask import Flask, request, jsonify
from fotohub.webhooks import verify_signature, InvalidSignatureError

app = Flask(__name__)
WEBHOOK_SECRET = "whsec_your_webhook_signing_secret"

@app.route("/webhooks/fotohub", methods=["POST"])
def fotohub_webhook():
    try:
        verify_signature(
            payload=request.data,
            signature=request.headers.get("X-Fotohub-Signature"),
            timestamp=request.headers.get("X-Fotohub-Timestamp"),
            secret=WEBHOOK_SECRET
        )
    except InvalidSignatureError:
        return jsonify({"error": "Invalid signature"}), 401

    event = request.get_json()
    print(f"Received verified event: {event.get('type')}")
    return jsonify({"received": True}), 200
```

---

## Error Handling & Exception Hierarchy

All SDK operations raise distinct, typed exceptions inheriting from `FotoHubError`. This enables granular, zero-guessing error handling:

```
FotoHubError (Base)
├── AuthError (401 - Invalid or revoked API key)
├── InsufficientFundsError (402 - Prepaid USD wallet exhausted)
├── PermissionError (403 - Forbidden or scope violation)
├── ResourceNotFoundError (404 - Unknown instance, model, or asset ID)
├── ConflictError (409 - Name or domain conflict)
├── ValidationError (422 - Schema parameter validation failure)
├── RateLimitError (429 - Requests exceeded tier rate limits)
├── ServerError (500, 502, 503 - Upstream cloud infrastructure errors)
└── TimeoutError (Local client request timeout)
```

### Idiomatic Error Handling Pattern

```python
from fotohub import FotoHub
from fotohub.exceptions import (
    FotoHubError,
    AuthError,
    InsufficientFundsError,
    RateLimitError,
    ValidationError
)

client = FotoHub()

try:
    result = client.images.generate(
        prompt="Sunset over the fjords",
        model="seedream-5-0-260128"
    )
except InsufficientFundsError as e:
    # Handle exhausted USD wallet gracefully
    print(f"Billing Error: You need ${e.required_usd:.2f}, current balance is ${e.balance_usd:.2f}.")
    print(f"Top up ${e.shortfall_usd:.2f} at: {e.topup_url}")

except RateLimitError as e:
    # Automatically backed off by default; raised only after retry exhaustion
    print(f"Rate limited: Please pause requests for {e.retry_after} seconds.")

except AuthError:
    print("Invalid or expired API Key. Verify credentials at https://fotohub.app/console/keys")

except ValidationError as e:
    print(f"Validation Error in field '{e.param}': {e.message}")

except FotoHubError as e:
    print(f"Generic Platform Error [{e.status_code}]: {e.message} (Code: {e.code})")
```

---

## Asynchronous Client (`AsyncFotoHub`)

The asynchronous client mirrors 100% of the synchronous methods using native `async` / `await` syntax for high-performance concurrent workflows:

```python
import asyncio
from fotohub import AsyncFotoHub

async def generate_batch_assets():
    async with AsyncFotoHub() as client:
        # Launch 5 concurrent generation jobs in parallel
        prompts = [
            "Emerald dragon sitting on ancient stone ruins, hyperrealistic",
            "Obsidian obelisk glowing with violet runes in a sand desert",
            "Steampunk airship docking at a floating cloud station",
            "Bioluminescent jellyfish floating through a submerged futuristic metropolis",
            "Solar flare illuminating a sleek orbital research outpost"
        ]
        
        tasks = [
            client.images.generate(prompt=p, model="seedream-5-0-260128", aspect_ratio="16:9")
            for p in prompts
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for idx, res in enumerate(results):
            if isinstance(res, Exception):
                print(f"Job {idx} failed: {res}")
            else:
                print(f"Job {idx} finished: {res.images[0].url}")

if __name__ == "__main__":
    asyncio.run(generate_batch_assets())
```

---

## Production Framework Integrations

### FastAPI Microservice Integration

Deploy high-performance generative and sandbox microservices behind FastAPI:

```python
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from fotohub import AsyncFotoHub
from typing import List

app = FastAPI(title="Generative Studio API", version="1.0.0")

# Dependency injection for AsyncFotoHub client lifecycle
async def get_fotohub_client():
    async with AsyncFotoHub() as client:
        yield client

class GenerationRequest(BaseModel):
    prompt: str
    aspect_ratio: str = "16:9"
    webhook_target: str

class GenerationResponse(BaseModel):
    image_url: str
    cost_usd: float

@app.post("/api/v1/generate-art", response_model=GenerationResponse)
async def create_art_endpoint(
    payload: GenerationRequest,
    client: AsyncFotoHub = Depends(get_fotohub_client)
):
    try:
        res = await client.images.generate(
            prompt=payload.prompt,
            aspect_ratio=payload.aspect_ratio,
            model="seedream-5-0-260128"
        )
        return GenerationResponse(
            image_url=res.images[0].url,
            cost_usd=res.cost_usd
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Celery Asynchronous Task Worker

Process video renders and distributed compute jobs in background worker queues:

```python
from celery import Celery
from fotohub import FotoHub
import os

app = Celery("fotohub_workers", broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"))

@app.task(bind=True, max_retries=3, default_retry_delay=60)
def render_seedance_clip_task(self, prompt: str, duration_sec: int):
    client = FotoHub()
    try:
        result = client.videos.generate_seedance(
            prompt=prompt,
            duration=duration_sec,
            resolution="720p",
            generate_audio=True
        )
        return {
            "status": "SUCCESS",
            "video_url": result.video_url,
            "cost_usd": result.cost_usd
        }
    except Exception as exc:
        raise self.retry(exc=exc)
```

---

## Enterprise Production Patterns

### 1. Connection Pooling & HTTP/2 Configuration

Optimize socket reuse and reduce TLS handshake latency in long-running services:

```python
import httpx
from fotohub import FotoHub

# Configure custom underlying HTTPX transport with high connection limits
custom_transport = httpx.HTTPTransport(
    max_connections=100,
    max_keepalive_connections=20,
    keepalive_expiry=30.0,
    retries=1
)

client = FotoHub(
    transport=custom_transport,
    timeout=httpx.Timeout(connect=5.0, read=60.0, write=10.0, pool=5.0),
    http2=True
)
```

### 2. Unit Testing & Mocking with `pytest` and `respx`

Test your application logic without making real HTTP calls or charging your prepaid wallet:

```python
import pytest
import respx
import httpx
from fotohub import FotoHub

@respx.mock
def test_image_generation_service():
    # Mock the FOTOhub image generation endpoint
    mock_route = respx.post("https://apis.fotohub.app/v1/ai/generate/image").mock(
        return_value=httpx.Response(
            200,
            json={
                "images": [{"url": "https://cdn.fotohub.app/mock_image.png", "width": 1920, "height": 1080}],
                "cost_usd": 0.035,
                "billing": {"method": "wallet", "balance_usd": 99.965}
            }
        )
    )
    
    client = FotoHub(api_key="fh_live_4f3a9c2e8b71d0a6f5c3e9b2a7d41f68")
    result = client.images.generate(prompt="Test prompt")
    
    assert mock_route.called
    assert result.images[0].url == "https://cdn.fotohub.app/mock_image.png"
    assert result.cost_usd == 0.035
```

### 3. OpenTelemetry Distributed Tracing

Instrument all FOTOhub SDK calls for Jaeger, Datadog, or Honeycomb:

```python
from opentelemetry import trace
from fotohub import FotoHub

tracer = trace.get_tracer("marketing-worker")

client = FotoHub()

with tracer.start_as_current_span("generate_ad_creative") as span:
    span.set_attribute("ai.model", "seedream-5-0-260128")
    
    result = client.images.generate(
        prompt="Professional product shot of organic herbal tea box",
        model="seedream-5-0-260128"
    )
    
    span.set_attribute("fotohub.cost_usd", result.cost_usd)
    span.set_attribute("fotohub.asset_url", result.images[0].url)
```

### 4. Adaptive Concurrency Limiting (Asyncio Semaphore)

Safely process hundreds of items without exceeding tier rate limits:

```python
import asyncio
from fotohub import AsyncFotoHub

async def process_item(client: AsyncFotoHub, sem: asyncio.Semaphore, prompt: str):
    async with sem:
        return await client.images.generate(prompt=prompt, model="seedream-5-0-260128")

async def main():
    semaphore = asyncio.Semaphore(10) # Max 10 concurrent in-flight requests
    prompts = [f"Item creative #{i}" for i in range(100)]
    
    async with AsyncFotoHub() as client:
        tasks = [process_item(client, semaphore, p) for p in prompts]
        results = await asyncio.gather(*tasks)
        print(f"Successfully processed {len(results)} generations")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Full Method Reference

The SDK is a single flat `FotoHub` client — there are no `images.`/`videos.`/`brand.`/`social.`/`ugc.`
namespaces. Rows marked "raw HTTP only" have no SDK wrapper at all; call the endpoint directly with
`httpx` (or the client's own `_request` if you are comfortable relying on a private method).

| Domain | Method | Endpoint | Description |
|:---|:---|:---|:---|
| **Images** | `generate_image()` | `POST /v1/ai/generate/image` | Text-to-image and img2img with aspect ratio and guidance control |
| **Images** | `edit_image()` | `POST /v1/ai/edit/image` | Prompt-driven image editing |
| **Images** | `stability_upscale()` | `POST /stability/{fast,creative,conservative}-upscale` | Fast 2x or generative creative 4x upscaler |
| **Images** | `stability_remove_background()` | `POST /stability/remove-background` | Transparent studio cutout |
| **Images** | `stability_inpaint()` | `POST /stability/inpaint` | Mask-guided regenerative inpainting |
| **Images** | `stability_outpaint()` | `POST /stability/outpaint` | Multi-directional canvas expansion |
| **Images** | `stability_search_replace()` | `POST /stability/search-replace` | Semantic replacement of masked visual elements |
| **Images** | `stability_recolor()` | `POST /stability/search-recolor` | Selective color transformation |
| **Images** | `stability_erase()` | `POST /stability/erase-object` | Content-aware object removal |
| **Images** | `stability_style_transfer()` | `POST /stability/style-transfer` | Transfer a reference image's style onto a source image |
| **Videos** | `generate_video()` | `POST /v1/ai/generate/video` | Synchronous video generation (Veo 3.1, Sora 2, Wan 2.2) |
| **Videos** | `generate_seedance()` | `POST /v1/ai/generate/video` | Async Seedance generation (long clips, native audio, video-to-video editing) — same endpoint as `generate_video()`, selected by `model`; there is no separate `/v1/ai/generate/seedance` route |
| **Videos** | `register_video_asset()` | `POST /v1/ai/assets/register` | Register character portrait for biometric consistency (free) |
| **Videos** | `list_video_assets()` | `GET /v1/ai/assets` | List registered portrait assets |
| **Audio** | `generate_music()` | `POST /v1/ai/generate/music` | Instrumental and vocal music generation |
| **Audio** | `generate_sfx()` | `POST /v1/ai/generate/sfx` | Contextual cinematic Foley sound effects |
| **Audio** | `generate_speech()` | `POST /v1/ai/generate/speech` | Neural speech synthesis. There is no `POST /v1/ai/tts/synthesize` — provider-specific alternatives are `POST /v1/ai/tts/{azure,gemini,polly}/synthesize` |
| **Audio** | `transcribe()` | `POST /v1/ai/transcribe` | Speech-to-text with timestamps |
| **3D** | `generate_3d()` | `POST /v1/ai/generate/3d` | Image-to-3D and text-to-3D mesh generation (synchronous) |
| **3D** | `get_3d_status()` | `GET /v1/ai/generate/3d/{id}` | Re-fetch a signed download URL |
| **Try-On** | `tryon()` | `POST /v1/ai/tryon` | Dress a person photo in a garment (synchronous) |
| **Try-On** | `get_tryon_status()` | `GET /v1/ai/tryon/{id}` | Poll or re-fetch a try-on result |
| **Compute** | — (raw HTTP only) | `GET /compute/v1/catalog`, `GET /compute/v1/instances` | Dedicated EC2 rental. The prefix **does** carry a `v1` segment: `/compute/v1/...`. Full reference in [Compute](/compute/overview) |
| **Sandbox** | — (raw HTTP only) | `POST /v1/console/sandbox/execute` | Dry-run tester for FOTOhub's own endpoints — not a code sandbox. There is no public code-execution API; `/sandbox/exec-python` does not exist |
| **Shorts** | — (raw HTTP only) | `POST /v1/shorts/clips` | Viral vertical clipping pipeline |
| **Shorts** | — (raw HTTP only) | `GET /v1/shorts/clips/events` | Real-time Server-Sent Events (SSE) stream. `/v1/shorts/events/{id}` does not exist |
| **Lip-Sync** | — (raw HTTP only) | `POST /v1/video/lip-sync` | LatentSync & MuseTalk neural facial retargeting. `/v1/lip-sync/generate` does not exist |
| **Brand** | — (raw HTTP only) | `POST /brand/v1/brands/{brand_id}/extract-dna` | Extract visual guideline embeddings from moodboards. `/v1/brand/dna/extract` does not exist |
| **Brand** | — (raw HTTP only) | `POST /brand/v1/brands/{brand_id}/faces/generate` | Register a persistent virtual brand face. The bare `/v1/brand/faces` does not exist; the real, brand-scoped face list/create route is `GET,POST /brand/v1/brands/{brand_id}/faces` |
| **Social** | — (raw HTTP only) | `POST /social/v1/posts` | Create (optionally schedule via `scheduled_at`) a post. `/v1/social/schedule` does not exist |
| **UGC** | — (raw HTTP only, first-party session auth, not `fh_live_*`) | `POST /ugc/creative/brief`, `/ugc/creative/angles`, `/ugc/creative/script` | Hook/script generation. `/v1/ugc/hooks` does not exist |
| **UGC** | — (raw HTTP only, `fh_live_*` API key) | `POST /v1/ugc/projects`, `PUT /v1/ugc/projects/{id}/blueprint`, `POST /v1/ugc/projects/{id}/render`, `GET /v1/ugc/jobs/{id}`, `POST /v1/ugc/estimate` | Multi-scene UGC performance ad rendering, priced and billed against the prepaid USD wallet. `/v1/ugc/render` (flat) does not exist — rendering is project-based |
| **Document** | — (raw HTTP only) | `POST /v1/ai/document/analyze` | OCR, table extraction, and structured parsing |
| **Document** | — (raw HTTP only) | `POST /v1/ai/document/analyze-expense` | Invoice/expense parsing |
| **Storage** | — (raw HTTP only) | `POST /v1/storage/s3/buckets/{bucket_id}/multipart/create` (+ presign-part/complete) | Upload an object to a managed FOTOhub S3 bucket. `/v1/storage/s3/upload` does not exist — uploads are multipart |
| **Chat** | `chat()` | `POST /v1/ai/chat/completions` | OpenAI-compatible token-metered chat completions |
| **Chat** | `chat_claude()` | `POST /v1/ai/chat/claude` | Direct Claude routing |
| **Wallet** | `get_balance()` | `GET /v1/billing/balance` | Inspect prepaid USD wallet balance and monthly spend |
| **Wallet** | `estimate_cost()` | `POST /v1/billing/estimate` | Estimate operation basket costs |
| **Wallet** | `create_topup()` | `POST /v1/billing/topup` | Purchase balance with volume bonus ladder |
| **Wallet** | `set_overage_limit()` | `PUT /v1/billing/overage-limit` | Set hard spending cap per account or project |

---

## Supported Models Reference

### Image Models

| Model ID | Description | Resolution | Speed | Base Price (USD) |
|:---|:---|:---|:---|---:|
| `seedream-5-0-260128` | ByteDance SeedDream 5.0 (Default, photorealistic) | Up to 4K | ~3.5s | $0.0315 / image |
| `imagen-4-ultra` | Google Imagen 4 Ultra (Superior composition) | Up to 2K | ~5.0s | $0.0600 / image |
| `imagen-4-standard` | Google Imagen 4 Standard | Up to 2K | ~2.5s | $0.0400 / image |
| `flux-2-pro` | Black Forest Labs FLUX 2 Pro | Up to 2K | ~4.0s | $0.0300 / image |
| `flux-2-max` | Black Forest Labs FLUX 2 Max (Highest fidelity) | Up to 4K | ~6.0s | $0.0700 / image |
| `flux-kontext-pro` | In-context image editing & multi-turn alteration | Up to 2K | ~4.5s | $0.0400 / image |
| `gpt-image-1` | OpenAI GPT Image 1 | Up to 1024x1024 | ~3.0s | $0.0420 / image |
| `gpt-image-2-mini` | OpenAI GPT Image 2 Mini (Economical high-speed) | Up to 1024x1024 | ~1.5s | $0.0050 / image |
| `ida-q-image` | FOTOhub IDA Q 1.0 (Self-hosted zero-markup engine) | Up to 1024x1024 | ~2.0s | $0.0000 / image |

### Video Models

| Model ID | Provider | Max Length | Resolution | Audio | Base Price (USD) |
|:---|:---|:---|:---|:---|---:|
| `seedance-2-5` | ByteDance | 30 seconds | 720p | Native Included | $0.0107 / 1K tokens (~$1.17/5s, ~$6.99/30s) |
| `seedance-2-0-pro` | ByteDance | 15 seconds | 4K | Separate | $0.0150 / 1K tokens |
| `veo-3.1-generate-001` | Google | 5 seconds | 4K | Native Included | $1.0000 / 5s |
| `veo-2.0-generate-001` | Google | 5 seconds | 1080p | No | $0.7500 / 5s |
| `sora-2` | OpenAI | 10 seconds | 1080p | Native Included | $1.2000 / 5s |
| `wan2.2-t2v-plus` | Alibaba Wan | 5 seconds | 720p | No | $0.1000 / 5s |
| `kling-v3` | Kuaishou Kling | 5 seconds | 1080p | No | $0.3500 / 5s |
| `hailuo-o2` | MiniMax | 6 seconds | 1080p | Native Included | $0.4500 / 6s |
| `gemini-omni-flash` | Google | 5 seconds | 720p | Native Included | $0.5070 / 5s |
| `grok-imagine-video-1.5` | xAI | 5 seconds | 720p | Native Included | $0.7000 / 5s |

### Chat & Reasoning Models

Billed strictly on input and output token consumption from prepaid USD wallet:

| Model ID | $/1M Input Tokens | $/1M Output Tokens | Context Window | Best Use Case |
|:---|---:|---:|:---|:---|
| `nova-micro` | $0.035 | $0.140 | 128K | High-volume classification & routing |
| `nova-2-lite` | $0.040 | $0.160 | 300K | High-speed structured extraction |
| `gemini-flash` | $0.300 | $2.500 | 1M | Multimodal vision & document analysis |
| `claude-haiku-4.5` | $0.800 | $4.000 | 200K | Sub-second agent tool calling |
| `deepseek-r1` | $0.550 | $2.190 | 64K | Deep mathematical & code reasoning |
| `gpt-4o` | $3.000 | $15.000 | 128K | General enterprise orchestration |
| `claude-sonnet-4.6` | $3.000 | $15.000 | 200K | Complex coding & technical documentation |
| `claude-opus-4.6` | $15.000 | $75.000 | 200K | Frontier autonomous multi-turn agents |

---

## SDK Changelog & Version Compatibility

| SDK Version | Release Date | Key Additions | Target Python |
|:---|:---|:---|:---|
| **`v2.6.0`** (Current) | September 2026 | Added Compute Engine API (`client.compute.*`), Firecracker MicroVMs (`client.sandbox.*`), Seedance 2.5 30s clips, Shorts 11-step pipeline, and pure USD prepaid wallet metering. | **Python 3.8+** |
| **`v2.5.0`** | August 2026 | Added Stability AI editing suite, Gemini TTS, BYOB external destinations, and HTTP/2 transport. | Python 3.8+ |
| **`v2.0.0`** | July 2026 | Ground-up rewrite with Pydantic v2 schemas and native `AsyncFotoHub` client. | Python 3.8+ |

---

## Comprehensive Pydantic V2 Request & Response Model Reference

The SDK exposes dedicated, immutable Pydantic V2 schemas for every request and response across all engines. These models can be imported directly from `fotohub.types` for strict type checking, static analysis with `mypy` or `pyright`, and validation in web frameworks like FastAPI.

### 1. Image Generation & Stability Schemas

```python
from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any, Literal

class GenerateImageRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000, description="Visual description of desired scene")
    model: str = Field("seedream-5-0-260128", description="Engine identifier")
    aspect_ratio: Optional[Literal["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"]] = "1:1"
    width: Optional[int] = Field(None, ge=256, le=4096, description="Explicit pixel width")
    height: Optional[int] = Field(None, ge=256, le=4096, description="Explicit pixel height")
    num_images: int = Field(1, ge=1, le=4, description="Number of variations")
    negative_prompt: Optional[str] = Field(None, description="Artifacts or elements to exclude")
    seed: Optional[int] = Field(None, description="Deterministic seed")
    guidance_scale: float = Field(7.0, ge=1.0, le=20.0, description="Classifier-free guidance scale")
    output_format: Literal["png", "jpeg", "webp"] = "png"
    webhook_url: Optional[str] = None

class StabilityUpscaleRequest(BaseModel):
    image_url: str = Field(..., description="Source image URL to upscale")
    mode: Literal["fast", "creative", "conservative"] = Field("fast", description="Upscaling algorithm")
    output_format: Literal["png", "jpeg", "webp"] = "webp"
    creativity: Optional[float] = Field(0.35, ge=0.0, le=1.0, description="Creative hallucination strength")

class StabilityInpaintRequest(BaseModel):
    image_url: str = Field(..., description="Base background image URL")
    mask_url: str = Field(..., description="Mask URL where white pixels denote areas to regenerate")
    prompt: str = Field(..., description="Prompt describing replacement content")
    negative_prompt: Optional[str] = None
    grow_mask: Optional[int] = Field(5, ge=0, le=50, description="Pixel expansion around mask edges")

class StabilityOutpaintRequest(BaseModel):
    image_url: str = Field(..., description="Input portrait or landscape URL")
    left: int = Field(0, ge=0, le=2000, description="Pixels to expand left")
    right: int = Field(0, ge=0, le=2000, description="Pixels to expand right")
    up: int = Field(0, ge=0, le=2000, description="Pixels to expand up")
    down: int = Field(0, ge=0, le=2000, description="Pixels to expand down")
    prompt: Optional[str] = Field(None, description="Contextual guidance for expanded regions")

class StabilityEraseRequest(BaseModel):
    image_url: str = Field(..., description="Source image")
    mask_url: str = Field(..., description="Mask defining unwanted object")

class StabilitySearchReplaceRequest(BaseModel):
    image_url: str
    search_prompt: str = Field(..., description="Natural language description of object to replace")
    replace_prompt: str = Field(..., description="Natural language description of replacement")

class StabilityRecolorRequest(BaseModel):
    image_url: str
    prompt: str = Field(..., description="Target color description")
    target_object: str = Field(..., description="Label of item to recolor")
```

### 2. Video & Seedance Schemas

```python
class GenerateVideoRequest(BaseModel):
    prompt: str = Field(..., description="Cinematic camera and motion description")
    model: str = Field("veo-3.1-generate-001", description="Video engine model")
    duration: int = Field(5, ge=4, le=15, description="Duration in seconds")
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9"
    image_url: Optional[str] = Field(None, description="Start frame for image-to-video")

class GenerateSeedanceRequest(BaseModel):
    prompt: str = Field(..., description="Video description")
    model: str = Field("seedance-2-5", description="Seedance model family")
    duration: int = Field(30, ge=-1, le=30, description="Clip duration (-1 for matching source clip)")
    resolution: Literal["480p", "720p", "1080p", "4k"] = "720p"
    aspect_ratio: Literal["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive"] = "16:9"
    generate_audio: bool = Field(True, description="Attach native synchronized soundtrack")
    image_url: Optional[str] = Field(None, description="First frame image")
    last_frame_url: Optional[str] = Field(None, description="Final frame image")
    reference_videos: Optional[List[str]] = Field(None, description="Source video URLs for editing")
    asset_ids: Optional[List[str]] = Field(None, description="Biometric character portrait IDs")
    poll_interval: float = Field(10.0, description="Status polling frequency in seconds")
    timeout: float = Field(1800.0, description="Maximum wait time before timeout")
```

### 3. Compute & MicroVM Sandbox Schemas

```python
class SecurityRule(BaseModel):
    protocol: Literal["tcp", "udp", "icmp", "all"] = "tcp"
    port: Optional[int] = Field(None, ge=1, le=65535)
    cidr: str = Field("0.0.0.0/0", description="CIDR IPv4 network block")
    description: Optional[str] = None

class ProvisionInstanceRequest(BaseModel):
    catalog_id: str = Field(..., description="Machine type (e.g., g5.xlarge, g4dn.xlarge, c5.large)")
    name: str = Field(..., description="Human-readable node label")
    region: str = Field("eu-central-1", description="Frankfurt AWS region")
    availability_zone: Optional[str] = Field("eu-central-1a", description="Target AZ")
    spot_instance: bool = Field(True, description="Enable Spot market discount (~62% savings)")
    max_runtime_hours: int = Field(8, ge=1, le=720, description="Safety hard stop limit in hours")
    root_volume_type: Literal["gp3", "io2"] = "gp3"
    root_volume_size_gb: int = Field(100, ge=30, le=4096)
    os_image: str = Field("ubuntu-2204-lts", description="OS image template")
    install_presets: Optional[List[str]] = Field(None, description="Presets: docker, python-ml, comfyui, vllm")
    startup_script: Optional[str] = Field(None, description="Bash cloud-init script (max 65536 chars)")
    security_group_rules: Optional[List[SecurityRule]] = None
    labels: Optional[Dict[str, str]] = None

class ExecuteSandboxRequest(BaseModel):
    code: str = Field(..., description="Python source code to execute")
    inputs: Optional[Dict[str, Any]] = Field(None, description="Typed dictionary injected into sandbox")
    timeout: int = Field(10, ge=1, le=10, description="Max execution time in seconds (hard ceiling 10s)")
    memory_limit_mb: int = Field(512, ge=64, le=512, description="RAM ceiling in MB")
```

---

## Production Cookbooks & Blueprints

Copy-paste ready, architectural patterns demonstrating end-to-end multi-engine workflows using the FOTOhub Python SDK.

### Cookbook 1: Automated E-Commerce Packshot & 3D Asset Factory

Ingest raw studio packshots, extract products, create 4K studio renders, and generate AR QuickLook 3D models:

```python
import base64
import os
from fotohub import FotoHub

def process_product_catalog(raw_photo_url: str, product_title: str):
    client = FotoHub()
    
    print(f"=== Processing Product: {product_title} ===")
    
    # 1. Studio Background Removal
    print("[1/4] Isolating product on transparent alpha channel...")
    isolated = client.images.stability_remove_background(
        image_url=raw_photo_url,
        output_format="png"
    )
    print(f"  Isolated PNG: {isolated.url}")
    
    # 2. Generative Creative Upscaling to 4K
    print("[2/4] Upscaling product details with Creative 4x AI...")
    upscaled = client.images.stability_upscale(
        image_url=isolated.url,
        mode="creative",
        output_format="webp"
    )
    print(f"  4K Master Asset: {upscaled.url}")
    
    # 3. Download Isolated Asset and Convert to Base64 for 3D Meshing
    print("[3/4] Dispatching 3D Meshing Job (TripoSR + Quad Remesh)...")
    import httpx
    img_bytes = httpx.get(isolated.url).content
    b64_img = base64.b64encode(img_bytes).decode("utf-8")
    
    job = client.models_3d.create_job(
        mode="image-to-3d",
        model="fh-pro-3d",
        image=b64_img,
        format="glb"
    )
    
    # Wait for completion
    mesh = client.models_3d.wait_for_completion(job.job_id, poll_interval=4.0, timeout=180.0)
    print(f"  GLB 3D Model: {mesh.model_url}")
    print(f"  iOS AR QuickLook USDZ: {mesh.usdz_url}")
    
    # 4. Generate 3 Lifestyle Commercial Contexts using SeedDream 5.0
    print("[4/4] Rendering lifestyle e-commerce contextual backdrops...")
    contexts = [
        f"Modern minimalist marble countertop with soft natural morning sunlight, showcasing {product_title}",
        f"Luxury boutique shelf with warm walnut wood and subtle brass accents, highlighting {product_title}",
        f"Bright contemporary bathroom vanity with tropical green foliage in soft background bokeh, {product_title}"
    ]
    
    lifestyle_shots = []
    for prompt in contexts:
        img_res = client.images.generate(
            prompt=prompt,
            model="seedream-5-0-260128",
            aspect_ratio="4:5",
            guidance_scale=7.5
        )
        lifestyle_shots.append(img_res.images[0].url)
        
    print(f"Finished processing! Generated {len(lifestyle_shots)} lifestyle assets and 3D models.")
    return {
        "master_png": isolated.url,
        "upscaled_4k": upscaled.url,
        "glb_mesh": mesh.model_url,
        "usdz_ar": mesh.usdz_url,
        "lifestyle_backdrops": lifestyle_shots
    }

if __name__ == "__main__":
    result = process_product_catalog(
        raw_photo_url="https://s1.fotohub.app/storage/v1/object/public/products/sample_sneaker.jpg",
        product_title="Apex Runner V2 Athletic Shoe"
    )
```

### Cookbook 2: Autonomous Podcast to Viral Shorts Clipping Engine

Ingest a 60-minute MP4 podcast, transcribe speech with Whisper, score segment virality with LLM reasoning, crop speakers to 9:16 with face tracking, and export to social platforms:

```python
import time
from fotohub import FotoHub

def run_podcast_to_shorts_pipeline(podcast_s3_url: str):
    client = FotoHub()
    print(f"Ingesting long-form podcast: {podcast_s3_url}")
    
    # 1. Dispatch 11-step Shorts Clipping Pipeline
    clipping_job = client.shorts.create_clipping_job(
        source_url=podcast_s3_url,
        target_aspect_ratio="9:16",
        max_clips=3,
        min_clip_duration_s=25,
        max_clip_duration_s=50,
        caption_style="karaoke-bounce",
        caption_color="#FFEA00",
        face_tracking=True,
        virality_threshold=82
    )
    
    print(f"Pipeline job initialized: ID {clipping_job.job_id}")
    
    # 2. Monitor Real-Time SSE Event Stream
    for event in client.shorts.stream_job_events(clipping_job.job_id):
        print(f"[{event.step_index}/11] {event.stage_name.upper()}: {event.message} ({event.progress_pct:.1f}%)")
        if event.is_complete or event.is_failed:
            break
            
    # 3. Fetch finished rendered clips
    clips = client.shorts.get_clips(clipping_job.job_id)
    print(f"Successfully generated {len(clips)} viral clips!")
    
    # 4. Schedule Top Clip to Social Channels (TikTok, IG Reels, YT Shorts)
    if clips:
        best_clip = max(clips, key=lambda c: c.virality_score)
        print(f"Top viral clip: '{best_clip.title}' (Virality Score: {best_clip.virality_score}/100)")
        
        schedule = client.social.schedule_post(
            platforms=["tiktok", "instagram_reels", "youtube_shorts"],
            media_url=best_clip.download_url,
            title=f"Mind-blowing insight from today's podcast: {best_clip.title}",
            generate_captions=True,
            schedule_time="2026-09-08T17:00:00Z",
            tags=["#podcast", "#mindset", "#growth", "#shorts"]
        )
        print(f"Post scheduled for broadcast: Schedule ID {schedule.schedule_id}")

if __name__ == "__main__":
    run_podcast_to_shorts_pipeline(
        "https://s1.fotohub.app/storage/v1/object/public/podcasts/ep_102.mp4"
    )
```

### Cookbook 3: Dynamic Multi-GPU vLLM Node Orchestration

Automate the lifecycle of an on-demand NVIDIA A10G Spot GPU instance in Frankfurt:

```python
import os
import time
import httpx
from fotohub import FotoHub

def deploy_private_vllm_node():
    client = FotoHub()
    
    # 1. Verify Wallet Balance ($0.50 minimum required)
    eligibility = client.compute.instances.check_eligibility()
    if not eligibility.allowed:
        raise RuntimeError(f"Insufficient funds: {eligibility.reason} (${eligibility.wallet_balance:.2f} USD)")
        
    print(f"Preflight OK. Current wallet balance: ${eligibility.wallet_balance:.2f} USD")
    
    # 2. Estimate 4-hour runtime
    estimate = client.compute.instances.estimate_cost(
        catalog_id="g5.xlarge",
        root_volume_type="gp3",
        root_volume_size_gb=120,
        spot_instance=True,
        max_runtime_hours=4
    )
    print(f"Estimated hourly cost: ${estimate.estimate.hourly_rate_usd:.4f}/hr USD (Spot)")
    
    # 3. Launch Spot Instance with vLLM Startup Script
    cloud_init = """#!/bin/bash
set -e
echo "Starting vLLM bootstrap..." > /var/log/vllm_setup.log
pip install vllm accelerate transformers >> /var/log/vllm_setup.log 2>&1
python3 -m vllm.entrypoints.openai.api_server \
    --model mistralai/Mistral-7B-Instruct-v0.3 \
    --port 8000 \
    --gpu-memory-utilization 0.90 >> /var/log/vllm_server.log 2>&1 &
echo "vLLM service launched on port 8000" >> /var/log/vllm_setup.log
"""

    instance = client.compute.instances.provision(
        catalog_id="g5.xlarge",
        name="mistral-7b-inference-worker",
        region="eu-central-1",
        availability_zone="eu-central-1a",
        spot_instance=True,
        max_runtime_hours=4,
        root_volume_type="gp3",
        root_volume_size_gb=120,
        install_presets=["docker", "python-ml", "cuda"],
        startup_script=cloud_init,
        security_group_rules=[
            {"protocol": "tcp", "port": 22, "cidr": "0.0.0.0/0", "description": "SSH"},
            {"protocol": "tcp", "port": 8000, "cidr": "0.0.0.0/0", "description": "vLLM HTTP"}
        ],
        labels={"workload": "inference", "model": "mistral-7b"}
    )
    
    print(f"Provisioning instance: {instance.id}... Awaiting active running state")
    
    # 4. Wait for Instance Ready (<90 seconds)
    running_node = client.compute.instances.wait_until_running(instance.id, timeout=300)
    print(f"Node ACTIVE! Public IP: {running_node.public_ip}")
    
    # 5. Fetch Ephemeral SSH Key
    ssh_creds = client.compute.instances.get_ssh_key(instance.id)
    key_path = "vllm_key.pem"
    with open(key_path, "w") as f:
        f.write(ssh_creds.private_key)
    os.chmod(key_path, 0o600)
    print(f"SSH private key secured at {key_path}")
    print(f"Connect via: ssh -i {key_path} ubuntu@{running_node.public_ip}")
    
    return running_node

if __name__ == "__main__":
    node = deploy_private_vllm_node()
```

### Cookbook 4: Firecracker microVM Financial Data Audit Pipeline

Execute mathematical verification and statistical reconciliations on untrusted transaction logs within air-gapped microVMs:

```python
from fotohub import FotoHub
import json

def audit_financial_ledger(records: list):
    client = FotoHub()
    
    code = """
import pandas as pd
import numpy as np

# 'inputs' is automatically populated in the Firecracker VM
records = inputs.get("records", [])

df = pd.DataFrame(records)
df["tax_calc"] = np.round(df["amount"] * 0.23, 2)
df["total_calc"] = df["amount"] + df["tax_calc"]

discrepancies = df[df["reported_total"] != df["total_calc"]]

# Return structured sentinel output
__FOTOHUB_RESULT__ = {
    "total_records": len(df),
    "discrepancies_count": len(discrepancies),
    "sum_amount": float(df["amount"].sum()),
    "sum_tax": float(df["tax_calc"].sum()),
    "flagged_ids": discrepancies["id"].tolist()
}
"""

    print(f"Dispatching {len(records)} records to Firecracker MicroVM...")
    response = client.sandbox.execute(
        code=code,
        inputs={"records": records},
        timeout=8
    )
    
    if not response.ok:
        raise RuntimeError(f"Audit execution failed in sandbox: {response.error}")
        
    print(f"Audit completed in {response.execution_ms}ms (Memory: {response.memory_mb}MB)")
    print("Structured Result:", json.dumps(response.result, indent=2))
    return response.result

if __name__ == "__main__":
    sample_records = [
        {"id": "tx_101", "amount": 100.0, "reported_total": 123.0},
        {"id": "tx_102", "amount": 250.0, "reported_total": 307.5},
        {"id": "tx_103", "amount": 50.0, "reported_total": 65.0}, # Intentional discrepancy
    ]
    audit_financial_ledger(sample_records)
```

### Cookbook 5: Multilingual Video Dubbing & Neural Lip-Sync Pipeline

End-to-end video localization: extract audio, transcribe with Whisper, translate text, synthesize localized voice, and retarget mouth movements:

```python
from fotohub import FotoHub

def dub_video_to_spanish(source_video_url: str):
    client = FotoHub()
    print(f"=== Beginning Localization for: {source_video_url} ===")
    
    # 1. Transcribe Original English Audio with Timestamps
    print("[1/4] Transcribing source video with Whisper Large-v3...")
    transcript = client.audio.transcribe(
        audio_url=source_video_url,
        language="en"
    )
    print(f"  Transcribed {len(transcript.text)} characters.")
    
    # 2. Translate to Spanish with Claude Sonnet 4.6
    print("[2/4] Translating script to conversational Spanish...")
    translation = client.chat(
        model="claude-sonnet-4.6",
        messages=[
            {"role": "system", "content": "You are a professional audiovisual dubbing translator. Translate the text into natural European Spanish matching the cadence and length of the original speech."},
            {"role": "user", "content": transcript.text}
        ]
    )
    spanish_text = translation['choices'][0]['message']['content']
    print(f"  Translated Text: {spanish_text[:80]}...")
    
    # 3. Synthesize Spanish Neural Voice
    print("[3/4] Synthesizing expressive Spanish voiceover...")
    spanish_speech = client.audio.synthesize_speech(
        text=spanish_text,
        voice="es-ES-AlvaroNeural",
        engine="azure",
        speed=1.0
    )
    print(f"  Spanish Audio Track: {spanish_speech.audio_url}")
    
    # 4. Neural Lip Retargeting with LatentSync
    print("[4/4] Retargeting facial geometry with LatentSync...")
    dubbed_video = client.lip_sync.generate(
        face_video_url=source_video_url,
        audio_track_url=spanish_speech.audio_url,
        engine="latentsync",
        active_crop=True
    )
    
    print(f"Localization complete! Dubbed video: {dubbed_video.video_url}")
    print(f"Total Video Duration: {dubbed_video.duration}s | Cost: ${dubbed_video.cost_usd:.4f} USD")
    return dubbed_video.video_url

if __name__ == "__main__":
    dub_video_to_spanish(
        "https://s1.fotohub.app/storage/v1/object/public/videos/founder_keynote.mp4"
    )
```

---

## Unit Testing & Mocking Guide

Test applications built with the FOTOhub SDK without making real HTTP requests or charging your prepaid wallet balance.

### Fixtures and Respx Mocking

Install testing dependencies:
```bash
pip install pytest pytest-asyncio respx httpx
```

Create `test_fotohub_service.py`:

```python
import pytest
import respx
import httpx
from fotohub import FotoHub, AsyncFotoHub
from fotohub.exceptions import InsufficientFundsError

@pytest.fixture
def sync_client():
    return FotoHub(api_key="fh_live_4f3a9c2e8b71d0a6f5c3e9b2a7d41f68")

@pytest.fixture
def async_client():
    return AsyncFotoHub(api_key="fh_live_4f3a9c2e8b71d0a6f5c3e9b2a7d41f68")

@respx.mock
def test_image_generation_success(sync_client):
    # Mock POST /v1/ai/generate/image
    respx.post("https://apis.fotohub.app/v1/ai/generate/image").mock(
        return_value=httpx.Response(
            200,
            json={
                "model": "seedream-5-0-260128",
                "cost_usd": 0.0315,
                "currency": "USD",
                "billing": {
                    "cost_usd": 0.0315,
                    "balance_usd": 99.9685,
                    "currency": "USD",
                    "method": "wallet"
                },
                "images": [
                    {
                        "url": "https://cdn.fotohub.app/mock/img_01.png",
                        "width": 1920,
                        "height": 1080,
                        "content_type": "image/png"
                    }
                ]
            }
        )
    )
    
    res = sync_client.images.generate(prompt="A test prompt")
    assert len(res.images) == 1
    assert res.images[0].url == "https://cdn.fotohub.app/mock/img_01.png"
    assert res.cost_usd == 0.0315
    assert res.billing.balance_usd == 99.9685

@respx.mock
def test_wallet_insufficient_funds(sync_client):
    # Mock HTTP 402 Insufficient Funds
    respx.post("https://apis.fotohub.app/v1/ai/generate/image").mock(
        return_value=httpx.Response(
            402,
            json={
                "error": {
                    "code": "insufficient_funds",
                    "message": "Prepaid USD wallet balance exhausted. Please top up.",
                    "balance_usd": 0.012,
                    "required_usd": 0.0315,
                    "shortfall_usd": 0.0195,
                    "topup_url": "https://fotohub.app/console/wallet"
                }
            }
        )
    )
    
    with pytest.raises(InsufficientFundsError) as exc_info:
        sync_client.images.generate(prompt="A test prompt")
        
    err = exc_info.value
    assert err.balance_usd == 0.012
    assert err.required_usd == 0.0315
    assert err.shortfall_usd == 0.0195
```

---

## Deep-Dive: Stability AI Editing Suite

The FOTOhub Python SDK provides specialized direct wrappers for all Stability AI image editing endpoints. Every tool features type-safe options, input validation, and dedicated response models.

### 1. Upscale (`client.images.stability_upscale`)

Enhance low-resolution images to crystal-clear 2K or 4K resolution using either fast bicubic-guided neural networks or deep creative diffusion.

```python
# Fast mode: Instant 2x upscale (~1.5s, $0.030 USD)
fast_res = client.images.stability_upscale(
    image_url="https://s1.fotohub.app/storage/v1/object/public/photos/retro.jpg",
    mode="fast",
    output_format="webp"
)
print(f"Fast 2x Output: {fast_res.url}")

# Creative mode: 4x AI hallucinative detail refinement (~6.0s, $0.070 USD)
creative_res = client.images.stability_upscale(
    image_url="https://s1.fotohub.app/storage/v1/object/public/photos/landscape.jpg",
    mode="creative",
    output_format="png",
    creativity=0.35, # 0.1 = conservative, 0.5 = heavy generative detail
    prompt="Pristine mountain alpine ridge with sharp granite textures, photorealistic"
)
print(f"Creative 4x Output: {creative_res.url}")
```

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `image_url` | `str` | Yes | - | Public URL or presigned S3 link of the source image |
| `mode` | `str` | No | `"fast"` | `"fast"` (2x speed), `"creative"` (4x detail), `"conservative"` (2x preservation) |
| `output_format` | `str` | No | `"webp"` | `"png"`, `"jpeg"`, `"webp"` |
| `creativity` | `float` | No | `0.35` | Hallucination strength for `creative` mode (0.0 to 1.0) |
| `prompt` | `str` | No | `None` | Context guidance for creative detail synthesis |

---

### 2. Studio Background Removal (`client.images.stability_remove_background`)

Isolate foreground subjects, products, apparel, or human portraits with pixel-perfect transparency:

```python
cutout = client.images.stability_remove_background(
    image_url="https://s1.fotohub.app/storage/v1/object/public/products/camera.jpg",
    output_format="png"
)

print(f"Transparent Asset: {cutout.url}")
print(f"Cost: ${cutout.cost_usd:.4f} USD")
```

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `image_url` | `str` | Yes | - | Input image URL containing subject |
| `output_format` | `str` | No | `"png"` | Must be `"png"` or `"webp"` to support alpha channel |

---

### 3. Mask-Guided Inpainting (`client.images.stability_inpaint`)

Seamlessly replace masked portions of an image while matching environmental lighting, texture, and grain:

```python
inpainted = client.images.stability_inpaint(
    image_url="https://s1.fotohub.app/storage/v1/object/public/scenes/living_room.jpg",
    mask_url="https://s1.fotohub.app/storage/v1/object/public/scenes/table_mask.png",
    prompt="A handcrafted Scandinavian solid oak coffee table with ceramic vase and fresh tulips",
    negative_prompt="blurry, distorted, plastic, low quality",
    grow_mask=8 # Expands mask boundary by 8 pixels for seamless edge blending
)

print(f"Inpainted Scene: {inpainted.url}")
```

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `image_url` | `str` | Yes | - | Source base image URL |
| `mask_url` | `str` | Yes | - | Mask image URL (white = area to replace, black = preserve) |
| `prompt` | `str` | Yes | - | Description of the replacement content |
| `negative_prompt` | `str` | No | `None` | Elements to avoid generating |
| `grow_mask` | `int` | No | `5` | Pixel expansion around mask edges (0 to 50) |

---

### 4. Multi-Directional Canvas Outpainting (`client.images.stability_outpaint`)

Extend the canvas borders in any direction while maintaining compositional coherence:

```python
outpainted = client.images.stability_outpaint(
    image_url="https://s1.fotohub.app/storage/v1/object/public/photos/portrait_tight.jpg",
    left=400,
    right=400,
    up=200,
    down=100,
    prompt="Spacious modern architectural library with walnut bookshelves and floor-to-ceiling windows"
)

print(f"Expanded Canvas URL: {outpainted.url}")
```

| Parameter | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `image_url` | `str` | Yes | - | Input image to extend |
| `left` | `int` | No | `0` | Pixels to expand on left border (0 to 2000) |
| `right` | `int` | No | `0` | Pixels to expand on right border (0 to 2000) |
| `up` | `int` | No | `0` | Pixels to expand on top border (0 to 2000) |
| `down` | `int` | No | `0` | Pixels to expand on bottom border (0 to 2000) |
| `prompt` | `str` | No | `None` | Prompt describing the newly created canvas area |

---

### 5. Content-Aware Object Eraser (`client.images.stability_erase`)

Erase unwanted objects, bystanders, or logos from scenes, automatically infilling realistic background textures:

```python
cleaned = client.images.stability_erase(
    image_url="https://s1.fotohub.app/storage/v1/object/public/travel/monument.jpg",
    mask_url="https://s1.fotohub.app/storage/v1/object/public/travel/tourists_mask.png"
)

print(f"Cleaned Landscape: {cleaned.url}")
```

---

### 6. Semantic Search and Replace (`client.images.stability_search_replace`)

Replace objects in an image without manually creating a mask, simply by describing the target object:

```python
replaced = client.images.stability_search_replace(
    image_url="https://s1.fotohub.app/storage/v1/object/public/cars/sedan.jpg",
    search_prompt="the silver sedan",
    replace_prompt="a matte black Italian sports coupe with red brake calipers"
)

print(f"Replaced Vehicle: {replaced.url}")
```

---

### 7. Selective Color Transformation (`client.images.stability_recolor`)

Modify the color of specific items while preserving shadows, reflections, and fabric folds:

```python
recolored = client.images.stability_recolor(
    image_url="https://s1.fotohub.app/storage/v1/object/public/fashion/model.jpg",
    prompt="emerald green with subtle golden shimmer",
    target_object="the silk dress"
)

print(f"Recolored Garment: {recolored.url}")
```

---

## Detailed Webhook Management (`client.webhooks`)

Programmatically create, list, test, and maintain webhook endpoints to receive asynchronous notifications when long-running renders or compute events complete.

### Creating a Webhook

```python
webhook = client.webhooks.create(
    name="Production Video Notification Webhook",
    url="https://api.mycompany.com/webhooks/fotohub",
    events=[
        "generation.completed",
        "generation.failed",
        "video.completed",
        "video.failed",
        "compute.instance.started",
        "compute.instance.stopped",
        "compute.instance.interruption"
    ],
    headers={"X-Custom-Secret": "company_env_token_2026"}
)

print(f"Webhook Created: ID {webhook.id}")
print(f"Signing Secret (SAVE THIS): {webhook.secret}")
```

### Supported Webhook Events Catalog

| Event Name | Trigger Context | Payload Structure |
|:---|:---|:---|
| `generation.completed` | Text-to-image or batch image generation complete | `{ "url": "...", "width": 1920, "height": 1080, "cost_usd": 0.035 }` |
| `generation.failed` | Generation task failed or prompt violated safety filters | `{ "error": "Prompt blocked by safety policy", "code": "safety_violation" }` |
| `video.completed` | Synchronous or Seedance video rendering finished | `{ "video_url": "...", "duration": 30.0, "cost_usd": 6.99 }` |
| `video.failed` | Video rendering failed (wallet automatically refunded) | `{ "error": "CUDA out of memory", "refunded_usd": 1.17 }` |
| `compute.instance.started` | EC2 instance booted and SSH daemon is ready | `{ "instance_id": "...", "public_ip": "63.183.168.143" }` |
| `compute.instance.stopped` | Instance stopped cleanly; EBS disk preserved | `{ "instance_id": "...", "runtime_hours": 3.4 }` |
| `compute.instance.interruption` | AWS Spot 2-minute interruption notice received | `{ "instance_id": "...", "termination_time": "2026-09-06T18:00:00Z" }` |
| `wallet.balance_low` | Wallet balance fell below $5.00 USD threshold | `{ "balance_usd": 3.42, "currency": "USD" }` |

### Testing & Inspecting Webhook Logs

```python
# Dispatch a test event to verify SSL/TLS connectivity and signature logic
test_result = client.webhooks.test(webhook_id=webhook.id)
print(f"Test Event Delivered: {test_result.success} (HTTP {test_result.response_status})")
print(f"Response Latency: {test_result.response_time_ms}ms")

# Retrieve the last 10 delivery attempts
logs = client.webhooks.get_logs(webhook_id=webhook.id, limit=10)
for entry in logs:
    print(f"[{entry.timestamp}] {entry.event} -> HTTP {entry.status_code} ({entry.response_time_ms}ms)")
```

---

## Detailed Billing, Wallet & Overage Controls (`client.wallet`)

The FOTOhub platform uses pure USD wallet metering with zero synthetic credit conversions. Every API call directly debits `user_balance.available_usd`.

### Volume Bonus Pricing Ladder

From $500 USD upwards, every prepaid top-up receives an immediate, non-expiring cash bonus credited to the wallet balance:

| Package Tier | Payment Amount (USD) | Bonus Added (%) | Bonus Added ($) | Total Balance Credited (USD) |
|:---|---:|---:|---:|---:|
| **Starter 15** | $15.00 | 0% | $0.00 | **$15.00** |
| **Starter 25** | $25.00 | 0% | $0.00 | **$25.00** |
| **Growth 60** | $60.00 | 0% | $0.00 | **$60.00** |
| **Growth 120** | $120.00 | 0% | $0.00 | **$120.00** |
| **Scale 500** | $500.00 | +5% | +$25.00 | **$525.00** |
| **Scale 1000** | $1,000.00 | +10% | +$100.00 | **$1,100.00** |
| **Scale 2000** | $2,000.00 | +12% | +$240.00 | **$2,240.00** |
| **Enterprise 5000** | $5,000.00 | +15% | +$750.00 | **$5,750.00** |
| **Enterprise 10000** | $10,000.00 | +18% | +$1,800.00 | **$11,800.00** |
| **Custom Max** | $15,000.00 | +20% | +$3,000.00 | **$18,000.00** |

### Purchasing Top-Ups via SDK

```python
# Generate a Stripe Checkout URL for a $1,000 USD top-up (+ $100 bonus)
topup = client.wallet.create_topup(amount_usd=1000)
print(f"Stripe Checkout URL: {topup.checkout_url}")
print(f"Credited Total: ${topup.total_credited_usd:.2f} USD")
```

### Inspecting Detailed Historical Transactions

```python
# Fetch paginated ledger transactions
transactions = client.wallet.get_transactions(page=1, limit=50, service_category="compute")

for tx in transactions.items:
    print(f"[{tx.created_at}] Category: {tx.service_category} | Amount: -${tx.amount_usd:.4f} USD | Unit: {tx.usage_quantity} {tx.usage_unit}")
```

---

## Complete Method Reference & Signatures

This exhaustive reference details all synchronous and asynchronous methods exposed by the `FotoHub` and `AsyncFotoHub` client instances.

### Image & Stability Namespace (`client.images`)

#### `images.generate()`
Generates one or more images from text prompts using chosen diffusion or autoregressive image models.

```python
def generate(
    self,
    prompt: str,
    model: str = "seedream-5-0-260128",
    aspect_ratio: Optional[str] = "1:1",
    width: Optional[int] = None,
    height: Optional[int] = None,
    num_images: int = 1,
    negative_prompt: Optional[str] = None,
    guidance_scale: float = 7.0,
    seed: Optional[int] = None,
    output_format: str = "png",
    webhook_url: Optional[str] = None
) -> ImageResult:
    ...
```

* **Parameters**:
  * `prompt` (*str*): The core descriptive text.
  * `model` (*str*): Target model ID. Supported: `seedream-5-0-260128`, `imagen-4-ultra`, `imagen-4-standard`, `flux-2-pro`, `flux-2-max`, `gpt-image-1`, `gpt-image-2-mini`, `ida-q-image`.
  * `aspect_ratio` (*str*): Aspect ratio string (`"1:1"`, `"16:9"`, `"9:16"`, `"4:3"`, `"3:4"`, `"21:9"`).
  * `width` / `height` (*int*): Custom pixel dimensions from 256 to 4096. Overrides `aspect_ratio`.
  * `num_images` (*int*): Number of variations to render (1 to 4).
  * `guidance_scale` (*float*): Classifier-Free Guidance weight (1.0 to 20.0).
  * `output_format` (*str*): Encoding format (`"png"`, `"jpeg"`, or `"webp"`).
* **Returns**: `ImageResult` with `.images`, `.cost_usd`, and `.billing`.
* **Raises**: `InsufficientFundsError`, `ValidationError`, `RateLimitError`, `FotoHubError`.

---

#### `images.stability_upscale()`
Upscales an input image asset up to 4K resolution using Stability AI neural super-resolution.

```python
def stability_upscale(
    self,
    image_url: str,
    mode: Literal["fast", "creative", "conservative"] = "fast",
    output_format: str = "webp",
    creativity: Optional[float] = 0.35,
    prompt: Optional[str] = None
) -> StabilityAssetResult:
    ...
```

---

#### `images.stability_remove_background()`
Removes the background from an image asset, returning an isolated transparent PNG.

```python
def stability_remove_background(
    self,
    image_url: str,
    output_format: str = "png"
) -> StabilityAssetResult:
    ...
```

---

#### `images.stability_inpaint()`
Replaces masked portions of an image with new generative elements guided by text prompts.

```python
def stability_inpaint(
    self,
    image_url: str,
    mask_url: str,
    prompt: str,
    negative_prompt: Optional[str] = None,
    grow_mask: int = 5
) -> StabilityAssetResult:
    ...
```

---

#### `images.stability_outpaint()`
Extends image canvas boundaries in any of four orthogonal directions.

```python
def stability_outpaint(
    self,
    image_url: str,
    left: int = 0,
    right: int = 0,
    up: int = 0,
    down: int = 0,
    prompt: Optional[str] = None
) -> StabilityAssetResult:
    ...
```

---

### Video & Motion Namespace (`client.videos`)

#### `videos.generate()`
Synchronous video generation for clips up to 15 seconds.

```python
def generate(
    self,
    prompt: str,
    model: str = "veo-3.1-generate-001",
    duration: int = 5,
    aspect_ratio: str = "16:9",
    image_url: Optional[str] = None
) -> VideoResult:
    ...
```

---

#### `videos.generate_seedance()`
Asynchronous long-form generation (up to 30 seconds) and video-to-video editing.

```python
def generate_seedance(
    self,
    prompt: str,
    model: str = "seedance-2-5",
    duration: int = 30,
    resolution: Literal["480p", "720p", "1080p", "4k"] = "720p",
    aspect_ratio: str = "16:9",
    generate_audio: bool = True,
    image_url: Optional[str] = None,
    last_frame_url: Optional[str] = None,
    reference_videos: Optional[List[str]] = None,
    asset_ids: Optional[List[str]] = None,
    poll_interval: float = 10.0,
    timeout: float = 1800.0
) -> SeedanceResult:
    ...
```

---

### Compute & GPU Cluster Namespace (`client.compute`)

#### `compute.catalog.list()`
Fetches all 22 active EC2 machine types with current On-Demand and Spot market pricing.

```python
def list(self) -> CatalogResponse:
    ...
```

#### `compute.instances.provision()`
Deploys a dedicated EC2 instance node in Frankfurt (`eu-central-1`).

```python
def provision(
    self,
    catalog_id: str,
    name: str,
    region: str = "eu-central-1",
    availability_zone: str = "eu-central-1a",
    spot_instance: bool = True,
    max_runtime_hours: int = 24,
    root_volume_type: str = "gp3",
    root_volume_size_gb: int = 100,
    os_image: str = "ubuntu-2204-lts",
    install_presets: Optional[List[str]] = None,
    startup_script: Optional[str] = None,
    security_group_rules: Optional[List[Dict[str, Any]]] = None,
    labels: Optional[Dict[str, str]] = None
) -> ComputeInstance:
    ...
```

#### `compute.instances.estimate_cost()`
Calculates projected hourly and session expenses in USD before instance provisioning.

```python
def estimate_cost(
    self,
    catalog_id: str,
    root_volume_type: str = "gp3",
    root_volume_size_gb: int = 100,
    additional_volume_size_gb: int = 0,
    spot_instance: bool = True,
    max_runtime_hours: int = 24
) -> CostEstimateResponse:
    ...
```

#### `compute.instances.stop()` / `start()` / `reboot()` / `terminate()`
Controls node lifecycle states. Stopping preserves root EBS disk state; terminating permanently destroys resources.

```python
def stop(self, instance_id: str) -> ActionResponse: ...
def start(self, instance_id: str) -> ActionResponse: ...
def reboot(self, instance_id: str) -> ActionResponse: ...
def terminate(self, instance_id: str) -> ActionResponse: ...
```

#### `compute.instances.get_metrics()`
Streams live CloudWatch utilization metrics (CPU, GPU, VRAM, disk IOPS, network ingress/egress).

```python
def get_metrics(self, instance_id: str) -> InstanceMetrics:
    ...
```

---

### MicroVM Sandbox Namespace (`client.sandbox`)

#### `sandbox.execute()`
Executes untrusted Python scripts within a hardware-isolated Linux Firecracker microVM (<200ms cold start).

```python
def execute(
    self,
    code: str,
    inputs: Optional[Dict[str, Any]] = None,
    timeout: int = 10,
    memory_limit_mb: int = 512
) -> SandboxResult:
    ...
```

---

### Shorts & Vertical Media Namespace (`client.shorts`)

#### `shorts.create_clipping_job()`
Dispatches an 11-step long-form video clipping pipeline to create 9:16 vertical shorts.

```python
def create_clipping_job(
    self,
    source_url: str,
    target_aspect_ratio: str = "9:16",
    max_clips: int = 5,
    min_clip_duration_s: int = 20,
    max_clip_duration_s: int = 60,
    caption_style: str = "karaoke-bounce",
    caption_color: str = "#FFDD00",
    face_tracking: bool = True,
    virality_threshold: int = 75
) -> ShortsJob:
    ...
```

#### `shorts.stream_job_events()`
Streams Server-Sent Events (SSE) detailing stage transitions and rendering progress percentages.

```python
def stream_job_events(self, job_id: str) -> Iterator[ShortsEvent]:
    ...
```

---

### Lip-Sync & Dubbing Namespace (`client.lip_sync`)

#### `lip_sync.generate()`
Retargets facial mouth motions to match audio speech files.

```python
def generate(
    self,
    face_video_url: str,
    audio_track_url: str,
    engine: Literal["latentsync", "musetalk"] = "latentsync",
    active_crop: bool = True
) -> LipSyncResult:
    ...
```

---

### Object Storage & Destinations Namespace (`client.storage`)

#### `storage.upload_object()`
Uploads local binary data or file streams directly to managed FOTOhub S3 buckets.

```python
def upload_object(
    self,
    bucket: str,
    key: str,
    file_obj: Union[BinaryIO, bytes],
    content_type: str = "application/octet-stream"
) -> StorageUploadResult:
    ...
```

#### `storage.create_presigned_url()`
Generates time-limited presigned GET or PUT URLs.

```python
def create_presigned_url(
    self,
    bucket: str,
    key: str,
    expires_in_seconds: int = 3600,
    operation: Literal["get_object", "put_object"] = "get_object"
) -> str:
    ...
```

---

## Interactive Streamlit Creative Studio Blueprint

Create a full web GUI for image generation, Seedance video creation, and wallet inspection using Streamlit and the FOTOhub Python SDK:

```python
# app.py - Run with: streamlit run app.py
import streamlit as st
from fotohub import FotoHub
from fotohub.exceptions import InsufficientFundsError, FotoHubError

st.set_page_config(page_title="FOTOhub AI Studio", page_icon="🎨", layout="wide")

@st.cache_resource
def get_client():
    return FotoHub()

client = get_client()

# Sidebar: Wallet Status
st.sidebar.title("💳 Wallet & Billing")
try:
    balance = client.wallet.get_balance()
    st.sidebar.metric("Available Balance", f"${balance['wallet']['balance_usd']:.2f} USD")
    st.sidebar.metric("Spent This Month", f"${balance['spend']['this_month_usd']:.2f} USD")
except Exception as e:
    st.sidebar.error(f"Failed to fetch balance: {e}")

st.title("✨ FOTOhub Creative Studio")

tab1, tab2, tab3 = st.tabs(["🖼️ Image Studio", "🎬 Seedance Video", "⚡ Firecracker Sandbox"])

# Tab 1: Image Studio
with tab1:
    st.header("Text-to-Image Generation")
    col1, col2 = st.columns([2, 1])
    
    with col1:
        prompt = st.text_area("Prompt", "Architectural villa on Mediterranean cliffs at dusk, warm interior lighting, photorealistic")
        neg_prompt = st.text_input("Negative Prompt", "blurry, low quality, artifacts")
    
    with col2:
        model = st.selectbox("Model", ["seedream-5-0-260128", "imagen-4-ultra", "flux-2-pro"])
        aspect = st.selectbox("Aspect Ratio", ["16:9", "1:1", "9:16", "4:5"])
        guidance = st.slider("Guidance Scale", 1.0, 15.0, 7.5, 0.5)
        num_images = st.slider("Variations", 1, 4, 1)

    if st.button("Generate Images", type="primary"):
        with st.spinner("Rendering on FOTOhub GPU cluster..."):
            try:
                res = client.images.generate(
                    prompt=prompt,
                    model=model,
                    negative_prompt=neg_prompt,
                    aspect_ratio=aspect,
                    guidance_scale=guidance,
                    num_images=num_images
                )
                st.success(f"Generated {len(res.images)} image(s) - Cost: ${res.cost_usd:.4f} USD")
                
                cols = st.columns(len(res.images))
                for i, img in enumerate(res.images):
                    cols[i].image(img.url, caption=f"Variation {i+1}", use_container_width=True)
            except InsufficientFundsError as err:
                st.error(f"Wallet balance insufficient: Need ${err.required_usd:.2f}, balance is ${err.balance_usd:.2f}")
            except FotoHubError as err:
                st.error(f"API Error: {err.message}")

# Tab 2: Seedance Video Studio
with tab2:
    st.header("ByteDance Seedance 2.5 Long-Form Video")
    v_prompt = st.text_area("Video Description", "A soaring eagle glides over snowcapped alpine peaks, sunlight breaking through clouds")
    v_duration = st.slider("Duration (seconds)", 4, 30, 15)
    v_audio = st.checkbox("Generate Native Audio Soundtrack", value=True)
    
    if st.button("Render Seedance Video", type="primary"):
        with st.spinner("Rendering 30s neural video pipeline..."):
            try:
                video = client.videos.generate_seedance(
                    prompt=v_prompt,
                    duration=v_duration,
                    generate_audio=v_audio
                )
                st.success(f"Video ready! Cost: ${video.cost_usd:.4f} USD")
                st.video(video.video_url)
            except Exception as e:
                st.error(f"Render failed: {e}")

# Tab 3: Firecracker Sandbox
with tab3:
    st.header("Ephemeral Firecracker microVM Execution (<200ms)")
    code_input = st.text_area("Python Code", """import math
primes = [n for n in range(2, 1000) if all(n % d != 0 for d in range(2, int(math.isqrt(n)) + 1))]
print(f"Found {len(primes)} primes up to 1000")
print(f"Largest prime: {primes[-1]}")
""", height=200)

    if st.button("Run in MicroVM", type="primary"):
        with st.spinner("Booting KVM microVM..."):
            run = client.sandbox.execute(code=code_input)
            if run.ok:
                st.code(run.output)
                st.info(f"⚡ Execution Latency: {run.execution_ms}ms | Memory Peak: {run.memory_mb}MB | Cost: $0.00008 USD")
            else:
                st.error(f"Execution failed: {run.error}")
```

---

## Autonomous Agents & MCP Tool Protocol (`client.agents` & `client.mcp`)

Integrate frontier autonomous reasoning models (Claude Opus 4.6, DeepSeek R1, GPT-4o) with FOTOhub tools, Firecracker microVM execution, and standard Model Context Protocol (MCP) servers.

### 1. FastMCP Server Implementation for Claude Desktop & Cursor

Expose FOTOhub generative tools and ephemeral Python sandboxes directly to Claude Desktop, Cursor, or VS Code using the modern `fastmcp` Python framework:

```python
# fotohub_mcp_server.py
# Run with: uv run fastmcp run fotohub_mcp_server.py
from mcp.server.fastmcp import FastMCP
from fotohub import FotoHub
import os

# Initialize FastMCP application
mcp = FastMCP("FOTOhub Creative & Compute MCP")
fotohub = FotoHub(api_key=os.environ.get("FOTOHUB_API_KEY"))

@mcp.tool()
def generate_creative_image(prompt: str, aspect_ratio: str = "16:9") -> str:
    """Generates a photorealistic 4K image using FOTOhub SeedDream 5.0."""
    result = fotohub.images.generate(
        prompt=prompt,
        model="seedream-5-0-260128",
        aspect_ratio=aspect_ratio
    )
    return f"Image generated successfully! URL: {result.images[0].url} (Cost: ${result.cost_usd:.4f} USD)"

@mcp.tool()
def execute_python_in_microvm(code: str) -> str:
    """Executes arbitrary untrusted Python code safely in a hardware-isolated Linux microVM in under 200ms."""
    result = fotohub.sandbox.execute(code=code)
    if result.ok:
        return f"STDOUT:\n{result.output}\n(Execution: {result.execution_ms}ms, Memory: {result.memory_mb}MB)"
    return f"ERROR:\n{result.error}"

@mcp.tool()
def check_wallet_balance() -> str:
    """Checks current available prepaid USD wallet balance."""
    balance = fotohub.wallet.get_balance()
    return f"Available Prepaid Balance: ${balance['wallet']['balance_usd']:.2f} USD"

if __name__ == "__main__":
    mcp.run()
```

### Configuring Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "fotohub": {
      "command": "uv",
      "args": ["run", "python", "/path/to/fotohub_mcp_server.py"],
      "env": {
        "FOTOHUB_API_KEY": "fh_live_your_api_key_here"
      }
    }
  }
}
```

---

### 2. Multi-Turn Autonomous Tool-Calling Agent Loop

Build a fully autonomous coding and research agent using Claude Sonnet 4.6 and the Firecracker microVM execution sandbox:

```python
import json
from fotohub import FotoHub

def run_autonomous_agent(user_query: str):
    client = FotoHub()
    
    tools = [
        {
            "name": "run_python_sandbox",
            "description": "Execute Python code in an isolated Firecracker microVM. Returns stdout or error.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "code": {"type": "string", "description": "Python code snippet"}
                },
                "required": ["code"]
            }
        },
        {
            "name": "generate_visual_asset",
            "description": "Generate a high-fidelity image from a descriptive visual prompt.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "Detailed image prompt"}
                },
                "required": ["prompt"]
            }
        }
    ]
    
    messages = [{"role": "user", "content": user_query}]
    system_prompt = "You are an autonomous AI scientist. You write Python code to analyze data, verify mathematical theories, and create visual assets."
    
    print(f"Goal: {user_query}")
    
    # Autonomous multi-turn agent loop
    for step in range(5):
        print(f"--- Step {step + 1} ---")
        response = client.chat_claude(
            model="claude-sonnet-4.6",
            system=system_prompt,
            messages=messages,
            max_tokens=4096
        )
        
        assistant_msg = response['choices'][0]['message']
        content = assistant_msg.get('content', '')
        tool_calls = assistant_msg.get('tool_calls', [])
        
        print(f"Agent: {content[:120]}...")
        messages.append(assistant_msg)
        
        if not tool_calls:
            print("Agent completed goal.")
            return content
            
        for call in tool_calls:
            tool_name = call['function']['name']
            args = json.loads(call['function']['arguments'])
            print(f"Executing Tool [{tool_name}] with args: {args}")
            
            if tool_name == "run_python_sandbox":
                res = client.sandbox.execute(code=args['code'])
                tool_output = res.output if res.ok else f"ERROR: {res.error}"
            elif tool_name == "generate_visual_asset":
                res = client.images.generate(prompt=args['prompt'], model="seedream-5-0-260128")
                tool_output = f"Rendered Image URL: {res.images[0].url}"
            else:
                tool_output = "Unknown tool."
                
            messages.append({
                "role": "tool",
                "tool_call_id": call['id'],
                "name": tool_name,
                "content": tool_output
            })

if __name__ == "__main__":
    run_autonomous_agent(
        "Calculate the first 10 Fibonacci numbers, compute their ratio convergence to the golden ratio, and render an artistic visual of the golden spiral."
    )
```

---

## Django & Celery Production Stack Integration

Enterprise Django architectures require separation between web request-response cycles and long-running AI operations. Here is a production-grade Django Rest Framework + Celery configuration.

### 1. `settings.py` Configuration

```python
# settings.py
import os

FOTOHUB_API_KEY = os.getenv("FOTOHUB_API_KEY")
FOTOHUB_BASE_URL = os.getenv("FOTOHUB_BASE_URL", "https://apis.fotohub.app")
FOTOHUB_WEBHOOK_SECRET = os.getenv("FOTOHUB_WEBHOOK_SECRET")

# Celery Configuration
CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
```

### 2. Django Service Client Singleton (`services/fotohub_client.py`)

```python
from django.conf import settings
from fotohub import FotoHub
from threading import Lock

class FotoHubService:
    _instance = None
    _lock = Lock()

    @classmethod
    def get_client(cls) -> FotoHub:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = FotoHub(
                        api_key=settings.FOTOHUB_API_KEY,
                        base_url=settings.FOTOHUB_BASE_URL,
                        timeout=90.0,
                        max_retries=3,
                        http2=True
                    )
        return cls._instance
```

### 3. Celery Asynchronous Tasks (`tasks.py`)

```python
from celery import shared_task
import logging
from .services.fotohub_client import FotoHubService
from .models import VideoJobModel

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def process_long_seedance_video(self, job_db_id: int, prompt: str, duration: int):
    client = FotoHubService.get_client()
    job_record = VideoJobModel.objects.get(id=job_db_id)
    
    try:
        job_record.status = "PROCESSING"
        job_record.save(update_fields=["status"])
        
        result = client.videos.generate_seedance(
            prompt=prompt,
            duration=duration,
            resolution="720p",
            generate_audio=True
        )
        
        job_record.status = "COMPLETED"
        job_record.output_url = result.video_url
        job_record.cost_usd = result.cost_usd
        job_record.save()
        
        logger.info(f"Successfully rendered video for Job #{job_db_id}")
        return {"video_url": result.video_url, "cost_usd": result.cost_usd}
        
    except Exception as exc:
        logger.error(f"Error processing video Job #{job_db_id}: {exc}")
        job_record.status = "FAILED"
        job_record.error_message = str(exc)
        job_record.save(update_fields=["status", "error_message"])
        raise self.retry(exc=exc)
```

### 4. Django REST Framework Views (`views.py`)

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings
from fotohub.webhooks import verify_signature, InvalidSignatureError
from .models import VideoJobModel
from .tasks import process_long_seedance_video

class VideoRenderDispatchView(APIView):
    def post(self, request):
        prompt = request.data.get("prompt")
        duration = request.data.get("duration", 15)
        
        if not prompt:
            return Response({"error": "Missing prompt"}, status=status.HTTP_400_BAD_REQUEST)
            
        job = VideoJobModel.objects.create(prompt=prompt, duration=duration, status="QUEUED")
        process_long_seedance_video.delay(job.id, prompt, duration)
        
        return Response({"job_id": job.id, "status": "QUEUED"}, status=status.HTTP_202_ACCEPTED)

@method_decorator(csrf_exempt, name='dispatch')
class FotoHubWebhookView(APIView):
    def post(self, request):
        signature = request.headers.get("X-Fotohub-Signature")
        timestamp = request.headers.get("X-Fotohub-Timestamp")
        
        try:
            verify_signature(
                payload=request.body,
                signature=signature,
                timestamp=timestamp,
                secret=settings.FOTOHUB_WEBHOOK_SECRET
            )
        except InvalidSignatureError:
            return Response({"error": "Invalid signature"}, status=status.HTTP_401_UNAUTHORIZED)
            
        event = request.data
        event_type = event.get("type")
        
        # Handle asynchronous completion
        if event_type == "generation.completed":
            print(f"Generation completed: {event['data']}")
            
        return Response({"received": True}, status=status.HTTP_200_OK)
```

---

## 10 Specialized MicroVM Sandbox Recipes

The Firecracker microVM execution environment (`client.sandbox.execute`) is loaded with standard statistical, scientific, and data analysis packages (NumPy, SciPy, Pandas, PIL, Scikit-learn, SymPy, Cryptography).

Here are 10 production-tested recipes for common background compute tasks:

### Recipe 1: Outlier Detection using IQR Method
```python
code = """
import numpy as np
data = inputs.get("data", [])
q25, q75 = np.percentile(data, [25, 75])
iqr = q75 - q25
lower_bound = q25 - 1.5 * iqr
upper_bound = q75 + 1.5 * iqr
outliers = [x for x in data if x < lower_bound or x > upper_bound]
__FOTOHUB_RESULT__ = {"outliers": outliers, "clean_count": len(data) - len(outliers)}
"""
res = client.sandbox.execute(code=code, inputs={"data": [10, 12, 12, 13, 12, 11, 14, 105, 12, 11, 99]})
print(res.result)
```

### Recipe 2: Polynomial Curve Fitting & Trend Extrapolation
```python
code = """
import numpy as np
x = np.array(inputs.get("x", []))
y = np.array(inputs.get("y", []))
poly = np.polyfit(x, y, deg=2)
next_x = [len(x) + 1, len(x) + 2]
preds = np.polyval(poly, next_x).tolist()
__FOTOHUB_RESULT__ = {"coefficients": poly.tolist(), "predictions": preds}
"""
res = client.sandbox.execute(code=code, inputs={"x": [1, 2, 3, 4, 5], "y": [2.1, 3.9, 8.2, 16.5, 24.8]})
print(res.result)
```

### Recipe 3: High-Speed Markdown to Sanitized HTML
```python
code = """
import html
text = inputs.get("markdown", "")
# Simple bold and italic conversion
html_text = text.replace("**", "<b>").replace("*", "<i>")
__FOTOHUB_RESULT__ = {"html": html_text}
"""
res = client.sandbox.execute(code=code, inputs={"markdown": "**Hello** *World*"})
print(res.result)
```

### Recipe 4: Cryptographic HMAC-SHA512 Key Derivation
```python
code = """
import hmac
import hashlib
key = inputs.get("key", "").encode()
msg = inputs.get("msg", "").encode()
digest = hmac.new(key, msg, hashlib.sha512).hexdigest()
__FOTOHUB_RESULT__ = {"digest": digest}
"""
res = client.sandbox.execute(code=code, inputs={"key": "master_secret", "msg": "user_payload"})
print(res.result)
```

### Recipe 5: Haversine Geodesic Distance Calculations
```python
code = """
import math
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

coords = inputs.get("route", [])
dist = sum(haversine(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1]) for i in range(len(coords)-1))
__FOTOHUB_RESULT__ = {"total_km": round(dist, 2)}
"""
res = client.sandbox.execute(code=code, inputs={"route": [[52.52, 13.405], [48.856, 2.352], [51.507, -0.127]]})
print(res.result)
```

### Recipe 6: Symbolic Calculus with SymPy
```python
code = """
import sympy as sp
x = sp.Symbol('x')
expr = sp.sin(x) * sp.exp(x)
diff_expr = sp.diff(expr, x)
integral_expr = sp.integrate(expr, x)
__FOTOHUB_RESULT__ = {
    "derivative": str(diff_expr),
    "integral": str(integral_expr)
}
"""
res = client.sandbox.execute(code=code)
print(res.result)
```

### Recipe 7: Color Palette Extraction from Image Bytes
```python
code = """
from collections import Counter
import base64
import io
from PIL import Image

b64 = inputs.get("image_b64", "")
if b64:
    img = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")
    img = img.resize((50, 50))
    colors = img.getcolors(maxcolors=2500)
    top_colors = sorted(colors, key=lambda c: c[0], reverse=True)[:5]
    hex_colors = [f"#{r:02x}{g:02x}{b:02x}" for count, (r, g, b) in top_colors]
    __FOTOHUB_RESULT__ = {"palette": hex_colors}
else:
    __FOTOHUB_RESULT__ = {"palette": []}
"""
res = client.sandbox.execute(code=code, inputs={"image_b64": ""})
print(res.result)
```

### Recipe 8: Time-Series Exponential Moving Average (EMA)
```python
code = """
import pandas as pd
series = inputs.get("series", [])
alpha = inputs.get("alpha", 0.3)
ema = pd.Series(series).ewm(alpha=alpha, adjust=False).mean().tolist()
__FOTOHUB_RESULT__ = {"ema": [round(x, 2) for x in ema]}
"""
res = client.sandbox.execute(code=code, inputs={"series": [10, 14, 18, 12, 22, 28, 25], "alpha": 0.3})
print(res.result)
```

### Recipe 9: JSON Schema Validation in Sandbox
```python
code = """
import json
payload = inputs.get("payload", {})
required_keys = ["id", "username", "email", "tier"]
missing = [k for k in required_keys if k not in payload]
__FOTOHUB_RESULT__ = {"valid": len(missing) == 0, "missing_keys": missing}
"""
res = client.sandbox.execute(code=code, inputs={"payload": {"id": 1, "username": "alice"}})
print(res.result)
```

### Recipe 10: Dynamic ASCII Sparkline Chart Generation
```python
code = """
ticks = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█']
values = inputs.get("values", [])
if not values:
    __FOTOHUB_RESULT__ = {"chart": ""}
else:
    mn, mx = min(values), max(values)
    rng = mx - mn if mx != mn else 1
    chart = "".join(ticks[min(int((v - mn) / rng * (len(ticks) - 1)), len(ticks) - 1)] for v in values)
    __FOTOHUB_RESULT__ = {"chart": chart}
"""
res = client.sandbox.execute(code=code, inputs={"values": [1, 5, 2, 8, 3, 10, 7, 12, 4, 15]})
print(res.result) # e.g.  ▃ ▄ ▆▄▇▂█
```

---

## Advanced Resilience & Circuit Breaker Patterns

In mission-critical enterprise environments, applications must gracefully handle upstream provider outages, network latency spikes, and transient rate limits without crashing dependent services.

### 1. Circuit Breaker with `pybreaker`

Implement a circuit breaker to fail fast and prevent thread starvation when upstream networks degrade:

```python
import pybreaker
from fotohub import FotoHub
from fotohub.exceptions import ServerError, TimeoutError

# Initialize circuit breaker: opens after 5 consecutive failures, cools down for 30s
db_breaker = pybreaker.CircuitBreaker(fail_max=5, reset_timeout=30)

client = FotoHub()

@db_breaker
def resilient_image_generation(prompt: str):
    try:
        return client.images.generate(prompt=prompt, model="seedream-5-0-260128")
    except (ServerError, TimeoutError) as e:
        # Trip circuit on 5xx or network timeouts; do NOT trip on 402/422 validation
        raise e

try:
    result = resilient_image_generation("Hyperrealistic portrait of an astronaut")
    print(f"Success: {result.images[0].url}")
except pybreaker.CircuitBreakerError:
    print("Circuit is OPEN: Upstream services degraded. Failing fast to fallback queue.")
```

---

### 2. Idempotency Key Deduplication (`X-Idempotency-Key`)

When retrying HTTP requests over unstable networks, use idempotency keys to guarantee that generations and wallet deductions are never executed twice:

```python
import uuid
from fotohub import FotoHub

client = FotoHub()

# Generate a unique UUIDv4 per user action or transaction
idempotency_token = str(uuid.uuid4())

# Send with custom headers
result = client.images.generate(
    prompt="A futuristic flying vehicle over neo-Chicago",
    model="seedream-5-0-260128",
    default_headers={"X-Idempotency-Key": idempotency_token}
)

print(f"Generated once: {result.images[0].url}")

# A network retry with the SAME token will return the cached result with zero additional charge
cached_result = client.images.generate(
    prompt="A futuristic flying vehicle over neo-Chicago",
    model="seedream-5-0-260128",
    default_headers={"X-Idempotency-Key": idempotency_token}
)

assert result.images[0].url == cached_result.images[0].url
print("Deduplication verified! No duplicate charges.")
```

---

### 3. Prometheus Metrics Instrumentation

Export real-time Prometheus telemetry tracking SDK call latencies, error counts, and USD wallet burn rates:

```python
from prometheus_client import Counter, Histogram, start_http_server
from fotohub import FotoHub
import time

# Prometheus Metrics
FOTOHUB_REQUESTS = Counter("fotohub_requests_total", "Total FOTOhub SDK calls", ["domain", "model", "status"])
FOTOHUB_LATENCY = Histogram("fotohub_latency_seconds", "Latency of FOTOhub calls", ["domain", "model"])
FOTOHUB_USD_SPENT = Counter("fotohub_usd_spent_total", "Total USD wallet spend", ["domain", "model"])

client = FotoHub()

def monitored_generate_image(prompt: str, model: str = "seedream-5-0-260128"):
    start = time.time()
    try:
        res = client.images.generate(prompt=prompt, model=model)
        duration = time.time() - start
        
        FOTOHUB_REQUESTS.labels(domain="images", model=model, status="success").inc()
        FOTOHUB_LATENCY.labels(domain="images", model=model).observe(duration)
        FOTOHUB_USD_SPENT.labels(domain="images", model=model).inc(res.cost_usd)
        return res
    except Exception as exc:
        FOTOHUB_REQUESTS.labels(domain="images", model=model, status="error").inc()
        raise exc

if __name__ == "__main__":
    start_http_server(9100)
    print("Prometheus metrics server running on port 9100")
```

---

## AWS Lambda Serverless Blueprint

Package and deploy FOTOhub SDK workflows on AWS Lambda with API Gateway:

```python
# lambda_function.py
import json
import os
from fotohub import FotoHub
from fotohub.exceptions import FotoHubError, InsufficientFundsError

# Initialize client outside the handler for connection reuse across invocations
client = FotoHub(
    api_key=os.environ.get("FOTOHUB_API_KEY"),
    timeout=25.0
)

def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        prompt = body.get("prompt")
        
        if not prompt:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Missing 'prompt' parameter"})
            }
            
        result = client.images.generate(
            prompt=prompt,
            model="seedream-5-0-260128",
            aspect_ratio=body.get("aspect_ratio", "1:1")
        )
        
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "image_url": result.images[0].url,
                "cost_usd": result.cost_usd,
                "balance_usd": result.billing.balance_usd
            })
        }
        
    except InsufficientFundsError as err:
        return {
            "statusCode": 402,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "error": "Insufficient funds in prepaid USD wallet",
                "shortfall_usd": err.shortfall_usd,
                "topup_url": err.topup_url
            })
        }
    except FotoHubError as err:
        return {
            "statusCode": err.status_code,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": err.message, "code": err.code})
        }
```

---

## Python Developer FAQ

### 1. Is the Python SDK thread-safe?
Yes. The synchronous `FotoHub` client uses `httpx.Client` under the hood, which is thread-safe and shares an internal persistent connection pool across worker threads. You can safely pass a single `FotoHub` instance to multi-threaded workers.

### 2. How do I stream chat tokens in real-time?
For token-by-token streaming, use the official OpenAI Python package pointing to `base_url="https://apis.fotohub.app/v1/ai"` with `stream=True`. The native `client.chat()` method returns complete responses.

### 3. What is the minimum wallet balance required to provision GPU instances?
You must maintain a minimum balance of **$0.50 USD** in your prepaid wallet to provision any EC2 compute instance. If your balance drops to $0.00 while an instance is running, the instance is automatically stopped cleanly (EBS root volumes are preserved).

### 4. Can I use the SDK with an outbound corporate HTTP proxy?
Yes. Pass the proxy URL directly to the constructor:
```python
client = FotoHub(proxy="http://corporate-proxy.corp:8080")
```

### 5. What happens if a video rendering job fails on the server?
If a video generation job fails due to an upstream engine crash or timeout, **the prepaid USD wallet is automatically refunded server-side in the same transaction**, and the exception message reflects the refund.

### 6. Can I use custom Pydantic models for Document Intelligence parsing?
Yes! The `client.document.parse_structured()` method accepts any arbitrary Pydantic v2 `BaseModel` class as `response_model` and guarantees that the parsed output conforms to your schema.

### 7. Does the SDK support Python 3.12?
Yes. The SDK is continuously tested against Python 3.8, 3.9, 3.10, 3.11, and 3.12 in CI pipelines.

---

## Brand Engine & Virtual Ambassador Pipeline (`client.brand`)

The Brand Engine provides an enterprise-grade pipeline to create, manage, and animate photorealistic virtual ambassadors. You can ensure visual consistency across thousands of generated campaign assets using the `BrandProfile` abstraction. 

::: tip Enterprise Feature
Brand pipelines run exclusively on high-vRAM GPU clusters. Check `wallet.available_usd` before running large batch jobs.
:::

### 1. Creating a Brand Profile

The `BrandProfile` binds specific stylistic constraints, negative prompts, and lighting preferences to a dedicated identifier. 

::: warning No `client.brand` namespace, and no `/v1/brand/profiles`
The brand engine is real (`/brand/v1/brands/...`), but no SDK ships a `brand` wrapper for it, and
there is no "profile" resource — the object you create is a brand (`POST /brand/v1/brands`). Call
it over raw HTTP, as below.
:::

::: code-group

```python [Python]
import httpx

async def create_brand():
    headers = {"Authorization": "Bearer fh_live_your_api_key"}
    async with httpx.AsyncClient() as http:
        resp = await http.post(
            "https://apis.fotohub.app/brand/v1/brands",
            headers=headers,
            json={
                "name": "Lumiere_Cosmetics",
                "description": "Luxury cosmetics virtual ambassador, cinematic lighting, 8k resolution.",
                "base_model": "seedream-5-0-260128",
                "negative_prompt": "low quality, distorted, cartoon, 3d render",
            },
        )
        brand = resp.json()
        print(f"Created brand: {brand['id']}")
        return brand
```

```typescript [TypeScript]
async function createBrand() {
  const brand = await fetch('https://apis.fotohub.app/brand/v1/brands', {
    method: 'POST',
    headers: { Authorization: 'Bearer fh_live_your_api_key', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Lumiere_Cosmetics',
      description: 'Luxury cosmetics virtual ambassador, cinematic lighting, 8k resolution.',
      base_model: 'seedream-5-0-260128',
      negative_prompt: 'low quality, distorted, cartoon, 3d render',
    }),
  }).then((r) => r.json());
  console.log(`Created brand: ${brand.id}`);
}
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/brand/v1/brands \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lumiere_Cosmetics",
    "description": "Luxury cosmetics virtual ambassador",
    "base_model": "seedream-5-0-260128"
  }'
```

:::

### 2. Extracting DNA and Generating the Face

Extract DNA from reference images and generate a highly consistent virtual face.

Real endpoints: `POST /brand/v1/brands/{brand_id}/extract-dna`,
`POST /brand/v1/brands/{brand_id}/faces/generate`,
`POST /brand/v1/brands/{brand_id}/faces/{face_id}/perspectives`,
`POST /brand/v1/brands/{brand_id}/faces/{face_id}/expressions`. There is no SDK wrapper.

```python
async def setup_ambassador(brand_id: str):
    headers = {"Authorization": "Bearer fh_live_your_api_key"}
    base = f"https://apis.fotohub.app/brand/v1/brands/{brand_id}"
    async with httpx.AsyncClient() as http:
        # Extract facial DNA
        dna = (await http.post(f"{base}/extract-dna", headers=headers, json={
            "image_urls": ["https://storage.fotohub.app/ref1.jpg", "https://storage.fotohub.app/ref2.jpg"],
        })).json()

        # Lock in the face
        face = (await http.post(f"{base}/faces/generate", headers=headers, json={
            "demographics": {"ethnicity": "east_asian", "age": 25},
        })).json()

        # Generate essential perspectives
        perspectives = (await http.post(f"{base}/faces/{face['id']}/perspectives", headers=headers, json={
            "angles": ["front", "profile_left", "profile_right", "high_angle"],
        })).json()

        # Get expressions
        expressions = (await http.post(f"{base}/faces/{face['id']}/expressions", headers=headers, json={
            "types": ["smile", "surprise", "serious"],
        })).json()

        return face
```

### 3. Generating a Monthly Content Calendar (Async Batch)

To generate hundreds of variations for a monthly calendar without blocking, utilize `asyncio.gather` combined with the SDK's built-in `httpx.AsyncClient` pooling.

::: warning Rate Limits
FOTOhub supports up to 100 concurrent requests on enterprise tiers. Ensure you implement an `asyncio.Semaphore` to throttle concurrency and avoid 429 errors.
:::

```python
async def generate_monthly_calendar(face_id: str, profile_id: str):
    prompts = [f"Ambassador holding product in {setting}" for setting in [
        "a bright modern kitchen, morning light",
        "a neon-lit city street at night",
        "a tranquil zen garden",
        "a bustling cafe in Paris"
    ]] * 10  # 40 total assets

    semaphore = asyncio.Semaphore(15) # Max 15 concurrent generations

    async def _generate(prompt: str):
        async with semaphore:
            # Each generation costs $0.040 USD
            asset = await client.brand.generate_asset(
                face_id=face_id,
                profile_id=profile_id,
                prompt=prompt,
                resolution="1024x1024"
            )
            
            # Compliance Check (Cost: $0.005)
            compliance = await client.brand.check_compliance(
                image_url=asset.url,
                strictness="high"
            )
            
            return asset if compliance.passed else None

    # Run batch
    assets = await asyncio.gather(*[_generate(p) for p in prompts])
    valid_assets = [a for a in assets if a is not None]
    
    print(f"Generated {len(valid_assets)} compliant assets for the calendar.")
```

### Multi-Brand Agency Management

Manage multiple clients by storing their distinct `profile_id` instances.

```python
async def run_agency():
    # 10 clients with different brand profiles
    client_profiles = ["prof_1", "prof_2", "prof_3", "prof_4", "prof_5", "prof_6", "prof_7", "prof_8", "prof_9", "prof_10"]
    # Run pipelines for each...
```

### Brand Engine Parameter Reference

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | `str` | Yes | - | The name of the brand profile. |
| `description` | `str` | Yes | - | Core stylistic instructions applied globally. |
| `base_model` | `str` | No | `"seedream-5-0-260128"` | Check model pricing tables. |
| `negative_prompt` | `str` | No | `""` | Concepts to avoid in all outputs. |
| `brand_guidelines` | `dict` | No | `{}` | Key-value pairs matching JSON guidelines schema. |
| `strictness` | `str` | No | `"medium"` | `low`, `medium`, or `high` for compliance checks. |

---

## UGC Studio: Automated Ad Factory

::: warning No `client.ugc` — and two different hosts underneath
There is no `client.ugc` in any SDK; call these with raw HTTP. `POST /v1/ugc/render` (flat, no
project) does not exist anywhere. What does exist:

- `POST /ugc/creative/brief`, `/ugc/creative/angles`, `/ugc/creative/script` for the brief/angle/
  script steps — first-party session auth (a Supabase user JWT), **not** an `fh_live_*` API key.
- `POST /v1/ugc/projects`, `PUT /v1/ugc/projects/{id}/blueprint`,
  `POST /v1/ugc/projects/{id}/render`, `GET /v1/ugc/jobs/{id}`, `POST /v1/ugc/estimate` —
  the real `fh_live_*` API-key surface for creating a project, saving its blueprint, pricing it,
  rendering it and polling the job. A public SDK integration can call this half today, with an
  API key; it has to produce the brief/angle/script content another way (its own LLM call) to
  reach it without a first-party session.
:::

### Verifying Webhooks (HMAC-SHA256)

When the asynchronous UGC render completes, FOTOhub sends a POST request to your `webhook_url`. You **must** verify the signature to prevent spoofing.

```python
import hmac
import hashlib

def verify_fotohub_webhook(payload: bytes, signature_header: str, webhook_secret: str) -> bool:
    """
    Verify the FOTOhub webhook signature.
    """
    expected_mac = hmac.new(
        webhook_secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_mac, signature_header)
```

### Auto-publish to TikTok on Webhook Receive
```python
async def on_webhook_received(payload: dict):
    if payload.get("event") == "render_completed":
        video_url = payload.get("video_url")
        # Post to TikTok directly using Social Studio
        # Cost: Free to publish
        client.social.publish_now(
            media_urls=[video_url],
            caption="New UGC Ad #ad",
            platforms=["tiktok"]
        )
```

### Async Batch UGC (5 products * 3 angles * 2 actors = 30 variants)
```python
async def batch_ugc(products, angles, actors):
    jobs = []
    # Loop and gather 30 render jobs...
    return jobs
```

### UGC Parameter Reference

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `script_id` | `str` | Yes | - | ID of the script generated via `generate_script`. |
| `actor` | `str` | Yes | - | Standard library actor or custom brand face ID. |
| `voice` | `str` | No | `"eleven_multilingual_v2"` | TTS Voice model. |
| `webhook_url` | `str` | No | `None` | URL to receive the `render_completed` event. |
| `duration_target`| `int` | No | `15` | Target duration in seconds. |

---

## Social Studio & Multi-Platform Publishing

::: warning No `client.social` namespace, and no `/v1/social/schedule`
No SDK ships a `social` wrapper. The real endpoint is `POST /social/v1/posts` (behind the `/social/`
gateway prefix) — pass a `scheduled_at` field to schedule it, or omit it to publish immediately.
Caption generation is `POST /social/v1/ai/generate-caption`.
:::

### Immediate Publishing and Captioning

::: code-group

```python [Python]
import httpx

async def schedule_social_campaign(image_url: str):
    headers = {"Authorization": "Bearer fh_live_your_api_key"}
    async with httpx.AsyncClient() as http:
        caption = (await http.post(
            "https://apis.fotohub.app/social/v1/ai/generate-caption",
            headers=headers,
            json={"image_url": image_url, "platform": "instagram", "tone": "witty"},
        )).json()

        post = (await http.post(
            "https://apis.fotohub.app/social/v1/posts",
            headers=headers,
            json={
                "media_urls": [image_url],
                "caption": caption["text"],
                "platforms": ["instagram", "tiktok"],
                "scheduled_at": "2026-10-31T14:00:00Z",
            },
        )).json()

        print(f"Scheduled Post ID: {post['id']}")
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/social/v1/posts \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "media_urls": ["https://storage.fotohub.app/img.jpg"],
    "caption": "Hello world! #AI",
    "platforms": ["instagram", "tiktok"],
    "scheduled_at": "2026-10-31T14:00:00Z"
  }'
```
:::

---

## Document Intelligence & OCR

::: warning No `client.documents` namespace, and no PII redaction
There is no `documents` wrapper in the SDK — call the endpoints directly. There is also no
redaction endpoint anywhere on the platform; `redact_pii()` below does not correspond to anything
real and has been removed from this example.
:::

### Invoice Automation Pipeline

Extract invoice data with `POST /v1/ai/document/analyze-expense` (specialised) or
`POST /v1/ai/document/analyze` (general tables/forms/signatures), and pipe the result to your ERP.

::: code-group

```python [Python]
import httpx

def process_expenses(pdf_url: str):
    headers = {"Authorization": "Bearer fh_live_your_api_key"}

    # General OCR / tables / forms
    doc_analysis = httpx.post(
        "https://apis.fotohub.app/v1/ai/document/analyze",
        headers=headers,
        json={"document_url": pdf_url, "features": ["TABLES", "FORMS"]},
    ).json()

    # Expense/invoice specifically
    invoice = httpx.post(
        "https://apis.fotohub.app/v1/ai/document/analyze-expense",
        headers=headers,
        json={"document_url": pdf_url},
    ).json()

    print(f"Extracted Total: ${invoice.get('total_amount_usd')}")
    print(f"Vendor: {invoice.get('vendor_name')}")
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/document/analyze-expense \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "document_url": "https://storage/invoice.pdf"
  }'
```
:::

---

## Advanced Async Patterns & Concurrency

When orchestrating FOTOhub at scale, standard blocking HTTP calls become a bottleneck. The Python SDK supports advanced `asyncio` patterns.

### 1. Connection Pool Reuse

By using `AsyncFotoHub` as an async context manager, the underlying `httpx.AsyncClient` HTTP/2 connection pool is reused. This prevents TLS handshake overhead on every request.

```python
import asyncio
from fotohub import AsyncFotoHub

async def main():
    # Context manager ensures connection pooling and clean teardown
    async with AsyncFotoHub(api_key="fh_live_your_api_key") as client:
        res1 = await client.images.generate(prompt="Cat")
        res2 = await client.images.generate(prompt="Dog")
```

### 2. Structured Concurrency (TaskGroup)

Python 3.11+ introduces `asyncio.TaskGroup`. If any sub-task fails (e.g. 402 Insufficient Funds), the group cancels the remaining tasks cleanly.

```python
import asyncio
from fotohub import AsyncFotoHub

async def generate_variants(prompts: list[str]):
    results = []
    async with AsyncFotoHub(api_key="fh_live_your_api_key") as client:
        async with asyncio.TaskGroup() as tg:
            tasks = [
                tg.create_task(client.images.generate(prompt=p)) 
                for p in prompts
            ]
        # All tasks are complete here
        results = [task.result() for task in tasks]
    return results
```

### 3. Producer-Consumer Pipeline for Video Generation

For long-running tasks like Video Generation (GPU2 - MMAudio), use `asyncio.Queue`.

```python
import asyncio
from fotohub import AsyncFotoHub

async def producer(queue: asyncio.Queue, prompts: list[str]):
    for p in prompts:
        await queue.put(p)
    # Poison pill
    for _ in range(5):
        await queue.put(None)

async def consumer(queue: asyncio.Queue, client: AsyncFotoHub, worker_id: int):
    while True:
        prompt = await queue.get()
        if prompt is None:
            break
        print(f"Worker {worker_id} generating: {prompt}")
        res = await client.video.generate(prompt=prompt, duration=5)
        print(f"Cost: ${res.cost_usd:.3f}")
        queue.task_done()

async def run_pipeline():
    prompts = ["A car driving", "A man walking", "A bird flying", "A ship sailing"] * 10
    queue = asyncio.Queue()
    
    async with AsyncFotoHub(api_key="fh_live_your_api_key") as client:
        # Start 5 consumer workers
        consumers = [asyncio.create_task(consumer(queue, client, i)) for i in range(5)]
        # Start producer
        prod = asyncio.create_task(producer(queue, prompts))
        
        await asyncio.gather(prod, *consumers)
```

### 4. Async File I/O with aiofiles

```python
import aiofiles
import httpx

async def save_asset(url: str, filepath: str):
    async with httpx.AsyncClient() as http_client:
        response = await http_client.get(url)
        async with aiofiles.open(filepath, 'wb') as f:
            await f.write(response.content)
```

---

## Complete Pydantic V2 Type Reference

FOTOhub heavily relies on Pydantic V2 for rigorous schema validation.

### Request Validators

When you send a request, the SDK validates fields before the HTTP request is even dispatched. For example, USD amounts must be >= 0.

```python
from pydantic import BaseModel, Field, field_validator

class PaymentTopUpRequest(BaseModel):
    amount_usd: float = Field(..., description="Amount to add in USD")
    
    @field_validator('amount_usd')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Top up amount must be > $0.00 USD")
        return v
```

### Response Models and Computed Fields

```python
from pydantic import BaseModel, computed_field

class GenerationResponse(BaseModel):
    id: str
    base_cost: float
    tax: float
    
    @computed_field
    def total_cost_usd(self) -> float:
        return self.base_cost + self.tax
```

### Model Config & Dict Serialization

Models implement `model_dump()` to serialize to dicts, useful for parsing webhook payloads.

```python
from fotohub.types.webhooks import WebhookPayload

payload_dict = {
    "event": "render_completed",
    "cost_usd": 1.250,
    "resource_id": "job_123"
}

# Parse from arbitrary dictionary
webhook = WebhookPayload.model_validate(payload_dict)

# Serialize back, respecting aliases
json_str = webhook.model_dump_json(by_alias=True)
```

Model config for parsing:
```python
from pydantic import ConfigDict

class WebhookPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=lambda x: x.upper())
```

---

## pytest Test Suite for FotoHub Integrations

We recommend using `pytest`, `respx`, and the SDK's built-in sandbox keys to write tests.

::: warning There is no sandbox
FOTOhub has no test-key prefix and no mock-response mode — every key is
`fh_live_*` and every successful call spends real wallet balance. Test against a
mocked transport instead; RESPX below is the idiomatic way to do that in Python.
:::

### Mocking with RESPX

Mock network calls tightly to test error states (e.g. 402 Insufficient Funds).

```python
import pytest
import respx
from httpx import Response
from fotohub import FotoHub
from fotohub.exceptions import InsufficientFundsError

@pytest.fixture
def client():
    return FotoHub(api_key="fh_live_4f3a9c2e8b71d0a6f5c3e9b2a7d41f68")

@respx.mock
def test_insufficient_funds(client):
    # Mock the API returning 402
    respx.post("https://apis.fotohub.app/v1/ai/generate/image").mock(
        return_value=Response(
            402, 
            json={"error": "Insufficient funds in prepaid USD wallet", "shortfall_usd": 5.0}
        )
    )
    
    with pytest.raises(InsufficientFundsError) as exc_info:
        client.generate_image(prompt="Test")
        
    assert exc_info.value.shortfall_usd == 5.0
```

### Parametrized Tests across Models

```python
@pytest.mark.parametrize("model,expected_cost", [
    ("seedream-5-0-260128", 0.040),
    ("fotohub-turbo", 0.010),
    ("fotohub-flux", 0.025)
])
def test_image_generation_pricing(client, model, expected_cost):
    # Costs come from the live pricing table; mock the transport to assert on them
    res = client.generate_image(prompt="A test image", model=model)
    assert res.cost_usd == expected_cost
```

### Coverage for 429 and 503 Errors
```python
@respx.mock
def test_rate_limit(client):
    respx.post("https://apis.fotohub.app/v1/ai/generate/image").mock(
        return_value=Response(429, json={"error": "Rate limited"})
    )
    # Test retry logic or exception...
```

### Factory Functions for Test Data
```python
def make_mock_image_response(cost_usd=0.040):
    return {"url": "https://example.com/img.jpg", "cost_usd": cost_usd}
```

---

## AI Agent Orchestration with FOTOhub Tools

FOTOhub functions can be natively registered as "tools" for LLMs like Claude or OpenAI, allowing autonomous agents to research, generate, and compare assets.

### OpenAI Function Calling Wrapper

```python
fotohub_image_tool = {
    "type": "function",
    "function": {
        "name": "generate_image",
        "description": "Generates a photorealistic image using FOTOhub. Costs $0.040 USD per call.",
        "parameters": {
            "type": "object",
            "properties": {
                "prompt": {"type": "string"},
                "model": {"type": "string", "enum": ["seedream-5-0-260128", "fotohub-turbo"]}
            },
            "required": ["prompt"]
        }
    }
}
```

### Claude Anthropic via `tool_use`
```python
anthropic_tool = {
    "name": "fotohub_generate",
    "description": "Generate an image via FOTOhub API. Cost: $0.040 USD.",
    "input_schema": {
        "type": "object",
        "properties": {
            "prompt": {"type": "string"}
        },
        "required": ["prompt"]
    }
}
```

### LangChain Integration

```python
from langchain.tools import BaseTool
from fotohub import FotoHub

class FotoHubImageTool(BaseTool):
    name = "fotohub_image_generator"
    description = "Use this tool to generate high quality images."
    
    def _run(self, prompt: str) -> str:
        client = FotoHub(api_key="fh_live_your_api_key")
        res = client.images.generate(prompt=prompt)
        return f"Image generated at {res.url}. Cost: ${res.cost_usd:.3f}"

# Pass to agent
# agent = initialize_agent([FotoHubImageTool()], llm, agent="zero-shot-react-description")
```

### LlamaIndex Tool Integration
```python
from llama_index.core.tools import FunctionTool

def generate_image_tool(prompt: str) -> str:
    client = FotoHub(api_key="fh_live_your_api_key")
    res = client.images.generate(prompt=prompt)
    return res.url

llama_tool = FunctionTool.from_defaults(fn=generate_image_tool)
```

### Autonomous Image Research Agent Pipeline
- **Search**: `agent` decides what to generate
- **Generate**: Calls FOTOhub tool
- **Compare**: Runs OCR on image to verify text

---

## Production FastAPI + Celery + Redis Blueprint

For large-scale applications, you should decouple API requests from generation tasks.

### 1. Lifespan and Dependencies

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fotohub import AsyncFotoHub

clients = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize connection pool on startup
    clients["fotohub"] = AsyncFotoHub(api_key="fh_live_your_api_key")
    yield
    # Teardown
    await clients["fotohub"].close()

app = FastAPI(lifespan=lifespan)

def get_fotohub() -> AsyncFotoHub:
    return clients["fotohub"]
```

### 2. Celery Worker (Redis Broker)

Store expensive generations in Redis, execute via Celery.

```python
from celery import Celery
from fotohub import FotoHub

celery_app = Celery('tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

@celery_app.task(bind=True, max_retries=3)
def background_generate(self, prompt: str):
    client = FotoHub(api_key="fh_live_your_api_key")
    try:
        # Sync client used in Celery worker thread
        res = client.images.generate(prompt=prompt)
        return {"url": res.url, "cost_usd": res.cost_usd}
    except Exception as e:
        self.retry(exc=e, countdown=10)
```

### 3. API Endpoint Triggering Celery

```python
@app.post("/api/v1/generate")
async def trigger_generation(prompt: str):
    # Dispatch to background queue
    task = background_generate.delay(prompt)
    return {"task_id": task.id, "status": "processing"}
```

### Redis Result Caching for Expensive Generation Jobs
```python
import redis
import hashlib

r = redis.Redis(host='localhost', port=6379, db=1)

def cached_generation(prompt: str):
    prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()
    cached = r.get(prompt_hash)
    if cached:
        return cached.decode('utf-8')
    
    # Not cached, run generation
    client = FotoHub(api_key="fh_live_your_api_key")
    res = client.images.generate(prompt=prompt)
    
    r.set(prompt_hash, res.url, ex=86400) # cache for 1 day
    return res.url
```

### Celery Beat Schedule for Recurring Content Generation
```python
celery_app.conf.beat_schedule = {
    'generate-daily-content': {
        'task': 'tasks.background_generate',
        'schedule': 86400.0,
        'args': ('Daily inspirational quote background',)
    },
}
```

### Health Check Endpoint Validating API Connectivity
```python
@app.get("/health")
async def health_check():
    client = get_fotohub()
    # Simple lightweight call to verify connectivity
    try:
        await client.billing.get_balance()
        return {"status": "healthy"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
```

### Prometheus Metrics
```python
from prometheus_client import Counter, Histogram

GEN_DURATION = Histogram('fotohub_gen_duration_seconds', 'Time spent generating')
COST_USD = Counter('fotohub_cost_usd_total', 'Total USD spent')
ERRORS = Counter('fotohub_errors_total', 'Total FOTOhub errors')
```

This ensures your API layer maintains sub-10ms response times while delegating heavy FOTOhub GPU workloads to background workers.
