from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.db import models
from app.schemas import user as user_schema
from app.db.database import get_db
from app.core import security

router = APIRouter()

@router.get("/me", response_model=user_schema.User)
def read_user_me(
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    현재 사용자 정보 조회
    """
    return current_user

@router.put("/me", response_model=user_schema.User)
async def update_user_me(
    user_in: user_schema.UserUpdate,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    내 정보 수정
    """
    if user_in.password:
        current_user.hashed_password = security.get_password_hash(user_in.password)
    if user_in.nickname:
        current_user.nickname = user_in.nickname
        
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.delete("/me", response_model=user_schema.User)
async def delete_user_me(
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    회원 탈퇴 (Soft Delete)
    - 실제 데이터를 삭제하지 않고, 활성 상태(is_active)를 False로 변경합니다.
    - 탈퇴 후에는 로그인이 불가능합니다.
    """
    current_user.is_active = False
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user
