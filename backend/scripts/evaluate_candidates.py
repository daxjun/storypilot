
import argparse
import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------
# PROJECT IMPORTS
# ---------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.models.candidate import CandidateClip
from app.services.structured_parser import parse_structured_episode_text
from app.services.gemini_evaluator import GeminiEvaluator


# ---------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------

REAL_DIR = PROJECT_ROOT / "data" / "real"
BATCH_DIR = PROJECT_ROOT / "data" / "evaluation" / "batch"

CANDIDATE_FILE = BATCH_DIR / "top-50-candidates.json"
OUTPUT_FILE = BATCH_DIR / "editorial-evaluations.json"

# Number of NEW API evaluations per execution.
DEFAULT_BATCH_SIZE = 5


# ---------------------------------------------------------
# EPISODE DISCOVERY
# ---------------------------------------------------------

def get_episode_number(filename):
    match = re.search(
        r"episode[-_ ]*(\d+)",
        filename,
        re.IGNORECASE,
    )

    return int(match.group(1)) if match else None


def discover_episode_files():
    episode_files = {}

    for path in REAL_DIR.glob("*.txt"):
        number = get_episode_number(path.name)

        if number is not None:
            episode_files[number] = path

    return episode_files


def load_episode(candidate, episode_files, cache):
    """Load and parse the screenplay belonging to a candidate."""

    episode_id = candidate.episode_id

    if episode_id in cache:
        return cache[episode_id]

    match = re.search(r"(\d+)$", episode_id)

    if not match:
        raise ValueError(f"Cannot determine episode number: {episode_id}")

    episode_number = int(match.group(1))
    episode_file = episode_files.get(episode_number)

    if episode_file is None:
        raise FileNotFoundError(
            f"No screenplay found for {episode_id}"
        )

    screenplay_text = episode_file.read_text(
        encoding="utf-8-sig"
    )

    episode = parse_structured_episode_text(
        text=screenplay_text,
        episode_id=episode_id,
        show_id="storypilot_demo",
        filename=episode_file.name,
    )

    if not episode.segments:
        raise ValueError(
            f"No segments parsed for {episode_id}"
        )

    cache[episode_id] = episode
    return episode


# ---------------------------------------------------------
# LOAD CANDIDATES
# ---------------------------------------------------------

def load_candidates():
    if not CANDIDATE_FILE.exists():
        raise FileNotFoundError(
            f"Candidate file not found: {CANDIDATE_FILE}"
        )

    raw_data = json.loads(
        CANDIDATE_FILE.read_text(encoding="utf-8")
    )

    return [
        CandidateClip.model_validate(item)
        for item in raw_data
    ]


# ---------------------------------------------------------
# LOAD PREVIOUS RESULTS
# ---------------------------------------------------------

def load_existing_results():
    """
    Load the current checkpoint and import previous
    successful Episode 1 results when available.
    """

    results = {}

    possible_files = [
        OUTPUT_FILE,
        PROJECT_ROOT / "data" / "evaluation"
        / "episode-001-editorial-evaluations-v2.json",
        PROJECT_ROOT / "data" / "evaluation"
        / "episode-001-editorial-evaluations.json",
    ]

    for path in possible_files:
        if not path.exists():
            continue

        try:
            data = json.loads(path.read_text(encoding="utf-8"))

            if not isinstance(data, list):
                continue

            for item in data:
                candidate_data = item.get("candidate", {})
                candidate_id = (
                    candidate_data.get("candidate_id")
                    or item.get("candidate_id")
                )

                if not candidate_id:
                    continue

                status = item.get(
                    "evaluation_status",
                    item.get("status", ""),
                )

                if status == "success" and item.get("evaluation"):
                    results[candidate_id] = item

                elif candidate_id not in results and status == "failed":
                    results[candidate_id] = item

        except (json.JSONDecodeError, OSError) as error:
            print(f"Warning: Could not read {path.name}: {error}")

    return results


# ---------------------------------------------------------
# SAVE CHECKPOINT
# ---------------------------------------------------------

def save_results(results):
    BATCH_DIR.mkdir(parents=True, exist_ok=True)

    ordered_results = list(results.values())

    temporary_file = OUTPUT_FILE.with_suffix(".tmp")

    temporary_file.write_text(
        json.dumps(
            ordered_results,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    # Replace the previous checkpoint only after writing succeeds.
    temporary_file.replace(OUTPUT_FILE)


# ---------------------------------------------------------
# EVALUATION
# ---------------------------------------------------------

def run_evaluations(limit, retry_failed=False):
    candidates = load_candidates()
    episode_files = discover_episode_files()

    if not candidates:
        print("No candidates found.")
        return

    results = load_existing_results()

    successful_ids = {
        candidate_id
        for candidate_id, item in results.items()
        if item.get("evaluation_status") == "success"
    }

    pending = []

    for candidate in candidates:
        existing = results.get(candidate.candidate_id)

        if existing:
            status = existing.get("evaluation_status")

            if status == "success":
                continue

            if status == "failed" and not retry_failed:
                continue

        pending.append(candidate)

    print("=" * 65)
    print("STORYPILOT - MULTI-EPISODE EDITORIAL EVALUATION")
    print("=" * 65)
    print(f"Candidates available: {len(candidates)}")
    print(f"Already successful:  {len(successful_ids)}")
    print(f"Pending candidates:   {len(pending)}")
    print(f"Batch size:           {limit}")
    print(f"Retry failed:         {retry_failed}")
    print("Gemini requests are sequential.\n")

    if not pending:
        print("No pending candidates to evaluate.")
        print(f"Results: {OUTPUT_FILE}")
        return

    batch = pending[:limit]

    evaluator = GeminiEvaluator()
    episode_cache = {}

    for index, candidate in enumerate(batch, start=1):
        print("\n" + "=" * 65)
        print(f"EVALUATING {index}/{len(batch)}")
        print(f"Episode: {candidate.episode_id}")
        print(f"Candidate: {candidate.candidate_id}")
        print(
            f"Time: {candidate.start_time} - "
            f"{candidate.end_time}"
        )
        print("=" * 65)

        try:
            episode = load_episode(
                candidate,
                episode_files,
                episode_cache,
            )

            evaluation, final_score = evaluator.evaluate_with_score(
                candidate=candidate,
                episode=episode,
            )

            result = {
                "candidate": candidate.model_dump(mode="json"),
                "evaluation": evaluation.model_dump(mode="json"),
                "final_editorial_score": final_score,
                "evaluation_status": "success",
            }

            results[candidate.candidate_id] = result

            print(f"\nSUCCESS | Editorial score: {final_score}/10")
            print(f"Hook: {evaluation.hook}")
            print(f"Cliffhanger: {evaluation.cliffhanger}")

        except Exception as error:
            result = {
                "candidate": candidate.model_dump(mode="json"),
                "evaluation_status": "failed",
                "error": str(error),
            }

            results[candidate.candidate_id] = result

            print(f"\nFAILED: {error}")

        # Save immediately, including failures.
        save_results(results)
        print("Checkpoint saved.")

    # -----------------------------------------------------
    # SUMMARY
    # -----------------------------------------------------

    success_count = sum(
        1
        for item in results.values()
        if item.get("evaluation_status") == "success"
    )

    failed_count = sum(
        1
        for item in results.values()
        if item.get("evaluation_status") == "failed"
    )

    print("\n" + "=" * 65)
    print("BATCH COMPLETE")
    print("=" * 65)
    print(f"Successful evaluations: {success_count}")
    print(f"Failed evaluations:     {failed_count}")
    print(f"Remaining candidates:    {max(0, len(pending) - len(batch))}")
    print(f"Results saved to:        {OUTPUT_FILE}")


# ---------------------------------------------------------
# MAIN
# ---------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Evaluate StoryPilot candidates across episodes."
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=DEFAULT_BATCH_SIZE,
        help="Maximum NEW evaluations in this run (default: 5).",
    )

    parser.add_argument(
        "--retry-failed",
        action="store_true",
        help="Retry previously failed candidates.",
    )

    args = parser.parse_args()

    if args.limit < 1:
        parser.error("--limit must be at least 1.")

    run_evaluations(
        limit=args.limit,
        retry_failed=args.retry_failed,
    )


if __name__ == "__main__":
    main()
