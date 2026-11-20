from pydantic_settings import BaseSettings
from typing import Optional, List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "LAX360 Billing Software API"
    API_V1_STR: str = "/api/v1"
    
    MONGODB_URI: Optional[str] = os.getenv("MONGODB_URI", "")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "lax360_db")
    
    JWT_SECRET: str = os.getenv("JWT_SECRET", "lax360_super_secret_jwt_key_2026_production_grade")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
