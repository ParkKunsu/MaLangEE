"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { SplitViewLayout } from "@/shared/ui/SplitViewLayout";
import { Button, MalangEE, PopupLayout } from "@/shared/ui";
import { useRouter } from "next/navigation";
import { useInfiniteChatSessions } from "@/features/chat/api/use-chat-sessions";
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
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatHistoryItem | null>(null);
  const [showNicknamePopup, setShowNicknamePopup] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const { logout } = useAuth();

  // 사용자 정보 조회
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();

  // 무한 스크롤 쿼리 사용
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isSessionsLoading,
  } = useInfiniteChatSessions(ITEMS_PER_PAGE, currentUser?.id);

  // 전체 세션 데이터 플랫트닝
  const allSessions = useMemo<ChatHistoryItem[]>(() => {
    if (!data) return [];

    return data.pages.flatMap((page) =>
      page.sessions.map((session) => {
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
      })
    );
  }, [data]);

  // 전체 건수 (API가 total을 제공하는 경우 사용, 아니면 현재 로드된 개수)
  const totalCount = data?.pages[0]?.total ?? allSessions.length;

  // 사용자 프로필 계산 (현재 로드된 세션 데이터 기준)
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

  // Intersection Observer를 이용한 무한 스크롤 트리거
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}시간 ${minutes}분 ${secs}초`;
  };

  const handleLogoutClick = () => {
    setShowLogoutPopup(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutPopup(false);
    logout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutPopup(false);
  };

  // 왼쪽 컨텐츠
  const leftContent = (
    <div className="w-full max-w-sm tracking-tight">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{userProfile?.nickname || "닉네임"}</div>
          <Button
            variant="ghost"
            size="auto"
            onClick={() => setShowNicknamePopup(true)}
            className="h-8 w-8 rounded-full p-0 text-[#6A667A] hover:bg-transparent hover:text-[#5F51D9]"
            aria-label="닉네임 변경"
          >
            <Pencil size={16} stroke="currentColor" />
          </Button>
        </div>
        <Button variant="secondary" size="auto" onClick={handleLogoutClick}>
          로그아웃
        </Button>
      </div>
      <div className="mt-4 space-y-1">
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
    <div className="flex w-full flex-1 flex-col min-h-0 tracking-tight">
      {/* 제목 */}
      <div className="mb-4 mt-0 flex w-full justify-start">
        <h2 className="text-2xl font-bold text-[#1F1C2B]">대화 내역</h2>
      </div>
      {/* 대화 목록 */}

      <div className="flex w-full flex-1 flex-col min-h-0">
      {allSessions.length === 0 && isInitialLoading ? (
        <div className="flex w-full flex-1 items-center justify-center">
          <div className="border-3 h-8 w-8 animate-spin rounded-full border-[#5F51D9] border-t-transparent"></div>
        </div>
      ) : allSessions.length === 0 ? (
        <div className="flex w-full flex-1 items-center justify-center text-xl text-gray-500">
          말랭이와 대화한 이력이 없어요.
        </div>
      ) : (
        <>
          {/* 목록 헤더: 날짜 / 주제 / 말한시간 / 대화시간 */}
          <div className="mb-2 flex w-full items-center border-b border-[#D5D2DE] px-0 py-4 ">
            <div className="flex min-w-20 flex-col items-center  text-sm text-[#6A667A]">
              날짜
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <div className="flex-1 text-sm text-[#6A667A]">주제</div>
              <div className="flex shrink-0 items-center gap-1 text-sm text-[#6A667A]">
                말한시간 / 대화시간
              </div>
            </div>

          </div>
          <div
            className="left-0 flex w-full h-100 flex-col items-start justify-start overflow-y-auto pr-2"
          >
            {allSessions.map((item) => (
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
                    <p className="w-full truncate font-semibold text-[#1F1C2B]">{item.title}</p>
                  </div>

                  {/* 시간 */}
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="whitespace-nowrap text-sm font-normal text-[#6A667A]">
                      {item.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* 로딩 트리거 및 스피너 */}
            {hasNextPage && (
              <div ref={loadMoreRef} className="flex w-full items-center justify-center py-4 min-h-5">
                {isFetchingNextPage && (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#5F51D9] border-t-transparent"></div>
                )}
              </div>
            )}

            {/* 데이터가 없거나 모두 로드됨 */}
            {!hasNextPage && allSessions.length > 0 && (
              <div className="flex w-full items-center justify-center py-4 text-xs text-gray-500">
                모든 데이터를 불러왔습니다 (전체: {totalCount}건 / 조회: {allSessions.length}건)
              </div>
            )}
          </div>
        </>
      )}
      </div>
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
          }}
        />
      )}

      {/* 로그아웃 확인 팝업 */}
      {showLogoutPopup && (
        <PopupLayout onClose={handleLogoutCancel} showCloseButton={false} maxWidth="sm">
          <div className="flex flex-col items-center gap-6 py-2">
            <MalangEE status="humm" size={120} />
            <div className="text-xl font-bold text-[#1F1C2B]">정말 로그아웃 하실건가요?</div>
            <div className="flex w-full gap-3">
              <Button
                variant="outline-purple"
                size="md"
                fullWidth
                onClick={handleLogoutCancel}
              >
                닫기
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleLogoutConfirm}
              >
                로그아웃
              </Button>
            </div>
          </div>
        </PopupLayout>
      )}
    </AuthGuard>
  );
}
