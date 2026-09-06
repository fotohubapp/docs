# Production Runbook & Troubleshooting

Operational diagnostics for debugging GPU out-of-memory errors, spot interruptions, disk space saturation, network firewalls, and sandbox execution timeouts.

---

## Diagnostic Quick-Reference Matrix

| Error Symptom | Root Cause | First Diagnostic Step | Immediate Remediation |
|:---|:---|:---|:---|
| **`torch.cuda.OutOfMemoryError`** | VRAM exhausted during model load or KV-cache growth | Run `nvidia-smi` | Enable `--enforce-eager`, reduce batch size, or switch to AWQ 4-bit |
| **Instance terminated unexpectedly** | Spot capacity reclaimed by AWS or empty wallet balance | Query `GET /instances/{id}/status-checks` | Maintain minimum $5.00 wallet balance or launch in alternate AZ |
| **`Permission denied (publickey)`** | Private key file has loose permissions or wrong user | Check `ls -l worker_key.pem` | Run `chmod 400 worker_key.pem`; ensure SSH user is `ubuntu` |
| **`No space left on device`** | Root partition saturated by Hugging Face cache | Run `df -h` | Use `PUT /volumes/{id}` to hot-resize disk, then `resize2fs` |
| **Port 8000 / 8188 Unreachable** | Inbound security group firewall rule missing | Inspect `GET /instances/{id}/full` | Add inbound TCP rule via `POST /instances/{id}/security-rules` |
| **Sandbox Execution Timeout** | Code exceeded `timeout_s` wall clock limit | Inspect `error` in response JSON | Increase `timeout_s` (max 120s) or vectorize Python loop |
| **Vsock Connection Refused (9999)** | MicroVM guest execution daemon failed to boot | Inspect host kernel logs | Check dmesg for KVM virtualization errors; daemon auto-restarts |
| **NVIDIA Driver Not Found** | Linux kernel updated without dkms driver rebuild | Run `nvidia-smi` | Run `sudo apt-get install --reinstall nvidia-dkms-550` |
| **SSH Host Key Verification Failed** | Replaced instance reused the same Elastic IP | Inspect `~/.ssh/known_hosts` | Run `ssh-keygen -R <INSTANCE_IP>` |
| **EBS Volume Stuck in `attaching`** | NVMe device naming collision or AWS controller lock | Inspect AWS volume state | Detach volume via API, wait 10s, and re-attach |

---

## 1. Resolving CUDA Out of Memory (OOM)

When PyTorch throws `torch.cuda.OutOfMemoryError: CUDA out of memory`:

### Immediate Checks via SSH
```bash
# Check current VRAM allocation and active PID processes
nvidia-smi

# Inspect kernel logs for Linux OOM-killer interventions
sudo dmesg -T | grep -E -i "oom|killed process"
```

### Remediation Playbook
1. **Enable Gradient Checkpointing**: Reduces activation memory by ~60% during training at a cost of ~20% slower compute.
2. **Switch to 8-Bit Optimizers**: In training scripts, replace `AdamW` with `AdamW8bit` (`bitsandbytes`).
3. **Configure vLLM Memory Bounds**: Launch with `--gpu-memory-utilization 0.90` and `--max-model-len 16384`.
4. **Quantize Weights**: Run models in 4-bit (AWQ or GPTQ) instead of full 16-bit float.

---

## 2. Handling Spot Interruptions Gracefully

AWS Spot instances receive a **2-minute warning metadata notification** before termination.

### Production Interruption Daemon
Run this lightweight bash daemon in the background of long-running batch workers:

```bash
#!/bin/bash
while true; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://169.254.169.254/latest/meta-data/spot/instance-action)
  if [ "$HTTP_CODE" = "200" ]; then
    echo "SPOT INTERRUPTION NOTICE RECEIVED!"
    # 1. Flush training checkpoints to persistent EBS disk
    sync
    # 2. Notify central API / webhook
    curl -X POST https://api.yourdomain.com/worker-interrupted -d '{"worker_id": "'$(hostname)'"}'
    exit 0
  fi
  sleep 5
done
```

---

## 3. Resolving SSH Connection Failures

### 1. File Permissions
SSH strictly rejects private keys with open read permissions:
```bash
chmod 400 worker_key.pem
```

### 2. Verify Username
Always connect using the `ubuntu` default user:
```bash
ssh -i worker_key.pem ubuntu@<INSTANCE_PUBLIC_IP>
```

### 3. Inspect Cloud-Init Boot Logs
If the machine does not accept SSH after 60 seconds, inspect the serial console:
```bash
curl -X GET https://apis.fotohub.app/compute/v1/instances/inst_90f23b/logs?lines=100 \
  -H "Authorization: Bearer $FOTOHUB_API_KEY"
```

---

## 4. Expanding EBS Disk Capacity Live (Zero Downtime)

When disk space runs out during large model checkpoint downloads:

```bash
# 1. Expand volume size to 250 GB via API
curl -X PUT https://apis.fotohub.app/compute/v1/instances/inst_90f23b/volumes/vol-0a812df934 \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"size_gb": 250, "type": "gp3"}'

# 2. SSH into instance and grow partition
sudo growpart /dev/nvme0n1 1

# 3. Resize ext4 filesystem online
sudo resize2fs /dev/nvme0n1p1

# 4. Verify new capacity
df -h /
```

---

## 5. Debugging Firecracker Sandbox Timeouts

When `POST /sandbox/exec-python` returns `"error": "Execution timed out"`:

1. **Verify Vectorization**: Ensure Python code is not executing slow nested loops over large datasets. Use `numpy` or `pandas` vectorized primitives.
2. **Increase `timeout_s`**: The default timeout is 30 seconds. Increase up to 120 seconds:
   ```json
   {
     "code": "...",
     "timeout_s": 90
   }
   ```
3. **Inspect Sandbox Memory Limits**: If memory exceeds `memory_mb`, the process will be terminated by Linux cgroups. Increase `memory_mb` up to `2048`.\n