
from app.models.segment import Segment

from app.services.candidate_generator import (
    segment_overlaps_window,
    generate_candidate_clips,
)


def make_segment(
    segment_id,
    start,
    end,
    segment_type="dialogue",
    content="Test content",
    line=1,
):
    return Segment(
        segment_id=segment_id,
        episode_id="ep_001",
        start_time=None,
        end_time=None,
        start_seconds=start,
        end_seconds=end,
        segment_type=segment_type,
        speaker="JULIANA" if segment_type == "dialogue" else None,
        content=content,
        source_line_start=line,
        source_line_end=line,
    )


def test_segment_starting_before_window_but_overlapping():
    segment = make_segment(
        "seg_001",
        0.0,
        4.8,
        "camera_direction",
    )

    assert segment_overlaps_window(
        segment,
        2.0,
        22.0,
    )


def test_segment_ending_before_window_is_excluded():
    segment = make_segment(
        "seg_001",
        0.0,
        4.8,
    )

    assert not segment_overlaps_window(
        segment,
        5.0,
        25.0,
    )


def test_segment_starting_at_window_end_is_excluded():
    segment = make_segment(
        "seg_001",
        20.0,
        25.0,
    )

    assert not segment_overlaps_window(
        segment,
        0.0,
        20.0,
    )


def test_fractional_timestamp_overlap():
    segment = make_segment(
        "seg_001",
        11.3,
        13.1,
    )

    assert segment_overlaps_window(
        segment,
        11.0,
        31.0,
    )


def test_zero_duration_segment_is_treated_as_point():
    segment = make_segment(
        "seg_001",
        10.0,
        10.0,
    )

    assert segment_overlaps_window(
        segment,
        5.0,
        15.0,
    )


def test_candidate_contains_overlapping_camera_segment():
    segments = [
        make_segment(
            "seg_001",
            0.0,
            4.8,
            "camera_direction",
            "Church doors open.",
            1,
        ),
        make_segment(
            "seg_002",
            1.0,
            4.8,
            "action",
            "Juliana enters.",
            2,
        ),
        make_segment(
            "seg_003",
            11.3,
            13.1,
            "dialogue",
            "You should turn around, Juliana.",
            3,
        ),
        make_segment(
            "seg_004",
            14.0,
            16.0,
            "dialogue",
            "Why?",
            4,
        ),
    ]

    candidates = generate_candidate_clips(
        segments,
        episode_id="ep_001",
    )

    candidate = next(
        candidate for candidate in candidates
        if candidate.start_seconds == 0.0
        and candidate.duration_seconds == 20
    )

    assert "seg_001" in candidate.segment_ids
    assert "seg_002" in candidate.segment_ids
    assert "seg_003" in candidate.segment_ids
    assert "seg_004" in candidate.segment_ids


def test_candidate_preserves_fractional_start():
    segments = [
        make_segment("seg_001", 1.25, 3.5, line=1),
        make_segment("seg_002", 5.5, 8.0, line=2),
    ]

    candidates = generate_candidate_clips(
        segments,
        episode_id="ep_001",
    )

    assert candidates
    assert any(
        candidate.start_seconds == 1.25
        for candidate in candidates
    )
