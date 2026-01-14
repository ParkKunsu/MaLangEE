from typing import Optional
from datetime import datetime
from pydantic import BaseModel, field_validator

class UserBase(BaseModel):
    login_id: str
    nickname: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str
    nickname: str # 회원가입 시 닉네임 필수

    @field_validator('login_id', 'nickname', 'password')
    def check_empty_whitespace(cls, v):
        if not v or not v.strip():
            raise ValueError('빈 값이나 공백만 입력할 수 없습니다.')
        return v

class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class User(UserInDBBase):
    """사용자 응답 스키마"""
    pass

class UserInDB(UserInDBBase):
    hashed_password: str

# 중복 체크용 스키마
class LoginIdCheck(BaseModel):
    login_id: str

class NicknameCheck(BaseModel):
    nickname: str
