# PHP SDK Reference

An enterprise-grade, PSR-compliant PHP client library for the FOTOhub API platform. Designed for PHP 8.2+ and 8.3+, providing strict typing, readonly DTOs, enum support, Guzzle 7/8 HTTP client abstraction, async promise concurrency, automatic exponential retry policies with jitter, cryptographic webhook verification, and native adapters for Laravel 11, Symfony 7, and WooCommerce.

::: info Pure USD Prepaid Wallet Billing
FOTOhub operates exclusively on transparent 1:1 pass-through USD pricing billed directly against your prepaid wallet balance (`wallet.available_usd`). There are no synthetic credits, no monthly subscription lock-ins, and no conversion markups. All method returns provide exact floating-point USD fees (`usdCharged`) down to 6 decimal places (`$0.000001`).
:::

---

## Architecture & System Design

```mermaid
flowchart TD
    App["PHP Application (Laravel 11 / Symfony 7 / WordPress / CLI)"] --> Client["FotoHub\\Client (Facade / Service Container)"]
    
    subgraph "Core Client Engine"
        Client --> Config["FotoHub\\Config (API Key, Timeout, BaseURL, Proxies)"]
        Client --> HandlerStack["Guzzle 7/8 HandlerStack"]
        HandlerStack --> RetryMiddleware["Retry Middleware (429 / 5xx Exponential Jitter)"]
        HandlerStack --> AuthMiddleware["Auth Middleware (Bearer Token & User-Agent)"]
        HandlerStack --> IdempotencyMiddleware["Idempotency Middleware (X-Idempotency-Key)"]
        HandlerStack --> TelemetryMiddleware["Prometheus / OpenTelemetry Metrics"]
    end

    subgraph "Domain Service Gateways"
        Client --> Img["$client->images() (Generation, Stability Inpaint/Outpaint/Erase)"]
        Client --> Vid["$client->videos() (Kling, Veo, Sora, Seedance 2.5 V2V)"]
        Client --> Aud["$client->audio() (Gemini TTS, Azure Neural, Whisper, Demucs)"]
        Client --> Mesh["$client->mesh3d() (FH Pro 3D, TripoSR, Quad Remesh, USDZ)"]
        Client --> Comp["$client->compute() (EC2 A10G/T4 On-Demand/Spot Provisioning)"]
        Client --> Sand["$client->sandbox() (Firecracker MicroVM Python Execution)"]
        Client --> Short["$client->shorts() (11-Step Viral Clipping Engine & Multicam)"]
        Client --> Lip["$client->lipSync() (LatentSync HD, MuseTalk, FaceFusion)"]
        Client --> Brnd["$client->brand() (Brand DNA & Consistent Virtual Faces)"]
        Client --> Soc["$client->social() (Social Studio Multi-Platform Publisher)"]
        Client --> UGC["$client->ugc() (AI Creators, Script Hooks & Ad Render)"]
        Client --> Doc["$client->documents() (OCR Tables, Invoices & AWS Textract)"]
        Client --> Dest["$client->destinations() (BYOB AWS S3 / Cloudflare R2 Routing)"]
    end

    subgraph "Cryptographic & Utility Layer"
        Client --> Webhook["FotoHub\\Webhooks\\SignatureVerifier (HMAC-SHA256)"]
        Client --> DTO["FotoHub\\DTO\\* (Strict Readonly DTOs & Backed Enums)"]
        Client --> Exc["FotoHub\\Exceptions\\* (InsufficientFundsException, RateLimitException)"]
    end
```

---

## Installation & System Requirements

### Prerequisites
- **PHP**: `>= 8.2.0` (fully tested with PHP 8.2 and 8.3)
- **Required Extensions**:
  - `ext-curl`: High-performance HTTP/2 transport
  - `ext-json`: Streaming and low-memory JSON parsing
  - `ext-openssl`: Cryptographic HMAC-SHA256 webhook signatures
  - `ext-mbstring`: Multilingual UTF-8 text normalization
- **Optional Extensions**:
  - `ext-parallel` or `ext-fiber`: True asynchronous parallel execution
  - `ext-redis`: Distributed rate limiting and idempotency caching

### Composer Installation

```bash
composer require fotohub/fotohub-php
```

If integrating with Laravel:

```bash
php artisan vendor:publish --provider="FotoHub\Laravel\FotoHubServiceProvider" --tag="config"
```

---

## Initialization & Configuration

### Basic Initialization

Initialize `FotoHub\Client` with your API key (`fh_live_...`) or allow it to read automatically from the `FOTOHUB_API_KEY` environment variable:

```php
<?php

declare(strict_types=1);

use FotoHub\Client;
use FotoHub\Config;

// Reads FOTOHUB_API_KEY from getenv() or $_ENV automatically
$client = new Client();

// Or explicit configuration:
$client = new Client(
    apiKey: 'fh_live_98a76bc45df3210e',
    config: new Config(
        baseUrl: 'https://apis.fotohub.app',
        timeout: 60.0,
        connectTimeout: 5.0,
        maxRetries: 4,
        retryDelayMs: 500,
        debug: false
    )
);
```

### Full Configuration Reference

| Option | Type | Default | Description |
|:---|:---|:---|:---|
| `apiKey` | `string` | `getenv('FOTOHUB_API_KEY')` | Live secret API key starting with `fh_live_` |
| `baseUrl` | `string` | `https://apis.fotohub.app` | Regional API gateway base endpoint |
| `computeBaseUrl` | `string` | `https://apis.fotohub.app/compute/v1` | Dedicated Cloud Compute engine base endpoint |
| `timeout` | `float` | `60.0` | Total request timeout in seconds |
| `connectTimeout` | `float` | `5.0` | Socket TCP/TLS connection timeout |
| `maxRetries` | `int` | `3` | Maximum automatic retries on HTTP 429 and 5xx errors |
| `retryDelayMs` | `int` | `500` | Initial exponential backoff delay in milliseconds |
| `proxy` | `?string` | `null` | Corporate HTTP/HTTPS proxy (`http://proxy:8080`) |
| `verifySsl` | `bool` | `true` | Enforces TLS peer verification (never disable in production) |

---

## Domain 1: Image Generation & Studio Stability Tools

The `$client->images()` domain provides text-to-image synthesis across state-of-the-art foundation models alongside pixel-level computational photography tools.

### Text-to-Image Generation

```php
<?php

declare(strict_types=1);

use FotoHub\Client;
use FotoHub\DTO\ImageGenerateRequest;
use FotoHub\Enums\AspectRatio;

$client = new Client();

$response = $client->images()->generate(new ImageGenerateRequest(
    prompt: 'Ultra-luxury ceramic espresso cup on rough travertine stone, soft morning shadows, Hasselblad 80mm f/2.8',
    model: 'seedream-5-0-260128',
    aspectRatio: AspectRatio::SQUARE, // '1:1'
    numImages: 2,
    negativePrompt: 'blurry, oversaturated, low quality, artifacts',
    seed: 42019
));

echo "Generated Image: " . $response->images[0]->url . "\n";
echo "USD Charged: $" . number_format($response->usdCharged, 4) . " USD\n";
echo "Remaining Balance: $" . number_format($response->balanceUsd, 2) . " USD\n";
```

### Background Removal Pro (Alpha Channel Isolation)

```php
$result = $client->images()->removeBackground(
    imageUrl: 'https://cdn.merchant.com/raw/leather_boot.jpg',
    model: 'birefnet-general',
    outputFormat: 'png' // Translucent alpha channel PNG
);

echo "Cutout URL: " . $result->url . "\n";
```

### Studio Inpainting & Replacement

```php
$inpainted = $client->images()->inpaint(
    imageUrl: 'https://cdn.merchant.com/raw/sofa.jpg',
    maskUrl: 'https://cdn.merchant.com/raw/sofa_pillow_mask.png',
    prompt: 'A handcrafted emerald green silk embroidered throw pillow',
    model: 'seedream-5-0-inpaint',
    creativity: 0.75
);
```

### Super-Resolution 4K Upscaling

```php
$upscaled = $client->images()->upscale(
    imageUrl: 'https://cdn.merchant.com/renders/draft_512.webp',
    scaleFactor: 4, // 512x512 -> 2048x2048
    model: 'codeformer-superres'
);
```

---

## Domain 2: Video Generation & Motion Dynamics

The `$client->videos()` domain controls neural video synthesis models with support for text-to-video, image-to-video, and Seedance 2.5 video-to-video style transfer.

### Text-to-Video Generation

```php
<?php

declare(strict_types=1);

use FotoHub\Client;
use FotoHub\DTO\VideoGenerateRequest;
use FotoHub\Enums\VideoResolution;

$client = new Client();

$job = $client->videos()->create(new VideoGenerateRequest(
    prompt: 'Cinematic FPV drone shot flying through a neon-lit cyberpunk Tokyo alleyway in heavy rain, reflections',
    model: 'wan-2-2-t2v-pro',
    durationSeconds: 5,
    resolution: VideoResolution::HD_1080P,
    fps: 30
));

echo "Job Dispatched: {$job->id}. Awaiting completion...\n";

// Block and poll with automatic exponential backoff
$video = $client->videos()->waitForCompletion($job->id, timeoutSeconds: 300);

echo "Rendered Video: {$video->videoUrl}\n";
echo "Duration: {$video->durationSeconds}s | USD Charged: \${$video->usdCharged}\n";
```

### Seedance 2.5 Video-to-Video Style Transfer

```php
$v2vJob = $client->videos()->createVideoToVideo(
    sourceVideoUrl: 'https://cdn.merchant.com/raw/dance_original.mp4',
    prompt: 'Transform the dancer into a futuristic chrome humanoid android on a glowing glass dancefloor',
    model: 'seedance-2-5-v2v',
    motionStrength: 0.85
);
```

---

## Domain 3: Audio, Speech & Multilingual TTS

The `$client->audio()` domain interfaces with **Gemini TTS** (30 voices), **Azure Custom Neural Speech** (700+ voices), **Whisper Large-v3** speech recognition, and **Demucs v4** stem separation.

### Gemini TTS Multi-Speaker Synthesis

```php
<?php

declare(strict_types=1);

use FotoHub\Client;
use FotoHub\DTO\GeminiTtsRequest;

$client = new Client();

$speech = $client->audio()->geminiTts(new GeminiTtsRequest(
    text: 'Welcome to FotoHUB. High-performance cloud computing and AI orchestration for forward-thinking engineering teams.',
    voiceId: 'en-US-Journey-F',
    languageCode: 'en-US',
    speed: 1.05,
    pitch: 0.0,
    audioFormat: 'mp3_192k'
));

echo "Audio File: " . $speech->audioUrl . "\n";
echo "Duration: " . $speech->durationSeconds . "s\n";
echo "Cost: $" . number_format($speech->usdCharged, 4) . " USD\n";
```

### Stem Separation with Demucs v4

```php
$stems = $client->audio()->separateStems(
    audioUrl: 'https://cdn.merchant.com/audio/podcast_sample.mp3',
    stems: ['vocals', 'accompaniment']
);

echo "Isolated Vocals: " . $stems->vocalsUrl . "\n";
echo "Isolated Background: " . $stems->accompanimentUrl . "\n";
```

---

## Domain 4: 3D Meshes & Geometry Processing

The `$client->mesh3d()` domain bridges 2D photos to watertight, quad-remeshed 3D assets on dedicated GPU nodes (GPU4 and GPU5).

### 2D Photo to PBR 3D Mesh & Apple USDZ

```php
<?php

declare(strict_types=1);

use FotoHub\Client;
use FotoHub\DTO\Mesh3DGenerateRequest;

$client = new Client();

// 1. Submit to FH Pro 3D on GPU5 (NVIDIA A10G)
$job = $client->mesh3d()->generate(new Mesh3DGenerateRequest(
    imageUrl: 'https://cdn.store.com/clean_cutout_shoe.png',
    model: 'fh-pro-3d',
    enableTexture: true,
    steps: 30,
    octreeResolution: 256
));

$mesh = $client->mesh3d()->waitForCompletion($job->id);
echo "Raw GLB Mesh: {$mesh->glbUrl}\n";

// 2. Decimate and Quad-Remesh on GPU4
$remeshed = $client->mesh3d()->remesh(
    inputUrl: $mesh->glbUrl,
    targetFaces: 25000,
    mode: 'quad_dominant',
    preserveUv: true
);
echo "Optimized Quad GLB: {$remeshed->outputUrl}\n";

// 3. Calibrate metric millimeters & convert to Apple iOS USDZ
$arAsset = $client->mesh3d()->convert(
    inputUrl: $remeshed->outputUrl,
    outputFormat: 'usdz',
    targetSizeMm: 290.0 // Real shoe length in mm
);
echo "Apple AR Quick Look Asset: {$arAsset->outputUrl}\n";
```

---

## Domain 5: Cloud Compute & GPU Rental (`$client->compute()`)

Direct programmatic orchestration of dedicated NVIDIA GPU and high-compute CPU instances in AWS Frankfurt (`eu-central-1`).

### Instance Provisioning with Preflight Budget Gate

```php
<?php

declare(strict_types=1);

use FotoHub\Client;
use FotoHub\DTO\Compute\ProvisionInstanceRequest;
use FotoHub\DTO\Compute\SecurityRule;

$client = new Client();

// 1. Preflight eligibility check
$eligibility = $client->compute()->instances()->checkEligibility();
if (!$eligibility->allowed) {
    throw new RuntimeException("Compute gated: {$eligibility->reason}. Balance: \${$eligibility->walletBalance} USD");
}

// 2. Cost estimation
$estimate = $client->compute()->instances()->estimateCost(
    catalogId: 'g5.xlarge',
    runtimeHours: 12,
    rootVolumeGb: 100,
    isSpot: true
);
echo "Estimated Hourly Rate: \${$estimate->hourlyRateUsd}/hr (Total: \${$estimate->totalEstimatedCostUsd})\n";

// 3. Provision NVIDIA A10G Spot Instance
$instance = $client->compute()->instances()->provision(new ProvisionInstanceRequest(
    catalogId: 'g5.xlarge',
    name: 'comfyui-render-node-01',
    region: 'eu-central-1',
    maxRuntimeHours: 24,
    spotInstance: true,
    rootVolumeType: 'gp3',
    rootVolumeSizeGb: 100,
    installPresets: ['docker', 'python-ml', 'monitoring'],
    securityGroupRules: [
        new SecurityRule(protocol: 'tcp', port: 22, cidr: '0.0.0.0/0', description: 'SSH'),
        new SecurityRule(protocol: 'tcp', port: 8188, cidr: '0.0.0.0/0', description: 'ComfyUI Web')
    ],
    labels: ['environment' => 'production', 'pipeline' => 'batch-renders']
));

echo "Provisioning Instance: {$instance->id} (Status: {$instance->status})\n";

// 4. Wait for running status & retrieve connection details
$active = $client->compute()->instances()->waitForRunning($instance->id);
echo "Instance is active at IP: {$active->publicIp}\n";

// 5. Download ephemeral SSH Private Key
$sshKey = $client->compute()->instances()->getSshKey($instance->id);
file_put_contents('/tmp/instance_key.pem', $sshKey->privateKeyOpenSsh);
chmod('/tmp/instance_key.pem', 0600);
```

### Complete Instance Lifecycle Controls

```php
// Stop instance (EBS root volume preserved at $0.08/GB-month)
$client->compute()->instances()->stop($instance->id);

// Start stopped instance
$client->compute()->instances()->start($instance->id);

// Reboot instance
$client->compute()->instances()->reboot($instance->id);

// Online EBS volume resize
$client->compute()->volumes()->update($instance->id, volumeId: 'vol-01', sizeGb: 250, iops: 5000);

// Irreversible termination (stops all charges immediately)
$client->compute()->instances()->terminate($instance->id);
```

---

## Domain 6: Firecracker MicroVM Sandboxes (`$client->sandbox()`)

Execute untrusted customer Python scripts, perform accounting verifications, and run lightweight data transforms inside ephemeral AMD EPYC microVMs booting in `<200ms`.

```php
<?php

declare(strict_types=1);

use FotoHub\Client;

$client = new Client();

$sandboxResult = $client->sandbox()->execPython(
    code: <<<'PYTHON'
import json

data = inputs.get("raw_invoice", {})
line_items = data.get("items", [])
computed_subtotal = sum(item["qty"] * item["unit_price"] for item in line_items)
tax = computed_subtotal * 0.23
grand_total = computed_subtotal + tax

result = {
    "computed_subtotal": round(computed_subtotal, 2),
    "computed_tax": round(tax, 2),
    "computed_total": round(grand_total, 2),
    "math_reconciled": abs(grand_total - data.get("claimed_total", 0.0)) < 0.01
}
print(f"Reconciliation completed. Match: {result['math_reconciled']}")
__FOTOHUB_RESULT__ = result
PYTHON,
    inputs: [
        'raw_invoice' => [
            'claimed_total' => 123.00,
            'items' => [
                ['qty' => 2, 'unit_price' => 50.00]
            ]
        ]
    ],
    timeoutSeconds: 10
);

if ($sandboxResult->ok) {
    echo "Sandbox stdout:\n" . $sandboxResult->output . "\n";
    print_r($sandboxResult->result);
    echo "Execution Latency: {$sandboxResult->executionMs}ms | RAM: {$sandboxResult->memoryMb}MB\n";
} else {
    echo "Sandbox Execution Error: " . $sandboxResult->error . "\n";
}
```

---

## Domain 7: Shorts 11-Step Viral Clipping Engine (`$client->shorts()`)

Submit long-form video podcasts, webinars, or streams for automated speech-to-text, virality B-Score ranking, 9:16 active speaker reframing, animated karaoke subtitles, B-roll insertion, and -14 LUFS loudness mastering.

```php
<?php

declare(strict_types=1);

use FotoHub\Client;
use FotoHub\DTO\Shorts\CreateClipsRequest;

$client = new Client();

$job = $client->shorts()->createClips(new CreateClipsRequest(
    sourceUrl: 'https://cdn.brand.com/podcasts/episode_142.mp4',
    title: 'AI Engineering Keynote',
    maxClips: 4,
    minDuration: 20,
    maxDuration: 60,
    aspectRatio: '9:16',
    captionStyle: 'karaoke',
    enableCaptions: true,
    enableReframe: true,
    enableHooks: true,
    enableCovers: true,
    enableBroll: true,
    enhanceAudio: true,
    removeFillerWords: true,
    webhookUrl: 'https://api.merchant.com/webhooks/fotohub',
    webhookSecret: 'whsec_prod_live_998124',
    settings: [
        'multicam' => 'stack',
        'multicam_dim' => 0.18,
        'audio' => [
            'target_lufs' => -14.0,
            'denoise' => true
        ]
    ]
));

echo "Shorts Job Submitted: {$job->jobId} (USD Charged: \${$job->usdCharged})\n";
```

---

## Domain 8: Lip-Sync & Multilingual Dubbing (`$client->lipSync()`)

Phoneme-accurate neural lip retargeting powered by LatentSync, MuseTalk, and FaceFusion.

```php
<?php

declare(strict_types=1);

use FotoHub\Client;
use FotoHub\DTO\LipSyncRequest;

$client = new Client();

$syncJob = $client->lipSync()->retarget(new LipSyncRequest(
    videoUrl: 'https://cdn.brand.com/raw/ceo_speech.mp4',
    audioUrl: 'https://cdn.brand.com/audio/spanish_translated_voice.wav',
    mode: 'hd', // 'fast' (MuseTalk), 'hd' (LatentSync), 'ultra' (FaceFusion)
    guidanceScale: 2.0,
    inferenceSteps: 30,
    seed: 1247,
    backgroundAudioUrl: 'https://cdn.brand.com/audio/background_music_stem.wav'
));

echo "Lip-Sync Dispatched: {$syncJob->jobId}\n";
```

---

## Domain 9: Brand Engine, Virtual Faces & Social Studio

Extract unified Brand DNA vectors, generate consistent virtual brand ambassadors across lifestyle environments, and schedule cross-platform social publications.

```php
<?php

declare(strict_types=1);

use FotoHub\Client;

$client = new Client();

// 1. Create persistent Virtual Brand Face
$face = $client->brand()->faces()->create(
    name: 'Elena - Technical Ambassador',
    referencePhotoUrls: [
        'https://cdn.brand.com/faces/elena_front.jpg',
        'https://cdn.brand.com/faces/elena_side.jpg'
    ],
    ethnicity: 'Mediterranean',
    gender: 'female',
    ageRange: '28-32'
);

echo "Brand Face ID: {$face->id}\n";

// 2. Generate Brand Face in lifestyle setting
$ambassadorPhoto = $client->brand()->faces()->generateSetting(
    faceId: $face->id,
    settingPrompt: 'Elena presenting in a minimalist sunlit architectural tech studio, wearing charcoal linen blazer',
    aspectRatio: '16:9'
);

// 3. Schedule auto-publishing across social channels
$scheduledPost = $client->social()->schedule(
    mediaUrl: $ambassadorPhoto->url,
    caption: 'Discovering next-generation distributed compute infrastructure at FOTOhub. #CloudComputing #AI',
    platforms: ['tiktok', 'instagram_reels', 'youtube_shorts'],
    publishAt: (new DateTimeImmutable('+2 hours'))->format(DateTimeInterface::ATOM)
);

echo "Scheduled Post ID: {$scheduledPost->id}\n";
```

---

## Domain 10: Bring Your Own Bucket (BYOB) & Destinations

Route all generated media, 3D assets, and video renders directly into your external Cloudflare R2, AWS S3, or Google Cloud Storage buckets, eliminating secondary download scripts and egress bandwidth charges.

```php
<?php

declare(strict_types=1);

use FotoHub\Client;
use FotoHub\DTO\Destination\CreateDestinationRequest;

$client = new Client();

$destination = $client->destinations()->create(new CreateDestinationRequest(
    name: 'Storefront Cloudflare R2 CDN',
    kind: 'external_s3',
    providerPreset: 'r2',
    accountId: 'cf_account_hash_12345',
    bucketName: 'storefront-catalog-assets',
    pathPrefix: 'products/{date}/{sku}_{angle}.webp',
    accessKeyId: 'r2_token_access_key',
    secretAccessKey: 'r2_token_secret_value',
    customDomain: 'https://assets.merchant.com'
));

echo "Destination Registered: {$destination->id}\n";
```

---

## Laravel 10 / 11 Integration

The FOTOhub PHP SDK provides first-class native integration for Laravel applications, including Facades, Service Providers, Artisan CLI commands, Queueable Jobs, and Webhook verification middleware.

### 1. Configuration (`config/fotohub.php`)

```php
<?php

return [
    'api_key' => env('FOTOHUB_API_KEY'),
    'base_url' => env('FOTOHUB_BASE_URL', 'https://apis.fotohub.app'),
    'timeout' => (float) env('FOTOHUB_TIMEOUT', 60.0),
    'connect_timeout' => (float) env('FOTOHUB_CONNECT_TIMEOUT', 5.0),
    'max_retries' => (int) env('FOTOHUB_MAX_RETRIES', 3),
    'webhook_secret' => env('FOTOHUB_WEBHOOK_SECRET'),
];
```

### 2. Laravel Facade Usage

```php
<?php

namespace App\Http\Controllers;

use FotoHub\Laravel\Facades\FotoHub;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function generatePackshot(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image_url' => 'required|url',
            'prompt' => 'required|string',
        ]);

        $result = FotoHub::images()->generate([
            'prompt' => $validated['prompt'],
            'model' => 'seedream-5-0-260128',
            'aspect_ratio' => '1:1',
        ]);

        return response()->json([
            'image_url' => $result->images[0]->url,
            'cost_usd' => $result->usdCharged,
        ]);
    }
}
```

### 3. Laravel Queueable Job

```php
<?php

namespace App\Jobs;

use App\Models\Product;
use FotoHub\Laravel\Facades\FotoHub;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessProduct3DMeshJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600;

    public function __construct(public Product $product) {}

    public function handle(): void
    {
        // 1. Isolate background
        $cutout = FotoHub::images()->removeBackground(
            imageUrl: $this->product->primary_image_url
        );

        // 2. Generate 3D Mesh
        $job = FotoHub::mesh3d()->generate([
            'image_url' => $cutout->url,
            'model' => 'fh-pro-3d',
            'enable_texture' => true,
        ]);

        $mesh = FotoHub::mesh3d()->waitForCompletion($job->id);

        // 3. Convert to Apple USDZ
        $usdz = FotoHub::mesh3d()->convert([
            'input_url' => $mesh->glbUrl,
            'output_format' => 'usdz',
            'target_size_mm' => 250.0,
        ]);

        $this->product->update([
            'glb_model_url' => $mesh->glbUrl,
            'usdz_model_url' => $usdz->outputUrl,
            'is_3d_ready' => true,
        ]);
    }
}
```

### 4. Laravel Webhook Controller with HMAC-SHA256 Verification

```php
<?php

namespace App\Http\Controllers;

use FotoHub\Webhooks\SignatureVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FotoHubWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        $signature = $request->header('X-FotoHub-Signature');
        $secret = config('fotohub.webhook_secret');
        $rawPayload = $request->getContent();

        if (!SignatureVerifier::verify($rawPayload, $signature, $secret)) {
            Log::warning('FotoHUB webhook HMAC signature verification failed');
            return response()->json(['error' => 'Invalid cryptographic signature'], 401);
        }

        $event = $request->input('event');
        $data = $request->input('data');

        match ($event) {
            'shorts.clip.rendered' => $this->handleShortRendered($data),
            'commerce.job.completed' => $this->handleCommerceBatch($data),
            'compute.spot.interruption' => $this->handleSpotInterruption($data),
            default => Log::info("Unhandled FotoHUB event: {$event}")
        };

        return response()->json(['status' => 'acknowledged'], 200);
    }

    protected function handleShortRendered(array $data): void
    {
        Log::info("Short rendered: {$data['clip_id']} with virality score {$data['virality_score']}");
    }

    protected function handleSpotInterruption(array $data): void
    {
        Log::warning("Compute spot instance {$data['instance_id']} flagged for interruption");
    }

    protected function handleCommerceBatch(array $data): void
    {
        Log::info("Commerce batch completed: {$data['total_items']} items processed");
    }
}
```

---

## Symfony 7 Integration

Register `FotoHub\Client` as a shared service in `config/services.yaml`:

```yaml
services:
    FotoHub\Config:
        arguments:
            $apiKey: '%env(FOTOHUB_API_KEY)%'
            $timeout: 60.0
            $maxRetries: 3

    FotoHub\Client:
        arguments:
            $apiKey: '%env(FOTOHUB_API_KEY)%'
            $config: '@FotoHub\Config'
```

Inject directly into Symfony Controller or Service:

```php
<?php

namespace App\Controller;

use FotoHub\Client;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class TtsController extends AbstractController
{
    #[Route('/api/synthesize', methods: ['POST'])]
    public function synthesize(Client $fotoHub): JsonResponse
    {
        $audio = $fotoHub->audio()->geminiTts([
            'text' => 'Order #4891 has shipped.',
            'voice_id' => 'en-US-Journey-F'
        ]);

        return new JsonResponse(['audio_url' => $audio->audioUrl]);
    }
}
```

---

## WooCommerce Product Catalog Automation Plugin

A drop-in WordPress plugin snippet that enriches product galleries with automated studio background staging and SEO-compliant WCAG 2.2 alt-text:

```php
<?php
/**
 * Plugin Name: FotoHUB Commerce Bridge for WooCommerce
 * Description: Automated multi-angle studio packshots and WCAG alt-text enrichment.
 * Version: 1.0.0
 */

declare(strict_types=1);

add_action('woocommerce_process_product_meta', 'fotohub_process_product_packshots', 20, 1);

function fotohub_process_product_packshots(int $product_id): void {
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_product', $product_id)) return;

    $product = wc_get_product($product_id);
    $image_id = $product->get_image_id();
    if (!$image_id) return;

    $image_url = wp_get_attachment_url($image_id);
    if (!$image_url) return;

    $api_key = get_option('fotohub_api_key', defined('FOTOHUB_API_KEY') ? FOTOHUB_API_KEY : '');
    if (empty($api_key)) return;

    // Dispatch background replacement with studio marble podium
    $response = wp_remote_post('https://apis.fotohub.app/v1/images/replace-background', [
        'headers' => [
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type' => 'application/json',
        ],
        'body' => json_encode([
            'image_url' => $image_url,
            'prompt' => 'Clean luxury Scandinavian white marble podium with soft morning shadows',
            'output_format' => 'webp',
        ]),
        'timeout' => 45,
    ]);

    if (is_wp_error($response)) {
        error_log('FotoHUB Packshot Error: ' . $response->get_error_message());
        return;
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);
    if (!empty($body['url'])) {
        update_post_meta($product_id, '_fotohub_packshot_url', esc_url_raw($body['url']));
    }
}
```

---

## Robust Guzzle Middleware, Retries & Circuit Breaker

The SDK ships with built-in resilience middleware configured on Guzzle's `HandlerStack`:

```php
<?php

declare(strict_types=1);

use FotoHub\Client;
use FotoHub\Config;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;

// Custom HandlerStack with Idempotency Key Injection
$stack = HandlerStack::create();

// Middleware: Automatic Idempotency Key for Mutating Operations
$stack->push(Middleware::mapRequest(function (RequestInterface $request) {
    if (in_array($request->getMethod(), ['POST', 'PUT', 'DELETE'], true)) {
        if (!$request->hasHeader('X-Idempotency-Key')) {
            return $request->withHeader('X-Idempotency-Key', bin2hex(random_bytes(16)));
        }
    }
    return $request;
}));

$client = new Client(
    config: new Config(
        handlerStack: $stack,
        maxRetries: 4,
        retryDelayMs: 400
    )
);
```

### Exponential Backoff with Full Jitter Formula

The SDK calculates backoff delays using standard full jitter to prevent thundering herd problems:

$$\text{Delay} = \text{random}\left(0, \min\left(\text{maxDelay}, \text{baseDelay} \times 2^{\text{attempt}}\right)\right)$$

---

## Exception Hierarchy & Error Handling

All SDK exceptions inherit from `FotoHub\Exceptions\FotoHubException`. Typed exceptions allow granular recovery flows:

```php
<?php

declare(strict_types=1);

use FotoHub\Client;
use FotoHub\Exceptions\AuthenticationException;
use FotoHub\Exceptions\InsufficientFundsException;
use FotoHub\Exceptions\RateLimitException;
use FotoHub\Exceptions\ValidationException;
use FotoHub\Exceptions\ServerException;

$client = new Client();

try {
    $result = $client->images()->generate([
        'prompt' => 'A hypercar speeding through a rainy tunnel',
        'model' => 'nano-banana-pro'
    ]);
} catch (InsufficientFundsException $e) {
    // HTTP 402: Prepaid USD wallet balance exhausted
    echo "Top-up required! Available: \${$e->availableBalanceUsd} USD, Needed: \${$e->requiredUsd} USD\n";
    echo "Direct Top-up Link: {$e->topUpUrl}\n";
} catch (RateLimitException $e) {
    // HTTP 429: Concurrency or rate limit reached
    echo "Rate limited. Retry after {$e->retryAfterSeconds} seconds.\n";
    sleep($e->retryAfterSeconds);
} catch (ValidationException $e) {
    // HTTP 422: Invalid parameters
    echo "Parameter violation in field '{$e->field}': {$e->getMessage()}\n";
} catch (AuthenticationException $e) {
    // HTTP 401: Invalid API key
    echo "Authentication failed. Check FOTOHUB_API_KEY.\n";
} catch (ServerException $e) {
    // HTTP 500 / 503: Upstream cluster failure
    echo "Server error: {$e->getMessage()}\n";
}
```

### Exception Reference

| Exception Class | HTTP Status | Contextual Properties | Recommended Resolution |
|:---|:---:|:---|:---|
| `AuthenticationException` | `401` | `$apiKeyPrefix` | Verify `FOTOHUB_API_KEY` token format (`fh_live_...`) |
| `InsufficientFundsException` | `402` | `$availableBalanceUsd`, `$requiredUsd`, `$topUpUrl` | Refill prepaid USD wallet at `/console/billing` |
| `PermissionDeniedException` | `403` | `$requiredScope` | Check API key role permissions or minimum $0.50 USD compute balance |
| `ResourceNotFoundException` | `404` | `$resourceId`, `$resourceType` | Validate Job ID, Instance ID, or model identifier |
| `ValidationException` | `422` | `$violations`, `$field` | Correct parameter types, aspect ratio strings, or durations |
| `RateLimitException` | `429` | `$retryAfterSeconds`, `$limitType` | Back off requests using `sleep($e->retryAfterSeconds)` |
| `ServerException` | `500/503` | `$jobId`, `$nodeId` | Retry request; failed jobs are auto-refunded to wallet |

---

<!-- summary replaced -->

- [x] **PHP 8.2+ Compatibility**: Typed properties, readonly classes, backed enums, and strict types enabled.
- [x] **Pure USD Pricing**: Zero synthetic credits, zero PLN references; all billing returns exact floating-point USD fees.
- [x] **Comprehensive Domain Coverage**: Full parity for Images, Videos, Audio TTS/Stems, 3D Meshes, Cloud Compute, Firecracker Sandboxes, Shorts Engine, Lip-Sync, Brand Engine, and S3 BYOB.
- [x] **Framework Native**: Out-of-the-box support for Laravel 11 (Facades, Queues, Webhooks), Symfony 7, and WooCommerce.
- [x] **Enterprise Resilience**: Automatic exponential jitter retries on 429/5xx, Guzzle handler customization, and cryptographic HMAC-SHA256 signature verification.


---

## Domain 11: Document Intelligence & OCR

FOTOhub's document intelligence surface covers structured extraction (`/v1/ai/document/analyze`) and
invoice/expense parsing (`/v1/ai/document/analyze-expense`). Neither the PHP, Python nor TypeScript SDK
ships a typed `documents()` wrapper for these yet — call the endpoints directly with the SDK's
underlying HTTP client (or plain HTTP), as shown below. There is no batch-processing endpoint and no
PII-redaction endpoint on this surface; do not build against either.

### Synchronous Document Analysis

Extract structured data from a single document synchronously.

::: code-group

```php [PHP]
<?php
declare(strict_types=1);

$apiKey = 'fh_live_your_api_key';
$doc = base64_encode(file_get_contents('invoice.pdf'));

$httpClient = new \GuzzleHttp\Client();

$result = $httpClient->post('https://apis.fotohub.app/v1/ai/document/analyze', [
    'headers' => ['Authorization' => "Bearer {$apiKey}"],
    'json' => ['document_base64' => $doc, 'features' => ['TABLES', 'FORMS', 'SIGNATURES']],
])->getBody();

$expense = $httpClient->post('https://apis.fotohub.app/v1/ai/document/analyze-expense', [
    'headers' => ['Authorization' => "Bearer {$apiKey}"],
    'json' => ['document_base64' => $doc],
])->getBody();

echo $result . "\n";
echo $expense . "\n";
```

```python [Python]
import base64
import httpx

api_key = "fh_live_your_api_key"
with open('invoice.pdf', 'rb') as f:
    doc = base64.b64encode(f.read()).decode('utf-8')

headers = {"Authorization": f"Bearer {api_key}"}
result = httpx.post(
    "https://apis.fotohub.app/v1/ai/document/analyze",
    headers=headers,
    json={"document_base64": doc, "features": ["TABLES", "FORMS", "SIGNATURES"]},
).json()
expense = httpx.post(
    "https://apis.fotohub.app/v1/ai/document/analyze-expense",
    headers=headers,
    json={"document_base64": doc},
).json()

print(f"Cost: ${result.get('cost_usd')} USD")
print(f"Expense Total: {expense.get('total_amount')}")
```

```typescript [TypeScript]
import { readFileSync } from 'fs';

const apiKey = 'fh_live_your_api_key';
const doc = readFileSync('invoice.pdf').toString('base64');
const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

const result = await fetch('https://apis.fotohub.app/v1/ai/document/analyze', {
  method: 'POST',
  headers,
  body: JSON.stringify({ document_base64: doc, features: ['TABLES', 'FORMS', 'SIGNATURES'] }),
}).then((r) => r.json());

const expense = await fetch('https://apis.fotohub.app/v1/ai/document/analyze-expense', {
  method: 'POST',
  headers,
  body: JSON.stringify({ document_base64: doc }),
}).then((r) => r.json());

console.log(`Expense Total: ${expense.total_amount}`);
console.log(`Cost: $${result.cost_usd} USD`);
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/v1/ai/document/analyze \
  -H "Authorization: Bearer fh_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "document_base64": "JVBERi0xLjcK...",
    "features": ["TABLES", "FORMS", "SIGNATURES"]
  }'
```
:::

#### Unit Economics: Document Intelligence
| Operation | Endpoint |
|---|---|
| Structured extraction (tables, forms, signatures) | `POST /v1/ai/document/analyze` |
| Invoice / expense parsing | `POST /v1/ai/document/analyze-expense` |

Pricing is returned per request in the response's `cost_usd` field — call `estimate_cost` /
`estimateCost` beforehand if you need it ahead of time; there is no published flat per-page rate.

---

## Domain 12: UGC Studio & Ad Factory

The `$client->ugc()` domain automates the creation of User Generated Content (UGC) video ads from product URLs.

```mermaid
flowchart TD
    A[Product URL] -->|extract_info| B(Creative Brief)
    B -->|generate_angles| C(Marketing Angles)
    C -->|write_script| D(Ad Script)
    D -->|render_video| E(Final 30s Ad)
    E --> F[Direct Publish to Socials]
```

### End-to-End Ad Pipeline

::: code-group
```php [PHP]
<?php
// 1. Create a brief from a product page
$brief = $client->ugc()->createBrief('https://shopify.com/products/hydrating-serum');

// 2. Generate 3 distinct marketing angles
$angles = $client->ugc()->generateAngles($brief->id, 3, ['problem_solution', 'testimonial']);

// 3. Write a 30s script for the best angle
$script = $client->ugc()->writeScript($angles[0]->id, 30, 'authentic');

// 4. Render the video with a virtual actor
$job = $client->ugc()->renderVideo(
    projectId: $brief->projectId,
    scriptId: $script->id,
    actorId: 'actor_f_casual_01'
);

// 5. Poll for render completion (SSE or standard polling)
$video = $client->ugc()->pollRender($job->id);

echo "Final Ad URL: " . $video->url . "\n";
echo "Cost: $" . $video->usdCharged . " USD\n";
```

```python [Python]
# Python Equivalent
brief = client.ugc.create_brief("https://shopify.com/products/hydrating-serum")
angles = client.ugc.generate_angles(brief.id, 3, ["problem_solution", "testimonial"])
script = client.ugc.write_script(angles[0].id, 30, "authentic")
job = client.ugc.render_video(
    project_id=brief.project_id,
    script_id=script.id,
    actor_id="actor_f_casual_01"
)
video = client.ugc.poll_render(job.id)

print(f"Final Ad URL: {video.url}")
print(f"Cost: ${video.usd_charged} USD")
```
:::

::: danger Important Rendering Constraints
UGC Video rendering requires GPU3 (LipSync / Motion) nodes. Jobs can take up to 2-3 minutes for a 30s ad. Do not block web requests. Always use background workers or webhooks.
:::

#### Parameter Table: `renderVideo`

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `projectId` | `string` | Yes | - | Core UGC Project ID |
| `scriptId` | `string` | Yes | - | Approved Script ID |
| `actorId` | `string` | Yes | - | Virtual human actor identifier |
| `resolution` | `string` | No | `1080p` | `720p`, `1080p`, or `4k` |
| `webhookUrl` | `string` | No | `null` | Webhook to hit when rendering finishes |

---

## Domain 13: Social Studio & Publishing

Connect and publish automatically to Instagram, TikTok, LinkedIn, and YouTube.

### Multi-Platform Publishing

::: code-group
```php [PHP]
<?php
// Schedule a post for next week
$client->social()->schedulePost(
    accountIds: ['ig_123', 'tk_456'],
    mediaUrl: 'https://cdn.brand.com/ad.mp4',
    caption: "The ultimate hydration secret! 💧✨ #skincare",
    scheduledAt: '2026-09-15T14:00:00Z'
);

// Publish immediately
$client->social()->publishNow(
    accountIds: ['li_789'],
    mediaUrl: 'https://cdn.brand.com/news.jpg',
    caption: "Excited to announce our new product line."
);

// Generate optimal captions for platforms
$caption = $client->social()->generateCaption(
    mediaUrl: 'https://cdn.brand.com/news.jpg',
    platform: 'instagram',
    tone: 'professional'
);
```

```go [Go]
package main

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "log"
    "net/http"
    "os"
)

// See https://docs.fotohub.app/sdk/go for the FotoHubClient pattern.
// /social/* is not under the /v1 prefix FotoHubClient.BaseURL uses, so this
// builds the request directly: create the post, then publish it immediately.
func main() {
    apiKey := os.Getenv("FOTOHUB_API_KEY")

    payload, _ := json.Marshal(map[string]any{
        "account_ids": []string{"li_789"},
        "media_urls":  []string{"https://cdn.brand.com/news.jpg"},
        "text":        "Excited to announce our new product line.",
    })

    req, err := http.NewRequestWithContext(context.Background(), http.MethodPost, "https://apis.fotohub.app/social/v1/posts", bytes.NewReader(payload))
    if err != nil {
        log.Fatal(err)
    }
    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        log.Fatalf("request failed: %v", err)
    }
    defer resp.Body.Close()

    raw, _ := io.ReadAll(resp.Body)
    var post struct {
        ID string `json:"id"`
    }
    if err := json.Unmarshal(raw, &post); err != nil {
        log.Fatalf("decode failed: %v", err)
    }

    pubReq, err := http.NewRequestWithContext(context.Background(), http.MethodPost, fmt.Sprintf("https://apis.fotohub.app/social/v1/posts/%s/publish", post.ID), nil)
    if err != nil {
        log.Fatal(err)
    }
    pubReq.Header.Set("Authorization", "Bearer "+apiKey)

    if _, err := http.DefaultClient.Do(pubReq); err != nil {
        log.Fatalf("publish failed: %v", err)
    }
    fmt.Printf("Published post %s\n", post.ID)
}
```
:::

#### Laravel Queue Job for Scheduled Publishing

```php [PHP]
<?php
namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use FotoHub\Laravel\Facades\FotoHub;

class PublishSocialPost implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public string $mediaUrl, public string $caption) {}

    public function handle()
    {
        $response = FotoHub::social()->publishNow(
            accountIds: config('social.accounts'),
            mediaUrl: $this->mediaUrl,
            caption: $this->caption
        );
        
        \Log::info("Published social post. Cost: $" . $response->usdCharged . " USD");
    }
}
```

---

## Domain 14: Virtual Try-On

Leverage GPU-accelerated diffusion models to map garments onto humans realistically.

::: info GPU Affinity
Virtual Try-On operations are heavily optimized for **GPU2 (MMAudio/Vision)** nodes ensuring perfect fabric drape physics and texture retention.
:::

### Submit & Poll Virtual Try-On

The real endpoint is `POST /v1/ai/tryon` (status: `GET /v1/ai/tryon/{job_id}`). The PHP SDK does not
ship a typed `tryon()` method yet, so call it over raw HTTP as shown; the Python SDK does expose
`tryon()` / `get_tryon_status()` / `wait_for_tryon()` natively. There is no batch try-on endpoint.

::: code-group
```php [PHP]
<?php
$httpClient = new \GuzzleHttp\Client();

$job = json_decode($httpClient->post('https://apis.fotohub.app/v1/ai/tryon', [
    'headers' => ['Authorization' => 'Bearer ' . FOTOHUB_API_KEY],
    'json' => [
        'person_image_url' => 'https://cdn.brand.com/models/jessie.jpg',
        'garment_image_url' => 'https://cdn.brand.com/catalog/shirt_102.png',
        'category' => 'tops',
    ],
])->getBody(), true);

// Poll until the render completes
while (true) {
    $status = json_decode($httpClient->get("https://apis.fotohub.app/v1/ai/tryon/{$job['job_id']}", [
        'headers' => ['Authorization' => 'Bearer ' . FOTOHUB_API_KEY],
    ])->getBody(), true);
    if ($status['status'] === 'completed') {
        echo "Try-On Images: " . json_encode($status['images']) . "\n";
        break;
    }
    sleep(2);
}
```
```python [Python]
job = client.tryon(
    person_image_url="https://cdn.brand.com/models/jessie.jpg",
    garment_image_url="https://cdn.brand.com/catalog/shirt_102.png",
    category="tops",
)

result = client.wait_for_tryon(job["job_id"])
print(f"Try-On Images: {result.get('images')}")
```
:::

### WooCommerce Plugin Integration (Try-On)

Auto-generate model shots when a new garment is added.

```php [PHP]
add_action('woocommerce_process_product_meta', 'fotohub_auto_tryon', 20, 1);

function fotohub_auto_tryon(int $product_id): void {
    // Basic boilerplate...
    $image_url = wp_get_attachment_url(wc_get_product($product_id)->get_image_id());
    
    // Send to FOTOhub
    $response = wp_remote_post('https://apis.fotohub.app/v1/ai/tryon', [
        'headers' => [
            'Authorization' => 'Bearer ' . FOTOHUB_API_KEY,
            'Content-Type' => 'application/json',
        ],
        'body' => json_encode([
            'person_image_url' => 'https://brand.com/default-model.jpg',
            'garment_image_url' => $image_url,
            'category' => 'tops'
        ])
    ]);
}
```

---

## Domain 15: IDA Q (AI Assistant)

Interact with the built-in AI assistant to optimize queries, estimate wallet costs, or analyze image metrics.

::: code-group
```php [PHP]
<?php
// Estimate API costs
$response = $client->idaQ()->ask('How much would 50 videos and 10 try-ons cost?');
echo $response->answer . "\n";

// Analyze image quality
$analysis = $client->idaQ()->analyzeImage(
    imageUrl: 'https://cdn.brand.com/raw_photo.jpg',
    prompt: 'Rate quality and suggest improvements'
);

// Conversational interface
$chat = $client->idaQ()->chat(
    conversationHistory: [
        ['role' => 'user', 'content' => 'I need an ad script.'],
        ['role' => 'assistant', 'content' => 'Sure, what is the product?']
    ],
    newMessage: 'A new energy drink.'
);
```

```typescript [TypeScript]
const response = await client.idaQ.ask('How much would 50 videos cost?');
console.log(response.answer);

const analysis = await client.idaQ.analyzeImage(
    'https://cdn.brand.com/raw_photo.jpg', 
    'Rate quality and suggest improvements'
);
```
:::

---

## Advanced Integration Guides

### Filament v3 Admin Panel Integration

Integrate FOTOhub into your Laravel Filament dashboards.

**Image Generation Form Action:**
```php [PHP]
use Filament\Forms\Components\Actions\Action;
use FotoHub\Laravel\Facades\FotoHub;

Action::make('generate_image')
    ->label('AI Generate')
    ->action(function (array $data) {
        $res = FotoHub::images()->generate([
            'prompt' => $data['prompt'],
            'model' => 'seedream-5-0-260128'
        ]);
        // Update model with the generated image URL
    });
```

**Custom Wallet Widget:**
```php [PHP]
namespace App\Filament\Widgets;

use Filament\Widgets\Widget;
use FotoHub\Laravel\Facades\FotoHub;

class FotoHubWalletWidget extends Widget
{
    protected static string $view = 'filament.widgets.fotohub-wallet';

    protected function getViewData(): array
    {
        $wallet = FotoHub::billing()->getWallet();
        return [
            'availableUsd' => $wallet->availableUsd,
            'status' => $wallet->status
        ];
    }
}
```

### Livewire v3 Real-Time Generation

**Livewire Component with SSE (Server-Sent Events) Polling:**
```php [PHP]
namespace App\Livewire;

use Livewire\Component;
use FotoHub\Laravel\Facades\FotoHub;

class VideoGenerator extends Component
{
    public $prompt = '';
    public $jobId = null;
    public $videoUrl = null;
    public $status = 'idle';

    public function generate()
    {
        $job = FotoHub::videos()->create([
            'prompt' => $this->prompt,
            'model' => 'wan-2-2-t2v-pro'
        ]);
        $this->jobId = $job->id;
        $this->status = 'rendering';
    }

    public function pollStatus()
    {
        if (!$this->jobId) return;
        $job = FotoHub::videos()->poll($this->jobId);
        
        if ($job->status === 'completed') {
            $this->videoUrl = $job->resultUrl;
            $this->status = 'completed';
        }
    }
}
```

### Advanced Error Handling & Circuit Breakers

::: warning High-Availability
When hitting FOTOhub APIs from high-traffic Laravel applications, always use a Circuit Breaker pattern to prevent cascading failures if you hit rate limits continuously.
:::

**Exception Hierarchy:**
```mermaid
flowchart TD
    A[FotoHubException] --> B[AuthenticationException 401]
    A --> C[InsufficientFundsException 402]
    A --> D[RateLimitException 429]
    A --> E[ServerException 500/503]
    A --> F[ValidationException 422]
```

### PHP Unit Tests with Guzzle MockHandler

```php [PHP]
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use FotoHub\Client;
use FotoHub\Config;

$mock = new MockHandler([
    new Response(200, [], json_encode(['usdCharged' => 0.025, 'images' => [['url' => 'http://test.com/img.jpg']]])),
    new Response(402, [], json_encode(['error' => 'Insufficient funds', 'availableUsd' => 0.00]))
]);

$handlerStack = HandlerStack::create($mock);
$client = new Client(new Config(handlerStack: $handlerStack, apiKey: 'fh_live_test'));

// Test Success
$result = $client->images()->generate(['prompt' => 'test']);
$this->assertEquals(0.025, $result->usdCharged);

// Test 402 Exception
$this->expectException(FotoHub\Exceptions\InsufficientFundsException::class);
$client->images()->generate(['prompt' => 'test 2']);
```

### Webhook Handling with HMAC-SHA256 (Multi-Language)

Verify Webhooks securely to ensure they originated from FOTOhub.

::: code-group
```php [PHP]
<?php
$signature = $_SERVER['HTTP_X_FOTOHUB_SIGNATURE'];
$payload = file_get_contents('php://input');
$secret = 'whsec_prod_live_...';

$expectedSignature = hash_hmac('sha256', $payload, $secret);

if (!hash_equals($expectedSignature, $signature)) {
    http_response_code(401);
    die('Invalid Signature');
}
// Process...
```

```python [Python]
import hmac
import hashlib
from flask import request, abort

@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-FotoHub-Signature')
    secret = b'whsec_prod_live_...'
    
    expected_signature = hmac.new(secret, request.data, hashlib.sha256).hexdigest()
    
    if not hmac.compare_digest(expected_signature, signature):
        abort(401)
    
    return 'OK', 200
```

```typescript [TypeScript]
import * as crypto from 'crypto';
import { Request, Response } from 'express';

app.post('/webhook', (req: Request, res: Response) => {
    const signature = req.headers['x-fotohub-signature'] as string;
    const secret = 'whsec_prod_live_...';
    
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(req.rawBody) // Ensure you have raw body parsing enabled
        .digest('hex');
        
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        // Handle webhook
        res.status(200).send('OK');
    } else {
        res.status(401).send('Invalid signature');
    }
});
```
:::

---

## Production Economics & Estimations

For accurate projections, reference this unified billing table:

| Service | Node | Base USD Cost | Typical Execution | Note |
|---|---|---|---|---|
| Text-to-Image (Seedream) | GPU1 | $0.008 / img | 2-4 seconds | Bulk volume discount applies |
| Text-to-Video (Wan-2) | GPU3 | $0.045 / sec | 1-3 mins | Billed per render second |
| 3D Mesh Generation (Pro) | GPU5 | $0.250 / mesh | 2-5 mins | Export to USDZ/GLB |
| Shorts Clipping Engine | GPU3/CPU | $0.012 / min | 1-2x realtime | Based on input duration |
| Whisper V3 Transcribe | CPU | $0.001 / min | 10x realtime | Pure USD billing |

::: tip Architecture Recommendation
Use `$client->sandbox()` for any heavy post-processing data validation, as it costs `$0.000005/ms` and offloads the CPU overhead from your main application servers.
:::

