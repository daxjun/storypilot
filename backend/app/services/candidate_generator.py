
import re
from app.services.boundary_validator import (
    validate_candidate_boundaries,
)

from app.models.candidate import CandidateClip
from app.models.segment import Segment


WINDOW_DURATIONS = [20, 30, 40, 50, 60]

CONFLICT_WORDS = {
    "truth", "lie", "lied", "secret", "hide",
    "died", "death", "betray", "stop", "never",
    "impossible", "wrong", "hate", "abandon",
    "betrayed", "refuse", "revenge"
}

REVEAL_WORDS = {
    "sister", "brother", "father", "mother",
    "yesterday", "called", "secret", "truth",
    "know", "knew", "marrying", "married",
    "because", "confess", "discovered"
}

HOOK_CUES = {
    "no", "why", "what", "impossible", "stop",
    "never", "betrayal", "secret", "help",
    "please", "how", "who"
}

ENDING_CUES = {
    "stop", "why", "what", "never", "impossible",
    "secret", "revenge", "wait", "please",
    "betrayal", "truth", "how"
}

DRAMATIC_DELIVERY_CUES = {
    "shocked", "outraged", "furious", "heartbroken",
    "desperate", "terrified", "devastated",
    "pleading", "trembling", "crying", "whispering",
    "accusing", "gloating", "mocking", "cold"
}

DRAMATIC_ACTION_CUES = {
    "shock", "shocked", "tears", "weeping",
    "clenching", "clenches", "fury", "furious",
    "defiance", "defiant", "betrayal", "turns",
    "reveals", "refusing", "confronted",
    "hardening", "black"
}


# ---------------------------------------------------------
# TIMESTAMP UTILITIES
# ---------------------------------------------------------

def seconds_to_timestamp(total_seconds: float) -> str:
    """Convert seconds into HH:MM:SS, preserving centiseconds."""

    total_centiseconds = round(total_seconds * 100)

    hours, remainder = divmod(total_centiseconds, 360000)
    minutes, remainder = divmod(remainder, 6000)
    seconds, centiseconds = divmod(remainder, 100)

    timestamp = f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    if centiseconds:
        timestamp += f".{centiseconds:02d}"

    return timestamp


def tokenize(text: str) -> list[str]:
    """Extract lowercase whole words."""

    return re.findall(r"\b[a-zA-Z]+\b", text.lower())


def count_keyword_hits(text: str, keywords: set[str]) -> int:
    """Count whole-word occurrences of selected keywords."""

    return sum(
        1 for word in tokenize(text)
        if word in keywords
    )


# ---------------------------------------------------------
# INTERVAL UTILITIES
# ---------------------------------------------------------

def segment_overlaps_window(
    segment: Segment,
    window_start: float,
    window_end: float,
) -> bool:
    """
    Check whether a screenplay element overlaps a time window.

    Uses half-open interval semantics:
        [window_start, window_end)

    Legacy segments without end timestamps are treated as
    point events at their start timestamp.
    """

    if segment.start_seconds is None:
        return False

    segment_start = float(segment.start_seconds)

    if segment.end_seconds is None:
        return window_start <= segment_start < window_end

    segment_end = float(segment.end_seconds)

    if segment_start == segment_end:
        return window_start <= segment_start < window_end

    return (
        segment_start < window_end
        and segment_end > window_start
    )


def get_window_segments(
    segments: list[Segment],
    window_start: float,
    window_end: float,
) -> list[Segment]:

    selected = [
        segment for segment in segments
        if segment_overlaps_window(
            segment,
            window_start,
            window_end,
        )
    ]

    return sorted(
        selected,
        key=lambda segment: (
            segment.start_seconds
            if segment.start_seconds is not None
            else 0
        ),
    )


# ---------------------------------------------------------
# EDITORIAL SIGNALS
# ---------------------------------------------------------

def calculate_hook_score(
    segments: list[Segment],
    window_start: float,
) -> float:
    """
    Evaluate the first three seconds of a candidate.

    This is a lightweight heuristic, not an AI judgment.
    """

    opening_segments = get_window_segments(
        segments,
        window_start,
        window_start + 3,
    )

    if not opening_segments:
        return 0.0

    opening_text = " ".join(
        segment.content for segment in opening_segments
    )

    keyword_hits = count_keyword_hits(
        opening_text,
        HOOK_CUES,
    )

    dramatic_delivery = any(
        segment.delivery
        and any(
            cue in segment.delivery.lower()
            for cue in DRAMATIC_DELIVERY_CUES
        )
        for segment in opening_segments
    )

    dramatic_action = any(
        count_keyword_hits(
            segment.content,
            DRAMATIC_ACTION_CUES,
        ) > 0
        for segment in opening_segments
        if segment.segment_type in {
            "action",
            "camera_direction",
        }
    )

    score = min(keyword_hits * 0.5, 1.0)

    if dramatic_delivery:
        score += 0.5

    if dramatic_action:
        score += 0.5

    return round(min(score, 2.0), 2)


def calculate_ending_score(
    segments: list[Segment],
    window_end: float,
) -> float:
    """
    Evaluate the final three seconds of a candidate.

    Considers dialogue, action and camera descriptions instead
    of examining only the final screenplay element.
    """

    ending_segments = get_window_segments(
        segments,
        window_end - 3,
        window_end,
    )

    if not ending_segments:
        return 0.0

    ending_text = " ".join(
        segment.content for segment in ending_segments
    )

    keyword_hits = count_keyword_hits(
        ending_text,
        ENDING_CUES,
    )

    dramatic_delivery = any(
        segment.delivery
        and any(
            cue in segment.delivery.lower()
            for cue in DRAMATIC_DELIVERY_CUES
        )
        for segment in ending_segments
    )

    dramatic_action = any(
        count_keyword_hits(
            segment.content,
            DRAMATIC_ACTION_CUES,
        ) > 0
        for segment in ending_segments
    )

    score = min(keyword_hits * 0.5, 1.0)

    if dramatic_delivery:
        score += 0.5

    if dramatic_action:
        score += 0.5

    return round(min(score, 2.0), 2)


def calculate_preliminary_score(
    segments: list[Segment],
    duration_seconds: int,
    window_start: float | None = None,
    window_end: float | None = None,
) -> tuple[float, dict[str, float]]:
    """
    Calculate a preliminary heuristic score out of 10.

    Components:
        Dialogue density       0-1
        Conflict language      0-1.5
        Revelation language    0-1.5
        Content density        0-1
        Opening hook           0-2
        Ending tension         0-2
        Emotional delivery     0-1

    These signals are for candidate discovery only.
    """

    if duration_seconds <= 0:
        raise ValueError("duration_seconds must be positive")

    if not segments:
        return 0.0, {}

    dialogue_segments = [
        segment for segment in segments
        if segment.segment_type == "dialogue"
    ]

    dialogue_ratio = len(dialogue_segments) / len(segments)

    combined_text = " ".join(
        segment.content for segment in segments
    )

    conflict_hits = count_keyword_hits(
        combined_text,
        CONFLICT_WORDS,
    )

    reveal_hits = count_keyword_hits(
        combined_text,
        REVEAL_WORDS,
    )

    dialogue_score = min(dialogue_ratio, 1.0)

    conflict_score = min(
        conflict_hits / 4,
        1.0,
    ) * 1.5

    reveal_score = min(
        reveal_hits / 4,
        1.0,
    ) * 1.5

    segments_per_second = len(segments) / duration_seconds

    density_score = min(
        segments_per_second * 5,
        1.0,
    )

    emotional_delivery_count = sum(
        1
        for segment in dialogue_segments
        if segment.delivery
        and any(
            cue in segment.delivery.lower()
            for cue in DRAMATIC_DELIVERY_CUES
        )
    )

    emotional_score = min(
        emotional_delivery_count / 3,
        1.0,
    )

    hook_score = (
        calculate_hook_score(segments, window_start)
        if window_start is not None
        else 0.0
    )

    ending_score = (
        calculate_ending_score(segments, window_end)
        if window_end is not None
        else 0.0
    )

    score = round(
        dialogue_score
        + conflict_score
        + reveal_score
        + density_score
        + hook_score
        + ending_score
        + emotional_score,
        2,
    )

    signals = {
        "dialogue_score": round(dialogue_score, 2),
        "conflict_score": round(conflict_score, 2),
        "reveal_score": round(reveal_score, 2),
        "density_score": round(density_score, 2),
        "hook_score": hook_score,
        "ending_score": ending_score,
        "emotional_score": round(emotional_score, 2),
        "dialogue_ratio": round(dialogue_ratio, 2),
        "conflict_hits": float(conflict_hits),
        "reveal_hits": float(reveal_hits),
        "segment_count": float(len(segments)),
        "segments_per_second": round(segments_per_second, 3),
    }

    return score, signals


# ---------------------------------------------------------
# CANDIDATE GENERATION
# ---------------------------------------------------------

def generate_candidate_clips(
    segments: list[Segment],
    episode_id: str,
    episode_duration_seconds: float | None = None,
    min_segments: int = 2,
) -> list[CandidateClip]:
    """
    Generate possible 20-60 second candidate windows.

    Candidate boundaries are anchored to screenplay element
    start timestamps.

    All overlapping screenplay elements are included.

    Candidate duration represents a timestamp window, not
    verified playable media duration.
    """

    if min_segments < 1:
        raise ValueError("min_segments must be at least 1")

    if (
        episode_duration_seconds is not None
        and episode_duration_seconds <= 0
    ):
        raise ValueError("Episode duration must be positive")

    valid_segments = [
        segment for segment in segments
        if (
            segment.episode_id == episode_id
            and segment.start_seconds is not None
        )
    ]

    valid_segments.sort(
        key=lambda segment: segment.start_seconds
    )

    candidates = []
    seen_windows = set()

    for start_segment in valid_segments:

        window_start = float(start_segment.start_seconds)

        for duration in WINDOW_DURATIONS:

            window_end = window_start + duration

            if (
                episode_duration_seconds is not None
                and window_end > episode_duration_seconds
            ):
                continue

            window_key = (
                round(window_start, 2),
                duration,
            )

            if window_key in seen_windows:
                continue

            seen_windows.add(window_key)

            selected_segments = get_window_segments(
                valid_segments,
                window_start,
                window_end,
            )

            if len(selected_segments) < min_segments:
                continue

            score, signals = calculate_preliminary_score(
                selected_segments,
                duration_seconds=duration,
                window_start=window_start,
                window_end=window_end,
            )

            start_centiseconds = round(window_start * 100)

            candidate = CandidateClip(
                candidate_id=(
                    f"{episode_id}_"
                    f"{start_centiseconds:08d}_"
                    f"{duration}"
                ),
                episode_id=episode_id,
                start_seconds=window_start,
                end_seconds=window_end,
                duration_seconds=duration,
                start_time=seconds_to_timestamp(window_start),
                end_time=seconds_to_timestamp(window_end),
                segment_ids=[
                    segment.segment_id
                    for segment in selected_segments
                ],
                source_line_start=min(
                    segment.source_line_start
                    for segment in selected_segments
                ),
                source_line_end=max(
                    segment.source_line_end
                    for segment in selected_segments
                ),
                boundary_check=validate_candidate_boundaries(
                        selected_segments,
                        window_start,
                        window_end,
                        ),
                
                duration_verified=False,
                preliminary_score=score,
                signals=signals,
            )

            candidates.append(candidate)

    candidates.sort(
        key=lambda candidate: (
            -candidate.preliminary_score,
            candidate.start_seconds,
            candidate.duration_seconds,
        )
    )

    return candidates
