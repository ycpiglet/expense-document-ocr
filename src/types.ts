export type DocumentType = "receipt" | "invoice" | "tax_invoice" | "statement" | "unknown"

export type Extraction = {
  documentType: DocumentType
  merchant: string | null
  transactionDate: string | null
  totalAmount: number | null
  supplyAmount: number | null
  vatAmount: number | null
  approvalNumber: string | null
  cardLast4: string | null
  businessNumber: string | null
  currency: string | null
  rawText: string
  confidence: number
  parserVersion: string
}

export type EvaluationField = Exclude<keyof Extraction, "rawText" | "confidence" | "parserVersion">

export type Evaluation = {
  score: number
  matched: number
  evaluated: number
  fieldResults: Record<string, { expected: unknown; actual: unknown; matched: boolean }>
  errors: string[]
}
