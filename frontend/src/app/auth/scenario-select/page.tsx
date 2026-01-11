"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MicButton } from "@/shared/ui";
import "@/shared/styles/scenario.css";
import { FullLayout } from "@/shared/ui/FullLayout";

/**
 * 시나리오 선택 페이지 상태
 * 0: 초기 상태 (대기)
 * 1: 음성 인식 중 (듣는 중)
 * 2: 인식 실패 (에러)
 * 3: 인식 성공 및 분석 중 (성공)
 */
type ScenarioState = 0 | 1 | 2 | 3;

export default function ScenarioSelectPage() {
  const router = useRouter();
  const [currentState, setCurrentState] = useState<ScenarioState>(0);
  const [isListening, setIsListening] = useState(false);
  const [textOpacity, setTextOpacity] = useState(1);

  const handleMicClick = () => {
    if (currentState === 3) return;

    // Fade out text
    setTextOpacity(0);

    setTimeout(() => {
      if (currentState === 0 || currentState === 2) {
        // 대기 또는 에러 -> 듣는 중
        setCurrentState(1);
        setIsListening(true);
      } else if (currentState === 1) {
        // 듣는 중 -> 결과 처리 (시뮬레이션)
        // 실제로는 여기서 음성 데이터를 서버로 전송하고 결과를 기다립니다.
        const isSuccess = Math.random() > 0.2; // 80% 확률로 성공 시뮬레이션

        if (isSuccess) {
          setCurrentState(3);
          setIsListening(false);
          // 성공 시 1.5초 후 토픽 선택 페이지로 이동
          setTimeout(() => {
            router.push("/auth/scenario-select");
          }, 1500);
        } else {
          setCurrentState(2);
          setIsListening(false);
        }
      }
      // Fade in text
      setTextOpacity(1);
    }, 300);
  };

  const getMainTitle = () => {
    switch (currentState) {
      case 0:
        return "어떤 상황을 연습하고 싶은지\n편하게 말해보세요.";
      case 1:
        return "장소나 상황 또는 키워드로\n말씀해 주세요.";
      case 2:
        return "말랭이가 잘 이해하지 못했어요.";
      case 3:
        return "좋아요! 상황을 파악했어요.\n잠시만 기다려주세요.";
      default:
        return "";
    }
  };

  const getSubDesc = () => {
    switch (currentState) {
      case 0:
        return "마이크를 누르면 바로 시작돼요";
      case 1:
        return "다 듣고 나면 마이크를 다시 눌러주세요";
      case 2:
        return "다시 한번 말씀해 주시겠어요?";
      case 3:
        return "곧 연습을 시작할게요!";
      default:
        return "";
    }
  };

  return (
    <FullLayout showHeader={true} maxWidth="md:max-w-[60vw]">
      {/* Character */}
      <div className="character-box">
        <Image
          src="/images/malangee.svg"
          alt="MalangEE Character"
          width={150}
          height={150}
          priority
        />
      </div>

      {/* Text Group */}
      <div className="text-group text-center" style={{ opacity: textOpacity }}>
        <h1 className="scenario-title">{getMainTitle()}</h1>
        <p className="scenario-desc">{getSubDesc()}</p>
      </div>

      {/* Mic Button - Footer */}
      <div className="mt-8">
        <MicButton
          isListening={isListening}
          onClick={handleMicClick}
          size="md"
          className={currentState === 3 ? "pointer-events-none opacity-50" : ""}
        />
      </div>
    </FullLayout>
  );
}
