/**
 * 구글 번역 API 연동 유틸리티
 * (참고: 실제 운영 환경에서는 API 키 보안을 위해 백엔드 프록시를 거치는 것이 좋습니다.)
 */

export async function translateToKorean(text: string): Promise<string> {
  if (!text || !text.trim()) return "";

  try {
    // Google Translate Free API (제한적 사용 가능)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Translation failed");
    
    const data = await response.json();
    
    // 응답 구조에서 번역된 텍스트 추출
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
    
    return "";
  } catch (error) {
    console.error("[Translation Error]", error);
    return ""; // 실패 시 빈 문자열 반환 (원본만 표시되도록)
  }
}
