from pydantic import BaseModel, EmailStr


class GoogleAuthRequest(BaseModel):
    provider_id: str
    email: EmailStr
    name: str | None = None
    profile_image: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
