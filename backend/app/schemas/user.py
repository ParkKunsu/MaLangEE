from typing import Optional
from pydantic import BaseModel

class UserBase(BaseModel):
    login_id: str
    nickname: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str
    nickname: str # 회원가입 시 닉네임 필수

class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: int
    
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
