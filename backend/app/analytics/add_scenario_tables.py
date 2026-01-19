
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

async def add_scenario_tables():
    """
    Scenario 관련 테이블 및 컬럼을 수동으로 추가합니다.
    """
    engine = database.engine
    print(f"Starting Phase 2 Migration... (SQLite: {settings.USE_SQLITE})")
    
    async with engine.begin() as conn:
        # 1. ScenarioDefinition 테이블 생성
        from app.db.models import Base
        from app.analytics.models import Base as AnalyticsBase # Assuming models use same Base or need separate import
        # Note: In Step 32, analytics models import Base from app.db.models. So just importing app.db.models and app.analytics.models is enough.
        # But we need to make sure the modules are imported so the metadata is populated.
        import app.analytics.models 
        
        # [Cleanup]
        try:
            await conn.execute(text("DROP TABLE IF EXISTS user_learning_map"))
            print("Dropped 'user_learning_map' table (Cleanup).")
        except Exception as e:
            print(f"Error dropping user_learning_map: {e}")

        await conn.run_sync(Base.metadata.create_all)
        print("Created 'scenario_definitions' and 'session_analytics' tables (if not exists).")
        
        # 2. Foreign Key 컬럼 추가
        try:
            await conn.execute(text("ALTER TABLE conversation_sessions ADD COLUMN scenario_id VARCHAR"))
            print("Added 'scenario_id' column to 'conversation_sessions'.")
        except Exception as e:
            if "duplicate" in str(e).lower() or "exists" in str(e).lower():
                print("Column 'scenario_id' already exists. Skipping.")
            else:
                print(f"Error adding column 'scenario_id': {e}")
                
        # 3. Seed Data
        try:
            await conn.run_sync(insert_seed_data)
        except Exception as e:
             print(f"Seed data error: {e}")

def insert_seed_data(connection):
    from sqlalchemy import insert
    from app.db.models import ScenarioDefinition
    
    seeds = [
        {
            "id": "airport_checkin",
            "title": "공항 체크인 (Airport Check-in)",
            "description": "공항 체크인 카운터에서 창가 좌석을 요청하고 수하물을 부쳐보세요.",
            "place": "Airport Check-in Counter",
            "partner": "Check-in Agent",
            "goal": "Get a window seat and check baggage",
            "level": 1,
            "category": "Travel"
        },
        {
            "id": "cafe_order",
            "title": "카페 주문 (Cafe Ordering)",
            "description": "스타벅스에서 아이스 아메리카노를 주문하고 커스텀 옵션을 추가해보세요.",
            "place": "Starbucks Counter",
            "partner": "Busy Barista",
            "goal": "Order an Iced Americano with minimal ice",
            "level": 1,
            "category": "Daily"
        }
    ]
    
    for seed in seeds:
        try:
            connection.execute(insert(ScenarioDefinition).values(**seed))
            print(f"Seeded: {seed['id']}")
        except Exception:
            pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Add scenario tables and seed data")
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
    
    asyncio.run(add_scenario_tables())
