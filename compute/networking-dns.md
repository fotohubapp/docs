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
# SSH into your instance
ssh -i worker.pem ubuntu@<ELASTIC_IP>

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

