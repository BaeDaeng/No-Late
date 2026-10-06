# NO LATE

서울권 대중교통 약속에 맞춰 **안전 출발 마감 시간**을 계산하는 React 웹 앱입니다. 지도에서 출발지와 목적지를 고르고, 약속 시각·현재 층·키·이동 페이스를 입력하면 Kakao 대중교통 경로와 실시간 정보를 조합해 출발 안내를 만듭니다.

배포 주소: https://no-late.vercel.app/

## 현재 제공 기능

- Kakao 지도, 장소 검색, 현재 위치 기반 출발지 설정
- Kakao Mobility 대중교통 경로 카드와 지도 선형 표시
- 현재 층·키·느긋하게/평범하게/서둘러서 입력을 반영한 건물 퇴실·도보 추정
- 기상청 단기예보, 서울 지하철 실시간 도착, 서울 버스 차량 위치의 보수적 반영
- 안전/빠른 예상 시간, 출발 마감, 남은 시간, 위험도와 계산 근거
- 24시간 만료 공유 링크 및 익명 사용자별 결과 저장
- 설치 가능한 PWA 기본 앱 셸과 오프라인 안내

## 기술 구성

- Frontend: React, Vite, Tailwind CSS
- Backend: Supabase Edge Function (`api`), Supabase Auth 익명 세션, Postgres/RLS
- Hosting: Vercel (GitHub `main` 브랜치 자동 배포)

## 로컬 실행

```bash
npm install
npm run dev
npm run lint
npx vitest run --pool=vmThreads --maxWorkers=1
npm run build
```

`.env.example`을 복사해 `.env`를 만들고 아래 공개 클라이언트 값만 넣습니다.

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_KAKAO_JAVASCRIPT_KEY=
```

나머지 API 비밀키는 브라우저나 Git에 넣지 않습니다. Supabase Edge Function secrets에만 등록합니다. 자세한 키 목록, 제약, 시간표 확장 방식은 [API 제한 사항](docs/API_LIMITATIONS.md)을 확인하세요.

## 검증 기준

- 지도 SDK 도메인에는 개발 주소와 운영 주소를 모두 등록합니다.
- Vercel 환경 변수는 `Production`에 설정한 뒤 반드시 새 배포를 실행합니다.
- Edge Function은 JWT가 있어야 호출되며, 앱은 익명 세션을 자동 생성합니다.
- 실시간 정보가 비어 있거나 실패하면 실제 도착 시각을 꾸며 내지 않고, 보수적 안내를 표시합니다.
