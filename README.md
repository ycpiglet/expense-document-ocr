# Expense Document OCR

Notion 지출 관리대장에 첨부된 영수증·거래명세서·세금계산서 이미지를 Google Cloud Vision으로 OCR하고 빈 필드를 자동 입력하는 Notion Worker입니다.

## Capabilities

- `processExpenseDocument`: Notion 자동화가 호출하는 OCR 웹훅
- `parseExpenseOcrText`: AI 크레딧 없이 OCR 원문을 구조화
- `evaluateExpenseExtraction`: 정답과 추출 결과를 결정론적으로 비교

## Safety

- 기존 사용자 입력을 기본적으로 덮어쓰지 않습니다.
- 신뢰도가 낮으면 `확인 필요`로 분류합니다.
- 전체 카드번호·계좌번호를 저장하지 않습니다.
- 회계 처리는 사람이 최종 검토합니다.

## Setup

```bash
npm install
npm run check
npm test
```

필요한 Worker 환경 변수:

- `GOOGLE_CLOUD_API_KEY`
- `NOTION_API_TOKEN`

비밀값은 Git에 저장하지 않습니다.

Notion 관리대장 자동화에서 `증빙 자료` 변경을 트리거로 설정하고, `페이지 ID`를 `page_id` 변수로 정의해 `processExpenseDocument` 웹훅으로 전송합니다.

## Evaluation

```bash
npm run evaluate -- fixtures/sample-receipt.txt fixtures/sample-receipt.expected.json
```

정답을 모르는 필드는 expected JSON에서 제외합니다. 파서 변경 후 전체 픽스처를 재실행하고, 기준 정확도를 통과한 버전만 배포합니다.

## Notion resources

- Worker: https://app.notion.com/developers/workers/01a0ae4b-34c3-79bd-a127-8a8b1682443e
- 관리대장: https://app.notion.com/p/3de10b19e6bb80e185daf3fe1e74c059
- OCR 테스트·평가: https://app.notion.com/p/38ade2bbef42409ab63f4839675e4bba
- 검증 스킬: https://app.notion.com/p/afe487085dee4aafacc2cb86aea64f4d
