from fastapi import APIRouter, Depends, HTTPException, WebSocket, Query

from app.api import deps
from app.db import models
from app.schemas.chat import SessionCreate
from app.services.chat_service import ChatService

router = APIRouter()

@router.post("/logs", status_code=201)
async def upload_chat_log(
    session_data: SessionCreate,
    current_user: models.User = Depends(deps.get_current_user),
    service: ChatService = Depends(deps.get_chat_service),
):
    """
    AI Engine으로부터 대화 로그를 수신하여 DB에 저장합니다.
    """
    try:
        await service.save_chat_log(session_data, user_id=current_user.id)
        return {"status": "success", "session_id": session_data.session_id}
    except Exception as e:
        # 이미 존재하는 세션 ID 등 에러 처리
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recent")
async def get_recent_chat_session(
    current_user: models.User = Depends(deps.get_current_user),
    service: ChatService = Depends(deps.get_chat_service),
):
    """
    사용자의 가장 최근 대화 세션을 조회합니다. (메시지 포함)
    """
    # Service를 통해 가장 최근 세션 조회
    session = await service.get_recent_session(current_user.id)
    
    if not session:
        return None # 204 No Content or just null
        
    return session

@router.websocket("/ws/chat")
async def websocket_chat(
    websocket: WebSocket,
    # token은 get_current_user_ws 내부에서 처리됨
    user: models.User = Depends(deps.get_current_user_ws),
    session_id: str = Query(None, description="세션 ID (주제 선택 대화에서 생성됨)"),
    chat_service: ChatService = Depends(deps.get_chat_service),
):
    """
    실시간 대화 WebSocket 엔드포인트
    - token: 쿼리 파라미터로 JWT 토큰 전달 필요 (deps.get_current_user_ws에서 처리)
    - session_id: 이전 대화를 이어하려면 세션 ID 전달
    """
    await websocket.accept()
    
    # 1. 토큰 검증 및 사용자 조회는 이미 Dependency에서 완료됨
    # user 객체는 안전하게 존재함

    # 2. AI 세션 시작 (Service 위임)
    await chat_service.start_ai_session(websocket, user.id, session_id)

@router.websocket("/ws/guest-chat")
async def websocket_guest_chat(
    websocket: WebSocket,
    session_id: str = Query(None, description="세션 ID (주제 선택 대화에서 생성됨)"),
    chat_service: ChatService = Depends(deps.get_chat_service),
):
    """
    실시간 대화 WebSocket 엔드포인트 (게스트용, 인증 없음)
    """
    await websocket.accept()
    
    # AI 세션 시작 (user_id=None)
    await chat_service.start_ai_session(websocket, user_id=None, session_id=session_id)
