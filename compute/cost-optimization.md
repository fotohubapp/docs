# Compute Cost Optimization & Spot Strategies

Architectural patterns to reduce GPU and CPU infrastructure costs by up to 75% without sacrificing reliability.

---

## The 4 Pillars of Compute Cost Efficiency

```mermaid
flowchart LR
    A["1. Spot Fleets"] -->|60-70% savings| E["Optimized Compute Spend"]
    B["2. Hard Runtime Caps"] -->|Zero idle waste| E
    C["3. Snapshot & Terminate"] -->|Storage vs compute| E
    D["4. Firecracker for Code"] -->|Sub-cent execution| E
```

---

## 1. Spot Instance Fleet Strategies

Spot instances utilize spare EC2 capacity at steep discounts (typically 60–65% less than on-demand rates).

### When to Use Spot Instances
- **Batch Video Rendering & Upscaling**: If a spot instance is reclaimed, jobs can automatically resume from the last completed clip.
- **Model Fine-Tuning with Frequent Checkpoints**: Save weights to an attached EBS persistent volume every 200 steps.
- **Development & Experimentation Environments**: Running ComfyUI or exploring new prompts interactively.

### When to Use Dedicated On-Demand Instances
- **Production API Gateways**: Webhooks and real-time customer-facing inference that cannot tolerate a 2-minute interruption notice.
- **Live Event Broadcasting**: Real-time video processing or interactive voice agents.

### Cost Comparison Table (Monthly Spend: 8h/day, 22 days/mo)

| Workload | Hardware | On-Demand Cost | Spot Fleet Cost | Monthly Savings |
|:---|:---|:---:|:---:|:---:|
| **ComfyUI Pro Studio** | `g5.xlarge` (A10G 24GB) | $178.11 | **$67.40** | **$110.71 (62%)** |
| **vLLM 7B Inference** | `g5.2xlarge` (A10G 24GB) | $211.20 | **$79.20** | **$132.00 (63%)** |
| **Speech & Audio Worker** | `g4dn.xlarge` (T4 16GB) | $93.28 | **$35.20** | **$58.08 (62%)** |
| **High-Throughput Transcoder**| `c5.2xlarge` (8 vCPU) | $60.01 | **$22.35** | **$37.66 (63%)** |

---

## 2. Hard Runtime Caps (`max_runtime_hours`)

One of the most frequent causes of cloud overspending is forgotten developer instances left running over weekends.

FOTOhub enforces an mandatory `max_runtime_hours` parameter (default `24`, range `1` to `720` hours). The backend daemon polls instance status every 5 seconds; as soon as `elapsed_runtime >= max_runtime_hours`, the instance automatically transitions to `stopping`:

```json
{
  "name": "experimental-lora-train",
  "catalog_id": "g5.xlarge",
  "spot_instance": true,
  "max_runtime_hours": 3
}
```

*Result:* Even if a developer walks away after triggering a fine-tuning job, the machine terminates after 3 hours, capping maximum spend at ~$1.14.

---

## 3. The "Snapshot & Terminate" Pattern

Keeping an idle GPU instance running costs $0.38 – $1.61 per hour just for the compute allocation.

Instead of keeping instances running overnight, use the **Snapshot & Terminate** pattern:

```mermaid
flowchart TD
    A["Active Work Session Finished"] --> B["1. Create Snapshot of EBS Data Disk"]
    B --> C["2. Terminate EC2 Instance ($0.00/hr compute)"]
    C --> D["Disk preserved in AWS S3 ($0.05/GB-mo)"]
    D --> E["Next Morning: Spin up new Spot instance from snapshot"]
```

### Cost Comparison
- **Leaving A10G running idle over weekend (60 hours):**
  $$60 \text{ hours} \times \$0.38 = \mathbf{\$22.80}$$
- **Snapshotting 100 GB disk and terminating:**
  $$100 \text{ GB} \times \frac{\$0.05}{730 \text{ hrs}} \times 60 \text{ hrs} = \mathbf{\$0.41}$$
- **Total Weekend Savings:** **98.2%**

---

## 4. Firecracker microVMs for Script Execution

Never provision a full EC2 virtual machine just to run a 5-second Python data transformation or mathematical script.

Use the Firecracker sandbox API (`POST /sandbox/exec-python`):
- **Cost:** Fraction of a cent per execution.
- **Startup:** Booted in under 200 milliseconds.
- **Resource limit:** Up to 2,048 MB RAM and 60 seconds CPU timeout.
- **Security:** Hardware KVM hypervisor isolation.
