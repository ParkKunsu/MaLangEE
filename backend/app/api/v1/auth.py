from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.future import select

from app.core import security
from app.core.config import settings
from app.db.database import get_db
from app.db import models
from app.schemas import user as user_schema
from app.schemas import token as token_schema

router = APIRouter()

@router.post("/signup", response_model=user_schema.User)
async def create_user(
    user_in: user_schema.UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    새로운 사용자 생성 (회원가입)
    """
    # 아이디 중복 확인
    result = await db.execute(select(models.User).where(models.User.login_id == user_in.login_id))
    user = result.scalars().first()
    
    if user:
        raise HTTPException(
            status_code=400,
            detail="이미 존재하는 사용자 이름(ID)입니다.",
        )

    # 닉네임 중복 확인
    result = await db.execute(select(models.User).where(models.User.nickname == user_in.nickname))
    nickname_user = result.scalars().first()
    
    if nickname_user:
        raise HTTPException(
            status_code=400,
            detail="이미 사용 중인 닉네임입니다.",
        )
    
    # 새로운 사용자 생성
    user = models.User(
        login_id=user_in.login_id,
        hashed_password=security.get_password_hash(user_in.password),
        nickname=user_in.nickname,
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/login", response_model=token_schema.Token)
async def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 호환 토큰 로그인, 향후 요청을 위한 액세스 토큰 발급
    """
    # 사용자 인증 (폼데이터의 username을 login_id로 매핑)
    result = await db.execute(select(models.User).where(models.User.login_id == form_data.username))
    user = result.scalars().first()
    
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect login ID or password")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            {"sub": user.login_id}, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/check-login-id")
async def check_login_id_availability(
    check_in: user_schema.LoginIdCheck,
    db: Session = Depends(get_db)
) -> Any:
    """
    아이디 중복 확인
    - 사용 가능한 아이디인 경우: 200 OK ({"is_available": true})
    - 이미 존재하는 경우: 400 Bad Request
    """
    result = await db.execute(select(models.User).where(models.User.login_id == check_in.login_id))
    user = result.scalars().first()
    
    if user:
        raise HTTPException(
            status_code=400,
            detail="이미 존재하는 아이디입니다.",
        )
    return {"message": "사용 가능한 아이디입니다.", "is_available": True}

@router.post("/check-nickname")
async def check_nickname_availability(
    check_in: user_schema.NicknameCheck,
    db: Session = Depends(get_db)
) -> Any:
    """
    닉네임 중복 확인
    - 사용 가능한 닉네임인 경우: 200 OK ({"is_available": true})
    - 이미 존재하는 경우: 400 Bad Request
    """
    result = await db.execute(select(models.User).where(models.User.nickname == check_in.nickname))
    user = result.scalars().first()
    
    if user:
        raise HTTPException(
            status_code=400,
            detail="이미 사용 중인 닉네임입니다.",
        )
    return {"message": "사용 가능한 닉네임입니다.", "is_available": True}
