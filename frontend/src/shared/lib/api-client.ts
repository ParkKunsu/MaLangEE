import { config } from "./config";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions extends Omit<RequestInit, "method" | "body"> {
  params?: Record<string, string>;
}

interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
}

class ApiClient {
  private readonly baseUrl: string;
  private readonly getToken: () => string | null;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.getToken = config.getToken ?? (() => null);
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    // endpoint에서 시작하는 '/'를 제거하여 baseUrl과 올바르게 결합
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const fullUrl = `${this.baseUrl}/${cleanEndpoint}`;
    
    // 상대 경로인 경우 (baseUrl이 '/'로 시작하는 경우)
    // 브라우저 환경에서는 window.location.origin을 base로 사용
    let url: URL;
    if (this.baseUrl.startsWith('/') && typeof window !== 'undefined') {
      // 상대 경로인 경우 window.location.origin을 base로 사용
      url = new URL(fullUrl, window.location.origin);
    } else {
      // 절대 URL인 경우
      url = new URL(fullUrl);
    }

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return url.toString();
  }

  private buildHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers({
      "Content-Type": "application/json",
    });

    const token = this.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (customHeaders) {
      const custom = new Headers(customHeaders);
      custom.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    return headers;
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, headers: customHeaders, ...init } = options;

    const url = this.buildUrl(endpoint, params);
    const headers = this.buildHeaders(customHeaders);

    const response = await fetch(url, {
      ...init,
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // 401: 인증 오류 - 토큰이 없거나 유효하지 않음
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          // 현재 페이지가 이미 로그인 페이지가 아닌 경우에만 이동
          if (!window.location.pathname.startsWith("/auth/login")) {
            window.location.href = "/auth/login";
          }
        }
        const error = new Error(errorData.detail || "인증이 필요합니다. 다시 로그인해주세요.");
        Object.assign(error, { status: 401 });
        throw error;
      }

      // 400: 일반적인 에러 (예: 이미 존재하는 아이디)
      if (response.status === 400 && errorData.detail) {
        throw new Error(errorData.detail);
      }

      // 422: 유효성 검사 오류
      if (response.status === 422 && errorData.detail && Array.isArray(errorData.detail)) {
        const validationErrors = errorData.detail.map((err: { msg: string }) => err.msg).join(", ");
        throw new Error(validationErrors || "입력 정보를 확인해주세요");
      }

      // 기타 에러
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("GET", endpoint, undefined, options);
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>("POST", endpoint, data, options);
  }

  put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>("PUT", endpoint, data, options);
  }

  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>("PATCH", endpoint, data, options);
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("DELETE", endpoint, undefined, options);
  }
}

export const apiClient = new ApiClient({
  baseUrl: config.apiUrl,
  getToken: () => (typeof window !== "undefined" ? localStorage.getItem("access_token") : null),
});

export { ApiClient };
export type { ApiClientConfig, RequestOptions };
