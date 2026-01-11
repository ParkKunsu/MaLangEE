/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { SplitViewLayout } from "@/shared/ui/SplitViewLayout";
import { Button } from "@/shared/ui";
import { useRouter } from "next/navigation";
import { useGetChatSessions } from "@/features/chat";
import type { ChatHistoryItem } from "@/shared/types/chat";
import { ChatDetailPopup } from "./ChatDetailPopup";
import { NicknameChangePopup } from "./NicknameChangePopup";

const ITEMS_PER_PAGE = 10;
const DEBUG_MODE = process.env.NODE_ENV === "development";

interface UserProfile {
  nickname: string;
  totalDurationSec: number;
  userDurationSec: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [displayPage, setDisplayPage] = useState(1);
  const [allSessions, setAllSessions] = useState<ChatHistoryItem[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(!DEBUG_MODE);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatHistoryItem | null>(null);
  const [showNicknamePopup, setShowNicknamePopup] = useState(false);

  // 프로덕션 모드에서 API 호출 (디버그 모드에서는 무시됨)
  const { data: sessions } = useGetChatSessions(0, 20);

  // 화면에 표시할 세션 데이터 계산
  const visibleSessions = allSessions.slice(0, displayPage * ITEMS_PER_PAGE);
  const hasMore = visibleSessions.length < allSessions.length;

  // 사용자 프로필 테스트 데이터 생성 함수
  const generateUserProfileTestData = (): UserProfile => {
    const nicknameList = ["Sophie", "Alex", "Emma", "James", "Lisa", "David", "Maria", "Chris"];
    const randomNickname = nicknameList[Math.floor(Math.random() * nicknameList.length)];

    // 총 말랭이와 함께한 시간: 100시간 ~ 500시간
    const totalDurationSec = Math.floor(Math.random() * 400 * 3600) + 100 * 3600;
    // 내가 말한 시간: 전체의 40~70%
    const userDurationSec = Math.floor(totalDurationSec * (0.4 + Math.random() * 0.3));

    return {
      nickname: randomNickname,
      totalDurationSec,
      userDurationSec,
    };
  };

  // 테스트 데이터 생성 함수
  const generateTestData = (): ChatHistoryItem[] => {
    const testTitles = [
      "Ordering coke at Mcdonald's",
      "Planning Birthday Party",
      "Opinion About Mandatory Military...",
      "Zootopia 2 Review",
      "Fancy Restaurant on Christmas wit...",
      "Buying T-shirts in Shopping Mall",
      "Introducing My Grand Parents",
      "Restaurant with someone to eat a...",
      "Hotel Booking Conversation",
      "Flight Reservation Dialog",
      "Coffee Shop Order",
      "Movie Theater Reservation",
      "Restaurant Complaint",
      "Hotel Check-in Process",
      "Taxi Booking Service",
      "Bank Account Opening",
      "Insurance Claim Discussion",
      "Job Interview Preparation",
      "University Application Consultation",
      "Travel Itinerary Planning",
    ];

    return Array.from({ length: 50 }, (_, index) => {
      const daysAgo = Math.floor(index / 2);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      const dateString = date.toLocaleDateString("ko-KR").replace(/\. /g, ".");

      const totalSec = Math.floor(Math.random() * 3600) + 600; // 10분~1시간
      const userSpeechSec = Math.floor(totalSec * (0.4 + Math.random() * 0.3)); // 40~70%

      const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      };

      return {
        id: `test-session-${index + 1}`,
        date: dateString,
        title: testTitles[index % testTitles.length],
        duration: `${formatTime(userSpeechSec)} / ${formatTime(totalSec)}`,
        totalDurationSec: totalSec,
        userSpeechDurationSec: userSpeechSec,
      };
    });
  };

  // 세션 데이터를 UI 형식으로 변환 (프로덕션 모드에서만)
  useEffect(() => {
    if (!DEBUG_MODE && sessions && Array.isArray(sessions)) {
      const transformed: ChatHistoryItem[] = sessions.map((session) => {
        const startDate = new Date(session.started_at);
        const dateString = startDate.toLocaleDateString("ko-KR").replace(/\. /g, ".");

        // 총 시간 포맷팅
        const totalHours = Math.floor(session.total_duration_sec / 3600);
        const totalMinutes = Math.floor((session.total_duration_sec % 3600) / 60);
        const totalSeconds = session.total_duration_sec % 60;

        // 사용자 말한 시간 포맷팅
        const userHours = Math.floor(session.user_speech_duration_sec / 3600);
        const userMinutes = Math.floor((session.user_speech_duration_sec % 3600) / 60);
        const userSeconds = session.user_speech_duration_sec % 60;

        const totalDurationStr = `${String(totalHours).padStart(2, "0")}:${String(totalMinutes).padStart(2, "0")}:${String(totalSeconds).padStart(2, "0")}`;
        const userDurationStr = `${String(userHours).padStart(2, "0")}:${String(userMinutes).padStart(2, "0")}:${String(userSeconds).padStart(2, "0")}`;

        return {
          id: session.session_id,
          date: dateString,
          title: session.title,
          duration: `${userDurationStr} / ${totalDurationStr}`,
          totalDurationSec: session.total_duration_sec,
          userSpeechDurationSec: session.user_speech_duration_sec,
        };
      });

      setAllSessions(transformed);
      setIsInitialLoading(false);
    }
  }, [sessions]);

  // 테스트 데이터 초기 로드 (디버그 모드에서만)
  useEffect(() => {
    if (DEBUG_MODE) {
      const testData = generateTestData();
      const testUserProfile = generateUserProfileTestData();
      setAllSessions(testData);
      setUserProfile(testUserProfile);
    }
  }, []);

  // 스크롤 감지 함수
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isLoadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

    // 스크롤이 하단에 도달했을 때 (마진: 50px)
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setIsLoadingMore(true);
      // 데이터 로딩
      setTimeout(() => {
        setDisplayPage((prev) => prev + 1);
        setIsLoadingMore(false);
      }, 300);
    }
  }, [isLoadingMore, hasMore]);

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}시간 ${minutes}분 ${secs}초`;
  };

  // 왼쪽 컨텐츠
  const leftContent = (
    <div className="w-full max-w-sm tracking-tight">
      {/* Added wrapper width and tracking */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl font-bold">{userProfile?.nickname || "닉네임"}</div>
        <Button
          variant="secondary"
          size="auto"
          onClick={() => setShowNicknamePopup(true)}
        >
          닉네임 변경
        </Button>
      </div>
      <div className="mt-4 space-y-1">
        {" "}
        {/* Reduced space-y */}
        <div className="flex items-center justify-between">
          <span className="text-sm">말랭이와 함께한 시간</span>
          <span className="text-sm font-bold">
            {userProfile ? formatDuration(userProfile.totalDurationSec) : "0시간 0분 0초"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">내가 말한 시간</span>
          <span className="text-sm font-bold">
            {userProfile ? formatDuration(userProfile.userDurationSec) : "0시간 0분 0초"}
          </span>
        </div>
      </div>
      <Button
        variant="solid"
        size="md"
        className="mt-6"
        onClick={() => router.push("/chat/welcome-back")}
      >
        말랭이랑 새로운 대화를 해볼까요?
      </Button>
    </div>
  );

  // 오른쪽 컨텐츠
  const rightContent = (
    <div className="w-full tracking-tight">
      {/* 제목 */}
      <div className="mb-4 mt-0 flex w-full justify-start">
        <h2 className="text-2xl font-bold text-[#1F1C2B]">대화 내역</h2>
      </div>
      {/* 대화 목록 */}
      <div
        ref={scrollContainerRef}
        className="custom-scrollbar left-0 flex flex-col items-start justify-start w-full max-h-[350px] overflow-y-auto pr-2"
      >
        {allSessions.length === 0 && isInitialLoading ? (
          <div className="flex w-full items-center justify-center">
            <div className="border-3 h-8 w-8 animate-spin rounded-full border-[#5F51D9] border-t-transparent"></div>
          </div>
        ) : allSessions.length === 0 ? (
          <div className="flex w-full items-center justify-center text-xs text-gray-500">
            대화 내역이 없습니다
          </div>
        ) : (
          <>
            {visibleSessions.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedSession(item);
                  setShowDetailPopup(true);
                }}
                className="flex w-full cursor-pointer items-center gap-4 border-b border-[#D5D2DE] px-0 py-2 transition-all hover:bg-gray-50"
              >
                {/* 날짜 */}
                <div className="flex min-w-[80px] flex-col items-center justify-center text-sm text-[#6A667A]">
                  {item.date}
                </div>

                {/* 제목과 시간 */}
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {/* 제목 */}
                  <div className="flex min-w-0 flex-1 flex-col items-start justify-center">
                    <p className="truncate font-semibold text-[#1F1C2B] ">{item.title}</p>
                  </div>

                  {/* 시간 */}
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-sm font-normal text-[#6A667A]">{item.duration}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* 로딩 상태 표시 */}
            {isLoadingMore && hasMore && (
              <div className="flex w-full items-center justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#5F51D9] border-t-transparent"></div>
              </div>
            )}

            {/* 데이터가 없거나 모두 로드됨 */}
            {!hasMore && allSessions.length > 0 && (
              <div className="flex w-full items-center justify-center py-4 text-xs text-gray-500">
                모든 데이터를 불러왔습니다 (조회된 데이터: {allSessions.length}건 / 페이지: {displayPage})
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <SplitViewLayout
        leftChildren={leftContent}
        rightChildren={rightContent}
        bgClass="bg-chat-history"
        leftColSpan={4}
        rightColSpan={8}
        showHeader={!showNicknamePopup && !showDetailPopup}
      />

      {/* 대화 상세 팝업 */}
      {showDetailPopup && selectedSession && (
        <ChatDetailPopup
          session={selectedSession}
          onClose={() => setShowDetailPopup(false)}
        />
      )}

      {/* 닉네임 변경 팝업 */}
      {showNicknamePopup && (
        <NicknameChangePopup
          onClose={() => setShowNicknamePopup(false)}
          onSuccess={() => {
            // 사용자 프로필 새로고침이 필요한 경우 여기에 로직 추가
            // 현재는 디버그 모드에서 테스트 데이터를 사용하므로 별도 처리 없음
          }}
        />
      )}
    </>
  );
}
