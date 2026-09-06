# Startup Scripts, Presets & Cloud-Init Automation

Automate node initialization, dependency installation, and service startup with pre-tested installation presets and custom cloud-init bash scripts. This extensive guide covers everything from built-in FOTOhub presets to advanced idempotent startup scripting techniques for complex infrastructure deployments.

When launching instances via `POST /compute/v1/instances`, you can inject one or more **Installation Presets** (`install_presets`) alongside your custom bash scripts (`startup_script`). These are executed in the `eu-central-1` region with complete root access to the provisioned virtual machine.

::: tip PRICING REFERENCE
As you automate infrastructure, keep in mind our highly competitive GPU spot pricing (all USD):
- **G5.xlarge**: $0.38/hr (spot) - Ideal for intensive SDXL and LLM inference.
- **G4dn.xlarge**: $0.20/hr (spot) - Excellent cost-to-performance ratio for general ML workloads.
:::

---

## Architecture & Boot Sequence

Before diving into presets and scripts, it is crucial to understand the lifecycle of a FOTOhub instance upon boot.

```mermaid
sequenceDiagram
    participant User as API Client
    participant API as FOTOhub API (eu-central-1)
    participant Hypervisor as EC2 Hypervisor
    participant VM as FOTOhub Instance (Ubuntu 22.04)
    
    User->>API: POST /compute/v1/instances
    API-->>User: Returns Instance ID (inst_xxx)
    API->>Hypervisor: Provision VM Resources
    Hypervisor->>VM: Power On & Mount EBS
    VM->>VM: OS Boot & Network Initialization
    VM->>VM: Cloud-Init Phase 1 (Local)
    VM->>VM: Cloud-Init Phase 2 (Network)
    VM->>VM: Fetch FOTOhub Install Presets
    VM->>VM: Execute Install Presets (Sequential)
    VM->>VM: Execute User `startup_script`
    VM->>API: Signal Ready State
```

::: warning SCRIPT EXECUTION CONTEXT
All `startup_script` and `install_presets` run as the `root` user (`uid=0`, `gid=0`). 
The scripts execute in a non-interactive shell environment. Environment variables like `$HOME` are set to `/root`, and `$PATH` includes standard system binary paths. If you need to execute commands as the `ubuntu` user, you must use `sudo -u ubuntu` or `su - ubuntu -c`.
:::

---

## Comprehensive Built-In Installation Presets Reference

FOTOhub provides heavily optimized, pre-tested installation scripts that execute automatically during initial instance boot. Specifying these presets offloads the burden of writing robust bash installation logic for common dependencies.

### 1. `docker`
The `docker` preset installs the latest stable version of Docker CE and Docker Compose V2.
- **Components Installed**: `docker-ce`, `docker-ce-cli`, `containerd.io`, `docker-buildx-plugin`, `docker-compose-plugin`.
- **Post-Boot State**: The Docker daemon is running and enabled via systemd. The default `ubuntu` user is added to the `docker` group, allowing passwordless execution of Docker commands.
- **Log Rotation**: Automatically configures Docker daemon with `json-file` log driver, capping logs at 50MB and 3 files max to prevent disk exhaustion.
- **Boot Time Impact**: ~18s

### 2. `python-ml`
The ultimate preset for Python-based machine learning workloads.
- **Components Installed**: Python 3.10+, pip, virtualenv. Pre-installs massive binaries to save bandwidth: PyTorch 2.4 (CUDA 12.x compatible), TorchVision, NumPy, Pandas, Scikit-Learn, FastAPI, Uvicorn, and Hugging Face `transformers`.
- **Post-Boot State**: A global virtual environment is instantiated in `/opt/ml-env`. The `.bashrc` for the `ubuntu` user is modified to activate this environment automatically upon SSH login.
- **Boot Time Impact**: ~45s (due to large package extraction)

### 3. `cuda`
The foundational layer for any GPU-accelerated computing.
- **Components Installed**: NVIDIA Proprietary Drivers (v535 or latest stable), CUDA Toolkit 12.2, cuDNN 8.x, and the NVIDIA Container Toolkit.
- **Post-Boot State**: The `nvidia-smi` command is immediately available. Docker is configured with the `nvidia` runtime as the default, allowing `docker run --gpus all` out of the box without manual daemon configuration.
- **Boot Time Impact**: ~90s (Requires DKMS module compilation)

### 4. `monitoring`
Essential for production observability and fleet management.
- **Components Installed**: Prometheus Node Exporter, NVIDIA DCGM Exporter (if GPUs are present).
- **Post-Boot State**: Systemd services are active. Node exporter listens on `0.0.0.0:9100`. DCGM exporter listens on `0.0.0.0:9400`. UFW firewall rules are automatically adjusted to allow access from FOTOhub internal monitoring subnets.
- **Boot Time Impact**: ~8s

### 5. `jupyter`
Instantly deploy an interactive data science environment.
- **Components Installed**: JupyterLab, Jupyter Notebook, IPython, and common data visualization libraries (Matplotlib, Seaborn).
- **Post-Boot State**: JupyterLab runs as a systemd service (`jupyter.service`) under the `ubuntu` user. It binds to port `8888` and is accessible via a secure token automatically generated and logged to `/var/log/jupyter_token.txt`.
- **Boot Time Impact**: ~30s

### 6. `comfyui`
The preferred backend for Stable Diffusion and generative image workflows.
- **Components Installed**: ComfyUI core, ComfyUI-Manager, xformers, and standard nodes.
- **Post-Boot State**: Cloned into `/home/ubuntu/ComfyUI`. A systemd service `comfyui.service` is created to ensure it starts on boot and restarts on failure, bound to port `8188`.
- **Boot Time Impact**: ~50s

### 7. `vllm`
High-throughput and memory-efficient LLM inference engine.
- **Components Installed**: `vllm`, `ray`, `xformers`.
- **Post-Boot State**: The vLLM OpenAI-compatible API server is pre-configured as a systemd service (`vllm.service`), ready to serve models.
- **Boot Time Impact**: ~40s

### 8. `ollama`
Local LLM execution made incredibly simple.
- **Components Installed**: Official Ollama binary and service definitions.
- **Post-Boot State**: Ollama daemon runs on port `11434`. Models like `llama3` or `mistral` can be pulled immediately in your `startup_script`.
- **Boot Time Impact**: ~12s

---

## Core API Usage: Launching with Presets and Auth

All compute API calls require authentication using your Bearer token. Ensure you use the correct regional Base URL.

- **Base URL**: `https://apis.fotohub.app/compute/v1`
- **Region**: All compute runs in `eu-central-1`
- **Auth Header**: `Authorization: Bearer fh_live_YOUR_API_KEY`

### Request Example (Multiple Presets)

::: code-group

```bash [cURL]
curl -X POST "https://apis.fotohub.app/compute/v1/instances" \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "g5-comfy-worker",
    "catalog_id": "g5.xlarge",
    "spot_instance": true,
    "root_volume_size_gb": 150,
    "install_presets": ["cuda", "docker", "comfyui", "monitoring"],
    "startup_script": "#!/bin/bash\necho \"Initialization complete\" > /var/log/custom_boot.log"
  }'
```

```python [Python]
import requests
import os

FOTOHUB_API_KEY = os.environ.get("FOTOHUB_API_KEY")

payload = {
    "name": "g4-jupyter-node",
    "catalog_id": "g4dn.xlarge",
    "spot_instance": True,
    "root_volume_size_gb": 100,
    "install_presets": ["cuda", "python-ml", "jupyter", "monitoring"],
    "startup_script": """#!/bin/bash
    echo "Starting custom initialization..."
    # Custom pip packages
    sudo -u ubuntu /opt/ml-env/bin/pip install wandb accelerate bitsandbytes
    """
}

headers = {
    "Authorization": f"Bearer {FOTOHUB_API_KEY}",
    "Content-Type": "application/json"
}

response = requests.post(
    "https://apis.fotohub.app/compute/v1/instances",
    json=payload,
    headers=headers
)

print(response.json())
```

```typescript [TypeScript]
import axios from 'axios';

async function launchInstance() {
  const apiKey = process.env.FOTOHUB_API_KEY;
  
  const response = await axios.post('https://apis.fotohub.app/compute/v1/instances', {
    name: 'vllm-inference-endpoint',
    catalog_id: 'g5.xlarge',
    spot_instance: true,
    root_volume_size_gb: 250,
    install_presets: ['cuda', 'docker', 'vllm', 'monitoring'],
    startup_script: '#!/bin/bash\ncurl -X POST http://localhost:8000/v1/models'
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  console.log(response.data);
}

launchInstance();
```

:::

---

## Detailed Cloud-Init Startup Script Scenarios

The `startup_script` property allows you to execute massive, multi-step shell scripts directly on the instance during its first boot. 

### Limitations and Guidelines

- **Size Limit**: The `startup_script` string cannot exceed **65536 characters** (64KB). If your script is larger, host it on an S3 bucket or GitHub and use your `startup_script` to simply `curl` and `bash` it.
- **Timeout**: The entire cloud-init sequence (including all `install_presets` and your `startup_script`) is subject to a **30-minute timeout**. If your script downloads massive multi-gigabyte models that take longer than 30 minutes, the boot process will be marked as failed in the API, though the script may continue running in the background.
- **Execution User**: Runs as `root`.
- **Logs**: Everything output to `stdout` and `stderr` is captured.

### Scenario 1: Unattended SDXL Model Download & Serving

This script ensures that the SDXL base model and refiner are securely downloaded, verified, and loaded into ComfyUI or a custom pipeline. It uses extensive error handling to retry downloads.

```bash
#!/bin/bash
set -eEuo pipefail
trap 'echo "Error occurred at line $LINENO" >&2' ERR

# Define variables
MODEL_DIR="/home/ubuntu/ComfyUI/models/checkpoints"
SDXL_BASE_URL="https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"
SDXL_REFINER_URL="https://huggingface.co/stabilityai/stable-diffusion-xl-refiner-1.0/resolve/main/sd_xl_refiner_1.0.safetensors"
MAX_RETRIES=5

# Function for robust downloading with aria2c
download_file() {
    local url=$1
    local dest_dir=$2
    local filename=$(basename "$url")
    
    echo "Starting download of $filename..."
    for ((i=1; i<=MAX_RETRIES; i++)); do
        if aria2c -x 16 -s 16 --continue=true -d "$dest_dir" "$url"; then
            echo "Successfully downloaded $filename"
            return 0
        else
            echo "Download failed. Attempt $i of $MAX_RETRIES. Retrying in 10s..."
            sleep 10
        fi
    done
    
    echo "Failed to download $filename after $MAX_RETRIES attempts."
    exit 1
}

# Install aria2 if not present
apt-get update && apt-get install -y aria2

# Create directory and set permissions
mkdir -p "$MODEL_DIR"
chown ubuntu:ubuntu "$MODEL_DIR"

# Execute downloads
download_file "$SDXL_BASE_URL" "$MODEL_DIR"
download_file "$SDXL_REFINER_URL" "$MODEL_DIR"

# Fix permissions after download
chown -R ubuntu:ubuntu "$MODEL_DIR"

# Restart ComfyUI service if present to detect new models
if systemctl is-active --quiet comfyui.service; then
    echo "Restarting ComfyUI to load new models..."
    systemctl restart comfyui.service
fi

echo "SDXL Setup Complete."
```

### Scenario 2: Custom Conda Environment Initialization

For advanced ML workloads where `python-ml` preset isn't specific enough, you might want to bootstrap Miniconda from scratch.

```bash
#!/bin/bash
set -euxo pipefail

# Variables
MINICONDA_URL="https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh"
CONDA_DIR="/opt/miniconda3"
ENV_NAME="pytorch_env"

echo "Starting Miniconda installation..."

# Download Miniconda installer securely
curl -L -O "$MINICONDA_URL"
bash Miniconda3-latest-Linux-x86_64.sh -b -p "$CONDA_DIR"
rm Miniconda3-latest-Linux-x86_64.sh

# Initialize conda for the ubuntu user
su - ubuntu -c "$CONDA_DIR/bin/conda init bash"

# Create a new environment with PyTorch and CUDA 12.1
su - ubuntu -c "$CONDA_DIR/bin/conda create -y -n $ENV_NAME python=3.10"
su - ubuntu -c "$CONDA_DIR/bin/conda install -y -n $ENV_NAME pytorch torchvision torchaudio pytorch-cuda=12.1 -c pytorch -c nvidia"

# Install additional pip packages within the conda env
su - ubuntu -c "$CONDA_DIR/envs/$ENV_NAME/bin/pip install transformers accelerate diffusers xformers wandb"

# Automatically activate environment on login
echo "conda activate $ENV_NAME" >> /home/ubuntu/.bashrc

echo "Conda environment $ENV_NAME successfully configured."
```

### Scenario 3: Formatting and Mounting an EBS Data Volume

When attaching secondary volumes via FOTOhub block storage, you must format and mount them on boot. This script ensures idempotency—it won't wipe the drive if it's already formatted!

```bash
#!/bin/bash
set -exo pipefail

DEVICE_NAME="/dev/nvme1n1"
MOUNT_POINT="/data"

# Check if device exists
if [ ! -b "$DEVICE_NAME" ]; then
    echo "Device $DEVICE_NAME not found! Waiting for block device attachment..."
    for i in {1..12}; do
        sleep 5
        if [ -b "$DEVICE_NAME" ]; then
            echo "Device attached."
            break
        fi
    done
fi

if [ ! -b "$DEVICE_NAME" ]; then
    echo "Fatal: Device $DEVICE_NAME never attached."
    exit 1
fi

# Check if the device is already formatted (idempotency check)
FS_TYPE=$(blkid -s TYPE -o value "$DEVICE_NAME" || true)

if [ -z "$FS_TYPE" ]; then
    echo "Formatting device $DEVICE_NAME as ext4..."
    mkfs.ext4 -F "$DEVICE_NAME"
else
    echo "Device $DEVICE_NAME already contains filesystem: $FS_TYPE"
fi

# Create mount point
mkdir -p "$MOUNT_POINT"

# Get UUID for stable fstab mounting
UUID=$(blkid -s UUID -o value "$DEVICE_NAME")

# Check if already in fstab
if ! grep -q "$UUID" /etc/fstab; then
    echo "Adding $DEVICE_NAME to /etc/fstab..."
    echo "UUID=$UUID $MOUNT_POINT ext4 defaults,nofail,discard 0 2" >> /etc/fstab
fi

# Mount everything
mount -a

# Set permissive rights for the ubuntu user
chown -R ubuntu:ubuntu "$MOUNT_POINT"
chmod 755 "$MOUNT_POINT"

echo "Storage provisioning completed."
```

### Scenario 4: Auto-Syncing FOTOhub S3 Artifacts via AWS CLI

Automatically sync datasets or configuration files from your FOTOhub S3-compatible object storage to the local NVMe drive.

```bash
#!/bin/bash
set -euo pipefail

export AWS_ACCESS_KEY_ID="your_fotohub_s3_key"
export AWS_SECRET_ACCESS_KEY="your_fotohub_s3_secret"
export AWS_DEFAULT_REGION="eu-central-1"
ENDPOINT_URL="https://s3.eu-central-1.fotohub.app"

BUCKET_NAME="fotohub-training-datasets"
LOCAL_SYNC_DIR="/data/datasets"

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
apt-get update && apt-get install -y unzip
unzip -q awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

mkdir -p "$LOCAL_SYNC_DIR"

echo "Syncing $BUCKET_NAME to $LOCAL_SYNC_DIR..."
aws --endpoint-url "$ENDPOINT_URL" s3 sync "s3://$BUCKET_NAME/" "$LOCAL_SYNC_DIR/" --exact-timestamps

chown -R ubuntu:ubuntu "$LOCAL_SYNC_DIR"
echo "S3 sync complete."
```

### Scenario 5: Unattended Tailscale Mesh VPN Node Join

Secure your instances by joining them immediately to your Tailscale network on boot, avoiding public IP exposure.

```bash
#!/bin/bash
set -euo pipefail

# Your pre-authorized Tailscale Auth Key (ephemeral or reusable)
TAILSCALE_AUTH_KEY="tskey-auth-XXXXXXXXXXXXX-YYYYYYYYYYYYYYYYY"
HOSTNAME="fotohub-gpu-node-$(cat /etc/machine-id | head -c 8)"

echo "Installing Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh

echo "Joining Tailscale network..."
tailscale up --authkey="$TAILSCALE_AUTH_KEY" --hostname="$HOSTNAME" --accept-routes --ssh

# Optional: Restrict UFW to only allow Tailscale traffic
ufw allow in on tailscale0
ufw default deny incoming
ufw default allow outgoing
ufw --force enable

echo "Tailscale configuration finished. Node available as $HOSTNAME."
```

### Scenario 6: Automated SSL Configuration with Nginx and Certbot

If you are exposing an API directly to the internet, use this script to install Nginx, configure a reverse proxy, and obtain a Let's Encrypt SSL certificate automatically.

```bash
#!/bin/bash
set -exo pipefail

DOMAIN="api.my-fotohub-app.com"
EMAIL="admin@my-fotohub-app.com"
BACKEND_PORT=8000

# Install dependencies (redundant if using nginx-certbot preset, but safe)
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# Create Nginx server block configuration
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

# Run Certbot non-interactively
certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect

echo "SSL configuration via Certbot is complete."
```

### Scenario 7: WireGuard Point-to-Point VPN Server

Set up a highly performant WireGuard server for direct, low-latency access to your FOTOhub instance.

```bash
#!/bin/bash
set -euo pipefail

SERVER_PORT=51820
SERVER_IP="10.8.0.1/24"
CLIENT_IP="10.8.0.2/32"

# Install WireGuard
apt-get update
apt-get install -y wireguard

# Generate keys
cd /etc/wireguard
umask 077
wg genkey | tee server_private_key | wg pubkey > server_public_key
wg genkey | tee client_private_key | wg pubkey > client_public_key

SERVER_PRIV=$(cat server_private_key)
CLIENT_PUB=$(cat client_public_key)

# Configure the WireGuard interface (wg0)
cat > /etc/wireguard/wg0.conf << EOF
[Interface]
Address = $SERVER_IP
SaveConfig = true
PrivateKey = $SERVER_PRIV
ListenPort = $SERVER_PORT
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = $CLIENT_PUB
AllowedIPs = $CLIENT_IP
EOF

# Enable IP forwarding
sed -i 's/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/' /etc/sysctl.conf
sysctl -p

# Start and enable the WireGuard service
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

# Output client configuration to a secure location for later retrieval
CLIENT_PRIV=$(cat client_private_key)
SERVER_PUB=$(cat server_public_key)
PUBLIC_IP=$(curl -s ifconfig.me)

cat > /root/client.conf << EOF
[Interface]
PrivateKey = $CLIENT_PRIV
Address = 10.8.0.2/24
DNS = 1.1.1.1

[Peer]
PublicKey = $SERVER_PUB
Endpoint = $PUBLIC_IP:$SERVER_PORT
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 20
EOF

echo "WireGuard setup complete. Client config generated at /root/client.conf."
```

### Scenario 8: Complex Multi-Container Docker Compose Deployment

If your application consists of multiple microservices, deploying via `docker-compose.yml` dynamically created in the startup script is an excellent pattern.

```bash
#!/bin/bash
set -exo pipefail

APP_DIR="/opt/myapp"
mkdir -p "$APP_DIR"

# Generate docker-compose.yml
cat > "$APP_DIR/docker-compose.yml" << 'EOF'
version: '3.8'

services:
  api:
    image: python:3.10-slim
    container_name: api_server
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://cache:6379/0
      - DB_HOST=database
    volumes:
      - ./src:/app
    working_dir: /app
    command: bash -c "pip install fastapi uvicorn redis asyncpg && uvicorn main:app --host 0.0.0.0"
    depends_on:
      - cache
      - database

  cache:
    image: redis:7-alpine
    container_name: redis_cache
    restart: always
    ports:
      - "6379:6379"

  database:
    image: postgres:15-alpine
    container_name: postgres_db
    restart: always
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: supersecretpassword
      POSTGRES_DB: appdb
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
EOF

# Generate dummy source code for demonstration
mkdir -p "$APP_DIR/src"
cat > "$APP_DIR/src/main.py" << 'EOF'
from fastapi import FastAPI
app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "FOTOhub Docker Compose World"}
EOF

# Set permissions
chown -R ubuntu:ubuntu "$APP_DIR"

# Start the stack (assumes docker preset was used)
cd "$APP_DIR"
docker compose up -d

echo "Multi-container application deployed and running."
```

---

## Idempotency Patterns

Because instances might occasionally reboot, or you might re-run startup scripts via the `/run-script` API, it is highly recommended to write **idempotent** bash scripts. This means running the script multiple times results in the same state without causing errors or duplicating data.

### Pattern 1: State Files
Create a lock file or state file upon successful completion.

```bash
#!/bin/bash
if [ -f /var/run/my_setup_complete.lock ]; then
    echo "Setup already completed. Skipping."
    exit 0
fi

# ... do expensive setup ...

touch /var/run/my_setup_complete.lock
```

### Pattern 2: Checking Existence
Check if users, directories, or configurations already exist before creating them.

```bash
# User creation
if ! id -u customuser > /dev/null 2>&1; then
    useradd -m -s /bin/bash customuser
fi

# Appending to files (preventing duplicate lines)
if ! grep -q "custom_export=true" /etc/environment; then
    echo "custom_export=true" >> /etc/environment
fi
```

### Pattern 3: `systemctl` Safety
Use `--now` and `enable` combined safely.

```bash
# Restarts if running, starts if stopped, enables on boot
systemctl enable --now my_service || true
```

---

## Debugging Cloud-Init and Startup Scripts

When a script fails, the instance will still boot, but the FOTOhub API may mark the status as degraded. Finding out *why* a script failed is critical.

### Viewing Logs via the FOTOhub API

You can stream or fetch the final logs generated during the cloud-init process using the `logs` endpoint.

```bash
curl -X GET "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/logs?lines=200" \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```

### Investigating Directly on the Instance via SSH

If you have SSH access to the node, the ultimate source of truth is the cloud-init output log.

```bash
# View the entire execution log
cat /var/log/cloud-init-output.log

# Follow the log in real-time during boot
tail -f /var/log/cloud-init-output.log

# Check for specific failure messages
grep -i "error" /var/log/cloud-init-output.log
grep -i "failed" /var/log/cloud-init-output.log
```

The standard cloud-init framework logs all activities to:
1. `/var/log/cloud-init-output.log`: Standard output and standard error from your `startup_script`.
2. `/var/log/cloud-init.log`: Detailed internal operations of the cloud-init system itself.

::: tip PRO TIP: SET -X
Always start your bash scripts with `set -x`. This will print every single command to `/var/log/cloud-init-output.log` before it is executed, making it trivial to see exactly which line of your script caused a failure.
:::

---

## Dynamic Script Execution via `/run-script`

Execute administrative bash scripts on running instances dynamically without opening manual SSH sessions or restarting the VM. This is incredibly useful for remote diagnostics or triggering updates.

### Endpoint: `POST /compute/v1/instances/{id}/run-script`

```bash
curl -X POST https://apis.fotohub.app/compute/v1/instances/inst_90f23b/run-script \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "script": "nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader"
  }'
```

#### Response Example

The API blocks until the script completes and returns the exact exit code, standard output, and standard error.

```json
{
  "success": true,
  "exit_code": 0,
  "stdout": "4%, 1824 MiB, 24576 MiB\n",
  "stderr": "",
  "duration_ms": 320
}
```

This endpoint shares the same execution context as `startup_script`: it runs as `root` in a non-interactive shell. For long-running background tasks, wrap your commands in `nohup` or create temporary systemd units.
