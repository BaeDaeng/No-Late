# 배포·운영 확인 목록

- [x] GitHub `main`에 소스가 반영됨
- [x] Vercel Production 환경 변수: Supabase URL, publishable key, Kakao JavaScript key
- [x] Supabase Edge Function secret: Kakao REST, 기상청, 서울 지하철, 서울 버스
- [x] Supabase 익명 로그인과 Edge Function JWT 검증 활성화
- [x] Supabase 테이블 RLS: 설정/저장 결과는 소유자만, 공유 결과는 만료 전 읽기 가능
- [x] 모바일/데스크톱 지도 및 경로 카드 레이아웃 구현
- [x] 린트·단위 테스트·프로덕션 빌드 실행
- [ ] 운영 도메인을 Kakao Developers Web 플랫폼에 추가했다면 해당 도메인에서 지도/장소 검색을 수동 확인
- [ ] 제공 예정인 지하철 시간표 데이터의 평일/휴일·방향·역명 규칙 확인
