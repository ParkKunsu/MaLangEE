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
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("오류: 환경 변수에서 OPENAI_API_KEY를 찾을 수 없습니다.")
        await websocket.close(code=1008, reason="API Key missing")
        return

    # 웹소켓 로직을 핸들러로 전달
    handler = ConnectionHandler(websocket, api_key)
    await handler.start()

if __name__ == "__main__":
    # Run this file directly to start the test server
    # Run this file directly to start the test server
    uvicorn.run(app, host="0.0.0.0", port=8002)
