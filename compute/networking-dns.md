# Networking, Elastic IP & Route53 DNS

Comprehensive network control for your compute infrastructure: static Elastic IPs, dynamic firewall security groups, and native Amazon Route53 hosted DNS management.

---

## Architecture Overview

This diagram illustrates how FOTOhub compute instances interact with VPCs, Security Groups, Elastic IPs, Route53, and external CDNs like Cloudflare.

```mermaid
flowchart TD
    Internet((Internet)) --> CF[Cloudflare CDN / WAF]
    CF --> R53[Amazon Route53 DNS]
    Internet --> R53
    
    R53 -->|A Record| EIP[Elastic IP 18.197.82.14]
    
    subgraph Frankfurt VPC 172.31.0.0/16
        subgraph Public Subnet eu-central-1a
            EIP --> IGW[Internet Gateway]
            IGW --> ENI[Elastic Network Interface]
            
            subgraph Security Group sg-0abcdef123
                ENI -->|Allow 80/443| Node[FOTOhub Compute Instance]
            end
        end
        
        subgraph Private Subnet eu-central-1b
            Node <-->|VPC Peering| DB[(Private Database)]
        end
    end
```

:::info Architecture Defaults
All resources default to the `eu-central-1` (Frankfurt) region unless specified otherwise.
:::

---

## Elastic IP (Static Public IP)

By default, EC2 instances receive dynamic public IP addresses that change when the instance is stopped and started. Assigning an **Elastic IP** provides a persistent public IPv4 address that remains identical across reboots and power cycles.

### 1. Allocate & Attach Elastic IP

:::code-group

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/instances/inst_90f23b/elastic-ip \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"region": "eu-central-1"}'
```

```python [Python]
import os
import requests

api_key = os.getenv("FOTOHUB_API_KEY", "fh_live_YOUR_API_KEY")
url = "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/elastic-ip"

response = requests.post(
    url,
    headers={"Authorization": f"Bearer {api_key}"},
    json={"region": "eu-central-1"}
)
print(response.json())
```

```typescript [TypeScript]
import fetch from "node-fetch";

const allocateEIP = async () => {
  const res = await fetch("https://apis.fotohub.app/compute/v1/instances/inst_90f23b/elastic-ip", {
    method: "POST",
    headers: {
      "Authorization": "Bearer fh_live_YOUR_API_KEY",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ region: "eu-central-1" })
  });
  const data = await res.json();
  console.log(data);
};

allocateEIP();
```

```go [Go]
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	url := "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/elastic-ip"
	payload := map[string]string{"region": "eu-central-1"}
	jsonValue, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonValue))
	req.Header.Set("Authorization", "Bearer fh_live_YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer res.Body.Close()
	fmt.Println("EIP Allocated")
}
```

:::

Response:
```json
{
  "allocation_id": "eipalloc-01928374a5b6",
  "public_ip": "18.197.82.14",
  "association_id": "eipassoc-0a1b2c3d4e5f",
  "instance_id": "inst_90f23b",
  "status": "associated"
}
```

:::warning Pricing Alert
Elastic IPs cost **$0.005/hr** when associated with a running instance, and **$0.005/hr** when idle (allocated but not associated). Be sure to release them when no longer needed!
:::

### 2. Release Elastic IP

:::code-group

```bash [cURL]
curl -X DELETE https://apis.fotohub.app/compute/v1/instances/inst_90f23b/elastic-ip \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```

```python [Python]
import requests

requests.delete(
    "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/elastic-ip",
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}
)
```

:::

---

## VPC & Subnet Reference

Compute instances can be provisioned into private Virtual Private Clouds (VPCs) to ensure inter-node traffic flows over encrypted AWS backbones.

### Production Network Details

- **VPC ID:** `vpc-08528c7005fc7f9d5`
- **VPC CIDR:** `172.31.0.0/16`
- **Subnets (AZs):** `eu-central-1a`, `eu-central-1b`, `eu-central-1c`

### Listing VPCs

:::code-group
```bash [cURL]
curl -X GET https://apis.fotohub.app/compute/v1/aws/vpcs \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/aws/vpcs", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
print(res.json())
```
:::

### Listing Subnets

:::code-group
```bash [cURL]
curl -X GET "https://apis.fotohub.app/compute/v1/aws/subnets?vpc_id=vpc-08528c7005fc7f9d5" \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```
```python [Python]
import requests
res = requests.get("https://apis.fotohub.app/compute/v1/aws/subnets?vpc_id=vpc-08528c7005fc7f9d5", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"})
print(res.json())
```
:::

---

## Dynamic Security Group Rules (Firewall)

Control inbound and outbound network access with granular CIDR rules. Each instance supports up to **20 rules**.

### Complete Security Group API

#### List Security Groups
```bash
curl -X GET https://apis.fotohub.app/compute/v1/aws/security-groups \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```

#### Create Security Group
```bash
curl -X POST https://apis.fotohub.app/compute/v1/aws/security-groups \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -d '{"name": "api-sg", "description": "API nodes", "vpc_id": "vpc-08528c7005fc7f9d5"}'
```

#### Delete Security Group
```bash
curl -X DELETE https://apis.fotohub.app/compute/v1/aws/security-groups/sg-0abcdef123 \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```

#### List SGs on Instance
```bash
curl -X GET https://apis.fotohub.app/compute/v1/instances/inst_90f23b/security-groups \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```

### Adding Inbound Rules

Open a port for a web service (e.g. port 8000 for FastAPI / vLLM):

:::code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/instances/inst_90f23b/security-rules \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "direction": "inbound",
    "protocol": "tcp",
    "port": 8000,
    "cidr": "0.0.0.0/0",
    "description": "Public vLLM API Access"
  }'
```
```python [Python]
import requests

requests.post(
    "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/security-rules",
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
    json={
        "direction": "inbound",
        "protocol": "tcp",
        "port": 8000,
        "cidr": "0.0.0.0/0",
        "description": "Public vLLM API Access"
    }
)
```
:::

### Removing Rules
```bash
curl -X DELETE https://apis.fotohub.app/compute/v1/instances/inst_90f23b/security-rules \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -d '{"direction": "inbound", "protocol": "tcp", "port": 8000, "cidr": "0.0.0.0/0"}'
```

---

## Route53 DNS Management

The compute engine provides full programmatic management over Amazon Route53 hosted zones and DNS records.

### Complete DNS API

#### List Hosted Zones
```bash
curl -X GET https://apis.fotohub.app/compute/v1/dns/zones \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```

#### Create Hosted Zone
```bash
curl -X POST https://apis.fotohub.app/compute/v1/dns/zones \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -d '{"domain_name": "ai-models.yourcompany.com", "comment": "Inference endpoint domain"}'
```

#### Get Zone Details (NS Records)
```bash
curl -X GET https://apis.fotohub.app/compute/v1/dns/zones/Z01928374829 \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```

#### Verify Domain Ownership
```bash
curl -X POST https://apis.fotohub.app/compute/v1/dns/zones/Z01928374829/verify \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```

#### List Records
```bash
curl -X GET https://apis.fotohub.app/compute/v1/dns/zones/Z01928374829/records \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```

#### Add Record
```bash
curl -X POST https://apis.fotohub.app/compute/v1/dns/zones/Z01928374829/records \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -d '{"name": "api", "type": "A", "value": "18.197.82.14", "ttl": 300}'
```

#### Delete Record
```bash
curl -X DELETE https://apis.fotohub.app/compute/v1/dns/zones/Z01928374829/records \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -d '{"name": "api", "type": "A"}'
```

#### Delete Zone
```bash
curl -X DELETE https://apis.fotohub.app/compute/v1/dns/zones/Z01928374829 \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY"
```

### Domain Mapping Patterns

Automatically create an `A` record linking your instance's current public IP to your custom subdomain.

:::code-group
```bash [cURL]
# Add mapping
curl -X POST https://apis.fotohub.app/compute/v1/instances/inst_90f23b/domain \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -d '{"subdomain": "api.myapp.com"}'

# Remove mapping
curl -X DELETE https://apis.fotohub.app/compute/v1/instances/inst_90f23b/domain \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -d '{"subdomain": "api.myapp.com"}'
```
```python [Python]
import requests

# Add mapping
requests.post(
    "https://apis.fotohub.app/compute/v1/instances/inst_90f23b/domain",
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
    json={"subdomain": "api.myapp.com"}
)
```
:::

### Automated MX Email Record Setup

Configure Google Workspace or ProtonMail MX records in a single API call:

```bash
curl -X POST https://apis.fotohub.app/compute/v1/dns/zones/Z01928374829/setup-email \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"provider": "google"}'
```
This automatically adds required MX, SPF, and DKIM records for email validation.

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

## Locking Down Access

There is no managed "Zero-Trust" product here — no VPC peering to your own AWS account, no AWS
PrivateLink, and no `assign_public_ip: false` provisioning flag to get an instance without a
public IP (the instance provisioning schema has no such field). What's real is Security Groups
(above) to restrict inbound traffic, and a self-managed WireGuard tunnel you install yourself on
your own instance — the same way you'd do it on any Linux box.

### Self-Managed WireGuard Tunnel

WireGuard provides kernel-level, ChaCha20-Poly1305 encrypted point-to-point tunnels with virtually zero CPU overhead and maximum MTU utilization (1420). This is standard Linux tooling you install on your own rented instance — FOTOhub does not manage or provide this as a platform feature.

WireGuard provides kernel-level, ChaCha20-Poly1305 encrypted point-to-point tunnels with virtually zero CPU overhead and maximum MTU utilization (1420).

```bash
#!/bin/bash
# /etc/wireguard/setup-mesh.sh
set -e

apt-get update && apt-get install -y wireguard wireguard-tools
umask 077
wg genkey | tee /etc/wireguard/private.key | wg pubkey > /etc/wireguard/public.key
PRIVATE_KEY=$(cat /etc/wireguard/private.key)

cat > /etc/wireguard/wg0.conf << WGE_EOF
[Interface]
Address = 10.42.0.14/24
PrivateKey = ${PRIVATE_KEY}
ListenPort = 51820
MTU = 1420

[Peer]
PublicKey = 8kK/12A98...corp_pub_key...=
AllowedIPs = 10.42.0.1/32, 10.100.0.0/16
Endpoint = vpn.yourbrand.com:51820
PersistentKeepalive = 25
WGE_EOF

systemctl enable --now wg-quick@wg0
```

---

## Standard AI Port Reference

Ensure you open the right ports via the Security Rules API for your AI workloads.

| Port | Protocol | Default Service | Recommended Inbound Rule |
|:---:|:---:|:---|:---|
| **22** | TCP | OpenSSH Remote Administration | Restrict to corporate VPN / static CIDR |
| **80 / 443** | TCP | Nginx Web Server & TLS Proxy | `0.0.0.0/0` (Public) |
| **3000** | TCP | Open WebUI | Internal VPC or SSH tunnel |
| **5432** | TCP | PostgreSQL Database | Strict internal VPC binding |
| **6379** | TCP | Redis Distributed Queue | Strict internal VPC binding |
| **7860** | TCP | Gradio / Automatic1111 WebUI | Reverse proxy or SSH tunnel |
| **8000** | TCP | vLLM / SGLang OpenAI API Server | Protected via Nginx reverse proxy + API key |
| **8080** | TCP | General API Server | Specific CIDR or Public |
| **8188** | TCP | ComfyUI WebSocket & REST API | Internal VPC or password-protected |
| **9100** | TCP | Prometheus Node Exporter | Scraped by internal monitoring subnet |
| **11434** | TCP | Ollama Model Runtime | Internal localhost or VPC |

---

## Troubleshooting

:::danger SSH Connection Refused
**Symptom:** `ssh: connect to host 18.197.82.14 port 22: Connection refused` or timeout.
**Resolution:** Verify your Security Group rules. By default, instances are locked down. You must explicitly allow Port 22 inbound from your IP address via the `POST /instances/:id/security-rules` endpoint.
:::

:::danger Domain Not Resolving
**Symptom:** Browsing to `api.myapp.com` shows `ERR_NAME_NOT_RESOLVED`.
**Resolution:** DNS propagation can take up to 24 hours globally, but usually updates in minutes. Verify your name servers at your registrar point to the FOTOhub/AWS Route53 name servers provided by the `GET /dns/zones/:id` response. Use `dig api.myapp.com +trace` to debug DNS delegation.
:::

:::warning Elastic IP Not Reachable
**Symptom:** You allocated an EIP but the instance is unresponsive.
**Resolution:** Verify the EIP association status is `associated` using `GET /instances/:id/elastic-ip`. Ensure the instance is running and has completed its boot sequence. Also check that your Security Group permits inbound traffic on the ports you are testing.
:::


---

## Advanced Networking Walkthroughs

### 1. Setting up a High-Availability Load Balancer with Auto-Scaling

When traffic to your LLM or ComfyUI instances spikes, you can distribute the load using a combination of Route53 weighted records and FOTOhub load balancers.

1. **Deploy multiple identical instances** across different Availability Zones (e.g., `eu-central-1a` and `eu-central-1b`).
2. **Allocate Elastic IPs** for each instance.
3. **Configure Route53** with weighted or latency-based routing policies pointing to the different EIPs.

:::code-group
```python [Python]
import requests

# Deploy Instance 1 in AZ a
res1 = requests.post(
    "https://apis.fotohub.app/compute/v1/instances",
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
    json={"catalog_id": "g5.xlarge", "subnet_id": "eu-central-1a"}
)
inst1 = res1.json()["id"]

# Deploy Instance 2 in AZ b
res2 = requests.post(
    "https://apis.fotohub.app/compute/v1/instances",
    headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"},
    json={"catalog_id": "g5.xlarge", "subnet_id": "eu-central-1b"}
)
inst2 = res2.json()["id"]

# Allocate EIPs
eip1 = requests.post(f"https://apis.fotohub.app/compute/v1/instances/{inst1}/elastic-ip", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}).json()
eip2 = requests.post(f"https://apis.fotohub.app/compute/v1/instances/{inst2}/elastic-ip", headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}).json()

print(f"Node 1 IP: {eip1['public_ip']}, Node 2 IP: {eip2['public_ip']}")
```
:::

### 2. Implementing a Bastion Host (Jump Box)

For maximum security, avoid assigning Elastic IPs to your expensive GPU nodes. Instead, deploy a tiny CPU instance (e.g., `t3.micro`) as a Bastion host in a public subnet, and place your GPU instances in a private subnet.

1. Create a `t3.micro` instance in the public subnet (`eu-central-1a`).
2. Assign an Elastic IP to the Bastion host.
3. Open Port 22 on the Bastion host to your office IP.
4. Create a GPU instance in the private subnet without an Elastic IP.
5. Open Port 22 on the GPU instance, allowing access *only* from the Bastion host's internal private IP.

To connect:
```bash
# Connect to the Bastion host using SSH Agent Forwarding
ssh -A -i bastion.pem ubuntu@BASTION_EIP

# From within the Bastion, connect to the internal GPU node
ssh -i worker.pem ubuntu@GPU_PRIVATE_IP
```

### 3. Rate Limiting and WAF Integration

When using Route53, it is highly recommended to proxy your web traffic through a CDN and Web Application Firewall (WAF) like Cloudflare.

1. In Cloudflare, add your domain.
2. Configure your Route53 name servers to the ones provided by Cloudflare.
3. In Cloudflare's DNS settings, create an `A` record pointing to your FOTOhub Elastic IP.
4. Enable the "Proxy" status (orange cloud) in Cloudflare.
5. In your FOTOhub Security Group, restrict Port 80 and 443 inbound traffic to *only* allow Cloudflare's published IP ranges.

```bash
# Example: Adding a Cloudflare IP range to your Security Group
curl -X POST https://apis.fotohub.app/compute/v1/instances/inst_90f23b/security-rules \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "direction": "inbound",
    "protocol": "tcp",
    "port": 443,
    "cidr": "173.245.48.0/20",
    "description": "Cloudflare WAF Proxy"
  }'
```

By doing this, you ensure that malicious actors cannot bypass your WAF by connecting directly to your Elastic IP. All traffic is forced through Cloudflare's DDoS protection and rate limiting.

### 4. Continuous DNS Verification

If you are programmatically provisioning and destroying environments (e.g., in a CI/CD pipeline), you can use the DNS Verify endpoint to ensure your records have propagated before running integration tests.

```python
import time
import requests

def wait_for_dns_propagation(zone_id, domain, timeout=600):
    start_time = time.time()
    while time.time() - start_time < timeout:
        res = requests.post(
            f"https://apis.fotohub.app/compute/v1/dns/zones/{zone_id}/verify",
            headers={"Authorization": "Bearer fh_live_YOUR_API_KEY"}
        )
        if res.json().get("status") == "verified":
            print(f"Domain {domain} successfully verified and propagated!")
            return True
        print("Waiting for DNS propagation...")
        time.sleep(30)
    raise TimeoutError("DNS propagation timed out.")
```

---

