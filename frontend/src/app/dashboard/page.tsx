"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { SplitViewLayout } from "@/shared/ui/SplitViewLayout";
import { Button } from "@/shared/ui";
import { useRouter } from "next/navigation";
import { useInfiniteChatSessions } from "@/features/chat/api/use-chat-sessions";
import { AuthGuard, useCurrentUser } from "@/features/auth";
import type { ChatHistoryItem } from "@/shared/types/chat";
import { ChatDetailPopup } from "./ChatDetailPopup";
import { NicknameChangePopup } from "./NicknameChangePopup";
import { usePopupStore } from "@/shared/lib/store";

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
  const { openPopup } = usePopupStore();

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
      page.items.map((session) => {
        const startDate = new Date(session.started_at);
        const dateString = `${startDate.getFullYear()}.${String(startDate.getMonth() + 1).padStart(2, "0")}.${String(startDate.getDate()).padStart(2, "0")}`;

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
          userDurationStr,
          totalDurationStr,
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
    const secs = Math.round(seconds % 60); // 초 단위 반올림
    return `${hours}시간 ${minutes}분 ${secs}초`;
  };

  const handleLogoutClick = () => {
    openPopup("logout");
  };

  const handleDeleteUserClick = () => {
    openPopup("deleteUser");
  };

  const handleNewChatClick = () => {
    // 공통 저장 정보 (회원 진입)
    localStorage.setItem("entryType", "member");
    if (currentUser?.login_id) {
      localStorage.setItem("loginId", currentUser.login_id);
    }

    if (allSessions.length > 0) {
      // 대화 기록이 있으면 마지막 세션 ID 저장 후 welcome-back으로 이동
      const lastSession = allSessions[0]; // 최신순 정렬 가정
      localStorage.setItem("chatSessionId", lastSession.id);
      router.push("/chat/welcome-back");
    } else {
      // 대화 기록이 없으면 시나리오 선택으로 이동
      // 이전 세션 ID가 남아있을 수 있으므로 제거
      localStorage.removeItem("chatSessionId");
      router.push("/scenario-select");
    }
  };

  // 왼쪽 컨텐츠
  const leftContent = (
    <div className="w-full max-w-[90%] md:max-w-sm tracking-tight">
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
        <Button variant="secondary" size="sm" onClick={handleLogoutClick}>
          로그아웃
        </Button>
      </div>
      <div className="mt-5 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm">말랭이와 함께한 시간</span>
          <span className="text-sm font-bold">
            {userProfile ? formatDuration(userProfile.totalDurationSec) : "0시간 0분 0초"}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm">내가 말한 시간</span>
          <span className="text-sm font-bold">
            {userProfile ? formatDuration(userProfile.userDurationSec) : "0시간 0분 0초"}
          </span>
        </div>
      </div>
      <Button
        variant="solid"
        size="lg"
        fullWidth
        className="mt-10"
        onClick={handleNewChatClick}
      >
        말랭이랑 새로운 대화를 해볼까요?
      </Button>

      {/* 회원탈퇴 버튼 추가 */}
      <div className="mt-4 flex justify-center hidden">
        <button
          onClick={handleDeleteUserClick}
          className="text-xs text-gray-400 underline hover:text-gray-600"
        >
          회원탈퇴
        </button>
      </div>
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
              <div className="flex min-w-20 flex-col items-left  text-sm text-[#6A667A]">
                날짜
              </div>
              <div className="flex min-w-0 flex-1 flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 text-sm text-[#6A667A]">주제</div>
                <div className="hidden md:flex shrink-0 items-left gap-2 text-sm text-[#6A667A]">
                  말한시간 / 대화시간
                </div>
              </div>
            </div>
            <div
              className="left-0 flex w-full flex-col items-start justify-start pr-2 md:h-[400px] md:overflow-y-auto"
            >
              {allSessions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedSession(item);
                    setShowDetailPopup(true);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 border-b border-[#D5D2DE] px-0 py-3 transition-all"
                >
                  {/* 날짜 */}
                  <div className="flex min-w-20 flex-col items-left justify-center text-sm text-primary">
                    {item.date}
                  </div>

                  {/* 제목과 시간 */}
                  <div className="flex min-w-0 flex-1 flex-col md:flex-row md:items-left gap-1 md:gap-2">
                    {/* 제목 */}
                    <div className="flex min-w-0 flex-1 flex-col items-start justify-center">
                      <p className="w-full truncate font-semibold text-[#1F1C2B]">{item.title}</p>
                    </div>

                    {/* 시간 */}
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="whitespace-nowrap text-sm font-normal text-[#6A667A] md:hidden">
                        {/* 모바일: 한 줄로 표시 */}
                        {item.duration}
                      </span>
                      <span className="hidden whitespace-nowrap text-sm font-normal text-[#6A667A] md:block">
                        {/* 데스크탑: 두 줄로 표시 */}
                        <div className="flex flex-col items-end">
                          <span>{item.userDurationStr}</span>
                          <span className="text-xs text-gray-400">/ {item.totalDurationStr}</span>
                        </div>
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
        maxWidth="md:max-w-6xl"
        leftColSpan={5}
        rightColSpan={7}
        //gap="md:gap-10"
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
    </AuthGuard>
  );
}
