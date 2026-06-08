import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Integer, ForeignKey, CheckConstraint, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class ReadingMap(Base):
    __tablename__ = "reading_maps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reader_type: Mapped[str | None] = mapped_column(String(100))
    themes: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    keywords: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    current_position: Mapped[str | None] = mapped_column(String(255))
    summary: Mapped[str | None] = mapped_column(Text)
    path_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    next_path_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    ai_model: Mapped[str | None] = mapped_column(String(50))
    book_count: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class ReadingMapBook(Base):
    __tablename__ = "reading_map_books"
    __table_args__ = (
        CheckConstraint("role IN ('INPUT', 'NEXT_RECOMMENDATION')", name="ck_reading_map_books_role"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reading_map_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("reading_maps.id", ondelete="CASCADE"), nullable=False)
    book_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("books.id"), nullable=False)
    sequence_order: Mapped[int | None] = mapped_column(Integer)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
