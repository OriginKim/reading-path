from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt
from datetime import datetime, timedelta

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import GoogleAuthRequest, AuthResponse, UserResponse

router = APIRouter()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expire}, settings.JWT_SECRET, algorithm=ALGORITHM)


@router.post("/google", response_model=AuthResponse)
async def google_auth(body: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.provider_id == body.provider_id))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=body.email,
            name=body.name,
            profile_image=body.profile_image,
            provider="google",
            provider_id=body.provider_id,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token(str(user.id))
    return AuthResponse(
        user=UserResponse(id=str(user.id), email=user.email, name=user.name),
        access_token=token,
    )
