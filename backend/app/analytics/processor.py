from typing import List, Dict, Set
import re
from collections import Counter
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import ConversationSession, ChatMessage
from app.analytics.models import ScenarioStatistics, UserLearningMap

class TextAnalyzer:
    """
    텍스트 분석 엔진 (NLP MVP)
    """
    STOPWORDS: Set[str] = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", 
        "is", "are", "was", "were", "be", "been", "am", "i", "you", "he", "she", "it", "we", "they",
        "this", "that", "these", "those", "my", "your", "his", "her", "its", "our", "their",
        "what", "where", "when", "who", "how", "why", "just", "so", "very", "can", "could", "will", "would"
    }

    @classmethod
    def extract_keywords(cls, text: str) -> List[str]:
        if not text:
            return []
        
        # 1. 소문자 변환
        text = text.lower()
        
        # 2. 특수문자 제거 (알파벳과 공백만 남김)
        text = re.sub(r'[^a-z\s]', '', text)
        
        # 3. 토큰화 (띄어쓰기 기준)
        words = text.split()
        
        # 4. 불용어 제거 & 2글자 이하 단어 제거
        keywords = [w for w in words if w not in cls.STOPWORDS and len(w) > 2]
        return keywords

    @classmethod
    def calculate_richness_score(cls, words: List[str]) -> float:
        """
        어휘 다양성 점수 (Type-Token Ratio * 100)
        """
        if not words:
            return 0.0
        
        total_tokens = len(words)
        unique_types = len(set(words))
        
        # 단순 TTR (0 ~ 100점)
        return round((unique_types / total_tokens) * 100, 2)


class AnalyticsProcessor:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def update_scenario_stats(self, scenario_id: str, new_user_messages: List[str]):
        """
        특정 시나리오의 통계를 갱신합니다. (배치/이벤트 기반)
        """
        if not new_user_messages:
            return

        # 1. 텍스트 분석
        all_keywords = []
        for msg in new_user_messages:
            all_keywords.extend(TextAnalyzer.extract_keywords(msg))
        
        new_word_counts = Counter(all_keywords)
        
        # 2. 기존 통계 가져오기 (Row Lock for Concurrency)
        stmt = select(ScenarioStatistics).where(ScenarioStatistics.scenario_id == scenario_key).with_for_update()
        result = await self.db.execute(stmt)
        stat = result.scalars().first()
        
        if not stat:
            # Insert 시에는 Lock이 없음 (트랜잭션 격리수준에 따름)
            # 엄밀히는 Upsert(INSERT ON CONFLICT)가 필요하지만, SQLAlchemy ORM에서는 복잡하므로 
            # 여기서는 '없으면 생성' 로직 유지 (매우 낮은 확률의 Insert 충돌은 감수)
            stat = ScenarioStatistics(scenario_id=scenario_key, total_plays=0, avg_turns=0.0, top_keywords={})
            self.db.add(stat)

        # 3. 데이터 업데이트 (누적)
        # 주의: top_keywords는 DB에서 읽은 기존 값과 합쳐야 함
        current_keywords = stat.top_keywords or {}
        # Counter로 합치기
        total_counter = Counter(current_keywords) + new_word_counts
        
        # Top 20만 남기기
        stat.top_keywords = dict(total_counter.most_common(20))
        stat.total_plays += 1
        
        # 평균 턴 수 업데이트 (Moving Average)
        # avg_new = (avg_old * (n-1) + current_turn) / n 
        # (여기서는 간단히 처리하기 위해 생략하거나 별도 로직 필요, 일단 단순 +1 처리만 함)
        
        await self.db.commit()

    async def update_user_stats(self, user_id: int, new_user_messages: List[str]):
        """
        유저의 학습 데이터를 갱신합니다.
        """
        if not new_user_messages:
            return

        # 1. 키워드 추출
        session_words = []
        for msg in new_user_messages:
            session_words.extend(TextAnalyzer.extract_keywords(msg))
            
        session_word_count = len(session_words)
        session_unique_words = set(session_words)
        
        # 2. DB 조회 (Row Lock)
        stmt = select(UserLearningMap).where(UserLearningMap.user_id == user_id).with_for_update()
        result = await self.db.execute(stmt)
        user_map = result.scalars().first()
        
        if not user_map:
            user_map = UserLearningMap(user_id=user_id, total_spoken_words=0, vocabulary_size=0, expression_richness_score=0.0)
            self.db.add(user_map)
            
        # 3. 업데이트
        user_map.total_spoken_words += session_word_count
        
        # *주의*: vocabulary_size는 '누적' 고유 단어 수이므로, 
        # 정확히 하려면 별도의 'UserVocabulary' 테이블(단어장)이 있어야 중복 여부를 알 수 있음.
        # MVP 단계에서는 단순 합산 보다는, 이번 세션의 다양성을 '점수'에 반영하는 것으로 타협.
        
        # 다양성 점수 (이번 세션 기준)
        current_richness = TextAnalyzer.calculate_richness_score(session_words)
        
        # 기존 점수와 평균 내기 (최근 10개 세션 평균 등 복잡한 로직 대신, 50:50 가중치 적용 등 단순화)
        if user_map.expression_richness_score == 0:
             user_map.expression_richness_score = current_richness
        else:
            # 기존 점수 70%, 이번 점수 30% 반영 (변화 체감용)
            user_map.expression_richness_score = round(user_map.expression_richness_score * 0.7 + current_richness * 0.3, 2)

        # Vocabulary Size: (MVP) 일단 session_unique 값을 더하는 건 부정확하지만, 
        # 성장 그래프를 보여주기 위해 'Increment' 방식으로 처리 (실제로는 Set DB 필요)
        # 여기서는 보수적으로 '이번 세션의 신규 단어 추정치'를 더함 (예: 20%)
        estimated_new_words = int(len(session_unique_words) * 0.2) 
        user_map.vocabulary_size += max(1, estimated_new_words)

        await self.db.commit()

    async def process_session_analytics(self, session_id: str):
        """
        [Entry Point] 단일 세션에 대한 분석을 수행하고 is_analyzed 플래그를 업데이트합니다.
        (실시간 Trigger용)
        """
        from sqlalchemy.orm import selectinload
        
        # 1. 세션 조회 (메시지 포함)
        stmt = (
            select(ConversationSession)
            .where(ConversationSession.session_id == session_id)
            .options(selectinload(ConversationSession.messages))
        )
        result = await self.db.execute(stmt)
        session = result.scalars().first()
        
        if not session:
            return False
            
        # 2. 이미 분석된 세션인지 확인 (중복 방지)
        if session.is_analyzed:
            return False
            
        # 3. 유저 발화 추출
        user_messages = [msg.content for msg in session.messages if msg.role == 'user']
        
        if not user_messages:
            # 발화가 없어도 분석 완료 처리 (더 이상 볼 필요 없음)
            session.is_analyzed = True
            await self.db.commit()
            return True
            
        
        # 4. 통계 업데이트
        # A. 시나리오 통계
        # [Phase 2] scenario_id(FK)가 있으면 그것을 우선 사용, 없으면 legacy(place) 사용
        scenario_key = session.scenario_id or session.scenario_place or "unknown_scenario"
        await self.update_scenario_stats(scenario_key, user_messages)
        
        # B. 유저 통계
        if session.user_id:
            await self.update_user_stats(session.user_id, user_messages)
            
        # 5. 플래그 업데이트
        session.is_analyzed = True
        await self.db.commit()
        return True
