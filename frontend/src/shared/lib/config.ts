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
  // 개발 환경에서는 Next.js proxy 사용하여 CORS 문제 해결
  get apiUrl(): string {
    if (process.env.NODE_ENV === 'development') {
      return this.apiBasePath; // /api/v1 (Next.js proxy 사용)
    }
    return `${this.apiBaseUrl}${this.apiBasePath}`;
  },
} as const;

export default config;

