
import asyncio
from sqlalchemy import text
from app.db.database import engine

async def add_is_analyzed_column():
    """
    conversation_sessions 테이블에 is_analyzed 컬럼을 수동으로 추가합니다.
    (Alembic이 없는 환경에서 사용하는 임시 마이그레이션 스크립트)
    """
    print("Adding 'is_analyzed' column to 'conversation_sessions'...")
    
    async with engine.begin() as conn:
        try:
            # SQLite에서는 IF NOT EXISTS가 ALTER TABLE에 지원되지 않는 경우가 많으나
            # PostgreSQL/MySQL 등에서는 바로 추가 시도 후 에러 처리하거나
            # 시스템 테이블 조회로 확인해야 함.
            # 여기서는 간단히 ALTER TABLE 실행하고, 이미 있으면 에러 무시하는 방식 사용
            
            # NOTE: 사용하시는 DB가 SQLite라면 ALTER TABLE ADD COLUMN이 제한적일 수 있음.
            # 하지만 boolean default false는 보통 지원됨.
            # 만약 PostgreSQL이라면 IF NOT EXISTS 구문이 없음 (프로시저 필요).
            # 가장 무식하지만 확실한 방법: try-except
            
            await conn.execute(text("ALTER TABLE conversation_sessions ADD COLUMN is_analyzed BOOLEAN DEFAULT FALSE"))
            print("Successfully added 'is_analyzed' column.")
            
            # [NEW] ChatMessage Columns
            try:
                await conn.execute(text("ALTER TABLE chat_messages ADD COLUMN is_feedback BOOLEAN DEFAULT FALSE"))
                print("Added 'is_feedback' column.")
            except Exception:
                pass
                
            try:
                await conn.execute(text("ALTER TABLE chat_messages ADD COLUMN feedback VARCHAR"))
                print("Added 'feedback' column.")
            except Exception:
                pass

            try:
                await conn.execute(text("ALTER TABLE chat_messages ADD COLUMN reason VARCHAR"))
                print("Added 'reason' column.")
            except Exception:
                pass
            
        except Exception as e:
            if "duplicate" in str(e).lower() or "exists" in str(e).lower():
                print("Column 'is_analyzed' already exists. Skipping.")
            else:
                print(f"Error adding column: {e}")

if __name__ == "__main__":
    asyncio.run(add_is_analyzed_column())
