import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
export const kakaoRestApiKey = defineSecret('KAKAO_REST_API_KEY')
export const odsayApiKey = defineSecret('ODSAY_API_KEY')
export const kmaServiceKey = defineSecret('KMA_SERVICE_KEY')
export const seoulSubwayApiKey = defineSecret('SEOUL_SUBWAY_API_KEY')
export const seoulBusServiceKey = defineSecret('SEOUL_BUS_SERVICE_KEY')
export const health = onRequest({ region: 'asia-northeast3' }, (_request, response) => response.json({ status: 'ok' }))
