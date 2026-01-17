"""
MaLangEE Mock Data Generation Script

이 스크립트는 DB에 테스트용 세션과 메시지 데이터를 생성합니다.

사용 예시 (Usage Examples):

1. 로컬 개발 환경 (Local Development - SQLite):
   poetry run python scripts/generate_mock_data.py --user-id 1

2. 배포 서버 / 운영 환경 (Production - PostgreSQL):
   # 직접 DB 정보를 입력하여 실행 (가장 확실한 방법)
   poetry run python scripts/generate_mock_data.py \
     --user-id guest \
     --production \
     --db-name malangee \
     --db-user malangee_user \
     --db-password "실제_DB_비밀번호" \
     --db-host localhost \
     --db-port 5432

참고: --user-id는 사용자의 숫자 ID(PK) 또는 로그인 ID(문자열) 모두 지원합니다.
"""
import asyncio
import argparse
import sys
import os
import uuid
import random
from datetime import datetime, timedelta

# Fix path priority: Insert backend directory at the BEGINNING of sys.path
# This ensures 'app' package is loaded from backend/app, not ai-engine/app.py
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

# Load environment variables from .env and .env.local explicitly
# This must be done BEFORE importing app.core.config
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv(os.path.join(backend_dir, ".env.local"))

from faker import Faker
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import AsyncSessionLocal, engine
from app.db.models import ConversationSession, ChatMessage, User, Base

fake = Faker('ko_KR')  # Use Korean locale

async def get_user_id(db: AsyncSession, user_identifier: str):
    """
    Resolves a user identifier to a database ID.
    Accepts numeric ID string or login_id.
    """
    if not user_identifier:
        return None
    
    # If it's a digit, assume it's the Primary Key ID
    if user_identifier.isdigit():
        return int(user_identifier)
        
    # Otherwise, try to find by login_id
    print(f"Looking up user by login_id: {user_identifier}")
    result = await db.execute(select(User).where(User.login_id == user_identifier))
    user = result.scalars().first()
    
    if user:
        return user.id
    else:
        print(f"Warning: User with login_id='{user_identifier}' not found.")
        return None

async def create_mock_data(user_identifier: str = None, session_count: int = 10, messages_per_session: int = 40):
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as db:
        # Resolve real user_id
        real_user_id = await get_user_id(db, user_identifier)
        
        print(f"Starting mock data generation...")
        print(f"Target Identifier: {user_identifier}")
        print(f"Resolved User ID: {real_user_id if real_user_id else 'None (Anonymous)'}")
        print(f"Sessions: {session_count}")
        print(f"Messages per session: {messages_per_session}")

        for i in range(session_count):
            session_id = str(uuid.uuid4())
            start_time = fake.date_time_between(start_date='-1M', end_date='now')
            duration_minutes = random.randint(5, 30)
            end_time = start_time + timedelta(minutes=duration_minutes)
            
            # Create Session
            session = ConversationSession(
                session_id=session_id,
                title=fake.sentence(nb_words=4).strip('.'),
                started_at=start_time.isoformat(),
                ended_at=end_time.isoformat(),
                total_duration_sec=float(duration_minutes * 60),
                user_speech_duration_sec=float(duration_minutes * 60 * 0.4), # Assume 40% user speech
                scenario_place=fake.city(),
                scenario_partner=fake.name(),
                scenario_goal=fake.sentence(),
                scenario_state_json="{}",
                scenario_completed_at=end_time if random.choice([True, False]) else None,
                deleted=False,
                voice="alloy",
                show_text=True,
                user_id=real_user_id
            )
            db.add(session)
            
            # Create Messages
            current_time = start_time
            msg_interval = (duration_minutes * 60) / messages_per_session
            
            for j in range(messages_per_session):
                role = "user" if j % 2 == 0 else "assistant"
                content = fake.sentence() if role == "user" else fake.paragraph(nb_sentences=2)
                
                msg_duration = random.uniform(2.0, 10.0)
                
                message = ChatMessage(
                    session_id=session_id,
                    role=role,
                    content=content,
                    timestamp=current_time.isoformat(),
                    duration_sec=msg_duration
                )
                db.add(message)
                
                current_time += timedelta(seconds=msg_interval)
            
            print(f"Created session {i+1}/{session_count}: {session_id}")
        
        await db.commit()
        print("Mock data generation completed successfully!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate mock data for MaLangEE")
    # Changed type to str to allow login_id logic
    parser.add_argument("--user-id", type=str, help="User ID (int) or login_id (str) to assign sessions to", default=None)
    parser.add_argument("--production", action="store_true", help="Force use of production database (PostgreSQL)")
    parser.add_argument("--db-name", type=str, help="Database name")
    parser.add_argument("--db-user", type=str, help="Database user")
    parser.add_argument("--db-password", type=str, help="Database password")
    parser.add_argument("--db-host", type=str, help="Database host", default="localhost")
    parser.add_argument("--db-port", type=str, help="Database port", default="5432")
    
    args = parser.parse_args()

    if args.production:
        print("Switching to PRODUCTION mode (PostgreSQL)")
        
        from app.core.config import settings
        settings.USE_SQLITE = False
        
        # Override with manual arguments if provided
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

        # If not provided via args or loaded from env, try to map from shell env vars
        if not args.db_user and os.getenv("DB_USER"):
            os.environ["POSTGRES_USER"] = os.getenv("DB_USER")
        # ... (other mappings are less critical if args are used, but good to keep or simplify)
        
        # Print debug info (masking password)
        print(f"Connecting to: {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB} as {settings.POSTGRES_USER}")
        
        # Re-initialize engine with new settings
        from app.db import database
        database.engine = database.create_async_engine(
            settings.DATABASE_URL,
            echo=True,
            pool_size=20,
            max_overflow=10,
            pool_recycle=3600,
            pool_pre_ping=True,
            pool_timeout=30
        )
        database.AsyncSessionLocal = database.sessionmaker(
            database.engine, class_=database.AsyncSession, expire_on_commit=False
        )
        # Re-import to ensure we use the updated objects
        from app.db.database import AsyncSessionLocal, engine

    async def verify_and_run(user_identifier: str):
        # Interactive fallback remains as a safety net
        pass 
        # (Rest of the function logic is fine, we just invoke it)

    # Simplified invocation since verify_and_run handles logic
    # We need to define verify_and_run fully or keep previous logic.
    # To save tokens/complexity, I will just paste the verify_and_run logic here or reuse existing if not replacing it.
    # Wait, replace_file_content requires exact match.
    # I should modify the 'if args.production:' block primarily and adding args.

    # Let's replace the whole block from `if args.production:` down to `asyncio.run(...)`
    # But wait, `parser` is defined before.

    # Let's try to just insert args first.
    pass

# Redoing the Plan:
# The `args = parser.parse_args()` is at the end.
# I will rewrite the `if __name__ == "__main__":` block entirely.

    async def verify_and_run(user_identifier: str):
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Try to run the data generation
                await create_mock_data(user_identifier=user_identifier)
                return
            except Exception as e:
                # Check for password authentication error
                error_str = str(e)
                if "password authentication failed" in error_str or "InvalidPasswordError" in error_str:
                    print(f"\n[!] Authentication failed (Attempt {attempt + 1}/{max_retries})")
                    print(f"[!] The script cannot connect with password: '{settings.POSTGRES_PASSWORD}'")
                    
                    import getpass
                    new_password = getpass.getpass("Enter the correct PostgreSQL password for user 'malangee_user': ")
                    
                    if new_password:
                        # Update settings and engine with new password
                        settings.POSTGRES_PASSWORD = new_password
                        
                        # Re-create engine string
                        new_db_url = f"postgresql+asyncpg://{settings.POSTGRES_USER}:{new_password}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
                        
                        print(f"Retrying connection with new password...")
                        from app.db import database
                        database.engine = database.create_async_engine(
                            new_db_url,
                            echo=True, # Turn off echo for retry to reduce noise
                            pool_size=20,
                            max_overflow=10,
                            pool_recycle=3600,
                            pool_pre_ping=True,
                            pool_timeout=30
                        )
                        database.AsyncSessionLocal = database.sessionmaker(
                            database.engine, class_=database.AsyncSession, expire_on_commit=False
                        )
                        # Update global engine/session reference
                        global engine, AsyncSessionLocal
                        engine = database.engine
                        AsyncSessionLocal = database.AsyncSessionLocal
                    else:
                        print("No password entered. Exiting.")
                        sys.exit(1)
                else:
                    # Non-auth error, raise it
                    raise e
        
        print("\n[!] Maximum retry attempts reached. Please check your database credentials.")
        sys.exit(1)

    asyncio.run(verify_and_run(user_identifier=args.user_id))
