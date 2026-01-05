import asyncio
import json
import logging
import os

logger = logging.getLogger(__name__)

class ConversationManager:
    """
    [대화 세션 관리자]
    
    이 클래스는 OpenAI Realtime API 세션의 설정(Configuration)과
    시스템 지시사항(System Instructions)을 관리합니다.
    
    주요 역할:
    1. 세션 초기화 (init):
       - OpenAI에 'session.update' 이벤트를 보내서 VAD, 음성, 포맷 등을 설정합니다.
    
    2. 프롬프트/지시사항 관리:
       - AI의 페르소나('Malang')와 대화 스타일을 정의합니다.
       - 필요 시 동적으로 지시사항을 변경할 수 있는 메서드를 제공합니다.
    """
    def __init__(self):
        # 프롬프트 파일 경로 설정 (현재 파일 기준 상위 디렉토리의 prompts/system_instruction.md)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        prompt_path = os.path.join(current_dir, "..", "prompts", "system_instruction.md")
        
        try:
            with open(prompt_path, "r", encoding="utf-8") as f:
                self.system_instructions = f.read().strip()
        except FileNotFoundError:
            # 파일이 없을 경우 기본값 사용 (안전장치)
            self.system_instructions = (
                "You are a helpful and friendly English tutor named 'Malang'. "
                "Speak naturally."
            )
            print(f"Warning: Prompt file not found at {prompt_path}")

        self.current_config = {
            "modalities": ["audio", "text"],
            "instructions": self.system_instructions,
            "voice": "alloy",
            "input_audio_format": "pcm16",
            "output_audio_format": "pcm16",
            "turn_detection": {
                "type": "server_vad",
                "threshold": 0.5,
                "prefix_padding_ms": 300,
                "silence_duration_ms": 500,
            },
            "input_audio_transcription": {
                "model": "whisper-1"
            },
        }

    async def initialize_session(self, openai_ws):
        """
        OpenAI 세션을 초기화합니다.
        저장된 current_config를 사용하여 세션 설정을 전송합니다.
        """
        self.openai_ws = openai_ws # 웹소켓 객체 저장 (나중에 업데이트 할 때 사용)
        
        # 현재 저장된 설정값 로그 출력
        logger.info(f"세션 초기화 시작. 적용할 설정: {json.dumps(self.current_config, ensure_ascii=False)}")

        session_config = {
            "type": "session.update",
            "session": self.current_config
        }
        
        await openai_ws.send(json.dumps(session_config))
        logger.info("-> session.update 전송 완료 (초기화)")

    async def update_session_settings(self, new_settings: dict) -> bool:
        """
        세션 설정을 업데이트합니다.
        
        Returns:
            bool: 재연결(Reconnect)이 필요한지 여부.
        """
        logger.info(f"세션 설정 업데이트 요청: {new_settings.keys()}")
        should_reconnect = False

        # 1. 내부 설정값 업데이트
        for key, value in new_settings.items():
            if key in self.current_config:
                if self.current_config[key] != value:
                    self.current_config[key] = value
                    # voice 변경 시 재연결 필요
                    if key == "voice":
                        should_reconnect = True 
        
        # 2. 재연결이 필요 없는 경우 즉시 전송
        if not should_reconnect and self.openai_ws:
            try:
                update_payload = {
                    "type": "session.update",
                    "session": new_settings
                }
                await self.openai_ws.send(json.dumps(update_payload))
                logger.info(f"-> 실시간 설정 업데이트 전송 완료: {new_settings.keys()}")
            except Exception as e:
                logger.error(f"세션 업데이트 전송 실패: {e}")
        
        return should_reconnect

    async def update_speaking_style(self, wpm_status: str):
        """
        사용자의 발화 속도(WPM Status)에 따라 시스템 프롬프트를 동적으로 업데이트합니다.
        
        Args:
            wpm_status (str): "slow" | "normal" | "fast"
        """
        logger.info(f"발화 스타일 업데이트 요청: {wpm_status}")
        
        dynamic_instruction = ""
        if wpm_status == "slow":
            dynamic_instruction = "\n\n[Dynamic Instruction] The user speaks slowly. Please speak slowly and clearly, articulating every word."
        elif wpm_status == "fast":
            dynamic_instruction = "\n\n[Dynamic Instruction] The user is fluent. You should speak at a natural, faster pace like a native speaker."
        else:
            # Normal인 경우 기본 프롬프트만 사용 (추가 문구 없음)
            pass

        # 기존 베이스 프롬프트 뒤에 추가
        new_instructions = self.system_instructions + dynamic_instruction
        
        # 현재 적용된 지시사항과 다를 경우에만 업데이트 수행
        if self.current_config["instructions"] != new_instructions:
            logger.info(f"시스템 프롬프트 변경 감지 (Status: {wpm_status})")
            await self.update_session_settings({"instructions": new_instructions})
