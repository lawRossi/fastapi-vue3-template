import os
from urllib.parse import urlparse

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase配置
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    supabase_db_password: str = os.getenv("SUPABASE_DB_PASSWORD", "")

    supabase_jwt_secret: str = os.getenv("SUPABASE_JWT_SECRET", "")

    # 服务器配置
    host: str = os.getenv("HOST", "0.0.0.0")  # noqa: S104
    port: int = int(os.getenv("PORT", "8000"))

    class Config:  # noqa: D106
        env_file = ".env.local"

    @property
    def database_url(self) -> str:
        """异步数据库连接URL"""
        parsed_url = urlparse(self.supabase_url)
        project_id = parsed_url.netloc.split(".")[0]
        return f"postgresql+asyncpg://postgres.{project_id}:{self.supabase_db_password}@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"

    @property
    def database_url_sync(self) -> str:
        """同步数据库连接URL"""
        parsed_url = urlparse(self.supabase_url)
        project_id = parsed_url.netloc.split(".")[0]
        return f"postgresql://postgres.{project_id}:{self.supabase_db_password}@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"


settings = Settings()
