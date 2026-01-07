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

        # [Refactor] 3-Layer Prompt Variables (3단 프롬프트 관리 구조)
        # 1. Base: 파일에서 로드한 불변의 기본 페르소나 및 핵심 규칙
        self.instruction_base = self.system_instructions
        
        # 2. Active User: 프론트엔드(클라이언트)에서 session.update로 요청한 추가 설정
        #    (예: "한국어로 설명해줘", "존댓말 써줘" 등)
        self.instruction_active_user = ""
        
        # 3. Dynamic: 백엔드 로직(WPM 분석 등)에 의해 자동으로 추가되는 상태 기반 지시사항
        #    (예: "사용자가 말이 빠르니 너도 자연스럽게 빨리 말해")
        self.instruction_dynamic = ""

        # 디폴트 설정
        self.current_config = {
            "modalities": ["audio", "text"],
            "instructions": self.instruction_base, # 초기값은 Base만

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
        
        # [Refactor] 초기 프롬프트 조립 (Base + User + Dynamic)
        self.current_config["instructions"] = self._assemble_instructions()

        # 현재 저장된 설정값 로그 출력
        logger.info(f"세션 초기화 시작. 적용할 설정: {json.dumps(self.current_config, ensure_ascii=False)}")

        session_config = {
            "type": "session.update",
            "session": self.current_config
        }
        
        await openai_ws.send(json.dumps(session_config))
        logger.info("-> session.update 전송 완료 (초기화)")

    async def inject_history(self, messages: list):
        """
        이전 대화 기록을 OpenAI 세션에 주입합니다.
        
        Args:
            messages (list): [{role: 'user'|'assistant', content: '...'}, ...] 형태의 리스트
        """
        if not self.openai_ws:
            logger.warning("OpenAI WebScoket이 연결되지 않아 히스토리를 주입할 수 없습니다.")
            return

        logger.info(f"대화 히스토리 주입 시작 ({len(messages)}건)")
        
        for msg in messages:
            # role 매핑 ('user' -> 'user', 'assistant' -> 'assistant')
            # system 메시지는 보통 제외하거나 session instructions에 녹임
            if msg['role'] not in ['user', 'assistant']:
                continue
                
            item_event = {
                "type": "conversation.item.create",
                "item": {
                    "type": "message",
                    "role": msg['role'],
                    "content": [
                        {
                            "type": "input_text",
                            "text": msg['content']
                        } 
                    ]
                }
            }
            await self.openai_ws.send(json.dumps(item_event))
            
        logger.info("-> 대화 히스토리 주입 완료")

    def _assemble_instructions(self) -> str:
        """
        [3-Layer Prompt Assembly]
        세 가지 소스의 프롬프트를 합쳐서 최종 시스템 지시사항을 생성합니다.
        
        순서: Base(기본) -> User(사용자요구) -> Dynamic(동적상황)
        이렇게 함으로써 기본 페르소나를 유지하면서도 사용자 설정과 상황별 가이드를 
        모두 충돌 없이 적용할 수 있습니다.
        """
        parts = [self.instruction_base]
        
        if self.instruction_active_user:
            parts.append(f"\n\n[User Requirement]\n{self.instruction_active_user}")
            
        if self.instruction_dynamic:
            parts.append(f"\n\n[Dynamic Adjustment]\n{self.instruction_dynamic}")
            
        return "".join(parts)

    async def update_session_settings(self, new_settings: dict) -> bool:
        """
        세션 설정을 업데이트합니다.
        
        Returns:
            bool: 재연결(Reconnect)이 필요한지 여부.
        """
        logger.info(f"세션 설정 업데이트 요청: {new_settings.keys()}")
        should_reconnect = False

        # [Refactor] instructions 분리 처리
        if "instructions" in new_settings:
            # 프론트엔드에서 오는 요청은 'Active User' 레이어만 업데이트
            self.instruction_active_user = new_settings.pop("instructions")
            logger.info(f"사용자 프롬프트(User Layer) 업데이트됨: {self.instruction_active_user}")
            
            # 최종 조립 후 실제 전송용 payload에 다시 담기
            new_settings["instructions"] = self._assemble_instructions()

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
        new_dynamic_instruction = ""
        if wpm_status == "slow":
            new_dynamic_instruction = "The user speaks slowly. Please speak slowly and clearly, articulating every word."
        elif wpm_status == "fast":
            new_dynamic_instruction = "The user is fluent. You should speak at a natural, faster pace like a native speaker."
        
        # 변경사항이 없으면 리턴
        if self.instruction_dynamic == new_dynamic_instruction:
            return

        logger.info(f"시스템 프롬프트 동적 변경 (WPM: {wpm_status})")
        
        # [Refactor] Dynamic 레이어만 업데이트
        self.instruction_dynamic = new_dynamic_instruction
        
        # 전체 프롬프트 재조립
        assembled = self._assemble_instructions()
        self.current_config["instructions"] = assembled
        
        # 직접 전송 (User 레이어 영향 없이)
        if self.openai_ws:
            try:
                await self.openai_ws.send(json.dumps({
                    "type": "session.update",
                    "session": {
                        "instructions": assembled
                    }
                }))
                logger.info("-> WPM 반영 프롬프트 업데이트 전송 완료")
            except Exception as e:
                logger.error(f"WPM 업데이트 실패: {e}")
