# Application Load Balancers & Auto Scaling Clusters

Deploy highly available, fault-tolerant GPU and CPU clusters in **Frankfurt (`eu-central-1`)** with automated health checks, dynamic scale-out policies, and Application Load Balancers (ALB).

All load balancing and autoscaling primitives map directly to native AWS infrastructure via the **Compute Engine** (`/compute/v1/aws/*`), billed transparently to your prepaid USD wallet without hidden management surcharges.

---

## High Availability Cluster Architecture

```mermaid
flowchart TD
    subgraph Internet Traffic
        Users["Global Clients (HTTPS / REST / WebSocket)"]
        DNS["Route53 Custom Domain (e.g. api.yourbrand.com)"]
    end

    subgraph AWS Frankfurt (eu-central-1)
        ALB["Application Load Balancer (ALB)"]
        TG["Target Group (:8000 vLLM / :8188 ComfyUI)"]
        
        subgraph Auto Scaling Group (min: 2, max: 8)
            Node1["Spot Worker 1 (A10G - eu-central-1a)"]
            Node2["Spot Worker 2 (A10G - eu-central-1b)"]
            Node3["Spot Worker 3 (A10G - eu-central-1c)"]
        end
        
        CW["CloudWatch GPU / CPU Alarm (>80% Utilization)"]
    end

    Users --> DNS --> ALB
    ALB -->|Health Checks / Round-Robin| TG
    TG --> Node1 & Node2 & Node3
    Node1 & Node2 & Node3 -.->|Metrics| CW
    CW -.->|Trigger Scale-Out (+1 Node)| TG
```

---

## 1. Creating a Target Group

Target groups route traffic to healthy backend instances based on configurable HTTP health check probes:

### Endpoint: `POST /compute/v1/aws/target-groups`

::: code-group

```python [Python]
from fotohub import FotoHub
import os

client = FotoHub(api_key=os.environ["FOTOHUB_API_KEY"])

target_group = client.post("/compute/v1/aws/target-groups", {
    "name": "vllm-cluster-tg",
    "protocol": "HTTP",
    "port": 8000,
    "vpc_id": "vpc-0a12f94b8",
    "target_type": "instance",
    "health_check_path": "/health",
    "health_check_interval": 15,
    "region": "eu-central-1"
})

print(f"Created Target Group: {target_group['target_group_arn']}")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function createTargetGroup() {
  const tg = await client.post("/compute/v1/aws/target-groups", {
    name: "comfyui-farm-tg",
    protocol: "HTTP",
    port: 8188,
    vpc_id: "vpc-0a12f94b8",
    health_check_path: "/system_stats",
    health_check_interval: 20,
    region: "eu-central-1",
  });

  console.log("Target Group ARN:", tg.data.target_group_arn);
}

createTargetGroup();
```

```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/aws/target-groups   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "name": "vllm-cluster-tg",
    "protocol": "HTTP",
    "port": 8000,
    "vpc_id": "vpc-0a12f94b8",
    "health_check_path": "/health",
    "health_check_interval": 15
  }'
```

:::

---

## 2. Provisioning an Application Load Balancer (ALB)

Deploy a multi-AZ internet-facing load balancer with native TLS termination:

```bash
curl -X POST https://apis.fotohub.app/compute/v1/aws/load-balancers   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "name": "prod-inference-alb",
    "type": "application",
    "scheme": "internet-facing",
    "subnets": ["subnet-0a112233", "subnet-0b445566"],
    "security_groups": ["sg-0c778899"],
    "region": "eu-central-1"
  }'
```

#### Response Example

```json
{
  "load_balancer_arn": "arn:aws:elasticloadbalancing:eu-central-1:123456789:loadbalancer/app/prod-inference-alb/50dc6c495c0c9188",
  "dns_name": "prod-inference-alb-123456789.eu-central-1.elb.amazonaws.com",
  "status": "provisioning"
}
```

::: tip DNS Mapping
Once provisioned, map your custom domain (e.g. `llm.yourdomain.com`) to `dns_name` as a CNAME or Route53 Alias record.
:::

---

## 3. Configuring Auto Scaling Groups (ASG)

Auto Scaling Groups dynamically scale your worker pool based on traffic demands while maintaining a minimum warm capacity.

### Endpoint: `POST /compute/v1/aws/auto-scaling`

| Parameter | Type | Required | Default | Description |
|:---|:---|:---:|:---:|:---|
| `name` | string | **Yes** | — | Unique name for the Auto Scaling Group. |
| `min_size` | integer | **Yes** | `1` | Minimum number of running instances. |
| `max_size` | integer | **Yes** | `5` | Upper ceiling to prevent runaway billing. |
| `desired` | integer | **Yes** | `1` | Initial targeted number of instances. |
| `instance_type` | string | **Yes** | — | Catalog ID (e.g. `g5.xlarge`, `c5.2xlarge`). |
| `ami_id` | string | **Yes** | — | Base Golden AMI ID pre-configured with models. |
| `target_group_arns`| array | **Yes** | `[]` | ARNs of target groups to register new nodes to. |
| `availability_zones`| array | No | `["eu-central-1a", "eu-central-1b"]` | Multi-AZ redundancy distribution. |

```bash
curl -X POST https://apis.fotohub.app/compute/v1/aws/auto-scaling   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "name": "qwen-inference-asg",
    "min_size": 1,
    "max_size": 6,
    "desired": 2,
    "instance_type": "g5.xlarge",
    "ami_id": "ami-0a912837bc901ef",
    "target_group_arns": ["arn:aws:elasticloadbalancing:eu-central-1:...:targetgroup/vllm-cluster-tg/..."],
    "availability_zones": ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
  }'
```

---

## 4. CloudWatch Scale-Out Alarms

Attach metrics alarms that trigger scaling actions automatically:

```bash
curl -X POST https://apis.fotohub.app/compute/v1/aws/alarms   -H "Authorization: Bearer $FOTOHUB_API_KEY"   -H "Content-Type: application/json"   -d '{
    "instance_id": "i-098234abcf",
    "metric": "CPUUtilization",
    "threshold": 80.0,
    "comparison": "GreaterThanThreshold",
    "statistic": "Average",
    "period": 300,
    "evaluation_periods": 2
  }'
```

- **`CPUUtilization`**: Average CPU load over 5-minute evaluation periods.
- **`StatusCheckFailed`**: Detects hardware faults or kernel panics and automatically replaces broken instances.
- **`NetworkIn` / `NetworkOut`**: Triggers scaling during heavy batch downloads or high-resolution video streams.
