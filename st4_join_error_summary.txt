# ST4 Join Node Error 정리 (로그 요약)

- 발생 시간(현재 정리): `2026-03-31`
- 원문 메시지: `ST4 must depend on at least two prior steps to act as a join node.`
- 상태: 실행 계획(Execution Plan) 저장/검증 단계에서 즉시 실패.

## 1) 에러 요약

`ST4` 단계가 `step_kind=join`(혹은 `barrier`)로 간주되는 상태에서
`depends_on` 개수가 1개 이하이기 때문에 유효성 검사에서 차단된 상태입니다.

## 2) 근거 코드 위치

- `src/jakal_flow/orchestrator.py:1204-1206`  
  `step_kind == "join"` 이고 `len(step.depends_on) < 2`이면 위 예외를 발생.
- 동일 파일 `src/jakal_flow/orchestrator.py:1191-1192`  
  실행 순서상 `reduce_redundant_parallel_dependencies(...)`가 먼저 수행됨.
- 동일 파일 `src/jakal_flow/orchestrator.py:1210-1215`  
  `merge_from`이 direct dependencies를 벗어나면 추가 예외 발생.
- `src/jakal_flow/orchestrator.py:1195` (혹은 실제 실행 모드 진입부)  
  플래닝이 `parallel`일 때만 해당 검증 흐름이 적용됨.

## 3) 자주 보이는 원인 패턴

1. `ST4`를 `metadata.step_kind: "join"`으로 마킹했는데,
   실제 의존성으로 `depends_on`를 1개만 넣음.
2. `ST4`가 `["A", "B"]`처럼 입력되었는데,
   전처리 중 불필요 의존성 축약이 이뤄져 실질적으로 1개로 줄어든 경우.
3. `merge_from`이 존재하면 `depends_on`와 정확히 일치하지 않음.

## 4) 즉시 조치 (우선순위)

1. `STEP_KIND` 점검: `ST4`를 진짜 동기화(join) 목적이 아니라면
   `metadata.step_kind`를 제거/`"task"`로 둠.
2. join node로 유지해야 한다면 `depends_on`를 최소 2개로 맞춤.
3. `merge_from`이 있다면 최소 2개의 direct dependency와 동일하게 맞춤.
4. 사용 중인 `EXECUTION_PLAN.json`에서 `ST4` 블록을 추려 확인:
   - `step_id: "ST4"`
   - `depends_on`
   - `metadata.step_kind`
   - `metadata.merge_from`

## 5) 임시 검증 체크

- 아래 식으로 ST4 블록을 직접 확인하면 원인 분리가 빠릅니다.
- 대상 파일: 최신 `state/EXECUTION_PLAN.json`
- 확인 포인트:
  - `depends_on` 길이가 2 이상인지
  - `metadata.step_kind`가 `"join"`이면 `merge_from`도 2개 이상인지
  - `merge_from` 항목이 모두 `depends_on`에 포함되는지

## 6) 후속 작업 제안

원하시면 제가 다음 단계로, 현재 `ST4` 계획 JSON(또는 계획 생성 프롬프트)에서
실제 문제가 된 블록을 지정받아 **자동으로 정리된 로그 텍스트 + 정정 제안**까지 같이 생성해드리겠습니다.
