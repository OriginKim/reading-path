from pydantic import BaseModel


class BookSearchItem(BaseModel):
    external_id: str
    title: str
    authors: list[str]
    publisher: str | None = None
    published_date: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    isbn: str | None = None
    source: str = "kakao"


class BookSearchResponse(BaseModel):
    books: list[BookSearchItem]
    total: int
    page: int


class UserBookCreateRequest(BaseModel):
    external_id: str
    title: str
    authors: list[str]
    thumbnail_url: str | None = None
    isbn: str | None = None
    source: str = "kakao"
    status: str


class UserBookResponse(BaseModel):
    user_book_id: str
    book_id: str
    status: str


class UserBookItem(BaseModel):
    user_book_id: str
    book: BookSearchItem
    status: str
    created_at: str


class UserBookListResponse(BaseModel):
    books: list[UserBookItem]
    counts: dict[str, int]


class UserBookUpdateRequest(BaseModel):
    status: str


class UserBookUpdateResponse(BaseModel):
    user_book_id: str
    status: str
