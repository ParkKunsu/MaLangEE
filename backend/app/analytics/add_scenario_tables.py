
import asyncio
from sqlalchemy import text
from app.db.database import engine

async def add_scenario_tables():
    """
    Scenario 관련 테이블 및 컬럼을 수동으로 추가합니다.
    (ScenarioDefinition 테이블 생성 + ConversationSession 컬럼 추가)
    """
    print("Starting Phase 2 Migration...")
    
    async with engine.begin() as conn:
        # 1. ScenarioDefinition 테이블 생성
        # (SQLAlchemy Auto-Create가 동작하지 않는 환경을 대비해 Raw SQL 사용하거나, create_all 호출)
        # 여기서는 create_all을 호출하는게 가장 안전 (Model에 정의되어 있으므로)
        from app.db.models import Base
        # [NEW] SessionAnalytics 모델을 임포트해야 Base.metadata.create_all에서 인식함
        from app.analytics.models import SessionAnalytics 
        
        # [Cleanup] 기존 UserLearningMap 테이블 삭제 (User IDs FK constraint might exist, but cascade should handle or just drop)
        try:
            await conn.execute(text("DROP TABLE IF EXISTS user_learning_map"))
            print("Dropped 'user_learning_map' table (Cleanup).")
        except Exception as e:
            print(f"Error dropping user_learning_map: {e}")

        await conn.run_sync(Base.metadata.create_all)
        print("Created 'scenario_definitions' and 'session_analytics' tables (if not exists).")
        
        # 2. Foreign Key 컬럼 추가
        # create_all은 기존 테이블(conversation_sessions)의 변경사항을 반영하지 않음.
        # 따라서 수동으로 ADD COLUMN 해야 함.
        try:
            await conn.execute(text("ALTER TABLE conversation_sessions ADD COLUMN scenario_id VARCHAR"))
             # SQLite/MySQL/Postgres 호환성 고려하여 VARCHAR 타입 사용 (String)
             # FK 제약조건은 ALTER TABLE ADD CONSTRAINT로 걸어야 하나, SQLite는 제한적임.
             # 일단 컬럼만 추가하여 데이터 저장만 가능하게 함. (ORM 레벨에서 관계 처리)
            print("Added 'scenario_id' column to 'conversation_sessions'.")
        except Exception as e:
            if "duplicate" in str(e).lower() or "exists" in str(e).lower():
                print("Column 'scenario_id' already exists. Skipping.")
            else:
                print(f"Error adding column: {e}")
                
        # 3. Seed Data (기초 데이터) 입력
        try:
             # 임시 Session 생성하여 Seed Data 입력
            from sqlalchemy.orm import Session
            from app.db.models import ScenarioDefinition
            
            # Async 엔진에서 Sync 처리는 run_sync로 해야 함
            await conn.run_sync(insert_seed_data)
            
        except Exception as e:
             print(f"Seed data error: {e}")

def insert_seed_data(connection):
    from sqlalchemy import insert
    from app.db.models import ScenarioDefinition
    
    # 기초 시나리오 데이터
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
    
    # 중복 무시하고 Insert (SQLite: OR IGNORE, PG: ON CONFLICT DO NOTHING)
    # 여기서는 간단히 try-except 래핑보다는, select 후 없으면 insert 하는 로직이 좋으나
    # run_sync 내부라 ORM Session 쓰기가 애매함. Core 레벨 Insert 사용.
    
    # 간단하게: 그냥 시도하고 에러나면 패스 (PK 중복)
    for seed in seeds:
        try:
            connection.execute(insert(ScenarioDefinition).values(**seed))
            print(f"Seeded: {seed['id']}")
        except Exception:
            # PK 중복 등 에러 무시
            pass

if __name__ == "__main__":
    asyncio.run(add_scenario_tables())
