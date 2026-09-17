import type { DocumentType, Extraction } from "./types.js"

export const PARSER_VERSION = "receipt-parser-v1"
const clean = (value: string) => value.replace(/\s+/g, " ").trim()
const digits = (value: string) => Number(value.replace(/[^0-9.-]/g, ""))

function labeledValue(lines: string[], labels: RegExp[]): string | null {
  for (const line of lines) for (const label of labels) {
    const match = line.match(label)
    if (match?.[1]) return clean(match[1])
  }
  return null
}

function parseAmount(lines: string[], labels: RegExp[]): number | null {
  const value = labeledValue(lines, labels)
  if (!value) return null
  const parsed = digits(value)
  return Number.isFinite(parsed) ? Math.abs(parsed) : null
}

function parseDate(text: string): string | null {
  const patterns = [
    /\b(20\d{2})[.\/-]\s*(\d{1,2})[.\/-]\s*(\d{1,2})\b/,
    /\b(\d{2})[.\/-]\s*(\d{1,2})[.\/-]\s*(\d{1,2})\b/,
    /(20\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (!match) continue
    let year = Number(match[1]); if (year < 100) year += 2000
    const month = Number(match[2]); const day = Number(match[3])
    if (month < 1 || month > 12 || day < 1 || day > 31) continue
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }
  return null
}

function detectDocumentType(text: string): DocumentType {
  if (/전자세금계산서|세금계산서/.test(text)) return "tax_invoice"
  if (/거래명세서|거래명세표/.test(text)) return "statement"
  if (/invoice|청구서/i.test(text)) return "invoice"
  if (/영수증|매출전표|승인번호|현금영수증/.test(text)) return "receipt"
  return "unknown"
}

function fallbackMerchant(lines: string[]): string | null {
  const ignored = /영수증|매출전표|세금계산서|거래명세|승인|사업자|전화|대표|주소|합계|금액|부가세|공급가액|카드|일시|날짜/i
  return lines.find((line) => line.length >= 2 && line.length <= 50 && !ignored.test(line) && !/^[-\d\s.,/:()]+$/.test(line)) ?? null
}

export function parseOcrText(rawText: string): Extraction {
  const lines = rawText.split(/\r?\n/).map(clean).filter(Boolean)
  const merchant = labeledValue(lines, [/(?:상호|가맹점명|공급자|업체명)\s*[:：]?\s*(.+)$/i]) ?? fallbackMerchant(lines)
  const totalAmount = parseAmount(lines, [/(?:총\s*금액|합\s*계|결제\s*금액|승인\s*금액|공급대가)\s*[:：]?\s*([₩￦\w\s,.-]*\d[\d,.-]*)/i])
  const supplyAmount = parseAmount(lines, [/(?:공급가액|공급\s*가액)\s*[:：]?\s*([₩￦\w\s,.-]*\d[\d,.-]*)/i])
  const vatAmount = parseAmount(lines, [/(?:부가세|부가가치세|VAT)\s*[:：]?\s*([₩￦\w\s,.-]*\d[\d,.-]*)/i])
  const approvalNumber = labeledValue(lines, [/(?:승인번호|승인\s*No\.?|approval\s*(?:no|number))\s*[:：#]?\s*([A-Z0-9-]{4,})/i])
  const businessNumber = labeledValue(lines, [/(?:사업자등록번호|사업자번호)\s*[:：]?\s*(\d{3}[- ]?\d{2}[- ]?\d{5})/i])?.replace(/\s/g, "") ?? null
  const cardLast4 = labeledValue(lines, [/(?:카드번호|카드)\s*[:：]?\s*(?:[*Xx\d-]+[- ])?([0-9]{4})\b/i])
  const transactionDate = parseDate(rawText)
  const currency = /\bUSD\b|\$/i.test(rawText) ? "USD" : /\bCNY\b|RMB|¥/i.test(rawText) ? "CNY" : /\bJPY\b/i.test(rawText) ? "JPY" : /\bEUR\b|€/i.test(rawText) ? "EUR" : "KRW"
  const core = [merchant, transactionDate, totalAmount]
  const confidence = Number((core.filter((value) => value !== null).length / core.length).toFixed(2))
  return { documentType: detectDocumentType(rawText), merchant, transactionDate, totalAmount, supplyAmount, vatAmount, approvalNumber, cardLast4, businessNumber, currency, rawText, confidence, parserVersion: PARSER_VERSION }
}
