from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    KAKAO_REST_API_KEY: str
    GOOGLE_BOOKS_API_KEY: str
    GEMINI_API_KEY: str
    JWT_SECRET: str
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    ENV: str = "development"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()  # type: ignore[call-arg]
