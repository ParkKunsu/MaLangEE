/**
 * 디버그 유틸리티
 * 개발 환경에서만 콘솔 로그를 출력합니다.
 */

/**
 * 개발 환경 여부 체크
 */
export const isDev = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * 개발 환경에서만 console.log 출력
 */
export const debugLog = (...args: unknown[]): void => {
  if (isDev()) {
    console.log(...args);
  }
};

/**
 * 개발 환경에서만 console.error 출력
 */
export const debugError = (...args: unknown[]): void => {
  if (isDev()) {
    console.error(...args);
  }
};

/**
 * 개발 환경에서만 console.warn 출력
 */
export const debugWarn = (...args: unknown[]): void => {
  if (isDev()) {
    console.warn(...args);
  }
};

/**
 * 개발 환경에서만 console.info 출력
 */
export const debugInfo = (...args: unknown[]): void => {
  if (isDev()) {
    console.info(...args);
  }
};

/**
 * 프로덕션에서도 항상 출력 (중요한 에러나 경고)
 */
export const prodLog = (...args: unknown[]): void => {
  console.log(...args);
};

export const prodError = (...args: unknown[]): void => {
  console.error(...args);
};

export const prodWarn = (...args: unknown[]): void => {
  console.warn(...args);
};
