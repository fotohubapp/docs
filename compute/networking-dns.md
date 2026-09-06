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
curl -X POST https://apis.fotohub.app/compute/v1/dns/zones/Z01928374829/email-setup   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "provider": "google"
  }'
```
