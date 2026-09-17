import assert from "node:assert/strict"
import test from "node:test"
import { parseOcrText } from "../src/parser.js"
import { evaluateExtraction } from "../src/evaluation.js"

test("parses a Korean card receipt", () => {
  const actual = parseOcrText(`신한카드 매출전표\n상호: 커피체리 테스트상점\n사업자등록번호: 123-45-67890\n거래일시 2026-09-17 14:30\n공급가액 30,000\n부가세 3,000\n합계 33,000\n승인번호 12345678\n카드번호 ****-****-****-1234`)
  assert.equal(actual.documentType, "receipt")
  assert.equal(actual.merchant, "커피체리 테스트상점")
  assert.equal(actual.transactionDate, "2026-09-17")
  assert.equal(actual.totalAmount, 33000)
  assert.equal(actual.supplyAmount, 30000)
  assert.equal(actual.vatAmount, 3000)
  assert.equal(actual.approvalNumber, "12345678")
  assert.equal(actual.cardLast4, "1234")
  assert.equal(actual.businessNumber, "123-45-67890")
})

test("evaluates exact expected fields", () => {
  const result = evaluateExtraction({ merchant: "커피체리", totalAmount: 33000 }, { merchant: " 커피체리 ", totalAmount: 33000 })
  assert.equal(result.score, 1)
  assert.equal(result.errors.length, 0)
})
