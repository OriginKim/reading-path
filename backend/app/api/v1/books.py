from fastapi import APIRouter, Depends, Query
import httpx

from app.core.config import settings
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.book import BookSearchResponse, BookSearchItem

router = APIRouter()


async def search_kakao(query: str, page: int) -> BookSearchResponse | None:
    url = "https://dapi.kakao.com/v3/search/book"
    headers = {"Authorization": f"KakaoAK {settings.KAKAO_REST_API_KEY}"}
    params = {"query": query, "page": page, "size": 10}

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers, params=params)
    if resp.status_code != 200:
        return None

    data = resp.json()
    books = [
        BookSearchItem(
            external_id=doc.get("isbn", "").split()[-1] or doc["title"],
            title=doc["title"],
            authors=doc.get("authors", []),
            publisher=doc.get("publisher"),
            published_date=doc.get("datetime", "")[:10],
            description=doc.get("contents"),
            thumbnail_url=doc.get("thumbnail"),
            isbn=doc.get("isbn", "").split()[-1],
            source="kakao",
        )
        for doc in data.get("documents", [])
    ]
    return BookSearchResponse(books=books, total=data["meta"]["total_count"], page=page)


async def search_google_books(query: str, page: int) -> BookSearchResponse:
    url = "https://www.googleapis.com/books/v1/volumes"
    params = {"q": query, "key": settings.GOOGLE_BOOKS_API_KEY, "startIndex": (page - 1) * 10, "maxResults": 10}

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params)

    data = resp.json()
    books = []
    for item in data.get("items", []):
        info = item.get("volumeInfo", {})
        books.append(BookSearchItem(
            external_id=item["id"],
            title=info.get("title", ""),
            authors=info.get("authors", []),
            publisher=info.get("publisher"),
            published_date=info.get("publishedDate"),
            description=info.get("description"),
            thumbnail_url=info.get("imageLinks", {}).get("thumbnail"),
            isbn=next((id["identifier"] for id in info.get("industryIdentifiers", []) if "ISBN" in id["type"]), None),
            source="google",
        ))
    return BookSearchResponse(books=books, total=data.get("totalItems", 0), page=page)


@router.get("/search", response_model=BookSearchResponse)
async def search_books(
    query: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    current_user: User = Depends(get_current_user),
):
    result = await search_kakao(query, page)
    if result is None:
        result = await search_google_books(query, page)
    return result
