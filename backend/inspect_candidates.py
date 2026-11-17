
from pathlib import Path

from app.services.parser import parse_episode_text
from app.services.candidate_generator import generate_candidate_clips
from app.services.candidate_deduplicator import deduplicate_candidates


file_path = Path("data/synthetic/episode-001.txt")

screenplay = file_path.read_text(encoding="utf-8")

segments = parse_episode_text(
    screenplay,
    episode_id="ep_001"
)

candidates = generate_candidate_clips(
    segments,
    episode_id="ep_001"
)
shortlisted = deduplicate_candidates(
    candidates,
    overlap_threshold=0.70
)

print(f"Total screenplay segments: {len(segments)}")
print(f"Total candidates generated: {len(candidates)}")
print(f"Candidates after deduplication: {len(shortlisted)}")

print("\n========== TOP SHORTLISTED CANDIDATES ==========")

for index, candidate in enumerate(shortlisted[:10], start=1):
    print(f"\nCandidate #{index}")
    print(f"ID: {candidate.candidate_id}")
    print(
        f"Window: {candidate.start_time} - "
        f"{candidate.end_time}"
    )
    print(f"Duration: {candidate.duration_seconds}s")
    print(f"Score: {candidate.preliminary_score}")
    print(f"Segments: {len(candidate.segment_ids)}")
    print(f"Signals: {candidate.signals}")