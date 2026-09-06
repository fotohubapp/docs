---
outline: deep
title: Load Balancing & Autoscaling
description: Complete guide to Application Load Balancers, Auto Scaling Groups, and high-availability cluster deployments on FOTOhub.
---

# Application Load Balancers & Auto Scaling Clusters

Deploy highly available, fault-tolerant GPU and CPU clusters in **Frankfurt (`eu-central-1`)** with automated health checks, dynamic scale-out policies, and Application Load Balancers (ALB).

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
        
        CW["CloudWatch GPU / CPU Alarm (>80% Utilization)"]
    end

    Users --> DNS --> ALB
    ALB -->|Health Checks / Round-Robin| TG
    TG --> Node1 & Node2 & Node3
    Node1 & Node2 & Node3 -.->|Metrics| CW
    CW -.->|Trigger Scale-Out (+1 Node)| TG
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
Need secure, isolated environment execution without managing VMs? Check out our Firecracker Sandbox API at `https://apis.fotohub.app/sandbox/exec-python` for serverless python execution.
:::

---

## 3. Complete ALB Setup Guide

Setting up an Application Load Balancer requires a sequence of API calls. You must:
1. Provision the **Load Balancer**
2. Create a **Target Group**
3. Configure **Listener Rules**
4. Register **Instances** (or attach to an ASG)
5. Add **Health Checks**

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
  "load_balancer_arn": "arn:aws:elasticloadbalancing:eu-central-1:123456789:loadbalancer/app/prod-inference-alb/50dc6c495c0c9188",
  "dns_name": "prod-inference-alb-123456789.eu-central-1.elb.amazonaws.com",
  "status": "provisioning",
  "created_at": "2023-10-15T12:00:00Z",
  "type": "application",
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
  "target_group_arn": "arn:aws:elasticloadbalancing:eu-central-1:123456789:targetgroup/vllm-cluster-tg/60dc6c495c0c9199",
  "name": "vllm-cluster-tg",
  "protocol": "HTTP",
  "port": 8000,
  "vpc_id": "vpc-0a12f94b8",
  "health_check_path": "/health",
  "health_check_interval": 15,
  "target_type": "instance"
}
```

### Step 3.3: Register Instances to Target Group

If you are not using an ASG, you can manually register EC2 instances.

**Endpoint:** `POST /aws/target-groups/register`

::: code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/aws/target-groups/register \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "target_group_arn": "arn:aws:elasticloadbalancing:...:targetgroup/vllm-cluster-tg/...",
    "targets": [
      { "id": "i-098234abcf", "port": 8000 },
      { "id": "i-098234abcd", "port": 8000 }
    ]
  }'
```
:::

#### Register Targets JSON Response Schema

```json
{
  "success": true,
  "registered_targets": [
    { "id": "i-098234abcf", "status": "initial" },
    { "id": "i-098234abcd", "status": "initial" }
  ]
}
```

### Step 3.4: Configure Listener Rules

Connect your Target Group to your Load Balancer by adding a listener on port 80 or 443.

**Endpoint:** `POST /aws/load-balancers/listeners`

```json
// POST Payload
{
  "load_balancer_arn": "arn:aws:elasticloadbalancing:eu-central-1:123456789:loadbalancer/app/prod-inference-alb/50dc6c495c0c9188",
  "protocol": "HTTP",
  "port": 80,
  "default_actions": [
    {
      "type": "forward",
      "target_group_arn": "arn:aws:elasticloadbalancing:eu-central-1:123456789:targetgroup/vllm-cluster-tg/60dc6c495c0c9199"
    }
  ]
}
```

---

## 4. Auto Scaling Groups (ASG)

Auto Scaling Groups dynamically scale your worker pool based on traffic demands while maintaining a minimum warm capacity. They use Launch Templates to define the instance configuration.

### Provisioning an ASG

**Endpoint:** `POST /aws/auto-scaling`

| Parameter | Type | Required | Default | Description |
|:---|:---|:---:|:---:|:---|
| `name` | string | **Yes** | — | Unique name for the Auto Scaling Group. |
| `min_size` | integer | **Yes** | `1` | Minimum number of running instances. |
| `max_size` | integer | **Yes** | `5` | Upper ceiling to prevent runaway billing. |
| `desired_capacity` | integer | **Yes** | `1` | Initial targeted number of instances. |
| `instance_type` | string | **Yes** | — | Catalog ID (e.g. `g5.xlarge`, `c5.2xlarge`). |
| `ami_id` | string | **Yes** | — | Base Golden AMI ID pre-configured with models. |
| `target_group_arns`| array | **Yes** | `[]` | ARNs of target groups to register new nodes to. |
| `availability_zones`| array | No | `["eu-central-1a", "eu-central-1b"]` | Multi-AZ redundancy distribution. |

::: code-group
```bash [cURL]
curl -X POST https://apis.fotohub.app/compute/v1/aws/auto-scaling \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "qwen-inference-asg",
    "min_size": 1,
    "max_size": 6,
    "desired_capacity": 2,
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
  "auto_scaling_group_name": "qwen-inference-asg",
  "auto_scaling_group_arn": "arn:aws:autoscaling:eu-central-1:123456789:autoScalingGroup:1234-5678:autoScalingGroupName/qwen-inference-asg",
  "min_size": 1,
  "max_size": 6,
  "desired_capacity": 2,
  "status": "provisioning"
}
```

---

## 5. Scaling Policies & CloudWatch Alarms

Scaling policies define *how* and *when* your ASG scales.

### 5.1 CloudWatch Alarm Triggers

Attach metrics alarms that trigger scaling actions automatically. For example, if CPU usage exceeds 80%, scale out. If it drops below 20%, scale in.

**Endpoint:** `POST /aws/alarms`

::: code-group
```bash [Scale-Out Alarm]
curl -X POST https://apis.fotohub.app/compute/v1/aws/alarms \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "alarm_name": "HighCPU-ScaleOut",
    "metric": "CPUUtilization",
    "threshold": 80.0,
    "comparison": "GreaterThanThreshold",
    "statistic": "Average",
    "period": 300,
    "evaluation_periods": 2,
    "action_arn": "arn:aws:autoscaling:...:scale-out-policy"
  }'
```

```bash [Scale-In Alarm]
curl -X POST https://apis.fotohub.app/compute/v1/aws/alarms \
  -H "Authorization: Bearer fh_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "alarm_name": "LowCPU-ScaleIn",
    "metric": "CPUUtilization",
    "threshold": 20.0,
    "comparison": "LessThanThreshold",
    "statistic": "Average",
    "period": 300,
    "evaluation_periods": 2,
    "action_arn": "arn:aws:autoscaling:...:scale-in-policy"
  }'
```
:::

#### Alarm JSON Response Schema

```json
{
  "alarm_arn": "arn:aws:cloudwatch:eu-central-1:123456789:alarm:HighCPU-ScaleOut",
  "alarm_name": "HighCPU-ScaleOut",
  "status": "created"
}
```

### 5.2 Target Tracking vs Step Scaling vs Scheduled Scaling

FOTOhub supports multiple scaling strategies:

- **Target Tracking Scaling:** The easiest approach. You set a target metric (e.g., maintain 50% CPU utilization). The ASG automatically calculates the adjustments needed.
- **Step Scaling:** Define specific steps. E.g., if CPU > 70%, add 1 instance; if CPU > 90%, add 3 instances. Best for bursty workloads.
- **Scheduled Scaling:** Pre-warm your cluster based on time. If traffic always spikes at 9 AM CET, schedule the desired capacity to increase at 8:45 AM CET.

### 5.3 GPU Cluster Auto-Scaling by Queue Depth

For ML inference, CPU isn't always the best metric. Instead, use a custom metric tracking the number of requests in your message queue (e.g., SQS or Redis).

You can scale from 0 to N `g5.xlarge` instances by pushing a custom CloudWatch metric for `QueueDepth` and setting a Target Tracking Policy of 10 requests per instance.

---

## 6. Advanced Deployment Patterns

### 6.1 Zero-Downtime Rolling Deployment Pattern

To update your application without downtime:
1. Update the **Launch Template** in your ASG with the new AMI.
2. Trigger an **Instance Refresh**.
3. The ASG terminates old instances one by one, waiting for new instances to pass ALB health checks before moving to the next.

### 6.2 Blue/Green Deployment with Listener Rule Swapping

A faster, safer alternative to rolling deployments for critical infrastructure:
1. **Blue Environment:** Current ASG attached to Target Group A.
2. **Green Environment:** Spin up a new ASG with updated code, attached to Target Group B.
3. **Warm-up:** Send test traffic directly to Target Group B to verify.
4. **Swap:** Update the ALB Listener Rule to forward 100% of traffic to Target Group B.
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

| Resource | Default Limit | Request Increase |
|:---|:---:|:---:|
| ALB per Region | 50 | Support Ticket |
| Target Groups | 100 | Support Ticket |
| ASG Max Size | 500 nodes | Account Rep |
| G5 / G4dn Quota | 20 vCPUs | Pre-pay $100 |

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
