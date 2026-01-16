from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, WebSocketException, Query, WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException, status, WebSocketException, Query
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings
from app.api import deps
from app.db import models
from app.schemas import token
from app.repositories.user_repository import UserRepository
from app.repositories.chat_repository import ChatRepository
from app.services.user_service import UserService
from app.services.auth_service import AuthService
from app.services.chat_service import ChatService

from app.db.database import get_db

# Repository Dependencies
def get_user_repository(db: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(db)

def get_chat_repository(db: AsyncSession = Depends(get_db)) -> ChatRepository:
    return ChatRepository(db)

# Service Dependencies
def get_user_service(repo: UserRepository = Depends(get_user_repository)) -> UserService:
    return UserService(repo)

def get_auth_service(repo: UserRepository = Depends(get_user_repository)) -> AuthService:
    return AuthService(repo)

def get_chat_service(repo: ChatRepository = Depends(get_chat_repository)) -> ChatService:
    return ChatService(repo)

# OAuth2 스킴 정의 (Token URL은 /api/v1/auth/login)
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

# Optional Auth (비회원 가능)
reusable_oauth2_optional = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False 
)

# 공통 인증 로직 (내부 헬퍼)
async def _authenticate_user(
    token_str: str,
    auth_service: AuthService,
    user_service: UserService
) -> Optional[models.User]:
    """
    토큰에서 유저를 조회하는 공통 로직
    """
    # 1. AuthService를 통해 토큰 검증
    login_id = auth_service.verify_token(token_str)
    if not login_id:
        return None
    
    # 2. UserService를 통해 유저 조회
    return await user_service.get_user_by_login_id(login_id)

# 토큰 검증 및 사용자 조회 (Dependency - HTTP)
async def get_current_user(
    token_str: str = Depends(reusable_oauth2),
    auth_service: AuthService = Depends(get_auth_service),
    user_service: UserService = Depends(get_user_service)
) -> models.User:
    user = await _authenticate_user(token_str, auth_service, user_service)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_current_user_optional(
    token_str: str = Depends(reusable_oauth2_optional),
    auth_service: AuthService = Depends(get_auth_service),
    user_service: UserService = Depends(get_user_service)
) -> Optional[models.User]:
    """
    토큰이 있으면 유저 반환, 없거나 유효하지 않으면 None 반환 (401 에러 아님)
    """
    if not token_str:
        return None
        
    try:
        return await _authenticate_user(token_str, auth_service, user_service)
    except:
        return None

# WebSocket Auth Dependency
async def get_current_user_ws(
    websocket: WebSocket,
    token: Optional[str] = Query(None, description="JWT Access Token"),
    auth_service: AuthService = Depends(get_auth_service),
    user_service: UserService = Depends(get_user_service)
) -> models.User:
    """
    WebSocket 연결 전용 인증 의존성
    우선순위:
    1. Header: Authorization (Bearer <token>)
    2. Header: Sec-WebSocket-Protocol (token, ...)
    3. Query Parameter: ?token=<token>
    """
    # 1. Authorization Header 확인
    auth_header = websocket.headers.get("Authorization")
    token_str = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token_str = auth_header.split(" ")[1]
    
    # 2. Sec-WebSocket-Protocol 확인 (브라우저 WebSocket에서 헤더 대용으로 사용)
    # Note: 클라이언트가 "token_string"을 서브프로토콜로 보낼 경우
    if not token_str:
        protocol = websocket.headers.get("Sec-WebSocket-Protocol")
        if protocol:
            # 여러 프로토콜이 올 수 있음 (예: "access_token, soap")
            token_str = protocol.split(",")[0].strip()

    # 3. Query Parameter 확인 (마지막 수단)
    if not token_str:
        token_str = token
        
    if not token_str:
        raise WebSocketException(code=1008, reason="Missing authentication token")

    
    if not token_str:
        raise WebSocketException(code=1008, reason="Missing authentication token")

    # 공통 인증 로직 사용
    user = await _authenticate_user(token_str, auth_service, user_service)
    
    if not user:
        raise WebSocketException(code=1008, reason="Invalid token or user not found")
        
    return user
