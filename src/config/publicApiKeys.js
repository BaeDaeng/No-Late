/**
 * Vite exposes every VITE_ variable to the browser bundle.
 * This module exists only because the project currently uses direct browser API calls.
 */
export const publicApiKeys = Object.freeze({
  kakaoJavaScriptKey: import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY || '',
})

export const hasPublicApiKeys = Boolean(publicApiKeys.kakaoJavaScriptKey)
