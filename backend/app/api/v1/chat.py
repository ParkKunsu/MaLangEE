from typing import List, Optional

from app.api import deps
from app.db import models
from app.schemas.chat import (
    HintResponse,
    SessionCreate,
    SessionResponse,
    SessionSummary,

    SyncSessionResponse,
    SessionStartRequest,
)
from app.schemas.common import PaginatedResponse
from app.services.chat_service import ChatService
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket

router = APIRouter()


@router.put("/sessions/{session_id}/sync", response_model=SyncSessionResponse, summary="데모 세션 사용자 회원가입후 아아디 연동")
async def sync_guest_session(
    session_id: str,
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
        success = await service.map_session_to_user(session_id, user_id=current_user.id)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")

        return SyncSessionResponse(status="success", session_id=session_id)
    except Exception as e:
        # 이미 존재하는 세션 ID 등 에러 처리
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions", response_model=SessionResponse, summary="새 대화 세션 시작")
async def start_new_session(
    session_in: SessionStartRequest,
    current_user: Optional[models.User] = Depends(deps.get_current_user_optional), # 비회원도 가능하도록 Optional
    service: ChatService = Depends(deps.get_chat_service),
):
    """
    [Scenario Start]
    시나리오 정보를 받아 새로운 대화 세션을 생성합니다.
    - scenario_id만 보내면, DB에서 나머지 정보(장소, 상대, 목표)를 자동으로 채워줍니다.
    """
    user_id = current_user.id if current_user else None
    return await service.create_new_session(session_in, user_id)


@router.get("/sessions", response_model=PaginatedResponse[SessionSummary], summary="사용자 대화 세션 목록 조회")
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


@router.get("/sessions/{session_id}", response_model=SessionResponse, summary="대화 세션 상세 조회")
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


@router.get("/recent", response_model=Optional[SessionResponse], summary="가장 최근 대화 세션 조회")
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
        return None  # 204 No Content or just null

    return SessionResponse.model_validate(session)


@router.websocket("/ws/chat/{session_id}")
async def websocket_chat(
    websocket: WebSocket,
    session_id: str,
    # token은 get_current_user_ws 내부에서 처리됨
    user: models.User = Depends(deps.get_current_user_ws),
    voice: Optional[str] = Query(None),
    show_text: Optional[bool] = Query(None),
    chat_service: ChatService = Depends(deps.get_chat_service),
):
    """
    실시간 대화 WebSocket 엔드포인트 (회원용)
    - token: 쿼리 파라미터 or 헤더로 전달 (Strict Auth)
    - session_id: Path Parameter
    """
    await websocket.accept()

    # 1. 토큰 검증 완료 (user 객체 존재 보장)
    # 2. AI 세션 시작 (user.id 전달)
    await chat_service.start_ai_session(websocket, user_id=user.id, session_id=session_id, voice=voice, show_text=show_text)


@router.websocket("/ws/guest-chat/{session_id}")
async def websocket_guest_chat(
    websocket: WebSocket,
    session_id: str,
    voice: Optional[str] = Query(None),
    show_text: Optional[bool] = Query(None),
    chat_service: ChatService = Depends(deps.get_chat_service),
):
    """
    실시간 대화 WebSocket 엔드포인트 (게스트용)
    - 인증 없음
    - session_id: Path Parameter
    """
    await websocket.accept()

    # AI 세션 시작 (user_id=None)
    await chat_service.start_ai_session(websocket, user_id=None, session_id=session_id, voice=voice, show_text=show_text)


@router.get("/hints/{session_id}", response_model=HintResponse, summary="대화 힌트 생성")
async def get_hint(
    session_id: str,
    service: ChatService = Depends(deps.get_chat_service),
):
    """
    [Hint Generation]
    현재 진행 중인 세션(메모리)의 대화 맥락을 기반으로 힌트를 생성합니다.
    - 5초 이상 무응답 시 프론트엔드에서 호출
    - LLM을 통해 추천 답변 3개 생성
    - Note: user_id가 없는(Guest/Demo) 사용자도 힌트를 받을 수 있도록 session_id만 사용합니다.
    """
    hints = await service.generate_hint(session_id)

    if not hints:
        # 세션이 없거나 힌트 생성 실패 시 빈 리스트 반환 (또는 404)
        # 프론트엔드 처리를 위해 빈 리스트가 나을 수 있음
        return HintResponse(hints=[], session_id=session_id)

    return HintResponse(hints=hints, session_id=session_id)
