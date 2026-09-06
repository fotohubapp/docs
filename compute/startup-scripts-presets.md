# Startup Scripts, Presets & Cloud-Init Automation

Automate node initialization, dependency installation, and service startup with pre-tested installation presets and custom cloud-init bash scripts.

When launching instances via `POST /compute/v1/instances`, you can inject one or more **Installation Presets** (`install_presets`) alongside your custom bash scripts (`startup_script`).

---

## Built-In Installation Presets

FOTOhub provides 8 optimized, pre-tested installation scripts that execute automatically during initial instance boot:

| Preset Identifier | Installed Stack | Post-Boot State | Typical Boot Addition |
|:---|:---|:---|:---:|
| **`docker`** | Docker CE, containerd, docker-compose-plugin | Docker daemon running; `ubuntu` added to docker group | ~18s |
| **`python-ml`** | PyTorch 2.4, TorchVision, NumPy, Pandas, Scikit-Learn, FastAPI, Uvicorn | Virtualenv configured; CUDA drivers active | ~45s |
| **`nodejs`** | Node.js 20 LTS, npm, yarn, pnpm, PM2 process manager | Node and PM2 available globally | ~12s |
| **`nginx-certbot`**| Nginx web server, Certbot, python3-certbot-nginx | Nginx running on ports 80/443; UFW firewall configured | ~15s |
| **`fotohub-worker`**| Celery, Redis client, FOTOhub Python SDK, Docker | Worker template deployed to `/opt/fotohub-worker` | ~25s |
| **`postgres`** | PostgreSQL 16 server + contrib | Database `ubuntu` created with superuser privileges | ~20s |
| **`redis`** | Redis server 7.x | Configured to bind `0.0.0.0`; systemd service active | ~10s |
| **`monitoring`** | Prometheus Node Exporter 1.7.0 | Metrics exposed on port `9100`; systemd service enabled | ~8s |

---

## Launching an Instance with Multiple Presets

You can combine presets in a single API call. Presets execute sequentially in the order specified before your custom `startup_script` runs:

::: code-group

```python [Python]
from fotohub import FotoHub
import os

client = FotoHub(api_key=os.environ["FOTOHUB_API_KEY"])

instance = client.post("/compute/v1/instances", {
    "name": "ai-api-gateway",
    "catalog_id": "c5.xlarge",
    "spot_instance": True,
    "root_volume_size_gb": 80,
    "install_presets": ["docker", "nginx-certbot", "monitoring"],
    "startup_script": """#!/bin/bash
    # Pull and run your production API container
    docker run -d --name api -p 8000:8000 --restart always my-registry/api:v1
    
    # Configure Nginx reverse proxy
    cat > /etc/nginx/sites-available/default << 'EOF'
    server {
        listen 80;
        location / {
            proxy_pass http://127.0.0.1:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    EOF
    systemctl reload nginx
    """
})

print(f"Provisioning instance: {instance['instance']['id']}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function launchWorker() {
  const res = await client.post("/compute/v1/instances", {
    name: "ml-batch-worker",
    catalog_id: "g5.xlarge",
    spot_instance: true,
    install_presets: ["docker", "python-ml", "monitoring"],
    startup_script: "#!/bin/bash\necho 'ML environment fully initialized' > /var/log/boot_ready.log",
  });

  console.log("Instance launched:", res.data.instance.id);
}

launchWorker();
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/instances   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "name": "redis-queue-node",
    "catalog_id": "t3.medium",
    "install_presets": ["redis", "monitoring"],
    "root_volume_size_gb": 40
  }'
```

:::

---

## Dynamic Script Execution via `/run-script`

Execute administrative bash scripts on running instances without opening manual SSH sessions:

### Endpoint: `POST /compute/v1/instances/{id}/run-script`

```bash
curl -X POST https://apis.fotohub.app/compute/v1/instances/inst_90f23b/run-script   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "script": "nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader"
  }'
```

#### Response Example

```json
{
  "success": true,
  "exit_code": 0,
  "stdout": "4%, 1824 MiB, 24576 MiB
",
  "stderr": "",
  "duration_ms": 320
}
```

---

## Monitoring Cloud-Init Boot Progress

Inspect stdout and stderr from cloud-init scripts in real time:

```bash
curl -X GET "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/logs?lines=50"   -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

Logs stream directly from `/var/log/cloud-init-output.log` on the instance host.
