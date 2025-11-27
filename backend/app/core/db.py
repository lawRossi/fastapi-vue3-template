from sqlalchemy import Engine, create_engine
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from .config import settings


# 创建异步数据库引擎 - 解决pgbouncer事务模式问题
def create_async_db_engine() -> AsyncEngine:
    engine = create_async_engine(
        settings.database_url,
        pool_pre_ping=False,
        echo=False,
        poolclass=NullPool,  # 使用NullPool避免连接池管理问题
        connect_args={
            "server_settings": {
                "jit": "off",  # 禁用JIT编译减少开销
                "application_name": "fastapi_app",
            },
            # pgbouncer兼容性关键配置
            "statement_cache_size": 0,  # 禁用statement cache
            "prepared_statement_cache_size": 0,  # 禁用prepared statement cache
            "prepared_statement_name_func": lambda: "",
        },
    )

    # 在应用启动时调用此初始化
    return engine


def create_sync_db_engine() -> Engine:
    return create_engine(settings.database_url_sync, echo=False)


# 创建引擎实例
engine = create_async_db_engine()

async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)  # type: ignore
