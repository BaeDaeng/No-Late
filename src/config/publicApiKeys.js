/**
 * Vite exposes every VITE_ variable to the browser bundle.
 * This module exists only because the project currently uses direct browser API calls.
 */
export const publicApiKeys = Object.freeze({
  kakaoRestApiKey: import.meta.env.VITE_KAKAO_REST_API_KEY || '',
  kakaoJavaScriptKey: import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY || '',
  odsayApiKey: import.meta.env.VITE_ODSAY_API_KEY || '',
  kmaServiceKey: import.meta.env.VITE_KMA_SERVICE_KEY || '',
  seoulSubwayApiKey: import.meta.env.VITE_SEOUL_SUBWAY_API_KEY || '',
  seoulBusServiceKey: import.meta.env.VITE_SEOUL_BUS_SERVICE_KEY || '',
})

export const hasPublicApiKeys = [publicApiKeys.kakaoRestApiKey, publicApiKeys.odsayApiKey].every(Boolean)
