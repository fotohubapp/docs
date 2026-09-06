# PHP SDK

A PHP client for the FOTOhub API. PSR-4 autoloaded, PHP 8.1+, Guzzle HTTP client, typed models and automatic retries. Chat completions are not streamable — see [Streaming](#streaming).

::: info Preview — coming soon
A first-party PHP package is on the roadmap. The `FotoHub\Client` interface shown below illustrates the intended shape and wraps the public REST API (base URL `https://apis.fotohub.app`). Until it publishes to Packagist you can either call the [REST API](/api/getting-started) directly with Guzzle/cURL or vendor a thin wrapper that mirrors these method signatures. All endpoints and model IDs used here are real and live today.
:::

## Installation

```bash
# Coming soon — package name reserved
composer require fotohub/fotohub-php
```

**Requirements:** PHP 8.1+, `ext-json`, `ext-curl`

## Quick Start

```php
use FotoHub\Client;

$client = new Client('fh_live_your_key_here');

// Generate an image
$result = $client->generateImage(
    prompt: 'A futuristic city at sunset',
    model: 'seedream-5-0-260128'
);

echo "Image: " . $result->urls[0] . "\n";
echo "Cost: " . $result->usdCharged . " credits\n";
```

## Client Initialization

### With API Key

```php
use FotoHub\Client;

$client = new Client(
    apiKey: 'fh_live_your_key_here',
    baseUrl: 'https://apis.fotohub.app',  // default
    timeout: 60,                           // 60s default
    maxRetries: 3,                         // automatic retries for 429/5xx
);
```

### With Environment Variable

```php
use FotoHub\Client;

// Reads FOTOHUB_API_KEY from $_ENV / getenv()
$client = new Client();
```

Set in your `.env` file:

```bash
FOTOHUB_API_KEY=fh_live_your_key_here
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | `getenv('FOTOHUB_API_KEY')` | Your API key |
| `baseUrl` | `string` | `https://apis.fotohub.app` | API base URL |
| `timeout` | `int` | `60` | Request timeout in seconds |
| `maxRetries` | `int` | `3` | Max retries for transient errors |

::: warning Security
Never hardcode API keys in source code. Use environment variables or a secrets manager in production. Add `.env` to your `.gitignore`.
:::

## Image Generation

### Basic Generation

```php
$result = $client->generateImage(
    prompt: 'A futuristic city at sunset',
    model: 'seedream-5-0-260128'
);

echo $result->urls[0];          // Image URL
echo $result->model;            // Model used
echo $result->usdCharged;      // Credits charged
```

### With Options

```php
$result = $client->generateImage(
    prompt: 'Professional product photography, white background',
    model: 'imagen-4-standard',
    width: 1024,
    height: 1024,
    numImages: 4,
    negativePrompt: 'blurry, low quality',
    seed: 42
);

foreach ($result->urls as $url) {
    echo $url . "\n";
}
```

### ImageResult

```php
class ImageResult {
    public readonly array $urls;
    public readonly string $model;
    public readonly ?int $seed;
    public readonly int $usdCharged;
}
```

## Video Generation

```php
$job = $client->generateVideo(
    prompt: 'A drone flying over mountains, cinematic',
    model: 'kling-v3',
    duration: 5,
    aspectRatio: '16:9'
);

echo "Job ID: " . $job->id . "\n";
echo "Status: " . $job->status . "\n";

// Poll for completion
while (!$job->isCompleted() && !$job->isFailed()) {
    sleep(5);
    $job = $client->getVideoStatus($job->id);
}

if ($job->isCompleted()) {
    echo "Video: " . $job->videoUrl . "\n";
}
```

### Image-to-Video

```php
$job = $client->generateVideo(
    prompt: 'Gentle camera zoom with motion',
    model: 'kling-v3',
    imageUrl: 'https://example.com/product.jpg',
    duration: 5
);
```

### VideoJob

```php
class VideoJob {
    public readonly string $id;
    public readonly string $status;     // 'pending' | 'processing' | 'completed' | 'failed'
    public readonly ?string $videoUrl;
    public readonly ?int $progress;     // 0-100
    public readonly int $usdCharged;
    
    public function isCompleted(): bool;
    public function isFailed(): bool;
    public function isPending(): bool;
}
```

## Music & Audio Generation

```php
$result = $client->generateMusic(
    prompt: 'Upbeat electronic music, 120 BPM',
    model: 'music-minimax',
    duration: 30
);

echo "Audio: " . $result->audioUrl . "\n";
echo "Duration: " . $result->duration . "s\n";
```

### Text-to-Speech

```php
$result = $client->generateSpeech(
    text: 'Welcome to FOTOhub, the AI creative platform.',
    language: 'en'
);

echo "Audio: " . $result->audioUrl . "\n";
```

## Chat Completions

### Standard Chat

`chat()` takes the messages array first and everything else in an options array,
and returns the decoded OpenAI-compatible response as a **plain array** — index
it, do not use property access.

```php
$response = $client->chat(
    [
        ['role' => 'user', 'content' => 'Explain quantum computing in simple terms']
    ],
    ['model' => 'gemini-flash']
);

echo $response['choices'][0]['message']['content'];  // Assistant's reply
echo $response['credits_used'];                      // Credits charged
```

::: warning Four model IDs, and sampling options are ignored
`/v1/ai/chat/completions` accepts exactly `gemini-flash`, `gemini-pro`, `gpt-4o`
and `claude-sonnet`. Anything else returns `400` with the supported list.

`temperature` and `max_tokens` are accepted by both the SDK and the endpoint and
then discarded — passing them is harmless but changes nothing. `credits_used` is
the authoritative billing field; `usage` is passed through from the upstream
provider and falls back to `{}`, so read it defensively.
:::

### Streaming

::: danger `streamChat()` throws `ValidationException`
There is no `chatStream()` method — the SDK's streaming method is
`streamChat()`, and it posted to `/v1/ai/chat/completions`, which **does not
stream**. That endpoint accepts `stream: true` for OpenAI compatibility and
returns one complete JSON body, so `StreamResponse` found no `data:` frames:
iteration completed after **zero chunks and threw no error** while the request
was still billed, and `collect()` returned `''`. The SDK now refuses before
sending, so the call stays free.
:::

The one streaming endpoint is `POST /v1/ai/agent/stream`, which has no SDK
wrapper. Call it directly with cURL. Frames carry a `type`
(`text_delta`, `tool_use`, `done`, `error`) and the stream ends at
`data: [DONE]`:

```php
$ch = curl_init('https://apis.fotohub.app/v1/ai/agent/stream');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . getenv('FOTOHUB_API_KEY'),
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'model' => 'claude-sonnet-4.6',   // agent model IDs, not the chat IDs
        'messages' => [
            ['role' => 'user', 'content' => 'Write a story about space'],
        ],
    ]),
    // A single write callback can receive a partial frame, so buffer to the
    // blank-line record separator before parsing.
    CURLOPT_WRITEFUNCTION => function ($ch, $data) use (&$buffer) {
        $buffer .= $data;
        while (($pos = strpos($buffer, "\n\n")) !== false) {
            $raw = substr($buffer, 0, $pos);
            $buffer = substr($buffer, $pos + 2);

            if (!str_starts_with($raw, 'data: ')) {
                continue;
            }
            $payload = trim(substr($raw, 6));
            if ($payload === '[DONE]') {
                return 0;  // aborts the transfer
            }
            $frame = json_decode($payload, true);
            if (($frame['type'] ?? '') === 'text_delta') {
                echo $frame['text'];
                flush();
            } elseif (($frame['type'] ?? '') === 'error') {
                fwrite(STDERR, "\nstream error: " . $frame['message'] . "\n");
                return 0;
            }
        }
        return strlen($data);
    },
]);
$buffer = '';
curl_exec($ch);
curl_close($ch);
```

::: warning `done` is optional, `[DONE]` is not
The `done` frame (which carries `usage` and `billing`) is omitted when the turn
produced no tokens, and replaced by an `error` frame when generation succeeded
but billing settlement failed. Stop on `[DONE]`.
:::

### With System Prompt

```php
$response = $client->chat(
    [
        ['role' => 'system', 'content' => 'You are a creative copywriter.'],
        ['role' => 'user', 'content' => 'Write ad copy for a fitness app']
    ],
    ['model' => 'gemini-flash']
);
```

::: warning The messages array is split, not forwarded whole
The endpoint treats the **last** message as the prompt and everything before it
as history, so end your array with the user turn you want answered. A trailing
assistant message (an OpenAI-style prefill) is dropped, and the user turn before
it is then sent as both the prompt and the history — asked twice.
:::

## Image Processing

### Remove Background

```php
$result = $client->removeBackground(
    imageUrl: 'https://example.com/product.jpg'
);

echo $result->url;  // Transparent PNG URL
```

### Upscale Image

```php
$result = $client->upscaleImage(
    imageUrl: 'https://example.com/low-res.jpg',
    scale: 4  // 2x or 4x
);

echo $result->url;     // Hi-res image URL
echo $result->width;   // New width
echo $result->height;  // New height
```

## Models Catalog

```php
$models = $client->listModels();

foreach ($models as $model) {
    echo "{$model['id']} — {$model['name']} ({$model['provider']})\n";
}

// Filter by category
$imageModels = $client->listModels(category: 'image');
$chatModels = $client->listModels(category: 'text');
```

## Billing & Balance

```php
$balance = $client->getBalance();

echo "Plan: " . $balance->plan . "\n";
echo "Credits: " . $balance->availableUsd . " / " . $balance->creditsLimit . "\n";
echo "Wallet: $" . $balance->walletBalance . "\n";

if ($balance->hasFunds()) {
    // Proceed with generation
}
```

### BillingBalance

```php
class BillingBalance {
    public readonly string $plan;
    public readonly int $availableUsd;
    public readonly int $creditsLimit;
    public readonly float $walletBalance;
    
    public function hasFunds(): bool;
}
```

## Webhooks

### Create Webhook

```php
$webhook = $client->createWebhook(
    url: 'https://myapp.com/webhooks/fotohub',
    events: ['video.completed', 'video.failed', 'batch.completed']
);

echo "Webhook ID: " . $webhook['id'] . "\n";
echo "Secret: " . $webhook['secret'] . "\n";
```

### List Webhooks

```php
$webhooks = $client->listWebhooks();

foreach ($webhooks as $wh) {
    echo "{$wh['id']} — {$wh['url']} ({$wh['status']})\n";
}
```

## Batch Processing

```php
$result = $client->batchGenerate([
    ['prompt' => 'Product photo: leather wallet', 'model' => 'seedream-5-0-260128'],
    ['prompt' => 'Product photo: silver watch', 'model' => 'seedream-5-0-260128'],
    ['prompt' => 'Product photo: silk scarf', 'model' => 'seedream-5-0-260128'],
]);

foreach ($result['items'] as $item) {
    echo "{$item['status']}: {$item['url']}\n";
}
```

## Error Handling

### Exception Classes

```php
use FotoHub\Exceptions\FotoHubException;
use FotoHub\Exceptions\AuthenticationException;
use FotoHub\Exceptions\RateLimitException;
use FotoHub\Exceptions\InsufficientFundsException;
use FotoHub\Exceptions\ValidationException;
use FotoHub\Exceptions\ServerException;
```

### Comprehensive Handling

```php
use FotoHub\Client;
use FotoHub\Exceptions\{
    AuthenticationException,
    InsufficientFundsException,
    RateLimitException,
    ValidationException,
    FotoHubException
};

$client = new Client('fh_live_your_key_here');

try {
    $result = $client->generateImage(
        prompt: 'A landscape',
        model: 'seedream-5-0-260128'
    );
} catch (InsufficientFundsException $e) {
    echo "Need more credits. Required: {$e->creditsRequired}, Available: {$e->creditsAvailable}\n";
} catch (RateLimitException $e) {
    echo "Rate limited. Retry after: {$e->retryAfter}s\n";
} catch (AuthenticationException $e) {
    echo "Invalid API key.\n";
} catch (ValidationException $e) {
    echo "Invalid request: {$e->getMessage()}\n";
    foreach ($e->errors as $field => $message) {
        echo "  - {$field}: {$message}\n";
    }
} catch (FotoHubException $e) {
    echo "[{$e->statusCode}] {$e->errorType}: {$e->getMessage()}\n";
}
```

### Error Codes

| Exception | HTTP Status | When |
|-----------|-------------|------|
| `AuthenticationException` | 401 | Invalid API key |
| `InsufficientFundsException` | 402 | Not enough credits/balance |
| `ValidationException` | 422 | Invalid parameters |
| `RateLimitException` | 429 | Too many requests |
| `ServerException` | 5xx | Server error (auto-retried) |

## Laravel Integration

### Service Provider Setup

```php
// config/services.php
'fotohub' => [
    'api_key' => env('FOTOHUB_API_KEY'),
],
```

```php
// app/Providers/AppServiceProvider.php
use FotoHub\Client;

public function register(): void
{
    $this->app->singleton(Client::class, function () {
        return new Client(config('services.fotohub.api_key'));
    });
}
```

### In Controllers

```php
use FotoHub\Client;

class ProductController extends Controller
{
    public function generatePhoto(Request $request, Client $fotohub)
    {
        $result = $fotohub->generateImage(
            prompt: "Product photo: " . $request->product_name,
            model: 'seedream-5-0-260128',
            width: 1024,
            height: 1024
        );

        return response()->json([
            'image_url' => $result->urls[0],
            'credits_used' => $result->usdCharged,
        ]);
    }
}
```

### Artisan Command Example

```php
// app/Console/Commands/BulkGenerate.php
use FotoHub\Client;

class BulkGenerate extends Command
{
    protected $signature = 'fotohub:bulk-generate {--category=}';
    
    public function handle(Client $fotohub): void
    {
        $products = Product::where('category', $this->option('category'))
            ->whereNull('ai_image_url')
            ->get();

        $bar = $this->output->createProgressBar($products->count());

        foreach ($products as $product) {
            $result = $fotohub->generateImage(
                prompt: "Professional product photo: {$product->name}, white background",
                model: 'seedream-5-0-260128'
            );
            
            $product->update(['ai_image_url' => $result->urls[0]]);
            $bar->advance();
        }

        $bar->finish();
        $this->info("\nDone! Generated {$products->count()} images.");
    }
}
```

## Symfony Integration

```yaml
# config/services.yaml
services:
    FotoHub\Client:
        arguments:
            $apiKey: '%env(FOTOHUB_API_KEY)%'
```

```php
// src/Controller/ImageController.php
use FotoHub\Client;

class ImageController extends AbstractController
{
    #[Route('/generate', methods: ['POST'])]
    public function generate(Request $request, Client $fotohub): JsonResponse
    {
        $result = $fotohub->generateImage(
            prompt: $request->get('prompt'),
            model: 'seedream-5-0-260128'
        );

        return $this->json(['url' => $result->urls[0]]);
    }
}
```

## API Reference

### Client Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `generateImage(string $prompt, array $options = [])` | Generate images from text | `ImageResult` |
| `editImage(string $imageUrl, string $prompt, array $options = [])` | Edit an image | `ImageResult` |
| `generateVideo(string $prompt, array $options = [])` | Start video generation | `VideoJob` |
| `getVideoJob(string $jobId)` | Check video job status | `VideoJob` |
| `waitForVideo(string $jobId, int $timeout = 300, int $interval = 5)` | Poll until the video completes | `VideoJob` |
| `generateMusic(string $prompt, array $options = [])` | Generate music/audio | `array` |
| `generateSfx(string $prompt, array $options = [])` | Generate sound effects | `array` |
| `generateSpeech(string $text, array $options = [])` | Text-to-speech | `array` |
| `transcribe(string $audioUrl, array $options = [])` | Transcribe audio | `TranscriptionResult` |
| `chat(array $messages, array $options = [])` | Chat completion (OpenAI-compatible) | `array` |
| `streamChat(array $messages, array $options = [])` | ⚠️ Broken — targets the non-streaming endpoint, so it yields zero chunks while still billing. Use cURL on `/v1/ai/agent/stream`. | `StreamResponse` |
| `chatBedrock(array $messages, array $options = [])` | Chat via Bedrock models | `array` |
| `analyzeImage(string $imageUrl, array $features = [])` | Analyze an image | `AnalysisResult` |
| `enhancePrompt(string $prompt, array $options = [])` | Improve a prompt with AI | `array` |
| `stabilityRemoveBackground(string $image, string $outputFormat = 'png')` | Remove image background | `StabilityResult` |
| `stabilityUpscale(string $image, string $outputFormat = 'png')` | Upscale image resolution | `StabilityResult` |
| `listStabilityTools()` | List Stability tools | `array` |
| `getPricing()` | Public price catalogue | `array` |
| `getBalance()` | Get billing balance | `BillingBalance` |
| `getWallet()` / `topupWallet(float $amount)` | Wallet balance / top-up checkout | `array` |
| `estimateCost(array $operations)` | Estimate a batch of operations | `CostEstimate` |
| `generate3D(array $options)` / `get3DStatus(string $jobId)` / `waitFor3D(...)` | 3D generation | `array` |
| `listWebhooks()` / `createWebhook(string $name, string $url, array $events, array $headers = [])` | Webhook management | `array` |

::: warning These methods do not exist
Earlier revisions of this page listed `chatStream()`, `getVideoStatus()`,
`removeBackground()`, `upscaleImage()`, `listModels()` and `batchGenerate()`.
None of them are defined on `FotoHub\Client` — the real names are in the table
above. Note also that every method takes positional arguments plus an
`$options` array, not PHP named arguments per parameter.
:::

## Automatic Retries

The SDK automatically retries on transient errors with exponential backoff:

- **429 Too Many Requests** — respects `Retry-After` header
- **500, 502, 503, 504** — exponential backoff with jitter

Retries do NOT apply to: 400, 401, 402, 404, 422.

```php
$client = new Client(
    apiKey: 'fh_live_your_key_here',
    maxRetries: 5,      // up to 5 retries
    timeout: 120,       // 2 minute timeout per attempt
);
```
