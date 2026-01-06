from typing import Optional, List, Dict, Any
from app.repositories.chat_repository import ChatRepository
from app.schemas.chat import SessionCreate
from app.db.models import ConversationSession, User
from realtime_conversation.connection_handler import ConnectionHandler
from fastapi import WebSocket
from fastapi import WebSocket
from app.core.config import settings

class ChatService:
    def __init__(self, chat_repo: ChatRepository):
        self.chat_repo = chat_repo

    async def save_chat_log(self, session_data: SessionCreate, user_id: int = None) -> ConversationSession:
        return await self.chat_repo.create_session_log(session_data, user_id)

    async def get_recent_session(self, user_id: int) -> Optional[ConversationSession]:
        return await self.chat_repo.get_recent_session_by_user(user_id)

    async def get_history_for_websocket(self, session_id: str, user_id: int) -> tuple[List[Dict[str, Any]], Optional[str]]:
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
        
        return history_messages, session.title if session else None

    async def start_ai_session(self, websocket: WebSocket, user_id: Optional[int], session_id: str = None):
        """
        AI와의 실시간 대화 세션을 시작합니다.
        - OpenAI API Key 로드
        - 히스토리 조회
        - ConnectionHandler 시작
        """
        # 1. OpenAI API Key 확인
        api_key = settings.OPENAI_API_KEY
        
        if not api_key:
            print("Error: OPENAI_API_KEY not found.")
            await websocket.close(code=1008, reason="Server configuration error")
            return

        # 2. 히스토리 조회
        history_messages = []
        session_title = None
        if session_id and user_id:
            history_messages, session_title = await self.get_history_for_websocket(session_id, user_id)

        # 3. ConnectionHandler 시작
        if ConnectionHandler:
            handler = ConnectionHandler(websocket, api_key, history=history_messages, session_id=session_id, title=session_title)
            report = await handler.start()
            
            # 4. 세션 종료 후 리포트 저장 (Auto-Save)
            # user_id가 없어도(Guest/Demo) 저장합니다. (DB에는 user_id=NULL로 저장됨)
            if report:
                try:
                    session_data = SessionCreate(**report)
                    await self.save_chat_log(session_data, user_id)
                    print(f"Session {session_data.session_id} saved (User: {user_id})")
                except Exception as e:
                    print(f"Failed to auto-save session log: {e}")
        else:
            await websocket.close(code=1011, reason="Module error")
