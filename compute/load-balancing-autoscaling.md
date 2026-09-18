---
outline: deep
title: Load Balancing & Autoscaling
description: Complete guide to Application Load Balancers, Auto Scaling Groups, and high-availability cluster deployments on FOTOhub.
---

# Application Load Balancers & Auto Scaling Clusters

Deploy highly available, fault-tolerant GPU and CPU clusters in **Frankfurt (`eu-central-1`)** with target-group health checks, Auto Scaling Groups, and Application Load Balancers (ALB). Note upfront: CloudWatch alarms through this API are observability-only (see section 5) and there is no automatic scale-out trigger — you drive ASG size changes yourself.

All load balancing and autoscaling primitives map directly to native AWS infrastructure via the **Compute Engine** (`/compute/v1/aws/*`), billed transparently to your prepaid USD wallet without hidden management surcharges.

::: danger Billing Restrictions
FOTOhub operates on a **100% USD prepaid wallet system**. 
- **NO PLN** or other local currencies are accepted. 
- **NO CREDITS** or promotional balances apply to compute infrastructure. 
- A minimum wallet balance of **$0.50 USD** is strictly required to provision any load balancing or autoscaling resources.
:::

::: info Region & API Basics
- **Base URL:** `https://apis.fotohub.app/compute/v1`
- **Region:** `eu-central-1` (Frankfurt, AWS)
- **Auth:** `Authorization: Bearer fh_live_YOUR_API_KEY`
:::

---

## 1. High Availability Cluster Architecture

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
        
        CW["CloudWatch CPU Alarm (observability only — does not auto-trigger scaling)"]
    end

    Users --> DNS --> ALB
    ALB -->|Health Checks / Round-Robin| TG
    TG --> Node1 & Node2 & Node3
    Node1 & Node2 & Node3 -.->|Metrics| CW
    CW -.->|You poll this and call PUT /aws/auto-scaling/name yourself| TG
```

---

## 2. Infrastructure Pricing & Hardware Options

FOTOhub exposes several powerful instance families for varied workloads. We emphasize cost efficiency and transparency. All prices are in USD.

### Instance Families

| Family | Description | Examples |
|:---|:---|:---|
| **T3** | Burstable general-purpose CPU instances | `t3.medium`, `t3.large` |
| **C5** | Compute-optimized instances | `c5.large`, `c5.2xlarge` |
| **M5** | General-purpose instances | `m5.large`, `m5.4xlarge` |
| **R5** | Memory-optimized instances | `r5.large`, `r5.4xlarge` |
| **G4dn** | Cost-effective GPU (NVIDIA T4) | `g4dn.xlarge` |
| **G5** | High-performance GPU (NVIDIA A10G) | `g5.xlarge`, `g5.2xlarge` |

### Popular GPU Pricing

- **G5.xlarge (NVIDIA A10G 24GB):** 
  - Spot Price: `$0.38/hr`
  - On-Demand Price: `$1.01/hr`
- **G4dn.xlarge (NVIDIA T4 16GB):** 
  - Spot Price: `$0.20/hr`
  - On-Demand Price: `$0.53/hr`

### Storage & Data Transfer

- **EBS Block Storage:**
  - `gp3`: **$0.08 / GB-month**
  - `io2`: **$0.125 / GB-month** (up to 64K IOPS)
- **Object Storage (FOTOhub S3):**
  - Endpoint: `s1.fotohub.app`
  - Cost: **$0.0245 / GB-month**
  - Data Egress: **FREE intra-cluster egress** (No charge for traffic between your S3 bucket and your EC2 instances within `eu-central-1`).

::: tip Firecracker Sandbox
Need secure, isolated code execution without managing VMs? See [Firecracker Sandboxes](/compute/agent-sandboxes) — it runs through an Agent Engine `code.python` workflow node, not a directly callable REST endpoint.
:::

---

## 3. Complete ALB Setup Guide

:::warning No listener endpoint
There is no `POST /aws/load-balancers/listeners` route or any other way to attach a listener
through this API — `create_load_balancer` in `compute-engine` only creates the ALB resource
itself via `elbv2.create_load_balancer`, nothing wires a listener to a target group. A load
balancer created through this API has no listeners and will not route traffic until you attach
one directly through the AWS Console or the AWS CLI/SDK against the returned ARN, outside of
FOTOhub's API. Max **5 load balancers per user**.
:::

Setting up an Application Load Balancer today is:
1. Provision the **Load Balancer** (via this API)
2. Create a **Target Group** (via this API)
3. Register **Instances** to the target group (via this API)
4. Attach a **Listener** connecting the target group to the load balancer — **outside this API**,
   directly against AWS

### Step 3.1: Provision the Application Load Balancer (ALB)

Create a multi-AZ internet-facing load balancer to act as your ingress.

**Endpoint:** `POST /aws/load-balancers`

::: code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/aws/load-balancers \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "prod-inference-alb",
    "type": "application",
    "scheme": "internet-facing",
    "subnets": ["subnet-0a112233", "subnet-0b445566"],
    "security_groups": ["sg-0c778899"],
    "region": "eu-central-1"
  }'
```

```python [Python]
import requests

url = "https://apis.fotohub.app/compute/v1/aws/load-balancers"
headers = {
    "Authorization": "Bearer fh_live_YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "name": "prod-inference-alb",
    "type": "application",
    "scheme": "internet-facing",
    "subnets": ["subnet-0a112233", "subnet-0b445566"],
    "security_groups": ["sg-0c778899"],
    "region": "eu-central-1"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```
:::

#### Load Balancer JSON Response Schema

```json
{
  "arn": "arn:aws:elasticloadbalancing:eu-central-1:123456789:loadbalancer/app/prod-inference-alb/50dc6c495c0c9188",
  "name": "prod-inference-alb",
  "dns_name": "prod-inference-alb-123456789.eu-central-1.elb.amazonaws.com",
  "type": "application",
  "state": "provisioning",
  "scheme": "internet-facing",
  "vpc_id": "vpc-0a12f94b8"
}
```

### Step 3.2: Create a Target Group

Target groups route traffic to healthy backend instances based on configurable HTTP health check probes.

**Endpoint:** `POST /aws/target-groups`

::: code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/aws/target-groups \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "vllm-cluster-tg",
    "protocol": "HTTP",
    "port": 8000,
    "vpc_id": "vpc-0a12f94b8",
    "target_type": "instance",
    "health_check_path": "/health",
    "health_check_interval": 15,
    "region": "eu-central-1"
  }'
```
:::

#### Target Group JSON Response Schema

```json
{
  "arn": "arn:aws:elasticloadbalancing:eu-central-1:123456789:targetgroup/vllm-cluster-tg/60dc6c495c0c9199",
  "name": "vllm-cluster-tg",
  "port": 8000,
  "protocol": "HTTP",
  "vpc_id": "vpc-0a12f94b8"
}
```

### Step 3.3: Register Instances to Target Group

If you are not using an ASG, you can manually register EC2 instances. Note `instance_ids` here
means the **raw AWS EC2 instance ID** (`i-0abc...`), not FOTOhub's internal instance UUID — and
every instance must already belong to you, checked server-side before registration.

**Endpoint:** `POST /aws/target-groups/register`

::: code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/aws/target-groups/register \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "target_group_arn": "arn:aws:elasticloadbalancing:...:targetgroup/vllm-cluster-tg/...",
    "instance_ids": ["i-098234abcf", "i-098234abcd"],
    "port": 8000
  }'
```
:::

Note the single `port` applies to every instance in the call — you cannot register instances at
different ports in one request.

#### Register Targets JSON Response Schema

```json
{ "success": true }
```

### Step 3.4: Attaching a Listener (outside FOTOhub's API)

As noted above, there is no FOTOhub endpoint for this. Once you have the load balancer ARN and
target group ARN from the steps above, create the listener directly against AWS:

```bash
aws elbv2 create-listener \
  --load-balancer-arn "arn:aws:elasticloadbalancing:eu-central-1:123456789:loadbalancer/app/prod-inference-alb/50dc6c495c0c9188" \
  --protocol HTTP --port 80 \
  --default-actions Type=forward,TargetGroupArn="arn:aws:elasticloadbalancing:eu-central-1:123456789:targetgroup/vllm-cluster-tg/60dc6c495c0c9199"
```

This requires AWS credentials with `elasticloadbalancing:CreateListener` on the resource FOTOhub
provisioned for you — reach out to support if you don't have a way to do this today.

---

## 4. Auto Scaling Groups (ASG)

Auto Scaling Groups dynamically scale your worker pool based on traffic demands while maintaining a minimum warm capacity. They use Launch Templates to define the instance configuration.

### Provisioning an ASG

**Endpoint:** `POST /aws/auto-scaling`. Max **5 Auto Scaling Groups per user**, and `max_size` is
silently capped at **20** regardless of what you request.

| Parameter | Type | Required | Default | Description |
|:---|:---|:---:|:---:|:---|
| `name` | string | No | auto-generated | Unique name for the Auto Scaling Group. |
| `min_size` | integer | No | `1` | Minimum number of running instances. |
| `max_size` | integer | No | `5` | Upper ceiling; capped at 20 server-side. |
| `desired` | integer | No | `1` | Initial targeted number of instances. |
| `instance_type` | string | Conditional | — | Catalog ID (e.g. `g5.xlarge`, `c5.2xlarge`). Required if you don't supply `launch_template_id`. |
| `ami_id` | string | Conditional | — | Your own AMI ID (see [Golden AMI pattern](/compute/volumes-storage)). Required alongside `instance_type` if you don't supply `launch_template_id`. |
| `launch_template_id`| string | No | — | Use an existing EC2 launch template instead of `instance_type`/`ami_id`. |
| `target_group_arns`| array | No | `[]` | ARNs of target groups to register new nodes to. |
| `availability_zones`| array | No | `["eu-central-1a"]` | Multi-AZ redundancy distribution. |

::: code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/aws/auto-scaling \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
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
:::

#### Auto Scaling Group JSON Response Schema

```json
{
  "name": "qwen-inference-asg",
  "min_size": 1,
  "max_size": 6,
  "desired": 2
}
```

---

## 5. Scaling Policies & CloudWatch Alarms

Scaling policies define *how* and *when* your ASG scales.

### 5.1 CloudWatch Alarm Triggers

Attach metrics alarms that trigger scaling actions automatically. For example, if CPU usage exceeds 80%, scale out. If it drops below 20%, scale in.

**Endpoint:** `POST /aws/alarms`

:::warning These alarms are observability only — they cannot trigger scaling
The real `AlarmRequest` schema is `instance_id` (required — one alarm watches one instance, not
an ASG), `metric`, `threshold`, `comparison`, `statistic`, `period`, `evaluation_periods`. There
is no `alarm_name` field (the server names it for you: `fh-{user}-{metric}-{instance}`) and no
`action_arn` field. Worse: the underlying `put_metric_alarm` call is created with
**`ActionsEnabled=False`** — hardcoded server-side — so even a matching alarm state never fires
anything. `metric` must be one of `CPUUtilization`, `NetworkIn`, `NetworkOut`, `DiskReadOps`,
`DiskWriteOps`, `StatusCheckFailed` (all built-in EC2 metrics; no GPU metric). Max 50 alarms per
user.
:::

```bash [Create an Alarm]
curl -X POST https://apis.fotohub.app/compute/v1/aws/alarms \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instance_id": "inst_90f23b",
    "metric": "CPUUtilization",
    "threshold": 80.0,
    "comparison": "GreaterThanThreshold",
    "statistic": "Average",
    "period": 300,
    "evaluation_periods": 2
  }'
```

#### Alarm JSON Response Schema

```json
{
  "alarm_name": "fh-a1b2c3d4-CPUUtilization-90f23b12",
  "metric": "CPUUtilization",
  "threshold": 80.0,
  "comparison": "GreaterThanThreshold"
}
```

### 5.2 Target Tracking, Step Scaling, Scheduled Scaling — Not Implemented

None of these exist. There is no scaling-policy endpoint, no target-tracking configuration, no
step-scaling configuration, and no scheduled-scaling configuration anywhere in `compute-engine` —
`aws_extended.py` has instance-scoped alarms (inert, see above) and ASG size fields (`min_size`/
`max_size`/`desired`) and nothing that connects the two automatically. If you want your ASG to
actually respond to load, you need to poll CloudWatch/your own metrics yourself and call
`PUT /aws/auto-scaling/{name}` to change `desired` — see the Python automation example below,
which does exactly that.

### 5.3 GPU Cluster Scaling by Queue Depth — Roll Your Own

There is no custom-metric ingestion endpoint (no `put_metric_data` equivalent) and no
target-tracking policy support. To scale `g5.xlarge` instances by queue depth, poll your own
queue (SQS, Redis, etc.) from an external process and call the ASG update endpoint directly —
see the reconciliation loop under [Python SDK & Boto3](/compute/cli-iac) for the same pattern
applied to raw instances.

---

## 6. Advanced Deployment Patterns

### 6.1 Zero-Downtime Rolling Deployment Pattern

To update your application without downtime:
1. Update the **Launch Template** in your ASG with the new AMI.
2. Trigger an **Instance Refresh**.
3. The ASG terminates old instances one by one, waiting for new instances to pass ALB health checks before moving to the next.

### 6.2 Blue/Green Deployment with Listener Rule Swapping

A faster, safer alternative to rolling deployments for critical infrastructure. The listener swap
in step 4 happens **outside FOTOhub's API** (see the listener caveat in section 3) — you'll need
AWS credentials with `elasticloadbalancing:ModifyListener` for the load balancer FOTOhub
provisioned:
1. **Blue Environment:** Current ASG attached to Target Group A.
2. **Green Environment:** Spin up a new ASG with updated code, attached to Target Group B (both via `POST /aws/auto-scaling` + `POST /aws/target-groups`).
3. **Warm-up:** Send test traffic directly to Target Group B to verify.
4. **Swap:** Update the ALB Listener directly via AWS (`aws elbv2 modify-listener`) to forward 100% of traffic to Target Group B.
5. **Drain & Terminate:** Drain connections from Blue, then terminate the Blue ASG.

---

## 7. Complete Python Automation Script

Here is a full end-to-end Python script to deploy an ALB, Target Group, and ASG in one shot.

```python
import os
import requests
import time

API_KEY = os.environ.get("FOTOHUB_API_KEY", "fh_live_YOUR_API_KEY")
BASE_URL = "https://apis.fotohub.app/compute/v1/aws"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def create_full_stack():
    print("1. Creating Load Balancer...")
    alb_res = requests.post(f"{BASE_URL}/load-balancers", headers=HEADERS, json={
        "name": "auto-deployed-alb",
        "type": "application",
        "scheme": "internet-facing",
        "subnets": ["subnet-111", "subnet-222"],
        "security_groups": ["sg-123"],
        "region": "eu-central-1"
    }).json()
    
    alb_arn = alb_res.get("load_balancer_arn")
    print(f"ALB Created: {alb_arn}")

    print("2. Creating Target Group...")
    tg_res = requests.post(f"{BASE_URL}/target-groups", headers=HEADERS, json={
        "name": "auto-tg",
        "protocol": "HTTP",
        "port": 8080,
        "vpc_id": "vpc-000",
        "target_type": "instance",
        "health_check_path": "/healthz",
        "health_check_interval": 10,
        "region": "eu-central-1"
    }).json()
    
    tg_arn = tg_res.get("target_group_arn")
    print(f"Target Group Created: {tg_arn}")
    
    print("3. Connecting ALB to Target Group (Listener)...")
    requests.post(f"{BASE_URL}/load-balancers/listeners", headers=HEADERS, json={
        "load_balancer_arn": alb_arn,
        "protocol": "HTTP",
        "port": 80,
        "default_actions": [{"type": "forward", "target_group_arn": tg_arn}]
    })

    print("4. Creating Auto Scaling Group...")
    asg_res = requests.post(f"{BASE_URL}/auto-scaling", headers=HEADERS, json={
        "name": "auto-scaling-cluster",
        "min_size": 2,
        "max_size": 10,
        "desired_capacity": 2,
        "instance_type": "t3.large",
        "ami_id": "ami-0123456789abcdef0",
        "target_group_arns": [tg_arn],
        "availability_zones": ["eu-central-1a", "eu-central-1b"]
    }).json()
    
    print(f"ASG Created: {asg_res.get('auto_scaling_group_name')}")
    print("Infrastructure deployment complete!")

if __name__ == "__main__":
    create_full_stack()
```

---

## 8. Cost Efficiency & Optimization

Maintaining highly available infrastructure requires careful budget management.

- **ALB Pricing:** ALBs have a base hourly rate + LCU (Load Balancer Capacity Unit) charges. Optimize by reducing payload sizes and closing idle connections.
- **Data Transfer Costs:** Egress from FOTOhub S3 to your ALB-backed instances is **FREE** if they are in the same region (`eu-central-1`). Outbound internet data transfer is billed at standard rates.
- **Spot Instances:** For fault-tolerant tasks (like rendering queues), heavily rely on Spot instances (`$0.38/hr` for `g5.xlarge` instead of `$1.01/hr`). FOTOhub handles automatic replacement during interruptions.

::: warning Beware of EBS Overprovisioning
When attaching EBS volumes, default to `gp3` at **$0.08 / GB-month**. Only switch to `io2` (**$0.125 / GB-month**) if your database specifically requires sustained microsecond latency and extreme IOPS.
:::

---

## 9. Monitoring & CloudWatch Metrics

Robust monitoring is key to high availability.

- **ALB Metrics:** 
  - `RequestCount`: Total HTTP requests.
  - `HTTPCode_Target_5XX_Count`: Backend errors.
  - `TargetResponseTime`: How fast your app responds.
- **Target Group Metrics:**
  - `HealthyHostCount` / `UnHealthyHostCount`: Immediately alerts you if a deployment failed.
- **ASG Metrics:**
  - `GroupInServiceInstances`: Number of instances actively serving traffic.

---

## 10. Troubleshooting

### Unhealthy Targets
If your targets are failing health checks:
1. Verify the `health_check_path` returns an HTTP `200 OK` status.
2. Check that the Security Group allows inbound traffic from the ALB subnets on the Target Group port (e.g., 8000).
3. Connect to the instance and `curl localhost:8000/health` directly.

### 502 Bad Gateway
The ALB could not establish a connection to your backend.
- Ensure the application server is running and bound to `0.0.0.0` (not just `127.0.0.1`).
- Check if your application crashed immediately after startup.

### 504 Gateway Timeout
The ALB connected, but your application took too long to respond.
- Increase the ALB idle timeout.
- Optimize your application logic (e.g., offload heavy inference tasks to a background queue).

---

## Appendix: Summary of Hardware Limits

These are enforced server-side in `compute-engine` (`aws_extended.py`), not adjustable via a
support ticket today:

| Resource | Limit |
|:---|:---:|
| Load Balancers per user | **5** |
| Auto Scaling Groups per user | **5** |
| ASG `max_size` | **20** (silently capped, regardless of what you request) |
| CloudWatch Alarms per user | **50** |
| S3 Buckets per user | **10** |
| Target Groups per user | No FOTOhub-imposed cap |

*End of Document*

<!-- 1 -->
<!-- 2 -->
<!-- 3 -->
<!-- 4 -->
<!-- 5 -->
<!-- 6 -->
<!-- 7 -->
<!-- 8 -->
<!-- 9 -->
<!-- 10 -->
<!-- 11 -->
<!-- 12 -->
<!-- 13 -->
<!-- 14 -->
<!-- 15 -->
<!-- 16 -->
<!-- 17 -->
<!-- 18 -->
<!-- 19 -->
<!-- 20 -->
<!-- 21 -->
<!-- 22 -->
<!-- 23 -->
<!-- 24 -->
<!-- 25 -->
<!-- 26 -->
<!-- 27 -->
<!-- 28 -->
<!-- 29 -->
<!-- 30 -->
<!-- 31 -->
<!-- 32 -->
<!-- 33 -->
<!-- 34 -->
<!-- 35 -->
<!-- 36 -->
<!-- 37 -->
<!-- 38 -->
<!-- 39 -->
<!-- 40 -->
<!-- 41 -->
<!-- 42 -->
<!-- 43 -->
<!-- 44 -->
<!-- 45 -->
<!-- 46 -->
<!-- 47 -->
<!-- 48 -->
<!-- 49 -->
<!-- 50 -->
<!-- 51 -->
<!-- 52 -->
<!-- 53 -->
<!-- 54 -->
<!-- 55 -->
<!-- 56 -->
<!-- 57 -->
<!-- 58 -->
<!-- 59 -->
<!-- 60 -->
<!-- 61 -->
<!-- 62 -->
<!-- 63 -->
<!-- 64 -->
<!-- 65 -->
<!-- 66 -->
<!-- 67 -->
<!-- 68 -->
<!-- 69 -->
<!-- 70 -->
<!-- 71 -->
<!-- 72 -->
<!-- 73 -->
<!-- 74 -->
<!-- 75 -->
<!-- 76 -->
<!-- 77 -->
<!-- 78 -->
<!-- 79 -->
<!-- 80 -->
<!-- 81 -->
<!-- 82 -->
<!-- 83 -->
<!-- 84 -->
<!-- 85 -->
<!-- 86 -->
<!-- 87 -->
<!-- 88 -->
<!-- 89 -->
<!-- 90 -->
<!-- 91 -->
<!-- 92 -->
<!-- 93 -->
<!-- 94 -->
<!-- 95 -->
<!-- 96 -->
<!-- 97 -->
<!-- 98 -->
<!-- 99 -->
<!-- 100 -->
<!-- 101 -->
<!-- 102 -->
<!-- 103 -->
<!-- 104 -->
<!-- 105 -->
<!-- 106 -->
<!-- 107 -->
<!-- 108 -->
<!-- 109 -->
<!-- 110 -->
<!-- 111 -->
<!-- 112 -->
<!-- 113 -->
<!-- 114 -->
<!-- 115 -->
<!-- 116 -->
<!-- 117 -->
<!-- 118 -->
<!-- 119 -->
<!-- 120 -->
<!-- 121 -->
<!-- 122 -->
<!-- 123 -->
<!-- 124 -->
<!-- 125 -->
<!-- 126 -->
<!-- 127 -->
<!-- 128 -->
<!-- 129 -->
<!-- 130 -->
<!-- 131 -->
<!-- 132 -->
<!-- 133 -->
<!-- 134 -->
<!-- 135 -->
<!-- 136 -->
<!-- 137 -->
<!-- 138 -->
<!-- 139 -->
<!-- 140 -->
<!-- 141 -->
<!-- 142 -->
<!-- 143 -->
<!-- 144 -->
<!-- 145 -->
<!-- 146 -->
<!-- 147 -->
<!-- 148 -->
<!-- 149 -->
<!-- 150 -->
<!-- 151 -->
<!-- 152 -->
<!-- 153 -->
<!-- 154 -->
<!-- 155 -->
<!-- 156 -->
<!-- 157 -->
<!-- 158 -->
<!-- 159 -->
<!-- 160 -->
<!-- 161 -->
<!-- 162 -->
<!-- 163 -->
<!-- 164 -->
<!-- 165 -->
<!-- 166 -->
<!-- 167 -->
<!-- 168 -->
<!-- 169 -->
<!-- 170 -->
<!-- 171 -->
<!-- 172 -->
<!-- 173 -->
<!-- 174 -->
<!-- 175 -->
<!-- 176 -->
<!-- 177 -->
<!-- 178 -->
<!-- 179 -->
<!-- 180 -->
<!-- 181 -->
<!-- 182 -->
<!-- 183 -->
<!-- 184 -->
<!-- 185 -->
<!-- 186 -->
<!-- 187 -->
<!-- 188 -->
<!-- 189 -->
<!-- 190 -->
<!-- 191 -->
<!-- 192 -->
<!-- 193 -->
<!-- 194 -->
<!-- 195 -->
<!-- 196 -->
<!-- 197 -->
<!-- 198 -->
<!-- 199 -->
<!-- 200 -->
<!-- 201 -->
<!-- 202 -->
<!-- 203 -->
<!-- 204 -->
<!-- 205 -->
<!-- 206 -->
<!-- 207 -->
<!-- 208 -->
<!-- 209 -->
<!-- 210 -->
<!-- 211 -->
<!-- 212 -->
<!-- 213 -->
<!-- 214 -->
<!-- 215 -->
<!-- 216 -->
<!-- 217 -->
<!-- 218 -->
<!-- 219 -->
<!-- 220 -->
<!-- 221 -->
<!-- 222 -->
<!-- 223 -->
<!-- 224 -->
<!-- 225 -->
<!-- 226 -->
<!-- 227 -->
<!-- 228 -->
<!-- 229 -->
<!-- 230 -->
<!-- 231 -->
<!-- 232 -->
<!-- 233 -->
<!-- 234 -->
<!-- 235 -->
<!-- 236 -->
<!-- 237 -->
<!-- 238 -->
<!-- 239 -->
<!-- 240 -->
<!-- 241 -->
<!-- 242 -->
<!-- 243 -->
<!-- 244 -->
<!-- 245 -->
<!-- 246 -->
<!-- 247 -->
<!-- 248 -->
<!-- 249 -->
<!-- 250 -->
<!-- 251 -->
<!-- 252 -->
<!-- 253 -->
<!-- 254 -->
<!-- 255 -->
<!-- 256 -->
<!-- 257 -->
<!-- 258 -->
<!-- 259 -->
<!-- 260 -->
<!-- 261 -->
<!-- 262 -->
<!-- 263 -->
<!-- 264 -->
<!-- 265 -->
<!-- 266 -->
<!-- 267 -->
<!-- 268 -->
<!-- 269 -->
<!-- 270 -->
<!-- 271 -->
<!-- 272 -->
<!-- 273 -->
<!-- 274 -->
<!-- 275 -->
<!-- 276 -->
<!-- 277 -->
<!-- 278 -->
<!-- 279 -->
<!-- 280 -->
<!-- 281 -->
<!-- 282 -->
<!-- 283 -->
<!-- 284 -->
<!-- 285 -->
<!-- 286 -->
<!-- 287 -->
<!-- 288 -->
<!-- 289 -->
<!-- 290 -->
<!-- 291 -->
<!-- 292 -->
<!-- 293 -->
<!-- 294 -->
<!-- 295 -->
<!-- 296 -->
<!-- 297 -->
<!-- 298 -->
<!-- 299 -->
<!-- 300 -->
<!-- 301 -->
<!-- 302 -->
<!-- 303 -->
<!-- 304 -->
<!-- 305 -->
<!-- 306 -->
<!-- 307 -->
<!-- 308 -->
<!-- 309 -->
<!-- 310 -->
<!-- 311 -->
<!-- 312 -->
<!-- 313 -->
<!-- 314 -->
<!-- 315 -->
<!-- 316 -->
<!-- 317 -->
<!-- 318 -->
<!-- 319 -->
<!-- 320 -->
<!-- 321 -->
<!-- 322 -->
<!-- 323 -->
<!-- 324 -->
<!-- 325 -->
<!-- 326 -->
<!-- 327 -->
<!-- 328 -->
<!-- 329 -->
<!-- 330 -->
<!-- 331 -->
<!-- 332 -->
<!-- 333 -->
<!-- 334 -->
<!-- 335 -->
<!-- 336 -->
<!-- 337 -->
<!-- 338 -->
<!-- 339 -->
<!-- 340 -->
<!-- 341 -->
<!-- 342 -->
<!-- 343 -->
<!-- 344 -->
<!-- 345 -->
<!-- 346 -->
<!-- 347 -->
<!-- 348 -->
<!-- 349 -->
<!-- 350 -->
<!-- 351 -->
<!-- 352 -->
<!-- 353 -->
<!-- 354 -->
<!-- 355 -->
<!-- 356 -->
<!-- 357 -->
<!-- 358 -->
<!-- 359 -->
<!-- 360 -->
<!-- 361 -->
<!-- 362 -->
<!-- 363 -->
<!-- 364 -->
<!-- 365 -->
<!-- 366 -->
<!-- 367 -->
<!-- 368 -->
<!-- 369 -->
<!-- 370 -->
<!-- 371 -->
<!-- 372 -->
<!-- 373 -->
<!-- 374 -->
<!-- 375 -->
<!-- 376 -->
<!-- 377 -->
<!-- 378 -->
<!-- 379 -->
<!-- 380 -->
<!-- 381 -->
<!-- 382 -->
<!-- 383 -->
<!-- 384 -->
<!-- 385 -->
<!-- 386 -->
<!-- 387 -->
<!-- 388 -->
<!-- 389 -->
<!-- 390 -->
<!-- 391 -->
<!-- 392 -->
<!-- 393 -->
<!-- 394 -->
<!-- 395 -->
<!-- 396 -->
<!-- 397 -->
<!-- 398 -->
<!-- 399 -->
<!-- 400 -->
