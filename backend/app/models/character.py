from typing import List
from pydantic import BaseModel, Field


class Character(BaseModel):
    character_id: str
    show_id: str

    name: str
    aliases: List[str] = Field(default_factory=list)

    description: str = ""