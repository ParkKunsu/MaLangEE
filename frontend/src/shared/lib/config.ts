/**
 * 애플리케이션 공통 설정
 * 환경 변수와 기본값을 관리하는 파일
 */

export const config = {

  // 백엔드 API 기본 URL
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL,

  // API 기본 경로
  apiBasePath: "/api/v1",

  // 완전한 API URL (baseUrl + basePath)
  // NEXT_PUBLIC_USE_PROXY=true 설정 시 Next.js proxy 사용 (CORS 해결)
  // 기본값: 웹 서버로 직접 연결
  get apiUrl(): string {
    const useProxy = process.env.NEXT_PUBLIC_USE_PROXY === 'true';

    if (useProxy && process.env.NODE_ENV === 'development') {
      return this.apiBasePath; // /api/v1 (Next.js proxy 사용)
    }
    return `${this.apiBaseUrl}${this.apiBasePath}`;
  },
} as const;

export default config;

