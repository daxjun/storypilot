
import pytest

from pydantic import ValidationError
from app.models.candidate import CandidateClip


def create_candidate(**overrides):
    data = {
        "candidate_id": "cand_001",
        "episode_id": "ep_001",
        "start_seconds": 20,
        "end_seconds": 50,
        "duration_seconds": 30,
        "start_time": "00:00:20",
        "end_time": "00:00:50",
        "segment_ids": ["seg_001", "seg_002"],
        "source_line_start": 3,
        "source_line_end": 5,
    }

    data.update(overrides)
    return CandidateClip(**data)


def test_candidate_creation():
    candidate = create_candidate()

    assert candidate.candidate_id == "cand_001"
    assert candidate.duration_seconds == 30
    assert candidate.duration_verified is False


def test_candidate_rejects_duration_below_20():
    with pytest.raises(ValidationError):
        create_candidate(
            end_seconds=35,
            duration_seconds=15
        )


def test_candidate_rejects_duration_above_60():
    with pytest.raises(ValidationError):
        create_candidate(
            end_seconds=90,
            duration_seconds=70
        )


def test_candidate_rejects_inconsistent_duration():
    with pytest.raises(ValidationError):
        create_candidate(
            end_seconds=55,
            duration_seconds=30
        )


def test_candidate_rejects_invalid_source_lines():
    with pytest.raises(ValidationError):
        create_candidate(
            source_line_start=10,
            source_line_end=5
        )
