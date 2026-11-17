
import json
import re
from pathlib import Path
import sys
from pathlib import Path

# Add backend project root to Python import path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.services.structured_parser import parse_structured_episode_text
from app.services.candidate_generator import generate_candidate_clips
from app.services.candidate_deduplicator import deduplicate_candidates


BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_DIR = BASE_DIR / "data" / "real"
OUTPUT_DIR = BASE_DIR / "data" / "evaluation" / "batch"

OVERLAP_THRESHOLD = 0.65
MAX_CANDIDATES_PER_EPISODE = 20


def get_episode_id(filename: str, fallback_number: int) -> str:
    """Create a stable episode ID from the filename."""
    match = re.search(r"episode[-_ ]*(\d+)", filename, re.IGNORECASE)

    if match:
        return f"ep_{int(match.group(1)):03d}"

    return f"ep_{fallback_number:03d}"


def get_episode_duration(episode) -> float:
    """Get the maximum timestamp available in the parsed episode."""
    scene_ends = [
        scene.end_seconds
        for scene in episode.scenes
        if scene.end_seconds is not None
    ]

    if scene_ends:
        return max(scene_ends)

    segment_ends = [
        segment.end_seconds
        for segment in episode.segments
    ]

    return max(segment_ends, default=0.0)


def save_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)


def process_episode(file_path: Path, fallback_number: int) -> dict:
    """Parse one screenplay and generate its candidate clips."""

    episode_id = get_episode_id(file_path.name, fallback_number)

    text = file_path.read_text(encoding="utf-8-sig")

    episode = parse_structured_episode_text(
        text,
        episode_id,
        "storypilot",
        file_path.name,
    )

    duration = get_episode_duration(episode)

    if not episode.segments:
        raise ValueError("Parser returned zero segments.")

    raw_candidates = generate_candidate_clips(
        segments=episode.segments,
        episode_id=episode.episode_id,
        episode_duration_seconds=duration,
        min_segments=2,
    )

    shortlisted = deduplicate_candidates(
        raw_candidates,
        overlap_threshold=OVERLAP_THRESHOLD,
        max_candidates=MAX_CANDIDATES_PER_EPISODE,
    )

    raw_data = [
        candidate.model_dump(mode="json")
        for candidate in raw_candidates
    ]

    shortlisted_data = [
        candidate.model_dump(mode="json")
        for candidate in shortlisted
    ]

    # Save separate files for each episode.
    save_json(
        OUTPUT_DIR / f"{episode_id}-raw-candidates.json",
        raw_data,
    )

    save_json(
        OUTPUT_DIR / f"{episode_id}-shortlisted-candidates.json",
        shortlisted_data,
    )

    return {
        "episode_id": episode_id,
        "filename": file_path.name,
        "episode_number": episode.episode_number,
        "duration_seconds": duration,
        "scene_count": len(episode.scenes),
        "segment_count": len(episode.segments),
        "raw_candidate_count": len(raw_candidates),
        "shortlisted_candidate_count": len(shortlisted),
        "shortlisted_candidates": shortlisted_data,
        "status": "success",
    }


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    files = sorted(
        INPUT_DIR.glob("*.txt"),
        key=lambda path: (
            int(re.search(r"\d+", path.name).group())
            if re.search(r"\d+", path.name)
            else 999999
        ),
    )

    if not files:
        print(f"No .txt files found in {INPUT_DIR}")
        return

    print("=" * 65)
    print("STORYPILOT - DATASET PROCESSING")
    print("=" * 65)
    print(f"Input files found: {len(files)}")
    print("Processing locally. No Gemini API calls will be made.\n")

    results = []
    all_shortlisted_candidates = []

    for index, file_path in enumerate(files, start=1):
        print(f"[{index}/{len(files)}] Processing {file_path.name} ...")

        try:
            result = process_episode(file_path, index)

            results.append(result)
            all_shortlisted_candidates.extend(
                result["shortlisted_candidates"]
            )

            print(
                f"  Success | Segments: {result['segment_count']} "
                f"| Raw: {result['raw_candidate_count']} "
                f"| Shortlisted: {result['shortlisted_candidate_count']}"
            )

        except Exception as error:
            failure = {
                "filename": file_path.name,
                "status": "failed",
                "error": str(error),
            }

            results.append(failure)

            print(f"  FAILED: {error}")

    successful = [
        result for result in results
        if result["status"] == "success"
    ]

    failed = [
        result for result in results
        if result["status"] == "failed"
    ]

    total_segments = sum(
        result["segment_count"] for result in successful
    )

    total_raw = sum(
        result["raw_candidate_count"] for result in successful
    )

    total_shortlisted = sum(
        result["shortlisted_candidate_count"] for result in successful
    )

    summary = {
        "total_files": len(files),
        "successful_episodes": len(successful),
        "failed_episodes": len(failed),
        "total_segments": total_segments,
        "total_raw_candidates": total_raw,
        "total_shortlisted_candidates": total_shortlisted,
        "episodes": results,
    }

    # Save the consolidated dataset and processing report.
    save_json(
        OUTPUT_DIR / "all-shortlisted-candidates.json",
        all_shortlisted_candidates,
    )

    save_json(
        OUTPUT_DIR / "dataset-summary.json",
        summary,
    )

    print("\n" + "=" * 65)
    print("PROCESSING COMPLETE")
    print("=" * 65)
    print(f"Files found:             {len(files)}")
    print(f"Successfully processed: {len(successful)}")
    print(f"Failed:                  {len(failed)}")
    print(f"Total segments:          {total_segments}")
    print(f"Raw candidates:          {total_raw}")
    print(f"Shortlisted candidates:  {total_shortlisted}")

    if failed:
        print("\nFailed files:")
        for item in failed:
            print(f"  - {item['filename']}: {item['error']}")

    print(f"\nResults saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
