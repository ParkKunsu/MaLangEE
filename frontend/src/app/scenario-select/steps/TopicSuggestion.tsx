"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Toggle } from "@/shared/ui";
import { ChevronLeft, ChevronRight, Mic, RefreshCw } from "lucide-react";
import { type Scenario, useScenarios } from "@/features/chat/api/scenarios";
import { useCreateChatSession } from "@/features/chat/api/use-chat-sessions";
import { PopupLayout } from "@/shared/ui/PopupLayout";

interface TopicSuggestionProps {
  textOpacity: number;
  onTopicSelect: (topic: string) => void;
  onBack: () => void;
  onShowMore: () => void;
}

interface VoiceOption {
  id: string;
  name: string;
  description: string;
}

// 목소리 옵션
const voiceOptions: VoiceOption[] = [
  { id: "echo", name: "Echo", description: "차분하고 안정적인 남성 목소리" },
  { id: "shimmer", name: "Shimmer", description: "따뜻하고 편안한 여성 목소리" },
  { id: "alloy", name: "Alloy", description: "부드럽고 친근한 중성 목소리" },
  { id: "nova", name: "Nova", description: "명랑하고 활기찬 여성 목소리" },
];

// 랜덤하게 5개 선택하는 함수
const getRandomScenarios = (scenarios: Scenario[]): Scenario[] => {
  if (scenarios.length <= 5) return scenarios;
  return [...scenarios].sort(() => Math.random() - 0.5).slice(0, 5);
};

export function TopicSuggestion({
  textOpacity,
  onTopicSelect,
  onBack,
  onShowMore,
}: TopicSuggestionProps) {
  const router = useRouter();
  const { data: scenarios, isLoading, error } = useScenarios();
  const createSessionMutation = useCreateChatSession();

  const [displayedScenarios, setDisplayedScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);

  // 자막/목소리 설정 상태
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [voiceIndex, setVoiceIndex] = useState(1); // 기본값: shimmer

  // 데이터 로드 시 랜덤 5개 선택
  useEffect(() => {
    if (scenarios && scenarios.length > 0) {
      setDisplayedScenarios(getRandomScenarios(scenarios));
    }
  }, [scenarios]);

  const handleShowMore = () => {
    if (scenarios && scenarios.length > 0) {
      setDisplayedScenarios(getRandomScenarios(scenarios));
    }
    onShowMore();
  };

  const handleDetailClick = (scenario: Scenario, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedScenario(scenario);
    setShowDetailPopup(true);
  };

  // 목소리 선택 핸들러
  const handlePrevVoice = () => {
    setVoiceIndex((prev) => (prev === 0 ? voiceOptions.length - 1 : prev - 1));
  };

  const handleNextVoice = () => {
    setVoiceIndex((prev) => (prev === voiceOptions.length - 1 ? 0 : prev + 1));
  };

  // 공통 세션 시작 함수
  const startConversation = async (
    scenario: Scenario,
    place: string,
    partner: string,
    goal: string,
    voice: string,
    showText: boolean
  ) => {
    try {
      // 세션 생성
      const sessionData = {
        scenario_id: scenario.id,
        scenario_place: place,
        scenario_partner: partner,
        scenario_goal: goal,
        voice: voice,
        show_text: showText,
      };

      const sessionResult = await createSessionMutation.mutateAsync(sessionData);

      // localStorage에 설정 저장
      localStorage.setItem("selectedVoice", voice);
      localStorage.setItem("subtitleEnabled", showText.toString());
      localStorage.setItem("chatSessionId", sessionResult.session_id);

      // 대화 페이지로 이동
      router.push(`/chat/conversation?sessionId=${sessionResult.session_id}`);
    } catch (error) {
      console.error("Failed to create session:", error);
      alert("세션 생성에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // "이 주제로 시작하기" 핸들러
  const handleStartOriginal = () => {
    if (!selectedScenario) return;
    setShowDetailPopup(false);
    startConversation(
      selectedScenario,
      selectedScenario.place,
      selectedScenario.partner,
      selectedScenario.goal,
      voiceOptions[voiceIndex].id,
      showSubtitle
    );
  };

  if (isLoading) {
    return (
      <div id="topic-suggestion" className="flex w-full flex-col items-center">
        <div className="text-group text-center" style={{ opacity: textOpacity }}>
          <h1 className="scenario-title">주제를 불러오는 중...</h1>
          <p className="scenario-desc">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (error || !scenarios || scenarios.length === 0) {
    return (
      <div id="topic-suggestion" className="flex w-full flex-col items-center">
        <div className="text-group text-center" style={{ opacity: textOpacity }}>
          <h1 className="scenario-title">주제를 불러올 수 없어요</h1>
          <p className="scenario-desc">잠시 후 다시 시도해주세요</p>
        </div>
        <div className="mt-8">
          <Button onClick={onBack} variant="outline-purple" size="xl" className="flex gap-2">
            <Mic size={20} />
            직접 말하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div id="topic-suggestion" className="flex w-full flex-col items-center">
        <div className="text-group text-center" style={{ opacity: textOpacity }}>
          <h1 className="scenario-title">이런 주제는 어때요?</h1>
          <p className="scenario-desc">요즘 인기 있는 주제들 중에서 골라볼까요?</p>
        </div>

        <div className="mt-8 flex w-full max-w-2xl flex-col gap-4">
          <div className="flex flex-wrap justify-center gap-3">
            {displayedScenarios.map((scenario) => (
              <div key={scenario.id} className="relative flex items-center gap-2">
                <Button
                  variant="outline-gray"
                  onClick={(e) => handleDetailClick(scenario, e)}
                  size="md"
                >
                  {scenario.title}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-center gap-3">
            <Button onClick={handleShowMore} variant="primary" size="lg" className="flex gap-2">
              <RefreshCw size={20} />
              다른 주제 더보기
            </Button>

            <Button onClick={onBack} variant="outline-purple" size="lg" className="flex gap-2">
              <Mic size={20} />
              직접 말하기
            </Button>
          </div>
        </div>
      </div>

      {/* 상세정보 팝업 */}
      {showDetailPopup && selectedScenario && (
        <PopupLayout onClose={() => setShowDetailPopup(false)} maxWidth="md" showCloseButton={true}>
          <div className="flex flex-col gap-6 py-6">
            <div className="text-center">
              <h2 className="text-text-primary mb-2 text-xl font-bold">{selectedScenario.title}</h2>
              <p className="text-text-secondary text-sm">{selectedScenario.description}</p>
            </div>

            <div className="space-y-6">
              {/* 시나리오 정보 카드 */}
              <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-6">
                <div className="flex items-start gap-3">
                  <span className="text-brand min-w-[60px] text-sm font-bold">장소:</span>
                  <span className="text-text-primary text-sm">{selectedScenario.place}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-brand min-w-[60px] text-sm font-bold">상대:</span>
                  <span className="text-text-primary text-sm">{selectedScenario.partner}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-brand min-w-[60px] text-sm font-bold">목표:</span>
                  <span className="text-text-primary text-sm">{selectedScenario.goal}</span>
                </div>
              </div>

              {/* 대화 설정 섹션 */}
              <div className="space-y-4">
                <h3 className="px-1 text-sm font-bold text-gray-700">대화 설정</h3>
                <div className="space-y-5 rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <Toggle label="자막 표시" enabled={showSubtitle} onChange={setShowSubtitle} />

                  <div className="space-y-2">
                    <p className="px-1 text-sm font-bold text-gray-700">목소리 톤</p>
                    <div className="flex items-center gap-4 rounded-xl border border-gray-100  bg-white p-3">
                      <button
                        onClick={handlePrevVoice}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <div className="flex-1 text-center">
                        <p className="font-bold text-gray-800">{voiceOptions[voiceIndex].name}</p>
                        <p className="text-[11px] leading-tight text-gray-500">
                          {voiceOptions[voiceIndex].description}
                        </p>
                      </div>
                      <button
                        onClick={handleNextVoice}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="mt-2 flex gap-3">
              <Button variant="primary" size="lg" className="flex-1 " onClick={handleStartOriginal}>
                이 주제로 시작하기
              </Button>
            </div>
          </div>
        </PopupLayout>
      )}
    </>
  );
}
