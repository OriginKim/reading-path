from pydantic import BaseModel
from datetime import datetime


class PathItem(BaseModel):
    title: str
    connection: str


class NextPathItem(BaseModel):
    title: str
    reason: str


class ReadingMapResponse(BaseModel):
    id: str
    reader_type: str | None
    themes: list[str]
    keywords: list[str]
    current_position: str | None
    summary: str | None
    path_json: list[PathItem]
    next_path_json: list[NextPathItem]
    ai_model: str | None
    book_count: int | None
    created_at: datetime

    class Config:
        from_attributes = True
