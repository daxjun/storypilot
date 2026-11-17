
from math import isclose
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


class CandidateClip(BaseModel):
    candidate_id: str
    episode_id: str

    start_seconds: float = Field(ge=0)
    end_seconds: float = Field(gt=0)

    # Candidate windows are currently generated in whole seconds.
    duration_seconds: int = Field(ge=20, le=60)

    start_time: str
    end_time: str

    segment_ids: list[str] = Field(default_factory=list)

    source_line_start: int = Field(ge=1)
    source_line_end: int = Field(ge=1)

    duration_basis: Literal["timestamp_window"] = "timestamp_window"
    duration_verified: bool = False

    preliminary_score: float = Field(default=0, ge=0, le=10)

    signals: dict[str, float] = Field(default_factory=dict)

    boundary_check: dict[str, Any] = Field(
        default_factory=lambda: {
            "status": "not_checked",
            "warnings": [],
        }
    )

    @model_validator(mode="after")
    def validate_candidate(self):
        actual_span = self.end_seconds - self.start_seconds

        if not isclose(
            actual_span,
            self.duration_seconds,
            abs_tol=0.001,
        ):
            raise ValueError(
                "duration_seconds must equal "
                "end_seconds - start_seconds"
            )

        if self.end_seconds <= self.start_seconds:
            raise ValueError("Candidate end must follow its start")

        if self.source_line_end < self.source_line_start:
            raise ValueError("Invalid source line range")

        return self
