
import json
import sys
from pathlib import Path
from collections import Counter

# ---------------------------------------------------------
# PROJECT IMPORTS
# ---------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[1]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.services.structured_parser import parse_structured_episode_text
from app.services.candidate_generator import generate_candidate_clips
from app.services.candidate_deduplicator import deduplicate_candidates


# ---------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------

EPISODE_FILE = (
    PROJECT_ROOT
    / "data"
    / "real"
    / "episode-001-Episode 1671703.txt"
)

OUTPUT_DIR = PROJECT_ROOT / "data" / "evaluation"

EPISODE_ID = "ep_001"
SHOW_ID = "storypilot_demo"

OVERLAP_THRESHOLD = 0.65
MAX_SHORTLIST_SIZE = 20


# ---------------------------------------------------------
# LOAD AND PARSE EPISODE
# ---------------------------------------------------------

def load_episode():

    if not EPISODE_FILE.exists():
        raise FileNotFoundError(
            f"Episode file not found: {EPISODE_FILE}"
        )

    screenplay_text = EPISODE_FILE.read_text(
        encoding="utf-8"
    )

    episode = parse_structured_episode_text(
        text=screenplay_text,
        episode_id=EPISODE_ID,
        show_id=SHOW_ID,
        filename=EPISODE_FILE.name,
    )

    return episode


# ---------------------------------------------------------
# EPISODE STATISTICS
# ---------------------------------------------------------

def print_episode_statistics(episode):

    print("\n" + "=" * 65)
    print("STORYPILOT - EPISODE INSPECTION")
    print("=" * 65)

    print(f"Episode number : {episode.episode_number}")
    print(f"Episode ID     : {episode.episode_id}")
    print(f"Episode title  : {episode.filename}")

    print(f"\nLogline:\n{episode.logline}")

    print(f"\nContinuity notes:\n{episode.continuity_notes}")

    print("\nSCENE INFORMATION")
    print("-" * 65)

    for scene in episode.scenes:

        print(f"Scene          : {scene.scene_number}")
        print(f"Heading        : {scene.scene_heading}")
        print(f"Start          : {scene.start_time}")
        print(f"End            : {scene.end_time}")
        print(f"Elements       : {len(scene.segment_ids)}")

    print("\nSEGMENT BREAKDOWN")
    print("-" * 65)

    counts = Counter(
        segment.segment_type
        for segment in episode.segments
    )

    for segment_type, count in sorted(counts.items()):
        print(f"{segment_type:<25}: {count}")

    print(f"\nTotal segments: {len(episode.segments)}")


# ---------------------------------------------------------
# GENERATE CANDIDATE WINDOWS
# ---------------------------------------------------------

def generate_candidates(episode):

    episode_duration = max(
        (
            scene.end_seconds
            for scene in episode.scenes
            if scene.end_seconds is not None
        ),
        default=None,
    )

    candidates = generate_candidate_clips(
        segments=episode.segments,
        episode_id=episode.episode_id,
        episode_duration_seconds=episode_duration,
        min_segments=2,
    )

    return candidates


# ---------------------------------------------------------
# DISPLAY CANDIDATES
# ---------------------------------------------------------

def print_candidates(candidates, limit=15):

    print("\n" + "=" * 65)
    print("PROMOTIONAL CANDIDATE RANKINGS")
    print("=" * 65)

    print(f"Total candidates: {len(candidates)}")

    if not candidates:
        print("\nNo candidates generated.")
        return

    print(f"\nShowing top {min(limit, len(candidates))} candidates:")

    for rank, candidate in enumerate(candidates[:limit], start=1):

        print("\n" + "-" * 65)

        print(f"RANK             : {rank}")
        print(f"Candidate ID     : {candidate.candidate_id}")
        print(f"Episode          : {candidate.episode_id}")

        print(
            f"Timestamp        : "
            f"{candidate.start_time} - {candidate.end_time}"
        )

        print(
            f"Duration         : "
            f"{candidate.duration_seconds} seconds"
        )

        print(
            f"Preliminary score: "
            f"{candidate.preliminary_score}/10"
        )

        print(
            f"Segments included: "
            f"{len(candidate.segment_ids)}"
        )

        print(
            f"Source lines     : "
            f"{candidate.source_line_start} - "
            f"{candidate.source_line_end}"
        )

        print("\nSignals:")

        for name, value in candidate.signals.items():
            print(f"  {name:<25}: {value}")


# ---------------------------------------------------------
# SAVE CANDIDATE OUTPUTS
# ---------------------------------------------------------

def save_candidates(candidates, filename):

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_file = OUTPUT_DIR / filename

    serialized_candidates = [
        candidate.model_dump(mode="json")
        for candidate in candidates
    ]

    output_file.write_text(
        json.dumps(
            serialized_candidates,
            indent=4,
        ),
        encoding="utf-8",
    )

    print(f"Saved: {output_file}")


# ---------------------------------------------------------
# MAIN
# ---------------------------------------------------------

def main():

    # 1. Load and parse screenplay
    episode = load_episode()

    # 2. Display screenplay statistics
    print_episode_statistics(episode)

    # 3. Generate raw candidate windows
    raw_candidates = generate_candidates(episode)

    print("\n" + "=" * 65)
    print("CANDIDATE GENERATION SUMMARY")
    print("=" * 65)

    print(f"Raw candidates: {len(raw_candidates)}")

    # 4. Save raw candidates before deduplication
    save_candidates(
        raw_candidates,
        "episode-001-raw-candidates.json",
    )

    # 5. Deduplicate and shortlist
    shortlisted_candidates = deduplicate_candidates(
        raw_candidates,
        overlap_threshold=OVERLAP_THRESHOLD,
        max_candidates=MAX_SHORTLIST_SIZE,
    )

    print(f"Shortlisted candidates: {len(shortlisted_candidates)}")

    # 6. Display shortlisted results
    print_candidates(
        shortlisted_candidates,
        limit=MAX_SHORTLIST_SIZE,
    )

    # 7. Save shortlisted candidates separately
    save_candidates(
        shortlisted_candidates,
        "episode-001-shortlisted-candidates.json",
    )

    print("\n" + "=" * 65)
    print("INSPECTION COMPLETED")
    print("=" * 65)


if __name__ == "__main__":
    main()
