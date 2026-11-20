
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    PROJECT_NAME: str = "Lax360 Billing"

    # Supply these through backend environment variables
    MONGODB_URI: str
    DATABASE_NAME: str = "lax360_billing1"

    # Never hardcode production secrets
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    USE_IN_MEMORY_FALLBACK: bool = True

    BACKEND_CORS_ORIGINS: List[str] = [
        "*",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "https://common-billing.vercel.app"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
