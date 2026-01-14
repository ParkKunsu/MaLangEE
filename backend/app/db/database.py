from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    # 1. 로그 설정 (운영 환경에서는 False로 꺼야 성능 저하 방지)
    echo=True,  

    # 2. 커넥션 풀 크기
    pool_size=20,

    # 3. 최대 오버플로우
    max_overflow=10,

    # 4. 연결 재활용 주기 (초 단위)
    pool_recycle=3600,

    # 5. 연결 생존 확인 
    pool_pre_ping=True,
    
    # 6. 타임아웃
    pool_timeout=30
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
