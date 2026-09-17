type VisionResponse = { responses?: Array<{ fullTextAnnotation?: { text?: string }; textAnnotations?: Array<{ description?: string }>; error?: { message?: string } }> }

export async function extractTextFromImage(imageBytes: Uint8Array): Promise<string> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY
  if (!apiKey) throw new Error("GOOGLE_CLOUD_API_KEY is not configured")
  const endpoint = "https://vision.googleapis.com/v1/images:annotate?key=" + encodeURIComponent(apiKey)
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ requests: [{ image: { content: Buffer.from(imageBytes).toString("base64") }, features: [{ type: "DOCUMENT_TEXT_DETECTION" }], imageContext: { languageHints: ["ko", "en"] } }] }),
  })
  if (!response.ok) throw new Error(`Google Vision request failed: ${response.status} ${await response.text()}`)
  const data = await response.json() as VisionResponse
  const first = data.responses?.[0]
  if (first?.error?.message) throw new Error(`Google Vision error: ${first.error.message}`)
  const text = first?.fullTextAnnotation?.text ?? first?.textAnnotations?.[0]?.description ?? ""
  if (!text.trim()) throw new Error("No text detected in image")
  return text
}
