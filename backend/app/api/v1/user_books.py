from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.book import Book
from app.models.user_book import UserBook
from app.schemas.book import (
    UserBookCreateRequest, UserBookResponse,
    UserBookListResponse, UserBookItem, UserBookUpdateRequest, UserBookUpdateResponse,
    BookSearchItem,
)

router = APIRouter()


@router.post("", response_model=UserBookResponse, status_code=201)
async def add_user_book(
    body: UserBookCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # books 테이블 upsert
    result = await db.execute(select(Book).where(Book.external_id == body.external_id))
    book = result.scalar_one_or_none()
    if not book:
        book = Book(
            external_id=body.external_id,
            title=body.title,
            authors=body.authors,
            thumbnail_url=body.thumbnail_url,
            isbn=body.isbn,
            source=body.source,
        )
        db.add(book)
        await db.flush()

    # 중복 체크
    result = await db.execute(
        select(UserBook).where(UserBook.user_id == current_user.id, UserBook.book_id == book.id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail={"code": "ALREADY_REGISTERED", "message": "이미 등록된 책입니다."})

    user_book = UserBook(user_id=current_user.id, book_id=book.id, status=body.status)
    db.add(user_book)
    await db.commit()
    await db.refresh(user_book)

    return UserBookResponse(user_book_id=str(user_book.id), book_id=str(book.id), status=user_book.status)


@router.get("", response_model=UserBookListResponse)
async def list_user_books(
    status: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(UserBook, Book).join(Book, UserBook.book_id == Book.id).where(UserBook.user_id == current_user.id)
    if status:
        q = q.where(UserBook.status == status)
    result = await db.execute(q)
    rows = result.all()

    books = [
        UserBookItem(
            user_book_id=str(ub.id),
            book=BookSearchItem(
                external_id=b.external_id,
                title=b.title,
                authors=b.authors or [],
                thumbnail_url=b.thumbnail_url,
                source=b.source,
            ),
            status=ub.status,
            created_at=ub.created_at.isoformat(),
        )
        for ub, b in rows
    ]

    # 카운트
    all_q = select(UserBook).where(UserBook.user_id == current_user.id)
    all_result = await db.execute(all_q)
    all_books = all_result.scalars().all()
    counts = {"READ": 0, "READING": 0, "WISHLIST": 0}
    for ub in all_books:
        counts[ub.status] = counts.get(ub.status, 0) + 1

    return UserBookListResponse(books=books, counts=counts)


@router.patch("/{user_book_id}", response_model=UserBookUpdateResponse)
async def update_user_book_status(
    user_book_id: str,
    body: UserBookUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserBook).where(UserBook.id == user_book_id, UserBook.user_id == current_user.id)
    )
    user_book = result.scalar_one_or_none()
    if not user_book:
        raise HTTPException(status_code=403, detail={"code": "FORBIDDEN", "message": "접근 권한이 없습니다."})

    user_book.status = body.status
    await db.commit()
    return UserBookUpdateResponse(user_book_id=str(user_book.id), status=user_book.status)


@router.delete("/{user_book_id}", status_code=204)
async def delete_user_book(
    user_book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserBook).where(UserBook.id == user_book_id, UserBook.user_id == current_user.id)
    )
    user_book = result.scalar_one_or_none()
    if not user_book:
        raise HTTPException(status_code=403, detail={"code": "FORBIDDEN", "message": "접근 권한이 없습니다."})

    await db.delete(user_book)
    await db.commit()
