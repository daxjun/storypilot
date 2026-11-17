
import json
from pathlib import Path

folder = Path("data/evaluation/batch")

files = [
    "dataset-summary.json",
    "all-shortlisted-candidates.json",
    "top-50-candidates.json",
    "editorial-evaluations.json",
]

for filename in files:
    path = folder / filename
    print(f"\n{'=' * 60}")
    print(filename)

    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    print("Type:", type(data).__name__)

    if isinstance(data, dict):
        print("Keys:", list(data.keys()))
    elif isinstance(data, list):
        print("Number of records:", len(data))

    print("\nSample:")
    print(json.dumps(data[:1] if isinstance(data, list) else data, indent=2)[:2500])
