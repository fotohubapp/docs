# PHP SDK

Official PHP SDK for the FOTOhub API. PSR-4 autoloaded, PHP 8.1+, Guzzle HTTP client, typed models, automatic retries, and streaming support for chat completions.

## Installation

```bash
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
echo "Cost: " . $result->creditsUsed . " credits\n";
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
echo $result->creditsUsed;      // Credits charged
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
    public readonly int $creditsUsed;
}
```

## Video Generation

```php
$job = $client->generateVideo(
    prompt: 'A drone flying over mountains, cinematic',
    model: 'kling-v2',
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
    model: 'kling-v2',
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
    public readonly int $creditsUsed;
    
    public function isCompleted(): bool;
    public function isFailed(): bool;
    public function isPending(): bool;
}
```

## Music & Audio Generation

```php
$result = $client->generateMusic(
    prompt: 'Upbeat electronic music, 120 BPM',
    model: 'stable-audio',
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

```php
$response = $client->chat(
    messages: [
        ['role' => 'user', 'content' => 'Explain quantum computing in simple terms']
    ],
    model: 'gemini-flash',
    temperature: 0.7,
    maxTokens: 1024
);

echo $response->content;           // Assistant's reply
echo $response->tokensUsed;        // Total tokens
echo $response->creditsUsed;       // Credits charged
```

### Streaming

```php
$stream = $client->chatStream(
    messages: [
        ['role' => 'user', 'content' => 'Write a story about space']
    ],
    model: 'gemini-flash'
);

foreach ($stream as $chunk) {
    echo $chunk;  // Print token by token
}
```

### With System Prompt

```php
$response = $client->chat(
    messages: [
        ['role' => 'system', 'content' => 'You are a creative copywriter.'],
        ['role' => 'user', 'content' => 'Write ad copy for a fitness app']
    ],
    model: 'gemini-flash',
    temperature: 1.2
);
```

### ChatMessage

```php
class ChatMessage {
    public readonly string $content;
    public readonly string $role;
    public readonly int $tokensUsed;
    public readonly ?int $creditsUsed;
}
```

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
$chatModels = $client->listModels(category: 'chat');
```

## Billing & Balance

```php
$balance = $client->getBalance();

echo "Plan: " . $balance->plan . "\n";
echo "Credits: " . $balance->creditsRemaining . " / " . $balance->creditsLimit . "\n";
echo "Wallet: " . $balance->walletBalance . " PLN\n";

if ($balance->hasCredits()) {
    // Proceed with generation
}
```

### BillingBalance

```php
class BillingBalance {
    public readonly string $plan;
    public readonly int $creditsRemaining;
    public readonly int $creditsLimit;
    public readonly float $walletBalance;
    
    public function hasCredits(): bool;
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
use FotoHub\Exceptions\InsufficientCreditsException;
use FotoHub\Exceptions\ValidationException;
use FotoHub\Exceptions\ServerException;
```

### Comprehensive Handling

```php
use FotoHub\Client;
use FotoHub\Exceptions\{
    AuthenticationException,
    InsufficientCreditsException,
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
} catch (InsufficientCreditsException $e) {
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
| `InsufficientCreditsException` | 402 | Not enough credits/balance |
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
            'credits_used' => $result->creditsUsed,
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

```php
// config/services.yaml
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
| `generateImage(...)` | Generate images from text | `ImageResult` |
| `generateVideo(...)` | Start video generation | `VideoJob` |
| `getVideoStatus($id)` | Check video job status | `VideoJob` |
| `generateMusic(...)` | Generate music/audio | `array` |
| `generateSpeech(...)` | Text-to-speech | `array` |
| `chat(...)` | Chat completion | `ChatMessage` |
| `chatStream(...)` | Streaming chat | `Generator<string>` |
| `removeBackground(...)` | Remove image background | `array` |
| `upscaleImage(...)` | Upscale image resolution | `array` |
| `listModels(...)` | List available models | `array` |
| `getBalance()` | Get billing balance | `BillingBalance` |
| `createWebhook(...)` | Create webhook endpoint | `array` |
| `listWebhooks()` | List active webhooks | `array` |
| `batchGenerate(...)` | Batch image generation | `array` |

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
