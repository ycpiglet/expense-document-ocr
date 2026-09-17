import type { Evaluation, EvaluationField, Extraction } from "./types.js"

const FIELDS: EvaluationField[] = ["documentType", "merchant", "transactionDate", "totalAmount", "supplyAmount", "vatAmount", "approvalNumber", "cardLast4", "businessNumber", "currency"]
const normalize = (value: unknown): unknown => typeof value === "string" ? value.replace(/\s+/g, " ").trim().toLowerCase() : value

export function evaluateExtraction(expected: Partial<Extraction>, actual: Partial<Extraction>): Evaluation {
  const fieldResults: Evaluation["fieldResults"] = {}; const errors: string[] = []
  let matched = 0; let evaluated = 0
  for (const field of FIELDS) {
    if (!(field in expected)) continue
    evaluated += 1
    const isMatch = normalize(expected[field]) === normalize(actual[field])
    if (isMatch) matched += 1
    else errors.push(`${field}: expected=${String(expected[field])}, actual=${String(actual[field])}`)
    fieldResults[field] = { expected: expected[field], actual: actual[field], matched: isMatch }
  }
  return { score: evaluated === 0 ? 0 : Number((matched / evaluated).toFixed(4)), matched, evaluated, fieldResults, errors }
}
