# 외부 API 가능성 검증

2026-10-06에 공식 문서를 확인하고 최소 실요청으로 CORS와 응답 형식을 검증했다. `src/services/api/fixtures.js`는 문서 기반 축소 fixture이며 키나 개인정보를 포함하지 않는다.

| API | 제공·사용 필드 | 미제공/미확인 | 실제 호출 | MVP | fallback |
| --- | --- | --- | --- | --- | --- |
| Kakao Local | 장소명, 주소, `x` 경도, `y` 위도 → `Place` | 실시간 교통 | 성공, CORS `*` | 예 | mock 장소 |
| ODsay | `totalTime`, 도보, 환승, `subPath`, 노선·정류장 → `RoutePlan` | 도보 상세 경로, 실시간 연착 분, 빠른 환승 칸 | 성공, CORS `*` | 예 | mock 경로 |
| 기상청 단기예보 | PTY·PCP → `WeatherCondition` | 개인 보행 상태 | 인증·CORS 성공. 현재 시스템 시간이 미래라 예보 행 없음 | 예 | 보수적 fallback |
| 서울 버스 위치 | 차량 위치, 정류소 도착, 구간 거리, 혼잡도 | 분 단위 도착예정·정확한 지연 분 | 노선 식별자가 있는 경로는 차량 위치 조회 구현. 실경로 버스 사례는 아직 수동 검증 필요 | 부분 | 기본 대기시간 |
| 서울 지하철 | 역명별 `barvlDt`, 도착 메시지 → `TransitArrival` | 정확한 연착 분 | 인증 성공. 비운행 시간대여서 빈 도착목록 | 예 | 기본 대기시간 |

## 호출 구조와 키

사용자 요청에 따라 현재는 브라우저 직접 호출 방식을 선택했다. `VITE_` 키는 브라우저 번들에 노출되며, API별 CORS·쿼터 제한을 실제 연결 전에 확인해야 한다. 공개 배포에는 HTTPS Cloud Function 또는 별도 API 프록시를 권장한다.

| Secret | 발급 위치 | 용도 |
| --- | --- | --- |
| `KAKAO_REST_API_KEY` | Kakao Developers 앱 키 | Local REST API |
| `ODSAY_API_KEY` | ODsay LAB | 대중교통 경로 |
| `KMA_SERVICE_KEY` | 공공데이터포털 기상청 단기예보 | 단기예보 |
| `SEOUL_SUBWAY_API_KEY` | 서울 열린데이터광장 | 실시간 지하철 |
| `SEOUL_BUS_SERVICE_KEY` | 공공데이터포털 서울 버스 위치정보 | 실시간 버스 |

서울 버스 위치 API 문서에 확인된 개발계정 일일 요청 한도는 1,000건이다. 그 밖의 제한은 발급 콘솔과 문서에서 배포 전에 재확인해야 한다. 동일 좌표·노선·시간대 요청에는 서버 측 단기 캐시가 필요하다.

## 출처

- [Kakao Local REST API](https://developers.kakao.com/docs/ko/local/dev-guide)
- [ODsay 대중교통 길찾기](https://lab.odsay.com/guide/releaseReference)
- [기상청 단기예보](https://www.data.go.kr/data/15084084/openapi.do)
- [서울 버스 위치 정보](https://www.data.go.kr/data/15000332/openapi.do)
