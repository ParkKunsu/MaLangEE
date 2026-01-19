
import sys
import os
import argparse
import asyncio
from sqlalchemy import text
from dotenv import load_dotenv

# Path setup
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, backend_dir)

# Load environment variables
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv(os.path.join(backend_dir, ".env.local"))

from app.core.config import settings
from app.db import database 

async def remove_feedback_column():
    engine = database.engine
    print(f"Removing 'feedback' column... (SQLite: {settings.USE_SQLITE})")
    
    async with engine.begin() as conn:
        try:
            # Using IF EXISTS to avoid error if already removed
            # Note: SQLite restriction on DROP COLUMN in older versions might apply, 
            # but we assume user env (Postgres or Modern SQLite) supports it or handles it via tool.
            await conn.execute(text("ALTER TABLE conversation_sessions DROP COLUMN IF EXISTS feedback"))
            print("Column 'feedback' removed successfully (if it existed).")
        except Exception as e:
            print(f"Error removing column: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Remove feedback column")
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
            
        database.engine = database.create_async_engine(
            settings.DATABASE_URL,
            echo=True,
            isolation_level="AUTOCOMMIT"
        )
    
    asyncio.run(remove_feedback_column())
