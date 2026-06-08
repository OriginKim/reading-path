from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.user_book import UserBook
from app.models.book import Book
from app.models.reading_map import ReadingMap, ReadingMapBook
from app.schemas.reading_map import ReadingMapResponse
from app.services.ai_analysis import analyze_with_ai

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/generate", response_model=ReadingMapResponse, status_code=201)
@limiter.limit("5/day")
async def generate_reading_map(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # READ 상태 책 조회
    result = await db.execute(
        select(UserBook, Book)
        .join(Book, UserBook.book_id == Book.id)
        .where(UserBook.user_id == current_user.id, UserBook.status == "READ")
    )
    rows = result.all()

    if len(rows) < 3:
        raise HTTPException(
            status_code=422,
            detail={"code": "INSUFFICIENT_BOOKS", "message": "READ 상태의 책이 3권 이상 필요합니다."},
        )

    books_data = [
        {
            "title": b.title,
            "authors": b.authors or [],
            "description": b.description or "",
        }
        for _, b in rows
    ]

    ai_result = await analyze_with_ai(books_data)

    reading_map = ReadingMap(
        user_id=current_user.id,
        reader_type=ai_result.get("readerType"),
        themes=ai_result.get("themes", []),
        keywords=ai_result.get("keywords", []),
        current_position=ai_result.get("currentPosition"),
        summary=ai_result.get("summary"),
        path_json=ai_result.get("path", []),
        next_path_json=ai_result.get("nextPath", []),
        ai_model="gemini-1.5-flash",
        book_count=len(rows),
    )
    db.add(reading_map)
    await db.flush()

    for i, (ub, b) in enumerate(rows):
        db.add(ReadingMapBook(
            reading_map_id=reading_map.id,
            book_id=b.id,
            sequence_order=i,
            role="INPUT",
        ))

    await db.commit()
    await db.refresh(reading_map)
    return reading_map


@router.get("/latest", response_model=ReadingMapResponse)
async def get_latest_reading_map(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReadingMap)
        .where(ReadingMap.user_id == current_user.id)
        .order_by(ReadingMap.created_at.desc())
        .limit(1)
    )
    reading_map = result.scalar_one_or_none()
    if not reading_map:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "생성된 독서 지도가 없습니다."})
    return reading_map
