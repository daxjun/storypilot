
from app.models.segment import Segment


CHECKED_SEGMENT_TYPES = {"dialogue", "action"}

BOUNDARY_TOLERANCE = 0.001


def validate_candidate_boundaries(
    segments: list[Segment],
    window_start: float,
    window_end: float,
) -> dict:
    """
    Detect dialogue or action segments crossing
    candidate boundaries. Does not modify timestamps.
    """

    warnings = []

    for segment in segments:
        if (
            segment.segment_type not in CHECKED_SEGMENT_TYPES
            or segment.start_seconds is None
            or segment.end_seconds is None
        ):
            continue

        segment_start = float(segment.start_seconds)
        segment_end = float(segment.end_seconds)

        if segment_end <= segment_start:
            continue

        if (
            segment_start < window_start - BOUNDARY_TOLERANCE
            and segment_end > window_start + BOUNDARY_TOLERANCE
        ):
            warnings.append({
                "boundary": "start",
                "segment_id": segment.segment_id,
                "segment_type": segment.segment_type,
                "message": "Candidate starts before this segment finishes.",
                "missing_seconds": round(
                    segment_end - window_start, 2
                ),
                "timing_inferred": segment.timing_inferred,
            })

        if (
            segment_start < window_end - BOUNDARY_TOLERANCE
            and segment_end > window_end + BOUNDARY_TOLERANCE
        ):
            warnings.append({
                "boundary": "end",
                "segment_id": segment.segment_id,
                "segment_type": segment.segment_type,
                "message": "Candidate ends before this segment finishes.",
                "missing_seconds": round(
                    segment_end - window_end, 2
                ),
                "timing_inferred": segment.timing_inferred,
            })

    if not warnings:
        status = "clean"
    elif any(w["timing_inferred"] for w in warnings):
        status = "review_required"
    else:
        status = "warning"

    return {
        "status": status,
        "warnings": warnings,
    }
