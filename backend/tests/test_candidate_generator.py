
import pytest

from app.models.segment import Segment
from app.services.candidate_generator import (
    calculate_preliminary_score,
    generate_candidate_clips,
    seconds_to_timestamp,
)


def make_segment(
    segment_id: str,
    start: int,
    content: str,
    segment_type: str = "dialogue",
    episode_id: str = "ep_001",
    line: int = 1,
) -> Segment:
    return Segment(
        segment_id=segment_id,
        episode_id=episode_id,
        start_time=seconds_to_timestamp(start),
        start_seconds=start,
        segment_type=segment_type,
        speaker="RAHUL" if segment_type == "dialogue" else None,
        content=content,
        source_line_start=line,
        source_line_end=line,
    )


def test_seconds_to_timestamp():
    assert seconds_to_timestamp(65) == "00:01:05"
    assert seconds_to_timestamp(3661) == "01:01:01"


def test_empty_segments_return_zero_score():
    score, signals = calculate_preliminary_score(
        [],
        duration_seconds=40,
    )

    assert score == 0.0
    assert signals == {}


def test_invalid_duration_is_rejected():
    with pytest.raises(ValueError):
        calculate_preliminary_score(
            [],
            duration_seconds=0,
        )


def test_duration_aware_density_score():
    segments = [
        make_segment(f"seg_{i}", i * 5, "Hello there")
        for i in range(8)
    ]

    _, signals_40 = calculate_preliminary_score(
        segments,
        duration_seconds=40,
    )

    _, signals_60 = calculate_preliminary_score(
        segments,
        duration_seconds=60,
    )

    assert signals_40["density_score"] == 1.0
    assert signals_60["density_score"] == 0.67
    assert signals_40["density_score"] > signals_60["density_score"]

def test_candidate_generation_respects_episode_id():
    segments = [
        make_segment("s1", 0, "Hello"),
        make_segment("s2", 10, "How are you?"),
        make_segment(
            "s3", 20, "I am fine",
            episode_id="ep_002"
        ),
    ]

    candidates = generate_candidate_clips(
        segments,
        episode_id="ep_001",
    )

    assert all(
        candidate.episode_id == "ep_001"
        for candidate in candidates
    )


def test_candidate_generation_respects_minimum_segments():
    segments = [
        make_segment("s1", 0, "Hello"),
    ]

    candidates = generate_candidate_clips(
        segments,
        episode_id="ep_001",
        min_segments=2,
    )

    assert candidates == []


def test_candidate_generation_creates_valid_durations():
    segments = [
        make_segment("s1", 0, "Hello"),
        make_segment("s2", 10, "Tell me the truth"),
        make_segment("s3", 20, "I know the secret"),
        make_segment("s4", 30, "Stop right there"),
        make_segment("s5", 40, "This is impossible"),
        make_segment("s6", 50, "What happened?"),
    ]

    candidates = generate_candidate_clips(
        segments,
        episode_id="ep_001",
    )

    assert len(candidates) > 0

    for candidate in candidates:
        assert 20 <= candidate.duration_seconds <= 60
        assert (
            candidate.end_seconds - candidate.start_seconds
            == candidate.duration_seconds
        )


def test_candidate_generation_respects_episode_boundary():
    segments = [
        make_segment("s1", 0, "Hello"),
        make_segment("s2", 10, "Tell me the truth"),
        make_segment("s3", 20, "I know the secret"),
    ]

    candidates = generate_candidate_clips(
        segments,
        episode_id="ep_001",
        episode_duration_seconds=45,
    )

    assert all(
        candidate.end_seconds <= 45
        for candidate in candidates
    )


def test_candidate_source_lines_are_preserved():
    segments = [
        make_segment("s1", 0, "Hello", line=5),
        make_segment("s2", 10, "Tell me the truth", line=8),
        make_segment("s3", 20, "I know the secret", line=12),
    ]

    candidates = generate_candidate_clips(
        segments,
        episode_id="ep_001",
    )

    assert candidates

    candidate = candidates[0]

    assert candidate.source_line_start == 5
    assert candidate.source_line_end == 12


def test_candidate_ids_are_unique():
    segments = [
        make_segment("s1", 0, "Hello"),
        make_segment("s2", 10, "Tell me the truth"),
        make_segment("s3", 20, "I know the secret"),
    ]

    candidates = generate_candidate_clips(
        segments,
        episode_id="ep_001",
    )

    candidate_ids = [
        candidate.candidate_id
        for candidate in candidates
    ]

    assert len(candidate_ids) == len(set(candidate_ids))


def test_candidates_are_sorted_by_score():
    segments = [
        make_segment("s1", 0, "Hello"),
        make_segment("s2", 10, "Tell me the truth"),
        make_segment("s3", 20, "I know the secret"),
        make_segment("s4", 30, "Stop, this is impossible"),
    ]

    candidates = generate_candidate_clips(
        segments,
        episode_id="ep_001",
    )

    scores = [
        candidate.preliminary_score
        for candidate in candidates
    ]

    assert scores == sorted(scores, reverse=True)
