import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Lax360 Billing"
    MONGODB_URI: str = "mongodb+srv://jai890ai_db_user:jjp@lax360.oohnpcn.mongodb.net/lax360_billing1?retryWrites=true&w=majority&appName=lax360"
    DATABASE_NAME: str = "lax360_billing1"
    JWT_SECRET: str = "lax360-super-secret-jwt-key-2026-production-ready-universal-billing"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    USE_IN_MEMORY_FALLBACK: bool = True
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://textile-billing-chi.vercel.app"
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
