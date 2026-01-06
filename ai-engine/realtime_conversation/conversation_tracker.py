import logging
import time
from datetime import datetime, timezone
from typing import List, Dict, Optional
import uuid

logger = logging.getLogger(__name__)

class ConversationTracker:
    """
    [대화 분석 트래커]
    
    세션 동안의 대화 흐름, 발화 시간, 자막(Transcript)을 메모리 상에서 추적합니다.
    세션이 종료되면 DB 저장을 위한 정형화된 데이터를 반환합니다.
    """
    def __init__(self, session_id: Optional[str] = None, title: Optional[str] = None):
        self.session_id = session_id or str(uuid.uuid4())
        self.title = title or "New Conversation"
        self.started_at_ts = time.time()
        self.started_at = datetime.now(timezone.utc).isoformat()
        
        # 메트릭
        self.user_speech_total_seconds = 0.0
        self._speech_start_time = None
        
        # 대화 로그 (Messages)
        # item structure: { "role": str, "content": str, "timestamp": str (iso), "duration_sec": float }
        self.messages: List[Dict] = []
        
        # 임시 저장소
        self._last_message_ts = None
        self._last_speech_duration = 0.0 # 방금 끝난 발화의 길이 저장용
        
        # WPM 추적
        self.wpm_history: List[float] = [] # 최근 WPM 값들

    def start_user_speech(self):
        """VAD: 사용자가 말을 시작했을 때 호출"""
        self._speech_start_time = time.time()
        logger.debug("[Tracker] 사용자 발화 시작 감지")

    def stop_user_speech(self):
        """VAD: 사용자가 말을 멈췄을 때 호출"""
        if self._speech_start_time:
            duration = time.time() - self._speech_start_time
            self.user_speech_total_seconds += duration
            self._last_speech_duration = duration # 자막 매핑을 위해 임시 저장
            self._speech_start_time = None
            logger.debug(f"[Tracker] 사용자 발화 종료. 추가 시간: {duration:.2f}초, 누적: {self.user_speech_total_seconds:.2f}초, 마지막: {self._last_speech_duration:.2f}초")

    def add_transcript(self, role: str, content: str) -> str:
        """
        완성된 자막(Transcript)을 대화 흐름에 추가하고, 사용자의 경우 WPM을 분석합니다.
        
        Args:
            role (str): "user" | "assistant"
            content (str): 발화 내용
            
        Returns:
            str: 현재 사용자의 발화 속도 상태 ("normal" | "slow" | "fast")
        """
        if not content.strip():
            return "normal"

        now = datetime.now(timezone.utc).isoformat()
        
        # 발화 길이 매핑 및 WPM 계산
        message_duration = 0.0
        current_wpm = 0.0
        
        if role == "user":
            # 사용자의 경우 방금 VAD로 측정된 길이를 사용
            message_duration = self._last_speech_duration
            self._last_speech_duration = 0.0 # 사용 후 초기화
            
            # WPM 계산 (5단어 이상만)
            word_count = len(content.split())
            if message_duration > 0.5 and word_count >= 5:
                current_wpm = (word_count / message_duration) * 60
                self.wpm_history.append(current_wpm)
                if len(self.wpm_history) > 5: # 최근 5개만 유지
                    self.wpm_history.pop(0)
                logger.debug(f"[Tracker] WPM Calculated: {current_wpm:.1f} (Words: {word_count}, Time: {message_duration:.2f}s)")
            else:
                logger.debug(f"[Tracker] WPM Skipped (Short): Words: {word_count}, Time: {message_duration:.2f}s")
        else:
            # AI의 경우 측정 하지 않음(추후 오디오 이벤트 연동 필요) AI발화속도 측정을 하고싶은 경우 여기 활용
            pass 
        
        message_entry = {
            "role": role,
            "content": content,
            "timestamp": now,
            "duration_sec": round(message_duration, 2)
        }
        self.messages.append(message_entry)
        logger.info(f"[Tracker] 메시지 추가 ({role}): {content[:20]}...")
        
        return self._determine_wpm_status()

    def _determine_wpm_status(self) -> str:
        """최근 WPM 평균을 기반으로 상태 결정"""
        if not self.wpm_history:
            return "normal"
            
        avg_wpm = sum(self.wpm_history) / len(self.wpm_history)
        
        if avg_wpm < 90:
            return "slow"
        elif avg_wpm > 140:
            return "fast"
        else:
            return "normal"

    def finalize(self) -> Dict:
        """
        세선 종료 시 최종 리포트를 반환합니다.
        추후엔 DB 로 저장 요청.
        """
        ended_at_ts = time.time()
        total_duration_sec = ended_at_ts - self.started_at_ts
        ended_at = datetime.now(timezone.utc).isoformat()
        
        # 혹시 발화 중 끊겼을 경우 잔여 시간 처리
        if self._speech_start_time:
            self.stop_user_speech()

        report = {
            "session_id": self.session_id,
            "title": self.title,
            "started_at": self.started_at,
            "ended_at": ended_at,
            "total_duration_sec": round(total_duration_sec, 2),
            "user_speech_duration_sec": round(self.user_speech_total_seconds, 2),
            "messages": self.messages
        }
        
        logger.info(f"[Tracker] 세션 리포트 생성 완료. 총 시간: {report['total_duration_sec']}초, 유저 발화: {report['user_speech_duration_sec']}초")
        return report
