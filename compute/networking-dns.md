# Networking, Elastic IP & Route53 DNS

Comprehensive network control for your compute infrastructure: static Elastic IPs, dynamic firewall security groups, and native Amazon Route53 hosted DNS management.

---

## Elastic IP (Static Public IP)

By default, EC2 instances receive dynamic public IP addresses that change when the instance is stopped and started. Assigning an **Elastic IP** provides a persistent public IPv4 address that remains identical across reboots and power cycles.

### 1. Allocate & Attach Elastic IP

```bash
curl -X POST https://apis.fotohub.app/compute/v1/instances/inst_90f23b/elastic-ip   -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

Response:
```json
{
  "allocation_id": "eipalloc-01928374a5b6",
  "public_ip": "18.197.82.14",
  "instance_id": "inst_90f23b",
  "status": "associated"
}
```

### 2. Release Elastic IP

```bash
curl -X DELETE https://apis.fotohub.app/compute/v1/instances/inst_90f23b/elastic-ip   -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

---

## Dynamic Security Group Rules (Firewall)

Control inbound and outbound network access with granular CIDR rules. Each instance supports up to **20 rules**.

### Adding Inbound Rules

Open a port for a web service (e.g. port 8000 for FastAPI / vLLM):

```bash
curl -X POST https://apis.fotohub.app/compute/v1/instances/inst_90f23b/security-rules   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "direction": "inbound",
    "protocol": "tcp",
    "port": 8000,
    "cidr": "0.0.0.0/0",
    "description": "Public vLLM API Access"
  }'
```

### Restricting Access to Office CIDR

```bash
curl -X POST https://apis.fotohub.app/compute/v1/instances/inst_90f23b/security-rules   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "direction": "inbound",
    "protocol": "tcp",
    "port": 22,
    "cidr": "198.51.100.0/24",
    "description": "Corporate VPN SSH Only"
  }'
```

---

## Route53 DNS Management

The compute engine provides full programmatic management over Amazon Route53 hosted zones and DNS records.

### 1. Create a Hosted Zone

Register a domain zone to manage DNS records through FOTOhub:

```bash
curl -X POST https://apis.fotohub.app/compute/v1/dns/zones   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "domain": "ai-models.yourcompany.com",
    "comment": "Inference endpoint domain"
  }'
```

Response includes AWS Name Servers to delegate at your domain registrar:
```json
{
  "zone": {
    "id": "Z01928374829",
    "domain": "ai-models.yourcompany.com",
    "nameservers": [
      "ns-123.awsdns-15.com",
      "ns-456.awsdns-57.net",
      "ns-789.awsdns-34.org",
      "ns-012.awsdns-01.co.uk"
    ]
  }
}
```

### 2. One-Click Point Domain to Instance

Automatically create an `A` record linking your instance's current public IP to your custom subdomain:

```bash
curl -X POST https://apis.fotohub.app/compute/v1/dns/zones/Z01928374829/point-to-instance   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "subdomain": "comfy",
    "instance_id": "inst_90f23b"
  }'
```

Now `comfy.ai-models.yourcompany.com` resolves directly to your GPU node!

---

## Automated MX Email Record Setup

Configure Google Workspace or ProtonMail MX records in a single API call:

```bash
curl -X POST https://apis.fotohub.app/compute/v1/dns/zones/Z01928374829/email-setup \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google"
  }'
```

---

## Automated SSL/TLS Certificates with Certbot

Once your custom domain resolves to your instance's Elastic IP, secure it with free, auto-renewing TLS certificates from Let's Encrypt:

```bash
# SSH into your instance using allocated Elastic IP
ssh -i worker.pem ubuntu@18.197.82.14

# 1. Install Certbot and Nginx plugin (or use the nginx-certbot preset)
sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx

# 2. Obtain and install certificate in one command
sudo certbot --nginx -d comfy.ai-models.yourcompany.com --non-interactive --agree-tos -m admin@yourcompany.com

# 3. Verify auto-renewal timer
sudo systemctl status certbot.timer
```

---

## VPC & Private Subnets Architecture

Compute instances can be provisioned into private Virtual Private Clouds (VPCs) to ensure inter-node traffic flows over encrypted AWS backbones with zero internet traversal:

```mermaid
flowchart LR
    subgraph Frankfurt VPC (10.0.0.0/16)
        PublicSubnet["Public Subnet (10.0.1.0/24)"]
        PrivateSubnet["Private GPU Subnet (10.0.2.0/24)"]
        
        ALB["Application Load Balancer"]
        Worker1["GPU Worker 1 (10.0.2.14)"]
        Worker2["GPU Worker 2 (10.0.2.15)"]
        RedisNode["Private Redis Queue (10.0.2.99)"]
    end

    PublicSubnet --> ALB
    ALB --> Worker1 & Worker2
    Worker1 & Worker2 <--> RedisNode
```

### Querying VPCs & Subnets via API

```bash
# List available VPCs
curl -X GET https://apis.fotohub.app/compute/v1/aws/vpcs \
  -H "Authorization: Bearer $FOTOHUB_API_KEY"

# List subnets within a specific VPC
curl -X GET "https://apis.fotohub.app/compute/v1/aws/subnets?vpc_id=vpc-0a12f94b8" \
  -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

---

## Zero-Trust Network Security: VPC Peering, Private Endpoints & WireGuard Mesh

Enterprise machine learning clusters handling confidential user data, healthcare records, or proprietary model weights require strict **Zero-Trust network isolation**. In this model, GPU instances are provisioned **without public IPv4 addresses**, all public internet ingress is blocked, and communications travel across encrypted point-to-point tunnels and private cloud backbones.

```mermaid
flowchart TD
    subgraph Enterprise On-Prem / Cloud VPC (10.100.0.0/16)
        CorpClient["Enterprise ML Workstation (10.100.1.50)"]
        InternalDB["Customer Data Warehouse (10.100.2.10)"]
    end

    subgraph AWS Backbone Peering (pcx-01928374a5b6)
        CorpClient <-->|Zero Egress AWS Peering| PrivateALB
    end

    subgraph FOTOhub Compute Private VPC (10.0.0.0/16)
        PrivateALB["Internal Application Load Balancer (10.0.1.10)"]
        
        subgraph Air-Gapped GPU Compute Subnet (10.0.2.0/24)
            Node1["GPU Worker 1 (10.0.2.14)<br/>No Public IP"]
            Node2["GPU Worker 2 (10.0.2.15)<br/>No Public IP"]
        end
        
        subgraph Kernel WireGuard Mesh (wg0 - 10.42.0.0/24)
            WG_Gateway["WireGuard Hub Node (10.42.0.1)"]
            WG_Node1["WG Peer Node 1 (10.42.0.14)"]
            WG_Node2["WG Peer Node 2 (10.42.0.15)"]
        end
        
        PrivateLink["AWS PrivateLink Interface Endpoints"]
    end

    PrivateALB --> Node1 & Node2
    Node1 & Node2 <--> PrivateLink
    PrivateLink <--> S3Service["FOTOhub S3 (s1.fotohub.app)"]
    CorpClient <-.->|Encrypted ChaCha20-Poly1305 Tunnel| WG_Gateway
```

### 1. Inter-VPC Peering Connection

Connect your enterprise AWS account directly to your FOTOhub Compute VPC in Frankfurt (`eu-central-1`). Traffic routes over AWS fiber without traversing the public internet:

#### Requesting VPC Peering via API

```bash
curl -X POST https://apis.fotohub.app/compute/v1/aws/vpc-peering \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "peer_vpc_id": "vpc-0182938475a",
    "peer_owner_id": "123456789012",
    "peer_region": "eu-central-1",
    "name": "enterprise-corp-peering"
  }'
```

#### Response Example

```json
{
  "peering_connection_id": "pcx-01928374a5b6",
  "status": "pending-acceptance",
  "requester_vpc_id": "vpc-0a12f94b8",
  "accepter_vpc_id": "vpc-0182938475a"
}
```

Once accepted in your AWS Console or Terraform definition, add route entries directing your corporate subnet traffic (`10.100.0.0/16`) to the peering connection target:

```bash
# Accept peering in your AWS account
aws ec2 accept-vpc-peering-connection --vpc-peering-connection-id pcx-01928374a5b6

# Update route table
aws ec2 create-route \
  --route-table-id rtb-0891234abcd \
  --destination-cidr-block 10.0.0.0/16 \
  --vpc-peering-connection-id pcx-01928374a5b6
```

### 2. AWS PrivateLink & Private Endpoints

Instances running in private subnets without an Internet Gateway (IGW) or NAT Gateway can communicate with FOTOhub management APIs and S3 storage through AWS VPC Interface Endpoints:

- **Private API Gateway**: `apis.fotohub.app` resolves internally to `10.0.1.200` via VPC endpoint ENIs.
- **Private S3 Object Store**: `s1.fotohub.app` resolves directly via S3 Interface Gateway endpoints (`com.amazonaws.eu-central-1.s3`), eliminating all internet route tables and NAT gateway data processing surcharges ($0.045/GB).

```bash
# Provision an instance locked strictly to private subnets (no public IPv4)
curl -X POST https://apis.fotohub.app/compute/v1/instances \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "airgapped-vllm-node",
    "catalog_id": "g5.xlarge",
    "vpc_id": "vpc-0a12f94b8",
    "subnet_id": "subnet-private-0a2",
    "assign_public_ip": false,
    "security_group_rules": [
      {"protocol": "tcp", "port": 8000, "cidr": "10.100.0.0/16", "description": "Corporate Private Access"}
    ]
  }'
```

### 3. High-Performance WireGuard Mesh Network

WireGuard provides kernel-level, ChaCha20-Poly1305 encrypted point-to-point tunnels with virtually zero CPU overhead and maximum MTU utilization.

#### Bootstrapping WireGuard via Startup Preset

When deploying distributed clusters across availability zones or bridging remote ML engineers, inject the WireGuard bootstrap configuration during instance creation:

```bash
#!/bin/bash
# /etc/wireguard/setup-mesh.sh
set -e

apt-get update && apt-get install -y wireguard wireguard-tools

# Generate server keypair
umask 077
wg genkey | tee /etc/wireguard/private.key | wg pubkey > /etc/wireguard/public.key

PRIVATE_KEY=$(cat /etc/wireguard/private.key)

# Configure WireGuard interface (wg0)
cat > /etc/wireguard/wg0.conf << EOF
[Interface]
Address = 10.42.0.14/24
PrivateKey = ${PRIVATE_KEY}
ListenPort = 51820
MTU = 1420

# Corporate ML Gateway Peer
[Peer]
PublicKey = 8kK/12A98...corp_pub_key...=
AllowedIPs = 10.42.0.1/32, 10.100.0.0/16
Endpoint = vpn.yourbrand.com:51820
PersistentKeepalive = 25

# Peer GPU Worker 2
[Peer]
PublicKey = 3xM/44Z12...node2_pub_key...=
AllowedIPs = 10.42.0.15/32
Endpoint = 10.0.2.15:51820
PersistentKeepalive = 25
EOF

# Enable and start WireGuard systemd service
systemctl enable --now wg-quick@wg0

# Confirm tunnel handshake
wg show wg0
```

#### WireGuard Performance Advantages for Distributed ML

| Metric | IPSec / OpenVPN | Zero-Trust WireGuard Mesh | Advantage |
|:---|:---:|:---:|:---|
| **Cryptographic Handshake** | 1,200 – 2,400 ms | **< 15 ms** | Sub-second cluster re-convergence |
| **Throughput (25 Gbps link)** | ~450 MB/s (CPU bound) | **~2,250 MB/s** | Full line-rate distributed gradient sync |
| **Kernel Context Switches** | High (User-space TUN/TAP) | **Zero (Native Linux Kernel Module)** | Preserves 100% of CPU cores for PyTorch dataloaders |
| **Connection Roaming** | Drops connection on IP shift | **Instant Silent Re-keying** | Resilient against spot node IP transitions |

---

## Standard AI Port Reference

| Port | Protocol | Default Service | Recommended Inbound Rule |
|:---:|:---:|:---|:---|
| **22** | TCP | OpenSSH Remote Administration | Restrict to corporate VPN / static CIDR |
| **80 / 443** | TCP | Nginx Web Server & TLS Proxy | `0.0.0.0/0` (Public) |
| **8000** | TCP | vLLM / SGLang OpenAI API Server | Protected via Nginx reverse proxy + API key |
| **8188** | TCP | ComfyUI WebSocket & REST API | Internal VPC or password-protected |
| **11434** | TCP | Ollama Model Runtime | Internal localhost or VPC |
| **7860** | TCP | Gradio / Automatic1111 WebUI | Reverse proxy or SSH tunnel |
| **9100** | TCP | Prometheus Node Exporter | Scraped by internal monitoring subnet |
| **6379** | TCP | Redis Distributed Queue | Strict internal VPC binding |
| **5432** | TCP | PostgreSQL Database | Strict internal VPC binding |

