from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # 数据库配置
    database_url: str = "sqlite:///./movie_booking.db"
    
    # Redis配置
    redis_url: str = "redis://localhost:6379"
    
    # JWT配置
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS配置
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://frontend:3000"
    ]
    
    # 应用配置
    app_name: str = "电影选座系统"
    version: str = "1.0.0"
    debug: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()