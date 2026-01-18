"""
MaLangEE DB Column Addition Script

이 스크립트는 'conversation_sessions' 테이블에 'feedback' 및 'scenario_summary' 컬럼을 수동으로 추가합니다.
운영 환경(PostgreSQL) 또는 로컬 환경(SQLite) 모두 지원합니다.

사용 예시:
python scripts/add_feedback_columns.py --production --db-name malangee --db-user malangee_user --db-password "password"
"""
import sys
import os
import argparse
import asyncio
from sqlalchemy import text
from dotenv import load_dotenv

# Path setup to import app.core.config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv(os.path.join(backend_dir, ".env.local"))

from app.core.config import settings
from app.db.database import engine

async def add_columns():
    """
    conversation_sessions 테이블에 컬럼이 없으면 추가합니다.
    """
    add_feedback_sql = "ALTER TABLE conversation_sessions ADD COLUMN feedback TEXT;"
    add_summary_sql = "ALTER TABLE conversation_sessions ADD COLUMN scenario_summary TEXT;"
    
    # DB 종류 확인 (settings.USE_SQLITE가 True면 SQLite, 아니면 PostgreSQL 추정)
    # 하지만 여기서는 SQL 호환성을 위해 기본적인 ALTER TABLE 구문을 사용.
    # PostgreSQL의 경우 IF NOT EXISTS가 ALTER TABLE ADD COLUMN에는 직접 지원되지 않음(9.6+).
    # 따라서 예외 처리를 통해 "이 이미 존재함" 에러를 무시하는 전략 사용.

    print(f"Connecting to DB... (SQLite: {settings.USE_SQLITE})")
    
    async with engine.begin() as conn:
        print("Checking/Adding 'feedback' column...")
        try:
            await conn.execute(text(add_feedback_sql))
            print("-> 'feedback' column added.")
        except Exception as e:
            if "duplicate column" in str(e) or "already exists" in str(e):
                print("-> 'feedback' column already exists.")
            else:
                print(f"-> Failed to add 'feedback': {e}")

        print("Checking/Adding 'scenario_summary' column...")
        try:
            await conn.execute(text(add_summary_sql))
            print("-> 'scenario_summary' column added.")
        except Exception as e:
            if "duplicate column" in str(e) or "already exists" in str(e):
                print("-> 'scenario_summary' column already exists.")
            else:
                print(f"-> Failed to add 'scenario_summary': {e}")
                
    print("\nModification completed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Add feedback columns to MaLangEE DB")
    parser.add_argument("--production", action="store_true", help="Force use of production database (PostgreSQL)")
    parser.add_argument("--db-name", type=str, help="Database name")
    parser.add_argument("--db-user", type=str, help="Database user")
    parser.add_argument("--db-password", type=str, help="Database password")
    parser.add_argument("--db-host", type=str, help="Database host", default="localhost")
    parser.add_argument("--db-port", type=str, help="Database port", default="5432")

    args = parser.parse_args()

    if args.production:
        print("Switching to PRODUCTION mode (PostgreSQL)")
        settings.USE_SQLITE = False
        
        if args.db_name:
            settings.POSTGRES_DB = args.db_name
        if args.db_user:
            settings.POSTGRES_USER = args.db_user
        if args.db_password:
            settings.POSTGRES_PASSWORD = args.db_password
        if args.db_host:
            settings.POSTGRES_SERVER = args.db_host
        if args.db_port:
            settings.POSTGRES_PORT = args.db_port
            
        # Re-initialize engine with new settings
        from app.db import database
        database.engine = database.create_async_engine(
            settings.DATABASE_URL,
            echo=True
        )
        global engine
        engine = database.engine

    asyncio.run(add_columns())
