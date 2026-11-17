
import pytest

from app.models.candidate import CandidateClip
from app.services.candidate_deduplicator import (
    calculate_temporal_iou,
    deduplicate_candidates,
)


def make_candidate(candidate_id, start, end, score):
    return CandidateClip(
        candidate_id=candidate_id,
        episode_id="ep_001",
        start_seconds=start,
        end_seconds=end,
        duration_seconds=end - start,
        start_time="00:00:00",
        end_time="00:00:30",
        segment_ids=["seg_001", "seg_002"],
        source_line_start=1,
        source_line_end=2,
        preliminary_score=score,
    )


def test_temporal_iou_for_overlapping_candidates():
    a = make_candidate("A", 0, 60, 9)
    b = make_candidate("B", 10, 50, 8)

    assert calculate_temporal_iou(a, b) == pytest.approx(40 / 60)


def test_temporal_iou_for_non_overlapping_candidates():
    a = make_candidate("A", 0, 30, 9)
    b = make_candidate("B", 40, 70, 8)

    assert calculate_temporal_iou(a, b) == 0


def test_deduplication_keeps_higher_scoring_candidate():
    a = make_candidate("A", 0, 60, 9)
    b = make_candidate("B", 5, 55, 8)

    result = deduplicate_candidates([b, a])

    assert len(result) == 1
    assert result[0].candidate_id == "A"


def test_deduplication_keeps_distinct_candidates():
    a = make_candidate("A", 0, 30, 9)
    b = make_candidate("B", 40, 70, 8)

    result = deduplicate_candidates([a, b])

    assert len(result) == 2


def test_invalid_threshold_is_rejected():
    with pytest.raises(ValueError):
        deduplicate_candidates([], overlap_threshold=1.5)
