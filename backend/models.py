# backend/models.py
from pydantic import BaseModel

class UserProgress(BaseModel):
    username: str
    current_level: str
    modules_completed: list[str]
    xp: int
    badges: list[str]
