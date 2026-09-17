import { readFile } from "node:fs/promises"
import { parseOcrText } from "../src/parser.js"
import { evaluateExtraction } from "../src/evaluation.js"
import type { Extraction } from "../src/types.js"

const [ocrPath, expectedPath] = process.argv.slice(2)
if (!ocrPath || !expectedPath) { console.error("Usage: npm run evaluate -- <ocr-text-file> <expected-json-file>"); process.exit(1) }
const rawText = await readFile(ocrPath, "utf8")
const expected = JSON.parse(await readFile(expectedPath, "utf8")) as Partial<Extraction>
const actual = parseOcrText(rawText)
const evaluation = evaluateExtraction(expected, actual)
console.log(JSON.stringify({ actual, evaluation }, null, 2))
process.exit(evaluation.score === 1 ? 0 : 2)
