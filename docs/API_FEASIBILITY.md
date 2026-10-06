# API 연동 현황

| API | 사용 목적 | 호출 위치 | 상태 | 주의점 |
| --- | --- | --- | --- | --- |
| Kakao Local | 장소 검색·역지오코딩 | Supabase Edge Function | 사용 중 | REST 키는 서버 secret |
| Kakao Mobility Public Transit | 대중교통 경로·지도 선형 | Supabase Edge Function | 사용 중 | 노선별 버스 ID가 항상 제공되지는 않음 |
| Kakao Maps JavaScript | 지도 렌더링 | 브라우저 | 사용 중 | 등록된 Web 도메인에서만 동작 |
| 기상청 단기예보 | 강수 위험 보정 | Supabase Edge Function | 사용 중 | 발표 시각 전에는 직전 발표 자료 사용 |
| 서울 실시간 지하철 | 역 도착 메시지 | Supabase Edge Function | 사용 중 | 심야·운휴에는 빈 목록이 정상일 수 있음 |
| 서울 버스 위치 | 노선 차량 운행 확인 | Supabase Edge Function | 부분 사용 | 차량 위치는 분 단위 도착예정이 아님 |

경로, 날씨, 실시간 응답은 짧게 브라우저 세션에 캐시한다. 캐시는 비용/호출 수를 줄이기 위한 것이며 새로고침·세션 종료 뒤에는 사라질 수 있다.
