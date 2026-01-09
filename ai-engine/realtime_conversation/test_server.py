import os
import sys

# 직접 실행 시 'realtime_conversation' 임포트를 허용하기 위해 sys.path에 부모 디렉토리 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 특정 모듈 파일에서 임포트
from realtime_conversation.connection_handler import ConnectionHandler
from realtime_conversation.conversation_manager import ConversationManager

# -----------------------------------------------------------------------------
# [Debug Classes] Core 로직 수정 없이 모니터링 기능 추가 (상속 활용)
# -----------------------------------------------------------------------------
# [Memory Persistence] 로컬 테스트용 인메모리 세션 저장소
HISTORY_CACHE = {}

class DebugConversationManager(ConversationManager):
    """
    Core Manager를 상속받아, WPM 변화가 있을 때 Handler에게 알림을 주는 디버그용 Manager
    """
    def __init__(self, handler_ref):
        super().__init__()
        self.handler_ref = handler_ref

    async def update_speaking_style(self, wpm_status: str):
        # 1. 원래 로직 실행 (프롬프트 변경 및 OpenAI 전송)
        await super().update_speaking_style(wpm_status)
        
        # 2. [Debug] 변경된 상태를 클라이언트로 전송
        print(f"DEBUG: update_speaking_style called with {wpm_status}")
        await self.handler_ref.send_debug_update(wpm_status, self.instruction_dynamic)

class DebugConnectionHandler(ConnectionHandler):
    """
    Core Handler를 상속받아, Debug Manager를 장착하고 디버그 메시지 전송 기능을 추가함
    """
    def __init__(self, client_ws: WebSocket, api_key: str, history: list = None, session_id: str = None):
        super().__init__(client_ws, api_key, history, session_id)
        # 핵심: Manager를 디버그용으로 교체
        self.conversation_manager = DebugConversationManager(self)
        
        # 주입된 히스토리가 있으면 매니저에게 초기 주입
        if history:
             # ConnectionHandler.connect_to_openai 에서 self.history를 사용하므로
             # super().__init__에서 이미 self.history = history로 설정됨.
             # 따라서 별도 작업 불필요.
             print(f"DEBUG: Loaded history with {len(history)} items.")

    async def send_debug_update(self, wpm_status: str, dynamic_instruction: str):
        """클라이언트에게 실시간 상태 정보 전송"""
        try:
            print(f"DEBUG: Sending debug.state -> WPM: {wpm_status}")
            await self.client_ws.send_json({
                "type": "debug.state",
                "wpm_status": wpm_status,
                "dynamic_instruction": dynamic_instruction
            })
        except Exception as e:
            print(f"Debug Update Failed: {e}")

    async def cleanup(self):
        # 1. 부모의 cleanup 실행 (리포트 생성 및 반환)
        report = await super().cleanup()
        
        # 2. [Persistence] 대화 내용 저장 (Session ID가 있을 경우)
        if self.tracker and self.tracker.session_id and report:
            # report['messages']에 전체 대화가 들어있음
            # 혹은 self.tracker.messages 사용
            # 주의: 히스토리가 누적되려면 '기존 history' + '이번 세션 messages'여야 함
            # ChatService 방식처럼 '이번 세션' 것만 리포트에 나오므로,
            # Test Server에선 HISTORY_CACHE에 누적(Accumulate) 해야 함.
            
            # 기존 캐시 가져오기
            existing_history = HISTORY_CACHE.get(self.tracker.session_id, [])
            
            # 이번 세션의 메시지들 (report['messages'])
            new_messages = report.get('messages', [])
            
            # 합쳐서 저장
            # ChatMessage 스키마가 아니라 그냥 리스트 딕셔너리 구조임
            updated_history = existing_history + new_messages
            HISTORY_CACHE[self.tracker.session_id] = updated_history
            
            print(f"DEBUG: Saved session {self.tracker.session_id} history. Total items: {len(updated_history)}")
            
        return report

# -----------------------------------------------------------------------------

# 부모 .env 또는 로컬 .env에서 환경 변수 로드
load_dotenv() 
# 찾을 수 없는 경우 부모 디렉토리에서도 로드 시도 (표준 개발 설정)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발용으로 모든 오리진 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 모듈 내의 정적 파일 서비스
module_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(module_dir, "static")

app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def root():
    return FileResponse(os.path.join(static_dir, 'index.html'))

@app.get("/prompt")
async def get_prompt():
    prompt_path = os.path.join(module_dir, "..", "prompts", "system_instruction.md")
    print(f"DEBUG: Request to /prompt. Path: {prompt_path}")
    if os.path.exists(prompt_path):
        print("DEBUG: File exists, reading content.")
        with open(prompt_path, "r", encoding="utf-8") as f:
            return {"prompt": f.read()}
    print("DEBUG: File NOT found.")
    return {"prompt": "System prompt not found."}

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket, session_id: str = None):
    await websocket.accept()
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("오류: 환경 변수에서 OPENAI_API_KEY를 찾을 수 없습니다.")
        await websocket.close(code=1008, reason="API Key missing")
        return

    # [Persistence] 히스토리 조회
    history = []
    if session_id:
        history = HISTORY_CACHE.get(session_id, [])
        print(f"DEBUG: Resuming session {session_id} with history len={len(history)}")

    # [Changed] DebugHandler 사용 및 session_id 전달
    print(f"Starting Session: {session_id}")
    handler = DebugConnectionHandler(websocket, api_key, history=history, session_id=session_id)
    await handler.start()

if __name__ == "__main__":
    # Run this file directly to start the test server
    # Run this file directly to start the test server
    uvicorn.run(app, host="0.0.0.0", port=8002)
