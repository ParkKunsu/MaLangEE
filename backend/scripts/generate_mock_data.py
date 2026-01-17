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
    args = parser.parse_args()

    if args.production:
        print("Switching to PRODUCTION mode (PostgreSQL)")
        from app.core.config import settings
        settings.USE_SQLITE = False
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

    asyncio.run(create_mock_data(user_identifier=args.user_id))
