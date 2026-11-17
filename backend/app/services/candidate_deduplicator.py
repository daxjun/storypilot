
from app.models.candidate import CandidateClip


def calculate_temporal_iou(
    candidate_a: CandidateClip,
    candidate_b: CandidateClip,
) -> float:
    """
    Calculate temporal Intersection over Union.

    IoU = intersection duration / union duration
    """

    intersection_start = max(
        candidate_a.start_seconds,
        candidate_b.start_seconds,
    )

    intersection_end = min(
        candidate_a.end_seconds,
        candidate_b.end_seconds,
    )

    intersection = max(
        0.0,
        intersection_end - intersection_start,
    )

    union = (
        candidate_a.duration_seconds
        + candidate_b.duration_seconds
        - intersection
    )

    if union <= 0:
        return 0.0

    return intersection / union


def deduplicate_candidates(
    candidates: list[CandidateClip],
    overlap_threshold: float = 0.65,
    max_candidates: int | None = None,
) -> list[CandidateClip]:
    """
    Keep high-scoring candidates while suppressing
    excessively overlapping windows.

    Candidates are processed in descending score order.

    max_candidates optionally limits the final shortlist.
    """

    if not 0 <= overlap_threshold <= 1:
        raise ValueError(
            "overlap_threshold must be between 0 and 1"
        )

    if max_candidates is not None and max_candidates < 1:
        raise ValueError(
            "max_candidates must be at least 1"
        )

    ranked_candidates = sorted(
        candidates,
        key=lambda candidate: (
            -candidate.preliminary_score,
            candidate.start_seconds,
            candidate.duration_seconds,
        ),
    )

    selected = []

    for candidate in ranked_candidates:

        is_duplicate = any(
            calculate_temporal_iou(candidate, chosen)
            > overlap_threshold
            for chosen in selected
        )

        if not is_duplicate:
            selected.append(candidate)

        if (
            max_candidates is not None
            and len(selected) >= max_candidates
        ):
            break

    return selected
