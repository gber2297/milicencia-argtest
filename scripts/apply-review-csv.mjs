import fs from "node:fs/promises"
import path from "node:path"

const INPUT_JSON = path.resolve("tmp/questions-from-pdf-with-correct.json")
const INPUT_CSV = path.resolve("tmp/questions-review.csv")
const OUTPUT_JSON = path.resolve("tmp/questions-final.json")

function parseCsvLine(line) {
  const result = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      i += 1
      continue
    }
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
      continue
    }
    current += char
  }
  result.push(current)
  return result
}

async function run() {
  const payload = JSON.parse(await fs.readFile(INPUT_JSON, "utf8"))
  const questions = payload.questions ?? []
  const csvRaw = await fs.readFile(INPUT_CSV, "utf8")
  const lines = csvRaw.split(/\r?\n/).filter(Boolean)
  if (lines.length <= 1) throw new Error("CSV de revision vacio")

  const header = parseCsvLine(lines[0])
  const pageIdx = header.indexOf("source_page")
  const numberIdx = header.indexOf("source_number")
  const reviewIdx = header.indexOf("review_correct_letter")
  if (pageIdx < 0 || numberIdx < 0 || reviewIdx < 0) {
    throw new Error("CSV invalido: faltan columnas clave")
  }

  const reviewMap = new Map()
  for (let i = 1; i < lines.length; i += 1) {
    const row = parseCsvLine(lines[i])
    const page = Number(row[pageIdx])
    const number = Number(row[numberIdx])
    const review = String(row[reviewIdx] ?? "").trim().toUpperCase()
    if (!page || !number || !review) continue
    if (!["A", "B", "C", "D"].includes(review)) continue
    reviewMap.set(`${page}-${number}`, review)
  }

  let reviewed = 0
  for (const question of questions) {
    const key = `${question.source_page}-${question.source_number}`
    const review = reviewMap.get(key)
    if (!review) continue

    question.correct_option_letter = review
    question.correct_option_detection = "manual-review-csv"
    question.options = (question.options ?? []).map((option) => ({
      ...option,
      is_correct: option.source_letter === review,
    }))
    reviewed += 1
  }

  payload.generated_at = new Date().toISOString()
  payload.manual_review_applied = reviewed

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(payload, null, 2), "utf8")
  console.log(`Revision aplicada a ${reviewed} preguntas.`)
  console.log(`Salida final: ${OUTPUT_JSON}`)
}

run().catch((error) => {
  console.error("Error aplicando revision CSV:", error)
  process.exitCode = 1
})
