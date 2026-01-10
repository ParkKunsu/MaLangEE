/**
 * 대화 세션/내역 관련 API 훅
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import type { ChatSession } from "@/shared/types/chat";

/**
 * 대화 세션 목록 조회 (pagination 지원)
 * @param skip - 스킵할 항목 수 (기본값: 0)
 * @param limit - 가져올 항목 수 (기본값: 20)
 */
export function useGetChatSessions(skip: number = 0, limit: number = 20) {
  return useQuery({
    queryKey: ["chatSessions", skip, limit],
    queryFn: async () => {
      const data = await apiClient.get<ChatSession[]>("/chat/sessions", {
        params: {
          skip: skip.toString(),
          limit: limit.toString(),
        },
      });
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 특정 대화 세션 상세 조회
 */
export function useGetChatSession(sessionId: string) {
  return useQuery({
    queryKey: ["chatSession", sessionId],
    queryFn: async () => {
      const data = await apiClient.get<ChatSession>(`/chat/sessions/${sessionId}`);
      return data;
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

