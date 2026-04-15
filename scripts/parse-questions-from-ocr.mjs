import fs from "node:fs/promises"
import path from "node:path"

const OCR_DIR = path.resolve("tmp/cuestionario-ocr")
const OUTPUT_PATH = path.resolve("tmp/questions-parsed.json")

function normalizeLine(line) {
  return line
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function classifyDifficulty({ questionText, explanation }) {
  const full = `${questionText} ${explanation ?? ""}`.toLowerCase()
  let points = 0
  if (questionText.length > 130) points += 2
  if (questionText.length > 90) points += 1
  if (/(excepto|salvo|siempre|nunca|prioridad|interseccion|adelantamiento|siniestro|alcoholemia)/i.test(full)) points += 2
  if (/(doble|triple|combinacion|distancia de frenado|condiciones climaticas)/i.test(full)) points += 1

  if (points >= 4) return "hard"
  if (points >= 2) return "medium"
  return "easy"
}

function detectCorrectOption(block) {
  const patterns = [
    /respuesta\s+correcta\s*[:\-]\s*([ABCD])/i,
    /correcta\s*[:\-]\s*([ABCD])/i,
    /opcion\s+correcta\s*[:\-]\s*([ABCD])/i,
    /rta\.?\s*[:\-]\s*([ABCD])/i,
  ]
  for (const pattern of patterns) {
    const match = block.match(pattern)
    if (match) return match[1].toUpperCase()
  }
  return null
}

function detectExplanation(block) {
  const match = block.match(/(?:explicacion|fundamento|justificacion)\s*[:\-]\s*([\s\S]{10,})/i)
  if (!match) return null
  return normalizeLine(match[1]).slice(0, 1200)
}

function parseQuestionBlocks(text) {
  const blocks = []
  const splitRegex = /(?:^|\n)\s*(\d{1,4})[\)\.\-]\s+/g

  let match
  const starts = []
  while ((match = splitRegex.exec(text)) !== null) {
    starts.push({ number: Number(match[1]), index: match.index })
  }

  if (!starts.length) return blocks

  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i]
    const end = starts[i + 1]?.index ?? text.length
    const block = text.slice(start.index, end).trim()
    blocks.push({ number: start.number, block })
  }

  return blocks
}

function parseOptions(block) {
  const optionRegex = /(?:^|\n)\s*([ABCD])[\)\.\-:]\s+([\s\S]*?)(?=(?:\n\s*[ABCD][\)\.\-:]\s+)|$)/g
  const options = []
  let match
  while ((match = optionRegex.exec(block)) !== null) {
    options.push({
      letter: match[1].toUpperCase(),
      text: normalizeLine(match[2]),
    })
  }
  return options
}

function parseQuestion({ number, block, pageNo, imageFile }) {
  const options = parseOptions(block)
  if (options.length !== 4) return null

  const firstOptionIndex = block.search(/(?:^|\n)\s*[ABCD][\)\.\-:]\s+/)
  if (firstOptionIndex < 0) return null

  const questionRaw = block
    .slice(0, firstOptionIndex)
    .replace(/^\s*\d{1,4}[\)\.\-]\s*/i, "")
  const questionText = normalizeLine(questionRaw)
  if (questionText.length < 12) return null

  const correctLetter = detectCorrectOption(block) ?? "A"
  const correctOptionIndex = options.findIndex((option) => option.letter === correctLetter)
  if (correctOptionIndex < 0) return null

  const explanation = detectExplanation(block)
  const difficulty = classifyDifficulty({ questionText, explanation })

  return {
    source_question_number: number,
    question_text: questionText,
    explanation: explanation ?? "Sin explicacion adicional en fuente OCR.",
    difficulty,
    options: options.map((option, index) => ({
      option_text: option.text,
      is_correct: index === correctOptionIndex,
    })),
    source_page_no: pageNo,
    source_image_file: imageFile,
  }
}

async function run() {
  const files = await fs.readdir(OCR_DIR)
  const txtFiles = files.filter((file) => file.endsWith(".txt") && file !== "all-pages.txt")
  if (!txtFiles.length) throw new Error("No hay archivos OCR .txt. Ejecuta primero ocr:cuestionario")

  const parsed = []
  const rejected = []

  for (const txtFile of txtFiles) {
    const pageNoMatch = txtFile.match(/page-\d+-([a-z0-9]+)\.txt$/i)
    const pageNo = pageNoMatch?.[1] ?? null
    const text = await fs.readFile(path.join(OCR_DIR, txtFile), "utf8")
    const blocks = parseQuestionBlocks(text)

    for (const blockInfo of blocks) {
      const question = parseQuestion({
        ...blockInfo,
        pageNo,
        imageFile: txtFile.replace(/\.txt$/i, ".png"),
      })
      if (question) {
        parsed.push(question)
      } else {
        rejected.push({
          pageNo,
          sourceQuestionNumber: blockInfo.number,
          reason: "No cumple formato esperado (4 opciones A-D y correcta detectable)",
        })
      }
    }
  }

  const dedupMap = new Map()
  for (const question of parsed) {
    const key = question.question_text.toLowerCase()
    if (!dedupMap.has(key)) dedupMap.set(key, question)
  }
  const deduped = [...dedupMap.values()]

  const payload = {
    generated_at: new Date().toISOString(),
    total_parsed: parsed.length,
    total_unique: deduped.length,
    total_rejected: rejected.length,
    questions: deduped,
    rejected,
  }

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf8")
  console.log(`Parse finalizado. Preguntas unicas: ${deduped.length}`)
  console.log(`Descartadas: ${rejected.length}`)
  console.log(`Salida: ${OUTPUT_PATH}`)
}

run().catch((error) => {
  console.error("Error parseando OCR:", error)
  process.exitCode = 1
})
