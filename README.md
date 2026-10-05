# No Late

서울권 대중교통 약속에 늦지 않도록 출발 마감 시간을 안내하는 React 웹 앱입니다. 현재 1~3단계의 개발 골격, 입력 검증, mock 결과와 외부 API 검증 구조가 구현되었습니다.

## 실행

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

`.env.example`을 `.env`로 복사해 Firebase 웹 설정을 채웁니다. 외부 API 키는 프런트엔드에 넣지 않으며 Functions Secret으로만 등록합니다. `VITE_USE_MOCK_API=true`이면 fixture 기반으로 동작합니다.

## 현재 상태

- `/`: 출발/도착, 약속, 보행 설정 입력 및 sessionStorage 복구
- `/result`: mock 기반 출발 시간 결과
- `functions/`: Cloud Functions 2nd gen Secret 및 health endpoint 골격
- 실제 외부 API 연결은 키 발급 뒤 다음 단계에서 진행
