from pydantic import BaseModel, field_serializer
from datetime import datetime
import uuid


class PathItem(BaseModel):
    title: str
    connection: str


class NextPathItem(BaseModel):
    title: str
    reason: str


class ReadingMapResponse(BaseModel):
    id: uuid.UUID
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
