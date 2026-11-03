# NO LATE

서울권 대중교통 이동에서 약속에 맞춰 **언제 출발해야 하는지** 계산하는 React 웹 앱입니다. 출발지·목적지, 약속 시각, 현재 층, 키, 이동 페이스를 바탕으로 경로와 실시간 정보를 조합해 출발 마감과 예상 소요 시간을 안내합니다.

[서비스 바로가기](https://no-late.vercel.app/) · [API 제한 사항](docs/API_LIMITATIONS.md) · [프로젝트 명세](docs/PROJECT_SPEC.md)

## 주요 기능

| 영역 | 제공 기능 |
| --- | --- |
| 장소 선택 | Kakao 지도, 장소 검색, 현재 위치, 주변 장소 조회 |
| 경로 탐색 | Kakao 대중교통 경로 카드와 지도 선형 표시, 약속 시각 없이 경로만 조회 |
| 개인화 계산 | 현재 층·키·이동 페이스를 반영한 건물 퇴실 및 도보 시간 추정 |
| 출발 안내 | 안전/빠른 예상 시간, 출발 마감, 남은 시간, 위험도와 계산 근거 |
| 외부 정보 | 기상청 단기예보, 서울 지하철 실시간 도착, 서울 버스 위치 정보 반영 |
| 교통 조회 | 지하철 노선·역 정보, 버스 노선 검색·정류장·도착 정보 조회 |
| 계정 | 이메일 회원가입·로그인, 키·비밀번호 변경, 회원 탈퇴 |
| 회원 저장 | 출발지·도착지 저장 및 재사용, 즐겨찾는 버스 관리 |
| 공유·설치 | 24시간 만료 공유 링크, PWA 앱 셸과 오프라인 안내 |

로그인하지 않아도 길찾기를 이용할 수 있습니다. API 호출을 위해 Supabase 익명 세션을 생성하며, 사용자 설정 및 저장 경로는 회원 전용 RLS 정책으로 보호됩니다.

## 사용 흐름

1. 검색 또는 지도에서 출발지와 목적지를 선택합니다.
2. 약속 시각, 현재 층, 키, 이동 페이스를 입력합니다. 시간 없이 경로만 조회할 수도 있습니다.
3. 결과에서 경로별 소요 시간과 출발 안내, 계산에 사용한 정보를 확인합니다.
4. 필요하면 결과를 공유하거나, 로그인 후 출발지·목적지를 저장해 다시 사용합니다.
5. 지하철·버스 화면에서 별도로 교통 정보를 조회합니다.

## 기술 구성

| 계층 | 구성 |
| --- | --- |
| 프런트엔드 | React 19, JavaScript, Vite 8, Tailwind CSS 4 |
| 인증·데이터 | Supabase Auth, Postgres, RLS |
| 외부 API 중계 | Supabase Edge Function `api` |
| 지도·경로 | Kakao 지도 및 대중교통 API |
| 기상·교통 | 기상청, 서울 지하철·버스 API |
| 검사 | ESLint, Prettier, Vitest, Testing Library, jsdom |
| 배포 설정 | Vercel SPA rewrite, PWA 정적 리소스 |

브라우저는 Supabase Edge Function으로 외부 데이터 요청을 전달합니다. 프런트엔드의 `src/domain/`에는 퇴실·이동·날씨·도착 관련 계산을, `src/services/`에는 API 호출·캐시·저장 로직을 나눠 두었습니다.

## 로컬 실행

Node.js와 npm, 연결할 Supabase 프로젝트 및 외부 API 설정이 필요합니다.

```bash
git clone https://github.com/BaeDaeng/No-Late.git
cd No-Late
npm ci
```

[.env.example](.env.example)을 `.env`로 복사하고 공개 클라이언트 값을 채웁니다.

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_KAKAO_JAVASCRIPT_KEY=your_kakao_javascript_key
VITE_USE_MOCK_API=false
```

```bash
npm run dev
```

터미널에 표시된 개발 주소로 접속합니다. 환경 변수 변경 후에는 서버를 다시 시작합니다. Supabase와 외부 API가 준비되지 않으면 실제 검색·경로·저장 기능은 정상적으로 사용할 수 없습니다.

### Supabase 준비

1. Supabase 프로젝트에서 익명 로그인과 이메일 로그인을 설정합니다.
2. Auth의 사이트 URL과 리다이렉트 허용 주소에 개발·배포 주소를 등록합니다.
3. 아래 SQL 마이그레이션을 순서대로 적용합니다.
   - [초기 스키마](supabase/migrations/20261006000000_initial.sql)
   - [회원 전용 저장 정책](supabase/migrations/20261007013000_members_only_saved_data.sql)
4. [api Edge Function](supabase/functions/api/index.ts)을 배포하고 필요한 secrets를 설정합니다.
5. 프런트엔드에서 같은 프로젝트의 URL과 공개 키를 사용합니다.

저장소의 [config.toml](supabase/config.toml)은 익명 가입을 허용하고 이메일 가입 시 확인 메일을 필수로 하지 않는 설정입니다. 호스팅된 프로젝트의 Auth 설정도 실제 사용할 흐름에 맞춰 확인해야 합니다.

### API 키 설정 위치

| 변수 | 설정 위치 | 용도 |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | 프런트엔드 환경 변수 | Supabase 프로젝트 URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | 프런트엔드 환경 변수 | 공개 클라이언트 키 |
| `VITE_KAKAO_JAVASCRIPT_KEY` | 프런트엔드 환경 변수 | Kakao 지도 SDK |
| `KAKAO_REST_API_KEY` | Edge Function secret | 장소·좌표·대중교통 경로 요청 |
| `KMA_SERVICE_KEY` | Edge Function secret | 기상청 단기예보 |
| `SEOUL_SUBWAY_API_KEY` | Edge Function secret | 지하철 실시간 도착 |
| `SEOUL_SUBWAY_STATION_API_KEY` | Edge Function secret | 지하철 노선별 역 정보 |
| `SEOUL_BUS_SERVICE_KEY` | Edge Function secret | 버스 노선·정류장·위치·도착 정보 |

Kakao 지도 SDK에는 개발 주소와 운영 주소를 등록합니다. 외부 API의 이용 권한·할당량에 따라 조회 가능 여부가 달라집니다. `VITE_` 변수는 배포 JavaScript에 포함되므로 서버 비밀키를 넣지 않습니다. 서버 키는 Vercel 프런트엔드 변수에 복제하지 않고 Edge Function secrets에만 둡니다.

## 주요 경로

| 경로 | 화면 |
| --- | --- |
| `/` | 장소·이동 조건 입력 |
| `/result` | 저장된 입력을 사용한 경로·출발 안내 |
| `/share/:id` | 공유 결과 |
| `/subway` | 지하철 정보 |
| `/bus` | 버스 정보 |

## 프로젝트 구조

```text
src/
├── components/       # 지도·계정 등 공통 UI
├── config/           # 실시간 조회 제한 등 설정
├── domain/           # 퇴실·이동·날씨·교통 예측 계산과 테스트
├── features/         # 입력 및 기능별 로직
├── pages/            # 검색·결과·공유·교통 화면
├── services/         # 계정, API, 캐시, 시간표, 경로 저장
├── test/             # 테스트 초기 설정
└── supabase.js       # Supabase 클라이언트와 익명 세션
supabase/
├── functions/api/    # 외부 API 중계
└── migrations/       # 테이블 및 RLS 정책
public/               # PWA 등 정적 리소스
docs/                 # 명세, 설계 결정, API 제약
```

## 개발·검증 명령어

| 명령어 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | `dist/`에 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 로컬 확인 |
| `npm run lint` | ESLint 검사 |
| `npm test` | Vitest 전체 실행 |
| `npm run test:watch` | 테스트 감시 실행 |
| `npm run format` | Prettier로 파일 포맷 변경 |

테스트 실행 환경에서 워커 자원을 제한해야 할 때는 기존 실행 방식인 `npx vitest run --pool=vmThreads --maxWorkers=1`을 사용할 수 있습니다.

## 배포와 확인 항목

Vercel의 빌드 명령은 `npm run build`, 출력 디렉터리는 `dist`입니다. [vercel.json](vercel.json)에 SPA 경로 설정이 포함되어 있습니다.

- 프런트엔드 공개 환경 변수를 배포 환경에 설정하고 새 빌드를 실행합니다.
- Supabase 마이그레이션과 Edge Function은 프런트엔드 배포와 별도로 적용합니다.
- 지도 표시, 현재 위치, 장소 검색, 경로 결과, 회원 저장, 공유 링크를 실제 환경에서 확인합니다.
- PWA 앱 셸이 있어도 실시간 경로·날씨·교통 조회에는 네트워크 연결이 필요합니다.

## 데이터 해석과 현재 한계

- 출발 시각은 입력값과 외부 데이터에 따른 추정치입니다. 실시간 데이터가 비어 있거나 실패하면 보수적 버퍼와 안내를 사용합니다.
- 지하철 API의 `0분` 또는 빈 초 값을 첫차 시각으로 해석하지 않습니다.
- 경로 보정에 사용하는 버스 차량 위치는 정류장 도착예정 시간과 다릅니다. 별도 버스 조회 화면의 도착 정보와 구분합니다.
- 심야·막차 이후나 API 장애 시 정보가 없을 수 있습니다.
- 시간표 확장 방식은 [API 제한 사항](docs/API_LIMITATIONS.md)을 참고합니다.
- 별도 라이선스 파일은 현재 저장소에 없습니다.

## 관련 문서

- [프로젝트 명세](docs/PROJECT_SPEC.md)
- [설계 결정](docs/DECISIONS.md)
- [API 검토](docs/API_FEASIBILITY.md)
- [API 제한 사항](docs/API_LIMITATIONS.md)
- [최종 확인 목록](docs/FINAL_CHECKLIST.md)
