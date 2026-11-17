
import os
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.models.candidate import CandidateClip
from app.models.episode import Episode
from app.models.editorial_evaluation import (
    EditorialEvaluation,
    calculate_editorial_score,
)
from app.models.segment import Segment


load_dotenv()

DEFAULT_MODEL = "gemini-3.8-flash"
HOOK_WINDOW_SECONDS = 3.0
CLIFFHANGER_WINDOW_SECONDS = 3.0


class GeminiEvaluatorError(Exception):
    """Raised when Gemini evaluation fails or returns invalid evidence."""


def build_candidate_context(
    candidate: CandidateClip,
    episode: Episode,
) -> list[Segment]:
    """Resolve candidate segment IDs to original screenplay segments."""

    segments_by_id = {
        segment.segment_id: segment
        for segment in episode.segments
    }

    missing_ids = [
        segment_id
        for segment_id in candidate.segment_ids
        if segment_id not in segments_by_id
    ]

    if missing_ids:
        raise GeminiEvaluatorError(
            f"Candidate references unknown segment IDs: {missing_ids}"
        )

    segments = [
        segments_by_id[segment_id]
        for segment_id in candidate.segment_ids
    ]

    return sorted(
        segments,
        key=lambda segment: (
            segment.start_seconds
            if segment.start_seconds is not None
            else float("inf")
        ),
    )


def segment_overlaps_interval(
    segment: Segment,
    interval_start: float,
    interval_end: float,
) -> bool:
    """Check whether a timestamped segment overlaps an interval."""

    if (
        segment.start_seconds is None
        or segment.end_seconds is None
    ):
        return False

    return (
        segment.start_seconds < interval_end
        and segment.end_seconds > interval_start
    )


def build_temporal_context(
    candidate: CandidateClip,
    segments: list[Segment],
) -> dict[str, list[Segment]]:
    """Separate opening, middle, ending and unplaced segments."""

    start = candidate.start_seconds
    end = candidate.end_seconds

    opening_end = start + HOOK_WINDOW_SECONDS
    ending_start = end - CLIFFHANGER_WINDOW_SECONDS

    if opening_end >= ending_start:
        raise GeminiEvaluatorError(
            "Candidate is too short for separate opening and ending windows."
        )

    regions = {
        "opening_hook": [],
        "main_story": [],
        "ending_cliffhanger": [],
        "unplaced": [],
    }

    for segment in segments:

        if (
            segment.start_seconds is None
            or segment.end_seconds is None
        ):
            regions["unplaced"].append(segment)
            continue

        if segment_overlaps_interval(
            segment, start, opening_end
        ):
            regions["opening_hook"].append(segment)

        if segment_overlaps_interval(
            segment, opening_end, ending_start
        ):
            regions["main_story"].append(segment)

        if segment_overlaps_interval(
            segment, ending_start, end
        ):
            regions["ending_cliffhanger"].append(segment)

    return regions


def format_segments(
    segments: list[Segment],
    interval_start: float,
    interval_end: float,
    candidate: CandidateClip,
) -> str:
    """
    Include actual overlap intervals and flag segments that continue
    beyond the candidate's start or end boundaries.
    """

    if not segments:
        return "No screenplay segments overlap this interval."

    formatted = []

    for segment in segments:

        if (
            segment.start_seconds is None
            or segment.end_seconds is None
        ):
            formatted.append(
                "\n".join(
                    [
                        f"Segment ID: {segment.segment_id}",
                        f"Type: {segment.segment_type}",
                        f"Content: {segment.content}",
                        "Timing: unavailable",
                    ]
                )
            )
            continue

        overlap_start = max(
            segment.start_seconds,
            interval_start,
        )

        overlap_end = min(
            segment.end_seconds,
            interval_end,
        )

        clipped_at_candidate_start = (
            segment.start_seconds < candidate.start_seconds
        )

        clipped_at_candidate_end = (
            segment.end_seconds > candidate.end_seconds
        )

        formatted.append(
            "\n".join(
                [
                    f"Segment ID: {segment.segment_id}",
                    f"Type: {segment.segment_type}",
                    f"Speaker: {segment.speaker or 'N/A'}",
                    f"Delivery: {segment.delivery or 'N/A'}",
                    f"Speaker direction: {segment.speaker_direction or 'N/A'}",
                    (
                        f"Original interval: "
                        f"{segment.start_time or 'N/A'} - "
                        f"{segment.end_time or 'N/A'}"
                    ),
                    (
                        f"Overlap with requested region: "
                        f"{overlap_start:.2f} - "
                        f"{overlap_end:.2f} seconds"
                    ),
                    (
                        "Continues before candidate start: "
                        f"{clipped_at_candidate_start}"
                    ),
                    (
                        "Continues after candidate end: "
                        f"{clipped_at_candidate_end}"
                    ),
                    (
                        f"Source lines: "
                        f"{segment.source_line_start}-"
                        f"{segment.source_line_end}"
                    ),
                    f"Content: {segment.content}",
                ]
            )
        )

    return "\n\n".join(formatted)


def build_prompt(
    candidate: CandidateClip,
    episode: Episode,
    segments: list[Segment],
) -> str:
    """Build the temporally structured editorial evaluation prompt."""

    regions = build_temporal_context(candidate, segments)

    opening_start = candidate.start_seconds
    opening_end = opening_start + HOOK_WINDOW_SECONDS

    ending_start = (
        candidate.end_seconds - CLIFFHANGER_WINDOW_SECONDS
    )
    ending_end = candidate.end_seconds

    main_start = opening_end
    main_end = ending_start

    opening_context = format_segments(
        regions["opening_hook"],
        opening_start,
        opening_end,
        candidate,
    )

    main_context = format_segments(
        regions["main_story"],
        main_start,
        main_end,
        candidate,
    )

    ending_context = format_segments(
        regions["ending_cliffhanger"],
        ending_start,
        ending_end,
        candidate,
    )

    unplaced_context = format_segments(
        regions["unplaced"],
        candidate.start_seconds,
        candidate.end_seconds,
        candidate,
    )

    return f"""
You are an experienced short-form drama promotion editor.

Evaluate one proposed promotional clip using ONLY the screenplay
information supplied below.

EPISODE INFORMATION

Episode number: {episode.episode_number}
Episode logline: {episode.logline}
Continuity notes: {episode.continuity_notes}

CANDIDATE INFORMATION

Candidate ID: {candidate.candidate_id}
Episode ID: {candidate.episode_id}
Start: {candidate.start_time}
End: {candidate.end_time}
Duration: {candidate.duration_seconds} seconds

TEMPORAL SCREENPLAY CONTEXT

REGION 1 — OPENING HOOK
First three seconds: {opening_start:.2f} to {opening_end:.2f}.

{opening_context}

REGION 2 — MAIN STORY
Middle section: {main_start:.2f} to {main_end:.2f}.

{main_context}

REGION 3 — ENDING CLIFFHANGER
Final three seconds: {ending_start:.2f} to {ending_end:.2f}.

{ending_context}

SEGMENTS WITH INCOMPLETE TIMING

{unplaced_context}

EDITORIAL EVALUATION CRITERIA

Score each dimension from 0 to 10.

1. hook_strength:
Judge the opening primarily from REGION 1.
Does it create immediate interest within the first three seconds?

2. emotional_intensity:
Does the complete candidate communicate strong emotions,
conflict, tension, or stakes?

3. curiosity_gap:
Does the complete candidate create a compelling unanswered
question or make viewers want to know what happens next?

4. standalone_readability:
Can someone unfamiliar with the series understand the basic
situation, relationships, and conflict?

5. spoiler_safety:
Does the candidate create interest without revealing too much?
A higher score means better spoiler safety.

IMPORTANT RULES

- Evaluate this as a screenplay-based proposal, not finished video.
- Do not claim to observe actual acting, facial expressions, music,
  editing, or camera execution.
- Camera directions are written screenplay instructions, not proof
  of how the finished footage looks.
- Do not invent dialogue, events, characters, relationships, or facts.
- Hook and cliffhanger are suggested promotional copy, not necessarily
  verbatim screenplay quotations.
- Every evidence ID must exactly match a supplied Segment ID.
- hook_strength evidence must come from REGION 1.
- cliffhanger_evidence_segment_ids must come from REGION 3.
- Cliffhanger evidence must support the actual suggested cliffhanger.
- Pay attention to segments continuing beyond candidate boundaries.
- If dialogue is cut off by the candidate end, do not assume its
  complete sentence is heard in the proposed clip.
- A cut-off sentence is not automatically a strong cliffhanger.
- Prefer an actual unresolved dramatic beat over an arbitrary cut.
- If the ending is weak, acknowledge that honestly.
- Do not reward a candidate merely for having many segments.
- Explain weak dimensions rather than inflating their scores.

Return the requested structured evaluation.
""".strip()


class GeminiEvaluator:
    """Calls Gemini to evaluate screenplay-based promotional candidates."""

    def __init__(self, model_name: str | None = None):
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise GeminiEvaluatorError(
                "GEMINI_API_KEY is missing. Check your backend .env file."
            )

        self.model_name = (
            model_name
            or os.getenv("GEMINI_MODEL")
            or DEFAULT_MODEL
        )

        self.client = genai.Client(api_key=api_key)

    def evaluate(
        self,
        candidate: CandidateClip,
        episode: Episode,
    ) -> EditorialEvaluation:

        if candidate.episode_id != episode.episode_id:
            raise GeminiEvaluatorError(
                "Candidate episode_id does not match the supplied episode."
            )

        segments = build_candidate_context(candidate, episode)

        if not segments:
            raise GeminiEvaluatorError(
                "Candidate has no screenplay segments to evaluate."
            )

        prompt = build_prompt(
            candidate,
            episode,
            segments,
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    response_mime_type="application/json",
                    response_schema=EditorialEvaluation,
                ),
            )

        except Exception as exc:
            raise GeminiEvaluatorError(
                f"Gemini API request failed: {exc}"
            ) from exc

        try:
            parsed: Any = response.parsed

            if isinstance(parsed, EditorialEvaluation):
                evaluation = parsed

            elif parsed is not None:
                evaluation = EditorialEvaluation.model_validate(parsed)

            elif response.text:
                evaluation = EditorialEvaluation.model_validate_json(
                    response.text
                )

            else:
                raise GeminiEvaluatorError(
                    "Gemini returned an empty response."
                )

        except Exception as exc:
            raise GeminiEvaluatorError(
                f"Could not validate Gemini's structured response: {exc}"
            ) from exc

        self._validate_evaluation(
            evaluation,
            candidate,
            segments,
        )

        return evaluation

    @staticmethod
    def _validate_evaluation(
        evaluation: EditorialEvaluation,
        candidate: CandidateClip,
        segments: list[Segment],
    ) -> None:

        if evaluation.candidate_id != candidate.candidate_id:
            raise GeminiEvaluatorError(
                "Gemini returned the wrong candidate_id."
            )

        if evaluation.episode_id != candidate.episode_id:
            raise GeminiEvaluatorError(
                "Gemini returned the wrong episode_id."
            )

        valid_ids = {
            segment.segment_id
            for segment in segments
        }

        regions = build_temporal_context(
            candidate,
            segments,
        )

        opening_ids = {
            segment.segment_id
            for segment in regions["opening_hook"]
        }

        ending_ids = {
            segment.segment_id
            for segment in regions["ending_cliffhanger"]
        }

        dimensions = {
            "hook_strength": evaluation.hook_strength,
            "emotional_intensity": evaluation.emotional_intensity,
            "curiosity_gap": evaluation.curiosity_gap,
            "standalone_readability": evaluation.standalone_readability,
            "spoiler_safety": evaluation.spoiler_safety,
        }

        for name, dimension in dimensions.items():

            if not dimension.evidence_segment_ids:
                raise GeminiEvaluatorError(
                    f"{name} has no supporting evidence IDs."
                )

            cited_ids = set(dimension.evidence_segment_ids)

            invalid_ids = cited_ids - valid_ids

            if invalid_ids:
                raise GeminiEvaluatorError(
                    f"{name} cites unknown segment IDs: "
                    f"{sorted(invalid_ids)}"
                )

            if name == "hook_strength":
                invalid_region_ids = cited_ids - opening_ids

                if invalid_region_ids:
                    raise GeminiEvaluatorError(
                        "Hook evidence must come from the opening "
                        "three-second region: "
                        f"{sorted(invalid_region_ids)}"
                    )

        cliffhanger_ids = set(
            evaluation.cliffhanger_evidence_segment_ids
        )

        if not cliffhanger_ids:
            raise GeminiEvaluatorError(
                "Cliffhanger has no supporting evidence IDs."
            )

        invalid_cliffhanger_ids = cliffhanger_ids - ending_ids

        if invalid_cliffhanger_ids:
            raise GeminiEvaluatorError(
                "Cliffhanger evidence must come from the final "
                "three-second region: "
                f"{sorted(invalid_cliffhanger_ids)}"
            )

    def evaluate_with_score(
        self,
        candidate: CandidateClip,
        episode: Episode,
    ) -> tuple[EditorialEvaluation, float]:

        evaluation = self.evaluate(
            candidate,
            episode,
        )

        return (
            evaluation,
            calculate_editorial_score(evaluation),
        )
