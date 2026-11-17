
import json
from pathlib import Path

path = Path("data/evaluation/batch/editorial-evaluations.json")

with path.open("r", encoding="utf-8") as f:
    records = json.load(f)

print("Total records:", len(records))

for i, record in enumerate(records, 1):
    print(f"\n--- Record {i} ---")
    print("Top-level keys:", list(record.keys()))

    print("Candidate ID:",
          record.get("candidate", {}).get("candidate_id"))

    print("Evaluation status:",
          record.get("evaluation_status"))

    print("Error:",
          record.get("error"))

    evaluation = record.get("evaluation")

    if isinstance(evaluation, dict):
        print("Evaluation keys:", list(evaluation.keys()))

        for dimension in [
            "hook_strength",
            "emotional_intensity",
            "curiosity_gap",
            "standalone_readability",
            "spoiler_safety",
        ]:
            item = evaluation.get(dimension, {})
            if isinstance(item, dict):
                print(
                    dimension,
                    "score:", item.get("score"),
                    "evidence:", item.get("evidence_segment_ids")
                )

    print("Other fields:",
          {k: v for k, v in record.items()
           if k not in ["candidate", "evaluation"]})
 