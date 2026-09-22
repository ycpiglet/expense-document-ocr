# expense-document-ocr

Notion 법인 지출 관리대장의 증빙 파일을 Google Cloud Vision으로 OCR 처리하고 빈 회계 필드를 자동 입력하는 Worker입니다.

## 다중 이미지 정책

- 한 거래에 최대 10개 증빙 파일을 첨부할 수 있습니다.
- 첨부 순서대로 OCR하고 `--- page N ---` 구분자로 원문을 결합합니다.
- 일부 파일이 실패해도 성공한 파일로 계속 처리하고 `OCR 상태`를 `확인 필요`로 설정합니다.
- 모든 파일이 실패한 경우에만 `실패` 처리합니다.
- 서로 다른 거래의 영수증은 한 항목에 합치지 않습니다.
- 기존 사용자 입력은 `overwrite_existing=true`가 아니면 덮어쓰지 않습니다.

## 검사

```bash
npm run check
npm test
```

파서 버전: `receipt-parser-v2`
