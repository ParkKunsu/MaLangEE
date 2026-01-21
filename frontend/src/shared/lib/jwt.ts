/**
 * JWT 토큰 유틸리티
 */

interface JWTPayload {
  sub: string; // 사용자 ID
  exp: number; // 만료 시간 (Unix timestamp)
  [key: string]: unknown;
}

/**
 * JWT 토큰 디코드 (검증 없이 payload만 추출)
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('[JWT] Decode error:', error);
    return null;
  }
};

/**
 * 토큰 만료 여부 확인
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
};

/**
 * 토큰 만료까지 남은 시간 (초)
 */
export const getTokenExpiresIn = (token: string): number => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return 0;

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = payload.exp - now;
  return Math.max(0, expiresIn);
};

/**
 * 토큰 만료 시간 (Date 객체)
 */
export const getTokenExpirationDate = (token: string): Date | null => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return null;

  return new Date(payload.exp * 1000);
};

/**
 * 토큰이 곧 만료되는지 확인 (기본: 5분 이내)
 */
export const isTokenExpiringSoon = (token: string, thresholdSeconds: number = 300): boolean => {
  const expiresIn = getTokenExpiresIn(token);
  return expiresIn > 0 && expiresIn < thresholdSeconds;
};
