from typing import List
from pydantic import BaseModel, Field


class StoryEvent(BaseModel):
    event_id: str
    show_id: str
    episode_id: str

    description: str

    character_ids: List[str] = Field(default_factory=list)
    source_segment_ids: List[str] = Field(default_factory=list)

    event_type: str = "unknown"