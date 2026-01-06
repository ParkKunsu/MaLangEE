from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MaLangEE Backend"
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # Security (JWT)
    SECRET_KEY: str = "CHANGE_THIS_TO_A_STRONG_SECRET_KEY"  # 프로덕션에서는 반드시 환경변수로 덮어씌워야 함
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 240
    
    # Database
    # 1. 로컬 개발/테스트용: SQLite 사용 (기본값)
    # 2. 배포용: config.sh 및 5-setup_services.sh에서 주입된 환경변수를 통해 PostgreSQL 사용
    
    # DB 타입 선택 (True: SQLite, False: PostgreSQL)
    USE_SQLITE: bool = True

    # PostgreSQL 설정 (환경변수 주입 시 자동 덮어쓰기 됨)
    POSTGRES_USER: str = "malangee_user"
    POSTGRES_PASSWORD: str = "malangee_password"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "malangee"

    @property
    def DATABASE_URL(self) -> str:
        if self.USE_SQLITE:
            return "sqlite+aiosqlite:///./malang_test.db"
        
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
