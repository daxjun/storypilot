
from typing import List

from pydantic import BaseModel, Field

from app.models.segment import Segment
from app.models.scene import Scene


class Episode(BaseModel):
    episode_id: str
    show_id: str
    episode_number: int
    filename: str

    logline: str = ""
    continuity_notes: str = ""

    scenes: List[Scene] = Field(default_factory=list)
    segments: List[Segment] = Field(default_factory=list)

    metadata: dict = Field(default_factory=dict)
