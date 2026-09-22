import { Worker } from "@notionhq/workers"
import { j } from "@notionhq/workers/schema-builder"
import { parseOcrText } from "./parser.js"
import { evaluateExtraction } from "./evaluation.js"
import { applyExtraction, downloadFile, getEvidenceFileUrls, normalizePageId, updateOcrStatus } from "./notion.js"
import { extractTextFromImage } from "./googleVision.js"
import { extractMultipleImages, MAX_EVIDENCE_FILES } from "./multiImage.js"
import type { Extraction, OcrProcessingMetadata } from "./types.js"

const worker = new Worker()
export default worker

function pageReference(body: Record<string, unknown>): string {
  const nested = body.properties as Record<string, unknown> | undefined
  return String(body.page_id ?? body.pageId ?? body.page_url ?? body.url ?? body["페이지 ID"] ?? nested?.["페이지 ID"] ?? "")
}

worker.webhook("processExpenseDocument", {
  title: "Process expense document",
  description: "OCRs up to ten evidence images attached to one Notion expense record and fills empty accounting fields.",
  verify: () => ({ status: 202, body: "accepted" }),
  execute: async (events, { notion }) => {
    if (!process.env.NOTION_API_TOKEN) throw new Error("NOTION_API_TOKEN is not configured")
    for (const event of events) {
      const pageId = normalizePageId(pageReference(event.body))
      const overwriteExisting = event.body.overwrite_existing === true
      try {
        await updateOcrStatus(notion, pageId, "처리 중")
        const page = await notion.pages.retrieve({ page_id: pageId })
        const attachedUrls = getEvidenceFileUrls(page as never)
        const directUrl = typeof event.body.image_url === "string" ? event.body.image_url : null
        const allUrls = directUrl ? [directUrl] : attachedUrls
        if (allUrls.length === 0) throw new Error("증빙 자료에 OCR 처리할 이미지가 없습니다")

        const urls = allUrls.slice(0, MAX_EVIDENCE_FILES)
        const truncatedFiles = Math.max(0, allUrls.length - MAX_EVIDENCE_FILES)
        const result = await extractMultipleImages(urls, downloadFile, extractTextFromImage)
        const warnings = [...result.failures]
        if (truncatedFiles > 0) warnings.push(`최대 ${MAX_EVIDENCE_FILES}장만 처리하여 ${truncatedFiles}장을 제외했습니다`)
        const processing: OcrProcessingMetadata = {
          requestedFiles: allUrls.length,
          processedFiles: result.processedFiles,
          failedFiles: result.failures.length,
          truncatedFiles,
          warnings,
        }
        await applyExtraction(notion, pageId, parseOcrText(result.rawText), overwriteExisting, processing)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        await updateOcrStatus(notion, pageId, "실패", message.slice(0, 1800))
        throw error
      }
    }
  },
})

worker.tool("parseExpenseOcrText", {
  title: "Parse expense OCR text",
  description: "Deterministically parses Korean receipt, invoice, tax invoice, or statement OCR text without using AI credits.",
  schema: j.object({ rawText: j.string().describe("Raw OCR text") }),
  execute: ({ rawText }) => parseOcrText(rawText),
})

worker.tool("evaluateExpenseExtraction", {
  title: "Evaluate expense extraction",
  description: "Compares expected and actual OCR extraction JSON and returns deterministic field accuracy and errors.",
  schema: j.object({ expectedJson: j.string(), actualJson: j.string() }),
  execute: ({ expectedJson, actualJson }) => JSON.stringify(evaluateExtraction(JSON.parse(expectedJson) as Partial<Extraction>, JSON.parse(actualJson) as Partial<Extraction>)),
})
