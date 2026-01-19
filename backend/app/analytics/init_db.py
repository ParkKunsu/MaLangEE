import asyncio
from app.db.database import engine
from app.db.models import Base
from app.analytics.models import ScenarioStatistics, UserLearningMap

async def init_tables():
    print("Initialize Analytics DB Tables...")
    async with engine.begin() as conn:
        # Create all tables defined in Base (including new Analytics models)
        # If table exists, it skips.
        await conn.run_sync(Base.metadata.create_all)
    print("Done.")

if __name__ == "__main__":
    asyncio.run(init_tables())
