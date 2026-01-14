from typing import Optional, List, Dict, Any
from app.repositories.chat_repository import ChatRepository
from app.schemas.chat import SessionCreate, SessionSummary, SessionResponse
from app.db.models import ConversationSession, User
from realtime_conversation.connection_handler import ConnectionHandler
from fastapi import WebSocket
from fastapi import WebSocket
from sqlalchemy.future import select
from app.core.config import settings
from realtime_conversation.session_manager import SessionManager

class ChatService:
    def __init__(self, chat_repo: ChatRepository):
        self.chat_repo = chat_repo
        self.session_manager = SessionManager()

    async def save_chat_log(self, session_data: SessionCreate, user_id: int = None) -> ConversationSession:
        return await self.chat_repo.create_session_log(session_data, user_id)

    async def map_session_to_user(self, session_id: str, user_id: int) -> bool:
        return await self.chat_repo.update_session_owner(session_id, user_id)

    async def get_recent_session(self, user_id: int) -> Optional[ConversationSession]:
        return await self.chat_repo.get_recent_session_by_user(user_id)

    async def get_user_sessions(self, user_id: int, skip: int = 0, limit: int = 20) -> List[SessionSummary]:
        results = await self.chat_repo.get_sessions_by_user(user_id, skip, limit)
        summaries = []
        for session, count in results:
            # SQLAlchemy model to Pydantic mapping
            summary = SessionSummary(
                session_id=session.session_id,
                title=session.title,
                started_at=session.started_at,
                ended_at=session.ended_at,
                total_duration_sec=session.total_duration_sec,
                user_speech_duration_sec=session.user_speech_duration_sec,
                created_at=session.created_at,
                updated_at=session.updated_at,
                message_count=count
            )
            summaries.append(summary)
        return summaries

    async def get_session_detail(self, session_id: str, user_id: int) -> Optional[SessionResponse]:
        session = await self.chat_repo.get_session_by_id(session_id, user_id)
        if not session:
            return None
        return SessionResponse.model_validate(session)

    async def get_history_for_websocket(self, session_id: str, user_id: int) -> List[Dict[str, Any]]:
        """
        WebSocket 연결 시 OpenAI에 주입할 이전 대화 내역을 조회하여 포맷팅합니다.
        """
        session = await self.chat_repo.get_session_by_id(session_id, user_id)
        
        history_messages = []
        if session and session.messages:
            for msg in session.messages:
                history_messages.append({
                    "role": msg.role, # 'user' or 'assistant'
                    "content": msg.content
                })
        
        return history_messages

    async def start_ai_session(self, websocket: WebSocket, user_id: Optional[int], session_id: str = None, voice: str = None, show_text: bool = None):
        """
        AI와의 실시간 대화 세션을 시작합니다.
        - OpenAI API Key 로드
        - [New] 사용자 선호 설정(보이스, 자막) 선 저장
        - 최신 세션 정보 및 히스토리 조회
        - ConnectionHandler 시작
        """
        print(f"[DEBUG] start_ai_session called. session_id={session_id}, user_id={user_id}")
        # 1. OpenAI API Key 확인
        api_key = settings.OPENAI_API_KEY
        
        if not api_key:
            print("Error: OPENAI_API_KEY not found.")
            await websocket.close(code=1008, reason="Server configuration error")
            return

        # 2. 사용자 선호 설정 선 저장 (DB First)
        # 파라미터가 들어온 경우에만 업데이트를 수행합니다.
        if session_id and (voice is not None or show_text is not None):
            await self.chat_repo.update_preferences(session_id, voice, show_text)

        # 3. 최신 세션 정보 및 히스토리 조회
        history_messages = []
        conversation_context = None
        voice_config = None # DB에서 가져온 보이스 설정

        if session_id:
            # DB에서 최신 세션 정보 조회
            # user_id 필터 없이 조회 후, 로직에서 소유권 검증 수행
            session_obj = await self.chat_repo.get_session_by_id(session_id)
            
            if not session_obj:
                print(f"Session {session_id} not found via get_session_by_id.")
                
                # [DEBUG] 혹시 삭제된 세션인지, 아니면 정말 없는지 확인
                try:
                    stmt = select(ConversationSession).where(ConversationSession.session_id == session_id)
                    result = await self.chat_repo.db.execute(stmt)
                    debug_session = result.scalars().first()
                    
                    if debug_session:
                        print(f"[DEBUG] Session FOUND but match failed. check: deleted={debug_session.deleted}, user_id={debug_session.user_id}")
                    else:
                        print(f"[DEBUG] Session REALLY NOT FOUND in DB. session_id={session_id}")
                except Exception as e:
                    print(f"[DEBUG] DB Check failed: {e}")

                await websocket.close(code=4004, reason="Session not found")
                return

            # [Security Check] 소유권 검증
            # 세션에 주인이 있는데(owned), 요청자가 주인이 아니거나(mismatch) 비회원(None)인 경우 접근 차단
            if session_obj.user_id is not None:
                if user_id is None or session_obj.user_id != user_id:
                    print(f"Unauthorized access attempt to session {session_id} by user {user_id}")
                    await websocket.close(code=4003, reason="Unauthorized access to this session")
                    return

            # [New] 시나리오 컨텍스트 추출
            conversation_context = {
                "title": session_obj.title,
                "place": session_obj.scenario_place,
                "partner": session_obj.scenario_partner,
                "goal": session_obj.scenario_goal
            }
            
            # [New] 저장된 Voice 설정 추출
            if session_obj.voice:
                voice_config = session_obj.voice
            
            # 히스토리 추출
            if session_obj.messages:
                for msg in session_obj.messages:
                    history_messages.append({
                        "role": msg.role,
                        "content": msg.content
                    })

        # 4. ConnectionHandler 시작
        if ConnectionHandler:
            # context 및 voice 설정 전달
            handler = ConnectionHandler(
                websocket, 
                api_key, 
                history=history_messages, 
                session_id=session_id,
                context=conversation_context,
                voice=voice_config # [New]
            )
            
            # [Manager] 세션 등록
            if session_id:
                self.session_manager.add_session(session_id, handler)

            try:
                report = await handler.start()
                
                # 5. 세션 종료 후 리포트 저장 (Auto-Save)
                # user_id가 없어도(Guest/Demo) 저장합니다. (DB에는 user_id=NULL로 저장됨)
                if report:
                    try:
                        session_data = SessionCreate(**report)
                        # 중요: 종료 시점의 설정값도 저장하고 싶다면 report에 포함되어야 함.
                        # 하지만 이미 시작할 때 update_preferences로 저장했으므로,
                        # 여기서는 변동사항이 없다면 건너뛰어도 됨.
                        # 다만 SessionCreate에 voice, show_text 필드가 추가되었으므로 
                        # Tracker가 이를 채워서 보내준다면 업데이트될 것임.
                        await self.save_chat_log(session_data, user_id)
                        print(f"Session {session_data.session_id} saved (User: {user_id})")
                    except Exception as e:
                        print(f"Failed to auto-save session log: {e}")
            finally:
                # [Manager] 세션 해제 (항상 보장)
                if session_id:
                    self.session_manager.remove_session(session_id)
                    
        else:
            await websocket.close(code=1011, reason="Module error")


    async def generate_hint(self, session_id: str) -> List[str]:
        """
        [Hint Generation]
        활성 세션의 컨텍스트를 기반으로 LLM을 통해 힌트를 생성합니다.
        
        TODO: 실제 LLM 연동 로직 구현 필요
        현재는 Mock Data를 반환합니다.
        """
        # 1. 활성 세션 핸들러 조회
        handler = self.session_manager.get_session(session_id)
        
        if not handler:
            print(f"Hint generation failed: Session {session_id} not found in memory.")
            return []
            
        # 2. 컨텍스트 조회 (최근 대화 5개)
        context = handler.get_transcript_context(limit=5)
        print(f"[Hint Logic] Context Retrieved: {len(context)} messages")
        
        # 3. [TODO] LLM API 호출
        # request_to_llm(context) -> returns ["Hint 1", "Hint 2"]
        # 시스템 프롬프트: "사용자는 영어 회화 학습자입니다. 현재 대화 맥락에 어울리는 답변 문장 3가지를 추천해주세요."
        
        # 4. Mock Response 반환
        return [
            "I agree with your point.",
            "That sounds interesting, tell me more.",
            "I'm not sure about that, but I'll think about it."
            "이 응답은 mock 데이터 입니다. LLM 연결이 필요 합니다."
        ]
