export const MAX_EVIDENCE_FILES = 10

export function combineOcrPageTexts(pageTexts: string[]): string {
  return pageTexts
    .map((text, index) => `--- page ${index + 1} ---\n${text.trim()}`)
    .join("\n\n")
    .trim()
}

export async function extractMultipleImages(
  urls: string[],
  download: (url: string) => Promise<Uint8Array>,
  extract: (bytes: Uint8Array) => Promise<string>,
): Promise<{ rawText: string; processedFiles: number; failures: string[] }> {
  const pageTexts: string[] = []
  const failures: string[] = []

  for (let index = 0; index < urls.length; index += 1) {
    try {
      pageTexts.push(await extract(await download(urls[index])))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push(`파일 ${index + 1}: ${message}`)
    }
  }

  if (pageTexts.length === 0) {
    throw new Error(`모든 증빙 파일의 OCR 처리에 실패했습니다. ${failures.join(" | ")}`.slice(0, 1800))
  }

  return { rawText: combineOcrPageTexts(pageTexts), processedFiles: pageTexts.length, failures }
}
