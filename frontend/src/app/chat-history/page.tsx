"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { SplitViewLayout } from "@/shared/ui/SplitViewLayout";
import { Button } from "@/shared/ui";
import { useRouter } from "next/navigation";
import { useGetChatSessions } from "@/features/chat";
import { AuthGuard, useAuth, useCurrentUser } from "@/features/auth";
import type { ChatHistoryItem } from "@/shared/types/chat";
import { ChatDetailPopup } from "./ChatDetailPopup";
import { NicknameChangePopup } from "./NicknameChangePopup";

const ITEMS_PER_PAGE = 10;

interface UserProfile {
  nickname: string;
  totalDurationSec: number;
  userDurationSec: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [displayPage, setDisplayPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatHistoryItem | null>(null);
  const [showNicknamePopup, setShowNicknamePopup] = useState(false);
  const { logout } = useAuth();

  // 실제 API 호출
  const { data: sessions, isLoading: isSessionsLoading } = useGetChatSessions(0, 100);
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();

  // 세션 데이터를 UI 형식으로 변환 (useMemo 사용)
  const allSessions = useMemo<ChatHistoryItem[]>(() => {
    if (!sessions || !Array.isArray(sessions)) return [];

    return sessions.map((session) => {
      const startDate = new Date(session.started_at);
      const dateString = startDate.toLocaleDateString("ko-KR").replace(/\. /g, ".");

      // 총 시간 포맷팅
      const totalHours = Math.floor(session.total_duration_sec / 3600);
      const totalMinutes = Math.floor((session.total_duration_sec % 3600) / 60);
      const totalSeconds = Math.floor(session.total_duration_sec % 60);

      // 사용자 말한 시간 포맷팅
      const userHours = Math.floor(session.user_speech_duration_sec / 3600);
      const userMinutes = Math.floor((session.user_speech_duration_sec % 3600) / 60);
      const userSeconds = Math.floor(session.user_speech_duration_sec % 60);

      const totalDurationStr = `${String(totalHours).padStart(2, "0")}:${String(totalMinutes).padStart(2, "0")}:${String(totalSeconds).padStart(2, "0")}`;
      const userDurationStr = `${String(userHours).padStart(2, "0")}:${String(userMinutes).padStart(2, "0")}:${String(userSeconds).padStart(2, "0")}`;

      return {
        id: session.session_id,
        date: dateString,
        title: session.title || "대화 세션",
        duration: `${userDurationStr} / ${totalDurationStr}`,
        totalDurationSec: session.total_duration_sec,
        userSpeechDurationSec: session.user_speech_duration_sec,
      };
    });
  }, [sessions]);

  // 화면에 표시할 세션 데이터 계산
  const visibleSessions = allSessions.slice(0, displayPage * ITEMS_PER_PAGE);
  const hasMore = visibleSessions.length < allSessions.length;

  // 사용자 프로필 계산 (세션 데이터에서 합산)
  const userProfile: UserProfile | null = useMemo(() => {
    if (!currentUser) return null;

    const totalDurationSec = allSessions.reduce((sum, s) => sum + s.totalDurationSec, 0);
    const userDurationSec = allSessions.reduce((sum, s) => sum + s.userSpeechDurationSec, 0);

    return {
      nickname: currentUser.nickname || currentUser.login_id,
      totalDurationSec,
      userDurationSec,
    };
  }, [currentUser, allSessions]);

  // 로딩 상태
  const isInitialLoading = isSessionsLoading || isUserLoading;

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
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{userProfile?.nickname || "닉네임"}</div>
          <button
            type="button"
            onClick={() => setShowNicknamePopup(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6A667A] transition-colors hover:text-[#5F51D9]"
            aria-label="닉네임 변경"
          >
            <Pencil size={16} stroke="gray" />
          </button>
        </div>
        <Button variant="secondary" size="auto" onClick={logout}>
          로그아웃
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

      {allSessions.length === 0 && isInitialLoading ? (
        <div className="flex w-full items-center justify-center">
          <div className="border-3 h-8 w-8 animate-spin rounded-full border-[#5F51D9] border-t-transparent"></div>
        </div>
      ) : allSessions.length === 0 ? (
        <div className="flex min-h-112.5 w-full items-center justify-center text-xl text-gray-500">
          말랭이와 대화한 이력이 없어요.
        </div>
      ) : (
        <>
          {/* 목록 헤더: 날짜 / 주제 / 말한시간 / 대화시간 */}
          <div className="mb-2 flex w-full items-center border-b border-[#D5D2DE] px-0 py-4 ">
            <div className="flex min-w-20 flex-col items-center  text-sm text-[#6A667A]">
              날짜
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between  gap-2">
              <div className="flex-1 text-sm text-[#6A667A]">주제</div>
              <div className="flex shrink-0 items-center gap-1 text-sm text-[#6A667A]">
                말한시간 / 대화시간
              </div>
            </div>
          </div>
          <div
            ref={scrollContainerRef}
            className="left-0 flex min-h-112.5 w-full flex-col items-start justify-start overflow-y-auto pr-2"
          >
            {visibleSessions.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedSession(item);
                  setShowDetailPopup(true);
                }}
                className="hover:bg-white-50 flex w-full cursor-pointer items-center gap-4 border-b border-[#D5D2DE] px-0 py-4 transition-all"
              >
                {/* 날짜 */}
                <div className="flex min-w-20 flex-col items-center justify-center text-sm text-[#6A667A]">
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
                모든 데이터를 불러왔습니다 (조회된 데이터: {allSessions.length}건 / 페이지:{" "}
                {displayPage})
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <AuthGuard>
      <SplitViewLayout
        leftChildren={leftContent}
        rightChildren={rightContent}
        showHeader={false} //{!showNicknamePopup && !showDetailPopup}
        maxWidth="md:max-w-7xl"
        leftColSpan={4}
        rightColSpan={8}
        glassClassName="p-6 md:p-10"
        glassMaxWidth="max-w-full md:max-w-2xl lg:max-w-4xl"
      />

      {/* 대화 상세 팝업 */}
      {showDetailPopup && selectedSession && (
        <ChatDetailPopup session={selectedSession} onClose={() => setShowDetailPopup(false)} />
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
    </AuthGuard>
  );
}
