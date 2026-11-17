
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator


class Segment(BaseModel):
    segment_id: str
    episode_id: str
    scene_id: Optional[str] = None

    # Raw timestamps exactly as provided by the screenplay.
    start_time: Optional[str] = None
    end_time: Optional[str] = None

    # Numeric timestamps, including fractional seconds.
    start_seconds: Optional[float] = Field(default=None, ge=0)
    end_seconds: Optional[float] = Field(default=None, ge=0)

    segment_type: Literal[
        "dialogue",
        "action",
        "camera_direction",
        "scene_description",
        "sound_effect",
        "unknown",
    ] = "unknown"

    speaker: Optional[str] = None
    delivery: Optional[str] = None
    speaker_direction: Optional[str] = None

    content: str

    source_line_start: int = Field(ge=1)
    source_line_end: int = Field(ge=1)

    timing_inferred: bool = False

    @model_validator(mode="after")
    def validate_timestamps(self):
        if (
            self.start_seconds is not None
            and self.end_seconds is not None
            and self.end_seconds < self.start_seconds
        ):
            raise ValueError("end_seconds cannot be before start_seconds")

        if self.source_line_end < self.source_line_start:
            raise ValueError("Invalid source line range")

        return self
