# API 제한 사항과 시간표 확장

## 보안

- `KAKAO_REST_API_KEY`, `KMA_SERVICE_KEY`, `SEOUL_SUBWAY_API_KEY`, `SEOUL_BUS_SERVICE_KEY`는 Supabase Edge Function secret으로만 둔다.
- `VITE_`로 시작하는 값은 배포 JavaScript에 포함되므로 비밀값을 넣지 않는다.
- Vercel에는 공개 클라이언트 값만 설정한다. Edge Function secret을 Vercel에 복제하지 않는다.

## 실시간 정보의 의미

- 지하철 API의 `0분`/빈 초 값은 첫차 시각이 아니다. 해당 값은 도착 예정 시간이 없거나 메시지형 상태일 수 있어, 앱은 메시지를 보여 준다.
- 버스 위치 API는 차량 수·위치 정보이고 정류장 도착예정 API가 아니다. 경로가 안정적인 버스 노선 ID를 제공하지 않으면 버스 도착 분을 단정하지 않는다.
- 심야·막차 이후·장애 상황에서는 데이터가 비어 있을 수 있다. 이 경우 화면은 보수적 버퍼를 사용한다.

## 지하철 시간표 추가 방법

시간표 데이터는 다음 모양으로 정규화해 `findNextTimetableDeparture`에 전달한다.

```js
{
  stationName: '강남역',
  lineName: '2호선',
  direction: '외선',
  departureAt: '2026-10-08T05:32:00+09:00'
}
```

실제 데이터가 전달되면 원본 형식을 이 객체로 바꾸는 어댑터만 `src/services/timetable/subwayTimetable.js`에 추가한다. 출발/도착 시간표를 함께 받더라도 공휴일·평일 구분과 방향·역명 표준화 규칙을 명시한 뒤 연결한다.
