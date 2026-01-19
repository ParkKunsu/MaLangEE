
import sys
import os
import argparse
import asyncio
from sqlalchemy import text
from dotenv import load_dotenv

# Path setup to import app.core.config models
# File is in backend/app/analytics/add_column.py
# We need to add 'backend' to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, backend_dir)

# Load environment variables
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv(os.path.join(backend_dir, ".env.local"))

from app.core.config import settings
from app.db import database 

async def add_is_analyzed_column():
    """
    conversation_sessions 테이블에 is_analyzed 컬럼을 수동으로 추가합니다.
    """
    engine = database.engine
    print(f"Connecting to DB... (SQLite: {settings.USE_SQLITE})")
    print("Adding 'is_analyzed' column to 'conversation_sessions'...")
    
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE conversation_sessions ADD COLUMN is_analyzed BOOLEAN DEFAULT FALSE"))
            print("Successfully added 'is_analyzed' column.")
        except Exception as e:
            if "duplicate" in str(e).lower() or "exists" in str(e).lower():
                print("Column 'is_analyzed' already exists. Skipping.")
            else:
                print(f"Error adding column: {e}")
            
        # [NEW] ChatMessage Columns
        try:
            await conn.execute(text("ALTER TABLE chat_messages ADD COLUMN is_feedback BOOLEAN DEFAULT FALSE"))
            print("Added 'is_feedback' column.")
        except Exception:
            pass
            
        try:
            await conn.execute(text("ALTER TABLE chat_messages ADD COLUMN feedback VARCHAR"))
            # PostgreSQL uses VARCHAR or TEXT. In PG, VARCHAR without length is same as TEXT.
            print("Added 'feedback' column.")
        except Exception:
            pass

        try:
            await conn.execute(text("ALTER TABLE chat_messages ADD COLUMN reason VARCHAR"))
            print("Added 'reason' column.")
        except Exception:
            pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Add is_analyzed and feedback columns")
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
        database.engine = database.create_async_engine(
            settings.DATABASE_URL,
            echo=True,
            isolation_level="AUTOCOMMIT"
        )
    
    asyncio.run(add_is_analyzed_column())
