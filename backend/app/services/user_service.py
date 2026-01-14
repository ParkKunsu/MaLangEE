from typing import Optional
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserUpdate
from app.db.models import User
from app.core import security

class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def get_user_profile(self, user_id: int) -> User:
        return await self.user_repo.get_by_id(user_id)

    async def get_user_by_login_id(self, login_id: str) -> Optional[User]:
        return await self.user_repo.get_by_login_id(login_id)

    async def update_user_profile(self, user: User, user_in: UserUpdate) -> User:
        if user_in.password and user_in.password.strip():
            user.hashed_password = security.get_password_hash(user_in.password)
        if user_in.nickname and user_in.nickname.strip():
            user.nickname = user_in.nickname
        
        return await self.user_repo.update(user)


    async def withdraw_user(self, user: User) -> User:
        user.is_active = False
        return await self.user_repo.update(user)
