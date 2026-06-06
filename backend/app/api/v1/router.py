from fastapi import APIRouter
from app.api.v1 import auth, books, user_books, reading_maps

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(books.router, prefix="/books", tags=["books"])
router.include_router(user_books.router, prefix="/user-books", tags=["user-books"])
router.include_router(reading_maps.router, prefix="/reading-maps", tags=["reading-maps"])
