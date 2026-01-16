/**
 * 대화 세션/내역 관련 API 훅
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { ChatSession, ChatSessionDetail, ChatSessionsResponse } from "@/shared/types/chat";

/**
 * 대화 세션 목록 조회 (pagination 지원)
 * @param skip - 스킵할 항목 수 (기본값: 0)
 * @param limit - 가져올 항목 수 (기본값: 20)
 * @param userId - 사용자 ID 필터 (선택)
 */
export function useGetChatSessions(skip: number = 0, limit: number = 20, userId?: number) {
  return useQuery({
    queryKey: ["chatSessions", skip, limit, userId],
    queryFn: async () => {
      const params: Record<string, string> = {
        skip: skip.toString(),
        limit: limit.toString(),
      };

      if (userId !== undefined) {
        params.user_id = userId.toString();
      }

      // API 응답이 배열(현재)일 수도 있고, 객체(변경 후)일 수도 있음을 처리
      const response = await apiClient.get<ChatSession[] | ChatSessionsResponse>("/chat/sessions", {
        params,
      });

      // 배열인 경우 (현재 API 호환성 유지)
      if (Array.isArray(response)) {
        return {
          sessions: response,
          total: response.length, // 현재는 전체 개수를 알 수 없으므로 목록 개수로 대체
        };
      }

      // 객체인 경우 (변경된 API: { sessions: [], total: 100 })
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 대화 세션 목록 무한 스크롤 조회
 * @param limit - 페이지당 항목 수 (기본값: 10)
 * @param userId - 사용자 ID 필터 (선택)
 */
export function useInfiniteChatSessions(limit: number = 10, userId?: number) {
  return useInfiniteQuery({
    queryKey: ["chatSessions", "infinite", limit, userId],
    queryFn: async ({ pageParam = 0 }) => {
      const params: Record<string, string> = {
        skip: pageParam.toString(),
        limit: limit.toString(),
      };

      if (userId !== undefined) {
        params.user_id = userId.toString();
      }

      const response = await apiClient.get<ChatSession[] | ChatSessionsResponse>("/chat/sessions", {
        params,
      });

      // 배열인 경우 (현재 API)
      if (Array.isArray(response)) {
        return {
          sessions: response,
          total: null,
        };
      }

      // 객체인 경우 (미래 API)
      return response;
    },
    getNextPageParam: (lastPage, allPages) => {
      const currentSessions = lastPage.sessions;
      // 가져온 데이터가 limit보다 적으면 더 이상 데이터가 없는 것으로 간주
      if (currentSessions.length < limit) {
        return undefined;
      }
      // 다음 skip 값 계산 (현재까지 가져온 페이지 수 * limit)
      return allPages.length * limit;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5, // 5분
    enabled: !!userId, // userId가 있을 때만 실행 (선택 사항)
  });
}

/**
 * 특정 대화 세션 상세 조회 (메시지 포함)
 */
export function useGetChatSession(sessionId: string) {
  return useQuery({
    queryKey: ["chatSession", sessionId],
    queryFn: async () => {
      const data = await apiClient.get<ChatSessionDetail>(`/chat/sessions/${sessionId}`);
      return data;
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 가장 최근 대화 세션 조회
 */
export function useGetRecentSession() {
  return useQuery({
    queryKey: ["chatSession", "recent"],
    queryFn: async () => {
      return await apiClient.get<ChatSessionDetail | null>("/chat/recent");
    },
    staleTime: 1000 * 60, // 1분
  });
}

/**
 * 새 대화 세션 생성
 */
export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { mode: string; metadata?: Record<string, unknown> }) => {
      return await apiClient.post<ChatSession>("/chat/sessions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatSessions"] });
    },
  });
}

/**
 * 게스트 세션 사용자 연동 (Sync)
 */
export function useSyncGuestSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiClient.put<{ status: string; session_id: string }>(
        `/chat/sessions/${sessionId}/sync`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatSessions"] });
    },
  });
}

/**
 * 대화 세션 삭제
 */
export function useDeleteChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiClient.delete(`/chat/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatSessions"] });
    },
  });
}

/**
 * LLM 추천 답변(힌트) 조회
 */
export function useGetHints(sessionId: string) {
  return useQuery({
    queryKey: ["chatHints", sessionId],
    queryFn: async () => {
      const response = await apiClient.get<{ hints: string[]; session_id: string }>(
        `/chat/hints/${sessionId}`
      );
      return response.hints;
    },
    enabled: !!sessionId,
  });
}
