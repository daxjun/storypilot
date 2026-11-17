
import json
from collections import defaultdict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_FILE = (
    BASE_DIR
    / "data"
    / "evaluation"
    / "batch"
    / "all-shortlisted-candidates.json"
)

OUTPUT_DIR = BASE_DIR / "data" / "evaluation" / "batch"

TOP_PER_EPISODE = 1
BACKUPS_PER_EPISODE = 2


def main():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Candidate file not found: {INPUT_FILE}")

    with INPUT_FILE.open("r", encoding="utf-8") as file:
        candidates = json.load(file)

    if not isinstance(candidates, list):
        raise ValueError("Expected a JSON list of candidates.")

    # Group candidates by episode.
    grouped = defaultdict(list)

    for candidate in candidates:
        episode_id = candidate.get("episode_id")

        if not episode_id:
            print("Skipping candidate without episode_id")
            continue

        grouped[episode_id].append(candidate)

    selected = []
    backups = []
    report = []

    for episode_id in sorted(grouped):
        episode_candidates = sorted(
            grouped[episode_id],
            key=lambda item: item.get("preliminary_score", 0),
            reverse=True,
        )

        primary = episode_candidates[:TOP_PER_EPISODE]
        backup = episode_candidates[
            TOP_PER_EPISODE:
            TOP_PER_EPISODE + BACKUPS_PER_EPISODE
        ]

        selected.extend(primary)
        backups.extend(backup)

        best = primary[0] if primary else None

        report.append({
            "episode_id": episode_id,
            "available_candidates": len(episode_candidates),
            "selected_candidate_id": (
                best.get("candidate_id") if best else None
            ),
            "selected_preliminary_score": (
                best.get("preliminary_score") if best else None
            ),
            "backup_candidate_ids": [
                item.get("candidate_id") for item in backup
            ],
        })

        if best:
            print(
                f"{episode_id} | "
                f"Score: {best.get('preliminary_score', 0):.2f} | "
                f"Selected: {best.get('candidate_id')}"
            )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with (OUTPUT_DIR / "top-50-candidates.json").open(
        "w", encoding="utf-8"
    ) as file:
        json.dump(selected, file, indent=2, ensure_ascii=False)

    with (OUTPUT_DIR / "backup-candidates.json").open(
        "w", encoding="utf-8"
    ) as file:
        json.dump(backups, file, indent=2, ensure_ascii=False)

    with (OUTPUT_DIR / "candidate-selection-report.json").open(
        "w", encoding="utf-8"
    ) as file:
        json.dump(report, file, indent=2, ensure_ascii=False)

    print("\n" + "=" * 60)
    print("CANDIDATE SELECTION COMPLETE")
    print("=" * 60)
    print(f"Total input candidates: {len(candidates)}")
    print(f"Episodes represented:  {len(grouped)}")
    print(f"Primary candidates:    {len(selected)}")
    print(f"Backup candidates:     {len(backups)}")
    print(f"Output directory:      {OUTPUT_DIR}")

    if len(grouped) != 50:
        print(
            f"\nWARNING: Expected 50 episodes, "
            f"but found {len(grouped)}."
        )


if __name__ == "__main__":
    main()
