# Practical Sandboxes & MicroVM Recipes

Copy-paste ready, production-grade recipes for executing untrusted user code, statistical data pipelines, dynamic chart rendering, and automated file analysis inside isolated FOTOhub Firecracker microVMs.

All recipes execute via `POST /sandbox/exec-python` or `POST /sandbox/exec-bash` and return structured JSON in under **200 milliseconds**.

---

## Recipe Index

1. **[Untrusted Pandas Data Cleaning & Aggregation](#recipe-1-untrusted-pandas-data-cleaning--aggregation)**
2. **[Dynamic Matplotlib & Seaborn Chart Visualizer](#recipe-2-dynamic-matplotlib-chart-generator)**
3. **[PDF & Invoice Field Extraction with Regex](#recipe-3-pdf--invoice-field-extraction)**
4. **[Safe Python AST Code Linter & Security Audit](#recipe-4-safe-python-ast-code-linter)**
5. **[Automated PyTest Unit Runner for Candidate Code](#recipe-5-automated-pytest-unit-runner)**
6. **[HTML Web Intelligence & Table Parser](#recipe-6-html-web-intelligence--table-parser)**
7. **[Audio Spectrogram & Metadata Analyzer](#recipe-7-audio-spectrogram--metadata-analyzer)**
8. **[Multi-File Workspace Execution & Import](#recipe-8-multi-file-workspace-execution--import)**

---

## Recipe 1: Untrusted Pandas Data Cleaning & Aggregation

Safely compute summary statistics, filter rows, and calculate grouped aggregations on user-supplied CSV data without exposing host memory.

### Python SDK Implementation

```python
from fotohub import FotoHub
import os

client = FotoHub(api_key=os.environ["FOTOHUB_API_KEY"])

csv_data = """employee_id,department,salary,rating
101,Engineering,115000,4.8
102,Sales,85000,4.2
103,Engineering,135000,4.9
104,Marketing,78000,3.9
105,Engineering,98000,4.1
106,Sales,92000,4.6
"""

user_code = """
import pandas as pd
import io

df = pd.read_csv(io.StringIO(input['csv_content']))

# Perform aggregations
grouped = df.groupby('department').agg(
    headcount=('employee_id', 'count'),
    mean_salary=('salary', 'mean'),
    median_rating=('rating', 'median')
).reset_index()

# Format clean dictionary output
result = {
    "summary": grouped.to_dict(orient='records'),
    "top_earner_dept": str(grouped.loc[grouped['mean_salary'].idxmax()]['department']),
    "total_payroll": int(df['salary'].sum())
}
"""

response = client.post("/sandbox/exec-python", {
    "code": user_code,
    "input": {"csv_content": csv_data},
    "timeout_s": 10,
    "memory_mb": 512
})

print("Aggregated Output:", response["value"])
print(f"Executed in {response['duration_ms']}ms")
```

### Expected Response

```json
{
  "ok": true,
  "value": {
    "summary": [
      {"department": "Engineering", "headcount": 3, "mean_salary": 116000.0, "median_rating": 4.8},
      {"department": "Marketing", "headcount": 1, "mean_salary": 78000.0, "median_rating": 3.9},
      {"department": "Sales", "headcount": 2, "mean_salary": 88500.0, "median_rating": 4.4}
    ],
    "top_earner_dept": "Engineering",
    "total_payroll": 603000
  },
  "stdout": "",
  "stderr": "",
  "duration_ms": 146
}
```

---

## Recipe 2: Dynamic Matplotlib Chart Generator

Render publication-quality charts (bar, line, scatter) in-memory inside the sandbox and return the image as a Base64-encoded PNG or raw SVG.

::: code-group

```python [Python]
from fotohub import FotoHub
import base64
import os

client = FotoHub(api_key=os.environ["FOTOHUB_API_KEY"])

chart_code = """
import matplotlib
matplotlib.use('Agg')  # Headless backend
import matplotlib.pyplot as plt
import numpy as np
import io
import base64

labels = input['labels']
values = input['values']
title = input.get('title', 'Metric Distribution')

fig, ax = plt.subplots(figsize=(8, 4.5), dpi=150)
colors = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
bars = ax.bar(labels, values, color=colors[:len(labels)], edgecolor='none', width=0.55)

ax.set_title(title, fontsize=14, pad=15, weight='bold', color='#111827')
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.yaxis.grid(True, linestyle='--', alpha=0.5)

# Save buffer
buf = io.BytesIO()
plt.tight_layout()
plt.savefig(buf, format='png', bbox_inches='tight')
buf.seek(0)

# Return base64 string
result = {
    "mime": "image/png",
    "base64": base64.b64encode(buf.getvalue()).decode('utf-8')
}
"""

payload = {
    "code": chart_code,
    "input": {
        "title": "Quarterly AI Inference Workload (GPU Hours)",
        "labels": ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"],
        "values": [1240, 2890, 5410, 9820]
    },
    "timeout_s": 15
}

res = client.post("/sandbox/exec-python", payload)

# Decode image to disk
img_bytes = base64.b64decode(res["value"]["base64"])
with open("quarterly_workload.png", "wb") as f:
    f.write(img_bytes)

print("Chart saved! Generated in:", res["duration_ms"], "ms")
```

```typescript [TypeScript]
import { FotoHub } from "fotohub";
import fs from "fs/promises";

const client = new FotoHub({ apiKey: process.env.FOTOHUB_API_KEY! });

async function generateChart() {
  const code = `
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io, base64

fig, ax = plt.subplots(figsize=(6, 4))
ax.plot(input['x'], input['y'], color='#7c3aed', linewidth=2.5, marker='o')
ax.set_title('Loss Curve Over Epochs')
ax.grid(True, alpha=0.3)

buf = io.BytesIO()
plt.savefig(buf, format='png', bbox_inches='tight')
result = {"base64": base64.b64encode(buf.getvalue()).decode('utf-8')}
`;

  const res = await client.post("/sandbox/exec-python", {
    code,
    input: {
      x: [1, 2, 3, 4, 5],
      y: [0.82, 0.45, 0.28, 0.19, 0.12],
    },
    timeout_s: 15,
  });

  const buffer = Buffer.from(res.data.value.base64, "base64");
  await fs.writeFile("loss_curve.png", buffer);
  console.log("Chart rendered in", res.data.duration_ms, "ms");
}

generateChart();
```

:::

---

## Recipe 3: PDF & Invoice Field Extraction

Extract line items, tax rates, vendor names, and totals from unstructured text inside an isolated sandbox.

```python
invoice_raw_text = """
ACME Cloud Services Inc.
Invoice #INV-2026-8942
Date: August 28, 2026

Bill To: FOTOhub Media Sp. z o.o.
VAT ID: PL5252812345

Items:
1. Dedicated GPU Cluster (A10G)       - $380.00
2. NVMe Storage Pool (500GB)          - $40.00
3. Elastic Network Interface (Route53) - $15.00

Subtotal: $435.00
Tax (VAT 23%): $100.05
Total Due: $535.05 USD
"""

parse_code = """
import re

text = input['raw_text']

invoice_no = re.search(r'Invoice\s*#([A-Z0-9-]+)', text)
date_str = re.search(r'Date:\s*([A-Za-z0-9,\s]+)', text)
total_due = re.search(r'Total Due:\s*\$([0-9.,]+)', text)
vat_id = re.search(r'VAT ID:\s*([A-Z0-9]+)', text)

# Extract item rows
item_matches = re.findall(r'\d+\.\s+(.+?)\s+-\s+\$([0-9.,]+)', text)
items = [{"description": desc.strip(), "amount_usd": float(price)} for desc, price in item_matches]

result = {
    "invoice_number": invoice_no.group(1) if invoice_no else None,
    "invoice_date": date_str.group(1).strip() if date_str else None,
    "vat_id": vat_id.group(1) if vat_id else None,
    "items": items,
    "total_usd": float(total_due.group(1)) if total_due else 0.0
}
"""

response = client.post("/sandbox/exec-python", {
    "code": parse_code,
    "input": {"raw_text": invoice_raw_text}
})

print("Parsed Invoice:", response["value"])
```

---

## Recipe 4: Safe Python AST Code Linter

Before running arbitrary user code in your production application, parse its Abstract Syntax Tree (AST) inside a sandbox to detect dangerous calls (`__import__`, `eval`, `subprocess`, socket manipulation, file overwriting):

```python
linter_code = """
import ast

untrusted_code = input['code']
tree = ast.parse(untrusted_code)

BANNED_MODULES = {'socket', 'subprocess', 'pty', 'shutil', 'os'}
BANNED_FUNCS = {'eval', 'exec', 'compile', '__import__'}

violations = []

for node in ast.walk(tree):
    # Check imports
    if isinstance(node, ast.Import):
        for alias in node.names:
            if alias.name in BANNED_MODULES:
                violations.append(f"Forbidden import: {alias.name} at line {node.lineno}")
    elif isinstance(node, ast.ImportFrom):
        if node.module in BANNED_MODULES:
            violations.append(f"Forbidden from-import: {node.module} at line {node.lineno}")
    # Check calls
    elif isinstance(node, ast.Call):
        if isinstance(node.func, ast.Name) and node.func.id in BANNED_FUNCS:
            violations.append(f"Forbidden function call: {node.func.id}() at line {node.lineno}")

result = {
    "is_safe": len(violations) == 0,
    "violations": violations
}
"""

response = client.post("/sandbox/exec-python", {
    "code": linter_code,
    "input": {"code": "import os\nos.system('rm -rf /')"}
})

print(response["value"])
# Output: {'is_safe': False, 'violations': ['Forbidden import: os at line 1']}
```

---

## Recipe 5: Automated PyTest Unit Runner

Evaluate student assignments, job candidate submissions, or AI-generated code against a test suite in an isolated environment:

```python
test_suite_code = """
# Solution submitted by user
solution_code = input['solution']

# Complete script with unit tests
test_script = f"""
import unittest

{solution_code}

class TestSolution(unittest.TestCase):
    def test_basic_reversal(self):
        self.assertEqual(reverse_words("the sky is blue"), "blue is sky the")
        
    def test_multiple_spaces(self):
        self.assertEqual(reverse_words("  hello   world  "), "world hello")
        
    def test_single_word(self):
        self.assertEqual(reverse_words("fotohub"), "fotohub")

suite = unittest.TestLoader().loadTestsFromTestCase(TestSolution)
runner = unittest.TextTestRunner(verbosity=0)
run_result = runner.run(suite)

result = {
    "tests_run": run_result.testsRun,
    "passed": run_result.wasSuccessful(),
    "failures": len(run_result.failures),
    "errors": len(run_result.errors)
}
"""

exec(test_script, globals())
"""

submission = """
def reverse_words(s: str) -> str:
    return " ".join(s.strip().split()[::-1])
"""

response = client.post("/sandbox/exec-python", {
    "code": test_suite_code,
    "input": {"solution": submission}
})

print("Grading Result:", response["value"])
# Output: {'tests_run': 3, 'passed': True, 'failures': 0, 'errors': 0}
```

---

## Recipe 6: HTML Web Intelligence & Table Parser

Extract tabular data from complex web HTML using BeautifulSoup without installing dependencies on your host server:

```python
html_doc = """
<table class="market-data">
  <thead><tr><th>Ticker</th><th>Price</th><th>Change</th></tr></thead>
  <tbody>
    <tr><td>NVDA</td><td>$124.50</td><td>+4.2%</td></tr>
    <tr><td>AAPL</td><td>$228.10</td><td>-0.8%</td></tr>
    <tr><td>MSFT</td><td>$445.20</td><td>+1.1%</td></tr>
  </tbody>
</table>
"""

scraper_code = """
from bs4 import BeautifulSoup

soup = BeautifulSoup(input['html'], 'html.parser')
rows = []
for tr in soup.select('table.market-data tbody tr'):
    cols = [td.get_text(strip=True) for td in tr.find_all('td')]
    if len(cols) == 3:
        rows.append({
            "ticker": cols[0],
            "price_usd": float(cols[1].replace('$', '')),
            "pct_change": float(cols[2].replace('%', ''))
        })

result = {"rows": rows, "count": len(rows)}
"""

response = client.post("/sandbox/exec-python", {
    "code": scraper_code,
    "input": {"html": html_doc}
})

print("Extracted Market Data:", response["value"])
```

---

## Recipe 7: Audio Spectrogram & Metadata Analyzer

Analyze WAV/MP3 files for audio energy levels, duration, and silence intervals inside the sandbox:

```python
audio_code = """
import numpy as np
import io

# Assume input provides raw audio PCM samples
samples = np.array(input['pcm_samples'], dtype=np.float32)
sample_rate = input.get('sample_rate', 16000)

duration_sec = len(samples) / sample_rate
rms_energy = float(np.sqrt(np.mean(samples**2)))
peak_amplitude = float(np.max(np.abs(samples)))

# Detect clipping
is_clipping = peak_amplitude >= 0.99

result = {
    "duration_seconds": round(duration_sec, 2),
    "rms_energy": round(rms_energy, 4),
    "peak_amplitude": round(peak_amplitude, 4),
    "is_clipping": is_clipping
}
"""

# Test with synthetic sine wave
t = np.linspace(0, 3, 16000 * 3)
sine_wave = (0.75 * np.sin(2 * np.pi * 440 * t)).tolist()

response = client.post("/sandbox/exec-python", {
    "code": audio_code,
    "input": {"pcm_samples": sine_wave[:10000], "sample_rate": 16000}
})

print("Audio Analysis:", response["value"])
```

---

## Recipe 8: Multi-File Workspace Execution & Import

Write helper modules and assets to `/sandbox/workspace`, then import them cleanly:

```bash
# 1. Write helper module to workspace
curl -X POST https://apis.fotohub.app/sandbox/workspace/upload \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -F "file=@utils.py" \
  -F "destination=/sandbox/workspace/utils.py"

# 2. Execute main script that imports the helper module
curl -X POST https://apis.fotohub.app/sandbox/exec-python \
  -H "Authorization: Bearer $FOTOHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import sys; sys.path.append(\"/sandbox/workspace\"); import utils; result = utils.calculate_metrics()",
    "timeout_s": 15
  }'
```\n