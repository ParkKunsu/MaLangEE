import asyncio
import json
import logging
import websockets
from fastapi import WebSocket, WebSocketDisconnect
from .conversation_manager import ConversationManager
from .conversation_tracker import ConversationTracker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OPENAI_REALTIME_API_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview"

class ConnectionHandler:
    """
    [WebSocket 연결 핸들러]
    
    이 클래스는 'Client(React 프론트엔드)'와 'OpenAI Realtime API' 사이의 
    모든 실시간 통신을 중계하고 관리하는 핵심 역할을 수행합니다.
    
    주요 기능:
    1. 이중 WebSocket 관리:
       - Client <-> Server (FastAPI WebSocket)
       - Server <-> OpenAI (websockets 라이브러리)
    
    2. 양방향 데이터 중계 (Relay):
       - Client의 마이크 오디오 데이터(PCM16)를 OpenAI로 전송
       - OpenAI의 응답 오디오(PCM16) 및 텍스트 이벤트를 Client로 전송
    
    3. 이벤트 처리 및 로깅:
       - 발화 시작/종료 감지 (VAD 이벤트)
       - 사용자/AI 대화 내용(Transcript) 처리 및 로그 출력
       - 에러 핸들링 및 세션 초기화
    """
    def __init__(self, client_ws: WebSocket, api_key: str):
        self.client_ws = client_ws
        self.api_key = api_key
        self.conversation_manager = ConversationManager()
        self.tracker = ConversationTracker() # 트래커 초기화 (Session ID는 자동 생성)
        self.openai_ws = None
        self.openai_task = None

    async def start(self):
        """[메인 실행 루프]"""
        try:
            # 1. 초기 연결
            await self.connect_to_openai()

            # 2. 클라이언트 수신 루프
            await self.receive_from_client()
            
        except Exception as e:
            logger.error(f"메인 루프 오류: {e}")
        finally:
            await self.cleanup()

    async def connect_to_openai(self):
        """OpenAI 연결 및 수신 태스크 시작"""
        try:
            if self.openai_ws:
                await self.openai_ws.close()
            
            self.openai_ws = await websockets.connect(
                OPENAI_REALTIME_API_URL,
                additional_headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "OpenAI-Beta": "realtime=v1"
                }
            )
            logger.info("OpenAI Realtime API에 연결되었습니다.")
            
            # 세션 초기화
            await self.conversation_manager.initialize_session(self.openai_ws)

            # 수신 태스크 재시작
            if self.openai_task and not self.openai_task.done():
                self.openai_task.cancel()
            
            self.openai_task = asyncio.create_task(self.receive_from_openai())

        except Exception as e:
            logger.error(f"OpenAI 연결 실패: {e}")

    async def reconnect_to_openai(self):
        """세션 재연결 (설정 변경 시 사용)"""
        logger.info("OpenAI 세션을 재연결합니다 (Voice 변경 적용)...")
        # 기존 태스크 정리
        if self.openai_task:
            self.openai_task.cancel()
            try:
                await self.openai_task
            except asyncio.CancelledError:
                pass
        
        await self.connect_to_openai()

    async def receive_from_client(self):
        """[Client -> Server 메시지 루프]"""
        try:
            while True:
                message = await self.client_ws.receive_text()
                data = json.loads(message)
                
                if data.get("type") == "input_audio_buffer.append":
                    if self.openai_ws:
                        await self.openai_ws.send(json.dumps({
                            "type": "input_audio_buffer.append",
                            "audio": data.get("audio")
                        }))
                
                elif data.get("type") == "input_audio_buffer.commit":
                     if self.openai_ws:
                        await self.openai_ws.send(json.dumps({
                            "type": "input_audio_buffer.commit"
                        }))
                     
                elif data.get("type") == "response.create":
                    if self.openai_ws:
                        await self.openai_ws.send(json.dumps({
                            "type": "response.create"
                        }))

                elif data.get("type") == "session.update":
                    new_config = data.get("config", {})
                    if new_config:
                        logger.info(f"클라이언트 설정 변경 요청 수신: {new_config}")
                        should_reconnect = await self.conversation_manager.update_session_settings(new_config)
                        
                        if should_reconnect:
                            await self.reconnect_to_openai()

        except WebSocketDisconnect:
            logger.info("클라이언트 연결 해제됨")
        except Exception as e:
            logger.error(f"클라이언트 읽기 오류: {e}")

    async def receive_from_openai(self):
        """[OpenAI -> Client 중계 루프]"""
        try:
            async for message in self.openai_ws:
                event = json.loads(message)
                event_type = event.get("type")
                
                # 로그 필터링 (디버깅을 위해 일시 해제)
                # if event_type not in ["response.audio.delta", "response.audio_transcript.delta"]:
                #    pass
                
                # 모든 이벤트 로그 출력 (너무 많으면 나중에 다시 필터링)
                # print(f"[OpenAI Event] {event_type}") 
                pass # print는 주석처리하고 필요한 중요 로그만 아래에서 처리하도록 내버려두거나,
                     # 아니면 디버깅을 위해 다 찍어볼 수도 있음. 
                     # 여기서는 사용자가 원인 파악을 원하므로 'Warning' 이상이나 'Error'는 무조건 찍히게 되어있지만,
                     # RateLimit 같은 걸 보려면 다 찍는 게 좋음.
                     
                if event_type == "error":
                    logger.error(f"OpenAI 오류 발생: {json.dumps(event, ensure_ascii=False)}")
                
                # Rate Limit 확인용
                if event_type == "rate_limits.updated":
                    logger.info(f"Rate Limit 업데이트: {json.dumps(event, ensure_ascii=False)}")
                    # 기본값 로그는 헷갈리므로 생략하거나 명확히 표시
                    logger.debug(f"OpenAI 기본 세션 생성됨: {event.get('session', {}).get('voice')}")
                
                elif event_type == "session.updated":
                    logger.info(f"OpenAI 세션 설정 업데이트 완료: {event.get('session', {}).get('voice')}")
                
                elif event_type == "response.audio.delta":
                    await self.client_ws.send_json({
                        "type": "audio.delta",
                        "delta": event["delta"]
                    })
                elif event_type == "response.audio.done":
                     await self.client_ws.send_json({"type": "audio.done"})
                elif event_type == "response.audio_transcript.done":
                    # 텍스트 자막
                    await self.client_ws.send_json({
                        "type": "transcript.done",
                        "transcript": event["transcript"]
                    })
                    # [Tracker] AI 응답 자막 기록
                    self.tracker.add_transcript("assistant", event["transcript"])
                elif event_type == "input_audio_buffer.speech_started":
                    logger.info("VAD가 발화 시작을 감지함")
                    await self.client_ws.send_json({"type": "speech.started"})
                    # [Tracker] 사용자 발화 시작
                    self.tracker.start_user_speech()

                elif event_type == "input_audio_buffer.speech_stopped":
                    # [Tracker] 사용자 발화 종료 (VAD)
                    self.tracker.stop_user_speech()
                elif event_type == "conversation.item.input_audio_transcription.completed":
                    transcript = event.get("transcript", "")
                    logger.info(f"사용자 자막: {transcript}")
                    await self.client_ws.send_json({
                        "type": "user.transcript",
                        "transcript": transcript
                    })
                    # [Tracker] 사용자 자막 기록 & WPM 분석
                    wpm_status = self.tracker.add_transcript("user", transcript)
                    
                    # [Manager] 발화 속도에 따라 스타일 업데이트 (비동기 호출)
                    await self.conversation_manager.update_speaking_style(wpm_status)
                elif event_type == "error":
                    logger.error(f"OpenAI 오류: {event.get('error')}")

        except Exception as e:
            logger.error(f"OpenAI 수신 루프 중지됨: {e}")
            pass

    async def cleanup(self):
        """자원 정리"""
        if self.openai_task:
            self.openai_task.cancel()
        if self.openai_ws:
            await self.openai_ws.close()
        
        # [Tracker] 세션 종료 및 리포트 생성 (로그 출력)
        if hasattr(self, 'tracker'):
            report = self.tracker.finalize()
            logger.info(f"### Session Report ###\n{json.dumps(report, indent=2, ensure_ascii=False)}")
