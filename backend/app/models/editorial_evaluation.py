
from typing import Dict, List

from pydantic import BaseModel, Field, model_validator


class DimensionScore(BaseModel):
    """Score, rationale and supporting screenplay segment IDs."""

    score: float = Field(ge=0, le=10)
    rationale: str = Field(min_length=1)
    evidence_segment_ids: List[str] = Field(default_factory=list)


class EditorialEvaluation(BaseModel):
    """Editorial assessment of one proposed promotional clip."""

    candidate_id: str
    episode_id: str

    hook: str = Field(min_length=1)
    cliffhanger: str = Field(min_length=1)
    why_it_works: str = Field(min_length=1)

    # Evidence specifically supporting the suggested cliffhanger.
    cliffhanger_evidence_segment_ids: List[str] = Field(min_length=1)

    hook_strength: DimensionScore
    emotional_intensity: DimensionScore
    curiosity_gap: DimensionScore
    standalone_readability: DimensionScore
    spoiler_safety: DimensionScore

    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_evidence_ids_are_not_empty_strings(self):
        dimensions = [
            self.hook_strength,
            self.emotional_intensity,
            self.curiosity_gap,
            self.standalone_readability,
            self.spoiler_safety,
        ]

        for dimension in dimensions:
            if any(
                not segment_id.strip()
                for segment_id in dimension.evidence_segment_ids
            ):
                raise ValueError(
                    "Evidence segment IDs cannot be empty strings"
                )

        if any(
            not segment_id.strip()
            for segment_id in self.cliffhanger_evidence_segment_ids
        ):
            raise ValueError(
                "Cliffhanger evidence IDs cannot be empty strings"
            )

        return self


EDITORIAL_WEIGHTS: Dict[str, float] = {
    "hook_strength": 0.25,
    "emotional_intensity": 0.20,
    "curiosity_gap": 0.20,
    "standalone_readability": 0.20,
    "spoiler_safety": 0.15,
}


def calculate_editorial_score(evaluation: EditorialEvaluation) -> float:
    """Calculate the weighted editorial score out of 10."""

    weighted_score = (
        evaluation.hook_strength.score * EDITORIAL_WEIGHTS["hook_strength"]
        + evaluation.emotional_intensity.score * EDITORIAL_WEIGHTS["emotional_intensity"]
        + evaluation.curiosity_gap.score * EDITORIAL_WEIGHTS["curiosity_gap"]
        + evaluation.standalone_readability.score * EDITORIAL_WEIGHTS["standalone_readability"]
        + evaluation.spoiler_safety.score * EDITORIAL_WEIGHTS["spoiler_safety"]
    )

    return round(weighted_score, 2)
