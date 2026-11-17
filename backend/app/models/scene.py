
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class Scene(BaseModel):
    scene_id: str
    episode_id: str

    scene_number: int = Field(ge=1)
    scene_heading: str

    start_time: Optional[str] = None
    end_time: Optional[str] = None

    start_seconds: Optional[float] = Field(default=None, ge=0)
    end_seconds: Optional[float] = Field(default=None, ge=0)

    segment_ids: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_timestamps(self):
        if (
            self.start_seconds is not None
            and self.end_seconds is not None
            and self.end_seconds < self.start_seconds
        ):
            raise ValueError("Scene end cannot precede scene start")

        return self
