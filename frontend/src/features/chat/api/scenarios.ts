import { apiClient } from "@/shared/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// 시나리오 타입 정의
export interface Scenario {
  id: string;
  title: string;
  description: string;
  place: string;
  partner: string;
  goal: string;
  level: number;
  category: string;
  created_at: string;
}

// 시나리오 생성 요청 타입
export interface CreateScenarioRequest {
  id: string;
  title: string;
  description: string;
  place: string;
  partner: string;
  goal: string;
  level: number;
  category: string;
  created_at?: string;
}

// 시나리오 통계 타입
export interface ScenarioAnalytics {
  // TODO: 실제 응답 구조에 맞춰 수정 필요 (예: 단어 TOP 20)
  [key: string]: unknown;
}

// API 키
export const scenarioKeys = {
  all: ["scenarios"] as const,
  lists: () => [...scenarioKeys.all, "list"] as const,
  detail: (id: string) => [...scenarioKeys.all, "detail", id] as const,
  analytics: (id: string) => [...scenarioKeys.all, "analytics", id] as const,
};

// API 함수
const scenarioApi = {
  // 모든 시나리오 목록 조회
  getScenarios: () => {
    return apiClient.get<Scenario[]>("/scenarios");
  },

  // 새로운 시나리오 등록
  createScenario: (data: CreateScenarioRequest) => {
    return apiClient.post<Scenario>("/scenarios", data);
  },

  // 특정 시나리오 상세 정보 조회
  getScenario: (id: string) => {
    return apiClient.get<Scenario>(`/scenarios/${id}`);
  },

  // 특정 시나리오 통계 조회
  getScenarioAnalytics: (id: string) => {
    return apiClient.get<ScenarioAnalytics>(`/analytics/scenario/${id}`);
  },
};

// Hooks

// 시나리오 목록 조회 Hook
export const useScenarios = () => {
  return useQuery({
    queryKey: scenarioKeys.lists(),
    queryFn: scenarioApi.getScenarios,
  });
};

// 시나리오 상세 조회 Hook
export const useScenario = (id: string) => {
  return useQuery({
    queryKey: scenarioKeys.detail(id),
    queryFn: () => scenarioApi.getScenario(id),
    enabled: !!id,
  });
};

// 시나리오 생성 Hook
export const useCreateScenario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scenarioApi.createScenario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.lists() });
    },
  });
};

// 시나리오 통계 조회 Hook
export const useScenarioAnalytics = (id: string) => {
  return useQuery({
    queryKey: scenarioKeys.analytics(id),
    queryFn: () => scenarioApi.getScenarioAnalytics(id),
    enabled: !!id,
  });
};
