# 기술 결정

- JavaScript와 React/Vite를 유지하고 상태 관리 라이브러리는 추가하지 않는다.
- Tailwind CSS v4는 Vite 플러그인으로 통합했다.
- Firebase는 웹 설정과 Firestore 용도로 유지한다. 사용자 요청에 따라 외부 API 키도 `VITE_` 환경변수로 브라우저에 노출하는 직접 호출 방식을 사용한다. 이 방식은 공개 배포에 부적합하다는 위험을 인지한 상태의 선택이다.
- 외부 응답은 `src/services/api/adapters.js`에서 내부 모델로 정규화한다.
- 키가 없는 동안 실제 데이터처럼 보이는 응답을 만들지 않고 화면에 mock 결과임을 표시한다.
- ODsay는 사용자 일일 제한 30회보다 낮은 25회로 클라이언트 안전 한도를 두고, 동일 좌표 조합은 sessionStorage에 30분간 캐시한다.
