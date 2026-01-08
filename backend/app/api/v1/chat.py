from typing import List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, Query

from app.api import deps
from app.db import models
from app.schemas.chat import SessionCreate, SessionSummary, SessionResponse, SessionIdRequest
from app.services.chat_service import ChatService

router = APIRouter()

@router.put("/logs", status_code=200, summary="데모 세션 사용자 회원가입후 아아디 연동")
async def sync_guest_session(
    request: SessionIdRequest,
    current_user: models.User = Depends(deps.get_current_user),
    service: ChatService = Depends(deps.get_chat_service),
):
    """
    게스트 세션의 소유권을 로그인한 사용자로 변경합니다.
    
    [용도]
    - WebSocket 연결 종료 시 데이터는 서버에서 자동 저장되므로, 이 엔드포인트는 **'사용자 ID 매핑(Map User ID)'** 용도로 사용됩니다.
    
    [동작]
    - 입력받은 `session_id`에 해당하는 세션을 찾아 `user_id`를 현재 로그인한 사용자로 업데이트합니다.
    """
    try:
        success = await service.map_session_to_user(request.session_id, user_id=current_user.id)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
            
        return {"status": "success", "session_id": request.session_id}
    except Exception as e:
        # 이미 존재하는 세션 ID 등 에러 처리
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions", response_model=List[SessionSummary])
async def get_user_sessions(
    skip: int = 0,
    limit: int = 20,
    current_user: models.User = Depends(deps.get_current_user),
    service: ChatService = Depends(deps.get_chat_service),
):
    """
    사용자의 대화 세션 목록을 조회합니다. (메시지 내용 미포함, 개수만 포함)
    """
    return await service.get_user_sessions(current_user.id, skip, limit)

@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session_detail(
    session_id: str,
    current_user: models.User = Depends(deps.get_current_user),
    service: ChatService = Depends(deps.get_chat_service),
):
    """
    특정 대화 세션의 상세 내용을 조회합니다. (메시지 내용 포함)
    """
    session = await service.get_session_detail(session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

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
